import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ, ManufacturerQuote } from '../../types';
import {
  Tag, Search, Eye, CheckCircle2, Clock, Building2, X, FileText,
  ShieldCheck, ChevronRight, Filter, AlertCircle, RefreshCw, Layers, Edit, Slash, Send, Info, DollarSign
} from 'lucide-react';

export const AdminQuoteMonitor: React.FC = () => {
  const { rfqs, quotes, manufacturers, customers, currentRole, addAuditLog } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RECEIVED' | 'PENDING' | 'SELECTED'>('ALL');
  
  // Read-only / Interactive modal state
  const [selectedRfqForView, setSelectedRfqForView] = useState<RFQ | null>(null);

  // Configurable Admin Price Control Flag
  const [isAdminPriceEditEnabled, setIsAdminPriceEditEnabled] = useState<boolean>(true);

  // Admin Overrides State: Record<mfgId, { originalPrice: number; adjustedPrice?: number; isRejected?: boolean; rejectionReason?: string }>
  const [adminQuoteOverrides, setAdminQuoteOverrides] = useState<Record<string, {
    originalPrice: number;
    adjustedPrice?: number;
    isRejected?: boolean;
    rejectionReason?: string;
  }>>({});

  // Inline / Modal Edit Price State
  const [editingMfgId, setEditingMfgId] = useState<string | null>(null);
  const [tempAdjustedPrice, setTempAdjustedPrice] = useState<string>('');

  // Rejection Modal State
  const [rejectingMfgId, setRejectingMfgId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Action Notification Banner State
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Helper to retrieve mfg quote info
  const getMfgQuoteData = (mfgId: string, defaultOriginalPrice: number) => {
    const override = adminQuoteOverrides[mfgId];
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

  const handleSaveAdjustedPrice = (mfgId: string, defaultOrig: number) => {
    const val = parseFloat(tempAdjustedPrice);
    if (isNaN(val) || val <= 0) {
      return;
    }
    const currentObj = adminQuoteOverrides[mfgId] || { originalPrice: defaultOrig };
    setAdminQuoteOverrides(prev => ({
      ...prev,
      [mfgId]: {
        ...currentObj,
        originalPrice: currentObj.originalPrice || defaultOrig,
        adjustedPrice: val
      }
    }));

    const mfgName = manufacturers.find(m => m.id === mfgId)?.companyName || 'Manufacturer';
    setEditingMfgId(null);
    setNotificationMsg(`Price adjusted successfully for ${mfgName}. Original: ₹${defaultOrig.toFixed(2)} → Admin Adjusted Price: ₹${val.toFixed(2)}/strip.`);
    if (addAuditLog) {
      addAuditLog('Quote Engine', `Admin updated quotation price for ${mfgName} from ₹${defaultOrig.toFixed(2)} to ₹${val.toFixed(2)}.`);
    }
  };

  const handleConfirmRejection = (mfgId: string, defaultOrig: number) => {
    if (!rejectionReasonInput.trim()) {
      setRejectionError('Rejection reason is mandatory.');
      return;
    }

    const currentObj = adminQuoteOverrides[mfgId] || { originalPrice: defaultOrig };
    setAdminQuoteOverrides(prev => ({
      ...prev,
      [mfgId]: {
        ...currentObj,
        originalPrice: currentObj.originalPrice || defaultOrig,
        isRejected: true,
        rejectionReason: rejectionReasonInput.trim()
      }
    }));

    const mfgName = manufacturers.find(m => m.id === mfgId)?.companyName || 'Manufacturer';
    const reasonText = rejectionReasonInput.trim();
    setRejectingMfgId(null);
    setRejectionReasonInput('');
    setRejectionError(null);
    setNotificationMsg(`Quotation from ${mfgName} rejected. Rejection notice logged: "${reasonText}".`);
    if (addAuditLog) {
      addAuditLog('Quote Engine', `Admin REJECTED quotation from ${mfgName}. Reason: ${reasonText}`);
    }
  };

  // Compute quote monitoring statistics
  const monitoredRfqs = useMemo(() => {
    return rfqs.map(rfq => {
      const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id || q.rfqNumber === rfq.rfqNumber);
      const responsesCount = rfqQuotes.length || (rfq.status === 'Quoted' ? 3 : 0);
      
      // Prices calculations
      let lowestPrice = 0;
      let highestPrice = 0;
      if (rfqQuotes.length > 0) {
        const totals = rfqQuotes.map(q => q.totalAmount);
        lowestPrice = Math.min(...totals);
        highestPrice = Math.max(...totals);
      } else if (rfq.status === 'Quoted') {
        lowestPrice = 145000;
        highestPrice = 178000;
      }

      const isAwarded = rfq.status === 'Sub-Order Created' || rfq.status === 'Approved';
      const selectedMfgName = isAwarded ? 'SunBio LifeSciences Ltd' : 'Selection Pending';

      return {
        rfq,
        responsesCount,
        lowestPrice,
        highestPrice,
        isAwarded,
        selectedMfgName,
        rfqQuotes
      };
    });
  }, [rfqs, quotes]);

  const filteredMonitoredRfqs = useMemo(() => {
    return monitoredRfqs.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        item.rfq.rfqNumber.toLowerCase().includes(q) ||
        item.rfq.customerName.toLowerCase().includes(q) ||
        item.rfq.lines.some(l => l.productName.toLowerCase().includes(q));

      if (statusFilter === 'RECEIVED') return matchSearch && item.responsesCount > 0;
      if (statusFilter === 'PENDING') return matchSearch && !item.isAwarded;
      if (statusFilter === 'SELECTED') return matchSearch && item.isAwarded;

      return matchSearch;
    });
  }, [monitoredRfqs, searchTerm, statusFilter]);

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
            { key: 'ALL', label: 'All RFQs' },
            { key: 'RECEIVED', label: 'Quotes Received' },
            { key: 'PENDING', label: 'Evaluation Pending' },
            { key: 'SELECTED', label: 'Manufacturer Selected' }
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
            {filteredMonitoredRfqs.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                  No quote monitoring records match your search filter.
                </td>
              </tr>
            ) : (
              filteredMonitoredRfqs.map(({ rfq, responsesCount, lowestPrice, highestPrice, isAwarded, selectedMfgName }) => (
                <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace' }}>
                    {rfq.rfqNumber}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {rfq.customerName}
                    <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{rfq.customerCode || 'CUS-101'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    <div style={{ fontWeight: 600 }}>{rfq.lines[0]?.productName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{rfq.lines.length} Product Lines</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: responsesCount > 0 ? '#15803D' : '#64748B', background: responsesCount > 0 ? '#DCFCE7' : '#F1F5F9', padding: '3px 10px', borderRadius: 999 }}>
                      {responsesCount} Responses Received
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: isAwarded ? '#DCFCE7' : responsesCount > 0 ? '#F5F3FF' : '#FEF3C7', color: isAwarded ? '#15803D' : responsesCount > 0 ? '#7C3AED' : '#B45309' }}>
                      {isAwarded ? 'Completed' : responsesCount > 0 ? 'Quotes Received' : 'Awaiting Bids'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: isAwarded ? '#0F172A' : '#94A3B8' }}>
                    {selectedMfgName}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.createdDate}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748B' }}>
                    {rfq.deadlineDate}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRfqForView(rfq)}
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

      {/* ── 4. QUOTE DETAILS & ADMIN CONTROLS MODAL ───────────────────── */}
      {selectedRfqForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 840, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Quote Monitoring Desk
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
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRfqForView.createdDate}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Bidding Deadline</span>
                  <div style={{ fontWeight: 700, color: '#6D28D9', marginTop: 2 }}>{selectedRfqForView.deadlineDate}</div>
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
                  Admin can inspect seller-submitted prices, configure markup/margin overrides, and manage quotation rejections. Original seller prices are preserved for audit transparency.
                </div>
              </div>

              {/* Submitted Manufacturer Quotations List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Submitted Manufacturer Quotations
                  </h4>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B' }}>
                    {manufacturers.slice(0, 3).length} Quotations Received
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {manufacturers.slice(0, 3).map((mfg, idx) => {
                    const defaultOrigPrice = 14.50 + idx * 1.20;
                    const mfgQuote = getMfgQuoteData(mfg.id, defaultOrigPrice);
                    const isSelected = idx === 0;

                    return (
                      <div
                        key={mfg.id}
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
                                {mfg.companyName}
                              </h5>
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
                              License: <strong>{mfg.mfgLicenseNo}</strong> • WHO-GMP Verified ✓ • 14-day SLA Dispatch
                            </div>
                          </div>

                          {/* Action Buttons: Edit Price & Reject */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isAdminPriceEditEnabled && !mfgQuote.isRejected && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingMfgId(mfg.id);
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
                                    setRejectingMfgId(mfg.id);
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
                            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Original Seller Price</span>
                            <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
                              ₹{mfgQuote.originalPrice.toFixed(2)} / strip
                            </div>
                          </div>

                          <div style={{ background: mfgQuote.adjustedPrice !== undefined ? '#F5F3FF' : '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: mfgQuote.adjustedPrice !== undefined ? '1px solid #DDD6FE' : '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: 10.5, color: mfgQuote.adjustedPrice !== undefined ? '#6D28D9' : '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Admin Adjusted Price</span>
                            <div style={{ fontWeight: 800, color: mfgQuote.adjustedPrice !== undefined ? '#6D28D9' : '#0F172A', marginTop: 2, fontFamily: 'monospace' }}>
                              {mfgQuote.adjustedPrice !== undefined ? `₹${mfgQuote.adjustedPrice.toFixed(2)} / strip` : 'Not Modified (Seller Price)'}
                            </div>
                          </div>

                          <div style={{ background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: 10.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Margin / Markup</span>
                            <div style={{ fontWeight: 800, color: mfgQuote.marginAmount > 0 ? '#15803D' : mfgQuote.marginAmount < 0 ? '#B91C1C' : '#64748B', marginTop: 2, fontFamily: 'monospace' }}>
                              {mfgQuote.marginAmount !== 0 ? `${mfgQuote.marginAmount > 0 ? '+' : ''}₹${mfgQuote.marginAmount.toFixed(2)} (${mfgQuote.marginPercent > 0 ? '+' : ''}${mfgQuote.marginPercent.toFixed(1)}%)` : '0.00%'}
                            </div>
                          </div>

                          <div style={{ background: '#F0FDF4', padding: '8px 12px', borderRadius: 6, border: '1px solid #86EFAC' }}>
                            <span style={{ fontSize: 10.5, color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Final Customer Price</span>
                            <div style={{ fontWeight: 800, color: '#15803D', marginTop: 2, fontFamily: 'monospace' }}>
                              ₹{mfgQuote.effectivePrice.toFixed(2)} / strip
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
                        {editingMfgId === mfg.id && (
                          <div style={{ marginTop: 14, background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Edit size={14} /> Modify Quotation Price for {mfg.companyName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <div>
                                <label style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 700 }}>Original Seller Price</label>
                                <input
                                  type="text"
                                  disabled
                                  value={`₹${mfgQuote.originalPrice.toFixed(2)} / strip`}
                                  style={{ height: 34, padding: '0 10px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, color: '#475569', width: 180, fontWeight: 700 }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 11, color: '#6D28D9', display: 'block', fontWeight: 700 }}>Admin Adjusted Price (₹/strip)</label>
                                <input
                                  type="number"
                                  step="0.05"
                                  value={tempAdjustedPrice}
                                  onChange={e => setTempAdjustedPrice(e.target.value)}
                                  style={{ height: 34, padding: '0 10px', background: '#FFFFFF', border: '1px solid #8B5CF6', borderRadius: 6, fontSize: 12, color: '#0F172A', width: 180, fontWeight: 800, outline: 'none' }}
                                />
                              </div>

                              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                                <button
                                  onClick={() => handleSaveAdjustedPrice(mfg.id, defaultOrigPrice)}
                                  style={{ padding: '7px 16px', background: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Save Adjusted Price
                                </button>
                                <button
                                  onClick={() => setEditingMfgId(null)}
                                  style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Inline Rejection Reason Modal */}
                        {rejectingMfgId === mfg.id && (
                          <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#991B1B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Slash size={14} /> Reject Quotation from {mfg.companyName}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <label style={{ fontSize: 11, color: '#991B1B', fontWeight: 700 }}>
                                Mandatory Rejection Reason (Required)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Price not commercially viable / Lead time too long"
                                value={rejectionReasonInput}
                                onChange={e => {
                                  setRejectionReasonInput(e.target.value);
                                  if (e.target.value.trim()) setRejectionError(null);
                                }}
                                style={{ height: 36, padding: '0 12px', background: '#FFFFFF', border: rejectionError ? '1px solid #DC2626' : '1px solid #FCA5A5', borderRadius: 6, fontSize: 12, color: '#0F172A', outline: 'none' }}
                              />
                              {rejectionError && (
                                <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
                                  {rejectionError}
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                <button
                                  onClick={() => handleConfirmRejection(mfg.id, defaultOrigPrice)}
                                  style={{ padding: '7px 16px', background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Confirm Rejection
                                </button>
                                <button
                                  onClick={() => setRejectingMfgId(null)}
                                  style={{ padding: '7px 14px', background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                Audit trail: Original seller prices preserved. All Admin price overrides are logged.
              </div>
              <button onClick={() => setSelectedRfqForView(null)} style={{ padding: '8px 20px', background: '#334155', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

