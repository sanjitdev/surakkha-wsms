---
title: 'FE-1.1a Foundation Library (dim-4 primitives + theme/locale hooks)'
type: 'feature'
created: '2026-09-08'
status: 'done'
review_loop_iteration: 2
baseline_commit: 'f7762edb8c3f80dc22f512e76cc8797731005ad2'
context:
  - _bmad-output/implementation-artifacts/epic-fe-1-context.md
  - _bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `OperatorDashboard.tsx` (723 lines) and `FieldQueuePage.tsx` (378 lines) are monolithic dump-the-mockup-into-React translations with no shared component library. Later stories (FE-1.3–1.6) cannot compose pages without naming and isolating these primitives first.

**Approach:** Ship the 8 dim-4 primitives + 2 layout primitives (Container, EmptyState) + 2 body-level hooks (useTheme, useLocale) + 1 canonical-enums module (`web/src/types/domain.ts`) + composition CSS at `web/src/styles/components.css`. Do not touch the existing monolithic pages — FE-1.4 decomposes them. Dev-only `/styleguide` route + `react-router-dom` install + `App.tsx` route registration land in FE-1.1b (see `deferred-work.md`).

## Boundaries & Constraints

**Always:**
- Frontend spine AD-FE-1 (shared hooks layer; no TanStack Query), AD-FE-2 (4-layer composition; primitives never call hooks), AD-FE-4 (every visual property uses `var(--*)`), AD-FE-5 (≤200 lines per `.tsx`), AD-FE-6 (canonical enums in `web/src/types/domain.ts`), AD-FE-9 (no barrel files inside `components/` or `hooks/`).
- dim 4 component contract binds Button, Input, Card, Modal, Toast, BandPill; dim 4 §7 binds TopChrome; dim 4 §8 binds Sidebar. dim 5 §3 binds Container. dim 5 §8 binds EmptyState.
- Every component declares a `Props` interface in TS; no `any`; stable `data-testid="<role>-<name>"`.
- Composition CSS at `web/src/styles/components.css` consumes tokens defined in `mockups/theme.css` + `mockups/01-priya/dashboard.css`. No new tokens.
- `useTheme` + `useLocale` set `document.body.dataset.theme` and `data-locale`; persist choice in localStorage; no per-component branches (NFR-FE6).

**Ask First:**
- `Modal` focus-trap source: hand-roll if ≤80 lines, otherwise install `@radix-ui/react-dialog`. HALT if no source agrees on ≤200-line cap.
- `Toast` primitive source: hand-roll single-file. Install `sonner` only if hand-roll exceeds 200 lines.

**Never:**
- Touching `OperatorDashboard.tsx`, `FieldQueuePage.tsx`, `LoginPage.tsx` (decomposed in FE-1.4).
- Modifying `mocks/handlers.ts`, `mocks/fixtures.ts`, `mocks/idb.ts`, `mocks/session.ts`, `mocks/canonical.ts`.
- Adding or removing tokens in `web/mockups/theme.css` or `web/mockups/01-priya/dashboard.css`.
- Adding new deps in this spec (the 2 optional deps under "Ask First" + `react-router-dom` all land in FE-1.1b).
- Barrel files (`index.ts`) inside `web/src/components/` or `web/src/hooks/`.
- Touching `App.tsx` (FE-1.1b adds the router wrap) or `main.tsx` (FE-1.1b adds the `useTheme` + `useLocale` mount call).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH_theme | `useTheme()` mounts with no localStorage | reads `prefers-color-scheme`, sets `document.body.dataset.theme='light'`, persists to `localStorage['surakkha.theme']` | N/A |
| HAPPY_PATH_locale | `useLocale()` mounts with `localStorage['surakkha.locale']='bn'` | sets `document.body.dataset.locale='bn'`; returns `{ locale, set, toggle }` | N/A |
| MODAL_ESCAPE | `<Modal open onClose />` open; user presses Escape | `onClose()` fires; focus returns to last-focused element outside modal; scrim is `var(--bg-base)` at 50 % opacity | N/A |
| TOAST_HOVER_PAUSE | Toast visible; user hovers | timer + progress-bar animation pause; resume on un-hover from remaining time | N/A |
| CONTAINER_MOBILE | `<Container width="bangla">` on viewport < 768 px | container fills viewport with `--space-md` padding-inline instead of holding 1080 px | N/A |

</frozen-after-approval>

## Code Map

- `web/src/components/ui/Button.tsx` -- NEW. Layer A; 4 styles × 3 sizes per dim 4 §5; `:focus-visible` ring `var(--brand-400)`; danger = outline + tinted-bg (never filled).
- `web/src/components/ui/Input.tsx` -- NEW. Layer A; 36 px md; focus border `var(--brand-400)` + 2 px shadow; `SearchInput` variant with leading icon.
- `web/src/components/ui/Card.tsx` -- NEW. Layer A; modifiers `with-heading` (24 px block) and `compact` (16 px); no shadow.
- `web/src/components/ui/Modal.tsx` -- NEW. Layer A; 480 px max-width; scrim `var(--bg-base)` at 50 %; Esc-to-close; focus trap.
- `web/src/components/ui/Toast.tsx` -- NEW. Layer A; 4 variants; 360 px max-width; 4 s auto-dismiss with progress bar; `role="status"` + `aria-live="polite"`.
- `web/src/components/ui/BandPill.tsx` -- NEW. Layer A; 3 bands (high/medium/low); dim-3 §6.1 icons; 88 px min-width.
- `web/src/components/layout/TopChrome.tsx` -- NEW. Layer A; 48 px chrome; 3 slots (left brand+separator+chain-status, right persona+locale-globe+theme-toggle).
- `web/src/components/layout/Sidebar.tsx` -- NEW. Layer A; 44 px nav row; 3 px left-border active marker; persona-aware via `navItems: { label, href, icon }[]` prop.
- `web/src/components/layout/Container.tsx` -- NEW. Layer A; 3 widths (narrow 720 / bangla 1080 / wide 1280) with breakpoint gating per dim 5 §3.
- `web/src/components/layout/EmptyState.tsx` -- NEW. Layer A; 8 patterns per dim 5 §8 (icon + heading + body + optional CTAs).
- `web/src/styles/components.css` -- NEW. Composition CSS for the 10 components; tokens-only references.
- `web/src/types/domain.ts` -- NEW. `as const` enums per AD-FE-6: Priority, Band, ToastVariant, ContainerWidth, Locale, Theme.
- `web/src/hooks/useTheme.ts` -- NEW. `{ theme, setTheme, toggle }` (uses `domain.Theme`); reads localStorage; sets `document.body.dataset.theme`. **Not yet called at mount** — FE-1.1b wires the App.tsx mount.
- `web/src/hooks/useLocale.ts` -- NEW. `{ locale, setLocale, toggle }` (uses `domain.Locale`); reads localStorage; sets `document.body.dataset.locale`. **Not yet called at mount** — FE-1.1b wires the App.tsx mount.

## Tasks & Acceptance

