import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag, Search, Eye, ArrowLeft, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2,
  Building2, Calendar, FileText, Check, Clock, AlertTriangle, Package, CheckSquare,
  Truck, Star
} from 'lucide-react';
import {
  quoteComparisonApi,
  BuyerQuoteComparisonItem,
  BuyerQuoteComparisonDetailResponse,
  ComparisonRfqLine,
  ComparisonManufacturerQuote
} from '../../services/quoteComparisonService';

/**
 * Standard enterprise date formatter: "10 Nov 2026"
 */
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(monthIdx) && !isNaN(day)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${String(day).padStart(2, '0')} ${monthNames[monthIdx]} ${year}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const BuyerQuoteComparisonModule: React.FC = () => {
  const { authUser, userProfile, addAuditLog } = useApp();

  // Overview list state
  const [rfqList, setRfqList] = useState<BuyerQuoteComparisonItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Comparison Detail State
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<BuyerQuoteComparisonDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Line selections state: rfqLineId -> Selection Object
  const [lineSelections, setLineSelections] = useState<Record<string, {
    quoteLineId: string;
    quoteId: string;
    manufacturerId: string;
    manufacturerName: string;
    unitPrice: number;
    leadTimeDays: number;
    moq: number;
  }>>({});
  // Persisted selections snapshot hydrated strictly from PostgreSQL API responses
  const [savedSelections, setSavedSelections] = useState<Record<string, string>>({});
  const [isSavingSelection, setIsSavingSelection] = useState<boolean>(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const toSelectionSnapshot = (
    map?: Record<string, { quoteLineId: string }> | null
  ): Record<string, string> => {
    const out: Record<string, string> = {};
    if (!map) return out;
    Object.entries(map).forEach(([lineId, sel]) => {
      if (sel?.quoteLineId) out[lineId] = String(sel.quoteLineId);
    });
    return out;
  };

  const hasUnsavedChanges = useMemo(() => {
    const currentKeys = Object.keys(lineSelections);
    const savedKeys = Object.keys(savedSelections);
    if (currentKeys.length !== savedKeys.length) return true;
    return currentKeys.some((k) => lineSelections[k]?.quoteLineId !== savedSelections[k]);
  }, [lineSelections, savedSelections]);

  /**
   * Fetch comparison RFQs list from real PostgreSQL database.
   */
  const loadRfqList = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const items = await quoteComparisonApi.listQuoteComparisons({
        status: statusFilter,
        search: debouncedSearch,
      });
      setRfqList(items || []);
    } catch (err: any) {
      console.error('Failed to load quote comparisons list:', err);
      setListError(err?.message || 'Unable to load quotation comparison records from database.');
      setRfqList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [statusFilter, debouncedSearch]);

  // Initial load & search update
  useEffect(() => {
    loadRfqList();
  }, [loadRfqList]);

  // Auto-revalidate on window focus/visibility
  useEffect(() => {
    const handleFocus = () => {
      if (!selectedRfqId) loadRfqList();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !selectedRfqId) {
        loadRfqList();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadRfqList, selectedRfqId]);

  /**
   * Open Comparison Detail for an RFQ.
   */
  const handleOpenComparisonDetail = async (rfqId: string) => {
    setSelectedRfqId(rfqId);
    setDetailData(null);
    setIsLoadingDetail(true);
    setDetailError(null);
    setSuccessNotification(null);

    try {
      const data = await quoteComparisonApi.getQuoteComparisonDetail(rfqId);
      setDetailData(data);
      setLineSelections(data.lineSelections || {});
      setSavedSelections(toSelectionSnapshot(data.lineSelections));
    } catch (err: any) {
      console.error('Failed to load comparison detail:', err);
      setDetailError(err?.message || 'Could not retrieve quotation comparison details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /**
   * Return from detail view to main RFQ list.
   */
  const handleBackToList = () => {
    setSelectedRfqId(null);
    setDetailData(null);
    setDetailError(null);
    setSuccessNotification(null);
    loadRfqList();
  };

  /**
   * Handle selecting a manufacturer quotation for a specific line item.
   */
  const handleSelectLineQuote = (
    rfqLineId: string,
    quoteLineId: string,
    quoteId: string,
    manufacturerId: string,
    manufacturerName: string,
    unitPrice: number,
    leadTimeDays: number,
    moq: number
  ) => {
    setLineSelections(prev => ({
      ...prev,
      [rfqLineId]: {
        quoteLineId,
        quoteId,
        manufacturerId,
        manufacturerName,
        unitPrice,
        leadTimeDays,
        moq,
      }
    }));
  };

  /**
   * Persist manufacturer selections into PostgreSQL.
   */
  const handleSaveSelections = async () => {
    if (!selectedRfqId || !detailData) return;

    const selectionsArray = Object.entries(lineSelections).map(([rfqLineId, sel]) => ({
      rfqLineId,
      quoteLineId: sel.quoteLineId,
      quoteId: sel.quoteId,
      manufacturerId: sel.manufacturerId,
      unitPrice: sel.unitPrice,
      leadTimeDays: sel.leadTimeDays,
      moq: sel.moq,
    }));

    if (selectionsArray.length === 0) {
      alert('Please select at least one manufacturer quotation line before saving.');
      return;
    }

    setIsSavingSelection(true);
    setDetailError(null);

    try {
      const res = await quoteComparisonApi.selectQuotesForRfq(selectedRfqId, {
        selections: selectionsArray,
      });

      setSuccessNotification(`✔ ${res.message} (${res.selectedCount} line${res.selectedCount === 1 ? '' : 's'} allocated)`);
      setTimeout(() => setSuccessNotification(null), 5000);

      if (addAuditLog) {
        addAuditLog(
          'BUYER_SELECT_QUOTES',
          `Selected ${res.selectedCount} manufacturer quotation(s) for RFQ ${res.rfqNumber}`
        );
      }

      // Re-fetch detail and list from PostgreSQL to reflect authoritative persisted state
      const refreshed = await quoteComparisonApi.getQuoteComparisonDetail(selectedRfqId);
      setDetailData(refreshed);
      setLineSelections(refreshed.lineSelections || {});
      setSavedSelections(toSelectionSnapshot(refreshed.lineSelections));
      loadRfqList();
    } catch (err: any) {
      console.error('Failed to save selections:', err);
      setDetailError(err?.message || 'Failed to save manufacturer selections.');
    } finally {
      setIsSavingSelection(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'READY_FOR_COMPARISON':
      case 'READY':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'READY FOR COMPARISON' };
      case 'ALLOCATED':
      case 'VENDOR_SELECTED':
      case 'Vendor Selected':
        return { bg: '#F0FDF4', color: '#166534', border: '#86EFAC', label: 'ALLOCATED' };
      case 'PARTIALLY_ALLOCATED':
      case 'PARTIALLY_ACCEPTED':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD', label: 'PARTIALLY ALLOCATED' };
      case 'PRICING_IN_PROGRESS':
      case 'Pricing In Progress':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'PRICING IN PROGRESS' };
      case 'SUBMITTED':
      case 'Submitted':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'SUBMITTED' };
      case 'QUOTED':
      case 'Quoted':
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'QUOTED' };
      default:
        return { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', label: statusStr };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40, background: '#F8FAFC' }}>

      {/* ── COMPARISON DETAIL VIEW ── */}
      {selectedRfqId ? (() => {
        if (isLoadingDetail) {
          return (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ display: 'inline-block', width: 26, height: 26, border: '3px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Loading Quotation Matrix from Database...</div>
            </div>
          );
        }

        if (detailError && !detailData) {
          return (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '14px 18px', borderRadius: 6, color: '#DC2626', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} />
                <span>{detailError}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleBackToList}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Quote Comparison
                </button>
              </div>
            </div>
          );
        }

        if (!detailData) return null;

        const buyerName = detailData.rfq.companyName || detailData.rfq.buyerName || 'Buyer Organization';
        const totalLinesCount = detailData.lines.length;
        const selectedCount = Object.keys(lineSelections).length;
        const savedCount = Object.keys(savedSelections).length;
        const isPersistedSaved = savedCount > 0 && selectedCount > 0 && !hasUnsavedChanges;
        const isComplete = totalLinesCount > 0 && selectedCount >= totalLinesCount;
        const persistedStatusBadge = getStatusBadge(
          detailData.rfq.comparisonStatus || (savedCount > 0 && savedCount === totalLinesCount ? 'ALLOCATED' : detailData.rfq.status)
        );

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top Navigation & Header Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleBackToList}
                  style={{ padding: '7px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Quote Comparison
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{detailData.rfq.rfqNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                      {detailData.manufacturerQuotations.length} QUOTATION{detailData.manufacturerQuotations.length === 1 ? '' : 'S'} RECEIVED
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: persistedStatusBadge.bg, color: persistedStatusBadge.color, border: `1px solid ${persistedStatusBadge.border}` }}>
                      {persistedStatusBadge.label}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    Manufacturer Quotations Comparison — {buyerName}
                  </h1>
                </div>
              </div>

              {/* Action: Save Selections */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  disabled={isSavingSelection || selectedCount === 0 || isPersistedSaved}
                  onClick={handleSaveSelections}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    background: isPersistedSaved ? '#16A34A' : selectedCount > 0 ? '#0F766E' : '#E2E8F0',
                    color: (isPersistedSaved || selectedCount > 0) ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: (isSavingSelection || selectedCount === 0 || isPersistedSaved) ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isPersistedSaved ? <CheckCircle2 size={14} /> : <CheckSquare size={14} />}
                  {isSavingSelection
                    ? 'Saving...'
                    : isPersistedSaved
                      ? 'Allocations Saved ✓'
                      : `Save Allocations (${selectedCount}/${totalLinesCount})`}
                </button>
              </div>
            </div>

            {/* Notification / Error alerts */}
            {successNotification && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '12px 16px', borderRadius: 6, color: '#166534', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> {successNotification}
              </div>
            )}
            {detailError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: 6, color: '#DC2626', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {detailError}
              </div>
            )}

            {/* RFQ Summary Banner */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                RFQ SPECIFICATIONS &amp; LOGISTICS OVERVIEW
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Buyer Organization</div>
                  <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{buyerName}</div>
                  {detailData.rfq.customerCode && <div style={{ fontSize: 11, color: '#64748B' }}>Code: {detailData.rfq.customerCode}</div>}
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Delivery Location</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{detailData.rfq.deliveryLocation}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Created Date</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{formatDate(detailData.rfq.rfqDate)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{formatDate(detailData.rfq.requiredDate)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Response Deadline</div>
                  <div style={{ fontWeight: 700, color: '#D97706', marginTop: 2 }}>{formatDate(detailData.rfq.deadlineDate)}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Credit Terms Requested</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {detailData.rfq.creditRequired ? (detailData.rfq.creditTerms || 'Credit requested') : 'Standard Escrow'}
                  </div>
                </div>
              </div>
            </div>

            {/* PRODUCT-LINE BASED QUOTE COMPARISON MATRICES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detailData.lines.map((line, lineIdx) => {
                const selected = lineSelections[line.id];

                // Gather quotations submitted for this line
                const quoteCandidates = detailData.manufacturerQuotations.map((q) => {
                  const matchLine = q.lines.find(
                    (ql) => ql.rfqLineId === line.id || (ql.productId && ql.productId === line.productId) || ql.productName.toLowerCase() === line.productName.toLowerCase()
                  );
                  return {
                    quote: q,
                    quoteLine: matchLine || null,
                  };
                }).filter(item => item.quoteLine !== null);

                return (
                  <div key={line.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {/* Product Line Header Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                            LINE #{String(lineIdx + 1).padStart(2, '0')}
                          </span>
                          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                            {line.productName}
                          </h2>
                          {line.category && (
                            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>({line.category})</span>
                          )}
                        </div>

                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>Requested Volume: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} {line.uom || 'Units'}</strong></span>
                          {line.dosageForm && <span>Form: <strong>{line.dosageForm}</strong></span>}
                          {line.packSize && <span>Pack: <strong>{line.packSize}</strong></span>}
                          {line.targetPrice && <span>Target Price: <strong style={{ color: '#0F766E' }}>₹{Number(line.targetPrice).toFixed(2)}</strong></span>}
                        </div>
                      </div>

                      {/* Selected Allocation Badge */}
                      <div>
                        {selected ? (
                          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 6, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Selected Manufacturer</div>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D' }}>
                                {selected.manufacturerName} · ₹{selected.unitPrice.toFixed(2)}/unit
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '5px 10px', borderRadius: 6, border: '1px solid #FDE68A' }}>
                            ⚠ Selection Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comparison Table */}
                    {quoteCandidates.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: 6, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                        <Clock size={24} style={{ color: '#D97706', margin: '0 auto 6px', display: 'block' }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>No manufacturer responses received yet for this line.</div>
                        <div style={{ fontSize: 12, marginTop: 2 }}>
                          When assigned manufacturers submit pricing, their commercial offer will appear here for comparison.
                        </div>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 6 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                          <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>UNIT PRICE</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MOQ</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>LEAD TIME</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DELIVERY TERMS</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>VALIDITY</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                              <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 14 }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quoteCandidates.map(({ quote, quoteLine }) => {
                              if (!quoteLine) return null;
                              const isCannotSupply = quoteLine.responseType === 'CANNOT_SUPPLY';
                              const isSelected = selected?.quoteLineId === quoteLine.id;

                              return (
                                <tr
                                  key={quoteLine.id}
                                  style={{
                                    borderBottom: '1px solid #F1F5F9',
                                    background: isSelected ? '#F0FDF4' : isCannotSupply ? '#FFF5F5' : '#FFFFFF',
                                    transition: 'background 0.12s ease'
                                  }}
                                >
                                  {/* Manufacturer Column */}
                                  <td style={{ padding: '12px 12px' }}>
                                    <div style={{ fontWeight: 800, color: isSelected ? '#15803D' : '#0F172A', fontSize: 12.5 }}>
                                      {quote.manufacturerName}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
                                      {quote.quoteNumber} {quote.city ? `· ${quote.city}` : ''}
                                    </div>
                                  </td>

                                  {/* Unit Price */}
                                  <td style={{ padding: '12px 12px', fontWeight: 800, color: isCannotSupply ? '#94A3B8' : '#0F766E', fontFamily: 'monospace', fontSize: 13 }}>
                                    {isCannotSupply ? '—' : `₹${quoteLine.unitPrice.toFixed(2)}`}
                                  </td>

                                  {/* MOQ */}
                                  <td style={{ padding: '12px 12px', color: '#334155' }}>
                                    {isCannotSupply ? '—' : `${quoteLine.moq.toLocaleString()} Units`}
                                  </td>

                                  {/* Lead Time */}
                                  <td style={{ padding: '12px 12px', color: '#1D4ED8', fontWeight: 600 }}>
                                    {isCannotSupply ? '—' : `${quoteLine.leadTimeDays} Days`}
                                  </td>

                                  {/* Delivery Terms */}
                                  <td style={{ padding: '12px 12px', color: '#475569' }}>
                                    {quoteLine.deliveryTerms || quote.deliveryTerms || 'Standard Fleet'}
                                  </td>

                                  {/* Validity */}
                                  <td style={{ padding: '12px 12px', color: '#64748B' }}>
                                    {formatDate(quote.validUntil)}
                                  </td>

                                  {/* Status */}
                                  <td style={{ padding: '12px 12px' }}>
                                    {isCannotSupply ? (
                                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                        CANNOT SUPPLY
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                                        {quote.status}
                                      </span>
                                    )}
                                  </td>

                                  {/* Action */}
                                  <td style={{ padding: '12px 12px', textAlign: 'right', paddingRight: 14 }}>
                                    {isCannotSupply ? (
                                      <span style={{ fontSize: 11, color: '#DC2626', fontStyle: 'italic' }}>
                                        {quoteLine.cannotSupplyReason || 'Unavailable'}
                                      </span>
                                    ) : isSelected ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLineSelections(prev => {
                                            const copy = { ...prev };
                                            delete copy[line.id];
                                            return copy;
                                          });
                                        }}
                                        style={{ padding: '5px 12px', borderRadius: 6, background: '#16A34A', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                      >
                                        <Check size={12} /> Selected ✓
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectLineQuote(
                                          line.id,
                                          quoteLine.id,
                                          quote.id,
                                          quote.manufacturerId,
                                          quote.manufacturerName,
                                          quoteLine.unitPrice,
                                          quoteLine.leadTimeDays,
                                          quoteLine.moq
                                        )}
                                        style={{ padding: '5px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F766E', border: '1px solid #0F766E', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                                      >
                                        Select Quote
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Bottom Floating/Fixed Save Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontSize: 12.5, color: '#334155' }}>
                Allocated: <strong style={{ color: '#0F766E' }}>{selectedCount} of {totalLinesCount} Product Lines</strong>
                {isComplete && <span style={{ marginLeft: 8, color: '#16A34A', fontWeight: 700 }}>✓ All lines allocated!</span>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleBackToList}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingSelection || selectedCount === 0 || isPersistedSaved}
                  onClick={handleSaveSelections}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    background: isPersistedSaved ? '#16A34A' : selectedCount > 0 ? '#0F766E' : '#E2E8F0',
                    color: (isPersistedSaved || selectedCount > 0) ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12.5,
                    cursor: (isSavingSelection || selectedCount === 0 || isPersistedSaved) ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isPersistedSaved ? <CheckCircle2 size={14} /> : <CheckSquare size={14} />}
                  {isSavingSelection
                    ? 'Saving...'
                    : isPersistedSaved
                      ? 'Allocations Saved ✓'
                      : 'Save & Persist Allocations'}
                </button>
              </div>
            </div>

          </div>
        );
      })() : (
        /* ── DEFAULT VIEW: LIST OF BUYER RFQS FOR QUOTE COMPARISON ── */
        <>
          {/* Page Header (Clean Enterprise B2B Standard) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 2 }}>
                PROCUREMENT &amp; SOURCING / QUOTE COMPARISON
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                QUOTE COMPARISON
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                Compare manufacturer quotations received against this RFQ and select the best commercial option.
              </p>
            </div>
          </div>

          {/* Filter / Search Area (Clean Single Toolbar) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 460 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by RFQ number, buyer, customer, product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F8FAFC' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 12, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                >
                  <option value="ALL">All Active Statuses</option>
                  <option value="READY_FOR_COMPARISON">Ready for Comparison</option>
                  <option value="PARTIALLY_ALLOCATED">Partially Allocated</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="Quoted">Quoted</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Pricing In Progress">Pricing In Progress</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                {isLoadingList ? 'Checking records...' : `${rfqList.length} RFQ${rfqList.length === 1 ? '' : 's'}`}
              </div>
            </div>
          </div>

          {/* Error State Banner with Retry */}
          {listError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontSize: 12.5, fontWeight: 700 }}>
                <AlertCircle size={16} />
                <span>Unable to load quotation data: {listError}</span>
              </div>
              <button
                type="button"
                onClick={loadRfqList}
                style={{ padding: '6px 14px', borderRadius: 6, background: '#DC2626', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Table Register */}
          <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ #</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT LINES</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTES RECEIVED</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DEADLINE</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingList ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      <div style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 10 }} />
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>Loading Quotations from Database...</div>
                    </td>
                  </tr>
                ) : rfqList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B', background: '#FAFAFA' }}>
                      <Tag size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No quotation responses are available for this RFQ yet.</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        When manufacturers submit quotations against your active RFQs, they will automatically appear here for evaluation.
                      </div>
                    </td>
                  </tr>
                ) : (
                  rfqList.map((rfq) => {
                    const badge = getStatusBadge(rfq.status);
                    const isDeadlinePast = rfq.deadline ? new Date() > new Date(rfq.deadline) : false;

                    return (
                      <tr
                        key={rfq.rfqId}
                        onClick={() => handleOpenComparisonDetail(rfq.rfqId)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        {/* RFQ # */}
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {rfq.rfqNumber}
                          {rfq.isGeneric && (
                            <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 3, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                              GENERIC
                            </span>
                          )}
                        </td>

                        {/* Buyer */}
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          <div>{rfq.buyerName}</div>
                          {rfq.customerCode && (
                            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 500 }}>{rfq.customerCode}</span>
                          )}
                        </td>

                        {/* Product Lines */}
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          <strong>{rfq.productLineCount}</strong> Product Line{rfq.productLineCount === 1 ? '' : 's'}
                        </td>

                        {/* Quotes Received */}
                        <td style={{ padding: '12px 14px' }}>
                          {rfq.quotationCount > 0 ? (
                            <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>
                              {rfq.quotationCount} Response{rfq.quotationCount === 1 ? '' : 's'}
                            </strong>
                          ) : (
                            <span style={{ color: '#D97706', fontStyle: 'italic' }}>Awaiting Responses</span>
                          )}
                        </td>

                        {/* Deadline */}
                        <td style={{ padding: '12px 14px', color: isDeadlinePast ? '#DC2626' : '#475569' }}>
                          {formatDate(rfq.deadline)}
                          {isDeadlinePast && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700 }}>(Expired)</span>}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenComparisonDetail(rfq.rfqId)}
                            style={{ padding: '5px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            Compare Quotes →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
};
