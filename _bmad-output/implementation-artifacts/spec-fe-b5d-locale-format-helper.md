---
title: 'FE-B5d — Locale-aware date/time format helper + consumer migration'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'c780158'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-fe-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5c-datepicker.md'
---

## Intent

**Problem:** Surakkha ships locale switching on `/settings` (FE-1.5d) and
ships Bangla copy for static UI strings. But every date/time string in the
running app is rendered with `toLocaleTimeString('en-GB', …)` /
`toLocaleDateString('en-GB', …)` — the locale is **hardcoded to English**.
When Anjali flips the Settings page to বাংলা, the chrome switches to Bangla
but every chain-event timestamp still reads `14:35` / `Mon, 01 Sep`. This
breaks the Bangla-primary use case NFR-FE6 (locale-aware UI) promised.

There are **6 time-format sites** and **2 date-format sites** that need
migrating, with **5 private copies of an essentially identical helper**
(`formatTime(iso)` × 4 + `fmtTime(iso)` × 1, plus 6 inline call sites that
should funnel through the same helper). Consolidating into one locale-aware
helper fixes the bug AND removes a known code-smell (duplicate helpers).

**Approach:** New `web/src/hooks/useDateFormatter.tsx` (~60 LoC) exporting
both a `useDateFormatter()` hook (reads `useLocale()`) and a pure
`formatDate(locale, mode, input)` function for non-component call sites
(e.g. `inboxListModel.ts` is a pure module with no React). Then migrate the
8 sites + 5 helper copies + 1 inline call. **No CSS change. No new deps.
No new primitives.**

This is technically not a DatePicker migration — the B5c spec listed it
under "B5d consumer migration" but the consumer need turned out to be a
pure helper extraction. The new `<DatePicker>` primitive is not consumed
in B5d; that consumption lands in B5e (real feature: AuditLog opened-between
date filter).

## Boundaries & Constraints

**Always:**
- Two exports: `useDateFormatter()` (hook) + `formatDate(locale, mode, input)`
  (pure function). The hook is a thin wrapper around the pure function.
- `mode` is a discriminated union: `'time'` (HH:MM), `'time-24'` (HH:MM
  24-hour), `'time-full'` (HH:MM:SS 24-hour), `'date-short'` (weekday-short
  + dd + month-short), `'date-medium'` (dateStyle medium), `'date-full'`
  (dateStyle full).
- All `Intl.DateTimeFormat` calls use the locale argument. Bangla falls
  through to the `bn` locale for free Bengali script output.
- `useDateFormatter()` reads `useLocale()` (B5d does NOT add a new context
  provider — `LocaleProvider` is already mounted at App root).
- New `web/src/__checks__/fe-b5d-locale-format.test.tsx` (~140 LoC, 6 cases).
- Replace each `formatTime(iso)` / `fmtTime(iso)` helper with a one-line
  call to `formatDate(locale, mode, iso)` — delete the private copy.
- i18n keys live in the existing `common.json` (no new keys — the formatter
  output is locale-driven, not string-template-driven).

**Ask First:** None — the helper is small, scope is tight, and the user
already approved this track.

**Never:**
- No new third-party deps (no `date-fns`, no `Intl.RelativeTimeFormat`
  polyfills).
- No barrel files (AD-FE-9) — the hook is consumed by direct import.
- No edits to the chain-event fetching or sorting logic in any consumer
  page — only the formatting call site changes.
- No `Intl.RelativeTimeFormat` — relative time ("2 minutes ago") is a
  separate spec (`B5e` deferred).
- No edits to the Settings page locale toggles — they already work; B5d
  just hooks up the missing consumers.
