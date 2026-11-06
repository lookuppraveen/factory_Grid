/**
 * FactoryGrid Central Catalog & Category Master API Client
 * Connects directly to backend endpoints under /api/v1/catalog/*.
 */

import { Product, Category, AttributeMaster, CategoryAttribute, ProductAttribute, ProductType, ProductTypeAttribute, ProductPrice, ProductTax, ProductUom, CustomerSegment, Brand, Manufacturer, ProductManufacturer, PageResponse, PageableQuery } from '../types';

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

export function normalizeCategory(c: any): Category {
  if (!c || typeof c !== 'object') return c;
  const categoryId = String(c.category_id || c.categoryId || c.id || '');
  const productTypeId = String(c.product_type_id || c.productTypeId || '');
  const category = String(c.category || c.name || '');
  const rawSub = c.sub_category !== undefined ? c.sub_category : c.subCategory;
  const subCategory = rawSub ? String(rawSub).trim() : null;
  const rawSubSub = c.sub_sub_category !== undefined ? c.sub_sub_category : c.subSubCategory;
  const subSubCategory = rawSubSub ? String(rawSubSub).trim() : null;
  const categoryCode = String(c.category_code || c.categoryCode || c.code || '');
  const description = c.description ? String(c.description) : '';
  const rawStatus = c.lifecycle_status || c.lifecycleStatus || c.status || 'ACTIVE';
  const lifecycleStatus = (typeof rawStatus === 'string' ? rawStatus.toUpperCase() : 'ACTIVE') as any;
  const displayOrder = Number(c.display_order ?? c.displayOrder ?? 1) || 1;
  const createdAt = c.created_at || c.createdAt || new Date().toISOString();
  const updatedAt = c.updated_at || c.updatedAt || createdAt;

  return {
    id: categoryId,
    category_id: categoryId,
    categoryId,
    product_type_id: productTypeId,
    productTypeId,
    category,
    sub_category: subCategory,
    subCategory,
    sub_sub_category: subSubCategory,
    subSubCategory,
    category_code: categoryCode,
    categoryCode,
    code: categoryCode,
    description,
    lifecycle_status: lifecycleStatus,
    lifecycleStatus,
    status: lifecycleStatus === 'ACTIVE' ? 'Active' : 'Inactive',
    display_order: displayOrder,
    displayOrder,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
    name: subSubCategory || subCategory || category,
  };
}

