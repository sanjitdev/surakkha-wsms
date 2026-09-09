# 0006 — Testing strategy (Vitest + Playwright + MSW; no visual yet)

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

After B1–B3 we have:

- **49/49 Vitest unit + integration tests passing** under
  `web/src/__checks__/` — primitives (`Card`, `Button`, `Input`,
  `Modal`, `Toast`, `Badge`, `Icon`), hooks (`useTheme`, `useLocale`),
  the i18n bridge, `ToastProvider`, `ErrorBoundary`, `InboxRow`,
  `FilterChip`.
- **MSW intercepts `/api/*`** via `web/public/mockServiceWorker.js`,
  activated only when `VITE_USE_MOCKS=true` (see `web/src/main.tsx:25`).
- **6 personas** wired through the login picker with deterministic
  landings (`landingFor()` in
  `web/src/components/layout/nav-config.tsx:89`).
- **3 real surfaces** built (`/dashboard`, `/inbox`, `/field`) +
  **4 ComingSoonPage placeholders** (`/submit`, `/approve`, `/audit`,
  `/vendor`) all wrapped in the shared `<AppLayout>` chrome.
- **No browser-driven confidence.** Every existing test renders into
  jsdom, which has no IndexedDB persistence, no real MSW service
  worker, no `<AppLayout>` shell. We have caught zero bugs that only
  surface in a real browser (the B3 `useLocaleSync` bug where two
  `useLocale` instances had independent state is the closest miss —
  vitest caught it only after I added a LocaleProvider refactor; the
  bridge test in jsdom passed before that).
- **No proactive dependency hygiene.** `pnpm audit` isn't wired, no
  Dependabot config, no documented design tokens. A future CVE in
  one of the 30 runtime + dev deps will only surface when someone
  manually runs `pnpm audit`.

We need a testing strategy that catches the bugs jsdom cannot, while
keeping the fast feedback loop for unit work (under 30s for the
Vitest run).

## Decision

We adopt a **three-tier testing strategy**, deferring visual regression
to a later batch:

### Tier 1 — Vitest + jsdom + RTL (unit + integration)

- Scope: primitives, hooks, small integration surfaces (ToastProvider,
  ErrorBoundary, i18n bridge, filter chips, inbox row rendering).
