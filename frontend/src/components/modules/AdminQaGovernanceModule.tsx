import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, Search, Filter, Eye, X, CheckCircle2, Clock,
  AlertTriangle, RefreshCw, Send, FileText, Check, MessageSquare, AlertCircle
} from 'lucide-react';
import { QaRequestItem, QaCategory, QaRequestStatus } from '../../types';
import { getStoredQaRequests, saveQaRequests } from './RaiseQaModal';

export const AdminQaGovernanceModule: React.FC = () => {
  const { currentRole, addAuditLog } = useApp();
  const [qaRequests, setQaRequests] = useState<QaRequestItem[]>(getStoredQaRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [selectedReq, setSelectedReq] = useState<QaRequestItem | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [adminBanner, setAdminBanner] = useState<string | null>(null);

  // Sync state on localStorage change or focus
  const refreshStore = () => {
    setQaRequests(getStoredQaRequests());
  };

  useEffect(() => {
    refreshStore();
    window.addEventListener('storage', refreshStore);
    window.addEventListener('focus', refreshStore);
    return () => {
      window.removeEventListener('storage', refreshStore);
      window.removeEventListener('focus', refreshStore);
    };
  }, []);

  const handleUpdateStatus = (
    reqId: string,
    newStatus: QaRequestStatus,
    responseTxt?: string,
    rejectionTxt?: string
  ) => {
    const store = getStoredQaRequests();
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = store.map(req => {
      if (req.id === reqId) {
        return {
          ...req,
          status: newStatus,
          adminResponse: responseTxt !== undefined ? responseTxt : req.adminResponse,
          rejectionReason: newStatus === 'REJECTED' ? (rejectionTxt || req.rejectionReason || 'Assay parameters failed pharmacopeial standard') : req.rejectionReason,
          reviewedBy: 'Admin Quality Governance Desk',
          reviewedAt: nowStr,
          resolvedAt: (newStatus === 'APPROVED' || newStatus === 'RESOLVED' || newStatus === 'CLOSED') ? nowStr : req.resolvedAt
        };
      }
      return req;
    });

    saveQaRequests(updated);
    setQaRequests(updated);

    if (selectedReq && selectedReq.id === reqId) {
      setSelectedReq(updated.find(r => r.id === reqId) || null);
    }

    addAuditLog('QA Workflow Governance', `Admin updated QA Query ${reqId} status to ${newStatus}`);
    setAdminBanner(`✓ QA Request ${selectedReq?.qaNumber || reqId} updated to ${newStatus.replace('_', ' ')}.`);
  };

  // Filtered QA list
  const filteredRequests = qaRequests.filter(req => {
    const matchesSearch =
      req.qaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.contextNumber && req.contextNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.raisedByOrg && req.raisedByOrg.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || req.category === categoryFilter;
    const matchesRole = roleFilter === 'ALL' || req.raisedByRole === roleFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesRole;
  });

  // KPI Calculations
  const totalCount = qaRequests.length;
  const pendingCount = qaRequests.filter(r => r.status === 'PENDING_REVIEW').length;
  const underReviewCount = qaRequests.filter(r => r.status === 'UNDER_REVIEW').length;
  const approvedCount = qaRequests.filter(r => r.status === 'APPROVED' || r.status === 'RESOLVED').length;
  const rejectedCount = qaRequests.filter(r => r.status === 'REJECTED').length;

  const getStatusBadgeStyle = (st: QaRequestStatus) => {
    if (st === 'APPROVED' || st === 'RESOLVED') return { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', label: 'APPROVED / RESOLVED ✓' };
    if (st === 'REJECTED') return { bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5', label: 'REJECTED ❌' };
    if (st === 'UNDER_REVIEW') return { bg: '#E0F2FE', color: '#0369A1', border: '#7DD3FC', label: 'UNDER ADMIN REVIEW ⏳' };
    if (st === 'CLOSED') return { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', label: 'CLOSED' };
    return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', label: 'PENDING ADMIN REVIEW' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Global Notification Banner */}
      {adminBanner && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 18px', color: '#15803D', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{adminBanner}</span>
          <button onClick={() => setAdminBanner(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShieldCheck size={16} /> Quality Assurance (QA) Governance Console · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Central Admin QA &amp; Assay Governance Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Central authority workspace to receive, review, respond to, approve, or reject QA queries and lab assay concerns raised by Buyers and Sellers.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#4338CA' }}>
          <ShieldCheck size={14} /> ADMIN QA AUTHORITY DESK
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'TOTAL QA QUERIES', val: totalCount, color: '#2563EB' },
          { label: 'PENDING ADMIN REVIEW', val: pendingCount, color: '#D97706' },
          { label: 'UNDER ADMIN REVIEW', val: underReviewCount, color: '#0284C7' },
          { label: 'APPROVED / RESOLVED', val: approvedCount, color: '#16A34A' },
          { label: 'REJECTED', val: rejectedCount, color: '#DC2626' },
        ].map((card, idx) => (
          <div key={idx} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar & Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search QA #, Subject, Ref #, Org..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 36, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ height: 36, padding: '0 10px', fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_REVIEW">Pending Admin Review</option>
              <option value="UNDER_REVIEW">Under Admin Review</option>
              <option value="APPROVED">Approved</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ height: 36, padding: '0 10px', fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF' }}
            >
              <option value="ALL">All Originating Roles</option>
              <option value="BUYER">Raised by Buyer</option>
              <option value="SUPPLIER">Raised by Seller/Supplier</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>QA Ref # &amp; Title</th>
                <th style={{ padding: '12px 16px' }}>Raised By</th>
                <th style={{ padding: '12px 16px' }}>Context Link</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>QA Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Governance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748B', fontSize: 13 }}>
                    No QA requests match your selected filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const badge = getStatusBadgeStyle(req.status);
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>{req.qaNumber}</div>
                        <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{req.subject}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{req.raisedByOrg}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          <span style={{ fontWeight: 800, color: req.raisedByRole === 'BUYER' ? '#2563EB' : '#0F766E' }}>[{req.raisedByRole}]</span> {req.raisedByName}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#334155' }}>
                          {req.contextType}: {req.contextNumber}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {req.category.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 11.5 }}>
                        {req.createdAt}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setAdminResponseText(req.adminResponse || '');
                            setRejectionReasonText(req.rejectionReason || '');
                          }}
                          style={{ padding: '6px 12px', background: '#4F46E5', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} /> Review &amp; Respond
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin QA Governance Review Modal */}
      {selectedReq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 680, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Admin Quality Assurance Governance Review</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{selectedReq.qaNumber} — {selectedReq.subject}</h3>
              </div>
              <button onClick={() => setSelectedReq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Request Meta Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><strong>Raised By:</strong> {selectedReq.raisedByOrg} ({selectedReq.raisedByName})</div>
              <div><strong>Originating Role:</strong> <span style={{ fontWeight: 800, color: selectedReq.raisedByRole === 'BUYER' ? '#2563EB' : '#0F766E' }}>{selectedReq.raisedByRole}</span></div>
              <div><strong>Context Link:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>{selectedReq.contextType} ({selectedReq.contextNumber})</span></div>
              <div><strong>Category:</strong> {selectedReq.category.replace('_', ' ')}</div>
              <div><strong>Submitted At:</strong> {selectedReq.createdAt}</div>
              <div>
                <strong>Current Status: </strong>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: getStatusBadgeStyle(selectedReq.status).bg, color: getStatusBadgeStyle(selectedReq.status).color }}>
                  {getStatusBadgeStyle(selectedReq.status).label}
                </span>
              </div>
            </div>

            {/* Description */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: 4 }}>QA Query / Issue Description:</div>
              <div style={{ fontSize: 13, color: '#1E293B', lineHeight: 1.5 }}>{selectedReq.description}</div>
              {selectedReq.attachmentName && (
                <div style={{ fontSize: 11.5, color: '#2563EB', fontWeight: 700, marginTop: 8 }}>
                  📎 Attached File: {selectedReq.attachmentName}
                </div>
              )}
            </div>

            {/* Admin Response & Governance Form */}
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>
                ADMIN QA OFFICIAL RESPONSE &amp; ACTION DECISION
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 4 }}>
                  Admin Quality Desk Response / Technical Resolution:
                </label>
                <textarea
                  rows={3}
                  value={adminResponseText}
                  onChange={e => setAdminResponseText(e.target.value)}
                  placeholder="Enter official response, lab assay guidelines, or compliance resolution details..."
                  style={{ width: '100%', padding: 10, fontSize: 12.5, borderRadius: 6, border: '1px solid #93C5FD', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #BFDBFE', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReq.id, 'UNDER_REVIEW', adminResponseText)}
                  style={{ padding: '7px 14px', background: '#E0F2FE', border: '1px solid #7DD3FC', color: '#0369A1', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Mark Under Review ⏳
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReq.id, 'APPROVED', adminResponseText)}
                  style={{ padding: '7px 16px', background: '#16A34A', border: 'none', color: '#FFF', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Approve QA ✓
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedReq.id, 'RESOLVED', adminResponseText)}
                  style={{ padding: '7px 16px', background: '#2563EB', border: 'none', color: '#FFF', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Resolve &amp; Close QA ✓
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const reason = prompt(`Enter QA Rejection Reason for ${selectedReq.qaNumber}:`, 'Assay purity fell below CDSCO pharmacopeial threshold limits');
                    if (reason && reason.trim()) {
                      handleUpdateStatus(selectedReq.id, 'REJECTED', adminResponseText, reason.trim());
                    }
                  }}
                  style={{ padding: '7px 16px', background: '#DC2626', border: 'none', color: '#FFF', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  Reject QA ❌
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