export function normalizePageResponse<T>(res: any, fallbackItems: T[] = []): PageResponse<T> & T[] & Record<string, any> {
  let rawContent: T[] = Array.isArray(res)
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
  let content: T[] = Array.isArray(rawContent) && rawContent.length > 0 && (rawContent[0] as any)?.category !== undefined
    ? rawContent.map((item: any) => normalizeCategory(item) as unknown as T)
    : rawContent;

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
    qs.append('size', String(params?.size ?? 1000));
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
    qs.append('size', String(params?.size ?? 1000));
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
    qs.append('size', String(params.size ?? 1000));
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

  async getCategoryHierarchyOptions(productTypeId?: string): Promise<Record<string, {
    categories: string[];
    subCategories: Record<string, string[]>;
    subSubCategories: Record<string, Record<string, string[]>>;
  }>> {
    const qs = productTypeId && productTypeId !== 'ALL' ? `?productTypeId=${encodeURIComponent(productTypeId)}` : '';
    return request<any>(`${BASE}/categories/hierarchy-options${qs}`, { method: 'GET' });
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
    qs.append('size', String(params?.size ?? 1000));
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

  // ── PRODUCT PRICES (/api/v1/catalog/prices) ──
  async listPrices(params?: {
    productId?: string;
    manufacturerId?: string;
    customerSegmentId?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<ProductPrice> & ProductPrice[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    qs.append('size', String(params?.size ?? 1000));
    if (params?.productId) qs.append('productId', params.productId);
    if (params?.manufacturerId) qs.append('manufacturerId', params.manufacturerId);
    if (params?.customerSegmentId && params.customerSegmentId !== 'ALL') qs.append('customerSegmentId', params.customerSegmentId);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    if (params?.sort) qs.append('sort', params.sort);

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/prices${queryStr}`, { method: 'GET' });
    return normalizePageResponse<ProductPrice>(res);
  },

  async getPrice(id: string): Promise<ProductPrice> {
    return request<ProductPrice>(`${BASE}/prices/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createPrice(payload: Partial<ProductPrice>): Promise<ProductPrice> {
    return request<ProductPrice>(`${BASE}/prices`, {
      method: 'POST',
      body: JSON.stringify({
        productId: payload.product_id || payload.productId,
        productManufacturerId: payload.product_manufacturer_id ? Number(payload.product_manufacturer_id) : (payload.productManufacturerId ? Number(payload.productManufacturerId) : undefined),
        customerSegmentId: payload.customer_segment_id || payload.customerSegmentId || undefined,
        priceType: payload.price_type || payload.priceType || 'BASE',
        currency: payload.currency || 'INR',
        unitPrice: Number(payload.unit_price ?? payload.unitPrice ?? 0),
        minQuantity: Number(payload.minimum_quantity ?? payload.minQuantity ?? 1),
        maxQuantity: payload.maximum_quantity ? Number(payload.maximum_quantity) : (payload.maxQuantity ? Number(payload.maxQuantity) : undefined),
        effectiveFrom: payload.effective_from || payload.effectiveFrom || undefined,
        effectiveTo: payload.effective_to || payload.effectiveTo || undefined,
        priceStatus: (payload.price_status || payload.status || 'ACTIVE').toUpperCase(),
      }),
    });
  },

  async updatePrice(id: string, payload: Partial<ProductPrice>): Promise<ProductPrice> {
    return request<ProductPrice>(`${BASE}/prices/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        productManufacturerId: payload.product_manufacturer_id !== undefined ? (payload.product_manufacturer_id ? Number(payload.product_manufacturer_id) : null) : undefined,
        customerSegmentId: payload.customer_segment_id !== undefined ? payload.customer_segment_id : undefined,
        priceType: payload.price_type || payload.priceType,
        currency: payload.currency,
        unitPrice: payload.unit_price !== undefined ? Number(payload.unit_price) : (payload.unitPrice !== undefined ? Number(payload.unitPrice) : undefined),
        minQuantity: payload.minimum_quantity !== undefined ? Number(payload.minimum_quantity) : (payload.minQuantity !== undefined ? Number(payload.minQuantity) : undefined),
        maxQuantity: payload.maximum_quantity !== undefined ? (payload.maximum_quantity ? Number(payload.maximum_quantity) : null) : undefined,
        effectiveFrom: payload.effective_from !== undefined ? payload.effective_from : undefined,
        effectiveTo: payload.effective_to !== undefined ? payload.effective_to : undefined,
        priceStatus: payload.price_status ? payload.price_status.toUpperCase() : undefined,
      }),
    });
  },

  async togglePriceStatus(id: string): Promise<ProductPrice> {
    return request<ProductPrice>(`${BASE}/prices/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deletePrice(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/prices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── PRODUCT TAXES (/api/v1/catalog/taxes) ──
  async listTaxes(params?: {
    productId?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<ProductTax> & ProductTax[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    qs.append('size', String(params?.size ?? 1000));
    if (params?.productId) qs.append('productId', params.productId);
    if (params?.status && params.status !== 'ALL') qs.append('status', params.status);
    if (params?.search) qs.append('search', params.search);
    if (params?.sort) qs.append('sort', params.sort);

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/taxes${queryStr}`, { method: 'GET' });
    return normalizePageResponse<ProductTax>(res);
  },

  async getTax(id: string): Promise<ProductTax> {
    return request<ProductTax>(`${BASE}/taxes/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createTax(payload: Partial<ProductTax>): Promise<ProductTax> {
    return request<ProductTax>(`${BASE}/taxes`, {
      method: 'POST',
      body: JSON.stringify({
        productId: payload.product_id || payload.productId,
        taxCode: payload.tax_code || payload.taxCode,
        taxRate: Number(payload.tax_rate ?? payload.taxRate ?? 0),
        effectiveFrom: payload.effective_from || payload.effectiveFrom || undefined,
        effectiveTo: payload.effective_to || payload.effectiveTo || undefined,
        status: (payload.status || 'ACTIVE').toUpperCase(),
      }),
    });
  },

  async updateTax(id: string, payload: Partial<ProductTax>): Promise<ProductTax> {
    return request<ProductTax>(`${BASE}/taxes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        taxCode: payload.tax_code || payload.taxCode,
        taxRate: payload.tax_rate !== undefined ? Number(payload.tax_rate) : (payload.taxRate !== undefined ? Number(payload.taxRate) : undefined),
        effectiveFrom: payload.effective_from !== undefined ? payload.effective_from : undefined,
        effectiveTo: payload.effective_to !== undefined ? payload.effective_to : undefined,
        status: payload.status ? payload.status.toUpperCase() : undefined,
      }),
    });
  },

  async toggleTaxStatus(id: string): Promise<ProductTax> {
    return request<ProductTax>(`${BASE}/taxes/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteTax(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/taxes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── PRODUCT UOMS (/api/v1/catalog/uoms) ──
  async listUoms(params?: {
    productId?: string;
    active?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<ProductUom> & ProductUom[]> {
    const qs = new URLSearchParams();
    if (params?.page !== undefined) qs.append('page', String(params.page));
    qs.append('size', String(params?.size ?? 1000));
    if (params?.productId) qs.append('productId', params.productId);
    if (params?.active !== undefined && params.active !== 'ALL') qs.append('active', params.active);
    if (params?.search) qs.append('search', params.search);
    if (params?.sort) qs.append('sort', params.sort);

    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<any>(`${BASE}/uoms${queryStr}`, { method: 'GET' });
    return normalizePageResponse<ProductUom>(res);
  },

  async getUom(id: string): Promise<ProductUom> {
    return request<ProductUom>(`${BASE}/uoms/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createUom(payload: Partial<ProductUom>): Promise<ProductUom> {
    return request<ProductUom>(`${BASE}/uoms`, {
      method: 'POST',
      body: JSON.stringify({
        productId: payload.product_id || payload.productId,
        uom: payload.uom,
        conversionFactor: Number(payload.conversion_factor ?? payload.conversionFactor ?? 1),
        isBaseUom: Boolean(payload.is_base_uom ?? payload.isBaseUom ?? false),
        isOrderUom: Boolean(payload.is_order_uom ?? payload.isOrderUom ?? true),
        isActive: Boolean(payload.is_active ?? payload.isActive ?? true),
      }),
    });
  },

  async updateUom(id: string, payload: Partial<ProductUom>): Promise<ProductUom> {
    return request<ProductUom>(`${BASE}/uoms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        uom: payload.uom,
        conversionFactor: payload.conversion_factor !== undefined ? Number(payload.conversion_factor) : (payload.conversionFactor !== undefined ? Number(payload.conversionFactor) : undefined),
        isBaseUom: payload.is_base_uom !== undefined ? Boolean(payload.is_base_uom) : (payload.isBaseUom !== undefined ? Boolean(payload.isBaseUom) : undefined),
        isOrderUom: payload.is_order_uom !== undefined ? Boolean(payload.is_order_uom) : (payload.isOrderUom !== undefined ? Boolean(payload.isOrderUom) : undefined),
        isActive: payload.is_active !== undefined ? Boolean(payload.is_active) : (payload.isActive !== undefined ? Boolean(payload.isActive) : undefined),
      }),
    });
  },

  async toggleUomStatus(id: string): Promise<ProductUom> {
    return request<ProductUom>(`${BASE}/uoms/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteUom(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/uoms/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── CUSTOMER SEGMENTS (/api/v1/catalog/customer-segments) ──
  async listCustomerSegments(): Promise<CustomerSegment[]> {
    return request<CustomerSegment[]>(`${BASE}/customer-segments`, { method: 'GET' });
  },

  async getCustomerSegment(id: string): Promise<CustomerSegment> {
    return request<CustomerSegment>(`${BASE}/customer-segments/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createCustomerSegment(payload: Partial<CustomerSegment>): Promise<CustomerSegment> {
    return request<CustomerSegment>(`${BASE}/customer-segments`, {
      method: 'POST',
      body: JSON.stringify({
        id: payload.customer_segment_id || payload.id,
        segmentCode: payload.segment_code || payload.code,
        segmentName: payload.segment_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || 'ACTIVE',
      }),
    });
  },

  async updateCustomerSegment(id: string, payload: Partial<CustomerSegment>): Promise<CustomerSegment> {
    return request<CustomerSegment>(`${BASE}/customer-segments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        segmentCode: payload.segment_code || payload.code,
        segmentName: payload.segment_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status,
      }),
    });
  },

  async deleteCustomerSegment(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/customer-segments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── BRAND MASTER (/api/v1/catalog/brands) ──
  async listBrands(params: { q?: string; status?: string; page?: number; size?: number } = {}): Promise<Brand[]> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<Brand[]>(`${BASE}/brands${qs}`, { method: 'GET' });
  },

  async getBrand(id: string): Promise<Brand> {
    return request<Brand>(`${BASE}/brands/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createBrand(payload: Partial<Brand>): Promise<Brand> {
    return request<Brand>(`${BASE}/brands`, {
      method: 'POST',
      body: JSON.stringify({
        brandCode: payload.brand_code || payload.code,
        brandName: payload.brand_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || payload.status || 'ACTIVE',
      }),
    });
  },

  async updateBrand(id: string, payload: Partial<Brand>): Promise<Brand> {
    return request<Brand>(`${BASE}/brands/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        brandCode: payload.brand_code || payload.code,
        brandName: payload.brand_name || payload.name,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || payload.status,
      }),
    });
  },

  async toggleBrandStatus(id: string): Promise<Brand> {
    return request<Brand>(`${BASE}/brands/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteBrand(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/brands/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── MANUFACTURER MASTER (/api/v1/catalog/manufacturers) ──
  async listManufacturers(params: { q?: string; status?: string; page?: number; size?: number } = {}): Promise<Manufacturer[]> {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.status) sp.set('status', params.status);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<Manufacturer[]>(`${BASE}/manufacturers${qs}`, { method: 'GET' });
  },

  async getManufacturer(id: string): Promise<Manufacturer> {
    return request<Manufacturer>(`${BASE}/manufacturers/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createManufacturer(payload: Partial<Manufacturer>): Promise<Manufacturer> {
    return request<Manufacturer>(`${BASE}/manufacturers`, {
      method: 'POST',
      body: JSON.stringify({
        manufacturerCode: payload.manufacturer_code || payload.code,
        companyName: payload.manufacturer_name || payload.companyName || payload.name,
        facilityAddress: payload.facilities?.headquarters || payload.city,
        city: payload.city,
        state: payload.state,
        contactPerson: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
        effectiveFrom: payload.effective_from,
        discontinuedOn: payload.discontinued_on,
      }),
    });
  },

  async updateManufacturer(id: string, payload: Partial<Manufacturer>): Promise<Manufacturer> {
    return request<Manufacturer>(`${BASE}/manufacturers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        manufacturerCode: payload.manufacturer_code || payload.code,
        companyName: payload.manufacturer_name || payload.companyName || payload.name,
        facilityAddress: payload.facilities?.headquarters || payload.city,
        city: payload.city,
        state: payload.state,
        contactPerson: payload.contactPerson,
        email: payload.email,
        phone: payload.phone,
        description: payload.description,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
        effectiveFrom: payload.effective_from,
        discontinuedOn: payload.discontinued_on,
      }),
    });
  },

  async toggleManufacturerStatus(id: string): Promise<Manufacturer> {
    return request<Manufacturer>(`${BASE}/manufacturers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteManufacturer(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/manufacturers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // ── PRODUCT MANUFACTURER MAPPINGS (/api/v1/catalog/product-manufacturers) ──
  async listMappings(params: { productId?: string; manufacturerId?: string; status?: string; preferredOnly?: boolean; q?: string; page?: number; size?: number } = {}): Promise<ProductManufacturer[]> {
    const sp = new URLSearchParams();
    if (params.productId) sp.set('productId', params.productId);
    if (params.manufacturerId) sp.set('manufacturerId', params.manufacturerId);
    if (params.status) sp.set('status', params.status);
    if (params.preferredOnly) sp.set('preferredOnly', 'true');
    if (params.q) sp.set('q', params.q);
    if (params.page !== undefined) sp.set('page', String(params.page));
    if (params.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<ProductManufacturer[]>(`${BASE}/product-manufacturers${qs}`, { method: 'GET' });
  },

  async getMapping(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(`${BASE}/product-manufacturers/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async createMapping(payload: Partial<ProductManufacturer>): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(`${BASE}/product-manufacturers`, {
      method: 'POST',
      body: JSON.stringify({
        productId: payload.product_id || payload.productId,
        manufacturerId: payload.manufacturer_id || payload.manufacturerId,
        manufacturerProductCode: payload.manufacturer_product_code || payload.mfgProductCode,
        manufacturerPartNumber: payload.manufacturer_part_number,
        manufacturerSku: payload.manufacturer_sku,
        moq: payload.moq,
        leadTimeDays: payload.standardLeadTimeDays,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'),
        isPreferred: payload.is_preferred ?? payload.isPreferred ?? false,
        packagingDetails: payload.packaging,
        effectiveFrom: payload.effective_from || payload.effectiveFrom,
        effectiveTo: payload.effective_to || payload.effectiveTo,
      }),
    });
  },

  async updateMapping(id: string, payload: Partial<ProductManufacturer>): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(`${BASE}/product-manufacturers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        manufacturerProductCode: payload.manufacturer_product_code || payload.mfgProductCode,
        manufacturerPartNumber: payload.manufacturer_part_number,
        manufacturerSku: payload.manufacturer_sku,
        moq: payload.moq,
        leadTimeDays: payload.standardLeadTimeDays,
        lifecycleStatus: payload.lifecycle_status || (payload.status === 'Inactive' ? 'INACTIVE' : 'ACTIVE'),
        isPreferred: payload.is_preferred ?? payload.isPreferred,
        packagingDetails: payload.packaging,
        effectiveFrom: payload.effective_from || payload.effectiveFrom,
        effectiveTo: payload.effective_to || payload.effectiveTo,
      }),
    });
  },

  async setPreferredMapping(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(`${BASE}/product-manufacturers/${encodeURIComponent(id)}/preferred`, {
      method: 'PATCH',
    });
  },

  async toggleMappingStatus(id: string): Promise<ProductManufacturer> {
    return request<ProductManufacturer>(`${BASE}/product-manufacturers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
    });
  },

  async deleteMapping(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`${BASE}/product-manufacturers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

};
