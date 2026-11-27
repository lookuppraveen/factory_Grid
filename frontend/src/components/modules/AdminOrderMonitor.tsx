import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { isB2bSpecial } from '../../utils/customerClassification';
import { AdvanceMethod } from '../../types';
import {
  adminOrderApi,
  AdminMasterOrder,
  AdminOrdersSummary,
  AdminSubOrder,
  AdminOrderLine,
  ApiError,
} from '../../services/adminOrderApi';
import {
  ShoppingBag, Search, Eye, X, CheckCircle2, Clock, RefreshCw, Send,
  ShieldCheck, CheckSquare, Square, PauseCircle, AlertTriangle, Star,
  Lock, ThumbsUp, ThumbsDown, CreditCard, IndianRupee, ChevronDown,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { AdvancePaymentSection } from '../common/AdvancePaymentSection';
import { EnterpriseMetricBar } from '../common/EnterpriseMetricBar';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const AdminOrderMonitor: React.FC = () => {
  const {
    currentRole, regeneratePO, submitPOToBuyer, setActiveTab,
    getApplicableMargin, platformFeeConfig
  } = useApp();

  // ── Real Backend & Database States (No Mock Data) ──
  const [orders, setOrders] = useState<AdminMasterOrder[]>([]);
  const [summary, setSummary] = useState<AdminOrdersSummary>({
    pendingApprovalCount: 0,
    pendingAdvanceCount: 0,
    totalAdvanceReceived: 0,
    totalAdvanceOutstanding: 0,
    totalOrdersCount: 0,
    totalGmv: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchErrorStatus, setFetchErrorStatus] = useState<number | null>(null);

  // Truthful Database Health Check State (derived directly from /api/v1/health via SELECT 1)
  const [dbHealth, setDbHealth] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminMasterOrder | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
  const [adminBanner, setAdminBanner] = useState<string | null>(null);
  const [adminBannerType, setAdminBannerType] = useState<'success' | 'error'>('success');

  // Hold Action States
  const [holdTargetOrder, setHoldTargetOrder] = useState<AdminMasterOrder | null>(null);
  const [holdReasonText, setHoldReasonText] = useState('');

  // Admin Approval Modal State (full PO Approval Workflow)
  const [approvalTargetOrder, setApprovalTargetOrder] = useState<AdminMasterOrder | null>(null);
  const [approvalStep, setApprovalStep] = useState<'REVIEW' | 'ADVANCE_CONFIG' | 'REJECT'>('REVIEW');
  const [approvalDecision, setApprovalDecision] = useState<'YES' | 'NO' | null>(null);
  const [advRequired, setAdvRequired] = useState<boolean>(true);
  const [advMethod, setAdvMethod] = useState<AdvanceMethod>('PERCENTAGE');
  const [advPct, setAdvPct] = useState<number>(30);
  const [advFixedAmount, setAdvFixedAmount] = useState<number>(0);
  const [advDueDate, setAdvDueDate] = useState<string>('');
  const [advNotes, setAdvNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');

  // Filter States
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [advanceFilter, setAdvanceFilter] = useState<'ALL' | 'NOT_REQUIRED' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [poStatusFilter, setPoStatusFilter] = useState<'ALL' | 'AWAITING_ADVANCE' | 'CONFIRMED_RELEASED' | 'REJECTED' | 'ON_HOLD'>('ALL');

  // ── Truthful Database Health Check ──
  const checkDatabaseHealth = useCallback(async () => {
    try {
      const health = await adminOrderApi.checkHealth();
      setDbHealth(health.database === 'UP' ? 'UP' : 'DOWN');
    } catch {
      setDbHealth('DOWN');
    }
  }, []);

  // ── Fetch Master Orders and Summary directly from PostgreSQL ──
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setFetchError(null);
    setFetchErrorStatus(null);
    try {
      const [listRes, sumRes] = await Promise.all([
        adminOrderApi.listOrders({
          search: searchTerm.trim() || undefined,
          approvalStatus: approvalFilter !== 'ALL' ? approvalFilter : undefined,
          advanceStatus: advanceFilter !== 'ALL' ? advanceFilter : undefined,
          poStatus: poStatusFilter !== 'ALL' ? poStatusFilter : undefined
        }),
        adminOrderApi.getSummary().catch(() => null),
        checkDatabaseHealth().catch(() => null)
      ]);
      setOrders(listRes.orders || []);
      if (sumRes) {
        setSummary(sumRes);
      } else if (listRes.summary) {
        setSummary(listRes.summary);
      }
    } catch (err: any) {
      console.error('Failed to load admin orders from database:', err);
      const status = err?.status || (err instanceof ApiError ? err.status : 0);
      setFetchErrorStatus(status);
      if (status === 401) {
        setFetchError('Authentication failed: Missing or invalid token. Please log in with your Admin account.');
      } else if (status === 403) {
        setFetchError('Access denied: You do not have permissions to access Admin Master Orders.');
      } else if (status === 404) {
        setFetchError('Admin Orders endpoint not found (404). Please ensure backend is running.');
      } else {
        setFetchError(err.message || 'Failed to load master orders from PostgreSQL database.');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [searchTerm, approvalFilter, advanceFilter, poStatusFilter, checkDatabaseHealth]);

  // Load orders on mount or when filters change (with 250ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  // Initial database health check on mount
  useEffect(() => {
    checkDatabaseHealth();
  }, [checkDatabaseHealth]);

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

  // Sort orders descending by created date
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.createdDate || b.createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [orders]);

  const {
    paginatedItems: paginatedOrders,
    paginationProps,
    resetPage
  } = usePagination(sortedOrders, {
    initialPageSize: 10,
    resetDeps: [searchTerm, approvalFilter, advanceFilter, poStatusFilter]
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Global Notification Banner */}
      {adminBanner && (
        <div style={{ background: adminBannerType === 'error' ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${adminBannerType === 'error' ? '#FCA5A5' : '#86EFAC'}`, borderRadius: 10, padding: '12px 18px', color: adminBannerType === 'error' ? '#DC2626' : '#15803D', fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{adminBanner}</span>
          <button onClick={() => setAdminBanner(null)} style={{ background: 'none', border: 'none', color: adminBannerType === 'error' ? '#DC2626' : '#15803D', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Server Fetch Error Banner with granular actions */}
      {fetchError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '14px 20px', color: '#DC2626', fontSize: 13, fontWeight: 700, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} />
            <div>
              <div>{fetchError}</div>
              {fetchErrorStatus === 401 && (
                <div style={{ fontSize: 11.5, fontWeight: 500, color: '#B91C1C', marginTop: 2 }}>
                  Your session may have expired or you are not signed in as an Admin. Click below to sign in via centralized IAM.
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {fetchErrorStatus === 401 && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
                }}
                style={{ padding: '6px 14px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Log In as Admin
              </button>
            )}
            <button
              onClick={() => fetchOrders()}
              style={{ padding: '6px 14px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
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
            Real-time governance console connected to PostgreSQL for reviewing auto-generated POs, advance payment rules, and dispatch authorizations.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => fetchOrders()}
            disabled={isLoading}
            style={{ padding: '8px 14px', background: '#FFF', border: '1px solid #CBD5E1', color: '#334155', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh orders from PostgreSQL database"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={() => setActiveTab('qa-governance')}
            style={{ padding: '8px 16px', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', borderRadius: 6, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ShieldCheck size={16} /> 🛡️ Open Central QA Desk
          </button>

          {/* Truthful Database Connection Status derived directly from /api/v1/health */}
          {dbHealth === 'UP' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #86EFAC', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#15803D' }} title="Verified live PostgreSQL connectivity via /api/v1/health">
              <CheckCircle2 size={14} /> LIVE POSTGRESQL CONNECTED
            </div>
          ) : dbHealth === 'DOWN' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#DC2626' }} title="PostgreSQL connection is currently unavailable">
              <AlertTriangle size={14} /> DATABASE DISCONNECTED
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
              <RefreshCw size={14} className="animate-spin" /> CHECKING DATABASE...
            </div>
          )}
        </div>
      </div>

      {/* PO & Advance Payment Summary Bar (Aggregates directly from PostgreSQL) */}
      <EnterpriseMetricBar
        title="PURCHASE ORDER & ADVANCE PAYMENT MONITORING"
        subtitle="Platform PO Governance & Advance Settlement Tracking (Real Database Totals)"
        metrics={[
          { label: 'Pending PO Approvals', value: summary.pendingApprovalCount, color: '#D97706' },
          { label: 'Advance Pending', value: summary.pendingAdvanceCount, color: '#DC2626' },
          { label: 'Advance Received', value: `₹${(summary.totalAdvanceReceived / 100000).toFixed(1)}L`, color: '#0F766E' },
          { label: 'Advance Outstanding', value: `₹${(summary.totalAdvanceOutstanding / 100000).toFixed(1)}L`, color: '#7C3AED' },
          { label: 'Total Master Orders', value: summary.totalOrdersCount, color: '#2563EB' },
          { label: 'Total GMV', value: `₹${(summary.totalGmv / 100000).toFixed(1)}L`, color: '#16A34A' },
        ]}
      />

      {/* Table & Filters Toolbar */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by PO #, Customer, Product..."
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
              <option value="CONFIRMED_RELEASED">Confirmed &amp; Released</option>
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
              {isLoading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600 }}>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Loading master orders from PostgreSQL database...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                    {searchTerm || approvalFilter !== 'ALL' || advanceFilter !== 'ALL' || poStatusFilter !== 'ALL'
                      ? 'No purchase orders found matching the filter criteria.'
                      : 'No master orders found in database.'}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(ord => {
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
                          {isB2bSpecial(ord.customerClassification) ? (
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

                      {/* 6. PO APPROVAL */}
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

                      {/* 7. ADVANCE PAYMENT */}
                      <td style={{ padding: '12px 16px' }}>
                        {!isApproved ? (
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

                      {/* 8. PO STATUS */}
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

                      {/* 9. ADMIN ACTIONS */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Primary Review PO button for pending approval - loads live PO from PostgreSQL */}
                          {isPending && (
                            <button
                              disabled={isActionLoading}
                              onClick={async () => {
                                setIsActionLoading(true);
                                try {
                                  const fresh = await adminOrderApi.getOrderDetail(ord.id);
                                  setApprovalTargetOrder(fresh);
                                } catch {
                                  setApprovalTargetOrder(ord);
                                } finally {
                                  setIsActionLoading(false);
                                  setApprovalStep('REVIEW');
                                  setApprovalDecision(null);
                                  setRejectReason('');
                                  setAdvMethod('PERCENTAGE');
                                  setAdvPct(30);
                                  setAdvFixedAmount(Math.round((ord.totalAmount || 0) * 0.3));
                                  setAdvDueDate('');
                                  setAdvNotes('');
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                background: '#0F766E',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 800,
                                cursor: isActionLoading ? 'not-allowed' : 'pointer',
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
                              disabled={isActionLoading}
                              onClick={async () => {
                                setIsActionLoading(true);
                                try {
                                  await adminOrderApi.releaseHold(ord.id);
                                  setAdminBannerType('success');
                                  setAdminBanner(`✓ Master Order ${ord.orderNumber} released from HOLD.`);
                                  await fetchOrders(true);
                                } catch (err: any) {
                                  setAdminBannerType('error');
                                  setAdminBanner(`Failed to release hold: ${err.message}`);
                                } finally {
                                  setIsActionLoading(false);
                                }
                              }}
                              style={{ padding: '5px 10px', background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: isActionLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title={ord.holdReason ? `Held: ${ord.holdReason}` : 'Order currently on hold'}
                            >
                              <Clock size={12} /> Release Hold
                            </button>
                          ) : (
                            <button
                              disabled={isActionLoading}
                              onClick={() => {
                                setHoldTargetOrder(ord);
                                setHoldReasonText('');
                              }}
                              style={{ padding: '5px 10px', background: '#FFF', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: isActionLoading ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <PauseCircle size={12} /> Hold
                            </button>
                          )}

                          {/* View PO Details - fetches live PostgreSQL record */}
                          <button
                            disabled={isActionLoading}
                            onClick={async () => {
                              try {
                                const fresh = await adminOrderApi.getOrderDetail(ord.id);
                                setSelectedOrder(fresh);
                              } catch {
                                setSelectedOrder(ord);
                              }
                            }}
                            style={{ padding: '5px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={12} /> View PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControl {...paginationProps} />
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
                A valid reason is mandatory. Recording a hold will persist in PostgreSQL and increment the order's Hold Count.
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
                disabled={!holdReasonText.trim() || isActionLoading}
                onClick={async () => {
                  if (!holdReasonText.trim()) return;
                  setIsActionLoading(true);
                  try {
                    const updated = await adminOrderApi.holdOrder(holdTargetOrder.id, holdReasonText.trim());
                    setAdminBannerType('error');
                    setAdminBanner(`✓ Master Order ${holdTargetOrder.orderNumber} has been placed on HOLD (Hold Count: ${updated.holdCount || 1}).`);
                    setHoldTargetOrder(null);
                    setHoldReasonText('');
                    await fetchOrders(true);
                  } catch (err: any) {
                    setAdminBannerType('error');
                    setAdminBanner(`Failed to place order on hold: ${err.message}`);
                  } finally {
                    setIsActionLoading(false);
                  }
                }}
                style={{
                  padding: '8px 18px',
                  background: holdReasonText.trim() && !isActionLoading ? '#DC2626' : '#94A3B8',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: holdReasonText.trim() && !isActionLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s ease'
                }}
              >
                {isActionLoading ? 'Placing on Hold...' : 'Confirm & Place on Hold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN PO APPROVAL WORKFLOW MODAL ── */}
      {approvalTargetOrder && (() => {
        const ao = orders.find(o => o.id === approvalTargetOrder.id) || approvalTargetOrder;
        const totalAmt = ao.totalAmount || 0;
        const computedAdvance = advMethod === 'FIXED_AMOUNT' ? advFixedAmount : Math.round((totalAmt * advPct) / 100);

        // Gather all line items across sub-orders directly from database
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

              {/* ── STEP 1: REVIEW PO ── */}
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
                          {allItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                                No product line items recorded for this order in database.
                              </td>
                            </tr>
                          ) : (
                            allItems.map((item, idx) => (
                              <tr key={item.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{item.productName}</td>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#64748B' }}>{item.sku}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{item.quantity.toLocaleString()}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace' }}>₹{item.unitPrice.toFixed(2)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#64748B' }}>₹{Math.round(item.unitPrice * item.quantity * 0.12).toLocaleString()}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>₹{item.lineTotal.toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Summary & Terms */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 800, color: '#334155', marginBottom: 4, textTransform: 'uppercase', fontSize: 11 }}>Customer &amp; Delivery Info</div>
                      <div><span style={{ color: '#64748B' }}>Shipping:</span> <strong>{ao.shippingAddress || 'Registered Office Address'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Billing:</span> <strong>{ao.billingAddress || 'Corporate Billing Address'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Payment Terms:</span> <strong>{ao.paymentTerms || 'Standard Terms'}</strong></div>
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

                  {/* ADMIN DECISION */}
                  <div style={{ borderTop: '2px solid #E2E8F0', paddingTop: 14 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'center' }}>
                      ADMIN DECISION
                    </div>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <button
                        disabled={isActionLoading}
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
                          cursor: isActionLoading ? 'not-allowed' : 'pointer',
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
                        disabled={isActionLoading}
                        onClick={() => {
                          setApprovalStep('ADVANCE_CONFIG');
                          setApprovalDecision(null);
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
                          cursor: isActionLoading ? 'not-allowed' : 'pointer',
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

              {/* ── STEP: REJECT PURCHASE ORDER ── */}
              {approvalStep === 'REJECT' && (
                <>
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px', fontSize: 12.5, color: '#991B1B', fontWeight: 600 }}>
                    <strong>Reject Purchase Order:</strong> The buyer will receive a formal rejection notification in their dashboard along with your entered reason.
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
                      disabled={!rejectReason.trim() || isActionLoading}
                      onClick={async () => {
                        if (!rejectReason.trim()) return;
                        setIsActionLoading(true);
                        try {
                          await adminOrderApi.rejectOrder(ao.id, rejectReason.trim());
                          setAdminBannerType('error');
                          setAdminBanner(`✕ Purchase Order ${ao.poNumber || ao.orderNumber} has been REJECTED. Buyer has been notified.`);
                          closeModal();
                          await fetchOrders(true);
                        } catch (err: any) {
                          setAdminBannerType('error');
                          setAdminBanner(`Failed to reject order: ${err.message}`);
                        } finally {
                          setIsActionLoading(false);
                        }
                      }}
                      style={{
                        padding: '9px 22px',
                        background: rejectReason.trim() && !isActionLoading ? '#DC2626' : '#94A3B8',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 800,
                        cursor: rejectReason.trim() && !isActionLoading ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isActionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2: ADVANCE PAYMENT DECISION & CONFIGURATION ── */}
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

                  {/* Advance Payment Required? [ YES ] [ NO ] */}
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

                  {/* ── IF ADMIN SELECTS NO ── */}
                  {approvalDecision === 'NO' && (
                    <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>Advance Payment:</span>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#E2E8F0', color: '#334155' }}>
                          NOT REQUIRED
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        This purchase order will be marked as <strong>CONFIRMED &amp; RELEASED</strong> immediately in PostgreSQL without requiring any upfront advance deposit.
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                        <button onClick={() => setApprovalStep('REVIEW')} style={{ padding: '8px 16px', background: '#FFF', border: '1px solid #CBD5E1', color: '#475569', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          ← Back
                        </button>
                        <button
                          disabled={isActionLoading}
                          onClick={async () => {
                            setIsActionLoading(true);
                            try {
                              await adminOrderApi.approveOrder(ao.id, { advanceRequired: false });
                              setAdminBannerType('success');
                              setAdminBanner(`✓ Purchase Order ${ao.poNumber || ao.orderNumber} Approved & Released! Advance Payment: NOT REQUIRED.`);
                              closeModal();
                              await fetchOrders(true);
                            } catch (err: any) {
                              setAdminBannerType('error');
                              setAdminBanner(`Failed to approve order: ${err.message}`);
                            } finally {
                              setIsActionLoading(false);
                            }
                          }}
                          style={{ padding: '10px 24px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}
                        >
                          {isActionLoading ? 'Releasing PO...' : 'Confirm Approval & Release PO'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── IF ADMIN SELECTS YES ── */}
                  {approvalDecision === 'YES' && (
                    <div style={{ background: '#FFF', border: '1px solid #99F6E4', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ADVANCE PAYMENT CONFIGURATION
                      </div>

                      {/* Advance Payment Type */}
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
                          {/* Auto Calculation Display */}
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
                            placeholder="Optional instructions to buyer..."
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
                          disabled={computedAdvance <= 0 || computedAdvance > totalAmt || isActionLoading}
                          onClick={async () => {
                            setIsActionLoading(true);
                            try {
                              await adminOrderApi.approveOrder(ao.id, {
                                advanceRequired: true,
                                advanceMethod: advMethod,
                                advancePercentage: advMethod === 'PERCENTAGE' ? advPct : undefined,
                                fixedAmount: advMethod === 'FIXED_AMOUNT' ? advFixedAmount : undefined,
                                advanceDueDate: advDueDate || undefined,
                                advanceNotes: advNotes || undefined
                              });
                              setAdminBannerType('success');
                              setAdminBanner(`✓ PO ${ao.poNumber || ao.orderNumber} Approved! Advance payment of ₹${computedAdvance.toLocaleString()} requested from buyer via Razorpay.`);
                              closeModal();
                              await fetchOrders(true);
                            } catch (err: any) {
                              setAdminBannerType('error');
                              setAdminBanner(`Failed to approve order: ${err.message}`);
                            } finally {
                              setIsActionLoading(false);
                            }
                          }}
                          style={{
                            padding: '10px 24px',
                            background: (computedAdvance <= 0 || computedAdvance > totalAmt || isActionLoading) ? '#94A3B8' : '#0F766E',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: (computedAdvance <= 0 || computedAdvance > totalAmt || isActionLoading) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {isActionLoading ? 'Requesting Advance...' : 'Confirm & Request Advance Payment'}
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

      {/* ── VIEW PURCHASE ORDER DETAILS MODAL ── */}
      {selectedOrder && (() => {
        const activeOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
        const currentPoStatus = (activeOrder as any).poStatus || 'PENDING_ADMIN_REVIEW';
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
                    disabled={isActionLoading}
                    onClick={async () => {
                      setIsActionLoading(true);
                      try {
                        await adminOrderApi.releaseHold(activeOrder.id);
                        setAdminBannerType('success');
                        setAdminBanner(`✓ Master Order ${activeOrder.orderNumber} released from HOLD.`);
                        await fetchOrders(true);
                        const refreshed = await adminOrderApi.getOrderDetail(activeOrder.id);
                        setSelectedOrder(refreshed);
                      } catch (err: any) {
                        setAdminBannerType('error');
                        setAdminBanner(`Failed to release hold: ${err.message}`);
                      } finally {
                        setIsActionLoading(false);
                      }
                    }}
                    style={{ padding: '5px 12px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: isActionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Release Hold
                  </button>
                </div>
              )}

              {/* Meta summary */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, fontSize: 12.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <strong>PO Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeOrder.poNumber || activeOrder.orderNumber}</span>
                </div>
                <div>
                  <strong>Master Order:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeOrder.orderNumber}</span>
                </div>
                <div>
                  <strong>Customer Name:</strong> {activeOrder.customerName} ({activeOrder.customerCode})
                  {isB2bSpecial(activeOrder.customerClassification) ? (
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
                  <strong>Expected Delivery:</strong> {activeOrder.expectedDeliveryDate || 'Standard Timeline'}
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

              {/* PO Approval & Advance Payment Governance Section */}
              <div style={{ marginTop: 4 }}>
                <AdvancePaymentSection
                  order={activeOrder as any}
                  onOrderUpdated={async (updated) => {
                    setSelectedOrder(updated as any);
                    setAdminBanner(`✓ Order ${updated.orderNumber} updated successfully.`);
                    await fetchOrders(true);
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
                              const marginRes = getApplicableMargin ? getApplicableMargin(line.productId, so.manufacturerId) : { marginType: 'PERCENTAGE', marginPercentage: 10 };
                              const feeRate = platformFeeConfig?.feeValue ?? 2.0;

                              let marginAmt = 0;
                              let marginStr = '';
                              let baseP = line.unitPrice;

                              if (marginRes.marginType === 'FIXED_RATE') {
                                marginAmt = marginRes.marginRate ?? (marginRes as any).marginValue ?? 0;
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
                      disabled={isActionLoading}
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
                        cursor: isActionLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <ShieldCheck size={14} /> Review &amp; Approve PO
                    </button>
                  )}
                  {!isHeld && (
                    <button
                      disabled={isActionLoading}
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
                        cursor: isActionLoading ? 'not-allowed' : 'pointer',
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
                      if (regeneratePO) regeneratePO(activeOrder.id, selectedLineIds);
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
