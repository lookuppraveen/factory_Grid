import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, Download, Building2,
  Factory, Award, Check, User, Plus, FileCheck, Calendar, Shield, AlertCircle
} from 'lucide-react';;

export type MfgDocType =
  | 'GST Registration'
  | 'Manufacturing License'
  | 'GMP Certificate'
  | 'WHO-GMP Certificate'
  | 'ISO Certifications'
  | 'Factory Registration'
  | 'Pollution Control Clearance'
  | 'Product Registration Certificates';

export const REQUIRED_MFG_DOCS: MfgDocType[] = [
  'GST Registration',
  'Manufacturing License',
  'GMP Certificate',
  'WHO-GMP Certificate',
  'ISO Certifications',
  'Factory Registration',
  'Pollution Control Clearance',
  'Product Registration Certificates'
];

export interface MfgDocItem {
  id: string;
  documentType: MfgDocType;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'Pending' | 'Under Review' | 'Verified' | 'Failed' | 'Need More Documents';
  notes?: string;
}

export interface MfgVerificationRecord {
  id: string;
  mfgCode: string;
  mfgName: string;
  plantAddress: string;
  submissionDate: string;
  verificationStatus: 'DOCUMENTS SUBMITTED' | 'UNDER REVIEW' | 'REGULATORY VALIDATION' | 'SITE AUDIT' | 'NEED MORE DOCUMENTS' | 'APPROVED' | 'REJECTED';
  accountStatus: 'NOT ACTIVE' | 'ACTIVE';
  regulatoryValidation: 'Pending' | 'Verified' | 'Failed' | 'Need More Documents';
  siteAuditStatus: 'Not Required' | 'Pending' | 'Scheduled' | 'Completed' | 'Failed';
  assignedAuditor: string;
  documents: MfgDocItem[];
  missingDocsNotes?: string[];
  rejectionReason?: string;
  approvedAt?: string;
}

