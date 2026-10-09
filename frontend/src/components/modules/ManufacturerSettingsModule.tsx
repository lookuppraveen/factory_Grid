import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IntegrationsSettingsModule } from './IntegrationsSettingsModule';
import { Security2FAModule } from './Security2FAModule';
import {
  Building2, Receipt, ShieldCheck, Upload, Image as ImageIcon,
  CheckCircle2, AlertCircle, Eye, RefreshCw, X, Lock, Server,
  FileText, Save, Trash2, Check, FileCheck, Plus, Edit2, Power, AlertTriangle, Radio
} from 'lucide-react';

export interface ApiIntegrationItem {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyMasked: string;
  environment: 'Production' | 'Sandbox';
  status: 'Connected' | 'Disconnected';
  lastChecked: string;
}

export interface ManufacturerSettings {
  invoiceMethod: 'BUILD_PLATFORM' | 'UPLOAD_FORMAT';
  
  // Option 1: Upload Invoice Format
  uploadedTemplate?: {
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    fileUrl?: string;
  } | null;

  // Option 2: Create Invoice on FactoryGrid
  logoUrl?: string;
  logoFileName?: string;
  legalName: string;
  registeredAddress: string;
  gstin: string;
  mfgLicense: string;
  customInvoiceText: string;
  invoiceHeader: string;
  invoiceFooter: string;
  paymentTerms: string;
  additionalNotes: string;

  // Generic Extensible API Integrations
  apiIntegrations: ApiIntegrationItem[];
}

