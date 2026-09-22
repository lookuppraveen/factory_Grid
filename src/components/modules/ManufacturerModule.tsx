import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Manufacturer, Product, RFQ, RFQLine, ManufacturerProductMapping } from '../../types';
import { FactoryAvatar } from '../common/Illustrations';
import { ManufacturerProfilePage, RequirementContext } from './ManufacturerProfilePage';
import {
  Factory, Search, ShieldCheck, Star, X, ChevronRight,
  MapPin, Award, CheckCircle2, Clock, Globe, AlertTriangle, Zap, FileText, Package,
  ArrowRight, Sparkles, Send, Check, SlidersHorizontal, ArrowUpDown, Filter, RotateCcw,
  CheckSquare, Square, AlertCircle
} from 'lucide-react';;

export const ManufacturerModule: React.FC = () => {
  const {
    manufacturers, mappings, products, orders, rfqs, addRFQ, addAuditLog, setActiveTab,
    selectedMfgIdForProfile, setSelectedMfgIdForProfile,
    mfgProfileProductContext, setMfgProfileProductContext,
    mfgProfileInitialTab
  } = useApp();
  
  // ── Product-First Search & Requirement State ─────────────────────
  const [searchQuery, setSearchQuery] = useState<string>('Paracetamol 500mg');
  const [dosageFilter, setDosageFilter] = useState<string>('ALL');
  const [requiredQty, setRequiredQty] = useState<number>(50000);
  const [qtyUnit, setQtyUnit] = useState<string>('Boxes');
  const [targetPrice, setTargetPrice] = useState<number>(42.00);
  const [deliveryLocation, setDeliveryLocation] = useState<string>('Ahmedabad, Gujarat');
  const [deliveryDate, setDeliveryDate] = useState<string>('2026-09-15');
  
  // ── Faceted Filters & Sorting State ─────────────────────
  const [certFilter, setCertFilter] = useState<string>('ALL'); // ALL | WHO-GMP | ISO | CDSCO
  const [moqMaxFilter, setMoqMaxFilter] = useState<number | null>(null);
  const [leadTimeMaxFilter, setLeadTimeMaxFilter] = useState<number | null>(null);
  const [pastRelationshipOnly, setPastRelationshipOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'BEST_MATCH' | 'MOQ' | 'LEAD_TIME' | 'RELATIONSHIP' | 'LOCATION'>('BEST_MATCH');

  // ── Multi-Manufacturer RFQ Checkbox Selection ─────────────────────
  const [selectedMfgIds, setSelectedMfgIds] = useState<string[]>([]);

  // ── Navigation State to Profile Page ─────────────────────
  const [viewingProfileMfgId, setViewingProfileMfgId] = useState<string | null>(null);

  // ── RFQ Creation Drawer State ─────────────────────
  const [rfqModalTargetMfgs, setRfqModalTargetMfgs] = useState<Manufacturer[]>([]);
  const [rfqModalProduct, setRfqModalProduct] = useState<Product | null>(null);
  const [rfqRemarks, setRfqRemarks] = useState<string>('WHO-GMP certified facility with cold-chain dispatch capability mandatory.');

  // ── RFQ Success Modal Overlay State ─────────────────────
  const [createdRfqSuccess, setCreatedRfqSuccess] = useState<RFQ | null>(null);

  // Popular search tags for quick discovery
  const popularSearches = [
    { label: 'Paracetamol 500mg', query: 'Paracetamol 500mg' },
    { label: 'Amoxyclav 625mg', query: 'Amoxyclav 625mg' },
    { label: 'Azithromycin 500mg', query: 'Azithromycin 500mg' },
    { label: 'Pantoprazole 40mg', query: 'Pantoprazole 40mg' },
    { label: 'Injectables', query: 'Injectable' },
    { label: 'Capsules', query: 'Capsule' }
  ];

  // ── Search & Match Logic Engine ─────────────────────
  const matchedMfgResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return manufacturers.map(mfg => {
      // Find mapped products for this manufacturer
      const mfgMapList = mappings.filter(m => m.manufacturerId === mfg.id);
      
      // Match against products table
      let bestMatchedProduct: Product | undefined = undefined;
      let bestMapping: ManufacturerProductMapping | undefined = undefined;
      let matchedByCapability = false;

      const qWords = q.split(' ').filter(w => w.length > 0);

      // 1. Direct mapping search match
      for (const map of mfgMapList) {
        const prd = products.find(p => p.id === map.productId);
        if (!prd) continue;

        const pName = prd.name.toLowerCase();
        const pGen = prd.genericName.toLowerCase();
        const pSalt = prd.saltCombination.toLowerCase();
        const pCat = prd.category.toLowerCase();
        const pStrength = prd.strength.toLowerCase();
        const pForm = prd.dosageForm.toLowerCase();

        const matchDirect = pName.includes(q) || pGen.includes(q) || pSalt.includes(q) || pCat.includes(q) || pStrength.includes(q) || pForm.includes(q);
        const matchWords = qWords.length > 0 && qWords.some(w => pName.includes(w) || pGen.includes(w) || pSalt.includes(w) || pCat.includes(w) || pStrength.includes(w) || pForm.includes(w));

        if (matchDirect || matchWords) {
          bestMatchedProduct = prd;
          bestMapping = map;
          break;
        }
      }

      // 2. Capability search match fallback
      if (!bestMatchedProduct && mfg.capabilities) {
        const capMatch = mfg.capabilities.some(c =>
          c.category.toLowerCase().includes(q) ||
          c.dosageForms.some(df => df.toLowerCase().includes(q)) ||
          c.techTags.some(tt => tt.toLowerCase().includes(q)) ||
          qWords.some(w => c.category.toLowerCase().includes(w) || c.dosageForms.some(df => df.toLowerCase().includes(w)))
        );
        if (capMatch) {
          matchedByCapability = true;
          if (mfgMapList.length > 0) {
            bestMapping = mfgMapList[0];
            bestMatchedProduct = products.find(p => p.id === bestMapping?.productId);
          }
        }
      }

      // Fallback if no specific formulation matched but plants exist
      if (!bestMatchedProduct && mfgMapList.length > 0) {
        bestMapping = mfgMapList[0];
        bestMatchedProduct = products.find(p => p.id === bestMapping?.productId);
      }

      const isMatch = Boolean(q === '' || bestMatchedProduct || matchedByCapability || mfg.name.toLowerCase().includes(q) || mfg.city.toLowerCase().includes(q) || true);

      // Buyer Past Relationship Calculation (Apex Pharma c1 context)
      const prevOrders = orders.filter(o => o.subOrders.some(so => so.manufacturerId === mfg.id));
      const prevRfqs = rfqs.filter(r => r.lines.some(l => l.selectedManufacturerId === mfg.id));
      const pastRelationship = {
        hasHistory: prevOrders.length > 0 || prevRfqs.length > 0,
        ordersCount: prevOrders.length || 3,
        rfqsCount: prevRfqs.length || 6,
        lastOrderDate: '04 Aug 2026',
        lastOrderProduct: bestMatchedProduct?.name || 'Paracetamol 500mg'
      };

      // AI Match Score Calculation
      let aiScore = 82;
      if (bestMatchedProduct) aiScore += 6;
      if (mfg.complianceStatus === 'APPROVED') aiScore += 4;
      if (mfg.certifications.some(c => c.name.includes('WHO-GMP'))) aiScore += 3;
      if (pastRelationship.hasHistory) aiScore += 3;

      // Cap at 96%
      aiScore = Math.min(96, aiScore);

      const aiRationale = [
        'Required product formulation available',
        'Certification & drug license verified (WHO-GMP / CDSCO)',
        `Standard MOQ (${bestMapping?.moq || 1000} Units) fits required batch size`,
        `SLA delivery schedule (${bestMapping?.standardLeadTimeDays || 14} Days) matches delivery schedule`,
        pastRelationship.hasHistory ? 'Previous buyer transaction history available' : 'CDSCO audit verified clean plant status'
      ];

      return {
        mfg,
        matchedProduct: bestMatchedProduct || products[0],
        mapping: bestMapping || mfgMapList[0],
        isMatch,
        aiScore,
        aiRationale,
        pastRelationship
      };
    }).filter(res => res.isMatch);
  }, [manufacturers, mappings, products, orders, rfqs, searchQuery]);

  // Apply Faceted Filters & Sorting
  const filteredAndSortedResults = useMemo(() => {
    let result = matchedMfgResults.filter(({ mfg, matchedProduct, mapping, pastRelationship }) => {
      // Certification Filter
      if (certFilter !== 'ALL') {
        if (!mfg.certifications.some(c => c.name.toUpperCase().includes(certFilter.toUpperCase()))) {
          return false;
        }
      }
      // Dosage Filter
      if (dosageFilter !== 'ALL') {
        if (matchedProduct && matchedProduct.dosageForm.toUpperCase() !== dosageFilter.toUpperCase()) {
          return false;
        }
      }
      // MOQ Filter
      if (moqMaxFilter !== null && mapping && mapping.moq > moqMaxFilter) {
        return false;
      }
      // Lead Time Filter
      if (leadTimeMaxFilter !== null && mapping && mapping.standardLeadTimeDays > leadTimeMaxFilter) {
        return false;
      }
      // Past Relationship Filter
      if (pastRelationshipOnly && !pastRelationship.hasHistory) {
        return false;
      }

      return true;
    });

    // Sorting Logic
    return result.sort((a, b) => {
      if (sortBy === 'BEST_MATCH') {
        return b.aiScore - a.aiScore;
      }
      if (sortBy === 'MOQ') {
        return (a.mapping?.moq || 9999) - (b.mapping?.moq || 9999);
      }
      if (sortBy === 'LEAD_TIME') {
        return (a.mapping?.standardLeadTimeDays || 999) - (b.mapping?.standardLeadTimeDays || 999);
      }
      if (sortBy === 'RELATIONSHIP') {
        return (b.pastRelationship.hasHistory ? 1 : 0) - (a.pastRelationship.hasHistory ? 1 : 0);
      }
      if (sortBy === 'LOCATION') {
        return a.mfg.city.localeCompare(b.mfg.city);
      }
      return 0;
    });
  }, [matchedMfgResults, certFilter, dosageFilter, moqMaxFilter, leadTimeMaxFilter, pastRelationshipOnly, sortBy]);

  // Toggle multi-manufacturer checkbox
  const handleToggleSelectMfg = (mfgId: string) => {
    setSelectedMfgIds(prev =>
      prev.includes(mfgId) ? prev.filter(id => id !== mfgId) : [...prev, mfgId]
    );
  };

  // Open profile page with current requirement context
  const handleOpenProfile = (mfg: Manufacturer) => {
    setViewingProfileMfgId(mfg.id);
  };

  // Open Request Quote modal for single manufacturer
  const handleOpenSingleQuoteModal = (mfg: Manufacturer, prod?: Product) => {
    setRfqModalTargetMfgs([mfg]);
    setRfqModalProduct(prod || products[0]);
  };

  // Open Request Quote modal for multiple selected manufacturers
  const handleOpenMultiQuoteModal = () => {
    const selectedMfgs = manufacturers.filter(m => selectedMfgIds.includes(m.id));
    if (selectedMfgs.length === 0) return;
    setRfqModalTargetMfgs(selectedMfgs);
    setRfqModalProduct(products[0]);
  };

  // Submit RFQ Action
  const handleSubmitRfqModal = () => {
    if (rfqModalTargetMfgs.length === 0) return;

    const rfqProduct = rfqModalProduct || products[0];
    const rfqNum = `RFQ-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const rfqLines: RFQLine[] = rfqModalTargetMfgs.map((mfg, idx) => ({
      id: `line_${Date.now()}_${idx}`,
      productId: rfqProduct?.id || 'p1',
      productName: `${rfqProduct?.name || 'Paracetamol 500mg Tablets'} (${searchQuery})`,
      dosageForm: rfqProduct?.dosageForm || 'Tablet',
      packSize: rfqProduct?.packSize || '10x10 Strip',
      quantity: requiredQty,
      requiredDate: deliveryDate,
      targetPrice: targetPrice,
      remarks: rfqRemarks,
      eligibleManufacturersCount: rfqModalTargetMfgs.length,
      selectedManufacturerId: mfg.id,
      selectedManufacturerName: mfg.name || mfg.companyName
    }));

    const newRfq: RFQ = {
      id: `rfq_${Date.now()}`,
      rfqNumber: rfqNum,
      customerId: 'c1',
      customerName: 'Apex Pharma PCD Franchise',
      customerCode: 'CUS000101',
      createdDate: new Date().toISOString().split('T')[0],
      deadlineDate: '2026-08-25',
      status: 'PRICING_IN_PROGRESS',
      lines: rfqLines,
      remarks: rfqRemarks
    };

    addRFQ(newRfq);
    addAuditLog('Manufacturer Discovery', `Submitted multi-manufacturer RFQ ${rfqNum} to ${rfqModalTargetMfgs.length} plants.`);

    setCreatedRfqSuccess(newRfq);
    setRfqModalTargetMfgs([]);
    setSelectedMfgIds([]);
  };

  // Requirement Context Object for Profile Page
  const currentRequirementContext: RequirementContext = {
    productName: searchQuery || 'Paracetamol 500mg',
    strength: '500mg',
    dosageForm: dosageFilter === 'ALL' ? 'Tablet' : dosageFilter,
    quantity: requiredQty,
    unit: qtyUnit
  };

  // If Profile page is open, render ManufacturerProfilePage with requirement context!
  const activeMfgId = selectedMfgIdForProfile || viewingProfileMfgId;

  if (activeMfgId) {
    const profileMfg = manufacturers.find(m => m.id === activeMfgId) || manufacturers[0];
    const profileReqContext = mfgProfileProductContext || currentRequirementContext;

    return (
      <>
        <ManufacturerProfilePage
          key={profileMfg.id}
          manufacturer={profileMfg}
          searchRequirementContext={profileReqContext}
          initialTab={mfgProfileInitialTab || (selectedMfgIdForProfile ? 'CATALOG' : 'OVERVIEW')}
          onBack={() => {
            if (selectedMfgIdForProfile) {
              setSelectedMfgIdForProfile(null);
              setMfgProfileProductContext(null);
              setActiveTab('products');
            } else {
              setViewingProfileMfgId(null);
            }
          }}
          onSelectManufacturer={mfgId => {
            if (selectedMfgIdForProfile) setSelectedMfgIdForProfile(mfgId);
            else setViewingProfileMfgId(mfgId);
          }}
          onRequestQuote={(mfg, prod) => handleOpenSingleQuoteModal(mfg, prod)}
          onViewOrderHistory={() => {
            setSelectedMfgIdForProfile(null);
            setViewingProfileMfgId(null);
            setActiveTab('orders');
          }}
        />

        {/* Request Quote Modal */}
        {rfqModalTargetMfgs.length > 0 && renderRfqDrawerModal()}

        {/* RFQ Success Modal */}
        {createdRfqSuccess && renderRfqSuccessModal()}
      </>
    );
  }

  // ── Render RFQ Drawer Modal ──────────────────────────────
  function renderRfqDrawerModal() {
    if (rfqModalTargetMfgs.length === 0) return null;
    const selectedProd = rfqModalProduct || products[0];

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div className="ent-panel" style={{ width: '100%', maxWidth: 620, background: 'var(--bg-panel)', borderRadius: 12, overflow: 'hidden' }}>
          
          <div className="ent-panel-header" style={{ padding: '16px 20px', background: 'var(--bg-subtle)' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: 'var(--c-primary)' }} />
                {rfqModalTargetMfgs.length === 1 ? `Request Quote — ${rfqModalTargetMfgs[0].name || rfqModalTargetMfgs[0].companyName}` : `Create RFQ for ${rfqModalTargetMfgs.length} Selected Manufacturers`}
              </div>
              <div className="ent-mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Customer: Apex Pharma PCD Franchise (CUS000101) · Target Location: {deliveryLocation}
              </div>
            </div>
            <button
              onClick={() => setRfqModalTargetMfgs([])}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
            
            {/* Selected Manufacturers List */}
            <div>
              <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Target Verified Manufacturers ({rfqModalTargetMfgs.length})</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {rfqModalTargetMfgs.map(mfg => (
                  <span key={mfg.id} style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)', color: 'var(--c-primary)'
                  }}>
                    ✓ {mfg.name || mfg.companyName} ({mfg.city})
                  </span>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Formulation Product Requirement</label>
              <select
                value={selectedProd?.id}
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value);
                  if (p) setRfqModalProduct(p);
                }}
                className="ent-input"
                style={{ width: '100%' }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.dosageForm} - {p.strength})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Target Price Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Required Quantity ({qtyUnit})</label>
                <input
                  type="number"
                  value={requiredQty}
                  onChange={e => setRequiredQty(Number(e.target.value))}
                  className="ent-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Target Price per Box (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetPrice}
                  onChange={e => setTargetPrice(Number(e.target.value))}
                  className="ent-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Expected Delivery Date & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="ent-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Delivery Location</label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={e => setDeliveryLocation(e.target.value)}
                  className="ent-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Special Remarks */}
            <div>
              <label className="ent-label" style={{ marginBottom: 6, display: 'block' }}>Compliance & Quality Requirements</label>
              <textarea
                rows={2}
                value={rfqRemarks}
                onChange={e => setRfqRemarks(e.target.value)}
                className="ent-input"
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

          </div>

          <div className="ent-panel-footer" style={{ padding: '14px 20px', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setRfqModalTargetMfgs([])}
              className="ent-button-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRfqModal}
              className="ent-button-primary"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Transmit RFQ →
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── Render RFQ Success Modal ──────────────────────────────
  function renderRfqSuccessModal() {
    if (!createdRfqSuccess) return null;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
      }}>
        <div className="ent-panel" style={{ width: '100%', maxWidth: 480, background: 'var(--bg-panel)', borderRadius: 12, padding: 28, textAlign: 'center' }}>
          
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--c-success-light)', border: '1px solid var(--c-success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-success)', marginBottom: 16 }}>
            <Check size={28} strokeWidth={3} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            RFQ Submitted Successfully!
          </h2>

          <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', marginBottom: 12 }}>
            RFQ Reference: {createdRfqSuccess.rfqNumber}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            Your quote request for <strong>{createdRfqSuccess.lines[0]?.productName}</strong> has been transmitted to <strong>{createdRfqSuccess.lines.length} verified plant(s)</strong>.
          </p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setCreatedRfqSuccess(null)}
              className="ent-button-secondary"
            >
              Close
            </button>
            <button
              onClick={() => {
                setCreatedRfqSuccess(null);
                setActiveTab('rfqs');
              }}
              className="ent-button-primary"
              style={{ fontWeight: 700 }}
            >
              View in RFQ Center →
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── MAIN PRODUCT-FIRST MANUFACTURER DISCOVERY PAGE ──────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>

      {/* ── 1. PAGE COMMAND BAR ────────────────────── */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Procurement & Sourcing / Verified Manufacturers</div>
            <div className="ent-page-title" style={{ margin: 0, fontSize: 20 }}>Find Manufacturers for Your Product</div>
          </div>
        </div>
        <div className="ent-command-bar-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-success-light)', border: '1px solid var(--c-success)', borderRadius: 8, padding: '6px 14px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--c-success)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-success)' }}>100% CDSCO License Audited</span>
          </div>
        </div>
      </div>

      {/* ── 1 & 2. PROMINENT PRODUCT SEARCH HERO PANEL ────────────────────── */}
      <div className="ent-panel" style={{ padding: '24px 28px', background: 'var(--bg-panel)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0F766E 0%, #0284C7 50%, #6366F1 100%)' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-primary)', marginBottom: 4 }}>
              Product-First Procurement Discovery
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              What are you looking to procure?
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
              Search by formulation name, active generic salt, strength, category, or dosage form to find verified manufacturing units.
            </p>
          </div>

          {/* Large Search Input */}
          <div style={{ position: 'relative', width: '100%', marginTop: 4 }}>
            <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-primary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search product, generic name, strength, category or capability... e.g. Paracetamol 500mg"
              className="ent-input"
              style={{
                width: '100%',
                paddingLeft: 46,
                paddingRight: 40,
                height: 48,
                fontSize: 15,
                fontWeight: 600,
                borderRadius: 10,
                background: 'var(--bg-app)',
                borderColor: 'var(--c-primary)'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Popular Search Pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            <span className="ent-caption" style={{ fontWeight: 700 }}>Popular Searches:</span>
            {popularSearches.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(item.query)}
                style={{
                  fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  background: searchQuery === item.query ? 'var(--c-primary-soft)' : 'var(--bg-subtle)',
                  border: searchQuery === item.query ? '1px solid var(--c-primary)' : '1px solid var(--border-subtle)',
                  color: searchQuery === item.query ? 'var(--c-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 120ms ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. REQUIREMENT REFINEMENT BAR ────────────────────── */}
      <div className="ent-panel" style={{ padding: '14px 20px', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--c-primary)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Refine Requirement:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Dosage Form Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ent-label">Dosage:</span>
              <select
                value={dosageFilter}
                onChange={e => setDosageFilter(e.target.value)}
                className="ent-input"
                style={{ padding: '4px 10px', fontSize: 12.5 }}
              >
                <option value="ALL">All Dosages</option>
                <option value="TABLET">Tablet</option>
                <option value="CAPSULE">Capsule</option>
                <option value="SYRUP">Syrup / Suspension</option>
                <option value="INJECTABLE">Injectable</option>
                <option value="NUTRACEUTICAL">Nutraceutical</option>
              </select>
            </div>

            {/* Quantity Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ent-label">Target Quantity:</span>
              <input
                type="number"
                value={requiredQty}
                onChange={e => setRequiredQty(Number(e.target.value))}
                className="ent-input"
                style={{ width: 100, padding: '4px 10px', fontSize: 12.5 }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{qtyUnit}</span>
            </div>

            {/* Target Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="ent-label">Target Unit Price:</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>₹</span>
              <input
                type="number"
                step="0.5"
                value={targetPrice}
                onChange={e => setTargetPrice(Number(e.target.value))}
                className="ent-input"
                style={{ width: 70, padding: '4px 8px', fontSize: 12.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 & 7 & 8. RESULTS HEADER, SORTING, AND FACETED FILTERS ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT COLUMN: Faceted Filters Panel */}
        <div className="ent-panel" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} style={{ color: 'var(--c-primary)' }} />
              Filter Results
            </div>
            <button
              onClick={() => {
                setCertFilter('ALL');
                setDosageFilter('ALL');
                setMoqMaxFilter(null);
                setLeadTimeMaxFilter(null);
                setPastRelationshipOnly(false);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--c-primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Certification Filter */}
            <div>
              <div className="ent-label" style={{ marginBottom: 8 }}>Required Certification</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'All Certifications' },
                  { id: 'WHO-GMP', label: 'WHO-GMP Certified' },
                  { id: 'ISO', label: 'ISO 9001:2015' },
                  { id: 'EU-GMP', label: 'EU-GMP Certified' }
                ].map(item => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', color: certFilter === item.id ? 'var(--c-primary)' : 'var(--text-secondary)', fontWeight: certFilter === item.id ? 700 : 500 }}>
                    <input
                      type="radio"
                      name="certGroup"
                      checked={certFilter === item.id}
                      onChange={() => setCertFilter(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* MOQ Filter */}
            <div>
              <div className="ent-label" style={{ marginBottom: 8 }}>Maximum MOQ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: null, label: 'Any MOQ' },
                  { id: 1000, label: '≤ 1,000 Units' },
                  { id: 2000, label: '≤ 2,000 Units' }
                ].map(item => (
                  <label key={String(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', color: moqMaxFilter === item.id ? 'var(--c-primary)' : 'var(--text-secondary)' }}>
                    <input
                      type="radio"
                      name="moqGroup"
                      checked={moqMaxFilter === item.id}
                      onChange={() => setMoqMaxFilter(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* SLA Delivery Schedule Filter */}
            <div>
              <div className="ent-label" style={{ marginBottom: 8 }}>Max SLA Delivery Schedule</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: null, label: 'Any Delivery Schedule' },
                  { id: 14, label: '≤ 14 Days' },
                  { id: 20, label: '≤ 20 Days' }
                ].map(item => (
                  <label key={String(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', color: leadTimeMaxFilter === item.id ? 'var(--c-primary)' : 'var(--text-secondary)' }}>
                    <input
                      type="radio"
                      name="leadGroup"
                      checked={leadTimeMaxFilter === item.id}
                      onChange={() => setLeadTimeMaxFilter(item.id)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Past Relationship Filter */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer', fontWeight: 700, color: pastRelationshipOnly ? 'var(--c-primary)' : 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={pastRelationshipOnly}
                  onChange={e => setPastRelationshipOnly(e.target.checked)}
                />
                Previously Worked With Me
              </label>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Matching Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Results Bar Header & Sorting Control */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Manufacturers matching your requirement
              </h3>
              <div className="ent-caption" style={{ marginTop: 2 }}>
                Found {filteredAndSortedResults.length} verified plant(s) for "{searchQuery || 'All Products'}"
              </div>
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowUpDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span className="ent-label">Sort By:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="ent-input"
                style={{ padding: '4px 10px', fontSize: 12.5, fontWeight: 600 }}
              >
                <option value="BEST_MATCH">Best AI Match</option>
                <option value="MOQ">Standard MOQ (Lowest)</option>
                <option value="LEAD_TIME">Delivery Schedule (Fastest)</option>
                <option value="RELATIONSHIP">Previous Relationship</option>
                <option value="LOCATION">Plant Location</option>
              </select>
            </div>
          </div>

          {/* ── 14. NO RESULTS STATE ────────────────────── */}
          {filteredAndSortedResults.length === 0 ? (
            <div className="ent-panel" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                <AlertCircle size={26} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No exact manufacturer match found.
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Try searching for related formulation names, generic active salts, or broader dosage forms.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div className="ent-caption" style={{ marginBottom: 8, fontWeight: 700 }}>Suggested Formulations:</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['Paracetamol 650mg ER Tablets', 'Amoxyclav 625mg Tablets', 'Azithromycin 500mg Tablets'].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(sug)}
                      className="ent-button-secondary"
                      style={{ fontSize: 12, padding: '4px 12px' }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setCertFilter('ALL');
                  setDosageFilter('ALL');
                  setMoqMaxFilter(null);
                  setLeadTimeMaxFilter(null);
                  setPastRelationshipOnly(false);
                }}
                className="ent-button-primary"
                style={{ padding: '8px 18px', fontWeight: 700 }}
              >
                Browse All Verified Manufacturers →
              </button>
            </div>
          ) : (
            /* ── 4 & 5 & 6. MATCHING MANUFACTURER CARDS ────────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredAndSortedResults.map(({ mfg, matchedProduct, mapping, aiScore, aiRationale, pastRelationship }) => {
                const initials = (mfg.name || mfg.companyName).split(' ').map(w => w[0]).join('').slice(0, 2);
                const isChecked = selectedMfgIds.includes(mfg.id);

                return (
                  <div
                    key={mfg.id}
                    className="ent-panel"
                    style={{
                      padding: 20,
                      background: 'var(--bg-panel)',
                      border: isChecked ? '2px solid var(--c-primary)' : '1px solid var(--border-subtle)',
                      position: 'relative',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      
                      {/* Top Row: Checkbox, Avatar, Name, AI Score */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                        
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 280 }}>
                          
                          {/* Multi-Select Checkbox */}
                          <div
                            onClick={() => handleToggleSelectMfg(mfg.id)}
                            style={{ cursor: 'pointer', paddingTop: 2, color: isChecked ? 'var(--c-primary)' : 'var(--text-tertiary)' }}
                            title="Select for Multi-Manufacturer RFQ"
                          >
                            {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                          </div>

                          <FactoryAvatar initials={initials} size={48} />

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                {mfg.name || mfg.companyName}
                              </h4>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--c-success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                ✓ Verified
                              </span>
                              <Badge status={mfg.complianceStatus} />
                            </div>

                            <div className="ent-mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span>Code: <strong>{mfg.code}</strong></span>
                              <span>·</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <MapPin size={12} /> {mfg.city}, {mfg.state}
                              </span>
                              <span>·</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openManufacturerProfile(mfg.id, 'PERFORMANCE');
                                }}
                                style={{ color: 'var(--c-warning)', fontWeight: 700, cursor: 'pointer', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(245, 158, 11, 0.2)', transition: 'all 120ms ease' }}
                                title="Click to view detailed Ratings & Performance breakdown"
                              >
                                ★ {mfg.ratingDetails?.overallRating || mfg.rating || 4.6} / 5.0 ({mfg.ratingDetails?.totalReviews || 128} Reviews)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI Procurement Match Score Badge */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '4px 12px', borderRadius: 20,
                            background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)', color: 'var(--c-primary)'
                          }}>
                            <Sparkles size={14} />
                            <span style={{ fontSize: 13, fontWeight: 800 }}>{aiScore}% AI Match</span>
                          </div>
                          <div className="ent-caption" style={{ marginTop: 3 }}>Recommended for requirement</div>
                        </div>

                      </div>

                      {/* Matched Product Details Card Strip */}
                      <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div className="ent-label" style={{ marginBottom: 2 }}>Matched Formulation Capability</div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            ✓ {matchedProduct.name} ({matchedProduct.dosageForm} - {matchedProduct.strength})
                          </div>
                          <div className="ent-caption" style={{ marginTop: 2 }}>
                            Generic: {matchedProduct.genericName} · Packaging: {matchedProduct.packSize}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div>
                            <div className="ent-label">Standard MOQ</div>
                            <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-secondary)' }}>
                              {(mapping?.moq || 1000).toLocaleString()} Units
                            </div>
                          </div>
                          <div style={{ height: 24, width: 1, background: 'var(--border-subtle)' }} />
                          <div>
                            <div className="ent-label">SLA Delivery Schedule</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)' }}>
                              {mapping?.standardLeadTimeDays || 14} Days
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Past Relationship Status Indicator */}
                      {pastRelationship.hasHistory ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--c-success)' }}>
                            <CheckCircle2 size={15} />
                            <span>Previously Worked With You — {pastRelationship.ordersCount} Completed Orders</span>
                          </div>
                          <div className="ent-caption">Last Order: {pastRelationship.lastOrderProduct} ({pastRelationship.lastOrderDate})</div>
                        </div>
                      ) : (
                        <div className="ent-caption" style={{ fontSize: 11.5 }}>
                          No previous relationship with this manufacturer. Submit RFQ to establish supply partner status.
                        </div>
                      )}

                      {/* Certifications Badges & Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 6 }}>
                        
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {mfg.certifications.map(c => (
                            <span key={c.id} className="ent-chip-success" style={{ fontSize: 11, padding: '2px 8px' }}>
                              ✓ {c.name}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleOpenProfile(mfg)}
                            className="ent-button-primary"
                            style={{ padding: '6px 16px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View Profile
                            <ArrowRight size={14} />
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Request Quote Modal Drawer */}
      {rfqModalTargetMfgs.length > 0 && renderRfqDrawerModal()}

      {/* RFQ Success Modal Overlay */}
      {createdRfqSuccess && renderRfqSuccessModal()}

    </div>
  );
};
