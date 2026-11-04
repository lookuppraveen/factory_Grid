import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { adminVerificationApi, ManufacturerReviewItem, ManufacturerReviewDetail } from '../../services/adminVerificationApi';
import {
  ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Search,
  Eye, ChevronRight, X, Clock, FileText, Download, Building2,
  Factory, Award, Check, User, Plus, FileCheck, Calendar, Shield, AlertCircle, RefreshCw, ExternalLink,
  Image as ImageIcon, ZoomIn, MapPin, ChevronDown, ChevronUp, Layers, Package, Phone, Mail, CheckCircle
} from 'lucide-react';
import { PaginationControl } from '../common/PaginationControl';
import { usePagination } from '../../hooks/usePagination';

export const MANDATORY_MFR_CERTIFICATIONS = [
  { key: 'mfgLicense', name: 'Manufacturing License' },
  { key: 'gmpCert', name: 'GMP Certificate' },
  { key: 'whoGmpCert', name: 'WHO-GMP Certificate' },
  { key: 'isoCert', name: 'ISO Certification' },
  { key: 'pollutionCert', name: 'Pollution Certificate' },
];

/** Safe GPS coordinate formatter that prevents "Cannot read properties of undefined (reading 'toFixed')" */
export const formatGpsCoordinates = (coords: any): string => {
  if (!coords) return 'Not provided';
  if (typeof coords === 'string') {
    const trimmed = coords.trim();
    return trimmed ? trimmed : 'Not provided';
  }
  if (typeof coords === 'object') {
    const lat = Number(coords.latitude ?? coords.lat);
    const lng = Number(coords.longitude ?? coords.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  return 'Not provided';
};

/** Safe numeric file size formatter */
export const formatFileSize = (bytes?: number | bigint | null): string => {
  if (bytes === undefined || bytes === null) return '0 KB';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '0 KB';
  if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(num / 1024))} KB`;
};

/** Safe date formatter */
export const formatDate = (val?: string | Date | null): string => {
  if (!val) return 'N/A';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return 'N/A';
  }
};

/** Checks if an uploaded document matches a mandatory certification key */
export const isDocMatchingMandatory = (docCategory: string, docDisplayName: string, mandatoryKey: string): boolean => {
  const cat = (docCategory || '').toLowerCase();
  const name = (docDisplayName || '').toLowerCase();
  const key = mandatoryKey.toLowerCase();
  if (cat === key) return true;
  if (key === 'whogmpcert' && (cat.includes('who') || name.includes('who'))) return true;
  if (key === 'gmpcert' && !cat.includes('who') && !name.includes('who') && (cat.includes('gmp') || name.includes('gmp') || cat.includes('glp') || name.includes('glp') || cat === 'gmpcert')) return true;
  if (key === 'mfglicense' && (cat.includes('mfg') || name.includes('manufacturing') || cat.includes('license'))) return true;
  if (key === 'isocert' && (cat.includes('iso') || name.includes('iso'))) return true;
  if (key === 'pollutioncert' && (cat.includes('pollution') || name.includes('pollution') || cat.includes('spcb') || name.includes('spcb'))) return true;
  return cat.includes(key) || name.includes(key);
};

export const ManufacturerVerificationModule: React.FC = () => {
  const { addAuditLog } = useApp();

  const [records, setRecords] = useState<ManufacturerReviewItem[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ManufacturerReviewDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  // Status Filter Tabs (matching Customer Verification KPI strip)
  const [activeStatusTab, setActiveStatusTab] = useState<'ALL' | 'UNDER_REVIEW' | 'NEED_MORE_DOCS' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Accordion Section States inside drawer
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(true);

  // Action Pending State (prevents duplicate clicks)
  const [isActionPending, setIsActionPending] = useState(false);

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [docBlobUrl, setDocBlobUrl] = useState<string | null>(null);
  const [docBlobType, setDocBlobType] = useState<string>('application/pdf');
  const [isDocLoading, setIsDocLoading] = useState<boolean>(false);
  const [docLoadError, setDocLoadError] = useState<string | null>(null);

  // Photo Lightbox Modal State
  const [viewingPhoto, setViewingPhoto] = useState<any | null>(null);

  // Decision Modal States
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'NEED_MORE_DOCS' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [missingDocInput, setMissingDocInput] = useState('');
  const [missingReasonInput, setMissingReasonInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 5000);
  };

  // Load List from Backend (PostgreSQL)
  const loadList = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const list = await adminVerificationApi.listManufacturerVerifications();
      const safeList = Array.isArray(list) ? list : [];
      setRecords(safeList);
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setApiError(err.message || 'Failed to load manufacturer verification cases.');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Fetch full detail when a manufacturer is selected for Review in drawer
  useEffect(() => {
    if (!selectedRecordId) {
      setSelectedDetail(null);
      return;
    }
    setIsDetailLoading(true);
    adminVerificationApi.getManufacturerVerification(selectedRecordId)
      .then(detail => {
        setSelectedDetail(detail);
      })
      .catch(err => {
        showToast(`Failed to load details: ${err.message}`, 'error');
      })
      .finally(() => {
        setIsDetailLoading(false);
      });
  }, [selectedRecordId]);

  // Handle Document Blob Streaming for Viewing
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

    const targetUrl = viewingDoc.url || viewingDoc.downloadUrl || `/api/v1/manufacturer/documents/${viewingDoc.id}/download`;

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

  const selectedRecord = useMemo(() => {
    return records.find(r => r.registrationCode === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Live Summary Counts from PostgreSQL backend
  const counts = useMemo(() => {
    return {
      total: records.length,
      underReview: records.filter(r => r.status === 'UNDER_REVIEW' || r.status === 'SUBMITTED').length,
      needMoreDocs: records.filter(r => r.status === 'ACTION_REQUIRED' || r.status === 'NEEDS_REPLACEMENT').length,
      approved: records.filter(r => r.status === 'APPROVED').length,
      rejected: records.filter(r => r.status === 'REJECTED').length,
    };
  }, [records]);

  // Filtered List based on tab and search
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        (r.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.registrationCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.city && r.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      if (activeStatusTab === 'UNDER_REVIEW') return r.status === 'UNDER_REVIEW' || r.status === 'SUBMITTED';
      if (activeStatusTab === 'NEED_MORE_DOCS') return r.status === 'ACTION_REQUIRED' || r.status === 'NEEDS_REPLACEMENT';
      if (activeStatusTab === 'APPROVED') return r.status === 'APPROVED';
      if (activeStatusTab === 'REJECTED') return r.status === 'REJECTED';
      return true;
    }).sort((a, b) => {
      // Latest record first (created_at DESC), secondary stable sort on registrationCode DESC
      const timeA = new Date((a as any).createdAt || (a as any).created_at || a.registrationDate || 0).getTime();
      const timeB = new Date((b as any).createdAt || (b as any).created_at || b.registrationDate || 0).getTime();
      if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.registrationCode || '').localeCompare(String(a.registrationCode || ''));
    });
  }, [records, searchTerm, activeStatusTab]);

  // Pagination Control
  const pagination = usePagination({
    totalItems: filteredRecords.length,
    initialPageSize: 10,
    resetDependencies: [searchTerm, activeStatusTab]
  });
  const paginatedRecords = pagination.paginateItems(filteredRecords);

  // Real document verification readiness checks
  const missingCertifications = useMemo(() => {
    if (!selectedDetail) return [];
    const isWhoGmpExempt = (selectedDetail as any).whoGmpApplicable === false;
    return MANDATORY_MFR_CERTIFICATIONS.filter(mand => {
      if (mand.key === 'whoGmpCert' && isWhoGmpExempt) return false;
      return !selectedDetail.documents?.some(d => isDocMatchingMandatory(d.category, d.categoryDisplayName, mand.key));
    });
  }, [selectedDetail]);

  const unverifiedMandatory = useMemo(() => {
    if (!selectedDetail) return [];
    const isWhoGmpExempt = (selectedDetail as any).whoGmpApplicable === false;
    return MANDATORY_MFR_CERTIFICATIONS.filter(mand => {
      if (mand.key === 'whoGmpCert' && isWhoGmpExempt) return false;
      const doc = selectedDetail.documents?.find(d => isDocMatchingMandatory(d.category, d.categoryDisplayName, mand.key));
      return !doc || (doc.status !== 'APPROVED' && doc.status !== 'VALID');
    });
  }, [selectedDetail]);

  const hasUnreviewedDocs = useMemo(() => {
    return selectedDetail?.documents?.some(d => d.status === 'PENDING' || d.status === 'PENDING_VERIFICATION') || false;
  }, [selectedDetail]);

  const hasRejectedDocs = useMemo(() => {
    return selectedDetail?.documents?.some(d => d.status === 'REJECTED' || d.status === 'NEEDS_REPLACEMENT') || false;
  }, [selectedDetail]);

  const isCaseReadyForApproval = useMemo(() => {
    if (!selectedDetail || selectedRecord?.status === 'APPROVED') return false;
    return missingCertifications.length === 0 && unverifiedMandatory.length === 0 && !hasUnreviewedDocs && !hasRejectedDocs;
  }, [selectedDetail, selectedRecord, missingCertifications, unverifiedMandatory, hasUnreviewedDocs, hasRejectedDocs]);

  // Execution Handlers with Real Backend Integration
  const handleExecuteApprove = async () => {
    if (!selectedRecord || isActionPending) return;
    setIsActionPending(true);
    try {
      const res = await adminVerificationApi.approveManufacturerVerification(selectedRecord.registrationCode);
      showToast(`✓ ${res.message || 'Manufacturer approved & activated successfully.'}`, 'success');
      addAuditLog('Manufacturer Verification', `Approved & activated manufacturer ${selectedRecord.companyName} (${selectedRecord.registrationCode})`);
      setDecisionType(null);
      await loadList();
      if (selectedRecordId) {
        const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecordId);
        setSelectedDetail(refreshed);
      }
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleExecuteNeedMoreDocs = async () => {
    if (!selectedRecord || isActionPending) return;
    if (!missingDocInput.trim()) {
      showToast('Please specify the required document name.', 'error');
      return;
    }

    setIsActionPending(true);
    try {
      const notes = [missingDocInput.trim() + (missingReasonInput ? `: ${missingReasonInput.trim()}` : '')];
      await adminVerificationApi.requestMoreManufacturerDocs(selectedRecord.registrationCode, notes);
      showToast(`Requested additional document from ${selectedRecord.companyName}.`, 'success');
      setDecisionType(null);
      setMissingDocInput('');
      setMissingReasonInput('');
      await loadList();
      if (selectedRecordId) {
        const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecordId);
        setSelectedDetail(refreshed);
      }
    } catch (err: any) {
      showToast(`Request failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!selectedRecord || isActionPending) return;
    if (!rejectionReason.trim()) {
      showToast('Please provide a mandatory rejection reason.', 'error');
      return;
    }

    setIsActionPending(true);
    try {
      await adminVerificationApi.rejectManufacturerVerification(selectedRecord.registrationCode, rejectionReason.trim());
      showToast(`Rejection recorded for ${selectedRecord.companyName}.`, 'success');
      addAuditLog('Manufacturer Verification', `Rejected manufacturer ${selectedRecord.companyName}. Reason: ${rejectionReason}`);
      setDecisionType(null);
      setRejectionReason('');
      await loadList();
      if (selectedRecordId) {
        const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecordId);
        setSelectedDetail(refreshed);
      }
    } catch (err: any) {
      showToast(`Rejection failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReviewDocument = async (docId: string, docName: string, decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT') => {
    if (!selectedRecord || isActionPending) return;
    let reason: string | undefined = undefined;
    if (decision === 'REJECTED' || decision === 'NEEDS_REPLACEMENT') {
      const promptText = decision === 'REJECTED' ? `Enter mandatory reason for rejecting ${docName}:` : `Enter replacement requirements for ${docName}:`;
      const input = window.prompt(promptText)?.trim();
      if (!input) {
        showToast('A reason is required to reject or request replacement.', 'error');
        return;
      }
      reason = input;
    }

    setIsActionPending(true);
    try {
      await adminVerificationApi.reviewManufacturerDocument(selectedRecord.registrationCode, docId, decision, reason);
      showToast(`Document "${docName}" marked as ${decision === 'APPROVED' ? 'Approved' : decision === 'REJECTED' ? 'Rejected' : 'Needs Replacement'}.`, 'success');
      setViewingDoc((prev: any) => (prev && prev.id === docId ? {
        ...prev,
        status: decision === 'APPROVED' ? 'VALID' : decision,
        rejectionReason: reason || null,
      } : prev));
      await loadList();
      if (selectedRecordId) {
        const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecordId);
        setSelectedDetail(refreshed);
      }
    } catch (err: any) {
      showToast(`Document review failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReviewGallery = async (galleryId: string, title: string, decision: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRecord || isActionPending) return;
    let reason: string | undefined = undefined;
    if (decision === 'REJECTED') {
      const promptRes = window.prompt(`Enter reason for rejecting factory photo "${title}":`, 'Image quality or location proof insufficient');
      if (promptRes === null) return;
      if (!promptRes.trim()) {
        showToast('A reason is required to reject a factory photo.', 'error');
        return;
      }
      reason = promptRes.trim();
    }

    setIsActionPending(true);
    try {
      await adminVerificationApi.reviewManufacturerGalleryEntry(selectedRecord.registrationCode, galleryId, decision, reason);
      showToast(`✓ Gallery photo "${title}" marked as ${decision}.`, 'success');
      addAuditLog('Gallery Verification', `${decision} gallery photo "${title}" for ${selectedRecord.companyName}`);
      const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecord.registrationCode);
      setSelectedDetail(refreshed);
      if (viewingPhoto && viewingPhoto.id === galleryId) {
        setViewingPhoto((prev: any) => ({ ...prev, verificationStatus: decision }));
      }
    } catch (err: any) {
      showToast(`Gallery review failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleReviewAchievement = async (achievementId: string, title: string, decision: 'VERIFIED' | 'REJECTED') => {
    if (!selectedRecord || isActionPending) return;
    let reason: string | undefined = undefined;
    if (decision === 'REJECTED') {
      const promptRes = window.prompt(`Enter reason for rejecting achievement "${title}":`, 'Supporting document could not be authenticated');
      if (promptRes === null) return;
      if (!promptRes.trim()) {
        showToast('A reason is required to reject an achievement.', 'error');
        return;
      }
      reason = promptRes.trim();
    }

    setIsActionPending(true);
    try {
      await adminVerificationApi.reviewManufacturerAchievement(selectedRecord.registrationCode, achievementId, decision, reason);
      showToast(`✓ Achievement "${title}" marked as ${decision}.`, 'success');
      addAuditLog('Achievement Verification', `${decision} achievement "${title}" for ${selectedRecord.companyName}`);
      const refreshed = await adminVerificationApi.getManufacturerVerification(selectedRecord.registrationCode);
      setSelectedDetail(refreshed);
    } catch (err: any) {
      showToast(`Achievement review failed: ${err.message}`, 'error');
    } finally {
      setIsActionPending(false);
    }
  };

  // Render Status Badge identical to Customer Verification
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'Approved':
      case 'Active':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} /> Approved
          </span>
        );
      case 'UNDER_REVIEW':
      case 'Under Review':
      case 'SUBMITTED':
      case 'Submitted':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} /> Under Review
          </span>
        );
      case 'ACTION_REQUIRED':
      case 'Need More Docs':
      case 'NEEDS_REPLACEMENT':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FDF2F8', color: '#DB2777', border: '1px solid #FBCFE8' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DB2777' }} /> Need More Docs
          </span>
        );
      case 'REJECTED':
      case 'Rejected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, background: '#F8FAFC', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#DC2626' : '#059669',
          color: '#FFF',
          padding: '12px 18px',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)'
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 2 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── 1. TOP HEADER BAR (MATCHES CUSTOMER VERIFICATION) ────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <Factory size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <span>Compliance Workflow</span>
              <ChevronRight size={12} />
              <span style={{ color: '#2563EB', fontWeight: 600 }}>Manufacturer Verification</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              Manufacturer Onboarding Verification
            </h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
              Manufacturer registration → Document submission → Compliance review → Regulatory validation → Active provisioning
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefreshedAt && (
            <span style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Refreshed: <strong>{lastRefreshedAt}</strong>
            </span>
          )}

          <button
            onClick={loadList}
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

      {/* ── 2. KPI STRIP (MATCHES CUSTOMER VERIFICATION SUMMARY CARDS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <div
          onClick={() => setActiveStatusTab('ALL')}
          style={{
            background: '#FFFFFF',
            border: activeStatusTab === 'ALL' ? '2px solid #2563EB' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 120ms ease'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Requests</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 6, fontFamily: 'monospace' }}>{counts.total}</div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>All manufacturer registrations</div>
        </div>

        <div
          onClick={() => setActiveStatusTab('UNDER_REVIEW')}
          style={{
            background: '#FFFFFF',
            border: activeStatusTab === 'UNDER_REVIEW' ? '2px solid #D97706' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 120ms ease'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>Under Review</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#D97706', marginTop: 6, fontFamily: 'monospace' }}>{counts.underReview}</div>
          <div style={{ fontSize: 11, color: '#D97706', marginTop: 4 }}>Assigned for compliance audit</div>
        </div>

        <div
          onClick={() => setActiveStatusTab('NEED_MORE_DOCS')}
          style={{
            background: '#FFFFFF',
            border: activeStatusTab === 'NEED_MORE_DOCS' ? '2px solid #DB2777' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 120ms ease'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#DB2777', textTransform: 'uppercase' }}>Need More Docs</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DB2777', marginTop: 6, fontFamily: 'monospace' }}>{counts.needMoreDocs}</div>
          <div style={{ fontSize: 11, color: '#DB2777', marginTop: 4 }}>Action required / replacements</div>
        </div>

        <div
          onClick={() => setActiveStatusTab('APPROVED')}
          style={{
            background: '#FFFFFF',
            border: activeStatusTab === 'APPROVED' ? '2px solid #16A34A' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 120ms ease'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#16A34A', textTransform: 'uppercase' }}>Approved / Active</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16A34A', marginTop: 6, fontFamily: 'monospace' }}>{counts.approved}</div>
          <div style={{ fontSize: 11, color: '#16A34A', marginTop: 4 }}>Manufacturer code &amp; login active</div>
        </div>

        <div
          onClick={() => setActiveStatusTab('REJECTED')}
          style={{
            background: '#FFFFFF',
            border: activeStatusTab === 'REJECTED' ? '2px solid #DC2626' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '16px 18px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            transition: 'all 120ms ease'
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Rejected</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#DC2626', marginTop: 6, fontFamily: 'monospace' }}>{counts.rejected}</div>
          <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Statutory non-compliance ended</div>
        </div>
      </div>

      {apiError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', color: '#991B1B', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{apiError}</span>
        </div>
      )}

      {/* ── 3. SEARCH & FILTERS BAR (MATCHES CUSTOMER VERIFICATION) ─ */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: `All (${counts.total})` },
            { id: 'UNDER_REVIEW', label: `Under Review (${counts.underReview})` },
            { id: 'NEED_MORE_DOCS', label: `Need More Docs (${counts.needMoreDocs})` },
            { id: 'APPROVED', label: `Approved / Active (${counts.approved})` },
            { id: 'REJECTED', label: `Rejected (${counts.rejected})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStatusTab(tab.id as any)}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: activeStatusTab === tab.id ? 700 : 500,
                background: activeStatusTab === tab.id ? '#2563EB' : 'transparent',
                color: activeStatusTab === tab.id ? '#FFFFFF' : '#475569',
                border: activeStatusTab === tab.id ? 'none' : '1px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search company, code, city, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: 260,
                height: 36,
                paddingLeft: 34,
                paddingRight: 12,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none',
                background: '#FFFFFF',
                color: '#0F172A',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 4. STRUCTURED MANUFACTURER TABLE (MATCHES CUSTOMER VERIFICATION) ─ */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 11.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ padding: '14px 18px' }}>Manufacturer Name</th>
              <th style={{ padding: '14px 18px' }}>Registration Code</th>
              <th style={{ padding: '14px 18px' }}>Location</th>
              <th style={{ padding: '14px 18px' }}>Registration Date</th>
              <th style={{ padding: '14px 18px' }}>Verification Status</th>
              <th style={{ padding: '14px 18px' }}>Account Status</th>
              <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && records.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#2563EB' }} />
                  <div>Loading live manufacturer records from database...</div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                  No manufacturer verification records found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedRecords.map(record => {
                const isSelected = record.registrationCode === selectedRecordId;
                const isActive = record.status === 'APPROVED';

                return (
                  <tr
                    key={record.registrationCode}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      transition: 'background 120ms ease'
                    }}
                    className="hover:bg-slate-50"
                  >
                    <td style={{ padding: '16px 18px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 12
                        }}>
                          {(record.companyName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{record.companyName}</div>
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>{record.contactPerson} • {record.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 18px', fontSize: 12, fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace' }}>
                      <div>{record.registrationCode}</div>
                      {record.manufacturerCode && (
                        <div style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 700 }}>
                          ID: {record.manufacturerCode}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '16px 18px', fontSize: 12.5, color: '#475569' }}>
                      {record.city ? `${record.city}, ${record.state}` : 'Location N/A'}
                    </td>

                    <td style={{ padding: '16px 18px', fontSize: 12.5, color: '#475569' }}>
                      {formatDate(record.submittedAt)}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      {renderStatusBadge(record.status)}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isActive ? '#ECFDF5' : '#F1F5F9',
                        color: isActive ? '#059669' : '#64748B',
                        border: `1px solid ${isActive ? '#A7F3D0' : '#E2E8F0'}`
                      }}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedRecordId(record.registrationCode)}
                          style={{
                            height: 32,
                            padding: '0 16px',
                            borderRadius: 6,
                            background: '#1D4ED8',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 1px 2px rgba(29, 78, 216, 0.2)'
                          }}
                        >
                          <FileCheck size={14} /> Review
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PaginationControl {...pagination.paginationProps} itemName="manufacturer registrations" />

      {/* ── 5. MANUFACTURER VERIFICATION DETAIL DRAWER (MATCHES CUSTOMER VERIFICATION DRAWER) ── */}
      {selectedRecordId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 820,
            background: '#FFFFFF',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>

            {/* Drawer Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>
                    {selectedRecord?.registrationCode || selectedRecordId}
                  </span>
                  {selectedRecord && renderStatusBadge(selectedRecord.status)}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '4px 0 0' }}>
                  {selectedRecord?.companyName || 'Manufacturer Details'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRecordId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* A. Manufacturer Profile Section */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} style={{ color: '#2563EB' }} />
                  <span>Manufacturer Profile</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, fontSize: 12 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Company Name:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 1 }}>{selectedRecord?.companyName}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Registration Code:</span>
                    <div style={{ fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace', marginTop: 1 }}>{selectedRecord?.registrationCode}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B' }}>Facility Address:</span>
                    <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>
                      {selectedDetail?.company
                        ? `${selectedDetail.company.facilityAddress}, ${selectedDetail.company.city}, ${selectedDetail.company.state} - ${selectedDetail.company.pincode}`
                        : `${selectedRecord?.city}, ${selectedRecord?.state}`}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Contact Person:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                      {selectedDetail?.company?.contactPerson || selectedRecord?.contactPerson} ({selectedDetail?.company?.designation || 'Representative'})
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Email:</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{selectedDetail?.company?.email || selectedRecord?.email}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Phone:</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{selectedDetail?.company?.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Manufacturing Capacity:</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{selectedDetail?.company?.mfgCapacity || 'Standard Capacity'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Submission Date:</span>
                    <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 1 }}>{formatDate(selectedRecord?.submittedAt)}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Account Status:</span>
                    <div style={{ fontWeight: 700, color: selectedRecord?.status === 'APPROVED' ? '#16A34A' : '#DC2626', marginTop: 1 }}>
                      {selectedRecord?.status === 'APPROVED' ? 'ACTIVE' : 'PENDING ACTIVATION'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Regulatory Compliance Scope:</span>
                    <div style={{ marginTop: 2 }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        background: (selectedDetail as any)?.whoGmpApplicable === false ? '#F1F5F9' : '#ECFDF5',
                        color: (selectedDetail as any)?.whoGmpApplicable === false ? '#475569' : '#047857',
                        border: (selectedDetail as any)?.whoGmpApplicable === false ? '1px solid #CBD5E1' : '1px solid #A7F3D0'
                      }}>
                        {(selectedDetail as any)?.whoGmpApplicable === false ? 'Domestic Schedule M Only (WHO-GMP Exempt)' : 'WHO-GMP Certified / Export Plant'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedDetail?.rejectionReason && (
                  <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B' }}>
                    <strong>Rejection Notes:</strong> {selectedDetail.rejectionReason}
                  </div>
                )}
              </div>

              {/* B. Statutory Documents Section */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(15,23,42,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={16} style={{ color: '#1D4ED8' }} />
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      Statutory Compliance Documents ({selectedDetail?.documents?.length || 0} Uploaded)
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4 }}>
                    PostgreSQL &amp; MinIO
                  </span>
                </div>

                {isDetailLoading ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: 12.5 }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', color: '#2563EB' }} />
                    <div>Loading certificates from database...</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selectedDetail?.documents?.map(doc => {
                      const isApproved = doc.status === 'APPROVED' || doc.status === 'VALID';
                      const isRejected = doc.status === 'REJECTED';
                      const isReplacement = doc.status === 'NEEDS_REPLACEMENT';
                      const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();

                      return (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            background: '#F8FAFC',
                            borderRadius: 8,
                            border: `1px solid ${isApproved ? '#BBF7D0' : isRejected ? '#FECACA' : '#E2E8F0'}`,
                            flexWrap: 'wrap',
                            gap: 10
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 240 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: isApproved ? '#F0FDF4' : isRejected ? '#FEF2F2' : '#EFF6FF',
                              color: isApproved ? '#16A34A' : isRejected ? '#DC2626' : '#1D4ED8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileText size={16} />
                            </div>

                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span>{doc.categoryDisplayName || doc.category}</span>
                                <span style={{
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  padding: '1.5px 6px',
                                  borderRadius: 4,
                                  color: isApproved ? '#15803D' : isRejected ? '#DC2626' : isReplacement ? '#DB2777' : '#D97706',
                                  background: isApproved ? '#DCFCE7' : isRejected ? '#FEE2E2' : isReplacement ? '#FCE7F3' : '#FEF3C7'
                                }}>
                                  {isApproved ? '✓ Verified' : isRejected ? '✕ Rejected' : isReplacement ? '⚠ Needs Replacement' : '⏳ Pending'}
                                </span>
                                {isExpired && (
                                  <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#DC2626', color: '#FFF' }}>
                                    EXPIRED
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                File: <strong>{doc.fileName}</strong> ({formatFileSize(doc.fileSize)}){doc.expiryDate ? <> • Expiry: <strong>{formatDate(doc.expiryDate)}</strong></> : null}
                              </div>

                              {doc.rejectionReason && (
                                <div style={{ marginTop: 4, fontSize: 11, color: '#DC2626', background: '#FEF2F2', padding: '2px 6px', borderRadius: 4 }}>
                                  <strong>Reason:</strong> {doc.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={() => setViewingDoc(doc)}
                              style={{
                                padding: '4px 10px',
                                background: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: 5,
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: '#1D4ED8',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <Eye size={12} /> View
                            </button>

                            {!isApproved && (
                              <button
                                onClick={() => handleReviewDocument(doc.id, doc.categoryDisplayName || doc.category, 'APPROVED')}
                                disabled={isActionPending}
                                style={{
                                  padding: '4px 10px',
                                  background: '#16A34A',
                                  border: 'none',
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  cursor: isActionPending ? 'not-allowed' : 'pointer'
                                }}
                              >
                                ✓ Verify
                              </button>
                            )}

                            {!isRejected && (
                              <button
                                onClick={() => handleReviewDocument(doc.id, doc.categoryDisplayName || doc.category, 'REJECTED')}
                                disabled={isActionPending}
                                style={{
                                  padding: '4px 8px',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECACA',
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#991B1B',
                                  cursor: isActionPending ? 'not-allowed' : 'pointer'
                                }}
                              >
                                ✕ Reject
                              </button>
                            )}

                            {!isReplacement && (
                              <button
                                onClick={() => handleReviewDocument(doc.id, doc.categoryDisplayName || doc.category, 'NEEDS_REPLACEMENT')}
                                disabled={isActionPending}
                                style={{
                                  padding: '4px 8px',
                                  background: '#FDF2F8',
                                  border: '1px solid #FBCFE8',
                                  borderRadius: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#9D174D',
                                  cursor: isActionPending ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Replacement
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Missing Mandatory Document Warnings */}
                    {missingCertifications.map(mand => (
                      <div
                        key={mand.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#FFFBEB',
                          borderRadius: 8,
                          border: '1px dashed #F59E0B',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AlertTriangle size={16} style={{ color: '#D97706' }} />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{mand.name}</span>
                              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4 }}>
                                MANDATORY
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#B45309' }}>
                              Statutory requirement. Awaiting manufacturer upload.
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                          Required for Approval
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* C. Manufacturing Capabilities Collapsible */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => setIsCapabilitiesOpen(prev => !prev)}
                  style={{
                    padding: '12px 18px',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isCapabilitiesOpen ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={16} style={{ color: '#0F766E' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Manufacturing Capabilities ({selectedDetail?.products?.length || 0} Products)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12 }}>
                    <span>{isCapabilitiesOpen ? 'Collapse' : 'Expand'}</span>
                    {isCapabilitiesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {isCapabilitiesOpen && (
                  <div style={{ padding: 14 }}>
                    {(!selectedDetail?.products || selectedDetail.products.length === 0) ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 12, border: '1px dashed #CBD5E1', borderRadius: 6 }}>
                        No manufacturing capabilities registered yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                        {selectedDetail.products.map(p => (
                          <div
                            key={p.productId || p.productCode}
                            style={{
                              padding: '10px 12px',
                              background: '#F8FAFC',
                              borderRadius: 6,
                              border: '1px solid #E2E8F0',
                              fontSize: 11.5
                            }}
                          >
                            <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{p.name}</span>
                              <span style={{ fontSize: 10, color: '#2563EB', fontFamily: 'monospace' }}>{p.productCode}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                              {p.category} {p.dosageForm ? `• ${p.dosageForm}` : ''}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748B', marginTop: 6, paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                              <span>Pack: <strong>{p.packSize || 'Standard'}</strong></span>
                              <span>MOQ: <strong>{p.moq ? p.moq.toLocaleString() : 'N/A'}</strong></span>
                              <span>Lead: <strong>{p.leadTimeDays ? `${p.leadTimeDays}d` : 'N/A'}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* D. Factory Gallery Collapsible */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => setIsGalleryOpen(prev => !prev)}
                  style={{
                    padding: '12px 18px',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isGalleryOpen ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImageIcon size={16} style={{ color: '#0F766E' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Factory Gallery ({selectedDetail?.gallery?.length || 0} Photos)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12 }}>
                    <span>{isGalleryOpen ? 'Collapse' : 'Expand'}</span>
                    {isGalleryOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {isGalleryOpen && (
                  <div style={{ padding: 14 }}>
                    {(!selectedDetail?.gallery || selectedDetail.gallery.length === 0) ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 12, border: '1px dashed #CBD5E1', borderRadius: 6 }}>
                        No factory photos uploaded yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                        {selectedDetail.gallery.map(item => {
                          const isVerified = item.verificationStatus === 'VERIFIED';
                          const isRejected = item.verificationStatus === 'REJECTED';

                          return (
                            <div key={item.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                              <div
                                style={{ position: 'relative', width: '100%', height: 120, background: '#0F172A', cursor: 'pointer' }}
                                onClick={() => setViewingPhoto(item)}
                              >
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                />
                                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 3, background: isVerified ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B', color: '#FFF' }}>
                                    {isVerified ? '✓ Verified' : isRejected ? '✕ Rejected' : '⏳ Pending'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ padding: 8, fontSize: 11 }}>
                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.title}</div>
                                <div style={{ color: '#64748B', marginTop: 2 }}>GPS: {formatGpsCoordinates(item.gpsCoordinates)}</div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 6, paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                                  <button onClick={() => setViewingPhoto(item)} style={{ flex: 1, padding: '3px', background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 10.5, fontWeight: 700, color: '#1D4ED8', cursor: 'pointer' }}>View</button>
                                  {!isVerified && <button onClick={() => handleReviewGallery(item.id, item.title, 'VERIFIED')} style={{ padding: '3px 6px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>Verify</button>}
                                  {!isRejected && <button onClick={() => handleReviewGallery(item.id, item.title, 'REJECTED')} style={{ padding: '3px 6px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 4, fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}>Reject</button>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* E. Achievements Collapsible */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => setIsAchievementsOpen(prev => !prev)}
                  style={{
                    padding: '12px 18px',
                    background: '#F8FAFC',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isAchievementsOpen ? '1px solid #E2E8F0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={16} style={{ color: '#8B5CF6' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Achievements &amp; Quality Awards ({selectedDetail?.achievements?.length || 0} Submitted)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12 }}>
                    <span>{isAchievementsOpen ? 'Collapse' : 'Expand'}</span>
                    {isAchievementsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {isAchievementsOpen && (
                  <div style={{ padding: 14 }}>
                    {(!selectedDetail?.achievements || selectedDetail.achievements.length === 0) ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: 12, border: '1px dashed #CBD5E1', borderRadius: 6 }}>
                        No achievements or quality awards submitted yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedDetail.achievements.map(item => {
                          const isVerified = item.verificationStatus === 'VERIFIED';
                          const isRejected = item.verificationStatus === 'REJECTED';

                          return (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 11.5 }}>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.title} ({item.awardType})</div>
                                <div style={{ color: '#64748B', fontSize: 11 }}>Issuer: {item.issuingOrganization} • {formatDate(item.issueDate)}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {item.certificateUrl && (
                                  <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '3px 8px', background: '#FFF', border: '1px solid #CBD5E1', borderRadius: 4, color: '#1D4ED8', textDecoration: 'none', fontSize: 11, fontWeight: 700 }}>Download</a>
                                )}
                                {!isVerified && <button onClick={() => handleReviewAchievement(item.id, item.title, 'VERIFIED')} style={{ padding: '3px 8px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Verify</button>}
                                {!isRejected && <button onClick={() => handleReviewAchievement(item.id, item.title, 'REJECTED')} style={{ padding: '3px 8px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Reject</button>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* F. Compliance Decision Panel */}
              <div style={{
                background: '#FFFFFF',
                border: `1.5px solid ${selectedRecord?.status === 'APPROVED' ? '#BBF7D0' : isCaseReadyForApproval ? '#86EFAC' : '#E2E8F0'}`,
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} style={{ color: '#16A34A' }} />
                    <span>Compliance Decision</span>
                  </div>

                  {selectedRecord?.status === 'APPROVED' ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
                      ✓ Case Approved &amp; Active
                    </span>
                  ) : isCaseReadyForApproval ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
                      ✓ Ready for Approval
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '2px 8px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                      ⏳ Requirements Incomplete
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                  {selectedRecord?.status === 'APPROVED'
                    ? `Account is verified and active with Manufacturer Code ${selectedRecord.manufacturerCode || 'issued'}.`
                    : isCaseReadyForApproval
                    ? 'All mandatory statutory certificates are verified. You can now approve and activate this manufacturer in the marketplace.'
                    : unverifiedMandatory.length > 0
                    ? `Approval blocked: ${unverifiedMandatory.length} mandatory certificate(s) pending verification (${unverifiedMandatory.map(m => m.name).join(', ')}).`
                    : hasUnreviewedDocs
                    ? 'Approval blocked: Please review all uploaded documents.'
                    : hasRejectedDocs
                    ? 'Approval blocked: Some documents were rejected. Awaiting replacement.'
                    : 'Mandatory certificates must be verified before approval.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                  <button
                    onClick={() => setDecisionType('NEED_MORE_DOCS')}
                    disabled={selectedRecord?.status === 'APPROVED' || isActionPending}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 6,
                      background: '#DB2777',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: (selectedRecord?.status === 'APPROVED' || isActionPending) ? 'not-allowed' : 'pointer',
                      opacity: selectedRecord?.status === 'APPROVED' ? 0.4 : 1
                    }}
                  >
                    Need More Docs
                  </button>

                  <button
                    onClick={() => setDecisionType('REJECT')}
                    disabled={selectedRecord?.status === 'APPROVED' || isActionPending}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 6,
                      background: '#DC2626',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: (selectedRecord?.status === 'APPROVED' || isActionPending) ? 'not-allowed' : 'pointer',
                      opacity: selectedRecord?.status === 'APPROVED' ? 0.4 : 1
                    }}
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => setDecisionType('APPROVE')}
                    disabled={selectedRecord?.status === 'APPROVED' || !isCaseReadyForApproval || isActionPending}
                    title={!isCaseReadyForApproval ? 'All mandatory certificates must be verified before approving' : 'Approve and activate manufacturer'}
                    style={{
                      padding: '7px 18px',
                      borderRadius: 6,
                      background: (selectedRecord?.status === 'APPROVED' || !isCaseReadyForApproval) ? '#94A3B8' : '#16A34A',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: (selectedRecord?.status === 'APPROVED' || !isCaseReadyForApproval || isActionPending) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <CheckCircle size={14} />
                    Approve &amp; Activate →
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── STATUTORY DOCUMENT VIEWER MODAL ─────────────────────── */}
      {viewingDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 880, background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
            <div style={{ padding: '14px 20px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{viewingDoc.categoryDisplayName || viewingDoc.category}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.15)', color: '#FFF' }}>
                    {viewingDoc.status}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
                  File: <strong style={{ color: '#E2E8F0' }}>{viewingDoc.fileName}</strong> • Expiry: {formatDate(viewingDoc.expiryDate)}
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

            <div style={{ flex: 1, overflowY: 'auto', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 460, position: 'relative' }}>
              {isDocLoading && (
                <div style={{ textAlign: 'center', color: '#CBD5E1', padding: 40 }}>
                  <RefreshCw size={36} style={{ margin: '0 auto 12px', color: '#38BDF8', animation: 'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Retrieving uploaded statutory certification...</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Streaming verified file from storage</div>
                </div>
              )}

              {docLoadError && !isDocLoading && (
                <div style={{ textAlign: 'center', color: '#F87171', background: '#1E293B', padding: 32, borderRadius: 10, margin: 24, border: '1px solid #7F1D1D' }}>
                  <AlertCircle size={40} style={{ margin: '0 auto 12px', color: '#EF4444' }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px 0', color: '#FCA5A5' }}>Document Storage Error</h4>
                  <div style={{ fontSize: 13, color: '#E2E8F0' }}>{docLoadError}</div>
                </div>
              )}

              {docBlobUrl && !isDocLoading && (
                docBlobType.startsWith('image/') ? (
                  <div style={{ padding: 16, textAlign: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={docBlobUrl}
                      alt={viewingDoc.fileName}
                      style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 6 }}
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

            {/* Review Action Controls Bar */}
            <div style={{ padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                Compliance Officer Action:
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.categoryDisplayName || viewingDoc.category, 'APPROVED')}
                  disabled={(viewingDoc.status === 'APPROVED' || viewingDoc.status === 'VALID') || isActionPending}
                  style={{
                    padding: '7px 16px',
                    background: (viewingDoc.status === 'APPROVED' || viewingDoc.status === 'VALID') ? '#94A3B8' : '#16A34A',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: ((viewingDoc.status === 'APPROVED' || viewingDoc.status === 'VALID') || isActionPending) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {(viewingDoc.status === 'APPROVED' || viewingDoc.status === 'VALID') ? '✓ Verified' : 'Verify Document'}
                </button>

                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.categoryDisplayName || viewingDoc.category, 'REJECTED')}
                  disabled={viewingDoc.status === 'REJECTED' || isActionPending}
                  style={{
                    padding: '7px 14px',
                    background: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: (viewingDoc.status === 'REJECTED' || isActionPending) ? 'not-allowed' : 'pointer'
                  }}
                >
                  ✕ Reject
                </button>

                <button
                  onClick={() => handleReviewDocument(viewingDoc.id, viewingDoc.categoryDisplayName || viewingDoc.category, 'NEEDS_REPLACEMENT')}
                  disabled={isActionPending}
                  style={{
                    padding: '7px 14px',
                    background: '#FDF2F8',
                    color: '#9D174D',
                    border: '1px solid #FBCFE8',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isActionPending ? 'not-allowed' : 'pointer'
                  }}
                >
                  Request Replacement
                </button>

                <button
                  onClick={() => setViewingDoc(null)}
                  style={{ padding: '7px 16px', background: '#FFFFFF', color: '#334155', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FACTORY PHOTO LIGHTBOX MODAL ───────────────────────── */}
      {viewingPhoto && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setViewingPhoto(null)}
        >
          <div
            style={{ maxWidth: 850, width: '100%', maxHeight: '90vh', background: '#FFFFFF', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{viewingPhoto.title}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: viewingPhoto.verificationStatus === 'VERIFIED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: viewingPhoto.verificationStatus === 'VERIFIED' ? '#10B981' : '#F59E0B' }}>
                  {viewingPhoto.verificationStatus}
                </span>
              </div>
              <button onClick={() => setViewingPhoto(null)} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ background: '#090D16', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '55vh', overflow: 'hidden' }}>
              <img src={viewingPhoto.imageUrl} alt={viewingPhoto.title} style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }} />
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 11.5, border: '1px solid #E2E8F0' }}>
                <div>Location: <strong>{viewingPhoto.factoryLocation || 'N/A'}</strong></div>
                <div>GPS: <strong style={{ fontFamily: 'monospace' }}>{formatGpsCoordinates(viewingPhoto.gpsCoordinates)}</strong></div>
                <div>Capture Date: <strong>{formatDate(viewingPhoto.captureDate)}</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                {viewingPhoto.verificationStatus !== 'VERIFIED' && (
                  <button onClick={() => handleReviewGallery(viewingPhoto.id, viewingPhoto.title, 'VERIFIED')} style={{ padding: '6px 14px', background: '#16A34A', color: '#FFF', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Verify</button>
                )}
                {viewingPhoto.verificationStatus !== 'REJECTED' && (
                  <button onClick={() => handleReviewGallery(viewingPhoto.id, viewingPhoto.title, 'REJECTED')} style={{ padding: '6px 14px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Reject</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DECISION MODAL DIALOGS ────────────────────────────── */}
      {decisionType === 'APPROVE' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 14, padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16A34A', fontWeight: 800, fontSize: 16 }}>
              <CheckCircle2 size={20} /> Approve Manufacturer Onboarding
            </div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 12 }}>
              Are you sure you want to approve <strong>{selectedRecord.companyName}</strong> ({selectedRecord.registrationCode})?
            </div>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 12, color: '#166534', lineHeight: 1.4 }}>
              ✓ All statutory compliance certificates have been verified.<br />
              ✓ An official Manufacturer Code will be issued in PostgreSQL.<br />
              ✓ The manufacturer portal login account will be activated immediately.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setDecisionType(null)}
                disabled={isActionPending}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteApprove}
                disabled={isActionPending}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: isActionPending ? 'not-allowed' : 'pointer' }}
              >
                {isActionPending ? 'Processing...' : 'Confirm & Approve →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionType === 'NEED_MORE_DOCS' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#FFFFFF', borderRadius: 14, padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DB2777', fontWeight: 800, fontSize: 16 }}>
              <AlertTriangle size={20} /> Request Additional / Replacement Documents
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Document Name / Category *
                </label>
                <input
                  type="text"
                  placeholder="e.g. WHO-GMP Certificate or Valid Form 25 License"
                  value={missingDocInput}
                  onChange={e => setMissingDocInput(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Auditor Remarks / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this document is required or why the previous upload was insufficient..."
                  value={missingReasonInput}
                  onChange={e => setMissingReasonInput(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setDecisionType(null)}
                disabled={isActionPending}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteNeedMoreDocs}
                disabled={isActionPending}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DB2777', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: isActionPending ? 'not-allowed' : 'pointer' }}
              >
                {isActionPending ? 'Submitting...' : 'Send Request →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {decisionType === 'REJECT' && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 14, padding: 22, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', fontWeight: 800, fontSize: 16 }}>
              <XCircle size={20} /> Reject Manufacturer Verification
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Mandatory Rejection Reason *
              </label>
              <textarea
                rows={3}
                placeholder="State the statutory non-compliance reason or inspection failure..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setDecisionType(null)}
                disabled={isActionPending}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReject}
                disabled={isActionPending}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#FFF', fontSize: 12.5, fontWeight: 800, cursor: isActionPending ? 'not-allowed' : 'pointer' }}
              >
                {isActionPending ? 'Submitting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
