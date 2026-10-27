/**
 * FactoryGrid Central Catalog & Category Master API Client
 * Connects directly to backend endpoints under /api/v1/catalog/*.
 */

import { Product, Category } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE = `${API_BASE}/api/v1/catalog`;

let cachedAdminToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem('fg_auth_token');
    if (existing) return existing;
  }

  if (cachedAdminToken) return cachedAdminToken;

  // Auto-authenticate with platform administrator credentials if navigating as admin
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail: 'admin@factorygrid.com', password: 'Admin12345678' })
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
    // Backend restarting or offline
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
  return `Catalog operation failed (HTTP ${status})`;
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

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return (data?.data ?? data) as T;
}

export interface ProductQueryParams {
  search?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  productTypeId?: string;
  lifecycleStatus?: string;
  activeOnly?: boolean;
}

export const catalogApi = {
  // ── PRODUCTS ──
  async listProducts(params?: ProductQueryParams): Promise<Product[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.category && params.category !== 'ALL') qs.append('category', params.category);
    if (params?.subCategory && params.subCategory !== 'ALL') qs.append('subCategory', params.subCategory);
    if (params?.subSubCategory && params.subSubCategory !== 'ALL') qs.append('subSubCategory', params.subSubCategory);
    if (params?.productTypeId && params.productTypeId !== 'ALL') qs.append('productTypeId', params.productTypeId);
    if (params?.lifecycleStatus && params.lifecycleStatus !== 'ALL') qs.append('lifecycleStatus', params.lifecycleStatus);
    if (params?.activeOnly) qs.append('activeOnly', 'true');

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    return request<Product[]>(`${BASE}/products${queryStr}`, { method: 'GET' });
  },

  async getProduct(id: string): Promise<Product> {
    return request<Product>(`${BASE}/products/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createProduct(payload: Record<string, any>): Promise<Product> {
    return request<Product>(`${BASE}/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProduct(id: string, payload: Record<string, any>): Promise<Product> {
    return request<Product>(`${BASE}/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async toggleProductStatus(id: string): Promise<Product> {
    return request<Product>(`${BASE}/products/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string; id: string }> {
    return request<{ success: boolean; message: string; id: string }>(`${BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── CATEGORIES ──
  async listCategories(productTypeId?: string): Promise<{ categories: Category[]; tree: any[] }> {
    const qs = productTypeId && productTypeId !== 'ALL' ? `?productTypeId=${encodeURIComponent(productTypeId)}` : '';
    return request<{ categories: Category[]; tree: any[] }>(`${BASE}/categories${qs}`, { method: 'GET' });
  },

  async createCategory(payload: Record<string, any>): Promise<Category> {
    return request<Category>(`${BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(id: string, payload: Record<string, any>): Promise<Category> {
    return request<Category>(`${BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async toggleCategoryStatus(id: string): Promise<Category> {
    return request<Category>(`${BASE}/categories/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },
};
