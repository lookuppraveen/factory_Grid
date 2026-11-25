import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag, Search, Eye, ArrowLeft, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2,
  Building2, Calendar, FileText, Check, Clock, AlertTriangle, Package
} from 'lucide-react';
import {
  manufacturerRfqApi,
  SubmittedQuoteItem,
  SubmittedQuoteMetrics,
  SubmittedQuoteDetailResponse,
  ManufacturerProfileSummary
} from '../../services/manufacturerRfqApi';

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

export const ManufacturerQuoteSubmissionsModule: React.FC = () => {
  const { authUser, userProfile } = useApp();

  // Real backend quotes state
  const [quotes, setQuotes] = useState<SubmittedQuoteItem[]>([]);
  const [metrics, setMetrics] = useState<SubmittedQuoteMetrics>({
    submittedCount: 0,
    totalCommercialValue: 0
  });
  const [manufacturer, setManufacturer] = useState<ManufacturerProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Selected Quote for Read-Only Inspection View
  const [viewingQuoteId, setViewingQuoteId] = useState<string | null>(null);
  const [viewingQuoteDetail, setViewingQuoteDetail] = useState<SubmittedQuoteDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /**
   * Fetch submitted quotations from real PostgreSQL database.
   */
  const loadSubmittedQuotes = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await manufacturerRfqApi.listSubmittedQuotes({
        search: debouncedSearch,
      });
      setQuotes(res.items || []);
      setMetrics(res.metrics || { submittedCount: 0, totalCommercialValue: 0 });
      if (res.manufacturer) {
        setManufacturer(res.manufacturer);
      }
    } catch (err: any) {
      console.error('Failed to load submitted quotes:', err);
      setApiError(err?.message || 'Unable to load quotations from database.');
      setQuotes([]);
      setMetrics({ submittedCount: 0, totalCommercialValue: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  // Initial load & search update
  useEffect(() => {
    loadSubmittedQuotes();
  }, [loadSubmittedQuotes]);

  // Revalidate automatically on window focus and visibility change
  useEffect(() => {
    const handleFocus = () => {
      loadSubmittedQuotes();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadSubmittedQuotes();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadSubmittedQuotes]);

  /**
   * Fetch details for a specific submitted quotation.
   */
  const handleOpenQuoteDetail = async (quoteId: string) => {
    setViewingQuoteId(quoteId);
    setViewingQuoteDetail(null);
    setIsLoadingDetail(true);
    setDetailError(null);

    try {
      const detail = await manufacturerRfqApi.getSubmittedQuote(quoteId);
      setViewingQuoteDetail(detail);
    } catch (err: any) {
      console.error('Failed to load quote detail:', err);
      setDetailError(err?.message || 'Could not retrieve quotation details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /**
   * Return to quotation register from detail view.
   */
  const handleBackToList = () => {
    setViewingQuoteId(null);
    setViewingQuoteDetail(null);
    setDetailError(null);
    loadSubmittedQuotes();
  };

  // Status Badge Helper
  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'SUBMITTED':
      case 'BUYER REVIEWING':
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'SUBMITTED' };
      case 'ACCEPTED':
      case 'SELECTED':
      case 'AWARDED':
      case 'SUB-ORDER CREATED':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'ACCEPTED' };
      case 'NEGOTIATION':
      case 'IN_REVIEW':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'IN REVIEW' };
      case 'REJECTED':
      case 'NOT_SELECTED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'NOT SELECTED' };
      case 'EXPIRED':
        return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
      case 'DRAFT':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'DRAFT' };
      default:
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: statusStr };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40, background: '#F8FAFC' }}>

      {/* ── DETAIL VIEW ── */}
      {viewingQuoteId ? (() => {
        if (isLoadingDetail) {
          return (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ display: 'inline-block', width: 26, height: 26, border: '3px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Loading Quotation Details from Database...</div>
            </div>
          );
        }

        if (detailError || !viewingQuoteDetail) {
          return (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '14px 18px', borderRadius: 6, color: '#DC2626', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} />
                <span>{detailError || 'Unable to load quotation details.'}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleBackToList}
                  style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Quote Submissions
                </button>
              </div>
            </div>
          );
        }

        const badge = getStatusBadge(viewingQuoteDetail.status);
        const buyerName = viewingQuoteDetail.rfq.companyName || viewingQuoteDetail.rfq.buyerName || 'Buyer';

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
                  <ArrowLeft size={14} /> Back to Quote Submissions
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{viewingQuoteDetail.quoteNumber}</span>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>
                      RFQ Ref: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{viewingQuoteDetail.rfq.rfqNumber}</strong>
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    Commercial Quotation Record — {buyerName}
                  </h1>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '6px 12px', borderRadius: 6 }}>
                <ShieldCheck size={14} style={{ color: '#0F766E' }} /> Submitted Record (Read-Only)
              </div>
            </div>

            {/* Commercial Summary Banner */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                COMMERCIAL QUOTATION OVERVIEW
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#0F766E', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Total Quoted Value</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{viewingQuoteDetail.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Buyer Organization</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{buyerName}</div>
                  {viewingQuoteDetail.rfq.customerCode && (
                    <div style={{ fontSize: 11, color: '#64748B' }}>Code: {viewingQuoteDetail.rfq.customerCode}</div>
                  )}
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Submission Date</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {formatDate(viewingQuoteDetail.submissionDate)}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 700 }}>Quote Validity</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706', marginTop: 2 }}>
                    {formatDate(viewingQuoteDetail.validUntil)}
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer RFQ Specifications */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                BUYER RFQ SPECIFICATIONS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Delivery Location</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {viewingQuoteDetail.rfq.deliveryLocation || 'Primary Delivery Address'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {formatDate(viewingQuoteDetail.rfq.requiredDate)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Response Deadline</div>
                  <div style={{ fontWeight: 700, color: '#D97706', marginTop: 2 }}>
                    {formatDate(viewingQuoteDetail.rfq.deadlineDate)}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Credit Terms Requested</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {viewingQuoteDetail.rfq.creditRequired ? (viewingQuoteDetail.rfq.creditTerms || 'Credit requested') : 'Standard Escrow'}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Lines Breakdown Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                QUOTED PRODUCT LINES ({viewingQuoteDetail.lines.length})
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>PRODUCT NAME</th>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>RESPONSE</th>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>UNIT PRICE (₹)</th>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>MOQ (UNITS)</th>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>LEAD TIME</th>
                      <th style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right', paddingRight: 14 }}>LINE TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingQuoteDetail.lines.map((line, idx) => {
                      const isQuoted = line.responseType === 'QUOTE';

                      return (
                        <tr key={line.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 12px', fontWeight: 800, color: '#0F172A' }}>
                            {line.productName}
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 2 }}>
                              Requested: {line.quotedQuantity.toLocaleString()} {line.uom || 'Units'}
                              {line.dosageForm && ` · Form: ${line.dosageForm}`}
                              {line.packSize && ` · Pack: ${line.packSize}`}
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            {isQuoted ? (
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                                QUOTED
                              </span>
                            ) : (
                              <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                                CANNOT SUPPLY
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 12px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                            {isQuoted ? `₹${line.unitPrice.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 12px', color: '#334155' }}>
                            {isQuoted ? `${line.moq.toLocaleString()} Units` : '—'}
                          </td>
                          <td style={{ padding: '12px 12px', color: '#1D4ED8', fontWeight: 600 }}>
                            {isQuoted ? `${line.leadTimeDays} Days` : '—'}
                          </td>
                          <td style={{ padding: '12px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', textAlign: 'right', paddingRight: 14 }}>
                            {isQuoted ? `₹${line.calculatedTotal.toLocaleString('en-IN')}` : (
                              <span style={{ color: '#DC2626', fontSize: 11, fontStyle: 'italic', fontWeight: 500 }}>
                                {line.cannotSupplyReason || 'Unavailable'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Terms & Remarks */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                COMMERCIAL TERMS &amp; MANUFACTURER REMARKS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Delivery &amp; Freight Terms:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {viewingQuoteDetail.deliveryTerms || 'Standard Fleet Delivery'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Payment Terms:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {viewingQuoteDetail.paymentTerms || '30 Days Net'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>Quoted By Manufacturer:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                    {viewingQuoteDetail.manufacturer.companyName}
                  </div>
                </div>
              </div>

              {viewingQuoteDetail.remarks && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 10, borderRadius: 6, fontSize: 12, marginTop: 10 }}>
                  <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Manufacturer Remarks:</span>
                  <span style={{ color: '#0F172A', fontStyle: 'italic' }}>"{viewingQuoteDetail.remarks}"</span>
                </div>
              )}
            </div>

            {/* Bottom Back Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleBackToList}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Back to Quote Submissions
              </button>
            </div>

          </div>
        );
      })() : (
        /* ── QUOTE SUBMISSIONS REGISTER MAIN LIST VIEW ── */
        <>
          {/* Page Header (Clean Enterprise B2B Standard) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 2 }}>
                MANUFACTURING OPERATIONS / SUBMITTED QUOTATIONS
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                SUBMITTED QUOTATIONS
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                View and manage commercial quotations submitted by your manufacturing organization{manufacturer ? ` (${manufacturer.companyName})` : ''}.
              </p>
            </div>
          </div>

          {/* Summary Cards (Real Data Driven) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Submitted Quotations</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                {metrics.submittedCount}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commercial quote records</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Commercial Value</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                ₹{metrics.totalCommercialValue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Combined value of submitted quotes</div>
            </div>
          </div>

          {/* Filter / Search Area (Clean Single Toolbar) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 460 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by quote number, RFQ number, buyer, product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', fontSize: 12.5, border: '1px solid #CBD5E1', borderRadius: 6, outline: 'none', background: '#F8FAFC' }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              {isLoading ? 'Checking records...' : `${quotes.length} record${quotes.length === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Error State Banner with Retry */}
          {apiError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626', fontSize: 12.5, fontWeight: 700 }}>
                <AlertCircle size={16} />
                <span>Unable to load quotations: {apiError}</span>
              </div>
              <button
                type="button"
                onClick={loadSubmittedQuotes}
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
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTE NUMBER</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ NUMBER</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT / LINES</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTED AMOUNT</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUBMISSION DATE</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      <div style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 10 }} />
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>Loading Quotations from Database...</div>
                    </td>
                  </tr>
                ) : quotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B', background: '#FAFAFA' }}>
                      <Tag size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No submitted quotations</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        {searchTerm.trim()
                          ? `No quotations match "${searchTerm}".`
                          : 'Your submitted manufacturer quotations will appear here.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => {
                    const badge = getStatusBadge(q.status);

                    return (
                      <tr
                        key={q.id}
                        onClick={() => handleOpenQuoteDetail(q.id)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.12s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {q.quoteNumber}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                          {q.rfqNumber}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          <div>{q.buyer}</div>
                          {q.buyerCustomerCode && (
                            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 500 }}>{q.buyerCustomerCode}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          <span style={{ fontWeight: 600 }}>{q.productsSummary}</span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          ₹{q.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {formatDate(q.submissionDate)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenQuoteDetail(q.id)}
                            style={{ padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={12} /> View Details →
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
