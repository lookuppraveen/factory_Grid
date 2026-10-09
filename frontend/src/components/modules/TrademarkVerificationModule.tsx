import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, Download, Building2,
  Tag, Award, Check, User, Plus, FileCheck, Globe, Shield
} from 'lucide-react';

export type TMCheckStatus = 'Pending' | 'Verified' | 'Failed' | 'Under Review';
export type TMFinalResult = 'Approved' | 'Conflict Found' | 'Expired' | 'Under Review';

export interface TrademarkVerificationCheckItem {
  name: string;
  status: TMCheckStatus;
  details: string;
}

export interface TrademarkRecord {
  id: string;
  trademarkName: string;
  customerName: string;
  customerCode: string;
  submissionDate: string;
  verificationStatus: TMFinalResult;
  verificationSource: 'Trademark Registry' | 'IP India Database' | 'Customer Uploaded TM Certificate';
  tmClass: string; // e.g. "Class 5 (Pharmaceuticals & Medicinal Preparations)"
  tmNumber: string;
  expiryDate: string;
  checks: {
    existence: TMCheckStatus;
    owner: TMCheckStatus;
    status: TMCheckStatus;
    classMatch: TMCheckStatus;
    validity: TMCheckStatus;
  };
  conflictNotes?: string;
  certificateFileName?: string;
}

const INITIAL_TM_RECORDS: TrademarkRecord[] = [
  {
    id: 'tm-rec-101',
    trademarkName: 'CROCIN PLUS',
    customerName: 'ABC Pharma Pvt Ltd',
    customerCode: 'CUS-2026-012',
    submissionDate: '2026-08-05',
    verificationStatus: 'UNDER REVIEW',
    verificationSource: 'IP India Database',
    tmClass: 'Class 5 (Pharmaceuticals & Medicinal Preparations)',
    tmNumber: 'TM-908124',
    expiryDate: '2030-10-15',
    checks: {
      existence: 'Verified',
      owner: 'Verified',
      status: 'Under Review',
      classMatch: 'Verified',
      validity: 'Verified'
    },
    certificateFileName: 'TM_Certificate_CrocinPlus.pdf'
  },
  {
    id: 'tm-rec-102',
    trademarkName: 'BIOCURE COLD',
    customerName: 'Zenith Global Exporters',
    customerCode: 'CUS-2026-044',
    submissionDate: '2026-08-02',
    verificationStatus: 'CONFLICT FOUND',
    verificationSource: 'Trademark Registry',
    tmClass: 'Class 5 (Pharmaceuticals & Medicinal Preparations)',
    tmNumber: 'TM-441092',
    expiryDate: '2028-04-12',
    checks: {
      existence: 'Verified',
      owner: 'Failed',
      status: 'Failed',
      classMatch: 'Verified',
      validity: 'Verified'
    },
    conflictNotes: "Prior registered mark 'BIOCURE' exists under Class 5 registered to SunBio LifeSciences Ltd. Conflict recorded.",
    certificateFileName: 'TM_A_Form_BioCure.pdf'
  },
  {
    id: 'tm-rec-103',
    trademarkName: 'PANTO-D MAX',
    customerName: 'Apex Health Formulations',
    customerCode: 'CUS-2026-089',
    submissionDate: '2026-07-28',
    verificationStatus: 'APPROVED',
    verificationSource: 'Customer Uploaded TM Certificate',
    tmClass: 'Class 5 (Gastrointestinal Formulations)',
    tmNumber: 'TM-771802',
    expiryDate: '2032-11-20',
    checks: {
      existence: 'Verified',
      owner: 'Verified',
      status: 'Verified',
      classMatch: 'Verified',
      validity: 'Verified'
    },
    certificateFileName: 'TM_Registration_Cert_771802.pdf'
  },
  {
    id: 'tm-rec-104',
    trademarkName: 'AZITHRO VET 500',
    customerName: 'NovaMed Animal Health',
    customerCode: 'CUS-2026-102',
    submissionDate: '2026-06-15',
    verificationStatus: 'EXPIRED',
    verificationSource: 'IP India Database',
    tmClass: 'Class 5 (Veterinary Formulations)',
    tmNumber: 'TM-330192',
    expiryDate: '2025-12-31',
    checks: {
      existence: 'Verified',
      owner: 'Verified',
      status: 'Failed',
      classMatch: 'Verified',
      validity: 'Failed'
    },
    conflictNotes: 'Trademark registration expired on 31-Dec-2025 without renewal certificate submitted.',
    certificateFileName: 'Expired_TM_Cert_330192.pdf'
  }
];

