import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ManufacturerProductMapping, LifecycleStatus, AttributeMaster, ProductPrice, ProductTax, ProductUom, CustomerSegment } from '../../types';
import { ManufacturerProductCatalogTab } from './ManufacturerProductCatalogTab';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  Package, Search, Factory, Layers, Info, X,
  Plus, Edit3, Eye, AlertTriangle, Power,
  Star, Trash2,
  CheckCircle2, AlertCircle, Calendar, Hash, Tag,
  ArrowRight, ShieldCheck, ToggleLeft, ToggleRight, Sparkles,
  DollarSign, Receipt
} from 'lucide-react';

// Common dropdown options for LIST type attributes
const LIST_ATTRIBUTE_OPTIONS: Record<string, string[]> = {
  DOSAGE_FORM: [
    'Tablet', 'Film Coated Tablet', 'Extended Release Tablet', 'Dispersible Tablet',
    'Hard Gelatin Capsule', 'Soft Gelatin Capsule', 'Delayed Release Capsule',
    'Syrup', 'Suspension', 'Oral Liquid', 'Liquid Injection', 'Dry Powder Vial',
    'Ointment', 'Gel', 'Cream', 'Facial Serum', 'Drops', 'Powder / Sachet', 'Granules'
  ],
  ROUTE_OF_ADMIN: [
    'Oral', 'Injectable (IV/IM)', 'Topical / External', 'Inhalation',
    'Ophthalmic', 'Otic', 'Nasal', 'Sublingual', 'Rectal'
  ],
  PACKAGING_TYPE: [
    'Alu-Alu Blister Strip', 'PVC / PVDC Blister Strip', 'Amber Glass Bottle with Dropper',
    'HDPE Plastic Bottle', 'Glass Vial with WFI', 'Sterile Ampoule', 'Laminated Aluminum Tube',
    'Sterile Pouch / Sachet', 'Multi-dose Dispenser'
  ],
  REGULATORY_CLASS: [
    'Prescription Drug (Schedule H)', 'Schedule H1 Warning', 'Over-The-Counter (OTC)',
    'Dietary / FSSAI Grade', 'Cosmetics CDSCO Form 32', 'WHO-GMP Direct Supply'
  ]
};

const COMMON_BASE_UOMS = [
  'Unit', 'Boxes', 'Strips', 'Vials', 'Bottles', 'Tubes', 'Ampoules', 'Sachets', 'Packs', 'kg', 'Litre'
];

const COMMON_PACK_UOMS = [
  'Strip', 'Box', 'Bottle', 'Vial', 'Blister Pack', 'Tube', 'Ampoule', 'Sachet', 'Dropper Bottle', 'Jar', 'Pack'
];

