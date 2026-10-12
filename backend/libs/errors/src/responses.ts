/** Standard success envelope, same shape the Java IAM service returned. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

/** Standard error body for every non-2xx response. */
export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  /** Field-level messages, present only on validation failures. */
  errors?: Record<string, string>;
}

export function ok<T>(message: string, data: T | null = null): ApiResponse<T> {
  return { success: true, message, data, timestamp: new Date().toISOString() };
}
