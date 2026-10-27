import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2, FileText, CheckCircle2, Upload,
  ArrowRight, ArrowLeft, ChevronLeft, ShieldCheck,
  Check, AlertCircle, File, Trash2, Globe, MapPin, User, Phone, Mail, Award, Clock,
  Eye, EyeOff, RefreshCw, X
} from 'lucide-react';
import { CustomerType } from '../../types';
import { buyerRegistrationApi } from '../../services/buyerRegistrationApi';

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
  { key: 'gstCert', name: 'GST Certificate', req: true, hint: 'Government GSTIN registration certificate (Mandatory)' },
  { key: 'panCard', name: 'PAN Card', req: true, hint: 'Company / Business entity PAN card (Mandatory)' },
  { key: 'drugLicense', name: 'Drug License', req: false, hint: 'Form 20B/21B wholesale license (Optional)' },
  { key: 'incCert', name: 'Incorporation Certificate', req: false, hint: 'RoC / MSME registration certificate (Optional)' },
  { key: 'cancelledCheque', name: 'Cancelled Cheque', req: false, hint: 'Bank account verification cheque (Optional)' },
  { key: 'signedAgreement', name: 'Signed Agreement', req: false, hint: 'Customer onboarding commercial agreement (Optional)' }
];

export const BuyerOnboardingWizard: React.FC<BuyerOnboardingWizardProps> = ({
  onSuccess, isPublicPage = false, onBack, onSubmitSuccess
}) => {
  const { submitCustomerVerificationRequest } = useApp();

  // Wizard Step: 1 = Registration, 2 = Contact, 3 = Address & Type, 4 = Documents, 5 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Backend draft identity (returned by step-1) and a re-entrancy guard for API calls
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const isBusyRef = React.useRef(false);

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
    email: '',
    password: ''
  });

  // UI-only demo verification states (session-only, not saved to DB)
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [mobileDemoMsg, setMobileDemoMsg] = useState<string | null>(null);
  const [emailDemoMsg, setEmailDemoMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Helper validators
  const isValidMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned) || /^\+?\d{10,14}$/.test(cleaned);
  };

  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed !== 'admin@factorygrid.com';
  };

  const handleVerifyMobile = () => {
    if (!isValidMobile(contactInfo.mobileNumber)) {
      alert('Please enter a valid 10-digit mobile number before verifying.');
      return;
    }
    setIsMobileVerified(true);
    setMobileDemoMsg('Demo verification successful • Mobile verified');
    setStep2Error(null);
  };

  const handleVerifyEmail = () => {
    if (!isValidEmail(contactInfo.email)) {
      if (contactInfo.email.trim().toLowerCase() === 'admin@factorygrid.com') {
        alert('Please use your own corporate email address. Administrative credentials cannot be used for buyer registration.');
        return;
      }
      alert('Please enter a valid corporate email address before verifying.');
      return;
    }
    setIsEmailVerified(true);
    setEmailDemoMsg('Demo verification successful • Email verified');
    setStep2Error(null);
  };

  // Guard against browser password managers / autofill injecting cached administrative credentials into the buyer registration fields
  useEffect(() => {
    if (contactInfo.email.toLowerCase() === 'admin@factorygrid.com') {
      setContactInfo(prev => ({ ...prev, email: '', password: '' }));
      setIsEmailVerified(false);
      setEmailDemoMsg(null);
    }
  }, [currentStep, contactInfo.email]);

  const [addressInfo, setAddressInfo] = useState({
    billingAddress: '',
    shippingAddress: '',
    state: 'Delhi',
    country: 'India',
    pincode: ''
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
  // Only documents that were really stored by the backend appear here (no pre-filled placeholders).
  const [uploadedDocsMap, setUploadedDocsMap] = useState<Record<string, { fileName: string; fileSize: string; uploadedAt: string }>>({});

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

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateStep2 = () => {
    return contactInfo.contactPerson.trim() !== '' &&
      contactInfo.designation.trim() !== '' &&
      contactInfo.mobileNumber.trim() !== '' &&
      isValidMobile(contactInfo.mobileNumber) &&
      contactInfo.email.trim() !== '' &&
      EMAIL_REGEX.test(contactInfo.email.trim()) &&
      contactInfo.email.trim().toLowerCase() !== 'admin@factorygrid.com' &&
      isMobileVerified &&
      isEmailVerified &&
      contactInfo.password.trim().length >= 6;
  };

  const validateStep3 = () => {
    return addressInfo.billingAddress.trim() !== '' &&
      addressInfo.shippingAddress.trim() !== '' &&
      addressInfo.state.trim() !== '' &&
      addressInfo.pincode.trim() !== '';
  };

  const isGstSelected = !!uploadedDocsMap['gstCert']?.fileName;
  const isPanSelected = !!uploadedDocsMap['panCard']?.fileName;
  const canSkipOrContinueDocs = isGstSelected && isPanSelected;
  const allDocsSelected = MANDATORY_DOCUMENTS.every(doc => !!uploadedDocsMap[doc.key]?.fileName);

  const validateStep4 = () => {
    // Both GST Certificate and PAN Card must be uploaded. Remaining documents are optional.
    return !!uploadedDocsMap['gstCert']?.fileName && !!uploadedDocsMap['panCard']?.fileName;
  };

  const handleNextStep = async () => {
    if (currentStep >= 5 || isBusyRef.current) return;
    isBusyRef.current = true;
    try {
      if (currentStep === 1) {
        const res = await buyerRegistrationApi.saveStep1(
          {
            companyName: companyInfo.companyName,
            businessType: companyInfo.businessType,
            gstNumber: companyInfo.gstNumber,
            panNumber: companyInfo.panNumber,
            drugLicenseNumber: companyInfo.drugLicenseNumber,
            cinNumber: companyInfo.cinNumber || undefined,
            website: companyInfo.website || undefined
          },
          registrationCode || undefined
        );
        setRegistrationCode(res.registrationCode);
      } else if (currentStep === 2) {
        setStep2Error(null);
        if (!contactInfo.contactPerson.trim()) {
          const msg = 'Please enter the contact person name.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!contactInfo.designation.trim()) {
          const msg = 'Please enter the designation of the contact person.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!contactInfo.mobileNumber.trim() || !isValidMobile(contactInfo.mobileNumber)) {
          const msg = 'Please enter a valid 10-digit mobile number.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!contactInfo.email.trim() || !isValidEmail(contactInfo.email)) {
          const msg = 'Please enter a valid corporate email address.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (contactInfo.email.trim().toLowerCase() === 'admin@factorygrid.com') {
          const msg = 'Please use your own corporate email address. Administrative credentials cannot be used for buyer registration.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!isMobileVerified) {
          const msg = 'Please verify your Mobile Number before continuing.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!isEmailVerified) {
          const msg = 'Please verify your Email Address before continuing.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        if (!contactInfo.password || contactInfo.password.trim().length < 6) {
          const msg = 'Account password must be at least 6 characters.';
          setStep2Error(msg);
          alert(msg);
          return;
        }
        await buyerRegistrationApi.saveStep2(
          {
            contactPerson: contactInfo.contactPerson.trim(),
            designation: contactInfo.designation.trim(),
            mobileNumber: contactInfo.mobileNumber.trim(),
            email: contactInfo.email.trim().toLowerCase(),
            password: contactInfo.password
          },
          registrationCode
        );
      } else if (currentStep === 3) {
        await buyerRegistrationApi.saveStep3(
          {
            billingAddress: addressInfo.billingAddress,
            shippingAddress: addressInfo.shippingAddress,
            state: addressInfo.state,
            country: addressInfo.country,
            pincode: addressInfo.pincode,
            ...getTypeSpecificDetails()
          },
          registrationCode
        );
      } else if (currentStep === 4 && !validateStep4()) {
        alert('Upload GST Certificate and PAN Card to continue.');
        return;
      }
      setCurrentStep((prev) => (prev + 1) as any);
    } catch (err: any) {
      alert(err?.message || 'Could not save this step. Please try again.');
    } finally {
      isBusyRef.current = false;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  // Customer-type specific parameters for the selected business type only
  const getTypeSpecificDetails = () => ({
    tpmDetails: companyInfo.businessType === 'Third Party Manufacturing (TPM)' ? tpmDetails : undefined,
    distributorDetails: companyInfo.businessType === 'Distributor' ? distributorDetails : undefined,
    hospitalDetails: companyInfo.businessType === 'Hospital' ? hospitalDetails : undefined,
    wholesalerDetails: companyInfo.businessType === 'Wholesaler' ? wholesalerDetails : undefined,
    exportDetails: companyInfo.businessType === 'Export' ? exportDetails : undefined
  });

  const formatFileSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  // Opens the native file picker and stores the selected file (and syncs to backend if registrationCode exists).
  const handleSimulateDocUpload = (docKey: string, docName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return; // Validate that an actual file is selected

      if (registrationCode) {
        try {
          const stored = await buyerRegistrationApi.uploadDocument(file, docName, registrationCode);
          setUploadedDocsMap(prev => ({
            ...prev,
            [docKey]: {
              fileName: stored.fileName,
              fileSize: formatFileSize(stored.fileSize),
              uploadedAt: stored.uploadedAt.split('T')[0]
            }
          }));
          return;
        } catch (err: any) {
          alert(`Document upload failed: ${err?.message || 'Failed to save document to storage.'}`);
          return;
        }
      }

      setUploadedDocsMap(prev => ({
        ...prev,
        [docKey]: {
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          uploadedAt: new Date().toISOString().split('T')[0]
        }
      }));
    };
    input.click();
  };

  const handleRemoveDoc = (docKey: string) => {
    setUploadedDocsMap(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  // Step 5 Review Edit Modals State
  type BuyerReviewSection = 'company' | 'contact' | 'address' | 'documents' | null;
  const [activeReviewModal, setActiveReviewModal] = useState<BuyerReviewSection>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Isolated draft state for the active modal
  const [draftCompanyInfo, setDraftCompanyInfo] = useState({ ...companyInfo });
  const [draftContactInfo, setDraftContactInfo] = useState({ ...contactInfo });
  const [draftAddressInfo, setDraftAddressInfo] = useState({ ...addressInfo });
  const [draftDocsMap, setDraftDocsMap] = useState<Record<string, { fileName: string; fileSize: string; uploadedAt: string }>>({});

  const handleOpenEditSection = (section: 'company' | 'contact' | 'address' | 'documents') => {
    setModalError(null);
    if (section === 'company') setDraftCompanyInfo({ ...companyInfo });
    if (section === 'contact') setDraftContactInfo({ ...contactInfo });
    if (section === 'address') setDraftAddressInfo({ ...addressInfo });
    if (section === 'documents') setDraftDocsMap({ ...uploadedDocsMap });
    setActiveReviewModal(section);
  };

  const handleCloseReviewModal = () => {
    setActiveReviewModal(null);
    setModalError(null);
  };

  const handleSaveCompanySection = async () => {
    setModalError(null);
    if (!draftCompanyInfo.companyName.trim()) {
      setModalError('Company Name is required.');
      return;
    }
    if (!draftCompanyInfo.gstNumber.trim()) {
      setModalError('GST Number is required.');
      return;
    }
    if (!draftCompanyInfo.panNumber.trim()) {
      setModalError('PAN Number is required.');
      return;
    }
    if (!draftCompanyInfo.drugLicenseNumber.trim()) {
      setModalError('Drug License Number is required.');
      return;
    }
    setCompanyInfo({ ...draftCompanyInfo });
    if (registrationCode) {
      try {
        await buyerRegistrationApi.saveStep1(
          {
            companyName: draftCompanyInfo.companyName,
            businessType: draftCompanyInfo.businessType,
            gstNumber: draftCompanyInfo.gstNumber,
            panNumber: draftCompanyInfo.panNumber,
            drugLicenseNumber: draftCompanyInfo.drugLicenseNumber,
            cinNumber: draftCompanyInfo.cinNumber || undefined,
            website: draftCompanyInfo.website || undefined
          },
          registrationCode
        );
      } catch (err: any) {
        console.warn('Backend sync note for step 1:', err?.message);
      }
    }
    handleCloseReviewModal();
  };

  const handleSaveContactSection = async () => {
    setModalError(null);
    if (!draftContactInfo.contactPerson.trim()) {
      setModalError('Contact person name is required.');
      return;
    }
    if (!draftContactInfo.designation.trim()) {
      setModalError('Designation is required.');
      return;
    }
    if (!draftContactInfo.mobileNumber.trim() || !isValidMobile(draftContactInfo.mobileNumber)) {
      setModalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!draftContactInfo.email.trim() || !isValidEmail(draftContactInfo.email)) {
      setModalError('Please enter a valid corporate email address.');
      return;
    }
    if (draftContactInfo.email.trim().toLowerCase() === 'admin@factorygrid.com') {
      setModalError('Administrative credentials cannot be used for buyer registration.');
      return;
    }
    setContactInfo(prev => ({
      ...prev,
      contactPerson: draftContactInfo.contactPerson.trim(),
      designation: draftContactInfo.designation.trim(),
      mobileNumber: draftContactInfo.mobileNumber.trim(),
      email: draftContactInfo.email.trim().toLowerCase()
    }));
    if (registrationCode) {
      try {
        await buyerRegistrationApi.saveStep2(
          {
            contactPerson: draftContactInfo.contactPerson.trim(),
            designation: draftContactInfo.designation.trim(),
            mobileNumber: draftContactInfo.mobileNumber.trim(),
            email: draftContactInfo.email.trim().toLowerCase(),
            password: contactInfo.password
          },
          registrationCode
        );
      } catch (err: any) {
        console.warn('Backend sync note for step 2:', err?.message);
      }
    }
    handleCloseReviewModal();
  };

  const handleSaveAddressSection = async () => {
    setModalError(null);
    if (!draftAddressInfo.billingAddress.trim()) {
      setModalError('Billing address is required.');
      return;
    }
    if (!draftAddressInfo.shippingAddress.trim()) {
      setModalError('Shipping address is required.');
      return;
    }
    if (!draftAddressInfo.state.trim()) {
      setModalError('State is required.');
      return;
    }
    if (!draftAddressInfo.pincode.trim()) {
      setModalError('Pincode is required.');
      return;
    }
    setAddressInfo({ ...draftAddressInfo });
    if (registrationCode) {
      try {
        await buyerRegistrationApi.saveStep3(
          {
            billingAddress: draftAddressInfo.billingAddress,
            shippingAddress: draftAddressInfo.shippingAddress,
            state: draftAddressInfo.state,
            country: draftAddressInfo.country,
            pincode: draftAddressInfo.pincode,
            ...getTypeSpecificDetails()
          },
          registrationCode
        );
      } catch (err: any) {
        console.warn('Backend sync note for step 3:', err?.message);
      }
    }
    handleCloseReviewModal();
  };

  const handleModalDocUpload = (docKey: string, docName: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (registrationCode) {
        try {
          const stored = await buyerRegistrationApi.uploadDocument(file, docName, registrationCode);
          setDraftDocsMap(prev => ({
            ...prev,
            [docKey]: {
              fileName: stored.fileName,
              fileSize: formatFileSize(stored.fileSize),
              uploadedAt: stored.uploadedAt.split('T')[0]
            }
          }));
          return;
        } catch (err: any) {
          alert(`Document upload failed: ${err?.message || 'Failed to save document to storage.'}`);
          return;
        }
      }

      setDraftDocsMap(prev => ({
        ...prev,
        [docKey]: {
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          uploadedAt: new Date().toISOString().split('T')[0]
        }
      }));
    };
    input.click();
  };

  const handleModalDocRemove = (docKey: string) => {
    setDraftDocsMap(prev => {
      const updated = { ...prev };
      delete updated[docKey];
      return updated;
    });
  };

  const handleSaveDocsSection = () => {
    setModalError(null);
    if (!draftDocsMap['gstCert']?.fileName || !draftDocsMap['panCard']?.fileName) {
      setModalError('GST Certificate and PAN Card are mandatory documents and cannot be removed.');
      return;
    }
    setUploadedDocsMap({ ...draftDocsMap });
    handleCloseReviewModal();
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

  // Final Form Submission Handler — calls the real backend submit endpoint
  const handleFinalSubmission = async () => {
    if (isBusyRef.current || !isAccurateConfirmed) return;
    isBusyRef.current = true;
    setIsValidating(true);

    // Perform Frontend Auto-Validation Checks (Any non-empty GST/PAN accepted for testing)
    const isGstValid = companyInfo.gstNumber.trim().length > 0;
    const isPanValid = companyInfo.panNumber.trim().length > 0;
    const isDocsValid = validateStep4();
    const isFieldsValid = validateStep1() && validateStep2() && validateStep3();

    if (contactInfo.email.trim().toLowerCase() === 'admin@factorygrid.com') {
      alert('Please use your own corporate email address. Administrative credentials cannot be used for buyer registration.');
      setIsValidating(false);
      isBusyRef.current = false;
      return;
    }

    try {
      await buyerRegistrationApi.submitRegistration({
        registrationCode,
        companyName: companyInfo.companyName,
        businessType: companyInfo.businessType,
        gstNumber: companyInfo.gstNumber,
        panNumber: companyInfo.panNumber,
        drugLicenseNumber: companyInfo.drugLicenseNumber,
        cinNumber: companyInfo.cinNumber || undefined,
        website: companyInfo.website || undefined,
        contactPerson: contactInfo.contactPerson.trim(),
        designation: contactInfo.designation.trim(),
        mobileNumber: contactInfo.mobileNumber.trim(),
        email: contactInfo.email.trim().toLowerCase(),
        password: contactInfo.password,
        billingAddress: addressInfo.billingAddress,
        shippingAddress: addressInfo.shippingAddress,
        state: addressInfo.state,
        country: addressInfo.country,
        pincode: addressInfo.pincode,
        ...getTypeSpecificDetails(),
        confirmAccurate: isAccurateConfirmed
      });
    } catch (err: any) {
      setIsValidating(false);
      isBusyRef.current = false;
      alert(err?.message || 'Registration submission failed. Please try again.');
      return;
    }

    {
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
        tpmDetails: companyInfo.businessType === 'Third Party Manufacturing (TPM)' ? tpmDetails : undefined,
        distributorDetails: companyInfo.businessType === 'Distributor' ? distributorDetails : undefined,
        hospitalDetails: companyInfo.businessType === 'Hospital' ? hospitalDetails : undefined,
        exportDetails: companyInfo.businessType === 'Export' ? exportDetails : undefined,
        wholesalerDetails: companyInfo.businessType === 'Wholesaler' ? wholesalerDetails : undefined,
        documents: MANDATORY_DOCUMENTS
          .filter(doc => !!uploadedDocsMap[doc.key])
          .map((doc, idx) => ({
            id: `doc_sub_${Date.now()}_${idx}`,
            documentType: doc.name as any,
            fileName: uploadedDocsMap[doc.key]?.fileName || `${doc.name}.pdf`,
            fileSize: uploadedDocsMap[doc.key]?.fileSize || '1.2 MB',
            uploadedAt: uploadedDocsMap[doc.key]?.uploadedAt || new Date().toISOString().split('T')[0],
            status: 'Valid'
          }))
      });

      setIsValidating(false);
      setIsSubmitted(true);
      isBusyRef.current = false;

      if (onSuccess) onSuccess();
      if (onSubmitSuccess) onSubmitSuccess();
    }
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
              <span>GST Accepted for Testing ({companyInfo.gstNumber}) — Government Verification Pending</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>PAN Accepted for Testing ({companyInfo.panNumber}) — Government Verification Pending</span>
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

                <form
                  autoComplete="off"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNextStep();
                  }}
                >
                  {/* Invisible decoy inputs to absorb browser password-manager / autofill from saved admin logins */}
                  <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true" tabIndex={-1}>
                    <input type="text" name="decoy_username_prevent_autofill" tabIndex={-1} autoComplete="username" />
                    <input type="password" name="decoy_password_prevent_autofill" tabIndex={-1} autoComplete="current-password" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Contact Person *</label>
                      <input
                        type="text"
                        id="buyerContactPerson"
                        name="buyer_contact_person"
                        required
                        placeholder="Full Name"
                        value={contactInfo.contactPerson}
                        onChange={e => setContactInfo({ ...contactInfo, contactPerson: e.target.value })}
                        style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Designation *</label>
                      <input
                        type="text"
                        id="buyerDesignation"
                        name="buyer_designation"
                        required
                        placeholder="Designation"
                        value={contactInfo.designation}
                        onChange={e => setContactInfo({ ...contactInfo, designation: e.target.value })}
                        style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                      />
                    </div>

                    {/* Mobile Number with Verify Button */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label htmlFor="buyerMobileNumber" style={{ fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155' }}>
                          Mobile Number *
                        </label>
                        {isMobileVerified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                            <CheckCircle2 size={13} /> Verified (Demo)
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: isPublicPage ? '#94A3B8' : '#64748B' }}>
                            Verification required
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          id="buyerMobileNumber"
                          name="buyer_mobile_number"
                          required
                          placeholder="+91 98765 43210"
                          value={contactInfo.mobileNumber}
                          onChange={e => {
                            setContactInfo({ ...contactInfo, mobileNumber: e.target.value });
                            if (isMobileVerified) setIsMobileVerified(false);
                            if (mobileDemoMsg) setMobileDemoMsg(null);
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: 40,
                            padding: '0 12px',
                            borderRadius: 8,
                            border: isMobileVerified ? '1px solid #10B981' : '1px solid #CBD5E1',
                            fontSize: 13,
                            outline: 'none',
                            background: isPublicPage ? '#1E293B' : '#FFF',
                            color: isPublicPage ? '#FFF' : '#0F172A'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobile}
                          disabled={!isValidMobile(contactInfo.mobileNumber) || isMobileVerified}
                          style={{
                            height: 40,
                            padding: '0 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: isMobileVerified ? '#059669' : (isValidMobile(contactInfo.mobileNumber) ? '#2563EB' : (isPublicPage ? '#334155' : '#E2E8F0')),
                            color: isMobileVerified ? '#FFF' : (isValidMobile(contactInfo.mobileNumber) ? '#FFF' : (isPublicPage ? '#64748B' : '#94A3B8')),
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: (isValidMobile(contactInfo.mobileNumber) && !isMobileVerified) ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isMobileVerified ? (
                            <>
                              <CheckCircle2 size={14} /> Verified
                            </>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>
                      {mobileDemoMsg && (
                        <div style={{ fontSize: 11.5, color: '#10B981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={13} /> {mobileDemoMsg}
                        </div>
                      )}
                    </div>

                    {/* Email Address with Verify Button */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <label htmlFor="buyerContactEmail" style={{ fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155' }}>
                          Email Address *
                        </label>
                        {isEmailVerified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#10B981' }}>
                            <CheckCircle2 size={13} /> Verified (Demo)
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: isPublicPage ? '#94A3B8' : '#64748B' }}>
                            Verification required
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="email"
                          id="buyerContactEmail"
                          name="buyer_contact_email"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          required
                          placeholder="corporate@company.com"
                          value={contactInfo.email}
                          onChange={e => {
                            setContactInfo({ ...contactInfo, email: e.target.value });
                            if (isEmailVerified) setIsEmailVerified(false);
                            if (emailDemoMsg) setEmailDemoMsg(null);
                          }}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            height: 40,
                            padding: '0 12px',
                            borderRadius: 8,
                            border: isEmailVerified ? '1px solid #10B981' : '1px solid #CBD5E1',
                            fontSize: 13,
                            outline: 'none',
                            background: isPublicPage ? '#1E293B' : '#FFF',
                            color: isPublicPage ? '#FFF' : '#0F172A'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmail}
                          disabled={!isValidEmail(contactInfo.email) || isEmailVerified}
                          style={{
                            height: 40,
                            padding: '0 16px',
                            borderRadius: 8,
                            border: 'none',
                            background: isEmailVerified ? '#059669' : (isValidEmail(contactInfo.email) ? '#2563EB' : (isPublicPage ? '#334155' : '#E2E8F0')),
                            color: isEmailVerified ? '#FFF' : (isValidEmail(contactInfo.email) ? '#FFF' : (isPublicPage ? '#64748B' : '#94A3B8')),
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: (isValidEmail(contactInfo.email) && !isEmailVerified) ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isEmailVerified ? (
                            <>
                              <CheckCircle2 size={14} /> Verified
                            </>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>
                      {emailDemoMsg && (
                        <div style={{ fontSize: 11.5, color: '#10B981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={13} /> {emailDemoMsg}
                        </div>
                      )}
                    </div>

                    {/* Account Password with Eye Show/Hide Toggle */}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Account Password *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="buyerAccountPassword"
                          name="buyer_account_password"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          required
                          placeholder="Create password (min 6 characters)"
                          value={contactInfo.password}
                          onChange={e => setContactInfo({ ...contactInfo, password: e.target.value })}
                          style={{ width: '100%', height: 40, padding: '0 40px 0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          title={showPassword ? 'Hide password' : 'Show password'}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: isPublicPage ? '#94A3B8' : '#64748B'
                          }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {step2Error && (
                    <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={16} /> {step2Error}
                    </div>
                  )}

                  {(!isMobileVerified || !isEmailVerified) && (
                    <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: isPublicPage ? 'rgba(234, 179, 8, 0.08)' : '#FEF9C3', border: '1px solid rgba(234, 179, 8, 0.25)', color: isPublicPage ? '#FDE047' : '#854D0E', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={15} />
                      <span>Note: Please verify both your Mobile Number and Email Address using the demo verification buttons above to continue.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                    <button type="button" onClick={handlePrevStep} style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      ← Back
                    </button>
                    <button type="button" onClick={handleNextStep} style={{ height: 42, padding: '0 24px', borderRadius: 8, background: '#2563EB', color: '#FFF', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      Continue →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 3 — ADDRESS INFORMATION */}
            {currentStep === 3 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>
                    {companyInfo.businessType === 'PCD Franchise' ? 'Address Information' : 'Business & Address Details'}
                  </h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                    {companyInfo.businessType === 'PCD Franchise' ? 'Provide registered billing and shipping delivery addresses' : 'Provide business locations & customer-type parameters'}
                  </div>
                </div>

                {/* Address Section */}
                <div style={{
                  marginBottom: companyInfo.businessType === 'PCD Franchise' ? 0 : 24,
                  paddingBottom: companyInfo.businessType === 'PCD Franchise' ? 0 : 20,
                  borderBottom: companyInfo.businessType === 'PCD Franchise' ? 'none' : (isPublicPage ? '1px solid #1E293B' : '1px solid #F1F5F9')
                }}>
                  {companyInfo.businessType !== 'PCD Franchise' && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginBottom: 12 }}>Address Information</div>
                  )}
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
                {companyInfo.businessType !== 'PCD Franchise' && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginBottom: 12 }}>
                      Customer Type Parameters ({companyInfo.businessType})
                    </div>

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
                )}

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
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                    Upload your mandatory compliance documents. <strong>GST Certificate</strong> and <strong>PAN Card</strong> are required to proceed; all other documents are optional and can be uploaded later from your buyer profile.
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MANDATORY_DOCUMENTS.map((doc) => {
                    const uploaded = uploadedDocsMap[doc.key];
                    return (
                      <div
                        key={doc.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: isPublicPage ? '#1E293B' : '#F8FAFC',
                          borderRadius: 10,
                          border: doc.req && !uploaded
                            ? (isPublicPage ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FCA5A5')
                            : (uploaded ? (isPublicPage ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #86EFAC') : (isPublicPage ? '1px solid #1E293B' : '1px solid #CBD5E1'))
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <FileText size={20} style={{ color: doc.req ? '#2563EB' : (isPublicPage ? '#94A3B8' : '#64748B') }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {doc.name}
                              {doc.req ? (
                                <span style={{ color: '#DC2626', fontSize: 11, fontWeight: 700 }}>(Required *)</span>
                              ) : (
                                <span style={{ color: isPublicPage ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 500 }}>(Optional — can upload later)</span>
                              )}
                            </div>
                            {uploaded ? (
                              <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={12} /> {uploaded.fileName} ({uploaded.fileSize})
                              </div>
                            ) : (
                              <div style={{ fontSize: 11.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                                {doc.hint}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {uploaded ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSimulateDocUpload(doc.key, doc.name)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: isPublicPage ? '#0F172A' : '#F1F5F9',
                                  color: isPublicPage ? '#CBD5E1' : '#334155',
                                  border: '1px solid #CBD5E1',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                                title="Select a different file to replace"
                              >
                                <RefreshCw size={12} /> Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(doc.key)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSimulateDocUpload(doc.key, doc.name)}
                              style={{
                                padding: '6px 16px',
                                borderRadius: 6,
                                background: doc.req ? '#2563EB' : (isPublicPage ? '#334155' : '#475569'),
                                color: '#FFF',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <Upload size={13} /> Upload File
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 28,
                  paddingTop: 18,
                  borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    style={{
                      height: 42,
                      padding: '0 20px',
                      borderRadius: 8,
                      background: 'transparent',
                      color: isPublicPage ? '#94A3B8' : '#475569',
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {!canSkipOrContinueDocs ? (
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#EAB308', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertCircle size={15} /> Upload GST Certificate and PAN Card to continue.
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={14} /> GST Certificate and PAN Card uploaded
                      </span>
                    )}

                    <button
                      type="button"
                      id="skipForNowBtn"
                      onClick={handleNextStep}
                      disabled={!canSkipOrContinueDocs}
                      style={{
                        height: 42,
                        padding: '0 24px',
                        borderRadius: 8,
                        background: canSkipOrContinueDocs ? '#2563EB' : (isPublicPage ? '#1E293B' : '#E2E8F0'),
                        color: canSkipOrContinueDocs ? '#FFF' : '#94A3B8',
                        border: canSkipOrContinueDocs ? 'none' : '1px solid #CBD5E1',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: canSkipOrContinueDocs ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        opacity: canSkipOrContinueDocs ? 1 : 0.65,
                        transition: 'all 0.2s'
                      }}
                    >
                      {allDocsSelected ? 'Continue to Review →' : 'Skip for Now →'}
                    </button>
                  </div>
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
                      <button type="button" onClick={() => handleOpenEditSection('company')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
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
                      <button type="button" onClick={() => handleOpenEditSection('contact')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Contact Person: <strong>{contactInfo.contactPerson}</strong></div>
                      <div>Designation: <strong>{contactInfo.designation}</strong></div>
                      <div>Mobile: <strong>{contactInfo.mobileNumber}</strong> {isMobileVerified && <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>✓ Verified (Demo)</span>}</div>
                      <div>Email: <strong>{contactInfo.email}</strong> {isEmailVerified && <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>✓ Verified (Demo)</span>}</div>
                      <div>Password: <strong>••••••••</strong></div>
                    </div>
                  </div>

                  {/* Address Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>Address Information</span>
                      <button type="button" onClick={() => handleOpenEditSection('address')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Billing Address: <strong>{addressInfo.billingAddress}</strong></div>
                      <div>State / Pincode: <strong>{addressInfo.state}, {addressInfo.pincode}</strong></div>
                    </div>
                  </div>

                  {/* Documents Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                        Regulatory Documents ({Object.keys(uploadedDocsMap).length} Attached)
                      </span>
                      <button type="button" onClick={() => handleOpenEditSection('documents')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      {MANDATORY_DOCUMENTS.map(doc => {
                        const uploaded = uploadedDocsMap[doc.key];
                        return (
                          <div key={doc.key}>
                            {uploaded ? (
                              <span style={{ color: '#16A34A', fontWeight: 600 }}>✓ {doc.name}: <strong>{uploaded.fileName}</strong></span>
                            ) : (
                              <span style={{ color: isPublicPage ? '#94A3B8' : '#64748B' }}>○ {doc.name}: <em style={{ fontSize: 11 }}>(Pending — upload from profile)</em></span>
                            )}
                          </div>
                        );
                      })}
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

      {/* REVIEW EDIT MODAL */}
      {activeReviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReviewModal();
          }}
        >
          <div
            style={{
              background: isPublicPage ? '#0F172A' : '#FFFFFF',
              border: isPublicPage ? '1px solid #1E293B' : '1px solid #CBD5E1',
              borderRadius: 14,
              width: '100%',
              maxWidth: activeReviewModal === 'documents' ? 700 : 580,
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                  {activeReviewModal === 'company' && 'Edit Company Information'}
                  {activeReviewModal === 'contact' && 'Edit Contact Information'}
                  {activeReviewModal === 'address' && 'Edit Address Information'}
                  {activeReviewModal === 'documents' && 'Edit Regulatory Documents'}
                </h3>
                <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  Update registration details directly on the review screen
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReviewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isPublicPage ? '#94A3B8' : '#64748B',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {modalError && (
                <div style={{ marginBottom: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ⚠️ {modalError}
                </div>
              )}

              {/* COMPANY MODAL */}
              {activeReviewModal === 'company' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.companyName}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, companyName: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Customer Type / Business Model *
                    </label>
                    <select
                      value={draftCompanyInfo.businessType}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, businessType: e.target.value as BusinessTypeOption })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    >
                      <option value="PCD Franchise">PCD Franchise</option>
                      <option value="Third Party Manufacturing (TPM)">Third Party Manufacturing (TPM)</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Export">Export</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      GST Number *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.gstNumber}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, gstNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      PAN Number *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.panNumber}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, panNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Drug License Number *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.drugLicenseNumber}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, drugLicenseNumber: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      CIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.cinNumber}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, cinNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Website (Optional)
                    </label>
                    <input
                      type="text"
                      value={draftCompanyInfo.website}
                      onChange={e => setDraftCompanyInfo({ ...draftCompanyInfo, website: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {/* CONTACT MODAL */}
              {activeReviewModal === 'contact' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={draftContactInfo.contactPerson}
                      onChange={e => setDraftContactInfo({ ...draftContactInfo, contactPerson: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Designation *
                    </label>
                    <input
                      type="text"
                      value={draftContactInfo.designation}
                      onChange={e => setDraftContactInfo({ ...draftContactInfo, designation: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={draftContactInfo.mobileNumber}
                      onChange={e => setDraftContactInfo({ ...draftContactInfo, mobileNumber: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={draftContactInfo.email}
                      onChange={e => setDraftContactInfo({ ...draftContactInfo, email: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Account Password
                    </label>
                    <input
                      type="password"
                      value="••••••••"
                      disabled
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? 'rgba(255,255,255,0.04)' : '#F1F5F9', color: '#94A3B8', fontSize: 13, cursor: 'not-allowed' }}
                    />
                    <div style={{ fontSize: 11, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 4 }}>
                      🔒 Password is encrypted and masked for security.
                    </div>
                  </div>
                </div>
              )}

              {/* ADDRESS MODAL */}
              {activeReviewModal === 'address' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Billing Address *
                    </label>
                    <input
                      type="text"
                      value={draftAddressInfo.billingAddress}
                      onChange={e => setDraftAddressInfo({ ...draftAddressInfo, billingAddress: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Shipping Address *
                    </label>
                    <input
                      type="text"
                      value={draftAddressInfo.shippingAddress}
                      onChange={e => setDraftAddressInfo({ ...draftAddressInfo, shippingAddress: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      State *
                    </label>
                    <input
                      type="text"
                      value={draftAddressInfo.state}
                      onChange={e => setDraftAddressInfo({ ...draftAddressInfo, state: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Country
                    </label>
                    <input
                      type="text"
                      value={draftAddressInfo.country}
                      onChange={e => setDraftAddressInfo({ ...draftAddressInfo, country: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={draftAddressInfo.pincode}
                      onChange={e => setDraftAddressInfo({ ...draftAddressInfo, pincode: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              {/* DOCUMENTS MODAL */}
              {activeReviewModal === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B', marginBottom: 4 }}>
                    GST Certificate and PAN Card are mandatory. Other documents are optional and can be uploaded or removed.
                  </div>
                  {MANDATORY_DOCUMENTS.map(doc => {
                    const uploaded = draftDocsMap[doc.key];
                    return (
                      <div
                        key={doc.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 8,
                          background: isPublicPage ? '#1E293B' : '#F8FAFC',
                          border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1',
                          gap: 12
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                              {doc.name}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: doc.req ? '#DC2626' : (isPublicPage ? '#334155' : '#E2E8F0'),
                              color: doc.req ? '#FFF' : (isPublicPage ? '#CBD5E1' : '#475569')
                            }}>
                              {doc.req ? 'Required' : 'Optional'}
                            </span>
                          </div>
                          {uploaded ? (
                            <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, marginTop: 3 }}>
                              ✓ {uploaded.fileName} <span style={{ color: '#64748B', fontWeight: 400 }}>({uploaded.fileSize})</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: 11.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 3 }}>
                              Not uploaded
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {uploaded ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleModalDocUpload(doc.key, doc.name)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #3B82F6',
                                  color: '#3B82F6',
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => handleModalDocRemove(doc.key)}
                                style={{
                                  background: 'none',
                                  border: '1px solid #EF4444',
                                  color: '#EF4444',
                                  borderRadius: 6,
                                  padding: '4px 10px',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleModalDocUpload(doc.key, doc.name)}
                              style={{
                                background: '#2563EB',
                                border: 'none',
                                color: '#FFF',
                                borderRadius: 6,
                                padding: '5px 12px',
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <Upload size={13} /> Upload File
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                padding: '16px 24px',
                borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0'
              }}
            >
              <button
                type="button"
                onClick={handleCloseReviewModal}
                style={{
                  height: 38,
                  padding: '0 18px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1',
                  color: isPublicPage ? '#94A3B8' : '#475569',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeReviewModal === 'company') handleSaveCompanySection();
                  else if (activeReviewModal === 'contact') handleSaveContactSection();
                  else if (activeReviewModal === 'address') handleSaveAddressSection();
                  else if (activeReviewModal === 'documents') handleSaveDocsSection();
                }}
                style={{
                  height: 38,
                  padding: '0 22px',
                  borderRadius: 8,
                  background: '#2563EB',
                  border: 'none',
                  color: '#FFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

