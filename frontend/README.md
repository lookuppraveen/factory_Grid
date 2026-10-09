# FactoryGrid Frontend

React 19 + Vite 8 + Tailwind CSS 4 + React Router 7.

## Commands

```powershell
npm ci             # install exactly from package-lock.json
npm run dev        # dev server (http://localhost:5173)
npm run build      # production build -> dist/
npm run preview    # serve the production build locally
npm run lint       # oxlint
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
- The frontend is not yet wired to the IAM service. When it is, the API base URL
  should come from `VITE_IAM_API_URL` (default `http://localhost:8081`).
