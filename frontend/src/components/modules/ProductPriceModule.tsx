import React, { useState, useMemo } from 'react';
import {
  Tag, Search, Plus, Filter, Edit2, Trash2, X, AlertTriangle,
  Package, Factory, Users, DollarSign, Calendar, Eye, Power,
  Clock, Hash, ArrowRight, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductPrice } from '../../types';

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
    addAuditLog,
    currentRole,
    productTypes,
    unifiedCategories
  } = useApp();

  const canEdit = currentRole === 'ADMIN' || true; // ensure administrative pricing actions

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // View Details Modal State
  const [selectedPriceForDetail, setSelectedPriceForDetail] = useState<ProductPrice | null>(null);

  // Hierarchy Selection Context for Modal (Selection context only - NOT stored in PRODUCT_PRICE)
  const [modalProductTypeId, setModalProductTypeId] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalSubCategory, setModalSubCategory] = useState<string>('');
  const [modalSubSubCategory, setModalSubSubCategory] = useState<string>('');

  const [formData, setFormData] = useState({
    product_id: '',
    product_manufacturer_id: '' as string | null,
    customer_segment_id: '',
    price_type: 'FIXED' as 'FIXED' | 'TIERED' | 'CONTRACT' | 'LIST',
    currency: 'INR',
    unit_price: 10,
    minimum_quantity: 100,
    maximum_quantity: '' as number | string,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    price_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DRAFT'
  });

  // Available Categories in Modal (Filtered by selected Product Type)
  const modalCategories = useMemo(() => {
    if (!modalProductTypeId) return [];
    const catSet = new Set<string>();
    (unifiedCategories || []).forEach(c => {
      if (
        c.product_type_id === modalProductTypeId &&
        (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active') &&
        c.category
      ) {
        catSet.add(c.category);
      }
    });
    return Array.from(catSet).sort();
  }, [unifiedCategories, modalProductTypeId]);

  // Available Sub-Categories in Modal (Filtered by selected Product Type & Category)
  const modalSubCategories = useMemo(() => {
    if (!modalProductTypeId || !modalCategory) return [];
    const subSet = new Set<string>();
    (unifiedCategories || []).forEach(c => {
      if (
        c.product_type_id === modalProductTypeId &&
        c.category === modalCategory &&
        (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active') &&
        c.sub_category
      ) {
        subSet.add(c.sub_category);
      }
    });
    return Array.from(subSet).sort();
  }, [unifiedCategories, modalProductTypeId, modalCategory]);

  // Available Sub-Sub-Categories in Modal (Filtered by Product Type, Category, and Sub-Category)
  const modalSubSubCategories = useMemo(() => {
    if (!modalProductTypeId || !modalCategory || !modalSubCategory) return [];
    const subSubSet = new Set<string>();
    (unifiedCategories || []).forEach(c => {
      if (
        c.product_type_id === modalProductTypeId &&
        c.category === modalCategory &&
        c.sub_category === modalSubCategory &&
        (c.lifecycle_status === 'ACTIVE' || (c as any).status === 'Active') &&
        c.sub_sub_category
      ) {
        subSubSet.add(c.sub_sub_category);
      }
    });
    return Array.from(subSubSet).sort();
  }, [unifiedCategories, modalProductTypeId, modalCategory, modalSubCategory]);

  // Available Products in Modal (Filtered by selected Product Type, Category, Sub-Category, and Sub-Sub-Category)
  const modalAvailableProducts = useMemo(() => {
    if (!modalProductTypeId || !modalCategory) return [];
    if (modalSubCategories.length > 0 && !modalSubCategory) return [];
    if (modalSubSubCategories.length > 0 && !modalSubSubCategory) return [];

    return (products || []).filter(p => {
      const catRecord = (unifiedCategories || []).find(c =>
        c.category_id === (p.category_id || p.categoryId) ||
        c.id === (p.category_id || p.categoryId)
      );

      // Verify Product Type
      const prdPtId = p.product_type_id || p.productTypeId || catRecord?.product_type_id;
      if (prdPtId && prdPtId !== modalProductTypeId) return false;

      // Verify Category
      const prdCat = catRecord?.category || p.category;
      if (prdCat && prdCat !== modalCategory) return false;

      // Verify Sub-Category
      if (modalSubCategory) {
        const prdSub = catRecord?.sub_category || p.subCategory || (p as any).sub_category;
        if (prdSub && prdSub !== modalSubCategory) return false;
      }

      // Verify Sub-Sub-Category
      if (modalSubSubCategory) {
        const prdSubSub = catRecord?.sub_sub_category || p.subSubCategory || (p as any).sub_sub_category;
        if (prdSubSub && prdSubSub !== modalSubSubCategory) return false;
      }

      return true;
    });
  }, [products, unifiedCategories, modalProductTypeId, modalCategory, modalSubCategory, modalSubSubCategory, modalSubCategories.length, modalSubSubCategories.length]);

  // Mapped manufacturers for the selected product in modal
  const modalAvailableMappings = useMemo(() => {
    if (!formData.product_id) return [];
    return (mappings || []).filter(m => m.productId === formData.product_id || m.product_id === formData.product_id);
  }, [mappings, formData.product_id]);

  // Resolvers
  const getProductRecord = (pid: string) => {
    return (products || []).find(p => p.id === pid || p.product_id === pid || p.code === pid);
  };

  const getProductDetails = (productId: string) => {
    const prd = getProductRecord(productId);
    const catRecord = (unifiedCategories || []).find(c =>
      c.category_id === (prd?.category_id || prd?.categoryId) ||
      c.id === (prd?.category_id || prd?.categoryId)
    );

    const ptId = prd?.product_type_id || prd?.productTypeId || catRecord?.product_type_id;
    const pt = (productTypes || []).find(t => t.product_type_id === ptId || t.id === ptId);
    const ptName = pt?.product_type_name || pt?.name || ptId || '—';

    const catName = catRecord?.category || prd?.category || '—';
    const subCatName = catRecord?.sub_category || prd?.subCategory || (prd as any)?.sub_category || '—';
    const subSubCatName = catRecord?.sub_sub_category || prd?.subSubCategory || (prd as any)?.sub_sub_category || '—';

    return {
      prd,
      productName: prd?.product_name || prd?.name || productId,
      productCode: prd?.product_code || prd?.code || productId,
      productId: prd?.product_id || prd?.id || productId,
      productTypeName: ptName,
      categoryName: catName,
      subCategoryName: subCatName,
      subSubCategoryName: subSubCatName
    };
  };

  const getManufacturerMappingDetails = (pmId?: string | null) => {
    if (!pmId) return null;
    const map = (mappings || []).find(m =>
      m.product_manufacturer_id === pmId ||
      m.id === pmId ||
      m.manufacturer_id === pmId ||
      m.manufacturerId === pmId
    );
    const mfg = (manufacturers || []).find(m =>
      m.manufacturer_id === (map?.manufacturer_id || map?.manufacturerId || pmId) ||
      m.id === (map?.manufacturer_id || map?.manufacturerId || pmId)
    );
    return {
      map,
      manufacturerName: mfg?.manufacturer_name || mfg?.companyName || mfg?.name || map?.manufacturer_name || map?.manufacturerName || pmId,
      manufacturerCode: mfg?.manufacturer_code || (mfg as any)?.code || map?.manufacturer_code || map?.manufacturerCode || '',
      mfgProductCode: map?.manufacturer_product_code || map?.mfgProductCode || '',
      pmId
    };
  };

  const getSegmentDetails = (segmentId: string) => {
    const seg = (customerSegments || []).find(s =>
      s.customer_segment_id === segmentId || s.id === segmentId
    );
    return {
      seg,
      segmentName: seg?.segment_name || seg?.name || segmentId,
      segmentCode: seg?.segment_code || seg?.code || ''
    };
  };

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    const st = (status || 'ACTIVE').toUpperCase();
    switch (st) {
      case 'ACTIVE':
        return { label: 'ACTIVE', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' };
      case 'INACTIVE':
        return { label: 'INACTIVE', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' };
      case 'EXPIRED':
        return { label: 'EXPIRED', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' };
      case 'DRAFT':
        return { label: 'DRAFT', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' };
      default:
        return { label: st, bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' };
    }
  };

  // KPI Stats
  const stats = useMemo(() => {
    const total = (productPrices || []).length;
    const active = (productPrices || []).filter(p => (p.price_status || (p as any).status || 'ACTIVE') === 'ACTIVE').length;
    const uniqueProducts = new Set((productPrices || []).map(p => p.product_id || (p as any).productId)).size;
    const uniqueSegments = new Set((productPrices || []).map(p => p.customer_segment_id || (p as any).customerSegmentId)).size;
    return { total, active, uniqueProducts, uniqueSegments };
  }, [productPrices]);

  // Filtered List
  const filteredPrices = useMemo(() => {
    return (productPrices || []).filter(prc => {
      const q = searchTerm.toLowerCase().trim();
      const prd = getProductRecord(prc.product_id || (prc as any).productId || '');
      const prdName = (prd?.product_name || prd?.name || '').toLowerCase();
      const prdCode = (prd?.product_code || prd?.code || '').toLowerCase();
      const prdId = (prd?.product_id || prd?.id || prc.product_id || '').toLowerCase();
      const segInfo = getSegmentDetails(prc.customer_segment_id || (prc as any).customerSegmentId || '');
      const segName = segInfo.segmentName.toLowerCase();
      const segCode = segInfo.segmentCode.toLowerCase();
      const priceId = (prc.product_price_id || (prc as any).id || '').toLowerCase();

      const matchesSearch =
        q === '' ||
        priceId.includes(q) ||
        prdName.includes(q) ||
        prdCode.includes(q) ||
        prdId.includes(q) ||
        segName.includes(q) ||
        segCode.includes(q);

      const matchesPrd = selectedProductId === 'ALL' || (prc.product_id || (prc as any).productId) === selectedProductId;
      const matchesSeg = selectedSegmentId === 'ALL' || (prc.customer_segment_id || (prc as any).customerSegmentId) === selectedSegmentId;
      const statusVal = prc.price_status || (prc as any).status || 'ACTIVE';
      const matchesStatus = selectedStatus === 'ALL' || statusVal === selectedStatus;

      return matchesSearch && matchesPrd && matchesSeg && matchesStatus;
    });
  }, [productPrices, products, customerSegments, searchTerm, selectedProductId, selectedSegmentId, selectedStatus]);

  // Handlers
  const handleOpenAddModal = (defaultProductId?: string) => {
    setEditingPriceId(null);
    setEditingCreatedAt(null);
    const firstSeg = customerSegments[0]?.customer_segment_id || customerSegments[0]?.id || '';

    if (defaultProductId) {
      const prd = getProductRecord(defaultProductId);
      const catRecord = (unifiedCategories || []).find(c =>
        c.category_id === (prd?.category_id || prd?.categoryId) ||
        c.id === (prd?.category_id || prd?.categoryId)
      );
      setModalProductTypeId(prd?.product_type_id || prd?.productTypeId || catRecord?.product_type_id || '');
      setModalCategory(catRecord?.category || prd?.category || '');
      setModalSubCategory(catRecord?.sub_category || prd?.subCategory || (prd as any)?.sub_category || '');
      setModalSubSubCategory(catRecord?.sub_sub_category || prd?.subSubCategory || (prd as any)?.sub_sub_category || '');
      setFormData({
        product_id: defaultProductId,
        product_manufacturer_id: null,
        customer_segment_id: firstSeg,
        price_type: 'FIXED',
        currency: 'INR',
        unit_price: 15.00,
        minimum_quantity: 100,
        maximum_quantity: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        price_status: 'ACTIVE'
      });
    } else {
      setModalProductTypeId('');
      setModalCategory('');
      setModalSubCategory('');
      setModalSubSubCategory('');
      setFormData({
        product_id: '',
        product_manufacturer_id: null,
        customer_segment_id: firstSeg,
        price_type: 'FIXED',
        currency: 'INR',
        unit_price: 15.00,
        minimum_quantity: 100,
        maximum_quantity: '',
        effective_from: new Date().toISOString().split('T')[0],
        effective_to: '',
        price_status: 'ACTIVE'
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prc: ProductPrice) => {
    const priceId = prc.product_price_id || prc.id || '';
    setEditingPriceId(priceId);
    setEditingCreatedAt(prc.created_at || '2025-01-01');

    const pId = prc.product_id || (prc as any).productId || '';
    const prd = getProductRecord(pId);
    const catRecord = (unifiedCategories || []).find(c =>
      c.category_id === (prd?.category_id || prd?.categoryId) ||
      c.id === (prd?.category_id || prd?.categoryId)
    );

    const ptId = prd?.product_type_id || prd?.productTypeId || catRecord?.product_type_id || (productTypes[0]?.product_type_id || '');
    const catName = catRecord?.category || prd?.category || '';
    const subCatName = catRecord?.sub_category || prd?.subCategory || (prd as any)?.sub_category || '';
    const subSubCatName = catRecord?.sub_sub_category || prd?.subSubCategory || (prd as any)?.sub_sub_category || '';

    setModalProductTypeId(ptId);
    setModalCategory(catName);
    setModalSubCategory(subCatName);
    setModalSubSubCategory(subSubCatName);

    setFormData({
      product_id: pId,
      product_manufacturer_id: prc.product_manufacturer_id || (prc as any).productManufacturerId || null,
      customer_segment_id: prc.customer_segment_id || (prc as any).customerSegmentId || '',
      price_type: prc.price_type || 'FIXED',
      currency: prc.currency || 'INR',
      unit_price: prc.unit_price ?? (prc as any).unitPrice ?? 0,
      minimum_quantity: prc.minimum_quantity ?? (prc as any).minQuantity ?? 1,
      maximum_quantity: prc.maximum_quantity ?? (prc as any).maxQuantity ?? '',
      effective_from: prc.effective_from || (prc as any).effectiveFrom || '2025-01-01',
      effective_to: prc.effective_to || (prc as any).effectiveTo || '',
      price_status: (prc.price_status || (prc as any).status || 'ACTIVE') as any
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (prc: ProductPrice) => {
    setSelectedPriceForDetail(prc);
  };

  const handleToggleStatus = (prc: ProductPrice) => {
    const priceId = prc.product_price_id || prc.id || '';
    const current = (prc.price_status || (prc as any).status || 'ACTIVE').toUpperCase();
    const nextStatus = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const nowIso = new Date().toISOString().split('T')[0];

    updateProductPrice(priceId, {
      price_status: nextStatus as any,
      status: nextStatus,
      updated_at: nowIso
    });

    addAuditLog('TOGGLE_PRODUCT_PRICE_STATUS', `Toggled price status for record ${priceId} to ${nextStatus}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!modalProductTypeId) {
      setFormError('Product Type is mandatory.');
      return;
    }
    if (!modalCategory) {
      setFormError('Category is mandatory.');
      return;
    }
    if (modalSubCategories.length > 0 && !modalSubCategory) {
      setFormError('Sub-Category is mandatory for the selected category.');
      return;
    }
    if (modalSubSubCategories.length > 0 && !modalSubSubCategory) {
      setFormError('Sub-Sub-Category is mandatory for the selected sub-category.');
      return;
    }
    if (!formData.product_id) {
      setFormError('Product is mandatory.');
      return;
    }
    if (!formData.customer_segment_id) {
      setFormError('Customer Segment is mandatory.');
      return;
    }
    if (!formData.price_type) {
      setFormError('Price Type is mandatory.');
      return;
    }
    if (!formData.currency) {
      setFormError('Currency is mandatory.');
      return;
    }
    if (formData.unit_price <= 0) {
      setFormError('Unit Price must be greater than 0.');
      return;
    }
    if (formData.minimum_quantity < 1) {
      setFormError('Minimum Quantity must be at least 1.');
      return;
    }
    if (!formData.effective_from) {
      setFormError('Effective From date is mandatory.');
      return;
    }
    if (formData.effectiveFrom && formData.effective_to && formData.effective_to < formData.effective_from) {
      setFormError('Effective To date cannot be earlier than Effective From date.');
      return;
    }
    if (!formData.price_status) {
      setFormError('Price Status is mandatory.');
      return;
    }

    // Validate that the product belongs to the selected hierarchy
    const selectedPrd = getProductRecord(formData.product_id);
    if (!selectedPrd) {
      setFormError('Selected Product is invalid.');
      return;
    }

    // Validate Product Manufacturer if selected
    if (formData.product_manufacturer_id) {
      const isValidMfg = modalAvailableMappings.some(m =>
        m.product_manufacturer_id === formData.product_manufacturer_id ||
        m.id === formData.product_manufacturer_id ||
        m.manufacturer_id === formData.product_manufacturer_id ||
        m.manufacturerId === formData.product_manufacturer_id
      );
      if (!isValidMfg) {
        setFormError('Selected Product Manufacturer is not mapped to this product.');
        return;
      }
    }

    const nowIso = new Date().toISOString().split('T')[0];
    const maxQtyNum = formData.maximum_quantity ? Number(formData.maximum_quantity) : null;

    if (editingPriceId) {
      updateProductPrice(editingPriceId, {
        product_id: formData.product_id,
        product_manufacturer_id: formData.product_manufacturer_id || null,
        customer_segment_id: formData.customer_segment_id,
        price_type: formData.price_type,
        currency: formData.currency,
        unit_price: Number(formData.unit_price),
        minimum_quantity: Number(formData.minimum_quantity),
        maximum_quantity: maxQtyNum,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        price_status: formData.price_status,
        updated_at: nowIso,
        // compatibility aliases
        productId: formData.product_id,
        unitPrice: Number(formData.unit_price),
        minQuantity: Number(formData.minimum_quantity),
        maxQuantity: maxQtyNum,
        status: formData.price_status
      });
      addAuditLog('UPDATE_PRODUCT_PRICE', `Updated price record ${editingPriceId} for product ${formData.product_id}`);
    } else {
      const newPriceId = `prc_${Date.now()}`;
      const newPrice: ProductPrice = {
        product_price_id: newPriceId,
        product_id: formData.product_id,
        product_manufacturer_id: formData.product_manufacturer_id || null,
        customer_segment_id: formData.customer_segment_id,
        price_type: formData.price_type,
        currency: formData.currency,
        unit_price: Number(formData.unit_price),
        minimum_quantity: Number(formData.minimum_quantity),
        maximum_quantity: maxQtyNum,
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || null,
        price_status: formData.price_status,
        created_at: nowIso,
        updated_at: nowIso,
        // compatibility aliases
        id: newPriceId,
        productId: formData.product_id,
        unitPrice: Number(formData.unit_price),
        minQuantity: Number(formData.minimum_quantity),
        maxQuantity: maxQtyNum,
        status: formData.price_status
      };
      addProductPrice(newPrice);
      addAuditLog('ADD_PRODUCT_PRICE', `Created new price record ${newPriceId} for product ${formData.product_id}`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (prc: ProductPrice) => {
    const id = prc.product_price_id || prc.id || '';
    if (window.confirm('Are you sure you want to remove this product price record?\n\nThis removes the price rule only. The product and customer segment records remain unaffected.')) {
      removeProductPrice(id);
      addAuditLog('DELETE_PRODUCT_PRICE', `Removed product price record ${id}`);
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
            <Tag size={26} style={{ color: '#0F766E' }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0F766E' }}>
              PRICING &amp; COMMERCIAL MANAGEMENT · ENTITY: PRODUCT_PRICE
            </div>
            <h1 style={{ margin: '2px 0 0 0', fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Product Price Management
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
              Segment-specific, tiered, and manufacturer-linked commercial pricing rules mapped directly to approved client data model.
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
            <Plus size={16} /> Add Product Price
          </button>
        )}
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Price Rules</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.total}</div>
          <div style={{ fontSize: 11.5, color: '#0F766E', marginTop: 2, fontWeight: 600 }}>PRODUCT_PRICE records</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Prices</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#15803D', marginTop: 4 }}>{stats.active}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Commercial rates in effect</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Products Priced</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F766E', marginTop: 4 }}>{stats.uniqueProducts}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Unique central catalog products</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Segments Covered</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>{stats.uniqueSegments}</div>
          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>Customer segment channels</div>
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
              placeholder="Search by price ID, product name/code/ID, customer segment..."
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
                maxWidth: 220
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

          {/* Filter by Customer Segment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Segment:</span>
            <select
              value={selectedSegmentId}
              onChange={e => setSelectedSegmentId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 12.5,
                background: selectedSegmentId !== 'ALL' ? '#F0FDFA' : '#FFFFFF',
                border: selectedSegmentId !== 'ALL' ? '1.5px solid #0F766E' : '1px solid #CBD5E1',
                borderRadius: 6,
                color: '#0F172A',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Customer Segments ({(customerSegments || []).length})</option>
              {(customerSegments || []).map(s => (
                <option key={s.customer_segment_id || s.id} value={s.customer_segment_id || s.id}>
                  {s.segment_name || s.name} ({s.segment_code || s.code})
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
              <option value="EXPIRED">EXPIRED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>

          {(searchTerm || selectedProductId !== 'ALL' || selectedSegmentId !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedProductId('ALL');
                setSelectedSegmentId('ALL');
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
            Entity Schema: <code>PRODUCT_PRICE</code> (product_id, product_manufacturer_id, customer_segment_id, price_type, currency, unit_price, min_qty, max_qty, effective_from/to, price_status, created_at, updated_at)
          </div>
          <div>
            Showing <strong style={{ color: '#0F766E' }}>{filteredPrices.length}</strong> of {productPrices.length} price rules
          </div>
        </div>
      </div>

      {/* ── PRODUCT_PRICE Table ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1680, borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 190 }}>
                PRODUCT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                PRODUCT ID
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 180 }}>
                PRODUCT MANUFACTURER
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', minWidth: 160 }}>
                CUSTOMER SEGMENT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                PRICE TYPE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 85 }}>
                CURRENCY
              </th>
              <th style={{ padding: '12px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0F766E', width: 120 }}>
                UNIT PRICE
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>
                MIN QTY
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 95 }}>
                MAX QTY
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                EFFECTIVE FROM
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                EFFECTIVE TO
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                PRICE STATUS
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                CREATED AT
              </th>
              <th style={{ padding: '12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', width: 110 }}>
                UPDATED AT
              </th>
              <th style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', textAlign: 'right', width: 160 }}>
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPrices.length === 0 ? (
              <tr>
                <td colSpan={15} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                  <Tag size={36} style={{ color: '#94A3B8', display: 'block', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No product price records found.</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 18 }}>
                    Create commercial price rules for catalog products across target customer segments.
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenAddModal()}
                      style={{ padding: '9px 18px', borderRadius: 8, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    >
                      + Add Product Price
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredPrices.map(prc => {
                const prodDetails = getProductDetails(prc.product_id || (prc as any).productId || '');
                const segDetails = getSegmentDetails(prc.customer_segment_id || (prc as any).customerSegmentId || '');
                const mfgDetails = getManufacturerMappingDetails(prc.product_manufacturer_id || (prc as any).productManufacturerId);

                const priceId = prc.product_price_id || prc.id || '—';
                const status = prc.price_status || (prc as any).status || 'ACTIVE';
                const badge = getStatusBadge(status);
                const unitPriceNum = prc.unit_price ?? (prc as any).unitPrice ?? 0;
                const minQty = prc.minimum_quantity ?? (prc as any).minQuantity ?? 1;
                const maxQty = prc.maximum_quantity ?? (prc as any).maxQuantity ?? null;
                const effFrom = prc.effective_from || (prc as any).effectiveFrom || '—';
                const effTo = prc.effective_to || (prc as any).effectiveTo || '—';
                const createdAt = prc.created_at || '—';
                const updatedAt = prc.updated_at || '—';

                return (
                  <tr
                    key={priceId}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                  >
                    {/* 1. PRODUCT */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                        {prodDetails.productName}
                      </div>
                      <div style={{ fontSize: 11, color: '#0F766E', fontFamily: 'monospace', marginTop: 1, fontWeight: 700 }}>
                        {prodDetails.productCode}
                      </div>
                    </td>

                    {/* 2. PRODUCT ID */}
                    <td style={{ padding: '12px 10px', fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {prodDetails.productId}
                    </td>

                    {/* 3. PRODUCT MANUFACTURER */}
                    <td style={{ padding: '12px 12px' }}>
                      {mfgDetails ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0F172A', fontWeight: 700, fontSize: 12.5 }}>
                            <Factory size={13} style={{ color: '#0F766E', flexShrink: 0 }} />
                            <span>{mfgDetails.manufacturerName}</span>
                          </div>
                          {mfgDetails.mfgProductCode && (
                            <div style={{ fontSize: 10.5, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                              {mfgDetails.mfgProductCode}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 11.5, fontStyle: 'italic' }}>
                          All Manufacturers (Global)
                        </span>
                      )}
                    </td>

                    {/* 4. CUSTOMER SEGMENT */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {segDetails.segmentName}
                      </div>
                      {segDetails.segmentCode && (
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                          {segDetails.segmentCode}
                        </div>
                      )}
                    </td>

                    {/* 5. PRICE TYPE */}
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 7px',
                        borderRadius: 4,
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE'
                      }}>
                        {prc.price_type}
                      </span>
                    </td>

                    {/* 6. CURRENCY */}
                    <td style={{ padding: '12px 10px', fontSize: 12.5, fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                      {prc.currency || 'INR'}
                    </td>

                    {/* 7. UNIT PRICE */}
                    <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 900, color: '#0F766E', whiteSpace: 'nowrap' }}>
                      ₹{unitPriceNum.toFixed(2)}
                    </td>

                    {/* 8. MINIMUM QUANTITY */}
                    <td style={{ padding: '12px 10px', fontSize: 12.5, color: '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {minQty}
                    </td>

                    {/* 9. MAXIMUM QUANTITY */}
                    <td style={{ padding: '12px 10px', fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {maxQty !== null && maxQty !== '' ? maxQty : '—'}
                    </td>

                    {/* 10. EFFECTIVE FROM */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effFrom}
                    </td>

                    {/* 11. EFFECTIVE TO */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {effTo}
                    </td>

                    {/* 12. PRICE STATUS */}
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

                    {/* 13. CREATED AT */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {createdAt}
                    </td>

                    {/* 14. UPDATED AT */}
                    <td style={{ padding: '12px 10px', fontSize: 11.5, color: '#64748B', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {updatedAt}
                    </td>

                    {/* 15. ACTIONS */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(prc)}
                          title="View Complete Price Details"
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
                              onClick={() => handleOpenEditModal(prc)}
                              title="Edit Price Record"
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
                              onClick={() => handleToggleStatus(prc)}
                              title={status === 'ACTIVE' ? 'Deactivate Price' : 'Activate Price'}
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
                              onClick={() => handleDelete(prc)}
                              title="Remove Price Record"
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
      {selectedPriceForDetail && (() => {
        const detail = selectedPriceForDetail;
        const prodDetails = getProductDetails(detail.product_id || (detail as any).productId || '');
        const segDetails = getSegmentDetails(detail.customer_segment_id || (detail as any).customerSegmentId || '');
        const mfgDetails = getManufacturerMappingDetails(detail.product_manufacturer_id || (detail as any).productManufacturerId);
        const priceId = detail.product_price_id || detail.id || '—';
        const status = detail.price_status || (detail as any).status || 'ACTIVE';
        const badge = getStatusBadge(status);
        const unitPriceNum = detail.unit_price ?? (detail as any).unitPrice ?? 0;

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
            onClick={() => setSelectedPriceForDetail(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 720,
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
                    ENTITY RECORD · PRODUCT_PRICE
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
                    Product Price Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPriceForDetail(null)}
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
                      Primary Key (product_price_id)
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#134E4A', fontFamily: 'monospace', marginTop: 2 }}>
                      {priceId}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F766E' }}>
                      ₹{unitPriceNum.toFixed(2)} {detail.currency || 'INR'}
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

                {/* Section 1: UI Contextual Hierarchy (UI Context only - not columns of PRODUCT_PRICE) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Contextual Product Hierarchy (UI Resolution Context)
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>
                      Resolved from catalog mapping
                    </span>
                  </div>
                  <div style={{ background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: '#E2E8F0', color: '#1E293B', fontWeight: 700 }}>
                        {prodDetails.productTypeName}
                      </span>
                      <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: '#E2E8F0', color: '#1E293B' }}>
                        {prodDetails.categoryName}
                      </span>
                      {prodDetails.subCategoryName !== '—' && (
                        <>
                          <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                          <span style={{ padding: '3px 8px', borderRadius: 4, background: '#E2E8F0', color: '#1E293B' }}>
                            {prodDetails.subCategoryName}
                          </span>
                        </>
                      )}
                      {prodDetails.subSubCategoryName !== '—' && (
                        <>
                          <ChevronRight size={14} style={{ color: '#94A3B8' }} />
                          <span style={{ padding: '3px 8px', borderRadius: 4, background: '#CCFBF1', color: '#0F766E', fontWeight: 700 }}>
                            {prodDetails.subSubCategoryName}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Product Name</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{prodDetails.productName}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Product ID (FK → PRODUCT)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>{prodDetails.productId}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Relationship Mapping Entities */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    2. Linked Customer Segment &amp; Product Manufacturer
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {/* Customer Segment Box */}
                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1D4ED8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        <Users size={14} /> Customer Segment (FK → CUSTOMER_SEGMENT)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                        {segDetails.segmentName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #CBD5E1', fontSize: 11.5 }}>
                        <span style={{ color: '#64748B' }}>Customer Segment ID:</span>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>{detail.customer_segment_id || (detail as any).customerSegmentId}</span>
                      </div>
                    </div>

                    {/* Product Manufacturer Box */}
                    <div style={{ padding: '14px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F766E', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        <Factory size={14} /> Product Manufacturer (FK → PRODUCT_MANUFACTURER)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                        {mfgDetails ? mfgDetails.manufacturerName : 'All Manufacturers / Global'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #CBD5E1', fontSize: 11.5 }}>
                        <span style={{ color: '#64748B' }}>Manufacturer Mapping ID:</span>
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F766E' }}>
                          {detail.product_manufacturer_id || (detail as any).productManufacturerId || 'NULL (Global)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Commercial Terms */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    3. Commercial Pricing Terms
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Price Type</div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>
                        {detail.price_type}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Currency</div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                        {detail.currency || 'INR'}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Minimum Quantity</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                        {detail.minimum_quantity ?? (detail as any).minQuantity ?? 1}
                      </div>
                    </div>

                    <div style={{ padding: '12px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Maximum Quantity</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#64748B', marginTop: 4 }}>
                        {detail.maximum_quantity ?? (detail as any).maxQuantity ?? '— (No Limit)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Validity & Audit */}
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    4. Validity Dates &amp; Audit Metadata
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
                      const toEdit = selectedPriceForDetail;
                      setSelectedPriceForDetail(null);
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
                    <Edit2 size={14} /> Edit Product Price
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPriceForDetail(null)}
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

      {/* ── ADD / EDIT PRODUCT PRICE MODAL ───────────────────────── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 660, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0F766E' }}>
                  ENTITY: PRODUCT_PRICE
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {editingPriceId ? 'Edit Product Price' : 'Add Product Price'}
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

            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Read-Only Info Banner when Editing */}
              {editingPriceId && (
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Product Price ID</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                      {editingPriceId}
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

              {/* ────────────────────────────────────────────────────────── */}
              {/* SECTION: PRODUCT SELECTION (Cascading UI Hierarchy)       */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Package size={15} /> Product Selection (Hierarchy Flow)
                </div>

                {/* 1. Product Type * */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    1. Product Type *
                  </label>
                  <select
                    required
                    value={modalProductTypeId}
                    onChange={e => {
                      const newPtId = e.target.value;
                      // Cascading reset
                      setModalProductTypeId(newPtId);
                      setModalCategory('');
                      setModalSubCategory('');
                      setModalSubSubCategory('');
                      setFormData(prev => ({
                        ...prev,
                        product_id: '',
                        product_manufacturer_id: null
                      }));
                    }}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
                  >
                    <option value="" disabled>-- Select Product Type * --</option>
                    {(productTypes || []).filter(t => (t.lifecycle_status || t.status) === 'ACTIVE').map(t => (
                      <option key={t.product_type_id || t.id} value={t.product_type_id || t.id}>
                        {t.product_type_name || t.name} ({t.product_type_code || t.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Category * */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    2. Category *
                  </label>
                  <select
                    required
                    disabled={!modalProductTypeId}
                    value={modalCategory}
                    onChange={e => {
                      const newCat = e.target.value;
                      // Cascading reset
                      setModalCategory(newCat);
                      setModalSubCategory('');
                      setModalSubSubCategory('');
                      setFormData(prev => ({
                        ...prev,
                        product_id: '',
                        product_manufacturer_id: null
                      }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      background: !modalProductTypeId ? '#F1F5F9' : '#FFFFFF',
                      color: !modalProductTypeId ? '#94A3B8' : '#0F172A',
                      cursor: !modalProductTypeId ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" disabled>
                      {!modalProductTypeId ? '-- Select Product Type First --' : '-- Select Category * --'}
                    </option>
                    {modalCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Sub-Category & 4. Sub-Sub-Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {/* 3. Sub-Category */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      3. Sub-Category {modalSubCategories.length > 0 ? <span style={{ color: '#0F766E' }}>*</span> : <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>}
                    </label>
                    <select
                      disabled={!modalCategory || modalSubCategories.length === 0}
                      value={modalSubCategory}
                      onChange={e => {
                        const newSubCat = e.target.value;
                        // Cascading reset
                        setModalSubCategory(newSubCat);
                        setModalSubSubCategory('');
                        setFormData(prev => ({
                          ...prev,
                          product_id: '',
                          product_manufacturer_id: null
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        background: (!modalCategory || modalSubCategories.length === 0) ? '#F1F5F9' : '#FFFFFF',
                        color: (!modalCategory || modalSubCategories.length === 0) ? '#94A3B8' : '#0F172A',
                        cursor: (!modalCategory || modalSubCategories.length === 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="" disabled={modalSubCategories.length > 0}>
                        {!modalCategory
                          ? '-- Select Category First --'
                          : modalSubCategories.length === 0
                          ? '-- No Sub-Categories (Direct) --'
                          : '-- Select Sub-Category --'}
                      </option>
                      {modalSubCategories.map(subCat => (
                        <option key={subCat} value={subCat}>{subCat}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Sub-Sub-Category */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      4. Sub-Sub-Category {modalSubSubCategories.length > 0 ? <span style={{ color: '#0F766E' }}>*</span> : <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional)</span>}
                    </label>
                    <select
                      disabled={!modalSubCategory || modalSubSubCategories.length === 0}
                      value={modalSubSubCategory}
                      onChange={e => {
                        const newSubSub = e.target.value;
                        // Cascading reset
                        setModalSubSubCategory(newSubSub);
                        setFormData(prev => ({
                          ...prev,
                          product_id: '',
                          product_manufacturer_id: null
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        background: (!modalSubCategory || modalSubSubCategories.length === 0) ? '#F1F5F9' : '#FFFFFF',
                        color: (!modalSubCategory || modalSubSubCategories.length === 0) ? '#94A3B8' : '#0F172A',
                        cursor: (!modalSubCategory || modalSubSubCategories.length === 0) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="" disabled={modalSubSubCategories.length > 0}>
                        {!modalSubCategory
                          ? '-- Select Sub-Category First --'
                          : modalSubSubCategories.length === 0
                          ? '-- No Sub-Sub-Categories --'
                          : '-- Select Sub-Sub-Category --'}
                      </option>
                      {modalSubSubCategories.map(subSub => (
                        <option key={subSub} value={subSub}>{subSub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Product * */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    5. Product * (Resolves to product_id)
                  </label>
                  <select
                    required
                    disabled={!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory) || (modalSubSubCategories.length > 0 && !modalSubSubCategory)}
                    value={formData.product_id}
                    onChange={e => {
                      // Cascading refresh for manufacturer
                      setFormData(prev => ({ ...prev, product_id: e.target.value, product_manufacturer_id: null }));
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      background: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory) || (modalSubSubCategories.length > 0 && !modalSubSubCategory)) ? '#F1F5F9' : '#FFFFFF',
                      color: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory) || (modalSubSubCategories.length > 0 && !modalSubSubCategory)) ? '#94A3B8' : '#0F172A',
                      cursor: (!modalProductTypeId || !modalCategory || (modalSubCategories.length > 0 && !modalSubCategory) || (modalSubSubCategories.length > 0 && !modalSubSubCategory)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" disabled>
                      {!modalProductTypeId
                        ? '-- Select Product Type First --'
                        : !modalCategory
                        ? '-- Select Category First --'
                        : (modalSubCategories.length > 0 && !modalSubCategory)
                        ? '-- Select Sub-Category First --'
                        : (modalSubSubCategories.length > 0 && !modalSubSubCategory)
                        ? '-- Select Sub-Sub-Category First --'
                        : modalAvailableProducts.length === 0
                        ? '-- No Products Found in Selected Hierarchy --'
                        : '-- Select Product * --'}
                    </option>
                    {modalAvailableProducts.map(p => (
                      <option key={p.id || p.product_id} value={p.id || p.product_id}>
                        {p.product_code || p.code} · {p.product_name || p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Product Manufacturer (Optional / nullable) */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    6. Product Manufacturer <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional / Nullable → product_manufacturer_id)</span>
                  </label>
                  <select
                    disabled={!formData.product_id}
                    value={formData.product_manufacturer_id || ''}
                    onChange={e => setFormData(prev => ({ ...prev, product_manufacturer_id: e.target.value || null }))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      fontSize: 13,
                      background: !formData.product_id ? '#F1F5F9' : '#FFFFFF',
                      color: !formData.product_id ? '#94A3B8' : '#0F172A',
                      cursor: !formData.product_id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="">-- All Manufacturers / Global Product Price (NULL) --</option>
                    {modalAvailableMappings.map(m => (
                      <option key={m.product_manufacturer_id || (m as any).id} value={m.product_manufacturer_id || (m as any).id}>
                        {m.manufacturer_name || m.manufacturerName} ({m.manufacturer_product_code || m.mfgProductCode || 'Mapped'})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: '#64748B', marginTop: 3, display: 'block' }}>
                    Leave unselected for global catalog pricing across all approved manufacturers.
                  </span>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* SECTION: PRICING DETAILS                                  */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <DollarSign size={15} /> Commercial Pricing Details
                </div>

                {/* 7. Customer Segment * & 8. Price Type * */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      7. Customer Segment * (customer_segment_id)
                    </label>
                    <select
                      required
                      value={formData.customer_segment_id}
                      onChange={e => setFormData({ ...formData, customer_segment_id: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, background: '#F0FDFA', color: '#0F766E' }}
                    >
                      <option value="" disabled>-- Select Customer Segment * --</option>
                      {(customerSegments || []).map(s => (
                        <option key={s.customer_segment_id || s.id} value={s.customer_segment_id || s.id}>
                          {s.segment_name || s.name} ({s.segment_code || s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      8. Price Type * (price_type)
                    </label>
                    <select
                      required
                      value={formData.price_type}
                      onChange={e => setFormData({ ...formData, price_type: e.target.value as any })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF' }}
                    >
                      <option value="FIXED">FIXED</option>
                      <option value="TIERED">TIERED</option>
                      <option value="CONTRACT">CONTRACT</option>
                      <option value="LIST">LIST</option>
                    </select>
                  </div>
                </div>

                {/* 9. Currency * & 10. Unit Price * */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      9. Currency * (currency)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 700, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      10. Unit Price * (unit_price)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.unit_price}
                      onChange={e => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 800, color: '#0F766E', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* 11. Minimum Quantity * & 12. Maximum Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      11. Minimum Quantity * (minimum_quantity)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.minimum_quantity}
                      onChange={e => setFormData({ ...formData, minimum_quantity: parseInt(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      12. Maximum Quantity <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional → maximum_quantity)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Leave blank for unlimited"
                      value={formData.maximum_quantity}
                      onChange={e => setFormData({ ...formData, maximum_quantity: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* SECTION: VALIDITY & STATUS                                */}
              {/* ────────────────────────────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar size={15} /> Validity &amp; Lifecycle Status
                </div>

                {/* 13. Effective From * & 14. Effective To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      13. Effective From * (effective_from)
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.effective_from}
                      onChange={e => setFormData({ ...formData, effective_from: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                      14. Effective To <span style={{ fontWeight: 400, color: '#94A3B8' }}>(Optional → effective_to)</span>
                    </label>
                    <input
                      type="date"
                      value={formData.effective_to}
                      onChange={e => setFormData({ ...formData, effective_to: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                {/* 15. Price Status * */}
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    15. Price Status * (price_status)
                  </label>
                  <select
                    required
                    value={formData.price_status}
                    onChange={e => setFormData({ ...formData, price_status: e.target.value as any })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#0F766E', background: '#F0FDFA' }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </div>

              {/* Modal Buttons */}
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
                  style={{ padding: '9px 22px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,118,110,0.2)' }}
                >
                  {editingPriceId ? 'Update Product Price' : 'Save Product Price'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
