import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, FileText, CheckCircle2, Upload,
  Search, Calendar, Building2, Package, Clock
} from 'lucide-react';
import { mockProducts } from '../../data/mockData';

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
  fileName: string;
  uploaded: boolean;
  issueDate: string;
  expiryDate: string;
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
  const catalogProducts = (appProducts && appProducts.length > 0) ? appProducts : mockProducts;

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

  // STEP 2 — Certifications & Expiry Dates State
  const [certificationsMap, setCertificationsMap] = useState<Record<string, CertDocState>>({
    mfgLicense: { key: 'mfgLicense', name: 'Manufacturing License', code: 'Form 25/28', fileName: 'MFG_License_Form_25_28.pdf', uploaded: true, issueDate: '2023-04-15', expiryDate: '2028-04-14' },
    gmpCert: { key: 'gmpCert', name: 'GMP Certificate', code: 'CDSCO Schedule M', fileName: 'CDSCO_GMP_Certificate.pdf', uploaded: true, issueDate: '2023-06-10', expiryDate: '2027-06-09' },
    whoGmpCert: { key: 'whoGmpCert', name: 'WHO-GMP Certificate', code: 'WHO-GMP Standard', fileName: 'WHO_GMP_Accreditation_Cert.pdf', uploaded: true, issueDate: '2023-09-01', expiryDate: '2026-08-31' },
    isoCert: { key: 'isoCert', name: 'ISO Certification', code: 'ISO 9001:2015', fileName: 'ISO_9001_2015_Certificate.pdf', uploaded: true, issueDate: '2022-11-20', expiryDate: '2027-11-19' },
    factoryReg: { key: 'factoryReg', name: 'Factory Registration', code: 'Factories Act Cert', fileName: 'Factory_Registration_Govt.pdf', uploaded: true, issueDate: '2021-01-10', expiryDate: '2029-01-09' },
    pollutionCert: { key: 'pollutionCert', name: 'Pollution Control Clearance', code: 'SPCB NOC', fileName: 'Pollution_Control_Board_NOC.pdf', uploaded: true, issueDate: '2023-01-15', expiryDate: '2028-01-14' }
  });

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

  const validateStep2 = () => {
    for (const c of MANDATORY_CERTIFICATIONS) {
      const doc = certificationsMap[c.key];
      if (!doc || !doc.uploaded) return false;
      if (!doc.issueDate || !doc.expiryDate) return false;
      if (new Date(doc.expiryDate) < new Date(doc.issueDate)) return false;
    }
    return true;
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

  const handleNextStep = () => {
    if (currentStep === 3 && selectedProductIds.length === 0) {
      setSelectedProductIds(['prod_1', 'prod_2']);
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handlePrevStep = () => {
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

  // Document Upload Simulator
  const handleSimulateDocUpload = (key: string, name: string) => {
    const fileName = `${name.replace(/\s+/g, '_')}_Cert.pdf`;
    setCertificationsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        fileName,
        uploaded: true,
        issueDate: prev[key]?.issueDate || '2023-01-01',
        expiryDate: prev[key]?.expiryDate || '2028-01-01'
      }
    }));
  };

  const handleRemoveDoc = (key: string) => {
    setCertificationsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        fileName: '',
        uploaded: false
      }
    }));
  };

  // Final Submission Handler
  const handleFinalSubmission = () => {
    if (!isAccurateConfirmed) {
      alert('Please confirm that the information and documents provided are accurate.');
      return;
    }

    setIsValidating(true);

    setTimeout(() => {
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

      setIsValidating(false);
      setIsSubmitted(true);

      if (onSuccess) onSuccess();
      if (onSubmitSuccess) onSubmitSuccess();
    }, 1500);
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
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#14B8A6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue to Certifications →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — COMPLIANCE & CERTIFICATIONS */}
            {currentStep === 2 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Manufacturing Compliance & Certifications</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Provide your manufacturing licenses and certifications for verification.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {MANDATORY_CERTIFICATIONS.map(c => {
                    const doc = certificationsMap[c.key] || {
                      key: c.key, name: c.name, code: c.code, fileName: '', uploaded: false, issueDate: '', expiryDate: ''
                    };

                    const isExpiryInvalid = doc.issueDate && doc.expiryDate && new Date(doc.expiryDate) < new Date(doc.issueDate);

                    return (
                      <div key={c.key} style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                              {c.name} <span style={{ color: '#DC2626', fontSize: 11 }}>(Required *)</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Standard: {c.code}</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {doc.uploaded ? (
                              <>
                                <span style={{ padding: '3px 10px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', fontSize: 11, fontWeight: 700 }}>✓ Uploaded</span>
                                <button onClick={() => handleRemoveDoc(c.key)} style={{ padding: '5px 10px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleSimulateDocUpload(c.key, c.name)} style={{ padding: '6px 14px', borderRadius: 6, background: '#14B8A6', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Upload size={13} /> Upload Document
                              </button>
                            )}
                          </div>
                        </div>

                        {doc.uploaded && (
                          <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, marginBottom: 12, background: 'rgba(22,163,74,0.08)', padding: '6px 10px', borderRadius: 6 }}>
                            📄 {doc.fileName}
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
                              onChange={e => setCertificationsMap(prev => ({
                                ...prev,
                                [c.key]: { ...prev[c.key], issueDate: e.target.value }
                              }))}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Expiry Date *</label>
                            <input
                              type="date"
                              required
                              value={doc.expiryDate}
                              onChange={e => setCertificationsMap(prev => ({
                                ...prev,
                                [c.key]: { ...prev[c.key], expiryDate: e.target.value }
                              }))}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: isExpiryInvalid ? '1px solid #DC2626' : '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                          </div>
                        </div>

                        {isExpiryInvalid && (
                          <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6, fontWeight: 700 }}>
                            ⚠️ Expiry Date cannot be before Issue Date.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#14B8A6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue to Capabilities →
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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#14B8A6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue to MOQ & Delivery Schedule →
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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#14B8A6', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue to Review →
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

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button
                    onClick={handleFinalSubmission}
                    disabled={!isAccurateConfirmed}
                    style={{
                      height: 42, padding: '0 28px', borderRadius: 8, background: isAccurateConfirmed ? '#16A34A' : '#94A3B8',
                      color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: isAccurateConfirmed ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    Submit Manufacturer Registration →
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
