# 000-tech-audit.md — Brownfield Tech Audit

> WDS Phase 5 prerequisite per `wds-glossary.md`:
> "Tech Audit — `E-Development/000-tech-audit.md`. Living architecture document. Required before any PRD on an existing codebase."
>
> **Date:** 2026-09-15
> **Author:** Stage 3 of 9 (Phase 5 prep); produced via direct codebase inventory.
> **Scope:** the `web/` directory plus repo-root tooling and lockdown artifacts.

---

## 1. Stack inventory

### 1.1 Application framework

| Layer | Choice | Version | Notes |
|---|---|---|---|
| UI library | React | 18.3.1 | SPA, no SSR |
| Language | TypeScript | 5.9.3 | strict mode + noUnusedLocals + noUnusedParameters |
| Bundler | Vite | 5.4.21 | port 5173, strictPort: false |
| Router | react-router-dom | 6.28.0 | declarative `<Routes>` |
| i18n | i18next + react-i18next | 23.16 / 15.1 | EN + BN locales |
| State | Local component state + IndexedDB | — | No Redux/Zustand |
| Mock API | MSW (Mock Service Worker) | 2.15 | `/api/*` routes served from worker |
| Persistence | idb-keyval | 6.3 | Session + IndexedDB store |
| Package manager | pnpm | 9.12.3 | workspace at `pnpm-lock.yaml` |

### 1.2 Tooling

| Tool | Version | Purpose |
|---|---|---|
| Vitest | 3.2.7 | Unit tests (`web/src/__checks__/`) |
| Playwright | 1.63 | E2E (`web/e2e/`) |
| ESLint | 9.10 | Lint with `typescript-eslint` + `jsx-a11y` |
| Prettier | 3.3 | Format |
| Lefthook | 1.8 | Git hooks (pre-commit: prettier + eslint --fix; commit-msg: commitlint; pre-push: typecheck) |
| Commitlint | 19.6 | Conventional commits |

### 1.3 Design / lockdown source

- `_bmad-output/design/` — 18+ lockdown dimension files (color, typography, iconography, spacing, grid, settings, motion, etc.). All UI is bound to these.
- `_bmad-output/planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/` — master DESIGN.md + EXPERIENCE.md (the spine).
- `docs/D-UX-Design/01-design-system-foundation.md` — lockdown-bound frontend mirror; this is the canonical token reference for the codebase.
- `web/mockups/theme.css` — single source of CSS variables (442 lines). Shared by mockups + imported by app.

### 1.4 What's NOT present (per Phase 4 closeout §6)

- ❌ Tailwind (`tailwind.config.js`, `@tailwind` directives) — not installed
- ❌ `emerald-600` / `blue-600` / `indigo-600` / `rose-600` classes — never shipped
- ❌ Tailwind utility classes in any source file
- ❌ babel.config.js — Vite handles JSX via `@vitejs/plugin-react`

---

## 2. Folder structure

```
web/
├── public/                          Static assets
├── e2e/                             Playwright E2E specs
│   ├── _diag/
│   ├── _tier8-snap/
│   ├── _tier9-snap/
│   ├── auth-routes.spec.ts
│   ├── errorboundary.spec.ts
│   ├── happy-path.spec.ts
│   ├── i18n-bangla.spec.ts
│   ├── login.spec.ts
│   └── visual.spec.ts
├── mockups/                         Static HTML mockups (legacy, dev reference)
│   ├── 00-login/  01-priya/  02-anjali/  04-technician/  05-vendor/
│   ├── nav.js
│   └── theme.css                   ← canonical CSS variables (442 lines)
├── src/
│   ├── App.tsx                     Routes (1 file, all routes defined)
│   ├── main.tsx                    React root
│   ├── pages/                      17 page components (see §3)
│   ├── components/
│   │   ├── icons/                  Inline SVG icon library
│   │   ├── layout/                 AppLayout, AppLayoutContext, nav-config
│   │   ├── operator/               HotlineIntakeModal
│   │   ├── pages/                  FilterChip, InboxRow
│   │   └── ui/                     22 shadcn-style primitives (Button, Modal, Table, Dropdown, …)
│   ├── hooks/                      useTheme, useLocale, useIncidents
│   ├── i18n/                       Locale loader
│   │   └── locales/{en,bn}/        20 EN JSON files (mirror BN)
│   ├── lib/                        chain-verify.ts (hash recomputation utility)
│   ├── mocks/                      MSW handlers + IndexedDB session store
│   ├── styles/                     13 CSS files (one per area + app.css)
│   ├── types/                      domain.ts (canonical enums), inbox.ts
│   └── __checks__/                 Vitest feature checks (15+ tests)
├── scripts/                        Dev scripts
├── package.json
├── vite.config.ts                  Path aliases: `@` → src, `@mocks` → src/mocks
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── tsconfig.json                   strict + noEmit + vite/client types
└── index.html
```

