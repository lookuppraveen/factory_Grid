import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { isB2bSpecial } from '../../utils/customerClassification';
import {
  FileText, Search, Clock, CheckCircle2, AlertTriangle,
  X, Send, Eye, Save, Calendar, Check, AlertCircle, Building2, Package,
  ShieldCheck, XCircle, ThumbsDown, ArrowLeft, MessageSquare, Edit3, DollarSign,
  Truck, Paperclip, Star
} from 'lucide-react';
import {
  manufacturerRfqApi,
  AssignedRfqItem,
  AssignedRfqCounts,
  AssignedRfqDetailResponse,
  ManufacturerProfileSummary,
  RfqDetailLine,
  QuoteDetailLine,
} from '../../services/manufacturerRfqApi';

export type LineResponseType = 'UNANSWERED' | 'QUOTE' | 'CANNOT_SUPPLY';

export type CannotSupplyReasonOption =
  | 'Currently Unavailable'
  | 'Product Not Manufactured'
  | 'Production Capacity Unavailable'
  | 'MOQ Cannot Be Met'
  | 'Required Delivery Date Cannot Be Met'
  | 'Other';

interface LineInputState {
  responseType: LineResponseType;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  cannotSupplyReason: CannotSupplyReasonOption | '';
  cannotSupplyRemarks: string;
  remarks: string;
}

