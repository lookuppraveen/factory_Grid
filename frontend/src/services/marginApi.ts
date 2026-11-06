/**
 * FactoryGrid Margin Engine & Commercial Pricing API Client
 * Connects directly to backend endpoints under /api/v1/margins/*.
 * All persistence is powered by PostgreSQL. Zero local storage mock data.
 */

import { CategoryMargin, MarginRule, MarginType, PlatformFeeConfig } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/margins`;

let cachedAdminToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('fg_auth_token');
    if (existing) return existing;
  }

  if (cachedAdminToken) return cachedAdminToken;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' }),
    });
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
    // Backend offline / restarting
  }

  return (typeof window !== 'undefined' ? localStorage.getItem('fg_auth_token') : '') || '';
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
  return `Margin Engine operation failed (HTTP ${status})`;
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
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
    throw new Error(`Cannot connect to the FactoryGrid API at ${API_BASE}. Ensure backend is running.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const msg = extractErrorMessage(payload, response.status);
    throw new Error(msg);
  }

  return payload as T;
}

// =====================================================================
// MARGIN SUMMARY
// =====================================================================

export interface MarginSummaryResponse {
  totalCategories: number;
  configuredCategories: number;
  totalManufacturers: number;
  configuredManufacturers: number;
  totalProducts: number;
  configuredProducts: number;
  avgMarginPercentage: number;
  activeRulesCount: number;
  platformFee: {
    id: string;
    feeMode: 'PERCENTAGE' | 'FIXED_RATE';
    feeValue: number;
    feeName: string;
    status: 'Active' | 'Inactive';
    updatedAt: string;
  };
}

export async function fetchMarginSummary(): Promise<MarginSummaryResponse> {
  return request<MarginSummaryResponse>(`${BASE}/summary`);
}

// =====================================================================
// PLATFORM FEE
// =====================================================================

export async function fetchPlatformFee(): Promise<PlatformFeeConfig> {
  const raw = await request<any>(`${BASE}/platform-fee`);
  return {
    feeType: raw.feeMode || raw.feeType || 'PERCENTAGE',
    feeValue: Number(raw.feeValue) || 2.0,
    feeName: raw.feeName || 'Platform Facilitation & Escrow Fee',
    status: raw.status || 'Active',
    updatedAt: raw.updatedAt,
  };
}

export async function savePlatformFee(updates: Partial<PlatformFeeConfig>): Promise<PlatformFeeConfig> {
  const payload = {
    feeMode: updates.feeType || 'PERCENTAGE',
    feeValue: updates.feeValue !== undefined ? Number(updates.feeValue) : 2.0,
    feeName: updates.feeName || 'Platform Facilitation & Escrow Fee',
    status: updates.status || 'Active',
  };
  const raw = await request<any>(`${BASE}/platform-fee`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    feeType: raw.feeMode || raw.feeType || 'PERCENTAGE',
    feeValue: Number(raw.feeValue) || 2.0,
    feeName: raw.feeName || 'Platform Facilitation & Escrow Fee',
    status: raw.status || 'Active',
    updatedAt: raw.updatedAt,
  };
}

// =====================================================================
// CATEGORY MARGINS
// =====================================================================