---

## 3. Routes (from `App.tsx`)

| Path | Component | Role(s) | Tier | Spec |
|---|---|---|---|---|
| `/` | `LoginPage` | (none, public) | 3 | login-page.md |
| `/login` | `LoginPage` | (alias) | 3 | login-page.md |
| `/styleguide` | `StyleguidePage` | (dev-only) | 3 | styleguide-page.md |
| `/dashboard` | `OperatorDashboard` | utility_operator | 2 | operator-dashboard.md |
| `/inbox` | `InboxList` | utility_operator | 3 | inbox-list.md |
| `/inbox/:id` | `InboxDetail` | utility_operator | 2 | inbox-detail.md |
| `/incidents/:incident_id/chain` | `IncidentChainSegmentPage` | utility_operator | 1 | per-incident-chain-segment.md |
| `/my-reports/:incident_id/timeline` | `CitizenStatusTimeline` | citizen | 1 | citizen-status-timeline.md |
| `/verify-flow` | `VerifyFlow` | utility_operator | 3 | verify-flow.md |
| `/audit-log` | `AuditLog` | utility_operator | 2 | audit-log.md |
| `/settings` | `Settings` | utility_operator | 3 | settings-page.md |
| `/field/*` | `FieldQueuePage` (+ nested detail) | field_technician | 2 | field-queue.md / field-incident-detail.md |
| `/submit` | `ComingSoonPage` | anjali | 3 | coming-soon-page.md |
| `/approve` | `ComingSoonPage` | pha_approver | 3 | coming-soon-page.md |
| `/audit` | `ComingSoonPage` | pha_viewer | 3 | coming-soon-page.md |
| `/vendor` | `ComingSoonPage` | vendor | 3 | coming-soon-page.md |

**Catch-all:** `<Navigate to="/" replace />` (sends unauthenticated users to login; authenticated users land via `landingFor(session.role)`).

---

## 4. Page inventory (17 pages, 7,570 LOC)

| Page | LOC | Status |
|---|---|---|
| OperatorDashboard.tsx | 1362 | Tier 2 — load-bearing |
| InboxDetail.tsx | 904 | Tier 2 — load-bearing |
| StyleguidePage.tsx | 847 | Tier 3 — dev-only |
| FieldIncidentDetailPage.tsx | 601 | Tier 2 — load-bearing |
| AuditLog.tsx | 582 | Tier 2 — load-bearing |
| InboxList.tsx | 454 | Tier 3 |
| CitizenStatusTimeline.tsx | 343 | Tier 1 — gap screen |
| SubmitReportPage.tsx | 350 | Tier 3 (5 MAJOR items) |
| FieldQueuePage.tsx | 422 | Tier 2 — load-bearing |
| IncidentChainSegmentPage.tsx | 428 | Tier 1 — gap screen |
| CitizenAckPage.tsx | 351 | Tier 3 (5 MAJOR items) |
| ComingSoonPage.tsx | 86 | Tier 3 — placeholder |
| VerifyFlow.tsx | 219 | Tier 3 |
| LoginPage.tsx | 220 | Tier 3 |
| Settings.tsx | 278 | Tier 3 (5 MAJOR items) |
| InboxRail.tsx | 123 | Tier 3 (used inside InboxDetail layout) |

**Tier-1 gap screens already implemented:** both `CitizenStatusTimeline.tsx` and `IncidentChainSegmentPage.tsx` exist as code but predate lockdown. Spec reconciliation needed.

**`HotlineIntakeModal.tsx`** lives under `web/src/components/operator/` (mounted on OperatorDashboard) — 1 file in the operator sub-folder.

---

## 5. Component library (22 shadcn primitives)

`web/src/components/ui/` — 22 `.tsx` files, 2,527 LOC.

| Component | LOC | Role |
|---|---|---|
| Button | 42 | Primary CTA, ghost, outlined |
| Input | 84 | Text field |
| Modal | 127 | Overlay container |
| Dropdown | 147 | Composite (Dropdown + Popover + Trigger + 2 hooks) |
| DropdownPopover | 118 | |
| DropdownTrigger | 116 | |
| Table | 159 | |
| TableHeader | 178 | |
| TableBody | 119 | |
| Card | 27 | |
| Calendar | 183 | |
| DatePicker | 183 | |
| DateRangePicker | 171 | |
| Toast | 82 | |
| ToastProvider | 121 | |
| Tooltip | 252 | (heaviest primitive) |
| Pagination | 139 | |
| BandPill | 73 | Trust band visualization |
| ErrorBoundary | 68 | |
| ErrorScreen | 138 | |

**Type files:** `Dropdown.types.ts`, `Table.types.ts` (FE-B5a AD-FE-6 separation).
**Hooks:** `useCalendar.ts`, `useDropdownKeyboard.ts`, `useDropdownState.ts`.

