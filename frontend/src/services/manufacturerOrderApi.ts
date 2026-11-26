/**
 * FactoryGrid Manufacturer Order Management API Client
 * Connects directly to real backend PostgreSQL endpoints under /api/v1/manufacturer/orders/* and /api/v1/manufacturer/purchase-orders/*.
 */

export interface ManufacturerOrderLineItem {
  id: string;
  productId: string;
  name: string;
  productName: string;
  dosageForm: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  lineTotal: number;
  leadTime: string;
}

export interface ManufacturerOrderItem {
  id: string;
  orderNumber: string;
  subOrderNumber: string;
  masterOrderNumber: string;
  purchaseOrderNumber: string;
  poId: string | null;
  poNumber: string;
  mfgId: string;
  mfgName: string;
  customer: {
    id: string;
    name: string;
    code?: string;
    classification?: string;
  };
  customerName: string;
  orderDate: string;
  deliverySchedule: string;
  deliveryDate: string;
  shippingAddress: string;
  billingAddress: string;
  buyerGst: string;
  mfgGst: string;
  sourceQuoteRef: string;
  products: ManufacturerOrderLineItem[];
  lines: ManufacturerOrderLineItem[];
  productsCount: number;
  totalQuantity: number;
  orderValue: number;
  leadTimeDays: number;
  status: string; // Effective status: 'Awaiting Acceptance' | 'Accepted' | 'Artwork Pending' | 'Scheduled' | 'In Production' | 'Quality & Packaging' | 'Ready to Dispatch' | 'Completed' | 'Rejected'
  rawStatus: string;
  productionStatus?: string | null;
  rejectionReason?: string | null;
  rejectionRemarks?: string | null;
  acceptedAt?: string | null;
  advanceRequired: boolean;
  advanceOutstanding: number;
  statusHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    remarks?: string;
  }>;
}

export interface ManufacturerOrderMetrics {
  open: number;
  awaiting: number;
  accepted: number;
  artwork: number;
  scheduled: number;
  inProd: number;
  qcPack: number;
  ready: number;
  completed: number;
  rejected: number;
  total: number;
}

export interface ManufacturerOrderListResponse {
  manufacturer: {
    id: string;
    registrationCode: string;
    companyName: string;
  };
  metrics: ManufacturerOrderMetrics;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  orders: ManufacturerOrderItem[];
}

export interface PurchaseOrderLineDetail {
  id: string;
  productId: string;
  productName: string;
  dosageForm: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrderDetailResponse {
  id: string;
  poNumber: string;
  subOrderNumber: string;
  subOrderId: string;
  masterOrderNumber: string;
  masterOrderId: string;
  customerName: string;
  buyerGst: string;
  mfgName: string;
  mfgGst: string;
  sourceQuoteRef: string;
  orderDate: string;
  deliverySchedule: string;
  shippingAddress: string;
  billingAddress: string;
  status: string;
  subOrderStatus: string;
  totalQuantity: number;
  subtotal: number;
  orderValue: number;
  totalAmount: number;
  advanceRequired: boolean;
  advanceOutstanding: number;
  lines: PurchaseOrderLineDetail[];
}

export interface ManufacturerOrderQueryParams {
  status?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';
const BASE_ORDERS = `${API_BASE}/api/v1/manufacturer/orders`;
const BASE_PO = `${API_BASE}/api/v1/manufacturer/purchase-orders`;

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
    ...((init.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type to application/json when a request body is actually provided.
  // Body-less requests (such as GET or body-less POST) must NOT send Content-Type: application/json.
  if (init.body !== undefined && init.body !== null && init.body !== '') {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: 'omit', headers });
  } catch (err: any) {
    throw new Error(
      err?.message?.includes('Failed to fetch')
        ? 'Unable to connect to FactoryGrid API server. Please ensure the backend is running.'
        : err?.message || 'Network error',
    );
  }

  let data: any;
  const text = await response.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const msg = extractErrorMessage(data, response.status);
    throw new Error(msg);
  }

  return data as T;
}

export const manufacturerOrderApi = {
  /**
   * Lists orders assigned to the logged-in manufacturer from PostgreSQL.
   */
  async listOrders(params?: ManufacturerOrderQueryParams): Promise<ManufacturerOrderListResponse> {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.search?.trim()) sp.set('search', params.search.trim());
    if (params?.page) sp.set('page', String(params.page));
    if (params?.size) sp.set('size', String(params.size));
    if (params?.sort) sp.set('sort', params.sort);

    const qs = sp.toString();
    const url = qs ? `${BASE_ORDERS}?${qs}` : BASE_ORDERS;
    return request<ManufacturerOrderListResponse>(url, { method: 'GET' });
  },

  /**
   * Retrieves complete order detail by sub-order ID or code.
   */
  async getOrderDetail(orderId: string | number): Promise<ManufacturerOrderItem> {
    return request<ManufacturerOrderItem>(`${BASE_ORDERS}/${encodeURIComponent(String(orderId))}`, { method: 'GET' });
  },

  /**
   * Accepts a purchase order and releases it to manufacturing.
   */
  async acceptOrder(orderId: string | number): Promise<ManufacturerOrderItem> {
    return request<ManufacturerOrderItem>(`${BASE_ORDERS}/${encodeURIComponent(String(orderId))}/accept`, {
      method: 'POST',
    });
  },

  /**
   * Rejects a purchase order with reason and remarks.
   */
  async rejectOrder(orderId: string | number, rejectionReason: string, rejectionRemarks?: string): Promise<ManufacturerOrderItem> {
    return request<ManufacturerOrderItem>(`${BASE_ORDERS}/${encodeURIComponent(String(orderId))}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, rejectionRemarks }),
    });
  },

  /**
   * Updates manufacturing workflow status (SCHEDULED, IN_PRODUCTION, QUALITY_PACKAGING, READY_TO_DISPATCH, COMPLETED).
   */
  async updateOrderStatus(orderId: string | number, status: string, remarks?: string): Promise<ManufacturerOrderItem> {
    return request<ManufacturerOrderItem>(`${BASE_ORDERS}/${encodeURIComponent(String(orderId))}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    });
  },

  /**
   * Retrieves an authentic B2B Purchase Order document from PostgreSQL.
   */
  async getPurchaseOrder(poId: string | number): Promise<PurchaseOrderDetailResponse> {
    return request<PurchaseOrderDetailResponse>(`${BASE_PO}/${encodeURIComponent(String(poId))}`, { method: 'GET' });
  },
};
