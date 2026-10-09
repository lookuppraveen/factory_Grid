import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, AlertCircle, Download, RefreshCw,
  Send, UserCheck, Key, FileCheck, Building2, Factory, MessageSquare, Plus, File,
  Filter, MoreVertical, Calendar, Bell, User, Check, Shield
} from 'lucide-react';
import { CustomerVerificationModule } from './CustomerVerificationModule';
import { ManufacturerVerificationModule } from './ManufacturerVerificationModule';
import { TrademarkVerificationModule } from './TrademarkVerificationModule';
import { BrandVerificationModule } from './BrandVerificationModule';
import { ComplianceCase } from '../../types';
import { analyzeComplianceDocument, AIComplianceFinding } from '../../services/aiComplianceService';
import { Sparkles } from 'lucide-react';

export interface VerificationRecord {
  id: string;
  organizationName: string;
  type: 'BUYER' | 'MANUFACTURER';
  gstNumber: string;
  licenseNumber: string;
  expiryDate: string;
  daysRemaining: number;
  submittedDate: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  documents: {
    id: string;
    name: string;
    type: 'GST' | 'DRUG_LICENSE' | 'WHO_GMP' | 'MFG_LICENSE' | 'TRADEMARK';
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
    issuedDate: string;
    expiryDate: string;
    url: string;
  }[];
  auditNotes: string[];
  submittedBy?: string;
  currentReviewer?: string;
}

