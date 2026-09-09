---
title: 'FE-B5a-flip — Dropdown popover viewport-collision auto-flip'
type: 'refactor'
created: '2026-09-09'
status: 'approved'
review_loop_iteration: 0
baseline_commit: '5c1ca3c'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** The shipped Dropdown popover is positioned via CSS
`position: absolute; top: calc(100% + var(--space-sm))`
(`web/src/styles/dropdown.css:110-124`). When the trigger is near the
bottom of the viewport, the popover overflows below the fold — clipped
by ancestor `overflow: hidden` containers or simply hidden off-screen.

This is especially bad on:
1. **Modal/dialog contexts** — the popover is clipped by the modal's
   own `overflow: auto`.
2. **Long pages** — any dropdown near the page footer overlaps content
   below.
3. **Short viewports** — at viewport heights < 600px (laptops with
   split windows, large-font users), the popover scrolls before
   reaching the bottom.

The mobile floor (≤767px) already collapses the popover to a bottom
sheet — that's the right pattern for mobile. But desktop (>768px) has
no fallback; users get a clipped popover.

**Approach:** Add a JS-side viewport-collision check that runs when the
popover opens. If the trigger is in the bottom half of the viewport,
flip the popover above the trigger. Implementation uses
`getBoundingClientRect` on the trigger and `window.innerHeight` — no
third-party popper libs. The flip is signalled via a `data-placement`
attribute on the popover (CSS handles the actual positioning). Falls
back gracefully when `getBoundingClientRect` is unavailable (SSR /
jsdom).

## Boundaries & Constraints

**Always:**
- Flip detection runs in a `useLayoutEffect` (synchronous before paint)
  inside `useDropdownState`. Updates a `placement` state ('below' |
  'above').
- Trigger threshold: flip if `triggerRect.bottom + 240 (max popover
  height) > window.innerHeight - 16 (safety margin)`.
- No third-party deps. No popper.js. Native `getBoundingClientRect` +
  `window.innerHeight`.
- SSR-safe: `typeof window === 'undefined'` guard skips measurement.
- jsdom test-safe: tests can pass a mock `window.innerHeight` via
  `Object.defineProperty(window, 'innerHeight', { value: 600 })` before
  open.
- Desktop-only: mobile (≤767px) already uses `position: fixed; bottom:
  0` and shouldn't flip. The CSS rule keeps its media-query carve-out.
- New `web/src/__checks__/fe-b5a-flip-placement.test.tsx` (~80 LoC,
  4-5 cases).
- 100% backward compat: existing 109-case suite stays green.

**Ask First:** None — pure UX fix, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No public `DropdownProps` change.
- No animation/transition (deferred — flipping is a discrete jump).
- No resize observer (popover stays at the placement set on open; if
  the user scrolls, the popover scrolls with the trigger because
  position is absolute relative to the trigger). Acceptable for
  Phase 1.

## I/O & Edge-Case Matrix

| Scenario | Window / trigger | Expected placement |
|----------|------------------|-------------------|
| HAPPY_PATH_below_default | trigger near top of viewport (e.g. y=100), viewport=900 | `below` |
| HAPPY_PATH_above_when_no_room_below | trigger at y=750, viewport=900 (240px popover would overflow) | `above` |
| HAPPY_PATH_exact_threshold | trigger at y=644, viewport=900 (240+16 = 656; bottom would be 644+240=884 ≤ 884) | `below` (boundary inclusive) |
| HAPPY_PATH_short_viewport | trigger at y=400, viewport=500 (240px popover bottom=640 > 484) | `above` |
| HAPPY_PATH_mobile_no_flip | viewport=600 wide (mobile breakpoint), trigger at y=550 | mobile CSS overrides to `position: fixed; bottom: 0`; `data-placement` is irrelevant (mobile popover pins to viewport floor) |
| ERROR_CASE_undefined_window | SSR (no `window`) | `placement` defaults to `'below'` |
| ERROR_CASE_zero_viewport | `window.innerHeight = 0` (jsdom edge) | `placement` defaults to `'below'` (no flip possible) |
| REGRESSION_open_then_resize_doesnt_flip | open, resize window to shrink below | popover stays at initial placement (acceptable; out of scope to support live resize) |
| REGRESSION_escape_closes | popover open above trigger; press Escape | closes + restores focus (unchanged) |

<frozen-after-approval>

## Spec Change Log

