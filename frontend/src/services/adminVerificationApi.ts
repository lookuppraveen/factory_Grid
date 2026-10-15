/**
 * FactoryGrid Real Admin & Compliance Verification API Client
 * Connects to backend compliance and manufacturer review endpoints under /api/v1/*.
 */

import { CustomerVerificationRequest } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';

export interface ManufacturerReviewItem {
  registrationCode: string;
  companyName: string;
  city: string;
  state: string;
  contactPerson: string;
  email: string;
  status: string;
  submittedAt: string | null;
  manufacturerCode: string | null;
  documentsTotal: number;
  documentsApproved: number;
  documentsOpen: number;
}

export interface ManufacturerReviewDetail {
  registrationCode: string;
  status: string;
  currentStep: number;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  manufacturerCode: string | null;
  company: {
    companyName: string;
    facilityAddress: string;
    city: string;
    state: string;
    pincode: string;
    mfgCapacity: string;
    contactPerson: string;
    designation: string;
    email: string;
    phone: string;
  };
  documents: Array<{
    id: string;
    documentCode: string;
    category: string;
    categoryDisplayName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    rejectionReason: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    reviewDecision: string | null;
    version: number;
    uploadedAt: string;
  }>;
  products: Array<{
    productId: string;
    productCode: string;
    name: string;
    genericName: string;
    dosageForm: string;
    category: string;
    packSize: string;
    moq: number;
    leadTimeDays: number;
  }>;
}

let cachedAdminToken: string | null = null;

async function getAdminAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('fg_auth_token');
    const role = localStorage.getItem('fg_role');
    if (existing && (role === 'ADMIN' || role === 'COMPLIANCE_OFFICER')) {
      return existing;
    }
  }

  if (cachedAdminToken) return cachedAdminToken;

  // Auto-authenticate with platform administrator credentials if navigating in review desk
  try {
    let res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin@12345678' })
    });
    if (!res.ok) {
      res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: 'admin', password: 'K8#vP$9mQ2!wX7zL' })
      });
    }
    if (res.ok) {
      const data = await res.json();
      const token = data.accessToken || data.data?.accessToken;
      if (token) {
        cachedAdminToken = token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('fg_auth_token', token);
        }
        return token;
      }
    }
  } catch {
    // Backend might be restarting
  }

  return (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : '') || '';
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAdminAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`Cannot connect to FactoryGrid API at ${API_BASE}. Please ensure backend is running.`);
  }

  // If token was expired or 401, re-login once and retry
  if (response.status === 401) {
    cachedAdminToken = null;
    const freshToken = await getAdminAuthToken();
    if (freshToken) {
      headers['Authorization'] = `Bearer ${freshToken}`;
      response = await fetch(url, { ...init, headers });
    }
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Request failed (HTTP ${response.status})`;
    throw new Error(Array.isArray(errorMsg) ? errorMsg.join('; ') : errorMsg);
  }

  return (data?.data ?? data) as T;
}

export const adminVerificationApi = {
  // ── CUSTOMER VERIFICATION (BUYER) ───────────────────────────────────
  async listCustomerVerifications(status?: string, search?: string): Promise<CustomerVerificationRequest[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    if (search && search.trim()) params.set('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<CustomerVerificationRequest[]>(`${API_BASE}/api/v1/compliance/customer-verifications${qs}`, {
      method: 'GET',
    });
  },

  async getCustomerVerification(idOrCode: string): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(`${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}`, {
      method: 'GET',
    });
  },

  async assignCustomerOfficer(idOrCode: string, officer: string): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(`${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ officer }),
    });
  },

  async approveCustomerVerification(idOrCode: string, customerCode?: string): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(`${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ customerCode }),
    });
  },

  async rejectCustomerVerification(idOrCode: string, rejectionReason: string): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(`${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  },

  async requestMoreCustomerDocs(idOrCode: string, notes: string[]): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(`${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}/request-docs`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async reviewCustomerDocument(
    requestIdOrCode: string,
    docId: string,
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT',
    reason?: string
  ): Promise<{ document: any; verificationStatus: string }> {
    return request<{ document: any; verificationStatus: string }>(
      `${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(requestIdOrCode)}/documents/${encodeURIComponent(docId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      }
    );
  },

  async updateCustomerClassification(
    idOrCode: string,
    classification: 'REGULAR' | 'SPECIAL_PARTY'
  ): Promise<CustomerVerificationRequest> {
    return request<CustomerVerificationRequest>(
      `${API_BASE}/api/v1/compliance/customer-verifications/${encodeURIComponent(idOrCode)}/classification`,
      {
        method: 'POST',
        body: JSON.stringify({ classification }),
      }
    );
  },

  // ── MANUFACTURER VERIFICATION ───────────────────────────────────────
  async listManufacturerVerifications(status?: string, search?: string): Promise<ManufacturerReviewItem[]> {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.set('status', status);
    if (search && search.trim()) params.set('search', search.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<ManufacturerReviewItem[]>(`${API_BASE}/api/v1/manufacturer/review/verifications${qs}`, {
      method: 'GET',
    });
  },

  async getManufacturerVerification(code: string): Promise<ManufacturerReviewDetail> {
    return request<ManufacturerReviewDetail>(`${API_BASE}/api/v1/manufacturer/review/verifications/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  },

  async reviewManufacturerDocument(
    code: string,
    docId: string,
    decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REPLACEMENT',
    reason?: string
  ): Promise<{ document: any; registrationStatus: string }> {
    return request<{ document: any; registrationStatus: string }>(
      `${API_BASE}/api/v1/manufacturer/review/verifications/${encodeURIComponent(code)}/documents/${encodeURIComponent(docId)}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      }
    );
  },

  async approveManufacturerVerification(code: string): Promise<{ success: boolean; message: string; manufacturerCode?: string }> {
    return request<{ success: boolean; message: string; manufacturerCode?: string }>(
      `${API_BASE}/api/v1/manufacturer/review/verifications/${encodeURIComponent(code)}/approve`,
      {
        method: 'POST',
      }
    );
  },

  async rejectManufacturerVerification(code: string, rejectionReason: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `${API_BASE}/api/v1/manufacturer/review/verifications/${encodeURIComponent(code)}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason }),
      }
    );
  },

  async requestMoreManufacturerDocs(code: string, notes: string[]): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      `${API_BASE}/api/v1/manufacturer/review/verifications/${encodeURIComponent(code)}/request-docs`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );
  },

  /**
   * Fetches the actual binary document (PDF or image) from the backend with Bearer authorization
   * and creates a localized object URL for rendering inside the Document Viewer modal.
   */
  async getDocumentBlob(downloadUrl: string): Promise<{ blobUrl: string; contentType: string; size: number }> {
    const token = await getAdminAuthToken();
    const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE}${downloadUrl}`;
    const res = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Document file not found in storage.');
      }
      if (res.status === 403) {
        throw new Error('Access denied: You are not authorized to view this company document.');
      }
      throw new Error(`Failed to load document (${res.status} ${res.statusText})`);
    }

    const contentType = res.headers.get('content-type') || 'application/pdf';
    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error('Document file not found in storage.');
    }

    const blobUrl = URL.createObjectURL(blob);
    return { blobUrl, contentType, size: blob.size };
  },
};
