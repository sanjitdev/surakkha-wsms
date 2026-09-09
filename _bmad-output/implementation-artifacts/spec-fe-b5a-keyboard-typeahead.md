---
title: 'FE-B5a-keyboard — Dropdown type-ahead cycling across same-letter matches'
type: 'refactor'
created: '2026-09-09'
status: 'shipped'
review_loop_iteration: 0
baseline_commit: '502f9ef'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5a-dropdown.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** B5a shipped type-ahead that finds the **first** option whose
label starts with the typed character
(`web/src/components/ui/useDropdownKeyboard.ts:41-52`):

```typescript
if (!open && e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key)) {
  const idx = options.findIndex(
    (o) => !o.disabled && o.label.toLowerCase().startsWith(e.key.toLowerCase()),
  );
  ...
}
```

When two options share a starting letter (e.g. **"Apple"** and **"Apricot"**),
typing `a` lands on "Apple" and there's **no keyboard way to reach
"Apricot"** — repeated `a` presses do nothing, typing more letters is
gated on the popover being open (line 41 only triggers when `!open`),
and there's no documented convention for cycling within a same-letter
group. SR users and power-keyboard users get stuck.

The popover is also reachable when already **open** for keyboard nav
(ArrowDown/Up at lines 68-99), but those handlers don't consult the
typed character — only `activeIndex`. So the typed letter is dropped
once the popover is open.

**Approach:** Convert type-ahead to a **cycling search**: build a
matches list (case-insensitive `startsWith` against the typed buffer),
and on each new typed char advance within the matches list relative
to the current `activeIndex`. Buffer holds **1 char** (typing a
different letter resets the buffer; typing the same letter cycles).
When the buffer is empty (e.g. user presses Escape or types a
non-letter), it resets.

