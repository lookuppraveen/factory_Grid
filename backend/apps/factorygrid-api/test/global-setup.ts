import { execSync } from 'node:child_process';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

/** Starts a throwaway PostgreSQL 17, applies the Prisma migrations and points the app at it. */
export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  (globalThis as { __PG__?: unknown }).__PG__ = container;

  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-for-hs512-signing-0123456789';
  process.env.JWT_EXPIRATION_MS = '3600000';
  process.env.JWT_REFRESH_EXPIRATION_MS = '86400000';
  process.env.THROTTLE_DISABLED = 'true';

  execSync('pnpm exec prisma migrate deploy', { stdio: 'ignore', env: process.env });
}
