import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { adminVerificationApi } from '../../services/adminVerificationApi';
import { analyzeComplianceDocument, AIComplianceFinding } from '../../services/aiComplianceService';
import {
  CustomerVerificationRequest,
  CustomerVerificationStatus,
  CustomerType,
  CustomerVerificationDocument,
  CustomerVerificationDocumentType,
  PCDDetails,
  TPMDetails,
  DistributorDetails,
  HospitalDetails,
  ExportDetails,
  WholesalerDetails
} from '../../types';
import {
  ShieldCheck, Sparkles, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, Download, RefreshCw,
  UserCheck, Building2, Upload, FileCheck, Filter, User, HelpCircle,
  Key, ArrowRight, AlertCircle, Plus, Check, Mail, Phone, MapPin, Award, Globe,
  Star, Tag, ExternalLink
} from 'lucide-react';

const REQUIRED_DOC_TYPES: CustomerVerificationDocumentType[] = [
  'GST Certificate',
  'PAN Card',
  'Drug License',
  'Incorporation Certificate',
  'Bank Details',
  'Authorized Signatory Details'
];

const COMPLIANCE_OFFICERS = [
  'Rajesh Kumar (Compliance Desk A)',
  'Sneha Patel (Senior Auditor)',
  'Vikram Sethi (Lead Auditor)',
  'Ananya Roy (Regulatory Officer)'
];