export const TrademarkVerificationModule: React.FC = () => {
  const { addAuditLog } = useApp();

  const [records, setRecords] = useState<TrademarkRecord[]>(INITIAL_TM_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('tm-rec-101');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'CONFLICT' | 'EXPIRED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Conflict Input Modal
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictInputText, setConflictInputText] = useState('');

  // Cert Viewer Modal
  const [viewingCert, setViewingCert] = useState<TrademarkRecord | null>(null);

  const selectedRecord = records.find(r => r.id === selectedRecordId) || null;

  // Counts
  const counts = {
    all: records.length,
    underReview: records.filter(r => r.verificationStatus === 'Under Review').length,
    approved: records.filter(r => r.verificationStatus === 'Approved').length,
    conflict: records.filter(r => r.verificationStatus === 'Conflict Found').length,
    expired: records.filter(r => r.verificationStatus === 'Expired').length,
  };

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchSearch = r.trademarkName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tmNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === 'UNDER_REVIEW') return r.verificationStatus === 'Under Review';
    if (activeTab === 'APPROVED') return r.verificationStatus === 'Approved';
    if (activeTab === 'CONFLICT') return r.verificationStatus === 'Conflict Found';
    if (activeTab === 'EXPIRED') return r.verificationStatus === 'Expired';
    return true;
  });

  // Action Handlers
  const handleApproveTM = () => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, verificationStatus: 'Approved' } : r));
    addAuditLog('Trademark Verification', `Approved trademark ${selectedRecord.trademarkName} for ${selectedRecord.customerName}`);
  };

  const handleMarkConflict = () => {
    if (!selectedRecord) return;
    if (!conflictInputText.trim()) {
      alert('Please enter conflict reason details.');
      return;
    }
    setRecords(prev => prev.map(r => r.id === selectedRecord.id ? {
      ...r,
      verificationStatus: 'Conflict Found',
      conflictNotes: conflictInputText
    } : r));

    addAuditLog('Trademark Verification', `Marked trademark conflict for ${selectedRecord.trademarkName}`);
    setIsConflictModalOpen(false);
    setConflictInputText('');
  };

  const handleMarkExpired = () => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, verificationStatus: 'Expired' } : r));
    addAuditLog('Trademark Verification', `Marked trademark ${selectedRecord.trademarkName} as EXPIRED`);
  };

  const handleUpdateCheckStatus = (checkKey: keyof TrademarkRecord['checks'], status: TMCheckStatus) => {
    if (!selectedRecord) return;
    setRecords(prev => prev.map(r => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        checks: {
          ...r.checks,
          [checkKey]: status
        }
      };
    }));
  };

  const renderStatusBadge = (status: TMFinalResult) => {
    switch (status) {
      case 'Approved':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> Approved
          </span>
        );
      case 'Conflict Found':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={14} /> CONFLICT FOUND
          </span>
        );
      case 'Expired':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={14} /> EXPIRED
          </span>
        );
      case 'Under Review':
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} /> UNDER REVIEW
          </span>
        );
      default:
        return <span style={{ fontSize: 12 }}>{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP HEADER BAR ────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
            <Tag size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Compliance Workflow</span>
              <ChevronRight size={12} />
              <span style={{ color: '#1D4ED8', fontWeight: 600 }}>Trademark (TM) Verification</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Trademark (TM) Verification Desk
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Statutory verification for Third-Party Manufacturing brand formulations before commercial production.
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI TABS BAR ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {[
          { id: 'ALL', label: 'Total Cases', count: counts.all, color: '#0F172A' },
          { id: 'UNDER_REVIEW', label: 'Under Review', count: counts.underReview, color: '#1D4ED8' },
          { id: 'APPROVED', label: 'Approved', count: counts.approved, color: '#10B981' },
          { id: 'CONFLICT', label: 'Conflict Found', count: counts.conflict, color: '#EF4444' },
          { id: 'EXPIRED', label: 'Expired', count: counts.expired, color: '#F59E0B' },
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

      {/* ── MAIN CONTENT GRID ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, alignItems: 'start' }}>

        {/* LEFT TRADEMARK CASE LIST */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Trademark Registrations</div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search TM, customer..."
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>{rec.tmNumber}</span>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{rec.submissionDate}</span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                    "{rec.trademarkName}"
                  </div>

                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    Customer: <strong>{rec.customerName}</strong> ({rec.customerCode})
                  </div>

                  <div style={{ marginTop: 8 }}>
                    {renderStatusBadge(rec.verificationStatus)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT TRADEMARK REVIEW WORKSPACE */}
        {selectedRecord ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>

            {/* TRADEMARK SUMMARY CARD */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                    {selectedRecord.tmNumber}
                  </span>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Submitted: {selectedRecord.submissionDate}</span>
                </div>

                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: '6px 0 2px 0' }}>
                  Trademark: "{selectedRecord.trademarkName}"
                </h2>

                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  Customer: <strong>{selectedRecord.customerName}</strong> (Code: <code>{selectedRecord.customerCode}</code>)
                </div>

                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Class: <strong>{selectedRecord.tmClass}</strong> • Expiry Date: <strong>{selectedRecord.expiryDate}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>VERIFICATION RESULT</div>
                {renderStatusBadge(selectedRecord.verificationStatus)}
              </div>
            </div>

            {/* CONFLICT FOUND WARNING BANNER */}
            {selectedRecord.verificationStatus === 'Conflict Found' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '16px 20px', color: '#991B1B' }}>
                <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={20} /> Verification Result: CONFLICT FOUND
                </div>
                <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                  <strong>Conflict Reason / Reviewer Note:</strong> {selectedRecord.conflictNotes || 'Identical prior registered trademark mark detected.'}
                </div>
              </div>
            )}

            {/* EXPIRED WARNING BANNER */}
            {selectedRecord.verificationStatus === 'Expired' && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '16px 20px', color: '#92400E' }}>
                <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={20} /> Verification Result: EXPIRED
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Registration validity expired on {selectedRecord.expiryDate}. Customer must submit valid renewal certificate before approval.
                </div>
              </div>
            )}

            {/* 5 MANDATORY VERIFICATION CHECKS */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>VERIFICATION CHECKS (5 REQUIRED)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                  5 Statutory Compliance Checks
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { key: 'existence', label: '1. Trademark Existence', detail: 'Presence in official TM repository' },
                  { key: 'owner', label: '2. Trademark Owner Validation', detail: 'Match customer legal entity name' },
                  { key: 'status', label: '3. Trademark Status Check', detail: 'Registered & Active status check' },
                  { key: 'classMatch', label: '4. Trademark Class Verification', detail: 'Class 5 Medicinal preparations match' },
                  { key: 'validity', label: '5. Registration Validity Check', detail: 'Valid expiry date check' },
                ].map(c => {
                  const checkStatus = selectedRecord.checks[c.key as keyof typeof selectedRecord.checks];

                  return (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.label}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{c.detail}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <select
                          value={checkStatus}
                          onChange={e => handleUpdateCheckStatus(c.key as any, e.target.value as any)}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 11.5, fontWeight: 700,
                            background: checkStatus === 'Verified' ? '#F0FDF4' : checkStatus === 'Failed' ? '#FEF2F2' : '#EFF6FF',
                            color: checkStatus === 'Verified' ? '#16A34A' : checkStatus === 'Failed' ? '#DC2626' : '#1D4ED8'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verified">Verified</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VERIFICATION SOURCES (3 SOURCES) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 10, marginBottom: 14 }}>
                VERIFICATION SOURCES
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { name: '1. Trademark Registry', detail: 'CGPDTM Official Registry' },
                  { name: '2. IP India Database', detail: 'ipindiaonline.gov.in Direct Audit' },
                  { name: '3. Customer Uploaded TM Certificate', detail: 'Form TM-A Certificate Copy' },
                ].map(s => {
                  const isActiveSource = selectedRecord.verificationSource.includes(s.name.split('.')[1].trim().split(' ')[0]);

                  return (
                    <div
                      key={s.name}
                      onClick={() => setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, verificationSource: s.name.split('.')[1].trim() as any } : r))}
                      style={{
                        padding: 14, borderRadius: 8, border: isActiveSource ? '2px solid #1D4ED8' : '1px solid #E2E8F0',
                        background: isActiveSource ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: isActiveSource ? '#1D4ED8' : '#0F172A' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{s.detail}</div>
                      {isActiveSource && (
                        <div style={{ marginTop: 8, fontSize: 10, fontWeight: 800, color: '#1D4ED8' }}>● Active Audit Source</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedRecord.certificateFileName && (
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#F1F5F9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
                    <FileText size={16} style={{ color: '#1D4ED8' }} />
                    <span>TM Certificate File: <code>{selectedRecord.certificateFileName}</code></span>
                  </div>
                  <button
                    onClick={() => setViewingCert(selectedRecord)}
                    style={{ padding: '4px 12px', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11.5, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Eye size={13} /> View Certificate
                  </button>
                </div>
              )}
            </div>

            {/* TRADEMARK DECISION ACTIONS */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Trademark Final Result Actions</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Set final trademark verification status. Approval allows third-party contract manufacturing order creation.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={handleMarkExpired}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#F59E0B', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Mark Expired
                </button>

                <button
                  onClick={() => setIsConflictModalOpen(true)}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#EF4444', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Conflict Found
                </button>

                <button
                  onClick={handleApproveTM}
                  style={{ padding: '8px 20px', borderRadius: 8, background: '#10B981', color: '#FFF', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}
                >
                  Approve Trademark →
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div style={{ background: '#FFFFFF', padding: 40, borderRadius: 14, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
            Select a trademark registration case from the list.
          </div>
        )}

      </div>

      {/* ── CONFLICT REASON MODAL ─────────────────────────────── */}
      {isConflictModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 800, fontSize: 16 }}>
              <XCircle size={20} /> Record Trademark Conflict
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 10 }}>
              Specify prior registered mark conflict details for <strong>"{selectedRecord.trademarkName}"</strong>:
            </div>
            <div style={{ marginTop: 12 }}>
              <textarea
                rows={4}
                required
                placeholder="e.g. Prior registered mark 'CROCIN' exists under Class 5 by GSK Consumer Healthcare..."
                value={conflictInputText}
                onChange={e => setConflictInputText(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setIsConflictModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleMarkConflict} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm Conflict Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CERTIFICATE PREVIEW MODAL ─────────────────────────── */}
      {viewingCert && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 600, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#0F172A', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Trademark Registration Certificate Viewer</div>
              <button onClick={() => setViewingCert(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24, background: '#F8FAFC', textAlign: 'center' }}>
              <div style={{ border: '2px dashed #CBD5E1', padding: 24, borderRadius: 10, background: '#FFFFFF' }}>
                <Tag size={44} style={{ color: '#1D4ED8', margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>"{viewingCert.trademarkName}"</h3>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', marginTop: 4 }}>Reg No: {viewingCert.tmNumber} • Class: {viewingCert.tmClass}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>Owner: <strong>{viewingCert.customerName}</strong></div>

                <div style={{ marginTop: 16, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, color: '#166534', fontWeight: 700 }}>
                  ✓ Official IP India Repository Verified Seal
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 20px', background: '#F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingCert(null)} style={{ padding: '6px 18px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
