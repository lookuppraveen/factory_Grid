import React, { useState, useMemo } from 'react';
import {
  Users, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  CheckCircle2, Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerSegment, LifecycleStatus } from '../../types';

export const CustomerSegmentMasterModule: React.FC = () => {
  const {
    customerSegments,
    addCustomerSegment,
    updateCustomerSegment,
    removeCustomerSegment,
    addAuditLog,
    currentRole
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
    });
  }, [customerSegments, searchTerm, statusFilter]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.segment_code.trim()) {
      setFormError('Segment Code is mandatory.');
      return;
    }
    if (!formData.segment_name.trim()) {
      setFormError('Segment Name is mandatory.');
      return;
    }

    const codeClean = formData.segment_code.trim().toUpperCase();
    const isDuplicate = (customerSegments || []).some(s =>
      (s.customer_segment_id || s.id) !== editingSegmentId &&
      (s.segment_code || s.code || '').toUpperCase().trim() === codeClean
    );

    if (isDuplicate) {
      setFormError(`Segment Code "${codeClean}" already exists. Code must be unique.`);
      return;
    }

    const nowIso = new Date().toISOString().split('T')[0];

    if (editingSegmentId) {
      updateCustomerSegment(editingSegmentId, {
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
      addCustomerSegment(newSeg);
      addAuditLog('ADD_CUSTOMER_SEGMENT', `Created customer segment ${codeClean}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (seg: CustomerSegment) => {
    const id = seg.customer_segment_id || seg.id || '';
    if (window.confirm(`Are you sure you want to remove customer segment ${seg.segment_code || seg.code}?`)) {
      removeCustomerSegment(id);
      addAuditLog('DELETE_CUSTOMER_SEGMENT', `Removed customer segment ${seg.segment_code}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDFA', border: '1px solid #99F6E4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} style={{ color: '#0F766E' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                Customer Segment Master
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                Client Entity: <code>CUSTOMER_SEGMENT</code> · Manage commercial customer segments for contract and tiered pricing
              </p>
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAddModal}
            style={{
              padding: '10px 18px',
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
              boxShadow: '0 2px 4px rgba(15,118,110,0.2)'
            }}
          >
            <Plus size={16} /> Add Customer Segment
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>TOTAL SEGMENTS</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>ACTIVE SEGMENTS</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F766E', marginTop: 4 }}>{activeCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>INACTIVE SEGMENTS</span>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#475569', marginTop: 4 }}>{inactiveCount}</div>
        </div>
      </div>

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
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 140 }}>SEGMENT CODE</th>
                <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 220 }}>SEGMENT NAME</th>
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
              {filteredSegments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                    <Users size={32} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>No customer segments found.</div>
                    <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>Add a customer segment to configure tiered commercial pricing.</div>
                  </td>
                </tr>
              ) : (
                filteredSegments.map(seg => {
                  const status = seg.lifecycle_status || (seg.is_active ? 'ACTIVE' : 'INACTIVE');
                  const isActive = status === 'ACTIVE';

                  return (
                    <tr key={seg.customer_segment_id || seg.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, fontWeight: 800, fontFamily: 'monospace', color: '#0F766E' }}>
                        {seg.segment_code || seg.code}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {seg.segment_name || seg.name}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12.5, color: '#475569' }}>
                        {seg.description || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: isActive ? '#DCFCE7' : '#F1F5F9',
                          color: isActive ? '#15803D' : '#64748B',
                          border: `1px solid ${isActive ? '#86EFAC' : '#CBD5E1'}`
                        }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {seg.created_at || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748B' }}>
                        {seg.updated_at || '—'}
                      </td>
                      {canEdit && (
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditModal(seg)}
                              title="Edit Segment"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(seg)}
                              title="Delete Segment"
                              style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                <span style={{ fontSize: 12, color: '#64748B' }}>Entity: CUSTOMER_SEGMENT</span>
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
                  Segment Code * (UNIQUE)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIST, HOSP, GOVT, RET"
                  value={formData.segment_code}
                  onChange={e => setFormData({ ...formData, segment_code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Segment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authorized Wholesale Distributor"
                  value={formData.segment_name}
                  onChange={e => setFormData({ ...formData, segment_name: e.target.value })}
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
