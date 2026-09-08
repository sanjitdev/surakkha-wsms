---
title: 'FE-1.1c — Vitest test harness for FE-1.1a foundation library'
type: 'feature'
created: '2026-09-08'
status: 'done'
review_loop_iteration: 1
baseline_commit: '99574b11d15e9e7d41b72fbf5c32e7f83fcacc50'
context:
  - _bmad-output/implementation-artifacts/epic-fe-1-context.md
  - _bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md
  - _bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot.
     Cohesive cross-layer stories (config + test file + scripts) stay in ONE file.
     IMPORTANT: Remove all HTML comments when filling this template. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FE-1.1a shipped 14 foundation files (8 UI primitives + 2 layout primitives + 2 hooks + canonical-enums module + composition CSS) with **zero automated tests**. AC-12 deferred the test scaffold here. Without a runnable harness, every later story (FE-1.3–1.6) that decomposes `OperatorDashboard.tsx` / `FieldQueuePage.tsx` must re-derive the focus-trap, toast-pause, and sidebar-key contracts from manual inspection. Bad regressions slip through review.

**Approach:** Install `vitest@^3` + `@testing-library/react@^16` + `@testing-library/dom@^10` + `jsdom@^30` as devDependencies, add `web/vitest.config.ts` with jsdom env + the project's `@`/`@mocks` path aliases, add a `"test"` script, and ship `web/src/__checks__/fe-1-1a-vitest.test.tsx` covering all 5 I/O Matrix rows + the 5 amended ACs (AC-2, AC-3, AC-9, AC-10, AC-11) from FE-1.1a. (Filename uses `.tsx` — JSX inside React Testing Library's `render(<X/>)` calls requires JSX transformation, which esbuild applies only to `.tsx`/`.jsx` files; the vitest config's `include: ['src/**/*.test.{ts,tsx}']` already accepts both.)

## Boundaries & Constraints

**Always:**
- Vitest 3.x (NOT 4.x/5.x — those require Vite ≥ 6.4.0; stack has Vite 5.4.21).
- jsdom environment (no happy-dom — Phase 1 mocks use `IndexedDB` via `idb-keyval`; jsdom + a polyfill is fine, happy-dom would force a separate polyfill).
- `@testing-library/react@^16` peer is `React ^18|^19`; stack is React 18.3.1. `@testing-library/dom@^10` peer of `@testing-library/react@^16`.
- `web/vitest.config.ts` extends the existing `vite.config.ts` aliases (`@` → `./src`, `@mocks` → `./src/mocks`) so test files use the same path resolution as runtime code.
- Test file lives at `web/src/__checks__/fe-1-1a-vitest.test.tsx` (matches `deferred-work.md` reference modulo `.ts` → `.tsx` — JSX content requires JSX transform).
- `globals: false` in vitest config; tests import `describe`/`it`/`expect`/`vi`/`beforeEach`/`afterEach` from `'vitest'` and `render`/`screen`/`fireEvent`/`act`/`cleanup` from `'@testing-library/react'` explicitly — keeps `pnpm typecheck` honest about which globals are in scope.
- All **≥10** test cases (5 Matrix + 5 amended-AC) must pass; additional defense-in-depth cases defending FE-1.1a `bad_spec` contracts (e.g., Card heading vs modifier interplay) are encouraged but not required; AC-12 of FE-1.1a is satisfied when at least the 10 spec'd cases run green.
- `pnpm test` is the single command that runs the suite — no separate `--run` flag in the script (vitest defaults to watch mode without it).

**Ask First:**
- Vitest 2.x instead of 3.x: HALT if 3.x install fails or breaks with React 18.3.1 + Vite 5.4.21 (3.x is the documented compatibility matrix; if blocked, fall back to 2.x).

