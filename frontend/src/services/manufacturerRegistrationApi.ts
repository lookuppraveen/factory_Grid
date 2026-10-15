/**
 * FactoryGrid Manufacturer Registration API client.
 * Maps 1:1 to the NestJS endpoints under /api/v1/manufacturer/*.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/manufacturer`;

export interface ManufacturerStepResponse {
  success: boolean;
  message: string;
  registrationCode: string;
  currentStep: number;
}

export interface CatalogProductItem {
  id: string;
  productCode: string;
  name: string;
  genericName: string;
  dosageForm: string;
  category: string;
  packSize: string;
}

export interface UploadedManufacturerDocument {
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
  rejectionReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewDecision?: string | null;
  version: number;
  uploadedAt: string;
}

function extractMessage(data: any, status: number): string {
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
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(`Cannot connect to the FactoryGrid API at ${API_BASE}. Please ensure the backend is running.`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractMessage(data, response.status));
  }
  return (data?.data ?? data) as T;
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const manufacturerRegistrationApi = {
  listCatalog(search?: string): Promise<CatalogProductItem[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<CatalogProductItem[]>(`${BASE}/catalog${qs}`, { method: 'GET' });
  },

  saveStep1(payload: Record<string, unknown>, registrationCode?: string): Promise<ManufacturerStepResponse> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    return request<ManufacturerStepResponse>(`${BASE}/registration/step-1${qs}`, json(payload));
  },

  uploadDocument(
    file: File,
    category: string,
    registrationCode: string,
    issueDate: string,
    expiryDate: string,
    token?: string,
  ): Promise<UploadedManufacturerDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    form.append('registrationCode', registrationCode);
    form.append('issueDate', issueDate);
    form.append('expiryDate', expiryDate);
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const params = new URLSearchParams({
      category,
      registrationCode,
      issueDate,
      expiryDate,
    });
    return request<UploadedManufacturerDocument>(`${BASE}/documents/upload?${params.toString()}`, {
      method: 'POST',
      body: form,
      headers,
    });
  },

  removeDocument(documentId: string, token?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<{ success: boolean; message: string }>(`${BASE}/documents/${documentId}`, {
      method: 'DELETE',
      headers,
    });
  },

  saveStep2(payload: { documents: Array<{ category: string; issueDate: string; expiryDate: string }> }, registrationCode: string): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-2?registrationCode=${encodeURIComponent(registrationCode)}`,
      json(payload),
    );
  },

  saveStep3(productIds: string[], registrationCode: string): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-3?registrationCode=${encodeURIComponent(registrationCode)}`,
      json({ productIds }),
    );
  },

  saveStep4(items: Array<{ productId: string; moq: number; leadTimeDays: number }>, registrationCode: string): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-4?registrationCode=${encodeURIComponent(registrationCode)}`,
      json({ items }),
    );
  },

  submitRegistration(payload: { registrationCode: string; password?: string; confirmAccurate: boolean }): Promise<any> {
    return request<any>(`${BASE}/registration/submit`, json(payload));
  },

  getMyRegistration(token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<any>(`${BASE}/my-registration`, { method: 'GET', headers });
  },

  getRegistration(code: string, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<any>(`${BASE}/registration/${encodeURIComponent(code)}`, { method: 'GET', headers });
  },

  getDocuments(registrationCode?: string, token?: string): Promise<UploadedManufacturerDocument[]> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<UploadedManufacturerDocument[]>(`${BASE}/documents${qs}`, { method: 'GET', headers });
  },
};
