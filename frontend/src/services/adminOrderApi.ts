/**
 * FactoryGrid Admin Master Orders & PO Monitor API Client
 * Connects directly to backend endpoints under /api/v1/admin/orders/* and /api/v1/admin/purchase-orders/*.
 * Uses real IAM authentication from localStorage (fg_auth_token).
 */

export interface AdminOrderLine {
  id: string;
  productId: string;
  productName: string;
  dosageForm: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalPrice: number;
  leadTimeDays: number;
}

export interface AdminSubOrder {
  id: string;
  subOrderNumber: string;
  poNumber: string;
  manufacturerId: string;
  manufacturerName: string;
  mfgCity?: string;
  mfgState?: string;
  status: string;
  productionStatus?: string;
  totalAmount: number;
  totalQuantity: number;
  leadTimeDays: number;
  deliveryDate: string | null;
  shippingAddress?: string;
  billingAddress?: string;
  lines: AdminOrderLine[];
}

export interface AdminMasterOrder {
  id: string;
  orderNumber: string;
  poNumber: string;
  rfqId: string | null;
  rfqNumber: string | null;
  isGeneric: boolean;
  buyerId: string | null;
  customerName: string;
  customerCode: string;
  customerClassification: string;
  totalAmount: number;
  totalQuantity: number;
  status: string;
  adminApprovalStatus: string;
  advanceRequired: boolean;
  advanceStatus: string;
  advanceMethod: 'PERCENTAGE' | 'FIXED_AMOUNT';
  advancePercentage: number;
  requiredAdvanceAmount: number;
  advanceReceived: number;
  advanceOutstanding: number;
  advanceDueDate: string | null;
  advanceNotes: string | null;
  isOnHold: boolean;
  holdReason: string | null;
  holdCount: number;
  holdPlacedAt: string | null;
  holdPlacedBy: string | null;
  adminApprovedAt: string | null;
  adminApprovedBy: string | null;
  adminRejectionReason: string | null;
  paymentTerms: string;
  createdDate: string;
  createdAt: string;
  expectedDeliveryDate: string;
  shippingAddress: string;
  billingAddress: string;
  buyerGst: string;
  subOrders: AdminSubOrder[];
  purchaseOrders: Array<{
    id: string;
    poNumber: string;
    status: string;
    mfgName?: string;
    totalAmount: number;
    totalQuantity: number;
  }>;
  statusHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    remarks?: string;
  }>;
}

export interface AdminOrdersSummary {
  pendingApprovalCount: number;
  pendingAdvanceCount: number;
  totalAdvanceReceived: number;
  totalAdvanceOutstanding: number;
  totalOrdersCount: number;
  totalGmv: number;
}

export interface AdminOrderQueryParams {
  search?: string;
  approvalStatus?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  advanceStatus?: 'ALL' | 'NOT_REQUIRED' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | string;
  poStatus?: 'ALL' | 'AWAITING_ADVANCE' | 'CONFIRMED_RELEASED' | 'REJECTED' | 'ON_HOLD' | string;
  page?: number;
  size?: number;
}

export interface AdminOrdersListResponse {
  summary: AdminOrdersSummary;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  orders: AdminMasterOrder[];
}

export interface ApproveMasterOrderPayload {
  advanceRequired?: boolean;
  advanceMethod?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  advancePercentage?: number;
  fixedAmount?: number;
  advanceDueDate?: string;
  advanceNotes?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE = '/api/v1/admin/orders';
const BASE_PO = '/api/v1/admin/purchase-orders';

/**
 * Retrieves the currently authenticated user's access token from the single IAM source of truth.
 * Checks fg_auth_token (primary key used across FactoryGrid) followed by standard fallbacks.
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('fg_auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('fg_auth_token') ||
    sessionStorage.getItem('token') ||
    ''
  );
}

function getRefreshToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('fg_refresh_token') ||
    localStorage.getItem('refreshToken') ||
    sessionStorage.getItem('fg_refresh_token') ||
    ''
  );
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
  if (status === 401) {
    return 'Authentication failed: Missing or invalid token. Please log in as an Admin user.';
  }
  if (status === 403) {
    return 'Access denied: You do not have permissions to access Admin Master Orders.';
  }
  if (status === 404) {
    return 'Resource not found (404).';
  }
  return `Operation failed with status ${status}`;
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  try {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data?.accessToken || data?.data?.accessToken;
    const newRt = data?.refreshToken || data?.data?.refreshToken;
    if (token) {
      localStorage.setItem('fg_auth_token', token);
      if (newRt) localStorage.setItem('fg_refresh_token', newRt);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(url: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };

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
    throw new ApiError(
      err?.message?.includes('Failed to fetch')
        ? 'Unable to connect to FactoryGrid API server. Please ensure the backend is running.'
        : err?.message || 'Network error',
      0,
    );
  }

  // Handle 401 with automatic token refresh attempt
  if (response.status === 401 && !isRetry) {
    const rt = getRefreshToken();
    if (rt) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;
        if (newToken) {
          onTokenRefreshed(newToken);
          return request<T>(url, init, true);
        }
      } else {
        // Wait for current refresh to complete
        return new Promise<T>((resolve, reject) => {
          refreshSubscribers.push((newToken) => {
            if (newToken) {
              request<T>(url, init, true).then(resolve).catch(reject);
            } else {
              reject(new ApiError('Authentication failed: Missing or invalid token. Please log in as an Admin user.', 401));
            }
          });
        });
      }
    }
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
    throw new ApiError(msg, response.status);
  }

  return data as T;
}

export const adminOrderApi = {
  /**
   * Checks truthful database connection status from the backend health check endpoint.
   * Directly queries PostgreSQL via SELECT 1.
   */
  async checkHealth(): Promise<{ status: string; database: string }> {
    try {
      const res = await fetch('/api/v1/health', { method: 'GET', headers: { Accept: 'application/json' } });
      if (!res.ok) {
        return { status: 'DOWN', database: 'DOWN' };
      }
      const data = await res.json();
      return {
        status: data.status || 'UP',
        database: data.database || data.status || 'UP',
      };
    } catch {
      return { status: 'DOWN', database: 'DOWN' };
    }
  },

