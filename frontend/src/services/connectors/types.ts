export type EnvironmentType = 'SANDBOX' | 'PRODUCTION';

export interface EnvCredentials {
  customerCode: string;
  consumerKey: string;
  consumerSecret: string;
  isConnected?: boolean;
  connectedAt?: string;
}

export interface ShipmentCredentials {
  customerCode: string;
  consumerKey: string;
  consumerSecret: string;
  loginId?: string;
  areaCode?: string;
  environment: EnvironmentType;
  isConnected?: boolean;
  connectedAt?: string;
  sandboxConfig?: EnvCredentials;
  productionConfig?: EnvCredentials;
}

export interface WaybillRequest {
  orderId: string;
  subOrderId: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeEmail?: string;
  shippingAddress: string;
  pincode: string;
  city: string;
  state: string;
  weightKg: number;
  pieceCount: number;
  productType?: string;
  declaredValue: number;
}

export interface WaybillResult {
  success: boolean;
  awbNumber: string;
  pickupRefNumber: string;
  courierName: string;
  estimatedDeliveryDate: string;
  labelPdfUrl?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface TrackingCheckpoint {
  time: string;
  location: string;
  status: string;
  remarks: string;
}

export interface TrackingResult {
  awbNumber: string;
  status: 'SHIPMENT_CREATED' | 'PICKUP_REGISTERED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED';
  currentLocation: string;
  lastUpdated: string;
  checkpoints: TrackingCheckpoint[];
  errorMessage?: string;
}

export interface ShipmentProvider {
  id: string;
  name: string;
  capabilities: string[];
  testConnection(creds: ShipmentCredentials): Promise<{ success: boolean; message: string }>;
  generateWaybill(creds: ShipmentCredentials, req: WaybillRequest): Promise<WaybillResult>;
  trackShipment(creds: ShipmentCredentials, awbNumber: string): Promise<TrackingResult>;
  checkServiceability(creds: ShipmentCredentials, pincode: string): Promise<{ serviceable: boolean; message: string }>;
}
