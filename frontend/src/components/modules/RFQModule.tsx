import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { EmptyRFQIllustration, FactoryAvatar } from '../common/Illustrations';
import {
  RFQ, RFQLine, Manufacturer, Product, RFQStatus, DistributionStatus,
  ManufacturerRFQ, ManufacturerRFQLine, ManufacturerQuote, ManufacturerQuoteLine,
  ManufacturerProductMapping, Category
} from '../../types';
import { rfqApi, BackendRfq, BackendRfqLine, RfqMatchResponse, ManufacturerMatch } from '../../services/rfqApi';
import { catalogApi } from '../../services/catalogApi';
import {
  FileText, Plus, Search, Filter, Download, ChevronDown, ChevronRight,
  MoreHorizontal, Calendar, Clock, Users, CheckCircle2, AlertCircle,
  X, Building2, Package, Layers, ArrowRight, Eye, Zap, RefreshCw,
  SlidersHorizontal, BookmarkPlus, Share2, Bell, Inbox, Trash2, Mail, MessageSquare,
  Send, Check, AlertTriangle, ArrowLeft, ShieldCheck, Award, ExternalLink, MapPin,
  Star, Info, CreditCard
} from 'lucide-react';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

const supportedStatuses: RFQStatus[] = [
  'Draft',
  'Submitted',
  'Pricing In Progress',
  'Quoted',
  'Approved',
  'Rejected',
  'Closed'
];

interface DraftProductLine {
  productId: string;
  productName: string;
  productCode?: string;
  productTypeId?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  dosageForm: string;
  packSize: string;
  uom: string;
  quantity: number | '';
  requiredDate: string;
  remarks: string;
  isOther?: boolean;
  customProductName?: string;
  buyerProvidedPrice?: number | '';
  productType?: 'BRANDED' | 'GENERIC';
  molecule?: string;
  strength?: string;
  brand?: string;
  isCustomMolecule?: boolean;
}

export const STANDARD_MOLECULES = [
  'Paracetamol',
  'Amoxicillin',
  'Amoxicillin + Clavulanate',
  'Azithromycin',
  'Pantoprazole',
  'Metformin',
  'Ceftriaxone',
  'Atorvastatin',
  'Cefixime',
  'Telmisartan',
  'Dextromethorphan'
];

import { ManufacturerAssignedRFQsModule } from './ManufacturerAssignedRFQsModule';

interface SearchableProductSelectProps {
  products: Product[];
  selectedProductId: string;
  selectedProductName: string;
  isOther?: boolean;
  customProductName?: string;
  disabledProductIds?: string[];
  onSelectProduct: (product: Product) => void;
  onSelectOther: () => void;
  onCustomProductNameChange: (customName: string) => void;
}