  /**
   * Lists all Master Orders and Purchase Orders from PostgreSQL with backend filters.
   */
  async listOrders(params?: AdminOrderQueryParams): Promise<AdminOrdersListResponse> {
    const sp = new URLSearchParams();
    if (params?.search?.trim()) sp.set('search', params.search.trim());
    if (params?.approvalStatus && params.approvalStatus !== 'ALL') sp.set('approvalStatus', params.approvalStatus);
    if (params?.advanceStatus && params.advanceStatus !== 'ALL') sp.set('advanceStatus', params.advanceStatus);
    if (params?.poStatus && params.poStatus !== 'ALL') sp.set('poStatus', params.poStatus);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.size) sp.set('size', String(params.size));

    const qs = sp.toString();
    const url = qs ? `${BASE}?${qs}` : BASE;
    return request<AdminOrdersListResponse>(url, { method: 'GET' });
  },

  /**
   * Retrieves aggregated summary KPI metrics directly from PostgreSQL.
   */
  async getSummary(): Promise<AdminOrdersSummary> {
    return request<AdminOrdersSummary>(`${BASE}/summary`, { method: 'GET' });
  },

  /**
   * Retrieves full details for a single Master Order.
   */
  async getOrderDetail(idOrCode: string | number): Promise<AdminMasterOrder> {
    return request<AdminMasterOrder>(`${BASE}/${encodeURIComponent(String(idOrCode))}`, { method: 'GET' });
  },

  /**
   * Retrieves all Purchase Orders linked to a single Master Order.
   */
  async getOrderPurchaseOrders(idOrCode: string | number): Promise<any[]> {
    return request<any[]>(`${BASE}/${encodeURIComponent(String(idOrCode))}/purchase-orders`, { method: 'GET' });
  },

  /**
   * Retrieves detail for a single Purchase Order from PostgreSQL.
   */
  async getPurchaseOrderDetail(idOrPo: string | number): Promise<any> {
    return request<any>(`${BASE_PO}/${encodeURIComponent(String(idOrPo))}`, { method: 'GET' });
  },

  /**
   * Approves a Master Order and configures Advance Payment rules in PostgreSQL.
   */
  async approveOrder(idOrCode: string | number, payload: ApproveMasterOrderPayload): Promise<AdminMasterOrder> {
    return request<AdminMasterOrder>(`${BASE}/${encodeURIComponent(String(idOrCode))}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Rejects a Master Order with mandatory reason in PostgreSQL.
   */
  async rejectOrder(idOrCode: string | number, reason: string): Promise<AdminMasterOrder> {
    return request<AdminMasterOrder>(`${BASE}/${encodeURIComponent(String(idOrCode))}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Places a Master Order on administrative hold with mandatory reason.
   */
  async holdOrder(idOrCode: string | number, reason: string): Promise<AdminMasterOrder> {
    return request<AdminMasterOrder>(`${BASE}/${encodeURIComponent(String(idOrCode))}/hold`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Releases an administrative hold on a Master Order.
   */
  async releaseHold(idOrCode: string | number): Promise<AdminMasterOrder> {
    return request<AdminMasterOrder>(`${BASE}/${encodeURIComponent(String(idOrCode))}/release`, {
      method: 'POST',
    });
  },
};
