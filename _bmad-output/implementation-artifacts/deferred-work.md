- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md`
  summary: FE-1.1b — install react-router-dom v6 + create `web/src/types/domain.ts` + register dev-only `/styleguide` route that showcases all 10 foundation components
  evidence: FE-1.1 was 13+ new files (3,400 tokens, 2x the 1,600 ceiling). Splitting FE-1.1a (10 components + 2 hooks) from FE-1.1b (styleguide + dep + types) keeps each spec ≤1,600 tokens and lets the implementer ship the library first, the showcase second. FE-1.1b depends on FE-1.1a (every component must exist before styleguide can render it) and is a prerequisite for FE-1.2 (uses react-router-dom).

  **SHIPPED 2026-09-08:**
  - `react-router-dom@^6.28.0` installed as runtime dep.
  - `web/src/App.tsx` rewritten as `<BrowserRouter>` + `<Routes>` with:
    - `/styleguide` route (`import.meta.env.DEV` guarded; stripped from production)
    - `/field` guarded on `field_technician` role (Story 1.2 back-compat)
    - `/inbox` + `/dashboard` guarded on `utility_operator` role (Story 1.3 back-compat)
    - `/` + catch-all → `<LoginPage />`
  - `useTheme` + `useLocale` mounted at App root via new `<AppShell>` wrapper so `document.body.dataset.theme` / `dataset.locale` are live before any page renders.
  - New `web/src/pages/StyleguidePage.tsx` (~340 lines): interactive showcase of all 10 primitives in 8 sections (Container, Button, Input, Card, Modal, Toast, BandPill, EmptyState, TopChrome+Sidebar). Live theme/locale toggles, Modal Esc/focus-trap demo, Toast hover-pause demo, all 4×3 Button matrix, all 3 Container widths, all 4 Toast variants, all 3 BandPill bands, 2 EmptyState headingLevel patterns.
  - New `web/src/styles/styleguide.css`: shell layout (280px sidebar + 1fr main), section/row scaffolding, mobile floor at 767px, token-only composition.
  - **Still pending in FE-1.1b:** vitest + @testing-library/react + @testing-library/dom + jsdom devDeps and `web/src/__checks__/fe-1-1a-vitest.test.ts` (5 I/O Matrix rows + 5 amended-AC checks). The showcase landed first; tests ship next.

  **Dev URL:** http://localhost:5174/styleguide (port auto-shifted from 5173 because the dev server was already running).

  **Files touched (3 new + 2 edited):**
  - NEW: `web/src/pages/StyleguidePage.tsx` (340 lines)
  - NEW: `web/src/styles/styleguide.css` (95 lines)
  - NEW: this entry update
  - EDIT: `web/src/App.tsx` (47 → 110 lines)
  - EDIT: `web/package.json` (added react-router-dom dep)

  **Typecheck:** 7 pre-existing baseline errors (unchanged); 0 new errors from FE-1.1b.

  **RESOLVED 2026-09-08 by FE-1.1c:** the vitest + @testing-library/react + @testing-library/dom + jsdom devDeps that FE-1.1b listed as "still pending" landed in this entry's companion FE-1.1c story. The companion entry below supersedes the "Still pending in FE-1.1b" line.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-1c-vitest-tests.md`
  summary: FE-1.1c — install vitest 3.x + @testing-library/react + @testing-library/dom + jsdom + ship 19-case test harness for the FE-1.1a foundation library (5 I/O Matrix rows + 5 amended ACs + 9 defense-in-depth extras).
  evidence: AC-12 of FE-1.1a required the test scaffold deferred here. FE-1.1c ships it: 4 devDeps added to `web/package.json`, `web/vitest.config.ts` configured with `globals: false` + jsdom env + the project's `@`/`@mocks` path aliases, `pnpm test` script added, and `web/src/__checks__/fe-1-1a-vitest.test.tsx` (553 lines, 8 describe groups, 19 `it` blocks) covers Modal focus trap + restore, Toast RAF pause math, useTheme/useLocale body-dataset mount, Container mobile floor via CSS readback, Input/SearchInput testid decoupling, Card modifier/heading independence (defends FE-1.1a bad_spec #6), EmptyState headingLevel, Sidebar duplicate-href safety via `${href}:${i}` key. **Verification:** `pnpm test` → 19 passed across 8 describe groups (exit 0, ~2.8s). `pnpm typecheck` → 7 pre-existing baseline errors, **0 new** from FE-1.1c.

  **SHIPPED 2026-09-08:**
  - `vitest@^3.2.7`, `@testing-library/react@^16.3.3`, `@testing-library/dom@^10.4.1`, `jsdom@^30.0.1` installed as devDeps (Vitest 4+ requires Vite ≥6.4.0; stack pins Vite 5.4.21 → 3.x is the documented compatibility matrix).
  - `web/vitest.config.ts` (17 lines): jsdom env, `globals: false`, `include: ['src/**/*.test.{ts,tsx}']`, mirrors `vite.config.ts` aliases.
  - `web/src/__checks__/fe-1-1a-vitest.test.tsx` (553 lines, 8 describe groups, 19 `it` blocks). 4 review-loop-1 patches applied (Modal focus-restore test, Container `--space-md` padding-inline regex, Toast test docstring clarity, dataset cleanup via `delete` not `=`).
  - `web/package.json` `"test": "vitest run"` script added.

  **Files touched (2 new + 2 edited):**
  - NEW: `web/vitest.config.ts` (17 lines)
  - NEW: `web/src/__checks__/fe-1-1a-vitest.test.tsx` (553 lines)
  - EDIT: `web/package.json` (+1 script, +4 devDeps)
  - EDIT: `_bmad-output/implementation-artifacts/deferred-work.md` (this entry update)

  **Still pending (defense-in-depth follow-ups, NOT blockers for AC-12):**
  - SearchInput aria-label fallback when no placeholder is provided (current contract: `placeholder ?? 'search'`).
  - Toast `DURATION_MS=4000` boundary tests at 3999 ms (no fire) and 4001 ms (fire).
  - EmptyState `headingLevel` boundaries at 1 and 5 (current contract: 2|3|4).
  - SSR `typeof window === 'undefined'` branch coverage on the body-level hooks.
  - `@vitest/coverage-v8` config + Button/BandPill/TopChrome coverage tests.
  Belong in a future story so FE-1.1c's scope stays bounded.
