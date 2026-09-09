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

- **B1 (in progress):** MIT `LICENSE` at the repository root.
- **B1 (in progress):** Keep-a-Changelog format `CHANGELOG.md` with seeded history below.
- **B1 (planned):** GitHub Actions CI workflow (`.github/workflows/ci.yml`) running `typecheck`, `lint`, `test --coverage`, and `build`.
- **B1 (planned):** Vitest coverage gate (v8 provider, soft 60 % line threshold).
- **B1 (planned):** Lefthook pre-commit hooks (Prettier + ESLint --fix) and commitlint (`commit-msg`) for Conventional Commits.
- **B1 (planned):** Prettier config and `eslint-config-prettier` integration so stylistic rules don't fight Prettier.

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
