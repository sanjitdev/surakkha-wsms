# Audit Log (Cross-cutting chain audit — Screen 1) — Spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 2
> **Spec author:** Saga/Freya — 2026-09-11

---

## Meta

- **Target file:** `web/src/pages/AuditLog.tsx`
- **Source scenario:** [Scenario 06 — Audit chain timeline](../C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md)
- **Lockdown binding:**
  - `docs/D-UX-Design/01-design-system-foundation.md` §1.1, §4.2, §7, §8, §10, §11, §13
  - `docs/D-UX-Design/decisions/00-lockdown-audit.md` §F Tier 2 page impact
  - `docs/D-UX-Design/decisions/01-token-deconfliction-plan.md`
  - Tier 1 spec `per-incident-chain-segment.md` (Screen 2 — per-incident segment, drill-down target from this page)
- **Primary actor:** Operator (Priya, Adi, Karim) — operator mode only.
- **Public mode:** Anjali's status timeline is the public-mode projection (Tier 1 spec `citizen-status-timeline.md`); **this page is operator-only**. No public-mode render here.
- **Locked decision anchor:** Scenario 06 locked #2 (two screens), #5 (100% chain reads logged), #8 (filter chips), #6 (authorization per role), #7 (anomaly surfacing).

## Existing implementation inventory

`AuditLog.tsx` is a React port of the chain explorer at `/audit-log`. Container width "wide" (1280px). Reads `/api/events?limit=200`. Renders a chain-head banner + 7 filter chips (all / errors / signatures / sensor / citizen / notices / auth) + date-range picker + events table (Table primitive). Uses `audit.css` + `dashboard.css`. Renders row-severity-dot based on event_type pattern (`Error` → `--danger` else `--success`). Badge is `badge--tier` (no lockdown glyph). Does NOT implement operator-mode vs public-mode distinction, `ChainRead` meta-audit emission, Lucide icons from the 27-approved set, trust-band glyph + text, or per-actor filter.

## Scenario alignment

Per Scenario 06 locked decisions:

- **Locked #2** (two screens — `AuditLogPage` cross-incident + per-incident segment drill-down) — current page is Screen 1; drill-down exists via `block_hash` copy but not in-UI navigation. Spec adds explicit drill-down via incident-id tap.
- **Locked #5** (100% of chain reads logged via `ChainRead{filter_combo}` event on view mount) — currently absent. Spec marks as `MAJOR`.
- **Locked #8** (filter chips: Actor / Incident / Event type / Date range; compose; emit `ChainRead{filter_combo}`) — current has 7 chips + date range; spec must reshape to the locked 4-chip set with compose semantics.
- **Locked #1** (two render modes — operator vs public; same data different render) — operator-mode only here; public-mode is on per-incident timeline (Tier 1 spec).
- **Locked #6** (authorization per role — each operator sees only authorized chain segments) — currently no authorization layer; spec marks as `MAJOR`.
- **Locked #7** (anomaly surfacing — ⚠️ on affected row + top banner) — currently absent on cross-incident view; spec marks as `MEDIUM`.

What this page MUST do:

