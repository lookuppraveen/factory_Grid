import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, Download, Building2,
  Award, Check, User, Plus, FileCheck, Shield, Tag, AlertCircle
} from 'lucide-react';

export type BrandStatus = 'PENDING' | 'UNDER REVIEW' | 'BRAND APPROVED' | 'BRAND REJECTED' | 'AUTHORIZATION REQUIRED';
export type CheckState = 'Pending' | 'Verified' | 'Failed';

export interface BrandDocItem {
  id: string;
  docType: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Submitted' | 'Verified' | 'Pending' | 'Rejected';
}

export interface BrandRecord {
  id: string;
  brandName: string;
  customerName: string;
  customerCode: string;
  submissionDate: string;
  status: BrandStatus;
  tmRegistrationNo: string;
  dosageForm: string;
  checks: {
    loaAuth: CheckState;
    tmAgreement: CheckState;
    formulaClearance: CheckState;
    artworkCompliance: CheckState;
  };
  documents: BrandDocItem[];
  rejectionReason?: string;
  authNotes?: string;
  approvedAt?: string;
}

const INITIAL_BRAND_RECORDS: BrandRecord[] = [
  {
    id: 'bv-rec-201',
    brandName: 'CROCIN PLUS',
    customerName: 'ABC Pharma Pvt Ltd',
    customerCode: 'CUS-2026-012',
    submissionDate: '2026-08-05',
    status: 'UNDER REVIEW',
    tmRegistrationNo: 'TM-908124',
    dosageForm: 'Paracetamol & Caffeine Tablets (500mg/65mg)',
    checks: {
      loaAuth: 'Verified',
      tmAgreement: 'Verified',
      formulaClearance: 'Pending',
      artworkCompliance: 'Pending'
    },
    documents: [
      { id: 'bd1', docType: 'Letter of Authorization (LOA)', fileName: 'LOA_GSK_ABCPharma_Signed.pdf', fileSize: '1.4 MB', uploadedAt: '2026-08-05', status: 'Submitted' },
      { id: 'bd2', docType: 'Trademark Licensing Agreement', fileName: 'TM_License_Agreement_Crocin.pdf', fileSize: '2.8 MB', uploadedAt: '2026-08-05', status: 'Submitted' },
      { id: 'bd3', docType: 'Approved Artwork & Labeling Proof', fileName: 'CrocinPlus_Blister_Artwork_v2.pdf', fileSize: '4.1 MB', uploadedAt: '2026-08-05', status: 'Submitted' },
      { id: 'bd4', docType: 'Formula Non-Infringement Undertaking', fileName: 'Non_Infringement_Undertaking.pdf', fileSize: '850 KB', uploadedAt: '2026-08-05', status: 'Submitted' }
    ]
  },
  {
    id: 'bv-rec-202',
    brandName: 'NEOSPORIN OINTMENT',
    customerName: 'Zenith Global Exporters',
    customerCode: 'CUS-2026-044',
    submissionDate: '2026-08-02',
    status: 'AUTHORIZATION REQUIRED',
    tmRegistrationNo: 'TM-339012',
    dosageForm: 'Neomycin & Polymyxin B Ointment 20g',
    checks: {
      loaAuth: 'Failed',
      tmAgreement: 'Pending',
      formulaClearance: 'Verified',
      artworkCompliance: 'Pending'
    },
    authNotes: 'LOA submitted was expired on 30-Jun-2026. Fresh notarized Letter of Authorization required from brand owner.',
    documents: [
      { id: 'bd21', docType: 'Letter of Authorization (LOA)', fileName: 'LOA_Expired_Neosporin.pdf', fileSize: '1.2 MB', uploadedAt: '2026-08-02', status: 'Rejected' },
      { id: 'bd22', docType: 'Trademark Licensing Agreement', fileName: 'TM_License_Draft.pdf', fileSize: '2.1 MB', uploadedAt: '2026-08-02', status: 'Pending' },
      { id: 'bd23', docType: 'Approved Artwork & Labeling Proof', fileName: 'Tube_Packaging_Proof.pdf', fileSize: '3.5 MB', uploadedAt: '2026-08-02', status: 'Submitted' },
      { id: 'bd24', docType: 'Formula Non-Infringement Undertaking', fileName: 'Undertaking_Zenith.pdf', fileSize: '900 KB', uploadedAt: '2026-08-02', status: 'Submitted' }
    ]
  },
  {
    id: 'bv-rec-203',
    brandName: 'PANTO-D MAX',
    customerName: 'Apex Health Formulations',
    customerCode: 'CUS-2026-089',
    submissionDate: '2026-07-28',
    status: 'BRAND APPROVED',
    tmRegistrationNo: 'TM-771802',
    dosageForm: 'Pantoprazole & Domperidone SR Capsules',
    checks: {
      loaAuth: 'Verified',
      tmAgreement: 'Verified',
      formulaClearance: 'Verified',
      artworkCompliance: 'Verified'
    },
    approvedAt: '2026-07-30',
    documents: [
      { id: 'bd31', docType: 'Letter of Authorization (LOA)', fileName: 'Apex_LOA_Official.pdf', fileSize: '1.6 MB', uploadedAt: '2026-07-28', status: 'Verified' },
      { id: 'bd32', docType: 'Trademark Licensing Agreement', fileName: 'Apex_TM_Licensing_Signed.pdf', fileSize: '2.4 MB', uploadedAt: '2026-07-28', status: 'Verified' },
      { id: 'bd33', docType: 'Approved Artwork & Labeling Proof', fileName: 'PantoDMax_Strip_Artwork.pdf', fileSize: '3.8 MB', uploadedAt: '2026-07-28', status: 'Verified' },
      { id: 'bd34', docType: 'Formula Non-Infringement Undertaking', fileName: 'Formulation_Undertaking.pdf', fileSize: '920 KB', uploadedAt: '2026-07-28', status: 'Verified' }
    ]
  }
];

