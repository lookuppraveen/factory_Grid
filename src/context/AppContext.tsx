import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole, Customer, Manufacturer, Product, RFQ,
  ManufacturerQuote, MasterOrder, Invoice, ComplianceCase,
  NotificationItem, SubOrderStatus, ManufacturerProductMapping,
  BuyerOnboarding, ManufacturerOnboarding, Shipment, CRMLead,
  PaymentTransaction, AuditLog, CustomerVerificationRequest,
  CustomerVerificationStatus, CustomerVerificationDocument,
  UserProfile, OrganizationProfile, UserDocument, ProfileDocStatus, DocumentVersion,
  CustomerClassification
} from '../types';
import {
  mockCustomers, mockManufacturers, mockProducts, mockRFQs,
  mockQuotes, mockMasterOrders, mockInvoices, mockComplianceCases,
  mockNotifications, mockManufacturerProductMappings,
  mockBuyerOnboardings, mockManufacturerOnboardings, mockShipments,
  mockCRMLeads, mockPaymentTransactions, mockAuditLogs,
  mockCustomerVerifications,
  mockCategories, mockSubCategories, mockSubSubCategories, mockCategoryMargins, mockMarginRules,
  mockInternalPriceList
} from '../data/mockData';
import { CategoryMaster, SubCategoryMaster, SubSubCategoryMaster, CategoryMargin, MarginRule, MarginType, MarginScopeType, InternalPriceListItem, ProductMargin, PlatformFeeConfig } from '../types';
import { ShipmentCredentials } from '../services/connectors/types';
import { GSTCredentials } from '../services/connectors/gstTypes';
import { verifyTOTPToken, generateRecoveryCodes } from '../services/auth/totpUtils';

