import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag, Package, CheckCircle2, Clock, X, Check, AlertCircle,
  Building2, ArrowRight, Eye, AlertTriangle, Send, FileText, ChevronRight, RefreshCw, XCircle, Search, Download, Receipt
} from 'lucide-react';
import { ProformaInvoiceSection } from '../common/ProformaInvoiceSection';

export const getEffectiveOrderStatusInfo = (so: any) => {
  if (so.status === 'Rejected') {
    return {
      statusKey: 'Rejected',
      label: 'Rejected',
      badgeBg: '#FEE2E2',
      badgeColor: '#B91C1C',
      badgeBorder: '#FCA5A5'
    };
  }

  if (so.status === 'Awaiting Acceptance' || so.status === 'AWAITING_ACCEPTANCE' || so.productionStatus === 'AWAITING_ACCEPTANCE') {
    return {
      statusKey: 'Awaiting Acceptance',
      label: 'Awaiting Acceptance',
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309',
      badgeBorder: '#FDE68A'
    };
  }

  const ps = so.productionStatus;
  if (ps === 'PO_ACCEPTED') {
    return {
      statusKey: 'Accepted',
      label: 'Accepted',
      badgeBg: '#EFF6FF',
      badgeColor: '#1D4ED8',
      badgeBorder: '#BFDBFE'
    };
  }
  if (ps === 'ARTWORK') {
    return {
      statusKey: 'Artwork Pending',
      label: 'Artwork Pending',
      badgeBg: '#FFFBEB',
      badgeColor: '#D97706',
      badgeBorder: '#FCD34D'
    };
  }
  if (ps === 'SCHEDULED') {
    return {
      statusKey: 'Scheduled',
      label: 'Scheduled',
      badgeBg: '#E0F2FE',
      badgeColor: '#0369A1',
      badgeBorder: '#BAE6FD'
    };
  }
  if (ps === 'IN_PRODUCTION') {
    return {
      statusKey: 'In Production',
      label: 'In Production',
      badgeBg: '#F0F9FF',
      badgeColor: '#0284C7',
      badgeBorder: '#7DD3FC'
    };
  }
  if (ps === 'QUALITY_INSPECTION' || ps === 'PACKAGING' || ps === 'QUALITY_HOLD') {
    return {
      statusKey: 'Quality & Packaging',
      label: 'Quality & Packaging',
      badgeBg: '#F5F3FF',
      badgeColor: '#6D28D9',
      badgeBorder: '#DDD6FE'
    };
  }
  if (ps === 'READY_TO_DISPATCH') {
    return {
      statusKey: 'Ready to Dispatch',
      label: 'Ready to Dispatch',
      badgeBg: '#ECFDF5',
      badgeColor: '#059669',
      badgeBorder: '#A7F3D0'
    };
  }
  if (ps === 'COMPLETED') {
    return {
      statusKey: 'Completed',
      label: 'Completed',
      badgeBg: '#DCFCE7',
      badgeColor: '#15803D',
      badgeBorder: '#86EFAC'
    };
  }

  if (so.status === 'Scheduled') {
    return {
      statusKey: 'Accepted',
      label: 'Accepted',
      badgeBg: '#EFF6FF',
      badgeColor: '#1D4ED8',
      badgeBorder: '#BFDBFE'
    };
  }

  return {
    statusKey: 'Awaiting Acceptance',
    label: 'Awaiting Acceptance',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    badgeBorder: '#FDE68A'
  };
};

