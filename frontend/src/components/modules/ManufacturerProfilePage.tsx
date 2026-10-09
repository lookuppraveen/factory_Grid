import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Manufacturer, Product, Certification } from '../../types';
import { ManufacturerProductCatalogTab } from './ManufacturerProductCatalogTab';
import { Badge } from '../common/Badge';
import { FactoryAvatar } from '../common/Illustrations';
import {
  ShieldCheck, ArrowRight, ArrowLeft, Bookmark, BookmarkCheck, Sparkles,
  MapPin, Award, CheckCircle2, Building2, Package, Clock, Layers,
  FileCheck, FileText, Check, ExternalLink, Calendar, Phone, Mail,
  User, CheckCircle, Info, ChevronRight, X, ShieldAlert, Cpu
} from 'lucide-react';

export interface RequirementContext {
  productName?: string;
  strength?: string;
  dosageForm?: string;
  quantity?: number;
  unit?: string;
}

export interface ManufacturerProfilePageProps {
  manufacturer: Manufacturer;
  searchRequirementContext?: RequirementContext;
  initialTab?: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE';
  onBack: () => void;
  onSelectManufacturer?: (mfgId: string) => void;
  onRequestQuote?: (mfg: Manufacturer, prod?: Product) => void;
  onViewOrderHistory?: () => void;
}

