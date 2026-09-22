import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import {
  Users, Plus, Search, Building2,
  PhoneCall, Mail, DollarSign, Clock, ArrowRight, Target,
  TrendingUp, Calendar, X, CheckCircle2, FileText, Receipt, ShoppingBag,
  BarChart3, ChevronDown, ChevronRight, Filter
} from 'lucide-react';

// CRM Pipeline stages matching exact business flow from spec
const crmStages = [
  { id: 'LEAD', label: 'Lead', color: '#94A3B8', description: 'Initial contact from sales/marketing' },
  { id: 'DEMO_SCHEDULED', label: 'Demo Scheduled', color: '#1E40AF', description: 'Platform demo booked with prospect' },
  { id: 'DOCS_RECEIVED', label: 'Documents Received', color: '#B45309', description: 'KYC documents and Drug License submitted' },
  { id: 'COMPLIANCE_PENDING', label: 'Compliance Pending', color: '#7C3AED', description: 'Under CDSCO / WHO-GMP compliance review' },
  { id: 'APPROVED_CUSTOMER', label: 'Approved Customer', color: '#047857', description: 'Compliance cleared — account provisioned' },
  { id: 'LIVE_CUSTOMER', label: 'Live Customer', color: '#0F172A', description: 'Active procurement on platform' },
];

const pipelineDeals = [
  { company: 'Apex Pharma Labs Ltd', city: 'Hyderabad', stage: 'LIVE_CUSTOMER', owner: 'Dr. Vikram Sethi', expectedRevenue: 4850000, closingDate: '15-Aug-2026', lastActivity: 'Today, 2:30 PM', priority: 'High', progressPct: 100 },
  { company: 'MedLife Hospital Chain', city: 'Delhi NCR', stage: 'APPROVED_CUSTOMER', owner: 'Key Account Exec', expectedRevenue: 6500000, closingDate: '20-Aug-2026', lastActivity: 'Yesterday', priority: 'High', progressPct: 83 },
  { company: 'BioCure Healthcare', city: 'Mumbai', stage: 'COMPLIANCE_PENDING', owner: 'Compliance Desk', expectedRevenue: 12000000, closingDate: '01-Sep-2026', lastActivity: '3 days ago', priority: 'Normal', progressPct: 67 },
  { company: 'CureMax Networks', city: 'Pune', stage: 'DOCS_RECEIVED', owner: 'Sales Associate', expectedRevenue: 3800000, closingDate: '05-Sep-2026', lastActivity: '1 day ago', priority: 'Normal', progressPct: 50 },
  { company: 'PharmaCo Distributors', city: 'Ahmedabad', stage: 'DEMO_SCHEDULED', owner: 'Lead Gen Rep', expectedRevenue: 1200000, closingDate: '30-Aug-2026', lastActivity: '4 days ago', priority: 'Normal', progressPct: 33 },
  { company: 'SunTech MedSupply', city: 'Chennai', stage: 'LEAD', owner: 'Sales Associate', expectedRevenue: 2200000, closingDate: '18-Sep-2026', lastActivity: '2 days ago', priority: 'Normal', progressPct: 17 },
];

const activityTimeline = [
  { title: 'Q3 Sourcing Review — Apex Pharma', date: 'Today, 2:30 PM', owner: 'Dr. Vikram Sethi', note: 'API volume expansion discussion for 2027 contract', type: 'MEETING' },
  { title: 'CoA Certificate Validation — SunBio Batch #PAR-09', date: 'Today, 4:00 PM', owner: 'QA Manager', note: 'HPLC purity report validation completed', type: 'COMPLIANCE' },
  { title: 'Contract Renewal Call — MedLife Hospital', date: 'Tomorrow, 11:00 AM', owner: 'Procurement Head', note: '6-month bulk supply price negotiation', type: 'CALL' },
  { title: 'Onboarding Meeting — PharmaCo Dist.', date: 'Aug 7, 3:00 PM', owner: 'Sales Associate', note: 'Form 20B/21B license verification & credit terms', type: 'MEETING' },
  { title: 'Document Submission — BioCure Healthcare', date: 'Aug 8, 10:00 AM', owner: 'Compliance Officer', note: 'Drug license and GST registration for KYC review', type: 'COMPLIANCE' },
];