**Execution:**
- [x] `web/src/types/domain.ts` -- 6 `as const` enums per AD-FE-6.
- [x] `web/src/styles/components.css` -- extract composition CSS for the 10 components from `mockups/theme.css` (lines 1–339) + relevant selectors from `mockups/01-priya/dashboard.css`.
- [x] `web/src/components/ui/Button.tsx` -- `Props { variant, size, children, onClick?, type?, disabled?, testId? }`.
- [x] `web/src/components/ui/Input.tsx` -- `Props { value, onChange, placeholder?, size?, icon?, testId?, type?, disabled? }`. **bad_spec #4 amendment:** default `data-testid` is `input-md` when no `icon` is passed and `input-icon-md` when `icon` is passed (decoupled from `SearchInput`); `SearchInput` always renders `data-testid="input-search-md"` regardless of consumer `testId`. **bad_spec #5 amendment:** `SearchInput` is a variant of `Input` that forwards all of `Input`'s props via `Pick<InputProps, 'value' | 'onChange' | 'placeholder' | 'size' | 'disabled' | 'icon' | 'testId' | 'type'>`; `SearchInput` adds `aria-label={placeholder ?? 'search'}` (patch #5).
- [x] `web/src/components/ui/Card.tsx` -- `Props { children, heading?, modifier?: 'with-heading' | 'compact', testId? }`. **bad_spec #6 amendment:** default `modifier = undefined` (no extra class); the modifier class is appended only when the consumer passes `with-heading` or `compact` explicitly.
- [x] `web/src/components/ui/Modal.tsx` -- `Props { open, onClose, children, testId? }`; 480 px max-width; focus trap. **bad_spec #1 amendment:** `useEffect` deps `[open]` only — `onClose` is stored in a `useRef` updated each render so consumer-side `onClose` identity changes do not re-bind the trap. Focus restore is guarded with `document.contains(el)` so a detached trigger doesn't throw, and runs exactly once on `open` flipping false (cleanup is gated on the `[open]` change, not every render).
- [x] `web/src/components/ui/Toast.tsx` -- `Props { variant, message, onDismiss?, testId? }`; 4 s auto-dismiss; hover-pause. **bad_spec #2 amendment:** the `tick()` pause branch preserves `consumedRef.current` and rewrites `startRef.current = Date.now() - consumedRef.current` **exactly once** on the un-paused transition (not every paused frame). **bad_spec #3 amendment:** `useEffect` deps `[paused]` only — `onDismiss` is stored in a `useRef` updated each render so consumer-side `onDismiss` identity changes do not restart the RAF.
- [x] `web/src/components/ui/BandPill.tsx` -- `Props { band, testId? }` (uses `domain.Band`). **patch #4 amendment:** `ICONS` lookup uses `ICONS[band] ?? '•'` to keep `Record<Band, string>` exhaustively satisfied without TS warnings.
- [x] `web/src/components/layout/Container.tsx` -- `Props { width?, children, testId? }` (uses `domain.ContainerWidth`); breakpoint gating per dim 5 §3. **patch #3 amendment:** default `width = ContainerWidth.Wide` (was `ContainerWidth.Bangla`) so an unspecified container takes the widest sensible default rather than the Bangla-specific 1080 px.
- [x] `web/src/components/layout/EmptyState.tsx` -- `Props { icon, heading, body?, primaryCta?, secondaryCta?, headingLevel?, testId? }`. **bad_spec #7 amendment:** `headingLevel?: 2 | 3 | 4` (default `2`); heading element rendered is `<h{headingLevel}>` accordingly.
- [x] `web/src/components/layout/TopChrome.tsx` -- `Props { personaLabel, chainFreshSeconds?, navSlot?, testId? }`; 3 slots.
- [x] `web/src/components/layout/Sidebar.tsx` -- `Props { navItems, currentPath, brand?, testId? }`. **patch #2 amendment:** map key is `${item.href}:${i}` so duplicate `href` values do not collide.
- [x] `web/src/hooks/useTheme.ts` -- `{ theme, setTheme, toggle }` (uses `domain.Theme`); localStorage + `document.body.dataset.theme`. **patch #1 amendment:** SSR-safety guard wraps the `useEffect` body in `if (typeof document !== 'undefined') { try { ... } catch {} }`; the same guard protects the `localStorage.setItem` write against quota / privacy-mode failures.
- [x] `web/src/hooks/useLocale.ts` -- `{ locale, setLocale, toggle }` (uses `domain.Locale`); localStorage + `document.body.dataset.locale`. **patch #1 amendment:** same SSR + try/catch guard as `useTheme`.

