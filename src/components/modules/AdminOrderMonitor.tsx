import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder } from '../../types';
import { ShoppingBag, Search, Eye, X, CheckCircle2, Clock, RefreshCw, Send, ShieldCheck, CheckSquare, Square, PauseCircle, AlertTriangle, Star } from 'lucide-react';

export const AdminOrderMonitor: React.FC = () => {
  const {
    orders, currentRole, regeneratePO, submitPOToBuyer, setActiveTab,
    placeOrderOnHold, releaseOrderHold, getApplicableMargin, platformFeeConfig
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<MasterOrder | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [adminBanner, setAdminBanner] = useState<string | null>(null);
  const [qaCounter, setQaCounter] = useState(0);

  // Hold Action States
  const [holdTargetOrder, setHoldTargetOrder] = useState<MasterOrder | null>(null);
  const [holdReasonText, setHoldReasonText] = useState('');

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

  const totalOrdersCount = orders.length;
  const totalGmv = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const openCount = orders.filter(o => o.status === 'OPEN' || o.status === 'PROCESSING').length;
  const completedCount = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(o => {
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

      return matchOrderNum || matchPoNum || matchRfqNum || matchCustName || matchCustCode || matchSubOrders;
    });
  }, [orders, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Global Notification Banner */}
      {adminBanner && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 18px', color: '#15803D', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{adminBanner}</span>
          <button onClick={() => setAdminBanner(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
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
            style={{ padding: '8px 16px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={16} /> 🛡️ Open Central QA Desk
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#15803D' }}>
            <CheckCircle2 size={14} /> ADMIN PO WORKFLOW DESK
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'MASTER ORDERS / POs', val: totalOrdersCount, color: '#2563EB' },
          { label: 'TOTAL ORDER GMV', val: `₹${(totalGmv / 100000).toFixed(1)}L`, color: '#16A34A' },
          { label: 'OPEN / PROCESSING', val: openCount, color: '#D97706' },
          { label: 'DELIVERED / SETTLED', val: completedCount, color: '#4F46E5' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search by Master Order #, RFQ #, or Customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Master Order / PO #</th>
                <th style={{ padding: '12px 16px' }}>Customer Name</th>
                <th style={{ padding: '12px 16px' }}>Created Date</th>
                <th style={{ padding: '12px 16px' }}>Expected Delivery</th>
                <th style={{ padding: '12px 16px' }}>Total Amount</th>
                <th style={{ padding: '12px 16px' }}>PO Workflow Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Hold Count</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(ord => {
                const poStatus = ord.poStatus || 'AUTO-GENERATED';
                const isHeld = ord.isOnHold || ord.status === 'ON_HOLD';
                const statusBadgeStyle = isHeld
                  ? { bg: '#FEF2F2', color: '#DC2626', label: 'ON HOLD' }
                  : poStatus === 'REGENERATED'
                  ? { bg: '#F3E8FF', color: '#7E22CE', label: 'REGENERATED BY ADMIN' }
                  : { bg: '#DCFCE7', color: '#15803D', label: 'AUTO-GENERATED' };

                return (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #F1F5F9', background: isHeld ? '#FFFDFD' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {ord.poNumber || ord.orderNumber}
                      <div style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace' }}>
                        Ref: {ord.orderNumber} {ord.rfqNumber && `· RFQ: ${ord.rfqNumber}`}
                      </div>
                      {ord.isGeneric && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', marginTop: 3, display: 'inline-block' }}>
                          🧪 GENERIC (FACTORYGRID DIRECT)
                        </span>
                      )}
                    </td>
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
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.createdDate}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{ord.expectedDeliveryDate}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>₹{ord.totalAmount?.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: statusBadgeStyle.bg, color: statusBadgeStyle.color }}>
                        {statusBadgeStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: (ord.holdCount || 0) > 0 ? '#FEF2F2' : '#F1F5F9',
                          color: (ord.holdCount || 0) > 0 ? '#DC2626' : '#64748B',
                          border: (ord.holdCount || 0) > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {isHeld && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />}
                        {ord.holdCount || 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* 1. Hold / Release Hold Button */}
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

                        {/* 2. View PO */}
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          style={{ padding: '5px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={12} /> View PO
                        </button>

                        {/* 3. Regenerate PO */}
                        <button
                          onClick={() => {
                            regeneratePO(ord.id);
                            setAdminBanner(`✓ Purchase Order ${ord.poNumber || ord.orderNumber} regenerated successfully.`);
                          }}
                          style={{ padding: '5px 10px', background: '#7E22CE', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <RefreshCw size={12} /> Regenerate PO
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

      {/* PO Review & Governance Modal */}
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

              {/* Meta summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                  <strong>PO Workflow Status: </strong>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: isHeld ? '#FEF2F2' : (currentPoStatus === 'REGENERATED' ? '#F3E8FF' : '#DCFCE7'), color: isHeld ? '#DC2626' : (currentPoStatus === 'REGENERATED' ? '#7E22CE' : '#15803D') }}>
                    {isHeld ? 'ON HOLD' : (currentPoStatus === 'REGENERATED' ? 'REGENERATED BY ADMIN' : 'AUTO-GENERATED')}
                  </span>
                </div>
                <div>
                  <strong>Total PO Value: </strong>
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                    ₹{selectedTotalAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <strong>Hold Status: </strong>
                  <span style={{ fontWeight: 700, color: (activeOrder.holdCount || 0) > 0 ? '#DC2626' : '#64748B' }}>
                    {isHeld ? `On Hold (Hold Count: ${activeOrder.holdCount || 1})` : `Hold Count: ${activeOrder.holdCount || 0}`}
                  </span>
                </div>
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
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