const AIComplianceResultCard: React.FC<{ finding: AIComplianceFinding; onClose?: () => void }> = ({ finding, onClose }) => {
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

export const CustomerVerificationModule: React.FC = () => {
  const { addAuditLog } = useApp();

  const [records, setRecords] = useState<CustomerVerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Filters & Tabs
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<'ALL' | 'REGULAR' | 'SPECIAL_PARTY'>('ALL');

  // Classification Confirmation Modal & Toast State
  const [classificationConfirmModal, setClassificationConfirmModal] = useState<{
    isOpen: boolean;
    targetRecordId: string;
    targetCompanyName: string;
    targetClassification: 'REGULAR' | 'SPECIAL_PARTY';
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected Detail Drawer Record
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const loadVerifications = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await adminVerificationApi.listCustomerVerifications();
      const list = Array.isArray(data) ? data : [];
      setRecords(list);
      if (list.length > 0) {
        setSelectedRecordId(prev => prev && list.some(r => r.id === prev || r.requestCode === prev) ? prev : (list[0].requestCode || list[0].id));
      } else {
        setSelectedRecordId(null);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to fetch verification records from database.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVerifications();
  }, []);

  // Fetch full details when selected record changes
  useEffect(() => {
    if (!selectedRecordId) return;
    adminVerificationApi.getCustomerVerification(selectedRecordId)
      .then(fullRec => {
        if (fullRec) {
          setRecords(prev => prev.map(r => (r.id === fullRec.id || r.requestCode === fullRec.requestCode) ? fullRec : r));
        }
      })
      .catch(() => {});
  }, [selectedRecordId]);
  
  // Document Viewing Modal State
  const [viewingDoc, setViewingDoc] = useState<CustomerVerificationDocument | null>(null);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docBlobType, setDocBlobType] = useState<string>('application/pdf');
  const [isDocLoading, setIsDocLoading] = useState<boolean>(false);
  const [docLoadError, setDocLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewingDoc) {
      if (docBlobUrl) {
        URL.revokeObjectURL(docBlobUrl);
        setDocBlobUrl(null);
      }
      setDocLoadError(null);
      setIsDocLoading(false);
      return;
    }

    let active = true;
    setIsDocLoading(true);
    setDocLoadError(null);

    const targetUrl = (viewingDoc as any).url || (viewingDoc as any).downloadUrl || `/api/v1/compliance/documents/${viewingDoc.id}/download`;

    adminVerificationApi.getDocumentBlob(targetUrl)
      .then(({ blobUrl, contentType }) => {
        if (!active) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setDocBlobUrl(blobUrl);
        setDocBlobType(contentType);
        setIsDocLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setIsDocLoading(false);
        setDocLoadError(err.message || 'Document file not found in storage.');
      });

    return () => {
      active = false;
    };
  }, [viewingDoc]);

  const [aiResultsMap, setAiResultsMap] = useState<Record<string, AIComplianceFinding>>({});
  const [analyzingDocType, setAnalyzingDocType] = useState<string | null>(null);

  const handleRunCustomerAiAnalysis = async (docType: string, rec: any) => {
    try {
      setAnalyzingDocType(docType);
      const res = await analyzeComplianceDocument(docType, docType, { name: rec.companyName, gstin: rec.gstNumber, licenseNumber: rec.drugLicenseNumber, address: rec.billingAddress });
      setAiResultsMap(prev => ({ ...prev, [docType]: res }));
    } catch {
      alert("AI analysis unavailable. You may proceed with manual compliance verification.");
    } finally {
      setAnalyzingDocType(null);
    }
  };

  // New Request Modal State
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState<boolean>(false);
  
  // Registration Form State
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: 'Private Limited',
    gstNumber: '',
    panNumber: '',
    drugLicenseNumber: '',
    cinNumber: '',
    website: '',
    contactPerson: '',
    designation: 'Procurement Head',
    mobileNumber: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    state: 'Delhi',
    country: 'India',
    pincode: '',
    customerType: 'PCD' as CustomerType,
    pcd: { territory: 'North Zone', state: 'Delhi NCR', district: 'South Delhi', monopolyRights: true, brandPortfolio: 'Cardiology, Diabetology' } as PCDDetails,
    tpm: { brandName: 'Brand Formulations', packagingRequirements: 'Alu-Alu Packaging', artworkApproval: true, regulatoryRequirements: 'Form 25/28 License', moqAgreement: true } as TPMDetails,
    distributor: { distributionTerritory: 'Regional State', salesChannel: 'Retail Pharmacy & Hospitals', warehouseLocations: 'Central Warehouse (10,000 sq ft)' } as DistributorDetails,
    hospital: { procurementDepartment: 'Clinical Pharmacy Procurement', tenderReference: 'TENDER-2026-901', contractValidity: 'Valid till Dec 2027' } as HospitalDetails,
    export: { targetRegions: 'LATAM, Southeast Asia', iecCode: '0304991204' } as ExportDetails,
    wholesaler: { storageCapacitySqFt: '5,000 sq ft', coldChainStorage: true, networkSize: '25 Retail Stores' } as WholesalerDetails
  });

  const [uploadedFilesMap, setUploadedFilesMap] = useState<Record<string, { fileName: string; fileSize: string }>>({});

  // Decision Dialog States
  const [decisionModalType, setDecisionModalType] = useState<'APPROVE' | 'REJECT' | 'NEED_MORE_DOCS' | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [moreDocsNotesInput, setMoreDocsNotesInput] = useState<string>('');

  // Re-submit Docs Modal State (for Customer)
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState<boolean>(false);
  const [resubmitDocsList, setResubmitDocsList] = useState<CustomerVerificationDocument[]>([]);

  // Selected Record Object from DB records
  const selectedRecord = records.find(r => r.id === selectedRecordId || r.requestCode === selectedRecordId) || null;

  // Counts for KPI Strip
  const counts = {
    total: records.length,
    pending: records.filter(r => r.verificationStatus === 'Pending').length,
    underReview: records.filter(r => r.verificationStatus === 'Under Review').length,
    approved: records.filter(r => r.verificationStatus === 'Approved' || r.verificationStatus === 'Active').length,
    needMoreDocs: records.filter(r => r.verificationStatus === 'Need More Docs').length,
    rejected: records.filter(r => r.verificationStatus === 'Rejected').length,
  };

  // Filtered Listing
  const filteredRecords = records.filter(r => {
    const matchSearch = r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.drugLicenseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (customerTypeFilter !== 'ALL' && r.customerType !== customerTypeFilter) return false;

    if (classificationFilter !== 'ALL') {
      const isSpecial = r.customerClassification === 'SPECIAL_PARTY';
      if (classificationFilter === 'SPECIAL_PARTY' && !isSpecial) return false;
      if (classificationFilter === 'REGULAR' && isSpecial) return false;
    }

    if (activeStatusTab === 'PENDING') return r.verificationStatus === 'Pending';
    if (activeStatusTab === 'UNDER_REVIEW') return r.verificationStatus === 'Under Review';
    if (activeStatusTab === 'APPROVED') return r.verificationStatus === 'Approved' || r.verificationStatus === 'Active';
    if (activeStatusTab === 'NEED_MORE_DOCS') return r.verificationStatus === 'Need More Docs';
    if (activeStatusTab === 'REJECTED') return r.verificationStatus === 'Rejected';
    return true;
  });

  // Handle Registration Form Submit
  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      setToastMessage('For manual registrations, please use the Buyer Registration Portal.');
      setIsNewRequestModalOpen(false);
      await loadVerifications();
    } finally {
      setIsActionLoading(false);
    }
  };

  // Decision Execution Handlers with Real Backend Integration
  const handleExecuteApprove = async () => {
    if (!selectedRecord) return;
    setIsActionLoading(true);
    try {
      const targetCode = selectedRecord.requestCode || selectedRecord.id;
      const updated = await adminVerificationApi.approveCustomerVerification(targetCode);
      setToastMessage(`✓ Successfully approved ${selectedRecord.companyName}. Customer Code: ${updated.customerCode || 'Issued'}`);
      addAuditLog('Customer Verification', `Approved ${selectedRecord.companyName} (${targetCode})`);
      setDecisionModalType(null);
      await loadVerifications();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedRecord) return;
    const reason = rejectionReasonInput.trim();
    if (!reason) {
      alert('A specific rejection reason is required.');
      return;
    }
    setIsActionLoading(true);
    try {
      const targetCode = selectedRecord.requestCode || selectedRecord.id;
      await adminVerificationApi.rejectCustomerVerification(targetCode, reason);
      setToastMessage(`Rejection recorded for ${selectedRecord.companyName}. Registrant notified to re-upload.`);
      addAuditLog('Customer Verification', `Rejected ${selectedRecord.companyName} (${targetCode}): ${reason}`);
      setDecisionModalType(null);
      setRejectionReasonInput('');
      await loadVerifications();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExecuteNeedMoreDocs = async () => {
    if (!selectedRecord) return;
    const notesInput = moreDocsNotesInput.trim() || 'Additional regulatory documents / clarification required';
    const notesArray = notesInput.split('\n').filter(n => n.trim().length > 0);
    setIsActionLoading(true);
    try {
      const targetCode = selectedRecord.requestCode || selectedRecord.id;
      await adminVerificationApi.requestMoreCustomerDocs(targetCode, notesArray);
      setToastMessage(`Requested additional documents for ${selectedRecord.companyName}.`);
      setDecisionModalType(null);
      setMoreDocsNotesInput('');
      await loadVerifications();
    } catch (err: any) {
      alert(`Request more docs failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleAssignOfficer = async (officer: string) => {
    if (!selectedRecord) return;
    try {
      const targetCode = selectedRecord.requestCode || selectedRecord.id;
      await adminVerificationApi.assignCustomerOfficer(targetCode, officer);
      setToastMessage(`Case assigned to ${officer}`);
      await loadVerifications();
    } catch (err: any) {
      alert(`Officer assignment failed: ${err.message}`);
    }
  };

  const handleUpdateClassification = async (recordId: string, classification: 'REGULAR' | 'SPECIAL_PARTY') => {
    try {
      await adminVerificationApi.updateCustomerClassification(recordId, classification);
      setToastMessage(`Customer classification updated to ${classification === 'SPECIAL_PARTY' ? 'Special Party' : 'Regular'}`);
      setClassificationConfirmModal(null);
      await loadVerifications();
    } catch (err: any) {
      alert(`Classification update failed: ${err.message}`);
    }
  };

  const handleReviewDocument = async (docId: string, docName: string, decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT', promptReason?: boolean) => {
    if (!selectedRecord) return;
    let reason: string | undefined = undefined;
    if (promptReason || decision === 'REJECTED' || decision === 'NEEDS_REPLACEMENT') {
      const promptText = decision === 'REJECTED' ? `Enter mandatory reason for rejecting ${docName}:` : `Enter replacement instructions for ${docName}:`;
      const input = window.prompt(promptText)?.trim();
      if (!input) {
        alert('A valid reason is required for rejection or replacement.');
        return;
      }
      reason = input;
    }

    try {
      const targetCode = selectedRecord.requestCode || selectedRecord.id;
      await adminVerificationApi.reviewCustomerDocument(targetCode, docId, decision, reason);
      setToastMessage(`Document ${docName} marked as ${decision === 'APPROVED' ? 'Verified' : decision === 'REJECTED' ? 'Rejected' : 'Needs Replacement'}`);
      setViewingDoc(prev => (prev && prev.id === docId) ? {
        ...prev,
        status: decision === 'APPROVED' ? 'Valid' : decision === 'REJECTED' ? 'Invalid' : 'Pending',
        rejectionReason: reason || null,
      } : prev);
      await loadVerifications();
      if (selectedRecordId) {
        const refreshed = await adminVerificationApi.getCustomerVerification(selectedRecordId);
        if (refreshed) {
          setRecords(prev => prev.map(r => (r.id === refreshed.id || r.requestCode === refreshed.requestCode) ? refreshed : r));
        }
      }
    } catch (err: any) {
      alert(`Document review failed: ${err.message}`);
    }
  };

  const handleOpenResubmit = () => {
    if (!selectedRecord) return;
    setResubmitDocsList([...selectedRecord.documents]);
    setIsResubmitModalOpen(true);
  };

  const handleExecuteResubmit = () => {
    setIsResubmitModalOpen(false);
    loadVerifications();
  };

  // Status Badge Rendering Helper
  const renderStatusBadge = (status: CustomerVerificationStatus) => {
    switch (status) {
      case 'Draft':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#475569' }} /> Draft
          </span>
        );
      case 'Pending':
      case 'Documents Submitted':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} /> {status}
          </span>
        );
      case 'Under Review':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> Under Review
          </span>
        );
      case 'Approved':
      case 'Active':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> {status === 'Active' ? 'Active' : 'Approved'}
          </span>
        );
      case 'Need More Docs':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DB2777' }} /> Need More Docs
          </span>
        );
      case 'Rejected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Rejected
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
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Compliance Workflow</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Customer Verification</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Customer Onboarding Verification
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Customer registration → Document submission → Business verification → Regulatory verification → Financial verification → Approval
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={loadVerifications}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Syncing...' : '↻ Refresh from Database'}
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <div onClick={() => setActiveStatusTab('ALL')} style={{ background: '#FFFFFF', border: activeStatusTab === 'ALL' ? '2px solid #2563EB' : '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Requests</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>{counts.total}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>All customer registrations</div>
        </div>

        <div onClick={() => setActiveStatusTab('UNDER_REVIEW')} style={{ background: '#FFFFFF', border: activeStatusTab === 'UNDER_REVIEW' ? '2px solid #D97706' : '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>Under Review</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#D97706', marginTop: 6 }}>{counts.underReview}</div>
          <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>Assigned to Compliance Officer</div>
        </div>

        <div onClick={() => setActiveStatusTab('NEED_MORE_DOCS')} style={{ background: '#FFFFFF', border: activeStatusTab === 'NEED_MORE_DOCS' ? '2px solid #DB2777' : '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#DB2777', textTransform: 'uppercase' }}>Need More Docs</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DB2777', marginTop: 6 }}>{counts.needMoreDocs}</div>
          <div style={{ fontSize: 11, color: '#DB2777', marginTop: 4 }}>Workflow loop back</div>
        </div>

        <div onClick={() => setActiveStatusTab('APPROVED')} style={{ background: '#FFFFFF', border: activeStatusTab === 'APPROVED' ? '2px solid #16A34A' : '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#16A34A', textTransform: 'uppercase' }}>Approved / Active</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A', marginTop: 6 }}>{counts.approved}</div>
          <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>Customer Code & Login Issued</div>
        </div>

        <div onClick={() => setActiveStatusTab('REJECTED')} style={{ background: '#FFFFFF', border: activeStatusTab === 'REJECTED' ? '2px solid #DC2626' : '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Rejected</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626', marginTop: 6 }}>{counts.rejected}</div>
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Notification sent & ended</div>
        </div>
      </div>

      {/* ── SEARCH & FILTERS BAR ─────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'ALL', label: `All (${counts.total})` },
            { id: 'UNDER_REVIEW', label: `Under Review (${counts.underReview})` },
            { id: 'NEED_MORE_DOCS', label: `Need More Docs (${counts.needMoreDocs})` },
            { id: 'APPROVED', label: `Approved / Active (${counts.approved})` },
            { id: 'REJECTED', label: `Rejected (${counts.rejected})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12.5, fontWeight: activeStatusTab === tab.id ? 700 : 500,
                background: activeStatusTab === tab.id ? '#2563EB' : 'transparent', color: activeStatusTab === tab.id ? '#FFFFFF' : '#475569',
                border: activeStatusTab === tab.id ? 'none' : '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 150ms ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Customer Type:</span>
            <select
              value={customerTypeFilter}
              onChange={e => setCustomerTypeFilter(e.target.value)}
              style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, color: '#0F172A', outline: 'none', background: '#FFFFFF' }}
            >
              <option value="ALL">All Types</option>
              <option value="PCD">PCD</option>
              <option value="TPM">TPM</option>
              <option value="Distributor">Distributor</option>
              <option value="Hospital">Hospital</option>
              <option value="Export">Export</option>
              <option value="Wholesaler">Wholesaler</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Classification:</span>
            <select
              value={classificationFilter}
              onChange={e => setClassificationFilter(e.target.value as any)}
              style={{ height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, color: '#0F172A', outline: 'none', background: '#FFFFFF', fontWeight: 600 }}
            >
              <option value="ALL">All Classifications</option>
              <option value="REGULAR">Regular Customer</option>
              <option value="SPECIAL_PARTY">Special Party</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search company, name, GST..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: 240, height: 36, paddingLeft: 34, paddingRight: 12, borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', color: '#0F172A' }}
            />
          </div>
        </div>
      </div>

      {/* ── CUSTOMER VERIFICATION LIST TABLE ──────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 18px' }}>Customer Name</th>
              <th style={{ padding: '14px 18px' }}>Company Name</th>
              <th style={{ padding: '14px 18px' }}>Customer Type</th>
              <th style={{ padding: '14px 18px' }}>Registration Date</th>
              <th style={{ padding: '14px 18px' }}>Verification Status</th>
              <th style={{ padding: '14px 18px' }}>Classification</th>
              <th style={{ padding: '14px 18px' }}>Assigned Compliance Officer</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  No customer verification records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 120ms ease' }} className="hover:bg-slate-50">
                  <td style={{ padding: '16px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                        {(record.contactPerson || record.customerName).charAt(0)}
                      </div>
                      <div>
                        <div>{record.contactPerson || record.customerName}</div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{record.email}</div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                    <div>{record.companyName}</div>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400, fontFamily: 'monospace' }}>
                      GST: {record.gstNumber}
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1' }}>
                      {record.customerType}
                    </span>
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: 12.5, color: '#475569' }}>
                    {record.registrationDate}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {renderStatusBadge(record.verificationStatus)}
                  </td>

                  <td style={{ padding: '16px 18px' }}>
                    {record.customerClassification === 'SPECIAL_PARTY' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC' }}>
                        <Star size={11} fill="#0E7490" /> SPECIAL PARTY
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                        Regular
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '16px 18px', fontSize: 12.5, color: '#334155', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User size={13} style={{ color: '#64748B' }} />
                      <span>{record.assignedComplianceOfficer}</span>
                    </div>
                  </td>

                  <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setSelectedRecordId(record.id)}
                        style={{
                          height: 32, padding: '0 12px', borderRadius: 6, background: '#1D4ED8', color: '#FFFFFF',
                          border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Eye size={13} /> View Case
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRecordId(record.id);
                          setTimeout(() => {
                            document.getElementById('doc-verification-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        style={{
                          height: 32, padding: '0 12px', borderRadius: 6, background: '#F1F5F9', color: '#0F172A',
                          border: '1px solid #CBD5E1', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <FileText size={13} /> View Documents
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── CUSTOMER VERIFICATION DETAIL DRAWER (13 SECTIONS EXACTLY) ───────── */}
      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 780, background: '#FFFFFF', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', overflow: 'hidden' }}>

            {/* Drawer Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{selectedRecord.id}</span>
                  {renderStatusBadge(selectedRecord.verificationStatus)}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0 0' }}>
                  {selectedRecord.companyName}
                </h2>
              </div>
              <button onClick={() => setSelectedRecordId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scroll Content (13 Numbered Sections as Specified) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* POST-APPROVAL RESULT BANNER (Section 10 requirement) */}
              {(selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active') && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 800, fontSize: 15 }}>
                    <CheckCircle2 size={18} /> Compliance Result: Approved & Active
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 4, background: '#FFFFFF', padding: '12px', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Customer Code</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace' }}>{selectedRecord.customerCode || 'CUS000123'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Portal Login</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Created ({selectedRecord.portalUsername || selectedRecord.email})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Account Status</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>Active</div>
                    </div>
                  </div>
                </div>
              )}

              {/* REJECTED BANNER */}
              {selectedRecord.verificationStatus === 'Rejected' && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 800, fontSize: 14 }}>
                    <XCircle size={18} /> Verification Status: Rejected
                  </div>
                  <div style={{ fontSize: 12.5, color: '#7F1D1D', marginTop: 6 }}>
                    <strong>Rejection Reason:</strong> {selectedRecord.rejectionReason || 'Failed statutory compliance verification.'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#991B1B', marginTop: 4, fontStyle: 'italic' }}>
                    Email notification sent to customer ({selectedRecord.email}). Workflow terminated.
                  </div>
                </div>
              )}

              {/* NEED MORE DOCS BANNER */}
              {selectedRecord.verificationStatus === 'Need More Docs' && (
                <div style={{ background: '#FDF2F8', border: '1px solid #F472B6', borderRadius: 10, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9D174D', fontWeight: 800, fontSize: 14 }}>
                      <AlertCircle size={18} /> Status: Need More Docs (Workflow Loop Back)
                    </div>
                    <button
                      onClick={handleOpenResubmit}
                      style={{ padding: '6px 12px', background: '#DB2777', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Upload size={13} /> Simulate Customer Re-Submission
                    </button>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#831843', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 8 }}>
                    <div>
                      <div style={{ color: '#9D174D', fontWeight: 600, fontSize: 11 }}>Required Additional Documents</div>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRecord.requestedDocumentsNotes?.[0] || 'Drug License / GST Certificate'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#9D174D', fontWeight: 600, fontSize: 11 }}>Reason</div>
                      <div style={{ fontWeight: 700, color: '#475569', marginTop: 2 }}>{selectedRecord.requestedDocumentsNotes?.join('; ') || 'Clarification / Re-upload required'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#9D174D', fontWeight: 600, fontSize: 11 }}>Requested By</div>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedRecord.assignedComplianceOfficer || 'Compliance Officer'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#9D174D', fontWeight: 600, fontSize: 11 }}>Requested Date & Status</div>
                      <div style={{ fontWeight: 800, color: '#DB2777', marginTop: 2 }}>{selectedRecord.registrationDate} (Need Additional Documents)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Customer Information */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  1. Customer Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Primary Representative:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.contactPerson || selectedRecord.customerName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Designation:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.designation || 'Managing Director'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Registration Case ID:</span> <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{selectedRecord.id}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Submitted Date:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.registrationDate}</strong></div>
                </div>
              </div>

              {/* 2. Customer Type (with type-specific info) */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>2. Customer Type</span>
                  <span style={{ padding: '4px 12px', borderRadius: 6, background: '#EFF6FF', color: '#2563EB', fontWeight: 800, fontSize: 12.5, border: '1px solid #BFDBFE' }}>
                    {selectedRecord.customerType}
                  </span>
                </div>
                {/* Specific Type Details */}
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}>
                  {selectedRecord.customerType === 'PCD' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Territory:</span> <strong>{selectedRecord.pcdDetails?.territory || 'North India Zone'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>State / District:</span> <strong>{selectedRecord.pcdDetails?.state || 'Delhi'}, {selectedRecord.pcdDetails?.district || 'South'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Monopoly Rights:</span> <strong>{selectedRecord.pcdDetails?.monopolyRights ? 'Granted (Exclusive)' : 'Standard'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Brand Portfolio:</span> <strong>{selectedRecord.pcdDetails?.brandPortfolio || 'General Medicine'}</strong></div>
                    </div>
                  )}
                  {selectedRecord.customerType === 'TPM' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Brand Name:</span> <strong>{selectedRecord.tpmDetails?.brandName || 'BioCure Pharma'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Packaging Specs:</span> <strong>{selectedRecord.tpmDetails?.packagingRequirements || 'Alu-Alu Packaging'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Artwork Approval:</span> <strong>{selectedRecord.tpmDetails?.artworkApproval ? 'Approved' : 'Pending'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>MOQ Agreement:</span> <strong>{selectedRecord.tpmDetails?.moqAgreement ? 'Signed & Agreed' : 'Pending'}</strong></div>
                    </div>
                  )}
                  {selectedRecord.customerType === 'Distributor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Distribution Territory:</span> <strong>{selectedRecord.distributorDetails?.distributionTerritory || 'Statewide Network'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Sales Channel:</span> <strong>{selectedRecord.distributorDetails?.salesChannel || 'Retail & Hospitals'}</strong></div>
                      <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Warehouse Locations:</span> <strong>{selectedRecord.distributorDetails?.warehouseLocations || 'Central Warehouse'}</strong></div>
                    </div>
                  )}
                  {selectedRecord.customerType === 'Hospital' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Procurement Dept:</span> <strong>{selectedRecord.hospitalDetails?.procurementDepartment || 'Clinical Pharmacy Procurement'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Tender Reference:</span> <strong>{selectedRecord.hospitalDetails?.tenderReference || 'TENDER-2026'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Contract Validity:</span> <strong>{selectedRecord.hospitalDetails?.contractValidity || '1 Year Contract'}</strong></div>
                    </div>
                  )}
                  {selectedRecord.customerType === 'Export' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Target Export Regions:</span> <strong>{selectedRecord.exportDetails?.targetRegions || 'LATAM, Southeast Asia'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>IEC Code:</span> <strong>{selectedRecord.exportDetails?.iecCode || '0304991204'}</strong></div>
                    </div>
                  )}
                  {selectedRecord.customerType === 'Wholesaler' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><span style={{ color: '#64748B' }}>Storage Capacity:</span> <strong>{selectedRecord.wholesalerDetails?.storageCapacitySqFt || '3,000 sq ft'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Cold Chain Storage:</span> <strong>{selectedRecord.wholesalerDetails?.coldChainStorage ? 'Available' : 'N/A'}</strong></div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Company Information */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  3. Company Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Company Legal Name:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.companyName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Business Entity Type:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.businessType || 'Private Limited'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Official Website:</span> <a href={selectedRecord.website || '#'} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600 }}>{selectedRecord.website || 'https://company.com'}</a></div>
                </div>
              </div>

              {/* 4. Contact Information */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  4. Contact Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: '#64748B' }}>Contact Representative:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.contactPerson || selectedRecord.customerName}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Designation:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.designation || 'Head of Procurement'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Mobile Number:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.mobileNumber || selectedRecord.phone}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Email Address:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.email}</strong></div>
                </div>
              </div>

              {/* 5. Address Information */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  5. Address Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Billing Address:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.billingAddress || selectedRecord.address}</strong></div>
                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#64748B' }}>Shipping Address:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.shippingAddress || selectedRecord.address}</strong></div>
                  <div><span style={{ color: '#64748B' }}>State / Country:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.state}, {selectedRecord.country || 'India'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Pincode:</span> <strong style={{ color: '#0F172A' }}>{selectedRecord.pincode}</strong></div>
                </div>
              </div>

              {/* 6. GST / PAN / Drug License / CIN */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  6. GST / PAN / Drug License / CIN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>GST Number</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{selectedRecord.gstNumber}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>PAN Number</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{selectedRecord.panNumber}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Drug License Number</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{selectedRecord.drugLicenseNumber}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>CIN (Corporate Identification No)</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>{selectedRecord.cinNumber}</div>
                  </div>
                </div>
              </div>

              {/* 7. DOCUMENT VERIFICATION */}
              <div id="doc-verification-section" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>DOCUMENT VERIFICATION ({selectedRecord.documents?.length || 0} SUBMITTED)</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                    Live PostgreSQL Compliance Records
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(!selectedRecord.documents || selectedRecord.documents.length === 0) ? (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: 8, border: '1px dashed #CBD5E1', color: '#64748B', fontSize: 12.5 }}>
                      No documents uploaded yet for this customer registration. Registrant can upload compliance documents via Buyer Portal.
                    </div>
                  ) : (
                    selectedRecord.documents.map((docItem: any) => {
                      const docType = docItem.documentType || docItem.category || 'Regulatory Document';
                      const currentStatus = docItem.verificationStatus || (docItem.status === 'Valid' ? 'APPROVED' : docItem.status === 'Invalid' ? 'REJECTED' : 'PENDING');
                      const isVerified = currentStatus === 'APPROVED' || currentStatus === 'Verified';
                      const isRejected = currentStatus === 'REJECTED' || currentStatus === 'Rejected';
                      const isReplacement = currentStatus === 'NEEDS_REPLACEMENT' || currentStatus === 'Need Replacement';

                      return (
                        <div key={docItem.id} style={{ padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(29, 78, 216, 0.08)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FileText size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span>{docType}</span>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: isVerified ? '#10B981' : isRejected ? '#DC2626' : isReplacement ? '#DB2777' : '#D97706',
                                    background: isVerified ? 'rgba(16, 185, 129, 0.1)' : isRejected ? '#FEF2F2' : isReplacement ? '#FDF2F8' : '#FFFBEB',
                                    padding: '1px 6px', borderRadius: 4
                                  }}>
                                    {isVerified ? '✓ Verified' : isRejected ? '✕ Rejected' : isReplacement ? '⚠ Needs Replacement' : '⏳ Pending Review'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                                  File: <strong style={{ color: '#0F172A' }}>{docItem.fileName}</strong> ({docItem.fileSize || '1.2 MB'}) • Uploaded: <strong>{new Date(docItem.uploadedAt).toLocaleDateString()}</strong>
                                </div>
                                {docItem.rejectionReason && (
                                  <div style={{ marginTop: 4, fontSize: 11.5, color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: 4, border: '1px solid #FECACA', display: 'inline-block' }}>
                                    <strong>Rejection Reason:</strong> {docItem.rejectionReason}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => handleRunCustomerAiAnalysis(docType, selectedRecord)}
                                disabled={analyzingDocType === docType}
                                style={{
                                  padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700,
                                  background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #93C5FD',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Sparkles size={12} /> {analyzingDocType === docType ? 'Analyzing...' : 'AI Analyse'}
                              </button>

                              <button
                                onClick={() => setViewingDoc(docItem)}
                                style={{
                                  height: 32, padding: '0 12px', background: '#1D4ED8', border: 'none', borderRadius: 6,
                                  fontSize: 11.5, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Eye size={13} /> View Document
                              </button>
                            </div>
                          </div>

                          {/* Inline Document Review Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                            {!isVerified && (
                              <button
                                onClick={() => handleReviewDocument(docItem.id, docType, 'APPROVED')}
                                style={{ height: 28, padding: '0 12px', borderRadius: 5, background: '#16A34A', color: '#FFFFFF', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                ✓ Verify
                              </button>
                            )}
                            
                            {!isRejected && (
                              <button
                                onClick={() => handleReviewDocument(docItem.id, docType, 'REJECTED', true)}
                                style={{ height: 28, padding: '0 10px', borderRadius: 5, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                ✕ Reject
                              </button>
                            )}

                            {!isReplacement && (
                              <button
                                onClick={() => handleReviewDocument(docItem.id, docType, 'NEEDS_REPLACEMENT', true)}
                                style={{ height: 28, padding: '0 10px', borderRadius: 5, background: '#FDF2F8', color: '#9D174D', border: '1px solid #FBCFE8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Request Replacement
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 8. Auto-validation Results */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>8. Auto-validation Results</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                    background: selectedRecord.autoValidation.overallStatus === 'Valid' ? '#F0FDF4' : '#FFFBEB',
                    color: selectedRecord.autoValidation.overallStatus === 'Valid' ? '#16A34A' : '#D97706'
                  }}>
                    Overall: {selectedRecord.autoValidation.overallStatus}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>GST Format</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedRecord.autoValidation.gstCheck === 'Valid' ? '#16A34A' : '#DC2626' }}>{selectedRecord.autoValidation.gstCheck}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>PAN Format</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedRecord.autoValidation.panCheck === 'Valid' ? '#16A34A' : '#DC2626' }}>{selectedRecord.autoValidation.panCheck}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Docs Presence</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedRecord.autoValidation.requiredDocsCheck === 'Valid' ? '#16A34A' : '#DC2626' }}>{selectedRecord.autoValidation.requiredDocsCheck}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Required Fields</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedRecord.autoValidation.requiredFieldsCheck === 'Valid' ? '#16A34A' : '#DC2626' }}>{selectedRecord.autoValidation.requiredFieldsCheck}</div>
                  </div>
                </div>
              </div>

              {/* BUSINESS VERIFICATION */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>BUSINESS VERIFICATION</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedRecord.businessVerification?.gstActiveStatus === 'Active' ? '#10B981' : '#D97706',
                    background: selectedRecord.businessVerification?.gstActiveStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {selectedRecord.businessVerification?.gstActiveStatus === 'Active' ? 'Verified' : 'Pending Manual Review'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: 12.5 }}>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>1. GST Active Status</span>
                    <span style={{
                      fontWeight: 700,
                      color: selectedRecord.businessVerification?.gstActiveStatus === 'Active' ? '#10B981' : '#D97706',
                      background: selectedRecord.businessVerification?.gstActiveStatus === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      {selectedRecord.businessVerification?.gstActiveStatus || 'Pending Manual Review'}
                    </span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>2. PAN Validation</span>
                    <span style={{
                      fontWeight: 700,
                      color: selectedRecord.businessVerification?.panValidation === 'Verified' ? '#10B981' : '#D97706',
                      background: selectedRecord.businessVerification?.panValidation === 'Verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      {selectedRecord.businessVerification?.panValidation || 'Pending Manual Review'}
                    </span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>3. Company Registration (ROC)</span>
                    <span style={{
                      fontWeight: 700,
                      color: selectedRecord.businessVerification?.companyRegistrationValidation?.includes('Verified') ? '#10B981' : '#D97706',
                      background: selectedRecord.businessVerification?.companyRegistrationValidation?.includes('Verified') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      {selectedRecord.businessVerification?.companyRegistrationValidation || 'Pending Manual Review'}
                    </span>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>4. CIN Validation</span>
                    <span style={{
                      fontWeight: 700,
                      color: selectedRecord.businessVerification?.cinValidation?.includes('Verified') ? '#10B981' : '#D97706',
                      background: selectedRecord.businessVerification?.cinValidation?.includes('Verified') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11
                    }}>
                      {selectedRecord.businessVerification?.cinValidation || (selectedRecord.cinNumber ? 'Pending Manual Review' : 'N/A')}
                    </span>
                  </div>
                </div>
              </div>

              {/* REGULATORY VERIFICATION */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>REGULATORY VERIFICATION</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedRecord.regulatoryVerification?.drugLicenseValidity?.includes('Valid') ? '#10B981' : '#D97706',
                    background: selectedRecord.regulatoryVerification?.drugLicenseValidity?.includes('Valid') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {selectedRecord.regulatoryVerification?.drugLicenseValidity?.includes('Valid') ? 'Verified' : 'Pending Manual Review'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>1. Drug License Validity</div>
                    <div style={{
                      fontWeight: 800,
                      color: selectedRecord.regulatoryVerification?.drugLicenseValidity?.includes('Valid') ? '#10B981' : '#D97706',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {selectedRecord.regulatoryVerification?.drugLicenseValidity?.includes('Valid') ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {selectedRecord.regulatoryVerification?.drugLicenseValidity || 'Pending Manual Review'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>2. License Expiry Check</div>
                    <div style={{
                      fontWeight: 800,
                      color: selectedRecord.regulatoryVerification?.licenseExpiryCheck?.includes('Valid') ? '#10B981' : '#D97706',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {selectedRecord.regulatoryVerification?.licenseExpiryCheck?.includes('Valid') ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {selectedRecord.regulatoryVerification?.licenseExpiryCheck || 'Pending Manual Review'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>3. State FDA Validation</div>
                    <div style={{
                      fontWeight: 800,
                      color: selectedRecord.regulatoryVerification?.stateRegulatoryAuthorityValidation?.includes('Verified') ? '#10B981' : '#D97706',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {selectedRecord.regulatoryVerification?.stateRegulatoryAuthorityValidation?.includes('Verified') ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {selectedRecord.regulatoryVerification?.stateRegulatoryAuthorityValidation || 'Pending Manual Review'}
                    </div>
                  </div>
                </div>
              </div>

              {/* FINANCIAL VERIFICATION */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>FINANCIAL VERIFICATION</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedRecord.financialVerification?.bankVerification?.includes('Verified') ? '#10B981' : '#D97706',
                    background: selectedRecord.financialVerification?.bankVerification?.includes('Verified') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {selectedRecord.financialVerification?.bankVerification?.includes('Verified') ? 'Verified' : 'Pending Manual Review'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>1. Bank Verification</div>
                    <div style={{ fontWeight: 800, color: selectedRecord.financialVerification?.bankVerification?.includes('Verified') ? '#10B981' : '#D97706', marginTop: 4 }}>
                      {selectedRecord.financialVerification?.bankVerification || 'Pending Manual Review'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>2. Credit Rating</div>
                    <div style={{ fontWeight: 800, color: selectedRecord.financialVerification?.creditRating?.includes('AAA') ? '#1D4ED8' : '#64748B', marginTop: 4 }}>
                      {selectedRecord.financialVerification?.creditRating || 'Unrated (Under Review)'}
                    </div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div style={{ color: '#64748B', fontWeight: 600 }}>3. Risk Classification</div>
                    <div style={{ fontWeight: 800, color: selectedRecord.financialVerification?.riskClassification === 'LOW' ? '#10B981' : '#D97706', marginTop: 4 }}>
                      {selectedRecord.financialVerification?.riskClassification || 'PENDING EVALUATION'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 12. Compliance Officer */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  12. Compliance Officer Assignment
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Assigned Officer</div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{selectedRecord.assignedComplianceOfficer}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Re-assign:</span>
                    <select
                      value={selectedRecord.assignedComplianceOfficer}
                      onChange={e => handleAssignOfficer(e.target.value)}
                      style={{ height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, color: '#0F172A', background: '#FFF' }}
                    >
                      {COMPLIANCE_OFFICERS.map(officer => (
                        <option key={officer} value={officer}>{officer}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Classification Area */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag size={15} style={{ color: '#0891B2' }} />
                    <span>Customer Classification &amp; Governance</span>
                  </div>
                  {selectedRecord.customerClassification === 'SPECIAL_PARTY' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC' }}>
                      <Star size={11} fill="#0E7490" /> SPECIAL PARTY
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1' }}>
                      Regular Customer
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  Platform Admin customer-level classification. Special Party status flows across Buyer Dashboard, RFQ generation, Manufacturer quoting visibility, and Order tracking.
                </div>

                {/* Segmented Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', padding: '6px', borderRadius: 8, border: '1px solid #E2E8F0', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if ((selectedRecord.customerClassification || 'REGULAR') !== 'REGULAR') {
                        setClassificationConfirmModal({
                          isOpen: true,
                          targetRecordId: selectedRecord.id,
                          targetCompanyName: selectedRecord.companyName,
                          targetClassification: 'REGULAR'
                        });
                      }
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: (selectedRecord.customerClassification || 'REGULAR') === 'REGULAR' ? 800 : 500,
                      background: (selectedRecord.customerClassification || 'REGULAR') === 'REGULAR' ? '#FFFFFF' : 'transparent',
                      color: (selectedRecord.customerClassification || 'REGULAR') === 'REGULAR' ? '#0F172A' : '#64748B',
                      border: (selectedRecord.customerClassification || 'REGULAR') === 'REGULAR' ? '1px solid #CBD5E1' : 'none',
                      boxShadow: (selectedRecord.customerClassification || 'REGULAR') === 'REGULAR' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Regular Customer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRecord.customerClassification !== 'SPECIAL_PARTY') {
                        setClassificationConfirmModal({
                          isOpen: true,
                          targetRecordId: selectedRecord.id,
                          targetCompanyName: selectedRecord.companyName,
                          targetClassification: 'SPECIAL_PARTY'
                        });
                      }
                    }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: selectedRecord.customerClassification === 'SPECIAL_PARTY' ? 800 : 500,
                      background: selectedRecord.customerClassification === 'SPECIAL_PARTY' ? '#0E7490' : 'transparent',
                      color: selectedRecord.customerClassification === 'SPECIAL_PARTY' ? '#FFFFFF' : '#64748B',
                      border: selectedRecord.customerClassification === 'SPECIAL_PARTY' ? '1px solid #0891B2' : 'none',
                      boxShadow: selectedRecord.customerClassification === 'SPECIAL_PARTY' ? '0 1px 3px rgba(14,116,144,0.3)' : 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Star size={12} fill={selectedRecord.customerClassification === 'SPECIAL_PARTY' ? '#FFFFFF' : 'none'} />
                    Special Party
                  </button>
                </div>

                {/* Audit meta details if modified */}
                {selectedRecord.classificationUpdatedAt && (
                  <div style={{ marginTop: 10, fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} />
                    <span>Last updated by <strong>{selectedRecord.classificationUpdatedBy || 'Platform Admin'}</strong> on {selectedRecord.classificationUpdatedAt}</span>
                  </div>
                )}
              </div>

              {/* 13. Verification Decision Header */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  13. Verification Decision Desk
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Select compliance decision. Approving will generate Customer Code (`CUS000xxx`), create portal login credentials, and activate account.
                </div>
              </div>

            </div>

            {/* SECTION 13: BOTTOM EXACT REQUIRED DECISION ACTION BUTTONS */}
            <div style={{ padding: '16px 24px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setDecisionModalType('NEED_MORE_DOCS')}
                disabled={selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active'}
                style={{
                  height: 42, padding: '0 18px', borderRadius: 8, background: '#DB2777', color: '#FFFFFF',
                  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  opacity: (selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active') ? 0.5 : 1
                }}
              >
                <AlertTriangle size={16} /> Need More Docs
              </button>

              <button
                onClick={() => setDecisionModalType('REJECT')}
                disabled={selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active'}
                style={{
                  height: 42, padding: '0 18px', borderRadius: 8, background: '#DC2626', color: '#FFFFFF',
                  border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  opacity: (selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active') ? 0.5 : 1
                }}
              >
                <XCircle size={16} /> Reject
              </button>

              <button
                onClick={() => setDecisionModalType('APPROVE')}
                disabled={selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active'}
                style={{
                  height: 42, padding: '0 22px', borderRadius: 8, background: '#16A34A', color: '#FFFFFF',
                  border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                  opacity: (selectedRecord.verificationStatus === 'Approved' || selectedRecord.verificationStatus === 'Active') ? 0.5 : 1
                }}
              >
                <CheckCircle2 size={16} /> Approve
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── NEW CUSTOMER REGISTRATION REQUEST MODAL ────────────── */}
      {isNewRequestModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 780, background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 24px', background: '#0F172A', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFF' }}>Customer Onboarding & Registration Form</h3>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Submit company, contact, address, customer-type details & 6 regulatory documents.</div>
              </div>
              <button onClick={() => setIsNewRequestModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* COMPANY INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>1. COMPANY INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Company Name *</label>
                    <input type="text" required placeholder="Company Legal Name" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Business Entity Type *</label>
                    <input type="text" required placeholder="Private Ltd / Partnership / LLP" value={formData.businessType} onChange={e => setFormData({ ...formData, businessType: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>GST Number *</label>
                    <input type="text" required placeholder="15-digit GSTIN" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>PAN Number *</label>
                    <input type="text" required placeholder="10-digit PAN" value={formData.panNumber} onChange={e => setFormData({ ...formData, panNumber: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Drug License Number *</label>
                    <input type="text" required placeholder="Form 20B/21B DL Number" value={formData.drugLicenseNumber} onChange={e => setFormData({ ...formData, drugLicenseNumber: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>CIN Number (if applicable) *</label>
                    <input type="text" required placeholder="Corporate ID Number" value={formData.cinNumber} onChange={e => setFormData({ ...formData, cinNumber: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Website</label>
                    <input type="text" placeholder="https://company.com" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* CONTACT INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>2. CONTACT INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Contact Person *</label>
                    <input type="text" required placeholder="Full Name" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Designation *</label>
                    <input type="text" required placeholder="Designation" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Mobile Number *</label>
                    <input type="text" required placeholder="+91 98765 43210" value={formData.mobileNumber} onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Email Address *</label>
                    <input type="email" required placeholder="email@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* ADDRESS INFORMATION */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>3. ADDRESS INFORMATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Billing Address *</label>
                    <input type="text" required placeholder="Full Street Address" value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Shipping Address *</label>
                    <input type="text" required placeholder="Factory / Warehouse Delivery Address" value={formData.shippingAddress} onChange={e => setFormData({ ...formData, shippingAddress: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>State *</label>
                    <input type="text" required placeholder="State" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Pincode *</label>
                    <input type="text" required placeholder="6-digit Pincode" value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }} />
                  </div>
                </div>
              </div>

              {/* CUSTOMER TYPES & TYPE SPECIFIC DETAILS */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>4. CUSTOMER TYPE SPECIFIC DETAILS</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Select Customer Type *</label>
                  <select
                    value={formData.customerType}
                    onChange={e => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                    style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: '#FFF', fontWeight: 700 }}
                  >
                    <option value="PCD">PCD (Franchise Partner)</option>
                    <option value="TPM">TPM (Third Party Manufacturing / Loan License)</option>
                    <option value="Distributor">Distributor (Stockist Network)</option>
                    <option value="Hospital">Hospital / Institution</option>
                    <option value="Export">Export Entity</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </select>
                </div>

                {/* Render Type Specific Form Fields */}
                {formData.customerType === 'PCD' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div style={{ gridColumn: 'span 2', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>PCD Specific Fields:</div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Territory</label><input type="text" value={formData.pcd.territory} onChange={e => setFormData({ ...formData, pcd: { ...formData.pcd, territory: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>State / District</label><input type="text" value={formData.pcd.district} onChange={e => setFormData({ ...formData, pcd: { ...formData.pcd, district: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11, fontWeight: 700 }}>Brand Portfolio Focus</label><input type="text" value={formData.pcd.brandPortfolio} onChange={e => setFormData({ ...formData, pcd: { ...formData.pcd, brandPortfolio: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                  </div>
                )}

                {formData.customerType === 'TPM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div style={{ gridColumn: 'span 2', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>TPM Specific Fields:</div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Brand Name</label><input type="text" value={formData.tpm.brandName} onChange={e => setFormData({ ...formData, tpm: { ...formData.tpm, brandName: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Packaging Requirements</label><input type="text" value={formData.tpm.packagingRequirements} onChange={e => setFormData({ ...formData, tpm: { ...formData.tpm, packagingRequirements: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                  </div>
                )}

                {formData.customerType === 'Distributor' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div style={{ gridColumn: 'span 2', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Distributor Specific Fields:</div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Distribution Territory</label><input type="text" value={formData.distributor.distributionTerritory} onChange={e => setFormData({ ...formData, distributor: { ...formData.distributor, distributionTerritory: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Sales Channel</label><input type="text" value={formData.distributor.salesChannel} onChange={e => setFormData({ ...formData, distributor: { ...formData.distributor, salesChannel: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                  </div>
                )}

                {formData.customerType === 'Hospital' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#FFF', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1' }}>
                    <div style={{ gridColumn: 'span 2', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Hospital / Institution Specific Fields:</div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Procurement Department</label><input type="text" value={formData.hospital.procurementDepartment} onChange={e => setFormData({ ...formData, hospital: { ...formData.hospital, procurementDepartment: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                    <div><label style={{ fontSize: 11, fontWeight: 700 }}>Tender Reference</label><input type="text" value={formData.hospital.tenderReference} onChange={e => setFormData({ ...formData, hospital: { ...formData.hospital, tenderReference: e.target.value } })} style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12 }} /></div>
                  </div>
                )}
              </div>

              {/* 5. MANDATORY DOCUMENT UPLOAD */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>5. REGULATORY DOCUMENTS UPLOAD (6 Required)</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>Upload regulatory document files as part of onboarding:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {REQUIRED_DOC_TYPES.map(docType => (
                    <div key={docType} style={{ background: '#FFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{docType}</div>
                        {uploadedFilesMap[docType] ? (
                          <div style={{ fontSize: 10.5, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={11} /> Attached ({uploadedFilesMap[docType].fileName})
                          </div>
                        ) : (
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>No file attached</div>
                        )}
                      </div>
                      <label style={{ background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Browse
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedFilesMap(prev => ({
                                ...prev,
                                [docType]: { fileName: file.name, fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB` }
                              }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                <button type="button" onClick={() => setIsNewRequestModalOpen(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Submit Onboarding Request →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DECISION MODAL DIALOGS ────────────────────────────── */}
      {decisionModalType === 'APPROVE' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16A34A', fontWeight: 800, fontSize: 16 }}>
              <CheckCircle2 size={20} /> Approve Customer Verification
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12, lineHeight: 1.5 }}>
              Are you sure you want to approve <strong>{selectedRecord.companyName}</strong>?
            </div>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: '#166534' }}>
              <strong>Execution Sequence:</strong>
              <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li>Status becomes <strong>Approved</strong></li>
                <li>System auto-generates <strong>Customer Code</strong> (e.g. CUS000123)</li>
                <li>Creates <strong>Portal Login Credentials</strong></li>
                <li>Account status becomes <strong>Active</strong></li>
              </ol>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setDecisionModalType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteApprove} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm & Approve →
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionModalType === 'REJECT' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 800, fontSize: 16 }}>
              <XCircle size={20} /> Reject Customer Verification
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12 }}>
              Specify rejection reason for <strong>{selectedRecord.companyName}</strong>. Dispatches email notification and ends workflow.
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Rejection Reason *</label>
              <textarea
                rows={3}
                required
                placeholder="Enter statutory non-compliance reason..."
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDecisionModalType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteReject} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionModalType === 'NEED_MORE_DOCS' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 500, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DB2777', fontWeight: 800, fontSize: 16 }}>
              <AlertTriangle size={20} /> Request More Documents / Info (Loop Back)
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12 }}>
              Specify required additional documents or corrections for <strong>{selectedRecord.companyName}</strong>.
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Requested Documents Details *</label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Please re-upload Drug License Form 20B with official seal."
                value={moreDocsNotesInput}
                onChange={e => setMoreDocsNotesInput(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDecisionModalType(null)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteNeedMoreDocs} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DB2777', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Send Notification to Customer →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER RE-SUBMIT DOCUMENTS SIMULATOR MODAL ──────── */}
      {isResubmitModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', borderRadius: 14, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>Customer Document Re-Submission Portal</div>
              <button onClick={() => setIsResubmitModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 12 }}>
              Re-uploading requested documents for <strong>{selectedRecord.companyName}</strong>:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              {resubmitDocsList.map((doc, idx) => (
                <div key={doc.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>{doc.documentType}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{doc.fileName}</div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = [...resubmitDocsList];
                      updated[idx] = {
                        ...updated[idx],
                        fileName: `Updated_${doc.documentType.replace(/\s+/g, '_')}_Cleared.pdf`,
                        status: 'Valid',
                        notes: undefined
                      };
                      setResubmitDocsList(updated);
                    }}
                    style={{ padding: '4px 10px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Replace / Upload New File
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setIsResubmitModalOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteResubmit} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                Re-submit to Compliance Review →
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── REAL STATUTORY DOCUMENT VIEWER MODAL ────────────────── */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 880, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
            {/* Modal Header */}
            <div style={{ padding: '14px 20px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{viewingDoc.documentType}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: viewingDoc.status === 'Valid' ? '#10B981' : viewingDoc.status === 'Invalid' ? '#EF4444' : '#F59E0B',
                    background: viewingDoc.status === 'Valid' ? 'rgba(16, 185, 129, 0.2)' : viewingDoc.status === 'Invalid' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    padding: '1px 8px', borderRadius: 4
                  }}>
                    {viewingDoc.status === 'Valid' ? '✓ Verified' : viewingDoc.status === 'Invalid' ? '✗ Rejected' : '⏳ Pending Review'}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                  File: <strong style={{ color: '#E2E8F0' }}>{viewingDoc.fileName}</strong> • Uploaded: {viewingDoc.uploadedAt} • Size: {viewingDoc.fileSize || '1.2 MB'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {docBlobUrl && (
                  <a
                    href={docBlobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={viewingDoc.fileName}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '5px 10px', background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF',
                      borderRadius: 6, fontSize: 11.5, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    <ExternalLink size={12} /> Open in New Tab
                  </a>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Document Content Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 480, position: 'relative' }}>
              {isDocLoading && (
                <div style={{ textAlign: 'center', color: '#CBD5E1', padding: 40 }}>
                  <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: '#38BDF8', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Retrieving uploaded statutory document...</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Streaming verified binary bytes from private MinIO storage</div>
                </div>
              )}

              {docLoadError && !isDocLoading && (
                <div style={{ textAlign: 'center', color: '#F87171', background: '#1E293B', padding: 32, borderRadius: 10, margin: 24, border: '1px solid #7F1D1D' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 12px', color: '#EF4444' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px 0', color: '#FCA5A5' }}>Document Storage Error</h4>
                  <div style={{ fontSize: 13, color: '#E2E8F0' }}>{docLoadError}</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 8 }}>
                    File reference: <code>{viewingDoc.fileName}</code>
                  </div>
                </div>
              )}

              {docBlobUrl && !isDocLoading && (
                docBlobType.startsWith('image/') ? (
                  <div style={{ padding: 16, textAlign: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={docBlobUrl}
                      alt={viewingDoc.fileName}
                      style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                    />
                  </div>
                ) : (
                  <iframe
                    src={`${docBlobUrl}#toolbar=1&navpanes=0`}
                    title={viewingDoc.fileName}
                    style={{ width: '100%', height: '65vh', border: 'none', background: '#525659' }}
                  />
                )
              )}
            </div>

            {/* Rejection / Note banner if present */}
            {viewingDoc.rejectionReason && (
              <div style={{ padding: '8px 20px', background: '#FEF2F2', borderTop: '1px solid #FECACA', borderBottom: '1px solid #FECACA', fontSize: 12, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>Rejection Reason:</strong> {viewingDoc.rejectionReason}
              </div>
            )}

            {/* Compliance Reviewer Action Controls Bar */}
            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                Compliance Officer Audit Action:
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.documentType, 'APPROVED')}
                  disabled={viewingDoc.status === 'Valid'}
                  style={{
                    padding: '7px 16px', background: viewingDoc.status === 'Valid' ? '#94A3B8' : '#16A34A',
                    color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    cursor: viewingDoc.status === 'Valid' ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                  }}
                >
                  <CheckCircle2 size={13} /> {viewingDoc.status === 'Valid' ? 'Verified' : 'Verify Document'}
                </button>

                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.documentType, 'REJECTED', true)}
                  disabled={viewingDoc.status === 'Invalid'}
                  style={{
                    padding: '7px 14px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA',
                    borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5
                  }}
                >
                  <XCircle size={13} /> Reject
                </button>

                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.documentType, 'NEEDS_REPLACEMENT', true)}
                  style={{
                    padding: '7px 14px', background: '#FDF2F8', color: '#9D174D', border: '1px solid #FBCFE8',
                    borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Request Replacement
                </button>

                <button
                  onClick={() => setViewingDoc(null)}
                  style={{
                    padding: '7px 16px', background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1',
                    borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SPECIAL PARTY / CLASSIFICATION CONFIRMATION MODAL ── */}
      {classificationConfirmModal && classificationConfirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 30px rgba(0,0,0,0.2)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? '#ECFEFF' : '#F1F5F9', border: `1px solid ${classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? '#A5F3FC' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? '#0E7490' : '#475569' }}>
                <Star size={22} fill={classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? '#0E7490' : 'none'} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  {classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? 'Mark as Special Party?' : 'Remove Special Party status?'}
                </h3>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                  {classificationConfirmModal.targetCompanyName}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {classificationConfirmModal.targetClassification === 'SPECIAL_PARTY'
                ? 'This customer will be identified as a Special Party across the FactoryGrid procurement workflow.'
                : 'This will remove the Special Party classification from this customer.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setClassificationConfirmModal(null)}
                style={{ height: 38, padding: '0 16px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCustomerClassification(classificationConfirmModal.targetRecordId, classificationConfirmModal.targetClassification);
                  setClassificationConfirmModal(null);
                  setToastMessage('Customer classification updated successfully.');
                  setTimeout(() => setToastMessage(null), 3500);
                }}
                style={{
                  height: 38, padding: '0 18px', borderRadius: 8,
                  background: classificationConfirmModal.targetClassification === 'SPECIAL_PARTY' ? '#0E7490' : '#2563EB',
                  border: 'none', fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Confirm &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, background: '#0F172A', color: '#FFFFFF', padding: '12px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
