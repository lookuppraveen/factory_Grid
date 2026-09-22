import React, { useState } from 'react';
import { X, ShieldCheck, Send, FileText, Paperclip, AlertCircle } from 'lucide-react';
import { QaCategory, QaPriority, QaRequestItem } from '../../types';

export const QA_REQUESTS_KEY = 'factorygrid_qa_requests_v2';

export const getStoredQaRequests = (): QaRequestItem[] => {
  try {
    const saved = localStorage.getItem(QA_REQUESTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }

  // Pre-populated default mock requests if empty
  const initialRequests: QaRequestItem[] = [
    {
      id: 'qa-req-1001',
      qaNumber: 'QA-2026-1001',
      subject: 'HPLC Dissolution & Assay Purity Limits Verification',
      description: 'Requesting Admin Quality Desk to verify batch assay dissolution certificate for Paracetamol 500mg batch BATCH-2026-8801 before final warehouse dispatch.',
      category: 'ASSAY_TESTING',
      priority: 'HIGH',
      raisedByRole: 'BUYER',
      raisedByName: 'Vikram Mehta (Procurement Lead)',
      raisedByOrg: 'Apex Pharma PCD Franchise',
      createdAt: '24 Aug 2026 10:15 AM',
      contextType: 'ORDER',
      contextId: 'MO-2026-1001',
      contextNumber: 'MO-2026-1001',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Paracetamol 500mg Tablets',
      status: 'PENDING_REVIEW',
      attachmentName: 'CoA_Lab_Assay_Draft_v1.pdf'
    },
    {
      id: 'qa-req-1002',
      qaNumber: 'QA-2026-1002',
      subject: 'Cold-Chain Primary Packaging Material Standard',
      description: 'Query regarding aluminum blister foil thickness specification (25 micron vs 20 micron) for Azithromycin oral solid dosage.',
      category: 'PACKAGING_LABELING',
      priority: 'MEDIUM',
      raisedByRole: 'SUPPLIER',
      raisedByName: 'Rajesh Sharma (QA Manager)',
      raisedByOrg: 'SunBio LifeSciences Ltd',
      createdAt: '24 Aug 2026 11:30 AM',
      contextType: 'SUB_ORDER',
      contextId: 'SO-1001-01',
      contextNumber: 'SO-1001-01',
      manufacturerName: 'SunBio LifeSciences Ltd',
      productName: 'Azithromycin 500mg Tablets',
      status: 'UNDER_REVIEW',
      reviewedBy: 'Admin Quality Governance Desk',
      reviewedAt: '24 Aug 2026 12:00 PM',
      adminResponse: 'Under review by Admin Technical Compliance Officer. Verification with IP pharmacopeia standards ongoing.'
    },
    {
      id: 'qa-req-1003',
      qaNumber: 'QA-2026-1003',
      subject: 'WHO-GMP Certificate Renewal & Regulatory Audit',
      description: 'Requesting Admin clearance for catalog batch compliance for Telmisartan 40mg formulations.',
      category: 'REGULATORY_COMPLIANCE',
      priority: 'LOW',
      raisedByRole: 'BUYER',
      raisedByName: 'Dr. Vikram Sethi',
      raisedByOrg: 'Apex Pharma PCD Franchise',
      createdAt: '23 Aug 2026 03:45 PM',
      contextType: 'PRODUCT',
      contextId: 'PRD-102',
      contextNumber: 'Telmisartan 40mg Tablets',
      productName: 'Telmisartan 40mg Tablets',
      status: 'APPROVED',
      reviewedBy: 'Admin Quality Governance Desk',
      reviewedAt: '23 Aug 2026 05:00 PM',
      adminResponse: 'Approved. WHO-GMP and Drug License verification confirmed active until 2028.'
    }
  ];

  try {
    localStorage.setItem(QA_REQUESTS_KEY, JSON.stringify(initialRequests));
  } catch (e) {}

  return initialRequests;
};

export const saveQaRequests = (requests: QaRequestItem[]) => {
  try {
    localStorage.setItem(QA_REQUESTS_KEY, JSON.stringify(requests));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error(e);
  }
};

interface RaiseQaModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'BUYER' | 'SUPPLIER';
  userName?: string;
  userOrg?: string;

  // Context properties
  contextType?: 'ORDER' | 'SUB_ORDER' | 'PO' | 'PRODUCT' | 'RFQ' | 'GENERAL';
  contextId?: string;
  contextNumber?: string;
  manufacturerName?: string;
  productName?: string;

  onSuccess?: (newReq: QaRequestItem) => void;
}