- No CSS changes — date/time tokens already exist (`--font-family-mono`
  + tabular-nums).

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_en_time | `formatDate(Locale.En, 'time-24', '2026-09-09T14:35:00Z')` | `'14:35'` |
| HAPPY_PATH_bn_time | `formatDate(Locale.Bn, 'time-24', …)` | Bengali numerals + AM/PM equivalent (e.g. `'২:৩৫ অপরাহ্ন'`) |
| HAPPY_PATH_en_date_short | `formatDate(Locale.En, 'date-short', …)` | `'Tue, 09 Sep'` |
| HAPPY_PATH_bn_date_short | `formatDate(Locale.Bn, 'date-short', …)` | Bengali script day + month (`'মঙ্গল, ০৯ সেপ'` or similar) |
| HAPPY_PATH_hook_locale | `<Harness>` inside `LocaleProvider` with `locale=Bn`; call `useDateFormatter().format('time-24', iso)` | Bengali-script output |
| HAPPY_PATH_inline | Replace `new Date(rows[0].timestamp).toLocaleTimeString('en-GB', …)` in `InboxList.tsx:231` with `useDateFormatter().format('time-24', rows[0].timestamp)` | Same rendered output, locale-aware |
| HAPPY_PATH_pure_module | `inboxListModel.ts` `fmtTime(iso)` rewritten as `formatDate(locale, 'time-24', iso)` accepting `locale` as a 1st arg (not via hook) | Pure function; no React import |
| ERROR_CASE_invalid_iso | `formatDate(Locale.En, 'time-24', 'not-a-date')` | Returns `'—'` (matches existing `formatTime` behavior — `Invalid Date` formats to `'Invalid Date'` which we collapse to `'—'`) |
| ERROR_CASE_null | `formatDate(Locale.En, 'time-24', null)` | Returns `'—'` (matches the `rows[0]?.timestamp` ternary at `InboxList.tsx:230-236`) |
| ERROR_CASE_unknown_mode | `formatDate(Locale.En, 'date-iso' as never, …)` | TypeScript prevents via discriminated union (covered by typecheck); runtime falls back to ISO string |

<frozen-after-approval>

## Spec Change Log

**Shipped (2026-09-09) — no review-loop iterations needed:**
- Implementation went straight through Step-02 → Step-05. The helper is small
  (62 LoC), the migration surface is 8 call sites + 5 helper duplicates, and
  the 6 Vitest cases pin the contract.
- **Lifecycle fix in `InboxList.tsx`**: the recent-decisions effect originally
  had `useEffect(..., [])`. Threading `locale` into `mergeRecentDecisions`
  made `locale` a real dependency, so the dep array became `[locale]`.
  When the user toggles `/settings`, the rail re-fetches and re-renders in
  the new locale. One extra fetch per locale toggle — negligible. **No
  eslint-disable added.**
- **One out-of-scope fix**: `fe-1-5b-inboxlist.test.tsx` (existing file)
  had 6 renders of `<InboxList />` without a `<LocaleProvider>` wrapper.
  Adding the context-consuming `useDateFormatter()` hook to `InboxList.tsx`
  crashed those tests. Wrapped the renders with `<LocaleProvider>` + re-seeded
  localStorage in the bn case. No behavioral test changes.
- **Bundle delta**: +0.13 kB gzipped JS (vs. +1 kB budget) — the helper
  is 62 LoC and `Intl.DateTimeFormat` is native.
- **Test count**: 91 → 97 (+6 cases).
- **`grep` verification**: zero `toLocaleTimeString` / `toLocaleDateString` /
  `'en-GB'` matches remain in `web/src/`.

## Code Map

### New helper (Layer A — shared)
- `web/src/hooks/useDateFormatter.tsx` (NEW, ~60 LoC) — exports
  `useDateFormatter()` (hook) + `formatDate(locale, mode, input)` (pure).
  Internal `format` map keyed by `mode`. Uses `Intl.DateTimeFormat` per mode.

### Consumer migrations (8 sites, ~20 LoC each)
- `web/src/pages/InboxList.tsx` (MODIFY, −5 LoC) — remove the inline
  `new Date(rows[0].timestamp).toLocaleTimeString('en-GB', …)` at line 231;
  replace with `useDateFormatter().format('time-24', rows[0].timestamp)`.
  Add `const { formatTime } = useDateFormatter()` near the top of the
  component. Add `useDateFormatter` import.
- `web/src/pages/InboxDetail.tsx` (MODIFY, −4 LoC) — delete private
  `formatTime(iso)` at lines 41-45; replace its single call site at line 289
  with `useDateFormatter().format('time', e.occurred_at)`. Wire the hook.
- `web/src/pages/AuditLog.tsx` (MODIFY, −4 LoC) — delete private
  `formatTime(iso)` at lines 83-87; replace its single call site at line 192
  with `useDateFormatter().format('time-full', chainHead.sealed_at)`.
- `web/src/pages/FieldQueuePage.tsx` (MODIFY, −6 LoC) — delete the inline
  `today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })`
  at lines 118-123; replace with `useDateFormatter().format('date-short', today)`.
- `web/src/pages/OperatorDashboard.tsx` (MODIFY, −6 LoC × 6 call sites) —
  each of the 6 inline `new Date(...).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })`
  call sites at lines 297, 346, 473, 605, 676 gets replaced with
  `formatTime(event.last_at)` (via destructured hook return). The 6th site at
  line 605 is identical to 297.
