# Changelog

All notable changes to Surakkha will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Maintainer note: this file is **manually curated**. Entries are added by the
> author of each merged change at the top of the `[Unreleased]` section, then
> moved into a dated release section during version bumps. See
> `docs/contributing.md` for the exact workflow.

## [Unreleased]

### Added

- **FE-1.5:** Four new pages wired into the operator (Priya) sidebar. Each ships as a real React surface (not a `ComingSoonPage` stub) with a dedicated stylesheet, stable testids, and a Playwright visual snapshot.
  - `/inbox/:id` — **InboxDetail** (2-pane thread explorer at `Container width=bangla`). Left pane: chain-event timeline for the incident (`payload.incident_id === :id`). Right pane: sibling incidents in the same ward. Backlink + severity + status pills in the header. Testids: `back-to-inbox`, `inbox-detail-title`, `inbox-detail-timeline`, `inbox-detail-related`, `inbox-related-{id}`. Data: `GET /api/incidents` + `GET /api/events?limit=200`.
  - `/verify-flow` — **VerifyFlow** (3-step wizard at `Container width=narrow`). Steps: Sensor cluster → Anjali corroboration → Councillor notify. State is local (`useState<StepIndex>`); the advance/rewind buttons move between steps. `verify-steps` is a 3-column grid with `--active` / `--done` modifiers. Testids: `verify-flow-header`, `verify-steps`, `verify-step-{id}`, `verify-step-card`, `verify-seal`, `verify-advance-{next-id}`. New stylesheet `web/src/styles/verify.css` (tokens-only).
  - `/audit-log` — **AuditLog** (chain explorer at `Container width=wide`). Banner consumes the new `chainHead` from `AppLayoutContext` (no extra fetch). Seven filter chips via the existing `FilterChip` primitive (all / errors / signatures / sensor / citizen / notices / auth) — each has a count badge driven by `useMemo` over the events. Dense 40px rows, copy-to-clipboard on the block-hash cell, severity dot, Plex Mono throughout. Testids: `audit-log-summary`, `chain-head-hash`, `audit-filters`, `chip-{id}`, `audit-table`, `audit-row-{event_id}`, `audit-copy-{event_id}`, `audit-loading`. New stylesheet `web/src/styles/audit.css` (tokens-only).
  - `/settings` — **Settings** (preferences at `Container width=bangla`). Four `Card` sections: Theme (toggle via `useTheme()`), Language (toggle via `useLocale()`), Persona (read-only `session.role` + `display_name`), Reset (Danger `Button` → `resetEverything()` + page reload). Testids: `settings-{theme,locale,role,reset}-card`, `settings-{theme,locale}-{light,dark,en,bn}`, `settings-role-readout`, `settings-reset-button`. New stylesheet `web/src/styles/settings.css` (tokens-only).

- **FE-1.5:** `AppLayoutContext` extended with `chainHead: ChainHead | null` so pages can render the latest block head without re-fetching. `AppLayout` owns the single `/api/chain/head` poll loop and pushes the result into context. `ChainHead` is exported as an interface (block_hash, prev_hash?, height, ingested_at, sealed_at?).
- **FE-1.5:** `inboxListModel.ts` — the inbox row's default href now prefers `payload.incident_id` over `event_id`. The InboxDetail route expects an incident_id (it joins against `/api/incidents` by id), not the chain event_id. Pre-FE-1.5 the row's fallback linked `/inbox/{event_id}` which never matched the incidents projection.
- **FE-1.5:** Fixtures — the inboxFixture loop now embeds `inbox.href = \`/inbox/${payload.incident_id}\`` (overriding the placeholder `/inbox-detail` / `/verify-flow` / `/sensors` strings) so every inbox row resolves to a real detail URL.

### Fixed

- **FE-1.5:** AuditLog / InboxDetail — the `ChainEvent.actor_identity` field is a `{kind, ref, display}` object (per dim 7 §2.5), not a string. Both pages now render `actor_identity?.display ?? '—'` instead of crashing with "Objects are not valid as a React child".

