import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Manufacturer, ManufacturerProductMapping } from '../../types';
import { ViewModeToggle } from '../common/ViewModeToggle';
import {
  Package, Search, Factory, CheckCircle2,
  Info, X, Layers, ShieldCheck, Eye,
  RotateCcw, FileText, ChevronRight
} from 'lucide-react';

interface BuyerProductCatalogProps {
  onNavigateTab?: (tabId: string) => void;
}

export const BuyerProductCatalogModule: React.FC<BuyerProductCatalogProps> = ({ onNavigateTab }) => {
  const {
    products,
    categories,
    subCategories,
    subSubCategories,
    mappings,
    manufacturers,
    setActiveTab
  } = useApp();

  const [displayMode, setDisplayMode] = useState<'TABLE' | 'CARD'>('TABLE');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Selected Product for Details View
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Active categories from Category Master
  const categoryOptions = useMemo(() => {
    const list: string[] = [];
    (categories || []).forEach(c => {
      if (c.status === 'Active' && !list.includes(c.name)) {
        list.push(c.name);
      }
    });
    // Fallback: collect any distinct category present in products
    (products || []).forEach(p => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [categories, products]);

  // Dependent Sub-Categories based on selected Category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'ALL') {
      // Gather all active sub-categories across categories
      const set = new Set<string>();
      (subCategories || []).forEach(s => {
        if (s.status === 'Active') set.add(s.name);
      });
      (products || []).forEach(p => {
        const sub = p.subCategory || p.dosageForm;
        if (sub) set.add(sub);
      });
      return Array.from(set);
    }

    const catNameLower = selectedCategory.toLowerCase().trim();
    const set = new Set<string>();

    (subCategories || []).forEach(s => {
      if (s.status === 'Active' && s.parentCategory && s.parentCategory.toLowerCase().trim() === catNameLower) {
        set.add(s.name);
      }
    });

    // Also include sub-categories from products of this category
    (products || []).forEach(p => {
      if (p.category && p.category.toLowerCase().trim() === catNameLower) {
        const sub = p.subCategory || p.dosageForm;
        if (sub) set.add(sub);
      }
    });

    return Array.from(set);
  }, [selectedCategory, subCategories, products]);

  // Dependent Sub-Sub-Categories based on selected Sub-Category
  const availableSubSubCategories = useMemo(() => {
    if (selectedSubCategory === 'ALL') return [];

    const subNameLower = selectedSubCategory.toLowerCase().trim();
    const catNameLower = selectedCategory !== 'ALL' ? selectedCategory.toLowerCase().trim() : null;

    const set = new Set<string>();

    (subSubCategories || []).forEach(ss => {
      if (ss.status !== 'Active') return;
      const matchesSub = ss.parentSubCategory && ss.parentSubCategory.toLowerCase().trim() === subNameLower;
      const matchesCat = !catNameLower || (ss.parentCategory && ss.parentCategory.toLowerCase().trim() === catNameLower);
      if (matchesSub && matchesCat) {
        set.add(ss.name);
      }
    });

    // Also check products matching this sub-category
    (products || []).forEach(p => {
      const pSub = (p.subCategory || p.dosageForm || '').toLowerCase().trim();
      const pCat = (p.category || '').toLowerCase().trim();
      const matchesSub = pSub === subNameLower;
      const matchesCat = !catNameLower || pCat === catNameLower;
      if (matchesSub && matchesCat && p.subSubCategory) {
        set.add(p.subSubCategory);
      }
    });

    return Array.from(set);
  }, [selectedSubCategory, selectedCategory, subSubCategories, products]);

  // Reset Sub-Category and Sub-Sub-Category when Category changes
  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    setSelectedSubCategory('ALL');
    setSelectedSubSubCategory('ALL');
  };

  // Reset Sub-Sub-Category when Sub-Category changes
  const handleSubCategoryChange = (newSub: string) => {
    setSelectedSubCategory(newSub);
    setSelectedSubSubCategory('ALL');
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSubCategory('ALL');
    setSelectedSubSubCategory('ALL');
    setSelectedStatus('ALL');
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL' || selectedSubSubCategory !== 'ALL' || selectedStatus !== 'ALL';

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return (products || []).filter(p => {
      // 1. Search Query: Product Code / SKU, Product Name, Generic Name, Salt Combination
      const matchesSearch =
        q === '' ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.genericName || '').toLowerCase().includes(q) ||
        (p.saltCombination || '').toLowerCase().includes(q);

      // 2. Category Filter
      const matchesCat =
        selectedCategory === 'ALL' ||
        (p.category && p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());

      // 3. Sub-Category Filter
      const pSub = (p.subCategory || p.dosageForm || '').toLowerCase().trim();
      const matchesSub =
        selectedSubCategory === 'ALL' ||
        pSub === selectedSubCategory.toLowerCase().trim();

      // 4. Sub-Sub-Category Filter
      const pSubSub = (p.subSubCategory || '').toLowerCase().trim();
      const matchesSubSub =
        selectedSubSubCategory === 'ALL' ||
        pSubSub === selectedSubSubCategory.toLowerCase().trim();

      // 5. Status Filter
      const pStatus = p.status || 'Active';
      const matchesStatus =
        selectedStatus === 'ALL' ||
        pStatus.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesCat && matchesSub && matchesSubSub && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedSubCategory, selectedSubSubCategory, selectedStatus]);

  // Map of Product ID to manufacturer mappings for fast lookup
  const productMappingsMap = useMemo(() => {
    const map: Record<string, Array<{ mapping: ManufacturerProductMapping; manufacturer: Manufacturer }>> = {};

    (mappings || []).forEach(m => {
      const mfg = (manufacturers || []).find(man => man.id === m.manufacturerId);
      if (mfg) {
        if (!map[m.productId]) {
          map[m.productId] = [];
        }
        map[m.productId].push({ mapping: m, manufacturer: mfg });
      }
    });

    return map;
  }, [mappings, manufacturers]);

  // Mappings for the currently selected product in Drawer
  const selectedProductMappings = useMemo(() => {
    if (!selectedProduct) return [];
    return productMappingsMap[selectedProduct.id] || [];
  }, [selectedProduct, productMappingsMap]);

  // Navigate to RFQ creation with product pre-selected
  const handleCreateRFQForProduct = (_prd: Product) => {
    setSelectedProduct(null);
    if (onNavigateTab) {
      onNavigateTab('rfqs');
    } else {
      setActiveTab('rfqs');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      {/* ── Page Header / Command Bar ─────────────────────────────── */}
      <div className="ent-command-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div className="ent-command-bar-left">
          <div className="ent-label" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#0F766E', textTransform: 'uppercase', marginBottom: 4 }}>
            PROCUREMENT / PRODUCT CATALOG
          </div>
          <h1 className="ent-page-title" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Product Catalog
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
            Browse standardized pharmaceutical formulations and available contract manufacturing specifications on FactoryGrid.
          </p>
        </div>

        <div className="ent-command-bar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '6px 14px' }}>
            <ShieldCheck size={16} style={{ color: '#16A34A' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Read-Only Catalog</span>
          </div>
        </div>
      </div>

      {/* ── Quick Stats Metrics Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Formulations</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{products.length}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{categoryOptions.length}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <Factory size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Formulations</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
              {products.filter(p => (p.status || 'Active').toLowerCase() === 'active').length}
            </div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Results Shown</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F766E', lineHeight: 1.2 }}>{filteredProducts.length}</div>
          </div>
        </div>
      </div>

      {/* ── Search & Cascading Hierarchy Filters Bar ───────────────── */}
      <div style={{ padding: 18, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          
          {/* Main Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 14px', flex: '1 1 280px' }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by Product Code / SKU, Product Name, Generic Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: 13, color: '#0F172A', outline: 'none' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={e => handleCategoryChange(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 12.5, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 2. Sub-Category Filter (Dynamic / Dependent) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: selectedCategory !== 'ALL' ? '#0F766E' : '#475569' }}>
              Sub-Category:
            </span>
            <select
              value={selectedSubCategory}
              onChange={e => handleSubCategoryChange(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedCategory !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedCategory !== 'ALL' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: selectedCategory !== 'ALL' ? '#0F766E' : '#0F172A',
                fontWeight: selectedCategory !== 'ALL' ? 700 : 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">
                {selectedCategory !== 'ALL'
                  ? `All ${selectedCategory} Sub-Categories (${availableSubCategories.length})`
                  : 'All Sub-Categories'}
              </option>
              {availableSubCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 3. Sub-Sub-Category Filter (Dynamic / Dependent) */}
          {selectedSubCategory !== 'ALL' && availableSubSubCategories.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7' }}>Sub-Sub-Category:</span>
              <select
                value={selectedSubSubCategory}
                onChange={e => setSelectedSubSubCategory(e.target.value)}
                style={{ padding: '8px 12px', fontSize: 12.5, background: '#F0F9FF', border: '1px solid #0284C7', borderRadius: 6, color: '#0369A1', fontWeight: 700, cursor: 'pointer' }}
              >
                <option value="ALL">All Sub-Sub ({availableSubSubCategories.length})</option>
                {availableSubSubCategories.map(ss => (
                  <option key={ss} value={ss}>{ss}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
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

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 6, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Reset all filters"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>

        {/* Informative Sub-bar & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#475569', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={14} style={{ color: '#0F766E' }} />
            <span>Standardized formulation catalog verified for compliance and contract manufacturing across India.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Showing <strong style={{ color: '#0F766E' }}>{filteredProducts.length}</strong> of {products.length} products</span>
            <ViewModeToggle viewMode={displayMode} onViewChange={setDisplayMode} />
          </div>
        </div>
      </div>

      {/* ── Product List Table / Card View ─────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        {displayMode === 'CARD' ? (
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
                <Package size={40} style={{ color: '#94A3B8', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No products found</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                  No formulations matched your current search and filter criteria.
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    style={{ padding: '8px 16px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map(prd => {
                const statusStr = prd.status || 'Active';
                const isActive = statusStr.toLowerCase() === 'active';
                const subCat = prd.subCategory || prd.dosageForm || '—';

                return (
                  <div
                    key={prd.id}
                    onClick={() => setSelectedProduct(prd)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#0F766E';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,118,110,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,23,42,0.04)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                            {prd.code}
                          </span>
                          {prd.sku && prd.sku !== prd.code && (
                            <span style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace', marginLeft: 6 }}>
                              ({prd.sku})
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#F3F4F6',
                          color: isActive ? '#15803D' : '#4B5563',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #D1D5DB'
                        }}>
                          {statusStr}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                        {prd.name}
                      </h3>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 10 }}>
                        {prd.genericName}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5, background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                        <div>
                          <span style={{ color: '#64748B' }}>Strength:</span> <strong style={{ color: '#0F766E' }}>{prd.strength || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Dosage:</span> <strong style={{ color: '#1E293B' }}>{prd.dosageForm || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>Pack Size:</span> <strong style={{ color: '#1E293B' }}>{prd.packSize || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B' }}>UOM:</span> <strong style={{ color: '#1E293B' }}>{prd.uom || 'Units'}</strong>
                        </div>
                      </div>

                      {/* Hierarchy Badge Chain */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 10, fontSize: 11 }}>
                        <span style={{ padding: '2px 6px', background: '#F1F5F9', borderRadius: 4, color: '#475569', fontWeight: 600 }}>
                          {prd.category}
                        </span>
                        <ChevronRight size={12} style={{ color: '#94A3B8' }} />
                        <span style={{ padding: '2px 6px', background: '#F0FDFA', borderRadius: 4, color: '#0F766E', fontWeight: 700 }}>
                          {subCat}
                        </span>
                        {prd.subSubCategory && (
                          <>
                            <ChevronRight size={12} style={{ color: '#94A3B8' }} />
                            <span style={{ padding: '2px 6px', background: '#F0F9FF', borderRadius: 4, color: '#0369A1', fontWeight: 700 }}>
                              {prd.subSubCategory}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedProduct(prd);
                        }}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 6,
                          background: 'rgba(15, 118, 110, 0.08)',
                          border: '1px solid rgba(15, 118, 110, 0.25)',
                          color: '#0F766E',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 1250, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>PRODUCT CODE / SKU</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 160 }}>PRODUCT NAME</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 160 }}>GENERIC NAME</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 90 }}>STRENGTH</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>DOSAGE FORM</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>PACK SIZE</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 75 }}>UOM</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>CATEGORY</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>SUB-CATEGORY</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>SUB-SUB-CATEGORY</th>
                <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 90 }}>STATUS</th>
                <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 110 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '56px 20px', color: '#64748B' }}>
                    <Package size={40} style={{ color: '#94A3B8', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No central products found</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                      No formulations matched your current search and filter criteria.
                    </div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        style={{ padding: '8px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prd => {
                  const statusStr = prd.status || 'Active';
                  const isActive = statusStr.toLowerCase() === 'active';
                  const subCat = prd.subCategory || prd.dosageForm || '—';
                  const subSubCat = prd.subSubCategory || '—';

                  return (
                    <tr
                      key={prd.id}
                      onClick={() => setSelectedProduct(prd)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* 1. PRODUCT CODE / SKU */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                          {prd.code}
                        </div>
                        {prd.sku && prd.sku !== prd.code && (
                          <div style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                            SKU: {prd.sku}
                          </div>
                        )}
                      </td>

                      {/* 2. PRODUCT NAME */}
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          {prd.name}
                        </div>
                      </td>

                      {/* 3. GENERIC NAME */}
                      <td style={{ padding: '12px 10px', fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                        {prd.genericName || '—'}
                      </td>

                      {/* 4. STRENGTH */}
                      <td style={{ padding: '12px 10px', fontSize: 12.5, fontWeight: 700, color: '#0F766E', whiteSpace: 'nowrap' }}>
                        {prd.strength || '—'}
                      </td>

                      {/* 5. DOSAGE FORM */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                          {prd.dosageForm || '—'}
                        </span>
                      </td>

                      {/* 6. PACK SIZE */}
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {prd.packSize || '—'}
                      </td>

                      {/* 7. UOM */}
                      <td style={{ padding: '12px 10px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                        {prd.uom || 'Units'}
                      </td>

                      {/* 8. CATEGORY */}
                      <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                        {prd.category || '—'}
                      </td>

                      {/* 9. SUB-CATEGORY */}
                      <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#0F766E', whiteSpace: 'nowrap' }}>
                        {subCat}
                      </td>

                      {/* 10. SUB-SUB-CATEGORY */}
                      <td style={{ padding: '12px 10px', fontSize: 11.5, fontWeight: 600, color: subSubCat !== '—' ? '#0284C7' : '#94A3B8', whiteSpace: 'nowrap' }}>
                        {subSubCat}
                      </td>

                      {/* 11. STATUS */}
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#F3F4F6',
                          color: isActive ? '#15803D' : '#4B5563',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #D1D5DB'
                        }}>
                          {statusStr}
                        </span>
                      </td>

                      {/* 12. ACTION: VIEW DETAILS */}
                      <td onClick={e => e.stopPropagation()} style={{ padding: '12px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => setSelectedProduct(prd)}
                          style={{
                            padding: '5px 10px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: 'rgba(15, 118, 110, 0.08)',
                            border: '1px solid rgba(15, 118, 110, 0.25)',
                            color: '#0F766E',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Eye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── PRODUCT DETAILS DRAWER / MODAL ─────────────────────────── */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 640,
              height: '100%',
              background: '#FFFFFF',
              borderLeft: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.15)'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#0F766E', fontWeight: 800, fontFamily: 'monospace' }}>
                    {selectedProduct.code}
                  </span>
                  {selectedProduct.sku && selectedProduct.sku !== selectedProduct.code && (
                    <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                      ({selectedProduct.sku})
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                    background: (selectedProduct.status || 'Active').toLowerCase() === 'active' ? '#DCFCE7' : '#F3F4F6',
                    color: (selectedProduct.status || 'Active').toLowerCase() === 'active' ? '#15803D' : '#4B5563',
                    border: (selectedProduct.status || 'Active').toLowerCase() === 'active' ? '1px solid #86EFAC' : '1px solid #D1D5DB'
                  }}>
                    {selectedProduct.status || 'Active'}
                  </span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
                  {selectedProduct.name}
                </h2>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  {selectedProduct.genericName}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* 1. PRODUCT INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={14} /> 1. PRODUCT INFORMATION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Product Code / SKU:</span>
                    <strong style={{ color: '#0F766E', fontFamily: 'monospace', display: 'block', marginTop: 2 }}>
                      {selectedProduct.code} {selectedProduct.sku && selectedProduct.sku !== selectedProduct.code ? `(${selectedProduct.sku})` : ''}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Product Name:</span>
                    <strong style={{ color: '#0F172A', display: 'block', marginTop: 2 }}>
                      {selectedProduct.name}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Generic Name:</span>
                    <strong style={{ color: '#1E293B', display: 'block', marginTop: 2 }}>
                      {selectedProduct.genericName || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Strength:</span>
                    <strong style={{ color: '#0F766E', display: 'block', marginTop: 2 }}>
                      {selectedProduct.strength || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Dosage Form:</span>
                    <strong style={{ color: '#0F172A', display: 'block', marginTop: 2 }}>
                      {selectedProduct.dosageForm || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Pack Size:</span>
                    <strong style={{ color: '#334155', display: 'block', marginTop: 2 }}>
                      {selectedProduct.packSize || '—'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>UOM:</span>
                    <strong style={{ color: '#0F172A', display: 'block', marginTop: 2 }}>
                      {selectedProduct.uom || 'Units'}
                    </strong>
                  </div>
                  {selectedProduct.saltCombination && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748B' }}>Salt Combination:</span>
                      <strong style={{ color: '#0F172A', display: 'block', marginTop: 2, background: '#FFFFFF', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
                        {selectedProduct.saltCombination}
                      </strong>
                    </div>
                  )}
                  {selectedProduct.description && (
                    <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                      <span style={{ color: '#64748B' }}>Description:</span>
                      <p style={{ margin: '4px 0 0 0', color: '#334155', lineHeight: 1.5, background: '#FFFFFF', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. CLASSIFICATION HIERARCHY */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={14} /> 2. CLASSIFICATION (3-TIER HIERARCHY)
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', width: 120 }}>Category:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {selectedProduct.category || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', marginLeft: 16 }}>
                    <ChevronRight size={14} style={{ color: '#0F766E' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', width: 104 }}>Sub-Category:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>
                      {selectedProduct.subCategory || selectedProduct.dosageForm || '—'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0', marginLeft: 32 }}>
                    <ChevronRight size={14} style={{ color: '#0284C7' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', width: 88 }}>Sub-Sub:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: selectedProduct.subSubCategory ? '#0284C7' : '#94A3B8' }}>
                      {selectedProduct.subSubCategory || 'Not Applicable / Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. MANUFACTURER / PRODUCT MAPPING (BUYER SAFE — NO MARGINS/INTERNAL PRICING) */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Factory size={14} /> 3. VERIFIED MANUFACTURING SOURCES ({selectedProductMappings.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedProductMappings.length === 0 ? (
                    <div style={{ padding: 18, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                      No direct manufacturer mappings linked to this catalog item yet. You can still float an RFQ to verified plants on FactoryGrid.
                    </div>
                  ) : (
                    selectedProductMappings.map(({ mapping, manufacturer }) => (
                      <div
                        key={`${mapping.productId}_${mapping.manufacturerId}`}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                              {manufacturer.companyName || manufacturer.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              Location: {manufacturer.city}, {manufacturer.state}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                            Verified Source
                          </span>
                        </div>

                        {/* Buyer visible specifications only — Strictly NO margin or internal pricing */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 11.5, background: '#F8FAFC', padding: 10, borderRadius: 6, marginTop: 4 }}>
                          <div>
                            <span style={{ color: '#64748B' }}>Plant Product Code:</span>{' '}
                            <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>
                              {mapping.mfgProductCode || 'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>Min. Order Qty (MOQ):</span>{' '}
                            <strong style={{ color: '#0F172A' }}>
                              {(mapping.moq || selectedProduct.moq || 1000).toLocaleString()} Units
                            </strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748B' }}>Standard Lead Time:</span>{' '}
                            <strong style={{ color: '#0F172A' }}>
                              {mapping.standardLeadTimeDays || 14} Days
                            </strong>
                          </div>
                          {mapping.packaging && (
                            <div>
                              <span style={{ color: '#64748B' }}>Packaging:</span>{' '}
                              <strong style={{ color: '#0F172A' }}>{mapping.packaging}</strong>
                            </div>
                          )}
                        </div>

                        {/* Plant Certifications */}
                        {manufacturer.certifications && manufacturer.certifications.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>Compliance:</span>
                            {manufacturer.certifications.map(c => (
                              <span key={c.id} style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#334155' }}>
                                ✓ {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{ padding: '9px 18px', borderRadius: 8, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Close
              </button>

              <button
                onClick={() => handleCreateRFQForProduct(selectedProduct)}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FileText size={15} /> Create RFQ for Formulation →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
