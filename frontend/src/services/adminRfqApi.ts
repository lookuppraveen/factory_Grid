/**
 * FactoryGrid Admin RFQ & Quote Monitoring API Client
 * Connects directly to backend endpoints under /api/v1/admin/rfqs/*.
 */

export interface AdminRfqLine {
  id: string;
  rfqLineId: string;
  lineItemNumber: number;
  productId: string;
  productName: string;
  productCode?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  productType: 'BRANDED' | 'GENERIC' | string;
  dosageForm?: string;
  packSize?: string;
  uom: string;
  quantity: number;
  targetPrice: number | null;
  internalPrice?: number | null;
  adminProcessingStatus?: string;
  requiredDate?: string | null;
  remarks?: string;
  molecule?: string;
  strength?: string;
}

export interface AdminQuoteSummary {
  id: string;
  quoteNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  totalAmount: number;
  status: string;
  validUntil?: string | null;
}

export interface AdminRfqItem {
  id: string;
  rfqNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerClassification: string;
  createdDate: string;
  createdAt?: string;
  targetDeliveryDate: string;
  deadlineDate?: string;
  status: string;
  priority: string;
  isGeneric: boolean;
  genericStatus: string;
  deliveryLocation: string;
  remarks?: string;
  creditRequired: boolean;
  creditTerms?: string;
  quotesCount: number;
  lowestPrice: number;
  highestPrice: number;
  isAwarded: boolean;
  selectedManufacturerName: string;
  quotes?: AdminQuoteSummary[];
  lines: AdminRfqLine[];
}

export interface AdminRfqStats {
  totalRfqs: number;
  genericRfqs: number;
  pendingGenericCount: number;
  brandedRfqs: number;
  activeQuotedCount: number;
  closedAwardedCount: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/admin/rfqs`;

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
    if (entries.length > 0) return entries.join('; ');
  }
  return `HTTP ${status}: Request to Admin RFQ service failed`;
}

export const adminRfqApi = {
  /**
   * Fetches list of all RFQs with computed quotes and lines from PostgreSQL.
   */
  async listAdminRfqs(params?: { search?: string; type?: string; status?: string }): Promise<AdminRfqItem[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'ALL') query.append('type', params.type);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);

    const qs = query.toString();
    const url = qs ? `${BASE}?${qs}` : BASE;
    const token = getAuthToken();

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, res.status));
    }

    return res.json();
  },

  /**
   * Fetches real-time aggregated dashboard KPI statistics directly from PostgreSQL.
   */
  async getAdminRfqStats(): Promise<AdminRfqStats> {
    const token = getAuthToken();
    const res = await fetch(`${BASE}/stats`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, res.status));
    }

    return res.json();
  },

  /**
   * Retrieves full details for a single RFQ with lines and quotes.
   */
  async getAdminRfqDetail(idOrRfqNumber: string): Promise<AdminRfqItem> {
    const token = getAuthToken();
    const res = await fetch(`${BASE}/${encodeURIComponent(idOrRfqNumber)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, res.status));
    }

    return res.json();
  },

  /**
   * Saves and persists Admin Generic Medicine pricing into PostgreSQL.
   */
  async submitGenericPricing(
    idOrRfqNumber: string,
    linePrices: Record<string, number>,
    remarks?: string,
  ): Promise<AdminRfqItem> {
    const token = getAuthToken();
    const res = await fetch(`${BASE}/${encodeURIComponent(idOrRfqNumber)}/generic-pricing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ linePrices, remarks }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, res.status));
    }

    return res.json();
  },

  /**
   * Fetches all manufacturer quotes submitted for an RFQ.
   */
  async getQuotesForRfq(idOrRfqNumber: string): Promise<any[]> {
    const token = getAuthToken();
    const res = await fetch(`${BASE}/${encodeURIComponent(idOrRfqNumber)}/quotes`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(err, res.status));
    }

    return res.json();
  },
};
