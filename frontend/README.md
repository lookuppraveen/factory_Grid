# FactoryGrid Frontend

React 19 + Vite 8 + Tailwind CSS 4 + React Router 7.

## Commands

The frontend is part of the pnpm workspace at the repo root. Run these from the repo root:

```powershell
pnpm install                        # installs the whole workspace from pnpm-lock.yaml
pnpm dev:web                        # dev server (http://localhost:5173)
pnpm --filter frontend build        # production build -> frontend/dist/
pnpm --filter frontend preview      # serve the production build locally
pnpm --filter frontend lint         # oxlint
```

## Source layout

```text
src/
├── assets/                 images and SVGs
├── components/
│   ├── common/             reusable UI (badges, modals, palettes, metric cards)
│   ├── layout/             Header, Sidebar
│   └── modules/            business modules (catalog, RFQ, orders, masters, admin)
├── context/                AppContext (useApp), ThemeContext (useTheme)
├── data/                   mockData.ts (current in-app demo dataset)
├── pages/                  LandingPage, LoginPage, DashboardLayout
├── services/               external connectors, auth utils, payment and invoice services
├── types/                  shared TypeScript types
├── App.tsx                 route definitions
├── main.tsx                entry point
└── index.css               global styles and design tokens
```

Notes:
- `useApp` and `useTheme` stay with their context providers in `context/`, so no separate `hooks/` folder exists yet.
- Routes are currently defined in `App.tsx`.
- Login calls the IAM module of `factorygrid-api`. The API base URL comes from
  `VITE_API_BASE_URL` (default `http://localhost:8081`); see `.env.example`.
