---
title: 'FE-B5a-harden — Dropdown a11y hardening: click-outside focus restore + dual aria-controls'
type: 'refactor'
created: '2026-09-09'
status: 'shipped'
review_loop_iteration: 0
baseline_commit: '9141010'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** Two real a11y bugs in the shipped Dropdown primitive:

1. **B5a-3 — Click-outside does NOT restore focus.** `useDropdownState.ts`
   lines 55-72 close the popover on outside `mousedown` but never call
   `triggerRef.current?.focus()`. The WAI-ARIA combobox pattern requires
   focus to return to the trigger when the popover closes (via Escape,
   outside-click, or option-selection). Today only `close(true)` at
   line 74-79 (called by Escape + option-commit) restores focus — outside-
   click leaks focus to `document.body`. Keyboard users get lost.

2. **B5a-2 — `aria-controls` is incomplete when `searchable={true}`.**
   `DropdownTrigger.tsx` line 48 sets `aria-controls={listboxId}` only.
   When `searchable`, the trigger ALSO controls the search input
   (`DropdownPopover.tsx` lines 41-54 — currently has no `id`). SR users
   hear "controls listbox" but not "controls search input", missing the
   second interactive element in the combobox subtree.

**Approach:** Two surgical patches in `useDropdownState.ts` +
`Dropdown.tsx` + `DropdownTrigger.tsx` + `DropdownPopover.tsx`. Add a
`searchInputId` (`${rootId}-search`) when `searchable`; thread it from
state → composition root → trigger; append to `aria-controls` with a
space-separated token. Restore focus in the outside-click handler via
`queueMicrotask` (matches the existing `close(true)` pattern at
`useDropdownState.ts:78`). **No CSS change. No new deps. No public
API change** — all surface area stays additive.

## Boundaries & Constraints

**Always:**
- Two real bugs only. Don't widen scope to "rewrite the dropdown".
- Outside-click focus restore uses `queueMicrotask` to match the existing
  pattern at `useDropdownState.ts:78` (keeps React's commit phase from
  fighting the focus call).
- `aria-controls` follows WAI-ARIA: space-separated tokens
  (`"${listboxId} ${searchInputId}"`) when both present; falls back to
  `listboxId` alone when `searchable={false}`.
- `searchInputId` is derived once in `useDropdownState` (uses the same
  `useId()` as `listboxId`) so React 18 hydration matches.
- New `web/src/__checks__/fe-b5a-harden-a11y.test.tsx` (~80 LoC, 4-6 cases).
- 100% backward compat: existing 69-case B5a suite stays green.

**Ask First:** None — both fixes are WAI-ARIA compliance, low-blast-radius.

**Never:**
- No new third-party deps.
- No barrel files (AD-FE-9).
- No edits to public `DropdownProps` surface.
- No CSS edits.
- No edits to other primitives (B5b Table's column-filter Dropdown
  consumers will benefit transparently).
- No bundle size change (the id is already computed; we just expose it).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_click_outside_focus_restore | open popover, dispatch `mousedown` outside, flush microtask | `document.activeElement` === trigger button |
| HAPPY_PATH_escape_focus_restore | open popover, press Escape, flush microtask | `document.activeElement` === trigger button (regression — already worked, must not break) |
| HAPPY_PATH_option_commit_focus_restore | open popover, click option (single mode), flush microtask | `document.activeElement` === trigger button (regression — already worked) |
| HAPPY_PATH_aria_controls_searchable | render `<Dropdown searchable={true} />`, open | trigger `aria-controls` === `"${listboxId} ${searchInputId}"` |
| HAPPY_PATH_aria_controls_non_searchable | render `<Dropdown searchable={false} />`, open | trigger `aria-controls` === listboxId (regression — unchanged) |
| HAPPY_PATH_search_input_id_present | render `<Dropdown searchable={true} />`, open | popover `<input>` has `id` matching the token in `aria-controls` |
| ERROR_CASE_close_no_open | close called when popover already closed | no focus call (regression — `close(true)` was always called only from open state, must not regress) |
| ERROR_CASE_searchable_false_no_search_input | render `<Dropdown searchable={false} />`, open | popover has no `<input>`; `searchInputId` is unused |

<frozen-after-approval>

## Spec Change Log

(To be appended after Step-05 ships.)

## Code Map

### Modified (4 files, ~10 LoC net)

