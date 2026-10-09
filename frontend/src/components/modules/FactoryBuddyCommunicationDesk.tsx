import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getStoredQaRequests, saveQaRequests, RaiseQaModal } from './RaiseQaModal';
import { QaRequestItem, QaMessageThread } from '../../types';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  MessageSquare, Plus, Search, CheckCircle2, Clock, X, Paperclip,
  Send, User, ShieldCheck, ChevronRight, FileText, Filter, AlertCircle, RefreshCw, Layers
} from 'lucide-react';

export const FactoryBuddyCommunicationDesk: React.FC = () => {
  const { currentRole, addAuditLog } = useApp();

  const [requests, setRequests] = useState<QaRequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ADMIN_RESPONDED' | 'PENDING' | 'RESOLVED'>('ALL');
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');

  // Modal Controls
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState<boolean>(false);
  const [activeThreadItem, setActiveThreadItem] = useState<QaRequestItem | null>(null);

  // Reply Input State inside Thread Detail Modal
  const [replyText, setReplyText] = useState<string>('');
  const [replyAttachment, setReplyAttachment] = useState<string | null>(null);

  const loadData = () => {
    const data = getStoredQaRequests();
    setRequests(data);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSendReply = (reqId: string) => {
    if (!replyText.trim()) return;

    const nowStr = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const newMsg: QaMessageThread = {
      id: `msg-${Date.now()}`,
      senderRole: 'BUYER',
      senderName: 'Vikram Mehta (Procurement Lead)',
      senderOrg: 'Apex Pharma PCD Franchise',
      message: replyText.trim(),
      timestamp: nowStr,
      attachmentName: replyAttachment || undefined
    };

    const updatedRequests = requests.map(r => {
      if (r.id === reqId) {
        const existingMessages = r.messages || [
          {
            id: `msg-orig-${r.id}`,
            senderRole: r.raisedByRole,
            senderName: r.raisedByName,
            senderOrg: r.raisedByOrg,
            message: r.description,
            timestamp: r.createdAt,
            attachmentName: r.attachmentName
          }
        ];

        if (r.adminResponse && !existingMessages.some(m => m.senderRole === 'ADMIN')) {
          existingMessages.push({
            id: `msg-admin-${r.id}`,
            senderRole: 'ADMIN',
            senderName: r.reviewedBy || 'Admin Quality Governance Desk',
            senderOrg: 'FactoryGrid Admin QC',
            message: r.adminResponse,
            timestamp: r.reviewedAt || r.createdAt
          });
        }

        existingMessages.push(newMsg);

        return {
          ...r,
          status: 'PENDING_REVIEW' as const,
          messages: existingMessages
        };
      }
      return r;
    });

    saveQaRequests(updatedRequests);
    setRequests(updatedRequests);

    const updatedItem = updatedRequests.find(r => r.id === reqId) || null;
    setActiveThreadItem(updatedItem);

    setReplyText('');
    setReplyAttachment(null);

    if (addAuditLog) {
      addAuditLog('QA Workflow', `Buyer sent follow-up message on ${reqId}`);
    }
  };

  const filteredRequests = requests.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.qaNumber.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.contextNumber && r.contextNumber.toLowerCase().includes(q)) ||
      (r.productName && r.productName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ADMIN_RESPONDED') {
      return r.status === 'ADMIN_RESPONDED' || (r.adminResponse && r.status !== 'RESOLVED' && r.status !== 'CLOSED');
    }
    if (statusFilter === 'PENDING') {
      return r.status === 'PENDING_REVIEW' || r.status === 'UNDER_REVIEW';
    }
    if (statusFilter === 'RESOLVED') {
      return r.status === 'RESOLVED' || r.status === 'APPROVED' || r.status === 'CLOSED';
    }

    return true;
  });

  const adminRespondedCount = requests.filter(r => r.status === 'ADMIN_RESPONDED' || r.adminResponse).length;
  const pendingCount = requests.filter(r => r.status === 'PENDING_REVIEW' || r.status === 'UNDER_REVIEW').length;
  const resolvedCount = requests.filter(r => r.status === 'RESOLVED' || r.status === 'APPROVED' || r.status === 'CLOSED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <MessageSquare size={14} /> Factory Buddy Communication Desk
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Contact Factory Buddy
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Raise questions, track requests, and view responses from the Admin QA team in real-time.
          </p>
        </div>

        <button
          onClick={() => setIsRaiseModalOpen(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF',
            border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
          }}
        >
          <Plus size={16} /> + Raise New Query
        </button>
      </div>

      {/* ── 2. METRIC CARDS ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Queries</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{requests.length}</div>
        </div>

        <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>Admin Responded</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>{adminRespondedCount}</div>
        </div>

        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Open / Pending Response</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309', marginTop: 2 }}>{pendingCount}</div>
        </div>

        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Resolved / Closed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D', marginTop: 2 }}>{resolvedCount}</div>
        </div>
      </div>

      {/* ── 3. SEARCH & FILTER CONTROLS ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'relative', width: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by QA #, Subject, Order #..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
            {[
              { key: 'ALL', label: 'All Queries' },
              { key: 'ADMIN_RESPONDED', label: 'Admin Responded' },
              { key: 'PENDING', label: 'Open / Pending' },
              { key: 'RESOLVED', label: 'Resolved' }
            ].map(st => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key as any)}
                style={{
                  border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  background: statusFilter === st.key ? '#FFFFFF' : 'transparent',
                  color: statusFilter === st.key ? '#0F766E' : '#64748B',
                  boxShadow: statusFilter === st.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
        </div>
      </div>

      {/* ── 4. QUERY COMMUNICATION TABLE ─────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {displayMode === 'CARD' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredRequests.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', gridColumn: '1 / -1' }}>
                No queries match your search or filter criteria.
              </div>
            ) : (
              filteredRequests.map(item => {
                const isAdminResponded = item.status === 'ADMIN_RESPONDED';
                const isResolved = item.status === 'RESOLVED';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18,
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {item.id}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: isAdminResponded ? '#DCFCE7' : isResolved ? '#F1F5F9' : '#FEF3C7',
                          color: isAdminResponded ? '#15803D' : isResolved ? '#475569' : '#B45309',
                          border: isAdminResponded ? '1px solid #86EFAC' : isResolved ? '1px solid #CBD5E1' : '1px solid #FCD34D'
                        }}>
                          {isAdminResponded ? 'Admin Responded ✓' : isResolved ? 'Resolved' : 'Pending'}
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                        {item.subject}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div>Category: <strong>{item.category}</strong> · Priority: <strong style={{ color: item.priority === 'HIGH' || item.priority === 'URGENT' ? '#DC2626' : '#0F172A' }}>{item.priority}</strong></div>
                        <div>Context: <strong style={{ fontFamily: 'monospace' }}>{item.relatedContextNumber || item.relatedContextType}</strong></div>
                        <div>Created: {item.createdAt}</div>
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setActiveThreadItem(item)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                          fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        View Conversation →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Query ID</th>
                <th style={{ padding: '12px 16px' }}>Subject / Issue Title</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Related Order / Context</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Created Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  No queries match your search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredRequests.map(r => {
                const isAdminResponded = r.status === 'ADMIN_RESPONDED' || (r.adminResponse && r.status !== 'RESOLVED' && r.status !== 'CLOSED');

                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      {r.qaNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A', maxWidth: 240 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subject}</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>
                      {r.category.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#0F766E', fontWeight: 700, fontFamily: 'monospace' }}>
                      {r.contextNumber || r.contextId || 'General Inquiry'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                        background: r.priority === 'HIGH' || r.priority === 'CRITICAL' ? '#FEF2F2' : r.priority === 'MEDIUM' ? '#FFFBEB' : '#F1F5F9',
                        color: r.priority === 'HIGH' || r.priority === 'CRITICAL' ? '#DC2626' : r.priority === 'MEDIUM' ? '#D97706' : '#64748B',
                        border: r.priority === 'HIGH' || r.priority === 'CRITICAL' ? '1px solid #FCA5A5' : r.priority === 'MEDIUM' ? '1px solid #FDE68A' : '1px solid #CBD5E1'
                      }}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {isAdminResponded ? (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Admin Responded
                        </span>
                      ) : r.status === 'RESOLVED' || r.status === 'APPROVED' || r.status === 'CLOSED' ? (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          ✓ Resolved
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Open / Pending Admin Response
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                      {r.createdAt}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setActiveThreadItem(r)}
                        style={{ padding: '6px 14px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* ── 5. NEW QUERY MODAL ─────────────────────────────────────────── */}
      <RaiseQaModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        userRole="BUYER"
        userName="Vikram Mehta (Procurement Lead)"
        userOrg="Apex Pharma PCD Franchise"
        onSuccess={() => {
          setIsRaiseModalOpen(false);
          loadData();
        }}
      />

      {/* ── 6. THREAD / CONVERSATION DETAILS MODAL ────────────────────── */}
      {activeThreadItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 760, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Thread Header */}
            <div style={{ padding: '18px 24px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#14B8A6', fontFamily: 'monospace' }}>
                    {activeThreadItem.qaNumber}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                    {activeThreadItem.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: '4px 0 0', color: '#FFFFFF' }}>
                  {activeThreadItem.subject}
                </h3>
              </div>
              <button onClick={() => setActiveThreadItem(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Thread Meta Bar */}
            <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
              <div>
                Context: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeThreadItem.contextNumber || 'General Inquiry'}</strong> · Raised by: <strong>{activeThreadItem.raisedByName}</strong>
              </div>
              <div>
                Status: <span style={{ fontWeight: 800, color: activeThreadItem.adminResponse ? '#7C3AED' : '#B45309' }}>
                  {activeThreadItem.adminResponse ? 'Admin Responded ✓' : 'Open / Pending Response'}
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, background: '#FAFAFA' }}>
              
              {/* Original Buyer Query Message */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 12, padding: 16, alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} /> {activeThreadItem.raisedByName} (Buyer)
                  </span>
                  <span style={{ fontSize: 10.5, color: '#64748B' }}>{activeThreadItem.createdAt}</span>
                </div>
                <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {activeThreadItem.description}
                </div>
                {activeThreadItem.attachmentName && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #CCFBF1', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#0F766E' }}>
                    <Paperclip size={13} /> Attachment: {activeThreadItem.attachmentName}
                  </div>
                )}
              </div>

              {/* Admin QA Response (if available) */}
              {activeThreadItem.adminResponse && (
                <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: 16, alignSelf: 'flex-end', maxWidth: '85%', boxShadow: '0 2px 6px rgba(124,58,237,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={14} style={{ color: '#7C3AED' }} /> {activeThreadItem.reviewedBy || 'Admin Quality Governance Desk'} (Admin QA Desk)
                    </span>
                    <span style={{ fontSize: 10.5, color: '#64748B' }}>{activeThreadItem.reviewedAt || '24 Aug 2026 11:00 AM'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {activeThreadItem.adminResponse}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 10.5, fontWeight: 700, color: '#7C3AED' }}>
                    ✓ Verified & Approved by Central Quality Office
                  </div>
                </div>
              )}

              {/* Additional Follow-up Threads */}
              {activeThreadItem.messages?.map(m => (
                <div
                  key={m.id}
                  style={{
                    background: m.senderRole === 'BUYER' ? '#F0FDFA' : '#F5F3FF',
                    border: m.senderRole === 'BUYER' ? '1px solid #99F6E4' : '1px solid #DDD6FE',
                    borderRadius: 12, padding: 16,
                    alignSelf: m.senderRole === 'BUYER' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: m.senderRole === 'BUYER' ? '#0F766E' : '#6D28D9', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {m.senderRole === 'BUYER' ? <User size={13} /> : <ShieldCheck size={14} />} {m.senderName} ({m.senderRole})
                    </span>
                    <span style={{ fontSize: 10.5, color: '#64748B' }}>{m.timestamp}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#0F172A', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {m.message}
                  </div>
                </div>
              ))}

            </div>

            {/* Reply Form */}
            <div style={{ padding: 16, background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                Send Follow-up Message to Admin QA Desk:
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <textarea
                  rows={2}
                  placeholder="Type your reply or question..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', resize: 'none' }}
                />
                <button
                  onClick={() => handleSendReply(activeThreadItem.id)}
                  disabled={!replyText.trim()}
                  style={{
                    padding: '0 20px', borderRadius: 8, background: replyText.trim() ? '#0F766E' : '#CBD5E1',
                    color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13,
                    cursor: replyText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Send size={14} /> Send Reply
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
