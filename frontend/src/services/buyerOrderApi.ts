/**
 * FactoryGrid Buyer Order Management API Client
 * Connects directly to real backend PostgreSQL endpoints under /api/v1/buyer/orders.
 * Zero mock data, zero fallback arrays. The database is the single source of truth.
 */

export interface BuyerOrderLine {
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

export interface BuyerSubOrder {
  id: string;
  subOrderNumber: string;
  masterOrderId: string;
  masterOrderNumber: string;
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
  deliveryDate?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  lines: BuyerOrderLine[];
}

export interface BuyerPurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  mfgName: string;
  totalAmount: number;
  totalQuantity: number;
}

export interface BuyerMasterOrder {
  id: string;
  orderNumber: string;
  poNumber: string;
  rfqId?: string | null;
  rfqNumber?: string | null;
  quoteId?: string | null;
  quoteReference?: string | null;
  isGeneric: boolean;
  buyerId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerCode: string;
  customerClassification: string;
  totalAmount: number;
  totalQuantity: number;
  status: string;
  adminApprovalStatus: string;
  advanceRequired: boolean;
  advanceStatus: string;
  advanceMethod: string;
  advancePercentage: number;
  requiredAdvanceAmount: number;
  advanceReceived: number;
  advanceOutstanding: number;
  advanceDueDate?: string | null;
  advanceNotes?: string | null;
  isOnHold: boolean;
  holdReason?: string | null;
  holdCount: number;
  holdPlacedAt?: string | null;
  holdPlacedBy?: string | null;
  adminApprovedAt?: string | null;
  adminApprovedBy?: string | null;
  paymentTerms?: string | null;
  createdDate: string;
  createdAt: string;
  expectedDeliveryDate?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  buyerGst?: string | null;
  remarks?: string | null;
  subOrders: BuyerSubOrder[];
  purchaseOrders: BuyerPurchaseOrder[];
  lines: BuyerOrderLine[];
  statusHistory?: Array<{
    id: string;
    previousStatus: string;
    newStatus: string;
    changedBy: string;
    changedAt: string;
    remarks?: string;
  }>;
}

export interface BuyerOrderSummary {
  totalOrdersCount: number;
  pendingApprovalCount: number;
  pendingAdvanceCount: number;
  confirmedCount: number;
  inProcessCount: number;
  completedCount: number;
  onHoldCount: number;
  totalGmv: number;
}

export interface BuyerOrderListResponse {
  summary: BuyerOrderSummary;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  orders: BuyerMasterOrder[];
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('fg_auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('fg_auth_token') ||
    sessionStorage.getItem('token')
  );
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('fg_refresh_token') ||
    localStorage.getItem('refreshToken') ||
    sessionStorage.getItem('fg_refresh_token')
  );
}

const API_BASE = '/api/v1';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newToken = data.accessToken || data.token;
      if (newToken) {
        localStorage.setItem('fg_auth_token', newToken);
        if (data.refreshToken) {
          localStorage.setItem('fg_refresh_token', data.refreshToken);
        }
        return newToken;
      }
    }
  } catch {
    // Refresh failed
  }
  return null;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  let response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized with token refresh retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${refreshed}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
      if (Array.isArray(errorMsg)) errorMsg = errorMsg.join(', ');
    } catch {
      // Text response or empty
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response.json();
}

export const buyerOrderApi = {
  /**
   * Retrieves master orders for the authenticated buyer from PostgreSQL.
   */
  async listBuyerOrders(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<BuyerOrderListResponse> {
    const query = new URLSearchParams();
    if (params?.search?.trim()) query.set('search', params.search.trim());
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/buyer/orders${qs ? `?${qs}` : ''}`;
    return apiFetch<BuyerOrderListResponse>(endpoint);
  },

  /**
   * Retrieves complete details of a single master order by ID or order number.
   */
  async getBuyerOrderDetail(idOrCode: string): Promise<BuyerMasterOrder> {
    return apiFetch<BuyerMasterOrder>(`/buyer/orders/${encodeURIComponent(idOrCode)}`);
  },

  /**
   * Retrieves all purchase orders associated with a master order.
   */
  async getBuyerOrderPurchaseOrders(idOrCode: string): Promise<BuyerPurchaseOrder[]> {
    return apiFetch<BuyerPurchaseOrder[]>(`/buyer/orders/${encodeURIComponent(idOrCode)}/purchase-orders`);
  },
};
