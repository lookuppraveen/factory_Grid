import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ComplianceModule } from './ComplianceModule';
import { ShieldCheck, Search, Eye, X, CheckCircle2, Clock, AlertTriangle, FileText, Building2, Check, CheckSquare } from 'lucide-react';

export const AdminComplianceVerification: React.FC = () => {
  return <ComplianceModule />;
};

  const handleRejectCase = (caseId: string, entityName: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this compliance submission.');
      return;
    }
    setCasesList(prev => prev.map(c => c.id === caseId ? { ...c, status: 'REJECTED', rejectionReason: rejectReason, lastUpdated: 'Just now' } : c));
    addAuditLog('Compliance Verification', `Admin rejected compliance case for ${entityName} (Reason: ${rejectReason})`);
    setActiveReviewCase(null);
    setShowRejectInput(false);
    setRejectReason('');
    setToastMessage(`❌ Compliance verification for ${entityName} REJECTED.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const filteredCases = casesList.filter(c => {
    const matchSearch = c.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'PENDING') return matchSearch && (c.status === 'UNDER_REVIEW' || c.status === 'PENDING');
    if (statusFilter === 'APPROVED') return matchSearch && (c.status === 'APPROVED' || c.status === 'VERIFIED');
    if (statusFilter === 'REJECTED') return matchSearch && c.status === 'REJECTED';
    return matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ background: '#0F766E', color: '#FFF', padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={14} /> Statutory Compliance Desk · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Compliance Verification
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Review and verify buyer and manufacturer compliance documents and statutory requirements.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#15803D' }}>
          <CheckSquare size={14} /> FULL COMPLIANCE OPERATIONS AUTHORIZED
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          { label: 'PENDING REVIEW', val: pendingCount, color: '#D97706', bg: '#FFFBEB', icon: Clock },
          { label: 'UNDER REVIEW', val: underReviewCount, color: '#2563EB', bg: '#EFF6FF', icon: FileText },
          { label: 'APPROVED', val: approvedCount, color: '#15803D', bg: '#DCFCE7', icon: CheckCircle2 },
          { label: 'REJECTED', val: rejectedCount, color: '#DC2626', bg: '#FEF2F2', icon: AlertTriangle },
          { label: 'EXPIRING / ACTION REQ.', val: expiringCount, color: '#4F46E5', bg: '#EEF2FF', icon: ShieldCheck },
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

      {/* Queue Table */}
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
              <th style={{ padding: '12px 16px' }}>Organization Type</th>
              <th style={{ padding: '12px 16px' }}>License / Registration</th>
              <th style={{ padding: '12px 16px' }}>Document Type</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Submitted By</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Current Reviewer</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>{c.entityName}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{c.entityType || 'PCD Franchise Buyer'}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>DL-20B-99812</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>CDSCO Form 20B/21B</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>2028-12-31</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>Compliance Desk</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: c.status === 'APPROVED' ? '#DCFCE7' : c.status === 'REJECTED' ? '#FEF2F2' : '#FEF3C7', color: c.status === 'APPROVED' ? '#15803D' : c.status === 'REJECTED' ? '#DC2626' : '#B45309' }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>Compliance Officer Desk</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button onClick={() => { setActiveReviewCase(c); setShowRejectInput(false); }} style={{ padding: '5px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      Review &amp; Verify
                    </button>
                    {c.status !== 'APPROVED' && (
                      <button onClick={() => handleApproveCase(c.id, c.entityName)} style={{ padding: '5px 8px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Approve ✓
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Verification Review Modal */}
      {activeReviewCase && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 700, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Compliance Action Desk</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>Verify License: {activeReviewCase.entityName}</h3>
              </div>
              <button onClick={() => setActiveReviewCase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div><strong>Organization Name:</strong> {activeReviewCase.entityName}</div>
              <div><strong>Verification Status:</strong> {activeReviewCase.status}</div>
              <div><strong>License / Reg Number:</strong> DL-20B-99812</div>
              <div><strong>Statutory Expiry:</strong> 2028-12-31</div>
              <div><strong>CDSCO Portal Status:</strong> <span style={{ color: '#15803D', fontWeight: 700 }}>✓ Verified Form 20B</span></div>
              <div><strong>GSTIN API Status:</strong> <span style={{ color: '#15803D', fontWeight: 700 }}>✓ Active Taxpayer</span></div>
            </div>

            {showRejectInput ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', padding: 14, borderRadius: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#DC2626' }}>Enter Compliance Rejection Reason:</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="State the specific document deficiency or regulatory non-compliance..." rows={3} style={{ width: '100%', padding: 8, fontSize: 12, borderRadius: 6, border: '1px solid #FCA5A5' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button onClick={() => setShowRejectInput(false)} style={{ padding: '6px 12px', background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => handleRejectCase(activeReviewCase.id, activeReviewCase.entityName)} style={{ padding: '6px 14px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Confirm Rejection ❌</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10 }}>
                <button onClick={() => setShowRejectInput(true)} style={{ padding: '10px 18px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  Reject Case ❌
                </button>
                <button onClick={() => handleApproveCase(activeReviewCase.id, activeReviewCase.entityName)} style={{ padding: '10px 22px', background: '#059669', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  Approve Compliance Case ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