const INITIAL_MFG_RECORDS: MfgVerificationRecord[] = [
  {
    id: 'mfg-ver-001',
    mfgCode: 'MFG-2026-001',
    mfgName: 'SunBio LifeSciences Ltd',
    plantAddress: 'Plot 42, Pharma SEZ, Baddi, Himachal Pradesh',
    submissionDate: '2026-08-01',
    verificationStatus: 'UNDER REVIEW',
    accountStatus: 'NOT ACTIVE',
    regulatoryValidation: 'Pending',
    siteAuditStatus: 'Scheduled',
    assignedAuditor: 'Sneha Patel (Senior Auditor)',
    documents: [
      { id: 'md1', documentType: 'GST Registration', fileName: 'GSTIN_02SUNBIO.pdf', fileSize: '1.4 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md2', documentType: 'Manufacturing License', fileName: 'Form_25_Form_28_License.pdf', fileSize: '2.8 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md3', documentType: 'GMP Certificate', fileName: 'State_GMP_Clearance.pdf', fileSize: '1.9 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md4', documentType: 'WHO-GMP Certificate', fileName: 'WHO_GMP_Master_Cert.pdf', fileSize: '3.1 MB', uploadedAt: '2026-08-01', status: 'Under Review' },
      { id: 'md5', documentType: 'ISO Certifications', fileName: 'ISO_9001_14001_Combined.pdf', fileSize: '1.6 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md6', documentType: 'Factory Registration', fileName: 'Factory_License_Baddi.pdf', fileSize: '2.1 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md7', documentType: 'Pollution Control Clearance', fileName: 'PCB_NOC_Clearance.pdf', fileSize: '1.2 MB', uploadedAt: '2026-08-01', status: 'Verified' },
      { id: 'md8', documentType: 'Product Registration Certificates', fileName: 'CDSCO_Product_Dossiers.pdf', fileSize: '4.5 MB', uploadedAt: '2026-08-01', status: 'Under Review' }
    ]
  },
  {
    id: 'mfg-ver-002',
    mfgCode: 'MFG-2026-002',
    mfgName: 'Cipla Contract Formulations',
    plantAddress: 'GIDC Estate, Ankleshwar, Gujarat',
    submissionDate: '2026-08-05',
    verificationStatus: 'REGULATORY VALIDATION',
    accountStatus: 'NOT ACTIVE',
    regulatoryValidation: 'Verified',
    siteAuditStatus: 'Not Required',
    assignedAuditor: 'Vikram Sethi (Lead Auditor)',
    documents: [
      { id: 'md21', documentType: 'GST Registration', fileName: 'Cipla_GSTIN.pdf', fileSize: '1.5 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md22', documentType: 'Manufacturing License', fileName: 'Form_25_GJ.pdf', fileSize: '2.4 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md23', documentType: 'GMP Certificate', fileName: 'Cipla_GMP.pdf', fileSize: '2.0 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md24', documentType: 'WHO-GMP Certificate', fileName: 'WHO_GMP_Ankleshwar.pdf', fileSize: '3.0 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md25', documentType: 'ISO Certifications', fileName: 'ISO_13485.pdf', fileSize: '1.8 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md26', documentType: 'Factory Registration', fileName: 'ROC_Factory_Reg.pdf', fileSize: '1.7 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md27', documentType: 'Pollution Control Clearance', fileName: 'GPCB_NOC.pdf', fileSize: '1.1 MB', uploadedAt: '2026-08-05', status: 'Verified' },
      { id: 'md28', documentType: 'Product Registration Certificates', fileName: 'Product_Dossiers_GJ.pdf', fileSize: '5.2 MB', uploadedAt: '2026-08-05', status: 'Verified' }
    ]
  },
  {
    id: 'mfg-ver-003',
    mfgCode: 'MFG-2026-003',
    mfgName: 'Lupin Biotech Plant B',
    plantAddress: 'Pithampur Industrial Area, Indore, Madhya Pradesh',
    submissionDate: '2026-07-20',
    verificationStatus: 'APPROVED',
    accountStatus: 'ACTIVE',
    regulatoryValidation: 'Verified',
    siteAuditStatus: 'Completed',
    assignedAuditor: 'Rajesh Kumar (Compliance Desk A)',
    approvedAt: '2026-07-25',
    documents: [
      { id: 'md31', documentType: 'GST Registration', fileName: 'Lupin_GSTIN.pdf', fileSize: '1.3 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md32', documentType: 'Manufacturing License', fileName: 'MP_MFG_Lic.pdf', fileSize: '2.2 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md33', documentType: 'GMP Certificate', fileName: 'Lupin_GMP.pdf', fileSize: '1.8 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md34', documentType: 'WHO-GMP Certificate', fileName: 'Lupin_WHO_GMP.pdf', fileSize: '2.9 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md35', documentType: 'ISO Certifications', fileName: 'ISO_Combined.pdf', fileSize: '1.5 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md36', documentType: 'Factory Registration', fileName: 'Indore_Factory_Lic.pdf', fileSize: '1.9 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md37', documentType: 'Pollution Control Clearance', fileName: 'MPPCB_Clearance.pdf', fileSize: '1.0 MB', uploadedAt: '2026-07-20', status: 'Verified' },
      { id: 'md38', documentType: 'Product Registration Certificates', fileName: 'CDSCO_Registrations.pdf', fileSize: '4.8 MB', uploadedAt: '2026-07-20', status: 'Verified' }
    ]
  }
];

