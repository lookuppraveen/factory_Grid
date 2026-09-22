import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceLine, Customer, PaymentRecord } from '../../types';
import {
  Receipt, CheckCircle2, Clock, AlertCircle, X, Banknote,
  Search, Plus, Check, Upload, FileText, Edit2, Eye,
  Trash2, Image as ImageIcon, ChevronRight, ArrowLeft,
  Printer, Package, ArrowRight, Save, DollarSign, FileCheck,
  Building2, UserCheck, Shield, History, Send, Download, CreditCard
} from 'lucide-react';
import { initiateRazorpayCheckout, verifyRazorpaySignature } from '../../services/razorpayService';

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface InitialInvoiceContextData {
  orderNumber?: string;
  subOrderNumber?: string;
  customerName?: string;
  manufacturerName?: string;
  productName?: string;
  totalQuantity?: number;
  orderValue?: number;
  unitPrice?: number;
}

interface EditableInvoiceLine {
  id: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

interface EditFormState {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  orderNumber: string;
  subOrderNumber: string;
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerCity: string;
  manufacturerState: string;
  manufacturerCountry: string;
  manufacturerPincode: string;
  manufacturerGstin: string;
  manufacturerPan: string;
  manufacturerLicense: string;
  manufacturerPhone: string;
  manufacturerEmail: string;
  manufacturerWebsite: string;
  logoDataUrl: string;
  selectedCustomerId: string;
  customerName: string;
  customerCode: string;
  customerAddress: string;
  consigneeAddress: string;
  customerGstin: string;
  customerPan: string;
  customerPhone: string;
  customerEmail: string;
  lines: EditableInvoiceLine[];
  taxType: 'CGST_SGST' | 'IGST';
  freightAmount: number;
  currency: string;
  creationMethod: 'TEXT' | 'UPLOAD';
  uploadedFileName: string;
  uploadedFileType: string;
  uploadedFileSize: string;
  uploadedFileUrl: string;
}

interface InvoiceModuleProps {
  initialViewMode?: 'LIST' | 'WORKSPACE' | 'DETAILS';
  initialData?: InitialInvoiceContextData;
  onComplete?: (createdInvoice: Invoice) => void;
  onCancel?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCurrencySymbol = (curr?: string) => {
  if (!curr) return '₹';
  const c = curr.toUpperCase();
  if (c === 'GBP' || c === '£') return '£';
  if (c === 'USD' || c === '$') return '$';
  if (c === 'EUR' || c === '€') return '€';
  return '₹';
};

const computeLineTotal = (line: EditableInvoiceLine) => {
  const gross = line.quantity * line.unitPrice;
  const discAmt = gross * (line.discountPercent / 100);
  const taxable = gross - discAmt;
  const taxAmt = taxable * (line.taxPercent / 100);
  return { taxable, taxAmt, total: taxable + taxAmt };
};

const computeTotals = (lines: EditableInvoiceLine[], freightAmount: number, taxType: 'CGST_SGST' | 'IGST') => {
  let subtotal = 0;
  let totalTax = 0;
  lines.forEach(l => {
    const { taxable, taxAmt } = computeLineTotal(l);
    subtotal += taxable;
    totalTax += taxAmt;
  });
  const grand = subtotal + totalTax + freightAmount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    cgst: taxType === 'CGST_SGST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
    sgst: taxType === 'CGST_SGST' ? Math.round((totalTax / 2) * 100) / 100 : 0,
    igst: taxType === 'IGST' ? Math.round(totalTax * 100) / 100 : 0,
    grand: Math.round(grand * 100) / 100,
  };
};

const blankLine = (): EditableInvoiceLine => ({
  id: 'il_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
  productName: '',
  hsnCode: '30049099',
  quantity: 1000,
  unitPrice: 12.00,
  discountPercent: 0,
  taxPercent: 12,
});

const defaultEditForm = (invoiceCount: number, orgProfile?: any, initialData?: InitialInvoiceContextData): EditFormState => {
  const qty = initialData?.totalQuantity || 12000;
  const val = initialData?.orderValue || 195300;
  const unitP = initialData?.unitPrice || (val && qty ? Math.round((val / qty) * 100) / 100 : 16.28);

  return {
    invoiceNumber: `INV-2026-${4400 + invoiceCount + 1}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTerms: 'Net 30 days from invoice date',
    orderNumber: initialData?.orderNumber || 'MO-2026-1001',
    subOrderNumber: initialData?.subOrderNumber || `SO-2026-1001-0${(invoiceCount % 9) + 1}`,
    manufacturerName: initialData?.manufacturerName || orgProfile?.companyName || 'SunBio LifeSciences Ltd',
    manufacturerAddress: orgProfile?.registeredAddress || 'Plot 42-45, Export Promotion Industrial Park, Phase I',
    manufacturerCity: orgProfile?.city || 'Baddi',
    manufacturerState: orgProfile?.state || 'Himachal Pradesh',
    manufacturerCountry: orgProfile?.country || 'India',
    manufacturerPincode: orgProfile?.pincode || '173205',
    manufacturerGstin: orgProfile?.gstin || '02AAACS1234F1Z9',
    manufacturerPan: orgProfile?.pan || 'AAACS1234F',
    manufacturerLicense: orgProfile?.mfgLicenseNo || 'ML-HP-2024-001',
    manufacturerPhone: orgProfile?.contactPhone || '+91 1795 244100',
    manufacturerEmail: orgProfile?.contactEmail || 'billing@sunbiolabs.com',
    manufacturerWebsite: orgProfile?.website || 'https://www.sunbiolabs.com',
    logoDataUrl: '',
    selectedCustomerId: '',
    customerName: initialData?.customerName || 'Apex Pharma PCD Franchise',
    customerCode: 'CUS-2026-001',
    customerAddress: 'Unit 12, Industrial Estate, Andheri East, Mumbai, MH - 400069',
    consigneeAddress: 'Warehouse 4, EPIP Central Zone, Naroda, Ahmedabad, GJ - 382330',
    customerGstin: '27AAABM1234A1Z5',
    customerPan: 'AAABM1234A',
    customerPhone: '+91 98250 11223',
    customerEmail: 'accounts@apexpharma.com',
    lines: [{
      id: 'il_new_1',
      productName: initialData?.productName || 'Paracetamol 500mg & Azithromycin 500mg Tablets',
      hsnCode: '30049099',
      quantity: qty,
      unitPrice: unitP,
      discountPercent: 0,
      taxPercent: 12,
    }],
    taxType: 'CGST_SGST',
    freightAmount: 0,
    currency: 'INR',
    creationMethod: 'UPLOAD',
    uploadedFileName: '',
    uploadedFileType: 'PDF Document',
    uploadedFileSize: '',
    uploadedFileUrl: '',
  };
};

const invoiceToEditForm = (inv: Invoice): EditFormState => {
  const lines: EditableInvoiceLine[] = (inv.lines || []).map(l => ({
    id: l.id,
    productName: l.productName,
    hsnCode: l.hsnCode,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    discountPercent: l.discountPercent ?? 0,
    taxPercent: l.taxPercent ?? 12,
  }));
  if (lines.length === 0) lines.push(blankLine());
  return {
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    paymentTerms: inv.paymentTerms || 'Net 30 days from invoice date',
    orderNumber: inv.orderNumber,
    subOrderNumber: inv.subOrderNumber || '',
    manufacturerName: inv.manufacturerName || 'SunBio LifeSciences Ltd',
    manufacturerAddress: inv.manufacturerAddress || 'Plot 42-45, EPIP Phase I',
    manufacturerCity: 'Baddi',
    manufacturerState: 'Himachal Pradesh',
    manufacturerCountry: 'India',
    manufacturerPincode: '173205',
    manufacturerGstin: inv.manufacturerGstin || '02AAACS1234F1Z9',
    manufacturerPan: inv.manufacturerPan || 'AAACS1234F',
    manufacturerLicense: inv.manufacturerLicense || 'ML-HP-2024-001',
    manufacturerPhone: '+91 1795 244100',
    manufacturerEmail: 'billing@sunbiolabs.com',
    manufacturerWebsite: 'https://www.sunbiolabs.com',
    logoDataUrl: inv.logoDataUrl || '',
    selectedCustomerId: inv.customerId || '',
    customerName: inv.customerName,
    customerCode: inv.customerCode || 'CUS001',
    customerAddress: inv.customerAddress || 'Unit 12, Industrial Estate, Mumbai, MH - 400069',
    consigneeAddress: inv.customerAddress || 'Unit 12, Industrial Estate, Mumbai, MH - 400069',
    customerGstin: inv.customerGstin || '27AAABM1234A1Z5',
    customerPan: inv.customerPan || 'AAABM1234A',
    customerPhone: '+91 98250 11223',
    customerEmail: 'accounts@apexpharma.com',
    lines,
    taxType: (inv.igst && inv.igst > 0) ? 'IGST' : 'CGST_SGST',
    freightAmount: inv.freightAmount || 0,
    currency: inv.currency || 'INR',
    creationMethod: inv.creationMethod || 'UPLOAD',
    uploadedFileName: inv.uploadedFileName || '',
    uploadedFileType: 'PDF Document',
    uploadedFileSize: inv.uploadedFileSize || '1.2 MB',
    uploadedFileUrl: inv.uploadedFileUrl || '',
  };
};

// ─── Status Chip Component ────────────────────────────────────────────────────

const StatusChip: React.FC<{ inv: Invoice }> = ({ inv }) => {
  const paid = Math.round((inv.paidAmount || 0) * 100) / 100;
  const total = Math.round((inv.totalAmount || 0) * 100) / 100;
  const bal = typeof inv.balanceAmount === 'number'
    ? Math.round(inv.balanceAmount * 100) / 100
    : Math.max(0, Math.round((total - paid) * 100) / 100);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = inv.status === 'OVERDUE' || (inv.dueDate && inv.dueDate < today && bal > 0);

  const hasPdf = Boolean(inv.uploadedFileUrl || inv.uploadedFileName);

  if (bal <= 0 && total > 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
        <Check size={12} /> PAID
      </span>
    );
  }
  if (paid > 0 && bal > 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #93C5FD' }}>
        <Clock size={12} /> PARTIALLY PAID
      </span>
    );
  }
  if (!hasPdf) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D' }}>
        <Clock size={12} /> AWAITING INVOICE PDF
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>
        <AlertCircle size={12} /> OVERDUE
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
      <FileCheck size={12} /> INVOICE UPLOADED
    </span>
  );
};

// ─── Right-Side Live Invoice Preview Document ──────────────────────────────────

const LiveInvoicePreviewDocument: React.FC<{ form: EditFormState; paidAmount?: number }> = ({ form, paidAmount = 0 }) => {
  const totals = computeTotals(form.lines, form.freightAmount, form.taxType);
  const sym = getCurrencySymbol(form.currency);
  const bal = Math.max(0, totals.grand - paidAmount);

  if (form.uploadedFileUrl) {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} style={{ color: '#0F766E' }} /> Invoice Preview — {form.uploadedFileName || `${form.invoiceNumber}.pdf`}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Official B2B Tax Invoice (Uploaded PDF)
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
            ✓ Uploaded PDF
          </span>
        </div>
        <iframe
          src={form.uploadedFileUrl}
          title="Invoice PDF Preview"
          style={{ width: '100%', height: 650, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF' }}
        />
      </div>
    );
  }

  const getStatusLabel = () => {
    if (bal === 0 && totals.grand > 0) return { label: 'PAID', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC' };
    if (paidAmount > 0 && bal > 0) return { label: 'PARTIALLY PAID', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' };
    return { label: 'TAX INVOICE', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' };
  };
  const statusInfo = getStatusLabel();

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 24, boxShadow: '0 4px 16px rgba(15,23,42,0.08)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0F172A', paddingBottom: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {form.logoDataUrl ? (
            <img src={form.logoDataUrl} alt="Logo" style={{ height: 50, maxWidth: 110, objectFit: 'contain', borderRadius: 6, border: '1px solid #E2E8F0' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800, fontSize: 16 }}>
              FG
            </div>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>{form.manufacturerName || 'Manufacturer Name'}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              {[form.manufacturerAddress, form.manufacturerCity, form.manufacturerState, form.manufacturerPincode].filter(Boolean).join(', ')}
            </div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 1 }}>
              GSTIN: <strong>{form.manufacturerGstin || '—'}</strong> | PAN: <strong>{form.manufacturerPan || '—'}</strong>
            </div>
            {form.manufacturerLicense && (
              <div style={{ fontSize: 10.5, color: '#475569' }}>Mfg Lic: <strong>{form.manufacturerLicense}</strong></div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB', letterSpacing: '-0.02em' }}>TAX INVOICE</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{form.invoiceNumber}</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 10.5, fontWeight: 800, background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.border}` }}>
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, fontSize: 11.5, marginBottom: 16 }}>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Invoice Date</span>
          <strong style={{ color: '#0F172A' }}>{form.invoiceDate || '—'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Due Date</span>
          <strong style={{ color: '#DC2626' }}>{form.dueDate || '—'}</strong>
        </div>
        <div>
          <span style={{ color: '#64748B', display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Payment Terms</span>
          <strong style={{ color: '#0F172A' }}>{form.paymentTerms || 'Net 30 Days'}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 11.5 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', marginBottom: 4 }}>Billed & Shipped To</div>
          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13 }}>{form.customerName || 'Select Customer'}</div>
          <div style={{ color: '#475569', marginTop: 2, lineHeight: 1.4 }}>{form.customerAddress || '—'}</div>
          <div style={{ color: '#475569', marginTop: 4 }}>GSTIN: <strong>{form.customerGstin || '—'}</strong></div>
          <div style={{ color: '#475569' }}>PAN: <strong>{form.customerPan || '—'}</strong></div>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 11.5 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', marginBottom: 4 }}>Order References</div>
          <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Master Order #: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.orderNumber || '—'}</strong></div>
            {form.subOrderNumber && <div>Sub-Order #: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.subOrderNumber}</strong></div>}
            <div>Customer Code: <strong style={{ fontFamily: 'monospace', color: '#0F172A' }}>{form.customerCode || '—'}</strong></div>
            <div>Currency: <strong>{form.currency} ({sym})</strong></div>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#1E293B', color: '#FFFFFF' }}>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>#</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>Product Description</th>
            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>HSN/SAC</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Unit Price</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Tax%</th>
            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {form.lines.map((line, idx) => {
            const { total } = computeLineTotal(line);
            return (
              <tr key={line.id} style={{ borderBottom: '1px solid #F1F5F9', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                <td style={{ padding: '8px 10px', color: '#64748B' }}>{idx + 1}</td>
                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>{line.productName || '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#475569' }}>{line.hsnCode || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{line.quantity.toLocaleString('en-IN')}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{sym}{line.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{line.taxPercent}%</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>{sym}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748B' }}>Subtotal (Taxable)</span>
            <strong style={{ fontFamily: 'monospace' }}>{sym}{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          {form.taxType === 'CGST_SGST' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>CGST</span>
                <span style={{ fontFamily: 'monospace' }}>{sym}{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>SGST</span>
                <span style={{ fontFamily: 'monospace' }}>{sym}{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>IGST</span>
              <span style={{ fontFamily: 'monospace' }}>{sym}{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {form.freightAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748B' }}>Freight</span>
              <span style={{ fontFamily: 'monospace' }}>{sym}{form.freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, borderTop: '2px solid #0F172A', paddingTop: 6, marginTop: 3, color: '#0F172A' }}>
            <span>Grand Total</span>
            <span style={{ fontFamily: 'monospace', color: '#0F766E' }}>{sym}{totals.grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontSize: 12 }}>
            <span>Paid Amount</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{sym}{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: bal === 0 ? '#16A34A' : '#DC2626', fontSize: 13, fontWeight: 800 }}>
            <span>Outstanding Amount</span>
            <span style={{ fontFamily: 'monospace' }}>{sym}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Edit / Workspace Component ───────────────────────────────────────────────

const FullInvoiceCreationWorkspace: React.FC<{
  form: EditFormState;
  onChangeForm: (f: EditFormState) => void;
  onSave: () => void;
  onSendToCustomer: () => void;
  onDownload: () => void;
  onCancel: () => void;
  isNew: boolean;
  customers: Customer[];
  orgProfile: any;
}> = ({ form, onChangeForm, onSave, onSendToCustomer, onDownload, onCancel, isNew, customers, orgProfile }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupObjectURL = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupObjectURL();
    };
  }, []);

  const set = (field: keyof EditFormState, value: any) =>
    onChangeForm({ ...form, [field]: value });

  const setLine = (id: string, field: keyof EditableInvoiceLine, value: any) => {
    onChangeForm({
      ...form,
      lines: form.lines.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const addLine = () => onChangeForm({ ...form, lines: [...form.lines, blankLine()] });
  const removeLine = (id: string) => {
    if (form.lines.length <= 1) return;
    onChangeForm({ ...form, lines: form.lines.filter(l => l.id !== id) });
  };

  const handleCustomerSelect = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    onChangeForm({
      ...form,
      selectedCustomerId: cust.id,
      customerName: cust.name,
      customerCode: cust.code,
      customerAddress: `${cust.city}, ${cust.state} - Billing Address`,
      consigneeAddress: `${cust.city}, ${cust.state} - Delivery Consignee`,
      customerGstin: cust.gstin || '',
      customerPan: cust.pan || '',
      customerPhone: cust.phone || '',
      customerEmail: cust.email || '',
    });
  };

  // 1. Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      set('logoDataUrl', ev.target?.result as string || '');
    };
    reader.readAsDataURL(file);
  };

  // 2. Custom Document Upload Handler using safe Object URLs (PDF Only)
  const handleInvoiceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    cleanupObjectURL();

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('Invalid file format. Please upload a PDF file only (.pdf).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    onChangeForm({
      ...form,
      uploadedFileName: file.name,
      uploadedFileType: 'PDF Document',
      uploadedFileSize: sizeMB,
      uploadedFileUrl: objectUrl,
      creationMethod: 'UPLOAD'
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 10px', borderRadius: 7,
    border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A'
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: 60 }}>
      {/* Hidden File Inputs */}
      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
      <input ref={uploadInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleInvoiceFileUpload} />

      {/* Sticky Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: 0 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <ChevronRight size={14} style={{ color: '#94A3B8' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{isNew ? 'Manual Invoice PDF Upload' : `Edit Invoice — ${form.invoiceNumber}`}</div>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>Upload official B2B tax invoice PDF with live synchronized invoice preview.</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={onDownload} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> Download Invoice
          </button>

          <button onClick={onSendToCustomer} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}>
            <Send size={14} /> Send to Customer →
          </button>

          <button onClick={onCancel} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onSave} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Check size={15} /> Save Draft Invoice
          </button>
        </div>
      </div>

      {/* Main Split Layout: LEFT = Upload & Metadata, RIGHT = Live Invoice Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 20, alignItems: 'start' }}>

        {/* LEFT COLUMN: Upload & Invoice Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* MANUAL INVOICE PDF UPLOAD CARD */}
          <div style={{ background: '#FFFFFF', border: form.uploadedFileName ? '2px solid #86EFAC' : '2px dashed #93C5FD', borderRadius: 12, padding: 24, textAlign: 'center', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <Upload size={36} style={{ color: form.uploadedFileName ? '#16A34A' : '#2563EB', marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
              {form.uploadedFileName ? `Attached: ${form.uploadedFileName}` : 'Upload Official B2B Tax Invoice (PDF Only)'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
              {form.uploadedFileName ? `File Size: ${form.uploadedFileSize} | Format: PDF Document` : 'Please select and upload your tax invoice PDF to proceed.'}
            </div>
            <button onClick={() => uploadInputRef.current?.click()} style={{ padding: '9px 20px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Upload size={14} /> {form.uploadedFileName ? 'Change PDF File' : 'Browse & Upload Invoice PDF'}
            </button>
          </div>

          {/* Manufacturer Information Card */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} style={{ color: '#0F766E' }} /> Manufacturer / Issuer Profile
              </div>
              
              {/* UPLOAD LOGO BUTTON */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {form.logoDataUrl && (
                  <img src={form.logoDataUrl} alt="Company Logo" style={{ height: 30, maxWidth: 70, objectFit: 'contain', borderRadius: 4, border: '1px solid #CBD5E1' }} />
                )}
                <button type="button" onClick={() => logoInputRef.current?.click()} style={{ height: 32, padding: '0 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#2563EB', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ImageIcon size={13} /> {form.logoDataUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                {form.logoDataUrl && (
                  <button type="button" onClick={() => set('logoDataUrl', '')} style={{ height: 32, width: 32, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Manufacturer Company Name *</label>
                <input style={inputStyle} value={form.manufacturerName} onChange={e => set('manufacturerName', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>GSTIN *</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.manufacturerGstin} onChange={e => set('manufacturerGstin', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>PAN *</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.manufacturerPan} onChange={e => set('manufacturerPan', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Mfg License No</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.manufacturerLicense} onChange={e => set('manufacturerLicense', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input style={inputStyle} value={form.manufacturerPhone} onChange={e => set('manufacturerPhone', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Manufacturing Facility Address</label>
                <input style={inputStyle} value={form.manufacturerAddress} onChange={e => set('manufacturerAddress', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={16} style={{ color: '#2563EB' }} /> Billed Customer / Consignee
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Select Customer (Auto-Populate)</label>
              <select style={{ ...inputStyle, fontWeight: 600 }} value={form.selectedCustomerId} onChange={e => handleCustomerSelect(e.target.value)}>
                <option value="">-- Select Customer Directory --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code}) — GST: {c.gstin || 'N/A'}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Customer Name *</label>
                <input style={inputStyle} value={form.customerName} onChange={e => set('customerName', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer Code</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerCode} onChange={e => set('customerCode', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer GSTIN</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerGstin} onChange={e => set('customerGstin', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Customer PAN</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.customerPan} onChange={e => set('customerPan', e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Billing Address *</label>
                <textarea style={{ ...inputStyle, height: 50, resize: 'vertical', paddingTop: 6 }} value={form.customerAddress} onChange={e => set('customerAddress', e.target.value)} />
              </div>
            </div>
          </div>

          {/* References & Dates */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} style={{ color: '#7C3AED' }} /> Invoice Identifiers & Terms
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Invoice Number *</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 700 }} value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Invoice Date *</label>
                <input type="date" style={inputStyle} value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" style={inputStyle} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Master Order #</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.orderNumber} onChange={e => set('orderNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sub-Order #</label>
                <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={form.subOrderNumber} onChange={e => set('subOrderNumber', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select style={inputStyle} value={form.currency} onChange={e => set('currency', e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Payment Terms</label>
                <input style={inputStyle} value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} placeholder="e.g. Net 30 days from invoice date" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={16} style={{ color: '#D97706' }} /> Product Line Items ({form.lines.length})
              </div>
              <button onClick={addLine} style={{ height: 32, padding: '0 14px', borderRadius: 7, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Plus size={14} /> Add Item
              </button>
            </div>



            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>SL</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>Product Description</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' }}>HSN/SAC</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Qty</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Unit Price</th>

                    <th style={{ padding: '8px 8px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#475569' }}>Amount</th>
                    <th style={{ padding: '8px 4px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => {
                    const { total } = computeLineTotal(line);
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 8px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 8px', minWidth: 180 }}>
                          <input style={{ ...inputStyle, fontSize: 12 }} value={line.productName} onChange={e => setLine(line.id, 'productName', e.target.value)} placeholder="Product formulation description" />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 90 }}>
                          <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12 }} value={line.hsnCode} onChange={e => setLine(line.id, 'hsnCode', e.target.value)} />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 80 }}>
                          <input type="number" style={{ ...inputStyle, textAlign: 'right', fontSize: 12 }} value={line.quantity} onChange={e => setLine(line.id, 'quantity', Number(e.target.value))} min={1} />
                        </td>
                        <td style={{ padding: '8px 8px', minWidth: 90 }}>
                          <input type="number" step="0.01" style={{ ...inputStyle, textAlign: 'right', fontSize: 12 }} value={line.unitPrice} onChange={e => setLine(line.id, 'unitPrice', Number(e.target.value))} min={0} />
                        </td>

                        <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', minWidth: 90 }}>
                          {getCurrencySymbol(form.currency)}{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          {form.lines.length > 1 && (
                            <button onClick={() => removeLine(line.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Freight / Shipping Charge ({getCurrencySymbol(form.currency)}):</label>
              <input type="number" step="0.01" value={form.freightAmount} onChange={e => set('freightAmount', Number(e.target.value))} min={0} style={{ width: 120, height: 32, padding: '0 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5, textAlign: 'right', fontFamily: 'monospace' }} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE INVOICE PREVIEW */}
        <div style={{ position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={15} /> Invoice Preview
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 12, padding: 18, boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Uploaded Invoice Preview</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{form.uploadedFileName || 'No PDF file selected yet'}</div>
              </div>
              {form.uploadedFileName && (
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                  ✓ PDF Attached
                </span>
              )}
            </div>

            {form.uploadedFileUrl ? (
              <iframe src={form.uploadedFileUrl} title="Uploaded PDF Preview" style={{ width: '100%', height: 520, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF' }} />
            ) : (
              <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, padding: 36, textAlign: 'center' }}>
                <FileText size={44} style={{ color: '#94A3B8', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  Awaiting Invoice PDF Upload
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
                  Upload your invoice PDF on the left to preview the document before saving.
                </div>
                <button onClick={() => uploadInputRef.current?.click()} style={{ padding: '7px 16px', borderRadius: 6, background: '#0F766E', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Upload size={13} /> Select PDF File
                </button>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={onDownload} style={{ height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Download
            </button>

            <button onClick={onSendToCustomer} style={{ flex: 1, height: 42, borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}>
              <Send size={15} /> Send to Customer →
            </button>

            <button onClick={onSave} style={{ flex: 1, height: 42, borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}>
              <Check size={16} /> Save Draft Invoice
            </button>

            <button onClick={onCancel} style={{ height: 42, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Main InvoiceModule ───────────────────────────────────────────────────────

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  initialViewMode = 'LIST',
  initialData,
  onComplete,
  onCancel
}) => {
  const {
    invoices, recordInvoicePayment, currentRole,
    addInvoice, updateInvoice, deleteInvoice, sendInvoiceToCustomer,
    orgProfile, customers, setActiveTab
  } = useApp();

  const isBuyer = currentRole === 'BUYER';
  const isManufacturer = currentRole === 'SUPPLIER';
  const isAdmin = currentRole === 'ADMIN';

  // View state: LIST | WORKSPACE | DETAILS
  const [viewState, setViewState] = useState<'LIST' | 'WORKSPACE' | 'DETAILS'>(initialViewMode);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(() => initialViewMode === 'WORKSPACE' ? defaultEditForm(invoices.length, orgProfile, initialData) : null);

  useEffect(() => {
    if (initialViewMode === 'WORKSPACE' && !editForm) {
      setEditForm(defaultEditForm(invoices.length, orgProfile, initialData));
      setViewState('WORKSPACE');
    }
  }, [initialViewMode, initialData]);

  // Payment Form Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('INR');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('Razorpay');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Customer / Order-Specific Upload Modal State
  const [uploadTargetInvoice, setUploadTargetInvoice] = useState<Invoice | null>(null);
  const [modalUploadFile, setModalUploadFile] = useState<File | null>(null);
  const [modalUploadObjectUrl, setModalUploadObjectUrl] = useState<string | null>(null);
  const [modalUploadError, setModalUploadError] = useState<string | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenUploadModalForInvoice = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUploadTargetInvoice(inv);
    setModalUploadFile(null);
    setModalUploadObjectUrl(null);
    setModalUploadError(null);
  };

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setModalUploadError('Invalid file format. Please upload a PDF file only (.pdf).');
      return;
    }

    if (modalUploadObjectUrl) {
      URL.revokeObjectURL(modalUploadObjectUrl);
    }

    const objUrl = URL.createObjectURL(file);
    setModalUploadFile(file);
    setModalUploadObjectUrl(objUrl);
  };

  const handleConfirmModalUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetInvoice) return;
    if (!modalUploadFile || !modalUploadObjectUrl) {
      setModalUploadError('Please select an invoice PDF file to upload.');
      return;
    }

    const sizeMB = (modalUploadFile.size / (1024 * 1024)).toFixed(2) + ' MB';
    const updatedInv: Invoice = {
      ...uploadTargetInvoice,
      uploadedFileName: modalUploadFile.name,
      uploadedFileUrl: modalUploadObjectUrl,
      uploadedFileSize: sizeMB,
      uploadedFileType: 'PDF Document',
      creationMethod: 'UPLOAD',
      status: uploadTargetInvoice.status === 'UNPAID' || !uploadTargetInvoice.uploadedFileName ? 'GENERATED' : uploadTargetInvoice.status
    };

    updateInvoice(uploadTargetInvoice.id, updatedInv);
    showToast(`✔ Invoice PDF successfully uploaded and associated with ${uploadTargetInvoice.customerName} for Order ${uploadTargetInvoice.orderNumber}!`);
    setUploadTargetInvoice(null);
    setModalUploadFile(null);
    setModalUploadObjectUrl(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Synchronize selected invoice for details view DIRECTLY from invoices state array
  const activeDetailInvoice = useMemo(() => {
    if (!selectedInvoiceForDetails) return null;
    const found = invoices.find(i => i.id === selectedInvoiceForDetails.id || i.invoiceNumber === selectedInvoiceForDetails.invoiceNumber);
    return found || selectedInvoiceForDetails;
  }, [selectedInvoiceForDetails, invoices]);

  // Calculated Metrics
  const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.min(100, Math.round((totalPaid / totalInvoiced) * 100)) : 0;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDownloadUploadedInvoice = (inv: Invoice) => {
    if (inv.uploadedFileUrl) {
      const a = document.createElement('a');
      a.href = inv.uploadedFileUrl;
      a.download = inv.uploadedFileName || `${inv.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (isBuyer) {
      // Ensure buyer only sees invoices belonging to their customer account
      const isMyCustomer = !inv.customerId || inv.customerId === 'c1' || inv.customerName.toLowerCase().includes('apex');
      if (!isMyCustomer) return false;
    }

    const q = searchTerm.toLowerCase().trim();
    const matchSearch = q === '' ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      (inv.manufacturerName || '').toLowerCase().includes(q) ||
      (inv.orderNumber || '').toLowerCase().includes(q);
    if (!matchSearch) return false;

    const isOverdue = inv.status === 'OVERDUE' || (inv.dueDate && inv.dueDate < todayStr && inv.balanceAmount > 0);

    if (statusFilter === 'GENERATED') return inv.status === 'GENERATED';
    if (statusFilter === 'UNSENT_DRAFT') return !inv.sentToCustomer;
    if (statusFilter === 'SENT_TO_CUSTOMER') return inv.sentToCustomer === true;
    if (statusFilter === 'PAID') return inv.balanceAmount === 0;
    if (statusFilter === 'PARTIALLY_PAID') return inv.paidAmount > 0 && inv.balanceAmount > 0;
    if (statusFilter === 'UNPAID') return inv.paidAmount === 0 && inv.balanceAmount > 0 && !isOverdue;
    if (statusFilter === 'OVERDUE') return isOverdue;
    return true;
  });

  // RAZORPAY CHECKOUT HANDLER (FOR BUYER)
  const handleTriggerRazorpay = async (inv: Invoice, e?: React.MouseEvent, customAmt?: number) => {
    if (e) e.stopPropagation();

    // Strict validation: Invoice PDF must be uploaded
    const hasPdf = Boolean(inv.uploadedFileUrl || inv.uploadedFileName);
    if (!hasPdf) {
      alert("⚠ Awaiting Invoice PDF!\n\nOnline payment cannot be initiated because the supplier/manufacturer has not uploaded the official tax invoice PDF yet.");
      return;
    }

    const payAmt = typeof customAmt === 'number' ? customAmt : inv.balanceAmount;

    if (payAmt <= 0) {
      showToast("❌ Balance due is ₹0. Invoice is already fully paid.");
      return;
    }

    initiateRazorpayCheckout({
      amount: payAmt,
      currency: inv.currency || 'INR',
      invoiceNumber: inv.invoiceNumber,
      orderNumber: inv.orderNumber,
      buyerName: inv.customerName,
      buyerEmail: 'accounts@apexpharma.com',
      buyerPhone: '+91 98250 11223',
      onSuccess: async (response) => {
        // Server-Side Signature Verification
        const isVerified = await verifyRazorpaySignature(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );

        if (isVerified) {
          recordInvoicePayment(
            inv.id,
            payAmt,
            'Razorpay',
            response.razorpay_payment_id,
            inv.currency || 'INR',
            new Date().toISOString().split('T')[0]
          );

          const newBal = Math.max(0, inv.balanceAmount - payAmt);
          const statusText = newBal === 0 ? 'PAID' : 'PARTIALLY PAID';
          showToast(`✔ Razorpay Payment Verified! Ref: ${response.razorpay_payment_id}. Status: ${statusText}`);
          setShowPaymentModal(null);
        } else {
          showToast("❌ Server signature verification failed. Payment was not recorded.");
        }
      },
      onFailure: (err) => {
        showToast(`❌ Razorpay payment failed: ${err.message || 'Payment cancelled by user.'}`);
      },
      onDismiss: () => {
        showToast("ℹ Razorpay payment checkout window closed.");
      }
    });
  };

  // Action Handlers: Send to Customer & Delete
  const handleSendToCustomer = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (inv.sentToCustomer) {
      alert(`Invoice ${inv.invoiceNumber} has already been sent to the customer.`);
      return;
    }
    if (window.confirm(`Are you sure you want to send Invoice ${inv.invoiceNumber} to ${inv.customerName}? Once sent, the invoice will become locked and read-only.`)) {
      if (sendInvoiceToCustomer) {
        sendInvoiceToCustomer(inv.id);
      }
      showToast(`✔ Invoice ${inv.invoiceNumber} sent to customer successfully! Invoice is now locked and read-only.`);
      
      // CRITICAL NAVIGATION: Set statusFilter to 'ALL', return to Invoice Ledger (setViewState('LIST'))
      setStatusFilter('ALL');
      setViewState('LIST');
      setSelectedInvoiceForDetails(null);
      setEditForm(null);
      setEditingInvoice(null);
      if (setActiveTab) {
        setActiveTab('invoices');
      }
    }
  };

  const handleDeleteInvoice = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (inv.status === 'PARTIAL_PAYMENT' || inv.status === 'PARTIALLY_PAID') {
      alert("Partially paid invoices cannot be deleted.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete Invoice ${inv.invoiceNumber}? This action cannot be undone.`)) {
      if (deleteInvoice) {
        deleteInvoice(inv.id);
      }
      showToast(`✔ Invoice ${inv.invoiceNumber} deleted successfully.`);
      if (viewState === 'DETAILS') {
        setViewState('LIST');
        setSelectedInvoiceForDetails(null);
      }
    }
  };

  // Open Payment Modal (Available after invoice is sent)
  const handleOpenPaymentModal = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (inv.balanceAmount <= 0) return;
    setShowPaymentModal(inv);
    setPaymentAmount(String(inv.balanceAmount));
    setPaymentCurrency(inv.currency || 'INR');
    setUtrNumber(`UTR-${Date.now().toString().slice(-6)}`);
    setPaymentMode('Razorpay');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRemarks(isBuyer ? 'Invoice payment via Razorpay' : 'Payment received');
    setPaymentError(null);
  };

  // Submit Payment with Strict Validation
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Payment amount must be greater than ₹0.');
      return;
    }

    if (amt > showPaymentModal.balanceAmount + 0.01) {
      const sym = getCurrencySymbol(paymentCurrency);
      setPaymentError(`Payment amount (${sym}${amt.toLocaleString('en-IN')}) cannot exceed current balance due (${sym}${showPaymentModal.balanceAmount.toLocaleString('en-IN')}).`);
      return;
    }

    if (isBuyer && paymentMode === 'Razorpay') {
      handleTriggerRazorpay(showPaymentModal, undefined, amt);
      return;
    }

    recordInvoicePayment(showPaymentModal.id, amt, paymentMode, utrNumber, paymentCurrency, paymentDate);
    const newPaid = (showPaymentModal.paidAmount || 0) + amt;
    const newBal = Math.max(0, showPaymentModal.totalAmount - newPaid);
    const sym = getCurrencySymbol(paymentCurrency);
    const statusText = newBal === 0 ? 'PAID' : 'PARTIALLY PAID';

    if (isBuyer) {
      showToast(`✔ Payment of ${sym}${amt.toLocaleString('en-IN')} for Invoice ${showPaymentModal.invoiceNumber} submitted successfully! Status: ${statusText}`);
    } else {
      showToast(`✔ Payment of ${sym}${amt.toLocaleString('en-IN')} recorded for Invoice ${showPaymentModal.invoiceNumber}! Status: ${statusText}`);
    }

    setShowPaymentModal(null);
    setPaymentAmount('');
    setPaymentError(null);
  };

  // Open Creation Workspace
  const handleOpenCreateWorkspace = () => {
    setEditForm(defaultEditForm(invoices.length, orgProfile, initialData));
    setEditingInvoice(null);
    setViewState('WORKSPACE');
  };

  // Open Edit Workspace (Allowed only before invoice is sent, or if partially paid)
  const handleOpenEditWorkspace = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (inv.sentToCustomer && inv.balanceAmount === 0) {
      alert(`Invoice ${inv.invoiceNumber} is fully paid and locked. Editing is not permitted.`);
      return;
    }
    setEditForm(invoiceToEditForm(inv));
    setEditingInvoice(inv);
    setViewState('WORKSPACE');
  };

  // Build Invoice Object from editForm
  const buildInvoiceFromForm = (): Invoice => {
    if (!editForm) throw new Error("No edit form");
    const totals = computeTotals(editForm.lines, editForm.freightAmount, editForm.taxType);
    const lines: InvoiceLine[] = editForm.lines.map(l => {
      const { taxAmt, total } = computeLineTotal(l);
      return {
        id: l.id,
        productId: 'p_' + l.id,
        productName: l.productName || 'Pharmaceutical Formulation',
        hsnCode: l.hsnCode,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        taxPercent: l.taxPercent,
        taxAmount: taxAmt,
        totalAmount: total,
      };
    });

    if (editingInvoice) {
      return {
        ...editingInvoice,
        invoiceNumber: editForm.invoiceNumber,
        orderNumber: editForm.orderNumber,
        subOrderNumber: editForm.subOrderNumber,
        customerName: editForm.customerName,
        customerAddress: editForm.customerAddress,
        customerGstin: editForm.customerGstin,
        customerPan: editForm.customerPan,
        manufacturerName: editForm.manufacturerName,
        manufacturerAddress: editForm.manufacturerAddress,
        manufacturerGstin: editForm.manufacturerGstin,
        manufacturerPan: editForm.manufacturerPan,
        manufacturerLicense: editForm.manufacturerLicense,
        logoDataUrl: editForm.logoDataUrl,
        invoiceDate: editForm.invoiceDate,
        dueDate: editForm.dueDate,
        paymentTerms: editForm.paymentTerms,
        currency: editForm.currency,
        subtotal: totals.subtotal,
        taxTotal: totals.totalTax,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        freightAmount: editForm.freightAmount,
        totalAmount: totals.grand,
        lines,
        status: editingInvoice.status || 'GENERATED',
        sentToCustomer: editingInvoice.sentToCustomer || false,
        creationMethod: editForm.creationMethod,
        uploadedFileName: editForm.uploadedFileName,
        uploadedFileUrl: editForm.uploadedFileUrl,
      };
    }

    return {
      id: 'inv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      invoiceNumber: editForm.invoiceNumber,
      masterOrderId: 'mo_' + editForm.orderNumber,
      orderNumber: editForm.orderNumber,
      subOrderNumber: editForm.subOrderNumber,
      customerId: editForm.selectedCustomerId || 'cus001',
      customerName: editForm.customerName,
      customerCode: editForm.customerCode || 'CUS001',
      customerAddress: editForm.customerAddress,
      customerGstin: editForm.customerGstin,
      customerPan: editForm.customerPan,
      manufacturerName: editForm.manufacturerName,
      manufacturerAddress: editForm.manufacturerAddress,
      manufacturerGstin: editForm.manufacturerGstin,
      manufacturerPan: editForm.manufacturerPan,
      manufacturerLicense: editForm.manufacturerLicense,
      logoDataUrl: editForm.logoDataUrl,
      invoiceDate: editForm.invoiceDate,
      dueDate: editForm.dueDate,
      paymentTerms: editForm.paymentTerms,
      currency: editForm.currency,
      subtotal: totals.subtotal,
      taxTotal: totals.totalTax,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      freightAmount: editForm.freightAmount,
      totalAmount: totals.grand,
      paidAmount: 0,
      balanceAmount: totals.grand,
      status: 'GENERATED',
      sentToCustomer: false,
      lines,
      payments: [],
      creationMethod: editForm.creationMethod,
      uploadedFileName: editForm.uploadedFileName,
      uploadedFileUrl: editForm.uploadedFileUrl,
    };
  };

  // Save Draft Invoice (Draft unsent -> Opens Invoice Detail page)
  const handleSaveInvoice = () => {
    if (!editForm) return;
    if (!editForm.uploadedFileName && !editForm.uploadedFileUrl) {
      alert('⚠ Please upload an invoice PDF file before saving.');
      return;
    }
    const invObj = buildInvoiceFromForm();

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invObj);
      showToast(`✔ Invoice ${editForm.invoiceNumber} updated successfully!`);
    } else {
      addInvoice(invObj);
      showToast(`✔ Invoice PDF ${editForm.invoiceNumber} uploaded successfully!`);
    }

    if (onComplete) {
      onComplete(invObj);
    } else {
      setSelectedInvoiceForDetails(invObj);
      setViewState('DETAILS');
    }

    setEditForm(null);
    setEditingInvoice(null);
  };

  // Send to Customer handler from Creation Workspace
  const handleWorkspaceSendToCustomer = () => {
    if (!editForm) return;
    if (!editForm.uploadedFileName && !editForm.uploadedFileUrl) {
      alert('⚠ Please upload an invoice PDF file before sending.');
      return;
    }

    if (window.confirm(`Are you sure you want to send Invoice ${editForm.invoiceNumber} to ${editForm.customerName}? Once sent, the invoice will become locked and read-only.`)) {
      const invObj = buildInvoiceFromForm();
      invObj.sentToCustomer = true;
      invObj.status = 'GENERATED';

      if (editingInvoice) {
        updateInvoice(editingInvoice.id, invObj);
      } else {
        addInvoice(invObj);
      }

      showToast(`✔ Invoice ${invObj.invoiceNumber} sent to customer successfully! Invoice is now locked and read-only.`);

      // CRITICAL NAVIGATION: Return to Invoice Ledger (setViewState('LIST'))
      setStatusFilter('ALL');
      setViewState('LIST');
      setSelectedInvoiceForDetails(null);
      setEditForm(null);
      setEditingInvoice(null);
      if (setActiveTab) {
        setActiveTab('invoices');
      }
    }
  };

  const handleWorkspaceDownload = () => {
    window.print();
  };

  const handleCancelWorkspace = () => {
    if (onCancel) {
      onCancel();
    } else {
      setViewState('LIST');
      setEditForm(null);
      setEditingInvoice(null);
    }
  };

  // ── WORKSPACE VIEW RENDER ──────────────────────────────────────────────────
  if (viewState === 'WORKSPACE' && (isAdmin || isBuyer)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', margin: '20px auto', maxWidth: 600 }}>
        <h2 style={{ color: '#DC2626', fontSize: 20, fontWeight: 800 }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14 }}>Tax invoice creation and structural editing are performed by Manufacturer partners. Buyers may view and pay issued invoices.</p>
        <button onClick={() => setViewState('LIST')} style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', marginTop: 12 }}>
          Return to Invoices & Payments
        </button>
      </div>
    );
  }

  if (viewState === 'WORKSPACE' && editForm) {
    return (
      <div style={{ padding: '0 2px' }}>
        {toastMessage && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
          </div>
        )}
        <FullInvoiceCreationWorkspace
          form={editForm}
          onChangeForm={setEditForm}
          onSave={handleSaveInvoice}
          onSendToCustomer={handleWorkspaceSendToCustomer}
          onDownload={handleWorkspaceDownload}
          onCancel={handleCancelWorkspace}
          isNew={!editingInvoice}
          customers={customers}
          orgProfile={orgProfile}
        />
      </div>
    );
  }

  // ── FINALIZED INVOICE DETAILS PAGE RENDER ─────────────────────────────────
  if (viewState === 'DETAILS' && activeDetailInvoice) {
    const inv = activeDetailInvoice;
    const sym = getCurrencySymbol(inv.currency);
    const paid = inv.paidAmount || 0;
    const bal = inv.balanceAmount;
    const isSent = Boolean(inv.sentToCustomer);
    
    // Status flags for details view
    const isPaidStatus = bal === 0 && inv.totalAmount > 0;
    const isPartiallyPaidStatus = paid > 0 && bal > 0;
    const showPaymentHistory = (isPaidStatus || isPartiallyPaidStatus) && Array.isArray(inv.payments) && inv.payments.length > 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

        {/* Toast */}
        {toastMessage && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleCancelWorkspace} style={{ background: 'none', border: 'none', color: '#0F766E', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: 0 }}>
              <ArrowLeft size={15} /> Back to Invoices Ledger
            </button>
            <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                Invoice {inv.invoiceNumber} <StatusChip inv={inv} />
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                {isBuyer ? `Supplier: ${inv.manufacturerName || 'SunBio LifeSciences Ltd'}` : `Customer: ${inv.customerName}`} | Issued: {inv.invoiceDate}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Download Invoice Button (Always available when PDF is uploaded) */}
            {Boolean(inv.uploadedFileUrl || inv.uploadedFileName) && (
              <button
                type="button"
                onClick={() => handleDownloadUploadedInvoice(inv)}
                style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F766E', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download Invoice
              </button>
            )}

            {/* PAY NOW BUTTON FOR BUYER (Inside Invoice Preview header: Shown when balanceAmount > 0 AND PDF is uploaded) */}
            {isBuyer && bal > 0 && Boolean(inv.uploadedFileUrl || inv.uploadedFileName) && (
              <button onClick={(e) => handleTriggerRazorpay(inv, e)} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}>
                <CreditCard size={14} /> Pay Now
              </button>
            )}

            {/* Send to Customer Button (Top Header - Only shown when NOT sent and not paid/partially paid) */}
            {isManufacturer && !isSent && !isPaidStatus && !isPartiallyPaidStatus && (
              <button onClick={(e) => handleSendToCustomer(inv, e)} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(37,99,235,0.25)' }}>
                <Send size={14} /> Send to Customer →
              </button>
            )}

            {/* Edit Button for Partially Paid or Unsent Invoices */}
            {isManufacturer && (isPartiallyPaidStatus || !isSent) && !isPaidStatus && (
              <button onClick={(e) => handleOpenEditWorkspace(inv, e)} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#2563EB', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Edit2 size={14} /> Edit
              </button>
            )}

            {/* Delete Button for Paid or Unsent Invoices */}
            {isManufacturer && (isPaidStatus || !isSent) && !isPartiallyPaidStatus && (
              <button onClick={(e) => handleDeleteInvoice(inv, e)} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FFF5F5', color: '#B91C1C', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Trash2 size={14} /> Delete
              </button>
            )}

            {/* Record Payment Button for Manufacturer */}
            {!isBuyer && bal > 0 && !isAdmin && (
              <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ height: 36, padding: '0 18px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}>
                <Banknote size={14} /> Record Payment Received
              </button>
            )}

            <button onClick={() => window.print()} style={{ height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoice Total</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', marginTop: 4 }}>{sym}{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Issued Date: {inv.invoiceDate}</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{isBuyer ? 'Amount Paid' : 'Amount Received'}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', marginTop: 4 }}>{sym}{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600, marginTop: 2 }}>{Math.round((paid / inv.totalAmount) * 100)}% settled</div>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Outstanding Balance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: bal === 0 ? '#16A34A' : '#DC2626', fontFamily: 'monospace', marginTop: 4 }}>{sym}{bal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Due Date: {inv.dueDate}</div>
          </div>
        </div>

        {/* Split Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* Left Column: Live Invoice Preview Document */}
          <LiveInvoicePreviewDocument
            form={invoiceToEditForm(inv)}
            paidAmount={paid}
          />

          {/* Right Panel: Settlement Actions & Payment History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pay Invoice Action Box (When balance > 0) */}
            {bal > 0 && !isAdmin && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  {isBuyer ? 'Online Payment Gateway' : 'Settlement Actions'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                  {isBuyer 
                    ? `Pay outstanding balance of ₹${bal.toLocaleString('en-IN')} instantly using Razorpay UPI, Cards, NetBanking, or Corporate Wire.` 
                    : 'Record payment received from buyer to update Accounts Receivable ledger.'}
                </div>

                {isBuyer ? (
                  Boolean(inv.uploadedFileUrl || inv.uploadedFileName) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button onClick={(e) => handleTriggerRazorpay(inv, e)} style={{ width: '100%', height: 42, borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.25)' }}>
                        <Shield size={16} /> Pay ₹{bal.toLocaleString('en-IN')} via Razorpay →
                      </button>
                      <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ width: '100%', height: 34, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        Optionally Pay Custom Partial Amount
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: 12, fontSize: 12, color: '#92400E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={16} /> Awaiting Invoice PDF: Payment will be enabled once the supplier uploads the tax invoice PDF.
                    </div>
                  )
                ) : (
                  <button onClick={(e) => handleOpenPaymentModal(inv, e)} style={{ width: '100%', height: 40, borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}>
                    <Banknote size={15} /> Record Payment Received
                  </button>
                )}
              </div>
            )}

            {/* PAYMENT HISTORY: Rendered ONLY for PAID and PARTIALLY PAID invoices */}
            {showPaymentHistory && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={15} style={{ color: '#2563EB' }} /> Payment History ({inv.payments!.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {inv.payments!.map((p, idx) => (
                    <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', fontSize: 13 }}>
                          +{sym}{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
                          {p.status || 'COMPLETED'}
                        </span>
                      </div>
                      <div style={{ color: '#64748B', fontSize: 11 }}>
                        Date: <strong style={{ color: '#0F172A' }}>{p.paymentDate || inv.invoiceDate}</strong> | Method: <strong style={{ color: '#0F766E' }}>{p.paymentMethod || 'Razorpay'}</strong>
                      </div>
                      {p.reference && (
                        <div style={{ color: '#475569', fontSize: 11, fontFamily: 'monospace', marginTop: 3 }}>
                          Ref/ID: <strong>{p.reference}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 520, padding: 26, boxShadow: '0 16px 40px rgba(15,23,42,0.22)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    {isBuyer ? 'Pay Invoice via Razorpay' : 'Record Payment Received'}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Invoice #: <strong style={{ fontFamily: 'monospace' }}>{showPaymentModal.invoiceNumber}</strong> {isBuyer && `| Supplier: ${showPaymentModal.manufacturerName || 'SunBio LifeSciences Ltd'}`}
                  </div>
                </div>
                <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                {[
                  { label: 'Invoice Total Amount', value: `${getCurrencySymbol(paymentCurrency)}${showPaymentModal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#0F172A' },
                  { label: isBuyer ? 'Amount Already Paid' : 'Amount Already Received', value: `${getCurrencySymbol(paymentCurrency)}${(showPaymentModal.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#64748B' }}>{row.label}:</span>
                    <strong style={{ fontFamily: 'monospace', color: row.color }}>{row.value}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 4 }}>
                  <span style={{ color: '#475569' }}>Current Balance Due:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#DC2626' }}>{getCurrencySymbol(paymentCurrency)}{showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              {paymentError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> {paymentError}
                </div>
              )}

              <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    {isBuyer ? 'Payment Amount *' : 'Payment Amount Received *'}
                  </label>
                  <input type="number" step="0.01" placeholder={`Max: ${getCurrencySymbol(paymentCurrency)}${showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} value={paymentAmount} onChange={e => { setPaymentAmount(e.target.value); setPaymentError(null); }} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, outline: 'none' }} />

                  <div style={{ display: 'flex', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.25 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>25%</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.5 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>50% of Outstanding</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.75 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>75%</button>
                    <button type="button" onClick={() => { setPaymentAmount(String(showPaymentModal.balanceAmount)); setPaymentError(null); }} style={{ height: 26, padding: '0 12px', borderRadius: 5, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Full Outstanding</button>
                  </div>
                </div>

                {Number(paymentAmount) > 0 && !isNaN(Number(paymentAmount)) && (
                  <div style={{ background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#86EFAC' : '#93C5FD'}`, borderRadius: 8, padding: '9px 14px', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#475569', fontSize: 11.5 }}>Remaining Balance After Payment:</div>
                      <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#0F172A' }}>{getCurrencySymbol(paymentCurrency)}{Math.max(0, showPaymentModal.balanceAmount - Number(paymentAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#DCFCE7' : '#DBEAFE', color: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#15803D' : '#1D4ED8' }}>
                      {Number(paymentAmount) >= showPaymentModal.balanceAmount ? '✓ STATUS: PAID' : '↗ STATUS: PARTIALLY PAID'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Currency *</label>
                    <select value={paymentCurrency} onChange={e => setPaymentCurrency(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Gateway / Method *</label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                      <option value="Razorpay">Razorpay Online Gateway (UPI / Cards / NetBanking)</option>
                      <option value="Bank Transfer">Bank Transfer (Wire / BACS)</option>
                      <option value="RTGS">RTGS – Real-Time Gross Settlement</option>
                      <option value="NEFT">NEFT – National Electronic Funds Transfer</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Date *</label>
                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>{paymentMode === 'Razorpay' ? 'Gateway Reference ID' : 'Transaction / UTR #'}</label>
                    <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 12.5 }} readOnly={paymentMode === 'Razorpay'} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={() => setShowPaymentModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ height: 38, padding: '0 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}>
                    {isBuyer && paymentMode === 'Razorpay' ? <Shield size={14} /> : <Banknote size={14} />}
                    {isBuyer && paymentMode === 'Razorpay' ? 'Proceed to Razorpay →' : 'Record Payment Received'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── INVOICES LEDGER LIST VIEW RENDER ───────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', minHeight: '100vh', color: '#0F172A' }}>

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 11000, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.2s ease' }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} /> {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Receipt size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <span>FactoryGrid</span><ChevronRight size={12} /><span>{currentRole === 'BUYER' ? 'buyer' : currentRole === 'SUPPLIER' ? 'supplier' : 'admin'}</span><ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Invoices & Payments</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              {isBuyer ? 'Buyer Tax Invoices & Payments' : isManufacturer ? 'Manufacturer Tax Invoices Workspace' : 'Admin Tax Invoices & AR Ledger Monitor'}
            </h1>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 1 }}>
              {isBuyer
                ? 'B2B pharmaceutical tax invoice management, Razorpay online checkout, partial payments, and treasury settlement ledger.'
                : isManufacturer
                ? 'B2B pharmaceutical tax invoice generation, customer billing, and payment collection ledger.'
                : 'Read-only platform invoice surveillance, payment tracking, and audit monitoring.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input type="text" placeholder="Search invoice#, partner, order..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: 260, height: 36, paddingLeft: 30, paddingRight: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF' }} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, sub: `${invoices.length} total issued`, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', icon: <Receipt size={16} /> },
          { label: isBuyer ? 'Amount Paid' : 'Payment Received', value: `₹${totalPaid.toLocaleString('en-IN')}`, sub: `↑ ${collectionRate}% collection rate`, color: '#16A34A', bg: '#F0FDF4', border: '#86EFAC', icon: <Check size={16} /> },
          { label: 'Outstanding Balance', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, sub: `${invoices.filter(i => i.balanceAmount > 0).length} pending settlements`, color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: <AlertCircle size={16} /> },
          { label: 'Partially Paid', value: `${invoices.filter(i => i.paidAmount > 0 && i.balanceAmount > 0).length} Invoices`, sub: 'Active installment plans', color: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD', icon: <Clock size={16} /> },
        ].map((card, i) => (
          <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Invoices (${invoices.length})` },
            { id: 'GENERATED', label: `Generated (${invoices.filter(i => i.status === 'GENERATED').length})` },
            { id: 'UNSENT_DRAFT', label: `Unsent Drafts (${invoices.filter(i => !i.sentToCustomer).length})` },
            { id: 'SENT_TO_CUSTOMER', label: `Sent to Customer (${invoices.filter(i => i.sentToCustomer).length})` },
            { id: 'PARTIALLY_PAID', label: `Partially Paid (${invoices.filter(i => i.paidAmount > 0 && i.balanceAmount > 0).length})` },
            { id: 'PAID', label: `Paid (${invoices.filter(i => i.balanceAmount === 0).length})` },
            { id: 'OVERDUE', label: `Overdue (${invoices.filter(i => i.status === 'OVERDUE' || (i.dueDate && i.dueDate < todayStr && i.balanceAmount > 0)).length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setStatusFilter(tab.id)} style={{ height: 32, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: statusFilter === tab.id ? 700 : 500, background: statusFilter === tab.id ? '#2563EB' : 'transparent', color: statusFilter === tab.id ? '#FFFFFF' : '#475569', border: 'none', cursor: 'pointer', transition: 'all 120ms ease' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Invoices Ledger</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '11px 16px' }}>Invoice #</th>
                <th style={{ padding: '11px 14px' }}>{isBuyer ? 'Supplier / Manufacturer' : 'Customer / Buyer'}</th>
                <th style={{ padding: '11px 14px' }}>Order / PO Ref</th>
                <th style={{ padding: '11px 14px' }}>Invoice Total</th>
                <th style={{ padding: '11px 14px' }}>Amount Paid</th>
                <th style={{ padding: '11px 14px' }}>Balance Due</th>
                <th style={{ padding: '11px 14px' }}>Due Date</th>
                <th style={{ padding: '11px 14px' }}>Invoice Status</th>
                <th style={{ padding: '11px 16px', textAlign: 'right', minWidth: 160, width: 170 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No invoices found matching criteria.</td></tr>
              ) : (
                filteredInvoices.map(inv => {
                  const sym = getCurrencySymbol(inv.currency);
                  const isPaid = inv.balanceAmount === 0 && inv.totalAmount > 0;
                  const isPartial = inv.paidAmount > 0 && inv.balanceAmount > 0;
                  const isSent = Boolean(inv.sentToCustomer);
                  const hasPdf = Boolean(inv.uploadedFileUrl || inv.uploadedFileName);

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.1s' }}
                      onClick={() => { setSelectedInvoiceForDetails(inv); setViewState('DETAILS'); }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFBFC'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F172A', fontSize: 13 }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Issued: {inv.invoiceDate}</div>
                      </td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{isBuyer ? (inv.manufacturerName || 'SunBio LifeSciences Ltd') : inv.customerName}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>{inv.customerCode || 'CUS-2026-001'}</div>
                      </td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0F766E', fontSize: 12.5 }}>{inv.orderNumber}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: 'monospace' }}>{inv.subOrderNumber || 'SO-1001-01'}</div>
                      </td>
                      <td style={{ padding: '14px 14px', fontWeight: 800, fontFamily: 'monospace', color: '#0F172A' }}>
                        {sym}{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 14px', fontWeight: 700, fontFamily: 'monospace', color: '#16A34A' }}>
                        {sym}{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: isPaid ? '#16A34A' : '#DC2626' }}>
                          {sym}{inv.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {isPartial && (
                          <div style={{ marginTop: 3 }}>
                            <div style={{ width: 80, height: 4, borderRadius: 2, background: '#E2E8F0', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.round((inv.paidAmount / inv.totalAmount) * 100)}%`, background: '#3B82F6', borderRadius: 2 }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 14px', fontSize: 12.5, color: '#475569' }}>{inv.dueDate}</td>
                      <td style={{ padding: '14px 14px' }}><StatusChip inv={inv} /></td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {isBuyer ? (
                          hasPdf ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoiceForDetails(inv);
                                setViewState('DETAILS');
                              }}
                              style={{
                                height: 30,
                                padding: '0 14px',
                                borderRadius: 6,
                                border: '1px solid #0F766E',
                                background: '#F0FDFA',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#0F766E',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 1px 2px rgba(15,118,110,0.1)'
                              }}
                            >
                              <Eye size={13} /> View Invoice
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                              Awaiting Invoice PDF
                            </span>
                          )
                        ) : (
                          /* Supplier / Admin View */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', width: '100%' }}>
                            {hasPdf ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInvoiceForDetails(inv);
                                    setViewState('DETAILS');
                                  }}
                                  style={{
                                    height: 28,
                                    width: 148,
                                    padding: '0 10px',
                                    borderRadius: 6,
                                    border: '1px solid #0F766E',
                                    background: '#F0FDFA',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: '#0F766E',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5
                                  }}
                                >
                                  <Eye size={13} /> View Invoice
                                </button>
                                {isManufacturer && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenUploadModalForInvoice(inv, e)}
                                    style={{
                                      height: 28,
                                      width: 148,
                                      padding: '0 10px',
                                      borderRadius: 6,
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      color: '#2563EB',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5
                                    }}
                                  >
                                    <Upload size={13} /> Replace PDF
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                {isManufacturer ? (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenUploadModalForInvoice(inv, e)}
                                    style={{
                                      height: 28,
                                      width: 148,
                                      padding: '0 10px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: '#2563EB',
                                      fontSize: 11.5,
                                      fontWeight: 800,
                                      color: '#FFFFFF',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      boxShadow: '0 1px 3px rgba(37,99,235,0.2)'
                                    }}
                                  >
                                    <Upload size={13} /> Upload Invoice PDF
                                  </button>
                                ) : (
                                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 148 }}>
                                    Awaiting Invoice PDF
                                  </span>
                                )}

                                {!isBuyer && inv.balanceAmount > 0 && !isAdmin && isSent && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenPaymentModal(inv, e)}
                                    style={{
                                      height: 28,
                                      width: 148,
                                      padding: '0 10px',
                                      borderRadius: 6,
                                      border: '1px solid #CBD5E1',
                                      background: '#FFFFFF',
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      color: '#0F766E',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5
                                    }}
                                  >
                                    <Banknote size={12} /> Record Payment
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CUSTOMER & ORDER-SPECIFIC INVOICE PDF UPLOAD */}
      {uploadTargetInvoice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setUploadTargetInvoice(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 580, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 26, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.25)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                  <Upload size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>Upload Invoice PDF</h3>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Attach official tax invoice PDF to this order record</div>
                </div>
              </div>
              <button onClick={() => setUploadTargetInvoice(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
            </div>

            {/* Read-Only Context: Customer / Buyer & Order Details */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer / Buyer</span>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{uploadTargetInvoice.customerName}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Code: <strong style={{ fontFamily: 'monospace' }}>{uploadTargetInvoice.customerCode || 'CUS-2026-001'}</strong></div>
              </div>
              <div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order / PO Reference</span>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F766E', fontFamily: 'monospace', marginTop: 2 }}>
                  {uploadTargetInvoice.orderNumber} {uploadTargetInvoice.subOrderNumber ? ` / ${uploadTargetInvoice.subOrderNumber}` : ''}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Invoice #: <strong style={{ fontFamily: 'monospace' }}>{uploadTargetInvoice.invoiceNumber}</strong></div>
              </div>
            </div>

            {/* Upload Area */}
            <input
              ref={modalFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={handleModalFileSelect}
            />

            <div
              onClick={() => modalFileInputRef.current?.click()}
              style={{
                background: modalUploadFile ? '#F0FDF4' : '#F8FAFC',
                border: modalUploadFile ? '2px solid #86EFAC' : '2px dashed #93C5FD',
                borderRadius: 10,
                padding: '24px 18px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              {modalUploadFile ? (
                <div>
                  <FileCheck size={36} style={{ color: '#16A34A', marginBottom: 6 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                    {modalUploadFile.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                    Size: {(modalUploadFile.size / (1024 * 1024)).toFixed(2)} MB | Format: PDF Document
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '4px 10px', borderRadius: 6, border: '1px solid #BFDBFE' }}>
                      Click to Change File
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={36} style={{ color: '#2563EB', marginBottom: 6 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                    Select Invoice PDF Document
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                    Click to browse and upload official PDF tax invoice file (.pdf only)
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); modalFileInputRef.current?.click(); }}
                    style={{ marginTop: 10, padding: '7px 16px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Upload size={13} /> Browse File
                  </button>
                </div>
              )}
            </div>

            {modalUploadError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#B91C1C', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={15} /> {modalUploadError}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={() => setUploadTargetInvoice(null)}
                style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModalUpload}
                disabled={!modalUploadFile}
                style={{
                  padding: '9px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: modalUploadFile ? '#0F766E' : '#94A3B8',
                  color: '#FFFFFF',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: modalUploadFile ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: modalUploadFile ? '0 2px 6px rgba(15,118,110,0.25)' : 'none'
                }}
              >
                <Check size={15} /> Confirm & Upload Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, width: 520, padding: 26, boxShadow: '0 16px 40px rgba(15,23,42,0.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {isBuyer ? 'Pay Invoice via Razorpay' : 'Record Payment Received'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Invoice #: <strong style={{ fontFamily: 'monospace' }}>{showPaymentModal.invoiceNumber}</strong> {isBuyer && `| Supplier: ${showPaymentModal.manufacturerName || 'SunBio LifeSciences Ltd'}`}
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 }}>
              {[
                { label: 'Invoice Total Amount', value: `${getCurrencySymbol(paymentCurrency)}${showPaymentModal.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#0F172A' },
                { label: isBuyer ? 'Amount Already Paid' : 'Amount Already Received', value: `${getCurrencySymbol(paymentCurrency)}${(showPaymentModal.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#16A34A' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>{row.label}:</span>
                  <strong style={{ fontFamily: 'monospace', color: row.color }}>{row.value}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: '#475569' }}>Current Balance Due:</span>
                <strong style={{ fontFamily: 'monospace', color: '#DC2626' }}>{getCurrencySymbol(paymentCurrency)}{showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {paymentError && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} /> {paymentError}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  {isBuyer ? 'Payment Amount *' : 'Payment Amount Received *'}
                </label>
                <input type="number" step="0.01" placeholder={`Max: ${getCurrencySymbol(paymentCurrency)}${showPaymentModal.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} value={paymentAmount} onChange={e => { setPaymentAmount(e.target.value); setPaymentError(null); }} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontWeight: 700, fontSize: 15, outline: 'none' }} />

                <div style={{ display: 'flex', gap: 7, marginTop: 7, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.25 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>25%</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.5 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>50% of Outstanding</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(Math.round(showPaymentModal.balanceAmount * 0.75 * 100) / 100)); setPaymentError(null); }} style={{ height: 26, padding: '0 10px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>75%</button>
                  <button type="button" onClick={() => { setPaymentAmount(String(showPaymentModal.balanceAmount)); setPaymentError(null); }} style={{ height: 26, padding: '0 12px', borderRadius: 5, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Full Outstanding</button>
                </div>
              </div>

              {Number(paymentAmount) > 0 && !isNaN(Number(paymentAmount)) && (
                <div style={{ background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#F0FDF4' : '#EFF6FF', border: `1px solid ${Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#86EFAC' : '#93C5FD'}`, borderRadius: 8, padding: '9px 14px', fontSize: 12.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#475569', fontSize: 11.5 }}>Remaining Balance After Payment:</div>
                    <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#0F172A' }}>{getCurrencySymbol(paymentCurrency)}{Math.max(0, showPaymentModal.balanceAmount - Number(paymentAmount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 800, background: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#DCFCE7' : '#DBEAFE', color: Number(paymentAmount) >= showPaymentModal.balanceAmount ? '#15803D' : '#1D4ED8' }}>
                    {Number(paymentAmount) >= showPaymentModal.balanceAmount ? '✓ STATUS: PAID' : '↗ STATUS: PARTIALLY PAID'}
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Currency *</label>
                  <select value={paymentCurrency} onChange={e => setPaymentCurrency(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}>
                    <option value="INR">INR (₹)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Gateway / Method *</label>
                  <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                    <option value="Razorpay">Razorpay Online Gateway (UPI / Cards / NetBanking)</option>
                    <option value="Bank Transfer">Bank Transfer (Wire / BACS)</option>
                    <option value="RTGS">RTGS – Real-Time Gross Settlement</option>
                    <option value="NEFT">NEFT – National Electronic Funds Transfer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Payment Date *</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>{paymentMode === 'Razorpay' ? 'Gateway Reference ID' : 'Transaction / UTR #'}</label>
                  <input type="text" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: 12.5 }} readOnly={paymentMode === 'Razorpay'} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowPaymentModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ height: 38, padding: '0 22px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 6px rgba(15,118,110,0.2)' }}>
                  {isBuyer && paymentMode === 'Razorpay' ? <Shield size={14} /> : <Banknote size={14} />}
                  {isBuyer && paymentMode === 'Razorpay' ? 'Proceed to Razorpay →' : 'Record Payment Received'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
