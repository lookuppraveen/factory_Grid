import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  CheckCircle2, Clock
} from 'lucide-react';
import { CustomerSegment, LifecycleStatus } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';
import {
  MasterBreadcrumbs,
  MasterPageHeader,
  MasterStatsStrip,
  MasterStatusBadge,
  TableActionGroup,
  MasterApiStatusBanner
} from '../common/MasterComponents';

export const CustomerSegmentMasterModule: React.FC = () => {
  const {
    customerSegments,
    masterLoading,
    masterErrors,
    refreshCustomerSegments,
    addCustomerSegment,
    updateCustomerSegment,
    removeCustomerSegment,
    addAuditLog,
    currentRole,
    setActiveTab
  } = useApp();

  const canEdit = currentRole === 'ADMIN';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    segment_code: '',
    segment_name: '',
    description: '',
    lifecycle_status: 'ACTIVE' as LifecycleStatus
  });

  // Filtered List
  const filteredSegments = useMemo(() => {
    return (customerSegments || []).filter(seg => {
      const q = searchTerm.toLowerCase().trim();
      const code = (seg.segment_code || seg.code || '').toLowerCase();
      const name = (seg.segment_name || seg.name || '').toLowerCase();
      const desc = (seg.description || '').toLowerCase();

      const matchesSearch = q === '' || code.includes(q) || name.includes(q) || desc.includes(q);
      const segStatus = seg.lifecycle_status || (seg.is_active ? 'ACTIVE' : 'INACTIVE');
      const matchesStatus = statusFilter === 'ALL' || segStatus === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.created_at || (b as any).createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.customer_segment_id || b.id || '').localeCompare(a.customer_segment_id || a.id || '');
    });
  }, [customerSegments, searchTerm, statusFilter]);

  const {
    paginatedItems: paginatedSegments,
    paginationProps,
    resetPage
  } = usePagination(filteredSegments, {
    initialPageSize: 10,
    resetDeps: [searchTerm, statusFilter]
  });

  // KPIs
  const totalCount = customerSegments.length;
  const activeCount = customerSegments.filter(s => (s.lifecycle_status || (s.is_active ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;

  // Handlers
  const handleOpenAddModal = () => {
    setEditingSegmentId(null);
    setFormData({
      segment_code: '',
      segment_name: '',
      description: '',
      lifecycle_status: 'ACTIVE'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (seg: CustomerSegment) => {
    setEditingSegmentId(seg.customer_segment_id || seg.id || '');
    setFormData({
      segment_code: seg.segment_code || seg.code || '',
      segment_name: seg.segment_name || seg.name || '',
      description: seg.description || '',
      lifecycle_status: (seg.lifecycle_status || (seg.is_active ? 'ACTIVE' : 'INACTIVE')) as LifecycleStatus
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.segment_name.trim();
    if (!cleanName) {
      setFormError('Segment Name is mandatory.');
      return;
    }

    const autoCode = cleanName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'SEG';
    const codeClean = (formData.segment_code.trim() || autoCode).toUpperCase();
    const isDuplicate = (customerSegments || []).some(s =>
      (s.customer_segment_id || s.id) !== editingSegmentId &&
      ((s.segment_name || s.name || '').toLowerCase().trim() === cleanName.toLowerCase() ||
       (s.segment_code || s.code || '').toUpperCase().trim() === codeClean)
    );

    if (isDuplicate) {
      setFormError(`Customer Segment "${cleanName}" already exists.`);
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    try {
      if (editingSegmentId) {
        await updateCustomerSegment(editingSegmentId, {
          segment_code: codeClean,
          segment_name: formData.segment_name.trim(),
          description: formData.description.trim(),
          lifecycle_status: formData.lifecycle_status,
          is_active: formData.lifecycle_status === 'ACTIVE',
          updated_at: nowIso,
          code: codeClean,
          name: formData.segment_name.trim()
        });
        addAuditLog('UPDATE_CUSTOMER_SEGMENT', `Updated customer segment ${codeClean}`);
      } else {
        const newSeg: CustomerSegment = {
          customer_segment_id: `seg_${Date.now()}`,
          segment_code: codeClean,
          segment_name: formData.segment_name.trim(),
          description: formData.description.trim(),
          lifecycle_status: formData.lifecycle_status,
          is_active: formData.lifecycle_status === 'ACTIVE',
          created_at: nowIso,
          updated_at: nowIso,
          id: `seg_${Date.now()}`,
          code: codeClean,
          name: formData.segment_name.trim()
        };
        await addCustomerSegment(newSeg);
        addAuditLog('ADD_CUSTOMER_SEGMENT', `Created customer segment ${codeClean}`);
        resetPage();
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save customer segment. Please try again.');
    }
  };

  const handleDelete = async (seg: CustomerSegment) => {
    const id = seg.customer_segment_id || seg.id || '';
    const segName = seg.segment_name || seg.name || 'this segment';
    if (window.confirm(`Are you sure you want to remove customer segment ${segName}?`)) {
      try {
        await removeCustomerSegment(id);
        addAuditLog('DELETE_CUSTOMER_SEGMENT', `Removed customer segment ${segName}`);
      } catch (err: any) {
        window.alert(err?.message || 'Failed to delete customer segment.');
      }
    }
  };

  const handleToggleStatus = async (seg: CustomerSegment) => {
    const id = seg.customer_segment_id || seg.id || '';
    const segName = seg.segment_name || seg.name || 'Segment';
    const current = seg.lifecycle_status || (seg.is_active ? 'ACTIVE' : 'INACTIVE');
    const nextStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateCustomerSegment(id, {
        lifecycle_status: nextStatus as LifecycleStatus,
        is_active: nextStatus === 'ACTIVE',
        updated_at: new Date().toISOString()
      });
      addAuditLog('TOGGLE_CUSTOMER_SEGMENT_STATUS', `Toggled customer segment ${segName} to ${nextStatus}`);
    } catch (err: any) {
      window.alert(err?.message || 'Failed to update customer segment status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {/* ── Breadcrumbs Bar ── */}
      <MasterBreadcrumbs
        pageTitle="Customer Segment Master"
        onBack={() => setActiveTab?.('settings')}
      />

      {/* ── Enterprise Page Header ── */}
      <MasterPageHeader
        icon={Users}
        domainLabel="COMMERCIAL PRICING & SEGMENTS"
        title="Customer Segment Master"
        description="Manage commercial customer segments for contract, tiered, and institutional pricing."
        primaryAction={canEdit ? {
          label: "Add Customer Segment",
          icon: Plus,
          onClick: handleOpenAddModal
        } : undefined}
      />

      {/* ── Compact Statistics Strip ── */}
      <MasterApiStatusBanner
        loading={masterLoading.customerSegments && customerSegments.length === 0}
        error={masterErrors.customerSegments}
        entityLabel="Customer Segments"
        onRetry={refreshCustomerSegments}
      />
      <MasterStatsStrip
        stats={[
          { label: 'TOTAL SEGMENTS', value: totalCount },
          { label: 'ACTIVE', value: activeCount, color: '#15803D' },
          { label: 'INACTIVE', value: inactiveCount, color: '#DC2626' }
        ]}
        modelTag="Canonical Data Model: CUSTOMER_SEGMENT"
      />

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search by segment code, name, or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={15} style={{ color: '#64748B' }} />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{ padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, background: '#FFFFFF', fontWeight: 600 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 220 }}>SEGMENT NAME</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569' }}>DESCRIPTION</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>LIFECYCLE STATUS</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>CREATED AT</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 120 }}>UPDATED AT</th>
                {canEdit && (
                  <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 100 }}>ACTIONS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedSegments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <Users size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No customer segments found.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Add a customer segment to configure tiered commercial pricing.</div>
                  </td>
                </tr>
              ) : (
                paginatedSegments.map(seg => {
                  const status = seg.lifecycle_status || (seg.is_active ? 'ACTIVE' : 'INACTIVE');
                  const isActive = status === 'ACTIVE';

                  return (
                    <tr key={seg.customer_segment_id || seg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {seg.segment_name || seg.name}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#475569' }}>
                        {seg.description || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <MasterStatusBadge status={isActive} />
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {seg.created_at || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {seg.updated_at || '—'}
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <TableActionGroup
                            onEdit={() => handleOpenEditModal(seg)}
                            status={isActive}
                            onToggleStatus={() => handleToggleStatus(seg)}
                            onDelete={() => handleDelete(seg)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationControl {...paginationProps} />
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {editingSegmentId ? 'Edit Customer Segment' : 'Add Customer Segment'}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>Commercial Pricing Tier</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
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
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Segment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authorized Wholesale Distributor"
                  value={formData.segment_name}
                  onChange={e => {
                    const name = e.target.value;
                    const autoCode = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10) || 'SEG';
                    setFormData({
                      ...formData,
                      segment_name: name,
                      segment_code: editingSegmentId && formData.segment_code ? formData.segment_code : autoCode
                    });
                  }}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe segment criteria and commercial classification..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Lifecycle Status *
                </label>
                <select
                  value={formData.lifecycle_status}
                  onChange={e => setFormData({ ...formData, lifecycle_status: e.target.value as LifecycleStatus })}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

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
                  {editingSegmentId ? 'Update Segment' : 'Save Segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
