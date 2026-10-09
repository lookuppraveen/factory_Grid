import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder, AdvancePaymentRecord, AdvanceMethod, AdvanceStatus, MasterOrderStatus } from '../../types';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, RotateCcw,
  Check, X, FileText, Lock, ShieldCheck, Star, ChevronDown,
  ChevronUp, Info, Calendar, Building2, Hash, ArrowRight, AlertCircle,
  ExternalLink, Shield
} from 'lucide-react';

interface AdvancePaymentSectionProps {
  order: MasterOrder;
  onOrderUpdated?: (updatedOrder: MasterOrder) => void;
  showAdminActions?: boolean;
}

export const AdvancePaymentSection: React.FC<AdvancePaymentSectionProps> = ({
  order,
  onOrderUpdated,
  showAdminActions = true
}) => {
  const {
    orders, currentRole, recordAdvancePayment,
    reverseAdvancePayment, approveMasterOrderAdmin, releaseOrderHold
  } = useApp();

  // Latest state of the order from AppContext
  const currentOrder = orders.find(o => o.id === order.id || o.orderNumber === order.orderNumber) || order;

  // Calculation parameters
  const masterTotal = currentOrder.totalAmount || 0;
  const isApproved = currentOrder.poApprovalStatus === 'APPROVED' || currentOrder.adminApprovalStatus === 'APPROVED';
  const isPendingApproval = !isApproved && (currentOrder.status === 'PENDING_ADMIN_APPROVAL' || currentOrder.poApprovalStatus === 'PENDING_APPROVAL');

  // Advance state determinations
  const isAwaitingAdvanceDecision = isApproved && (currentOrder.advanceRequired === undefined || currentOrder.advanceStatus === 'NOT_CONFIGURED');
  const isNoAdvanceRequired = isApproved && (currentOrder.advanceRequired === false || currentOrder.advanceStatus === 'NOT_REQUIRED');

  const advMethod: AdvanceMethod = currentOrder.advanceMethod || 'PERCENTAGE';
  const advPct = currentOrder.advancePercentage !== undefined ? currentOrder.advancePercentage : 30;

  const requiredAdvance = currentOrder.requiredAdvanceAmount !== undefined
    ? currentOrder.requiredAdvanceAmount
    : (advMethod === 'FIXED_AMOUNT' ? (currentOrder.requiredAdvanceAmount || 0) : Math.round((masterTotal * advPct) / 100));

  const advanceReceived = currentOrder.advanceReceived || 0;
  const advanceOutstanding = currentOrder.advanceOutstanding !== undefined
    ? currentOrder.advanceOutstanding
    : Math.max(requiredAdvance - advanceReceived, 0);

  const advanceStatus: AdvanceStatus = currentOrder.advanceStatus || (
    isPendingApproval || isAwaitingAdvanceDecision
      ? 'NOT_CONFIGURED'
      : (!currentOrder.advanceRequired ? 'NOT_REQUIRED' : (advanceOutstanding === 0 && requiredAdvance > 0 ? 'PAID' : (advanceReceived > 0 ? 'PARTIALLY_PAID' : 'PENDING')))
  );

  const isAdvancePaid = isApproved && currentOrder.advanceRequired === true && (advanceStatus === 'PAID' || (advanceOutstanding === 0 && requiredAdvance > 0));
  const isAdvancePending = isApproved && currentOrder.advanceRequired === true && !isAdvancePaid;

  // Step 2 & 3: Admin Approval Decision local states
  const [advanceDecision, setAdvanceDecision] = useState<'YES' | 'NO' | null>(null);
  const [configMethod, setConfigMethod] = useState<AdvanceMethod>('PERCENTAGE');
  const [configPct, setConfigPct] = useState<number>(30);
  const [configFixedAmt, setConfigFixedAmt] = useState<number>(Math.round(masterTotal * 0.3));
  const [configDueDate, setConfigDueDate] = useState<string>('2026-09-30');
  const [configNotes, setConfigNotes] = useState<string>('');

  // Admin Manual Payment Entry Modal State
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: advanceOutstanding > 0 ? String(advanceOutstanding) : '',
    paymentMode: 'NEFT / RTGS',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Reversal State
  const [targetReversalPayment, setTargetReversalPayment] = useState<AdvancePaymentRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  // Payment History Toggle
  const [showHistoryTable, setShowHistoryTable] = useState(true);

  // Handle Admin Approval Click (from State 1)
  const handleApprovePoClick = () => {
    // If advance decision is already known, approve directly; otherwise open YES/NO decision
    setAdvanceDecision(null);
    setConfigMethod('PERCENTAGE');
    setConfigPct(30);
    setConfigFixedAmt(Math.round(masterTotal * 0.3));
  };

  // Confirm Advance Decision = NO
  const handleConfirmNoAdvance = () => {
    const res = approveMasterOrderAdmin(currentOrder.id, {
      advanceRequired: false
    });
    if (res.success) {
      setSuccessBanner(`✓ Master Order ${currentOrder.orderNumber} approved. Advance payment is NOT required. PO has been CONFIRMED & RELEASED.`);
      if (res.updatedOrder && onOrderUpdated) onOrderUpdated(res.updatedOrder);
    } else {
      alert(res.error || 'Failed to approve order.');
    }
  };

  // Confirm Advance Decision = YES
  const handleConfirmYesAdvance = () => {
    const calculatedReq = configMethod === 'FIXED_AMOUNT' ? configFixedAmt : Math.round((masterTotal * configPct) / 100);
    const res = approveMasterOrderAdmin(currentOrder.id, {
      advanceRequired: true,
      advanceMethod: configMethod,
      advancePercentage: configMethod === 'PERCENTAGE' ? configPct : undefined,
      fixedAmount: configMethod === 'FIXED_AMOUNT' ? configFixedAmt : undefined,
      advanceDueDate: configDueDate,
      advanceNotes: configNotes
    });
    if (res.success) {
      setSuccessBanner(`✓ Master Order ${currentOrder.orderNumber} approved. Advance payment of ₹${calculatedReq.toLocaleString('en-IN')} requested. Order is AWAITING ADVANCE PAYMENT.`);
      if (res.updatedOrder && onOrderUpdated) onOrderUpdated(res.updatedOrder);
    } else {
      alert(res.error || 'Failed to configure advance.');
    }
  };

  // Handle Manual Payment Submission
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPay) return;
    setFormError(null);
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Payment amount must be greater than 0.');
      return;
    }
    if (!paymentForm.reference.trim()) {
      setFormError('Payment reference (UTR / Transaction ID) is required.');
      return;
    }
    setIsSubmittingPay(true);
    try {
      const res = recordAdvancePayment(currentOrder.id, {
        amount: amt,
        paymentMode: paymentForm.paymentMode,
        reference: paymentForm.reference.trim(),
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes.trim() || undefined
      });
      setIsSubmittingPay(false);
      if (!res.success) {
        setFormError(res.error || 'Failed to record advance payment.');
        return;
      }
      setShowManualPayModal(false);
      setSuccessBanner(`✓ Advance payment of ₹${amt.toLocaleString('en-IN')} recorded successfully.`);
      if (res.updatedOrder && onOrderUpdated) onOrderUpdated(res.updatedOrder);
    } catch (err: any) {
      setIsSubmittingPay(false);
      setFormError(err.message || 'Error occurred while recording payment.');
    }
  };

  // Status Badges
  const getAdvanceBadge = () => {
    if (isPendingApproval || advanceStatus === 'NOT_CONFIGURED') {
      return { label: 'NOT CONFIGURED', bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
    if (advanceStatus === 'NOT_REQUIRED') {
      return { label: 'NOT REQUIRED', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
    }
    if (advanceStatus === 'PAID') {
      return { label: 'PAID', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
    }
    if (advanceStatus === 'PARTIALLY_PAID') {
      return { label: 'PARTIALLY PAID', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' };
    }
    return { label: 'PAYMENT PENDING', bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' };
  };

  const advBadge = getAdvanceBadge();
  const activePayments = (currentOrder.advancePayments || []).filter(p => p.status === 'RECORDED');

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #CBD5E1',
      borderRadius: 6,
      padding: '16px 20px',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>

      {/* Success Notification Banner */}
      {successBanner && (
        <div style={{
          background: '#F0FDF4',
          border: '1px solid #86EFAC',
          borderRadius: 8,
          padding: '12px 16px',
          color: '#15803D',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{successBanner}</span>
          <button onClick={() => setSuccessBanner(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* ========================================================
          STATE 1: PO IS AWAITING ADMIN APPROVAL
          (Prompt: PO cannot be released before Admin approval.
           Advance Payment Required decision cannot happen before Admin approval.
           Before approval, the advance section should NOT allow payment recording.
           Show: PO Status: Pending Admin Approval, [ Approve PO ] [ Hold ])
          ======================================================== */}
      {isPendingApproval && advanceDecision === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#C2410C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  STEP 2 — PO APPROVAL
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  PO Status: Pending Admin Approval
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5' }}>
                PENDING APPROVAL
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1' }}>
                ADVANCE: NOT CONFIGURED
              </span>
            </div>
          </div>

          {/* Pending Approval Explanation Box */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 14, fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
            <strong>Administrative Review Required:</strong> This Purchase Order has been submitted by <strong>{currentOrder.customerName}</strong>. Advance payment is not yet active. Admin must review and approve the PO before deciding whether an advance payment is required.
          </div>

          {/* Action Buttons: [ Approve PO ] [ Hold ] */}
          {showAdminActions && currentRole === 'ADMIN' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
              <button
                type="button"
                onClick={() => setAdvanceDecision('PROMPT')}
                style={{
                  padding: '9px 20px',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
                }}
              >
                <CheckCircle2 size={15} /> Approve PO
              </button>
            </div>
          )}

          {currentRole !== 'ADMIN' && (
            <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
              Awaiting review and approval by FactoryGrid administration.
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          STATE 2: ADVANCE PAYMENT DECISION PROMPT (YES / NO)
          (Prompt: After Admin clicks Approve PO, show:
           "Advance Payment Required? [ YES ] [ NO ]"
           This decision must belong to the Admin.)
          ======================================================== */}
      {(advanceDecision === 'PROMPT' || (isAwaitingAdvanceDecision && advanceDecision === null)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={16} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  PO APPROVED ✓ — STEP 3: ADVANCE DECISION
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Advance Payment Required?
                </h3>
              </div>
            </div>

            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
              PO APPROVED
            </span>
          </div>

          {/* Two prominent options: [ YES ] and [ NO ] */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
              Does this Purchase Order require an upfront Advance Payment from the Buyer prior to manufacturing release?
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                onClick={() => setAdvanceDecision('YES')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: advanceDecision === 'YES' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                  background: advanceDecision === 'YES' ? '#F0FDFA' : '#FFFFFF',
                  color: advanceDecision === 'YES' ? '#0F766E' : '#334155',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    {advanceDecision === 'YES' ? '●' : ''}
                  </span>
                  <span>[ YES ] — Advance Required</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 26 }}>
                  Buyer must pay configured advance via Razorpay before PO is released.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAdvanceDecision('NO')}
                style={{
                  padding: '14px 20px',
                  borderRadius: 8,
                  border: advanceDecision === 'NO' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                  background: advanceDecision === 'NO' ? '#F0FDFA' : '#FFFFFF',
                  color: advanceDecision === 'NO' ? '#0F766E' : '#334155',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                    {advanceDecision === 'NO' ? '●' : ''}
                  </span>
                  <span>[ NO ] — Advance Not Required</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginLeft: 26 }}>
                  Direct release to manufacturing. No advance requested from Buyer.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 2A: ADMIN SELECTED "NO"
          (Prompt: Advance Required = NO
           requiredAdvanceAmount = 0, advanceReceived = 0, advanceOutstanding = 0
           advanceStatus = NOT_REQUIRED
           Show: Advance Required: No, Advance Status: Not Required
           [ Confirm Approval & Release PO ])
          ======================================================== */}
      {advanceDecision === 'NO' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontWeight: 800, fontSize: 14 }}>
              <CheckCircle2 size={18} /> Advance Payment: NOT REQUIRED
            </div>
            <div style={{ fontSize: 12.5, color: '#166534', marginTop: 6 }}>
              Upon confirmation, this PO will be <strong>CONFIRMED &amp; RELEASED</strong> directly. The buyer will not be asked for advance payment, and manufacturing sub-orders will be scheduled immediately.
            </div>

            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, fontSize: 12 }}>
              <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Required Advance:</span> <strong style={{ color: '#15803D' }}>₹0</strong>
              </div>
              <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Advance Status:</span> <strong style={{ color: '#15803D' }}>NOT REQUIRED</strong>
              </div>
              <div style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #DCFCE7' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Next PO Status:</span> <strong style={{ color: '#15803D' }}>CONFIRMED &amp; RELEASED</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setAdvanceDecision('PROMPT')}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, color: '#64748B', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmNoAdvance}
              style={{ padding: '9px 20px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 7, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={15} /> Confirm Approval &amp; Release PO
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 2B: ADMIN SELECTED "YES" — CONFIGURE ADVANCE
          (Prompt: ADVANCE PAYMENT CONFIGURATION
           Advance Payment Type: ( ) Percentage  ( ) Fixed Amount
           PO Total: ₹10,00,000 | Advance: 30% | Advance Amount: ₹3,00,000
           Payment Due Date, Notes, Razorpay
           [ Confirm & Request Advance Payment ])
          ======================================================== */}
      {advanceDecision === 'YES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ADVANCE PAYMENT CONFIGURATION
            </div>

            {/* Advance Type Selector */}
            <div style={{ display: 'flex', gap: 18, fontSize: 13, fontWeight: 700 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="advType"
                  checked={configMethod === 'PERCENTAGE'}
                  onChange={() => setConfigMethod('PERCENTAGE')}
                  style={{ accentColor: '#0F766E' }}
                />
                Percentage (%) of PO Total
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="advType"
                  checked={configMethod === 'FIXED_AMOUNT'}
                  onChange={() => setConfigMethod('FIXED_AMOUNT')}
                  style={{ accentColor: '#0F766E' }}
                />
                Fixed Amount (₹)
              </label>
            </div>

            {/* Configuration Inputs & Auto-Calculation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {configMethod === 'PERCENTAGE' ? (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Advance Percentage (%)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={configPct}
                      onChange={e => setConfigPct(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 700, fontSize: 13 }}
                    />
                    <span style={{ fontWeight: 800, color: '#64748B' }}>%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Fixed Advance Amount (₹)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontWeight: 800, color: '#64748B' }}>₹</span>
                    <input
                      type="number"
                      min={1}
                      max={masterTotal}
                      value={configFixedAmt}
                      onChange={e => setConfigFixedAmt(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 700, fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={configDueDate}
                  onChange={e => setConfigDueDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 700, fontSize: 13, marginTop: 4 }}
                />
              </div>
            </div>

            {/* Auto-Calculation Summary Box */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <div>
                <span style={{ color: '#0F766E', fontWeight: 600 }}>PO Total: </span>
                <strong>₹{masterTotal.toLocaleString('en-IN')}</strong>
                <span style={{ margin: '0 8px', color: '#99F6E4' }}>•</span>
                <span style={{ color: '#0F766E', fontWeight: 600 }}>Advance: </span>
                <strong>{configMethod === 'PERCENTAGE' ? `${configPct}%` : 'Fixed Amount'}</strong>
              </div>
              <div>
                <span style={{ color: '#0F766E', fontWeight: 600 }}>Calculated Advance Amount: </span>
                <strong style={{ fontSize: 16, color: '#0F766E', fontFamily: 'monospace' }}>
                  ₹{(configMethod === 'PERCENTAGE' ? Math.round((masterTotal * configPct) / 100) : configFixedAmt).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Payment Gateway: Razorpay */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color="#0F766E" />
                <span>Payment Gateway: <strong>Razorpay (UPI / Cards / NetBanking)</strong></span>
              </div>
              <span style={{ fontStyle: 'italic' }}>Buyer will receive payment request immediately</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setAdvanceDecision('PROMPT')}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, color: '#64748B', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmYesAdvance}
              style={{ padding: '9px 20px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 7, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={15} /> Confirm &amp; Request Advance Payment
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 3: APPROVED + NO ADVANCE REQUIRED
          ======================================================== */}
      {isNoAdvanceRequired && advanceDecision === null && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={18} color="#15803D" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#15803D' }}>
                  PO Approved ✓ — Advance Payment Not Required
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Advance Required: <strong>No</strong> · Advance Status: <strong>Not Required</strong> · PO Status: <strong>CONFIRMED &amp; RELEASED</strong>
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
              CONFIRMED &amp; RELEASED
            </span>
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 4: APPROVED + ADVANCE REQUIRED + PENDING / PARTIALLY PAID
          ======================================================== */}
      {isAdvancePending && advanceDecision === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header & Badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ADVANCE PAYMENT STATUS
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  PO Status: Awaiting Advance Payment
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                APPROVED ✓
              </span>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: advBadge.bg, color: advBadge.color, border: `1px solid ${advBadge.border}` }}>
                {advBadge.label}
              </span>
            </div>
          </div>

          {/* Locked Notice */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#92400E' }}>
            <Lock size={16} style={{ color: '#B45309', flexShrink: 0 }} />
            <div>
              <strong>Manufacturer Execution Locked:</strong> Advance payment of <strong style={{ fontFamily: 'monospace' }}>₹{advanceOutstanding.toLocaleString('en-IN')}</strong> is currently outstanding. In accordance with O2C business governance, PO release is held until the required advance is fully verified.
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total PO Value</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 3 }}>
                ₹{masterTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Required Advance</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 3 }}>
                ₹{requiredAdvance.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748B' }}>
                {advMethod === 'PERCENTAGE' ? `${advPct}% of PO` : 'Fixed Amount'}
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Advance Received</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: advanceReceived > 0 ? '#15803D' : '#64748B', fontFamily: 'monospace', marginTop: 3 }}>
                ₹{advanceReceived.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748B' }}>
                {activePayments.length} Payment(s)
              </div>
            </div>

            <div style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Advance Outstanding</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#DC2626', fontFamily: 'monospace', marginTop: 3 }}>
                ₹{advanceOutstanding.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 10.5, color: '#B91C1C' }}>
                Awaiting Buyer Payment
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Due Date: <strong>{(currentOrder as any).advanceDueDate || '30 Sep 2026'}</strong> · Gateway: <strong>Razorpay</strong>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {currentRole === 'BUYER' ? (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
                  Please settle advance from the <strong>Advance Payments</strong> desk under Finance.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentForm({
                      amount: String(advanceOutstanding),
                      paymentMode: 'NEFT / RTGS',
                      reference: '',
                      paymentDate: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                    setFormError(null);
                    setShowManualPayModal(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Admin Manual Entry (Offline Bank Wire)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STATE 5: ADVANCE FULLY PAID
          ======================================================== */}
      {isAdvancePaid && advanceDecision === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="#15803D" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#15803D' }}>
                    PO Confirmed &amp; Released — Advance Fully Paid ✓
                  </div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                    Advance Paid: <strong>₹{advanceReceived.toLocaleString('en-IN')}</strong> · Outstanding: <strong>₹0</strong> · Verified via Razorpay
                  </div>
                </div>
              </div>

              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                CONFIRMED &amp; RELEASED
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAYMENT AUDIT / TRANSACTION LOG (If any payments exist)
          ======================================================== */}
      {activePayments.length > 0 && (
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
          <div
            onClick={() => setShowHistoryTable(!showHistoryTable)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color="#0F766E" />
              <span>Advance Payment Transaction Log ({activePayments.length})</span>
            </div>
            {showHistoryTable ? <ChevronUp size={14} color="#64748B" /> : <ChevronDown size={14} color="#64748B" />}
          </div>

          {showHistoryTable && (
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflowX: 'auto', marginTop: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                    <th style={{ padding: '6px 10px' }}>REF</th>
                    <th style={{ padding: '6px 10px' }}>DATE</th>
                    <th style={{ padding: '6px 10px' }}>MODE</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>AMOUNT</th>
                    <th style={{ padding: '6px 10px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {activePayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 700 }}>{p.reference}</td>
                      <td style={{ padding: '6px 10px' }}>{p.paymentDate}</td>
                      <td style={{ padding: '6px 10px' }}>{p.paymentMode}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800, color: '#15803D' }}>₹{p.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#15803D', background: '#DCFCE7', padding: '1px 5px', borderRadius: 3 }}>
                          RECORDED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ADMIN MANUAL PAYMENT ENTRY MODAL
          ======================================================== */}
      {showManualPayModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 440, padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10, marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Admin Manual Advance Entry</h4>
              <button onClick={() => setShowManualPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {formError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', color: '#DC2626', fontSize: 12, marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12.5 }}>
              <div>
                <label style={{ fontWeight: 700, color: '#475569' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 700, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#475569' }}>Payment Mode</label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 600, marginTop: 4 }}
                >
                  <option value="NEFT / RTGS">NEFT / RTGS</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Razorpay">Razorpay (Offline Sync)</option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#475569' }}>Payment Reference / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-992144"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 600, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 700, color: '#475569' }}>Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontWeight: 600, marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowManualPayModal(false)}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: 6, color: '#64748B', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  style={{ padding: '8px 18px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 6, fontWeight: 800 }}
                >
                  {isSubmittingPay ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