### Tests

- **FE-1.5:** E2E suite now 32 specs (23 functional + 9 visual). New: 4 functional specs in `e2e/auth-routes.spec.ts` confirming each new Priya route renders its real page (not a `ComingSoonPage` stub) with the expected testid surface + the shared `AppLayout` chrome wrapping it exactly once. Settings spec also exercises the locale toggle (clicks `settings-locale-bn`, waits for `body[data-locale="bn"]`). New: 4 visual snapshots in `e2e/visual.spec.ts` for inbox-detail, verify-flow-step1, audit-log, settings (committed under `web/e2e/visual.spec.ts-snapshots/`).

### Changed

- **FE-1.5:** `App.tsx` route docblock + `<RoutedSurface>` updated to document + wire the 3 new routes (`/verify-flow`, `/audit-log`, `/settings`). All live inside the `<RequireSession>` layout route so they share the persistent sidebar + topchrome + logout.
- **B5:** Visual regression — 5 Playwright `toHaveScreenshot()` specs covering the 3 ship-ready surfaces × the 3 theme/locale combinations that matter (login dark/en, login dark/bn, login light/en, inbox, field). Strict matching with `maxDiffPixelRatio: 0.005` for sub-pixel anti-aliasing drift tolerance; animations disabled globally; chain freshness + toast region masked as time-varying. Snapshots committed under `web/e2e/visual.spec.ts-snapshots/` and refreshed via `--update-snapshots`. Total E2E suite is now 24 specs (19 functional + 5 visual).
- **B5:** Design token hardening — added 6 new tokens to `mockups/theme.css`: `--fg-on-status-light` / `--fg-on-status-dark` (white / dark text over severity fills), `--brand-on-color` / `--brand-on-color-strong` (text on the brand panel), `--brand-gradient-dark-from` / `--brand-gradient-dark-to` (the deep-navy gradient stops). Replaced all `#fff` / `#0e1013` / `#f5f7fa` / `#0b1a2a` / `#0f2236` literals in `inbox.css` + `app.css` with these tokens. Zero hex literals remain in `web/src/**/*.css`.
- **B5:** Motion tokens — added `--motion-press-120`, `--motion-tab-switch`, `--motion-pane-in` (durations) and `--ease-out`, `--ease-in`, `--ease-in-out` (cubic-beziers) to `theme.css`. Replaced inline `120ms ease-out`, `160ms ease-out` values in `components.css`, `app.css`, `tech.css` with the new tokens. The remaining 12 dim 8 tokens (modal-in, toast-pane-in, chart-new-point, shake-300, etc.) ship with their first consumer — see `web/src/styles/README.md`.
- **B5:** `web/src/styles/README.md` extended with a "Foreground on saturated backgrounds" section enumerating the new B5.1 tokens, a "Motion" section documenting the dim 8 subset we shipped, and a "Visual regression" section explaining the snapshot matrix and the `--update-snapshots` workflow.
- **B4:** Playwright 1.63 + `@playwright/test` wired under `web/e2e/`. Config targets Chromium only with `vite dev` + `VITE_USE_MOCKS=true` (the existing MSW service worker intercepts `/api/*` in the real browser). 11 specs cover the login round-trip, every authenticated route, persona-aware nav, the i18n bridge, and the ErrorBoundary fallback. Runs in CI as a separate `E2E` workflow (browser install + suite + artifact upload on failure).
- **B4:** Testids added to LoginPage persona radios (`persona-{id}`), Sidebar (`sidebar`, `nav-{slug}`), TopChrome (`top-chrome`, `persona-chip`), AppLayout (`app-layout`), and ComingSoonPage (`coming-soon-card`) so E2E selectors are stable across copy edits.
- **B4:** `pnpm audit` (runtime-only) + `pnpm audit:full` (all deps) + `pnpm outdated` scripts added to `web/package.json`.
- **B4:** Dependabot weekly config at `.github/dependabot.yml` with grouped PRs (`runtime-minor` / `build-minor` / `test-minor` / `lint-minor` / `actions-minor`) and major-version ignores for the 7 framework deps that need ADR-level review.
- **B4:** `web/src/styles/README.md` enumerates every CSS custom property under `:root` in `mockups/theme.css` with semantic meaning + lockdown contract reference, plus a "What is NOT a token" backlog for literals awaiting tokenization.
- **B4:** ADR 0006 captures the unit (Vitest) / E2E (Playwright) / visual (deferred) testing strategy and the dependency-hygiene policy (Dependabot grouping, audit scripts, design tokens README).
- **B4:** `.github/workflows/e2e.yml` runs the Playwright suite on push to master + PR, with browser install (`--with-deps`), 20-minute timeout, and `playwright-report` + `test-results` artifact uploads on failure.
- **B4:** `web/src/mocks/idb.ts` rewritten to open IndexedDB at an explicit version 2 with all four stores (`chain_blocks`, `chain_head`, `session`, `meta`) pre-declared in `onupgradeneeded`. Fixes the "object store not found" race where `idb-keyval`'s `createStore()` only creates the first store per DB. Bumped DB version to trigger the upgrade on existing dev databases that only had `chain_blocks`.
- **B4:** `web/src/mocks/session.ts` — `loginAs()` now writes `chip_label` through to the SessionRow so Karim's persona chip shows "Karim · field tech · NE zone" instead of his `display_name`. `logout()` split into a pure local clear + `logoutAndRedirect(navigate)` that performs the MSW POST, breaking the infinite-recursion cycle when the MSW logout handler also called `logout()`.
- **B4:** ESLint config override block for `e2e/**` — disables `react-hooks/rules-of-hooks` (Playwright's `use` fixture callback mis-classifies as a React hook) and `padding-line-between-statements`, plus relaxes unused-vars for destructured fixture args. `tsconfig.json` now includes `e2e/` + `playwright.config.ts`.

- **B3:** `i18next` + `react-i18next` integration. Namespaced JSON resources at `web/src/i18n/locales/{en,bn}/common.json` cover `app`, `common`, and `login` namespaces.
- **B3:** `useLocaleSync` bridge — when `useLocale()` flips, the bridge calls `i18next.changeLanguage` so `useTranslation` consumers stay in sync with `body[data-locale]`. The existing `useLocale` hook remains the single source of truth for the user preference.
- **B3:** LoginPage strings extracted into the `login` namespace: brand title, panel title, chain status (with `count` interpolation + pluralization keys for English one/other forms), picker status, heading, radiogroup label, Continue/Signing in labels.
- **B3:** Bangla translations for the `app`, `common`, and `login` namespaces.
- **B3:** `I18nextProvider` mounted in `main.tsx`; `useLocaleSync()` mounted in `AppShell`.
- **B3:** `useLocale` refactored to a `LocaleProvider` + `useLocaleContext` pattern. Previously each `useLocale()` call created independent state — `useLocaleSync` and the picker UI saw different values, so toggling the language in the UI never reached `i18next`. The provider makes the locale preference a single source of truth across all consumers.
- **B3:** 9 new Vitest checks under `web/src/__checks__/fe-b3-i18n.test.tsx` covering bootstrap, setLanguage idempotency, key translation, interpolation, and the LocaleSync bridge.

- **B2:** Top-level `ErrorBoundary` + `ErrorScreen` recovery UI. Any render-time exception in the SPA is caught and presented with a heading, the error name + message, a collapsible stack trace (in dev), `Reload page` and `Copy diagnostics` actions. Wrapped around `<BrowserRouter>` in `App.tsx` so even router errors don't white-screen.
- **B2:** `ToastProvider` + `useToast()` hook. App code can now call `toast.danger("…")` / `.warning` / `.info` / `.success` / `.dismiss(id)` / `.clear()` from anywhere; up to 5 toasts stack in the bottom-right region (`role="region"`, `aria-live="polite"`). Built on top of the existing `<Toast />` primitive (`durationMs` now overridable for tests).
- **B2:** Five ADRs (`docs/adr/0001-…0005`) capturing the foundational tech choices: React 18 + Vite, react-router-dom v6, React Context for state, CSS variables for styling, and pnpm.
- **B2:** Vitest coverage for ToastProvider (push / variants / dismiss / FIFO eviction / outside-provider throw) and ErrorBoundary (children render / fallback reveal / `onError` / custom fallback / reset).

- **B1:** MIT `LICENSE` at the repository root.
- **B1:** Keep-a-Changelog format `CHANGELOG.md` with seeded history below.
- **B1:** GitHub Actions CI workflow (`.github/workflows/ci.yml`) running `typecheck`, `lint`, `format:check`, `test --coverage`, and `build`.
- **B1:** Vitest coverage gate (v8 provider, report-only — no threshold enforcement yet, see ADR to follow).
- **B1:** Lefthook pre-commit hooks (Prettier + ESLint --fix) and commitlint (`commit-msg`) for Conventional Commits.
- **B1:** Prettier config and `eslint-config-prettier` integration so stylistic rules don't fight Prettier.

### Phase 1 — Foundations (already in master, history preserved below)

The following commits were on `master` before this changelog existed. They are
listed here so reviewers can trace the project's evolution; each entry maps to
one or more commits.

- **Story FE-1.6a · Root layout (`AppLayout`) extraction** — `0b6c8ef`
  - New `AppLayoutContext`, `AppLayout` shell, nav-config, and `Sidebar` props for `brandHref` / `footer`.
  - `session.ts` gains `logoutAndRedirect()`; routes refactored to consume the layout.
  - `OperatorDashboard`, `FieldQueuePage`, `InboxList`, `ComingSoonPage` simplified to layout consumers.

- **chore: strict ESLint v9 flat config + lint cleanup** — `77a921b`
  - Flat config with `typescript-eslint` strict preset, `react-hooks`, `react-refresh`, `jsx-a11y`.
  - Codebase-wide cleanup pass to make lint pass with `--max-warnings` allowed only at 0 errors.

- **fix · login page is the actual starting point, SPA-friendly** — `abd7972`
  - Router wired so `/` lands on the login picker; deep links resolve correctly on hard refresh.

- **Story 1.2 · Operator dashboard**
  - Three-variant dashboard (A / B / C) with persistent toggler.
  - Overview tab with KPI tiles + activity timeline; Handover / Notices / Sensors stub pages.

- **Story 1.1 · Login picker**
  - Five-persona picker (Priya, Anjali, Karim, Vendor, Public).
  - Cross-page context text wired; routing corrected per persona.

- **Story 1.0 · Phase 1 mocks + lockdown contracts**
  - MSW worker at `public/mockServiceWorker.js`; seed fixtures under `src/mocks/`.
  - `SEED_VERSION` bumped across handler iterations.
  - Dimensions locked: dim 3 (icon crispness), dim 4 (spacing/components), dim 5 (grid), dim 5b (data-viz), dim 6 (data formats), dim 7 (sensor wire format, ActorRole 9-entry + EventType 33-entry), dim 8 (motion).
  - Field-technician payload shapes added to dim 6 §6.

- **Phase 1 mockup batch**
  - 19 mockup surfaces built (5 personas), then UI-strip pass across all 19, then archived.
  - New `priya/` directory scaffolded for the live dashboard work.

- **Tooling**
  - Switched `web/` package manager from npm to pnpm (`packageManager: pnpm@9.12.3`).
  - Installed `react-router-dom`, `vitest`, `@testing-library/react`, MSW, and related test infra.

## [0.1.0] — 2026-01-15

Initial scaffold.

- React 18 + Vite 5 + TypeScript 5 (`strict: true`) SPA shell.
- Design tokens via CSS variables and a single `components.css` foundation.
- Mockup-first workflow established with dim-by-dimension lockdown contracts.