- `web/src/pages/inboxListModel.ts` (MODIFY, −4 LoC) — delete private
  `fmtTime(iso)` at lines 47-51; the 4 call sites at lines 110, 113, 116, 119
  need a `locale` argument — pass it through the call chain. Since
  `buildRows(technicianId, …)` is called from `mergeRecentDecisions`, and
  both are exported from `inboxListModel.ts`, the locale is threaded as a
  new 1st arg. `InboxList.tsx` already calls `mergeRecentDecisions(bcast,
  esc, csig, rev)` — update to `mergeRecentDecisions(locale, bcast, esc,
  csig, rev)`.

### Tests (vitest)
- `web/src/__checks__/fe-b5d-locale-format.test.tsx` (NEW, ~140 LoC, 6 cases)
  — covers: en time-24, bn time-24 (Bengali script regex), en date-short,
  bn date-short (Bengali script regex), hook wires locale, pure function
  with explicit locale arg. `afterEach` + `beforeEach` locale-storage reset
  per FE-B5c pattern.

### Read-only references
- `web/src/hooks/useLocale.tsx` — the new helper reads from this context.
- `web/src/types/domain.ts` — `Locale` enum is the only locale shape.
- `web/src/pages/StyleguidePage.tsx:131` — existing `makeOpenedAtRenderer`
  pattern (uses `useLocale()` for `Intl.DateTimeFormat`); B5d mirrors this
  shape inside the new hook.

### Reuse (no edits)
- `useLocale()` — the helper subscribes to it; no new context needed.
- `Intl.DateTimeFormat` — native API; no `date-fns`.

### CHANGELOG
- Append `### Fixed` bullet (Bangla locale now propagates to date/time
  renderers; was hardcoded `en-GB` in 8 sites). Append `### Refactor`
  bullet (5 private `formatTime`/`fmtTime` helpers consolidated into
  shared `useDateFormatter` hook). Append `### Tests` bullet (suite
  91 → 97; +6 cases). Note **zero new deps**.

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/hooks/useDateFormatter.tsx` — new file, ~60 LoC.
- [ ] `web/src/pages/InboxList.tsx` — replace inline `toLocaleTimeString`,
      wire `useDateFormatter()`.
- [ ] `web/src/pages/InboxDetail.tsx` — delete private `formatTime`, wire hook.
- [ ] `web/src/pages/AuditLog.tsx` — delete private `formatTime`, wire hook.
- [ ] `web/src/pages/FieldQueuePage.tsx` — replace inline `toLocaleDateString`,
      wire hook.
- [ ] `web/src/pages/OperatorDashboard.tsx` — replace 5 inline `toLocaleTimeString`
      call sites with `formatTime(...)`.
- [ ] `web/src/pages/inboxListModel.ts` — delete `fmtTime`, thread `locale`
      through `mergeRecentDecisions` + `buildRows` (or via a small wrapper).
- [ ] `web/src/__checks__/fe-b5d-locale-format.test.tsx` — new file, ~140 LoC,
      6 cases.
- [ ] `CHANGELOG.md` — `### Fixed` + `### Refactor` + `### Tests` bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 97 cases pass
  (91 + 6), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new errors.
- Given `pnpm --filter surakkha-app build`, when run, then succeeds; bundle
  delta ≤+1 kB gzipped (helper is tiny, no new deps).
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `formatDate(Locale.Bn, 'time-24', '2026-09-09T14:35:00Z')`, when
  called, then returns a string containing a Bengali-script character
  (U+0980–U+09FF).
- Given `/settings` toggled to বাংলা, when user navigates to `/inbox`, then
  the chain-event timestamps render in Bengali (not English `14:35`).
- Given `/audit-log`, when the chain head displays, then the sealed-at
  timestamp reads in the active locale.
- Given `pnpm --filter surakkha-app lint`, when run, then no new
  `no-undefined` warnings at the migrated sites.

## Verification

