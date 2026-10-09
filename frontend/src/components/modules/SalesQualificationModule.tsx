import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Clock, Calendar, CheckCircle2, XCircle, Send,
  FileText, Activity, BarChart3, Search, Filter, Phone, Mail, User,
  Building2, Factory, FileCheck, AlertCircle, Plus, Eye, ChevronRight, X,
  CheckSquare, Square, ShieldCheck, ArrowRight, MessageSquare, Lock
} from 'lucide-react';;

export interface EnterpriseAccessRequest {
  id: string;
  referenceId: string;
  companyName: string;
  orgType: 'Buyer Organization' | 'Manufacturer';
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  annualProcurement: string;
  submittedDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'New' | 'Under Review' | 'Meeting Scheduled' | 'Qualified' | 'Rejected' | 'Forwarded to Compliance';
  gstNumber?: string;
  drugLicenseNo?: string;
  mfgLicenseNo?: string;
  productCategories: string;
  mfgRequirement: string;
  notes: string;
  uploadedFiles: { name: string; size: string; type: string }[];
  checklist: {
    companyExists: boolean;
    gstValid: boolean;
    businessCategory: boolean;
    decisionMakerIdentified: boolean;
    requirementConfirmed: boolean;
    procurementVolumeConfirmed: boolean;
    meetingCompleted: boolean;
  };
  crmNotesList: { id: string; timestamp: string; author: string; text: string }[];
}

