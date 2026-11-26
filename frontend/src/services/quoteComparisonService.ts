/**
 * FactoryGrid Buyer Quote Comparison Service
 * Connects directly to backend endpoints under /api/v1/buyer/quote-comparisons/*.
 */

export interface BuyerQuoteComparisonItem {
  rfqId: string;
  rfqNumber: string;
  buyerName: string;
  customerCode: string | null;
  productLineCount: number;
  quotationCount: number;
  deadline: string | null;
  requiredDate: string | null;
  status: string;
  rawStatus: string;
  priority: string;
  isGeneric: boolean;
  hasSelectedQuotes: boolean;
  selectedLinesCount: number;
}

export interface ComparisonRfqLine {
  id: string;
  lineItemNumber: number;
  productId: string | null;
  productName: string;
  category: string | null;
  dosageForm: string | null;
  packSize: string | null;
  uom: string;
  quantity: number;
  targetPrice: number | null;
  requiredDate: string | null;
  selectedManufacturer: {
    quoteLineId: string;
    quoteId: string;
    manufacturerId: string;
    manufacturerName: string;
    unitPrice: number;
    leadTimeDays: number;
    moq: number;
  } | null;
}

export interface ComparisonQuoteLine {
  id: string;
  rfqLineId: string | null;
  productId: string | null;
  productName: string;
  responseType: 'QUOTE' | 'CANNOT_SUPPLY';
  quotedQuantity: number;
  unitPrice: number;
  moq: number;
  leadTimeDays: number;
  calculatedTotal: number;
  deliveryTerms?: string | null;
  cannotSupplyReason?: string | null;
  cannotSupplyRemarks?: string | null;
  isSelected?: boolean;
}

export interface ComparisonManufacturerQuote {
  id: string;
  quoteNumber: string;
  status: string;
  manufacturerId: string;
  manufacturerName: string;
  manufacturerCode: string;
  city: string;
  state: string;
  totalAmount: number;
  submissionDate: string;
  validUntil: string | null;
  deliveryTerms: string;
  paymentTerms: string;
  remarks: string | null;
  lines: ComparisonQuoteLine[];
}

export interface BuyerQuoteComparisonDetailResponse {
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
    isGeneric: boolean;
    status: string;
    remarks: string | null;
  };
  lines: ComparisonRfqLine[];
  manufacturerQuotations: ComparisonManufacturerQuote[];
  lineSelections: Record<string, {
    quoteLineId: string;
    quoteId: string;
    manufacturerId: string;
    manufacturerName: string;
    unitPrice: number;
    leadTimeDays: number;
    moq: number;
  }>;
}

export interface SelectQuoteComparisonLinePayload {
  rfqLineId: string;
  quoteLineId: string;
  quoteId: string;
  manufacturerId: string;
  unitPrice?: number;
  moq?: number;
  leadTimeDays?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/buyer/quote-comparisons`;

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

export const quoteComparisonApi = {
  /**
   * List all RFQs available for Quote Comparison for the authenticated buyer.
   */
  async listQuoteComparisons(params?: { status?: string; search?: string }): Promise<BuyerQuoteComparisonItem[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search?.trim()) query.set('search', params.search.trim());

    const qs = query.toString();
    const url = qs ? `${BASE}?${qs}` : BASE;
    return request<BuyerQuoteComparisonItem[]>(url);
  },

  /**
   * Get full comparison detail matrix for an RFQ.
   */
  async getQuoteComparisonDetail(rfqId: string | number): Promise<BuyerQuoteComparisonDetailResponse> {
    return request<BuyerQuoteComparisonDetailResponse>(`${BASE}/${rfqId}`);
  },

  /**
   * Persist buyer manufacturer quotation selections per RFQ line into PostgreSQL.
   */
  async selectQuotesForRfq(
    rfqId: string | number,
    payload: { selections: SelectQuoteComparisonLinePayload[] }
  ): Promise<{ message: string; rfqNumber: string; selectedCount: number }> {
    return request<{ message: string; rfqNumber: string; selectedCount: number }>(`${BASE}/${rfqId}/select`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
