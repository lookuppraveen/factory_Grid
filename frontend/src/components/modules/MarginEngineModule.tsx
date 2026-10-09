import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, CategoryMaster, CategoryMargin, MarginRule, Manufacturer, MarginType } from '../../types';
import {
  Percent, Search, Filter, CheckCircle2, ArrowRight, DollarSign,
  Package, Layers, Edit3, ShieldAlert, Sparkles, RefreshCw, Sliders,
  TrendingUp, Check, Info, AlertCircle, Zap, Eye, ArrowLeft, X,
  Building2, Factory, HelpCircle, ChevronRight, ChevronDown, Plus, Trash2,
  Download, UploadCloud, FileSpreadsheet, CheckCheck
} from 'lucide-react';
import { EnterpriseMetricBar } from '../common/EnterpriseMetricBar';

export const MarginEngineModule: React.FC = () => {
  const {
    currentRole,
    categories,
    products,
    manufacturers,
    mappings,
    categoryMargins,
    marginRules,
    setMarginRules,
    addOrUpdateMarginRule,
    deleteMarginRule,
    getApplicableMargin,
    updateCategoryMargin,
    getCategoryMargin,
    getCategoryMarginConfig,
    updateProductMaster,
    addProductMaster,
    addAuditLog,
    setActiveTab,
    platformFeeConfig,
    updatePlatformFeeConfig,
    updateProductMargin,
    bulkUpdateProductMargins
  } = useApp();

  // Active Sub-view: 'CONFIG' (Category Matrix) | 'MFG_CONFIG' (Manufacturer Matrix) | 'SKU_INSPECTOR' (Product List / SKU Margin Matrix)
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'MFG_CONFIG' | 'SKU_INSPECTOR'>('CONFIG');

  // Category search / filter
  const [catSearchTerm, setCatSearchTerm] = useState('');

  // Manufacturer search / filter for MFG_CONFIG tab
  const [mfgSearchTerm, setMfgSearchTerm] = useState('');

  // SKU filter / search state
  const [skuSearchQuery, setSkuSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedManufacturerFilter, setSelectedManufacturerFilter] = useState<string>('ALL');
  const [selectedSkuForSimulation, setSelectedSkuForSimulation] = useState<Product | null>(products[0] || null);

  // Simulation Base Price Input
  const [simBasePrice, setSimBasePrice] = useState<number>(selectedSkuForSimulation?.basePrice || 100);

  // Editing Margin State: Record<categoryId, { type: MarginType; value: number }>
  const [editingMargins, setEditingMargins] = useState<Record<string, { type: MarginType; value: number }>>({});
  // Editing Manufacturer Margins: Record<manufacturerId, { type: MarginType; value: number }>
  const [editingMfgMargins, setEditingMfgMargins] = useState<Record<string, { type: MarginType; value: number }>>({});
  // Editing Product Margins State: Record<productId, number>
  const [editingProductMargins, setEditingProductMargins] = useState<Record<string, number>>({});
  const [savedCategoryToast, setSavedCategoryToast] = useState<string | null>(null);

  // Manufacturer + Category override creation inputs
  const [overrideCatId, setOverrideCatId] = useState<string>(categories[0]?.id || 'cat_drugs');
  const [overrideMarginPct, setOverrideMarginPct] = useState<number>(12);

  // Quick Preset values
  const PRESET_MARGINS = [5, 8, 10, 12, 15, 18, 20];

  // Option A: Manual Edit Product Margin Modal State
  const [editMarginModal, setEditMarginModal] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    sku: string;
    manufacturerId: string;
    manufacturerName: string;
    mfgProductCode: string;
    basePrice: number;
    marginType: MarginType;
    marginValue: number;
  } | null>(null);

  // Option B: Excel / CSV Product Margins Upload Modal State
  interface ExcelMarginRow {
    rowNum: number;
    manufacturerNameOrCode: string;
    mfgProductCode: string;
    sku: string;
    productName: string;
    marginTypeStr: string;
    marginValueStr: string;
    resolvedManufacturerId?: string;
    resolvedProductId?: string;
    resolvedMarginType?: MarginType;
    resolvedMarginValue?: number;
    currentMarginType?: MarginType;
    currentMarginValue?: number;
    isUpdate: boolean;
    isValid: boolean;
    errors: string[];
  }
  const [isExcelMarginModalOpen, setIsExcelMarginModalOpen] = useState(false);
  const [excelMarginRows, setExcelMarginRows] = useState<ExcelMarginRow[]>([]);
  const [excelMarginFileName, setExcelMarginFileName] = useState<string>('');
  const [isProcessingMarginBulk, setIsProcessingMarginBulk] = useState(false);
  const [excelMarginSuccessMessage, setExcelMarginSuccessMessage] = useState<string | null>(null);

  // Platform Fee Configuration Modal State
  const [isPlatformFeeModalOpen, setIsPlatformFeeModalOpen] = useState(false);
  const [draftPlatformFee, setDraftPlatformFee] = useState<number>(platformFeeConfig?.feeValue ?? 2.0);

  // Tab 2: Expanded Manufacturers state
  const [expandedMfgIds, setExpandedMfgIds] = useState<Record<string, boolean>>({
    'm1': true,
    'm2': true
  });

  // All manufacturers including FactoryGrid Direct / Generic Supply
  const allManufacturers = useMemo(() => {
    const list = [...manufacturers];
    if (!list.some(m => m.id === 'mfg_fg_direct')) {
      list.push({
        id: 'mfg_fg_direct',
        code: 'FGD-001',
        name: 'FactoryGrid Direct / Generic Supply',
        companyName: 'FactoryGrid Direct / Generic Supply',
        brandName: 'FactoryGrid Direct',
        mfgLicenseNo: 'DL-FG-DIRECT-2026-001',
        gstin: '29AAFCS9999P1Z8',
        pan: 'AAFCS9999P',
        contactPerson: 'Generic Supply Desk',
        email: 'generics@factorygrid.com',
        phone: '+91 80 4567 8900',
        city: 'Bengaluru',
        state: 'Karnataka',
        rating: 4.9,
        complianceStatus: 'APPROVED',
        status: 'ACTIVE',
        activeSubOrders: 0,
        description: 'Internal platform direct supply pool for Generic Medicines'
      });
    }
    return list;
  }, [manufacturers]);

  // Helper to identify generic products
  const isGeneric = (p: Product): boolean => {
    return !!p.isGeneric || (p.name && p.name.includes('(Generic)')) || (p.code && p.code.startsWith('GEN'));
  };

  // Helper to get manufacturer IDs for a product
  // CRITICAL GENERIC MEDICINE RULE: Generic products strictly have 'mfg_fg_direct' as source, NEVER external manufacturers!
  const getProductManufacturers = (p: Product): string[] => {
    if (isGeneric(p)) {
      return ['mfg_fg_direct'];
    }
    const mfgIds = (mappings || [])
      .filter(m => m.productId === p.id && m.manufacturerId !== 'mfg_fg_direct')
      .map(m => m.manufacturerId || '')
      .filter(Boolean);
    return mfgIds;
  };

  // Helper for strict category matching
  const matchesCategory = (p: Product, catFilter: string): boolean => {
    if (!catFilter || catFilter === 'ALL') return true;
    const filter = catFilter.toLowerCase().trim();
    if (p.category && p.category.toLowerCase().trim() === filter) {
      return true;
    }
    if (!p.category && p.dosageForm) {
      const df = p.dosageForm.toLowerCase().trim();
      if (df === filter || filter.startsWith(df) || df.startsWith(filter)) {
        return true;
      }
    }
    return false;
  };

  // Helper for manufacturer matching
  const matchesManufacturer = (p: Product, mfgFilter: string): boolean => {
    if (!mfgFilter || mfgFilter === 'ALL') return true;
    if (mfgFilter === 'mfg_fg_direct') {
      return isGeneric(p);
    }
    // Generic products NEVER match any external manufacturer!
    if (isGeneric(p)) {
      return false;
    }
    const mfgIds = getProductManufacturers(p);
    return mfgIds.includes(mfgFilter);
  };

  // Guarantee every category has at least one demo product with a valid SKU
  const allAvailableProducts = useMemo(() => {
    const list = [...products];

    categories.forEach(cat => {
      const hasCatProduct = list.some(p => matchesCategory(p, cat.name));
      if (!hasCatProduct) {
        const skuPrefix = cat.code ? cat.code.replace(/^CAT-/, '').substring(0, 3).toUpperCase() : cat.name.substring(0, 3).toUpperCase();
        const fallbackProduct: Product = {
          id: `demo_${cat.id || cat.code || cat.name}`,
          code: `PRD-${cat.code || cat.name.substring(0, 3).toUpperCase()}-001`,
          sku: `${skuPrefix}-100`,
          name: `${cat.name} Formulation 100mg`,
          genericName: `Standard ${cat.name} Compound`,
          saltCombination: `${cat.name} Active Extract 100mg`,
          dosageForm: 'Tablet',
          strength: '100mg',
          packSize: '10 x 10 Strip',
          uom: 'Boxes',
          description: `Standard formulation for ${cat.name}`,
          category: cat.name,
          basePrice: 25.00,
          manufacturersCount: 1,
          moq: 1000,
          regulatoryInfo: ['Standard Quality']
        };
        list.push(fallbackProduct);
      }
    });

    return list;
  }, [products, categories]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const configuredCount = categoryMargins.length;
    const totalPercentage = categoryMargins.reduce((sum, m) => {
      const type = m.marginType || 'PERCENTAGE';
      return sum + (type === 'PERCENTAGE' ? m.marginPercentage : 0);
    }, 0);
    const pctCount = categoryMargins.filter(m => (m.marginType || 'PERCENTAGE') === 'PERCENTAGE').length;
    const avgMargin = pctCount > 0 ? (totalPercentage / pctCount).toFixed(1) : '10.0';
    const activeRulesCount = marginRules.filter(r => r.status === 'Active').length;
    const mfgRulesCount = marginRules.filter(r => r.status === 'Active' && r.manufacturer_id).length;

    return {
      configuredCount,
      avgMargin,
      activeRulesCount,
      mfgRulesCount,
      totalProducts: allAvailableProducts.length
    };
  }, [categoryMargins, marginRules, allAvailableProducts]);

  // Filtered categories for config tab
  const filteredCategoryList = useMemo(() => {
    return categories.filter(c => {
      const q = catSearchTerm.toLowerCase().trim();
      return q === '' || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [categories, catSearchTerm]);

  // Filtered manufacturers for mfg tab
  const filteredMfgList = useMemo(() => {
    return allManufacturers.filter(m => {
      const q = mfgSearchTerm.toLowerCase().trim();
      return q === '' ||
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.companyName && m.companyName.toLowerCase().includes(q)) ||
        (m.brandName && m.brandName.toLowerCase().includes(q));
    });
  }, [allManufacturers, mfgSearchTerm]);

  // Filtered products for SKU inspector
  const filteredSkuProducts = useMemo(() => {
    return allAvailableProducts.filter(p => {
      const q = skuSearchQuery.toLowerCase().trim();
      const matchesQuery =
        q === '' ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.genericName && p.genericName.toLowerCase().includes(q));

      const matchesCat = matchesCategory(p, selectedCategoryFilter);
      const matchesMfg = matchesManufacturer(p, selectedManufacturerFilter);

      return matchesQuery && matchesCat && matchesMfg;
    });
  }, [allAvailableProducts, skuSearchQuery, selectedCategoryFilter, selectedManufacturerFilter, mappings]);

  // Handle Select Product for Simulation
  const handleSelectProductForSim = (product: Product) => {
    setSelectedSkuForSimulation(product);
    setSimBasePrice(product.basePrice || 100);
  };

  // Helper to resolve effective margin for product
  const resolveProductMargin = (p: Product) => {
    const isGen = isGeneric(p);
    const mfgId = isGen ? 'mfg_fg_direct' : (selectedManufacturerFilter !== 'ALL' ? selectedManufacturerFilter : getProductManufacturers(p)[0]);
    return getApplicableMargin({
      productId: p.id,
      sku: p.sku || p.code,
      manufacturerId: mfgId,
      categoryId: p.categoryId,
      categoryName: p.category || p.dosageForm,
      isGeneric: isGen
    });
  };

  // Handle Save Category Margin
  const handleSaveCategoryMargin = (cat: CategoryMaster) => {
    const currentConfig = getCategoryMarginConfig(cat.name);
    const draft = editingMargins[cat.id] || { type: currentConfig.marginType, value: currentConfig.marginValue };

    if (draft.value === undefined || draft.value === null || isNaN(draft.value)) {
      alert('Please enter a valid numeric margin value.');
      return;
    }
    if (draft.value < 0) {
      alert('Margin value cannot be negative.');
      return;
    }
    if (draft.type === 'PERCENTAGE' && draft.value > 100) {
      alert('Margin percentage cannot exceed 100%.');
      return;
    }

    updateCategoryMargin(cat.name, draft.value, draft.type);
    const displayUnit = draft.type === 'FIXED_RATE' ? `₹${draft.value}/unit` : `${draft.value}%`;
    setSavedCategoryToast(`Margin for ${cat.name} updated to ${displayUnit}`);
    setTimeout(() => setSavedCategoryToast(null), 3000);
  };

  // Handle Save Manufacturer Margin
  const handleSaveMfgMargin = (mfg: Manufacturer) => {
    const currentMfgRule = marginRules.find(r => r.manufacturer_id === mfg.id && !r.category_id && !r.product_id && !r.sku_id && r.status === 'Active');
    const defaultType: MarginType = currentMfgRule?.margin_type || 'PERCENTAGE';
    const defaultValue: number = currentMfgRule?.margin_value ?? (defaultType === 'FIXED_RATE' ? (currentMfgRule?.margin_rate ?? 0) : (currentMfgRule?.margin_percentage ?? 10));
    const draft = editingMfgMargins[mfg.id] || { type: defaultType, value: defaultValue };

    if (draft.value === undefined || draft.value === null || isNaN(draft.value)) {
      alert('Please enter a valid numeric margin value.');
      return;
    }
    if (draft.value < 0) {
      alert('Margin value cannot be negative.');
      return;
    }
    if (draft.type === 'PERCENTAGE' && draft.value > 100) {
      alert('Margin percentage cannot exceed 100%.');
      return;
    }

    addOrUpdateMarginRule({
      scope_type: 'MANUFACTURER',
      manufacturer_id: mfg.id,
      manufacturer_name: mfg.brandName || mfg.companyName || mfg.name,
      margin_type: draft.type,
      margin_value: draft.value,
      margin_rate: draft.type === 'FIXED_RATE' ? draft.value : undefined,
      margin_percentage: draft.type === 'PERCENTAGE' ? draft.value : undefined,
      priority: 3,
      status: 'Active'
    });

    const displayUnit = draft.type === 'FIXED_RATE' ? `₹${draft.value}/unit` : `${draft.value}%`;
    setSavedCategoryToast(`Manufacturer margin for ${mfg.brandName || mfg.companyName || mfg.name} set to ${displayUnit}`);
    setTimeout(() => setSavedCategoryToast(null), 3000);
  };

  // Handle Save Manufacturer + Category Margin Override
  const handleSaveMfgCategoryOverride = (mfgId: string, catId: string, marginPct: number) => {
    const mfg = allManufacturers.find(m => m.id === mfgId);
    const cat = categories.find(c => c.id === catId);
    if (!mfg || !cat) return;
    if (marginPct < 0 || marginPct > 100) return;

    addOrUpdateMarginRule({
      manufacturer_id: mfg.id,
      manufacturer_name: mfg.brandName || mfg.companyName || mfg.name,
      category_id: cat.id,
      category_name: cat.name,
      margin_percentage: marginPct,
      priority: 2,
      status: 'Active'
    });

    setSavedCategoryToast(`Saved ${mfg.brandName || mfg.name} + ${cat.name} margin override: ${marginPct}%`);
    setTimeout(() => setSavedCategoryToast(null), 3000);
  };

  // Handle Save Product Margin
  const handleSaveProductMargin = (p: Product) => {
    const defaultResolved = resolveProductMargin(p);
    const effectiveMargin = editingProductMargins[p.id] ?? defaultResolved.marginPercentage;
    if (effectiveMargin < 0 || effectiveMargin > 100) return;

    addOrUpdateMarginRule({
      product_id: p.id,
      sku_id: p.sku || p.code,
      margin_percentage: effectiveMargin,
      priority: 1,
      status: 'Active'
    });

    const exists = products.some(item => item.id === p.id);
    if (exists) {
      updateProductMaster(p.id, { marginPercentage: effectiveMargin });
    } else {
      addProductMaster({ ...p, marginPercentage: effectiveMargin });
    }

    addAuditLog('MARGIN_ENGINE', `Updated product margin for SKU ${p.sku || p.code} (${p.name}) to ${effectiveMargin}%`);
    setSavedCategoryToast(`Margin for SKU ${p.sku || p.code} updated to ${effectiveMargin}% (Priority 1)`);
    setEditingProductMargins(prev => {
      const next = { ...prev };
      delete next[p.id];
      return next;
    });
    setTimeout(() => setSavedCategoryToast(null), 3000);
  };

  // Currently selected manufacturer object (if one is chosen)
  const currentSelectedMfg = useMemo(() => {
    if (selectedManufacturerFilter === 'ALL') return null;
    return allManufacturers.find(m => m.id === selectedManufacturerFilter) || null;
  }, [selectedManufacturerFilter, allManufacturers]);

  // Simulation calculation with STRICT Product Margin + SEPARATE Platform Fee
  const simCalculation = useMemo(() => {
    if (!selectedSkuForSimulation) {
      return {
        base: 100,
        marginDisplay: '10%',
        marginType: 'PERCENTAGE' as MarginType,
        marginAmt: 10,
        platformFeePct: 2.0,
        platformFeeAmt: 2.2,
        buyerPrice: 112.2,
        ruleType: 'DEFAULT',
        ruleSource: 'Platform Baseline'
      };
    }
    const resolved = resolveProductMargin(selectedSkuForSimulation);
    const base = simBasePrice > 0 ? simBasePrice : (selectedSkuForSimulation.basePrice || 100);
    const draft = editingProductMargins[selectedSkuForSimulation.id];

    let marginAmt = 0;
    let marginDisplay = '';
    let mType: MarginType = resolved.marginType;

    if (draft !== undefined) {
      marginAmt = Math.round((base * (draft / 100)) * 100) / 100;
      marginDisplay = `${draft}%`;
    } else if (resolved.marginType === 'FIXED_RATE') {
      marginAmt = resolved.marginRate ?? resolved.marginValue;
      marginDisplay = `₹${marginAmt.toFixed(2)} / unit`;
    } else {
      const pct = resolved.marginPercentage;
      marginAmt = Math.round((base * (pct / 100)) * 100) / 100;
      marginDisplay = `${pct}%`;
    }

    // Platform Fee is strictly separated from Product Margin
    const feePct = resolved.platformFeePercent ?? (platformFeeConfig?.feeValue ?? 2.0);
    const feeAmt = resolved.calculatePlatformFee ? resolved.calculatePlatformFee(base, marginAmt) : Math.round(((base + marginAmt) * (feePct / 100)) * 100) / 100;
    const buyerPrice = Math.round((base + marginAmt + feeAmt) * 100) / 100;

    return {
      base,
      marginDisplay,
      marginType: mType,
      marginAmt,
      platformFeePct: feePct,
      platformFeeAmt: feeAmt,
      buyerPrice,
      ruleType: draft !== undefined ? 'PRODUCT_DRAFT' : resolved.ruleType,
      ruleSource: draft !== undefined ? 'Draft Product Edit' : resolved.ruleSource
    };
  }, [selectedSkuForSimulation, allAvailableProducts, simBasePrice, editingProductMargins, marginRules, selectedManufacturerFilter, platformFeeConfig, mappings]);

  // Open Edit Modal for a specific mapping
  const openEditModalForMapping = (mapItem: any, prd: any, mfg: any) => {
    const baseP = mapItem.unitPriceEstimate || prd.basePrice || 100;
    setEditMarginModal({
      isOpen: true,
      productId: mapItem.productId,
      productName: prd.name,
      sku: prd.sku || prd.code || mapItem.mfgProductCode,
      manufacturerId: mfg.id,
      manufacturerName: mfg.brandName || mfg.companyName || mfg.name,
      mfgProductCode: mapItem.mfgProductCode,
      basePrice: baseP,
      marginType: mapItem.marginType || 'PERCENTAGE',
      marginValue: mapItem.marginValue ?? 10
    });
  };

  // Save manual margin from modal (Option A)
  const handleSaveModalMargin = () => {
    if (!editMarginModal) return;
    const { productId, manufacturerId, marginType, marginValue } = editMarginModal;
    if (isNaN(marginValue) || marginValue < 0) {
      alert('Please enter a valid positive margin value.');
      return;
    }
    if (marginType === 'PERCENTAGE' && marginValue > 100) {
      alert('Percentage margin cannot exceed 100%.');
      return;
    }
    updateProductMargin(productId, manufacturerId, marginType, marginValue);
    const displayUnit = marginType === 'FIXED_RATE' ? `₹${marginValue.toFixed(2)}/unit` : `${marginValue}%`;
    setSavedCategoryToast(`Product margin for ${editMarginModal.sku} set to ${displayUnit}`);
    setEditMarginModal(null);
    setTimeout(() => setSavedCategoryToast(null), 3500);
  };

  // Excel template downloader for margins
  const handleDownloadMarginTemplate = () => {
    const headers = ['Manufacturer', 'Manufacturer Product Code', 'Product Code / SKU', 'Product Name', 'Margin Type', 'Margin Value'];
    const sampleRows = [
      ['Cipla Partner Formulations Ltd', 'CIP-PCM-500', 'PCM-500', 'Paracetamol 500mg Tablets', 'Percentage', '10'],
      ['Cipla Partner Formulations Ltd', 'CIP-PCM-650', 'PCM-650', 'Paracetamol 650mg Tablets', 'Fixed Rate', '15'],
      ['Cipla Partner Formulations Ltd', 'CIP-AZI-500', 'AZI-500', 'Azithromycin 500mg Tablets', 'Percentage', '12'],
      ['SunBio LifeSciences Ltd', 'SUN-AMX-625', 'AMX-625', 'Amoxicillin 500mg Capsules', 'Percentage', '8'],
      ['SunBio LifeSciences Ltd', 'SUN-PCM-500', 'PCM-500', 'Paracetamol 500mg Tablets', 'Percentage', '15'],
      ['SunBio LifeSciences Ltd', 'SUN-PCM-650', 'PCM-650', 'Paracetamol 650mg Tablets', 'Fixed Rate', '20'],
      ['Lupin Bio-Tech Labs', 'LUP-PAN-D', 'PAN-070', 'Pantoprazole 40mg + Domperidone', 'Fixed Rate', '5']
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...sampleRows.map(r => r.map(f => `"${f.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'FactoryGrid_Product_Margin_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse and validate Margin Excel/CSV
  const parseAndValidateMarginCSV = (csvText: string, fileName = 'Product_Margins.csv') => {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      alert('Uploaded CSV file is empty or missing data rows.');
      return;
    }

    const parseCsvRow = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result.map(s => s.replace(/^["']|["']$/g, '').trim());
    };

    const header = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const findIndex = (keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)));

    const idxMfg = findIndex(['manufacturer', 'mfg', 'supplier']);
    const idxMfgCode = findIndex(['manufacturerproductcode', 'mfgproductcode', 'mfgcode']);
    const idxSku = findIndex(['sku', 'productcode', 'code']);
    const idxName = findIndex(['productname', 'name', 'product']);
    const idxType = findIndex(['margintype', 'type']);
    const idxVal = findIndex(['marginvalue', 'margin', 'value', 'rate']);

    const rows: ExcelMarginRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvRow(lines[i]);
      if (cols.length === 0 || cols.every(c => !c)) continue;

      const mfgStr = cols[idxMfg !== -1 ? idxMfg : 0] || '';
      const mfgProdCode = cols[idxMfgCode !== -1 ? idxMfgCode : 1] || '';
      const sku = cols[idxSku !== -1 ? idxSku : 2] || '';
      const prodName = cols[idxName !== -1 ? idxName : 3] || '';
      const typeStr = cols[idxType !== -1 ? idxType : 4] || '';
      const valStr = cols[idxVal !== -1 ? idxVal : 5] || '';

      const errors: string[] = [];

      // 1. Resolve Manufacturer
      let resolvedMfg = allManufacturers.find(m =>
        m.name.toLowerCase() === mfgStr.toLowerCase() ||
        (m.companyName && m.companyName.toLowerCase() === mfgStr.toLowerCase()) ||
        (m.brandName && m.brandName.toLowerCase() === mfgStr.toLowerCase()) ||
        m.code.toLowerCase() === mfgStr.toLowerCase() ||
        m.id.toLowerCase() === mfgStr.toLowerCase()
      );
      if (!resolvedMfg) {
        errors.push(`Manufacturer "${mfgStr}" not found`);
      }

      // 2. Resolve Product
      let resolvedPrd = products.find(p =>
        (p.sku && p.sku.toLowerCase() === sku.toLowerCase()) ||
        (p.code && p.code.toLowerCase() === sku.toLowerCase()) ||
        p.id.toLowerCase() === sku.toLowerCase() ||
        p.name.toLowerCase() === prodName.toLowerCase()
      );
      if (!resolvedPrd) {
        errors.push(`Product / SKU "${sku || prodName}" not found in master catalog`);
      }

      // 3. Validate Mapping
      let existingMapping = resolvedMfg && resolvedPrd
        ? mappings.find(m => m.manufacturerId === resolvedMfg!.id && m.productId === resolvedPrd!.id)
        : undefined;

      if (!existingMapping && resolvedMfg && mfgProdCode) {
        existingMapping = mappings.find(m => m.manufacturerId === resolvedMfg!.id && m.mfgProductCode.toLowerCase() === mfgProdCode.toLowerCase());
      }

      if (!existingMapping && resolvedMfg && resolvedPrd) {
        errors.push(`Product "${resolvedPrd.name}" is not mapped to manufacturer "${resolvedMfg.brandName || resolvedMfg.name}"`);
      }

      // 4. Validate Margin Type
      let resolvedMType: MarginType | undefined = undefined;
      const cleanType = typeStr.toLowerCase().replace(/[^a-z%]/g, '');
      if (cleanType.includes('percent') || cleanType === '%' || cleanType === 'pct') {
        resolvedMType = 'PERCENTAGE';
      } else if (cleanType.includes('fix') || cleanType.includes('rate') || cleanType.includes('unit') || cleanType.includes('inr')) {
        resolvedMType = 'FIXED_RATE';
      } else {
        errors.push(`Invalid Margin Type "${typeStr}". Must be "Percentage" or "Fixed Rate"`);
      }

      // 5. Validate Margin Value
      const numVal = parseFloat(valStr.replace(/[^0-9.]/g, ''));
      if (isNaN(numVal) || numVal < 0) {
        errors.push(`Margin Value must be a positive number`);
      } else if (resolvedMType === 'PERCENTAGE' && numVal > 100) {
        errors.push(`Percentage margin cannot exceed 100%`);
      }

      // Conflict / Update detection
      const curType = existingMapping?.marginType;
      const curVal = existingMapping?.marginValue;
      const hasExistingMargin = curVal !== undefined && curVal !== null;

      rows.push({
        rowNum: i,
        manufacturerNameOrCode: mfgStr,
        mfgProductCode: mfgProdCode,
        sku,
        productName: prodName,
        marginTypeStr: typeStr,
        marginValueStr: valStr,
        resolvedManufacturerId: resolvedMfg?.id,
        resolvedProductId: resolvedPrd?.id || existingMapping?.productId,
        resolvedMarginType: resolvedMType,
        resolvedMarginValue: isNaN(numVal) ? undefined : numVal,
        currentMarginType: curType,
        currentMarginValue: curVal,
        isUpdate: hasExistingMargin,
        isValid: errors.length === 0,
        errors
      });
    }

    setExcelMarginFileName(fileName);
    setExcelMarginRows(rows);
  };

  const handleLoadSampleMarginsCSV = () => {
    const sampleCSV = `Manufacturer,Manufacturer Product Code,Product Code / SKU,Product Name,Margin Type,Margin Value
Cipla Partner Formulations Ltd,CIP-PCM-500,PCM-500,Paracetamol 500mg Tablets,Percentage,10
Cipla Partner Formulations Ltd,CIP-PCM-650,PCM-650,Paracetamol 650mg Tablets,Fixed Rate,15
Cipla Partner Formulations Ltd,CIP-AZI-500,AZI-500,Azithromycin 500mg Tablets,Percentage,12
SunBio LifeSciences Ltd,SUN-AMX-625,AMX-625,Amoxicillin 500mg Capsules,Percentage,8
SunBio LifeSciences Ltd,SUN-PCM-500,PCM-500,Paracetamol 500mg Tablets,Percentage,15
SunBio LifeSciences Ltd,SUN-PCM-650,PCM-650,Paracetamol 650mg Tablets,Fixed Rate,20
Lupin Bio-Tech Labs,LUP-PAN-D,PAN-070,Pantoprazole 40mg + Domperidone,Fixed Rate,5
BioCure Pharmaceuticals Ltd,BIO-MET-500,MET-500,Metformin SR 500mg Tablets,Percentage,8`;
    parseAndValidateMarginCSV(sampleCSV, 'Sample_Product_Margins.csv');
  };

  const handleConfirmExcelMarginImport = () => {
    const validRows = excelMarginRows.filter(r => r.isValid && r.resolvedProductId && r.resolvedManufacturerId && r.resolvedMarginType && r.resolvedMarginValue !== undefined);
    if (validRows.length === 0) return;

    setIsProcessingMarginBulk(true);

    const updates = validRows.map(r => ({
      productId: r.resolvedProductId!,
      manufacturerId: r.resolvedManufacturerId!,
      marginType: r.resolvedMarginType!,
      marginValue: r.resolvedMarginValue!
    }));

    bulkUpdateProductMargins(updates);

    addAuditLog(
      'BULK_UPDATE_PRODUCT_MARGINS',
      `Applied bulk margin update to ${updates.length} products from ${excelMarginFileName || 'Excel upload'}`
    );

    setIsProcessingMarginBulk(false);
    setExcelMarginSuccessMessage(`Successfully updated margins for ${updates.length} products!`);
    setTimeout(() => {
      setIsExcelMarginModalOpen(false);
      setExcelMarginRows([]);
      setExcelMarginFileName('');
      setExcelMarginSuccessMessage(null);
    }, 1200);
  };

  // Role Gate
  if (currentRole !== 'ADMIN') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 48, textAlign: 'center', margin: '30px auto', maxWidth: 600 }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ShieldAlert size={26} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Access Restricted — Administrator Only
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
          Margin Engine administration is restricted to <strong>Platform Administrators</strong>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>

      {/* ── Success Toast Notification ── */}
      {savedCategoryToast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 99999,
          background: '#0F766E', color: '#FFFFFF', padding: '12px 20px',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(15,118,110,0.3)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{savedCategoryToast}</span>
        </div>
      )}

      {/* ── Top Header Bar (Enterprise Flat Command Bar) ── */}
      <div style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, padding: '18px 24px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <Percent size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              COMMERCIAL CONTROLS & MARGIN GOVERNANCE
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              MARGIN ENGINE
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Configure hierarchical commercial margins across Manufacturers, Categories, and SKUs with strict priority overrides.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setIsPlatformFeeModalOpen(true)}
            style={{
              padding: '9px 14px', borderRadius: 8, background: '#F8FAFC',
              color: '#0F766E', border: '1px solid #CBD5E1', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <DollarSign size={15} /> Platform Fee: {platformFeeConfig?.feeValue ?? 2.0}%
          </button>

          <button
            type="button"
            onClick={() => setIsExcelMarginModalOpen(true)}
            style={{
              padding: '9px 16px', borderRadius: 8, background: '#0F766E',
              color: '#FFFFFF', border: 'none', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 3px rgba(15,118,110,0.3)'
            }}
          >
            <FileSpreadsheet size={15} /> Upload Product Margins (Excel)
          </button>

          <button
            onClick={() => setActiveTab('category-master')}
            style={{
              padding: '9px 16px', borderRadius: 8, background: '#F8FAFC',
              color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700,
              fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <Layers size={15} /> Category Master →
          </button>
        </div>
      </div>

      {/* ── KPI Summary Bar (Replaces 4 Floating Cards) ── */}
      <EnterpriseMetricBar
        title="MARGIN ENGINE GOVERNANCE OVERVIEW"
        subtitle="Hierarchical Margin & Multi-Tier Pricing Rule Status"
        metrics={[
          { label: 'Configured Categories', value: metrics.configuredCount, sub: 'Active category margins', color: '#0F172A' },
          { label: 'Manufacturer Rules', value: metrics.mfgRulesCount, sub: 'Manufacturer-specific rules', color: '#0F766E' },
          { label: 'Active Margin Rules', value: metrics.activeRulesCount, sub: 'Tiered commercial rules', color: '#2563EB' },
          { label: 'Catalog SKUs Monitored', value: metrics.totalProducts, sub: 'Products in margin hierarchy', color: '#0F172A' },
        ]}
      />

      {/* ── View Mode Navigation Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #CBD5E1', gap: 24 }}>
        <button
          onClick={() => setActiveSubTab('CONFIG')}
          style={{
            padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: activeSubTab === 'CONFIG' ? '3px solid #0F766E' : '3px solid transparent',
            color: activeSubTab === 'CONFIG' ? '#0F766E' : '#64748B',
            fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          <Sliders size={16} /> Category Margin Configuration
        </button>

        <button
          onClick={() => setActiveSubTab('MFG_CONFIG')}
          style={{
            padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: activeSubTab === 'MFG_CONFIG' ? '3px solid #0F766E' : '3px solid transparent',
            color: activeSubTab === 'MFG_CONFIG' ? '#0F766E' : '#64748B',
            fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          <Building2 size={16} /> Manufacturer Margins Matrix
        </button>

        <button
          onClick={() => setActiveSubTab('SKU_INSPECTOR')}
          style={{
            padding: '10px 4px', background: 'none', border: 'none',
            borderBottom: activeSubTab === 'SKU_INSPECTOR' ? '3px solid #0F766E' : '3px solid transparent',
            color: activeSubTab === 'SKU_INSPECTOR' ? '#0F766E' : '#64748B',
            fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          <Package size={16} /> Product List & SKU Margins
        </button>
      </div>

      {/* ── TAB 1: CATEGORY MARGIN CONFIGURATION (REFERENCE BENCHMARK ONLY) ── */}
      {activeSubTab === 'CONFIG' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Reference Benchmark Warning Banner */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#92400E' }}>
                Category Margins are Indicative Reference Benchmarks Only
              </div>
              <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>
                Authoritative commercial pricing is strictly configured at the <strong>Product / SKU level</strong> (per manufacturer). Category margins serve as sector reference benchmarks and do not determine commercial transaction prices.
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search category name or code to configure margins..."
                value={catSearchTerm}
                onChange={e => setCatSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
            </div>
          </div>

          {/* Margin Configuration Matrix Table */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CODE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCTS</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MARGIN CONFIGURATION</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategoryList.map(cat => {
                  const currentConfig = getCategoryMarginConfig(cat.name);
                  const draftMargin = editingMargins[cat.id] || { type: currentConfig.marginType, value: currentConfig.marginValue };
                  const isModified = editingMargins[cat.id] !== undefined && (
                    editingMargins[cat.id].type !== currentConfig.marginType ||
                    editingMargins[cat.id].value !== currentConfig.marginValue
                  );
                  const isInvalid = draftMargin.value === undefined || draftMargin.value === null || isNaN(draftMargin.value) || draftMargin.value < 0 || (draftMargin.type === 'PERCENTAGE' && draftMargin.value > 100);
                  const mappedCount = allAvailableProducts.filter(p => matchesCategory(p, cat.name)).length;

                  return (
                    <tr
                      key={cat.id}
                      style={{ borderBottom: '1px solid #F1F5F9', background: isModified ? '#F0FDF4' : 'transparent', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.status === 'Active' ? '#10B981' : '#94A3B8' }} />
                          <div>
                            <div>{cat.name}</div>
                            {cat.description && (
                              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cat.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11.5, background: '#F1F5F9', color: '#0F766E', padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                          {cat.code}
                        </span>
                      </td>

                      <td style={{ padding: '14px 14px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          {mappedCount} Products
                        </span>
                      </td>

                      {/* Margin Configuration */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Margin Type Selection */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: draftMargin.type === 'PERCENTAGE' ? 700 : 500, color: draftMargin.type === 'PERCENTAGE' ? '#0F766E' : '#64748B' }}>
                              <input
                                type="radio"
                                name={`cat_margin_type_${cat.id}`}
                                checked={draftMargin.type === 'PERCENTAGE'}
                                onChange={() => setEditingMargins(prev => ({
                                  ...prev,
                                  [cat.id]: { type: 'PERCENTAGE', value: draftMargin.type === 'PERCENTAGE' ? draftMargin.value : 10 }
                                }))}
                                style={{ accentColor: '#0F766E', cursor: 'pointer' }}
                              />
                              Percentage
                            </label>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: draftMargin.type === 'FIXED_RATE' ? 700 : 500, color: draftMargin.type === 'FIXED_RATE' ? '#0F766E' : '#64748B' }}>
                              <input
                                type="radio"
                                name={`cat_margin_type_${cat.id}`}
                                checked={draftMargin.type === 'FIXED_RATE'}
                                onChange={() => setEditingMargins(prev => ({
                                  ...prev,
                                  [cat.id]: { type: 'FIXED_RATE', value: draftMargin.type === 'FIXED_RATE' ? draftMargin.value : 5 }
                                }))}
                                style={{ accentColor: '#0F766E', cursor: 'pointer' }}
                              />
                              Fixed Rate
                            </label>
                          </div>

                          {/* Single active input based on selected type */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {draftMargin.type === 'PERCENTAGE' ? (
                              <div style={{ position: 'relative', width: 110 }}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={draftMargin.value}
                                  onChange={e => {
                                    const val = e.target.value === '' ? ('' as any) : parseFloat(e.target.value);
                                    setEditingMargins(prev => ({
                                      ...prev,
                                      [cat.id]: { type: 'PERCENTAGE', value: val }
                                    }));
                                  }}
                                  style={{
                                    width: '100%', padding: '6px 24px 6px 10px',
                                    fontSize: 13, fontWeight: 800, fontFamily: 'monospace',
                                    border: isModified ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                                    borderRadius: 6, outline: 'none',
                                    background: isModified ? '#FFFFFF' : '#F8FAFC',
                                    color: '#0F172A'
                                  }}
                                />
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                                  %
                                </span>
                              </div>
                            ) : (
                              <div style={{ position: 'relative', width: 130 }}>
                                <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.25"
                                  value={draftMargin.value}
                                  onChange={e => {
                                    const val = e.target.value === '' ? ('' as any) : parseFloat(e.target.value);
                                    setEditingMargins(prev => ({
                                      ...prev,
                                      [cat.id]: { type: 'FIXED_RATE', value: val }
                                    }));
                                  }}
                                  style={{
                                    width: '100%', padding: '6px 42px 6px 22px',
                                    fontSize: 13, fontWeight: 800, fontFamily: 'monospace',
                                    border: isModified ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                                    borderRadius: 6, outline: 'none',
                                    background: isModified ? '#FFFFFF' : '#F8FAFC',
                                    color: '#0F172A'
                                  }}
                                />
                                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                                  /unit
                                </span>
                              </div>
                            )}
                            {isModified && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>
                                Changed
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 14px', textAlign: 'right', paddingRight: 16 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => {
                              const matchingPrd = allAvailableProducts.find(p => matchesCategory(p, cat.name));
                              if (matchingPrd) {
                                handleSelectProductForSim(matchingPrd);
                              }
                              setSelectedCategoryFilter(cat.name);
                              setSkuSearchQuery('');
                              setActiveSubTab('SKU_INSPECTOR');
                            }}
                            title={`View Products in ${cat.name}`}
                            style={{
                              padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                              background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Eye size={13} style={{ color: '#0F766E' }} /> View Product
                          </button>

                          <button
                            onClick={() => handleSaveCategoryMargin(cat)}
                            disabled={!isModified || isInvalid}
                            style={{
                              padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                              background: isModified && !isInvalid ? '#0F766E' : '#E2E8F0',
                              color: isModified && !isInvalid ? '#FFFFFF' : '#94A3B8',
                              border: 'none', cursor: isModified && !isInvalid ? 'pointer' : 'default',
                              boxShadow: isModified && !isInvalid ? '0 1px 2px rgba(15,118,110,0.2)' : 'none'
                            }}
                          >
                            Save Margin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: MANUFACTURER MARGINS MATRIX (INDIVIDUAL PRODUCT MARGINS PER MFG) ── */}
      {activeSubTab === 'MFG_CONFIG' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Banner explaining individual product margins */}
          <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(15,118,110,0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                  Manufacturer Product Margin Matrix
                </div>
                <div style={{ fontSize: 12, color: '#115E59', marginTop: 2 }}>
                  Margins are strictly configured per product. Each manufacturer may have different margins across products (Percentage or Fixed Rate).
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExcelMarginModalOpen(true)}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
              }}
            >
              <FileSpreadsheet size={14} /> Bulk Upload Product Margins (Excel)
            </button>
          </div>

          {/* Search bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search manufacturer brand, company name or code..."
                value={mfgSearchTerm}
                onChange={e => setMfgSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
            </div>
          </div>

          {/* Expandable Manufacturer Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredMfgList.map(mfg => {
              const mfgProducts = mappings.filter(m => m.manufacturerId === mfg.id);
              const isExpanded = expandedMfgIds[mfg.id] !== false;
              const isFgDirect = mfg.id === 'mfg_fg_direct';

              // Summary stats
              const pctCount = mfgProducts.filter(m => (m.marginType || 'PERCENTAGE') === 'PERCENTAGE').length;
              const fixedCount = mfgProducts.filter(m => m.marginType === 'FIXED_RATE').length;

              return (
                <div key={mfg.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  {/* Manufacturer Header Bar */}
                  <div
                    onClick={() => setExpandedMfgIds(prev => ({ ...prev, [mfg.id]: !isExpanded }))}
                    style={{
                      padding: '14px 18px', background: isExpanded ? '#F8FAFC' : '#FFFFFF',
                      borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ color: '#64748B' }}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isFgDirect ? '#ECFDF5' : '#EFF6FF',
                        color: isFgDirect ? '#059669' : '#2563EB',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: isFgDirect ? '1px solid #A7F3D0' : '1px solid #BFDBFE'
                      }}>
                        {isFgDirect ? <Zap size={16} /> : <Building2 size={16} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                            {mfg.brandName || mfg.companyName || mfg.name}
                          </span>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', background: '#F1F5F9', color: '#0F766E', borderRadius: 4 }}>
                            {mfg.code}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748B' }}>
                            {isFgDirect ? '● Direct Platform Generic Supplier' : '● Contract Manufacturer'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          {mfgProducts.length} Mapped Products · {pctCount} Percentage Margins · {fixedCount} Fixed Rate Margins
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '4px 10px', borderRadius: 6, border: '1px solid #99F6E4' }}>
                        {mfgProducts.length} {mfgProducts.length === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Product List with Individual Margins */}
                  {isExpanded && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <tr>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>PRODUCT / SKU</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>MFG PRODUCT CODE</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>BASE PRICE</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>MARGIN TYPE</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>MARGIN VALUE</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>COMMERCIAL PRICE</th>
                            <th style={{ padding: '10px 14px', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', textAlign: 'right', paddingRight: 16 }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mfgProducts.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                                No products mapped to this manufacturer yet.
                              </td>
                            </tr>
                          ) : (
                            mfgProducts.map(mapItem => {
                              const prd = products.find(p => p.id === mapItem.productId) || {
                                name: mapItem.productId,
                                sku: mapItem.mfgProductCode,
                                basePrice: mapItem.unitPriceEstimate || 100,
                                genericName: 'Active Ingredient'
                              };
                              const base = mapItem.unitPriceEstimate || prd.basePrice || 100;
                              const mType: MarginType = mapItem.marginType || 'PERCENTAGE';
                              const mVal = mapItem.marginValue ?? 10;
                              const marginAmt = mType === 'FIXED_RATE' ? mVal : Math.round((base * (mVal / 100)) * 100) / 100;
                              const commercialPrice = Math.round((base + marginAmt) * 100) / 100;

                              return (
                                <tr key={mapItem.productId + mfg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '12px 14px' }}>
                                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{prd.name}</div>
                                    <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace' }}>
                                      SKU: {prd.sku || prd.code} · {prd.genericName}
                                    </div>
                                  </td>
                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                                    {mapItem.mfgProductCode}
                                  </td>
                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                                    ₹{base.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '12px 14px' }}>
                                    <span style={{
                                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                                      background: mType === 'FIXED_RATE' ? '#EFF6FF' : '#F0FDFA',
                                      color: mType === 'FIXED_RATE' ? '#1D4ED8' : '#0F766E',
                                      border: mType === 'FIXED_RATE' ? '1px solid #BFDBFE' : '1px solid #99F6E4'
                                    }}>
                                      {mType === 'FIXED_RATE' ? 'Fixed Rate (₹/unit)' : 'Percentage (%)'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                                    {mType === 'FIXED_RATE' ? `₹${mVal.toFixed(2)} / unit` : `${mVal}%`}
                                  </td>
                                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', fontSize: 13.5 }}>
                                    ₹{commercialPrice.toFixed(2)}
                                    <span style={{ fontSize: 10.5, fontWeight: 600, color: '#D97706', marginLeft: 6 }}>
                                      (+₹{marginAmt.toFixed(2)})
                                    </span>
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'right', paddingRight: 16 }}>
                                    <button
                                      type="button"
                                      onClick={() => openEditModalForMapping(mapItem, prd, mfg)}
                                      style={{
                                        padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                        background: '#F0FDFA', border: '1px solid #99F6E4', color: '#0F766E',
                                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                      }}
                                    >
                                      <Edit3 size={13} /> Edit Margin
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
            })}
          </div>

        </div>
      )}

      {/* ── TAB 3: PRODUCT LIST & SKU MARGINS (WITH MANUFACTURER SELECTOR & OVERRIDES) ── */}
      {activeSubTab === 'SKU_INSPECTOR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Filter Toolbar ── */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'grid',
            gridTemplateColumns: 'minmax(260px, 1.5fr) minmax(220px, 1fr) minmax(200px, 1fr) auto',
            gap: 12, alignItems: 'center'
          }}>

            {/* 1. Search SKU or Product Name */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Filter by SKU (PCM-650, AMX-625) or name..."
                value={skuSearchQuery}
                onChange={e => setSkuSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 36px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
              {skuSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSkuSearchQuery('')}
                  title="Clear SKU filter"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 2 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 2. Clear Manufacturer Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                Manufacturer:
              </span>
              <select
                value={selectedManufacturerFilter}
                onChange={e => setSelectedManufacturerFilter(e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: 12.5, background: '#FFFFFF',
                  border: selectedManufacturerFilter !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                  borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option value="ALL">All Sources & Manufacturers ({allAvailableProducts.length})</option>
                <option value="mfg_fg_direct">⚡ FactoryGrid Direct / Generic Supply</option>
                <optgroup label="Contract Manufacturers (CDMO)">
                  {allManufacturers.filter(m => m.id !== 'mfg_fg_direct').map(m => {
                    const count = allAvailableProducts.filter(p => matchesManufacturer(p, m.id)).length;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.brandName || m.companyName || m.name} ({count})
                      </option>
                    );
                  })}
                </optgroup>
              </select>
            </div>

            {/* 3. Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                Category:
              </span>
              <select
                value={selectedCategoryFilter}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedCategoryFilter(val);
                  if (val !== 'ALL') {
                    const match = allAvailableProducts.find(p => matchesCategory(p, val));
                    if (match) handleSelectProductForSim(match);
                  }
                }}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: 12.5, background: '#FFFFFF',
                  border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer'
                }}
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(selectedManufacturerFilter !== 'ALL' || selectedCategoryFilter !== 'ALL' || skuSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedManufacturerFilter('ALL');
                    setSelectedCategoryFilter('ALL');
                    setSkuSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                    background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  Reset Filters
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExcelMarginModalOpen(true)}
                style={{
                  padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                  background: '#0F766E', color: '#FFFFFF', border: 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 1px 3px rgba(15,118,110,0.25)'
                }}
              >
                <FileSpreadsheet size={14} /> Upload Product Margins (Excel)
              </button>
            </div>
          </div>

          {/* ── MANUFACTURER CONTEXT BANNER (WHEN MANUFACTURER IS SELECTED) ── */}
          {currentSelectedMfg && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: currentSelectedMfg.id === 'mfg_fg_direct' ? '#ECFDF5' : '#EFF6FF',
                  color: currentSelectedMfg.id === 'mfg_fg_direct' ? '#059669' : '#2563EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: currentSelectedMfg.id === 'mfg_fg_direct' ? '1px solid #A7F3D0' : '1px solid #BFDBFE'
                }}>
                  {currentSelectedMfg.id === 'mfg_fg_direct' ? <Zap size={18} /> : <Building2 size={18} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      {currentSelectedMfg.brandName || currentSelectedMfg.companyName || currentSelectedMfg.name}
                    </h3>
                    <span style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#0F766E' }}>
                      {currentSelectedMfg.code}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Each product mapped to {currentSelectedMfg.brandName || currentSelectedMfg.name} is configured with an independent margin (Percentage or Fixed Rate).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsExcelMarginModalOpen(true)}
                  style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                    background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                  }}
                >
                  <FileSpreadsheet size={14} /> Bulk Upload Margins for this Mfg
                </button>
              </div>
            </div>
          )}

          {/* ── Product List Table ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                {selectedManufacturerFilter !== 'ALL'
                  ? `Product Margins for ${currentSelectedMfg?.brandName || currentSelectedMfg?.companyName || 'Selected Manufacturer'}`
                  : (selectedCategoryFilter !== 'ALL' ? `Product Margins — ${selectedCategoryFilter}` : 'Product Margins — All Catalog Products')}
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', marginLeft: 8 }}>
                  ({filteredSkuProducts.length} {filteredSkuProducts.length === 1 ? 'product' : 'products'})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  Platform Fee: <strong>{platformFeeConfig?.feeValue ?? 2.0}%</strong> (Separate facilitation fee)
                </span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SKU</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT NAME</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MANUFACTURER / SOURCE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>BASE PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT MARGIN</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PLATFORM FEE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>COMMERCIAL PRICE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', paddingRight: 16 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkuProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <Package size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No products matching filters</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        {selectedManufacturerFilter === 'mfg_fg_direct'
                          ? 'Only Generic Medicines are mapped to FactoryGrid Direct / Generic Supply.'
                          : 'Try changing the manufacturer, category, or search keyword.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSkuProducts.map(p => {
                    const isGen = isGeneric(p);
                    const resolution = resolveProductMargin(p);
                    const baseP = p.basePrice || 100;
                    const mType: MarginType = resolution.marginType;
                    const mVal = resolution.marginValue;
                    const marginAmt = mType === 'FIXED_RATE' ? (resolution.marginRate ?? mVal) : Math.round((baseP * (mVal / 100)) * 100) / 100;
                    const feePct = resolution.platformFeePercent ?? 2.0;
                    const feeAmt = Math.round(((baseP + marginAmt) * (feePct / 100)) * 100) / 100;
                    const finalCommercialP = Math.round((baseP + marginAmt + feeAmt) * 100) / 100;
                    const isSelected = selectedSkuForSimulation?.id === p.id;

                    // Supplier display logic
                    let supplierLabel = 'FactoryGrid Direct / Generic Supply';
                    let targetMfgId = 'mfg_fg_direct';
                    if (!isGen) {
                      const mfgIds = getProductManufacturers(p);
                      const mfgNames = mfgIds.map(id => {
                        const m = allManufacturers.find(item => item.id === id);
                        return m ? (m.brandName || m.companyName || m.name) : id;
                      });
                      supplierLabel = mfgNames.length > 0 ? mfgNames.join(', ') : 'Central Catalog';
                      targetMfgId = selectedManufacturerFilter !== 'ALL' ? selectedManufacturerFilter : (mfgIds[0] || 'm1');
                    }
                    const targetMfg = allManufacturers.find(m => m.id === targetMfgId) || allManufacturers[0];
                    const existingMap = mappings.find(m => m.productId === p.id && m.manufacturerId === targetMfgId) || {
                      productId: p.id,
                      manufacturerId: targetMfgId,
                      mfgProductCode: p.sku || p.code,
                      unitPriceEstimate: p.basePrice,
                      marginType: mType,
                      marginValue: mVal
                    };

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelectProductForSim(p)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #F1F5F9',
                          background: isSelected ? '#F0FDFA' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* SKU */}
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 800, fontSize: 12,
                            padding: '3px 8px', borderRadius: 4,
                            background: isSelected ? '#0F766E' : '#F1F5F9',
                            color: isSelected ? '#FFFFFF' : '#0F766E',
                            border: '1px solid #CBD5E1'
                          }}>
                            {p.sku || p.code}
                          </span>
                        </td>

                        {/* Product Name */}
                        <td style={{ padding: '14px 14px', fontWeight: 800, color: '#0F172A' }}>
                          <div>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{p.genericName} • {p.strength}</div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                            {p.category || p.dosageForm}
                          </span>
                        </td>

                        {/* Supplier / Source */}
                        <td style={{ padding: '14px 14px' }}>
                          {isGen ? (
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                              background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              <Zap size={11} /> FactoryGrid Direct
                            </span>
                          ) : (
                            <span style={{
                              fontSize: 11, fontWeight: 600, color: '#475569',
                              background: '#F8FAFC', padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0'
                            }}>
                              {supplierLabel}
                            </span>
                          )}
                        </td>

                        {/* Base Price */}
                        <td style={{ padding: '14px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#334155' }}>
                          ₹{baseP.toFixed(2)}
                        </td>

                        {/* Product Margin (Independent) */}
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              fontSize: 11.5, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                              background: mType === 'FIXED_RATE' ? '#EFF6FF' : '#F0FDFA',
                              color: mType === 'FIXED_RATE' ? '#1D4ED8' : '#0F766E',
                              border: mType === 'FIXED_RATE' ? '1px solid #BFDBFE' : '1px solid #99F6E4'
                            }}>
                              {mType === 'FIXED_RATE' ? `₹${(resolution.marginRate ?? mVal).toFixed(2)} / unit` : `${mVal}%`}
                            </span>
                            <span style={{ fontSize: 11, color: '#D97706', fontWeight: 700 }}>
                              (+₹{marginAmt.toFixed(2)})
                            </span>
                          </div>
                        </td>

                        {/* Platform Fee (Separated) */}
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '3px 8px', borderRadius: 4 }}>
                            {feePct}% (+₹{feeAmt.toFixed(2)})
                          </span>
                        </td>

                        {/* Commercial Price */}
                        <td style={{ padding: '14px 14px', fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', fontSize: 13.5 }}>
                          ₹{finalCommercialP.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 14px', textAlign: 'right', paddingRight: 16 }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => openEditModalForMapping(existingMap, p, targetMfg)}
                              style={{
                                padding: '6px 12px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                background: '#0F766E', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 4, boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                              }}
                            >
                              <Edit3 size={12} /> Configure Margin
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectProductForSim(p)}
                              style={{
                                padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                background: isSelected ? '#F0FDFA' : '#F8FAFC',
                                color: isSelected ? '#0F766E' : '#475569',
                                border: '1px solid #CBD5E1', cursor: 'pointer'
                              }}
                            >
                              {isSelected ? 'Simulating' : 'Simulate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Active Live Simulation Footer with Platform Fee Separation ── */}
          {selectedSkuForSimulation && (
            <div style={{
              background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18,
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #99F6E4' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                      Authoritative Price Simulation — {selectedSkuForSimulation.sku || selectedSkuForSimulation.code}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      {selectedSkuForSimulation.name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Base Price (₹)</div>
                    <input
                      type="number"
                      value={simBasePrice}
                      onChange={e => setSimBasePrice(parseFloat(e.target.value) || 0)}
                      style={{ width: 90, padding: '4px 8px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', borderRadius: 5, border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Product Margin</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                      {simCalculation.marginDisplay}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Margin Amount</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#D97706', fontFamily: 'monospace' }}>
                      +₹{simCalculation.marginAmt.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Platform Fee ({simCalculation.platformFeePct}%)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace' }}>
                      +₹{simCalculation.platformFeeAmt.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Commercial Price</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                      ₹{simCalculation.buyerPrice.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: 16 }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Governing Rule Source</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                      {simCalculation.ruleSource}
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Fee Disclaimer */}
              <div style={{ fontSize: 11.5, color: '#475569', background: '#F8FAFC', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={13} color="#0F766E" />
                <span>
                  <strong>Separation of Fees:</strong> Platform Fee ({simCalculation.platformFeePct}%) is a separate facilitation fee and is completely distinct from product margin. Commercial Price = Base Price + Product Margin + Platform Fee.
                </span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── MODAL: OPTION A — MANUAL PRODUCT MARGIN CONFIGURATION ── */}
      {editMarginModal && editMarginModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 14, border: '1px solid #CBD5E1', padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  PRODUCT-LEVEL MARGIN CONFIGURATION
                </div>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  {editMarginModal.productName}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  SKU: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{editMarginModal.sku}</strong> · Manufacturer: <strong>{editMarginModal.manufacturerName}</strong>
                </div>
              </div>
              <button onClick={() => setEditMarginModal(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Product & Base Price Summary */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Est. Base Price</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                  ₹{editMarginModal.basePrice.toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Manufacturer Product Code</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                  {editMarginModal.mfgProductCode}
                </div>
              </div>
            </div>

            {/* Margin Type Radio Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8 }}>
                Select Margin Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  onClick={() => setEditMarginModal({ ...editMarginModal, marginType: 'PERCENTAGE' })}
                  style={{
                    border: editMarginModal.marginType === 'PERCENTAGE' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                    background: editMarginModal.marginType === 'PERCENTAGE' ? '#F0FDFA' : '#FFFFFF',
                    borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <input
                    type="radio"
                    name="modal_margin_type"
                    checked={editMarginModal.marginType === 'PERCENTAGE'}
                    onChange={() => setEditMarginModal({ ...editMarginModal, marginType: 'PERCENTAGE' })}
                    style={{ accentColor: '#0F766E', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: editMarginModal.marginType === 'PERCENTAGE' ? '#0F766E' : '#0F172A' }}>
                      Percentage (%)
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Markup on base price</div>
                  </div>
                </div>

                <div
                  onClick={() => setEditMarginModal({ ...editMarginModal, marginType: 'FIXED_RATE' })}
                  style={{
                    border: editMarginModal.marginType === 'FIXED_RATE' ? '2px solid #0F766E' : '1px solid #CBD5E1',
                    background: editMarginModal.marginType === 'FIXED_RATE' ? '#F0FDFA' : '#FFFFFF',
                    borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10
                  }}
                >
                  <input
                    type="radio"
                    name="modal_margin_type"
                    checked={editMarginModal.marginType === 'FIXED_RATE'}
                    onChange={() => setEditMarginModal({ ...editMarginModal, marginType: 'FIXED_RATE' })}
                    style={{ accentColor: '#0F766E', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: editMarginModal.marginType === 'FIXED_RATE' ? '#0F766E' : '#0F172A' }}>
                      Fixed Rate (₹/unit)
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Fixed rupee per unit</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Active Input */}
            <div style={{ marginBottom: 18 }}>
              {editMarginModal.marginType === 'PERCENTAGE' ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Margin Percentage (%) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editMarginModal.marginValue}
                      onChange={e => setEditMarginModal({ ...editMarginModal, marginValue: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%', padding: '10px 36px 10px 12px', fontSize: 14,
                        fontWeight: 800, fontFamily: 'monospace', borderRadius: 8,
                        border: '1.5px solid #0F766E', outline: 'none', background: '#FFFFFF', color: '#0F172A'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                      %
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                    Fixed rate input is disabled. Only percentage margin is active.
                  </div>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Fixed Rate Margin (₹ per unit) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={editMarginModal.marginValue}
                      onChange={e => setEditMarginModal({ ...editMarginModal, marginValue: parseFloat(e.target.value) || 0 })}
                      style={{
                        width: '100%', padding: '10px 54px 10px 28px', fontSize: 14,
                        fontWeight: 800, fontFamily: 'monospace', borderRadius: 8,
                        border: '1.5px solid #0F766E', outline: 'none', background: '#FFFFFF', color: '#0F172A'
                      }}
                    />
                    <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                      / unit
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                    Percentage input is disabled. Only fixed rate margin is active.
                  </div>
                </div>
              )}
            </div>

            {/* Calculated Price Breakdown Card */}
            {(() => {
              const base = editMarginModal.basePrice;
              const mVal = editMarginModal.marginValue;
              const marginAmt = editMarginModal.marginType === 'FIXED_RATE' ? mVal : Math.round((base * (mVal / 100)) * 100) / 100;
              const feePct = platformFeeConfig?.feeValue ?? 2.0;
              const feeAmt = Math.round(((base + marginAmt) * (feePct / 100)) * 100) / 100;
              const totalCommercial = Math.round((base + marginAmt + feeAmt) * 100) / 100;

              return (
                <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 14, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 8 }}>
                    Commercial Price Breakdown
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#475569' }}>Manufacturer Base Price:</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{base.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#D97706' }}>
                        Product Margin ({editMarginModal.marginType === 'FIXED_RATE' ? `₹${mVal}/unit` : `${mVal}%`}):
                      </span>
                      <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>+₹{marginAmt.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #99F6E4', paddingBottom: 6 }}>
                      <span style={{ color: '#2563EB' }}>Platform Facilitation Fee ({feePct}%):</span>
                      <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>+₹{feeAmt.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, fontSize: 14 }}>
                      <strong style={{ color: '#0F172A' }}>Applicable Commercial Price:</strong>
                      <strong style={{ color: '#0F766E', fontFamily: 'monospace', fontSize: 16 }}>₹{totalCommercial.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setEditMarginModal(null)}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalMargin}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
              >
                Save Product Margin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OPTION B — EXCEL / CSV BULK MARGIN UPLOAD ── */}
      {isExcelMarginModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', background: '#FFFFFF', borderRadius: 14, border: '1px solid #CBD5E1', padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  Bulk Upload Product Margins (Excel / CSV)
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Set or update individual product margins across manufacturers via spreadsheet import.
                </div>
              </div>
              <button onClick={() => setIsExcelMarginModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {excelMarginSuccessMessage ? (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 24, textAlign: 'center' }}>
                <CheckCheck size={40} color="#059669" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800, color: '#065F46' }}>
                  {excelMarginSuccessMessage}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#047857' }}>
                  All product margins have been updated and are active immediately in the commercial engine.
                </p>
              </div>
            ) : (
              <>
                {/* Actions: Download Template & Load Demo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  <button
                    type="button"
                    onClick={handleDownloadMarginTemplate}
                    style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={14} /> Download Margin Template (.csv)
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleMarginsCSV}
                    style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={13} /> Load Demo Multi-Mfg Margin Data
                  </button>
                </div>

                {/* Dropzone */}
                <div
                  style={{
                    border: '2px dashed #94A3B8',
                    borderRadius: 10,
                    padding: '24px 20px',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    marginBottom: 16
                  }}
                  onClick={() => {
                    const input = document.getElementById('fg-margin-file-input');
                    if (input) input.click();
                  }}
                >
                  <input
                    id="fg-margin-file-input"
                    type="file"
                    accept=".csv, .txt"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = evt => {
                        const text = evt.target?.result as string;
                        if (text) parseAndValidateMarginCSV(text, file.name);
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <UploadCloud size={36} color="#0F766E" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    {excelMarginFileName ? `Loaded: ${excelMarginFileName}` : 'Click to select or drag & drop CSV file here'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                    Columns: Manufacturer, Manufacturer Product Code, Product Code / SKU, Product Name, Margin Type, Margin Value
                  </div>
                </div>

                {/* Validation Preview Table */}
                {excelMarginRows.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Summary Badges */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ padding: '6px 12px', background: '#F1F5F9', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        Total Rows: {excelMarginRows.length}
                      </div>
                      <div style={{ padding: '6px 12px', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#15803D' }}>
                        ✓ Valid: {excelMarginRows.filter(r => r.isValid).length}
                      </div>
                      {excelMarginRows.some(r => !r.isValid) && (
                        <div style={{ padding: '6px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#B91C1C' }}>
                          ⚠ Errors: {excelMarginRows.filter(r => !r.isValid).length}
                        </div>
                      )}
                      <div style={{ padding: '6px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                        Updates: {excelMarginRows.filter(r => r.isValid && r.isUpdate).length}
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', position: 'sticky', top: 0, borderBottom: '1px solid #CBD5E1' }}>
                          <tr>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>#</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>Status</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>Manufacturer</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>SKU / Product</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>Margin Type</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>New Margin</th>
                            <th style={{ padding: '8px 10px', color: '#475569' }}>Status / Conflict Check</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelMarginRows.map((r, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', background: r.isValid ? '#FFFFFF' : '#FFF5F5' }}>
                              <td style={{ padding: '8px 10px', color: '#64748B' }}>{r.rowNum}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                                  background: r.isValid ? '#DCFCE7' : '#FEE2E2',
                                  color: r.isValid ? '#15803D' : '#B91C1C'
                                }}>
                                  {r.isValid ? 'VALID' : 'INVALID'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0F172A' }}>
                                {r.manufacturerNameOrCode}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>{r.sku}</div>
                                <div style={{ fontSize: 11, color: '#64748B' }}>{r.productName}</div>
                              </td>
                              <td style={{ padding: '8px 10px', color: '#334155' }}>
                                {r.resolvedMarginType || r.marginTypeStr}
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                                {r.resolvedMarginType === 'FIXED_RATE' ? `₹${r.resolvedMarginValue?.toFixed(2)}/unit` : `${r.resolvedMarginValue}%`}
                              </td>
                              <td style={{ padding: '8px 10px', color: r.isValid ? (r.isUpdate ? '#B45309' : '#15803D') : '#B91C1C' }}>
                                {r.isValid
                                  ? (r.isUpdate
                                      ? `Existing margin will be updated from ${r.currentMarginType === 'FIXED_RATE' ? `₹${r.currentMarginValue}/unit` : `${r.currentMarginValue}%`} to ${r.resolvedMarginType === 'FIXED_RATE' ? `₹${r.resolvedMarginValue}/unit` : `${r.resolvedMarginValue}%`}`
                                      : 'New margin configuration')
                                  : r.errors.join('; ')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setExcelMarginRows([]);
                          setExcelMarginFileName('');
                          setIsExcelMarginModalOpen(false);
                        }}
                        style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={excelMarginRows.filter(r => r.isValid).length === 0 || isProcessingMarginBulk}
                        onClick={handleConfirmExcelMarginImport}
                        style={{
                          padding: '9px 24px',
                          borderRadius: 6,
                          border: 'none',
                          background: excelMarginRows.filter(r => r.isValid).length > 0 ? '#0F766E' : '#94A3B8',
                          color: '#FFF',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: excelMarginRows.filter(r => r.isValid).length > 0 ? 'pointer' : 'not-allowed',
                          boxShadow: '0 1px 3px rgba(15,118,110,0.2)'
                        }}
                      >
                        {isProcessingMarginBulk ? 'Updating Margins...' : `Confirm & Apply ${excelMarginRows.filter(r => r.isValid).length} Margin Updates`}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: PLATFORM FACILITATION FEE CONFIGURATION ── */}
      {isPlatformFeeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 14, border: '1px solid #CBD5E1', padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                    Platform Facilitation Fee
                  </h3>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>
                    Standard platform transaction charge
                  </div>
                </div>
              </div>
              <button onClick={() => setIsPlatformFeeModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: '#115E59' }}>
              <strong>Important Separation:</strong> The Platform Fee is a facilitation fee charged on the transaction. It is strictly separated from product margins and displayed as a distinct line item in quote breakdowns.
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Platform Fee Rate (%) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={draftPlatformFee}
                  onChange={e => setDraftPlatformFee(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%', padding: '10px 36px 10px 12px', fontSize: 14,
                    fontWeight: 800, fontFamily: 'monospace', borderRadius: 8,
                    border: '1.5px solid #0F766E', outline: 'none', background: '#FFFFFF', color: '#0F172A'
                  }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                  %
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                Current standard: <strong>2.0%</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsPlatformFeeModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePlatformFeeConfig(draftPlatformFee);
                  setSavedCategoryToast(`Platform Fee updated to ${draftPlatformFee}%`);
                  setIsPlatformFeeModalOpen(false);
                  setTimeout(() => setSavedCategoryToast(null), 3000);
                }}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Save Fee Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
