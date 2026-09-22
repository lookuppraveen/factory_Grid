export type UserRole = 
  | 'BUYER' 
  | 'SUPPLIER' 
  | 'COMPLIANCE_OFFICER' 
  | 'ADMIN' 
  | 'SALES_MANAGER' 
  | 'ACCOUNTS_MANAGER'
  | 'FACTORY_BUDDY';

export type CustomerType = 'PCD' | 'TPM' | 'DISTRIBUTOR' | 'HOSPITAL' | 'EXPORT' | 'WHOLESALER';

export type CustomerClassification = 'REGULAR' | 'SPECIAL_PARTY';

export type ComplianceStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type RFQStatus = 'Draft' | 'Submitted' | 'Pricing In Progress' | 'Quoted' | 'Approved' | 'Rejected' | 'Closed';

export type DistributionStatus = 'Sent' | 'Opened' | 'Responded' | 'Not Responded' | 'Declined';

export interface ManufacturerRFQLine {
  id: string;
  manufacturerRfqId: string;
  rfqLineId: string;
  productId: string;
  productName: string;
  quantity: number;
  requiredDate: string;
  remarks?: string;
}

export interface ManufacturerRFQ {
  id: string;
  rfqId: string;
  rfqNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  status: DistributionStatus;
  sentDate: string;
  emailNotificationSent: boolean;
  smsNotificationSent: boolean;
  lines: ManufacturerRFQLine[];
  customerClassification?: CustomerClassification;
  declineReason?: string;
  declineRemarks?: string;
  declinedAt?: string;
}

export type QuoteStatus = 'DRAFT' | 'SUBMITTED' | 'BUYER REVIEWING' | 'NEGOTIATION' | 'ACCEPTED' | 'REJECTED' | 'SUB-ORDER CREATED' | 'EXPIRED' | 'SELECTED' | 'NOT_SELECTED';

export type MasterOrderStatus = 'OPEN' | 'SCHEDULED' | 'IN_PRODUCTION' | 'PACKAGING' | 'READY_TO_DISPATCH' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'CLOSED' | 'ON_HOLD';

export type SubOrderStatus = 'OPEN' | 'SCHEDULED' | 'IN_PRODUCTION' | 'PACKAGING' | 'READY_TO_DISPATCH' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';

export type InvoiceStatus = 'GENERATED' | 'SENT_TO_CUSTOMER' | 'OPEN' | 'UNPAID' | 'PARTIAL_PAYMENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface PaymentTimelineEvent {
  title: string;
  timestamp: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  details?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentDate: string;
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'SETTLED';
  remarks?: string;
  timeline?: PaymentTimelineEvent[];
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  customerClassification?: CustomerClassification;
  classificationUpdatedAt?: string;
  classificationUpdatedBy?: string;
  gstin: string;
  pan: string;
  drugLicenseNo: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  complianceStatus: ComplianceStatus;
  creditLimit: number;
  availableCredit: number;
  creditDays: number;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  joinedDate: string;
}

