import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Manufacturer, ManufacturerProductMapping } from '../../types';
import { ManufacturerProductCatalogTab } from './ManufacturerProductCatalogTab';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  Package, Search, Filter, Factory, CheckCircle2,
  Info, X, Layers, Clock, AlertCircle, Sparkles, Check, ChevronRight,
  ShieldCheck, Plus, Download, Edit3, ArrowRight, Eye, Tag, AlertTriangle, RefreshCw, Power
} from 'lucide-react';

// ── Client-specified Category → Sub-category hierarchy ───────────────────────
const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Drugs': [
    'Tablets', 'Effervescent Tablets', 'Soft Gelatin Capsule', 'Hard Gelatin Capsule',
    'Liquid Injections', 'Dry Injections', 'I.V.', 'Syrup', 'Suspension',
    'Ointments/Gel/Cream', 'Powder/Sachets', 'Eye/Ear Drops', 'Solutions'
  ],
  'Nutraceuticals/Food': [
    'Tablets', 'Effervescent Tablets', 'Soft Gelatin Capsule', 'Hard Gelatin Capsule',
    'Syrup', 'Suspension', 'Gel/Cream', 'Powder/Sachets', 'Granules'
  ],
  'Cosmetics': [
    'Serums', 'Gel', 'Cream', 'Powder', 'Shampoo', 'Lotions', 'Patches'
  ],
  'Ayur/Herbal': [
    'Syrup', 'Juices', 'Malt', 'Powder', 'Gel', 'Cream', 'Granules'
  ],
  'Veterinary': [],  // No sub-categories provided by client
  'Surgical': [
    'Gloves', 'Kits', 'Canula', 'IV sets', 'Syringes', 'Hospital beds', 'Consumable', 'Equipments'
  ]
};

const ALL_MAIN_CATEGORIES = Object.keys(CATEGORY_SUBCATEGORIES);

