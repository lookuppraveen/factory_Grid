import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote, Manufacturer } from '../../types';
import { CustomerQuotationModule } from './CustomerQuotationModule';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  Tag, Search, Filter, CheckCircle2, Clock, DollarSign, ArrowRight,
  ShieldCheck, Star, Sparkles, TrendingDown, Zap, Award, Check, AlertTriangle,
  FileText, Download, Eye, Send, X, Building2, AlertCircle, Layers, ChevronRight, ThumbsUp,
  MessageSquare, RefreshCw, MapPin, Truck, ExternalLink, HelpCircle
} from 'lucide-react';

export const BuyerQuoteComparisonModule: React.FC = () => {
  const {
    rfqs, quotes, manufacturers, declinedRfqs, selectQuoteAndCreateOrder,
    negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
    setActiveTab, addAuditLog, currentRole, getApplicableMargin, platformFeeConfig
  } = useApp();

  // Navigation View Modes: 'LIST' (Overview list of RFQs) | 'MATRIX' (Product-wise matrix) | 'CONSOLIDATED' (Merged customer quote)
  const [viewMode, setViewMode] = useState<'LIST' | 'MATRIX' | 'CONSOLIDATED'>('LIST');
  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('CARD');
  const [selectedRfqId, setSelectedRfqId] = useState<string>(rfqs[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // UI Drawer & Modal States
  const [showAiCompareDrawer, setShowAiCompareDrawer] = useState(false);
  const [profileDrawerMfgId, setProfileDrawerMfgId] = useState<string | null>(null);
  const [hoveredMfgId, setHoveredMfgId] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Message Manufacturer Modal State
  const [messageModalContext, setMessageModalContext] = useState<{
    rfqId: string;
    rfqNumber: string;
    lineId: string;
    productName: string;
    lineQty: number;
    mfgId: string;
    mfgName: string;
    currentUnitPrice: number;
    currentLeadTime: number;
    currentMoq: number;
  } | null>(null);
  const [messageText, setMessageText] = useState('');

  const activeRfq = useMemo(() => {
    return rfqs.find(r => r.id === selectedRfqId) || rfqs[0];
  }, [rfqs, selectedRfqId]);

  // Selected Manufacturer per RFQ Product Line: rfqLineId -> Selection Detail Object
  const [lineSelections, setLineSelections] = useState<Record<string, {
    mfgId: string;
    mfgName: string;
    unitPrice: number;
    leadTimeDays: number;
    moq: number;
  }>>({});

  // Reset/Initialize line selections when active RFQ changes (auto-allocate FactoryGrid Direct for Generic RFQs)
  useEffect(() => {
    if (activeRfq) {
      if (activeRfq.isGeneric) {
        const autoSels: Record<string, {
          mfgId: string;
          mfgName: string;
          unitPrice: number;
          leadTimeDays: number;
          moq: number;
        }> = {};
        activeRfq.lines.forEach(line => {
          const matchedQuote = quotes.find(q => q.rfqId === activeRfq.id || q.rfqNumber === activeRfq.rfqNumber);
          const matchedQuoteLine = matchedQuote?.quoteLines?.find(ql => ql.rfqLineId === line.id || ql.productName === line.productName);
          const uPrice = matchedQuoteLine?.buyerUnitPrice ?? (matchedQuoteLine?.calculatedFinalPrice ?? (matchedQuoteLine?.unitPrice ?? (line.internalPrice || line.targetPrice || 4.20)));

          autoSels[line.id] = {
            mfgId: 'mfg_factorygrid',
            mfgName: 'FactoryGrid Direct (Generic Supply)',
            unitPrice: uPrice,
            leadTimeDays: 7,
            moq: 1000
          };
        });
        setLineSelections(autoSels);
      } else {
        setLineSelections({});
      }
    }
  }, [activeRfq?.id, activeRfq?.isGeneric, quotes]);

  // Handle line selection
  const handleSelectLineManufacturer = (
    lineId: string,
    mfgId: string,
    mfgName: string,
    unitPrice: number,
    leadTimeDays: number,
    moq: number
  ) => {
    setLineSelections(prev => ({
      ...prev,
      [lineId]: {
        mfgId,
        mfgName,
        unitPrice,
        leadTimeDays,
        moq
      }
    }));
  };

  // Quotes Calculator & Revision Sync with Delivery Terms
  // Priority: (1) Real submitted quotes from context, (2) Static demo fallback
    const getQuotesForLine = (lineId: string, lineTargetPrice: number, lineQty: number, lineProductName: string) => {
    if (!activeRfq) return [];

    const rfqDeclined = (declinedRfqs && declinedRfqs[activeRfq.id]) || [];

    type SupplierEntry = {
      id: string; name: string; code: string; baseP: number;
      lead: number; moq: number;
      preferred: boolean; deliveryTerms: string;
    };

    let activeSuppliersMap: Record<string, SupplierEntry> = {};

    if (activeRfq.isGeneric) {
      // Generic RFQs: Quotations routed strictly via FactoryGrid Direct based on Internal Price List
      const realSubmittedQuotes = quotes.filter(
        q => q.rfqId === activeRfq.id || q.rfqNumber === activeRfq.rfqNumber
      );

      if (realSubmittedQuotes.length > 0) {
        realSubmittedQuotes.forEach(q => {
          const matchedLine = q.quoteLines?.find(
            ql => ql.rfqLineId === lineId || ql.productName === lineProductName
          );
          if (!matchedLine || matchedLine.responseType === 'CANNOT_SUPPLY') return;

          const mId = q.manufacturerId || 'mfg_factorygrid';
          const buyerPrice = matchedLine.buyerUnitPrice ?? (matchedLine.calculatedFinalPrice ?? matchedLine.unitPrice);
          activeSuppliersMap[mId] = {
            id: mId,
            name: q.manufacturerName || 'FactoryGrid Direct (Generic Supply)',
            code: 'FG-DIRECT',
            baseP: buyerPrice,
            lead: matchedLine.leadTimeDays || 7,
            moq: matchedLine.moq || 1000,
            preferred: true,
            deliveryTerms: (matchedLine as any).deliveryTerms || (q as any).deliveryTerms || 'Direct Dispatch from FactoryGrid Hub'
          };
        });
      } else {
        // Direct fallback if line has internalPrice or status is PRICED
        const lineObj = activeRfq.lines.find(l => l.id === lineId);
        if (lineObj?.internalPrice || activeRfq.genericStatus === 'PRICED') {
          const unitPrice = lineObj?.internalPrice || lineTargetPrice || 4.20;
          activeSuppliersMap['mfg_factorygrid'] = {
            id: 'mfg_factorygrid',
            name: 'FactoryGrid Direct (Generic Supply)',
            code: 'FG-DIRECT',
            baseP: unitPrice,
            lead: 7,
            moq: 1000,
            preferred: true,
            deliveryTerms: 'Direct Dispatch from FactoryGrid Hub'
          };
        }
      }
    } else {
      // Branded RFQs: Baseline 3 competing manufacturer quotes per RFQ line with realistic distinct values
      const baselineList: SupplierEntry[] = [
        {
          id: 'm1',
          name: 'SunBio LifeSciences Ltd.',
          code: 'SUN-PHARM',
          baseP: Math.round(lineTargetPrice * 0.95 * 100) / 100,
          lead: 14,
          moq: 1000,
          preferred: true,
          deliveryTerms: 'Ex-Factory Hyderabad'
        },
        {
          id: 'm2',
          name: 'Cipla Partner Formulations Ltd.',
          code: 'CIPLA-MFG',
          baseP: Math.round(lineTargetPrice * 0.89 * 100) / 100,
          lead: 10,
          moq: 2000,
          preferred: false,
          deliveryTerms: 'Cold-Chain Fleet Vapi'
        },
        {
          id: 'm3',
          name: 'BioCure Healthcare Labs',
          code: 'BIOCURE-LABS',
          baseP: Math.round(lineTargetPrice * 1.02 * 100) / 100,
          lead: 7,
          moq: 500,
          preferred: false,
          deliveryTerms: 'Door Delivery CIF'
        }
      ];

      baselineList.forEach(s => { activeSuppliersMap[s.id] = s; });

      // Overlay any submitted quotes from context state
      const realSubmittedQuotes = quotes.filter(
        q => q.rfqId === activeRfq.id || q.rfqNumber === activeRfq.rfqNumber
      );

      realSubmittedQuotes.forEach(q => {
        const matchedLine = q.quoteLines?.find(
          ql => ql.rfqLineId === lineId || ql.productName === lineProductName
        );
        if (!matchedLine || matchedLine.responseType === 'CANNOT_SUPPLY') return;

        const mId = q.manufacturerId || ('m_' + q.manufacturerName?.replace(/[^a-zA-Z0-9]/g, ''));
        const buyerPrice = matchedLine.buyerUnitPrice ?? (matchedLine.unitPrice ? Math.round(matchedLine.unitPrice * (1 + (matchedLine.marginPercent || 10) / 100) * 100) / 100 : matchedLine.unitPrice);
        activeSuppliersMap[mId] = {
          id: mId,
          name: q.manufacturerName || 'Contract Manufacturer',
          code: (q.manufacturerName || mId).substring(0, 8).toUpperCase().replace(/\s/g, '-'),
          baseP: buyerPrice,
          lead: matchedLine.leadTimeDays || 14,
          moq: matchedLine.moq || 1000,
          preferred: q.manufacturerName?.toLowerCase().includes('sunbio') || false,
          deliveryTerms: (matchedLine as any).deliveryTerms || (q as any).deliveryTerms || 'Ex-Factory / As Per Agreement'
        };
      });
    }

    let activeSuppliers = Object.values(activeSuppliersMap).filter(s => {
      const isDec = rfqDeclined.some(d => d.manufacturerId === s.id || d.manufacturerName?.includes(s.name));
      return !isDec;
    });

    if (activeSuppliers.length === 0) return [];

    const activeLineObj = activeRfq.lines.find(l => l.id === lineId);
    const feeRate = platformFeeConfig?.feeValue ?? 2.0;

    const calculatedQuotes = activeSuppliers.map(s => {
      const threadKey = `${activeRfq.id}_${lineId}_${s.id}`;
      const rev = revisedQuotes ? revisedQuotes[threadKey] : undefined;

      const basePrice = Math.round(s.baseP * 100) / 100;
      const marginRes = getApplicableMargin(activeLineObj?.productId, s.id);

      let marginAmount = 0;
      let marginLabel = '';
      if (marginRes.marginType === 'FIXED_RATE') {
        marginAmount = marginRes.marginRate ?? marginRes.marginValue;
        marginLabel = `₹${marginAmount.toFixed(2)}`;
      } else {
        const pct = marginRes.marginPercentage;
        marginAmount = Math.round((basePrice * (pct / 100)) * 100) / 100;
        marginLabel = `${pct}%`;
      }

      // Platform Fee: strictly separate line item
      const platformFee = Math.round(((basePrice + marginAmount) * (feeRate / 100)) * 100) / 100;
      const commercialPrice = Math.round((basePrice + marginAmount + platformFee) * 100) / 100;

      const origUnitPrice = commercialPrice;
      const origLead = s.lead;
      const origMoq = s.moq;

      const uPrice = rev ? rev.unitPrice : origUnitPrice;
      const leadDays = rev ? rev.leadTimeDays : origLead;
      const moqVal = rev ? rev.moq : origMoq;

      const totalLineCost = Math.round(uPrice * lineQty);

      return {
        mfgId: s.id,
        mfgName: s.name,
        mfgCode: s.code,
        basePrice,
        marginAmount,
        marginLabel,
        marginType: marginRes.marginType,
        platformFee,
        commercialPrice,
        unitPrice: uPrice,
        totalLineCost,
        leadTimeDays: leadDays,
        moq: moqVal,
        deliveryTerms: s.deliveryTerms,
        preferred: s.preferred,
        isMoqCompliant: lineQty >= moqVal,
        isRevised: !!rev,
        revisedAt: rev?.revisedAt,
        origLeadTime: origLead,
        origUnitPrice,
        threadKey
      };
    });

    // Smart Evaluation Tag Calculations (Strictly 1 lowest price and 1 fastest delivery)
    let lowestPriceVal = Infinity;
    let fastestLeadVal = Infinity;
    calculatedQuotes.forEach(q => {
      if (q.unitPrice < lowestPriceVal) lowestPriceVal = q.unitPrice;
      if (q.leadTimeDays < fastestLeadVal) fastestLeadVal = q.leadTimeDays;
    });

    return calculatedQuotes.map(q => ({
      ...q,
      isLowestPrice: q.unitPrice === lowestPriceVal,
      isFastestDelivery: q.leadTimeDays === fastestLeadVal
    }));
  };

  // Selection Progress Stats for active RFQ
  const selectionStats = useMemo(() => {
    if (!activeRfq) return { totalLines: 0, selectedCount: 0, isComplete: false };
    const totalLines = activeRfq.lines.length;
    const selectedCount = activeRfq.lines.filter(l => !!lineSelections[l.id]).length;
    return {
      totalLines,
      selectedCount,
      isComplete: selectedCount === totalLines && totalLines > 0
    };
  }, [activeRfq, lineSelections]);

  // List of RFQs ready for buyer comparison (must be top-level hook before early returns)
  const readyRfqs = useMemo(() => {
    return rfqs.filter(r => {
      const hasQuotes = quotes.some(q => q.rfqId === r.id || q.rfqNumber === r.rfqNumber);
      const sUpper = (r.status || '').toUpperCase();
      const isEligible = sUpper === 'QUOTED' || sUpper === 'PRICING IN PROGRESS' || sUpper === 'SUBMITTED' || hasQuotes;

      const matchesSearch = !searchTerm.trim() ||
        r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lines.some(l => l.productName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' ||
        sUpper === statusFilter.toUpperCase() ||
        (statusFilter === 'Quoted' && sUpper === 'QUOTED');

      return isEligible && matchesSearch && matchesStatus;
    });
  }, [rfqs, quotes, searchTerm, statusFilter]);

  // Open Message Manufacturer Modal
  const handleOpenMessageModal = (
    rfqId: string,
    rfqNumber: string,
    lineId: string,
    productName: string,
    lineQty: number,
    mfgId: string,
    mfgName: string,
    currentUnitPrice: number,
    currentLeadTime: number,
    currentMoq: number
  ) => {
    setMessageModalContext({
      rfqId,
      rfqNumber,
      lineId,
      productName,
      lineQty,
      mfgId,
      mfgName,
      currentUnitPrice,
      currentLeadTime,
      currentMoq
    });
    setMessageText('');
  };

  // Handle Send Negotiation Message
  const handleSendMessage = () => {
    if (!messageModalContext || !messageText.trim()) return;
    const threadKey = `${messageModalContext.rfqId}_${messageModalContext.lineId}_${messageModalContext.mfgId}`;
    sendNegotiationMessage(threadKey, messageText.trim(), 'BUYER', 'Apex Pharma (Buyer)');
    addAuditLog('RFQ Engine', `Sent inquiry message to manufacturer ${messageModalContext.mfgName} for RFQ ${messageModalContext.rfqNumber}.`);

    setSuccessNotification(`Message successfully sent to ${messageModalContext.mfgName}.`);
    setMessageText('');
    setMessageModalContext(null);
  };

  // Open Consolidated Quote Handler
  const handleOpenConsolidatedQuote = () => {
    if (!selectionStats.isComplete) {
      alert(`Please select a manufacturer for all RFQ product lines before continuing.\n\nCurrent progress: ${selectionStats.selectedCount} / ${selectionStats.totalLines} lines selected.`);
      return;
    }
    setViewMode('CONSOLIDATED');
  };

  // Quick Message Helper
  const applyQuickMessage = (msg: string) => {
    setMessageText(msg);
  };

  // Render Consolidated Quote View
  if (viewMode === 'CONSOLIDATED' && activeRfq) {
    const formattedSelections: Record<string, { mfgId: string; mfgName: string; price: number }> = {};
    activeRfq.lines.forEach(line => {
      const sel = lineSelections[line.id];
      if (sel) {
        formattedSelections[line.id] = {
          mfgId: sel.mfgId,
          mfgName: sel.mfgName,
          price: sel.unitPrice
        };
      } else if (activeRfq.isGeneric || line.productType === 'GENERIC') {
        const matchedQuote = quotes.find(q => q.rfqId === activeRfq.id || q.rfqNumber === activeRfq.rfqNumber);
        const matchedQuoteLine = matchedQuote?.quoteLines?.find(ql => ql.rfqLineId === line.id || ql.productName === line.productName);
        const uPrice = matchedQuoteLine?.buyerUnitPrice ?? (matchedQuoteLine?.calculatedFinalPrice ?? (matchedQuoteLine?.unitPrice ?? (line.internalPrice || line.targetPrice || 4.20)));

        formattedSelections[line.id] = {
          mfgId: 'mfg_factorygrid',
          mfgName: 'FactoryGrid Direct (Generic Supply)',
          price: uPrice
        };
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '12px 20px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <button
            onClick={() => setViewMode('MATRIX')}
            style={{ padding: '7px 14px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ← Back to Quote Comparison Matrix
          </button>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E' }}>
            Consolidated Customer Quote Preview ({activeRfq.rfqNumber})
          </span>
        </div>

        <CustomerQuotationModule
          rfq={activeRfq}
          lineSelections={formattedSelections}
          onApproved={() => setActiveTab('orders')}
        />
      </div>
    );
  }

  // Active Manufacturer Object for Profile Drawer
  const activeProfileMfg = profileDrawerMfgId
    ? manufacturers.find(m => m.id === profileDrawerMfgId) || {
      id: profileDrawerMfgId,
      companyName: profileDrawerMfgId === 'm1' ? 'SunBio LifeSciences Ltd.' : profileDrawerMfgId === 'm2' ? 'ABC Pharma Formulations Ltd.' : 'XYZ Pharma Labs Ltd.',
      mfgLicenseNo: profileDrawerMfgId === 'm1' ? 'Form 25/28 (TS/HYD/2024/88921)' : 'Form 25/28 (HP/BDD/2023/1109)',
      gstin: profileDrawerMfgId === 'm1' ? '36AAACS9981A1Z2' : '02AAACB1102B1Z8',
      city: profileDrawerMfgId === 'm1' ? 'Hyderabad' : 'Baddi',
      state: profileDrawerMfgId === 'm1' ? 'Telangana' : 'Himachal Pradesh',
      complianceStatus: 'VERIFIED',
      rating: 4.9,
      activeSubOrders: 3,
      contactPerson: 'Dr. R.K. Sharma',
      email: 'sales@sunbiolabs.com',
      phone: '+91 98490 11234'
    }
    : null;

  // Render Product-Wise Comparison Matrix View
  if (viewMode === 'MATRIX' && activeRfq) {
    const rfqDeclined = (declinedRfqs && declinedRfqs[activeRfq.id]) || [];
    const realQuotesForRfq = quotes.filter(
      q => q.rfqId === activeRfq.id || q.rfqNumber === activeRfq.rfqNumber
    );
    const totalResponsesCount = activeRfq.isGeneric
      ? (realQuotesForRfq.length > 0 || activeRfq.genericStatus === 'PRICED' ? 1 : 0)
      : Math.max(3 - rfqDeclined.length, 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

        {/* ── Header Bar ── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <button onClick={() => setViewMode('LIST')} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                ← All RFQs
              </button>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{activeRfq.rfqNumber}</span>
              {activeRfq.isGeneric && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontSize: 10.5, fontWeight: 800 }}>
                  🧪 GENERIC MEDICINE
                </span>
              )}
              {activeRfq.customerClassification === 'SPECIAL_PARTY' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10.5, fontWeight: 800 }}>
                  <Star size={11} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                </span>
              )}
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: selectionStats.isComplete ? '#DCFCE7' : '#EFF6FF', color: selectionStats.isComplete ? '#15803D' : '#1D4ED8', border: selectionStats.isComplete ? '1px solid #86EFAC' : '1px solid #BFDBFE' }}>
                {selectionStats.isComplete ? 'SELECTION COMPLETE' : 'READY FOR COMPARISON'}
              </span>
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              QUOTE COMPARISON MATRIX
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              {activeRfq.isGeneric
                ? `Review FactoryGrid Direct generic medicine internal quotation for ${activeRfq.customerName}.`
                : `Compare manufacturer quotations, delivery terms, AI trade-offs, and select the best supplier for each line (${activeRfq.customerName}).`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* AI COMPARE BUTTON */}
            <button
              onClick={() => setShowAiCompareDrawer(true)}
              style={{
                padding: '9px 16px', borderRadius: 8,
                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
              }}
            >
              <Sparkles size={16} /> ✨ AI Compare
            </button>

            <button
              disabled={!selectionStats.isComplete}
              onClick={handleOpenConsolidatedQuote}
              style={{
                padding: '9px 18px', borderRadius: 8,
                background: selectionStats.isComplete ? '#0F766E' : '#E2E8F0',
                color: selectionStats.isComplete ? '#FFFFFF' : '#94A3B8',
                border: 'none', fontWeight: 700, fontSize: 12.5, cursor: selectionStats.isComplete ? 'pointer' : 'not-allowed',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: selectionStats.isComplete ? '0 2px 4px rgba(15,118,110,0.2)' : 'none'
              }}
              title={!selectionStats.isComplete ? 'Please select a manufacturer for all RFQ product lines before continuing.' : 'Generate Consolidated Customer Quotation'}
            >
              <FileText size={16} /> Generate Consolidated Quote →
            </button>
          </div>
        </div>

        {/* ── Generic Medicine Direct Fulfillment Banner ── */}
        {activeRfq.isGeneric && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🧪
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                  Direct Generic Supply — FactoryGrid Direct Quotation
                </div>
                <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
                  Generic medicine requisition identified by active molecule. Priced directly from FactoryGrid internal price list; no external supplier floating or brand certificate required.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
              INTERNAL PRICE LIST FULFILLMENT
            </span>
          </div>
        )}

        {/* ── Success Notification Banner ── */}
        {successNotification && (
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#166534' }}>
              <CheckCircle2 size={18} /> {successNotification}
            </div>
            <button onClick={() => setSuccessNotification(null)} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* ── Summary Metric Cards Bar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Products</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{activeRfq.lines.length}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Product lines to allocate</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer Responses</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{totalResponsesCount}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Quotations received</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Lines Selected</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: selectionStats.isComplete ? '#16A34A' : '#D97706', fontFamily: 'monospace', marginTop: 4 }}>
              {selectionStats.selectedCount} / {selectionStats.totalLines}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              {selectionStats.isComplete ? 'All lines allocated ✓' : 'Allocations in progress'}
            </div>
          </div>
        </div>

        {/* ── PRODUCT-LINE BASED COMPARISON TABLES ── */}
        {activeRfq.lines.map((line, lineIndex) => {
          const lineQuotes = getQuotesForLine(line.id, line.targetPrice || 12.00, line.quantity, line.productName);
          const selectedSupplier = lineSelections[line.id];
          const lowestQuote = lineQuotes.find(q => q.isLowestPrice);
          const fastestQuote = lineQuotes.find(q => q.isFastestDelivery);
          const preferredQuote = lineQuotes.find(q => q.preferred);

          return (
            <div key={line.id} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Product Line Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', background: '#F0FDFA', padding: '3px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                      LINE #{String(lineIndex + 1).padStart(2, '0')}
                    </span>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                      {line.productName}
                    </h2>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Quantity: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()} {line.uom || 'Units'}</strong></span>
                    <span>Dosage: <strong>{line.dosageForm || 'Tablet'}</strong></span>
                    <span>Target Price: <strong style={{ color: '#0F766E' }}>₹{(line.targetPrice || 12.00).toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* Selected Supplier Status Badge */}
                <div>
                  {selectedSupplier ? (
                    <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Selected Manufacturer</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>{selectedSupplier.mfgName} (₹{selectedSupplier.unitPrice.toFixed(2)}/unit)</div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '6px 12px', borderRadius: 6, border: '1px solid #FDE68A' }}>
                      ⚠ Selection Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Comparison Table */}
              {lineQuotes.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B' }}>
                  <Clock size={28} style={{ color: '#D97706', margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Awaiting Platform Internal Pricing</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Admin is currently reviewing the internal price list for this generic molecule. The direct quote will appear here once submitted from the Admin Pricing Desk.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                    <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BASE PRICE</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E' }}>PRODUCT MARGIN</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#D97706' }}>PLATFORM FEE ({platformFeeConfig?.feeValue ?? 2.0}%)</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A' }}>COMMERCIAL PRICE</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>TOTAL LINE COST</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>LEAD TIME</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MOQ</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', background: '#F0FDFA' }}>DELIVERY TERMS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>EVALUATION TAGS</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineQuotes.map((q) => {
                      const isSelected = selectedSupplier?.mfgId === q.mfgId;
                      const threadMsgs = (negotiationThreads && negotiationThreads[q.threadKey]) || [];
                      const msgCount = threadMsgs.length;
                      const mfgObj = manufacturers.find(m => m.id === q.mfgId);

                      return (
                        <tr
                          key={q.mfgId}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: isSelected ? '#F0FDF4' : q.isRevised ? '#FEFCE8' : '#FFFFFF',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* 1. MANUFACTURER NAME WITH HOVER PREVIEW & PROFILE DRAWER TRIGGER */}
                          <td style={{ padding: '14px', position: 'relative' }}>
                            <div style={{ fontWeight: 800, color: isSelected ? '#15803D' : '#0F172A', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span
                                onClick={() => setProfileDrawerMfgId(q.mfgId)}
                                onMouseEnter={() => setHoveredMfgId(q.mfgId)}
                                onMouseLeave={() => setHoveredMfgId(null)}
                                style={{ cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#CBD5E1', textUnderlineOffset: 3 }}
                                title="Click to view full manufacturer profile drawer"
                              >
                                {q.mfgName}
                              </span>

                              {q.isRevised && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047' }}>
                                  REVISED
                                </span>
                              )}
                            </div>

                            {/* HOVER PREVIEW CARD TOOLTIP */}
                            {hoveredMfgId === q.mfgId && (
                              <div style={{ position: 'absolute', top: '90%', left: 14, zIndex: 100, width: 270, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 14, boxShadow: '0 12px 30px rgba(15,23,42,0.18)', fontSize: 11.5 }}>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>{mfgObj?.companyName || q.mfgName}</div>
                                <div style={{ color: '#16A34A', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <CheckCircle2 size={13} /> Verified Contract Manufacturer
                                </div>
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, color: '#475569' }}>
                                  <div>Location: <strong>{mfgObj?.city || 'Hyderabad'}, {mfgObj?.state || 'Telangana'}</strong></div>
                                  <div>License: <strong>{mfgObj?.mfgLicenseNo || 'Form 25/28 Verified'}</strong></div>
                                  <div>GSTIN: <strong>{mfgObj?.gstin || '36AAACS9981A1Z2'}</strong></div>
                                  <div>Compliance: <strong style={{ color: '#0F766E' }}>WHO-GMP Valid</strong></div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setProfileDrawerMfgId(q.mfgId); }}
                                  style={{ marginTop: 10, width: '100%', padding: '6px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                                >
                                  View Full Profile →
                                </button>
                              </div>
                            )}

                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>{q.mfgCode}</div>
                            {msgCount > 0 && (
                              <div style={{ fontSize: 10.5, color: '#0F766E', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MessageSquare size={12} /> {msgCount} message{msgCount > 1 ? 's' : ''} in thread
                              </div>
                            )}
                          </td>

                          {/* 2. BASE PRICE */}
                          <td style={{ padding: '14px 12px', color: '#475569', fontFamily: 'monospace' }}>
                            ₹{q.basePrice.toFixed(2)}
                          </td>

                          {/* 3. PRODUCT MARGIN */}
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                              background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1'
                            }}>
                              {q.marginLabel}
                            </span>
                          </td>

                          {/* 4. PLATFORM FEE */}
                          <td style={{ padding: '14px 12px', color: '#B45309', fontWeight: 700, fontFamily: 'monospace' }}>
                            +₹{q.platformFee.toFixed(2)}
                          </td>

                          {/* 5. COMMERCIAL PRICE */}
                          <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                            ₹{q.commercialPrice.toFixed(2)}
                            {q.isRevised && q.origUnitPrice !== q.unitPrice && (
                              <div style={{ fontSize: 10, color: '#94A3B8', textDecoration: 'line-through' }}>₹{q.origUnitPrice.toFixed(2)}</div>
                            )}
                          </td>

                          {/* 6. TOTAL LINE COST */}
                          <td style={{ padding: '14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                            ₹{q.totalLineCost.toLocaleString('en-IN')}
                          </td>

                          {/* 7. LEAD TIME */}
                          <td style={{ padding: '14px', fontWeight: 700, color: q.isFastestDelivery ? '#1D4ED8' : '#334155' }}>
                            {q.leadTimeDays} Days
                          </td>

                          {/* 8. MOQ */}
                          <td style={{ padding: '14px', color: '#475569', fontWeight: 600 }}>
                            {q.moq.toLocaleString()} Units
                          </td>

                          {/* 9. DEDICATED DELIVERY TERMS COLUMN */}
                          <td style={{ padding: '14px', background: '#F0FDFA' }}>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F766E', background: '#FFFFFF', padding: '3px 8px', borderRadius: 4, border: '1px solid #99F6E4' }}>
                              {q.deliveryTerms}
                            </span>
                          </td>

                          {/* 10. EVALUATION TAGS */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {q.isLowestPrice && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                                  LOWEST PRICE
                                </span>
                              )}
                              {q.isFastestDelivery && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                  FASTEST DELIVERY
                                </span>
                              )}
                              {q.preferred && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#FAF5FF', color: '#7E22CE', border: '1px solid #E9D5FF' }}>
                                  PREFERRED VENDOR
                                </span>
                              )}
                              {q.isMoqCompliant && (
                                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                                  MOQ COMPLIANT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 11. ACTIONS (Select Supplier Only) */}
                          <td style={{ padding: '14px', textAlign: 'right', paddingRight: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {isSelected ? (
                                <span style={{ padding: '6px 12px', fontSize: 11.5, fontWeight: 800, borderRadius: 6, background: '#16A34A', color: '#FFF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  ✓ SELECTED
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSelectLineManufacturer(line.id, q.mfgId, q.mfgName, q.unitPrice, q.leadTimeDays, q.moq)}
                                  style={{ padding: '6px 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                                >
                                  Select
                                </button>
                              )}
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
          );
        })}

        
        {/* ── VERY BOTTOM PRIMARY ACTION: QUOTE BUTTON ── */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => {
              if (selectionStats.isComplete) {
                setViewMode('CONSOLIDATED');
              } else {
                alert(`Quote Action:\n\nPlease select a manufacturer quote for all product lines before continuing.\nCurrent progress: ${selectionStats.selectedCount} / ${selectionStats.totalLines} lines selected.`);
              }
            }}
            style={{
              padding: '12px 28px',
              borderRadius: 8,
              background: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            Quote
          </button>
        </div>

        {/* ── MODAL: MESSAGE MANUFACTURER ───────────────────────────── */}
        {messageModalContext && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setMessageModalContext(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={20} style={{ color: '#0F766E' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Message Manufacturer</h3>
                </div>
                <button onClick={() => setMessageModalContext(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>To: <strong style={{ color: '#0F766E' }}>{messageModalContext.mfgName}</strong></div>
                <div>RFQ Ref: <strong>{messageModalContext.rfqNumber}</strong> · Line: <strong>{messageModalContext.productName}</strong></div>
                <div>Quantity: <strong>{messageModalContext.lineQty.toLocaleString()} Units</strong></div>
              </div>

              {/* Suggested Quick Messages */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Suggested Quick Messages</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    "Please confirm availability.",
                    "Can you meet the required delivery date?",
                    "Please confirm MOQ.",
                    "Please provide your best commercial offer.",
                    "Please clarify delivery terms."
                  ].map((quick, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyQuickMessage(quick)}
                      style={{ padding: '4px 9px', borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    >
                      + {quick}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 4 }}>Message Content *</label>
                <textarea
                  rows={4}
                  placeholder="Enter your message or negotiation inquiry..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  style={{ width: '100%', padding: 10, border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6 }}>
                <button type="button" onClick={() => setMessageModalContext(null)} style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!messageText.trim()}
                  onClick={handleSendMessage}
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: messageText.trim() ? '#0F766E' : '#E2E8F0', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: messageText.trim() ? 'pointer' : 'not-allowed' }}
                >
                  Send Message →
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── SIDE DRAWER: ✨ AI QUOTE ASSISTANT ───────────────────── */}
        {showAiCompareDrawer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowAiCompareDrawer(false)}>
            <div onClick={e => e.stopPropagation()} style={{ width: 440, maxWidth: '100%', background: '#FFFFFF', height: '100%', padding: 24, boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} style={{ color: '#7C3AED' }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>AI Quote Assistant</h3>
                </div>
                <button onClick={() => setShowAiCompareDrawer(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #F3E8FF 0%, #E0E7FF 100%)', border: '1px solid #DDD6FE', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#6B21A8', textTransform: 'uppercase' }}>REAL-TIME COMPARISON ANALYSIS</div>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#4C1D95' }}>
                  "Here is a quick dynamic comparison based on quotes currently submitted for <strong>{activeRfq.rfqNumber}</strong>."
                </p>
              </div>

              {activeRfq.lines.map((ln, idx) => {
                const quotesList = getQuotesForLine(ln.id, ln.targetPrice || 12.00, ln.quantity, ln.productName);
                const lowest = quotesList.find(q => q.isLowestPrice);
                const fastest = quotesList.find(q => q.isFastestDelivery);
                const preferred = quotesList.find(q => q.preferred);

                return (
                  <div key={ln.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>
                      Line #{idx + 1}: {ln.productName}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                      <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', padding: '6px 10px', borderRadius: 6, color: '#15803D' }}>
                        💵 <strong>Lowest Price:</strong> {lowest?.mfgName} — <strong>₹{lowest?.unitPrice.toFixed(2)}/unit</strong>
                      </div>

                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 10px', borderRadius: 6, color: '#1D4ED8' }}>
                        ⚡ <strong>Fastest Delivery:</strong> {fastest?.mfgName} — <strong>{fastest?.leadTimeDays} days</strong>
                      </div>

                      <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', padding: '6px 10px', borderRadius: 6, color: '#0F766E' }}>
                        🚚 <strong>Delivery Terms:</strong> {lowest?.deliveryTerms} vs {fastest?.deliveryTerms}
                      </div>

                      <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', padding: '8px 10px', borderRadius: 6, color: '#6B21A8', marginTop: 4 }}>
                        🏆 <strong>AI Recommendation:</strong> <strong>{preferred?.mfgName || lowest?.mfgName}</strong>
                        <div style={{ fontSize: 11.5, color: '#7E22CE', marginTop: 2 }}>
                          Reason: Lowest evaluated price + preferred contract facility + MOQ compliant ({ln.quantity.toLocaleString()} units).
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ paddingTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAiCompareDrawer(false)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Close AI Assistant
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── RIGHT-SIDE SLIDE-OVER DRAWER: MANUFACTURER PROFILE ───── */}
        {profileDrawerMfgId && activeProfileMfg && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10030, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setProfileDrawerMfgId(null)}>
            <div onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '100%', background: '#FFFFFF', height: '100%', padding: 24, boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

              {/* Drawer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Verified Manufacturer Profile</div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>{activeProfileMfg.companyName}</h2>
                </div>
                <button onClick={() => setProfileDrawerMfgId(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              {/* Status Badge */}
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>WHO-GMP Verified Facility</div>
                  <div style={{ fontSize: 11.5, color: '#166534' }}>Active CDSCO Manufacturing License · Verified State Inspectorate</div>
                </div>
              </div>

              {/* COMPANY INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>COMPANY & REGULATORY DETAILS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div>Location: <strong>{activeProfileMfg.city}, {activeProfileMfg.state}</strong></div>
                  <div>Category: <strong>Pharma Formulation</strong></div>
                  <div>Drug License: <strong style={{ fontFamily: 'monospace' }}>{activeProfileMfg.mfgLicenseNo}</strong></div>
                  <div>GSTIN: <strong style={{ fontFamily: 'monospace' }}>{activeProfileMfg.gstin}</strong></div>
                  <div>Compliance Status: <strong style={{ color: '#16A34A' }}>Active / Verified</strong></div>
                  <div>Rating: <strong style={{ color: '#D97706' }}>⭐ 4.9 / 5.0</strong></div>
                </div>
              </div>

              {/* PERFORMANCE METRICS */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>BUSINESS PERFORMANCE TRACK RECORD</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
                  <div style={{ background: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E' }}>142</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Completed Orders</div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A' }}>98.6%</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>On-Time Delivery</div>
                  </div>
                  <div style={{ background: '#F1F5F9', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>{activeProfileMfg.activeSubOrders}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Active Sub-Orders</div>
                  </div>
                </div>
              </div>

              {/* ACTION */}
              <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setProfileDrawerMfgId(null)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // ── DEFAULT VIEWMODE: LIST OF RFQS FOR BUYER COMPARISON ──────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── Header ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>PROCUREMENT & SOURCING / QUOTE COMPARISON</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            {currentRole === 'ADMIN' ? 'QUOTE MONITOR' : 'QUOTE COMPARISON MATRIX'}
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            {currentRole === 'ADMIN'
              ? 'Monitor submitted manufacturer quotations, pricing spread and selection status across the platform.'
              : 'Review manufacturer submissions, compare pricing & delivery terms, and select optimal suppliers for order fulfillment.'}
          </p>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search by RFQ number, customer, product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Statuses ({rfqs.length})</option>
              <option value="Pricing In Progress">Pricing In Progress</option>
              <option value="Quoted">Quoted / Ready</option>
              <option value="Submitted">Submitted</option>
            </select>
          </div>

          <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
        </div>
      </div>

      {/* ── RFQ Comparison Records (Card View vs Table View) ── */}
      {displayMode === 'CARD' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {readyRfqs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', padding: 48, borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
              <Tag size={36} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No RFQs ready for comparison.</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                When manufacturers submit quotes against active RFQs, they will automatically appear here for evaluation.
              </div>
            </div>
          ) : (
            readyRfqs.map(rfq => {
              const rfqDeclined = (declinedRfqs && declinedRfqs[rfq.id]) || [];
              const realQuotesForRfq = quotes.filter(
                q => q.rfqId === rfq.id || q.rfqNumber === rfq.rfqNumber
              );
              const isPriced = realQuotesForRfq.length > 0 || rfq.genericStatus === 'PRICED';
              const activeResponseCountText = rfq.isGeneric
                ? (isPriced ? '1 Direct Platform Quote' : 'Pending Admin Pricing')
                : `${realQuotesForRfq.length > 0 ? realQuotesForRfq.length : Math.max(3 - rfqDeclined.length, 1)} Responses Received`;
              const isDeadlinePassed = new Date() > new Date(rfq.deadlineDate);

              return (
                <div
                  key={rfq.id}
                  style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0F766E'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</span>
                        {rfq.isGeneric && (
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                            GENERIC
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                        READY FOR COMPARISON
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 6px 0', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{rfq.customerName}</h3>
                      {rfq.customerClassification === 'SPECIAL_PARTY' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                          <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12.5, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                      <div>Product Lines: <strong style={{ color: '#0F172A' }}>{rfq.lines.length} Product Lines</strong></div>
                      <div>Quotations: <strong style={{ color: rfq.isGeneric && !isPriced ? '#D97706' : '#0F766E' }}>{activeResponseCountText}</strong></div>
                      <div>Deadline: <strong style={{ color: isDeadlinePassed ? '#DC2626' : '#D97706' }}>{rfq.deadlineDate} {isDeadlinePassed && '(Expired)'}</strong></div>
                    </div>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setSelectedRfqId(rfq.id);
                        setViewMode('MATRIX');
                      }}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {currentRole === 'ADMIN' ? 'View Details →' : 'Compare Quotes →'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ #</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CUSTOMER / BUYER</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT LINES</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RESPONSES</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DEADLINE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {readyRfqs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                    <Tag size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No RFQs ready for comparison.</div>
                  </td>
                </tr>
              ) : (
                readyRfqs.map(rfq => {
                  const rfqDeclined = (declinedRfqs && declinedRfqs[rfq.id]) || [];
                  const realQuotesForRfq = quotes.filter(
                    q => q.rfqId === rfq.id || q.rfqNumber === rfq.rfqNumber
                  );
                  const isPriced = realQuotesForRfq.length > 0 || rfq.genericStatus === 'PRICED';
                  const activeResponseCountText = rfq.isGeneric
                    ? (isPriced ? '1 Direct' : 'Pending Pricing')
                    : `${realQuotesForRfq.length > 0 ? realQuotesForRfq.length : Math.max(3 - rfqDeclined.length, 1)} Received`;
                  const isDeadlinePassed = new Date() > new Date(rfq.deadlineDate);

                  return (
                    <tr
                      key={rfq.id}
                      onClick={() => {
                        setSelectedRfqId(rfq.id);
                        setViewMode('MATRIX');
                      }}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{rfq.rfqNumber}</span>
                          {rfq.isGeneric && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                              GENERIC
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{rfq.customerName}</span>
                          {rfq.customerClassification === 'SPECIAL_PARTY' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', fontSize: 10, fontWeight: 800 }}>
                              <Star size={10} fill="#0E7490" color="#0E7490" /> SPECIAL PARTY
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>
                        {rfq.lines.length} {rfq.lines.length === 1 ? 'Product Line' : 'Product Lines'}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: rfq.isGeneric && !isPriced ? '#D97706' : '#0F766E' }}>
                        {activeResponseCountText}
                      </td>
                      <td style={{ padding: '12px 14px', color: isDeadlinePassed ? '#DC2626' : '#64748B', fontWeight: isDeadlinePassed ? 700 : 500 }}>
                        {rfq.deadlineDate} {isDeadlinePassed && '(Expired)'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          READY FOR COMPARISON
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                        <button
                          onClick={() => {
                            setSelectedRfqId(rfq.id);
                            setViewMode('MATRIX');
                          }}
                          style={{ padding: '6px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {currentRole === 'ADMIN' ? 'View Details →' : 'Compare Quotes →'}
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

    

    </div>
  );
};