These are the project's shadcn layer (per lockdown decision #4). They are NOT the same as upstream shadcn/ui — they are a hand-rolled adaptation bound to lockdown tokens.

---

## 6. Domain model (`web/src/types/domain.ts`)

Canonical `as const` enums (no `enum` keyword — AD-FE-6 mandate):

| Type | Values | Used by |
|---|---|---|
| `Priority` | P1, P2, P3, P4 | Inbox, dashboards |
| `Band` | High, Medium, Low | BandPill, trust band |
| `ToastVariant` | Success, Warning, Danger, Info | ToastProvider |
| `ContainerWidth` | Narrow, Bangla, Wide | Layout |
| `Locale` | en, bn | i18n |
| `Theme` | light, dark | useTheme |
| `DropdownMode` | single, multi | Dropdown primitive |
| `IncidentStatus` | open, resolved, escalated | Incident chain projection |

`web/src/types/inbox.ts` — inbox-specific types (separate file to avoid domain.ts bloat).

**Projection invariant (from `domain.ts` header):** IncidentStatus is "projected from the latest incident-bearing chain event (IncidentResolved / IncidentEscalated / IncidentCreated) per dim 7 §6. Mirrors `web/src/mocks/handlers.ts:443-461` verbatim so the frontend projection cannot drift from the MSW wire shape."

---

## 7. Chain-verification utility (`web/src/lib/chain-verify.ts`)

**Status:** exists, used by `AuditLog` and `InboxDetail`. Spec §10 mandates <200 ms verification with 1500 ms client-side abort timeout. Never throws — degrades gracefully.

**VerifyState discriminated union:**

```ts
type VerifyState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok' }
  | { status: 'fail'; reason: 'unknown_hash' | 'hash_mismatch' | 'network' | 'timeout' };
```

**Contract:** POST `/api/chain/verify` with `{ block_hash }` → server recomputes canonical SHA-256 over the block's stored fields and compares.

**Gap:** Tier 1 spec `per-incident-chain-segment.md` is documented as needing this helper, but it is not yet imported there. Migration TODO.

---

## 8. Mock API (MSW)

`web/src/mocks/handlers.ts` — 875 LOC, 30+ route handlers. Routes observed:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | persona_id → session |
| POST | `/api/auth/logout` | session reset |
| GET | `/api/auth/me` | current session |
| GET | `/api/auth/personas` | persona list |
| GET | `/api/chain/head` | chain head |
| GET | `/api/chain/blocks` | block list (paginated) |
| POST | `/api/chain/verify` | verify block by hash |
| POST | `/api/events` | emit chain event |

Plus `fixtures.ts` (668 LOC — chain + incident data) and `canonical.ts` (108 LOC — canonical block shape).

The MSW worker is installed in `public/` via `msw init public/ --save`.

**Persistence:** `idb-keyval` keeps sessions + canonical state across reloads.

---

## 9. i18n

20 EN JSON files under `web/src/i18n/locales/en/` — one per page plus common.json, layout.json, datepicker.json, inboxCommon.json.

BN mirrors at `web/src/i18n/locales/bn/`.

**Per lockdown decision #3:** Hindi locale removed. English + Bangla only. Bangla-first on Anjali-mobile.

---

## 10. CSS architecture

**13 stylesheets** under `web/src/styles/`:
- `app.css` — global resets, body, typography
- `lockdown-bridge.css` — additive bridge between lockdown tokens and existing `--band-*`/`--brand-*` (per `decisions/01-token-deconfliction-plan.md`)
- `audit.css`, `components.css`, `datepicker.css`, `dropdown.css`, `inbox.css`, `settings.css`, `styleguide.css`, `submit.css`, `table.css`, `tech.css`, `verify.css` — per-area
- `README.md` — explains the structure

**Token source of truth:** `web/mockups/theme.css` — 442 lines of CSS variables (`:root` + `[data-theme="light"]` + `[data-theme="dark"]`).

**Per Phase 4 closeout §6:** "Lockdown tokens are additive; existing `--band-*` and `--brand-*` untouched."

---

## 11. Tests

### 11.1 Unit (Vitest) — `web/src/__checks__/`

15+ feature check tests including:
- `fe-b3-i18n.test.tsx`
- `fe-b5a-dropdown.test.tsx` + `flip-placement` + `harden-a11y` + `keyboard-typeahead`
- `fe-b6-incident-chain-segment.test.tsx`
- `fe-1-5b-inboxlist.test.tsx`
- `fe-b2-toast-errorboundary.test.tsx`
- `fe-1-1a-vitest.test.tsx`, `fe-1-3a-vitest.test.tsx`, `fe-1-3c-useincidents.test.tsx`