export interface BackendCategoryMargin {
  id: string;
  categoryId: string;
  categoryName: string;
  marginMode: MarginType;
  marginValue: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export async function fetchCategoryMargins(): Promise<BackendCategoryMargin[]> {
  return request<BackendCategoryMargin[]>(`${BASE}/categories`);
}

export async function saveCategoryMargin(
  idOrName: string,
  marginValue: number,
  marginMode: MarginType = 'PERCENTAGE',
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
): Promise<BackendCategoryMargin> {
  return request<BackendCategoryMargin>(`${BASE}/categories/${encodeURIComponent(idOrName)}`, {
    method: 'PUT',
    body: JSON.stringify({
      marginMode,
      marginValue: Number(marginValue),
      status,
    }),
  });
}

// =====================================================================
// MANUFACTURER MARGINS
// =====================================================================

export interface BackendManufacturerMargin {
  id: string;
  manufacturerId: string;
  manufacturerName: string;
  marginMode: MarginType;
  marginValue: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export async function fetchManufacturerMargins(): Promise<BackendManufacturerMargin[]> {
  return request<BackendManufacturerMargin[]>(`${BASE}/manufacturers`);
}

export async function saveManufacturerMargin(
  mfgId: string,
  marginValue: number,
  marginMode: MarginType = 'PERCENTAGE',
  manufacturerName?: string,
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE',
): Promise<BackendManufacturerMargin> {
  return request<BackendManufacturerMargin>(`${BASE}/manufacturers/${encodeURIComponent(mfgId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      marginMode,
      marginValue: Number(marginValue),
      manufacturerName,
      status,
    }),
  });
}

// =====================================================================
// PRODUCT / SKU MARGINS
// =====================================================================

export interface BackendProductMarginItem {
  id: string;
  productId: string;
  sku?: string;
  productName?: string;
  manufacturerId: string;
  manufacturerName?: string;
  marginMode: MarginType;
  marginValue: number;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface BackendProductMarginsPage {
  items: BackendProductMarginItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export async function fetchProductMargins(params?: {
  search?: string;
  manufacturerId?: string;
  productId?: string;
  page?: number;
  size?: number;
}): Promise<BackendProductMarginsPage> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.manufacturerId) query.append('manufacturerId', params.manufacturerId);
  if (params?.productId) query.append('productId', params.productId);
  if (params?.page) query.append('page', String(params.page));
  if (params?.size) query.append('size', String(params.size));

  const qs = query.toString();
  return request<BackendProductMarginsPage>(`${BASE}/products${qs ? `?${qs}` : ''}`);
}

export async function saveProductMargin(
  productId: string,
  manufacturerId: string,
  marginMode: MarginType,
  marginValue: number,
  details?: { sku?: string; productName?: string; manufacturerName?: string; status?: string },
): Promise<BackendProductMarginItem> {
  const url = `${BASE}/products/${encodeURIComponent(productId)}/manufacturers/${encodeURIComponent(manufacturerId)}`;
  return request<BackendProductMarginItem>(url, {
    method: 'PUT',
    body: JSON.stringify({
      productId,
      manufacturerId,
      marginMode,
      marginValue: Number(marginValue),
      sku: details?.sku,
      productName: details?.productName,
      manufacturerName: details?.manufacturerName,
      status: details?.status || 'ACTIVE',
    }),
  });
}

export async function bulkImportProductMargins(
  rows: {
    productId: string;
    sku?: string;
    productName?: string;
    manufacturerId?: string;
    manufacturerName?: string;
    marginMode?: string;
    marginValue: number;
  }[],
): Promise<{ totalRows: number; successCount: number; failedCount: number; errors: string[] }> {
  return request(`${BASE}/products/import`, {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}

// =====================================================================
// 4-TIER RESOLUTION CALCULATION
// =====================================================================

export interface MarginCalculationResult {
  baseUnitPrice: number;
  marginMode: MarginType;
  marginValue: number;
  marginPercentage: number;
  marginRate?: number;
  marginAmount: number;
  sellingPrice: number;
  platformFeeAmount: number;
  platformFeePercent?: number;
  commercialPrice: number;
  ruleType: 'PRODUCT' | 'MANUFACTURER' | 'CATEGORY' | 'DEFAULT';
  ruleSource: string;
}

export async function calculateMargin(params: {
  productId?: string;
  sku?: string;
  manufacturerId?: string;
  categoryId?: string;
  categoryName?: string;
  basePrice: number;
}): Promise<MarginCalculationResult> {
  return request<MarginCalculationResult>(`${BASE}/calculate`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