export interface Certification {
  id: string;
  name: string;
  certificateNo: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface CapabilityItem {
  category: string;
  monthlyCapacity: string;
  dosageForms: string[];
  techTags: string[];
}

export interface FacilityInfo {
  areaSqFt: string;
  cleanroomClass: string;
  productionLines: string;
  rndCenter: boolean;
}

export interface PerformanceMetrics {
  ordersCompleted: number;
  onTimeDeliveryRate: number;
  batchQualityPassRate: number;
  avgRfqResponseHours: number;
}

export interface ManufacturerReview {
  id: string;
  buyerName: string;
  buyerCode?: string;
  orderNumber: string;
  productName: string;
  rating: number;
  date: string;
  comment: string;
  verifiedBuyer: boolean;
}

export interface ManufacturerRatingDetails {
  overallRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  metrics: {
    qualityRating: number;
    deliveryRating: number;
    communicationRating: number;
  };
}

export interface Manufacturer {
  id: string;
  code: string;
  companyName: string;
  brandName?: string;
  mfgLicenseNo: string;
  gstin: string;
  pan: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  complianceStatus: ComplianceStatus;
  rating: number;
  ratingsDetails?: ManufacturerRatingDetails;
  reviews?: ManufacturerReview[];
  activeSubOrders: number;
  facilities?: FacilityInfo;
  capabilities?: CapabilityItem[];
  certifications?: Certification[];
  performanceMetrics?: PerformanceMetrics;
  logoUrl?: string;
  coverImageUrl?: string;
  verifiedBadge?: boolean;
}

export interface CategoryMaster {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
  productCount?: number;
}

export interface SubCategoryMaster {
  id: string;
  categoryId: string;
  parentCategory: string;
  name: string;
  code: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface SubSubCategoryMaster {
  id: string;
  subCategoryId: string;
  categoryId?: string;
  parentCategory?: string;
  parentSubCategory?: string;
  name: string;
  code: string;
  description?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt?: string;
}

export type MarginType = 'PERCENTAGE' | 'FIXED_RATE';
export type MarginScopeType = 'MANUFACTURER' | 'CATEGORY' | 'SUB_CATEGORY' | 'SUB_SUB_CATEGORY' | 'PRODUCT' | 'DEFAULT';

export interface CategoryMargin {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  marginType?: MarginType; // 'PERCENTAGE' | 'FIXED_RATE'
  marginPercentage: number; // percentage value (for backwards compatibility)
  marginRate?: number; // fixed rate in ₹ / unit
  status: 'Active' | 'Inactive';
  updatedAt?: string;
  updatedBy?: string;
}

export interface MarginRule {
  margin_rule_id: string;
  scope_type?: MarginScopeType;
  manufacturer_id?: string | null;
  manufacturer_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  sub_category_id?: string | null;
  sub_category_name?: string | null;
  sub_sub_category_id?: string | null;
  sub_sub_category_name?: string | null;
  product_id?: string | null;
  sku_id?: string | null;
  margin_type?: MarginType; // 'PERCENTAGE' | 'FIXED_RATE'
  margin_value?: number; // active value according to margin_type
  margin_rate?: number; // fixed rate in ₹ / unit
  margin_percentage: number; // percentage value (for backwards compatibility)
  priority: number; // 1: SKU, 2: Mfg+Cat, 3: Mfg, 4: Cat, 5: Default
  status: 'Active' | 'Inactive';
  effective_from?: string;
  effective_to?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  genericName: string;
  dosageForm: string;
  composition?: string;
  packSize: string;
  moq: number;
  mrp?: number;
  targetPrice?: number;
  hsnCode?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Inactive';
  registeredCount?: number;
  storageCondition?: string;
  shelfLifeMonths?: number;
  therapeuticCategory?: string;
  brandNames?: string[];
  requiresColdChain?: boolean;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  sku?: string;
  category?: string;
  categoryId?: string;
  subCategory?: string;
  subCategoryId?: string;
  subSubCategory?: string;
  subSubCategoryId?: string;
  saltCombination?: string;
  strength?: string;
  uom?: string;
  description?: string;
  manufacturersCount?: number;
  regulatoryInfo?: string[];
  basePrice?: number;
  marginPercentage?: number;
  isGeneric?: boolean;
  supplierSource?: string;
}

export type QaCategory = 'QUALITY_CONTROL' | 'ASSAY_TESTING' | 'PACKAGING_LABELING' | 'REGULATORY_COMPLIANCE' | 'GENERAL_QA';
export type QaPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface QaMessageThread {
  id: string;
  senderRole: 'BUYER' | 'ADMIN' | 'SUPPLIER';
  senderName: string;
  senderOrg?: string;
  message: string;
  timestamp: string;
  attachmentName?: string;
}

export interface QaRequestItem {
  id: string;
  qaNumber: string;
  subject: string;
  description: string;
  category: QaCategory;
  priority: QaPriority;
  raisedByRole: 'BUYER' | 'SUPPLIER';
  raisedByName: string;
  raisedByOrg?: string;
  createdAt: string;
  contextType?: 'ORDER' | 'SUB_ORDER' | 'PO' | 'PRODUCT';
  contextId?: string;
  contextNumber?: string;
  manufacturerName?: string;
  productName?: string;
  status: 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'ADMIN_RESPONDED' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'CLOSED';
  attachmentName?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminResponse?: string;
  messages?: QaMessageThread[];
}

export interface ProductManufacturerMapping {
  id: string;
  productId: string;
  productName: string;
  manufacturerId: string;
  manufacturerName: string;
  manufacturerCode: string;
  contractStatus: 'ACTIVE' | 'UNDER_RENEWAL' | 'TERMINATED';
  contractValidUntil: string;
}

export interface ManufacturerProductMapping {
  id?: string;
  productId: string;
  manufacturerId?: string;
  manufacturerCode?: string;
  manufacturerName?: string;
  mfgProductCode: string;
  moq: number;
  standardLeadTimeDays: number;
  unitPriceEstimate?: number;
  productSpecificCertifications?: string[];
  packaging?: string;
  status?: string;
  // Product-level margin configuration (strictly at Product level)
  marginType?: MarginType; // 'PERCENTAGE' | 'FIXED_RATE'
  marginValue?: number; // active value according to marginType
  marginRate?: number; // ₹/unit when FIXED_RATE
  marginStatus?: 'Active' | 'Inactive' | 'Pending';
  marginUpdatedAt?: string;
}

export interface ProductMargin {
  id: string;
  manufacturerId: string;
  manufacturerName?: string;
  productId: string;
  productName?: string;
  manufacturerProductCode: string;
  sku?: string;
  marginType: MarginType; // 'PERCENTAGE' | 'FIXED_RATE'
  marginValue: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFeeConfig {
  feeType: 'PERCENTAGE' | 'FIXED_RATE';
  feeValue: number; // e.g. 2.0% platform fee
  feeName?: string;
  status: 'Active' | 'Inactive';
  updatedAt?: string;
}

export interface InternalPriceListItem {
  id: string;
  molecule: string;
  productName: string;
  dosageForm: string;
  strength: string;
  packSize: string;
  internalPrice: number;
  currency: string;
  moq: number;
  effectiveDate: string;
  category?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface RFQLine {
  id: string;
  productId: string;
  productName: string;
  genericName?: string;
  saltCombination?: string;
  strength?: string;
  dosageForm: string;
  packSize: string;
  quantity: number;
  unit?: string;
  requiredDate: string;
  targetPrice?: number;
  buyerProvidedPrice?: number;
  remarks?: string;
  eligibleManufacturersCount: number;
  eligibleManufacturerIds?: string[];
  selectedManufacturerId?: string;
  selectedManufacturerName?: string;
  productType?: 'BRANDED' | 'GENERIC';
  molecule?: string;
  genericId?: string;
  internalPrice?: number;
  adminProcessingStatus?: 'SUBMITTED' | 'ADMIN_PROCESSING' | 'PRICED' | 'READY_FOR_ORDER';
  isOther?: boolean;
  customProductName?: string;
}

export interface RFQAttachment {
  id: string;
  name: string;
  type: 'SPEC' | 'ARTWORK' | 'QUALITY' | 'BOQ';
  size: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerClassification?: CustomerClassification;
  createdDate: string;
  deadlineDate: string;
  status: RFQStatus;
  quoteStatus?: string;
  lines: RFQLine[];
  remarks?: string;
  priority?: 'STANDARD' | 'HIGH' | 'URGENT';
  deliveryLocation?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  allowPartialAward?: boolean;
  allowMultipleManufacturers?: boolean;
  attachments?: RFQAttachment[];
  productWiseDistribution?: Record<string, string[]>;
  isGeneric?: boolean;
  genericStatus?: 'DRAFT' | 'SUBMITTED' | 'ADMIN_PROCESSING' | 'PRICED' | 'READY_FOR_ORDER';
  internalPriceTotal?: number;
  creditRequired?: boolean;
  creditTerms?: string;
  targetDeliveryDate?: string;
  createdAt?: string;
}

export interface ManufacturerQuoteLine {
  rfqLineId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  taxPercent?: number;
  discountPercent?: number;
  leadTimeDays: number;
  moq: number;
  calculatedFinalPrice?: number;
  deliveryTerms?: string;
  responseType?: 'QUOTE' | 'CANNOT_SUPPLY';
  cannotSupplyReason?: string;
  cannotSupplyRemarks?: string;
  baseUnitPrice?: number;
  marginPercent?: number;
  marginAmount?: number;
  buyerUnitPrice?: number;
  category?: string;
}

export interface ManufacturerQuote {
  id: string;
  rfqId: string;
  rfqNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  submissionDate: string;
  validUntil: string;
  status: QuoteStatus;
  quoteLines: ManufacturerQuoteLine[];
  totalAmount: number;
  remarks?: string;
  lastUpdated?: string;
  rejectionReason?: string;
  subOrderId?: string;
  subOrderNumber?: string;
  quoteType?: 'FULL_QUOTE' | 'PARTIAL_QUOTE';
}

export interface SubOrderLine {
  id: string;
  productId: string;
  productName: string;
  dosageForm: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  discountPercent?: number;
  totalPrice: number;
}

export interface SubOrder {
  id: string;
  subOrderNumber: string;
  masterOrderId: string;
  masterOrderNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  lines: SubOrderLine[];
  status: SubOrderStatus;
  totalAmount: number;
  startDate: string;
  expectedDeliveryDate: string;
  customerClassification?: CustomerClassification;
  awbNumber?: string;
  transporterName?: string;
  poNumber?: string;
  deliveredQuantity?: number;
  trackingNumber?: string;
  carrier?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  currentLocation?: string;
  trackingStatus?: string;
  lastTrackingUpdate?: string;
  productionOrderId?: string;
  isGeneric?: boolean;
}

export interface MasterOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerClassification?: CustomerClassification;
  createdDate: string;
  expectedDeliveryDate: string;
  status: MasterOrderStatus;
  totalAmount: number;
  subOrders: SubOrder[];
  shippingAddress: string;
  billingAddress?: string;
  poNumber?: string;
  paymentTerms?: string;
  currency?: string;
  updatedDate?: string;
  holdCount?: number;
  isOnHold?: boolean;
  holdReason?: string;
  previousStatus?: MasterOrderStatus;
  holdHistory?: { reason: string; timestamp: string; heldBy?: string }[];
  rfqId?: string;
  rfqNumber?: string;
  isGeneric?: boolean;
  orderType?: 'GENERIC' | 'BRANDED';
}

export interface InvoiceLine {
  id: string;
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  totalAmount: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface Invoice {
  id: string;
  logoDataUrl?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerPan?: string;
  manufacturerAddress?: string;
  manufacturerGstin?: string;
  manufacturerPan?: string;
  manufacturerLicense?: string;
  paymentTerms?: string;
  creationMethod?: 'TEXT' | 'UPLOAD';
  uploadedFileName?: string;
  uploadedFileUrl?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  freightAmount?: number;
  invoiceNumber: string;
  masterOrderId: string;
  orderNumber: string;
  subOrderId?: string;
  subOrderNumber?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  manufacturerId?: string;
  manufacturerName?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  sentToCustomer?: boolean;
  sentAt?: string;
  currency?: string;
  paymentMethod?: string;
  payments?: PaymentRecord[];
  remindersSentCount?: number;
  lastReminderSentAt?: string;
}

export interface ComplianceCase {
  id: string;
  caseNumber: string;
  entityType: 'CUSTOMER' | 'MANUFACTURER' | 'BRAND' | 'PRODUCT';
  entityId: string;
  entityName: string;
  caseType: 'KYC' | 'GST' | 'DRUG_LICENSE' | 'TM_VERIFICATION' | 'BANK_VERIFICATION' | 'CONTRACT_REVIEW';
  status: ComplianceStatus;
  assignedOfficer: string;
  createdDate: string;
  updatedDate: string;
  riskScore: 'LOW' | 'MEDIUM' | 'HIGH';
  checklist: { title: string; mandatory: boolean; passed: boolean }[];
  documents: { name: string; url: string; verified: boolean; expiryDate?: string }[];
}

export interface BuyerOnboarding {
  id: string;
  companyName: string;
  customerClassification?: CustomerClassification;
  gstin: string;
  pan: string;
  drugLicenseNo: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  documents: { name: string; type: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; url: string }[];
  status: ComplianceStatus;
  buyerCode?: string;
  submittedDate: string;
}

export interface ManufacturerOnboarding {
  id: string;
  companyName: string;
  factoryDetails: string;
  mfgCapacity: string;
  whoGmpNo: string;
  drugCategories: string[];
  factoryLocation: string;
  gstin: string;
  pan: string;
  mfgLicenseNo: string;
  contactPerson: string;
  email: string;
  phone: string;
  certifications: string[];
  documents: { name: string; type: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; url: string }[];
  status: ComplianceStatus;
  manufacturerCode?: string;
  submittedDate: string;
}

export interface TemperatureLog {
  timestamp: string;
  temperatureC: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface Shipment {
  id: string;
  subOrderId: string;
  subOrderNumber: string;
  masterOrderNumber: string;
  manufacturerName: string;
  customerName: string;
  vehicleNumber: string;
  courierName: string;
  trackingNumber: string;
  driverName: string;
  driverPhone: string;
  gpsLocation: { lat: number; lng: number; address: string };
  coldChainRequired: boolean;
  coldChainStatus: 'COMPLIANT (2°C - 8°C)' | 'ALERT (> 8°C)' | 'NOT_APPLICABLE';
  tempLogs: TemperatureLog[];
  dispatchDate: string;
  eta: string;
  proofOfDeliveryUrl?: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  timeline: { title: string; timestamp: string; completed: boolean }[];
}

export interface CRMInteraction {
  id: string;
  date: string;
  type: 'MEETING' | 'CALL' | 'EMAIL' | 'NOTE';
  summary: string;
  author: string;
}

export interface CRMLead {
  id: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: 'PROSPECT' | 'QUALIFIED' | 'RFQ_ISSUED' | 'NEGOTIATION' | 'CLOSED_WON';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  annualRevenue: number;
  assignedRep: string;
  interactions: CRMInteraction[];
  notes: string;
}

export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMethod: 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CREDIT_LINE';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  module: string;
  action: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category?: 'COMPLIANCE' | 'RFQ' | 'QUOTE' | 'ORDER' | 'DISPATCH' | 'INVOICE' | 'PAYMENT' | 'SYSTEM';
  read: boolean;
  link?: string;
}

// ── CUSTOMER VERIFICATION WORKFLOW TYPES ─────────────────────────────
export type CustomerVerificationStatus = 
  | 'Draft'
  | 'Pending'
  | 'Documents Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Need More Docs'
  | 'Active';

export type CustomerVerificationDocumentType =
  | 'GST Certificate'
  | 'PAN Card'
  | 'Drug License'
  | 'Incorporation Certificate'
  | 'Bank Details'
  | 'Authorized Signatory Details'
  | 'Cancelled Cheque'
  | 'Signed Agreement';

export interface CustomerVerificationDocument {
  id: string;
  documentType: CustomerVerificationDocumentType;
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  status: 'Valid' | 'Invalid' | 'Pending Review';
  notes?: string;
  url?: string;
}

export interface CustomerVerificationAutoValidation {
  gstCheck: 'Valid' | 'Invalid' | 'Pending Review';
  panCheck: 'Valid' | 'Invalid' | 'Pending Review';
  requiredDocsCheck: 'Valid' | 'Invalid' | 'Pending Review';
  requiredFieldsCheck: 'Valid' | 'Invalid' | 'Pending Review';
  overallStatus: 'Valid' | 'Invalid' | 'Pending Review';
  validationDetails: string[];
}

export interface CustomerBusinessVerification {
  gstActiveStatus: 'Active' | 'Inactive' | 'Pending Verification';
  panValidation: 'Verified' | 'Mismatch' | 'Pending';
  companyRegistrationValidation: 'Verified (ROC)' | 'Unverified' | 'Pending';
  cinValidation: 'Active & Verified' | 'Invalid' | 'Pending';
}

export interface CustomerRegulatoryVerification {
  drugLicenseValidity: 'Valid (Form 20B/21B)' | 'Expired' | 'Invalid' | 'Pending';
  licenseExpiryCheck: string;
  stateRegulatoryAuthorityValidation: 'Verified with State FDA' | 'Under Audit' | 'Pending';
}

export interface CustomerFinancialVerification {
  bankVerification: 'Verified (Penny Drop Passed)' | 'Unverified' | 'Pending';
  creditRating: 'AAA (Low Risk)' | 'AA (Moderate Risk)' | 'B (High Risk)' | 'Unrated';
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PCDDetails {
  territory: string;
  state: string;
  district: string;
  monopolyRights: boolean;
  brandPortfolio: string;
}

export interface TPMDetails {
  brandName: string;
  packagingRequirements: string;
  artworkApproval: boolean;
  regulatoryRequirements: string;
  moqAgreement: boolean;
}

export interface DistributorDetails {
  distributionTerritory: string;
  salesChannel: string;
  warehouseLocations: string;
}

export interface HospitalDetails {
  procurementDepartment: string;
  tenderReference: string;
  contractValidity: string;
}

export interface ExportDetails {
  targetRegions: string;
  iecCode: string;
}

export interface WholesalerDetails {
  storageCapacitySqFt: string;
  coldChainStorage: boolean;
  networkSize: string;
}

export interface CustomerVerificationRequest {
  id: string;
  customerName: string; // Contact Person / Representative
  companyName: string;
  customerType: 'PCD' | 'TPM' | 'Distributor' | 'Hospital' | 'Export' | 'Wholesaler';
  customerClassification?: CustomerClassification;
  classificationUpdatedAt?: string;
  classificationUpdatedBy?: string;
  registrationDate: string;
  verificationStatus: CustomerVerificationStatus;
  assignedComplianceOfficer: string;

