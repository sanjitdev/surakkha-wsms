---
title: Surakkha v1 — Frontend Epics (UI/UX Componentization + Operator Pages)
status: final
created: 2026-09-08
updated: 2026-09-08
validationPasses:
  - rule: FR coverage (15/15 frontend FRs covered by stories)
    verdict: PASS
  - rule: NFR coverage (10/10 NFRs enforced via code or check)
    verdict: PASS
  - rule: UX-DR coverage (20/20 dim-4 + layout + page primitives covered)
    verdict: PASS
  - rule: Story quality (6 stories, all single-dev doable, all Given/When/Then ACs)
    verdict: PASS
  - rule: Story dependencies (no forward deps; foundation-first ordering)
    verdict: PASS
  - rule: Epic structure (single epic with 6 stories; file-churn rationale documented)
    verdict: PASS
  - rule: Out-of-scope (no mobile surfaces, no wire-format changes, no new design tokens)
    verdict: PASS
scope: Phase 1 frontend-only demo (MSW + IndexedDB), decomposition into a reusable React component library and the 6 dim-5 page templates for the operator (Priya) persona + light field-tech (Karim) componentization
companions:
  - ../planning-artifacts/epics-backend.md                  # backend epics (5 epics, 19 stories) — locked 2026-09-07
  - ../planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
  - ../design/04-spacing-components-lockdown.md            # dim 4 components (button, input, top-chrome, nav, card, modal, toast, band-pill)
  - ../design/05-grid-pages-stack-lockdown.md              # dim 5 grid + 6 page templates
  - ../design/05b-data-viz-lockdown.md                     # dim 5b charts
  - ../design/06-data-formats-lockdown.md                  # dim 6 component prop shapes
  - ../design/07-sensor-wire-format-lockdown.md            # dim 7 wire envelope (33 event types)
  - ../design/08-motion-lockdown.md                        # dim 8 motion
  - ../planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md
  - ../planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/EXPERIENCE.md
inputDocuments:
  - ../planning-artifacts/epics-backend.md
  - ../planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md
  - ../design/04-spacing-components-lockdown.md
  - ../design/05-grid-pages-stack-lockdown.md
  - ../design/05b-data-viz-lockdown.md
  - ../design/06-data-formats-lockdown.md
  - ../design/07-sensor-wire-format-lockdown.md
  - ../design/08-motion-lockdown.md
  - ../planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/DESIGN.md
  - ../planning-artifacts/ux-designs/ux-Surakkha-2026-09-06/EXPERIENCE.md
stepsCompleted: [1, 2, 3, 4]
outOfFrontendScope:
  - Mobile surfaces (Anjali mobile, Operator mobile, PHA pane) — locked in dim 5c/5d/5e, Phase 2
  - Wire-format / event-type changes — locked in dim 7
  - Token changes — locked in dim 1-4
  - Mock fixture additions beyond what fixtures.ts already has
---

# Surakkha v1 — Frontend Epic Breakdown

> **Scope note.** This file is the **frontend-only** epic decomposition. The backend epic breakdown at `epics-backend.md` (5 epics, 19 stories, locked 2026-09-07) is the load-bearing source of truth for backend behaviors; this file consumes its outputs via the MSW wire envelope. Stories here do NOT duplicate backend work — they only consume the API surface already defined.
>
> **Why a new epic set.** The locked `epics-backend.md` is for the FastAPI + chain + projections backend. Frontend UI/UX stories were intentionally deferred there ("web/ frontend scaffolding is Phase 2 / Epic 3+"). We've since chosen to ship the operator UI in Phase 1 against MSW+IDB mocks (per dim 5 §17.1), which is new work. This file plans that frontend work end-to-end.
>
> **Why decompose now.** Stories 1.2 (Field-tech Karim) and 1.3 (Operator Dashboard) were shipped as monolithic dump-the-mockup-into-React translations. User explicitly rejected that pattern on 2026-09-08: "we need to build small and manageable components and use them throughout our applications not just a chunk of code." Epic FE-1 rebuilds both pages against a proper component library and ships the 6 dim-5 page templates.

## Requirements Inventory

### Functional Requirements (frontend)

```
FR-FE1:  Decompose existing OperatorDashboard.tsx (~733 lines, monolithic) into a composition of named reusable React components per dim 4 + dim 6 prop shapes; no behavior change, only structural change.
FR-FE2:  Decompose existing FieldQueuePage.tsx (~480 lines, monolithic) into the same reusable component library; no behavior change.
FR-FE3:  Implement dim 5 §7.2 Dashboard as a real React page composing KPI cards + sensor board + activity timeline; data bound to `/api/chain/head`, `/api/incidents`, `/api/sensors`, `/api/events?limit=20`.
FR-FE4:  Implement dim 5 §7.3 Inbox List — ranked action queue of incident rows at 56 px comfortable row height (dim 4 §4 Amendment A); data from `/api/incidents?bucket=`.
FR-FE5:  Implement dim 5 §7.4 Inbox Detail — 2-pane incident detail (left col-span-5 incident list, right col-span-7 detail with chain-hash timeline); data from `/api/incidents/{id}`.
FR-FE6:  Implement dim 5 §7.5 Verify Flow — 3-step wizard with `--container-narrow` (720 px), no sidebar; steps: sensor cluster, Anjali corroboration, councillor notify.
FR-FE7:  Implement dim 5 §7.6 Audit Log — chain explorer table, `--container-wide` (1280 px), `--height-row-default` (40 px) dense rows, Plex Mono for chain refs.
FR-FE8:  Implement dim 5 Settings page — preferences + role config (per dim 5 extension).
FR-FE9:  Wire React Router for all 6 personas: utility_operator → /dashboard, field_technician → /field, others → / (login picker) per their PERSONAS.landing.
FR-FE10: Theme switcher (light/dark) and locale switcher (en/bn) operate at the <body> level via `data-theme` and `data-locale`; persistence in localStorage.
FR-FE11: Each top-level page (Dashboard, Inbox List, Inbox Detail, Verify Flow, Audit Log, Settings) renders its `<EmptyState>` per dim 5 §8 when its data is empty — 8 patterns locked, 6 used across operator.
FR-FE12: Audit-log row renders per dim 5 §9 — desktop 6-slot grid (time / chain-ref / event-type+icon / ward / actor / action), mobile collapse to 1-col timeline.
FR-FE13: Mockup parity — every shipped React page has at least parity with its static mockup in `web/mockups/01-priya/` (Dashboard, inbox-list, inbox-detail, verify-flow, audit-log, settings).
FR-FE14: Re-runnable demo — `pnpm dev` boots Vite; login picker → persona → its landing; logout returns to picker; `Reset demo data` button clears IDB and reseeds.
FR-FE15: Tech-page reuse — Karim's FieldQueuePage composes the same KpiCard / FilterChip / JobRow components as the operator Dashboard, not a parallel set.
```

