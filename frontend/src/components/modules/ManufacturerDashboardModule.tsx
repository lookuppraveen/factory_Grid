import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package, FileText, Tag, ShoppingBag, Truck, Receipt,
  CheckCircle2, ShieldCheck,
  AlertTriangle, Cpu, Eye, X, Activity
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { EnterpriseMetricBar } from '../common/EnterpriseMetricBar';

export const ManufacturerDashboardModule: React.FC = () => {
  const {
    rfqs, quotes, orders, shipments, invoices, mappings,
    manufacturers, setActiveTab, navigateWithFilter, auditLogs,
    orgProfile
  } = useApp();

  // Selected Order for in-place Inspection Modal
  const [inspectedOrder, setInspectedOrder] = useState<any | null>(null);

  // Manufacturer Identity & Organization
  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = orgProfile?.companyName || myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const myMfgId = myMfg?.id || 'm1';
  const myMfgCode = myMfg?.code || 'MFG000401';

  // 1. Mapped Products in Catalog
  const myMappedProductIds = useMemo(() => {
    const pMappings = (mappings || []).filter(m =>
      m.manufacturerId === myMfgId || m.manufacturerCode === myMfgCode || m.manufacturerName?.includes('SunBio')
    );
    return new Set(pMappings.map(m => m.productId));
  }, [mappings, myMfgId, myMfgCode]);

  const mappedCount = myMappedProductIds.size || (mappings || []).length || 18;

  // 2. Active Assigned RFQs (Derived directly from RFQ store matching ManufacturerAssignedRFQsModule logic)
  const assignedRfqs = useMemo(() => {
    const list = (rfqs || []).filter(rfq => {
      const isEligible = rfq.lines.length === 0 || rfq.lines.some(line =>
        !line.productId ||
        myMappedProductIds.has(line.productId) ||
        (line.eligibleManufacturerIds && (line.eligibleManufacturerIds.includes(myMfgId) || line.eligibleManufacturerIds.includes('m1'))) ||
        line.productName.toLowerCase().includes('paracetamol') ||
        line.productName.toLowerCase().includes('amox') ||
        line.productName.toLowerCase().includes('panto') ||
        line.productName.toLowerCase().includes('azithro') ||
        line.productName.toLowerCase().includes('cefix') ||
        line.productName.toLowerCase().includes('atorva')
      );
      return isEligible;
    });

    return [...list].sort((a, b) => {
      const timeA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const timeB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA; // Descending creation date
      }
      return b.id.localeCompare(a.id); // Descending ID
    });
  }, [rfqs, myMappedProductIds, myMfgId]);

  // 3. Submitted Quotes
  const submittedQuotes = useMemo(() => {
    return (quotes || []).filter(q => q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio') || q.status === 'SUBMITTED' || q.status === 'ACCEPTED');
  }, [quotes, myMfgId]);

  // 4. Unified Sub-Orders Store (Synced with Production Execution & AppContext)
  const unifiedSubOrders = useMemo(() => {
    try {
      const saved = localStorage.getItem('factorygrid_unified_suborders_v12');
      if (saved) {
        const parsed = JSON.parse(saved);
        const vals = Object.values(parsed);
        if (vals.length > 0) return vals as any[];
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback: derive directly from orders state
    const list: any[] = [];
    (orders || []).forEach(o => {
      (o.subOrders || []).forEach(so => {
        if (so.manufacturerId === myMfgId || so.manufacturerName?.includes('SunBio')) {
          list.push({
            subOrderNumber: so.subOrderNumber,
            poNumber: so.poNumber || `PO-${so.subOrderNumber}`,
            masterOrderNumber: o.orderNumber,
            customerName: o.customerName,
            manufacturerName: so.manufacturerName,
            productName: so.lines.map(l => l.productName).join(', ') || 'Pharmaceutical Tablets',
            totalQuantity: so.lines.reduce((sum, l) => sum + (l.quantity || 0), 0) || 10000,
            orderValue: so.totalAmount,
            requiredDeliveryDate: o.expectedDeliveryDate || '2026-09-05',
            productionStatus: so.status === 'IN_PRODUCTION' ? 'IN_PRODUCTION' : so.status === 'DELIVERED' ? 'DELIVERED' : 'PO_ACCEPTED',
            status: so.status || 'In Production',
            shipment: so.status === 'DELIVERED' ? { shipmentStatus: 'DELIVERED' } : null
          });
        }
      });
    });

    if (list.length === 0) {
      // Default seeded sub-orders matching ProductionExecutionModule
      list.push(
        {
          subOrderNumber: 'SO-1001-01',
          poNumber: 'PO-2026-1001-01',
          masterOrderNumber: 'MO-2026-1001',
          customerName: 'Apex Pharma PCD Franchise',
          manufacturerName: 'SunBio LifeSciences Ltd',
          productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
          totalQuantity: 12000,
          orderValue: 195300,
          requiredDeliveryDate: '2026-09-02',
          productionStatus: 'IN_PRODUCTION',
          status: 'In Production',
          shipment: null
        },
        {
          subOrderNumber: 'SO-2026-5361-01',
          poNumber: 'PO-SO-2026-5361-01',
          masterOrderNumber: 'MO-2026-5361',
          customerName: 'Apex Pharma PCD Franchise',
          manufacturerName: 'SunBio LifeSciences Ltd',
          productName: 'Paracetamol 500mg & Azithromycin 500mg Tablets',
          totalQuantity: 12000,
          orderValue: 195300,
          requiredDeliveryDate: '2026-09-01',
          productionStatus: 'SCHEDULED',
          status: 'Scheduled',
          shipment: null
        },
        {
          subOrderNumber: 'SO-2026-5230-01',
          poNumber: 'PO-SO-2026-5230-01',
          masterOrderNumber: 'MO-2026-5230',
          customerName: 'Apex Pharma PCD Franchise',
          manufacturerName: 'SunBio LifeSciences Ltd',
          productName: 'Amoxyclav 625mg Tablets',
          totalQuantity: 5000,
          orderValue: 252000,
          requiredDeliveryDate: '2026-09-05',
          productionStatus: 'QUALITY_INSPECTION',
          status: 'Quality Inspection',
          shipment: null
        },
        {
          subOrderNumber: 'SO-2026-5229-01',
          poNumber: 'PO-SO-2026-5229-01',
          masterOrderNumber: 'MO-2026-5229',
          customerName: 'Apex Pharma PCD Franchise',
          manufacturerName: 'SunBio LifeSciences Ltd',
          productName: 'Metformin 500mg Extended Release',
          totalQuantity: 20000,
          orderValue: 168000,
          requiredDeliveryDate: '2026-09-10',
          productionStatus: 'READY_TO_DISPATCH',
          status: 'Ready to Dispatch',
          shipment: null
        }
      );
    }

    return list;
  }, [orders, myMfgId]);

  // Operational Metric Calculations
  const activeOrdersCount = unifiedSubOrders.length;
  const inProductionCount = unifiedSubOrders.filter(s =>
    s.productionStatus === 'IN_PRODUCTION' ||
    s.productionStatus === 'QUALITY_INSPECTION' ||
    s.productionStatus === 'PACKAGING' ||
    s.status === 'In Production'
  ).length;

  const readyToDispatchCount = unifiedSubOrders.filter(s =>
    s.productionStatus === 'READY_TO_DISPATCH' ||
    s.status === 'Ready to Dispatch'
  ).length;

  const inTransitCount = (shipments || []).filter(s =>
    s.status === 'DISPATCHED' || s.status === 'IN_TRANSIT' || s.status === 'OUT_FOR_DELIVERY'
  ).length || unifiedSubOrders.filter(s => s.shipment && s.shipment.shipmentStatus !== 'DELIVERED').length || 1;

  const pendingInvoices = useMemo(() => {
    return (invoices || []).filter(i => i.status === 'OPEN' || i.status === 'PENDING' || i.status === 'OVERDUE');
  }, [invoices]);
  const pendingInvoicesCount = pendingInvoices.length || 2;

  // Action Required Operational Items (Strictly Real Data Driven)
  const actionItems = useMemo(() => {
    const items: Array<{
      id: string;
      icon: any;
      itemType: string;
      reference: string;
      buyer: string;
      productInfo: string;
      dueStatus: string;
      severity: 'urgent' | 'warning' | 'info';
      actionLabel: string;
      onAction: () => void;
    }> = [];

    // 1. Assigned RFQs awaiting quotation response
    const rfqsAwaitingQuote = assignedRfqs.filter(r => {
      const myQuote = (quotes || []).find(q => q.rfqId === r.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
      const isSubmitted = (myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED')) || r.quoteStatus === 'SUBMITTED';
      return !isSubmitted && r.status !== 'Closed' && r.quoteStatus !== 'DECLINED';
    });

    rfqsAwaitingQuote.slice(0, 2).forEach(rfq => {
      items.push({
        id: `action-rfq-${rfq.id}`,
        icon: FileText,
        itemType: 'RFQ Awaiting Quotation',
        reference: rfq.rfqNumber,
        buyer: rfq.customerName,
        productInfo: `${rfq.lines.map(l => l.productName).join(', ')} · ${rfq.lines.reduce((sum, l) => sum + (l.quantity || 0), 0).toLocaleString()} units`,
        dueStatus: `Quote Due: ${rfq.deadlineDate}`,
        severity: 'warning',
        actionLabel: 'Submit Quote',
        onAction: () => {
          navigateWithFilter('rfqs', rfq.rfqNumber);
        }
      });
    });

    // 2. Orders awaiting acceptance or artwork
    const awaitingAcceptance = unifiedSubOrders.filter(s =>
      s.status === 'Awaiting Acceptance' ||
      s.productionStatus === 'PO_ACCEPTED' ||
      s.productionStatus === 'ARTWORK'
    );
    awaitingAcceptance.slice(0, 2).forEach(so => {
      items.push({
        id: `action-so-${so.subOrderNumber}`,
        icon: ShoppingBag,
        itemType: 'Purchase Order Awaiting Action',
        reference: so.poNumber || so.subOrderNumber,
        buyer: so.customerName || 'Apex Pharma PCD Franchise',
        productInfo: `${so.productName} · ${(so.totalQuantity || 0).toLocaleString()} units`,
        dueStatus: `Delivery: ${so.requiredDeliveryDate || '2026-09-05'}`,
        severity: 'urgent',
        actionLabel: 'View Order',
        onAction: () => {
          setActiveTab('orders');
        }
      });
    });

    // 3. Batches ready for dispatch
    const readyLots = unifiedSubOrders.filter(s => s.productionStatus === 'READY_TO_DISPATCH');
    readyLots.slice(0, 1).forEach(lot => {
      items.push({
        id: `action-ready-${lot.subOrderNumber}`,
        icon: Truck,
        itemType: 'Batch Ready for Dispatch',
        reference: lot.subOrderNumber,
        buyer: lot.customerName || 'Apex Pharma PCD Franchise',
        productInfo: `${lot.productName} · QC Passed`,
        dueStatus: 'Awaiting E-Way Bill & Dispatch',
        severity: 'info',
        actionLabel: 'Dispatch Batch',
        onAction: () => {
          setActiveTab('shipments');
        }
      });
    });

    // 4. Invoices pending payment
    if (pendingInvoices.length > 0) {
      const inv = pendingInvoices[0];
      items.push({
        id: `action-inv-${inv.id}`,
        icon: Receipt,
        itemType: 'Invoice Settlement Pending',
        reference: inv.invoiceNumber,
        buyer: inv.buyerOrganization || 'Apex Pharma Franchise',
        productInfo: `Invoice Amount: ₹${inv.totalAmount.toLocaleString('en-IN')}`,
        dueStatus: `Due: ${inv.dueDate}`,
        severity: inv.status === 'OVERDUE' ? 'urgent' : 'info',
        actionLabel: 'View Invoice',
        onAction: () => {
          setActiveTab('invoices');
        }
      });
    }

    return items;
  }, [assignedRfqs, quotes, myMfgId, unifiedSubOrders, pendingInvoices, navigateWithFilter, setActiveTab]);

  // Chronological Recent Activities
  const recentActivities = useMemo(() => {
    const list: Array<{
      id: string;
      icon: any;
      description: string;
      reference: string;
      timestamp: string;
      actionTab: string;
    }> = [];

    // Audit logs
    if (auditLogs && auditLogs.length > 0) {
      auditLogs.slice(0, 3).forEach(log => {
        let actionTab = 'orders';
        if (log.module.includes('RFQ')) actionTab = 'rfqs';
        else if (log.module.includes('Quote')) actionTab = 'quotes';
        else if (log.module.includes('Invoice')) actionTab = 'invoices';
        else if (log.module.includes('Shipment')) actionTab = 'shipments';

        list.push({
          id: `audit-${log.id}`,
          icon: Activity,
          description: log.action,
          reference: `${log.userName} · ${log.module}`,
          timestamp: log.timestamp,
          actionTab
        });
      });
    }

    // Live Sub-Orders
    unifiedSubOrders.slice(0, 2).forEach(so => {
      list.push({
        id: `act-so-${so.subOrderNumber}`,
        icon: ShoppingBag,
        description: `Purchase order received for ${so.productName}`,
        reference: so.poNumber || so.subOrderNumber,
        timestamp: 'Today, 10:32 AM',
        actionTab: 'orders'
      });
    });

    // Assigned RFQs
    assignedRfqs.slice(0, 2).forEach(r => {
      list.push({
        id: `act-rfq-${r.id}`,
        icon: FileText,
        description: `RFQ assigned for pricing: ${r.lines.map(l => l.productName).join(', ')}`,
        reference: r.rfqNumber,
        timestamp: r.createdDate,
        actionTab: 'rfqs'
      });
    });

    // Submitted quotes
    submittedQuotes.slice(0, 2).forEach(q => {
      list.push({
        id: `act-q-${q.id}`,
        icon: Tag,
        description: `Commercial quotation submitted (₹${q.totalAmount.toLocaleString('en-IN')})`,
        reference: q.quoteNumber || `Quote ${q.id.slice(0, 8)}`,
        timestamp: q.submittedDate || 'Yesterday',
        actionTab: 'quotes'
      });
    });

    return list.slice(0, 6);
  }, [auditLogs, unifiedSubOrders, assignedRfqs, submittedQuotes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* ── 1. Header / Welcome Section ────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px 18px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
              Manufacturer Operations Dashboard
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 8px', borderRadius: 999, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={11} /> WHO-GMP & CDSCO Form 25/28 Active
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Plant Operational · 3 Active Lines
            </span>
          </div>
          <h1 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {mfgName} — Operations Control Center
          </h1>
          <div style={{ fontSize: 12.5, color: '#475569', marginTop: 1 }}>
            Here's your current production, procurement and fulfillment overview.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('products')}
            className="ent-btn-secondary"
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Package size={14} /> My Product Catalog ({mappedCount})
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className="ent-btn-primary"
            style={{ padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={14} /> Assigned RFQs ({assignedRfqs.length})
          </button>
        </div>
      </div>

      {/* ── 2. Key Operational Metrics (Enterprise Metric Bar) ────────── */}
      <EnterpriseMetricBar
        title="MANUFACTURING OPERATIONS SUMMARY"
        subtitle="Live production pipeline, RFQ responses, and fulfillment status"
        metrics={[
          {
            label: 'Assigned RFQs',
            value: assignedRfqs.length,
            subtext: 'Pending quote input',
            valueColor: '#1D4ED8',
            onClick: () => setActiveTab('rfqs'),
          },
          {
            label: 'Quotes Submitted',
            value: submittedQuotes.length,
            subtext: 'Active & under review',
            valueColor: '#0D9488',
            onClick: () => setActiveTab('quotes'),
          },
          {
            label: 'Active Purchase Orders',
            value: activeOrdersCount,
            subtext: 'Sub-orders assigned',
            valueColor: '#047857',
            onClick: () => setActiveTab('orders'),
          },
          {
            label: 'Production in Progress',
            value: inProductionCount,
            subtext: 'Active plant batch runs',
            valueColor: '#D97706',
            onClick: () => setActiveTab('production-planning'),
          },
          {
            label: 'Dispatch / Shipments',
            value: inTransitCount,
            subtext: `${readyToDispatchCount} ready · ${inTransitCount} in transit`,
            valueColor: '#7C3AED',
            onClick: () => setActiveTab('shipments'),
          },
          {
            label: 'Invoices & Payments',
            value: pendingInvoicesCount,
            subtext: 'Pending clearance / open',
            valueColor: '#4F46E5',
            onClick: () => setActiveTab('invoices'),
          }
        ]}
      />

      {/* ── 3. Quick Actions Toolbar ────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, boxShadow: '0 1px 2px rgba(15,23,42,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Activity size={14} />
          <span>Quick Actions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('products')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            + Manage Products
          </button>
          <button
            onClick={() => setActiveTab('rfqs')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            View Assigned RFQs
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            Submit Quote
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            Order Management
          </button>
          <button
            onClick={() => setActiveTab('production-planning')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            Production Planning
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            Dispatch & Tracking
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className="ent-btn-secondary"
            style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6 }}
          >
            Invoices & Payments
          </button>
        </div>
      </div>

      {/* ── 4. Action Required Section ──────────────────────────────── */}
      <div className="ent-panel" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div className="ent-panel-header" style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: actionItems.length > 0 ? '#FEF3C7' : '#DCFCE7', color: actionItems.length > 0 ? '#D97706' : '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {actionItems.length > 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
              </div>
              <div className="ent-section-title" style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Action Required
              </div>
            </div>
            <div className="ent-caption" style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>
              Items that need your attention
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: actionItems.length > 0 ? '#FEF3C7' : '#DCFCE7', color: actionItems.length > 0 ? '#B45309' : '#047857', border: '1px solid currentColor' }}>
            {actionItems.length} {actionItems.length === 1 ? 'Item' : 'Items'} Pending
          </span>
        </div>

        <div style={{ padding: 14 }}>
          {actionItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {actionItems.map(item => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 8,
                      transition: 'border-color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ItemIcon size={14} style={{ color: '#0F766E' }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{item.itemType}</span>
                        </div>
                        <span className="ent-mono" style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#FFFFFF', padding: '1px 6px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                          {item.reference}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>
                        {item.productInfo}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Buyer: <strong>{item.buyer}</strong></span>
                        <span>•</span>
                        <span style={{ color: item.severity === 'urgent' ? '#DC2626' : item.severity === 'warning' ? '#B45309' : '#0F766E', fontWeight: 600 }}>
                          {item.dueStatus}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={item.onAction}
                      className="ent-btn-primary"
                      style={{ padding: '5px 12px', fontSize: 11.5, fontWeight: 700, alignSelf: 'flex-start', borderRadius: 6 }}
                    >
                      {item.actionLabel} →
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 20px', background: '#F8FAFC', borderRadius: 6, textAlign: 'center' }}>
              <CheckCircle2 size={26} style={{ color: '#10B981', margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>You're all caught up</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                No supplier actions require your attention right now.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Order & Production Overview Table ─────────────────────── */}
      <div className="ent-panel" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div className="ent-panel-header" style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="ent-section-title" style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              Order & Production Overview
            </div>
            <div className="ent-caption" style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>
              Active purchase orders and manufacturing batches assigned to your facility
            </div>
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
          {unifiedSubOrders.length > 0 ? (
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>Order / Sub-Order</th>
                  <th>Buyer</th>
                  <th>Product</th>
                  <th style={{ width: 120 }}>Quantity</th>
                  <th style={{ width: 120 }}>Delivery</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {unifiedSubOrders.slice(0, 5).map((so, idx) => (
                  <tr key={so.subOrderNumber || idx}>
                    <td className="ent-mono" style={{ fontWeight: 700 }}>
                      <div>{so.subOrderNumber}</div>
                      {so.poNumber && (
                        <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 500 }}>
                          {so.poNumber}
                        </div>
                      )}
                    </td>
                    <td className="ent-body" style={{ fontWeight: 600, color: '#0F172A' }}>
                      {so.customerName || 'Apex Pharma Franchise'}
                    </td>
                    <td className="ent-body">
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{so.productName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Master Order: {so.masterOrderNumber || 'MO-2026'}</div>
                    </td>
                    <td className="ent-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
                      {(so.totalQuantity || 0).toLocaleString()} Units
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12, color: '#334155' }}>
                      {so.requiredDeliveryDate || 'Standard Schedule'}
                    </td>
                    <td>
                      <Badge status={so.status || so.productionStatus || 'IN_PRODUCTION'} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setInspectedOrder(so)}
                        className="ent-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="View Order Details"
                      >
                        <Eye size={12} /> View Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <ShoppingBag size={30} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>No active orders</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Confirmed buyer purchase orders will appear here automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Recent Assigned RFQs (Full-Width Clean Table) ──────────── */}
      <div className="ent-panel" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div className="ent-panel-header" style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="ent-section-title" style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              Recent RFQs
            </div>
            <div className="ent-caption" style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>
              Sourcing requests matched with plant formulation capabilities
            </div>
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
          {assignedRfqs.length > 0 ? (
            <table className="ent-table">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>RFQ Number</th>
                  <th>Buyer</th>
                  <th>Requested Product</th>
                  <th style={{ width: 120 }}>Quantity</th>
                  <th style={{ width: 120 }}>Deadline</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 120, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedRfqs.slice(0, 5).map(rfq => {
                  const myQuote = (quotes || []).find(q => q.rfqId === rfq.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
                  const isSubmitted = (myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED')) || rfq.quoteStatus === 'SUBMITTED';

                  return (
                    <tr key={rfq.id}>
                      <td className="ent-mono" style={{ fontWeight: 700, color: '#0F766E' }}>
                        {rfq.rfqNumber}
                      </td>
                      <td className="ent-body" style={{ fontWeight: 600, color: '#0F172A' }}>
                        {rfq.customerName}
                      </td>
                      <td className="ent-body">
                        <div style={{ fontWeight: 600, color: '#0F172A' }}>
                          {rfq.lines[0]?.productName || 'Pharmaceutical Formulation'}
                          {rfq.lines.length > 1 && (
                            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>
                              (+{rfq.lines.length - 1} more)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          {rfq.remarks || 'Standard commercial requirement'}
                        </div>
                      </td>
                      <td className="ent-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
                        {rfq.lines.reduce((s, l) => s + (l.quantity || 0), 0).toLocaleString()} Units
                      </td>
                      <td className="ent-mono" style={{ fontSize: 12, color: '#334155' }}>
                        {rfq.deadlineDate}
                      </td>
                      <td>
                        <Badge status={isSubmitted ? 'SUBMITTED' : (rfq.quoteStatus || rfq.status || 'ACTION_NEEDED')} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => navigateWithFilter('rfqs', rfq.rfqNumber)}
                          className={isSubmitted ? "ent-btn-secondary" : "ent-btn-primary"}
                          style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6 }}
                        >
                          {isSubmitted ? 'View Quote' : 'Submit Quote'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <FileText size={28} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>No assigned RFQs</div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                New buyer formulation requests will appear here automatically.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 7. Recent Activity Timeline ─────────────────────────────── */}
      <div className="ent-panel" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <div className="ent-panel-header" style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} style={{ color: '#0F766E' }} />
            <div>
              <div className="ent-section-title" style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Recent Activity
              </div>
              <div className="ent-caption" style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>
                Latest manufacturing, RFQ and logistics milestones recorded on platform
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentActivities.length > 0 ? (
            recentActivities.map(act => {
              const ActIcon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={() => setActiveTab(act.actionTab)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                  title="Click to view corresponding record"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 4, background: 'rgba(15, 118, 110, 0.08)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ActIcon size={12} />
                    </div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{act.description}</span>
                      {act.reference && (
                        <span className="ent-mono" style={{ marginLeft: 8, fontSize: 11, color: '#64748B', background: '#FFFFFF', padding: '1px 6px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                          {act.reference}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', marginLeft: 12, flexShrink: 0 }}>
                    {act.timestamp}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '16px 0', textAlign: 'center', color: '#64748B', fontSize: 12 }}>
              No recent activity logged.
            </div>
          )}
        </div>
      </div>

      {/* ── 8. Read-Only Purchase Order Inspection Modal ────────────── */}
      {inspectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 10, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E2E8F0' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Purchase Order Inspection
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#0F172A' }}>
                  Ref: {inspectedOrder.poNumber || inspectedOrder.subOrderNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectedOrder(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Meta Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12, background: '#F8FAFC', padding: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Customer / Buyer</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{inspectedOrder.customerName || 'Apex Pharma PCD Franchise'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sub-Order Code</div>
                <div className="ent-mono" style={{ fontWeight: 700, color: '#0F766E', marginTop: 2 }}>{inspectedOrder.subOrderNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Delivery Schedule</div>
                <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{inspectedOrder.requiredDeliveryDate || 'Standard Schedule'}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Operational Status</div>
                <div style={{ marginTop: 2 }}>
                  <Badge status={inspectedOrder.status || inspectedOrder.productionStatus || 'IN_PRODUCTION'} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Batch Quantity</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {(inspectedOrder.totalQuantity || 10000).toLocaleString()} Units
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Order Commercial Value</div>
                <div style={{ fontWeight: 800, color: '#0F766E', marginTop: 2, fontSize: 14 }}>
                  ₹{(inspectedOrder.orderValue || 195300).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: 12, background: '#FFFFFF' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                Allocated Formulation Product
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                {inspectedOrder.productName}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                Manufacturer Plant: <strong>{mfgName}</strong> (Unit II, Jeedimetla IDA, Hyderabad)
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setInspectedOrder(null)}
                className="ent-btn-secondary"
                style={{ padding: '7px 14px', fontSize: 12 }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInspectedOrder(null);
                  setActiveTab('production-planning');
                }}
                className="ent-btn-primary"
                style={{ padding: '7px 16px', fontSize: 12, fontWeight: 700 }}
              >
                Open in Production Planning →
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
