import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText, CheckCircle2, XCircle, RefreshCw, Download, Printer,
  Building2, ShieldCheck, Clock, Layers, ArrowRight, X, AlertCircle,
  Truck, Receipt, Check, File, ChevronRight, DollarSign, MessageSquare, ShoppingBag
} from 'lucide-react';
import { RFQ } from '../../types';

interface CustomerQuotationModuleProps {
  rfq?: RFQ;
  lineSelections?: Record<string, { mfgId: string; mfgName: string; price: number }>;
  onApproved?: () => void;
}

export const CustomerQuotationModule: React.FC<CustomerQuotationModuleProps> = ({
  rfq,
  lineSelections,
  onApproved
}) => {
  const {
    rfqs, manufacturers, selectQuoteAndCreateOrder, addAuditLog,
    setActiveTab, currentRole, getApplicableMargin, platformFeeConfig
  } = useApp();

  const [transparencyMode, setTransparencyMode] = useState<'BUYER' | 'ADMIN'>(
    currentRole === 'ADMIN' ? 'ADMIN' : 'BUYER'
  );

  const activeRfq = rfq || rfqs[0];

  // Robust Line Selections: Ensure every RFQ line has an allocated supplier & approved price
  const selections: Record<string, { mfgId: string; mfgName: string; price: number }> = {};
  if (activeRfq) {
    activeRfq.lines.forEach((line, idx) => {
      if (activeRfq.isGeneric || line.productType === 'GENERIC') {
        const uPrice = line.internalPrice || (lineSelections?.[line.id]?.price) || (line.targetPrice ? line.targetPrice : 4.20);
        selections[line.id] = {
          mfgId: 'mfg_factorygrid',
          mfgName: 'FactoryGrid Direct (Generic Supply)',
          price: uPrice
        };
      } else if (lineSelections && lineSelections[line.id]) {
        selections[line.id] = lineSelections[line.id];
      } else {
        const mfg = manufacturers[idx % manufacturers.length] || manufacturers[0];
        selections[line.id] = {
          mfgId: mfg.id,
          mfgName: mfg.companyName,
          price: line.targetPrice ? line.targetPrice * 0.95 : 38.50
        };
      }
    });
  }

  // Commercial Calculations with STRICT Product-Level Margin & SEPARATE Platform Fee
  let totalBaseAmount = 0;
  let totalMarginAmount = 0;
  let totalPlatformFeeAmount = 0;
  let subtotal = 0;

  const feeRate = platformFeeConfig?.feeValue ?? 2.0;

  const productSummaryItems = activeRfq?.lines.map(line => {
    const fallbackSel = activeRfq.isGeneric
      ? { mfgId: 'mfg_factorygrid', mfgName: 'FactoryGrid Direct (Generic Supply)', price: line.internalPrice || 4.20 }
      : { mfgId: 'm1', mfgName: 'SunBio LifeSciences Ltd', price: 38.50 };
    const sel = selections[line.id] || fallbackSel;

    const baseUnitPrice = sel.price;
    const resolvedMargin = getApplicableMargin(line.productId, sel.mfgId);

    let marginUnitPrice = 0;
    let marginLabel = '';
    if (resolvedMargin.marginType === 'FIXED_RATE') {
      marginUnitPrice = resolvedMargin.marginRate ?? resolvedMargin.marginValue;
      marginLabel = `₹${marginUnitPrice.toFixed(2)}/unit`;
    } else {
      const pct = resolvedMargin.marginPercentage;
      marginUnitPrice = Math.round((baseUnitPrice * (pct / 100)) * 100) / 100;
      marginLabel = `${pct}% (+₹${marginUnitPrice.toFixed(2)})`;
    }

    // Platform Fee: strictly separated from margin, applied to (base + margin)
    const platformFeeUnitPrice = Math.round(((baseUnitPrice + marginUnitPrice) * (feeRate / 100)) * 100) / 100;
    const commercialUnitPrice = Math.round((baseUnitPrice + marginUnitPrice + platformFeeUnitPrice) * 100) / 100;

    const lineBase = line.quantity * baseUnitPrice;
    const lineMargin = line.quantity * marginUnitPrice;
    const lineFee = line.quantity * platformFeeUnitPrice;
    const lineSubtotal = line.quantity * commercialUnitPrice;

    totalBaseAmount += lineBase;
    totalMarginAmount += lineMargin;
    totalPlatformFeeAmount += lineFee;
    subtotal += lineSubtotal;

    const discount = lineSubtotal * 0.025; // 2.5% discount
    const gst = (lineSubtotal - discount) * 0.12; // 12% GST
    const netPrice = lineSubtotal - discount + gst;

    return {
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      dosageForm: line.dosageForm,
      mfgName: sel.mfgName,
      quantity: line.quantity,
      baseUnitPrice,
      marginUnitPrice,
      marginLabel,
      marginType: resolvedMargin.marginType,
      platformFeeUnitPrice,
      commercialUnitPrice,
      unitPrice: commercialUnitPrice,
      lineBase,
      lineMargin,
      lineFee,
      discount: Math.round(discount),
      gst: Math.round(gst),
      netPrice: Math.round(netPrice),
      leadTime: activeRfq.isGeneric ? '7 Days (Direct Dispatch)' : '14 Days',
      deliveryDate: line.requiredDate || '2026-09-02'
    };
  }) || [];

  const gstTotal = Math.round(subtotal * 0.12);
  const freightTotal = 35000;
  const otherCharges = 0;
  const grandTotal = Math.round(subtotal + gstTotal + freightTotal + otherCharges);

  // Component Workflow States: PENDING_APPROVAL | APPROVED | REJECTED | ORDER_CREATED
  const [quotationStatus, setQuotationStatus] = useState<'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ORDER_CREATED'>('PENDING_APPROVAL');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCreateMasterOrderModal, setShowCreateMasterOrderModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Approved Metadata
  const [approvedDetails, setApprovedDetails] = useState<{ approvedDate?: string; approvedBy?: string } | null>(null);

  // Access Check: Buyer / Admin
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';

  if (!isBuyer) {
    return (
      <div className="ent-panel" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Customer Quotation — Access Restricted
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          This final commercial quotation approval desk is restricted to <strong>Buyer Sourcing Managers</strong>.
        </p>
        <div className="ent-caption">Please switch to <strong>Buyer</strong> role using the role switcher.</div>
      </div>
    );
  }
  // 1. Confirm Customer Quote Approval (AUTO-GENERATES Master Order / PO)
  const handleConfirmCustomerApproval = () => {
    if (quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED') return;
    const formattedDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    setQuotationStatus('APPROVED');
    setApprovedDetails({
      approvedDate: formattedDate,
      approvedBy: `${activeRfq?.customerName || 'Apex Pharma'} (Authorized Buyer)`
    });

    // Auto-generate PO immediately upon quotation approval
    if (activeRfq) {
      selectQuoteAndCreateOrder(activeRfq.id, selections);
    }

    const effectiveQuoteId = activeRfq?.isGeneric
      ? `QTE-GEN-${activeRfq.rfqNumber.replace('RFQ-', '')}`
      : 'CQUO-2026-9001';
    addAuditLog('Customer Quotation Desk', `Approved quotation ${effectiveQuoteId} for RFQ ${activeRfq?.rfqNumber || 'RFQ-2026-1001'}. Purchase Order (PO) auto-generated and sent to Admin for review.`);
    setShowApprovalModal(false);
  };

  // 2. Create Master Order / PO (Maintained for backward compatibility if invoked)
  const handleCreateMasterOrderPO = () => {
    if (!activeRfq) return;
    selectQuoteAndCreateOrder(activeRfq.id, selections);
    setQuotationStatus('ORDER_CREATED');
    addAuditLog('Customer Quotation Desk', `Quotation completed/selected for RFQ ${activeRfq.rfqNumber}. Purchase Order (PO) auto-generated and sent to Admin for review.`);
    if (onApproved) onApproved();
    else setActiveTab('orders');
  };

  // 4. Handle Reject Quotation
  const handleConfirmRejection = () => {
    setQuotationStatus('REJECTED');
    addAuditLog('Customer Quotation Desk', `Rejected quotation CQUO-2026-9001.`);
    alert(`Quotation CQUO-2026-9001 rejected. Order creation is blocked.`);
    setShowRejectionModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* ── Enterprise Header Bar ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>CONSOLIDATED CUSTOMER QUOTATION</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              CUSTOMER QUOTATION: {activeRfq?.isGeneric ? `QTE-GEN-${activeRfq.rfqNumber.replace('RFQ-', '')}` : 'CQUO-2026-9001'}
            </h1>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>RFQ Reference: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeRfq?.rfqNumber || 'RFQ-2026-1001'}</strong></span>
              <span>· Customer: <strong style={{ color: '#0F172A' }}>{activeRfq?.customerName || 'Apex Pharma PCD Franchise'}</strong></span>
              {activeRfq?.isGeneric && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                  🧪 GENERIC MEDICINE (FACTORYGRID DIRECT)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Header Status Indicators ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED' ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', fontWeight: 800, fontSize: 12.5 }}>
              <CheckCircle2 size={15} /> PO Auto-Generated
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', fontSize: 12, fontWeight: 700 }}>
              Status: Pending Approval
            </div>
          )}
        </div>
      </div>

      {/* ── Action Toolbar ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Print Quotation
          </button>
          <button onClick={() => alert('Downloading official quotation PDF...')} style={{ padding: '8px 14px', fontSize: 12.5, fontWeight: 600, background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Download PDF
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {quotationStatus === 'PENDING_APPROVAL' && (
            <>
              <button onClick={() => setShowRejectionModal(true)} style={{ padding: '9px 16px', fontSize: 12.5, fontWeight: 700, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: 6, cursor: 'pointer' }}>
                Reject Quote
              </button>

              <button onClick={() => setShowApprovalModal(true)} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 800, background: '#16A34A', color: '#FFFFFF', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(22,163,74,0.2)' }}>
                <CheckCircle2 size={16} /> Approve Quote
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Approval Status Notice Box & Auto-Generated PO Info ── */}
      {(quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED') && approvedDetails && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 18, color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={20} style={{ color: '#16A34A' }} /> Quotation Approved &amp; PO Auto-Generated
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              Quote: <strong style={{ fontFamily: 'monospace' }}>{activeRfq?.isGeneric ? `QTE-GEN-${activeRfq.rfqNumber.replace('RFQ-', '')}` : 'CQUO-2026-9001'}</strong> · Customer: <strong>{activeRfq?.customerName || 'Apex Pharma PCD Franchise'}</strong> · Status: <strong style={{ color: '#16A34A' }}>PO Auto-Generated &amp; Sent to Admin</strong>
            </div>
            <div style={{ fontSize: 12.5, color: '#15803D', marginTop: 2 }}>
              The Master Purchase Order (PO) has been automatically generated and routed to the <strong>ADMIN</strong> for review, delivery address verification, and submission to Buyer. Manual PO creation is no longer required.
            </div>
          </div>

          <button
            onClick={() => {
              if (onApproved) onApproved();
              else setActiveTab('orders');
            }}
            style={{ padding: '9px 18px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            View PO Status in Order Desk →
          </button>
        </div>
      )}

      {quotationStatus === 'REJECTED' && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: 16, color: '#991B1B' }}>
          <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <XCircle size={18} style={{ color: '#DC2626' }} /> Quotation Rejected
          </div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>
            Customer rejected this quotation. Master Order / PO creation is <strong>PERMANENTLY BLOCKED</strong> for this quote.
          </div>
        </div>
      )}

      {/* ── Commercial Summary KPI Bar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Products</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{productSummaryItems.length} Line Items</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Multi-item consolidated quotation</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Subtotal</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>₹{subtotal.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Excluding GST & Freight</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>GST & Freight</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#475569', fontFamily: 'monospace', marginTop: 4 }}>₹{(gstTotal + freightTotal).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>12% GST + Cold-chain shipping</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #0F766E', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total Quote Value</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>₹{grandTotal.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>Net payable amount</div>
        </div>
      </div>

      {/* ── Main Split Layout: Table + Right Panel Summary ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* LEFT: Product Summary Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Consolidated Customer Quotation Table</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Itemized breakdown of selected manufacturer allocations and commercial pricing</div>
            </div>

            {/* Transparency Level Selector (Requirement 14) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setTransparencyMode('BUYER')}
                style={{
                  padding: '5px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: transparencyMode === 'BUYER' ? '#FFFFFF' : 'transparent',
                  color: transparencyMode === 'BUYER' ? '#0F766E' : '#64748B',
                  boxShadow: transparencyMode === 'BUYER' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Standard Buyer View
              </button>
              <button
                type="button"
                onClick={() => setTransparencyMode('ADMIN')}
                style={{
                  padding: '5px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: transparencyMode === 'ADMIN' ? '#FFFFFF' : 'transparent',
                  color: transparencyMode === 'ADMIN' ? '#0F766E' : '#64748B',
                  boxShadow: transparencyMode === 'ADMIN' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Admin / Internal Breakdown
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Selected Manufacturer</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Quantity</th>
                  {transparencyMode === 'ADMIN' ? (
                    <>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Base Price</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#0F766E' }}>Product Margin</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#D97706' }}>Platform Fee ({feeRate}%)</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, color: '#0F172A' }}>Commercial Unit Price</th>
                    </>
                  ) : (
                    <>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Commercial Unit Price</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#D97706' }}>Platform Fee</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>GST (12%)</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Delivery Schedule</th>
                    </>
                  )}
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>Net Line Price</th>
                </tr>
              </thead>
              <tbody>
                {productSummaryItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{item.productName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Form: {item.dosageForm}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 700, color: '#0F766E' }}>{item.mfgName}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {item.quantity.toLocaleString()} Units
                    </td>

                    {transparencyMode === 'ADMIN' ? (
                      <>
                        <td style={{ padding: '12px 12px', color: '#475569', fontFamily: 'monospace' }}>
                          ₹{item.baseUnitPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                            background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1'
                          }}>
                            {item.marginLabel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#B45309', fontWeight: 700, fontFamily: 'monospace' }}>
                          +₹{item.platformFeeUnitPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                          ₹{item.commercialUnitPrice.toFixed(2)}
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          ₹{item.commercialUnitPrice.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#B45309', fontWeight: 600 }}>
                          ₹{item.lineFee.toLocaleString()} <span style={{ fontSize: 10.5, color: '#64748B' }}>({feeRate}%)</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          ₹{item.gst.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1D4ED8' }}>
                          {item.leadTime}
                        </td>
                      </>
                    )}

                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      ₹{item.netPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Financial Breakdown & Approval Card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
            COMMERCIAL SUMMARY
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Base Product Value:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{totalBaseAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Product Margins:</span>
              <span style={{ fontWeight: 700, color: '#0F766E' }}>+₹{totalMarginAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', background: '#FEF3C7', padding: '4px 6px', borderRadius: 4 }}>
              <span style={{ fontWeight: 700, color: '#92400E' }}>Platform Fee ({feeRate}%):</span>
              <span style={{ fontWeight: 800, color: '#B45309' }}>+₹{totalPlatformFeeAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Commercial Subtotal:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Total GST (12%):</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{gstTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Cold-Chain Shipping:</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>₹{freightTotal.toLocaleString()}</span>
            </div>
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#0F766E' }}>
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Decision Container */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>STATUS</div>

            {quotationStatus === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  style={{ width: '100%', padding: '10px', borderRadius: 6, background: '#16A34A', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <CheckCircle2 size={16} /> Approve Quote
                </button>
                <button onClick={() => setShowRejectionModal(true)} style={{ width: '100%', padding: '8px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  Reject Quote
                </button>
              </>
            )}

            {(quotationStatus === 'APPROVED' || quotationStatus === 'ORDER_CREATED') && (
              <div style={{ padding: '10px 12px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 6, color: '#15803D', fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <CheckCircle2 size={15} /> PO Auto-Generated &amp; Sent to Admin for Approval
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── APPROVAL CONFIRMATION DIALOG MODAL ─────────────────── */}
      {showApprovalModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowApprovalModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                  <CheckCircle2 size={20} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Approve Customer Quotation?</h3>
              </div>
              <button onClick={() => setShowApprovalModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              By approving this quotation, the selected manufacturer allocations will be authorized to create the Master Order and split manufacturer sub-orders.
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 18, fontSize: 12.5 }}>
              <div>Quotation: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeRfq?.isGeneric ? `QTE-GEN-${activeRfq.rfqNumber.replace('RFQ-', '')}` : 'CQUO-2026-9001'}</strong></div>
              <div>Customer: <strong style={{ color: '#0F172A' }}>{activeRfq?.customerName || 'Apex Pharma PCD Franchise'}</strong></div>
              <div>Grand Total: <strong style={{ color: '#0F766E' }}>₹{grandTotal.toLocaleString()}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowApprovalModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmCustomerApproval} style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} /> Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── REJECTION MODAL ────────────────────────────────────── */}
      {showRejectionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRejectionModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#B91C1C', margin: 0 }}>Reject Customer Quotation?</h3>
              <button onClick={() => setShowRejectionModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Are you sure you want to reject this quotation? Order creation will be permanently blocked for this quotation.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowRejectionModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRejection} style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                Reject Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE MASTER ORDER CONFIRMATION MODAL ────────────────── */}
      {showCreateMasterOrderModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowCreateMasterOrderModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Create Master Order?</h3>
              <button onClick={() => setShowCreateMasterOrderModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>Quote Number: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>QUOTE-1001</strong></div>
              <div>Customer: <strong style={{ color: '#0F172A' }}>Apex Pharma PCD Franchise</strong></div>
              <div>Number of Products: <strong style={{ color: '#0F172A' }}>{productSummaryItems.length} Product Lines</strong></div>
              <div>Total Quantity: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>17,000 Units</strong></div>
              <div>Total Order Value: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>₹{grandTotal.toLocaleString()}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowCreateMasterOrderModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCreateMasterOrderModal(false);
                  handleCreateMasterOrderPO();
                }}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Create Master Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