export const ProductCatalogModule: React.FC = () => {
  const {
    currentRole,
    products,
    manufacturers,
    mappings,
    addMapping,
    categories,
    subCategories,
    subSubCategories,
    addProductMaster,
    updateProductMaster,
    toggleProductMasterStatus,
    addAuditLog,
    setActiveTab
  } = useApp();

  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');

  // ── ADMIN / PLATFORM CENTRAL PRODUCT MASTER CATALOG ────────────────

  // Buyers may only view products — cannot edit or change status
  const canEditProducts = currentRole !== 'BUYER';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMfgId, setSelectedMfgId] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Interactive Product Detail Drawer State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add / Edit Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [modalFormError, setModalFormError] = useState<string | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    code: '',
    sku: '',
    name: '',
    genericName: '',
    saltCombination: '',
    strength: '',
    dosageForm: 'Tablets',
    subCategory: 'Tablets',
    subSubCategory: '',
    subSubCategoryId: '',
    packSize: '10 × 1 × 10 Strip',
    uom: 'Units',
    category: 'Drugs',
    tagsStr: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
    // Manufacturer Mapping (Optional)
    manufacturerId: '',
    mfgProductCode: '',
    moq: 1000,
    leadTimeDays: 14,
    certifications: 'WHO-GMP, CDSCO Applicable'
  });

  // Active Categories from Category Master (strictly active)
  const activeCategoriesList = useMemo(() => {
    const fromMaster = (categories || [])
      .filter(c => c.status === 'Active')
      .map(c => c.name);
    if (fromMaster.length > 0) {
      return Array.from(new Set(fromMaster));
    }
    return ALL_MAIN_CATEGORIES;
  }, [categories]);

  // ── Available Sub-Categories strictly constrained to the selected category (ACTIVE ONLY) ──
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'ALL') return [];
    const catNameLower = selectedCategory.toLowerCase().trim();
    const liveSubs = (subCategories || [])
      .filter(s =>
        s.status === 'Active' &&
        (s.parentCategory.toLowerCase().trim() === catNameLower ||
        (catNameLower.includes('nutraceutical') && s.parentCategory.toLowerCase().includes('nutraceutical')))
      )
      .map(s => s.name);
    if (liveSubs.length > 0) return Array.from(new Set(liveSubs));
    return CATEGORY_SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory, subCategories]);

  // Dynamic Sub-Sub-Categories available for selected sub-category filter (ACTIVE ONLY)
  const availableSubSubCategories = useMemo(() => {
    if (selectedSubCategory === 'ALL') return [];
    const subNameLower = selectedSubCategory.toLowerCase().trim();
    return (subSubCategories || []).filter(ss =>
      ss.status === 'Active' &&
      (ss.parentSubCategory || (subCategories || []).find(sc => sc.id === ss.subCategoryId)?.name || '').toLowerCase().trim() === subNameLower
    );
  }, [selectedSubCategory, subSubCategories, subCategories]);

  // Sub-categories available for product creation/editing modal (strictly ACTIVE for selected category)
  const formAvailableSubCategories = useMemo(() => {
    if (!formData.category) return [];
    const catNameLower = formData.category.toLowerCase().trim();
    const matchedCategory = (categories || []).find(c => c.name.toLowerCase().trim() === catNameLower);
    const liveSubs = (subCategories || [])
      .filter(s =>
        s.status === 'Active' &&
        (
          (matchedCategory && s.categoryId === matchedCategory.id) ||
          s.parentCategory.toLowerCase().trim() === catNameLower ||
          (catNameLower.includes('nutraceutical') && s.parentCategory.toLowerCase().includes('nutraceutical'))
        )
      )
      .map(s => s.name);
    if (liveSubs.length > 0) return Array.from(new Set(liveSubs));
    return CATEGORY_SUBCATEGORIES[formData.category] || [];
  }, [formData.category, categories, subCategories]);

  // Sub-sub-categories available for product modal (strictly ACTIVE for selected sub-category)
  const formAvailableSubSubCategories = useMemo(() => {
    const currentSub = (formData.subCategory || formData.dosageForm || '').toLowerCase().trim();
    if (!currentSub) return [];
    const matchedSub = (subCategories || []).find(
      s => s.name.toLowerCase().trim() === currentSub &&
      (!formData.category || s.parentCategory.toLowerCase().trim() === formData.category.toLowerCase().trim())
    );
    return (subSubCategories || []).filter(ss =>
      ss.status === 'Active' &&
      (
        (matchedSub && ss.subCategoryId === matchedSub.id) ||
        (ss.parentSubCategory && ss.parentSubCategory.toLowerCase().trim() === currentSub)
      )
    );
  }, [formData.subCategory, formData.dosageForm, formData.category, subCategories, subSubCategories]);

  // Filtered Central Product List Calculation
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.genericName || '').toLowerCase().includes(q) ||
        (p.saltCombination || '').toLowerCase().includes(q) ||
        (p.strength || '').toLowerCase().includes(q) ||
        (p.dosageForm || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.subSubCategory || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSubCat =
        selectedSubCategory === 'ALL' ||
        (p.dosageForm && p.dosageForm.toLowerCase() === selectedSubCategory.toLowerCase()) ||
        ((p as any).subCategory && (p as any).subCategory.toLowerCase() === selectedSubCategory.toLowerCase());
      const matchesSubSubCat =
        selectedSubSubCategory === 'ALL' ||
        (p.subSubCategory && p.subSubCategory.toLowerCase() === selectedSubSubCategory.toLowerCase()) ||
        (p.subSubCategoryId && p.subSubCategoryId === selectedSubSubCategory);
      const matchesStatus = selectedStatus === 'ALL' || (p.status || 'Active') === selectedStatus;

      // Filter by mapped manufacturer
      let matchesMfg = true;
      if (selectedMfgId !== 'ALL') {
        const pMappings = (mappings || []).filter(m => m.productId === p.id);
        matchesMfg = pMappings.some(m => m.manufacturerId === selectedMfgId);
      }

      // Filter by Tag
      let matchesTag = true;
      if (selectedTag !== 'ALL') {
        matchesTag = !!p.tags && p.tags.includes(selectedTag);
      }

      return matchesSearch && matchesCat && matchesSubCat && matchesSubSubCat && matchesStatus && matchesMfg && matchesTag;
    });
  }, [products, mappings, searchTerm, selectedCategory, selectedSubCategory, selectedSubSubCategory, selectedStatus, selectedMfgId, selectedTag]);

  // Unique Categories & Tags options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    (categories || []).forEach(c => { if (c.status === 'Active') set.add(c.name); });
    (products || []).forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [categories, products]);

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    const nextCodeNum = products.length + 1;
    const defaultCat = (categories || []).find(c => c.status === 'Active')?.name || 'Drugs';
    const defaultSub = (CATEGORY_SUBCATEGORIES[defaultCat] || [])[0] || '';
    setFormData({
      code: `PRD001${nextCodeNum < 10 ? '00' + nextCodeNum : nextCodeNum < 100 ? '0' + nextCodeNum : nextCodeNum}`,
      sku: '',
      name: '',
      genericName: '',
      saltCombination: '',
      strength: '',
      dosageForm: defaultSub,
      subCategory: defaultSub,
      subSubCategory: '',
      subSubCategoryId: '',
      packSize: '10 × 1 × 10 Strip',
      uom: 'Units',
      category: defaultCat,
      tagsStr: '',
      description: '',
      status: 'Active',
      manufacturerId: '',
      mfgProductCode: '',
      moq: 1000,
      leadTimeDays: 14,
      certifications: 'WHO-GMP, CDSCO Applicable'
    });
    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProductId(prd.id);
    const existingMapping = (mappings || []).find(m => m.productId === prd.id);
    const prdSub = (prd as any).subCategory || prd.dosageForm || '';
    setFormData({
      code: prd.code,
      sku: prd.sku || prd.code,
      name: prd.name,
      genericName: prd.genericName,
      saltCombination: prd.saltCombination || prd.composition || '',
      strength: prd.strength || '',
      dosageForm: prd.dosageForm || prdSub,
      subCategory: prdSub,
      subSubCategory: prd.subSubCategory || '',
      subSubCategoryId: prd.subSubCategoryId || '',
      packSize: prd.packSize,
      uom: prd.uom || 'Units',
      category: prd.category || categories[0]?.name || 'Drugs',
      tagsStr: prd.brandNames ? prd.brandNames.join(', ') : 'Tablet, OTC',
      description: prd.description || '',
      status: (prd.status as any) || 'Active',
      manufacturerId: existingMapping?.manufacturerId || '',
      mfgProductCode: existingMapping?.mfgProductCode || prd.code,
      moq: existingMapping?.moq || prd.moq || 1000,
      leadTimeDays: existingMapping?.standardLeadTimeDays || 14,
      certifications: existingMapping?.productSpecificCertifications ? existingMapping.productSpecificCertifications.join(', ') : 'WHO-GMP, CDSCO Applicable'
    });
    setModalFormError(null);
    setIsAddModalOpen(true);
  };

  // Save Central Product Handler
  const handleSaveProductMaster = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Classification Hierarchy Validation
    if (!formData.category.trim()) { setModalFormError('Category is mandatory.'); return; }
    if (formAvailableSubCategories.length > 0 && !formData.subCategory.trim() && !formData.dosageForm.trim()) {
      setModalFormError('Sub-Category is mandatory for the selected Category.');
      return;
    }

    // Verify combination integrity
    const selectedSub = formData.subCategory.trim() || formData.dosageForm.trim();
    if (selectedSub && formAvailableSubCategories.length > 0 && !formAvailableSubCategories.includes(selectedSub)) {
      setModalFormError(`Sub-Category "${selectedSub}" does not belong to Category "${formData.category}". Please choose a valid Sub-Category.`);
      return;
    }
    if (formData.subSubCategory.trim() && formAvailableSubSubCategories.length > 0) {
      const isValidSubSub = formAvailableSubSubCategories.some(s => s.name.toLowerCase() === formData.subSubCategory.toLowerCase());
      if (!isValidSubSub) {
        setModalFormError(`Sub-Sub-Category "${formData.subSubCategory}" is invalid for Sub-Category "${selectedSub}".`);
        return;
      }
    }

    // 2. Product Details Validation
    if (!formData.code.trim()) { setModalFormError('Product Code is mandatory.'); return; }
    if (!formData.name.trim()) { setModalFormError('Product Name is mandatory.'); return; }
    if (!formData.genericName.trim()) { setModalFormError('Generic Name is mandatory.'); return; }
    if (!formData.saltCombination.trim()) { setModalFormError('Salt Combination is mandatory.'); return; }
    if (!formData.strength.trim()) { setModalFormError('Strength is mandatory.'); return; }
    if (!formData.packSize.trim()) { setModalFormError('Pack Size is mandatory.'); return; }
    if (!formData.uom.trim()) { setModalFormError('UOM is mandatory.'); return; }

    // Unique Product Code Check
    const isDuplicateCode = (products || []).some(p =>
      p.id !== editingProductId &&
      p.code.toLowerCase().trim() === formData.code.toLowerCase().trim()
    );

    if (isDuplicateCode) {
      setModalFormError(`Product Code "${formData.code}" already exists. Product Code must be unique across the central master catalog.`);
      return;
    }

    const tagsArray = formData.tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    const finalSub = formData.subCategory.trim() || formData.dosageForm.trim();
    const finalDosage = formData.dosageForm.trim() || finalSub || 'Standard';

    if (editingProductId) {
      // Edit existing product master
      updateProductMaster(editingProductId, {
        code: formData.code.trim().toUpperCase(),
        sku: (formData.sku || formData.code).trim().toUpperCase(),
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        saltCombination: formData.saltCombination.trim(),
        composition: formData.saltCombination.trim(),
        strength: formData.strength.trim(),
        dosageForm: finalDosage,
        subCategory: finalSub,
        subSubCategory: formData.subSubCategory ? formData.subSubCategory.trim() : undefined,
        subSubCategoryId: formData.subSubCategoryId ? formData.subSubCategoryId : undefined,
        packSize: formData.packSize.trim(),
        uom: formData.uom,
        category: formData.category,
        brandNames: tagsArray,
        description: formData.description.trim(),
        status: formData.status
      });
      addAuditLog('EDIT_CENTRAL_PRODUCT', `Updated Central Product Master: ${formData.name} (${formData.code})`);
    } else {
      // Create new central product master
      const newPrdId = `p_${Date.now()}`;
      const newPrd: Product = {
        id: newPrdId,
        code: formData.code.trim().toUpperCase(),
        sku: (formData.sku || formData.code).trim().toUpperCase(),
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        saltCombination: formData.saltCombination.trim(),
        composition: formData.saltCombination.trim(),
        strength: formData.strength.trim(),
        dosageForm: finalDosage,
        subCategory: finalSub,
        subSubCategory: formData.subSubCategory ? formData.subSubCategory.trim() : undefined,
        subSubCategoryId: formData.subSubCategoryId ? formData.subSubCategoryId : undefined,
        packSize: formData.packSize.trim(),
        uom: formData.uom,
        category: formData.category,
        brandNames: tagsArray,
        description: formData.description.trim(),
        status: formData.status,
        manufacturersCount: formData.manufacturerId ? 1 : 0,
        moq: formData.moq || 1000,
        basePrice: 100,
        regulatoryInfo: ['WHO-GMP Required', 'CDSCO Applicable']
      };
      addProductMaster(newPrd);

      // If manufacturer mapping was filled, add mapping
      if (formData.manufacturerId) {
        const mfg = (manufacturers || []).find(m => m.id === formData.manufacturerId);
        const certs = formData.certifications.split(',').map(c => c.trim()).filter(Boolean);
        const newMapping: ManufacturerProductMapping = {
          productId: newPrdId,
          manufacturerId: formData.manufacturerId,
          manufacturerCode: mfg?.code || 'MFG-GEN',
          manufacturerName: mfg?.companyName || mfg?.name || 'Assigned Manufacturer',
          mfgProductCode: formData.mfgProductCode.trim() || newPrd.code,
          moq: formData.moq || 1000,
          standardLeadTimeDays: formData.leadTimeDays || 14,
          packaging: formData.packSize.trim(),
          productSpecificCertifications: certs.length > 0 ? certs : ['WHO-GMP', 'CDSCO Applicable'],
          status: 'Active'
        };
        addMapping(newMapping);
      }

      addAuditLog('CREATE_CENTRAL_PRODUCT', `Created Central Product Master: ${formData.name} (${formData.code})`);
    }

    setIsAddModalOpen(false);
  };

  // Toggle Product Status (Activate / Deactivate)
  const handleToggleStatus = (prd: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = prd.status === 'Inactive' ? 'Active' : 'Inactive';
    toggleProductMasterStatus(prd.id);
    addAuditLog('TOGGLE_PRODUCT_STATUS', `Set Central Product ${prd.code} status to ${newStatus}`);
    if (selectedProduct && selectedProduct.id === prd.id) {
      setSelectedProduct(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Mapped manufacturers for selected product drawer
  const mappedItemsForSelected = useMemo(() => {
    if (!selectedProduct) return [];
    const pMappings = (mappings || []).filter(m => m.productId === selectedProduct.id);
    return pMappings.map(map => {
      const mfg = (manufacturers || []).find(m => m.id === map.manufacturerId);
      return {
        mapping: map,
        manufacturer: mfg || {
          id: map.manufacturerId,
          code: map.manufacturerCode,
          name: map.manufacturerName,
          companyName: map.manufacturerName,
          city: 'Hyderabad',
          state: 'Telangana'
        }
      };
    });
  }, [selectedProduct, mappings, manufacturers]);

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
    const defaultMfg = manufacturers[0];
    return defaultMfg?.companyName || defaultMfg?.name || 'SunBio LifeSciences Ltd.';
  };

  // Helper to compute Product-Level Margin Configuration status across manufacturers
  const getProductMarginSummary = (prdId: string) => {
    const pMaps = (mappings || []).filter(m => m.productId === prdId);
    const mfgCount = pMaps.length;
    if (mfgCount === 0) {
      return {
        count: 0,
        status: 'Pending Configuration' as const,
        label: 'No Mfg Mapped',
        badgeColor: '#64748B',
        bgColor: '#F1F5F9',
        borderColor: '#CBD5E1'
      };
    }
    const configured = pMaps.filter(m => (m.marginValue !== undefined && m.marginValue !== null && m.marginValue > 0) || m.marginStatus === 'Active');
    if (configured.length === mfgCount) {
      return {
        count: mfgCount,
        status: 'Configured' as const,
        label: `Configured (${configured.length}/${mfgCount})`,
        badgeColor: '#15803D',
        bgColor: '#DCFCE7',
        borderColor: '#86EFAC'
      };
    }
    if (configured.length > 0) {
      return {
        count: mfgCount,
        status: 'Partially Configured' as const,
        label: `Partial (${configured.length}/${mfgCount})`,
        badgeColor: '#D97706',
        bgColor: '#FEF3C7',
        borderColor: '#FCD34D'
      };
    }
    return {
      count: mfgCount,
      status: 'Pending Configuration' as const,
      label: `Pending (${mfgCount} Mfg)`,
      badgeColor: '#B45309',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A'
    };
  };

  // If viewed by Manufacturer role, render "My Product Catalog" for the logged-in manufacturer
  if (currentRole === 'SUPPLIER') {
    const loggedInMfg = manufacturers[0];
    return <ManufacturerProductCatalogTab manufacturer={loggedInMfg} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Enterprise Header ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(15, 118, 110, 0.10)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={24} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>MASTER DATA / CENTRAL PRODUCT MASTER</div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>PRODUCT CATALOG</h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Centralized pharmaceutical product master used across the FactoryGrid platform.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('category-master')}
              title="Navigate to Category Master & Sub-Category Management"
              style={{ padding: '10px 16px', borderRadius: 8, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Layers size={16} /> Category Master & Sub-Categories →
            </button>
          )}

          {canEditProducts && (
            <button
              onClick={handleOpenAddModal}
              style={{ padding: '10px 20px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
            >
              <Plus size={16} /> + Add Product
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Multi-Filter Controls Bar ──────────────────────── */}
      <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
          
          {/* Main Search Input — supports full text and first 4-5 character prefix search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', flex: '1 1 260px' }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by product code, name, generic name, or first 4–5 characters..."
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

          {/* Category Filter — 6 client-specified main categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory('ALL');
                setSelectedSubSubCategory('ALL');
              }}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Categories</option>
              {ALL_MAIN_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Sub-Category Filter — strictly constrained to selected category */}
          {selectedCategory !== 'ALL' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>Sub-Category:</span>
              <select
                value={selectedSubCategory}
                onChange={e => {
                  setSelectedSubCategory(e.target.value);
                  setSelectedSubSubCategory('ALL');
                }}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#F0FDFA', border: '1px solid #0F766E', borderRadius: 6, color: '#0F766E', fontWeight: 700, cursor: 'pointer' }}
              >
                <option value="ALL">All {selectedCategory} Sub-Categories ({availableSubCategories.length})</option>
                {availableSubCategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Sub-Sub-Category Filter — strictly constrained to selected subcategory */}
          {selectedSubCategory !== 'ALL' && availableSubSubCategories.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7' }}>Sub-Sub:</span>
              <select
                value={selectedSubSubCategory}
                onChange={e => setSelectedSubSubCategory(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#F0F9FF', border: '1px solid #0284C7', borderRadius: 6, color: '#0369A1', fontWeight: 700, cursor: 'pointer' }}
              >
                <option value="ALL">All Sub-Sub ({availableSubSubCategories.length})</option>
                {availableSubSubCategories.map(ss => (
                  <option key={ss.id} value={ss.name}>{ss.name}</option>
                ))}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Manufacturer Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Manufacturer:</span>
            <select
              value={selectedMfgId}
              onChange={e => setSelectedMfgId(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Manufacturers</option>
              {(manufacturers || []).map(m => (
                <option key={m.id} value={m.id}>{m.companyName || m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Informative Notice & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#475569', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} style={{ color: '#0F766E' }} />
            <span>Central Product Master is the single source of truth for product identity. Manufacturers map to these records.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Showing <strong style={{ color: '#0F766E' }}>{filteredProducts.length}</strong> central products</span>
            <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
          </div>
        </div>
      </div>

      {/* ── Admin Central Product Master Table / Cards ──────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        {displayMode === 'CARD' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', gridColumn: '1 / -1' }}>
                No products found matching your search and filter criteria.
              </div>
            ) : (
              filteredProducts.map(p => {
                const assignedMfg = (manufacturers || []).find(m => m.id === p.preferredManufacturerId);
                const isActive = p.status === 'ACTIVE';
                const marginSummary = getProductMarginSummary(p.id);

                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18,
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 10, marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {p.productCode}
                          </span>
                          <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                            {p.brandName}
                          </h3>
                        </div>

                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#F1F5F9',
                          color: isActive ? '#15803D' : '#64748B',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #CBD5E1'
                        }}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic', marginBottom: 6 }}>
                        {p.genericName}
                      </div>

                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div>Composition: <strong style={{ color: '#0F172A' }}>{p.composition || p.saltCombination || 'Standard Formulation'}</strong></div>
                        <div>Form &amp; Pack: <strong>{p.dosageForm || 'Tablet'} ({p.packSize || '10x10 Strips'})</strong></div>
                        <div>Category: <span style={{ padding: '2px 6px', background: '#F1F5F9', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{p.category || 'General'}</span>{p.subSubCategory && <span style={{ padding: '2px 6px', background: '#F0F9FF', color: '#0369A1', borderRadius: 4, fontSize: 10.5, fontWeight: 700, border: '1px solid #BAE6FD', marginLeft: 4 }}>{p.subSubCategory}</span>}</div>
                        {assignedMfg && (
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, color: '#0F766E', fontWeight: 700, fontSize: 11.5 }}>
                            <Factory size={13} /> {assignedMfg.companyName || assignedMfg.name}
                          </div>
                        )}
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '6px 8px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                            {marginSummary.count} Mapped Mfg{marginSummary.count === 1 ? '' : 's'}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            background: marginSummary.bgColor, color: marginSummary.badgeColor,
                            border: `1px solid ${marginSummary.borderColor}`
                          }}>
                            ● {marginSummary.status}
                          </span>
                        </div>
                        {currentRole === 'ADMIN' && (
                          <button
                            onClick={() => setActiveTab('margin-engine')}
                            style={{
                              background: 'none', border: 'none', padding: '3px 0 0', fontSize: 11,
                              color: '#0F766E', fontWeight: 700, cursor: 'pointer', textAlign: 'left', textDecoration: 'underline'
                            }}
                          >
                            Configure Margin in Engine →
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => setSelectedProduct(p)}
                        style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F766E', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                      {canEditProducts && (
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          style={{ padding: '6px 12px', background: '#0F766E', border: 'none', borderRadius: 6, color: '#FFFFFF', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
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
          <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>PRODUCT CODE</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>PRODUCT NAME</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>GENERIC NAME</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SALT COMBINATION</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 85 }}>STRENGTH</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>DOSAGE FORM</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>PACK SIZE</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 65 }}>UOM</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 115 }}>CATEGORY</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 145 }}>MANUFACTURER</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 135 }}>MARGIN STATUS</th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 80 }}>STATUS</th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 130 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Package size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No central products found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create a standardized product master record to begin manufacturer mapping.
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add Product
                  </button>
                </td>
              </tr>
            ) : (
              filteredProducts.map((prd) => {
                const statusStr = prd.status || 'Active';
                const mfgName = getManufacturerName(prd.id);
                const marginSummary = getProductMarginSummary(prd.id);
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
                      {prd.code}
                    </td>

                    {/* 2. PRODUCT NAME */}
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{prd.name}</div>
                    </td>

                    {/* 3. GENERIC NAME */}
                    <td style={{ padding: '12px 10px', fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                      {prd.genericName}
                    </td>

                    {/* 4. SALT COMBINATION */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prd.saltCombination}>
                      {prd.saltCombination}
                    </td>

                    {/* 5. STRENGTH */}
                    <td style={{ padding: '12px 10px', fontSize: 12.5, fontWeight: 800, color: '#0F766E', whiteSpace: 'nowrap' }}>
                      {prd.strength}
                    </td>

                    {/* 6. DOSAGE FORM */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                        {prd.dosageForm}
                      </span>
                    </td>

                    {/* 7. PACK SIZE */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontWeight: 600, maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prd.packSize}>
                      {prd.packSize}
                    </td>

                    {/* 8. UOM */}
                    <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {prd.uom || 'Units'}
                    </td>

                    {/* 9. CATEGORY */}
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                      <div>{prd.category}</div>
                      {prd.subSubCategory && (
                        <div style={{ fontSize: 10.5, color: '#0284C7', fontWeight: 700, marginTop: 2 }}>
                          ↳ {prd.subSubCategory}
                        </div>
                      )}
                    </td>

                    {/* 10. MANUFACTURER */}
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 700, color: '#0F766E', maxWidth: 160 }} title={mfgName}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
                        <Factory size={13} style={{ color: '#0F766E', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mfgName}</span>
                      </div>
                    </td>

                    {/* 11. MARGIN STATUS & QUICK LINK */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: marginSummary.bgColor, color: marginSummary.badgeColor,
                          border: `1px solid ${marginSummary.borderColor}`,
                          display: 'inline-flex', alignItems: 'center', gap: 4, width: 'fit-content'
                        }}>
                          ● {marginSummary.label}
                        </span>
                        {currentRole === 'ADMIN' && (
                          <button
                            onClick={() => setActiveTab('margin-engine')}
                            style={{
                              background: 'none', border: 'none', padding: 0, fontSize: 10.5,
                              color: '#0F766E', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                              textDecoration: 'underline'
                            }}
                            title="Open Margin Engine to configure product margins"
                          >
                            Configure Margin →
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 12. STATUS */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                        background: statusStr === 'Active' ? '#DCFCE7' : '#F3F4F6',
                        color: statusStr === 'Active' ? '#15803D' : '#4B5563',
                        border: statusStr === 'Active' ? '1px solid #86EFAC' : '1px solid #D1D5DB'
                      }}>
                        {statusStr}
                      </span>
                    </td>

                    {/* 13. ACTIONS */}
                    <td onClick={e => e.stopPropagation()} style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                        <button
                          onClick={() => setSelectedProduct(prd)}
                          style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, background: 'rgba(15, 118, 110, 0.08)', border: '1px solid rgba(15, 118, 110, 0.25)', color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        >
                          <Eye size={12} /> View
                        </button>
                        {canEditProducts && (
                          <button
                            onClick={(e) => handleOpenEditModal(prd, e)}
                            style={{ padding: '4px 7px', fontSize: 11, fontWeight: 600, borderRadius: 6, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title="Edit Product Master"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        {canEditProducts && (
                          <button
                            onClick={(e) => handleToggleStatus(prd, e)}
                            style={{ padding: '4px 7px', fontSize: 11, fontWeight: 600, borderRadius: 6, background: statusStr === 'Active' ? '#FEE2E2' : '#DCFCE7', border: statusStr === 'Active' ? '1px solid #FCA5A5' : '1px solid #86EFAC', color: statusStr === 'Active' ? '#B91C1C' : '#15803D', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                            title={statusStr === 'Active' ? 'Deactivate Product' : 'Activate Product'}
                          >
                            <Power size={12} />
                          </button>
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

      {/* ── PRODUCT MASTER DETAIL DRAWER ─────────────────────── */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelectedProduct(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, height: '100%', background: '#FFFFFF', borderLeft: '1px solid #CBD5E1', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)' }}>
            
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace' }}>{selectedProduct.code}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: selectedProduct.status === 'Inactive' ? '#F3F4F6' : '#DCFCE7', color: selectedProduct.status === 'Inactive' ? '#4B5563' : '#15803D', border: selectedProduct.status === 'Inactive' ? '1px solid #D1D5DB' : '1px solid #86EFAC' }}>
                    {selectedProduct.status || 'Active'}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{selectedProduct.name}</h2>
              </div>
              <button onClick={() => setSelectedProduct(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* PRODUCT INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  PRODUCT INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Product Code:</span> <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block' }}>{selectedProduct.code}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Product Name:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.name}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Generic Name:</span> <strong style={{ color: '#1E293B', display: 'block' }}>{selectedProduct.genericName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Category:</span> <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.category}</strong></div>
                  {selectedProduct.subSubCategory && (
                    <div><span style={{ color: '#64748B' }}>Sub-Sub-Category:</span> <strong style={{ color: '#0284C7', display: 'block' }}>{selectedProduct.subSubCategory}</strong></div>
                  )}
                </div>

                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tags</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {selectedProduct.tags.map(t => (
                        <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#E2E8F0', color: '#334155' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COMPOSITION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  COMPOSITION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Salt Combination:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.saltCombination}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F766E', display: 'block' }}>{selectedProduct.strength}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Dosage Form:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.dosageForm}</strong></div>
                  {selectedProduct.subSubCategory && (
                    <div><span style={{ color: '#64748B' }}>Sub-Sub-Category:</span> <strong style={{ color: '#0284C7', display: 'block' }}>{selectedProduct.subSubCategory}</strong></div>
                  )}
                </div>
              </div>

              {/* PACKAGING */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em' }}>
                  PACKAGING
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#334155', display: 'block' }}>{selectedProduct.packSize}</strong></div>
                  <div><span style={{ color: '#64748B' }}>UOM:</span> <strong style={{ color: '#0F172A', display: 'block' }}>{selectedProduct.uom || 'Units'}</strong></div>
                </div>
              </div>

              {/* DESCRIPTION */}
              {selectedProduct.description && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 6, letterSpacing: '0.06em' }}>
                    DESCRIPTION
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {selectedProduct.description}
                  </p>
                </div>
              )}

              {/* MANUFACTURER MAPPINGS */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Factory size={15} /> MANUFACTURER MAPPINGS ({mappedItemsForSelected.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mappedItemsForSelected.length === 0 ? (
                    <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                      No manufacturer mappings recorded for this central product master yet.
                    </div>
                  ) : (
                    mappedItemsForSelected.map(({ mapping, manufacturer }) => {
                      const isConfigured = (mapping.marginValue !== undefined && mapping.marginValue !== null && mapping.marginValue > 0) || mapping.marginStatus === 'Active';
                      const marginDisplay = isConfigured
                        ? (mapping.marginType === 'FIXED_RATE' ? `₹${(mapping.marginValue || mapping.marginRate || 0).toFixed(2)}/unit (Fixed)` : `${mapping.marginValue || 10}% (Percentage)`)
                        : 'Pending Admin Configuration';

                      return (
                        <div
                          key={`${mapping.productId}_${mapping.manufacturerId}`}
                          style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                        >
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                              {manufacturer.companyName || manufacturer.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              Mfg Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{mapping.mfgProductCode}</strong> · MOQ: {mapping.moq.toLocaleString()} Units · Lead: {mapping.standardLeadTimeDays} Days
                            </div>
                            <div style={{ fontSize: 11.5, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#475569', fontWeight: 600 }}>Product Margin:</span>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                                background: isConfigured ? '#DCFCE7' : '#FEF3C7',
                                color: isConfigured ? '#15803D' : '#B45309',
                                border: isConfigured ? '1px solid #86EFAC' : '1px solid #FDE68A'
                              }}>
                                {isConfigured ? `● ${marginDisplay}` : '○ Pending Configuration'}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                              Active
                            </span>
                            {currentRole === 'ADMIN' && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(null);
                                  setActiveTab('margin-engine');
                                }}
                                style={{ fontSize: 11, color: '#0F766E', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Configure Margin →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
                    style={{ padding: '9px 16px', borderRadius: 6, border: selectedProduct.status === 'Inactive' ? '1px solid #86EFAC' : '1px solid #FCA5A5', background: selectedProduct.status === 'Inactive' ? '#DCFCE7' : '#FEE2E2', color: selectedProduct.status === 'Inactive' ? '#15803D' : '#B91C1C', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Power size={14} /> {selectedProduct.status === 'Inactive' ? 'Activate Product' : 'Deactivate Product'}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic' }}>
                  View only — product management is restricted to manufacturers.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── CREATE / EDIT CENTRAL PRODUCT MODAL ────────────────── */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsAddModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingProductId ? 'EDIT CENTRAL PRODUCT' : 'CREATE CENTRAL PRODUCT'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Create a standardized product master record.
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

            <form onSubmit={handleSaveProductMaster} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* SECTION 1: CLASSIFICATION HIERARCHY */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} /> 1. CLASSIFICATION HIERARCHY
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                {/* 1. Category */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={e => {
                      const newCat = e.target.value;
                      setFormData({
                        ...formData,
                        category: newCat,
                        subCategory: '',
                        dosageForm: '',
                        subSubCategory: '',
                        subSubCategoryId: ''
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
                  >
                    <option value="" disabled>-- Select Category * --</option>
                    {activeCategoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Sub-Category */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Sub-Category *
                  </label>
                  <select
                    required={formAvailableSubCategories.length > 0}
                    disabled={!formData.category || formAvailableSubCategories.length === 0}
                    value={formData.subCategory || formData.dosageForm}
                    onChange={e => {
                      const newSub = e.target.value;
                      setFormData({
                        ...formData,
                        subCategory: newSub,
                        dosageForm: newSub,
                        subSubCategory: '',
                        subSubCategoryId: ''
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: (!formData.category || formAvailableSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                  >
                    {!formData.category ? (
                      <option value="">-- Select Category First --</option>
                    ) : formAvailableSubCategories.length === 0 ? (
                      <option value="">Not Applicable (No sub-categories)</option>
                    ) : (
                      <>
                        <option value="">-- Select Sub-Category * --</option>
                        {formAvailableSubCategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 3. Sub-Sub-Category */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Sub-Sub-Category <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <select
                    disabled={(!formData.subCategory && !formData.dosageForm) || formAvailableSubSubCategories.length === 0}
                    value={formData.subSubCategory}
                    onChange={e => {
                      const val = e.target.value;
                      const matched = formAvailableSubSubCategories.find(s => s.name === val);
                      setFormData({
                        ...formData,
                        subSubCategory: val,
                        subSubCategoryId: matched?.id || ''
                      });
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: ((!formData.subCategory && !formData.dosageForm) || formAvailableSubSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                  >
                    {(!formData.subCategory && !formData.dosageForm) ? (
                      <option value="">-- Select Sub-Category First --</option>
                    ) : formAvailableSubSubCategories.length === 0 ? (
                      <option value="">Not Applicable (None for this Sub-Category)</option>
                    ) : (
                      <>
                        <option value="">-- Select Sub-Sub-Category (Optional) --</option>
                        {formAvailableSubSubCategories.map(ss => (
                          <option key={ss.id} value={ss.name}>{ss.name} ({ss.code})</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* SECTION 2: PRODUCT INFORMATION */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Package size={14} /> 2. PRODUCT INFORMATION
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD001001"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>SKU *</label>
                  <input
                    type="text"
                    placeholder="e.g. PCM-650"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg Tablets"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Generic Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol"
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Salt Combination *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol IP 650mg"
                    value={formData.saltCombination}
                    onChange={e => setFormData({ ...formData, saltCombination: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Strength *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 625mg"
                    value={formData.strength}
                    onChange={e => setFormData({ ...formData, strength: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dosage Form</label>
                  <input
                    type="text"
                    placeholder="e.g. Tablets"
                    value={formData.dosageForm}
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Pack Size *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10 × 1 × 10 Strip"
                    value={formData.packSize}
                    onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>UOM *</label>
                  <select
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Units">Units</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Strips">Strips</option>
                    <option value="Vials">Vials</option>
                    <option value="Bottles">Bottles</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Standardized product master notes..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Tablet, OTC, Antibiotic"
                    value={formData.tagsStr}
                    onChange={e => setFormData({ ...formData, tagsStr: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: MANUFACTURER MAPPING (OPTIONAL) */}
              <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Factory size={14} /> 3. MANUFACTURER MAPPING (OPTIONAL)
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Assigned Manufacturer
                    </label>
                    <select
                      value={formData.manufacturerId}
                      onChange={e => setFormData({ ...formData, manufacturerId: e.target.value, mfgProductCode: formData.mfgProductCode || formData.code })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                    >
                      <option value="">-- None / Map Later in Product Drawer --</option>
                      {(manufacturers || []).map(m => (
                        <option key={m.id} value={m.id}>{m.companyName || m.name} ({m.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      Manufacturer Product Code
                    </label>
                    <input
                      type="text"
                      disabled={!formData.manufacturerId}
                      placeholder="e.g. SUN-PCM650"
                      value={formData.mfgProductCode}
                      onChange={e => setFormData({ ...formData, mfgProductCode: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none', background: !formData.manufacturerId ? '#F1F5F9' : '#FFFFFF' }}
                    />
                  </div>
                </div>

                {formData.manufacturerId && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          MOQ (Minimum Order Qty)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.moq}
                          onChange={e => setFormData({ ...formData, moq: Number(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Standard Lead Time (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.leadTimeDays}
                          onChange={e => setFormData({ ...formData, leadTimeDays: Number(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                        Certifications (comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="WHO-GMP, CDSCO Form 25/28, ISO 9001"
                        value={formData.certifications}
                        onChange={e => setFormData({ ...formData, certifications: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* SECTION 4: SAVE PRODUCT */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}>
                  {editingProductId ? 'Update Product Master' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
