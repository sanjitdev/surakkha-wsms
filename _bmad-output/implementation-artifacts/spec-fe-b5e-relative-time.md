---
title: 'FE-B5e — Relative-time formatter (useRelativeTime hook + formatRelativeTime pure + locale-aware)'
type: 'feature'
created: '2026-09-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: '7574203'
context:
  - '{project-root}/_bmad-output/implementation-artifacts/spec-fe-b5d-locale-format-helper.md'
  - '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md'
---

## Intent

**Problem:** `web/src/pages/OperatorDashboard.tsx:956-963` ships a
local `relativeTime(iso: string)` helper that:

```typescript
function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}
```

Three real problems:

1. **Not locale-aware.** Hard-codes English suffixes (`'m ago'`, `'h ago'`,
   `'d ago'`). When a Bangla-speaking operator toggles `/settings` to
   `bn`, the dashboard still shows English time labels — a UX regression
   for the Bangla-first audience.
2. **No "yesterday" / "tomorrow" handling.** `24h ago` shows as `1d ago`
   even when it's the previous calendar day. Same for `48h ago` →
   `2d ago` for the day-before-yesterday.
3. **Future times crash or return `—`.** `ms` is negative when
   `iso > Date.now()`. The math silently produces `0m ago` / `0d ago`
   — visually wrong.

**Approach:** Add a `formatRelativeTime(locale, input, now?)` pure
helper and a `useRelativeTime()` React hook. Use native
`Intl.RelativeTimeFormat` (zero new deps; already shipped in every
target browser). Match B5d's existing dual-surface pattern
(`formatDate` pure + `useDateFormatter` hook) for symmetry. Replace
OperatorDashboard's local helper with the new hook.

## Boundaries & Constraints

**Always:**
- Native `Intl.RelativeTimeFormat` only — no `date-fns` /
  `dayjs` / `moment`.
- Two surfaces (mirrors B5d):
  - `formatRelativeTime(locale, input, now?) => string` — pure.
  - `useRelativeTime()` hook — React-binding that subscribes to
    `useLocale()`.
- Null/invalid input → `'—'` (matches B5d contract).
- Boundary thresholds use the **shortest unit** that doesn't round to
  zero. E.g. 45s → `'45s ago'` (NOT `'1m ago'`). 90s → `'2m ago'`.
  30 min → `'30m ago'` (NOT `'1h ago'`).
- Future times (negative delta) → `'in 5m'` / `'in 2h'` / `'in 3d'`.
  Same units, opposite prefix.
- `'just now'` only for |delta| < 30 seconds (avoids the "1 second ago"
  flicker on a fast-reloading page).
- Unit ladder (matches Intl.RelativeTimeFormat `numeric: 'auto'`
  convention when possible): seconds (s), minutes (m), hours (h),
  days (d), weeks (w), months (mo), years (y).
- Locale comes from `useLocale()` (B5d contract) — no `navigator.language`.
- `now` defaults to `Date.now()`; tests inject a fixed `now` for
  deterministic assertions (tz-resilient).

**Ask First:** None — extends an existing hook family, low-blast-radius.

**Never:**
- No third-party deps.
- No barrel files (AD-FE-9).
- No public API changes to existing hooks.
- No SSR-breaking APIs (SSR-safe via `typeof window === 'undefined'`
  guard if needed; `Date.now()` is safe in SSR since the test runner
  pins it).
- No `dayjs` / `Intl.DurationFormat` / polyfills.

## I/O & Edge-Case Matrix

