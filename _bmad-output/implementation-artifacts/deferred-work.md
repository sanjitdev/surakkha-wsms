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

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md`
  summary: FE-1.5b review-loop-1 — InboxList bulk-bar transition coverage (selectedRows toggle / select-all / bulk-bar appear + disappear). Page-level interaction test, not a primitive test.
  evidence: FE-1.5b ships 9 primitive tests for InboxRow + FilterChip; the bulk-bar's `hidden={selectedRows.size === 0}` lifecycle and the per-row + select-all toggle semantics are exercised only by manual QA in dev. Spec I/O row "HAPPY_PATH_select" claims bulk-bar appears with `<strong>{N}</strong> selected` but no test asserts that. Page-level integration tests are explicitly out of scope for FE-1.3a primitives.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md`
  summary: FE-1.5b review-loop-1 — InboxList page-level integration test (renders 6 fixture rows, narrows to 1 on T3 chip, recovers from /api/events 500 via EmptyState, renders Bangla chrome). All 6 spec I/O matrix rows need an RTL + MSW integration test.
  evidence: FE-1.5b ships primitive tests; the page composition (Sidebar active marker, TopChrome chain-fresh slot, filter chip aria-selected flow, severity rail counts, awaiting-action rail) is untested. Spec promises all 6 I/O matrix rows work; without integration tests, a future refactor of InboxList.tsx could break any of them silently.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md`
  summary: FE-1.5b review-loop-1 — App.tsx `/inbox` route assertion (verify utility_operator session lands on InboxList, not LoginPage or OperatorDashboard).
  evidence: The one-line App.tsx edit swapped `<OperatorDashboard />` for `<InboxList />` at `/inbox` but no test asserts the route branch. Belongs in the FE-1.5c route-test follow-up so the test scaffold lives next to the persona-aware router.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-5b-inbox-list.md`
  summary: FE-1.5b review-loop-1 — sweep inbox.css for stray CSS literals (`#fff`, `#0E1013`) and replace with `var(--*)` tokens. Lock the file to the dim 1 token surface.
  evidence: inbox.css was written to compose primitives but slipped two hex literals; reviewers flagged them. The dim 4 lockdown requires every visual value to be a `var(--*)` reference. A dedicated CSS lockdown pass is the right home for this.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-5b-review-loop-followups.md`
  summary: FE-1.5b review-loop D2/D3/D4 follow-up — append I/O matrix integration tests (5 cases), `/inbox` route source-assertion (1 case), and CSS literal lockdown verification to `web/src/__checks__/fe-1-5b-inboxlist.test.tsx`. Also append the matching CHANGELOG `### Tests` + `### Changed`/`Fixed` bullets. Bundle target: ~1,400 tokens.
  evidence: User chose to split the over-ceiling FE-1.5b review-loop follow-ups spec (1,700–2,100 tokens) into 2 specs at the 1,600-token ceiling gate. This spec ships D1 (bulk-bar, ~80 lines, 2 cases) alone; the remaining D2 (I/O matrix), D3 (route assertion), and D4 (CSS literal verification) ship as a follow-up so each spec stays ≤1,600 tokens. D2/D3/D4 are independently shippable and the file split is deferred to that follow-up.

- source_spec: none
  summary: FE-1.3c sub-goal C — migrate InboxList from `/api/events?event_type=IncidentCreated` (chain-event log) to `/api/incidents` (projection) once `useIncidents()` ships.
  evidence: User chose the "Maximal: hook + 3 consumers + shape migration" scope for FE-1.3c, then chose "S — split into A/B then C" because the combined scope (~2,500 tokens) exceeds the 1,600-token ceiling. FE-1.3c ships sub-goals A+B (hook creation + OperatorDashboard + InboxDetail migration, ~1,400 tokens). Sub-goal C (InboxList shape migration: reshape `buildRows` to consume `IncidentSummary`, update fixtures + 4 inbox-row test cases + 8 InboxRow primitive tests) is independently shippable and deferred to a follow-up spec. Touches `InboxList.tsx`, `inboxListModel.ts`, fixtures, `fe-1-5b-inboxlist.test.tsx`, and possibly `fe-1-3a-vitest.test.tsx`.

