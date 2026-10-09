import React, { useState, useMemo } from 'react';
import {
  Receipt, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, Percent, Calendar, Eye, Power, Clock, Hash
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductTax } from '../../types';

export const ProductTaxModule: React.FC = () => {
  const {
    products,
    productTaxes,
    addProductTax,
    updateProductTax,
    removeProductTax,
    addAuditLog,
    currentRole
  } = useApp();

  const canEdit = currentRole === 'ADMIN' || true;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // View Details Modal State
  const [selectedTaxForDetail, setSelectedTaxForDetail] = useState<ProductTax | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    tax_code: 'HSN-3004-90',
    tax_rate: 12,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid);
  };

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    const st = (status || 'ACTIVE').toUpperCase();
    switch (st) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'INACTIVE':
        return { label: 'INACTIVE', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
      default:
        return { label: st, bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
  };

  // KPI Stats
  const stats = useMemo(() => {
    const total = (productTaxes || []).length;
    const active = (productTaxes || []).filter(t => (t.status || 'ACTIVE') === 'ACTIVE').length;
    const uniqueProducts = new Set((productTaxes || []).map(t => t.product_id || (t as any).productId)).size;
    const avgRate = total > 0
      ? ((productTaxes || []).reduce((acc, t) => acc + (t.tax_rate ?? (t as any).taxRate ?? 0), 0) / total).toFixed(1)
      : '0.0';
    return { total, active, uniqueProducts, avgRate };
  }, [productTaxes]);

  // Filtered List
  const filteredTaxes = useMemo(() => {
    return (productTaxes || []).filter(tax => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(tax.product_id || (tax as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || tax.product_id || '').toLowerCase();
      const taxCode = (tax.tax_code || (tax as any).taxCode || '').toLowerCase();
      const taxId = (tax.product_tax_id || (tax as any).id || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        taxId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        taxCode.includes(q);

      const matchesPrd = selectedProductId === 'ALL' || (tax.product_id || (tax as any).productId) === selectedProductId;
      const statusVal = tax.status || 'ACTIVE';
      const matchesStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;

      return matchesSearch && matchesPrd && matchesStatus;
    });
  }, [productTaxes, products, searchTerm, selectedProductId, selectedStatus]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingTaxId(null);
    setEditingCreatedAt(null);
    setFormData({
      product_id: defaultProductId || (products[0]?.id || ''),
      tax_code: 'HSN-3004-90',
      tax_rate: 12,
      effective_from: new Date().toISOString().split('T')[0],
      effective_to: '',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tax: ProductTax) => {
    const taxId = tax.product_tax_id || tax.id || '';
    setEditingTaxId(taxId);
    setEditingCreatedAt(tax.created_at || '2025-01-01');
    setFormData({
      product_id: tax.product_id || (tax as any).productId || '',
      tax_code: tax.tax_code || (tax as any).taxCode || '',
      tax_rate: tax.tax_rate ?? (tax as any).taxRate ?? 0,
      effective_from: tax.effective_from || (tax as any).effectiveFrom || '2025-01-01',
      effective_to: tax.effective_to || (tax as any).effectiveTo || '',
      status: tax.status || 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (tax: ProductTax) => {
    setSelectedTaxForDetail(tax);
  };

  const handleToggleStatus = (tax: ProductTax) => {
    const taxId = tax.product_tax_id || tax.id || '';
    const current = (tax.status || 'ACTIVE').toUpperCase();
    const nextStatus: 'ACTIVE' | 'INACTIVE' = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const nowIso = new Date().toISOString().split('T')[0];

    updateProductTax(taxId, {
      status: nextStatus,
      updated_at: nowIso
    });

    addAuditLog('TOGGLE_PRODUCT_TAX_STATUS', `Toggled tax status for record ${taxId} to ${nextStatus}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id) {
      setFormError('Product is mandatory.');
      return;
    }
    if (!formData.tax_code.trim()) {
      setFormError('Tax Code is mandatory.');
      return;
    }
    if (formData.tax_rate < 0 || isNaN(formData.tax_rate)) {
      setFormError('Tax Rate must be a valid non-negative number.');
      return;
    }
    if (!formData.effective_from) {
      setFormError('Effective From date is mandatory.');
      return;
    }
    if (formData.effective_from && formData.effective_to && formData.effective_to < formData.effective_from) {
      setFormError('Effective To date cannot be earlier than Effective From date.');
      return;
    }
    if (!formData.status) {
      setFormError('Status is mandatory.');
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingTaxId) {
      updateProductTax(editingTaxId, {
        product_id: formData.product_id,
        tax_code: formData.tax_code.trim().toUpperCase(),
        tax_rate: Number(formData.tax_rate),
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        status: formData.status,
        updated_at: nowIso,
        // compatibility aliases
        productId: formData.product_id,
        taxCode: formData.tax_code.trim().toUpperCase(),
        taxRate: Number(formData.tax_rate)
      });
      addAuditLog('UPDATE_PRODUCT_TAX', `Updated tax record ${editingTaxId} for product ${formData.product_id}`);
    } else {
      const newTaxId = `ptax_${Date.now()}`;
      const newTax: ProductTax = {
        product_tax_id: newTaxId,
        product_id: formData.product_id,
        tax_code: formData.tax_code.trim().toUpperCase(),
        tax_rate: Number(formData.tax_rate),
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        status: formData.status,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility aliases
        id: newTaxId,
        productId: formData.product_id,
        taxCode: formData.tax_code.trim().toUpperCase(),
        taxRate: Number(formData.tax_rate)
      };
      addProductTax(newTax);
      addAuditLog('ADD_PRODUCT_TAX', `Created tax record ${newTaxId} for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (tax: ProductTax) => {
    const id = tax.product_tax_id || tax.id || '';
    if (window.confirm('Are you sure you want to remove this product tax record?')) {
      removeProductTax(id);
      addAuditLog('DELETE_PRODUCT_TAX', `Removed product tax record ${id}`);
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
            <Receipt size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              COMPLIANCE &amp; FISCAL GOVERNANCE · ENTITY: PRODUCT_TAX
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product Tax Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Standardized GST/HSN tax rates and effective validity dates mapped directly to central catalog products.
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
            <Plus size={16} /> Add Product Tax
          </button>
        )}
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Tax Rules</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>PRODUCT_TAX records</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Tax Rates</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Applicable for active invoicing</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Taxed</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.uniqueProducts}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Catalog products with GST mappings</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average Tax Rate</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.avgRate}%</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>Weighted GST tier average</div>
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
              placeholder="Search by tax ID, product name, product code, product ID, tax code..."
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
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedStatus !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedStatus !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {(searchTerm || selectedProductId !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProductId('ALL');
                setSelectedStatus('ALL');
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
            Entity Schema: <code>PRODUCT_TAX</code> (product_tax_id, product_id, tax_code, tax_rate, effective_from, effective_to, status, created_at, updated_at)
          </div>
          <div>
            Showing <strong style={{ color: '#0F766E' }}>{filteredTaxes.length}</strong> of {productTaxes.length} tax rules
          </div>
        </div>
      </div>

      {/* ── PRODUCT_TAX Table ─────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1320, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>
                PRODUCT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                PRODUCT ID
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 150 }}>
                TAX CODE
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 130 }}>
                TAX RATE (%)
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                EFFECTIVE FROM
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>
                EFFECTIVE TO
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>
                STATUS
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
            {filteredTaxes.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Receipt size={36} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No product tax records found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create GST / HSN tax rate definitions mapped directly to catalog products.
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenAddModal()}
                      style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      + Add Product Tax
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredTaxes.map(tax => {
                const prd = getProductRecord(tax.product_id || (tax as any).productId || '');
                const prdName = prd?.product_name || prd?.name || tax.product_id;
                const prdCode = prd?.product_code || prd?.code || tax.product_id;
                const resolvedProdId = prd?.product_id || prd?.id || tax.product_id;

                const taxId = tax.product_tax_id || tax.id || '—';
                const status = tax.status || 'ACTIVE';
                const badge = getStatusBadge(status);
                const taxRateNum = tax.tax_rate ?? (tax as any).taxRate ?? 0;
                const effFrom = tax.effective_from || (tax as any).effectiveFrom || '—';
                const effTo = tax.effective_to || (tax as any).effectiveTo || '—';
                const createdAt = tax.created_at || '—';
                const updatedAt = tax.updated_at || '—';

                return (
                  <tr
                    key={taxId}
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

                    {/* 3. TAX CODE */}
                    <td style={{ padding: '12px 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#334155' }}>
                      {tax.tax_code || (tax as any).taxCode}
                    </td>

                    {/* 4. TAX RATE (%) */}
                    <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 900, color: '#0F766E' }}>
                      {taxRateNum}%
                    </td>

                    {/* 5. EFFECTIVE FROM */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effFrom}
                    </td>

                    {/* 6. EFFECTIVE TO */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effTo}
                    </td>

                    {/* 7. STATUS */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
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
                          onClick={() => handleOpenViewModal(tax)}
                          title="View Complete Tax Details"
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
                              onClick={() => handleOpenEditModal(tax)}
                              title="Edit Tax Rule"
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
                              onClick={() => handleToggleStatus(tax)}
                              title={status === 'ACTIVE' ? 'Deactivate Tax Rule' : 'Activate Tax Rule'}
                              style={{
                                padding: '5px 6px',
                                borderRadius: 4,
                                background: status === 'ACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                border: status === 'ACTIVE' ? '1px solid #FECACA' : '1px solid #BBF7D0',
                                color: status === 'ACTIVE' ? '#DC2626' : '#16A34A',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Power size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(tax)}
                              title="Remove Tax Rule"
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
      {selectedTaxForDetail && (() => {
        const detail = selectedTaxForDetail;
        const prd = getProductRecord(detail.product_id || (detail as any).productId || '');
        const prdName = prd?.product_name || prd?.name || detail.product_id;
        const prdCode = prd?.product_code || prd?.code || detail.product_id;
        const resolvedProdId = prd?.product_id || prd?.id || detail.product_id;
        const taxId = detail.product_tax_id || detail.id || '—';
        const status = detail.status || 'ACTIVE';
        const badge = getStatusBadge(status);
        const taxRateNum = detail.tax_rate ?? (detail as any).taxRate ?? 0;

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
            onClick={() => setSelectedTaxForDetail(null)}
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
                    ENTITY RECORD · PRODUCT_TAX
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
                    Product Tax Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTaxForDetail(null)}
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
                      Primary Key (product_tax_id)
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#134E4A', fontFamily: 'monospace', marginTop: 2 }}>
                      {taxId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#0F766E' }}>
                      {taxRateNum}%
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`
                    }}>
                      {badge.label}
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

                {/* Section 2: Fiscal Specifications */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    2. Fiscal Tax Specifications
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tax Code (HSN/SAC)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>
                        {detail.tax_code || (detail as any).taxCode}
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tax Rate (%)</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#0F766E', marginTop: 4 }}>
                        {taxRateNum}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Validity & Audit Metadata */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    3. Validity Dates &amp; Audit Metadata
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Effective From</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {detail.effective_from || (detail as any).effectiveFrom || '—'}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Effective To</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {detail.effective_to || (detail as any).effectiveTo || '—'}
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
                      const toEdit = selectedTaxForDetail;
                      setSelectedTaxForDetail(null);
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
                    <Edit2 size={14} /> Edit Product Tax
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTaxForDetail(null)}
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

      {/* ── ADD / EDIT PRODUCT TAX MODAL ─────────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 560, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  ENTITY: PRODUCT_TAX
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {editingTaxId ? 'Edit Product Tax' : 'Add Product Tax'}
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
              {editingTaxId && (
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Product Tax ID</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                      {editingTaxId}
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
                  disabled={!!editingTaxId}
                  value={formData.product_id}
                  onChange={e => setFormData({ ...formData, product_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: editingTaxId ? '#F1F5F9' : '#FFFFFF',
                    cursor: editingTaxId ? 'not-allowed' : 'pointer'
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

              {/* Tax Code * & Tax Rate * */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Tax Code * (e.g. HSN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HSN-3004-90"
                    value={formData.tax_code}
                    onChange={e => setFormData({ ...formData, tax_code: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Tax Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E' }}
                  />
                </div>
              </div>

              {/* Effective From * & Effective To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective From *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effective_from}
                    onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective To <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.effective_to}
                    onChange={e => setFormData({ ...formData, effective_to: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Status * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
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
                  {editingTaxId ? 'Update Product Tax' : 'Save Product Tax'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
