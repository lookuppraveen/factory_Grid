import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Brand, LifecycleStatus } from '../../types';
import {
  Tag, Search, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, X, Power, ArrowUpDown, Sparkles, Filter
} from 'lucide-react';

export const BrandMasterModule: React.FC = () => {
  const {
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_code: '',
    description: '',
    lifecycle_status: 'ACTIVE' as LifecycleStatus
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deactivate confirmation
  const [confirmToggleBrand, setConfirmToggleBrand] = useState<Brand | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    return (brands || []).filter(b => {
      const q = searchTerm.toLowerCase().trim();
      const name = (b.brand_name || b.name || '').toLowerCase();
      const code = (b.brand_code || b.code || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q) || desc.includes(q);

      const status = (b.lifecycle_status || b.status || 'ACTIVE').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchTerm, statusFilter]);


  const formatMasterDate = (dateStr?: string): string => {
    if (!dateStr) return '29 Sep 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatBrandId = (brand: Brand, idx: number): string => {
    if (brand.brand_id && /^BRD[-_]?\d+$/i.test(brand.brand_id)) {
      return brand.brand_id.toUpperCase().replace('_', '-');
    }
    if (brand.brand_id) {
      return brand.brand_id;
    }
    return `BRD${String(idx + 1).padStart(3, '0')}`;
  };

  // (Product count removed from Brand Master table as per client model requirement)

  // Handlers
  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setFormData({
      brand_name: '',
      brand_code: '',
      description: '',
      lifecycle_status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      brand_name: brand.brand_name || brand.name || '',
      brand_code: brand.brand_code || brand.code || '',
      description: brand.description || '',
      lifecycle_status: ((brand.lifecycle_status || brand.status || 'ACTIVE').toUpperCase()) as LifecycleStatus
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.brand_name.trim();
    const cleanCode = formData.brand_code.trim().toUpperCase();

    if (!cleanName) {
      setFormError('Brand Name is required.');
      return;
    }
    if (!cleanCode) {
      setFormError('Brand Code is required.');
      return;
    }

    // Uniqueness validation
    const duplicate = (brands || []).find(b => {
      const isSelf = editingBrand && (b.brand_id === editingBrand.brand_id || b.id === editingBrand.id);
      if (isSelf) return false;
      const bCode = (b.brand_code || b.code || '').toUpperCase();
      const bName = (b.brand_name || b.name || '').toLowerCase();
      return bCode === cleanCode || bName === cleanName.toLowerCase();
    });

    if (duplicate) {
      const dupCode = (duplicate.brand_code || duplicate.code || '').toUpperCase();
      if (dupCode === cleanCode) {
        setFormError(`Brand Code "${cleanCode}" is already in use by another brand.`);
      } else {
        setFormError(`A brand named "${cleanName}" already exists.`);
      }
      return;
    }

    if (editingBrand) {
      const bId = editingBrand.brand_id || editingBrand.id!;
      updateBrand(bId, {
        brand_name: cleanName,
        name: cleanName,
        brand_code: cleanCode,
        code: cleanCode,
        description: formData.description.trim(),
        lifecycle_status: formData.lifecycle_status,
        status: formData.lifecycle_status,
        updated_at: new Date().toISOString().split('T')[0]
      });
      showToast(`Brand "${cleanName}" updated successfully.`);
    } else {
      const nextNum = (brands && brands.length > 0) ? brands.length + 1 : 1;
      const newId = `BRD${String(nextNum).padStart(3, '0')}`;
      const newBrand: Brand = {
        brand_id: newId,
        brand_code: cleanCode,
        brand_name: cleanName,
        description: formData.description.trim(),
        lifecycle_status: formData.lifecycle_status,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        id: newId,
        code: cleanCode,
        name: cleanName,
        status: formData.lifecycle_status
      };
      addBrand(newBrand);
      showToast(`Brand "${cleanName}" (${cleanCode}) created successfully.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (brand: Brand) => {
    const bId = brand.brand_id || brand.id!;
    toggleBrandStatus(bId);
    const curr = (brand.lifecycle_status || brand.status || 'ACTIVE').toUpperCase();
    const next = curr === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    showToast(`Brand "${brand.brand_name || brand.name}" status changed to ${next}.`);
    setConfirmToggleBrand(null);
  };

  const handleDelete = (brand: Brand) => {
    const bId = brand.brand_id || brand.id!;
    const name = brand.brand_name || brand.name;
    if (window.confirm(`Are you sure you want to delete brand "${name}"? This cannot be undone.`)) {
      deleteBrand(bId);
      showToast(`Brand "${name}" deleted.`);
    }
  };

  // Metrics
  const totalBrands = (brands || []).length;
  const activeCount = (brands || []).filter(b => (b.lifecycle_status || b.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const inactiveCount = totalBrands - activeCount;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 11000,
          background: '#0F766E',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(15, 118, 110, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13.5,
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Brand Master
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Manage product brands used across the FactoryGrid catalogue.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#0F766E',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#115E59'}
          onMouseLeave={e => e.currentTarget.style.background = '#0F766E'}
        >
          <Plus size={16} /> + Add Brand
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Brands</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>{totalBrands}</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>Registered catalogue brands</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Brands</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#059669', marginTop: 6 }}>{activeCount}</div>
          <div style={{ fontSize: 11.5, color: '#059669', marginTop: 4 }}>Eligible for product mapping</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Inactive Brands</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626', marginTop: 6 }}>{inactiveCount}</div>
          <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 4 }}>Suspended or pending review</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Architecture Role</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 8 }}>PRODUCT → BRAND</div>
          <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Product catalogue master</div>
        </div>
      </div>

      {/* Filters and Search Strip */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 460, position: 'relative' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: 12 }} />
          <input
            type="text"
            placeholder="Search by brand name, brand code, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              fontSize: 13,
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#64748B" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              padding: '8px 14px',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#0F172A',
              outline: 'none'
            }}
          >
            <option value="ALL">All Statuses ({totalBrands})</option>
            <option value="ACTIVE">Active ({activeCount})</option>
            <option value="INACTIVE">Inactive ({inactiveCount})</option>
          </select>
        </div>
      </div>

      {/* Brands Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>BRAND ID</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 220 }}>BRAND NAME</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>BRAND CODE</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 240 }}>DESCRIPTION</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 110 }}>STATUS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>CREATED AT</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', width: 120 }}>UPDATED AT</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right', width: 180 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredBrands.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F1F5F9', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Tag size={22} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>No brands found</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                    {searchTerm ? `No brands matching "${searchTerm}". Try clearing your search.` : 'Get started by creating your first product brand master record.'}
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{
                      marginTop: 16,
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      background: '#0F766E',
                      color: '#FFF',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Brand
                  </button>
                </td>
              </tr>
            ) : (
              filteredBrands.map((b, idx) => {
                const bName = b.brand_name || b.name || '';
                const bCode = b.brand_code || b.code || '';
                const status = (b.lifecycle_status || b.status || 'ACTIVE').toUpperCase();
                const isActive = status === 'ACTIVE';
                const bId = b.brand_id || b.id || '';
                const formattedId = formatBrandId(b, idx);

                return (
                  <tr
                    key={bId || idx}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      transition: 'background 0.1s ease',
                      background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F0FDFA'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA'}
                  >
                    {/* 1. BRAND ID (PK) */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: '#0F766E',
                          background: '#F0FDFA',
                          border: '1px solid #CCFBF1',
                          padding: '3px 8px',
                          borderRadius: 4
                        }}
                        title={`Database PK: ${bId}`}
                      >
                        {formattedId}
                      </span>
                    </td>

                    {/* 2. BRAND NAME */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, border: '1px solid #CCFBF1' }}>
                          {bName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                          {bName}
                        </div>
                      </div>
                    </td>

                    {/* 3. BRAND CODE (UNIQUE) */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11.5,
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#1D4ED8',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        padding: '3px 8px',
                        borderRadius: 4
                      }}>
                        {bCode}
                      </span>
                    </td>

                    {/* 4. DESCRIPTION */}
                    <td style={{ padding: '14px 16px', maxWidth: 280 }}>
                      <div style={{ fontSize: 12.5, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.description || 'Catalogue brand'}>
                        {b.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description provided</span>}
                      </div>
                    </td>

                    {/* 5. LIFECYCLE STATUS */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 4,
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#15803D' : '#B91C1C',
                        border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                      }}>
                        {status}
                      </span>
                    </td>

                    {/* 6. CREATED AT */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatMasterDate(b.created_at || (b as any).createdAt || '2026-01-15')}
                    </td>

                    {/* 7. UPDATED AT */}
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatMasterDate(b.updated_at || (b as any).updatedAt || b.created_at || '2026-09-29')}
                    </td>

                    {/* 8. ACTIONS */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditModal(b)}
                          title="Edit Brand"
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: '#F1F5F9',
                            color: '#0F172A',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>

                        <button
                          onClick={() => setConfirmToggleBrand(b)}
                          title={isActive ? 'Deactivate Brand' : 'Activate Brand'}
                          style={{
                            padding: '6px 10px',
                            fontSize: 11.5,
                            fontWeight: 700,
                            borderRadius: 6,
                            background: isActive ? '#FFF' : '#DCFCE7',
                            color: isActive ? '#B91C1C' : '#15803D',
                            border: isActive ? '1px solid #FCA5A5' : '1px solid #86EFAC',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Power size={12} />
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => handleDelete(b)}
                          title="Delete Brand"
                          style={{
                            padding: '6px 8px',
                            borderRadius: 6,
                            background: '#FFF',
                            color: '#94A3B8',
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer'
                          }}
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

      {/* ── MODAL: ADD / EDIT BRAND ── */}
      {isModalOpen && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 20px 48px rgba(15,23,42,0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDFA', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {editingBrand ? 'Edit Brand' : 'Add Brand'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Product catalogue brand classification
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Alert */}
            {formError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', marginBottom: 14, color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveBrand} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SunBio, Cipla Partner, Augmentin"
                  value={formData.brand_name}
                  onChange={e => setFormData({ ...formData, brand_name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Brand Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUNBIO, CIPLA, BRD-AUG"
                  value={formData.brand_code}
                  onChange={e => setFormData({ ...formData, brand_code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the therapeutic scope or commercial positioning of this brand..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Lifecycle Status *
                </label>
                <select
                  value={formData.lifecycle_status}
                  onChange={e => setFormData({ ...formData, lifecycle_status: e.target.value as LifecycleStatus })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12.5, fontWeight: 600, background: '#FFF' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL: TOGGLE STATUS ── */}
      {confirmToggleBrand && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10006,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setConfirmToggleBrand(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 22, boxShadow: '0 20px 48px rgba(15,23,42,0.2)' }}
          >
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
              Confirm Status Change
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to change the status of brand{' '}
              <strong style={{ color: '#0F172A' }}>"{confirmToggleBrand.brand_name || confirmToggleBrand.name}"</strong> to{' '}
              <strong style={{ color: (confirmToggleBrand.lifecycle_status || confirmToggleBrand.status) === 'ACTIVE' ? '#B91C1C' : '#059669' }}>
                {(confirmToggleBrand.lifecycle_status || confirmToggleBrand.status) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'}
              </strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmToggleBrand(null)}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(confirmToggleBrand)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: (confirmToggleBrand.lifecycle_status || confirmToggleBrand.status) === 'ACTIVE' ? '#DC2626' : '#059669',
                  color: '#FFF',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
