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

export type MasterOrderStatus =
  | 'PENDING_ADMIN_APPROVAL'
  | 'PENDING_ADVANCE'
  | 'CONFIRMED_RELEASED'
  | 'IN_PROCESS'
  | 'COMPLETED_CLOSED'
  | 'REJECTED_BY_ADMIN'
  | 'OPEN'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'PACKAGING'
  | 'READY_TO_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'PENDING_RECEIPT'
  | 'GOODS_RECEIVED';

export type AdvanceMethod = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type AdvanceStatus =
  | 'NOT_CONFIGURED'
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERPAID_REVIEW'
  | 'REVERSED';

export interface AdvancePaymentRecord {
  id: string;
  masterOrderId: string;
  masterOrderNumber: string;
  amount: number;
  paymentMode: string;
  reference: string;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  status: 'RECORDED' | 'REVERSED';
  reversedAt?: string;
  reversalReason?: string;
}

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
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  paymentDate: string;
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'SETTLED' | 'FAILED';
  verificationStatus?: 'VERIFIED' | 'FAILED' | 'PENDING';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  remarks?: string;
  createdAt?: string;
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

export type ManufacturerLifecycleStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EOL';

export interface Manufacturer {
  // Client Approved Manufacturer Master Schema
  manufacturer_id?: string;
  manufacturer_code?: string;
  manufacturer_name?: string;
  description?: string;
  lifecycle_status?: ManufacturerLifecycleStatus;
  effective_from?: string;
  discontinued_on?: string | null;
  created_at?: string;
  updated_at?: string;

  // Existing property fields preserved for UI & marketplace workflow compatibility
  id: string;
  code: string;
  name?: string;
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
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | ManufacturerLifecycleStatus;
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
  establishedYear?: number;
  facilityInfo?: FacilityInfo;
  manufacturingTypes?: string[];
  shortlisted?: boolean;
  ratingDetails?: any;
  recentReviews?: any[];
}

export type LifecycleStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'EOL';

export interface ProductType {
  product_type_id: string;
  product_type_code: string;
  product_type_name: string;
  description?: string;
  lifecycle_status: LifecycleStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Backward compatibility / UI aliases
  id?: string;
  code?: string;
  name?: string;
  status?: string;
}

export interface Brand {
  brand_id: string;
  brand_code: string;
  brand_name: string;
  description?: string;
  lifecycle_status: LifecycleStatus;
  created_at: string;
  updated_at: string;
  // Backward compatibility / UI aliases
  id?: string;
  code?: string;
  name?: string;
  status?: string;
  trademarkRegistrationNo?: string;
  ownerPartyId?: string;
  verified?: boolean;
}
export type BrandMaster = Brand;

export interface Category {
  category_id: string;
  product_type_id: string;
  category: string;
  sub_category?: string | null;
  sub_sub_category?: string | null;
  category_code: string;
  description?: string;
  lifecycle_status: LifecycleStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
  // UI aliases and backward compatibility
  id?: string;
  code?: string;
  name?: string;
  status?: 'Active' | 'Inactive' | LifecycleStatus;
  productCount?: number;
  productTypeId?: string;
  subCategory?: string | null;
  subSubCategory?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryMaster = Category;

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
  // Approved Product Master schema
  product_id?: string;
  product_code?: string;
  product_type_id?: string;
  brand_id?: string | null;
  category_id?: string;
  product_name?: string;
  product_short_name?: string;
  product_description?: string;
  base_uom?: string;
  pack_size?: string;
  pack_uom?: string;
  lifecycle_status?: LifecycleStatus;
  available_from?: string;
  discontinued_on?: string | null;
  replacement_product_id?: string | null;
  is_sellable?: boolean;
  created_at?: string;
  updated_at?: string;

