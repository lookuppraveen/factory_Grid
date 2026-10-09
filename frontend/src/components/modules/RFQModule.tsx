import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { EmptyRFQIllustration, FactoryAvatar } from '../common/Illustrations';
import {
  RFQ, RFQLine, Manufacturer, Product, RFQStatus, DistributionStatus,
  ManufacturerRFQ, ManufacturerRFQLine, ManufacturerQuote, ManufacturerQuoteLine,
  ManufacturerProductMapping
} from '../../types';
import {
  FileText, Plus, Search, Filter, Download, ChevronDown, ChevronRight,
  MoreHorizontal, Calendar, Clock, Users, CheckCircle2, AlertCircle,
  X, Building2, Package, Layers, ArrowRight, Eye, Zap, RefreshCw,
  SlidersHorizontal, BookmarkPlus, Share2, Bell, Inbox, Trash2, Mail, MessageSquare,
  Send, Check, AlertTriangle, ArrowLeft, ShieldCheck, Award, ExternalLink, MapPin,
  Star
} from 'lucide-react';

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
  dosageForm: string;
  packSize: string;
  quantity: number | '';
  requiredDate: string;
  remarks: string;
  isOther?: boolean;
  customProductName?: string;
  buyerProvidedPrice?: number | '';
  productType?: 'BRANDED' | 'GENERIC';
  molecule?: string;
  strength?: string;
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
      (p.code && p.code.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const displayLabel = useMemo(() => {
    if (selectedProductId === 'other' || isOther) {
      return customProductName ? `Other: ${customProductName}` : 'Other (Custom Product)';
    }
    if (selectedProductId) {
      const found = products.find(p => p.id === selectedProductId);
      if (found) return found.name;
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
              placeholder="Search product (e.g. Pan, Par, 500)..."
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
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => {
                const isSelected = p.id === selectedProductId && !isOther;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '9px 12px',
                      fontSize: 12.5,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#0F766E' : '#1E293B',
                      background: isSelected ? '#F0FDF4' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#F8FAFC';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div>{p.name}</div>
                      {p.dosageForm && p.packSize && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          {p.dosageForm} • {p.packSize}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ color: '#0F766E', flexShrink: 0 }} />}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '12px', fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
                No matching catalog products found
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
    activeBuyerAccount, orgProfile
  } = useApp();

  const isSpecialPartyBuyer = activeBuyerAccount === 'SPECIAL_PARTY';

  if (currentRole === 'SUPPLIER') {
    return <ManufacturerAssignedRFQsModule />;
  }

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);

  // RFQ Creation Wizard State (Steps 1, 2, 3, 4)
  const [localShowCreateDrawer, setLocalShowCreateDrawer] = useState(false);
  const showCreateDrawer = localShowCreateDrawer || isCreateRfqDrawerOpen;
  
  // Step State: 1 = Basic Info & Lines, 2 = General & Terms, 3 = Final RFQ Review & Submit
  const [rfqWizardStep, setRfqWizardStep] = useState<1 | 2 | 3>(1);
  const [isEditingDraftId, setIsEditingDraftId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-Generated RFQ Number
  const autoRfqNumber = useMemo(() => {
    if (isEditingDraftId) {
      const existing = rfqs.find(r => r.id === isEditingDraftId);
      if (existing) return existing.rfqNumber;
    }
    return `RFQ-2026-${String(rfqs.length + 1004).padStart(4, '0')}`;
  }, [rfqs, isEditingDraftId]);

  // RFQ Header & General Terms Fields State
  const [buyerName, setBuyerName] = useState<string>(isSpecialPartyBuyer ? 'MediPlus Healthcare (Special Party)' : 'Apex Pharma (Buyer)');
  const [customerName, setCustomerName] = useState<string>(isSpecialPartyBuyer ? 'MediPlus Healthcare' : 'Apex Pharma PCD Franchise');
  const [customerCode, setCustomerCode] = useState<string>(isSpecialPartyBuyer ? 'CUS000105' : 'CUS000101');
  const [rfqDate, setRfqDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [requiredDate, setRequiredDate] = useState<string>('2026-09-15');
  const [deadlineDate, setDeadlineDate] = useState<string>('2026-08-25');
  const [priority, setPriority] = useState<'STANDARD' | 'HIGH' | 'URGENT'>('HIGH');
  const [deliveryLocation, setDeliveryLocation] = useState<string>(isSpecialPartyBuyer ? 'Andheri East, Mumbai, Maharashtra' : 'Baddi Industrial Area, Himachal Pradesh');
  const [headerRemarks, setHeaderRemarks] = useState<string>('Fast delivery required as per specification.');

  React.useEffect(() => {
    if (isSpecialPartyBuyer) {
      setBuyerName('MediPlus Healthcare (Special Party)');
      setCustomerName('MediPlus Healthcare');
      setCustomerCode('CUS000105');
      setDeliveryLocation('Andheri East, Mumbai, Maharashtra');
    } else {
      setBuyerName('Apex Pharma (Buyer)');
      setCustomerName('Apex Pharma PCD Franchise');
      setCustomerCode('CUS000101');
      setDeliveryLocation('Baddi Industrial Area, Himachal Pradesh');
    }
  }, [isSpecialPartyBuyer]);

  // Credit Requirement State
  const [creditRequired, setCreditRequired] = useState<boolean>(true);
  const [creditTermsOption, setCreditTermsOption] = useState<string>('Net 30 Days');
  const [customCreditTerms, setCustomCreditTerms] = useState<string>('');

  // RFQ Product Lines State — initial 4 product lines (Requirement #2)
  const [rfqLines, setRfqLines] = useState<DraftProductLine[]>([
    {
      productId: 'p6',
      productName: 'Paracetamol 500mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 10 Strip',
      quantity: 10000,
      requiredDate: '2026-09-15',
      remarks: 'Fast delivery'
    },
    {
      productId: 'p1',
      productName: 'Amoxicillin 250mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 10 Strip',
      quantity: 5000,
      requiredDate: '2026-09-15',
      remarks: 'Standard packaging'
    },
    {
      productId: 'p3',
      productName: 'Azithromycin 500mg Tablets',
      dosageForm: 'Tablet',
      packSize: '10 x 3 Strip',
      quantity: 2000,
      requiredDate: '2026-09-15',
      remarks: 'Export quality'
    },
    {
      productId: 'p4',
      productName: 'Pantoprazole 40mg + Domperidone 30mg SR',
      dosageForm: 'Capsule',
      packSize: '10 x 10 Strip',
      quantity: 3000,
      requiredDate: '2026-09-15',
      remarks: 'Alu-Alu blister packaging'
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

  // Specific Clicked Manufacturer Profile Drawer State (Requirement #1)
  const [clickedProfileMfgId, setClickedProfileMfgId] = useState<string | null>(null);

  // Supplier Quote Submission Drawer State
  const [supplierQuoteRfq, setSupplierQuoteRfq] = useState<RFQ | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});

  // Filtered RFQs for table view
  const filteredRfqs = useMemo(() => {
    return rfqs.filter(rfq => {
      // Data isolation between Normal Buyer and Special Party Buyer demo personas
      if (isSpecialPartyBuyer) {
        if (rfq.customerClassification !== 'SPECIAL_PARTY' && rfq.customerId !== 'c5' && !rfq.customerName?.toLowerCase().includes('mediplus')) return false;
      } else {
        if (rfq.customerClassification === 'SPECIAL_PARTY' || rfq.customerId === 'c5' || rfq.customerName?.toLowerCase().includes('mediplus')) return false;
      }

      const matchSearch =
        rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.lines.some(l => l.productName.toLowerCase().includes(searchTerm.toLowerCase()));

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
    });
  }, [rfqs, isSpecialPartyBuyer, searchTerm, statusFilter]);

  // Derived Eligible Manufacturers for Step 3 & Step 4 Review (Only for Branded lines)
  const eligibleManufacturersForDraft = useMemo(() => {
    const validLines = rfqLines.filter(l => l.productId && l.quantity && l.productType !== 'GENERIC');
    const mfgMap = new Map<string, { mfg: Manufacturer; matchedProducts: string[] }>();

    validLines.forEach(line => {
      const lineMappings = mappings.filter(m => m.productId === line.productId);
      let matchedMfgIds = lineMappings.map(m => m.manufacturerId);

      if (matchedMfgIds.length === 0) {
        matchedMfgIds = manufacturers.slice(0, 2).map(m => m.id);
      }

      matchedMfgIds.forEach(mfgId => {
        const mfgObj = manufacturers.find(m => m.id === mfgId);
        if (!mfgObj) return;

        if (!mfgMap.has(mfgId)) {
          mfgMap.set(mfgId, { mfg: mfgObj, matchedProducts: [line.productName || 'Product'] });
        } else {
          const item = mfgMap.get(mfgId)!;
          if (!item.matchedProducts.includes(line.productName)) {
            item.matchedProducts.push(line.productName);
          }
        }
      });
    });

    return Array.from(mfgMap.values());
  }, [rfqLines, mappings, manufacturers]);

  // Handle Adding EXACTLY ONE EMPTY Product Row (Requirement #4)
  const handleAddEmptyProductRow = () => {
    setRfqLines(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        dosageForm: '',
        packSize: '',
        quantity: '',
        requiredDate: requiredDate || '2026-09-15',
        remarks: '',
        productType: 'BRANDED'
      }
    ]);
  };

  // Handle Remove Product Row
  const handleRemoveRow = (idx: number) => {
    if (rfqLines.length === 1) return;
    setRfqLines(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Row Field Change
  const handleRowChange = (idx: number, field: keyof DraftProductLine, value: any) => {
    setRfqLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;

      if (field === 'productType') {
        if (value === 'GENERIC') {
          const defaultMol = line.molecule || 'Paracetamol';
          return {
            ...line,
            productType: 'GENERIC',
            molecule: defaultMol,
            productId: `gen_${defaultMol.toLowerCase().replace(/[^a-z0-9]/g, '_')}_500`,
            productName: `${defaultMol} 500mg (Generic)`,
            dosageForm: line.dosageForm || 'Tablet',
            packSize: line.packSize || '10 x 10 Strip',
            strength: line.strength || '500mg',
            isOther: false,
            customProductName: ''
          };
        } else {
          return {
            ...line,
            productType: 'BRANDED',
            productId: '',
            productName: '',
            dosageForm: '',
            packSize: '',
            molecule: ''
          };
        }
      }

      if (field === 'molecule') {
        const mol = value;
        return {
          ...line,
          molecule: mol,
          productId: `gen_${mol.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${(line.strength || 'std').toLowerCase()}`,
          productName: `${mol} ${line.strength || '500mg'} (Generic)`
        };
      }

      if (field === 'productId') {
        if (value === 'other') {
          return {
            ...line,
            productId: 'other',
            productName: line.customProductName || 'Other Product',
            dosageForm: 'Custom',
            packSize: 'Custom Pack',
            isOther: true
          };
        }
        const found = products.find(p => p.id === value);
        if (found) {
          return {
            ...line,
            productId: value,
            productName: found.name,
            dosageForm: found.dosageForm,
            packSize: found.packSize,
            isOther: false,
            customProductName: '',
            quantity: line.quantity || ''
          };
        } else {
          return { ...line, productId: '', productName: '', dosageForm: '', packSize: '', isOther: false, customProductName: '' };
        }
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
  };

  // Open Edit Draft Drawer
  const handleOpenEditDraft = (rfq: RFQ) => {
    setIsEditingDraftId(rfq.id);
    setCustomerName(rfq.customerName);
    setRfqDate(rfq.createdDate);
    setDeadlineDate(rfq.deadlineDate);
    setHeaderRemarks(rfq.remarks || '');
    setRfqLines(rfq.lines.map(l => ({
      productId: l.productId,
      productName: l.productName,
      dosageForm: l.dosageForm,
      packSize: l.packSize,
      quantity: l.quantity,
      requiredDate: l.requiredDate,
      remarks: l.remarks || '',
      isOther: l.isOther || l.productId === 'other',
      customProductName: l.customProductName || ((l.isOther || l.productId === 'other') ? l.productName : '')
    })));
    setRfqWizardStep(1);
    setLocalShowCreateDrawer(true);
  };

  // Navigation validation for Step 1 -> Step 2
  const handleContinueToGeneralTerms = () => {
    const invalidLine = rfqLines.find(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule) : !!l.productId;
      return !hasProduct || !l.quantity || Number(l.quantity) <= 0;
    });
    if (invalidLine) {
      setValidationError('Required Quantity is mandatory and must be a positive number for every product line.');
      return;
    }
    const validLines = rfqLines.filter(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule) : !!l.productId;
      return hasProduct && l.quantity && Number(l.quantity) > 0;
    });
    if (validLines.length === 0) {
      setValidationError('Please select at least one product line and specify a valid quantity greater than 0.');
      return;
    }
    setValidationError(null);
    setRfqWizardStep(2);
  };

  // Save RFQ as Draft
  const handleSaveDraft = () => {
    const validLines = rfqLines.filter(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule) : !!l.productId;
      return hasProduct && l.quantity;
    });
    if (validLines.length === 0) {
      setValidationError('Please select at least one product and enter a quantity.');
      return;
    }

    setValidationError(null);
    const rfqId = isEditingDraftId || `rfq_${Date.now()}`;
    const hasGeneric = validLines.some(l => l.productType === 'GENERIC');

    const createdLines: RFQLine[] = validLines.map((line, idx) => {
      const genericProdId = line.productId || `gen_${(line.molecule || 'paracetamol').toLowerCase().replace(/[^a-z0-9]/g, '_')}_500`;
      const genericProdName = line.productName || `${line.molecule || 'Paracetamol'} (Generic)`;
      return {
        id: `line_${Date.now()}_${idx}`,
        productId: line.productType === 'GENERIC' ? genericProdId : line.productId,
        productName: line.productType === 'GENERIC'
          ? genericProdName
          : ((line.productId === 'other' || line.isOther) ? (line.customProductName || line.productName || 'Other Product') : line.productName),
        dosageForm: line.dosageForm || (line.productType === 'GENERIC' ? 'Tablet' : 'Custom'),
        packSize: line.packSize || (line.productType === 'GENERIC' ? '10 x 10 Strip' : 'Custom Pack'),
        quantity: Number(line.quantity),
        requiredDate: line.requiredDate || requiredDate,
        remarks: line.remarks,
        eligibleManufacturersCount: 0,
        isOther: line.productId === 'other' || line.isOther,
        customProductName: line.customProductName,
        productType: line.productType || 'BRANDED',
        molecule: line.molecule,
        adminProcessingStatus: line.productType === 'GENERIC' ? 'SUBMITTED' : undefined,
        buyerProvidedPrice: (isSpecialPartyBuyer || (line.buyerProvidedPrice !== undefined && line.buyerProvidedPrice !== ''))
          ? Number(line.buyerProvidedPrice || 14.50)
          : undefined
      };
    });

    const draftRfq: RFQ = {
      id: rfqId,
      rfqNumber: autoRfqNumber,
      customerId: isSpecialPartyBuyer ? 'c5' : 'c1',
      customerName: isSpecialPartyBuyer ? 'MediPlus Healthcare' : customerName,
      customerCode: isSpecialPartyBuyer ? 'CUS000105' : customerCode,
      customerClassification: isSpecialPartyBuyer ? 'SPECIAL_PARTY' : 'REGULAR',
      createdDate: rfqDate,
      deadlineDate,
      status: 'Draft',
      lines: createdLines,
      remarks: headerRemarks,
      priority,
      deliveryLocation,
      creditRequired,
      creditTerms: creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required',
      isGeneric: hasGeneric,
      genericStatus: hasGeneric ? 'DRAFT' : undefined
    };

    addRFQ(draftRfq);
    addAuditLog('RFQ Center', `Saved ${autoRfqNumber} as Draft (Status = Draft)`);
    closeDrawer();
    setIsEditingDraftId(null);
  };

  // Submit RFQ & Execute Automatic System Floating (Requirements #4 & #5)
  const handleExecuteRFQSubmission = () => {
    const invalidLine = rfqLines.find(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule) : !!l.productId;
      return !hasProduct || !l.quantity || Number(l.quantity) <= 0;
    });
    if (invalidLine) {
      setValidationError('Required Quantity is mandatory and must be a positive number for every product line.');
      return;
    }
    const validLines = rfqLines.filter(l => {
      const hasProduct = l.productType === 'GENERIC' ? !!(l.productId || l.molecule) : !!l.productId;
      return hasProduct && l.quantity && Number(l.quantity) > 0;
    });
    if (validLines.length === 0) {
      setValidationError('Please select at least one product and specify a valid quantity greater than 0.');
      return;
    }

    setValidationError(null);
    const rfqId = isEditingDraftId || `rfq_${Date.now()}`;

    const hasGeneric = validLines.some(l => l.productType === 'GENERIC');
    const allGeneric = validLines.every(l => l.productType === 'GENERIC');

    const createdLines: RFQLine[] = [];
    const createdMfgRfqsMap: Record<string, ManufacturerRFQ> = {};
    const notificationLogs: string[] = [];

    validLines.forEach((line, idx) => {
      const lineId = `line_${Date.now()}_${idx}`;
      const isLineGeneric = line.productType === 'GENERIC';

      if (isLineGeneric) {
        // Generic medicine line: NO external manufacturer query, directly routes to Admin
        const genericProdId = line.productId || `gen_${(line.molecule || 'paracetamol').toLowerCase().replace(/[^a-z0-9]/g, '_')}_500`;
        const genericProdName = line.productName || `${line.molecule || 'Paracetamol'} (Generic)`;
        createdLines.push({
          id: lineId,
          productId: genericProdId,
          productName: genericProdName,
          genericName: line.molecule || 'Paracetamol',
          molecule: line.molecule || 'Paracetamol',
          productType: 'GENERIC',
          dosageForm: line.dosageForm || 'Tablet',
          packSize: line.packSize || '10 x 10 Strip',
          quantity: Number(line.quantity),
          requiredDate: line.requiredDate || requiredDate,
          remarks: line.remarks,
          eligibleManufacturersCount: 0,
          adminProcessingStatus: 'SUBMITTED'
        });
      } else {
        // Branded product line: Query MANUFACTURER_PRODUCT table
        const lineMappings = mappings.filter(m => m.productId === line.productId);
        let eligibleMfgIds = lineMappings.map(m => m.manufacturerId);

        if (eligibleMfgIds.length === 0) {
          eligibleMfgIds = manufacturers.slice(0, 2).map(m => m.id);
        }

        eligibleMfgIds = Array.from(new Set(eligibleMfgIds));

        createdLines.push({
          id: lineId,
          productId: line.productId,
          productName: (line.productId === 'other' || line.isOther) ? (line.customProductName || line.productName || 'Other Product') : line.productName,
          dosageForm: line.dosageForm || 'Custom',
          packSize: line.packSize || 'Custom Pack',
          quantity: Number(line.quantity),
          requiredDate: line.requiredDate || requiredDate,
          remarks: line.remarks,
          productType: 'BRANDED',
          eligibleManufacturersCount: eligibleMfgIds.length,
          eligibleManufacturerIds: eligibleMfgIds,
          isOther: line.productId === 'other' || line.isOther,
          customProductName: line.customProductName,
          buyerProvidedPrice: (isSpecialPartyBuyer || (line.buyerProvidedPrice !== undefined && line.buyerProvidedPrice !== ''))
            ? Number(line.buyerProvidedPrice || 14.50)
            : undefined
        });

        // Create MANUFACTURER_RFQ and MANUFACTURER_RFQ_LINE records for branded
        eligibleMfgIds.forEach(mfgId => {
          const mfgObj = manufacturers.find(m => m.id === mfgId);
          const mfgName = mfgObj ? (mfgObj.companyName || mfgObj.name) : 'Verified Manufacturer';

          if (!createdMfgRfqsMap[mfgId]) {
            createdMfgRfqsMap[mfgId] = {
              id: `mfg_rfq_${Date.now()}_${mfgId}`,
              rfqId,
              rfqNumber: autoRfqNumber,
              manufacturerId: mfgId,
              manufacturerName: mfgName,
              status: 'Sent',
              sentDate: new Date().toISOString().split('T')[0],
              emailNotificationSent: true,
              smsNotificationSent: true,
              lines: []
            };

            notificationLogs.push(`📧 Email Notification sent to ${mfgObj?.email || 'contact@manufacturer.com'} for ${autoRfqNumber}`);
            notificationLogs.push(`📱 SMS Notification sent to ${mfgObj?.phone || '+91 98765 43210'} for ${autoRfqNumber}`);
          }

          createdMfgRfqsMap[mfgId].lines.push({
            id: `mfg_line_${Date.now()}_${idx}`,
            manufacturerRfqId: createdMfgRfqsMap[mfgId].id,
            rfqLineId: lineId,
            productId: line.productId,
            productName: line.productName,
            quantity: Number(line.quantity),
            requiredDate: line.requiredDate || requiredDate,
            remarks: line.remarks
          });
        });
      }
    });

    const mfgRfqList = Object.values(createdMfgRfqsMap);
    const matchedCust = (customers || []).find(c =>
      (isSpecialPartyBuyer ? (c.id === 'c5' || c.name.includes('MediPlus')) : (c.id === 'c1' || c.name === customerName))
    );

    const finalRfq: RFQ = {
      id: rfqId,
      rfqNumber: autoRfqNumber,
      customerId: isSpecialPartyBuyer ? 'c5' : 'c1',
      customerName: isSpecialPartyBuyer ? 'MediPlus Healthcare' : customerName,
      customerCode: isSpecialPartyBuyer ? 'CUS000105' : customerCode,
      customerClassification: isSpecialPartyBuyer ? 'SPECIAL_PARTY' : (matchedCust?.customerClassification || 'REGULAR'),
      createdDate: rfqDate,
      deadlineDate,
      status: allGeneric ? 'Submitted' : 'Pricing In Progress',
      quoteStatus: allGeneric ? 'PENDING_PRICING' : undefined,
      isGeneric: hasGeneric,
      genericStatus: hasGeneric ? 'SUBMITTED' : undefined,
      lines: createdLines,
      remarks: headerRemarks,
      priority,
      deliveryLocation,
      creditRequired,
      creditTerms: creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required'
    };

    addRFQ(finalRfq);
    if (mfgRfqList.length > 0) {
      setManufacturerRfqsStore(prev => ({ ...prev, [rfqId]: mfgRfqList }));
    }

    if (allGeneric) {
      addAuditLog('RFQ Center', `Submitted Generic RFQ ${autoRfqNumber} with ${createdLines.length} generic line(s) directly to FactoryGrid Admin desk for internal price list quotation.`);
    } else {
      addAuditLog('RFQ Center', `Submitted ${autoRfqNumber} with ${createdLines.length} lines & floated to ${mfgRfqList.length} manufacturers (Status = Pricing In Progress)`);
    }

    closeDrawer();
    setIsEditingDraftId(null);

    setDistributionResultModal({
      rfqNumber: autoRfqNumber,
      mfgRfqs: mfgRfqList,
      logs: notificationLogs,
      isGeneric: hasGeneric,
      genericLinesCount: createdLines.filter(l => l.productType === 'GENERIC').length
    });
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
              filteredRfqs.map(rfq => {
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

      {/* ── 4-STEP UNIFIED RFQ CREATION WIZARD DRAWER ── */}
      {showCreateDrawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={closeDrawer}>
          <div style={{ width: '100%', maxWidth: 780, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }} onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>{autoRfqNumber}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>Step {rfqWizardStep} of 3</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>
                  {rfqWizardStep === 1 && 'Basic Information & Product Lines'}
                  {rfqWizardStep === 2 && 'General & RFQ Terms'}
                  {rfqWizardStep === 3 && 'Review & Submit RFQ'}
                </h2>
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* 3-Step Indicator Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid #E2E8F0', background: '#F1F5F9' }}>
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
              <div style={{ margin: '16px 24px 0', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, color: '#B91C1C', fontSize: 13 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{validationError}</span>
              </div>
            )}

            {/* ── STEP 1: BASIC INFORMATION & PRODUCT LINES BUILDER ── */}
            {rfqWizardStep === 1 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Basic Info Header */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.05em' }}>
                    RFQ Header Details
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Auto RFQ Number</label>
                      <input type="text" disabled value={autoRfqNumber} style={{ width: '100%', padding: '8px 12px', background: '#E2E8F0', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Buyer Name</label>
                      <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Company Name</label>
                      <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
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

                {/* PRODUCT LINES BUILDER (Requirement #4 — Strict Empty Row on Add) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>RFQ Product Lines ({rfqLines.length})</h4>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Add one or multiple products to include in this RFQ.</div>
                    </div>
                    <button
                      onClick={handleAddEmptyProductRow}
                      style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', border: '1px solid rgba(15, 118, 110, 0.25)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={14} /> + Add Product
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {rfqLines.map((line, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#F8FAFC',
                          border: isSpecialPartyBuyer ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: 16,
                          position: 'relative'
                        }}
                      >
                        {/* Remove Row Button */}
                        {rfqLines.length > 1 && (
                          <button
                            onClick={() => handleRemoveRow(idx)}
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: 4
                            }}
                            title="Remove Product Line"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {/* Product Line Header with Product Type Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E' }}>
                              Item #{idx + 1}
                            </span>
                            {line.productType === 'GENERIC' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>
                                Generic Medicine
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 2, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                            <button
                              type="button"
                              onClick={() => handleRowChange(idx, 'productType', 'BRANDED')}
                              style={{
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                background: line.productType !== 'GENERIC' ? '#FFFFFF' : 'transparent',
                                color: line.productType !== 'GENERIC' ? '#0F172A' : '#64748B',
                                boxShadow: line.productType !== 'GENERIC' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Branded Medicine
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRowChange(idx, 'productType', 'GENERIC')}
                              style={{
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                background: line.productType === 'GENERIC' ? '#0F766E' : 'transparent',
                                color: line.productType === 'GENERIC' ? '#FFFFFF' : '#64748B',
                                boxShadow: line.productType === 'GENERIC' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Generic Medicine
                            </button>
                          </div>
                        </div>

                        {line.productType === 'GENERIC' ? (
                          /* ── GENERIC MEDICINE: MOLECULE & SPECS SELECTION ── */
                          <div style={{ marginBottom: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <label style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                                Molecule / Active Ingredient *
                              </label>
                              <span style={{ fontSize: 10.5, color: '#15803D', fontWeight: 600 }}>
                                Brand not required · No brand certificate required
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10, marginBottom: 8 }}>
                              <div>
                                <select
                                  value={line.molecule || 'Paracetamol'}
                                  onChange={e => handleRowChange(idx, 'molecule', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: '#FFFFFF',
                                    border: '1px solid #86EFAC',
                                    borderRadius: 6,
                                    fontSize: 12.5,
                                    fontWeight: 700,
                                    color: '#0F172A'
                                  }}
                                >
                                  {STANDARD_MOLECULES.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="Dosage & Strength (e.g. 500mg Tablet)"
                                  value={line.dosageForm || 'Tablet'}
                                  onChange={e => handleRowChange(idx, 'dosageForm', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    background: '#FFFFFF',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: 6,
                                    fontSize: 12.5,
                                    color: '#0F172A'
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: '#166534', background: 'rgba(255,255,255,0.7)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(134, 239, 172, 0.4)' }}>
                              ℹ️ <strong>Generic Sourcing:</strong> Request is routed directly to FactoryGrid Admin to determine price from the internal price list. FactoryGrid acts as supplier.
                            </div>
                          </div>
                        ) : (
                          /* ── BRANDED MEDICINE: SEARCHABLE PRODUCT SELECTOR ── */
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Product *</label>
                            <SearchableProductSelect
                              products={products}
                              selectedProductId={line.productId}
                              selectedProductName={line.productName}
                              isOther={line.isOther}
                              customProductName={line.customProductName}
                              onSelectProduct={(product) => {
                                setRfqLines(prev => prev.map((l, i) => {
                                  if (i !== idx) return l;
                                  return {
                                    ...l,
                                    productId: product.id,
                                    productName: product.name,
                                    dosageForm: product.dosageForm,
                                    packSize: product.packSize,
                                    isOther: false,
                                    customProductName: '',
                                    productType: 'BRANDED'
                                  };
                                }));
                              }}
                              onSelectOther={() => {
                                setRfqLines(prev => prev.map((l, i) => {
                                  if (i !== idx) return l;
                                  return {
                                    ...l,
                                    productId: 'other',
                                    productName: l.customProductName || 'Other Product',
                                    dosageForm: 'Custom',
                                    packSize: 'Custom Pack',
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
                        )}

                        {/* Quantity, Required Date & Special Party Agreed Price */}
                        <div style={{ display: 'grid', gridTemplateColumns: isSpecialPartyBuyer ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Quantity *</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="Enter Quantity"
                              value={line.quantity}
                              onChange={e => handleRowChange(idx, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                              style={{ width: '100%', padding: '8px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Required Date *</label>
                            <input
                              type="date"
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
                          <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Remarks</label>
                          <input
                            type="text"
                            placeholder="Enter Remarks"
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
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 14 }}>
                    General & Delivery Terms (Step 2)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>RFQ Date</label>
                      <input type="date" value={rfqDate} onChange={e => setRfqDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>General Required Date</label>
                      <input type="date" value={requiredDate} onChange={e => setRequiredDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
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
                      <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Special Remarks / Instructions</label>
                    <textarea rows={3} value={headerRemarks} onChange={e => setHeaderRemarks(e.target.value)} placeholder="Enter delivery terms or packaging instructions..." style={{ width: '100%', padding: '9px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontSize: 13 }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: FINAL RFQ REVIEW & SUBMISSION ── */}
            {rfqWizardStep === 3 && (
              <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Header Information Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10 }}>
                    Review & Submit RFQ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12.5 }}>
                    <div><span style={{ color: '#64748B' }}>RFQ Number:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{autoRfqNumber}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Buyer:</span> <strong style={{ color: '#0F172A' }}>{buyerName}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Company:</span> <strong style={{ color: '#0F172A' }}>{customerName}</strong></div>
                    <div><span style={{ color: '#64748B' }}>RFQ Date:</span> <strong style={{ color: '#0F172A' }}>{rfqDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Credit Terms:</span> <strong style={{ color: '#0F766E' }}>{creditRequired ? (creditTermsOption === 'Custom' ? (customCreditTerms || 'Credit Required') : creditTermsOption) : 'No Credit Required'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Required Date:</span> <strong style={{ color: '#0F172A' }}>{requiredDate}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Priority:</span> <strong style={{ color: '#D97706' }}>{priority}</strong></div>
                    <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Delivery Location:</span> <span style={{ color: '#0F172A' }}>{deliveryLocation}</span></div>
                    {isSpecialPartyBuyer && (
                      <div style={{ gridColumn: 'span 4', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, color: '#92400E', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                        <Star size={14} fill="#D97706" color="#D97706" />
                        <span>Special Party Submission: Agreed unit prices will be forwarded to manufacturer for direct confirmation.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* REQUISITION PRODUCT LINES */}
                <div style={{ border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    REQUISITION PRODUCT LINES ({rfqLines.filter(l => l.productId && l.quantity).length})
                  </div>
                  
                  {/* INTERNAL SCROLLABLE PRODUCT LIST CONTAINER */}
                  <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {rfqLines.filter(l => l.productId && l.quantity).map((line, i, arr) => (
                      <div
                        key={i}
                        style={{
                          padding: '14px 16px',
                          borderBottom: i < arr.length - 1 ? '1px solid #E2E8F0' : 'none',
                          background: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 16,
                          fontSize: 13
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14, wordBreak: 'break-word' }}>
                            {line.productName}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
                            <span><strong>Required Date:</strong> {line.requiredDate || requiredDate || 'N/A'}</span>
                            {line.remarks && (
                              <span>· <strong>Remarks:</strong> {line.remarks}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 800, color: '#0F766E', fontSize: 14, fontFamily: 'monospace' }}>
                            {Number(line.quantity).toLocaleString()} Units
                          </div>
                          {(isSpecialPartyBuyer || line.buyerProvidedPrice !== undefined) && (
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B45309', marginTop: 2 }}>
                              Agreed: ₹{(line.buyerProvidedPrice ? Number(line.buyerProvidedPrice) : 14.50).toFixed(2)}/unit
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generic Request Admin Routing Banner */}
                {rfqLines.some(l => l.productType === 'GENERIC') && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🏛️ FactoryGrid Admin Direct Generic Routing
                    </div>
                    <div style={{ fontSize: 12, color: '#15803D', lineHeight: 1.5, marginBottom: 8 }}>
                      Your Generic Medicine line items will be routed directly to <strong>FactoryGrid Platform Admin</strong> for quotation using FactoryGrid's internal price list. External manufacturers will <strong>NOT</strong> be contacted, and no brand certificates are required.
                    </div>
                    <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 700 }}>
                      ✓ Sourced by Molecule & Internal Price List · FactoryGrid acts as supplier · Seamless Quote/Order Integration
                    </div>
                  </div>
                )}

                {/* Eligible Manufacturers Summary (Only shown if branded lines exist) */}
                {rfqLines.some(l => l.productType !== 'GENERIC') && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                      {eligibleManufacturersForDraft.length} Eligible Manufacturers Identified (Branded Products)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {eligibleManufacturersForDraft.map(e => (
                        <span
                          key={e.mfg.id}
                          onClick={() => setClickedProfileMfgId(e.mfg.id)}
                          style={{ padding: '6px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#0F766E', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {e.mfg.companyName || e.mfg.name} →
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#0F766E', fontWeight: 600 }}>
                      ✓ Your branded RFQ lines will be automatically distributed to eligible manufacturers after submission.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drawer Footer Actions (Wizard Navigation) */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <div>
                {rfqWizardStep > 1 ? (
                  <button
                    onClick={() => setRfqWizardStep((rfqWizardStep - 1) as any)}
                    style={{ padding: '10px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                ) : (
                  <button
                    onClick={closeDrawer}
                    style={{ padding: '10px 16px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Save Draft button accessible at Step 3 */}
                {rfqWizardStep === 3 && (
                  <button
                    onClick={handleSaveDraft}
                    style={{ padding: '10px 18px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save Draft
                  </button>
                )}

                {/* Wizard Next / Submit Buttons */}
                {rfqWizardStep === 1 && (
                  <button
                    onClick={handleContinueToGeneralTerms}
                    style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Continue to General & Terms →
                  </button>
                )}

                {rfqWizardStep === 2 && (
                  <button
                    onClick={() => setRfqWizardStep(3)}
                    style={{ padding: '10px 22px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Continue to RFQ Review →
                  </button>
                )}

                {rfqWizardStep === 3 && (
                  <button
                    onClick={handleExecuteRFQSubmission}
                    style={{ padding: '10px 24px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Send size={15} /> Submit RFQ
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
                {distributionResultModal.mfgRfqs.length > 0 ? 'RFQ System Floating Complete' : 'Generic RFQ Successfully Submitted'}
              </h3>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                {distributionResultModal.mfgRfqs.length > 0 ? (
                  <>Query <strong>MANUFACTURER_PRODUCT</strong> executed. Main RFQ status updated to <strong>Pricing In Progress</strong>.</>
                ) : (
                  <>Generic request routed directly to <strong>FactoryGrid Admin</strong> for internal price list quotation. Status: <strong>Submitted</strong>.</>
                )}
              </div>
            </div>

            {/* Created MANUFACTURER_RFQ Records Table (if branded lines exist) */}
            {distributionResultModal.mfgRfqs.length > 0 && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '8px 12px', background: '#F1F5F9', fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  MANUFACTURER_RFQ Distribution Records
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
