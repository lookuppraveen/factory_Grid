import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ManufacturerQuote } from '../../types';
import {
  Tag, Search, Eye, ArrowLeft, ShieldCheck
} from 'lucide-react';

export const ManufacturerQuoteSubmissionsModule: React.FC = () => {
  const { quotes, rfqs, manufacturers } = useApp();

  const myMfg = manufacturers[0];
  const myMfgId = myMfg?.id || 'm1';
  const myMfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';

  // Filter quotes belonging to THIS manufacturer that have actually been SUBMITTED
  const myQuotes = useMemo(() => {
    return (quotes || []).filter(q =>
      (q.manufacturerId === myMfgId || q.manufacturerName?.includes('SunBio')) &&
      q.status !== 'DRAFT'
    );
  }, [quotes, myMfgId]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered Quotes List
  const filteredQuotes = useMemo(() => {
    return myQuotes.filter(q => {
      const term = searchTerm.toLowerCase().trim();
      const rfq = (rfqs || []).find(r => r.id === q.rfqId || r.rfqNumber === q.rfqNumber);
      const buyerName = rfq ? rfq.customerName : 'Apex Pharma PCD Franchise';

      const matchesSearch =
        term === '' ||
        q.id.toLowerCase().includes(term) ||
        q.rfqNumber.toLowerCase().includes(term) ||
        buyerName.toLowerCase().includes(term) ||
        (q.quoteLines && q.quoteLines.some(l => l.productName.toLowerCase().includes(term)));

      return matchesSearch;
    });
  }, [myQuotes, rfqs, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalAmount = myQuotes.reduce((acc, q) => acc + (q.totalAmount || 0), 0);
    return {
      totalCount: myQuotes.length,
      totalValue: totalAmount
    };
  }, [myQuotes]);

  // Selected Quote for Read-Only Inspection View
  const [viewingQuote, setViewingQuote] = useState<ManufacturerQuote | null>(null);

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'BUYER REVIEWING':
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'SUBMITTED' };
      case 'ACCEPTED':
      case 'SELECTED':
      case 'SUB-ORDER CREATED':
        return { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: 'ACCEPTED / AWARDED' };
      case 'NEGOTIATION':
        return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'IN REVIEW' };
      case 'REJECTED':
      case 'NOT_SELECTED':
        return { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'REJECTED' };
      case 'EXPIRED':
        return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB', label: 'EXPIRED' };
      default:
        return { bg: '#F0FDFA', color: '#0F766E', border: '#99F6E4', label: 'SUBMITTED' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {viewingQuote ? (() => {
        const rfq = (rfqs || []).find(r => r.id === viewingQuote.rfqId || r.rfqNumber === viewingQuote.rfqNumber);
        const buyerName = rfq ? rfq.customerName : 'Apex Pharma PCD Franchise';
        const badge = getStatusBadge(viewingQuote.status);

        return (
          /* ── DEDICATED READ-ONLY QUOTATION DETAILS VIEW ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top Navigation & Header Bar */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '18px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button
                  onClick={() => setViewingQuote(null)}
                  style={{ padding: '8px 14px', borderRadius: 6, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ArrowLeft size={15} /> Back to Quote Submissions
                </button>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{viewingQuote.id}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>RFQ Ref: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{viewingQuote.rfqNumber}</strong></span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    Commercial Quotation Record — {buyerName}
                  </h1>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '6px 12px', borderRadius: 6 }}>
                <ShieldCheck size={14} style={{ color: '#0F766E' }} /> Submitted Record (Read-Only)
              </div>
            </div>

            {/* Commercial Summary Banner */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginBottom: 14 }}>
                COMMERCIAL QUOTATION OVERVIEW
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Total Quoted Value</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                    ₹{viewingQuote.totalAmount ? viewingQuote.totalAmount.toLocaleString('en-IN') : '0'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Buyer / Customer</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{buyerName}</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Submission Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{viewingQuote.submissionDate || '2026-08-14'}</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                  <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Quote Validity Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#D97706', marginTop: 2 }}>{viewingQuote.validUntil || '2026-09-30'}</div>
                </div>
              </div>
            </div>

            {/* 3-Part Commercial Margin Summary Container (Requirement 5) */}
            {(() => {
              const qLines = viewingQuote.quoteLines || [];
              const mfgBaseTotal = qLines.reduce((acc, l) => {
                const bU = l.baseUnitPrice ?? l.unitPrice;
                const qty = l.moq || 1000;
                return acc + bU * qty;
              }, 0);
              const buyerTotal = viewingQuote.totalAmount || qLines.reduce((acc, l) => acc + (l.calculatedFinalPrice || ((l.buyerUnitPrice || l.unitPrice) * (l.moq || 1000))), 0);
              const marginTotal = Math.max(0, buyerTotal - mfgBaseTotal);

              return (
                <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginBottom: 12 }}>
                    COMMERCIAL MARGIN BREAKDOWN (FACTORYGRID MARGIN ENGINE)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14 }}>
                      <div style={{ color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>Manufacturer Base Price</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>
                        ₹{Math.round(mfgBaseTotal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 14 }}>
                      <div style={{ color: '#B45309', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>FactoryGrid Platform Margin</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706', fontFamily: 'monospace', marginTop: 2 }}>
                        + ₹{Math.round(marginTotal).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ background: '#F0FDFA', border: '1.5px solid #0F766E', borderRadius: 8, padding: 14 }}>
                      <div style={{ color: '#0F766E', fontSize: 11, textTransform: 'uppercase', fontWeight: 800 }}>Final Buyer Price</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                        ₹{Math.round(buyerTotal).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Product Lines Breakdown Table */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', marginBottom: 14 }}>
                QUOTED PRODUCT LINES & COMMERCIAL BREAKDOWN
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>PRODUCT NAME</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>BASE PRICE (₹)</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#D97706' }}>FG MARGIN</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#0F766E' }}>FINAL BUYER PRICE (₹)</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>MOQ & LEAD TIME</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: '#475569', textAlign: 'right', paddingRight: 16 }}>LINE TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingQuote.quoteLines || []).map((line, idx) => {
                      const baseU = line.baseUnitPrice ?? line.unitPrice;
                      const marginPct = line.marginPercent ?? 10;
                      const buyerU = line.buyerUnitPrice ?? (baseU * (1 + marginPct / 100));

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0F172A' }}>
                            {line.productName}
                            {line.category && <span style={{ display: 'block', fontSize: 11, color: '#64748B', fontWeight: 500 }}>{line.category}</span>}
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>₹{baseU.toFixed(2)}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#D97706', fontFamily: 'monospace' }}>+{marginPct}%</td>
                          <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>₹{buyerU.toFixed(2)}</td>
                          <td style={{ padding: '14px 12px', fontSize: 12 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{(line.moq || 1000).toLocaleString()}</span> Units · <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{line.leadTimeDays}d</span>
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', textAlign: 'right', paddingRight: 16 }}>
                            ₹{line.calculatedFinalPrice ? line.calculatedFinalPrice.toLocaleString('en-IN') : (buyerU * (line.moq || 1000)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Terms & Remarks */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                COMMERCIAL TERMS & MANUFACTURER REMARKS
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, fontSize: 12.5 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Delivery & Freight Terms:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{(viewingQuote as any).deliveryTerms || 'Ex-Factory Hyderabad / Cold-Chain Fleet'}</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Payment & Credit Terms:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>30 Days Credit Against Inspection Acceptance</div>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 6 }}>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Quoted By Manufacturer:</span>
                  <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{myMfgName}</div>
                </div>
              </div>

              {viewingQuote.remarks && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 6, fontSize: 12.5 }}>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Manufacturer Remarks:</span>
                  <span style={{ color: '#0F172A', fontStyle: 'italic' }}>"{viewingQuote.remarks}"</span>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'flex-start' }}>
              <button
                onClick={() => setViewingQuote(null)}
                style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} /> Back to Quote Submissions
              </button>
            </div>

          </div>
        );
      })() : (
        /* ── QUOTE SUBMISSIONS REGISTER LANDING PAGE ── */
        <>
          {/* Top Header Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MANUFACTURING OPERATIONS / SUBMITTED QUOTATIONS</div>
              <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                SUBMITTED QUOTATIONS
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                Archive of all commercial quotations submitted by {myMfgName}.
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Submitted Quotations</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{metrics.totalCount}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Commercial quote records</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Commercial Value</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                ₹{metrics.totalValue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Combined value of submitted quotes</div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid', gridTemplateColumns: '1fr', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by quote number, RFQ number, buyer, product..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
            </div>
          </div>

          {/* Table Register */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTE NUMBER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ NUMBER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BUYER</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT / LINES</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>QUOTED AMOUNT</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUBMISSION DATE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <Tag size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No submitted quotes found.</div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map(q => {
                    const rfq = (rfqs || []).find(r => r.id === q.rfqId || r.rfqNumber === q.rfqNumber);
                    const buyerName = rfq ? rfq.customerName : 'Apex Pharma PCD Franchise';
                    const firstLine = q.quoteLines && q.quoteLines.length > 0 ? q.quoteLines[0] : null;
                    const badge = getStatusBadge(q.status);

                    return (
                      <tr
                        key={q.id}
                        onClick={() => setViewingQuote(q)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                      >
                        <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {q.id}
                        </td>
                        <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                          {q.rfqNumber}
                        </td>
                        <td style={{ padding: '14px 14px', fontWeight: 700, color: '#0F172A' }}>
                          {buyerName}
                        </td>
                        <td style={{ padding: '14px 14px', color: '#334155' }}>
                          {firstLine ? (
                            <span>
                              {firstLine.productName}
                              {(q.quoteLines?.length || 0) > 1 && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginLeft: 4 }}>(+{(q.quoteLines?.length || 0) - 1} lines)</span>}
                            </span>
                          ) : (
                            `${q.quoteLines?.length || 1} Product Lines`
                          )}
                        </td>
                        <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          ₹{q.totalAmount ? q.totalAmount.toLocaleString('en-IN') : '0'}
                        </td>
                        <td style={{ padding: '14px 14px', color: '#64748B' }}>
                          {q.submissionDate || '2026-08-14'}
                        </td>
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()} style={{ padding: '14px 14px', textAlign: 'right', paddingRight: 16 }}>
                          <button
                            onClick={() => setViewingQuote(q)}
                            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={13} /> View Details →
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
