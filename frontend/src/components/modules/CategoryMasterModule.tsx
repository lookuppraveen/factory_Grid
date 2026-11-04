import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductType, Category, LifecycleStatus, ProductTypeAttributeDraft } from '../../types';
import { catalogApi } from '../../services/catalogApi';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';
import {
  FolderTree, Layers, Search, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, X, Power, ChevronRight, ChevronDown,
  Sparkles, Table, ListTree, Eye, Sliders, Tag, Check, RefreshCw
} from 'lucide-react';

export const CategoryMasterModule: React.FC = () => {
  const {
    productTypes,
    addProductType,
    updateProductType,
    deleteProductType,
    toggleProductTypeStatus,
    unifiedCategories,
    addUnifiedCategory,
    updateUnifiedCategory,
    deleteUnifiedCategory,
    toggleUnifiedCategoryStatus,
    attributeMasters,
    productTypeAttributes,
    getProductTypeAttributes,
    getProductTypeConfiguredAttributes,
    addProductTypeAttribute,
    updateProductTypeAttribute,
    removeProductTypeAttribute,
    bulkSaveProductTypeAttributes,
    refreshProductTypeAttributes,
    setActiveTab
  } = useApp();

  // ── TOP NAVIGATION TABS ──
  // Active master: 'PRODUCT_TYPE' (Product Type Master) | 'CATEGORY' (Category Master)
  const [activeMasterTab, setActiveMasterTab] = useState<'PRODUCT_TYPE' | 'CATEGORY'>('CATEGORY');

  // Category Master View Mode: 'TABLE' (Default canonical table) | 'TREE' (Visual hierarchy grouped from single collection)
  const [categoryViewMode, setCategoryViewMode] = useState<'TABLE' | 'TREE'>('TABLE');

  // Filters for Category Master
  const [categoryPtFilter, setCategoryPtFilter] = useState<string>('ALL');
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filters for Product Type Master
  const [productTypeSearch, setProductTypeSearch] = useState('');
  const [ptStatusFilter, setPtStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Expanded nodes for Hierarchy View
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([
    'cat:pt_med:Drugs',
    'sub:pt_med:Drugs:Tablets',
    'sub:pt_med:Drugs:Capsules',
    'cat:pt_nut:Dietary Supplements',
    'cat:pt_cos:Clinical Skincare',
    'cat:pt_ayr:Classical Ayurvedic'
  ]));

  const toggleExpand = (nodeKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeKey)) next.delete(nodeKey);
      else next.add(nodeKey);
      return next;
    });
  };

  const expandAll = (keys: string[]) => {
    setExpandedNodes(new Set(keys));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: Get Product Type Name & Code
  const getPt = (ptId: string) => {
    return (productTypes || []).find(t => t.product_type_id === ptId || t.id === ptId);
  };

  const formatMasterDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ── MODAL STATES ──

  // 1. Product Type Modal
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [editingPt, setEditingPt] = useState<ProductType | null>(null);
  const [ptFormData, setPtFormData] = useState({
    name: '',
    code: '',
    description: '',
    lifecycle_status: 'ACTIVE' as LifecycleStatus,
    display_order: 1
  });
  const [ptFormError, setPtFormError] = useState<string | null>(null);

  // 2. Category Modal (ONE CATEGORY MODEL — HIERARCHICAL CREATION WORKFLOW)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catFormData, setCatFormData] = useState({
    product_type_id: '',
    parent_key: '', // '' (None -> Level 1) | 'L1:::Category' (Level 2) | 'L2:::Category:::SubCategory' (Level 3)
    name: '',       // Dynamic name for Level 1, 2, or 3
    category_code: '',
    description: '',
    lifecycle_status: 'ACTIVE' as LifecycleStatus,
    display_order: 1
  });
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // ── INTEGRATED PRODUCT TYPE MASTER (SELECT EXISTING ATTRIBUTES ONLY) ──
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [selectedAttrDropdownValue, setSelectedAttrDropdownValue] = useState<string>('');
  const [isSavingPt, setIsSavingPt] = useState(false);

  // Available active attributes for assignment selector (only active, and not already selected)
  const availableActiveAttributes = useMemo(() => {
    return (attributeMasters || [])
      .filter(a => {
        const isActive = (a.is_active !== false) && (a.isActive !== false) && (a.lifecycle_status !== 'INACTIVE') && (a.status !== 'Inactive');
        const id = a.attribute_id || a.id;
        return Boolean(isActive && id && !selectedAttributeIds.includes(id));
      })
      .sort((a, b) => (a.attribute_name || a.name || '').localeCompare(b.attribute_name || b.name || ''));
  }, [attributeMasters, selectedAttributeIds]);

  // ── VIEW PRODUCT TYPE MODAL ──
  const [isViewPtModalOpen, setIsViewPtModalOpen] = useState(false);
  const [viewingPt, setViewingPt] = useState<ProductType | null>(null);
  const [viewPtDetails, setViewPtDetails] = useState<{ attributes: any[]; categories: any[] } | null>(null);
  const [viewPtLoading, setViewPtLoading] = useState(false);
  const [viewPtTab, setViewPtTab] = useState<'ATTRIBUTES' | 'CATEGORIES'>('ATTRIBUTES');


  // ── VIEW CATEGORY MODAL STATE ──
  const [viewingCat, setViewingCat] = useState<Category | null>(null);
  const [isViewCatModalOpen, setIsViewCatModalOpen] = useState(false);

  // 3. Delete Confirmation Modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'PRODUCT_TYPE' | 'CATEGORY';
    id: string;
    code?: string;
    name: string;
    details?: string;
  } | null>(null);

  // ── FILTERED DATA: CATEGORY MASTER ──
  const filteredCategoryList = useMemo(() => {
    return (unifiedCategories || []).filter(c => {
      // 1. Product Type filter
      if (categoryPtFilter !== 'ALL' && c.product_type_id !== categoryPtFilter) {
        return false;
      }
      // 2. Status filter
      const st = (c.lifecycle_status || (c.status === 'Active' ? 'ACTIVE' : 'INACTIVE')).toUpperCase();
      if (categoryStatusFilter !== 'ALL' && st !== categoryStatusFilter) {
        return false;
      }
      // 3. Search query
      const q = categorySearchTerm.toLowerCase().trim();
      if (q) {
        const cat = (c.category || '').toLowerCase();
        const sub = (c.sub_category || '').toLowerCase();
        const subsub = (c.sub_sub_category || '').toLowerCase();
        const code = (c.category_code || c.code || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const cId = (c.category_id || c.id || '').toLowerCase();
        const pt = getPt(c.product_type_id);
        const ptName = (pt?.product_type_name || pt?.name || '').toLowerCase();
        const ptCode = (pt?.product_type_code || pt?.code || '').toLowerCase();

        if (
          !cat.includes(q) &&
          !sub.includes(q) &&
          !subsub.includes(q) &&
          !code.includes(q) &&
          !desc.includes(q) &&
          !cId.includes(q) &&
          !ptName.includes(q) &&
          !ptCode.includes(q)
        ) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary sort on id/categoryId DESC
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      const idA = String(a.category_id || a.categoryId || a.id || '');
      const idB = String(b.category_id || b.categoryId || b.id || '');
      return idB.localeCompare(idA);
    });
  }, [unifiedCategories, categoryPtFilter, categoryStatusFilter, categorySearchTerm, productTypes]);

  // ── FILTERED DATA: PRODUCT TYPE MASTER ──
  const filteredProductTypes = useMemo(() => {
    const q = productTypeSearch.toLowerCase().trim();
    return (productTypes || [])
      .filter(pt => {
        const name = (pt.product_type_name || pt.name || '').toLowerCase();
        const code = (pt.product_type_code || pt.code || '').toLowerCase();
        const desc = (pt.description || '').toLowerCase();
        const id = (pt.product_type_id || pt.id || '').toLowerCase();
        const matchesSearch = !q || name.includes(q) || code.includes(q) || desc.includes(q) || id.includes(q);
        const ptStatus = (pt.lifecycle_status || pt.status || 'ACTIVE').toUpperCase();
        const matchesStatus = ptStatusFilter === 'ALL' || ptStatus === ptStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Latest record first (created_at DESC), secondary sort on id/product_type_id DESC
        const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
        const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
        if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA;
        }
        const idA = String(a.product_type_id || a.productTypeId || a.id || '');
        const idB = String(b.product_type_id || b.productTypeId || b.id || '');
        return idB.localeCompare(idA);
      });
  }, [productTypes, productTypeSearch, ptStatusFilter]);

  // ── PAGINATION CONTROLS ──
  const categoryPagination = usePagination(filteredCategoryList, {
    initialPageSize: 10,
    resetDeps: [categoryPtFilter, categoryStatusFilter, categorySearchTerm]
  });
  const paginatedCategories = categoryPagination.paginatedItems;

  const ptPagination = usePagination(filteredProductTypes, {
    initialPageSize: 10,
    resetDeps: [productTypeSearch, ptStatusFilter]
  });
  const paginatedProductTypes = ptPagination.paginatedItems;

  // ── METRICS SUMMARY ──
  const categoryStats = useMemo(() => {
    const totalRecords = unifiedCategories.length;
    const activeRecords = unifiedCategories.filter(c => (c.lifecycle_status || c.status) === 'ACTIVE' || c.status === 'Active').length;
    const inactiveRecords = totalRecords - activeRecords;
    const distinctCategories = new Set(unifiedCategories.map(c => c.category)).size;
    const distinctPtCovered = new Set(unifiedCategories.map(c => c.product_type_id)).size;
    return { totalRecords, activeRecords, inactiveRecords, distinctCategories, distinctPtCovered };
  }, [unifiedCategories]);

  // ── HIERARCHY TREE DERIVED DYNAMICALLY FROM SINGLE CATEGORY DATASET ──
  // Groups records: Category -> Sub-Category -> Category Records (Leaves)
  const groupedHierarchy = useMemo(() => {
    const map = new Map<string, {
      categoryName: string;
      productTypeId: string;
      subCategories: Map<string, {
        subCategoryName: string;
        records: Category[];
      }>;
      recordsWithoutSub: Category[];
    }>();

    filteredCategoryList.forEach(item => {
      const catKey = `${item.product_type_id}:::${item.category}`;
      if (!map.has(catKey)) {
        map.set(catKey, {
          categoryName: item.category,
          productTypeId: item.product_type_id,
          subCategories: new Map(),
          recordsWithoutSub: []
        });
      }

      const catEntry = map.get(catKey)!;
      const subName = item.sub_category?.trim();

      if (!subName) {
        catEntry.recordsWithoutSub.push(item);
      } else {
        if (!catEntry.subCategories.has(subName)) {
          catEntry.subCategories.set(subName, {
            subCategoryName: subName,
            records: []
          });
        }
        catEntry.subCategories.get(subName)!.records.push(item);
      }
    });

    return Array.from(map.values()).map(cat => ({
      ...cat,
      totalRecordCount: cat.recordsWithoutSub.length + Array.from(cat.subCategories.values()).reduce((sum, s) => sum + s.records.length, 0),
      subCategoriesList: Array.from(cat.subCategories.values()).map(sub => ({
        ...sub,
        records: sub.records.sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1))
      }))
    }));
  }, [filteredCategoryList]);

  // ── DYNAMIC HIERARCHY EVALUATION FOR CATEGORY MODAL ──
  const parsedParent = useMemo(() => {
    if (!catFormData.parent_key) {
      return { level: 1 as 1 | 2 | 3, category: '', sub_category: '' };
    }
    const parts = catFormData.parent_key.split(':::');
    if (parts[0] === 'L1') {
      return { level: 2 as 1 | 2 | 3, category: parts[1] || '', sub_category: '' };
    }
    if (parts[0] === 'L2') {
      return { level: 3 as 1 | 2 | 3, category: parts[1] || '', sub_category: parts[2] || '' };
    }
    return { level: 1 as 1 | 2 | 3, category: '', sub_category: '' };
  }, [catFormData.parent_key]);

  const currentLevel = parsedParent.level;

  const levelLabel = currentLevel === 1
    ? 'Category'
    : currentLevel === 2
      ? 'Sub-Category'
      : 'Sub-Sub-Category';

  const nameFieldLabel = currentLevel === 1
    ? 'Category Name'
    : currentLevel === 2
      ? 'Sub-Category Name'
      : 'Sub-Sub-Category Name';

  const namePlaceholder = currentLevel === 1
    ? 'e.g. Drugs, Dietary Supplements, Apparel'
    : currentLevel === 2
      ? 'e.g. Tablets, Capsules, Topwear'
      : 'e.g. Film Coated Tablets, Softgels, Casual Shirts';

  // Available Parent categories (strictly Level 1 and Level 2 within selected Product Type)
  const availableParents = useMemo(() => {
    const ptId = catFormData.product_type_id;
    if (!ptId) return { level1List: [], level2List: [] };

    const pool = (unifiedCategories || []).filter(c => c.product_type_id === ptId);

    // Level 1: distinct category names
    const l1Map = new Map<string, string>();
    pool.forEach(c => {
      const cat = c.category?.trim();
      if (cat && !l1Map.has(cat)) {
        l1Map.set(cat, cat);
      }
    });

    const level1List = Array.from(l1Map.values())
      .sort((a, b) => a.localeCompare(b))
      .map(cat => ({
        key: `L1:::${cat}`,
        category: cat,
        label: cat
      }));

    // Level 2: distinct pairs of (category, sub_category) where sub_category is present
    const l2Map = new Map<string, { category: string; sub_category: string }>();
    pool.forEach(c => {
      const cat = c.category?.trim();
      const sub = c.sub_category?.trim();
      if (cat && sub) {
        const pairKey = `L2:::${cat}:::${sub}`;
        if (!l2Map.has(pairKey)) {
          l2Map.set(pairKey, { category: cat, sub_category: sub });
        }
      }
    });

    const level2List = Array.from(l2Map.values())
      .sort((a, b) => (a.category + a.sub_category).localeCompare(b.category + b.sub_category))
      .map(item => ({
        key: `L2:::${item.category}:::${item.sub_category}`,
        category: item.category,
        sub_category: item.sub_category,
        label: `${item.category} → ${item.sub_category}`
      }));

    return { level1List, level2List };
  }, [unifiedCategories, catFormData.product_type_id]);

  // Derived target preview mapping to existing single CATEGORY entity
  const targetCategoryPreview = currentLevel === 1
    ? (catFormData.name.trim() || '—')
    : parsedParent.category;

  const targetSubCategoryPreview = currentLevel === 2
    ? (catFormData.name.trim() || null)
    : (currentLevel === 3 ? parsedParent.sub_category : null);

  const targetSubSubCategoryPreview = currentLevel === 3
    ? (catFormData.name.trim() || null)
    : null;

  // Selected Product Type object
  const selectedModalPt = useMemo(() => {
    return getPt(catFormData.product_type_id);
  }, [catFormData.product_type_id, productTypes]);

  // Handler: Change Product Type in modal
  const handleProductTypeChange = (newPtId: string) => {
    const nextOrder = (unifiedCategories.filter(c => c.product_type_id === newPtId).length || 0) + 1;
    setCatFormData(prev => ({
      ...prev,
      product_type_id: newPtId,
      parent_key: '', // Reset parent when product type changes
      display_order: nextOrder
    }));
  };

  // Helper: Auto-suggest category code
  const handleAutoGenerateCode = () => {
    const pt = getPt(catFormData.product_type_id);
    const ptCode = (pt?.product_type_code || pt?.code || 'CAT').replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();

    const parts: string[] = [ptCode];
    if (currentLevel === 2 && parsedParent.category) {
      const p1 = parsedParent.category.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
      if (p1) parts.push(p1);
    } else if (currentLevel === 3) {
      const p1 = parsedParent.category.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
      const p2 = parsedParent.sub_category.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
      if (p1) parts.push(p1);
      if (p2) parts.push(p2);
    }

    const words = (catFormData.name.trim() || 'NEW').split(/\s+/);
    let selfPart = '';
    if (words.length > 1) {
      selfPart = words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
    } else {
      selfPart = catFormData.name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'CAT';
    }

    parts.push(selfPart);
    setCatFormData(prev => ({ ...prev, category_code: parts.join('-') }));
  };

  // ── ACTION HANDLERS: CATEGORY ──

  const handleOpenAddCatModal = (preset?: { ptId?: string; category?: string; subCategory?: string }) => {
    setEditingCat(null);
    const defaultPtId = preset?.ptId || (categoryPtFilter !== 'ALL' ? categoryPtFilter : (productTypes[0]?.product_type_id || productTypes[0]?.id || 'pt_med'));

    let parentKey = '';
    if (preset?.category && preset?.subCategory) {
      parentKey = `L2:::${preset.category}:::${preset.subCategory}`;
    } else if (preset?.category) {
      parentKey = `L1:::${preset.category}`;
    }

    // Suggest next display order
    const nextOrder = (unifiedCategories.filter(c => c.product_type_id === defaultPtId).length || 0) + 1;

    setCatFormData({
      product_type_id: defaultPtId,
      parent_key: parentKey,
      name: '',
      category_code: '',
      description: '',
      lifecycle_status: 'ACTIVE',
      display_order: nextOrder
    });
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCatModal = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCat(cat);

    let parentKey = '';
    let nameVal = cat.category;

    if (cat.sub_sub_category) {
      parentKey = `L2:::${cat.category}:::${cat.sub_category || ''}`;
      nameVal = cat.sub_sub_category;
    } else if (cat.sub_category) {
      parentKey = `L1:::${cat.category}`;
      nameVal = cat.sub_category;
    } else {
      parentKey = '';
      nameVal = cat.category;
    }

    setCatFormData({
      product_type_id: cat.product_type_id,
      parent_key: parentKey,
      name: nameVal,
      category_code: cat.category_code || cat.code || '',
      description: cat.description || '',
      lifecycle_status: (cat.lifecycle_status || (cat.status === 'Active' ? 'ACTIVE' : 'INACTIVE')) as LifecycleStatus,
      display_order: Number(cat.display_order) || 1
    });
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenViewCategory = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingCat(cat);
    setIsViewCatModalOpen(true);
    setIsAddAttrModalOpen(false);
  };

  const executeSaveCategory = async (options: { closeAfterSave: boolean }): Promise<boolean> => {
    if (!catFormData.product_type_id) {
      setCatFormError('Please select a Product Type.');
      return false;
    }
    const cleanName = catFormData.name.trim();
    if (!cleanName) {
      setCatFormError(`Please enter a ${nameFieldLabel}.`);
      return false;
    }
    const cleanCode = catFormData.category_code.trim().toUpperCase();
    if (!cleanCode) {
      setCatFormError('Category Code is required.');
      return false;
    }

    // Validate UNIQUE category_code within selected product type
    const duplicateCode = (unifiedCategories || []).find(c => {
      const isSelf = editingCat && (c.category_id === editingCat.category_id || c.id === editingCat.id);
      if (isSelf) return false;
      return (
        c.product_type_id === catFormData.product_type_id &&
        (c.category_code || c.code || '').toUpperCase() === cleanCode
      );
    });

    if (duplicateCode) {
      setCatFormError(`Category Code "${cleanCode}" is already in use within this Product Type. Category codes must be unique.`);
      return false;
    }

    const today = new Date().toISOString().split('T')[0];

    // Determine 3-tier hierarchy values mapping to single CATEGORY table:
    let targetCategory = '';
    let targetSubCategory: string | null = null;
    let targetSubSubCategory: string | null = null;

    if (currentLevel === 1) {
      targetCategory = cleanName;
      targetSubCategory = null;
      targetSubSubCategory = null;
    } else if (currentLevel === 2) {
      targetCategory = parsedParent.category;
      targetSubCategory = cleanName;
      targetSubSubCategory = null;
    } else {
      // currentLevel === 3
      targetCategory = parsedParent.category;
      targetSubCategory = parsedParent.sub_category;
      targetSubSubCategory = cleanName;
    }

    try {
      if (editingCat) {
        const catId = editingCat.category_id || editingCat.id!;
        await updateUnifiedCategory(catId, {
          product_type_id: catFormData.product_type_id,
          category: targetCategory,
          sub_category: targetSubCategory,
          sub_sub_category: targetSubSubCategory,
          category_code: cleanCode,
          description: catFormData.description.trim() || undefined,
          lifecycle_status: catFormData.lifecycle_status,
          display_order: Number(catFormData.display_order) || 1,
          name: cleanName,
          code: cleanCode,
          status: catFormData.lifecycle_status === 'ACTIVE' ? 'Active' : 'Inactive',
          subCategory: targetSubCategory,
          subSubCategory: targetSubSubCategory,
          updated_at: today
        });
        showToast(`Updated ${levelLabel} record "${cleanCode}" (${cleanName})`);
      } else {
        // Auto-generate canonical category_id e.g. CAT033
        const existingMaxNum = (unifiedCategories || []).reduce((max, c) => {
          const match = (c.category_id || '').match(/^CAT(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        const newCatId = `CAT${String(existingMaxNum + 1).padStart(3, '0')}`;

        const newRecord: Category = {
          category_id: newCatId,
          product_type_id: catFormData.product_type_id,
          category: targetCategory,
          sub_category: targetSubCategory,
          sub_sub_category: targetSubSubCategory,
          category_code: cleanCode,
          description: catFormData.description.trim() || undefined,
          lifecycle_status: catFormData.lifecycle_status,
          display_order: Number(catFormData.display_order) || 1,
          created_at: today,
          updated_at: today,
          id: newCatId,
          code: cleanCode,
          name: cleanName,
          status: catFormData.lifecycle_status === 'ACTIVE' ? 'Active' : 'Inactive',
          subCategory: targetSubCategory,
          subSubCategory: targetSubSubCategory
        };

        const saved = await addUnifiedCategory(newRecord);
        const savedCatId = saved?.category_id || saved?.id || newCatId;
        showToast(`Created ${levelLabel} record ${savedCatId} — ${cleanCode}`);
      }
    } catch (err: any) {
      setCatFormError(err.message || 'Failed to save category to database.');
      return false;
    }

    categoryPagination.resetPage();
    if (options.closeAfterSave) {
      setIsCatModalOpen(false);
    } else {
      // Save & Add Another: preserve Product Type and parent, reset name/code/description
      const currentPt = catFormData.product_type_id;
      const currentParent = catFormData.parent_key;
      const nextOrder = Number(catFormData.display_order) + 1;
      setCatFormData({
        product_type_id: currentPt,
        parent_key: currentParent,
        name: '',
        category_code: '',
        description: '',
        lifecycle_status: 'ACTIVE',
        display_order: nextOrder
      });
      setCatFormError(null);
    }

    return true;
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSaveCategory({ closeAfterSave: true });
  };

  const handleSaveAndAddAnother = async (e: React.MouseEvent) => {
    e.preventDefault();
    await executeSaveCategory({ closeAfterSave: false });
  };

  // ── ACTION HANDLERS: PRODUCT TYPE ──

  const handleOpenAddPtModal = () => {
    setEditingPt(null);
    const nextOrder = (productTypes && productTypes.length > 0)
      ? Math.max(...productTypes.map(t => Number(t.display_order) || 0)) + 1
      : 1;
    setPtFormData({
      name: '',
      code: '',
      description: '',
      lifecycle_status: 'ACTIVE',
      display_order: nextOrder
    });
    setSelectedAttributeIds([]);
    setSelectedAttrDropdownValue('');
    setPtFormError(null);
    setIsPtModalOpen(true);
  };

  const handleOpenEditPtModal = async (pt: ProductType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPt(pt);
    setPtFormData({
      name: pt.product_type_name || pt.name || '',
      code: pt.product_type_code || pt.code || '',
      description: pt.description || '',
      lifecycle_status: (pt.lifecycle_status || pt.status || 'ACTIVE') as LifecycleStatus,
      display_order: Number(pt.display_order) || 1
    });
    setSelectedAttrDropdownValue('');
    setPtFormError(null);

    const ptId = pt.product_type_id || pt.id!;
    const localConfigured = getProductTypeConfiguredAttributes(ptId);
    const initialIds = localConfigured
      .map(item => item.attribute.attribute_id || item.attribute.id)
      .filter((id): id is string => Boolean(id));
    setSelectedAttributeIds(initialIds);
    setIsPtModalOpen(true);

    // Fetch fresh attributes from backend
    try {
      const full = await catalogApi.getProductType(ptId);
      if (full && Array.isArray(full.attributes)) {
        const freshIds = full.attributes
          .map((a: any) => a.attribute_id || a.attributeId || a.id)
          .filter((id): id is string => Boolean(id));
        setSelectedAttributeIds(freshIds);
      }
    } catch (err) {
      console.warn('Failed to fetch fresh attributes from API, using cached:', err);
    }
  };

  const handleOpenViewPtModal = async (pt: ProductType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingPt(pt);
    setIsViewPtModalOpen(true);
    setViewPtLoading(true);
    setViewPtTab('ATTRIBUTES');

    const ptId = pt.product_type_id || pt.id!;
    const localAttrs = getProductTypeConfiguredAttributes(ptId).map(item => ({
      attribute_id: item.attribute.attribute_id || item.attribute.id,
      attribute_code: item.attribute.attribute_code || item.attribute.code,
      attribute_name: item.attribute.attribute_name || item.attribute.name,
      data_type: item.attribute.data_type || 'TEXT',
      unitOfMeasure: item.attribute.unit_of_measure || '',
      unit_of_measure: item.attribute.unit_of_measure || '',
      allowed_values: item.attribute.allowed_values || [],
      is_required: item.is_required,
      is_filterable: item.attribute.is_filterable ?? true,
      is_searchable: item.attribute.is_searchable ?? true,
      is_active: item.attribute.is_active ?? true,
      display_order: item.display_order,
      remark: item.remark
    }));
    const localCats = unifiedCategories.filter(c => c.product_type_id === ptId);
    setViewPtDetails({ attributes: localAttrs, categories: localCats });

    try {
      const full = await catalogApi.getProductType(ptId);
      if (full) {
        setViewPtDetails({
          attributes: Array.isArray(full.attributes) ? full.attributes : localAttrs,
          categories: Array.isArray(full.categories) ? full.categories : localCats
        });
      }
    } catch (err) {
      console.warn('Failed to fetch full PT details for view modal:', err);
    } finally {
      setViewPtLoading(false);
    }
  };

  const handleRemoveSelectedAttribute = (attrId: string) => {
    setSelectedAttributeIds(prev => prev.filter(id => id !== attrId));
  };

  const handleSaveProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptFormData.name.trim()) { setPtFormError('Product Type Name is required.'); return; }
    if (!ptFormData.code.trim()) { setPtFormError('Product Type Code is required.'); return; }

    const cleanCode = ptFormData.code.trim().toUpperCase();
    const cleanName = ptFormData.name.trim();

    const duplicate = productTypes.find(t =>
      (t.product_type_id !== editingPt?.product_type_id && t.id !== editingPt?.id) &&
      ((t.product_type_code || t.code || '').toUpperCase() === cleanCode)
    );

    if (duplicate) {
      setPtFormError(`A Product Type with code "${cleanCode}" already exists.`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    setIsSavingPt(true);
    setPtFormError(null);

    try {
      if (editingPt) {
        const ptId = editingPt.product_type_id || editingPt.id!;
        await updateProductType(ptId, {
          product_type_name: cleanName,
          name: cleanName,
          product_type_code: cleanCode,
          code: cleanCode,
          description: ptFormData.description.trim(),
          lifecycle_status: ptFormData.lifecycle_status,
          status: ptFormData.lifecycle_status,
          display_order: Number(ptFormData.display_order) || 1,
          updated_at: today,
          attributeIds: selectedAttributeIds,
        });
        showToast(`Updated Product Type "${cleanName}" with ${selectedAttributeIds.length} attributes.`);
      } else {
        const nextOrder = Number(ptFormData.display_order) || (productTypes.length + 1);
        const newPtId = `pt_${cleanCode.toLowerCase().slice(0, 10)}`;
        const newPt: ProductType = {
          product_type_id: newPtId,
          product_type_code: cleanCode,
          product_type_name: cleanName,
          description: ptFormData.description.trim(),
          lifecycle_status: ptFormData.lifecycle_status,
          display_order: nextOrder,
          created_at: today,
          updated_at: today,
          id: newPtId,
          code: cleanCode,
          name: cleanName,
          status: ptFormData.lifecycle_status,
          attributeIds: selectedAttributeIds,
        };
        await addProductType(newPt);
        showToast(`Created Product Type "${cleanName}" with ${selectedAttributeIds.length} attributes.`);
      }

      ptPagination.resetPage();
      setIsPtModalOpen(false);
    } catch (err: any) {
      setPtFormError(err.message || 'Failed to save Product Type to database.');
    } finally {
      setIsSavingPt(false);
    }
  };

  // ── DELETE EXECUTION ──
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;

    try {
      if (deleteConfirmTarget.type === 'PRODUCT_TYPE') {
        await deleteProductType(deleteConfirmTarget.id);
        showToast(`Deleted Product Type "${deleteConfirmTarget.name}"`);
      } else {
        await deleteUnifiedCategory(deleteConfirmTarget.id);
        showToast(`Deleted Category record "${deleteConfirmTarget.name}"`);
      }
    } catch (err: any) {
      showToast(err.message || 'Delete operation failed');
    }

    setDeleteConfirmTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {/* ── Global Toast ── */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10010, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.25)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600 }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Breadcrumbs Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B', fontWeight: 600, padding: '4px 0' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{ background: 'none', border: 'none', color: '#64748B', padding: 0, cursor: 'pointer', fontWeight: 600 }}
        >
          Product Catalog
        </button>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <button
          onClick={() => setActiveMasterTab('PRODUCT_TYPE')}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: activeMasterTab === 'PRODUCT_TYPE' ? '#0F172A' : '#64748B',
            fontWeight: activeMasterTab === 'PRODUCT_TYPE' ? 700 : 600
          }}
        >
          Product Type Master
        </button>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <span style={{ color: activeMasterTab === 'CATEGORY' ? '#0F766E' : '#64748B', fontWeight: activeMasterTab === 'CATEGORY' ? 700 : 600 }}>
          Category Master
        </span>
      </div>

      {/* ── Main Page Header Bar ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            {activeMasterTab === 'PRODUCT_TYPE' ? <Layers size={22} /> : <FolderTree size={22} />}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              PRODUCT MANAGEMENT MODEL (CLIENT ALIGNED)
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              {activeMasterTab === 'PRODUCT_TYPE' ? 'Product Type Master' : 'Category Master'}
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
              {activeMasterTab === 'PRODUCT_TYPE'
                ? 'Manage top-level classification product types (PRODUCT_TYPE table).'
                : 'Canonical CATEGORY table (PRODUCT_TYPE → CATEGORY). Single entity holding category, sub-category, sub-sub-category.'}
            </div>
          </div>
        </div>

        {/* Master Tab Switcher & Primary Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <button
              onClick={() => setActiveMasterTab('PRODUCT_TYPE')}
              style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: activeMasterTab === 'PRODUCT_TYPE' ? '#FFFFFF' : 'transparent',
                color: activeMasterTab === 'PRODUCT_TYPE' ? '#0F172A' : '#64748B',
                boxShadow: activeMasterTab === 'PRODUCT_TYPE' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none'
              }}
            >
              <Layers size={14} />
              <span>Product Types ({productTypes.length})</span>
            </button>
            <button
              onClick={() => setActiveMasterTab('CATEGORY')}
              style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: activeMasterTab === 'CATEGORY' ? '#FFFFFF' : 'transparent',
                color: activeMasterTab === 'CATEGORY' ? '#0F766E' : '#64748B',
                boxShadow: activeMasterTab === 'CATEGORY' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none'
              }}
            >
              <FolderTree size={14} />
              <span>Category Master ({unifiedCategories.length})</span>
            </button>
          </div>

          {activeMasterTab === 'PRODUCT_TYPE' ? (
            <button
              onClick={handleOpenAddPtModal}
              style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(15,118,110,0.2)' }}
            >
              <Plus size={16} /> Add Product Type
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddCatModal()}
              style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(15,118,110,0.2)' }}
            >
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. PRODUCT TYPE MASTER TAB (SIMPLIFIED CANONICAL VIEW)                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMasterTab === 'PRODUCT_TYPE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quick Metrics Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PRODUCT TYPES</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{productTypes.length} Types</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Top-level classification master</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TOTAL CATEGORY RECORDS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>{categoryStats.totalRecords} Records</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>In canonical CATEGORY table</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ACTIVE RECORDS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', fontFamily: 'monospace', marginTop: 4 }}>{categoryStats.activeRecords} Active</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Available for product catalog</div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TOTAL ATTRIBUTE MAPPINGS</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{productTypeAttributes.length} Assigned</div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Across all Product Types</div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 12px', minWidth: 280, flex: '1 1 280px' }}>
                  <Search size={15} style={{ color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="Search Product Type name, code, description, or ID..."
                    value={productTypeSearch}
                    onChange={e => setProductTypeSearch(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 13, outline: 'none', color: '#0F172A' }}
                  />
                  {productTypeSearch && (
                    <button onClick={() => setProductTypeSearch('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
                  <select
                    value={ptStatusFilter}
                    onChange={e => setPtStatusFilter(e.target.value as any)}
                    style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, background: '#FFF', color: '#0F172A', cursor: 'pointer' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>
                </div>
              </div>

              {/* Product Types Master Table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Registered Product Types (PRODUCT_TYPE)</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manage attributes and view categories applicable to each Product Type</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '4px 10px', borderRadius: 6, border: '1px solid #CCFBF1' }}>
                    {filteredProductTypes.length} Available
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>PRODUCT TYPE ID</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 180 }}>PRODUCT TYPE NAME</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>PRODUCT TYPE CODE</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>DESCRIPTION</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 150, textAlign: 'center' }}>NUMBER OF CATEGORIES</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 150, textAlign: 'center' }}>NUMBER OF ATTRIBUTES</th>
                        <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100, textAlign: 'center' }}>STATUS</th>
                        <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 160, textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProductTypes.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                            <Layers size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No Product Types found.</div>
                            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>Create a Product Type with integrated attributes to classify products.</div>
                            <button
                              onClick={handleOpenAddPtModal}
                              style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <Plus size={14} /> Add Product Type
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedProductTypes.map(pt => {
                          const ptId = pt.product_type_id || pt.id!;
                          const ptCode = pt.product_type_code || pt.code || 'CODE';
                          const ptName = pt.product_type_name || pt.name || 'Unnamed';
                          const ptStatus = pt.lifecycle_status || pt.status || 'ACTIVE';
                          const isActive = ptStatus === 'ACTIVE';
                          const catCount = pt.categoriesCount ?? pt.category_count ?? unifiedCategories.filter(c => c.product_type_id === ptId).length;
                          const attrCount = pt.attributesCount ?? pt.attribute_count ?? getProductTypeAttributes(ptId).length;

                          return (
                            <tr
                              key={ptId}
                              style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                              onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                            >
                              <td style={{ padding: '14px 14px' }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', background: '#F0FDFA', padding: '3px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                                  {ptId}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Layers size={15} style={{ color: '#0F766E', flexShrink: 0 }} />
                                  <span>{ptName}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px 14px' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                                  {ptCode}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12.5, maxWidth: 220 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pt.description}>
                                  {pt.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description</span>}
                                </div>
                              </td>
                              <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '3px 10px', borderRadius: 6, border: '1px solid #CCFBF1', fontFamily: 'monospace' }}>
                                  {catCount}
                                </span>
                              </td>
                              <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 10px', borderRadius: 6, border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                                  {attrCount}
                                </span>
                              </td>
                              <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                                  background: isActive ? '#DCFCE7' : '#FEE2E2',
                                  color: isActive ? '#15803D' : '#B91C1C',
                                  border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                                }}>
                                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                  {/* View Action Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenViewPtModal(pt, e)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 6,
                                      background: '#F0FDFA',
                                      color: '#0F766E',
                                      border: '1px solid #99F6E4',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="View Product Type details, configured attributes, and categories"
                                  >
                                    <Eye size={13} />
                                    <span>View</span>
                                  </button>

                                  {/* Edit Action Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditPtModal(pt, e)}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 6,
                                      background: '#FFFFFF',
                                      color: '#0F766E',
                                      border: '1px solid #CBD5E1',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 5,
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Edit Product Type and configured attributes"
                                  >
                                    <Edit3 size={13} />
                                    <span>Edit</span>
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
                <PaginationControl {...ptPagination.paginationProps} itemName="product types" />
              </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. CATEGORY MASTER TAB (CANONICAL CLIENT MODEL) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeMasterTab === 'CATEGORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Quick Metrics Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>CATEGORY RECORDS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                {filteredCategoryList.length} / {categoryStats.totalRecords}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Total single CATEGORY records</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PRODUCT TYPE FILTER</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {categoryPtFilter === 'ALL' ? 'All Product Types' : (getPt(categoryPtFilter)?.product_type_name || categoryPtFilter)}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                {categoryPtFilter === 'ALL' ? `${categoryStats.distinctPtCovered} types covered` : `Filtered by product_type_id`}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ACTIVE RECORDS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', fontFamily: 'monospace', marginTop: 4 }}>
                {categoryStats.activeRecords} Active
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Only active selectable for products</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>CATEGORY GROUPS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>
                {categoryStats.distinctCategories} Categories
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Visual groups from single model</div>
            </div>
          </div>

          {/* Search, Filter & View Mode Toolbar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 12px', minWidth: 320, flex: '1 1 320px' }}>
              <Search size={15} style={{ color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search category, sub-category, sub-sub-category, code, or description..."
                value={categorySearchTerm}
                onChange={e => setCategorySearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 13, outline: 'none', color: '#0F172A' }}
              />
              {categorySearchTerm && (
                <button onClick={() => setCategorySearchTerm('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Product Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Product Type:</span>
                <select
                  value={categoryPtFilter}
                  onChange={e => setCategoryPtFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, background: '#FFF', color: '#0F172A', cursor: 'pointer' }}
                >
                  <option value="ALL">All Product Types</option>
                  {(productTypes || []).map(pt => (
                    <option key={pt.product_type_id || pt.id} value={pt.product_type_id || pt.id}>
                      {pt.product_type_name || pt.name} ({pt.product_type_code || pt.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
                <select
                  value={categoryStatusFilter}
                  onChange={e => setCategoryStatusFilter(e.target.value as any)}
                  style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, background: '#FFF', color: '#0F172A', cursor: 'pointer' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
              </div>

              {/* View Mode Toggle: Table View vs Hierarchy View */}
              <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 6, border: '1px solid #CBD5E1' }}>
                <button
                  onClick={() => setCategoryViewMode('TABLE')}
                  style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    background: categoryViewMode === 'TABLE' ? '#FFFFFF' : 'transparent',
                    color: categoryViewMode === 'TABLE' ? '#0F766E' : '#64748B',
                    boxShadow: categoryViewMode === 'TABLE' ? '0 1px 2px rgba(15,23,42,0.1)' : 'none'
                  }}
                  title="Table View (Client 12-Column Schema)"
                >
                  <Table size={13} />
                  <span>Table View</span>
                </button>
                <button
                  onClick={() => setCategoryViewMode('TREE')}
                  style={{
                    padding: '6px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    background: categoryViewMode === 'TREE' ? '#FFFFFF' : 'transparent',
                    color: categoryViewMode === 'TREE' ? '#0F766E' : '#64748B',
                    boxShadow: categoryViewMode === 'TREE' ? '0 1px 2px rgba(15,23,42,0.1)' : 'none'
                  }}
                  title="Hierarchy View (Visual Grouping from single dataset)"
                >
                  <ListTree size={13} />
                  <span>Hierarchy View</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── 2A. TABLE VIEW (CLIENT 12-COLUMN SPECIFICATION) ── */}
          {categoryViewMode === 'TABLE' && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    CATEGORY Master Records (One Single Entity)
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Every record is a flat CATEGORY entity containing product_type_id, category, sub_category, sub_sub_category, and unique category_code.
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '4px 10px', borderRadius: 6, border: '1px solid #CCFBF1' }}>
                  Showing {filteredCategoryList.length} Records
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>CATEGORY ID</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>PRODUCT TYPE</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>CATEGORY</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>SUB-CATEGORY</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 180 }}>SUB-SUB-CATEGORY</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 125 }}>CATEGORY CODE</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>DESCRIPTION</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>STATUS</th>
                      <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 80, textAlign: 'center' }}>ORDER</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>CREATED AT</th>
                      <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 105 }}>UPDATED AT</th>
                      <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 110 }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategoryList.length === 0 ? (
                      <tr>
                        <td colSpan={12} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                          <FolderTree size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No Category records found.</div>
                          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                            {categorySearchTerm || categoryPtFilter !== 'ALL' || categoryStatusFilter !== 'ALL'
                              ? 'Try resetting your search query or product type filter.'
                              : 'Create your first CATEGORY record to get started.'}
                          </div>
                          <button
                            onClick={() => handleOpenAddCatModal()}
                            style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                          >
                            + Add Category
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedCategories.map(cat => {
                        const catId = cat.category_id || cat.id!;
                        const pt = getPt(cat.product_type_id);
                        const ptName = pt?.product_type_name || pt?.name || cat.product_type_id;
                        const catCode = cat.category_code || cat.code || '—';
                        const isActive = (cat.lifecycle_status || cat.status) === 'ACTIVE' || cat.status === 'Active';

                        return (
                          <tr
                            key={catId}
                            style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                          >
                            {/* 1. Category ID (PK) */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', background: '#F0FDFA', padding: '2px 7px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                                {catId}
                              </span>
                            </td>

                            {/* 2. Product Type */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                                {ptName}
                              </div>
                              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B' }}>
                                {pt?.product_type_code || pt?.code || cat.product_type_id}
                              </span>
                            </td>

                            {/* 3. Category */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                                {cat.category}
                              </span>
                            </td>

                            {/* 4. Sub-Category */}
                            <td style={{ padding: '12px 14px', color: cat.sub_category ? '#334155' : '#94A3B8', fontWeight: cat.sub_category ? 600 : 400 }}>
                              {cat.sub_category || '—'}
                            </td>

                            {/* 5. Sub-Sub-Category */}
                            <td style={{ padding: '12px 16px', color: cat.sub_sub_category ? '#0F172A' : '#94A3B8', fontWeight: cat.sub_sub_category ? 700 : 400 }}>
                              {cat.sub_sub_category || '—'}
                            </td>

                            {/* 6. Category Code (UNIQUE) */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                                {catCode}
                              </span>
                            </td>

                            {/* 7. Description */}
                            <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12, maxWidth: 240 }} title={cat.description}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {cat.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description</span>}
                              </div>
                            </td>

                            {/* 8. Lifecycle Status */}
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                                background: isActive ? '#DCFCE7' : '#FEE2E2',
                                color: isActive ? '#15803D' : '#B91C1C',
                                border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                              }}>
                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>

                            {/* 9. Display Order */}
                            <td style={{ padding: '12px 12px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: 12 }}>
                              #{cat.display_order ?? 1}
                            </td>

                            {/* 10. Created At */}
                            <td style={{ padding: '12px 14px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                              {formatMasterDate(cat.created_at || (cat as any).createdAt)}
                            </td>

                            {/* 11. Updated At */}
                            <td style={{ padding: '12px 14px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                              {formatMasterDate(cat.updated_at || (cat as any).updatedAt || cat.created_at)}
                            </td>

                            {/* 12. Actions */}
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                                <button
                                  onClick={() => handleOpenViewCategory(cat)}
                                  style={{ padding: '5px 8px', borderRadius: 5, background: '#FFFFFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                  title="View Category Record"
                                >
                                  <Eye size={13} />
                                </button>

                                <button
                                  onClick={(e) => handleOpenEditCatModal(cat, e)}
                                  style={{ padding: '5px 8px', borderRadius: 5, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                  title="Edit Category Record"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  onClick={() => toggleUnifiedCategoryStatus(catId)}
                                  style={{ padding: '5px 8px', borderRadius: 5, background: isActive ? '#FEF2F2' : '#F0FDF4', color: isActive ? '#DC2626' : '#16A34A', border: isActive ? '1px solid #FCA5A5' : '1px solid #86EFAC', cursor: 'pointer' }}
                                  title={isActive ? 'Deactivate Category Record' : 'Activate Category Record'}
                                >
                                  <Power size={13} />
                                </button>

                                <button
                                  onClick={() => setDeleteConfirmTarget({
                                    type: 'CATEGORY',
                                    id: catId,
                                    code: catCode,
                                    name: `${cat.category}${cat.sub_category ? ` → ${cat.sub_category}` : ''}${cat.sub_sub_category ? ` → ${cat.sub_sub_category}` : ''}`,
                                    details: `ID: ${catId} | Code: ${catCode}`
                                  })}
                                  style={{ padding: '5px 8px', borderRadius: 5, background: '#FFFFFF', color: '#94A3B8', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                  title="Delete Category Record"
                                >
                                  <Trash2 size={13} />
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
              <PaginationControl {...categoryPagination.paginationProps} itemName="categories" />
            </div>
          )}

          {/* ── 2B. HIERARCHY VIEW (VISUAL GROUPING GENERATED FROM SINGLE COLLECTION) ── */}
          {categoryViewMode === 'TREE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Hierarchy Tree Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '10px 16px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  Visual hierarchy generated from single <strong>CATEGORY</strong> dataset. Each leaf is an actionable CATEGORY record.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      const allKeys: string[] = [];
                      groupedHierarchy.forEach(cat => {
                        allKeys.push(`cat:${cat.productTypeId}:${cat.categoryName}`);
                        cat.subCategoriesList.forEach(sub => allKeys.push(`sub:${cat.productTypeId}:${cat.categoryName}:${sub.subCategoryName}`));
                      });
                      expandAll(allKeys);
                    }}
                    style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 5, color: '#475569', cursor: 'pointer' }}
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    style={{ padding: '5px 10px', fontSize: 11.5, fontWeight: 600, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 5, color: '#475569', cursor: 'pointer' }}
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {groupedHierarchy.length === 0 ? (
                <div style={{ background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: '#64748B' }}>
                  <FolderTree size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No categories match your filters.</div>
                  <button
                    onClick={() => handleOpenAddCatModal()}
                    style={{ marginTop: 14, padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    + Add Category
                  </button>
                </div>
              ) : (
                groupedHierarchy.map(cat => {
                  const catKey = `cat:${cat.productTypeId}:${cat.categoryName}`;
                  const isCatExpanded = expandedNodes.has(catKey);
                  const pt = getPt(cat.productTypeId);

                  return (
                    <div
                      key={catKey}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(15,23,42,0.03)'
                      }}
                    >
                      {/* LEVEL 1: CATEGORY GROUP HEADER */}
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#F8FAFC',
                          borderBottom: isCatExpanded ? '1px solid #E2E8F0' : 'none',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 10,
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleExpand(catKey)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(catKey); }}
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                          >
                            {isCatExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>

                          <div style={{ width: 30, height: 30, borderRadius: 6, background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                            <FolderTree size={16} />
                          </div>

                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>{cat.categoryName}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                                {pt?.product_type_name || pt?.name || cat.productTypeId}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                                {cat.totalRecordCount} {cat.totalRecordCount === 1 ? 'Record' : 'Records'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Add shortcut */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenAddCatModal({ ptId: cat.productTypeId, category: cat.categoryName })}
                            style={{ padding: '5px 10px', borderRadius: 6, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Plus size={13} /> + Add Record under {cat.categoryName}
                          </button>
                        </div>
                      </div>

                      {/* LEVEL 2 & 3: SUB-CATEGORIES & CATEGORY RECORD LEAVES */}
                      {isCatExpanded && (
                        <div style={{ padding: '10px 16px 14px 34px', display: 'flex', flexDirection: 'column', gap: 10, background: '#FFFFFF' }}>
                          
                          {/* Direct records without sub-category (if any) */}
                          {cat.recordsWithoutSub.map((rec, recIdx) => (
                            <div
                              key={rec.category_id || rec.id || `dir_${cat.productTypeId}_${rec.category}_${recIdx}`}
                              style={{
                                padding: '8px 12px', borderRadius: 6, background: '#F8FAFC',
                                border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', fontSize: 12.5
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: '#0F766E', fontWeight: 800 }}>•</span>
                                <span style={{ fontWeight: 700, color: '#0F172A' }}>{rec.category} (Direct Record)</span>
                                <span style={{ fontSize: 10.5, fontFamily: 'monospace', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                  {rec.category_code}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button
                                  onClick={() => handleOpenViewCategory(rec)}
                                  style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                  title="View Category Record"
                                >
                                  <Eye size={11} />
                                </button>
                                <button
                                  onClick={(e) => handleOpenEditCatModal(rec, e)}
                                  style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => toggleUnifiedCategoryStatus(rec.category_id)}
                                  style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#0F766E', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                >
                                  <Power size={12} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Sub-categories */}
                          {cat.subCategoriesList.map(sub => {
                            const subKey = `sub:${cat.productTypeId}:${cat.categoryName}:${sub.subCategoryName}`;
                            const isSubExpanded = expandedNodes.has(subKey);

                            return (
                              <div
                                key={subKey}
                                style={{
                                  borderLeft: '2px solid #CBD5E1',
                                  paddingLeft: 14,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6
                                }}
                              >
                                {/* SUB-CATEGORY GROUP HEADER */}
                                <div
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    background: '#F8FAFC',
                                    border: '1px solid #E2E8F0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => toggleExpand(subKey)}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleExpand(subKey); }}
                                      style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                    >
                                      {isSubExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    </button>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                      {sub.subCategoryName}
                                    </span>
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>
                                      {sub.records.length} {sub.records.length === 1 ? 'Record' : 'Records'}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddCatModal({ ptId: cat.productTypeId, category: cat.categoryName, subCategory: sub.subCategoryName })}
                                      style={{ padding: '3px 8px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontWeight: 700, fontSize: 10.5, cursor: 'pointer' }}
                                    >
                                      + Add under {sub.subCategoryName}
                                    </button>
                                  </div>
                                </div>

                                {/* CATEGORY RECORD LEAF NODES */}
                                {isSubExpanded && (
                                  <div style={{ borderLeft: '2px solid #94A3B8', paddingLeft: 12, marginLeft: 14, display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                                    {sub.records.map((leaf, leafIdx) => {
                                      const isActive = (leaf.lifecycle_status || leaf.status) === 'ACTIVE' || leaf.status === 'Active';
                                      const label = leaf.sub_sub_category || leaf.sub_category || leaf.category;

                                      return (
                                        <div
                                          key={leaf.category_id || leaf.id || `leaf_${cat.productTypeId}_${leafIdx}`}
                                          style={{
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            background: '#FFFFFF',
                                            border: '1px solid #E2E8F0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: 12.5,
                                            flexWrap: 'wrap',
                                            gap: 8
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ color: '#0F766E', fontWeight: 800 }}>•</span>
                                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{label}</span>
                                            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                                              {leaf.category_code}
                                            </span>
                                            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B', background: '#F8FAFC', padding: '1px 5px', borderRadius: 3, border: '1px solid #E2E8F0' }}>
                                              ID: {leaf.category_id}
                                            </span>
                                            <span style={{
                                              fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                                              background: isActive ? '#DCFCE7' : '#FEE2E2',
                                              color: isActive ? '#15803D' : '#B91C1C'
                                            }}>
                                              {isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                            {leaf.description && (
                                              <span style={{ fontSize: 11.5, color: '#64748B' }}>
                                                — {leaf.description}
                                              </span>
                                            )}
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <button
                                              onClick={() => handleOpenViewCategory(leaf)}
                                              style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                              title="View Category Record"
                                            >
                                              <Eye size={11} />
                                            </button>
                                            <button
                                              onClick={(e) => handleOpenEditCatModal(leaf, e)}
                                              style={{ padding: '3px 7px', borderRadius: 4, background: '#FFF', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                              title="Edit Category Record"
                                            >
                                              <Edit3 size={11} />
                                            </button>
                                            <button
                                              onClick={() => toggleUnifiedCategoryStatus(leaf.category_id)}
                                              style={{ padding: '3px 7px', borderRadius: 4, background: isActive ? '#FEF2F2' : '#F0FDF4', color: isActive ? '#DC2626' : '#16A34A', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                              title={isActive ? 'Deactivate Record' : 'Activate Record'}
                                            >
                                              <Power size={11} />
                                            </button>
                                            <button
                                              onClick={() => setDeleteConfirmTarget({
                                                type: 'CATEGORY',
                                                id: leaf.category_id,
                                                code: leaf.category_code,
                                                name: `${leaf.category} → ${leaf.sub_category || ''} → ${leaf.sub_sub_category || ''}`,
                                                details: `ID: ${leaf.category_id} | Code: ${leaf.category_code}`
                                              })}
                                              style={{ padding: '3px 7px', borderRadius: 4, background: '#FFF', color: '#94A3B8', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                              title="Delete Category Record"
                                            >
                                              <Trash2 size={11} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT CATEGORY (ONE CANONICAL CATEGORY ENTITY) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isCatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }} onClick={() => setIsCatModalOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1040,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              boxShadow: '0 25px 60px -15px rgba(15,23,42,0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* ── MODAL HEADER (TOP AREA) ── */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: '#F8FAFC',
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#F0FDFA',
                  color: '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #CCFBF1'
                }}>
                  <FolderTree size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      {editingCat ? `Edit Category Record (${editingCat.category_id})` : 'Add Category'}
                    </h3>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: currentLevel === 1 ? '#E0F2FE' : currentLevel === 2 ? '#FEF3C7' : '#DCFCE7',
                      color: currentLevel === 1 ? '#0369A1' : currentLevel === 2 ? '#92400E' : '#15803D',
                      border: `1px solid ${currentLevel === 1 ? '#BAE6FD' : currentLevel === 2 ? '#FDE68A' : '#86EFAC'}`
                    }}>
                      Level {currentLevel} · {levelLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    Create a category, sub-category or sub-sub-category by choosing where it sits in the hierarchy.
                  </div>
                </div>
              </div>

              {/* Top-right Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                {!editingCat && (
                  <button
                    type="button"
                    onClick={handleSaveAndAddAnother}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 6,
                      border: '1px solid #0F766E',
                      background: '#F0FDFA',
                      color: '#0F766E',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Save & add another
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
                  }}
                >
                  {editingCat ? 'Save Changes' : 'Save category'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: 6,
                    marginLeft: 2
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── MODAL BODY FORM ── */}
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {catFormError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} />
                    <span>{catFormError}</span>
                  </div>
                )}

                {/* TWO-COLUMN RESPONSIVE LAYOUT */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 22,
                  alignItems: 'flex-start'
                }}>
                  {/* ────────────────────────────────────────────────────────── */}
                  {/* LEFT COLUMN: Placement, Details, Settings, Attributes      */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div style={{ flex: '1 1 540px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* ── 1. PLACEMENT SECTION ── */}
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Placement
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Pick the product type, then the parent. Leave the parent empty to create a top-level category.
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        {/* PRODUCT TYPE (Required) */}
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                            Product Type *
                          </label>
                          <select
                            required
                            value={catFormData.product_type_id}
                            onChange={e => handleProductTypeChange(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1.5px solid #0F766E',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 700,
                              background: '#F0FDFA',
                              color: '#0F766E',
                              outline: 'none'
                            }}
                          >
                            {(productTypes || []).map(pt => (
                              <option key={pt.product_type_id || pt.id} value={pt.product_type_id || pt.id}>
                                {pt.product_type_name || pt.name} ({pt.product_type_code || pt.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* PARENT CATEGORY (Optional) */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                              Parent Category
                            </label>
                            {catFormData.parent_key && (
                              <button
                                type="button"
                                onClick={() => setCatFormData(prev => ({ ...prev, parent_key: '' }))}
                                style={{ fontSize: 11, color: '#0F766E', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                              >
                                Clear (Top-level)
                              </button>
                            )}
                          </div>
                          <select
                            value={catFormData.parent_key}
                            onChange={e => setCatFormData(prev => ({ ...prev, parent_key: e.target.value }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #CBD5E1',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              background: '#FFFFFF',
                              color: '#0F172A',
                              outline: 'none'
                            }}
                          >
                            <option value="">None (Top-level Category — Level 1)</option>

                            {availableParents.level1List.length > 0 && (
                              <optgroup label="Level 1 Categories (creates Sub-Category — Level 2)">
                                {availableParents.level1List.map(p => (
                                  <option key={p.key} value={p.key}>
                                    {p.category}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {availableParents.level2List.length > 0 && (
                              <optgroup label="Level 2 Sub-Categories (creates Sub-Sub-Category — Level 3)">
                                {availableParents.level2List.map(p => (
                                  <option key={p.key} value={p.key}>
                                    {p.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                            Only levels 1–2 can be parents. Max depth is 3.
                          </div>
                        </div>
                      </div>

                      {/* ── CURRENT LEVEL PREVIEW ── */}
                      <div style={{
                        background: '#F0FDFA',
                        border: '1px solid #CCFBF1',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 9px',
                            borderRadius: 12,
                            background: currentLevel === 1 ? '#E0F2FE' : currentLevel === 2 ? '#FEF3C7' : '#DCFCE7',
                            color: currentLevel === 1 ? '#0369A1' : currentLevel === 2 ? '#92400E' : '#15803D',
                            border: `1px solid ${currentLevel === 1 ? '#BAE6FD' : currentLevel === 2 ? '#FDE68A' : '#86EFAC'}`,
                            whiteSpace: 'nowrap'
                          }}>
                            [Level {currentLevel} · {levelLabel}]
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#0F172A', fontWeight: 600, flexWrap: 'wrap' }}>
                            <span>{selectedModalPt?.product_type_name || selectedModalPt?.name || 'Product Type'}</span>
                            <ChevronRight size={13} style={{ color: '#94A3B8' }} />
                            {currentLevel >= 2 && (
                              <>
                                <span style={{ color: '#334155' }}>{parsedParent.category}</span>
                                <ChevronRight size={13} style={{ color: '#94A3B8' }} />
                              </>
                            )}
                            {currentLevel === 3 && (
                              <>
                                <span style={{ color: '#334155' }}>{parsedParent.sub_category}</span>
                                <ChevronRight size={13} style={{ color: '#94A3B8' }} />
                              </>
                            )}
                            <span style={{
                              fontWeight: 800,
                              color: '#0F766E',
                              background: '#CCFBF1',
                              padding: '1px 8px',
                              borderRadius: 4
                            }}>
                              {catFormData.name.trim() || `(${nameFieldLabel})`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── 2. DETAILS SECTION ── */}
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Details
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          How this category appears across the catalog.
                        </div>
                      </div>

                      {/* Name Field (Dynamic Label) */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          {nameFieldLabel} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={namePlaceholder}
                          value={catFormData.name}
                          onChange={e => setCatFormData(prev => ({ ...prev, name: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            fontSize: 13,
                            outline: 'none',
                            fontWeight: 600
                          }}
                        />
                      </div>

                      {/* Category Code (Unique) */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                            Category Code * <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Unique within product type)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleAutoGenerateCode}
                            style={{
                              fontSize: 11,
                              color: '#0F766E',
                              background: '#F0FDFA',
                              border: '1px solid #CCFBF1',
                              borderRadius: 4,
                              padding: '2px 8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Sparkles size={11} /> Auto-suggest Code
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. DRUG-TAB-FCT, APP-MEN-TOP"
                          value={catFormData.category_code}
                          onChange={e => setCatFormData(prev => ({ ...prev, category_code: e.target.value.toUpperCase() }))}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            fontSize: 13,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            outline: 'none'
                          }}
                        />
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                          Client model has one single category_code representing this complete record.
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          Description <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Formulation details, therapeutic focus, specifications..."
                          value={catFormData.description}
                          onChange={e => setCatFormData(prev => ({ ...prev, description: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            fontSize: 12.5,
                            outline: 'none',
                            resize: 'vertical'
                          }}
                        />
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          Category Description only. No remark.
                        </div>
                      </div>
                    </div>

                    {/* ── 3. SETTINGS SECTION ── */}
                    <div style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Settings
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Catalog lifecycle status and listing display priority.
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                            Lifecycle Status *
                          </label>
                          <select
                            value={catFormData.lifecycle_status}
                            onChange={e => setCatFormData(prev => ({ ...prev, lifecycle_status: e.target.value as LifecycleStatus }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #CBD5E1',
                              borderRadius: 6,
                              fontSize: 12.5,
                              fontWeight: 600,
                              background: '#FFF',
                              outline: 'none'
                            }}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                            <option value="DRAFT">DRAFT</option>
                            <option value="DISCONTINUED">DISCONTINUED</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                            Display Order
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={catFormData.display_order}
                            onChange={e => setCatFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #CBD5E1',
                              borderRadius: 6,
                              fontSize: 13,
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* ────────────────────────────────────────────────────────── */}
                  {/* RIGHT COLUMN: Hierarchy Preview & Record Mapping           */}
                  {/* ────────────────────────────────────────────────────────── */}
                  <div style={{ flex: '1 1 360px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── 8. HIERARCHY PREVIEW PANEL ── */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FolderTree size={16} style={{ color: '#0F766E' }} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Hierarchy Preview
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Live catalog placement across 3 hierarchy tiers.
                        </div>
                      </div>

                      {/* Visual Tree */}
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}>
                        {/* Root: Product Type */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Layers size={15} style={{ color: '#475569' }} />
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                              {selectedModalPt?.product_type_name || selectedModalPt?.name || 'Product Type'}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', background: '#E2E8F0', padding: '1px 6px', borderRadius: 4 }}>
                            Product type
                          </span>
                        </div>

                        {/* Level 1 Node */}
                        <div style={{
                          marginLeft: 14,
                          paddingLeft: 12,
                          borderLeft: '2px solid #CBD5E1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: currentLevel === 1 ? '#F0FDFA' : '#F8FAFC',
                            border: currentLevel === 1 ? '1.5px solid #0F766E' : '1px solid #E2E8F0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FolderTree size={14} style={{ color: currentLevel === 1 ? '#0F766E' : '#64748B' }} />
                              <span style={{
                                fontSize: 12,
                                fontWeight: currentLevel === 1 ? 800 : 600,
                                color: currentLevel === 1 ? '#0F766E' : '#334155'
                              }}>
                                {currentLevel === 1 ? (catFormData.name.trim() || 'New Category') : parsedParent.category}
                              </span>
                            </div>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: currentLevel === 1 ? '#CCFBF1' : '#F1F5F9',
                              color: currentLevel === 1 ? '#0F766E' : '#64748B'
                            }}>
                              {currentLevel === 1 ? 'L1 · New' : 'L1'}
                            </span>
                          </div>

                          {/* Level 2 Node */}
                          {currentLevel >= 2 && (
                            <div style={{
                              marginLeft: 14,
                              paddingLeft: 12,
                              borderLeft: '2px solid #CBD5E1',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: 6,
                                background: currentLevel === 2 ? '#F0FDFA' : '#F8FAFC',
                                border: currentLevel === 2 ? '1.5px solid #0F766E' : '1px solid #E2E8F0'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FolderTree size={14} style={{ color: currentLevel === 2 ? '#0F766E' : '#64748B' }} />
                                  <span style={{
                                    fontSize: 12,
                                    fontWeight: currentLevel === 2 ? 800 : 600,
                                    color: currentLevel === 2 ? '#0F766E' : '#334155'
                                  }}>
                                    {currentLevel === 2 ? (catFormData.name.trim() || 'New Sub-Category') : parsedParent.sub_category}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: currentLevel === 2 ? '#CCFBF1' : '#F1F5F9',
                                  color: currentLevel === 2 ? '#0F766E' : '#64748B'
                                }}>
                              {currentLevel === 2 ? 'L2 · New' : 'L2'}
                            </span>
                          </div>

                          {/* Level 3 Node */}
                          {currentLevel === 3 && (
                            <div style={{
                              marginLeft: 14,
                              paddingLeft: 12,
                              borderLeft: '2px solid #CBD5E1'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: 6,
                                background: '#F0FDFA',
                                border: '1.5px solid #0F766E'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FolderTree size={14} style={{ color: '#0F766E' }} />
                                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F766E' }}>
                                    {catFormData.name.trim() || 'New Sub-Sub-Category'}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#CCFBF1',
                                  color: '#0F766E'
                                }}>
                                  L3 · New
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── RECORD INFO & MODEL MAPPING CARD ── */}
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Record Info
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '2px 7px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                      Single CATEGORY Entity
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>Target Level:</span>
                      <strong style={{ color: '#0F172A' }}>Level {currentLevel} ({levelLabel})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>category:</span>
                      <strong style={{ color: '#0F172A' }}>{targetCategoryPreview}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>sub_category:</span>
                      <span style={{ color: targetSubCategoryPreview ? '#0F172A' : '#94A3B8', fontWeight: targetSubCategoryPreview ? 700 : 400 }}>
                        {targetSubCategoryPreview || '— (null)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>sub_sub_category:</span>
                      <span style={{ color: targetSubSubCategoryPreview ? '#0F172A' : '#94A3B8', fontWeight: targetSubSubCategoryPreview ? 700 : 400 }}>
                        {targetSubSubCategoryPreview || '— (null)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}>
                      <span style={{ color: '#64748B' }}>category_code:</span>
                      <span style={{ fontFamily: 'monospace', color: '#1D4ED8', fontWeight: 700 }}>
                        {catFormData.category_code || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: '#64748B' }}>lifecycle_status:</span>
                      <span style={{ fontWeight: 700, color: catFormData.lifecycle_status === 'ACTIVE' ? '#15803D' : '#B91C1C' }}>
                        {catFormData.lifecycle_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Info when editing */}
                {editingCat && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 14px', fontSize: 11, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><strong>category_id:</strong> {editingCat.category_id}</div>
                    <div><strong>created_at:</strong> {formatMasterDate(editingCat.created_at)}</div>
                    <div><strong>updated_at:</strong> {formatMasterDate(editingCat.updated_at)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── MODAL FOOTER ── */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Target: <strong style={{ color: '#0F172A' }}>Level {currentLevel} · {levelLabel}</strong> ({selectedModalPt?.product_type_name || selectedModalPt?.name || 'Catalog'})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              {!editingCat && (
                <button
                  type="button"
                  onClick={handleSaveAndAddAnother}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #0F766E', background: '#F0FDFA', color: '#0F766E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save & add another
                </button>
              )}
              <button
                type="submit"
                style={{ padding: '8px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,118,110,0.2)' }}
              >
                {editingCat ? 'Save Changes' : 'Save category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VIEW CATEGORY & MANAGE ATTRIBUTES */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isViewCatModalOpen && viewingCat && (() => {
        const viewCatId = viewingCat.category_id || viewingCat.id || '';
        const viewCatCode = viewingCat.category_code || viewingCat.code || '';
        const viewPt = getPt(viewingCat.product_type_id);

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10005,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setIsViewCatModalOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 12,
                padding: 22,
                boxShadow: '0 20px 48px rgba(15,23,42,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {viewingCat.category}
                      </h3>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                        {viewCatCode}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: (viewingCat.lifecycle_status === 'ACTIVE' || viewingCat.status === 'Active') ? '#DCFCE7' : '#FEE2E2',
                        color: (viewingCat.lifecycle_status === 'ACTIVE' || viewingCat.status === 'Active') ? '#15803D' : '#B91C1C'
                      }}>
                        {viewingCat.lifecycle_status || viewingCat.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      Product Type: <strong>{viewPt?.product_type_name || viewPt?.name || viewingCat.product_type_id}</strong>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewCatModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category Details Summary Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                  Category Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Category (L1):</span>
                    <strong style={{ color: '#0F172A' }}>{viewingCat.category}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Sub-Category (L2):</span>
                    <span style={{ color: viewingCat.sub_category ? '#0F172A' : '#94A3B8', fontWeight: viewingCat.sub_category ? 700 : 400 }}>
                      {viewingCat.sub_category || '—'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Sub-Sub-Category (L3):</span>
                    <span style={{ color: viewingCat.sub_sub_category ? '#0F172A' : '#94A3B8', fontWeight: viewingCat.sub_sub_category ? 700 : 400 }}>
                      {viewingCat.sub_sub_category || '—'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Category Code:</span>
                    <span style={{ fontFamily: 'monospace', color: '#1D4ED8', fontWeight: 700 }}>{viewCatCode}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Product Type:</span>
                    <strong style={{ color: '#0F172A' }}>{viewPt?.product_type_name || viewPt?.name || viewingCat.product_type_id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Category ID:</span>
                    <span style={{ fontFamily: 'monospace', color: '#0F766E', fontWeight: 600 }}>{viewCatId}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Lifecycle Status:</span>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: (viewingCat.lifecycle_status === 'ACTIVE' || viewingCat.status === 'Active') ? '#DCFCE7' : '#FEE2E2',
                      color: (viewingCat.lifecycle_status === 'ACTIVE' || viewingCat.status === 'Active') ? '#15803D' : '#B91C1C'
                    }}>
                      {viewingCat.lifecycle_status || viewingCat.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', fontSize: 11, display: 'block' }}>Display Order:</span>
                    <span style={{ color: '#0F172A', fontWeight: 600 }}>{viewingCat.display_order ?? 1}</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 11.5, color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Description: </span>
                    {viewingCat.description || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    Updated: {formatMasterDate(viewingCat.updated_at)}
                  </div>
                </div>
              </div>

              {/* Inherited Product Type Attributes Section (Read-only view) */}
              {(() => {
                const ptAttrs = getProductTypeConfiguredAttributes(viewingCat.product_type_id);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Applicable Product Type Attributes
                        </span>
                        <span style={{ fontSize: 11.5, color: '#64748B', marginLeft: 8 }}>
                          (Inherited from Product Type: {viewPt?.product_type_name || viewingCat.product_type_id})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewCatModalOpen(false);
                          const ptObj = getPt(viewingCat.product_type_id);
                          if (ptObj) {
                            handleOpenEditPtModal(ptObj);
                          }
                          setActiveMasterTab('PRODUCT_TYPE');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 5,
                          background: '#F0FDFA',
                          color: '#0F766E',
                          border: '1px solid #99F6E4',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Manage attributes under Product Type Master"
                      >
                        <Sparkles size={12} /> Manage in Product Type Master
                      </button>
                    </div>

                    {ptAttrs.length === 0 ? (
                      <div style={{
                        padding: 16,
                        textAlign: 'center',
                        background: '#F8FAFC',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 6,
                        color: '#64748B',
                        fontSize: 12
                      }}>
                        No attributes configured for Product Type "{viewPt?.product_type_name || viewingCat.product_type_id}" yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                        {ptAttrs.map((item, idx) => {
                          const master = item.attribute;
                          const attrCode = master?.attribute_code || master?.code || '—';
                          const attrName = master?.attribute_name || master?.name || '';
                          const attrType = master?.data_type || 'TEXT';
                          const attrUom = master?.unit_of_measure;
                          const isRequired = item.is_required;

                          return (
                            <div
                              key={item.product_type_attribute_id || `${viewCatId}_${idx}`}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 6
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  background: '#F1F5F9',
                                  color: '#475569',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {idx + 1}
                                </span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#0F766E' }}>
                                  {attrCode}
                                </span>
                                <strong style={{ fontSize: 12.5, color: '#0F172A' }}>
                                  {attrName}
                                </strong>
                                {attrUom && (
                                  <span style={{ fontSize: 11, color: '#64748B' }}>
                                    ({attrUom})
                                  </span>
                                )}
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  background: '#E0F2FE',
                                  color: '#0369A1'
                                }}>
                                  {attrType}
                                </span>
                                {isRequired && (
                                  <span style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: '#FEF3C7',
                                    color: '#92400E'
                                  }}>
                                    MANDATORY
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: 11, color: '#64748B' }}>
                                Product Type Level
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => {
                    const catToEdit = viewingCat;
                    setIsViewCatModalOpen(false);
                    handleOpenEditCatModal(catToEdit);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F766E',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={13} /> Edit Category Record
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewCatModalOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}



            {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD / EDIT PRODUCT TYPE (INTEGRATED SINGLE FORM)              */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isPtModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => !isSavingPt && setIsPtModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 860,
              maxHeight: '90vh',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {editingPt ? `Edit Product Type: ${editingPt.product_type_name || editingPt.name}` : 'Add Product Type'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Configure product type classification and dynamic applicable attributes in a single form
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingPt && setIsPtModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                disabled={isSavingPt}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProductType} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {ptFormError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} />
                    <span>{ptFormError}</span>
                  </div>
                )}

                {/* ── SECTION A: PRODUCT TYPE INFORMATION ── */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0F766E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                      A
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Product Type Information
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                        Product Type Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pharmaceutical, Cosmetics, Medical Devices"
                        value={ptFormData.name}
                        onChange={e => setPtFormData({ ...ptFormData, name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', color: '#0F172A' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                        Product Type Code * (Unique)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PHARMA, NUTRA, COSM, MED_DEV"
                        value={ptFormData.code}
                        onChange={e => setPtFormData({ ...ptFormData, code: e.target.value.toUpperCase() })}
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none', color: '#0F172A' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Scope, regulatory classification, and nature of products under this type..."
                      value={ptFormData.description}
                      onChange={e => setPtFormData({ ...ptFormData, description: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', color: '#0F172A', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* ── SECTION B: ASSIGNED ATTRIBUTES ── */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                        B
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Assigned Attributes
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #BFDBFE' }}>
                            {selectedAttributeIds.length} Selected
                          </span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                          Select attributes that apply to this Product Type. Attribute specifications and rules are maintained in Attribute Master.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Select Attributes
                    </label>
                    <select
                      value={selectedAttrDropdownValue}
                      onChange={e => {
                        const attrId = e.target.value;
                        if (!attrId) return;
                        if (!selectedAttributeIds.includes(attrId)) {
                          setSelectedAttributeIds(prev => [...prev, attrId]);
                          const master = (attributeMasters || []).find(m => (m.attribute_id || m.id) === attrId);
                          showToast(`Assigned attribute "${master?.attribute_name || master?.name || attrId}"`);
                        }
                        setSelectedAttrDropdownValue('');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 6,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#F8FAFC',
                        color: '#0F172A',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Select Attributes --</option>
                      {availableActiveAttributes.map(m => (
                        <option key={m.attribute_id || m.id} value={m.attribute_id || m.id}>
                          {m.attribute_name || m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clean List of Assigned Attributes */}
                  {selectedAttributeIds.length === 0 ? (
                    <div style={{ padding: '28px 20px', textAlign: 'center', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, color: '#64748B' }}>
                      <Sliders size={28} style={{ color: '#94A3B8', margin: '0 auto 8px', display: 'block' }} />
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>No attributes assigned yet</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                        Select attributes from the dropdown above to assign them to this Product Type.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedAttributeIds.map((attrId, idx) => {
                        const master = (attributeMasters || []).find(m => (m.attribute_id || m.id) === attrId);
                        const attrName = master?.attribute_name || master?.name || attrId;

                        return (
                          <div
                            key={attrId}
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: 6,
                              padding: '10px 14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#E2E8F0', color: '#475569', fontFamily: 'monospace' }}>
                                #{idx + 1}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                                {attrName}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedAttribute(attrId)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 5,
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                                cursor: 'pointer',
                                fontSize: 11.5,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                              title="Remove attribute"
                            >
                              <Trash2 size={12} />
                              <span>Remove</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={() => setIsPtModalOpen(false)}
                  disabled={isSavingPt}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSavingPt ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPt}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSavingPt ? '#94A3B8' : '#0F766E',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSavingPt ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
                  }}
                >
                  {isSavingPt ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{isSavingPt ? 'Saving to Database...' : (editingPt ? 'Update Product Type' : 'Save Product Type')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VIEW PRODUCT TYPE (COMPLETE DETAILS, ATTRIBUTES & CATEGORIES)  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isViewPtModalOpen && viewingPt && (() => {
        const ptId = viewingPt.product_type_id || viewingPt.id!;
        const ptName = viewingPt.product_type_name || viewingPt.name || 'Product Type';
        const ptCode = viewingPt.product_type_code || viewingPt.code || 'CODE';
        const ptStatus = viewingPt.lifecycle_status || viewingPt.status || 'ACTIVE';
        const isActive = ptStatus === 'ACTIVE';

        const attrs = viewPtDetails?.attributes || [];
        const cats = viewPtDetails?.categories || [];

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10008,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setIsViewPtModalOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 860,
                maxHeight: '90vh',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 14,
                boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        {ptName}
                      </h3>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontFamily: 'monospace' }}>
                        {ptCode}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#15803D' : '#B91C1C',
                        border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                      Product Type ID: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{ptId}</strong> • Display Order: #{viewingPt.display_order ?? 1}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsViewPtModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Description & Summary Cards */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    DESCRIPTION
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                    {viewingPt.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description provided for this Product Type.</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>CONFIGURED ATTRIBUTES</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 2 }}>{attrs.length} Attributes</div>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>ASSOCIATED CATEGORIES</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{cats.length} Records</div>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>LAST UPDATED</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginTop: 4 }}>
                      {formatMasterDate(viewingPt.updated_at || (viewingPt as any).updatedAt || viewingPt.created_at)}
                    </div>
                  </div>
                </div>

                {/* Sub-tab Switcher for View Details */}
                <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #E2E8F0', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => setViewPtTab('ATTRIBUTES')}
                    style={{
                      padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      background: viewPtTab === 'ATTRIBUTES' ? '#FFFFFF' : 'transparent',
                      color: viewPtTab === 'ATTRIBUTES' ? '#0F766E' : '#64748B',
                      boxShadow: viewPtTab === 'ATTRIBUTES' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none'
                    }}
                  >
                    <Sliders size={14} />
                    <span>Assigned Attributes ({attrs.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewPtTab('CATEGORIES')}
                    style={{
                      padding: '7px 16px', borderRadius: 6, fontSize: 12.5, fontWeight: 700,
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      background: viewPtTab === 'CATEGORIES' ? '#FFFFFF' : 'transparent',
                      color: viewPtTab === 'CATEGORIES' ? '#0F766E' : '#64748B',
                      boxShadow: viewPtTab === 'CATEGORIES' ? '0 1px 3px rgba(15,23,42,0.1)' : 'none'
                    }}
                  >
                    <FolderTree size={14} />
                    <span>Associated Categories ({cats.length})</span>
                  </button>
                </div>

                {/* Tab 1: Assigned Attributes Table */}
                {viewPtTab === 'ATTRIBUTES' && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 50, textAlign: 'center' }}>#</th>
                            <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>ASSIGNED ATTRIBUTE NAME</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 130 }}>CODE</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 100 }}>DATA TYPE</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 70, textAlign: 'center' }}>UOM</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 90, textAlign: 'center' }}>REQUIRED</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 140 }}>FILTER / SEARCH</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 80, textAlign: 'center' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewPtLoading ? (
                            <tr>
                              <td colSpan={8} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>
                                Loading assigned attributes from database...
                              </td>
                            </tr>
                          ) : attrs.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>
                                <Sliders size={28} style={{ color: '#94A3B8', margin: '0 auto 6px', display: 'block' }} />
                                <div>No attributes assigned to this Product Type.</div>
                              </td>
                            </tr>
                          ) : (
                            attrs.map((a: any, idx: number) => {
                              const aName = a.attribute_name || a.attributeName || a.name || 'Attribute';
                              const aCode = a.attribute_code || a.attributeCode || a.code || 'CODE';
                              const aType = a.data_type || a.dataType || 'TEXT';
                              const aUom = a.unit_of_measure || a.unitOfMeasure || '—';
                              const isReq = a.is_required !== undefined ? a.is_required : Boolean(a.isRequired);
                              const isFilt = a.is_filterable !== undefined ? a.is_filterable : (a.isFilterable ?? true);
                              const isSrch = a.is_searchable !== undefined ? a.is_searchable : (a.isSearchable ?? true);
                              const isAct = a.is_active !== undefined ? a.is_active : (a.isActive ?? true);

                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', color: '#64748B' }}>
                                    #{a.display_order ?? (idx + 1)}
                                  </td>
                                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0F172A' }}>
                                    <div>{aName}</div>
                                    {a.allowed_values && a.allowed_values.length > 0 && (
                                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                        Options: {a.allowed_values.join(', ')}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0', fontFamily: 'monospace' }}>
                                      {aCode}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                                      {aType}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>
                                    {aUom}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: isReq ? '#FEF2F2' : '#F1F5F9', color: isReq ? '#DC2626' : '#64748B', border: isReq ? '1px solid #FCA5A5' : '1px solid #CBD5E1' }}>
                                      {isReq ? 'Required' : 'Optional'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                      {isFilt && (
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
                                          Filter
                                        </span>
                                      )}
                                      {isSrch && (
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                                          Search
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: isAct ? '#DCFCE7' : '#FEE2E2', color: isAct ? '#15803D' : '#B91C1C' }}>
                                      {isAct ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 2: Associated Categories Table */}
                {viewPtTab === 'CATEGORIES' && (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 50, textAlign: 'center' }}>#</th>
                            <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>CATEGORY (L1)</th>
                            <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-CATEGORY (L2)</th>
                            <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#475569' }}>SUB-SUB-CATEGORY (L3)</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 120 }}>CODE</th>
                            <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', width: 90, textAlign: 'center' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cats.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: '#64748B' }}>
                                <FolderTree size={28} style={{ color: '#94A3B8', margin: '0 auto 6px', display: 'block' }} />
                                <div>No categories currently linked to this Product Type.</div>
                              </td>
                            </tr>
                          ) : (
                            cats.map((c: any, idx: number) => {
                              const cCode = c.category_code || c.code || '—';
                              const cStatus = (c.lifecycle_status || c.status || 'ACTIVE').toUpperCase();
                              const isCatActive = cStatus === 'ACTIVE';

                              return (
                                <tr key={c.category_id || c.id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', color: '#64748B' }}>
                                    #{idx + 1}
                                  </td>
                                  <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0F172A' }}>
                                    {c.category}
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                                    {c.sub_category || <span style={{ color: '#94A3B8' }}>—</span>}
                                  </td>
                                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                                    {c.sub_sub_category || <span style={{ color: '#94A3B8' }}>—</span>}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1', fontFamily: 'monospace' }}>
                                      {cCode}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: isCatActive ? '#DCFCE7' : '#FEE2E2', color: isCatActive ? '#15803D' : '#B91C1C' }}>
                                      {isCatActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* View Modal Footer */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewPtModalOpen(false);
                    handleOpenEditPtModal(viewingPt);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: '1px solid #0F766E',
                    background: '#F0FDFA',
                    color: '#0F766E',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Edit3 size={14} />
                  <span>Edit Product Type</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsViewPtModalOpen(false)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

{/* MODAL: DELETE CONFIRMATION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {deleteConfirmTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setDeleteConfirmTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 20px 48px rgba(15,23,42,0.2)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#DC2626' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={18} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Confirm Deletion
              </h3>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Are you sure you want to delete {deleteConfirmTarget.type === 'CATEGORY' ? 'Category record' : 'Product Type'}:
              <br />
              <strong style={{ color: '#0F172A' }}>"{deleteConfirmTarget.name}"</strong>?
              {deleteConfirmTarget.details && (
                <div style={{ marginTop: 6, fontSize: 11.5, color: '#64748B', fontFamily: 'monospace' }}>
                  {deleteConfirmTarget.details}
                </div>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
