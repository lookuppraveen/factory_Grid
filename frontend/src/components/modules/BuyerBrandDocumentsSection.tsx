import React, { useState, useEffect } from 'react';
import {
  Award, Upload, RefreshCw, Eye, Download, CheckCircle2,
  Clock, AlertCircle, XCircle, Search, FileText, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { brandTrademarkApi, BuyerBrandDoc } from '../../services/brandTrademarkApi';

interface Props {
  onCountChange?: (count: number) => void;
}

export const BuyerBrandDocumentsSection: React.FC<Props> = ({ onCountChange }) => {
  const [docs, setDocs] = useState<BuyerBrandDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'AUTH_REQUIRED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<BuyerBrandDoc | null>(null);
  const [selectedDocForReplace, setSelectedDocForReplace] = useState<BuyerBrandDoc | null>(null);

  // Form state
  const [formBrandName, setFormBrandName] = useState('');
  const [formBrandRef, setFormBrandRef] = useState('');
  const [formDocType, setFormDocType] = useState('Letter of Authorization (LOA)');
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formDosageForm, setFormDosageForm] = useState('');
  const [formTmRegNo, setFormTmRegNo] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const data = await brandTrademarkApi.listBuyerBrandDocs();
      const list = Array.isArray(data) ? data : [];
      setDocs(list);
      if (onCountChange) onCountChange(list.length);
    } catch (err: any) {
      console.warn('Failed to load brand documents:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const counts = {
    all: docs.length,
    underReview: docs.filter(d => d.status === 'UNDER REVIEW' || (d.status as string) === 'PENDING').length,
    approved: docs.filter(d => d.status === 'BRAND APPROVED').length,
    authRequired: docs.filter(d => d.status === 'AUTHORIZATION REQUIRED').length,
    rejected: docs.filter(d => d.status === 'BRAND REJECTED').length,
  };

  const filteredDocs = docs.filter(d => {
    const matchSearch = (d.brandName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === 'UNDER_REVIEW') return d.status === 'UNDER REVIEW' || (d.status as string) === 'PENDING';
    if (activeTab === 'APPROVED') return d.status === 'BRAND APPROVED';
    if (activeTab === 'AUTH_REQUIRED') return d.status === 'AUTHORIZATION REQUIRED';
    if (activeTab === 'REJECTED') return d.status === 'BRAND REJECTED';
    return true;
  });

  const resetForm = () => {
    setFormBrandName('');
    setFormBrandRef('');
    setFormDocType('Letter of Authorization (LOA)');
    setFormDocNumber('');
    setFormDosageForm('');
    setFormTmRegNo('');
    setFormIssueDate('');
    setFormExpiryDate('');
    setFormFile(null);
    setFormError(null);
  };

  const handleOpenUpload = () => {
    resetForm();
    setIsUploadOpen(true);
  };

  const handleOpenReplace = (doc: BuyerBrandDoc) => {
    resetForm();
    setSelectedDocForReplace(doc);
    setFormBrandName(doc.brandName || '');
    setFormBrandRef(doc.brandReference || '');
    setFormDocType(doc.documentType || 'Letter of Authorization (LOA)');
    setFormDocNumber(doc.documentNumber || '');
    setFormDosageForm(doc.dosageForm || '');
    setFormTmRegNo(doc.tmRegistrationNo || '');
    setFormIssueDate(doc.issueDate || '');
    setFormExpiryDate(doc.expiryDate || '');
    setIsReplaceOpen(true);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrandName.trim()) {
      setFormError('Please enter the brand name.');
      return;
    }
    if (!formFile) {
      setFormError('Please select a document file to upload (PDF, PNG, JPG).');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('brandName', formBrandName.trim());
    if (formBrandRef.trim()) formData.append('brandReference', formBrandRef.trim());
    formData.append('documentType', formDocType);
    if (formDocNumber.trim()) formData.append('documentNumber', formDocNumber.trim());
    if (formDosageForm.trim()) formData.append('dosageForm', formDosageForm.trim());
    if (formTmRegNo.trim()) formData.append('tmRegistrationNo', formTmRegNo.trim());
    if (formIssueDate) formData.append('issueDate', formIssueDate);
    if (formExpiryDate) formData.append('expiryDate', formExpiryDate);
    formData.append('file', formFile);

    try {
      await brandTrademarkApi.uploadBuyerBrandDoc(formData);
      setIsUploadOpen(false);
      resetForm();
      await loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to upload brand document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReplace) return;
    if (!formBrandName.trim()) {
      setFormError('Please enter the brand name.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('brandName', formBrandName.trim());
    if (formBrandRef.trim()) formData.append('brandReference', formBrandRef.trim());
    formData.append('documentType', formDocType);
    if (formDocNumber.trim()) formData.append('documentNumber', formDocNumber.trim());
    if (formDosageForm.trim()) formData.append('dosageForm', formDosageForm.trim());
    if (formTmRegNo.trim()) formData.append('tmRegistrationNo', formTmRegNo.trim());
    if (formIssueDate) formData.append('issueDate', formIssueDate);
    if (formExpiryDate) formData.append('expiryDate', formExpiryDate);
    if (formFile) formData.append('file', formFile);

    try {
      await brandTrademarkApi.updateBuyerBrandDoc(selectedDocForReplace.id, formData);
      setIsReplaceOpen(false);
      setSelectedDocForReplace(null);
      resetForm();
      await loadDocs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update brand document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (doc: BuyerBrandDoc) => {
    try {
      const blob = await brandTrademarkApi.downloadBuyerBrandDoc(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `${doc.brandName}_brand_document.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading file: ' + (err.message || 'File not accessible.'));
    }
  };

  const renderStatusBadge = (status: BuyerBrandDoc['status']) => {
    switch (status) {
      case 'BRAND APPROVED':
        return (
          <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} /> BRAND APPROVED
          </span>
        );
      case 'AUTHORIZATION REQUIRED':
        return (
          <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={13} /> ACTION REQUIRED
          </span>
        );
      case 'BRAND REJECTED':
        return (
          <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={13} /> REJECTED
          </span>
        );
      default:
        return (
          <span style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11.5, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> UNDER REVIEW
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── SECTION HEADER & SUMMARY ────────────────────────── */}
      <div className="ent-panel" style={{ background: 'var(--bg-surface)' }}>
        <div className="ent-panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} style={{ color: 'var(--c-primary)' }} />
              <div className="ent-section-title">Brand Documents & LOA Authorizations</div>
            </div>
            <div className="ent-caption" style={{ marginTop: 2 }}>
              Upload and manage Letters of Authorization (LOA), Trademark Licensing Agreements, and artwork clearance proofs for pharma contract manufacturing.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={loadDocs}
              disabled={isLoading}
              className="ent-btn-secondary"
              style={{ height: 36, padding: '0 12px', fontSize: 12 }}
              title="Refresh Brand Documents"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button className="ent-btn-primary" onClick={handleOpenUpload} style={{ height: 36 }}>
              <Upload size={14} /> Upload Brand Document
            </button>
          </div>
        </div>

        {/* ── KPI TILES ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, padding: '12px 18px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'ALL', label: 'Total Brand Docs', count: counts.all, color: '#0F172A', activeBg: '#F8FAFC' },
            { id: 'UNDER_REVIEW', label: 'Under Review', count: counts.underReview, color: '#1D4ED8', activeBg: '#EFF6FF' },
            { id: 'APPROVED', label: 'Approved', count: counts.approved, color: '#059669', activeBg: '#ECFDF5' },
            { id: 'AUTH_REQUIRED', label: 'Action Required', count: counts.authRequired, color: '#DB2777', activeBg: '#FDF2F8' },
            { id: 'REJECTED', label: 'Rejected', count: counts.rejected, color: '#DC2626', activeBg: '#FEF2F2' },
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
              placeholder="Search by brand name, doc type..."
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
              <th>Brand Name & Reference</th>
              <th>Document Type</th>
              <th>Document Number</th>
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
                    <span>Loading brand documents...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-tertiary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Award size={40} style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>No Brand Documents Found</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.5 }}>
                      {docs.length === 0
                        ? 'You have not uploaded any brand authorization or licensing documents yet. Upload an LOA or TM Licensing Agreement to enable contract manufacturing.'
                        : 'No brand documents match the selected filter criteria.'}
                    </div>
                    {docs.length === 0 && (
                      <button className="ent-btn-primary" onClick={handleOpenUpload} style={{ marginTop: 8 }}>
                        <Upload size={14} /> Upload First Brand Document
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
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{doc.brandName}</div>
                      {doc.brandReference && (
                        <div className="ent-caption" style={{ color: 'var(--text-secondary)' }}>Ref: {doc.brandReference}</div>
                      )}
                      {doc.dosageForm && (
                        <div style={{ fontSize: 11, color: '#64748B' }}>Form: {doc.dosageForm}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}>{doc.documentType}</div>
                      <div className="ent-caption" style={{ fontFamily: 'monospace' }}>{doc.fileName}</div>
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>
                      {doc.documentNumber || '—'}
                      {doc.tmRegistrationNo && (
                        <div style={{ fontSize: 10.5, color: '#64748B' }}>TM: {doc.tmRegistrationNo}</div>
                      )}
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
                          title="Download Document"
                        >
                          <Download size={12} />
                        </button>

                        {(doc.status === 'AUTHORIZATION REQUIRED' || doc.status === 'BRAND REJECTED' || doc.status === 'UNDER REVIEW') && (
                          <button
                            className="ent-btn-primary"
                            style={{ height: 28, padding: '0 8px', fontSize: 11, background: doc.status === 'AUTHORIZATION REQUIRED' ? '#DB2777' : doc.status === 'BRAND REJECTED' ? '#DC2626' : '#0D9488' }}
                            onClick={() => handleOpenReplace(doc)}
                            title="Re-upload or Update Document"
                          >
                            <RefreshCw size={11} /> {doc.status === 'AUTHORIZATION REQUIRED' ? 'Submit LOA' : 'Update'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Remarks callout banner if Rejected or Action Required */}
                  {(doc.status === 'AUTHORIZATION REQUIRED' || doc.status === 'BRAND REJECTED') && (
                    <tr style={{ background: doc.status === 'BRAND REJECTED' ? 'rgba(239, 68, 68, 0.04)' : 'rgba(219, 39, 119, 0.04)' }}>
                      <td colSpan={7} style={{ padding: '8px 18px 12px 18px', borderTop: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: doc.status === 'BRAND REJECTED' ? '#DC2626' : '#DB2777' }}>
                          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <strong>{doc.status === 'BRAND REJECTED' ? 'Rejection Reason:' : 'LOA Authorization Required:'}</strong>{' '}
                            {doc.status === 'BRAND REJECTED' ? (doc.rejectionReason || 'Document did not satisfy verification criteria.') : (doc.authNotes || 'Fresh notarized Letter of Authorization requested by reviewer.')}
                            <span style={{ marginLeft: 8, fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => handleOpenReplace(doc)}>
                              Click here to re-upload corrected document →
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

      {/* ── MODAL: UPLOAD BRAND DOCUMENT ─────────────────────── */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Award size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Upload Brand Document</h3>
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CROCIN PLUS"
                    value={formBrandName}
                    onChange={e => setFormBrandName(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Brand Reference / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. BR-2026-90"
                    value={formBrandRef}
                    onChange={e => setFormBrandRef(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Type *</label>
                  <select
                    value={formDocType}
                    onChange={e => setFormDocType(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Letter of Authorization (LOA)">Letter of Authorization (LOA)</option>
                    <option value="Trademark Licensing Agreement">Trademark Licensing Agreement</option>
                    <option value="Approved Artwork & Labeling Proof">Approved Artwork & Labeling Proof</option>
                    <option value="Formula Non-Infringement Undertaking">Formula Non-Infringement Undertaking</option>
                    <option value="Other Brand Document">Other Brand Document</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number</label>
                  <input
                    type="text"
                    placeholder="e.g. LOA-908124"
                    value={formDocNumber}
                    onChange={e => setFormDocNumber(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Dosage Form / Pack</label>
                  <input
                    type="text"
                    placeholder="e.g. Tablets 500mg, Strip of 10"
                    value={formDosageForm}
                    onChange={e => setFormDosageForm(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>TM Registration No</label>
                  <input
                    type="text"
                    placeholder="e.g. TM-908124"
                    value={formTmRegNo}
                    onChange={e => setFormTmRegNo(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
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

              {/* File upload picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Select Document File * (PDF, PNG, JPG, max 25MB)</label>
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
                  {isSubmitting ? 'Uploading...' : 'Submit Brand Document →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REPLACE / UPDATE BRAND DOCUMENT ───────────── */}
      {isReplaceOpen && selectedDocForReplace && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RefreshCw size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Update / Re-upload: {selectedDocForReplace.brandName}
                </h3>
              </div>
              <button onClick={() => { setIsReplaceOpen(false); setSelectedDocForReplace(null); resetForm(); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '8px 12px', background: 'rgba(29, 78, 216, 0.08)', borderRadius: 6, fontSize: 12, color: 'var(--c-primary)', fontWeight: 600 }}>
              Uploading a new document version will route this brand case to Admin Brand Verification for compliance review.
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
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formBrandName}
                    onChange={e => setFormBrandName(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Brand Reference / Code</label>
                  <input
                    type="text"
                    value={formBrandRef}
                    onChange={e => setFormBrandRef(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Type *</label>
                  <select
                    value={formDocType}
                    onChange={e => setFormDocType(e.target.value)}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="Letter of Authorization (LOA)">Letter of Authorization (LOA)</option>
                    <option value="Trademark Licensing Agreement">Trademark Licensing Agreement</option>
                    <option value="Approved Artwork & Labeling Proof">Approved Artwork & Labeling Proof</option>
                    <option value="Formula Non-Infringement Undertaking">Formula Non-Infringement Undertaking</option>
                    <option value="Other Brand Document">Other Brand Document</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number</label>
                  <input
                    type="text"
                    value={formDocNumber}
                    onChange={e => setFormDocNumber(e.target.value)}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
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
                  Upload New / Corrected File (Optional if only metadata updating)
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

      {/* ── MODAL: VIEW BRAND DOCUMENT DETAILS ───────────────── */}
      {selectedDocForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} style={{ color: 'var(--c-primary)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Brand Document: {selectedDocForView.brandName}
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
                  <span style={{ color: 'var(--text-secondary)' }}>Brand Name:</span> <strong>{selectedDocForView.brandName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Document No:</span> <code className="ent-mono">{selectedDocForView.documentNumber || '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Uploaded:</span> <code className="ent-mono">{selectedDocForView.createdAt ? new Date(selectedDocForView.createdAt).toISOString().split('T')[0] : '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Expiry Date:</span> <code className="ent-mono">{selectedDocForView.expiryDate || '—'}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>File Name:</span> <code className="ent-mono">{selectedDocForView.fileName}</code>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>File Size:</span> <span>{Math.round(selectedDocForView.fileSize / 1024)} KB</span>
                </div>
              </div>

              {selectedDocForView.rejectionReason && (
                <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12 }}>
                  <strong>Admin Rejection Reason:</strong> {selectedDocForView.rejectionReason}
                </div>
              )}

              {selectedDocForView.authNotes && (
                <div style={{ marginTop: 6, padding: '10px 14px', borderRadius: 6, background: '#FDF2F8', border: '1px solid #FBCFE8', color: '#DB2777', fontSize: 12 }}>
                  <strong>Admin LOA Request Notes:</strong> {selectedDocForView.authNotes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedDocForView(null)} className="ent-btn-secondary">
                Close
              </button>
              <button onClick={() => handleDownload(selectedDocForView)} className="ent-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Download size={13} /> Download Original Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
