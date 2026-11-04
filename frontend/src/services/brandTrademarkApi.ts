/**
 * FactoryGrid Brand & Trademark Documents and Verification API Client.
 * Connects directly to backend endpoints:
 * - /api/v1/buyer/brand-documents
 * - /api/v1/buyer/trademark-documents
 * - /api/v1/compliance/brand-verifications
 * - /api/v1/compliance/trademark-verifications
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';

export interface BuyerBrandDoc {
  id: string;
  userId: string;
  registrationId?: string;
  brandName: string;
  brandReference?: string;
  documentType: string;
  documentNumber?: string;
  dosageForm?: string;
  tmRegistrationNo?: string;
  issueDate?: string;
  expiryDate?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'UNDER REVIEW' | 'BRAND APPROVED' | 'BRAND REJECTED' | 'AUTHORIZATION REQUIRED';
  checks?: {
    loaAuth: 'Pending' | 'Verified' | 'Failed';
    tmAgreement: 'Pending' | 'Verified' | 'Failed';
    formulaClearance: 'Pending' | 'Verified' | 'Failed';
    artworkCompliance: 'Pending' | 'Verified' | 'Failed';
  };
  rejectionReason?: string;
  authNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerTrademarkDoc {
  id: string;
  userId: string;
  registrationId?: string;
  trademarkName: string;
  tmNumber?: string;
  tmClass?: string;
  documentType: string;
  verificationSource?: string;
  issueDate?: string;
  expiryDate?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'Under Review' | 'Approved' | 'Conflict Found' | 'Expired';
  checks?: {
    existence: 'Pending' | 'Verified' | 'Failed' | 'Under Review';
    owner: 'Pending' | 'Verified' | 'Failed' | 'Under Review';
    status: 'Pending' | 'Verified' | 'Failed' | 'Under Review';
    classMatch: 'Pending' | 'Verified' | 'Failed' | 'Under Review';
    validity: 'Pending' | 'Verified' | 'Failed' | 'Under Review';
  };
  conflictNotes?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  return `Request failed (HTTP ${status})`;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`Cannot connect to the FactoryGrid API at ${API_BASE}. Please ensure the backend is running.`);
  }

  if (response.status === 401) {
    // If not authenticated, could be expired or guest
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(extractErrorMessage(data, response.status));
    }
    return (data?.data !== undefined ? data.data : data) as T;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (HTTP ${response.status})`);
  }

  return response as unknown as T;
}

export const brandTrademarkApi = {
  // ── BUYER BRAND DOCUMENTS ──
  async listBuyerBrandDocs(): Promise<BuyerBrandDoc[]> {
    return request<BuyerBrandDoc[]>(`${API_BASE}/api/v1/buyer/brand-documents`, {
      method: 'GET',
    });
  },

  async uploadBuyerBrandDoc(formData: FormData): Promise<BuyerBrandDoc> {
    return request<BuyerBrandDoc>(`${API_BASE}/api/v1/buyer/brand-documents`, {
      method: 'POST',
      body: formData,
    });
  },

  async updateBuyerBrandDoc(id: string, formData: FormData): Promise<BuyerBrandDoc> {
    return request<BuyerBrandDoc>(`${API_BASE}/api/v1/buyer/brand-documents/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async downloadBuyerBrandDoc(id: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/buyer/brand-documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download brand document.');
    return res.blob();
  },

  // ── BUYER TRADEMARK DOCUMENTS ──
  async listBuyerTrademarkDocs(): Promise<BuyerTrademarkDoc[]> {
    return request<BuyerTrademarkDoc[]>(`${API_BASE}/api/v1/buyer/trademark-documents`, {
      method: 'GET',
    });
  },

  async uploadBuyerTrademarkDoc(formData: FormData): Promise<BuyerTrademarkDoc> {
    return request<BuyerTrademarkDoc>(`${API_BASE}/api/v1/buyer/trademark-documents`, {
      method: 'POST',
      body: formData,
    });
  },

  async updateBuyerTrademarkDoc(id: string, formData: FormData): Promise<BuyerTrademarkDoc> {
    return request<BuyerTrademarkDoc>(`${API_BASE}/api/v1/buyer/trademark-documents/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  async downloadBuyerTrademarkDoc(id: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/buyer/trademark-documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download trademark document.');
    return res.blob();
  },

  // ── ADMIN BRAND VERIFICATIONS ──
  async listAdminBrandVerifications(status?: string): Promise<any[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<any[]>(`${API_BASE}/api/v1/compliance/brand-verifications${qs}`, {
      method: 'GET',
    });
  },

  async approveBrandVerification(id: string, remarks?: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/brand-verifications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
  },

  async requestAuthBrandVerification(id: string, authNotes: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/brand-verifications/${id}/request-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authNotes }),
    });
  },

  async rejectBrandVerification(id: string, rejectionReason: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/brand-verifications/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason }),
    });
  },

  async updateBrandCheck(id: string, checkKey: string, status: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/brand-verifications/${id}/checks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkKey, status }),
    });
  },

  async downloadBrandDoc(id: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/compliance/brand-verifications/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download brand document.');
    return res.blob();
  },

  // ── ADMIN TRADEMARK VERIFICATIONS ──
  async listAdminTrademarkVerifications(status?: string): Promise<any[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<any[]>(`${API_BASE}/api/v1/compliance/trademark-verifications${qs}`, {
      method: 'GET',
    });
  },

  async approveTrademarkVerification(id: string, remarks?: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remarks }),
    });
  },

  async markConflictTrademark(id: string, conflictNotes: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conflictNotes }),
    });
  },

  async markExpiredTrademark(id: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/expired`, {
      method: 'POST',
    });
  },

  async rejectTrademarkVerification(id: string, rejectionReason: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionReason }),
    });
  },

  async updateTrademarkCheck(id: string, checkKey: string, status: string): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/checks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkKey, status }),
    });
  },

  async downloadTrademarkDoc(id: string): Promise<Blob> {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/compliance/trademark-verifications/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download trademark document.');
    return res.blob();
  },
};
