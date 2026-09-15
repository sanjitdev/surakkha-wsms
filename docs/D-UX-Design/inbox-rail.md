# InboxRail — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/InboxRail.tsx` (severity rail + awaiting-action rail + recent-decisions rail; consumed by `InboxList.tsx`)
> **Source scenario:** [C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md](../../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md)
> **Actors:** Priya (operator, primary)

---

## 1. Existing implementation inventory

`InboxRail.tsx` exports three pure-presentational sub-rails consumed by `InboxList.tsx`: `SeverityRail` (4 horizontal bars for T3/T2/T1/T0 with Hbar components), `AwaitingActionRail` (top-2 rows where `isAwaitingSig`, mini-table view), `RecentDecisionsRail` (last 4 decisions across 4 event types). No hooks, no fetches; data passed via props.

## 2. Lockdown binding (compact)

- Container is part of the operator three-column surface (foundation §3.2: 240px left rail).
- Severity bars: T0/T1 share divider neutral; T2 = amber; T3 = alert-red-reserved (only on issuance path) per lockdown.
- **T3 in operator chrome** (rail summary, NOT issuance) needs a non-reserved colour — amber-bright is the candidate (foundation §1.2).
- AwaitingActionRail uses inline `style={{ background: r.severity === 'T3' ? 'var(--danger)' : 'var(--warning)' }}` for severity dot — same alert-red reservation issue as InboxList.
- Recent-decision timestamps render via `formatDate(locale, 'time-24', ...)` — Bangla locale-aware per lockdown §11.5.
- No glyph + text redundancy on the rail bar labels — they show "T3/T2/T1/T0" as text but no glyph character (foundation §4.1). MINOR — current text-only pattern is OK because the rail is operator-only; lockdown glyph redundancy applies to badges, not summary bars.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | T3 bar colour | `var(--danger)` (alert-red) | Alert-red reserved for issuance path | MEDIUM — swap to `--color-amber-bright` or to a non-reserved T3 indicator until issuance path is wired. |
| 2 | T2 bar colour | `var(--warning)` (amber) | `--color-trust-t2` (amber `#B8801E`) | OK — semantically aligned; legacy token happens to match lockdown amber. |
| 3 | T1 bar colour | `var(--info)` (sky-blue legacy) | `--color-trust-t1` = `--color-divider` neutral (`#E1DDD4`) | MEDIUM — sky-blue T1 is the inverted semantics flag from audit §B.1. Swap to divider neutral. |
| 4 | T0 bar colour | `var(--band-medium)` | `--color-trust-t0` = `--color-divider` neutral | MINOR — same semantic; legacy token is a darker neutral. Swap to divider for parity with T1. |
| 5 | AwaitingActionRail severity dot | Inline `var(--danger) / var(--warning)` | Same as #1 | MEDIUM — same reservation issue. |
| 6 | Recent-decisions locale | `formatDate(locale, 'time-24', …)` | Locale-at-container; Bangla numerals per lockdown §11.5 | OK |
| 7 | Hbar geometry | `Math.round((value / total) * 100)` | N/A — pure data | OK |
| 8 | Empty state for recent-decisions | Inline `<li>` with empty markers | Empty state pattern (foundation §7.6) | OK |
| 9 | `aria-hidden="true"` on row-severity-dot | present | Lockdown §10.4 requires aria-label on trust-band badges; the dot is decorative, the badge carries the label | OK |

## 4. Migration plan

1. Replace `var(--danger)` with `var(--color-amber-bright)` on T3 Hbar fill and T3 awaiting-action dot. **Reservation rule:** alert-red-reserved is only for the T3+ consumer-notice issuance confirmation modal — never on the rail.
2. Replace `var(--info)` with `var(--color-trust-t1)` (divider neutral) on the T1 Hbar fill.
3. Add reporter-badge column or chip to AwaitingActionRail so Anjali's anchor reporter row is identifiable — currently the rail inherits the InboxList row, which has no reporter-badge either (see inbox-list.md §4 #2).
4. Bind Bangla numerals on `formatDate(locale, 'time-24', …)` output per lockdown §11.5; verify `useDateFormatter` already passes through.

## 5. Open questions

1. Should the rail show reporter badges (anchor/hotline/webform/sensor) on each AwaitingAction row, or is the parent InboxList row enough?
2. Confirm `var(--danger)` resolution chain: is it `--color-alert-red` (lockdown reserved) or a legacy brand red? If legacy, no lint risk, but worth documenting.
