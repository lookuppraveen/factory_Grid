import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttributeMaster, AttributeDataType } from '../../types';
import {
  Search, Plus, Edit3, Power, Eye, X, Check, AlertCircle, Sparkles
} from 'lucide-react';

const DATA_TYPES: AttributeDataType[] = ['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'];

export const AttributeMasterModule: React.FC = () => {
  const {
    attributeMasters,
    addAttributeMaster,
    updateAttributeMaster,
    addAuditLog
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<AttributeMaster | null>(null);
  const [viewingAttr, setViewingAttr] = useState<AttributeMaster | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    attributeCode: '',
    attributeName: '',
    dataType: 'TEXT' as AttributeDataType,
    unitOfMeasure: '',
    remark: '',
    isFilterable: true,
    isSearchable: true,
    isRequired: false,
    isActive: true
  });

  // Filtered attribute list
  const filteredAttributes = useMemo(() => {
    return (attributeMasters || []).filter(attr => {
      const q = searchTerm.toLowerCase().trim();
      const code = (attr.attribute_code || attr.code || '').toLowerCase();
      const name = (attr.attribute_name || attr.name || '').toLowerCase();

      const matchesSearch = q === '' || code.includes(q) || name.includes(q);
      const matchesType = selectedDataType === 'ALL' || attr.data_type === selectedDataType;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && attr.is_active) ||
        (statusFilter === 'INACTIVE' && !attr.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [attributeMasters, searchTerm, selectedDataType, statusFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAttr(null);
    setFormData({
      attributeCode: '',
      attributeName: '',
      dataType: 'TEXT',
      unitOfMeasure: '',
      remark: '',
      isFilterable: true,
      isSearchable: true,
      isRequired: false,
      isActive: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (attr: AttributeMaster) => {
    setEditingAttr(attr);
    setFormData({
      attributeCode: attr.attribute_code || attr.code || '',
      attributeName: attr.attribute_name || attr.name || '',
      dataType: attr.data_type || 'TEXT',
      unitOfMeasure: attr.unit_of_measure || '',
      remark: attr.remark || '',
      isFilterable: attr.is_filterable ?? true,
      isSearchable: attr.is_searchable ?? true,
      isRequired: attr.is_required ?? false,
      isActive: attr.is_active ?? true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (attr: AttributeMaster) => {
    setViewingAttr(attr);
    setIsViewModalOpen(true);
  };

  // Save Modal (Add / Edit)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formData.attributeCode.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const cleanName = formData.attributeName.trim();

    if (!cleanCode) {
      setFormError('Attribute Code is required.');
      return;
    }
    if (!cleanName) {
      setFormError('Attribute Name is required.');
      return;
    }
    if (!formData.dataType) {
      setFormError('Data Type is required.');
      return;
    }

    // Uniqueness validation on code
    const isDuplicate = (attributeMasters || []).some(a => {
      const aId = a.attribute_id || a.id;
      const editingId = editingAttr ? (editingAttr.attribute_id || editingAttr.id) : null;
      if (editingId && aId === editingId) return false;
      const aCode = (a.attribute_code || a.code || '').toUpperCase().trim();
      return aCode === cleanCode;
    });

    if (isDuplicate) {
      setFormError(`Attribute Code "${cleanCode}" already exists. Attribute codes must be unique.`);
      return;
    }

    const nowIso = new Date().toISOString();

    if (editingAttr) {
      const targetId = editingAttr.attribute_id || editingAttr.id!;
      updateAttributeMaster(targetId, {
        attribute_name: cleanName,
        name: cleanName,
        attribute_code: cleanCode,
        code: cleanCode,
        data_type: formData.dataType,
        dataType: formData.dataType,
        unit_of_measure: formData.unitOfMeasure.trim() || undefined,
        remark: formData.remark.trim() || undefined,
        is_filterable: formData.isFilterable,
        is_searchable: formData.isSearchable,
        is_required: formData.isRequired,
        is_active: formData.isActive,
        updated_at: nowIso
      });
      addAuditLog('UPDATE_ATTRIBUTE_MASTER', `Updated attribute master ${cleanName} (${cleanCode})`);
    } else {
      const newAttr: AttributeMaster = {
        attribute_id: `attr_${cleanCode.toLowerCase()}`,
        id: `attr_${cleanCode.toLowerCase()}`,
        attribute_code: cleanCode,
        code: cleanCode,
        attribute_name: cleanName,
        name: cleanName,
        data_type: formData.dataType,
        dataType: formData.dataType,
        unit_of_measure: formData.unitOfMeasure.trim() || undefined,
        remark: formData.remark.trim() || undefined,
        is_filterable: formData.isFilterable,
        is_searchable: formData.isSearchable,
        is_required: formData.isRequired,
        is_active: formData.isActive,
        created_at: nowIso,
        updated_at: nowIso
      };
      addAttributeMaster(newAttr);
      addAuditLog('CREATE_ATTRIBUTE_MASTER', `Created attribute master ${cleanName} (${cleanCode})`);
    }

    setIsModalOpen(false);
    setEditingAttr(null);
  };

  // Toggle active status
  const handleToggleStatus = (attr: AttributeMaster) => {
    const targetId = attr.attribute_id || attr.id!;
    const nextStatus = !attr.is_active;
    updateAttributeMaster(targetId, {
      is_active: nextStatus,
      updated_at: new Date().toISOString()
    });
    addAuditLog('TOGGLE_ATTRIBUTE_STATUS', `Toggled attribute ${attr.attribute_name} to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>

      {/* ── Enterprise Page Header ─────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'rgba(15, 118, 110, 0.08)',
            border: '1px solid rgba(15, 118, 110, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sparkles size={20} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
              Attribute Master
            </h1>
            <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
              Master catalog specification attributes definition
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: '#0F766E',
            color: '#FFFFFF',
            border: 'none',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Plus size={15} /> Add Attribute
        </button>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────── */}
      <div style={{
        padding: '14px 18px',
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center'
      }}>
        {/* Search Field */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: 6,
          padding: '7px 12px',
          flex: '1 1 260px'
        }}>
          <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by attribute code or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              padding: 0,
              background: 'transparent',
              width: '100%',
              fontSize: 13,
              color: '#0F172A',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0 }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Data Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Data Type:</label>
          <select
            value={selectedDataType}
            onChange={e => setSelectedDataType(e.target.value)}
            style={{
              padding: '7px 10px',
              fontSize: 12.5,
              background: selectedDataType !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
              border: selectedDataType !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#0F172A',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Types</option>
            {DATA_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Active/Inactive Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              padding: '7px 10px',
              fontSize: 12.5,
              background: statusFilter !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
              border: statusFilter !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
              borderRadius: 6,
              color: '#0F172A',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Result Counter / Reset */}
        {(searchTerm || selectedDataType !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDataType('ALL');
              setStatusFilter('ALL');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#0F766E',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ── ATTRIBUTE_MASTER Table ─────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 190 }}>
                Attribute Code
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', minWidth: 180 }}>
                Attribute Name
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 110 }}>
                Data Type
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 140 }}>
                Unit of Measure
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 90 }}>
                Filterable
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 95 }}>
                Searchable
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 85 }}>
                Required
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 95 }}>
                Active
              </th>
              <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', textAlign: 'right', width: 115 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAttributes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>No attributes found</div>
                  <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
                    {searchTerm || selectedDataType !== 'ALL' || statusFilter !== 'ALL'
                      ? 'No attributes match the selected search or filter criteria.'
                      : 'No attribute master records exist yet. Click below to add one.'}
                  </div>
                  <button
                    onClick={handleOpenAdd}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 6,
                      background: '#0F766E',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: 12.5,
                      cursor: 'pointer'
                    }}
                  >
                    + Add Attribute
                  </button>
                </td>
              </tr>
            ) : (
              filteredAttributes.map(attr => {
                const code = attr.attribute_code || attr.code || '';
                const name = attr.attribute_name || attr.name || '';
                const uom = attr.unit_of_measure || '—';
                const isActive = attr.is_active;

                return (
                  <tr
                    key={attr.attribute_id || attr.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    {/* 1. Attribute Code */}
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {code}
                    </td>

                    {/* 2. Attribute Name */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{name}</div>
                    </td>

                    {/* 3. Data Type */}
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #E2E8F0'
                      }}>
                        {attr.data_type}
                      </span>
                    </td>

                    {/* 4. Unit of Measure */}
                    <td style={{ padding: '10px 10px', fontSize: 12.5, color: '#475569' }}>
                      {uom}
                    </td>

                    {/* 5. Filterable */}
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_filterable ? '#DCFCE7' : '#F1F5F9',
                        color: attr.is_filterable ? '#15803D' : '#64748B',
                        border: attr.is_filterable ? '1px solid #86EFAC' : '1px solid #E2E8F0'
                      }}>
                        {attr.is_filterable ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* 6. Searchable */}
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_searchable ? '#DCFCE7' : '#F1F5F9',
                        color: attr.is_searchable ? '#15803D' : '#64748B',
                        border: attr.is_searchable ? '1px solid #86EFAC' : '1px solid #E2E8F0'
                      }}>
                        {attr.is_searchable ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* 7. Required */}
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: attr.is_required ? '#FEF3C7' : '#F1F5F9',
                        color: attr.is_required ? '#B45309' : '#64748B',
                        border: attr.is_required ? '1px solid #FDE68A' : '1px solid #E2E8F0'
                      }}>
                        {attr.is_required ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* 8. Active */}
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: isActive ? '#DCFCE7' : '#FEE2E2',
                        color: isActive ? '#15803D' : '#B91C1C',
                        border: isActive ? '1px solid #86EFAC' : '1px solid #FCA5A5'
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    {/* 9. Actions */}
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        {/* View Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(attr)}
                          title="View Attribute Details"
                          style={{
                            padding: '4px 7px',
                            borderRadius: 4,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={13} />
                        </button>

                        {/* Edit Action */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(attr)}
                          title="Edit Attribute"
                          style={{
                            padding: '4px 7px',
                            borderRadius: 4,
                            background: '#FFFFFF',
                            border: '1px solid #CBD5E1',
                            color: '#0F766E',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={13} />
                        </button>

                        {/* Activate / Deactivate Action */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(attr)}
                          title={isActive ? 'Deactivate Attribute' : 'Activate Attribute'}
                          style={{
                            padding: '4px 7px',
                            borderRadius: 4,
                            background: isActive ? '#FEF2F2' : '#F0FDF4',
                            border: isActive ? '1px solid #FECACA' : '1px solid #BBF7D0',
                            color: isActive ? '#DC2626' : '#16A34A',
                            cursor: 'pointer'
                          }}
                        >
                          <Power size={13} />
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

      {/* ── VIEW ATTRIBUTE MODAL ───────────────────────────────────── */}
      {isViewModalOpen && viewingAttr && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              background: '#FFFFFF',
              borderRadius: 8,
              boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
              border: '1px solid #CBD5E1',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  Attribute Details
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  ATTRIBUTE_MASTER record
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Displays ONLY ATTRIBUTE_MASTER fields */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                fontSize: 13
              }}>
                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attribute ID</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', marginTop: 3, fontFamily: 'monospace' }}>
                    {viewingAttr.attribute_id || viewingAttr.id}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attribute Code</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', marginTop: 3, fontFamily: 'monospace' }}>
                    {viewingAttr.attribute_code || viewingAttr.code}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attribute Name</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 3 }}>
                    {viewingAttr.attribute_name || viewingAttr.name}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Data Type</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginTop: 3 }}>
                    {viewingAttr.data_type}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Unit of Measure</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#475569', marginTop: 3 }}>
                    {viewingAttr.unit_of_measure || '—'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Filterable</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: viewingAttr.is_filterable ? '#15803D' : '#64748B', marginTop: 3 }}>
                    {viewingAttr.is_filterable ? 'YES' : 'NO'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Searchable</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: viewingAttr.is_searchable ? '#15803D' : '#64748B', marginTop: 3 }}>
                    {viewingAttr.is_searchable ? 'YES' : 'NO'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Required</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: viewingAttr.is_required ? '#B45309' : '#64748B', marginTop: 3 }}>
                    {viewingAttr.is_required ? 'YES' : 'NO'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: viewingAttr.is_active ? '#15803D' : '#B91C1C', marginTop: 3 }}>
                    {viewingAttr.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Created At</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    {formatDate(viewingAttr.created_at)}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Updated At</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    {formatDate(viewingAttr.updated_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 18px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC'
            }}>
              <button
                type="button"
                onClick={() => {
                  const toEdit = viewingAttr;
                  setIsViewModalOpen(false);
                  handleOpenEdit(toEdit);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #0F766E',
                  background: '#F0FDFA',
                  color: '#0F766E',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Edit Attribute
              </button>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ATTRIBUTE MODAL ─────────────────────────────── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#FFFFFF',
              borderRadius: 8,
              boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
              border: '1px solid #CBD5E1',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
                  {editingAttr ? 'Edit Attribute' : 'Add Attribute'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  {editingAttr ? 'Modify existing attribute definition' : 'Create new attribute in ATTRIBUTE_MASTER'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form: ONLY ATTRIBUTE_MASTER fields */}
            <form onSubmit={handleSave} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{
                  padding: '8px 12px',
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 6,
                  color: '#B91C1C',
                  fontSize: 12.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. ATTRIBUTE CODE * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Attribute Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STORAGE_TEMP, SHELF_LIFE, MATERIAL_GRADE"
                  value={formData.attributeCode}
                  onChange={e => setFormData({ ...formData, attributeCode: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 2. ATTRIBUTE NAME * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Attribute Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Storage Temperature, Shelf Life, Material Grade"
                  value={formData.attributeName}
                  onChange={e => {
                    const name = e.target.value;
                    const autoCode = name.toUpperCase().trim().replace(/[^A-Z0-9]/g, '_');
                    setFormData({
                      ...formData,
                      attributeName: name,
                      attributeCode: editingAttr ? formData.attributeCode : autoCode
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 3. DATA TYPE * */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Data Type *
                </label>
                <select
                  value={formData.dataType}
                  onChange={e => setFormData({ ...formData, dataType: e.target.value as AttributeDataType })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    background: '#FFFFFF',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  {DATA_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* 4. UNIT OF MEASURE */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Unit of Measure
                </label>
                <input
                  type="text"
                  placeholder="e.g. °C, Months, mg, %, pcs"
                  value={formData.unitOfMeasure}
                  onChange={e => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 5. REMARK */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Remark
                </label>
                <input
                  type="text"
                  placeholder="Enter remark / description for this attribute"
                  value={formData.remark}
                  onChange={e => setFormData({ ...formData, remark: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 6, 7, 8, 9. Checkboxes: IS FILTERABLE, IS SEARCHABLE, IS REQUIRED, IS ACTIVE */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                padding: '12px',
                background: '#F8FAFC',
                borderRadius: 6,
                border: '1px solid #E2E8F0'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isFilterable}
                    onChange={e => setFormData({ ...formData, isFilterable: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Filterable</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isSearchable}
                    onChange={e => setFormData({ ...formData, isSearchable: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Searchable</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={e => setFormData({ ...formData, isRequired: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Required</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#0F766E' }}
                  />
                  <span>Is Active</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                paddingTop: 10,
                borderTop: '1px solid #E2E8F0'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Attribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
