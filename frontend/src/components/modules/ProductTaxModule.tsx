import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt, Search, Plus, Edit3, Trash2, X, AlertTriangle,
  Package, Percent, Calendar, Eye, Power, MoreVertical,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { ProductTax } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const ProductTaxModule: React.FC = () => {
  const {
    products,
    productTaxes,
    addProductTax,
    updateProductTax,
    removeProductTax,
    toggleProductTaxStatus,
    refreshProductTaxes,
    currentRole
  } = useApp();

  const isAdmin = currentRole === 'ADMIN' || (currentRole as any) === 'ROLE_ADMIN';
  const isManufacturer = currentRole === 'MANUFACTURER';
  const isBuyer = currentRole === 'BUYER';
  const canEdit = isAdmin; // Only platform admin can manage and approve central tax configurations

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

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
  const [editingTax, setEditingTax] = useState<ProductTax | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal State
  const [selectedTaxForDetail, setSelectedTaxForDetail] = useState<ProductTax | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<ProductTax | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [formData, setFormData] = useState({
    product_id: '',
    tax_code: 'HSN-3004-10',
    tax_rate: 12,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
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
    const total = (productTaxes || []).length;
    const active = (productTaxes || []).filter(t => (t.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const inactive = total - active;
    const uniqueProducts = new Set((productTaxes || []).map(t => t.product_id || (t as any).productId)).size;
    const avgRate = total > 0
      ? ((productTaxes || []).reduce((acc, t) => acc + Number(t.tax_rate ?? (t as any).taxRate ?? 0), 0) / total).toFixed(1)
      : '0.0';
    return { total, active, inactive, uniqueProducts, avgRate };
  }, [productTaxes]);

  // Filtered List
  const filteredTaxes = useMemo(() => {
    return (productTaxes || []).filter(tax => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(tax.product_id || (tax as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || (prd as any)?.productCode || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || tax.product_id || '').toLowerCase();
      const taxCode = (tax.tax_code || (tax as any).taxCode || '').toLowerCase();
      const taxId = String(tax.product_tax_id || (tax as any).id || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        taxId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        taxCode.includes(q);

      const prdKey = tax.product_id || (tax as any).productId;
      const matchesPrd = selectedProductId === 'ALL' || prdKey === selectedProductId;
      const statusVal = (tax.status || 'ACTIVE').toUpperCase();
      const matchesStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;

      // Buyer/Manufacturer consume active taxes
      if ((isBuyer || isManufacturer) && statusVal !== 'ACTIVE') {
        return false;
      }

      return matchesSearch && matchesPrd && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.created_at || (b as any).createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return String(b.product_tax_id || (b as any).id || '').localeCompare(String(a.product_tax_id || (a as any).id || ''));
    });
  }, [productTaxes, products, searchTerm, selectedProductId, selectedStatus, isBuyer, isManufacturer]);

  const {
    paginatedItems: paginatedTaxes,
    paginationProps,
    resetPage
  } = usePagination(filteredTaxes, {
    initialPageSize: 10,
    resetDeps: [searchTerm, selectedProductId, selectedStatus]
  });

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingTax(null);
    const firstPrd = products && products.length > 0 ? (products[0].id || products[0].product_id) : '';

    setFormData({
      product_id: firstPrd || '',
      tax_code: 'HSN-3004-10',
      tax_rate: 12,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tax: ProductTax) => {
    setEditingTax(tax);
    setFormData({
      product_id: tax.product_id || (tax as any).productId || '',
      tax_code: tax.tax_code || (tax as any).taxCode || 'HSN-3004-10',
      tax_rate: Number(tax.tax_rate ?? (tax as any).taxRate ?? 12),
      effective_from: tax.effective_from ? tax.effective_from.split('T')[0] : ((tax as any).effectiveFrom ? (tax as any).effectiveFrom.split('T')[0] : ''),
      effective_to: tax.effective_to ? tax.effective_to.split('T')[0] : ((tax as any).effectiveTo ? (tax as any).effectiveTo.split('T')[0] : ''),
      status: ((tax.status || 'ACTIVE').toUpperCase()) as any
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.product_id) {
      setFormError('Please select a product from the central Product Master.');
      return;
    }

    if (!formData.tax_code.trim()) {
      setFormError('Tax / HSN code is required.');
      return;
    }

    if (Number(formData.tax_rate) < 0) {
      setFormError('Tax rate cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTax) {
        const tId = editingTax.product_tax_id || editingTax.id!;
        await updateProductTax(tId, {
          tax_code: formData.tax_code.trim(),
          tax_rate: Number(formData.tax_rate),
          effective_from: formData.effective_from || null,
          effective_to: formData.effective_to || null,
          status: formData.status
        });
        showToast(`Updated tax mapping #${tId} (${formData.tax_code})`);
      } else {
        const created = await addProductTax({
          product_id: formData.product_id,
          product_tax_id: '',
          tax_code: formData.tax_code.trim(),
          tax_rate: Number(formData.tax_rate),
          effective_from: formData.effective_from || new Date().toISOString().split('T')[0],
          effective_to: formData.effective_to || null,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);
        const newId = (created as any)?.product_tax_id || (created as any)?.id || 'new';
        showToast(`Created tax mapping #${newId} (${formData.tax_code} — ${formData.tax_rate}%)`);
      }
      setIsModalOpen(false);
      resetPage();
    } catch (err: any) {
      setFormError(err.message || 'Failed to persist tax mapping to PostgreSQL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (tax: ProductTax) => {
    const id = tax.product_tax_id || tax.id!;
    try {
      if (toggleProductTaxStatus) {
        await toggleProductTaxStatus(id);
      } else {
        const next = (tax.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateProductTax(id, { status: next as any });
      }
      showToast(`Toggled tax status for #${id}`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to toggle status'}`);
    }
  };

  const handleDeleteTax = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.product_tax_id || deleteTarget.id!;
    try {
      await removeProductTax(id);
      showToast(`Deleted tax mapping #${id}`);
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
            <Receipt size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product Tax Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Central HSN codes, GST schedules, and statutory tax rates mapped to catalog products.
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
              <Plus size={15} /> Add Tax Mapping
            </button>
          )}
        </div>
      </div>

      {/* ── Compact Statistics Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Receipt size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tax Mappings</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDF4', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Mappings</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C' }}>
            <AlertTriangle size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Inactive Mappings</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C' }}>{stats.inactive}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <Package size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Covered</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E' }}>{stats.uniqueProducts}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Percent size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average GST</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1D4ED8' }}>{stats.avgRate}%</div>
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
            placeholder="Search tax ID, product name, code, HSN code..."
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
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
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
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>HSN / Tax Code</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>GST Rate</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Validity Range</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTaxes.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Receipt size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No tax mapping records found.</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      Statutory tax rates configured in PostgreSQL will appear here.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTaxes.map(tax => {
                  const taxId = tax.product_tax_id || tax.id || '—';
                  const prod = getProductRecord(tax.product_id || (tax as any).productId || '');
                  const status = (tax.status || 'ACTIVE').toUpperCase();
                  const isActive = status === 'ACTIVE';
                  const taxRate = Number(tax.tax_rate ?? (tax as any).taxRate ?? 0);

                  return (
                    <tr
                      key={taxId}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', background: '#F0FDFA', padding: '2px 6px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                          #{taxId}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                          {prod?.name || prod?.product_name || tax.product_id}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                            {prod?.product_code || prod?.code || (prod as any)?.productCode || tax.product_id}
                          </span>
                          {prod?.category && (
                            <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>
                              {prod.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* HSN Code */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', fontFamily: 'monospace', background: '#EFF6FF', padding: '3px 8px', borderRadius: 4, border: '1px solid #BFDBFE' }}>
                          {tax.tax_code || (tax as any).taxCode || '—'}
                        </span>
                      </td>

                      {/* Tax Rate */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: taxRate >= 18 ? '#FEF3C7' : '#F0FDFA',
                          color: taxRate >= 18 ? '#B45309' : '#0F766E',
                          border: taxRate >= 18 ? '1px solid #FDE68A' : '1px solid #CCFBF1',
                          fontFamily: 'monospace'
                        }}>
                          {taxRate.toFixed(1)}% GST
                        </span>
                      </td>

                      {/* Validity */}
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 11.5 }}>
                        <div>{formatMasterDate(tax.effective_from || (tax as any).effectiveFrom)}</div>
                        <div style={{ color: '#94A3B8', fontSize: 10.5 }}>to {formatMasterDate(tax.effective_to || (tax as any).effectiveTo)}</div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 800, padding: '3px 7px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#B91C1C',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                        }}>
                          {status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }} data-actions-menu={`tax_${taxId}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === `tax_${taxId}` ? null : `tax_${taxId}`);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: openActionMenuId === `tax_${taxId}` ? '#F1F5F9' : '#FFFFFF',
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

                          {openActionMenuId === `tax_${taxId}` && (
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
                                  setSelectedTaxForDetail(tax);
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
                                      handleOpenEditModal(tax);
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
                                      handleToggleStatus(tax);
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
                                      setDeleteTarget(tax);
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

      {/* ── Add / Edit Tax Modal ───────────────────────────────────── */}
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
                <Receipt size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingTax ? `Edit Tax Mapping #${editingTax.product_tax_id || editingTax.id}` : 'Create Product Tax Mapping'}
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

            <form onSubmit={handleSaveTax} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  disabled={Boolean(editingTax)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', background: editingTax ? '#F1F5F9' : '#FFFFFF' }}
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

              {/* Tax Code & Tax Rate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Tax / HSN Code <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSN-3004-10"
                    value={formData.tax_code}
                    onChange={e => setFormData({ ...formData, tax_code: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    GST Rate (%) <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Effective Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Effective To
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={e => setFormData({ ...formData, effective_to: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Mapping Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
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
                  {isSubmitting ? 'Saving...' : editingTax ? 'Update Tax Mapping' : 'Save Tax Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ─────────────────────────────────────── */}
      {selectedTaxForDetail && (
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
                  Tax Mapping Details #{selectedTaxForDetail.product_tax_id || selectedTaxForDetail.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaxForDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              {(() => {
                const prod = getProductRecord(selectedTaxForDetail.product_id || (selectedTaxForDetail as any).productId || '');
                const status = (selectedTaxForDetail.status || 'ACTIVE').toUpperCase();
                const taxRate = Number(selectedTaxForDetail.tax_rate ?? (selectedTaxForDetail as any).taxRate ?? 0);

                return (
                  <>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Target Product</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                        {prod?.name || prod?.product_name || selectedTaxForDetail.product_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace', marginTop: 2, fontWeight: 700 }}>
                        {prod?.product_code || prod?.code || selectedTaxForDetail.product_id}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 8, border: '1px solid #BFDBFE' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>HSN / Tax Code</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1E40AF', marginTop: 2, fontFamily: 'monospace' }}>
                          {selectedTaxForDetail.tax_code || (selectedTaxForDetail as any).taxCode || '—'}
                        </div>
                      </div>

                      <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, border: '1px solid #CCFBF1' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Statutory GST Rate</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#0F766E', marginTop: 2, fontFamily: 'monospace' }}>
                          {taxRate.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Effective From</div>
                        <div style={{ fontSize: 13, color: '#0F172A' }}>
                          {formatMasterDate(selectedTaxForDetail.effective_from)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Effective To</div>
                        <div style={{ fontSize: 13, color: '#0F172A' }}>
                          {formatMasterDate(selectedTaxForDetail.effective_to)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                      <span>Status: <strong style={{ color: status === 'ACTIVE' ? '#15803D' : '#B91C1C' }}>{status}</strong></span>
                      <span>Created: {formatMasterDate(selectedTaxForDetail.created_at)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedTaxForDetail(null)}
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
              Delete Tax Mapping #{deleteTarget.product_tax_id || deleteTarget.id}?
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#64748B' }}>
              This will remove this tax rate mapping from the central PostgreSQL database. This action cannot be undone.
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
                onClick={handleDeleteTax}
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
