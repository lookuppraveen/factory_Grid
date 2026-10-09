import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductType, Category, LifecycleStatus } from '../../types';
import {
  FolderTree, Layers, Search, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, X, Power, ArrowLeft, ChevronRight, ChevronDown,
  Sparkles, Check, Info, FileText, Table, ListTree, Filter, Tag, Eye
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
    categoryAttributes,
    addCategoryAttribute,
    removeCategoryAttribute,
    setCategoryAttributesForCategory,
    getCategoryAttributes,
    getCategoryConfiguredAttributes,
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
    'cat:Drugs',
    'sub:Drugs:Tablets',
    'sub:Drugs:Capsules',
    'cat:Dietary Supplements',
    'cat:Clinical Skincare',
    'cat:Classical Ayurvedic'
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

  // ── CATEGORY -> ATTRIBUTE ASSOCIATION STATE ──
  const [catAttrDrafts, setCatAttrDrafts] = useState<{ attribute_id: string; remark: string }[]>([]);

  // ── VIEW CATEGORY MODAL STATE ──
  const [viewingCat, setViewingCat] = useState<Category | null>(null);
  const [isViewCatModalOpen, setIsViewCatModalOpen] = useState(false);

  // ── ADD ATTRIBUTE ASSIGNMENT MODAL STATE (Section 4) ──
  const [isAddAttrModalOpen, setIsAddAttrModalOpen] = useState(false);
  const [selectedAttrId, setSelectedAttrId] = useState<string>('');
  const [addAttrModalContext, setAddAttrModalContext] = useState<'VIEW_MODAL' | 'DRAFT_MODAL'>('VIEW_MODAL');
  const [addAttrError, setAddAttrError] = useState<string | null>(null);

  // Active ATTRIBUTE_MASTER records available to assign (not already in catAttrDrafts)
  const availableAttributesForModal = useMemo(() => {
    const assignedIds = catAttrDrafts.map(d => d.attribute_id);
    return (attributeMasters || []).filter(attr => {
      if (!attr.is_active) return false;
      const aId = attr.attribute_id || attr.id || '';
      return !assignedIds.includes(aId);
    });
  }, [attributeMasters, catAttrDrafts]);

  // Active ATTRIBUTE_MASTER records available to assign in View Category modal
  const availableAttributesForViewModal = useMemo(() => {
    if (!viewingCat) return [];
    const catId = viewingCat.category_id || viewingCat.id || '';
    const assignedIds = getCategoryAttributes(catId).map(ca => ca.attribute_id || ca.attributeId);
    return (attributeMasters || []).filter(attr => {
      if (!attr.is_active) return false;
      const aId = attr.attribute_id || attr.id || '';
      return !assignedIds.includes(aId);
    });
  }, [attributeMasters, viewingCat, categoryAttributes]);

  const handleConfirmAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttrId) {
      setAddAttrError('Please select an Attribute.');
      return;
    }

    const master = (attributeMasters || []).find(m => (m.attribute_id || m.id) === selectedAttrId);
    const attrName = master?.attribute_name || master?.name || selectedAttrId;

    if (addAttrModalContext === 'VIEW_MODAL') {
      if (!viewingCat) return;
      const catId = viewingCat.category_id || viewingCat.id || '';
      const res = addCategoryAttribute({
        category_id: catId,
        attribute_id: selectedAttrId,
        remark: ''
      });
      if (res.success) {
        showToast(`Assigned "${attrName}" to ${viewingCat.category}`);
        setIsAddAttrModalOpen(false);
      } else {
        setAddAttrError(res.error || 'Failed to assign attribute');
      }
    } else {
      // DRAFT_MODAL
      if (catAttrDrafts.length >= 10) {
        setAddAttrError('Maximum 10 attributes allowed for this category.');
        return;
      }
      setCatAttrDrafts(prev => [...prev, { attribute_id: selectedAttrId, remark: '' }]);
      showToast(`Added "${attrName}" to category attributes`);
      setIsAddAttrModalOpen(false);
    }
  };

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
      // Sort primarily by Product Type, then Category, then display_order
      if (a.product_type_id !== b.product_type_id) {
        return a.product_type_id.localeCompare(b.product_type_id);
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return (Number(a.display_order) || 1) - (Number(b.display_order) || 1);
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
      .sort((a, b) => (Number(a.display_order) || 1) - (Number(b.display_order) || 1));
  }, [productTypes, productTypeSearch, ptStatusFilter]);

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
    setCatAttrDrafts([
      { attribute_id: 'attr_generic_name', remark: '' },
      { attribute_id: 'attr_strength', remark: '' },
      { attribute_id: 'attr_dosage_form', remark: '' },
      { attribute_id: 'attr_pack_size', remark: '' }
    ]);
    setIsAddAttrModalOpen(false);
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
    const catId = cat.category_id || cat.id || '';
    const existing = getCategoryAttributes(catId);
    setCatAttrDrafts(existing.map(ca => ({
      attribute_id: ca.attribute_id || ca.attributeId || '',
      remark: ca.remark || ''
    })));
    setIsAddAttrModalOpen(false);
    setCatFormError(null);
    setIsCatModalOpen(true);
  };

  const handleOpenViewCategory = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingCat(cat);
    setIsViewCatModalOpen(true);
    setIsAddAttrModalOpen(false);
  };

  const executeSaveCategory = (options: { closeAfterSave: boolean }): boolean => {
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
    if (catAttrDrafts.length > 10) {
      setCatFormError('Maximum 10 attributes allowed for this category.');
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

    if (editingCat) {
      const catId = editingCat.category_id || editingCat.id!;
      updateUnifiedCategory(catId, {
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
      setCategoryAttributesForCategory(catId, catAttrDrafts);
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

      addUnifiedCategory(newRecord);
      setCategoryAttributesForCategory(newCatId, catAttrDrafts);
      showToast(`Created ${levelLabel} record ${newCatId} — ${cleanCode}`);
    }

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
      setCatAttrDrafts([
        { attribute_id: 'attr_generic_name', remark: '' },
        { attribute_id: 'attr_strength', remark: '' },
        { attribute_id: 'attr_dosage_form', remark: '' },
        { attribute_id: 'attr_pack_size', remark: '' }
      ]);
      setCatFormError(null);
    }

    return true;
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    executeSaveCategory({ closeAfterSave: true });
  };

  const handleSaveAndAddAnother = (e: React.MouseEvent) => {
    e.preventDefault();
    executeSaveCategory({ closeAfterSave: false });
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
    setPtFormError(null);
    setIsPtModalOpen(true);
  };

  const handleOpenEditPtModal = (pt: ProductType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPt(pt);
    setPtFormData({
      name: pt.product_type_name || pt.name || '',
      code: pt.product_type_code || pt.code || '',
      description: pt.description || '',
      lifecycle_status: (pt.lifecycle_status || pt.status || 'ACTIVE') as LifecycleStatus,
      display_order: Number(pt.display_order) || 1
    });
    setPtFormError(null);
    setIsPtModalOpen(true);
  };

  const handleSaveProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ptFormData.name.trim()) { setPtFormError('Product Type Name is required.'); return; }
    if (!ptFormData.code.trim()) { setPtFormError('Product Type Code is required.'); return; }

    const cleanCode = ptFormData.code.trim().toUpperCase();
    const cleanName = ptFormData.name.trim();

    const duplicate = productTypes.find(t =>
      (t.product_type_id !== editingPt?.product_type_id && t.id !== editingPt?.id) &&
      ((t.product_type_code || t.code || '').toUpperCase() === cleanCode ||
       (t.product_type_name || t.name || '').toLowerCase() === cleanName.toLowerCase())
    );

    if (duplicate) {
      setPtFormError(`A Product Type with code "${cleanCode}" or name "${cleanName}" already exists.`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (editingPt) {
      const ptId = editingPt.product_type_id || editingPt.id!;
      updateProductType(ptId, {
        product_type_name: cleanName,
        name: cleanName,
        product_type_code: cleanCode,
        code: cleanCode,
        description: ptFormData.description.trim(),
        lifecycle_status: ptFormData.lifecycle_status,
        status: ptFormData.lifecycle_status,
        display_order: Number(ptFormData.display_order) || 1,
        updated_at: today
      });
      showToast(`Updated Product Type "${cleanName}"`);
    } else {
      const nextOrder = Number(ptFormData.display_order) || (productTypes.length + 1);
      const newPtId = `PT${String(nextOrder).padStart(3, '0')}`;
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
        status: ptFormData.lifecycle_status
      };
      addProductType(newPt);
      showToast(`Created Product Type "${cleanName}" (${cleanCode})`);
    }

    setIsPtModalOpen(false);
  };

  // ── DELETE EXECUTION ──
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'PRODUCT_TYPE') {
      deleteProductType(deleteConfirmTarget.id);
      showToast(`Deleted Product Type "${deleteConfirmTarget.name}"`);
    } else {
      deleteUnifiedCategory(deleteConfirmTarget.id);
      showToast(`Deleted Category record "${deleteConfirmTarget.name}"`);
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
              <Plus size={16} /> + Add Product Type
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('attribute-master');
                  if (typeof window !== 'undefined' && window.location.pathname !== '/admin/attribute-master') {
                    window.history.pushState({}, '', '/admin/attribute-master');
                  }
                }}
                style={{
                  padding: '9px 16px',
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
                title="View & Manage Attributes in Attribute Master"
              >
                <Sparkles size={15} /> Attributes
              </button>
              <button
                onClick={() => handleOpenAddCatModal()}
                style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 4px rgba(15,118,110,0.2)' }}
              >
                <Plus size={16} /> + Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. PRODUCT TYPE MASTER TAB */}
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
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>UNIQUE CATEGORY HEADS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', marginTop: 4 }}>{categoryStats.distinctCategories} Categories</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Distinct category groups</div>
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
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Click "Manage Categories" on any Product Type to view and filter its Category records</div>
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
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 200 }}>PRODUCT TYPE NAME</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>CODE</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 220 }}>DESCRIPTION</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>STATUS</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110, textAlign: 'center' }}>DISPLAY ORDER</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 115 }}>CREATED AT</th>
                    <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 115 }}>UPDATED AT</th>
                    <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 230 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProductTypes.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                        <Layers size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No Product Types found.</div>
                        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>Create a Product Type to start categorizing products.</div>
                        <button
                          onClick={handleOpenAddPtModal}
                          style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                        >
                          + Add Product Type
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredProductTypes.map(pt => {
                      const ptId = pt.product_type_id || pt.id!;
                      const ptCode = pt.product_type_code || pt.code || 'CODE';
                      const ptName = pt.product_type_name || pt.name || 'Unnamed';
                      const ptStatus = pt.lifecycle_status || pt.status || 'ACTIVE';
                      const isActive = ptStatus === 'ACTIVE';
                      const catCount = unifiedCategories.filter(c => c.product_type_id === ptId).length;

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
                          <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12.5, maxWidth: 260 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pt.description}>
                              {pt.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description</span>}
                            </div>
                          </td>
                          <td style={{ padding: '14px 14px' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                              background: isActive ? '#DCFCE7' : '#FEE2E2',
                              color: isActive ? '#15803D' : '#B91C1C',
                              border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                            }}>
                              {isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 14px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: 12.5 }}>
                            #{pt.display_order ?? 1}
                          </td>
                          <td style={{ padding: '14px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                            {formatMasterDate(pt.created_at || (pt as any).createdAt)}
                          </td>
                          <td style={{ padding: '14px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                            {formatMasterDate(pt.updated_at || (pt as any).updatedAt || pt.created_at)}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                onClick={() => {
                                  setCategoryPtFilter(ptId);
                                  setActiveMasterTab('CATEGORY');
                                }}
                                style={{ padding: '6px 12px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, boxShadow: '0 1px 2px rgba(15,118,110,0.2)' }}
                                title="View Categories under this Product Type"
                              >
                                <span>Categories ({catCount})</span>
                                <ChevronRight size={13} />
                              </button>

                              <button
                                onClick={(e) => handleOpenEditPtModal(pt, e)}
                                style={{ padding: '6px 9px', borderRadius: 6, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                title="Edit Product Type"
                              >
                                <Edit3 size={13} />
                              </button>

                              <button
                                onClick={() => toggleProductTypeStatus(ptId)}
                                style={{ padding: '6px 9px', borderRadius: 6, background: isActive ? '#FEF2F2' : '#F0FDF4', color: isActive ? '#DC2626' : '#16A34A', border: isActive ? '1px solid #FCA5A5' : '1px solid #86EFAC', cursor: 'pointer' }}
                                title={isActive ? 'Deactivate Product Type' : 'Activate Product Type'}
                              >
                                <Power size={13} />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmTarget({ type: 'PRODUCT_TYPE', id: ptId, name: ptName })}
                                style={{ padding: '6px 9px', borderRadius: 6, background: '#FFFFFF', color: '#94A3B8', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                title="Delete Product Type"
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
                      filteredCategoryList.map(cat => {
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
                                  type="button"
                                  onClick={() => handleOpenViewCategory(cat)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '5px 9px',
                                    borderRadius: 5,
                                    background: '#F0FDFA',
                                    color: '#0F766E',
                                    border: '1px solid #99F6E4',
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title="View Category & Assigned Attributes"
                                >
                                  <Sparkles size={12} />
                                  <span>Attributes ({getCategoryAttributes(catId).length}/10)</span>
                                </button>

                                <button
                                  onClick={() => handleOpenViewCategory(cat)}
                                  style={{ padding: '5px 8px', borderRadius: 5, background: '#FFFFFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                  title="View Category Record & Attributes"
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
                        allKeys.push(`cat:${cat.categoryName}`);
                        cat.subCategoriesList.forEach(sub => allKeys.push(`sub:${cat.categoryName}:${sub.subCategoryName}`));
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
                  const catKey = `cat:${cat.categoryName}`;
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
                          {cat.recordsWithoutSub.map(rec => (
                            <div
                              key={rec.category_id}
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
                                  type="button"
                                  onClick={() => handleOpenViewCategory(rec)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}
                                  title="View Category Details & Configured Attributes"
                                >
                                  <Sparkles size={11} />
                                  <span>Attributes ({getCategoryAttributes(rec.category_id).length}/10)</span>
                                </button>
                                <button
                                  onClick={() => handleOpenViewCategory(rec)}
                                  style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                  title="View Category Record & Attributes"
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
                            const subKey = `sub:${cat.categoryName}:${sub.subCategoryName}`;
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
                                    {sub.records.map(leaf => {
                                      const isActive = (leaf.lifecycle_status || leaf.status) === 'ACTIVE' || leaf.status === 'Active';
                                      const label = leaf.sub_sub_category || leaf.sub_category || leaf.category;

                                      return (
                                        <div
                                          key={leaf.category_id}
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
                                              type="button"
                                              onClick={() => handleOpenViewCategory(leaf)}
                                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 6px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #99F6E4', fontSize: 10.5, fontWeight: 600, cursor: 'pointer' }}
                                              title="View Category Details & Configured Attributes"
                                            >
                                              <Sparkles size={11} />
                                              <span>Attributes ({getCategoryAttributes(leaf.category_id).length}/10)</span>
                                            </button>
                                            <button
                                              onClick={() => handleOpenViewCategory(leaf)}
                                              style={{ padding: '3px 6px', borderRadius: 4, background: '#FFF', color: '#0F766E', border: '1px solid #99F6E4', cursor: 'pointer' }}
                                              title="View Category Record & Attributes"
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

                    {/* ── 4. CATEGORY ATTRIBUTES (PRESERVED) ── */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRadius: 10,
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                            Category Attributes
                          </label>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: catAttrDrafts.length >= 10 ? '#FEF2F2' : (catAttrDrafts.length > 0 ? '#E0F2FE' : '#F1F5F9'),
                            color: catAttrDrafts.length >= 10 ? '#DC2626' : (catAttrDrafts.length > 0 ? '#0369A1' : '#64748B'),
                            border: `1px solid ${catAttrDrafts.length >= 10 ? '#FECACA' : (catAttrDrafts.length > 0 ? '#BAE6FD' : '#E2E8F0')}`
                          }}>
                            Assigned Attributes {catAttrDrafts.length} / 10
                          </span>
                        </div>

                        {catAttrDrafts.length >= 10 ? (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: 4, border: '1px solid #FECACA' }}>
                            Maximum 10 attributes allowed for this category.
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddAttrModalContext('DRAFT_MODAL');
                              setSelectedAttrId('');
                              setAddAttrError(null);
                              setIsAddAttrModalOpen(true);
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              background: '#0F766E',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
                            }}
                          >
                            <Plus size={14} /> Add Attribute
                          </button>
                        )}
                      </div>

                      {/* Assigned Attributes List */}
                      {catAttrDrafts.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', padding: '8px 2px' }}>
                          No attributes assigned yet. Click "+ Add Attribute" to select from Attribute Master (max 10 attributes).
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                          {catAttrDrafts.map((draft, idx) => {
                            const attr = (attributeMasters || []).find(a => (a.attribute_id || a.id) === draft.attribute_id);
                            if (!attr) return null;
                            const code = attr.attribute_code || attr.code || '';
                            const name = attr.attribute_name || attr.name || '';
                            const uom = attr.unit_of_measure;

                            return (
                              <div
                                key={`${draft.attribute_id}_${idx}`}
                                style={{
                                  padding: '8px 12px',
                                  background: '#FFFFFF',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 6,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 6
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12.5 }}>{name}</span>
                                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#0F766E', background: '#F0FDFA', padding: '1px 5px', borderRadius: 3, border: '1px solid #CCFBF1' }}>
                                    {code}
                                  </span>
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: '#F1F5F9',
                                    color: '#334155',
                                    border: '1px solid #E2E8F0'
                                  }}>
                                    {attr.data_type}
                                  </span>
                                  {uom && (
                                    <span style={{ fontSize: 11, color: '#64748B' }}>({uom})</span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setCatAttrDrafts(prev => prev.filter((_, i) => i !== idx))}
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    background: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}
                                  title="Remove attribute from this category"
                                >
                                  <X size={12} /> Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
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
        const assignedList = getCategoryAttributes(viewCatId);
        const isAtCapacity = assignedList.length >= 10;

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

              {/* Category Attributes Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Category Attributes
                    </span>
                    <span style={{ fontSize: 11.5, color: '#64748B', marginLeft: 8 }}>
                      (Category-specific dynamic attributes)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: isAtCapacity ? '#FEE2E2' : '#F0FDFA',
                      color: isAtCapacity ? '#B91C1C' : '#0F766E',
                      border: isAtCapacity ? '1px solid #FCA5A5' : '1px solid #99F6E4'
                    }}>
                      Assigned: {assignedList.length} / 10
                    </span>
                    {!isAtCapacity && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddAttrModalContext('VIEW_MODAL');
                          setSelectedAttrId('');
                          setAddAttrError(null);
                          setIsAddAttrModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 5,
                          background: '#0F766E',
                          color: '#FFFFFF',
                          border: 'none',
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={13} /> Add Attribute
                      </button>
                    )}
                  </div>
                </div>

                {/* Capacity alert if max 10 reached */}
                {isAtCapacity && (
                  <div style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#B91C1C',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600
                  }}>
                    <AlertTriangle size={14} />
                    <span>Maximum 10 attributes allowed for this category.</span>
                  </div>
                )}

                {/* Assigned Attributes List */}
                {assignedList.length === 0 ? (
                  <div style={{
                    padding: 20,
                    textAlign: 'center',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: 6,
                    color: '#64748B',
                    fontSize: 12.5
                  }}>
                    No attributes assigned to this category yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                    {assignedList.map((ca, idx) => {
                      const attrId = ca.attribute_id || ca.attributeId || '';
                      const master = (attributeMasters || []).find(m => (m.attribute_id === attrId || m.id === attrId));
                      const attrName = master?.attribute_name || master?.name || attrId;
                      const attrCode = master?.attribute_code || master?.code || '—';
                      const attrType = master?.data_type || 'TEXT';
                      const attrUom = master?.unit_of_measure;
                      const isRequired = !!master?.is_required;

                      return (
                        <div
                          key={ca.category_attribute_id || `${viewCatId}_${attrId}_${idx}`}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                                REQUIRED
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              removeCategoryAttribute(viewCatId, attrId);
                              showToast(`Removed "${attrName}" from category`);
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: '1px solid #FECACA',
                              background: '#FFF',
                              color: '#DC2626',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Remove attribute from this category"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

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
      {/* MODAL: ADD / EDIT PRODUCT TYPE */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isPtModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsPtModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 20px 48px rgba(15,23,42,0.2)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingPt ? 'Edit Product Type' : 'Add Product Type'}
                </h3>
              </div>
              <button onClick={() => setIsPtModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {ptFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', marginBottom: 14, color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} />
                <span>{ptFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProductType} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Type Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pharmaceutical, Cosmetics, Veterinary"
                  value={ptFormData.name}
                  onChange={e => setPtFormData({ ...ptFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Type Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHARMA, NUTRA, COSM, VET"
                  value={ptFormData.code}
                  onChange={e => setPtFormData({ ...ptFormData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the scope and nature of products in this type..."
                  value={ptFormData.description}
                  onChange={e => setPtFormData({ ...ptFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Lifecycle Status
                  </label>
                  <select
                    value={ptFormData.lifecycle_status}
                    onChange={e => setPtFormData({ ...ptFormData, lifecycle_status: e.target.value as LifecycleStatus })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, background: '#FFF' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={ptFormData.display_order}
                    onChange={e => setPtFormData({ ...ptFormData, display_order: parseInt(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsPtModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Product Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: ADD ATTRIBUTE ASSIGNMENT (Client Requirement Section 4) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isAddAttrModalOpen && (() => {
        const availableList = addAttrModalContext === 'VIEW_MODAL'
          ? availableAttributesForViewModal
          : availableAttributesForModal;
        const targetCategoryName = addAttrModalContext === 'VIEW_MODAL'
          ? (viewingCat?.category || 'Selected Category')
          : (catFormData.name.trim() || targetCategoryPreview || 'Category');

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10020,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setIsAddAttrModalOpen(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 480,
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
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Add Attribute Assignment
                    </h3>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      Category: <strong style={{ color: '#0F766E' }}>{targetCategoryName}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddAttrModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Error Message */}
              {addAttrError && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#B91C1C',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <AlertTriangle size={15} />
                  <span>{addAttrError}</span>
                </div>
              )}

              {/* Assignment Form */}
              <form onSubmit={handleConfirmAddAttribute} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Field 1: ATTRIBUTE * */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4, letterSpacing: '0.03em' }}>
                    ATTRIBUTE *
                  </label>
                  <select
                    required
                    value={selectedAttrId}
                    onChange={e => {
                      setSelectedAttrId(e.target.value);
                      setAddAttrError(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      background: '#FFF',
                      outline: 'none',
                      color: selectedAttrId ? '#0F172A' : '#64748B'
                    }}
                  >
                    <option value="">[ Select Attribute ▼ ]</option>
                    {availableList.map(attr => {
                      const attrId = attr.attribute_id || attr.id!;
                      const code = attr.attribute_code || attr.code;
                      const name = attr.attribute_name || attr.name;
                      const uom = attr.unit_of_measure ? ` (${attr.unit_of_measure})` : '';
                      return (
                        <option key={attrId} value={attrId}>
                          {code} — {name} [{attr.data_type}]{uom}
                        </option>
                      );
                    })}
                  </select>
                  {availableList.length === 0 && (
                    <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' }}>
                      All active attributes from Attribute Master are already assigned to this category.
                    </div>
                  )}
                </div>

                {/* Modal Footer / Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddAttrModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: '1px solid #CBD5E1',
                      background: '#FFF',
                      color: '#475569',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={availableList.length === 0}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 6,
                      border: 'none',
                      background: availableList.length === 0 ? '#94A3B8' : '#0F766E',
                      color: '#FFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: availableList.length === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Add Attribute
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
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
