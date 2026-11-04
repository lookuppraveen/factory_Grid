import React, { useState, useEffect } from 'react';
import {
  Tag, Upload, RefreshCw, Eye, Download, CheckCircle2,
  Clock, AlertCircle, XCircle, Search, FileText, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { brandTrademarkApi, BuyerTrademarkDoc } from '../../services/brandTrademarkApi';

interface Props {
  onCountChange?: (count: number) => void;
}

export const BuyerTrademarkDocumentsSection: React.FC<Props> = ({ onCountChange }) => {
  const [docs, setDocs] = useState<BuyerTrademarkDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'CONFLICT' | 'EXPIRED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<BuyerTrademarkDoc | null>(null);
  const [selectedDocForReplace, setSelectedDocForReplace] = useState<BuyerTrademarkDoc | null>(null);

  // Form state
  const [formTmName, setFormTmName] = useState('');
  const [formTmNumber, setFormTmNumber] = useState('');
  const [formTmClass, setFormTmClass] = useState('Class 5 (Pharmaceuticals & Medicinal Preparations)');
  const [formDocType, setFormDocType] = useState('Customer Uploaded TM Certificate');
  const [formVerificationSource, setFormVerificationSource] = useState('Customer Uploaded TM Certificate');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const data = await brandTrademarkApi.listBuyerTrademarkDocs();
      const list = Array.isArray(data) ? data : [];
      setDocs(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err: any) {
      console.warn('Failed to load trademark documents:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const counts = {
    all: docs.length,
    underReview: docs.filter(d => (d.status || '').toLowerCase() === 'under review').length,
    approved: docs.filter(d => (d.status || '').toLowerCase() === 'approved').length,
    conflict: docs.filter(d => (d.status || '').toLowerCase().includes('conflict')).length,
    expired: docs.filter(d => (d.status || '').toLowerCase() === 'expired').length,
  };

  const filteredDocs = docs.filter(d => {
    const matchSearch = (d.trademarkName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.tmNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.tmClass || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    const s = (d.status || '').toLowerCase();
    if (activeTab === 'UNDER_REVIEW') return s === 'under review';
    if (activeTab === 'APPROVED') return s === 'approved';
    if (activeTab === 'CONFLICT') return s.includes('conflict');
    if (activeTab === 'EXPIRED') return s === 'expired';
    return true;
  });

  const resetForm = () => {
    setFormTmName('');
    setFormTmNumber('');
    setFormTmClass('Class 5 (Pharmaceuticals & Medicinal Preparations)');
    setFormDocType('Customer Uploaded TM Certificate');
    setFormVerificationSource('Customer Uploaded TM Certificate');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormFile(null);
    setFormError(null);
  };

  const handleOpenUpload = () => {
    resetForm();
    setIsUploadOpen(true);
  };

  const handleOpenReplace = (doc: BuyerTrademarkDoc) => {
    resetForm();
    setSelectedDocForReplace(doc);
    setFormTmName(doc.trademarkName || '');
    setFormTmNumber(doc.tmNumber || '');
    setFormTmClass(doc.tmClass || 'Class 5 (Pharmaceuticals & Medicinal Preparations)');
    setFormDocType(doc.documentType || 'Customer Uploaded TM Certificate');
    setFormVerificationSource(doc.verificationSource || 'Customer Uploaded TM Certificate');
    setFormIssueDate(doc.issueDate || '');
    setFormExpiryDate(doc.expiryDate || '');
    setIsReplaceOpen(true);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTmName.trim()) {
      setFormError('Please enter the trademark name.');
      return;
    }
    if (!formFile) {
      setFormError('Please select a certificate or application filing file to upload.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('trademarkName', formTmName.trim());
    if (formTmNumber.trim()) formData.append('tmNumber', formTmNumber.trim());
    if (formTmClass.trim()) formData.append('tmClass', formTmClass.trim());
    formData.append('documentType', formDocType);
    if (formVerificationSource.trim()) formData.append('verificationSource', formVerificationSource.trim());
    if (formIssueDate) formData.append('issueDate', formIssueDate);
    if (formExpiryDate) formData.append('expiryDate', formExpiryDate);
    formData.append('file', formFile);

    try {
      await brandTrademarkApi.uploadBuyerTrademarkDoc(formData);
      setIsUploadOpen(false);
      resetForm();
      await loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload trademark document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReplace) return;
    if (!formTmName.trim()) {
      setFormError('Please enter the trademark name.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('trademarkName', formTmName.trim());
    if (formTmNumber.trim()) formData.append('tmNumber', formTmNumber.trim());
    if (formTmClass.trim()) formData.append('tmClass', formTmClass.trim());
    formData.append('documentType', formDocType);
    if (formVerificationSource.trim()) formData.append('verificationSource', formVerificationSource.trim());
    if (formIssueDate) formData.append('issueDate', formIssueDate);
    if (formExpiryDate) formData.append('expiryDate', formExpiryDate);
    if (formFile) formData.append('file', formFile);

    try {
      await brandTrademarkApi.updateBuyerTrademarkDoc(selectedDocForReplace.id, formData);
      setIsReplaceOpen(false);
      setSelectedDocForReplace(null);
      resetForm();
      await loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update trademark document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (doc: BuyerTrademarkDoc) => {
    try {
      const blob = await brandTrademarkApi.downloadBuyerTrademarkDoc(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `${doc.trademarkName}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading file: ' + (err.message || 'File not accessible.'));
    }
  };

  const renderStatusBadge = (status: BuyerTrademarkDoc['status']) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') {
      return (
        <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle2 size={13} /> APPROVED
        </span>
      );
    }
    if (s.includes('conflict')) {
      return (
        <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <XCircle size={13} /> CONFLICT FOUND
        </span>
      );
    }
    if (s === 'expired') {
      return (
        <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={13} /> EXPIRED
        </span>
      );
    }
    return (
      <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Clock size={13} /> UNDER REVIEW
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── SECTION HEADER & SUMMARY ────────────────────────── */}
      <div className="ent-panel" style={{ background: 'var(--bg-surface)' }}>
        <div className="ent-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={18} style={{ color: 'var(--c-primary)' }} />
              <div className="ent-section-title">Trademark Documents & IP Certificates</div>
            </div>
            <div className="ent-caption" style={{ marginTop: 2 }}>
              Upload and manage Trademark Registration Certificates, Form TM-A filings, and IP India authorization proofs.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadDocs}
              disabled={isLoading}
              className="ent-btn-secondary"
              style={{ height: 36, padding: '0 12px', fontSize: 12 }}
              title="Refresh Trademark Documents"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="ent-btn-primary" onClick={handleOpenUpload} style={{ height: 36 }}>
              <Upload size={14} /> Upload Trademark Document
            </button>
          </div>
        </div>

        {/* ── KPI TILES ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, padding: '12px 18px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'ALL', label: 'Total TM Docs', count: counts.all, color: '#0F172A', activeBg: '#F8FAFC' },
            { id: 'UNDER_REVIEW', label: 'Under Review', count: counts.underReview, color: '#1D4ED8', activeBg: '#EFF6FF' },
            { id: 'APPROVED', label: 'Approved', count: counts.approved, color: '#059669', activeBg: '#ECFDF5' },
            { id: 'CONFLICT', label: 'Conflict Found', count: counts.conflict, color: '#EF4444', activeBg: '#FEF2F2' },
            { id: 'EXPIRED', label: 'Expired', count: counts.expired, color: '#D97706', activeBg: '#FFFBEB' },
          ].map(t => {
            const isSelected = activeTab === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  background: isSelected ? t.activeBg : 'var(--bg-app)',
                  border: isSelected ? `1.5px solid ${t.color}` : '1px solid var(--border-subtle)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{t.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.color, marginTop: 2 }}>{t.count}</div>
              </div>
            );
          })}
        </div>

        {/* ── SEARCH & TABLE ───────────────────────────────────── */}
        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by trademark name, TM no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', height: 32, paddingLeft: 30, paddingRight: 10,
                borderRadius: 6, border: '1px solid var(--border-subtle)',
                background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: 12
              }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Showing <strong>{filteredDocs.length}</strong> of {docs.length} documents
          </div>
        </div>

        <table className="ent-table">
          <thead>
            <tr>
              <th>Trademark Name & Class</th>
              <th>TM / Application No</th>
              <th>Document Type</th>
              <th>Uploaded Date</th>
              <th>Expiry Date</th>
              <th>Verification Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
                    <span>Loading trademark documents...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Tag size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Trademark Documents Found</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.5 }}>
                      {docs.length === 0
                        ? 'You have not uploaded any trademark certificates or filings yet. Upload a Trademark Certificate to enable contract manufacturing compliance.'
                        : 'No trademark documents match the selected filter criteria.'}
                    </div>
                    {docs.length === 0 && (
                      <button className="ent-btn-primary" onClick={handleOpenUpload} style={{ marginTop: 8 }}>
                        <Upload size={14} /> Upload First Trademark Document
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocs.map(doc => (
                <React.Fragment key={doc.id}>
                  <tr>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{doc.trademarkName}</div>
                      <div className="ent-caption" style={{ color: 'var(--text-secondary)' }}>{doc.tmClass || 'Class 5 (Pharmaceuticals)'}</div>
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                      {doc.tmNumber || '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}>{doc.documentType}</div>
                      <div className="ent-caption" style={{ fontFamily: 'monospace' }}>{doc.fileName}</div>
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>
                      {doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : '—'}
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12, color: doc.expiryDate && new Date(doc.expiryDate) < new Date() ? '#EF4444' : 'var(--text-secondary)' }}>
                      {doc.expiryDate || '—'}
                    </td>
                    <td>{renderStatusBadge(doc.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="ent-btn-secondary"
                          style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                          onClick={() => setSelectedDocForView(doc)}
                          title="View Details"
                        >
                          <Eye size={12} /> View
                        </button>

                        <button
                          className="ent-btn-secondary"
                          style={{ height: 28, padding: '0 8px', fontSize: 11 }}
                          onClick={() => handleDownload(doc)}
                          title="Download Certificate"
                        >
                          <Download size={12} />
                        </button>

                        {(doc.status === 'Conflict Found' || doc.status === 'Expired' || (doc.status as string) === 'Under Review') && (
                          <button
                            className="ent-btn-primary"
                            style={{ height: 28, padding: '0 8px', fontSize: 11, background: doc.status === 'Conflict Found' ? '#EF4444' : doc.status === 'Expired' ? '#D97706' : '#0D9488' }}
                            onClick={() => handleOpenReplace(doc)}
                            title="Re-upload or Update Certificate"
                          >
                            <RefreshCw size={11} /> {doc.status === 'Conflict Found' ? 'Resolve' : doc.status === 'Expired' ? 'Renew' : 'Update'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Conflict callout banner */}
                  {(doc.status === 'Conflict Found' || doc.conflictNotes) && (
                    <tr style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
                      <td colSpan={7} style={{ padding: '8px 18px 12px 18px', borderTop: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#DC2626' }}>
                          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <strong>Trademark Conflict Recorded:</strong>{' '}
                            {doc.conflictNotes || 'Conflicting prior registered mark exists in the TM registry.'}
                            <span style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => handleOpenReplace(doc)}>
                              Click here to upload resolution or fresh certificate →
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: UPLOAD TRADEMARK DOCUMENT ─────────────────── */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Upload Trademark Document</h3>
              </div>
              <button onClick={() => { setIsUploadOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Trademark Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GLUCO-CARE"
                    value={formTmName}
                    onChange={e => setFormTmName(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>TM / Application Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TM-559012"
                    value={formTmNumber}
                    onChange={e => setFormTmNumber(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Trademark Class</label>
                  <select
                    value={formTmClass}
                    onChange={e => setFormTmClass(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Class 5 (Pharmaceuticals & Medicinal Preparations)">Class 5 (Pharmaceuticals & Medicinal Preparations)</option>
                    <option value="Class 3 (Cosmetics & Toiletries)">Class 3 (Cosmetics & Toiletries)</option>
                    <option value="Class 30 (Dietary & Herbal Supplements)">Class 30 (Dietary & Herbal Supplements)</option>
                    <option value="Class 10 (Medical Devices)">Class 10 (Medical Devices)</option>
                    <option value="Other Class">Other Class</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Type *</label>
                  <select
                    value={formDocType}
                    onChange={e => setFormDocType(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Customer Uploaded TM Certificate">Customer Uploaded TM Certificate</option>
                    <option value="Form TM-A Filing Copy">Form TM-A Filing Copy</option>
                    <option value="TM Examination Report">TM Examination Report</option>
                    <option value="Trademark Renewal Certificate">Trademark Renewal Certificate</option>
                    <option value="Other TM Document">Other TM Document</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issue / Registration Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={e => setFormIssueDate(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Select TM Certificate File * (PDF, PNG, JPG, max 25MB)
                </label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFormFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => { setIsUploadOpen(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ent-btn-primary">
                  {isSubmitting ? 'Uploading...' : 'Submit Trademark Document →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REPLACE / UPDATE TRADEMARK DOCUMENT ───────── */}
      {isReplaceOpen && selectedDocForReplace && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Update Trademark: {selectedDocForReplace.trademarkName}
                </h3>
              </div>
              <button onClick={() => { setIsReplaceOpen(false); setSelectedDocForReplace(null); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '8px 12px', background: 'rgba(29, 78, 216, 0.08)', borderRadius: 6, fontSize: 12, color: 'var(--c-primary)', fontWeight: 600 }}>
              Uploading a new certificate version will route this trademark case to Admin Trademark Verification for compliance audit.
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReplace} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Trademark Name *</label>
                  <input
                    type="text"
                    required
                    value={formTmName}
                    onChange={e => setFormTmName(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>TM / Application Number</label>
                  <input
                    type="text"
                    value={formTmNumber}
                    onChange={e => setFormTmNumber(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Trademark Class</label>
                  <select
                    value={formTmClass}
                    onChange={e => setFormTmClass(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Class 5 (Pharmaceuticals & Medicinal Preparations)">Class 5 (Pharmaceuticals & Medicinal Preparations)</option>
                    <option value="Class 3 (Cosmetics & Toiletries)">Class 3 (Cosmetics & Toiletries)</option>
                    <option value="Class 30 (Dietary & Herbal Supplements)">Class 30 (Dietary & Herbal Supplements)</option>
                    <option value="Class 10 (Medical Devices)">Class 10 (Medical Devices)</option>
                    <option value="Other Class">Other Class</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Type *</label>
                  <select
                    value={formDocType}
                    onChange={e => setFormDocType(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Customer Uploaded TM Certificate">Customer Uploaded TM Certificate</option>
                    <option value="Form TM-A Filing Copy">Form TM-A Filing Copy</option>
                    <option value="TM Examination Report">TM Examination Report</option>
                    <option value="Trademark Renewal Certificate">Trademark Renewal Certificate</option>
                    <option value="Other TM Document">Other TM Document</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Issue Date</label>
                  <input
                    type="date"
                    value={formIssueDate}
                    onChange={e => setFormIssueDate(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={e => setFormExpiryDate(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Upload New / Corrected Certificate (Optional if only metadata updating)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFormFile(e.target.files[0]);
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Current File: {selectedDocForReplace.fileName}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => { setIsReplaceOpen(false); setSelectedDocForReplace(null); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="ent-btn-primary">
                  {isSubmitting ? 'Updating...' : 'Save & Resubmit →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW TRADEMARK DOCUMENT DETAILS ───────────── */}
      {selectedDocForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Trademark: "{selectedDocForView.trademarkName}"
                </h3>
              </div>
              <button onClick={() => setSelectedDocForView(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>DOCUMENT TYPE</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{selectedDocForView.documentType}</div>
                </div>
                <div>{renderStatusBadge(selectedDocForView.status)}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Trademark Name:</span> <strong>{selectedDocForView.trademarkName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>TM Number:</span> <code className="ent-mono">{selectedDocForView.tmNumber || '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Class:</span> <strong>{selectedDocForView.tmClass || 'Class 5'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span> <code className="ent-mono">{selectedDocForView.expiryDate || '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Uploaded:</span> <code className="ent-mono">{selectedDocForView.createdAt ? new Date(selectedDocForView.createdAt).toISOString().split('T')[0] : '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>File Name:</span> <code className="ent-mono">{selectedDocForView.fileName}</code>
                </div>
              </div>

              {selectedDocForView.conflictNotes && (
                <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12 }}>
                  <strong>Admin Conflict Notes:</strong> {selectedDocForView.conflictNotes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedDocForView(null)} className="ent-btn-secondary">
                Close
              </button>
              <button onClick={() => handleDownload(selectedDocForView)} className="ent-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Download size={13} /> Download Certificate File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
