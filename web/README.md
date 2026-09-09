# Surakkha — React app

Phase 1 frontend. React + TypeScript + Vite, on top of the locked-down
design system in `mockups/theme.css`. MSW mocks in `src/mocks/` satisfy
the dim-7 wire format and seed an IndexedDB chain on first boot.

## First-time setup

> **Package manager: pnpm 9** (pinned via `packageManager` field and
> `.npmrc`). Run `corepack enable` once if `pnpm` is not on PATH.

```bash
cd web
pnpm install
cp .env.example .env.local           # VITE_USE_MOCKS=true is the default
pnpm mocks:init                      # writes public/mockServiceWorker.js
pnpm dev
```

Open http://localhost:5173 — you'll see the login picker (5 personas).
Pick one and hit Continue → MSW intercepts `POST /api/auth/login`, mints
a session row in IndexedDB, and reloads to the persona's landing route.

## What's where

```
web/
├─ mockups/          static HTML mockups (source of truth for visuals)
├─ src/
│  ├─ App.tsx        top-level shell — currently <LoginPage />
│  ├─ main.tsx       boots MSW + mounts React
│  ├─ pages/         one file per screen (LoginPage.tsx lives here)
│  ├─ styles/        app.css — React-specific composition only,
│  │                 no new tokens (theme.css owns those)
│  └─ mocks/         MSW handlers + IndexedDB persistence + session
├─ index.html        Vite entry, includes pre-paint theme script
├─ vite.config.ts    React plugin, @ and @mocks path aliases
└─ tsconfig.json     strict TS
```

## Design system policy

**No new colors, fonts, or spacing values in React code.** Every visual
property must reference a token from `mockups/theme.css` via CSS
variables (`var(--brand-500)`, `var(--space-md)`, etc.). The lockdown
contracts (dim 1-8) are closed; Phase 2 may relax this but Phase 1 does
not.

If a component needs a style that doesn't exist as a class yet:

1. Add it to `mockups/theme.css` or `mockups/dashboard.css` first.
2. Reference it from `src/styles/app.css` or directly from a component.
3. Never use inline hex codes or hardcoded pixel values.

## Mock mode

When `VITE_USE_MOCKS=true`, MSW intercepts fetch calls and returns data
shaped exactly like the Phase 2 FastAPI gateway will. Component code
calls `fetch('/api/incidents')` etc. — same code works against the real
backend with the env var flipped.

To point at a real backend:

```bash
VITE_USE_MOCKS=false pnpm dev
```

## Story 1.1 status

Currently delivers:

- Login picker wired to MSW (5 personas from dim 7 §2.5)
- Chain-head probe on mount → ready/pending/error status pill
- Session row persisted to IndexedDB

Next up (Story 5 territory): Inbox screen for Priya, ranked action list
using `/api/incidents`.
