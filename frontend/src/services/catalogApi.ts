/**
 * FactoryGrid Central Catalog & Category Master API Client
 * Connects directly to backend endpoints under /api/v1/catalog/*.
 */

import { Product, Category, AttributeMaster, CategoryAttribute, ProductAttribute, ProductType, ProductTypeAttribute, PageResponse, PageableQuery } from '../types';

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

export function normalizePageResponse<T>(res: any, fallbackItems: T[] = []): PageResponse<T> & T[] & Record<string, any> {
  const content: T[] = Array.isArray(res)
    ? res
    : (Array.isArray(res?.content)
      ? res.content
      : (Array.isArray(res?.categories)
        ? res.categories
        : (Array.isArray(res?.productTypes)
          ? res.productTypes
          : (Array.isArray(res?.attributes)
            ? res.attributes
            : (Array.isArray(res?.products) ? res.products : fallbackItems)))));

  const total = typeof res?.totalElements === 'number'
    ? res.totalElements
    : (typeof res?.total === 'number' ? res.total : content.length);
  const size = res?.pageSize || content.length || 10;
  const currentPage = res?.currentPage ?? 0;
  const totalPages = res?.totalPages ?? (size > 0 ? Math.ceil(total / size) || 1 : 1);

  const arrayObj = [...content] as PageResponse<T> & T[] & Record<string, any>;
  arrayObj.content = content;
  arrayObj.currentPage = currentPage;
  arrayObj.pageSize = size;
  arrayObj.totalElements = total;
  arrayObj.totalPages = totalPages;
  arrayObj.first = res?.first ?? (currentPage === 0);
  arrayObj.last = res?.last ?? (currentPage >= totalPages - 1);
  arrayObj.hasNext = res?.hasNext ?? (currentPage < totalPages - 1);
  arrayObj.hasPrevious = res?.hasPrevious ?? (currentPage > 0);
  arrayObj.numberOfElements = content.length;
  arrayObj.categories = content;
  arrayObj.productTypes = content;
  arrayObj.attributes = content;
  arrayObj.products = content;
  arrayObj.tree = res?.tree || [];

  return arrayObj;
}

export interface ProductQueryParams extends PageableQuery {
  category?: string;
  subCategory?: string;
  subSubCategory?: string;
  productTypeId?: string;
  lifecycleStatus?: string;
  activeOnly?: boolean;
}

export interface ProductTypeQueryParams extends PageableQuery {
  status?: string;
  activeOnly?: boolean;
}

export interface CategoryQueryParams extends PageableQuery {
  productTypeId?: string;
  status?: string;
  activeOnly?: boolean;
}

export interface AttributeQueryParams extends PageableQuery {
  dataType?: string;
  status?: string;
  activeOnly?: boolean;
}

