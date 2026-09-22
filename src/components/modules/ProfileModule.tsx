import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserDocument, ProfileDocStatus, UserRole } from '../../types';
import {
  User, Building2, FileCheck, KeyRound, ShieldCheck, CheckCircle2,
  Clock, AlertTriangle, XCircle, FileText, Upload, RefreshCw, Eye,
  Edit3, Check, X, Shield, Lock, AlertCircle, Sparkles, ChevronRight,
  ExternalLink, Download, Info, ArrowUpRight
} from 'lucide-react';

export const ProfileModule: React.FC = () => {
  const {
    userProfile, orgProfile, userDocuments, currentRole, profileSubTab, setProfileSubTab,
    updateUserProfile, updateOrgProfile, uploadUserDocument, replaceUserDocument,
    changeUserPassword
  } = useApp();

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [selectedDocForView, setSelectedDocForView] = useState<UserDocument | null>(null);
  const [selectedDocForReplace, setSelectedDocForReplace] = useState<UserDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Personal Profile Form State
  const [editUserForm, setEditUserForm] = useState({
    fullName: userProfile.fullName || '',
    phone: userProfile.phone || '',
    jobTitle: userProfile.jobTitle || '',
    department: userProfile.department || '',
    avatarUrl: userProfile.avatarUrl || ''
  });

  // Edit Organization Form State
  const [editOrgForm, setEditOrgForm] = useState({
    companyName: orgProfile.companyName || '',
    businessType: orgProfile.businessType || '',
    industry: orgProfile.industry || '',
    contactEmail: orgProfile.contactEmail || '',
    contactPhone: orgProfile.contactPhone || '',
    registeredAddress: orgProfile.registeredAddress || '',
    city: orgProfile.city || '',
    state: orgProfile.state || '',
    country: orgProfile.country || 'India',
    pincode: orgProfile.pincode || '',
    website: orgProfile.website || '',
    mfgLicenseNo: orgProfile.mfgLicenseNo || ''
  });

  // Upload/Replace Doc Form State
  const [docForm, setDocForm] = useState({
    documentType: 'GST Certificate',
    documentName: '',
    documentNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    fileName: '',
    remarks: ''
  });

  // Change Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passError, setPassError] = useState<string | null>(null);

    // Buyer 2FA State
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fg_buyer_2fa_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [show2FASetupModal, setShow2FASetupModal] = useState<boolean>(false);
  const [show2FADisableModal, setShow2FADisableModal] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState<boolean>(false);

  const handleVerifyAndEnable2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (otpInput.trim().length !== 6 || !/^\d+$/.test(otpInput.trim())) {
      setOtpError('Please enter a valid 6-digit numerical OTP code.');
      return;
    }
    setIsVerifying2FA(true);
    setTimeout(() => {
      setIsVerifying2FA(false);
      setIs2FAEnabled(true);
      try { localStorage.setItem('fg_buyer_2fa_enabled', 'true'); } catch (err) {}
      setShow2FASetupModal(false);
      setOtpInput('');
      showToast('✓ Two-Factor Authentication (2FA) enabled successfully.');
    }, 500);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    try { localStorage.setItem('fg_buyer_2fa_enabled', 'false'); } catch (err) {}
    setShow2FADisableModal(false);
    showToast('Two-Factor Authentication (2FA) disabled.');
  };