export const ManufacturerSubOrderModule: React.FC = () => {
  const { manufacturers, setActiveTab, addAuditLog } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const myMfgCode = myMfg?.code || 'MFG000401';

  // Sub-Order State for Manufacturers (Keyed by subOrderCode)
  const { orders } = useApp();
  const [subOrdersState, setSubOrdersState] = useState<Record<string, {
    subOrderNumber: string;
    poNumber: string;
    masterOrderNumber: string;
    mfgId: string;
    mfgName: string;
    customerName: string;
    orderDate: string;
    deliveryDate: string;
    shippingAddress: string;
    billingAddress: string;
    sourceQuoteRef: string;
    productsCount: number;
    totalQuantity: number;
    orderValue: number;
    leadTimeDays: number;
    status: 'Awaiting Acceptance' | 'Scheduled' | 'Rejected';
    rejectionReason?: string;
    rejectionRemarks?: string;
    acceptedAt?: string;
    lines: {
      productName: string;
      dosageForm: string;
      quantity: number;
      unitPrice: number;
      totalCost: number;
      leadTime: string;
    }[];
  }>>({});

  // Modal Control States
  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<boolean>(false);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [targetActionSubOrderCode, setTargetActionSubOrderCode] = useState<string>('SO-1001-01');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState<string>('Capacity Constraints');
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [rejectionFormError, setRejectionFormError] = useState<string | null>(null);

  // Success Banner Notification State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync sub-orders with UNIFIED_STORAGE_KEY (localStorage) & AppContext active orders
  useEffect(() => {
    const loadUnifiedSubOrders = () => {
      try {
        const raw = localStorage.getItem('factorygrid_unified_suborders_v12');
        const parsed = raw ? JSON.parse(raw) : {};
        const loaded: Record<string, any> = {};

        // 1. Sync from active orders created in AppContext via RFQ flow
        if (Array.isArray(orders)) {
          orders.forEach((mo: any) => {
            if (Array.isArray(mo.subOrders)) {
              mo.subOrders.forEach((so: any) => {
                const subNum = so.subOrderNumber;
                if (subNum) {
                  const savedObj = parsed[subNum] || {};
                  loaded[subNum] = {
                    subOrderNumber: subNum,
                    poNumber: so.poNumber || `PO-${subNum}`,
                    masterOrderNumber: mo.orderNumber || 'MO-2026-1001',
                    mfgId: so.manufacturerId || 'm1',
                    mfgName: so.manufacturerName || myMfgName,
                    customerName: mo.customerName || 'Apex Pharma PCD Franchise',
                    orderDate: mo.createdDate || '25 Aug 2026',
                    deliveryDate: mo.expectedDeliveryDate || '02 Sep 2026',
                    shippingAddress: mo.shippingAddress || 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
                    billingAddress: 'Apex Corporate Office, Barakhamba Road, New Delhi - 110001',
                    sourceQuoteRef: 'Q-2026-1001',
                    productsCount: so.lines?.length || 1,
                    totalQuantity: so.lines?.reduce((sum: number, l: any) => sum + l.quantity, 0) || 10000,
                    orderValue: so.totalAmount || 150000,
                    leadTimeDays: 14,
                    status: savedObj.status || 'Awaiting Acceptance',
                    productionStatus: savedObj.productionStatus || 'PO_ACCEPTED',
                    lines: so.lines?.map((l: any) => ({
                      productName: l.productName || 'Pharmaceutical Product',
                      dosageForm: 'Tablet',
                      quantity: l.quantity || 10000,
                      unitPrice: l.unitPrice || 15.0,
                      totalCost: l.totalPrice || (l.quantity * l.unitPrice) || 150000,
                      leadTime: '14 Days'
                    })) || [
                      { productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: 10000, unitPrice: 15.0, totalCost: 150000, leadTime: '14 Days' }
                    ]
                  };
                }
              });
            }
          });
        }

        // 2. Merge all direct records from factorygrid_unified_suborders_v12
        Object.keys(parsed).forEach(key => {
          const uObj = parsed[key];
          if (!loaded[key]) {
            loaded[key] = {
              subOrderNumber: uObj.subOrderNumber || key,
              poNumber: uObj.poNumber || `PO-${key}`,
              masterOrderNumber: uObj.masterOrderNumber || 'MO-2026-1001',
              mfgId: 'm1',
              mfgName: uObj.manufacturerName || myMfgName,
              customerName: uObj.customerName || 'Apex Pharma PCD Franchise',
              orderDate: '25 Aug 2026',
              deliveryDate: uObj.requiredDeliveryDate || '02 Sep 2026',
              shippingAddress: 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020',
              billingAddress: 'Apex Corporate Office, Barakhamba Road, New Delhi - 110001',
              sourceQuoteRef: 'Q-2026-1001',
              productsCount: 1,
              totalQuantity: uObj.totalQuantity || 10000,
              orderValue: uObj.orderValue || 150000,
              leadTimeDays: uObj.leadTimeDays || 14,
              status: uObj.status || 'Awaiting Acceptance',
              productionStatus: uObj.productionStatus,
              lines: uObj.lines || [
                { productName: uObj.productName || 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', quantity: uObj.totalQuantity || 10000, unitPrice: 15.0, totalCost: uObj.orderValue || 150000, leadTime: '14 Days' }
              ]
            };
          } else {
            loaded[key] = {
              ...loaded[key],
              productionStatus: uObj.productionStatus || loaded[key].productionStatus,
              status: uObj.status || loaded[key].status
            };
          }
        });

        setSubOrdersState(loaded);
      } catch (err) {
        console.error('Error loading unified sub-orders:', err);
      }
    };

    loadUnifiedSubOrders();
    window.addEventListener('storage', loadUnifiedSubOrders);
    return () => window.removeEventListener('storage', loadUnifiedSubOrders);
  }, [orders, myMfgName]);

  // STRICT MANUFACTURER FILTERING & EFFECTIVE STATUS MAPPING:
  const allMyAssignedOrders = useMemo(() => {
    return Object.values(subOrdersState).filter(so => {
      return so.mfgId === myMfgId || so.mfgName.toLowerCase().includes('sunbio');
    });
  }, [subOrdersState, myMfgId]);

  const myAssignedOrders = useMemo(() => {
    return allMyAssignedOrders.filter(so => {
      const info = getEffectiveOrderStatusInfo(so);

      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        matchesStatus = info.statusKey === statusFilter;
      }

      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const matchSO = so.subOrderNumber.toLowerCase().includes(q);
        const matchMO = so.masterOrderNumber.toLowerCase().includes(q);
        const matchPO = so.poNumber.toLowerCase().includes(q);
        const matchCust = so.customerName.toLowerCase().includes(q);
        const matchProd = so.lines.some(l => l.productName.toLowerCase().includes(q));
        const matchStat = info.label.toLowerCase().includes(q);
        matchesSearch = matchSO || matchMO || matchPO || matchCust || matchProd || matchStat;
      }

      return matchesStatus && matchesSearch;
    });
  }, [allMyAssignedOrders, statusFilter, searchQuery]);

  // Metric Summary Counts dynamically calculated for all 8 stages
  const metrics = useMemo(() => {
    const open = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey !== 'Rejected').length;
    const awaiting = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Awaiting Acceptance').length;
    const accepted = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Accepted').length;
    const artwork = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Artwork Pending').length;
    const scheduled = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Scheduled').length;
    const inProd = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'In Production').length;
    const qcPack = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Quality & Packaging').length;
    const ready = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Ready to Dispatch').length;
    const completed = allMyAssignedOrders.filter(o => getEffectiveOrderStatusInfo(o).statusKey === 'Completed').length;

    return { open, awaiting, accepted, artwork, scheduled, inProd, qcPack, ready, completed };
  }, [allMyAssignedOrders]);

  // Handle Open Accept Modal
  const handleOpenAcceptModal = (code: string) => {
    setTargetActionSubOrderCode(code);
    setShowAcceptModal(true);
  };

  // Confirm Accept Action
  const handleConfirmAccept = () => {
    const timeStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const code = targetActionSubOrderCode;

    setSubOrdersState(prev => {
      const updatedObj = {
        ...prev[code],
        status: 'Scheduled' as const,
        productionStatus: 'ARTWORK',
        acceptedAt: timeStr
      };
      const next = { ...prev, [code]: updatedObj };

      try {
        const raw = localStorage.getItem('factorygrid_unified_suborders_v12');
        const store = raw ? JSON.parse(raw) : {};
        store[code] = {
          ...(store[code] || {}),
          subOrderNumber: code,
          poNumber: updatedObj.poNumber,
          masterOrderNumber: updatedObj.masterOrderNumber,
          customerName: updatedObj.customerName,
          manufacturerName: myMfgName,
          totalQuantity: updatedObj.totalQuantity,
          orderValue: updatedObj.orderValue,
          status: 'Scheduled',
          productionStatus: 'ARTWORK'
        };
        localStorage.setItem('factorygrid_unified_suborders_v12', JSON.stringify(store));
      } catch (e) {
        console.error(e);
      }

      return next;
    });

    setShowAcceptModal(false);
    setSuccessBanner(`Purchase Order ${subOrdersState[code]?.poNumber || code} accepted successfully. Production Planning is now available.`);
    addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} ACCEPTED Purchase Order ${subOrdersState[code]?.poNumber}.`);
  };

  // Handle Open Reject Modal
  const handleOpenRejectModal = (code: string) => {
    setTargetActionSubOrderCode(code);
    setRejectionReason('Capacity Constraints');
    setRejectionRemarks('');
    setRejectionFormError(null);
    setShowRejectModal(true);
  };

  // Confirm Reject Action
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectionFormError('Please select a rejection reason.');
      return;
    }

    setSubOrdersState(prev => ({
      ...prev,
      [targetActionSubOrderCode]: {
        ...prev[targetActionSubOrderCode],
        status: 'Rejected',
        rejectionReason,
        rejectionRemarks
      }
    }));

    setShowRejectModal(false);
    setSuccessBanner(null);
    addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} REJECTED Purchase Order ${subOrdersState[targetActionSubOrderCode]?.poNumber}. Reason: ${rejectionReason}`);
  };

  const activeDetailSubOrder = selectedSubOrderCode ? subOrdersState[selectedSubOrderCode] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC' }}>
      
      {/* ── Breadcrumb & Command Header ──────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 4 }}>
            <span>FactoryGrid</span>
            <span>/</span>
            <span>supplier</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Order Management</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Order Management
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Manufacturer-specific purchase orders and assigned sub-orders for <strong style={{ color: '#0F766E' }}>{myMfgName}</strong>
          </p>
        </div>
      </div>

      {/* ── Success Notification Banner ──────────────────────────── */}
      {successBanner && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>{successBanner}</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 1 }}>Facility confirmation recorded. Ready for production execution.</div>
            </div>
          </div>

          <button onClick={() => setSuccessBanner(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Metric Summary Cards Bar ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Open Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{metrics.open}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Active assigned</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Awaiting Acc.</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309', fontFamily: 'monospace', marginTop: 4 }}>{metrics.awaiting}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Pending sign-off</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Accepted</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1D4ED8', fontFamily: 'monospace', marginTop: 4 }}>{metrics.accepted}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>PO accepted</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Artwork Pend.</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.artwork}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Artwork stage</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Scheduled</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0369A1', fontFamily: 'monospace', marginTop: 4 }}>{metrics.scheduled}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Production slotted</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In Production</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7', fontFamily: 'monospace', marginTop: 4 }}>{metrics.inProd}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Active manufacturing</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Quality &amp; Pack</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#6D28D9', fontFamily: 'monospace', marginTop: 4 }}>{metrics.qcPack}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>QC &amp; Packaging</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ready to Dispatch</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', fontFamily: 'monospace', marginTop: 4 }}>{metrics.ready}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Dispatched ready</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.completed}</div>
          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Fulfilled &amp; delivered</div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'Awaiting Acceptance', label: 'Awaiting Acceptance' },
            { id: 'Accepted', label: 'Accepted' },
            { id: 'Artwork Pending', label: 'Artwork Pending' },
            { id: 'Scheduled', label: 'Scheduled' },
            { id: 'In Production', label: 'In Production' },
            { id: 'Quality & Packaging', label: 'Quality & Packaging' },
            { id: 'Ready to Dispatch', label: 'Ready to Dispatch' },
            { id: 'Completed', label: 'Completed' },
            { id: 'Rejected', label: 'Rejected' },
          ].map(tab => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: active ? 800 : 600,
                  cursor: 'pointer',
                  border: active ? '1px solid #0F766E' : '1px solid #E2E8F0',
                  background: active ? '#F0FDFA' : '#F8FAFC',
                  color: active ? '#0F766E' : '#64748B',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', width: 280 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search sub-order, PO #, customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 12px 7px 32px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none' }}
          />
        </div>
      </div>

      {/* ── Main Section: Orders Assigned to Me B2B Table ───────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ORDERS ASSIGNED TO ME ({myAssignedOrders.length} {myAssignedOrders.length === 1 ? 'Sub-Order' : 'Sub-Orders'})
          </div>
        </div>

        {myAssignedOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
            <Clock size={32} style={{ color: '#94A3B8', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No assigned sub-orders found.</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sub-orders assigned to {myMfgName} will appear in this table.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER NUMBER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MASTER ORDER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PURCHASE ORDER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>CUSTOMER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>DELIVERY SCHEDULE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCTS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ORDER VALUE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {myAssignedOrders.map(so => {
                  const info = getEffectiveOrderStatusInfo(so);
                  const isAwaiting = info.statusKey === 'Awaiting Acceptance';
                  const isAccepted = info.statusKey !== 'Awaiting Acceptance' && info.statusKey !== 'Rejected';

                  return (
                    <tr key={so.subOrderNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        {so.subOrderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                        {so.masterOrderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>
                        {so.poNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                        {so.customerName}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {so.orderDate || '14 Aug 2026'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1D4ED8', fontWeight: 600 }}>
                        {so.deliveryDate || `${so.leadTimeDays} Days`}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{so.lines.length} {so.lines.length === 1 ? 'Product' : 'Products'}</div>
                        <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {so.lines.map(l => l.productName).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                        {so.totalQuantity.toLocaleString()} Units
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        ₹{so.orderValue.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                          background: info.badgeBg,
                          color: info.badgeColor,
                          border: `1px solid ${info.badgeBorder}`
                        }}>
                          {info.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSubOrderCode(so.subOrderNumber);
                              setViewDetailModal(true);
                            }}
                            style={{
                              padding: '5px 12px', borderRadius: 6,
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              color: '#0F766E',
                              fontWeight: 700, fontSize: 11.5, cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Eye size={13} /> View PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 1. ACCEPT CONFIRMATION MODAL ─────────────────────────── */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAcceptModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Accept Purchase Order?
              </h3>
              <button onClick={() => setShowAcceptModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
              By accepting this order, you confirm that your facility will fulfill the assigned products and quantities according to the agreed quotation.
            </p>

            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#0F766E' }}>
              <div>Purchase Order: <strong>{subOrdersState[targetActionSubOrderCode]?.poNumber}</strong></div>
              <div>Sub-Order: <strong>{targetActionSubOrderCode}</strong></div>
              <div>Total Quantity: <strong>{subOrdersState[targetActionSubOrderCode]?.totalQuantity.toLocaleString()} Units</strong> · Value: <strong>₹{subOrdersState[targetActionSubOrderCode]?.orderValue.toLocaleString()}</strong></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowAcceptModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Accept Order
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 2. REJECT REASON MODAL ────────────────────────────────── */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowRejectModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#B91C1C', margin: 0 }}>Reject Purchase Order</h3>
              <button onClick={() => setShowRejectModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {rejectionFormError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: 10, fontSize: 12, color: '#B91C1C' }}>
                  {rejectionFormError}
                </div>
              )}

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFF' }}
                >
                  <option value="Capacity Constraints">Capacity Constraints / Batch Slot Full</option>
                  <option value="Raw Material Delay">Raw Material / Active Ingredient Shortage</option>
                  <option value="Lead Time Mismatch">Required Delivery Schedule Cannot Be Met</option>
                  <option value="Price Escalation">Price / Tax Structure Revision Required</option>
                  <option value="Facility Under Maintenance">Facility Maintenance / Audit Scheduled</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Additional Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Provide additional details regarding rejection..."
                  value={rejectionRemarks}
                  onChange={e => setRejectionRemarks(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setShowRejectModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                >
                  Reject Order
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ── 3. VIEW COMPLETE PURCHASE ORDER (PO) MODAL ───────────── */}
      {viewDetailModal && activeDetailSubOrder && (() => {
        const subtotal = activeDetailSubOrder.lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewDetailModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 26, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Official B2B Purchase Order Document</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
                    Purchase Order Review: {activeDetailSubOrder.poNumber}
                  </h3>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                    Sub-Order Ref: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{activeDetailSubOrder.subOrderNumber}</strong> · Master Order Ref: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{activeDetailSubOrder.masterOrderNumber}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                    background: activeDetailSubOrder.status === 'Scheduled' ? '#DCFCE7' : '#FEF3C7',
                    color: activeDetailSubOrder.status === 'Scheduled' ? '#15803D' : '#B45309',
                    border: `1px solid ${activeDetailSubOrder.status === 'Scheduled' ? '#86EFAC' : '#FDE68A'}`
                  }}>
                    {activeDetailSubOrder.status === 'Scheduled' ? 'PO Accepted ✓' : 'Awaiting Acceptance'}
                  </span>
                  <button onClick={() => setViewDetailModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Purchase Order Metadata Details Grid */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, fontSize: 12.5 }}>
                <div><strong>PO Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E' }}>{activeDetailSubOrder.poNumber}</span></div>
                <div><strong>Sub-Order Ref:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeDetailSubOrder.subOrderNumber}</span></div>
                <div><strong>Parent Master Order:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeDetailSubOrder.masterOrderNumber}</span></div>
                <div>
                  <strong>Customer / Buyer:</strong> <strong style={{ color: '#0F172A' }}>{activeDetailSubOrder.customerName}</strong>
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST Number: {activeDetailSubOrder.buyerGst || '36APXPH0001A1Z5'}</div>
                </div>
                <div>
                  <strong>Supplier / Manufacturer:</strong> <strong style={{ color: '#0F766E' }}>{activeDetailSubOrder.mfgName}</strong>
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST Number: {activeDetailSubOrder.mfgGst || '02SUNBI0001A1Z8'}</div>
                </div>
                <div><strong>Source Quote Reference:</strong> {activeDetailSubOrder.sourceQuoteRef || 'Q-2026-1001'}</div>
                <div><strong>Order Date:</strong> {activeDetailSubOrder.orderDate || '14 Aug 2026'}</div>
                <div><strong>Delivery Schedule:</strong> <span style={{ color: '#1D4ED8', fontWeight: 700 }}>{activeDetailSubOrder.deliveryDate || `${activeDetailSubOrder.leadTimeDays} Days`}</span></div>
                <div><strong>Shipping Address:</strong> {activeDetailSubOrder.shippingAddress || 'Industrial Zone, Plot 14, Phase I, New Delhi - 110020'}</div>
                <div>
                  <strong>Billing Address:</strong> {activeDetailSubOrder.billingAddress || 'Apex Corporate Office, Barakhamba Road, New Delhi - 110001'}
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST Number: {activeDetailSubOrder.buyerGst || '36APXPH0001A1Z5'}</div>
                </div>
              </div>

              {/* Product Line Items Table */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: 10 }}>
                  Purchase Order Line Items ({activeDetailSubOrder.lines.length} Items)
                </div>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT NAME</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>QUANTITY</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right' }}>LINE TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDetailSubOrder.lines.map((line, lIdx) => (
                        <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{line.productName} ({line.dosageForm})</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>₹{line.unitPrice.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace', textAlign: 'right', color: '#0F172A' }}>₹{line.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Summary */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 12.5, color: '#0F766E' }}>
                  Total Quantity: <strong>{activeDetailSubOrder.totalQuantity.toLocaleString()} Units</strong> | Subtotal: <strong>₹{subtotal.toLocaleString()}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total PO Value</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                    ₹{activeDetailSubOrder.orderValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* ── PROFORMA INVOICE UPLOAD & PREVIEW SECTION ── */}
              <ProformaInvoiceSection
                poNumber={activeDetailSubOrder.poNumber}
                subOrderCode={activeDetailSubOrder.subOrderNumber}
                allowUpload={true}
              />

              {/* Action Buttons inside Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => alert(`Downloading Purchase Order PDF for ${activeDetailSubOrder.poNumber}...`)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} /> Download Official PO PDF
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {activeDetailSubOrder.status === 'Awaiting Acceptance' && (
                    <>
                      <button
                        onClick={() => {
                          setViewDetailModal(false);
                          handleOpenRejectModal(activeDetailSubOrder.subOrderNumber);
                        }}
                        style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Reject Order
                      </button>
                      <button
                        onClick={() => {
                          setViewDetailModal(false);
                          handleOpenAcceptModal(activeDetailSubOrder.subOrderNumber);
                        }}
                        style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Accept Purchase Order
                      </button>
                    </>
                  )}
                  <button onClick={() => setViewDetailModal(false)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
