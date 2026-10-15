/**
 * FactoryGrid Buyer Registration API client.
 * Maps 1:1 to the NestJS endpoints under /api/v1/buyer/*.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/buyer`;

export interface StepResponse {
  success: boolean;
  message: string;
  registrationCode: string;
  currentStep: number;
}

export interface UploadedDocument {
  id: string;
  documentCode: string;
  category: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  uploadedAt: string;
}

export interface SubmitResult {
  requestCode: string;
  verificationStatus: string;
  [key: string]: unknown;
}

/** Turns whatever error body the API returned into one readable message. */
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

export const buyerRegistrationApi = {
  saveStep1(payload: Record<string, unknown>, registrationCode?: string): Promise<StepResponse> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    return request<StepResponse>(`${BASE}/registration/step-1${qs}`, json(payload));
  },

  saveStep2(payload: Record<string, unknown>, registrationCode: string): Promise<StepResponse> {
    return request<StepResponse>(
      `${BASE}/registration/step-2?registrationCode=${encodeURIComponent(registrationCode)}`,
      json(payload),
    );
  },

  saveStep3(payload: Record<string, unknown>, registrationCode: string): Promise<StepResponse> {
    return request<StepResponse>(
      `${BASE}/registration/step-3?registrationCode=${encodeURIComponent(registrationCode)}`,
      json(payload),
    );
  },

  uploadDocument(file: File, category: string, registrationCode: string, token?: string): Promise<UploadedDocument> {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<UploadedDocument>(
      `${BASE}/documents/upload?category=${encodeURIComponent(category)}&registrationCode=${encodeURIComponent(registrationCode)}`,
      { method: 'POST', body: form, headers },
    );
  },

  submitRegistration(payload: Record<string, unknown>): Promise<SubmitResult> {
    return request<SubmitResult>(`${BASE}/registration/submit`, json(payload));
  },

  getMyRegistration(token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<any>(`${BASE}/my-registration`, { method: 'GET', headers });
  },

  getDocuments(registrationCode?: string, token?: string): Promise<UploadedDocument[]> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<UploadedDocument[]>(`${BASE}/documents${qs}`, { method: 'GET', headers });
  },
};