const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Profile Completion Math Calculation
  const calculateProfileCompletion = () => {
    let filledPersonal = 0;
    const personalFields = [userProfile.fullName, userProfile.email, userProfile.phone, userProfile.jobTitle, userProfile.department];
    personalFields.forEach(f => { if (f && f.trim().length > 0) filledPersonal++; });
    const personalScore = (filledPersonal / personalFields.length) * 35; // 35% weight

    let filledOrg = 0;
    const orgFields = [orgProfile.companyName, orgProfile.contactEmail, orgProfile.contactPhone, orgProfile.registeredAddress, orgProfile.city, orgProfile.state, orgProfile.gstin, orgProfile.pan];
    orgFields.forEach(f => { if (f && f.trim().length > 0) filledOrg++; });
    const orgScore = (filledOrg / orgFields.length) * 35; // 35% weight

    const verifiedDocs = userDocuments.filter(d => d.verificationStatus === 'VERIFIED').length;
    const totalDocs = Math.max(userDocuments.length, 1);
    const docScore = (verifiedDocs / totalDocs) * 30; // 30% weight

    return Math.min(100, Math.round(personalScore + orgScore + docScore));
  };

  const profileCompletion = calculateProfileCompletion();

  // Missing items determination
  const getMissingItems = () => {
    const missing: { label: string; tab: 'personal' | 'organization' | 'documents'; docId?: string }[] = [];
    if (!userProfile.phone || userProfile.phone.trim() === '') missing.push({ label: 'Phone Number', tab: 'personal' });
    if (!userProfile.jobTitle || userProfile.jobTitle.trim() === '') missing.push({ label: 'Job Title / Designation', tab: 'personal' });
    if (!orgProfile.website || orgProfile.website.trim() === '') missing.push({ label: 'Company Website', tab: 'organization' });
    
    userDocuments.forEach(d => {
      if (d.verificationStatus === 'NOT UPLOADED') {
        missing.push({ label: `${d.documentName || d.documentType} (Not Uploaded)`, tab: 'documents', docId: d.id });
      } else if (d.verificationStatus === 'REJECTED') {
        missing.push({ label: `${d.documentName || d.documentType} (Rejected - Needs Replacement)`, tab: 'documents', docId: d.id });
      } else if (d.verificationStatus === 'EXPIRED') {
        missing.push({ label: `${d.documentName || d.documentType} (Expired)`, tab: 'documents', docId: d.id });
      }
    });

    return missing;
  };

  const missingItems = getMissingItems();

  const docStats = {
    total: userDocuments.length,
    verified: userDocuments.filter(d => d.verificationStatus === 'VERIFIED').length,
    pending: userDocuments.filter(d => d.verificationStatus === 'PENDING VERIFICATION').length,
    expired: userDocuments.filter(d => d.verificationStatus === 'EXPIRED').length,
    rejected: userDocuments.filter(d => d.verificationStatus === 'REJECTED').length,
    notUploaded: userDocuments.filter(d => d.verificationStatus === 'NOT UPLOADED').length,
  };

  // Handlers for edit forms
  const handleOpenEditUser = () => {
    setEditUserForm({
      fullName: userProfile.fullName || '',
      phone: userProfile.phone || '',
      jobTitle: userProfile.jobTitle || '',
      department: userProfile.department || '',
      avatarUrl: userProfile.avatarUrl || ''
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName: editUserForm.fullName,
      phone: editUserForm.phone,
      jobTitle: editUserForm.jobTitle,
      department: editUserForm.department,
      avatarUrl: editUserForm.avatarUrl
    });
    setIsEditProfileOpen(false);
    showToast('Profile updated successfully.');
  };

  const handleOpenEditOrg = () => {
    setEditOrgForm({
      companyName: orgProfile.companyName || '',
      businessType: orgProfile.businessType || '',
      industry: orgProfile.industry || '',
      contactEmail: orgProfile.contactEmail || '',
      contactPhone: orgProfile.contactPhone || '',
      registeredAddress: orgProfile.registeredAddress || '',
      city: orgProfile.city || '',
      state: orgProfile.state || '',
      country: orgProfile.country || 'India',
      pincode: orgProfile.pincode || '',
      website: orgProfile.website || '',
      mfgLicenseNo: orgProfile.mfgLicenseNo || ''
    });
    setIsEditOrgOpen(true);
  };

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgProfile({
      companyName: editOrgForm.companyName,
      businessType: editOrgForm.businessType,
      industry: editOrgForm.industry,
      contactEmail: editOrgForm.contactEmail,
      contactPhone: editOrgForm.contactPhone,
      registeredAddress: editOrgForm.registeredAddress,
      city: editOrgForm.city,
      state: editOrgForm.state,
      country: editOrgForm.country,
      pincode: editOrgForm.pincode,
      website: editOrgForm.website,
      mfgLicenseNo: editOrgForm.mfgLicenseNo
    });
    setIsEditOrgOpen(false);
    showToast('Organization profile updated successfully.');
  };

  const handleOpenUploadDoc = (docType?: string) => {
    setDocForm({
      documentType: docType || 'GST Certificate',
      documentName: docType || 'GST Certificate',
      documentNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      fileName: '',
      remarks: ''
    });
    setIsUploadDocOpen(true);
  };

  const handleSaveUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    uploadUserDocument({
      documentName: docForm.documentName || docForm.documentType,
      documentType: docForm.documentType,
      documentNumber: docForm.documentNumber,
      issueDate: docForm.issueDate,
      expiryDate: docForm.expiryDate || 'N/A',
      fileName: docForm.fileName || `${docForm.documentType.replace(/\s+/g, '_')}_Document.pdf`,
      remarks: docForm.remarks
    });
    setIsUploadDocOpen(false);
    showToast('Document uploaded successfully. Verification is pending compliance review.');
  };

  const handleOpenReplaceDoc = (doc: UserDocument) => {
    setSelectedDocForReplace(doc);
    setDocForm({
      documentType: doc.documentType,
      documentName: doc.documentName,
      documentNumber: doc.documentNumber || '',
      issueDate: doc.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: doc.expiryDate || '',
      fileName: '',
      remarks: ''
    });
  };

  const handleSaveReplaceDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReplace) return;
    replaceUserDocument(selectedDocForReplace.id, {
      documentNumber: docForm.documentNumber,
      issueDate: docForm.issueDate,
      expiryDate: docForm.expiryDate || 'N/A',
      fileName: docForm.fileName || `${selectedDocForReplace.documentType.replace(/\s+/g, '_')}_Replacement.pdf`,
      remarks: docForm.remarks
    });
    setSelectedDocForReplace(null);
    showToast('Replacement document submitted. Status updated to PENDING VERIFICATION.');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError('New Password and Confirm New Password do not match.');
      return;
    }
    const result = changeUserPassword(passForm.currentPassword, passForm.newPassword);
    if (result.success) {
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(result.message);
    } else {
      setPassError(result.message);
    }
  };

  const getStatusBadge = (status: ProfileDocStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontSize: 11, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={12} /> VERIFIED
          </span>
        );
      case 'PENDING VERIFICATION':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', fontSize: 11, fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Clock size={12} /> PENDING VERIFICATION
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', fontSize: 11, fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <XCircle size={12} /> REJECTED
          </span>
        );
      case 'EXPIRED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', fontSize: 11, fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <AlertTriangle size={12} /> EXPIRED
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'rgba(100, 116, 139, 0.12)', color: '#64748B', fontSize: 11, fontWeight: 700, border: '1px solid rgba(100, 116, 139, 0.3)' }}>
            NOT UPLOADED
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 48, position: 'relative' }}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 70,
          right: 24,
          zIndex: 99999,
          background: '#0F766E',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 13,
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Command Bar */}
      <div className="ent-command-bar">
        <div className="ent-command-bar-left">
          <div>
            <div className="ent-label">Account & Corporate Settings</div>
            <div className="ent-page-title" style={{ margin: 0 }}>
              {profileSubTab === 'personal' && 'MY PROFILE'}
              {profileSubTab === 'organization' && 'ORGANIZATION PROFILE'}
              {profileSubTab === 'documents' && 'DOCUMENTS & VERIFICATION'}
              {profileSubTab === 'security' && 'ACCOUNT SECURITY & PASSWORD'}
            </div>
            <div className="ent-caption" style={{ marginTop: 2 }}>
              {profileSubTab === 'personal' && 'Manage your personal account details, credentials and preferences.'}
              {profileSubTab === 'organization' && `Corporate profile for ${orgProfile.companyName || 'registered entity'}.`}
              {profileSubTab === 'documents' && 'Upload and maintain statutory compliance licenses and business credentials.'}
              {profileSubTab === 'security' && 'Manage login password and security preferences.'}
            </div>
          </div>
        </div>

        <div className="ent-command-bar-right">
          {profileSubTab === 'personal' && (
            <button className="ent-btn-primary" onClick={handleOpenEditUser}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
          {profileSubTab === 'organization' && (
            <button className="ent-btn-primary" onClick={handleOpenEditOrg}>
              <Edit3 size={14} /> Edit Organization
            </button>
          )}
          {profileSubTab === 'documents' && (
            <button className="ent-btn-primary" onClick={() => handleOpenUploadDoc()}>
              <Upload size={14} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* ── PROFILE DASHBOARD SUMMARY CARDS ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {/* Profile Completion */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid var(--c-primary)' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PROFILE COMPLETION</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span>{profileCompletion}%</span>
            <span style={{ fontSize: 11, color: profileCompletion === 100 ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
              {profileCompletion === 100 ? '● Complete' : '● Action Needed'}
            </span>
          </div>
          {/* Completion Progress Bar */}
          <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${profileCompletion}%`, background: 'linear-gradient(90deg, #14B8A6, #2563EB)', transition: 'width 300ms ease' }} />
          </div>
        </div>

        {/* Total Documents */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #3B82F6' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>DOCUMENTS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
            {docStats.verified} / {docStats.total}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Total Statutory Files</div>
        </div>

        {/* Verified Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #10B981' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>VERIFIED</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', marginTop: 4 }}>
            {docStats.verified}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Audit Passed</div>
        </div>

        {/* Pending Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #3B82F6' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>PENDING</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>
            {docStats.pending}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Under Compliance Review</div>
        </div>

        {/* Expired / Rejected Count */}
        <div className="ent-card" style={{ background: 'var(--bg-surface)', padding: 18, borderLeft: '4px solid #EF4444' }}>
          <div className="ent-label" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>EXPIRED / REJECTED</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: (docStats.expired + docStats.rejected) > 0 ? '#EF4444' : 'var(--text-primary)', marginTop: 4 }}>
            {docStats.expired + docStats.rejected}
          </div>
          <div className="ent-caption" style={{ marginTop: 4 }}>Requires Replacement</div>
        </div>
      </div>

      {/* ── PROFILE COMPLETION WIDGET (If missing items exist) ── */}
      {missingItems.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.06)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                Profile Completion — {profileCompletion}%
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: '#F59E0B', fontWeight: 700 }}>
              {missingItems.length} item{missingItems.length > 1 ? 's' : ''} missing
            </span>
          </div>

          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Complete your account and statutory documentation to maintain WHO-GMP / CDSCO compliant verified status on FactoryGrid:
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {missingItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setProfileSubTab(item.tab);
                  if (item.tab === 'personal') handleOpenEditUser();
                  if (item.tab === 'organization') handleOpenEditOrg();
                  if (item.tab === 'documents') handleOpenUploadDoc(item.label.split('(')[0].trim());
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>• {item.label}</span>
                <ChevronRight size={12} style={{ color: '#F59E0B' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── NAVIGATION SUB-TABS ────────────────────────────── */}
      <div className="ent-tab-bar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
        <button
          className={`ent-tab ${profileSubTab === 'personal' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('personal')}
        >
          <User size={15} /> Personal Profile
        </button>
        <button
          className={`ent-tab ${profileSubTab === 'organization' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('organization')}
        >
          <Building2 size={15} /> Organization Profile
        </button>
        <button
          className={`ent-tab ${profileSubTab === 'documents' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('documents')}
        >
          <FileCheck size={15} /> Documents & Verification
          {docStats.pending > 0 && (
            <span style={{ background: '#3B82F6', color: '#FFF', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999, marginLeft: 6 }}>
              {docStats.pending}
            </span>
          )}
        </button>
        <button
          className={`ent-tab ${profileSubTab === 'security' ? 'active' : ''}`}
          onClick={() => setProfileSubTab('security')}
        >
          <KeyRound size={15} /> Security & Password
        </button>
      </div>

      {/* ── TAB 1: PERSONAL PROFILE ─────────────────────────── */}
      {profileSubTab === 'personal' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Avatar & Key Profile Overview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--c-primary), #2563EB)',
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              border: '3px solid var(--bg-surface)',
              flexShrink: 0
            }}>
              {userProfile.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2) : currentRole.slice(0, 2)}
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {userProfile.fullName || 'User Profile'}
                </h2>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                  <CheckCircle2 size={12} /> {userProfile.accountStatus || 'Active'}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
                {userProfile.jobTitle || 'Executive User'} — <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{userProfile.department || 'Operations'}</span>
              </div>

              <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span><strong>Role:</strong> {userProfile.role || currentRole}</span>
                <span><strong>Last Login:</strong> {userProfile.lastLogin || 'Today'}</span>
                <span><strong>User ID:</strong> {userProfile.id || 'usr_001'}</span>
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenEditUser}>
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>

          {/* Detailed Personal Profile Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Full Name</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.fullName || 'Not Provided'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Corporate Email (Read-Only)</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.email}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Phone Number</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 700, color: userProfile.phone ? 'var(--text-primary)' : '#F59E0B' }}>
                {userProfile.phone || '• Missing — Click Edit Profile'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Job Title / Designation</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.jobTitle || 'Executive'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Department</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{userProfile.department || 'Operations'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Assigned Role (Protected)</span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-primary)' }}>{userProfile.role || currentRole}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORGANIZATION PROFILE ─────────────────────── */}
      {profileSubTab === 'organization' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={22} style={{ color: 'var(--c-primary)' }} />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {orgProfile.companyName || 'Organization Profile'}
                </h2>
                {orgProfile.isVerified && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 11, fontWeight: 700 }}>
                    <ShieldCheck size={12} /> Verified Entity
                  </span>
                )}
              </div>
              <div className="ent-caption" style={{ marginTop: 4 }}>
                {currentRole === 'SUPPLIER' ? 'Verified Manufacturer Organization Details' : currentRole === 'BUYER' ? 'Verified Buyer Organization Details' : 'System Organization Profile'}
              </div>
            </div>

            <button className="ent-btn-primary" onClick={handleOpenEditOrg}>
              <Edit3 size={14} /> Edit Organization
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">{currentRole === 'BUYER' ? 'Organization Name' : 'Company Name'}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.companyName}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">{currentRole === 'BUYER' ? 'Organization Code (Protected)' : 'Company Code (Protected)'}</span>
              <span className="ent-mono" style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--c-primary)' }}>{orgProfile.companyCode}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Business Type</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.businessType || 'Private Limited'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Industry Sector</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.industry || 'Pharmaceuticals'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">GSTIN (Verified ID)</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.gstin || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">PAN Number</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.pan || 'N/A'}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">CIN / Registration Number</span>
              <span className="ent-mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{orgProfile.cinNumber || 'N/A'}</span>
            </div>

            {currentRole === 'SUPPLIER' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <span className="ent-label">State FDA Manufacturing License No</span>
                <span className="ent-mono" style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>{orgProfile.mfgLicenseNo || 'ML-HP-2024-001'}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Corporate Contact Email</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.contactEmail}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Contact Phone</span>
              <span className="ent-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{orgProfile.contactPhone}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)', gridColumn: 'span 2' }}>
              <span className="ent-label">Registered Address</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {orgProfile.registeredAddress}, {orgProfile.city}, {orgProfile.state}, {orgProfile.country} — {orgProfile.pincode}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span className="ent-label">Website</span>
              {orgProfile.website ? (
                <a href={orgProfile.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {orgProfile.website} <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ fontSize: 13, color: '#F59E0B' }}>• Not provided</span>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: DOCUMENTS & VERIFICATION ─────────────────── */}
      {profileSubTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="ent-panel" style={{ background: 'var(--bg-surface)' }}>
            <div className="ent-panel-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck size={18} style={{ color: 'var(--c-primary)' }} />
                  <div className="ent-section-title">Statutory & Regulatory Documents</div>
                </div>
                <div className="ent-caption" style={{ marginTop: 2 }}>
                  Central document repository for WHO-GMP, CDSCO and statutory business verification.
                </div>
              </div>

              <button className="ent-btn-primary" onClick={() => handleOpenUploadDoc()}>
                <Upload size={14} /> Upload New Document
              </button>
            </div>

            <table className="ent-table">
              <thead>
                <tr>
                  <th>Document Name & Type</th>
                  <th>Document Number</th>
                  <th>Uploaded Date</th>
                  <th>Expiry Date</th>
                  <th>Verification Status</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {userDocuments.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.documentName}</div>
                      <div className="ent-caption">{doc.documentType}</div>
                    </td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{doc.documentNumber || '—'}</td>
                    <td className="ent-mono" style={{ fontSize: 12 }}>{doc.uploadedDate || 'Not Uploaded'}</td>
                    <td className="ent-mono" style={{ fontSize: 12, color: doc.verificationStatus === 'EXPIRED' ? '#EF4444' : 'var(--text-secondary)' }}>
                      {doc.expiryDate || 'N/A'}
                    </td>
                    <td>{getStatusBadge(doc.verificationStatus)}</td>
                    <td className="ent-mono" style={{ fontSize: 11 }}>{doc.lastUpdated || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="ent-btn-secondary"
                          style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                          onClick={() => setSelectedDocForView(doc)}
                        >
                          <Eye size={12} /> View
                        </button>
                        
                        {(doc.verificationStatus === 'NOT UPLOADED' || doc.verificationStatus === 'REJECTED' || doc.verificationStatus === 'EXPIRED') && (
                          <button
                            className="ent-btn-primary"
                            style={{ height: 30, padding: '0 10px', fontSize: 11, background: '#0D9488' }}
                            onClick={() => handleOpenReplaceDoc(doc)}
                          >
                            <RefreshCw size={12} /> {doc.verificationStatus === 'NOT UPLOADED' ? 'Upload' : 'Replace'}
                          </button>
                        )}

                        {doc.verificationStatus === 'VERIFIED' && (
                          <button
                            className="ent-btn-secondary"
                            style={{ height: 30, padding: '0 8px', fontSize: 11 }}
                            onClick={() => handleOpenReplaceDoc(doc)}
                            title="Update / Upload New Version"
                          >
                            <RefreshCw size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: SECURITY & PASSWORD ───────────────────────── */}
      {profileSubTab === 'security' && (
        <div className="ent-panel" style={{ background: 'var(--bg-surface)', padding: 24, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
            <KeyRound size={20} style={{ color: 'var(--c-primary)' }} />
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Change Password</h2>
              <div className="ent-caption" style={{ marginTop: 2 }}>Ensure your account uses a strong, secure password.</div>
            </div>
          </div>

          <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
            {passError && (
              <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{passError}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={passForm.currentPassword}
                onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Password</label>
              <input
                type="password"
                required
                placeholder="At least 8 characters"
                value={passForm.newPassword}
                onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={passForm.confirmPassword}
                onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="ent-btn-primary">
                Update Password
              </button>
            </div>
          </form>

          {/* ── TWO-FACTOR AUTHENTICATION (BUYER ONLY) ────────────────────────── */}
          {currentRole === 'BUYER' && (
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={20} style={{ color: is2FAEnabled ? '#10B981' : 'var(--c-primary)' }} />
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Two-Factor Authentication</h2>
                    <div className="ent-caption" style={{ marginTop: 2 }}>
                      Add an additional layer of security to your Buyer account.
                    </div>
                  </div>
                </div>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                  background: is2FAEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  color: is2FAEnabled ? '#10B981' : '#F59E0B',
                  border: `1px solid ${is2FAEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: is2FAEnabled ? '#10B981' : '#F59E0B' }} />
                  {is2FAEnabled ? '✓ 2FA Enabled' : '2FA Disabled'}
                </span>
              </div>

              <div style={{
                background: is2FAEnabled ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-subtle)',
                border: `1px solid ${is2FAEnabled ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
              }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {is2FAEnabled
                    ? 'Two-Factor Authentication is active for your account. Verification codes will be required during login and critical procurement approvals.'
                    : 'When 2FA is enabled, you will be required to enter a 6-digit security verification code sent to your registered mobile or authenticator app during login.'
                  }
                </div>

                <div>
                  {is2FAEnabled ? (
                    <button
                      onClick={() => setShow2FADisableModal(true)}
                      style={{
                        padding: '8px 16px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontWeight: 700, fontSize: 12.5, cursor: 'pointer'
                      }}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <button
                      onClick={() => { setOtpInput(''); setOtpError(null); setShow2FASetupModal(true); }}
                      className="ent-btn-primary"
                      style={{ padding: '8px 18px', fontSize: 13 }}
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: EDIT PERSONAL PROFILE ───────────────────── */}
      {isEditProfileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 520, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Personal Profile</div>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={e => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Corporate Email (Read-Only)</label>
                <input
                  type="text"
                  disabled
                  value={userProfile.email}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', outline: 'none', cursor: 'not-allowed' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Phone Number</label>
                <input
                  type="text"
                  required
                  value={editUserForm.phone}
                  onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Job Title / Designation</label>
                <input
                  type="text"
                  required
                  value={editUserForm.jobTitle}
                  onChange={e => setEditUserForm({ ...editUserForm, jobTitle: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Department</label>
                <input
                  type="text"
                  required
                  value={editUserForm.department}
                  onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT ORGANIZATION PROFILE ──────────────── */}
      {isEditOrgOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 620, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Edit Organization Information</div>
              <button onClick={() => setIsEditOrgOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Organization Name</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.companyName}
                    onChange={e => setEditOrgForm({ ...editOrgForm, companyName: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Org Code (Protected)</label>
                  <input
                    type="text"
                    disabled
                    value={orgProfile.companyCode}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', outline: 'none', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Business Type</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.businessType}
                    onChange={e => setEditOrgForm({ ...editOrgForm, businessType: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Industry Sector</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.industry}
                    onChange={e => setEditOrgForm({ ...editOrgForm, industry: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Contact Email</label>
                  <input
                    type="email"
                    required
                    value={editOrgForm.contactEmail}
                    onChange={e => setEditOrgForm({ ...editOrgForm, contactEmail: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.contactPhone}
                    onChange={e => setEditOrgForm({ ...editOrgForm, contactPhone: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Registered Address</label>
                <input
                  type="text"
                  required
                  value={editOrgForm.registeredAddress}
                  onChange={e => setEditOrgForm({ ...editOrgForm, registeredAddress: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>City</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.city}
                    onChange={e => setEditOrgForm({ ...editOrgForm, city: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>State</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.state}
                    onChange={e => setEditOrgForm({ ...editOrgForm, state: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>PIN / ZIP</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.pincode}
                    onChange={e => setEditOrgForm({ ...editOrgForm, pincode: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Website</label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={editOrgForm.website}
                  onChange={e => setEditOrgForm({ ...editOrgForm, website: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsEditOrgOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: UPLOAD DOCUMENT ─────────────────────────── */}
      {isUploadDocOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 540, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Upload Business Document</div>
              <button onClick={() => setIsUploadDocOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUploadDoc} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Category / Type</label>
                <select
                  value={docForm.documentType}
                  onChange={e => setDocForm({ ...docForm, documentType: e.target.value, documentName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN Card / PAN Document">PAN Card / PAN Document</option>
                  <option value="Company Registration Certificate">Company Registration Certificate</option>
                  <option value="Manufacturing License">Manufacturing License</option>
                  <option value="Drug License / applicable regulatory license">Drug License / WHO-GMP License</option>
                  <option value="Bank / Payment Details">Bank / Payment Details</option>
                  <option value="Quality Certificates">Quality Certificates (ISO / WHO-GMP)</option>
                  <option value="Other Business Documents">Other Business Documents</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State FDA License 2026"
                  value={docForm.documentName}
                  onChange={e => setDocForm({ ...docForm, documentName: e.target.value })}
                  style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number (if applicable)</label>
                  <input
                    type="text"
                    placeholder="Registration/License No"
                    value={docForm.documentNumber}
                    onChange={e => setDocForm({ ...docForm, documentNumber: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Expiry Date (if applicable)</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document File</label>
                <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: 8, padding: 20, textAlign: 'center', background: 'var(--bg-app)', cursor: 'pointer' }}>
                  <Upload size={24} style={{ color: 'var(--c-primary)', marginBottom: 6 }} />
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>Choose PDF / JPG file or drag here</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>Max file size: 15 MB (CDSCO format compliant)</div>
                  <input
                    type="file"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setDocForm({ ...docForm, fileName: e.target.files[0].name });
                      }
                    }}
                    style={{ marginTop: 8, fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context for compliance verifier..."
                  value={docForm.remarks}
                  onChange={e => setDocForm({ ...docForm, remarks: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setIsUploadDocOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: VIEW DOCUMENT ──────────────────────────── */}
      {selectedDocForView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 600, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} style={{ color: 'var(--c-primary)' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedDocForView.documentName}</div>
              </div>
              <button onClick={() => setSelectedDocForView(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-app)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div className="ent-label">Verification Status</div>
                  <div style={{ marginTop: 4 }}>{getStatusBadge(selectedDocForView.verificationStatus)}</div>
                </div>
                <div>
                  <div className="ent-label">Document Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{selectedDocForView.documentType}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Document Number</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.documentNumber || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Uploaded Date</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.uploadedDate || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Expiry Date</div>
                  <div className="ent-mono" style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.expiryDate || 'N/A'}</div>
                </div>

                <div style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Verified By</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{selectedDocForView.verifiedBy || 'Pending Compliance'}</div>
                </div>
              </div>

              {selectedDocForView.remarks && (
                <div style={{ padding: 14, background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="ent-label">Compliance Remarks / Verification Notes</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>{selectedDocForView.remarks}</div>
                </div>
              )}

              {/* Version History if available */}
              {selectedDocForView.history && selectedDocForView.history.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="ent-section-title" style={{ fontSize: 13, marginBottom: 8 }}>Document Version Audit History</div>
                  <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
                    <table className="ent-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Ver</th>
                          <th>Uploaded Date</th>
                          <th>File Name</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDocForView.history.map((v, i) => (
                          <tr key={i}>
                            <td className="ent-mono">v{v.version}</td>
                            <td className="ent-mono">{v.uploadedDate}</td>
                            <td className="ent-mono">{v.fileName}</td>
                            <td>{getStatusBadge(v.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="ent-btn-secondary"
                  onClick={() => alert(`Simulated download for ${selectedDocForView.fileName || 'document.pdf'}`)}
                >
                  <Download size={14} /> Download File ({selectedDocForView.fileName || 'document.pdf'})
                </button>
                <button className="ent-btn-primary" onClick={() => setSelectedDocForView(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: REPLACE DOCUMENT ───────────────────────── */}
      {selectedDocForReplace && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 540, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Replace Document: {selectedDocForReplace.documentName}</div>
              <button onClick={() => setSelectedDocForReplace(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReplaceDoc} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                Replacing this document will archive the previous version in audit history and set the status to <strong>PENDING VERIFICATION</strong>.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Document Number</label>
                  <input
                    type="text"
                    value={docForm.documentNumber}
                    onChange={e => setDocForm({ ...docForm, documentNumber: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Expiry Date</label>
                  <input
                    type="date"
                    value={docForm.expiryDate}
                    onChange={e => setDocForm({ ...docForm, expiryDate: e.target.value })}
                    style={{ height: 38, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>New Replacement File</label>
                <input
                  type="file"
                  required
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setDocForm({ ...docForm, fileName: e.target.files[0].name });
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Replacement Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Reason for replacing document..."
                  value={docForm.remarks}
                  onChange={e => setDocForm({ ...docForm, remarks: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="ent-btn-secondary" onClick={() => setSelectedDocForReplace(null)}>
                  Cancel
                </button>
                <button type="submit" className="ent-btn-primary">
                  Submit Replacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA ENABLE SETUP MODAL (BUYER ONLY) ── */}
      {show2FASetupModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--c-primary)' }} />
                <span>Enable Two-Factor Authentication</span>
              </div>
              <button onClick={() => setShow2FASetupModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Two-Factor Authentication adds an additional verification step to protect your Buyer account.
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Demo OTP Code</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--c-primary)', letterSpacing: '0.2em', margin: '4px 0', fontFamily: 'monospace' }}>123456</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Enter code <strong style={{ color: 'var(--text-primary)' }}>123456</strong> below to complete setup</div>
            </div>

            <form onSubmit={handleVerifyAndEnable2FA} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>Enter 6-Digit OTP Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  style={{ width: '100%', height: 40, borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: 16, fontWeight: 800, textAlign: 'center', letterSpacing: '0.3em', outline: 'none' }}
                  autoFocus
                  required
                />
              </div>

              {otpError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', fontSize: 12, fontWeight: 600 }}>
                  ⚠️ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShow2FASetupModal(false)} className="ent-btn-secondary">Cancel</button>
                <button type="submit" disabled={isVerifying2FA} className="ent-btn-primary" style={{ background: '#10B981' }}>
                  {isVerifying2FA ? 'Verifying...' : 'Verify & Enable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 2FA DISABLE CONFIRMATION MODAL (BUYER ONLY) ── */}
      {show2FADisableModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 420, maxWidth: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
              <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Disable Two-Factor Authentication?</h3>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Are you sure you want to disable 2FA? Your Buyer account will rely solely on password authentication for login and transactions.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShow2FADisableModal(false)} className="ent-btn-secondary">Cancel</button>
              <button onClick={handleDisable2FA} className="ent-btn-primary" style={{ background: '#EF4444' }}>Confirm Disable</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};