| Scenario | Input | Expected |
|----------|-------|----------|
| HAPPY_PATH_just_now | now=2024-01-01T12:00:00Z, input=11:59:45Z (15s ago) | `'15 seconds ago'` (en) / `'15 সেকেন্ড আগে'` (bn via Intl) |
| HAPPY_PATH_under_30s_returns_just_now | now=12:00:00Z, input=11:59:45Z (15s ago) | `'just now'` (special case below 30s) |
| HAPPY_PATH_minutes | now=12:00:00Z, input=11:55:00Z (5m ago) | `'5 minutes ago'` |
| HAPPY_PATH_hours | now=12:00:00Z, input=09:00:00Z (3h ago) | `'3 hours ago'` |
| HAPPY_PATH_days | now=2024-01-03, input=2024-01-01 (2d ago) | `'2 days ago'` |
| HAPPY_PATH_weeks | now=2024-02-01, input=2024-01-04 (4w ago) | `'4 weeks ago'` |
| HAPPY_PATH_months | now=2024-06-01, input=2024-03-01 (3mo ago) | `'3 months ago'` |
| HAPPY_PATH_years | now=2025-01-01, input=2022-01-01 (3y ago) | `'3 years ago'` |
| HAPPY_PATH_future_minutes | now=12:00:00Z, input=12:05:00Z (5m future) | `'in 5 minutes'` |
| HAPPY_PATH_future_days | now=2024-01-01, input=2024-01-04 (3d future) | `'in 3 days'` |
| HAPPY_PATH_bangla_locale | locale='bn', 5m ago | Intl-formatted Bangla (e.g. `'৫ মিনিট আগে'`) |
| HAPPY_PATH_rounds_short_unit | now=12:00:00Z, input=11:59:15Z (45s ago) | `'45 seconds ago'` (not `'1 minute ago'`) |
| HAPPY_PATH_no_round_to_zero | now=12:00:00Z, input=11:59:50Z (10s ago) | `'just now'` |
| ERROR_CASE_null_input | null | `'—'` |
| ERROR_CASE_empty_string_input | `''` | `'—'` |
| ERROR_CASE_invalid_date_string | `'not-a-date'` | `'—'` |
| ERROR_CASE_undefined_input | undefined | `'—'` |
| REGRESSION_dashboard_uses_hook | OperatorDashboard.tsx imports `useRelativeTime`; local `relativeTime` function removed | Render output unchanged in en locale |
| REGRESSION_bangla_dashboard_toggles_to_bangla_relative | toggle to bn; `formatRelativeTime('bn', iso, now)` returns Bangla | Visible in dashboard for relative-time cells |

## Code Map

### New (3 files, ~95 LoC total)