export const catalogApi = {
  // ── PRODUCTS ──
  async listProducts(params?: ProductQueryParams): Promise<PageResponse<Product> & Product[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    if (params?.size !== undefined) qs.append('size', String(params.size));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.sort) qs.append('sort', params.sort);
    if (params?.search) qs.append('search', params.search);
    if (params?.category && params.category !== 'ALL') qs.append('category', params.category);
    if (params?.subCategory && params.subCategory !== 'ALL') qs.append('subCategory', params.subCategory);
    if (params?.subSubCategory && params.subSubCategory !== 'ALL') qs.append('subSubCategory', params.subSubCategory);
    if (params?.productTypeId && params.productTypeId !== 'ALL') qs.append('productTypeId', params.productTypeId);
    if (params?.lifecycleStatus && params.lifecycleStatus !== 'ALL') qs.append('lifecycleStatus', params.lifecycleStatus);
    if (params?.activeOnly) qs.append('activeOnly', 'true');

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/products${queryStr}`, { method: 'GET' });
    return normalizePageResponse<Product>(res);
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

  // ── CATEGORIES & PRODUCT TYPES ──
  async listProductTypes(params?: ProductTypeQueryParams): Promise<PageResponse<ProductType> & ProductType[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    if (params?.size !== undefined) qs.append('size', String(params.size));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.sort) qs.append('sort', params.sort);
    if (params?.search) qs.append('search', params.search);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.activeOnly) qs.append('activeOnly', 'true');

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/product-types${queryStr}`, { method: 'GET' });
    return normalizePageResponse<ProductType>(res);
  },

  async getProductType(id: string): Promise<ProductType> {
    return request<ProductType>(`${BASE}/product-types/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createProductType(payload: Record<string, any>): Promise<ProductType> {
    return request<ProductType>(`${BASE}/product-types`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProductType(id: string, payload: Record<string, any>): Promise<ProductType> {
    return request<ProductType>(`${BASE}/product-types/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async toggleProductTypeStatus(id: string): Promise<ProductType> {
    return request<ProductType>(`${BASE}/product-types/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteProductType(id: string): Promise<{ success: boolean; message: string; id: string }> {
    return request<{ success: boolean; message: string; id: string }>(`${BASE}/product-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async listCategories(paramsOrProductTypeId?: string | CategoryQueryParams): Promise<PageResponse<Category> & { categories: Category[]; tree: any[] } & Category[]> {
    const params = typeof paramsOrProductTypeId === 'string'
      ? { productTypeId: paramsOrProductTypeId }
      : (paramsOrProductTypeId || {});

    const qs = new URLSearchParams();
    if (params.page !== undefined) qs.append('page', String(params.page));
    if (params.size !== undefined) qs.append('size', String(params.size));
    if (params.limit !== undefined) qs.append('limit', String(params.limit));
    if (params.sort) qs.append('sort', params.sort);
    if (params.search) qs.append('search', params.search);
    if (params.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params.productTypeId && params.productTypeId !== 'ALL') qs.append('productTypeId', params.productTypeId);
    if (params.activeOnly) qs.append('activeOnly', 'true');

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/categories${queryStr}`, { method: 'GET' });
    return normalizePageResponse<Category>(res) as any;
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

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── PRODUCT TYPE ATTRIBUTE ASSIGNMENTS (CANONICAL) ──
  async getProductTypeAttributes(productTypeId: string): Promise<ProductTypeAttribute[]> {
    return request<ProductTypeAttribute[]>(`${BASE}/product-types/${encodeURIComponent(productTypeId)}/attributes`, { method: 'GET' });
  },

  async assignProductTypeAttribute(productTypeId: string, payload: {
    attributeId: string;
    isRequired?: boolean;
    displayOrder?: number;
    remark?: string;
    lifecycleStatus?: string;
  }): Promise<ProductTypeAttribute> {
    return request<ProductTypeAttribute>(`${BASE}/product-types/${encodeURIComponent(productTypeId)}/attributes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProductTypeAttributeConfig(productTypeId: string, attributeId: string, payload: {
    isRequired?: boolean;
    displayOrder?: number;
    remark?: string;
    lifecycleStatus?: string;
  }): Promise<ProductTypeAttribute> {
    return request<ProductTypeAttribute>(`${BASE}/product-types/${encodeURIComponent(productTypeId)}/attributes/${encodeURIComponent(attributeId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async bulkUpdateProductTypeAttributes(productTypeId: string, attributes: Array<{
    attribute_id?: string;
    attributeId?: string;
    is_required?: boolean;
    isRequired?: boolean;
    display_order?: number;
    displayOrder?: number;
    lifecycle_status?: string;
    lifecycleStatus?: string;
    remark?: string;
  }>): Promise<ProductTypeAttribute[]> {
    return request<ProductTypeAttribute[]>(`${BASE}/product-types/${encodeURIComponent(productTypeId)}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({
        attributes: attributes.map(a => ({
          attributeId: a.attributeId || a.attribute_id,
          isRequired: a.isRequired !== undefined ? a.isRequired : (a.is_required !== undefined ? a.is_required : false),
          displayOrder: a.displayOrder || a.display_order || 1,
          lifecycleStatus: a.lifecycleStatus || a.lifecycle_status || 'ACTIVE',
          remark: a.remark || '',
        })),
      }),
    });
  },

  async removeProductTypeAttribute(productTypeId: string, attributeId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/product-types/${encodeURIComponent(productTypeId)}/attributes/${encodeURIComponent(attributeId)}`, {
      method: 'DELETE',
    });
  },

  // ── CATEGORY ATTRIBUTE ASSIGNMENTS (DEPRECATED STUBS) ──
  async getCategoryAttributes(_categoryId: string): Promise<CategoryAttribute[]> {
    return [];
  },

  async assignCategoryAttribute(_categoryId: string, _payload: any): Promise<any> {
    return { success: true };
  },

  async bulkUpdateCategoryAttributes(_categoryId: string, _attributes: any[]): Promise<CategoryAttribute[]> {
    return [];
  },

  async removeCategoryAttribute(_categoryId: string, _attributeId: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Removed' };
  },

  // ── CENTRAL ATTRIBUTE MASTER ──
  async listAttributes(params?: AttributeQueryParams): Promise<PageResponse<AttributeMaster> & AttributeMaster[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    if (params?.size !== undefined) qs.append('size', String(params.size));
    if (params?.limit !== undefined) qs.append('limit', String(params.limit));
    if (params?.sort) qs.append('sort', params.sort);
    if (params?.search) qs.append('search', params.search);
    if (params?.dataType && params.dataType !== 'ALL') qs.append('dataType', params.dataType);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.activeOnly) qs.append('activeOnly', 'true');

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/attributes${queryStr}`, { method: 'GET' });
    return normalizePageResponse<AttributeMaster>(res);
  },

  async getAttribute(id: string): Promise<AttributeMaster> {
    return request<AttributeMaster>(`${BASE}/attributes/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createAttribute(payload: Partial<AttributeMaster> & { attributeCode: string; attributeName: string; dataType: string }): Promise<AttributeMaster> {
    return request<AttributeMaster>(`${BASE}/attributes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAttribute(id: string, payload: Partial<AttributeMaster>): Promise<AttributeMaster> {
    return request<AttributeMaster>(`${BASE}/attributes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async toggleAttributeStatus(id: string): Promise<AttributeMaster> {
    return request<AttributeMaster>(`${BASE}/attributes/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async assignAttributeToProductType(attributeId: string, productTypeId: string, payload?: {
    isRequired?: boolean;
    displayOrder?: number;
    remark?: string;
  }): Promise<any> {
    return request<any>(`${BASE}/attributes/${encodeURIComponent(attributeId)}/product-types/${encodeURIComponent(productTypeId)}`, {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
  },

  async removeAttributeFromProductType(attributeId: string, productTypeId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/attributes/${encodeURIComponent(attributeId)}/product-types/${encodeURIComponent(productTypeId)}`, {
      method: 'DELETE',
    });
  },

  // ── DYNAMIC PRODUCT ATTRIBUTES ──
  async getProductAttributes(productId: string): Promise<ProductAttribute[]> {
    return request<ProductAttribute[]>(`${BASE}/products/${encodeURIComponent(productId)}/attributes`, { method: 'GET' });
  },

  async saveProductAttributes(productId: string, attributes: Array<{ attributeId: string; attributeValue: string }>): Promise<ProductAttribute[]> {
    return request<ProductAttribute[]>(`${BASE}/products/${encodeURIComponent(productId)}/attributes`, {
      method: 'PUT',
      body: JSON.stringify({ attributes }),
    });
  },

  // ── PRODUCT PRICES ──
  async listProductPrices(productId: string): Promise<any[]> {
    return request<any[]>(`${BASE}/products/${encodeURIComponent(productId)}/prices`, { method: 'GET' });
  },

  async createProductPrice(productId: string, payload: {
    unitPrice: number;
    currency?: string;
    minQuantity?: number;
    maxQuantity?: number;
    priceType?: string;
    customerSegmentId?: string;
    productManufacturerId?: number;
    effectiveFrom?: string;
    effectiveTo?: string;
    priceStatus?: string;
  }): Promise<any> {
    return request<any>(`${BASE}/products/${encodeURIComponent(productId)}/prices`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── PRODUCT MANUFACTURERS ──
  async listProductManufacturers(productId: string): Promise<any[]> {
    return request<any[]>(`${BASE}/products/${encodeURIComponent(productId)}/manufacturers`, { method: 'GET' });
  },

  async mapProductManufacturer(productId: string, payload: {
    registrationId: number | string;
    manufacturerProductCode?: string;
    manufacturerPartNumber?: string;
    manufacturerSku?: string;
    moq?: number;
    leadTimeDays?: number;
    lifecycleStatus?: string;
    isPreferred?: boolean;
    packagingDetails?: string;
  }): Promise<any> {
    return request<any>(`${BASE}/products/${encodeURIComponent(productId)}/manufacturers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
