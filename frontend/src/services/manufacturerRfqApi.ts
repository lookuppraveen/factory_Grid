/**
 * FactoryGrid Manufacturer Assigned RFQs & Quotation API Client
 * Connects directly to backend endpoints under /api/v1/manufacturer/rfqs/*.
 */

export interface AssignedRfqItem {
  assignmentId: string;
  rfqId: string;
  rfqNumber: string;
  customerName: string;
  buyerName: string;
  customerClassification: string;
  priority: 'STANDARD' | 'HIGH' | 'URGENT';
  deliveryLocation: string;
  rfqDate: string;
  deadlineDate: string | null;
  requiredDate: string | null;
  status: 'ACTION NEEDED' | 'DRAFT' | 'SUBMITTED' | 'DECLINED' | 'EXPIRED';
  assignmentStatus: string;
  quoteStatus: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  totalLines: number;
  totalQuantity: number;
  linesPreview: Array<{
    productName: string;
    quantity: number;
    uom: string;
  }>;
  quote: {
    id: string;
    quoteNumber: string;
    status: string;
    totalAmount: number;
    submittedAt: string | null;
    linesCount: number;
  } | null;
}

export interface AssignedRfqCounts {
  all: number;
  actionNeeded: number;
  draftSaved: number;
  submitted: number;
  declined: number;
  expired: number;
}

export interface ManufacturerProfileSummary {
  id: string;
  registrationCode: string;
  manufacturerCode: string;
  companyName: string;
  city?: string;
  state?: string;
}

export interface AssignedRfqListResponse {
  manufacturer: ManufacturerProfileSummary;
  counts: AssignedRfqCounts;
  items: AssignedRfqItem[];
}

export interface RfqDetailLine {
  id: string;
  lineItemNumber: number;
  productId: string | null;
  productName: string;
  productCode: string | null;
  category: string | null;
  subCategory: string | null;
  subSubCategory: string | null;
  productType: string;
  dosageForm: string | null;
  packSize: string | null;
  uom: string;
  quantity: number;
  targetPrice: number | null;
  requiredDate: string | null;
  remarks: string | null;
  molecule: string | null;
  strength: string | null;
}

export interface QuoteDetailLine {
  id: string;
  rfqLineId: string | null;
  productId: string | null;
  productName: string;
  responseType: 'QUOTE' | 'CANNOT_SUPPLY';
  quotedQuantity: number;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  taxPercent: number;
  discountPercent: number;
  calculatedTotal: number;
  deliveryTerms?: string | null;
  cannotSupplyReason?: string | null;
  cannotSupplyRemarks?: string | null;
  remarks?: string | null;
}

export interface ExistingQuoteDetail {
  id: string;
  quoteNumber: string;
  status: string;
  totalAmount: number;
  validUntil: string | null;
  deliveryTerms: string | null;
  paymentTerms: string | null;
  remarks: string | null;
  submittedAt: string | null;
  lines: QuoteDetailLine[];
}

export interface AssignedRfqDetailResponse {
  assignmentId: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  declineRemarks: string | null;
  manufacturer: ManufacturerProfileSummary;
  rfq: {
    id: string;
    rfqNumber: string;
    buyerName: string;
    companyName: string;
    customerCode: string;
    customerClassification: string;
    priority: 'STANDARD' | 'HIGH' | 'URGENT';
    deliveryLocation: string;
    rfqDate: string;
    requiredDate: string | null;
    deadlineDate: string | null;
    remarks: string | null;
    creditRequired: boolean;
    creditTerms: string | null;
    isGeneric: boolean;
    status: string;
    lines: RfqDetailLine[];
  };
  existingQuote: ExistingQuoteDetail | null;
}

export interface SubmitQuoteLinePayload {
  rfqLineId: string;
  productId?: string;
  productName: string;
  responseType: 'QUOTE' | 'CANNOT_SUPPLY';
  quotedQuantity: number;
  unitPrice?: number;
  moq?: number;
  leadTimeDays?: number;
  taxPercent?: number;
  discountPercent?: number;
  deliveryTerms?: string;
  cannotSupplyReason?: string;
  cannotSupplyRemarks?: string;
  remarks?: string;
}

export interface SubmitManufacturerQuotePayload {
  status?: 'DRAFT' | 'SUBMITTED';
  validUntil?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  remarks?: string;
  lines: SubmitQuoteLinePayload[];
}

export interface DeclineManufacturerRfqPayload {
  declineReason: string;
  declineRemarks?: string;
}