  // 1. Company Information
  businessType: string;
  gstNumber: string;
  panNumber: string;
  drugLicenseNumber: string;
  cinNumber: string;
  website?: string;

  // 2. Contact Information
  contactPerson: string;
  designation: string;
  mobileNumber: string;
  email: string;

  // 3. Address Information
  billingAddress: string;
  shippingAddress: string;
  billingAddress?: string;
  poNumber?: string;
  paymentTerms?: string;
  currency?: string;
  updatedDate?: string;
  state: string;
  country: string;
  pincode: string;

  // 4. Customer-Type Specific Details
  pcdDetails?: PCDDetails;
  tpmDetails?: TPMDetails;
  distributorDetails?: DistributorDetails;
  hospitalDetails?: HospitalDetails;
  exportDetails?: ExportDetails;
  wholesalerDetails?: WholesalerDetails;

  // 5. Uploaded Documents (6 mandatory)
  documents: CustomerVerificationDocument[];

  // 6. Validation & Verifications
  autoValidation: CustomerVerificationAutoValidation;
  businessVerification: CustomerBusinessVerification;
  regulatoryVerification: CustomerRegulatoryVerification;
  financialVerification: CustomerFinancialVerification;

  // Review & Decision Info
  requestedDocumentsNotes?: string[];
  rejectionReason?: string;
  reviewNotes?: string[];

