import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Plus, Search, Filter, RotateCcw, Eye, Edit3, CheckCircle2,
  AlertTriangle, Clock, Layers, X, ChevronRight, ShieldCheck,
  Check, FileText, ToggleLeft, ToggleRight, FileSpreadsheet, UploadCloud,
  CheckCheck, Download, RefreshCw
} from 'lucide-react';
import {
  manufacturerProductsApi,
  ManufacturerProductMappingItem,
  ManufacturerCatalogSummary,
  MasterCatalogProduct
} from '../../services/manufacturerProductsApi';
import { catalogApi } from '../../services/catalogApi';

interface ManufacturerProductCatalogTabProps {
  manufacturer?: any;
  onSelectProductForDetail?: (product: any) => void;
}

export const ManufacturerProductCatalogTab: React.FC<ManufacturerProductCatalogTabProps> = ({
  manufacturer,
  onSelectProductForDetail
}) => {
  // ── 1. Backend Data State ───────────────────────────────────────────
  const [mappings, setMappings] = useState<ManufacturerProductMappingItem[]>([]);
  const [summary, setSummary] = useState<ManufacturerCatalogSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── 2. Filter State ──────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Cascading Category Options for Filter
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [filterSubCategories, setFilterSubCategories] = useState<string[]>([]);
  const [filterSubSubCategories, setFilterSubSubCategories] = useState<string[]>([]);

  // ── 3. Modals & Drawers State ────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedMappingForEdit, setSelectedMappingForEdit] = useState<ManufacturerProductMappingItem | null>(null);
  const [selectedMappingForDetail, setSelectedMappingForDetail] = useState<ManufacturerProductMappingItem | null>(null);

  // Facility Identity Display
  const mfgDisplayName = summary?.companyName || manufacturer?.companyName || manufacturer?.name || 'Verified Manufacturing Facility';
  const mfgCode = summary?.manufacturerCode || manufacturer?.code || 'MFG-001';

  // ── Load Categories for Cascading Filters ────────────────────────────
  useEffect(() => {
    manufacturerProductsApi.getCategories()
      .then((data) => {
        if (data?.tree) {
          setCategoryTree(data.tree);
        }
      })
      .catch((err) => console.warn('Could not load categories tree:', err));
  }, []);

  // Update filter sub-categories when selectedCategory changes
  useEffect(() => {
    if (selectedCategory === 'ALL') {
      setFilterSubCategories([]);
      setSelectedSubCategory('ALL');
      setFilterSubSubCategories([]);
      setSelectedSubSubCategory('ALL');
    } else {
      manufacturerProductsApi.getSubCategories(selectedCategory)
        .then((subs) => {
          setFilterSubCategories(subs);
          setSelectedSubCategory('ALL');
          setFilterSubSubCategories([]);
          setSelectedSubSubCategory('ALL');
        })
        .catch(() => setFilterSubCategories([]));
    }
  }, [selectedCategory]);

  // Update filter sub-sub-categories when selectedSubCategory changes
  useEffect(() => {
    if (selectedSubCategory === 'ALL' || selectedCategory === 'ALL') {
      setFilterSubSubCategories([]);
      setSelectedSubSubCategory('ALL');
    } else {
      manufacturerProductsApi.getSubSubCategories(selectedCategory, selectedSubCategory)
        .then((subSubs) => {
          setFilterSubSubCategories(subSubs);
          setSelectedSubSubCategory('ALL');
        })
        .catch(() => setFilterSubSubCategories([]));
    }
  }, [selectedCategory, selectedSubCategory]);

  // ── Fetch Mappings & Summary from Backend ───────────────────────────
  const fetchCatalogData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setApiError(null);

    try {
      const [sumData, listData] = await Promise.all([
        manufacturerProductsApi.getSummary(),
        manufacturerProductsApi.listMappedProducts({
          search: searchTerm,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          subSubCategory: selectedSubSubCategory,
          status: selectedStatus,
        }),
      ]);

      setSummary(sumData);
      setMappings(listData.items || []);
    } catch (err: any) {
      console.error('Failed to load manufacturer product catalog:', err);
      setApiError(err?.message || 'Failed to connect to manufacturer catalog service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedSubSubCategory, selectedStatus]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSubCategory('ALL');
    setSelectedSubSubCategory('ALL');
    setSelectedStatus('ALL');
  };

  const isFiltered = searchTerm !== '' || selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL' || selectedSubSubCategory !== 'ALL' || selectedStatus !== 'ALL';

  // ── Toggle Mapping Status ────────────────────────────────────────────
  const handleToggleStatus = async (item: ManufacturerProductMappingItem) => {
    const newStatus = item.lifecycleStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await manufacturerProductsApi.updateStatus(item.id, newStatus);
      setMappings((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, lifecycleStatus: newStatus, status: newStatus === 'ACTIVE' ? 'Active' : 'Inactive' } : m
        )
      );
      if (summary) {
        setSummary({
          ...summary,
          activeCount: newStatus === 'ACTIVE' ? summary.activeCount + 1 : summary.activeCount - 1,
          inactiveCount: newStatus === 'ACTIVE' ? summary.inactiveCount - 1 : summary.inactiveCount + 1,
        });
      }
    } catch (err: any) {
      alert(`Could not update status: ${err?.message || 'Unknown error'}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>
                My Product Catalog
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Formulations mapped to your manufacturing facility ({mfgDisplayName}). Manage facility SKUs, batch minimums, production lead times, and active supply status.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => fetchCatalogData(true)}
            disabled={isRefreshing || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13,
              fontWeight: 600,
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RotateCcw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#0F766E',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,118,110,0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} />
            + Add Product
          </button>
        </div>
      </div>

      {/* ── Summary KPI Section ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              Total Mapped Products
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
              {isLoading ? '...' : (summary?.totalMapped ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Facility Formulations</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
            <Package size={22} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              Active Formulations
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#059669', marginTop: 4 }}>
              {isLoading ? '...' : (summary?.activeCount ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
              Ready for RFQ Quotations
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              Inactive / Suspended
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
              {isLoading ? '...' : (summary?.inactiveCount ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Hidden from Buyer Catalog</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <Clock size={22} />
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
              Categories Represented
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#7C3AED', marginTop: 4 }}>
              {isLoading ? '...' : (summary?.totalCategories ?? 0)}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Therapeutic Segments</div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <Layers size={22} />
          </div>
        </div>
      </div>

      {/* ── Search & Cascading Filter Toolbar ─────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 260px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by Product Name, Code, Generic Molecule or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: 160 }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Categories</option>
              {categoryTree.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          {/* Cascading Sub-Category Dropdown */}
          <div style={{ minWidth: 160 }}>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              disabled={selectedCategory === 'ALL' || filterSubCategories.length === 0}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: selectedCategory === 'ALL' ? '#94A3B8' : '#0F172A',
                background: selectedCategory === 'ALL' ? '#F8FAFC' : '#FFFFFF',
                outline: 'none',
                cursor: selectedCategory === 'ALL' ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="ALL">All Sub-Categories</option>
              {filterSubCategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Cascading Sub-Sub-Category Dropdown */}
          <div style={{ minWidth: 180 }}>
            <select
              value={selectedSubSubCategory}
              onChange={(e) => setSelectedSubSubCategory(e.target.value)}
              disabled={selectedSubCategory === 'ALL' || filterSubSubCategories.length === 0}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: selectedSubCategory === 'ALL' ? '#94A3B8' : '#0F172A',
                background: selectedSubCategory === 'ALL' ? '#F8FAFC' : '#FFFFFF',
                outline: 'none',
                cursor: selectedSubCategory === 'ALL' ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="ALL">All Classifications</option>
              {filterSubSubCategories.map((subSub) => (
                <option key={subSub} value={subSub}>
                  {subSub}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: 130 }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Reset Action */}
          {isFiltered && (
            <button
              onClick={handleResetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Status Count Line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748B', paddingTop: 4 }}>
          <div>
            Showing <strong style={{ color: '#0F172A' }}>{mappings.length}</strong> formulation{mappings.length === 1 ? '' : 's'} mapped to your facility
            {isFiltered && ' (filtered)'}
          </div>
          <div>
            Data Source: <strong style={{ color: '#0F172A' }}>PostgreSQL 17</strong> (Strict Tenant Isolation)
          </div>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {apiError && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#991B1B',
          fontSize: 13,
        }}>
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>{apiError}</div>
          <button
            onClick={() => fetchCatalogData()}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              background: '#991B1B',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Product Listing Table ─────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        overflow: 'hidden',
      }}>
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid #CBD5E1',
              borderTopColor: '#0F766E',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite'
            }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>Loading Mapped Formulations...</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Fetching facility records from PostgreSQL backend</div>
          </div>
        ) : mappings.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#64748B'
            }}>
              <Package size={28} />
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A' }}>
              {isFiltered ? 'No Formulations Match Filter Criteria' : "No products found in this manufacturer's catalog."}
            </h3>
            <p style={{ margin: '8px auto 20px', fontSize: 13, color: '#64748B', maxWidth: 440 }}>
              {isFiltered
                ? 'Try adjusting your search keywords, category hierarchy, or lifecycle status filter.'
                : `Click "+ Add Product" to map existing central Product Master products to ${mfgDisplayName}.`}
            </p>
            {isFiltered ? (
              <button
                onClick={handleResetFilters}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '10px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15,118,110,0.2)',
                }}
              >
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, fontWeight: 600 }}>
                  <th style={{ padding: '14px 20px' }}>Product & Formulation</th>
                  <th style={{ padding: '14px 16px' }}>Category Hierarchy</th>
                  <th style={{ padding: '14px 16px' }}>Dosage & Packaging</th>
                  <th style={{ padding: '14px 16px' }}>Facility SKU / Code</th>
                  <th style={{ padding: '14px 16px' }}>Commercial Terms</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ divideY: '1px solid #F1F5F9' }}>
                {mappings.map((item) => {
                  const p = item.product || {};
                  const isActive = item.lifecycleStatus === 'ACTIVE';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                    >
                      {/* Product & Formulation */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', minWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                          {p.name || 'Unnamed Formulation'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: '#F1F5F9',
                            color: '#475569',
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            {p.productCode}
                          </span>
                          {p.genericName && (
                            <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                              {p.genericName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Hierarchy */}
                      <td style={{ padding: '16px 16px', verticalAlign: 'top', minWidth: 180 }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {p.category || 'General'}
                        </div>
                        {(p.subCategory || p.subSubCategory) && (
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{p.subCategory || p.dosageForm}</span>
                            {p.subSubCategory && (
                              <>
                                <ChevronRight size={12} color="#94A3B8" />
                                <span style={{ color: '#334155' }}>{p.subSubCategory}</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Dosage & Packaging */}
                      <td style={{ padding: '16px 16px', verticalAlign: 'top', minWidth: 160 }}>
                        <div style={{ color: '#0F172A', fontWeight: 500 }}>
                          {p.dosageForm || 'Standard'} {p.strength ? `• ${p.strength}` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          {p.packSize || item.packagingDetails || 'Standard Pack'}
                        </div>
                      </td>

                      {/* Facility SKU / Code */}
                      <td style={{ padding: '16px 16px', verticalAlign: 'top', minWidth: 150 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                          {item.manufacturerProductCode || p.productCode}
                        </div>
                        {item.manufacturerSku && (
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            SKU: {item.manufacturerSku}
                          </div>
                        )}
                        {item.isPreferred && (
                          <span style={{
                            display: 'inline-block',
                            marginTop: 4,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: '#FEF3C7',
                            color: '#92400E',
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.04em'
                          }}>
                            PREFERRED
                          </span>
                        )}
                      </td>

                      {/* Commercial Terms */}
                      <td style={{ padding: '16px 16px', verticalAlign: 'top', minWidth: 160 }}>
                        <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>
                          MOQ: {(item.moq || 1000).toLocaleString()} {p.baseUom || 'Units'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />
                          Lead Time: {item.leadTimeDays || 14} days
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 16px', verticalAlign: 'top', minWidth: 110 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: isActive ? '#ECFDF5' : '#F1F5F9',
                          color: isActive ? '#059669' : '#64748B',
                          border: `1px solid ${isActive ? '#A7F3D0' : '#E2E8F0'}`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#059669' : '#94A3B8' }}></span>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            title="View Full Product Specification"
                            onClick={() => {
                              setSelectedMappingForDetail(item);
                              if (onSelectProductForDetail) onSelectProductForDetail(p);
                            }}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            title="Edit Facility Commercial Terms"
                            onClick={() => {
                              setSelectedMappingForEdit(item);
                              setIsEditModalOpen(true);
                            }}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: '#0F766E',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            title={isActive ? 'Deactivate Product' : 'Activate Product'}
                            onClick={() => handleToggleStatus(item)}
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              background: '#FFFFFF',
                              color: isActive ? '#059669' : '#94A3B8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isActive ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                          </button>
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

      {/* ── RESTORED ORIGINAL ADD PRODUCT MODAL ────────────────────── */}
      {isAddModalOpen && (
        <OriginalAddProductModal
          mfgDisplayName={mfgDisplayName}
          mfgCode={mfgCode}
          categoryTree={categoryTree}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchCatalogData();
          }}
        />
      )}

      {/* ── Edit Product Terms Modal ──────────────────────────────── */}
      {isEditModalOpen && selectedMappingForEdit && (
        <EditProductModal
          mapping={selectedMappingForEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMappingForEdit(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedMappingForEdit(null);
            fetchCatalogData();
          }}
        />
      )}

      {/* ── Product Detail View Drawer ────────────────────────────── */}
      {selectedMappingForDetail && (
        <ProductDetailDrawer
          mapping={selectedMappingForDetail}
          onClose={() => setSelectedMappingForDetail(null)}
        />
      )}
    </div>
  );
};

// =====================================================================
// RESTORED ORIGINAL ADD PRODUCT TO CATALOG MODAL
// =====================================================================
interface OriginalAddProductModalProps {
  mfgDisplayName: string;
  mfgCode: string;
  categoryTree: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const OriginalAddProductModal: React.FC<OriginalAddProductModalProps> = ({
  mfgDisplayName,
  mfgCode,
  categoryTree,
  onClose,
  onSuccess
}) => {
  const [addModalTab, setAddModalTab] = useState<'CREATE' | 'MAP' | 'UPLOAD'>('CREATE');
  const [addFormError, setAddFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active Categories List from DB
  const activeCategoriesList = useMemo(() => {
    return categoryTree.map((c) => c.category);
  }, [categoryTree]);

  // Form State 1: Create New Product (Manual)
  const [createProductForm, setCreateProductForm] = useState({
    name: '',
    category: 'Drugs',
    subCategory: '',
    subSubCategory: '',
    subSubCategoryId: '',
    sku: '',
    genericName: '',
    saltCombination: '',
    strength: '',
    dosageForm: '',
    packSize: '10 × 1 × 10 Strip',
    uom: 'Strip',
    packaging: '10 × 1 × 10 Strip',
    moq: 1000,
    standardLeadTimeDays: 14,
    basePrice: 100,
    certificationsStr: 'WHO-GMP, CDSCO Form 25/28',
    description: '',
    status: 'Active'
  });

  // Cascading options for Manual Creation
  const [createAvailableSubCategories, setCreateAvailableSubCategories] = useState<string[]>([]);
  const [createAvailableSubSubCategories, setCreateAvailableSubSubCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!createProductForm.category) {
      setCreateAvailableSubCategories([]);
      setCreateAvailableSubSubCategories([]);
      return;
    }
    manufacturerProductsApi.getSubCategories(createProductForm.category)
      .then((subs) => {
        setCreateAvailableSubCategories(subs);
        setCreateAvailableSubSubCategories([]);
      })
      .catch(() => setCreateAvailableSubCategories([]));
  }, [createProductForm.category]);

  useEffect(() => {
    const currentSub = createProductForm.subCategory || createProductForm.dosageForm;
    if (!createProductForm.category || !currentSub) {
      setCreateAvailableSubSubCategories([]);
      return;
    }
    manufacturerProductsApi.getSubSubCategories(createProductForm.category, currentSub)
      .then((subSubs) => setCreateAvailableSubSubCategories(subSubs))
      .catch(() => setCreateAvailableSubSubCategories([]));
  }, [createProductForm.category, createProductForm.subCategory, createProductForm.dosageForm]);

  // Form State 2: Map Existing Central Master Product
  const [centralSearchQuery, setCentralSearchQuery] = useState('');
  const [centralProductResults, setCentralProductResults] = useState<MasterCatalogProduct[]>([]);
  const [isLoadingMasterProducts, setIsLoadingMasterProducts] = useState(false);
  const [selectedCentralProduct, setSelectedCentralProduct] = useState<MasterCatalogProduct | null>(null);

  const [mappingFormData, setMappingFormData] = useState({
    mfgProductCode: '',
    moq: 1000,
    standardLeadTimeDays: 14,
    packaging: '10 × 1 × 10 Strip',
    certificationsStr: 'WHO-GMP, CDSCO Applicable',
    status: 'Active'
  });

  // Search Central Master Products from PostgreSQL
  useEffect(() => {
    if (addModalTab === 'MAP') {
      setIsLoadingMasterProducts(true);
      manufacturerProductsApi.searchMasterProducts({ search: centralSearchQuery || undefined })
        .then((prods) => setCentralProductResults(prods))
        .catch((err) => console.error(err))
        .finally(() => setIsLoadingMasterProducts(false));
    }
  }, [addModalTab, centralSearchQuery]);

  const handleSelectCentralProduct = (prd: MasterCatalogProduct) => {
    setAddFormError(null);
    setSelectedCentralProduct(prd);
    const codePrefix = mfgCode.length > 4 ? mfgCode.substring(0, 4) : mfgCode;
    const prdSlug = prd.productCode.replace(/[^a-zA-Z0-9]/g, '');
    setMappingFormData({
      mfgProductCode: `${codePrefix}-${prdSlug}`,
      moq: 1000,
      standardLeadTimeDays: 14,
      packaging: prd.packSize || '10 × 1 × 10 Strip',
      certificationsStr: 'WHO-GMP, CDSCO Applicable',
      status: 'Active'
    });
  };

  // Save Flow 1: Create New Product (Manual)
  const handleSaveCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    // 1. Classification Hierarchy Validation
    if (!createProductForm.category.trim()) {
      setAddFormError('Category is required.');
      return;
    }
    const currentSub = createProductForm.subCategory.trim() || createProductForm.dosageForm.trim();
    if (createAvailableSubCategories.length > 0 && !currentSub) {
      setAddFormError('Sub-Category is required.');
      return;
    }

    // 2. Product Details Validation
    if (!createProductForm.sku.trim()) {
      setAddFormError('Product Code / SKU is required (e.g. PCM-650).');
      return;
    }
    if (!createProductForm.name.trim()) {
      setAddFormError('Product Name is required.');
      return;
    }
    if (!createProductForm.packaging.trim()) {
      setAddFormError('Packaging details are required (e.g. 10 × 1 × 10 Strip).');
      return;
    }
    if (!createProductForm.moq || createProductForm.moq <= 0) {
      setAddFormError('Valid Minimum Order Quantity (MOQ) is required.');
      return;
    }
    if (!createProductForm.standardLeadTimeDays || createProductForm.standardLeadTimeDays <= 0) {
      setAddFormError('Valid Delivery Schedule (Days) is required.');
      return;
    }

    const cleanSku = createProductForm.sku.trim().toUpperCase();
    setIsSubmitting(true);

    try {
      // 1. Create or ensure product exists in Central Master (PostgreSQL catalog_products)
      let productId = cleanSku;
      try {
        const created = await catalogApi.createProduct({
          productCode: cleanSku,
          name: createProductForm.name.trim(),
          category: createProductForm.category.trim(),
          subCategory: currentSub || undefined,
          subSubCategory: createProductForm.subSubCategory?.trim() || undefined,
          genericName: createProductForm.genericName.trim() || createProductForm.name.trim(),
          dosageForm: createProductForm.dosageForm || currentSub || 'Tablet',
          packSize: createProductForm.packSize.trim() || createProductForm.packaging.trim(),
          baseUom: createProductForm.uom || 'Unit',
          description: createProductForm.description.trim() || `${createProductForm.name} pharmaceutical formulation`,
          lifecycleStatus: 'ACTIVE',
        });
        if (created?.id) productId = created.id;
      } catch (err: any) {
        console.log('Central master creation notice:', err?.message);
        // If it already existed in master, search for its ID
        const existing = await manufacturerProductsApi.searchMasterProducts({ search: cleanSku });
        const match = existing.find(p => p.productCode === cleanSku);
        if (match) productId = match.id;
      }

      // 2. Create Manufacturer-Product Mapping in PostgreSQL manufacturer_products
      await manufacturerProductsApi.createMapping({
        productId,
        manufacturerProductCode: cleanSku,
        moq: createProductForm.moq,
        leadTimeDays: createProductForm.standardLeadTimeDays,
        packagingDetails: createProductForm.packaging.trim(),
        lifecycleStatus: createProductForm.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE',
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to create and map product:', err);
      setAddFormError(err?.message || 'Failed to save product to catalog.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Flow 2: Map Existing Central Master Product
  const handleSaveAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentralProduct) {
      setAddFormError('Please select an existing Product Master product.');
      return;
    }

    if (!mappingFormData.mfgProductCode.trim()) {
      setAddFormError('Manufacturer Product Code / SKU is required.');
      return;
    }
    if (!mappingFormData.packaging.trim()) {
      setAddFormError('Packaging details are required (e.g. 10 × 1 × 10 Strip).');
      return;
    }
    if (!mappingFormData.moq || mappingFormData.moq <= 0) {
      setAddFormError('Valid Minimum Order Quantity (MOQ) is required.');
      return;
    }
    if (!mappingFormData.standardLeadTimeDays || mappingFormData.standardLeadTimeDays <= 0) {
      setAddFormError('Valid Standard Delivery Schedule (Days) is required.');
      return;
    }

    setIsSubmitting(true);
    setAddFormError(null);

    try {
      await manufacturerProductsApi.createMapping({
        productId: selectedCentralProduct.id,
        manufacturerProductCode: mappingFormData.mfgProductCode.trim(),
        moq: Number(mappingFormData.moq) || 1000,
        leadTimeDays: Number(mappingFormData.standardLeadTimeDays) || 14,
        packagingDetails: mappingFormData.packaging.trim(),
        lifecycleStatus: mappingFormData.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE',
      });

      onSuccess();
    } catch (err: any) {
      console.error('Failed to map product:', err);
      setAddFormError(err?.message || 'Failed to map product to facility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '90vh',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Add Product to Catalog</h3>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Catalog management for <strong>{mfgDisplayName}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {addFormError && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{addFormError}</span>
          </div>
        )}

        {/* Modal Tabs: Create New Product vs Map from Master */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => { setAddModalTab('CREATE'); setAddFormError(null); }}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: addModalTab === 'CREATE' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: addModalTab === 'CREATE' ? '#0F766E' : '#F8FAFC',
              color: addModalTab === 'CREATE' ? '#FFFFFF' : '#475569'
            }}
          >
            + Create New Product (Manual)
          </button>
          <button
            type="button"
            onClick={() => { setAddModalTab('MAP'); setAddFormError(null); }}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              border: addModalTab === 'MAP' ? '1px solid #0F766E' : '1px solid #CBD5E1',
              background: addModalTab === 'MAP' ? '#0F766E' : '#F8FAFC',
              color: addModalTab === 'MAP' ? '#FFFFFF' : '#475569'
            }}
          >
            Map Existing Master Product
          </button>
        </div>

        {/* SUB-FLOW 1: CREATE NEW PRODUCT */}
        {addModalTab === 'CREATE' ? (
          <form onSubmit={handleSaveCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 1. CLASSIFICATION HIERARCHY */}
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} /> 1. CLASSIFICATION HIERARCHY
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {/* Category */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  required
                  value={createProductForm.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCreateProductForm({
                      ...createProductForm,
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
                  {activeCategoriesList.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sub-Category */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Sub-Category *
                </label>
                <select
                  required={createAvailableSubCategories.length > 0}
                  disabled={!createProductForm.category || createAvailableSubCategories.length === 0}
                  value={createProductForm.subCategory || createProductForm.dosageForm}
                  onChange={(e) => {
                    const newSub = e.target.value;
                    setCreateProductForm({
                      ...createProductForm,
                      subCategory: newSub,
                      dosageForm: newSub,
                      subSubCategory: '',
                      subSubCategoryId: ''
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: (!createProductForm.category || createAvailableSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                >
                  {!createProductForm.category ? (
                    <option value="">-- Select Category First --</option>
                  ) : createAvailableSubCategories.length === 0 ? (
                    <option value="">Not Applicable (No sub-categories)</option>
                  ) : (
                    <>
                      <option value="">-- Select Sub-Category * --</option>
                      {createAvailableSubCategories.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Sub-Sub-Category */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Sub-Sub-Category <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                </label>
                <select
                  disabled={(!createProductForm.subCategory && !createProductForm.dosageForm) || createAvailableSubSubCategories.length === 0}
                  value={createProductForm.subSubCategory}
                  onChange={(e) => {
                    setCreateProductForm({
                      ...createProductForm,
                      subSubCategory: e.target.value,
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: ((!createProductForm.subCategory && !createProductForm.dosageForm) || createAvailableSubSubCategories.length === 0) ? '#F8FAFC' : '#FFFFFF' }}
                >
                  {(!createProductForm.subCategory && !createProductForm.dosageForm) ? (
                    <option value="">-- Select Sub-Category First --</option>
                  ) : createAvailableSubSubCategories.length === 0 ? (
                    <option value="">Not Applicable (None for this Sub-Category)</option>
                  ) : (
                    <>
                      <option value="">-- Select Sub-Sub-Category (Optional) --</option>
                      {createAvailableSubSubCategories.map((ss) => (
                        <option key={ss} value={ss}>{ss}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* 2. PRODUCT INFORMATION */}
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Package size={14} /> 2. PRODUCT INFORMATION
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Code / SKU *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCM-650"
                  value={createProductForm.sku}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, sku: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 650mg ER Tablets"
                  value={createProductForm.name}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Generic Molecule / Active Ingredient *
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol IP 650mg"
                value={createProductForm.saltCombination}
                onChange={(e) => setCreateProductForm({ ...createProductForm, saltCombination: e.target.value, genericName: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Strength
                </label>
                <input
                  type="text"
                  placeholder="e.g. 650mg"
                  value={createProductForm.strength}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, strength: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Packaging / Pack Size *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 × 1 × 10 Strip"
                  value={createProductForm.packaging}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, packaging: e.target.value, packSize: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  UOM
                </label>
                <select
                  value={createProductForm.uom}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, uom: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Strip">Strip</option>
                  <option value="Box">Box</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Vial">Vial</option>
                  <option value="Pack">Pack</option>
                  <option value="Units">Units</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Product Description
              </label>
              <textarea
                rows={2}
                placeholder="Enter manufacturing specifications, compliance details..."
                value={createProductForm.description}
                onChange={(e) => setCreateProductForm({ ...createProductForm, description: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
              />
            </div>

            {/* 3. MANUFACTURER SPECIFICATIONS & MAPPING */}
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <ShieldCheck size={14} /> 3. MANUFACTURER SPECIFICATIONS & MAPPING
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Manufacturing Source:</span>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{mfgDisplayName} ({mfgCode})</div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 700 }}>
                  Verified Supplier
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Minimum Order Qty (MOQ) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createProductForm.moq}
                    onChange={(e) => setCreateProductForm({ ...createProductForm, moq: Number(e.target.value) || 0 })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Delivery Lead Time (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={createProductForm.standardLeadTimeDays}
                    onChange={(e) => setCreateProductForm({ ...createProductForm, standardLeadTimeDays: Number(e.target.value) || 0 })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Est. Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={createProductForm.basePrice}
                    onChange={(e) => setCreateProductForm({ ...createProductForm, basePrice: Number(e.target.value) || 0 })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
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
                  value={createProductForm.certificationsStr}
                  onChange={(e) => setCreateProductForm({ ...createProductForm, certificationsStr: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: '9px 24px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
              >
                {isSubmitting ? 'Saving...' : 'Save to Product Catalog'}
              </button>
            </div>
          </form>
        ) : !selectedCentralProduct ? (
          /* SUB-FLOW 2: MAP EXISTING MASTER PRODUCT */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
              SELECT PRODUCT MASTER
            </div>

            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search product name, generic name or product code..."
                value={centralSearchQuery}
                onChange={(e) => setCentralSearchQuery(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, outline: 'none', background: '#F8FAFC' }}
              />
            </div>

            {isLoadingMasterProducts ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: 13 }}>
                Searching central product master...
              </div>
            ) : centralProductResults.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 13 }}>
                No central products found. You can switch to the "+ Create New Product (Manual)" tab to add a new formulation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                {centralProductResults.map((prd) => {
                  return (
                    <div
                      key={prd.id}
                      onClick={() => handleSelectCentralProduct(prd)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{prd.name}</div>
                        <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                          <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{prd.productCode}</strong> · {prd.genericName} · {prd.dosageForm} ({prd.strength})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSelectCentralProduct(prd); }}
                        style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', cursor: 'pointer' }}
                      >
                        Select →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: ENTER MANUFACTURER-SPECIFIC DETAILS FOR MAPPING */
          <form onSubmit={handleSaveAddMapping} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* READ-ONLY CENTRAL PRODUCT INFO */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
                  PRODUCT INFORMATION (READ-ONLY MASTER)
                </div>
                <button type="button" onClick={() => setSelectedCentralProduct(null)} style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Change Product
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div>Product Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{selectedCentralProduct.productCode}</strong></div>
                <div>Product Name: <strong style={{ color: '#0F172A' }}>{selectedCentralProduct.name}</strong></div>
                <div>Generic Name: <strong>{selectedCentralProduct.genericName}</strong></div>
                <div>Dosage & Strength: <strong>{selectedCentralProduct.dosageForm} {selectedCentralProduct.strength}</strong></div>
              </div>
            </div>

            {/* EDITABLE MANUFACTURER PRODUCT DETAILS */}
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', letterSpacing: '0.06em' }}>
              MANUFACTURER PRODUCT DETAILS
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer</label>
              <input type="text" readOnly value={mfgDisplayName} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, background: '#F1F5F9', color: '#334155', fontWeight: 700 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Manufacturer Product Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUN-PCM-650"
                  value={mappingFormData.mfgProductCode}
                  onChange={(e) => setMappingFormData({ ...mappingFormData, mfgProductCode: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', outline: 'none' }}
                />
                <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Does not replace central code {selectedCentralProduct.productCode}</span>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Status</label>
                <select
                  value={mappingFormData.status}
                  onChange={(e) => setMappingFormData({ ...mappingFormData, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending Compliance">Pending Compliance</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Packaging Details *</label>
              <input
                type="text"
                required
                placeholder="e.g. 10 × 1 × 10 Strip or 1 x 100 ml Bottle"
                value={mappingFormData.packaging}
                onChange={(e) => setMappingFormData({ ...mappingFormData, packaging: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
              />
              <span style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, display: 'block' }}>Manufacturer packaging specification</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Minimum Order Quantity (MOQ) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mappingFormData.moq}
                  onChange={(e) => setMappingFormData({ ...mappingFormData, moq: Number(e.target.value) || 0 })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Standard Delivery Schedule (Days) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={mappingFormData.standardLeadTimeDays}
                  onChange={(e) => setMappingFormData({ ...mappingFormData, standardLeadTimeDays: Number(e.target.value) || 0 })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Product-Specific Certifications</label>
              <input
                type="text"
                placeholder="WHO-GMP, CDSCO Applicable, ISO 9001:2015"
                value={mappingFormData.certificationsStr}
                onChange={(e) => setMappingFormData({ ...mappingFormData, certificationsStr: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer' }}
              >
                {isSubmitting ? 'Saving...' : 'Save to Product Catalog'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// =====================================================================
// EDIT PRODUCT MODAL
// =====================================================================
interface EditProductModalProps {
  mapping: ManufacturerProductMappingItem;
  onClose: () => void;
  onSuccess: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ mapping, onClose, onSuccess }) => {
  const [mfgProductCode, setMfgProductCode] = useState<string>(mapping.manufacturerProductCode || '');
  const [mfgSku, setMfgSku] = useState<string>(mapping.manufacturerSku || '');
  const [moq, setMoq] = useState<number>(mapping.moq || 1000);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(mapping.leadTimeDays || 14);
  const [packagingDetails, setPackagingDetails] = useState<string>(mapping.packagingDetails || '');
  const [lifecycleStatus, setLifecycleStatus] = useState<'ACTIVE' | 'INACTIVE'>(mapping.lifecycleStatus || 'ACTIVE');
  const [isPreferred, setIsPreferred] = useState<boolean>(mapping.isPreferred || false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await manufacturerProductsApi.updateMapping(mapping.id, {
        manufacturerProductCode: mfgProductCode || undefined,
        manufacturerSku: mfgSku || undefined,
        moq: Number(moq) || 1000,
        leadTimeDays: Number(leadTimeDays) || 14,
        packagingDetails: packagingDetails || undefined,
        lifecycleStatus,
        isPreferred,
      });

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to update mapping.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
              Edit Facility Commercial Terms
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              {mapping.product?.name} ({mapping.product?.productCode})
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 14px', borderRadius: 8, color: '#991B1B', fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Facility Product Code
              </label>
              <input
                type="text"
                value={mfgProductCode}
                onChange={(e) => setMfgProductCode(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Manufacturer SKU
              </label>
              <input
                type="text"
                value={mfgSku}
                onChange={(e) => setMfgSku(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Minimum Order Qty (MOQ)
              </label>
              <input
                type="number"
                min={1}
                value={moq}
                onChange={(e) => setMoq(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Lead Time (Days)
              </label>
              <input
                type="number"
                min={1}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Packaging Details
            </label>
            <input
              type="text"
              value={packagingDetails}
              onChange={(e) => setPackagingDetails(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
              Lifecycle Status
            </label>
            <select
              value={lifecycleStatus}
              onChange={(e) => setLifecycleStatus(e.target.value as any)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, background: '#FFFFFF' }}
            >
              <option value="ACTIVE">ACTIVE (Available for RFQ Quotations)</option>
              <option value="INACTIVE">INACTIVE (Hidden from Buyer Catalog)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="editPref"
              checked={isPreferred}
              onChange={(e) => setIsPreferred(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="editPref" style={{ fontSize: 13, color: '#334155', cursor: 'pointer' }}>
              Preferred manufacturing facility for this formulation
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: isSaving ? 'wait' : 'pointer' }}
            >
              {isSaving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =====================================================================
// PRODUCT DETAIL DRAWER
// =====================================================================
interface ProductDetailDrawerProps {
  mapping: ManufacturerProductMappingItem;
  onClose: () => void;
}

const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({ mapping, onClose }) => {
  const p = mapping.product || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 9999,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 580,
        height: '100%',
        background: '#FFFFFF',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
              Formulation Specifications
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
              {p.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Summary */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#475569', background: '#FFFFFF', padding: '2px 8px', borderRadius: 4, border: '1px solid #E2E8F0' }}>
                {p.productCode}
              </span>
              <span style={{
                padding: '3px 10px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                background: mapping.lifecycleStatus === 'ACTIVE' ? '#ECFDF5' : '#F1F5F9',
                color: mapping.lifecycleStatus === 'ACTIVE' ? '#059669' : '#64748B',
              }}>
                {mapping.lifecycleStatus}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginTop: 10 }}>
              Generic / Salt Molecule
            </div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              {p.genericName || 'Compendial formulation'}
            </div>
          </div>

          {/* Categorization */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
              Categorization & Hierarchy
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Category:</span> <strong>{p.category}</strong></div>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Sub-Category:</span> <strong>{p.subCategory || 'General'}</strong></div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#64748B', fontSize: 11 }}>Classification:</span> <strong>{p.subSubCategory || 'Standard Formulation'}</strong>
              </div>
            </div>
          </div>

          {/* Dynamic Specifications & Characteristics */}
          {p.attributes && typeof p.attributes === 'object' && Object.keys(p.attributes).length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                Dynamic Category Specifications
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                {Object.entries(p.attributes).map(([attrKey, attrVal]) => (
                  <div key={attrKey}>
                    <span style={{ color: '#64748B', fontSize: 11, textTransform: 'capitalize', display: 'block' }}>
                      {attrKey.replace(/^attr_/, '').replace(/_/g, ' ')}
                    </span>
                    <strong>{String(attrVal) || '—'}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pharmaceutical Characteristics */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
              Pharmaceutical Characteristics
            </div>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Dosage Form:</span> <strong>{p.dosageForm}</strong></div>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Strength:</span> <strong>{p.strength || 'Standard'}</strong></div>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Standard Pack Size:</span> <strong>{p.packSize}</strong></div>
              <div><span style={{ color: '#64748B', fontSize: 11 }}>Base UOM:</span> <strong>{p.baseUom}</strong></div>
            </div>
          </div>

          {/* Facility Commercial & Fulfillment Terms */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', marginBottom: 8 }}>
              Facility Commercial Terms
            </div>
            <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: '#0F766E', fontSize: 11 }}>Facility Product Code</span>
                <strong style={{ color: '#0F172A' }}>{mapping.manufacturerProductCode || p.productCode}</strong>
              </div>
              <div>
                <span style={{ color: '#0F766E', fontSize: 11 }}>Facility SKU / MPN</span>
                <strong style={{ color: '#0F172A' }}>{mapping.manufacturerSku || mapping.manufacturerPartNumber || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#0F766E', fontSize: 11 }}>Minimum Order Quantity (MOQ)</span>
                <strong style={{ color: '#0F172A' }}>{(mapping.moq || 1000).toLocaleString()} {p.baseUom || 'Units'}</strong>
              </div>
              <div>
                <span style={{ color: '#0F766E', fontSize: 11 }}>Manufacturing Lead Time</span>
                <strong style={{ color: '#0F172A' }}>{mapping.leadTimeDays || 14} Days</strong>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: '#0F766E', fontSize: 11 }}>Facility Packaging Configuration</span>
                <strong style={{ color: '#0F172A' }}>{mapping.packagingDetails || p.packSize}</strong>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
