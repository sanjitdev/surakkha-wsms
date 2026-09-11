# InboxList — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/InboxList.tsx` (+ `web/src/pages/inboxListModel.ts`, `web/src/pages/InboxRail.tsx` for rail)
> **Source scenario:** [C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md](../../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md) (Priya inbox list)
> **Actors:** Priya (operator, primary); Karim (read-only); Adi (audit view); PHA Viewer (read)

---

## 1. Existing implementation inventory

`InboxList.tsx` renders a 3-card right rail (severity bars, awaiting-action mini-table, recent-decisions timeline) and a primary table of incidents keyed by `IncidentCreated` events. Each row carries severity dot, thread title (link to InboxDetail), ward, owner avatar, severity badge, and action link. The page is wrapped in `<AppLayout>` (top-chrome + sidebar owned by parent). Filter chips (all / T3 / awaiting-sigs / drafts / citizen / resolved) drive `visibleRows`. Bulk-bar Mark-reviewed CTA fires `SignatureAttestation(action: reviewed_by_operator)` per selected row. Data flows from `useIncidents()` hook via `/api/events?event_type=IncidentCreated`.

## 2. Lockdown binding (compact)

- Trust-band badge: glyph + text (foundation §1.1, audit §B.1) — current `badge--t1/t2/t3` classes still bind to legacy `--band-*` tokens; tokens are additive per `01-token-deconfliction-plan.md` §C. **Migration:** progressively swap to `--color-trust-t1/t2/t3`.
- T1 = divider neutral (audit §B.15, lockdown §trust-band-palette); not a brand colour.
- Tier badge at `--font-size-2` (14 px) per lockdown (foundation §2.4, audit §D.4).
- Reporter badge: separate dimension from trust band (foundation §1.1); anchors get `--color-reporter-anchor`, hotline `--color-reporter-hotline`, webform `--color-reporter-webform`, sensor `--color-reporter-sensor`.
- Container: `ContainerWidth.Wide` (1280) per three-column operator surface (foundation §3.2).
- Filter chip row is a `role="tablist"` pattern; current aria-label is OK.
- Severity dot colour is **redundant** with the trust band badge — both are accessibility-required (foundation §12 rule 3: glyph + text redundancy). The dot alone is insufficient.
- Bulk action bar: danger variant (`bulkBar.archive`); audit §B.1 reserves alert-red for T3+ issuance — danger button currently maps to `--danger` which may resolve to alert-red. **Migration:** clarify variant mapping (lockdown: only the issuance confirmation modal uses Danger variant; other destructive CTAs use Secondary + warning icon).

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Severity palette (dot + badge) | `--danger / --warning / --info / --band-medium` (legacy tokens) | `--color-trust-t3-issuance` (alert-red, issuance only) / `--color-trust-t2` (amber) / `--color-trust-t1` (divider neutral) / `--color-trust-t0` (divider neutral) | MINOR — semantic gap: T3 dot uses `--danger` which maps to alert-red; lockdown reserves alert-red for issuance path. Need a separate operator-readable T3 indicator or fall back to amber-bright. |
| 2 | Trust band badge text | `T1/T2/T3` (raw code labels) | Plain-language labels per locale ("verified" / "not yet verified" / "resolved") per lockdown §11.5; keep code labels on operator chrome | OK on operator; but spec should add a rule that band labels on citizen chrome use plain language |
| 3 | Reporter badge (reporter_kind dimension) | Not rendered as a chip; owner avatar only | `--color-reporter-*` chip on top of trust band per lockdown | MEDIUM — missing dimension. Anchor / hotline / webform / sensor badges not visible per row. |
| 4 | Filter chip sort default | `all` selected by default; severity sort done client-side | Operator surfaces may sort by priority band per Scenario 01; spec needs explicit sort: T3 → T2 → T1 → resolved (newest first within band) | MINOR — spec clarification only; behaviour already aligns |
| 5 | Bangla locale toggle | `useTranslation('inboxList')` keyed; rail re-renders on `locale` change | Bangla-first operator surfaces where applicable (foundation §11.2); operator toggle defaults to English unless citizen view | OK |
| 6 | Bulk-bar Danger button | `variant="danger"` on archive CTA | Lockdown: Danger variant reserved for issuance path; archive = Secondary or Ghost | MEDIUM — variant misuse. Reserve Danger for issuance path; archive should be Secondary. |
| 7 | Container width | `ContainerWidth.Wide` (1280) | 1280 OK (foundation §3.1) | OK |
| 8 | Skeleton on load | `Table` with `loading` prop | "Surakkha opens to live data; no load state" (lockdown §D.9); skeletons acceptable as graceful degradation per audit | OK |

## 4. Migration plan (ordered)

1. Reserve `Button variant="danger"` to issuance path only (foundation §7.1); rebind `bulkBar.archive` to `variant="secondary"`.
2. Add reporter-badge chip per row on top of trust band badge (anchor ⚓ / hotline ☎ / webform ✎ / sensor 📡); render via Lucide icons per lockdown §4.1 (icons on reporter-badge attribute only).
3. Swap severity-dot colour to a non-reserved colour for T3 operator indicator (e.g., amber-bright `--color-amber-bright` per foundation §1.2) until T3 issuance path uses alert-red.
4. Update `inbox.css` / `components.css` so the `badge--t3` class does not resolve to alert-red-reserved outside the issuance consumer; bind to `--color-amber-bright` for operator-readable T3 dot.
5. Spec doc note: sort by priority band (T3 → T2 → T1 → resolved) on initial render; user-selected filter overrides.

## 5. Open questions

1. Is the existing operator-readable "T3" indicator supposed to look distinct from amber T2? If so, what colour (amber-bright is the only non-reserved option)?
2. Does the inbox list need a reporter-badge column or is the owner-avatar + severity-badge combination sufficient until Tier 2 reconciliation lands?