### Non-Functional Requirements (frontend)

```
NFR-FE1:  Component count cap — every React component file ≤ 200 lines excluding comments + type imports; if a page needs more, decompose further.
NFR-FE2:  No hardcoded values in component code — spacing/radius/height/shadow/z-index/colors all reference `var(--space-*)`, `var(--radius-*)`, `var(--height-*)`, `var(--shadow-modal)`, `var(--z-*)`, `var(--brand-*)`, etc. (per dim 4 §19).
NFR-FE3:  No new design tokens — every visual property uses an existing dim-1–4 token. New tokens require an amendment to `theme.css` + the relevant lockdown doc.
NFR-FE4:  Type-safe component props — every component declares a `Props` interface in TS; no `any`. Prop shapes for the 8 dim-4 primitives are locked in dim 6.
NFR-FE5:  pnpm typecheck passes; pnpm build passes; no console errors on render.
NFR-FE6:  Dark mode + Bangla locale work on every page without per-component branches (locale/theme live on `<body>`).
NFR-FE7:  Tap-target floors — desktop ≥ 44×44 px, mobile ≥ 48×48 px (per dim 4 §16.1).
NFR-FE8:  Focus rings via `:focus-visible` only (per dim 4 §5.6).
NFR-FE9:  No transitions on colour/sizing/spacing tokens — body-level theme-switch transition is the only colour transition (per dim 1 §7.6).
NFR-FE10: Component library has Storybook-lite demo page at /styleguide (low priority, only if a story needs it).
```

### Additional Requirements (from Architecture / Phase 1 contracts)