(To be appended after Step-05 ships.)

## Code Map

### Modified (3 files, ~25 LoC net)

- `web/src/components/ui/useDropdownState.ts` (MODIFY, +15 LoC) —
  - Add `placement: 'below' | 'above'` state.
  - Add a `useLayoutEffect` that runs when `open === true`:
    - Read `triggerRef.current?.getBoundingClientRect()`.
    - Compute `wouldOverflow = rect.bottom + 240 + 16 > window.innerHeight`.
    - Set `placement = wouldOverflow ? 'above' : 'below'`.
    - SSR-safe via `typeof window === 'undefined'` guard.
  - Add `placement` + `setPlacement` to the `DropdownState<T>` interface.
  - Return `placement` from the hook.

- `web/src/components/ui/Dropdown.tsx` (MODIFY, +3 LoC) —
  - Destructure `placement` from state at line 47.
  - Pass `placement={placement}` to `<DropdownPopover>` (line 116 area).

- `web/src/components/ui/DropdownPopover.tsx` (MODIFY, +2 LoC) —
  - Add `placement: 'below' | 'above'` to `DropdownPopoverProps`.
  - Add `data-placement={placement}` to the popover `<div>` at line 40.

- `web/src/styles/dropdown.css` (MODIFY, +8 LoC) —
  - Add `[data-placement='above']` selector: `bottom: calc(100% + var(--space-sm)); top: auto;`.
  - Keep mobile `@media (max-width: 767px)` carve-out; it already
    forces `position: fixed; bottom: 0; top: auto;` which overrides
    any data-placement.

### Tests (vitest)

- `web/src/__checks__/fe-b5a-flip-placement.test.tsx` (NEW, ~80 LoC,
  4-5 cases) — covers the I/O matrix:
  - `placement_below_when_room_available` — viewport=900, trigger at
    y=100; assert `data-placement="below"`.
  - `placement_above_when_no_room_below` — viewport=900, trigger at
    y=750; assert `data-placement="above"`.
  - `placement_at_threshold_inclusive` — viewport=900, trigger at
    y=644; assert `data-placement="below"` (boundary).
  - `placement_short_viewport_flips` — viewport=500, trigger at y=400;
    assert `data-placement="above"`.
  - `placement_mobile_uses_fixed_bottom_sheet` — viewport width=600
    (mobile breakpoint) AND trigger at y=550; assert the popover has
    `position: fixed` and `data-placement` is irrelevant (but should
    still be set, since the data attr is unconditional).
  - **Note**: jsdom doesn't compute real layout, so trigger rect
    mocking uses `Element.prototype.getBoundingClientRect = vi.fn(() => ({ top: y, bottom: y+40, ... }))`. Or override
    `window.innerHeight`. Tests should set
    `Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 })` and mock the trigger's rect via
    a ref + `Element.prototype.getBoundingClientRect`.

### Read-only references
- `web/src/styles/dropdown.css:179-190` — existing mobile floor CSS;
  confirmed compatible (mobile overrides to `position: fixed; bottom: 0`
  regardless of data-placement).

### Reuse (no edits)
- The existing `useLayoutEffect` discipline (sync before paint) used
  in B5c's `useCalendar.ts:31-37` for the "today" memoization — same
  pattern, just for viewport measurement.
- The CSS variable system — `--space-sm`, `--radius-md` etc. are
  already in the design system. No new tokens needed.

### CHANGELOG
- Append `### Fixed` bullet: "Dropdown popover now flips above the
  trigger when there isn't 240px + 16px of room below the viewport
  edge (B5a-1 — viewport-collision auto-flip). Mobile bottom-sheet
  behavior unchanged."
- Append `### Tests` bullet: "Suite 109 → 113-114; +4-5 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `useDropdownState.ts` — add `placement` state + `useLayoutEffect`
      measurement; expose via interface + return.
- [ ] `Dropdown.tsx` — destructure `placement`; pass to popover.
- [ ] `DropdownPopover.tsx` — accept `placement` prop; set
      `data-placement` attribute.
- [ ] `dropdown.css` — add `[data-placement='above']` rule; confirm
      mobile carve-out unaffected.
- [ ] `fe-b5a-flip-placement.test.tsx` — new file, ~80 LoC, 4-5 cases.
- [ ] `CHANGELOG.md` — `### Fixed` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 113-114 cases
  pass (109 + 4-5), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.3 kB gzipped.
