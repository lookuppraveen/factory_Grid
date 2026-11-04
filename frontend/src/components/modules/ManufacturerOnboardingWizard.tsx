import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory, FileText, CheckCircle2, Upload,
  Search, Calendar, Building2, Package, Clock, Plus, Trash2,
  Layers, ChevronRight, Check, X, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import {
  manufacturerRegistrationApi,
  CatalogProductItem,
  CategoryHierarchyItem,
  CategoryTreeCategory,
} from '../../services/manufacturerRegistrationApi';
import { adminVerificationApi } from '../../services/adminVerificationApi';

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
  documentNumber?: string;
  fileSize?: number;
  uploadedAt?: string;
}

/** Complete original statutory certifications & compliance documents list for manufacturer onboarding */
export const ORIGINAL_MANUFACTURER_DOCUMENTS = [
  { key: 'mfgLicense', name: 'Manufacturing License', isMandatory: true },
  { key: 'gmpCert', name: 'GMP Certificate', isMandatory: true },
  { key: 'whoGmpCert', name: 'WHO-GMP Certificate', isMandatory: true },
  { key: 'isoCert', name: 'ISO Certification', isMandatory: true },
  { key: 'pollutionCert', name: 'Pollution Certificate', isMandatory: true },
  { key: 'factoryReg', name: 'Factory Registration', isMandatory: false },
] as const;

const MANDATORY_CERTIFICATIONS = ORIGINAL_MANUFACTURER_DOCUMENTS;

/** 28 States and 8 Union Territories in India for state selection */
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

/** The 6 canonical manufacturing categories supported by FactoryGrid. */
export const SUPPORTED_MANUFACTURING_CATEGORIES = [
  { id: 'cat-tablets', name: 'Tablets', code: 'CAT-TAB', description: 'Oral Solid Dosage — Tablets, Coated & Effervescent' },
  { id: 'cat-capsules', name: 'Capsules', code: 'CAT-CAP', description: 'Hard Gelatin & Softgel Capsules' },
  { id: 'cat-injectables', name: 'Injectables', code: 'CAT-INJ', description: 'Sterile Vials, Ampoules & Lyophilized Parenterals' },
  { id: 'cat-syrups', name: 'Syrups & Oral Liquids', code: 'CAT-SYR', description: 'Liquid Orals, Suspensions & Pediatric Drops' },
  { id: 'cat-ointments', name: 'Ointments & Creams', code: 'CAT-ONT', description: 'Topical Creams, Gels & Medicated Ointments' },
  { id: 'cat-nutraceuticals', name: 'Nutraceuticals', code: 'CAT-NUT', description: 'Dietary Supplements, Herbal Formulations & Vitamins' },
];