  // Existing property fields preserved for UI compatibility
  id: string;
  code: string;
  name: string;
  genericName?: string;
  dosageForm?: string;
  composition?: string;
  packSize?: string;
  moq?: number;
  mrp?: number;
  targetPrice?: number;
  hsnCode?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'Active' | 'Inactive' | LifecycleStatus;
  registeredCount?: number;
  storageCondition?: string;
  shelfLifeMonths?: number;
  therapeuticCategory?: string;
  brandNames?: string[];
  brandId?: string | null;
  productTypeId?: string;
  categoryId?: string;
  requiresColdChain?: boolean;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  sku?: string;
  category?: string;
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
export type ProductMaster = Product;

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

// ── DYNAMIC PRODUCT ATTRIBUTE MODEL (CRITICAL) ──────────────────────
export type AttributeDataType = 'TEXT' | 'NUMBER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'LIST';

export interface AttributeMaster {
  attribute_id: string;
  attribute_code: string;
  attribute_name: string;
  data_type: AttributeDataType;
  unit_of_measure?: string;
  remark?: string;
  is_filterable: boolean;
  is_searchable: boolean;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Aliases
  id?: string;
  code?: string;
  name?: string;
  dataType?: AttributeDataType;
}

export interface ProductAttribute {
  product_attribute_id: string;
  product_id: string;
  attribute_id: string;
  attribute_value: string;
  created_at: string;
  updated_at: string;
  // Aliases and UI helpers
  id?: string;
  productId?: string;
  attributeId?: string;
  attributeValue?: string;
  attributeName?: string;
  attributeCode?: string;
  unitOfMeasure?: string;
}

// ── CATEGORY -> ATTRIBUTE ASSOCIATION (CRITICAL CLIENT REQUIREMENT) ──
export interface CategoryAttribute {
  category_attribute_id: string;
  category_id: string;
  attribute_id: string;
  remark?: string;
  created_at?: string;
  updated_at?: string;
  // Aliases and UI helpers
  id?: string;
  categoryId?: string;
  attributeId?: string;
}

// ── PRODUCT MANUFACTURER (CRITICAL) ──────────────────────────────────
export interface ProductManufacturer {
  product_manufacturer_id: string;
  product_id: string;
  manufacturer_id: string;
  manufacturer_product_code: string;
  manufacturer_part_number?: string;
  manufacturer_sku?: string;
  lifecycle_status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'EOL' | 'SUSPENDED';
  effective_from: string;
  effective_to?: string | null;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
  // Backward compatibility / UI aliases
  id?: string;
  productId?: string;
  productName?: string;
  manufacturerId?: string;
  manufacturerCode?: string;
  manufacturerName?: string;
  mfgProductCode?: string;
  moq?: number;
  standardLeadTimeDays?: number;
  unitPriceEstimate?: number;
  productSpecificCertifications?: string[];
  packaging?: string;
  status?: string;
  contractStatus?: 'ACTIVE' | 'UNDER_RENEWAL' | 'TERMINATED';
  contractValidUntil?: string;
  isPreferred?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  marginType?: MarginType;
  marginValue?: number;
  marginRate?: number;
  marginStatus?: 'Active' | 'Inactive' | 'Pending' | 'Configured';
  marginUpdatedAt?: string;
}

export type ProductManufacturerMapping = ProductManufacturer;
export type ManufacturerProductMapping = ProductManufacturer;

// ── CUSTOMER SEGMENT & PRODUCT PRICE (REQUIRED) ───────────────────────
export interface CustomerSegment {
  customer_segment_id: string;
  segment_code: string;
  segment_name: string;
  description?: string;
  lifecycle_status: LifecycleStatus | 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  // Aliases & UI compatibility
  id?: string;
  code?: string;
  name?: string;
  is_active?: boolean;
}

export interface ProductPrice {
  product_price_id: string;
  product_id: string;
  product_manufacturer_id?: string | null;
  customer_segment_id: string;
  price_type: 'FIXED' | 'TIERED' | 'CONTRACT' | 'LIST';
  currency: string;
  unit_price: number;
  minimum_quantity: number;
  maximum_quantity?: number | null;
  effective_from: string;
  effective_to?: string | null;
  price_status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DRAFT';
  created_at: string;
  updated_at: string;
  // Aliases
  id?: string;
  productId?: string;
  productManufacturerId?: string | null;
  customerSegmentId?: string;
  priceType?: string;
  unitPrice?: number;
  minQuantity?: number;
  maxQuantity?: number | null;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  status?: string;
}

// ── PRODUCT TAX ──────────────────────────────────────────────────────
export interface ProductTax {
  product_tax_id: string;
  product_id: string;
  tax_code: string;
  tax_rate: number;
  effective_from: string;
  effective_to?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  // Aliases
  id?: string;
  productId?: string;
  taxCode?: string;
  taxRate?: number;
  effectiveFrom?: string;
  effectiveTo?: string | null;
}

// ── PRODUCT UOM ──────────────────────────────────────────────────────
export interface ProductUom {
  product_uom_id: string;
  product_id: string;
  uom: string;
  conversion_factor: number;
  is_base_uom: boolean;
  is_order_uom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Aliases
  id?: string;
  productId?: string;
  conversionFactor?: number;
  isBaseUom?: boolean;
  isOrderUom?: boolean;
  isActive?: boolean;
}

// ── DIRECT ORDER ELIGIBILITY ─────────────────────────────────────────
export interface ManufacturerDirectOrderEligibility {
  eligibility_id: string;
  manufacturer_id: string;
  product_id?: string | null;
  category_id?: string | null;
  is_direct_order_eligible: boolean;
  eligibility_reason?: string;
  valid_from: string;
  valid_to?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  created_at: string;
  updated_at: string;
  // Aliases
  id?: string;
  manufacturerId?: string;
  productId?: string | null;
  categoryId?: string | null;
  isDirectOrderEligible?: boolean;
}
export type DirectOrderEligibility = ManufacturerDirectOrderEligibility;
export type ProductManufacturerEligibility = ManufacturerDirectOrderEligibility;

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

// ── ORDER LINE (CRITICAL GAP) ─────────────────────────────────────────
export interface OrderLine {
  id: string;
  orderLineId?: string;
  order_line_id?: string;
  masterOrderId: string;
  master_order_id?: string;
  masterOrderNumber?: string;
  subOrderId?: string;
  sub_order_id?: string;
  subOrderNumber?: string;
  productId: string;
  product_id?: string;
  productCode?: string;
  product_code?: string;
  productName: string;
  product_name?: string;
  dosageForm?: string;
  sku?: string;
  uom?: string;
  quantity: number;
  unitPrice: number;
  unit_price?: number;
  taxPercent?: number;
  tax_percent?: number;
  discountPercent?: number;
  discount_percent?: number;
  totalPrice: number;
  total_price?: number;
  manufacturerId?: string;
  manufacturer_id?: string;
  manufacturerName?: string;
  manufacturer_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
export type MasterOrderLine = OrderLine;

// ── CUSTOMER QUOTE (CRITICAL BUSINESS STAGE) ─────────────────────────
export type CustomerQuoteStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ORDER_CREATED';

export interface CustomerQuoteLine {
  id: string;
  quoteId: string;
  rfqLineId: string;
  productId: string;
  productName: string;
  quantity: number;
  uom?: string;
  baseUnitPrice: number;
  marginAmount: number;
  platformFeeAmount: number;
  commercialUnitPrice: number;
  taxPercent: number;
  lineTotal: number;
  leadTimeDays: number;
  allocatedManufacturerId?: string;
  allocatedManufacturerName?: string;
}

export interface CustomerQuote {
  id: string;
  customerQuoteId?: string;
  quoteNumber: string;
  rfqId: string;
  rfqNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  status: CustomerQuoteStatus;
  createdDate: string;
  validUntil: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  advanceRequired: boolean;
  advanceMethod?: AdvanceMethod;
  advancePercentage?: number;
  requiredAdvanceAmount?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  lines: CustomerQuoteLine[];
  masterOrderId?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
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
  orderLines?: OrderLine[];
  lines?: OrderLine[];
  statusHistory?: { status: MasterOrderStatus; timestamp: string; changedBy?: string; remarks?: string }[];
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
  poStatus?: string;
  // Advance Payment Fields (Client O2C Specification)
  advanceRequired?: boolean;
  advanceMethod?: AdvanceMethod;
  advancePercentage?: number;
  requiredAdvanceAmount?: number;
  advanceReceived?: number;
  advanceOutstanding?: number;
  advanceStatus?: AdvanceStatus;
  advancePaymentReference?: string;
  advancePaymentDate?: string;
  advancePaymentMode?: string;
  advancePaymentNotes?: string;
  advancePayments?: AdvancePaymentRecord[];
  // Admin Approval Fields
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  poApprovalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  adminRejectionReason?: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  advanceDueDate?: string;
  advanceNotes?: string;
  // Razorpay Payment
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
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
