import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers, Search, Plus, Edit3, Trash2, X, AlertTriangle,
  Package, CheckCircle2, Eye, Power, MoreVertical,
  Check, Hash, ArrowRight
} from 'lucide-react';
import { ProductUom } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const ProductUomModule: React.FC = () => {
  const {
    products,
    productUoms,
    addProductUom,
    updateProductUom,
    removeProductUom,
    toggleProductUomStatus,
    refreshProductUoms,
    currentRole
  } = useApp();

  const isAdmin = currentRole === 'ADMIN' || (currentRole as any) === 'ROLE_ADMIN';
  const isManufacturer = currentRole === 'MANUFACTURER';
  const isBuyer = currentRole === 'BUYER';
  const canEdit = isAdmin; // Platform admin manages and governs central UOM configurations

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Single active row dropdown state for standardized Actions menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-actions-menu]')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<ProductUom | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal State
  const [selectedUomForDetail, setSelectedUomForDetail] = useState<ProductUom | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<ProductUom | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [formData, setFormData] = useState({
    product_id: '',
    uom: 'Box',
    conversion_factor: 10,
    is_base_uom: false,
    is_order_uom: true,
    is_active: true
  });

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid || (p as any).productCode === pid);
  };

  const formatMasterDate = (dateStr?: string | null): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // KPI Statistics
  const stats = useMemo(() => {
    const total = (productUoms || []).length;
    const active = (productUoms || []).filter(u => Boolean(u.is_active ?? (u as any).isActive ?? true)).length;
    const inactive = total - active;
    const baseUnits = (productUoms || []).filter(u => Boolean(u.is_base_uom ?? (u as any).isBaseUom ?? false)).length;
    const orderUnits = (productUoms || []).filter(u => Boolean(u.is_order_uom ?? (u as any).isOrderUom ?? true)).length;
    const uniqueProducts = new Set((productUoms || []).map(u => u.product_id || (u as any).productId)).size;
    return { total, active, inactive, baseUnits, orderUnits, uniqueProducts };
  }, [productUoms]);

  // Filtered List
  const filteredUoms = useMemo(() => {
    return (productUoms || []).filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(u.product_id || (u as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || (prd as any)?.productCode || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || u.product_id || '').toLowerCase();
      const uomStr = (u.uom || '').toLowerCase();
      const uomId = String(u.product_uom_id || (u as any).id || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        uomId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        uomStr.includes(q);

      const prdKey = u.product_id || (u as any).productId;
      const matchesPrd = selectedProductId === 'ALL' || prdKey === selectedProductId;
      const isActive = Boolean(u.is_active ?? (u as any).isActive ?? true);
      const matchesActive = activeFilter === 'ALL' || (activeFilter === 'ACTIVE' ? isActive : !isActive);

      // Buyer isolation: buyer sees active orderable units
      if (isBuyer && !isActive) {
        return false;
      }

      return matchesSearch && matchesPrd && matchesActive;
    }).sort((a, b) => {
      const isBaseA = Boolean(a.is_base_uom ?? (a as any).isBaseUom);
      const isBaseB = Boolean(b.is_base_uom ?? (b as any).isBaseUom);
      if (isBaseA !== isBaseB) return isBaseB ? 1 : -1;
      const dateA = new Date(a.created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.created_at || (b as any).createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return String(b.product_uom_id || (b as any).id || '').localeCompare(String(a.product_uom_id || (a as any).id || ''));
    });
  }, [productUoms, products, searchTerm, selectedProductId, activeFilter, isBuyer]);

  const {
    paginatedItems: paginatedUoms,
    paginationProps,
    resetPage
  } = usePagination(filteredUoms, {
    initialPageSize: 10,
    resetDeps: [searchTerm, selectedProductId, activeFilter]
  });

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingUom(null);
    const firstPrd = products && products.length > 0 ? (products[0].id || products[0].product_id) : '';

    setFormData({
      product_id: firstPrd || '',
      uom: 'Box',
      conversion_factor: 10,
      is_base_uom: false,
      is_order_uom: true,
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (uom: ProductUom) => {
    setEditingUom(uom);
    setFormData({
      product_id: uom.product_id || (uom as any).productId || '',
      uom: uom.uom || '',
      conversion_factor: Number(uom.conversion_factor ?? (uom as any).conversionFactor ?? 1),
      is_base_uom: Boolean(uom.is_base_uom ?? (uom as any).isBaseUom ?? false),
      is_order_uom: Boolean(uom.is_order_uom ?? (uom as any).isOrderUom ?? true),
      is_active: Boolean(uom.is_active ?? (uom as any).isActive ?? true)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.product_id) {
      setFormError('Please select a product from the central Product Master.');
      return;
    }

    if (!formData.uom.trim()) {
      setFormError('Unit of measure name is required.');
      return;
    }

    if (Number(formData.conversion_factor) <= 0) {
      setFormError('Conversion factor must be a positive number greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUom) {
        const uId = editingUom.product_uom_id || editingUom.id!;
        await updateProductUom(uId, {
          uom: formData.uom.trim(),
          conversion_factor: Number(formData.conversion_factor),
          is_base_uom: formData.is_base_uom,
          is_order_uom: formData.is_order_uom,
          is_active: formData.is_active
        });
        showToast(`Updated UOM mapping #${uId} (${formData.uom})`);
      } else {
        const created = await addProductUom({
          product_id: formData.product_id,
          product_uom_id: '',
          uom: formData.uom.trim(),
          conversion_factor: Number(formData.conversion_factor),
          is_base_uom: formData.is_base_uom,
          is_order_uom: formData.is_order_uom,
          is_active: formData.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);
        const newId = (created as any)?.product_uom_id || (created as any)?.id || 'new';
        showToast(`Created UOM #${newId} (${formData.uom} = ${formData.conversion_factor}x base unit)`);
      }
      setIsModalOpen(false);
      resetPage();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save UOM configuration to PostgreSQL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (uom: ProductUom) => {
    const id = uom.product_uom_id || uom.id!;
    try {
      if (toggleProductUomStatus) {
        await toggleProductUomStatus(id);
      } else {
        const next = !Boolean(uom.is_active ?? (uom as any).isActive ?? true);
        await updateProductUom(id, { is_active: next });
      }
      showToast(`Toggled UOM status for #${id}`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to toggle status'}`);
    }
  };

  const handleDeleteUom = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.product_uom_id || deleteTarget.id!;
    try {
      await removeProductUom(id);
      showToast(`Deleted UOM mapping #${id}`);
      setDeleteTarget(null);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to delete record'}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 600
        }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#F0FDFA',
            border: '1px solid #CCFBF1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F766E'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product UOM Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Base inventory units, commercial packaging multipliers, and procurement order unit definitions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              style={{
                padding: '9px 16px',
                borderRadius: 8,
                background: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 2px rgba(15,118,110,0.2)'
              }}
            >
              <Plus size={15} /> Add UOM Mapping
            </button>
          )}
        </div>
      </div>

      {/* ── Compact Statistics Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Layers size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>UOM Mappings</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDF4', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Units</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Check size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Base Units</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1D4ED8' }}>{stats.baseUnits}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <Package size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Orderable Units</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E' }}>{stats.orderUnits}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Hash size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Covered</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.uniqueProducts}</div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Strip ──────────────────────────────────── */}
      <div style={{
        padding: '12px 16px',
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: 6,
          padding: '6px 12px',
          flex: '1 1 240px'
        }}>
          <Search size={14} style={{ color: '#64748B', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search UOM name, ID, product name or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', padding: 0, background: 'transparent', width: '100%', fontSize: 12.5, color: '#0F172A', outline: 'none' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Product Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Product:</span>
          <select
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, color: '#0F172A', outline: 'none', maxWidth: 200 }}
          >
            <option value="ALL">All Products</option>
            {(products || []).map(p => {
              const pid = p.id || p.product_id;
              const name = p.name || p.product_name || pid;
              return <option key={pid} value={pid}>{name}</option>;
            })}
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value as any)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, color: '#0F172A', outline: 'none' }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* ── Enterprise Data Table ──────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,23,42,0.03)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', width: 90 }}>ID</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Product</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>UOM Name</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Conversion Factor</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Unit Roles</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUoms.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Layers size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No UOM mappings found.</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      Unit configurations from PostgreSQL will appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUoms.map(uom => {
                  const uomId = uom.product_uom_id || uom.id || '—';
                  const prod = getProductRecord(uom.product_id || (uom as any).productId || '');
                  const isActive = Boolean(uom.is_active ?? (uom as any).isActive ?? true);
                  const isBase = Boolean(uom.is_base_uom ?? (uom as any).isBaseUom ?? false);
                  const isOrder = Boolean(uom.is_order_uom ?? (uom as any).isOrderUom ?? true);
                  const factor = Number(uom.conversion_factor ?? (uom as any).conversionFactor ?? 1);

                  return (
                    <tr
                      key={uomId}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', background: '#F0FDFA', padding: '2px 6px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                          #{uomId}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                          {prod?.name || prod?.product_name || uom.product_id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                            {prod?.product_code || prod?.code || (prod as any)?.productCode || uom.product_id}
                          </span>
                          {prod?.category && (
                            <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>
                              {prod.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* UOM Name */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                          {uom.uom}
                        </span>
                      </td>

                      {/* Conversion Factor */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
                          background: isBase ? '#F0FDFA' : '#EFF6FF',
                          color: isBase ? '#0F766E' : '#1D4ED8',
                          border: isBase ? '1px solid #CCFBF1' : '1px solid #BFDBFE',
                          fontFamily: 'monospace'
                        }}>
                          {factor}x base unit
                        </span>
                      </td>

                      {/* Roles */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {isBase && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                              BASE UNIT
                            </span>
                          )}
                          {isOrder && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                              ORDERABLE
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 800, padding: '3px 7px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#B91C1C',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                        }}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }} data-actions-menu={`uom_${uomId}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === `uom_${uomId}` ? null : `uom_${uomId}`);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: openActionMenuId === `uom_${uomId}` ? '#F1F5F9' : '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                            title="Actions"
                          >
                            <span>Actions</span>
                            <MoreVertical size={13} style={{ color: '#64748B' }} />
                          </button>

                          {openActionMenuId === `uom_${uomId}` && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 4px)',
                                zIndex: 1000,
                                minWidth: 160,
                                background: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                boxShadow: '0 10px 25px -5px rgba(15,23,42,0.15)',
                                padding: '4px 0',
                                textAlign: 'left'
                              }}
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setSelectedUomForDetail(uom);
                                }}
                                style={{
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  padding: '7px 14px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: '#334155',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <Eye size={13} style={{ color: '#0F766E' }} />
                                <span>View Details</span>
                              </button>

                              {canEdit && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleOpenEditModal(uom);
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '7px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#334155',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <Edit3 size={13} style={{ color: '#0F766E' }} />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handleToggleStatus(uom);
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '7px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#334155',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <Power size={13} style={{ color: isActive ? '#D97706' : '#16A34A' }} />
                                    <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                                  </button>

                                  <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setDeleteTarget(uom);
                                    }}
                                    style={{
                                      width: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '7px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#DC2626',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <Trash2 size={13} style={{ color: '#DC2626' }} />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '10px 16px', background: '#FAFAFA' }}>
          <PaginationControl {...paginationProps} />
        </div>
      </div>

      {/* ── Add / Edit UOM Modal ───────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #CBD5E1',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 540,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingUom ? `Edit UOM Configuration #${editingUom.product_uom_id || editingUom.id}` : 'Create Product UOM Configuration'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUom} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, color: '#B91C1C', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Select */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Catalog Product <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  value={formData.product_id}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                  disabled={Boolean(editingUom)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', background: editingUom ? '#F1F5F9' : '#FFFFFF' }}
                >
                  <option value="">Select a Product...</option>
                  {(products || []).map(p => {
                    const pid = p.id || p.product_id;
                    const pcode = p.product_code || p.code || (p as any).productCode;
                    const pname = p.name || p.product_name;
                    return (
                      <option key={pid} value={pid}>
                        {pcode} — {pname}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* UOM Name & Factor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Unit of Measure <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Strip, Box, Carton, Tablet"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Conversion Factor <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={formData.conversion_factor}
                    onChange={e => setFormData({ ...formData, conversion_factor: parseFloat(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Roles Checkboxes */}
              <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_base_uom}
                    onChange={e => setFormData({ ...formData, is_base_uom: e.target.checked, conversion_factor: e.target.checked ? 1 : formData.conversion_factor })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Base Inventory Unit (Defines 1.0x baseline for stock & costing)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_order_uom}
                    onChange={e => setFormData({ ...formData, is_order_uom: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Orderable Unit (Available for buyers & procurement orders)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Active & Ready for use in marketplace</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Saving...' : editingUom ? 'Update UOM' : 'Save UOM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ─────────────────────────────────────── */}
      {selectedUomForDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #CBD5E1',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 480,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  UOM Details #{selectedUomForDetail.product_uom_id || selectedUomForDetail.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUomForDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              {(() => {
                const prod = getProductRecord(selectedUomForDetail.product_id || (selectedUomForDetail as any).productId || '');
                const isActive = Boolean(selectedUomForDetail.is_active ?? (selectedUomForDetail as any).isActive ?? true);
                const isBase = Boolean(selectedUomForDetail.is_base_uom ?? (selectedUomForDetail as any).isBaseUom ?? false);
                const isOrder = Boolean(selectedUomForDetail.is_order_uom ?? (selectedUomForDetail as any).isOrderUom ?? true);
                const factor = Number(selectedUomForDetail.conversion_factor ?? (selectedUomForDetail as any).conversionFactor ?? 1);

                return (
                  <>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Target Product</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                        {prod?.name || prod?.product_name || selectedUomForDetail.product_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace', marginTop: 2, fontWeight: 700 }}>
                        {prod?.product_code || prod?.code || selectedUomForDetail.product_id}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Unit of Measure</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                          {selectedUomForDetail.uom}
                        </div>
                      </div>

                      <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, border: '1px solid #CCFBF1' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Conversion Factor</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: '#0F766E', marginTop: 2, fontFamily: 'monospace' }}>
                          {factor}x Base
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Base Unit:</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: isBase ? '#15803D' : '#64748B', marginTop: 2 }}>
                          {isBase ? 'Yes (1x Baseline)' : 'No (Packaging Unit)'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Orderable:</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: isOrder ? '#1D4ED8' : '#64748B', marginTop: 2 }}>
                          {isOrder ? 'Yes (Available for orders)' : 'No'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                      <span>Status: <strong style={{ color: isActive ? '#15803D' : '#B91C1C' }}>{isActive ? 'ACTIVE' : 'INACTIVE'}</strong></span>
                      <span>Created: {formatMasterDate(selectedUomForDetail.created_at)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedUomForDetail(null)}
                style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #CBD5E1',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 420,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#DC2626' }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Delete UOM #{deleteTarget.product_uom_id || deleteTarget.id}?
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#64748B' }}>
              This will remove this unit mapping from the PostgreSQL database. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUom}
                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#DC2626', fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
