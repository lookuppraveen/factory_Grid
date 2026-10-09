import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Receipt, Upload, Eye, RefreshCw, X, Download, FileText, Image as ImageIcon,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  ProformaInvoiceRecord,
  getProformaInvoice,
  saveProformaInvoice,
  generateSampleProformaInvoice
} from '../../services/proformaInvoiceService';

interface ProformaInvoiceSectionProps {
  poNumber: string;
  subOrderCode: string;
  allowUpload?: boolean; // If false or if Buyer, upload is strictly disabled
  compact?: boolean;
}

export const ProformaInvoiceSection: React.FC<ProformaInvoiceSectionProps> = ({
  poNumber,
  subOrderCode,
  allowUpload,
  compact = false,
}) => {
  const { currentRole } = useApp();

  // Strict role check: Buyer can NEVER upload or replace. Supplier can upload.
  const isSupplier = currentRole === 'SUPPLIER';
  const canUpload = allowUpload !== undefined ? allowUpload : isSupplier;

  const [actualInvoice, setActualInvoice] = useState<ProformaInvoiceRecord | null>(() => {
    return getProformaInvoice(poNumber, subOrderCode);
  });
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with storage on mount and when identifiers change
  useEffect(() => {
    const loadInvoice = () => {
      const inv = getProformaInvoice(poNumber, subOrderCode);
      setActualInvoice(inv);
    };

    loadInvoice();

    const handleStorageChange = () => {
      loadInvoice();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('proforma-invoice-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('proforma-invoice-updated', handleStorageChange);
    };
  }, [poNumber, subOrderCode]);

  // For Buyer (demo & live mode): if an actual invoice exists, use it. Otherwise, provide demo sample so View button is ALWAYS available for every PO!
  // For Supplier: only use the actual uploaded invoice.
  const effectiveInvoice: ProformaInvoiceRecord | null = canUpload
    ? actualInvoice
    : (actualInvoice || generateSampleProformaInvoice(poNumber, subOrderCode));

  // Handle File Selection & Upload (Supplier only)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate supported formats: PDF, JPG, JPEG, PNG
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    const isValidMime = file.type === 'application/pdf' || file.type.startsWith('image/');

    if (!isValidExt && !isValidMime) {
      setUploadError('Invalid format. Please upload a PDF, JPG, JPEG, or PNG invoice file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Limit size to 10 MB for browser storage
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10 MB limit. Please select a smaller document.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const displayType = isPdf ? 'PDF Document (.pdf)' : `Image (${file.type.split('/')[1]?.toUpperCase() || 'IMG'})`;
    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      const record: ProformaInvoiceRecord = {
        id: `pi-${Date.now()}`,
        poNumber: poNumber || `PO-${subOrderCode}`,
        subOrderCode: subOrderCode || poNumber,
        fileName: file.name,
        fileType: displayType,
        fileSize: formattedSize,
        fileUrl: dataUrl,
        uploadedAt: formattedDate,
      };

      saveProformaInvoice(record);
      setActualInvoice(record);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setUploadError('Failed to read the selected file. Please try again.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!effectiveInvoice?.fileUrl) return;
    const link = document.createElement('a');
    link.href = effectiveInvoice.fileUrl;
    link.download = effectiveInvoice.fileName || `Proforma_Invoice_${poNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isPdf = effectiveInvoice?.fileType?.toLowerCase().includes('pdf') ||
    effectiveInvoice?.fileName?.toLowerCase().endsWith('.pdf') ||
    effectiveInvoice?.fileUrl?.startsWith('data:application/pdf') ||
    effectiveInvoice?.fileUrl?.startsWith('data:text/html');

  return (
    <div
      style={{
        background: effectiveInvoice ? '#F8FAFC' : '#FFFFFF',
        border: `1px solid ${effectiveInvoice ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: 10,
        padding: compact ? 14 : 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Hidden file input strictly rendered only when upload is permitted */}
      {canUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg,image/jpg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={18} style={{ color: '#0F766E' }} />
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Proforma Invoice
          </div>
        </div>

        {/* Status Badge */}
        {effectiveInvoice ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 6,
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <CheckCircle2 size={12} /> Proforma Invoice Attached
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: 6,
              background: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #E2E8F0',
            }}
          >
            No Document Attached
          </span>
        )}
      </div>

      {/* Error Message */}
      {uploadError && canUpload && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Main Content: Uploaded / Ready View State vs Supplier Empty State */}
      {effectiveInvoice ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          {/* File Metadata Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: 1 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: isPdf ? '#FEE2E2' : '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: isPdf ? '#DC2626' : '#2563EB',
                border: `1px solid ${isPdf ? '#FECACA' : '#BFDBFE'}`
              }}
            >
              {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#0F766E',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}
                >
                  {effectiveInvoice.fileName}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 3 }}>
                <span>{effectiveInvoice.fileSize}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>{effectiveInvoice.fileType}</span>
                <span style={{ margin: '0 6px' }}>•</span>
                <span>Uploaded: {effectiveInvoice.uploadedAt}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: View Proforma Invoice (ALWAYS visible for Buyer) & Replace (Supplier only) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                background: '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 1px 2px rgba(15, 118, 110, 0.2)'
              }}
            >
              <Eye size={14} /> View Proforma Invoice
            </button>

            {canUpload && (
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={13} className={isUploading ? 'animate-spin' : ''} />
                {isUploading ? 'Uploading...' : 'Replace'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Supplier Empty State (Rendered strictly when Supplier has not uploaded yet) */
        <div
          style={{
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: 8,
            padding: compact ? 16 : 20,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B'
            }}
          >
            <Receipt size={18} />
          </div>

          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
              No Proforma Invoice uploaded
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Upload supplier proforma invoice in PDF, JPG, JPEG, or PNG format.
            </div>
          </div>

          {/* Upload Button: Strictly rendered for Supplier */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 4,
              padding: '8px 18px',
              borderRadius: 6,
              background: '#0F766E',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 2px rgba(15, 118, 110, 0.2)'
            }}
          >
            <Upload size={14} />
            {isUploading ? 'Uploading...' : 'Upload Proforma Invoice'}
          </button>
        </div>
      )}

      {/* ── HIGH-QUALITY INLINE PREVIEW / VIEWER MODAL ── */}
      {isViewerOpen && effectiveInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10020,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
          }}
          onClick={() => setIsViewerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 900,
              maxHeight: '92vh',
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #CBD5E1',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Viewer Header */}
            <div
              style={{
                padding: '16px 22px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Proforma Invoice Document Viewer
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'monospace' }}>
                    {effectiveInvoice.fileName}
                  </h3>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  Purchase Order: <strong style={{ fontFamily: 'monospace', color: '#0F766E' }}>{poNumber}</strong> · Size: {effectiveInvoice.fileSize} · Uploaded: {effectiveInvoice.uploadedAt}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 6,
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F766E',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Download size={14} /> Download File
                </button>
                <button
                  type="button"
                  onClick={() => setIsViewerOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Viewer Content (PDF vs Image vs Document) */}
            <div
              style={{
                flex: 1,
                padding: 16,
                background: '#0F172A',
                overflow: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 450,
                maxHeight: 'calc(92vh - 130px)'
              }}
            >
              {isPdf ? (
                <iframe
                  src={effectiveInvoice.fileUrl}
                  title={`Proforma Invoice - ${effectiveInvoice.fileName}`}
                  style={{
                    width: '100%',
                    height: '68vh',
                    minHeight: 480,
                    border: 'none',
                    borderRadius: 8,
                    background: '#FFFFFF'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 10
                  }}
                >
                  <img
                    src={effectiveInvoice.fileUrl}
                    alt={effectiveInvoice.fileName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '68vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div
              style={{
                padding: '12px 22px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Document format: <strong style={{ color: '#0F172A' }}>{effectiveInvoice.fileType}</strong>
              </div>
              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 6,
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
