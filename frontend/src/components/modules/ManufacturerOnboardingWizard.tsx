import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, FileText, CheckCircle2, Upload,
  Search, Calendar, Building2, Package, Clock
} from 'lucide-react';
import { mockProducts } from '../../data/mockData';
import { manufacturerRegistrationApi, CatalogProductItem } from '../../services/manufacturerRegistrationApi';

interface ManufacturerOnboardingWizardProps {
  onSuccess?: () => void;
  isPublicPage?: boolean;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

export interface CertDocState {
  key: string;
  name: string;
  code: string;
  id?: string;
  fileName: string;
  uploaded: boolean;
  issueDate: string;
  expiryDate: string;
  documentCode?: string;
  fileSize?: number;
}

const MANDATORY_CERTIFICATIONS = [
  { key: 'mfgLicense', name: 'Manufacturing License', code: 'Form 25/28' },
  { key: 'gmpCert', name: 'GMP Certificate', code: 'CDSCO Schedule M' },
  { key: 'whoGmpCert', name: 'WHO-GMP Certificate', code: 'WHO-GMP Standard' },
  { key: 'isoCert', name: 'ISO Certification', code: 'ISO 9001:2015' },
  { key: 'factoryReg', name: 'Factory Registration', code: 'Factories Act Cert' },
  { key: 'pollutionCert', name: 'Pollution Control Clearance', code: 'SPCB NOC' }
];

export const ManufacturerOnboardingWizard: React.FC<ManufacturerOnboardingWizardProps> = ({
  onSuccess, isPublicPage = false, onBack, onSubmitSuccess
}) => {
  const { products: appProducts, submitManufacturerOnboarding } = useApp();
  const [registrationCode, setRegistrationCode] = useState<string>(() => {
    try {
      return localStorage.getItem('fg_mfg_reg_code') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState<string>('Manufacturer123!');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProductItem[]>([]);

  useEffect(() => {
    manufacturerRegistrationApi.listCatalog().then(res => {
      if (res && res.length > 0) {
        setCatalog(res);
      }
    }).catch(() => {});
  }, []);

  const catalogProducts = (catalog && catalog.length > 0) ? catalog : ((appProducts && appProducts.length > 0) ? appProducts : mockProducts);

  // Wizard Steps: 1 = Company Details, 2 = Certifications, 3 = Product Capabilities, 4 = MOQ & Lead Time, 5 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // STEP 1 — Company Details State
  const [companyDetails, setCompanyDetails] = useState({
    companyName: '',
    facilityAddress: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '502307',
    contactPerson: '',
    designation: 'Plant Head / Vice President',
    email: '',
    phone: '',
    mfgCapacity: '10,000,000 Units / Month'
  });

  // STEP 2 — Certifications & Expiry Dates State (Initial state: unuploaded until confirmed by backend)
  const [certificationsMap, setCertificationsMap] = useState<Record<string, CertDocState>>({
    mfgLicense: { key: 'mfgLicense', name: 'Manufacturing License', code: 'Form 25/28', fileName: '', uploaded: false, issueDate: '2023-04-15', expiryDate: '2028-04-14' },
    gmpCert: { key: 'gmpCert', name: 'GMP Certificate', code: 'CDSCO Schedule M', fileName: '', uploaded: false, issueDate: '2023-06-10', expiryDate: '2027-06-09' },
    whoGmpCert: { key: 'whoGmpCert', name: 'WHO-GMP Certificate', code: 'WHO-GMP Standard', fileName: '', uploaded: false, issueDate: '2023-09-01', expiryDate: '2026-08-31' },
    isoCert: { key: 'isoCert', name: 'ISO Certification', code: 'ISO 9001:2015', fileName: '', uploaded: false, issueDate: '2022-11-20', expiryDate: '2027-11-19' },
    factoryReg: { key: 'factoryReg', name: 'Factory Registration', code: 'Factories Act Cert', fileName: '', uploaded: false, issueDate: '2021-01-10', expiryDate: '2029-01-09' },
    pollutionCert: { key: 'pollutionCert', name: 'Pollution Control Clearance', code: 'SPCB NOC', fileName: '', uploaded: false, issueDate: '2023-01-15', expiryDate: '2028-01-14' }
  });
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});

  // Sync real uploaded documents from backend whenever registration code is present or step changes
  useEffect(() => {
    const code = registrationCode || (typeof window !== 'undefined' ? localStorage.getItem('fg_mfg_reg_code') : '') || '';
    if (!code) return;
    manufacturerRegistrationApi.getDocuments(code)
      .then(docs => {
        if (Array.isArray(docs) && docs.length > 0) {
          setCertificationsMap(prev => {
            const next = { ...prev };
            docs.forEach(d => {
              if (next[d.category]) {
                next[d.category] = {
                  ...next[d.category],
                  id: d.id,
                  fileName: d.fileName,
                  uploaded: d.status !== 'SUPERSEDED',
                  issueDate: d.issueDate || next[d.category].issueDate,
                  expiryDate: d.expiryDate || next[d.category].expiryDate,
                  documentCode: d.documentCode,
                  fileSize: d.fileSize,
                };
              }
            });
            return next;
          });
        }
      })
      .catch(() => {
        // Registration draft might not have uploaded documents yet
      });
  }, [registrationCode, currentStep]);

  // STEP 3 — Product Capabilities State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(['p1', 'p2', 'p3']);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // STEP 4 — MOQ & Lead Time State
  const [productSupplyDetailsMap, setProductSupplyDetailsMap] = useState<Record<string, { moq: number; leadTimeDays: number }>>({
    'p1': { moq: 1000, leadTimeDays: 18 },
    'p2': { moq: 2000, leadTimeDays: 10 },
    'p3': { moq: 1500, leadTimeDays: 14 }
  });

  // STEP 5 — Confirmation & Submission State
  const [isAccurateConfirmed, setIsAccurateConfirmed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation Handlers
  const validateStep1 = () => {
    return (
      companyDetails.companyName.trim() !== '' &&
      companyDetails.facilityAddress.trim() !== '' &&
      companyDetails.state.trim() !== '' &&
      companyDetails.contactPerson.trim() !== '' &&
      companyDetails.email.trim() !== '' &&
      companyDetails.phone.trim() !== ''
    );
  };

  const validateStep2 = (): { valid: boolean; message?: string } => {
    const missing = MANDATORY_CERTIFICATIONS.filter(c => !certificationsMap[c.key]?.uploaded);
    if (missing.length > 0) {
      missing.forEach(m => {
        setCardErrors(prev => ({ ...prev, [m.key]: `${m.name} is required.` }));
      });
      return {
        valid: false,
        message: `Please upload all 6 required certifications before continuing. Missing: ${missing.map(m => m.name).join(', ')}`,
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const c of MANDATORY_CERTIFICATIONS) {
      const doc = certificationsMap[c.key];
      if (!doc.issueDate) {
        const msg = `Issue Date is required for ${c.name}.`;
        setCardErrors(prev => ({ ...prev, [c.key]: msg }));
        return { valid: false, message: msg };
      }
      if (!doc.expiryDate) {
        const msg = `Expiry Date is required for ${c.name}.`;
        setCardErrors(prev => ({ ...prev, [c.key]: msg }));
        return { valid: false, message: msg };
      }
      const issue = new Date(doc.issueDate);
      const expiry = new Date(doc.expiryDate);
      if (issue > new Date()) {
        const msg = `Issue Date for ${c.name} cannot be in the future.`;
        setCardErrors(prev => ({ ...prev, [c.key]: msg }));
        return { valid: false, message: msg };
      }
      if (expiry <= issue) {
        const msg = `Expiry Date must be after Issue Date for ${c.name}.`;
        setCardErrors(prev => ({ ...prev, [c.key]: msg }));
        return { valid: false, message: msg };
      }
      if (expiry < today) {
        const msg = `Expiry Date for ${c.name} cannot be in the past (${doc.expiryDate}).`;
        setCardErrors(prev => ({ ...prev, [c.key]: msg }));
        return { valid: false, message: msg };
      }
    }
    return { valid: true };
  };

  const validateStep3 = () => {
    return selectedProductIds.length > 0;
  };

  const validateStep4 = () => {
    for (const pId of selectedProductIds) {
      const supply = productSupplyDetailsMap[pId];
      if (!supply || !supply.moq || supply.moq <= 0 || !supply.leadTimeDays || supply.leadTimeDays <= 0) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    setApiError(null);
    try {
      if (currentStep === 1) {
        if (!validateStep1()) {
          setApiError('Please fill in all required company details.');
          return;
        }
        if (!password || password.length < 8) {
          setApiError('Portal password must be at least 8 characters.');
          return;
        }
        setIsSaving(true);
        const res = await manufacturerRegistrationApi.saveStep1(companyDetails, registrationCode || undefined);
        setRegistrationCode(res.registrationCode);
        localStorage.setItem('fg_mfg_reg_code', res.registrationCode);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        const val = validateStep2();
        if (!val.valid) {
          setApiError(val.message || 'Please ensure all 6 mandatory certifications are uploaded with valid dates.');
          return;
        }
        setIsSaving(true);
        const docsPayload = MANDATORY_CERTIFICATIONS.map(c => ({
          category: c.key,
          issueDate: certificationsMap[c.key]?.issueDate || '2023-01-01',
          expiryDate: certificationsMap[c.key]?.expiryDate || '2028-01-01',
        }));
        await manufacturerRegistrationApi.saveStep2({ documents: docsPayload }, registrationCode);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (selectedProductIds.length === 0) {
          setApiError('Please select at least one product capability.');
          return;
        }
        setIsSaving(true);
        await manufacturerRegistrationApi.saveStep3(selectedProductIds, registrationCode);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateStep4()) {
          setApiError('Please define valid MOQ and delivery lead time for all selected products.');
          return;
        }
        setIsSaving(true);
        const items = selectedProductIds.map(productId => ({
          productId,
          moq: productSupplyDetailsMap[productId]?.moq || 1000,
          leadTimeDays: productSupplyDetailsMap[productId]?.leadTimeDays || 14,
        }));
        await manufacturerRegistrationApi.saveStep4(items, registrationCode);
        setCurrentStep(5);
      }
    } catch (err: any) {
      setApiError(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrevStep = () => {
    setApiError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Product Selection Handlers
  const handleToggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    } else {
      setSelectedProductIds(prev => [...prev, productId]);
      if (!productSupplyDetailsMap[productId]) {
        setProductSupplyDetailsMap(prev => ({
          ...prev,
          [productId]: { moq: 1000, leadTimeDays: 14 }
        }));
      }
    }
  };

  // Ensure an active registration draft exists before uploading
  const getOrInitRegistrationCode = async (): Promise<string> => {
    let activeCode = registrationCode || localStorage.getItem('fg_mfg_reg_code') || '';
    if (!activeCode) {
      const step1Res = await manufacturerRegistrationApi.saveStep1(companyDetails);
      activeCode = step1Res.registrationCode;
      setRegistrationCode(activeCode);
      localStorage.setItem('fg_mfg_reg_code', activeCode);
    }
    return activeCode;
  };

  // Upload file directly to backend multipart API
  const uploadFileToBackend = async (key: string, name: string, file: File) => {
    setApiError(null);
    setCardErrors(prev => ({ ...prev, [key]: null }));
    setUploadingCategory(key);
    try {
      const activeCode = await getOrInitRegistrationCode();
      const docState = certificationsMap[key] || { issueDate: '2023-04-15', expiryDate: '2028-04-14' };
      const issueDate = docState.issueDate || '2023-04-15';
      const expiryDate = docState.expiryDate || '2028-04-14';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (new Date(issueDate) > new Date()) {
        const msg = `Issue Date for ${name} cannot be in the future.`;
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }

      if (new Date(expiryDate) <= new Date(issueDate)) {
        const msg = `Expiry Date must be after Issue Date for ${name}.`;
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }

      if (new Date(expiryDate) < today) {
        const msg = `Certificate has expired on ${expiryDate}. A valid future expiry date is required for active ${name} certification before uploading.`;
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }

      const uploaded = await manufacturerRegistrationApi.uploadDocument(
        file,
        key,
        activeCode,
        issueDate,
        expiryDate,
      );

      setCertificationsMap(prev => ({
        ...prev,
        [key]: {
          key,
          name,
          code: prev[key]?.code || 'CERT',
          id: uploaded.id,
          fileName: uploaded.fileName,
          uploaded: true,
          issueDate: uploaded.issueDate || issueDate,
          expiryDate: uploaded.expiryDate || expiryDate,
          documentCode: uploaded.documentCode,
          fileSize: uploaded.fileSize,
        }
      }));
      setCardErrors(prev => ({ ...prev, [key]: null }));
    } catch (err: any) {
      const msg = err.message || `Failed to upload ${name}`;
      setCardErrors(prev => ({ ...prev, [key]: msg }));
      setApiError(msg);
    } finally {
      setUploadingCategory(null);
    }
  };

  // Opens native file picker to select a real PDF
  const handleChooseFile = (key: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        const msg = 'Only PDF files are accepted. Please select a valid .pdf document.';
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }
      await uploadFileToBackend(key, name, file);
    };
    input.click();
  };

  // Testing helper: 1-click valid PDF upload for this certification
  const handleUploadSampleDoc = async (key: string, name: string) => {
    const sample = new File(
      [`%PDF-1.4\n% Sample ${name} verification certificate content for FactoryGrid\n%%EOF`],
      `${name.replace(/\s+/g, '_')}_Certificate.pdf`,
      { type: 'application/pdf' }
    );
    await uploadFileToBackend(key, name, sample);
  };

  // Testing helper: Fast-fill all 6 mandatory certifications
  const handleUploadAllSamples = async () => {
    setApiError(null);
    setIsSaving(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const c of MANDATORY_CERTIFICATIONS) {
        if (!certificationsMap[c.key]?.uploaded) {
          const docState = certificationsMap[c.key];
          if (docState?.expiryDate && new Date(docState.expiryDate) < today) {
            const msg = `Cannot upload sample certs: ${c.name} has an expired date (${docState.expiryDate}). Please update it to a valid future expiry date first.`;
            setCardErrors(prev => ({ ...prev, [c.key]: msg }));
            setApiError(msg);
            setIsSaving(false);
            return;
          }
          const sample = new File(
            [`%PDF-1.4\n% Sample ${c.name} verification certificate content for FactoryGrid\n%%EOF`],
            `${c.name.replace(/\s+/g, '_')}_Certificate.pdf`,
            { type: 'application/pdf' }
          );
          await uploadFileToBackend(c.key, c.name, sample);
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to auto-upload some sample certifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveDoc = async (key: string) => {
    setCardErrors(prev => ({ ...prev, [key]: null }));
    const doc = certificationsMap[key];
    if (doc?.id) {
      try {
        await manufacturerRegistrationApi.removeDocument(doc.id);
      } catch (err) {
        console.warn('Remove doc backend warning:', err);
      }
    }
    setCertificationsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        id: undefined,
        fileName: '',
        uploaded: false
      }
    }));
  };

  // Final Submission Handler
  const handleFinalSubmission = async () => {
    if (!isAccurateConfirmed) {
      alert('Please confirm that the information and documents provided are accurate.');
      return;
    }

    setApiError(null);
    setIsValidating(true);

    try {
      await manufacturerRegistrationApi.submitRegistration({
        registrationCode,
        password,
        confirmAccurate: true,
      });

      submitManufacturerOnboarding({
        companyName: companyDetails.companyName,
        factoryDetails: `${companyDetails.facilityAddress}, ${companyDetails.city}, ${companyDetails.state} ${companyDetails.pincode}`,
        mfgCapacity: companyDetails.mfgCapacity,
        whoGmpNo: certificationsMap['whoGmpCert']?.code || 'WHO-GMP-2026-REG',
        factoryLocation: `${companyDetails.city}, ${companyDetails.state}`,
        gstin: '36AAACS9981F1Z2',
        pan: 'AAACS9981F',
        mfgLicenseNo: certificationsMap['mfgLicense']?.code || 'MFG-FORM-25-28',
        contactPerson: companyDetails.contactPerson,
        email: companyDetails.email,
        phone: companyDetails.phone,
        targetMarkets: 'Domestic PCD & Exports (SE Asia, Africa)',
        drugCategories: ['Tablets', 'Capsules', 'Injectables'],
        certifications: MANDATORY_CERTIFICATIONS.map(c => c.name),
        documents: MANDATORY_CERTIFICATIONS.map(c => ({
          name: certificationsMap[c.key]?.fileName || `${c.name}.pdf`,
          type: c.key,
          status: 'VERIFIED' as const,
          url: '#'
        }))
      });

      localStorage.removeItem('fg_mfg_reg_code');
      setIsValidating(false);
      setIsSubmitted(true);

      if (onSuccess) onSuccess();
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err: any) {
      setIsValidating(false);
      setApiError(err.message || 'Submission failed');
    }
  };

  const selectedProductsList = catalogProducts.filter(p => selectedProductIds.includes(p.id));

  // Outer Wrapper Styling
  const wrapperStyle: React.CSSProperties = isPublicPage
    ? {
        minHeight: '100vh',
        background: '#07111D',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px 80px'
      }
    : {
        background: '#FFFFFF',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      };

  // Render Post-Submission Status Screen (Pending Compliance Review)
  if (isSubmitted) {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: 700, width: '100%', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: 36, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={34} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
            Manufacturer Registration Submitted
          </h2>
          <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
            Your manufacturing company registration for <strong style={{ color: '#FFF' }}>{companyDetails.companyName || 'Your Facility'}</strong> has been submitted successfully and is pending compliance verification.
          </div>

          {/* Validation & Audit Summary */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automated Verification Checklist</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>Company Information Completed</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>All 6 Mandatory Certifications & Valid Expiry Dates Verified</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>Product Capabilities Defined ({selectedProductIds.length} Products Linked)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>MOQ and Supply Delivery Schedules Recorded</span>
            </div>
          </div>

          {/* Pending Compliance Review Banner */}
          <div style={{ background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.3)', borderRadius: 10, padding: 16, textAlign: 'left', marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Workflow Handoff</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#FBBF24', marginBottom: 4 }}>STATUS: PENDING COMPLIANCE REVIEW</div>
            <div style={{ fontSize: 12.5, color: '#CBD5E1', lineHeight: 1.5 }}>
              Your application has been routed to the <strong>Compliance Officer</strong>. Following manual verification and approval, your official <strong>Manufacturer Code</strong> will be generated and portal access enabled.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={onBack ? onBack : () => (window.location.href = '/signin')}
              style={{ padding: '10px 24px', borderRadius: 8, background: '#334155', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              ← Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={{ maxWidth: 880, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stepper Header Indicator */}
        <div style={{ background: isPublicPage ? '#0F172A' : '#F8FAFC', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, textAlign: 'center' }}>
            {[
              { num: 1, label: '1 Company Details' },
              { num: 2, label: '2 Certifications' },
              { num: 3, label: '3 Capabilities' },
              { num: 4, label: '4 MOQ & Delivery Schedule' },
              { num: 5, label: '5 Review & Submit' }
            ].map(s => {
              const isCurrent = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isCurrent ? '#14B8A6' : isPassed ? '#16A34A' : isPublicPage ? '#1E293B' : '#E2E8F0',
                    color: (isCurrent || isPassed) ? '#FFFFFF' : isPublicPage ? '#64748B' : '#64748B',
                    fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isPassed ? '✓' : s.num}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? (isPublicPage ? '#FFF' : '#0F172A') : (isPublicPage ? '#94A3B8' : '#64748B') }}>
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading validation screen */}
        {isValidating ? (
          <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #14B8A6', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Validating manufacturer registration...</h3>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Checking company information, certification expiry dates, product capabilities, MOQ, and delivery schedules.</div>
          </div>
        ) : (
          <>
            {/* STEP 1 — COMPANY DETAILS */}
            {currentStep === 1 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Manufacturer Registration</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Register your manufacturing facility with FactoryGrid</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Company / Manufacturing Legal Entity Name *</label>
                    <input type="text" required placeholder="SunBio LifeSciences Pvt. Ltd." value={companyDetails.companyName} onChange={e => setCompanyDetails({ ...companyDetails, companyName: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Factory Site Street Address *</label>
                    <input type="text" required placeholder="Plot 42, IDA Pashamylaram, Phase III" value={companyDetails.facilityAddress} onChange={e => setCompanyDetails({ ...companyDetails, facilityAddress: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>City *</label>
                    <input type="text" required placeholder="Sangareddy / Hyderabad" value={companyDetails.city} onChange={e => setCompanyDetails({ ...companyDetails, city: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>State *</label>
                    <input type="text" required placeholder="Telangana / Himachal Pradesh" value={companyDetails.state} onChange={e => setCompanyDetails({ ...companyDetails, state: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Pincode *</label>
                    <input type="text" required placeholder="502307" value={companyDetails.pincode} onChange={e => setCompanyDetails({ ...companyDetails, pincode: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Monthly Installed Capacity *</label>
                    <input type="text" required placeholder="10,000,000 Units / Month" value={companyDetails.mfgCapacity} onChange={e => setCompanyDetails({ ...companyDetails, mfgCapacity: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Contact Person Name *</label>
                    <input type="text" required placeholder="Dr. Vikram Sethi" value={companyDetails.contactPerson} onChange={e => setCompanyDetails({ ...companyDetails, contactPerson: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Designation *</label>
                    <input type="text" required placeholder="Plant Head / Director" value={companyDetails.designation} onChange={e => setCompanyDetails({ ...companyDetails, designation: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Official Plant Email *</label>
                    <input type="email" required placeholder="plant@sunbiolabs.com" value={companyDetails.email} onChange={e => setCompanyDetails({ ...companyDetails, email: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Mobile Number *</label>
                    <input type="text" required placeholder="+91 98765 43210" value={companyDetails.phone} onChange={e => setCompanyDetails({ ...companyDetails, phone: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Create Portal Password * (min 8 chars)</label>
                    <input type="password" required placeholder="Create portal password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>
                </div>

                {apiError && (
                  <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handleNextStep} disabled={isSaving} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#14B8A6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: isSaving ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSaving ? 'Saving...' : 'Continue to Certifications →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — COMPLIANCE & CERTIFICATIONS */}
            {currentStep === 2 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Manufacturing Compliance & Certifications</h2>
                    <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                      Provide your manufacturing licenses and certifications for verification ({MANDATORY_CERTIFICATIONS.filter(c => certificationsMap[c.key]?.uploaded).length}/6 Uploaded).
                    </div>
                  </div>
                  {MANDATORY_CERTIFICATIONS.some(c => !certificationsMap[c.key]?.uploaded) && (
                    <button
                      type="button"
                      onClick={handleUploadAllSamples}
                      disabled={isSaving || !!uploadingCategory}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        background: 'rgba(20,184,166,0.12)',
                        color: '#0D9488',
                        border: '1px solid #99F6E4',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: (isSaving || !!uploadingCategory) ? 'wait' : 'pointer',
                        opacity: (isSaving || !!uploadingCategory) ? 0.7 : 1,
                      }}
                    >
                      ⚡ Fast Test: Upload All 6 Sample Certs
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {MANDATORY_CERTIFICATIONS.map(c => {
                    const doc = certificationsMap[c.key] || {
                      key: c.key, name: c.name, code: c.code, fileName: '', uploaded: false, issueDate: '', expiryDate: ''
                    };

                    const isExpiryInvalid = doc.issueDate && doc.expiryDate && new Date(doc.expiryDate) < new Date(doc.issueDate);
                    const isExpiryInPast = doc.expiryDate && new Date(doc.expiryDate) < new Date();

                    return (
                      <div key={c.key} style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                              {c.name} <span style={{ color: '#DC2626', fontSize: 11 }}>(Required *)</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Standard: {c.code}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {doc.uploaded ? (
                              <>
                                <span style={{ padding: '4px 12px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', fontSize: 11.5, fontWeight: 700 }}>✓ Uploaded</span>
                                <button type="button" onClick={() => handleRemoveDoc(c.key)} style={{ padding: '5px 10px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                  Remove
                                </button>
                              </>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => handleChooseFile(c.key, c.name)}
                                  disabled={uploadingCategory === c.key || isSaving}
                                  style={{
                                    padding: '6px 14px', borderRadius: 6,
                                    background: '#14B8A6', color: '#FFF',
                                    border: 'none', fontSize: 12, fontWeight: 700,
                                    cursor: (uploadingCategory === c.key || isSaving) ? 'wait' : 'pointer',
                                    opacity: (uploadingCategory === c.key || isSaving) ? 0.7 : 1,
                                    display: 'flex', alignItems: 'center', gap: 6
                                  }}
                                >
                                  <Upload size={13} /> {uploadingCategory === c.key ? 'Uploading...' : 'Upload Document'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUploadSampleDoc(c.key, c.name)}
                                  disabled={uploadingCategory === c.key || isSaving}
                                  title="Upload valid test PDF for quick verification"
                                  style={{
                                    padding: '6px 10px', borderRadius: 6,
                                    background: isPublicPage ? '#334155' : '#E2E8F0',
                                    color: isPublicPage ? '#E2E8F0' : '#475569',
                                    border: '1px solid #CBD5E1', fontSize: 11, fontWeight: 600,
                                    cursor: (uploadingCategory === c.key || isSaving) ? 'wait' : 'pointer',
                                    opacity: (uploadingCategory === c.key || isSaving) ? 0.7 : 1,
                                  }}
                                >
                                  Sample PDF
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {doc.uploaded && (
                          <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 12, background: 'rgba(22,163,74,0.08)', padding: '6px 10px', borderRadius: 6 }}>
                            📄 {doc.fileName} {doc.documentCode ? `(${doc.documentCode})` : ''}
                          </div>
                        )}

                        {/* Issue & Expiry Date Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 10, borderTop: isPublicPage ? '1px solid #334155' : '1px solid #E2E8F0' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Issue Date *</label>
                            <input
                              type="date"
                              required
                              value={doc.issueDate}
                              onChange={e => {
                                setCardErrors(prev => ({ ...prev, [c.key]: null }));
                                setCertificationsMap(prev => ({
                                  ...prev,
                                  [c.key]: { ...prev[c.key], issueDate: e.target.value }
                                }));
                              }}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Expiry Date *</label>
                            <input
                              type="date"
                              required
                              value={doc.expiryDate}
                              onChange={e => {
                                setCardErrors(prev => ({ ...prev, [c.key]: null }));
                                setCertificationsMap(prev => ({
                                  ...prev,
                                  [c.key]: { ...prev[c.key], expiryDate: e.target.value }
                                }));
                              }}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: (isExpiryInvalid || isExpiryInPast || cardErrors[c.key]) ? '1px solid #DC2626' : '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                          </div>
                        </div>

                        {isExpiryInvalid && (
                          <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6, fontWeight: 700 }}>
                            ⚠️ Expiry Date cannot be before Issue Date.
                          </div>
                        )}
                        {!isExpiryInvalid && isExpiryInPast && (
                          <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, background: '#FEF2F2', padding: '6px 10px', borderRadius: 6, border: '1px solid #FECACA' }}>
                            <span>⚠️ Expiry Date cannot be in the past ({doc.expiryDate}). A valid future date is required.</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCardErrors(prev => ({ ...prev, [c.key]: null }));
                                setCertificationsMap(prev => ({
                                  ...prev,
                                  [c.key]: { ...prev[c.key], expiryDate: '2028-08-31' }
                                }));
                              }}
                              style={{
                                background: '#FFF', border: '1px solid #14B8A6', color: '#0D9488',
                                borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              Set valid renewal date (31-08-2028)
                            </button>
                          </div>
                        )}
                        {cardErrors[c.key] && (
                          <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            ⚠️ {cardErrors[c.key]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {apiError && (
                  <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button type="button" onClick={handlePrevStep} disabled={isSaving || !!uploadingCategory} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSaving || !!uploadingCategory}
                    style={{
                      height: 42,
                      padding: '0 24px',
                      borderRadius: 8,
                      background: '#14B8A6',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: (isSaving || !!uploadingCategory) ? 'not-allowed' : 'pointer',
                      opacity: (isSaving || !!uploadingCategory) ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {isSaving ? 'Validating & Saving...' : 'Continue to Capabilities →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — PRODUCT CAPABILITIES */}
            {currentStep === 3 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Product Manufacturing Capabilities</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Select the products your manufacturing facility can manufacture.</div>
                </div>

                {/* Selected Products Counter Badge */}
                <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                    Selected Capabilities ({selectedProductIds.length} Products)
                  </div>
                  <span style={{ fontSize: 11.5, color: '#14B8A6', fontWeight: 700 }}>From FactoryGrid Central Catalog</span>
                </div>

                {/* Selected Products Badges */}
                {selectedProductsList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, padding: 12, background: isPublicPage ? '#1E293B' : '#F8FAFC', borderRadius: 10, border: '1px solid #CBD5E1' }}>
                    {selectedProductsList.map(p => (
                      <div key={p.id} style={{ padding: '6px 12px', background: '#14B8A6', color: '#FFF', borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>✓ {p.name}</span>
                        <button onClick={() => handleToggleProductSelection(p.id)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0, fontWeight: 900 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Input */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                  <input
                    type="text"
                    placeholder="Search product catalog by name, generic name, category..."
                    value={productSearchTerm}
                    onChange={e => setProductSearchTerm(e.target.value)}
                    style={{ width: '100%', height: 42, padding: '0 12px 0 38px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                  />
                </div>

                {/* Catalog Product Selection List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                  {catalogProducts
                    .filter(p => p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.genericName.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.category.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    .map(product => {
                      const isSelected = selectedProductIds.includes(product.id);
                      return (
                        <div key={product.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isSelected ? 'rgba(20,184,166,0.12)' : (isPublicPage ? '#1E293B' : '#F8FAFC'), borderRadius: 8, border: isSelected ? '1px solid #14B8A6' : '1px solid #E2E8F0' }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>{product.name}</div>
                            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                              {product.genericName} • {product.dosageForm} • Category: {product.category}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleProductSelection(product.id)}
                            style={{
                              padding: '6px 14px', borderRadius: 6,
                              background: isSelected ? '#DCFCE7' : '#14B8A6',
                              color: isSelected ? '#15803D' : '#FFF',
                              border: isSelected ? '1px solid #86EFAC' : 'none',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ Selected' : '+ Select Product'}
                          </button>
                        </div>
                      );
                    })}
                </div>

                {apiError && (
                  <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button type="button" onClick={handlePrevStep} disabled={isSaving} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSaving}
                    style={{
                      height: 42,
                      padding: '0 24px',
                      borderRadius: 8,
                      background: '#14B8A6',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isSaving ? 'wait' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {isSaving ? 'Saving Capabilities...' : 'Continue to MOQ & Delivery Schedule →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — MOQ & LEAD TIME */}
            {currentStep === 4 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Product Supply Details</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Define MOQ and typical delivery schedule for each product you manufacture.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedProductsList.map(product => {
                    const supply = productSupplyDetailsMap[product.id] || { moq: 1000, leadTimeDays: 14 };
                    return (
                      <div key={product.id} style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginBottom: 4 }}>{product.name}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 14 }}>{product.genericName} ({product.packSize})</div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Minimum Order Quantity (MOQ) *</label>
                            <input
                              type="number"
                              min="1"
                              value={supply.moq}
                              onChange={e => setProductSupplyDetailsMap(prev => ({
                                ...prev,
                                [product.id]: { ...prev[product.id], moq: Number(e.target.value) || 0 }
                              }))}
                              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Units / Packs</div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Typical Production Delivery Schedule (Days) *</label>
                            <input
                              type="number"
                              min="1"
                              value={supply.leadTimeDays}
                              onChange={e => setProductSupplyDetailsMap(prev => ({
                                ...prev,
                                [product.id]: { ...prev[product.id], leadTimeDays: Number(e.target.value) || 0 }
                              }))}
                              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Days from PO receipt to dispatch</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {apiError && (
                  <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button type="button" onClick={handlePrevStep} disabled={isSaving} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isSaving}
                    style={{
                      height: 42,
                      padding: '0 24px',
                      borderRadius: 8,
                      background: '#14B8A6',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: isSaving ? 'wait' : 'pointer',
                      opacity: isSaving ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {isSaving ? 'Saving Supply Details...' : 'Continue to Review →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 — REVIEW & SUBMIT */}
            {currentStep === 5 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Review Manufacturer Registration</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Review manufacturing company details before submission</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Section 1: Company Details */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>1. Company Details</span>
                      <button onClick={() => setCurrentStep(1)} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Company: <strong>{companyDetails.companyName}</strong></div>
                      <div>Contact Person: <strong>{companyDetails.contactPerson} ({companyDetails.designation})</strong></div>
                      <div>Facility: <strong>{companyDetails.facilityAddress}, {companyDetails.city}, {companyDetails.state}</strong></div>
                      <div>Capacity: <strong>{companyDetails.mfgCapacity}</strong></div>
                      <div>Email / Phone: <strong>{companyDetails.email} | {companyDetails.phone}</strong></div>
                    </div>
                  </div>

                  {/* Section 2: Certifications Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>2. Compliance & Certifications (6 Certs Verified)</span>
                      <button onClick={() => setCurrentStep(2)} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      {MANDATORY_CERTIFICATIONS.map(c => {
                        const doc = certificationsMap[c.key];
                        return (
                          <div key={c.key} style={{ padding: '6px 8px', background: isPublicPage ? '#0F172A' : '#FFF', borderRadius: 6, border: '1px solid #CBD5E1' }}>
                            <div style={{ fontWeight: 700 }}>✓ {c.name}</div>
                            <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>
                              Issue: {doc?.issueDate || '—'} | Expiry: <strong style={{ color: '#16A34A' }}>{doc?.expiryDate || '—'}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3 & 4: Product Capabilities & Supply Details Table */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>3 & 4. Product Capabilities, MOQ & Delivery Schedules ({selectedProductsList.length} Products)</span>
                      <button onClick={() => setCurrentStep(3)} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#64748B' }}>
                            <th style={{ padding: '6px 8px' }}>Product Name</th>
                            <th style={{ padding: '6px 8px' }}>Category</th>
                            <th style={{ padding: '6px 8px' }}>MOQ</th>
                            <th style={{ padding: '6px 8px' }}>Delivery Schedule</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProductsList.map(p => {
                            const supply = productSupplyDetailsMap[p.id] || { moq: 1000, leadTimeDays: 14 };
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '8px', fontWeight: 700 }}>{p.name}</td>
                                <td style={{ padding: '8px', color: '#64748B' }}>{p.category}</td>
                                <td style={{ padding: '8px', fontWeight: 700 }}>{supply.moq.toLocaleString()} Units</td>
                                <td style={{ padding: '8px', fontWeight: 700, color: '#14B8A6' }}>{supply.leadTimeDays} Days</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', padding: 14, borderRadius: 8 }}>
                    <input
                      type="checkbox"
                      id="confirmAccurateMfg"
                      checked={isAccurateConfirmed}
                      onChange={e => setIsAccurateConfirmed(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="confirmAccurateMfg" style={{ fontSize: 13, fontWeight: 600, color: isPublicPage ? '#FFF' : '#0F172A', cursor: 'pointer' }}>
                      I confirm that the information and documents provided are accurate.
                    </label>
                  </div>
                </div>

                {apiError && (
                  <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    ⚠️ {apiError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    onClick={handleFinalSubmission}
                    disabled={!isAccurateConfirmed || isValidating}
                    style={{
                      height: 42, padding: '0 28px', borderRadius: 8, background: (isAccurateConfirmed && !isValidating) ? '#16A34A' : '#94A3B8',
                      color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: (isAccurateConfirmed && !isValidating) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    {isValidating ? 'Submitting...' : 'Submit Manufacturer Registration →'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