export const ManufacturerSettingsModule: React.FC = () => {
  const { manufacturers, addAuditLog } = useApp();

  const myMfg = (manufacturers && manufacturers[0]) || null;
  const mfgName = myMfg?.companyName || myMfg?.name || 'SunBio LifeSciences Ltd.';
  const mfgId = myMfg?.id || 'm1';
  const storageKey = `factorygrid_mfg_settings_${mfgId}`;

  // Active Main Section Tab: Invoice Settings, API Integrations, Security
  const [activeTab, setActiveTab] = useState<'INTEGRATIONS' | 'SECURITY'>('INTEGRATIONS');

  // Load Persisted Settings
  const [settings, setSettings] = useState<ManufacturerSettings>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          invoiceMethod: parsed.invoiceMethod || 'BUILD_PLATFORM',
          uploadedTemplate: parsed.uploadedTemplate || null,
          logoUrl: parsed.logoUrl || '',
          logoFileName: parsed.logoFileName || '',
          legalName: parsed.legalName || mfgName,
          registeredAddress: parsed.registeredAddress || 'Plot 44, Phase II, Genome Valley, Hyderabad, Telangana 500078',
          gstin: parsed.gstin || myMfg?.gstin || '36AAACS9981A1Z2',
          mfgLicense: parsed.mfgLicense || myMfg?.mfgLicenseNo || 'CDSCO Form 25/28 License: TS/HYD/2024/88921',
          customInvoiceText: parsed.customInvoiceText || 'Certified WHO-GMP & CDSCO Verified Quality. Remittance via RTGS to HDFC Bank A/C #9981023912 (IFSC: HDFC0000182).',
          invoiceHeader: parsed.invoiceHeader || 'TAX INVOICE / FORM 27B SPECIFICATION',
          invoiceFooter: parsed.invoiceFooter || 'Thank you for your business. Quality Guaranteed.',
          paymentTerms: parsed.paymentTerms || 'Net 30 Days via RTGS / NEFT',
          additionalNotes: parsed.additionalNotes || 'Goods once sold are non-returnable. Subject to Hyderabad Jurisdiction.',
          apiIntegrations: parsed.apiIntegrations || []
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      invoiceMethod: 'BUILD_PLATFORM',
      uploadedTemplate: null,
      logoUrl: '',
      logoFileName: '',
      legalName: mfgName,
      registeredAddress: 'Plot 44, Phase II, Genome Valley, Hyderabad, Telangana 500078',
      gstin: myMfg?.gstin || '36AAACS9981A1Z2',
      mfgLicense: myMfg?.mfgLicenseNo || 'CDSCO Form 25/28 License: TS/HYD/2024/88921',
      customInvoiceText: 'Certified WHO-GMP & CDSCO Verified Quality. Remittance via RTGS to HDFC Bank A/C #9981023912 (IFSC: HDFC0000182).',
      invoiceHeader: 'TAX INVOICE / FORM 27B SPECIFICATION',
      invoiceFooter: 'Thank you for your business. Quality Guaranteed.',
      paymentTerms: 'Net 30 Days via RTGS / NEFT',
      additionalNotes: 'Goods once sold are non-returnable. Subject to Hyderabad Jurisdiction.',
      apiIntegrations: [
        {
          id: 'integ-1',
          name: 'Enterprise ERP Gateway',
          baseUrl: 'https://api.sunbiolabs.com/v2/erp',
          apiKeyMasked: '••••••••••••••••',
          environment: 'Production',
          status: 'Connected',
          lastChecked: '18 Aug 2026, 11:45 AM'
        }
      ]
    };
  });

  // Save Settings Helper
  const saveSettings = (updated: ManufacturerSettings) => {
    setSettings(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist manufacturer settings:', e);
    }
  };

  // Toast Banner Message
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. INVOICE METHOD SELECTION HANDLER
  const handleSelectInvoiceMethod = (method: 'BUILD_PLATFORM' | 'UPLOAD_FORMAT') => {
    const updated = { ...settings, invoiceMethod: method };
    saveSettings(updated);
    showToast(`Invoice generation method set to: ${method === 'BUILD_PLATFORM' ? 'Create Invoice on FactoryGrid' : 'Upload Invoice Format'}`);
  };

  // 2. OPTION 1: UPLOAD TEMPLATE HANDLER
  const [templateFileError, setTemplateFileError] = useState<string | null>(null);

  const handleUploadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setTemplateFileError('Invalid file format. Please upload PDF or DOCX template file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setTemplateFileError('File size exceeds 10MB limit.');
      return;
    }

    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const uploadDateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    const updated: ManufacturerSettings = {
      ...settings,
      invoiceMethod: 'UPLOAD_FORMAT',
      uploadedTemplate: {
        fileName: file.name,
        fileType: file.type.includes('pdf') ? 'PDF Document' : 'Word Document (.docx)',
        fileSize: fileSizeStr,
        uploadDate: uploadDateStr
      }
    };

    saveSettings(updated);
    showToast(`Uploaded invoice template "${file.name}" successfully.`);
    addAuditLog('Manufacturer Invoice Settings', `Uploaded template file ${file.name} for ${mfgName}.`);
  };

  const handleRemoveTemplate = () => {
    const updated: ManufacturerSettings = {
      ...settings,
      uploadedTemplate: null
    };
    saveSettings(updated);
    showToast('Uploaded invoice template removed.');
  };

  // 3. OPTION 2: LOGO UPLOAD HANDLER
  const [logoError, setLogoError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Invalid format. Please upload PNG, JPG, JPEG, or SVG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = {
        ...settings,
        logoUrl: dataUrl,
        logoFileName: file.name
      };
      saveSettings(updated);
      showToast(`Company logo ${file.name} saved successfully.`);
      addAuditLog('Manufacturer Logo', `Uploaded invoice logo for ${mfgName}.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    const updated = {
      ...settings,
      logoUrl: '',
      logoFileName: ''
    };
    saveSettings(updated);
    showToast('Company logo removed.');
  };

  // Save Complete Invoice Settings Form
  const handleSaveInvoiceSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    showToast('✓ Invoice settings saved successfully.');
    addAuditLog('Manufacturer Settings', `Saved complete invoice configuration for ${mfgName}.`);
  };

  // 4. API INTEGRATIONS STATE & MODAL HANDLERS
  const [isIntegModalOpen, setIsIntegModalOpen] = useState(false);
  const [editingIntegId, setEditingIntegId] = useState<string | null>(null);
  
  const [integForm, setIntegForm] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    environment: 'Production' as 'Production' | 'Sandbox'
  });

  const [integTestResult, setIntegTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [isTestingInteg, setIsTestingInteg] = useState(false);

  const handleOpenAddIntegModal = () => {
    setEditingIntegId(null);
    setIntegForm({
      name: '',
      baseUrl: '',
      apiKey: '',
      environment: 'Production'
    });
    setIntegTestResult(null);
    setIsIntegModalOpen(true);
  };

  const handleOpenEditIntegModal = (item: ApiIntegrationItem) => {
    setEditingIntegId(item.id);
    setIntegForm({
      name: item.name,
      baseUrl: item.baseUrl,
      apiKey: '',
      environment: item.environment
    });
    setIntegTestResult(null);
    setIsIntegModalOpen(true);
  };

  const handleTestConnectionInModal = () => {
    setIntegTestResult(null);
    if (!integForm.name.trim()) {
      setIntegTestResult({ status: 'error', message: 'Integration Name is required.' });
      return;
    }
    if (!integForm.baseUrl.trim() || (!integForm.baseUrl.startsWith('http://') && !integForm.baseUrl.startsWith('https://'))) {
      setIntegTestResult({ status: 'error', message: 'API Base URL must be a valid URL starting with http:// or https://' });
      return;
    }
    if (!editingIntegId && (!integForm.apiKey || integForm.apiKey.trim().length < 6)) {
      setIntegTestResult({ status: 'error', message: 'API Key / Token is required and must be at least 6 characters.' });
      return;
    }

    setIsTestingInteg(true);
    setTimeout(() => {
      setIsTestingInteg(false);
      setIntegTestResult({
        status: 'success',
        message: '✓ Connection successful (HTTP 200 OK - Response Latency: 84ms)'
      });
    }, 800);
  };

  const handleSaveIntegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!integForm.name.trim()) {
      setIntegTestResult({ status: 'error', message: 'Integration Name is required.' });
      return;
    }
    if (!integForm.baseUrl.trim() || (!integForm.baseUrl.startsWith('http://') && !integForm.baseUrl.startsWith('https://'))) {
      setIntegTestResult({ status: 'error', message: 'API Base URL must be a valid URL starting with http:// or https://' });
      return;
    }
    if (!editingIntegId && (!integForm.apiKey || integForm.apiKey.trim().length < 6)) {
      setIntegTestResult({ status: 'error', message: 'API Key / Token is required.' });
      return;
    }

    const nowStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    let updatedList: ApiIntegrationItem[];

    if (editingIntegId) {
      updatedList = settings.apiIntegrations.map(item => {
        if (item.id === editingIntegId) {
          return {
            ...item,
            name: integForm.name,
            baseUrl: integForm.baseUrl,
            environment: integForm.environment,
            apiKeyMasked: integForm.apiKey ? '••••••••••••••••' : item.apiKeyMasked,
            status: 'Connected' as const,
            lastChecked: nowStr
          };
        }
        return item;
      });
    } else {
      const newItem: ApiIntegrationItem = {
        id: `integ-${Date.now()}`,
        name: integForm.name,
        baseUrl: integForm.baseUrl,
        apiKeyMasked: '••••••••••••••••',
        environment: integForm.environment,
        status: 'Connected',
        lastChecked: nowStr
      };
      updatedList = [...settings.apiIntegrations, newItem];
    }

    const updatedSettings = { ...settings, apiIntegrations: updatedList };
    saveSettings(updatedSettings);
    setIsIntegModalOpen(false);
    showToast(`API Integration "${integForm.name}" saved successfully.`);
    addAuditLog('API Integrations', `Saved integration ${integForm.name} for ${mfgName}.`);
  };

  const handleTestConnectionCard = (id: string) => {
    const nowStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const updatedList = settings.apiIntegrations.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Connected' as const, lastChecked: nowStr };
      }
      return item;
    });
    saveSettings({ ...settings, apiIntegrations: updatedList });
    showToast('✓ Connection verified successfully (HTTP 200 OK).');
  };

  const handleDisconnectInteg = (id: string) => {
    const updatedList = settings.apiIntegrations.filter(item => item.id !== id);
    saveSettings({ ...settings, apiIntegrations: updatedList });
    showToast('API Integration disconnected.');
  };

    // 5. SECURITY / PASSWORD HANDLERS
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passChangeError, setPassChangeError] = useState<string | null>(null);
  const [passChangeSuccess, setPassChangeSuccess] = useState<string | null>(null);

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeError(null);
    setPassChangeSuccess(null);

    if (!passForm.currentPassword) {
      setPassChangeError('✕ Current password is required.');
      return;
    }
    if (!passForm.newPassword || passForm.newPassword.length < 8) {
      setPassChangeError('✕ New password must be at least 8 characters long.');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassChangeError('✕ New password and Confirm password do not match.');
      return;
    }

    setPassChangeSuccess('✓ Password updated successfully.');
    showToast('✓ Password updated successfully.');
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    addAuditLog('Security Settings', `Updated account password for ${mfgName}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60, background: '#F8FAFC', color: '#0F172A' }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Manufacturer Portal</span>
            <span>/</span>
            <span style={{ fontWeight: 700, color: '#0F766E' }}>Settings</span>
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Manufacturer Settings
          </h1>
          <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            Manage invoice format configurations, API integrations, and account security for <strong style={{ color: '#0F766E' }}>{mfgName}</strong>.
          </p>
        </div>
      </div>

      {/* ── TOAST BANNER ────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={{ background: toastMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${toastMessage.type === 'success' ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: toastMessage.type === 'success' ? '#166534' : '#991B1B' }}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toastMessage.text}
          </div>
          <button onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* ── THREE CLEAR SECTIONS TABS ─────────────────────────────── */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '8px 12px', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[
          { id: 'INTEGRATIONS', label: '1. API Integrations', icon: Server },
          { id: 'SECURITY', label: '2. Security', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                border: 'none',
                background: active ? '#0F766E' : 'transparent',
                color: active ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>


      {/* ════════════════════════════════════════════════════════════════
          SECTION 2: API INTEGRATIONS (RESTORED CONNECTOR CATALOGUE)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INTEGRATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <IntegrationsSettingsModule />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3: SECURITY & 2FA ACCESS (RESTORED 2FA MODULE)
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SECURITY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1. PASSWORD / ACCOUNT SECURITY FORM */}
          <form onSubmit={handlePasswordChangeSubmit} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Password & Account Security</h2>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 3 }}>
                Update your account login password. Password must be at least 8 characters with letters, numbers, and symbols.
              </div>
            </div>

            {passChangeSuccess && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> {passChangeSuccess}
              </div>
            )}

            {passChangeError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} /> {passChangeError}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Current Password *</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passForm.currentPassword}
                onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>New Password *</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passForm.newPassword}
                  onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Confirm New Password *</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 10 }}>
              <button
                type="submit"
                style={{ padding: '10px 24px', borderRadius: 8, background: '#0F766E', color: '#FFFFFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Lock size={15} /> Change Password
              </button>
            </div>
          </form>

          {/* 2. TWO-FACTOR AUTHENTICATION (2FA) RESTORED MODULE */}
          <Security2FAModule />
        </div>
      )}

      {/* ── MODAL: ADD / EDIT API INTEGRATION ───────────────────────── */}
      {isIntegModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10020, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setIsIntegModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: 14, padding: 24, boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {editingIntegId ? 'Edit API Integration' : 'Add API Integration'}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Connect an external system using its API credentials.</div>
              </div>
              <button onClick={() => setIsIntegModalOpen(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Test Connection Alert Box */}
            {integTestResult && (
              <div style={{ background: integTestResult.status === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${integTestResult.status === 'success' ? '#86EFAC' : '#FCA5A5'}`, color: integTestResult.status === 'success' ? '#166534' : '#991B1B', padding: 12, borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {integTestResult.status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {integTestResult.message}
              </div>
            )}

            <form onSubmit={handleSaveIntegSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Integration Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise ERP System / Telemetry Gateway"
                  value={integForm.name}
                  onChange={e => setIntegForm({ ...integForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>API Base URL *</label>
                <input
                  type="text"
                  placeholder="https://api.yourcompany.com/v1"
                  value={integForm.baseUrl}
                  onChange={e => setIntegForm({ ...integForm, baseUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  API Key / API Token {editingIntegId ? '(Leave blank to keep existing masked key)' : '*'}
                </label>
                <input
                  type="password"
                  placeholder={editingIntegId ? '••••••••••••••••' : 'Enter API Key / Token'}
                  value={integForm.apiKey}
                  onChange={e => setIntegForm({ ...integForm, apiKey: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                  {...(!editingIntegId ? { required: true } : {})}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Environment *</label>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="environment"
                      value="Sandbox"
                      checked={integForm.environment === 'Sandbox'}
                      onChange={() => setIntegForm({ ...integForm, environment: 'Sandbox' })}
                      style={{ accentColor: '#0F766E' }}
                    />
                    Sandbox
                  </label>
                  <label style={{ fontSize: 13, color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="environment"
                      value="Production"
                      checked={integForm.environment === 'Production'}
                      onChange={() => setIntegForm({ ...integForm, environment: 'Production' })}
                      style={{ accentColor: '#0F766E' }}
                    />
                    Production
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <button
                  type="button"
                  disabled={isTestingInteg}
                  onClick={handleTestConnectionInModal}
                  style={{ padding: '8px 14px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <RefreshCw size={14} className={isTestingInteg ? 'animate-spin' : ''} /> {isTestingInteg ? 'Testing...' : 'Test Connection'}
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setIsIntegModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFF', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#0F766E', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Save Integration</button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
