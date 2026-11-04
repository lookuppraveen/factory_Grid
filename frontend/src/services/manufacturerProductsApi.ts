/**
 * FactoryGrid Manufacturer Product Catalog API Client
 * Connects directly to backend endpoints under /api/v1/manufacturer/products/*
 * and /api/v1/categories/*.
 */

export interface MasterCatalogProduct {
  id: string;
  productCode: string;
  name: string;
  genericName?: string;
  dosageForm?: string;
  strength?: string;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  packSize?: string;
  baseUom?: string;
  packUom?: string;
  brand?: string;
  lifecycleStatus?: string;
  isSellable?: boolean;
}

export interface ManufacturerProductMappingItem {
  id: string;
  registrationId: string;
  productId: string;
  manufacturerProductCode?: string | null;
  manufacturerPartNumber?: string | null;
  manufacturerSku?: string | null;
  moq: number;
  leadTimeDays: number;
  lifecycleStatus: 'ACTIVE' | 'INACTIVE';
  status: 'Active' | 'Inactive';
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPreferred: boolean;
  packagingDetails?: string | null;
  createdAt: string;
  updatedAt: string;
  product: MasterCatalogProduct;
}

export interface ManufacturerCatalogSummary {
  manufacturerId: string;
  manufacturerCode: string;
  companyName: string;
  totalMapped: number;
  activeCount: number;
  inactiveCount: number;
  totalCategories: number;
}

export interface ManufacturerProductsListResponse {
  manufacturer: {
    id: string;
    registrationCode: string;
    manufacturerCode: string;
    companyName: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: ManufacturerProductMappingItem[];
}

export interface CreateMappingPayload {
  productId: string;
  manufacturerProductCode?: string;
  manufacturerPartNumber?: string;
  manufacturerSku?: string;
  moq?: number;
  leadTimeDays?: number;
  packagingDetails?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPreferred?: boolean;
  lifecycleStatus?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateMappingPayload {
  manufacturerProductCode?: string;
  manufacturerPartNumber?: string;
  manufacturerSku?: string;
  moq?: number;
  leadTimeDays?: number;
  packagingDetails?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isPreferred?: boolean;
  lifecycleStatus?: 'ACTIVE' | 'INACTIVE';
}

export interface ManufacturerProductsQueryParams {
  search?: string;
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  status?: string;
  page?: number;
  limit?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';

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
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`Cannot connect to FactoryGrid API at ${API_BASE}. Ensure backend is running.`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status));
  }

  return (data?.data ?? data) as T;
}

export const manufacturerProductsApi = {
  /**
   * Retrieves summary counts for the authenticated manufacturer
   */
  async getSummary(): Promise<ManufacturerCatalogSummary> {
    return request<ManufacturerCatalogSummary>(`${API_BASE}/api/v1/manufacturer/products/summary`);
  },

  /**
   * Lists mapped products exclusively for the logged-in manufacturer
   */
  async listMappedProducts(params?: ManufacturerProductsQueryParams): Promise<ManufacturerProductsListResponse> {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.category && params.category !== 'ALL') qs.append('category', params.category);
    if (params?.subCategory && params.subCategory !== 'ALL') qs.append('subCategory', params.subCategory);
    if (params?.subSubCategory && params.subSubCategory !== 'ALL') qs.append('subSubCategory', params.subSubCategory);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));

    const url = `${API_BASE}/api/v1/manufacturer/products${qs.toString() ? `?${qs.toString()}` : ''}`;
    return request<ManufacturerProductsListResponse>(url);
  },

  /**
   * Retrieves a single mapping by ID
   */
  async getMappingById(id: string): Promise<ManufacturerProductMappingItem> {
    return request<ManufacturerProductMappingItem>(`${API_BASE}/api/v1/manufacturer/products/${id}`);
  },

  /**
   * Maps a product from central master to facility
   */
  async createMapping(payload: CreateMappingPayload): Promise<ManufacturerProductMappingItem> {
    return request<ManufacturerProductMappingItem>(`${API_BASE}/api/v1/manufacturer/products`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Updates an existing mapping
   */
  async updateMapping(id: string, payload: UpdateMappingPayload): Promise<ManufacturerProductMappingItem> {
    return request<ManufacturerProductMappingItem>(`${API_BASE}/api/v1/manufacturer/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Toggles or updates mapping status (ACTIVE vs INACTIVE)
   */
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ManufacturerProductMappingItem> {
    return request<ManufacturerProductMappingItem>(`${API_BASE}/api/v1/manufacturer/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * Deletes mapping
   */
  async deleteMapping(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${API_BASE}/api/v1/manufacturer/products/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Cascading Category Endpoints
   */
  async getCategories(): Promise<any> {
    return request<any>(`${API_BASE}/api/v1/categories`);
  },

  async getSubCategories(category: string): Promise<string[]> {
    return request<string[]>(`${API_BASE}/api/v1/categories/${encodeURIComponent(category)}/sub-categories`);
  },

  async getSubSubCategories(category: string, subCategory: string): Promise<string[]> {
    return request<string[]>(
      `${API_BASE}/api/v1/categories/${encodeURIComponent(category)}/sub-categories/${encodeURIComponent(subCategory)}/sub-sub-categories`,
    );
  },

  /**
   * Search master products from central catalogue for mapping
   */
  async searchMasterProducts(params: {
    search?: string;
    category?: string;
    subCategory?: string;
    subSubCategory?: string;
  }): Promise<MasterCatalogProduct[]> {
    const qs = new URLSearchParams();
    if (params.search) qs.append('search', params.search);
    if (params.category && params.category !== 'ALL') qs.append('category', params.category);
    if (params.subCategory && params.subCategory !== 'ALL') qs.append('subCategory', params.subCategory);
    if (params.subSubCategory && params.subSubCategory !== 'ALL') qs.append('subSubCategory', params.subSubCategory);
    qs.append('activeOnly', 'true');
    qs.append('limit', '100');

    const url = `${API_BASE}/api/v1/catalog/products?${qs.toString()}`;
    const data = await request<any[]>(url);
    return (data || []).map((p: any) => ({
      id: p.id || p.product_id,
      productCode: p.productCode || p.product_code || p.code,
      name: p.name || p.product_name,
      genericName: p.genericName || p.generic_name || '',
      dosageForm: p.dosageForm || p.dosage_form || 'Tablet',
      strength: p.attributes?.strength || p.strength || p.shortName || 'Standard',
      category: p.category || 'Drugs',
      subCategory: p.subCategory || p.sub_category || null,
      subSubCategory: p.subSubCategory || p.sub_sub_category || null,
      packSize: p.packSize || p.pack_size || '10 x 10 Strip',
      baseUom: p.baseUom || p.base_uom || p.uom || 'Unit',
      brand: p.brand || null,
      lifecycleStatus: p.lifecycleStatus || p.lifecycle_status || 'ACTIVE',
    }));
  },
};
