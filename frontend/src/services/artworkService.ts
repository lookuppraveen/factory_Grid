/**
 * FactoryGrid Artwork Management API Service
 * Connects directly to backend PostgreSQL and StorageService endpoints under /api/v1/buyer/orders.
 * Zero mock data, real database persistence.
 */

export interface OrderArtwork {
  id: string;
  masterOrderId: string;
  subOrderId: string | null;
  productId: string;
  productName: string | null;
  submissionType: 'UPLOAD' | 'EXTERNAL_LINK' | 'IN_HOUSE_REQUEST';
  fileName: string | null;
  fileType: string | null;
  fileSize: string | null;
  fileUrl: string | null;
  externalUrl: string | null;
  instructions: string | null;
  status: 'PENDING_UPLOAD' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IN_HOUSE_REQUESTED';
  reviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MasterOrderArtworkSummary {
  masterOrderId: string;
  totalProducts: number;
  completedProducts: number;
  isFullyCompleted: boolean;
  artworks: OrderArtwork[];
}

export class ArtworkApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ArtworkApiError';
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

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const newToken = data.token || data.accessToken || data.jwt;
    if (newToken) {
      localStorage.setItem('fg_auth_token', newToken);
      return newToken;
    }
  } catch {
    // refresh failed
  }
  return null;
}

async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAuthToken();

  const makeHeaders = (authToken: string | null) => {
    const h = new Headers(options.headers || {});
    if (authToken && !h.has('Authorization')) {
      h.set('Authorization', `Bearer ${authToken}`);
    }
    return h;
  };

  let res = await fetch(url, { ...options, headers: makeHeaders(token) });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await fetch(url, { ...options, headers: makeHeaders(newToken) });
    }
  }

  return res;
}

/**
 * Fetch all artwork records and product completion summary for a master order
 */
export async function getMasterOrderArtworks(masterOrderId: string): Promise<MasterOrderArtworkSummary> {
  if (!masterOrderId) {
    throw new ArtworkApiError('Master Order ID is required.', 400);
  }

  const res = await authenticatedFetch(`${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork`);

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to load artworks (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Fetch artwork records for a specific product in a master order
 */
export async function getProductArtworks(masterOrderId: string, productId: string): Promise<OrderArtwork[]> {
  if (!masterOrderId || !productId) {
    throw new ArtworkApiError('Master Order ID and Product ID are required.', 400);
  }

  const res = await authenticatedFetch(
    `${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork/${encodeURIComponent(productId)}`,
  );

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to load product artwork (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Upload one or more artwork files for a product
 */
export async function uploadArtworkFiles(
  masterOrderId: string,
  productId: string,
  files: File[],
  metadata?: { subOrderId?: string; productName?: string },
): Promise<OrderArtwork[]> {
  if (!masterOrderId || !productId) {
    throw new ArtworkApiError('Master Order ID and Product ID are required.', 400);
  }
  if (!files || files.length === 0) {
    throw new ArtworkApiError('At least one artwork file is required.', 400);
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append('file', file, file.name);
  }

  if (metadata?.subOrderId) {
    formData.append('subOrderId', metadata.subOrderId);
  }
  if (metadata?.productName) {
    formData.append('productName', metadata.productName);
  }

  const res = await authenticatedFetch(
    `${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork/${encodeURIComponent(productId)}/files`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Upload failed (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Submit external artwork repository link (Drive, Dropbox, OneDrive, etc.)
 */
export async function submitArtworkLink(
  masterOrderId: string,
  productId: string,
  artworkUrl: string,
  metadata?: { subOrderId?: string; productName?: string },
): Promise<OrderArtwork> {
  if (!masterOrderId || !productId) {
    throw new ArtworkApiError('Master Order ID and Product ID are required.', 400);
  }
  if (!artworkUrl || !artworkUrl.trim()) {
    throw new ArtworkApiError('Artwork URL is required.', 400);
  }

  const res = await authenticatedFetch(
    `${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork/${encodeURIComponent(productId)}/links`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artworkUrl: artworkUrl.trim(),
        subOrderId: metadata?.subOrderId,
        productName: metadata?.productName,
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to submit artwork link (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Submit an in-house packaging artwork design request
 */
export async function requestInHouseArtwork(
  masterOrderId: string,
  productId: string,
  notes?: string,
  metadata?: { subOrderId?: string; productName?: string },
): Promise<OrderArtwork> {
  if (!masterOrderId || !productId) {
    throw new ArtworkApiError('Master Order ID and Product ID are required.', 400);
  }

  const res = await authenticatedFetch(
    `${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork/${encodeURIComponent(productId)}/in-house-request`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: notes || 'In-house packaging design team assistance requested.',
        subOrderId: metadata?.subOrderId,
        productName: metadata?.productName,
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to submit in-house artwork request (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Delete an artwork record and its stored file
 */
export async function deleteArtwork(masterOrderId: string, artworkId: string): Promise<{ success: boolean; message: string }> {
  if (!masterOrderId || !artworkId) {
    throw new ArtworkApiError('Master Order ID and Artwork ID are required.', 400);
  }

  const res = await authenticatedFetch(
    `${API_BASE}/buyer/orders/${encodeURIComponent(masterOrderId)}/artwork/${encodeURIComponent(artworkId)}`,
    {
      method: 'DELETE',
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    let msg = `Failed to delete artwork (HTTP ${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new ArtworkApiError(msg, res.status);
  }

  return res.json();
}

/**
 * Get direct download / view URL for artwork file
 */
export function getArtworkFileUrl(artworkId: string): string {
  return `${API_BASE}/buyer/orders/artwork/files/${artworkId}`;
}