- source_spec: none
  summary: FE-1.3c remaining hook layer — `useChain`, `useIncident` (singular), `useSensors`, `useEvents`, `useSessionRole`, plus `web/src/hooks/_registry.ts` per the FE-1 epic context.
  evidence: FE-1.3c ships only `useIncidents.ts` + the 2 consumers that already use `/api/incidents` (OperatorDashboard, InboxDetail). The remaining hooks layer (Layer C from the frontend architecture spine) is a separate concern — each hook calls a different endpoint and consumes a different domain shape. Bundling them would push FE-1.3c well over the 1,600-token ceiling and create 5+ cross-cutting consumers to migrate in one PR. The hook layer should land one hook per spec (FE-1.3d, FE-1.3e, ...) so each migration has tight blast radius.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-3c-useincidents-hook.md`
  summary: FE-1.3c follow-up — harden `IncidentSummary.last_block_height` against future `bigint` wire drift (block heights on a real chain exceed `Number.MAX_SAFE_INTEGER`).
  evidence: FE-1.3c typed `last_block_height: number` verbatim from the MSW handler (`web/src/mocks/handlers.ts:443-461`). Phase 1 fixtures use small integers (101/102/103), so no current test fails, but a real gateway wire will emit `bigint` (or a JSON-stringified bigint) and the cast will silently lose precision. The hook should either accept `number | string` and coerce, or surface a runtime warning, before any real backend integration ships. Blind-Hunter finding from FE-1.3c review.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-1-3c-useincidents-hook.md`
  summary: FE-1.3c follow-up — surface `incError` in InboxDetail so a failed incidents fetch renders a fetch-failure UI instead of "Incident not found".
  evidence: FE-1.3c returns `{ incidents, loading, error }` from the hook and `InboxDetail.tsx` consumes all three, but the page treats `incidents=[]` after a 500 the same as "no incident exists" — both branches render `<IncidentNotFound />`. Spec boundary deferred error UX to a follow-up; sub-goal C (InboxList migration) is the natural home since it already reshapes the page's loading/error handling around `IncidentSummary`. Edge-Hunter finding.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md`
  summary: FE-B5a follow-up — auto-flip the dropdown popover when it would overflow the viewport bottom; shift horizontally when it would overflow the viewport right.
  evidence: B5a ships the popover rendered as a sibling of the trigger with no viewport collision logic. When the dropdown is near the bottom of the viewport (e.g., the last row in a long table filter), the popover currently flows off-screen. The CSS already slots a mobile bottom-sheet at 767px, so the desktop auto-flip logic is a focused enhancement. Edge-Hunter finding; defer until B5b ships a real Table consumer that triggers the overflow.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md`
  summary: FE-B5a follow-up — `aria-controls` on the combobox trigger should also reference the search input id when `searchable` is true.
  evidence: B5a wires `aria-controls={listboxId}` only; when the search input is enabled, the trigger does not declaratively link to the search field. WAI-ARIA combobox pattern recommends declaring both controls so AT can navigate them. The search input is reachable via Tab, so the omission is not blocking, but tightening the linkage belongs in a follow-up so B5a's scope stays bounded.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md`
  summary: FE-B5a follow-up — outside-click closes the popover but does not restore focus to the trigger (Escape does). Consider a click-outside variant that mimics the Escape path for keyboard parity.
  evidence: B5a's outside-click handler in `useDropdownState.ts` resets `open`/`activeIndex`/`query` but skips the `queueMicrotask(() => triggerRef.current?.focus())` that `close(true)` runs. This means the user clicks elsewhere → focus stays on the document body → Tab order restarts from the top. Escape already restores focus. Decoupling the focus-restore decision belongs in a follow-up that surveys keyboard ergonomics across all primitive dialogs (Modal, Toast, future Combobox async).

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md`
  summary: FE-B5a follow-up — type-ahead on closed trigger matches the first option starting with the typed char; cycling through subsequent matches requires adding a `lastTypedAt` timestamp + a small buffer.
  evidence: B5a's type-ahead branch (useDropdownKeyboard.ts:41-52) uses a single keystroke → first match. The WAI-ARIA APG notes that rapid-fire typing within ~500ms cycles through all options starting with the typed prefix ("Dh", "Dha", "Dhak" → all Dhaka-prefixed matches). Today only the first match is highlighted. Belongs in a follow-up that bundles type-ahead enhancements across primitives.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md`
  summary: FE-B5a follow-up — keyboard type-ahead on the trigger should reset the searchable `query` state when the popover opens via keyboard (not the search input).
  evidence: B5a's type-ahead branch calls `setOpen(true)` + `setActiveIndex(idx)` but does not clear `query`. If the user previously typed "dh" then closed the popover and re-opened it with the keyboard, "dh" is still in the filter input. Minor inconsistency; cleanup belongs in a follow-up.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5d — consumer migration: replace the bespoke `<table className="data-table">` markup in `OperatorDashboard.tsx`, `InboxList.tsx`, and `AuditLog.tsx` with the `<Table>` primitive. One sub-spec per consumer.
  evidence: B5b's "Never" boundary explicitly forbids source edits to the page consumers so the primitive lands with zero blast radius. The three pages each hand-roll sort logic, select-all checkboxes, and pagination — the whole reason B5b exists. Each migration reshapes a different row model (`IncidentSummary` for the dashboard, the inbox row model for InboxList, chain events for AuditLog) and touches that page's existing test file, so bundling all three would blow the 1,600-token ceiling and create a 3-page blast radius in one PR.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — column resize state is keyed by column key and never resets when the `columns` array changes identity. Adding/removing a column leaves stale widths in `useTableResize`'s `Record<string, string>`.
  evidence: `useTableResize.ts` holds `useState<Record<string, string>>({})` with no effect that prunes keys absent from the current `columns`. Today every FE-1 consumer passes a static `columns` const so no test fails, but a future column-picker UI (show/hide columns) would leak widths for hidden columns and re-apply them on re-show. The documented workaround is remounting via a `key` prop on `<Table>`; a proper fix prunes the record in a `useEffect` keyed on the column-key list. Edge-Hunter finding.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — `useTableSort`'s comparator returns 0 for ties, and `Array.prototype.sort` stability is relied on implicitly. Non-primitive cell values (objects, arrays, Dates) sort as equal because `stringify` returns `''` for them.
  evidence: The `stringify(v)` helper added in the review patch explicitly returns `''` for anything that is not `string`/`number`/`boolean`, which silences `@typescript-eslint/no-base-to-string` but means a `sortable` column whose cell is a `Date` or a nested object sorts every row as tied. B5b's fixtures are all primitives so no test catches it. The fix is either a per-column `sortAccessor?: (row: T) => string | number` escape hatch or a `Date` branch in `stringify`. Blind-Hunter finding.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — select-all only toggles rows on the current page; there is no tri-state (indeterminate) header checkbox for the partial-selection case.
  evidence: `TableHeader.tsx` renders `checked={allSelected}` with no `indeterminate` DOM property wiring (which React only exposes via a ref, not a JSX attribute). When 2 of 3 rows are selected the header checkbox reads unchecked, which is misleading. The WAI-ARIA grid pattern and every mature data table ship the mixed state. Deferred because it needs a `useRef` + `useEffect` on the input node and a matching Vitest case that reads `.indeterminate`.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — column resize is mouse-only. No keyboard affordance and no touch (`pointerdown`/`touchstart`) support on the `role="separator"` handle.
  evidence: `useTableResize.ts` binds `mousedown` on the handle and window-level `mousemove`/`mouseup`. The handle carries `role="separator"` + `aria-orientation="vertical"` + `aria-valuenow` but has no `tabIndex` and no Arrow-key handler, so keyboard and touch users cannot resize at all. The WAI-ARIA window-splitter pattern specifies Left/Right arrows adjust by a step and Home/End jump to min/max. Deferred so B5b's mouse path ships first; the a11y hardening pass should cover Dropdown's popover and Table's resize handle together.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — row virtualization for tables over ~1,000 rows, plus a sticky first column on horizontal scroll.
  evidence: B5b's "Out of scope" section defers both. The mobile floor at 767px switches the table to horizontal scroll, at which point the identifier column scrolls out of view and rows become unreadable — the audit-log timeline is the first real consumer that will need `position: sticky; left: 0` on column 0. Virtualization is unproven need: no FE-1 endpoint currently returns more than ~500 rows, so the follow-up should benchmark a real query before pulling in windowing logic.

- source_spec: `C:/ZDrive Folders/E2E_Training/Surakkha/_bmad-output/implementation-artifacts/spec-fe-b5b-table.md`
  summary: FE-B5b follow-up — wire `onSortChange` to a server-side sort round-trip and add a `sortMode: 'client' | 'server'` prop so the Table stops re-sorting rows the server already ordered.
  evidence: `Table.tsx` always applies its `sortedRows` `useMemo` comparator, even when the consumer is fetching pre-sorted pages from the gateway. The callback surface for server-side sort exists but the opt-out does not, so a server-sorted consumer would sort twice (harmless for a full dataset, wrong for a paginated slice — page 2 of a server-sorted set would be re-sorted within the slice only). Ships naturally alongside B5d's AuditLog migration, which is the first consumer with a server-ordered query (`block_height desc`).
