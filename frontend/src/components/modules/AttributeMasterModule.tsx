import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AttributeMaster, AttributeDataType } from '../../types';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';
import {
  Search, Plus, Edit3, Power, Eye, X, Check, AlertCircle, Sparkles, Layers, Trash2, Sliders
} from 'lucide-react';

const DATA_TYPES: AttributeDataType[] = ['TEXT', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'DATE', 'LIST'];

export const AttributeMasterModule: React.FC = () => {
  const {
    attributeMasters,
    addAttributeMaster,
    updateAttributeMaster,
    toggleAttributeMasterStatus,
    addAuditLog,
    productTypes,
    productTypeAttributes,
    addProductTypeAttribute,
    removeProductTypeAttribute,
    updateProductTypeAttribute
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Type Assignment state (for View Modal)
  const [assignPtId, setAssignPtId] = useState('');
  const [assignIsRequired, setAssignIsRequired] = useState(false);
  const [assignDisplayOrder, setAssignDisplayOrder] = useState(1);
  const [assignRemark, setAssignRemark] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isAssigningPt, setIsAssigningPt] = useState(false);

  // Helper: Get product types assigned to a given attribute
  const getAssignedProductTypes = (attrId: string) => {
    return (productTypeAttributes || []).filter(pta => (pta.attribute_id || pta.attributeId) === attrId);
  };

  // Assign attribute to Product Type
  const handleAssignToProductType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAttr || !assignPtId) {
      setAssignError('Please select a Product Type.');
      return;
    }
    setIsAssigningPt(true);
    setAssignError(null);
    const targetAttrId = viewingAttr.attribute_id || viewingAttr.id!;
    try {
      const res = await addProductTypeAttribute({
        product_type_id: assignPtId,
        attribute_id: targetAttrId,
        is_required: assignIsRequired,
        display_order: Number(assignDisplayOrder) || 1,
        remark: assignRemark.trim() || undefined,
        lifecycle_status: 'ACTIVE'
      });
      if (res.success) {
        setAssignPtId('');
        setAssignIsRequired(false);
        setAssignDisplayOrder(1);
        setAssignRemark('');
        addAuditLog('ASSIGN_ATTRIBUTE_PT', `Assigned attribute ${viewingAttr.attribute_name} to Product Type ${assignPtId}`);
      } else {
        setAssignError(res.error || 'Failed to assign attribute to Product Type.');
      }
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign attribute.');
    } finally {
      setIsAssigningPt(false);
    }
  };

  // Remove attribute from Product Type
  const handleRemoveFromProductType = async (ptId: string, attrId: string) => {
    if (!confirm('Are you sure you want to remove this attribute from the Product Type?')) return;
    try {
      const res = await removeProductTypeAttribute(ptId, attrId);
      if (res.success) {
        addAuditLog('REMOVE_ATTRIBUTE_PT', `Removed attribute ${attrId} from Product Type ${ptId}`);
      } else {
        alert(res.error || 'Failed to remove attribute.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove attribute.');
    }
  };

  // Toggle required status for an attribute in a Product Type
  const handleTogglePtRequired = async (ptId: string, attrId: string, currentVal: boolean) => {
    try {
      await updateProductTypeAttribute(ptId, attrId, {
        is_required: !currentVal,
        isRequired: !currentVal
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update requirement setting.');
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    attributeCode: '',
    attributeName: '',
    dataType: 'TEXT' as AttributeDataType,
    unitOfMeasure: '',
    remark: '',
    allowedValues: [] as string[],
    newAllowedValueInput: '',
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
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary stable sort on id DESC
      const timeA = new Date(a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.createdAt || b.created_at || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      const idA = String(a.attribute_id || a.id || '');
      const idB = String(b.attribute_id || b.id || '');
      return idB.localeCompare(idA);
    });
  }, [attributeMasters, searchTerm, selectedDataType, statusFilter]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredAttributes.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, selectedDataType, statusFilter]
  });
  const paginatedAttributes = pagination.paginateItems(filteredAttributes);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingAttr(null);
    setFormData({
      attributeCode: '',
      attributeName: '',
      dataType: 'TEXT',
      unitOfMeasure: '',
      remark: '',
      allowedValues: [],
      newAllowedValueInput: '',
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
      allowedValues: attr.allowed_values || attr.allowedValues || [],
      newAllowedValueInput: '',
      isFilterable: attr.is_filterable ?? true,
      isSearchable: attr.is_searchable ?? true,
      isRequired: attr.is_required ?? false,
      isActive: attr.is_active ?? true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Add / Remove Allowed Value Chips
  const handleAddAllowedValue = () => {
    const val = formData.newAllowedValueInput.trim();
    if (!val) return;
    if (formData.allowedValues.includes(val)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      allowedValues: [...prev.allowedValues, val],
      newAllowedValueInput: ''
    }));
  };

  const handleRemoveAllowedValue = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      allowedValues: prev.allowedValues.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Open View Modal
  const handleOpenView = (attr: AttributeMaster) => {
    setViewingAttr(attr);
    setIsViewModalOpen(true);
  };

  // Save Modal (Add / Edit) - Database Backed
  const handleSave = async (e: React.FormEvent) => {
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
    if (formData.dataType === 'LIST' && formData.allowedValues.length === 0) {
      setFormError('LIST data type requires at least one Allowed Value option.');
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

    setIsSubmitting(true);
    setFormError(null);
    const nowIso = new Date().toISOString();

    try {
      if (editingAttr) {
        const targetId = editingAttr.attribute_id || editingAttr.id!;
        await updateAttributeMaster(targetId, {
          attribute_name: cleanName,
          name: cleanName,
          attribute_code: cleanCode,
          code: cleanCode,
          data_type: formData.dataType,
          dataType: formData.dataType,
          unit_of_measure: formData.unitOfMeasure.trim() || undefined,
          remark: formData.remark.trim() || undefined,
          allowed_values: formData.dataType === 'LIST' ? formData.allowedValues : undefined,
          allowedValues: formData.dataType === 'LIST' ? formData.allowedValues : undefined,
          is_filterable: formData.isFilterable,
          is_searchable: formData.isSearchable,
          is_required: formData.isRequired,
          is_active: formData.isActive,
          updated_at: nowIso
        });
        addAuditLog('UPDATE_ATTRIBUTE_MASTER', `Updated attribute master ${cleanName} (${cleanCode}) in database`);
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
          allowed_values: formData.dataType === 'LIST' ? formData.allowedValues : undefined,
          allowedValues: formData.dataType === 'LIST' ? formData.allowedValues : undefined,
          is_filterable: formData.isFilterable,
          is_searchable: formData.isSearchable,
          is_required: formData.isRequired,
          is_active: formData.isActive,
          created_at: nowIso,
          updated_at: nowIso
        };
        await addAttributeMaster(newAttr);
        addAuditLog('CREATE_ATTRIBUTE_MASTER', `Created attribute master ${cleanName} (${cleanCode}) in database`);
        pagination.resetPage();
      }

      setIsModalOpen(false);
      setEditingAttr(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save attribute in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status in database
  const handleToggleStatus = async (attr: AttributeMaster) => {
    try {
      const targetId = attr.attribute_id || attr.id!;
      const nextStatus = !attr.is_active;
      await toggleAttributeMasterStatus(targetId);
      addAuditLog('TOGGLE_ATTRIBUTE_STATUS', `Toggled attribute ${attr.attribute_name} to ${nextStatus ? 'ACTIVE' : 'INACTIVE'} in database`);
    } catch (err: any) {
      alert(`Failed to toggle attribute status: ${err.message || 'Unknown database error'}`);
    }
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
              <th style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 170 }}>
                Attribute Code
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', minWidth: 170 }}>
                Attribute Name
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 100 }}>
                Data Type
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 120 }}>
                Unit of Measure
              </th>
              <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', minWidth: 210 }}>
                Applicable Product Types
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 85 }}>
                Filterable
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 90 }}>
                Searchable
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 80 }}>
                Required
              </th>
              <th style={{ padding: '10px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', width: 90 }}>
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
                <td colSpan={10} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748B' }}>
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
              paginatedAttributes.map(attr => {
                const code = attr.attribute_code || attr.code || '';
                const name = attr.attribute_name || attr.name || '';
                const uom = attr.unit_of_measure || '—';
                const isActive = attr.is_active;
                const assignedPts = getAssignedProductTypes(attr.attribute_id || attr.id!);

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

                    {/* 5. Applicable Product Types */}
                    <td style={{ padding: '10px 12px' }}>
                      {assignedPts.length === 0 ? (
                        <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {assignedPts.map(pta => {
                            const pId = pta.product_type_id || pta.productTypeId;
                            const pt = (productTypes || []).find(p => (p.product_type_id || p.id) === pId);
                            const ptName = pt?.product_type_name || pt?.name || pId;
                            const isReq = pta.is_required || pta.isRequired;

                            return (
                              <span
                                key={pta.product_type_attribute_id || `${pId}-${pta.attribute_id}`}
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#F0FDFA',
                                  color: '#0F766E',
                                  border: '1px solid #CCFBF1',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                                title={`${ptName} - ${isReq ? 'Mandatory' : 'Optional'}`}
                              >
                                <span>{ptName}</span>
                                {isReq && <span style={{ color: '#DC2626', fontWeight: 900 }}>*</span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
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
      <PaginationControl {...pagination.paginationProps} itemName="attributes" />

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
              maxWidth: 680,
              maxHeight: '90vh',
              background: '#FFFFFF',
              borderRadius: 8,
              boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.12)',
              border: '1px solid #CBD5E1',
              overflowY: 'auto',
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
                  ATTRIBUTE_MASTER record & Product Type associations
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

            {/* Modal Body: Displays ATTRIBUTE_MASTER fields and Product Type associations */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
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

                {viewingAttr.data_type === 'LIST' && (
                  <div style={{ background: '#F8FAFC', padding: '10px 12px', borderRadius: 6, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 6 }}>
                      Allowed Values (Predefined Dropdown Options)
                    </div>
                    {((viewingAttr.allowed_values || viewingAttr.allowedValues || []).length > 0) ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(viewingAttr.allowed_values || viewingAttr.allowedValues || []).map((val, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              border: '1px solid #BAE6FD',
                              padding: '2px 8px',
                              borderRadius: 4
                            }}
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                        No predefined list options
                      </span>
                    )}
                  </div>
                )}

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

              {/* ── PRODUCT TYPE ASSOCIATIONS (Client Requirement Section 3) ── */}
              {(() => {
                const viewingId = viewingAttr.attribute_id || viewingAttr.id!;
                const assignedPtsForView = getAssignedProductTypes(viewingId);
                const assignedPtIds = assignedPtsForView.map(a => a.product_type_id || a.productTypeId);
                const availablePtsForView = (productTypes || []).filter(p => !assignedPtIds.includes(p.product_type_id || p.id));

                return (
                  <div style={{
                    marginTop: 6,
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={15} style={{ color: '#0F766E' }} />
                          <span>Product Type Associations ({assignedPtsForView.length})</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Configure which Product Types this reusable attribute applies to (with independent required and display order settings).
                        </div>
                      </div>
                    </div>

                    {/* Table of assigned Product Types */}
                    {assignedPtsForView.length === 0 ? (
                      <div style={{
                        padding: '14px',
                        background: '#FFFFFF',
                        border: '1px dashed #CBD5E1',
                        borderRadius: 6,
                        textAlign: 'center',
                        fontSize: 12,
                        color: '#64748B'
                      }}>
                        Not currently assigned to any Product Type. Use the form below to assign it.
                      </div>
                    ) : (
                      <div style={{ background: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                          <thead>
                            <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                              <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569' }}>PRODUCT TYPE</th>
                              <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: 80 }}>ORDER</th>
                              <th style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'center', width: 120 }}>REQUIRED?</th>
                              <th style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#475569', textAlign: 'right', width: 80 }}>ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedPtsForView.map(pta => {
                              const pId = pta.product_type_id || pta.productTypeId;
                              const pt = (productTypes || []).find(p => (p.product_type_id || p.id) === pId);
                              const ptName = pt?.product_type_name || pt?.name || pId;
                              const isReq = pta.is_required || pta.isRequired;

                              return (
                                <tr key={pta.product_type_attribute_id || `${pId}-${pta.attribute_id}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0F172A' }}>
                                    {ptName} ({pId})
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: '#475569' }}>
                                    #{pta.display_order ?? 1}
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePtRequired(pId, viewingId, isReq)}
                                      title="Click to toggle Mandatory vs Optional"
                                      style={{
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        border: isReq ? '1px solid #FCA5A5' : '1px solid #CBD5E1',
                                        background: isReq ? '#FEF2F2' : '#F8FAFC',
                                        color: isReq ? '#DC2626' : '#64748B',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {isReq ? '★ REQUIRED' : 'OPTIONAL'}
                                    </button>
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFromProductType(pId, viewingId)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        background: '#FFFFFF',
                                        color: '#DC2626',
                                        border: '1px solid #FCA5A5',
                                        cursor: 'pointer'
                                      }}
                                      title="Remove from Product Type"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Inline Assign to Product Type Form */}
                    {availablePtsForView.length > 0 && (
                      <form onSubmit={handleAssignToProductType} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: '10px 12px',
                        background: '#FFFFFF',
                        borderRadius: 6,
                        border: '1px solid #CBD5E1'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
                          + Assign to Another Product Type
                        </div>

                        {assignError && (
                          <div style={{ color: '#B91C1C', fontSize: 11.5, fontWeight: 600 }}>
                            {assignError}
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <select
                            required
                            value={assignPtId}
                            onChange={e => {
                              setAssignPtId(e.target.value);
                              setAssignError(null);
                            }}
                            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                          >
                            <option value="">[ Select Product Type ▼ ]</option>
                            {availablePtsForView.map(pt => (
                              <option key={pt.product_type_id || pt.id} value={pt.product_type_id || pt.id}>
                                {pt.product_type_name || pt.name} ({pt.product_type_id || pt.id})
                              </option>
                            ))}
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, cursor: 'pointer', color: '#334155', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={assignIsRequired}
                              onChange={e => setAssignIsRequired(e.target.checked)}
                              style={{ accentColor: '#0F766E' }}
                            />
                            Required?
                          </label>

                          <input
                            type="number"
                            min={1}
                            placeholder="Order"
                            value={assignDisplayOrder}
                            onChange={e => setAssignDisplayOrder(parseInt(e.target.value) || 1)}
                            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12, width: '100%', boxSizing: 'border-box' }}
                          />

                          <button
                            type="submit"
                            disabled={isAssigningPt || !assignPtId}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: 'none',
                              background: !assignPtId ? '#94A3B8' : '#0F766E',
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: !assignPtId ? 'not-allowed' : 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isAssigningPt ? 'Assigning...' : '+ Assign'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()}
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

              {/* LIST Type: Allowed Values Chips Manager */}
              {formData.dataType === 'LIST' && (
                <div style={{
                  padding: 12,
                  background: '#F0FDFA',
                  border: '1px solid #99F6E4',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase' }}>
                      Allowed Values (Predefined Dropdown Options) *
                    </label>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {formData.allowedValues.length} option{formData.allowedValues.length === 1 ? '' : 's'} added
                    </span>
                  </div>

                  {/* Input for adding new allowed value */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      placeholder="e.g. Amber Glass Bottle, Strip, Blister Pack"
                      value={formData.newAllowedValueInput}
                      onChange={e => setFormData({ ...formData, newAllowedValueInput: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllowedValue();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        fontSize: 12.5,
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAllowedValue}
                      style={{
                        padding: '7px 14px',
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Add Option
                    </button>
                  </div>

                  {/* Chips container */}
                  {formData.allowedValues.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto', paddingTop: 4 }}>
                      {formData.allowedValues.map((val, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '3px 8px',
                            background: '#FFFFFF',
                            border: '1px solid #0F766E',
                            borderRadius: 4,
                            color: '#0F766E',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          {val}
                          <button
                            type="button"
                            onClick={() => handleRemoveAllowedValue(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#DC2626',
                              cursor: 'pointer',
                              padding: 0,
                              lineHeight: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic' }}>
                      Press Enter or click "Add Option" to add permitted dropdown values for this LIST attribute.
                    </div>
                  )}
                </div>
              )}

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
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSubmitting ? '#94A3B8' : '#0F766E',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'wait' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Attribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