export const ManufacturerOnboardingWizard: React.FC<ManufacturerOnboardingWizardProps> = ({
  onSuccess, isPublicPage = false, onBack, onSubmitSuccess
}) => {
  const { submitManufacturerOnboarding } = useApp();

  // Helper to extract explicit draft code from URL query parameter (?draft=REG-xxx or ?code=REG-xxx)
  const getExplicitDraftCode = (): string => {
    try {
      if (typeof window === 'undefined') return '';
      const params = new URLSearchParams(window.location.search);
      return params.get('draft') || params.get('code') || '';
    } catch {
      return '';
    }
  };

  const [registrationCode, setRegistrationCode] = useState<string>(() => {
    return getExplicitDraftCode();
  });
  const [password, setPassword] = useState<string>('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // If opening a new registration (no explicit ?draft= or ?code= in URL), clear stale draft in storage
  useEffect(() => {
    const explicitCode = getExplicitDraftCode();
    if (!explicitCode && isPublicPage) {
      try {
        localStorage.removeItem('fg_mfg_reg_code');
      } catch {}
    }
  }, [isPublicPage]);

  // STEP 1 — Company Details State (Starts completely blank)
  const [companyDetails, setCompanyDetails] = useState({
    companyName: '',
    facilityAddress: '',
    city: '',
    state: '',
    pincode: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '',
    mfgCapacity: '' // Plant Capacity (Optional)
  });

  // UI-only demo verification states strictly linked to current entered values
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);
  const [mobileDemoMsg, setMobileDemoMsg] = useState<string | null>(null);
  const [emailDemoMsg, setEmailDemoMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Helper validators
  const isValidMobile = (phone: string): boolean => {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return /^(?:\+?91|0)?[6-9]\d{9}$/.test(cleaned) || /^\+?\d{10,14}$/.test(cleaned);
  };

  const isValidEmail = (email: string): boolean => {
    const trimmed = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed !== 'admin@factorygrid.com';
  };

  // Verification status is valid IF AND ONLY IF the verified value matches the current input value
  const isEmailVerified = Boolean(
    verifiedEmail &&
    companyDetails.email.trim().toLowerCase() === verifiedEmail &&
    isValidEmail(companyDetails.email)
  );

  const isMobileVerified = Boolean(
    verifiedMobile &&
    companyDetails.phone.replace(/[\s\-()]/g, '') === verifiedMobile &&
    isValidMobile(companyDetails.phone)
  );

  const handleVerifyMobile = () => {
    if (!isValidMobile(companyDetails.phone)) {
      setApiError('Please enter a valid 10-digit mobile number before verifying.');
      return;
    }
    const cleaned = companyDetails.phone.replace(/[\s\-()]/g, '');
    setVerifiedMobile(cleaned);
    setMobileDemoMsg('Demo verification successful • Mobile verified');
    setApiError(null);
  };

  const handleVerifyEmail = () => {
    if (!isValidEmail(companyDetails.email)) {
      if (companyDetails.email.trim().toLowerCase() === 'admin@factorygrid.com') {
        setApiError('Administrative credentials cannot be used for manufacturer registration.');
        return;
      }
      setApiError('Please enter a valid official email address before verifying.');
      return;
    }
    const trimmed = companyDetails.email.trim().toLowerCase();
    setVerifiedEmail(trimmed);
    setEmailDemoMsg('Demo verification successful • Email verified');
    setApiError(null);
  };

  // Wizard Steps: 1 = Company Details, 2 = Certifications, 3 = Category Capabilities, 4 = Batch Size & Delivery Schedule, 5 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Regulatory Scope: Whether WHO-GMP certification is applicable for this facility (true = Export/WHO tenders, false = Domestic Schedule M only)
  const [whoGmpApplicable, setWhoGmpApplicable] = useState<boolean>(true);

  // STEP 2 — Certifications State (Initial state: unuploaded)
  const [certificationsMap, setCertificationsMap] = useState<Record<string, CertDocState>>({
    mfgLicense: { key: 'mfgLicense', name: 'Manufacturing License', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
    gmpCert: { key: 'gmpCert', name: 'GMP Certificate', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
    whoGmpCert: { key: 'whoGmpCert', name: 'WHO-GMP Certificate', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
    isoCert: { key: 'isoCert', name: 'ISO Certification', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
    pollutionCert: { key: 'pollutionCert', name: 'Pollution Certificate', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
    factoryReg: { key: 'factoryReg', name: 'Factory Registration', code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: '' },
  });

  // Other Certificates state (supports uploading multiple additional certificates)
  const [otherCertsList, setOtherCertsList] = useState<CertDocState[]>([]);
  const [newOtherCertName, setNewOtherCertName] = useState('');
  const [newOtherDocNumber, setNewOtherDocNumber] = useState('');
  const [newOtherIssueDate, setNewOtherIssueDate] = useState('');
  const [newOtherExpiryDate, setNewOtherExpiryDate] = useState('');

  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string | null>>({});

  // Real Category Master from Backend (Hierarchical Category -> Sub-Category -> Sub-Sub-Category)
  const [categoriesList, setCategoriesList] = useState<CategoryHierarchyItem[]>([]);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryApiError, setCategoryApiError] = useState<string | null>(null);

  // Active Hierarchical Drilldown Navigation State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  // STEP 3 — Manufacturing Category Capabilities State
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // STEP 4 — Batch Size & Delivery Schedule State (renamed from MOQ & Lead Time)
  const [categorySupplyDetailsMap, setCategorySupplyDetailsMap] = useState<Record<string, { batchSize: number; deliveryScheduleDays: number }>>({});

  // STEP 5 — Confirmation & Submission State
  const [isAccurateConfirmed, setIsAccurateConfirmed] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch real category hierarchy master from backend
  const loadCategories = () => {
    setIsLoadingCategories(true);
    setCategoryApiError(null);
    manufacturerRegistrationApi.listCategories()
      .then(res => {
        const cats = res.categories || [];
        const tree = res.tree || [];
        setCategoriesList(cats);
        setCategoryTree(tree);
        if (tree.length > 0) {
          setActiveCategory(prev => prev || tree[0].category);
          if (tree[0].subCategories.length > 0) {
            setActiveSubCategory(prev => prev || tree[0].subCategories[0].subCategory);
          }
        }
      })
      .catch(err => {
        setCategoryApiError(err.message || 'Failed to load category hierarchy from server.');
      })
      .finally(() => {
        setIsLoadingCategories(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Sync real uploaded documents and reload saved capabilities from backend whenever registration code is present or step changes
  useEffect(() => {
    if (!registrationCode) return;

    // Load documents
    manufacturerRegistrationApi.getDocuments(registrationCode)
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
                  documentNumber: d.documentNumber || next[d.category].documentNumber || '',
                  fileSize: d.fileSize,
                  uploadedAt: d.uploadedAt,
                };
              }
            });
            return next;
          });

          // Populate other certificates list (including any historical factoryReg docs)
          const others = docs
            .filter(d => (d.category === 'otherCert' || d.category === 'factoryReg') && d.status !== 'SUPERSEDED')
            .map(d => ({
              key: d.category,
              name: d.categoryDisplayName || (d.category === 'factoryReg' ? 'Factory Registration' : 'Other Certificate'),
              code: d.documentCode || 'ADDITIONAL',
              id: d.id,
              fileName: d.fileName,
              uploaded: true,
              issueDate: d.issueDate,
              expiryDate: d.expiryDate,
              documentCode: d.documentCode,
              documentNumber: d.documentNumber || '',
              fileSize: d.fileSize,
              uploadedAt: d.uploadedAt,
            }));
          setOtherCertsList(others);
        }
      })
      .catch(() => {
        // Registration draft might not have uploaded documents yet
      });

    // Reload saved capabilities and company details
    manufacturerRegistrationApi.getRegistration(registrationCode)
      .then(reg => {
        if (reg?.whoGmpApplicable !== undefined) {
          setWhoGmpApplicable(reg.whoGmpApplicable);
        }
        if (reg?.products && Array.isArray(reg.products) && reg.products.length > 0) {
          const ids = reg.products.map((p: any) => p.productId || p.categoryId);
          setSelectedCategoryIds(prev => prev.length === 0 ? ids : prev);
          const supplyMap: Record<string, { batchSize: number; deliveryScheduleDays: number }> = {};
          reg.products.forEach((p: any) => {
            const id = p.productId || p.categoryId;
            supplyMap[id] = {
              batchSize: p.batchSize || p.moq || 1000,
              deliveryScheduleDays: p.deliveryScheduleDays || p.leadTimeDays || 14,
            };
          });
          setCategorySupplyDetailsMap(prev => ({ ...supplyMap, ...prev }));
        }
        if (reg?.company) {
          setCompanyDetails(prev => ({
            ...prev,
            companyName: reg.company.companyName || prev.companyName,
            facilityAddress: reg.company.facilityAddress || prev.facilityAddress,
            city: reg.company.city || prev.city,
            state: reg.company.state || prev.state,
            pincode: reg.company.pincode || prev.pincode,
            contactPerson: reg.company.contactPerson || prev.contactPerson,
            designation: reg.company.designation || prev.designation,
            email: reg.company.email || prev.email,
            phone: reg.company.phone || prev.phone,
            mfgCapacity: reg.company.mfgCapacity || prev.mfgCapacity,
          }));
        }
      })
      .catch(() => {});
  }, [registrationCode, currentStep]);

  // Validation Handlers
  const validateStep1 = () => {
    return (
      companyDetails.companyName.trim() !== '' &&
      companyDetails.facilityAddress.trim() !== '' &&
      companyDetails.city.trim() !== '' &&
      companyDetails.state.trim() !== '' &&
      companyDetails.pincode.trim() !== '' &&
      /^[1-9][0-9]{5}$/.test(companyDetails.pincode.trim()) &&
      companyDetails.contactPerson.trim() !== '' &&
      companyDetails.designation.trim() !== '' &&
      companyDetails.email.trim() !== '' &&
      isValidEmail(companyDetails.email) &&
      companyDetails.phone.trim() !== '' &&
      isValidMobile(companyDetails.phone) &&
      isEmailVerified &&
      isMobileVerified &&
      password.length >= 8
    );
  };

  const validateStep2 = (): { valid: boolean; message?: string } => {
    const isWhoGmpRequired = whoGmpApplicable !== false;
    const requiredDocs = ORIGINAL_MANUFACTURER_DOCUMENTS.filter(c => {
      if (c.key === 'whoGmpCert') return isWhoGmpRequired;
      return c.isMandatory;
    });

    const missing = requiredDocs.filter(c => !certificationsMap[c.key]?.uploaded);
    if (missing.length > 0) {
      missing.forEach(m => {
        setCardErrors(prev => ({ ...prev, [m.key]: `${m.name} is required.` }));
      });
      return {
        valid: false,
        message: `Please upload all required documents before continuing. Missing: ${missing.map(m => m.name).join(', ')}`,
      };
    }
    return { valid: true };
  };

  const validateStep3 = () => {
    return selectedCategoryIds.length > 0;
  };

  const validateStep4 = () => {
    for (const catId of selectedCategoryIds) {
      const supply = categorySupplyDetailsMap[catId];
      if (!supply || !supply.batchSize || supply.batchSize <= 0 || !supply.deliveryScheduleDays || supply.deliveryScheduleDays <= 0) {
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    setApiError(null);
    try {
      if (currentStep === 1) {
        if (
          !companyDetails.companyName.trim() ||
          !companyDetails.facilityAddress.trim() ||
          !companyDetails.city.trim() ||
          !companyDetails.state.trim() ||
          !companyDetails.pincode.trim() ||
          !companyDetails.contactPerson.trim() ||
          !companyDetails.designation.trim()
        ) {
          setApiError('Please fill in all required company details.');
          return;
        }
        if (!/^[1-9][0-9]{5}$/.test(companyDetails.pincode.trim())) {
          setApiError('Please enter a valid 6-digit Indian Pincode.');
          return;
        }
        if (!companyDetails.email.trim() || !isValidEmail(companyDetails.email)) {
          setApiError('Please enter a valid official email address.');
          return;
        }
        if (companyDetails.email.trim().toLowerCase() === 'admin@factorygrid.com') {
          setApiError('Administrative credentials cannot be used for manufacturer registration.');
          return;
        }
        if (!companyDetails.phone.trim() || !isValidMobile(companyDetails.phone)) {
          setApiError('Please enter a valid 10-digit mobile number.');
          return;
        }
        if (!isEmailVerified) {
          setApiError('Please verify your Email Address using the Verify button before continuing.');
          return;
        }
        if (!isMobileVerified) {
          setApiError('Please verify your Mobile Number using the Verify button before continuing.');
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
          setApiError(val.message || 'Please ensure all required certifications are uploaded with valid dates.');
          return;
        }
        setIsSaving(true);
        const docsPayload = ORIGINAL_MANUFACTURER_DOCUMENTS
          .filter(c => certificationsMap[c.key]?.uploaded)
          .map(c => ({
            category: c.key,
          }));
        await manufacturerRegistrationApi.saveStep2({
          documents: docsPayload,
          whoGmpApplicable,
        }, registrationCode);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (selectedCategoryIds.length === 0) {
          setApiError('Please select at least one manufacturing category capability.');
          return;
        }
        setIsSaving(true);
        await manufacturerRegistrationApi.saveStep3(selectedCategoryIds, registrationCode);
        setCurrentStep(4);
      } else if (currentStep === 4) {
        if (!validateStep4()) {
          setApiError('Please define valid Batch Size and Delivery Schedule for all selected categories.');
          return;
        }
        setIsSaving(true);
        const items = selectedCategoryIds.map(categoryId => ({
          categoryId,
          productId: categoryId,
          batchSize: categorySupplyDetailsMap[categoryId]?.batchSize || 1000,
          moq: categorySupplyDetailsMap[categoryId]?.batchSize || 1000,
          deliveryScheduleDays: categorySupplyDetailsMap[categoryId]?.deliveryScheduleDays || 14,
          leadTimeDays: categorySupplyDetailsMap[categoryId]?.deliveryScheduleDays || 14,
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

  // Category Selection Handlers
  const handleToggleCategoryCapability = (catId: string) => {
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(prev => prev.filter(id => id !== catId));
    } else {
      setSelectedCategoryIds(prev => [...prev, catId]);
      if (!categorySupplyDetailsMap[catId]) {
        setCategorySupplyDetailsMap(prev => ({
          ...prev,
          [catId]: { batchSize: 1000, deliveryScheduleDays: 14 }
        }));
      }
    }
  };

  const handleRemoveCategorySelection = (catId: string) => {
    setSelectedCategoryIds(prev => prev.filter(id => id !== catId));
  };

  const handleClearAllSelections = () => {
    setSelectedCategoryIds([]);
  };

  const handleToggleCategorySelection = handleToggleCategoryCapability;

  // Ensure an active registration draft exists before uploading
  const getOrInitRegistrationCode = async (): Promise<string> => {
    let activeCode = registrationCode;
    if (!activeCode) {
      const step1Res = await manufacturerRegistrationApi.saveStep1(companyDetails);
      activeCode = step1Res.registrationCode;
      setRegistrationCode(activeCode);
      localStorage.setItem('fg_mfg_reg_code', activeCode);
    }
    return activeCode;
  };

  // View uploaded document in new browser tab without redirecting to landing page
  const handleViewDoc = async (docId?: string) => {
    if (!docId) return;
    try {
      const activeCode = registrationCode || localStorage.getItem('fg_mfg_reg_code') || '';
      const targetUrl = `/api/v1/manufacturer/documents/${docId}/download${activeCode ? `?registrationCode=${encodeURIComponent(activeCode)}` : ''}`;
      const { blobUrl } = await adminVerificationApi.getDocumentBlob(targetUrl);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setApiError(err.message || 'Failed to open document preview.');
    }
  };

  // Upload file directly to backend multipart API
  const uploadFileToBackend = async (key: string, name: string, file: File) => {
    setApiError(null);
    setCardErrors(prev => ({ ...prev, [key]: null }));
    setUploadingCategory(key);
    try {
      // Validate file extension
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        const msg = 'Invalid file format. Please upload a PDF or image file (.pdf, .png, .jpg, .jpeg).';
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }
      // Validate file size (10 MB maximum)
      if (file.size > 10 * 1024 * 1024) {
        const msg = 'File size exceeds maximum permitted limit of 10MB.';
        setCardErrors(prev => ({ ...prev, [key]: msg }));
        setApiError(msg);
        return;
      }

      const activeCode = await getOrInitRegistrationCode();

      const uploaded = await manufacturerRegistrationApi.uploadDocument(
        file,
        key,
        activeCode,
      );

      setCertificationsMap(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          id: uploaded.id,
          fileName: uploaded.fileName,
          uploaded: true,
          documentCode: uploaded.documentCode,
          fileSize: uploaded.fileSize,
          uploadedAt: uploaded.uploadedAt,
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

  // Opens native file picker to select a real PDF or permitted image
  const handleChooseFile = (key: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf,image/png,image/jpeg,image/jpg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await uploadFileToBackend(key, name, file);
    };
    input.click();
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

  // Other Certificates Upload Handler
  const uploadOtherCertificate = async (file: File) => {
    setApiError(null);
    setCardErrors(prev => ({ ...prev, otherCert: null }));
    setUploadingCategory('otherCert');
    try {
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        const msg = 'Invalid file format. Please upload a PDF or image file (.pdf, .png, .jpg, .jpeg).';
        setCardErrors(prev => ({ ...prev, otherCert: msg }));
        setApiError(msg);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        const msg = 'File size exceeds maximum permitted limit of 10MB.';
        setCardErrors(prev => ({ ...prev, otherCert: msg }));
        setApiError(msg);
        return;
      }

      const activeCode = await getOrInitRegistrationCode();
      const uploaded = await manufacturerRegistrationApi.uploadDocument(
        file,
        'otherCert',
        activeCode,
      );

      const title = newOtherCertName.trim() || 'Other Certificate';
      setOtherCertsList(prev => [
        ...prev,
        {
          key: 'otherCert',
          name: title,
          code: uploaded.documentCode || 'OTHER-CERT',
          id: uploaded.id,
          fileName: uploaded.fileName,
          uploaded: true,
          issueDate: '',
          expiryDate: '',
          documentCode: uploaded.documentCode,
          documentNumber: '',
          fileSize: uploaded.fileSize,
          uploadedAt: uploaded.uploadedAt,
        }
      ]);
      setNewOtherCertName('');
    } catch (err: any) {
      const msg = err.message || 'Failed to upload other certificate';
      setCardErrors(prev => ({ ...prev, otherCert: msg }));
      setApiError(msg);
    } finally {
      setUploadingCategory(null);
    }
  };

  const handleChooseOtherFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf,image/png,image/jpeg,image/jpg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await uploadOtherCertificate(file);
    };
    input.click();
  };

  const handleRemoveOtherDoc = async (id?: string, idx?: number) => {
    if (id) {
      try {
        await manufacturerRegistrationApi.removeDocument(id);
      } catch (err) {
        console.warn('Remove doc backend warning:', err);
      }
      setOtherCertsList(prev => prev.filter(d => d.id !== id));
    } else if (idx !== undefined) {
      setOtherCertsList(prev => prev.filter((_, i) => i !== idx));
    }
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
        whoGmpApplicable,
      });

      submitManufacturerOnboarding({
        companyName: companyDetails.companyName,
        factoryDetails: `${companyDetails.facilityAddress}, ${companyDetails.city}, ${companyDetails.state} ${companyDetails.pincode}`,
        mfgCapacity: companyDetails.mfgCapacity || 'Not specified',
        whoGmpNo: whoGmpApplicable
          ? (certificationsMap['whoGmpCert']?.documentNumber || certificationsMap['whoGmpCert']?.code || 'WHO-GMP-CERTIFIED')
          : 'N/A (Domestic Only)',
        factoryLocation: `${companyDetails.city}, ${companyDetails.state}`,
        gstin: '36AAACS9981F1Z2',
        pan: 'AAACS9981F',
        mfgLicenseNo: certificationsMap['mfgLicense']?.documentNumber || certificationsMap['mfgLicense']?.code || 'MFG-FORM-25-28',
        contactPerson: companyDetails.contactPerson,
        email: companyDetails.email,
        phone: companyDetails.phone,
        targetMarkets: whoGmpApplicable ? 'Domestic & Exports (WHO Pre-qualified, SE Asia, Africa)' : 'Domestic Schedule M Market',
        drugCategories: selectedCategoryIds.map(id => {
          const cat = categoriesList.find(c => c.id === id || c.categoryId === id);
          return cat ? cat.fullName : (SUPPORTED_MANUFACTURING_CATEGORIES.find(c => c.id === id)?.name || id);
        }),
        certifications: MANDATORY_CERTIFICATIONS.filter(c => certificationsMap[c.key]?.uploaded).map(c => c.name),
        documents: MANDATORY_CERTIFICATIONS.filter(c => certificationsMap[c.key]?.uploaded).map(c => ({
          name: certificationsMap[c.key]?.fileName || `${c.name}.pdf`,
          type: c.key,
          status: 'PENDING' as const,
          url: `/api/v1/manufacturer/documents/${certificationsMap[c.key]?.id}/download?registrationCode=${encodeURIComponent(registrationCode)}`
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

  const selectedCategoriesList = selectedCategoryIds.map(id => {
    const found = categoriesList.find(c => c.id === id || c.categoryId === id);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        code: found.categoryCode,
        description: found.description || found.name,
        fullName: found.fullName,
        category: found.category,
        subCategory: found.subCategory,
        subSubCategory: found.subSubCategory,
      };
    }
    const legacy = SUPPORTED_MANUFACTURING_CATEGORIES.find(c => c.id === id);
    if (legacy) {
      return {
        id: legacy.id,
        name: legacy.name,
        code: legacy.code,
        description: legacy.description,
        fullName: legacy.name,
        category: legacy.name,
        subCategory: null,
        subSubCategory: null,
      };
    }
    return {
      id,
      name: id,
      code: id,
      description: id,
      fullName: id,
      category: id,
      subCategory: null,
      subSubCategory: null,
    };
  });

  // Step 5 Review Edit Modals State
  type MfgReviewSection = 'company' | 'certifications' | 'capabilities' | null;
  const [activeMfgModal, setActiveMfgModal] = useState<MfgReviewSection>(null);
  const [mfgModalError, setMfgModalError] = useState<string | null>(null);

  // Draft state copies
  const [draftCompanyDetails, setDraftCompanyDetails] = useState({ ...companyDetails });
  const [draftCertificationsMap, setDraftCertificationsMap] = useState<Record<string, CertDocState>>({ ...certificationsMap });
  const [draftOtherCertsList, setDraftOtherCertsList] = useState<CertDocState[]>([...otherCertsList]);
  const [draftSupplyDetailsMap, setDraftSupplyDetailsMap] = useState<Record<string, { batchSize: number; deliveryScheduleDays: number }>>({ ...categorySupplyDetailsMap });

  const handleOpenMfgModal = (section: 'company' | 'certifications' | 'capabilities') => {
    setMfgModalError(null);
    if (section === 'company') {
      setDraftCompanyDetails({ ...companyDetails });
    } else if (section === 'certifications') {
      setDraftCertificationsMap({ ...certificationsMap });
      setDraftOtherCertsList([...otherCertsList]);
    } else if (section === 'capabilities') {
      setDraftSupplyDetailsMap({ ...categorySupplyDetailsMap });
    }
    setActiveMfgModal(section);
  };

  const handleCloseMfgModal = () => {
    setActiveMfgModal(null);
    setMfgModalError(null);
  };

  const handleSaveMfgCompany = async () => {
    setMfgModalError(null);
    if (
      !draftCompanyDetails.companyName.trim() ||
      !draftCompanyDetails.facilityAddress.trim() ||
      !draftCompanyDetails.city.trim() ||
      !draftCompanyDetails.state.trim() ||
      !draftCompanyDetails.pincode.trim() ||
      !draftCompanyDetails.contactPerson.trim() ||
      !draftCompanyDetails.designation.trim()
    ) {
      setMfgModalError('Please fill in all required company details.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(draftCompanyDetails.pincode.trim())) {
      setMfgModalError('Please enter a valid 6-digit Indian Pincode.');
      return;
    }
    if (!draftCompanyDetails.email.trim() || !isValidEmail(draftCompanyDetails.email)) {
      setMfgModalError('Please enter a valid official email address.');
      return;
    }
    if (draftCompanyDetails.email.trim().toLowerCase() === 'admin@factorygrid.com') {
      setMfgModalError('Administrative credentials cannot be used for manufacturer registration.');
      return;
    }
    if (!draftCompanyDetails.phone.trim() || !isValidMobile(draftCompanyDetails.phone)) {
      setMfgModalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Invalidate verification if email or phone changed
    if (verifiedEmail && draftCompanyDetails.email.trim().toLowerCase() !== verifiedEmail) {
      setVerifiedEmail(null);
      setEmailDemoMsg(null);
    }
    if (verifiedMobile && draftCompanyDetails.phone.replace(/[\s\-()]/g, '') !== verifiedMobile) {
      setVerifiedMobile(null);
      setMobileDemoMsg(null);
    }

    setCompanyDetails({ ...draftCompanyDetails });
    if (registrationCode) {
      try {
        await manufacturerRegistrationApi.saveStep1(draftCompanyDetails, registrationCode);
      } catch (err: any) {
        console.warn('Backend sync warning for mfg step 1:', err?.message);
      }
    }
    handleCloseMfgModal();
  };

  const handleModalCertUpload = (key: string, name: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf,image/png,image/jpeg,image/jpg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExts.includes(ext)) {
        setMfgModalError('Only PDF or image files (.pdf, .png, .jpg, .jpeg) are accepted.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setMfgModalError('File size exceeds maximum permitted limit of 10MB.');
        return;
      }
      try {
        const activeCode = await getOrInitRegistrationCode();

        const uploaded = await manufacturerRegistrationApi.uploadDocument(
          file,
          key,
          activeCode,
        );

        setDraftCertificationsMap(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            id: uploaded.id,
            fileName: uploaded.fileName,
            uploaded: true,
            documentCode: uploaded.documentCode,
            fileSize: uploaded.fileSize,
            uploadedAt: uploaded.uploadedAt,
          }
        }));
      } catch (err: any) {
        setMfgModalError(err.message || `Failed to upload ${name}`);
      }
    };
    input.click();
  };

  const handleModalCertRemove = (key: string) => {
    setDraftCertificationsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        id: undefined,
        fileName: '',
        uploaded: false
      }
    }));
  };

  const handleSaveMfgCertifications = async () => {
    setMfgModalError(null);
    const isWhoGmpRequired = whoGmpApplicable !== false;
    const requiredDocs = ORIGINAL_MANUFACTURER_DOCUMENTS.filter(c => {
      if (c.key === 'whoGmpCert') return isWhoGmpRequired;
      return c.isMandatory;
    });
    const missing = requiredDocs.filter(c => !draftCertificationsMap[c.key]?.uploaded);
    if (missing.length > 0) {
      setMfgModalError(`Please ensure all required documents are uploaded. Missing: ${missing.map(m => m.name).join(', ')}`);
      return;
    }

    setCertificationsMap({ ...draftCertificationsMap });
    setOtherCertsList([...draftOtherCertsList]);

    if (registrationCode) {
      try {
        const docsPayload = ORIGINAL_MANUFACTURER_DOCUMENTS
          .filter(c => draftCertificationsMap[c.key]?.uploaded)
          .map(c => ({
            category: c.key,
          }));
        await manufacturerRegistrationApi.saveStep2({
          documents: docsPayload,
          whoGmpApplicable,
        }, registrationCode);
      } catch (err: any) {
        console.warn('Backend sync warning for mfg step 2:', err?.message);
      }
    }
    setActiveMfgModal(null);
  };

  const handleSaveMfgCapabilities = async () => {
    setMfgModalError(null);
    for (const catId of selectedCategoryIds) {
      const supply = draftSupplyDetailsMap[catId];
      if (!supply || !supply.batchSize || supply.batchSize <= 0 || !supply.deliveryScheduleDays || supply.deliveryScheduleDays <= 0) {
        setMfgModalError('Please define valid positive Batch Size and Delivery Schedule days for all capabilities.');
        return;
      }
    }
    setCategorySupplyDetailsMap({ ...draftSupplyDetailsMap });
    if (registrationCode) {
      try {
        const items = selectedCategoryIds.map(categoryId => ({
          categoryId,
          productId: categoryId,
          batchSize: draftSupplyDetailsMap[categoryId]?.batchSize || 1000,
          moq: draftSupplyDetailsMap[categoryId]?.batchSize || 1000,
          deliveryScheduleDays: draftSupplyDetailsMap[categoryId]?.deliveryScheduleDays || 14,
          leadTimeDays: draftSupplyDetailsMap[categoryId]?.deliveryScheduleDays || 14,
        }));
        await manufacturerRegistrationApi.saveStep4(items, registrationCode);
      } catch (err: any) {
        console.warn('Backend sync warning for mfg step 4:', err?.message);
      }
    }
    handleCloseMfgModal();
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
              <span>All 5 Mandatory Certifications & Valid Expiry Dates Verified</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>Manufacturing Category Capabilities Defined ({selectedCategoryIds.length} Categories Linked)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#F8FAFC' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>✓</span>
              <span>Batch Size and Supply Delivery Schedules Recorded</span>
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
              { num: 3, label: '3 Category Capabilities' },
              { num: 4, label: '4 Batch Size & Delivery Schedule' },
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
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Checking company information, certification expiry dates, manufacturing category capabilities, batch size, and delivery schedules.</div>
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
                    <label htmlFor="mfgCompanyName" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Company / Manufacturing Legal Entity Name *
                    </label>
                    <input
                      id="mfgCompanyName"
                      type="text"
                      required
                      placeholder="Enter company legal name"
                      value={companyDetails.companyName}
                      onChange={e => setCompanyDetails({ ...companyDetails, companyName: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="mfgFacilityAddress" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Factory Site Street Address *
                    </label>
                    <input
                      id="mfgFacilityAddress"
                      type="text"
                      required
                      placeholder="Enter factory site street address"
                      value={companyDetails.facilityAddress}
                      onChange={e => setCompanyDetails({ ...companyDetails, facilityAddress: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="mfgCity" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      City *
                    </label>
                    <input
                      id="mfgCity"
                      type="text"
                      required
                      placeholder="Enter city"
                      value={companyDetails.city}
                      onChange={e => setCompanyDetails({ ...companyDetails, city: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="mfgState" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      State *
                    </label>
                    <select
                      id="mfgState"
                      required
                      value={companyDetails.state}
                      onChange={e => setCompanyDetails({ ...companyDetails, state: e.target.value })}
                      style={{
                        width: '100%',
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        outline: 'none',
                        background: isPublicPage ? '#1E293B' : '#FFF',
                        color: companyDetails.state ? (isPublicPage ? '#FFF' : '#0F172A') : (isPublicPage ? '#94A3B8' : '#94A3B8'),
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s} style={{ background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mfgPincode" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Pincode *
                    </label>
                    <input
                      id="mfgPincode"
                      type="text"
                      required
                      placeholder="Enter 6-digit pincode"
                      value={companyDetails.pincode}
                      onChange={e => setCompanyDetails({ ...companyDetails, pincode: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  {/* Plant Capacity is completely optional */}
                  <div>
                    <label htmlFor="mfgCapacity" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Plant Capacity (Optional)
                    </label>
                    <input
                      id="mfgCapacity"
                      type="text"
                      placeholder="e.g. 10,000,000 Units / Year (optional)"
                      value={companyDetails.mfgCapacity}
                      onChange={e => setCompanyDetails({ ...companyDetails, mfgCapacity: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="mfgContactPerson" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Contact Person Name *
                    </label>
                    <input
                      id="mfgContactPerson"
                      type="text"
                      required
                      placeholder="Enter contact person name"
                      value={companyDetails.contactPerson}
                      onChange={e => setCompanyDetails({ ...companyDetails, contactPerson: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="mfgDesignation" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>
                      Designation *
                    </label>
                    <input
                      id="mfgDesignation"
                      type="text"
                      required
                      placeholder="Enter designation (e.g. Director, Plant Head)"
                      value={companyDetails.designation}
                      onChange={e => setCompanyDetails({ ...companyDetails, designation: e.target.value })}
                      style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                    />
                  </div>

                  {/* Official Email Address with Verify Button */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="mfgContactEmail" style={{ fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155' }}>
                        Email *
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
                        id="mfgContactEmail"
                        name="mfg_contact_email"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        required
                        placeholder="Enter registered email"
                        value={companyDetails.email}
                        onChange={e => {
                          const val = e.target.value;
                          setCompanyDetails(prev => ({ ...prev, email: val }));
                          if (verifiedEmail && val.trim().toLowerCase() !== verifiedEmail) {
                            setVerifiedEmail(null);
                            setEmailDemoMsg(null);
                          }
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
                        disabled={!isValidEmail(companyDetails.email) || isEmailVerified}
                        style={{
                          height: 40,
                          padding: '0 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: isEmailVerified ? '#059669' : (isValidEmail(companyDetails.email) ? '#14B8A6' : (isPublicPage ? '#334155' : '#E2E8F0')),
                          color: isEmailVerified ? '#FFF' : (isValidEmail(companyDetails.email) ? '#FFF' : (isPublicPage ? '#64748B' : '#94A3B8')),
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: (isValidEmail(companyDetails.email) && !isEmailVerified) ? 'pointer' : 'not-allowed',
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

                  {/* Mobile Number with Verify Button */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="mfgMobileNumber" style={{ fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155' }}>
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
                        id="mfgMobileNumber"
                        name="mfg_mobile_number"
                        required
                        placeholder="Enter 10-digit mobile number"
                        value={companyDetails.phone}
                        onChange={e => {
                          const val = e.target.value;
                          setCompanyDetails(prev => ({ ...prev, phone: val }));
                          const cleaned = val.replace(/[\s\-()]/g, '');
                          if (verifiedMobile && cleaned !== verifiedMobile) {
                            setVerifiedMobile(null);
                            setMobileDemoMsg(null);
                          }
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
                        disabled={!isValidMobile(companyDetails.phone) || isMobileVerified}
                        style={{
                          height: 40,
                          padding: '0 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: isMobileVerified ? '#059669' : (isValidMobile(companyDetails.phone) ? '#14B8A6' : (isPublicPage ? '#334155' : '#E2E8F0')),
                          color: isMobileVerified ? '#FFF' : (isValidMobile(companyDetails.phone) ? '#FFF' : (isPublicPage ? '#64748B' : '#94A3B8')),
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: (isValidMobile(companyDetails.phone) && !isMobileVerified) ? 'pointer' : 'not-allowed',
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

                  {/* Create Portal Password with Show/Hide Eye Toggle */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 6 }}>Create Portal Password * (min 8 chars)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="mfgPortalPassword"
                        name="mfg_portal_password"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        required
                        placeholder="Create portal password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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

                {(!isEmailVerified || !isMobileVerified) && (
                  <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: isPublicPage ? 'rgba(234, 179, 8, 0.08)' : '#FEF9C3', border: '1px solid rgba(234, 179, 8, 0.25)', color: isPublicPage ? '#FDE047' : '#854D0E', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={15} />
                    <span>Note: Please verify both your Email Address and Mobile Number using the demo verification buttons above to continue.</span>
                  </div>
                )}

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
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Required Compliance Documents</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 3 }}>
                    Please upload your required statutory manufacturing documents for compliance verification ({MANDATORY_CERTIFICATIONS.filter(c => certificationsMap[c.key]?.uploaded).length}/{MANDATORY_CERTIFICATIONS.length} Uploaded).
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* The Mandatory & Statutory Document Cards */}
                  {ORIGINAL_MANUFACTURER_DOCUMENTS.map(c => {
                    const isRequired = c.key === 'whoGmpCert' ? (whoGmpApplicable !== false) : c.isMandatory;
                    const doc = certificationsMap[c.key] || {
                      key: c.key, name: c.name, code: '', fileName: '', uploaded: false, issueDate: '', expiryDate: '', documentNumber: ''
                    };

                    return (
                      <div
                        key={c.key}
                        id={`card-${c.key}`}
                        style={{
                          background: isPublicPage ? '#1E293B' : '#F8FAFC',
                          border: cardErrors[c.key] ? '1px solid #EF4444' : (isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1'),
                          borderRadius: 10,
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 14
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{c.name}</span>
                            {isRequired ? (
                              <span style={{ color: '#EF4444', fontSize: 11.5, fontWeight: 700 }}>(Required)</span>
                            ) : (
                              <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600 }}>(Optional)</span>
                            )}
                          </div>

                          {doc.uploaded ? (
                            <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#475569', fontWeight: 500, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ color: isPublicPage ? '#F1F5F9' : '#0F172A', fontWeight: 600 }}>📄 {doc.fileName}</span>
                              {doc.fileSize ? <span style={{ color: '#64748B', fontSize: 11 }}>({Math.round(doc.fileSize / 1024)} KB)</span> : null}
                            </div>
                          ) : null}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          {doc.uploaded ? (
                            <>
                              <span style={{ padding: '4px 12px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', fontSize: 11.5, fontWeight: 700 }}>
                                ✓ Uploaded
                              </span>
                              <button
                                type="button"
                                id={`btn-view-${c.key}`}
                                onClick={() => handleViewDoc(doc.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: isPublicPage ? '#334155' : '#E2E8F0',
                                  color: isPublicPage ? '#E2E8F0' : '#1E293B',
                                  border: isPublicPage ? '1px solid #475569' : '1px solid #CBD5E1',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Eye size={13} /> View Document
                              </button>
                              <button
                                type="button"
                                id={`btn-replace-${c.key}`}
                                onClick={() => handleChooseFile(c.key, c.name)}
                                disabled={uploadingCategory === c.key || isSaving}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 6,
                                  background: '#0D9488',
                                  color: '#FFF',
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: (uploadingCategory === c.key || isSaving) ? 'wait' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5
                                }}
                              >
                                <Upload size={13} /> {uploadingCategory === c.key ? 'Uploading...' : 'Replace'}
                              </button>
                              <button
                                type="button"
                                id={`btn-remove-${c.key}`}
                                onClick={() => handleRemoveDoc(c.key)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: 6,
                                  background: isPublicPage ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                                  color: '#EF4444',
                                  border: '1px solid #FECACA',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <>
                              <span style={{ padding: '4px 10px', borderRadius: 999, background: isPublicPage ? 'rgba(148,163,184,0.12)' : '#F1F5F9', color: isPublicPage ? '#94A3B8' : '#64748B', fontSize: 11.5, fontWeight: 600 }}>
                                Not Uploaded
                              </span>
                              <button
                                type="button"
                                id={`btn-upload-${c.key}`}
                                onClick={() => handleChooseFile(c.key, c.name)}
                                disabled={uploadingCategory === c.key || isSaving}
                                style={{
                                  padding: '7px 18px',
                                  borderRadius: 6,
                                  background: '#14B8A6',
                                  color: '#FFF',
                                  border: 'none',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: (uploadingCategory === c.key || isSaving) ? 'wait' : 'pointer',
                                  opacity: (uploadingCategory === c.key || isSaving) ? 0.7 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                <Upload size={13} /> {uploadingCategory === c.key ? 'Uploading...' : 'Upload Document'}
                              </button>
                            </>
                          )}
                        </div>

                        {cardErrors[c.key] && (
                          <div style={{ width: '100%', marginTop: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}>
                            ⚠️ {cardErrors[c.key]}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Section for Other Certificates (Optional, Multiple Supported) */}
                  <div
                    id="section-other-certificates"
                    style={{
                      background: isPublicPage ? '#1E293B' : '#F8FAFC',
                      border: cardErrors['otherCert'] ? '1px solid #EF4444' : (isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1'),
                      borderRadius: 10,
                      padding: '18px 20px',
                    }}
                  >
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Other Certificates</span>
                        <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600 }}>(Optional)</span>
                      </div>
                      <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 3 }}>
                        Upload any additional statutory, quality or regulatory certificates (e.g. EU-GMP, HACCP, Halal, CE, ISO 14001).
                      </div>
                    </div>

                    {/* Uploaded Other Certificates List */}
                    {otherCertsList.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {otherCertsList.map((doc, idx) => (
                          <div
                            key={doc.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              padding: '10px 14px',
                              background: isPublicPage ? '#0F172A' : '#FFF',
                              borderRadius: 8,
                              border: isPublicPage ? '1px solid #334155' : '1px solid #E2E8F0',
                              gap: 10
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                                ✓ {doc.name}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#10B981', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>📄 {doc.fileName}</span>
                                {doc.fileSize ? <span style={{ color: '#64748B', fontSize: 11 }}>({Math.round(doc.fileSize / 1024)} KB)</span> : null}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {doc.id && (
                                <button
                                  type="button"
                                  onClick={() => handleViewDoc(doc.id)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    background: isPublicPage ? '#334155' : '#E2E8F0',
                                    color: isPublicPage ? '#E2E8F0' : '#1E293B',
                                    border: isPublicPage ? '1px solid #475569' : '1px solid #CBD5E1',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                >
                                  <Eye size={12} /> View Document
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveOtherDoc(doc.id, idx)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  background: isPublicPage ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
                                  color: '#EF4444',
                                  border: '1px solid #FECACA',
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form to add another certificate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Certificate Name (e.g. EU-GMP, Halal, HACCP, ISO 14001)"
                        value={newOtherCertName}
                        onChange={(e) => setNewOtherCertName(e.target.value)}
                        style={{
                          flex: 1,
                          minWidth: 240,
                          height: 38,
                          padding: '0 12px',
                          borderRadius: 6,
                          border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1',
                          background: isPublicPage ? '#0F172A' : '#FFF',
                          color: isPublicPage ? '#FFF' : '#0F172A',
                          fontSize: 12.5,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        id="btn-upload-otherCert"
                        onClick={handleChooseOtherFile}
                        disabled={uploadingCategory === 'otherCert' || isSaving}
                        style={{
                          height: 38,
                          padding: '0 16px',
                          borderRadius: 6,
                          background: '#14B8A6',
                          color: '#FFF',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: (uploadingCategory === 'otherCert' || isSaving) ? 'wait' : 'pointer',
                          opacity: (uploadingCategory === 'otherCert' || isSaving) ? 0.7 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Upload size={13} /> {uploadingCategory === 'otherCert' ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>

                    {cardErrors['otherCert'] && (
                      <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600 }}>
                        ⚠️ {cardErrors['otherCert']}
                      </div>
                    )}
                  </div>
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
                    {isSaving ? 'Validating & Saving...' : 'Continue to Category Capabilities →'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — CATEGORY CAPABILITIES (HIERARCHICAL SELECTION) */}
            {currentStep === 3 && (() => {
              const currentCatNode = categoryTree.find(c => c.category === activeCategory) || categoryTree[0];
              const subCategories = currentCatNode?.subCategories || [];
              const currentSubNode = subCategories.find(s => s.subCategory === activeSubCategory) || subCategories[0];
              const currentItems = currentSubNode?.items || [];

              const isSearching = categorySearchTerm.trim().length > 0;
              const q = categorySearchTerm.toLowerCase().trim();
              const searchResults = isSearching
                ? categoriesList.filter(c =>
                    c.fullName.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q) ||
                    c.categoryCode.toLowerCase().includes(q) ||
                    (c.description || '').toLowerCase().includes(q)
                  )
                : [];

              return (
                <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>
                      Manufacturing Category Capabilities
                    </h2>
                    <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                      Select your manufacturing Category, Sub-Category, and specific production capabilities.
                    </div>
                  </div>

                  {/* Summary Bar: Selected Capabilities Count & Active Chips */}
                  <div style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: selectedCategoriesList.length > 0 ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                          Selected Capabilities ({selectedCategoryIds.length} Linked)
                        </span>
                        <span style={{ fontSize: 11, color: '#14B8A6', background: 'rgba(20,184,166,0.15)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                          Hierarchical Capabilities
                        </span>
                      </div>
                      {selectedCategoryIds.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllSelections}
                          style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {selectedCategoriesList.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 110, overflowY: 'auto', paddingTop: 4 }}>
                        {selectedCategoriesList.map(c => (
                          <div
                            key={c.id}
                            style={{
                              padding: '5px 10px',
                              background: '#14B8A6',
                              color: '#FFF',
                              borderRadius: 999,
                              fontSize: 11.5,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <span>✓ {c.fullName || c.name}</span>
                            <span style={{ fontSize: 10, opacity: 0.85 }}>({c.code})</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategorySelection(c.id)}
                              style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0, fontWeight: 900, fontSize: 13, lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
                        No capabilities selected yet. Select a Category below, choose a Sub-Category, and check your specific manufacturing capabilities.
                      </div>
                    )}
                  </div>

                  {/* Search Bar across all Hierarchy Levels */}
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                    <input
                      type="text"
                      placeholder="Search capabilities by category, sub-category, capability name or code..."
                      value={categorySearchTerm}
                      onChange={e => setCategorySearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 36px 0 38px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        outline: 'none',
                        background: isPublicPage ? '#1E293B' : '#FFF',
                        color: isPublicPage ? '#FFF' : '#0F172A'
                      }}
                    />
                    {categorySearchTerm && (
                      <button
                        type="button"
                        onClick={() => setCategorySearchTerm('')}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 14 }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Loading State */}
                  {isLoadingCategories && (
                    <div style={{ padding: 40, textAlign: 'center', color: '#14B8A6', fontSize: 13, fontWeight: 600 }}>
                      Loading category master hierarchy from database...
                    </div>
                  )}

                  {/* API Error State with Retry */}
                  {categoryApiError && (
                    <div style={{ marginBottom: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>⚠️ {categoryApiError}</span>
                      <button
                        type="button"
                        onClick={loadCategories}
                        style={{ padding: '4px 10px', borderRadius: 6, background: '#DC2626', color: '#FFF', border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Retry Loading
                      </button>
                    </div>
                  )}

                  {/* SEARCH RESULTS VIEW (When query entered) */}
                  {!isLoadingCategories && isSearching && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>
                        Search Matches ({searchResults.length} Results)
                      </div>
                      {searchResults.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                          No categories or capabilities matching "{categorySearchTerm}".
                        </div>
                      ) : (
                        searchResults.map(c => {
                          const isSelected = selectedCategoryIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: isSelected ? 'rgba(20,184,166,0.12)' : (isPublicPage ? '#1E293B' : '#F8FAFC'),
                                borderRadius: 8,
                                border: isSelected ? '1px solid #14B8A6' : '1px solid #E2E8F0',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ flex: 1, paddingRight: 16 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {c.category} {c.subCategory ? `→ ${c.subCategory}` : ''}
                                </div>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', marginTop: 2 }}>
                                  {c.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                                  <span style={{ fontWeight: 700, color: isSelected ? '#14B8A6' : '#64748B' }}>{c.categoryCode}</span>
                                  {c.description ? ` • ${c.description}` : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleCategoryCapability(c.id)}
                                style={{
                                  padding: '6px 14px',
                                  borderRadius: 6,
                                  background: isSelected ? '#DCFCE7' : '#14B8A6',
                                  color: isSelected ? '#15803D' : '#FFF',
                                  border: isSelected ? '1px solid #86EFAC' : 'none',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {isSelected ? '✓ Selected' : '+ Select Capability'}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 3-PANEL HIERARCHICAL DRILLDOWN SELECTION FLOW (Default Mode) */}
                  {!isLoadingCategories && !isSearching && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.35fr', gap: 12, minHeight: 400 }}>

                      {/* 1. Category Column */}
                      <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Layers size={14} /> 1. Category
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 380, paddingRight: 4 }}>
                          {categoryTree.map(cat => {
                            const isActive = (activeCategory || categoryTree[0]?.category) === cat.category;
                            const selCount = categoriesList.filter(item => item.category === cat.category && selectedCategoryIds.includes(item.id)).length;
                            return (
                              <button
                                key={cat.category}
                                type="button"
                                onClick={() => {
                                  setActiveCategory(cat.category);
                                  if (cat.subCategories.length > 0) {
                                    setActiveSubCategory(cat.subCategories[0].subCategory);
                                  } else {
                                    setActiveSubCategory(null);
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  textAlign: 'left',
                                  border: isActive ? '1.5px solid #14B8A6' : '1px solid #CBD5E1',
                                  background: isActive ? 'rgba(20,184,166,0.14)' : (isPublicPage ? '#0F172A' : '#FFFFFF'),
                                  color: isActive ? (isPublicPage ? '#FFF' : '#0F172A') : (isPublicPage ? '#CBD5E1' : '#334155'),
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: isActive ? 800 : 600 }}>{cat.category}</div>
                                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{cat.subCategories.length} sub-categories</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {selCount > 0 && (
                                    <span style={{ fontSize: 11, fontWeight: 800, background: '#16A34A', color: '#FFF', borderRadius: 999, padding: '2px 7px' }}>
                                      ✓ {selCount}
                                    </span>
                                  )}
                                  <ChevronRight size={15} style={{ color: isActive ? '#14B8A6' : '#94A3B8' }} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Sub-Category Column */}
                      <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Package size={14} /> 2. Sub-Category
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Under: <strong style={{ color: isPublicPage ? '#FFF' : '#0F172A' }}>{currentCatNode?.category || 'Category'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 350, paddingRight: 4 }}>
                          {subCategories.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                              No sub-categories available for this category.
                            </div>
                          ) : (
                            subCategories.map(sub => {
                              const isActive = (activeSubCategory || subCategories[0]?.subCategory) === sub.subCategory;
                              const selCount = sub.items.filter(item => selectedCategoryIds.includes(item.id)).length;
                              return (
                                <button
                                  key={sub.subCategory}
                                  type="button"
                                  onClick={() => setActiveSubCategory(sub.subCategory)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    textAlign: 'left',
                                    border: isActive ? '1.5px solid #14B8A6' : '1px solid #CBD5E1',
                                    background: isActive ? 'rgba(20,184,166,0.14)' : (isPublicPage ? '#0F172A' : '#FFFFFF'),
                                    color: isActive ? (isPublicPage ? '#FFF' : '#0F172A') : (isPublicPage ? '#CBD5E1' : '#334155'),
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: isActive ? 800 : 600 }}>{sub.subCategory}</div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{sub.items.length} capabilities</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {selCount > 0 && (
                                      <span style={{ fontSize: 11, fontWeight: 800, background: '#16A34A', color: '#FFF', borderRadius: 999, padding: '2px 7px' }}>
                                        ✓ {selCount}
                                      </span>
                                    )}
                                    <ChevronRight size={15} style={{ color: isActive ? '#14B8A6' : '#94A3B8' }} />
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* 3. Sub-Sub-Category / Specific Capabilities Column */}
                      <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <CheckCircle2 size={14} /> 3. Specific Capabilities
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {currentCatNode?.category} → <strong style={{ color: isPublicPage ? '#FFF' : '#0F172A' }}>{currentSubNode?.subCategory || 'Select Sub-Category'}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 350, paddingRight: 4 }}>
                          {currentItems.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                              Please select a Category and Sub-Category to view specific capabilities.
                            </div>
                          ) : (
                            currentItems.map(item => {
                              const isSelected = selectedCategoryIds.includes(item.id);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleToggleCategoryCapability(item.id)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: isSelected ? '1.5px solid #14B8A6' : '1px solid #CBD5E1',
                                    background: isSelected ? 'rgba(20,184,166,0.12)' : (isPublicPage ? '#0F172A' : '#FFFFFF'),
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 10
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // Controlled by container onClick
                                    style={{ marginTop: 3, cursor: 'pointer', accentColor: '#14B8A6' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                                        {item.name}
                                      </span>
                                      <span style={{ fontSize: 10, fontWeight: 700, background: isSelected ? '#14B8A6' : '#64748B', color: '#FFF', borderRadius: 4, padding: '1px 5px' }}>
                                        {item.categoryCode}
                                      </span>
                                    </div>
                                    {item.description && (
                                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 1.4 }}>
                                        {item.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {apiError && (
                    <div style={{ marginTop: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                      ⚠️ {apiError}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 18, borderTop: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0' }}>
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSaving}
                      style={{ height: 42, padding: '0 20px', borderRadius: 8, background: 'transparent', color: isPublicPage ? '#94A3B8' : '#475569', border: '1px solid #CBD5E1', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                    >
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
                      {isSaving ? 'Saving Capabilities...' : 'Continue to Batch Size & Delivery Schedule →'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 4 — CATEGORY SUPPLY DETAILS (BATCH SIZE & DELIVERY SCHEDULE) */}
            {currentStep === 4 && (
              <div style={{ background: isPublicPage ? '#0F172A' : '#FFFFFF', border: isPublicPage ? '1px solid #1E293B' : '1px solid #E2E8F0', borderRadius: 14, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A', margin: 0 }}>Category Supply Details</h2>
                  <div style={{ fontSize: 12.5, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>Define Batch Size and typical delivery schedule for each category you manufacture.</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedCategoriesList.map(category => {
                    const supply = categorySupplyDetailsMap[category.id] || { batchSize: 1000, deliveryScheduleDays: 14 };
                    return (
                      <div key={category.id} style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                            {category.fullName || category.name}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, background: '#14B8A6', color: '#FFF', borderRadius: 4, padding: '2px 7px' }}>
                            {category.code}
                          </span>
                        </div>
                        {category.description && category.description !== category.name && (
                          <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 14 }}>{category.description}</div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          {/* Renamed MOQ to Batch Size */}
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Batch Size *</label>
                            <input
                              type="number"
                              min="1"
                              value={supply.batchSize}
                              onChange={e => setCategorySupplyDetailsMap(prev => ({
                                ...prev,
                                [category.id]: { ...prev[category.id], batchSize: Number(e.target.value) || 0 }
                              }))}
                              style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}
                            />
                            <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>Units / Batch</div>
                          </div>

                          {/* Renamed delivery field to Delivery Schedule */}
                          <div>
                            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: isPublicPage ? '#CBD5E1' : '#334155', marginBottom: 4 }}>Delivery Schedule (Days) *</label>
                            <input
                              type="number"
                              min="1"
                              value={supply.deliveryScheduleDays}
                              onChange={e => setCategorySupplyDetailsMap(prev => ({
                                ...prev,
                                [category.id]: { ...prev[category.id], deliveryScheduleDays: Number(e.target.value) || 0 }
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
                      <button type="button" onClick={() => handleOpenMfgModal('company')} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                      <div>Company: <strong>{companyDetails.companyName}</strong></div>
                      <div>Contact Person: <strong>{companyDetails.contactPerson} ({companyDetails.designation})</strong></div>
                      <div>Facility: <strong>{companyDetails.facilityAddress}, {companyDetails.city}, {companyDetails.state}</strong></div>
                      <div>Plant Capacity: <strong>{companyDetails.mfgCapacity || '—'}</strong></div>
                      <div>Email: <strong>{companyDetails.email}</strong> {isEmailVerified && <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>✓ Verified (Demo)</span>}</div>
                      <div>Phone: <strong>{companyDetails.phone}</strong> {isMobileVerified && <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>✓ Verified (Demo)</span>}</div>
                    </div>
                  </div>

                  {/* Section 2: Certifications Summary */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                        2. Compliance & Documents ({MANDATORY_CERTIFICATIONS.filter(c => certificationsMap[c.key]?.uploaded).length}/{MANDATORY_CERTIFICATIONS.length} Uploaded)
                      </span>
                      <button type="button" onClick={() => handleOpenMfgModal('certifications')} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      {ORIGINAL_MANUFACTURER_DOCUMENTS.map(c => {
                        const doc = certificationsMap[c.key];
                        return (
                          <div key={c.key} style={{ padding: '8px 10px', background: isPublicPage ? '#0F172A' : '#FFF', borderRadius: 6, border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>✓ {c.name}</div>
                              <div style={{ color: doc?.uploaded ? '#10B981' : '#64748B', fontSize: 11, marginTop: 2 }}>
                                {doc?.uploaded ? `📄 ${doc.fileName || 'Uploaded'}` : 'Not Uploaded'}
                              </div>
                            </div>
                            {doc?.id && (
                              <button
                                type="button"
                                onClick={() => handleViewDoc(doc.id)}
                                style={{ background: 'none', border: 'none', color: '#14B8A6', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                              >
                                <Eye size={12} /> View
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {otherCertsList.map((doc, idx) => (
                        <div key={doc.id || idx} style={{ padding: '8px 10px', background: isPublicPage ? '#0F172A' : '#FFF', borderRadius: 6, border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>✓ {doc.name}</div>
                            <div style={{ color: '#10B981', fontSize: 11, marginTop: 2 }}>
                              📄 {doc.fileName || 'Uploaded'}
                            </div>
                          </div>
                          {doc?.id && (
                            <button
                              type="button"
                              onClick={() => handleViewDoc(doc.id)}
                              style={{ background: 'none', border: 'none', color: '#14B8A6', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3 & 4: Category Capabilities, Batch Size & Delivery Schedules Table */}
                  {/* Category column removed from final review page as explicitly required */}
                  <div style={{ background: isPublicPage ? '#1E293B' : '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #CBD5E1', paddingBottom: 8, marginBottom: 10 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: isPublicPage ? '#FFF' : '#0F172A' }}>3 & 4. Manufacturing Capabilities & Supply Details ({selectedCategoriesList.length} Capabilities)</span>
                      <button type="button" onClick={() => handleOpenMfgModal('capabilities')} style={{ background: 'none', border: 'none', color: '#14B8A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #CBD5E1', color: '#64748B' }}>
                            <th style={{ padding: '6px 8px' }}>Capability / Specification</th>
                            <th style={{ padding: '6px 8px' }}>Batch Size</th>
                            <th style={{ padding: '6px 8px' }}>Delivery Schedule</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCategoriesList.map(c => {
                            const supply = categorySupplyDetailsMap[c.id] || { batchSize: 1000, deliveryScheduleDays: 14 };
                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <td style={{ padding: '8px' }}>
                                  <div style={{ fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                                    {c.fullName || c.name}
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2 }}>
                                    Capability Code: <span style={{ fontWeight: 700 }}>{c.code}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '8px', fontWeight: 700 }}>{supply.batchSize.toLocaleString()} Units</td>
                                <td style={{ padding: '8px', fontWeight: 700, color: '#14B8A6' }}>{supply.deliveryScheduleDays} Days</td>
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

      {/* REVIEW EDIT MODAL */}
      {activeMfgModal && (
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
            if (e.target === e.currentTarget) handleCloseMfgModal();
          }}
        >
          <div
            style={{
              background: isPublicPage ? '#0F172A' : '#FFFFFF',
              border: isPublicPage ? '1px solid #1E293B' : '1px solid #CBD5E1',
              borderRadius: 14,
              width: '100%',
              maxWidth: activeMfgModal === 'company' ? 620 : 720,
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
                  {activeMfgModal === 'company' && 'Edit Company Details'}
                  {activeMfgModal === 'certifications' && 'Edit Compliance & Certifications'}
                  {activeMfgModal === 'capabilities' && 'Edit Capabilities & Supply Details'}
                </h3>
                <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                  Update manufacturer details directly on the review screen
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseMfgModal}
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
              {mfgModalError && (
                <div style={{ marginBottom: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                  ⚠️ {mfgModalError}
                </div>
              )}

              {/* COMPANY DETAILS MODAL */}
              {activeMfgModal === 'company' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.companyName}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, companyName: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.contactPerson}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, contactPerson: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Designation *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.designation}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, designation: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Official Email *
                    </label>
                    <input
                      type="email"
                      value={draftCompanyDetails.email}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, email: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Phone / Mobile *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.phone}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, phone: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Facility Address *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.facilityAddress}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, facilityAddress: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      City *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.city}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, city: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      State *
                    </label>
                    <select
                      value={draftCompanyDetails.state}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, state: e.target.value })}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        borderRadius: 8,
                        border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1',
                        background: isPublicPage ? '#1E293B' : '#FFF',
                        color: draftCompanyDetails.state ? (isPublicPage ? '#FFF' : '#0F172A') : (isPublicPage ? '#94A3B8' : '#94A3B8'),
                        fontSize: 13,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s} style={{ background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Pincode *
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.pincode}
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, pincode: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Plant Capacity (Optional)
                    </label>
                    <input
                      type="text"
                      value={draftCompanyDetails.mfgCapacity}
                      placeholder="e.g. 50M units/month"
                      onChange={e => setDraftCompanyDetails({ ...draftCompanyDetails, mfgCapacity: e.target.value })}
                      style={{ width: '100%', height: 38, padding: '0 12px', borderRadius: 8, border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1', background: isPublicPage ? '#1E293B' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 13 }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isPublicPage ? '#E2E8F0' : '#334155', marginBottom: 6 }}>
                      Portal Password
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

              {/* CERTIFICATIONS MODAL */}
              {activeMfgModal === 'certifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B' }}>
                    All required statutory manufacturing documents must be uploaded.
                  </div>
                  {ORIGINAL_MANUFACTURER_DOCUMENTS.map(c => {
                    const isRequired = c.key === 'whoGmpCert' ? (whoGmpApplicable !== false) : c.isMandatory;
                    const doc = draftCertificationsMap[c.key] || {
                      key: c.key,
                      name: c.name,
                      code: c.code,
                      fileName: '',
                      uploaded: false,
                      issueDate: '',
                      expiryDate: '',
                      documentNumber: ''
                    };
                    return (
                      <div
                        key={c.key}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          background: isPublicPage ? '#1E293B' : '#F8FAFC',
                          border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>{c.name}</span>
                            {isRequired ? (
                              <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 700 }}>(Required)</span>
                            ) : (
                              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>(Optional)</span>
                            )}
                          </div>
                          {doc.uploaded ? (
                            <div style={{ fontSize: 11.5, color: '#10B981', fontWeight: 600, marginTop: 3 }}>
                              ✓ Uploaded: {doc.fileName}
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: isPublicPage ? '#94A3B8' : '#64748B', marginTop: 3 }}>
                              Not Uploaded
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {doc.uploaded && doc.id && (
                            <button
                              type="button"
                              onClick={() => handleViewDoc(doc.id)}
                              style={{
                                height: 34,
                                padding: '0 10px',
                                borderRadius: 6,
                                background: isPublicPage ? '#334155' : '#E2E8F0',
                                color: isPublicPage ? '#E2E8F0' : '#1E293B',
                                border: isPublicPage ? '1px solid #475569' : '1px solid #CBD5E1',
                                fontWeight: 700,
                                fontSize: 11.5,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleModalCertUpload(c.key, c.name)}
                            style={{
                              height: 34,
                              padding: '0 14px',
                              borderRadius: 6,
                              background: '#14B8A6',
                              color: '#FFF',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: 11.5,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <Upload size={12} /> {doc.uploaded ? 'Replace' : 'Upload Document'}
                          </button>
                          {doc.uploaded && (
                            <button
                              type="button"
                              onClick={() => handleModalCertRemove(c.key)}
                              style={{
                                height: 34,
                                padding: '0 10px',
                                borderRadius: 6,
                                background: 'none',
                                border: '1px solid #EF4444',
                                color: '#EF4444',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CAPABILITIES & SUPPLY DETAILS MODAL */}
              {activeMfgModal === 'capabilities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, color: isPublicPage ? '#94A3B8' : '#64748B' }}>
                    Adjust Batch Size (Units) and Delivery Schedule (Days) for each of your selected manufacturing capabilities.
                  </div>
                  {selectedCategoriesList.map(category => {
                    const supply = draftSupplyDetailsMap[category.id] || { batchSize: 1000, deliveryScheduleDays: 14 };
                    return (
                      <div
                        key={category.id}
                        style={{
                          padding: 14,
                          borderRadius: 8,
                          background: isPublicPage ? '#1E293B' : '#F8FAFC',
                          border: isPublicPage ? '1px solid #334155' : '1px solid #CBD5E1'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: isPublicPage ? '#FFF' : '#0F172A' }}>
                              {category.fullName || category.name}
                            </span>
                            <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, background: '#14B8A6', color: '#FFF', borderRadius: 4, padding: '1px 6px' }}>
                              {category.code}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                              Batch Size (Units) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={supply.batchSize}
                              onChange={e => setDraftSupplyDetailsMap(prev => ({
                                ...prev,
                                [category.id]: {
                                  ...prev[category.id],
                                  batchSize: Number(e.target.value) || 0,
                                  deliveryScheduleDays: prev[category.id]?.deliveryScheduleDays || 14
                                }
                              }))}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 12.5 }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                              Delivery Schedule (Days) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={supply.deliveryScheduleDays}
                              onChange={e => setDraftSupplyDetailsMap(prev => ({
                                ...prev,
                                [category.id]: {
                                  ...prev[category.id],
                                  batchSize: prev[category.id]?.batchSize || 1000,
                                  deliveryScheduleDays: Number(e.target.value) || 0
                                }
                              }))}
                              style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: isPublicPage ? '#0F172A' : '#FFF', color: isPublicPage ? '#FFF' : '#0F172A', fontSize: 12.5 }}
                            />
                          </div>
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
                onClick={handleCloseMfgModal}
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
                  if (activeMfgModal === 'company') handleSaveMfgCompany();
                  else if (activeMfgModal === 'certifications') handleSaveMfgCertifications();
                  else if (activeMfgModal === 'capabilities') handleSaveMfgCapabilities();
                }}
                style={{
                  height: 38,
                  padding: '0 22px',
                  borderRadius: 8,
                  background: '#14B8A6',
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

