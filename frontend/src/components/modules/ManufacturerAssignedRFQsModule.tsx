import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote } from '../../types';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  FileText, Search, Filter, Clock, CheckCircle2, AlertTriangle,
  X, Send, Eye, Save, Calendar, Check, AlertCircle, Building2, Package,
  ShieldCheck, XCircle, ThumbsDown, ArrowLeft, MessageSquare, Edit3, DollarSign,
  Calculator, Truck, Percent, Tag, Paperclip, Star
} from 'lucide-react';

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
  taxPercent: number;
  discountPercent: number;
  deliveryTerms: string;
  cannotSupplyReason: CannotSupplyReasonOption | '';
  cannotSupplyRemarks: string;
  remarks: string;
}

export const ManufacturerAssignedRFQsModule: React.FC = () => {
  const {
    rfqs, quotes, mappings, manufacturers, products, categories, getCategoryMargin, getApplicableMargin, submitQuote, selectQuoteAndCreateOrder, declineRFQ, declinedRfqs,
    negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
    addAuditLog, setActiveTab
  } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const myMfgCode = myMfg?.code || 'MFG000401';

  // Check if RFQ is declined by current manufacturer
  const isDeclinedByMe = (rfqId: string) => {
    const list = (declinedRfqs && declinedRfqs[rfqId]) || [];
    return list.some(d => d.manufacturerId === myMfgId || d.manufacturerName?.includes('SunBio'));
  };

  const getDeclineRecord = (rfqId: string) => {
    const list = (declinedRfqs && declinedRfqs[rfqId]) || [];
    return list.find(d => d.manufacturerId === myMfgId || d.manufacturerName?.includes('SunBio'));
  };

  const checkIsDeadlinePast = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    // Set to end of deadline day (23:59:59.999) so same-day newly created RFQs are NOT marked as expired
    d.setHours(23, 59, 59, 999);
    return new Date() > d;
  };

  // Status Badge Helper
  const getRFQStatusBadge = (rfq: RFQ) => {
    const isDeclined = isDeclinedByMe(rfq.id) || rfq.quoteStatus === 'DECLINED';
    const myQuote = quotes.find(q => q.rfqId === rfq.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));

    const hasNegotiation = (myQuote && myQuote.status === 'NEGOTIATION') || rfq.quoteStatus === 'NEGOTIATION' || rfq.lines.some(l => {
      const threadKey = `${rfq.id}_${l.id}_${myMfgId}`;
      return (negotiationThreads && negotiationThreads[threadKey]?.length > 0) || (revisedQuotes && revisedQuotes[threadKey]);
    });

    const isSubmitted = (myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED')) || rfq.quoteStatus === 'SUBMITTED';
    const isDraft = (myQuote && myQuote.status === 'DRAFT') || rfq.quoteStatus === 'DRAFT' || rfq.status === 'Draft';

    const isExpiredExplicit = rfq.quoteStatus === 'EXPIRED' || rfq.status === 'Closed' || rfq.status === 'Expired';
    const isDeadlinePast = checkIsDeadlinePast(rfq.deadlineDate);

    const isExpired = isExpiredExplicit || (isDeadlinePast && !hasNegotiation && !isSubmitted && !isDraft && rfq.quoteStatus !== 'ACTION NEEDED');

    if (isDeclined) return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'DECLINED' };
    if (hasNegotiation) return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'NEGOTIATION' };
    if (isSubmitted) return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'SUBMITTED' };
    if (isDraft) return { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'DRAFT' };
    if (isExpired) return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
    return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'ACTION NEEDED' };
  };

  // Products mapped to this manufacturer
  const myMappedProductIds = useMemo(() => {
    const pMappings = (mappings || []).filter(m =>
      m.manufacturerId === myMfgId || m.manufacturerCode === myMfgCode || m.manufacturerName?.includes('SunBio')
    );
    return new Set(pMappings.map(m => m.productId));
  }, [mappings, myMfgId, myMfgCode]);

  // Filter & Sort RFQs assigned to THIS manufacturer (Newest/Latest creation date first)
  const assignedRfqs = useMemo(() => {
    const list = (rfqs || []).filter(rfq => {
      const isEligible = rfq.lines.length === 0 || rfq.lines.some(line =>
        !line.productId ||
        myMappedProductIds.has(line.productId) ||
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
  }, [rfqs, myMappedProductIds]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  // Filtered RFQ List
  const filteredRfqs = useMemo(() => {
    return assignedRfqs.filter(rfq => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        rfq.rfqNumber.toLowerCase().includes(q) ||
        rfq.customerName.toLowerCase().includes(q) ||
        rfq.lines.some(l => l.productName.toLowerCase().includes(q));

      const badge = getRFQStatusBadge(rfq);

      let matchesFilter = true;
      if (selectedFilter === 'NEW') matchesFilter = (badge.label === 'ACTION NEEDED' || badge.label === 'PRICING IN PROGRESS');
      else if (selectedFilter === 'DRAFT') matchesFilter = (badge.label === 'DRAFT');
      else if (selectedFilter === 'SUBMITTED') matchesFilter = (badge.label === 'SUBMITTED');
      else if (selectedFilter === 'NEGOTIATION') matchesFilter = (badge.label === 'NEGOTIATION');
      else if (selectedFilter === 'DECLINED') matchesFilter = (badge.label === 'DECLINED');
      else if (selectedFilter === 'EXPIRED') matchesFilter = (badge.label === 'EXPIRED');

      return matchesSearch && matchesFilter;
    });
  }, [assignedRfqs, quotes, declinedRfqs, negotiationThreads, revisedQuotes, searchTerm, selectedFilter, myMfgId]);

  // Metric Summaries for KPI Cards
  const metrics = useMemo(() => {
    let newAssignedCount = 0;
    let draftSavedCount = 0;
    let inNegotiationCount = 0;
    let submittedCount = 0;

    assignedRfqs.forEach(rfq => {
      const badge = getRFQStatusBadge(rfq);
      if (badge.label === 'ACTION NEEDED' || badge.label === 'PRICING IN PROGRESS') {
        newAssignedCount++;
      } else if (badge.label === 'DRAFT') {
        draftSavedCount++;
      } else if (badge.label === 'NEGOTIATION') {
        inNegotiationCount++;
      } else if (badge.label === 'SUBMITTED') {
        submittedCount++;
      }
    });

    return {
      total: assignedRfqs.length,
      newAssigned: newAssignedCount,
      pendingQuote: newAssignedCount,
      draftSaved: draftSavedCount,
      inNegotiation: inNegotiationCount,
      submitted: submittedCount
    };
  }, [assignedRfqs, quotes, declinedRfqs, negotiationThreads, revisedQuotes, myMfgId]);

  // Selected RFQ for Detail Inspection / Pricing View
  const [selectedRfqForDetail, setSelectedRfqForDetail] = useState<RFQ | null>(null);

  // Message Buyer Modal State for Ready to Quote
  const [messageModalData, setMessageModalData] = useState<{
    rfqNumber: string;
    buyerName: string;
    productName: string;
    messageText: string;
  } | null>(null);
  const [messageSuccessToast, setMessageSuccessToast] = useState<string | null>(null);

  // Per-Line Commercial Input States for active RFQ
  const [lineInputs, setLineInputs] = useState<Record<string, LineInputState>>({});
  const [quoteFormError, setQuoteFormError] = useState<string | null>(null);

  // Negotiation Modal State (product-level modal post-buyer response)
  const [viewingNegotiationLine, setViewingNegotiationLine] = useState<{
    rfq: RFQ;
    lineId: string;
    productName: string;
  } | null>(null);

  // Revised Quote Modal State (post-buyer response)
  const [revisedQuoteContext, setRevisedQuoteContext] = useState<{
    rfqId: string;
    rfqNumber: string;
    lineId: string;
    productName: string;
    lineQty: number;
    currentUnitPrice: number;
    currentLeadTime: number;
  } | null>(null);

  const [revUnitPrice, setRevUnitPrice] = useState<number>(8.50);
  const [revTaxPercent, setRevTaxPercent] = useState<number>(12);
  const [revDiscountPercent, setRevDiscountPercent] = useState<number>(5);
  const [revLeadTimeDays, setRevLeadTimeDays] = useState<number>(11);
  const [revMoq, setRevMoq] = useState<number>(1000);
  const [revRemarks, setRevRemarks] = useState<string>('Revised commercial offer with compressed delivery commitment.');

  // Negotiation reply text inside modal
  const [modalReplyText, setModalReplyText] = useState<string>('');

  // Decline RFQ Modal State
  const [declineModalRfq, setDeclineModalRfq] = useState<RFQ | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [declineRemarks, setDeclineRemarks] = useState<string>('');
  const [declineFormError, setDeclineFormError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');

  // Synchronize line inputs when opening RFQ Detail
  useEffect(() => {
    if (selectedRfqForDetail) {
      const existingQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
      const initial: Record<string, LineInputState> = {};

      selectedRfqForDetail.lines.forEach(line => {
        const matchLine = existingQuote?.quoteLines?.find(ql => ql.rfqLineId === line.id || ql.productId === line.productId);
        const isSpecialPartyLine = selectedRfqForDetail.customerClassification === 'SPECIAL_PARTY' || line.buyerProvidedPrice !== undefined;
        const respType: LineResponseType = matchLine ? (matchLine.responseType || (matchLine.cannotSupplyReason ? 'CANNOT_SUPPLY' : 'QUOTE')) : (isSpecialPartyLine ? 'QUOTE' : 'UNANSWERED');
        const defaultPrice = line.buyerProvidedPrice !== undefined ? Number(line.buyerProvidedPrice) : (matchLine?.unitPrice ?? (line.targetPrice || 12.00));

        initial[line.id] = {
          responseType: respType,
          unitPrice: defaultPrice,
          moq: matchLine?.moq ?? 1000,
          leadTimeDays: matchLine?.leadTimeDays ?? 14,
          taxPercent: matchLine?.taxPercent ?? 12,
          discountPercent: matchLine?.discountPercent ?? (isSpecialPartyLine ? 0 : 5),
          deliveryTerms: (matchLine as any)?.deliveryTerms || (existingQuote as any)?.deliveryTerms || 'Ex-Factory Hyderabad / Cold-Chain Fleet',
          cannotSupplyReason: (matchLine?.cannotSupplyReason as CannotSupplyReasonOption) || '',
          cannotSupplyRemarks: matchLine?.cannotSupplyRemarks || '',
          remarks: isSpecialPartyLine ? 'Special Party agreed pricing confirmed' : ''
        };
      });

      setLineInputs(initial);
      setQuoteFormError(null);
    }
  }, [selectedRfqForDetail, quotes, myMfgId]);

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
          taxPercent: 12,
          discountPercent: 5,
          deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
          cannotSupplyReason: '',
          cannotSupplyRemarks: '',
          remarks: ''
        }),
        [field]: value
      }
    }));
  };

  // Calculate Real-Time Line Breakdown Math
  const getLineCalculation = (line: any) => {
    const input = lineInputs[line.id] || {
      responseType: 'UNANSWERED',
      unitPrice: line.targetPrice || 12.00,
      moq: 1000,
      leadTimeDays: 14,
      taxPercent: 12,
      discountPercent: 5,
      deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
      cannotSupplyReason: '',
      cannotSupplyRemarks: '',
      remarks: ''
    };

    if (input.responseType !== 'QUOTE') {
      return {
        category: 'Tablets',
        marginPercent: 10,
        baseUnitPrice: 0,
        marginAmountPerUnit: 0,
        buyerUnitPrice: 0,
        baseAmount: 0,
        marginAmountTotal: 0,
        buyerBaseAmount: 0,
        discountAmount: 0,
        taxAmount: 0,
        finalLineAmount: 0
      };
    }

    const prd = (products || []).find(p => p.id === line.productId || p.name === line.productName);
    const category = prd?.category || prd?.dosageForm || line.dosageForm || 'Tablets';
    const catObj = categories.find(c => c.name.toLowerCase() === category.toLowerCase() || c.id === category);
    const marginResolution = getApplicableMargin ? getApplicableMargin({
      productId: prd?.id || line.productId,
      sku: prd?.code,
      manufacturerId: myMfgId,
      categoryId: catObj?.id,
      categoryName: category,
      isGeneric: prd?.isGeneric
    }) : { marginPercentage: getCategoryMargin(category), marginType: 'PERCENTAGE' as const, marginValue: getCategoryMargin(category) };
    const marginPercent = marginResolution.marginPercentage;

    const baseUnitPrice = input.unitPrice;
    const marginAmountPerUnit = marginResolution.marginType === 'FIXED_RATE'
      ? (marginResolution.marginRate ?? marginResolution.marginValue ?? marginPercent)
      : (baseUnitPrice * marginPercent) / 100;
    const buyerUnitPrice = baseUnitPrice + marginAmountPerUnit;

    const baseAmount = line.quantity * baseUnitPrice;
    const marginAmountTotal = line.quantity * marginAmountPerUnit;
    const buyerBaseAmount = baseAmount + marginAmountTotal;

    const discountAmount = buyerBaseAmount * (input.discountPercent / 100);
    const amountAfterDiscount = buyerBaseAmount - discountAmount;
    const taxAmount = amountAfterDiscount * (input.taxPercent / 100);
    const finalLineAmount = Math.round(amountAfterDiscount + taxAmount);

    return {
      category,
      marginPercent,
      baseUnitPrice,
      marginAmountPerUnit,
      buyerUnitPrice,
      baseAmount,
      marginAmountTotal,
      buyerBaseAmount,
      discountAmount,
      taxAmount,
      finalLineAmount
    };
  };

  // Consolidated Quote Overall Summary Calculations
  const consolidatedSummary = useMemo(() => {
    if (!selectedRfqForDetail) return { totalLines: 0, quotedLinesCount: 0, cannotSupplyLinesCount: 0, unansweredLinesCount: 0, totalQty: 0, totalMfgBase: 0, totalMarginAmount: 0, subtotal: 0, totalDiscount: 0, totalTax: 0, finalQuotationValue: 0, maxLeadTime: 14, overallDeliveryTerms: 'Ex-Factory Hyderabad' };

    let totalQty = 0;
    let totalMfgBase = 0;
    let totalMarginAmount = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let finalQuotationValue = 0;
    let maxLeadTime = 0;
    let overallDeliveryTerms = 'Ex-Factory Hyderabad / Cold-Chain Fleet';
    let quotedLinesCount = 0;
    let cannotSupplyLinesCount = 0;
    let unansweredLinesCount = 0;

    selectedRfqForDetail.lines.forEach(line => {
      const input = lineInputs[line.id] || {
        responseType: 'UNANSWERED',
        unitPrice: line.targetPrice || 12.00,
        moq: 1000,
        leadTimeDays: 14,
        taxPercent: 12,
        discountPercent: 5,
        deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
        cannotSupplyReason: '',
        cannotSupplyRemarks: '',
        remarks: ''
      };

      if (input.responseType === 'QUOTE') {
        quotedLinesCount++;
        totalQty += line.quantity;
        const calc = getLineCalculation(line);
        totalMfgBase += calc.baseAmount;
        totalMarginAmount += calc.marginAmountTotal;
        subtotal += calc.buyerBaseAmount;
        totalDiscount += calc.discountAmount;
        totalTax += calc.taxAmount;
        finalQuotationValue += calc.finalLineAmount;
        if (input.leadTimeDays > maxLeadTime) maxLeadTime = input.leadTimeDays;
        if (input.deliveryTerms) overallDeliveryTerms = input.deliveryTerms;
      } else if (input.responseType === 'CANNOT_SUPPLY') {
        cannotSupplyLinesCount++;
      } else {
        unansweredLinesCount++;
      }
    });

    return {
      totalLines: selectedRfqForDetail.lines.length,
      quotedLinesCount,
      cannotSupplyLinesCount,
      unansweredLinesCount,
      totalQty,
      totalMfgBase: Math.round(totalMfgBase),
      totalMarginAmount: Math.round(totalMarginAmount),
      subtotal: Math.round(subtotal),
      totalDiscount: Math.round(totalDiscount),
      totalTax: Math.round(totalTax),
      finalQuotationValue: Math.round(finalQuotationValue),
      maxLeadTime: maxLeadTime || 14,
      overallDeliveryTerms
    };
  }, [selectedRfqForDetail, lineInputs, products, categories]);

  // Single Consolidated Quote Submission Handler (Supports Full & Partial Quotes)
  const handleSingleConsolidatedQuoteSubmit = () => {
    if (!selectedRfqForDetail) return;
    setQuoteFormError(null);

    if (isDeclinedByMe(selectedRfqForDetail.id)) {
      setQuoteFormError('This RFQ has been declined. Quote submission is disabled.');
      return;
    }

    const isExpired = checkIsDeadlinePast(selectedRfqForDetail.deadlineDate);
    if (isExpired && selectedRfqForDetail.quoteStatus !== 'ACTION NEEDED') {
      setQuoteFormError('RFQ deadline has passed. Late quotations cannot be submitted.');
      return;
    }

    // 1. Validation: Every RFQ line must have an explicit response (QUOTE or CANNOT_SUPPLY)
    for (const line of selectedRfqForDetail.lines) {
      const input = lineInputs[line.id];
      if (!input || !input.responseType || input.responseType === 'UNANSWERED') {
        setQuoteFormError(`Please provide a response for all RFQ product lines before submitting ("${line.productName}" has no response selection).`);
        return;
      }

      if (input.responseType === 'QUOTE') {
        if (!input.unitPrice || input.unitPrice <= 0) {
          setQuoteFormError(`Complete pricing details for ${line.productName}: Valid Unit Price is required before submitting.`);
          return;
        }
        if (!input.moq || input.moq <= 0) {
          setQuoteFormError(`Complete pricing details for ${line.productName}: Valid MOQ is required before submitting.`);
          return;
        }
        if (!input.leadTimeDays || input.leadTimeDays <= 0) {
          setQuoteFormError(`Complete pricing details for ${line.productName}: Valid Lead Time is required before submitting.`);
          return;
        }
      } else if (input.responseType === 'CANNOT_SUPPLY') {
        if (!input.cannotSupplyReason) {
          setQuoteFormError(`Please select a reason why "${line.productName}" cannot be supplied.`);
          return;
        }
        if (input.cannotSupplyReason === 'Other' && (!input.cannotSupplyRemarks || !input.cannotSupplyRemarks.trim())) {
          setQuoteFormError(`Please enter reason details for "${line.productName}" under 'Other'.`);
          return;
        }
      }
    }

    // 2. Validation: If ALL lines are marked CANNOT_SUPPLY, require using Decline RFQ instead
    const quotedCount = selectedRfqForDetail.lines.filter(l => lineInputs[l.id]?.responseType === 'QUOTE').length;
    const cannotSupplyCount = selectedRfqForDetail.lines.filter(l => lineInputs[l.id]?.responseType === 'CANNOT_SUPPLY').length;

    if (quotedCount === 0) {
      setQuoteFormError('All product lines are marked as Cannot Supply. Please use the "Decline RFQ" button to decline the entire RFQ.');
      return;
    }

    const quoteType = cannotSupplyCount > 0 ? 'PARTIAL_QUOTE' : 'FULL_QUOTE';

    // Build consolidated quoteLines array containing line response state
    const quoteLines = selectedRfqForDetail.lines.map(line => {
      const input = lineInputs[line.id] || {
        responseType: 'QUOTE',
        unitPrice: 12.00,
        moq: 1000,
        leadTimeDays: 14,
        taxPercent: 12,
        discountPercent: 5,
        deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
        cannotSupplyReason: '',
        cannotSupplyRemarks: '',
        remarks: ''
      };
      const calc = getLineCalculation(line);

      return {
        rfqLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        category: calc.category,
        responseType: input.responseType,
        unitPrice: input.responseType === 'QUOTE' ? calc.baseUnitPrice : 0,
        baseUnitPrice: input.responseType === 'QUOTE' ? calc.baseUnitPrice : 0,
        marginPercent: input.responseType === 'QUOTE' ? calc.marginPercent : 0,
        marginAmount: input.responseType === 'QUOTE' ? calc.marginAmountPerUnit : 0,
        buyerUnitPrice: input.responseType === 'QUOTE' ? calc.buyerUnitPrice : 0,
        taxPercent: input.responseType === 'QUOTE' ? input.taxPercent : 0,
        discountPercent: input.responseType === 'QUOTE' ? input.discountPercent : 0,
        leadTimeDays: input.responseType === 'QUOTE' ? input.leadTimeDays : 0,
        moq: input.responseType === 'QUOTE' ? input.moq : 0,
        deliveryTerms: input.deliveryTerms,
        cannotSupplyReason: input.responseType === 'CANNOT_SUPPLY' ? input.cannotSupplyReason : undefined,
        cannotSupplyRemarks: input.responseType === 'CANNOT_SUPPLY' ? input.cannotSupplyRemarks : undefined,
        calculatedFinalPrice: calc.finalLineAmount
      };
    });

    const totalCalculatedAmount = quoteLines.reduce((acc, l) => acc + l.calculatedFinalPrice, 0);

    const newQuote: ManufacturerQuote = {
      id: `QTE-2026-${Math.floor(100 + Math.random() * 900)}`,
      rfqId: selectedRfqForDetail.id,
      rfqNumber: selectedRfqForDetail.rfqNumber,
      manufacturerId: myMfgId,
      manufacturerName: myMfgName,
      submissionDate: new Date().toISOString().split('T')[0],
      validUntil: '2026-09-30',
      status: 'SUBMITTED',
      quoteType,
      quoteLines,
      totalAmount: totalCalculatedAmount,
      remarks: quoteType === 'PARTIAL_QUOTE' 
        ? `Partial Quote: ${quotedCount} lines quoted, ${cannotSupplyCount} lines marked Cannot Supply.` 
        : 'Full Quote: WHO-GMP lab batch assay included with cold chain packaging.',
      ...({ deliveryTerms: consolidatedSummary.overallDeliveryTerms } as any)
    };

    submitQuote(newQuote);
    addAuditLog('SUBMIT_MANUFACTURER_QUOTE', `Submitted ${quoteType === 'PARTIAL_QUOTE' ? 'Partial' : 'Full'} Quote for RFQ ${selectedRfqForDetail.rfqNumber} (${quotedCount}/${selectedRfqForDetail.lines.length} products quoted, ₹${totalCalculatedAmount.toLocaleString('en-IN')})`);
    
    const isSpecialParty = selectedRfqForDetail.customerClassification === 'SPECIAL_PARTY';
    if (isSpecialParty) {
      const selections: Record<string, { mfgId: string; mfgName: string; price: number }> = {};
      selectedRfqForDetail.lines.forEach(l => {
        const inp = consolidatedInputs[l.id];
        const pr = Number(inp?.baseUnitPrice || l.buyerProvidedPrice || l.targetPrice || 14.50);
        selections[l.id] = {
          mfgId: myMfgId,
          mfgName: myMfgName,
          price: pr
        };
      });
      selectQuoteAndCreateOrder(selectedRfqForDetail.id, selections);
      alert(`✔ Special Party Pricing Confirmed & Purchase Order Generated Successfully!\n\nRFQ #: ${selectedRfqForDetail.rfqNumber}\nCustomer: ${selectedRfqForDetail.customerName}\nBuyer-Agreed Pricing Accepted.\nPurchase Order generated and routed to Admin Orders / PO Monitor!`);
    } else {
      alert(`✔ ${quoteType === 'PARTIAL_QUOTE' ? 'Partial' : 'Full'} Quotation Submitted Successfully!\n\nRFQ #: ${selectedRfqForDetail.rfqNumber}\nQuoted Lines: ${quotedCount}\nCannot Supply Lines: ${cannotSupplyCount}\nFinal Quotation Value: ₹${totalCalculatedAmount.toLocaleString('en-IN')}`);
    }
  };



  // Open Decline Confirmation Modal
  const handleOpenDeclineModal = (rfq: RFQ, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeclineModalRfq(rfq);
    setDeclineReason('');
    setDeclineRemarks('');
    setDeclineFormError(null);
  };

  // Confirm Decline Action
  const handleConfirmDeclineAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalRfq) return;

    if (!declineReason || !declineReason.trim()) {
      setDeclineFormError('Please select a reason for declining this RFQ.');
      return;
    }

    declineRFQ(declineModalRfq.id, myMfgId, myMfgName, declineReason, declineRemarks);
    setDeclineModalRfq(null);
    alert(`RFQ ${declineModalRfq.rfqNumber} declined successfully.`);
  };

  // Open Revised Quote Modal
  const handleOpenRevisedQuoteModal = (rfq: RFQ, line: any) => {
    const threadKey = `${rfq.id}_${line.id}_${myMfgId}`;
    const activeRev = revisedQuotes ? revisedQuotes[threadKey] : undefined;

    setRevisedQuoteContext({
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      lineId: line.id,
      productName: line.productName,
      lineQty: line.quantity,
      currentUnitPrice: activeRev ? activeRev.unitPrice : (lineInputs[line.id]?.unitPrice || line.targetPrice || 9.50),
      currentLeadTime: activeRev ? activeRev.leadTimeDays : (lineInputs[line.id]?.leadTimeDays || 14)
    });

    setRevUnitPrice(activeRev ? activeRev.unitPrice : (lineInputs[line.id]?.unitPrice || 8.50));
    setRevTaxPercent(12);
    setRevDiscountPercent(5);
    setRevLeadTimeDays(activeRev ? activeRev.leadTimeDays : 11);
    setRevMoq(1000);
    setRevRemarks(activeRev ? (activeRev.remarks || 'Revised price & compressed lead time.') : 'Revised commercial offer with 11-day delivery commitment.');
  };

  // Submit Revised Quote Form Handler
  const handleConfirmRevisedQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisedQuoteContext) return;

    const threadKey = `${revisedQuoteContext.rfqId}_${revisedQuoteContext.lineId}_${myMfgId}`;
    submitRevisedQuote(threadKey, {
      unitPrice: revUnitPrice,
      taxPercent: revTaxPercent,
      discountPercent: revDiscountPercent,
      leadTimeDays: revLeadTimeDays,
      moq: revMoq,
      remarks: revRemarks
    });

    alert(`✔ Revised Quote Submitted Successfully!\n\nProduct: ${revisedQuoteContext.productName}\nRevised Price: ₹${revUnitPrice.toFixed(2)}\nLead Time: ${revLeadTimeDays} Days`);
    setRevisedQuoteContext(null);
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {selectedRfqForDetail ? (() => {
        const isDeclined = isDeclinedByMe(selectedRfqForDetail.id);
        const myQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
        const detailBadge = getRFQStatusBadge(selectedRfqForDetail);
        const isSubmitted = (!!myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED')) || detailBadge.label === 'SUBMITTED';
        const isExpired = detailBadge.label === 'EXPIRED';

        return (
          /* ── RFQ PRICING & CONSOLIDATED QUOTATION VIEW ─────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Top Header Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setSelectedRfqForDetail(null)}
                  style={{ padding: '7px 12px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={15} /> Back to Assigned RFQs
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{selectedRfqForDetail.rfqNumber}</span>
                    {(() => {
                      const badge = getRFQStatusBadge(selectedRfqForDetail);
                      return (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                      {selectedRfqForDetail.customerName}
                    </h1>
                    {selectedRfqForDetail.customerClassification === 'SPECIAL_PARTY' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 11, fontWeight: 800 }}>
                        <Star size={12} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 700 }}>
                        REGULAR
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* TOP-RIGHT ACTION BUTTONS ONLY: Decline RFQ & Single Consolidated Submit Quote */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(() => {
                  if (isDeclined) {
                  return (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', padding: '6px 12px', background: '#FEF2F2', borderRadius: 6, border: '1px solid #FCA5A5' }}>
                      ✕ RFQ Declined
                    </span>
                  );
                }

                if (isExpired) {
                  return (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4B5563', padding: '6px 12px', background: '#F3F4F6', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                      Expired
                    </span>
                  );
                }

                if (isSubmitted) {
                  return (
                    <button
                      onClick={() => {
                        setSelectedRfqForDetail(null);
                        setActiveTab('quotes');
                      }}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      ✓ Quote Submitted — View Submissions →
                    </button>
                  );
                }

                return (
                    <button
                      onClick={(e) => handleOpenDeclineModal(selectedRfqForDetail, e)}
                      style={{ padding: '8px 14px', borderRadius: 6, background: '#FFF', color: '#DC2626', border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <ThumbsDown size={14} /> Decline RFQ
                    </button>
                );
              })()}
            </div>
          </div>

          {/* Validation Error Banner */}
          {quoteFormError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 16px', borderRadius: 8, color: '#DC2626', fontSize: 12.5, fontWeight: 700 }}>
              ⚠️ {quoteFormError}
            </div>
          )}

          {/* SPECIAL PARTY PRE-AGREED PRICING BANNER */}
          {selectedRfqForDetail.customerClassification === 'SPECIAL_PARTY' && (
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #FCD34D',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={18} fill="#D97706" color="#D97706" />
                </div>
                <div>
                  <strong style={{ color: '#78350F', fontSize: 13.5, display: 'block' }}>Special Party Pre-Agreed Pricing Workflow</strong>
                  <span style={{ color: '#92400E', fontSize: 12 }}>
                    Buyer {selectedRfqForDetail.customerName} has provided pre-agreed product pricing. Click below to confirm and accept quotation immediately.
                  </span>
                </div>
              </div>
              {!isSubmitted && !isDeclined && !isExpired && (
                <button
                  type="button"
                  id="confirm-special-party-pricing-btn"
                  onClick={handleSingleConsolidatedQuoteSubmit}
                  style={{
                    background: '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 18px',
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(15,118,110,0.25)'
                  }}
                >
                  <Check size={14} /> Confirm & Accept Buyer Pricing →
                </button>
              )}
            </div>
          )}

          {/* BUYER SPECIFICATIONS & COMMERCIAL DETAILS */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 12.5, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Buyer Organization</div>
              <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.customerName}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>RFQ Creation Date</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.createdDate}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</div>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForDetail.lines[0]?.requiredDate || '2026-09-15'}</div>
            </div>
            <div>
              <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Response Deadline</div>
              <div style={{ fontWeight: 800, color: '#D97706', marginTop: 2 }}>{selectedRfqForDetail.deadlineDate}</div>
            </div>
          </div>

          {/* REQUESTED PRODUCT LINES SECTION (EVERY PRODUCT HAS ITS OWN PRICING CARD) */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', marginBottom: 14 }}>
              REQUESTED PRODUCT LINES ({selectedRfqForDetail.lines.length}) — ENTER PRICING & COMMERCIAL TERMS FOR CONSOLIDATED QUOTE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {selectedRfqForDetail.lines.map(line => {
                const threadKey = `${selectedRfqForDetail.id}_${line.id}_${myMfgId}`;
                const threadMsgs = (negotiationThreads && negotiationThreads[threadKey]) || [];
                const activeRev = revisedQuotes ? revisedQuotes[threadKey] : undefined;
                const hasMsgs = threadMsgs.length > 0;

                const inputState = lineInputs[line.id] || {
                  responseType: 'UNANSWERED',
                  unitPrice: line.targetPrice || 12.00,
                  moq: 1000,
                  leadTimeDays: 14,
                  taxPercent: 12,
                  discountPercent: 5,
                  deliveryTerms: 'Ex-Factory Hyderabad / Cold-Chain Fleet',
                  cannotSupplyReason: '',
                  cannotSupplyRemarks: '',
                  remarks: ''
                };

                const calc = getLineCalculation(line);

                return (
                  <div key={line.id} style={{
                    background: inputState.responseType === 'CANNOT_SUPPLY' ? '#FFF5F5' : inputState.responseType === 'QUOTE' ? '#F0FDFA' : '#F8FAFC',
                    border: inputState.responseType === 'CANNOT_SUPPLY' ? '1px solid #FECDD3' : inputState.responseType === 'QUOTE' ? '1px solid #99F6E4' : '1px solid #CBD5E1',
                    borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 14
                  }}>
                    
                    {/* Line Header & Requirements */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{line.productName}</span>

                          {line.buyerProvidedPrice !== undefined && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Star size={11} fill="#D97706" color="#D97706" /> Agreed Rate: ₹{Number(line.buyerProvidedPrice).toFixed(2)}/unit
                            </span>
                          )}

                          {/* LINE RESPONSE STATUS BADGE */}
                          {inputState.responseType === 'QUOTE' && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              ✓ Ready to Quote
                            </span>
                          )}
                          {inputState.responseType === 'CANNOT_SUPPLY' && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
                              ✕ Cannot Supply
                            </span>
                          )}
                          {inputState.responseType === 'UNANSWERED' && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                              ⚠ Response Required
                            </span>
                          )}

                          {hasMsgs && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                              BUYER NEGOTIATION ACTIVE ({threadMsgs.length} msgs)
                            </span>
                          )}
                          {activeRev && (
                            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                              REVISED QUOTE SUBMITTED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>
                          Requested Quantity: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} Units</strong> | Required Date: <strong>{line.requiredDate || '2026-09-15'}</strong>
                        </div>
                      </div>

                      {/* Post-Buyer Response Actions ONLY (Shown when Buyer Negotiation is active) */}
                      {hasMsgs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => setViewingNegotiationLine({ rfq: selectedRfqForDetail, lineId: line.id, productName: line.productName })}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageSquare size={13} /> View Buyer Negotiation ({threadMsgs.length})
                          </button>

                          <button
                            onClick={() => handleOpenRevisedQuoteModal(selectedRfqForDetail, line)}
                            style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <DollarSign size={13} /> Submit Revised Quote
                          </button>
                        </div>
                      )}
                    </div>

                    {/* UNIFORM LINE RESPONSE ACTION CONTROL BAR FOR EVERY PRODUCT */}
                    {!isSubmitted && !isDeclined && !isExpired && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Line Action:</span>
                          {inputState.responseType === 'UNANSWERED' && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                              ⚠ Response Required
                            </span>
                          )}
                          {inputState.responseType === 'QUOTE' && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              ✓ Ready to Quote
                            </span>
                          )}
                          {inputState.responseType === 'CANNOT_SUPPLY' && (
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
                              ✕ Cannot Supply
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleLineInputChange(line.id, 'responseType', 'QUOTE')}
                            style={{
                              padding: '7px 16px',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: inputState.responseType === 'QUOTE' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                              background: inputState.responseType === 'QUOTE' ? '#0F766E' : '#FFFFFF',
                              color: inputState.responseType === 'QUOTE' ? '#FFFFFF' : '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: inputState.responseType === 'QUOTE' ? '0 2px 4px rgba(15,118,110,0.2)' : 'none'
                            }}
                          >
                            <Check size={14} /> Quote Product
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLineInputChange(line.id, 'responseType', 'CANNOT_SUPPLY')}
                            style={{
                              padding: '7px 16px',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                              border: inputState.responseType === 'CANNOT_SUPPLY' ? '2px solid #E11D48' : '1px solid #CBD5E1',
                              background: inputState.responseType === 'CANNOT_SUPPLY' ? '#E11D48' : '#FFFFFF',
                              color: inputState.responseType === 'CANNOT_SUPPLY' ? '#FFFFFF' : '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: inputState.responseType === 'CANNOT_SUPPLY' ? '0 2px 4px rgba(225,29,72,0.2)' : 'none'
                            }}
                          >
                            <X size={14} /> Cannot Supply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* RESPONSE BODY: UNANSWERED PROMPT BANNER */}
                    {inputState.responseType === 'UNANSWERED' && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 16px', fontSize: 12.5, color: '#92400E', fontWeight: 600 }}>
                        ⚠️ <strong>Response Required for {line.productName}:</strong> Click <strong>Quote Product</strong> above to enter pricing or <strong>Cannot Supply</strong> if unable to supply this item.
                      </div>
                    )}

                    {/* RESPONSE BODY: CANNOT SUPPLY REASON FORM */}
                    {inputState.responseType === 'CANNOT_SUPPLY' && (
                      <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#9F1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          CANNOT SUPPLY REASON & REMARKS
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#9F1239', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Reason *</label>
                            <select
                              value={inputState.cannotSupplyReason}
                              onChange={e => handleLineInputChange(line.id, 'cannotSupplyReason', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #FDA4AF', borderRadius: 6, fontSize: 12.5, background: '#FFF', fontWeight: 700, color: '#9F1239' }}
                            >
                              <option value="">-- Choose Cannot Supply Reason --</option>
                              <option value="Currently Unavailable">Currently Unavailable</option>
                              <option value="Product Not Manufactured">Product Not Manufactured</option>
                              <option value="Production Capacity Unavailable">Production Capacity Unavailable</option>
                              <option value="MOQ Cannot Be Met">MOQ Cannot Be Met</option>
                              <option value="Required Delivery Date Cannot Be Met">Required Delivery Date Cannot Be Met</option>
                              <option value="Other">Other (Specify details below)</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#9F1239', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                              Reason Details / Remarks {inputState.cannotSupplyReason === 'Other' ? '*' : '(Optional)'}
                            </label>
                            <input
                              type="text"
                              placeholder={inputState.cannotSupplyReason === 'Other' ? 'Required: Enter explanation...' : 'Additional notes...'}
                              value={inputState.cannotSupplyRemarks}
                              onChange={e => handleLineInputChange(line.id, 'cannotSupplyRemarks', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #FDA4AF', borderRadius: 6, fontSize: 12.5, background: '#FFF' }}
                            />
                          </div>
                        </div>

                        <div style={{ fontSize: 11.5, color: '#881337', fontStyle: 'italic', marginTop: 2 }}>
                          ℹ️ Note: Marking this item as Cannot Supply excludes it from pricing while allowing you to quote remaining products.
                        </div>
                      </div>
                    )}

                    {/* RESPONSE BODY: QUOTE COMMERCIAL FIELDS */}
                    {inputState.responseType === 'QUOTE' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: line.buyerProvidedPrice !== undefined ? '#B45309' : '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                              {line.buyerProvidedPrice !== undefined ? (
                                <>
                                  <Star size={11} fill="#D97706" color="#D97706" /> BUYER AGREED PRICE (₹) *
                                </>
                              ) : (
                                'UNIT PRICE (₹) *'
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={inputState.unitPrice}
                              onChange={e => handleLineInputChange(line.id, 'unitPrice', Number(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: line.buyerProvidedPrice !== undefined ? '2px solid #F59E0B' : '1px solid #CBD5E1',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 800,
                                background: line.buyerProvidedPrice !== undefined ? '#FFFBEB' : '#FFF',
                                color: line.buyerProvidedPrice !== undefined ? '#92400E' : '#0F172A'
                              }}
                            />
                            {line.buyerProvidedPrice !== undefined && (
                              <div style={{ fontSize: 11, color: '#B45309', fontWeight: 600, marginTop: 2 }}>
                                Pre-agreed by buyer
                              </div>
                            )}
                          </div>



                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>DELIVERY SCHEDULE *</label>
                            <input
                              type="number"
                              required
                              value={inputState.leadTimeDays}
                              onChange={e => handleLineInputChange(line.id, 'leadTimeDays', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}
                            />
                          </div>



                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>DELIVERY TERMS</label>
                            <select
                              value={inputState.deliveryTerms}
                              onChange={e => handleLineInputChange(line.id, 'deliveryTerms', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#FFF', fontWeight: 600 }}
                            >
                              <option value="Ex-Factory Hyderabad / Cold-Chain Fleet">Ex-Factory Hyderabad / Cold Fleet</option>
                              <option value="FOR Destination / Freight Included">FOR Destination / Freight Included</option>
                              <option value="FOB Port Clearance Included">FOB Port Clearance Included</option>
                              <option value="CIF Consignee Warehouse">CIF Consignee Warehouse</option>
                            </select>
                          </div>
                        </div>

                        {/* DYNAMIC MARGIN CALCULATION BREAKDOWN FOR THIS LINE (Requirement 5) */}
                        <div style={{
                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 8,
                          padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                          gap: 12, fontSize: 12.5, boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
                        }}>
                          <div style={{ borderRight: '1px solid #F1F5F9', paddingRight: 10 }}>
                            <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' }}>
                              Manufacturer Base Price
                            </span>
                            <div style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', fontSize: 14, marginTop: 2 }}>
                              ₹{calc.baseUnitPrice.toFixed(2)} <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>/unit (₹{calc.baseAmount.toLocaleString('en-IN')})</span>
                            </div>
                          </div>

                          <div style={{ borderRight: '1px solid #F1F5F9', paddingRight: 10 }}>
                            <span style={{ color: '#D97706', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                              FactoryGrid Margin ({calc.marginPercent}%)
                            </span>
                            <div style={{ fontWeight: 800, color: '#D97706', fontFamily: 'monospace', fontSize: 14, marginTop: 2 }}>
                              + ₹{calc.marginAmountPerUnit.toFixed(2)} <span style={{ fontSize: 11, color: '#92400E', fontWeight: 500 }}>/unit (₹{calc.marginAmountTotal.toLocaleString('en-IN')})</span>
                            </div>
                          </div>

                          <div>
                            <span style={{ color: '#0F766E', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                              Final Buyer Price
                            </span>
                            <div style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', fontSize: 15, marginTop: 2 }}>
                              ₹{calc.buyerUnitPrice.toFixed(2)} <span style={{ fontSize: 11, color: '#0F766E', fontWeight: 600 }}>/unit</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                              Line Total: <strong>₹{calc.finalLineAmount.toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CONSOLIDATED QUOTE SUMMARY CARD ────────────────────────────── */}
          <div style={{ background: '#F0FDFA', border: '2px solid #0F766E', borderRadius: 12, padding: 22, boxShadow: '0 4px 14px rgba(15,118,110,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #99F6E4', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    CONSOLIDATED QUOTE SUMMARY
                  </span>
                  {consolidatedSummary.cannotSupplyLinesCount > 0 ? (
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                      PARTIAL QUOTATION
                    </span>
                  ) : (
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                      FULL QUOTATION
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  CONSOLIDATED OFFER ({consolidatedSummary.quotedLinesCount} Quoted · {consolidatedSummary.cannotSupplyLinesCount} Cannot Supply · {consolidatedSummary.totalQty.toLocaleString()} Units)
                </h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Final Commercial Offer Value</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                  ₹{consolidatedSummary.finalQuotationValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

              {/* 3-Part Commercial Margin Summary Container (Requirement 5) */}
              <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #99F6E4', padding: '14px 18px', marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Manufacturer Base Price Total
                  </span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{consolidatedSummary.totalMfgBase.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>
                    FactoryGrid Platform Margin
                  </span>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 2 }}>
                    + ₹{consolidatedSummary.totalMarginAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>
                    Final Buyer-Facing Quotation
                  </span>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{consolidatedSummary.finalQuotationValue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, fontSize: 12.5, color: '#334155', marginBottom: 14 }}>
                <div>Quoted Lines: <strong style={{ color: '#15803D' }}>{consolidatedSummary.quotedLinesCount} of {consolidatedSummary.totalLines}</strong></div>
                <div>Cannot Supply: <strong style={{ color: '#B91C1C' }}>{consolidatedSummary.cannotSupplyLinesCount} lines</strong></div>
                <div>Overall Delivery Lead Time: <strong style={{ color: '#1D4ED8' }}>{consolidatedSummary.maxLeadTime} Days</strong></div>
                <div>Delivery Terms: <strong style={{ color: '#0F172A' }}>{consolidatedSummary.overallDeliveryTerms}</strong></div>
              </div>

            <div style={{ fontSize: 12.5, color: '#0F766E', fontWeight: 600, borderTop: '1px solid #99F6E4', paddingTop: 12 }}>
              All requested line items will be transmitted together as <strong>ONE consolidated commercial quote</strong>.
            </div>
          </div>

          {/* ── SINGLE SUBMIT COMPLETE QUOTATION BUTTON (OUTSIDE CARD, RIGHT-ALIGNED BELOW) ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            {(() => {
              const myQuote = quotes.find(q => q.rfqId === selectedRfqForDetail.id && (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')));
              const isSubmitted = myQuote && (myQuote.status === 'SUBMITTED' || myQuote.status === 'ACCEPTED' || myQuote.status === 'SUB-ORDER CREATED');

              if (isSubmitted) {
                return (
                  <button
                    onClick={() => {
                      setSelectedRfqForDetail(null);
                      setActiveTab('quotes');
                    }}
                    style={{ padding: '10px 20px', borderRadius: 8, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}
                  >
                    ✓ Quote Submitted — View Submissions →
                  </button>
                );
              }

              return (
                <button
                  onClick={handleSingleConsolidatedQuoteSubmit}
                  style={{ padding: '11px 28px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}
                >
                  <Send size={16} /> Submit Complete Quotation →
                </button>
              );
            })()}
          </div>

        </div>
      );
    })() : (
        /* ── ASSIGNED RFQS MAIN LIST VIEW (ENTERPRISE B2B TABLE) ───────────── */
        <>
          {/* Header Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MANUFACTURING OPERATIONS / ASSIGNED RFQS</div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                ASSIGNED RFQS
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                Review assigned buyer RFQs, submit quotes, and manage commercial negotiations for {myMfgName}.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input
                  type="text"
                  placeholder="Search RFQs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: 180, padding: '7px 10px 7px 30px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
                />
              </div>

              <select
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                style={{ padding: '7px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses ({assignedRfqs.length})</option>
                <option value="NEW">New Assigned</option>
                <option value="DRAFT">Draft Saved</option>
                <option value="SUBMITTED">Quote Submitted</option>
                <option value="NEGOTIATION">In Negotiation</option>
                <option value="DECLINED">Declined</option>
                <option value="EXPIRED">Expired</option>
              </select>

              <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Action Needed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{metrics.newAssigned}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>New assigned RFQs pending quote</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Draft Saved</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{metrics.draftSaved}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>In-progress quote drafts</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>In Negotiation</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 4 }}>{metrics.inNegotiation}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Buyer negotiation active</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Submitted</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.submitted}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commercial quote submitted</div>
            </div>
          </div>

          {/* Enterprise RFQ List Table / Cards */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            {displayMode === 'CARD' ? (
              <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredRfqs.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
                    No assigned RFQs match your filter.
                  </div>
                ) : (
                  filteredRfqs.map(rfq => {
                    const badge = getRFQStatusBadge(rfq);
                    const totalQty = rfq.lines.reduce((acc, l) => acc + l.quantity, 0);
                    const prodNames = rfq.lines.map(l => l.productName).join(', ');

                    return (
                      <div
                        key={rfq.id}
                        style={{
                          background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18,
                          boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                              {rfq.rfqNumber}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {badge.label}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span>{rfq.buyerOrg || rfq.customerName || 'Apex Pharma PCD Franchise'}</span>
                            {rfq.customerClassification === 'SPECIAL_PARTY' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                                <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 10, fontWeight: 700 }}>
                                REGULAR
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div>Products: <strong style={{ color: '#0F172A' }}>{prodNames}</strong></div>
                            <div>Total Qty: <strong>{totalQty.toLocaleString('en-IN')} Units</strong></div>
                            <div>Required Date: {rfq.targetDeliveryDate || '2026-09-15'}</div>
                            <div>Deadline: <strong style={{ color: '#DC2626' }}>{rfq.responseDeadline || '2026-08-30'}</strong></div>
                          </div>
                        </div>

                        <div style={{ paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedRfqForDetail(rfq)}
                            style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View &amp; Quote RFQ →
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ #</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCTS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUANTITY</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>REQUIRED DATE</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTE STATUS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DEADLINE</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                  </tr>
                </thead>
              <tbody>
                {filteredRfqs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <FileText size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No assigned RFQs match your filter.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRfqs.map(rfq => {
                    const badge = getRFQStatusBadge(rfq);
                    const totalQty = rfq.lines.reduce((acc, l) => acc + l.quantity, 0);

                    return (
                      <tr
                        key={rfq.id}
                        onClick={() => setSelectedRfqForDetail(rfq)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {rfq.rfqNumber}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{rfq.customerName}</span>
                            {rfq.customerClassification === 'SPECIAL_PARTY' ? (
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
                        <td style={{ padding: '12px 14px', color: '#334155' }}>
                          {rfq.lines.length} {rfq.lines.length === 1 ? 'Product' : 'Products'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                          {totalQty.toLocaleString()} Units
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {rfq.lines[0]?.requiredDate || '2026-09-15'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {rfq.deadlineDate}
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                          <button
                            onClick={() => setSelectedRfqForDetail(rfq)}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
            )}
          </div>
        </>
      )}

      {/* ── MODAL 1: COMPACT NEGOTIATION THREAD MODAL (POST-BUYER RESPONSE) ── */}
      {viewingNegotiationLine && (() => {
        const { rfq, lineId, productName } = viewingNegotiationLine;
        const threadKey = `${rfq.id}_${lineId}_${myMfgId}`;
        const threadMsgs = (negotiationThreads && negotiationThreads[threadKey]) || [
          {
            id: 'msg_def_1',
            threadKey,
            senderRole: 'BUYER' as const,
            senderName: 'Apex Pharma Procurement Desk',
            timestamp: '14 Aug 2026, 02:15 PM',
            text: 'We are reviewing your offer. Can you improve unit price to ₹8.50 and compress lead time to 11 days?'
          }
        ];

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setViewingNegotiationLine(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 20, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>BUYER NEGOTIATION THREAD</div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>{productName}</h3>
                  <div style={{ fontSize: 11, color: '#64748B' }}>RFQ Ref: {rfq.rfqNumber}</div>
                </div>
                <button onClick={() => setViewingNegotiationLine(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              {/* Message Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                {threadMsgs.map(m => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.senderRole === 'SUPPLIER' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: m.senderRole === 'SUPPLIER' ? '#0F766E' : '#F1F5F9',
                      color: m.senderRole === 'SUPPLIER' ? '#FFFFFF' : '#0F172A',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 12.5
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, marginBottom: 3 }}>
                      {m.senderName} · {m.timestamp}
                    </div>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>

              {/* Inline Reply Input */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <input
                  type="text"
                  placeholder="Type reply to buyer procurement team..."
                  value={modalReplyText}
                  onChange={e => setModalReplyText(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: 12.5, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && modalReplyText.trim()) {
                      sendNegotiationMessage(threadKey, modalReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                      setModalReplyText('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (modalReplyText.trim()) {
                      sendNegotiationMessage(threadKey, modalReplyText.trim(), 'SUPPLIER', `${myMfgName} (Sales)`);
                      setModalReplyText('');
                    }
                  }}
                  style={{ padding: '8px 16px', fontSize: 12.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Send size={13} /> Reply
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 2: SUBMIT REVISED QUOTE FORM MODAL (POST-BUYER RESPONSE) ── */}
      {revisedQuoteContext && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setRevisedQuoteContext(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Submit Revised Commercial Quote</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{revisedQuoteContext.productName} ({revisedQuoteContext.lineQty.toLocaleString()} Units)</div>
              </div>
              <button onClick={() => setRevisedQuoteContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmRevisedQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Unit Price (₹) *</label>
                  <input type="number" step="0.01" required value={revUnitPrice} onChange={e => setRevUnitPrice(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>DELIVERY SCHEDULE *</label>
                  <input type="number" required value={revLeadTimeDays} onChange={e => setRevLeadTimeDays(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }} />
                </div>
              </div>



              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: 12, fontSize: 12.5, color: '#0F766E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Revised Unit Price:</span>
                <strong style={{ fontSize: 15, fontFamily: 'monospace' }}>₹{revUnitPrice.toFixed(2)}</strong>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Remarks / Commercial Notes</label>
                <textarea rows={2} value={revRemarks} onChange={e => setRevRemarks(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setRevisedQuoteContext(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>Submit Revised Quote →</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: DECLINE RFQ CONFIRMATION MODAL ────────────────── */}
      {declineModalRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeclineModalRfq(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Decline RFQ {declineModalRfq.rfqNumber}?</h3>
              <button onClick={() => setDeclineModalRfq(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {declineFormError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: 10, borderRadius: 6, color: '#DC2626', fontSize: 12 }}>
                ⚠️ {declineFormError}
              </div>
            )}

            <form onSubmit={handleConfirmDeclineAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Select Reason for Declining *</label>
                <select value={declineReason} onChange={e => setDeclineReason(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFF' }}>
                  <option value="">-- Choose a Reason --</option>
                  <option value="Required delivery date not achievable">Required delivery date not achievable</option>
                  <option value="Production line at maximum capacity">Production line at maximum capacity</option>
                  <option value="Target price below manufacturing cost">Target price below manufacturing cost</option>
                  <option value="API / Raw material unavailable">API / Raw material unavailable</option>
                  <option value="Out of scope formulation">Out of scope formulation</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Additional Remarks (Optional)</label>
                <textarea rows={3} value={declineRemarks} onChange={e => setDeclineRemarks(e.target.value)} placeholder="Provide optional notes for buyer..." style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setDeclineModalRfq(null)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Confirm Decline</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: MESSAGE BUYER MODAL ──────────────────────────── */}
      {messageModalData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setMessageModalData(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={20} style={{ color: '#0F766E' }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Message Buyer</h3>
              </div>
              <button onClick={() => setMessageModalData(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Info Card */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>Buyer Name: <strong style={{ color: '#0F766E' }}>{messageModalData.buyerName}</strong></div>
              <div>RFQ Number: <strong style={{ fontFamily: 'monospace' }}>{messageModalData.rfqNumber}</strong></div>
              <div>Product: <strong>{messageModalData.productName}</strong></div>
            </div>

            {/* Message Textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Message Text</label>
              <textarea
                rows={4}
                placeholder="Type your message to the buyer regarding specifications, batch size, or lead time..."
                value={messageModalData.messageText}
                onChange={e => setMessageModalData(prev => prev ? { ...prev, messageText: e.target.value } : null)}
                style={{ width: '100%', padding: 12, fontSize: 13, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* Attachment & Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => alert('📄 Attachment capability: File attached to message.')}
                style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Paperclip size={14} /> Attach File
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setMessageModalData(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!messageModalData.messageText.trim()) {
                      alert('Please enter a message before sending.');
                      return;
                    }
                    setMessageSuccessToast(`✔ Message sent to ${messageModalData.buyerName} regarding ${messageModalData.productName}!`);
                    setMessageModalData(null);
                    setTimeout(() => setMessageSuccessToast(null), 4000);
                  }}
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Success Notification ── */}
      {messageSuccessToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10030, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 20px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, color: '#166534' }}>
          <CheckCircle2 size={18} style={{ color: '#16A34A' }} />
          <span>{messageSuccessToast}</span>
        </div>
      )}

    </div>
  );
};