  // Post-Approval Generated Details
  customerCode?: string; // e.g. CUS000123
  portalLoginCreated?: boolean;
  portalUsername?: string;
  approvedAt?: string;
}

// ── MY PROFILE & ORGANIZATION PROFILE MANAGEMENT TYPES ─────────────────
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: UserRole;
  department: string;
  accountStatus: 'Active' | 'Inactive' | 'Pending Verification';
  lastLogin: string;
  avatarUrl?: string;
}

export interface OrganizationProfile {
  id: string;
  companyName: string; // Organization Name for Buyer, Company Name for Supplier
  companyCode: string; // Organization Code for Buyer, Company Code for Supplier
  businessType: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  registeredAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  website: string;
  gstin: string;
  pan: string;
  cinNumber: string;
  mfgLicenseNo?: string;
  whoGmpNo?: string;
  isVerified: boolean;
}

export type ProfileDocStatus = 'NOT UPLOADED' | 'PENDING VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface DocumentVersion {
  version: number;
  uploadedDate: string;
  fileName: string;
  documentNumber?: string;
  status: ProfileDocStatus;
  remarks?: string;
  url?: string;
}

export interface UserDocument {
  id: string;
  documentName: string;
  documentType: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  uploadedDate?: string;
  lastUpdated?: string;
  verificationStatus: ProfileDocStatus;
  verifiedBy?: string;
  verificationDate?: string;
  remarks?: string;
  fileUrl?: string;
  fileName?: string;
  history?: DocumentVersion[];
}