export const RaiseQaModal: React.FC<RaiseQaModalProps> = ({
  isOpen,
  onClose,
  userRole,
  userName = userRole === 'BUYER' ? 'Apex Procurement Manager' : 'Supplier QA Officer',
  userOrg = userRole === 'BUYER' ? 'Apex Pharma PCD Franchise' : 'SunBio LifeSciences Ltd',
  contextType = 'GENERAL',
  contextId,
  contextNumber,
  manufacturerName,
  productName,
  onSuccess
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QaCategory>('QUALITY_CONTROL');
  const [priority, setPriority] = useState<QaPriority>('MEDIUM');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert('Please fill in both the QA Subject and Description.');
      return;
    }

    setSubmitting(true);

    const requests = getStoredQaRequests();
    const nextSeq = 1000 + requests.length + 1;
    const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReq: QaRequestItem = {
      id: `qa-req-${nextSeq}`,
      qaNumber: `QA-2026-${nextSeq}`,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      raisedByRole: userRole,
      raisedByName: userName,
      raisedByOrg: userOrg,
      createdAt: nowStr,
      contextType,
      contextId: contextId || contextNumber || 'GEN-01',
      contextNumber: contextNumber || 'General Context',
      manufacturerName: manufacturerName || 'SunBio LifeSciences Ltd',
      productName: productName || 'Pharmaceutical Product',
      status: 'PENDING_REVIEW',
      attachmentName: attachment ? attachment.name : undefined
    };

    const updated = [newReq, ...requests];
    saveQaRequests(updated);

    setSubmitting(false);
    if (onSuccess) onSuccess(newReq);
    alert(`✔ QA Query Submitted to Admin Quality Desk!\n\nQA Reference: ${newReq.qaNumber}\nStatus: Pending Admin Review\nContext: ${newReq.contextType} (${newReq.contextNumber})`);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
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
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 600,
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, borderRadius: 8, background: '#EFF6FF', color: '#2563EB' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                Raise QA Query / Issue
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Submitted to Central Admin Quality &amp; Assay Governance Desk for review.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Context Summary Box */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><strong>Raised By Role:</strong> <span style={{ color: '#2563EB', fontWeight: 700 }}>{userRole}</span> ({userOrg})</div>
          <div><strong>Context Type:</strong> <span style={{ color: '#0F766E', fontWeight: 700 }}>{contextType}</span></div>
          {contextNumber && <div><strong>Context Ref #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{contextNumber}</span></div>}
          {productName && <div><strong>Product:</strong> <span>{productName}</span></div>}
          {manufacturerName && <div><strong>Manufacturer:</strong> <span>{manufacturerName}</span></div>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              QA Subject / Query Title *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. HPLC Assay Purity Certificate Verification request..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                QA Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as QaCategory)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
              >
                <option value="QUALITY_CONTROL">Quality Control (QC)</option>
                <option value="ASSAY_TESTING">Lab Assay &amp; CoA Testing</option>
                <option value="SPECIFICATION_QUERY">Product Specification Query</option>
                <option value="PACKAGING_LABELING">Packaging &amp; Labeling QA</option>
                <option value="REGULATORY_COMPLIANCE">Regulatory / WHO-GMP Compliance</option>
                <option value="GENERAL_QA">General QA Concern</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Priority Level
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as QaPriority)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent / Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Detailed Question / Issue Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide complete details about the QA question, test parameter requirements, or quality concern for Admin review..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
              Upload Supporting CoA / Lab Report / Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={e => setAttachment(e.target.files?.[0] || null)}
              style={{ fontSize: 12, color: '#475569' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 16px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#FFF', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={14} /> Submit QA Request to Admin →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