/**
 * Standard enterprise date formatter: "13 Nov 2026"
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

export const ManufacturerAssignedRFQsModule: React.FC = () => {
  const {
    addAuditLog, authUser, userProfile
  } = useApp();

  // Real API State
  const [assignedRfqs, setAssignedRfqs] = useState<AssignedRfqItem[]>([]);
  const [counts, setCounts] = useState<AssignedRfqCounts>({
    all: 0,
    actionNeeded: 0,
    draftSaved: 0,
    submitted: 0,
    declined: 0,
    expired: 0,
  });
  const [currentMfg, setCurrentMfg] = useState<ManufacturerProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Detail View State
  const [selectedRfqItem, setSelectedRfqItem] = useState<AssignedRfqItem | null>(null);
  const [selectedRfqDetail, setSelectedRfqDetail] = useState<AssignedRfqDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Commercial Header Inputs for Quote
  const [quoteValidUntil, setQuoteValidUntil] = useState<string>('');
  const [quoteDeliveryTerms, setQuoteDeliveryTerms] = useState<string>('Ex-Factory / Cold-Chain Fleet');
  const [quotePaymentTerms, setQuotePaymentTerms] = useState<string>('30 Days Net');
  const [quoteGeneralRemarks, setQuoteGeneralRemarks] = useState<string>('');

  // Per-Line Commercial Input States for active RFQ
  const [lineInputs, setLineInputs] = useState<Record<string, LineInputState>>({});
  const [quoteFormError, setQuoteFormError] = useState<string | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Decline RFQ Modal State
  const [declineModalRfq, setDeclineModalRfq] = useState<AssignedRfqItem | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [declineRemarks, setDeclineRemarks] = useState<string>('');
  const [declineFormError, setDeclineFormError] = useState<string | null>(null);
  const [isDeclining, setIsDeclining] = useState<boolean>(false);
  const [messageSuccessToast, setMessageSuccessToast] = useState<string | null>(null);

  /**
   * Load assigned RFQs from real backend API.
   */
  const loadAssignedRfqs = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await manufacturerRfqApi.listAssignedRfqs({
        status: selectedFilter,
        search: debouncedSearch,
      });
      setAssignedRfqs(res.items || []);
      setCounts(res.counts || {
        all: 0,
        actionNeeded: 0,
        draftSaved: 0,
        submitted: 0,
        declined: 0,
        expired: 0,
      });
      if (res.manufacturer) {
        setCurrentMfg(res.manufacturer);
      }
    } catch (err: any) {
      console.error('Failed to load assigned RFQs:', err);
      setApiError(err.message || 'We couldn\'t retrieve your assigned RFQs. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter, debouncedSearch]);

  // Initial fetch and on filter/search change
  useEffect(() => {
    loadAssignedRfqs();
  }, [loadAssignedRfqs]);

  // Automatic data revalidation on window focus or visibility change
  useEffect(() => {
    const handleFocus = () => {
      loadAssignedRfqs();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAssignedRfqs();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadAssignedRfqs]);

  /**
   * Load full RFQ details when opening RFQ.
   */
  const handleOpenRfqDetail = async (item: AssignedRfqItem) => {
    setSelectedRfqItem(item);
    setIsLoadingDetail(true);
    setDetailError(null);
    setQuoteFormError(null);

    try {
      const detail = await manufacturerRfqApi.getAssignedRfq(item.rfqId);
      setSelectedRfqDetail(detail);

      const existingQuote = detail.existingQuote;
      if (existingQuote) {
        setQuoteValidUntil(existingQuote.validUntil || '');
        setQuoteDeliveryTerms(existingQuote.deliveryTerms || 'Ex-Factory / Cold-Chain Fleet');
        setQuotePaymentTerms(existingQuote.paymentTerms || '30 Days Net');
        setQuoteGeneralRemarks(existingQuote.remarks || '');
      } else {
        const defaultValid = new Date();
        defaultValid.setDate(defaultValid.getDate() + 30);
        setQuoteValidUntil(defaultValid.toISOString().split('T')[0]);
        setQuoteDeliveryTerms(detail.rfq.creditTerms ? `Terms: ${detail.rfq.creditTerms}` : 'Ex-Factory / Cold-Chain Fleet');
        setQuotePaymentTerms('30 Days Net');
        setQuoteGeneralRemarks('');
      }

      // Initialize line inputs
      const initial: Record<string, LineInputState> = {};
      detail.rfq.lines.forEach((line) => {
        const matchQuoteLine = existingQuote?.lines?.find(
          (ql) => ql.rfqLineId === line.id || (ql.productId && ql.productId === line.productId)
        );

        const isSpecialParty = isB2bSpecial(detail.rfq.customerClassification);
        const defaultRespType: LineResponseType = matchQuoteLine
          ? (matchQuoteLine.responseType || (matchQuoteLine.cannotSupplyReason ? 'CANNOT_SUPPLY' : 'QUOTE'))
          : (isSpecialParty ? 'QUOTE' : 'UNANSWERED');

        const defaultUnitPrice = matchQuoteLine?.unitPrice
          ? matchQuoteLine.unitPrice
          : (line.targetPrice || 15.00);

        initial[line.id] = {
          responseType: defaultRespType,
          unitPrice: defaultUnitPrice,
          moq: matchQuoteLine?.moq ?? 1000,
          leadTimeDays: matchQuoteLine?.leadTimeDays ?? 14,
          cannotSupplyReason: (matchQuoteLine?.cannotSupplyReason as CannotSupplyReasonOption) || '',
          cannotSupplyRemarks: matchQuoteLine?.cannotSupplyRemarks || '',
          remarks: matchQuoteLine?.remarks || (isSpecialParty ? 'Special Party agreed pricing confirmed' : ''),
        };
      });

      setLineInputs(initial);
    } catch (err: any) {
      console.error('Failed to load RFQ detail:', err);
      setDetailError(err.message || 'Could not retrieve RFQ details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  /**
   * Return from detail view to main table, triggering revalidation.
   */
  const handleBackToList = () => {
    setSelectedRfqDetail(null);
    setSelectedRfqItem(null);
    loadAssignedRfqs();
  };

  // Status Badge Helper
  const getRFQStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'DECLINED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'DECLINED' };
      case 'NEGOTIATION':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'NEGOTIATION' };
      case 'SUBMITTED':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'SUBMITTED' };
      case 'DRAFT':
        return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'DRAFT' };
      case 'EXPIRED':
        return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
      default:
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'ACTION NEEDED' };
    }
  };

  // Handle Per-Line Input Field Changes
  const handleLineInputChange = (lineId: string, field: keyof LineInputState, value: any) => {
    setLineInputs(prev => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || {
          responseType: 'UNANSWERED',
          unitPrice: 12.00,
          moq: 1000,
          leadTimeDays: 14,
          cannotSupplyReason: '',
          cannotSupplyRemarks: '',
          remarks: ''
        }),
        [field]: value
      }
    }));
  };

  // Consolidated Quote Overall Summary Calculations
  const consolidatedSummary = useMemo(() => {
    if (!selectedRfqDetail) {
      return {
        totalLines: 0,
        quotedLinesCount: 0,
        cannotSupplyLinesCount: 0,
        unansweredLinesCount: 0,
        totalQty: 0,
        maxLeadTime: 14,
      };
    }

    let totalQty = 0;
    let maxLeadTime = 0;
    let quotedLinesCount = 0;
    let cannotSupplyLinesCount = 0;
    let unansweredLinesCount = 0;

    selectedRfqDetail.rfq.lines.forEach((line) => {
      const input = lineInputs[line.id];
      if (!input || input.responseType === 'UNANSWERED') {
        unansweredLinesCount++;
      } else if (input.responseType === 'QUOTE') {
        quotedLinesCount++;
        totalQty += line.quantity;
        if (input.leadTimeDays > maxLeadTime) maxLeadTime = input.leadTimeDays;
      } else if (input.responseType === 'CANNOT_SUPPLY') {
        cannotSupplyLinesCount++;
      }
    });

    return {
      totalLines: selectedRfqDetail.rfq.lines.length,
      quotedLinesCount,
      cannotSupplyLinesCount,
      unansweredLinesCount,
      totalQty,
      maxLeadTime: maxLeadTime || 14,
    };
  }, [selectedRfqDetail, lineInputs]);

  /**
   * Submit or Draft Quotation to PostgreSQL.
   */
  const handleSaveQuotation = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (!selectedRfqDetail) return;
    setQuoteFormError(null);

    const isSubmittedAction = status === 'SUBMITTED';

    if (selectedRfqDetail.status === 'DECLINED') {
      setQuoteFormError('This RFQ has been declined. Quote submission is disabled.');
      return;
    }

    if (isSubmittedAction) {
      if (isSubmittingQuote) return;
      setIsSubmittingQuote(true);
    } else {
      if (isSavingDraft) return;
      setIsSavingDraft(true);
    }

    try {
      if (isSubmittedAction) {
        for (const line of selectedRfqDetail.rfq.lines) {
          const input = lineInputs[line.id];
          if (!input || input.responseType === 'UNANSWERED') {
            throw new Error(`Please provide a response for all RFQ product lines ("${line.productName}" has no response selection).`);
          }

          if (input.responseType === 'QUOTE') {
            if (!input.unitPrice || input.unitPrice <= 0) {
              throw new Error(`Complete pricing for ${line.productName}: Unit Price must be greater than zero.`);
            }
            if (!input.moq || input.moq <= 0) {
              throw new Error(`Complete pricing for ${line.productName}: MOQ must be greater than zero.`);
            }
            if (!input.leadTimeDays || input.leadTimeDays <= 0) {
              throw new Error(`Complete pricing for ${line.productName}: Lead Time must be greater than zero.`);
            }
          } else if (input.responseType === 'CANNOT_SUPPLY') {
            if (!input.cannotSupplyReason) {
              throw new Error(`Please select a reason why "${line.productName}" cannot be supplied.`);
            }
            if (input.cannotSupplyReason === 'Other' && (!input.cannotSupplyRemarks || !input.cannotSupplyRemarks.trim())) {
              throw new Error(`Please enter reason details for "${line.productName}" under 'Other'.`);
            }
          }
        }

        const quotedCount = selectedRfqDetail.rfq.lines.filter(l => lineInputs[l.id]?.responseType === 'QUOTE').length;
        if (quotedCount === 0) {
          throw new Error('All lines are marked as Cannot Supply. Please use "Decline RFQ" to decline the entire RFQ.');
        }
      }

      // Build payload
      const linesPayload = selectedRfqDetail.rfq.lines.map((line) => {
        const input = lineInputs[line.id] || {
          responseType: 'QUOTE',
          unitPrice: 12.00,
          moq: 1000,
          leadTimeDays: 14,
          cannotSupplyReason: '',
          cannotSupplyRemarks: '',
          remarks: ''
        };

        return {
          rfqLineId: line.id,
          productId: line.productId || undefined,
          productName: line.productName,
          responseType: input.responseType === 'UNANSWERED' ? ('QUOTE' as const) : input.responseType,
          quotedQuantity: line.quantity,
          unitPrice: input.responseType === 'QUOTE' ? Number(input.unitPrice) : 0,
          moq: input.responseType === 'QUOTE' ? Number(input.moq) : 1,
          leadTimeDays: input.responseType === 'QUOTE' ? Number(input.leadTimeDays) : 14,
          taxPercent: 0,
          discountPercent: 0,
          deliveryTerms: quoteDeliveryTerms,
          cannotSupplyReason: input.responseType === 'CANNOT_SUPPLY' ? input.cannotSupplyReason : undefined,
          cannotSupplyRemarks: input.responseType === 'CANNOT_SUPPLY' ? input.cannotSupplyRemarks : undefined,
          remarks: input.remarks || undefined,
        };
      });

      const res = await manufacturerRfqApi.submitQuote(selectedRfqDetail.rfq.id, {
        status,
        validUntil: quoteValidUntil || undefined,
        deliveryTerms: quoteDeliveryTerms,
        paymentTerms: quotePaymentTerms,
        remarks: quoteGeneralRemarks || undefined,
        lines: linesPayload,
      });

      setMessageSuccessToast(`✔ ${res.message}! (Quote #: ${res.quote?.quoteNumber || 'Generated'})`);
      setTimeout(() => setMessageSuccessToast(null), 5000);

      if (addAuditLog) {
        addAuditLog(
          isSubmittedAction ? 'SUBMIT_MANUFACTURER_QUOTE' : 'DRAFT_MANUFACTURER_QUOTE',
          `${isSubmittedAction ? 'Submitted' : 'Saved Draft'} quote for RFQ ${selectedRfqDetail.rfq.rfqNumber} (${consolidatedSummary.quotedLinesCount} of ${consolidatedSummary.totalLines} products quoted, lead time: ${consolidatedSummary.maxLeadTime} days)`
        );
      }

      // Revalidate automatically
      await handleOpenRfqDetail(selectedRfqItem!);
      loadAssignedRfqs();
    } catch (err: any) {
      console.error('Failed to submit quote:', err);
      setQuoteFormError(err.message || 'Failed to submit quote. Please verify network and backend connection.');
    } finally {
      setIsSubmittingQuote(false);
      setIsSavingDraft(false);
    }
  };

  /**
   * Decline RFQ handler.
   */
  const handleConfirmDeclineAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalRfq) return;

    if (!declineReason || !declineReason.trim()) {
      setDeclineFormError('Please select a reason for declining this RFQ.');
      return;
    }

    setIsDeclining(true);
    setDeclineFormError(null);

    try {
      await manufacturerRfqApi.declineRfq(declineModalRfq.rfqId, {
        declineReason,
        declineRemarks: declineRemarks || undefined,
      });

      setMessageSuccessToast(`RFQ ${declineModalRfq.rfqNumber} declined successfully.`);
      setTimeout(() => setMessageSuccessToast(null), 4000);

      setDeclineModalRfq(null);
      setSelectedRfqItem(null);
      setSelectedRfqDetail(null);
      loadAssignedRfqs();
    } catch (err: any) {
      console.error('Failed to decline RFQ:', err);
      setDeclineFormError(err.message || 'Failed to decline RFQ.');
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40, background: '#F8FAFC' }}>
      
      {/* ── DETAIL & QUOTATION VIEW ────────────────────────────────────── */}
      {selectedRfqDetail ? (() => {
        const rfq = selectedRfqDetail.rfq;
        const existingQuote = selectedRfqDetail.existingQuote;
        const isDeclined = selectedRfqDetail.status === 'DECLINED';
        const isSubmitted = existingQuote?.status === 'SUBMITTED' || selectedRfqDetail.status === 'QUOTED';
        const badge = getRFQStatusBadge(selectedRfqDetail.status === 'DECLINED' ? 'DECLINED' : (isSubmitted ? 'SUBMITTED' : (existingQuote?.status === 'DRAFT' ? 'DRAFT' : 'ACTION NEEDED')));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Top Navigation & Header */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleBackToList}
                  style={{ padding: '6px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={14} /> Back to Assigned RFQs
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                    {existingQuote && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#334155', fontFamily: 'monospace' }}>
                        Quote: {existingQuote.quoteNumber}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                      {rfq.companyName || rfq.buyerName}
                    </h1>
                    {isB2bSpecial(rfq.customerClassification) && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 11, fontWeight: 800 }}>
                        <Star size={11} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                      </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: rfq.priority === 'URGENT' ? '#FEE2E2' : '#F1F5F9', color: rfq.priority === 'URGENT' ? '#DC2626' : '#475569' }}>
                      Priority: {rfq.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isDeclined ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', padding: '6px 12px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FCA5A5' }}>
                    ✕ RFQ Declined {selectedRfqDetail.declineReason ? `(${selectedRfqDetail.declineReason})` : ''}
                  </span>
                ) : isSubmitted ? (
                  <span style={{ padding: '7px 14px', borderRadius: 6, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 800, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Check size={14} /> Quotation Submitted {existingQuote?.quoteNumber ? `(${existingQuote.quoteNumber})` : ''}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isDeclining}
                      onClick={() => {
                        setDeclineModalRfq(selectedRfqItem);
                        setDeclineReason('');
                        setDeclineRemarks('');
                        setDeclineFormError(null);
                      }}
                      style={{ padding: '7px 12px', borderRadius: 6, background: '#FFF', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ThumbsDown size={13} /> Decline RFQ
                    </button>
                    <button
                      type="button"
                      disabled={isSavingDraft || isSubmittingQuote}
                      onClick={() => handleSaveQuotation('DRAFT')}
                      style={{ padding: '7px 14px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Save size={13} /> {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingQuote || isSavingDraft}
                      onClick={() => handleSaveQuotation('SUBMITTED')}
                      style={{ padding: '7px 18px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={13} /> {isSubmittingQuote ? 'Submitting...' : 'Submit Quotation →'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Error Message */}
            {quoteFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 6, color: '#DC2626', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={15} /> {quoteFormError}
              </div>
            )}

            {/* Buyer Specifications & Delivery Metadata */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 12 }}>
              <div>
                <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Buyer Organization</div>
                <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{rfq.companyName || rfq.buyerName}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Code: {rfq.customerCode || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Delivery Location</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{rfq.deliveryLocation || 'Primary Delivery Address'}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{formatDate(rfq.requiredDate)}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Response Deadline</div>
                <div style={{ fontWeight: 800, color: '#D97706', marginTop: 2 }}>{formatDate(rfq.deadlineDate)}</div>
              </div>
              <div>
                <div style={{ color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600 }}>Credit Terms Requested</div>
                <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{rfq.creditRequired ? (rfq.creditTerms || 'Credit requested') : 'Standard Escrow'}</div>
              </div>
            </div>

            {/* Commercial Terms Configuration */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} /> QUOTATION COMMERCIAL TERMS &amp; VALIDITY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Quote Valid Until</label>
                  <input
                    type="date"
                    disabled={isSubmitted || isDeclined}
                    value={quoteValidUntil}
                    onChange={(e) => setQuoteValidUntil(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Delivery Terms</label>
                  <input
                    type="text"
                    disabled={isSubmitted || isDeclined}
                    placeholder="e.g. Ex-Factory / Cold-Chain Fleet"
                    value={quoteDeliveryTerms}
                    onChange={(e) => setQuoteDeliveryTerms(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Payment Terms</label>
                  <input
                    type="text"
                    disabled={isSubmitted || isDeclined}
                    placeholder="e.g. 30 Days Net"
                    value={quotePaymentTerms}
                    onChange={(e) => setQuotePaymentTerms(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer Remarks</label>
                  <input
                    type="text"
                    disabled={isSubmitted || isDeclined}
                    placeholder="Optional manufacturer notes..."
                    value={quoteGeneralRemarks}
                    onChange={(e) => setQuoteGeneralRemarks(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Requested Product Lines Section */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 12 }}>
                REQUESTED PRODUCT LINES ({rfq.lines.length}) — ENTER PRICING &amp; SUPPLY CAPABILITY
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rfq.lines.map((line) => {
                  const inputState = lineInputs[line.id] || {
                    responseType: 'UNANSWERED',
                    unitPrice: line.targetPrice || 12.00,
                    moq: 1000,
                    leadTimeDays: 14,
                    cannotSupplyReason: '',
                    cannotSupplyRemarks: '',
                    remarks: ''
                  };

                  return (
                    <div
                      key={line.id}
                      style={{
                        background: inputState.responseType === 'CANNOT_SUPPLY' ? '#FFF5F5' : inputState.responseType === 'QUOTE' ? '#F0FDFA' : '#F8FAFC',
                        border: inputState.responseType === 'CANNOT_SUPPLY' ? '1px solid #FECDD3' : inputState.responseType === 'QUOTE' ? '1px solid #99F6E4' : '1px solid #CBD5E1',
                        borderRadius: 8,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      {/* Line Item Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B' }}>#{line.lineItemNumber}</span>
                            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>{line.productName}</h3>
                            {line.productType === 'GENERIC' ? (
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>GENERIC</span>
                            ) : (
                              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>BRANDED</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                            Requested Volume: <strong style={{ color: '#0F172A' }}>{line.quantity.toLocaleString()} {line.uom || 'Units'}</strong>
                            {line.dosageForm && ` · Form: ${line.dosageForm}`}
                            {line.packSize && ` · Pack: ${line.packSize}`}
                            {line.targetPrice && ` · Target Price: ₹${Number(line.targetPrice).toFixed(2)}`}
                          </div>
                        </div>

                        {/* Line Response Type Selection Toggle */}
                        {!isSubmitted && !isDeclined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFFFFF', padding: 3, borderRadius: 6, border: '1px solid #CBD5E1' }}>
                            <button
                              type="button"
                              onClick={() => handleLineInputChange(line.id, 'responseType', 'QUOTE')}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 4,
                                border: 'none',
                                background: inputState.responseType === 'QUOTE' ? '#0F766E' : 'transparent',
                                color: inputState.responseType === 'QUOTE' ? '#FFFFFF' : '#475569',
                                fontWeight: 700,
                                fontSize: 11.5,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <DollarSign size={12} /> Quote Unit Price
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLineInputChange(line.id, 'responseType', 'CANNOT_SUPPLY')}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 4,
                                border: 'none',
                                background: inputState.responseType === 'CANNOT_SUPPLY' ? '#DC2626' : 'transparent',
                                color: inputState.responseType === 'CANNOT_SUPPLY' ? '#FFFFFF' : '#475569',
                                fontWeight: 700,
                                fontSize: 11.5,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <XCircle size={12} /> Cannot Supply
                            </button>
                          </div>
                        )}
                      </div>

                      {/* QUOTE PRICING FIELDS */}
                      {inputState.responseType === 'QUOTE' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Unit Price (₹) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              disabled={isSubmitted || isDeclined}
                              value={inputState.unitPrice}
                              onChange={(e) => handleLineInputChange(line.id, 'unitPrice', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 13, fontWeight: 700 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>MOQ (Units) *</label>
                            <input
                              type="number"
                              min="1"
                              disabled={isSubmitted || isDeclined}
                              value={inputState.moq}
                              onChange={(e) => handleLineInputChange(line.id, 'moq', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Lead Time (Days) *</label>
                            <input
                              type="number"
                              min="1"
                              disabled={isSubmitted || isDeclined}
                              value={inputState.leadTimeDays}
                              onChange={(e) => handleLineInputChange(line.id, 'leadTimeDays', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 13 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* CANNOT SUPPLY FIELDS */}
                      {inputState.responseType === 'CANNOT_SUPPLY' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Cannot Supply Reason *</label>
                            <select
                              disabled={isSubmitted || isDeclined}
                              value={inputState.cannotSupplyReason}
                              onChange={(e) => handleLineInputChange(line.id, 'cannotSupplyReason', e.target.value as CannotSupplyReasonOption)}
                              style={{ width: '100%', padding: '7px 9px', border: '1px solid #FECDD3', borderRadius: 5, fontSize: 12, background: '#FFF' }}
                            >
                              <option value="">-- Choose Reason --</option>
                              <option value="Currently Unavailable">Currently Unavailable</option>
                              <option value="Product Not Manufactured">Product Not Manufactured</option>
                              <option value="Production Capacity Unavailable">Production Capacity Unavailable</option>
                              <option value="MOQ Cannot Be Met">MOQ Cannot Be Met</option>
                              <option value="Required Delivery Date Cannot Be Met">Required Delivery Date Cannot Be Met</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Remarks / Explanation</label>
                            <input
                              type="text"
                              disabled={isSubmitted || isDeclined}
                              placeholder="Provide details for buyer compliance..."
                              value={inputState.cannotSupplyRemarks}
                              onChange={(e) => handleLineInputChange(line.id, 'cannotSupplyRemarks', e.target.value)}
                              style={{ width: '100%', padding: '7px 9px', border: '1px solid #FECDD3', borderRadius: 5, fontSize: 12 }}
                            />
                          </div>
                        </div>
                      )}

                      {/* UNANSWERED CALLOUT */}
                      {inputState.responseType === 'UNANSWERED' && (
                        <div style={{ color: '#64748B', fontSize: 11.5, fontStyle: 'italic' }}>
                          Please select <strong>Quote Unit Price</strong> to enter pricing or <strong>Cannot Supply</strong> if unavailable.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consolidated Quotation Summary Card */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CONSOLIDATED COMMERCIAL OFFER
                  </div>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    {consolidatedSummary.quotedLinesCount} of {consolidatedSummary.totalLines} Products Quoted · {consolidatedSummary.cannotSupplyLinesCount} Cannot Supply
                  </h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Overall Lead Time</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E' }}>
                    {consolidatedSummary.maxLeadTime} Days
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 12, color: '#334155', background: '#FFFFFF', padding: 12, borderRadius: 6, border: '1px solid #CCFBF1' }}>
                <div>Quoted Products: <strong style={{ color: '#0F766E' }}>{consolidatedSummary.quotedLinesCount}</strong></div>
                <div>Cannot Supply: <strong style={{ color: '#DC2626' }}>{consolidatedSummary.cannotSupplyLinesCount} lines</strong></div>
                <div>Total Quoted Quantity: <strong>{consolidatedSummary.totalQty.toLocaleString()} Units</strong></div>
                <div>Delivery Terms: <strong style={{ color: '#1D4ED8' }}>{quoteDeliveryTerms || 'Ex-Factory / Cold-Chain Fleet'}</strong></div>
              </div>
            </div>

            {/* Bottom Final Submit Button */}
            {!isSubmitted && !isDeclined && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  disabled={isSavingDraft || isSubmittingQuote}
                  onClick={() => handleSaveQuotation('DRAFT')}
                  style={{ padding: '9px 18px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  type="button"
                  disabled={isSubmittingQuote || isSavingDraft}
                  onClick={() => handleSaveQuotation('SUBMITTED')}
                  style={{ padding: '9px 24px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} /> Submit Complete Quotation →
                </button>
              </div>
            )}
          </div>
        );
      })() : (
        /* ── ASSIGNED RFQS MAIN LIST VIEW (STANDARD ENTERPRISE B2B TABLE) ── */
        <>
          {/* Page Header (Clean Enterprise B2B Standard) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 2 }}>
                MANUFACTURING OPERATIONS / PROCUREMENT
              </div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Assigned RFQs
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                Review buyer RFQs assigned to your organization, prepare line-item quotes, and submit commercial proposals.
              </p>
            </div>
          </div>

          {/* Filter / Search Area (Clean Single Toolbar) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search RFQ, buyer, or product"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 30px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }}>Status:</label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                style={{ padding: '6px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses ({counts.all})</option>
                <option value="ACTION_NEEDED">Action Needed ({counts.actionNeeded})</option>
                <option value="DRAFT">Draft ({counts.draftSaved})</option>
                <option value="SUBMITTED">Submitted ({counts.submitted})</option>
                <option value="DECLINED">Declined ({counts.declined})</option>
                <option value="EXPIRED">Expired ({counts.expired})</option>
              </select>
            </div>
          </div>

          {/* Compact Summary Strip */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 12,
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', marginRight: 2 }}>
              Summary:
            </span>

            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              style={{
                background: selectedFilter === 'ALL' ? '#F1F5F9' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Total Assigned</span>
              <strong style={{ fontWeight: 800, color: '#0F172A' }}>{counts.all}</strong>
            </button>

            <span style={{ width: 1, height: 14, background: '#E2E8F0' }} />

            <button
              type="button"
              onClick={() => setSelectedFilter('ACTION_NEEDED')}
              style={{
                background: selectedFilter === 'ACTION_NEEDED' ? '#F0FDFA' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Action Needed</span>
              <strong style={{ fontWeight: 800, color: '#0F766E' }}>{counts.actionNeeded}</strong>
            </button>

            <span style={{ width: 1, height: 14, background: '#E2E8F0' }} />

            <button
              type="button"
              onClick={() => setSelectedFilter('DRAFT')}
              style={{
                background: selectedFilter === 'DRAFT' ? '#EFF6FF' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Draft</span>
              <strong style={{ fontWeight: 800, color: '#1D4ED8' }}>{counts.draftSaved}</strong>
            </button>

            <span style={{ width: 1, height: 14, background: '#E2E8F0' }} />

            <button
              type="button"
              onClick={() => setSelectedFilter('SUBMITTED')}
              style={{
                background: selectedFilter === 'SUBMITTED' ? '#ECFDF5' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Submitted</span>
              <strong style={{ fontWeight: 800, color: '#16A34A' }}>{counts.submitted}</strong>
            </button>

            <span style={{ width: 1, height: 14, background: '#E2E8F0' }} />

            <button
              type="button"
              onClick={() => setSelectedFilter('DECLINED')}
              style={{
                background: selectedFilter === 'DECLINED' ? '#FEF2F2' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 12,
                color: '#334155',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Declined</span>
              <strong style={{ fontWeight: 800, color: '#DC2626' }}>{counts.declined}</strong>
            </button>
          </div>

          {/* Error State */}
          {apiError && (
            <div style={{ background: '#FFFFFF', border: '1px solid #FECDD3', borderRadius: 8, padding: '32px 20px', textAlign: 'center' }}>
              <AlertCircle size={32} style={{ color: '#DC2626', margin: '0 auto 10px', display: 'block' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>Unable to load assigned RFQs</h3>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 14px 0' }}>{apiError}</p>
              <button
                type="button"
                onClick={() => loadAssignedRfqs()}
                style={{ padding: '6px 14px', background: '#0F766E', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Main Enterprise Data Table */}
          {!apiError && (
            <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(15,23,42,0.03)', overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>RFQ #</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Buyer</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Products</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Quantity</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Required Date</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Quote Status</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>Deadline</th>
                    <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B', background: '#FFFFFF' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                          <span style={{ width: 14, height: 14, border: '2px solid #CBD5E1', borderTopColor: '#0F766E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                          Loading assigned RFQs...
                        </div>
                      </td>
                    </tr>
                  ) : assignedRfqs.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B', background: '#FFFFFF' }}>
                        <FileText size={32} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 2px 0' }}>No assigned RFQs</h3>
                        <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>There are currently no RFQs assigned to your organization.</p>
                      </td>
                    </tr>
                  ) : (
                    assignedRfqs.map((rfq) => {
                      const badge = getRFQStatusBadge(rfq.status);
                      const primaryProduct = rfq.linesPreview?.[0]?.productName || 'General Requisition';
                      const extraCount = rfq.totalLines > 1 ? rfq.totalLines - 1 : 0;
                      const primaryUom = rfq.linesPreview?.[0]?.uom || 'Units';
                      const allProductsTooltip = rfq.linesPreview?.map(l => `${l.productName} (${l.quantity.toLocaleString()} ${l.uom})`).join('\n') || primaryProduct;

                      return (
                        <tr
                          key={rfq.rfqId}
                          onClick={() => handleOpenRfqDetail(rfq)}
                          style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {rfq.rfqNumber}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span>{rfq.customerName}</span>
                              {isB2bSpecial(rfq.customerClassification) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                                  <Star size={9} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#334155' }} title={allProductsTooltip}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {primaryProduct}
                              </span>
                              {extraCount > 0 && (
                                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: 4 }}>
                                  +{extraCount} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                            {rfq.totalQuantity.toLocaleString()} {primaryUom}
                          </td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>
                            {formatDate(rfq.requiredDate)}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#64748B' }}>
                            {formatDate(rfq.deadlineDate)}
                          </td>
                          <td onClick={(e) => e.stopPropagation()} style={{ padding: '10px 14px', textAlign: 'right', paddingRight: 16 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenRfqDetail(rfq)}
                              style={{ padding: '5px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 5, background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              View RFQ →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MODAL: DECLINE RFQ CONFIRMATION ──────────────────────────── */}
      {declineModalRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeclineModalRfq(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: 20, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Decline RFQ {declineModalRfq.rfqNumber}?</h3>
              <button onClick={() => setDeclineModalRfq(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
            </div>

            {declineFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
                ⚠️ {declineFormError}
              </div>
            )}

            <form onSubmit={handleConfirmDeclineAction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Reason for Declining *</label>
                <select
                  disabled={isDeclining}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF' }}
                >
                  <option value="">-- Choose a Reason --</option>
                  <option value="Required delivery date not achievable">Required delivery date not achievable</option>
                  <option value="Production line at maximum capacity">Production line at maximum capacity</option>
                  <option value="Target price below manufacturing cost">Target price below manufacturing cost</option>
                  <option value="API / Raw material unavailable">API / Raw material unavailable</option>
                  <option value="Out of scope formulation">Out of scope formulation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Additional Remarks (Optional)</label>
                <textarea
                  rows={3}
                  disabled={isDeclining}
                  value={declineRemarks}
                  onChange={(e) => setDeclineRemarks(e.target.value)}
                  placeholder="Provide optional notes for buyer..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  disabled={isDeclining}
                  onClick={() => setDeclineModalRfq(null)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeclining}
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}
                >
                  {isDeclining ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Success Notification ───────────────────────────────── */}
      {messageSuccessToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10030, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '12px 18px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#166534' }}>
          <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
          <span>{messageSuccessToast}</span>
        </div>
      )}

    </div>
  );
};