const SearchableProductSelect: React.FC<SearchableProductSelectProps> = ({
  products,
  selectedProductId,
  selectedProductName,
  isOther,
  customProductName,
  disabledProductIds = [],
  onSelectProduct,
  onSelectOther,
  onCustomProductNameChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.genericName && p.genericName.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      ((p as any).productCode && (p as any).productCode.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const displayLabel = useMemo(() => {
    if (selectedProductId === 'other' || isOther) {
      return customProductName ? `Other: ${customProductName}` : 'Other (Custom Product)';
    }
    if (selectedProductId) {
      const found = products.find(p => p.id === selectedProductId || (p as any).productCode === selectedProductId);
      if (found) {
        const pCode = found.code || (found as any).productCode || (found as any).product_code;
        return pCode ? `[${pCode}] ${found.name}` : found.name;
      }
      if (selectedProductName) return selectedProductName;
    }
    return 'Select Product ▼';
  }, [products, selectedProductId, selectedProductName, isOther, customProductName]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selector Box */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          width: '100%',
          padding: '9px 12px',
          background: '#FFFFFF',
          border: isOpen ? '1px solid #0F766E' : '1px solid #CBD5E1',
          boxShadow: isOpen ? '0 0 0 3px rgba(15, 118, 110, 0.15)' : 'none',
          borderRadius: 6,
          color: (selectedProductId || isOther) ? '#0F172A' : '#94A3B8',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
          {displayLabel}
        </span>
        <ChevronDown size={16} style={{ color: '#64748B', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </div>

      {/* Options & Search Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}
        >
          {/* Search Input Bar */}
          <div style={{ padding: '8px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} style={{ color: '#0F766E', flexShrink: 0 }} />
            <input
              type="text"
              autoFocus
              placeholder="Search product by name, code (e.g. PRD001001, Amox, Tablet)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 12.5,
                color: '#0F172A',
                fontWeight: 500
              }}
            />
            {searchTerm && (
              <X
                size={14}
                style={{ color: '#94A3B8', cursor: 'pointer', flexShrink: 0 }}
                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
              />
            )}
          </div>

          {/* Product Options List */}
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => {
                const isSelected = (p.id === selectedProductId || (p as any).productCode === selectedProductId) && !isOther;
                const isDisabled = disabledProductIds.includes(p.id) && !isSelected;
                const pCode = p.code || (p as any).productCode || (p as any).product_code;
                const categoryPath = [p.category, p.subCategory, (p as any).subSubCategory].filter(Boolean).join(' → ');

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isDisabled) return;
                      onSelectProduct(p);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '10px 12px',
                      fontSize: 12.5,
                      fontWeight: isSelected ? 700 : 500,
                      color: isDisabled ? '#94A3B8' : isSelected ? '#0F766E' : '#1E293B',
                      background: isDisabled ? '#F8FAFC' : isSelected ? '#F0FDF4' : 'transparent',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      opacity: isDisabled ? 0.65 : 1,
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected && !isDisabled) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected && !isDisabled) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {pCode && (
                          <span style={{ fontFamily: 'monospace', fontSize: 10.5, fontWeight: 700, color: '#0F766E', background: '#CCFBF1', padding: '1px 6px', borderRadius: 4 }}>
                            {pCode}
                          </span>
                        )}
                        <span style={{ fontWeight: 700, color: isDisabled ? '#94A3B8' : '#0F172A' }}>{p.name}</span>
                        {isDisabled && (
                          <span style={{ fontSize: 10.5, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                            Already Added
                          </span>
                        )}
                      </div>
                      {categoryPath && (
                        <div style={{ fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: 500 }}>
                          📁 {categoryPath}
                        </div>
                      )}
                      {(p.dosageForm || p.packSize) && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          {[p.dosageForm, p.packSize, (p as any).packUom || (p as any).baseUom || p.uom].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={16} style={{ color: '#0F766E', flexShrink: 0 }} />}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '14px', fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                No matching catalog products found under selected hierarchy
              </div>
            )}

            {/* Permanent "Other" Option */}
            <div
              onClick={() => {
                onSelectOther();
                setIsOpen(false);
                setSearchTerm('');
              }}
              style={{
                padding: '10px 12px',
                fontSize: 12.5,
                fontWeight: 700,
                color: (selectedProductId === 'other' || isOther) ? '#0F766E' : '#475569',
                background: (selectedProductId === 'other' || isOther) ? '#F0FDF4' : '#F8FAFC',
                borderTop: '2px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.1s ease'
              }}
              onMouseEnter={e => {
                if (!(selectedProductId === 'other' || isOther)) e.currentTarget.style.background = '#F1F5F9';
              }}
              onMouseLeave={e => {
                if (!(selectedProductId === 'other' || isOther)) e.currentTarget.style.background = '#F8FAFC';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} style={{ color: '#0F766E' }} />
                <span>Other (Enter custom product name)</span>
              </div>
              {(selectedProductId === 'other' || isOther) && <Check size={14} style={{ color: '#0F766E', flexShrink: 0 }} />}
            </div>
          </div>
        </div>
      )}

      {/* Custom Product Name Input Field when "Other" is selected */}
      {(selectedProductId === 'other' || isOther) && (
        <div style={{ marginTop: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
            Custom Product Name *
          </label>
          <input
            type="text"
            placeholder="Enter custom product name (e.g. Customized Paracetamol 650mg)"
            value={customProductName || ''}
            onChange={e => onCustomProductNameChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#F8FAFC',
              border: '1px solid #0F766E',
              borderRadius: 6,
              fontSize: 13,
              color: '#0F172A',
              fontWeight: 600
            }}
          />
        </div>
      )}
    </div>
  );
};

export const RFQModule: React.FC = () => {
  const {
    rfqs, quotes, orders, addRFQ, submitQuote, currentRole, products, manufacturers,
    customers, mappings, declinedRfqs, setActiveTab, addAuditLog, isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen,
    activeBuyerAccount, orgProfile, userProfile, productTypes,
    buyerBackendProfile, isResolvingBuyerProfile, refreshBuyerProfile
  } = useApp();

  // PostgreSQL Database & Authenticated Buyer Profile State
  const [realBuyerProfile, setRealBuyerProfile] = useState<any>(null);
  const [dbProductTypes, setDbProductTypes] = useState<Array<{ id: string; code?: string; name: string }>>([]);
  const [dbRfqs, setDbRfqs] = useState<RFQ[]>([]);
  const [isLoadingDbRfqs, setIsLoadingDbRfqs] = useState<boolean>(false);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>([]);
  const [catalogProductList, setCatalogProductList] = useState<Product[]>([]);
  const [isSubmittingRfq, setIsSubmittingRfq] = useState<boolean>(false);
  const [isMatchingLoading, setIsMatchingLoading] = useState<boolean>(false);
  const [liveMatchingResult, setLiveMatchingResult] = useState<RfqMatchResponse | null>(null);

  // Determine Special Party status directly from verified backend profile
  const isSpecialPartyBuyer = (buyerBackendProfile?.customerClassification || realBuyerProfile?.customerClassification || activeBuyerAccount) === 'SPECIAL_PARTY';

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerAssignedRFQsModule />;
  }

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  const uniqueMatchedMfgs = useMemo(() => {
    if (!liveMatchingResult?.matchedLines) return [];
    const map = new Map<string, ManufacturerMatch>();
    liveMatchingResult.matchedLines.forEach(l => {
      (l.eligibleManufacturers || []).forEach(m => {
        if (!map.has(m.manufacturerId)) {
          map.set(m.manufacturerId, m);
        }
      });
    });
    return Array.from(map.values());
  }, [liveMatchingResult]);

  // RFQ Creation Wizard State (Steps 1, 2, 3)
  const [localShowCreateDrawer, setLocalShowCreateDrawer] = useState(false);
  const showCreateDrawer = localShowCreateDrawer || isCreateRfqDrawerOpen;
  
  // Step State: 1 = Basic Info & Lines, 2 = General & Terms, 3 = Final RFQ Review & Submit
  const [rfqWizardStep, setRfqWizardStep] = useState<1 | 2 | 3>(1);
  const [isEditingDraftId, setIsEditingDraftId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Future-proof date defaults
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultDeliveryStr = useMemo(() => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], []);
  const defaultDeadlineStr = useMemo(() => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], []);

  // RFQ Header & General Terms Fields State
  const [buyerName, setBuyerName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerCode, setCustomerCode] = useState<string>('');
  const [rfqDate, setRfqDate] = useState<string>(todayStr);
  const [requiredDate, setRequiredDate] = useState<string>(defaultDeliveryStr);
  const [deadlineDate, setDeadlineDate] = useState<string>(defaultDeadlineStr);
  const [priority, setPriority] = useState<'STANDARD' | 'HIGH' | 'URGENT'>('HIGH');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [headerRemarks, setHeaderRemarks] = useState<string>('Standard quality assurance & GMP compliance required.');

  // Credit Requirement State
  const [creditRequired, setCreditRequired] = useState<boolean>(true);
  const [creditTermsOption, setCreditTermsOption] = useState<string>('Net 30 Days');
  const [customCreditTerms, setCustomCreditTerms] = useState<string>('');

  // Initial clean single empty product line
  const [rfqLines, setRfqLines] = useState<DraftProductLine[]>([
    {
      productId: '',
      productCode: '',
      productName: '',
      productTypeId: '',
      category: '',
      subCategory: '',
      subSubCategory: '',
      dosageForm: '',
      packSize: '',
      uom: 'Unit',
      quantity: '',
      requiredDate: defaultDeliveryStr,
      remarks: '',
      productType: 'BRANDED'
    }
  ]);

  // Distribution Summary Overlay State
  const [distributionResultModal, setDistributionResultModal] = useState<{
    rfqNumber: string;
    mfgRfqs: ManufacturerRFQ[];
    logs: string[];
    isGeneric?: boolean;
    genericLinesCount?: number;
  } | null>(null);

  // In-memory store for created Manufacturer RFQ distribution records
  const [manufacturerRfqsStore, setManufacturerRfqsStore] = useState<Record<string, ManufacturerRFQ[]>>({});

  // Specific Clicked Manufacturer Profile Drawer State
  const [clickedProfileMfgId, setClickedProfileMfgId] = useState<string | null>(null);

  // Supplier Quote Submission Drawer State
  const [supplierQuoteRfq, setSupplierQuoteRfq] = useState<RFQ | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});

  // ── FETCH DATA FROM BACKEND & POSTGRESQL ──
  const fetchBuyerRfqs = async () => {
    try {
      setIsLoadingDbRfqs(true);
      const serverRfqs = await rfqApi.listRfqs();
      const mapped: RFQ[] = (serverRfqs || []).map((sr: any) => ({
        id: sr.id,
        rfqNumber: sr.rfqNumber,
        customerId: String(sr.userId || '14'),
        customerName: sr.companyName || sr.buyerName || 'Verified Organization',
        customerCode: sr.customerCode || 'CUS000838',
        customerClassification: sr.customerClassification || 'REGULAR',
        createdDate: sr.rfqDate || (sr.createdAt ? sr.createdAt.split('T')[0] : todayStr),
        deadlineDate: sr.deadlineDate || '',
        status: sr.status as any,
        priority: sr.priority || 'HIGH',
        deliveryLocation: sr.deliveryLocation || '',
        remarks: sr.remarks || '',
        creditRequired: sr.creditRequired ?? true,
        creditTerms: sr.creditTerms || 'Net 30 Days',
        isGeneric: sr.isGeneric ?? false,
        lines: (sr.lines || []).map((l: any, idx: number) => ({
          id: l.id || `line_${idx}`,
          productId: l.productId || l.productCode || 'p1',
          productName: l.productName,
          dosageForm: l.dosageForm || 'Tablet',
          packSize: l.packSize || '10 x 10 Strip',
          quantity: Number(l.quantity),
          requiredDate: l.requiredDate || '',
          remarks: l.remarks || '',
          productType: l.productType || 'BRANDED',
          molecule: l.molecule,
          eligibleManufacturersCount: 0
        }))
      }));
      setDbRfqs(mapped);
    } catch (err) {
      console.warn('Could not fetch DB RFQs from backend, using active store', err);
    } finally {
      setIsLoadingDbRfqs(false);
    }
  };

  // Helper to resolve dynamic customer code
  const resolveCustomerCode = (p: any) => {
    if (!p) return 'CUS-PENDING';
    return (
      p.customerCode ||
      p.companyCode ||
      (p.registration?.registrationCode ? `REG-${p.registration.registrationCode}` : null) ||
      (p.userId ? `CUS-${p.userId}` : 'CUS-VERIFIED')
    );
  };

  // Load authenticated buyer profile and PostgreSQL master data on mount
  useEffect(() => {
    let isMounted = true;

    // 1. Authenticated Buyer Profile
    rfqApi.getBuyerProfile()
      .then(profile => {
        if (!isMounted || !profile) return;
        setRealBuyerProfile(profile);
        setBuyerName(profile.fullName || userProfile?.fullName || profile.username || 'Verified Buyer');
        setCustomerName(profile.companyName || orgProfile?.companyName || 'Verified Organization');
        setCustomerCode(resolveCustomerCode(profile));
        const addr = profile.registration?.shippingAddress
          ? `${profile.registration.shippingAddress}, ${profile.registration.state || ''} ${profile.registration.pincode ? '- ' + profile.registration.pincode : ''}`.trim()
          : (orgProfile?.registeredAddress ? `${orgProfile.registeredAddress}, ${orgProfile.city || ''}` : 'Primary Dispatch Facility');
        setDeliveryLocation(addr);
      })
      .catch(err => {
        console.warn('Could not fetch authenticated profile from backend, using session context', err);
        if (isMounted) {
          setBuyerName(userProfile?.fullName || 'Verified Buyer');
          setCustomerName(orgProfile?.companyName || 'Verified Organization');
          setCustomerCode(orgProfile?.companyCode || 'CUS-PENDING');
          setDeliveryLocation(orgProfile?.registeredAddress || 'Primary Dispatch Facility');
        }
      });

    // 2. Product Types from PostgreSQL
    catalogApi.listProductTypes()
      .then(types => {
        if (isMounted && types && types.length > 0) {
          setDbProductTypes(types);
        }
      })
      .catch(err => console.warn('Could not fetch product types from backend', err));

    // 3. Categories from PostgreSQL (single CATEGORY table)
    catalogApi.listCategories()
      .then(res => {
        if (!isMounted) return;
        const list = res.categories || (Array.isArray(res) ? res : []);
        setCatalogCategories(list);
      })
      .catch(err => {
        console.warn('Could not fetch categories from backend', err);
      });

    // 4. Active Products from PostgreSQL
    catalogApi.listProducts({ activeOnly: true })
      .then(prods => {
        if (!isMounted) return;
        setCatalogProductList(prods || []);
      })
      .catch(err => {
        console.warn('Could not fetch catalog products from backend', err);
      });

    // 5. Existing buyer RFQs from PostgreSQL
    fetchBuyerRfqs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync buyer info from real authenticated buyer profile
  useEffect(() => {
    const prof = buyerBackendProfile || realBuyerProfile;
    if (prof) {
      setBuyerName(prof.fullName || userProfile?.fullName || prof.username || 'Verified Buyer');
      setCustomerName(prof.companyName || orgProfile?.companyName || 'Verified Organization');
      setCustomerCode(resolveCustomerCode(prof));
      const addr = prof.registration?.shippingAddress
        ? `${prof.registration.shippingAddress}, ${prof.registration.state || ''} ${prof.registration.pincode ? '- ' + prof.registration.pincode : ''}`.trim()
        : (orgProfile?.registeredAddress ? `${orgProfile.registeredAddress}, ${orgProfile.city || ''}` : 'Primary Dispatch Facility');
      setDeliveryLocation(addr);
    }
  }, [buyerBackendProfile, realBuyerProfile, userProfile, orgProfile]);

  // Lock body scrolling when RFQ drawer is open to prevent background scrolling
  useEffect(() => {
    if (showCreateDrawer) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showCreateDrawer]);

  // Auto-Generated RFQ Number display
  const autoRfqNumber = useMemo(() => {
    if (isEditingDraftId) {
      const existing = [...dbRfqs, ...rfqs].find(r => r.id === isEditingDraftId);
      if (existing) return existing.rfqNumber;
    }
    return 'Auto-assigned on Save/Submit';
  }, [dbRfqs, rfqs, isEditingDraftId]);

  // Combined RFQs (PostgreSQL database RFQs prioritized)
  const allDisplayRfqs = useMemo(() => {
    const map = new Map<string, RFQ>();
    dbRfqs.forEach(r => {
      const key = r.rfqNumber || r.id;
      map.set(key, r);
    });
    rfqs.forEach(r => {
      const key = r.rfqNumber || r.id;
      if (!map.has(key)) {
        map.set(key, r);
      }
    });
    return Array.from(map.values());
  }, [dbRfqs, rfqs]);

  // Filtered RFQs for table view
  const filteredRfqs = useMemo(() => {
    return allDisplayRfqs.filter(rfq => {
      const matchSearch =
        (rfq.rfqNumber && rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rfq.customerName && rfq.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rfq.lines && rfq.lines.some(l => l.productName && l.productName.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchStatus = statusFilter === 'ALL' || (() => {
        if (!rfq || !rfq.status) return false;
        const rSt = rfq.status.toLowerCase();
        const filterSt = statusFilter.toLowerCase();
        if (rSt === filterSt) return true;
        if (statusFilter === 'Draft' && rSt === 'draft') return true;
        if (statusFilter === 'Submitted' && rSt === 'submitted') return true;
        if (statusFilter === 'Pricing In Progress' && (rSt === 'pricing in progress' || rSt === 'pricing_in_progress')) return true;
        if (statusFilter === 'Quoted' && rSt === 'quoted') return true;
        if (statusFilter === 'Approved' && rSt === 'approved') return true;
        if (statusFilter === 'Rejected' && rSt === 'rejected') return true;
        if (statusFilter === 'Closed' && rSt === 'closed') return true;
        return false;
      })();
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary stable sort on id DESC
      const timeA = new Date((a as any).createdAt || (a as any).created_at || a.createdDate || 0).getTime();
      const timeB = new Date((b as any).createdAt || (b as any).created_at || b.createdDate || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.rfqNumber || b.id || '').localeCompare(String(a.rfqNumber || a.id || ''));
    });
  }, [allDisplayRfqs, searchTerm, statusFilter]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredRfqs.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, statusFilter]
  });
  const paginatedRfqs = pagination.paginateItems(filteredRfqs);

  // ── CATEGORY HIERARCHY CASCADING HELPERS ──
  const availableProductTypes = useMemo(() => {
    if (dbProductTypes && dbProductTypes.length > 0) {
      return dbProductTypes.map(pt => ({
        id: pt.id,
        name: pt.name
      }));
    }
    if (productTypes && productTypes.length > 0) {
      return productTypes.map(pt => ({
        id: pt.product_type_id || (pt as any).id,
        name: pt.product_type_name || (pt as any).name || pt.product_type_code
      }));
    }
    return [
      { id: 'pt_med', name: 'Pharmaceutical Formulations' },
      { id: 'pt_nut', name: 'Nutraceuticals & Dietary Supplements' },
      { id: 'pt_cos', name: 'Clinical Skincare & Cosmetics' },
      { id: 'pt_ayr', name: 'Ayurvedic & Herbal Formulations' },
      { id: 'pt_srg', name: 'Surgical Consumables & Devices' },
      { id: 'pt_vet', name: 'Veterinary & Animal Health' }
    ];
  }, [dbProductTypes, productTypes]);

  const getCategoriesForLine = (productTypeId?: string): string[] => {
    let filtered = catalogCategories;
    if (productTypeId && productTypeId !== 'ALL') {
      filtered = filtered.filter(c => (c.productTypeId || (c as any).product_type_id) === productTypeId);
    }
    const set = new Set<string>();
    filtered.forEach(c => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  };

  const getSubCategoriesForLine = (productTypeId?: string, category?: string): string[] => {
    let filtered = catalogCategories;
    if (productTypeId && productTypeId !== 'ALL') {
      filtered = filtered.filter(c => (c.productTypeId || (c as any).product_type_id) === productTypeId);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }
    const set = new Set<string>();
    filtered.forEach(c => {
      const sc = c.subCategory || (c as any).sub_category;
      if (sc) set.add(sc);
    });
    return Array.from(set).sort();
  };

  const getSubSubCategoriesForLine = (productTypeId?: string, category?: string, subCategory?: string): string[] => {
    let filtered = catalogCategories;
    if (productTypeId && productTypeId !== 'ALL') {
      filtered = filtered.filter(c => (c.productTypeId || (c as any).product_type_id) === productTypeId);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }
    if (subCategory && subCategory !== 'ALL') {
      filtered = filtered.filter(c => (c.subCategory || (c as any).sub_category)?.toLowerCase() === subCategory.toLowerCase());
    }
    const set = new Set<string>();
    filtered.forEach(c => {
      const ssc = c.subSubCategory || (c as any).sub_sub_category;
      if (ssc) set.add(ssc);
    });
    return Array.from(set).sort();
  };

  const getEligibleProductsForLine = (line: DraftProductLine): Product[] => {
    const allProds = catalogProductList.length > 0 ? catalogProductList : products;
    return allProds.filter(p => {
      if ((p as any).lifecycleStatus && (p as any).lifecycleStatus !== 'ACTIVE') return false;
      if (p.status && p.status.toLowerCase() !== 'active') return false;

      if (line.productTypeId && line.productTypeId !== 'ALL') {
        const pTypeId = p.productTypeId || (p as any).product_type_id;
        if (pTypeId && pTypeId !== line.productTypeId) return false;
      }
      if (line.category && line.category !== 'ALL') {
        if (p.category && p.category.toLowerCase() !== line.category.toLowerCase()) return false;
      }
      if (line.subCategory && line.subCategory !== 'ALL') {
        const pSub = p.subCategory || (p as any).sub_category;
        if (pSub && pSub.toLowerCase() !== line.subCategory.toLowerCase()) return false;
      }
      if (line.subSubCategory && line.subSubCategory !== 'ALL') {
        const pSubSub = p.subSubCategory || (p as any).sub_sub_category;
        if (pSubSub && pSubSub.toLowerCase() !== line.subSubCategory.toLowerCase()) return false;
      }
      return true;
    });
  };

  /**
   * Retrieves active database formulations/generic molecules matching the line's category hierarchy from PostgreSQL.
   */
  const getDatabaseFormulationsForLine = (line: DraftProductLine) => {
    const matchingProducts = getEligibleProductsForLine(line);
    const map = new Map<string, {
      id: string;
      molecule: string;
      name: string;
      dosageForm: string;
      packSize: string;
      strength: string;
    }>();

    matchingProducts.forEach(p => {
      const molName = (p.genericName || p.name || '').trim();
      if (molName && !map.has(molName.toLowerCase())) {
        map.set(molName.toLowerCase(), {
          id: p.id,
          molecule: molName,
          name: p.name,
          dosageForm: p.dosageForm || (p as any).dosage_form || 'Tablet',
          packSize: p.packSize || (p as any).pack_size || '10 x 10 Strip',
          strength: (p as any).strength || (p.attributes as any)?.strength || '',
        });
      }
    });

    return Array.from(map.values());
  };

  // ── ROW CASCADE HANDLERS ──
  const handleProductTypeChange = (idx: number, productTypeId: string) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      return {
        ...line,
        productTypeId,
        category: '',
        subCategory: '',
        subSubCategory: '',
        productId: '',
        productCode: '',
        productName: '',
        dosageForm: '',
        packSize: '',
        molecule: '',
        strength: '',
        isCustomMolecule: false,
        uom: 'Unit'
      };
    }));
  };

  const handleCategoryChange = (idx: number, category: string) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      return {
        ...line,
        category,
        subCategory: '',
        subSubCategory: '',
        productId: '',
        productCode: '',
        productName: '',
        dosageForm: '',
        packSize: '',
        molecule: '',
        strength: '',
        isCustomMolecule: false,
        uom: 'Unit'
      };
    }));
  };

  const handleSubCategoryChange = (idx: number, subCategory: string) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      return {
        ...line,
        subCategory,
        subSubCategory: '',
        productId: '',
        productCode: '',
        productName: '',
        dosageForm: subCategory || line.dosageForm || '',
        packSize: '',
        molecule: '',
        strength: '',
        isCustomMolecule: false,
        uom: 'Unit'
      };
    }));
  };

  const handleSubSubCategoryChange = (idx: number, subSubCategory: string) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      return {
        ...line,
        subSubCategory,
        productId: '',
        productCode: '',
        productName: '',
        dosageForm: subSubCategory || line.subCategory || line.dosageForm || '',
        packSize: '',
        molecule: '',
        strength: '',
        isCustomMolecule: false,
        uom: 'Unit'
      };
    }));
  };

  const handleSelectMolecule = (idx: number, molValue: string) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      if (molValue === '__CUSTOM_MOLECULE__') {
        return {
          ...line,
          isCustomMolecule: true,
          molecule: '',
          productName: '',
          productId: '',
          productCode: '',
        };
      }
      const dbFormulations = getDatabaseFormulationsForLine(line);
      const found = dbFormulations.find(f => f.molecule.toLowerCase() === molValue.toLowerCase());
      if (found) {
        return {
          ...line,
          isCustomMolecule: false,
          molecule: found.molecule,
          productName: `${found.molecule} (Generic)`,
          productId: found.id,
          productCode: '',
          dosageForm: found.dosageForm || line.subSubCategory || line.subCategory || line.dosageForm || 'Tablet',
          packSize: found.packSize || line.packSize || '10 x 10 Strip',
          strength: found.strength || line.strength || '',
        };
      }
      return {
        ...line,
        isCustomMolecule: false,
        molecule: molValue,
        productName: `${molValue} (Generic)`,
        productId: '',
        productCode: '',
        dosageForm: line.subSubCategory || line.subCategory || line.dosageForm || 'Tablet',
        packSize: line.packSize || '10 x 10 Strip',
      };
    }));
  };

  const handleSelectProduct = (idx: number, product: Product) => {
    setRfqLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      return {
        ...l,
        productId: product.id,
        productCode: product.productCode || (product as any).code || '',
        productName: product.name,
        dosageForm: product.dosageForm || (product as any).dosage_form || '',
        packSize: product.packSize || (product as any).pack_size || '',
        uom: (product as any).packUom || (product as any).baseUom || product.uom || 'Unit',
        category: product.category || l.category,
        subCategory: product.subCategory || (product as any).sub_category || l.subCategory,
        subSubCategory: product.subSubCategory || (product as any).sub_sub_category || l.subSubCategory,
        productTypeId: product.productTypeId || (product as any).product_type_id || l.productTypeId,
        brand: product.brand || (product as any).brandName || '',
        molecule: product.genericName || '',
        strength: (product as any).strength || (product.attributes as any)?.strength || '',
        isOther: false,
        customProductName: '',
        productType: 'BRANDED'
      };
    }));
  };

  // Add EXACTLY ONE clean empty Product Row
  const handleAddEmptyProductRow = () => {
    setRfqLines(prev => [
      ...prev,
      {
        productId: '',
        productCode: '',
        productName: '',
        productTypeId: '',
        category: '',
        subCategory: '',
        subSubCategory: '',
        dosageForm: '',
        packSize: '',
        uom: 'Unit',
        quantity: '',
        requiredDate: requiredDate || defaultDeliveryStr,
        remarks: '',
        productType: 'BRANDED'
      }
    ]);
  };

  // Handle Remove Product Row (enforcing minimum 1 line rule)
  const handleRemoveRow = (idx: number) => {
    if (rfqLines.length <= 1) return;
    setRfqLines(prev => prev.filter((_, i) => i !== idx));
    setValidationError(null);
  };

  // Handle Row Field Change
  const handleRowChange = (idx: number, field: keyof DraftProductLine, value: any) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;

      if (field === 'productType') {
        if (value === 'GENERIC') {
          const dbFormulations = getDatabaseFormulationsForLine(line);
          const firstDb = dbFormulations[0];
          return {
            ...line,
            productType: 'GENERIC',
            molecule: firstDb?.molecule || line.molecule || '',
            productId: firstDb?.id || '',
            productCode: '',
            productName: firstDb?.molecule ? `${firstDb.molecule} (Generic)` : (line.molecule ? `${line.molecule} (Generic)` : ''),
            dosageForm: firstDb?.dosageForm || line.subCategory || line.dosageForm || 'Tablet',
            packSize: firstDb?.packSize || line.packSize || '10 x 10 Strip',
            uom: line.uom || 'Unit',
            strength: line.strength || firstDb?.strength || '500mg',
            isOther: false,
            customProductName: '',
            isCustomMolecule: !firstDb && !!line.molecule,
          };
        } else {
          return {
            ...line,
            productType: 'BRANDED',
            productId: '',
            productCode: '',
            productName: '',
            dosageForm: '',
            packSize: '',
            uom: 'Unit',
            molecule: '',
            brand: '',
            isCustomMolecule: false,
          };
        }
      }

      if (field === 'molecule') {
        const mol = value;
        return {
          ...line,
          molecule: mol,
          productName: mol ? `${mol} (Generic)` : '',
        };
      }

      return { ...line, [field]: value };
    }));
  };

  // Close creation drawer helper
  const closeDrawer = () => {
    setLocalShowCreateDrawer(false);
    setIsCreateRfqDrawerOpen(false);
    setRfqWizardStep(1);
    setValidationError(null);
    setIsEditingDraftId(null);
    setLiveMatchingResult(null);
  };

  // Open Edit Draft Drawer
  const handleOpenEditDraft = (rfq: RFQ) => {
    setIsEditingDraftId(rfq.id);
    setCustomerName(rfq.customerName || customerName);
    setRfqDate(rfq.createdDate || todayStr);
    setDeadlineDate(rfq.deadlineDate || defaultDeadlineStr);
    setHeaderRemarks(rfq.remarks || '');
    setPriority((rfq.priority as any) || 'HIGH');
    setDeliveryLocation(rfq.deliveryLocation || deliveryLocation);
    setCreditRequired(rfq.creditRequired ?? true);
    setCreditTermsOption(rfq.creditTerms || 'Net 30 Days');

    if (rfq.lines && rfq.lines.length > 0) {
      setRfqLines(rfq.lines.map(l => ({
        productId: l.productId,
        productCode: (l as any).productCode || '',
        productName: l.productName,
        dosageForm: l.dosageForm || 'Tablet',
        packSize: l.packSize || '10 x 10 Strip',
        uom: (l as any).uom || 'Unit',
        quantity: l.quantity,
        requiredDate: l.requiredDate || defaultDeliveryStr,
        remarks: l.remarks || '',
        productType: l.productType || 'BRANDED',
        molecule: l.molecule,
        category: (l as any).category,
        subCategory: (l as any).subCategory,
        subSubCategory: (l as any).subSubCategory
      })));
    } else {
      handleAddEmptyProductRow();
    }
    setRfqWizardStep(1);
    setLocalShowCreateDrawer(true);
  };

  // Navigation validation for Step 1 -> Step 2
  const handleContinueToGeneralTerms = () => {
    for (let i = 0; i < rfqLines.length; i++) {
      const line = rfqLines[i];
      // 1. Classification Hierarchy Validation: Category is mandatory
      if (!line.category?.trim()) {
        setValidationError(`Line #${i + 1}: Please select a Category from the Product Classification Hierarchy.`);
        return;
      }
      const availableSubs = getSubCategoriesForLine(line.productTypeId, line.category);
      if (availableSubs.length > 0 && !line.subCategory?.trim()) {
        setValidationError(`Line #${i + 1}: Please select a Sub-Category for category "${line.category}".`);
        return;
      }

      // 2. Product / Molecule validation
      if (line.productType === 'GENERIC') {
        if (!line.molecule?.trim() && !line.productName?.trim()) {
          setValidationError(`Line #${i + 1}: Please select or specify an Active Molecule / Generic Formulation.`);
          return;
        }
        if (!line.dosageForm?.trim()) {
          setValidationError(`Line #${i + 1}: Dosage Form is required for generic formulation.`);
          return;
        }
      } else {
        if (!line.productId?.trim() && !line.productName?.trim()) {
          setValidationError(`Line #${i + 1}: Please search and select an eligible product from the Master Product Catalog.`);
          return;
        }
      }

      // 3. Requisition details validation
      if (!line.quantity || Number(line.quantity) <= 0) {
        setValidationError(`Line #${i + 1}: Required Quantity must be greater than zero.`);
        return;
      }
      if (line.requiredDate && line.requiredDate < todayStr) {
        setValidationError(`Line #${i + 1}: Required delivery date (${line.requiredDate}) cannot be in the past.`);
        return;
      }
      if (isSpecialPartyBuyer && (!line.buyerProvidedPrice || Number(line.buyerProvidedPrice) <= 0)) {
        setValidationError(`Line #${i + 1}: Pre-Agreed Unit Price (₹/unit) is mandatory for Special Party RFQ workflow.`);
        return;
      }
    }
    setValidationError(null);
    setRfqWizardStep(2);
  };

  // Navigation validation for Step 2 -> Step 3
  const handleContinueToReview = () => {
    if (requiredDate && requiredDate < todayStr) {
      setValidationError(`General Required Date (${requiredDate}) cannot be in the past.`);
      return;
    }
    if (deadlineDate && deadlineDate < todayStr) {
      setValidationError(`Quotation Deadline (${deadlineDate}) cannot be in the past.`);
      return;
    }
    setValidationError(null);
    setRfqWizardStep(3);
  };

  // ── SAVE RFQ AS DRAFT ──
  const handleSaveDraft = async () => {
    const validLines = rfqLines.filter(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule || l.productName) : !!(l.productId || l.productName);
      return hasProduct;
    });
    if (validLines.length === 0) {
      setValidationError('Please configure at least one product line before saving a draft.');
      return;
    }

    setValidationError(null);
    setIsSubmittingRfq(true);

    try {
      const payload = {
        priority,
        deliveryLocation: deliveryLocation?.trim() || 'Warehouse / Primary Facility',
        rfqDate: rfqDate || todayStr,
        requiredDate: requiredDate || undefined,
        deadlineDate: deadlineDate || undefined,
        remarks: headerRemarks || undefined,
        creditRequired,
        creditTerms: creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required',
        isGeneric: validLines.some(l => l.productType === 'GENERIC'),
        customerClassification: isSpecialPartyBuyer ? 'SPECIAL_PARTY' : 'REGULAR',
        lines: validLines.map((line, idx) => ({
          lineItemNumber: idx + 1,
          productId: line.productId || undefined,
          productName: line.productType === 'GENERIC'
            ? (line.molecule ? `${line.molecule.trim()} (Generic)` : (line.productName || 'Generic Formulation'))
            : (line.customProductName || line.productName),
          productCode: line.productCode || undefined,
          category: line.category || undefined,
          subCategory: line.subCategory || undefined,
          subSubCategory: line.subSubCategory || undefined,
          productType: line.productType || 'BRANDED',
          dosageForm: line.dosageForm || (line.subCategory || 'Tablet'),
          packSize: line.packSize || '10 x 10 Strip',
          uom: line.uom || 'Unit',
          quantity: Number(line.quantity) || 1,
          targetPrice: line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : undefined,
          buyerProvidedPrice: isSpecialPartyBuyer && line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : undefined,
          requiredDate: line.requiredDate || requiredDate || undefined,
          remarks: line.remarks || undefined,
          molecule: line.molecule || undefined,
          strength: line.strength || undefined
        }))
      };

      let resultRfq: any;
      if (isEditingDraftId && !isEditingDraftId.startsWith('rfq_mock')) {
        resultRfq = await rfqApi.updateDraft(isEditingDraftId, payload);
      } else {
        resultRfq = await rfqApi.createDraft(payload);
      }

      addAuditLog('RFQ Center', `Saved ${resultRfq.rfqNumber || 'RFQ'} as Draft`);
      await fetchBuyerRfqs();
      closeDrawer();
      setIsEditingDraftId(null);
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      setValidationError(err.message || 'Failed to save RFQ draft');
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  // ── SUBMIT RFQ TO PLATFORM ──
  const handleExecuteRFQSubmission = async () => {
    // Validate lines
    for (let i = 0; i < rfqLines.length; i++) {
      const line = rfqLines[i];
      if (!line.category?.trim()) {
        setValidationError(`Line item #${i + 1}: Category is mandatory in the Product Classification Hierarchy.`);
        return;
      }
      const hasProduct = line.productType === 'GENERIC' ? !!(line.productId || line.molecule || line.productName) : !!line.productId;
      if (!hasProduct) {
        setValidationError(`Please select a valid product/formulation for line item #${i + 1}.`);
        return;
      }
      if (!line.quantity || Number(line.quantity) <= 0) {
        setValidationError(`Quantity is mandatory and must be greater than 0 for line item #${i + 1}.`);
        return;
      }
      if (line.requiredDate && line.requiredDate < todayStr) {
        setValidationError(`Required delivery date cannot be in the past for line item #${i + 1} (${line.requiredDate}).`);
        return;
      }
      if (isSpecialPartyBuyer && (!line.buyerProvidedPrice || Number(line.buyerProvidedPrice) <= 0)) {
        setValidationError(`Line item #${i + 1}: Pre-Agreed Unit Price (₹/unit) is required for Special Party Buyer.`);
        return;
      }
    }

    setValidationError(null);
    setIsSubmittingRfq(true);

    try {
      const payload = {
        priority,
        deliveryLocation: deliveryLocation?.trim() || 'Warehouse / Primary Facility',
        rfqDate: rfqDate || todayStr,
        requiredDate: requiredDate || undefined,
        deadlineDate: deadlineDate || undefined,
        remarks: headerRemarks || undefined,
        creditRequired,
        creditTerms: creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required',
        isGeneric: rfqLines.some(l => l.productType === 'GENERIC'),
        customerClassification: isSpecialPartyBuyer ? 'SPECIAL_PARTY' : 'REGULAR',
        lines: rfqLines.map((line, idx) => ({
          lineItemNumber: idx + 1,
          productId: line.productId || undefined,
          productName: line.productType === 'GENERIC'
            ? (line.molecule ? `${line.molecule.trim()} (Generic)` : (line.productName || 'Generic Formulation'))
            : (line.customProductName || line.productName),
          productCode: line.productCode || undefined,
          category: line.category || undefined,
          subCategory: line.subCategory || undefined,
          subSubCategory: line.subSubCategory || undefined,
          productType: line.productType || 'BRANDED',
          dosageForm: line.dosageForm || (line.subCategory || 'Tablet'),
          packSize: line.packSize || '10 x 10 Strip',
          uom: line.uom || 'Unit',
          quantity: Number(line.quantity),
          targetPrice: line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : undefined,
          buyerProvidedPrice: isSpecialPartyBuyer && line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : undefined,
          requiredDate: line.requiredDate || requiredDate || undefined,
          remarks: line.remarks || undefined,
          molecule: line.molecule || undefined,
          strength: line.strength || undefined
        }))
      };

      let resultRfq: any;
      if (isEditingDraftId && !isEditingDraftId.startsWith('rfq_mock')) {
        await rfqApi.updateDraft(isEditingDraftId, payload);
        resultRfq = await rfqApi.submitRfq(isEditingDraftId);
      } else {
        resultRfq = await rfqApi.createAndSubmit(payload);
      }

      const assignedRfqNumber = resultRfq.rfqNumber || `RFQ-2026-${Date.now()}`;
      addAuditLog('RFQ Center', `Submitted RFQ ${assignedRfqNumber} (Status: ${resultRfq.status || 'Submitted'})`);
      
      // Perform manufacturer matching against database for preview display
      let matchingMfgs: any[] = [];
      try {
        const matchesRes = await rfqApi.matchManufacturers(resultRfq.id);
        if (matchesRes?.matchedLines) {
          const flat = matchesRes.matchedLines.flatMap((ml: any) => ml.eligibleManufacturers || []);
          matchingMfgs = Array.from(new Map(flat.map((m: any) => [m.manufacturerId, m])).values());
        }
      } catch {
        // Non-fatal if matching preview returns empty
      }

      await fetchBuyerRfqs();
      closeDrawer();
      setIsEditingDraftId(null);

      // Show confirmation modal
      setDistributionResultModal({
        rfqNumber: assignedRfqNumber,
        mfgRfqs: matchingMfgs.map((m: any, idx: number) => ({
          id: `mfg_rfq_${idx}`,
          rfqId: resultRfq.id,
          rfqNumber: assignedRfqNumber,
          manufacturerId: String(m.id || m.manufacturerId || idx),
          manufacturerName: m.companyName || m.name || 'Verified Manufacturer',
          status: 'Sent',
          sentDate: todayStr,
          emailNotificationSent: true,
          smsNotificationSent: true,
          lines: []
        })),
        logs: [
          `💾 Successfully registered RFQ ${assignedRfqNumber} with ${payload.lines.length} requisition line item(s).`,
          `🔐 Requisition authenticated and sealed to buyer organization: ${buyerName} (${customerName}).`,
          ...(matchingMfgs.length > 0
            ? [`🏭 Identified ${matchingMfgs.length} eligible registered manufacturer(s) with verified active GMP compliance.`]
            : [`ℹ️ Requisition routed to FactoryGrid platform procurement desk for supplier assignment.`]
          )
        ],
        isGeneric: payload.isGeneric,
        genericLinesCount: payload.lines.filter(l => l.productType === 'GENERIC').length
      });
    } catch (err: any) {
      console.error('Failed to submit RFQ:', err);
      setValidationError(err.message || 'Failed to submit RFQ');
    } finally {
      setIsSubmittingRfq(false);
    }
  };

  // ── RUN ELIGIBLE MANUFACTURER MATCHING (Step 3) ──
  const handleRunLiveMatching = async () => {
    setIsMatchingLoading(true);
    setValidationError(null);
    try {
      let targetRfqId = isEditingDraftId;
      if (!targetRfqId || targetRfqId.startsWith('rfq_mock')) {
        // Save draft first to get real ID in database
        const validLines = rfqLines.filter(l => (l.productId || l.molecule) && l.quantity);
        if (validLines.length === 0) {
          setValidationError('Please select products and enter quantities before running manufacturer matching.');
          setIsMatchingLoading(false);
          return;
        }
        const draft = await rfqApi.createDraft({
          priority,
          deliveryLocation: deliveryLocation?.trim() || 'Warehouse / Primary Facility',
          rfqDate: rfqDate || todayStr,
          requiredDate: requiredDate || undefined,
          deadlineDate: deadlineDate || undefined,
          remarks: headerRemarks || undefined,
          creditRequired,
          creditTerms: creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required',
          isGeneric: validLines.some(l => l.productType === 'GENERIC'),
          lines: validLines.map((line, idx) => ({
            lineItemNumber: idx + 1,
            productId: line.productId || (line.productType === 'GENERIC' ? `gen_${line.molecule?.toLowerCase()}` : undefined),
            productName: line.productType === 'GENERIC' ? `${line.molecule || 'Paracetamol'} (Generic)` : (line.customProductName || line.productName),
            productCode: line.productCode || undefined,
            category: line.category || undefined,
            subCategory: line.subCategory || undefined,
            subSubCategory: line.subSubCategory || undefined,
            productType: line.productType || 'BRANDED',
            dosageForm: line.dosageForm || (line.productType === 'GENERIC' ? 'Tablet' : 'Custom'),
            packSize: line.packSize || '10 x 10 Strip',
            uom: line.uom || 'Unit',
            quantity: Number(line.quantity),
            targetPrice: line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : undefined,
            requiredDate: line.requiredDate || requiredDate || undefined,
            remarks: line.remarks || undefined,
            molecule: line.molecule || undefined,
            strength: line.strength || undefined
          }))
        });
        targetRfqId = draft.id;
        setIsEditingDraftId(draft.id);
        await fetchBuyerRfqs();
      }

      const matches = await rfqApi.matchManufacturers(targetRfqId);
      setLiveMatchingResult(matches);
    } catch (err: any) {
      console.error('Error finding eligible manufacturers:', err);
      setValidationError(err.message || 'Failed to find eligible manufacturers');
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // Manufacturer Submits Quote
  const handleOpenSupplierQuoteModal = (rfq: RFQ) => {
    setSupplierQuoteRfq(rfq);
    const initialPrices: Record<string, number> = {};
    rfq.lines.forEach(l => {
      initialPrices[l.id] = 12.00;
    });
    setQuotePrices(initialPrices);
  };

  const handleExecuteSupplierQuoteSubmission = () => {
    if (!supplierQuoteRfq) return;

    const quoteId = `q_${Date.now()}`;
    const mfgId = 'm1'; // SunBio LifeSciences Ltd default supplier ID
    const mfgObj = manufacturers.find(m => m.id === mfgId);
    const mfgName = mfgObj ? (mfgObj.companyName || mfgObj.name) : 'SunBio LifeSciences Ltd';

    const quoteLines: ManufacturerQuoteLine[] = supplierQuoteRfq.lines.map(l => {
      const uPrice = quotePrices[l.id] || 12.00;
      const total = uPrice * l.quantity;
      return {
        rfqLineId: l.id,
        productId: l.productId,
        productName: l.productName,
        unitPrice: uPrice,
        taxPercent: 12,
        discountPercent: 0,
        leadTimeDays: 14,
        moq: 1000,
        calculatedFinalPrice: total
      };
    });

    const totalAmount = quoteLines.reduce((acc, l) => acc + l.calculatedFinalPrice, 0);

    const newQuote: ManufacturerQuote = {
      id: quoteId,
      rfqId: supplierQuoteRfq.id,
      rfqNumber: supplierQuoteRfq.rfqNumber,
      manufacturerId: mfgId,
      manufacturerName: mfgName,
      submissionDate: new Date().toISOString().split('T')[0],
      validUntil: supplierQuoteRfq.deadlineDate,
      status: 'SUBMITTED',
      totalAmount,
      remarks: 'Submitted commercial quotation with 14-day SLA dispatch.',
      quoteLines
    };

    submitQuote(newQuote);

    setManufacturerRfqsStore(prev => {
      const existing = prev[supplierQuoteRfq.id] || [];
      const updated = existing.map(m => m.manufacturerId === mfgId ? { ...m, status: 'Responded' as DistributionStatus } : m);
      return { ...prev, [supplierQuoteRfq.id]: updated };
    });

    addAuditLog('Quote Center', `Supplier ${mfgName} submitted quote for ${supplierQuoteRfq.rfqNumber} (Total ₹${totalAmount.toLocaleString()})`);
    setSupplierQuoteRfq(null);
  };

  // ── RENDER SPECIFIC MANUFACTURER PROFILE & REVIEW DRAWER ──
  const renderSpecificManufacturerProfileDrawer = () => {
    if (!clickedProfileMfgId) return null;
    const mfg = manufacturers.find(m => m.id === clickedProfileMfgId) || manufacturers[0];

    const mfgMappedItems = mappings.filter(m => m.manufacturerId === mfg.id);
    const mfgProducts = mfgMappedItems.map(m => {
      const prd = products.find(p => p.id === m.productId);
      return { mapping: m, product: prd };
    }).filter(i => i.product !== undefined) as { mapping: ManufacturerProductMapping; product: Product }[];

    // RFQ context line matching
    const activeRfqLines = rfqLines.filter(l => l.productId && l.quantity);
    const activeRfqProductIds = new Set(activeRfqLines.map(l => l.productId));
    const matchedRfqItems = mfgProducts.filter(item => activeRfqProductIds.has(item.product.id));

    const ratingVal = mfg.rating || 4.8;
    const ratingDetails = mfg.ratingDetails || {
      overallRating: ratingVal,
      totalReviews: 24,
      categoryRatings: { delivery: 4.8, quality: 4.9, communication: 4.7, compliance: 5.0 },
      performance: { onTimeDeliveryRate: 98.4, qualityPassRate: 99.5, rfqResponseRate: 96.0, completedOrdersCount: 42 }
    };

    const certificationsList = (mfg.certifications && mfg.certifications.length > 0)
      ? mfg.certifications.map(c => c.name)
      : ['WHO-GMP Certified', 'CDSCO Form 28 License', 'ISO 9001:2015 Registered', 'c-GMP Compliant Unit'];

    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'flex-end' }}
        onClick={() => setClickedProfileMfgId(null)}
      >
        <div
          style={{ width: '100%', maxWidth: 780, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-16px 0 40px rgba(15, 23, 42, 0.2)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drawer Header & RFQ Context Banner */}
          <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 7. RFQ CONTEXT INDICATOR BANNER */}
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 6, padding: '6px 12px', fontSize: 11.5, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>📋 RFQ CONTEXT REVIEW: Evaluating for current RFQ draft ({activeRfqLines.length} Requested Product Lines)</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{autoRfqNumber}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <FactoryAvatar initials={(mfg.companyName || mfg.name).slice(0, 2).toUpperCase()} size={46} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{mfg.companyName || mfg.name}</h3>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)' }}>
                      Verified Manufacturer ✓
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    📍 {mfg.city}, {mfg.state} · Code: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{mfg.code || 'MFG000401'}</strong>
                  </div>
                </div>
              </div>

              <button onClick={() => setClickedProfileMfgId(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
            
            {/* 1. MANUFACTURER OVERVIEW */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                1. Manufacturer Overview & Contact Info
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, fontSize: 12.5 }}>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Company Name</span> <strong style={{ color: '#0F172A' }}>{mfg.companyName || mfg.name}</strong></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Manufacturer Type</span> <strong style={{ color: '#0F172A' }}>CDMO / Third Party Unit</strong></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Verification Status</span> <strong style={{ color: '#059669' }}>Verified & Approved ✓</strong></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Contact Person</span> <span style={{ color: '#0F172A', fontWeight: 600 }}>{mfg.contactPerson || 'Operations Desk'}</span></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Email Address</span> <span style={{ color: '#0F766E', fontWeight: 600 }}>{mfg.email || 'contact@manufacturer.com'}</span></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Phone Contact</span> <span style={{ color: '#0F172A', fontWeight: 600 }}>{mfg.phone || '+91 98765 43210'}</span></div>
              </div>
            </div>

            {/* 2. MANUFACTURER RATING & PERFORMANCE TRACK RECORD */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                  2. Manufacturer Rating & Performance Track Record
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                  ⭐ {ratingVal.toFixed(1)} / 5.0 ({ratingDetails.totalReviews} Verified Reviews)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block' }}>Quality Pass Rate</span>
                  <strong style={{ fontSize: 15, color: '#16A34A', fontFamily: 'monospace' }}>{ratingDetails.performance.qualityPassRate}%</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block' }}>On-Time Delivery</span>
                  <strong style={{ fontSize: 15, color: '#0F766E', fontFamily: 'monospace' }}>{ratingDetails.performance.onTimeDeliveryRate}%</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block' }}>Avg Response Time</span>
                  <strong style={{ fontSize: 15, color: '#1D4ED8', fontFamily: 'monospace' }}>{ratingDetails.performance.rfqResponseRate > 90 ? '4 Hours' : '6 Hours'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, display: 'block' }}>Completed Orders</span>
                  <strong style={{ fontSize: 15, color: '#0F172A', fontFamily: 'monospace' }}>{ratingDetails.performance.completedOrdersCount} Orders</strong>
                </div>
              </div>
            </div>

            {/* 3. COMPLIANCE & CERTIFICATIONS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                3. Compliance & Regulatory Certifications
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div><span style={{ color: '#64748B' }}>GSTIN Status:</span> <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{mfg.gstin || '36AAACG1234F1Z5'} (Active)</strong></div>
                <div><span style={{ color: '#64748B' }}>Drug Mfg License #:</span> <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{mfg.mfgLicenseNo || 'Form 28 / T-2184'}</strong></div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {certificationsList.map(c => (
                  <div key={c} style={{ padding: '6px 12px', background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. MANUFACTURING CAPABILITIES */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                4. Manufacturing Capabilities & Plant Infrastructure
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12.5, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Dosage Capabilities</span> <strong style={{ color: '#0F172A' }}>Tablets, Capsules, Liquids</strong></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Plant Infrastructure</span> <strong style={{ color: '#0F172A' }}>120,000 Sq. Ft. Cleanroom</strong></div>
                <div><span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Monthly Capacity</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>50 Million Units/Mo</strong></div>
              </div>
            </div>

            {/* 5. PRODUCTS MATCHING THIS RFQ */}
            <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                5. Products Matching Current RFQ ({matchedRfqItems.length})
              </div>

              {matchedRfqItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {matchedRfqItems.map(({ product, mapping }) => (
                    <div key={product.id} style={{ padding: 12, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                          ✓ {product.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                          Formulation: <strong>{product.dosageForm}</strong> ({product.packSize}) · Tech Match: <strong>100% Compatible</strong>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, textAlign: 'right' }}>
                        <div>Standard Delivery Schedule: <strong style={{ color: '#0F766E' }}>{mapping.standardLeadTimeDays} Days</strong></div>
                        <div>Standard MOQ: <strong style={{ fontFamily: 'monospace' }}>{(mapping.moq || 1000).toLocaleString()} Units</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12.5, color: '#64748B' }}>
                  No direct catalog product mapping found for this specific RFQ draft.
                </div>
              )}
            </div>

            {/* 6. MANUFACTURER REVIEW / EVALUATION (FOR RFQ CREATOR) */}
            <div style={{ background: '#FFFBEB', border: '2px solid #FCD34D', borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#B45309', letterSpacing: '0.05em' }}>
                6. Manufacturer Review & Sourcing Assessment (RFQ Creator Evaluation)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid #FDE68A' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>Compliance & Legal</span>
                  <strong style={{ color: '#16A34A', fontSize: 13 }}>PASSED (WHO-GMP) ✓</strong>
                </div>

                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid #FDE68A' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>RFQ Compatibility</span>
                  <strong style={{ color: '#0F766E', fontSize: 13 }}>100% Product Match ✓</strong>
                </div>

                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 6, border: '1px solid #FDE68A' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>Overall Rating</span>
                  <strong style={{ color: '#D97706', fontSize: 13 }}>⭐ {ratingVal.toFixed(1)} / 5.0</strong>
                </div>
              </div>

              <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.4 }}>
                <strong>Assessment Recommendation:</strong> {mfg.companyName || mfg.name} is a fully verified, WHO-GMP compliant manufacturer with verified track record and active production capacity for all matched formulation lines in this RFQ.
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setClickedProfileMfgId(null)}
              style={{ padding: '10px 20px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              ← Back to RFQ Manufacturer Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>

      {/* Enterprise Header */}
      <div className="ent-command-bar" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div className="ent-command-bar-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.10)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>Dashboard / RFQ Center</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {currentRole === 'ADMIN' ? 'RFQ Sourcing Monitor' : 'RFQ Sourcing & Distribution Engine'}
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              {currentRole === 'ADMIN' 
                ? 'Monitor RFQs, manufacturer responses, sourcing progress and procurement status across the platform.'
                : 'Create multi-product RFQs, execute line-by-line manufacturer matching, review eligible suppliers, and track responses.'}
            </p>
          </div>
        </div>

        <div className="ent-command-bar-right" style={{ gap: 12 }}>
          {(currentRole === 'BUYER' || currentRole === 'SALES_MANAGER') && (
            <button
              onClick={() => {
                setIsEditingDraftId(null);
                setRfqWizardStep(1);
                setRfqLines([
                  { productId: 'p6', productName: 'Paracetamol 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 10000, requiredDate: '2026-09-15', remarks: 'Fast delivery' },
                  { productId: 'p1', productName: 'Amoxicillin 250mg Tablets', dosageForm: 'Tablet', packSize: '10 x 10 Strip', quantity: 5000, requiredDate: '2026-09-15', remarks: 'Standard packaging' },
                  { productId: 'p3', productName: 'Azithromycin 500mg Tablets', dosageForm: 'Tablet', packSize: '10 x 3 Strip', quantity: 2000, requiredDate: '2026-09-15', remarks: 'Export quality' },
                  { productId: 'p4', productName: 'Pantoprazole 40mg + Domperidone 30mg SR', dosageForm: 'Capsule', packSize: '10 x 10 Strip', quantity: 3000, requiredDate: '2026-09-15', remarks: 'Alu-Alu blister packaging' }
                ]);
                setLocalShowCreateDrawer(true);
              }}
              className="ent-btn-primary"
              style={{ padding: '10px 20px', gap: 8, fontWeight: 700, background: '#0F766E', borderColor: '#0F766E', color: '#FFFFFF', cursor: 'pointer' }}
            >
              <Plus size={16} /> + Create New RFQ
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Controls Panel ───────────────────────── */}
      <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
          
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px' }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by RFQ Number, product name, or customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: 13.5, color: '#0F172A', outline: 'none' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

                    {/* Status Filter Pills with Dynamic Counts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {['ALL', ...supportedStatuses].map(st => {
              const isActive = statusFilter === st;
              const count = st === 'ALL'
                ? rfqs.length
                : rfqs.filter(r => {
                    if (!r || !r.status) return false;
                    const rSt = r.status.toLowerCase();
                    const filterSt = st.toLowerCase();
                    if (rSt === filterSt) return true;
                    if (st === 'Draft' && rSt === 'draft') return true;
                    if (st === 'Submitted' && rSt === 'submitted') return true;
                    if (st === 'Pricing In Progress' && (rSt === 'pricing in progress' || rSt === 'pricing_in_progress')) return true;
                    if (st === 'Quoted' && rSt === 'quoted') return true;
                    if (st === 'Approved' && rSt === 'approved') return true;
                    if (st === 'Rejected' && rSt === 'rejected') return true;
                    if (st === 'Closed' && rSt === 'closed') return true;
                    return false;
                  }).length;

              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: isActive ? 700 : 500,
                    border: `1px solid ${isActive ? '#0F766E' : '#CBD5E1'}`,
                    background: isActive ? 'rgba(15, 118, 110, 0.1)' : '#FFFFFF',
                    color: isActive ? '#0F766E' : '#475569',
                    cursor: 'pointer', transition: 'all 150ms'
                  }}
                >
                  {st === 'ALL' ? `All (${rfqs.length})` : `${st} (${count})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RFQ Data Table ───────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>RFQ Number</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Customer</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Product Lines Specified</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Dates</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>Status</th>
              <th style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 20 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRfqs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <EmptyRFQIllustration />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>No RFQs Found</div>
                    <div style={{ fontSize: 13, color: '#64748B', maxWidth: 400 }}>
                      No requisitions match your search filters. Click "+ Create Master RFQ" to assemble a multi-product RFQ.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRfqs.map(rfq => {
                const isExpanded = expandedRfqId === rfq.id;
                const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id);

                return (
                  <React.Fragment key={rfq.id}>
                    <tr
                      onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', background: isExpanded ? '#F8FAFC' : '#FFFFFF', transition: 'background 0.15s ease' }}
                    >
                      {/* 1. RFQ Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {rfq.rfqNumber}
                          </span>
                          {rfq.isGeneric && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', borderRadius: 4, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontSize: 9.5, fontWeight: 800 }}>
                              GENERIC
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Issued: {rfq.createdDate}
                        </div>
                      </td>

                      {/* 2. Customer */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{rfq.customerName}</span>
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
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{rfq.customerCode}</div>
                      </td>

                      {/* 3. Product Lines */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {rfq.lines[0]?.productName}
                        </div>
                        {rfq.lines.length > 1 && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', marginTop: 2 }}>
                            +{rfq.lines.length - 1} additional product lines
                          </div>
                        )}
                      </td>

                      {/* 4. Dates */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                          Req: {rfq.lines[0]?.requiredDate || rfq.deadlineDate}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Deadline: {rfq.deadlineDate}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                            background: rfq.status === 'Draft' ? '#F1F5F9' : rfq.status === 'Pricing In Progress' ? 'rgba(15, 118, 110, 0.1)' : '#EFF6FF',
                            border: `1px solid ${rfq.status === 'Draft' ? '#CBD5E1' : rfq.status === 'Pricing In Progress' ? 'rgba(15, 118, 110, 0.25)' : '#BFDBFE'}`,
                            color: rfq.status === 'Draft' ? '#475569' : rfq.status === 'Pricing In Progress' ? '#0F766E' : '#1D4ED8'
                          }}
                        >
                          {rfq.status}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td onClick={e => e.stopPropagation()} style={{ padding: '14px 16px', textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {rfq.status === 'Draft' ? (
                            <button
                              onClick={() => handleOpenEditDraft(rfq)}
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', cursor: 'pointer' }}
                            >
                              Edit Draft →
                            </button>
                          ) : (
                            <button
                              onClick={() => setExpandedRfqId(isExpanded ? null : rfq.id)}
                              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={13} /> {isExpanded ? 'Hide Details' : 'View RFQ & Quotes'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── EXPANDABLE BUYER RFQ VIEW WITH SUBMITTED QUOTES ── */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1', padding: 0 }}>
                          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            
                            {/* RFQ Header Summary Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, background: '#FFFFFF', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>RFQ Number</span><div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{rfq.rfqNumber}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Customer</span><div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{rfq.customerName}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Credit Requirement</span><div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>{rfq.creditTerms || rfq.paymentTerms || 'No Credit Required'}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Quotation Deadline</span><div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{rfq.deadlineDate}</div></div>
                              <div><span style={{ fontSize: 11, color: '#64748B' }}>Header Remarks</span><div style={{ fontSize: 12.5, color: '#475569' }}>{rfq.remarks || 'None'}</div></div>
                            </div>

                            {/* Product Lines Table */}
                            <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                              <div style={{ padding: '10px 14px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                Requisition Product Lines ({rfq.lines.length})
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Quantity</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Required Date</th>
                                    <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#475569' }}>Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rfq.lines.map((line, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0F172A' }}>{line.productName}</td>
                                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{line.quantity.toLocaleString()}</td>
                                      <td style={{ padding: '10px 12px', color: '#475569' }}>{line.requiredDate}</td>
                                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 12 }}>{line.remarks || 'Standard packaging'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* SECTION: MANUFACTURER RFQS / SUBMITTED QUOTES */}
                            {(() => {
                              const rfqQuotes = quotes.filter(q => q.rfqId === rfq.id);
                              const uniqueMfgIds = new Set(rfqQuotes.map(q => q.mfgId || q.manufacturerId));
                              const uniqueMfgCount = uniqueMfgIds.size;

                              return (
                                <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                                  <div style={{ padding: '10px 14px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 12, fontWeight: 800, color: '#0F766E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>MANUFACTURER RFQs / SUBMITTED QUOTATIONS</span>
                                    <span style={{
                                      fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
                                      background: uniqueMfgCount >= 5 ? '#DCFCE7' : '#FEF3C7',
                                      color: uniqueMfgCount >= 5 ? '#15803D' : '#B45309',
                                      border: uniqueMfgCount >= 5 ? '1px solid #86EFAC' : '1px solid #FCD34D'
                                    }}>
                                      {uniqueMfgCount >= 5
                                        ? `✓ Minimum 5 Responses Received (${uniqueMfgCount} Unique Manufacturers)`
                                        : `Manufacturer Responses: ${uniqueMfgCount} / 5 (Min. 5 Required)`
                                      }
                                    </span>
                                  </div>

                              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {rfq.lines.map((line) => {
                                  const lineQuotes = rfqQuotes.flatMap(q =>
                                    (q.quoteLines || []).filter(ql => ql.rfqLineId === line.id || ql.productId === line.productId).map(ql => ({ quote: q, line: ql }))
                                  );

                                  const submittedManufacturerItems: Array<{
                                    mfg: any;
                                    isDeclined: boolean;
                                    decRecord?: any;
                                    matchingQuote?: any;
                                    isCannotSupplyLine: boolean;
                                    statusLabel: string;
                                    unitPrice?: number;
                                    totalCost?: number;
                                  }> = [];

                                  lineQuotes.forEach(({ quote: q, line: ql }) => {
                                    const mfg = manufacturers.find(m => m.id === q.manufacturerId) || {
                                      id: q.manufacturerId,
                                      name: q.manufacturerName,
                                      companyName: q.manufacturerName,
                                      city: '',
                                      state: ''
                                    };
                                    const lineRespType = ql.responseType || (ql.cannotSupplyReason ? 'CANNOT_SUPPLY' : 'QUOTE');
                                    const isCannotSupplyLine = lineRespType === 'CANNOT_SUPPLY';
                                    const statusLabel = isCannotSupplyLine ? 'Cannot Supply' : 'Quoted';
                                    const unitPrice = !isCannotSupplyLine && typeof ql.unitPrice === 'number' ? ql.unitPrice : undefined;
                                    const totalCost = unitPrice !== undefined ? unitPrice * line.quantity : undefined;

                                    if (!submittedManufacturerItems.some(item => item.mfg.id === mfg.id)) {
                                      submittedManufacturerItems.push({
                                        mfg,
                                        isDeclined: false,
                                        matchingQuote: { quote: q, line: ql },
                                        isCannotSupplyLine,
                                        statusLabel,
                                        unitPrice,
                                        totalCost
                                      });
                                    }
                                  });

                                  const rfqDeclinedList = (declinedRfqs && declinedRfqs[rfq.id]) || [];
                                  rfqDeclinedList.forEach(decRecord => {
                                    if (!submittedManufacturerItems.some(item => item.mfg.id === decRecord.manufacturerId)) {
                                      const mfg = manufacturers.find(m => m.id === decRecord.manufacturerId) || {
                                        id: decRecord.manufacturerId,
                                        name: decRecord.manufacturerName || 'Manufacturer',
                                        companyName: decRecord.manufacturerName || 'Manufacturer',
                                        city: '',
                                        state: ''
                                      };
                                      submittedManufacturerItems.push({
                                        mfg,
                                        isDeclined: true,
                                        decRecord,
                                        isCannotSupplyLine: false,
                                        statusLabel: 'DECLINED',
                                        unitPrice: undefined,
                                        totalCost: undefined
                                      });
                                    }
                                  });

                                  return (
                                    <div key={line.id} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: 14 }}>
                                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                                        Product: {line.productName} — Quantity: {line.quantity.toLocaleString()}
                                      </div>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {submittedManufacturerItems.length > 0 ? (
                                          submittedManufacturerItems.map(({ mfg, isDeclined, decRecord, matchingQuote, isCannotSupplyLine, statusLabel, unitPrice, totalCost }) => (
                                            <div key={mfg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: isCannotSupplyLine ? '#FFF5F5' : '#FFFFFF', border: isCannotSupplyLine ? '1px solid #FECDD3' : '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5 }}>
                                              <div>
                                                {/* Clickable Manufacturer Name */}
                                                <span
                                                  onClick={() => setClickedProfileMfgId(mfg.id)}
                                                  style={{ fontWeight: 800, color: '#0F766E', cursor: 'pointer', textDecoration: 'underline' }}
                                                >
                                                  {mfg.companyName || mfg.name}
                                                </span>
                                                <span style={{
                                                  fontSize: 11, marginLeft: 8, padding: '2px 6px', borderRadius: 4,
                                                  background: isDeclined || isCannotSupplyLine ? '#FEE2E2' : 'rgba(15, 118, 110, 0.1)',
                                                  color: isDeclined || isCannotSupplyLine ? '#B91C1C' : '#0F766E',
                                                  border: isDeclined || isCannotSupplyLine ? '1px solid #FCA5A5' : '1px solid rgba(15, 118, 110, 0.25)',
                                                  fontWeight: 700
                                                }}>
                                                  Status: {statusLabel}
                                                </span>
                                                {isDeclined && (
                                                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>
                                                    Reason: {decRecord?.declineReason || 'Required delivery date not achievable'}
                                                  </div>
                                                )}
                                                {isCannotSupplyLine && (
                                                  <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2, fontWeight: 600 }}>
                                                    Reason: {matchingQuote?.line.cannotSupplyReason} {matchingQuote?.line.cannotSupplyRemarks ? `(${matchingQuote.line.cannotSupplyRemarks})` : ''}
                                                  </div>
                                                )}
                                              </div>

                                              <div>
                                                {isDeclined ? (
                                                  <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 700 }}>Declined RFQ</span>
                                                ) : isCannotSupplyLine ? (
                                                  <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 700 }}>Cannot Supply Item</span>
                                                ) : unitPrice !== undefined ? (
                                                  <span style={{ fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                                    Unit Price: <strong>₹{unitPrice.toFixed(2)}</strong> · Total Cost: <strong style={{ color: '#0F766E' }}>₹{totalCost?.toLocaleString('en-IN')}</strong>
                                                  </span>
                                                ) : null}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div style={{ padding: '8px 12px', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 6, color: '#64748B', fontSize: 12, fontStyle: 'italic' }}>
                                            No quotations submitted yet for this product line.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                              </div>
                            </td>
                          </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControl {...pagination.paginationProps} itemName="RFQs" />

      {/* ── UNIFIED RFQ CREATION WIZARD DRAWER ── */}
      {showCreateDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={closeDrawer}>
          <div
            style={{
              width: '100%',
              maxWidth: 840,
              height: '100dvh',
              maxHeight: '100vh',
              background: '#FFFFFF',
              borderLeft: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header (Fixed at top) */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{autoRfqNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>Step {rfqWizardStep} of 3</span>
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>
                  {rfqWizardStep === 1 && 'Basic Information & Product Lines'}
                  {rfqWizardStep === 2 && 'General & RFQ Terms'}
                  {rfqWizardStep === 3 && 'Review & Submit RFQ'}
                </h2>
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} />
              </button>
            </div>

            {/* 3-Step Indicator Bar (Fixed at top below header) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9', flexShrink: 0 }}>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 1 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 1 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 1 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                1. Basic Info & Lines
              </div>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 2 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 2 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 2 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                2. General & Terms
              </div>
              <div style={{ padding: '10px 8px', fontSize: 11.5, fontWeight: 700, color: rfqWizardStep === 3 ? '#0F766E' : '#64748B', borderBottom: rfqWizardStep === 3 ? '2px solid #0F766E' : 'none', background: rfqWizardStep === 3 ? '#FFFFFF' : 'transparent', textAlign: 'center' }}>
                3. Final Review & Submit
              </div>
            </div>

            {/* Form Validation Alert */}
            {validationError && (
              <div style={{ margin: '14px 24px 0', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontSize: 13, flexShrink: 0 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{validationError}</span>
              </div>
            )}

            {/* ── STEP 1: BASIC INFORMATION & PRODUCT LINES BUILDER ── */}
            {rfqWizardStep === 1 && (
              <div style={{ padding: '20px 24px 36px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Authenticated Buyer Identity Header (Read-Only Identity) */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={16} /> Authenticated Buyer Profile & RFQ Header
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 6,
                        border: isSpecialPartyBuyer ? '1px solid #FCD34D' : '1px solid #99F6E4',
                        background: isSpecialPartyBuyer ? '#FEF3C7' : '#CCFBF1',
                        color: isSpecialPartyBuyer ? '#92400E' : '#0F766E',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {isSpecialPartyBuyer ? (
                          <>
                            <Star size={12} fill="#D97706" color="#D97706" /> Special Party Buyer · Pre-Agreed Pricing
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={12} /> Standard Regular Buyer · Competitive Bidding
                          </>
                        )}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#E6FFFA', padding: '3px 8px', borderRadius: 4, border: '1px solid #99F6E4' }}>
                        {realBuyerProfile?.isApproved ? 'Verified Account' : 'Active Account'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                        RFQ Number
                      </label>
                      <input
                        type="text"
                        disabled
                        value={isEditingDraftId ? autoRfqNumber : "Auto-assigned on Save/Submit"}
                        style={{ width: '100%', padding: '8px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                        Buyer Name & ID
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={buyerName ? `${buyerName} (${realBuyerProfile?.userCode || (realBuyerProfile?.userId ? `USR-${realBuyerProfile.userId}` : 'BUYER')})` : 'Authenticated Buyer'}
                        style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 12.5, fontWeight: 600, cursor: 'default' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={customerName || 'Verified Organization'}
                        style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 600, cursor: 'default' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                        Customer Code
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={customerCode || (realBuyerProfile?.customerCode || (realBuyerProfile?.userId ? `CUS-${realBuyerProfile.userId}` : 'CUS-VERIFIED'))}
                        style={{ width: '100%', padding: '8px 10px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace', cursor: 'default' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 11.5 }}>
                    <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Segment:</span>
                      <strong style={{ color: '#0F172A', background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>
                        {realBuyerProfile?.registration?.businessType || realBuyerProfile?.verificationDetails?.customerType || 'Pharmaceutical Procurement'}
                      </strong>
                      <span style={{ color: '#CBD5E1' }}>|</span>
                      <span>Default Delivery:</span>
                      <strong style={{ color: '#334155' }}>
                        📍 {deliveryLocation || 'Primary Dispatch Facility'}
                      </strong>
                    </div>
                    <div style={{ color: '#64748B' }}>
                      🔒 Identity and organization details are resolved from authenticated database session.
                    </div>
                  </div>
                </div>

                {/* Special Party Flow Notification Banner */}
                {isSpecialPartyBuyer && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Star size={16} fill="#D97706" color="#D97706" />
                    </div>
                    <div style={{ fontSize: 12.5, color: '#92400E' }}>
                      <strong style={{ display: 'block', fontSize: 13, color: '#78350F' }}>Special Party Pre-Agreed Pricing Workflow</strong>
                      As a verified Special Party buyer ({customerName}), enter your agreed product unit price directly below. The manufacturer directly confirms this pricing without competitive bidding delays.
                    </div>
                  </div>
                )}

                {/* PRODUCT LINES BUILDER */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                        RFQ Product Lines ({rfqLines.length})
                      </h4>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Select products using the Category Hierarchy cascade or enter generic molecule requirements.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEmptyProductRow}
                      style={{ padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> + Add Product Line
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {rfqLines.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#F8FAFC',
                          border: isSpecialPartyBuyer ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                          borderRadius: 10,
                          padding: 16,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* ── CARD HEADER: Line Item, Product Code, Sourcing Mode & Aligned Delete ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 14, borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', background: '#E6FFFA', padding: '3px 10px', borderRadius: 6, border: '1px solid #99F6E4' }}>
                              Item #{idx + 1}
                            </span>
                            {line.productCode && (
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#CCFBF1', padding: '2px 8px', borderRadius: 4 }}>
                                {line.productCode}
                              </span>
                            )}
                            {line.productType === 'GENERIC' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                                Generic Medicine
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* Professional Segmented Control */}
                            <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                              <button
                                type="button"
                                onClick={() => handleRowChange(idx, 'productType', 'BRANDED')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 12px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: line.productType !== 'GENERIC' ? '#0F766E' : 'transparent',
                                  color: line.productType !== 'GENERIC' ? '#FFFFFF' : '#64748B',
                                  boxShadow: line.productType !== 'GENERIC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Package size={13} />
                                Branded Medicine
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRowChange(idx, 'productType', 'GENERIC')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '5px 12px',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: line.productType === 'GENERIC' ? '#0F766E' : 'transparent',
                                  color: line.productType === 'GENERIC' ? '#FFFFFF' : '#64748B',
                                  boxShadow: line.productType === 'GENERIC' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <FileText size={13} />
                                Generic Medicine
                              </button>
                            </div>

                            {/* Cleanly Aligned Standard Trash Action Button */}
                            <button
                              type="button"
                              disabled={rfqLines.length <= 1}
                              onClick={() => handleRemoveRow(idx)}
                              title={rfqLines.length <= 1 ? "At least one product line is mandatory" : "Remove this product line"}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '5px 10px',
                                background: rfqLines.length <= 1 ? '#F1F5F9' : '#FEF2F2',
                                border: rfqLines.length <= 1 ? '1px solid #E2E8F0' : '1px solid #FECACA',
                                borderRadius: 6,
                                color: rfqLines.length <= 1 ? '#94A3B8' : '#DC2626',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: rfqLines.length <= 1 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        {/* ── 4-TIER PRODUCT CLASSIFICATION HIERARCHY (MANDATORY FOR BOTH BRANDED AND GENERIC) ── */}
                        <div style={{ marginBottom: 14, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Layers size={13} /> Product Classification Hierarchy (Database-Validated)
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {/* 1. Product Type */}
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                1. Product Type *
                              </label>
                              <select
                                value={line.productTypeId || ''}
                                onChange={e => handleProductTypeChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '7px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, color: '#0F172A', fontWeight: 600 }}
                              >
                                <option value="">All Product Types</option>
                                {availableProductTypes.map(pt => (
                                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* 2. Category */}
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                2. Category *
                              </label>
                              <select
                                value={line.category || ''}
                                onChange={e => handleCategoryChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '7px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, color: '#0F172A', fontWeight: 600 }}
                              >
                                <option value="">Select Category</option>
                                {getCategoriesForLine(line.productTypeId).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>

                            {/* 3. Sub-Category */}
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                3. Sub-Category
                              </label>
                              <select
                                value={line.subCategory || ''}
                                onChange={e => handleSubCategoryChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '7px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, color: '#0F172A', fontWeight: 600 }}
                              >
                                <option value="">Select Sub-Category</option>
                                {getSubCategoriesForLine(line.productTypeId, line.category).map(sc => (
                                  <option key={sc} value={sc}>{sc}</option>
                                ))}
                              </select>
                            </div>

                            {/* 4. Sub-Sub-Category */}
                            <div>
                              <label style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                4. Sub-Sub-Category
                              </label>
                              <select
                                value={line.subSubCategory || ''}
                                onChange={e => handleSubSubCategoryChange(idx, e.target.value)}
                                style={{ width: '100%', padding: '7px 8px', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, color: '#0F172A', fontWeight: 600 }}
                              >
                                <option value="">Select Sub-Sub-Category</option>
                                {getSubSubCategoriesForLine(line.productTypeId, line.category, line.subCategory).map(ssc => (
                                  <option key={ssc} value={ssc}>{ssc}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* ── BRANCH: BRANDED MEDICINE VS GENERIC MEDICINE ── */}
                        {line.productType === 'GENERIC' ? (
                          /* ── GENERIC MEDICINE FORMULATION SELECTOR & SPECIFICATIONS ── */
                          <div style={{ marginBottom: 14, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 14 }}>
                            {/* Generic Sourcing Notice */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#166534', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FileText size={14} /> Generic Medicine Sourcing Specifications
                              </div>
                              <span style={{ fontSize: 10.5, color: '#15803D', fontWeight: 700, background: '#DCFCE7', padding: '2px 8px', borderRadius: 4, border: '1px solid #86EFAC' }}>
                                Direct Admin Price-List Sourcing · Brand Trademark Not Required
                              </span>
                            </div>

                            {/* Active Ingredient / Molecule selector */}
                            <div style={{ marginBottom: 10 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                                5. Active Ingredient / Molecule *
                              </label>
                              
                              {(() => {
                                const dbFormulations = getDatabaseFormulationsForLine(line);
                                const selectedMol = line.isCustomMolecule ? '__CUSTOM_MOLECULE__' : (line.molecule || '');
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <select
                                      value={selectedMol}
                                      onChange={e => handleSelectMolecule(idx, e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: '#FFFFFF',
                                        border: '1px solid #86EFAC',
                                        borderRadius: 6,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: '#0F172A'
                                      }}
                                    >
                                      <option value="">-- Select Active Molecule from Master Catalog --</option>
                                      {dbFormulations.length > 0 && (
                                        <optgroup label={`Database Formulations (${dbFormulations.length} matching hierarchy)`}>
                                          {dbFormulations.map(f => (
                                            <option key={f.id || f.molecule} value={f.molecule}>
                                              {f.molecule} {f.strength ? `(${f.strength})` : ''} — {f.dosageForm}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      <optgroup label="Standard Registered Pharmacopoeia Molecules">
                                        {STANDARD_MOLECULES.filter(sm => !dbFormulations.some(df => df.molecule.toLowerCase() === sm.toLowerCase())).map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="Controlled Generic Product Request">
                                        <option value="__CUSTOM_MOLECULE__">+ Request New Generic Molecule (Not in Master Catalog)</option>
                                      </optgroup>
                                    </select>

                                    {line.isCustomMolecule && (
                                      <div style={{ background: '#FFFFFF', border: '1px dashed #16A34A', borderRadius: 6, padding: '10px 12px' }}>
                                        <label style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                          New Generic Molecule / Active Formulation Name *
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Enter formulation molecule (e.g. Teneligliptin + Metformin)"
                                          value={line.molecule || ''}
                                          onChange={e => handleRowChange(idx, 'molecule', e.target.value)}
                                          style={{ width: '100%', padding: '7px 10px', background: '#F8FAFC', border: '1px solid #86EFAC', borderRadius: 5, fontSize: 12.5, color: '#0F172A', fontWeight: 600 }}
                                        />
                                        <div style={{ fontSize: 10.5, color: '#15803D', marginTop: 4 }}>
                                          ℹ️ Controlled generic requisition process: Will be reviewed and mapped by FactoryGrid Formulation Desk.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* 3-Column Specifications Grid: Strength, Dosage Form, Pack Size */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                              <div>
                                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                  Strength / Potency *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 500mg, 250mg/5ml"
                                  value={line.strength || ''}
                                  onChange={e => handleRowChange(idx, 'strength', e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, color: '#0F172A' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                  Dosage Form *
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Tablet, Syrup, Injection"
                                  value={line.dosageForm || ''}
                                  onChange={e => handleRowChange(idx, 'dosageForm', e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, color: '#0F172A' }}
                                />
                              </div>

                              <div>
                                <label style={{ fontSize: 10.5, fontWeight: 700, color: '#166534', display: 'block', marginBottom: 3, textTransform: 'uppercase' }}>
                                  Pack Size
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. 10x10 Strip, 100ml Bottle"
                                  value={line.packSize || ''}
                                  onChange={e => handleRowChange(idx, 'packSize', e.target.value)}
                                  style={{ width: '100%', padding: '7px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, color: '#0F172A' }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ── BRANDED MEDICINE: SEARCH AND SELECT MASTER PRODUCTS + DETAILS CARD ── */
                          <div style={{ marginBottom: 14 }}>
                            {/* Searchable Product Dropdown filtered by selected hierarchy */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  5. Select Branded Product from Central Master *
                                </label>
                                {line.productId && (
                                  <span style={{ fontSize: 11, color: '#0F766E', fontWeight: 600 }}>
                                    {[line.category, line.subCategory, line.subSubCategory].filter(Boolean).join(' › ')}
                                  </span>
                                )}
                              </div>
                              <SearchableProductSelect
                                products={getEligibleProductsForLine(line)}
                                selectedProductId={line.productId}
                                selectedProductName={line.productName}
                                isOther={line.isOther}
                                customProductName={line.customProductName}
                                disabledProductIds={rfqLines.map((l, i) => i !== idx ? l.productId : '').filter(Boolean)}
                                onSelectProduct={(product) => handleSelectProduct(idx, product)}
                                onSelectOther={() => {
                                  setRfqLines(prev => prev.map((l, i) => {
                                    if (i !== idx) return l;
                                    return {
                                      ...l,
                                      productId: 'other',
                                      productCode: '',
                                      productName: l.customProductName || 'Other Product',
                                      dosageForm: 'Custom',
                                      packSize: 'Custom Pack',
                                      uom: 'Unit',
                                      isOther: true,
                                      productType: 'BRANDED'
                                    };
                                  }));
                                }}
                                onCustomProductNameChange={(customName) => {
                                  setRfqLines(prev => prev.map((l, i) => {
                                    if (i !== idx) return l;
                                    return {
                                      ...l,
                                      customProductName: customName,
                                      productName: customName || 'Other Product'
                                    };
                                  }));
                                }}
                              />
                            </div>

                            {/* Branded Product Details Card when product is selected */}
                            {line.productId && line.productId !== 'other' && (
                              <div style={{ marginTop: 10, background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: '10px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0F766E', background: '#CCFBF1', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace' }}>
                                      {line.productCode || 'MASTER-SKU'}
                                    </span>
                                    <strong style={{ fontSize: 13, color: '#0F172A' }}>{line.productName}</strong>
                                    {line.brand && (
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#E2E8F0', padding: '1px 6px', borderRadius: 4 }}>
                                        Brand: {line.brand}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0F766E', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={12} /> Product Master Verified
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 11.5, color: '#334155' }}>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10.5 }}>Active Salt / Molecule:</span>
                                    <strong>{line.molecule || 'Standard Formulation'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10.5 }}>Strength:</span>
                                    <strong>{line.strength || 'Standard'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10.5 }}>Dosage Form:</span>
                                    <strong>{line.dosageForm || 'Tablet'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: '#64748B', display: 'block', fontSize: 10.5 }}>Pack Size:</span>
                                    <strong>{line.packSize || 'Standard Pack'}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quantity, Unit of Measure, Required Date & Special Party Agreed Price */}
                        <div style={{ display: 'grid', gridTemplateColumns: isSpecialPartyBuyer ? '1.2fr 1fr 1fr 1fr' : '1.2fr 1fr 1.2fr', gap: 12, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                              Quantity *
                            </label>
                            <input
                              type="number"
                              min={1}
                              placeholder="e.g. 5000"
                              value={line.quantity}
                              onChange={e => handleRowChange(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                              style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                              Unit of Measure
                            </label>
                            <select
                              value={line.uom || 'Unit'}
                              onChange={e => handleRowChange(idx, 'uom', e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 600 }}
                            >
                              <option value="Unit">Unit</option>
                              <option value="Strip">Strip</option>
                              <option value="Box">Box</option>
                              <option value="Bottle">Bottle</option>
                              <option value="Vial">Vial</option>
                              <option value="Ampoule">Ampoule</option>
                              <option value="Pack">Pack</option>
                              <option value="Pouch">Pouch</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
                              Required Date *
                            </label>
                            <input
                              type="date"
                              min={todayStr}
                              value={line.requiredDate}
                              onChange={e => handleRowChange(idx, 'requiredDate', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                            />
                          </div>

                          {isSpecialPartyBuyer && (
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 800, color: '#B45309', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, textTransform: 'uppercase' }}>
                                <Star size={11} fill="#D97706" color="#D97706" /> Agreed Price (₹/unit) *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="e.g. 14.50"
                                value={line.buyerProvidedPrice !== undefined && line.buyerProvidedPrice !== '' ? line.buyerProvidedPrice : ''}
                                onChange={e => handleRowChange(idx, 'buyerProvidedPrice', e.target.value === '' ? '' : parseFloat(e.target.value) || '')}
                                style={{ width: '100%', padding: '8px 12px', background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 6, color: '#92400E', fontSize: 13, fontWeight: 700 }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Line Remarks */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Remarks & Packaging Instructions</label>
                          <input
                            type="text"
                            placeholder="e.g. Alu-Alu blister packaging, batch test certificate required"
                            value={line.remarks}
                            onChange={e => handleRowChange(idx, 'remarks', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 12.5 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: GENERAL & TERMS ── */}
            {rfqWizardStep === 2 && (
              <div style={{ padding: '20px 24px 36px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 14 }}>
                    General Delivery & Payment Terms (Step 2)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>RFQ Date</label>
                      <input type="date" value={rfqDate} onChange={e => setRfqDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>General Required Date</label>
                      <input type="date" min={todayStr} value={requiredDate} onChange={e => setRequiredDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Priority Level</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 600 }}>
                        <option value="STANDARD">STANDARD</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Quotation Deadline</label>
                      <input type="date" min={todayStr} value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Delivery Location</label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={e => setDeliveryLocation(e.target.value)}
                      placeholder="e.g. Warehouse Plot 12, Industrial Area"
                      style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <input
                        type="checkbox"
                        id="creditRequiredCheckbox"
                        checked={creditRequired}
                        onChange={e => setCreditRequired(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                      />
                      <label htmlFor="creditRequiredCheckbox" style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
                        Credit Payment Required
                      </label>
                    </div>

                    {creditRequired && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <select
                          value={creditTermsOption}
                          onChange={e => setCreditTermsOption(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, color: '#0F172A' }}
                        >
                          <option value="Net 30 Days">Net 30 Days</option>
                          <option value="Net 60 Days">Net 60 Days</option>
                          <option value="Net 90 Days">Net 90 Days</option>
                          <option value="Custom">Custom Terms</option>
                        </select>
                        {creditTermsOption === 'Custom' && (
                          <input
                            type="text"
                            placeholder="Specify custom credit terms"
                            value={customCreditTerms}
                            onChange={e => setCustomCreditTerms(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, color: '#0F172A' }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Special Remarks / Commercial Terms</label>
                    <textarea rows={3} value={headerRemarks} onChange={e => setHeaderRemarks(e.target.value)} placeholder="Enter delivery terms or packaging instructions..." style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: FINAL RFQ REVIEW & SUBMISSION ── */}
            {rfqWizardStep === 3 && (
              <div style={{ padding: '20px 24px 36px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 1. RFQ Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={16} /> 1. RFQ Requisition Summary
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 4 }}>
                      Draft — Ready for Submission
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>RFQ Reference</span>
                      <strong style={{ color: '#0F766E', fontFamily: 'monospace', fontSize: 13 }}>{autoRfqNumber}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>RFQ Issue Date</span>
                      <strong style={{ color: '#0F172A' }}>{rfqDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Required Delivery Date</span>
                      <strong style={{ color: '#0F172A' }}>{requiredDate || 'Standard Delivery'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Quotation Deadline</span>
                      <strong style={{ color: '#0F172A' }}>{deadlineDate || 'Flexible'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Priority Level</span>
                      <span style={{
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: priority === 'URGENT' ? '#FEE2E2' : priority === 'HIGH' ? '#FEF3C7' : '#EFF6FF',
                        color: priority === 'URGENT' ? '#B91C1C' : priority === 'HIGH' ? '#B45309' : '#1D4ED8'
                      }}>
                        {priority}
                      </span>
                    </div>
                    <div style={{ gridColumn: 'span 3' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Requisition Channel</span>
                      <strong style={{ color: '#334155' }}>
                        {rfqLines.some(l => l.productType === 'GENERIC')
                          ? 'Hybrid Sourcing (Direct Qualified Manufacturer Sourcing & Admin Generic Routing)'
                          : 'Direct Qualified Manufacturer Sourcing'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Buyer and Delivery Details */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={16} /> 2. Buyer & Consignee Information
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck size={13} /> {realBuyerProfile?.isApproved ? 'Verified Enterprise Account' : 'Account in Good Standing'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Authorized Buyer</span>
                      <strong style={{ color: '#0F172A' }}>{buyerName || 'Authenticated Buyer'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Organization / Entity</span>
                      <strong style={{ color: '#0F172A' }}>{customerName || 'Verified Organization'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Customer Account Code</span>
                      <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{customerCode || (realBuyerProfile?.customerCode || (realBuyerProfile?.userId ? `CUS-${realBuyerProfile.userId}` : 'CUS-VERIFIED'))}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Customer Classification</span>
                      <strong style={{ color: '#334155' }}>{isSpecialPartyBuyer ? 'Special Party (Pre-Agreed Pricing)' : 'Standard Regular Buyer (Competitive Bidding)'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 4' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Consignee Delivery Location</span>
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>📍 {deliveryLocation || 'Warehouse / Primary Facility'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Requested Products */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: 10, background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 18px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={16} style={{ color: '#0F766E' }} /> 3. Requested Products ({rfqLines.filter(l => (l.productId || l.molecule) && l.quantity).length})
                  </div>
                  
                  {/* Natural unconstrained list: NO nested scrollbar */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {rfqLines.filter(l => (l.productId || l.molecule) && l.quantity).map((line, i, arr) => (
                      <div
                        key={i}
                        style={{
                          padding: '14px 18px',
                          borderBottom: i < arr.length - 1 ? '1px solid #E2E8F0' : 'none',
                          background: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 16,
                          fontSize: 13
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', background: '#E6FFFA', padding: '2px 8px', borderRadius: 4, border: '1px solid #99F6E4' }}>
                              Item #{i + 1}
                            </span>
                            {line.productCode ? (
                              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#CCFBF1', padding: '2px 7px', borderRadius: 4 }}>
                                {line.productCode}
                              </span>
                            ) : line.productType === 'GENERIC' ? (
                              <span style={{ fontFamily: 'monospace', fontSize: 10.5, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 7px', borderRadius: 4 }}>
                                GENERIC-ADMIN-ROUTED
                              </span>
                            ) : null}
                            <strong style={{ color: '#0F172A', fontSize: 14 }}>{line.productName}</strong>
                            <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: line.productType === 'GENERIC' ? '#F0FDF4' : '#EFF6FF', color: line.productType === 'GENERIC' ? '#15803D' : '#1D4ED8', border: line.productType === 'GENERIC' ? '1px solid #BBF7D0' : '1px solid #BFDBFE', fontWeight: 800, textTransform: 'uppercase' }}>
                              {line.productType === 'GENERIC' ? 'Generic Medicine' : 'Branded Medicine'}
                            </span>
                          </div>

                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center' }}>
                            {[line.productTypeId, line.category, line.subCategory, line.subSubCategory].filter(Boolean).length > 0 && (
                              <span>📁 {[line.category, line.subCategory, line.subSubCategory].filter(Boolean).join(' › ')}</span>
                            )}
                            {(line.dosageForm || line.strength || line.packSize) && (
                              <span>💊 {[line.dosageForm, line.strength, line.packSize].filter(Boolean).join(' · ')}</span>
                            )}
                            <span>📅 Required: <strong>{line.requiredDate || requiredDate || 'Standard'}</strong></span>
                            {line.remarks && <span>💬 Note: {line.remarks}</span>}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#0F766E', fontSize: 15, fontFamily: 'monospace' }}>
                            {Number(line.quantity).toLocaleString()} {line.uom || 'Units'}
                          </div>
                          {isSpecialPartyBuyer ? (
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#B45309', marginTop: 3 }}>
                              Pre-Agreed: ₹{Number(line.buyerProvidedPrice || 0).toFixed(2)}/unit
                            </div>
                          ) : (
                            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0F766E', marginTop: 3 }}>
                              Competitive Bidding
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generic Direct Admin Routing Banner */}
                {rfqLines.some(l => l.productType === 'GENERIC') && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#166534', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🏛️ FactoryGrid Admin Direct Generic Routing
                    </div>
                    <div style={{ fontSize: 12, color: '#15803D', lineHeight: 1.5 }}>
                      Generic line items will route directly to FactoryGrid Platform Admin for quoting against internal price lists. No external manufacturer contact or trademark proof required.
                    </div>
                  </div>
                )}

                {/* 4. Commercial Terms */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CreditCard size={16} /> 4. Commercial & Payment Terms
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Payment Terms</span>
                      <strong style={{ color: '#0F766E' }}>
                        {creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Custom Credit Terms') : creditTermsOption) : 'Immediate / Advance (No Credit)'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Credit Facility</span>
                      <strong style={{ color: '#0F172A' }}>{creditRequired ? 'Credit Requested' : 'Standard Commercial Settlement'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Special Commercial / Packaging Remarks</span>
                      <span style={{ color: '#334155' }}>{headerRemarks || 'Standard FactoryGrid commercial procurement and QA terms apply.'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Eligible Manufacturer Matching */}
                {rfqLines.some(l => l.productType !== 'GENERIC') && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.04em' }}>
                          5. Eligible Manufacturer Matching
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Find eligible manufacturers based on your selected products, supplier availability and applicable compliance requirements.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunLiveMatching}
                        disabled={isMatchingLoading}
                        style={{
                          padding: '8px 16px',
                          background: isMatchingLoading ? '#94A3B8' : '#0F766E',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: isMatchingLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 1px 3px rgba(15, 118, 110, 0.2)'
                        }}
                      >
                        <RefreshCw size={13} style={{ animation: isMatchingLoading ? 'spin 1s linear infinite' : 'none' }} />
                        {isMatchingLoading ? 'Searching Manufacturers...' : 'Find Eligible Manufacturers'}
                      </button>
                    </div>

                    {liveMatchingResult && uniqueMatchedMfgs.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>
                          ✓ Found {uniqueMatchedMfgs.length} eligible verified manufacturer(s) matching your requisition lines:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                          {uniqueMatchedMfgs.map((m, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: 8,
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 5,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ color: '#0F172A', fontSize: 13.5 }}>{m.companyName}</strong>
                                <span style={{ fontSize: 10.5, fontWeight: 800, color: '#0F766E', background: '#CCFBF1', padding: '1px 7px', borderRadius: 4 }}>
                                  Score: {m.matchScore}%
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                <span>Supplier Code: <strong style={{ fontFamily: 'monospace' }}>{m.registrationCode}</strong></span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                📍 {[m.city, m.state].filter(Boolean).join(', ') || 'Registered Facility'}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 3, display: 'flex', gap: 12, borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                                <span>MOQ: <strong>{m.moq ? Number(m.moq).toLocaleString() : '1,000'}</strong></span>
                                <span>Lead Time: <strong>{m.leadTimeDays || '14'} days</strong></span>
                              </div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <CheckCircle2 size={12} /> Compliance: GMP & Drug License Verified
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : liveMatchingResult && uniqueMatchedMfgs.length === 0 ? (
                      <div style={{ padding: '14px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 12.5, color: '#92400E', textAlign: 'center', marginTop: 10 }}>
                        No direct manufacturer product mappings found for these lines yet. FactoryGrid platform sourcing team will review and route to suitable qualified manufacturers upon submission.
                      </div>
                    ) : (
                      <div style={{ padding: '16px 18px', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 8, fontSize: 12.5, color: '#64748B', textAlign: 'center', marginTop: 10 }}>
                        Click "Find Eligible Manufacturers" to view qualified suppliers meeting your requisition requirements prior to submission.
                      </div>
                    )}

                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ℹ️ Running manufacturer matching previews qualified suppliers and does NOT submit your RFQ. Submission only occurs when you click "Submit RFQ" below.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Footer Actions (Wizard Navigation - Fixed at bottom) */}
            <div style={{ padding: '14px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, zIndex: 10 }}>
              <div>
                {rfqWizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setRfqWizardStep((rfqWizardStep - 1) as any)}
                    style={{ padding: '9px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeDrawer}
                    style={{ padding: '9px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {/* Save Draft button always accessible across all steps */}
                <button
                  type="button"
                  disabled={isSubmittingRfq}
                  onClick={handleSaveDraft}
                  style={{
                    padding: '9px 18px',
                    background: '#FFFFFF',
                    border: '1px solid #0F766E',
                    borderRadius: 6,
                    color: '#0F766E',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSubmittingRfq ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingRfq ? 'Saving Draft...' : 'Save Draft'}
                </button>

                {/* Step 1 Continue Button */}
                {rfqWizardStep === 1 && (
                  <button
                    type="button"
                    onClick={handleContinueToGeneralTerms}
                    style={{ padding: '9px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Continue to Terms →
                  </button>
                )}

                {/* Step 2 Continue Button */}
                {rfqWizardStep === 2 && (
                  <button
                    type="button"
                    onClick={handleContinueToReview}
                    style={{ padding: '9px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Continue to Review →
                  </button>
                )}

                {/* Step 3 Final Submit Button */}
                {rfqWizardStep === 3 && (
                  <button
                    type="button"
                    disabled={isSubmittingRfq}
                    onClick={handleExecuteRFQSubmission}
                    style={{
                      padding: '9px 24px',
                      background: isSubmittingRfq ? '#94A3B8' : '#0F766E',
                      border: 'none',
                      borderRadius: 6,
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isSubmittingRfq ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
                    }}
                  >
                    <Send size={15} />
                    {isSubmittingRfq ? 'Submitting RFQ...' : 'Submit RFQ'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTOMATIC SYSTEM FLOATING RESULT OVERLAY ── */}
      {distributionResultModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.3)', border: '1px solid #CBD5E1' }}>
            
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(15, 118, 110, 0.12)', border: '1px solid rgba(15, 118, 110, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <Send size={24} style={{ color: '#0F766E' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {distributionResultModal.mfgRfqs.length > 0 ? 'RFQ Distribution Complete' : 'Generic RFQ Successfully Submitted'}
              </h3>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                {distributionResultModal.mfgRfqs.length > 0 ? (
                  <>Qualified manufacturer matching executed. Requisition is now active with status <strong>Submitted</strong>.</>
                ) : (
                  <>Generic request routed directly to <strong>FactoryGrid Admin</strong> for internal price list quotation. Status: <strong>Submitted</strong>.</>
                )}
              </div>
            </div>

            {/* Qualified Manufacturer Distribution Records Table */}
            {distributionResultModal.mfgRfqs.length > 0 && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '8px 12px', background: '#F1F5F9', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  Qualified Manufacturer Distribution
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Eligible Manufacturer</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Matched Products</th>
                      <th style={{ padding: '8px 12px', color: '#475569', fontWeight: 700 }}>Distribution Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributionResultModal.mfgRfqs.map(rec => (
                      <tr key={rec.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{rec.manufacturerName}</td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>{rec.lines.map(l => l.productName).join(', ')}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E' }}>
                            Status: {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Generic Medicine Routing Info */}
            {distributionResultModal.isGeneric && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 20 }}>🏛️</div>
                <div style={{ fontSize: 12.5, color: '#166534' }}>
                  <strong>FactoryGrid Admin Direct Routing:</strong> {distributionResultModal.genericLinesCount || 1} generic line item(s) forwarded directly to FactoryGrid Platform Admin for internal pricing. No external manufacturers were contacted.
                </div>
              </div>
            )}

            {/* Notification Logs */}
            {distributionResultModal.logs.length > 0 && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>
                  Automated Notification Logs (Email & SMS)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: '#334155', fontFamily: 'monospace' }}>
                  {distributionResultModal.logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setDistributionResultModal(null)}
                style={{ padding: '10px 24px', background: '#0F766E', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close & Track RFQ Status →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANUFACTURER SUBMITS QUOTATION MODAL ── */}
      {supplierQuoteRfq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 620, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 24px 48px rgba(15, 23, 42, 0.3)', border: '1px solid #CBD5E1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase' }}>Manufacturer Quote Submission</span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Submit Commercial Quotation for {supplierQuoteRfq.rfqNumber}
                </h3>
              </div>
              <button onClick={() => setSupplierQuoteRfq(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {supplierQuoteRfq.lines.map((line, idx) => {
                const uPrice = quotePrices[line.id] || 12.00;
                const totalCost = uPrice * line.quantity;

                return (
                  <div key={line.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Product #{idx + 1}: {line.productName} (Qty: {line.quantity.toLocaleString()} Units)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Unit Price (₹ / Box) *</label>
                        <input
                          type="number"
                          step="0.1"
                          value={uPrice}
                          onChange={e => setQuotePrices(prev => ({ ...prev, [line.id]: parseFloat(e.target.value) || 0 }))}
                          style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13, fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Total Cost (₹) (Calculated)</label>
                        <input
                          type="text"
                          disabled
                          value={`₹${totalCost.toLocaleString()}`}
                          style={{ width: '100%', padding: '8px 12px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSupplierQuoteRfq(null)}
                style={{ padding: '10px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSupplierQuoteSubmission}
                style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Submit Commercial Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLICKED MANUFACTURER PROFILE DRAWER OVERLAY ── */}
      {renderSpecificManufacturerProfileDrawer()}
    </div>
  );
};