const initialRequests: EnterpriseAccessRequest[] = [
  {
    id: 'ear-1',
    referenceId: 'REQ-2026-9481',
    companyName: 'Apex Pharma Labs Ltd',
    orgType: 'Buyer Organization',
    contactPerson: 'Dr. Vikram Sethi',
    email: 'v.sethi@apexpharma.com',
    phone: '+91 98765 43210',
    location: 'Hyderabad, Telangana',
    annualProcurement: '₹5 Cr – ₹25 Cr / year',
    submittedDate: '2026-08-07',
    priority: 'HIGH',
    status: 'New',
    gstNumber: '36APXPH0001A1Z5',
    drugLicenseNo: 'DL-20B-2026-99',
    productCategories: 'Paracetamol 650mg, Amoxicillin 500mg, Oncology APIs',
    mfgRequirement: 'Requires WHO-GMP certified 3rd party manufacturing facility with cold-chain dispatch capability.',
    notes: 'High-volume PCD franchise network expanding in South India.',
    uploadedFiles: [
      { name: 'GSTIN_Registration_Certificate.pdf', size: '1.2 MB', type: 'GST' },
      { name: 'Drug_License_Form_20B_21B.pdf', size: '2.4 MB', type: 'DRUG_LICENSE' }
    ],
    checklist: {
      companyExists: true,
      gstValid: true,
      businessCategory: true,
      decisionMakerIdentified: true,
      requirementConfirmed: true,
      procurementVolumeConfirmed: false,
      meetingCompleted: false
    },
    crmNotesList: [
      { id: 'n1', timestamp: '2026-08-07 10:30', author: 'Siddharth Varma', text: 'Verified company registration on MCA portal.' }
    ]
  },
  {
    id: 'ear-2',
    referenceId: 'REQ-2026-8802',
    companyName: 'SunBio LifeSciences Ltd',
    orgType: 'Manufacturer',
    contactPerson: 'Rajesh Sharma',
    email: 'rajesh@sunbiolabs.com',
    phone: '+91 98111 22334',
    location: 'Baddi, Himachal Pradesh',
    annualProcurement: '50M Units / Month (Capacity)',
    submittedDate: '2026-08-06',
    priority: 'HIGH',
    status: 'Under Review',
    gstNumber: '02SUNBI0001A1Z8',
    mfgLicenseNo: 'ML-HP-2024-001',
    productCategories: 'Tablets, Capsules, Liquid Syrups, Injections',
    mfgRequirement: '35,000 sq ft WHO-GMP formulation facility looking to list on FactoryGrid catalog.',
    notes: 'Manufacturer facility seeking buyer RFQ matches.',
    uploadedFiles: [
      { name: 'WHO_GMP_Master_Certificate.pdf', size: '3.1 MB', type: 'WHO_GMP' },
      { name: 'Manufacturing_License_Form25.pdf', size: '1.8 MB', type: 'MFG_LICENSE' }
    ],
    checklist: {
      companyExists: true,
      gstValid: true,
      businessCategory: true,
      decisionMakerIdentified: true,
      requirementConfirmed: true,
      procurementVolumeConfirmed: true,
      meetingCompleted: true
    },
    crmNotesList: [
      { id: 'n2', timestamp: '2026-08-06 14:00', author: 'Neha Kapoor', text: 'Introductory outreach completed. Plant audit confirmed.' }
    ]
  },
  {
    id: 'ear-3',
    referenceId: 'REQ-2026-7741',
    companyName: 'MedLife Hospital Chain',
    orgType: 'Buyer Organization',
    contactPerson: 'Priya Nair',
    email: 'procurement@medlifehospitals.in',
    phone: '+91 97222 55443',
    location: 'Delhi NCR',
    annualProcurement: '₹25 Cr+ / year',
    submittedDate: '2026-08-05',
    priority: 'MEDIUM',
    status: 'Meeting Scheduled',
    gstNumber: '07MEDLF0002B1Z6',
    drugLicenseNo: 'DL-20B-DL-2024-0045',
    productCategories: 'IV Fluids, Antibiotic Injections, Surgical Disposables',
    mfgRequirement: 'Hospital procurement network requiring 45-day credit cycle and batch telemetry.',
    notes: 'Meeting scheduled with VP Sourcing.',
    uploadedFiles: [
      { name: 'GSTIN_MedLife_Chain.pdf', size: '950 KB', type: 'GST' },
      { name: 'Drug_License_Delhi_NCR.pdf', size: '2.1 MB', type: 'DRUG_LICENSE' }
    ],
    checklist: {
      companyExists: true,
      gstValid: true,
      businessCategory: true,
      decisionMakerIdentified: true,
      requirementConfirmed: true,
      procurementVolumeConfirmed: false,
      meetingCompleted: true
    },
    crmNotesList: [
      { id: 'n3', timestamp: '2026-08-05 16:30', author: 'Siddharth Varma', text: 'Demo scheduled for Aug 9, 2:00 PM.' }
    ]
  },
  {
    id: 'ear-4',
    referenceId: 'REQ-2026-6620',
    companyName: 'BioCure Healthcare',
    orgType: 'Buyer Organization',
    contactPerson: 'Ananya Deshmukh',
    email: 'tpm@biocurehealth.in',
    phone: '+91 99888 11223',
    location: 'Mumbai, Maharashtra',
    annualProcurement: '₹1 Cr – ₹5 Cr / year',
    submittedDate: '2026-08-04',
    priority: 'MEDIUM',
    status: 'Qualified',
    gstNumber: '27BIOCR0003C1Z7',
    drugLicenseNo: 'DL-20B-MH-2024-991',
    productCategories: 'Gastroenterology Capsules, Pantoprazole SR',
    mfgRequirement: '3rd party contract manufacturing requirement for 500,000 strips/month.',
    notes: 'Qualified business opportunity. Ready to forward to compliance.',
    uploadedFiles: [
      { name: 'BioCure_GSTIN.pdf', size: '1.1 MB', type: 'GST' }
    ],
    checklist: {
      companyExists: true,
      gstValid: true,
      businessCategory: true,
      decisionMakerIdentified: true,
      requirementConfirmed: true,
      procurementVolumeConfirmed: true,
      meetingCompleted: true
    },
    crmNotesList: [
      { id: 'n4', timestamp: '2026-08-04 11:00', author: 'Neha Kapoor', text: 'Qualified opportunity. Checklist 100% complete.' }
    ]
  },
  {
    id: 'ear-5',
    referenceId: 'REQ-2026-5510',
    companyName: 'Unverified Trader Network',
    orgType: 'Buyer Organization',
    contactPerson: 'Amit Verma',
    email: 'amit@traderco.com',
    phone: '+91 90000 00000',
    location: 'Kanpur, Uttar Pradesh',
    annualProcurement: 'Under ₹1 Cr / year',
    submittedDate: '2026-08-03',
    priority: 'LOW',
    status: 'Rejected',
    productCategories: 'Bulk API Powder',
    mfgRequirement: 'Unregistered trading firm.',
    notes: 'Rejected due to missing Form 20B Drug License.',
    uploadedFiles: [],
    checklist: {
      companyExists: false,
      gstValid: false,
      businessCategory: false,
      decisionMakerIdentified: false,
      requirementConfirmed: false,
      procurementVolumeConfirmed: false,
      meetingCompleted: false
    },
    crmNotesList: [
      { id: 'n5', timestamp: '2026-08-03 15:20', author: 'Siddharth Varma', text: 'Rejected: No valid drug license uploaded.' }
    ]
  }
];