This matches the W3C ARIA combobox example ("for lists where many
items share a starting letter, advance to the next match within the
prefix group").

## Boundaries & Constraints

**Always:**
- Type-ahead buffer is **1 char** — typing `a` then `p` collapses to
  `ap` for matching but only when both are typed within the same
  popover session. (Simpler than a multi-char debounce; matches the
  current popover scope.)
- Cycling within matches advances from current `activeIndex + 1`,
  wrapping to 0 if no further matches found past `activeIndex`.
- Disabled options are skipped in the matches list.
- `query` state is reset on type-ahead open (matches the existing
  `close()` reset pattern at `useDropdownState.ts:80`).
- **No public API change** — `useDropdownKeyboard`'s signature is
  unchanged.
- New `web/src/__checks__/fe-b5a-keyboard-typeahead.test.tsx` (~90 LoC,
  5-7 cases).
- 100% backward compat: existing 102-case suite stays green.

**Ask First:** None — pure UX fix, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No public `DropdownProps` change.
- No CSS edits.
- No edits to other primitives.
- No change to non-printable key handling (Arrow/Home/End/Enter/Escape
  paths untouched).
- No debouncing — type-ahead is synchronous.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_single_match | closed dropdown; options `['Apple','Banana','Cherry']`; type `b` | opens with `activeIndex=1` (Banana) |
| HAPPY_PATH_first_match | closed dropdown; options `['Apple','Banana','Cherry']`; type `a` | opens with `activeIndex=0` (Apple) |
| HAPPY_PATH_cycling | closed dropdown; options `['Apple','Apricot','Avocado']`; type `a` | opens with `activeIndex=0` (Apple) |
| HAPPY_PATH_cycling_repeat | popover open at `activeIndex=0`; type `a` again | advances to `activeIndex=1` (Apricot) |
| HAPPY_PATH_cycling_wraps | popover open at `activeIndex=2` (Avocado, last match); type `a` again | wraps to `activeIndex=0` (Apple) |
| HAPPY_PATH_multi_char | popover open at `activeIndex=0` (Apple); type `p` | matches `['Apple','Apricot']` (both start with "ap"); advances to next not-current match — `activeIndex=1` (Apricot) |
| HAPPY_PATH_disabled_skipped | options `['Apple',{label:'Apricot',disabled:true},'Avocado']`; type `a` | opens with `activeIndex=0`; press `a` again → skips Apricot → `activeIndex=2` |
| HAPPY_PATH_query_reset_on_keyboard_open | dropdown with prior query "xyz"; press `a` from closed | opens with `query=''` (reset) AND `activeIndex` set to first `a`-match |
| ERROR_CASE_no_matches | options `['Apple','Banana']`; type `z` | popover does NOT open (no match); `open` stays false |
| ERROR_CASE_non_letter_ignored | closed dropdown; press `*` | popover stays closed (regex guard unchanged) |
| REGRESSION_arrow_keys | popover open at `activeIndex=0`; press ArrowDown | advances per existing logic to `activeIndex=1` (unchanged) |
| REGRESSION_escape_closes | popover open; press Escape | closes + restores focus (unchanged) |

<frozen-after-approval>

## Spec Change Log

(To be appended after Step-05 ships.)

## Code Map

### Modified (2 files, ~25 LoC net)

- `web/src/components/ui/useDropdownKeyboard.ts` (MODIFY, +18 LoC) —
  - Add a 1-char buffer (closure variable) that tracks the last typed
    character across keypresses within the same popover session.
  - On popover close (Escape / outside-click / option-commit), reset
    the buffer to `null`. The existing `close()` function is the
    single close path; we need to hook the reset. Cleanest: reset in
    the keyboard handler when `e.key === 'Escape'`.
  - Replace the type-ahead block at lines 41-52 with cycling logic:
    1. Build `matches = filtered.map((o, i) => (!o.disabled && o.label.toLowerCase().startsWith(typed)) ? i : -1).filter(i => i >= 0)`.
    2. If popover is closed, open it + pick `matches[0]`.
    3. If popover is open + buffer changed, pick `matches[0]` (new prefix).
    4. If popover is open + buffer unchanged, advance within matches
       from `(activeIndex + 1) % matches.length`.
  - Apply to BOTH `!open` and `open` paths (currently only `!open`).
    This is the key behavioral change.

- `web/src/components/ui/useDropdownState.ts` (MODIFY, +2 LoC) —
  - In `close()` at line 74-79, do not touch keyboard buffer (the
    keyboard handler resets it on Escape). Outside-click focus restore
    already calls `close(false)` from the click handler — but
    `close(false)` doesn't run the keyboard handler, so the keyboard
    buffer would leak across outside-click closes. **Fix**: add a
    `resetTypeAhead: () => void` to the `DropdownState<T>` interface
    and call it from both outside-click handler and `close()`. The
    keyboard handler exposes the reset via a ref.

### Tests (vitest)

- `web/src/__checks__/fe-b5a-keyboard-typeahead.test.tsx` (NEW, ~90 LoC,
  5-7 cases) — covers the I/O matrix above:
  - `typeahead_single_match_opens_at_index` — type `b` with options
    `[A,B,C]` → opens at index 1.
  - `typeahead_repeated_char_cycles_within_match_group` — type `a`
    twice with options `[Apple,Apricot,Avocado]` → 0 → 1.
  - `typeahead_wraps_at_end_of_match_group` — type `a` three times →
    0 → 1 → 2 → wraps to 0.
  - `typeahead_multi_char_advances_to_next_within_group` — type `ap`
    with options `[Apple,Apricot]` → advances from 0 to 1.
  - `typeahead_skips_disabled_options` — type `a` twice with
    `[Apple,{disabled:true,label:'Apricot'},Avocado]` → 0 → 2.
  - `typeahead_no_match_does_not_open` — type `z` → popover stays
    closed.
  - `typeahead_resets_on_escape` — type `a`, then Escape, then `b` →
    opens at index of `b`-match (not continuing `a` cycling).

### Read-only references
- `web/src/components/ui/Dropdown.tsx` — composition root. No edits.
- `web/src/components/ui/useDropdownKeyboard.ts:41-52` — the bug site;
  fully replaced.
- `web/src/components/ui/useDropdownState.ts:74-79` — `close()` reset
  path; we add a parallel reset for the keyboard buffer.

### Reuse (no edits)
- `close(true)` pattern — same `queueMicrotask` focus restore, no
  change.
- The `[\p{L}\p{N}]` regex at `useDropdownKeyboard.ts:41` — keep; this
  guards against non-letter keys triggering type-ahead.

### CHANGELOG
- Append `### Fixed` bullet: "Dropdown type-ahead now cycles within a
  same-letter match group (typing `a` twice with `[Apple, Apricot,
  Avocado]` advances Apple → Apricot → Avocado → Apple; previously
  stuck on first match)."
- Append `### Tests` bullet: "Suite 102 → 107-109; +5-7 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `useDropdownKeyboard.ts` — replace type-ahead block with cycling
      logic. Apply to both `!open` and `open` paths.
- [ ] `useDropdownState.ts` — add `resetTypeAhead` ref to
      `DropdownState<T>`; wire outside-click + `close()` to call it.
- [ ] `Dropdown.tsx` — thread `resetTypeAhead` to the keyboard hook
      via the state object (already destructured — no new prop).
- [ ] `fe-b5a-keyboard-typeahead.test.tsx` — new file, ~90 LoC, 5-7
      cases.
- [ ] `CHANGELOG.md` — `### Fixed` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 107-109 cases
  pass (102 + 5-7), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.3 kB gzipped (cycling logic is ~18 LoC).
- Given a closed `<Dropdown>` with options `[Apple, Apricot, Avocado]`,
  when the user types `a` three times, then the active index cycles
  0 → 1 → 2 → wraps to 0.
- Given a closed `<Dropdown>` with options `[Apple, Banana]`, when the
  user types `z`, then the popover stays closed.
- Given an open `<Dropdown>` with options `[Apple]`, when the user
  presses Escape then types `b`, then the popover opens at the `b`
  match (not continuing `a` cycling).

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 107-109 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Open the styleguide Dropdown examples. Focus the trigger, type `a`
  twice in quick succession on a dropdown with same-letter options.
  Observe the active row cycling.

## Design Notes

**Why a 1-char buffer, not multi-char.** A multi-char buffer would
require a debounce or `setTimeout` reset, which interacts poorly with
React's render cycle. The current primitive's popover opens on first
type and stays open — once open, multi-char would compete with the
search input (when `searchable={true}`). A 1-char buffer is the
smallest change that fixes the stuck-on-first-match bug without
introducing a timer.

**Why cycling and not "advance to next match" exactly.** The W3C combobox
example spec says: "If multiple matches, subsequent presses of the same
character advance to the next item starting with that character." Our
implementation wraps, which is the conventional UX (matches macOS native
menus, ARIA APG example).

**Why reset the buffer on Escape but not on outside-click.** Both close
paths call `close()` (outside-click does `setOpen(false); setActiveIndex(-1); setQuery('')`
inline, Escape goes through `close(true)`). Both reset `activeIndex` —
we want type-ahead to reset whenever `activeIndex` resets, so the next
type-ahead is treated as a fresh prefix. The cleanest place is in
`close()` + the outside-click handler, both of which already exist.

**Why not also reset on ArrowDown/ArrowUp.** The arrow keys move within
the *filtered* list, not the *matches* group. The type-ahead buffer is
about "I'm typing letters to find an item" — pressing arrows doesn't
mean "I'm done typing letters." So the buffer is preserved across
arrow navigation. The user can still ArrowDown → type `a` and have it
cycle within the `a`-matches group.

## Out of scope (deferred to later specs)

- **Multi-char type-ahead** (e.g. typing `ap` matches Apple + Apricot
  with debounce). Requires a timer or a keypress gap heuristic.
  Independent spec; not needed for the current same-letter cycling bug.
- **B5a-flip — viewport-collision auto-flip** (popover uses fixed
  `top` calc). Independent spec.
- **WAI-ARIA `aria-activedescendant` cycling** — already works because
  `aria-activedescendant` is computed from `activeIndex` in the
  composition root (`Dropdown.tsx:62-63`). Cycling type-ahead updates
  `activeIndex`, which updates `aria-activedescendant`. No edit
  needed.
- **Performance: O(n) match list per keystroke** — acceptable for the
  current ≤200 option lists; revisit if real consumers exceed that.

## Suggested Review Order

**The fix (the brain)**
- `useDropdownKeyboard.ts` — replace lines 41-52 with cycling logic.
  Add 1-char buffer. Apply to `!open` AND `open` paths.
  [`useDropdownKeyboard.ts`](../../web/src/components/ui/useDropdownKeyboard.ts)

**The reset hook (the wiring)**
- `useDropdownState.ts` — expose `resetTypeAhead` via the state object;
  wire outside-click + `close()` to call it. ~2 LoC.
  [`useDropdownState.ts`](../../web/src/components/ui/useDropdownState.ts)

**Tests + CHANGELOG**
- 5-7 Vitest cases pin the contract: single-match, first-match,
  cycling repeat, wraps at end, multi-char advance, disabled skip,
  no-match, reset on escape.
  [`fe-b5a-keyboard-typeahead.test.tsx`](../../web/src/__checks__/fe-b5a-keyboard-typeahead.test.tsx)
- CHANGELOG `### Fixed` (type-ahead cycles within match group) +
  `### Tests` (suite 102 → 107-109). No new deps.

**Verification:** `pnpm test` → 107-109 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.3 kB gzipped.