export interface SubmittedQuoteItem {
  id: string;
  quoteNumber: string;
  rfqId: string;
  rfqNumber: string;
  buyer: string;
  buyerCustomerCode: string | null;
  buyerDeliveryLocation: string | null;
  totalAmount: number;
  submissionDate: string;
  validUntil: string | null;
  deliveryTerms: string | null;
  paymentTerms: string | null;
  remarks: string | null;
  status: string;
  productsSummary: string;
  linesCount: number;
  quotedLinesCount: number;
  cannotSupplyLinesCount: number;
  linesPreview: Array<{
    id: string;
    productName: string;
    responseType: 'QUOTE' | 'CANNOT_SUPPLY';
    quantity: number;
    unitPrice: number;
    moq: number;
    leadTimeDays: number;
    calculatedTotal: number;
  }>;
}

export interface SubmittedQuoteMetrics {
  submittedCount: number;
  totalCommercialValue: number;
}

export interface SubmittedQuoteListResponse {
  manufacturer: ManufacturerProfileSummary;
  metrics: SubmittedQuoteMetrics;
  items: SubmittedQuoteItem[];
}

export interface SubmittedQuoteDetailResponse {
  id: string;
  quoteNumber: string;
  status: string;
  totalAmount: number;
  submissionDate: string;
  validUntil: string | null;
  deliveryTerms: string | null;
  paymentTerms: string | null;
  remarks: string | null;
  rfq: {
    id: string;
    rfqNumber: string;
    buyerName: string;
    companyName: string;
    customerCode: string;
    customerClassification: string;
    priority: string;
    deliveryLocation: string;
    rfqDate: string;
    requiredDate: string | null;
    deadlineDate: string | null;
    creditRequired: boolean;
    creditTerms: string | null;
    remarks: string | null;
  };
  manufacturer: {
    id: string;
    companyName: string;
    registrationCode: string;
  };
  lines: Array<{
    id: string;
    rfqLineId: string | null;
    productId: string | null;
    productName: string;
    category: string | null;
    dosageForm: string | null;
    packSize: string | null;
    uom: string;
    responseType: 'QUOTE' | 'CANNOT_SUPPLY';
    quotedQuantity: number;
    unitPrice: number;
    moq: number;
    leadTimeDays: number;
    calculatedTotal: number;
    deliveryTerms?: string | null;
    cannotSupplyReason?: string | null;
    cannotSupplyRemarks?: string | null;
    remarks?: string | null;
  }>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/manufacturer/rfqs`;

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('fg_auth_token') || '';
  }
  return '';
}

function extractErrorMessage(data: any, status: number): string {
  const raw = data?.message ?? data?.error;
  if (Array.isArray(raw)) return raw.join('; ');
  if (typeof raw === 'string' && raw) return raw;
  if (data?.errors && typeof data.errors === 'object') {
    const entries = Array.isArray(data.errors)
      ? data.errors.map((e: any) => e.message || `${e.field}: invalid`)
      : Object.values(data.errors).map(String);
    if (entries.length) return entries.join('; ');
  }
  return `Operation failed with status ${status}`;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: 'omit', headers });
  } catch (err: any) {
    throw new Error(err?.message || 'Network request failed. Is the FactoryGrid backend running?');
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return data as T;
}

export const manufacturerRfqApi = {
  /**
   * List all RFQs assigned to the authenticated manufacturer.
   */
  async listAssignedRfqs(params?: { status?: string; search?: string }): Promise<AssignedRfqListResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search?.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    const url = qs ? `${BASE}?${qs}` : BASE;
    return request<AssignedRfqListResponse>(url);
  },

  /**
   * Get single assigned RFQ detail and existing quote.
   */
  async getAssignedRfq(id: string | number): Promise<AssignedRfqDetailResponse> {
    return request<AssignedRfqDetailResponse>(`${BASE}/${id}`);
  },

  /**
   * Submit or draft quote.
   */
  async submitQuote(id: string | number, payload: SubmitManufacturerQuotePayload): Promise<{ message: string; quote: any }> {
    return request<{ message: string; quote: any }>(`${BASE}/${id}/quote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Decline assigned RFQ.
   */
  async declineRfq(id: string | number, payload: DeclineManufacturerRfqPayload): Promise<{ message: string; assignmentId: string; status: string }> {
    return request<{ message: string; assignmentId: string; status: string }>(`${BASE}/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List all commercial quotations submitted by the authenticated manufacturer.
   */
  async listSubmittedQuotes(params?: { status?: string; search?: string }): Promise<SubmittedQuoteListResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search?.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    const url = qs ? `${API_BASE}/api/v1/manufacturer/quotes?${qs}` : `${API_BASE}/api/v1/manufacturer/quotes`;
    return request<SubmittedQuoteListResponse>(url);
  },

  /**
   * Get single submitted quotation with full RFQ and product line details.
   */
  async getSubmittedQuote(id: string | number): Promise<SubmittedQuoteDetailResponse> {
    return request<SubmittedQuoteDetailResponse>(`${API_BASE}/api/v1/manufacturer/quotes/${id}`);
  },
};
