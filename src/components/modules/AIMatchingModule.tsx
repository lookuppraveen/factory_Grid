import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot, CheckCircle2, Clock, Send, ShieldCheck, Check, ArrowRight,
  FileText, Building2, Factory, MapPin, Award, Activity, AlertCircle, RefreshCw
} from 'lucide-react';
import { RFQ } from '../../types';

interface AIMatchingModuleProps {
  rfq: RFQ;
  onNavigateToQuotes?: () => void;
  onNavigateToDashboard?: () => void;
}

export const AIMatchingModule: React.FC<AIMatchingModuleProps> = ({
  rfq,
  onNavigateToQuotes,
  onNavigateToDashboard
}) => {
  const { manufacturers, addAuditLog, setActiveTab } = useApp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [distProgress, setDistProgress] = useState<{ mfgId: string; name: string; status: 'PENDING' | 'SENDING' | 'SENT' }[]>([
    { mfgId: 'm1', name: 'SunBio LifeSciences Ltd (Baddi Unit)', status: 'PENDING' },
    { mfgId: 'm2', name: 'Cipla Partner Formulations (Pune Unit)', status: 'PENDING' },
    { mfgId: 'm3', name: 'Lupin Bio-Tech Labs (Vapi Unit)', status: 'PENDING' }
  ]);

  useEffect(() => {
    // Automated Step Progression Simulation
    const timer1 = setTimeout(() => setCurrentStep(2), 600);
    const timer2 = setTimeout(() => {
      setCurrentStep(3);
      setDistProgress(prev => prev.map((item, i) => i === 0 ? { ...item, status: 'SENDING' } : item));
    }, 1400);

    const timer3 = setTimeout(() => {
      setDistProgress(prev => [
        { ...prev[0], status: 'SENT' },
        { ...prev[1], status: 'SENDING' },
        prev[2]
      ]);
    }, 2200);

    const timer4 = setTimeout(() => {
      setCurrentStep(4);
      setDistProgress(prev => prev.map(item => ({ ...item, status: 'SENT' })));
    }, 3000);

    const timer5 = setTimeout(() => {
      setCurrentStep(5);
      addAuditLog('AI Matching Engine', `Distributed RFQ ${rfq.rfqNumber} to 3 WHO-GMP verified manufacturers.`);
    }, 3600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [rfq]);

  const matchingCriteria = [
    { name: 'Product Capability', status: 'Matched', score: 98 },
    { name: 'Manufacturing Category', status: 'Matched', score: 100 },
    { name: 'WHO-GMP Certification', status: 'Matched', score: 100 },
    { name: 'CDSCO Drug License', status: 'Matched', score: 100 },
    { name: 'Available Capacity', status: 'Matched', score: 92 },
    { name: 'Previous Performance', status: 'Matched', score: 95 },
    { name: 'Geographic Location', status: 'Matched', score: 88 },
    { name: 'Quality Rating', status: 'Matched', score: 96 },
    { name: 'Production Delivery Schedule', status: 'Matched', score: 90 },
    { name: 'Current Factory Load', status: 'Matched', score: 85 }
  ];

  const matchedManufacturers = [
    {
      id: 'm1',
      name: 'SunBio LifeSciences Ltd',
      score: 96,
      capabilityScore: '98%',
      complianceStatus: 'WHO-GMP & US-FDA Verified',
      availableCapacity: '12.5M Units / Month',
      qualityRating: '4.9 / 5.0',
      leadTime: '18 Days',
      location: 'Baddi, Himachal Pradesh',
      currentLoad: '62% Capacity Utilization',
      distStatus: distProgress[0].status
    },
    {
      id: 'm2',
      name: 'Cipla Partner Formulations Ltd',
      score: 92,
      capabilityScore: '95%',
      complianceStatus: 'EU-GMP & WHO-GMP Verified',
      availableCapacity: '8.0M Units / Month',
      qualityRating: '4.8 / 5.0',
      leadTime: '21 Days',
      location: 'Pune, Maharashtra',
      currentLoad: '70% Capacity Utilization',
      distStatus: distProgress[1].status
    },
    {
      id: 'm3',
      name: 'Lupin Bio-Tech Labs Unit IV',
      score: 88,
      capabilityScore: '92%',
      complianceStatus: 'WHO-GMP & ISO 9001',
      availableCapacity: '15.0M Units / Month',
      qualityRating: '4.7 / 5.0',
      leadTime: '24 Days',
      location: 'Vapi, Gujarat',
      currentLoad: '58% Capacity Utilization',
      distStatus: distProgress[2].status
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Header Bar ──────────────────────────── */}
      <div className="ent-command-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="ent-command-bar-left">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
            <Bot size={20} />
          </div>
          <div>
            <div className="ent-label" style={{ color: 'var(--text-tertiary)' }}>FactoryGrid AI Algorithm Desk</div>
            <div className="ent-page-title" style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)' }}>
              AI Manufacturer Matching & RFQ Distribution
            </div>
          </div>
        </div>

        <div className="ent-command-bar-right">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
            <div>
              <span className="ent-caption">RFQ Number:</span>
              <div className="ent-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rfq.rfqNumber}</div>
            </div>
            <div>
              <span className="ent-caption">Buyer:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rfq.customerName}</div>
            </div>
            <div>
              <span className="ent-caption">Submission Time:</span>
              <div className="ent-mono" style={{ color: 'var(--text-secondary)' }}>07-Aug-2026 13:30 IST</div>
            </div>
            <div>
              <span className="ent-caption">Overall Status:</span>
              <div style={{ fontWeight: 700, color: currentStep >= 4 ? 'var(--c-success, #047857)' : 'var(--c-info, #0284C7)' }}>
                {currentStep >= 4 ? 'PRICING_IN_PROGRESS' : 'AI_MATCHING'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5-Step Process Indicator ───────────────────────── */}
      <div className="ent-process-tracker" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '16px 20px' }}>
        {[
          { step: 1, label: 'RFQ Submitted', done: currentStep >= 1 },
          { step: 2, label: 'AI Processing', done: currentStep >= 2 },
          { step: 3, label: 'Manufacturer Matching', done: currentStep >= 3 },
          { step: 4, label: 'RFQ Distribution', done: currentStep >= 4 },
          { step: 5, label: 'Completed', done: currentStep >= 5 }
        ].map((item) => (
          <div key={item.step} className={`ent-process-step ${item.done ? 'completed' : ''}`}>
            <div className="ent-process-dot">
              {item.done ? '✓' : item.step}
            </div>
            <div className="ent-process-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── Match Completion Notification Banner ──────────── */}
      {currentStep >= 4 && (
        <div style={{
          background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} style={{ color: 'var(--c-success, #047857)' }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                RFQ Successfully Distributed to 3 Eligible Manufacturers
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Sealed bid notifications dispatched to manufacturer inboxes. Waiting for quotations.
              </div>
            </div>
          </div>
          <span className="ent-chip-success">PRICING IN PROGRESS</span>
        </div>
      )}

      {/* ── Match Summary Cards ────────────────────────────── */}
      <div className="ent-kpi-strip" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Eligible Manufacturers Found</div>
          <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>3 Plants</div>
          <div className="kpi-sub">WHO-GMP & CDSCO Verified</div>
        </div>

        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Best Match</div>
          <div className="kpi-value" style={{ color: 'var(--c-success, #047857)' }}>SunBio (96%)</div>
          <div className="kpi-sub">Baddi formulation plant</div>
        </div>

        <div className="ent-kpi-strip-item">
          <div className="kpi-label">Average Match Score</div>
          <div className="kpi-value" style={{ color: 'var(--c-info, #0284C7)' }}>92.0%</div>
          <div className="kpi-sub">Across 10 qualification metrics</div>
        </div>

        <div className="ent-kpi-strip-item" style={{ borderRight: 'none' }}>
          <div className="kpi-label">Estimated Distribution Time</div>
          <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>&lt; 2 Seconds</div>
          <div className="kpi-sub">Automated B2B transmission</div>
        </div>
      </div>

      {/* ── AI Matching Engine Criteria Grid ───────────────── */}
      <div className="ent-panel">
        <div className="ent-panel-header">
          <div>
            <div className="ent-section-title">AI Matching Engine Criteria Analysis</div>
            <div className="ent-caption" style={{ marginTop: 2 }}>Multi-variable algorithm evaluating plant capability, compliance, capacity & load</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>10 / 10 Criteria Validated</span>
        </div>

        <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {matchingCriteria.map((c, i) => (
            <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{c.name}</span>
                <Check size={13} style={{ color: 'var(--c-success, #047857)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-success, #047857)' }}>{c.status}</span>
                <span className="ent-mono" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>{c.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Manufacturer Table & Matching Progress Bars ───── */}
      <div className="ent-panel">
        <div className="ent-panel-header">
          <div className="ent-section-title">Matched WHO-GMP Manufacturers & Distribution Status</div>
          <span className="ent-caption">Automatic Top Selection Enabled</span>
        </div>

        <table className="ent-table">
          <thead>
            <tr>
              <th>Manufacturer</th>
              <th>Capability Score</th>
              <th>Compliance Status</th>
              <th>Available Capacity</th>
              <th>Quality Rating</th>
              <th>Delivery Schedule</th>
              <th>Location</th>
              <th>Current Load</th>
              <th>Matching Score</th>
              <th>Distribution Status</th>
            </tr>
          </thead>
          <tbody>
            {matchedManufacturers.map(mfg => (
              <tr key={mfg.id}>
                <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{mfg.name}</td>
                <td className="ent-mono">{mfg.capabilityScore}</td>
                <td className="ent-body" style={{ fontSize: 11.5 }}>{mfg.complianceStatus}</td>
                <td className="ent-mono">{mfg.availableCapacity}</td>
                <td className="ent-mono" style={{ fontWeight: 700 }}>{mfg.qualityRating}</td>
                <td className="ent-mono">{mfg.leadTime}</td>
                <td className="ent-body" style={{ fontSize: 11.5 }}>{mfg.location}</td>
                <td className="ent-body" style={{ fontSize: 11.5 }}>{mfg.currentLoad}</td>
                <td>
                  <div style={{ width: 100 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                      <span className="ent-mono">{mfg.score}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${mfg.score}%`, background: 'var(--text-primary)', borderRadius: 2 }} />
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: mfg.distStatus === 'SENT' ? 'var(--c-success, #047857)' : 'var(--c-info, #0284C7)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: mfg.distStatus === 'SENT' ? 'var(--c-success, #047857)' : 'var(--c-info, #0284C7)' }} />
                    {mfg.distStatus === 'SENT' ? 'Sent' : mfg.distStatus === 'SENDING' ? 'Sending...' : 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Action Buttons Footer ──────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={() => {
            if (onNavigateToDashboard) onNavigateToDashboard();
            else setActiveTab('dashboard');
          }}
          className="ent-btn-secondary"
          style={{ padding: '10px 20px', fontSize: 13 }}
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => {
            if (onNavigateToQuotes) onNavigateToQuotes();
            else setActiveTab('quotes');
          }}
          className="ent-btn-primary"
          style={{ padding: '10px 24px', fontSize: 13 }}
        >
          View RFQ Status & Track Quotes →
        </button>
      </div>

    </div>
  );
};
