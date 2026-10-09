import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RFQ } from '../../types';
import {
  FileText, Search, Eye, X, Clock, CheckCircle2, ShieldCheck, Filter,
  Star, DollarSign, Check, AlertCircle, Building2, Tag, Calendar, Layers
} from 'lucide-react';

export const AdminRfqMonitor: React.FC = () => {
  const { rfqs, currentRole, internalPriceList, submitGenericAdminPricing } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'ALL' | 'GENERIC' | 'BRANDED'>('ALL');

  // Generic Pricing Desk Modal State
  const [selectedGenericRfq, setSelectedGenericRfq] = useState<RFQ | null>(null);
  const [genericLinePrices, setGenericLinePrices] = useState<Record<string, number>>({});
  const [pricingSuccessToast, setPricingSuccessToast] = useState<string | null>(null);

  // Standard Read-Only RFQ Inspection Modal State (for Branded or Inspection)
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);

  const totalRfqs = rfqs.length;
  const genericRfqs = rfqs.filter(r => r.isGeneric || r.lines?.some(l => l.productType === 'GENERIC'));
  const pendingGenericCount = genericRfqs.filter(r => r.status === 'Submitted' || r.genericStatus === 'SUBMITTED').length;
  const brandedRfqs = rfqs.filter(r => !r.isGeneric && !r.lines?.some(l => l.productType === 'GENERIC'));

  const pendingCount = rfqs.filter(r => r.status === 'Open' || r.status === 'Draft' || r.status === 'Submitted').length;
  const quotedCount = rfqs.filter(r => r.status === 'Quoted' || r.status === 'Under Review').length;
  const closedCount = rfqs.filter(r => r.status === 'Closed' || r.status === 'Awarded').length;

  const filteredRfqs = rfqs.filter(r => {
    // Tab filter
    if (activeTabFilter === 'GENERIC' && !(r.isGeneric || r.lines?.some(l => l.productType === 'GENERIC'))) return false;
    if (activeTabFilter === 'BRANDED' && (r.isGeneric || r.lines?.some(l => l.productType === 'GENERIC'))) return false;

    // Search filter
    const matchSearch =
      r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lines?.some(l => (l.molecule || l.productName || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return matchSearch;
  });

  // Open Generic Pricing Desk and pre-fill prices from FactoryGrid Internal Price List
  const handleOpenGenericPricing = (rfq: RFQ) => {
    const initialPrices: Record<string, number> = {};
    rfq.lines.forEach(line => {
      if (line.internalPrice) {
        initialPrices[line.id] = line.internalPrice;
      } else {
        // Look up matching molecule in FactoryGrid internal price list
        const lineMolecule = (line.molecule || line.genericName || line.productName || '').toLowerCase();
        const matchedItem = internalPriceList.find(item =>
          item.molecule.toLowerCase().includes(lineMolecule) || lineMolecule.includes(item.molecule.toLowerCase())
        );
        initialPrices[line.id] = matchedItem ? matchedItem.internalPrice : 4.20;
      }
    });

    setGenericLinePrices(initialPrices);
    setSelectedGenericRfq(rfq);
  };

  // Submit Generic Pricing to existing Quote/Order Flow
  const handleSaveAndSubmitGenericPricing = () => {
    if (!selectedGenericRfq) return;

    submitGenericAdminPricing(selectedGenericRfq.id, genericLinePrices);
    setPricingSuccessToast(`✔ Generic pricing applied successfully for ${selectedGenericRfq.rfqNumber}. Platform quotation issued to Buyer.`);
    setSelectedGenericRfq(null);

    setTimeout(() => {
      setPricingSuccessToast(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC', color: '#0F172A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Toast Notification */}
      {pricingSuccessToast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 10010, background: '#0F766E', color: '#FFFFFF', padding: '12px 20px', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>{pricingSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <FileText size={14} /> Procurement Oversight · Role: {currentRole}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
            RFQ & Generic Pricing Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Governance monitor for buyer RFQs, branded formulation lines, and FactoryGrid internal price list pricing for generic medicines.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 14px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, color: '#15803D' }}>
            <DollarSign size={14} /> INTERNAL PRICE LIST ACTIVE
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'TOTAL RFQS', val: totalRfqs, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'GENERIC REQUESTS', val: genericRfqs.length, color: '#0F766E', bg: '#F0FDFA', subtitle: `${pendingGenericCount} pending pricing` },
          { label: 'BRANDED RFQS', val: brandedRfqs.length, color: '#6366F1', bg: '#EEF2FF' },
          { label: 'ACTIVE / QUOTED', val: quotedCount, color: '#16A34A', bg: '#DCFCE7' },
          { label: 'CLOSED / AWARDED', val: closedCount, color: '#4F46E5', bg: '#EEF2FF' },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color, marginTop: 4 }}>{card.val}</div>
            {card.subtitle && (
              <div style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, marginTop: 2 }}>{card.subtitle}</div>
            )}
          </div>
        ))}
      </div>

      {/* RFQ Queue Table with Sub-Filter Tabs */}
      <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          
          {/* Sub-Filter Tabs */}
          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
            <button
              onClick={() => setActiveTabFilter('ALL')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTabFilter === 'ALL' ? '#FFFFFF' : 'transparent',
                color: activeTabFilter === 'ALL' ? '#0F172A' : '#64748B',
                boxShadow: activeTabFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              All RFQs ({totalRfqs})
            </button>
            <button
              onClick={() => setActiveTabFilter('GENERIC')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTabFilter === 'GENERIC' ? '#0F766E' : 'transparent',
                color: activeTabFilter === 'GENERIC' ? '#FFFFFF' : '#64748B',
                boxShadow: activeTabFilter === 'GENERIC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>🧪 Generic Medicine ({genericRfqs.length})</span>
              {pendingGenericCount > 0 && (
                <span style={{ background: '#F59E0B', color: '#FFF', fontSize: 10, padding: '1px 5px', borderRadius: 999 }}>
                  {pendingGenericCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTabFilter('BRANDED')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTabFilter === 'BRANDED' ? '#FFFFFF' : 'transparent',
                color: activeTabFilter === 'BRANDED' ? '#0F172A' : '#64748B',
                boxShadow: activeTabFilter === 'BRANDED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              🏷️ Branded RFQs ({brandedRfqs.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search Molecule, RFQ #, Customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 34, paddingLeft: 32, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6 }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>RFQ # & Type</th>
              <th style={{ padding: '12px 16px' }}>Customer / Buyer</th>
              <th style={{ padding: '12px 16px' }}>Molecule / Formulation</th>
              <th style={{ padding: '12px 16px' }}>Submission Date</th>
              <th style={{ padding: '12px 16px' }}>Target Date</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRfqs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  No RFQs match the current filter.
                </td>
              </tr>
            ) : (
              filteredRfqs.map(rfq => {
                const isGeneric = rfq.isGeneric || rfq.lines?.some(l => l.productType === 'GENERIC');
                const needsPricing = isGeneric && (rfq.status === 'Submitted' || rfq.genericStatus === 'SUBMITTED');

                return (
                  <tr key={rfq.id} style={{ borderBottom: '1px solid #F1F5F9', background: needsPricing ? '#F0FDF4' : '#FFFFFF' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{rfq.rfqNumber}</span>
                        {isGeneric ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', fontSize: 10, fontWeight: 800 }}>
                            GENERIC
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: 10, fontWeight: 700 }}>
                            BRANDED
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>{rfq.customerName}</span>
                        {rfq.customerClassification === 'SPECIAL_PARTY' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC' }}>
                            <Star size={10} fill="#0E7490" /> SPECIAL PARTY
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                            REGULAR
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: isGeneric ? '#0F766E' : '#1E293B' }}>
                        {isGeneric && rfq.lines[0]?.molecule ? `Molecule: ${rfq.lines[0].molecule}` : rfq.lines[0]?.productName}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {rfq.lines?.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0).toLocaleString()} units · {rfq.lines?.length || 1} line(s)
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.createdDate || rfq.createdAt || '2026-08-01'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>{rfq.targetDeliveryDate || '2026-09-15'}</td>

                    <td style={{ padding: '12px 16px' }}>
                      {isGeneric ? (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: rfq.status === 'Quoted' || rfq.genericStatus === 'PRICED' ? '#DCFCE7' : '#FEF3C7', color: rfq.status === 'Quoted' || rfq.genericStatus === 'PRICED' ? '#15803D' : '#B45309' }}>
                          {rfq.genericStatus === 'PRICED' || rfq.status === 'Quoted' ? 'PRICED' : 'SUBMITTED (ADMIN PROCESSING)'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: rfq.status === 'Closed' ? '#F1F5F9' : rfq.status === 'Quoted' ? '#DCFCE7' : '#FEF3C7', color: rfq.status === 'Closed' ? '#64748B' : rfq.status === 'Quoted' ? '#15803D' : '#B45309' }}>
                          {rfq.status}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {isGeneric ? (
                        <button
                          onClick={() => handleOpenGenericPricing(rfq)}
                          style={{
                            padding: '6px 14px',
                            background: needsPricing ? '#0F766E' : '#2563EB',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          {needsPricing ? 'Price Request →' : 'View / Edit Pricing'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRfq(rfq)}
                          style={{ padding: '5px 12px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── GENERIC MEDICINE PRICING DESK MODAL ── */}
      {selectedGenericRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 840, maxHeight: '90vh', overflowY: 'auto', padding: 26, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #CBD5E1' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    FactoryGrid Internal Price List · Generic Pricing Desk
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: 4 }}>
                    Platform Supply
                  </span>
                </div>
                <h3 style={{ margin: '3px 0 0', fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  Process Generic Request: {selectedGenericRfq.rfqNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedGenericRfq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Status Pipeline Visualizer */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                Generic Workflow Stage Progression
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11, fontWeight: 700 }}>
                <span style={{ background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: 6 }}>1. SUBMITTED ✓</span>
                <span>➔</span>
                <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 6, border: '1px solid #FDE68A' }}>2. ADMIN PROCESSING (CURRENT)</span>
                <span>➔</span>
                <span style={{ background: '#F1F5F9', color: '#64748B', padding: '3px 10px', borderRadius: 6 }}>3. PRICED & QUOTED</span>
                <span>➔</span>
                <span style={{ background: '#F1F5F9', color: '#64748B', padding: '3px 10px', borderRadius: 6 }}>4. EXISTING QUOTE & ORDER FLOW</span>
              </div>
            </div>

            {/* Buyer & Request Context Summary */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12.5 }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Buyer / Customer:</span>
                <strong style={{ color: '#0F172A' }}>{selectedGenericRfq.customerName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Customer Code:</span>
                <strong style={{ color: '#0F172A' }}>{selectedGenericRfq.customerCode}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Submission Date:</span>
                <strong style={{ color: '#0F172A' }}>{selectedGenericRfq.createdDate}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Required Delivery:</span>
                <strong style={{ color: '#0F172A' }}>{selectedGenericRfq.lines[0]?.requiredDate || selectedGenericRfq.deadlineDate}</strong>
              </div>
            </div>

            {/* Formulation Lines Pricing & Internal Price List Matcher */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                  Requested Molecule & Pricing Formulation ({selectedGenericRfq.lines?.length || 1})
                </h4>
                <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700, background: '#F0FDF4', padding: '2px 8px', borderRadius: 4 }}>
                  No Brand Certificate Required
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedGenericRfq.lines.map((line, idx) => {
                  const lineMolecule = (line.molecule || line.genericName || 'Paracetamol').toLowerCase();
                  const matchedItems = internalPriceList.filter(item =>
                    item.molecule.toLowerCase().includes(lineMolecule) || lineMolecule.includes(item.molecule.toLowerCase())
                  );
                  const currentPrice = genericLinePrices[line.id] !== undefined ? genericLinePrices[line.id] : 4.20;
                  const lineTotal = (Number(line.quantity) || 0) * currentPrice;

                  return (
                    <div key={line.id || idx} style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, background: '#FFFFFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                            {line.productName || `${line.molecule} (Generic)`}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', gap: 12 }}>
                            <span><strong>Molecule:</strong> {line.molecule || line.genericName || 'Paracetamol'}</span>
                            <span><strong>Dosage Form:</strong> {line.dosageForm || 'Tablet'}</span>
                            <span><strong>Quantity:</strong> {Number(line.quantity).toLocaleString()} units</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Line Subtotal</span>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            ₹{lineTotal.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Matching FactoryGrid Internal Price List Items */}
                      <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 6 }}>
                          FactoryGrid Internal Price List Lookup
                        </div>
                        {matchedItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {matchedItems.map(item => (
                              <div
                                key={item.id}
                                onClick={() => setGenericLinePrices(prev => ({ ...prev, [line.id]: item.internalPrice }))}
                                style={{
                                  padding: '8px 12px',
                                  background: currentPrice === item.internalPrice ? '#CCFBF1' : '#FFFFFF',
                                  border: currentPrice === item.internalPrice ? '1px solid #0F766E' : '1px solid #E2E8F0',
                                  borderRadius: 6,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  fontSize: 12
                                }}
                              >
                                <div>
                                  <strong style={{ color: '#0F172A' }}>{item.productName}</strong>
                                  <span style={{ color: '#64748B', marginLeft: 8 }}>({item.packSize})</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                                    ₹{item.internalPrice.toFixed(2)} / unit
                                  </span>
                                  {currentPrice === item.internalPrice && (
                                    <span style={{ fontSize: 11, color: '#0F766E', fontWeight: 800 }}>✓ APPLIED</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            Standard generic base rate applicable: ₹4.20/unit
                          </div>
                        )}
                      </div>

                      {/* Admin Unit Price Adjustment Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 220 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                            Admin Applicable Price (₹/unit) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={currentPrice}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setGenericLinePrices(prev => ({ ...prev, [line.id]: val }));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: '#FFFFFF',
                              border: '1px solid #0F766E',
                              borderRadius: 6,
                              fontSize: 14,
                              fontWeight: 800,
                              color: '#0F766E'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 16 }}>
                          Price is directly taken from FactoryGrid internal price list to form the platform quote.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748B' }}>Total Generic Quotation Value:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0F766E', marginLeft: 8, fontFamily: 'monospace' }}>
                  ₹{selectedGenericRfq.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (genericLinePrices[l.id] !== undefined ? genericLinePrices[l.id] : 4.20), 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setSelectedGenericRfq(null)}
                  style={{ padding: '9px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAndSubmitGenericPricing}
                  style={{
                    padding: '9px 22px',
                    background: '#0F766E',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(15,118,110,0.3)'
                  }}
                >
                  <Check size={16} /> Apply Internal Price & Issue Platform Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STANDARD READ-ONLY RFQ DETAIL MODAL (BRANDED RFQS) ── */}
      {selectedRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 14, width: '100%', maxWidth: 750, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Read-Only Governance Inspection</span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>RFQ Details: {selectedRfq.rfqNumber}</h3>
              </div>
              <button onClick={() => setSelectedRfq(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <strong>Customer Name:</strong>
                <span>{selectedRfq.customerName}</span>
                {selectedRfq.customerClassification === 'SPECIAL_PARTY' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 4, fontSize: 10.5, fontWeight: 800, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC' }}>
                    <Star size={10} fill="#0E7490" /> SPECIAL PARTY
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                    REGULAR
                  </span>
                )}
              </div>
              <div><strong>Status:</strong> {selectedRfq.status}</div>
              <div><strong>Created Date:</strong> {selectedRfq.createdDate || selectedRfq.createdAt || '2026-08-01'}</div>
              <div><strong>Target Delivery:</strong> {selectedRfq.targetDeliveryDate || '2026-09-15'}</div>
            </div>

            <h4 style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 800 }}>Formulation Line Items:</h4>
            <div style={{ background: '#FFF', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 800 }}>
                    <th style={{ padding: 10 }}>Product Name</th>
                    <th style={{ padding: 10 }}>Dosage Form</th>
                    <th style={{ padding: 10 }}>Quantity</th>
                    <th style={{ padding: 10 }}>Target Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRfq.lines || []).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{l.productName}</td>
                      <td style={{ padding: 10 }}>{l.dosageForm || 'Tablet / Capsule'}</td>
                      <td style={{ padding: 10, fontFamily: 'monospace' }}>{l.quantity?.toLocaleString()}</td>
                      <td style={{ padding: 10, fontFamily: 'monospace' }}>₹{l.targetPrice || l.unitPrice || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10 }}>
              <button onClick={() => setSelectedRfq(null)} style={{ padding: '8px 18px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