export const ManufacturerVerificationModule: React.FC = () => {
  const { addAuditLog } = useApp();

  const [records, setRecords] = useState<MfgVerificationRecord[]>(INITIAL_MFG_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('mfg-ver-001');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_REVIEW' | 'REGULATORY' | 'SITE_AUDIT' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<MfgDocItem | null>(null);

  // Decision Modal States
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'NEED_MORE_DOCS' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [missingDocInput, setMissingDocInput] = useState('');
  const [missingReasonInput, setMissingReasonInput] = useState('');

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null;

  // Counts
  const counts = {
    all: records.length,
    underReview: records.filter(r => r.verificationStatus === 'UNDER REVIEW' || r.verificationStatus === 'DOCUMENTS SUBMITTED').length,
    regulatory: records.filter(r => r.verificationStatus === 'REGULATORY VALIDATION').length,
    siteAudit: records.filter(r => r.verificationStatus === 'SITE AUDIT').length,
    approved: records.filter(r => r.verificationStatus === 'APPROVED').length,
    rejected: records.filter(r => r.verificationStatus === 'REJECTED').length,
  };

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchSearch = r.mfgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mfgCode.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (activeTab === 'UNDER_REVIEW') return r.verificationStatus === 'UNDER REVIEW' || r.verificationStatus === 'DOCUMENTS SUBMITTED';
    if (activeTab === 'REGULATORY') return r.verificationStatus === 'REGULATORY VALIDATION';
    if (activeTab === 'SITE_AUDIT') return r.verificationStatus === 'SITE AUDIT';
    if (activeTab === 'APPROVED') return r.verificationStatus === 'APPROVED';
    if (activeTab === 'REJECTED') return r.verificationStatus === 'REJECTED';
    return true;
  });

  // Check if approval criteria met
  const canApprove = (rec: MfgVerificationRecord) => {
    const allDocsVerified = rec.documents.every(d => d.status === 'Verified');
    const regulatoryPassed = rec.regulatoryValidation === 'Verified';
    const auditPassed = rec.siteAuditStatus === 'Not Required' || rec.siteAuditStatus === 'Completed';
    return allDocsVerified && regulatoryPassed && auditPassed;
  };

  // Handle Action Execution
  const handleExecuteApprove = () => {
    if (!selectedRecord) return;
    if (!canApprove(selectedRecord)) {
      alert('Cannot Approve: All 8 required documents, Regulatory Validation, and Site Audit (if required) must be completed & verified first.');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        verificationStatus: 'APPROVED',
        accountStatus: 'ACTIVE',
        approvedAt: new Date().toISOString().split('T')[0]
      };
    }));

    addAuditLog('Manufacturer Verification', `Approved manufacturer ${selectedRecord.mfgName}. Status set to ACTIVE.`);
    setDecisionType(null);
  };

  const handleExecuteNeedMoreDocs = () => {
    if (!selectedRecord) return;
    if (!missingDocInput.trim()) {
      alert('Please specify the missing document name.');
      return;
    }

    const note = `Missing: ${missingDocInput} | Reason: ${missingReasonInput || 'Statutory review requirement'}`;

    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        verificationStatus: 'NEED MORE DOCUMENTS',
        accountStatus: 'NOT ACTIVE',
        missingDocsNotes: [note, ...(r.missingDocsNotes || [])]
      };
    }));

    addAuditLog('Manufacturer Verification', `Requested more documents from ${selectedRecord.mfgName}: ${missingDocInput}`);
    setDecisionType(null);
    setMissingDocInput('');
    setMissingReasonInput('');
  };

  const handleExecuteReject = () => {
    if (!selectedRecord) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        verificationStatus: 'REJECTED',
        accountStatus: 'NOT ACTIVE',
        rejectionReason: rejectionReason
      };
    }));

    addAuditLog('Manufacturer Verification', `Rejected manufacturer ${selectedRecord.mfgName}. Reason: ${rejectionReason}`);
    setDecisionType(null);
    setRejectionReason('');
  };

  // Update Individual Document Status
  const handleSetDocStatus = (docType: MfgDocType, newStatus: MfgDocItem['status']) => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        documents: r.documents.map(d => d.documentType === docType ? { ...d, status: newStatus } : d)
      };
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Factory size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Compliance Workflow</span>
              <ChevronRight size={12} />
              <span style={{ color: '#1D4ED8', fontWeight: 600 }}>Manufacturer Onboarding Verification</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Manufacturer Onboarding & Audit Desk
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              8 Statutory Documents Upload → Compliance Review → Regulatory Validation → Optional Site Audit → Active Provisioning
            </div>
          </div>
        </div>
      </div>

      {/* ── LIFECYCLE STRIP BAR ───────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          VERIFICATION LIFECYCLE:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}>
          {['DOCUMENTS SUBMITTED', 'UNDER REVIEW', 'REGULATORY VALIDATION', 'SITE AUDIT (OPTIONAL)', 'APPROVED', 'ACTIVE'].map((step, idx) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: selectedRecord?.verificationStatus.includes(step.split(' ')[0]) || (selectedRecord?.accountStatus === 'ACTIVE' && step === 'ACTIVE') ? '#1D4ED8' : '#F1F5F9',
                color: selectedRecord?.verificationStatus.includes(step.split(' ')[0]) || (selectedRecord?.accountStatus === 'ACTIVE' && step === 'ACTIVE') ? '#FFFFFF' : '#64748B',
                border: '1px solid #CBD5E1'
              }}>
                {step}
              </div>
              {idx < 5 && <ChevronRight size={14} style={{ color: '#94A3B8' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID (LIST TABLE & DETAIL WORKSPACE) ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT MANUFACTURER LIST */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Manufacturer Cases</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search manufacturer..."
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{rec.mfgCode}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: rec.accountStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: rec.accountStatus === 'ACTIVE' ? '#10B981' : '#EF4444'
                    }}>
                      {rec.accountStatus}
                    </span>
                  </div>

                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                    {rec.mfgName}
                  </div>

                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                    Submitted: {rec.submissionDate}
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                      background: rec.verificationStatus === 'APPROVED' ? '#F0FDF4' : rec.verificationStatus === 'REJECTED' ? '#FEF2F2' : '#FFFBEB',
                      color: rec.verificationStatus === 'APPROVED' ? '#16A34A' : rec.verificationStatus === 'REJECTED' ? '#DC2626' : '#D97706',
                      border: `1px solid ${rec.verificationStatus === 'APPROVED' ? '#BBF7D0' : rec.verificationStatus === 'REJECTED' ? '#FECACA' : '#FDE68A'}`
                    }}>
                      {rec.verificationStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT DETAIL WORKSPACE */}
        {selectedRecord ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>

            {/* MANUFACTURER SUMMARY CARD */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                    {selectedRecord.mfgCode}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Submitted: {selectedRecord.submissionDate}</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '6px 0 2px 0' }}>
                  {selectedRecord.mfgName}
                </h2>
                <div style={{ fontSize: 12.5, color: '#64748B' }}>
                  Plant: {selectedRecord.plantAddress}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>OVERALL VERIFICATION STATUS</div>
                <span style={{
                  fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
                  background: selectedRecord.verificationStatus === 'APPROVED' ? '#F0FDF4' : selectedRecord.verificationStatus === 'REJECTED' ? '#FEF2F2' : '#EFF6FF',
                  color: selectedRecord.verificationStatus === 'APPROVED' ? '#16A34A' : selectedRecord.verificationStatus === 'REJECTED' ? '#DC2626' : '#1D4ED8',
                  border: `1px solid ${selectedRecord.verificationStatus === 'APPROVED' ? '#BBF7D0' : selectedRecord.verificationStatus === 'REJECTED' ? '#FECACA' : '#BFDBFE'}`
                }}>
                  {selectedRecord.verificationStatus}
                </span>

                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  Account Status: <strong style={{ color: selectedRecord.accountStatus === 'ACTIVE' ? '#10B981' : '#EF4444' }}>{selectedRecord.accountStatus}</strong>
                </div>
              </div>
            </div>

            {/* APPROVED SUCCESS BANNER */}
            {selectedRecord.verificationStatus === 'APPROVED' && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '14px 18px', color: '#166534', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} /> Manufacturer verification approved. Manufacturer is now Active.
              </div>
            )}

            {/* REJECTED BANNER */}
            {selectedRecord.verificationStatus === 'REJECTED' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '14px 18px', color: '#991B1B', fontSize: 13 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <XCircle size={18} /> Verification Status: REJECTED
                </strong>
                <div style={{ marginTop: 4 }}>
                  <strong>Rejection Reason:</strong> {selectedRecord.rejectionReason || 'Failed statutory compliance verification.'}
                </div>
              </div>
            )}

            {/* NEED MORE DOCS BANNER */}
            {selectedRecord.verificationStatus === 'NEED MORE DOCUMENTS' && (
              <div style={{ background: '#FDF2F8', border: '1px solid #F472B6', borderRadius: 10, padding: '14px 18px', color: '#9D174D', fontSize: 13 }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <AlertCircle size={18} /> Verification Status: NEED MORE DOCUMENTS
                </strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  {selectedRecord.missingDocsNotes?.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* MANUFACTURER DOCUMENTS SECTION (8 MANDATORY DOCS) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>MANUFACTURER DOCUMENTS</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                  8 / 8 Statutory Documents Required
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {REQUIRED_MFG_DOCS.map(docType => {
                  const doc = selectedRecord.documents.find(d => d.documentType === docType) || {
                    id: `mfg_doc_${docType.replace(/\s+/g, '_')}`,
                    documentType: docType,
                    fileName: `${docType.replace(/\s+/g, '_')}_Official.pdf`,
                    fileSize: '1.8 MB',
                    uploadedAt: selectedRecord.submissionDate,
                    status: 'Verified' as const
                  };

                  return (
                    <div key={docType} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(29, 78, 216, 0.08)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{docType}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                              ✓ Submitted
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            File: {doc.fileName} • {doc.fileSize} • Uploaded: {doc.uploadedAt}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Status Select */}
                        <select
                          value={doc.status}
                          onChange={e => handleSetDocStatus(docType, e.target.value as any)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 11.5, fontWeight: 700,
                            background: doc.status === 'Verified' ? '#F0FDF4' : doc.status === 'Failed' ? '#FEF2F2' : '#FFFBEB',
                            color: doc.status === 'Verified' ? '#16A34A' : doc.status === 'Failed' ? '#DC2626' : '#D97706'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verified">Verified</option>
                          <option value="Failed">Failed</option>
                          <option value="Need More Documents">Need More Docs</option>
                        </select>

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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REGULATORY VALIDATION SECTION */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>REGULATORY VALIDATION</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: selectedRecord.regulatoryValidation === 'Verified' ? '#10B981' : '#D97706', background: selectedRecord.regulatoryValidation === 'Verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {selectedRecord.regulatoryValidation}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12.5 }}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>Form 25/28 Mfg License Status</div>
                  <div style={{ fontWeight: 800, color: '#10B981', marginTop: 4 }}>Verified (State FDA Registered)</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div style={{ color: '#64748B', fontWeight: 600 }}>WHO-GMP Audit Status</div>
                  <div style={{ fontWeight: 800, color: '#10B981', marginTop: 4 }}>Verified (CDSCO Audited)</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Set Regulatory Validation Result:</span>
                <select
                  value={selectedRecord.regulatoryValidation}
                  onChange={e => setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, regulatoryValidation: e.target.value as any } : r))}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Failed">Failed</option>
                  <option value="Need More Documents">Need More Documents</option>
                </select>
              </div>
            </div>

            {/* SITE AUDIT SECTION (OPTIONAL) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>SITE AUDIT (OPTIONAL)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: selectedRecord.siteAuditStatus === 'Completed' || selectedRecord.siteAuditStatus === 'Not Required' ? '#10B981' : '#D97706', background: selectedRecord.siteAuditStatus === 'Completed' || selectedRecord.siteAuditStatus === 'Not Required' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {selectedRecord.siteAuditStatus}
                </span>
              </div>

              <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>
                Site audit is optional for established WHO-GMP compliant facilities. If enabled, audit must complete before approval.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Site Audit Requirement State:</span>
                <select
                  value={selectedRecord.siteAuditStatus}
                  onChange={e => setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, siteAuditStatus: e.target.value as any } : r))}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 700 }}
                >
                  <option value="Not Required">Not Required</option>
                  <option value="Pending">Pending</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            {/* COMPLIANCE DECISION DESK */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Compliance Decision Desk</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Approving activates manufacturer account on platform. Requires all 8 docs verified, regulatory validation cleared, and audit completed.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setDecisionType('NEED_MORE_DOCS')}
                  disabled={selectedRecord.verificationStatus === 'APPROVED'}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#DB2777', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: selectedRecord.verificationStatus === 'APPROVED' ? 0.5 : 1 }}
                >
                  Need More Documents
                </button>

                <button
                  onClick={() => setDecisionType('REJECT')}
                  disabled={selectedRecord.verificationStatus === 'APPROVED'}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#DC2626', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', opacity: selectedRecord.verificationStatus === 'APPROVED' ? 0.5 : 1 }}
                >
                  Reject
                </button>

                <button
                  onClick={() => setDecisionType('APPROVE')}
                  disabled={selectedRecord.verificationStatus === 'APPROVED' || !canApprove(selectedRecord)}
                  style={{ padding: '8px 20px', borderRadius: 8, background: '#16A34A', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', opacity: (selectedRecord.verificationStatus === 'APPROVED' || !canApprove(selectedRecord)) ? 0.5 : 1 }}
                >
                  Approve & Activate →
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ background: '#FFFFFF', padding: 40, borderRadius: 14, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
            Select a manufacturer from the list to view details.
          </div>
        )}

      </div>

      {/* ── DOCUMENT PREVIEW MODAL ────────────────────────────────── */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '16px 20px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Manufacturer Statutory Document Viewer</div>
                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{viewingDoc.documentType} • {viewingDoc.fileName}</div>
              </div>
              <button onClick={() => setViewingDoc(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, background: '#F8FAFC' }}>
              <div style={{ border: '2px dashed #CBD5E1', padding: 24, borderRadius: 10, background: '#FFFFFF', textAlign: 'center' }}>
                <FileText size={44} style={{ color: '#1D4ED8', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>{viewingDoc.documentType}</h4>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>File: {viewingDoc.fileName}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>Uploaded: {viewingDoc.uploadedAt} • Size: {viewingDoc.fileSize}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20, textAlign: 'left', fontSize: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>STATUS</div>
                    <div style={{ fontWeight: 800, color: viewingDoc.status === 'Verified' ? '#10B981' : '#D97706', marginTop: 2 }}>
                      {viewingDoc.status}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>SEAL</div>
                    <div style={{ fontWeight: 700, color: '#10B981', marginTop: 2 }}>✓ State FDA Clearance</div>
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

      {/* ── DECISION MODAL DIALOGS ────────────────────────────── */}
      {decisionType === 'APPROVE' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16A34A', fontWeight: 800, fontSize: 16 }}>
              <CheckCircle2 size={20} /> Approve Manufacturer Onboarding
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12 }}>
              Are you sure you want to approve <strong>{selectedRecord.mfgName}</strong>?
            </div>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: '#166534' }}>
              Approval will set Manufacturer Verification Status to <strong>APPROVED</strong> and Account Status to <strong>ACTIVE</strong>.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setDecisionType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteApprove} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm & Approve →
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionType === 'NEED_MORE_DOCS' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DB2777', fontWeight: 800, fontSize: 16 }}>
              <AlertTriangle size={20} /> Request More Documents
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Missing Document Name *</label>
                <input type="text" placeholder="e.g. WHO-GMP Renewal Clearance" value={missingDocInput} onChange={e => setMissingDocInput(e.target.value)} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Reason / Reviewer Note</label>
                <textarea rows={3} placeholder="Enter reviewer details..." value={missingReasonInput} onChange={e => setMissingReasonInput(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setDecisionType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteNeedMoreDocs} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DB2777', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Send Request →
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionType === 'REJECT' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 800, fontSize: 16 }}>
              <XCircle size={20} /> Reject Manufacturer Verification
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Rejection Reason *</label>
              <textarea rows={3} placeholder="Enter statutory non-compliance reason..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDecisionType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
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
