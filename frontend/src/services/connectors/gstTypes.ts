export type GSTEnvironment = 'SANDBOX' | 'PRODUCTION';

export interface EnvGSTCredentials {
  apiKey: string;
  apiSecret: string;
  clientCode?: string;
  isConnected?: boolean;
  connectedAt?: string;
}

export interface GSTCredentials {
  apiKey: string;
  apiSecret: string;
  clientCode?: string;
  environment: GSTEnvironment;
  isConnected?: boolean;
  connectedAt?: string;
  sandboxConfig?: EnvGSTCredentials;
  productionConfig?: EnvGSTCredentials;
}

export interface GSTVerificationResult {
  success: boolean;
  legalName: string;
  tradeName: string;
  gstin: string;
  pan: string;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
  constitutionOfBusiness: string;
  taxpayerType: string;
  registrationDate: string;
  principalAddress: string;
  panMatchedWithGstin: boolean;
  verificationBadge: 'VERIFIED' | 'MANUAL_REVIEW' | 'FAILED';
  errorMessage?: string;
}

export interface GSTVerificationProvider {
  id: string;
  name: string;
  description: string;
  testConnection(creds: GSTCredentials): Promise<{ success: boolean; message: string }>;
  verifyGSTIN(creds: GSTCredentials, gstin: string, panToMatch?: string): Promise<GSTVerificationResult>;
}
