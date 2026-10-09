/**
 * FactoryGrid Real IAM Authentication API Client
 * Connects directly to PostgreSQL-backed Spring Boot IAM Microservice at http://localhost:8081
 */

export interface AuthUser {
  userId: number;
  userCode: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  companyCode?: string;
  department?: string;
  jobTitle?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterBuyerPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  companyCode?: string;
  department?: string;
  jobTitle?: string;
}

export interface RegisterManufacturerPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  companyName?: string;
  companyCode?: string;
  department?: string;
  jobTitle?: string;
  factoryDetails?: string;
}

export interface RegistrationResult {
  userId: number;
  userCode: string;
  username: string;
  email: string;
  fullName: string;
  companyName?: string;
  roles: string[];
  message: string;
}

const API_BASE = import.meta.env.VITE_IAM_API_URL || 'http://localhost:8081';

class AuthApiService {
  /**
   * Real PostgreSQL Authentication Login
   */
  async login(usernameOrEmail: string, password: string, portalType?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password,
          portalType
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || data?.error || (
          response.status === 401 
            ? 'Invalid email/username or password. Please verify your credentials or register.'
            : response.status === 403 
              ? 'Account inactive or unauthorized portal requested.'
              : response.status === 423
                ? 'Account temporarily locked due to failed login attempts. Please contact administrator.'
                : `Login failed (HTTP ${response.status})`
        );
        throw new Error(errorMsg);
      }

      // Backend returns ApiResponse<AuthResponse> or direct AuthResponse
      const authData: AuthResponse = data.data || data;
      if (!authData.accessToken || !authData.user) {
        throw new Error('Malformed response from authentication server.');
      }

      return authData;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error(`Cannot connect to IAM service at ${API_BASE}. Please ensure the backend microservice is running.`);
      }
      throw err;
    }
  }

  /**
   * Register a new Buyer in PostgreSQL with ROLE_BUYER
   */
  async registerBuyer(payload: RegisterBuyerPayload): Promise<RegistrationResult> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register/buyer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = data?.message || (response.status === 409 
          ? 'An account with this email or username already exists. Please login instead.'
          : 'Registration failed. Please check required fields.');
        throw new Error(msg);
      }

      return data.data || data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error(`Cannot connect to IAM service at ${API_BASE}. Please ensure the backend microservice is running.`);
      }
      throw err;
    }
  }

  /**
   * Register a new Manufacturer in PostgreSQL with ROLE_MANUFACTURER & ROLE_SUPPLIER
   */
  async registerManufacturer(payload: RegisterManufacturerPayload): Promise<RegistrationResult> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/register/manufacturer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = data?.message || (response.status === 409 
          ? 'An account with this email or username already exists. Please login instead.'
          : 'Registration failed. Please check required fields.');
        throw new Error(msg);
      }

      return data.data || data;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error(`Cannot connect to IAM service at ${API_BASE}. Please ensure the backend microservice is running.`);
      }
      throw err;
    }
  }

  /**
   * Fetch real authenticated user profile from /api/v1/auth/me
   */
  async getMe(accessToken: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Session expired or unauthorized (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.data || data;
  }

  /**
   * Logout and revoke refresh token in PostgreSQL
   */
  async logout(refreshToken?: string, accessToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch {
      // Ignore network failures on logout
    }
  }
}

export const authApi = new AuthApiService();
