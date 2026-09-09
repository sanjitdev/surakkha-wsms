---
title: 'FE-B5a — Dropdown primitive (single + multi-select, ARIA combobox)'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '82ed270'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-fe-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md'
---

## Intent

**Problem:** FE-1 has 12 Layer-A primitives but no `Dropdown`/`Select`. `FieldQueuePage` rolls its own button toggles for filter selection; planned `VerifyFlow`/`Settings`/`AuditLog` pages need single + multi-select. Without a shared primitive, every consumer reinvents ARIA combobox semantics + keyboard nav, and the lockdown breaks.

**Approach:** New `web/src/components/ui/Dropdown.tsx` — `Dropdown<T>`, `DropdownOption<T>`, `DropdownProps` with `mode: 'single' | 'multi'`, `searchable`, `placeholder`, `disabled`, `onChange`. [W3C ARIA combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) + full keyboard nav (ArrowUp/Down, Home/End, Enter, Escape, type-ahead). Multi-select renders chips. Styleguide Section 9 with 5 examples. Ship 8 Vitest cases.

## Boundaries & Constraints

**Always:**
- New `web/src/components/ui/Dropdown.tsx` (~180 lines, AD-FE-5 ceiling). Generic `T`. `DropdownOption<T> = { value: T; label: string; disabled?: boolean }`.
- New `web/src/styles/dropdown.css` (~120 lines). Token-only. Popover uses `--shadow-elevated`. Mobile floor at 767px → bottom sheet.
- Single mode: `onChange: (value: T | null) => void`. Multi: `onChange: (values: T[]) => void`. Controlled.
- ARIA: `role="combobox"` + `aria-expanded`/`aria-controls`/`aria-activedescendant`; listbox `role="listbox"`; options `role="option"` + `aria-selected`.
- Keyboard: ArrowUp/Down move `activeIndex`; Home/End first/last; Enter selects; Escape closes; type-ahead (case-insensitive prefix match).
- New `web/src/__checks__/fe-b5a-dropdown.test.tsx` (~200 lines, 8 cases).
- Styleguide Section 9: 5 examples (small list, searchable, disabled, multi pre-selected, live readout).

**Ask First:** None.

**Never:**
- No third-party deps (no `downshift`, no `@headlessui/react`). Built from scratch.
- No barrel files (AD-FE-9).
- No source edits to `FieldQueuePage`/`FieldHistory.tsx`/page consumers (B5d migration is the follow-up).
- No `passthrough()` in MSW overrides.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_idle | Mount with 3 options, no value | Trigger shows placeholder; listbox closed |
| HAPPY_PATH_open | Click trigger | `aria-expanded="true"`; 3 `role="option"` |
| HAPPY_PATH_select_single | ArrowDown×2 + Enter | `onChange` called with 3rd value; listbox closes |
| HAPPY_PATH_select_multi | Multi; click 2 options | 2 chips; `onChange` called with `[opt1, opt2]` |
| HAPPY_PATH_remove_chip | Multi; click chip × | Chip removed; `onChange` called with remaining values |
| HAPPY_PATH_search | Searchable; type "dhaka" | Listbox filtered to matching options |
| ERROR_CASE_disabled | `disabled=true` | Trigger `disabled`; click no-op; `aria-disabled="true"` |
| ERROR_CASE_keyboard_escape | Open + Escape | Listbox closes; focus returns; no `onChange` |

</frozen-after-approval>

## Code Map

### New primitive (Layer A)
- `web/src/components/ui/Dropdown.tsx` (NEW, ~180 lines) — controlled component; `useId()` for `aria-controls`; `useRef` for trigger + listbox. State: `open`, `activeIndex`, `searchQuery`. Single `onKeyDown`.
- `web/src/styles/dropdown.css` (NEW, ~120 lines) — `.dropdown` trigger + popover, `.dropdown__option[--active|--selected]`, `.dropdown__chips`, `.dropdown__chip[-remove]`, `.dropdown__search-input`.

