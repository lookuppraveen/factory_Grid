import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText, Plus, Search, Filter, Calendar, Clock, CheckCircle2, AlertCircle,
  X, Building2, Package, Layers, Eye, Trash2,
  Upload, ShoppingBag, Receipt, Bot,
  File, Tag, Activity, Star
} from 'lucide-react';
import { RFQ, RFQLine, MasterOrder } from '../../types';
import { Badge } from '../common/Badge';
import { AIMatchingModule } from './AIMatchingModule';

export const BuyerWorkspaceModule: React.FC = () => {
  const {
    currentRole, rfqs, addRFQ, orders, invoices,
    manufacturers, setActiveTab, addAuditLog, openCreateRfqDrawer,
    navigateWithFilter, quotes, auditLogs, userProfile, customers, customerVerifications,
    activeBuyerAccount
  } = useApp();

  const isSpecialPartyBuyer = activeBuyerAccount === 'SPECIAL_PARTY';

  const buyerCustomer = isSpecialPartyBuyer
    ? ((customers || []).find(c => c.id === 'c5' || c.name.includes('MediPlus')) || (customerVerifications || []).find(cv => cv.id === 'CUS-VER-105' || cv.companyName.includes('MediPlus')))
    : ((customers || []).find(c => c.id === 'c1' || c.name.includes('Apex')) || (customerVerifications || []).find(cv => cv.id === 'CUS-VER-101' || cv.companyName.includes('Apex')));

  const [activeTabLocal, setActiveTabLocal] = useState<'DASHBOARD' | 'RFQ_CENTER' | 'AI_MATCHING'>('DASHBOARD');
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [inspectedOrder, setInspectedOrder] = useState<MasterOrder | null>(null);

  // ── Create RFQ State ─────────────────────────────────────
  const [rfqNumber] = useState(`RFQ-2026-${1000 + rfqs.length + 1}`);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('2026-09-15');
  const [deliveryLocation, setDeliveryLocation] = useState('Plot 45, GIDC Industrial Estate, Naroda, Ahmedabad, Gujarat');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [remarks, setRemarks] = useState('WHO-GMP certified facility with cold-chain dispatch capability mandatory.');

  // Product Table Rows
  const [productRows, setProductRows] = useState<{
    id: string;
    productName: string;
    category: string;
    strength: string;
    dosageForm: string;
    packaging: string;
    quantity: number;
    unit: string;
    targetPrice: number;
    remarks: string;
  }[]>([
    {
      id: 'row-1',
      productName: 'Paracetamol 650mg Tablets',
      category: 'Analgesic',
      strength: '650mg',
      dosageForm: 'Tablet',
      packaging: '10x15 Strip',
      quantity: 50000,
      unit: 'Boxes',
      targetPrice: 12.50,
      remarks: 'Fast delivery required.'
    },
    {
      id: 'row-2',
      productName: 'Amoxicillin 500mg + Clavulanate 125mg',
      category: 'Antibiotics',
      strength: '625mg',
      dosageForm: 'Tablet',
      packaging: '10x10 Alu-Alu Strip',
      quantity: 25000,
      unit: 'Boxes',
      targetPrice: 42.00,
      remarks: 'WHO-GMP certified unit mandatory.'
    }
  ]);

  // RFQ Settings
  const [allowPartialAward, setAllowPartialAward] = useState(true);
  const [allowMultipleMfg, setAllowMultipleMfg] = useState(true);
  const [quotationDueDate, setQuotationDueDate] = useState('2026-08-25');
  const [deliveryTerms, setDeliveryTerms] = useState('CIF Destination');
  const [paymentTerms, setPaymentTerms] = useState('45 Days Credit');

  // Attachments State
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: string }[]>([
    { name: 'Paracetamol_650_COA_Specification.pdf', type: 'Specification', size: '1.2 MB' },
    { name: 'Blister_Artwork_v2.ai', type: 'Artwork', size: '4.5 MB' }
  ]);

  // AI Matching Screen State
  const [createdRfqResult, setCreatedRfqResult] = useState<RFQ | null>(null);
  const [matchingStep, setMatchingStep] = useState<1 | 2 | 3 | 4>(1);

  // Persona-isolated RFQs and Orders
  const buyerRfqs = useMemo(() => {
    return rfqs.filter(r => {
      if (isSpecialPartyBuyer) {
        return r.customerClassification === 'SPECIAL_PARTY' || r.customerId === 'c5' || r.customerName?.toLowerCase().includes('mediplus');
      } else {
        return r.customerClassification !== 'SPECIAL_PARTY' && r.customerId !== 'c5' && !r.customerName?.toLowerCase().includes('mediplus');
      }
    });
  }, [rfqs, isSpecialPartyBuyer]);

  const buyerOrders = useMemo(() => {
    return orders.filter(o => {
      if (isSpecialPartyBuyer) {
        return o.customerClassification === 'SPECIAL_PARTY' || o.customerId === 'c5' || o.customerName?.toLowerCase().includes('mediplus');
      } else {
        return o.customerClassification !== 'SPECIAL_PARTY' && o.customerId !== 'c5' && !o.customerName?.toLowerCase().includes('mediplus');
      }
    });
  }, [orders, isSpecialPartyBuyer]);

  // Dashboard KPI Counts
  const openRfqsCount = buyerRfqs.filter(r => r.status === 'PRICING_IN_PROGRESS' || r.status === 'SUBMITTED' || r.status === 'Pricing In Progress' || r.status === 'Submitted').length;
  const quotesReceivedCount = buyerRfqs.filter(r => r.status === 'QUOTED' || r.status === 'CUSTOMER_REVIEW' || r.status === 'Quoted').length;
  const ordersInProgressCount = buyerOrders.filter(o => o.status === 'IN_PRODUCTION' || o.status === 'OPEN').length;
  const pendingApprovalCount = buyerRfqs.filter(r => r.status === 'CUSTOMER_REVIEW').length;
  const invoicesPendingCount = invoices.filter(i => i.status === 'OPEN' || i.status === 'OVERDUE').length;

  // Buyer Greeting & Dynamic Context
  const buyerName = userProfile?.fullName || (isSpecialPartyBuyer ? 'Dr. Ananya Sharma' : 'Rajesh Sharma');
  const greetingTime = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // Chronological Procurement Activity (From real state records)
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'RFQ' | 'QUOTE' | 'ORDER' | 'INVOICE' | 'AUDIT';
      description: string;
      reference?: string;
      timestamp: string;
      actionTab: string;
    }> = [];

    // RFQs
    buyerRfqs.slice(0, 4).forEach(r => {
      list.push({
        id: `rfq-${r.id}`,
        type: 'RFQ',
        description: `RFQ submitted for ${r.lines.map(l => l.productName).join(', ')}`,
        reference: r.rfqNumber,
        timestamp: r.createdDate,
        actionTab: 'rfqs',
      });
    });

    // Orders
    buyerOrders.slice(0, 4).forEach(o => {
      const mfgName = o.subOrders[0]?.manufacturerName || 'Verified Manufacturer';
      list.push({
        id: `order-${o.id}`,
        type: 'ORDER',
        description: `Purchase order generated for ${mfgName} (₹${o.totalAmount.toLocaleString('en-IN')})`,
        reference: o.poNumber || o.orderNumber,
        timestamp: o.createdDate,
        actionTab: 'orders',
      });
    });

    // Quotes
    if (quotes && quotes.length > 0) {
      quotes.slice(0, 3).forEach(q => {
        list.push({
          id: `quote-${q.id}`,
          type: 'QUOTE',
          description: `Quotation received from ${q.manufacturerName}`,
          reference: q.quoteNumber || `Quote for ₹${q.totalAmount.toLocaleString('en-IN')}`,
          timestamp: q.submittedDate || (q.validUntil ? `Valid: ${q.validUntil}` : 'Recent'),
          actionTab: 'quotes',
        });
      });
    }

    // Invoices
    if (invoices && invoices.length > 0) {
      invoices.slice(0, 3).forEach(inv => {
        list.push({
          id: `inv-${inv.id}`,
          type: 'INVOICE',
          description: `Commercial invoice ${inv.status === 'PAID' ? 'settled' : 'received'} (₹${inv.totalAmount.toLocaleString('en-IN')})`,
          reference: inv.invoiceNumber,
          timestamp: inv.invoiceDate,
          actionTab: 'invoices',
        });
      });
    }

    // Audit logs
    if (auditLogs && auditLogs.length > 0) {
      auditLogs.slice(0, 4).forEach(log => {
        let actionTab = 'rfqs';
        if (log.module === 'Order Management' || log.module.includes('Order')) actionTab = 'orders';
        else if (log.module === 'Quotes' || log.module.includes('Quote')) actionTab = 'quotes';
        else if (log.module === 'Invoices' || log.module.includes('Invoice')) actionTab = 'invoices';

        list.push({
          id: `audit-${log.id}`,
          type: 'AUDIT',
          description: log.action,
          reference: `${log.userName} · ${log.module}`,
          timestamp: log.timestamp,
          actionTab,
        });
      });
    }

    return list.slice(0, 6);
  }, [rfqs, orders, quotes, invoices, auditLogs]);

  // Access Restriction Check
  const isBuyer = currentRole === 'BUYER' || currentRole === 'ADMIN';

  if (!isBuyer) {
    return (
      <div className="ent-panel" style={{ padding: 48, textAlign: 'center', margin: '40px auto', maxWidth: 600 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <AlertCircle size={22} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          Buyer Workspace — Access Restricted
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          This workspace is configured for <strong>Pharmaceutical Buyer Accounts</strong> to manage RFQs, quotes, orders, and invoices.
        </p>
        <div className="ent-caption">Please switch to <strong>Buyer</strong> role using the role switcher.</div>
      </div>
    );
  }

  // Add Product Row
  const handleAddProductRow = () => {
    const newId = `row-${Date.now()}`;
    setProductRows(prev => [
      ...prev,
      {
        id: newId,
        productName: 'Azithromycin 500mg Tablets',
        category: 'Antibiotics',
        strength: '500mg',
        dosageForm: 'Tablet',
        packaging: '10x3 Strip',
        quantity: 20000,
        unit: 'Boxes',
        targetPrice: 65.00,
        remarks: 'Export quality packaging'
      }
    ]);
  };

  // Remove Product Row
  const handleRemoveProductRow = (id: string) => {
    if (productRows.length === 1) return;
    setProductRows(prev => prev.filter(r => r.id !== id));
  };

  // Update Product Row
  const handleUpdateProductRow = (id: string, field: string, value: any) => {
    setProductRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Submit RFQ Action
  const handleSubmitRFQ = () => {
    const lines: RFQLine[] = productRows.map((r, idx) => ({
      id: `line_${Date.now()}_${idx}`,
      productId: `p_${idx + 1}`,
      productName: r.productName,
      dosageForm: r.dosageForm,
      packSize: r.packaging,
      quantity: r.quantity,
      targetPrice: r.targetPrice,
      buyerProvidedPrice: isSpecialPartyBuyer ? (r.targetPrice || 14.50) : undefined,
      requiredDate: expectedDeliveryDate,
      remarks: r.remarks,
      eligibleManufacturersCount: manufacturers.length
    }));

    const newRfq: RFQ = {
      id: `rfq_${Date.now()}`,
      rfqNumber,
      customerId: isSpecialPartyBuyer ? 'c5' : 'c1',
      customerName: isSpecialPartyBuyer ? 'MediPlus Healthcare' : 'Apex Pharma PCD Franchise',
      customerCode: isSpecialPartyBuyer ? 'CUS000105' : 'CUS000101',
      customerClassification: isSpecialPartyBuyer ? 'SPECIAL_PARTY' : (buyerCustomer?.customerClassification || 'REGULAR'),
      createdDate: new Date().toISOString().split('T')[0],
      deadlineDate: quotationDueDate,
      status: 'PRICING_IN_PROGRESS',
      lines
    };

    addRFQ(newRfq);
    addAuditLog('RFQ Center', `Submitted RFQ ${rfqNumber} with ${lines.length} products${isSpecialPartyBuyer ? ' (Special Party Pre-Agreed Pricing)' : ''}`);
    setCreatedRfqResult(newRfq);

    // Redirect automatically to AI Matching Screen
    setActiveTabLocal('AI_MATCHING');
    setMatchingStep(1);

    setTimeout(() => setMatchingStep(2), 800);
    setTimeout(() => setMatchingStep(3), 1600);
    setTimeout(() => setMatchingStep(4), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Header / Welcome Section ────────────────────────────── */}
      <div className="ent-command-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '14px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div className="ent-command-bar-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="ent-label" style={{ margin: 0, letterSpacing: '0.06em', fontSize: 10.5 }}>
              {isSpecialPartyBuyer ? 'MEDIPLUS HEALTHCARE / SPECIAL PARTY DEMO' : 'APEX PHARMA CORPORATE PORTAL / BUYER WORKSPACE'}
            </span>
            {isSpecialPartyBuyer && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', letterSpacing: '0.04em' }}>
                <Star size={11} fill="#D97706" color="#D97706" /> SPECIAL PARTY
              </span>
            )}
          </div>
          <div className="ent-page-title" style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Pharmaceutical Sourcing &amp; Procurement</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{greetingTime}, <strong style={{ color: 'var(--text-primary)' }}>{buyerName}</strong></span>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <span style={{ color: 'var(--text-tertiary)' }}>Here's an overview of your procurement activity.</span>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <button
            onClick={() => openCreateRfqDrawer()}
            className="ent-btn-primary"
            style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
          >
            <Plus size={14} /> Create New RFQ
          </button>
        </div>
      </div>

      {/* ── Sub Tabs Navigation ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 3, display: 'flex', gap: 4 }}>
        <button
          className={`ent-tab ${activeTabLocal === 'DASHBOARD' ? 'active' : ''}`}
          onClick={() => setActiveTabLocal('DASHBOARD')}
          style={{ borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}
        >
          <FileText size={14} /> Buyer Dashboard
        </button>
        <button
          className={`ent-tab`}
          onClick={() => setActiveTab('rfqs')}
          style={{ borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}
        >
          <Layers size={14} /> RFQ Center ({buyerRfqs.length})
        </button>
        <button
          className={`ent-tab`}
          onClick={() => openCreateRfqDrawer()}
          style={{ borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}
        >
          <Plus size={14} /> + Create New RFQ
        </button>
        {createdRfqResult && (
          <button
            className={`ent-tab ${activeTabLocal === 'AI_MATCHING' ? 'active' : ''}`}
            onClick={() => setActiveTabLocal('AI_MATCHING')}
            style={{ borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}
          >
            <Bot size={14} /> AI Manufacturer Matching
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          VIEW 1: BUYER DASHBOARD (Clean, Minimal & Practical)
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 1. Key Procurement Summary (Compact KPI Row) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              {
                label: 'Open RFQs',
                value: openRfqsCount,
                sub: 'Active in sourcing cycle',
                icon: FileText,
                accentColor: '#1D4ED8',
                bgColor: 'rgba(29, 78, 216, 0.08)',
                filterAction: () => navigateWithFilter('rfqs', 'PRICING_IN_PROGRESS'),
                titleText: 'View Active RFQs'
              },
              {
                label: 'Quotes Received',
                value: quotesReceivedCount,
                sub: 'Sealed manufacturer bids',
                icon: Tag,
                accentColor: '#0D9488',
                bgColor: 'rgba(13, 148, 136, 0.08)',
                filterAction: () => navigateWithFilter('quotes', 'SUBMITTED'),
                titleText: 'View Received Quotes'
              },
              {
                label: 'Orders In Progress',
                value: ordersInProgressCount,
                sub: 'Under production at plant',
                icon: ShoppingBag,
                accentColor: '#10B981',
                bgColor: 'rgba(16, 185, 129, 0.08)',
                filterAction: () => navigateWithFilter('orders', 'IN_PRODUCTION'),
                titleText: 'View Orders In Production'
              },
              {
                label: 'Pending Approval',
                value: pendingApprovalCount,
                sub: 'Bids awaiting Buyer PO',
                icon: Clock,
                accentColor: '#F59E0B',
                bgColor: 'rgba(245, 158, 11, 0.08)',
                filterAction: () => navigateWithFilter('quotes', 'PENDING'),
                titleText: 'View Quotes Awaiting Approval'
              },
              {
                label: 'Invoices Pending',
                value: invoicesPendingCount,
                sub: 'Accounts payable balance',
                icon: Receipt,
                accentColor: '#6366F1',
                bgColor: 'rgba(99, 102, 241, 0.08)',
                filterAction: () => navigateWithFilter('invoices', 'OPEN'),
                titleText: 'View Pending Invoices'
              }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  onClick={kpi.filterAction}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = kpi.accentColor;
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                  }}
                  title={kpi.titleText}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                      {kpi.label}
                    </span>
                    <div style={{ width: 24, height: 24, borderRadius: 5, background: kpi.bgColor, color: kpi.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={13} />
                    </div>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {kpi.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Active RFQs Section (Main Section) */}
          <div className="ent-panel">
            <div className="ent-panel-header" style={{ padding: '12px 18px' }}>
              <div>
                <div className="ent-section-title" style={{ fontSize: 15 }}>Active RFQs</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Current sourcing requests in quotation & bidding stage</div>
              </div>
              <button
                onClick={() => setActiveTab('rfqs')}
                className="ent-btn-ghost"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                View All RFQs →
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {buyerRfqs.length > 0 ? (
                <table className="ent-table">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>RFQ Reference</th>
                      <th>Products</th>
                      <th style={{ width: 120 }}>Submitted Date</th>
                      <th style={{ width: 130 }}>Quotation Due</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerRfqs.slice(0, 5).map(rfq => (
                      <tr key={rfq.id}>
                        <td className="ent-mono" style={{ fontWeight: 700 }}>
                          <div>{rfq.rfqNumber}</div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            {rfq.lines.length} {rfq.lines.length === 1 ? 'item' : 'items'}
                          </div>
                          {rfq.customerClassification === 'SPECIAL_PARTY' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 9.5, fontWeight: 800, marginTop: 3 }}>
                              <Star size={9} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 9.5, fontWeight: 700, marginTop: 3 }}>
                              REGULAR
                            </span>
                          )}
                        </td>
                        <td className="ent-body" style={{ fontWeight: 600 }}>
                          <div>{rfq.lines.map(l => l.productName).join(', ')}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>
                            Total Qty: {rfq.lines.reduce((sum, l) => sum + (l.quantity || 0), 0).toLocaleString('en-IN')} units
                          </div>
                        </td>
                        <td className="ent-mono" style={{ fontSize: 12 }}>{rfq.createdDate}</td>
                        <td className="ent-mono" style={{ fontSize: 12 }}>{rfq.deadlineDate}</td>
                        <td>
                          <Badge status={rfq.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => navigateWithFilter('quotes', rfq.rfqNumber)}
                            className="ent-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6 }}
                          >
                            Track Quotes →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <FileText size={30} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>No active RFQs</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, marginBottom: 12 }}>
                    Create a new RFQ to start sourcing.
                  </div>
                  <button onClick={() => openCreateRfqDrawer()} className="ent-btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                    <Plus size={13} /> + Create New RFQ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Recent Orders Section */}
          <div className="ent-panel">
            <div className="ent-panel-header" style={{ padding: '12px 18px' }}>
              <div>
                <div className="ent-section-title" style={{ fontSize: 15 }}>Recent Orders</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Latest purchase orders placed with verified manufacturers</div>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="ent-btn-ghost"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                View All Orders →
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {buyerOrders.length > 0 ? (
                <table className="ent-table">
                  <thead>
                    <tr>
                      <th style={{ width: 140 }}>Order Number</th>
                      <th>Supplier / Manufacturer</th>
                      <th style={{ width: 130 }}>Order Value</th>
                      <th style={{ width: 130 }}>Delivery Schedule</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 100, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerOrders.slice(0, 5).map(order => {
                      const supplierName = order.subOrders && order.subOrders.length > 0
                        ? order.subOrders.map(so => so.manufacturerName).join(', ')
                        : 'SunBio LifeSciences Ltd';

                      return (
                        <tr key={order.id}>
                          <td className="ent-mono" style={{ fontWeight: 700 }}>
                            <div>{order.orderNumber}</div>
                            {order.poNumber && (
                              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                                PO: {order.poNumber}
                              </div>
                            )}
                            {order.customerClassification === 'SPECIAL_PARTY' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 9.5, fontWeight: 800, marginTop: 3 }}>
                                <Star size={9} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 9.5, fontWeight: 700, marginTop: 3 }}>
                                REGULAR
                              </span>
                            )}
                          </td>
                          <td className="ent-body">
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{supplierName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                              {order.subOrders?.length || 1} Sub-Order Batch(es)
                            </div>
                          </td>
                          <td className="ent-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="ent-mono" style={{ fontSize: 12 }}>
                            {order.expectedDeliveryDate || 'Standard Schedule'}
                          </td>
                          <td>
                            <Badge status={order.status} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => setInspectedOrder(order)}
                              className="ent-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="View Purchase Order details"
                            >
                              <Eye size={12} /> View PO
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <ShoppingBag size={30} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>No recent orders</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Accepted quotations will generate master purchase orders here.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Recent Activity Section */}
          <div className="ent-panel">
            <div className="ent-panel-header" style={{ padding: '12px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} style={{ color: '#0D9488' }} />
                <div>
                  <div className="ent-section-title" style={{ fontSize: 15 }}>Recent Activity</div>
                  <div className="ent-caption" style={{ marginTop: 2 }}>Chronological procurement timeline from live platform events</div>
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentActivities.length > 0 ? (
                recentActivities.map(act => (
                  <div
                    key={act.id}
                    onClick={() => setActiveTab(act.actionTab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(241, 245, 249, 0.9)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                    title="Click to view corresponding record"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488', flexShrink: 0 }} />
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.description}</span>
                        {act.reference && (
                          <span className="ent-mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--bg-surface)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                            {act.reference}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', marginLeft: 12, flexShrink: 0 }}>
                      {act.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>

          {/* 5. Read-Only Purchase Order Inspection Modal */}
          {inspectedOrder && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid var(--border-subtle)' }}>
                
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Purchase Order Inspection
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                      PO Ref: {inspectedOrder.poNumber || inspectedOrder.orderNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => setInspectedOrder(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Meta Overview Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12.5, background: 'var(--bg-subtle)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Customer / Buyer</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{inspectedOrder.customerName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Order Date</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{inspectedOrder.createdDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Expected Delivery</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{inspectedOrder.expectedDeliveryDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Fulfillment Status</div>
                    <div style={{ marginTop: 2 }}>
                      <Badge status={inspectedOrder.status} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Payment Terms</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{inspectedOrder.paymentTerms || 'Net 30 Days'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Order Value</div>
                    <div style={{ fontWeight: 800, color: '#0D9488', marginTop: 2, fontSize: 14 }}>
                      ₹{inspectedOrder.totalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Sub-orders / Line Items */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Production Sub-Orders & Product Batches
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {inspectedOrder.subOrders && inspectedOrder.subOrders.length > 0 ? (
                      inspectedOrder.subOrders.map((so) => (
                        <div key={so.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, background: 'var(--bg-surface)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{so.subOrderNumber}</span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginLeft: 8 }}>Manufacturer: <strong>{so.manufacturerName}</strong></span>
                            </div>
                            <Badge status={so.status} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {so.lines.map((line) => (
                              <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, padding: '4px 8px', background: 'var(--bg-subtle)', borderRadius: 4 }}>
                                <span><strong>{line.productName}</strong> ({line.dosageForm})</span>
                                <span>{line.quantity.toLocaleString()} units @ ₹{line.unitPrice.toFixed(2)} = <strong>₹{line.totalPrice.toLocaleString('en-IN')}</strong></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                        Standard batch allocation under verified SunBio LifeSciences facility.
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Location */}
                {inspectedOrder.shippingAddress && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 6 }}>
                    <strong>Delivery Destination:</strong> {inspectedOrder.shippingAddress}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setInspectedOrder(null)}
                    className="ent-btn-secondary"
                    style={{ padding: '8px 16px', fontSize: 12 }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setInspectedOrder(null);
                      setActiveTab('orders');
                    }}
                    className="ent-btn-primary"
                    style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700 }}
                  >
                    Open in Order Management →
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 2: RFQ CENTER
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'RFQ_CENTER' && (
        <div className="ent-panel">
          <div className="ent-panel-header">
            <div className="ent-section-title">All RFQ Requests</div>
            <button onClick={() => openCreateRfqDrawer()} className="ent-btn-primary">
              <Plus size={14} /> + Create New RFQ
            </button>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>RFQ Reference</th>
                <th>Buyer Company</th>
                <th>Products Specified</th>
                <th>Target Delivery Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyerRfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td className="ent-mono" style={{ fontWeight: 700 }}>
                    <div>{rfq.rfqNumber}</div>
                    {rfq.customerClassification === 'SPECIAL_PARTY' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 5px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 9.5, fontWeight: 800, marginTop: 2 }}>
                        <Star size={9} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 9.5, fontWeight: 700, marginTop: 2 }}>
                        REGULAR
                      </span>
                    )}
                  </td>
                  <td className="ent-body">{rfq.customerName}</td>
                  <td className="ent-body" style={{ fontWeight: 600 }}>
                    {rfq.lines.map(l => l.productName).join(', ')}
                  </td>
                  <td className="ent-mono">{rfq.deadlineDate}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284C7' }} />
                      {rfq.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setActiveTab('quotes')} className="ent-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }}>
                      View Quotes →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 3: CREATE RFQ FORM (Enterprise Form Spec)
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'CREATE_RFQ' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Form Header */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Create Pharmaceutical RFQ Sourcing Request</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Define formulation specifications, target pricing, and compliance requirements</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => alert('RFQ Draft Saved.')} className="ent-btn-secondary">
                  Save Draft
                </button>
                <button onClick={handleSubmitRFQ} className="ent-btn-primary">
                  Submit RFQ & Run AI Match →
                </button>
              </div>
            </div>

            {/* General Information Grid */}
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>RFQ Number (Auto Generated)</label>
                <input type="text" value={rfqNumber} readOnly className="ent-input ent-mono" style={{ background: 'var(--bg-subtle)', fontWeight: 700 }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Buyer Name (Readonly)</label>
                <input type="text" value={isSpecialPartyBuyer ? "Pooja Mehta (Procurement Lead)" : "Dr. Vikram Sethi (Procurement Head)"} readOnly className="ent-input" style={{ background: 'var(--bg-subtle)' }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Company (Readonly)</label>
                <input type="text" value={isSpecialPartyBuyer ? "MediPlus Healthcare Ltd (CUS000105)" : "Apex Pharma Labs Ltd (BUY-2026-101)"} readOnly className="ent-input" style={{ background: 'var(--bg-subtle)', fontWeight: 700 }} />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Expected Delivery Date *</label>
                <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="ent-input ent-mono" />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Priority *</label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="ent-input">
                  <option value="NORMAL">NORMAL (Standard Delivery Schedule)</option>
                  <option value="HIGH">HIGH (Expedited Audit)</option>
                  <option value="URGENT">URGENT (Critical Stockout)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="ent-label" style={{ marginBottom: 6 }}>Delivery Location *</label>
                <input type="text" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} className="ent-input" />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label className="ent-label" style={{ marginBottom: 6 }}>Remarks & Compliance Instructions</label>
                <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="ent-input" style={{ resize: 'none' }} />
              </div>
            </div>
          </div>

          {/* Product Specifications Table */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div>
                <div className="ent-section-title">Product Line Items ({productRows.length})</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Specify dosage forms, strength, packaging, and target price</div>
              </div>
              <button onClick={handleAddProductRow} className="ent-btn-secondary">
                <Plus size={14} /> + Add Product Row
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="ent-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Strength</th>
                    <th>Dosage Form</th>
                    <th>Packaging</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>{isSpecialPartyBuyer ? 'Agreed Price (₹/unit) *' : 'Target Price (₹)'}</th>
                    <th>Remarks</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td>
                        <input
                          type="text"
                          value={row.productName}
                          onChange={e => handleUpdateProductRow(row.id, 'productName', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.category}
                          onChange={e => handleUpdateProductRow(row.id, 'category', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.strength}
                          onChange={e => handleUpdateProductRow(row.id, 'strength', e.target.value)}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <select
                          value={row.dosageForm}
                          onChange={e => handleUpdateProductRow(row.id, 'dosageForm', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Injectable">Injectable</option>
                          <option value="Syrup">Syrup</option>
                          <option value="Ointment">Ointment</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.packaging}
                          onChange={e => handleUpdateProductRow(row.id, 'packaging', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={e => handleUpdateProductRow(row.id, 'quantity', Number(e.target.value))}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.unit}
                          onChange={e => handleUpdateProductRow(row.id, 'unit', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.targetPrice}
                          onChange={e => handleUpdateProductRow(row.id, 'targetPrice', Number(e.target.value))}
                          className="ent-input ent-mono"
                          style={{ padding: '4px 8px', fontSize: 12, fontWeight: 700 }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={e => handleUpdateProductRow(row.id, 'remarks', e.target.value)}
                          className="ent-input"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveProductRow(row.id)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RFQ Settings & Terms */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">RFQ Sourcing Settings & Terms</div>
            </div>
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Quotation Due Date *</label>
                <input type="date" value={quotationDueDate} onChange={e => setQuotationDueDate(e.target.value)} className="ent-input ent-mono" />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Delivery Terms *</label>
                <select value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)} className="ent-input">
                  <option value="CIF Destination">CIF Destination (Included Freight & Insurance)</option>
                  <option value="FOB Plant">FOB Plant (Buyer Freight Pickup)</option>
                  <option value="Ex-Works">Ex-Works Factory Door</option>
                </select>
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6 }}>Payment Terms *</label>
                <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="ent-input">
                  <option value="45 Days Credit">45 Days Corporate Credit Line</option>
                  <option value="30% Advance + 70% LC">30% Advance + 70% Irrevocable LC</option>
                  <option value="100% Advance">100% Advance RTGS</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowPartialAward} onChange={e => setAllowPartialAward(e.target.checked)} style={{ accentColor: 'var(--c-primary)' }} />
                  <strong>Allow Partial Award</strong> (Split quantities across multiple manufacturers)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={allowMultipleMfg} onChange={e => setAllowMultipleMfg(e.target.checked)} style={{ accentColor: 'var(--c-primary)' }} />
                  <strong>Allow Multiple Manufacturers</strong> (Broadcast sealed bids to all matched units)
                </label>
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="ent-panel">
            <div className="ent-panel-header">
              <div className="ent-section-title">Mandatory Technical Attachments</div>
            </div>
            <div className="ent-panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                { title: 'Upload Specification', icon: FileText },
                { title: 'Upload Artwork', icon: Upload },
                { title: 'Upload Quality Docs', icon: ShieldCheck },
                { title: 'Upload BOQ', icon: Layers },
              ].map((att, i) => {
                const Icon = att.icon;
                return (
                  <div key={i} style={{ border: '1px dashed var(--border-subtle)', borderRadius: 8, padding: 16, textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <Icon size={20} style={{ color: 'var(--text-tertiary)', marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{att.title}</div>
                    <button
                      onClick={() => {
                        const fileName = `${att.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
                        setAttachments(prev => [...prev, { name: fileName, type: att.title, size: '1.8 MB' }]);
                        alert(`Attached ${fileName}`);
                      }}
                      className="ent-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      Choose File
                    </button>
                  </div>
                );
              })}
            </div>

            {attachments.length > 0 && (
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {attachments.map((a, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <File size={12} /> {a.name} ({a.size})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={() => setActiveTabLocal('DASHBOARD')} className="ent-btn-secondary">
              Cancel
            </button>
            <button onClick={() => alert('RFQ Draft Saved.')} className="ent-btn-secondary">
              Save Draft
            </button>
            <button onClick={handleSubmitRFQ} className="ent-btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
              Submit RFQ & Run AI Match →
            </button>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          VIEW 4: AUTOMATED AI MANUFACTURER MATCHING MODULE
      ══════════════════════════════════════════════════════ */}
      {activeTabLocal === 'AI_MATCHING' && createdRfqResult && (
        <AIMatchingModule
          rfq={createdRfqResult}
          onNavigateToQuotes={() => setActiveTab('quotes')}
          onNavigateToDashboard={() => setActiveTabLocal('DASHBOARD')}
        />
      )}

    </div>
  );
};
