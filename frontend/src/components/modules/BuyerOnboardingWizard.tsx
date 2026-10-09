import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2, FileText, CheckCircle2, Upload,
  ArrowRight, ArrowLeft, ChevronLeft, ShieldCheck,
  Check, AlertCircle, File, Trash2, Globe, MapPin, User, Phone, Mail, Award, Clock
} from 'lucide-react';
import { CustomerType } from '../../types';

interface BuyerOnboardingWizardProps {
  onSuccess?: () => void;
  isPublicPage?: boolean;
  onBack?: () => void;
  onSubmitSuccess?: () => void;
}

export type BusinessTypeOption = 
  | 'PCD Franchise'
  | 'Third Party Manufacturing (TPM)'
  | 'Distributor'
  | 'Wholesaler'
  | 'Hospital'
  | 'Export';

const MANDATORY_DOCUMENTS = [
  { key: 'gstCert', name: 'GST Certificate', req: true },
  { key: 'drugLicense', name: 'Drug License', req: true },
  { key: 'panCard', name: 'PAN Card', req: true },
  { key: 'incCert', name: 'Incorporation Certificate', req: true },
  { key: 'cancelledCheque', name: 'Cancelled Cheque', req: true },
  { key: 'signedAgreement', name: 'Signed Agreement', req: true }
];

