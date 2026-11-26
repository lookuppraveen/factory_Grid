import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag, Package, CheckCircle2, Clock, X, Check, AlertCircle,
  Building2, ArrowRight, Eye, AlertTriangle, Send, FileText, ChevronRight, RefreshCw, XCircle, Search, Download, Receipt, Lock
} from 'lucide-react';
import { ProformaInvoiceSection } from '../common/ProformaInvoiceSection';
import {
  manufacturerOrderApi,
  ManufacturerOrderItem,
  ManufacturerOrderMetrics,
  PurchaseOrderDetailResponse
} from '../../services/manufacturerOrderApi';

export const getEffectiveOrderStatusInfo = (so: any) => {
  const st = (so.status || '').toLowerCase();
  const ps = (so.productionStatus || '').toUpperCase();

  if (st === 'rejected' || ps === 'REJECTED') {
    return {
      statusKey: 'Rejected',
      label: 'Rejected',
      badgeBg: '#FEE2E2',
      badgeColor: '#B91C1C',
      badgeBorder: '#FCA5A5'
    };
  }

  if (
    st === 'awaiting acceptance' ||
    st === 'awaiting_acceptance' ||
    ps === 'AWAITING_ACCEPTANCE'
  ) {
    return {
      statusKey: 'Awaiting Acceptance',
      label: 'Awaiting Acceptance',
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309',
      badgeBorder: '#FDE68A'
    };
  }

  if (ps === 'PO_ACCEPTED' || st === 'accepted') {
    return {
      statusKey: 'Accepted',
      label: 'Accepted',
      badgeBg: '#EFF6FF',
      badgeColor: '#1D4ED8',
      badgeBorder: '#BFDBFE'
    };
  }
  if (ps === 'ARTWORK' || ps === 'ARTWORK_PENDING') {
    return {
      statusKey: 'Artwork Pending',
      label: 'Artwork Pending',
      badgeBg: '#FFFBEB',
      badgeColor: '#D97706',
      badgeBorder: '#FCD34D'
    };
  }
  if (ps === 'SCHEDULED' || st === 'scheduled') {
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
  if (
    ps === 'QUALITY_INSPECTION' ||
    ps === 'PACKAGING' ||
    ps === 'QUALITY_PACKAGING' ||
    ps === 'QUALITY_HOLD'
  ) {
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
  if (ps === 'COMPLETED' || st === 'completed') {
    return {
      statusKey: 'Completed',
      label: 'Completed',
      badgeBg: '#DCFCE7',
      badgeColor: '#15803D',
      badgeBorder: '#86EFAC'
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
  const { addAuditLog, authUser } = useApp();

  // Real Database Orders & Metrics States
  const [orders, setOrders] = useState<ManufacturerOrderItem[]>([]);
  const [metrics, setMetrics] = useState<ManufacturerOrderMetrics>({
    open: 0,
    awaiting: 0,
    accepted: 0,
    artwork: 0,
    scheduled: 0,
    inProd: 0,
    qcPack: 0,
    ready: 0,
    completed: 0,
    rejected: 0,
    total: 0,
  });
  const [myMfgName, setMyMfgName] = useState<string>(authUser?.companyName || 'My Facility');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal Control States
  const [selectedSubOrderCode, setSelectedSubOrderCode] = useState<string | null>(null);
  const [viewDetailModal, setViewDetailModal] = useState<boolean>(false);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [targetActionSubOrderCode, setTargetActionSubOrderCode] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [acceptModalError, setAcceptModalError] = useState<string | null>(null);

  // Real PO Detail State for View PO modal
  const [activePurchaseOrder, setActivePurchaseOrder] = useState<PurchaseOrderDetailResponse | null>(null);
  const [isLoadingPo, setIsLoadingPo] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState<string>('Capacity Constraints');
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [rejectionFormError, setRejectionFormError] = useState<string | null>(null);

  // Success Banner Notification State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Fetch orders from real backend API (PostgreSQL single source of truth)
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await manufacturerOrderApi.listOrders({
        status: statusFilter,
        search: searchQuery,
      });

      setOrders(res.orders || []);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
      if (res.manufacturer?.companyName) {
        setMyMfgName(res.manufacturer.companyName);
      }
    } catch (err: any) {
      console.error('Failed to load manufacturer orders from PostgreSQL:', err);
      setFetchError(err.message || 'Unable to connect to FactoryGrid API server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle View PO Modal - loads authentic PO from backend
  const handleOpenViewPo = async (so: ManufacturerOrderItem) => {
    setSelectedSubOrderCode(so.subOrderNumber);
    setViewDetailModal(true);
    setIsLoadingPo(true);
    setActivePurchaseOrder(null);
    try {
      const poData = await manufacturerOrderApi.getPurchaseOrder(so.poNumber || so.subOrderNumber);
      setActivePurchaseOrder(poData);
    } catch (err: any) {
      console.error('Failed to load authentic PO document:', err);
    } finally {
      setIsLoadingPo(false);
    }
  };

  // Handle Open Accept Modal
  const handleOpenAcceptModal = (so: ManufacturerOrderItem) => {
    if (so.advanceRequired && so.advanceOutstanding > 0) {
      alert(`🔒 Manufacturer Execution Blocked:\n\nRequired Advance Payment (₹${so.advanceOutstanding.toLocaleString('en-IN')}) is outstanding on Master Order ${so.masterOrderNumber}.\n\nManufacturer acceptance and execution is locked until full advance is recorded.`);
      return;
    }
    setTargetActionSubOrderCode(so.subOrderNumber);
    setShowAcceptModal(true);
  };

  // Confirm Accept Action against PostgreSQL
  const handleConfirmAccept = async () => {
    setActionInProgress(true);
    try {
      await manufacturerOrderApi.acceptOrder(targetActionSubOrderCode);
      setShowAcceptModal(false);
      setViewDetailModal(false);
      setSuccessBanner(`Purchase Order for Sub-Order ${targetActionSubOrderCode} accepted successfully in PostgreSQL. Released to Artwork / Production Planning.`);
      addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} ACCEPTED Purchase Order for ${targetActionSubOrderCode}.`);
      await fetchOrders();
    } catch (err: any) {
      alert(`Failed to accept order:\n\n${err.message || 'Unexpected server error'}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Open Reject Modal
  const handleOpenRejectModal = (so: ManufacturerOrderItem) => {
    setTargetActionSubOrderCode(so.subOrderNumber);
    setRejectionReason('Capacity Constraints');
    setRejectionRemarks('');
    setRejectionFormError(null);
    setShowRejectModal(true);
  };

  // Confirm Reject Action against PostgreSQL
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectionFormError('Please select a rejection reason.');
      return;
    }

    setActionInProgress(true);
    try {
      await manufacturerOrderApi.rejectOrder(targetActionSubOrderCode, rejectionReason, rejectionRemarks);
      setShowRejectModal(false);
      setViewDetailModal(false);
      setSuccessBanner(null);
      addAuditLog('Sub-Order Engine', `Manufacturer ${myMfgName} REJECTED Purchase Order for ${targetActionSubOrderCode}. Reason: ${rejectionReason}`);
      await fetchOrders();
    } catch (err: any) {
      setRejectionFormError(err.message || 'Failed to reject order on server');
    } finally {
      setActionInProgress(false);
    }
  };

  const activeDetailSubOrder = selectedSubOrderCode
    ? orders.find(o => o.subOrderNumber === selectedSubOrderCode) || null
    : null;

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

        <button
          onClick={fetchOrders}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: '#334155',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Orders
        </button>
      </div>

      {/* ── Success Notification Banner ──────────────────────────── */}
      {successBanner && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>{successBanner}</div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 1 }}>Facility confirmation recorded in PostgreSQL. Production workflow synced.</div>
            </div>
          </div>
          <button onClick={() => setSuccessBanner(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {fetchError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991B1B' }}>Unable to load orders from database</div>
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 1 }}>{fetchError}</div>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            style={{ padding: '6px 12px', borderRadius: 6, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Retry
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
            ORDERS ASSIGNED TO ME ({orders.length} {orders.length === 1 ? 'Sub-Order' : 'Sub-Orders'})
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: '#0F766E', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Loading orders from PostgreSQL...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
            <Clock size={32} style={{ color: '#94A3B8', marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No assigned sub-orders found in database.</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Sub-orders assigned to {myMfgName} in PostgreSQL will appear in this table.</div>
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
                {orders.map(so => {
                  const info = getEffectiveOrderStatusInfo(so);

                  return (
                    <tr key={so.subOrderNumber} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        {so.subOrderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                        {so.masterOrderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>
                        {so.poNumber || so.purchaseOrderNumber}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0F172A' }}>
                        {so.customerName || so.customer?.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>
                        {so.orderDate || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#1D4ED8', fontWeight: 600 }}>
                        {so.deliverySchedule || `${so.leadTimeDays || 14} Days`}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{so.lines.length} {so.lines.length === 1 ? 'Product' : 'Products'}</div>
                        <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {so.lines.map(l => l.productName || l.name).join(', ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                        {so.totalQuantity.toLocaleString()} Units
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        ₹{so.orderValue.toLocaleString('en-IN')}
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
                              handleOpenViewPo(so);
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
      {showAcceptModal && (() => {
        const targetSubOrder = orders.find(o => o.subOrderNumber === targetActionSubOrderCode) || activeDetailSubOrder;
        return (
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

            {acceptModalError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: 10, fontSize: 12, color: '#B91C1C' }}>
                {acceptModalError}
              </div>
            )}

            <p style={{ margin: 0, fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>
              By accepting this order, you confirm that your facility will fulfill the assigned products and quantities according to the agreed quotation and terms stored in PostgreSQL.
            </p>

            {targetSubOrder && (
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#0F766E' }}>
                <div>Purchase Order: <strong>{targetSubOrder.poNumber || targetSubOrder.purchaseOrderNumber}</strong></div>
                <div>Sub-Order: <strong>{targetSubOrder.subOrderNumber}</strong></div>
                <div>Total Quantity: <strong>{targetSubOrder.totalQuantity.toLocaleString()} Units</strong> · Value: <strong>₹{targetSubOrder.orderValue.toLocaleString('en-IN')}</strong></div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setShowAcceptModal(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={actionInProgress}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: actionInProgress ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {actionInProgress ? <RefreshCw size={14} className="animate-spin" /> : null}
                Accept Order
              </button>
            </div>

          </div>
        </div>
        );
      })()}

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
                  disabled={actionInProgress}
                  style={{ padding: '9px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: actionInProgress ? 'not-allowed' : 'pointer' }}
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
        const poData = activePurchaseOrder;
        const lines = poData?.lines || activeDetailSubOrder.lines || [];
        const subtotal = poData?.subtotal || lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
        const totalValue = poData?.orderValue || activeDetailSubOrder.orderValue;
        const isAwaiting = activeDetailSubOrder.status === 'Awaiting Acceptance';
        const isLocked = activeDetailSubOrder.advanceRequired && activeDetailSubOrder.advanceOutstanding > 0;

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
                    background: !isAwaiting ? '#DCFCE7' : '#FEF3C7',
                    color: !isAwaiting ? '#15803D' : '#B45309',
                    border: `1px solid ${!isAwaiting ? '#86EFAC' : '#FDE68A'}`
                  }}>
                    {!isAwaiting ? 'PO Accepted ✓' : 'Awaiting Acceptance'}
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
                <div>
                  <strong>Parent Master Order:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeDetailSubOrder.masterOrderNumber}</span>
                  <div style={{ fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: isLocked ? '#DC2626' : '#15803D' }}>
                    {isLocked ? (
                      <>
                        <Lock size={12} /> Advance Outstanding: ₹{activeDetailSubOrder.advanceOutstanding.toLocaleString('en-IN')} (Execution Blocked)
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} /> Advance Cleared / Not Required
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <strong>Customer / Buyer:</strong> <strong style={{ color: '#0F172A' }}>{poData?.customerName || activeDetailSubOrder.customerName}</strong>
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST: {poData?.buyerGst || activeDetailSubOrder.buyerGst || '—'}</div>
                </div>
                <div>
                  <strong>Supplier / Manufacturer:</strong> <strong style={{ color: '#0F766E' }}>{poData?.mfgName || activeDetailSubOrder.mfgName}</strong>
                  <div style={{ fontSize: 11.5, color: '#0F766E', fontWeight: 700, fontFamily: 'monospace', marginTop: 1 }}>GST: {poData?.mfgGst || activeDetailSubOrder.mfgGst || '—'}</div>
                </div>
                <div><strong>Source Quote Reference:</strong> {activeDetailSubOrder.sourceQuoteRef || '—'}</div>
                <div><strong>Order Date:</strong> {activeDetailSubOrder.orderDate || '—'}</div>
                <div><strong>Delivery Schedule:</strong> <span style={{ color: '#1D4ED8', fontWeight: 700 }}>{activeDetailSubOrder.deliverySchedule}</span></div>
                <div><strong>Shipping Address:</strong> {poData?.shippingAddress || activeDetailSubOrder.shippingAddress || '—'}</div>
                <div>
                  <strong>Billing Address:</strong> {poData?.billingAddress || activeDetailSubOrder.billingAddress || '—'}
                </div>
              </div>

              {/* Product Line Items Table */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: 10 }}>
                  Purchase Order Line Items ({lines.length} {lines.length === 1 ? 'Item' : 'Items'})
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
                      {lines.map((line, lIdx) => (
                        <tr key={lIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F172A' }}>{line.productName || (line as any).name} ({line.dosageForm})</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} {line.uom || 'Units'}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>₹{Number(line.unitPrice).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 800, fontFamily: 'monospace', textAlign: 'right', color: '#0F172A' }}>₹{Number(line.lineTotal || line.quantity * line.unitPrice).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Commercial Summary */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 12.5, color: '#0F766E' }}>
                  Total Quantity: <strong>{activeDetailSubOrder.totalQuantity.toLocaleString()} Units</strong> | Subtotal: <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Grand Total PO Value</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                    ₹{totalValue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* ── PROFORMA INVOICE SECTION ── */}
              <ProformaInvoiceSection
                poNumber={activeDetailSubOrder.poNumber}
                subOrderCode={activeDetailSubOrder.subOrderNumber}
                allowUpload={true}
              />

              {/* Action Buttons inside Modal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  onClick={() => alert(`Official Purchase Order for ${activeDetailSubOrder.poNumber} is verified in PostgreSQL database.`)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} /> Verified PO Document
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {isAwaiting && (
                    <>
                      <button
                        onClick={() => {
                          setViewDetailModal(false);
                          handleOpenRejectModal(activeDetailSubOrder);
                        }}
                        style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Reject Order
                      </button>
                      {isLocked ? (
                        <div
                          title={`Advance Outstanding: ₹${activeDetailSubOrder.advanceOutstanding.toLocaleString('en-IN')}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 6, background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', fontSize: 12, fontWeight: 700 }}
                        >
                          <Lock size={14} /> Execution Locked (Advance Pending)
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setViewDetailModal(false);
                            handleOpenAcceptModal(activeDetailSubOrder);
                          }}
                          style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Accept Purchase Order
                        </button>
                      )}
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
