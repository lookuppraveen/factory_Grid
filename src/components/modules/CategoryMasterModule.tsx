import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryMaster, SubCategoryMaster, SubSubCategoryMaster } from '../../types';
import {
  Layers, Search, Plus, Edit3, CheckCircle2, AlertTriangle,
  X, Power, Percent, ShieldAlert, ArrowLeft, ChevronRight, FolderTree
} from 'lucide-react';

export const CategoryMasterModule: React.FC = () => {
  const {
    currentRole,
    categories,
    addCategory,
    updateCategory,
    getCategoryMargin,
    getCategoryMarginConfig,
    setActiveTab,
    subCategories,
    addSubCategory,
    updateSubCategory,
    subSubCategories,
    addSubSubCategory,
    updateSubSubCategory
  } = useApp();

  // ── Active Navigation State:
  // selectedCategoryForSubCats = null -> Category Master (Level 1)
  // selectedCategoryForSubCats != null && selectedSubCategoryForSubSubCats == null -> Sub-Category Management Page (Level 2)
  // selectedCategoryForSubCats != null && selectedSubCategoryForSubSubCats != null -> Sub-Sub-Category Management Page (Level 3)
  const [selectedCategoryForSubCats, setSelectedCategoryForSubCats] = useState<CategoryMaster | null>(null);
  const [selectedSubCategoryForSubSubCats, setSelectedSubCategoryForSubSubCats] = useState<SubCategoryMaster | null>(null);

  // ── Global Toast ──
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ── Category Master View States (Level 1) ──
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryMaster | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);

  // ── Sub-Category Management View States (Level 2) ──
  const [subSearchTerm, setSubSearchTerm] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryMaster | null>(null);
  const [deactivateConfirmSubCat, setDeactivateConfirmSubCat] = useState<SubCategoryMaster | null>(null);
  const [subFormData, setSubFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [subFormError, setSubFormError] = useState<string | null>(null);

  // ── Sub-Sub-Category Management View States (Level 3) ──
  const [subSubSearchTerm, setSubSubSearchTerm] = useState('');
  const [subSubStatusFilter, setSubSubStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [isSubSubModalOpen, setIsSubSubModalOpen] = useState(false);
  const [editingSubSubCategory, setEditingSubSubCategory] = useState<SubSubCategoryMaster | null>(null);
  const [deactivateConfirmSubSubCat, setDeactivateConfirmSubSubCat] = useState<SubSubCategoryMaster | null>(null);
  const [subSubFormData, setSubSubFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive'
  });
  const [subSubFormError, setSubSubFormError] = useState<string | null>(null);

  // ── URL ROUTING & DEEP LINK SYNCHRONIZATION ──
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();

      // Check Level 3: /admin/category-master/:catSlug/subcategories/:subSlug/sub-subcategories
      const subSubMatch = path.match(/(?:category-master|categories)\/([^/]+)\/subcategories\/([^/]+)\/(?:sub-subcategories|subsubcategories|sub-sub-categories)/);
      if (subSubMatch && categories.length > 0) {
        const catSlug = subSubMatch[1];
        const subSlug = subSubMatch[2];

        const matchedCat = categories.find(c =>
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === catSlug ||
          c.name.toLowerCase() === catSlug ||
          c.id.toLowerCase() === catSlug ||
          c.code.toLowerCase() === catSlug ||
          (catSlug.includes('nutra') && c.id === 'cat_nutra') ||
          (catSlug.includes('drug') && c.id === 'cat_drugs') ||
          (catSlug.includes('cosm') && c.id === 'cat_cos') ||
          (catSlug.includes('ayur') && c.id === 'cat_ayur') ||
          (catSlug.includes('vet') && c.id === 'cat_vet') ||
          (catSlug.includes('surg') && c.id === 'cat_surg')
        );

        if (matchedCat) {
          setSelectedCategoryForSubCats(matchedCat);
          const matchedSub = (subCategories || []).find(s =>
            (s.categoryId === matchedCat.id || s.parentCategory.toLowerCase() === matchedCat.name.toLowerCase()) &&
            (s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === subSlug ||
             s.name.toLowerCase() === subSlug ||
             s.id.toLowerCase() === subSlug ||
             s.code.toLowerCase() === subSlug)
          );
          if (matchedSub) {
            setSelectedSubCategoryForSubSubCats(matchedSub);
            return;
          }
        }
      }

      // Check Level 2: /admin/category-master/:slug/subcategories
      const subMatch = path.match(/(?:category-master|categories)\/([^/]+)\/subcategories/);
      if (subMatch && categories.length > 0 && !path.includes('sub-subcategories') && !path.includes('subsubcategories')) {
        const targetSlug = subMatch[1];
        const matched = categories.find(c =>
          c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug ||
          c.name.toLowerCase() === targetSlug ||
          c.id.toLowerCase() === targetSlug ||
          c.code.toLowerCase() === targetSlug ||
          (targetSlug.includes('nutra') && c.id === 'cat_nutra') ||
          (targetSlug.includes('drug') && c.id === 'cat_drugs') ||
          (targetSlug.includes('cosm') && c.id === 'cat_cos') ||
          (targetSlug.includes('ayur') && c.id === 'cat_ayur') ||
          (targetSlug.includes('vet') && c.id === 'cat_vet') ||
          (targetSlug.includes('surg') && c.id === 'cat_surg')
        );
        if (matched) {
          setSelectedCategoryForSubCats(matched);
          setSelectedSubCategoryForSubSubCats(null);
          return;
        }
      }

      // Level 1: Category Master root
      if (path.includes('category-master') && !path.includes('subcategories')) {
        setSelectedCategoryForSubCats(null);
        setSelectedSubCategoryForSubSubCats(null);
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [categories, subCategories]);

  // Navigate to Sub-Category Management Page (Level 2)
  const handleNavigateToSubCategories = (cat: CategoryMaster) => {
    setSelectedCategoryForSubCats(cat);
    setSelectedSubCategoryForSubSubCats(null);
    setSubSearchTerm('');
    setSubStatusFilter('ALL');
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetPath = `/admin/category-master/${slug}/subcategories`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ categoryId: cat.id }, '', targetPath);
    }
  };

  // Navigate to Sub-Sub-Category Management Page (Level 3)
  const handleNavigateToSubSubCategories = (sub: SubCategoryMaster) => {
    if (!selectedCategoryForSubCats) return;
    setSelectedSubCategoryForSubSubCats(sub);
    setSubSubSearchTerm('');
    setSubSubStatusFilter('ALL');
    const catSlug = selectedCategoryForSubCats.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const subSlug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetPath = `/admin/category-master/${catSlug}/subcategories/${subSlug}/sub-subcategories`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ categoryId: selectedCategoryForSubCats.id, subCategoryId: sub.id }, '', targetPath);
    }
  };

  // Navigate back from Sub-Sub-Categories (Level 3) to Sub-Categories (Level 2)
  const handleNavigateBackToSubCategories = () => {
    setSelectedSubCategoryForSubSubCats(null);
    if (selectedCategoryForSubCats) {
      const catSlug = selectedCategoryForSubCats.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const targetPath = `/admin/category-master/${catSlug}/subcategories`;
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ categoryId: selectedCategoryForSubCats.id }, '', targetPath);
      }
    } else {
      handleNavigateBack();
    }
  };

  // Navigate back to Category Master main list (Level 1)
  const handleNavigateBack = () => {
    setSelectedCategoryForSubCats(null);
    setSelectedSubCategoryForSubSubCats(null);
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin/category-master') {
      window.history.pushState({}, '', '/admin/category-master');
    }
  };

  // ── Auto-dismiss Success Toast ──
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // ── Category Stats ──
  const categoryStats = useMemo(() => {
    const activeCount = categories.filter(c => c.status === 'Active').length;
    const inactiveCount = categories.length - activeCount;

    return {
      total: categories.length,
      active: activeCount,
      inactive: inactiveCount
    };
  }, [categories]);

  // ── Filtered Categories (Main List) ──
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        cat.name.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || cat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  // ── Sub-Categories belonging ONLY to the selected category ──
  const currentCategorySubList = useMemo(() => {
    if (!selectedCategoryForSubCats) return [];
    const parentId = selectedCategoryForSubCats.id;
    const parentName = selectedCategoryForSubCats.name.toLowerCase().trim();

    return subCategories.filter(s =>
      s.categoryId === parentId ||
      s.parentCategory.toLowerCase().trim() === parentName ||
      (parentName.includes('nutraceutical') && s.parentCategory.toLowerCase().includes('nutraceutical'))
    );
  }, [subCategories, selectedCategoryForSubCats]);

  // ── Filtered Sub-Categories ──
  const filteredSubCategories = useMemo(() => {
    return currentCategorySubList.filter(sub => {
      const q = subSearchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        sub.name.toLowerCase().includes(q) ||
        sub.code.toLowerCase().includes(q) ||
        (sub.description || '').toLowerCase().includes(q);

      const matchesStatus = subStatusFilter === 'ALL' || sub.status === subStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentCategorySubList, subSearchTerm, subStatusFilter]);

  // ── Dynamic Sub-Category Stats ──
  const subCategoryStats = useMemo(() => {
    const total = currentCategorySubList.length;
    const active = currentCategorySubList.filter(s => s.status === 'Active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [currentCategorySubList]);

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
          Category Master administration is restricted to <strong>Platform Administrators</strong>.
        </p>
      </div>
    );
  }

  // ── CATEGORY HANDLERS ──
  const handleOpenCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      code: '',
      description: '',
      status: 'Active'
    });
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat: CategoryMaster) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      status: cat.status
    });
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleCategoryNameChange = (name: string) => {
    if (!editingCategory) {
      const generatedCode = 'CAT-' + name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      setCategoryFormData(prev => ({ ...prev, name, code: generatedCode }));
    } else {
      setCategoryFormData(prev => ({ ...prev, name }));
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = categoryFormData.name.trim();
    const cleanCode = categoryFormData.code.trim().toUpperCase();

    if (!cleanName) {
      setCategoryFormError('Category Name is required.');
      return;
    }
    if (!cleanCode) {
      setCategoryFormError('Category Code is required (e.g. CAT-DRG).');
      return;
    }

    const duplicate = categories.some(c =>
      (!editingCategory || c.id !== editingCategory.id) &&
      (c.name.toLowerCase() === cleanName.toLowerCase() || c.code.toLowerCase() === cleanCode.toLowerCase())
    );
    if (duplicate) {
      setCategoryFormError(`A category with name "${cleanName}" or code "${cleanCode}" already exists.`);
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: cleanName,
        code: cleanCode,
        description: categoryFormData.description.trim() || undefined,
        status: 'Active'
      });
      setSuccessToast(`Category "${cleanName}" updated successfully.`);
    } else {
      const newCat: CategoryMaster = {
        id: `cat_${Date.now()}`,
        name: cleanName,
        code: cleanCode,
        description: categoryFormData.description.trim() || undefined,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        productCount: 0
      };
      addCategory(newCat);
      setSuccessToast(`Category "${cleanName}" created successfully.`);
    }

    setIsCategoryModalOpen(false);
  };

  // ── SUB-CATEGORY HANDLERS ──
  const handleOpenCreateSubModal = () => {
    if (!selectedCategoryForSubCats) return;
    setEditingSubCategory(null);
    const catCodePrefix = selectedCategoryForSubCats.code.replace('CAT-', '');
    setSubFormData({
      name: '',
      code: `SUB-${catCodePrefix}-`,
      description: '',
      status: 'Active'
    });
    setSubFormError(null);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSubModal = (sub: SubCategoryMaster) => {
    setEditingSubCategory(sub);
    setSubFormData({
      name: sub.name,
      code: sub.code,
      description: sub.description || '',
      status: sub.status
    });
    setSubFormError(null);
    setIsSubModalOpen(true);
  };

  const handleSubNameChange = (name: string) => {
    if (!editingSubCategory && selectedCategoryForSubCats) {
      const catCodePrefix = selectedCategoryForSubCats.code.replace('CAT-', '');
      const subSuffix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      setSubFormData(prev => ({
        ...prev,
        name,
        code: `SUB-${catCodePrefix}-${subSuffix}`
      }));
    } else {
      setSubFormData(prev => ({ ...prev, name }));
    }
  };

  const handleSaveSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForSubCats) return;

    const cleanName = subFormData.name.trim();
    const cleanCode = subFormData.code.trim().toUpperCase();

    if (!cleanName) {
      setSubFormError('Sub-Category Name is required.');
      return;
    }
    if (!cleanCode) {
      setSubFormError('Sub-Category Code is required (e.g. SUB-DRG-TAB).');
      return;
    }

    const duplicate = currentCategorySubList.some(s =>
      (!editingSubCategory || s.id !== editingSubCategory.id) &&
      (s.name.toLowerCase() === cleanName.toLowerCase() || s.code.toLowerCase() === cleanCode.toLowerCase())
    );
    if (duplicate) {
      setSubFormError(`A sub-category with name "${cleanName}" or code "${cleanCode}" already exists under ${selectedCategoryForSubCats.name}.`);
      return;
    }

    if (editingSubCategory) {
      updateSubCategory(editingSubCategory.id, {
        name: cleanName,
        code: cleanCode,
        description: subFormData.description.trim() || undefined,
        status: subFormData.status
      });
      setSuccessToast(`Sub-category "${cleanName}" updated successfully.`);
    } else {
      const newSub: SubCategoryMaster = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        categoryId: selectedCategoryForSubCats.id,
        parentCategory: selectedCategoryForSubCats.name,
        name: cleanName,
        code: cleanCode,
        description: subFormData.description.trim() || undefined,
        status: subFormData.status,
        createdAt: new Date().toISOString().split('T')[0]
      };
      addSubCategory(newSub);
      setSuccessToast(`Sub-category "${cleanName}" created under ${selectedCategoryForSubCats.name}.`);
    }

    setIsSubModalOpen(false);
  };

  // ── SUB-CATEGORY LIFECYCLE HANDLERS (No permanent delete) ──
  const handleConfirmDeactivateSubCategory = () => {
    if (!deactivateConfirmSubCat) return;
    updateSubCategory(deactivateConfirmSubCat.id, { status: 'Inactive' });
    setSuccessToast('Sub-category deactivated successfully.');
    setDeactivateConfirmSubCat(null);
  };

  const handleActivateSubCategory = (sub: SubCategoryMaster) => {
    updateSubCategory(sub.id, { status: 'Active' });
    setSuccessToast('Sub-category activated successfully.');
  };

  // ── Sub-Sub-Categories belonging ONLY to the selected sub-category ──
  const currentSubSubList = useMemo(() => {
    if (!selectedSubCategoryForSubSubCats) return [];
    const parentSubId = selectedSubCategoryForSubSubCats.id;
    const parentSubName = selectedSubCategoryForSubSubCats.name.toLowerCase().trim();

    return (subSubCategories || []).filter(s =>
      s.subCategoryId === parentSubId ||
      (s.parentSubCategory && s.parentSubCategory.toLowerCase().trim() === parentSubName)
    );
  }, [subSubCategories, selectedSubCategoryForSubSubCats]);

  // ── Filtered Sub-Sub-Categories ──
  const filteredSubSubCategories = useMemo(() => {
    return currentSubSubList.filter(ssc => {
      const q = subSubSearchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        ssc.name.toLowerCase().includes(q) ||
        ssc.code.toLowerCase().includes(q) ||
        (ssc.description || '').toLowerCase().includes(q);

      const matchesStatus = subSubStatusFilter === 'ALL' || ssc.status === subSubStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentSubSubList, subSubSearchTerm, subSubStatusFilter]);

  // ── Dynamic Sub-Sub-Category Stats ──
  const subSubCategoryStats = useMemo(() => {
    const total = currentSubSubList.length;
    const active = currentSubSubList.filter(s => s.status === 'Active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [currentSubSubList]);

  // ── Parent Deactivated Check ──
  const isParentDeactivated =
    selectedCategoryForSubCats?.status === 'Inactive' ||
    selectedSubCategoryForSubSubCats?.status === 'Inactive';

  // ── SUB-SUB-CATEGORY HANDLERS ──
  const handleOpenCreateSubSubModal = () => {
    if (!selectedCategoryForSubCats || !selectedSubCategoryForSubSubCats) return;
    if (isParentDeactivated) {
      alert(`Cannot create sub-sub-category: Parent record is deactivated.`);
      return;
    }
    setEditingSubSubCategory(null);
    const subCodeClean = selectedSubCategoryForSubSubCats.code.replace(/^(SUB-|SSC-)/, '');
    setSubSubFormData({
      name: '',
      code: `SSC-${subCodeClean}-`,
      description: '',
      status: 'Active'
    });
    setSubSubFormError(null);
    setIsSubSubModalOpen(true);
  };

  const handleOpenEditSubSubModal = (ssc: SubSubCategoryMaster) => {
    setEditingSubSubCategory(ssc);
    setSubSubFormData({
      name: ssc.name,
      code: ssc.code,
      description: ssc.description || '',
      status: ssc.status
    });
    setSubSubFormError(null);
    setIsSubSubModalOpen(true);
  };

  const handleSubSubNameChange = (name: string) => {
    if (!editingSubSubCategory && selectedSubCategoryForSubSubCats) {
      const subCodeClean = selectedSubCategoryForSubSubCats.code.replace(/^(SUB-|SSC-)/, '');
      const sscSuffix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      setSubSubFormData(prev => ({
        ...prev,
        name,
        code: `SSC-${subCodeClean}-${sscSuffix}`
      }));
    } else {
      setSubSubFormData(prev => ({ ...prev, name }));
    }
  };

  const handleSaveSubSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForSubCats || !selectedSubCategoryForSubSubCats) return;

    if (isParentDeactivated && !editingSubSubCategory) {
      setSubSubFormError('Cannot create new sub-sub-categories under a deactivated parent category or sub-category.');
      return;
    }

    const cleanName = subSubFormData.name.trim();
    const cleanCode = subSubFormData.code.trim().toUpperCase();

    if (!cleanName) {
      setSubSubFormError('Sub-Sub-Category Name is required.');
      return;
    }
    if (!cleanCode) {
      setSubSubFormError('Sub-Sub-Category Code is required (e.g. SSC-DRG-TAB-UNC).');
      return;
    }

    const duplicate = currentSubSubList.some(s =>
      (!editingSubSubCategory || s.id !== editingSubSubCategory.id) &&
      (s.name.toLowerCase() === cleanName.toLowerCase() || s.code.toLowerCase() === cleanCode.toLowerCase())
    );
    if (duplicate) {
      setSubSubFormError(`A sub-sub-category with name "${cleanName}" or code "${cleanCode}" already exists under ${selectedSubCategoryForSubSubCats.name}.`);
      return;
    }

    if (editingSubSubCategory) {
      updateSubSubCategory(editingSubSubCategory.id, {
        name: cleanName,
        code: cleanCode,
        description: subSubFormData.description.trim() || undefined,
        status: subSubFormData.status
      });
      setSuccessToast(`Sub-sub-category "${cleanName}" updated successfully.`);
    } else {
      const newSubSub: SubSubCategoryMaster = {
        id: `ssc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subCategoryId: selectedSubCategoryForSubSubCats.id,
        categoryId: selectedCategoryForSubCats.id,
        parentCategory: selectedCategoryForSubCats.name,
        parentSubCategory: selectedSubCategoryForSubSubCats.name,
        name: cleanName,
        code: cleanCode,
        description: subSubFormData.description.trim() || undefined,
        status: subSubFormData.status,
        createdAt: new Date().toISOString().split('T')[0]
      };
      addSubSubCategory(newSubSub);
      setSuccessToast(`Sub-sub-category "${cleanName}" created under ${selectedSubCategoryForSubSubCats.name}.`);
    }

    setIsSubSubModalOpen(false);
  };

  const handleConfirmDeactivateSubSubCategory = () => {
    if (!deactivateConfirmSubSubCat) return;
    updateSubSubCategory(deactivateConfirmSubSubCat.id, { status: 'Inactive' });
    setSuccessToast('Sub-sub-category deactivated successfully.');
    setDeactivateConfirmSubSubCat(null);
  };

  const handleActivateSubSubCategory = (ssc: SubSubCategoryMaster) => {
    updateSubSubCategory(ssc.id, { status: 'Active' });
    setSuccessToast('Sub-sub-category activated successfully.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* ── Floating Toast Alert ── */}
      {successToast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: '#0F766E', color: '#FFFFFF', padding: '12px 18px',
          borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700
        }}>
          <CheckCircle2 size={18} style={{ color: '#5EEAD4' }} />
          <span>{successToast}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          VIEW 3: DEDICATED SUB-SUB-CATEGORY MANAGEMENT PAGE (Level 3)
          ══════════════════════════════════════════════════════════════════════════ */}
      {selectedCategoryForSubCats && selectedSubCategoryForSubSubCats ? (
        <>
          {/* ── Breadcrumb Navigation ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>
            <span
              onClick={handleNavigateBack}
              style={{ color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              title="Return to Category Master"
            >
              Category Master
            </span>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <span
              onClick={handleNavigateBackToSubCategories}
              style={{ color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              title={`Return to ${selectedCategoryForSubCats.name} Sub-Categories`}
            >
              {selectedCategoryForSubCats.name}
            </span>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <span style={{ color: '#0F172A' }}>{selectedSubCategoryForSubSubCats.name}</span>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <span style={{ color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
              Sub-Sub-Categories
            </span>
          </div>

          {/* ── Dedicated Sub-Sub-Category Header Bar ── */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  Category: {selectedCategoryForSubCats.name}
                </span>
                <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284C7' }}>
                  Sub-Category: {selectedSubCategoryForSubSubCats.name}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: '#F1F5F9', color: '#0F766E', padding: '1px 6px', borderRadius: 4, border: '1px solid #CBD5E1' }}>
                  {selectedSubCategoryForSubSubCats.code}
                </span>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                  background: selectedSubCategoryForSubSubCats.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                  color: selectedSubCategoryForSubSubCats.status === 'Active' ? '#15803D' : '#B91C1C'
                }}>
                  {selectedSubCategoryForSubSubCats.status}
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Sub-Sub-Categories
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                Manage all sub-sub-categories belonging strictly to <strong>{selectedCategoryForSubCats.name} &rarr; {selectedSubCategoryForSubSubCats.name}</strong>. Maximum taxonomy depth: 3 levels.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleNavigateBackToSubCategories}
                style={{
                  padding: '10px 18px', borderRadius: 8, background: '#F8FAFC',
                  color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
              >
                <ArrowLeft size={15} /> Back to Sub-Categories
              </button>
              <button
                onClick={handleOpenCreateSubSubModal}
                disabled={isParentDeactivated}
                title={isParentDeactivated ? 'Cannot add sub-sub-category: Parent record is deactivated' : 'Add new sub-sub-category'}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  background: isParentDeactivated ? '#94A3B8' : '#0F766E',
                  color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: isParentDeactivated ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: isParentDeactivated ? 'none' : '0 1px 3px rgba(15,118,110,0.25)',
                  transition: 'background 0.15s ease',
                  opacity: isParentDeactivated ? 0.7 : 1
                }}
                onMouseEnter={e => { if (!isParentDeactivated) e.currentTarget.style.background = '#115E59'; }}
                onMouseLeave={e => { if (!isParentDeactivated) e.currentTarget.style.background = '#0F766E'; }}
              >
                <Plus size={16} /> + Add Sub-Sub-Category
              </button>
            </div>
          </div>

          {/* ── Parent Deactivated Warning Banner ── */}
          {isParentDeactivated && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
              padding: '12px 16px', color: '#B45309', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600
            }}>
              <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0 }} />
              <span>
                Parent record is Inactive ({selectedCategoryForSubCats.status === 'Inactive' ? `Category "${selectedCategoryForSubCats.name}"` : `Sub-Category "${selectedSubCategoryForSubSubCats.name}"`} is Inactive). Creating new sub-sub-categories is disabled until the parent is activated.
              </span>
            </div>
          )}

          {/* ── Sub-Sub-Category KPI Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sub-Sub-Categories</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                {subSubCategoryStats.total}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Defined under {selectedSubCategoryForSubSubCats.name}</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                {subSubCategoryStats.active}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Enabled for product catalog</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inactive</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#64748B', fontFamily: 'monospace', marginTop: 4 }}>
                {subSubCategoryStats.inactive}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Archived or disabled</div>
            </div>
          </div>

          {/* ── Sub-Sub-Category Search & Filter Toolbar ── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder={`Search sub-sub-categories in ${selectedSubCategoryForSubSubCats.name}...`}
                value={subSubSearchTerm}
                onChange={e => setSubSubSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
              {subSubSearchTerm && (
                <button onClick={() => setSubSubSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
              <select
                value={subSubStatusFilter}
                onChange={e => setSubSubStatusFilter(e.target.value as any)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All ({currentSubSubList.length})</option>
                <option value="Active">Active ({subSubCategoryStats.active})</option>
                <option value="Inactive">Inactive ({subSubCategoryStats.inactive})</option>
              </select>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, paddingLeft: 6 }}>
                Showing {filteredSubSubCategories.length} of {currentSubSubList.length}
              </span>
            </div>
          </div>

          {/* ── Sub-Sub-Category Data Table ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUB-SUB-CATEGORY</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CODE</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CREATED / UPDATED</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubSubCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B', background: '#F8FAFC' }}>
                      <FolderTree size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No sub-sub-categories found under {selectedSubCategoryForSubSubCats.name}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                        Get started by creating the first sub-sub-category under {selectedCategoryForSubCats.name} &rarr; {selectedSubCategoryForSubSubCats.name}.
                      </div>
                      <button
                        onClick={handleOpenCreateSubSubModal}
                        disabled={isParentDeactivated}
                        style={{
                          padding: '8px 16px', borderRadius: 6,
                          background: isParentDeactivated ? '#94A3B8' : '#0F766E',
                          color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 12.5,
                          cursor: isParentDeactivated ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Plus size={15} /> + Add Sub-Sub-Category
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredSubSubCategories.map(ssc => (
                    <tr
                      key={ssc.id}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ssc.status === 'Active' ? '#10B981' : '#94A3B8' }} />
                          <span style={{ fontSize: 13.5 }}>{ssc.name}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11.5, background: '#F1F5F9', color: '#0F766E', padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                          {ssc.code}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 340 }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ssc.description || 'No description'}>
                          {ssc.description || '—'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: ssc.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                          color: ssc.status === 'Active' ? '#15803D' : '#B91C1C',
                          border: ssc.status === 'Active' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                        }}>
                          {ssc.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 11.5 }}>
                        {ssc.updatedAt || ssc.createdAt || '2026-08-10'}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleOpenEditSubSubModal(ssc)}
                            title="Edit Sub-Sub-Category"
                            style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>

                          {ssc.status === 'Active' ? (
                            <button
                              onClick={() => setDeactivateConfirmSubSubCat(ssc)}
                              title="Deactivate Sub-Sub-Category"
                              style={{
                                padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                background: '#FFFBEB',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Power size={13} /> Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateSubSubCategory(ssc)}
                              title="Activate Sub-Sub-Category"
                              style={{
                                padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                background: '#ECFDF5',
                                color: '#047857',
                                border: '1px solid #A7F3D0',
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <CheckCircle2 size={13} /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : selectedCategoryForSubCats ? (
        /* ══════════════════════════════════════════════════════════════════════════
           VIEW 2: DEDICATED SUB-CATEGORY MANAGEMENT PAGE (Level 2)
           ══════════════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Breadcrumb Navigation ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: '#64748B' }}>
            <span
              onClick={handleNavigateBack}
              style={{ color: '#0F766E', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              title="Return to Category Master"
            >
              Category Master
            </span>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <span style={{ color: '#0F172A' }}>{selectedCategoryForSubCats.name}</span>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <span style={{ color: '#0F766E', background: '#F0FDFA', padding: '2px 8px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
              Sub-Categories
            </span>
          </div>

          {/* ── Dedicated Sub-Category Header Bar ── */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  {selectedCategoryForSubCats.name}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11, background: '#F1F5F9', color: '#0F766E', padding: '1px 6px', borderRadius: 4, border: '1px solid #CBD5E1' }}>
                  {selectedCategoryForSubCats.code}
                </span>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                  background: selectedCategoryForSubCats.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                  color: selectedCategoryForSubCats.status === 'Active' ? '#15803D' : '#B91C1C'
                }}>
                  {selectedCategoryForSubCats.status}
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Sub-Categories
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                Manage all sub-categories belonging strictly to the <strong>{selectedCategoryForSubCats.name}</strong> category. Click <strong>Manage Sub-Sub-Categories &rarr;</strong> to configure 3rd-level taxonomy.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleNavigateBack}
                style={{
                  padding: '10px 18px', borderRadius: 8, background: '#F8FAFC',
                  color: '#334155', border: '1px solid #CBD5E1', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
              >
                <ArrowLeft size={15} /> Back to Category Master
              </button>
              <button
                onClick={handleOpenCreateSubModal}
                style={{
                  padding: '10px 20px', borderRadius: 8, background: '#0F766E',
                  color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 1px 3px rgba(15,118,110,0.25)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#115E59'}
                onMouseLeave={e => e.currentTarget.style.background = '#0F766E'}
              >
                <Plus size={16} /> + Add Sub-Category
              </button>
            </div>
          </div>

          {/* ── Sub-Category KPI Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sub-Categories</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                {subCategoryStats.total}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Defined under {selectedCategoryForSubCats.name}</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                {subCategoryStats.active}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Enabled for products</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inactive</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#64748B', fontFamily: 'monospace', marginTop: 4 }}>
                {subCategoryStats.inactive}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Archived or disabled</div>
            </div>
          </div>

          {/* ── Sub-Category Search & Filter Toolbar ── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder={`Search sub-categories in ${selectedCategoryForSubCats.name}...`}
                value={subSearchTerm}
                onChange={e => setSubSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
              {subSearchTerm && (
                <button onClick={() => setSubSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
              <select
                value={subStatusFilter}
                onChange={e => setSubStatusFilter(e.target.value as any)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All ({currentCategorySubList.length})</option>
                <option value="Active">Active ({subCategoryStats.active})</option>
                <option value="Inactive">Inactive ({subCategoryStats.inactive})</option>
              </select>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600, paddingLeft: 6 }}>
                Showing {filteredSubCategories.length} of {currentCategorySubList.length}
              </span>
            </div>
          </div>

          {/* ── Sub-Category Data Table ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUB-CATEGORY</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CODE</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUB-SUB-CATEGORIES</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CREATED / UPDATED</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B', background: '#F8FAFC' }}>
                      <FolderTree size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No sub-categories found under {selectedCategoryForSubCats.name}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                        Get started by creating the first sub-category under {selectedCategoryForSubCats.name}.
                      </div>
                      <button
                        onClick={handleOpenCreateSubModal}
                        style={{
                          padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                          border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <Plus size={15} /> + Add Sub-Category
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredSubCategories.map(sub => {
                    const subSubList = (subSubCategories || []).filter(ssc =>
                      ssc.subCategoryId === sub.id ||
                      (ssc.parentSubCategory && ssc.parentSubCategory.toLowerCase() === sub.name.toLowerCase())
                    );
                    const subSubCount = subSubList.length;
                    const activeSubSubCount = subSubList.filter(s => s.status === 'Active').length;

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => handleNavigateToSubSubCategories(sub)}
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F0FDFA'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        title={`Click to open ${sub.name} Sub-Sub-Category Management page`}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sub.status === 'Active' ? '#10B981' : '#94A3B8' }} />
                            <span style={{ fontSize: 13.5 }}>{sub.name}</span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11.5, background: '#F1F5F9', color: '#0F766E', padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                            {sub.code}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToSubSubCategories(sub);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1',
                              cursor: 'pointer'
                            }}
                            title={`Click to view ${subSubCount} sub-sub-categories under ${sub.name}`}
                          >
                            <FolderTree size={13} /> {subSubCount} {subSubCount === 1 ? 'Sub-Sub-Category' : 'Sub-Sub-Categories'}
                            {subSubCount > 0 && subSubCount !== activeSubSubCount && (
                              <span style={{ fontSize: 10.5, color: '#047857', background: '#DCFCE7', padding: '1px 5px', borderRadius: 4, marginLeft: 2 }}>{activeSubSubCount} Active</span>
                            )}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#475569', maxWidth: 300 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.description || 'No description'}>
                            {sub.description || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                            background: sub.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                            color: sub.status === 'Active' ? '#15803D' : '#B91C1C',
                            border: sub.status === 'Active' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                          }}>
                            {sub.status}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 11.5 }}>
                          {sub.updatedAt || sub.createdAt || '2026-08-10'}
                        </td>

                        <td onClick={e => e.stopPropagation()} style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditSubModal(sub)}
                              title="Edit Sub-Category"
                              style={{ padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6, background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            {sub.status === 'Active' ? (
                              <button
                                onClick={() => setDeactivateConfirmSubCat(sub)}
                                title="Deactivate Sub-Category"
                                style={{
                                  padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                  background: '#FFFBEB',
                                  color: '#B45309',
                                  border: '1px solid #FDE68A',
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Power size={13} /> Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateSubCategory(sub)}
                                title="Activate Sub-Category"
                                style={{
                                  padding: '6px 10px', fontSize: 11.5, fontWeight: 700, borderRadius: 6,
                                  background: '#ECFDF5',
                                  color: '#047857',
                                  border: '1px solid #A7F3D0',
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <CheckCircle2 size={13} /> Activate
                              </button>
                            )}

                            <button
                              onClick={() => handleNavigateToSubSubCategories(sub)}
                              title={`Open dedicated ${sub.name} Sub-Sub-Category Management page`}
                              style={{
                                padding: '6px 12px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                border: 'none', fontWeight: 800, fontSize: 11.5, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                boxShadow: '0 1px 2px rgba(15,118,110,0.2)',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#115E59'}
                              onMouseLeave={e => e.currentTarget.style.background = '#0F766E'}
                            >
                              <span>Manage Sub-Sub-Categories</span>
                              <span style={{ fontSize: 12, fontWeight: 900 }}>→</span>
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
        </>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           VIEW 2: MAIN CATEGORY MASTER PAGE (Parent Categories)
           ══════════════════════════════════════════════════════════════════════════ */
        <>
          {/* ── Top Header Bar ── */}
          <div style={{
            background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24,
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', border: '1px solid rgba(15, 118, 110, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
                <Layers size={24} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
                  ADMINISTRATION & TAXONOMY
                </div>
                <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  CATEGORY MASTER
                </h1>
                <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                  Define parent categories and manage child sub-categories. Click any category or <strong>Manage Sub-Categories →</strong> to manage its sub-categories.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setActiveTab('margin-engine')}
                style={{
                  padding: '10px 16px', borderRadius: 8, background: '#F8FAFC',
                  color: '#0F766E', border: '1px solid #CBD5E1', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                <Percent size={15} /> Margin Engine →
              </button>
              <button
                onClick={handleOpenCreateCategoryModal}
                style={{
                  padding: '10px 20px', borderRadius: 8, background: '#0F766E',
                  color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 1px 3px rgba(15,118,110,0.25)'
                }}
              >
                <Plus size={16} /> + Add Category
              </button>
            </div>
          </div>

          {/* ── KPI Summary Cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Categories</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                {categoryStats.total}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Parent categories</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Categories</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 4 }}>
                {categoryStats.active}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Available in catalog</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Sub-Categories</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0284C7', fontFamily: 'monospace', marginTop: 4 }}>
                {subCategories.length}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Managed under parent categories</div>
            </div>
          </div>

          {/* ── Search & Filter Bar ── */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search category name, code, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', fontSize: 13, borderRadius: 6, border: '1px solid #CBD5E1', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="ALL">All Statuses ({categories.length})</option>
                <option value="Active">Active ({categoryStats.active})</option>
                <option value="Inactive">Inactive ({categoryStats.inactive})</option>
              </select>
            </div>
          </div>

          {/* ── Category Master Data Table ── */}
          <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CATEGORY NAME</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>CODE</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>SUB-CATEGORIES</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>MARGIN (%)</th>
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B', background: '#F8FAFC' }}>
                      <Layers size={32} style={{ color: '#94A3B8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No categories found</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Try modifying your search or click "+ Add Category" above.</div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map(cat => {
                    const marginConfig = getCategoryMarginConfig ? getCategoryMarginConfig(cat.name) : { marginType: 'PERCENTAGE', marginValue: getCategoryMargin(cat.name) };
                    const marginDisplay = marginConfig.marginType === 'FIXED_RATE' ? `₹${marginConfig.marginValue}/unit` : `${marginConfig.marginValue}%`;
                    const catSubList = subCategories.filter(s =>
                      s.categoryId === cat.id ||
                      s.parentCategory.toLowerCase() === cat.name.toLowerCase() ||
                      (cat.name.toLowerCase().includes('nutraceutical') && s.parentCategory.toLowerCase().includes('nutraceutical'))
                    );
                    const catSubCount = catSubList.length;
                    const catActiveSubCount = catSubList.filter(s => s.status === 'Active').length;

                    return (
                      <tr
                        key={cat.id}
                        onClick={() => handleNavigateToSubCategories(cat)}
                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F0FDFA'}
                        onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                        title={`Click to open ${cat.name} Sub-Category Management page`}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.status === 'Active' ? '#10B981' : '#94A3B8' }} />
                            <span style={{ color: '#0F172A', fontSize: 14, fontWeight: 800 }}>
                              {cat.name}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 14px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11.5, background: '#F1F5F9', color: '#0F766E', padding: '3px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                            {cat.code}
                          </span>
                        </td>

                        <td style={{ padding: '14px 14px' }}>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigateToSubCategories(cat);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                              background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1',
                              cursor: 'pointer'
                            }}
                            title={`Click to view ${catSubCount} sub-categories under ${cat.name}`}
                          >
                            <FolderTree size={13} /> {catSubCount} {catSubCount === 1 ? 'Sub-Category' : 'Sub-Categories'}
                            {catSubCount > 0 && catSubCount !== catActiveSubCount && (
                              <span style={{ fontSize: 10.5, color: '#047857', background: '#DCFCE7', padding: '1px 5px', borderRadius: 4, marginLeft: 2 }}>{catActiveSubCount} Active</span>
                            )}
                          </span>
                        </td>

                        <td style={{ padding: '14px 14px', color: '#475569', maxWidth: 260 }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cat.description || 'No description provided'}>
                            {cat.description || '—'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 14px' }} onClick={e => e.stopPropagation()}>
                          <span
                            onClick={() => setActiveTab('margin-engine')}
                            title="Click to view in Margin Engine"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 12, fontWeight: 800, fontFamily: 'monospace',
                              padding: '3px 8px', borderRadius: 4,
                              background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0',
                              cursor: 'pointer'
                            }}
                          >
                            {marginConfig.marginType === 'FIXED_RATE' ? (
                              <span style={{ fontSize: 11, fontWeight: 800 }}>₹</span>
                            ) : (
                              <Percent size={11} />
                            )}
                            {marginDisplay}
                          </span>
                        </td>

                        <td style={{ padding: '14px 14px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                            background: cat.status === 'Active' ? '#DCFCE7' : '#FEE2E2',
                            color: cat.status === 'Active' ? '#15803D' : '#B91C1C',
                            border: cat.status === 'Active' ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                          }}>
                            {cat.status}
                          </span>
                        </td>

                        <td onClick={e => e.stopPropagation()} style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <button
                              onClick={() => handleOpenEditCategoryModal(cat)}
                              title="Edit Category"
                              style={{
                                padding: '7px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6,
                                background: '#F1F5F9', color: '#0F172A', border: '1px solid #CBD5E1',
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                              }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            <button
                              onClick={() => handleNavigateToSubCategories(cat)}
                              title={`Open dedicated ${cat.name} Sub-Category Management page`}
                              style={{
                                padding: '7px 14px', borderRadius: 6, background: '#0F766E', color: '#FFFFFF',
                                border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 1px 2px rgba(15,118,110,0.2)',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#115E59'}
                              onMouseLeave={e => e.currentTarget.style.background = '#0F766E'}
                            >
                              <span>Manage Sub-Categories</span>
                              <span style={{ fontSize: 13, fontWeight: 900 }}>→</span>
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
        </>
      )}

      {/* ── CREATE / EDIT CATEGORY MODAL ── */}
      {isCategoryModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 12, padding: 28, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Platform product taxonomy classification</div>
                </div>
              </div>
              <button onClick={() => setIsCategoryModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {categoryFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle size={16} />
                <span>{categoryFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drugs, Nutraceuticals/Food, Cosmetics, Surgical"
                  value={categoryFormData.name}
                  onChange={e => handleCategoryNameChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAT-DRG"
                    value={categoryFormData.code}
                    onChange={e => setCategoryFormData({ ...categoryFormData, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Used as taxonomy prefix</span>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Status
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value="Active (Master Record)"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, background: '#F8FAFC', color: '#15803D', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the scope of pharmaceutical / medicinal items under this category..."
                  value={categoryFormData.description}
                  onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT SUB-CATEGORY MODAL (Locked to parent category) ── */}
      {isSubModalOpen && selectedCategoryForSubCats && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setIsSubModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 12, padding: 28, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderTree size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                    {editingSubCategory ? 'Edit Sub-Category' : 'Create New Sub-Category'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {editingSubCategory ? `Editing ${editingSubCategory.name} (${editingSubCategory.code})` : `Add sub-category under ${selectedCategoryForSubCats.name}`}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsSubModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {subFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle size={16} />
                <span>{subFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Parent Category Field (Read-only / Automatically Assigned) */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Parent Category (Auto-Selected)
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={`${selectedCategoryForSubCats.name} (${selectedCategoryForSubCats.code})`}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#F1F5F9', color: '#0F766E', fontWeight: 800, cursor: 'not-allowed' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Sub-Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tablets, Effervescent Tablets, Liquid Injections, Gel/Cream"
                  value={subFormData.name}
                  onChange={e => handleSubNameChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Sub-Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUB-DRG-TAB"
                    value={subFormData.code}
                    onChange={e => setSubFormData({ ...subFormData, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>System taxonomy code</span>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={subFormData.status}
                    onChange={e => setSubFormData({ ...subFormData, status: e.target.value as any })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the formulation specifications or packaging details..."
                  value={subFormData.description}
                  onChange={e => setSubFormData({ ...subFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {editingSubCategory ? 'Save Changes' : 'Create Sub-Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE SUB-CATEGORY CONFIRMATION DIALOG ── */}
      {deactivateConfirmSubCat && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDeactivateConfirmSubCat(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Deactivate Sub-Category?</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Lifecycle status change</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This sub-category will no longer be available for active product selection.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeactivateConfirmSubCat(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivateSubCategory}
                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#D97706', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Power size={14} /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT SUB-SUB-CATEGORY MODAL (Locked to parent sub-category) ── */}
      {isSubSubModalOpen && selectedCategoryForSubCats && selectedSubCategoryForSubSubCats && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setIsSubSubModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 12, padding: 28, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderTree size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                    {editingSubSubCategory ? 'Edit Sub-Sub-Category' : 'Create New Sub-Sub-Category'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    {editingSubSubCategory ? `Editing ${editingSubSubCategory.name} (${editingSubSubCategory.code})` : `Add sub-sub-category under ${selectedCategoryForSubCats.name} → ${selectedSubCategoryForSubSubCats.name}`}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsSubSubModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {subSubFormError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <AlertTriangle size={16} />
                <span>{subSubFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubSubCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Parent Category & Sub-Category Fields (Read-only / Automatically Assigned) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Parent Category
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`${selectedCategoryForSubCats.name}`}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#F1F5F9', color: '#0F766E', fontWeight: 800, cursor: 'not-allowed' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Parent Sub-Category
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`${selectedSubCategoryForSubSubCats.name}`}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, background: '#F1F5F9', color: '#0284C7', fontWeight: 800, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Sub-Sub-Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uncoated Tablets, Film Coated Tablets, IV Injection"
                  value={subSubFormData.name}
                  onChange={e => handleSubSubNameChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Sub-Sub-Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SSC-DRG-TAB-UNC"
                    value={subSubFormData.code}
                    onChange={e => setSubSubFormData({ ...subSubFormData, code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>System taxonomy code</span>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Status
                  </label>
                  <select
                    value={subSubFormData.status}
                    onChange={e => setSubSubFormData({ ...subSubFormData, status: e.target.value as any })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe formulation specifications, packaging specifics, or chemical coatings..."
                  value={subSubFormData.description}
                  onChange={e => setSubSubFormData({ ...subSubFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsSubSubModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {editingSubSubCategory ? 'Save Changes' : 'Create Sub-Sub-Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEACTIVATE SUB-SUB-CATEGORY CONFIRMATION DIALOG ── */}
      {deactivateConfirmSubSubCat && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDeactivateConfirmSubSubCat(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', border: '1px solid #CBD5E1' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Deactivate Sub-Sub-Category?</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Lifecycle status change</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This sub-sub-category will no longer be available for active product selection.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeactivateConfirmSubSubCat(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeactivateSubSubCategory}
                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#D97706', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Power size={14} /> Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
