import React, { useState, useMemo } from 'react';
import {
  Layers, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, CheckCircle2, Clock, Eye, Power, Hash, Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductUom } from '../../types';

export const ProductUomModule: React.FC = () => {
  const {
    products,
    productUoms,
    addProductUom,
    updateProductUom,
    removeProductUom,
    addAuditLog,
    currentRole
  } = useApp();

  const canEdit = currentRole === 'ADMIN' || true;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUomId, setEditingUomId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // View Details Modal State
  const [selectedUomForDetail, setSelectedUomForDetail] = useState<ProductUom | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    uom: 'Boxes',
    conversion_factor: 10,
    is_base_uom: false,
    is_order_uom: true,
    is_active: true
  });

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid);
  };

  // KPI Stats
  const stats = useMemo(() => {
    const total = (productUoms || []).length;
    const active = (productUoms || []).filter(u => (u.is_active ?? (u as any).isActive ?? true)).length;
    const uniqueProducts = new Set((productUoms || []).map(u => u.product_id || (u as any).productId)).size;
    const baseUnits = (productUoms || []).filter(u => (u.is_base_uom ?? (u as any).isBaseUom ?? false)).length;
    return { total, active, uniqueProducts, baseUnits };
  }, [productUoms]);

  // Filtered List
  const filteredUoms = useMemo(() => {
    return (productUoms || []).filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(u.product_id || (u as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || u.product_id || '').toLowerCase();
      const uomStr = (u.uom || '').toLowerCase();
      const uomId = (u.product_uom_id || (u as any).id || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        uomId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        uomStr.includes(q);

      const matchesPrd = selectedProductId === 'ALL' || (u.product_id || (u as any).productId) === selectedProductId;
      const isActive = (u.is_active ?? (u as any).isActive ?? true);
      const matchesActive = activeFilter === 'ALL' || (activeFilter === 'ACTIVE' ? isActive : !isActive);

      return matchesSearch && matchesPrd && matchesActive;
    });
  }, [productUoms, products, searchTerm, selectedProductId, activeFilter]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingUomId(null);
    setEditingCreatedAt(null);
    setFormData({
      product_id: defaultProductId || (products[0]?.id || ''),
      uom: 'Boxes',
      conversion_factor: 10,
      is_base_uom: false,
      is_order_uom: true,
      is_active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: ProductUom) => {
    const uomId = u.product_uom_id || u.id || '';
    setEditingUomId(uomId);
    setEditingCreatedAt(u.created_at || '2025-01-01');
    setFormData({
      product_id: u.product_id || (u as any).productId || '',
      uom: u.uom || '',
      conversion_factor: u.conversion_factor ?? (u as any).conversionFactor ?? 1,
      is_base_uom: u.is_base_uom ?? (u as any).isBaseUom ?? false,
      is_order_uom: u.is_order_uom ?? (u as any).isOrderUom ?? true,
      is_active: u.is_active ?? (u as any).isActive ?? true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (u: ProductUom) => {
    setSelectedUomForDetail(u);
  };

  const handleToggleActive = (u: ProductUom) => {
    const uomId = u.product_uom_id || u.id || '';
    const current = (u.is_active ?? (u as any).isActive ?? true);
    const nextActive = !current;
    const nowIso = new Date().toISOString().split('T')[0];

    updateProductUom(uomId, {
      is_active: nextActive,
      isActive: nextActive,
      updated_at: nowIso
    });

    addAuditLog('TOGGLE_PRODUCT_UOM_STATUS', `Toggled active status for UOM record ${uomId} to ${nextActive ? 'ACTIVE' : 'INACTIVE'}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id) {
      setFormError('Product is mandatory.');
      return;
    }
    if (!formData.uom.trim()) {
      setFormError('UOM is mandatory.');
      return;
    }
    if (formData.conversion_factor <= 0 || isNaN(formData.conversion_factor)) {
      setFormError('Conversion Factor must be greater than 0.');
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingUomId) {
      updateProductUom(editingUomId, {
        product_id: formData.product_id,
        uom: formData.uom.trim(),
        conversion_factor: Number(formData.conversion_factor),
        is_base_uom: formData.is_base_uom,
        is_order_uom: formData.is_order_uom,
        is_active: formData.is_active,
        updated_at: nowIso,
        // compatibility aliases
        productId: formData.product_id,
        conversionFactor: Number(formData.conversion_factor),
        isBaseUom: formData.is_base_uom,
        isOrderUom: formData.is_order_uom,
        isActive: formData.is_active
      });
      addAuditLog('UPDATE_PRODUCT_UOM', `Updated UOM ${formData.uom} for product ${formData.product_id}`);
    } else {
      const newUomId = `puom_${Date.now()}`;
      const newUom: ProductUom = {
        product_uom_id: newUomId,
        product_id: formData.product_id,
        uom: formData.uom.trim(),
        conversion_factor: Number(formData.conversion_factor),
        is_base_uom: formData.is_base_uom,
        is_order_uom: formData.is_order_uom,
        is_active: formData.is_active,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility aliases
        id: newUomId,
        productId: formData.product_id,
        conversionFactor: Number(formData.conversion_factor),
        isBaseUom: formData.is_base_uom,
        isOrderUom: formData.is_order_uom,
        isActive: formData.is_active
      };
      addProductUom(newUom);
      addAuditLog('ADD_PRODUCT_UOM', `Created UOM ${formData.uom} for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (u: ProductUom) => {
    const id = u.product_uom_id || u.id || '';
    if (window.confirm(`Are you sure you want to remove this UOM mapping (${u.uom})?`)) {
      removeProductUom(id);
      addAuditLog('DELETE_PRODUCT_UOM', `Removed UOM ${u.uom} record ${id}`);
    }
  };

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
            <Layers size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              INVENTORY &amp; PACKAGING SPECIFICATIONS · ENTITY: PRODUCT_UOM
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product UOM Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Manage multi-tier packaging units, conversion ratios, and buyer-orderable unit configurations mapped to central catalog products.
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenAddModal()}
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
            <Plus size={16} /> Add Product UOM
          </button>
        )}
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total UOM Mappings</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>PRODUCT_UOM records</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Units</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Enabled for operational ordering</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Configured</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.uniqueProducts}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Unique catalog items mapped</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Base Reference Units</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>{stats.baseUnits}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Designated base UOM records</div>
        </div>
      </div>

      {/* ── Search & Multi-Filter Controls Bar ────────────────────── */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {/* Search Box */}
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
              placeholder="Search by UOM ID, product name, product code, product ID, UOM name..."
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

          {/* Filter by Product */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>Product:</span>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedProductId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedProductId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 240
              }}
            >
              <option value="ALL">All Products ({(products || []).length})</option>
              {(products || []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.product_code || p.code} · {p.product_name || p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: activeFilter !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: activeFilter !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE Only</option>
              <option value="INACTIVE">INACTIVE Only</option>
            </select>
          </div>

          {(searchTerm || selectedProductId !== 'ALL' || activeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProductId('ALL');
                setActiveFilter('ALL');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#64748B',
          paddingTop: 10,
          borderTop: '1px solid #F1F5F9'
        }}>
          <div>
            Entity Schema: <code>PRODUCT_UOM</code> (product_uom_id, product_id, uom, conversion_factor, is_base_uom, is_order_uom, is_active, created_at, updated_at)
          </div>
          <div>
            Showing <strong style={{ color: '#0F766E' }}>{filteredUoms.length}</strong> of {productUoms.length} UOM mappings
          </div>
        </div>
      </div>

      {/* ── PRODUCT_UOM Table ─────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1440, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>
                PRODUCT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                PRODUCT ID
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>
                UOM
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 160 }}>
                CONVERSION FACTOR
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                IS BASE UOM
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                IS ORDER UOM
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>
                IS ACTIVE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                CREATED AT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                UPDATED AT
              </th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 150 }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUoms.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Layers size={36} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No product UOM records found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create conversion factors and packaging unit mappings for central products.
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenAddModal()}
                      style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      + Add Product UOM
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredUoms.map(u => {
                const prd = getProductRecord(u.product_id || (u as any).productId || '');
                const prdName = prd?.product_name || prd?.name || u.product_id;
                const prdCode = prd?.product_code || prd?.code || u.product_id;
                const resolvedProdId = prd?.product_id || prd?.id || u.product_id;

                const uomId = u.product_uom_id || u.id || '—';
                const isBase = u.is_base_uom ?? (u as any).isBaseUom ?? false;
                const isOrder = u.is_order_uom ?? (u as any).isOrderUom ?? false;
                const isActive = u.is_active ?? (u as any).isActive ?? true;
                const convFactor = u.conversion_factor ?? (u as any).conversionFactor ?? 1;
                const createdAt = u.created_at || '—';
                const updatedAt = u.updated_at || '—';

                return (
                  <tr
                    key={uomId}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. PRODUCT */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                        {prdName}
                      </div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace', marginTop: 1, fontWeight: 700 }}>
                        {prdCode}
                      </div>
                    </td>

                    {/* 2. PRODUCT ID */}
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {resolvedProdId}
                    </td>

                    {/* 3. UOM */}
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                      {u.uom}
                    </td>

                    {/* 4. CONVERSION FACTOR */}
                    <td style={{ padding: '12px 12px', fontSize: 13, fontWeight: 800, color: '#0F766E', whiteSpace: 'nowrap' }}>
                      {convFactor}x <span style={{ fontSize: 11.5, fontWeight: 500, color: '#64748B' }}>({prd?.base_uom || 'base unit'})</span>
                    </td>

                    {/* 5. IS BASE UOM */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isBase ? '#EFF6FF' : '#F1F5F9',
                        color: isBase ? '#1D4ED8' : '#64748B',
                        border: `1px solid ${isBase ? '#BFDBFE' : '#CBD5E1'}`
                      }}>
                        {isBase ? 'YES (Base)' : 'NO'}
                      </span>
                    </td>

                    {/* 6. IS ORDER UOM */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isOrder ? '#DCFCE7' : '#F1F5F9',
                        color: isOrder ? '#15803D' : '#64748B',
                        border: `1px solid ${isOrder ? '#86EFAC' : '#CBD5E1'}`
                      }}>
                        {isOrder ? 'YES (Orderable)' : 'NO'}
                      </span>
                    </td>

                    {/* 7. IS ACTIVE */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#15803D' : '#B91C1C',
                        border: `1px solid ${isActive ? '#86EFAC' : '#FCA5A5'}`
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* 8. CREATED AT */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {createdAt}
                    </td>

                    {/* 9. UPDATED AT */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {updatedAt}
                    </td>

                    {/* 10. ACTIONS */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(u)}
                          title="View Complete UOM Details"
                          style={{
                            padding: '5px 7px',
                            borderRadius: 4,
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            color: '#334155',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3
                          }}
                        >
                          <Eye size={12} /> View
                        </button>

                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(u)}
                              title="Edit UOM Rule"
                              style={{
                                padding: '5px 7px',
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
                              <Edit2 size={12} /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleActive(u)}
                              title={isActive ? 'Deactivate UOM Rule' : 'Activate UOM Rule'}
                              style={{
                                padding: '5px 6px',
                                borderRadius: 4,
                                background: isActive ? '#FEF2F2' : '#F0FDF4',
                                border: isActive ? '1px solid #FECACA' : '1px solid #BBF7D0',
                                color: isActive ? '#DC2626' : '#16A34A',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Power size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(u)}
                              title="Remove UOM Rule"
                              style={{
                                padding: '5px 6px',
                                borderRadius: 4,
                                background: '#FFFFFF',
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── VIEW DETAILS MODAL ────────────────────────────────────── */}
      {selectedUomForDetail && (() => {
        const detail = selectedUomForDetail;
        const prd = getProductRecord(detail.product_id || (detail as any).productId || '');
        const prdName = prd?.product_name || prd?.name || detail.product_id;
        const prdCode = prd?.product_code || prd?.code || detail.product_id;
        const resolvedProdId = prd?.product_id || prd?.id || detail.product_id;
        const uomId = detail.product_uom_id || detail.id || '—';
        const isBase = detail.is_base_uom ?? (detail as any).isBaseUom ?? false;
        const isOrder = detail.is_order_uom ?? (detail as any).isOrderUom ?? false;
        const isActive = detail.is_active ?? (detail as any).isActive ?? true;
        const convFactor = detail.conversion_factor ?? (detail as any).conversionFactor ?? 1;

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
              padding: 16
            }}
            onClick={() => setSelectedUomForDetail(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 640,
                background: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                    ENTITY RECORD · PRODUCT_UOM
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
                    Product UOM Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUomForDetail(null)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>

                {/* Primary Key Banner */}
                <div style={{
                  padding: '14px 18px',
                  background: '#F0FDFA',
                  borderRadius: 8,
                  border: '1px solid #99F6E4',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Primary Key (product_uom_id)
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#134E4A', fontFamily: 'monospace', marginTop: 2 }}>
                      {uomId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F766E' }}>
                      {detail.uom}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: isActive ? '#DCFCE7' : '#FEE2E2',
                      color: isActive ? '#15803D' : '#B91C1C',
                      border: `1px solid ${isActive ? '#86EFAC' : '#FCA5A5'}`
                    }}>
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Linked Product Entity */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    1. Linked Product Entity (FK → PRODUCT)
                  </div>
                  <div style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F766E', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      <Package size={14} /> Product Master Association
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                      {prdName}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px dashed #CBD5E1' }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B' }}>Product ID (product_id):</span>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A', fontSize: 13, marginTop: 1 }}>{resolvedProdId}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B' }}>Product Code:</span>
                        <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F766E', fontSize: 13, marginTop: 1 }}>{prdCode}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Packaging Specifications */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    2. Unit &amp; Conversion Factor
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Unit of Measure (UOM)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                        {detail.uom}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Conversion Factor</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0F766E', marginTop: 4 }}>
                        {convFactor}x <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>base ({prd?.base_uom || 'Unit'})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Flags & Audit */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    3. Operational Flags &amp; Audit Metadata
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Is Base UOM</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: isBase ? '#EFF6FF' : '#F1F5F9', color: isBase ? '#1D4ED8' : '#64748B' }}>
                          {isBase ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Is Order UOM</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: isOrder ? '#DCFCE7' : '#F1F5F9', color: isOrder ? '#15803D' : '#64748B' }}>
                          {isOrder ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Created At</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                        {detail.created_at || '—'}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Updated At</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                        {detail.updated_at || '—'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const toEdit = selectedUomForDetail;
                      setSelectedUomForDetail(null);
                      handleOpenEditModal(toEdit);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      background: '#0F766E',
                      color: '#FFF',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Edit2 size={14} /> Edit Product UOM
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUomForDetail(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
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

      {/* ── ADD / EDIT PRODUCT UOM MODAL ─────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 540, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  ENTITY: PRODUCT_UOM
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {editingUomId ? 'Edit Product UOM' : 'Add Product UOM'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ background: '#FEE2E2', borderBottom: '1px solid #FCA5A5', padding: '10px 24px', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Read-Only Banner when Editing */}
              {editingUomId && (
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Product UOM ID</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                      {editingUomId}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Created At (Preserved)</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', fontFamily: 'monospace', marginTop: 2 }}>
                      {editingCreatedAt || '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Product * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Product *
                </label>
                <select
                  required
                  disabled={!!editingUomId}
                  value={formData.product_id}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: editingUomId ? '#F1F5F9' : '#FFFFFF',
                    cursor: editingUomId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="" disabled>-- Select Product * --</option>
                  {(products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.product_code || p.code} · {p.product_name || p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* UOM * & Conversion Factor * */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    UOM * (Unit Name)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Box, Strip, Carton"
                    value={formData.uom}
                    onChange={e => setFormData({ ...formData, uom: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Conversion Factor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.conversion_factor}
                    onChange={e => setFormData({ ...formData, conversion_factor: parseFloat(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              {/* Flags: Is Base UOM, Is Order UOM, Is Active */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_base_uom}
                    onChange={e => setFormData({ ...formData, is_base_uom: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Base UOM (Canonical standard reference unit)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_order_uom}
                    onChange={e => setFormData({ ...formData, is_order_uom: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Order UOM (Allow buyers to order in this packaging unit)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Is Active</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingUomId ? 'Update Product UOM' : 'Save Product UOM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
