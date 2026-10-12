# FactoryGrid Backend

Node.js 24 + TypeScript, NestJS 12 on Fastify, PostgreSQL 17 through Prisma 7. Shipped as one app,
`factorygrid-api`, made of modules that keep the plan's service boundaries, so a module can move into its
own service later with little change.

```text
backend/
├── apps/factorygrid-api/
│   ├── prisma/
│   │   ├── schema.prisma         database schema
│   │   └── migrations/           versioned SQL migrations (0_init = the original IAM schema)
│   ├── prisma.config.ts          Prisma CLI config (reads DATABASE_URL)
│   ├── src/
│   │   ├── main.ts               starts the server, serves Swagger at /docs
│   │   ├── bootstrap.ts          app factory shared by main, tests and the OpenAPI export
│   │   ├── app.module.ts         config, JWT, rate limits, global guards, modules
│   │   ├── config/env.ts         typed, validated environment
│   │   ├── health/               GET /health (app + database)
│   │   ├── prisma/               PrismaService
│   │   ├── modules/iam/          registration, login, refresh, logout, /me, admin user list
│   │   └── scripts/              export-openapi, bootstrap-admin
│   └── test/                     Jest + Supertest integration tests (Testcontainers PostgreSQL)
└── libs/
    ├── auth/                     JwtAuthGuard, RolesGuard, @Public, @Roles, @CurrentUser
    ├── errors/                   ApiResponse / ErrorResponse, exception filter, validation pipe
    └── contracts/                @factorygrid/contracts (generated types)
```

## Conventions

- Every route needs a valid bearer token unless it is marked `@Public()`. Add `@Roles('ADMIN')` (role names
  without the `ROLE_` prefix) to restrict it further.
- Success bodies use `ok(message, data)` from `@factorygrid/errors`; errors always come back as
  `{ status, error, message, timestamp, path, errors? }`. Throw the exceptions from `@factorygrid/errors`
  (`ConflictException`, `NotFoundException`, ...) instead of building responses by hand.
- DTO classes live in `*.dto.ts` files. The NestJS Swagger plugin reads their types and doc comments, so the
  OpenAPI contract stays complete without extra decorators.
- Database changes only through Prisma migrations: edit `schema.prisma`, then
  `pnpm --filter factorygrid-api db:migrate:dev --name <change>`. Never edit a migration that has run in
  staging.
- Each new business module (partner, catalog, sourcing, ...) goes in `src/modules/<name>/` and is imported in
  `app.module.ts`. It talks to other modules only through their exported services or events, never their
  tables.

## Environment

See [apps/factorygrid-api/.env.example](apps/factorygrid-api/.env.example). The app refuses to start without
`DATABASE_URL` and a `JWT_SECRET` of at least 32 characters.

## Commands (from the repo root)

```powershell
pnpm --filter factorygrid-api dev            # watch mode on http://localhost:8081
pnpm --filter factorygrid-api test           # integration tests (Docker must be running)
pnpm --filter factorygrid-api db:migrate     # apply migrations to DATABASE_URL
pnpm --filter factorygrid-api openapi:export # rewrite contracts/factorygrid-api.yaml (after a build)
pnpm --filter factorygrid-api db:seed-admin  # create the first admin from BOOTSTRAP_ADMIN_* (after a build)
```

## Compatibility with the retired Java IAM service

The IAM module keeps the Java service's endpoints (`/api/v1/auth/...`, `/api/v1/admin/users`, the buyer and
manufacturer access checks), JSON shapes, error bodies, tables and BCrypt password hashes. Its tests port
the Java `IamSecurityAndAuthTest` scenarios. Two deliberate differences:

- Unexpected server errors no longer echo the internal exception message to the client.
- The first admin is created with the `db:seed-admin` script instead of at every startup.
- Signing in by email ignores letter case (emails were always stored in lower case).