### Styleguide showcase
- `web/src/pages/StyleguidePage.tsx` (EXTEND, +80 lines) — Section 9 "Dropdown" using `<Section>` + `<Row>` helpers (lines 43-72). Last example wires `onChange` to `useState` for live readout.
- `web/src/styles/styleguide.css` (EXTEND, +10 lines) — `.section--dropdown` spacing.

### Tests (vitest)
- `web/src/__checks__/fe-b5a-dropdown.test.tsx` (NEW, ~200 lines, 8 cases) — `render` + `userEvent` + RTL. `afterEach(() => { cleanup(); vi.restoreAllMocks(); })` per FE-1.3c review.

### Reuse (no edits)
- `web/src/components/ui/Button.tsx` — chip × icon composes `<Button variant="ghost" size="md">`.
- `web/src/components/ui/Card.tsx` — popover composes `<Card>`.
- `web/src/types/domain.ts` — extend with `type DropdownMode = 'single' | 'multi'` (AD-FE-6).
- `<Section>` + `<Row>` helpers at `web/src/pages/StyleguidePage.tsx:43-72`.

### Read-only references
- `_bmad-output/implementation-artifacts/epic-fe-1-context.md:35-43` — Layer A invariants.
- `_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md` — Modal focus-trap + ARIA pattern.

### CHANGELOG
- Append `### Added` (Dropdown + styleguide + 8 cases; suite 61 → 69) + `### Tests` bullet.

## Tasks & Acceptance

