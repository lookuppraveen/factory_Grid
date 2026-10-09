import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder, AdvanceMethod } from '../../types';
import { ShoppingBag, Search, Eye, X, CheckCircle2, Clock, RefreshCw, Send, ShieldCheck, CheckSquare, Square, PauseCircle, AlertTriangle, Star, Lock, ThumbsUp, ThumbsDown, CreditCard, IndianRupee, ChevronDown } from 'lucide-react';
import { AdvancePaymentSection } from '../common/AdvancePaymentSection';
import { EnterpriseMetricBar } from '../common/EnterpriseMetricBar';

export const AdminOrderMonitor: React.FC = () => {
  const {
    orders, currentRole, regeneratePO, submitPOToBuyer, setActiveTab,
    placeOrderOnHold, releaseOrderHold, getApplicableMargin, platformFeeConfig,
    approveMasterOrderAdmin, rejectMasterOrderAdmin
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [adminBanner, setAdminBanner] = useState<string | null>(null);
  const [adminBannerType, setAdminBannerType] = useState<'success' | 'error'>('success');
  const [qaCounter, setQaCounter] = useState(0);

  // Hold Action States
  const [holdTargetOrder, setHoldTargetOrder] = useState<MasterOrder | null>(null);
  const [holdReasonText, setHoldReasonText] = useState('');

  // Admin Approval Modal State (NEW: full PO Approval Workflow)
  const [approvalTargetOrder, setApprovalTargetOrder] = useState<MasterOrder | null>(null);
  const [approvalStep, setApprovalStep] = useState<'REVIEW' | 'ADVANCE_CONFIG' | 'REJECT'>('REVIEW');
  const [approvalDecision, setApprovalDecision] = useState<'YES' | 'NO' | null>(null);
  const [advRequired, setAdvRequired] = useState<boolean>(true);
  const [advMethod, setAdvMethod] = useState<AdvanceMethod>('PERCENTAGE');
  const [advPct, setAdvPct] = useState<number>(30);
  const [advFixedAmount, setAdvFixedAmount] = useState<number>(0);
  const [advDueDate, setAdvDueDate] = useState<string>('');
  const [advNotes, setAdvNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  const UNIFIED_STORAGE_KEY = 'factorygrid_unified_suborders_v11';

  // Synchronize selected line IDs when opening an order in the PO Review modal
  useEffect(() => {
    if (selectedOrder) {
      const active = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
      const ids: string[] = [];
      (active.subOrders || []).forEach(so => {
        (so.lines || []).forEach((l, idx) => {
          ids.push(l.id || l.productId || `${so.subOrderNumber}-line-${idx}`);
        });
      });
      setSelectedLineIds(ids);
    }
  }, [selectedOrder, orders]);

  const getSubOrderQaState = (subCode: string) => {
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      const store = saved ? JSON.parse(saved) : {};
      return store[subCode] || {};
    } catch (e) {
      return {};
    }
  };

  const updateSubOrderQaStatus = (
    subCode: string,
    newQaStatus: 'PENDING_QA' | 'UNDER_QA_REVIEW' | 'QA_APPROVED' | 'QA_REJECTED',
    rejectionReason?: string
  ) => {
    let store: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(UNIFIED_STORAGE_KEY);
      if (saved) store = JSON.parse(saved);
    } catch (e) {}

    const targetRec = store[subCode] || {};
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    store[subCode] = {
      ...targetRec,
      subOrderNumber: subCode,
      qaStatus: newQaStatus,
      qaRejectionReason: newQaStatus === 'QA_REJECTED' ? (rejectionReason || 'Assay purity fell below CDSCO pharmacopeial standards limit') : (targetRec.qaRejectionReason || ''),
      qaReviewedAt: nowStr,
      qaReviewedBy: 'Admin Quality Governance Desk'
    };

    try {
      localStorage.setItem(UNIFIED_STORAGE_KEY, JSON.stringify(store));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
    setQaCounter(prev => prev + 1);
  };

  // Filter States (Section 17)
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [advanceFilter, setAdvanceFilter] = useState<'ALL' | 'NOT_REQUIRED' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [poStatusFilter, setPoStatusFilter] = useState<'ALL' | 'AWAITING_ADVANCE' | 'CONFIRMED_RELEASED' | 'REJECTED' | 'ON_HOLD'>('ALL');

  const totalOrdersCount = orders.length;
  const totalGmv = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const pendingApprovalCount = orders.filter(o => o.status === 'PENDING_ADMIN_APPROVAL' || o.adminApprovalStatus === 'PENDING').length;
  const pendingAdvanceCount = orders.filter(o => o.status === 'PENDING_ADVANCE' && (o.advanceStatus === 'PENDING' || o.advanceStatus === 'PARTIALLY_PAID')).length;
  const totalAdvanceOutstanding = orders.reduce((s, o) => s + (o.advanceOutstanding || 0), 0);
  const totalAdvanceReceived = orders.reduce((s, o) => s + (o.advanceReceived || 0), 0);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter(o => {
      // 1. Search term
      if (term) {
        const matchOrderNum = (o.orderNumber || '').toLowerCase().includes(term);
        const matchPoNum = (o.poNumber || '').toLowerCase().includes(term);
        const matchRfqNum = (o.rfqNumber || '').toLowerCase().includes(term);
        const matchCustName = (o.customerName || '').toLowerCase().includes(term);
        const matchCustCode = (o.customerCode || '').toLowerCase().includes(term);
        const matchSubOrders = (o.subOrders || []).some(so =>
          (so.poNumber || '').toLowerCase().includes(term) ||
          (so.subOrderNumber || '').toLowerCase().includes(term) ||
          (so.rfqNumber || '').toLowerCase().includes(term) ||
          (so.manufacturerName || '').toLowerCase().includes(term) ||
          (so.lines || []).some(l =>
            (l.productName || '').toLowerCase().includes(term) ||
            (l.molecule || '').toLowerCase().includes(term)
          )
        );
        if (!matchOrderNum && !matchPoNum && !matchRfqNum && !matchCustName && !matchCustCode && !matchSubOrders) {
          return false;
        }
      }

      // 2. PO Approval Filter
      const isApproved = o.adminApprovalStatus === 'APPROVED' || o.status === 'CONFIRMED_RELEASED' || o.status === 'PENDING_ADVANCE';
      const isRejected = o.status === 'REJECTED_BY_ADMIN' || o.adminApprovalStatus === 'REJECTED';
      const isPending = o.status === 'PENDING_ADMIN_APPROVAL' || o.adminApprovalStatus === 'PENDING' || (!isApproved && !isRejected);

      if (approvalFilter === 'PENDING' && !isPending) return false;
      if (approvalFilter === 'APPROVED' && !isApproved) return false;
      if (approvalFilter === 'REJECTED' && !isRejected) return false;

      // 3. Advance Payment Filter
      if (advanceFilter === 'NOT_REQUIRED' && !(o.advanceRequired === false || o.advanceStatus === 'NOT_REQUIRED')) return false;
      if (advanceFilter === 'PENDING' && !(o.advanceStatus === 'PENDING' && o.status === 'PENDING_ADVANCE')) return false;
      if (advanceFilter === 'PARTIALLY_PAID' && o.advanceStatus !== 'PARTIALLY_PAID') return false;
      if (advanceFilter === 'PAID' && o.advanceStatus !== 'PAID') return false;

      // 4. PO Status Filter
      const isHeld = o.isOnHold || o.status === 'ON_HOLD';
      if (poStatusFilter === 'ON_HOLD' && !isHeld) return false;
      if (poStatusFilter === 'AWAITING_ADVANCE' && o.status !== 'PENDING_ADVANCE') return false;
      if (poStatusFilter === 'CONFIRMED_RELEASED' && o.status !== 'CONFIRMED_RELEASED') return false;
      if (poStatusFilter === 'REJECTED' && !isRejected) return false;

      return true;
    });
  }, [orders, searchTerm, approvalFilter, advanceFilter, poStatusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Global Notification Banner */}
      {adminBanner && (
        <div style={{ background: adminBannerType === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${adminBannerType === 'error' ? '#FCA5A5' : '#86EFAC'}`, borderRadius: 10, padding: '12px 18px', color: adminBannerType === 'error' ? '#DC2626' : '#15803D', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{adminBanner}</span>
          <button onClick={() => setAdminBanner(null)} style={{ background: 'none', border: 'none', color: adminBannerType === 'error' ? '#DC2626' : '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Header (Clean Enterprise Flat Command Bar) */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, padding: '18px 24px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <ShoppingBag size={14} /> Order Governance Desk · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Master Orders &amp; Purchase Order (PO) Management Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Governance console for reviewing auto-generated POs, selecting product lines, managing hold status, regenerating PO parameters, and submitting POs to Buyers.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setActiveTab('qa-governance')}
            style={{ padding: '8px 16px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', borderRadius: 6, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={16} /> 🛡️ Open Central QA Desk
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#15803D' }}>
            <CheckCircle2 size={14} /> ADMIN PO WORKFLOW DESK
          </div>
        </div>
      </div>

      {/* PO & Advance Payment Summary Bar (Replaces 6 Floating Cards) */}
      <EnterpriseMetricBar
        title="PURCHASE ORDER & ADVANCE PAYMENT MONITORING"
        subtitle="Platform PO Governance & Advance Settlement Tracking"
        metrics={[
          { label: 'Pending PO Approvals', value: pendingApprovalCount, color: '#D97706' },
          { label: 'Advance Pending', value: pendingAdvanceCount, color: '#DC2626' },
          { label: 'Advance Received', value: `₹${(totalAdvanceReceived / 100000).toFixed(1)}L`, color: '#0F766E' },
          { label: 'Advance Outstanding', value: `₹${(totalAdvanceOutstanding / 100000).toFixed(1)}L`, color: '#7C3AED' },
          { label: 'Total Master Orders', value: totalOrdersCount, color: '#2563EB' },
          { label: 'Total GMV', value: `₹${(totalGmv / 100000).toFixed(1)}L`, color: '#16A34A' },
        ]}
      />

      {/* Table & Filters Toolbar (Standard Enterprise Section) */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by PO #, Customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {/* Filter 1: PO Approval */}
            <select
              value={approvalFilter}
              onChange={e => setApprovalFilter(e.target.value as any)}
              style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 600, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF', color: '#334155' }}
            >
              <option value="ALL">PO Approval: All</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Filter 2: Advance Payment */}
            <select
              value={advanceFilter}
              onChange={e => setAdvanceFilter(e.target.value as any)}
              style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 600, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF', color: '#334155' }}
            >
              <option value="ALL">Advance: All</option>
              <option value="NOT_REQUIRED">Not Required</option>
              <option value="PENDING">Payment Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>

            {/* Filter 3: PO Status */}
            <select
              value={poStatusFilter}
              onChange={e => setPoStatusFilter(e.target.value as any)}
              style={{ height: 34, padding: '0 10px', fontSize: 12, fontWeight: 600, border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF', color: '#334155' }}
            >
              <option value="ALL">PO Status: All</option>
              <option value="AWAITING_ADVANCE">Awaiting Advance Payment</option>
              <option value="CONFIRMED_RELEASED">Confirmed & Released</option>
              <option value="REJECTED">Rejected</option>
              <option value="ON_HOLD">On Hold</option>
            </select>

            {(approvalFilter !== 'ALL' || advanceFilter !== 'ALL' || poStatusFilter !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setApprovalFilter('ALL');
                  setAdvanceFilter('ALL');
                  setPoStatusFilter('ALL');
                  setSearchTerm('');
                }}
                style={{ height: 34, padding: '0 12px', fontSize: 11.5, fontWeight: 700, border: '1px solid #E2E8F0', borderRadius: 6, background: '#F1F5F9', color: '#64748B', cursor: 'pointer' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>1. PO / MASTER ORDER</th>
                <th style={{ padding: '12px 16px' }}>2. CUSTOMER</th>
                <th style={{ padding: '12px 16px' }}>3. CREATED DATE</th>
                <th style={{ padding: '12px 16px' }}>4. EXPECTED DELIVERY</th>
                <th style={{ padding: '12px 16px' }}>5. TOTAL AMOUNT</th>
                <th style={{ padding: '12px 16px' }}>6. PO APPROVAL</th>
                <th style={{ padding: '12px 16px' }}>7. ADVANCE PAYMENT</th>
                <th style={{ padding: '12px 16px' }}>8. PO STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>9. ADMIN ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8' }}>
                    No purchase orders found matching the filter criteria.
                  </td>
                </tr>
              ) : filteredOrders.map(ord => {
                const isHeld = ord.isOnHold || ord.status === 'ON_HOLD';
                const isApproved = ord.adminApprovalStatus === 'APPROVED' || ord.status === 'CONFIRMED_RELEASED' || ord.status === 'PENDING_ADVANCE';
                const isRejected = ord.status === 'REJECTED_BY_ADMIN' || ord.adminApprovalStatus === 'REJECTED';
                const isPending = ord.status === 'PENDING_ADMIN_APPROVAL' || ord.adminApprovalStatus === 'PENDING' || (!isApproved && !isRejected);

                return (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9', background: isHeld ? '#FFFDFD' : 'transparent' }}>
                    {/* 1. PO / MASTER ORDER */}
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {ord.poNumber || ord.orderNumber}
                      <div style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace', fontWeight: 500 }}>
                        Ref: {ord.orderNumber} {ord.rfqNumber && `· RFQ: ${ord.rfqNumber}`}
                      </div>
                      {ord.isGeneric && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', marginTop: 3, display: 'inline-block' }}>
                          🧪 GENERIC (FACTORYGRID DIRECT)
                        </span>
                      )}
                    </td>

                    {/* 2. CUSTOMER */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{ord.customerName}</span>
                        {ord.customerClassification === 'SPECIAL_PARTY' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                            <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 10, fontWeight: 700 }}>
                            REGULAR
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. CREATED DATE */}
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.createdDate}</td>

                    {/* 4. EXPECTED DELIVERY */}
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.expectedDeliveryDate}</td>

                    {/* 5. TOTAL AMOUNT */}
                    <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                      ₹{ord.totalAmount?.toLocaleString()}
                    </td>

                    {/* 6. PO APPROVAL (Section 1 & 15) */}
                    <td style={{ padding: '12px 16px' }}>
                      {isApproved ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                          APPROVED
                        </span>
                      ) : isRejected ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF2F2', color: '#DC2626' }}>
                          REJECTED
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                          PENDING APPROVAL
                        </span>
                      )}
                    </td>

                    {/* 7. ADVANCE PAYMENT (Section 1 & 15) */}
                    <td style={{ padding: '12px 16px' }}>
                      {!isApproved ? (
                        /* CRITICAL: Advance Payment MUST NOT appear as an actionable decision before Admin approves the PO */
                        <span style={{ color: '#94A3B8', fontWeight: 800, fontSize: 14 }}>—</span>
                      ) : (ord.advanceRequired === false || ord.advanceStatus === 'NOT_REQUIRED') ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                          NOT REQUIRED
                        </span>
                      ) : ord.advanceStatus === 'PAID' ? (
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                            PAID
                          </span>
                          <div style={{ fontSize: 10.5, color: '#15803D', marginTop: 3, fontFamily: 'monospace', fontWeight: 600 }}>
                            ₹{(ord.advanceReceived || 0).toLocaleString()} (Full)
                          </div>
                        </div>
                      ) : ord.advanceStatus === 'PARTIALLY_PAID' ? (
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                            PARTIALLY PAID
                          </span>
                          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 3, fontFamily: 'monospace' }}>
                            ₹{(ord.advanceReceived || 0).toLocaleString()} / ₹{(ord.requiredAdvanceAmount || 0).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                            PAYMENT PENDING
                          </span>
                          <div style={{ fontSize: 10.5, color: '#DC2626', marginTop: 3, fontFamily: 'monospace', fontWeight: 700 }}>
                            ₹{(ord.requiredAdvanceAmount || 0).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 8. PO STATUS (Section 1, 14, 15) */}
                    <td style={{ padding: '12px 16px' }}>
                      {isHeld ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF2F2', color: '#DC2626' }}>
                          ON HOLD
                        </span>
                      ) : isRejected ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF2F2', color: '#DC2626' }}>
                          REJECTED
                        </span>
                      ) : isPending ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309' }}>
                          AWAITING ADMIN APPROVAL
                        </span>
                      ) : ord.status === 'PENDING_ADVANCE' ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                          AWAITING ADVANCE PAYMENT
                        </span>
                      ) : ord.status === 'CONFIRMED_RELEASED' ? (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                          CONFIRMED &amp; RELEASED
                        </span>
                      ) : (
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                          {ord.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    {/* 9. ADMIN ACTIONS (Section 1, 20) */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Primary Review PO button for pending approval */}
                        {isPending && (
                          <button
                            onClick={() => {
                              setApprovalTargetOrder(ord);
                              setApprovalStep('REVIEW');
                              setApprovalDecision(null);
                              setRejectReason('');
                              setAdvMethod('PERCENTAGE');
                              setAdvPct(30);
                              setAdvFixedAmount(Math.round((ord.totalAmount || 0) * 0.3));
                              setAdvDueDate('');
                              setAdvNotes('');
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#0F766E',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 1px 2px rgba(15, 118, 110, 0.2)'
                            }}
                            title="Review PO — Approve or Reject"
                          >
                            <ShieldCheck size={13} /> Review PO
                          </button>
                        )}

                        {/* Hold / Release Hold Button */}
                        {isHeld ? (
                          <button
                            onClick={() => {
                              releaseOrderHold(ord.id);
                              setAdminBanner(`✓ Master Order ${ord.orderNumber} released from HOLD.`);
                            }}
                            style={{ padding: '5px 10px', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title={ord.holdReason ? `Held: ${ord.holdReason}` : 'Order currently on hold'}
                          >
                            <Clock size={12} /> Release Hold
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setHoldTargetOrder(ord);
                              setHoldReasonText('');
                            }}
                            style={{ padding: '5px 10px', background: '#FFF', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <PauseCircle size={12} /> Hold
                          </button>
                        )}

                        {/* View PO Details */}
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          style={{ padding: '5px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={12} /> View PO
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MANDATORY HOLD REASON NOTE MODAL ── */}
      {holdTargetOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 480, padding: 22, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Hold Reason Note</h3>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Master Order: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{holdTargetOrder.orderNumber}</span></div>
                </div>
              </div>
              <button
                onClick={() => {
                  setHoldTargetOrder(null);
                  setHoldReasonText('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Hold Reason Note <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={holdReasonText}
                onChange={e => setHoldReasonText(e.target.value)}
                placeholder="Enter mandatory reason for placing this order on hold (e.g. Quality assay discrepancy, customer credit check, pricing re-evaluation)..."
                style={{
                  width: '100%',
                  padding: 10,
                  fontSize: 12.5,
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                A valid reason is mandatory. Recording a hold will increment the order's Hold Count.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setHoldTargetOrder(null);
                  setHoldReasonText('');
                }}
                style={{ padding: '8px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!holdReasonText.trim()}
                onClick={() => {
                  if (!holdReasonText.trim()) return;
                  placeOrderOnHold(holdTargetOrder.id, holdReasonText.trim());
                  const newCount = (holdTargetOrder.holdCount || 0) + 1;
                  setAdminBanner(`✓ Master Order ${holdTargetOrder.orderNumber} has been placed on HOLD (Hold Count: ${newCount}).`);
                  setHoldTargetOrder(null);
                  setHoldReasonText('');
                }}
                style={{
                  padding: '8px 18px',
                  background: holdReasonText.trim() ? '#DC2626' : '#94A3B8',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: holdReasonText.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease'
                }}
              >
                Confirm &amp; Place on Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN PO APPROVAL WORKFLOW MODAL (Sections 2, 3, 4, 5, 6) ── */}
      {approvalTargetOrder && (() => {
        const ao = orders.find(o => o.id === approvalTargetOrder.id) || approvalTargetOrder;
        const totalAmt = ao.totalAmount || 0;
        const computedAdvance = advMethod === 'FIXED_AMOUNT' ? advFixedAmount : Math.round((totalAmt * advPct) / 100);

        // Gather all line items across sub-orders or order lines
        const allItems: Array<{ id: string; productName: string; sku?: string; quantity: number; unitPrice: number; taxRate?: number; lineTotal: number }> = [];
        (ao.subOrders || []).forEach(so => {
          (so.lines || []).forEach(l => {
            const qty = l.quantity || 1;
            const price = l.unitPrice || 0;
            const tax = Math.round(price * qty * 0.12);
            allItems.push({
              id: l.id,
              productName: l.productName || 'Pharmaceutical Formulation',
              sku: (l as any).sku || `SKU-${l.productId || 'PHARMA'}`,
              quantity: qty,
              unitPrice: price,
              taxRate: 12,
              lineTotal: l.totalPrice || (qty * price + tax)
            });
          });
        });

        // Fallback demo items if order has no explicit suborder lines
        if (allItems.length === 0) {
          allItems.push({
            id: 'line-demo-1',
            productName: 'Paracetamol 500mg Tablets BP',
            sku: 'SKU-PCM-500',
            quantity: 50000,
            unitPrice: 12.00,
            taxRate: 12,
            lineTotal: 672000
          });
          allItems.push({
            id: 'line-demo-2',
            productName: 'Azithromycin 500mg Tablets USP',
            sku: 'SKU-AZI-500',
            quantity: 10000,
            unitPrice: 29.28,
            taxRate: 12,
            lineTotal: 328000
          });
        }

        const subtotal = allItems.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
        const taxTotal = Math.round(subtotal * 0.12);
        const grandTotal = totalAmt > 0 ? totalAmt : (subtotal + taxTotal);

        const closeModal = () => {
          setApprovalTargetOrder(null);
          setApprovalStep('REVIEW');
          setApprovalDecision(null);
        };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 720, padding: 26, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.35)', maxHeight: '92vh', overflowY: 'auto' }}>

              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ADMIN PO WORKFLOW DESK · {approvalStep === 'REVIEW' ? 'PO REVIEW' : approvalStep === 'ADVANCE_CONFIG' ? 'ADVANCE PAYMENT DECISION' : 'REJECT PO'}
                  </div>
                  <h3 style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                    {ao.poNumber || ao.orderNumber}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    Customer: <strong style={{ color: '#334155' }}>{ao.customerName}</strong> ({ao.customerClassification || 'REGULAR'})
                  </div>
                </div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* ── STEP 1: REVIEW PO (Section 2 & 3) ── */}
              {approvalStep === 'REVIEW' && (
                <>
                  {/* PO Basic Info Grid */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 12 }}>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>PO Number</div>
                      <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: 2 }}>{ao.poNumber || ao.orderNumber}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>Customer Name</div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{ao.customerName}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>Customer Type</div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{ao.customerClassification || 'REGULAR'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>Created Date</div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{ao.createdDate}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>Expected Delivery</div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{ao.expectedDeliveryDate}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748B', fontWeight: 600 }}>PO Total Amount</div>
                      <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F766E', fontSize: 14, marginTop: 2 }}>₹{grandTotal.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                      Order Items
                    </div>
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700 }}>
                            <th style={{ padding: '8px 12px' }}>Product</th>
                            <th style={{ padding: '8px 12px' }}>SKU</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Quantity</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Tax (12%)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allItems.map((item, idx) => (
                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{item.productName}</td>
                              <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#64748B' }}>{item.sku}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{item.quantity.toLocaleString()}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>₹{item.unitPrice.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#64748B' }}>₹{Math.round(item.unitPrice * item.quantity * 0.12).toLocaleString()}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>₹{item.lineTotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Summary & Terms */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 800, color: '#334155', marginBottom: 4, textTransform: 'uppercase', fontSize: 11 }}>Customer &amp; Delivery Info</div>
                      <div><span style={{ color: '#64748B' }}>Shipping:</span> <strong>{ao.shippingAddress || 'Plot 14, Phase I Industrial Area, Delhi - 110020'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Billing:</span> <strong>{ao.billingAddress || 'Connaught Place Corporate Office, New Delhi - 110001'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Payment Terms:</span> <strong>{ao.paymentTerms || '30% Advance + Net 30 days'}</strong></div>
                    </div>

                    <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 800, color: '#0F766E', marginBottom: 4, textTransform: 'uppercase', fontSize: 11 }}>Order Summary</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Subtotal:</span>
                        <strong style={{ fontFamily: 'monospace' }}>₹{subtotal.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>GST (12%):</span>
                        <strong style={{ fontFamily: 'monospace' }}>₹{taxTotal.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #99F6E4', paddingTop: 6, fontSize: 13.5 }}>
                        <span style={{ fontWeight: 800, color: '#0F172A' }}>Grand Total:</span>
                        <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>₹{grandTotal.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ADMIN DECISION (Section 3) */}
                  <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 14 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'center' }}>
                      ADMIN DECISION
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <button
                        onClick={() => setApprovalStep('REJECT')}
                        style={{
                          flex: 1,
                          padding: '12px 18px',
                          background: '#FFF',
                          border: '2px solid #FCA5A5',
                          color: '#DC2626',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ThumbsDown size={16} /> Reject PO
                      </button>
                      <button
                        onClick={() => {
                          setApprovalStep('ADVANCE_CONFIG');
                          setApprovalDecision(null); // CRITICAL: Do not preselect either option
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 18px',
                          background: '#0F766E',
                          border: 'none',
                          color: '#FFF',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.3)'
                        }}
                      >
                        <ThumbsUp size={16} /> Approve PO
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP: REJECT PURCHASE ORDER (Section 3) ── */}
              {approvalStep === 'REJECT' && (
                <>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', fontSize: 12.5, color: '#991B1B', fontWeight: 600 }}>
                    <strong>Reject Purchase Order:</strong> The buyer will receive a formal rejection notification along with your entered reason.
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Reason for Rejection <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason (e.g. Unit price discrepancy against agreed quote, compliance failure, credit terms limit exceeded, requested delivery timeline cannot be met)..."
                      style={{ width: '100%', padding: 12, fontSize: 12.5, borderRadius: 8, border: '1px solid #FCA5A5', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                    <button
                      onClick={() => setApprovalStep('REVIEW')}
                      style={{ padding: '9px 18px', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!rejectReason.trim()}
                      onClick={() => {
                        if (!rejectReason.trim()) return;
                        const result = rejectMasterOrderAdmin(ao.id, rejectReason.trim());
                        if (result.success) {
                          setAdminBannerType('error');
                          setAdminBanner(`✕ Purchase Order ${ao.poNumber || ao.orderNumber} has been REJECTED. Buyer has been notified.`);
                          closeModal();
                        }
                      }}
                      style={{
                        padding: '9px 22px',
                        background: rejectReason.trim() ? '#DC2626' : '#94A3B8',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: rejectReason.trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2: ADVANCE PAYMENT DECISION & CONFIGURATION (Sections 4 & 5) ── */}
              {approvalStep === 'ADVANCE_CONFIG' && (
                <>
                  {/* PO APPROVED Banner */}
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#15803D' }}>
                    <CheckCircle2 size={20} color="#15803D" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>PO APPROVED ✓</div>
                      <div style={{ fontSize: 11.5 }}>Purchase order has been validated. Now decide if an advance payment is required from the buyer.</div>
                    </div>
                  </div>

                  {/* Advance Payment Required? [ YES ] [ NO ] (Section 4: Do not preselect either option) */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textAlign: 'center', marginBottom: 12 }}>
                      Advance Payment Required?
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovalDecision('YES');
                          setAdvRequired(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 18px',
                          background: approvalDecision === 'YES' ? '#0F766E' : '#FFF',
                          color: approvalDecision === 'YES' ? '#FFF' : '#0F766E',
                          border: `2px solid ${approvalDecision === 'YES' ? '#0F766E' : '#99F6E4'}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        ✓ YES
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovalDecision('NO');
                          setAdvRequired(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '12px 18px',
                          background: approvalDecision === 'NO' ? '#475569' : '#FFF',
                          color: approvalDecision === 'NO' ? '#FFF' : '#475569',
                          border: `2px solid ${approvalDecision === 'NO' ? '#475569' : '#CBD5E1'}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        ✗ NO
                      </button>
                    </div>
                  </div>

                  {/* ── IF ADMIN SELECTS NO (Section 4) ── */}
                  {approvalDecision === 'NO' && (
                    <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>Advance Payment:</span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#E2E8F0', color: '#334155' }}>
                          NOT REQUIRED
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        This purchase order will be marked as <strong>CONFIRMED &amp; RELEASED</strong> immediately without requiring any upfront advance deposit.
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                        <button onClick={() => setApprovalStep('REVIEW')} style={{ padding: '8px 16px', background: '#FFF', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ← Back
                        </button>
                        <button
                          onClick={() => {
                            const result = approveMasterOrderAdmin(ao.id, { advanceRequired: false });
                            if (result.success) {
                              setAdminBannerType('success');
                              setAdminBanner(`✓ Purchase Order ${ao.poNumber || ao.orderNumber} Approved & Released! Advance Payment: NOT REQUIRED.`);
                              closeModal();
                            }
                          }}
                          style={{ padding: '10px 24px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Confirm Approval &amp; Release PO
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── IF ADMIN SELECTS YES (Section 5) ── */}
                  {approvalDecision === 'YES' && (
                    <div style={{ background: '#FFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ADVANCE PAYMENT CONFIGURATION
                      </div>

                      {/* Advance Payment Type: ( ) Percentage  ( ) Fixed Amount */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Advance Payment Type:</div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="advType"
                              checked={advMethod === 'PERCENTAGE'}
                              onChange={() => setAdvMethod('PERCENTAGE')}
                              style={{ accentColor: '#0F766E' }}
                            />
                            Percentage
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="advType"
                              checked={advMethod === 'FIXED_AMOUNT'}
                              onChange={() => {
                                setAdvMethod('FIXED_AMOUNT');
                                if (advFixedAmount <= 0) setAdvFixedAmount(Math.round((totalAmt * 30) / 100));
                              }}
                              style={{ accentColor: '#0F766E' }}
                            />
                            Fixed Amount
                          </label>
                        </div>
                      </div>

                      {/* Percentage Input & Auto-Calculation */}
                      {advMethod === 'PERCENTAGE' ? (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Advance Percentage:
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={advPct}
                              onChange={e => setAdvPct(Math.min(Math.max(Number(e.target.value) || 0, 1), 100))}
                              style={{ width: 90, height: 36, padding: '0 10px', fontSize: 13, fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: 6, textAlign: 'center' }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>%</span>
                          </div>
                          {/* Auto Calculation Display (Section 5) */}
                          <div style={{ marginTop: 10, padding: 12, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, fontSize: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            <div>
                              <div style={{ color: '#64748B' }}>PO Total:</div>
                              <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', marginTop: 2 }}>₹{totalAmt.toLocaleString()}</div>
                            </div>
                            <div>
                              <div style={{ color: '#64748B' }}>Advance:</div>
                              <div style={{ fontWeight: 800, color: '#0F766E', marginTop: 2 }}>{advPct}%</div>
                            </div>
                            <div>
                              <div style={{ color: '#64748B' }}>Advance Amount:</div>
                              <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#DC2626', fontSize: 13.5, marginTop: 2 }}>₹{computedAdvance.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Advance Amount:
                          </label>
                          <div style={{ position: 'relative', maxWidth: 280 }}>
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748B' }}>₹</span>
                            <input
                              type="number"
                              min={1}
                              max={totalAmt}
                              value={advFixedAmount}
                              onChange={e => setAdvFixedAmount(Math.min(Number(e.target.value) || 0, totalAmt))}
                              placeholder="Enter advance amount"
                              style={{ width: '100%', height: 36, paddingLeft: 26, paddingRight: 10, fontSize: 13, fontWeight: 700, border: '1px solid #CBD5E1', borderRadius: 6, boxSizing: 'border-box' }}
                            />
                          </div>
                          {advFixedAmount > totalAmt && (
                            <div style={{ color: '#DC2626', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                              Advance amount cannot exceed the PO total amount (₹{totalAmt.toLocaleString()}).
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Due Date & Terms */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Payment Due Date:
                          </label>
                          <input
                            type="date"
                            value={advDueDate}
                            onChange={e => setAdvDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                            Payment Terms / Notes:
                          </label>
                          <input
                            type="text"
                            value={advNotes}
                            onChange={e => setAdvNotes(e.target.value)}
                            placeholder="Optional text to buyer..."
                            style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Payment Gateway: Razorpay */}
                      <div style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#64748B', fontWeight: 600 }}>Payment Gateway:</span>
                        <span style={{ fontWeight: 800, color: '#0F766E', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CreditCard size={14} /> Razorpay (UPI, Cards, Net Banking)
                        </span>
                      </div>

                      {/* Confirm & Request Advance Payment Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                        <button onClick={() => setApprovalStep('REVIEW')} style={{ padding: '8px 16px', background: '#FFF', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ← Back
                        </button>
                        <button
                          disabled={computedAdvance <= 0 || computedAdvance > totalAmt}
                          onClick={() => {
                            const result = approveMasterOrderAdmin(ao.id, {
                              advanceRequired: true,
                              advanceMethod: advMethod,
                              advancePercentage: advMethod === 'PERCENTAGE' ? advPct : undefined,
                              fixedAmount: advMethod === 'FIXED_AMOUNT' ? advFixedAmount : undefined,
                              advanceDueDate: advDueDate || undefined,
                              advanceNotes: advNotes || undefined
                            });
                            if (result.success) {
                              setAdminBannerType('success');
                              setAdminBanner(`✓ PO ${ao.poNumber || ao.orderNumber} Approved! Advance payment of ₹${computedAdvance.toLocaleString()} requested from buyer via Razorpay.`);
                              closeModal();
                            }
                          }}
                          style={{
                            padding: '10px 24px',
                            background: (computedAdvance <= 0 || computedAdvance > totalAmt) ? '#94A3B8' : '#0F766E',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: (computedAdvance <= 0 || computedAdvance > totalAmt) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Confirm &amp; Request Advance Payment
                        </button>
                      </div>
                    </div>
                  )}

                </>
              )}

            </div>
          </div>
        );
      })()}

      {selectedOrder && (() => {
        const activeOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
        const currentPoStatus = activeOrder.poStatus || 'PENDING_ADMIN_REVIEW';
        const isHeld = activeOrder.isOnHold || activeOrder.status === 'ON_HOLD';

        // Gather all line items across all sub-orders
        const allLinesList: { id: string; name: string; qty: number; unitPrice: number; totalPrice: number; subOrderNumber: string; mfgName: string }[] = [];
        (activeOrder.subOrders || []).forEach(so => {
          (so.lines || []).forEach((l, idx) => {
            const lineId = l.id || l.productId || `${so.subOrderNumber}-line-${idx}`;
            const total = l.totalPrice !== undefined ? l.totalPrice : (l.quantity * l.unitPrice);
            allLinesList.push({
              id: lineId,
              name: l.productName,
              qty: l.quantity,
              unitPrice: l.unitPrice,
              totalPrice: total,
              subOrderNumber: so.subOrderNumber,
              mfgName: so.manufacturerName
            });
          });
        });

        // Calculate selected totals
        const selectedTotalAmount = allLinesList
          .filter(l => selectedLineIds.includes(l.id))
          .reduce((sum, l) => sum + l.totalPrice, 0);

        const toggleLineSelection = (lineId: string) => {
          setSelectedLineIds(prev =>
            prev.includes(lineId) ? prev.filter(id => id !== lineId) : [...prev, lineId]
          );
        };

        const handleSelectAll = () => {
          setSelectedLineIds(allLinesList.map(l => l.id));
        };

        const handleDeselectAll = () => {
          setSelectedLineIds([]);
        };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 780, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Purchase Order Review &amp; Governance Desk</span>
                  <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>
                    PO Reference: {activeOrder.poNumber || activeOrder.orderNumber} {activeOrder.rfqNumber && `· RFQ: ${activeOrder.rfqNumber}`}
                  </h3>
                  {activeOrder.isGeneric && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 4, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>
                      🧪 GENERIC MEDICINE FULFILLMENT · FACTORYGRID DIRECT (NO EXTERNAL MANUFACTURER)
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Hold Warning in Modal if active order is on hold */}
              {isHeld && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <strong>⚠ ORDER CURRENTLY ON HOLD (Hold Count: {activeOrder.holdCount || 1})</strong>
                    <div style={{ marginTop: 2 }}>Reason: {activeOrder.holdReason || 'Administrative Review Required'}</div>
                  </div>
                  <button
                    onClick={() => {
                      releaseOrderHold(activeOrder.id);
                      setAdminBanner(`✓ Master Order ${activeOrder.orderNumber} released from HOLD.`);
                    }}
                    style={{ padding: '5px 12px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                  >
                    Release Hold
                  </button>
                </div>
              )}

              {/* Meta summary (Section 1: PO Number, Master Order, Customer, RFQ, Total, Delivery, Payment Terms, Hold) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <strong>PO Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeOrder.poNumber || activeOrder.orderNumber}</span>
                </div>
                <div>
                  <strong>Master Order:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeOrder.orderNumber}</span>
                </div>
                <div>
                  <strong>Customer Name:</strong> {activeOrder.customerName} ({activeOrder.customerCode})
                  {activeOrder.customerClassification === 'SPECIAL_PARTY' ? (
                    <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                      <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                    </span>
                  ) : (
                    <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 10, fontWeight: 700 }}>
                      REGULAR
                    </span>
                  )}
                </div>
                <div>
                  <strong>RFQ Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{activeOrder.rfqNumber || '—'}</span>
                </div>
                <div>
                  <strong>Expected Delivery:</strong> {activeOrder.expectedDeliveryDate || '2026-10-05'}
                </div>
                <div>
                  <strong>Payment Terms:</strong> {activeOrder.paymentTerms || 'Standard Terms'}
                </div>
                <div>
                  <strong>Total PO Value: </strong>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                    ₹{selectedTotalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <strong>PO Workflow Status: </strong>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: isHeld ? '#FEF2F2' : (currentPoStatus === 'REGENERATED' ? '#F3E8FF' : '#DCFCE7'), color: isHeld ? '#DC2626' : (currentPoStatus === 'REGENERATED' ? '#7E22CE' : '#15803D') }}>
                    {isHeld ? 'ON HOLD' : (currentPoStatus === 'REGENERATED' ? 'REGENERATED BY ADMIN' : 'AUTO-GENERATED')}
                  </span>
                </div>
              </div>

              {/* PO Approval & Advance Payment Governance Section (Strictly enforces approval -> advance decision) */}
              <div style={{ marginTop: 4 }}>
                <AdvancePaymentSection
                  order={activeOrder}
                  onOrderUpdated={(updated) => {
                    setSelectedOrder(updated);
                    setAdminBanner(`✓ Order ${updated.orderNumber} updated successfully.`);
                  }}
                />
              </div>

              {/* Sub-Orders & Multi-Select Line Items */}
              {activeOrder.subOrders && activeOrder.subOrders.length > 0 && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: '#F1F5F9', padding: '10px 14px', fontSize: 11.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span>PRODUCT LINE ITEMS ({selectedLineIds.length} of {allLinesList.length} Selected)</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', padding: '2px 4px' }}
                      >
                        Select All
                      </button>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', padding: '2px 4px' }}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, maxHeight: 340, overflowY: 'auto' }}>
                    {activeOrder.subOrders.map((so, soIdx) => {
                      const soLines = so.lines || [];
                      return (
                        <div key={soIdx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                            <div>
                              <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{so.subOrderNumber}</strong> · <span style={{ fontWeight: 700, color: '#0F172A' }}>{so.manufacturerName}</span>
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                              Sub-Order Total: <span style={{ fontFamily: 'monospace', color: '#0F172A' }}>₹{so.totalAmount?.toLocaleString()}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {soLines.map((line, lIdx) => {
                              const lineKey = line.id || line.productId || `${so.subOrderNumber}-line-${lIdx}`;
                              const isChecked = selectedLineIds.includes(lineKey);
                              const lineTotal = line.totalPrice !== undefined ? line.totalPrice : (line.quantity * line.unitPrice);
                              const marginRes = getApplicableMargin(line.productId, so.manufacturerId);
                              const feeRate = platformFeeConfig?.feeValue ?? 2.0;

                              let marginAmt = 0;
                              let marginStr = '';
                              let baseP = line.unitPrice;

                              if (marginRes.marginType === 'FIXED_RATE') {
                                marginAmt = marginRes.marginRate ?? marginRes.marginValue;
                                marginStr = `₹${marginAmt.toFixed(2)}`;
                                baseP = Math.max(1, Math.round(((line.unitPrice / (1 + (feeRate / 100))) - marginAmt) * 100) / 100);
                              } else {
                                const pct = marginRes.marginPercentage || 10;
                                baseP = Math.max(1, Math.round((line.unitPrice / (1 + (pct / 100) + (feeRate / 100))) * 100) / 100);
                                marginAmt = Math.round((baseP * (pct / 100)) * 100) / 100;
                                marginStr = `${pct}% (+₹${marginAmt.toFixed(2)})`;
                              }

                              const feeAmt = Math.round(((baseP + marginAmt) * (feeRate / 100)) * 100) / 100;
                              const commercialP = Math.round((baseP + marginAmt + feeAmt) * 100) / 100;

                              return (
                                <label
                                  key={lineKey}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    background: isChecked ? '#F0FDFA' : '#FFFFFF',
                                    border: isChecked ? '1px solid #99F6E4' : '1px solid #E2E8F0',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleLineSelection(lineKey)}
                                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0F766E' }}
                                    />
                                    <div>
                                      <div style={{ fontWeight: 700, color: isChecked ? '#0F172A' : '#64748B' }}>
                                        {line.productName}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748B' }}>
                                        {line.quantity.toLocaleString()} Units @ ₹{commercialP.toFixed(2)} / unit {line.dosageForm ? `• ${line.dosageForm}` : ''}
                                      </div>
                                      <div style={{ fontSize: 10.5, color: '#475569', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <span>Base: <strong style={{ color: '#0F172A' }}>₹{baseP.toFixed(2)}</strong></span>
                                        <span>Margin: <strong style={{ color: '#0F766E' }}>{marginStr}</strong></span>
                                        <span>Platform Fee ({feeRate}%): <strong style={{ color: '#B45309' }}>+₹{feeAmt.toFixed(2)}</strong></span>
                                        <span>Commercial Price: <strong style={{ color: '#0F172A' }}>₹{commercialP.toFixed(2)}</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ fontWeight: 800, fontFamily: 'monospace', color: isChecked ? '#0F766E' : '#94A3B8' }}>
                                    ₹{lineTotal.toLocaleString()}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin PO Actions Box */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
                  Generating PO will include only the <strong>{selectedLineIds.length}</strong> selected product line item(s).
                  {activeOrder.advanceRequired && (activeOrder.advanceOutstanding ?? 0) > 0 && (
                    <div style={{ color: '#B45309', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={12} /> Advance Outstanding: ₹{activeOrder.advanceOutstanding?.toLocaleString()} · Sub-order release is locked until full advance is recorded.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activeOrder.status === 'PENDING_ADMIN_APPROVAL' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(null);
                        setApprovalTargetOrder(activeOrder);
                        setApprovalStep('REVIEW');
                        setApprovalDecision(null);
                        setRejectReason('');
                        setAdvRequired(true);
                        setAdvMethod('PERCENTAGE');
                        setAdvPct(30);
                        setAdvFixedAmount(Math.round((activeOrder.totalAmount || 0) * 0.3));
                        setAdvDueDate('');
                        setAdvNotes('');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#0F766E',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <ShieldCheck size={14} /> Review & Approve PO
                    </button>
                  )}
                  {!isHeld && (
                    <button
                      onClick={() => {
                        setHoldTargetOrder(activeOrder);
                        setHoldReasonText('');
                      }}
                      style={{
                        padding: '8px 14px',
                        background: '#FFF',
                        border: '1px solid #FCA5A5',
                        color: '#DC2626',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <PauseCircle size={13} /> Place on Hold
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (selectedLineIds.length === 0) {
                        setAdminBanner('⚠ Please select at least one product line item to generate the Purchase Order.');
                        return;
                      }
                      regeneratePO(activeOrder.id, selectedLineIds);
                      setAdminBanner(`✓ Purchase Order ${activeOrder.poNumber || activeOrder.orderNumber} generated successfully with ${selectedLineIds.length} selected line item(s).`);
                    }}
                    disabled={selectedLineIds.length === 0}
                    style={{
                      padding: '8px 18px',
                      background: selectedLineIds.length === 0 ? '#94A3B8' : '#0F766E',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: selectedLineIds.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <RefreshCw size={13} /> Generate / Regenerate PO ({selectedLineIds.length} Selected)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                <button onClick={() => setSelectedOrder(null)} style={{ padding: '8px 18px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close Window</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

