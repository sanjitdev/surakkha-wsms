# Epic FE-1 Context: Operator UI/UX Flow

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Ship a real, reusable React component library plus the 6 dim-5 page templates (Dashboard, Inbox List, Inbox Detail, Verify Flow, Audit Log, Settings) so that every Priya (utility operator) demo step works end-to-end through composed pages — no monolithic dump-the-mockup-into-React translations. Karim's field-tech surface reuses the same components. All 6 personas route to their landing. The two existing monolithic pages (`OperatorDashboard.tsx`, `FieldQueuePage.tsx`) are decomposed against this library.

## Stories

- Story FE-1.1: Foundation Component Library (dim 4 primitives + layout + theme/locale hooks + /styleguide route)
- Story FE-1.2: React Router for All 6 Personas
- Story FE-1.3: Page Primitives (KpiCard, FilterChip, JobRow, InboxRow, AuditLogRow, Charts, Timeline, BandBadge)
- Story FE-1.4: Decompose Monolithic Pages (OperatorDashboard + FieldQueuePage + LoginPage as compositions ≤200 lines)
- Story FE-1.5: Ship 6 dim-5 Page Templates (Dashboard, InboxList, InboxDetail, VerifyFlow, AuditLog, Settings)
- Story FE-1.6: Re-runnable Demo + Polish (Reset button + Vitest checks for token compliance + 200-line cap)

## Requirements & Constraints

**Hard requirements (frontend-only, no backend changes):**

- The 8 dim-4 primitives (Button, Input, TopChrome, Sidebar, Card, Modal, Toast, BandPill) must be implemented as named React components per dim 4 contract, plus the layout primitives Container and EmptyState.
- Every React component file ≤ 200 lines excluding comments and type imports — decomposition is mandatory, not optional.
- Every visual property (color, spacing, radius, height, shadow, z-index) references a dim-1–4 token via `var(--*)`. No hardcoded px/rem/em/#/rgb literals in component code.
- No new design tokens — the token system is locked 2026-09-07. New tokens require amending the relevant dim doc.
- Theme (light/dark) and locale (en/bn) switchers operate at the `<body>` level via `data-theme` and `data-locale`; persisted to localStorage; no per-component branches.
- React Router v6 wires each of the 6 personas to their PERSONAS.landing path; defense-in-depth role re-check inside each persona's route element.
- The 6 page templates (Dashboard, Inbox List, Inbox Detail, Verify Flow, Audit Log, Settings) must match their static mockups in `web/mockups/01-priya/` at parity.
- The two monolithic pages must be decomposed into ≤200-line compositions of the new primitives.
- Tap-target floors: desktop ≥ 44×44 px, mobile ≥ 48×48 px. Focus rings via `:focus-visible` only.
- pnpm typecheck passes; pnpm build passes; no console errors on render.

**Architecture invariants (from frontend spine, locked 2026-09-08):**

- State management: shared hooks layer at `web/src/hooks/` (`useChain`, `useIncidents`, `useIncident`, `useSensors`, `useEvents`, `useSessionRole`, `useTheme`, `useLocale`). No TanStack Query / Zustand / Redux.
- Component composition: 4-layer separation. (A) dim-4 primitives pure presentational. (B) page primitives compose A and accept plain props. (C) hooks own all data fetches. (D) pages are thin compositions of B + C. Primitive never calls a hook; hook never imports a primitive.
- Mock/real transport: hooks call `fetch('/api/<resource>')` with relative paths only; MSW intercepts; `VITE_USE_MOCKS=true|false` is the single swap point.
- Domain enums (priority, status, band, etc.) declared once in `web/src/types/domain.ts` as `as const`; hooks return verbatim; primitives may lowercase only inside their own JSX class-mapping.
- Endpoint ownership: an endpoint ↔ hook pair declared exactly once in `web/src/hooks/_registry.ts`; aggregate views compose hooks.
- Session-state writes: only `useSessionRole.ts` and `mocks/idb.ts` may write the IDB session row.
- Layer-boundary enforcement: barrel files (`index.ts`) forbidden inside `components/` and `hooks/`; import paths respect the A/B/C/D direction.
- Six Vitest checks at `web/src/__checks__/*` enforce these rules on every PR (FE-1.6).

## Technical Decisions