export const ProductCatalogModule: React.FC = () => {
  const {
    currentRole,
    products,
    manufacturers,
    mappings,
    addMapping,
    updateMapping,
    removeMapping,
    setPreferredManufacturer,
    productTypes,
    unifiedCategories,
    brands,
    attributeMasters,
    productAttributes,
    saveProductAttributesBulk,
    categoryAttributes,
    getCategoryConfiguredAttributes,
    customerSegments,
    productPrices,
    addProductPrice,
    removeProductPrice,
    productTaxes,
    addProductTax,
    removeProductTax,
    productUoms,
    addProductUom,
    removeProductUom,
    addProductMaster,
    updateProductMaster,
    toggleProductMasterStatus,
    addAuditLog,
    setActiveTab
  } = useApp();

  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');

  // Buyers may only view products — cannot edit or change status
  const canEditProducts = currentRole !== 'BUYER';

  // ── Helper Resolvers ──────────────────────────────────────────────
  const resolveCategoryRecord = (catId?: string | null) => {
    if (!catId) return null;
    return (unifiedCategories || []).find(c => c.category_id === catId || c.id === catId);
  };

  const getCategoryHierarchyDisplay = (prd: Product): string => {
    const catId = prd.category_id || prd.categoryId;
    const catRecord = resolveCategoryRecord(catId);
    if (catRecord) {
      const parts = [catRecord.category, catRecord.sub_category, catRecord.sub_sub_category].filter(Boolean);
      return parts.join(' › ');
    }
    // Fallback to legacy fields if present
    const legacyParts = [prd.category, (prd as any).subCategory, prd.subSubCategory].filter(Boolean);
    return legacyParts.length > 0 ? legacyParts.join(' › ') : 'General / Uncategorized';
  };

  const getCategoryId = (prd: Product): string => {
    return prd.category_id || prd.categoryId || '—';
  };

  const getProductTypeName = (prd: Product): string => {
    const ptId = prd.product_type_id || prd.productTypeId;
    if (ptId) {
      const matched = (productTypes || []).find(t => t.product_type_id === ptId || t.id === ptId);
      if (matched) return matched.product_type_name || matched.name || 'Pharmaceutical';
    }
    const catRecord = resolveCategoryRecord(prd.category_id || prd.categoryId);
    if (catRecord) {
      const matched = (productTypes || []).find(t => t.product_type_id === catRecord.product_type_id);
      if (matched) return matched.product_type_name || matched.name || 'Pharmaceutical';
    }
    return 'Pharmaceutical';
  };

  const getProductTypeId = (prd: Product): string => {
    const ptId = prd.product_type_id || prd.productTypeId;
    if (ptId) return ptId;
    const catRecord = resolveCategoryRecord(prd.category_id || prd.categoryId);
    if (catRecord?.product_type_id) return catRecord.product_type_id;
    return '—';
  };

  const getBrandName = (prd: Product): string => {
    const bId = prd.brand_id || prd.brandId;
    if (bId) {
      const matched = (brands || []).find(b => b.brand_id === bId || b.id === bId);
      if (matched) return matched.brand_name || matched.name || '';
    }
    if (prd.brandNames && prd.brandNames.length > 0) {
      return prd.brandNames[0];
    }
    return '';
  };

  const getBrandId = (prd: Product): string => {
    const bId = prd.brand_id || prd.brandId;
    if (bId) return bId;
    if (prd.brandNames && prd.brandNames.length > 0) {
      const matched = (brands || []).find(b => b.brand_name === prd.brandNames?.[0] || b.name === prd.brandNames?.[0]);
      if (matched) return matched.brand_id || matched.id || '';
    }
    return '';
  };

  // Helper to resolve dynamic attributes for a product
  const getProductAttributeMap = (productId: string): Record<string, string> => {
    const map: Record<string, string> = {};
    (productAttributes || [])
      .filter(pa => pa.product_id === productId || pa.productId === productId)
      .forEach(pa => {
        const attrId = pa.attribute_id || pa.attributeId || '';
        const attrVal = pa.attribute_value || pa.attributeValue || '';
        if (attrId) map[attrId] = attrVal;
      });
    return map;
  };

  // Search & Multi-Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<string>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMfgId, setSelectedMfgId] = useState<string>('ALL');

  // Categories available for filter based on selected Product Type
  const filterCategoriesList = useMemo(() => {
    const all = (unifiedCategories || []).filter(c => c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active');
    if (selectedProductTypeId === 'ALL') return all;
    return all.filter(c => c.product_type_id === selectedProductTypeId);
  }, [unifiedCategories, selectedProductTypeId]);

  // Interactive Product Detail Drawer State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add / Edit Product Modal State (Strictly Core PRODUCT entity fields only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalFormError, setModalFormError] = useState<string | null>(null);

  // Dynamic Product Attributes Management Modal State (PRODUCT_ATTRIBUTE)
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [attributeDraftValues, setAttributeDraftValues] = useState<Record<string, string>>({});

  // Quick Add Price Modal State (PRODUCT_PRICE)
  const [isQuickPriceOpen, setIsQuickPriceOpen] = useState(false);
  const [quickPriceForm, setQuickPriceForm] = useState({
    customer_segment_id: '',
    product_manufacturer_id: '' as string | null,
    price_type: 'FIXED' as 'FIXED' | 'TIERED' | 'CONTRACT' | 'LIST',
    currency: 'INR',
    unit_price: 15.00,
    minimum_quantity: 100,
    maximum_quantity: '' as string | number,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    price_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Quick Add Tax Modal State (PRODUCT_TAX)
  const [isQuickTaxOpen, setIsQuickTaxOpen] = useState(false);
  const [quickTaxForm, setQuickTaxForm] = useState({
    tax_code: 'HSN-3004-90',
    tax_rate: 12,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Quick Add UOM Modal State (PRODUCT_UOM)
  const [isQuickUomOpen, setIsQuickUomOpen] = useState(false);
  const [quickUomForm, setQuickUomForm] = useState({
    uom: 'Boxes',
    conversion_factor: 10,
    is_base_uom: false,
    is_order_uom: true,
    is_active: true
  });

  // Client-Aligned Form Data State (Strictly PRODUCT fields only)
  const [formData, setFormData] = useState({
    productTypeId: 'pt_med',
    categoryId: 'CAT001',
    brandId: '',
    code: '',
    name: '',
    shortName: '',
    description: '',
    baseUom: 'Unit',
    packSize: '10 x 1 x 10',
    packUom: 'Strip',
    lifecycleStatus: 'ACTIVE' as LifecycleStatus,
    availableFrom: '2025-01-01',
    discontinuedOn: '',
    replacementProductId: '',
    isSellable: true
  });

  // Dynamic attribute form values for Add / Edit Product modal
  const [formAttrValues, setFormAttrValues] = useState<Record<string, string>>({});

  // Active configured attributes for the selected category in Add / Edit Product modal (Client: Category Attributes)
  const modalCategoryConfiguredAttributes = useMemo(() => {
    if (!formData.categoryId) return [];
    return getCategoryConfiguredAttributes(formData.categoryId);
  }, [formData.categoryId, getCategoryConfiguredAttributes, categoryAttributes, attributeMasters]);

  // Active attribute masters list for rendering dynamic attributes
  const activeAttributesList = useMemo(() => {
    return (attributeMasters || []).filter(a => a.is_active);
  }, [attributeMasters]);

  // Filtered Central Product List Calculation
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const pCode = (p.product_code || p.code || '').toLowerCase();
      const pName = (p.product_name || p.name || '').toLowerCase();
      const pShortName = (p.product_short_name || '').toLowerCase();
      const pCatRecord = resolveCategoryRecord(p.category_id || p.categoryId);
      const catHierarchy = getCategoryHierarchyDisplay(p).toLowerCase();
      const brandStr = getBrandName(p).toLowerCase();

      // Check dynamic attributes for search matching
      const pAttrs = getProductAttributeMap(p.id);
      const attrMatch = Object.values(pAttrs).some(val => val.toLowerCase().includes(q));

      const matchesSearch =
        q === '' ||
        pCode.includes(q) ||
        pName.includes(q) ||
        pShortName.includes(q) ||
        catHierarchy.includes(q) ||
        brandStr.includes(q) ||
        attrMatch;

      // Filter by Product Type
      let matchesPt = true;
      if (selectedProductTypeId !== 'ALL') {
        const ptId = p.product_type_id || p.productTypeId || pCatRecord?.product_type_id;
        matchesPt = ptId === selectedProductTypeId;
      }

      // Filter by Category
      let matchesCat = true;
      if (selectedCategoryId !== 'ALL') {
        matchesCat = (p.category_id || p.categoryId) === selectedCategoryId;
      }

      // Filter by Brand
      let matchesBrand = true;
      if (selectedBrandId !== 'ALL') {
        const bId = p.brand_id || p.brandId || '';
        matchesBrand = bId === selectedBrandId;
      }

      // Filter by Lifecycle Status
      let matchesStatus = true;
      if (selectedStatus !== 'ALL') {
        const statusVal = p.lifecycle_status || (p.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE');
        matchesStatus = statusVal === selectedStatus;
      }

      // Filter by mapped manufacturer
      let matchesMfg = true;
      if (selectedMfgId !== 'ALL') {
        const pMappings = (mappings || []).filter(m => m.productId === p.id);
        matchesMfg = pMappings.some(m => m.manufacturerId === selectedMfgId);
      }

      return matchesSearch && matchesPt && matchesCat && matchesBrand && matchesStatus && matchesMfg;
    });
  }, [products, mappings, searchTerm, selectedProductTypeId, selectedCategoryId, selectedBrandId, selectedStatus, selectedMfgId, unifiedCategories, brands, productAttributes]);

  // Open Add Mapping Modal (PRODUCT_MANUFACTURER)
  const handleOpenAddMapping = () => {
    if (!selectedProduct) return;
    const activeMfgs = (manufacturers || []).filter(m => m.lifecycle_status === 'ACTIVE' || (m as any).status === 'ACTIVE' || (m as any).status === 'Active');
    const existingMfgIds = (mappings || [])
      .filter(m => m.productId === selectedProduct.id || m.product_id === selectedProduct.id)
      .map(m => m.manufacturer_id || m.manufacturerId);
    const availableMfg = activeMfgs.find(m => !existingMfgIds.includes(m.manufacturer_id || m.id)) || activeMfgs[0];

    const prdCode = selectedProduct.product_code || selectedProduct.code || 'PRD';
    setEditingMapping(null);
    setMappingFormData({
      manufacturerId: availableMfg ? (availableMfg.manufacturer_id || availableMfg.id) : '',
      manufacturerProductCode: `${prdCode}-MFG`,
      manufacturerPartNumber: `PN-${prdCode}`,
      manufacturerSku: `SKU-${prdCode}`,
      lifecycleStatus: 'ACTIVE',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      isPreferred: existingMfgIds.length === 0
    });
    setMappingFormError(null);
    setIsMappingModalOpen(true);
  };

  // Open Edit Mapping Modal
  const handleOpenEditMapping = (map: ManufacturerProductMapping) => {
    setEditingMapping(map);
    setMappingFormData({
      manufacturerId: map.manufacturer_id || map.manufacturerId,
      manufacturerProductCode: map.manufacturer_product_code || map.mfgProductCode || '',
      manufacturerPartNumber: map.manufacturer_part_number || '',
      manufacturerSku: map.manufacturer_sku || '',
      lifecycleStatus: (map.lifecycle_status || (map.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE')) as LifecycleStatus,
      effectiveFrom: map.effective_from || map.effectiveFrom || '',
      effectiveTo: map.effective_to || map.effectiveTo || '',
      isPreferred: !!(map.is_preferred || map.isPreferred)
    });
    setMappingFormError(null);
    setIsMappingModalOpen(true);
  };

  // Save Mapping (Add or Update)
  const handleSaveMapping = () => {
    if (!selectedProduct) return;
    if (!mappingFormData.manufacturerId) {
      setMappingFormError('Please select an active manufacturer.');
      return;
    }
    const prdId = selectedProduct.id;
    const mfg = (manufacturers || []).find(m => m.manufacturer_id === mappingFormData.manufacturerId || m.id === mappingFormData.manufacturerId);
    const mfgName = mfg?.manufacturer_name || mfg?.companyName || mfg?.name || 'Manufacturer';
    const mfgCode = mfg?.manufacturer_code || mfg?.code || 'MFG';

    if (editingMapping) {
      const origMfgId = editingMapping.manufacturerId || editingMapping.manufacturer_id;
      updateMapping(prdId, origMfgId, {
        manufacturer_product_code: mappingFormData.manufacturerProductCode,
        mfgProductCode: mappingFormData.manufacturerProductCode,
        manufacturer_part_number: mappingFormData.manufacturerPartNumber,
        manufacturer_sku: mappingFormData.manufacturerSku,
        lifecycle_status: mappingFormData.lifecycleStatus,
        status: mappingFormData.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        effective_from: mappingFormData.effectiveFrom,
        effectiveFrom: mappingFormData.effectiveFrom,
        effective_to: mappingFormData.effectiveTo || undefined,
        effectiveTo: mappingFormData.effectiveTo || undefined,
        is_preferred: mappingFormData.isPreferred,
        isPreferred: mappingFormData.isPreferred,
        updated_at: new Date().toISOString().split('T')[0]
      });
      if (mappingFormData.isPreferred) {
        setPreferredManufacturer(prdId, origMfgId);
      }
      addAuditLog('UPDATE_PRODUCT_MANUFACTURER', `Updated mapping for product ${selectedProduct.product_code || selectedProduct.code} with manufacturer ${mfgName}`);
    } else {
      const exists = (mappings || []).some(m =>
        (m.productId === prdId || m.product_id === prdId) &&
        (m.manufacturerId === mappingFormData.manufacturerId || m.manufacturer_id === mappingFormData.manufacturerId)
      );
      if (exists) {
        setMappingFormError('This manufacturer is already mapped to this product.');
        return;
      }

      const newMap: ManufacturerProductMapping = {
        product_manufacturer_id: `pm_${Date.now()}`,
        product_id: prdId,
        productId: prdId,
        manufacturer_id: mappingFormData.manufacturerId,
        manufacturerId: mappingFormData.manufacturerId,
        manufacturer_code: mfgCode,
        manufacturerCode: mfgCode,
        manufacturer_name: mfgName,
        manufacturerName: mfgName,
        manufacturer_product_code: mappingFormData.manufacturerProductCode,
        mfgProductCode: mappingFormData.manufacturerProductCode,
        manufacturer_part_number: mappingFormData.manufacturerPartNumber,
        manufacturer_sku: mappingFormData.manufacturerSku,
        lifecycle_status: mappingFormData.lifecycleStatus,
        status: mappingFormData.lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
        effective_from: mappingFormData.effectiveFrom,
        effectiveFrom: mappingFormData.effectiveFrom,
        effective_to: mappingFormData.effectiveTo || undefined,
        effectiveTo: mappingFormData.effectiveTo || undefined,
        is_preferred: mappingFormData.isPreferred,
        isPreferred: mappingFormData.isPreferred,
        moq: 1000,
        standardLeadTimeDays: 14,
        certifications: ['WHO-GMP', 'ISO 9001'],
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0]
      };

      addMapping(newMap);
      if (mappingFormData.isPreferred) {
        setPreferredManufacturer(prdId, mappingFormData.manufacturerId);
      }
      addAuditLog('ADD_PRODUCT_MANUFACTURER', `Mapped product ${selectedProduct.product_code || selectedProduct.code} with manufacturer ${mfgName}`);
    }

    setIsMappingModalOpen(false);
    setEditingMapping(null);
  };

  // Toggle mapping status
  const handleToggleMappingStatus = (map: ManufacturerProductMapping) => {
    if (!selectedProduct) return;
    const currentStatus = map.lifecycle_status || (map.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE');
    const nextStatus: LifecycleStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const mId = map.manufacturer_id || map.manufacturerId;
    updateMapping(selectedProduct.id, mId, {
      lifecycle_status: nextStatus,
      status: nextStatus === 'ACTIVE' ? 'Active' : 'Inactive',
      updated_at: new Date().toISOString().split('T')[0]
    });
    addAuditLog('TOGGLE_PRODUCT_MANUFACTURER_STATUS', `Toggled status to ${nextStatus} for manufacturer ${map.manufacturerName || map.manufacturer_name} on product ${selectedProduct.product_code}`);
  };

  // Set as preferred mapping
  const handleSetPreferred = (map: ManufacturerProductMapping) => {
    if (!selectedProduct) return;
    const mId = map.manufacturer_id || map.manufacturerId;
    setPreferredManufacturer(selectedProduct.id, mId);
  };

  // Remove mapping
  const handleRemoveMapping = (map: ManufacturerProductMapping) => {
    if (!selectedProduct) return;
    const mId = map.manufacturer_id || map.manufacturerId;
    if (window.confirm(`Are you sure you want to remove the manufacturer mapping for ${map.manufacturerName || map.manufacturer_name}?`)) {
      removeMapping(selectedProduct.id, mId);
      addAuditLog('REMOVE_PRODUCT_MANUFACTURER', `Removed mapping for manufacturer ${map.manufacturerName || map.manufacturer_name} from product ${selectedProduct.product_code}`);
    }
  };

  // Open Add Product Modal (Pure Core PRODUCT fields)
  const handleOpenAddModal = () => {
    setEditingProductId(null);
    const nextCodeNum = products.length + 1;
    const defaultPtId = productTypes[0]?.product_type_id || 'pt_med';
    const firstCat = (unifiedCategories || []).find(c => c.product_type_id === defaultPtId && (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active'));

    setFormData({
      productTypeId: defaultPtId,
      categoryId: firstCat?.category_id || 'CAT001',
      brandId: '',
      code: `PRD001${nextCodeNum < 10 ? '00' + nextCodeNum : nextCodeNum < 100 ? '0' + nextCodeNum : nextCodeNum}`,
      name: '',
      shortName: '',
      description: '',
      baseUom: 'Unit',
      packSize: '10 x 1 x 10',
      packUom: 'Strip',
      lifecycleStatus: 'DRAFT',
      availableFrom: new Date().toISOString().split('T')[0],
      discontinuedOn: '',
      replacementProductId: '',
      isSellable: true
    });

    setFormAttrValues({});
    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Product Modal (Pure Core PRODUCT fields)
  const handleOpenEditModal = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProductId(prd.id);

    const existingCat = (unifiedCategories || []).find(c => c.category_id === (prd.category_id || prd.categoryId));
    const prdPtId = prd.product_type_id || prd.productTypeId || existingCat?.product_type_id || 'pt_med';

    setFormData({
      productTypeId: prdPtId,
      categoryId: prd.category_id || prd.categoryId || existingCat?.category_id || 'CAT001',
      brandId: prd.brand_id || prd.brandId || '',
      code: prd.product_code || prd.code || '',
      name: prd.product_name || prd.name || '',
      shortName: prd.product_short_name || '',
      description: prd.product_description || prd.description || '',
      baseUom: prd.base_uom || prd.uom || 'Unit',
      packSize: prd.pack_size || prd.packSize || '10 x 1 x 10',
      packUom: prd.pack_uom || 'Strip',
      lifecycleStatus: prd.lifecycle_status || (prd.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'),
      availableFrom: prd.available_from || '2025-01-01',
      discontinuedOn: prd.discontinued_on || '',
      replacementProductId: prd.replacement_product_id || '',
      isSellable: prd.is_sellable !== undefined ? prd.is_sellable : true
    });

    const currentAttrs = getProductAttributeMap(prd.id);
    setFormAttrValues(currentAttrs);

    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Manage Dynamic Attributes Modal (PRODUCT_ATTRIBUTE configured for product's Category)
  const handleOpenManageAttributes = (prd?: Product) => {
    const target = prd || selectedProduct;
    if (!target) return;
    const currentAttrs = getProductAttributeMap(target.id);
    const catId = target.category_id || target.categoryId || '';
    const configuredAttrs = getCategoryConfiguredAttributes(catId);
    const draft: Record<string, string> = {};
    configuredAttrs.forEach(ca => {
      const aId = ca.attribute.attribute_id;
      draft[aId] = currentAttrs[aId] || '';
    });
    setAttributeDraftValues(draft);
    setIsAttrModalOpen(true);
  };

  // Save Dynamic Product Attributes (PRODUCT_ATTRIBUTE)
  const handleSaveProductAttributes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const catId = selectedProduct.category_id || selectedProduct.categoryId || '';
    const configuredAttrs = getCategoryConfiguredAttributes(catId);

    // Validate is_required attributes
    for (const ca of configuredAttrs) {
      if (ca.attribute.is_required) {
        const val = (attributeDraftValues[ca.attribute.attribute_id] || '').trim();
        if (!val) {
          alert(`Attribute "${ca.attribute.attribute_name}" is mandatory for this category.`);
          return;
        }
      }
    }

    const entries = configuredAttrs.map(ca => ({
      attribute_id: ca.attribute.attribute_id,
      attribute_value: attributeDraftValues[ca.attribute.attribute_id] || ''
    }));
    saveProductAttributesBulk(selectedProduct.id, entries);
    addAuditLog('UPDATE_PRODUCT_ATTRIBUTES', `Updated dynamic attributes for product ${selectedProduct.product_code || selectedProduct.code}`);
    setIsAttrModalOpen(false);
  };

  // Save Central Product Handler (Pure PRODUCT Entity + Dynamic Category Attributes in PRODUCT_ATTRIBUTE)
  const handleSaveProductMaster = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Classification Validations
    if (!formData.productTypeId) {
      setModalFormError('Product Type is mandatory. Please select a Product Type.');
      return;
    }
    if (!formData.categoryId) {
      setModalFormError('Category is mandatory. Please select a Category from the master catalogue.');
      return;
    }

    // 2. Product Information Validations
    if (!formData.code.trim()) {
      setModalFormError('Product Code is mandatory.');
      return;
    }
    if (!formData.name.trim()) {
      setModalFormError('Product Name is mandatory.');
      return;
    }
    if (!formData.baseUom.trim()) {
      setModalFormError('Base UOM is mandatory.');
      return;
    }
    if (!formData.packUom.trim()) {
      setModalFormError('Pack UOM is mandatory.');
      return;
    }

    // Unique Product Code Validation Check
    const codeClean = formData.code.trim().toUpperCase();
    const isDuplicateCode = (products || []).some(p =>
      p.id !== editingProductId &&
      (p.product_code || p.code || '').toUpperCase().trim() === codeClean
    );

    if (isDuplicateCode) {
      setModalFormError(`Product Code "${codeClean}" already exists. Product Code must be unique across the central master catalog.`);
      return;
    }

    // 3. Category Attributes Validation (Required Attributes as configured in ATTRIBUTE_MASTER)
    const configuredAttrs = getCategoryConfiguredAttributes(formData.categoryId);
    for (const ca of configuredAttrs) {
      if (ca.attribute.is_required) {
        const val = (formAttrValues[ca.attribute.attribute_id] || '').trim();
        if (!val) {
          setModalFormError(`Attribute "${ca.attribute.attribute_name}" is required by Category specifications.`);
          return;
        }
      }
    }

    // Resolve category details for display helper
    const chosenCatRecord = resolveCategoryRecord(formData.categoryId);
    const chosenBrandRecord = (brands || []).find(b => b.brand_id === formData.brandId || b.id === formData.brandId);

    const nowIso = new Date().toISOString().split('T')[0];
    const targetId = editingProductId || `prd_${Date.now()}`;

    // Construct client-aligned Product entity (Strictly canonical columns only)
    const productPayload: Product = {
      // Client Approved Core PRODUCT Entity Schema
      product_id: targetId,
      product_code: codeClean,
      product_type_id: formData.productTypeId,
      brand_id: formData.brandId ? formData.brandId : null,
      category_id: formData.categoryId,
      product_name: formData.name.trim(),
      product_short_name: formData.shortName.trim() || formData.name.trim().slice(0, 30),
      product_description: formData.description.trim(),
      base_uom: formData.baseUom,
      pack_size: formData.packSize.trim() || 'Standard Pack',
      pack_uom: formData.packUom,
      lifecycle_status: formData.lifecycleStatus,
      available_from: formData.availableFrom || nowIso,
      discontinued_on: formData.discontinuedOn ? formData.discontinuedOn : null,
      replacement_product_id: formData.replacementProductId ? formData.replacementProductId : null,
      is_sellable: formData.isSellable,
      created_at: editingProductId ? ((products || []).find(p => p.id === editingProductId)?.created_at || nowIso) : nowIso,
      updated_at: nowIso,

      // UI & Backward compatibility aliases
      id: targetId,
      code: codeClean,
      name: formData.name.trim(),
      productTypeId: formData.productTypeId,
      categoryId: formData.categoryId,
      brandId: formData.brandId || null,
      category: chosenCatRecord?.category || 'Drugs',
      subCategory: chosenCatRecord?.sub_category || undefined,
      subSubCategory: chosenCatRecord?.sub_sub_category || undefined,
      uom: formData.baseUom,
      packSize: `${formData.packSize.trim()} ${formData.packUom}`.trim(),
      status: (formData.lifecycleStatus === 'INACTIVE' || formData.lifecycleStatus === 'DISCONTINUED' || formData.lifecycleStatus === 'EOL') ? 'Inactive' : 'Active',
      brandNames: chosenBrandRecord ? [chosenBrandRecord.brand_name || chosenBrandRecord.name] : [],
      description: formData.description.trim(),
    };

    if (editingProductId) {
      updateProductMaster(editingProductId, productPayload);
      addAuditLog('EDIT_CENTRAL_PRODUCT', `Updated Central Product Master: ${productPayload.product_name} (${productPayload.product_code})`);
    } else {
      addProductMaster(productPayload);
      addAuditLog('CREATE_CENTRAL_PRODUCT', `Created Central Product Master: ${productPayload.product_name} (${productPayload.product_code})`);
    }

    // Save Dynamic Category Attributes in PRODUCT_ATTRIBUTE
    const dynamicAttrEntries = configuredAttrs.map(ca => ({
      attribute_id: ca.attribute.attribute_id,
      attribute_value: formAttrValues[ca.attribute.attribute_id] || ''
    }));
    saveProductAttributesBulk(targetId, dynamicAttrEntries);

    setIsAddModalOpen(false);
  };

  // Toggle Product Status (Cycle between ACTIVE and INACTIVE)
  const handleToggleStatus = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentStatus = prd.lifecycle_status || (prd.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE');
    const newLifecycle: LifecycleStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateProductMaster(prd.id, {
      lifecycle_status: newLifecycle,
      status: newLifecycle === 'ACTIVE' ? 'Active' : 'Inactive',
      updated_at: new Date().toISOString().split('T')[0]
    });
    toggleProductMasterStatus(prd.id);
    addAuditLog('TOGGLE_PRODUCT_STATUS', `Set Central Product ${prd.product_code || prd.code} lifecycle status to ${newLifecycle}`);

    if (selectedProduct && selectedProduct.id === prd.id) {
      setSelectedProduct(prev => prev ? {
        ...prev,
        lifecycle_status: newLifecycle,
        status: newLifecycle === 'ACTIVE' ? 'Active' : 'Inactive'
      } : null);
    }
  };

  // Mapped manufacturers for selected product drawer (PRODUCT_MANUFACTURER)
  const mappedItemsForSelected = useMemo(() => {
    if (!selectedProduct) return [];
    const prdId = selectedProduct.id;
    const prdCode = selectedProduct.product_code || selectedProduct.code;
    const pMappings = (mappings || []).filter(m => 
      m.productId === prdId || m.product_id === prdId || (prdCode && (m.productId === prdCode || m.product_id === prdCode))
    );
    return pMappings.map(map => {
      const mId = map.manufacturer_id || map.manufacturerId;
      const mfg = (manufacturers || []).find(m => m.manufacturer_id === mId || m.id === mId);
      return {
        mapping: map,
        manufacturer: mfg || {
          id: mId,
          manufacturer_id: mId,
          code: map.manufacturerCode || 'MFG',
          manufacturer_code: map.manufacturerCode || 'MFG',
          name: map.manufacturerName || 'Manufacturer',
          manufacturer_name: map.manufacturerName || 'Manufacturer',
          companyName: map.manufacturerName || 'Manufacturer',
          lifecycle_status: 'ACTIVE' as const
        }
      };
    });
  }, [selectedProduct, mappings, manufacturers]);

  // Helper to resolve primary / preferred Manufacturer and count for product table
  const getProductManufacturerDisplay = (prd: Product) => {
    const prdId = prd.product_id || prd.id;
    const pMappings = (mappings || []).filter(m => m.productId === prdId || m.product_id === prdId || m.productId === prd.id || m.product_id === prd.id);
    if (pMappings.length === 0) {
      return { preferredName: null, totalCount: 0, hasPreferred: false, preferredMapping: null };
    }
    // Look for preferred mapping first, fallback to first active or first mapping
    const preferredMapping = pMappings.find(m => (m.is_preferred || m.isPreferred) && (m.lifecycle_status === 'ACTIVE' || (m as any).status === 'Active')) ||
      pMappings.find(m => m.is_preferred || m.isPreferred) ||
      pMappings.find(m => m.lifecycle_status === 'ACTIVE' || (m as any).status === 'Active') ||
      pMappings[0];

    const mId = preferredMapping.manufacturer_id || preferredMapping.manufacturerId;
    const mfg = (manufacturers || []).find(m => m.manufacturer_id === mId || m.id === mId);
    const preferredName = mfg?.manufacturer_name || mfg?.companyName || mfg?.name || preferredMapping.manufacturerName || 'Manufacturer';
    return {
      preferredName,
      totalCount: pMappings.length,
      hasPreferred: !!(preferredMapping.is_preferred || preferredMapping.isPreferred),
      preferredMapping
    };
  };

  // Helper to resolve Manufacturer Name for a product
  const getManufacturerName = (prdId: string) => {
    const pMappings = (mappings || []).filter(m => m.productId === prdId);
    if (pMappings.length > 0) {
      const names = pMappings.map(map => {
        const mfg = (manufacturers || []).find(m => m.id === map.manufacturerId);
        return mfg?.companyName || mfg?.name || map.manufacturerName;
      }).filter(Boolean);
      if (names.length > 0) return Array.from(new Set(names)).join(', ');
    }
    return '—';
  };

  // Lifecycle status badge styling helper
  const getLifecycleBadge = (status?: string) => {
    const st = (status || 'ACTIVE').toUpperCase();
    switch (st) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'DRAFT':
        return { label: 'DRAFT', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
      case 'INACTIVE':
        return { label: 'INACTIVE', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
      case 'DISCONTINUED':
        return { label: 'DISCONTINUED', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'EOL':
        return { label: 'EOL (End of Life)', bg: '#F3E8FF', color: '#7E22CE', border: '#D8B4FE' };
      default:
        return { label: st, bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
  };

  // Selected Category Record in Modal for real-time derived hierarchy display
  const selectedModalCategoryRecord = useMemo(() => {
    return resolveCategoryRecord(formData.categoryId);
  }, [formData.categoryId, unifiedCategories]);

  // Categories available for Modal based on selected Product Type
  const modalAvailableCategories = useMemo(() => {
    return (unifiedCategories || []).filter(c =>
      c.product_type_id === formData.productTypeId &&
      (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active')
    );
  }, [unifiedCategories, formData.productTypeId]);

  // If viewed by Manufacturer role, render "My Product Catalog" for the logged-in manufacturer
  if (currentRole === 'SUPPLIER') {
    const loggedInMfg = manufacturers[0];
    return <ManufacturerProductCatalogTab manufacturer={loggedInMfg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Header ────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(15, 118, 110, 0.10)',
            border: '1px solid rgba(15, 118, 110, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Package size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              MASTER DATA · CENTRAL PRODUCT CATALOG
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              PRODUCT CATALOG
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Generic enterprise product master aligned with client catalogue model. Industry-specific fields are managed dynamically via Product Attributes.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('category-master')}
              title="Manage Canonical Category Records"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: '#F0FDFA',
                color: '#0F766E',
                border: '1px solid #99F6E4',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Layers size={16} /> Category Master →
            </button>
          )}

          {canEditProducts && (
            <button
              onClick={handleOpenAddModal}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
              }}
            >
              <Plus size={16} /> + Add Product
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ────────────────────────────── */}
      <div style={{
        padding: 18,
        background: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '10px 14px',
            flex: '1 1 280px'
          }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by product code, name, short name, or attributes..."
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

          {/* Product Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>Product Type:</span>
            <select
              value={selectedProductTypeId}
              onChange={e => {
                setSelectedProductTypeId(e.target.value);
                setSelectedCategoryId('ALL');
              }}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedProductTypeId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedProductTypeId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: selectedProductTypeId !== 'ALL' ? '#0F766E' : '#0F172A',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Product Types</option>
              {(productTypes || []).map(pt => (
                <option key={pt.product_type_id || pt.id} value={pt.product_type_id || pt.id}>
                  {pt.product_type_name || pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter — From Unified Category Master */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Category:</span>
            <select
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedCategoryId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedCategoryId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 240
              }}
            >
              <option value="ALL">All Categories ({filterCategoriesList.length})</option>
              {filterCategoriesList.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category}{cat.sub_category ? ` › ${cat.sub_category}` : ''}{cat.sub_sub_category ? ` › ${cat.sub_sub_category}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Brand:</span>
            <select
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedBrandId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedBrandId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Brands ({(brands || []).length})</option>
              {(brands || []).map(b => (
                <option key={b.brand_id || b.id} value={b.brand_id || b.id}>
                  {b.brand_name || b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lifecycle Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="DISCONTINUED">DISCONTINUED</option>
              <option value="EOL">EOL (End of Life)</option>
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Manufacturer:</span>
            <select
              value={selectedMfgId}
              onChange={e => setSelectedMfgId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Manufacturers</option>
              {(manufacturers || []).map(m => (
                <option key={m.id} value={m.id}>{m.companyName || m.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Footer Summary & View Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12,
          color: '#475569',
          paddingTop: 10,
          borderTop: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} style={{ color: '#0F766E' }} />
            <span>
              Core PRODUCT fields remain generic across all industries. Category is a single entity containing complete hierarchy.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Showing <strong style={{ color: '#0F766E' }}>{filteredProducts.length}</strong> central products</span>
            <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
          </div>
        </div>
      </div>

      {/* ── Product Catalog Table / Card Views ─────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        {displayMode === 'CARD' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', gridColumn: '1 / -1' }}>
                No products found matching your search and filter criteria.
              </div>
            ) : (
              filteredProducts.map(p => {
                const badge = getLifecycleBadge(p.lifecycle_status || (p.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'));
                const brandStr = getBrandName(p);
                const pShort = p.product_short_name || '—';
                const pCode = p.product_code || p.code;
                const pName = p.product_name || p.name;
                const baseUom = p.base_uom || p.uom || 'Unit';
                const packUom = p.pack_uom || 'Strip';
                const packSize = p.pack_size || p.packSize || 'Standard Pack';

                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {pCode}
                          </span>
                          <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                            {pName}
                          </h3>
                          {pShort && pShort !== '—' && (
                            <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                              Short: <span style={{ color: '#0F766E' }}>{pShort}</span>
                            </div>
                          )}
                        </div>

                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Product Type: </span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            {getProductTypeName(p)}
                          </span>
                          <span title="Product Type ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748B', marginLeft: 6 }}>
                            ({getProductTypeId(p)})
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Category: </span>
                          <strong style={{ color: '#0F172A' }}>{getCategoryHierarchyDisplay(p)}</strong>
                          <span title="Category ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E', marginLeft: 6 }}>
                            ({getCategoryId(p)})
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Brand: </span>
                          {brandStr ? (
                            <>
                              <span style={{ padding: '1px 6px', background: '#FEF3C7', color: '#B45309', borderRadius: 4, fontSize: 11, fontWeight: 700, border: '1px solid #FDE68A' }}>
                                🏷 {brandStr}
                              </span>
                              <span title="Brand ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#B45309', marginLeft: 6 }}>
                                ({getBrandId(p) || '—'})
                              </span>
                            </>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Unbranded (—)</span>
                          )}
                        </div>
                        <div>
                          <span style={{ color: '#475569', fontWeight: 600 }}>Manufacturer: </span>
                          {(() => {
                            const mfgInfo = getProductManufacturerDisplay(p);
                            if (!mfgInfo.preferredName) {
                              return <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Unmapped</span>;
                            }
                            return (
                              <span style={{ color: '#0F172A', fontWeight: 700 }}>
                                {mfgInfo.preferredName} {mfgInfo.hasPreferred ? '★' : ''}
                                {mfgInfo.totalCount > 1 && (
                                  <span style={{ color: '#0F766E', fontSize: 11, fontWeight: 600, marginLeft: 4 }}>
                                    (+{mfgInfo.totalCount - 1} more)
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                          <div>Base UOM: <strong style={{ color: '#0F172A' }}>{baseUom}</strong></div>
                          <div>Pack: <strong style={{ color: '#0F172A' }}>{packSize} ({packUom})</strong></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: '#64748B' }}>Sellable:</span>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: p.is_sellable !== false ? '#DCFCE7' : '#FEE2E2',
                            color: p.is_sellable !== false ? '#15803D' : '#B91C1C',
                            border: p.is_sellable !== false ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                          }}>
                            {p.is_sellable !== false ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setSelectedProduct(p)}
                        style={{
                          padding: '6px 12px',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          borderRadius: 6,
                          color: '#0F766E',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                      {canEditProducts && (
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          style={{
                            padding: '6px 12px',
                            background: '#0F766E',
                            border: 'none',
                            borderRadius: 6,
                            color: '#FFFFFF',
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 1380, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>PRODUCT CODE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT NAME</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>SHORT NAME</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 125 }}>PRODUCT TYPE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 230 }}>CATEGORY</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>BRAND</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 170 }}>MANUFACTURER</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 85 }}>BASE UOM</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>PACK SIZE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 85 }}>PACK UOM</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>LIFECYCLE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 75 }}>SELLABLE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>AVAILABLE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>DISCONTINUED</th>
                <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 120 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Package size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No central products found.</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                      Create a standardized product master record to begin manufacturer mapping.
                    </div>
                    {canEditProducts && (
                      <button
                        onClick={handleOpenAddModal}
                        style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        + Add Product
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prd) => {
                  const badge = getLifecycleBadge(prd.lifecycle_status || (prd.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'));
                  const brandStr = getBrandName(prd);
                  const pCode = prd.product_code || prd.code;
                  const pName = prd.product_name || prd.name;
                  const pShort = prd.product_short_name || '—';
                  const baseUom = prd.base_uom || prd.uom || 'Unit';
                  const packSize = prd.pack_size || prd.packSize || '—';
                  const packUom = prd.pack_uom || '—';
                  const isSellable = prd.is_sellable !== false;
                  const availFrom = prd.available_from || '—';
                  const discOn = prd.discontinued_on || '—';

                  return (
                    <tr
                      key={prd.id}
                      onClick={() => setSelectedProduct(prd)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* 1. PRODUCT CODE */}
                      <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {pCode}
                      </td>

                      {/* 2. PRODUCT NAME */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{pName}</div>
                      </td>

                      {/* 3. PRODUCT SHORT NAME */}
                      <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {pShort}
                      </td>

                      {/* 4. PRODUCT TYPE */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            {getProductTypeName(prd)}
                          </span>
                          <span title="Product Type ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>
                            {getProductTypeId(prd)}
                          </span>
                        </div>
                      </td>

                      {/* 5. CATEGORY (Derived hierarchy) */}
                      <td style={{ padding: '12px 10px', fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>
                          {getCategoryHierarchyDisplay(prd)}
                        </div>
                        <div title="Category ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E', marginTop: 3 }}>
                          {getCategoryId(prd)}
                        </div>
                      </td>

                      {/* 6. BRAND */}
                      <td style={{ padding: '12px 10px', fontSize: 12 }}>
                        {brandStr ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 700, fontSize: 11 }}>
                              <span>🏷</span>
                              <span>{brandStr}</span>
                            </div>
                            <span title="Brand ID" style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#B45309' }}>
                              {getBrandId(prd) || '—'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 11.5 }}>Unbranded</span>
                            <span title="Brand ID (None)" style={{ fontSize: 10, fontFamily: 'monospace', color: '#94A3B8' }}>—</span>
                          </div>
                        )}
                      </td>

                      {/* 6b. MANUFACTURER (Derived via PRODUCT -> PRODUCT_MANUFACTURER -> MANUFACTURER) */}
                      <td
                        style={{ padding: '12px 10px', fontSize: 12, cursor: 'pointer' }}
                        title="Click to view & manage manufacturer mappings"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(prd);
                          setTimeout(() => {
                            const el = document.getElementById('manufacturer-mappings-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                      >
                        {(() => {
                          const mfgInfo = getProductManufacturerDisplay(prd);
                          if (!mfgInfo.preferredName) {
                            return <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 11.5 }}>Unmapped</span>;
                          }
                          return (
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span>{mfgInfo.preferredName}</span>
                                {mfgInfo.hasPreferred && (
                                  <span title="Preferred Manufacturer (PRODUCT_MANUFACTURER.is_preferred)" style={{ color: '#D97706', fontSize: 12, fontWeight: 900 }}>★</span>
                                )}
                              </div>
                              {mfgInfo.totalCount > 1 && (
                                <div style={{ fontSize: 10.5, color: '#0F766E', fontWeight: 700, marginTop: 2 }}>
                                  +{mfgInfo.totalCount - 1} more ({mfgInfo.totalCount} Manufacturers)
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 7. BASE UOM */}
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                        {baseUom}
                      </td>

                      {/* 8. PACK SIZE */}
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {packSize}
                      </td>

                      {/* 9. PACK UOM */}
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                        {packUom}
                      </td>

                      {/* 10. LIFECYCLE STATUS */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* 11. SELLABLE */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isSellable ? '#DCFCE7' : '#FEE2E2',
                          color: isSellable ? '#15803D' : '#B91C1C',
                          border: isSellable ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                        }}>
                          {isSellable ? 'YES' : 'NO'}
                        </span>
                      </td>

                      {/* 12. AVAILABLE FROM */}
                      <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {availFrom}
                      </td>

                      {/* 13. DISCONTINUED ON */}
                      <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {discOn}
                      </td>

                      {/* 14. ACTIONS */}
                      <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedProduct(prd)}
                            title="View Product Details"
                            style={{ padding: '5px 8px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 4, color: '#0F766E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Eye size={13} />
                          </button>
                          {canEditProducts && (
                            <>
                              <button
                                onClick={e => handleOpenEditModal(prd, e)}
                                title="Edit Product Master"
                                style={{ padding: '5px 8px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 4, color: '#0F766E', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={e => handleToggleStatus(prd, e)}
                                title={badge.label === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}
                                style={{
                                  padding: '5px 8px',
                                  background: badge.label === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                  border: badge.label === 'ACTIVE' ? '1px solid #FECACA' : '1px solid #BBF7D0',
                                  borderRadius: 4,
                                  color: badge.label === 'ACTIVE' ? '#DC2626' : '#16A34A',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <Power size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── INTERACTIVE PRODUCT DETAIL DRAWER ─────────────────────── */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 880,
              height: '100%',
              background: '#FFFFFF',
              boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                  {selectedProduct.product_code || selectedProduct.code}
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {selectedProduct.product_name || selectedProduct.name}
                </h2>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Central Product Master Detail &amp; Dynamic Attributes
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* SECTION A — CORE PRODUCT ENTITY */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={15} /> SECTION A — CORE PRODUCT
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  {/* 1. Product ID */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product ID:</span>
                    <strong style={{ color: '#0F172A', fontFamily: 'monospace', display: 'block' }}>{selectedProduct.product_id || selectedProduct.id}</strong>
                  </div>

                  {/* 2. Product Code */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product Code:</span>
                    <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{selectedProduct.product_code || selectedProduct.code}</strong>
                  </div>

                  {/* 3. Product Type */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product Type:</span>
                    <strong style={{ color: '#1D4ED8', display: 'block' }}>{getProductTypeName(selectedProduct)}</strong>
                  </div>

                  {/* 4. Product Type ID */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product Type ID:</span>
                    <strong style={{ color: '#1D4ED8', fontFamily: 'monospace', display: 'block' }}>{getProductTypeId(selectedProduct)}</strong>
                  </div>

                  {/* 5. Brand */}
                  <div>
                    <span style={{ color: '#64748B' }}>Brand:</span>
                    <strong style={{ color: '#D97706', display: 'block' }}>{getBrandName(selectedProduct) || 'Unbranded / Generic'}</strong>
                  </div>

                  {/* 6. Brand ID */}
                  <div>
                    <span style={{ color: '#64748B' }}>Brand ID:</span>
                    <strong style={{ color: '#D97706', fontFamily: 'monospace', display: 'block' }}>{getBrandId(selectedProduct) || '—'}</strong>
                  </div>

                  {/* 7. Category */}
                  <div>
                    <span style={{ color: '#64748B' }}>Category:</span>
                    <strong style={{ color: '#0F172A', display: 'block' }}>{getCategoryHierarchyDisplay(selectedProduct)}</strong>
                  </div>

                  {/* 8. Category ID */}
                  <div>
                    <span style={{ color: '#64748B' }}>Category ID:</span>
                    <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{getCategoryId(selectedProduct)}</strong>
                  </div>

                  {/* 9. Product Name */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product Name:</span>
                    <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.product_name || selectedProduct.name}</strong>
                  </div>

                  {/* 10. Product Short Name */}
                  <div>
                    <span style={{ color: '#64748B' }}>Product Short Name:</span>
                    <strong style={{ color: '#0F766E', display: 'block' }}>{selectedProduct.product_short_name || '—'}</strong>
                  </div>

                  {/* 11. Base UOM */}
                  <div>
                    <span style={{ color: '#64748B' }}>Base UOM:</span>
                    <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.base_uom || selectedProduct.uom || 'Unit'}</strong>
                  </div>

                  {/* 12. Pack Size */}
                  <div>
                    <span style={{ color: '#64748B' }}>Pack Size:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.pack_size || selectedProduct.packSize || '—'}</strong>
                  </div>

                  {/* 13. Pack UOM */}
                  <div>
                    <span style={{ color: '#64748B' }}>Pack UOM:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.pack_uom || '—'}</strong>
                  </div>

                  {/* 14. Lifecycle Status */}
                  <div>
                    <span style={{ color: '#64748B' }}>Lifecycle Status:</span>
                    {(() => {
                      const badge = getLifecycleBadge(selectedProduct.lifecycle_status || (selectedProduct.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'));
                      return (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* 15. Available From */}
                  <div>
                    <span style={{ color: '#64748B' }}>Available From:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.available_from || '—'}</strong>
                  </div>

                  {/* 16. Discontinued On */}
                  <div>
                    <span style={{ color: '#64748B' }}>Discontinued On:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.discontinued_on || '—'}</strong>
                  </div>

                  {/* 17. Replacement Product ID */}
                  <div>
                    <span style={{ color: '#64748B' }}>Replacement Product ID:</span>
                    {selectedProduct.replacement_product_id ? (
                      <div>
                        <strong style={{ color: '#0F172A', fontFamily: 'monospace', display: 'block' }}>
                          {selectedProduct.replacement_product_id}
                        </strong>
                        {(() => {
                          const rep = (products || []).find(p => p.id === selectedProduct.replacement_product_id || p.product_id === selectedProduct.replacement_product_id);
                          return rep ? (
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              ({rep.product_name || rep.name})
                            </span>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <strong style={{ color: '#94A3B8', display: 'block' }}>—</strong>
                    )}
                  </div>

                  {/* 18. Sellable */}
                  <div>
                    <span style={{ color: '#64748B' }}>Sellable:</span>
                    <div style={{ marginTop: 2 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: selectedProduct.is_sellable !== false ? '#DCFCE7' : '#FEE2E2',
                        color: selectedProduct.is_sellable !== false ? '#15803D' : '#B91C1C',
                        border: selectedProduct.is_sellable !== false ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                      }}>
                        {selectedProduct.is_sellable !== false ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>

                  {/* 19. Created At */}
                  <div>
                    <span style={{ color: '#64748B' }}>Created At:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.created_at || '—'}</strong>
                  </div>

                  {/* 20. Updated At */}
                  <div>
                    <span style={{ color: '#64748B' }}>Updated At:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.updated_at || '—'}</strong>
                  </div>

                  {/* 21. Product Description */}
                  <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                    <span style={{ color: '#64748B' }}>Product Description:</span>
                    <p style={{
                      margin: '3px 0 0',
                      fontSize: 12.5,
                      color: (selectedProduct.product_description || selectedProduct.description) ? '#334155' : '#94A3B8',
                      fontStyle: (selectedProduct.product_description || selectedProduct.description) ? 'normal' : 'italic',
                      lineHeight: 1.5
                    }}>
                      {selectedProduct.product_description || selectedProduct.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B — PRODUCT ATTRIBUTES (DYNAMIC ATTRIBUTE MODEL) */}
              <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} /> DYNAMIC PRODUCT ATTRIBUTES (PRODUCT_ATTRIBUTE)
                  </div>
                  {canEditProducts && (
                    <button
                      type="button"
                      onClick={() => handleOpenManageAttributes(selectedProduct)}
                      style={{
                        padding: '6px 14px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                      }}
                    >
                      <Sparkles size={13} /> Manage Attributes
                    </button>
                  )}
                </div>

                {(() => {
                  const pAttrs = getProductAttributeMap(selectedProduct.id);
                  const selCatId = selectedProduct.category_id || selectedProduct.categoryId || '';
                  const configuredAttrs = getCategoryConfiguredAttributes(selCatId);

                  if (configuredAttrs.length === 0) {
                    return (
                      <div style={{ fontSize: 12.5, color: '#64748B', fontStyle: 'italic', padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px dashed #99F6E4' }}>
                        <div>No dynamic attributes configured for this product's category in Category Master.</div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                      {configuredAttrs.map(ca => {
                        const attr = ca.attribute;
                        const attrId = attr.attribute_id;
                        const val = pAttrs[attrId];
                        const uom = attr.unit_of_measure;
                        const remark = ca.remark;

                        return (
                          <div key={attrId} style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: 6, border: '1px solid #CCFBF1', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                                {attr.attribute_name} {uom ? `(${uom})` : ''}
                              </span>
                              <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', color: '#475569' }}>
                                {attr.data_type}
                              </span>
                            </div>
                            <strong style={{ color: val ? '#0F172A' : '#94A3B8', fontStyle: val ? 'normal' : 'italic', fontSize: 13, marginTop: 2 }}>
                              {val || 'Not specified'}
                            </strong>
                            {remark && (
                              <div style={{ fontSize: 11, color: '#0F766E', fontStyle: 'italic', marginTop: 2 }}>
                                Note: {remark}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION C — MANUFACTURER MAPPINGS (PRODUCT_MANUFACTURER) */}
              <div
                id="manufacturer-mappings-section"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
                }}
              >
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Factory size={18} style={{ color: '#0F766E' }} />
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                        MANUFACTURER MAPPINGS
                      </h3>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #99F6E4'
                      }}>
                        {mappedItemsForSelected.length} {mappedItemsForSelected.length === 1 ? 'Mapping' : 'Mappings'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                      Manufacturers associated with this product. (Relationship entity: PRODUCT_MANUFACTURER)
                    </p>
                  </div>

                  {canEditProducts && (
                    <button
                      type="button"
                      onClick={handleOpenAddMapping}
                      style={{
                        padding: '8px 16px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                      }}
                    >
                      <Plus size={15} /> + Add Manufacturer
                    </button>
                  )}
                </div>

                {/* Table or Empty State */}
                {mappedItemsForSelected.length === 0 ? (
                  <div style={{
                    padding: 32,
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px dashed #CBD5E1',
                    fontSize: 13,
                    color: '#64748B',
                    textAlign: 'center'
                  }}>
                    <Factory size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>No manufacturer mappings recorded for this product yet.</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      One central product can be mapped to multiple manufacturers with individual SKUs and preferred status.
                    </div>
                    {canEditProducts && (
                      <button
                        type="button"
                        onClick={handleOpenAddMapping}
                        style={{
                          marginTop: 14,
                          padding: '8px 18px',
                          background: '#0F766E',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Add First Manufacturer Mapping
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                    <table style={{ width: '100%', minWidth: 840, borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            MANUFACTURER
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            PRODUCT CODE
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            PART NUMBER
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            SKU
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            STATUS
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            EFFECTIVE FROM
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            EFFECTIVE TO
                          </th>
                          <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569' }}>
                            PREFERRED
                          </th>
                          <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', textAlign: 'right' }}>
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedItemsForSelected.map(({ mapping, manufacturer }) => {
                          const isPref = !!(mapping.is_preferred || mapping.isPreferred);
                          const mapStatus = mapping.lifecycle_status || (mapping.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE');
                          const statusBadge = getLifecycleBadge(mapStatus);
                          const mfgCode = mapping.manufacturer_code || mapping.manufacturerCode || manufacturer.manufacturer_code || (manufacturer as any).code || '';
                          const mfgName = manufacturer.manufacturer_name || manufacturer.companyName || manufacturer.name || mapping.manufacturerName || 'Manufacturer';
                          const mfgProdCode = mapping.manufacturer_product_code || mapping.mfgProductCode || '—';
                          const mfgPartNum = mapping.manufacturer_part_number || '—';
                          const mfgSku = mapping.manufacturer_sku || '—';
                          const effFrom = mapping.effective_from || mapping.effectiveFrom || '—';
                          const effTo = mapping.effective_to || mapping.effectiveTo || '—';

                          return (
                            <tr
                              key={`${mapping.productId || mapping.product_id}_${mapping.manufacturerId || mapping.manufacturer_id}`}
                              style={{
                                borderBottom: '1px solid #F1F5F9',
                                background: isPref ? '#FFFDF5' : '#FFFFFF',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              {/* 1. Manufacturer */}
                              <td style={{ padding: '12px 12px' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                                  {mfgName}
                                </div>
                                {mfgCode && (
                                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                                    {mfgCode}
                                  </div>
                                )}
                              </td>

                              {/* 2. Manufacturer Product Code */}
                              <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {mfgProdCode}
                              </td>

                              {/* 3. Manufacturer Part Number */}
                              <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {mfgPartNum}
                              </td>

                              {/* 4. Manufacturer SKU */}
                              <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                                {mfgSku}
                              </td>

                              {/* 5. Lifecycle Status */}
                              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  background: statusBadge.bg,
                                  color: statusBadge.color,
                                  border: `1px solid ${statusBadge.border}`
                                }}>
                                  {statusBadge.label}
                                </span>
                              </td>

                              {/* 6. Effective From */}
                              <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                                {effFrom}
                              </td>

                              {/* 7. Effective To */}
                              <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                                {effTo}
                              </td>

                              {/* 8. Preferred Manufacturer */}
                              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                {isPref ? (
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: '#FEF3C7',
                                    color: '#B45309',
                                    border: '1px solid #FDE68A',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}>
                                    ★ Preferred
                                  </span>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 500 }}>No</span>
                                )}
                              </td>

                              {/* 9. Actions */}
                              <td style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  {canEditProducts && !isPref && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPreferred(mapping)}
                                      title="Mark as Preferred Manufacturer for this product"
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        background: '#FFFBEB',
                                        border: '1px solid #FDE68A',
                                        color: '#B45309',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 3
                                      }}
                                    >
                                      ★ Make Preferred
                                    </button>
                                  )}
                                  {canEditProducts && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditMapping(mapping)}
                                        title="Edit Mapping Fields"
                                        style={{
                                          padding: '4px 8px',
                                          borderRadius: 4,
                                          background: '#F0FDFA',
                                          border: '1px solid #99F6E4',
                                          color: '#0F766E',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 3
                                        }}
                                      >
                                        <Edit3 size={12} /> Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleMappingStatus(mapping)}
                                        title={mapStatus === 'ACTIVE' ? 'Deactivate Mapping' : 'Activate Mapping'}
                                        style={{
                                          padding: '4px 7px',
                                          borderRadius: 4,
                                          background: mapStatus === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                          border: mapStatus === 'ACTIVE' ? '1px solid #FECACA' : '1px solid #BBF7D0',
                                          color: mapStatus === 'ACTIVE' ? '#DC2626' : '#16A34A',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Power size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMapping(mapping)}
                                        title="Remove Mapping"
                                        style={{
                                          padding: '4px 7px',
                                          borderRadius: 4,
                                          background: '#FFF',
                                          border: '1px solid #CBD5E1',
                                          color: '#64748B',
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
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

              {/* ── SECTION D: PRICING (PRODUCT_PRICE + CUSTOMER_SEGMENT) ── */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', margin: 0 }}>
                        Section D: Pricing Records (PRODUCT_PRICE)
                      </h4>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #99F6E4'
                      }}>
                        {(productPrices || []).filter(p => p.product_id === selectedProduct.product_id || p.product_id === selectedProduct.id).length} Price Rules
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                      Customer-segment and manufacturer-specific pricing. (Entity: PRODUCT_PRICE → CUSTOMER_SEGMENT)
                    </p>
                  </div>

                  {canEditProducts && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPriceForm({
                          customer_segment_id: customerSegments[0]?.customer_segment_id || '',
                          product_manufacturer_id: null,
                          price_type: 'FIXED',
                          currency: 'INR',
                          unit_price: 15.00,
                          minimum_quantity: 100,
                          maximum_quantity: '',
                          effective_from: new Date().toISOString().split('T')[0],
                          effective_to: '',
                          price_status: 'ACTIVE'
                        });
                        setIsQuickPriceOpen(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                      }}
                    >
                      <Plus size={15} /> + Add Price
                    </button>
                  )}
                </div>

                {(() => {
                  const pricesForProd = (productPrices || []).filter(
                    p => p.product_id === selectedProduct.product_id || p.product_id === selectedProduct.id
                  );

                  if (pricesForProd.length === 0) {
                    return (
                      <div style={{
                        padding: 28,
                        background: '#F8FAFC',
                        borderRadius: 8,
                        border: '1px dashed #CBD5E1',
                        fontSize: 13,
                        color: '#64748B',
                        textAlign: 'center'
                      }}>
                        <DollarSign size={32} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>No price records configured for this product.</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          Define segment-specific unit pricing with minimum/maximum quantity tier rules.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Segment</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Manufacturer</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Type</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Unit Price</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Min / Max Qty</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Effective Period</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Status</th>
                            {canEditProducts && (
                              <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {pricesForProd.map(price => {
                            const seg = customerSegments.find(s => s.customer_segment_id === price.customer_segment_id);
                            const mfgMap = price.product_manufacturer_id ? (mappings || []).find(m => m.id === price.product_manufacturer_id || m.product_manufacturer_id === price.product_manufacturer_id) : null;
                            const mfg = mfgMap ? manufacturers.find(m => m.id === mfgMap.manufacturer_id || m.manufacturer_id === mfgMap.manufacturer_id) : null;

                            return (
                              <tr key={price.product_price_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                                  {seg ? seg.segment_name : price.customer_segment_id}
                                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{seg?.segment_code}</div>
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 12, color: '#475569' }}>
                                  {mfg ? mfg.manufacturer_name : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Global (Base)</span>}
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 12, color: '#475569' }}>
                                  <span style={{ padding: '2px 6px', background: '#F1F5F9', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{price.price_type}</span>
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                                  {price.currency} {price.unit_price.toFixed(2)}
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 12, color: '#475569' }}>
                                  Min {price.minimum_quantity} {price.maximum_quantity ? `– Max ${price.maximum_quantity}` : '+'}
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 11.5, color: '#64748B' }}>
                                  {price.effective_from || '—'} to {price.effective_to || 'Ongoing'}
                                </td>
                                <td style={{ padding: '10px 10px' }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: price.price_status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                                    color: price.price_status === 'ACTIVE' ? '#15803D' : '#B91C1C'
                                  }}>
                                    {price.price_status}
                                  </span>
                                </td>
                                {canEditProducts && (
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => removeProductPrice(price.product_price_id)}
                                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                      title="Delete Price Rule"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* ── SECTION E: TAX SPECIFICATIONS (PRODUCT_TAX) ── */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', margin: 0 }}>
                        Section E: Tax Specifications (PRODUCT_TAX)
                      </h4>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #99F6E4'
                      }}>
                        {(productTaxes || []).filter(t => t.product_id === selectedProduct.product_id || t.product_id === selectedProduct.id).length} Tax Rates
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                      Applicable tax codes and percentage rates. (Entity: PRODUCT_TAX)
                    </p>
                  </div>

                  {canEditProducts && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickTaxForm({
                          tax_code: 'HSN-3004-90',
                          tax_rate: 12,
                          effective_from: new Date().toISOString().split('T')[0],
                          effective_to: '',
                          status: 'ACTIVE'
                        });
                        setIsQuickTaxOpen(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                      }}
                    >
                      <Plus size={15} /> + Add Tax
                    </button>
                  )}
                </div>

                {(() => {
                  const taxesForProd = (productTaxes || []).filter(
                    t => t.product_id === selectedProduct.product_id || t.product_id === selectedProduct.id
                  );

                  if (taxesForProd.length === 0) {
                    return (
                      <div style={{
                        padding: 28,
                        background: '#F8FAFC',
                        borderRadius: 8,
                        border: '1px dashed #CBD5E1',
                        fontSize: 13,
                        color: '#64748B',
                        textAlign: 'center'
                      }}>
                        <Receipt size={32} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>No tax specifications configured for this product.</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          Maintain exact client tax_code and tax_rate records per regulatory schedule.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Tax Code</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Tax Rate (%)</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Effective From</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Effective To</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Status</th>
                            {canEditProducts && (
                              <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {taxesForProd.map(tax => (
                              <tr key={tax.product_tax_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>
                                  {tax.tax_code}
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 800, color: '#0369A1' }}>
                                  {tax.tax_rate}%
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 11.5, color: '#64748B' }}>
                                  {tax.effective_from || '—'}
                                </td>
                                <td style={{ padding: '10px 10px', fontSize: 11.5, color: '#64748B' }}>
                                  {tax.effective_to || 'Ongoing'}
                                </td>
                                <td style={{ padding: '10px 10px' }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    background: tax.status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                                    color: tax.status === 'ACTIVE' ? '#15803D' : '#B91C1C'
                                  }}>
                                    {tax.status}
                                  </span>
                                </td>
                                {canEditProducts && (
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => removeProductTax(tax.product_tax_id)}
                                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                      title="Delete Tax Rule"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* ── SECTION F: UOM CONVERSIONS (PRODUCT_UOM) ── */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F172A', margin: 0 }}>
                        Section F: Unit of Measure Conversions (PRODUCT_UOM)
                      </h4>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #99F6E4'
                      }}>
                        {(productUoms || []).filter(u => u.product_id === selectedProduct.product_id || u.product_id === selectedProduct.id).length} Units
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                      Conversion factors and order units for this product. (Entity: PRODUCT_UOM)
                    </p>
                  </div>

                  {canEditProducts && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickUomForm({
                          uom: 'Boxes',
                          conversion_factor: 10,
                          is_base_uom: false,
                          is_order_uom: true,
                          is_active: true
                        });
                        setIsQuickUomOpen(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                      }}
                    >
                      <Plus size={15} /> + Add UOM
                    </button>
                  )}
                </div>

                {(() => {
                  const uomsForProd = (productUoms || []).filter(
                    u => u.product_id === selectedProduct.product_id || u.product_id === selectedProduct.id
                  );

                  if (uomsForProd.length === 0) {
                    return (
                      <div style={{
                        padding: 28,
                        background: '#F8FAFC',
                        borderRadius: 8,
                        border: '1px dashed #CBD5E1',
                        fontSize: 13,
                        color: '#64748B',
                        textAlign: 'center'
                      }}>
                        <Package size={32} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>No conversion units mapped for this product.</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          Define order UOMs and conversion factors relative to base unit ({selectedProduct.base_uom || selectedProduct.baseUom || 'Unit'}).
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>UOM</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Conversion Factor</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Base UOM?</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Order UOM?</th>
                            <th style={{ padding: '9px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>Status</th>
                            {canEditProducts && (
                              <th style={{ padding: '9px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'right' }}>Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {uomsForProd.map(uomItem => (
                            <tr key={uomItem.product_uom_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                                {uomItem.uom}
                              </td>
                              <td style={{ padding: '10px 10px', fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                                × {uomItem.conversion_factor} <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>({selectedProduct.base_uom || selectedProduct.baseUom || 'Units'})</span>
                              </td>
                              <td style={{ padding: '10px 10px', fontSize: 12, color: '#475569' }}>
                                {uomItem.is_base_uom ? (
                                  <span style={{ color: '#0F766E', fontWeight: 700 }}>✓ Yes</span>
                                ) : (
                                  <span style={{ color: '#94A3B8' }}>No</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 10px', fontSize: 12, color: '#475569' }}>
                                {uomItem.is_order_uom ? (
                                  <span style={{ color: '#2563EB', fontWeight: 700 }}>✓ Yes</span>
                                ) : (
                                  <span style={{ color: '#94A3B8' }}>No</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 10px' }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  background: uomItem.is_active ? '#DCFCE7' : '#FEE2E2',
                                  color: uomItem.is_active ? '#15803D' : '#B91C1C'
                                }}>
                                  {uomItem.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              {canEditProducts && (
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => removeProductUom(uomItem.product_uom_id)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                                    title="Delete UOM Rule"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {canEditProducts ? (
                <>
                  <button
                    onClick={() => handleOpenEditModal(selectedProduct)}
                    style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit3 size={14} /> Edit Product Master
                  </button>

                  <button
                    onClick={() => handleToggleStatus(selectedProduct)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 6,
                      border: selectedProduct.lifecycle_status === 'INACTIVE' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
                      background: selectedProduct.lifecycle_status === 'INACTIVE' ? '#DCFCE7' : '#FEE2E2',
                      color: selectedProduct.lifecycle_status === 'INACTIVE' ? '#15803D' : '#B91C1C',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Power size={14} /> {selectedProduct.lifecycle_status === 'INACTIVE' ? 'Activate Product' : 'Deactivate Product'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                  View only — product master management is restricted to authorized roles.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CENTRAL PRODUCT MODAL (CLIENT MODEL ALIGNED) ── */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '92vh',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingProductId ? 'EDIT PRODUCT MASTER' : 'CREATE CENTRAL PRODUCT'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Standardized client product entity model. Core product is generic; domain fields belong in Product Attributes.
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Inline Error Alert */}
            {modalFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{modalFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProductMaster} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* ────────────────────────────────────────────────────────── */}
              {/* ────────────────────────────────────────────────────────── */}
              {/* 1. PRODUCT HIERARCHY & BRAND */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={14} /> 1. PRODUCT HIERARCHY (TYPE → CATEGORY → BRAND)
                </div>

                {/* Step 1: Product Type * */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      Step 1: Product Type *
                    </label>
                    {formData.productTypeId && (
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                        ID: {formData.productTypeId}
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={formData.productTypeId}
                    onChange={e => {
                      const newPtId = e.target.value;
                      const matchingCats = (unifiedCategories || []).filter(c => c.product_type_id === newPtId && (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active'));
                      setFormData({
                        ...formData,
                        productTypeId: newPtId,
                        categoryId: matchingCats[0]?.category_id || ''
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
                  >
                    <option value="" disabled>-- Select Product Type * --</option>
                    {(productTypes || []).filter(t => (t.lifecycle_status || t.status) === 'ACTIVE').map(t => (
                      <option key={t.product_type_id || t.id} value={t.product_type_id || t.id}>
                        {t.product_type_name || t.name} ({t.product_type_id || t.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* Step 2: Category * */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Step 2: Product Category *
                      </label>
                      {formData.categoryId && (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                          ID: {formData.categoryId}
                        </span>
                      )}
                    </div>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                    >
                      <option value="">-- Select Category from Master * --</option>
                      {modalAvailableCategories.map(c => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.category} › {c.sub_category || 'General'} {c.sub_sub_category ? `› ${c.sub_sub_category}` : ''} ({c.category_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3: Brand */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Step 3: Product Brand <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                      </label>
                      {formData.brandId ? (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#D97706' }}>
                          ID: {formData.brandId}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>
                          ID: —
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.brandId}
                      onChange={e => setFormData({ ...formData, brandId: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF', color: '#0F172A' }}
                    >
                      <option value="">-- No Brand / Unbranded (Generic) --</option>
                      {(brands || []).filter(b => (b.lifecycle_status || b.status || 'ACTIVE').toUpperCase() === 'ACTIVE').map(b => (
                        <option key={b.brand_id || b.id} value={b.brand_id || b.id}>
                          {b.brand_name || b.name} ({b.brand_id || b.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Read-only Derived Category Hierarchy Display */}
                {selectedModalCategoryRecord && (
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.05em' }}>
                        Derived Category Hierarchy:
                      </div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                        Category ID: {selectedModalCategoryRecord.category_id}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Category:</span>
                        <strong style={{ color: '#0F172A' }}>{selectedModalCategoryRecord.category}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Sub-Category:</span>
                        <strong style={{ color: '#0F766E' }}>{selectedModalCategoryRecord.sub_category || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: 11 }}>Sub-Sub-Category:</span>
                        <strong style={{ color: '#0284C7' }}>{selectedModalCategoryRecord.sub_sub_category || '—'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* 2. CATEGORY ATTRIBUTES (DYNAMIC BY CATEGORY) */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#FFFFFF', border: '1.5px solid #99F6E4', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> 2. CATEGORY ATTRIBUTES (SPECIFICATIONS)
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: '#F0FDFA',
                    color: '#0F766E',
                    border: '1px solid #99F6E4'
                  }}>
                    {modalCategoryConfiguredAttributes.length} / 10 Attributes Configured
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                  Attributes configured specifically for category <strong>{selectedModalCategoryRecord?.category || formData.categoryId}</strong>. Values are saved to <code>PRODUCT_ATTRIBUTE</code>.
                </div>

                {modalCategoryConfiguredAttributes.length === 0 ? (
                  <div style={{
                    padding: '16px 20px',
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    fontSize: 12.5,
                    color: '#64748B',
                    textAlign: 'center'
                  }}>
                    No attributes are currently assigned to this category. You can configure up to 10 attributes in the <strong>Category Master</strong>.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {modalCategoryConfiguredAttributes.map(ca => {
                      const attr = ca.attribute;
                      const attrId = attr.attribute_id;
                      const val = formAttrValues[attrId] || '';
                      const listOpts = LIST_ATTRIBUTE_OPTIONS[attr.attribute_code];

                      return (
                        <div key={attrId} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                              {attr.attribute_name}
                              {attr.unit_of_measure ? ` (${attr.unit_of_measure})` : ''}
                              {attr.is_required && <span style={{ color: '#DC2626' }}> *</span>}
                            </label>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#E2E8F0', color: '#475569' }}>
                              {attr.data_type}
                            </span>
                          </div>

                          {ca.remark && (
                            <div style={{ fontSize: 11, color: '#0F766E', fontStyle: 'italic', marginBottom: 2 }}>
                              Note: {ca.remark}
                            </div>
                          )}

                          {attr.data_type === 'LIST' ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                type="text"
                                list={`form_attr_list_${attrId}`}
                                placeholder={`Select or type ${attr.attribute_name.toLowerCase()}...`}
                                value={val}
                                onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                              />
                              {listOpts && (
                                <datalist id={`form_attr_list_${attrId}`}>
                                  {listOpts.map(opt => (
                                    <option key={opt} value={opt} />
                                  ))}
                                </datalist>
                              )}
                            </div>
                          ) : attr.data_type === 'BOOLEAN' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36 }}>
                              <input
                                type="checkbox"
                                id={`form_attr_check_${attrId}`}
                                checked={val === 'true'}
                                onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.checked ? 'true' : 'false' })}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                              />
                              <label htmlFor={`form_attr_check_${attrId}`} style={{ fontSize: 12.5, color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                                {val === 'true' ? 'Enabled (True)' : 'Disabled (False)'}
                              </label>
                            </div>
                          ) : attr.data_type === 'NUMBER' ? (
                            <input
                              type="number"
                              placeholder="e.g. 500"
                              value={val}
                              onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                            />
                          ) : attr.data_type === 'DECIMAL' ? (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 10.5"
                              value={val}
                              onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                            />
                          ) : attr.data_type === 'DATE' ? (
                            <input
                              type="date"
                              value={val}
                              onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder={`Enter ${attr.attribute_name.toLowerCase()}...`}
                              value={val}
                              onChange={e => setFormAttrValues({ ...formAttrValues, [attrId]: e.target.value })}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* 3. PRODUCT INFORMATION */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} /> 3. PRODUCT INFORMATION
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Product Code * (UNIQUE)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PRD001001"
                      value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Product Short Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Paracetamol 650"
                      value={formData.shortName}
                      onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 650mg Tablets"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter generic product description..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* 4. UNIT / PACKAGING */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} /> 4. UNIT / PACKAGING
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Base UOM *
                    </label>
                    <select
                      value={formData.baseUom}
                      onChange={e => setFormData({ ...formData, baseUom: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                    >
                      {COMMON_BASE_UOMS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Pack Size *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10 x 1 x 10"
                      value={formData.packSize}
                      onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Pack UOM *
                    </label>
                    <select
                      value={formData.packUom}
                      onChange={e => setFormData({ ...formData, packUom: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                    >
                      {COMMON_PACK_UOMS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* 5. LIFECYCLE & SELLABILITY */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} /> 5. LIFECYCLE &amp; SELLABILITY
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Lifecycle Status *
                    </label>
                    <select
                      value={formData.lifecycleStatus}
                      onChange={e => setFormData({ ...formData, lifecycleStatus: e.target.value as LifecycleStatus })}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="DISCONTINUED">DISCONTINUED</option>
                      <option value="EOL">EOL (End of Life)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Available From
                    </label>
                    <input
                      type="date"
                      value={formData.availableFrom}
                      onChange={e => setFormData({ ...formData, availableFrom: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Discontinued On
                    </label>
                    <input
                      type="date"
                      value={formData.discontinuedOn}
                      onChange={e => setFormData({ ...formData, discontinuedOn: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Replacement Product <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                      </label>
                      {formData.replacementProductId ? (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                          ID: {formData.replacementProductId}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94A3B8' }}>
                          ID: —
                        </span>
                      )}
                    </div>
                    <select
                      value={formData.replacementProductId}
                      onChange={e => setFormData({ ...formData, replacementProductId: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                    >
                      <option value="">-- None (—) --</option>
                      {(products || [])
                        .filter(p => p.id !== editingProductId)
                        .map(p => (
                          <option key={p.id} value={p.product_id || p.id}>
                            {p.product_name || p.name} ({p.product_id || p.id})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Is Sellable
                    </label>
                    <select
                      value={formData.isSellable ? 'yes' : 'no'}
                      onChange={e => setFormData({ ...formData, isSellable: e.target.value === 'yes' })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1.5px solid',
                        borderColor: formData.isSellable ? '#86EFAC' : '#FCA5A5',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        background: formData.isSellable ? '#F0FDF4' : '#FEF2F2',
                        color: formData.isSellable ? '#15803D' : '#B91C1C'
                      }}
                    >
                      <option value="yes">Yes (Sellable)</option>
                      <option value="no">No (Non-sellable)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingProductId ? 'Update Product Master' : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Dynamic Product Attributes Management Modal (PRODUCT_ATTRIBUTE) ── */}
      {isAttrModalOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 780, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} style={{ color: '#0F766E' }} />
                  PRODUCT ATTRIBUTES
                </div>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  Product: <strong style={{ color: '#0F766E' }}>{selectedProduct.product_name || selectedProduct.name}</strong> ({selectedProduct.product_code || selectedProduct.code})
                </div>
              </div>
              <button onClick={() => setIsAttrModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {(() => {
              const selCatId = selectedProduct.category_id || selectedProduct.categoryId || '';
              const configuredAttrs = getCategoryConfiguredAttributes(selCatId);
              const catRecord = resolveCategoryRecord(selCatId);

              return (
                <form onSubmit={handleSaveProductAttributes} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 8, padding: 12, fontSize: 12, color: '#0F766E', lineHeight: 1.4 }}>
                    <strong>Category Attributes Architecture:</strong> Only attributes configured for category <strong>{catRecord?.category || selCatId}</strong> in Category Master are active here. Values are stored in <code>PRODUCT_ATTRIBUTE</code> (referenced to <code>ATTRIBUTE_MASTER</code>).
                  </div>

                  {configuredAttrs.length === 0 ? (
                    <div style={{
                      padding: '24px 20px',
                      background: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 13,
                      color: '#64748B'
                    }}>
                      No attributes configured for category <strong>{catRecord?.category || selCatId}</strong>. You can configure up to 10 attributes in Category Master.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {configuredAttrs.map(ca => {
                        const attr = ca.attribute;
                        const attrKey = attr.attribute_id;
                        const val = attributeDraftValues[attrKey] || '';
                        const listOpts = LIST_ATTRIBUTE_OPTIONS[attr.attribute_code];

                        return (
                          <div key={attr.attribute_id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                                {attr.attribute_name}
                                {attr.unit_of_measure ? ` (${attr.unit_of_measure})` : ''}
                                {attr.is_required && <span style={{ color: '#DC2626' }}> *</span>}
                              </label>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#E2E8F0', color: '#475569' }}>
                                {attr.data_type}
                              </span>
                            </div>

                            {ca.remark && (
                              <div style={{ fontSize: 11, color: '#0F766E', fontStyle: 'italic', marginBottom: 2 }}>
                                Note: {ca.remark}
                              </div>
                            )}

                            {attr.data_type === 'LIST' ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  type="text"
                                  list={`modal_attr_list_${attr.attribute_id}`}
                                  placeholder={`Select or type ${attr.attribute_name.toLowerCase()}...`}
                                  value={val}
                                  onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.value })}
                                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                                />
                                {listOpts && (
                                  <datalist id={`modal_attr_list_${attr.attribute_id}`}>
                                    {listOpts.map(opt => (
                                      <option key={opt} value={opt} />
                                    ))}
                                  </datalist>
                                )}
                              </div>
                            ) : attr.data_type === 'BOOLEAN' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                                <input
                                  type="checkbox"
                                  id={`modal_attr_check_${attr.attribute_id}`}
                                  checked={val === 'true'}
                                  onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.checked ? 'true' : 'false' })}
                                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                <label htmlFor={`modal_attr_check_${attr.attribute_id}`} style={{ fontSize: 13, color: '#334155', cursor: 'pointer', fontWeight: 600 }}>
                                  {val === 'true' ? 'Enabled (True)' : 'Disabled (False)'}
                                </label>
                              </div>
                            ) : attr.data_type === 'NUMBER' ? (
                              <input
                                type="number"
                                placeholder="e.g. 24"
                                value={val}
                                onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                              />
                            ) : attr.data_type === 'DECIMAL' ? (
                              <input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 15.5"
                                value={val}
                                onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                              />
                            ) : attr.data_type === 'DATE' ? (
                              <input
                                type="date"
                                value={val}
                                onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder={`Enter ${attr.attribute_name.toLowerCase()}...`}
                                value={val}
                                onChange={e => setAttributeDraftValues({ ...attributeDraftValues, [attrKey]: e.target.value })}
                                style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', outline: 'none' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={() => setIsAttrModalOpen(false)}
                      style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                    >
                      Save Attributes
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Quick Add Product Price Modal (PRODUCT_PRICE) ── */}
      {isQuickPriceOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 540, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Add Product Price Rule</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  {selectedProduct.product_name || selectedProduct.name} ({selectedProduct.product_code || selectedProduct.code})
                </p>
              </div>
              <button type="button" onClick={() => setIsQuickPriceOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const pId = selectedProduct.product_id || selectedProduct.id;
              addProductPrice({
                product_price_id: `pp_${Date.now()}`,
                product_id: pId,
                product_manufacturer_id: quickPriceForm.product_manufacturer_id || null,
                customer_segment_id: quickPriceForm.customer_segment_id,
                price_type: quickPriceForm.price_type,
                currency: quickPriceForm.currency,
                unit_price: Number(quickPriceForm.unit_price),
                minimum_quantity: Number(quickPriceForm.minimum_quantity),
                maximum_quantity: quickPriceForm.maximum_quantity ? Number(quickPriceForm.maximum_quantity) : null,
                effective_from: quickPriceForm.effective_from,
                effective_to: quickPriceForm.effective_to || null,
                price_status: quickPriceForm.price_status
              });
              setIsQuickPriceOpen(false);
            }} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Customer Segment *
                  </label>
                  <select
                    required
                    value={quickPriceForm.customer_segment_id}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, customer_segment_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  >
                    {customerSegments.map(s => (
                      <option key={s.customer_segment_id} value={s.customer_segment_id}>
                        {s.segment_name} ({s.segment_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Manufacturer Mapping (Optional)
                  </label>
                  <select
                    value={quickPriceForm.product_manufacturer_id || ''}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, product_manufacturer_id: e.target.value || null })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="">Global / Product Base (All Manufacturers)</option>
                    {(mappings || [])
                      .filter(m => m.product_id === selectedProduct.product_id || m.product_id === selectedProduct.id)
                      .map(m => {
                        const mfg = manufacturers.find(mf => mf.id === m.manufacturer_id || mf.manufacturer_id === m.manufacturer_id);
                        return (
                          <option key={m.id || m.product_manufacturer_id} value={m.id || m.product_manufacturer_id}>
                            {mfg?.manufacturer_name || m.manufacturer_name} ({m.manufacturer_product_code || m.manufacturer_sku})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Price Type
                  </label>
                  <select
                    value={quickPriceForm.price_type}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, price_type: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="FIXED">FIXED</option>
                    <option value="TIERED">TIERED</option>
                    <option value="CONTRACT">CONTRACT</option>
                    <option value="LIST">LIST</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Currency
                  </label>
                  <input
                    type="text"
                    value={quickPriceForm.currency}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, currency: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickPriceForm.unit_price}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, unit_price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Min Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    value={quickPriceForm.minimum_quantity}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, minimum_quantity: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Max Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave blank for unlimited"
                    value={quickPriceForm.maximum_quantity}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, maximum_quantity: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Price Status
                  </label>
                  <select
                    value={quickPriceForm.price_status}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, price_status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickPriceForm.effective_from}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Effective To
                  </label>
                  <input
                    type="date"
                    value={quickPriceForm.effective_to}
                    onChange={e => setQuickPriceForm({ ...quickPriceForm, effective_to: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setIsQuickPriceOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 700 }}>
                  Save Price Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Add Product Tax Modal (PRODUCT_TAX) ── */}
      {isQuickTaxOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Add Product Tax Specification</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  {selectedProduct.product_name || selectedProduct.name} ({selectedProduct.product_code || selectedProduct.code})
                </p>
              </div>
              <button type="button" onClick={() => setIsQuickTaxOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const pId = selectedProduct.product_id || selectedProduct.id;
              addProductTax({
                product_tax_id: `ptax_${Date.now()}`,
                product_id: pId,
                tax_code: quickTaxForm.tax_code,
                tax_rate: Number(quickTaxForm.tax_rate),
                effective_from: quickTaxForm.effective_from,
                effective_to: quickTaxForm.effective_to || null,
                status: quickTaxForm.status
              });
              setIsQuickTaxOpen(false);
            }} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Tax Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSN-3004-90"
                    value={quickTaxForm.tax_code}
                    onChange={e => setQuickTaxForm({ ...quickTaxForm, tax_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Tax Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickTaxForm.tax_rate}
                    onChange={e => setQuickTaxForm({ ...quickTaxForm, tax_rate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={quickTaxForm.status}
                    onChange={e => setQuickTaxForm({ ...quickTaxForm, status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickTaxForm.effective_from}
                    onChange={e => setQuickTaxForm({ ...quickTaxForm, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Effective To
                  </label>
                  <input
                    type="date"
                    value={quickTaxForm.effective_to}
                    onChange={e => setQuickTaxForm({ ...quickTaxForm, effective_to: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setIsQuickTaxOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 700 }}>
                  Save Tax Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Add Product UOM Modal (PRODUCT_UOM) ── */}
      {isQuickUomOpen && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Add UOM Conversion</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  {selectedProduct.product_name || selectedProduct.name} ({selectedProduct.product_code || selectedProduct.code})
                </p>
              </div>
              <button type="button" onClick={() => setIsQuickUomOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const pId = selectedProduct.product_id || selectedProduct.id;
              addProductUom({
                product_uom_id: `puom_${Date.now()}`,
                product_id: pId,
                uom: quickUomForm.uom,
                conversion_factor: Number(quickUomForm.conversion_factor),
                is_base_uom: Boolean(quickUomForm.is_base_uom),
                is_order_uom: Boolean(quickUomForm.is_order_uom),
                is_active: Boolean(quickUomForm.is_active)
              });
              setIsQuickUomOpen(false);
            }} style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Unit of Measure (UOM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Boxes, Carton, Strip"
                    value={quickUomForm.uom}
                    onChange={e => setQuickUomForm({ ...quickUomForm, uom: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    Conversion Factor * (Relative to Base: {selectedProduct.base_uom || selectedProduct.baseUom || 'Unit'})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    placeholder="e.g. 10"
                    value={quickUomForm.conversion_factor}
                    onChange={e => setQuickUomForm({ ...quickUomForm, conversion_factor: parseFloat(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={quickUomForm.is_base_uom}
                      onChange={e => setQuickUomForm({ ...quickUomForm, is_base_uom: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    Is Base UOM
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={quickUomForm.is_order_uom}
                      onChange={e => setQuickUomForm({ ...quickUomForm, is_order_uom: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    Is Order UOM (Purchasable / Sellable Unit)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={quickUomForm.is_active}
                      onChange={e => setQuickUomForm({ ...quickUomForm, is_active: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    Is Active
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setIsQuickUomOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 700 }}>
                  Save UOM Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
