import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Tag, Search, Plus, Edit3, Trash2, X, AlertTriangle,
  Package, Users, Calendar, Eye, Power, MoreVertical,
  CheckCircle2, DollarSign, Building2, RefreshCw, Layers
} from 'lucide-react';
import { ProductPrice } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const ProductPriceModule: React.FC = () => {
  const {
    products,
    manufacturers,
    mappings,
    customerSegments,
    productPrices,
    addProductPrice,
    updateProductPrice,
    removeProductPrice,
    toggleProductPriceStatus,
    refreshProductPrices,
    currentRole
  } = useApp();

  // Role permissions
  const isAdmin = currentRole === 'ADMIN' || (currentRole as any) === 'ROLE_ADMIN';
  const isManufacturer = currentRole === 'MANUFACTURER';
  const isBuyer = currentRole === 'BUYER';
  const canEdit = isAdmin || isManufacturer;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Single active row dropdown state for standardized Actions menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Outside click listener for action menu
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
  const [editingPrice, setEditingPrice] = useState<ProductPrice | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal State
  const [selectedPriceForDetail, setSelectedPriceForDetail] = useState<ProductPrice | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<ProductPrice | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [formData, setFormData] = useState({
    product_id: '',
    product_manufacturer_id: '' as string,
    customer_segment_id: '',
    price_type: 'TIERED' as 'FIXED' | 'TIERED' | 'CONTRACT' | 'LIST' | 'BASE',
    currency: 'INR',
    unit_price: 10,
    minimum_quantity: 1,
    maximum_quantity: '' as number | string,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    price_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DRAFT'
  });

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid || (p as any).productCode === pid);
  };

  const getSegmentRecord = (segId?: string | null) => {
    if (!segId) return null;
    return (customerSegments || []).find(s => s.customer_segment_id === segId || s.id === segId || s.segment_code === segId);
  };

  const getManufacturerMappingName = (pmId?: string | number | null) => {
    if (!pmId) return 'All Manufacturers (Global)';
    const strId = String(pmId);
    const map = (mappings || []).find(m => String(m.id) === strId || String(m.product_manufacturer_id) === strId);
    if (map) {
      const mfg = (manufacturers || []).find(m => m.id === map.manufacturer_id || m.id === (map as any).registrationId);
      return mfg?.companyName || mfg?.name || map.manufacturer_name || `Mapping #${strId}`;
    }
    return `Mapping #${strId}`;
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
    const total = (productPrices || []).length;
    const active = (productPrices || []).filter(p => (p.price_status || (p as any).status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const inactive = total - active;
    const uniqueProducts = new Set((productPrices || []).map(p => p.product_id || (p as any).productId)).size;
    const uniqueSegments = new Set((productPrices || []).filter(p => p.customer_segment_id || (p as any).customerSegmentId).map(p => p.customer_segment_id || (p as any).customerSegmentId)).size;
    return { total, active, inactive, uniqueProducts, uniqueSegments };
  }, [productPrices]);

  // Filtered List
  const filteredPrices = useMemo(() => {
    return (productPrices || []).filter(prc => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(prc.product_id || (prc as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || (prd as any)?.productCode || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || prc.product_id || '').toLowerCase();
      const seg = getSegmentRecord(prc.customer_segment_id || (prc as any).customerSegmentId);
      const segName = (seg?.segment_name || seg?.name || '').toLowerCase();
      const segCode = (seg?.segment_code || seg?.code || '').toLowerCase();
      const priceId = String(prc.product_price_id || (prc as any).id || '').toLowerCase();
      const priceType = String(prc.price_type || (prc as any).priceType || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        priceId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        segName.includes(q) ||
        segCode.includes(q) ||
        priceType.includes(q);

      const prdKey = prc.product_id || (prc as any).productId;
      const matchesPrd = selectedProductId === 'ALL' || prdKey === selectedProductId;
      const segKey = prc.customer_segment_id || (prc as any).customerSegmentId;
      const matchesSeg = selectedSegmentId === 'ALL' || segKey === selectedSegmentId;
      const statusVal = (prc.price_status || (prc as any).status || 'ACTIVE').toUpperCase();
      const matchesStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;

      // Buyer isolation: buyers see only active prices
      if (isBuyer && statusVal !== 'ACTIVE') {
        return false;
      }

      return matchesSearch && matchesPrd && matchesSeg && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.created_at || (b as any).createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return String(b.product_price_id || (b as any).id || '').localeCompare(String(a.product_price_id || (a as any).id || ''));
    });
  }, [productPrices, products, customerSegments, searchTerm, selectedProductId, selectedSegmentId, selectedStatus, isBuyer]);

  const {
    paginatedItems: paginatedPrices,
    paginationProps,
    resetPage
  } = usePagination(filteredPrices, {
    initialPageSize: 10,
    resetDeps: [searchTerm, selectedProductId, selectedSegmentId, selectedStatus]
  });

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingPrice(null);
    const firstPrd = products && products.length > 0 ? (products[0].id || products[0].product_id) : '';
    const firstSeg = customerSegments && customerSegments.length > 0 ? (customerSegments[0].customer_segment_id || customerSegments[0].id) : '';

    setFormData({
      product_id: firstPrd || '',
      product_manufacturer_id: '',
      customer_segment_id: firstSeg || '',
      price_type: 'TIERED',
      currency: 'INR',
      unit_price: 10,
      minimum_quantity: 1,
      maximum_quantity: '',
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      price_status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prc: ProductPrice) => {
    setEditingPrice(prc);
    setFormData({
      product_id: prc.product_id || (prc as any).productId || '',
      product_manufacturer_id: prc.product_manufacturer_id ? String(prc.product_manufacturer_id) : ((prc as any).productManufacturerId ? String((prc as any).productManufacturerId) : ''),
      customer_segment_id: prc.customer_segment_id || (prc as any).customerSegmentId || '',
      price_type: (prc.price_type || (prc as any).priceType || 'TIERED') as any,
      currency: prc.currency || 'INR',
      unit_price: Number(prc.unit_price ?? (prc as any).unitPrice ?? 10),
      minimum_quantity: Number(prc.minimum_quantity ?? (prc as any).minQuantity ?? 1),
      maximum_quantity: prc.maximum_quantity ?? (prc as any).maxQuantity ?? '',
      effective_from: prc.effective_from ? prc.effective_from.split('T')[0] : ((prc as any).effectiveFrom ? (prc as any).effectiveFrom.split('T')[0] : ''),
      effective_to: prc.effective_to ? prc.effective_to.split('T')[0] : ((prc as any).effectiveTo ? (prc as any).effectiveTo.split('T')[0] : ''),
      price_status: ((prc.price_status || (prc as any).status || 'ACTIVE').toUpperCase()) as any
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.product_id) {
      setFormError('Please select a valid product.');
      return;
    }

    if (Number(formData.unit_price) <= 0) {
      setFormError('Unit price must be greater than zero.');
      return;
    }

    if (Number(formData.minimum_quantity) < 1) {
      setFormError('Minimum quantity must be at least 1.');
      return;
    }

    if (formData.maximum_quantity && Number(formData.maximum_quantity) < Number(formData.minimum_quantity)) {
      setFormError('Maximum quantity cannot be less than minimum quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPrice) {
        const pId = editingPrice.product_price_id || editingPrice.id!;
        await updateProductPrice(pId, {
          product_manufacturer_id: formData.product_manufacturer_id ? formData.product_manufacturer_id : null,
          customer_segment_id: formData.customer_segment_id || null as any,
          price_type: formData.price_type,
          currency: formData.currency,
          unit_price: Number(formData.unit_price),
          minimum_quantity: Number(formData.minimum_quantity),
          maximum_quantity: formData.maximum_quantity ? Number(formData.maximum_quantity) : null,
          effective_from: formData.effective_from || null,
          effective_to: formData.effective_to || null,
          price_status: formData.price_status
        });
        showToast(`Successfully updated price rule #${pId}`);
      } else {
        const created = await addProductPrice({
          product_id: formData.product_id,
          product_price_id: '',
          customer_segment_id: formData.customer_segment_id,
          product_manufacturer_id: formData.product_manufacturer_id ? formData.product_manufacturer_id : null,
          price_type: formData.price_type,
          currency: formData.currency,
          unit_price: Number(formData.unit_price),
          minimum_quantity: Number(formData.minimum_quantity),
          maximum_quantity: formData.maximum_quantity ? Number(formData.maximum_quantity) : null,
          effective_from: formData.effective_from || new Date().toISOString().split('T')[0],
          effective_to: formData.effective_to || null,
          price_status: formData.price_status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);
        const newId = (created as any)?.product_price_id || (created as any)?.id || 'new';
        showToast(`Created price rule #${newId} for ₹${Number(formData.unit_price).toFixed(2)}`);
      }
      setIsModalOpen(false);
      resetPage();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save price rule to PostgreSQL database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prc: ProductPrice) => {
    const id = prc.product_price_id || prc.id!;
    try {
      if (toggleProductPriceStatus) {
        await toggleProductPriceStatus(id);
      } else {
        const next = (prc.price_status || (prc as any).status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        await updateProductPrice(id, { price_status: next as any });
      }
      showToast(`Toggled status for price rule #${id}`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to toggle status'}`);
    }
  };

  const handleDeletePrice = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.product_price_id || deleteTarget.id!;
    try {
      await removeProductPrice(id);
      showToast(`Deleted price rule #${id}`);
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
            <DollarSign size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product Price Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              Segment-specific, tiered, and manufacturer commercial pricing rules linked to the central product catalog.
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
              <Plus size={15} /> Add Price Rule
            </button>
          )}
        </div>
      </div>

      {/* ── Compact Statistics Row ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Tag size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Rules</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDF4', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
            <CheckCircle2 size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Prices</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C' }}>
            <AlertTriangle size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Inactive Rules</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#B91C1C' }}>{stats.inactive}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F0FDFA', border: '1px solid #CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}>
            <Package size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Priced</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F766E' }}>{stats.uniqueProducts}</div>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Users size={17} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Segments</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1D4ED8' }}>{stats.uniqueSegments}</div>
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
            placeholder="Search price ID, product, segment, currency..."
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
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, color: '#0F172A', outline: 'none', maxWidth: 180 }}
          >
            <option value="ALL">All Products</option>
            {(products || []).map(p => {
              const pid = p.id || p.product_id;
              const name = p.name || p.product_name || pid;
              return <option key={pid} value={pid}>{name}</option>;
            })}
          </select>
        </div>

        {/* Segment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Segment:</span>
          <select
            value={selectedSegmentId}
            onChange={e => setSelectedSegmentId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, color: '#0F172A', outline: 'none', maxWidth: 170 }}
          >
            <option value="ALL">All Segments</option>
            {(customerSegments || []).map(s => {
              const sid = s.customer_segment_id || s.id;
              const sname = s.segment_name || s.name || sid;
              return <option key={sid} value={sid}>{sname}</option>;
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
            <option value="EXPIRED">EXPIRED</option>
            <option value="DRAFT">DRAFT</option>
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
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Segment</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Manufacturer</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Tier Qty</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Validity</th>
                <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Tag size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No product price records found.</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      Database records will appear here once configured.
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPrices.map(prc => {
                  const priceId = prc.product_price_id || prc.id || '—';
                  const prod = getProductRecord(prc.product_id || (prc as any).productId || '');
                  const seg = getSegmentRecord(prc.customer_segment_id || (prc as any).customerSegmentId);
                  const mfgName = getManufacturerMappingName(prc.product_manufacturer_id || (prc as any).productManufacturerId);
                  const status = (prc.price_status || (prc as any).status || 'ACTIVE').toUpperCase();
                  const isActive = status === 'ACTIVE';
                  const unitPrice = Number(prc.unit_price ?? (prc as any).unitPrice ?? 0);
                  const minQty = prc.minimum_quantity ?? (prc as any).minQuantity ?? 1;
                  const maxQty = prc.maximum_quantity ?? (prc as any).maxQuantity ?? null;

                  return (
                    <tr
                      key={priceId}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', background: '#F0FDFA', padding: '2px 6px', borderRadius: 4, border: '1px solid #CCFBF1' }}>
                          #{priceId}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>
                          {prod?.name || prod?.product_name || prc.product_id || (prc as any).productId}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace' }}>
                            {prod?.product_code || prod?.code || (prod as any)?.productCode || prc.product_id}
                          </span>
                          {prod?.category && (
                            <span style={{ fontSize: 10, color: '#64748B', background: '#F1F5F9', padding: '1px 5px', borderRadius: 3 }}>
                              {prod.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Segment */}
                      <td style={{ padding: '12px 14px' }}>
                        {seg ? (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                              {seg.segment_name || seg.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: 11.5, fontStyle: 'italic' }}>Global Default</span>
                        )}
                      </td>

                      {/* Manufacturer */}
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Building2 size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={mfgName}>
                            {mfgName}
                          </span>
                        </div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' }}>
                          {prc.price_type || 'BASE'}
                        </span>
                      </td>

                      {/* Unit Price */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F766E', fontFamily: 'monospace' }}>
                          {prc.currency === 'USD' ? '$' : '₹'}{unitPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Tier Qty */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>
                          Min: {minQty.toLocaleString()}
                        </div>
                        {maxQty && (
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Max: {Number(maxQty).toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: 11.5 }}>
                        <div>{formatMasterDate(prc.effective_from || (prc as any).effectiveFrom)}</div>
                        <div style={{ color: '#94A3B8', fontSize: 10.5 }}>to {formatMasterDate(prc.effective_to || (prc as any).effectiveTo)}</div>
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
                        <div style={{ position: 'relative', display: 'inline-block' }} data-actions-menu={`price_${priceId}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionMenuId(openActionMenuId === `price_${priceId}` ? null : `price_${priceId}`);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: openActionMenuId === `price_${priceId}` ? '#F1F5F9' : '#FFFFFF',
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

                          {openActionMenuId === `price_${priceId}` && (
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
                                  setSelectedPriceForDetail(prc);
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
                                      handleOpenEditModal(prc);
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
                                      handleToggleStatus(prc);
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

                                  {isAdmin && (
                                    <>
                                      <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuId(null);
                                          setDeleteTarget(prc);
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

      {/* ── Add / Edit Price Modal ─────────────────────────────────── */}
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
            maxWidth: 580,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingPrice ? `Edit Price Rule #${editingPrice.product_price_id || editingPrice.id}` : 'Create New Product Price Rule'}
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

            {/* Modal Form */}
            <form onSubmit={handleSavePrice} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    disabled={Boolean(editingPrice)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A', background: editingPrice ? '#F1F5F9' : '#FFFFFF' }}
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

                {/* Customer Segment */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Customer Segment
                    </label>
                    <select
                      value={formData.customer_segment_id}
                      onChange={e => setFormData({ ...formData, customer_segment_id: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                    >
                      <option value="">Global (All Segments)</option>
                      {(customerSegments || []).map(s => {
                        const sid = s.customer_segment_id || s.id;
                        return (
                          <option key={sid} value={sid}>
                            {s.segment_code} — {s.segment_name || s.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Price Type
                    </label>
                    <select
                      value={formData.price_type}
                      onChange={e => setFormData({ ...formData, price_type: e.target.value as any })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                    >
                      <option value="TIERED">TIERED (Quantity Break)</option>
                      <option value="FIXED">FIXED (Standard)</option>
                      <option value="CONTRACT">CONTRACT (Institutional)</option>
                      <option value="BASE">BASE (Catalog Floor)</option>
                      <option value="LIST">LIST (MSRP)</option>
                    </select>
                  </div>
                </div>

                {/* Price & Currency */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Unit Price <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.unit_price}
                      onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                    />
                  </div>
                </div>

                {/* Min & Max Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Minimum Quantity <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.minimum_quantity}
                      onChange={e => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value, 10) || 1 })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Maximum Quantity (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Leave empty for unlimited"
                      value={formData.maximum_quantity}
                      onChange={e => setFormData({ ...formData, maximum_quantity: e.target.value ? parseInt(e.target.value, 10) : '' })}
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
                    Price Rule Status
                  </label>
                  <select
                    value={formData.price_status}
                    onChange={e => setFormData({ ...formData, price_status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, color: '#0F172A' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
                  {isSubmitting ? 'Saving...' : editingPrice ? 'Update Price Rule' : 'Create Price Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Details Modal ─────────────────────────────────────── */}
      {selectedPriceForDetail && (
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
            maxWidth: 520,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Eye size={18} style={{ color: '#0F766E' }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  Price Rule Details #{selectedPriceForDetail.product_price_id || selectedPriceForDetail.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPriceForDetail(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              {(() => {
                const prod = getProductRecord(selectedPriceForDetail.product_id || (selectedPriceForDetail as any).productId || '');
                const seg = getSegmentRecord(selectedPriceForDetail.customer_segment_id || (selectedPriceForDetail as any).customerSegmentId);
                const mfg = getManufacturerMappingName(selectedPriceForDetail.product_manufacturer_id || (selectedPriceForDetail as any).productManufacturerId);
                const status = (selectedPriceForDetail.price_status || (selectedPriceForDetail as any).status || 'ACTIVE').toUpperCase();
                const unitPrice = Number(selectedPriceForDetail.unit_price ?? (selectedPriceForDetail as any).unitPrice ?? 0);

                return (
                  <>
                    <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Product</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
                        {prod?.name || prod?.product_name || selectedPriceForDetail.product_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace', marginTop: 2, fontWeight: 700 }}>
                        {prod?.product_code || prod?.code || selectedPriceForDetail.product_id}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Segment</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginTop: 2 }}>
                          {seg?.segment_name || seg?.name || 'Global (All Segments)'}
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Manufacturer</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 2 }}>
                          {mfg}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, border: '1px solid #CCFBF1' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>Unit Price</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F766E', marginTop: 2, fontFamily: 'monospace' }}>
                          ₹{unitPrice.toFixed(2)} {selectedPriceForDetail.currency || 'INR'}
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pricing Type</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                          {selectedPriceForDetail.price_type || 'TIERED'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Min Quantity</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {selectedPriceForDetail.minimum_quantity ?? 1}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Max Quantity</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {selectedPriceForDetail.maximum_quantity ? Number(selectedPriceForDetail.maximum_quantity) : 'Unlimited'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Effective From</div>
                        <div style={{ fontSize: 12.5, color: '#0F172A' }}>
                          {formatMasterDate(selectedPriceForDetail.effective_from)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Effective To</div>
                        <div style={{ fontSize: 12.5, color: '#0F172A' }}>
                          {formatMasterDate(selectedPriceForDetail.effective_to)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 4, fontSize: 11, color: '#64748B' }}>
                      <span>Status: <strong style={{ color: status === 'ACTIVE' ? '#15803D' : '#B91C1C' }}>{status}</strong></span>
                      <span>Created: {formatMasterDate(selectedPriceForDetail.created_at)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setSelectedPriceForDetail(null)}
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
              Delete Price Rule #{deleteTarget.product_price_id || deleteTarget.id}?
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: 12.5, color: '#64748B' }}>
              This will permanently delete this price rule from the PostgreSQL database. This action cannot be undone.
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
                onClick={handleDeletePrice}
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
