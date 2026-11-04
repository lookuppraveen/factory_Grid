/**
 * FactoryGrid Buyer RFQ Workflow API Client
 * Connects directly to backend endpoints under /api/v1/buyer/rfqs/*.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/buyer/rfqs`;

export interface BackendRfqLine {
  id?: string;
  rfqId?: string;
  lineItemNumber?: number;
  productId?: string;
  productName: string;
  productCode?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  productType?: 'BRANDED' | 'GENERIC';
  dosageForm?: string;
  packSize?: string;
  uom?: string;
  quantity: number;
  targetPrice?: number | null;
  buyerProvidedPrice?: number | null;
  requiredDate?: string | null;
  remarks?: string;
  molecule?: string;
  strength?: string;
}

export interface BackendRfq {
  id: string;
  rfqNumber: string;
  userId: string;
  buyerRegistrationId?: string | null;
  buyerName: string;
  companyName: string;
  customerCode: string;
  customerClassification: string;
  status: string;
  priority: 'STANDARD' | 'HIGH' | 'URGENT';
  deliveryLocation: string;
  rfqDate: string;
  requiredDate?: string | null;
  deadlineDate?: string | null;
  remarks?: string | null;
  creditRequired: boolean;
  creditTerms?: string | null;
  isGeneric: boolean;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  lines: BackendRfqLine[];
}

export interface ManufacturerMatch {
  manufacturerId: string;
  registrationCode: string;
  companyName: string;
  city: string;
  state: string;
  facilityAddress: string;
  verificationStatus: string;
  moq: number;
  leadTimeDays: number;
  isMoqMet: boolean;
  matchScore: number;
}

export interface MatchedLine {
  lineItemNumber: number;
  productName: string;
  productId?: string;
  productType: string;
  quantity: number;
  uom: string;
  eligibleManufacturers: ManufacturerMatch[];
  matchesCount: number;
}

export interface RfqMatchResponse {
  rfqId: string;
  rfqNumber: string;
  status: string;
  totalLines: number;
  totalMatchedLines: number;
  totalEligibleManufacturers: number;
  matchedLines: MatchedLine[];
}

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
  return `RFQ operation failed (HTTP ${status})`;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`Cannot connect to the FactoryGrid API at ${API_BASE}. Ensure backend is running.`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return (data?.data ?? data) as T;
}

export const rfqApi = {
  /**
   * Fetch authenticated buyer's real profile and organization data
   */
  async getBuyerProfile(): Promise<any> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return request<any>(`${API_BASE}/api/v1/buyer/profile`, { method: 'GET', headers });
  },

  /**
   * List all RFQs owned by authenticated buyer
   */
  async listRfqs(params?: { status?: string; search?: string }): Promise<BackendRfq[]> {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return request<BackendRfq[]>(`${BASE}${queryStr}`, { method: 'GET' });
  },

  /**
   * Get single RFQ detail with product lines
   */
  async getRfq(id: string): Promise<BackendRfq> {
    return request<BackendRfq>(`${BASE}/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  /**
   * Create a new draft RFQ
   */
  async createDraft(payload: {
    deliveryLocation: string;
    priority?: 'STANDARD' | 'HIGH' | 'URGENT';
    requiredDate?: string;
    deadlineDate?: string;
    remarks?: string;
    creditRequired?: boolean;
    creditTerms?: string;
    customerClassification?: string;
    lines: BackendRfqLine[];
  }): Promise<BackendRfq> {
    return request<BackendRfq>(BASE, {
      method: 'POST',
      body: JSON.stringify({ ...payload, status: 'Draft' }),
    });
  },

  /**
   * Create and immediately submit an RFQ
   */
  async createAndSubmit(payload: {
    deliveryLocation: string;
    priority?: 'STANDARD' | 'HIGH' | 'URGENT';
    requiredDate?: string;
    deadlineDate?: string;
    remarks?: string;
    creditRequired?: boolean;
    creditTerms?: string;
    customerClassification?: string;
    lines: BackendRfqLine[];
  }): Promise<BackendRfq> {
    return request<BackendRfq>(BASE, {
      method: 'POST',
      body: JSON.stringify({ ...payload, status: 'Submitted' }),
    });
  },

  /**
   * Update an existing draft RFQ
   */
  async updateDraft(id: string, payload: {
    deliveryLocation?: string;
    priority?: 'STANDARD' | 'HIGH' | 'URGENT';
    requiredDate?: string;
    deadlineDate?: string;
    remarks?: string;
    creditRequired?: boolean;
    creditTerms?: string;
    customerClassification?: string;
    lines?: BackendRfqLine[];
  }): Promise<BackendRfq> {
    return request<BackendRfq>(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Submit an existing draft RFQ
   */
  async submitRfq(id: string): Promise<BackendRfq> {
    return request<BackendRfq>(`${BASE}/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * Run manufacturer matching on the RFQ
   */
  async matchManufacturers(id: string): Promise<RfqMatchResponse> {
    return request<RfqMatchResponse>(`${BASE}/${encodeURIComponent(id)}/match`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