**Stack:** React 18.x + Vite 5.x + TypeScript 5.x + react-router-dom 6.x (new in FE-1.1) + MSW 2.x (existing) + idb-keyval (existing) + Vitest (added in FE-1.6) + pnpm (existing). No new state-management, charting, form, i18n, or animation libraries in Phase 1.

**Source tree (post FE-1.6):**
- `web/src/components/ui/` — Button, Input, Modal, Toast, BandPill (Layer A, dim-4 primitives)
- `web/src/components/layout/` — TopChrome, Sidebar, Container, EmptyState (Layer A)
- `web/src/components/pages/` — KpiCard, FilterChip, JobRow, InboxRow, AuditLogRow, Timeline, BandBadge (Layer B); `charts/` subdir for TimeSeriesLine, Donut, HorizontalBar
- `web/src/hooks/` — `_registry.ts` + useChain, useIncidents, useIncident, useSensors, useEvents, useSessionRole, useTheme, useLocale (Layer C)
- `web/src/types/domain.ts` — canonical enums (Layer-agnostic)
- `web/src/pages/` — LoginPage, Dashboard, InboxList, InboxDetail, VerifyFlow, AuditLog, Settings, FieldQueuePage (Layer D, ≤200 lines each)
- `web/src/styles/components.css` + `inbox.css` + `audit-log.css` + `verify-flow.css` + `settings.css` — extracted composition CSS (no new tokens)
- `web/src/__checks__/*` — six Vitest enforcement files for AD-FE-4 through AD-FE-9

**Locked backend surface (consumed via MSW, no changes):** `/api/chain/head`, `/api/incidents[?bucket=]`, `/api/incidents/:id`, `/api/sensors`, `/api/events?event_type=X[&limit=N]`, `/api/auth/login`, `/api/auth/logout`. 33 event types in dim 7 §3; 9 roles in dim 7 §2.5 (incl. `field_technician`).

**Composition CSS:** Tokens already locked at `web/mockups/theme.css` + `dashboard.css` + `components.css`. Composition CSS lives in `web/src/styles/*` — no new tokens.

**Mock fixtures:** Already seeded at `web/src/mocks/fixtures.ts` — ~17 chain events, 6 personas, 9 actor roles. No fixture additions in this epic.

## UX & Interaction Patterns

- TopChrome (48 px) is the canonical header for every operator page; 3 slots: left (brand + separator + chain-status with pulse-dot), right (persona chip + locale-globe toggle + theme toggle).
- Sidebar nav is persona-aware: Priya sees 8 items (Dashboard, Inbox, Verify, Audit, Settings, Handover, Notices, Sensors); Karim sees 4 (Work queue, My day, Incident detail, History). 44 px row height, 3 px left-border active marker.
- Inbox row is 56 px comfortable; Audit-log row is 40 px dense with Plex Mono for chain refs; both have mobile collapse to 1-col timeline.
- Verify Flow uses `--container-narrow` (720 px), no sidebar; 3-step wizard (sensor cluster → Anjali corroboration → councillor notify).
- EmptyState: 8 patterns locked in dim 5 §8 (icon + heading + body + optional CTAs); 6 used across operator pages.
- All controls keyboard-navigable; Modal traps focus; Toast has `role="status"` + `aria-live="polite"`; Esc closes modal.
- Dark mode + Bangla locale work on every page via body-level attributes — no per-component branches.

## Cross-Story Dependencies

- **FE-1.1 → all later stories:** provides Button, Input, TopChrome, Sidebar, Card, Modal, Toast, BandPill, Container, EmptyState, useTheme, useLocale, react-router-dom install.
- **FE-1.2 → FE-1.4, FE-1.5:** persona routing and defense-in-depth role re-check.
- **FE-1.3 → FE-1.4, FE-1.5:** KpiCard, FilterChip, JobRow, InboxRow, AuditLogRow, Charts, Timeline page primitives.
- **FE-1.4 → FE-1.5:** decomposition must be complete before page templates can compose; FieldQueuePage's `tech.css` extracted in FE-1.4 (or earlier).
- **FE-1.6 → all stories:** the six `__checks__/*` Vitest files enforce AD-FE-4 through AD-FE-9 across every shipped component.
- **No cross-epic dependencies on backend:** the backend epic FE-1 only consumes the locked wire envelope (MSW already implements it).
