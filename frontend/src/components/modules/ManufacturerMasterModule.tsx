import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Manufacturer, ManufacturerLifecycleStatus } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';
import {
  MasterBreadcrumbs,
  MasterPageHeader,
  MasterStatsStrip,
  MasterStatusBadge,
  TableActionGroup
} from '../common/MasterComponents';
import {
  Factory, Search, Plus, Edit3, Trash2, CheckCircle2,
  AlertTriangle, X, Power, Eye, Package, ArrowRight,
  Calendar, Layers, Filter, Check, ShieldCheck
} from 'lucide-react';

export const ManufacturerMasterModule: React.FC = () => {
  const {
    manufacturers,
    mappings,
    products,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    toggleManufacturerStatus,
    setActiveTab
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ManufacturerLifecycleStatus>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMfg, setEditingMfg] = useState<Manufacturer | null>(null);
  const [formData, setFormData] = useState({
    manufacturer_name: '',
    manufacturer_code: '',
    description: '',
    lifecycle_status: 'ACTIVE' as ManufacturerLifecycleStatus,
    effective_from: new Date().toISOString().split('T')[0],
    discontinued_on: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail Drawer State
  const [selectedMfgForDetail, setSelectedMfgForDetail] = useState<Manufacturer | null>(null);

  // Deletion / Status Toggle Confirmation State
  const [confirmDeleteMfg, setConfirmDeleteMfg] = useState<Manufacturer | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get count of products mapped to a manufacturer
  const getMappedProductsCount = (mfgId: string) => {
    return (mappings || []).filter(m => (m.manufacturerId === mfgId || m.manufacturer_id === mfgId) && (m.lifecycle_status === 'ACTIVE' || (m as any).status === 'Active')).length;
  };

  // Helper to get all mapped products for drawer
  const getMappedProductsList = (mfgId: string) => {
    const mfgMappings = (mappings || []).filter(m => m.manufacturerId === mfgId || m.manufacturer_id === mfgId);
    return mfgMappings.map(map => {
      const p = (products || []).find(prod => prod.id === (map.productId || map.product_id));
      return {
        mapping: map,
        product: p
      };
    });
  };

  // Lifecycle status styling helper
  const getLifecycleBadge = (status?: string) => {
    const st = (status || 'ACTIVE').toUpperCase();
    switch (st) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'INACTIVE':
        return { label: 'INACTIVE', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
      case 'SUSPENDED':
        return { label: 'SUSPENDED', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'EOL':
        return { label: 'EOL (End of Life)', bg: '#F3E8FF', color: '#7E22CE', border: '#D8B4FE' };
      default:
        return { label: st, bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
  };

  // Master Statistics
  const stats = useMemo(() => {
    const list = manufacturers || [];
    const total = list.length;
    const active = list.filter(m => (m.lifecycle_status || m.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
    const inactive = total - active;
    const withProducts = list.filter(m => getMappedProductsCount(m.id || m.manufacturer_id!) > 0).length;
    return { total, active, inactive, withProducts };
  }, [manufacturers, mappings]);

  // Filtered Manufacturers
  const filteredManufacturers = useMemo(() => {
    return (manufacturers || []).filter(m => {
      const q = searchTerm.toLowerCase().trim();
      const name = (m.manufacturer_name || m.companyName || m.name || '').toLowerCase();
      const code = (m.manufacturer_code || m.code || '').toLowerCase();
      const desc = (m.description || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q) || desc.includes(q);

      const status = ((m.lifecycle_status || m.status || 'ACTIVE').toUpperCase()) as ManufacturerLifecycleStatus;
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary stable sort on id DESC
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      const idA = String(a.manufacturer_id || a.id || '');
      const idB = String(b.manufacturer_id || b.id || '');
      return idB.localeCompare(idA);
    });
  }, [manufacturers, searchTerm, statusFilter]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredManufacturers.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, statusFilter]
  });
  const paginatedManufacturers = pagination.paginateItems(filteredManufacturers);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMfg(null);
    const nextNum = (manufacturers && manufacturers.length > 0) ? manufacturers.length + 1 : 1;
    const nextCode = `MFG000${nextNum < 10 ? '40' + nextNum : nextNum < 100 ? '4' + nextNum : nextNum}`;

    setFormData({
      manufacturer_name: '',
      manufacturer_code: nextCode,
      description: '',
      lifecycle_status: 'ACTIVE',
      effective_from: new Date().toISOString().split('T')[0],
      discontinued_on: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (mfg: Manufacturer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMfg(mfg);
    setFormData({
      manufacturer_name: mfg.manufacturer_name || mfg.companyName || mfg.name || '',
      manufacturer_code: mfg.manufacturer_code || mfg.code || '',
      description: mfg.description || '',
      lifecycle_status: ((mfg.lifecycle_status || mfg.status || 'ACTIVE').toUpperCase()) as ManufacturerLifecycleStatus,
      effective_from: mfg.effective_from || new Date().toISOString().split('T')[0],
      discontinued_on: mfg.discontinued_on || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Manufacturer Form Handler
  const handleSaveManufacturer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.manufacturer_name.trim();
    if (!cleanName) {
      setFormError('Manufacturer Name is required.');
      return;
    }
    const autoCode = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'MFG';
    const cleanCode = (formData.manufacturer_code.trim() || autoCode).toUpperCase();

    // Uniqueness validation on Manufacturer
    const duplicate = (manufacturers || []).find(m => {
      const isSelf = editingMfg && (m.id === editingMfg.id || m.manufacturer_id === editingMfg.manufacturer_id);
      if (isSelf) return false;
      const mCode = (m.manufacturer_code || m.code || '').toUpperCase().trim();
      const mName = (m.manufacturer_name || m.companyName || m.name || '').toLowerCase().trim();
      return mCode === cleanCode || mName === cleanName.toLowerCase();
    });

    if (duplicate) {
      setFormError(`A manufacturer named "${cleanName}" already exists.`);
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingMfg) {
      const targetId = editingMfg.manufacturer_id || editingMfg.id;
      updateManufacturer(targetId, {
        manufacturer_name: cleanName,
        companyName: cleanName,
        name: cleanName,
        manufacturer_code: cleanCode,
        code: cleanCode,
        description: formData.description.trim(),
        lifecycle_status: formData.lifecycle_status,
        status: formData.lifecycle_status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        effective_from: formData.effective_from,
        discontinued_on: formData.discontinued_on || null,
        updated_at: nowIso
      });
      showToast(`Manufacturer "${cleanName}" updated successfully.`);
    } else {
      const nextNum = (manufacturers && manufacturers.length > 0) ? manufacturers.length + 1 : 1;
      const newId = `m_${Date.now()}`;
      const newMfg: Manufacturer = {
        manufacturer_id: newId,
        manufacturer_code: cleanCode,
        manufacturer_name: cleanName,
        description: formData.description.trim(),
        lifecycle_status: formData.lifecycle_status,
        effective_from: formData.effective_from || nowIso,
        discontinued_on: formData.discontinued_on || null,
        created_at: nowIso,
        updated_at: nowIso,
        // Marketplace compatibility aliases
        id: newId,
        code: cleanCode,
        companyName: cleanName,
        name: cleanName,
        mfgLicenseNo: 'ML-FORM-25',
        gstin: '02AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
        contactPerson: 'Authorized Plant Head',
        email: 'info@plantoperations.com',
        phone: '+91 98000 00000',
        city: 'Industrial Area',
        state: 'State',
        status: formData.lifecycle_status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
        complianceStatus: 'APPROVED',
        rating: 4.5,
        activeSubOrders: 0
      };
      addManufacturer(newMfg);
      pagination.resetPage();
      showToast(`Manufacturer "${cleanName}" created successfully.`);
    }

    setIsModalOpen(false);
  };

  // Toggle Status
  const handleToggleStatus = (mfg: Manufacturer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = mfg.lifecycle_status || (mfg.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    const next: ManufacturerLifecycleStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const targetId = mfg.manufacturer_id || mfg.id;

    updateManufacturer(targetId, {
      lifecycle_status: next,
      status: next === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      updated_at: new Date().toISOString().split('T')[0]
    });
    toggleManufacturerStatus(targetId);
    showToast(`Manufacturer status changed to ${next}`);
  };

  // Delete confirmation
  const handleDeleteConfirm = () => {
    if (!confirmDeleteMfg) return;
    const targetId = confirmDeleteMfg.manufacturer_id || confirmDeleteMfg.id;
    deleteManufacturer(targetId);
    showToast(`Manufacturer "${confirmDeleteMfg.manufacturer_name || confirmDeleteMfg.companyName}" deleted.`);
    setConfirmDeleteMfg(null);
    if (selectedMfgForDetail && (selectedMfgForDetail.id === targetId || selectedMfgForDetail.manufacturer_id === targetId)) {
      setSelectedMfgForDetail(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48 }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 10001,
          background: '#0F766E',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: 13.5
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Breadcrumbs Bar ── */}
      <MasterBreadcrumbs
        pageTitle="Manufacturer Master"
        onBack={() => setActiveTab('settings')}
      />

      {/* ── Enterprise Header ── */}
      <MasterPageHeader
        icon={Factory}
        domainLabel="MASTER DATA · CATALOGUE MANAGEMENT"
        title="Manufacturer Master"
        description="Manage manufacturer records used across the FactoryGrid product catalogue."
        primaryAction={{
          label: "Add Manufacturer",
          icon: Plus,
          onClick: handleOpenAddModal
        }}
      />

      {/* ── Statistics Strip ── */}
      <MasterStatsStrip
        stats={[
          { label: 'TOTAL MANUFACTURERS', value: stats.total },
          { label: 'ACTIVE', value: stats.active, color: '#15803D' },
          { label: 'INACTIVE', value: stats.inactive, color: '#B91C1C' },
          { label: 'WITH PRODUCTS', value: stats.withProducts, color: '#0F766E' }
        ]}
        modelTag="Canonical Data Model: MANUFACTURER"
      />

      {/* ── Search & Filter Controls Bar ────────────────────────────── */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '10px 14px',
            flex: '1 1 300px'
          }}>
            <Search size={16} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by manufacturer code, name, or description..."
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

          {/* Lifecycle Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Lifecycle Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: statusFilter !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: statusFilter !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: statusFilter !== 'ALL' ? '#0F766E' : '#0F172A',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="EOL">EOL (End of Life)</option>
            </select>
          </div>

        </div>

        {/* Informational Guidance Notice */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12,
          color: '#475569',
          paddingTop: 10,
          borderTop: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} style={{ color: '#0F766E' }} />
            <span>
              Core MANUFACTURER records represent verified manufacturing entities. Products map to manufacturers via PRODUCT_MANUFACTURER.
            </span>
          </div>

          <span style={{ fontSize: 12.5, color: '#64748B' }}>
            Showing <strong style={{ color: '#0F766E' }}>{filteredManufacturers.length}</strong> manufacturers
          </span>
        </div>
      </div>

      {/* ── Manufacturer Table ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1050, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 280 }}>MANUFACTURER NAME</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DESCRIPTION</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>LIFECYCLE STATUS</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>EFFECTIVE FROM</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 130 }}>DISCONTINUED ON</th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 100 }}>PRODUCTS</th>
              <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 140 }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredManufacturers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Factory size={36} style={{ color: '#94A3B8', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No manufacturers found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create a manufacturer record to enable product-manufacturer catalog mappings.
                  </div>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                  >
                    + Add Manufacturer
                  </button>
                </td>
              </tr>
            ) : (
              paginatedManufacturers.map((mfg) => {
                const codeStr = mfg.manufacturer_code || mfg.code;
                const nameStr = mfg.manufacturer_name || mfg.companyName || mfg.name;
                const statusStr = mfg.lifecycle_status || (mfg.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
                const badge = getLifecycleBadge(statusStr);
                const prodCount = getMappedProductsCount(mfg.id || mfg.manufacturer_id!);
                const effFrom = mfg.effective_from || '—';
                const discOn = mfg.discontinued_on || '—';

                return (
                  <tr
                    key={mfg.id || mfg.manufacturer_id}
                    onClick={() => setSelectedMfgForDetail(mfg)}
                    style={{ cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* Manufacturer Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>{nameStr}</div>
                      {mfg.city && mfg.state && (
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{mfg.city}, {mfg.state}</div>
                      )}
                    </td>

                    {/* Description */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#475569', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mfg.description}>
                      {mfg.description || '—'}
                    </td>

                    {/* Lifecycle Status */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <MasterStatusBadge status={statusStr} />
                    </td>

                    {/* Effective From */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effFrom}
                    </td>

                    {/* Discontinued On */}
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {discOn}
                    </td>

                    {/* Products Count */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        background: prodCount > 0 ? '#F0FDFA' : '#F1F5F9',
                        color: prodCount > 0 ? '#0F766E' : '#64748B',
                        border: prodCount > 0 ? '1px solid #99F6E4' : '1px solid #E2E8F0',
                        fontSize: 11.5,
                        fontWeight: 700
                      }}>
                        {prodCount} Product{prodCount === 1 ? '' : 's'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <TableActionGroup
                        onView={() => setSelectedMfgForDetail(mfg)}
                        onEdit={() => handleOpenEditModal(mfg)}
                        status={statusStr}
                        onToggleStatus={() => handleToggleStatus(mfg)}
                        onDelete={() => setConfirmDeleteMfg(mfg)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControl {...pagination.paginationProps} itemName="manufacturers" />

      {/* ── CREATE / EDIT MANUFACTURER MODAL ──────────────────────── */}
      {isModalOpen && (
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 560,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 14,
              padding: 24,
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingMfg ? 'EDIT MANUFACTURER' : 'ADD MANUFACTURER'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Standardized client MANUFACTURER master entity model.
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Error Alert */}
            {formError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#B91C1C', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveManufacturer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SunBio LifeSciences Ltd"
                  value={formData.manufacturer_name}
                  onChange={e => {
                    const name = e.target.value;
                    const autoCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'MFG';
                    setFormData({
                      ...formData,
                      manufacturer_name: name,
                      manufacturer_code: editingMfg && formData.manufacturer_code ? formData.manufacturer_code : autoCode
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe manufacturer facilities, specialties, certifications..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Lifecycle Status *
                  </label>
                  <select
                    value={formData.lifecycle_status}
                    onChange={e => setFormData({ ...formData, lifecycle_status: e.target.value as ManufacturerLifecycleStatus })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="EOL">EOL (End of Life)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={formData.effective_from}
                    onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Discontinued On
                  </label>
                  <input
                    type="date"
                    value={formData.discontinued_on}
                    onChange={e => setFormData({ ...formData, discontinued_on: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Audit Metadata when editing */}
              {editingMfg && (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Created At: </span>
                    <strong style={{ color: '#334155' }}>{editingMfg.created_at || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Updated At: </span>
                    <strong style={{ color: '#334155' }}>{editingMfg.updated_at || '—'}</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingMfg ? 'Update Manufacturer' : 'Save Manufacturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MANUFACTURER DETAIL DRAWER ────────────────────────────── */}
      {selectedMfgForDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setSelectedMfgForDetail(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              height: '100%',
              background: '#FFFFFF',
              boxShadow: '-4px 0 24px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {/* Drawer Header */}
            <div style={{
              padding: 20,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {selectedMfgForDetail.manufacturer_name || selectedMfgForDetail.companyName || selectedMfgForDetail.name}
                </h2>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Manufacturer Master Record &amp; Mapped Products
                </div>
              </div>
              <button onClick={() => setSelectedMfgForDetail(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Manufacturer Information Card */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Factory size={15} /> MANUFACTURER SPECIFICATIONS
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Manufacturer Name:</span>
                    <strong style={{ color: '#0F172A', display: 'block' }}>{selectedMfgForDetail.manufacturer_name || selectedMfgForDetail.companyName || selectedMfgForDetail.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Lifecycle Status:</span>
                    {(() => {
                      const badge = getLifecycleBadge(selectedMfgForDetail.lifecycle_status || (selectedMfgForDetail.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'));
                      return (
                        <div style={{ marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Effective From:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedMfgForDetail.effective_from || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Discontinued On:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedMfgForDetail.discontinued_on || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Location:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedMfgForDetail.city ? `${selectedMfgForDetail.city}, ${selectedMfgForDetail.state}` : '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Created At:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedMfgForDetail.created_at || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Updated At:</span>
                    <strong style={{ color: '#334155', display: 'block' }}>{selectedMfgForDetail.updated_at || '—'}</strong>
                  </div>
                  {selectedMfgForDetail.description && (
                    <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                      <span style={{ color: '#64748B' }}>Description:</span>
                      <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
                        {selectedMfgForDetail.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mapped Products List (via PRODUCT_MANUFACTURER) */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 10, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={15} /> MAPPED CATALOGUE PRODUCTS ({getMappedProductsCount(selectedMfgForDetail.id || selectedMfgForDetail.manufacturer_id!)})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(() => {
                    const mappedList = getMappedProductsList(selectedMfgForDetail.id || selectedMfgForDetail.manufacturer_id!);
                    if (mappedList.length === 0) {
                      return (
                        <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5, color: '#64748B', textAlign: 'center' }}>
                          No products mapped to this manufacturer yet. Products can be mapped from the Product Catalog.
                        </div>
                      );
                    }

                    return mappedList.map(({ mapping, product }) => {
                      return (
                        <div
                          key={mapping.product_manufacturer_id || `${mapping.productId}_${mapping.manufacturerId}`}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 8,
                            padding: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace' }}>
                                {product ? (product.product_code || product.code) : mapping.productId}
                              </span>
                              {mapping.is_preferred && (
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' }}>
                                  ★ PREFERRED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                              {product ? (product.product_name || product.name) : 'Product Record'}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              Mfg Code: <strong style={{ color: '#0F766E', fontFamily: 'monospace' }}>{mapping.manufacturer_product_code || mapping.mfgProductCode || '—'}</strong> ·
                              SKU: <strong style={{ color: '#334155', fontFamily: 'monospace' }}>{mapping.manufacturer_sku || '—'}</strong> ·
                              Part No: {mapping.manufacturer_part_number || '—'}
                            </div>
                          </div>

                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: (mapping.lifecycle_status || mapping.status) === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                            color: (mapping.lifecycle_status || mapping.status) === 'ACTIVE' ? '#15803D' : '#64748B',
                            border: (mapping.lifecycle_status || mapping.status) === 'ACTIVE' ? '1px solid #86EFAC' : '1px solid #CBD5E1'
                          }}>
                            {mapping.lifecycle_status || mapping.status || 'ACTIVE'}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div style={{ padding: 16, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => handleOpenEditModal(selectedMfgForDetail)}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#0F172A', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Edit3 size={14} /> Edit Manufacturer
              </button>

              <button
                onClick={() => handleToggleStatus(selectedMfgForDetail)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 6,
                  border: selectedMfgForDetail.lifecycle_status === 'INACTIVE' ? '1px solid #86EFAC' : '1px solid #FCA5A5',
                  background: selectedMfgForDetail.lifecycle_status === 'INACTIVE' ? '#DCFCE7' : '#FEE2E2',
                  color: selectedMfgForDetail.lifecycle_status === 'INACTIVE' ? '#15803D' : '#B91C1C',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Power size={14} /> {selectedMfgForDetail.lifecycle_status === 'INACTIVE' ? 'Activate Manufacturer' : 'Deactivate Manufacturer'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────── */}
      {confirmDeleteMfg && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10002,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 12, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#DC2626', marginBottom: 12 }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Confirm Manufacturer Deletion</h3>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              Are you sure you want to delete manufacturer <strong>{confirmDeleteMfg.manufacturer_name || confirmDeleteMfg.companyName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteMfg(null)}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Delete Manufacturer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
