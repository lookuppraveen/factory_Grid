import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, Eye, X, CheckCircle2, Clock, AlertTriangle, FileText, Building2 } from 'lucide-react';

export const AdminComplianceVerificationMonitor: React.FC = () => {
  const { complianceCases, currentRole } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);

  const pendingCount = complianceCases.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'PENDING').length;
  const approvedCount = complianceCases.filter(c => c.status === 'APPROVED' || c.status === 'VERIFIED').length;
  const rejectedCount = complianceCases.filter(c => c.status === 'REJECTED').length;
  const expiringCount = 1;

  const filteredCases = complianceCases.filter(c => {
    const matchSearch = c.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'PENDING') return matchSearch && (c.status === 'UNDER_REVIEW' || c.status === 'PENDING');
    if (statusFilter === 'APPROVED') return matchSearch && (c.status === 'APPROVED' || c.status === 'VERIFIED');
    if (statusFilter === 'REJECTED') return matchSearch && c.status === 'REJECTED';
    return matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={14} /> Compliance Monitoring · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Compliance Verification Monitor
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor regulatory compliance cases, Form 20B/21B CDSCO drug licenses and verification statuses.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#4338CA' }}>
          <Eye size={14} /> READ-ONLY MONITORING MODE
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'PENDING REVIEW', val: pendingCount, color: '#D97706', bg: '#FFFBEB', icon: Clock },
          { label: 'APPROVED', val: approvedCount, color: '#15803D', bg: '#DCFCE7', icon: CheckCircle2 },
          { label: 'REJECTED', val: rejectedCount, color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle },
          { label: 'EXPIRING LICENSES', val: expiringCount, color: '#4F46E5', bg: '#EEF2FF', icon: ShieldCheck },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#64748B' }}>{kpi.label}</span>
                <Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{kpi.val}</div>
            </div>
          );
        })}
      </div>

      {/* Search & Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search organization..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 6 }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
              <button key={st} onClick={() => setStatusFilter(st)} style={{ border: 'none', padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 4, background: statusFilter === st ? '#FFF' : 'transparent', color: statusFilter === st ? '#2563EB' : '#64748B', cursor: 'pointer' }}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Organization</th>
              <th style={{ padding: '12px 16px' }}>Type</th>
              <th style={{ padding: '12px 16px' }}>License / Reg #</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Submitted By</th>
              <th style={{ padding: '12px 16px' }}>Current Reviewer</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{c.entityName}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{c.entityType || 'PCD Franchise Buyer'}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>DL-20B-99812</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>2028-12-31</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>Compliance Desk</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>Compliance Officer Desk</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: c.status === 'APPROVED' ? '#DCFCE7' : c.status === 'REJECTED' ? '#FEF2F2' : '#FEF3C7', color: c.status === 'APPROVED' ? '#15803D' : c.status === 'REJECTED' ? '#DC2626' : '#B45309' }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => setSelectedCase(c)} style={{ padding: '4px 10px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCase && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 640, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Compliance Inspection: {selectedCase.entityName}</h3>
              <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
              <div><strong>Organization:</strong> {selectedCase.entityName}</div>
              <div><strong>Status:</strong> {selectedCase.status}</div>
              <div><strong>License:</strong> DL-20B-99812</div>
              <div><strong>Expiry:</strong> 2028-12-31</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button onClick={() => setSelectedCase(null)} style={{ padding: '8px 18px', background: '#334155', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
