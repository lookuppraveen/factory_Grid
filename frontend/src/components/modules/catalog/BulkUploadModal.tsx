import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, AlertTriangle, CheckCircle2,
  X, RefreshCw, AlertCircle
} from 'lucide-react';
import { catalogApi } from '../../../services/catalogApi';
import { manufacturerProductsApi } from '../../../services/manufacturerProductsApi';

export interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'admin' | 'manufacturer';
  mfgDisplayName?: string;
  mfgCode?: string;
}

interface UploadRowError {
  row: number;
  field: string;
  message: string;
}

interface UploadResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  errors: UploadRowError[];
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  type,
  mfgDisplayName = 'Facility',
  mfgCode = 'MFG-001',
}) => {
  const [activeTab, setActiveTab] = useState<'FILE' | 'PASTE'>('FILE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // ── CSV Template Generation ───────────────────────────────────────────
  const handleDownloadTemplate = () => {
    let headers: string[];
    let sampleRows: string[][];

    if (type === 'manufacturer') {
      headers = [
        'product_type',
        'category',
        'sub_category',
        'sub_sub_category',
        'product_code',
        'name',
        'generic_name',
        'strength',
        'dosage_form',
        'pack_size',
        'base_uom',
        'description',
        'manufacturer_product_code',
        'moq',
        'lead_time_days',
        'packaging_details'
      ];
      sampleRows = [
        [
          'pt_med',
          'Drugs',
          'Tablets',
          'Film Coated Tablets',
          'PRD-AMX-500',
          'Amoxicillin 500mg Capsules',
          'Amoxicillin Trihydrate',
          '500mg',
          'Capsule',
          '10 x 10 Strip',
          'Strip',
          'Broad-spectrum aminopenicillin formulation',
          `${mfgCode}-AMX-500`,
          '5000',
          '14',
          'Standard Alu-Alu Blister Strip Packaging'
        ],
        [
          'pt_med',
          'Drugs',
          'Tablets',
          'Dispersible Tablets',
          'PRD-PCM-650',
          'Paracetamol 650mg Tablets',
          'Paracetamol IP',
          '650mg',
          'Tablet',
          '10 x 10 Strip',
          'Strip',
          'Antipyretic and analgesic oral solid dosage form',
          `${mfgCode}-PCM-650`,
          '10000',
          '10',
          'PVC Blister with Cartons of 100 Strips'
        ]
      ];
    } else {
      headers = [
        'product_type',
        'category',
        'sub_category',
        'sub_sub_category',
        'product_code',
        'name',
        'generic_name',
        'strength',
        'dosage_form',
        'pack_size',
        'base_uom',
        'brand',
        'description'
      ];
      sampleRows = [
        [
          'pt_med',
          'Drugs',
          'Tablets',
          'Film Coated Tablets',
          'PRD-AMX-500',
          'Amoxicillin 500mg Capsules',
          'Amoxicillin Trihydrate',
          '500mg',
          'Capsule',
          '10 x 10 Strip',
          'Strip',
          'Apex Brand',
          'Broad-spectrum aminopenicillin formulation'
        ],
        [
          'pt_med',
          'Drugs',
          'Tablets',
          'Dispersible Tablets',
          'PRD-PCM-650',
          'Paracetamol 650mg Tablets',
          'Paracetamol IP',
          '650mg',
          'Tablet',
          '10 x 10 Strip',
          'Strip',
          'Horizon Pharma',
          'Antipyretic and analgesic oral solid dosage form'
        ]
      ];
    }

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_product_catalog_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── CSV Line Parser ───────────────────────────────────────────────────
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const parseCSVContent = (content: string) => {
    setErrorMessage(null);
    setUploadResult(null);

    const rawLines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (rawLines.length < 2) {
      setErrorMessage('The CSV must contain a header row and at least 1 data row.');
      return;
    }

    const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < rawLines.length; i++) {
      const values = parseCSVLine(rawLines[i]);
      if (values.every(v => v === '')) continue;

      const rowObj: Record<string, any> = { row: i };
      headers.forEach((h, colIdx) => {
        const val = values[colIdx] ?? '';
        if (h === 'name' || h === 'productname') rowObj.name = val;
        else if (h === 'productcode' || h === 'code' || h === 'sku') rowObj.productCode = val;
        else if (h === 'category' || h === 'categoryname') rowObj.category = val;
        else if (h === 'subcategory') rowObj.subCategory = val;
        else if (h === 'subsubcategory') rowObj.subSubCategory = val;
        else if (h === 'producttype' || h === 'producttypeid') rowObj.productTypeId = val;
        else if (h === 'genericname' || h === 'molecule') rowObj.genericName = val;
        else if (h === 'strength' || h === 'potency') rowObj.strength = val;
        else if (h === 'dosageform' || h === 'form') rowObj.dosageForm = val;
        else if (h === 'packsize' || h === 'packaging') rowObj.packSize = val;
        else if (h === 'baseuom' || h === 'uom') rowObj.baseUom = val;
        else if (h === 'brand' || h === 'brandname') rowObj.brand = val;
        else if (h === 'description') rowObj.description = val;
        else if (h === 'manufacturerproductcode' || h === 'manufacturersku' || h === 'mfgcode') rowObj.manufacturerProductCode = val;
        else if (h === 'moq' || h === 'minimumorderquantity') rowObj.moq = Number(val) || undefined;
        else if (h === 'leadtimedays' || h === 'leadtime') rowObj.leadTimeDays = Number(val) || undefined;
        else if (h === 'packagingdetails') rowObj.packagingDetails = val;
      });

      rows.push(rowObj);
    }

    if (rows.length === 0) {
      setErrorMessage('No valid product rows were detected in the file.');
      return;
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVContent(text);
    };
    reader.onerror = () => {
      setErrorMessage('Could not read the uploaded file. Please verify it is a valid text or CSV file.');
    };
    reader.readAsText(file);
  };

  const handleApplyPasteText = () => {
    if (!pasteText.trim()) {
      setErrorMessage('Please paste comma-separated or tab-separated text.');
      return;
    }
    let normalized = pasteText;
    if (pasteText.includes('\t')) {
      normalized = pasteText.split('\n').map(line =>
        line.split('\t').map(c => `"${c.replace(/"/g, '""')}"`).join(',')
      ).join('\n');
    }
    setFileName('Pasted_Data.csv');
    parseCSVContent(normalized);
  };

  // ── Submit Bulk Upload to Real Backend APIs ───────────────────────────
  const handleSubmitUpload = async () => {
    if (parsedRows.length === 0) {
      setErrorMessage('Please upload or paste data rows first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      let res: any;
      if (type === 'manufacturer') {
        res = await manufacturerProductsApi.bulkUpload(parsedRows);
      } else {
        res = await catalogApi.bulkUploadProducts(parsedRows);
      }

      setUploadResult({
        totalRows: res.totalRows ?? parsedRows.length,
        successfulRows: res.successfulRows ?? 0,
        failedRows: res.failedRows ?? 0,
        duplicateRows: res.duplicateRows ?? 0,
        errors: res.errors || [],
      });
    } catch (err: any) {
      console.error('Bulk upload submission failed:', err);
      setErrorMessage(err?.message || 'Server error processing bulk upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName(null);
    setPasteText('');
    setUploadResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          maxWidth: 780,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '1px solid #E2E8F0', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#F0FDFA',
              border: '1px solid #99F6E4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0F766E'
            }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {type === 'manufacturer' ? 'Bulk Upload Facility Products' : 'Bulk Upload Master Catalog Products'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
                {type === 'manufacturer'
                  ? `Import and map multiple formulations directly to ${mfgDisplayName} via Excel / CSV.`
                  : 'Import multiple formulations into the central master catalogue with automatic validation.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '12px 16px',
            color: '#B91C1C',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── STEP 2: RESULTS VIEW (If upload completed) ─────────────── */}
        {uploadResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Rows</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{uploadResult.totalRows}</div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Imported</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{uploadResult.successfulRows}</div>
              </div>
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Failed</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{uploadResult.failedRows}</div>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', textTransform: 'uppercase' }}>Duplicates</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>{uploadResult.duplicateRows}</div>
              </div>
            </div>

            {/* Error Detail Table */}
            {uploadResult.errors.length > 0 ? (
              <div style={{ border: '1px solid #FCA5A5', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#FEF2F2', padding: '10px 16px', borderBottom: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 700, fontSize: 13 }}>
                  <AlertCircle size={16} /> Row Validation Issues ({uploadResult.errors.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: '8px 14px', width: 70 }}>Row #</th>
                        <th style={{ padding: '8px 14px', width: 140 }}>Field</th>
                        <th style={{ padding: '8px 14px' }}>Validation Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.errors.map((err, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0F172A' }}>Row {err.row}</td>
                          <td style={{ padding: '8px 14px', fontFamily: 'monospace', color: '#B91C1C' }}>{err.field}</td>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 18, display: 'flex', alignItems: 'center', gap: 12, color: '#065F46' }}>
                <CheckCircle2 size={24} color="#059669" />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>All records verified and successfully persisted to PostgreSQL!</div>
                  <div style={{ fontSize: 12.5, marginTop: 2, color: '#047857' }}>
                    {uploadResult.successfulRows} product(s) have been added to your live catalog database.
                  </div>
                </div>
              </div>
            )}

            {/* Success Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Upload Another File
              </button>
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(15,118,110,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <CheckCircle2 size={16} /> Complete & Refresh Catalog
              </button>
            </div>
          </div>
        ) : (
          /* ── STEP 1: FILE PICKER & PREVIEW ────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Step 1 Instructions & Template Download */}
            <div style={{
              background: '#F0FDFA',
              border: '1px solid #CCFBF1',
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F766E' }}>
                  Download the official FactoryGrid product import template
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Pre-formatted with supported columns: Category, Product Code, Name, Generic, Form, Pack Size, MOQ & Schedule.
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Download size={15} /> Download Template (.csv)
              </button>
            </div>

            {/* Input Mode Selector */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab('FILE')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeTab === 'FILE' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: activeTab === 'FILE' ? '#0F766E' : '#F8FAFC',
                  color: activeTab === 'FILE' ? '#FFFFFF' : '#475569'
                }}
              >
                Upload File (.csv / .xlsx)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PASTE')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeTab === 'PASTE' ? '1px solid #0F766E' : '1px solid #CBD5E1',
                  background: activeTab === 'PASTE' ? '#0F766E' : '#F8FAFC',
                  color: activeTab === 'PASTE' ? '#FFFFFF' : '#475569'
                }}
              >
                Paste CSV / Spreadsheet Data
              </button>
            </div>

            {/* Tab 1: File Dropzone */}
            {activeTab === 'FILE' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 12,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#F8FAFC',
                  transition: 'all 0.15s ease'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#E0F2FE', color: '#0284C7', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={26} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  {fileName ? fileName : 'Click to browse or drag and drop your CSV / Excel file'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Supports UTF-8 CSV, Comma-delimited and Tab-delimited files up to 10MB
                </div>
              </div>
            ) : (
              /* Tab 2: Paste Data */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste table columns from Excel or Google Sheets here (including header row)..."
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    fontSize: 12.5,
                    fontFamily: 'monospace',
                    outline: 'none',
                    background: '#F8FAFC'
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyPasteText}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#1E293B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Parse Pasted Table
                </button>
              </div>
            )}

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    Preview: {parsedRows.length} Formulation(s) Parsed
                  </div>
                  <button
                    onClick={handleReset}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear Data
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflowX: 'auto', maxHeight: 200 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>#</th>
                        <th style={{ padding: '8px 12px' }}>Product Name</th>
                        <th style={{ padding: '8px 12px' }}>Code / SKU</th>
                        <th style={{ padding: '8px 12px' }}>Category</th>
                        <th style={{ padding: '8px 12px' }}>Dosage Form</th>
                        <th style={{ padding: '8px 12px' }}>Pack Size</th>
                        {type === 'manufacturer' && <th style={{ padding: '8px 12px' }}>MOQ</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 12px', color: '#94A3B8' }}>{i + 1}</td>
                          <td style={{ padding: '6px 12px', fontWeight: 600, color: '#0F172A' }}>{r.name || '—'}</td>
                          <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#0F766E' }}>{r.productCode || r.manufacturerProductCode || 'AUTO'}</td>
                          <td style={{ padding: '6px 12px', color: '#475569' }}>{r.category || '—'}</td>
                          <td style={{ padding: '6px 12px', color: '#475569' }}>{r.dosageForm || r.subCategory || '—'}</td>
                          <td style={{ padding: '6px 12px', color: '#475569' }}>{r.packSize || '—'}</td>
                          {type === 'manufacturer' && <td style={{ padding: '6px 12px', fontWeight: 600 }}>{r.moq || 1000}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 10 && (
                  <div style={{ fontSize: 11.5, color: '#64748B', fontStyle: 'italic' }}>
                    + {parsedRows.length - 10} additional rows ready for database import
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitUpload}
                disabled={isProcessing || parsedRows.length === 0}
                style={{
                  padding: '9px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: parsedRows.length === 0 ? '#94A3B8' : '#0F766E',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isProcessing || parsedRows.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 1px 3px rgba(15,118,110,0.3)'
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Validating & Importing...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    Confirm & Import ({parsedRows.length}) Rows
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

