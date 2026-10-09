# FactoryGrid Platform

B2B manufacturing marketplace. The repository is split into an independent frontend and backend.

```text
Factory_Grid_Platform/
├── frontend/                 React 19 + Vite 8 + Tailwind 4 web app
├── backend/
│   ├── infrastructure/       api-gateway, config-server, eureka-server (reserved, later phases)
│   └── services/
│       └── iam-service/      Centralized Identity & Access Management (Spring Boot 3, Java 17)
├── scripts/                  Developer helper scripts
└── vercel.json               Vercel builds frontend/ (see below)
```

## Frontend

```powershell
cd frontend
npm ci
npm run dev        # http://localhost:5173
npm run build      # output: frontend/dist
npm run lint
```

See [frontend/README.md](frontend/README.md).

## Backend: IAM service

Requires Java 17+ and PostgreSQL with databases `factorygrid` (app) and `factorygrid_test` (tests).

```powershell
copy backend\services\iam-service\.env.example backend\services\iam-service\.env
# edit .env and set DB_PASSWORD and JWT_SECRET (never commit .env)

.\scripts\start-iam.ps1 -Test     # Maven tests
.\scripts\start-iam.ps1           # run service on http://localhost:8081
```

- Swagger UI: http://localhost:8081/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8081/v3/api-docs

See [backend/README.md](backend/README.md).

## Deployment (Vercel)

The root `vercel.json` installs and builds from `frontend/` and serves `frontend/dist`.
No Vercel dashboard change is required. If the project's **Root Directory** setting is
ever changed to `frontend`, delete the `cd frontend &&` prefixes from `vercel.json`.
