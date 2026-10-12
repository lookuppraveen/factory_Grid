# FactoryGrid Platform

B2B pharmaceutical manufacturing marketplace. One pnpm + Nx workspace holds the React web app and the
Node.js (NestJS + TypeScript) backend. Plans live in [doc/](doc/).

```text
factory_Grid/
├── frontend/                     React 19 + Vite 8 + Tailwind 4 web app (deployed on Vercel)
├── backend/
│   ├── apps/factorygrid-api/     NestJS API: one app, one module per business area (iam today)
│   └── libs/
│       ├── auth/                 JWT guard, @Roles, @Public, @CurrentUser
│       ├── errors/               ApiResponse / ErrorResponse shapes, exception filter, validation pipe
│       └── contracts/            @factorygrid/contracts: TypeScript types generated from contracts/
├── contracts/                    OpenAPI contract of the API (source of truth for both sides)
├── docker-compose.yml            local PostgreSQL, Redis, MinIO, Mailpit
├── nx.json, pnpm-workspace.yaml  workspace setup
└── doc/                          development plans and tracker
```

## Prerequisites

- Node.js 24 LTS and pnpm 9 (`corepack enable` picks the version from `package.json`)
- Docker Desktop (local database and the API's integration tests)

## First run

```powershell
pnpm install
pnpm db:up                                                   # PostgreSQL on localhost:5442, etc.
copy backend\apps\factorygrid-api\.env.example backend\apps\factorygrid-api\.env
# edit .env: set JWT_SECRET (the file shows how to generate one)
pnpm --filter factorygrid-api db:migrate                     # apply database migrations
pnpm build                                                   # libraries, API and web app
pnpm dev:api                                                 # API on http://localhost:8081
pnpm dev:web                                                 # web app on http://localhost:5173
```

Create the first admin once: set `BOOTSTRAP_ADMIN_PASSWORD` in the API's `.env`, then run
`pnpm --filter factorygrid-api db:seed-admin`.

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds every project in dependency order (Nx caches results) |
| `pnpm test` | API integration tests against a throwaway PostgreSQL (needs Docker) |
| `pnpm typecheck` | TypeScript checks for the backend projects |
| `pnpm contracts:check` | Regenerates `contracts/` from the API and fails if it changed |
| `pnpm db:up` / `pnpm db:down` | Start or stop the local Docker stack |

## Local service ports

| Service | URL |
| --- | --- |
| API | http://localhost:8081 (Swagger UI at `/docs`, OpenAPI JSON at `/docs-json`, health at `/health`) |
| Web app | http://localhost:5173 |
| PostgreSQL | localhost:5442, user/password/db `factorygrid` |
| Redis | localhost:6381 |
| MinIO | API http://localhost:9010, console http://localhost:9011 |
| Mailpit | SMTP localhost:1027, inbox http://localhost:8027 |

The host ports avoid the usual defaults (5432, 6379, 1025) so they do not clash with other local projects.

## API contracts

`contracts/factorygrid-api.yaml` is generated from the API (`pnpm --filter factorygrid-api openapi:export`)
and committed. `backend/libs/contracts` turns it into TypeScript types that the web app imports as
`@factorygrid/contracts`. CI fails when the committed contract and the code disagree.

## Deployment

- **Web app:** Vercel, with the project's Root Directory set to `frontend`. `frontend/vercel.json` installs
  only the web app's part of the workspace (`pnpm install --frozen-lockfile --filter frontend...`).
- **API:** not deployed yet. Hosting is an open decision in the backend plan.
