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
