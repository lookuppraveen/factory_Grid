import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MasterOrder, SubOrderStatus, ManufacturerQuote, RFQ } from '../../types';
import {
  Factory, FileText, Tag, ShoppingBag, Truck, Receipt,
  Clock, CheckCircle2, AlertCircle, ChevronRight, ArrowRight,
  Package, Thermometer, MapPin, Download, Plus, Eye,
  ShieldCheck, Zap, BarChart3, Target, Calendar, RefreshCw,
  X, Check, XCircle, File, Upload
} from 'lucide-react';

const subOrderStages: { key: SubOrderStatus; label: string }[] = [
  { key: 'OPEN', label: 'Order Received' },
  { key: 'SCHEDULED', label: 'Batch Scheduled' },
  { key: 'IN_PRODUCTION', label: 'In Production' },
  { key: 'PACKAGING', label: 'Packaging & QC' },
  { key: 'READY_TO_DISPATCH', label: 'Ready to Dispatch' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export const ManufacturerWorkspaceModule: React.FC = () => {
  const {
    rfqs, quotes, submitQuote, orders, shipments, invoices,
    manufacturers, updateSubOrderStatus, addAuditLog, currentRole
  } = useApp();

  const [activeTab, setLocalTab] = useState<'OVERVIEW' | 'RFQS' | 'QUOTES' | 'PRODUCTION' | 'DISPATCH' | 'PAYMENTS'>('RFQS');

  // Selected RFQ to inspect / quote
  const [selectedRfqToQuote, setSelectedRfqToQuote] = useState<RFQ | null>(null);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);

  // Quote Form State
  const [unitPrice, setUnitPrice] = useState<number>(11.80);
  const [moq, setMoq] = useState<string>('10,000 Boxes');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(18);
  const [gstPercent, setGstPercent] = useState<number>(12);
  const [discountPercent, setDiscountPercent] = useState<number>(2.5);
  const [mfgCapacity, setMfgCapacity] = useState<string>('15,000,000 Units / Month');
  const [quoteValidity, setQuoteValidity] = useState<string>('2026-09-30');
  const [quoteRemarks, setQuoteRemarks] = useState<string>('Full batch CoA will be dispatched with cold-chain fleet. WHO-GMP unit active.');

  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; size: string }[]>([
    { name: 'Commercial_Quote_SunBio_2026.pdf', type: 'Commercial Quote', size: '1.4 MB' },
    { name: 'Technical_Compliance_CoA.pdf', type: 'Technical Proposal', size: '2.8 MB' }
  ]);

  // The "my" manufacturer (SunBio Labs for demo)
  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.name || 'SunBio LifeSciences Ltd';

  // Sub-orders
  const mySubOrders = orders.flatMap(o =>
    o.subOrders
      .filter(s => s.manufacturerId === myMfgId || s.manufacturerName?.includes('SunBio'))
      .map(s => ({ ...s, masterOrderNumber: o.orderNumber, customerName: o.customerName }))
  );

  // My quotes
  const myQuotes = quotes.filter(q => q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio'));

  // Assigned RFQs
  const openRfqs = rfqs.filter(r => r.status === 'PRICING_IN_PROGRESS' || r.status === 'SUBMITTED');

  // Shipments
  const myShipments = shipments.filter(s => s.manufacturerName.includes('SunBio') || myMfgId);

  // Access Restriction
  const isSupplier = currentRole === 'SUPPLIER' || currentRole === 'ADMIN';

  if (!isSupplier) {
    return (
      <div className="ent-panel" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Manufacturer Workspace — Access Restricted
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          This workspace is reserved strictly for <strong>Verified Manufacturers & Suppliers</strong> to review assigned RFQs, submit quotes, and manage plant production.
        </p>
        <div className="ent-caption">Please switch to <strong>Manufacturer</strong> role using the role switcher.</div>
      </div>
    );
  }

  // Handle Submit Quote Action
  const handleConfirmSubmitQuote = () => {
    if (!selectedRfqToQuote) return;

    const lineTotal = (selectedRfqToQuote.lines[0]?.quantity || 50000) * unitPrice;
    const finalAmount = lineTotal * (1 - discountPercent / 100) * (1 + gstPercent / 100);

    const newQuote: ManufacturerQuote = {
      id: `QUO-2026-${Math.floor(100 + Math.random() * 900)}`,
      rfqId: selectedRfqToQuote.id,
      rfqNumber: selectedRfqToQuote.rfqNumber,
      manufacturerId: myMfgId,
      manufacturerName: myMfgName,
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0],
      totalAmount: Math.round(finalAmount),
      leadTimeDays,
      remarks: quoteRemarks,
      lines: selectedRfqToQuote.lines.map(l => ({
        id: `ql_${l.id}`,
        rfqLineId: l.id,
        productId: l.productId,
        productName: l.productName,
        unitPrice,
        taxPercent: gstPercent,
        totalPrice: Math.round(l.quantity * unitPrice * (1 + gstPercent / 100))
      }))
    };

    submitQuote(newQuote);
    addAuditLog('Manufacturer Workspace', `Submitted commercial quote ${newQuote.id} for RFQ ${selectedRfqToQuote.rfqNumber}`);

    alert(`✔ Quote Submitted Successfully!\n\nQuote ID: ${newQuote.id}\nRFQ Reference: ${selectedRfqToQuote.rfqNumber}\nTotal Quoted Amount: ₹${Math.round(finalAmount).toLocaleString()}\n\nBuyer notification dispatched. Quote moved to "My Quotes".`);

    setShowConfirmSubmitModal(false);
    setSelectedRfqToQuote(null);
    setLocalTab('QUOTES');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <Clock size={13} style={{ color: 'var(--text-secondary)' }} />;
      case 'Opened': return <Eye size={13} style={{ color: 'var(--text-secondary)' }} />;
      case 'Quote In Progress': return <RefreshCw size={13} style={{ color: 'var(--text-secondary)' }} />;
      case 'Submitted': case 'Quote Submitted': return <CheckCircle2 size={13} style={{ color: 'var(--text-secondary)' }} />;
      case 'Expired': return <AlertCircle size={13} style={{ color: 'var(--text-secondary)' }} />;
      case 'Not Interested': return <XCircle size={13} style={{ color: 'var(--text-secondary)' }} />;
      default: return <Clock size={13} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Command Bar ───────────────────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
            <Factory size={20} />
          </div>
          <div>
            <div className="ent-label">Manufacturer Workstation / {myMfgName}</div>
            <div className="ent-page-title" style={{ margin: 0, fontSize: 20 }}>Assigned RFQ Inbox & Quote Engine</div>
          </div>
        </div>

        <div className="ent-command-bar-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '6px 14px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--c-success, #047857)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>WHO-GMP Certified Plant</span>
          </div>
        </div>
      </div>

      {/* ── Dashboard Metrics Strip (Simple Enterprise Cards) ─ */}
      <div className="ent-kpi-strip">
        <div className="ent-kpi-strip-item" onClick={() => setLocalTab('RFQS')} style={{ cursor: 'pointer' }}>
          <div className="kpi-label">Assigned RFQs</div>
          <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>{openRfqs.length}</div>
          <div className="kpi-sub">Awaiting sealed quotation</div>
        </div>

        <div className="ent-kpi-strip-item" onClick={() => setLocalTab('QUOTES')} style={{ cursor: 'pointer' }}>
          <div className="kpi-label">Quotes Submitted</div>
          <div className="kpi-value" style={{ color: 'var(--c-info, #0284C7)' }}>{myQuotes.length}</div>
          <div className="kpi-sub">Sealed bids under buyer review</div>
        </div>

        <div className="ent-kpi-strip-item" onClick={() => setLocalTab('PRODUCTION')} style={{ cursor: 'pointer' }}>
          <div className="kpi-label">Orders Running</div>
          <div className="kpi-value" style={{ color: 'var(--c-success, #047857)' }}>{mySubOrders.length}</div>
          <div className="kpi-sub">Active master sub-orders</div>
        </div>

        <div className="ent-kpi-strip-item" onClick={() => setLocalTab('PRODUCTION')} style={{ cursor: 'pointer' }}>
          <div className="kpi-label">Production Status</div>
          <div className="kpi-value" style={{ color: 'var(--c-warning, #B45309)' }}>
            {mySubOrders.filter(s => s.status === 'IN_PRODUCTION' || s.status === 'SCHEDULED').length}
          </div>
          <div className="kpi-sub">Batches in formulation</div>
        </div>

        <div className="ent-kpi-strip-item" onClick={() => setLocalTab('DISPATCH')} style={{ cursor: 'pointer' }}>
          <div className="kpi-label">Pending Dispatch</div>
          <div className="kpi-value" style={{ color: 'var(--text-secondary)' }}>
            {mySubOrders.filter(s => s.status === 'READY_TO_DISPATCH').length}
          </div>
          <div className="kpi-sub">Ready for cold-chain fleet</div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <button className={`ent-tab ${activeTab === 'RFQS' ? 'active' : ''}`} onClick={() => setLocalTab('RFQS')}>
          <FileText size={14} /> Assigned RFQs ({openRfqs.length})
        </button>
        <button className={`ent-tab ${activeTab === 'QUOTES' ? 'active' : ''}`} onClick={() => setLocalTab('QUOTES')}>
          <Tag size={14} /> Submitted Quotes ({myQuotes.length})
        </button>
        <button className={`ent-tab ${activeTab === 'PRODUCTION' ? 'active' : ''}`} onClick={() => setLocalTab('PRODUCTION')}>
          <Factory size={14} /> Production Lane ({mySubOrders.length})
        </button>
        <button className={`ent-tab ${activeTab === 'DISPATCH' ? 'active' : ''}`} onClick={() => setLocalTab('DISPATCH')}>
          <Truck size={14} /> Dispatch Queue
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: ASSIGNED RFQS INBOX
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'RFQS' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Assigned RFQ Inbox</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>RFQs automatically matched to your plant capability by FactoryGrid AI</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{openRfqs.length} Records</span>
          </div>

          <table className="ent-table">
            <thead>
              <tr>
                <th>RFQ Number</th>
                <th>Buyer</th>
                <th>Products</th>
                <th>RFQ Date</th>
                <th>Quotation Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {openRfqs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)' }}>No assigned RFQs in your inbox.</td></tr>
              ) : openRfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td className="ent-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rfq.rfqNumber}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rfq.customerName}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {rfq.lines.map(l => l.productName).join(', ')}
                  </td>
                  <td className="ent-mono">{rfq.createdDate}</td>
                  <td className="ent-mono">{rfq.deadlineDate}</td>
                  <td style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)' }}>NORMAL</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {getStatusIcon('New')}
                      New
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRfqToQuote(rfq)}
                      className="ent-btn-primary"
                      style={{ padding: '4px 12px', fontSize: 11.5 }}
                    >
                      Open RFQ & Quote →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: SUBMITTED QUOTES
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'QUOTES' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div>
              <div className="ent-section-title">Submitted Quotes Registry</div>
              <div className="ent-caption" style={{ marginTop: 2 }}>Sealed bids submitted to Buyers awaiting comparative selection</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>{myQuotes.length} Records</span>
          </div>

          <table className="ent-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>RFQ Reference</th>
                <th>Buyer</th>
                <th>Submitted Date</th>
                <th>Total Quoted Value</th>
                <th>Delivery Schedule</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {myQuotes.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-tertiary)' }}>No quotes submitted yet.</td></tr>
              ) : myQuotes.map(q => (
                <tr key={q.id}>
                  <td className="ent-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{q.id}</td>
                  <td className="ent-mono">{q.rfqNumber}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Apex Pharma Labs Ltd</td>
                  <td className="ent-mono">{q.submittedDate}</td>
                  <td className="ent-mono" style={{ fontWeight: 700 }}>₹{q.totalAmount.toLocaleString()}</td>
                  <td className="ent-mono">{q.leadTimeDays} Days</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: q.status === 'SELECTED' ? 'var(--c-success, #047857)' : 'var(--text-secondary)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: q.status === 'SELECTED' ? 'var(--c-success, #047857)' : 'var(--text-secondary)' }} />
                      {q.status === 'SELECTED' ? 'Selected & Order Issued' : 'Awaiting Buyer Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3 & 4: PRODUCTION & DISPATCH
      ══════════════════════════════════════════════════════ */}
      {(activeTab === 'PRODUCTION' || activeTab === 'DISPATCH') && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div className="ent-section-title">Plant Sub-Orders & Batch Execution</div>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Sub-Order Number</th>
                <th>Master Order</th>
                <th>Buyer</th>
                <th>Order Amount</th>
                <th>Expected Delivery</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mySubOrders.map(sub => (
                <tr key={sub.id}>
                  <td className="ent-mono" style={{ fontWeight: 700 }}>{sub.subOrderNumber}</td>
                  <td className="ent-mono">{(sub as any).masterOrderNumber}</td>
                  <td>{(sub as any).customerName}</td>
                  <td className="ent-mono" style={{ fontWeight: 700 }}>₹{sub.totalAmount.toLocaleString()}</td>
                  <td className="ent-mono">{sub.expectedDeliveryDate}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {sub.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => updateSubOrderStatus(sub.id, 'IN_PRODUCTION')} className="ent-btn-secondary" style={{ padding: '3px 8px', fontSize: 11 }}>
                      Advance Batch →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          OPEN RFQ & QUOTE SUBMISSION DRAWER / INSPECTOR
      ══════════════════════════════════════════════════════ */}
      {selectedRfqToQuote && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 780, height: '100vh', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: 'var(--text-primary)' }}>

            {/* Drawer Header */}
            <div style={{ padding: '16px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Assigned RFQ Inspection & Quote Form
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {selectedRfqToQuote.rfqNumber} · {selectedRfqToQuote.customerName}
                </div>
              </div>
              <button onClick={() => setSelectedRfqToQuote(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Buyer Details & RFQ Summary */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Buyer Details & Commercial Terms
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Buyer Organization</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedRfqToQuote.customerName}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Buyer Code</div>
                    <div className="ent-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{selectedRfqToQuote.customerCode}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Quotation Due Date</div>
                    <div className="ent-mono" style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{selectedRfqToQuote.deadlineDate}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Delivery Location</div>
                    <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>GIDC Estate, Naroda, Ahmedabad</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Delivery Terms</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>CIF Destination</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-tertiary)' }}>Payment Terms</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>45 Days Corporate Credit</div>
                  </div>
                </div>
              </div>

              {/* Product Specifications Table */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Buyer Product Line Items
                </div>
                <table className="ent-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Strength</th>
                      <th>Dosage Form</th>
                      <th>Packaging</th>
                      <th>Quantity</th>
                      <th>Required Date</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRfqToQuote.lines.map(line => (
                      <tr key={line.id}>
                        <td style={{ fontWeight: 700 }}>{line.productName}</td>
                        <td className="ent-mono">650mg</td>
                        <td>{line.dosageForm}</td>
                        <td>{line.packSize}</td>
                        <td className="ent-mono" style={{ fontWeight: 700 }}>{line.quantity.toLocaleString()}</td>
                        <td className="ent-mono">{line.requiredDate}</td>
                        <td className="ent-caption">{line.remarks || 'Standard packaging'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manufacturer Quote Submission Form */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 14, background: 'var(--bg-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Fill Manufacturer Commercial Quote Details
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="ent-label" style={{ marginBottom: 4 }}>Unit Price (₹) *</label>
                    <input
                      type="number"
                      value={unitPrice}
                      onChange={e => setUnitPrice(Number(e.target.value))}
                      className="ent-input ent-mono"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label className="ent-label" style={{ marginBottom: 4 }}>MOQ (Min Order Qty) *</label>
                    <input
                      type="text"
                      value={moq}
                      onChange={e => setMoq(e.target.value)}
                      className="ent-input"
                    />
                  </div>

                  <div>
                    <label className="ent-label" style={{ marginBottom: 4 }}>Delivery Schedule (Days) *</label>
                    <input
                      type="number"
                      value={leadTimeDays}
                      onChange={e => setLeadTimeDays(Number(e.target.value))}
                      className="ent-input ent-mono"
                    />
                  </div>



                  <div>
                    <label className="ent-label" style={{ marginBottom: 4 }}>Manufacturing Capacity</label>
                    <input
                      type="text"
                      value={mfgCapacity}
                      onChange={e => setMfgCapacity(e.target.value)}
                      className="ent-input"
                    />
                  </div>

                  <div>
                    <label className="ent-label" style={{ marginBottom: 4 }}>Quote Validity Date *</label>
                    <input
                      type="date"
                      value={quoteValidity}
                      onChange={e => setQuoteValidity(e.target.value)}
                      className="ent-input ent-mono"
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="ent-label" style={{ marginBottom: 4 }}>Remarks / Technical Compliance Notes</label>
                    <input
                      type="text"
                      value={quoteRemarks}
                      onChange={e => setQuoteRemarks(e.target.value)}
                      className="ent-input"
                    />
                  </div>
                </div>
              </div>

              {/* Commercial & Technical Attachments */}
              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Commercial & Technical Attachments
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    'Upload Commercial Quote',
                    'Upload Technical Proposal',
                    'Upload Compliance Documents'
                  ].map((title, i) => (
                    <div key={i} style={{ border: '1px dashed var(--border-subtle)', borderRadius: 6, padding: 12, textAlign: 'center', background: 'var(--bg-subtle)' }}>
                      <Upload size={16} style={{ color: 'var(--text-tertiary)', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</div>
                      <button
                        onClick={() => {
                          const fileName = `${title.replace(/\s+/g, '_')}.pdf`;
                          setAttachedFiles(prev => [...prev, { name: fileName, type: title, size: '2.1 MB' }]);
                        }}
                        className="ent-btn-secondary"
                        style={{ padding: '3px 8px', fontSize: 10.5 }}
                      >
                        Choose File
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Drawer Footer Action Bar */}
            <div style={{ padding: 16, background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  alert('RFQ declined.');
                  setSelectedRfqToQuote(null);
                }}
                className="ent-btn-secondary"
                style={{ color: '#EF4444' }}
              >
                Decline RFQ
              </button>

              <button
                onClick={() => alert('Quote draft saved.')}
                className="ent-btn-secondary"
              >
                Save Draft
              </button>

              <button
                onClick={() => setShowConfirmSubmitModal(true)}
                className="ent-btn-primary"
                style={{ padding: '8px 20px' }}
              >
                Submit Quote →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ─────────────────────────────── */}
      {showConfirmSubmitModal && selectedRfqToQuote && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 420, padding: 24, color: 'var(--text-primary)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Submit Quotation</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Submit quotation for Buyer review? This will transmit your sealed commercial bid for <strong style={{ color: 'var(--text-primary)' }}>{selectedRfqToQuote.rfqNumber}</strong> directly to {selectedRfqToQuote.customerName}.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowConfirmSubmitModal(false)} className="ent-btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmSubmitQuote} className="ent-btn-primary">
                Confirm & Submit Quote →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