const mockVerificationRecords: VerificationRecord[] = [
  {
    id: 'ver-1',
    organizationName: 'Zenith Global Pharma Exporters',
    type: 'BUYER',
    gstNumber: '24DDDDD3333D1Z9',
    licenseNumber: 'GJ-DL-2026-11002 (Form 20B/21B)',
    expiryDate: '2026-10-15',
    daysRemaining: 69,
    submittedDate: '2026-07-28',
    status: 'PENDING',
    riskScore: 'LOW',
    submittedBy: 'Vikram Mehta',
    currentReviewer: 'Compliance Officer Desk A',
    documents: [
      { id: 'd1', name: 'GSTIN_Registration_Certificate.pdf', type: 'GST', status: 'VERIFIED', issuedDate: '2022-04-10', expiryDate: '2027-04-10', url: '#' },
      { id: 'd2', name: 'Drug_License_Form_20B_21B.pdf', type: 'DRUG_LICENSE', status: 'PENDING', issuedDate: '2021-10-15', expiryDate: '2026-10-15', url: '#' },
      { id: 'd3', name: 'Board_Resolution_Authorization.pdf', type: 'TRADEMARK', status: 'VERIFIED', issuedDate: '2026-01-05', expiryDate: '2028-01-05', url: '#' }
    ],
    auditNotes: [
      'GSTIN active & verified against GST portal.',
      'Form 20B/21B license pending officer physical stamp verification.'
    ]
  },
  {
    id: 'ver-2',
    organizationName: 'NovaMed Formulations Pvt Ltd',
    type: 'MANUFACTURER',
    gstNumber: '02MMM3344K1Z2',
    licenseNumber: 'HP-MFG-2023-44102 (Form 25/28)',
    expiryDate: '2026-09-20',
    daysRemaining: 44,
    submittedDate: '2026-08-01',
    status: 'UNDER_REVIEW',
    riskScore: 'LOW',
    submittedBy: 'Dr. Rajesh Vardhan',
    currentReviewer: 'Compliance Officer Desk B',
    documents: [
      { id: 'd4', name: 'WHO_GMP_Master_Certificate.pdf', type: 'WHO_GMP', status: 'VERIFIED', issuedDate: '2023-09-20', expiryDate: '2026-09-20', url: '#' },
      { id: 'd5', name: 'Manufacturing_License_Baddi.pdf', type: 'MFG_LICENSE', status: 'VERIFIED', issuedDate: '2023-01-15', expiryDate: '2028-01-15', url: '#' },
      { id: 'd6', name: 'Pollution_Control_NOC.pdf', type: 'GST', status: 'VERIFIED', issuedDate: '2024-03-01', expiryDate: '2027-03-01', url: '#' }
    ],
    auditNotes: [
      'WHO-GMP certificate expiring within 44 days.',
      'Factory inspection report cleared.'
    ]
  },
  {
    id: 'ver-3',
    organizationName: 'Apex Pharma Labs Ltd',
    type: 'BUYER',
    gstNumber: '36APXPH0001A1Z5',
    licenseNumber: 'TS-DL-2024-88912',
    expiryDate: '2028-05-30',
    daysRemaining: 662,
    submittedDate: '2026-06-15',
    status: 'APPROVED',
    riskScore: 'LOW',
    submittedBy: 'Dr. Vikram Sethi',
    currentReviewer: 'Lead Auditor Desk',
    documents: [
      { id: 'd7', name: 'Apex_GSTIN_Active.pdf', type: 'GST', status: 'VERIFIED', issuedDate: '2021-05-30', expiryDate: '2028-05-30', url: '#' },
      { id: 'd8', name: 'Drug_License_TS_Form20B.pdf', type: 'DRUG_LICENSE', status: 'VERIFIED', issuedDate: '2023-05-30', expiryDate: '2028-05-30', url: '#' }
    ],
    auditNotes: [
      'Account approved. Official Buyer Code BUY-2026-101 allocated.'
    ]
  },
  {
    id: 'ver-4',
    organizationName: 'SunBio LifeSciences Ltd',
    type: 'MANUFACTURER',
    gstNumber: '02SUNBI0001A1Z8',
    licenseNumber: 'ML-HP-2024-001',
    expiryDate: '2026-09-15',
    daysRemaining: 39,
    submittedDate: '2026-05-20',
    status: 'APPROVED',
    riskScore: 'LOW',
    submittedBy: 'Rajesh Sharma',
    currentReviewer: 'Lead Auditor Desk',
    documents: [
      { id: 'd9', name: 'WHO_GMP_SunBio_2024.pdf', type: 'WHO_GMP', status: 'VERIFIED', issuedDate: '2024-09-15', expiryDate: '2026-09-15', url: '#' },
      { id: 'd10', name: 'Form_25_Form_28_License.pdf', type: 'MFG_LICENSE', status: 'VERIFIED', issuedDate: '2024-01-10', expiryDate: '2029-01-10', url: '#' }
    ],
    auditNotes: [
      'WHO-GMP renewal notice dispatched.'
    ]
  },
  {
    id: 'ver-5',
    organizationName: 'Unverified Trader Network',
    type: 'BUYER',
    gstNumber: '09UNV8899K1Z1',
    licenseNumber: 'EXPIRED-DL-2020',
    expiryDate: '2025-12-31',
    daysRemaining: -219,
    submittedDate: '2026-07-10',
    status: 'REJECTED',
    riskScore: 'HIGH',
    submittedBy: 'Amit Verma',
    currentReviewer: 'Compliance Desk C',
    documents: [
      { id: 'd11', name: 'Expired_Drug_License.pdf', type: 'DRUG_LICENSE', status: 'REJECTED', issuedDate: '2020-01-01', expiryDate: '2025-12-31', url: '#' }
    ],
    auditNotes: [
      'Rejected due to expired Drug License Form 20B.'
    ]
  }
];