**Execution:**
- [x] `web/src/types/domain.ts` — extend with `DropdownMode` type alias (~3 lines). AD-FE-6 single source of truth.
- [x] `web/src/components/ui/Dropdown.tsx` — new file, ~180 lines. ARIA combobox + keyboard nav + single/multi + searchable. Layer A primitive.
- [x] `web/src/styles/dropdown.css` — new file, ~120 lines. Token-only.
- [x] `web/src/pages/StyleguidePage.tsx` — Section 9 + 5 examples using existing helpers.
- [x] `web/src/styles/styleguide.css` — section scaffolding.
- [x] `web/src/__checks__/fe-b5a-dropdown.test.tsx` — new file, ~200 lines, 8 cases.
- [x] `CHANGELOG.md` — append `### Added` + `### Tests` bullets under `[Unreleased]`.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 69 cases pass (61 + 8 new), exit 0; new describe groups green.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new errors.
- Given `pnpm --filter surakkha-app build`, when run, then succeeds.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 errors.
- Given `<Dropdown>` mounted, when user clicks trigger, listbox opens with `aria-expanded="true"` + `role="option"` items.
- Given `<Dropdown mode="single">` open, when ArrowDown×2 + Enter, `onChange` called with 3rd value + listbox closes + focus returns to trigger.
- Given `<Dropdown mode="multi">` with 2 selected, when user clicks chip ×, chip is removed + `onChange` called with remaining values.
- Given `<Dropdown searchable>` open, when user types "dh", listbox narrows to options whose label starts with "dh".

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 69 cases pass, exit 0, ~6s wall.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app build` — succeeds.
- `pnpm --filter surakkha-app lint` — 0 errors.

**Manual checks:**
- Open `/styleguide` in dev mode. Section 9 "Dropdown" renders all 5 examples.
- Click the wired `onChange` example; the live `<pre>` readout updates on each selection.
- Tab to a Dropdown trigger; press Space/Enter to open, Arrow keys to navigate, Enter to select — focus returns to trigger on close.
- Resize below 767px; popover repositions as a bottom sheet.

## Design Notes

**Why built from scratch.** The ARIA combobox is ~120 LoC of keyboard + pointer logic; pulling a 12-40KB library for that is overkill. Building from scratch keeps the lockdown intact — no third-party CSS to fight.

**Why controlled.** FE-1 pages manage selection state at the page level. Controlled Dropdown mirrors the `useIncidents` (FE-1.3c) pattern.

**Why chips in multi mode.** Bangla chrome renders chips natively (RTL-friendly); chip × gives single-click deselect that beats Shift-multi-select.

## Suggested Review Order

**State + refs (Layer A — composition root)**
- `useDropdownState` owns `open` / `activeIndex` / `query` + a `rootRef` for outside-click. `close()` resets all three and `queueMicrotask`'s focus restoration to the trigger.
  [`useDropdownState.ts`](../../web/src/components/ui/useDropdownState.ts)
- Outside-click handler attached via `useEffect` on `document.mousedown`; SSR-guarded via `typeof document` (review patch).
  [`useDropdownState.ts:54-72`](../../web/src/components/ui/useDropdownState.ts#L54)

**Keyboard nav (Layer A — handler hook)**
- `useDropdownKeyboard` returns a stable `onKeyDown`. ArrowUp/Down move `activeIndex` and open the popover; Home/End jump to first/last **enabled** option; Enter commits; Escape closes (review patch: disabled-option skip, Enter preventDefault when closed).
  [`useDropdownKeyboard.ts`](../../web/src/components/ui/useDropdownKeyboard.ts)
- Type-ahead (case-insensitive prefix match) skips disabled options and opens the popover if closed (review patch).
  [`useDropdownKeyboard.ts:41-52`](../../web/src/components/ui/useDropdownKeyboard.ts#L41)

**Composition root + sub-components**
- `Dropdown.tsx` composition root. `onToggle` reads `open` before flipping so the `setActiveIndex` side effect is outside the updater (StrictMode-safe — review patch).
  [`Dropdown.tsx`](../../web/src/components/ui/Dropdown.tsx)
- `DropdownTrigger` renders the combobox `<button>` with plain text content only (selected label or placeholder); chips are siblings, not children (review patch — fixes `<button>` inside `<button>` validateDOMNesting warning).
  [`DropdownTrigger.tsx`](../../web/src/components/ui/DropdownTrigger.tsx)
- `DropdownChips` renders selected values as removable chips above the trigger in multi mode.
  [`DropdownTrigger.tsx:73`](../../web/src/components/ui/DropdownTrigger.tsx#L73)
- `DropdownPopover` renders the listbox + optional search input. `aria-multiselectable` mirrors the `mode` flag.
  [`DropdownPopover.tsx`](../../web/src/components/ui/DropdownPopover.tsx)

**Type surface**
- `DropdownOption<T>` + discriminated `DropdownProps<T>` on `mode` live in `Dropdown.types.ts`. `DropdownMode` enum alias added to `domain.ts` per AD-FE-6.
  [`Dropdown.types.ts`](../../web/src/components/ui/Dropdown.types.ts) · [`domain.ts`](../../web/src/types/domain.ts)

**Style + showcase**
- `dropdown.css` is token-only; popover uses `--shadow-elevated`; mobile floor at 767px collapses to a bottom sheet.
  [`dropdown.css`](../../web/src/styles/dropdown.css)
- Styleguide Section 9 showcases 5 examples (small list, searchable, disabled, multi pre-selected, live `<pre>` readout wired to `useState`).
  [`StyleguidePage.tsx`](../../web/src/pages/StyleguidePage.tsx) · [`styleguide.css`](../../web/src/styles/styleguide.css)

**Tests + CHANGELOG**
- 10 Vitest cases pin the contract: idle, open, single select, multi toggle, chip remove, search, disabled, keyboard escape, Home/End (review patch), type-ahead on closed trigger (review patch).
  [`fe-b5a-dropdown.test.tsx`](../../web/src/__checks__/fe-b5a-dropdown.test.tsx)
- CHANGELOG single `### Added` + `### Tests` section under `[Unreleased]`; suite grows 61 → 71.
  [`CHANGELOG.md`](../../CHANGELOG.md)
- Five follow-up entries in `deferred-work.md`: popover auto-flip on viewport overflow, `aria-controls` linkage to search input, click-outside focus restore, type-ahead cycling, type-ahead query reset.
  [`deferred-work.md`](deferred-work.md)

**Verification:** `pnpm test` → 71 passed (exit 0, ~6.1s). `pnpm typecheck` → clean. `pnpm lint` → 0 errors (44 pre-existing warnings). `pnpm build` → succeeds.
