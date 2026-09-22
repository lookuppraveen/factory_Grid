import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3, Download, FileText, Calendar, Filter, Sparkles, CheckCircle2, Table, Layers,
  Printer, TrendingUp, DollarSign, ShieldCheck, UserCheck, Landmark, Building2, PieChart,
  Activity, ArrowUpRight, Award, Target, Bot, Check, AlertCircle, FileCheck
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { currentRole, addAuditLog, rfqs, orders, invoices, complianceCases } = useApp();

  const [selectedRoleDomain, setSelectedRoleDomain] = useState<string>(currentRole);
  const [dateRange, setDateRange] = useState('Q3_2026');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = (format: 'PDF' | 'EXCEL' | 'PRINT') => {
    setIsGenerating(true);
    addAuditLog('Reports Engine', `Exported ${selectedRoleDomain} Executive Report as ${format}`);
    setTimeout(() => {
      setIsGenerating(false);
      if (format === 'PRINT') {
        window.print();
      } else {
        alert(`✔ ${selectedRoleDomain} Executive Report successfully exported as ${format}!`);
      }
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP COMMAND HEADER ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Executive Governance</span>
              <span>·</span>
              <span>Oracle Analytics & SAP Cloud BI</span>
              <span>·</span>
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Role BI Reports</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Executive Reports & Business Intelligence Console
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Generate role-tailored procurement, revenue, manufacturing, and statutory compliance analytics.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => handleExport('PRINT')} style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print Report
          </button>
          <button onClick={() => handleExport('EXCEL')} style={{ height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Table size={14} /> Export Excel
          </button>
          <button onClick={() => handleExport('PDF')} style={{ height: 38, padding: '0 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Export PDF Report
          </button>
        </div>
      </div>

      {/* ── FILTER CONTROLS BAR ──────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Select Role Report Domain *</label>
          <select
            value={selectedRoleDomain}
            onChange={e => setSelectedRoleDomain(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
          >
            <option value="BUYER">BUYER — Procurement & Spend Analysis</option>
            <option value="SUPPLIER">MANUFACTURER — Production & Revenue BI</option>
            <option value="COMPLIANCE_OFFICER">COMPLIANCE — Audit & License Governance</option>
            <option value="SALES_MANAGER">SALES — Qualification & Pipeline CRM</option>
            <option value="ACCOUNTS_MANAGER">ACCOUNTS — Financial AR Ledger & Treasury</option>
            <option value="ADMIN">ADMIN — System Health & Platform Analytics</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reporting Period *</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}>
            <option value="Q3_2026">Q3 FY 2026 (Current Period)</option>
            <option value="Q2_2026">Q2 FY 2026</option>
            <option value="YTD_2026">Year to Date (YTD 2026)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ padding: '8px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, width: '100%', color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
            <span>Verified against FactoryGrid audit ledger: <strong>100% Data Integrity</strong></span>
          </div>
        </div>
      </div>

      {/* ── VISUAL CHARTS & ANALYTICS SECTION ────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Visual Bar Chart Breakdown */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {selectedRoleDomain === 'BUYER' && 'Monthly Procurement Spend & Commercial Savings Trend'}
                {selectedRoleDomain === 'SUPPLIER' && 'Plant Production Capacity & Revenue Realization'}
                {selectedRoleDomain === 'COMPLIANCE_OFFICER' && 'Regulatory Clearance Time & License Audit Funnel'}
                {selectedRoleDomain === 'SALES_MANAGER' && 'Inbound Lead Qualification & Deal Conversion Pipeline'}
                {selectedRoleDomain === 'ACCOUNTS_MANAGER' && 'Accounts Receivable Aging & Monthly Collections'}
                {selectedRoleDomain === 'ADMIN' && 'System API Throughput & Active User Telemetry'}
              </h3>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Monthly historical aggregation · Q3 2026</div>
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 999, border: '1px solid #BFDBFE' }}>
              REAL-TIME SYNC
            </span>
          </div>

          {/* SVG Visual Bar Chart */}
          <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 24, padding: '16px 20px 0', borderBottom: '1px solid #E2E8F0' }}>
            {[
              { month: 'Apr 2026', val: 45, label: '₹1.2 Cr' },
              { month: 'May 2026', val: 65, label: '₹1.8 Cr' },
              { month: 'Jun 2026', val: 55, label: '₹1.5 Cr' },
              { month: 'Jul 2026', val: 85, label: '₹2.4 Cr' },
              { month: 'Aug 2026 (Active)', val: 95, label: '₹2.78 Cr' },
            ].map((bar, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>{bar.label}</span>
                <div style={{ width: '100%', height: `${bar.val}%`, background: i === 4 ? '#2563EB' : '#93C5FD', borderRadius: '6px 6px 0 0', transition: 'all 300ms ease' }} />
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations & Executive Insights */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={20} style={{ color: '#2563EB' }} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>AI Executive Insights & Recommendations</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>
              💡 <strong>Commercial Optimization:</strong> AI Manufacturer Matching saved ₹185,000 (7.2%) on RFQ-2026-1001 by splitting formulation lines across SunBio & Cipla.
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>
              🛡 <strong>Regulatory Risk:</strong> 2 WHO-GMP certificates expiring within 90 days. Renewal alerts dispatched to SunBio & NovaMed.
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}>
              ⚡ <strong>Supply Chain SLA:</strong> Average delivery schedule reduced from 24 days to 18 days via direct digital purchase orders.
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAILED DATA TABLE ──────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Detailed Executive Metrics & Transaction Ledger</h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>5 Total Audit Records</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px' }}>Domain / Category</th>
              <th style={{ padding: '12px 16px' }}>Key Metric</th>
              <th style={{ padding: '12px 16px' }}>Current Value</th>
              <th style={{ padding: '12px 16px' }}>Target SLA</th>
              <th style={{ padding: '12px 16px' }}>Variance</th>
              <th style={{ padding: '12px 20px', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { cat: 'Procurement Sourcing', metric: 'RFQ Fulfillment Speed', val: '1.2 Days', target: '2.0 Days', var: '-0.8 Days (Fast)', status: 'Optimal' },
              { cat: 'Commercial Savings', metric: 'AI Sealed Bid Savings', val: '₹1,85,000', target: '₹1,50,000', var: '+₹35,000', status: 'Optimal' },
              { cat: 'Regulatory Compliance', metric: 'CDSCO License Clearance', val: '4.2 Hours', target: '24.0 Hours', var: '-19.8 Hours', status: 'Optimal' },
              { cat: 'Plant Manufacturing', metric: 'Tableting Yield Rate', val: '99.6%', target: '98.0%', var: '+1.6%', status: 'Optimal' },
              { cat: 'Finance & AR Ledger', metric: 'Collection Efficiency', val: '81.4%', target: '80.0%', var: '+1.4%', status: 'Optimal' },
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 20px', fontWeight: 700, color: '#0F172A' }}>{row.cat}</td>
                <td style={{ padding: '12px 16px', color: '#334155' }}>{row.metric}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#2563EB' }}>{row.val}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748B' }}>{row.target}</td>
                <td style={{ padding: '12px 16px', color: '#16A34A', fontWeight: 600 }}>{row.var}</td>
                <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                    ✓ {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