- `web/src/components/ui/useDropdownState.ts` (MODIFY, +3 LoC) —
  - Compute `searchInputId = \`${rootId}-search\`` alongside `listboxId`
    (line 30 area).
  - Add `searchInputId: string` to the `DropdownState<T>` interface (line 12 area).
  - Add `queueMicrotask(() => triggerRef.current?.focus())` to the outside-
    click handler at line 65 (after `setQuery('')`).
  - Return `searchInputId` from the hook at line 109 area.

- `web/src/components/ui/Dropdown.tsx` (MODIFY, +3 LoC) —
  - Destructure `searchInputId` from `state` at line 47.
  - Pass `searchInputId={searchInputId}` to `<DropdownTrigger>` (line 101 area).
  - Pass `searchInputId={searchInputId}` to `<DropdownPopover>` (line 116 area).

- `web/src/components/ui/DropdownTrigger.tsx` (MODIFY, +5 LoC) —
  - Add `searchInputId?: string` to `DropdownTriggerProps` (line 4 area).
  - Compute `controls = searchable && searchInputId ? \`${listboxId} ${searchInputId}\` : listboxId`
    inside the component. NOTE: trigger does not currently know
    `searchable` — add a `searchable?: boolean` prop too.
  - Update `aria-controls={controls}` at line 48.

- `web/src/components/ui/DropdownPopover.tsx` (MODIFY, +2 LoC) —
  - Add `searchInputId: string` to `DropdownPopoverProps` (line 4 area).
  - Add `id={searchInputId}` to the `<input>` at line 41 area.

### Tests (vitest)
- `web/src/__checks__/fe-b5a-harden-a11y.test.tsx` (NEW, ~80 LoC, 4-6 cases) —
  - `click_outside_restores_focus_to_trigger` — open, dispatch mousedown
    on a node outside the root, flush `await Promise.resolve()`, assert
    `document.activeElement?.getAttribute('data-testid') === 'dd-trigger'`.
  - `escape_still_restores_focus_regression` — open, press Escape, flush,
    assert focus on trigger. (Existing test pattern; ensure it still
    passes after the outside-click patch.)
  - `option_commit_still_restores_focus_regression` — open, click option,
    flush, assert focus on trigger.
  - `aria_controls_includes_search_input_when_searchable` — open
    `<Dropdown searchable={true} />`, assert
    `trigger.getAttribute('aria-controls')` === `"${listboxId} ${searchInputId}"`
    and the input has matching `id`.
  - `aria_controls_single_when_not_searchable_regression` — open
    `<Dropdown searchable={false} />`, assert
    `trigger.getAttribute('aria-controls')` === listboxId alone.

### Read-only references
- `web/src/components/ui/useDropdownKeyboard.ts` — Escape handler already
  calls `close(true)` so focus restore is wired. B5a-harden doesn't
  touch this file.
- `web/src/components/ui/Dropdown.types.ts` — public `DropdownProps` is
  unchanged. `searchInputId` is internal to the state + composition root.

### Reuse (no edits)
- Existing `close(true)` at `useDropdownState.ts:74-79` already calls
  `queueMicrotask(() => triggerRef.current?.focus())` — the pattern is
  copied verbatim into the outside-click handler.
- `useId()` at `useDropdownState.ts:29` — `searchInputId` is derived
  from the same React 18 id, so hydration matches automatically.

### CHANGELOG
- Append `### Fixed` bullet (Dropdown click-outside now restores focus
  to trigger; `aria-controls` now references search input when
  `searchable={true}` — WAI-ARIA combobox compliance).
- Append `### Tests` bullet (suite 97 → 101-103; +4-6 cases).
- Note **zero new deps**.

## Tasks & Acceptance

**Execution:**
- [ ] `useDropdownState.ts` — derive `searchInputId`, expose it, add
      focus-restore to outside-click handler.
- [ ] `Dropdown.tsx` — destructure `searchInputId`, thread to both
      `DropdownTrigger` and `DropdownPopover`.
- [ ] `DropdownTrigger.tsx` — accept `searchable?` + `searchInputId?`,
      compute dual `aria-controls` when searchable.
- [ ] `DropdownPopover.tsx` — accept `searchInputId`, give the search
      `<input>` an `id`.
- [ ] `fe-b5a-harden-a11y.test.tsx` — new file, ~80 LoC, 4-6 cases.
- [ ] `CHANGELOG.md` — `### Fixed` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 101-103 cases
  pass (97 + 4-6), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors
  (the new `searchable?` prop must not trigger `react/prop-types`).
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.2 kB gzipped (the change is purely a derived id + one
  microtask call).
- Given the popover is open and a user clicks outside, when the mousedown
  resolves, then `document.activeElement` is the trigger button.
