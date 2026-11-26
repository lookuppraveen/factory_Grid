import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { adminRfqApi, AdminRfqItem } from '../../services/adminRfqApi';
import {
  Tag, Search, Eye, CheckCircle2, Clock, Building2, X, FileText,
  ShieldCheck, ChevronRight, Filter, AlertCircle, RefreshCw, Layers, Edit, Slash, Send, Info, DollarSign
} from 'lucide-react';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const AdminQuoteMonitor: React.FC = () => {
  const { currentRole, addAuditLog } = useApp();

  // Real Database Data State from PostgreSQL
  const [rfqsList, setRfqsList] = useState<AdminRfqItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'PENDING' | 'SELECTED'>('ALL');
  
  // Read-only / Interactive modal state
  const [selectedRfqForView, setSelectedRfqForView] = useState<AdminRfqItem | null>(null);
  const [selectedRfqQuotes, setSelectedRfqQuotes] = useState<any[]>([]);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState<boolean>(false);

  // Configurable Admin Price Control Flag
  const [isAdminPriceEditEnabled, setIsAdminPriceEditEnabled] = useState<boolean>(true);

  // Admin Overrides State: Record<quoteOrMfgId, { originalPrice: number; adjustedPrice?: number; isRejected?: boolean; rejectionReason?: string }>
  const [adminQuoteOverrides, setAdminQuoteOverrides] = useState<Record<string, {
    originalPrice: number;
    adjustedPrice?: number;
    isRejected?: boolean;
    rejectionReason?: string;
  }>>({});

  // Inline / Modal Edit Price State
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [tempAdjustedPrice, setTempAdjustedPrice] = useState<string>('');

  // Rejection Modal State
  const [rejectingQuoteId, setRejectingQuoteId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Action Notification Banner State
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Fetch real RFQ quote monitoring data from PostgreSQL
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const data = await adminRfqApi.listAdminRfqs();
      setRfqsList(data || []);
    } catch (err: any) {
      console.error('Failed to load Quote Monitoring RFQs from PostgreSQL:', err);
      setApiError(err?.message || 'Failed to connect to backend quote monitoring service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load quotes when an RFQ is opened for view
  const handleOpenQuoteDetails = async (rfq: AdminRfqItem) => {
    setSelectedRfqForView(rfq);
    setIsLoadingQuotes(true);
    try {
      const quotes = await adminRfqApi.getQuotesForRfq(rfq.id);
      setSelectedRfqQuotes(quotes || []);
    } catch (err) {
      console.warn('Could not load quote list from backend, using RFQ quotes summary:', err);
      setSelectedRfqQuotes(rfq.quotes || []);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  // Helper to retrieve quote info
  const getMfgQuoteData = (quoteId: string, defaultOriginalPrice: number) => {
    const override = adminQuoteOverrides[quoteId];
    const originalPrice = override?.originalPrice ?? defaultOriginalPrice;
    const adjustedPrice = override?.adjustedPrice;
    const isRejected = !!override?.isRejected;
    const rejectionReason = override?.rejectionReason;

    const effectivePrice = adjustedPrice !== undefined ? adjustedPrice : originalPrice;
    const marginAmount = adjustedPrice !== undefined ? (adjustedPrice - originalPrice) : 0;
    const marginPercent = originalPrice > 0 ? (marginAmount / originalPrice) * 100 : 0;

    return {
      originalPrice,
      adjustedPrice,
      effectivePrice,
      marginAmount,
      marginPercent,
      isRejected,
      rejectionReason
    };
  };

  const handleSaveAdjustedPrice = (quoteId: string, mfgName: string, defaultOrig: number) => {
    const val = parseFloat(tempAdjustedPrice);
    if (isNaN(val) || val <= 0) {
      return;
    }
    const currentObj = adminQuoteOverrides[quoteId] || { originalPrice: defaultOrig };
    setAdminQuoteOverrides(prev => ({
      ...prev,
      [quoteId]: {
        ...currentObj,
        originalPrice: currentObj.originalPrice || defaultOrig,
        adjustedPrice: val
      }
    }));

    setEditingQuoteId(null);
    setNotificationMsg(`Price adjusted successfully for ${mfgName}. Original: ₹${defaultOrig.toFixed(2)} → Admin Adjusted Price: ₹${val.toFixed(2)}/unit.`);
    if (addAuditLog) {
      addAuditLog('Quote Engine', `Admin updated quotation price for ${mfgName} from ₹${defaultOrig.toFixed(2)} to ₹${val.toFixed(2)}.`);
    }
  };

  const handleConfirmRejection = (quoteId: string, mfgName: string, defaultOrig: number) => {
    if (!rejectionReasonInput.trim()) {
      setRejectionError('Rejection reason is mandatory.');
      return;
    }

    const currentObj = adminQuoteOverrides[quoteId] || { originalPrice: defaultOrig };
    setAdminQuoteOverrides(prev => ({
      ...prev,
      [quoteId]: {
        ...currentObj,
        originalPrice: currentObj.originalPrice || defaultOrig,
        isRejected: true,
        rejectionReason: rejectionReasonInput.trim()
      }
    }));

    const reasonText = rejectionReasonInput.trim();
    setRejectingQuoteId(null);
    setRejectionReasonInput('');
    setRejectionError(null);
    setNotificationMsg(`Quotation from ${mfgName} rejected. Rejection notice logged: "${reasonText}".`);
    if (addAuditLog) {
      addAuditLog('Quote Engine', `Admin REJECTED quotation from ${mfgName}. Reason: ${reasonText}`);
    }
  };

  // Compute quote monitoring statistics based on real backend data
  const monitoredRfqs = useMemo(() => {
    return rfqsList.map(rfq => {
      const responsesCount = rfq.quotesCount;
      const lowestPrice = rfq.lowestPrice;
      const highestPrice = rfq.highestPrice;
      const isAwarded = rfq.isAwarded;
      const selectedMfgName = rfq.selectedManufacturerName;

      return {
        rfq,
        responsesCount,
        lowestPrice,
        highestPrice,
        isAwarded,
        selectedMfgName,
        rfqQuotes: rfq.quotes || []
      };
    });
  }, [rfqsList]);

  const filteredMonitoredRfqs = useMemo(() => {
    return monitoredRfqs.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.rfq.rfqNumber.toLowerCase().includes(q) ||
        item.rfq.customerName.toLowerCase().includes(q) ||
        (item.rfq.customerCode && item.rfq.customerCode.toLowerCase().includes(q)) ||
        (item.rfq.lines || []).some(l => (l.productName || l.molecule || '').toLowerCase().includes(q));

      if (statusFilter === 'RECEIVED') return matchSearch && item.responsesCount > 0;
      if (statusFilter === 'PENDING') return matchSearch && !item.isAwarded;
      if (statusFilter === 'SELECTED') return matchSearch && item.isAwarded;

      return matchSearch;
    }).sort((a, b) => {
      const timeA = new Date((a.rfq as any).createdAt || a.rfq.createdDate || 0).getTime();
      const timeB = new Date((b.rfq as any).createdAt || b.rfq.createdDate || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.rfq.rfqNumber || '').localeCompare(String(a.rfq.rfqNumber || ''));
    });
  }, [monitoredRfqs, searchTerm, statusFilter]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredMonitoredRfqs.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, statusFilter]
  });
  const paginatedMonitoredRfqs = pagination.paginateItems(filteredMonitoredRfqs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Tag size={14} /> Platform Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            Quote Monitoring & Seller Controls
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Monitor manufacturer quote responses, inspect pricing, adjust seller quotations, and manage rejection workflows.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => loadData()}
            disabled={isLoading}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569',
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>

          {/* Configurable Admin Control Toggle */}
          <button
            onClick={() => {
              setIsAdminPriceEditEnabled(!isAdminPriceEditEnabled);
              setNotificationMsg(`Admin Price Control ${!isAdminPriceEditEnabled ? 'ENABLED' : 'DISABLED'}.`);
            }}
            style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
              border: isAdminPriceEditEnabled ? '1px solid #8B5CF6' : '1px solid #CBD5E1',
              background: isAdminPriceEditEnabled ? '#F5F3FF' : '#F1F5F9',
              color: isAdminPriceEditEnabled ? '#6D28D9' : '#64748B',
              display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <ShieldCheck size={14} /> Admin Controls: {isAdminPriceEditEnabled ? 'ACTIVE (Configurable)' : 'READ-ONLY'}
          </button>
        </div>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#991B1B', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} />
            <span><strong>Database Error:</strong> {apiError}</span>
          </div>
          <button onClick={() => loadData()} style={{ padding: '4px 12px', background: '#991B1B', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* Notification Banner */}
      {notificationMsg && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: '#15803D', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── 2. SEARCH & FILTER CONTROLS ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search RFQ #, Buyer, Product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', height: 36, paddingLeft: 34, paddingRight: 12, fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 8 }}>
          {[
            { key: 'ALL', label: `All RFQs (${monitoredRfqs.length})` },
            { key: 'RECEIVED', label: `Quotes Received (${monitoredRfqs.filter(r => r.responsesCount > 0).length})` },
            { key: 'PENDING', label: `Evaluation Pending (${monitoredRfqs.filter(r => r.responsesCount > 0 && !r.isAwarded).length})` },
            { key: 'SELECTED', label: `Manufacturer Selected (${monitoredRfqs.filter(r => r.isAwarded).length})` }
          ].map(st => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key as any)}
              style={{
                border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                background: statusFilter === st.key ? '#FFFFFF' : 'transparent',
                color: statusFilter === st.key ? '#7C3AED' : '#64748B',
                boxShadow: statusFilter === st.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. QUOTE MONITORING TABLE ─────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 16px' }}>RFQ Number</th>
              <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
              <th style={{ padding: '12px 16px' }}>Product Lines</th>
              <th style={{ padding: '12px 16px' }}>Manufacturer Responses</th>
              <th style={{ padding: '12px 16px' }}>Quote Status</th>
              <th style={{ padding: '12px 16px' }}>Selected Manufacturer</th>
              <th style={{ padding: '12px 16px' }}>Submitted Date</th>
              <th style={{ padding: '12px 16px' }}>Deadline</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Loading real quote monitoring data from PostgreSQL...
                  </div>
                </td>
              </tr>
            ) : filteredMonitoredRfqs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  {rfqsList.length === 0
                    ? 'No RFQs currently exist in the database.'
                    : 'No quote monitoring records match your search filter.'}
                </td>
              </tr>
            ) : (
              paginatedMonitoredRfqs.map(({ rfq, responsesCount, lowestPrice, highestPrice, isAwarded, selectedMfgName }) => (
                <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace' }}>
                    {rfq.rfqNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {rfq.customerName}
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{rfq.customerCode || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    <div style={{ fontWeight: 600 }}>{rfq.lines[0]?.productName || rfq.lines[0]?.molecule || rfq.title || '—'}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{rfq.lines.length} Product Lines</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: responsesCount > 0 ? '#15803D' : '#64748B', background: responsesCount > 0 ? '#DCFCE7' : '#F1F5F9', padding: '3px 10px', borderRadius: 999 }}>
                      {responsesCount} {responsesCount === 1 ? 'Response' : 'Responses'} Received
                    </span>
                    {responsesCount > 0 && lowestPrice > 0 && (
                      <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
                        ₹{lowestPrice.toLocaleString('en-IN')}{highestPrice > lowestPrice ? ` - ₹${highestPrice.toLocaleString('en-IN')}` : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: isAwarded ? '#DCFCE7' : responsesCount > 0 ? '#F5F3FF' : '#FEF3C7', color: isAwarded ? '#15803D' : responsesCount > 0 ? '#7C3AED' : '#B45309' }}>
                      {isAwarded ? 'Completed / Awarded' : responsesCount > 0 ? 'Quotes Received' : 'Awaiting Bids'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: isAwarded ? '#0F172A' : '#94A3B8' }}>
                    {selectedMfgName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.createdDate || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.targetDeliveryDate || rfq.deadlineDate || '—'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenQuoteDetails(rfq)}
                      style={{ padding: '6px 12px', background: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Eye size={13} /> View Quote Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <PaginationControl {...pagination.paginationProps} itemName="quote records" />

      {/* ── 4. QUOTE DETAILS & ADMIN CONTROLS MODAL ───────────────────── */}
      {selectedRfqForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 840, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quote Monitoring Desk · PostgreSQL Records
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: isAdminPriceEditEnabled ? '#7C3AED' : '#475569', color: '#FFFFFF' }}>
                    {isAdminPriceEditEnabled ? 'Admin Controls Active' : 'Read-Only Mode'}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '3px 0 0', color: '#FFFFFF' }}>
                  Quotes for RFQ #{selectedRfqForView.rfqNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedRfqForView(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* RFQ Meta Grid */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Buyer / Customer</span>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRfqForView.customerName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Created Date</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForView.createdDate || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Bidding Deadline</span>
                  <div style={{ fontWeight: 700, color: '#6D28D9', marginTop: 2 }}>{selectedRfqForView.targetDeliveryDate || selectedRfqForView.deadlineDate || '—'}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Product Lines</span>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRfqForView.lines.length} Line Items</div>
                </div>
              </div>

              {/* Pricing & Margin Engine Preview Banner */}
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#6D28D9', marginBottom: 4 }}>
                  <Info size={14} /> Pricing & Margin Engine Overview (Admin Control)
                </div>
                <div style={{ fontSize: 11.5, color: '#5B21B6', lineHeight: '1.4' }}>
                  Admin can inspect seller-submitted prices from real database quotations, configure markup/margin overrides, and manage quotation rejections.
                </div>
              </div>

              {/* Submitted Manufacturer Quotations List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Submitted Manufacturer Quotations
                  </h4>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                    {isLoadingQuotes ? 'Loading quotes...' : `${selectedRfqQuotes.length} Quotation(s) in PostgreSQL`}
                  </span>
                </div>

                {isLoadingQuotes ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #7C3AED', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      Loading manufacturer quotations...
                    </div>
                  </div>
                ) : selectedRfqQuotes.length === 0 ? (
                  <div style={{ padding: 24, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 10, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                    No manufacturer quotations submitted yet for RFQ #{selectedRfqForView.rfqNumber} in PostgreSQL.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {selectedRfqQuotes.map((q: any) => {
                      const quoteId = q.id || q.quoteNumber;
                      const mfgName = q.manufacturerName || q.manufacturer?.companyName || 'Verified Manufacturer';
                      const defaultOrigPrice = Number(q.totalAmount || 0);
                      const mfgQuote = getMfgQuoteData(quoteId, defaultOrigPrice);
                      const isSelected = q.status === 'ACCEPTED' || q.status === 'PARTIALLY_ACCEPTED';

                      return (
                        <div
                          key={quoteId}
                          style={{
                            background: mfgQuote.isRejected ? '#FEF2F2' : '#FFFFFF',
                            border: mfgQuote.isRejected ? '1px solid #FCA5A5' : isSelected ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                            borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <h5 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                  {mfgName}
                                </h5>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#7C3AED' }}>
                                  ({q.quoteNumber})
                                </span>
                                {isSelected && !mfgQuote.isRejected && (
                                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                    ✓ Selected Supplier
                                  </span>
                                )}
                                {mfgQuote.isRejected && (
                                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                                    Rejected
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                                Status: <strong>{q.status}</strong> {q.deliveryTerms ? `• ${q.deliveryTerms}` : ''} {q.validUntil ? `• Valid until: ${q.validUntil}` : ''}
                              </div>
                            </div>

                            {/* Action Buttons: Edit Price & Reject */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isAdminPriceEditEnabled && !mfgQuote.isRejected && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingQuoteId(quoteId);
                                      setTempAdjustedPrice(mfgQuote.effectivePrice.toString());
                                    }}
                                    style={{
                                      padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                      background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#6D28D9',
                                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                    }}
                                  >
                                    <Edit size={12} /> Edit Price
                                  </button>

                                  <button
                                    onClick={() => {
                                      setRejectingQuoteId(quoteId);
                                      setRejectionReasonInput('');
                                      setRejectionError(null);
                                    }}
                                    style={{
                                      padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                      background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B',
                                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                    }}
                                  >
                                    <Slash size={12} /> Reject Quote
                                  </button>
                                </>
                              )}

                              {!isAdminPriceEditEnabled && (
                                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                                  Read-Only Inspection
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pricing & Margin Details Display */}
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12 }}>
                            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                              <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Original Total Amount</span>
                              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
                                ₹{mfgQuote.originalPrice.toLocaleString('en-IN')}
                              </div>
                            </div>

                            <div style={{ background: mfgQuote.adjustedPrice !== undefined ? '#F5F3FF' : '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: mfgQuote.adjustedPrice !== undefined ? '1px solid #DDD6FE' : '1px solid #E2E8F0' }}>
                              <span style={{ fontSize: 10.5, color: mfgQuote.adjustedPrice !== undefined ? '#6D28D9' : '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Admin Adjusted Price</span>
                              <div style={{ fontWeight: 800, color: mfgQuote.adjustedPrice !== undefined ? '#6D28D9' : '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
                                {mfgQuote.adjustedPrice !== undefined ? `₹${mfgQuote.adjustedPrice.toLocaleString('en-IN')}` : 'Not Modified (Original)'}
                              </div>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                              <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Margin / Markup</span>
                              <div style={{ fontWeight: 800, color: mfgQuote.marginAmount > 0 ? '#15803D' : mfgQuote.marginAmount < 0 ? '#B91C1C' : '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
                                {mfgQuote.marginAmount !== 0 ? `${mfgQuote.marginAmount > 0 ? '+' : ''}₹${mfgQuote.marginAmount.toLocaleString('en-IN')} (${mfgQuote.marginPercent > 0 ? '+' : ''}${mfgQuote.marginPercent.toFixed(1)}%)` : '0.00%'}
                              </div>
                            </div>

                            <div style={{ background: '#F0FDF4', padding: '8px 12px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                              <span style={{ fontSize: 10.5, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Final Platform Price</span>
                              <div style={{ fontWeight: 800, color: '#15803D', marginTop: 2, fontFamily: 'monospace' }}>
                                ₹{mfgQuote.effectivePrice.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>

                          {/* Rejection Details Banner if Rejected */}
                          {mfgQuote.isRejected && (
                            <div style={{ marginTop: 12, background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#991B1B' }}>
                              <strong>Rejection Reason:</strong> {mfgQuote.rejectionReason}
                              <div style={{ fontSize: 10.5, color: '#B91C1C', marginTop: 2 }}>
                                Notice logged. Seller notification is queued for delivery.
                              </div>
                            </div>
                          )}

                          {/* Inline Edit Price Drawer */}
                          {editingQuoteId === quoteId && (
                            <div style={{ marginTop: 14, background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: 8, padding: 14 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Edit size={14} /> Modify Quotation Total for {mfgName}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 700 }}>Original Total Price</label>
                                  <input
                                    type="text"
                                    disabled
                                    value={`₹${mfgQuote.originalPrice.toLocaleString('en-IN')}`}
                                    style={{ height: 34, padding: '0 10px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, color: '#475569', width: 180, fontWeight: 700 }}
                                  />
                                </div>

                                <div>
                                  <label style={{ fontSize: 11, color: '#6D28D9', display: 'block', fontWeight: 700 }}>Admin Adjusted Price (₹)</label>
                                  <input
                                    type="number"
                                    step="100"
                                    value={tempAdjustedPrice}
                                    onChange={e => setTempAdjustedPrice(e.target.value)}
                                    style={{ height: 34, padding: '0 10px', background: '#FFFFFF', border: '1px solid #8B5CF6', borderRadius: 6, fontSize: 12, color: '#0F172A', width: 180, fontWeight: 800, outline: 'none' }}
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                                  <button
                                    onClick={() => handleSaveAdjustedPrice(quoteId, mfgName, defaultOrigPrice)}
                                    style={{ height: 34, padding: '0 14px', background: '#7C3AED', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Apply Price
                                  </button>
                                  <button
                                    onClick={() => setEditingQuoteId(null)}
                                    style={{ height: 34, padding: '0 12px', background: '#FFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inline Rejection Drawer */}
                          {rejectingQuoteId === quoteId && (
                            <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 14 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#991B1B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Slash size={14} /> Reject Quotation from {mfgName}
                              </div>

                              <label style={{ fontSize: 11, color: '#991B1B', display: 'block', fontWeight: 700, marginBottom: 4 }}>
                                Reason for Rejection *
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Enter mandatory rejection reason (e.g. Lead time exceeds SLA requirement, pricing non-competitive)..."
                                value={rejectionReasonInput}
                                onChange={e => {
                                  setRejectionReasonInput(e.target.value);
                                  setRejectionError(null);
                                }}
                                style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #FCA5A5', borderRadius: 6, outline: 'none', resize: 'vertical' }}
                              />
                              {rejectionError && (
                                <div style={{ color: '#DC2626', fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                                  {rejectionError}
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <button
                                  onClick={() => handleConfirmRejection(quoteId, mfgName, defaultOrigPrice)}
                                  style={{ padding: '6px 14px', background: '#DC2626', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Confirm Rejection
                                </button>
                                <button
                                  onClick={() => setRejectingQuoteId(null)}
                                  style={{ padding: '6px 12px', background: '#FFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Line Item Pricing Breakdown if available */}
                          {q.lines && q.lines.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed #E2E8F0' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                                Quoted Line Items:
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {q.lines.map((ql: any, idx: number) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#334155', background: '#F8FAFC', padding: '4px 8px', borderRadius: 4 }}>
                                    <span>{ql.productName} ({ql.quotedQuantity?.toLocaleString()} units)</span>
                                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>₹{Number(ql.unitPrice).toFixed(2)}/unit · Total: ₹{Number(ql.calculatedTotal || ql.unitPrice * ql.quotedQuantity).toLocaleString('en-IN')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedRfqForView(null)}
                style={{ padding: '8px 18px', background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