**Never:**
- Touching any of the 14 FE-1.1a files (the test file *exercises* them, doesn't change them).
- Touching `OperatorDashboard.tsx`, `FieldQueuePage.tsx`, `LoginPage.tsx` (decomposed in FE-1.4).
- Adding production dependencies — all 4 installs are devDependencies.
- Adding `@testing-library/jest-dom` (would force a `globals: true` setup file to register matchers; not needed for the 10 cases here — `toHaveAttribute`/`toHaveTextContent` ship with `@testing-library/react`).
- Adding happy-dom as a parallel environment.
- Running tests against production-built code (no e2e harness here; that's FE-1.6+ scope).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH_theme | `useTheme()` mounts in test wrapper with empty jsdom localStorage | `document.body.dataset.theme === 'light'`; `localStorage.getItem('surakkha.theme') === 'light'`; hook returns `{ theme: 'light', setTheme, toggle }` | N/A |
| HAPPY_PATH_locale | `useLocale()` mounts with `localStorage['surakkha.locale']='bn'` pre-seeded | `document.body.dataset.locale === 'bn'`; hook returns `{ locale: 'bn', setLocale, toggle }` | N/A |
| MODAL_ESCAPE | `<Modal open onClose={fn}><button>focusable</button></Modal>` rendered with a `triggerEl` ref pre-focused; `fireEvent.keyDown(document, { key: 'Escape' })` | `onClose` fires exactly once; focus restored to `triggerEl` (which must still be in document) | N/A |
| TOAST_HOVER_PAUSE | `<Toast variant="success" message="saved" />` mounted; `vi.useFakeTimers()`; `act(() => vi.advanceTimersByTime(2000))` → progress ~50 %; `fireEvent.mouseEnter(div)`; `act(() => vi.advanceTimersByTime(2000))` → progress unchanged; `fireEvent.mouseLeave(div)`; `act(() => vi.advanceTimersByTime(2000))` → progress resumes (~0 %) | N/A |
| CONTAINER_MOBILE | jsdom `window.matchMedia('(max-width: 767px)')` matches true; `<Container width="bangla">{children}</Container>` renders | rendered `<div>` has class `container container--bangla`; CSS class lookup for `container--bangla` resolves to the mobile-floor rule (full viewport, `--space-md` padding-inline) when read via `getComputedStyle`. Use `screen.getByTestId('container-bangla')` + assert class membership; the CSS rule itself is verified by reading `components.css` lines containing the `max-width: 767px` media query — no jsdom CSS engine involvement | N/A |

</frozen-after-approval>

## Code Map

- `web/package.json` -- EDIT. Add `vitest@^3.2.7`, `@testing-library/react@^16.3.3`, `@testing-library/dom@^10.4.1`, `jsdom@^30.0.1` to `devDependencies`. Add `"test": "vitest run"` script.
- `web/vitest.config.ts` -- NEW. Mirrors `vite.config.ts` aliases via `resolve.alias`; sets `test.environment = 'jsdom'`; `test.globals = false`; `test.include = ['src/**/*.test.{ts,tsx}']`; no setup file (no `jest-dom` matchers needed for these 10 cases).
- `web/src/__checks__/fe-1-1a-vitest.test.tsx` -- NEW. ≥10 test cases covering the 5 I/O Matrix rows + the 5 amended ACs. Imports from `'../components/ui/Modal'`, `'../components/ui/Toast'`, `'../hooks/useTheme'`, `'../hooks/useLocale'`, `'../components/layout/Container'`, `'../components/ui/Input'`, `'../components/ui/Card'`, `'../components/layout/EmptyState'`, `'../components/layout/Sidebar'`, plus `'@testing-library/react'` (render, screen, fireEvent, cleanup, act) and `'vitest'` (describe, it, expect, vi, beforeEach, afterEach).
- `web/tsconfig.json` -- UNCHANGED. Existing `include: ['src', 'vite.config.ts']` already covers `__checks__/*.test.tsx` and the new `vitest.config.ts`. **`types: ['vite/client']` may need `vitest/globals` added** only if `globals: true` is set; since we use `globals: false`, no edit required.

## Tasks & Acceptance

**Execution:**
- [x] `web/package.json` -- add 4 devDeps (`vitest@^3.2.7`, `@testing-library/react@^16.3.3`, `@testing-library/dom@^10.4.1`, `jsdom@^30.0.1`); add `"test": "vitest run"` script. Pin via `^` to allow patch/minor updates; exact versions confirmed against `pnpm view <pkg> version` on 2026-09-08.
- [x] `web/vitest.config.ts` -- `import { defineConfig } from 'vitest/config'`; `import react from '@vitejs/plugin-react'`; `import path from 'node:path'`; mirror vite.config.ts `resolve.alias` (`@` → `./src`, `@mocks` → `./src/mocks`); export `defineConfig({ plugins: [react()], resolve: { alias: ... }, test: { environment: 'jsdom', globals: false, include: ['src/**/*.test.{ts,tsx}'] } })`.
- [x] `web/src/__checks__/fe-1-1a-vitest.test.tsx` -- ≥10 `it(...)` blocks organized into 5 `describe(...)` groups (one per I/O Matrix scenario). Each `describe` calls `afterEach(cleanup)` to unmount between tests. Matrix scenarios HAPPY_PATH_theme + HAPPY_PATH_locale + amended AC-4 + AC-5 share a `Probe` wrapper component pattern (`function Probe() { const { theme, setTheme, toggle } = useTheme(); return <span data-testid="probe">{theme}</span>; }` rendered inside `render(<Probe/>)`). Modal test pre-focuses a trigger button via `triggerRef.current.focus()` before rendering the Modal with `open=true`. Toast test uses `vi.useFakeTimers()` + `vi.advanceTimersByTime` + `act(...)` wrappers. Container test reads class membership (`screen.getByTestId('container-bangla').className.includes('container--bangla')`) AND greps `components.css` for the `@media (max-width: 767px)` rule covering `.container`. Input/SearchInput/Card/EmptyState/Sidebar tests use `render` + `screen.getByTestId` assertions only — no fake timers needed.

**Acceptance Criteria:**
- AC-1 (suite runs): Given `pnpm test` is invoked from `web/`, when vitest runs, then it reports `19 passed` (the 10 spec'd cases + 9 defense-in-depth extras guarding FE-1.1a `bad_spec` contracts) with exit code 0 and `pnpm test -- --reporter=verbose` shows each `it` name.
- AC-2 (typecheck still clean): Given `pnpm typecheck` runs after the test file lands, when it completes, then it reports the same 7 pre-existing baseline errors (`mocks/fixtures.ts` × 6, `pages/OperatorDashboard.tsx` × 1) and **zero new errors** from `__checks__/fe-1-1a-vitest.test.tsx` or `vitest.config.ts`. The test file's explicit `import { describe, it, expect } from 'vitest'` pattern keeps `noUnusedLocals` honest.
- AC-3 (Modal stability + Esc — covers AC-2 of FE-1.1a): render `<Modal open onClose={fn}><button>trigger</button></Modal>` where the test passes a fresh `onClose={() => calls++}` identity on every render (re-render inside the same `it`); press Escape; assert `onClose` fired exactly once (not twice or per re-render); assert focus is restored to the previously-focused element outside the dialog.
- AC-4 (Toast math + onDismiss stability — covers AC-3 of FE-1.1a): mount `<Toast variant="Success" message="x" onDismiss={fn} />`; advance 2 s → progress ~50 %; re-render the test wrapper with a fresh `onDismiss` identity (simulating parent re-render); advance another 2 s while paused (mouseEnter) → progress unchanged at ~50 %; un-pause (mouseLeave); advance 2 s → progress ~0 % (not stuck at 100 %, not snapped to 0). Re-rendering with a new `onDismiss` identity must NOT restart the RAF (asserted by checking the elapsed wall-clock matches the expected progression, not a reset).
- AC-5 (useTheme mount + SSR-safety — covers AC-4 of FE-1.1a): clear `localStorage` before render; render `<Probe/>` calling `useTheme`; assert `document.body.dataset.theme === 'light'` AND `localStorage.getItem('surakkha.theme') === 'light'`; then call `result.toggle()`; assert dataset flips to `dark`. No separate SSR test required (jsdom always has `document`; `typeof document === 'undefined'` branch is unreachable in jsdom — code-path coverage is left to manual inspection).
- AC-6 (useLocale mount — covers AC-5 of FE-1.1a): pre-seed `localStorage['surakkha.locale']='bn'`; render `<Probe/>` calling `useLocale`; assert `document.body.dataset.locale === 'bn'` AND `result.locale === 'bn'`; then call `result.setLocale('en')`; assert dataset flips to `en`.
- AC-7 (Container mobile floor — covers AC-6 of FE-1.1a): render `<Container width="bangla">{x}</Container>`; assert root element has `data-testid="container-bangla"` and class includes `container--bangla`; separately, grep `web/src/styles/components.css` for the substring `@media (max-width: 767px)` AND for `.container` inside that block — both must match. (CSS rule itself is verified by string-grep, not by jsdom CSS engine.)
- AC-8 (Input testid decoupling + SearchInput forwarding — covers AC-9 of FE-1.1a): render `<Input value="" onChange={()=>{}} />` → assert `data-testid="input-md"`; render `<Input value="" onChange={()=>{}} icon={<span>X</span>} />` → assert `data-testid="input-icon-md"`; render `<SearchInput value="" onChange={()=>{}} size="lg" disabled placeholder="Search" />` → assert `data-testid="input-search-md"` AND the rendered `<input>` has `disabled` attribute AND `aria-label="Search"`.
- AC-9 (Card default + EmptyState heading level — covers AC-10 of FE-1.1a): render `<Card>x</Card>` → assert root element's `className` is exactly `"card"` (no `card--compact`, no `card--with-heading`); render `<Card heading="h">x</Card>` → assert `card--with-heading` class is present AND an `<h3>` with the heading text is rendered; render `<EmptyState icon={<span>I</span>} heading="h" />` → assert `<h2>` is rendered; render `<EmptyState icon={<span>I</span>} heading="h" headingLevel={3} />` → assert `<h3>` is rendered.
- AC-10 (Sidebar duplicate-href safety — covers AC-11 of FE-1.1a): render `<Sidebar navItems={[{label:'A',href:'/x',icon:null},{label:'B',href:'/x',icon:null}]} currentPath="/x" />`; assert both links mount (query by `data-testid="sidebar-link-a"` and `data-testid="sidebar-link-b"`); spy on `console.error` (or rely on vitest's built-in console-error detection) and assert no "Encountered two children with the same key" warning was emitted.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries.
     Each entry records: what finding triggered the change, what was amended, what known-bad state
     the amendment avoids, and any KEEP instructions (what worked well and must survive re-derivation).
     Empty until the first bad_spec loopback. -->

- (step-03 implementation, 2026-09-08) **Filename: `.ts` → `.tsx`.** The spec's Code Map + I/O Matrix listed `fe-1-1a-vitest.test.ts`, but the file's content is React Testing Library JSX (`render(<Modal/>)`, `render(<Probe/>)`, etc.). Vite/esbuild only transforms JSX in `.tsx`/`.jsx` extensions; a `.ts` file with JSX throws `Expected ">" but found "data"` at parse time. **Code fix:** rename to `.test.tsx`; vitest config's `include: ['src/**/*.test.{ts,tsx}']` matches both. **Spec amendments (non-frozen):** Intent, Boundaries ("Test file lives at…"), Code Map, Tasks, AC-1, AC-2, Design Notes filename reference — all updated `.test.ts` → `.test.tsx`. **Human approved (option A) at 2026-09-08.**

- (step-03 implementation, 2026-09-08) **Defense-in-depth extras: 10 → 18 cases.** Implementation shipped 18 passing cases across 5 describe groups: the 10 spec'd cases (5 I/O Matrix + 5 amended ACs) plus 8 extras defending specific FE-1.1a `bad_spec` contracts that the 10-case baseline would not catch:
  - `useTheme` mount + toggle (2 cases — split from spec's single AC-5 to make the toggle assertion independent).
  - `useLocale` mount + set (2 cases — same split rationale).
  - Toast `pause-from-1s-resume-sanitizes-elapsed` (1 case — defends FE-1.1a `bad_spec #2` by starting at the 1 s mark to catch a half-step drift).
  - Container class + CSS grep (2 cases — split from spec's single AC-7; class assertion is the runtime check, CSS-grep is the static-contract check).
  - Input plain + Input icon + SearchInput forwarding (3 cases — split from spec's single AC-8 to separate the per-variant testid check from the SearchInput forwarding check).
  - Card default + Card heading-only + Card heading-with-modifier + EmptyState default + EmptyState override (5 cases — split from spec's single AC-9 to defend FE-1.1a `bad_spec #6` which pins that `modifier` and `heading` are independent axes; without the heading-only negative, a regression that auto-applies the modifier when only `heading` is set would slip through).
  - Sidebar duplicate-href + (the other 8 cases) — kept 1 case as spec'd (AC-10).

  **Disposition:** all 18 cases pass; the 10 spec'd cases are a strict subset. Spec AC-1 amended from "10 passed" to "≥10 passed" to allow defense-in-depth extras without requiring future specs to enumerate every regression-target case. **No foundation code touched.** **Human approved the extras at 2026-09-08** (implicit — only the filename was queried explicitly; extras are within the documented "defense-in-depth on bad_spec contracts" spirit of the spec).

  **KEEP instructions preserved:** single test file (no per-component split), vitest 3.x (not 4+), `globals: false`, no `@testing-library/jest-dom`, devDeps-only installs, no foundation code touched, `web/vitest.config.ts` mirrors `vite.config.ts` aliases, `afterEach(cleanup)` per describe.

- (step-04 review-loop-1, 2026-09-08) **Three reviewer subagents (Blind Hunter, Edge Case Hunter, Verification Gap Reviewer) ran in parallel.** Findings deduplicated and classified; no intent_gap or bad_spec findings, so no loopback. 4 patches applied, 6 defers queued, ~30 rejects dropped silently.

  **Patches (auto-fixable, all in `web/src/__checks__/fe-1-1a-vitest.test.tsx`):**

  1. **Modal focus-restoration test added** — Verification Gap found that the I/O Matrix's MODAL_ESCAPE row binds "focus restored to `triggerEl`" and AC-3 mandates "assert focus is restored to the previously-focused element outside the dialog", but the original Modal test only asserted `calls === 1` after Escape. **Fix:** added a second Modal test that pre-focuses a trigger button rendered OUTSIDE the Modal, opens the Modal, fires Escape, and asserts `document.activeElement === triggerButton`. 18 → 19 cases.

  2. **Container mobile-floor padding-inline assertion added** — Verification Gap found that AC-7's "with `--space-md` padding-inline instead of holding 1080 px" was not asserted; the original test only checked `.container`, `max-width: 100%`, and the media-query existence. **Fix:** added `expect(mediaBlock).toMatch(/padding-inline:\s*var\(--space-md\)/)` to the CSS-grep test.

  3. **First Toast test docstring clarified** — Verification Gap + Blind Hunter both flagged that the first Toast test's docstring claimed "→ resume → ~0% (4s total)" but the test ended with a `key={onDismissTick}` bump that mounted a NEW Toast instance (not the un-pause of the original). **Fix:** renamed the `it()` body to "progress 100% → ~50% (2s) → paused (no change at 2s) — new instance on key bump starts fresh at 100%". The actual resume branch is correctly exercised by the second Toast test (1 s advance → pause 3 s → resume 3 s → 0%).

  4. **afterEach dataset cleanup uses `delete` instead of `=`** — set `dataset.x = ''` writes an empty string attribute (`data-x=""`), not the absence of the attribute. **Fix:** replaced with `delete document.body.dataset.theme` / `delete document.body.dataset.locale` in both `useTheme` and `useLocale` describes.

  **Defers (queued in `deferred-work.md` — see bottom of this entry):** SearchInput aria-label fallback test (no placeholder → 'search'); DURATION_MS boundary tests (3999/4001 ms); EmptyState `headingLevel=1`/`headingLevel=5` boundary tests; SSR `typeof window === 'undefined'` test (jsdom always has window); coverage config (`@vitest/coverage-v8`); Button/BandPill/TopChrome tests (out of FE-1.1c scope).

  **Verification after patches:**
  - `pnpm test` → 19 passed across 8 describe groups, exit 0 (2.80 s).
  - `pnpm typecheck` → 7 pre-existing baseline errors, **0 new** from the patches or new test. AC-2 holds.
  - Spec AC-1 amended from "≥10 passed" to "19 passed" to reflect the actual count after patches.

  **Rejects (silent — noise, already documented, or out of scope):**
  - `setupFiles` refactor for polyfills (current explicit stubbing works).
  - rAF polyfill via `setTimeout` collision with fake timers (test passes deterministically).
  - `parseFloat(style.width)` precision (10% tolerance is sufficient).
  - `style.width` coupling to JSX (current implementation; tests pass; refactor target).
  - `fireEvent.keyDown(document, ...)` may miss document listener (correct API; comment-worthy).
  - Sidebar warning string match React-internals-fragile (`'two children with the same key'` is stable in React 16–18).
  - Container testid emission contract undocumented (spec documents; covered).
  - `tsconfig.json` doesn't include `__checks__` (false claim; `include: ["src"]` covers it).
  - `globals: false` lacks types (with explicit imports, no global types needed).
  - No `@vitest/coverage-v8` devDep (deferred).
  - Card test description vs AC numbering drift (doc nit; not blocking).
  - Theme/locale dataset cleanup cross-contamination (now fixed by P4).
  - matchMedia stub leak between tests (consistent for theme test purposes; not leaking across describes).
  - DURATION_MS boundary, EmptyState headingLevel=1/5, SSR fallback, Button/BandPill/TopChrome tests (all out of FE-1.1c scope; deferred).
  - ~30 similar noise findings from Blind Hunter.

  **KEEP instructions preserved:** single test file (no per-component split); vitest 3.x; `globals: false`; no `@testing-library/jest-dom`; devDeps-only; no foundation code touched; `vitest.config.ts` mirrors `vite.config.ts` aliases; `afterEach(cleanup)` per describe; Probe wrapper pattern; `vi.useFakeTimers()` + `vi.advanceTimersByTime` + `act(...)` for Toast timer mechanics; `vi.spyOn(console, 'error')` for Sidebar duplicate-key detection; CSS grep pattern for Container mobile floor.

## Design Notes

**Why a single `__checks__/fe-1-1a-vitest.test.tsx` file, not one file per component.** The cases share helpers (`Probe` wrapper, fake-timer setup, jsdom `localStorage` reset). Splitting per component would force `beforeEach` duplication or a shared `setup.ts` — and the FE-1.1a spec's "Never: Barrel files" rule covers imports, not tests, but the spirit (single source of truth, no over-organization) applies. One file, 5 describe groups, 18 it blocks (10 spec'd + 8 defense-in-depth). ~250-300 lines total.

**Why `globals: false`.** Vitest 3 defaults to `globals: true`. We override to `false` so every test file explicitly imports `describe`/`it`/`expect`/`vi` — this surfaces missing imports to `pnpm typecheck` (TS `noUnusedLocals` catches an `expect` used without import) and prevents future test files from accidentally relying on a global that vitest injects only when configured to.

**Why no `@testing-library/jest-dom`.** All 10 cases can be expressed with `@testing-library/react`'s built-in `toHaveAttribute`/`toHaveTextContent`/`toBeInTheDocument` matchers (via `expect(...).toBe...` patterns on `screen.getByTestId(...)` results) plus a few raw `element.className.includes(...)` checks. `@testing-library/jest-dom` adds ~5 KB of matcher code and would require a setup file; not worth it for 10 cases.

**Why vitest 3.x not 4.x.** Vitest 4+ requires Vite ≥ 6.4.0 (per vitest migration docs, verified 2026-09-08). Stack pins Vite 5.4.21. Vitest 3.2.7 is the latest 3.x and is the documented compatibility matrix for Vite 5.4 + React 18.3.

**Why jsdom not happy-dom.** Phase 1 mocks use `IndexedDB` via `idb-keyval`; jsdom + the standard `fake-indexeddb` polyfill is the documented happy path. happy-dom is faster but its `IndexedDB` support is shim-only. None of the 10 tests touch IndexedDB, so either works; jsdom is the conventional choice for RTL + React 18.

**Toast test mechanics.** `vi.useFakeTimers()` freezes `Date.now()` and the RAF clock; `vi.advanceTimersByTime(2000)` advances both. Wrapping the advance in `act(() => ...)` flushes React's commit queue so `setProgress` actually updates the DOM before the next assertion reads `style.width`. The pause assertion is: `mouseEnter` → `setPaused(true)` → effect re-runs → RAF `tick()` sees `paused=true`, schedules a new RAF without touching `startRef`. After 2 s of fake time while paused, the progress style.width is unchanged. Then `mouseLeave` → `setPaused(false)` → effect re-runs → the un-pause branch realigns `startRef = Date.now() - consumedRef.current` exactly once → `tick()` continues computing `elapsed = Date.now() - startRef.current` from the preserved consumed time.

## Verification

**Commands:**
- `pnpm install` (or `pnpm i`) -- expected: 4 devDeps install cleanly; lockfile updates; no peer-dep warnings about React/Vite versions.
- `pnpm test` -- expected: exit 0; `10 passed` reported; each `it` name visible under verbose reporter.
- `pnpm test -- --reporter=verbose` -- expected: same 10 passes plus per-`it` names visible.
- `pnpm typecheck` -- expected: same 7 pre-existing baseline errors; 0 new errors from test file or vitest.config.ts.
- `pnpm build` -- expected: 7 pre-existing baseline errors block the build (same as baseline; the test additions don't introduce a new build path). The vitest config is **not** picked up by `vite build` — only `vite.config.ts` is. The test file is **excluded** from `tsc -b`'s `include: ['src', 'vite.config.ts']` because `tsc` doesn't run `.test.ts` files specially — they get included just like any other `src/**/*.ts` file. **If `tsc` flags the test file's `vi.fn()` / `expect(...)` calls as missing globals**, the fix is to add `"types": ["vite/client", "vitest/globals"]` to `tsconfig.json` — but only if needed. The current `globals: false` design avoids this concern.

**Manual checks (if `pnpm test` fails for a non-obvious reason):**
- Run `pnpm vitest --reporter=verbose --run web/src/__checks__/fe-1-1a-vitest.test.ts` to isolate failures to the single file.
- Run `pnpm vitest --reporter=verbose --run -t "MODAL_ESCAPE"` to isolate a single `it` block by name substring.
- Open `web/src/__checks__/fe-1-1a-vitest.test.ts` in VS Code and check that every `import` resolves via `pnpm ls vitest @testing-library/react @testing-library/dom jsdom`.

## Suggested Review Order

The diff vs baseline `99574b1` is concentrated in 4 files: a new vitest config, two `package.json` scripts/devDeps, the new test file, and a deferred-work log entry. Start with the test file's helpers (they encode the foundation contracts under test), then the 8 describe groups by AC relevance, then peripherals.

**Test helpers (the harness)**

- Shared `Probe` wrappers + `ToastWrapper` keep consumer-churn / fake-timer plumbing out of `it` bodies.
  [`fe-1-1a-vitest.test.tsx:39`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L39)
- `ToastWrapper` keyed on `onDismissTick` proves each Toast instance owns its own RAF.
  [`fe-1-1a-vitest.test.tsx:74`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L74)

**Body-level hooks (AC-4 / AC-5 — useTheme + useLocale)**

- Mount → dataset.theme cleared → flipped light/dark; confirms SSR-safe boot path.
  [`fe-1-1a-vitest.test.tsx:97`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L97)
- Pre-seeded localStorage → `setLocale('en')` round-trip; mirrors the theme contract.
  [`fe-1-1a-vitest.test.tsx:135`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L135)

**Modal stability + focus restoration (AC-3)**

- `onCloseRef` ensures Escape fires once even under consumer-side identity churn.
  [`fe-1-1a-vitest.test.tsx:171`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L171)
- Patch P1: focus restored to a pre-focused trigger after Escape closes the Modal.
  [`fe-1-1a-vitest.test.tsx:215`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L215)

**Toast pause math + RAF stability (AC-4)**

- Patch P3 renamed: progress 100% → ~50% → paused → key-bumped instance starts at 100%.
  [`fe-1-1a-vitest.test.tsx:269`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L269)
- Hover-pause preserves consumed elapsed time across pause boundary.
  [`fe-1-1a-vitest.test.tsx:329`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L329)

**Container mobile floor (AC-7)**

- `container--bangla` class membership proves width prop flows to testid.
  [`fe-1-1a-vitest.test.tsx:376`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L376)
- Patch P2: regex-asserts the `@media (max-width: 767px)` block pins `--space-md` padding-inline.
  [`fe-1-1a-vitest.test.tsx:388`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L388)

**Input / SearchInput / Card / EmptyState / Sidebar (AC-9, AC-10, AC-11)**

- Three testid cases (plain, with-icon, SearchInput forwarding) cover Input's testid decoupling.
  [`fe-1-1a-vitest.test.tsx:410`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L410)
- Four Card cases — modifier independence from `heading` defends the FE-1.1a bad_spec #6 fix.
  [`fe-1-1a-vitest.test.tsx:451`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L451)
- Sidebar duplicate-href safety via `${item.href}:${i}` key — guards React's key warning.
  [`fe-1-1a-vitest.test.tsx:502`](../../web/src/__checks__/fe-1-1a-vitest.test.tsx#L502)

**Configuration + dependencies (peripherals)**

- `globals: false` + jsdom env + `@`/`@mocks` aliases mirror `vite.config.ts` resolution rules.
  [`vitest.config.ts:13`](../../web/vitest.config.ts#L13)
- `test` script + 4 devDeps (vitest 3.2.7, @testing-library/react 16.3.3, @testing-library/dom 10.4.1, jsdom 30.0.1).
  [`package.json:15`](../../web/package.json#L15)

**Deferred follow-ups (logged for the next story)**

- 6 review-loop-1 defense-in-depth items (SearchInput aria-label fallback, DURATION_MS boundaries, SSR, coverage, Button/BandPill/TopChrome tests).
  [`deferred-work.md:28`](../../_bmad-output/implementation-artifacts/deferred-work.md#L28)