### 11.2 E2E (Playwright) — `web/e2e/`

- `auth-routes.spec.ts`
- `errorboundary.spec.ts`
- `happy-path.spec.ts`
- `i18n-bangla.spec.ts`
- `login.spec.ts`
- `visual.spec.ts`
- Snapshot dirs: `_diag/`, `_tier8-snap/`, `_tier9-snap/`

---

## 12. Build pipeline

```
pnpm dev           → vite (port 5173)
pnpm build         → tsc -b && vite build
pnpm preview       → vite preview
pnpm test          → vitest run
pnpm test:e2e      → playwright test
pnpm lint          → eslint .
pnpm typecheck     → tsc -b --noEmit
pnpm mocks:init    → msw init public/ --save
pnpm prepare       → lefthook install
```

**Git hooks (lefthook):**
- pre-commit: prettier + eslint --fix (parallel; type-aware lint deferred to CI for speed)
- commit-msg: commitlint (conventional commits)
- pre-push: full typecheck (slow but catches last-minute mistakes)

---

## 13. Lockdown binding summary

| Decision | Effect on code |
|---|---|
| **T1 trust-band inversion** | T1 = divider neutral. BandPill + reporter-badge are separate dimensions. |
| **Closure confetti removed** | 200 ms green pulse only — no confetti animation. |
| **Hindi locale removed** | Locale enum = `{ en, bn }` only. |
| **shadcn/ui adopted** | `web/src/components/ui/` IS the shadcn layer. |
| **Token names kept, hexes replaced** | Lockdown names like `--color-trust-t1` win; legacy `--band-high/medium/low` and `--brand-*` retained additively in `lockdown-bridge.css`. |
| **Reporter-badge separated** | Reporter source (anchor/hotline/webform/sensor) is rendered independently of trust band. |

---

## 14. Risks & open issues

### 14.1 Tier 1 gap screens — implementation predates lockdown

`CitizenStatusTimeline.tsx` and `IncidentChainSegmentPage.tsx` exist as code, but the lockdown cascade happened after they were drafted. Reconciliation needed:
- Token replacement (per `--color-trust-t1/2/3`)
- Hindi removal (already not present in BN-only)
- Confetti removal (verify no animation exists)
- shadcn/ui compliance (verify primitives in use)

### 14.2 Tier 2 — 95-step migration plan

Per `02-phase-4-closeout.md` §4.2:
- 24 OK items
- 57 MINOR items
- 26 MEDIUM items
- 7 MAJOR items

PR split (5 PRs):
1. Trust band badges → glyph + text pattern
2. Reporter-badge chip on rows
3. Three-column operator surface alignment
4. AuditLog filter chips + chain-read logging
5. OperatorDashboard hotline modal trigger + chain-freshness indicator

### 14.3 Tier 3 — 5 MAJOR items

- `SubmitReportPage`: T1/T2/T3 dropdown → plain-language
- `CitizenAckPage`: add VS15 + glyph chars + ack-window expiry
- `Settings`: Reset → ghost variant + confirmation modal
- `Styleguide`: update 3-band docs → 5-band (T0/T1/T2/T3/resolved) + remove Danger button misuse demo
- (5th — verify from `02-phase-4-closeout.md` §4.3)

### 14.4 Open questions (37 across Tier 2)

Mostly structural decisions deferred to implementation. Tracked per-spec in `## Open Questions` sections. Should be resolved during WO writing (Stage 5).

### 14.5 Migration debt (Phase 1.7+)

- Progressive `--band-*` → `--color-trust-t1/2/3` migration across `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`, `components.css`, `inbox.css` (multi-PR rollout).
- Stylelint rule for alert-red reservation.

### 14.6 chain-verify.ts usage gap

The helper exists but `IncidentChainSegmentPage.tsx` does not import it yet. Spec §10 demands it. Will be caught in WO-003.

---

## 15. What this audit enables

Stage 4 (Master PRD) can now proceed:
- Stack is known — no surprises for PRDs
- Routes are mapped — every PRD's parent route is identified
- Domain model is canonical — types come from `web/src/types/domain.ts`
- Mock API is known — `/api/*` MSW routes are the wire contract
- i18n shape is known — every PRD should reference `locales/{en,bn}/*.json`
- Test infrastructure is known — vitest + playwright, with feature checks per spec section
- Build pipeline is known — lefthook gates commits; CI runs full type-aware lint

---

## 16. Out-of-scope / not covered by this audit

- Phase 1 PWA worker (no `service-worker.ts` observed; would need separate audit)
- Performance budgets beyond foundation §12
- Security audit (CSP, headers, token storage in IDB) — separate concern
- PHA (Public Health Authority) data contract — explicitly deferred (Scenario 05)

---

_Tech audit complete. Required prerequisite for Stage 4 (Master PRD) is now satisfied._
