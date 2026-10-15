import { jwtAlgorithmFor } from '@factorygrid/auth';

/** Typed, validated environment. The app refuses to start if a required value is missing. */
export interface Env {
  PORT: number;
  DATABASE_URL: string;
  CORS_ALLOWED_ORIGINS: string[];
  JWT_SECRET: string;
  JWT_EXPIRATION_MS: number;
  JWT_REFRESH_EXPIRATION_MS: number;
  THROTTLE_DISABLED: boolean;
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  S3_FORCE_PATH_STYLE: boolean;
}

function required(raw: Record<string, unknown>, key: string): string {
  const value = raw[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Environment variable ${key} is required.`);
  }
  return value;
}

function positiveInt(raw: Record<string, unknown>, key: string, fallback: number): number {
  const value = raw[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }
  return parsed;
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const jwtSecret = required(raw, 'JWT_SECRET');
  jwtAlgorithmFor(jwtSecret); // throws if shorter than 32 characters

  return {
    PORT: positiveInt(raw, 'PORT', 8081),
    DATABASE_URL: required(raw, 'DATABASE_URL'),
    CORS_ALLOWED_ORIGINS: String(raw.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRATION_MS: positiveInt(raw, 'JWT_EXPIRATION_MS', 86_400_000),
    JWT_REFRESH_EXPIRATION_MS: positiveInt(raw, 'JWT_REFRESH_EXPIRATION_MS', 604_800_000),
    THROTTLE_DISABLED: raw.THROTTLE_DISABLED === 'true',
    S3_ENDPOINT: String(raw.S3_ENDPOINT ?? 'http://127.0.0.1:9010'),
    S3_REGION: String(raw.S3_REGION ?? 'us-east-1'),
    S3_ACCESS_KEY_ID: String(raw.S3_ACCESS_KEY_ID ?? 'factorygrid'),
    S3_SECRET_ACCESS_KEY: String(raw.S3_SECRET_ACCESS_KEY ?? 'factorygrid-dev'),
    S3_BUCKET: String(raw.S3_BUCKET ?? 'factorygrid-documents'),
    S3_FORCE_PATH_STYLE: raw.S3_FORCE_PATH_STYLE !== 'false',
  };
}