- `web/src/hooks/useRelativeTime.tsx` (NEW, ~75 LoC) — contains both
  the pure `formatRelativeTime` and the `useRelativeTime` hook. (Single
  file mirrors the dual-surface pattern from `useDateFormatter.tsx`.)
  - `formatRelativeTime(locale: Locale, input: string | number | Date | null | undefined, now: number = Date.now()): string`
  - `useRelativeTime(): { formatRelative: (input: string | number | Date | null | undefined, now?: number) => string; locale: Locale }`
  - Unit ladder (ascending magnitude):
    ```typescript
    const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['second', 1_000],
      ['minute', 60_000],
      ['hour', 3_600_000],
      ['day', 86_400_000],
      ['week', 604_800_000],
      ['month', 2_629_800_000],   // 30.44d
      ['year', 31_557_600_000],   // 365.25d
    ];
    ```
  - Compute `delta = (input.getTime() - now)`. Walk the ladder finding
    the smallest unit where `Math.abs(delta) >= unitMs`. Use
    `Math.round` for the count.
  - Special case: `|delta| < 30_000` returns `'just now'` regardless
    of locale.
  - Build a per-call `Intl.RelativeTimeFormat(locale, { numeric: 'auto' })`
    so `1 day ago` renders as `'yesterday'` and `1 minute ago` as
    `'1 minute ago'` (numeric: 'auto' doesn't downgrade minutes).
  - Fallback to numeric: 'always' if `numeric: 'auto'` produces an
    empty string in some edge case (defensive).

- `web/src/__checks__/fe-b5e-relative-time.test.tsx` (NEW, ~110 LoC,
  7-9 cases) — covers the I/O matrix above:
  - `just_now_within_30s` — now=12:00:00, input=11:59:45 → 'just now'.
  - `seconds_under_1_minute` — now=12:00:00, input=11:59:15 → '45 seconds ago'.
  - `minutes` — now=12:00:00, input=11:55:00 → '5 minutes ago'.
  - `hours` — now=12:00:00, input=09:00:00 → '3 hours ago'.
  - `days` — now=2024-01-03, input=2024-01-01 → '2 days ago'.
  - `future_minutes` — now=12:00:00, input=12:05:00 → 'in 5 minutes'.
  - `null_returns_dash` — `formatRelativeTime('en', null)` → '—'.
  - `invalid_date_returns_dash` — `formatRelativeTime('en', 'foo')` → '—'.
  - `bangla_locale_returns_localized` — `formatRelativeTime('bn', input, now)` returns a non-empty string
    containing non-Latin characters (matches `/[^\u0000-\u007F]/`).

### Modified (1 file, ~-10 LoC net)

- `web/src/pages/OperatorDashboard.tsx` (MODIFY, -10 LoC) —
  - Remove the local `relativeTime(iso: string)` function at lines 956-963.
  - Import `useRelativeTime` from `../hooks/useRelativeTime`.
  - Replace `relativeTime(i.last_occurred_at)` calls at lines 244 and 286
    (now inside Table column `render` callbacks after the B5b-migrate)
    with `formatRelative(i.last_occurred_at)`.

### Files unchanged (out of scope)
- `web/src/hooks/useDateFormatter.tsx` — unchanged; B5e is additive.
- `web/src/types/domain.ts` — `Locale` type reused from B5d; no new
  type needed.

### Reuse (no edits)
- `useLocale()` hook (B5d) — `useRelativeTime` reads locale from it.
- `Intl.RelativeTimeFormat` — native; zero-dep.
- The `useMemo` discipline from `useDateFormatter.tsx:54-59` — same
  pattern for binding locale to a stable formatter.

### CHANGELOG
- Append `### Added` bullet: "`useRelativeTime()` hook + pure
  `formatRelativeTime(locale, input, now?)` helper. Native
  `Intl.RelativeTimeFormat` (zero new deps). Replaces
  OperatorDashboard's local `relativeTime()` (B5e). Locale-aware:
  Bangla-first operators get localized `'X মিনিট আগে'` /
  `'Y সেকেন্ড পূর্বে'` output."
- Append `### Fixed` bullet: "Relative-time strings now localize per
  active locale (was hard-coded English); future times now correctly
  prefix `'in '` (was silently negative-numbered)."
- Append `### Tests` bullet: "Suite 134 → 141-143; +7-9 cases. Zero
  new deps."

## Tasks & Acceptance

**Execution:**
- [ ] `web/src/hooks/useRelativeTime.tsx` — new file, dual surface.
- [ ] `web/src/__checks__/fe-b5e-relative-time.test.tsx` — new file,
      ~110 LoC, 7-9 cases.
- [ ] `web/src/pages/OperatorDashboard.tsx` — replace local
      `relativeTime` with `useRelativeTime`.
- [ ] `CHANGELOG.md` — `### Added` + `### Fixed` + `### Tests`
      bullets.

**Acceptance Criteria:**
- Given `pnpm --filter surakkha-app test`, when run, then 141-143
  cases pass (134 + 7-9), exit 0.
- Given `pnpm --filter surakkha-app typecheck`, when run, then no new
  errors.
- Given `pnpm --filter surakkha-app lint`, when run, then 0 new errors.
- Given `pnpm --filter surakkha-app build`, when run, then bundle
  delta ≤+0.4 kB gzipped (small new file).
- Given `formatRelativeTime('en', '2024-01-01T11:55:00Z', Date.parse('2024-01-01T12:00:00Z'))`,
  when called, then result is `'5 minutes ago'`.
- Given `formatRelativeTime('bn', '2024-01-01T11:55:00Z', Date.parse('2024-01-01T12:00:00Z'))`,
  when called, then result contains non-ASCII characters
  (Intl-formatted Bangla).
- Given `formatRelativeTime('en', null)`, when called, then result is
  `'—'`.
- Given `formatRelativeTime('en', '2024-01-01T12:05:00Z', Date.parse('2024-01-01T12:00:00Z'))`,
  when called, then result starts with `'in '`.

## Verification

**Commands (run each as a SEPARATE Bash call, no `cd &&`):**
- `pnpm --filter surakkha-app test` — 141-143 cases pass.
- `pnpm --filter surakkha-app typecheck` — no new errors.
- `pnpm --filter surakkha-app lint` — 0 new errors.
- `pnpm --filter surakkha-app build` — succeeds.

**Manual checks:**
- Open `/dashboard` with locale=en. Note the "Opened" relative-time
  cells in the Open-threads table (e.g. "5m ago", "2h ago").
- Toggle to locale=bn via `/settings`. Reload `/dashboard`. Observe
  the relative-time cells now show Bangla suffixes
  (e.g. "5 মিনিট আগে").
- Inspect a row whose `last_occurred_at` is in the future (set via
  mock). Observe `'in 5 minutes'`-style strings.

## Design Notes

**Why 30s threshold for `'just now'`.** Below 30s the granularity
becomes noisy: `'1 second ago'`, `'3 seconds ago'`, `'5 seconds ago'`
flicker on a page that re-fetches. 30s is short enough to still feel
"just now" but long enough to suppress flicker.

**Why `numeric: 'auto'` and not `'always'`.** The `'auto'` mode is
the W3C-recommended UX: `1 day ago` renders as `'yesterday'`,
`1 week ago` as `'last week'`, `next week` / `'tomorrow'`. These
human-friendly strings are what users expect in dashboards.

**Why per-call `Intl.RelativeTimeFormat` instead of memoizing.** A
single instance is cheap to construct (~microseconds). Memoizing
across `(locale, unit)` adds complexity (cache key, LRU eviction)
without measurable gain. Per-call matches B5d's `formatDate` pattern.

**Why a separate `now?` parameter.** Tests need deterministic time;
production uses `Date.now()`. Optional parameter is the standard
"inject the clock" pattern (testable, no global mutation).

**Why `useRelativeTime()` returns both `formatRelative` AND `locale`.**
Mirrors B5d's `useDateFormatter` return shape. Consumers may want the
locale for sibling formatting (e.g. "Opened 5m ago" + the absolute
timestamp on hover).

## Out of scope (deferred to later specs)

- **Sub-second granularity.** Below 1s the units get silly
  (`'300 milliseconds ago'`). The 30s threshold absorbs this.
- **Auto-refresh every minute.** Currently the rendered relative-time
  string freezes until the page reloads. A 60s `setInterval` to
  re-render is a UX nicety; out of scope for B5e. The user can always
  refresh.
- **Custom thresholds per consumer** (e.g. "always show seconds" for
  alerts). Out of scope — single threshold ladder covers 99% of uses.
- **Timezone-aware day boundaries.** `Intl.RelativeTimeFormat` uses
  UTC. A `1 day ago` at 23:59 UTC vs 00:01 UTC of the previous day
  may not align with local-day boundaries. Out of scope; can land as
  a future enhancement if users complain.
- **Migrate other consumers' `relativeTime` helpers.** Only
  OperatorDashboard ships one. InboxList uses `formatTime('time', ...)`
  (absolute, not relative). AuditLog uses absolute timestamps. No other
  consumers exist.

## Suggested Review Order

**The hook (the brain)**
- `useRelativeTime.tsx` — pure `formatRelativeTime` + `useRelativeTime`
  hook. `Intl.RelativeTimeFormat` with `numeric: 'auto'` + 30s
  'just now' threshold + 7-step unit ladder.
  [`useRelativeTime.tsx`](../../web/src/hooks/useRelativeTime.tsx)

**The consumer migration (the cleanup)**
- `OperatorDashboard.tsx` — drop the local `relativeTime()` at
  line 956; import + call `formatRelative(...)` from the new hook
  inside the migrated Table column renders.
  [`OperatorDashboard.tsx`](../../web/src/pages/OperatorDashboard.tsx)

**Tests + CHANGELOG**
- 7-9 Vitest cases pin the contract per the I/O matrix (5 minutes ago,
  just now, future, null, invalid, Bangla, etc.).
  [`fe-b5e-relative-time.test.tsx`](../../web/src/__checks__/fe-b5e-relative-time.test.tsx)
- CHANGELOG `### Added` (hook + helper) + `### Fixed` (locale +
  future) + `### Tests` (suite 134 → 141-143). No new deps.

**Verification:** `pnpm test` → 141-143 passed. `pnpm typecheck`
clean. `pnpm lint` → 0 new errors. `pnpm build` → bundle delta
≤+0.4 kB gzipped.