export const ManufacturerProfilePage: React.FC<ManufacturerProfilePageProps> = ({
  manufacturer,
  searchRequirementContext,
  initialTab = 'OVERVIEW',
  onBack,
  onSelectManufacturer,
  onRequestQuote,
  onViewOrderHistory
}) => {
  const { manufacturers, mappings, products, rfqs, quotes, orders, currentRole, setActiveTab } = useApp();

  const [isShortlisted, setIsShortlisted] = useState(manufacturer?.shortlisted ?? false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certification | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [activeTab, setActiveTabLocal] = useState<'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE'>(initialTab);

  // Robust Mapped products calculation for this manufacturer
  const finalMfgProducts = useMemo(() => {
    if (!manufacturer) return [];

    const mfgId = manufacturer.id;
    const mfgCode = manufacturer.code;
    const mfgName = manufacturer.companyName || manufacturer.name;

    const mfgMappings = mappings.filter(m =>
      (mfgId && m.manufacturerId === mfgId) ||
      (mfgCode && m.manufacturerCode === mfgCode) ||
      (m.manufacturerName && mfgName && m.manufacturerName.toLowerCase() === mfgName.toLowerCase())
    );

    let list = mfgMappings.map(m => {
      const prd = products.find(p => p.id === m.productId || p.code === m.mfgProductCode || p.name.toLowerCase() === m.mfgProductCode?.toLowerCase());
      return {
        mapping: m,
        product: prd || {
          id: m.productId,
          code: m.mfgProductCode || 'PRD',
          name: m.mfgProductCode || 'Formulation',
          genericName: 'Compendial Formulation',
          saltCombination: 'API',
          dosageForm: 'Tablet',
          strength: 'Standard',
          packSize: '10 x 10 Strip',
          uom: 'Strip',
          category: 'Analgesics',
          description: '',
          manufacturersCount: 1
        }
      };
    });

    return list;
  }, [mappings, products, manufacturer]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return finalMfgProducts;

    return finalMfgProducts.filter(item =>
      item.product.name.toLowerCase().includes(q) ||
      (item.product.genericName && item.product.genericName.toLowerCase().includes(q)) ||
      (item.product.saltCombination && item.product.saltCombination.toLowerCase().includes(q)) ||
      item.product.category.toLowerCase().includes(q) ||
      item.product.dosageForm.toLowerCase().includes(q)
    );
  }, [finalMfgProducts, productSearch]);

  // Buyer Past Relationship evaluation (Context: Apex Pharma PCD Franchise c1 or active role)
  const previousRfqsCount = rfqs.filter(r => r.lines.some(l => l.selectedManufacturerId === manufacturer.id) || r.customerId === 'c1').length;
  const previousQuotesCount = quotes.filter(q => q.manufacturerId === manufacturer.id).length;
  const completedOrders = orders.filter(o => o.subOrders.some(so => so.manufacturerId === manufacturer.id && (so.status === 'DELIVERED' || so.status === 'DISPATCHED' || so.status === 'IN_PRODUCTION')));
  const completedOrdersCount = completedOrders.length;
  
  const hasRelationship = previousRfqsCount > 0 || previousQuotesCount > 0 || completedOrdersCount > 0;

  // Similar manufacturers (excluding current)
  const similarMfgs = manufacturers.filter(m => m.id !== manufacturer.id).slice(0, 3);

  // Performance metrics defaults
  const metrics = manufacturer.performanceMetrics || {
    ordersCompleted: 24,
    onTimeDeliveryRate: 98.4,
    batchQualityPassRate: 99.8,
    avgRfqResponseHours: 14
  };

  const mfgName = manufacturer.name || manufacturer.companyName;
  const initials = mfgName.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>

      {/* Top Command / Navigation Bar */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left" style={{ gap: 12 }}>
          <button
            onClick={onBack}
            className="ent-button-secondary"
            style={{ padding: '6px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} />
            Back to Verified Manufacturers
          </button>
          <div style={{ height: 20, width: 1, background: 'var(--border-subtle)' }} />
          <div>
            <div className="ent-label">Verified Manufacturers / {mfgName}</div>
            <div className="ent-page-title" style={{ margin: 0, fontSize: 18 }}>Enterprise Profile</div>
          </div>
        </div>
        <div className="ent-command-bar-right" style={{ gap: 10 }}>
          <button
            onClick={() => setIsShortlisted(!isShortlisted)}
            className="ent-button-secondary"
            style={{
              borderColor: isShortlisted ? 'var(--c-primary)' : undefined,
              color: isShortlisted ? 'var(--c-primary)' : undefined,
              background: isShortlisted ? 'var(--c-primary-soft)' : undefined
            }}
          >
            {isShortlisted ? <BookmarkCheck size={16} style={{ color: 'var(--c-primary)' }} /> : <Bookmark size={16} />}
            {isShortlisted ? 'Shortlisted' : 'Save / Shortlist'}
          </button>
        </div>
      </div>

      {/* ── 1. MANUFACTURER PROFILE HEADER ──────────────────────────── */}
      <div className="ent-panel" style={{ padding: 24, background: 'var(--bg-panel)', position: 'relative', overflow: 'hidden' }}>
        {/* Accent top gradient stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0F766E 0%, #0284C7 50%, #6366F1 100%)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Manufacturer Avatar Logo */}
            <div style={{ flexShrink: 0, position: 'relative' }}>
              <FactoryAvatar initials={initials} size={72} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2, background: 'var(--c-success)', color: '#fff',
                borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-panel)'
              }}>
                <Check size={13} strokeWidth={3} />
              </div>
            </div>

            {/* Title & Badges Info */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {mfgName}
                </h1>

                {/* Verified Manufacturer Badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 20, padding: '3px 10px'
                }}>
                  <ShieldCheck size={14} style={{ color: 'var(--c-success)' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-success)' }}>✓ Verified Manufacturer</span>
                </div>

                <Badge status={manufacturer.complianceStatus} />
              </div>

              {/* Certification Badges Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {(manufacturer.certifications ?? []).map(c => (
                  <span key={c.id} style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)'
                  }}>
                    {c.name}
                  </span>
                ))}
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  · Code: <strong style={{ color: 'var(--text-secondary)' }}>{manufacturer.code}</strong>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} /> {manufacturer.city}, {manufacturer.state}
                </span>
              </div>

              {/* Short Company Description */}
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 12, marginBottom: 0, lineHeight: 1.5, maxWidth: 820 }}>
                "{manufacturer.description || 'Verified WHO-GMP compliant contract pharmaceutical manufacturing plant.'}"
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', flexShrink: 0, marginLeft: 'auto' }}>
              <div
                onClick={() => setActiveTabLocal('PERFORMANCE')}
                style={{ textAlign: 'right', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', transition: 'all 150ms ease' }}
                title="Click to view full Ratings & Performance breakdown"
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--c-warning)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>★</span> <span>{manufacturer.ratingDetails?.overallRating || manufacturer.rating || 4.6} / 5.0</span>
                </div>
                <div className="ent-caption" style={{ marginTop: 2, color: 'var(--c-primary)', fontWeight: 600 }}>
                  Based on {manufacturer.ratingDetails?.totalReviews || 128} verified orders →
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setIsShortlisted(!isShortlisted)}
                  className="ent-button-secondary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {isShortlisted ? '★ Saved' : 'Save'}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 10. PRODUCT SEARCH CONTEXT BANNER ──────────────────────────── */}
      {searchRequirementContext?.productName && (
        <div style={{
          background: 'var(--c-primary-soft)',
          border: '1px solid var(--c-primary)',
          borderRadius: 10,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={20} style={{ color: 'var(--c-primary)' }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-primary)' }}>
                Matches Your Current Procurement Requirement
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                {searchRequirementContext.productName} {searchRequirementContext.strength || ''} — {searchRequirementContext.quantity?.toLocaleString() || '50,000'} {searchRequirementContext.unit || 'Boxes'} ({searchRequirementContext.dosageForm || 'Tablet'})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. AI PROCUREMENT INSIGHT ──────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.06) 0%, rgba(2, 132, 199, 0.06) 100%)',
        border: '1px solid rgba(15, 118, 110, 0.25)',
        borderRadius: 10,
        padding: '16px 20px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} style={{ color: 'var(--c-primary)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>AI Procurement Insight</span>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12,
                  background: 'var(--c-success-light)', border: '1px solid var(--c-success)', color: 'var(--c-success)'
                }}>
                  92% Match for your requirement
                </span>
              </div>
              <div className="ent-caption" style={{ marginTop: 2 }}>
                FactoryGrid Procurement Engine evaluation based on plant certifications, capacity, SLA, and buyer history.
              </div>
            </div>
          </div>
        </div>

        {/* Why recommended breakdown */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(15, 118, 110, 0.15)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
            <span>Required product is available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
            <span>Required certification matched</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
            <span>MOQ matches required quantity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
            <span>Expected delivery schedule is suitable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--c-success)', flexShrink: 0 }} />
            <span>Previous buyer relationship available</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="ent-tab-bar" style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 16px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {[
          { id: 'OVERVIEW', label: 'Company Overview' },
          { id: 'CAPABILITIES', label: `Capabilities (${manufacturer?.capabilities?.length || 4})` },
          { id: 'CATALOG', label: `Product Catalog (${finalMfgProducts.length})` },
          { id: 'COMPLIANCE', label: `Certifications (${manufacturer?.certifications?.length || 0})` },
          { id: 'RELATIONSHIP', label: 'Buyer Relationship' },
          { id: 'PERFORMANCE', label: 'Performance Metrics' },
        ].map(tab => {
          const isActive = activeTab.toUpperCase() === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTabLocal(tab.id as any);
              }}
              className={`ent-tab ${isActive ? 'active' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0F766E' : '#475569',
                border: 'none',
                borderBottom: isActive ? '3px solid #0F766E' : '3px solid transparent',
                background: isActive ? 'rgba(15, 118, 110, 0.06)' : 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANY OVERVIEW */}
      {(activeTab.toUpperCase() === 'OVERVIEW') && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
          
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* About Plant Card */}
            <div className="ent-panel" style={{ padding: 20 }}>
              <div className="ent-subheading" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} style={{ color: 'var(--c-primary)' }} />
                About Manufacturing Plant
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {manufacturer.description || `${mfgName} operates a state-of-the-art contract manufacturing facility in ${manufacturer.city}, ${manufacturer.state}. The plant adheres to strict Drug Rules 1945 standards and WHO-GMP guidelines, serving pharmaceutical brand owners and distributors across India and international markets.`}
              </p>

              {/* Manufacturing Types Chips */}
              <div style={{ marginTop: 16 }}>
                <div className="ent-label" style={{ marginBottom: 8 }}>Manufacturing Scope</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(manufacturer.manufacturingTypes || ['Contract Manufacturing (TPM)', 'Third Party Formulations', 'PCD Supply']).map((type, idx) => (
                    <span key={idx} style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)', color: 'var(--c-primary)'
                    }}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Facility Specs Card */}
            <div className="ent-panel" style={{ padding: 20 }}>
              <div className="ent-subheading" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} style={{ color: 'var(--c-secondary)' }} />
                Facility Infrastructure & Capacity
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                  <div className="ent-label">Total Facility Built-up Area</div>
                  <div className="ent-subheading" style={{ marginTop: 4, color: 'var(--text-primary)' }}>
                    {manufacturer.facilityInfo?.areaSqFt || '45,000 sq ft'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                  <div className="ent-label">Cleanroom Classification</div>
                  <div className="ent-subheading" style={{ marginTop: 4, color: 'var(--c-success)' }}>
                    {manufacturer.facilityInfo?.cleanroomClass || 'Class 100,000 (ISO 8)'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                  <div className="ent-label">Established Year</div>
                  <div className="ent-subheading" style={{ marginTop: 4, color: 'var(--text-primary)' }}>
                    {manufacturer.establishedYear || 2012}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                  <div className="ent-label">In-House Quality R&D Lab</div>
                  <div className="ent-subheading" style={{ marginTop: 4, color: 'var(--c-primary)' }}>
                    {manufacturer.facilityInfo?.rndCenter ? '✓ NABL Accredited R&D' : 'In-House Testing'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
                <div className="ent-label">Installed Equipment & Lines</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {manufacturer.facilityInfo?.productionLines || '3 High-Speed Compression Lines, 2 Blister Packaging Lines, 1 Liquid Filling Line'}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Business & Registration Info */}
          <div className="ent-panel" style={{ padding: 20 }}>
            <div className="ent-subheading" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={16} style={{ color: 'var(--c-success)' }} />
              Registration & Verification
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div className="ent-label">Drug Manufacturing License</div>
                <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', marginTop: 2 }}>
                  {manufacturer.mfgLicenseNo}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              <div>
                <div className="ent-label">GSTIN Registration</div>
                <div className="ent-mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {manufacturer.gstin}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              <div>
                <div className="ent-label">PAN Number</div>
                <div className="ent-mono" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                  {manufacturer.pan}
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              <div>
                <div className="ent-label">Key Contact Person</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} style={{ color: 'var(--text-tertiary)' }} />
                  {manufacturer.contactPerson}
                </div>
                <div className="ent-caption" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={12} /> {manufacturer.email}
                </div>
                <div className="ent-caption" style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={12} /> {manufacturer.phone}
                </div>
              </div>

              <div style={{ marginTop: 10, background: 'var(--c-success-light)', border: '1px solid var(--c-success)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <ShieldCheck size={20} style={{ color: 'var(--c-success)', margin: '0 auto 4px auto' }} />
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-success)' }}>CDSCO License Verified</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>Physical audit completed by Drug Inspectorate</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CAPABILITIES */}
      {(activeTab.toUpperCase() === 'CAPABILITIES') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ent-caption">
            Dosage form capability matrix and dedicated production line capacities for {mfgName}.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {(manufacturer.capabilities || [
              { category: 'Tablets', monthlyCapacity: '25 Million Tabs / Month', dosageForms: ['Uncoated', 'Film Coated', 'Effervescent', 'Bilayered'], techTags: ['Rotary Press', 'Auto Coater', 'Alu-Alu Packaging'] },
              { category: 'Capsules', monthlyCapacity: '12 Million Caps / Month', dosageForms: ['Hard Gelatin', 'HPMC Vegetarian Caps'], techTags: ['Auto Encapsulation', 'Band Sealing'] },
              { category: 'Syrups & Oral Liquids', monthlyCapacity: '3.5 Million Bottles / Month', dosageForms: ['Oral Suspension', 'Dry Syrup'], techTags: ['Monoblock Liquid Filling', 'Purified Water System'] },
              { category: 'Nutraceuticals', monthlyCapacity: '8 Million Units / Month', dosageForms: ['Chewable Tablets', 'Multivitamin Strips'], techTags: ['FSSAI Certified', 'Dehumidified Storage'] }
            ]).map((cap, idx) => (
              <div key={idx} className="ent-panel" style={{ padding: 18, borderLeft: '4px solid var(--c-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="ent-subheading" style={{ fontSize: 15 }}>{cap.category}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'var(--c-secondary-soft)', color: 'var(--c-secondary)', border: '1px solid var(--c-secondary)' }}>
                    {cap.monthlyCapacity}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div className="ent-label" style={{ marginBottom: 6 }}>Dosage Forms Available</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cap.dosageForms.map((df, i) => (
                      <span key={i} style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                        {df}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="ent-label" style={{ marginBottom: 6 }}>Technology & Packaging</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cap.techTags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(99, 102, 241, 0.08)', color: '#6366F1' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT CATALOG */}
      {(activeTab.toUpperCase() === 'CATALOG') && (
        <ManufacturerProductCatalogTab
          manufacturer={manufacturer}
          mappings={mappings}
          products={products}
          onSelectProductForDetail={(product) => setSelectedProductForDetail(product)}
        />
      )}

      {/* ── STANDARDIZED PRODUCT DETAIL DRAWER MODAL ── */}
      {selectedProductForDetail && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedProductForDetail(null)}>
          <div style={{ width: '100%', maxWidth: 640, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.2)' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', fontFamily: 'monospace' }}>{selectedProductForDetail.code} · {selectedProductForDetail.category}</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{selectedProductForDetail.name}</h3>
              </div>
              <button onClick={() => setSelectedProductForDetail(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Details Content */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Product Specifications Grid */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.05em' }}>Standardized Specifications</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Generic Name:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProductForDetail.genericName || selectedProductForDetail.name}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Salt Combination:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProductForDetail.saltCombination || 'Standard Compendial Formulation'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{selectedProductForDetail.strength || 'N/A'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Dosage Form:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProductForDetail.dosageForm}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProductForDetail.packSize}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Standard MOQ:</span> <strong style={{ color: '#0F766E', display: 'block', fontFamily: 'monospace' }}>{(selectedProductForDetail.moq || 1000).toLocaleString()} Units</strong></div>
                </div>
              </div>

              {/* Regulatory Information */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8, letterSpacing: '0.05em' }}>Regulatory & Compliance Info</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(selectedProductForDetail.regulatoryInfo || ['WHO-GMP Required', 'CDSCO Applicable']).map(reg => (
                    <div key={reg} style={{ padding: '6px 12px', background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={14} /> {reg}
                    </div>
                  ))}
                </div>
              </div>

              {/* Manufacturer Context info */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Plant Capability Overview</div>
                <div style={{ fontSize: 12.5, color: '#475569' }}>
                  Manufactured at <strong>{mfgName}</strong> (Code: {manufacturer.code}). Formulation is active and compliant with CDSCO & WHO-GMP guidelines.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedProductForDetail(null)} style={{ padding: '10px 20px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Close Product Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CERTIFICATIONS & COMPLIANCE */}
      {activeTab === 'COMPLIANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ent-caption">
            Regulatory audit licenses and compliance documents verified by CDSCO and independent auditors.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {(manufacturer.certifications ?? []).map(cert => (
              <div key={cert.id} className="ent-panel" style={{ padding: 18, borderTop: '3px solid var(--c-success)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div className="ent-subheading" style={{ fontSize: 15 }}>{cert.name}</div>
                    <div className="ent-caption" style={{ marginTop: 2 }}>Issued by: {cert.issuedBy}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                    background: 'var(--c-success-light)', border: '1px solid var(--c-success)', color: 'var(--c-success)'
                  }}>
                    [Verified]
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '12px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="ent-label">Certificate No:</span>
                    <span className="ent-mono" style={{ fontWeight: 700 }}>{cert.certificateNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="ent-label">Issue Date:</span>
                    <span>{cert.issueDate}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span className="ent-label">Validity Expiry:</span>
                    <span className="ent-mono" style={{ fontWeight: 700, color: cert.status === 'EXPIRING_SOON' ? 'var(--c-warning)' : 'var(--c-success)' }}>
                      {cert.expiryDate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCertForModal(cert)}
                  className="ent-button-secondary"
                  style={{ width: '100%', marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12 }}
                >
                  <FileText size={14} />
                  [View Certificate]
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BUYER'S PAST RELATIONSHIP */}
      {activeTab === 'RELATIONSHIP' && (
        <div className="ent-panel" style={{ padding: 22 }}>
          <div className="ent-subheading" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={18} style={{ color: 'var(--c-primary)' }} />
            Your Relationship
          </div>

          {hasRelationship ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Summary Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div className="ent-label">Previous RFQs</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-primary)', marginTop: 4 }}>
                    {previousRfqsCount || 6} RFQs
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div className="ent-label">Quotes Received</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-secondary)', marginTop: 4 }}>
                    {previousQuotesCount || 4} Quotes
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                  <div className="ent-label">Completed Orders</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-success)', marginTop: 4 }}>
                    {completedOrdersCount || 3} Orders
                  </div>
                </div>
              </div>

              {/* Last Order Details Card */}
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
                <div className="ent-label" style={{ marginBottom: 8 }}>Last Order</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Paracetamol 500mg
                    </div>
                    <div className="ent-mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Last Order Date: 04 Aug 2026
                    </div>
                  </div>
                  <span className="ent-chip-success" style={{ padding: '4px 12px', fontSize: 12 }}>
                    ✓ Delivered
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onViewOrderHistory ? onViewOrderHistory() : setActiveTab('orders')}
                  className="ent-button-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  View Order History
                  <ChevronRight size={16} />
                </button>
              </div>

            </div>
          ) : (
            <div style={{ padding: 36, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                <Info size={24} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                No previous relationship with this manufacturer.
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0' }}>
                No prior order history on record with {mfgName}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PROCUREMENT PERFORMANCE & RATINGS BREAKDOWN */}
      {activeTab === 'PERFORMANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="ent-caption">
            System performance telemetry and buyer reviews calculated from verified FactoryGrid supply chain orders.
          </div>

          {/* Top Performance Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="ent-panel" style={{ padding: 18, background: 'var(--bg-panel)', borderLeft: '4px solid var(--c-warning)' }}>
              <div className="ent-label">Overall Manufacturer Rating</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-warning)', marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span>★ {manufacturer.ratingDetails?.overallRating || manufacturer.rating || 4.6}</span>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>/ 5.0</span>
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>Based on {manufacturer.ratingDetails?.totalReviews || 128} completed orders</div>
            </div>

            <div className="ent-panel" style={{ padding: 18, background: 'var(--bg-panel)', borderLeft: '4px solid var(--c-success)' }}>
              <div className="ent-label">Delivery Performance</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-success)', marginTop: 4 }}>
                {manufacturer.ratingDetails?.performance?.onTimeDeliveryRate || metrics.onTimeDeliveryRate}%
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>On-time dispatch rate</div>
            </div>

            <div className="ent-panel" style={{ padding: 18, background: 'var(--bg-panel)', borderLeft: '4px solid #3B82F6' }}>
              <div className="ent-label">Batch Quality Pass Rate</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
                {manufacturer.ratingDetails?.performance?.qualityPassRate || metrics.batchQualityPassRate}%
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>COA & HPLC audit compliance</div>
            </div>

            <div className="ent-panel" style={{ padding: 18, background: 'var(--bg-panel)', borderLeft: '4px solid var(--c-primary)' }}>
              <div className="ent-label">RFQ Response SLA</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--c-primary)', marginTop: 4 }}>
                &lt; {metrics.avgRfqResponseHours} Hours
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>Avg quotation submission SLA</div>
            </div>
          </div>

          {/* Rating Breakdown & Category Scores Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Rating Star Distribution Bar Chart */}
            <div className="ent-panel" style={{ padding: 20, background: 'var(--bg-panel)' }}>
              <div className="ent-subheading" style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-primary)' }}>
                Rating Distribution ({manufacturer.ratingDetails?.totalReviews || 128} Reviews)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { star: '5 ★', pct: manufacturer.ratingDetails?.distribution?.fiveStar || 78 },
                  { star: '4 ★', pct: manufacturer.ratingDetails?.distribution?.fourStar || 15 },
                  { star: '3 ★', pct: manufacturer.ratingDetails?.distribution?.threeStar || 5 },
                  { star: '2 ★', pct: manufacturer.ratingDetails?.distribution?.twoStar || 2 },
                  { star: '1 ★', pct: manufacturer.ratingDetails?.distribution?.oneStar || 0 },
                ].map(item => (
                  <div key={item.star} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, fontWeight: 600 }}>
                    <span style={{ width: 32, color: 'var(--text-secondary)' }}>{item.star}</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: 'var(--c-warning)', borderRadius: 999 }} />
                    </div>
                    <span style={{ width: 40, textAlign: 'right', color: 'var(--text-tertiary)', fontSize: 11.5 }} className="ent-mono">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Category Scores */}
            <div className="ent-panel" style={{ padding: 20, background: 'var(--bg-panel)' }}>
              <div className="ent-subheading" style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-primary)' }}>
                Performance Category Breakdown
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Delivery Timeliness', score: manufacturer.ratingDetails?.categoryRatings?.delivery || 4.8 },
                  { label: 'Product Quality & COA', score: manufacturer.ratingDetails?.categoryRatings?.quality || 4.9 },
                  { label: 'Supplier Communication', score: manufacturer.ratingDetails?.categoryRatings?.communication || 4.7 },
                  { label: 'Regulatory Compliance', score: manufacturer.ratingDetails?.categoryRatings?.compliance || 4.9 },
                ].map(cat => (
                  <div key={cat.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-primary)' }} className="ent-mono">
                      ★ {cat.score} / 5.0
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Verified Buyer Reviews List */}
          <div className="ent-panel" style={{ padding: 20, background: 'var(--bg-panel)' }}>
            <div className="ent-panel-header" style={{ paddingBottom: 12, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="ent-section-title" style={{ fontSize: 15 }}>Verified Buyer Reviews</div>
                <div className="ent-caption" style={{ marginTop: 2 }}>Reviews submitted by pharmaceutical buyers following batch delivery</div>
              </div>
              <span className="ent-chip-success">✓ CDSCO Verified Orders</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(manufacturer.ratingDetails?.recentReviews || [
                {
                  id: 'rev_default_1',
                  buyerName: 'Apex Pharma Ltd',
                  buyerCode: 'BUY-2026-001',
                  orderNumber: 'MO-2026-1001',
                  productName: 'Amoxyclav 625mg Tablets',
                  rating: 5,
                  date: '2026-08-10',
                  comment: 'Apex Pharma delivered the order within the committed timeline with flawless COA clearance.',
                  verifiedBuyer: true
                },
                {
                  id: 'rev_default_2',
                  buyerName: 'MedLife Hospital Chain',
                  buyerCode: 'BUY-2026-002',
                  orderNumber: 'MO-2026-1002',
                  productName: 'Paracetamol 650mg ER Tablets',
                  rating: 5,
                  date: '2026-07-28',
                  comment: 'Excellent Alu-Alu strip packaging and on-time cold chain dispatch.',
                  verifiedBuyer: true
                }
              ]).map(rev => (
                <div key={rev.id} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{rev.buyerName}</span>
                      {rev.verifiedBuyer && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="ent-mono" style={{ fontSize: 11, color: 'var(--c-primary)' }}>Order: {rev.orderNumber}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--c-warning)' }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{rev.comment}"
                  </p>

                  <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', display: 'flex', gap: 16 }}>
                    <span>Product: <strong>{rev.productName}</strong></span>
                    <span>Date: <strong>{rev.date}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 9. SIMILAR MANUFACTURERS ──────────────────────────── */}
      <div style={{ marginTop: 20 }}>
        <div className="ent-subheading" style={{ fontSize: 16, marginBottom: 14 }}>
          Similar Verified Manufacturers
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {similarMfgs.map(mfg => {
            const mfgInitials = (mfg.name || mfg.companyName).split(' ').map(w => w[0]).join('').slice(0, 2);
            return (
              <div
                key={mfg.id}
                onClick={() => onSelectManufacturer(mfg.id)}
                className="ent-panel"
                style={{
                  padding: 16, cursor: 'pointer', transition: 'all 150ms ease',
                  border: '1px solid var(--border-subtle)', background: 'var(--bg-panel)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FactoryAvatar initials={mfgInitials} size={42} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="ent-subheading" style={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mfg.name || mfg.companyName}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-warning)', flexShrink: 0 }}>★ {mfg.rating}</span>
                    </div>
                    <div className="ent-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      {mfg.code} · {mfg.city}, {mfg.state}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="ent-chip-success" style={{ fontSize: 11, padding: '2px 8px' }}>
                    ✓ WHO-GMP
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--c-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    View Profile <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. CERTIFICATE VIEWER MODAL ──────────────────────────── */}
      {selectedCertForModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="ent-panel" style={{ width: '100%', maxWidth: 650, background: 'var(--bg-panel)', borderRadius: 12, overflow: 'hidden' }}>
            <div className="ent-panel-header" style={{ padding: '16px 20px', background: 'var(--bg-subtle)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Digitized Regulatory Certificate
                </div>
                <div className="ent-mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                  Verification Seal: CDSCO Digital Repository · Cert #{selectedCertForModal.certificateNo}
                </div>
              </div>
              <button
                onClick={() => setSelectedCertForModal(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Certificate Preview Body */}
            <div style={{ padding: 24, background: '#FFF8F0', color: '#1E293B', fontFamily: 'serif' }}>
              <div style={{ border: '4px double #94A3B8', padding: 20, textAlign: 'center', background: '#FFFFFF' }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, fontFamily: 'sans-serif' }}>
                  CENTRAL DRUGS STANDARD CONTROL ORGANIZATION (CDSCO)
                </div>
                <h2 style={{ fontSize: 20, margin: '10px 0 4px 0', color: '#0F172A', fontWeight: 800 }}>
                  CERTIFICATE OF GOOD MANUFACTURING PRACTICE
                </h2>
                <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
                  Issued under Rule 139 of Drug Rules, 1945
                </div>

                <div style={{ height: 1, background: '#CBD5E1', margin: '16px 0' }} />

                <div style={{ fontSize: 13, textAlign: 'left', lineHeight: 1.6, color: '#334155', fontFamily: 'sans-serif' }}>
                  This is to certify that the manufacturing plant <strong>{mfgName}</strong> located at <strong>{manufacturer.city}, {manufacturer.state}</strong> (License No: <code>{manufacturer.mfgLicenseNo}</code>) has been audited and found to conform strictly with WHO-GMP Guidelines and Drug Rules Standards.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, textAlign: 'left', fontFamily: 'sans-serif', fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700 }}>CERTIFICATE TITLE</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedCertForModal.name}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700 }}>ISSUING AUTHORITY</div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedCertForModal.issuedBy}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700 }}>ISSUE DATE</div>
                    <div>{selectedCertForModal.issueDate}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748B', fontSize: 10, fontWeight: 700 }}>EXPIRY DATE</div>
                    <div style={{ color: '#166534', fontWeight: 700 }}>{selectedCertForModal.expiryDate} (VALID)</div>
                  </div>
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'sans-serif' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, color: '#166534', fontWeight: 800 }}>✓ DIGITAL SIGNATURE VERIFIED</div>
                    <div style={{ fontSize: 9.5, color: '#64748B' }}>Inspectorate Hash: 0x8F99...A41B</div>
                  </div>
                  <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    CDSCO AUDIT SEAL
                  </div>
                </div>
              </div>
            </div>

            <div className="ent-panel-footer" style={{ padding: '12px 20px', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCertForModal(null)}
                className="ent-button-secondary"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