export const AIComplianceResultCard: React.FC<{ finding: AIComplianceFinding; onClose?: () => void }> = ({ finding, onClose }) => {
  return (
    <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #BBF7D0', borderRadius: 10, padding: 16, marginTop: 10, fontSize: 12, boxShadow: '0 2px 8px rgba(15,23,42,0.05)', boxSizing: 'border-box' }}>
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: '#15803D' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#15803D', letterSpacing: '-0.01em' }}>DEMO AI ANALYSIS</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Document: <strong>{finding.documentType || finding.documentName}</strong></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '2px 8px', borderRadius: 6, color: '#475569' }}>
            Confidence: {finding.confidence}
          </span>
          {onClose && (
            <button onClick={onClose} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 4, cursor: 'pointer', color: '#64748B', padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Overall Result */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, color: '#475569', fontSize: 12 }}>Overall Result:</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: '#16A34A' }}>✓ DOCUMENT LOOKS VALID</span>
      </div>

      {/* Checks */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
          Checks:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {finding.checks.map((chk, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#FFFFFF', padding: '6px 10px', borderRadius: 6, border: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#16A34A' }}>✓</span>
              <span style={{ color: '#1E293B', fontWeight: 700 }}>{chk.label}:</span>
              <span style={{ color: '#475569' }}>{chk.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: '#15803D', marginBottom: 2 }}>
          AI Recommendation:
        </div>
        <div style={{ fontSize: 11.5, color: '#166534', lineHeight: 1.4 }}>
          {finding.potentialIssues[0] || 'No obvious compliance issue detected in this demo analysis.'}
        </div>
      </div>

      {/* Demo Disclaimer */}
      <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: 6, textAlign: 'center' }}>
        ℹ Demo result — actual document AI/OCR verification will be connected in the production implementation. Final verification must be performed by the reviewer using the controls below.
      </div>
    </div>
  );
};