**Commands:**
- `pnpm --filter surakkha-app test` — 97 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app build` — succeeds.
- `pnpm --filter surakkha-app lint` — 0 new errors.

**Manual checks:**
- Open `/settings`, toggle Language → বাংলা.
- Navigate to `/inbox` — chain-event timestamps render in Bengali script
  (e.g. `২:৩৫` not `14:35`).
- Navigate to `/audit-log` — sealed-at timestamp + chain head + event
  timestamps all localize.
- Navigate to `/field/queue` — Today's date label localizes.
- Toggle back to English; verify all timestamps switch back (no stale render).

## Design Notes

**Why a hook + pure function (not just one or the other).** React components
need the hook to subscribe to `useLocale()`. But `inboxListModel.ts` is a
pure data-shaping module with no React imports (it would push the model
above its current size budget to import the context system). The pure
`formatDate(locale, mode, input)` lets the model stay React-free; the
component caller passes `locale` down explicitly. Two surfaces, one
underlying formatter.

**Why `'time-24'` is its own mode, not `'time'`.** AuditLog needs HH:MM:SS
24-hour (the chain head shows precise sealed-at). InboxDetail needs HH:MM
12-hour (the timeline is human-facing). FieldQueuePage needs weekday-short
+ dd + month-short. The mode union captures these once.

**Why no `Intl.RelativeTimeFormat`.** "2 minutes ago" formatting would be
useful in `OperatorDashboard` ("last seen 5m ago") but is a separate spec
(B5e). Relative-time + `setInterval` refresh is a bigger design surface
than B5d can carry without bloating past the 1,600-token ceiling.

**Why not also include the existing `makeOpenedAtRenderer` from
StyleguidePage.** That helper already reads `useLocale()` correctly (it's
the only consumer that does). B5d's job is to FIX the 8 broken sites; the
existing correct one stays. Migrating it to the new helper would be a
cosmetic refactor that doesn't fix a bug — out of scope.

**Why delete the 5 private helpers entirely.** Leaving them as
`formatTime` wrappers around `useDateFormatter()` would just add an
abstraction layer. The hook is small enough to call directly; inlining
the import at each call site is simpler than re-exporting.

## Out of scope (deferred to later specs)

- **B5e — Relative-time formatter** (`Intl.RelativeTimeFormat` for "5m
  ago" patterns across OperatorDashboard's `last_seen`, FieldQueuePage's
  job ages, InboxList timestamps). Independent spec; needs `setInterval`
  refresh design.
- **B5f — AuditLog opened-between date filter** (uses `<DatePicker>` from
  B5c). Real feature; needs a small mock-handler query-param update.
- **B5g — Settings.Anjali IncidentDate filter** (uses `<DatePicker>` from
  B5c). The Settings page currently has no filter section — this is a
  real feature addition, not a migration. Independent spec.
- **`Intl.ListFormat`** for "ward 7 · block #12 · 14:35" compound strings —
  defer until a real consumer requests it.
- **Locale-aware number formatting** (`Intl.NumberFormat` for Bangla
  numerals in counters) — defer until OperatorDashboard surfaces a count
  that's actually locale-sensitive.

## Suggested Review Order

**Helper (Layer A — pure + hook)**
- `useDateFormatter.tsx` (~60 LoC) — `formatDate(locale, mode, input)`
  pure function dispatches to one of 6 `Intl.DateTimeFormat` factories.
  `useDateFormatter()` reads `useLocale()` and returns `{ format }`.
  Hook return is memoized by `locale` so component re-renders don't
  rebuild `Intl.DateTimeFormat` instances.
  [`useDateFormatter.tsx`](../../web/src/hooks/useDateFormatter.tsx)

**Component migrations (Layer B — 5 files)**
- `InboxList.tsx` — replace inline call site; add `useDateFormatter`
  import.
- `InboxDetail.tsx`, `AuditLog.tsx` — delete private helper, add hook.
- `FieldQueuePage.tsx` — replace inline date-string call.
- `OperatorDashboard.tsx` — replace 5 inline call sites with destructured
  `formatTime` from the hook (single hook call, 5 uses).
  [`InboxList.tsx`](../../web/src/pages/InboxList.tsx) · [`InboxDetail.tsx`](../../web/src/pages/InboxDetail.tsx) · [`AuditLog.tsx`](../../web/src/pages/AuditLog.tsx) · [`FieldQueuePage.tsx`](../../web/src/pages/FieldQueuePage.tsx) · [`OperatorDashboard.tsx`](../../web/src/pages/OperatorDashboard.tsx)

**Pure-module migration (Layer B — `inboxListModel.ts`)**
- `inboxListModel.ts` — delete `fmtTime`; thread `locale` as 1st arg to
  `mergeRecentDecisions` (4 call sites). Update `InboxList.tsx` to pass
  `locale` from the hook.
  [`inboxListModel.ts`](../../web/src/pages/inboxListModel.ts)

**Tests + CHANGELOG**
- 6 Vitest cases pin the contract: en time-24, bn time-24 (regex),
  en date-short, bn date-short (regex), hook wires locale, pure function.
  [`fe-b5d-locale-format.test.tsx`](../../web/src/__checks__/fe-b5d-locale-format.test.tsx)
- CHANGELOG `### Fixed` (locale propagates to date/time renderers) +
  `### Refactor` (5 helpers → 1 shared) + `### Tests` (suite 91 → 97).
  No new deps.

**Verification:** `pnpm test` → 97 passed. `pnpm typecheck` clean.
`pnpm lint` → 0 new errors. `pnpm build` → bundle delta ≤+1 kB gzipped
(helper is ~60 LoC, Intl.DateTimeFormat already tree-shakable).
