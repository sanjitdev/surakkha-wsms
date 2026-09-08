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