export const ComplianceModule: React.FC = () => {
  const {
    buyerOnboardings, manufacturerOnboardings,
    approveBuyerOnboarding, approveManufacturerOnboarding, addAuditLog,
    setActiveTab
  } = useApp();

  const [activeComplianceSubTab, setActiveComplianceSubTab] = useState<'CUSTOMER_VERIFICATION' | 'GENERAL' | 'MANUFACTURER_VERIFICATION' | 'TRADEMARK_VERIFICATION' | 'BRAND_VERIFICATION'>('CUSTOMER_VERIFICATION');
  const [queueTab, setQueueTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRING'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [records, setRecords] = useState<VerificationRecord[]>(() => {
    const contextRecords: VerificationRecord[] = [
      ...buyerOnboardings.map(b => ({
        id: `bo-comp-${b.id}`,
        organizationName: b.companyName,
        type: 'BUYER' as const,
        gstNumber: b.gstin,
        licenseNumber: b.drugLicenseNo || 'Form 20B/21B Pending',
        expiryDate: '2026-10-15',
        daysRemaining: 69,
        submittedDate: b.submittedDate || 'Today',
        status: (b.status === 'APPROVED' ? 'APPROVED' : b.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as any,
        riskScore: 'LOW' as const,
        submittedBy: b.contactPerson || 'Buyer Applicant',
        currentReviewer: 'Compliance Officer Desk A',
        documents: b.documents?.map((d: any, idx: number) => ({
          id: `doc-${idx}`,
          name: d.name,
          type: d.type as any,
          status: d.status as any,
          issuedDate: '2023-01-01',
          expiryDate: '2026-10-15',
          url: '#'
        })) || [],
        auditNotes: ['Submitted via Enterprise Access Request portal. Pending CDSCO License verification.']
      })),
      ...manufacturerOnboardings.map(m => ({
        id: `mo-comp-${m.id}`,
        organizationName: m.companyName,
        type: 'MANUFACTURER' as const,
        gstNumber: m.gstin,
        licenseNumber: m.mfgLicenseNo || m.whoGmpNo || 'Form 25/28 Pending',
        expiryDate: '2026-09-15',
        daysRemaining: 39,
        submittedDate: m.submittedDate || 'Today',
        status: (m.status === 'APPROVED' ? 'APPROVED' : m.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as any,
        riskScore: 'LOW' as const,
        submittedBy: m.contactPerson || 'Plant Manager',
        currentReviewer: 'Compliance Officer Desk B',
        documents: m.documents?.map((d: any, idx: number) => ({
          id: `doc-mfg-${idx}`,
          name: d.name,
          type: d.type as any,
          status: d.status as any,
          issuedDate: '2023-01-01',
          expiryDate: '2026-09-15',
          url: '#'
        })) || [],
        auditNotes: ['Manufacturer plant onboarding document verification pending.']
      }))
    ];
    return [...mockVerificationRecords, ...contextRecords];
  });

  const [drawerRecordId, setDrawerRecordId] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Record<string, AIComplianceFinding>>({});
  const [analyzingDoc, setAnalyzingDoc] = useState<string | null>(null);

  const handleRunAiAnalysis = async (docName: string, docType: string, targetOrg: any) => {
    try {
      setAnalyzingDoc(docName);
      const res = await analyzeComplianceDocument(docName, docType, { name: targetOrg.organizationName, gstin: targetOrg.gstNumber, licenseNumber: targetOrg.licenseNumber });
      setAiResults(prev => ({ ...prev, [docName]: res }));
    } catch (e) {
      alert("AI analysis unavailable. You may proceed with manual compliance verification.");
    } finally {
      setAnalyzingDoc(null);
    }
  };
  const [newRemarkText, setNewRemarkText] = useState('');

  const selectedDrawerRecord = records.find(r => r.id === drawerRecordId) || null;

  // Queue Counts
  const counts = {
    pending: records.filter(r => r.status === 'PENDING' || r.status === 'UNDER_REVIEW' || r.status === 'CHANGES_REQUESTED').length,
    approved: records.filter(r => r.status === 'APPROVED').length,
    rejected: records.filter(r => r.status === 'REJECTED').length,
    expiring: records.filter(r => r.daysRemaining <= 90 && r.daysRemaining > 0).length,
  };

  // Filtered List
  const filteredRecords = records.filter(r => {
    const matchSearch = r.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;

    if (queueTab === 'PENDING') return r.status === 'PENDING' || r.status === 'UNDER_REVIEW' || r.status === 'CHANGES_REQUESTED';
    if (queueTab === 'APPROVED') return r.status === 'APPROVED';
    if (queueTab === 'REJECTED') return r.status === 'REJECTED';
    if (queueTab === 'EXPIRING') return r.daysRemaining <= 90 && r.daysRemaining > 0;
    return true;
  });

  // Action Handlers
    const handleApproveRecord = (rec: VerificationRecord) => {
    setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'APPROVED' } : r));

    const buyerMatch = buyerOnboardings.find(b => b.companyName === rec.organizationName);
    if (buyerMatch) approveBuyerOnboarding(buyerMatch.id);

    const mfgMatch = manufacturerOnboardings.find(m => m.companyName === rec.organizationName);
    if (mfgMatch) approveManufacturerOnboarding(mfgMatch.id);

    addAuditLog('Compliance Verification', `Approved regulatory documents for ${rec.organizationName}`);
    setActiveMenuId(null);
  };

  const handleRejectRecord = (rec: VerificationRecord) => {
    setRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'REJECTED' } : r));
    addAuditLog('Compliance Verification', `Rejected compliance case for ${rec.organizationName}.`);
    setActiveMenuId(null);
  };

  const handleRequestChanges = (rec: VerificationRecord) => {
    setRecords(prev => prev.map(r => r.id === rec.id ? {
      ...r,
      status: 'CHANGES_REQUESTED',
      auditNotes: [`Changes Requested: Re-upload Form 20B/21B with clear seal`, ...r.auditNotes]
    } : r));
    addAuditLog('Compliance Verification', `Requested document changes from ${rec.organizationName}`);
    setActiveMenuId(null);
  };

  const handleVerifyDocumentFile = (recId: string, docId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recId) return r;
      return {
        ...r,
        documents: r.documents.map(d => d.id === docId ? { ...d, status: 'VERIFIED' } : d)
      };
    }));
    addAuditLog('Compliance Verification', `Document file verified.`);
  };

  const handleRejectDocumentFile = (recId: string, docId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recId) return r;
      return {
        ...r,
        documents: r.documents.map(d => d.id === docId ? { ...d, status: 'REJECTED' } : d)
      };
    }));
    addAuditLog('Compliance Verification', `Document file rejected.`);
  };

  const handleRequestReplacementDocumentFile = (recId: string, docId: string) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== recId) return r;
      return {
        ...r,
        documents: r.documents.map(d => d.id === docId ? { ...d, status: 'PENDING' } : d)
      };
    }));
    addAuditLog('Compliance Verification', `Requested document replacement.`);
  };

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemarkText.trim() || !selectedDrawerRecord) return;
    setRecords(prev => prev.map(r => r.id === selectedDrawerRecord.id ? {
      ...r,
      auditNotes: [`Remark (${new Date().toLocaleDateString()}): ${newRemarkText}`, ...r.auditNotes]
    } : r));
    setNewRemarkText('');
  };

  // Render Status Chip (Blue, Green, Red, Orange)
  const renderStatusChip = (status: VerificationRecord['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> Pending Review
          </span>
        );
      case 'UNDER_REVIEW':
      case 'CHANGES_REQUESTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> {status === 'UNDER_REVIEW' ? 'Under Review' : 'Changes Requested'}
          </span>
        );
      case 'APPROVED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Rejected
          </span>
        );
      default:
        return <span style={{ fontSize: 12 }}>{status}</span>;
    }
  };

  if (activeComplianceSubTab === 'MANUFACTURER_VERIFICATION') {
    return (
      <div>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveComplianceSubTab('GENERAL')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            ← Back to Compliance Queue
          </button>
          <button onClick={() => setActiveComplianceSubTab('MANUFACTURER_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#1D4ED8', color: '#FFF', border: 'none', cursor: 'pointer' }}>
            Manufacturer Onboarding Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('TRADEMARK_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Trademark (TM) Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('BRAND_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Brand Verification Workflow
          </button>
        </div>
        <ManufacturerVerificationModule />
      </div>
    );
  }

  if (activeComplianceSubTab === 'TRADEMARK_VERIFICATION') {
    return (
      <div>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveComplianceSubTab('GENERAL')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            ← Back to Compliance Queue
          </button>
          <button onClick={() => setActiveComplianceSubTab('MANUFACTURER_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Manufacturer Onboarding Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('TRADEMARK_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#1D4ED8', color: '#FFF', border: 'none', cursor: 'pointer' }}>
            Trademark (TM) Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('BRAND_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Brand Verification Workflow
          </button>
        </div>
        <TrademarkVerificationModule />
      </div>
    );
  }

  if (activeComplianceSubTab === 'BRAND_VERIFICATION') {
    return (
      <div>
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveComplianceSubTab('GENERAL')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            ← Back to Compliance Queue
          </button>
          <button onClick={() => setActiveComplianceSubTab('MANUFACTURER_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Manufacturer Onboarding Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('TRADEMARK_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}>
            Trademark (TM) Verification
          </button>
          <button onClick={() => setActiveComplianceSubTab('BRAND_VERIFICATION')} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#1D4ED8', color: '#FFF', border: 'none', cursor: 'pointer' }}>
            Brand Verification Workflow
          </button>
        </div>
        <BrandVerificationModule />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── TOP NAVIGATION DESK SWITCHER ────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compliance Desks:</span>
        <button onClick={() => setActiveComplianceSubTab('GENERAL')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: '#1D4ED8', color: '#FFF', border: 'none', cursor: 'pointer' }}>
          Compliance Verification Queue
        </button>
        <button onClick={() => setActiveComplianceSubTab('MANUFACTURER_VERIFICATION')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer' }}>
          Manufacturer Onboarding Verification →
        </button>
        <button onClick={() => setActiveComplianceSubTab('TRADEMARK_VERIFICATION')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer' }}>
          Trademark (TM) Verification →
        </button>
        <button onClick={() => setActiveComplianceSubTab('BRAND_VERIFICATION')} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', cursor: 'pointer' }}>
          Brand Verification Workflow →
        </button>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Dashboard</span>
              <ChevronRight size={12} />
              <span>Governance</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Compliance Verification</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Compliance Verification Dashboard
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Verify Buyer & Manufacturer drug licenses, WHO-GMP certificates, and statutory filings before account provisioning.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search companies, GST, licenses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 260, height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
            />
          </div>
        </div>
      </div>

      {/* ── QUICK KPI CARDS ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        <div onClick={() => setQueueTab('PENDING')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'all 150ms ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563EB', marginTop: 10, letterSpacing: '-0.02em' }}>{counts.pending}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#2563EB', fontWeight: 700 }}>↑ 14%</span>
            <span style={{ color: '#64748B' }}>Awaiting statutory review</span>
          </div>
        </div>

        <div onClick={() => setQueueTab('APPROVED')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'all 150ms ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved Cases</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', marginTop: 10, letterSpacing: '-0.02em' }}>{counts.approved}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#16A34A', fontWeight: 700 }}>↑ 100%</span>
            <span style={{ color: '#64748B' }}>Cleared for provisioning</span>
          </div>
        </div>

        <div onClick={() => setQueueTab('REJECTED')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'all 150ms ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected Cases</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626', marginTop: 10, letterSpacing: '-0.02em' }}>{counts.rejected}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#DC2626', fontWeight: 700 }}>— 0%</span>
            <span style={{ color: '#64748B' }}>Statutory non-compliance</span>
          </div>
        </div>

        <div onClick={() => setQueueTab('EXPIRING')} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'all 150ms ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiring Licenses</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706', marginTop: 10, letterSpacing: '-0.02em' }}>{counts.expiring}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#D97706', fontWeight: 700 }}>● Action Needed</span>
            <span style={{ color: '#64748B' }}>Expires within 90 days</span>
          </div>
        </div>
      </div>

      {/* ── ACTION TOOLBAR ───────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { id: 'PENDING', label: `Pending Queue (${counts.pending})` },
            { id: 'APPROVED', label: `Approved (${counts.approved})` },
            { id: 'REJECTED', label: `Rejected (${counts.rejected})` },
            { id: 'EXPIRING', label: `Expiring Licenses (${counts.expiring})` },
            { id: 'ALL', label: `All Cases (${records.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setQueueTab(tab.id as any)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12.5, fontWeight: queueTab === tab.id ? 700 : 500,
                background: queueTab === tab.id ? '#2563EB' : 'transparent', color: queueTab === tab.id ? '#FFFFFF' : '#475569',
                border: 'none', cursor: 'pointer', transition: 'all 120ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, color: '#334155', outline: 'none' }}>
            <option value="ALL">All Org Types</option>
            <option value="BUYER">Buyer Organizations</option>
            <option value="MANUFACTURER">Manufacturers</option>
          </select>

          <button onClick={() => alert('Compliance Queue Refreshed.')} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── MAIN DATA TABLE ──────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 20px' }}>Organization & Category</th>
              <th style={{ padding: '14px 16px' }}>GSTIN & License Number</th>
              <th style={{ padding: '14px 16px' }}>Expiry & Validity</th>
              <th style={{ padding: '14px 16px' }}>Submitted By</th>
              <th style={{ padding: '14px 16px' }}>Current Reviewer</th>
              <th style={{ padding: '14px 16px' }}>Compliance Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>No compliance verification records match your filters.</td></tr>
            ) : filteredRecords.map(rec => (
              <tr
                key={rec.id}
                onClick={() => setDrawerRecordId(rec.id)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 120ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
              >
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A' }}>{rec.organizationName}</div>
                  <div style={{ fontSize: 11.5, color: '#14B8A6', fontWeight: 600, marginTop: 2 }}>{rec.type}</div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{rec.gstNumber}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{rec.licenseNumber}</div>
                </td>

                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0F172A' }}>{rec.expiryDate}</div>
                  <div style={{ fontSize: 11, color: rec.daysRemaining <= 90 ? '#D97706' : '#64748B', marginTop: 2 }}>
                    {rec.daysRemaining > 0 ? `${rec.daysRemaining} Days Left` : 'EXPIRED'}
                  </div>
                </td>

                <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>
                  {rec.submittedBy || 'Applicant'}
                </td>

                <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                  {rec.currentReviewer || 'Lead Officer'}
                </td>

                <td style={{ padding: '14px 16px' }}>
                  {renderStatusChip(rec.status)}
                </td>

                <td style={{ padding: '14px 20px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      onClick={() => setDrawerRecordId(rec.id)}
                      style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 11.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      View Docs →
                    </button>

                    {rec.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApproveRecord(rec)}
                        style={{ padding: '5px 10px', borderRadius: 6, background: '#16A34A', color: '#FFFFFF', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── RIGHT SIDE SLIDE-OVER DRAWER ─────────────────────── */}
      {selectedDrawerRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 620, height: '100vh', background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 24px rgba(15,23,42,0.12)' }}>

            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REGULATORY COMPLIANCE DOSSIER</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>{selectedDrawerRecord.organizationName}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selectedDrawerRecord.type} · GSTIN: {selectedDrawerRecord.gstNumber}</div>
              </div>
              <button onClick={() => setDrawerRecordId(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Status Header Strip */}
              <div style={{ padding: 14, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Current Verification Status</div>
                  <div style={{ marginTop: 4 }}>{renderStatusChip(selectedDrawerRecord.status)}</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleRequestChanges(selectedDrawerRecord)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, fontWeight: 600, color: '#D97706', cursor: 'pointer' }}>
                    Request Changes
                  </button>
                  <button onClick={() => handleRejectRecord(selectedDrawerRecord)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
                    Reject
                  </button>
                  <button onClick={() => handleApproveRecord(selectedDrawerRecord)} style={{ padding: '6px 14px', borderRadius: 6, background: '#16A34A', color: '#FFFFFF', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Approve Case →
                  </button>
                </div>
              </div>

              {/* Uploaded Documents Verification Checklist */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Uploaded Statutory Documents ({selectedDrawerRecord.documents.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedDrawerRecord.documents.map(doc => (
                    <div key={doc.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileText size={20} style={{ color: '#2563EB' }} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{doc.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Type: {doc.type} · Valid until: {doc.expiryDate}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: doc.status === 'VERIFIED' ? '#16A34A' : doc.status === 'REJECTED' ? '#DC2626' : '#D97706',
                            background: doc.status === 'VERIFIED' ? '#F0FDF4' : doc.status === 'REJECTED' ? '#FEF2F2' : '#FFFBEB',
                            padding: '3px 8px', borderRadius: 6,
                            border: `1px solid ${doc.status === 'VERIFIED' ? '#BBF7D0' : doc.status === 'REJECTED' ? '#FECACA' : '#FCD34D'}`
                          }}>
                            {doc.status === 'VERIFIED' ? '✓ Verified' : doc.status === 'REJECTED' ? '✕ Rejected' : 'Under Review'}
                          </span>

                          <button
                            onClick={() => handleRunAiAnalysis(doc.name, doc.type, selectedDrawerRecord)}
                            disabled={analyzingDoc === doc.name}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #93C5FD', background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Sparkles size={12} /> {analyzingDoc === doc.name ? 'Analyzing...' : 'AI Analyse'}
                          </button>

                          {doc.status !== 'VERIFIED' && (
                            <>
                              <button
                                onClick={() => handleVerifyDocumentFile(selectedDrawerRecord.id, doc.id)}
                                style={{ padding: '4px 10px', borderRadius: 6, background: '#16A34A', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                ✓ Verify
                              </button>

                              {doc.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleRejectDocumentFile(selectedDrawerRecord.id, doc.id)}
                                  style={{ padding: '4px 10px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  ✕ Reject
                                </button>
                              )}

                              <button
                                onClick={() => handleRequestReplacementDocumentFile(selectedDrawerRecord.id, doc.id)}
                                style={{ padding: '4px 10px', borderRadius: 6, background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Request Replacement
                              </button>
                            </>
                          )}
                        </div>
                        {aiResults[doc.name] && <AIComplianceResultCard finding={aiResults[doc.name]} onClose={() => setAiResults(prev => ({ ...prev, [doc.name]: undefined as any }))} />}
                      </div>
                  ))}
                </div>
              </div>

              {/* Audit Timeline Notes */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Audit Notes & Inspector Comments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedDrawerRecord.auditNotes.map((note, idx) => (
                    <div key={idx} style={{ padding: 10, borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, color: '#334155' }}>
                      • {note}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddRemark} style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>Add Officer Inspection Remark</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter compliance note..."
                    value={newRemarkText}
                    onChange={e => setNewRemarkText(e.target.value)}
                    style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none' }}
                  />
                  <button type="submit" style={{ height: 36, padding: '0 14px', borderRadius: 6, background: '#0F172A', color: '#FFFFFF', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Add Remark
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};