```
- Phase 1 demo is frontend-only against MSW + IndexedDB (per dim 5 §17.1). `VITE_USE_MOCKS=true` swaps in MSW; component code is identical to the eventual real-gateway code.
- MSW handlers at `web/src/mocks/handlers.ts` already implement the dim-7 wire envelope — components consume `/api/chain/head`, `/api/incidents`, `/api/sensors`, `/api/events?event_type=X` and friends.
- Fixtures at `web/src/mocks/fixtures.ts` already seed the demo data: ~17 events, 6 personas, 9 actor roles, 33 event types.
- IndexedDB schema (sessions, events, sensors, incidents, chain_head) lives in `web/src/mocks/idb.ts`.
- TanStack Query is not yet in the project; for Phase 1, `useEffect + fetch` against `/api/*` is acceptable per the existing pages (no need to introduce TanStack Query unless a story needs cache-invalidation).
- Vite 5 + React 18 + TypeScript + MSW is the locked stack — do not introduce new build tools.
- App.tsx currently has minimal role-based router (operator + field-tech); expanding to React Router for all 6 personas is in scope.
- The Priya chrome (sidebar + top-chrome) already exists at `web/mockups/01-priya/dashboard.css`; FieldQueuePage imports it. The chrome is the canonical layout — same chrome composes every operator page in this epic.
```

### UX Design Requirements (from dim 4, dim 5, dim 5b, dim 6 + UX design spine)

```
UX-DR-FE1:  Build `Button` component per dim 4 §5 — 4 styles (primary/secondary/ghost/danger) × 3 sizes (sm/md/lg), focus ring via :focus-visible, danger stays outline+tinted-bg (no filled danger button).
UX-DR-FE2:  Build `Input` component per dim 4 §6 — single md size (36 px), focus state with --brand-400 border + 2px shadow, search-wrap variant with leading icon.
UX-DR-FE3:  Build `TopChrome` component per dim 4 §7 — 48 px chrome, 3 slots (left brand+separator+chain-status, right persona+locale-globe); currently lives in `dashboard.css` as `.top-chrome*` — extract to a React component.
UX-DR-FE4:  Build `Sidebar` component per dim 4 §8.1 — admin-nav at 44 px row height, 3px left-border active marker, persona-aware (Priya has 8 nav items incl. Dashboard/Inbox/Verify/Audit/Settings/Handover/Notices/Sensors; Karim has 4 nav items).
UX-DR-FE5:  Build `Card` component per dim 4 §9 — two modifiers `.card--with-heading` (24 px block padding) and `.card--compact` (16 px everywhere). No shadow. Currently lives in `dashboard.css`/page-specific CSS — extract.
UX-DR-FE6:  Build `Modal` component per dim 4 §10 — 480 px max-width dialog, neutral scrim (--bg-base at 50% opacity), Esc-to-close, focus trap (use shadcn/Dialog pattern or hand-roll with Radix Dialog primitive).
UX-DR-FE7:  Build `Toast` component per dim 4 §11 — 4 variants (success/warning/danger/info), 360 px max-width, 4 s auto-dismiss with progress bar, bottom-right positioning, `role="status"` + `aria-live="polite"`. Use Sonner or hand-roll.
UX-DR-FE8:  Build `BandPill` component per dim 4 §12 — 3 bands (high/medium/low), dim-3 §6.1 icons (alert-triangle / minus-circle / info), 88 px min-width, 16 px md icon inside 20×20 inner area.
UX-DR-FE9:  Build `Container` layout primitive per dim 5 §3 — 3 widths (narrow 720 / bangla 1080 / wide 1280) with breakpoint gating.
UX-DR-FE10: Build `EmptyState` component per dim 5 §8 — 8 patterns (icon + heading + body + optional primary/secondary CTAs).
UX-DR-FE11: Build `KpiCard` for the Dashboard KPI row — `{ label, value, sub? }` shape per dim 6 page-template data shape.
UX-DR-FE12: Build `FilterChip` per field-tech mockup line 122 — pill button with optional count badge, `is-on` state when active.
UX-DR-FE13: Build `JobRow` (field-tech work order row) per work-queue mockup — grid 4-col (priority badge / content / time / arrow), `is-active` and `is-done` modifiers.
UX-DR-FE14: Build `InboxRow` per inbox-list mockup + dim 5 §7.3 — 56 px comfortable row, icon + title + meta + badge + action.
UX-DR-FE15: Build `AuditLogRow` per dim 5 §9 — 6-slot desktop grid, 1-col mobile collapse.
UX-DR-FE16: Build `Chart` primitives per dim 5b — TimeSeriesLine, Donut, HorizontalBar (used on Dashboard).
UX-DR-FE17: Build `Timeline` primitive — vertical event-timeline used in Inbox Detail right pane and Audit Log per-incident view.
UX-DR-FE18: Every component has a `data-testid` for stable test hooks.
UX-DR-FE19: 12-column CSS grid for page-level layouts per dim 5 §4 (gutter --space-md mobile / --space-lg desktop).
UX-DR-FE20: 5 breakpoints per dim 5 §2 (sm 480 / md 768 / lg 1024 / xl 1280 / 2xl 1440) — used as @media min-width in CSS.
```

### FR Coverage Map

| FR | Covered by Epic |
|---|---|
| FR-FE1 (decompose OperatorDashboard) | FE-1.3 |
| FR-FE2 (decompose FieldQueuePage) | FE-1.4 |
| FR-FE3 (Dashboard page) | FE-1.5 |
| FR-FE4 (Inbox List page) | FE-1.5 |
| FR-FE5 (Inbox Detail page) | FE-1.5 |
| FR-FE6 (Verify Flow page) | FE-1.5 |
| FR-FE7 (Audit Log page) | FE-1.5 |
| FR-FE8 (Settings page) | FE-1.5 |
| FR-FE9 (React Router for all 6 personas) | FE-1.2 |
| FR-FE10 (theme + locale switchers) | FE-1.1 |
| FR-FE11 (EmptyState per page) | FE-1.5 |
| FR-FE12 (Audit-log row dim 5 §9) | FE-1.3 |
| FR-FE13 (mockup parity) | FE-1.5 |
| FR-FE14 (re-runnable demo) | FE-1.6 |
| FR-FE15 (tech-page component reuse) | FE-1.4 |
| UX-DR-FE1–8 (dim 4 components) | FE-1.1 |
| UX-DR-FE9–10 (Container / EmptyState) | FE-1.1 |
| UX-DR-FE11–17 (page primitives KpiCard / FilterChip / JobRow / InboxRow / AuditLogRow / Charts / Timeline) | FE-1.3 |
| UX-DR-FE18–20 (test-ids, grid, breakpoints) | FE-1.1 |

## Epic List

- **Epic FE-1:** Operator UI/UX Flow — reusable component library + 6 dim-5 page templates + routing for all 6 personas

## Epic FE-1: Operator UI/UX Flow — Component Library + Page Composition

**Goal.** A real Priya (utility operator) can complete every Phase 1 demo step end-to-end through the 6 dim-5 page templates — sign in, see the dashboard, drill into the inbox, verify a resolution, audit the chain, configure settings — using a proper reusable React component library. Karim (field tech) re-uses the same components for his work queue. All 6 personas route to their landing page. The two existing monolithic pages (`OperatorDashboard.tsx`, `FieldQueuePage.tsx`) are decomposed into composed pages.

**Phase 1 FR coverage (frontend):** FR-FE1, FR-FE2, FR-FE3..FR-FE8 (the 6 dim-5 page templates), FR-FE9 (router for 6 personas), FR-FE10 (theme + locale switchers), FR-FE11..FR-FE15 (mockup parity, demo loop, tech-page reuse). **UX-DR coverage:** all 20 UX-DR-FE1..FE20 (dim 4 primitives + layout + page primitives + accessibility/grid rules). **NFR coverage:** NFR-FE1..FE10 (≤200 lines, no hardcoded values, no new tokens, type safety, build/typecheck, dark mode, locale, tap targets, focus rings, no token transitions).

**File-overlap rationale.** Every story touches `web/src/components/*` and/or `web/src/pages/*`. Splitting into multiple epics would create false risk boundaries between stories that share the same files. Stories are ordered foundation-first (FE-1.1 → FE-1.2 → FE-1.3 → FE-1.4 → FE-1.5 → FE-1.6); each story's consumers land in later stories, not in a new epic.

### Story FE-1.1: Foundation Component Library (dim 4 primitives + layout)

As an operator (Priya) — and indirectly any persona — 
I want every page composed of named, reusable, token-driven React components (Button, Input, TopChrome, Sidebar, Card, Modal, Toast, BandPill, Container, EmptyState) plus a `<body>`-level theme + locale switcher, 
So that no page is a one-off dump of markup and every visual property references a dim-1–4 token.

**Scope.** Ship the foundation component library. No pages are built yet — those come in FE-1.5. The 2 monolithic pages are still in place and unchanged after this story (FE-1.4 will decompose them against this library).

**Files created / modified:**

- `web/src/components/ui/Button.tsx` — 4 styles (primary/secondary/ghost/danger) × 3 sizes (sm/md/lg); `:focus-visible` ring with `var(--brand-400)`; danger = outline + tinted-bg (never filled)
- `web/src/components/ui/Input.tsx` — single md size (36 px); focus state with `var(--brand-400)` border + 2 px shadow; `SearchInput` variant with leading icon
- `web/src/components/ui/BandPill.tsx` — 3 bands (high/medium/low); dim-3 §6.1 icons (alert-triangle / minus-circle / info) inside 20×20 inner area; 88 px min-width
- `web/src/components/ui/Modal.tsx` — 480 px max-width; neutral scrim (`var(--bg-base)` at 50 %); Esc-to-close; focus trap (Radix Dialog or hand-rolled)
- `web/src/components/ui/Toast.tsx` — 4 variants (success/warning/danger/info); 360 px max-width; 4 s auto-dismiss; progress bar; `role="status"` + `aria-live="polite"`
- `web/src/components/layout/TopChrome.tsx` — 48 px chrome; 3 slots (left brand+separator+chain-status, right persona+locale-globe)
- `web/src/components/layout/Sidebar.tsx` — admin-nav at 44 px row height; 3 px left-border active marker; persona-aware via `navItems` prop
- `web/src/components/layout/Container.tsx` — 3 widths (`narrow` 720 / `bangla` 1080 / `wide` 1280); breakpoint gating
- `web/src/components/layout/EmptyState.tsx` — 8 patterns per dim 5 §8 (icon + heading + body + optional CTAs)
- `web/src/styles/components.css` — extracted from `mockups/01-priya/dashboard.css` + `mockups/theme.css`; tokens-only; no new tokens
- `web/src/hooks/useTheme.ts` — body-level `data-theme` attribute toggle, persisted to localStorage
- `web/src/hooks/useLocale.ts` — body-level `data-locale` attribute toggle (en/bn), persisted to localStorage
- `web/src/main.tsx` — call `useTheme()` + `useLocale()` hooks on app mount
- `package.json` — add `react-router-dom` (peer of FE-1.2 but listed here for one install)

**Dependencies.** None — first story.

**Acceptance Criteria:**

**Given** the developer runs `pnpm dev`
**When** they open `http://localhost:5173/styleguide`
**Then** they see a `/styleguide` route (added in main.tsx as a non-routed dev surface) rendering one of each component in light + dark + en + bn, with copy-pasteable usage notes per component
**And** the styleguide is gated to dev mode (Vite `import.meta.env.DEV`) and unreachable in production builds

**Given** the operator clicks the locale-globe toggle in TopChrome
**When** the toggle fires
**Then** `document.body.dataset.locale` flips from `en` to `bn` (or vice-versa)
**And** the toggle's `aria-pressed` reflects the new state
**And** the choice persists across page refresh (localStorage)
**And** Bangla placeholder text in the SearchInput variant renders in Noto Sans Bengali

**Given** the operator clicks the theme toggle
**When** the toggle fires
**Then** `document.body.dataset.theme` flips from `light` to `dark` (or unset ↔ `dark`)
**And** the choice persists across page refresh
**And** every component re-tints to the new theme without remounting

**Given** a developer imports `<Button variant="primary" size="md">Save</Button>`
**When** they look at the rendered HTML
**Then** the element has `data-testid="button-primary"` for stable test hooks
**And** the button's class list references `--height-control-md`, `--space-md`, `--brand-500`, `--radius-md` (no hardcoded values)

**Given** a developer renders `<Modal open onClose />`
**When** the modal is open
**Then** focus moves to the first focusable element inside the dialog
**And** `Tab` cycles within the dialog
**And** `Escape` triggers `onClose`
**And** focus returns to the trigger element on close
**And** the scrim is `var(--bg-base)` at 50 % opacity (NOT `var(--brand-500)`)

**Given** a developer renders `<Toast variant="success" message="Saved" />`
**When** the toast appears
**Then** it has `role="status"` and `aria-live="polite"`
**And** the progress bar animates from 100 % to 0 % over 4 s
**And** the toast dismisses automatically after 4 s
**And** hovering the toast pauses both the animation and the timer

**Given** a developer inspects any of the 10 components
**When** they grep the file for hardcoded values
**Then** no `px`, `rem`, `em`, `#`, or `rgb(` literals exist outside comments (verified via `pnpm test:no-hardcoded`)
**And** the file is ≤ 200 lines excluding comments + type imports

**Given** the operator's viewport is < 768 px wide
**When** Container renders with `width="bangla"`
**Then** the container fills the viewport with `--space-md` padding-inline instead of holding 1080 px (per dim 5 §3 responsive rule)

**Given** a developer renders `<EmptyState icon="inbox" heading="No incidents" body="..." />`
**When** the empty state appears
**Then** the icon is `--icon-size-xl` (24 px), `--fg-tertiary`
**And** the heading is `--font-size-md` `--font-weight-semibold` `--fg-default`
**And** the body is `--font-size-sm` `--fg-secondary`, max-width 280 px for line-length

---

### Story FE-1.2: React Router for All 6 Personas

As any persona (Priya / Anjali / PHA Approver / PHA Viewer / Vendor / Karim),
I want the app to route me to my landing page after sign-in and to defend-in-depth re-check my role on each persona's landing page,
So that no one can land on the wrong surface by URL-poking, and the demo loop is honest.

**Scope.** Replace the App.tsx ad-hoc role-branching with `react-router-dom`. Every persona routes to its `landing` path. Each persona page re-checks session role on mount and bounces wrong-role sessions back to `/`.

**Files created / modified:**

- `web/src/App.tsx` — replace role-if-cascade with `<BrowserRouter><Routes>`; index route shows LoginPage; persona routes branch via `useSessionRole()`
- `web/src/pages/LoginPage.tsx` — after `loginAs()`, navigate to `persona.landing` instead of `window.location.reload()`
- `web/src/hooks/useSessionRole.ts` — reads IndexedDB session, returns `{ session, role, loaded }`; bounces non-matching role to `/`
- `web/src/routes/priya.tsx` — route container for utility_operator; renders `<PriyaRoutes>` (Dashboard / Inbox List / Inbox Detail / Verify Flow / Audit Log / Settings); role re-check
- `web/src/routes/field.tsx` — route container for field_technician; renders `<FieldQueuePage>`; role re-check
- `web/src/routes/index.tsx` — re-exports route containers
- `web/src/main.tsx` — wrap `<App />` with `<BrowserRouter>` (already imported react-router-dom in FE-1.1)

**Dependencies.** FE-1.1 (needs `react-router-dom` installed).

**Acceptance Criteria:**

**Given** a user opens `http://localhost:5173/` and the IndexedDB session is empty
**When** the App renders
**Then** `<LoginPage />` renders with the 6 personas

**Given** a user clicks "Karim — Field Technician" and Continue
**When** `loginAs('karim')` resolves
**Then** `useNavigate()` pushes `/field` (Karim's `landing`)
**And** `<FieldQueuePage />` renders (current monolithic implementation; FE-1.4 will decompose)

**Given** Karim's session is active and Karim navigates to `http://localhost:5173/inbox` directly
**When** the route renders
**Then** the page calls `useSessionRole()` on mount
**And** `useSessionRole()` finds `role !== 'field_technician'`
**And** the page calls `navigate('/', { replace: true })` before any UI renders

**Given** a user clicks Logout from any persona's chrome
**When** the logout POST resolves
**Then** the session is cleared from IndexedDB
**And** `navigate('/', { replace: true })` fires
**And** `<LoginPage />` re-renders

**Given** the developer inspects `web/src/App.tsx`
**When** they look at the routes table
**Then** they see one `<Route>` per persona's `landing`, each guarded by a role check inside the route element

**Given** any persona's chrome renders a sidebar `<a href="/field">`
**When** the operator clicks it (without a matching session)
**Then** the destination page bounces them to `/` (defense-in-depth)

**Given** the operator is signed in as Karim and the developer hot-reloads the app
**When** the reload completes
**Then** Karim's session persists in IndexedDB
**And** `/field` re-renders without bouncing

---

### Story FE-1.3: Page Primitives (KpiCard, FilterChip, JobRow, InboxRow, AuditLogRow, Charts, Timeline)

As an operator (Priya) or field tech (Karim),
I want shared page primitives — KPI tiles, filter chips, work-order rows, inbox rows, audit-log rows, charts, and timelines — composed from FE-1.1 components,
So that every page is a composition, not a markup dump, and Karim's work queue reuses the same KpiCard / FilterChip as Priya's dashboard.

**Scope.** Ship the page-specific primitives. No pages built yet (FE-1.5).

**Files created / modified:**

- `web/src/components/pages/KpiCard.tsx` — `{ label, value, sub? }`; 1-col span-3 (per dim 5 §7.2)
- `web/src/components/pages/FilterChip.tsx` — `{ label, count?, isOn, onClick }`; pill button; per field-tech mockup line 122
- `web/src/components/pages/JobRow.tsx` — `{ priority, status, ticket, title, subtitle, timeLabel, timeVal, isActive, isDone, href }`; 4-col grid per work-queue mockup; `is-active` + `is-done` modifiers
- `web/src/components/pages/InboxRow.tsx` — `{ icon?, title, meta, badge?, action? }`; 56 px comfortable row per dim 4 Amendment A
- `web/src/components/pages/AuditLogRow.tsx` — 6-slot desktop grid (time / chain-ref / event-type+icon / ward / actor / action) per dim 5 §9; mobile 1-col collapse
- `web/src/components/pages/charts/TimeSeriesLine.tsx` — SVG line chart; props `{ points, height, yLabel? }`
- `web/src/components/pages/charts/Donut.tsx` — SVG donut chart; props `{ segments, centerLabel? }`
- `web/src/components/pages/charts/HorizontalBar.tsx` — SVG bar list; props `{ rows, max? }`
- `web/src/components/pages/Timeline.tsx` — vertical event timeline; `{ events: { ts, title, meta?, hash?, actor? }[] }`
- `web/src/components/pages/BandBadge.tsx` — single-band pill variant (vs. `<BandPill>` which is full-width); used in incident rows

**Dependencies.** FE-1.1.

**Acceptance Criteria:**

**Given** a developer imports `<KpiCard label="Today" value="4" sub="3 remaining" />`
**When** the card renders
**Then** it has `data-testid="kpi-card"`, background `var(--bg-surface)`, border `1px solid var(--border-subtle)`, radius `var(--radius-sm)`
**And** the value is `--font-size-xxl` `--font-weight-semibold` `--line-height: 1`
**And** the label is `--font-family-mono` `--font-size: 10px` `--fg-tertiary` UPPERCASE

**Given** a developer renders `<FilterChip label="P1 critical" count={3} isOn onClick={...} />`
**When** the chip is clicked
**Then** `onClick` fires once
**And** `aria-pressed` reflects `isOn`
**And** when `isOn` is true, the chip has `is-on` class with `var(--brand-100)` background and `var(--brand-500)` border

**Given** a developer renders `<JobRow priority="P1" status="enroute" ... href="/field/incident-detail?work_order=X" />`
**When** the row renders
**Then** it is a `<a>` (anchor) with the given href
**And** the priority badge is a 32×32 square with the priority text (`var(--danger)` bg for P1, `var(--warning)` for P2, `var(--bg-inset)` for P3)
**And** the status pill uses `<span class="t-pill t-pill--enroute">` per existing `tech.css`
**And** the row uses `grid-template-columns: auto 1fr auto auto`

**Given** a developer renders `<InboxRow title="..." meta="..." />`
**When** the row renders
**Then** it is `--height-row-comfortable` (56 px) per dim 4 Amendment A
**And** `[data-locale="bn"]` adds one `--space-xs` tier of block padding per dim 4 §15.4
**And** the row uses `cursor: pointer` and `transition: border-color 120ms ease-out` on hover

**Given** a developer renders `<AuditLogRow time="07:23:11" chainRef="01J..." eventType="SensorReadingSubmitted" ward="W07" actor="karim" />`
**When** the row renders at ≥ 768 px
**Then** the row uses 6-slot grid: `80px / 1fr / auto / 96px / 160px / auto` per dim 5 §9.1
**And** the time slot uses `var(--font-family-mono)` `var(--font-size-xs)` `var(--fg-tertiary)` with `font-variant-numeric: tabular-nums`
**And** the chain-ref slot truncates with ellipsis past 1fr

**Given** the same AuditLogRow renders at < 768 px
**When** the row renders
**Then** it collapses to 1-col timeline: `<time>` full width, `<chain ref>` full width mono, `<event type badge>` auto-width
**And** row height is `--height-row-comfortable` (56 px)

**Given** a developer renders `<TimeSeriesLine points={[{x, y}, ...]} height={120} />`
**When** the chart renders
**Then** it renders inline SVG with one `<polyline>` per series
**And** axes use `var(--font-family-mono)` `10px` `var(--fg-tertiary)`
**And** the chart's color uses `var(--brand-500)` for the primary line

**Given** a developer renders `<Timeline events={[{ts, title, hash, actor}, ...]} />`
**When** the timeline renders
**Then** events render top-to-bottom in `ts` order
**And** each event shows time (mono), title, optional hash (mono, truncated), optional actor
**And** the timeline uses `var(--border-subtle)` left-border rail and `var(--brand-500)` event dots

---

### Story FE-1.4: Decompose OperatorDashboard, FieldQueuePage, LoginPage

As a developer reading the codebase,
I want `OperatorDashboard.tsx`, `FieldQueuePage.tsx`, and `LoginPage.tsx` to be rewritten as compositions of FE-1.1 + FE-1.3 primitives,
So that no page is a monolithic dump, every visual property references a token, and the same components serve both Priya and Karim.

**Scope.** Rewrite the 3 monolithic pages against the new component library. No new pages, no behavior change, no mockup changes — only structural decomposition. The 200-lines-per-component cap (NFR-FE1) is enforced here.

**Files modified:**

- `web/src/pages/OperatorDashboard.tsx` — rewritten; composition only; ≤ 200 lines
- `web/src/pages/OperatorDashboard.parts/` (or `web/src/pages/OperatorDashboard/*` — flat sub-components co-located in this story's PR) — internal helpers extracted: `useOperatorDashboardData()` hook, `OverviewTab`, `SensorsTab`, `WardsTab`, `KpiRow`, `LayoutToggler`
- `web/src/pages/FieldQueuePage.tsx` — rewritten; composition only; ≤ 200 lines
- `web/src/pages/FieldQueuePage.parts/JobList.tsx` + `FilterBar.tsx` — internal helpers extracted
- `web/src/pages/LoginPage.tsx` — rewritten; composition only; uses `<TopChrome>` (no, just brand-panel — login has no top-chrome), `<Button>`, `<Container>`; ≤ 200 lines

**Dependencies.** FE-1.1, FE-1.3.

**Acceptance Criteria:**

**Given** the developer opens `web/src/pages/OperatorDashboard.tsx`
**When** they count the file's lines (excluding comments + type imports)
**Then** the file is ≤ 200 lines
**And** the file's imports include `KpiCard`, `Timeline`, `TimeSeriesLine`, `Donut`, `TopChrome`, `Sidebar`, `EmptyState`, `Container` from `web/src/components/*`

**Given** the developer opens `web/src/pages/FieldQueuePage.tsx`
**When** they count the file's lines
**Then** the file is ≤ 200 lines
**And** the file imports `KpiCard`, `FilterChip`, `JobRow`, `TopChrome`, `Sidebar`, `EmptyState` from `web/src/components/*`

**Given** the developer opens `web/src/pages/LoginPage.tsx`
**When** they count the file's lines
**Then** the file is ≤ 200 lines
**And** the file imports `Button`, `Container` from `web/src/components/*`

**Given** the operator opens `/dashboard` after this story
**When** the dashboard renders
**Then** the page renders identically to the pre-decomposition version (visual diff: zero pixel-level changes)
**And** the KPIs, charts, sidebar, and top-chrome all use the new components
**And** all data fetches and KPI computations stay in the page (extracted into a `useOperatorDashboardData()` hook)

**Given** Karim opens `/field` after this story
**When** the queue renders
**Then** the page renders identically to the pre-decomposition version
**And** the `tech-today` KPI row uses `<KpiCard>` from `web/src/components/pages`
**And** the `tech-chips` filter row uses `<FilterChip>` from `web/src/components/pages`
**And** the `tech-jobs` list uses `<JobRow>` from `web/src/components/pages`

**Given** the user opens `/` after this story
**When** the login picker renders
**Then** the 6 persona buttons use `<Button variant="secondary" size="lg">`
**And** the layout uses `<Container width="bangla">` per dim 5 §7.1 (centred card)
**And** no inline button-styling or hardcoded colors remain in `LoginPage.tsx`

**Given** the developer runs `pnpm typecheck`
**When** TypeScript completes
**Then** there are zero errors
**And** no `any` types were introduced (verified via grep for `: any`)

**Given** the developer runs `pnpm build`
**When** Vite completes
**Then** the build succeeds with zero warnings
**And** the bundle size for the 3 pages combined is ≤ the pre-decomposition size (decomposition should not bloat the bundle)

---

### Story FE-1.5: Ship the 6 dim-5 Page Templates

As an operator (Priya),
I want to navigate Dashboard → Inbox List → Inbox Detail → Verify Flow → Audit Log → Settings, each rendering the data from the MSW mock chain,
So that I can complete every Phase 1 demo step end-to-end through real React pages composed from FE-1.1 + FE-1.3 primitives.

**Scope.** Implement the 6 dim-5 page templates. Each page composes FE-1.1 + FE-1.3 primitives and binds to MSW endpoints. Mockup parity is required for the Priya surfaces.

**Files created:**

- `web/src/pages/Dashboard.tsx` (or rewrite of `OperatorDashboard.tsx` if it isn't already in FE-1.4's slot — keep the same file name to avoid churn)
- `web/src/pages/InboxList.tsx` — ranked action queue per dim 5 §7.3
- `web/src/pages/InboxDetail.tsx` — 2-pane per dim 5 §7.4 (left col-span-5 list, right col-span-7 detail)
- `web/src/pages/VerifyFlow.tsx` — 3-step wizard per dim 5 §7.5; no sidebar; `--container-narrow`
- `web/src/pages/AuditLog.tsx` — chain explorer per dim 5 §7.6; `--container-wide`; `--height-row-default` dense rows
- `web/src/pages/Settings.tsx` — preferences + role config per dim 5 extension

**Files modified:**

- `web/src/routes/priya.tsx` — add child routes for `/dashboard`, `/inbox`, `/inbox/:id`, `/verify`, `/audit`, `/settings`; sidebar links use React Router `<Link>` not raw `<a>`
- `web/src/styles/inbox.css`, `web/src/styles/audit-log.css`, `web/src/styles/verify-flow.css`, `web/src/styles/settings.css` — page-specific composition CSS (extracted from mockups)

**Data sources (MSW endpoints already exist):**

- `/api/chain/head` — chain freshness
- `/api/incidents` — incident list; `/api/incidents?bucket=high|medium|low` — bucketed
- `/api/incidents/:id` — single incident detail
- `/api/sensors` — sensor list
- `/api/events?event_type=X` — filtered event list; `/api/events?limit=N` — recent events

**Dependencies.** FE-1.1, FE-1.3, FE-1.4 (FE-1.4 makes Dashboard already composed; FE-1.5 replaces it with the full 6-page composition).

**Acceptance Criteria:**

**Given** the operator signs in as Priya
**When** they land at `/dashboard`
**Then** they see the Dashboard composed of `<KpiCard>` × 4 + `<TimeSeriesLine>` + `<Donut>` + `<Timeline>` + sidebar + top-chrome per dim 5 §7.2 wireframe
**And** KPI values come from `/api/incidents` + `/api/events?limit=20`

**Given** the operator clicks "Inbox" in the sidebar
**When** they navigate to `/inbox`
**Then** the Inbox List renders with stacked `<InboxRow>` at 56 px comfortable row height per dim 5 §7.3
**And** rows are grouped by trust band: Priority (high) → Queue (medium) → Bulk-triage (low) per dim 5 §8 pattern
**And** clicking a row navigates to `/inbox/:id`

**Given** the operator opens `/inbox/:id`
**When** the Inbox Detail renders
**Then** at ≥ 768 px the page is a 2-pane layout: left col-span-5 (related incident list), right col-span-7 (incident detail + `<Timeline>` of chain events for that incident)
**And** at < 768 px the layout collapses to single-pane per dim 5 §7.4
**And** the timeline uses `<Timeline>` from FE-1.3

**Given** the operator clicks "Verify" in the sidebar
**When** they navigate to `/verify`
**Then** the Verify Flow renders without a sidebar (per dim 5 §7.5)
**And** it uses `<Container width="narrow">` (720 px max-width)
**And** the 3-step wizard shows: Step 1 (Sensor cluster), Step 2 (Anjali corroboration), Step 3 (Councillor notify) — each as a `<Card variant="with-heading">` per dim 4 §9.1

**Given** the operator clicks "Audit" in the sidebar
**When** they navigate to `/audit`
**Then** the Audit Log renders with `<Container width="wide">` (1280 px max-width)
**And** rows use `<AuditLogRow>` at `--height-row-default` (40 px) per dim 5 §7.6 + §9
**And** the chain-ref column truncates with ellipsis; a copy-to-clipboard button is visible on hover

**Given** the operator clicks "Settings" in the sidebar
**When** they navigate to `/settings`
**Then** the Settings page renders per dim 5 extension: theme toggle, locale toggle, role config sections
**And** the theme + locale toggles write to `document.body.dataset.theme` / `data-locale` via `useTheme()` / `useLocale()` from FE-1.1

**Given** any of the 6 pages renders with no data (e.g. after `Reset demo data`)
**When** the data fetch returns an empty array
**Then** the page renders `<EmptyState icon="..." heading="..." body="..." />` per dim 5 §8 — never a blank page

**Given** the developer opens `web/src/pages/InboxList.tsx` (and likewise for the other 5)
**When** they count the file's lines
**Then** the file is ≤ 200 lines (NFR-FE1)

**Given** the developer inspects any of the 6 pages
**When** they grep for hardcoded values
**Then** zero `px`/`rem`/`em`/`#`/`rgb(` literals exist (NFR-FE2)

---

### Story FE-1.6: Re-runnable Demo + Polish

As any developer running `pnpm dev`,
I want a one-command demo loop with a "Reset demo data" button, typecheck/build pass, and a smoke test that confirms dark mode + Bangla locale work on every page,
So that the Phase 1 demo bar (per `project-context.md` §3) is reproducibly clickable.

**Scope.** Final polish. No new components, no new pages, no scope expansion.

**Files created / modified:**

- `web/src/components/ResetDemoButton.tsx` — button in Settings; on click, calls `reset.ts` (existing), then `window.location.reload()`
- `web/src/styles/inbox.css`, `web/src/styles/audit-log.css`, etc. — final review for token compliance
- `web/src/__checks__/no-hardcoded-values.ts` — Vitest test that greps every `.tsx`/`.css` file in `web/src/` for hardcoded values (NFR-FE2 enforcement)
- `web/src/__checks__/component-size.test.ts` — Vitest test that asserts every `.tsx` file ≤ 200 lines (NFR-FE1 enforcement)
- `web/package.json` — add `"test:checks": "vitest run __checks__"` script
- `web/README.md` (if missing) — document `pnpm dev` + `pnpm typecheck` + `pnpm build` + `pnpm test:checks`

**Dependencies.** FE-1.1..FE-1.5.

**Acceptance Criteria:**

**Given** the developer runs `pnpm dev`
**When** Vite starts
**Then** the console shows "VITE ready" with zero errors
**And** `http://localhost:5173/` loads the LoginPage

**Given** the developer clicks "Karim" → Continue
**When** Karim's `/field` renders
**Then** the work queue renders from MSW fixtures
**And** `/api/chain/head` returns the ingested_at of the most recent event in IDB

**Given** the developer clicks "Reset demo data" in Settings
**When** the click fires
**Then** `reset.ts` clears the IndexedDB
**And** `window.location.reload()` fires
**And** the LoginPage re-renders with the picker
**And** on the next login, the demo data is re-seeded from fixtures

**Given** the developer runs `pnpm typecheck`
**When** TypeScript completes
**Then** zero errors

**Given** the developer runs `pnpm build`
**When** Vite builds for production
**Then** the build succeeds with zero warnings
**And** the bundle splits include: `pages/Dashboard`, `pages/InboxList`, `pages/InboxDetail`, `pages/VerifyFlow`, `pages/AuditLog`, `pages/Settings`, `pages/FieldQueuePage` (route-level code-splitting if not already present)

**Given** the developer runs `pnpm test:checks`
**When** Vitest completes
**Then** `no-hardcoded-values.ts` passes (zero violations across `web/src/**/*.tsx` and `web/src/**/*.css`)
**And** `component-size.test.ts` passes (every `.tsx` ≤ 200 lines)

**Given** the operator opens any of the 6 pages in dark mode (body `data-theme="dark"`)
**When** the page renders
**Then** every component re-tints via `[data-theme="dark"]` selectors without any per-component theme branches (NFR-FE6)

**Given** the operator flips the locale to Bangla (body `data-locale="bn"`)
**When** any page renders
**Then** all Bangla text renders in Noto Sans Bengali (per dim 2 §9.4 + dim 4 §15)
**And** inbox rows + audit log rows gain one `--space-xs` tier of block padding (per dim 4 §15.4)
**And** toasts with Bangla content get `.toast--bangla` modifier (per dim 4 §15.5)
**And** no per-component locale branch exists (NFR-FE6)

**Given** the developer inspects `web/src/components/ResetDemoButton.tsx`
**When** they look at the file
**Then** it uses `<Button variant="danger" size="md">` from FE-1.1
**And** the file is ≤ 200 lines

**Given** any persona is signed in and the developer clicks the persona's logout button
**When** the POST to `/api/auth/logout` resolves
**Then** the session is cleared from IDB
**And** `navigate('/', { replace: true })` fires
**And** `<LoginPage />` re-renders

---

## Acceptance summary for Epic FE-1

- **15 Functional Requirements** (FR-FE1..FR-FE15) — all covered
- **10 Non-Functional Requirements** (NFR-FE1..NFR-FE10) — all covered (each enforced by code + check)
- **20 UX Design Requirements** (UX-DR-FE1..UX-DR-FE20) — all covered (8 dim 4 primitives + 2 layout primitives + 7 page primitives + 3 cross-cutting)
- **6 stories**, ordered foundation-first, no future-story deps
- **≤ 200 lines per component** enforced by automated check
- **No hardcoded values** enforced by automated check
- **No new design tokens** — every property references an existing dim-1–4 token
- **Mockup parity** for Priya's 6 surfaces + Karim's work queue
- **Re-runnable demo** via `pnpm dev` + `Reset demo data` button