export interface TwoFactorState {
  isEnabled: boolean;
  secret?: string;
  enabledAt?: string;
  recoveryCodes: { code: string; isUsed: boolean; usedAt?: string }[];
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customers: Customer[];
  manufacturers: Manufacturer[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProductMaster: (product: Product) => void;
  updateProductMaster: (productId: string, updatedFields: Partial<Product>) => void;
  toggleProductMasterStatus: (productId: string) => void;
  categories: CategoryMaster[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryMaster[]>>;
  categoryMargins: CategoryMargin[];
  setCategoryMargins: React.Dispatch<React.SetStateAction<CategoryMargin[]>>;
  marginRules: MarginRule[];
  setMarginRules: React.Dispatch<React.SetStateAction<MarginRule[]>>;
  addOrUpdateMarginRule: (rule: Partial<MarginRule>) => void;
  deleteMarginRule: (ruleId: string) => void;
  getApplicableMargin: (params: {
    productId?: string;
    sku?: string;
    manufacturerId?: string;
    categoryId?: string;
    categoryName?: string;
    isGeneric?: boolean;
    basePrice?: number;
  }) => {
    marginType: MarginType;
    marginValue: number;
    marginPercentage: number;
    marginRate?: number;
    ruleType: 'PRODUCT' | 'MFG_CATEGORY' | 'MANUFACTURER' | 'CATEGORY' | 'DEFAULT';
    ruleSource: string;
    matchingRule?: MarginRule;
    calculateSellingPrice: (baseUnitPrice: number) => number;
    calculateMarginAmount: (baseUnitPrice: number) => number;
    platformFeeAmount?: number;
    platformFeePercent?: number;
    calculateCommercialPrice?: (baseUnitPrice: number) => number;
    calculatePlatformFee?: (baseUnitPrice: number) => number;
  };
  platformFeeConfig: PlatformFeeConfig;
  updatePlatformFeeConfig: (updates: Partial<PlatformFeeConfig>) => void;
  updateProductMargin: (productId: string, manufacturerId: string, marginType: MarginType, marginValue: number) => void;
  bulkUpdateProductMargins: (updates: { manufacturerId: string; productId: string; marginType: MarginType; marginValue: number; mfgProductCode?: string }[]) => { updatedCount: number; errors: string[] };
  addCategory: (category: CategoryMaster) => void;
  updateCategory: (id: string, updates: Partial<CategoryMaster>) => void;
  deleteCategory: (id: string) => void;
  toggleCategoryStatus: (id: string) => void;
  updateCategoryMargin: (categoryIdOrName: string, marginValue: number, marginType?: MarginType) => void;
  getCategoryMargin: (categoryNameOrId?: string) => number;
  getCategoryMarginConfig: (categoryNameOrId?: string) => {
    marginType: MarginType;
    marginValue: number;
    marginPercentage: number;
    marginRate?: number;
  };
  subCategories: SubCategoryMaster[];
  setSubCategories: React.Dispatch<React.SetStateAction<SubCategoryMaster[]>>;
  addSubCategory: (subCat: SubCategoryMaster) => void;
  updateSubCategory: (id: string, updates: Partial<SubCategoryMaster>) => void;
  deleteSubCategory: (id: string) => void;
  toggleSubCategoryStatus: (id: string) => void;
  subSubCategories: SubSubCategoryMaster[];
  setSubSubCategories: React.Dispatch<React.SetStateAction<SubSubCategoryMaster[]>>;
  addSubSubCategory: (subSubCat: SubSubCategoryMaster) => void;
  updateSubSubCategory: (id: string, updates: Partial<SubSubCategoryMaster>) => void;
  deleteSubSubCategory: (id: string) => void;
  toggleSubSubCategoryStatus: (id: string) => void;
  mappings: ManufacturerProductMapping[];
  setMappings: React.Dispatch<React.SetStateAction<ManufacturerProductMapping[]>>;
  addMapping: (mapping: ManufacturerProductMapping) => void;
  updateMapping: (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => void;
  removeMapping: (productId: string, manufacturerId: string) => void;
  rfqs: RFQ[];
  quotes: ManufacturerQuote[];
  orders: MasterOrder[];
  invoices: Invoice[];
  complianceCases: ComplianceCase[];
  notifications: NotificationItem[];
  buyerOnboardings: BuyerOnboarding[];
  manufacturerOnboardings: ManufacturerOnboarding[];
  shipments: Shipment[];
  crmLeads: CRMLead[];
  paymentTransactions: PaymentTransaction[];
  auditLogs: AuditLog[];
  customerVerifications: CustomerVerificationRequest[];

  // Manufacturer Profile Navigation Context
  selectedMfgIdForProfile: string | null;
  setSelectedMfgIdForProfile: (id: string | null) => void;
  mfgProfileProductContext: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null;
  setMfgProfileProductContext: (ctx: { productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null) => void;

  // Unified RFQ Creation Drawer State
  isCreateRfqDrawerOpen: boolean;
  setIsCreateRfqDrawerOpen: (open: boolean) => void;
  openCreateRfqDrawer: () => void;

  // Declined RFQ tracking
  declinedRfqs: Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>;
  declineRFQ: (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => void;

  // Buyer <-> Manufacturer Negotiation & Revised Quotes
  negotiationThreads: Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>;
  sendNegotiationMessage: (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => void;
  revisedQuotes: Record<string, { unitPrice: number; taxPercent?: number; discountPercent?: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>;
  submitRevisedQuote: (threadKey: string, data: { unitPrice: number; taxPercent?: number; discountPercent?: number; leadTimeDays: number; moq: number; remarks?: string }) => void;

  // Action Handlers
  addRFQ: (newRfq: RFQ) => void;
  submitQuote: (quote: ManufacturerQuote) => void;
  selectQuoteAndCreateOrder: (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => void;
  internalPriceList: InternalPriceListItem[];
  submitGenericAdminPricing: (rfqId: string, linePrices: Record<string, number>) => void;
  updatePODeliveryAddress: (orderId: string, address: string) => void;
  updateSubOrderArtwork: (subCode: string, artworkFileObj: any) => void;
  regeneratePO: (orderId: string, selectedLineIds?: string[]) => void;
  submitPOToBuyer: (orderId: string) => void;
  placeOrderOnHold: (orderId: string, reason: string) => void;
  releaseOrderHold: (orderId: string) => void;
  updateSubOrderStatus: (subOrderId: string, status: SubOrderStatus) => void;
  verifyComplianceDocument: (caseId: string, docName: string, passed: boolean) => void;
  approveComplianceCase: (caseId: string) => void;
  addInvoice: (newInvoice: Invoice) => void;
  updateInvoice: (invoiceId: string, updatedFields: Partial<Invoice>) => void;
  updateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  deleteInvoice: (invoiceId: string) => void;
  sendInvoiceToCustomer: (invoiceId: string) => void;
  recordInvoicePayment: (invoiceId: string, amount: number, method?: string, ref?: string, currency?: string, paymentDate?: string) => void;
  submitBuyerOnboarding: (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  submitManufacturerOnboarding: (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => void;
  approveBuyerOnboarding: (id: string) => void;
  approveManufacturerOnboarding: (id: string) => void;
  updateShipmentStatus: (shipmentId: string, status: Shipment['status']) => void;
  addCRMInteraction: (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => void;
  addAuditLog: (module: string, action: string) => void;

  // Customer Verification Workflow Handlers
  submitCustomerVerificationRequest: (reqData: Partial<CustomerVerificationRequest>) => void;
  assignComplianceOfficer: (requestId: string, officerName: string) => void;
  approveCustomerVerification: (requestId: string) => void;
  rejectCustomerVerification: (requestId: string, reason: string) => void;
  requestMoreCustomerDocs: (requestId: string, notes: string[]) => void;
  resubmitCustomerDocs: (requestId: string, docs: CustomerVerificationDocument[]) => void;
  updateCustomerClassification: (targetIdOrNameOrCode: string, classification: CustomerClassification) => void;
  activeBuyerAccount: 'NORMAL' | 'SPECIAL_PARTY';
  setActiveBuyerAccount: (account: 'NORMAL' | 'SPECIAL_PARTY') => void;
  resetDemoState: () => void;

  // My Profile & Organization Profile Management
  userProfile: UserProfile;
  orgProfile: OrganizationProfile;
  userDocuments: UserDocument[];
  profileSubTab: 'personal' | 'organization' | 'documents' | 'security';
  setProfileSubTab: (tab: 'personal' | 'organization' | 'documents' | 'security') => void;
  updateUserProfile: (updatedFields: Partial<UserProfile>) => void;
  updateOrgProfile: (updatedFields: Partial<OrganizationProfile>) => void;
  uploadUserDocument: (docData: Partial<UserDocument>) => void;
  replaceUserDocument: (docId: string, docData: Partial<UserDocument>) => void;

  // Shipment & GST Connectors State
  shipmentConnectors: Record<string, ShipmentCredentials>;
  gstConnectors: Record<string, GSTCredentials>;
  saveShipmentConnector: (providerId: string, creds: ShipmentCredentials) => void;
  disconnectShipmentConnector: (providerId: string) => void;
  saveGSTConnector: (providerId: string, creds: GSTCredentials) => void;
  disconnectGSTConnector: (providerId: string) => void;
  changeUserPassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  openProfileTab: (subTab?: 'personal' | 'organization' | 'documents' | 'security') => void;

  // Two-Factor Authentication (2FA) State & Security Handlers
  twoFactorState: TwoFactorState;
  enable2FA: (secret: string, recoveryCodes: string[]) => void;
  disable2FA: (currentPass: string, totpCode: string) => Promise<{ success: boolean; message: string }>;
  verify2FAAttempt: (totpCode: string) => Promise<{ success: boolean; message: string }>;
  useRecoveryCode: (code: string) => { success: boolean; message: string };
  regenerateRecoveryCodes: (currentPass: string, totpCode: string) => Promise<{ success: boolean; message: string; newCodes?: string[] }>;

  // Global Dynamic Filter & Cross-Entity Navigation
  moduleFilters: Record<string, string>;
  setModuleFilter: (module: string, statusFilter: string) => void;
  navigateWithFilter: (tab: string, statusFilter?: string) => void;
  openManufacturerProfile: (mfgId: string, initialTab?: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE') => void;
  mfgProfileInitialTab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE';
  setMfgProfileInitialTab: (tab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE') => void;
}

// ── DEFAULT PROFILE DATA DEFINITIONS ─────────────────────────────────
export const defaultSupplierProfile: UserProfile = {
  id: 'usr_mfg_001',
  fullName: 'Rajesh Sharma',
  email: 'rajesh@sunbiolabs.com',
  phone: '+91 98765 43210',
  jobTitle: 'Vice President - Operations & Plant Head',
  role: 'SUPPLIER',
  department: 'Manufacturing & Quality Assurance',
  accountStatus: 'Active',
  lastLogin: 'Today, 10:15 AM',
  avatarUrl: ''
};

export const defaultSupplierOrg: OrganizationProfile = {
  id: 'org_mfg_001',
  companyName: 'SunBio Labs Pvt Ltd',
  companyCode: 'MFG-2026-001',
  businessType: 'Private Limited Manufacturer',
  industry: 'Pharmaceutical Formulations',
  contactEmail: 'contact@sunbiolabs.com',
  contactPhone: '+91 1795 244100',
  registeredAddress: 'Plot No. 42-45, Export Promotion Industrial Park, Phase I',
  city: 'Baddi',
  state: 'Himachal Pradesh',
  country: 'India',
  pincode: '173205',
  website: 'https://www.sunbiolabs.com',
  gstin: '02AAACS1234F1Z9',
  pan: 'AAACS1234F',
  cinNumber: 'U24231HP2012PTC001234',
  mfgLicenseNo: 'ML-HP-2024-001',
  whoGmpNo: 'WHO-GMP-HP-8899',
  isVerified: true
};

export const defaultSupplierDocs: UserDocument[] = [
  {
    id: 'doc_mfg_1',
    documentName: 'GST Registration Certificate',
    documentType: 'GST Certificate',
    documentNumber: '02AAACS1234F1Z9',
    issueDate: '2022-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Verified via GST portal API.',
    fileName: 'SunBio_GST_Certificate_2025.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_2',
    documentName: 'PAN Card Document',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAACS1234F',
    issueDate: '2012-06-15',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Valid PAN record match.',
    fileName: 'SunBio_PAN_Card.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_3',
    documentName: 'Company Certificate of Incorporation',
    documentType: 'Company Registration Certificate',
    documentNumber: 'U24231HP2012PTC001234',
    issueDate: '2012-03-20',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'ROC Himachal Pradesh verified.',
    fileName: 'SunBio_Incorporation_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_4',
    documentName: 'State FDA Manufacturing License (Form 25/28)',
    documentType: 'Manufacturing License',
    documentNumber: 'ML-HP-2024-001',
    issueDate: '2024-01-01',
    expiryDate: '2029-12-31',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'State FDA Officer',
    verificationDate: '2025-11-15',
    remarks: 'Valid for Oral Solids & Injectables.',
    fileName: 'Manufacturing_License_HP_2024.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_5',
    documentName: 'WHO-GMP Certification Audit Report',
    documentType: 'Drug License / applicable regulatory license',
    documentNumber: 'WHO-GMP-HP-8899',
    issueDate: '2025-06-01',
    expiryDate: '2027-05-31',
    uploadedDate: '2026-08-01',
    lastUpdated: '2026-08-01',
    verificationStatus: 'PENDING VERIFICATION',
    remarks: 'Under final audit review by CDSCO inspector.',
    fileName: 'WHO_GMP_Certificate_2026.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_6',
    documentName: 'Bank Cancelled Cheque / Account Mandate',
    documentType: 'Bank / Payment Details',
    documentNumber: 'HDFC0000123',
    issueDate: '2024-02-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Finance Controller',
    verificationDate: '2025-11-11',
    remarks: 'Penny drop verification successful.',
    fileName: 'SunBio_Cancelled_Cheque.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_7',
    documentName: 'ISO 9001:2015 Quality Systems Certificate',
    documentType: 'Quality Certificates',
    documentNumber: 'ISO-9001-QUAL-4421',
    issueDate: '2024-03-15',
    expiryDate: '2027-03-14',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'ISO registrar verified.',
    fileName: 'ISO_9001_Quality_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_mfg_8',
    documentName: 'Pollution Control Board Clearance (NOC)',
    documentType: 'Other Business Documents',
    documentNumber: 'PCB-HP-2025-881',
    issueDate: '2025-01-10',
    expiryDate: '2028-01-09',
    uploadedDate: '2025-11-10',
    lastUpdated: '2025-11-10',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk Officer',
    verificationDate: '2025-11-12',
    remarks: 'Effluent treatment plant compliant.',
    fileName: 'Pollution_Control_NOC.pdf',
    fileUrl: '#'
  }
];

export const defaultBuyerProfile: UserProfile = {
  id: 'usr_buyer_001',
  fullName: 'Dr. Vikram Sethi',
  email: 'v.sethi@apexpharma.com',
  phone: '+91 98112 34567',
  jobTitle: 'Chief Procurement Officer (CPO)',
  role: 'BUYER',
  department: 'Global Sourcing & Supply Chain',
  accountStatus: 'Active',
  lastLogin: 'Today, 09:45 AM',
  avatarUrl: ''
};

export const defaultBuyerOrg: OrganizationProfile = {
  id: 'org_buyer_001',
  companyName: 'Apex Pharma Ltd',
  companyCode: 'BUY-2026-001',
  businessType: 'Public Limited Company',
  industry: 'Pharmaceutical Sourcing & Distribution',
  contactEmail: 'sourcing@apexpharma.com',
  contactPhone: '+91 22 6789 0000',
  registeredAddress: 'Apex Tower, Off Western Express Highway, Goregaon East',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  pincode: '400063',
  website: 'https://www.apexpharma.com',
  gstin: '27AAACA9876E1Z2',
  pan: 'AAACA9876E',
  cinNumber: 'L24239MH2005PLC154321',
  isVerified: true
};

export const defaultSpecialPartyBuyerProfile: UserProfile = {
  id: 'usr_buyer_sp_001',
  fullName: 'Dr. Ananya Sharma',
  email: 'a.sharma@mediplushealth.com',
  phone: '+91 98123 45678',
  jobTitle: 'VP Procurement (Special Party)',
  role: 'BUYER',
  department: 'Strategic Sourcing Desk',
  accountStatus: 'Active',
  lastLogin: 'Today, 10:15 AM',
  avatarUrl: ''
};

export const defaultSpecialPartyBuyerOrg: OrganizationProfile = {
  id: 'org_buyer_sp_001',
  companyName: 'MediPlus Healthcare (Special Party Demo)',
  companyCode: 'CUS000105',
  businessType: 'Private Limited Company',
  industry: 'Special Sourcing & PCD Supply',
  contactEmail: 'procurement@mediplushealth.com',
  contactPhone: '+91 98123 45678',
  registeredAddress: 'Tower B, Cyber City, DLF Phase 2',
  city: 'Gurugram',
  state: 'Haryana',
  country: 'India',
  pincode: '122002',
  website: 'https://www.mediplushealth.com',
  gstin: '06EEEEE5555E1Z7',
  pan: 'EEEEE5555E',
  cinNumber: 'U24239HR2021PTC099123',
  isVerified: true
};

export const defaultBuyerDocs: UserDocument[] = [
  {
    id: 'doc_buyer_1',
    documentName: 'GST Registration Certificate',
    documentType: 'GST Certificate',
    documentNumber: '27AAACA9876E1Z2',
    issueDate: '2020-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'Verified via GSTN API.',
    fileName: 'Apex_GST_Certificate.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_2',
    documentName: 'Corporate PAN Card',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAACA9876E',
    issueDate: '2005-08-12',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'Verified.',
    fileName: 'Apex_PAN_Card.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_3',
    documentName: 'Certificate of Incorporation (ROC)',
    documentType: 'Company Registration Certificate',
    documentNumber: 'L24239MH2005PLC154321',
    issueDate: '2005-08-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Compliance Desk',
    verificationDate: '2025-10-16',
    remarks: 'ROC Mumbai verified.',
    fileName: 'Apex_Incorporation_Cert.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_4',
    documentName: 'Wholesale Drug License (Form 20B / 21B)',
    documentType: 'Drug License',
    documentNumber: 'MH-MZ4-2023-9091',
    issueDate: '2023-05-01',
    expiryDate: '2028-04-30',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Maharashtra FDA',
    verificationDate: '2025-10-18',
    remarks: 'Valid for wholesale distribution.',
    fileName: 'Wholesale_Drug_License_MH.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_5',
    documentName: 'Corporate Bank Mandate / Penny Drop',
    documentType: 'Bank / Payment Details',
    documentNumber: 'ICIC0000999',
    issueDate: '2024-01-10',
    expiryDate: 'N/A',
    uploadedDate: '2025-10-15',
    lastUpdated: '2025-10-15',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Accounts Desk',
    verificationDate: '2025-10-16',
    remarks: 'Bank account verified.',
    fileName: 'Apex_Bank_Mandate.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_buyer_6',
    documentName: 'Import Export Code (IEC) Certificate',
    documentType: 'Other Business Documents',
    documentNumber: 'IEC0305991288',
    issueDate: '2021-02-15',
    expiryDate: 'N/A',
    uploadedDate: '',
    lastUpdated: '',
    verificationStatus: 'NOT UPLOADED',
    remarks: 'Optional for domestic sourcing.',
    fileName: '',
    fileUrl: ''
  }
];

export const defaultAdminProfile: UserProfile = {
  id: 'usr_admin_001',
  fullName: 'Platform Admin',
  email: 'admin@factorygrid.com',
  phone: '+91 80 4567 8900',
  jobTitle: 'Principal Systems & Platform Administrator',
  role: 'ADMIN',
  department: 'Platform Operations & Security',
  accountStatus: 'Active',
  lastLogin: 'Just now',
  avatarUrl: ''
};

export const defaultAdminOrg: OrganizationProfile = {
  id: 'org_admin_001',
  companyName: 'FactoryGrid Technologies India Pvt Ltd',
  companyCode: 'FG-HQ-001',
  businessType: 'Enterprise SaaS Platform Operator',
  industry: 'B2B Industrial & Healthcare Tech',
  contactEmail: 'support@factorygrid.com',
  contactPhone: '+91 80 4567 8900',
  registeredAddress: '5th Floor, Technology Park, Outer Ring Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pincode: '560103',
  website: 'https://www.factorygrid.com',
  gstin: '29AAFCS9999P1Z8',
  pan: 'AAFCS9999P',
  cinNumber: 'U72200KA2021PTC145678',
  isVerified: true
};

export const defaultAdminDocs: UserDocument[] = [
  {
    id: 'doc_admin_1',
    documentName: 'Platform GST Registration',
    documentType: 'GST Certificate',
    documentNumber: '29AAFCS9999P1Z8',
    issueDate: '2021-04-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-01-01',
    lastUpdated: '2025-01-01',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'System',
    verificationDate: '2025-01-01',
    remarks: 'Active GST registration.',
    fileName: 'FactoryGrid_GST.pdf',
    fileUrl: '#'
  },
  {
    id: 'doc_admin_2',
    documentName: 'Corporate PAN Card',
    documentType: 'PAN Card / PAN Document',
    documentNumber: 'AAFCS9999P',
    issueDate: '2021-03-01',
    expiryDate: 'N/A',
    uploadedDate: '2025-01-01',
    lastUpdated: '2025-01-01',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'System',
    verificationDate: '2025-01-01',
    remarks: 'Verified.',
    fileName: 'FactoryGrid_PAN.pdf',
    fileUrl: '#'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fg_auth');
      if (saved === 'false') return false;
    }
    return true;
  });
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('fg_role') as UserRole;
      if (savedRole) return savedRole;
    }
    return 'BUYER';
  });

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_role', role);
    }
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const login = (role?: UserRole) => {
    const effectiveRole = role || currentRole || 'BUYER';
    setCurrentRole(effectiveRole);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fg_auth', 'true');
      localStorage.setItem('fg_role', effectiveRole);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fg_auth');
      localStorage.removeItem('fg_role');
    }
  };

  // Active Buyer Account State (Normal Buyer vs Special Party Demo Buyer)
  const [activeBuyerAccount, setActiveBuyerAccountState] = useState<'NORMAL' | 'SPECIAL_PARTY'>('NORMAL');

  const setActiveBuyerAccount = (account: 'NORMAL' | 'SPECIAL_PARTY') => {
    setActiveBuyerAccountState(account);
    if (account === 'SPECIAL_PARTY') {
      setUserProfileState(defaultSpecialPartyBuyerProfile);
      setOrgProfileState(defaultSpecialPartyBuyerOrg);
      setCurrentRoleState('BUYER');
      addAuditLog('User Session', 'Switched active workspace to Special Party Demo Buyer (MediPlus Healthcare)');
    } else {
      setUserProfileState(defaultBuyerProfile);
      setOrgProfileState(defaultBuyerOrg);
      setCurrentRoleState('BUYER');
      addAuditLog('User Session', 'Switched active workspace to Normal Buyer (Apex Pharma)');
    }
  };

  // Helper getters for role-aware profile initial states
  const getInitialUserProfile = (role: UserRole): UserProfile => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_user_profile_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierProfile;
    if (role === 'ADMIN') return defaultAdminProfile;
    if (role === 'BUYER' && activeBuyerAccount === 'SPECIAL_PARTY') return defaultSpecialPartyBuyerProfile;
    return defaultBuyerProfile;
  };

  const getInitialOrgProfile = (role: UserRole): OrganizationProfile => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_org_profile_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierOrg;
    if (role === 'ADMIN') return defaultAdminOrg;
    if (role === 'BUYER' && activeBuyerAccount === 'SPECIAL_PARTY') return defaultSpecialPartyBuyerOrg;
    return defaultBuyerOrg;
  };

  const getInitialUserDocs = (role: UserRole): UserDocument[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`fg_user_documents_${role}`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    if (role === 'SUPPLIER') return defaultSupplierDocs;
    if (role === 'ADMIN') return defaultAdminDocs;
    return defaultBuyerDocs;
  };

  const [userProfile, setUserProfileState] = useState<UserProfile>(() => getInitialUserProfile(currentRole));
  const [orgProfile, setOrgProfileState] = useState<OrganizationProfile>(() => getInitialOrgProfile(currentRole));
  const [userDocuments, setUserDocumentsState] = useState<UserDocument[]>(() => getInitialUserDocs(currentRole));
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'organization' | 'documents' | 'security'>('personal');

  // Synchronize role profile state when role changes
  React.useEffect(() => {
    setUserProfileState(getInitialUserProfile(currentRole));
    setOrgProfileState(getInitialOrgProfile(currentRole));
    setUserDocumentsState(getInitialUserDocs(currentRole));
  }, [currentRole, activeBuyerAccount]);

  const updateUserProfile = (updatedFields: Partial<UserProfile>) => {
    setUserProfileState(prev => {
      const updated = { ...prev, ...updatedFields };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_profile_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('My Profile', `Updated personal profile information for ${userProfile.fullName}`);
  };

  const updateOrgProfile = (updatedFields: Partial<OrganizationProfile>) => {
    setOrgProfileState(prev => {
      const updated = {
        ...prev,
        ...updatedFields,
        companyCode: prev.companyCode, // protected read-only ID
        id: prev.id,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_org_profile_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Organization Profile', `Updated organization details for ${orgProfile.companyName}`);
  };

  const uploadUserDocument = (docData: Partial<UserDocument>) => {
    const timeStr = new Date().toISOString().split('T')[0];
    const newDoc: UserDocument = {
      id: 'doc_' + Date.now(),
      documentName: docData.documentName || docData.documentType || 'Uploaded Document',
      documentType: docData.documentType || 'Other Business Documents',
      documentNumber: docData.documentNumber || '',
      issueDate: docData.issueDate || timeStr,
      expiryDate: docData.expiryDate || 'N/A',
      uploadedDate: timeStr,
      lastUpdated: timeStr,
      verificationStatus: 'PENDING VERIFICATION',
      remarks: docData.remarks || 'Document uploaded. Pending compliance officer verification.',
      fileName: docData.fileName || 'Uploaded_Document.pdf',
      fileUrl: docData.fileUrl || '#',
      history: []
    };

    setUserDocumentsState(prev => {
      const updated = [newDoc, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_documents_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Documents & Verification', `Uploaded ${newDoc.documentName}. Status set to PENDING VERIFICATION.`);
  };

  const replaceUserDocument = (docId: string, docData: Partial<UserDocument>) => {
    const timeStr = new Date().toISOString().split('T')[0];
    setUserDocumentsState(prev => {
      const updated = prev.map(doc => {
        if (doc.id !== docId) return doc;

        const oldVersion: DocumentVersion = {
          version: (doc.history?.length || 0) + 1,
          uploadedDate: doc.uploadedDate || timeStr,
          fileName: doc.fileName || 'Previous_Version.pdf',
          documentNumber: doc.documentNumber,
          status: doc.verificationStatus,
          remarks: doc.remarks,
          url: doc.fileUrl
        };

        const updatedHistory = [...(doc.history || []), oldVersion];

        return {
          ...doc,
          documentNumber: docData.documentNumber !== undefined ? docData.documentNumber : doc.documentNumber,
          issueDate: docData.issueDate !== undefined ? docData.issueDate : doc.issueDate,
          expiryDate: docData.expiryDate !== undefined ? docData.expiryDate : doc.expiryDate,
          uploadedDate: timeStr,
          lastUpdated: timeStr,
          verificationStatus: 'PENDING VERIFICATION',
          remarks: docData.remarks || 'Replaced document uploaded. Pending verification.',
          fileName: docData.fileName || doc.fileName,
          fileUrl: docData.fileUrl || doc.fileUrl,
          history: updatedHistory
        };
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(`fg_user_documents_${currentRole}`, JSON.stringify(updated));
      }
      return updated;
    });
    addAuditLog('Documents & Verification', `Replaced document ID ${docId}. Status set to PENDING VERIFICATION.`);
  };

  const changeUserPassword = (currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (!currentPass) {
      return { success: false, message: 'Please enter your current password.' };
    }
    if (!newPass || newPass.length < 8) {
      return { success: false, message: 'New password must be at least 8 characters long.' };
    }
    addAuditLog('Security', `Successfully updated account password for ${userProfile.email}`);
    return { success: true, message: 'Password changed successfully.' };
  };

  const openProfileTab = (subTab: 'personal' | 'organization' | 'documents' | 'security' = 'personal') => {
    setProfileSubTab(subTab);
    setActiveTab('profile');
  };

  // Global Dynamic Filter & Cross-Entity Navigation State
  const [moduleFilters, setModuleFiltersState] = useState<Record<string, string>>({});
  const [mfgProfileInitialTab, setMfgProfileInitialTab] = useState<'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE'>('OVERVIEW');

  const setModuleFilter = (module: string, statusFilter: string) => {
    setModuleFiltersState(prev => ({
      ...prev,
      [module]: statusFilter
    }));
  };

  const navigateWithFilter = (tab: string, statusFilter?: string) => {
    if (statusFilter) {
      setModuleFilter(tab, statusFilter);
    }
    setActiveTab(tab);
  };

  const openManufacturerProfile = (mfgId: string, initialTab: 'OVERVIEW' | 'CAPABILITIES' | 'CATALOG' | 'COMPLIANCE' | 'RELATIONSHIP' | 'PERFORMANCE' = 'OVERVIEW') => {
    setSelectedMfgIdForProfile(mfgId);
    setMfgProfileInitialTab(initialTab);
    setActiveTab('manufacturers');
  };
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(mockManufacturers);
  const [products, setProducts] = useState<Product[]>(() => {
    // Migration map: old category values → new main categories (client-specified)
    const CATEGORY_MIGRATION: Record<string, string> = {
      'Tablets': 'Drugs', 'Capsules': 'Drugs', 'Syrups': 'Drugs', 'Injections': 'Drugs',
      'Ointments': 'Drugs', 'Antibiotics': 'Drugs', 'Analgesic': 'Drugs',
      'Gastroenterology': 'Drugs', 'Diabetology': 'Drugs', 'Suspension': 'Drugs',
      'Powder': 'Drugs', 'Injection': 'Drugs', 'Syrup': 'Drugs', 'Tablet': 'Drugs',
      'Capsule': 'Drugs', 'Ointment': 'Drugs',
      'Nutraceuticals': 'Nutraceuticals/Food'
    };
    const VALID_MAIN_CATEGORIES = new Set(['Drugs', 'Nutraceuticals/Food', 'Cosmetics', 'Ayur/Herbal', 'Veterinary', 'Surgical']);
    const migrateCategory = (cat: string | undefined): string => {
      if (!cat) return 'Drugs';
      if (VALID_MAIN_CATEGORIES.has(cat)) return cat;
      return CATEGORY_MIGRATION[cat] || 'Drugs';
    };
    try {
      const saved = localStorage.getItem('fg_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Build a lookup map from mockProducts so we can fill in any missing fields
          // (e.g. `category`) that may not exist in older localStorage snapshots.
          const mockMap = new Map(mockProducts.map(mp => [mp.id, mp]));
          const merged = parsed.map((p: Product) => {
            const defaults = mockMap.get(p.id);
            if (defaults) {
              // Preserve user-edited fields but supply defaults for missing ones
              const product = { ...defaults, ...p };
              // Migrate old category values to new main categories
              product.category = migrateCategory(product.category);
              return product;
            }
            const product = { ...p };
            product.category = migrateCategory(product.category);
            return product;
          });
          const existingIds = new Set(merged.map((p: Product) => p.id));
          const missingDefaults = mockProducts.filter(mp => !existingIds.has(mp.id));
          if (missingDefaults.length > 0) {
            return [...merged, ...missingDefaults];
          }
          return merged;
        }
      }
    } catch(e) {}
    return mockProducts;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_products', JSON.stringify(products));
    } catch(e) {}
  }, [products]);

  const addProductMaster = (newProduct: Product) => {
    setProducts(prev => {
      const exists = prev.some(p => p.code.toLowerCase().trim() === newProduct.code.toLowerCase().trim());
      if (exists) return prev;
      return [newProduct, ...prev];
    });
  };

  const updateProductMaster = (productId: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedFields } : p));
    if (updatedFields.marginPercentage !== undefined) {
      const targetPrd = products.find(p => p.id === productId);
      addOrUpdateMarginRule({
        product_id: productId,
        sku_id: targetPrd?.sku || targetPrd?.code,
        margin_percentage: updatedFields.marginPercentage,
        priority: 1,
        status: 'Active'
      });
    }
  };

  const toggleProductMasterStatus = (productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: p.status === 'Inactive' ? 'Active' : 'Inactive' } : p));
  };

  // ── CATEGORY MASTER & MARGIN ENGINE STATE ─────────────────────────────
  const [categories, setCategories] = useState<CategoryMaster[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Version guard: if cached categories don't include the new main categories, reset to fresh data
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((c: any) => c.id === 'cat_drugs')) {
          return parsed;
        }
        // Clear stale cache so new mockCategories are persisted
        localStorage.removeItem('factorygrid_categories');
      }
    } catch (e) {}
    return mockCategories;
  });

  const [categoryMargins, setCategoryMargins] = useState<CategoryMargin[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_margins');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Version guard: reset if stale (missing new category IDs)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((m: any) => m.categoryId === 'cat_drugs')) {
          return parsed;
        }
        localStorage.removeItem('factorygrid_margins');
      }
    } catch (e) {}
    return mockCategoryMargins;
  });

  // ── MARGIN ENGINE STATE (MULTI-TIER RULES & PRIORITY RESOLUTION) ────────────
  const [marginRules, setMarginRules] = useState<MarginRule[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_margin_rules_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((r: any) => r.margin_rule_id === 'mr_default')) {
          return parsed;
        }
        localStorage.removeItem('factorygrid_margin_rules_v1');
      }
    } catch (e) {}
    return mockMarginRules;
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_categories', JSON.stringify(categories));
    } catch (e) {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_margins', JSON.stringify(categoryMargins));
    } catch (e) {}
  }, [categoryMargins]);

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_margin_rules_v1', JSON.stringify(marginRules));
    } catch (e) {}
  }, [marginRules]);

  const addOrUpdateMarginRule = (ruleData: Partial<MarginRule>) => {
    const timeStr = new Date().toISOString();
    setMarginRules(prev => {
      let existingIndex = -1;
      if (ruleData.margin_rule_id) {
        existingIndex = prev.findIndex(r => r.margin_rule_id === ruleData.margin_rule_id);
      }
      if (existingIndex === -1) {
        if (ruleData.product_id || ruleData.sku_id) {
          existingIndex = prev.findIndex(r =>
            (ruleData.product_id && r.product_id === ruleData.product_id) ||
            (ruleData.sku_id && r.sku_id === ruleData.sku_id)
          );
        } else if (ruleData.manufacturer_id && (ruleData.category_id || ruleData.category_name)) {
          existingIndex = prev.findIndex(r =>
            r.manufacturer_id === ruleData.manufacturer_id &&
            (r.category_id === ruleData.category_id || (ruleData.category_name && r.category_name?.toLowerCase() === ruleData.category_name.toLowerCase()))
          );
        } else if (ruleData.manufacturer_id && !ruleData.category_id && !ruleData.product_id && !ruleData.sku_id) {
          existingIndex = prev.findIndex(r =>
            r.manufacturer_id === ruleData.manufacturer_id && !r.category_id && !r.product_id && !r.sku_id
          );
        } else if (ruleData.category_id || ruleData.category_name) {
          existingIndex = prev.findIndex(r =>
            !r.manufacturer_id &&
            (r.category_id === ruleData.category_id || (ruleData.category_name && r.category_name?.toLowerCase() === ruleData.category_name.toLowerCase()))
          );
        }
      }

      const inferredScope: MarginScopeType = ruleData.scope_type || (
        (ruleData.product_id || ruleData.sku_id) ? 'PRODUCT' :
        ruleData.sub_sub_category_id ? 'SUB_SUB_CATEGORY' :
        ruleData.sub_category_id ? 'SUB_CATEGORY' :
        ruleData.manufacturer_id ? 'MANUFACTURER' :
        ruleData.category_id ? 'CATEGORY' : 'DEFAULT'
      );

      const resolvedMarginType: MarginType = ruleData.margin_type || 'PERCENTAGE';
      const resolvedMarginVal = ruleData.margin_value !== undefined
        ? ruleData.margin_value
        : (resolvedMarginType === 'FIXED_RATE' ? (ruleData.margin_rate ?? 0) : (ruleData.margin_percentage ?? 10));

      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newMarginType: MarginType = ruleData.margin_type || existing.margin_type || 'PERCENTAGE';
        const newMarginVal = ruleData.margin_value !== undefined
          ? ruleData.margin_value
          : (newMarginType === 'FIXED_RATE'
              ? (ruleData.margin_rate ?? existing.margin_rate ?? existing.margin_value ?? 0)
              : (ruleData.margin_percentage ?? existing.margin_percentage ?? existing.margin_value ?? 10));

        updated[existingIndex] = {
          ...existing,
          ...ruleData,
          scope_type: ruleData.scope_type || existing.scope_type || inferredScope,
          margin_type: newMarginType,
          margin_value: newMarginVal,
          margin_rate: newMarginType === 'FIXED_RATE' ? newMarginVal : undefined,
          margin_percentage: newMarginType === 'PERCENTAGE' ? newMarginVal : (existing.margin_percentage || 0),
          updated_at: timeStr
        };
        return updated;
      } else {
        let priority = ruleData.priority || 5;
        if (!ruleData.priority) {
          if (ruleData.product_id || ruleData.sku_id) priority = 1;
          else if (ruleData.manufacturer_id && (ruleData.category_id || ruleData.category_name)) priority = 2;
          else if (ruleData.manufacturer_id) priority = 3;
          else if (ruleData.category_id || ruleData.category_name) priority = 4;
          else priority = 5;
        }
        const newRuleId = ruleData.margin_rule_id || `mr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newRule: MarginRule = {
          margin_rule_id: newRuleId,
          scope_type: inferredScope,
          manufacturer_id: ruleData.manufacturer_id ?? null,
          manufacturer_name: ruleData.manufacturer_name ?? null,
          category_id: ruleData.category_id ?? null,
          category_name: ruleData.category_name ?? null,
          sub_category_id: ruleData.sub_category_id ?? null,
          sub_category_name: ruleData.sub_category_name ?? null,
          sub_sub_category_id: ruleData.sub_sub_category_id ?? null,
          sub_sub_category_name: ruleData.sub_sub_category_name ?? null,
          product_id: ruleData.product_id ?? null,
          sku_id: ruleData.sku_id ?? null,
          margin_type: resolvedMarginType,
          margin_value: resolvedMarginVal,
          margin_rate: resolvedMarginType === 'FIXED_RATE' ? resolvedMarginVal : undefined,
          margin_percentage: resolvedMarginType === 'PERCENTAGE' ? resolvedMarginVal : 0,
          priority,
          status: ruleData.status ?? 'Active',
          effective_from: ruleData.effective_from || timeStr.split('T')[0],
          effective_to: ruleData.effective_to,
          created_by: ruleData.created_by || 'Admin',
          created_at: timeStr,
          updated_at: timeStr
        };
        return [newRule, ...prev];
      }
    });

    const displayUnit = ruleData.margin_type === 'FIXED_RATE' ? `₹${ruleData.margin_value || ruleData.margin_rate}/unit` : `${ruleData.margin_value ?? ruleData.margin_percentage}%`;
    addAuditLog('MARGIN_ENGINE', `Configured margin rule (${ruleData.manufacturer_name || ruleData.sku_id || ruleData.category_name || 'Margin'}: ${displayUnit})`);
  };

  const deleteMarginRule = (ruleId: string) => {
    setMarginRules(prev => prev.filter(r => r.margin_rule_id !== ruleId));
    addAuditLog('MARGIN_ENGINE', `Removed margin rule ID ${ruleId}`);
  };

  // ── MARGIN RESOLUTION ENGINE (FINAL BUSINESS DECISION: PRODUCT-LEVEL ONLY) ──
  // Authoritative Priority:
  // 1. Manufacturer + Product Mapping Margin (from mappings or product-level rule)
  // 2. Product-level SKU Rule (from marginRules)
  // 3. Central Product Master margin (Product.marginPercentage)
  // 4. Default baseline product margin (Fallback)
  // NOTE: Category-level margins are NEVER applied to calculate final selling/internal prices.
  // Platform Fee is kept COMPLETELY SEPARATE from Product Margin.
  const getApplicableMargin = (params: {
    productId?: string;
    sku?: string;
    manufacturerId?: string;
    categoryId?: string;
    categoryName?: string;
    isGeneric?: boolean;
    basePrice?: number;
  }): {
    marginType: MarginType;
    marginValue: number;
    marginPercentage: number;
    marginRate?: number;
    ruleType: 'PRODUCT' | 'MFG_CATEGORY' | 'MANUFACTURER' | 'CATEGORY' | 'DEFAULT';
    ruleSource: string;
    matchingRule?: MarginRule;
    calculateSellingPrice: (baseUnitPrice: number) => number;
    calculateMarginAmount: (baseUnitPrice: number) => number;
    platformFeeAmount?: number;
    platformFeePercent?: number;
    calculateCommercialPrice?: (baseUnitPrice: number) => number;
    calculatePlatformFee?: (baseUnitPrice: number) => number;
  } => {
    const activeRules = marginRules.filter(r => r.status === 'Active');
    const effectiveMfgId = params.isGeneric ? 'mfg_fg_direct' : params.manufacturerId;

    // Platform Fee Configuration (Completely Separate from Product Margin)
    const pfConfig = platformFeeConfig && platformFeeConfig.status === 'Active'
      ? platformFeeConfig
      : { feeType: 'PERCENTAGE' as const, feeValue: 2.0, status: 'Active' as const };

    const computePlatformFee = (baseUnitPrice: number): number => {
      if (!platformFeeConfig || platformFeeConfig.status !== 'Active') return 0;
      if (pfConfig.feeType === 'FIXED_RATE') {
        return pfConfig.feeValue;
      }
      return Math.round(((baseUnitPrice * pfConfig.feeValue) / 100) * 100) / 100;
    };

    const formatRuleResult = (
      marginType: MarginType,
      marginValue: number,
      ruleType: 'PRODUCT' | 'MFG_CATEGORY' | 'MANUFACTURER' | 'CATEGORY' | 'DEFAULT',
      baseSourceDesc: string,
      matchingRule?: MarginRule
    ) => {
      const marginRate = marginType === 'FIXED_RATE' ? marginValue : undefined;
      const marginPercentage = marginType === 'PERCENTAGE'
        ? marginValue
        : (params.basePrice && params.basePrice > 0 ? (marginValue / params.basePrice) * 100 : 0);

      const formattedUnit = marginType === 'FIXED_RATE' ? `₹${marginValue}/unit` : `${marginValue}%`;

      return {
        marginType,
        marginValue,
        marginPercentage,
        marginRate,
        ruleType,
        ruleSource: `${baseSourceDesc}: ${formattedUnit}`,
        matchingRule,
        platformFeePercent: pfConfig.feeType === 'PERCENTAGE' ? pfConfig.feeValue : (params.basePrice && params.basePrice > 0 ? (pfConfig.feeValue / params.basePrice) * 100 : 2.0),
        platformFeeAmount: computePlatformFee(params.basePrice || 100),
        calculateSellingPrice: (baseUnitPrice: number) => {
          if (marginType === 'FIXED_RATE') {
            return baseUnitPrice + marginValue;
          }
          return Math.round((baseUnitPrice + (baseUnitPrice * marginValue) / 100) * 100) / 100;
        },
        calculateMarginAmount: (baseUnitPrice: number) => {
          if (marginType === 'FIXED_RATE') {
            return marginValue;
          }
          return Math.round(((baseUnitPrice * marginValue) / 100) * 100) / 100;
        },
        calculateCommercialPrice: (baseUnitPrice: number) => {
          const sellingPrice = marginType === 'FIXED_RATE'
            ? baseUnitPrice + marginValue
            : baseUnitPrice + (baseUnitPrice * marginValue) / 100;
          const pf = computePlatformFee(baseUnitPrice);
          return Math.round((sellingPrice + pf) * 100) / 100;
        },
        calculatePlatformFee: (baseUnitPrice: number) => computePlatformFee(baseUnitPrice)
      };
    };

    // 1. Check Product + Manufacturer specific mapping in `mappings` state
    if (params.productId || params.sku) {
      const mappingMatch = mappings.find(m => {
        const matchesProduct = (params.productId && m.productId === params.productId) ||
          (params.sku && (m.mfgProductCode === params.sku || m.productId === params.sku));
        const matchesMfg = !effectiveMfgId || m.manufacturerId === effectiveMfgId || m.manufacturerCode === effectiveMfgId;
        return matchesProduct && matchesMfg && m.marginValue !== undefined && m.marginValue !== null;
      });

      if (mappingMatch && mappingMatch.marginValue !== undefined) {
        const mType: MarginType = mappingMatch.marginType || 'PERCENTAGE';
        const mVal = mappingMatch.marginValue;
        const mfgName = mappingMatch.manufacturerName || effectiveMfgId || 'Manufacturer';
        return formatRuleResult(mType, mVal, 'PRODUCT', `Product Margin (${mappingMatch.mfgProductCode || params.sku || 'SKU'} - ${mfgName})`);
      }
    }

    // 2. Check Product + Manufacturer specific rule in `marginRules` (Priority 1)
    if (params.productId || params.sku) {
      const skuMfgRule = activeRules.find(r =>
        ((params.productId && r.product_id === params.productId) || (params.sku && r.sku_id === params.sku)) &&
        effectiveMfgId && r.manufacturer_id === effectiveMfgId
      );
      if (skuMfgRule) {
        const mType: MarginType = skuMfgRule.margin_type || 'PERCENTAGE';
        const mVal = skuMfgRule.margin_value !== undefined
          ? skuMfgRule.margin_value
          : (mType === 'FIXED_RATE' ? (skuMfgRule.margin_rate ?? 0) : (skuMfgRule.margin_percentage ?? 10));
        return formatRuleResult(mType, mVal, 'PRODUCT', `Product Margin (${skuMfgRule.sku_id || params.sku || 'SKU'} - ${skuMfgRule.manufacturer_name || effectiveMfgId})`, skuMfgRule);
      }

      // General product-level rule in `marginRules` (across manufacturers)
      const skuRule = activeRules.find(r =>
        (params.productId && r.product_id === params.productId) ||
        (params.sku && r.sku_id === params.sku)
      );
      if (skuRule) {
        const mType: MarginType = skuRule.margin_type || 'PERCENTAGE';
        const mVal = skuRule.margin_value !== undefined
          ? skuRule.margin_value
          : (mType === 'FIXED_RATE' ? (skuRule.margin_rate ?? 0) : (skuRule.margin_percentage ?? 10));
        return formatRuleResult(mType, mVal, 'PRODUCT', `Product/SKU Rule (${skuRule.sku_id || params.sku || 'SKU'})`, skuRule);
      }
    }

    // 3. Check Central Product Master configuration (Product.marginPercentage)
    if (params.productId) {
      const centralPrd = products.find(p => p.id === params.productId || p.code === params.productId || p.sku === params.sku);
      if (centralPrd && centralPrd.marginPercentage !== undefined && centralPrd.marginPercentage > 0) {
        return formatRuleResult('PERCENTAGE', centralPrd.marginPercentage, 'PRODUCT', `Product Master Margin (${centralPrd.sku || centralPrd.code})`);
      }
    }

    // 4. Default baseline platform product margin (Fallback — Category margins are NOT applied)
    const defaultRule = activeRules.find(r =>
      !r.manufacturer_id &&
      !r.category_id &&
      !r.product_id &&
      !r.sku_id
    );
    if (defaultRule) {
      const mType: MarginType = defaultRule.margin_type || 'PERCENTAGE';
      const mVal = defaultRule.margin_value !== undefined
        ? defaultRule.margin_value
        : (mType === 'FIXED_RATE' ? (defaultRule.margin_rate ?? 0) : (defaultRule.margin_percentage ?? 10));
      return formatRuleResult(mType, mVal, 'DEFAULT', 'Baseline Product Margin (Fallback)', defaultRule);
    }

    return formatRuleResult('PERCENTAGE', 10, 'DEFAULT', 'Default Product Margin (10%)');
  };

  const addCategory = (newCat: CategoryMaster) => {
    setCategories(prev => {
      const exists = prev.some(c => c.id === newCat.id || c.name.toLowerCase() === newCat.name.toLowerCase() || c.code.toLowerCase() === newCat.code.toLowerCase());
      if (exists) return prev;
      return [newCat, ...prev];
    });
    setCategoryMargins(prev => {
      const exists = prev.some(m => m.categoryId === newCat.id || m.categoryName.toLowerCase() === newCat.name.toLowerCase());
      if (exists) return prev;
      return [...prev, {
        categoryId: newCat.id,
        categoryName: newCat.name,
        categoryCode: newCat.code,
        marginPercentage: 10,
        status: newCat.status,
        updatedAt: new Date().toISOString().split('T')[0],
        updatedBy: 'Admin'
      }];
    });
    addOrUpdateMarginRule({
      category_id: newCat.id,
      category_name: newCat.name,
      margin_percentage: 10,
      priority: 4,
      status: newCat.status
    });
    addAuditLog('CATEGORY_MASTER', `Created new category ${newCat.name} (${newCat.code})`);
  };

  const updateCategory = (id: string, updates: Partial<CategoryMaster>) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const updated = { ...c, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        if (updates.name || updates.code || updates.status) {
          setCategoryMargins(mPrev => mPrev.map(m => m.categoryId === id ? {
            ...m,
            categoryName: updates.name || m.categoryName,
            categoryCode: updates.code || m.categoryCode,
            status: updates.status || m.status,
            updatedAt: new Date().toISOString().split('T')[0]
          } : m));
          setMarginRules(rPrev => rPrev.map(r => r.category_id === id ? {
            ...r,
            category_name: updates.name || r.category_name,
            status: updates.status || r.status,
            updated_at: new Date().toISOString()
          } : r));
        }
        return updated;
      }
      return c;
    }));
    addAuditLog('CATEGORY_MASTER', `Updated category ID ${id}`);
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setCategoryMargins(prev => prev.filter(m => m.categoryId !== id));
    setMarginRules(prev => prev.filter(r => r.category_id !== id));
    if (cat) {
      addAuditLog('CATEGORY_MASTER', `Deleted category ${cat.name} (${cat.code})`);
    }
  };

  const toggleCategoryStatus = (id: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        setCategoryMargins(mPrev => mPrev.map(m => m.categoryId === id ? { ...m, status: newStatus } : m));
        setMarginRules(rPrev => rPrev.map(r => r.category_id === id ? { ...r, status: newStatus } : r));
        return { ...c, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return c;
    }));
  };

  const updateCategoryMargin = (categoryIdOrName: string, marginValue: number, marginType: MarginType = 'PERCENTAGE') => {
    const target = categoryIdOrName.toLowerCase().trim();
    const matchedCat = categories.find(c => c.id.toLowerCase() === target || c.name.toLowerCase() === target);
    const catId = matchedCat?.id || `cat_${target.replace(/\s+/g, '_')}`;
    const catName = matchedCat?.name || categoryIdOrName;
    const catCode = matchedCat?.code || `CAT-${target.substring(0, 3).toUpperCase()}`;

    setCategoryMargins(prev => {
      const exists = prev.some(m => m.categoryId.toLowerCase() === target || m.categoryName.toLowerCase() === target);
      if (exists) {
        return prev.map(m => (m.categoryId.toLowerCase() === target || m.categoryName.toLowerCase() === target) ? {
          ...m,
          marginType,
          marginPercentage: marginType === 'PERCENTAGE' ? marginValue : m.marginPercentage,
          marginRate: marginType === 'FIXED_RATE' ? marginValue : undefined,
          updatedAt: new Date().toISOString().split('T')[0],
          updatedBy: 'Admin'
        } : m);
      }
      return [...prev, {
        categoryId: catId,
        categoryName: catName,
        categoryCode: catCode,
        marginType,
        marginPercentage: marginType === 'PERCENTAGE' ? marginValue : 0,
        marginRate: marginType === 'FIXED_RATE' ? marginValue : undefined,
        status: 'Active',
        updatedAt: new Date().toISOString().split('T')[0],
        updatedBy: 'Admin'
      }];
    });

    addOrUpdateMarginRule({
      scope_type: 'CATEGORY',
      category_id: catId,
      category_name: catName,
      margin_type: marginType,
      margin_value: marginValue,
      margin_rate: marginType === 'FIXED_RATE' ? marginValue : undefined,
      margin_percentage: marginType === 'PERCENTAGE' ? marginValue : undefined,
      priority: 4,
      status: 'Active'
    });

    const displayUnit = marginType === 'FIXED_RATE' ? `₹${marginValue}/unit` : `${marginValue}%`;
    addAuditLog('MARGIN_ENGINE', `Updated margin for ${categoryIdOrName} to ${displayUnit}`);
  };

  const getCategoryMarginConfig = (categoryNameOrId?: string): { marginType: MarginType; marginValue: number } => {
    if (!categoryNameOrId) return { marginType: 'PERCENTAGE', marginValue: 10 };
    const target = categoryNameOrId.toLowerCase().trim();
    const found = categoryMargins.find(m =>
      m.categoryId.toLowerCase() === target ||
      m.categoryName.toLowerCase() === target ||
      m.categoryCode.toLowerCase() === target ||
      target.includes(m.categoryName.toLowerCase()) ||
      m.categoryName.toLowerCase().includes(target)
    );
    if (!found) return { marginType: 'PERCENTAGE', marginValue: 10 };
    const marginType = found.marginType || 'PERCENTAGE';
    const marginValue = marginType === 'FIXED_RATE' ? (found.marginRate ?? 0) : found.marginPercentage;
    return { marginType, marginValue };
  };

  const getCategoryMargin = (categoryNameOrId?: string): number => {
    const config = getCategoryMarginConfig(categoryNameOrId);
    return config.marginValue;
  };

  // ── SUB-CATEGORY MASTER STATE & HANDLERS ────────────────────────────
  const [subCategories, setSubCategories] = useState<SubCategoryMaster[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_subcategories_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 44 && parsed.some((s: any) => s.id === 'sub_drg_1')) {
          return parsed;
        }
      }
      // Check if user added custom subcategories in older versions and preserve them
      const oldSaved = localStorage.getItem('factorygrid_subcategories');
      if (oldSaved) {
        const oldParsed = JSON.parse(oldSaved);
        if (Array.isArray(oldParsed)) {
          const custom = oldParsed.filter((s: any) => !mockSubCategories.some(m => m.id === s.id));
          if (custom.length > 0) {
            return [...mockSubCategories, ...custom];
          }
        }
      }
    } catch (e) {}
    return mockSubCategories;
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_subcategories_v3', JSON.stringify(subCategories));
    } catch (e) {}
  }, [subCategories]);

  const addSubCategory = (newSub: SubCategoryMaster) => {
    setSubCategories(prev => {
      const exists = prev.some(s =>
        s.categoryId === newSub.categoryId &&
        (s.name.toLowerCase() === newSub.name.toLowerCase() || s.code.toLowerCase() === newSub.code.toLowerCase())
      );
      if (exists) return prev;
      return [newSub, ...prev];
    });
    addAuditLog('CATEGORY_MASTER', `Created sub-category ${newSub.name} under ${newSub.parentCategory}`);
  };

  const updateSubCategory = (id: string, updates: Partial<SubCategoryMaster>) => {
    setSubCategories(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return s;
    }));
    addAuditLog('CATEGORY_MASTER', `Updated sub-category ID ${id}`);
  };

  const deleteSubCategory = (id: string) => {
    const sub = subCategories.find(s => s.id === id);
    setSubCategories(prev => prev.filter(s => s.id !== id));
    if (sub) {
      addAuditLog('CATEGORY_MASTER', `Deleted sub-category ${sub.name} from ${sub.parentCategory}`);
    }
  };

  const toggleSubCategoryStatus = (id: string) => {
    setSubCategories(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        return { ...s, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return s;
    }));
  };

  // ── SUB-SUB-CATEGORY MASTER STATE & HANDLERS ────────────────────────
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategoryMaster[]>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_subsubcategories_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 8 && parsed.some((s: any) => s.id === 'ssc_drg_tab_1')) {
          return parsed;
        }
      }
    } catch (e) {}
    return mockSubSubCategories;
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_subsubcategories_v1', JSON.stringify(subSubCategories));
    } catch (e) {}
  }, [subSubCategories]);

  const addSubSubCategory = (newSubSub: SubSubCategoryMaster) => {
    setSubSubCategories(prev => {
      const exists = prev.some(s =>
        s.subCategoryId === newSubSub.subCategoryId &&
        (s.name.toLowerCase() === newSubSub.name.toLowerCase() || s.code.toLowerCase() === newSubSub.code.toLowerCase())
      );
      if (exists) return prev;
      return [newSubSub, ...prev];
    });
    addAuditLog('CATEGORY_MASTER', `Created sub-sub-category ${newSubSub.name} under ${newSubSub.parentSubCategory || newSubSub.subCategoryId}`);
  };

  const updateSubSubCategory = (id: string, updates: Partial<SubSubCategoryMaster>) => {
    setSubSubCategories(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return s;
    }));
    addAuditLog('CATEGORY_MASTER', `Updated sub-sub-category ID ${id}`);
  };

  const deleteSubSubCategory = (id: string) => {
    const item = subSubCategories.find(s => s.id === id);
    setSubSubCategories(prev => prev.filter(s => s.id !== id));
    if (item) {
      addAuditLog('CATEGORY_MASTER', `Deleted sub-sub-category ${item.name} from ${item.parentSubCategory || item.subCategoryId}`);
    }
  };

  const toggleSubSubCategoryStatus = (id: string) => {
    setSubSubCategories(prev => prev.map(s => {
      if (s.id === id) {
        const newStatus = s.status === 'Active' ? 'Inactive' : 'Active';
        return { ...s, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] };
      }
      return s;
    }));
  };

  const [mappings, setMappings] = useState<ManufacturerProductMapping[]>(() => {
    try {
      const saved = localStorage.getItem('fg_mappings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mockManufacturerProductMappings;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_mappings_v2', JSON.stringify(mappings));
    } catch (e) {}
  }, [mappings]);

  const addMapping = (newMapping: ManufacturerProductMapping) => {
    setMappings(prev => {
      // Check duplicate for same manufacturer & product
      const exists = prev.some(m => m.productId === newMapping.productId && (m.manufacturerId === newMapping.manufacturerId || m.manufacturerName === newMapping.manufacturerName));
      if (exists) return prev;
      return [newMapping, ...prev];
    });
  };

  const updateMapping = (productId: string, manufacturerId: string, updatedFields: Partial<ManufacturerProductMapping>) => {
    setMappings(prev => prev.map(m => (m.productId === productId && (m.manufacturerId === manufacturerId || !m.manufacturerId)) ? { ...m, ...updatedFields } : m));
  };

  const removeMapping = (productId: string, manufacturerId: string) => {
    setMappings(prev => prev.filter(m =>
      !(m.productId === productId && (m.manufacturerId === manufacturerId || !m.manufacturerId))
    ));
  };

  // ── PLATFORM FEE STATE & HANDLERS (COMPLETELY SEPARATE FROM MARGIN) ────
  const [platformFeeConfig, setPlatformFeeConfig] = useState<PlatformFeeConfig>(() => {
    try {
      const saved = localStorage.getItem('fg_platform_fee_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      feeType: 'PERCENTAGE',
      feeValue: 2.0, // 2.0% platform fee
      feeName: 'Platform Facilitation & Escrow Fee',
      status: 'Active',
      updatedAt: '2026-08-15'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_platform_fee_v1', JSON.stringify(platformFeeConfig));
    } catch (e) {}
  }, [platformFeeConfig]);

  const updatePlatformFeeConfig = (updates: Partial<PlatformFeeConfig>) => {
    setPlatformFeeConfig(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0]
    }));
    addAuditLog('PLATFORM_FEE', `Updated platform fee config: ${updates.feeValue !== undefined ? `${updates.feeValue}${updates.feeType === 'FIXED_RATE' ? '₹' : '%'}` : 'modified'}`);
  };

  // ── PRODUCT-LEVEL MARGIN ENGINE HANDLERS (STRICT PRODUCT LEVEL) ────────
  const updateProductMargin = (productId: string, manufacturerId: string, marginType: MarginType, marginValue: number) => {
    const timeStr = new Date().toISOString();
    const timeDateStr = timeStr.split('T')[0];
    const targetPrd = products.find(p => p.id === productId || p.code === productId);
    const targetMfg = manufacturers.find(m => m.id === manufacturerId || m.code === manufacturerId);

    // 1. Update mappings state
    setMappings(prev => {
      const idx = prev.findIndex(m =>
        m.productId === productId && (m.manufacturerId === manufacturerId || !m.manufacturerId)
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          marginType,
          marginValue,
          marginRate: marginType === 'FIXED_RATE' ? marginValue : undefined,
          marginStatus: 'Active',
          marginUpdatedAt: timeDateStr
        };
        return updated;
      } else {
        const newMap: ManufacturerProductMapping = {
          id: `map_${manufacturerId}_${productId}_${Date.now()}`,
          productId,
          manufacturerId,
          manufacturerName: targetMfg?.companyName || targetMfg?.name || manufacturerId,
          manufacturerCode: targetMfg?.code || manufacturerId,
          mfgProductCode: targetPrd?.sku || targetPrd?.code || productId,
          moq: targetPrd?.moq || 1000,
          standardLeadTimeDays: 14,
          unitPriceEstimate: targetPrd?.basePrice || 100,
          packaging: targetPrd?.packSize || '10 x 10 Strip',
          status: 'Active',
          marginType,
          marginValue,
          marginRate: marginType === 'FIXED_RATE' ? marginValue : undefined,
          marginStatus: 'Active',
          marginUpdatedAt: timeDateStr
        };
        return [...prev, newMap];
      }
    });

    // 2. Update product-level MarginRule
    addOrUpdateMarginRule({
      scope_type: 'PRODUCT',
      manufacturer_id: manufacturerId,
      manufacturer_name: targetMfg?.companyName || targetMfg?.name || manufacturerId,
      product_id: productId,
      sku_id: targetPrd?.sku || targetPrd?.code || productId,
      margin_type: marginType,
      margin_value: marginValue,
      margin_rate: marginType === 'FIXED_RATE' ? marginValue : undefined,
      margin_percentage: marginType === 'PERCENTAGE' ? marginValue : 0,
      priority: 1,
      status: 'Active'
    });

    // 3. Keep central ProductMaster in sync if percentage
    if (marginType === 'PERCENTAGE') {
      updateProductMaster(productId, { marginPercentage: marginValue });
    }

    const displayUnit = marginType === 'FIXED_RATE' ? `₹${marginValue}/unit` : `${marginValue}%`;
    addAuditLog('MARGIN_ENGINE', `Admin configured product margin for ${targetPrd?.name || productId} (${targetMfg?.brandName || targetMfg?.companyName || manufacturerId}): ${displayUnit}`);
  };

  const bulkUpdateProductMargins = (rows: { manufacturerId: string; productId: string; marginType: MarginType; marginValue: number; mfgProductCode?: string }[]) => {
    let updatedCount = 0;
    const errors: string[] = [];

    rows.forEach(row => {
      try {
        updateProductMargin(row.productId, row.manufacturerId, row.marginType, row.marginValue);
        updatedCount++;
      } catch (err: any) {
        errors.push(`Failed to update ${row.productId}: ${err?.message || 'Unknown error'}`);
      }
    });

    addAuditLog('MARGIN_ENGINE', `Admin bulk updated ${updatedCount} product margins via Excel upload.`);
    return { updatedCount, errors };
  };
  const [rfqs, setRfqs] = useState<RFQ[]>(() => {
    try {
      const saved = localStorage.getItem('fg_rfqs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mockMap = new Map(mockRFQs.map(r => [r.id, r]));
          const mockNumMap = new Map(mockRFQs.map(r => [r.rfqNumber, r]));

          const sanitized = parsed.map((r: any) => {
            const mock = mockMap.get(r.id) || mockNumMap.get(r.rfqNumber);
            if (mock) {
              return {
                ...r,
                id: mock.id,
                rfqNumber: mock.rfqNumber,
                deadlineDate: mock.deadlineDate,
                quoteStatus: mock.quoteStatus,
                lines: mock.lines
              };
            }
            return r;
          });

          const validList = sanitized.filter((r: any) => {
            const mock = mockMap.get(r.id);
            return mock || new Date(r.deadlineDate) > new Date();
          });

          const savedIds = new Set(validList.map((r: any) => r.id || r.rfqNumber));
          const missingMocks = mockRFQs.filter(r => !savedIds.has(r.id) && !savedIds.has(r.rfqNumber));
          return [...validList, ...missingMocks];
        }
      }
    } catch (e) { }
    return mockRFQs;
  });

  const [quotes, setQuotes] = useState<ManufacturerQuote[]>(() => {
    try {
      const saved = localStorage.getItem('fg_quotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mockQuoteIds = new Set(mockQuotes.map(q => q.id));
          const filtered = parsed.filter((q: any) => !mockQuoteIds.has(q.id));
          return [...mockQuotes, ...filtered].map(q => ({
            ...q,
            quoteLines: Array.isArray(q?.quoteLines) ? q.quoteLines : []
          }));
        }
      }
    } catch (e) { }
    return mockQuotes;
  });

  // Declined RFQs state
  const [declinedRfqs, setDeclinedRfqs] = useState<Record<string, { rfqId: string; manufacturerId: string; manufacturerName: string; declineReason: string; declineRemarks?: string; declinedAt: string }[]>>({});

  const declineRFQ = (rfqId: string, manufacturerId: string, manufacturerName: string, reason: string, remarks?: string) => {
    const formattedDate = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    const record = {
      rfqId,
      manufacturerId,
      manufacturerName,
      declineReason: reason,
      declineRemarks: remarks,
      declinedAt: formattedDate
    };
    setDeclinedRfqs(prev => {
      const existingList = prev[rfqId] || [];
      const filtered = existingList.filter(d => d.manufacturerId !== manufacturerId);
      return { ...prev, [rfqId]: [...filtered, record] };
    });

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `RFQ Declined`,
      message: `RFQ ${rfqId} was declined by ${manufacturerName}. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'RFQ',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);

    // Audit Log
    addAuditLog('DECLINE_RFQ', `Manufacturer ${manufacturerName} declined ${rfqId}. Reason: ${reason}`);
  };

  // Negotiation Threads & Revised Quotes State
  const [negotiationThreads, setNegotiationThreads] = useState<Record<string, { id: string; threadKey: string; senderRole: 'BUYER' | 'SUPPLIER'; senderName: string; timestamp: string; text: string }[]>>({
    'rfq-8803_rl-8803-1_m1': [
      {
        id: 'msg_8803_1',
        threadKey: 'rfq-8803_rl-8803-1_m1',
        senderRole: 'BUYER',
        senderName: 'Apex Pharma Procurement Desk',
        timestamp: '24 Aug 2026, 02:15 PM',
        text: 'We are reviewing your commercial offer. Can you improve the unit price for Amoxicillin 500mg and compress the lead time to 12 days?'
      }
    ]
  });
  const [revisedQuotes, setRevisedQuotes] = useState<Record<string, { unitPrice: number; taxPercent: number; discountPercent: number; finalPrice: number; leadTimeDays: number; moq: number; remarks?: string; revisedAt: string }>>({});

  const sendNegotiationMessage = (threadKey: string, text: string, senderRole: 'BUYER' | 'SUPPLIER', senderName: string) => {
    const timeStr = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = {
      id: 'msg_' + Date.now(),
      threadKey,
      senderRole,
      senderName,
      timestamp: timeStr,
      text
    };
    setNegotiationThreads(prev => ({
      ...prev,
      [threadKey]: [...(prev[threadKey] || []), msg]
    }));
    addAuditLog('NEGOTIATION', `${senderName} sent message on thread ${threadKey}`);
  };

  const submitRevisedQuote = (threadKey: string, data: { unitPrice: number; taxPercent?: number; discountPercent?: number; leadTimeDays: number; moq: number; remarks?: string }) => {
    const finalPrice = data.unitPrice;
    const timeStr = new Date().toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });

    const revRecord = {
      unitPrice: data.unitPrice,
      taxPercent: 0,
      discountPercent: 0,
      finalPrice,
      leadTimeDays: data.leadTimeDays,
      moq: data.moq,
      remarks: data.remarks,
      revisedAt: timeStr
    };

    setRevisedQuotes(prev => ({
      ...prev,
      [threadKey]: revRecord
    }));

    // Auto add a system/supplier message to the thread
    sendNegotiationMessage(threadKey, `✔ Submitted Revised Quote: Unit Price ₹${data.unitPrice.toFixed(2)}, Delivery Schedule ${data.leadTimeDays} Days, MOQ ${data.moq.toLocaleString()} Units. Remarks: ${data.remarks || 'None'}`, 'SUPPLIER', 'Supplier Sales Team');

    addAuditLog('REVISED_QUOTE', `Submitted revised quote for ${threadKey}: Unit Price ₹${finalPrice}`);
  };

  const [orders, setOrders] = useState<MasterOrder[]>(() => {
    try {
      const saved = localStorage.getItem('fg_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map((o: any) => o.id || o.orderNumber));
          const missingMocks = mockMasterOrders.filter(mo => !savedIds.has(mo.id) && !savedIds.has(mo.orderNumber));
          return [...parsed, ...missingMocks];
        }
      }
    } catch (e) { }
    return mockMasterOrders;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_rfqs', JSON.stringify(rfqs));
    } catch (e) { }
  }, [rfqs]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_quotes', JSON.stringify(quotes));
    } catch (e) { }
  }, [quotes]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_orders', JSON.stringify(orders));
    } catch (e) { }
  }, [orders]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | Event) => {
      try {
        const saved = localStorage.getItem('fg_orders');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrders(prev => {
              // Only update if IDs differ
              const prevIds = prev.map(o => o.id).join(',');
              const newIds = parsed.map((o: any) => o.id).join(',');
              return prevIds === newIds ? prev : parsed;
            });
          }
        }
      } catch (err) {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('fg_invoices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) { }
    return mockInvoices;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_invoices', JSON.stringify(invoices));
    } catch (e) { }
  }, [invoices]);
  const [complianceCases, setComplianceCases] = useState<ComplianceCase[]>(mockComplianceCases);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [buyerOnboardings, setBuyerOnboardings] = useState<BuyerOnboarding[]>(mockBuyerOnboardings);
  const [manufacturerOnboardings, setManufacturerOnboardings] = useState<ManufacturerOnboarding[]>(mockManufacturerOnboardings);
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(mockCRMLeads);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(mockPaymentTransactions);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [customerVerifications, setCustomerVerifications] = useState<CustomerVerificationRequest[]>(mockCustomerVerifications);

  // Shipment & GST Integration State
  const [shipmentConnectors, setShipmentConnectors] = useState<Record<string, ShipmentCredentials>>(() => {
    try {
      const saved = localStorage.getItem('fg_shipment_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      bluedart: {
        customerCode: 'BD998210',
        consumerKey: 'bd_key_sandbox_9981',
        consumerSecret: 'bd_secret_sandbox_88921',
        environment: 'SANDBOX',
        isConnected: true,
        connectedAt: '2026-08-15'
      }
    };
  });

  const [gstConnectors, setGstConnectors] = useState<Record<string, GSTCredentials>>(() => {
    try {
      const saved = localStorage.getItem('fg_gst_connectors');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      messagecentral: {
        apiKey: 'mc_key_live_44921',
        apiSecret: 'mc_sec_live_99812',
        environment: 'PRODUCTION',
        isConnected: true,
        connectedAt: '2026-08-10'
      }
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('fg_shipment_connectors', JSON.stringify(shipmentConnectors));
    } catch (e) { }
  }, [shipmentConnectors]);

  useEffect(() => {
    try {
      localStorage.setItem('fg_gst_connectors', JSON.stringify(gstConnectors));
    } catch (e) { }
  }, [gstConnectors]);

  const saveShipmentConnector = (providerId: string, creds: ShipmentCredentials) => {
    const updated = {
      ...shipmentConnectors,
      [providerId]: {
        ...creds,
        isConnected: true,
        connectedAt: new Date().toISOString().split('T')[0]
      }
    };
    setShipmentConnectors(updated);
    addAuditLog('Integrations', `Connected Shipment Provider ${providerId.toUpperCase()} (${creds.environment})`);
  };

  const disconnectShipmentConnector = (providerId: string) => {
    setShipmentConnectors(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    addAuditLog('Integrations', `Disconnected Shipment Provider ${providerId.toUpperCase()}`);
  };

  const saveGSTConnector = (providerId: string, creds: GSTCredentials) => {
    const updated = {
      ...gstConnectors,
      [providerId]: {
        ...creds,
        isConnected: true,
        connectedAt: new Date().toISOString().split('T')[0]
      }
    };
    setGstConnectors(updated);
    addAuditLog('Integrations', `Connected GST Provider ${providerId.toUpperCase()} (${creds.environment})`);
  };

  const disconnectGSTConnector = (providerId: string) => {
    setGstConnectors(prev => {
      const copy = { ...prev };
      delete copy[providerId];
      return copy;
    });
    addAuditLog('Integrations', `Disconnected GST Provider ${providerId.toUpperCase()}`);
  };

  // Profile Navigation State
  const [selectedMfgIdForProfile, setSelectedMfgIdForProfile] = useState<string | null>(null);
  const [mfgProfileProductContext, setMfgProfileProductContext] = useState<{ productName?: string; strength?: string; dosageForm?: string; quantity?: number; unit?: string } | null>(null);

  // Unified RFQ Creation Drawer State
  const [isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen] = useState<boolean>(false);
  const openCreateRfqDrawer = () => {
    setIsCreateRfqDrawerOpen(true);
    setActiveTab('rfqs');
  };

  const addAuditLog = (module: string, action: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userName: currentRole === 'BUYER' ? 'Apex Pharma (Buyer)' : currentRole === 'SUPPLIER' ? 'SunBio Labs (Supplier)' : 'Executive User',
      userRole: currentRole,
      module,
      action,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addRFQ = (newRfq: RFQ) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is read-only. This action is not available for your role.");
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultFutureDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const cust = customers.find(c => c.id === newRfq.customerId || c.name === newRfq.customerName || c.code === newRfq.customerCode)
      || customerVerifications.find(cv => cv.id === newRfq.customerId || cv.companyName === newRfq.customerName || cv.customerCode === newRfq.customerCode);
    const resolvedClassification: CustomerClassification = newRfq.customerClassification || cust?.customerClassification || 'REGULAR';

    const activeRfq: RFQ = {
      ...newRfq,
      customerClassification: resolvedClassification,
      createdDate: newRfq.createdDate || todayStr,
      deadlineDate: (!newRfq.deadlineDate || new Date(newRfq.deadlineDate) <= new Date(todayStr))
        ? defaultFutureDeadline
        : newRfq.deadlineDate,
      quoteStatus: newRfq.quoteStatus || (newRfq.status === 'Draft' ? 'DRAFT' : 'ACTION NEEDED')
    };

    setRfqs(prev => [activeRfq, ...prev.filter(r => r.id !== activeRfq.id)]);
    addAuditLog('RFQ Center', `Created RFQ ${activeRfq.rfqNumber} with ${activeRfq.lines.length} lines${resolvedClassification === 'SPECIAL_PARTY' ? ' (Special Party Agreed Price Flow)' : ''}`);

    // Notify suppliers
    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New RFQ ${activeRfq.rfqNumber} Distributed`,
      message: `Customer ${activeRfq.customerName} submitted RFQ with ${activeRfq.lines.length} lines.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'RFQ',
      read: false,
      link: 'quotes'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const submitQuote = (newQuote: ManufacturerQuote) => {
    setQuotes(prev => {
      const updatedQuotes = [newQuote, ...prev];
      const rfqQuotes = updatedQuotes.filter(q => q.rfqId === newQuote.rfqId);
      const uniqueMfgIds = new Set(rfqQuotes.map(q => q.mfgId || q.manufacturerId));
      const uniqueMfgCount = uniqueMfgIds.size;

      // Move to 'Quoted' stage ONLY when 5 or more unique manufacturers have submitted quotations
      setRfqs(prevRfqs => prevRfqs.map(r => {
        if (r.id === newQuote.rfqId) {
          const nextStatus = uniqueMfgCount >= 5 ? ('Quoted' as const) : ('Pricing In Progress' as const);
          return { ...r, status: nextStatus };
        }
        return r;
      }));

      return updatedQuotes;
    });

    addAuditLog('Quote Matrix', `Submitted sealed quote ${newQuote.id} for RFQ ${newQuote.rfqNumber}`);
  };

  const [internalPriceList, setInternalPriceList] = useState<InternalPriceListItem[]>(mockInternalPriceList);

  const submitGenericAdminPricing = (rfqId: string, linePrices: Record<string, number>) => {
    const targetRfq = rfqs.find(r => r.id === rfqId);
    if (!targetRfq) return;

    let totalAmt = 0;
    const quoteLines: any[] = targetRfq.lines.map(line => {
      const unitPrice = linePrices[line.id] !== undefined ? linePrices[line.id] : (line.internalPrice || 4.20);
      const lineTotal = unitPrice * line.quantity;
      totalAmt += lineTotal;
      return {
        rfqLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        unitPrice,
        calculatedFinalPrice: unitPrice,
        leadTimeDays: 7,
        moq: 1000
      };
    });

    const quoteId = `QTE-GEN-${targetRfq.rfqNumber.replace('RFQ-', '')}`;
    const genericQuote: ManufacturerQuote = {
      id: quoteId,
      rfqId: targetRfq.id,
      rfqNumber: targetRfq.rfqNumber,
      manufacturerId: 'mfg_factorygrid',
      manufacturerName: 'FactoryGrid Direct (Generic Supply)',
      submissionDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'SUBMITTED',
      totalAmount: Math.round(totalAmt),
      remarks: 'Official FactoryGrid Direct quotation priced via internal price list.',
      quoteLines
    };

    setQuotes(prev => {
      const existingIdx = prev.findIndex(q => q.rfqId === rfqId || q.id === quoteId);
      if (existingIdx >= 0) {
        return prev.map((q, i) => i === existingIdx ? genericQuote : q);
      }
      return [genericQuote, ...prev];
    });

    setRfqs(prev => prev.map(r => r.id === rfqId ? {
      ...r,
      status: 'Quoted',
      quoteStatus: 'SUBMITTED',
      genericStatus: 'PRICED',
      internalPriceTotal: Math.round(totalAmt),
      lines: r.lines.map(l => ({
        ...l,
        internalPrice: linePrices[l.id] !== undefined ? linePrices[l.id] : l.internalPrice,
        adminProcessingStatus: 'PRICED'
      }))
    } : r));

    addAuditLog('Admin Pricing Desk', `Admin priced Generic RFQ ${targetRfq.rfqNumber} using FactoryGrid Internal Price List. Total: ₹${Math.round(totalAmt).toLocaleString('en-IN')}`);

    const notif: NotificationItem = {
      id: 'notif_gen_' + Date.now(),
      title: 'Generic Quote Ready',
      message: `FactoryGrid Admin priced Generic RFQ ${targetRfq.rfqNumber}. Quotation is ready for buyer review.`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'QUOTE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const selectQuoteAndCreateOrder = (rfqId: string, selections: Record<string, { mfgId: string; mfgName: string; price: number }>) => {
    const rfq = rfqs.find(r => r.id === rfqId || (r.rfqNumber && r.rfqNumber === rfqId));
    if (!rfq) return;

    // Check if an order already exists for this RFQ across both in-memory state and localStorage to prevent duplicate master orders
    let allKnownOrders = [...orders];
    const savedOrdersStr = localStorage.getItem('fg_orders');
    if (savedOrdersStr) {
      try {
        const parsed = JSON.parse(savedOrdersStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const knownMap = new Map<string, MasterOrder>();
          [...orders, ...parsed].forEach(o => {
            if (o && (o.id || o.orderNumber)) {
              knownMap.set(o.id || o.orderNumber, o);
            }
          });
          allKnownOrders = Array.from(knownMap.values());
        }
      } catch (e) {}
    }

    const existingOrder = allKnownOrders.find(o =>
      (Boolean(rfq.id) && Boolean(o.rfqId) && o.rfqId === rfq.id) ||
      (Boolean(rfq.rfqNumber) && Boolean(o.rfqNumber) && o.rfqNumber === rfq.rfqNumber)
    );
    if (existingOrder) {
      console.log('Master Order already exists for this RFQ:', existingOrder.orderNumber, existingOrder.poNumber);
      return existingOrder;
    }

    const isGenericRfq = Boolean(rfq.isGeneric || rfq.lines.some(l => l.productType === 'GENERIC'));

    // Build master order with sub-orders grouped by manufacturer
    const subOrderMap: Record<string, any[]> = {};
    let totalMasterAmount = 0;

    rfq.lines.forEach(line => {
      let selection = selections ? selections[line.id] : undefined;
      const isLineGeneric = isGenericRfq || line.productType === 'GENERIC';

      if (isLineGeneric) {
        // Generic products strictly use FactoryGrid Direct with no external manufacturer
        const genericPrice = line.internalPrice || (selection?.price ? selection.price : (line.targetPrice ? line.targetPrice : 4.20));
        selection = {
          mfgId: 'mfg_factorygrid',
          mfgName: 'FactoryGrid Direct (Generic Supply)',
          price: genericPrice
        };
      } else if (!selection) {
        const mfg = manufacturers[0];
        selection = {
          mfgId: mfg?.id || 'm1',
          mfgName: mfg?.companyName || 'Manufacturer Partner',
          price: line.targetPrice ? line.targetPrice * 0.95 : 38.50
        };
      }

      if (selection) {
        if (!subOrderMap[selection.mfgId]) {
          subOrderMap[selection.mfgId] = [];
        }
        const lineTotal = line.quantity * selection.price; // quantity * unit price
        totalMasterAmount += lineTotal;
        subOrderMap[selection.mfgId].push({
          id: 'sol_' + line.id,
          productId: line.productId || (line.molecule ? `GENERIC-${line.molecule}` : 'GENERIC-MED'),
          productName: line.productName || (line.molecule ? `${line.molecule} ${line.dosageForm || '500mg'} (Generic)` : 'Generic Medicine'),
          dosageForm: line.dosageForm || 'Tablet',
          quantity: line.quantity,
          unitPrice: selection.price,
          totalPrice: lineTotal,
          molecule: line.molecule || (isLineGeneric ? 'Generic' : undefined),
          productType: isLineGeneric ? 'GENERIC' : (line.productType || 'BRANDED')
        });
      }
    });

    const isOrderGeneric = isGenericRfq || Object.keys(subOrderMap).every(mId => mId === 'mfg_factorygrid');

    // Calculate unique sequential order number
    let highestSeq = 5230;
    allKnownOrders.forEach(o => {
      const match = (o.orderNumber || '').match(/MO-2026-(\d+)/) || (o.poNumber || '').match(/PO-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > highestSeq) highestSeq = num;
      }
    });
    const orderSeq = highestSeq + 1;
    const masterOrdNum = `MO-2026-${orderSeq}`;
    const autoPoNum = `PO-2026-${orderSeq}`;
    const newMasterOrderId = `mo_${Date.now()}`;
    const reqDeliveryDate = rfq.lines[0]?.requiredDate || rfq.deadlineDate || '2026-09-15';

    const subOrders = Object.keys(subOrderMap).map((mfgId, idx) => {
      const isMfgGeneric = mfgId === 'mfg_factorygrid' || isOrderGeneric;
      const mfg = manufacturers.find(m => m.id === mfgId);
      const items = subOrderMap[mfgId];
      const subTotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
      const subNum = `SO-2026-${orderSeq}-0${idx + 1}`;
      const subPoNum = `PO-SO-2026-${orderSeq}-0${idx + 1}`;

      return {
        id: `so_${Date.now()}_${idx}`,
        subOrderNumber: subNum,
        masterOrderId: newMasterOrderId,
        masterOrderNumber: masterOrdNum,
        poNumber: subPoNum,
        poStatus: 'AUTO-GENERATED' as const,
        manufacturerId: isMfgGeneric ? 'mfg_factorygrid' : mfgId,
        manufacturerName: isMfgGeneric ? 'FactoryGrid Direct (Generic Supply)' : (mfg ? mfg.companyName : 'Manufacturer Partner'),
        status: 'OPEN' as SubOrderStatus,
        customerClassification: rfq.customerClassification || 'REGULAR',
        totalAmount: Math.round(subTotal),
        startDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: reqDeliveryDate,
        lines: items,
        invoice: null,
        invoiceId: null,
        isGeneric: isMfgGeneric,
        rfqId: rfq.id,
        rfqNumber: rfq.rfqNumber
      };
    });

    const newMasterOrder: MasterOrder = {
      id: newMasterOrderId,
      orderNumber: masterOrdNum,
      poNumber: autoPoNum,
      poStatus: 'AUTO-GENERATED',
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      isGeneric: isOrderGeneric,
      orderType: isOrderGeneric ? 'GENERIC' : 'BRANDED',
      customerId: rfq.customerId || 'c1',
      customerName: rfq.customerName || 'Apex Pharma PCD Franchise',
      customerCode: rfq.customerCode || 'APEX-001',
      customerClassification: rfq.customerClassification || 'REGULAR',
      createdDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: reqDeliveryDate,
      status: 'OPEN',
      totalAmount: Math.round(totalMasterAmount),
      subOrders,
      shippingAddress: rfq.deliveryLocation || 'Industrial Zone, Plot 14, Phase I, Delhi',
      currency: 'INR'
    };

    setOrders(prev => {
      const updated = [newMasterOrder, ...prev.filter(o => o.id !== newMasterOrder.id && o.orderNumber !== newMasterOrder.orderNumber)];
      try {
        localStorage.setItem('fg_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    addAuditLog('PO Engine', `Auto-generated Purchase Order ${autoPoNum} for RFQ ${rfq.rfqNumber} and sent to Admin for review.`);
    setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: 'APPROVED' } : r));
    setQuotes(prev => prev.map(q => {
      if (q.rfqId === rfqId || q.rfqNumber === rfq.rfqNumber) {
        const matchingSubOrder = subOrders.find(so =>
          so.manufacturerId === q.manufacturerId ||
          (q.manufacturerId === 'mfg_factorygrid' && so.manufacturerId === 'mfg_factorygrid') ||
          q.manufacturerName?.includes('SunBio')
        );
        if (matchingSubOrder) {
          return {
            ...q,
            status: 'SUB-ORDER CREATED',
            subOrderId: matchingSubOrder.id,
            subOrderNumber: matchingSubOrder.subOrderNumber,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        } else {
          return {
            ...q,
            status: 'REJECTED',
            rejectionReason: 'Buyer awarded order to another manufacturer.',
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
      }
      return q;
    }));
    addAuditLog('Order Splitting', `Generated Master Order ${masterOrdNum} with ${subOrders.length} Sub-Orders`);

    // Register fresh sub-orders into Unified Storage for Production Execution & Dispatch
    try {
      const UNIFIED_KEY = 'factorygrid_unified_suborders_v12';
      const ARTWORK_KEY = 'factorygrid_product_artworks_v1';

      const saved = localStorage.getItem(UNIFIED_KEY);
      const currentStore = saved ? JSON.parse(saved) : {};

      const artSaved = localStorage.getItem(ARTWORK_KEY);
      const artStore = artSaved ? JSON.parse(artSaved) : {};

      subOrders.forEach(so => {
        const subNum = so.subOrderNumber;

        // Clear any stale artwork entry for newly created sub-orders so they start 100% clean
        delete artStore[subNum];

        currentStore[subNum] = {
          subOrderNumber: subNum,
          poNumber: `PO-${subNum}`,
          masterOrderNumber: masterOrdNum,
          customerName: rfq.customerName,
          manufacturerName: so.manufacturerName,
          productName: so.lines[0]?.productName || rfq.productName || 'Pharmaceutical Products',
          totalQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || rfq.targetQuantity || 10000,
          orderValue: so.totalAmount,
          requiredDeliveryDate: '2026-09-02',
          leadTimeDays: 14,

          // FRESH PRODUCTION WORKFLOW — STRICTLY AWAITING ACCEPTANCE & ARTWORK PENDING
          status: 'Awaiting Acceptance',
          productionStatus: 'PO_ACCEPTED',
          artworkRequired: true,
          artworkStatus: 'ARTWORK_PENDING',
          artworkFile: null,
          deliveryScheduleFinalized: false,
          batchNumber: '',
          manufacturingLine: '',
          plannedStartDate: '',
          expectedCompletionDate: '',
          progressPercent: 0,
          rawMaterialIssued: false,
          manufacturingStarted: false,
          qcInspectionResult: undefined,
          qcTestedQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || 10000,
          qcPassedQuantity: so.lines.reduce((acc: number, l: any) => acc + l.quantity, 0) || 10000,
          qcFailedQuantity: 0,
          qcRemarks: undefined,
          packagingPackSize: undefined,
          packagingMasterCartons: undefined,

          // STRICTLY NO SHIPMENT OR INVOICE AT CREATION
          shipment: null,
          invoice: null
        };
      });

      localStorage.setItem(UNIFIED_KEY, JSON.stringify(currentStore));
      localStorage.setItem(ARTWORK_KEY, JSON.stringify(artStore));
      window.dispatchEvent(new Event('storage'));

      if (subOrders[0]) {
        localStorage.setItem('factorygrid_target_suborder', subOrders[0].subOrderNumber);
      }
    } catch (e) {
      console.error('Failed to sync new sub-orders to unified store', e);
    }
  };

  const updatePODeliveryAddress = (orderId: string, address: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId || order.orderNumber === orderId) {
        return {
          ...order,
          shippingAddress: address,
          updatedDate: new Date().toISOString().split('T')[0]
        };
      }
      return order;
    }));
    addAuditLog('PO Engine', `Updated Delivery Address for Purchase Order ${orderId} to: "${address}".`);
  };

  const updateSubOrderArtwork = (subCode: string, artworkFileObj: any) => {
    const UNIFIED_KEY = 'factorygrid_unified_suborders_v12';
    let store: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(UNIFIED_KEY);
      if (saved) store = JSON.parse(saved);
    } catch (e) { }

    const targetRec = store[subCode] || {};
    const updatedRec = {
      ...targetRec,
      subOrderNumber: subCode,
      artworkRequired: true,
      artworkStatus: 'ARTWORK_COMPLETED',
      artworkFile: artworkFileObj,
      deliveryScheduleFinalized: true
    };
    store[subCode] = updatedRec;

    try {
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(store));
      localStorage.setItem('factorygrid_target_suborder', subCode);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }

    setOrders(prev => prev.map(mo => {
      if (mo.subOrders && mo.subOrders.some(so => so.subOrderNumber === subCode)) {
        return {
          ...mo,
          subOrders: mo.subOrders.map(so => {
            if (so.subOrderNumber === subCode) {
              return {
                ...so,
                artworkRequired: true,
                artworkStatus: 'ARTWORK_COMPLETED' as const,
                artworkFile: artworkFileObj
              };
            }
            return so;
          })
        };
      }
      return mo;
    }));

    addAuditLog('Artwork Engine', `Updated Artwork status to ARTWORK_COMPLETED for Sub-Order ${subCode}`);
  };

  const regeneratePO = (orderId: string, selectedLineIds?: string[]) => {
    const nowIso = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setOrders(prev => {
      const updated = prev.map(order => {
        const match = order.id === orderId ||
          order.orderNumber === orderId ||
          order.poNumber === orderId ||
          (order.poNumber && order.poNumber.startsWith(orderId.split('-REV')[0]));
        if (match) {
          // Calculate next sequential revision version accurately
          let currentVersion = order.poVersion;
          if (currentVersion === undefined || currentVersion === null) {
            const revMatch = order.poNumber?.match(/-REV(\d+)$/i);
            if (revMatch) {
              currentVersion = parseInt(revMatch[1], 10);
            } else {
              currentVersion = 0; // Base PO has version 0, so first regenerate becomes REV1
            }
          }
          const nextVersion = currentVersion + 1;

          // Base PO number without any old -REV suffix
          const rawPo = order.poNumber || order.orderNumber.replace('MO-', 'PO-');
          const basePoNum = rawPo.split('-REV')[0];
          const newPoNum = `${basePoNum}-REV${nextVersion}`;

          // Deep clone & regenerate sub-orders with updated PO revision metadata, filtering lines if selectedLineIds provided
          let refreshedSubOrders = (order.subOrders || []).map(so => {
            const lines = selectedLineIds && selectedLineIds.length > 0
              ? (so.lines || []).filter(l => selectedLineIds.includes(l.id) || selectedLineIds.includes(l.productId))
              : (so.lines || []).map(l => ({ ...l }));
            const subTotal = lines.reduce((sum, l) => sum + (l.totalPrice !== undefined ? l.totalPrice : (l.quantity * l.unitPrice)), 0);
            return {
              ...so,
              poNumber: `${so.subOrderNumber}-REV${nextVersion}`,
              lines,
              totalAmount: subTotal,
              poStatus: 'REGENERATED' as const,
              poRegeneratedAt: `${nowIso} ${nowTime}`
            };
          });

          // Only keep sub-orders that contain at least one line item
          if (selectedLineIds && selectedLineIds.length > 0) {
            refreshedSubOrders = refreshedSubOrders.filter(so => so.lines && so.lines.length > 0);
          }

          const newTotalAmount = refreshedSubOrders.reduce((sum, so) => sum + (so.totalAmount || 0), 0);

          // Construct complete regenerated PO object copying ALL existing PO fields
          const regeneratedOrder: MasterOrder = {
            ...order,
            poNumber: newPoNum,
            poVersion: nextVersion,
            subOrders: refreshedSubOrders,
            totalAmount: newTotalAmount,
            poStatus: 'REGENERATED' as const,
            poRegeneratedAt: `${nowIso} ${nowTime}`,
            updatedDate: nowIso,
            id: order.id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            customerName: order.customerName,
            customerCode: order.customerCode,
            createdDate: order.createdDate,
            expectedDeliveryDate: order.expectedDeliveryDate,
            status: order.status,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            paymentTerms: order.paymentTerms,
            currency: order.currency
          };

          return regeneratedOrder;
        }
        return order;
      });

      try {
        localStorage.setItem('fg_orders', JSON.stringify(updated));
      } catch (e) { }

      return updated;
    });

    addAuditLog('PO Engine', `Admin regenerated Purchase Order ${orderId}. Created PO Revision tag and retained in PENDING_ADMIN_REVIEW.`);
  };

  const submitPOToBuyer = (orderId: string) => {
    const nowIso = new Date().toISOString().split('T')[0];
    setOrders(prev => {
      const updated = prev.map(order => {
        const match = order.id === orderId ||
          order.orderNumber === orderId ||
          order.poNumber === orderId ||
          (order.poNumber && order.poNumber.startsWith(orderId.split('-REV')[0]));
        if (match) {
          const submittedSubOrders = (order.subOrders || []).map(so => ({
            ...so,
            poStatus: 'SUBMITTED_TO_BUYER' as const,
            poSubmittedToBuyerAt: nowIso
          }));
          return {
            ...order,
            poStatus: 'SUBMITTED_TO_BUYER' as const,
            subOrders: submittedSubOrders,
            updatedDate: nowIso
          };
        }
        return order;
      });

      try {
        localStorage.setItem('fg_orders', JSON.stringify(updated));
      } catch (e) { }

      return updated;
    });

    addAuditLog('PO Engine', `Admin submitted Purchase Order ${orderId} to Buyer.`);
  };

  const placeOrderOnHold = (orderId: string, reason: string) => {
    const nowIso = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTime = `${nowIso} ${nowTime}`;
    let affectedOrderNum = orderId;

    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId || order.orderNumber === orderId) {
          affectedOrderNum = order.orderNumber;
          const prevHistory = order.holdHistory || [];
          const newCount = (order.holdCount || 0) + 1;
          return {
            ...order,
            previousStatus: order.status !== 'ON_HOLD' ? order.status : (order.previousStatus || 'OPEN'),
            status: 'ON_HOLD' as const,
            isOnHold: true,
            holdCount: newCount,
            holdReason: reason,
            holdHistory: [
              ...prevHistory,
              { reason, timestamp: fullTime, heldBy: 'Super Admin' }
            ],
            updatedDate: nowIso
          };
        }
        return order;
      });

      try {
        localStorage.setItem('fg_orders', JSON.stringify(updated));
      } catch (e) { }

      return updated;
    });

    addAuditLog('Admin Governance', `Placed Master Order ${affectedOrderNum} on HOLD. Reason: ${reason}`);
  };

  const releaseOrderHold = (orderId: string) => {
    const nowIso = new Date().toISOString().split('T')[0];
    let affectedOrderNum = orderId;

    setOrders(prev => {
      const updated = prev.map(order => {
        if (order.id === orderId || order.orderNumber === orderId) {
          affectedOrderNum = order.orderNumber;
          return {
            ...order,
            status: (order.previousStatus && order.previousStatus !== 'ON_HOLD') ? order.previousStatus : 'OPEN',
            isOnHold: false,
            holdReason: undefined,
            updatedDate: nowIso
          };
        }
        return order;
      });

      try {
        localStorage.setItem('fg_orders', JSON.stringify(updated));
      } catch (e) { }

      return updated;
    });

    addAuditLog('Admin Governance', `Released Master Order ${affectedOrderNum} from HOLD.`);
  };

  const updateSubOrderStatus = (subOrderId: string, status: SubOrderStatus) => {
    setOrders(prev => prev.map(mo => {
      const hasSub = mo.subOrders.some(so => so.id === subOrderId);
      if (!hasSub) return mo;

      const updatedSubOrders = mo.subOrders.map(so => so.id === subOrderId ? { ...so, status } : so);

      let rolledStatus = mo.status;
      if (updatedSubOrders.some(so => so.status === 'IN_PRODUCTION')) {
        rolledStatus = 'IN_PRODUCTION';
      } else if (updatedSubOrders.every(so => so.status === 'DELIVERED')) {
        rolledStatus = 'DELIVERED';
      } else if (updatedSubOrders.some(so => so.status === 'DISPATCHED' || so.status === 'READY_TO_DISPATCH')) {
        rolledStatus = 'IN_TRANSIT';
      }

      return { ...mo, status: rolledStatus, subOrders: updatedSubOrders };
    }));
    addAuditLog('Manufacturing', `Updated sub-order ${subOrderId} status to ${status}`);
  };

  const verifyComplianceDocument = (caseId: string, docName: string, passed: boolean) => {
    setComplianceCases(prev => prev.map(c => {
      if (c.id !== caseId) return c;
      const updatedDocs = c.documents.map(d => d.name === docName ? { ...d, verified: passed } : d);
      return { ...c, documents: updatedDocs };
    }));
  };

  const approveComplianceCase = (caseId: string) => {
    const compCase = complianceCases.find(c => c.id === caseId);
    if (!compCase) return;

    setComplianceCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'APPROVED' } : c));
    if (compCase.entityType === 'CUSTOMER') {
      setCustomers(prev => prev.map(cust => cust.id === compCase.entityId ? { ...cust, status: 'ACTIVE', complianceStatus: 'APPROVED' } : cust));
    } else if (compCase.entityType === 'MANUFACTURER') {
      setManufacturers(prev => prev.map(mfg => mfg.id === compCase.entityId ? { ...mfg, status: 'ACTIVE', complianceStatus: 'APPROVED' } : mfg));
    }
    addAuditLog('Compliance Desk', `Approved compliance case ${compCase.caseNumber} for ${compCase.entityName}`);
  };

  const addInvoice = (newInvoice: Invoice) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is governance & monitoring. Tax invoices must be issued by manufacturers.");
      return;
    }
    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === newInvoice.id || i.invoiceNumber === newInvoice.invoiceNumber);
      let updated: Invoice[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...newInvoice };
      } else {
        updated = [newInvoice, ...prev];
      }
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    addAuditLog('Invoice Engine', `Created Tax Invoice ${newInvoice.invoiceNumber} for ${newInvoice.customerName} (Total: ₹${newInvoice.totalAmount.toLocaleString()})`);

    const newNotif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `B2B Tax Invoice ${newInvoice.invoiceNumber} Issued`,
      message: `Tax invoice ${newInvoice.invoiceNumber} generated for Master Order ${newInvoice.orderNumber} (Amount: ₹${newInvoice.totalAmount.toLocaleString()}).`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'INVOICE',
      read: false,
      link: 'invoices'
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const updateInvoice = (invoiceId: string, updatedFields: Partial<Invoice>) => {
    if (currentRole === 'ADMIN') {
      alert("Admin role cannot modify financial invoices.");
      return;
    }
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId) return inv;
      // Preserve existing payment records — never overwrite payments/paidAmount from edit
      const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
      const existingPaid = inv.paidAmount;
      const newTotal = updatedFields.totalAmount ?? inv.totalAmount;
      const newBal = Math.max(0, newTotal - existingPaid);
      let newStatus: InvoiceStatus = inv.status;
      if (newBal <= 0) newStatus = 'PAID';
      else if (existingPaid > 0) newStatus = 'PARTIAL_PAYMENT';
      else newStatus = updatedFields.status || inv.status;
      return {
        ...inv,
        ...updatedFields,
        paidAmount: existingPaid,
        balanceAmount: newBal,
        payments: existingPayments,
        status: newStatus
      };
    }));
    addAuditLog('Invoice Engine', `Edited Invoice ${invoiceId}`);
  };

  const deleteInvoice = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.filter(inv => inv.id !== invoiceId && inv.invoiceNumber !== invoiceId);
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
    addAuditLog('Invoice Engine', `Deleted Invoice ${invoiceId}`);
  };

  const sendInvoiceToCustomer = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
          return {
            ...inv,
            status: 'GENERATED' as const,
            sentToCustomer: true,
            sentAt: new Date().toISOString().split('T')[0]
          };
        }
        return inv;
      });
      try {
        localStorage.setItem('fg_invoices', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
    addAuditLog('Invoice Engine', `Sent Invoice ${invoiceId} to customer`);
  };

  const updateInvoiceStatus = (invoiceId: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status } : inv));
    addAuditLog('Invoices & AR', `Updated Invoice ${invoiceId} status to ${status}`);
  };

  const recordInvoicePayment = (
    invoiceId: string,
    amount: number,
    method = 'RTGS',
    ref = 'RTGS-' + Date.now(),
    currency = 'INR',
    paymentDate?: string
  ) => {
    if (currentRole === 'ADMIN') {
      alert("Admin access is strictly read-only monitoring & governance. Financial transaction execution is restricted to Accounts & Supplier roles.");
      return;
    }
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId && inv.invoiceNumber !== invoiceId) return inv;

      const curr = currency || inv.currency || 'INR';
      const validAmount = Math.max(0, amount);
      const timeStr = new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
      const pDate = paymentDate || new Date().toISOString().split('T')[0];

      const newRecord: PaymentRecord = {
        id: 'pay_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        invoiceId: inv.id,
        amount: validAmount,
        currency: curr,
        paymentMethod: method,
        paymentDate: pDate,
        reference: ref,
        status: 'COMPLETED',
        remarks: 'Payment recorded in treasury ledger',
        createdAt: new Date().toISOString(),
        timeline: [
          { title: `${curr} ${validAmount.toLocaleString()} received in account`, timestamp: timeStr, status: 'COMPLETED', details: `Ref/UTR: ${ref}` },
          { title: 'Payment ledger updated', timestamp: timeStr, status: 'COMPLETED' }
        ]
      };

      const existingPayments = Array.isArray(inv.payments) ? inv.payments : [];
      const updatedPayments = [...existingPayments, newRecord];

      const newPaid = Math.round(updatedPayments.reduce((acc, p) => acc + (p.amount || 0), 0) * 100) / 100;
      const newBal = Math.max(0, Math.round((inv.totalAmount - newPaid) * 100) / 100);

      let newStatus: InvoiceStatus = inv.status;
      if (newBal <= 0) {
        newStatus = 'PAID';
      } else if (newPaid > 0) {
        newStatus = 'PARTIAL_PAYMENT';
      } else {
        newStatus = 'UNPAID';
      }

      const newTx: PaymentTransaction = {
        id: 'tx_' + Date.now(),
        transactionRef: ref,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        date: pDate,
        amount: validAmount,
        paymentMethod: method as any,
        status: 'COMPLETED',
        remarks: 'Payment recorded in Accounts'
      };
      setPaymentTransactions(txPrev => [newTx, ...txPrev]);

      return {
        ...inv,
        paidAmount: newPaid,
        balanceAmount: newBal,
        status: newStatus,
        currency: curr,
        payments: updatedPayments
      };
    }));

    addAuditLog('Invoices & AR', `Recorded payment of ${currency || 'INR'} ${amount.toLocaleString()} for Invoice ${invoiceId}`);
  };

  const submitBuyerOnboarding = (data: Omit<BuyerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newBuyer: BuyerOnboarding = {
      ...data,
      id: 'bo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setBuyerOnboardings(prev => [newBuyer, ...prev]);

    // Also auto-generate CustomerVerificationRequest for Customer Verification module
    submitCustomerVerificationRequest({
      customerName: newBuyer.contactPerson || 'Representative',
      companyName: newBuyer.companyName,
      customerType: 'PCD',
      gstNumber: newBuyer.gstin || '07AAAAA0000A1Z5',
      panNumber: newBuyer.pan || 'AAAAA0000A',
      drugLicenseNumber: newBuyer.drugLicenseNo || 'DL-2026-REG',
      cinNumber: 'U24232DL2020PTC361234',
      email: newBuyer.email || 'customer@company.com',
      phone: newBuyer.phone || '+91 98765 43210',
      billingAddress: newBuyer.address || 'Industrial Area',
      shippingAddress: newBuyer.address || 'Industrial Area',
      state: 'Delhi',
      country: 'India',
      pincode: '110020',
      documents: newBuyer.documents?.map((d: any, idx: number) => ({
        id: `doc_public_${idx}`,
        documentType: (d.type as any) || 'GST Certificate',
        fileName: d.name,
        fileSize: '1.2 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'Valid',
        url: d.url || '#'
      })) || []
    });
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Buyer Onboarding', `Submitted onboarding application for ${newBuyer.companyName}`);
  };

  const submitManufacturerOnboarding = (data: Omit<ManufacturerOnboarding, 'id' | 'status' | 'submittedDate'>) => {
    const newMfg: ManufacturerOnboarding = {
      ...data,
      id: 'mo_' + Date.now(),
      status: 'UNDER_REVIEW',
      submittedDate: new Date().toISOString().split('T')[0]
    };
    setManufacturerOnboardings(prev => [newMfg, ...prev]);

    // Create matching compliance case
    const newCase: ComplianceCase = {
      id: 'comp_' + Date.now(),
      caseNumber: 'CMP-2026-' + (100 + complianceCases.length),
      entityType: 'MANUFACTURER',
      entityId: newMfg.id,
      entityName: newMfg.companyName,
      caseType: 'DRUG_LICENSE',
      status: 'UNDER_REVIEW',
      assignedOfficer: 'Compliance Desk Officer',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      riskScore: 'LOW',
      checklist: [
        { title: 'Manufacturing License Audit', mandatory: true, passed: true },
        { title: 'WHO-GMP Audit Certificate', mandatory: true, passed: true },
        { title: 'Capacity & Facility Audit', mandatory: true, passed: true }
      ],
      documents: newMfg.documents.map(d => ({ name: d.name, url: d.url, verified: false }))
    };
    setComplianceCases(prev => [newCase, ...prev]);
    addAuditLog('Manufacturer Onboarding', `Submitted factory onboarding application for ${newMfg.companyName}`);
  };

  const approveBuyerOnboarding = (id: string) => {
    const buyerCode = `BUY-2026-${100 + Math.floor(Math.random() * 900)}`;
    setBuyerOnboardings(prev => prev.map(b => b.id === id ? { ...b, status: 'APPROVED', buyerCode } : b));

    // Auto-create Customer in Directory
    const b = buyerOnboardings.find(item => item.id === id);
    if (b) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: buyerCode,
        name: b.companyName,
        type: 'PCD',
        gstin: b.gstin,
        pan: b.pan,
        drugLicenseNo: b.drugLicenseNo,
        contactPerson: b.contactPerson,
        email: b.email,
        phone: b.phone,
        city: b.address.split(',')[0] || 'Delhi',
        state: 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2000000,
        availableCredit: 2000000,
        creditDays: 45,
        riskScore: 'LOW',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Buyer Onboarding & Issued Code ${buyerCode}`);
  };

  const approveManufacturerOnboarding = (id: string) => {
    const manufacturerCode = `MFG-2026-${100 + Math.floor(Math.random() * 900)}`;
    setManufacturerOnboardings(prev => prev.map(m => m.id === id ? { ...m, status: 'APPROVED', manufacturerCode } : m));

    const m = manufacturerOnboardings.find(item => item.id === id);
    if (m) {
      const newMfg: Manufacturer = {
        id: 'm_' + Date.now(),
        code: manufacturerCode,
        name: m.companyName,
        companyName: m.companyName,
        mfgLicenseNo: m.mfgLicenseNo,
        gstin: m.gstin,
        pan: m.pan,
        contactPerson: m.contactPerson,
        email: m.email,
        phone: m.phone,
        city: m.factoryLocation.split(',')[0] || 'Baddi',
        state: 'Himachal Pradesh',
        certifications: m.certifications.map((c, i) => ({
          id: 'cert_' + i,
          name: c,
          certificateNo: 'CERT-' + Math.floor(Math.random() * 889900),
          issuedBy: 'CDSCO / State FDA',
          issueDate: '2025-01-01',
          expiryDate: '2028-12-31',
          status: 'VALID'
        })),
        rating: 4.8,
        complianceStatus: 'APPROVED',
        status: 'ACTIVE',
        activeSubOrders: 0
      };
      setManufacturers(prev => [newMfg, ...prev]);
    }
    addAuditLog('Compliance Desk', `Approved Manufacturer Onboarding & Issued Code ${manufacturerCode}`);
  };

  const updateShipmentStatus = (shipmentId: string, status: Shipment['status']) => {
    setShipments(prev => prev.map(s => s.id === shipmentId ? { ...s, status } : s));
  };

  const addCRMInteraction = (leadId: string, summary: string, type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE') => {
    setCrmLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const newInteraction = {
        id: 'int_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type,
        summary,
        author: currentRole
      };
      return { ...l, interactions: [newInteraction, ...l.interactions] };
    }));
  };

  const submitCustomerVerificationRequest = (reqData: Partial<CustomerVerificationRequest>) => {
    const newId = `CUS-VER-${100 + customerVerifications.length + 1}`;
    const gst = reqData.gstNumber || '';
    const pan = reqData.panNumber || '';
    const docs = reqData.documents || [];

    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gst.trim()) || gst.length >= 10;
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan.trim()) || pan.length >= 8;
    const hasAllDocs = docs.length >= 6;
    const hasFields = !!(reqData.companyName && reqData.customerType && reqData.gstNumber && reqData.panNumber && reqData.drugLicenseNumber && reqData.cinNumber);

    const autoValOverall = (isGstValid && isPanValid && hasAllDocs && hasFields) ? 'Valid' : 'Pending Review';

    const newReq: CustomerVerificationRequest = {
      id: newId,
      customerName: reqData.customerName || 'Representative',
      companyName: reqData.companyName || 'New Pharma Entity',
      customerType: reqData.customerType || 'PCD',
      registrationDate: new Date().toISOString().split('T')[0],
      verificationStatus: 'Under Review',
      assignedComplianceOfficer: 'Rajesh Kumar (Compliance Desk A)',
      gstNumber: gst,
      panNumber: pan,
      drugLicenseNumber: reqData.drugLicenseNumber || '',
      cinNumber: reqData.cinNumber || '',
      email: reqData.email || '',
      phone: reqData.phone || '',
      address: reqData.address || '',
      city: reqData.city || '',
      state: reqData.state || '',
      pincode: reqData.pincode || '',
      estimatedMonthlyVolume: reqData.estimatedMonthlyVolume || '₹10,00,000 / month',
      documents: docs,
      autoValidation: {
        gstCheck: isGstValid ? 'Valid' : 'Invalid',
        panCheck: isPanValid ? 'Valid' : 'Invalid',
        requiredDocsCheck: hasAllDocs ? 'Valid' : 'Pending Review',
        requiredFieldsCheck: hasFields ? 'Valid' : 'Invalid',
        overallStatus: autoValOverall,
        validationDetails: [
          isGstValid ? 'GSTIN structure format verified.' : 'GSTIN format warning.',
          isPanValid ? 'PAN structure format verified.' : 'PAN format warning.',
          hasAllDocs ? 'All 6 required onboarding documents present.' : `${docs.length}/6 mandatory documents attached.`,
          hasFields ? 'Required corporate details populated.' : 'Missing required regulatory fields.'
        ]
      },
      businessVerification: {
        gstActiveStatus: 'Active',
        panValidation: 'Verified',
        companyRegistrationValidation: 'Verified (ROC)',
        cinValidation: 'Active & Verified'
      },
      regulatoryVerification: {
        drugLicenseValidity: 'Valid (Form 20B/21B)',
        licenseExpiryCheck: 'Valid until 15-Dec-2028 (850 days remaining)',
        stateRegulatoryAuthorityValidation: 'Verified with State FDA'
      },
      financialVerification: {
        bankVerification: 'Verified (Penny Drop Passed)',
        creditRating: 'AA (Moderate Risk)',
        riskClassification: 'LOW'
      }
    };

    setCustomerVerifications(prev => [newReq, ...prev]);
    addAuditLog('Customer Verification', `Submitted verification request for ${newReq.companyName}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `New Customer Verification Request`,
      message: `${newReq.companyName} (${newReq.customerType}) submitted verification request. Assigned to ${newReq.assignedComplianceOfficer}.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const assignComplianceOfficer = (requestId: string, officerName: string) => {
    setCustomerVerifications(prev => prev.map(req => {
      if (req.id !== requestId) return req;
      return {
        ...req,
        assignedComplianceOfficer: officerName,
        verificationStatus: req.verificationStatus === 'Pending' ? 'Under Review' : req.verificationStatus
      };
    }));
    addAuditLog('Customer Verification', `Assigned ${officerName} to request ${requestId}`);
  };

  const approveCustomerVerification = (requestId: string) => {
    const req = customerVerifications.find(r => r.id === requestId);
    if (!req) return;

    const generatedCode = `CUS000${100 + Math.floor(Math.random() * 900)}`;

    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Active',
        customerCode: generatedCode,
        portalLoginCreated: true,
        portalUsername: r.email,
        approvedAt: new Date().toISOString().split('T')[0]
      };
    }));

    const existingCust = customers.find(c => c.name === req.companyName || c.email === req.email);
    if (!existingCust) {
      const newCust: Customer = {
        id: 'c_' + Date.now(),
        code: generatedCode,
        name: req.companyName,
        type: req.customerType,
        customerClassification: req.customerClassification || 'REGULAR',
        classificationUpdatedAt: req.classificationUpdatedAt,
        classificationUpdatedBy: req.classificationUpdatedBy,
        gstin: req.gstNumber,
        pan: req.panNumber,
        drugLicenseNo: req.drugLicenseNumber,
        contactPerson: req.customerName,
        email: req.email,
        phone: req.phone,
        city: req.city || 'Delhi',
        state: req.state || 'Delhi',
        status: 'ACTIVE',
        complianceStatus: 'APPROVED',
        creditLimit: 2500000,
        availableCredit: 2500000,
        creditDays: 45,
        riskScore: req.financialVerification.riskClassification,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
    } else {
      setCustomers(prev => prev.map(c => c.id === existingCust.id ? { ...c, status: 'ACTIVE', complianceStatus: 'APPROVED', code: generatedCode } : c));
    }

    addAuditLog('Customer Verification', `Approved ${req.companyName}. Generated Code: ${generatedCode}, Created Portal Login.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Approved & Active`,
      message: `${req.companyName} verification approved. Customer Code: ${generatedCode}. Account status is now Active.`,
      timestamp: 'Just now',
      type: 'SUCCESS',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const rejectCustomerVerification = (requestId: string, reason: string) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Rejected',
        rejectionReason: reason
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Rejected customer verification for ${req?.companyName || requestId}. Reason: ${reason}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Customer Verification Rejected`,
      message: `Verification for ${req?.companyName || requestId} was rejected. Reason: ${reason}`,
      timestamp: 'Just now',
      type: 'ERROR',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const requestMoreCustomerDocs = (requestId: string, notes: string[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        verificationStatus: 'Need More Docs',
        requestedDocumentsNotes: notes
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Requested additional documents for ${req?.companyName || requestId}`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Additional Documents Required`,
      message: `Customer ${req?.companyName} requires document re-submission: ${notes.join('; ')}`,
      timestamp: 'Just now',
      type: 'WARNING',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const resubmitCustomerDocs = (requestId: string, updatedDocs: CustomerVerificationDocument[]) => {
    setCustomerVerifications(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      return {
        ...r,
        documents: updatedDocs,
        verificationStatus: 'Under Review',
        requestedDocumentsNotes: undefined
      };
    }));

    const req = customerVerifications.find(r => r.id === requestId);
    addAuditLog('Customer Verification', `Resubmitted documents for ${req?.companyName || requestId}. Status updated to Under Review.`);

    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: `Documents Resubmitted`,
      message: `${req?.companyName} re-submitted requested documents. Case returned to Under Review.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const updateCustomerClassification = (targetIdOrNameOrCode: string, classification: CustomerClassification) => {
    if (currentRole !== 'ADMIN') {
      alert("Permission Denied: Only Platform Admin can modify customer classification.");
      return;
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let customerName = targetIdOrNameOrCode;
    let prevClassification: CustomerClassification = 'REGULAR';

    // 1. Update customerVerifications state
    setCustomerVerifications(prev => prev.map(rec => {
      if (rec.id === targetIdOrNameOrCode || rec.companyName === targetIdOrNameOrCode || rec.customerCode === targetIdOrNameOrCode) {
        customerName = rec.companyName;
        prevClassification = rec.customerClassification || 'REGULAR';
        return {
          ...rec,
          customerClassification: classification,
          classificationUpdatedAt: nowStr,
          classificationUpdatedBy: 'Platform Admin'
        };
      }
      return rec;
    }));

    // 2. Update customers state
    setCustomers(prev => prev.map(c => {
      if (c.id === targetIdOrNameOrCode || c.name === targetIdOrNameOrCode || c.code === targetIdOrNameOrCode || c.name === customerName) {
        customerName = c.name;
        prevClassification = c.customerClassification || prevClassification;
        return {
          ...c,
          customerClassification: classification,
          classificationUpdatedAt: nowStr,
          classificationUpdatedBy: 'Platform Admin'
        };
      }
      return c;
    }));

    // 3. Keep downstream active RFQs and Orders in sync so UI immediately updates
    setRfqs(prev => prev.map(rfq => {
      if (rfq.customerId === targetIdOrNameOrCode || rfq.customerName === customerName || rfq.customerCode === targetIdOrNameOrCode) {
        return { ...rfq, customerClassification: classification };
      }
      return rfq;
    }));

    setOrders(prev => prev.map(ord => {
      if (ord.customerId === targetIdOrNameOrCode || ord.customerName === customerName || ord.customerCode === targetIdOrNameOrCode) {
        return {
          ...ord,
          customerClassification: classification,
          subOrders: (ord.subOrders || []).map(so => ({ ...so, customerClassification: classification }))
        };
      }
      return ord;
    }));

    // 4. Record enterprise Audit Log in System Administration
    const prevLabel = prevClassification === 'SPECIAL_PARTY' ? 'Special Party' : 'Regular Customer';
    const newLabel = classification === 'SPECIAL_PARTY' ? 'Special Party' : 'Regular Customer';
    addAuditLog(
      'System Administration',
      `Customer Classification Updated | Customer: ${customerName} | Previous: ${prevLabel} | New: ${newLabel} | Updated by: Platform Admin`
    );

    // 5. Post notification
    const notif: NotificationItem = {
      id: 'n_' + Date.now(),
      title: 'Customer Classification Updated',
      message: `${customerName} is now classified as ${newLabel}.`,
      timestamp: 'Just now',
      type: 'INFO',
      category: 'COMPLIANCE',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // ── Two-Factor Authentication (2FA) State & Functions ─────────────
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>(() => {
    try {
      const saved = localStorage.getItem('factorygrid_2fa_state');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return {
      isEnabled: false,
      recoveryCodes: []
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('factorygrid_2fa_state', JSON.stringify(twoFactorState));
    } catch (e) { }
  }, [twoFactorState]);

  const enable2FA = (secret: string, codes: string[]) => {
    const formattedCodes = codes.map(c => ({ code: c, isUsed: false }));
    const newState: TwoFactorState = {
      isEnabled: true,
      secret,
      enabledAt: new Date().toISOString().split('T')[0],
      recoveryCodes: formattedCodes
    };
    setTwoFactorState(newState);
    addAuditLog('Security Settings', '2FA Two-Factor Authentication Enabled');
  };

  const disable2FA = async (currentPass: string, totpCode: string): Promise<{ success: boolean; message: string }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: false, message: '2FA is not enabled on this account.' };
    }

    if (currentPass !== 'password123' && currentPass.length < 4) {
      return { success: false, message: '✕ Password verification failed. Incorrect current password.' };
    }

    const isValidOtp = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (!isValidOtp) {
      return { success: false, message: '✕ Invalid 2FA verification code. Please check your authenticator app.' };
    }

    setTwoFactorState({ isEnabled: false, recoveryCodes: [] });
    addAuditLog('Security Settings', '2FA Two-Factor Authentication Disabled');
    return { success: true, message: '✓ Two-Factor Authentication disabled successfully.' };
  };

  const verify2FAAttempt = async (totpCode: string): Promise<{ success: boolean; message: string }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: true, message: '2FA is disabled.' };
    }
    const isValid = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (isValid) {
      addAuditLog('Authentication', 'Successful 2FA Verification');
      return { success: true, message: '✓ 2FA Verified' };
    } else {
      addAuditLog('Security Alert', 'Failed 2FA Verification Attempt');
      return { success: false, message: '✕ Invalid verification code. Please try again.' };
    }
  };

  const useRecoveryCode = (inputCode: string): { success: boolean; message: string } => {
    if (!twoFactorState.isEnabled) return { success: false, message: '2FA is not enabled.' };
    const cleanCode = inputCode.trim().toUpperCase();
    const existingIndex = twoFactorState.recoveryCodes.findIndex(rc => rc.code.toUpperCase() === cleanCode);

    if (existingIndex === -1) {
      return { success: false, message: '✕ Invalid recovery code.' };
    }

    if (twoFactorState.recoveryCodes[existingIndex].isUsed) {
      return { success: false, message: '✕ This recovery code has already been used.' };
    }

    const updatedCodes = [...twoFactorState.recoveryCodes];
    updatedCodes[existingIndex] = {
      ...updatedCodes[existingIndex],
      isUsed: true,
      usedAt: new Date().toISOString()
    };

    setTwoFactorState(prev => ({ ...prev, recoveryCodes: updatedCodes }));
    addAuditLog('Authentication', '2FA Recovery Code Used');
    return { success: true, message: '✓ Recovery Code Verified. Sign in authorized.' };
  };

  const regenerateRecoveryCodes = async (currentPass: string, totpCode: string): Promise<{ success: boolean; message: string; newCodes?: string[] }> => {
    if (!twoFactorState.isEnabled || !twoFactorState.secret) {
      return { success: false, message: '2FA is not enabled.' };
    }

    if (currentPass !== 'password123' && currentPass.length < 4) {
      return { success: false, message: '✕ Incorrect current password.' };
    }

    const isValidOtp = await verifyTOTPToken(twoFactorState.secret, totpCode);
    if (!isValidOtp) {
      return { success: false, message: '✕ Invalid 2FA verification code.' };
    }

    const newRawCodes = generateRecoveryCodes(8);
    const formatted = newRawCodes.map(c => ({ code: c, isUsed: false }));

    setTwoFactorState(prev => ({ ...prev, recoveryCodes: formatted }));
    addAuditLog('Security Settings', '2FA Recovery Codes Regenerated');
    return { success: true, message: '✓ New recovery codes generated successfully.', newCodes: newRawCodes };
  };

  const resetDemoState = () => {
    // 1. Reset customers & customerVerifications to pristine mockData
    setCustomers(mockCustomers);
    setCustomerVerifications(mockCustomerVerifications);

    // 2. Reset RFQs, Orders, and Quotes to pristine initial mockData
    setRfqs(mockRFQs);
    setOrders(mockMasterOrders);
    setQuotes(mockQuotes);

    // 3. Reset Active Buyer Persona to Normal
    setActiveBuyerAccountState('NORMAL');
    setUserProfileState(defaultBuyerProfile);
    setOrgProfileState(defaultBuyerOrg);

    // 4. Clear temporary demo persistence from storage and sync pristine baseline
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('fg_rfqs');
        localStorage.removeItem('fg_orders');
        localStorage.removeItem('factorygrid_unified_suborders_v11');
        localStorage.removeItem('factorygrid_suborders_artwork_v1');
        localStorage.removeItem('factorygrid_target_suborder');
        localStorage.removeItem('fg_quotes');
        localStorage.removeItem('fg_custom_verifications');
        localStorage.removeItem('fg_invoices');
        localStorage.setItem('fg_rfqs', JSON.stringify(mockRFQs));
        localStorage.setItem('fg_orders', JSON.stringify(mockMasterOrders));
        localStorage.setItem('fg_quotes', JSON.stringify(mockQuotes));
      } catch (e) {}
    }

    addAuditLog('System Administration', 'Demo State Reset | All customer flags, temporary RFQs and mock datasets restored to clean baseline.');
    const notif: NotificationItem = {
      id: 'n_reset_' + Date.now(),
      title: 'Demo State Reset',
      message: 'All temporary demo selections, customer flags, and RFQs have been reset to a clean baseline.',
      timestamp: 'Just now',
      type: 'INFO',
      category: 'SYSTEM',
      read: false
    };
    setNotifications(prev => [notif, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated, login, logout,
      currentRole, setCurrentRole,
      activeTab, setActiveTab,
      activeBuyerAccount, setActiveBuyerAccount, resetDemoState,
      customers, manufacturers, products, setProducts, addProductMaster, updateProductMaster, toggleProductMasterStatus,
      categories, setCategories, categoryMargins, setCategoryMargins, addCategory, updateCategory, deleteCategory, toggleCategoryStatus, updateCategoryMargin, getCategoryMargin, getCategoryMarginConfig,
      marginRules, setMarginRules, addOrUpdateMarginRule, deleteMarginRule, getApplicableMargin,
      updateProductMargin, bulkUpdateProductMargins, platformFeeConfig, updatePlatformFeeConfig,
      subCategories, setSubCategories, addSubCategory, updateSubCategory, deleteSubCategory, toggleSubCategoryStatus,
      subSubCategories, setSubSubCategories, addSubSubCategory, updateSubSubCategory, deleteSubSubCategory, toggleSubSubCategoryStatus,
      mappings, setMappings, addMapping, updateMapping, removeMapping,
      rfqs, quotes, orders, invoices, complianceCases, notifications,
      declinedRfqs, declineRFQ,
      negotiationThreads, sendNegotiationMessage, revisedQuotes, submitRevisedQuote,
      buyerOnboardings, manufacturerOnboardings, shipments, crmLeads,
      paymentTransactions, auditLogs, customerVerifications,
      selectedMfgIdForProfile, setSelectedMfgIdForProfile,
      mfgProfileProductContext, setMfgProfileProductContext,
      isCreateRfqDrawerOpen, setIsCreateRfqDrawerOpen, openCreateRfqDrawer,
      addRFQ, submitQuote, selectQuoteAndCreateOrder,
      internalPriceList, submitGenericAdminPricing,
      updatePODeliveryAddress, updateSubOrderArtwork, regeneratePO, submitPOToBuyer,
      placeOrderOnHold, releaseOrderHold,
      updateSubOrderStatus, verifyComplianceDocument, approveComplianceCase,
      addInvoice, updateInvoice, updateInvoiceStatus, recordInvoicePayment, submitBuyerOnboarding, submitManufacturerOnboarding,
      approveBuyerOnboarding, approveManufacturerOnboarding, updateShipmentStatus,
      addCRMInteraction, addAuditLog,
      submitCustomerVerificationRequest, assignComplianceOfficer,
      approveCustomerVerification, rejectCustomerVerification,
      requestMoreCustomerDocs, resubmitCustomerDocs, updateCustomerClassification,
      userProfile, orgProfile, userDocuments, profileSubTab, setProfileSubTab,
      updateUserProfile, updateOrgProfile, uploadUserDocument, replaceUserDocument,
      changeUserPassword, openProfileTab,
      twoFactorState, enable2FA, disable2FA, verify2FAAttempt, useRecoveryCode, regenerateRecoveryCodes,
      shipmentConnectors, gstConnectors, saveShipmentConnector, disconnectShipmentConnector, saveGSTConnector, disconnectGSTConnector,
      moduleFilters, setModuleFilter, navigateWithFilter, openManufacturerProfile,
      mfgProfileInitialTab, setMfgProfileInitialTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};


