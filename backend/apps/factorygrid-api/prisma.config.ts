import { defineConfig } from 'prisma/config';

// Load .env for local CLI use; in CI and production the variables are set directly.
try {
  process.loadEnvFile('.env');
} catch {
  // no .env file
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