const revenueForecast = [
  { quarter: 'Q2 2026 (Actual)', value: 38500000, target: 35000000 },
  { quarter: 'Q3 2026 (Forecast)', value: 52000000, target: 50000000 },
  { quarter: 'Q4 2026 (Forecast)', value: 68000000, target: 65000000 },
];

const getStageConfig = (stageId: string) => crmStages.find(s => s.id === stageId) || crmStages[0];

const StageDot: React.FC<{ stageId: string }> = ({ stageId }) => {
  const config = getStageConfig(stageId);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.color, display: 'inline-block', flexShrink: 0 }} />
      {config.label}
    </span>
  );
};

export const CustomerModule: React.FC = () => {
  const { customers, rfqs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'DIRECTORY' | 'TIMELINE' | 'FORECAST'>('PIPELINE');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerTab, setDrawerTab] = useState<'OVERVIEW' | 'MEETINGS' | 'RFQS' | 'ORDERS' | 'HISTORY'>('OVERVIEW');

  const totalPipelineValue = pipelineDeals.reduce((acc, d) => acc + d.expectedRevenue, 0);
  const wonValue = pipelineDeals.filter(d => d.stage === 'LIVE_CUSTOMER' || d.stage === 'APPROVED_CUSTOMER').reduce((a, d) => a + d.expectedRevenue, 0);

  // Conversion funnel counts per stage
  const funnelCounts = crmStages.map(s => ({
    ...s,
    count: pipelineDeals.filter(d => d.stage === s.id).length,
    value: pipelineDeals.filter(d => d.stage === s.id).reduce((a, d) => a + d.expectedRevenue, 0),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar ──────────────────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Dashboard / CRM Workspace</div>
            <div className="ent-page-title" style={{ margin: 0 }}>Sales Pipeline & Account Intelligence</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button className="ent-btn-secondary">
            <Calendar size={14} /> Schedule Meeting
          </button>
          <button className="ent-btn-primary" onClick={() => alert('New lead record created.')}>
            <Plus size={14} /> Create Lead / Account
          </button>
        </div>
      </div>

      {/* ── KPI Strip ─────────────────────────────────────── */}
      <div className="ent-kpi-strip">
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Total Pipeline Value</div>
          <div className="kpi-value ent-mono">₹{(totalPipelineValue / 10000000).toFixed(1)}Cr</div>
          <div className="kpi-sub">{pipelineDeals.length} Active Opportunities</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Contracted Revenue</div>
          <div className="kpi-value ent-mono" style={{ color: '#047857' }}>₹{(wonValue / 10000000).toFixed(1)}Cr</div>
          <div className="kpi-sub">Live + Approved customers</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Win Conversion Rate</div>
          <div className="kpi-value" style={{ color: '#047857' }}>68.4%</div>
          <div className="kpi-sub">+4.2% vs prior quarter</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Active Customer Accounts</div>
          <div className="kpi-value">{customers.length}</div>
          <div className="kpi-sub">CDSCO License Verified</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Avg Deal Cycle</div>
          <div className="kpi-value">14.2 Days</div>
          <div className="kpi-sub">From RFQ to PO Execution</div>
        </div>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Compliance Pending</div>
          <div className="kpi-value" style={{ color: '#B45309' }}>
            {pipelineDeals.filter(d => d.stage === 'COMPLIANCE_PENDING').length}
          </div>
          <div className="kpi-sub">Awaiting CDSCO review</div>
        </div>
      </div>

      {/* ── Segmented Tab Control ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 3, width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'PIPELINE', label: 'Deal Pipeline Grid' },
          { id: 'DIRECTORY', label: 'Customer Directory' },
          { id: 'TIMELINE', label: 'Activity Timeline' },
          { id: 'FORECAST', label: 'Revenue Forecast' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-sm)',
              fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 120ms ease',
              background: activeTab === t.id ? 'var(--bg-surface)' : 'transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: activeTab === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: DEAL PIPELINE GRID
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'PIPELINE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Conversion Funnel Bar */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">Pharma Buyer Acquisition Funnel</div>
              <span className="ent-caption">Lead → Live Customer progression</span>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
                {funnelCounts.map((stage, i) => (
                  <div key={stage.id} style={{ position: 'relative', textAlign: 'center' }}>
                    <div style={{
                      height: 40, background: stage.color, opacity: 0.85,
                      clipPath: i < funnelCounts.length - 1 ? 'polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{stage.count}</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage.label}</div>
                      <div className="ent-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                        ₹{(stage.value / 100000).toFixed(1)}L
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Data Grid */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Enterprise Deal Pipeline</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Active opportunities tracking business flow stages</div>
              </div>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Company Entity', 'Location', 'CRM Stage', 'Progress', 'Account Owner', 'Expected Revenue', 'Target Date', 'Last Activity'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pipelineDeals.map(deal => {
                  const stageConfig = getStageConfig(deal.stage);
                  return (
                    <tr key={deal.company}>
                      <td style={{ fontWeight: 700 }}>{deal.company}</td>
                      <td className="ent-body">{deal.city}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: stageConfig.color, flexShrink: 0 }} />
                          {stageConfig.label}
                        </span>
                      </td>
                      <td style={{ width: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${deal.progressPct}%`, background: stageConfig.color, borderRadius: 3 }} />
                          </div>
                          <span className="ent-mono" style={{ fontSize: 11, fontWeight: 700 }}>{deal.progressPct}%</span>
                        </div>
                      </td>
                      <td className="ent-body">{deal.owner}</td>
                      <td className="ent-mono" style={{ fontWeight: 700 }}>₹{deal.expectedRevenue.toLocaleString()}</td>
                      <td className="ent-mono">{deal.closingDate}</td>
                      <td className="ent-caption">{deal.lastActivity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CUSTOMER DIRECTORY
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'DIRECTORY' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 10px', width: 260 }}>
                <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
                <input type="text" placeholder="Search customer accounts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="ent-input" style={{ border: 'none', padding: 0, background: 'transparent' }} />
              </div>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  {['Account Name', 'Category', 'City / State', 'GSTIN', 'Drug License', 'Compliance', 'Credit Limit', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(cust => (
                  <tr key={cust.id} onClick={() => setSelectedCustomer(cust)} className={selectedCustomer?.id === cust.id ? 'selected' : ''}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cust.name}</div>
                      <div className="ent-mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{cust.code}</div>
                    </td>
                    <td className="ent-body">{cust.type}</td>
                    <td className="ent-body">{cust.city}, {cust.state}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{cust.gstin}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{cust.drugLicenseNo || cust.drugLicense || '—'}</td>
                    <td style={{ fontWeight: 600, fontSize: 12.5 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} />
                        Verified
                      </span>
                    </td>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>₹{(cust.creditLimit / 100000).toFixed(1)}L</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cust.status === 'ACTIVE' ? '#047857' : '#B45309' }} />
                        {cust.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer Profile Drawer */}
          {selectedCustomer && (
            <div className="ent-panel">
              <div className="ent-panel-header">
                <div>
                  <div className="ent-section-title">{selectedCustomer.name}</div>
                  <div className="ent-caption">{selectedCustomer.code} · {selectedCustomer.city}</div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="ent-btn-ghost ent-btn-sm"><X size={14} /></button>
              </div>

              {/* Drawer Tabs */}
              <div className="ent-tab-bar">
                {(['OVERVIEW', 'MEETINGS', 'RFQS', 'ORDERS', 'HISTORY'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setDrawerTab(t)}
                    className={`ent-tab ${drawerTab === t ? 'active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {drawerTab === 'OVERVIEW' && (
                  <>
                    <div className="ent-status-row">
                      <span className="label">Account Type</span>
                      <span className="value">{selectedCustomer.type}</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">GSTIN</span>
                      <span className="value ent-mono" style={{ fontSize: 12 }}>{selectedCustomer.gstin}</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Drug License</span>
                      <span className="value ent-mono" style={{ fontSize: 12 }}>{selectedCustomer.drugLicenseNo || selectedCustomer.drugLicense || '—'}</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Compliance Status</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#047857' }} /> Approved
                      </span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Credit Limit</span>
                      <span className="value ent-mono">₹{selectedCustomer.creditLimit?.toLocaleString()}</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Available Credit</span>
                      <span className="value ent-mono" style={{ color: '#047857' }}>₹{selectedCustomer.availableCredit?.toLocaleString()}</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Credit Days</span>
                      <span className="value">{selectedCustomer.creditDays} Days</span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">Risk Score</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: selectedCustomer.riskScore === 'LOW' ? '#047857' : '#B45309' }} />
                        {selectedCustomer.riskScore} RISK
                      </span>
                    </div>
                    <div className="ent-status-row">
                      <span className="label">RFQs Issued</span>
                      <span className="value">{rfqs.filter(r => r.customerId === selectedCustomer.id).length}</span>
                    </div>
                  </>
                )}
                {drawerTab !== 'OVERVIEW' && (
                  <div className="ent-caption" style={{ padding: '20px 0', textAlign: 'center' }}>
                    Record view active for <strong>{drawerTab}</strong>. Detailed logs available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: ACTIVITY TIMELINE
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'TIMELINE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">CRM Activity Feed & Meeting Calendar</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Interaction history, scheduled meetings & compliance events</div>
              </div>
              <button className="ent-btn-secondary" style={{ fontSize: 12, height: 32, padding: '0 12px' }}>
                <Calendar size={13} /> Schedule New
              </button>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Event Activity</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Scheduled Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {activityTimeline.map((act, i) => {
                  const typeColors: Record<string, string> = { MEETING: '#1E40AF', CALL: '#047857', COMPLIANCE: '#7C3AED' };
                  const color = typeColors[act.type] || '#64748B';
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8 }} />
                        {act.title}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: '2px 7px', borderRadius: 4 }}>
                          {act.type}
                        </span>
                      </td>
                      <td>{act.owner}</td>
                      <td className="ent-mono">{act.date}</td>
                      <td className="ent-body">{act.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Follow-up Calendar sidebar */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">Follow-up Calendar</div>
            </div>
            <div className="ent-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0 }}>
              {activityTimeline.map((act, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{act.title.split('—')[0].trim()}</div>
                      <div className="ent-caption" style={{ marginTop: 2 }}>{act.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: REVENUE FORECAST
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'FORECAST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Revenue Forecast vs. Target — Pharma Procurement</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Quarterly pipeline forecast based on deal stage progression</div>
              </div>
            </div>
            <div className="ent-panel-body">
              {revenueForecast.map((q, i) => {
                const pct = Math.round((q.value / q.target) * 100);
                const isOver = q.value >= q.target;
                return (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{q.quarter}</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span className="ent-mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Target: ₹{(q.target / 10000000).toFixed(1)}Cr</span>
                        <span className="ent-mono" style={{ fontSize: 13, fontWeight: 800, color: isOver ? '#047857' : '#B45309' }}>
                          {isOver ? '▲' : '▼'} ₹{(q.value / 10000000).toFixed(1)}Cr
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: 'var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: isOver ? '#047857' : '#1E40AF', borderRadius: 6, transition: 'width 400ms ease' }} />
                    </div>
                    <div className="ent-caption" style={{ marginTop: 4 }}>{pct}% of quarterly target achieved</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stage Breakdown Table */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">Pipeline Stage Revenue Breakdown</div>
            </div>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Deals</th>
                  <th>Total Pipeline Value</th>
                  <th>Weighted Forecast</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody>
                {funnelCounts.map(stage => {
                  const prob = stage.id === 'LIVE_CUSTOMER' ? 100 : stage.id === 'APPROVED_CUSTOMER' ? 90 : stage.id === 'COMPLIANCE_PENDING' ? 65 : stage.id === 'DOCS_RECEIVED' ? 40 : stage.id === 'DEMO_SCHEDULED' ? 20 : 5;
                  return (
                    <tr key={stage.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                          {stage.label}
                        </span>
                      </td>
                      <td className="ent-mono" style={{ fontWeight: 700 }}>{stage.count}</td>
                      <td className="ent-mono" style={{ fontWeight: 700 }}>₹{stage.value.toLocaleString()}</td>
                      <td className="ent-mono" style={{ fontWeight: 700, color: '#047857' }}>₹{Math.round(stage.value * prob / 100).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 5, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${prob}%`, background: stage.color, borderRadius: 3 }} />
                          </div>
                          <span className="ent-mono" style={{ fontSize: 11, fontWeight: 700 }}>{prob}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
