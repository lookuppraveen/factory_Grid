import React, { useState, useMemo } from 'react';
import { Layers, X, AlertTriangle, CheckCircle2, Search, Building2, Package, Check } from 'lucide-react';
import { catalogApi } from '../../../services/catalogApi';
import { Product, Manufacturer } from '../../../types';

export interface AdminMapProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  manufacturers: Manufacturer[];
  preSelectedProduct?: Product | null;
}

export const AdminMapProductModal: React.FC<AdminMapProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  manufacturers,
  preSelectedProduct = null,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preSelectedProduct?.product_id || preSelectedProduct?.id || ''
  );
  const [selectedMfgId, setSelectedMfgId] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [mfgSearch, setMfgSearch] = useState('');

  const [formData, setFormData] = useState({
    manufacturerProductCode: '',
    manufacturerPartNumber: '',
    manufacturerSku: '',
    moq: 1000,
    leadTimeDays: 14,
    packaging: '10 x 10 Strip',
    isPreferred: false,
    lifecycleStatus: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active products list
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      const code = (p.product_code || p.code || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const q = productSearch.toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [products, productSearch]);

  // Active manufacturers list
  const filteredMfgs = useMemo(() => {
    return (manufacturers || []).filter((m) => {
      const name = (m.companyName || m.name || m.manufacturer_name || '').toLowerCase();
      const code = (m.code || m.manufacturer_code || '').toLowerCase();
      const q = mfgSearch.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [manufacturers, mfgSearch]);

  const selectedProduct = useMemo(() => {
    return (products || []).find((p) => p.id === selectedProductId || p.product_id === selectedProductId);
  }, [products, selectedProductId]);

  const selectedMfg = useMemo(() => {
    return (manufacturers || []).find((m) => m.id === selectedMfgId || m.manufacturer_id === selectedMfgId);
  }, [manufacturers, selectedMfgId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Please select a Master Product to map.');
      return;
    }
    if (!selectedMfgId) {
      setErrorMessage('Please select a Verified Manufacturer.');
      return;
    }
    if (!formData.packaging.trim()) {
      setErrorMessage('Packaging details are required.');
      return;
    }

    const prdCode = selectedProduct?.product_code || selectedProduct?.code || 'PRD';
    const mfgCode = selectedMfg?.code || selectedMfg?.manufacturer_code || 'MFG';
    const finalMfgProductCode = formData.manufacturerProductCode.trim() || `${mfgCode}-${prdCode}`;

    setIsSubmitting(true);
    try {
      await catalogApi.createMapping({
        product_id: selectedProductId,
        productId: selectedProductId,
        manufacturer_id: selectedMfgId,
        manufacturerId: selectedMfgId,
        manufacturer_product_code: finalMfgProductCode,
        mfgProductCode: finalMfgProductCode,
        manufacturer_part_number: formData.manufacturerPartNumber.trim() || undefined,
        manufacturer_sku: formData.manufacturerSku.trim() || undefined,
        moq: Number(formData.moq) || 1000,
        standardLeadTimeDays: Number(formData.leadTimeDays) || 14,
        packaging: formData.packaging.trim(),
        is_preferred: formData.isPreferred,
        isPreferred: formData.isPreferred,
        lifecycle_status: formData.lifecycleStatus,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create manufacturer mapping:', err);
      setErrorMessage(err?.message || 'Could not save product-manufacturer mapping.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: 16,
          padding: 26,
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid #E2E8F0', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#F0FDFA',
              border: '1px solid #99F6E4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E'
            }}>
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Map Master Product to Manufacturer
              </h2>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Assign an authorized manufacturing facility to supply a canonical catalogue product
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. SELECT CENTRAL MASTER PRODUCT */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              1. Master Product *
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', background: '#F8FAFC' }}>
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, width: '100%' }}
                />
              </div>
            </div>
            <select
              required
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find(x => x.id === e.target.value || x.product_id === e.target.value);
                if (p) {
                  setFormData(prev => ({
                    ...prev,
                    packaging: p.packSize || p.pack_size || prev.packaging,
                  }));
                }
              }}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0F766E', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none', background: '#F0FDFA', color: '#0F766E' }}
            >
              <option value="" disabled>-- Select a Canonical Product ({filteredProducts.length} available) --</option>
              {filteredProducts.map((p) => (
                <option key={p.id || p.product_id} value={p.id || p.product_id}>
                  {p.product_code || p.code} — {p.name} ({p.category || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. SELECT VERIFIED MANUFACTURER */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              2. Manufacturing Facility *
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, border: '1px solid #CBD5E1', borderRadius: 6, padding: '6px 10px', background: '#F8FAFC' }}>
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Filter manufacturers..."
                  value={mfgSearch}
                  onChange={(e) => setMfgSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, width: '100%' }}
                />
              </div>
            </div>
            <select
              required
              value={selectedMfgId}
              onChange={(e) => setSelectedMfgId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600, outline: 'none', background: '#FFFFFF' }}
            >
              <option value="" disabled>-- Select Verified Facility ({filteredMfgs.length} available) --</option>
              {filteredMfgs.map((m) => (
                <option key={m.id || m.manufacturer_id} value={m.id || m.manufacturer_id}>
                  {m.companyName || m.name || m.manufacturer_name} ({m.code || m.manufacturer_code || 'MFG'})
                </option>
              ))}
            </select>
          </div>

          {/* 3. COMMERCIAL & SUPPLY TERMS */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', color: '#0F766E', marginBottom: 12 }}>
              3. Commercial & Supply Terms
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Manufacturer SKU / Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. APEX-AMX-500"
                  value={formData.manufacturerProductCode}
                  onChange={(e) => setFormData({ ...formData, manufacturerProductCode: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Packaging Configuration *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 x 10 Strip / Alu-Alu"
                  value={formData.packaging}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Minimum Order Quantity (MOQ) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: Number(e.target.value) || 1000 })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Production Lead Time (Days) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) || 14 })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPreferred}
                  onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                  style={{ accentColor: '#0F766E', width: 16, height: 16 }}
                />
                Designate as Primary / Preferred Supplier for this SKU
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Status:</span>
                <select
                  value={formData.lifecycleStatus}
                  onChange={(e) => setFormData({ ...formData, lifecycleStatus: e.target.value as any })}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600 }}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#0F766E',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 1px 3px rgba(15,118,110,0.3)'
              }}
            >
              {isSubmitting ? 'Saving to Database...' : 'Save Product Mapping'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

