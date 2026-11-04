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
  documentId?: string;
  manufacturerId?: string;
  documentCode: string;
  category: string;
  documentType?: string;
  categoryDisplayName: string;
  documentName?: string;
  fileName: string;
  originalFileName?: string;
  fileSize: number;
  mimeType: string;
  contentType?: string;
  storageKey?: string;
  fileReference?: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  verificationStatus?: string;
  rejectionReason?: string | null;
  adminRemarks?: string | null;
  reviewedBy?: string | null;
  verifiedBy?: string | null;
  reviewedAt?: string | null;
  verifiedAt?: string | null;
  reviewDecision?: string | null;
  version: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface FactoryGalleryItem {
  id: string;
  registrationCode: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  imageUrl: string;
  captureDate: string | null;
  factoryLocation: string;
  gpsCoordinates: string | null;
  uploadedBy: string;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGalleryPayload {
  title: string;
  factoryLocation?: string;
  locationName?: string;
  captureDate?: string;
  capturedAt?: string;
  description?: string;
  gpsCoordinates?: string;
  latitude?: number | string;
  longitude?: number | string;
  registrationCode?: string;
}

export interface UpdateGalleryPayload {
  title?: string;
  factoryLocation?: string;
  locationName?: string;
  captureDate?: string;
  capturedAt?: string;
  description?: string;
  gpsCoordinates?: string;
  latitude?: number | string;
  longitude?: number | string;
}

export interface AchievementItem {
  id: string;
  registrationCode: string;
  title: string;
  awardType: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string | null;
  description: string | null;
  hasCertificate: boolean;
  certificateFileName: string | null;
  certificateFileSize: number | null;
  certificateMimeType: string | null;
  certificateUrl: string | null;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAchievementPayload {
  title: string;
  awardType: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  description?: string;
  registrationCode?: string;
}

export interface UpdateAchievementPayload {
  title?: string;
  awardType?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  description?: string;
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

export interface CategoryHierarchyItem {
  id: string;
  categoryId: string;
  productTypeId: string;
  category: string;
  subCategory: string | null;
  subSubCategory: string | null;
  categoryCode: string;
  description: string | null;
  name: string;
  fullName: string;
}

export interface CategoryTreeSubItem {
  id: string;
  categoryId: string;
  categoryCode: string;
  subSubCategory: string | null;
  name: string;
  description: string | null;
}

export interface CategoryTreeSubCategory {
  subCategory: string;
  items: CategoryTreeSubItem[];
}

export interface CategoryTreeCategory {
  category: string;
  productTypeId: string;
  subCategories: CategoryTreeSubCategory[];
}

export interface CategoryHierarchyResponse {
  categories: CategoryHierarchyItem[];
  tree: CategoryTreeCategory[];
}

export const manufacturerRegistrationApi = {
  listCatalog(search?: string): Promise<CatalogProductItem[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<CatalogProductItem[]>(`${BASE}/catalog${qs}`, { method: 'GET' });
  },

  listCategories(): Promise<CategoryHierarchyResponse> {
    return request<CategoryHierarchyResponse>(`${BASE}/categories`, { method: 'GET' });
  },

  saveStep1(payload: Record<string, unknown>, registrationCode?: string): Promise<ManufacturerStepResponse> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    return request<ManufacturerStepResponse>(`${BASE}/registration/step-1${qs}`, json(payload));
  },

  uploadDocument(
    file: File,
    category: string,
    registrationCode: string,
    issueDate?: string,
    expiryDate?: string,
    documentNumber?: string,
    token?: string,
  ): Promise<UploadedManufacturerDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    form.append('registrationCode', registrationCode);
    if (issueDate) form.append('issueDate', issueDate);
    if (expiryDate) form.append('expiryDate', expiryDate);
    if (documentNumber) {
      form.append('documentNumber', documentNumber);
    }
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const params = new URLSearchParams({
      category,
      registrationCode,
      ...(issueDate ? { issueDate } : {}),
      ...(expiryDate ? { expiryDate } : {}),
      ...(documentNumber ? { documentNumber } : {}),
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

  saveStep2(
    payload: {
      documents?: Array<{ category: string; issueDate?: string; expiryDate?: string; documentNumber?: string }>;
      whoGmpApplicable?: boolean;
    },
    registrationCode: string,
  ): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-2?registrationCode=${encodeURIComponent(registrationCode)}`,
      json(payload),
    );
  },

  saveStep3(categoryOrProductIds: string[], registrationCode: string): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-3?registrationCode=${encodeURIComponent(registrationCode)}`,
      json({ categoryIds: categoryOrProductIds, productIds: categoryOrProductIds }),
    );
  },

  saveStep4(
    items: Array<{
      productId?: string;
      categoryId?: string;
      moq?: number;
      batchSize?: number;
      leadTimeDays?: number;
      deliveryScheduleDays?: number;
    }>,
    registrationCode: string,
  ): Promise<ManufacturerStepResponse> {
    return request<ManufacturerStepResponse>(
      `${BASE}/registration/step-4?registrationCode=${encodeURIComponent(registrationCode)}`,
      json({ items }),
    );
  },

  submitRegistration(payload: { registrationCode: string; password?: string; confirmAccurate: boolean; whoGmpApplicable?: boolean }): Promise<any> {
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

  getMyDocuments(token?: string): Promise<UploadedManufacturerDocument[]> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<UploadedManufacturerDocument[]>(`${BASE}/me/documents`, { method: 'GET', headers });
  },

  uploadMyDocument(
    file: File,
    category: string,
    documentNumber?: string,
    issueDate?: string,
    expiryDate?: string,
    token?: string,
  ): Promise<UploadedManufacturerDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('category', category);
    if (documentNumber) form.append('documentNumber', documentNumber);
    if (issueDate) form.append('issueDate', issueDate);
    if (expiryDate) form.append('expiryDate', expiryDate);

    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const params = new URLSearchParams({
      category,
      ...(documentNumber ? { documentNumber } : {}),
      ...(issueDate ? { issueDate } : {}),
      ...(expiryDate ? { expiryDate } : {}),
    });
    return request<UploadedManufacturerDocument>(`${BASE}/me/documents?${params.toString()}`, {
      method: 'POST',
      body: form,
      headers,
    });
  },

  replaceMyDocument(
    documentId: string,
    file: File,
    documentNumber?: string,
    issueDate?: string,
    expiryDate?: string,
    token?: string,
  ): Promise<UploadedManufacturerDocument> {
    const form = new FormData();
    form.append('file', file);
    if (documentNumber) form.append('documentNumber', documentNumber);
    if (issueDate) form.append('issueDate', issueDate);
    if (expiryDate) form.append('expiryDate', expiryDate);

    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    const params = new URLSearchParams({
      ...(documentNumber ? { documentNumber } : {}),
      ...(issueDate ? { issueDate } : {}),
      ...(expiryDate ? { expiryDate } : {}),
    });
    return request<UploadedManufacturerDocument>(`${BASE}/me/documents/${encodeURIComponent(documentId)}?${params.toString()}`, {
      method: 'PUT',
      body: form,
      headers,
    });
  },

  // --- Factory Gallery ---

  listGallery(registrationCode?: string, token?: string): Promise<FactoryGalleryItem[]> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<FactoryGalleryItem[]>(`${BASE}/gallery${qs}`, { method: 'GET', headers });
  },

  uploadGalleryEntry(
    file: File,
    payload: CreateGalleryPayload,
    registrationCode?: string,
    token?: string,
  ): Promise<FactoryGalleryItem> {
    const title = payload.title?.trim() || '';
    const factoryLocation = (payload.factoryLocation || payload.locationName || '').trim();
    const captureDate = payload.captureDate || payload.capturedAt || '';
    const description = (payload.description || '').trim();
    let gpsCoordinates = (payload.gpsCoordinates || '').trim();
    if (!gpsCoordinates && payload.latitude !== undefined && payload.longitude !== undefined && payload.latitude !== '' && payload.longitude !== '') {
      gpsCoordinates = `${payload.latitude}, ${payload.longitude}`;
    }
    const regCode = (registrationCode || payload.registrationCode || '').trim();

    const form = new FormData();
    // Append text fields FIRST so multipart stream parsers receive metadata before the file
    if (title) form.append('title', title);
    if (factoryLocation) {
      form.append('factoryLocation', factoryLocation);
      form.append('locationName', factoryLocation);
    }
    if (captureDate) {
      form.append('captureDate', captureDate);
      form.append('capturedAt', captureDate);
    }
    if (description) form.append('description', description);
    if (gpsCoordinates) form.append('gpsCoordinates', gpsCoordinates);
    if (regCode) form.append('registrationCode', regCode);
    form.append('file', file);

    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Dual transport: Also append metadata as URL query parameters to guarantee arrival
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (factoryLocation) {
      params.append('factoryLocation', factoryLocation);
      params.append('locationName', factoryLocation);
    }
    if (captureDate) {
      params.append('captureDate', captureDate);
      params.append('capturedAt', captureDate);
    }
    if (description) params.append('description', description);
    if (gpsCoordinates) params.append('gpsCoordinates', gpsCoordinates);
    if (regCode) params.append('registrationCode', regCode);

    const qs = params.toString() ? `?${params.toString()}` : '';

    return request<FactoryGalleryItem>(`${BASE}/gallery/upload${qs}`, {
      method: 'POST',
      headers,
      body: form,
    });
  },

  updateGalleryEntry(
    id: string,
    payload: UpdateGalleryPayload,
    token?: string,
  ): Promise<FactoryGalleryItem> {
    const normalized: Record<string, any> = { ...payload };
    if (!normalized.factoryLocation && normalized.locationName) {
      normalized.factoryLocation = normalized.locationName;
    }
    if (!normalized.captureDate && normalized.capturedAt) {
      normalized.captureDate = normalized.capturedAt;
    }
    if (!normalized.gpsCoordinates && normalized.latitude !== undefined && normalized.longitude !== undefined && normalized.latitude !== '' && normalized.longitude !== '') {
      normalized.gpsCoordinates = `${normalized.latitude}, ${normalized.longitude}`;
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<FactoryGalleryItem>(`${BASE}/gallery/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(normalized),
    });
  },

  deleteGalleryEntry(id: string, token?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<{ success: boolean; message: string }>(`${BASE}/gallery/${id}`, {
      method: 'DELETE',
      headers,
    });
  },

  // --- Achievements & Awards ---

  listAchievements(registrationCode?: string, token?: string): Promise<AchievementItem[]> {
    const qs = registrationCode ? `?registrationCode=${encodeURIComponent(registrationCode)}` : '';
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<AchievementItem[]>(`${BASE}/achievements${qs}`, { method: 'GET', headers });
  },

  createAchievement(
    payload: CreateAchievementPayload,
    file?: File,
    token?: string,
  ): Promise<AchievementItem> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (file) {
      const form = new FormData();
      form.append('file', file);
      form.append('title', payload.title);
      form.append('awardType', payload.awardType);
      form.append('issuingOrganization', payload.issuingOrganization);
      form.append('issueDate', payload.issueDate);
      if (payload.expiryDate) form.append('expiryDate', payload.expiryDate);
      if (payload.description) form.append('description', payload.description);
      if (payload.registrationCode) form.append('registrationCode', payload.registrationCode);

      return request<AchievementItem>(`${BASE}/achievements`, {
        method: 'POST',
        headers,
        body: form,
      });
    }

    headers['Content-Type'] = 'application/json';
    return request<AchievementItem>(`${BASE}/achievements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  },

  updateAchievement(
    id: string,
    payload: UpdateAchievementPayload,
    token?: string,
  ): Promise<AchievementItem> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<AchievementItem>(`${BASE}/achievements/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
  },

  uploadAchievementCertificate(
    id: string,
    file: File,
    token?: string,
  ): Promise<AchievementItem> {
    const form = new FormData();
    form.append('file', file);

    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<AchievementItem>(`${BASE}/achievements/${id}/certificate`, {
      method: 'POST',
      headers,
      body: form,
    });
  },

  deleteAchievement(id: string, token?: string): Promise<{ success: boolean; message: string }> {
    const headers: Record<string, string> = {};
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return request<{ success: boolean; message: string }>(`${BASE}/achievements/${id}`, {
      method: 'DELETE',
      headers,
    });
  },
};