- Speed: ~25s for the full Vitest run including setup + transforms.
- Pattern: `web/src/__checks__/*.test.tsx`. Tests follow the existing
  style in `fe-1-1a-vitest.test.tsx` — plain `expect(...).toBeTruthy()`,
  `querySelector` for class assertions, no `@testing-library/jest-dom`
  matchers (keeps the project's TS setup lean).
- Coverage: soft 60% gate via `@vitest/coverage-v8` (B1.5).
  Coverage is reported, not enforced — see Consequences below.

### Tier 2 — Playwright + real Chromium + MSW (E2E)

- Scope: full-route flows with real IndexedDB, real MSW service worker,
  real router, real `<AppLayout>` shell. Lives under `web/e2e/*.spec.ts`.
- Speed: ~30-45s for 8 specs after browser install (browser install
  is one-time per CI runner).
- Config: Chromium only (Firefox/WebKit deferred — we have no
  Safari-specific CSS; if a Safari bug bites, we add a project).
  `webServer.command: 'pnpm dev --mode e2e'` starts Vite with
  `VITE_USE_MOCKS=true` so MSW is active.
- Fixtures: `web/e2e/fixtures.ts` exposes `loginAs(personaId)` —
  navigates to `/`, clicks the persona radio by
  `data-testid="persona-{id}"`, clicks Continue, waits for
  `[data-testid="app-layout"]` to mount. Each spec gets a fresh
  `BrowserContext` (the isolation boundary — no manual IDB cleanup).
- Specs covered (B4.4):
  - `login.spec.ts` — picker renders 6 personas, Priya → `/inbox`,
    Karim → `/field`, logout, malformed session fallback, unauth
    redirect.
  - `auth-routes.spec.ts` — every authenticated route's chrome
    renders, persona-aware nav, placeholder routes, chain poll
    alive across navigation.
  - `i18n-bangla.spec.ts` — `localStorage.surakkha.locale = "bn"` +
    reload flips the picker to Bangla.
  - `errorboundary.spec.ts` — ErrorBoundary catches session-bootstrap
    failures; chrome survives a flaky chain poll.

### Tier 3 — Visual regression (Playwright + pixelmatch)

- **Deferred to B5+.** The LoginPage persona radios didn't have
  testids until B4.2, and several components have inline literal
  values (see "What is NOT a token" in `web/src/styles/README.md`)
  that will be tokenized in B5. Snapshot diffs now would produce
  noisy PRs that get rubber-stamped. Revisit once the design
  tokens are stable AND every primitive that ships UI has a
  testid.

### Dependency hygiene (P3)

- `pnpm audit --prod --audit-level=moderate` (`pnpm audit`) +
  `pnpm audit --audit-level=moderate` (`pnpm audit:full`) +
  `pnpm outdated` scripts in `web/package.json`. Not wired into
  CI as a blocking check — just available locally + in the Dependabot
  PR template.
- `.github/dependabot.yml` opens a weekly grouped PR for npm
  (`runtime-minor` / `build-minor` / `test-minor` / `lint-minor`)
  and GitHub Actions updates. Major-version bumps for the 6 framework
  deps that ship the contract (react, react-dom, react-router-dom,
  vite, vitest, @vitejs/plugin-react, @playwright/test) are ignored
  — those need an ADR + manual review.
- `web/src/styles/README.md` enumerates every CSS custom property
  under `:root` in `mockups/theme.css` with semantic meaning +
  lockdown contract reference.

### CI integration

- `web/.github/workflows/ci.yml` — typecheck, lint, format:check,
  Vitest + coverage, build. Runs on every push + PR to master.
- `web/.github/workflows/e2e.yml` — separate workflow, Playwright
  on real Chromium with browser install + `pnpm test:e2e` +
  uploads `playwright-report` + `test-results` on failure. Runs in
  parallel with CI (different concurrency group).

## Consequences

### Becomes easier

- **Bug classes that need real IndexedDB / MSW / router** are now
  caught: session round-trip, persona-aware nav, malformed session
  fallback, login redirect, i18n bridge round-trip, ErrorBoundary
  recovery.
- **Dependency CVEs surface within 7 days** via the Dependabot
  weekly PR.
- **Future code review** has a stable enumeration of design tokens
  to reason about (no more "is this color locked?" guessing).
- **Visual regression is ready when we are** — the design tokens
  README is the precursor; once components consume tokens only,
  pixelmatch will produce meaningful diffs.

### Becomes harder

- **CI runtime grows** by ~90s (browser install) + ~45s (suite).
  This is the cost of confidence; we accept it.
- **Coverage % stays low.** `@vitest/coverage-v8` only sees the
  Vitest run; Playwright specs run in real Chromium and aren't
  picked up. Promotion to a hard threshold is a B5 problem — we
  document this here rather than gate on a metric that doesn't
  reflect the Tier 2 suite.
- **Dependabot weekly PRs add reviewer load.** Mitigated by
  grouping into `runtime-minor` / `build-minor` / `test-minor` /
  `lint-minor` so a single PR covers ~5-10 patch-level bumps.
- **E2E spec maintenance.** Playwright selectors depend on
  testids — if a future refactor renames `persona-priya` to
  `persona-operator`, the spec fails loudly with "no element
  found". This is preferable to silent UI-coupling (using
  `getByText('Priya — Utility Operator')` breaks on copy edits).

### Neutral

- **jsdom limitations remain.** No layout engine, no real
  IndexedDB persistence. Vitest specs that need real persistence
  get promoted to Playwright (e.g. the original `loginAs`
  integration test became `e2e/login.spec.ts`).
- **MSW version pinned at v2.15**. Upgrades land via Dependabot;
  the worker regeneration step (`pnpm mocks:init`) is the only
  manual touch required when MSW ships a worker change.

## Alternatives Considered

- **Cypress instead of Playwright** — Cypress has better DX but
  MSW's service worker doesn't work in Cypress's iframe-based
  runner. Playwright uses a real Chromium where MSW's SW is
  first-class. Rejected on MSW compatibility.
- **Storybook + Chromatic for visual regression** — would replace
  Tier 3 above with a hosted service, but the cost ($$$) and
  external dep outweigh the benefit at Phase 1 scale. Rejected
  until we have external consumers (Phase 2).
- **Run Vitest + Playwright in the same CI workflow** — the
  combined job would timeout (>20min) and serializes the fast
  Vitest feedback behind the slow browser install. Splitting
  into `ci.yml` + `e2e.yml` with parallel concurrency groups
  gives Vitest PRs a ~90s total runtime while the E2E suite
  takes 2-3min in parallel.
- **Hard 60% coverage gate now** — would force writing test
  scaffolding for routes/components that the E2E suite already
  covers via the full router. Promotion belongs in B5 when we
  decide between (a) Vitest route-level tests with MemoryRouter
  + mocked idb, or (b) Playwright coverage collection via
  `@playwright/test`'s `coverage` option.
- **Visual regression now (B4)** — components still have literal
  hex/px values (see "What is NOT a token" in the design tokens
  README). Snapshot diffs would surface those as noise. Defer to
  B5.