export const SalesQualificationModule: React.FC = () => {
  const { currentRole, addAuditLog, buyerOnboardings, manufacturerOnboardings } = useApp();

  // Internal Sub-Sidebar Selection
  const [currentNav, setCurrentNav] = useState<
    'DASHBOARD' | 'NEW_REQUESTS' | 'QUALIFIED' | 'SCHEDULE_MEETINGS' | 'FORWARD_COMPLIANCE' | 'CRM_NOTES' | 'TIMELINE' | 'REPORTS'
  >('DASHBOARD');

  const [requests, setRequests] = useState<EnterpriseAccessRequest[]>(() => {
    // Dynamically map incoming demo requests from AppContext
    const contextRequests: EnterpriseAccessRequest[] = [
      ...buyerOnboardings.map(b => ({
        id: b.id,
        referenceId: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: b.companyName,
        orgType: 'Buyer Organization' as const,
        contactPerson: b.contactPerson,
        email: b.email,
        phone: b.phone,
        location: b.address,
        annualProcurement: b.estimatedAnnualSourcing || '₹5 Cr – ₹25 Cr / year',
        submittedDate: b.submittedDate || 'Today',
        priority: 'HIGH' as const,
        status: (b.status === 'APPROVED' ? 'Forwarded to Compliance' : b.status === 'REJECTED' ? 'Rejected' : 'New') as any,
        gstNumber: b.gstin,
        drugLicenseNo: b.drugLicenseNo,
        productCategories: b.sourcingCategory || 'Finished Formulations',
        mfgRequirement: 'Enterprise buyer sourcing requirement.',
        notes: 'Submitted via Request Enterprise Access portal.',
        uploadedFiles: b.documents?.map((d: any) => ({ name: d.name, size: '1.5 MB', type: d.type })) || [],
        checklist: { companyExists: true, gstValid: true, businessCategory: true, decisionMakerIdentified: true, requirementConfirmed: true, procurementVolumeConfirmed: false, meetingCompleted: false },
        crmNotesList: [{ id: `n-${b.id}`, timestamp: 'Today', author: 'System', text: 'Incoming Enterprise Access Request logged.' }]
      })),
      ...manufacturerOnboardings.map(m => ({
        id: m.id,
        referenceId: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: m.companyName,
        orgType: 'Manufacturer' as const,
        contactPerson: m.contactPerson,
        email: m.email,
        phone: m.phone,
        location: m.factoryLocation,
        annualProcurement: m.mfgCapacity || '50M Units / Month',
        submittedDate: m.submittedDate || 'Today',
        priority: 'HIGH' as const,
        status: (m.status === 'APPROVED' ? 'Forwarded to Compliance' : m.status === 'REJECTED' ? 'Rejected' : 'New') as any,
        gstNumber: m.gstin,
        mfgLicenseNo: m.mfgLicenseNo || m.whoGmpNo,
        productCategories: m.drugCategories?.join(', ') || 'Formulations',
        mfgRequirement: 'WHO-GMP certified plant listing requirement.',
        notes: 'Manufacturer plant onboarding request.',
        uploadedFiles: m.documents?.map((d: any) => ({ name: d.name, size: '2.0 MB', type: d.type })) || [],
        checklist: { companyExists: true, gstValid: true, businessCategory: true, decisionMakerIdentified: true, requirementConfirmed: true, procurementVolumeConfirmed: false, meetingCompleted: false },
        crmNotesList: [{ id: `n-${m.id}`, timestamp: 'Today', author: 'System', text: 'Manufacturer onboarding request logged.' }]
      }))
    ];
    return [...initialRequests, ...contextRequests];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [scheduleMeetingDate, setScheduleMeetingDate] = useState('2026-08-12 14:00');
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  // STRICT ACCESS CHECK: Sales Qualification Manager (SALES_MANAGER) or Admin (ADMIN)
  const isSalesUser = currentRole === 'SALES_MANAGER' || currentRole === 'ADMIN';

  if (!isSalesUser) {
    return (
      <div style={{
        padding: '48px 36px',
        textAlign: 'center',
        margin: '32px auto',
        maxWidth: 640,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Lock size={26} />
        </div>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: '#F1F5F9', color: '#475569', fontSize: 11.5, fontWeight: 600, marginBottom: 12 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748B' }} /> Current Role: {currentRole}
        </div>

        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Sales Qualification Desk — Access Controlled
        </h3>
        
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 24, maxWidth: 520, margin: '0 auto 24px' }}>
          The Sales Qualification Desk is an internal FactoryGrid workspace reserved strictly for the <strong>Sales Qualification Manager</strong>. It is used to qualify inbound B2B enterprise access requests before compliance verification.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => alert('Access Request submitted to System Admin.')} style={{ height: 38, padding: '0 18px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            Request Sales Access
          </button>
          <button onClick={() => alert('Please use the Role Switcher in the top header bar to switch to Sales Manager role.')} style={{ height: 38, padding: '0 18px', borderRadius: 8, background: '#2563EB', color: '#FFFFFF', border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
            Switch to Sales Manager Role →
          </button>
        </div>
      </div>
    );
  }

  const selectedRequest = requests.find(r => r.id === selectedReqId) || null;

  // Top KPIs
  const kpis = {
    newRequests: requests.filter(r => r.status === 'New').length,
    meetingsScheduled: requests.filter(r => r.status === 'Meeting Scheduled').length,
    qualified: requests.filter(r => r.status === 'Qualified').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    pendingFollowUp: requests.filter(r => r.status === 'Under Review').length,
  };

  // Filter requests based on internal sub-sidebar navigation
  const filteredRequests = requests.filter(r => {
    const matchSearch = r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (currentNav === 'NEW_REQUESTS') return r.status === 'New' || r.status === 'Under Review';
    if (currentNav === 'QUALIFIED') return r.status === 'Qualified';
    if (currentNav === 'SCHEDULE_MEETINGS') return r.status === 'Meeting Scheduled';
    if (currentNav === 'FORWARD_COMPLIANCE') return r.status === 'Forwarded to Compliance';
    return true;
  });

  // Action Handlers
  const handleToggleChecklist = (reqId: string, itemKey: keyof EnterpriseAccessRequest['checklist']) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      return {
        ...r,
        checklist: { ...r.checklist, [itemKey]: !r.checklist[itemKey] }
      };
    }));
  };

  const handleAddInternalNote = (reqId: string) => {
    if (!newNoteInput.trim()) return;
    const noteEntry = {
      id: `n-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      author: 'Sales Manager',
      text: newNoteInput
    };
    setRequests(prev => prev.map(r => r.id === reqId ? {
      ...r,
      crmNotesList: [noteEntry, ...r.crmNotesList]
    } : r));
    setNewNoteInput('');
    addAuditLog('Sales Qualification', `Added internal CRM note for ${selectedRequest?.companyName}`);
  };

  const handleScheduleDemo = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? {
      ...r,
      status: 'Meeting Scheduled',
      crmNotesList: [{ id: `n-${Date.now()}`, timestamp: 'Today', author: 'Sales Manager', text: `Meeting scheduled for ${scheduleMeetingDate}` }, ...r.crmNotesList]
    } : r));
    setShowMeetingModal(false);
    addAuditLog('Sales Qualification', `Scheduled meeting for ${selectedRequest?.companyName} on ${scheduleMeetingDate}`);
    alert(`Meeting scheduled for ${scheduleMeetingDate}`);
  };

  const handleRejectRequest = (reqId: string) => {
    const reason = prompt('Enter rejection reason:') || 'Does not meet qualification requirements';
    setRequests(prev => prev.map(r => r.id === reqId ? {
      ...r,
      status: 'Rejected',
      crmNotesList: [{ id: `n-${Date.now()}`, timestamp: 'Today', author: 'Sales Manager', text: `Rejected: ${reason}` }, ...r.crmNotesList]
    } : r));
    addAuditLog('Sales Qualification', `Rejected opportunity ${selectedRequest?.companyName}. Reason: ${reason}`);
    alert(`Request rejected for ${selectedRequest?.companyName}`);
  };

  const handleQualifyCompany = (reqId: string) => {
    setRequests(prev => prev.map(r => r.id === reqId ? {
      ...r,
      status: 'Qualified',
      crmNotesList: [{ id: `n-${Date.now()}`, timestamp: 'Today', author: 'Sales Manager', text: 'Qualified business opportunity.' }, ...r.crmNotesList]
    } : r));
    addAuditLog('Sales Qualification', `Marked ${selectedRequest?.companyName} as Qualified`);
    setShowConfirmModal(true);
  };

  // ON CONFIRM FORWARD TO COMPLIANCE
  const handleConfirmForwardToCompliance = () => {
    if (!selectedRequest) return;

    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
      ...r,
      status: 'Forwarded to Compliance',
      crmNotesList: [{ id: `n-${Date.now()}`, timestamp: 'Today', author: 'Sales Manager', text: 'Forwarded to Compliance Desk.' }, ...r.crmNotesList]
    } : r));

    addAuditLog('Sales Qualification', `Forwarded ${selectedRequest.companyName} (${selectedRequest.referenceId}) to Compliance Desk`);
    alert(`✔ Forwarded to Compliance!\n\nRequest status updated to "Forwarded to Compliance". Notification dispatched to Compliance Officer.`);

    setShowConfirmModal(false);
    setSelectedReqId(null);
  };

  const getStatusIcon = (status: EnterpriseAccessRequest['status']) => {
    switch (status) {
      case 'New': return <Clock size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
      case 'Under Review': return <Search size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
      case 'Meeting Scheduled': return <Calendar size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
      case 'Qualified': return <CheckCircle2 size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
      case 'Rejected': return <XCircle size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
      case 'Forwarded to Compliance': return <Send size={13} style={{ color: 'var(--text-secondary, #64748B)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)', gap: 16 }}>

      {/* ══════════════════════════════════════════════════════
          LEFT SUB-SIDEBAR (Internal Module Navigation)
      ══════════════════════════════════════════════════════ */}
      <div style={{
        width: 220,
        background: 'var(--bg-surface, #FFFFFF)',
        border: '1px solid var(--border-subtle, #E2E8F0)',
        borderRadius: 8,
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0
      }}>
        <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sales Qualification
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>
            Desk Workstation
          </div>
        </div>

        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'NEW_REQUESTS', label: `New Requests (${kpis.newRequests})`, icon: Clock },
          { id: 'QUALIFIED', label: `Qualified Companies (${kpis.qualified})`, icon: CheckCircle2 },
          { id: 'SCHEDULE_MEETINGS', label: `Schedule Meetings (${kpis.meetingsScheduled})`, icon: Calendar },
          { id: 'FORWARD_COMPLIANCE', label: 'Forward to Compliance', icon: Send },
          { id: 'CRM_NOTES', label: 'CRM Notes', icon: FileText },
          { id: 'TIMELINE', label: 'Activity Timeline', icon: Activity },
          { id: 'REPORTS', label: 'Reports', icon: BarChart3 },
        ].map(item => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentNav(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                background: isActive ? 'var(--bg-subtle, #F1F5F9)' : 'transparent',
                color: isActive ? 'var(--text-primary, #0F172A)' : 'var(--text-secondary, #64748B)',
                transition: 'all 0.12s ease'
              }}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--text-primary, #0F172A)' : 'var(--text-tertiary, #94A3B8)' }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

        {/* ── TOP KPIS ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'New Requests', value: kpis.newRequests, icon: Clock },
            { label: 'Meetings Scheduled', value: kpis.meetingsScheduled, icon: Calendar },
            { label: 'Qualified', value: kpis.qualified, icon: CheckCircle2 },
            { label: 'Rejected', value: kpis.rejected, icon: XCircle },
            { label: 'Pending Follow-up', value: kpis.pendingFollowUp, icon: Search },
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface, #FFFFFF)',
                  border: '1px solid var(--border-subtle, #E2E8F0)',
                  borderRadius: 8,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary, #64748B)' }}>{kpi.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{kpi.value}</div>
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--bg-subtle, #F1F5F9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary, #64748B)'
                }}>
                  <Icon size={16} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MAIN TABLE: ENTERPRISE ACCESS REQUESTS ─────────── */}
        <div style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          {/* Header & Filter */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                Enterprise Access Requests
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary, #94A3B8)', background: 'var(--bg-subtle, #F1F5F9)', padding: '2px 8px', borderRadius: 4 }}>
                {filteredRequests.length} Records
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle, #F1F5F9)', border: '1px solid var(--border-subtle, #CBD5E1)', borderRadius: 4, padding: '4px 10px', width: 240 }}>
              <Search size={13} style={{ color: 'var(--text-tertiary, #94A3B8)' }} />
              <input
                type="text"
                placeholder="Search company, contact, ref..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: 'var(--text-primary, #0F172A)', width: '100%' }}
              />
            </div>
          </div>

          {/* Table View */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #F8FAFC)', borderBottom: '1px solid var(--border-subtle, #E2E8F0)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Reference ID</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Company</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Organization Type</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Contact Person</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Location</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Annual Procurement</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Submitted Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Priority</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>Qualification Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-tertiary, #94A3B8)' }}>
                      No enterprise access requests found in this queue.
                    </td>
                  </tr>
                ) : filteredRequests.map(req => {
                  const isSelected = selectedReqId === req.id;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReqId(req.id)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                        background: isSelected ? 'var(--bg-subtle, #F1F5F9)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary, #0F172A)' }}>
                        {req.referenceId}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary, #0F172A)' }}>
                        {req.companyName}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary, #64748B)' }}>
                        {req.orgType}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary, #0F172A)' }}>
                        {req.contactPerson}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary, #64748B)' }}>
                        {req.location}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                        {req.annualProcurement}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: 'var(--text-secondary, #64748B)', fontSize: 11.5 }}>
                        {req.submittedDate}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 11, color: 'var(--text-secondary, #64748B)' }}>
                        {req.priority}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedReqId(req.id); }}
                          style={{
                            background: 'var(--bg-surface, #FFFFFF)',
                            border: '1px solid var(--border-subtle, #CBD5E1)',
                            borderRadius: 4,
                            padding: '4px 10px',
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--text-primary, #0F172A)',
                            cursor: 'pointer'
                          }}
                        >
                          Open Request →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════
          OPEN REQUEST DRAWER / INSPECTOR & RIGHT PANEL
      ══════════════════════════════════════════════════════ */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            width: '100%',
            maxWidth: 780,
            height: '100vh',
            background: 'var(--bg-surface, #FFFFFF)',
            borderLeft: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: 'var(--text-primary, #0F172A)'
          }}>

            {/* Drawer Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle, #F8FAFC)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>
                    {selectedRequest.referenceId}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>
                    · {selectedRequest.orgType}
                  </span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>
                  {selectedRequest.companyName}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                  {getStatusIcon(selectedRequest.status)}
                  {selectedRequest.status}
                </span>
                <button
                  onClick={() => setSelectedReqId(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #64748B)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Split Content View: Left Details | Right Panel Checklist */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden' }}>

              {/* LEFT COLUMN: Request Information & Uploaded Files */}
              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid var(--border-subtle, #E2E8F0)' }}>

                {/* Company Information */}
                <div style={{ border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Company Information
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Legal Company Name</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.companyName}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Organization Type</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.orgType}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Primary Contact Person</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.contactPerson}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Business Email</div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.email}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Business Phone</div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.phone}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Headquarters Location</div>
                      <div style={{ color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.location}</div>
                    </div>
                  </div>
                </div>

                {/* Business Profile & Requirements */}
                <div style={{ border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Business Profile & Sourcing Scope
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Expected Procurement Volume</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.annualProcurement}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Product Categories Required</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.productCategories}</div>
                    </div>
                    {selectedRequest.gstNumber && (
                      <div>
                        <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>GST Number</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.gstNumber}</div>
                      </div>
                    )}
                    {(selectedRequest.drugLicenseNo || selectedRequest.mfgLicenseNo) && (
                      <div>
                        <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Drug / Manufacturing License Number</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary, #0F172A)', marginTop: 2 }}>{selectedRequest.drugLicenseNo || selectedRequest.mfgLicenseNo}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Manufacturing Requirement</div>
                      <div style={{ color: 'var(--text-secondary, #64748B)', marginTop: 2, lineHeight: 1.4 }}>{selectedRequest.mfgRequirement}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-tertiary, #94A3B8)', fontSize: 11 }}>Notes / Remarks</div>
                      <div style={{ color: 'var(--text-secondary, #64748B)', marginTop: 2, lineHeight: 1.4 }}>{selectedRequest.notes}</div>
                    </div>
                  </div>
                </div>

                {/* Uploaded Files */}
                <div style={{ border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Uploaded License & Statutory Files ({selectedRequest.uploadedFiles.length})
                  </div>
                  {selectedRequest.uploadedFiles.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary, #94A3B8)', fontStyle: 'italic' }}>No files attached to request.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {selectedRequest.uploadedFiles.map((file, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={15} style={{ color: 'var(--text-secondary, #64748B)' }} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>{file.name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-tertiary, #94A3B8)' }}>{file.type} · {file.size}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Previewing ${file.name}`)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-primary, #0F172A)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Preview
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal CRM Notes & Activity Log */}
                <div style={{ border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Internal CRM Notes & Log ({selectedRequest.crmNotesList.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {selectedRequest.crmNotesList.map(n => (
                      <div key={n.id} style={{ padding: '8px 10px', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-tertiary, #94A3B8)', marginBottom: 2 }}>
                          <span>{n.author}</span>
                          <span style={{ fontFamily: 'monospace' }}>{n.timestamp}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary, #0F172A)' }}>{n.text}</div>
                      </div>
                    ))}
                  </div>

                  {/* Add Note Input */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Add internal note..."
                      value={newNoteInput}
                      onChange={e => setNewNoteInput(e.target.value)}
                      style={{ flex: 1, background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)', borderRadius: 4, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary, #0F172A)', outline: 'none' }}
                    />
                    <button
                      onClick={() => handleAddInternalNote(selectedRequest.id)}
                      style={{ background: 'var(--bg-subtle, #F1F5F9)', border: '1px solid var(--border-subtle, #CBD5E1)', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #0F172A)', cursor: 'pointer' }}
                    >
                      Post Note
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Qualification Checklist & Enterprise Actions */}
              <div style={{ padding: 18, background: 'var(--bg-subtle, #F8FAFC)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Qualification Checklist Panel */}
                <div style={{ background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Qualification Checklist
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { key: 'companyExists', label: 'Company Exists' },
                      { key: 'gstValid', label: 'GST Valid' },
                      { key: 'businessCategory', label: 'Business Category' },
                      { key: 'decisionMakerIdentified', label: 'Decision Maker Identified' },
                      { key: 'requirementConfirmed', label: 'Requirement Confirmed' },
                      { key: 'procurementVolumeConfirmed', label: 'Procurement Volume Confirmed' },
                      { key: 'meetingCompleted', label: 'Meeting Completed' },
                    ].map(item => {
                      const isChecked = selectedRequest.checklist[item.key as keyof EnterpriseAccessRequest['checklist']];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleChecklist(selectedRequest.id, item.key as any)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 8px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: isChecked ? 'var(--bg-subtle, #F1F5F9)' : 'transparent',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          {isChecked ? (
                            <CheckSquare size={16} style={{ color: 'var(--text-primary, #0F172A)' }} />
                          ) : (
                            <Square size={16} style={{ color: 'var(--text-tertiary, #94A3B8)' }} />
                          )}
                          <span style={{ fontSize: 12, fontWeight: isChecked ? 600 : 500, color: isChecked ? 'var(--text-primary, #0F172A)' : 'var(--text-secondary, #64748B)' }}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sales Actions Panel */}
                <div style={{ background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 6, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Sales Actions
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={() => setShowMeetingModal(true)}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)',
                        borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <Calendar size={14} /> Schedule Demo
                    </button>

                    <button
                      onClick={() => {
                        const note = prompt('Add internal CRM note:') || '';
                        if (note) {
                          setNewNoteInput(note);
                          handleAddInternalNote(selectedRequest.id);
                        }
                      }}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)',
                        borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <MessageSquare size={14} /> Add Internal Note
                    </button>

                    <button
                      onClick={() => {
                        const infoReq = prompt('Specify information required:') || 'Please specify target formulation quantities';
                        addAuditLog('Sales Qualification', `Requested details from ${selectedRequest.companyName}: ${infoReq}`);
                        alert(`Information request sent to ${selectedRequest.companyName}`);
                      }}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)',
                        borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <FileText size={14} /> Request More Information
                    </button>

                    <button
                      onClick={() => handleRejectRequest(selectedRequest.id)}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)',
                        borderRadius: 4, fontSize: 12, fontWeight: 600, color: 'var(--text-primary, #0F172A)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <XCircle size={14} /> Reject Request
                    </button>

                    <button
                      onClick={() => handleQualifyCompany(selectedRequest.id)}
                      style={{
                        width: '100%', padding: '9px 12px', background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)',
                        borderRadius: 4, fontSize: 12, fontWeight: 700, color: 'var(--text-primary, #0F172A)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <CheckCircle2 size={14} /> Qualify Company
                    </button>

                    <button
                      onClick={() => setShowConfirmModal(true)}
                      style={{
                        width: '100%', padding: '10px 12px', background: 'var(--text-primary, #0F172A)', border: 'none',
                        borderRadius: 4, fontSize: 12, fontWeight: 700, color: 'var(--bg-surface, #FFFFFF)', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6
                      }}
                    >
                      <span>Forward to Compliance Desk</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          FORWARD TO COMPLIANCE CONFIRMATION DIALOG
      ══════════════════════════════════════════════════════ */}
      {showConfirmModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: 'var(--bg-surface, #FFFFFF)',
            border: '1px solid var(--border-subtle, #E2E8F0)',
            borderRadius: 8,
            width: 440,
            padding: 24,
            color: 'var(--text-primary, #0F172A)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-subtle, #F1F5F9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary, #0F172A)' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Forward Request to Compliance Desk
              </h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary, #64748B)', lineHeight: 1.6, marginBottom: 20 }}>
              This organization (<strong style={{ color: 'var(--text-primary, #0F172A)' }}>{selectedRequest.companyName}</strong>) has passed sales qualification. Forward this request to Compliance Desk?
            </p>

            <div style={{
              background: 'var(--bg-subtle, #F8FAFC)',
              border: '1px solid var(--border-subtle, #E2E8F0)',
              borderRadius: 6,
              padding: 12,
              marginBottom: 20,
              fontSize: 12,
              color: 'var(--text-secondary, #64748B)'
            }}>
              📋 <strong>Workflow Event:</strong> Request status will become <strong style={{ color: 'var(--text-primary, #0F172A)' }}>Forwarded to Compliance</strong>, removing it from the Sales Pending Queue and routing it directly to <em>Compliance Desk → Pending Verification</em>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 4,
                  background: 'var(--bg-surface, #FFFFFF)',
                  border: '1px solid var(--border-subtle, #CBD5E1)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--text-primary, #0F172A)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForwardToCompliance}
                style={{
                  padding: '9px 20px',
                  borderRadius: 4,
                  background: 'var(--text-primary, #0F172A)',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: 'var(--bg-surface, #FFFFFF)',
                  cursor: 'pointer'
                }}
              >
                Confirm & Forward →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE MEETING MODAL ────────────────────────── */}
      {showMeetingModal && selectedRequest && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #E2E8F0)', borderRadius: 8, width: 400, padding: 24, color: 'var(--text-primary, #0F172A)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Schedule Sales Demo / Meeting</h3>
            <div style={{ fontSize: 12, color: 'var(--text-secondary, #64748B)', marginBottom: 16 }}>
              Setting meeting for {selectedRequest.companyName} ({selectedRequest.contactPerson})
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary, #94A3B8)', textTransform: 'uppercase', marginBottom: 6 }}>Meeting Date & Time</label>
              <input
                type="text"
                value={scheduleMeetingDate}
                onChange={e => setScheduleMeetingDate(e.target.value)}
                placeholder="2026-08-12 14:00"
                style={{ width: '100%', background: 'var(--bg-subtle, #F8FAFC)', border: '1px solid var(--border-subtle, #CBD5E1)', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary, #0F172A)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowMeetingModal(false)} style={{ padding: '8px 14px', borderRadius: 4, background: 'var(--bg-surface, #FFFFFF)', border: '1px solid var(--border-subtle, #CBD5E1)', fontSize: 12, color: 'var(--text-primary, #0F172A)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleScheduleDemo(selectedRequest.id)} style={{ padding: '8px 16px', borderRadius: 4, background: 'var(--text-primary, #0F172A)', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--bg-surface, #FFFFFF)', cursor: 'pointer' }}>
                Confirm Meeting Schedule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
