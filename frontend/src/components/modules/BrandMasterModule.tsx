import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Brand, LifecycleStatus } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';
import {
  Tag, Search, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, X, Power, Pause, Play
} from 'lucide-react';

export const BrandMasterModule: React.FC = () => {
  const {
    brands,
    addBrand,
    updateBrand,
    deleteBrand,
    toggleBrandStatus,
    setActiveTab
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
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary stable sort on id DESC
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      const idA = String(a.brand_id || a.id || '');
      const idB = String(b.brand_id || b.id || '');
      return idB.localeCompare(idA);
    });
  }, [brands, searchTerm, statusFilter]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredBrands.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, statusFilter]
  });
  const paginatedBrands = pagination.paginateItems(filteredBrands);

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
    if (!cleanName) {
      setFormError('Brand Name is required.');
      return;
    }
    const autoCode = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'BRD';
    const cleanCode = (formData.brand_code.trim() || autoCode).toUpperCase();

    // Uniqueness validation
    const duplicate = (brands || []).find(b => {
      const isSelf = editingBrand && (b.brand_id === editingBrand.brand_id || b.id === editingBrand.id);
      if (isSelf) return false;
      const bCode = (b.brand_code || b.code || '').toUpperCase();
      const bName = (b.brand_name || b.name || '').toLowerCase();
      return bCode === cleanCode || bName === cleanName.toLowerCase();
    });

    if (duplicate) {
      setFormError(`A brand named "${cleanName}" already exists.`);
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
      pagination.resetPage();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, background: '#F8FAFC' }}>
      
      {/* ── Global Toast ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 10010,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(15,23,42,0.25)',
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

      {/* ── Breadcrumbs Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748B', fontWeight: 600, padding: '4px 0' }}>
        <button
          onClick={() => setActiveTab?.('settings')}
          style={{ background: 'none', border: 'none', color: '#64748B', padding: 0, cursor: 'pointer', fontWeight: 600 }}
        >
          Master Data (Settings)
        </button>
        <span style={{ color: '#CBD5E1' }}>/</span>
        <span style={{ color: '#0F766E', fontWeight: 700 }}>
          Brand Master
        </span>
      </div>

      {/* ── Main Page Header Bar ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: '16px 20px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: '#F0FDFA',
            border: '1px solid #CCFBF1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F766E'
          }}>
            <Tag size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0F766E' }}>
              PRODUCT MANAGEMENT MODEL
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Brand Master
            </h1>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Canonical registered pharmaceutical brands and product mappings.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          style={{
            padding: '7px 14px',
            borderRadius: 6,
            background: '#0F766E',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 600,
            fontSize: 12.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 1px 2px rgba(15,118,110,0.15)'
          }}
        >
          <Plus size={14} /> Add Brand
        </button>
      </div>

      {/* ── Compact Statistics Strip ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '10px 16px',
        boxShadow: '0 1px 2px rgba(15,23,42,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              TOTAL BRANDS:
            </span>
            <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', fontSize: 13 }}>
              {totalBrands}
            </span>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              ACTIVE:
            </span>
            <span style={{ fontWeight: 800, color: '#15803D', fontFamily: 'monospace', fontSize: 13 }}>
              {activeCount}
            </span>
          </div>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              INACTIVE:
            </span>
            <span style={{ fontWeight: 800, color: '#DC2626', fontFamily: 'monospace', fontSize: 13 }}>
              {inactiveCount}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748B' }}>
          Canonical Data Model: BRAND Master Entity
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 10,
        padding: 14,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: 6,
          padding: '8px 12px',
          minWidth: 280,
          flex: '1 1 280px'
        }}>
          <Search size={15} style={{ color: '#64748B' }} />
          <input
            type="text"
            placeholder="Search Brand name, code, description, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: 13, outline: 'none', color: '#0F172A' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              padding: '7px 12px',
              borderRadius: 6,
              border: '1px solid #CBD5E1',
              fontSize: 12.5,
              fontWeight: 600,
              background: '#FFF',
              color: '#0F172A',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* ── Brands Master Table ── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Registered Brands (BRAND)</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manage registered brand classifications for product catalog</div>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '4px 10px', borderRadius: 6, border: '1px solid #CCFBF1' }}>
            {filteredBrands.length} Available
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>BRAND NAME</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 200 }}>DESCRIPTION</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110, textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>CREATED AT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>UPDATED AT</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 180, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                    <Tag size={36} style={{ color: '#94A3B8', margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No brands found.</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 }}>
                      {searchTerm ? `No brands matching "${searchTerm}". Try clearing your search.` : 'Get started by creating your first product brand master record.'}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      style={{ padding: '8px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Add Brand
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedBrands.map((b, idx) => {
                  const bName = b.brand_name || b.name || '';
                  const bCode = b.brand_code || b.code || '';
                  const status = (b.lifecycle_status || b.status || 'ACTIVE').toUpperCase();
                  const isActive = status === 'ACTIVE';
                  const bId = b.brand_id || b.id || '';
                  const formattedId = formatBrandId(b, idx);

                  return (
                    <tr
                      key={bId || idx}
                      style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      {/* 1. BRAND NAME */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag size={15} style={{ color: '#0F766E', flexShrink: 0 }} />
                          <span>{bName}</span>
                        </div>
                      </td>

                      {/* 2. DESCRIPTION */}
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: 12.5, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.description || 'Catalogue brand'}>
                          {b.description || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No description</span>}
                        </div>
                      </td>

                      {/* 5. STATUS */}
                      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#15803D' : '#B91C1C',
                          border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                        }}>
                          {status}
                        </span>
                      </td>

                      {/* 6. CREATED AT */}
                      <td style={{ padding: '14px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatMasterDate(b.created_at || (b as any).createdAt || '2026-01-15')}
                      </td>

                      {/* 7. UPDATED AT */}
                      <td style={{ padding: '14px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                        {formatMasterDate(b.updated_at || (b as any).updatedAt || b.created_at || '2026-09-29')}
                      </td>

                      {/* 8. ACTIONS */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(b)}
                            title={`Edit ${bName} details`}
                            aria-label="Edit Brand"
                            style={{
                              height: 28,
                              padding: '0 9px',
                              fontSize: 12,
                              fontWeight: 600,
                              borderRadius: 6,
                              background: '#FFFFFF',
                              color: '#334155',
                              border: '1px solid #CBD5E1',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              boxSizing: 'border-box',
                              lineHeight: 1,
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#F8FAFC';
                              e.currentTarget.style.borderColor = '#94A3B8';
                              e.currentTarget.style.color = '#0F172A';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#FFFFFF';
                              e.currentTarget.style.borderColor = '#CBD5E1';
                              e.currentTarget.style.color = '#334155';
                            }}
                          >
                            <Edit3 size={12.5} style={{ flexShrink: 0, color: '#64748B' }} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => setConfirmToggleBrand(b)}
                              title={`Deactivate ${bName}`}
                              aria-label="Deactivate Brand"
                              style={{
                                height: 28,
                                padding: '0 9px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 6,
                                background: '#FFFFFF',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                boxSizing: 'border-box',
                                lineHeight: 1,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#FEF2F2';
                                e.currentTarget.style.borderColor = '#FCA5A5';
                                e.currentTarget.style.color = '#B91C1C';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#FECACA';
                                e.currentTarget.style.color = '#DC2626';
                              }}
                            >
                              <Pause size={11.5} style={{ flexShrink: 0 }} />
                              <span className="hidden sm:inline">Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmToggleBrand(b)}
                              title={`Activate ${bName}`}
                              aria-label="Activate Brand"
                              style={{
                                height: 28,
                                padding: '0 9px',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 6,
                                background: '#FFFFFF',
                                color: '#15803D',
                                border: '1px solid #BBF7D0',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                boxSizing: 'border-box',
                                lineHeight: 1,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#F0FDF4';
                                e.currentTarget.style.borderColor = '#86EFAC';
                                e.currentTarget.style.color = '#166534';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#BBF7D0';
                                e.currentTarget.style.color = '#15803D';
                              }}
                            >
                              <Play size={11} style={{ flexShrink: 0 }} />
                              <span className="hidden sm:inline">Activate</span>
                            </button>
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
        <PaginationControl {...pagination.paginationProps} itemName="brands" />
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
                type="button"
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
                  onChange={e => {
                    const name = e.target.value;
                    const autoCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'BRD';
                    setFormData({
                      ...formData,
                      brand_name: name,
                      brand_code: editingBrand && formData.brand_code ? formData.brand_code : autoCode
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
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
                type="button"
                onClick={() => setConfirmToggleBrand(null)}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
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
