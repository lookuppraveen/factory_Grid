# ==============================================================================
# FactoryGrid Backend Production Container
# Multi-stage build with Node.js 24, pnpm, Prisma ORM, and PostgreSQL client
# ==============================================================================

FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm and build essentials
RUN npm install -g pnpm@9.15.9

# Copy root workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json tsconfig.base.json ./

# Copy backend source and contracts
COPY backend/ ./backend/
COPY contracts/ ./contracts/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client and build factorygrid-api
WORKDIR /app/backend/apps/factorygrid-api
RUN npx prisma generate
RUN pnpm --filter "factorygrid-api..." build

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8081
ENV SERVER_PORT=8081

RUN npm install -g pnpm@9.15.9

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml nx.json tsconfig.base.json ./
COPY backend/libs/ ./backend/libs/
COPY contracts/ ./contracts/

# Copy built backend application
COPY --from=builder /app/backend/libs/auth/dist ./backend/libs/auth/dist
COPY --from=builder /app/backend/libs/errors/dist ./backend/libs/errors/dist
COPY --from=builder /app/backend/apps/factorygrid-api/dist ./backend/apps/factorygrid-api/dist
COPY --from=builder /app/backend/apps/factorygrid-api/prisma ./backend/apps/factorygrid-api/prisma
COPY --from=builder /app/backend/apps/factorygrid-api/src/generated ./backend/apps/factorygrid-api/src/generated
COPY --from=builder /app/backend/apps/factorygrid-api/package.json ./backend/apps/factorygrid-api/package.json
COPY --from=builder /app/backend/apps/factorygrid-api/prisma.config.ts ./backend/apps/factorygrid-api/prisma.config.ts

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod --config.node-linker=hoisted

# Entrypoint startup script: applies migrations, bootstraps admin, starts server
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e

echo "=== Starting FactoryGrid Backend ==="
cd /app/backend/apps/factorygrid-api

echo "1. Applying database migrations..."
npx prisma migrate deploy

echo "2. Bootstrapping platform admin credentials..."
node dist/scripts/bootstrap-admin.js || echo "Admin already initialized"

echo "3. Starting FactoryGrid Fastify NestJS server on port ${PORT:-8081}..."
exec node dist/main.js
EOF

RUN chmod +x /app/entrypoint.sh

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-8081}/actuator/health || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]

