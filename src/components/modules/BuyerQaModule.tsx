import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Search, Filter, Plus, FileText, CheckCircle2, Clock, AlertTriangle, Eye, HelpCircle, MessageSquare, Building2, Package } from 'lucide-react';
import { RaiseQaModal, getStoredQaRequests } from './RaiseQaModal';
import { QaRequestItem } from '../../types';

export const BuyerQaModule: React.FC = () => {
  const { currentRole, orders } = useApp();
  const [qaRequests, setQaRequests] = useState<QaRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  
  // Modal State
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedQaDetail, setSelectedQaDetail] = useState<QaRequestItem | null>(null);

  const refreshQaRequests = () => {
    const all = getStoredQaRequests();
    // Filter for Buyer-submitted or Buyer-relevant requests
    const buyerReqs = all.filter(q => q.raisedByRole === 'BUYER' || !q.raisedByRole);
    setQaRequests(buyerReqs);
  };

  useEffect(() => {
    refreshQaRequests();
    window.addEventListener('storage', refreshQaRequests);
    return () => window.removeEventListener('storage', refreshQaRequests);
  }, []);

  const filteredRequests = qaRequests.filter(req => {
    const matchesSearch =
      req.qaNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.contextNumber && req.contextNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesCat = categoryFilter === 'ALL' || req.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCat;
  });

  const totalCount = qaRequests.length;
  const pendingCount = qaRequests.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'UNDER_REVIEW').length;
  const resolvedCount = qaRequests.filter(r => r.status === 'APPROVED' || r.status === 'RESOLVED').length;
  const rejectedCount = qaRequests.filter(r => r.status === 'REJECTED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'RESOLVED':
        return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', label: 'Approved / Resolved ✓' };
      case 'REJECTED':
        return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', label: 'Rejected ❌' };
      case 'UNDER_REVIEW':
        return { bg: '#E0F2FE', color: '#0369A1', border: '#7DD3FC', label: 'Under Review ⏳' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', label: 'Pending Admin Review ⏳' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1280, margin: '0 auto', padding: '20px 0' }}>
      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={14} /> Quality Assurance &amp; Assay Support · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Quality Assurance (QA) Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Submit quality queries, test assay concerns, specification checks, or batch compliance questions directly to Admin Quality Desk.
          </p>
        </div>
        <button
          onClick={() => setIsRaiseModalOpen(true)}
          style={{ padding: '10px 20px', borderRadius: 8, background: '#4F46E5', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)' }}
        >
          <Plus size={16} /> Raise QA Query
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>TOTAL QA QUERIES</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>{totalCount}</div>
        </div>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>PENDING / UNDER REVIEW</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>{pendingCount}</div>
        </div>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>APPROVED / RESOLVED</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', marginTop: 4 }}>{resolvedCount}</div>
        </div>
        <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>REJECTED QUERIES</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by QA ID, Subject, Order #, or Keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Status:</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF', color: '#0F172A' }}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved / Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Category:</span>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF', color: '#0F172A' }}>
            <option value="ALL">All Categories</option>
            <option value="QUALITY_CONTROL">Quality Control</option>
            <option value="ASSAY_TESTING">Assay Testing</option>
            <option value="SPECIFICATION_QUERY">Specification Query</option>
            <option value="PACKAGING_LABELING">Packaging & Labeling</option>
            <option value="REGULATORY_COMPLIANCE">Regulatory Compliance</option>
            <option value="GENERAL_QA">General QA Concern</option>
          </select>
        </div>
      </div>

      {/* QA Requests Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>QA Request #</th>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>Subject &amp; Details</th>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>Reference Context</th>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 800 }}>Admin Response</th>
              <th style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
                  <HelpCircle size={32} style={{ color: '#CBD5E1', marginBottom: 8 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>No QA Queries Found</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Click "Raise QA Query" to submit a question to the Admin Quality Desk.</div>
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => {
                const sBadge = getStatusBadge(req.status);
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                      {req.qaNumber}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{req.subject}</div>
                      <div style={{ fontSize: 12, color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2 }}>
                        {req.description}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                        {req.contextType}: {req.contextNumber}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      {req.category.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 4, background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}` }}>
                        {sBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: 260 }}>
                      {req.adminResponse ? (
                        <div style={{ fontSize: 12, color: '#0369A1', background: '#F0F9FF', padding: '6px 10px', borderRadius: 6, border: '1px solid #BAE6FD' }}>
                          💬 <strong>Admin:</strong> {req.adminResponse}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>Awaiting Admin response</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedQaDetail(req)}
                        style={{ padding: '6px 12px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* QA Detail Modal */}
      {selectedQaDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedQaDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#FFF', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>{selectedQaDetail.qaNumber}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{selectedQaDetail.subject}</h3>
              </div>
              <button onClick={() => setSelectedQaDetail(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div>Category: <strong>{selectedQaDetail.category.replace(/_/g, ' ')}</strong></div>
              <div>Priority: <strong style={{ color: selectedQaDetail.priority === 'URGENT' ? '#DC2626' : '#2563EB' }}>{selectedQaDetail.priority}</strong></div>
              <div>Submitted On: <strong>{selectedQaDetail.createdAt}</strong></div>
              <div>Reference Context: <strong style={{ fontFamily: 'monospace' }}>{selectedQaDetail.contextType}: {selectedQaDetail.contextNumber}</strong></div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Detailed Question / Issue Description</label>
              <div style={{ fontSize: 13, color: '#1E293B', background: '#FFF', border: '1px solid #CBD5E1', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                {selectedQaDetail.description}
              </div>
            </div>

            {selectedQaDetail.adminResponse && (
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Official Admin Technical Response</label>
                <div style={{ fontSize: 13, color: '#0F172A', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: 12, borderRadius: 8 }}>
                  💬 {selectedQaDetail.adminResponse}
                </div>
              </div>
            )}

            {selectedQaDetail.rejectionReason && (
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>QA Rejection Reason</label>
                <div style={{ fontSize: 13, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 12, borderRadius: 8 }}>
                  ❌ {selectedQaDetail.rejectionReason}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setSelectedQaDetail(null)} style={{ padding: '8px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Universal QA Raising Modal */}
      <RaiseQaModal
        isOpen={isRaiseModalOpen}
        onClose={() => {
          setIsRaiseModalOpen(false);
          refreshQaRequests();
        }}
        userRole="BUYER"
        contextType="GENERAL"
        contextNumber="Buyer-General-Query"
      />
    </div>
  );
};