1. Render cross-incident chronological list of chain events, newest at top.
2. Filter chips: Actor / Incident / Event type / Date range (4 chips, locked #8).
3. Filters compose (AND-combined); each composition emits `ChainRead{actor, filter_combo}` chain event (locked #5).
4. Each row: timestamp + Lucide icon (from 27-approved set per §4.2) + actor name + role + incident id + one-line summary + hash anchor (mono, copy-to-clipboard).
5. Tap row's incident id → drill into per-incident chain segment (Tier 1 spec).
6. Operator-mode only — no public-mode render.
7. Anomaly surfacing: ⚠️ on affected row + top banner if hash mismatch (locked #7).
8. Chain head banner with height + block hash + prev hash + sealed timestamp + root OK indicator.

## Lockdown binding

- **Foundation §1.1** — trust band palette (verification state). This page surfaces chain events with implicit trust-band context (e.g., `TrustBandOverridden`, `IncidentCreated{band: T1}`); per-row badge re-bound.
- **Foundation §4.2** — chain event icons from the 27 approved Lucide icons (foundation audit §E.2 #17 + §F). Map event types to approved icons; open amendment tickets for unmapped types.
- **Foundation §7** — focus rings 2px primary-tint.
- **Foundation §8.2** — operator motion: 5s polling, 100ms crossfade on changed rows (state-change).
- **Foundation §10.3** — keyboard nav; `j/k` row navigation, `Enter` drill-down.
- **Foundation §11** — i18n; chain event type names stay English (foundation §11.5); actor display names localised; trust-band labels localised.
- **Foundation §12 #3** — glyph + text for trust band badges when surfaced (override events show original band + override chip per foundation §1.1).
- **Foundation §12 #5** — named actors everywhere (actor chip with name + role).
- **Foundation §12 #10** — single-click verification on chain-event row → triggers local hash recomputation → pass/fail badge within 200ms.
- **Foundation §13** — chain-freshness sub-second projection lag (AppLayout owns the pulse-dot; this page renders chain head height + freshness metadata).

## Reconciliation diff

| # | Existing | Spec (lockdown-bound) | Severity |
|---|----------|----------------------|----------|
| 1 | 7 filter chips: all / errors / signatures / sensor / citizen / notices / auth | Replace with 4 chips: Actor / Incident / Event type / Date range (locked #8). Actor = dropdown of role-classes; Incident = free-text autocomplete; Event type = dropdown of 33 closed-enum types; Date range = existing | **MAJOR** |
| 2 | Filter chips are mutually exclusive (single-select) | Filters compose (AND-combined) — locked #8 | **MEDIUM** |
| 3 | No `ChainRead` meta-audit emission | Emit `ChainRead{actor, filter_combo, surface: audit_log}` on every view mount + filter change (locked #5 + Goal 2.3) | **MAJOR** |
| 4 | Row renders event_type as `<strong>` text | Add Lucide icon from 27-approved set per §4.2 (mapping table below) | **MEDIUM** |
| 5 | Row renders `event_type.split(/(?=[A-Z])/)[0]` as `badge--tier` | Replace with lockdown glyph + text badge per §4.1 (for trust-band context) | **MEDIUM** |
| 6 | Row-severity-dot uses `var(--danger)` for Error events | Map: anomaly events → `--color-alert-red-reserved` (issuance path); `ChainAnomalyDetected` → alert-red-reserved; error events use `--color-status-warn` (amber, §1.3 carve-out: form-validation errors are NOT issuance; but anomaly badges ARE issuance path) | **MEDIUM** |
| 7 | Row's "type" column shows event-type prefix (e.g., "PublicNotice") | Show full event_type + Lucide icon | **MINOR** |
| 8 | Hash anchor rendered as `truncateHash(block_hash)` mono + copy-to-clipboard button | OK; keep; add copy-to-clipboard on full-row click (foundation §12 #10 single-click verify) | **MINOR** |
| 9 | Actor rendered as `actor_identity?.display` | Render actor name + role chip per Scenario 06 ("Priya (operator)", "Karim (technician)", "Adi (admin)") | **MINOR** |
| 10 | No per-actor authorization | Add authorization check per Scenario 06 locked #6 (read role from session; filter events to authorized set); unauthorized reads logged as `UnauthorizedSegmentAccessAttempted` | **MAJOR** |
| 11 | No anomaly surfacing | Add ⚠️ on row when hash recomputation fails; add top-banner warning if any anomaly in segment (locked #7) | **MAJOR** |
| 12 | No drill-down to per-incident segment | Add tap-row's-incident-id → routes to per-incident segment Tier 1 spec | **MAJOR** |
| 13 | No single-click independent verification per row | Add "Verify" button per row; clicking recomputes hash locally; pass/fail badge within 200ms (foundation §12 #10) | **MEDIUM** |
| 14 | Chain head banner shows height + block hash + prev hash + sealed timestamp + root OK | Keep + add sub-second chain-freshness indicator (foundation §13) | **MINOR** |
| 15 | 5s polling absent | Add 5s polling with 100ms crossfade on changed rows (foundation §8.2) | **MAJOR** |
| 16 | Empty / loading states: `EmptyState` + `loading={loading}` on Table | Keep; add offline-cache fallback (cached snapshot when offline) | **MINOR** |
| 17 | Export CSV / Export PDF buttons (no-op stubs) | Wire to Phase 1 export endpoint (deferred); keep button labels | **MINOR** |
| 18 | Row uses `mono` class for chain refs | OK; uses IBM Plex Mono via `var(--font-family-mono)` per §2.1 | **OK** |
| 19 | i18n `auditLog.*` namespace | OK; aligned with lockdown namespace | **OK** |
| 20 | No override-event affordance | Add "View override reasoning" affordance when row is `TrustBandOverridden` event; expands inline (foundation §12 #8) | **MEDIUM** |
| 21 | Date range picker (`DatePicker`) + `auditDateRange` hook | OK; keep; add max 90 days enforcement (Scenario 06 locked #8) | **MINOR** |
| 22 | Row has copy button (`audit-copy` class) | OK; keep; add copy-to-clipboard on full row click | **MINOR** |

## Spec for the lockdown-bound version

### Purpose

Operator-mode cross-incident chain audit log. The page is the operator's "what has the chain been doing" view — newest events at top, filterable by actor / incident / event type / date range. Every view mount emits a `ChainRead` meta-audit event. Per-row single-click verification triggers local hash recomputation. Drill-down by incident id routes to Tier 1 per-incident segment.

### User journeys

1. **Priya — dispute use case (Scenario 06 Use Case A):** Three months after `IncidentClosed`, Anjali disputes. Priya opens audit log → filters by incident id → drills into segment → reads verification reasoning → runs single-click verify → pass badge.
2. **Adi — override audit (Use Case B):** Pia asks why T3 overridden to T1. Adi opens audit log → filters by `Event type: TrustBandOverridden` → finds the row → drills into segment → reads override reasoning verbatim.
3. **Karim — read-only lineage:** Reopens an incident with `ProofInsufficient`. Opens audit log → filters by incident id → drills into segment → reads `ProofInsufficient` event verbatim.
4. **Operator — anomaly surfacing:** Scrolling through audit log; row's hash recompute fails; ⚠️ on row; top banner surfaces "Chain anomaly detected on `inc_01HX...` — escalate to Pia".

### Layout (locked)

```
+--top-chrome----------------------------------------------------+
| SURAKKHA · ●chain-freshness-pulse    EN | বাংলা  Role ▾       |
+----------------------------------------------------------------+
| PAGE HEADER: "Audit log" · N events · head height N · M visible|
|              [Export CSV] [Export PDF]                         |
+----------------------------------------------------------------+
| Chain head banner:                                              |
|   Height N · block_hash · prev_hash · sealed HH:MM · ✓ root    |
|   sub-second: last tick HH:MM:SS.fff                            |
+----------------------------------------------------------------+
| Filter chips (compose, AND-combined):                          |
|  [Actor: Operator ▾]  [Incident: ___ (autocomplete)]           |
|  [Event type: Verified ▾]  [Date range: last 7d ▾]            |
|  [Clear filters]                                                |
+----------------------------------------------------------------+
| Events table (newest first):                                   |
|  Time | Icon | Event type | Actor | Incident | Summary | Hash |
|  09:42| ✓ | ProofAccepted | Adi (admin) | inc_01HX... | ... | ... |
|  09:30| 📦 | FixSubmitted | Karim (tech) | inc_01HX... | ... | ... |
|  ⚠ 09:14| 🛡 | TrustBandOverridden | Adi (admin) | inc_01HX... | ▶ |
|  ...                                                            |
+----------------------------------------------------------------+
```

### Components

- `PageHeader` (foundation §3.1)
- `ChainHeadBanner` (height + block hash + prev hash + sealed timestamp + root OK + sub-second freshness)
- `FilterChips` (4 chips: Actor / Incident / Event type / Date range; compose AND-combined; each chip change emits `ChainRead{filter_combo}`)
- `DateRangePicker` (max 90 days per locked #8)
- `EventsTable` (existing Table primitive; columns: time / icon / event type / actor / incident id / summary / hash anchor)
- `TrustBandBadge` (per row when event has trust-band context; glyph + text)
- `OverrideAffordance` (per row when event_type = `TrustBandOverridden`; "View override reasoning" expand)
- `VerifyRowButton` (per row; single-click verify → pass/fail badge in <200ms)
- `AnomalyBanner` (top of page; only when at least one row's hash fails verification)

### State mapping

| State | Visible |
|-------|---------|
| Loading (first mount) | Skeleton rows; chain-head banner shows `—`; filter chips disabled |
| Empty (no events match) | "No chain events match your filters" empty state |
| Anomaly | Top banner + ⚠️ on affected row |
| Offline | Cached snapshot + "Last sync: HH:MM" caption |
| Filter compose | Each chip change emits `ChainRead{filter_combo}`; visible events re-render |
| Single-click verify | Row's hash anchor chip → spinner → ✅ / ⚠️ within 200ms |

### Wireframe (textual ASCII)

```
+--top-chrome--chain-freshness-pulse--EN|বাংলা--Operator▾--+

Audit log · 247 events · head height 1847 · 18 visible
                                              [Export CSV] [Export PDF]

+-Chain head banner-----------------------------------------+
| Height 1847 · 0a3f...b2c4 · prev 7e91...d3a2 · 09:42 ✓    |
| Last tick: 09:42:01.247                                     |
+------------------------------------------------------------+

Filter chips:
[Actor: Operator ▾]  [Incident: ___ autocomplete]
[Event type: Verified ▾]  [Date range: last 7d ▾]  [Clear]

+-Events table-----------------------------------+
| 09:42 | ✓ | ProofAccepted   | Adi (admin)    | inc_01HXa3f... | Karim's proof accepted | 0a3f..b2c4 [verify] |
| 09:30 | 📦 | FixSubmitted   | Karim (tech)  | inc_01HXa3f... | Proof bundle (5 fields) | 7e91..d3a2 [verify] |
| ⚠09:14| 🛡 | TrustBandOverridden | Adi (admin) | inc_01HXa3f... | T3→T1 · [View override reasoning] | ⚠ anomaly [verify] |
| 09:00 | 👤 | Verified       | Priya (operator) | inc_01HXa3f... | Path B: "Two corroborating..." | ... [verify] |
+----------------------------------------------------+
```

### Empty / loading / error states

- **Loading:** Skeleton rows (5 placeholders); no spinner per §8.4.
- **Empty (no events):** "No chain events yet."
- **Empty (filter mismatch):** "No events match your filters. Try clearing them."
- **Anomaly:** Top banner + ⚠️ on row.
- **Chain read error:** Banner above table: "Couldn't read the chain. Showing cached snapshot from 09:42. Retry?"
- **Authorization error:** Empty state + banner "You're not authorized to view chain segments. Contact your administrator."

### i18n

Namespace `auditLog.*`. Chain event type names stay English (foundation §11.5). Actor display names + roles localised. Filter chip labels localised. Trust-band labels localised plain language. Hash anchors NOT translated.

### A11y

- Tab order: filter chip Actor → Incident → Event type → Date range → Clear → table rows (one tab-stop per row) → per-row verify button → export buttons.
- Lucide icons: `aria-hidden="true"`; event-type label carries the semantic.
- Filter chip dropdowns: `aria-expanded` + `aria-controls`.
- Verify button: `aria-label="Verify hash for {event_id}"`.
- Anomaly row: `aria-label="Chain anomaly detected on this row"`.
- Focus rings 2px primary-tint.
- Keyboard: `Tab` cycles; `j/k` navigate rows; `Enter` drills into incident segment; `v` verifies focused row; `?` opens help modal.
- Reduced motion: row crossfade omitted; anomaly banner instant.

### Implementation notes

- **Authorization layer:** `useAuthorizedChainEvents()` hook filters events to actor's authorized window per Scenario 06 §"Authorization model" table. Unauthorized read attempts logged as `UnauthorizedSegmentAccessAttempted`.
- **`ChainRead` meta-audit emission:** On view mount + on every filter chip change, fire `actions.emitChainRead({surface: 'audit_log', filter_combo})`. Backend gateway endpoint `POST /api/chain/read-log` accepts filter_combo and emits the chain event before returning data. **100% of reads logged** (Goal 2.3).
- **Lucide icon mapping:** Per foundation §4.2, 27 approved icons. Event-type → icon mapping (current set):
  - `IncidentCreated` → `FilePlus`
  - `TrustBandSet` → `Tag`
  - `TrustBandOverridden` → `ShieldCheck`
  - `Assigned` → `UserPlus`
  - `TechnicianArrived` → `MapPin`
  - `DiagnosisSubmitted` → `Package`
  - `FixSubmitted` → `Package`
  - `ProofSubmitted` → `Package`
  - `ProofAccepted` → `CheckCircle2`
  - `Resolved` → `CheckCircle2`
  - `Closed` → `Lock`
  - `CitizenAcknowledgement` → `MessageSquareCheck`
  - `ChainRead` → `Eye`
  - `ChainAnomalyDetected` → `AlertTriangle`
  - Default (unmapped) → `ChevronRight` (per §4.2 default rule)
  - **Amendment tickets:** Open for any event-type not in the 27-approved list (Scenario 06 §4.2 audit point).
- **Single-click verify:** `useVerifyHash(event_id)` hook; recomputes hash locally; pass/fail badge in <200ms.
- **Override affordance:** Row's `TrustBandOverridden` event has expandable payload showing `from_band`, `to_band`, `reason_category`, `free_text` verbatim.
- **Anomaly surfacing:** Top banner when any row in the visible set has hash mismatch.
- **5s polling:** `useEffect` setInterval pattern; cancelled flag; `cancelled.current` guard.
- **Filter compose:** Local state for 4 filter values; `useMemo` recomputes visible events on filter change; emits `ChainRead{filter_combo}` on each filter change (debounced 300ms).
- **Sub-second freshness:** Chain head banner shows last tick timestamp with milliseconds (foundation §13 contract).
- **Export CSV/PDF:** Phase 1 stubs; Phase 2 export tooling (deferred per lockdown audit §E.5).

### Test scenarios

1. **Filter chips compose:** Set Actor=Karim + Incident=inc_01HX... + Date range=last 7d → table shows only Karim's events on that incident in last 7d; `ChainRead{filter_combo: {...}}` emitted.
2. **`ChainRead` on view mount:** Page loads → `ChainRead{actor, surface: 'audit_log'}` chain event lands.
3. **`ChainRead` on filter change:** Any chip change emits `ChainRead{actor, filter_combo: {<changed keys>}}`.
4. **Single-click verify:** Click "verify" on row → spinner → ✅ within 200ms (or ⚠️ if hash mismatch).
5. **Anomaly surfacing:** Modify one row's hash in mock → row shows ⚠️ + top banner appears.
6. **Override affordance:** `TrustBandOverridden` row → tap "View override reasoning" → expands payload (from / to band / reason_category / free_text verbatim).
7. **Lucide icon mapping:** Each event-type renders correct icon from 27-approved set; unmapped types render `ChevronRight` default.
8. **Authorization:** Switch role → table shows only authorized events (Karim sees own; Priya sees inbox + ward; Pia sees all).
9. **Drill-down to per-incident segment:** Tap row's incident id → routes to `/audit-log/segment/inc_01HX...` (Tier 1 spec).
10. **Lockdown focus rings:** Tab through page; every interactive shows 2px deep-teal-tint ring.
11. **Date range max 90 days:** Set range > 90 days → rejected + warning.
12. **Bangla toggle:** Actor display names + role + filter chip labels render Bangla; event-type names stay English; hash anchors stay English.
13. **Reduced motion:** Row crossfade omitted on row update.
14. **Empty filter mismatch:** Apply filters with no matches → empty state with "Try clearing them".

### Locked decisions (this spec)

- Filter chips: Actor / Incident / Event type / Date range (locked #8).
- Filters compose AND-combined.
- `ChainRead{actor, filter_combo}` emitted on every view mount + filter change (locked #5, Goal 2.3).
- Operator-mode only; no public-mode render (locked #1).
- Per-role authorization (locked #6).
- Anomaly surfacing (locked #7).
- Lucide icons from 27-approved set per §4.2.
- Trust-band glyph + text per §4.1 (when surfaced).
- Single-click verify per row (foundation §12 #10).
- Sub-second freshness in chain head banner (foundation §13).
- Override surface visible (foundation §12 #8).

## Migration plan

| Order | Edit | Files | Effort |
|-------|------|-------|--------|
| 1 | Replace 7 filter chips with 4 compose-AND chips | `AuditLog.tsx` + `audit.css` | **L** |
| 2 | Add `useAuthorizedChainEvents` hook + role-based filter | new hook + `AuditLog.tsx` | **M** |
| 3 | Add `ChainRead` meta-audit emission on view mount + filter change | `useChainActions.ts` (new) + `AuditLog.tsx` | **M** |
| 4 | Add Lucide icon column per row using 27-approved mapping | `AuditLog.tsx` | **M** |
| 5 | Add per-row "Verify" button + single-click hash recomputation | `AuditLog.tsx` + `useVerifyHash` | **M** |
| 6 | Add anomaly surfacing (top banner + ⚠️ on row) | `AuditLog.tsx` | **M** |
| 7 | Add drill-down to per-incident segment Tier 1 spec (incident id tap) | `AuditLog.tsx` + routing | **M** |
| 8 | Add `TrustBandBadge` per row when event has trust-band context | `AuditLog.tsx` (import shared component) | **S** |
| 9 | Add "View override reasoning" affordance on `TrustBandOverridden` rows | `AuditLog.tsx` | **M** |
| 10 | Update chain head banner with sub-second freshness | `AuditLog.tsx` | **S** |
| 11 | Add 5s polling with 100ms crossfade on changed rows | `AuditLog.tsx` | **M** |
| 12 | Add max 90 days enforcement on Date range picker | `AuditLog.tsx` + `auditDateRange` | **S** |
| 13 | Map `--brand-*` / `--success` / `--warning` to lockdown tokens (additive) | `audit.css` | **S** |
| 14 | Swap `--brand-500` → `--color-primary` for any primary CTA | `audit.css` | **S** |
| 15 | Add i18n keys: filter chip labels, anomaly banner, override affordance, empty state | `auditLog.*` locales | **M** |
| 16 | Add aria-label strings + keyboard shortcuts (`v` for verify, `j/k` for rows) | `AuditLog.tsx` | **M** |
| 17 | Open amendment tickets for any event-type not in 27-approved icon list | lockdown amendment flow | **S** (process) |
| 18 | (Phase 1.7) Migrate `--band-*` → `--color-trust-*` | `audit.css` | **L** |

## Open questions

- **Q1:** `ChainRead` emission — does it fire on every filter change, or only when filter_combo actually changes (debounced)? Spec assumes debounced 300ms.
- **Q2:** Per-role authorization — Karim's authorized window includes only his own assignments; Priya's includes inbox + ward; Adi's includes all in her queue. Confirm exact window per role with backend.
- **Q3:** Per-incident segment drill-down — does this route to a new `/audit-log/segment/:incident_id` URL, or to `/inbox/:id` with the chain segment expanded? Spec assumes new URL; confirm with router.
- **Q4:** Anomaly banner — does it persist across page navigations, or reset on each view? Spec assumes persistent until acknowledged.
- **Q5:** Single-click verify — does it run full-segment hash recomputation or only the row's hash? Spec assumes row-level (Tier 1 spec defines row-level); confirm.
- **Q6:** Export CSV/PDF — Phase 1 stubs; deferred to Phase 2 export tooling. Confirm with product.
- **Q7:** `TrustBandOverridden` row affordance — expand inline or open modal? Spec assumes expand inline (matches InboxDetail right rail).
- **Q8:** Filter chip dropdowns — autocomplete source from where? Spec assumes from `/api/actors?role=<role>` for actor; from incident list for incident id.