- Given a viewport=900 with a Dropdown trigger at y=750, when the user
  opens the popover, then `data-placement="above"` is set on the
  popover and CSS positions it above the trigger.
- Given a viewport=900 with a Dropdown trigger at y=100, when the user
  opens the popover, then `data-placement="below"` is set.
- Given a viewport width ≤ 767px (mobile), when the user opens the
  popover, then CSS `position: fixed; bottom: 0` overrides any
  data-placement (mobile bottom sheet still works).
- Given the popover is open above the trigger, when the user presses
  Escape, then focus returns to the trigger (regression check).

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 113-114 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Resize the browser window to ~400px tall. Open any Dropdown example
  on the styleguide page. Observe the popover flips above the trigger
  when the trigger is near the bottom.
- Resize to mobile width (≤767px). Open a Dropdown. Observe the
  popover still pins to the viewport floor as a bottom sheet (no flip).
- Resize to desktop. Trigger near top of viewport. Observe the
  popover renders below the trigger (default placement).

## Design Notes

**Why `useLayoutEffect` not `useEffect`.** Layout effects run
synchronously after DOM mutations but before browser paint. This
prevents a one-frame flash of the popover in the wrong position. The
existing `useCalendar.ts` uses the same pattern for the same reason.

**Why `data-placement` attribute and not inline `style.top`.** CSS-only
positioning keeps the JS layer free of measurement-driven styles (no
inline style strings to diff in React). The CSS rule
`[data-placement='above']` is a single 2-line addition.

**Why 240px as the assumed popover height.** It's the existing
`max-height: 240px` from `dropdown.css:148`. Using the actual rendered
height would require a ref + measurement (extra reflow). 240px is the
worst case — if the list is shorter, we may flip unnecessarily, which
is acceptable. A future iteration could use `ResizeObserver` for exact
measurement, but that's out of scope.

**Why no resize observer.** When the user opens the popover and then
resizes the window, the placement doesn't update. Acceptable for
Phase 1: dropdowns are typically short-lived, and resizing while a
popover is open is a corner case. Documented as a known limitation
in the spec's "Out of scope" section.

**Why not also flip horizontally.** Dropdowns are full-width by
default (`min-width: 100%`, `right: 0`) so horizontal collision is
rare. If a Dropdown is used inside a narrow container (e.g. inside a
modal sidebar), horizontal collision is possible but the parent
container clips anyway. Out of scope.

## Out of scope (deferred to later specs)

- **Resize observer for live placement updates** — popover stays at
  the placement set on open. Acceptable for Phase 1.
- **Smooth flip animation** — discrete jump between placements.
  Deferred to a motion pass.
- **Horizontal collision detection** — only vertical flip for now.
- **Popper.js integration** — explicitly avoided; native APIs are
  sufficient for the 240px max-height case.
- **Re-running placement on scroll** — popover scrolls with the
  trigger because position is absolute relative to the trigger.

## Suggested Review Order

**State hook (the brain)**
- `useDropdownState.ts` — add `placement` state + `useLayoutEffect`
  measurement. SSR-safe via `typeof window === 'undefined'`. jsdom
  test-safe by mocking `window.innerHeight` + element rects.
  [`useDropdownState.ts`](../../web/src/components/ui/useDropdownState.ts)

**Composition root + popover (the wiring)**
- `Dropdown.tsx` — destructure `placement`; pass to popover.
- `DropdownPopover.tsx` — accept `placement` prop; set
  `data-placement` attribute.
  [`Dropdown.tsx`](../../web/src/components/ui/Dropdown.tsx) · [`DropdownPopover.tsx`](../../web/src/components/ui/DropdownPopover.tsx)

**CSS (the visual flip)**
- `dropdown.css` — add `[data-placement='above']` selector. Mobile
  carve-out untouched.
  [`dropdown.css`](../../web/src/styles/dropdown.css)

**Tests + CHANGELOG**
- 4-5 Vitest cases pin the contract: below default, above when no
  room, threshold inclusive, short viewport flips, mobile uses
  bottom-sheet.
  [`fe-b5a-flip-placement.test.tsx`](../../web/src/__checks__/fe-b5a-flip-placement.test.tsx)
- CHANGELOG `### Fixed` (popover flips above when no room) +
  `### Tests` (suite 109 → 113-114). No new deps.

**Verification:** `pnpm test` → 113-114 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.3 kB gzipped.