- Given `<Dropdown searchable={true} />` is open, when rendered, then
  the trigger `aria-controls` attribute lists both the listbox id and
  the search input id, and the search input has a matching `id`.
- Given `<Dropdown searchable={false} />` is open, when rendered, then
  the trigger `aria-controls` attribute is unchanged (listbox id only).
- Given `pnpm --filter surakkha-app lint`, when run, then no
  `react/prop-types` warnings on the new optional props.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 101-103 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds; bundle delta ≤+0.2 kB.

**Manual checks:**
- Open the styleguide page, click any Dropdown example, then click outside.
  Focus returns to the trigger (verify with `document.activeElement` in
  DevTools).
- Tab from a `<Dropdown searchable={true} />` trigger — the focus ring
  should advance to the search input, not skip it.
- Inspect the trigger's `aria-controls` attribute in DevTools when
  `searchable={true}`: both ids space-separated.

## Design Notes

**Why `queueMicrotask` and not `requestAnimationFrame`.** The existing
`close(true)` at `useDropdownState.ts:78` uses `queueMicrotask`, which
runs after the current event handler but before React re-renders. This
keeps the focus call inside React's commit phase, avoiding the
"focus stolen by re-render" bug that plagues `setTimeout(0)` patterns.
Outside-click focus restore must match `close(true)` so all 3 close
paths (Escape, outside-click, option-commit) are user-perceptibly
identical.

**Why space-separated `aria-controls` and not a single new id.** WAI-ARIA
explicitly allows space-separated tokens in `aria-controls`. Combining
two existing ids keeps the change to one attribute and matches the SR
expectation ("controls listbox and search input").

**Why not push `searchable` into the existing `DropdownTriggerProps`.**
The trigger currently doesn't know about `searchable` — it's a popover
concern. Adding it as an optional prop keeps the trigger focused on
"render the button + aria attrs"; computing the dual `aria-controls` is
a single ternary that doesn't pollute the trigger's purpose.

**Why not a CSS-only patch for focus rings.** The bug isn't a missing
focus ring — focus is genuinely on `document.body` after outside-click.
A CSS fix wouldn't help. This is a JS state bug.

## Out of scope (deferred to later specs)

- **B5a-flip — viewport-collision auto-flip** (popover currently uses
  fixed `top` calc; needs collision detection against viewport bottom).
  Independent spec.
- **B5a-keyboard — type-ahead cycling** (current `useDropdownKeyboard`
  type-ahead matches first option only; doesn't cycle across letters).
  Independent spec.
- **`act()` warning on the new focus tests** — RTL's `act()` may warn
  about state updates outside `act()` after `queueMicrotask`. If so,
  wrap the focus assertion in `await act(async () => { await Promise.resolve(); })`
  (the same pattern B5c landed for DatePicker focus restore).
- **VoiceOver / NVDA screen-reader pass** — recommended before merging
  the Dropdown into more pages. Out of scope for B5a-harden; the ARIA
  attribute + focus contract is sufficient to claim compliance.

## Suggested Review Order

**State hook (the brain)**
- `useDropdownState.ts` — derive `searchInputId`; add `queueMicrotask`
  focus restore to outside-click handler. The bug fix is here.
  [`useDropdownState.ts`](../../web/src/components/ui/useDropdownState.ts)

**Composition root (the wiring)**
- `Dropdown.tsx` — destructure `searchInputId` from state; pass to both
  sub-components.
  [`Dropdown.tsx`](../../web/src/components/ui/Dropdown.tsx)

**Trigger + popover (the ARIA surface)**
- `DropdownTrigger.tsx` — accept optional `searchable` + `searchInputId`;
  compute dual `aria-controls`. [`DropdownTrigger.tsx`](../../web/src/components/ui/DropdownTrigger.tsx)
- `DropdownPopover.tsx` — accept `searchInputId`; set `id` on the search
  `<input>`. [`DropdownPopover.tsx`](../../web/src/components/ui/DropdownPopover.tsx)

**Tests + CHANGELOG**
- 4-6 Vitest cases pin the contract: outside-click focus, Escape focus
  (regression), option-commit focus (regression), aria-controls
  searchable dual, aria-controls non-searchable single.
  [`fe-b5a-harden-a11y.test.tsx`](../../web/src/__checks__/fe-b5a-harden-a11y.test.tsx)
- CHANGELOG `### Fixed` (Dropdown a11y: focus + aria-controls) +
  `### Tests` (suite 97 → 101-103). No new deps.

**Verification:** `pnpm test` → 101-103 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.2 kB gzipped.