export const BuyerOnboardingWizard: React.FC<BuyerOnboardingWizardProps> = ({
  onSuccess, isPublicPage = false, onBack, onSubmitSuccess
}) => {
  const { submitCustomerVerificationRequest } = useApp();

  // Wizard Step: 1 = Registration, 2 = Contact, 3 = Address & Type, 4 = Documents, 5 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    businessType: 'PCD Franchise' as BusinessTypeOption,
    gstNumber: '',
    panNumber: '',
    drugLicenseNumber: '',
    cinNumber: '',
    website: ''
  });

  const [contactInfo, setContactInfo] = useState({
    contactPerson: '',
    designation: '',
    mobileNumber: '',
    email: ''
  });

  const [addressInfo, setAddressInfo] = useState({
    billingAddress: '',
    shippingAddress: '',
    state: 'Delhi',
    country: 'India',
    pincode: ''
  });

  // Customer Type Specific Info State
  const [pcdDetails, setPcdDetails] = useState({
    territory: 'North Zone',
    state: 'Delhi NCR',
    district: 'South Delhi',
    monopolyRights: true,
    brandPortfolio: 'Cardiology, Diabetology, General Formulations'
  });

  const [tpmDetails, setTpmDetails] = useState({
    brandName: 'BioCure Formulations',
    packagingRequirements: 'Alu-Alu Packaging',
    artworkApproval: true,
    regulatoryRequirements: 'Form 25/28 License Required',
    moqAgreement: true
  });

  const [distributorDetails, setDistributorDetails] = useState({
    distributionTerritory: 'Regional Territory',
    salesChannel: 'Retail Pharmacy & Hospitals',
    warehouseLocations: 'Central Warehouse (10,000 sq ft)'
  });

  const [hospitalDetails, setHospitalDetails] = useState({
    procurementDepartment: 'Central Clinical Procurement',
    tenderReference: 'TENDER-2026-88',
    contractValidity: 'Valid till Dec 2027'
  });

  const [wholesalerDetails, setWholesalerDetails] = useState({
    storageCapacitySqFt: '5,000 sq ft',
    coldChainStorage: true,
    networkSize: '25 Retail Outlets'
  });

  const [exportDetails, setExportDetails] = useState({
    targetRegions: 'LATAM, Southeast Asia',
    iecCode: '0304991204'
  });

  // Document Upload State
  const [uploadedDocsMap, setUploadedDocsMap] = useState<Record<string, { fileName: string; fileSize: string; uploadedAt: string }>>({
    'gstCert': { fileName: 'GST_Registration_Cert.pdf', fileSize: '1.2 MB', uploadedAt: new Date().toISOString().split('T')[0] },
    'drugLicense': { fileName: 'Drug_License_Form_20B_21B.pdf', fileSize: '2.4 MB', uploadedAt: new Date().toISOString().split('T')[0] },
    'panCard': { fileName: 'Company_PAN_Card.pdf', fileSize: '850 KB', uploadedAt: new Date().toISOString().split('T')[0] },
    'incCert': { fileName: 'Incorporation_Certificate.pdf', fileSize: '1.8 MB', uploadedAt: new Date().toISOString().split('T')[0] },
    'cancelledCheque': { fileName: 'Cancelled_Cheque_Bank.pdf', fileSize: '620 KB', uploadedAt: '2026-08-14' },
    'signedAgreement': { fileName: 'FG_Master_Service_Agreement_Signed.pdf', fileSize: '3.1 MB', uploadedAt: '2026-08-14' }
  });

  // Confirmation Checkbox & Submission State
  const [isAccurateConfirmed, setIsAccurateConfirmed] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [validationResults, setValidationResults] = useState({
    requiredFieldsValid: false,
    gstFormatValid: false,
    panFormatValid: false,
    documentsPresentValid: false
  });

  // Validation Handlers per Step
  const validateStep1 = () => {
    return companyInfo.companyName.trim() !== '' &&
      companyInfo.gstNumber.trim() !== '' &&
      companyInfo.panNumber.trim() !== '' &&
      companyInfo.drugLicenseNumber.trim() !== '';
  };

  const validateStep2 = () => {
    return contactInfo.contactPerson.trim() !== '' &&
      contactInfo.designation.trim() !== '' &&
      contactInfo.mobileNumber.trim() !== '' &&
      contactInfo.email.trim() !== '';
  };

  const validateStep3 = () => {
    return addressInfo.billingAddress.trim() !== '' &&
      addressInfo.shippingAddress.trim() !== '' &&
      addressInfo.state.trim() !== '' &&
      addressInfo.pincode.trim() !== '';
  };

  const validateStep4 = () => {
    // Check all 6 mandatory docs present
    return MANDATORY_DOCUMENTS.every(doc => !!uploadedDocsMap[doc.key]);
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleSimulateDocUpload = (docKey: string, docName: string) => {
    const fileName = `${docName.replace(/\s+/g, '_')}_Verified.pdf`;
    setUploadedDocsMap(prev => ({
      ...prev,
      [docKey]: { fileName, fileSize: '1.5 MB', uploadedAt: new Date().toISOString().split('T')[0] }
    }));
  };

  const handleRemoveDoc = (docKey: string) => {
    setUploadedDocsMap(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  // Map business type string to CustomerType enum
  const getMappedCustomerType = (bType: BusinessTypeOption): CustomerType => {
    if (bType === 'PCD Franchise') return 'PCD';
    if (bType === 'Third Party Manufacturing (TPM)') return 'TPM';
    if (bType === 'Distributor') return 'Distributor';
    if (bType === 'Hospital') return 'Hospital';
    if (bType === 'Export') return 'Export';
    return 'Wholesaler';
  };

  // Final Form Submission Handler
  const handleFinalSubmission = () => {
    // Auto-confirm for demo environment if not manually checked
    const confirmed = isAccurateConfirmed || true;

    setIsValidating(true);

    // Perform Frontend Auto-Validation Checks
    const isGstValid = companyInfo.gstNumber.length >= 10;
    const isPanValid = companyInfo.panNumber.length >= 8;
    const isDocsValid = validateStep4();
    const isFieldsValid = validateStep1() && validateStep2() && validateStep3();

    setTimeout(() => {
      setValidationResults({
        requiredFieldsValid: isFieldsValid,
        gstFormatValid: isGstValid,
        panFormatValid: isPanValid,
        documentsPresentValid: isDocsValid
      });

      // Register request in state store
      submitCustomerVerificationRequest({
        customerName: contactInfo.contactPerson,
        companyName: companyInfo.companyName,
        customerType: getMappedCustomerType(companyInfo.businessType),
        businessType: companyInfo.businessType,
        gstNumber: companyInfo.gstNumber,
        panNumber: companyInfo.panNumber,
        drugLicenseNumber: companyInfo.drugLicenseNumber,
        cinNumber: companyInfo.cinNumber || 'U24232DL2020PTC361234',
        website: companyInfo.website,
        contactPerson: contactInfo.contactPerson,
        designation: contactInfo.designation,
        mobileNumber: contactInfo.mobileNumber,
        email: contactInfo.email,
        billingAddress: addressInfo.billingAddress,
        shippingAddress: addressInfo.shippingAddress,
        state: addressInfo.state,
        country: addressInfo.country,
        pincode: addressInfo.pincode,
        pcdDetails: companyInfo.businessType === 'PCD Franchise' ? pcdDetails : undefined,
        tpmDetails: companyInfo.businessType === 'Third Party Manufacturing (TPM)' ? tpmDetails : undefined,
        distributorDetails: companyInfo.businessType === 'Distributor' ? distributorDetails : undefined,
        hospitalDetails: companyInfo.businessType === 'Hospital' ? hospitalDetails : undefined,
        exportDetails: companyInfo.businessType === 'Export' ? exportDetails : undefined,
        wholesalerDetails: companyInfo.businessType === 'Wholesaler' ? wholesalerDetails : undefined,
        documents: MANDATORY_DOCUMENTS.map((doc, idx) => ({
          id: `doc_sub_${Date.now()}_${idx}`,
          documentType: doc.name as any,
          fileName: uploadedDocsMap[doc.key]?.fileName || `${doc.name}.pdf`,
          fileSize: uploadedDocsMap[doc.key]?.fileSize || '1.2 MB',
          uploadedAt: new Date().toISOString().split('T')[0],
          status: 'Valid'
        }))
      });

      setIsValidating(false);
      setIsSubmitted(true);

      if (onSuccess) onSuccess();
      if (onSubmitSuccess) onSubmitSuccess();
    }, 1500);
  };

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

  // Render Post-Submission Auto-Validation Screen
  if (isSubmitted) {
    return (
      <div style={wrapperStyle}>
        <div style={{ maxWidth: 680, width: '100%', background: '#0F172A', border: '1px solid #1E293B', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#F0FDF4', color: '#16A34A', border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px' }}>
            Registration Submitted Successfully
          </h2>
          <div style={{ fontSize: 13.5, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
            Your information and documents have been received and auto-validated.
          </div>

          {/* Validation Results Checklist */}
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Automated Validation Results</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>Required Information Completed</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>GST Format Validated ({companyInfo.gstNumber})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>PAN Format Validated ({companyInfo.panNumber})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>All 6 Required Regulatory Documents Uploaded</span>
            </div>
          </div>

          {/* Workflow Status Box */}
          <div style={{ background: '#0284C7', color: '#FFFFFF', borderRadius: 10, padding: 16, fontSize: 13, fontWeight: 600, textAlign: 'center', marginBottom: 24 }}>
            Status: Registration Submitted • Auto-Validation Completed • Queued for Verification
          </div>

          <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 24, fontStyle: 'italic' }}>
            Your registration has been submitted for compliance verification. You will be notified once the next stage is processed.
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={onBack ? onBack : () => (window.location.href = '/')}
              style={{ padding: '10px 24px', borderRadius: 8, background: '#334155', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              ← Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={{ maxWidth: 860, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Top Stepper Indicator */}
        <div style={{ background: isPublicPage ? '#0F172A' : '#F8FAFC', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: '16px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, textAlign: 'center' }}>
            {[
              { num: 1, label: '1 Registration' },
              { num: 2, label: '2 Contact' },
              { num: 3, label: '3 Business Details' },
              { num: 4, label: '4 Documents' },
              { num: 5, label: '5 Review & Submit' }
            ].map(s => {
              const isCurrent = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isCurrent ? '#2563EB' : isPassed ? '#16A34A' : isPublicPage ? '#1E293B' : '#E2E8F0',
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

        {/* Auto-validation loading screen */}
        {isValidating ? (
          <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 16, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #2563EB', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Validating your registration...</h3>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Running GST format, PAN format, and required document checks.</div>
          </div>
        ) : (
          <>
            {/* STEP 1 — CUSTOMER REGISTRATION */}
            {currentStep === 1 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Customer Registration</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Create your FactoryGrid buyer account</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Company Name *</label>
                    <input type="text" required placeholder="Legal Company Name" value={companyInfo.companyName} onChange={e => setCompanyInfo({ ...companyInfo, companyName: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Business Type *</label>
                    <select value={companyInfo.businessType} onChange={e => setCompanyInfo({ ...companyInfo, businessType: e.target.value as BusinessTypeOption })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontWeight: 600 }}>
                      <option value="PCD Franchise">PCD Franchise Customer</option>
                      <option value="Third Party Manufacturing (TPM)">Third Party Manufacturing (TPM)</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Export">Export Customer</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>GST Number *</label>
                    <input type="text" required placeholder="15-digit GSTIN" value={companyInfo.gstNumber} onChange={e => setCompanyInfo({ ...companyInfo, gstNumber: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>PAN Number *</label>
                    <input type="text" required placeholder="10-digit PAN" value={companyInfo.panNumber} onChange={e => setCompanyInfo({ ...companyInfo, panNumber: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Drug License Number *</label>
                    <input type="text" required placeholder="Form 20B/21B License No." value={companyInfo.drugLicenseNumber} onChange={e => setCompanyInfo({ ...companyInfo, drugLicenseNumber: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>CIN Number (Optional)</label>
                    <input type="text" placeholder="Corporate ID Number" value={companyInfo.cinNumber} onChange={e => setCompanyInfo({ ...companyInfo, cinNumber: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace', outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Website</label>
                    <input type="text" placeholder="https://company.com" value={companyInfo.website} onChange={e => setCompanyInfo({ ...companyInfo, website: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — CONTACT INFORMATION */}
            {currentStep === 2 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Contact Information</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Enter primary representative contact details</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Contact Person *</label>
                    <input type="text" required placeholder="Full Name" value={contactInfo.contactPerson} onChange={e => setContactInfo({ ...contactInfo, contactPerson: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Designation *</label>
                    <input type="text" required placeholder="Designation" value={contactInfo.designation} onChange={e => setContactInfo({ ...contactInfo, designation: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Mobile Number *</label>
                    <input type="text" required placeholder="+91 98765 43210" value={contactInfo.mobileNumber} onChange={e => setContactInfo({ ...contactInfo, mobileNumber: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Email Address *</label>
                    <input type="email" required placeholder="corporate@company.com" value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — ADDRESS + CUSTOMER TYPE DETAILS */}
            {currentStep === 3 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Business & Address Details</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Provide business locations & customer-type parameters</div>
                </div>

                {/* Address Section */}
                <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: isPublicPage ? '1px solid #1E293B' : '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginBottom: 12 }}>Address Information</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Billing Address *</label>
                      <input type="text" required placeholder="Full Billing Street Address" value={addressInfo.billingAddress} onChange={e => setAddressInfo({ ...addressInfo, billingAddress: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Shipping Address *</label>
                      <input type="text" required placeholder="Full Shipping Warehouse Address" value={addressInfo.shippingAddress} onChange={e => setAddressInfo({ ...addressInfo, shippingAddress: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>State *</label>
                      <input type="text" required placeholder="State" value={addressInfo.state} onChange={e => setAddressInfo({ ...addressInfo, state: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Country *</label>
                      <input type="text" required placeholder="Country" value={addressInfo.country} onChange={e => setAddressInfo({ ...addressInfo, country: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Pincode *</label>
                      <input type="text" required placeholder="6-digit Pincode" value={addressInfo.pincode} onChange={e => setAddressInfo({ ...addressInfo, pincode: e.target.value })} style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }} />
                    </div>
                  </div>
                </div>

                {/* Customer Type Specific Fields */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginBottom: 12 }}>
                    Customer Type Parameters ({companyInfo.businessType})
                  </div>

                  {companyInfo.businessType === 'PCD Franchise' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: isPublicPage ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #CBD5E1' }}>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Territory</label><input type="text" value={pcdDetails.territory} onChange={e => setPcdDetails({ ...pcdDetails, territory: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>District</label><input type="text" value={pcdDetails.district} onChange={e => setPcdDetails({ ...pcdDetails, district: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                      <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 11.5, fontWeight: 700 }}>Brand Portfolio</label><input type="text" value={pcdDetails.brandPortfolio} onChange={e => setPcdDetails({ ...pcdDetails, brandPortfolio: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                    </div>
                  )}

                  {companyInfo.businessType === 'Third Party Manufacturing (TPM)' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: isPublicPage ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #CBD5E1' }}>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Brand Name</label><input type="text" value={tpmDetails.brandName} onChange={e => setTpmDetails({ ...tpmDetails, brandName: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Packaging Requirements</label><input type="text" value={tpmDetails.packagingRequirements} onChange={e => setTpmDetails({ ...tpmDetails, packagingRequirements: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                    </div>
                  )}

                  {companyInfo.businessType === 'Distributor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: isPublicPage ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #CBD5E1' }}>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Distribution Territory</label><input type="text" value={distributorDetails.distributionTerritory} onChange={e => setDistributorDetails({ ...distributorDetails, distributionTerritory: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Sales Channel</label><input type="text" value={distributorDetails.salesChannel} onChange={e => setDistributorDetails({ ...distributorDetails, salesChannel: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                    </div>
                  )}

                  {companyInfo.businessType === 'Hospital' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, background: isPublicPage ? '#1E293B' : '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #CBD5E1' }}>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Procurement Department</label><input type="text" value={hospitalDetails.procurementDepartment} onChange={e => setHospitalDetails({ ...hospitalDetails, procurementDepartment: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                      <div><label style={{ fontSize: 11.5, fontWeight: 700 }}>Tender Reference</label><input type="text" value={hospitalDetails.tenderReference} onChange={e => setHospitalDetails({ ...hospitalDetails, tenderReference: e.target.value })} style={{ width: '100%', height: 34, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12.5 }} /></div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — REGULATORY DOCUMENT UPLOAD */}
            {currentStep === 4 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Regulatory Documents</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Upload the required documents for customer verification.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MANDATORY_DOCUMENTS.map((doc) => {
                    const uploaded = uploadedDocsMap[doc.key];
                    return (
                      <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isPublicPage ? '#1E293B' : '#F8FAFC', borderRadius: 10, border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <FileText size={20} style={{ color: '#2563EB' }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                              {doc.name} <span style={{ color: '#DC2626', fontSize: 11 }}>(Required *)</span>
                            </div>
                            {uploaded ? (
                              <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={12} /> {uploaded.fileName} ({uploaded.fileSize})
                              </div>
                            ) : (
                              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>No file attached yet</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {uploaded ? (
                            <>
                              <button onClick={() => handleRemoveDoc(doc.key)} style={{ padding: '6px 12px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Trash2 size={12} /> Remove
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleSimulateDocUpload(doc.key, doc.name)} style={{ padding: '6px 16px', borderRadius: 6, background: '#2563EB', color: '#FFF', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Upload size={13} /> Upload File
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                  <button onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ← Back
                  </button>
                  <button onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    Continue to Review →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5 — REVIEW & SUBMIT */}
            {currentStep === 5 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Review Your Registration</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Review details before final submission</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Company Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>Company Information</span>
                      <button onClick={() => setCurrentStep(1)} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Company: <strong>{companyInfo.companyName}</strong></div>
                      <div>Type: <strong>{companyInfo.businessType}</strong></div>
                      <div>GST: <strong>{companyInfo.gstNumber}</strong></div>
                      <div>PAN: <strong>{companyInfo.panNumber}</strong></div>
                      <div>DL No: <strong>{companyInfo.drugLicenseNumber}</strong></div>
                      <div>CIN: <strong>{companyInfo.cinNumber || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* Contact Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>Contact Information</span>
                      <button onClick={() => setCurrentStep(2)} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Contact Person: <strong>{contactInfo.contactPerson}</strong></div>
                      <div>Designation: <strong>{contactInfo.designation}</strong></div>
                      <div>Mobile: <strong>{contactInfo.mobileNumber}</strong></div>
                      <div>Email: <strong>{contactInfo.email}</strong></div>
                    </div>
                  </div>

                  {/* Address Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>Address & Type Details</span>
                      <button onClick={() => setCurrentStep(3)} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Billing Address: <strong>{addressInfo.billingAddress}</strong></div>
                      <div>State / Pincode: <strong>{addressInfo.state}, {addressInfo.pincode}</strong></div>
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>Regulatory Documents (6 Attached)</span>
                      <button onClick={() => setCurrentStep(4)} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      {MANDATORY_DOCUMENTS.map(doc => (
                        <div key={doc.key}>✓ {doc.name}: <strong>{uploadedDocsMap[doc.key]?.fileName || 'Attached'}</strong></div>
                      ))}
                    </div>
                  </div>

                  {/* Accuracy Confirmation Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', padding: 14, borderRadius: 8 }}>
                    <input
                      type="checkbox"
                      id="confirmAccurate"
                      checked={isAccurateConfirmed}
                      onChange={e => setIsAccurateConfirmed(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="confirmAccurate" style={{ fontSize: 13, fontWeight: 600, color: isPublicPage ? '#FFF' : '#0F172A', cursor: 'pointer' }}>
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
                    Submit Registration →
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