export const BrandVerificationModule: React.FC = () => {
  const { addAuditLog } = useApp();

  const [records, setRecords] = useState<BrandRecord[]>(INITIAL_BRAND_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('bv-rec-201');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'AUTH_REQUIRED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Document Viewer Modal
  const [viewingDoc, setViewingDoc] = useState<BrandDocItem | null>(null);

  // Decision Modal States
  const [decisionModal, setDecisionModal] = useState<'APPROVE' | 'REQUEST_AUTH' | 'REJECT' | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [requestAuthNotesInput, setRequestAuthNotesInput] = useState('');

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null;

  // Counts
  const counts = {
    all: records.length,
    underReview: records.filter(r => r.status === 'UNDER REVIEW' || r.status === 'PENDING').length,
    approved: records.filter(r => r.status === 'BRAND APPROVED').length,
    authRequired: records.filter(r => r.status === 'AUTHORIZATION REQUIRED').length,
    rejected: records.filter(r => r.status === 'BRAND REJECTED').length,
  };

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchSearch = r.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerCode.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === 'UNDER_REVIEW') return r.status === 'UNDER REVIEW' || r.status === 'PENDING';
    if (activeTab === 'APPROVED') return r.status === 'BRAND APPROVED';
    if (activeTab === 'AUTH_REQUIRED') return r.status === 'AUTHORIZATION REQUIRED';
    if (activeTab === 'REJECTED') return r.status === 'BRAND REJECTED';
    return true;
  });

  // Action Handlers
  const handleExecuteApprove = () => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        status: 'BRAND APPROVED',
        approvedAt: new Date().toISOString().split('T')[0],
        checks: {
          loaAuth: 'Verified',
          tmAgreement: 'Verified',
          formulaClearance: 'Verified',
          artworkCompliance: 'Verified'
        }
      };
    }));

    addAuditLog('Brand Verification', `Approved brand authorization for ${selectedRecord.brandName} (${selectedRecord.customerName})`);
    setDecisionModal(null);
  };

  const handleExecuteRequestAuth = () => {
    if (!selectedRecord) return;
    if (!requestAuthNotesInput.trim()) {
      alert('Please enter authorization letter request details.');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        status: 'AUTHORIZATION REQUIRED',
        authNotes: requestAuthNotesInput,
        checks: {
          ...r.checks,
          loaAuth: 'Failed'
        }
      };
    }));

    addAuditLog('Brand Verification', `Requested LOA Authorization for brand ${selectedRecord.brandName}`);
    setDecisionModal(null);
    setRequestAuthNotesInput('');
  };

  const handleExecuteReject = () => {
    if (!selectedRecord) return;
    if (!rejectionReasonInput.trim()) {
      alert('Please enter rejection reason.');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        status: 'BRAND REJECTED',
        rejectionReason: rejectionReasonInput
      };
    }));

    addAuditLog('Brand Verification', `Rejected brand authorization for ${selectedRecord.brandName}. Reason: ${rejectionReasonInput}`);
    setDecisionModal(null);
    setRejectionReasonInput('');
  };

  const renderStatusBadge = (status: BrandStatus) => {
    switch (status) {
      case 'BRAND APPROVED':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> BRAND APPROVED
          </span>
        );
      case 'AUTHORIZATION REQUIRED':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={14} /> AUTHORIZATION REQUIRED
          </span>
        );
      case 'BRAND REJECTED':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={14} /> BRAND REJECTED
          </span>
        );
      default:
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} /> UNDER REVIEW
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Compliance Workflow</span>
              <ChevronRight size={12} />
              <span style={{ color: '#1D4ED8', fontWeight: 600 }}>Brand Verification Workflow</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Brand Authorization & Verification Desk
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Verification of Letter of Authorization (LOA), Brand Ownership, and Artwork Formulations for Pharma Manufacturing.
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI STRIP BAR ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { id: 'ALL', label: 'Total Brands', count: counts.all, color: '#0F172A' },
          { id: 'UNDER_REVIEW', label: 'Under Review', count: counts.underReview, color: '#1D4ED8' },
          { id: 'APPROVED', label: 'Brand Approved', count: counts.approved, color: '#10B981' },
          { id: 'AUTH_REQUIRED', label: 'Auth Required', count: counts.authRequired, color: '#DB2777' },
          { id: 'REJECTED', label: 'Brand Rejected', count: counts.rejected, color: '#DC2626' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              background: '#FFFFFF', border: activeTab === t.id ? `2px solid ${t.color}` : '1px solid #E2E8F0',
              borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>{t.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.color, marginTop: 6 }}>{t.count}</div>
          </div>
        ))}
      </div>

      {/* ── REGULATORY NOTICE: GENERIC MEDICINES EXEMPTION ────── */}
      <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534', flexShrink: 0, marginTop: 2 }}>
          <ShieldCheck size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
              Statutory Exemption Notice: Generic Medicines (Molecule-Based Procurement)
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}>
              NO BRAND CERTIFICATE / LOA REQUIRED
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: '#15803D', lineHeight: 1.5, marginTop: 4 }}>
            Generic medicine requisitions are identified primarily by standard chemical molecule and internal price list rates. Under FactoryGrid compliance protocols and CDSCO / Drugs &amp; Cosmetics Rules, non-proprietary generic molecules are <strong>exempt</strong> from Trademark Licensing Agreements, Brand Owner LOAs, and Trademark Registration checks. Compliance is validated strictly via WHO-GMP manufacturing plant licenses (Form 25/28) and COA batch testing.
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT BRAND LIST */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Pharma Brand Cases</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search brand, customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', height: 34, paddingLeft: 30, paddingRight: 10, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 680, overflowY: 'auto' }}>
            {filteredRecords.map(rec => {
              const isSelected = rec.id === selectedRecordId;
              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  style={{
                    padding: '14px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    borderLeft: isSelected ? '4px solid #1D4ED8' : '4px solid transparent',
                    transition: 'all 120ms ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>{rec.tmRegistrationNo}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{rec.submissionDate}</span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    Brand: "{rec.brandName}"
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    Customer: <strong>{rec.customerName}</strong> ({rec.customerCode})
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {renderStatusBadge(rec.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT BRAND REVIEW WORKSPACE */}
        {selectedRecord ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>

            {/* SUMMARY CARD */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                    TM Reg: {selectedRecord.tmRegistrationNo}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Submitted: {selectedRecord.submissionDate}</span>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '6px 0 2px 0' }}>
                  Brand: "{selectedRecord.brandName}"
                </h2>

                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  Brand Marketer / Customer: <strong>{selectedRecord.customerName}</strong> (Code: <code>{selectedRecord.customerCode}</code>)
                </div>

                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Dosage Form: <strong>{selectedRecord.dosageForm}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>BRAND AUTHORIZATION STATUS</div>
                {renderStatusBadge(selectedRecord.status)}
              </div>
            </div>

            {/* APPROVED SUCCESS BANNER */}
            {selectedRecord.status === 'BRAND APPROVED' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 18px', color: '#166534', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} /> Brand authorization verified and approved for contract manufacturing.
              </div>
            )}

            {/* REJECTED BANNER */}
            {selectedRecord.status === 'BRAND REJECTED' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 18px', color: '#991B1B', fontSize: 13 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <XCircle size={18} /> Brand Authorization: REJECTED
                </strong>
                <div style={{ marginTop: 4 }}>
                  <strong>Rejection Reason:</strong> {selectedRecord.rejectionReason || 'Failed brand ownership & LOA authorization verification.'}
                </div>
              </div>
            )}

            {/* AUTH REQUIRED BANNER */}
            {selectedRecord.status === 'AUTHORIZATION REQUIRED' && (
              <div style={{ background: '#FDF2F8', border: '1px solid #F472B6', borderRadius: 10, padding: '14px 18px', color: '#9D174D', fontSize: 13 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <AlertCircle size={18} /> Brand Authorization: AUTHORIZATION REQUIRED
                </strong>
                <div style={{ marginTop: 4 }}>
                  <strong>Reviewer Notes:</strong> {selectedRecord.authNotes || 'Please submit fresh notarized Letter of Authorization (LOA) from brand owner.'}
                </div>
              </div>
            )}

            {/* 4 MANDATORY BRAND CHECKS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>BRAND VERIFICATION CHECKS (4 REQUIRED)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                  4 Statutory Pharma Checks
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'loaAuth', label: '1. LOA Authorization', detail: 'Letter of Authorization from brand owner' },
                  { key: 'tmAgreement', label: '2. TM Licensing Agreement', detail: 'Formal licensing agreement on record' },
                  { key: 'formulaClearance', label: '3. Drug Formula Clearance', detail: 'CDSCO Form 25/28 permission match' },
                  { key: 'artworkCompliance', label: '4. Artwork & Label Compliance', detail: 'Statutory labeling & barcode clearance' },
                ].map(c => {
                  const checkState = selectedRecord.checks[c.key as keyof typeof selectedRecord.checks];

                  return (
                    <div key={c.key} style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{c.detail}</div>
                      </div>
                      <select
                        value={checkState}
                        onChange={e => setRecords(prev => prev.map(r => r.id === selectedRecord.id ? {
                          ...r,
                          checks: { ...r.checks, [c.key]: e.target.value as any }
                        } : r))}
                        style={{
                          padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 11.5, fontWeight: 700,
                          background: checkState === 'Verified' ? '#F0FDF4' : checkState === 'Failed' ? '#FEF2F2' : '#FFFBEB',
                          color: checkState === 'Verified' ? '#16A34A' : checkState === 'Failed' ? '#DC2626' : '#D97706'
                        }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REQUIRED BRAND DOCUMENTS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14 }}>
                REQUIRED BRAND DOCUMENTS (4 MANDATORY)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedRecord.documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(29, 78, 216, 0.08)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{doc.docType}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                            ✓ Submitted
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          File: {doc.fileName} • {doc.fileSize} • Uploaded: {doc.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingDoc(doc)}
                      style={{
                        padding: '5px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6,
                        fontSize: 12, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <Eye size={13} /> View Document
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* BRAND COMPLIANCE DECISION DESK */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Brand Authorization Decision Desk</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Approve brand authorization for contract manufacturing, request fresh LOA, or reject brand.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setDecisionModal('REQUEST_AUTH')}
                  disabled={selectedRecord.status === 'BRAND APPROVED'}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#DB2777', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: selectedRecord.status === 'BRAND APPROVED' ? 0.5 : 1 }}
                >
                  Request Auth Letter
                </button>

                <button
                  onClick={() => setDecisionModal('REJECT')}
                  disabled={selectedRecord.status === 'BRAND APPROVED'}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: selectedRecord.status === 'BRAND APPROVED' ? 0.5 : 1 }}
                >
                  Reject Brand
                </button>

                <button
                  onClick={() => setDecisionModal('APPROVE')}
                  disabled={selectedRecord.status === 'BRAND APPROVED'}
                  style={{ padding: '8px 20px', borderRadius: 8, background: '#10B981', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', opacity: selectedRecord.status === 'BRAND APPROVED' ? 0.5 : 1 }}
                >
                  Approve Brand Authorization →
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ background: '#FFFFFF', padding: 40, borderRadius: 14, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
            Select a pharma brand authorization case from the list.
          </div>
        )}

      </div>

      {/* ── DOCUMENT PREVIEW MODAL ────────────────────────────────── */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 20px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Digitized Brand Document Viewer</div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{viewingDoc.docType} • {viewingDoc.fileName}</div>
              </div>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, background: '#F8FAFC' }}>
              <div style={{ border: '2px dashed #CBD5E1', padding: 24, borderRadius: 10, background: '#FFFFFF', textAlign: 'center' }}>
                <FileText size={44} style={{ color: '#1D4ED8', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>{viewingDoc.docType}</h4>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>File: {viewingDoc.fileName}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Uploaded: {viewingDoc.uploadedAt} • Size: {viewingDoc.fileSize}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20, textAlign: 'left', fontSize: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>SUBMISSION STATUS</div>
                    <div style={{ fontWeight: 800, color: '#10B981', marginTop: 2 }}>✓ {viewingDoc.status}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>AUTHORIZATION SEAL</div>
                    <div style={{ fontWeight: 700, color: '#10B981', marginTop: 2 }}>✓ Notarized LOA Audited</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', background: '#F1F5F9', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => setViewingDoc(null)} style={{ padding: '6px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DECISION MODALS ───────────────────────────────────── */}
      {decisionModal === 'APPROVE' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10B981', fontWeight: 800, fontSize: 16 }}>
              <CheckCircle2 size={20} /> Approve Brand Authorization
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12 }}>
              Are you sure you want to approve brand authorization for <strong>"{selectedRecord.brandName}"</strong> ({selectedRecord.customerName})?
            </div>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: '#166534' }}>
              Status will become <strong>BRAND APPROVED</strong> and contract manufacturing order creation will be unlocked.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setDecisionModal(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteApprove} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#10B981', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm & Approve Brand →
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionModal === 'REQUEST_AUTH' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DB2777', fontWeight: 800, fontSize: 16 }}>
              <AlertCircle size={20} /> Request Authorization Letter (LOA)
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Authorization Request Notes *</label>
              <textarea rows={4} required placeholder="e.g. Please submit fresh notarized LOA from trademark holder..." value={requestAuthNotesInput} onChange={e => setRequestAuthNotesInput(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDecisionModal(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteRequestAuth} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DB2777', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Send Authorization Request →
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionModal === 'REJECT' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 800, fontSize: 16 }}>
              <XCircle size={20} /> Reject Brand Authorization
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Rejection Reason *</label>
              <textarea rows={3} required placeholder="Enter brand rejection reason..." value={rejectionReasonInput} onChange={e => setRejectionReasonInput(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDecisionModal(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteReject} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