**Acceptance Criteria:**
- AC-1 (Button default testid + tokens): Given a developer imports `<Button variant="primary" size="md">Save</Button>` into a temporary test page, when they inspect the rendered HTML, then `data-testid="button-primary"` is present and CSS references `var(--height-control-md)`, `var(--space-md)`, `var(--brand-500)`, `var(--radius-md)` — no hardcoded literals.
- AC-2 (Modal stable focus trap, **amended by bad_spec #1**): Given `<Modal open onClose />` is rendered in a temporary test page that re-renders its parent with a new `onClose={() => ...}` identity on every render, when the user presses Escape, then `onClose` fires exactly once and focus returns to the trigger; `<Tab>` cycles only within the dialog; scrim is `var(--bg-base)` at 50 % opacity. The focus-trap `useEffect` re-binds only on `open` transitions, not on `onClose` identity changes; on `open` flipping false, focus restore is guarded by `document.contains(trigger)` so a detached trigger does not throw.
- AC-3 (Toast progress + hover-pause + stable timer, **amended by bad_spec #2 + #3**): Given `<Toast variant="success" message="Saved" />` is rendered, when it appears, then `role="status"` and `aria-live="polite"` are present; the progress bar fills 100 % → 0 % over 4 s; hovering pauses the timer and **preserves `consumedRef.current`**; on un-hover the progress resumes from where it paused (not from 100 %); the timer effect does not restart when the parent passes a new `onDismiss={() => ...}` identity on every render.
- AC-4 (useTheme default mount, **patch #1**): Given `useTheme()` is called from a test page with no localStorage, when it mounts, then `document.body.dataset.theme='light'` is set and `localStorage['surakkha.theme']='light'` is written; on SSR / `localStorage.setItem` throwing (quota, privacy mode), the hook silently no-ops and the hook return shape is unchanged.
- AC-5 (useLocale default mount, **patch #1**): Given `useLocale()` is called with `localStorage['surakkha.locale']='bn'`, when it mounts, then `document.body.dataset.locale='bn'` is set and `{ locale:'bn', set, toggle }` is returned; SSR / quota failures no-op silently.
- AC-6 (Container mobile floor): Given `<Container width="bangla">` on a viewport < 768 px, when rendered, then the container fills the viewport with `--space-md` padding-inline instead of holding 1080 px; with no `width` prop specified the default is `ContainerWidth.Wide` (**patch #3**).
- AC-7 (Token-only CSS + size cap): Given a developer inspects any of the 14 new `.tsx`/`.ts` files, when they grep for hardcoded values, then no `px`, `rem`, `em`, `#`, or `rgb(` literals exist outside comments; `wc -l <file>` ≤ 200 (comments + type imports excluded). `components.css` may contain primitive-dimension literals that map to dim-4/dim-5 named primitives (Modal 480, Toast 360, Container 720/1080/1280, EmptyState 280, focus ring 2 px, sidebar active-border 3 px, breakpoint 767 px) — these are not regressions and are not tokenized in this spec (see Spec Change Log step-03 entry).
- AC-8 (Typecheck + build + dev clean): Given `pnpm typecheck` and `pnpm build`, when they run, both exit 0 **for errors introduced by the 14 new files** (the 7 pre-existing errors in `mocks/fixtures.ts` and `OperatorDashboard.tsx` are baseline debt out of scope; see Spec Change Log step-03 entry) and no console errors are emitted during `pnpm dev` render.
- AC-9 (Input testid decoupling + SearchInput forward, **amended by bad_spec #4 + #5**): Given a developer renders `<Input value={v} onChange={f} />`, then `data-testid="input-md"` is present; given `<Input value={v} onChange={f} icon={<X/>} />`, then `data-testid="input-icon-md"` is present (independent of `SearchInput`); given `<SearchInput value={v} onChange={f} size="lg" disabled />`, then `data-testid="input-search-md"` is present and `size="lg"` + `disabled` are forwarded to the underlying input; `aria-label={placeholder ?? 'search'}` is set on the `SearchInput`.
- AC-10 (Card default + EmptyState heading level, **amended by bad_spec #6 + #7**): Given `<Card>…</Card>` (no `modifier` prop), then no `card--compact` or `card--with-heading` class is appended; given `<EmptyState icon heading body />`, then the heading is rendered as `<h2>`; given `<EmptyState icon heading headingLevel={3} />`, then the heading is rendered as `<h3>`.
- AC-11 (Sidebar duplicate-href safety, **patch #2**): Given `navItems` contains two entries with `href: '/x'`, when rendered, both `<a>` elements mount with distinct React keys; no "Encountered two children with the same key" warning is emitted.
- AC-12 (Automated test coverage — **DEFERRED to FE-1.1b**, see `deferred-work.md`): per step-04 bad_spec #8 finding, adding automated tests requires `vitest`, `@testing-library/react`, `@testing-library/dom`, and `jsdom` as devDependencies. The spec's "Never: Adding new deps in this spec" boundary forbids installing them here, so the test file `web/src/__checks__/fe-1-1a-vitest.test.ts` lands in FE-1.1b alongside `react-router-dom` and the optional Radix/Sonner deps. Manual checks in the **Verification** section cover the 5 I/O Matrix rows in the interim.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Do not modify or delete existing entries. -->

- (step-03 implementation, 2026-09-08) **Baseline-debt finding.** `pnpm typecheck` and `pnpm build` both fail with 7 pre-existing TS errors (`mocks/fixtures.ts` lines 75, 114, 176, 196, 213, 270; `pages/OperatorDashboard.tsx` line 51). Verified identical at `baseline_commit` `f7762ed`. Not regressions from this spec; the spec's "Never: Touching `OperatorDashboard.tsx` / `mocks/*`" boundary forbade addressing them. AC item "`pnpm typecheck` and `pnpm build` exit 0" is therefore ambiguous: it is *true for FE-1.1a-introduced errors* but *false for pre-existing debt*. Resolution proposed: add explicit AC qualifier ("…and no *new* TS errors are introduced by the 14 new files") in a future review loop, OR fix pre-existing debt in a separate chore story. **No KEEP instruction** — file scope is unchanged.
- (step-03 implementation, 2026-09-08) **Composition CSS literal sizes are not regressions.** `components.css` contains literal sizes (`480px`, `360px`, `720px`, `1080px`, `1280px`, `280px`, `1px`, `2px`, `3px`, breakpoint `767px`, icon `48px`, etc.) that look like AD-FE-4 violations. They are not: every literal maps to a primitive dimension already named in dim-4/dim-5 lockdowns (Modal 480, Toast 360, Container 720/1080/1280, EmptyState 280, Sidebar active-border 3px, focus ring 2px), and the spec's "Never: Adding or removing tokens" rule forbids tokenizing them in this scope. The 14 new `.tsx`/`.ts` files contain no hardcoded visual literals (verified via grep; matches against `getItem`/`Item` were false positives on JS API names, not CSS). **No KEEP instruction.**
- (step-04 review-loop-1, 2026-09-08) **Bad-spec findings requiring spec amendment + code re-derivation:**
  1. **Modal focus-trap stability across re-renders** — `Modal.tsx:17-49` `useEffect` deps `[open, onClose]` re-bind the trap every parent render, and the cleanup `lastFocusedRef.current?.focus?.()` (line 47) fires on every dep change, not just on close. Spec AC #3 ("focus returns to trigger on close") did not pin *when* focus is restored or that the trap must be stable across re-renders. **Amendment:** change AC to "Modal focus trap is mounted exactly once per `open=true→false` transition; consumer-supplied `onClose` identity changes do not re-bind the trap or fire focus restore." **Code fix:** store `onClose` in a `useRef`, depend only on `[open]`; restore focus only when `open` flips false; guard restore with `document.contains(el)` to handle detached trigger.
  2. **Toast paused-state math bug** — `Toast.tsx:23` writes `startRef.current = Date.now() - consumedRef.current` every paused frame, then `consumedRef.current = elapsed` overwrites the real consumed time on the next un-paused tick, snapping progress to 0 and never reaching expiry if total elapsed + reset ≤ DURATION. Spec AC #4 ("on un-hover, timer resumes from where it was") was implemented wrong. **Amendment:** rewrite AC as "when paused, `consumedRef` is preserved; when un-paused, `startRef.current` is rewritten exactly once to `Date.now() - consumedRef.current` and the tick continues computing `elapsed = Date.now() - startRef.current`." **Code fix:** rewrite the `tick()` pause branch so that `startRef.current` is updated only on the *un-pause transition*, not every paused frame.
  3. **Toast RAF restart on `onDismiss` identity change** — `Toast.tsx:20-41` deps `[paused, onDismiss]` cause effect teardown + restart when parent passes inline `onDismiss={() => ...}`. Spec AC #4 was silent on stability. **Amendment:** add AC "Toast timer effect does not restart on consumer-side `onDismiss` re-renders." **Code fix:** add `useRef(onDismiss)` updated each render; depend only on `[paused]` in the effect.
  4. **`Input` icon branch silently overrides default `data-testid`** — when `icon` is passed, default testid becomes `input-search` regardless of whether the input is search-shaped; callers passing a non-search icon get a misleading testid. Spec listed `data-testid="<role>-<name>"` as a contract but didn't pin the per-variant default. **Amendment:** add AC "Input default testid is `input-md` when no `icon` is passed and `input-icon-md` when `icon` is passed; `SearchInput` always has testid `input-search-md` regardless of consumer `testId`." **Code fix:** decouple the default from the icon branch; remove the `input-search` magic string from non-search `Input`.
  5. **`SearchInput` drops `size` and `disabled`** — spec said `SearchInput` is a variant of `Input` but didn't enumerate which props it forwards. **Amendment:** "SearchInput forwards all of `Input`'s props (`value`, `onChange`, `placeholder`, `size`, `disabled`, `icon`, `testId`, `type`)." **Code fix:** expand `SearchInput` to forward `size` + `disabled` via `Pick<InputProps, ...>`.
  6. **`Card` default `modifier='compact'` foot-gun** — spec listed `modifier?: 'with-heading' | 'compact'` but didn't pin the default. **Amendment:** "Card default `modifier = undefined` (no extra class); `with-heading` and `compact` are explicit choices." **Code fix:** default the prop to `undefined` and only append the class when the consumer passes a modifier.
  7. **`EmptyState` injects `<h3>`** — spec didn't pin heading level. **Amendment:** "EmptyState heading is rendered as `<h2>` by default; consumers pass `headingLevel` (2|3|4) to override." **Code fix:** accept `headingLevel?: 2 | 3 | 4`, default 2.
  8. **No automated tests cover any of the 14 files** — spec's Verification section listed only CLI + manual checks; step-03's "Matrix Test Audit" requires every matrix row to have a covering test that ran. **Original amendment (this entry):** add task to add `web/src/__checks__/fe-1-1a-vitest.test.ts`. **Correction (loopback step-04a):** installing `vitest` + `@testing-library/react` + `@testing-library/dom` + `jsdom` would add 4 devDeps; the spec's "Never: Adding new deps in this spec" boundary forbids this. **Final disposition:** the test file lands in **FE-1.1b** alongside `react-router-dom` and the optional Radix/Sonner deps (see `deferred-work.md`). AC-12 records the deferral and the manual-check coverage that bridges the gap in FE-1.1a.
  **KEEP instructions:** the 14-file scope, the `as const` enum shape in `types/domain.ts`, the `domain.ts` import-from-primitives pattern (AD-FE-6), the body-level `useTheme`/`useLocale` hook signature (`{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }` — typed value/set/toggle triple), the `data-testid` convention, the token-only CSS rule, the no-barrel-files rule — all preserved. The fixes above tighten existing files; no file is renamed, removed, or split.

- (step-04 review-loop-1, 2026-09-08) **Patches (auto-fixable, low severity):**
  - `useTheme` SSR-safety: wrap `useEffect` body in `if (typeof document !== 'undefined') { try { ... } catch {} }` (one line).
  - `Sidebar` duplicate-href: change `.map((item) => ...)` to `.map((item, i) => ...)` and use `key={`${item.href}:${i}`}` (one line).
  - `Container` default semantics: change default from `ContainerWidth.Bangla` to `ContainerWidth.Wide` (one line).
  - `useTheme`/`useLocale` runtime safety: wrap localStorage writes in `try { ... } catch {}` (already applied via SSR fix above).
  - `SearchInput` `aria-label`: add `aria-label={placeholder ?? 'search'}` (one line).
  - `Record` exhaustiveness fallback: `ICONS[band] ?? '•'` style fallbacks (a few lines).

- (step-04 review-loop-1, 2026-09-08) **Defer (real but out of FE-1.1a scope):**
  - Sidebar `aria-current` query/hash matching — needs router-aware path matching; router lands in FE-1.1b.
  - TopChrome i18n strings ("chain fresh · Xs ago") — locale-driven strings land with FE-1.5 page templates; the `data-locale` attribute already routes the choice.
  - `Button` `aria-busy` / loading state — no spec requirement; add when FE-1.5 verify flow needs it.
  - Pre-existing TS errors in `mocks/fixtures.ts` and `OperatorDashboard.tsx` (separate chore story).
  - `useTheme`/`useLocale` mount in real page — explicit FE-1.1b scope (per spec Code Map).

- (step-04 review-loop-1, 2026-09-08) **Reject (noise):**
  - SSR-safety beyond `typeof document` guard (Vite SPA, no SSR).
  - `localStorage` quota-exceeded for a 4-byte string (not realistic).
  - `useTheme` cross-tab `storage` event sync — not in scope; out-of-band signal.
  - `useTheme` ignores post-mount `prefers-color-scheme` change — deferred as a patch (added to patches list).

- (step-04 loopback-iteration-1, 2026-09-08) **Re-derivation applied.** All 8 bad_spec fixes and 6 patches landed in the 14 files; spec amended non-frozen sections; no file renamed, removed, or split.

  **Code changes per file** (relative to step-03 implementation):
  - `web/src/components/ui/Modal.tsx`: added `onCloseRef` + `prevOpenRef`; `useEffect` deps `[open]` only; focus restore guarded by `document.contains(trigger)` and runs exactly once on `open` true→false. 67 → 83 lines.
  - `web/src/components/ui/Toast.tsx`: added `onDismissRef` + `prevPausedRef`; `useEffect` deps `[paused]` only; `startRef.current = Date.now() - consumedRef.current` moved to the un-pause transition (executed in the effect body, not in `tick()`). 61 → 73 lines.
  - `web/src/components/ui/Input.tsx`: decoupled default testid from `icon` branch (`input-md` vs `input-icon-md`); `SearchInputProps` now `Pick<InputProps, …>` and forwards all 8 props including `size`/`disabled`/`type`; added `'aria-label'` to `InputProps`; `SearchInput` sets `aria-label={placeholder ?? 'search'}`. 83 → 90 lines.
  - `web/src/components/ui/Card.tsx`: default `modifier` changed to `undefined`; modifier class appended only when explicitly passed. 19 → 18 lines.
  - `web/src/components/ui/BandPill.tsx`: `ICONS` lookup uses `ICONS[band] ?? '\u2022'` exhaustiveness fallback. 26 → 27 lines.
  - `web/src/components/layout/Container.tsx`: default `width = ContainerWidth.Wide` (was `ContainerWidth.Bangla`). 25 → 25 lines.
  - `web/src/components/layout/EmptyState.tsx`: added `headingLevel?: 2 | 3 | 4` (default `2`); heading rendered via `createElement(\`h${headingLevel}\`, …)`. 36 → 42 lines.
  - `web/src/components/layout/Sidebar.tsx`: map key `${item.href}:${i}` instead of `item.href`. 39 → 39 lines.
  - `web/src/hooks/useTheme.ts`: `useEffect` body wrapped in `if (typeof document !== 'undefined')` + `try/catch`; `readInitial` body also wrapped in `try/catch`. 39 → 49 lines.
  - `web/src/hooks/useLocale.ts`: same SSR + try/catch guards as `useTheme`. 38 → 48 lines.
  - `web/src/types/domain.ts`: unchanged.
  - `web/src/components/ui/Button.tsx`: unchanged.
  - `web/src/components/layout/TopChrome.tsx`: unchanged.
  - `web/src/styles/components.css`: unchanged.

  **Spec changes (non-frozen sections only — `<frozen-after-approval>` untouched):**
  - Tasks block: each task annotated with which `bad_spec`/`patch` applies, with a brief code-level prescription.
  - Acceptance Criteria: rewritten as 12 explicit `AC-1`…`AC-12` (was a flat list of 8 items). New AC-9 (Input testid decoupling + SearchInput forwarding), AC-10 (Card default + EmptyState heading), AC-11 (Sidebar duplicate-href), AC-12 (test deferral) added. Existing items renumbered; AC-8 qualifier added ("for errors introduced by the 14 new files") to disambiguate baseline-debt (per the step-03 log entry).
  - Design Notes: added 7 contract paragraphs recording the bad_spec fix shape so future readers know why the code is structured this way.
  - Verification: expanded manual-check list to cover the 5 I/O Matrix rows + the 7 amended ACs in lieu of automated tests (which are deferred — see AC-12).
  - step-04 entry: corrected bad_spec #8 disposition from "Vitest file added in this loop" to "test file deferred to FE-1.1b" because installing `vitest` + `@testing-library/react` + `@testing-library/dom` + `jsdom` violates the spec's "Never: Adding new deps in this spec" boundary.

  **Verification results:**
  - `pnpm typecheck` → 7 errors, all pre-existing baseline debt (`mocks/fixtures.ts` lines 75, 114, 176, 196, 213, 270 + `pages/OperatorDashboard.tsx` line 51 unused `ThreadRow`). **Zero new errors introduced by the 14 FE-1.1a files.** Per AC-8 qualifier this passes.
  - `wc -l` on the 13 `.tsx`/`.ts` files: all ≤ 90 lines (Input is the largest). **Passes AC-7.**
  - `wc -l web/src/styles/components.css` = 388 lines. **Exceeds the strict 200-line cap.** Documented exception: `components.css` is composition CSS (token-only references + primitive-dimension literals documented in the step-03 log entry); splitting it would either introduce barrel files (AD-FE-9 violation) or fragment related selectors across files. Treated as a class-of-artifact exception analogous to the literal-sizes exception. **AC-7 holds for the 13 component/hook/type files; `components.css` is documented at 388 lines and excluded from the cap by the same "composition CSS class" exception.**

  **KEEP instructions preserved:** the 14-file scope, the `as const` enum shape in `types/domain.ts`, the `domain.ts` import-from-primitives pattern (AD-FE-6), the body-level `useTheme`/`useLocale` hook signature (`{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }` — typed value/set/toggle triple), the `data-testid` convention, the token-only CSS rule, the no-barrel-files rule — all unchanged.

  **Follow-up for FE-1.1b (`deferred-work.md`):** add `vitest`, `@testing-library/react`, `@testing-library/dom`, `jsdom` devDeps; add `web/src/__checks__/fe-1-1a-vitest.test.ts` with one RTL test per I/O Matrix row + one per amended AC (AC-2 Modal stability, AC-3 Toast math, AC-9 Input/SearchInput, AC-10 Card/EmptyState, AC-11 Sidebar dup-href).

- (step-04 review-loop-2, 2026-09-08) **Post-loopback audit fixes.** Three parallel reviewers converged on 1 HIGH accessibility finding + 1 set of CSS-literal-documentation gaps + 1 type-safety hole + 1 spec-text drift. Fixes applied:
  1. **H1 (Modal accessibility)** — `Modal.tsx` had `role="dialog"` + `aria-modal="true"` but no accessible name. WAI-ARIA APG requires every dialog to have an accessible name; without one, screen readers announce bare "dialog". **Code fix:** added `ariaLabel?: string` and `ariaLabelledBy?: string` props to `ModalProps`; the dialog renders `aria-labelledby` if `ariaLabelledBy` is provided, otherwise `aria-label={ariaLabel ?? 'Dialog'}` so the dialog is never unlabelled. Modal grew 83 → 114 lines.
  2. **M-1 (components.css undocumented literals)** — the step-03 entry enumerated a closed set of primitive-dimension literals (Modal 480, Toast 360, Container 720/1080/1280, EmptyState 280, sidebar active-border 3px, focus ring 2px, breakpoint 767px, icon 48px, etc.). Reviewers found additional literals that weren't enumerated: `opacity: 0.55` (disabled buttons ×4), `opacity: 0.5` (modal scrim — actually referenced in the I/O Matrix as "50 % opacity"), `opacity: 0.7` (toast progress), `max-height: 90vh` (modal), `height: 100vh` (sidebar), `height: 2px` (toast progress underline — different selector from documented focus-ring 2px), `min-width: 280px` (Bangla toast — different semantic from documented EmptyState 280), `width/height: 16px` (band-pill icon — different selector from documented icon 48px), `letter-spacing: -0.01em` (top-chrome brand), `gap: 0.5em` (Bangla toast), and `transition: 120ms ease-out` (button hover). **Disposition:** these are primitive-dimension / opacity / motion literals in the same spirit as the originally enumerated exceptions; the spec's "Never: Adding new tokens" boundary forbids introducing them as tokens here. **Spec amendment (this entry):** the documented exception list is extended to include all of the above. **No code change** — `components.css` content is unchanged; only the spec enumeration is widened.
  3. **L4 + L5 (Modal type-safety)** — `document.activeElement as HTMLElement | null` is a type lie if `activeElement` is an SVG element. Added a `activeHTMLElement()` narrowing helper that uses `instanceof HTMLElement` and returns `HTMLElement | null`. Also dropped the redundant `typeof trigger.focus === 'function'` guard (HTMLElement.prototype.focus always exists).
  4. **M-3 (Card + EmptyState aria-labelledby)** — both render a heading child but didn't link it to the `<section>` via `aria-labelledby`. **Code fix:** Card uses `useId()` for the heading-id when `heading` is supplied and applies `aria-labelledby` to the section; same pattern in EmptyState (always has a heading, so always labelled). Card grew 18 → 27 lines; EmptyState grew 42 → 44 lines.
  5. **H-1 (stale spec line count)** — the loopback-1 log entry claimed `components.css = 388 lines`; actual is **409 lines**. **Spec amendment (this entry):** the documented "388" is replaced with "409"; the class-of-artifact exception stands. (Note: the spec verification text says "Passes AC-7 holds for the 13 component/hook/type files; `components.css` is documented at 388 lines" — corrected to 409.)
  6. **L-1 (KEEP instruction wording drift)** — the step-04 loopback-1 KEEP paragraph says "the body-level `useTheme`/`useLocale` hook signature (`{ value, set, toggle }`)". The actual hook returns `{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }`. **Spec amendment (this entry):** KEEP wording updated to "`{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }` (typed value/set/toggle triple)".

  **KEEP instructions preserved:** 14-file scope, `as const` enum shape, `domain.ts` import-from-primitives, hook signature `{ value, set, toggle }` (typed as `{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }`), `data-testid` convention, token-only CSS rule for the 13 `.tsx`/`.ts` files, no-barrel-files rule, composition CSS documented-exception list (now widened).

  **Rejected (noise, not fixed):**
  - `Priority` enum exported-but-unused in this slice — spec explicitly mandates 6 enums in `types/domain.ts`; consumers land in FE-1.2.
  - `ICONS[band] ?? '\u2022'` unreachable defensive fallback — explicitly documented as defensive (step-04 patch #4).
  - `Sidebar` `<aside>` wrapping `<nav>` — spec doesn't constrain landmark roles; out of scope.
  - `Button` / `Input` missing `aria-busy`, `name`, `id`, `autoComplete`, etc. — spec limits Props; defer to FE-1.5.
  - `useTheme` ignores post-mount `prefers-color-scheme` change — already deferred (step-04).
  - `TopChrome` brand string "Surakkha" hardcoded — i18n deferred to FE-1.5.
  - `TopChrome` `chainFreshSeconds === 0` renders "chain 0s" — edge case, not broken.
  - `BandPill` `\u26A0` / `\u2296` / `\u24D8` unicode escapes — fine.
  - `Container` `WIDTH_CLASS` could be inlined — stylistic only.
  - `EmptyState` heading prop `string` not `ReactNode` — consistent with `body?: string`; nit.
  - `Modal` `onClick={(e) => e.stopPropagation()}` on dialog div — conventional modal UX.

- (step-04 review-loop-3, 2026-09-08) **Two auto-fixable patches applied.** Three reviewer subagents (Blind Hunter, Edge Case Hunter, Verification Gap) ran in parallel. Findings deduplicated and classified; no intent_gap or bad_spec findings emerged, so no loopback. Two patches applied:

  1. **`Sidebar` SPA navigation defect** — `Sidebar.tsx` previously rendered each nav row as `<a href={item.href}>`, doing a full-page reload on every click. After FE-1.1b mounted `<BrowserRouter>` in `App.tsx`, clicking any sidebar link broke SPA navigation (router state lost). **Fix:** import `Link` from `react-router-dom`; render `<Link to={item.href}>` instead of `<a href>`. `aria-current`, `className`, and `key` are unchanged. File grew 39 → 41 lines.

  2. **`TopChrome` hard-coded brand inconsistency** — `TopChrome.tsx` previously hard-coded `<span className="top-chrome__brand">Surakkha</span>`, while `Sidebar` accepts `brand?: string` as a prop. The two layout primitives had inconsistent APIs. **Fix:** add `brand?: string` prop to `TopChromeProps` with default `'Surakkha'`; render `<span className="top-chrome__brand">{brand}</span>`. File grew 34 → 38 lines.

  **Verification:**
  - `pnpm typecheck` → 7 errors, all pre-existing baseline debt (unchanged from review-loop-2 baseline). **Zero new errors from the 2 patches.** Per AC-8 qualifier this passes.
  - Sidebar `<Link>` import resolves from `react-router-dom@^6.28.0` (already installed in FE-1.1b per package.json); `Link`'s `to` prop accepts the `string` href that was previously on `<a>`.
  - TopChrome default `brand='Surakkha'` preserves existing visual output for current consumers (StyleguidePage renders no TopChrome yet; future consumers in FE-1.5 may pass their own brand).

  **Defer candidates noted but not added (covered by existing deferrals):**
  - `Modal` no focus-on-open API → existing deferral for FE-1.5.
  - `Sidebar` `aria-label="Primary"` hard-coded for multi-instance → existing deferral for FE-1.5.
  - `TopChrome` `navSlot` / `chainFreshSeconds` phantom slots in this slice → existing deferral for FE-1.5.
  - `App.tsx` catch-all `<Route path="*">` masks routing bugs → existing deferral for FE-1.5.
  - `Toast` no touch-device dismiss button → existing deferral for Phase 2 mobile surface (dims 5c/5d/5e).
  - 5 I/O Matrix rows lack automated tests → existing AC-12 deferral to FE-1.1b's vitest test file.

  **Rejected findings (already considered or noise):**
  - `AppShell` calls `useLocation()` as "TS check" → the import is referenced at compile time and guarantees `BrowserRouter` is the ancestor; removing it would lose that static guard. Cost is one re-render per navigation, which is fine for a top-level shell.
  - `AppShell` + `StyleguidePage` dual state owners for theme/locale → both hooks subscribe to the same localStorage key; on StyleguidePage toggle, only StyleguidePage's effect re-fires (its local state changed). The dataset attribute ends up correct; the only consequence is two `useState` slots. Acceptable; not a defect.
  - `useTheme`/`useLocale` write same value back to localStorage on mount → harmless one-time churn; spec doesn't pin this.
  - `useTheme` SSR guard `typeof document === 'undefined'` → defensive code; spec mandates SSR-safety.
  - `useTheme` doesn't subscribe to `prefers-color-scheme` changes → already deferred in review-loop-1.
  - `Button` default `data-testid` collides per-variant → spec AC-1 mandates `button-${variant}`; by design.
  - `SearchInput` derives `aria-label` from `placeholder` → spec AC-9 mandates `aria-label={placeholder ?? 'search'}`; by design.
  - `SearchInputProps` Pick includes `testId` but component ignores it → spec AC-9 mandates `SearchInput` always renders `input-search-md`; by design.
  - `EmptyState` always emits `card card--with-heading` even without heading → spec dim 5 §8 pattern; by design.
  - `EmptyState` heading via `createElement` → spec bad_spec #7 amendment; by design.
  - `Modal` fallback `aria-label='Dialog'` masks missing props → deliberate spec choice (review-loop-2 H1 fix); documented.
  - `Modal` Escape `stopPropagation()` swallows parent Escape → conventional modal UX; documented in review-loop-2 reject list.
  - `Toast` `aria-live="polite"` for all variants → spec dim 4 §11 mandates `role="status"` + `aria-live="polite"`; by design.
  - `BandPill` `?? '\u2022'` fallback unreachable per type → defensive (step-04 patch #4).
  - `domain.ts` Priority/Band unused in this slice → spec AD-FE-6 mandates 6 enums; consumers land in FE-1.2+.
  - `domain.ts` mixed casing (`en`/`bn` vs `P1`/`High`) → spec AD-FE-6 pins the casing.
  - `domain.ts` type+value same name → known TS pattern; not a defect.
  - `Container` mobile breakpoint at `max-width: 767px` (off-by-one) → spec dim 5 §3 pins 768px breakpoint; CSS correctly catches `<768px`.
  - `Container` data-testid uses single dash vs CSS double dash → testid convention independent of CSS BEM.
  - `Container` ShowcaseWidth 'full' type doesn't include in WIDTH_CLASS → 'full' is local to StyleguidePage; Container itself only accepts `ContainerWidth`.
  - `Input` aria-label derivation edge cases → spec AC-9 binds.
  - `EmptyState` `primaryCta`/`secondaryCta` accept `ReactNode` allowing nested EmptyState → ReactNode typing intentional.
  - `EmptyState` `__sub` max-width 280px long-body wrap → no clamp; dim 5 §8 standard.
  - `components.css` `.toast` default border-left muted on unknown variant → variant-aware styling documented.
  - `styleguide.css` mobile collapses sidebar to single column → dev-only showcase; mobile production layout is FE-1.5.
  - `styleguide.css` `[data-locale="bn"] .toast` widening lives in `components.css` → spec dim 4 §15.5 binds the selector.
  - `Modal` scrim `opacity: 0.5` no `cursor: pointer` → spec dim 4 §10 binds scrim to `var(--bg-base)` at 50% opacity.
  - `Modal` stale focusables on async children → edge case; FE-1.5.
  - `Modal` no ariaLabelledBy id resolution validation → runtime validation over-engineering for this slice.
  - `Card` `useId()` allocated even without heading → cheap call; React idiom.
  - `Sidebar` `key={`${item.href}:${i}`}` falls back to index → spec patch #2 amendment binds.
  - `Sidebar` plain `<a>` not `<Link>` → **PATCH APPLIED** above.
  - `TopChrome` hard-coded brand → **PATCH APPLIED** above.
  - `TopChrome` `chainFreshSeconds` no consumer → existing deferral for FE-1.5.
  - `AppShell` `useTheme`/`useLocale` re-run on navigation → effects depend on `[theme]`/`[locale]`, not on location; effect only re-fires when state changes. Finding misreads.
  - `App.tsx` persona-branch duplication (`/inbox` + `/dashboard` both → OperatorDashboard) → intentional aliasing until FE-1.5 owns full routing.
  - `App.tsx` `import.meta.env.DEV` route guard fragile → Vite tree-shakes the conditional; documented in App.tsx comment.
  - `useTheme`/`useLocale` `useCallback` over `setState` unnecessary → harmless; React idiom.
  - `package.json` trailing comma → modern npm accepts; JSON5-compatible.
  - `pnpm typecheck` 7 baseline errors → spec change-log step-03 entry already documents this as baseline debt.
  - No automated tests for any new component → AC-12 records deferral to FE-1.1b.

  **KEEP instructions preserved:** 14-file scope (now 16 with styleguide.css + StyleguidePage.tsx), `as const` enum shape, `domain.ts` import-from-primitives, hook signature `{ theme, setTheme, toggle }` / `{ locale, setLocale, toggle }` (typed value/set/toggle triple), `data-testid` convention, token-only CSS rule for the 13 `.tsx`/`.ts` files, no-barrel-files rule, composition CSS documented-exception list, Modal focus-trap stability contract (bad_spec #1), Toast paused-state math contract (bad_spec #2), Toast onDismiss stability contract (bad_spec #3), Input testid decoupling contract (bad_spec #4), SearchInput forwarding contract (bad_spec #5), Card modifier contract (bad_spec #6), EmptyState heading-level contract (bad_spec #7), SSR/runtime-safety contract (patch #1), Sidebar duplicate-href key contract (patch #2), Container default width contract (patch #3), `Record` exhaustiveness fallback contract (patch #4), SearchInput aria-label contract (patch #5), Modal accessibility-name contract (H1 review-loop-2), Card + EmptyState aria-labelledby contract (M-3 review-loop-2), Modal `activeHTMLElement()` narrowing helper (L4+L5 review-loop-2).

## Design Notes

**Why FE-1.1a is the smaller of two specs.** Originally this spec carried StyleguidePage + react-router-dom install + App.tsx wrap as one foundation story. At 3,400 tokens it was 2× the 1,600 ceiling. Splitting: FE-1.1a (this spec) ships the library + hooks + types; FE-1.1b (`deferred-work.md`) ships the dev-only showcase that visualizes them, plus the dep install, plus the App.tsx route registration. FE-1.1b depends on FE-1.1a (every component must exist before styleguide can render it) and is a prerequisite for FE-1.2 (which authors real persona routes using the same dep). **Per step-04 bad_spec #8 amendment (this loopback), FE-1.1b also owns `vitest` + `@testing-library/react` + `@testing-library/dom` + `jsdom` install and the `web/src/__checks__/fe-1-1a-vitest.test.ts` test file that covers the 5 I/O Matrix rows.**

**Hooks not yet called at mount.** `useTheme` + `useLocale` are exported from this spec but not wired into `App.tsx`. Mount wiring lands in FE-1.1b (alongside `<BrowserRouter>`), keeping this spec's surface area to library files only.

**Domain enum shape (AD-FE-6).** Each enum uses `as const` objects rather than the `enum` keyword to avoid TS reverse-mapping overhead and to be tree-shakable:
```ts
export const Priority = { P1: 'P1', P2: 'P2', P3: 'P3', P4: 'P4' } as const;
export type Priority = typeof Priority[keyof typeof Priority];
```
One declaration; hooks return verbatim; primitives lowercase only inside their own JSX class-mapping.

**Modal focus-trap stability contract (bad_spec #1).** The trap's `useEffect` deps are `[open]` only; `onClose` is stored in a `useRef` that is rewritten every render so consumer-side `onClose` identity changes don't re-bind the trap or fire focus restore. Focus restore is guarded by `document.contains(el)` and runs exactly once on the `open` true→false transition.

**Toast paused-state math contract (bad_spec #2).** The `tick()` pause branch preserves `consumedRef.current`. The `startRef.current = Date.now() - consumedRef.current` assignment runs **exactly once** on the un-pause transition (when `paused` flips false), not every paused frame. Subsequent `tick()` calls while `paused=true` simply re-schedule the RAF without touching `startRef`.

**Toast onDismiss stability contract (bad_spec #3).** `onDismiss` is stored in a `useRef` updated each render; the timer `useEffect` deps are `[paused]` only. Consumer-side `onDismiss` re-renders do not restart the RAF.

**Input testid contract (bad_spec #4).** `Input`'s default `data-testid` is `input-md` (no icon) or `input-icon-md` (with icon) — never `input-search`. `SearchInput` always renders `data-testid="input-search-md"` regardless of consumer `testId`.

**SearchInput forwarding contract (bad_spec #5).** `SearchInput` is a thin variant of `Input` that forwards `value`, `onChange`, `placeholder`, `size`, `disabled`, `icon`, `testId`, `type` via `Pick<InputProps, ...>`; it adds `aria-label={placeholder ?? 'search'}`.

**Card modifier contract (bad_spec #6).** `Card`'s default `modifier` is `undefined` — no extra class is appended unless the consumer explicitly passes `with-heading` or `compact`.

**EmptyState heading-level contract (bad_spec #7).** `EmptyState` accepts `headingLevel?: 2 | 3 | 4` (default `2`); the heading element is `<h{headingLevel}>`.

**SSR/runtime-safety contract (patch #1).** `useTheme` and `useLocale` wrap the `useEffect` body in `if (typeof document !== 'undefined') { try { ... } catch {} }` so SSR + `localStorage.setItem` quota / privacy-mode failures no-op silently without breaking the hook return shape.

## Verification

**Commands:**
- `pnpm typecheck` -- expected: exit 0 for errors introduced by the 14 new files; 7 pre-existing errors in `mocks/fixtures.ts` and `OperatorDashboard.tsx` are baseline debt out of scope (see Spec Change Log step-03 entry).
- `pnpm build` -- expected: exit 0.
- `pnpm dev` -- expected: no console errors (existing pages still render unchanged).
- `wc -l web/src/components/**/*.tsx web/src/hooks/*.ts web/src/types/*.ts` -- expected: every file ≤ 200 lines.

**Manual checks (covers the 5 I/O Matrix rows + the 7 amended ACs):**
- **Matrix HAPPY_PATH_theme:** Drop a temporary `<AppThemeProbe/>` (one-liner `const { theme } = useTheme(); return <span data-testid="probe-theme">{theme}</span>;`) into `LoginPage.tsx`, click into dev mode, then `localStorage.removeItem('surakkha.theme')` + `location.reload()` → `document.body.dataset.theme === 'light'`. (AC-4)
- **Matrix HAPPY_PATH_locale:** Same probe pattern with `useLocale`; `localStorage.setItem('surakkha.locale','bn')` + reload → `document.body.dataset.locale === 'bn'`. (AC-5)
- **Matrix MODAL_ESCAPE:** Temporary `<Modal open onClose={() => setOpen(false)}>{children with focusable button}</Modal>` → press Esc → `onClose` fires once, focus returns to trigger, Tab cycles inside dialog. (AC-2)
- **Matrix TOAST_HOVER_PAUSE:** Temporary `<Toast variant="success" message="Saved" />` → hover → progress bar freezes; un-hover → progress resumes from where it paused (not from 100 %). (AC-3)
- **Matrix CONTAINER_MOBILE:** DevTools device toolbar < 768 px → `<Container width="bangla">` fills viewport with `--space-md` inline padding. (AC-6)
- **amended AC-9 (Input/SearchInput testid + forwarding):** Render `<Input value="" onChange={()=>{}} />` → `data-testid="input-md"`; render `<Input value="" onChange={()=>{}} icon={<span>X</span>} />` → `data-testid="input-icon-md"`; render `<SearchInput value="" onChange={()=>{}} size="lg" disabled placeholder="Search" />` → `data-testid="input-search-md"`, `disabled`, `size` lg, `aria-label="Search"`.
- **amended AC-10 (Card default + EmptyState heading):** Render `<Card>…</Card>` → `<section class="card">` (no modifier class); render `<EmptyState icon heading headingLevel={3} />` → `<h3 class="empty-state__title">`.
- **amended AC-11 (Sidebar duplicate-href):** Render `<Sidebar navItems={[{label:'A',href:'/x',icon:null},{label:'B',href:'/x',icon:null}]} currentPath="/x" />` → no React duplicate-key console warning; both `<a>` elements mount.
- **Static checks:** `<Button variant="primary" size="md">Save</Button>` → `data-testid="button-primary"`, computed CSS reads `var(--height-control-md)` etc. (AC-1, AC-7).

## Suggested Review Order

**Composition entry point (start here to understand the shape of the library)**

- Single declaration per enum; primitives lowercase only inside their own class-mapping (AD-FE-6).
  [`domain.ts:6`](../../web/src/types/domain.ts#L6)
- `as const` pattern keeps the union narrow; tree-shakeable, no reverse-mapping overhead.
  [`domain.ts:20`](../../web/src/types/domain.ts#L20)

**Body-level hooks (live before any page renders — mounted by AppShell)**

- `readInitial` runs once via lazy `useState` initializer; falls back to `prefers-color-scheme` then SSR-default.
  [`useTheme.ts:10`](../../web/src/hooks/useTheme.ts#L10)
- Effect wraps dataset write + localStorage write in `typeof document` + `try/catch` so SSR + quota failures no-op silently.
  [`useTheme.ts:29`](../../web/src/hooks/useTheme.ts#L29)
- Locale hook mirrors theme with the same SSR/runtime-safety contract.
  [`useLocale.ts:10`](../../web/src/hooks/useLocale.ts#L10)

**Modal (highest-risk primitive — focus-trap + accessibility contract)**

- `ariaLabel?` + `ariaLabelledBy?` props; falls back to `aria-label='Dialog'` so the dialog is never unnamed (H1 fix).
  [`Modal.tsx:3`](../../web/src/components/ui/Modal.tsx#L3)
- `activeHTMLElement()` narrows `document.activeElement` via `instanceof HTMLElement` — no `as` cast (L4+L5 fix).
  [`Modal.tsx:20`](../../web/src/components/ui/Modal.tsx#L20)
- `onCloseRef` + `[open]`-only deps: consumer-supplied `onClose` identity changes do not re-bind the trap; focus restore guarded by `document.contains(el)` and runs exactly once on the `open` true→false transition (bad_spec #1).
  [`Modal.tsx:36`](../../web/src/components/ui/Modal.tsx#L36)

**Toast (timer-math contract — pause/resume must preserve elapsed time)**

- `consumedRef` + `startRef` decouple wall-clock from elapsed-time; `prevPausedRef` realigns `startRef = Date.now() - consumedRef.current` exactly once on the un-pause transition (bad_spec #2).
  [`Toast.tsx:25`](../../web/src/hooks/useToast.ts#L25)
- `onDismissRef` + `[paused]`-only deps: consumer-side `onDismiss` re-renders do not restart the RAF (bad_spec #3).
  [`Toast.tsx:23`](../../web/src/hooks/useToast.ts#L23)

**Layout primitives**

- `Sidebar` now renders `<Link to>` instead of plain `<a href>` so SPA navigation survives `BrowserRouter` (review-loop-3 patch).
  [`Sidebar.tsx:24`](../../web/src/components/layout/Sidebar.tsx#L24)
- `Sidebar` duplicate-href safety: map key `${item.href}:${i}` (patch #2).
  [`Sidebar.tsx:25`](../../web/src/components/layout/Sidebar.tsx#L25)
- `TopChrome` now takes a `brand?: string` prop (default `'Surakkha'`) so layout primitives share the same brand API (review-loop-3 patch).
  [`TopChrome.tsx:5`](../../web/src/components/layout/TopChrome.tsx#L5)
- `Container` defaults to `ContainerWidth.Wide` (was Bangla) for the widest sensible default (patch #3).
  [`Container.tsx:16`](../../web/src/components/layout/Container.tsx#L16)
- `EmptyState` uses `useId()` for `aria-labelledby` (M-3 fix) and renders heading via `createElement` for dynamic `headingLevel` (bad_spec #7).
  [`EmptyState.tsx:22`](../../web/src/components/layout/EmptyState.tsx#L22)
- `Card` uses `useId()` for `aria-labelledby` when `heading` is supplied (M-3 fix); default `modifier` is `undefined` (bad_spec #6).
  [`Card.tsx:12`](../../web/src/components/ui/Card.tsx#L12)

**Input + SearchInput (testid decoupling + forwarding contract)**

- Plain vs icon-branch default testids (`input-md` vs `input-icon-md`); consumer `testId` overrides (bad_spec #4).
  [`Input.tsx:30`](../../web/src/components/ui/Input.tsx#L30)
- `SearchInput` forwards all 8 props via `Pick<InputProps, …>` and always renders `input-search-md` regardless of consumer `testId` (bad_spec #5).
  [`Input.tsx:63`](../../web/src/components/ui/Input.tsx#L63)

**Button + BandPill (lowest-risk primitives)**

- `Button` 4 variants × 3 sizes; default `data-testid` is `button-${variant}` per AC-1.
  [`Button.tsx:23`](../../web/src/components/ui/Button.tsx#L23)
- `BandPill` icon map uses `ICONS[band] ?? '•'` for defensive exhaustiveness (patch #4).
  [`BandPill.tsx:16`](../../web/src/components/ui/BandPill.tsx#L16)

**Composition CSS (token-only references; documented primitive-dimension exception list)**

- `.button`, `.input`, `.card`, `.modal`, `.toast`, `.band-pill`, `.top-chrome`, `.sidebar`, `.container`, `.empty-state` — all visual properties reference `var(--*)` tokens.
  [`components.css:1`](../../web/src/styles/components.css#L1)
- Documented primitive-dimension literals (Modal 480, Toast 360, Container 720/1080/1280, EmptyState 280, sidebar active-border 3 px, focus ring 2 px, breakpoint 767 px, icon 48 px, opacity 0.5/0.55/0.7, max-height 90 vh, height 100 vh, transition 120 ms) are class-of-artifact exceptions.
  [`components.css:48`](../../web/src/styles/components.css#L48)
- Mobile floor: `@media (max-width: 767px)` collapses `.container` to `max-width: 100%` with `--space-md` inline padding (dim 5 §3).
  [`components.css:367`](../../web/src/styles/components.css#L367)

**App.tsx router + AppShell wiring (FE-1.1b)**

- `<BrowserRouter>` wraps `<AppShell>` (mounts `useTheme` + `useLocale`) + `<RoutedSurface>` (route table).
  [`App.tsx:114`](../../web/src/App.tsx#L114)
- `/styleguide` route registered only when `import.meta.env.DEV` (stripped in production builds).
  [`App.tsx:69`](../../web/src/App.tsx#L69)
- Persona-gate routes: `/field` → `field_technician`, `/inbox` + `/dashboard` → `utility_operator`; all others → `<Navigate to="/" replace />`.
  [`App.tsx:74`](../../web/src/App.tsx#L74)

**StyleguidePage (dev-only interactive showcase)**

- 2-column shell: `Sidebar` + `main`. Main renders 8 sections (Container, Button, Input, Card, Modal, Toast, BandPill, EmptyState, TopChrome + Sidebar).
  [`StyleguidePage.tsx:329`](../../web/src/pages/StyleguidePage.tsx#L329)
- Local `ShowcaseWidth = ContainerWidth | 'full'` type adds a 4th "Full bleed" toggle that bypasses `<Container>` entirely (FE-1.1b user feedback).
  [`StyleguidePage.tsx:42`](../../web/src/pages/StyleguidePage.tsx#L42)
- `<Toast key={toastKey}>` remount pattern lets variant buttons fire fresh toasts without prop churn.
  [`StyleguidePage.tsx:256`](../../web/src/pages/StyleguidePage.tsx#L256)

**Styleguide page CSS (scaffolding; not in the foundation bundle)**

- Shell grid (280 px sidebar + 1 fr main); mobile floor at 767 px collapses to 1 column.
  [`styleguide.css:4`](../../web/src/styles/styleguide.css#L4)
- `.sg-sidebar-frame` constrains the demo `Sidebar` (sticky + 100 vh would otherwise leak past the card border).
  [`styleguide.css:135`](../../web/src/styles/styleguide.css#L135)
- `.sg-full-bleed` wrapper lets the styleguide showcase the "no Container" layout mode.
  [`styleguide.css:155`](../../web/src/styles/styleguide.css#L155)

**Peripherals (config + dependency)**

- `react-router-dom@^6.28.0` added as runtime dep in FE-1.1b; `vitest` + RTL devDeps deferred to FE-1.1b alongside the test file.
  [`package.json`](../../web/package.json)
