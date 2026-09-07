# Dimension 5e — PHA Pane · Lockdown

**Status:** DEFERRED TO PHASE 2 (2026-09-07)
**Source preview:** `_bmad-output/design/pha-pane-preview.html` (kept for reference; not a v1 deliverable)
**Parent dim:** dim 5 (surface extension)
**Deferral rationale:** PHA-pane (the read-mostly regulator pane) is not part of the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) and the single-tenant SQLite store; the four operator surfaces land in Phase 2. This document is preserved as the design contract for when the surface is built, but its lockdown status is **DEFERRED**, not LOCKED.

---

## 1. Scope & non-goals

The PHA-pane is Dr. Mensah's read-mostly regulator surface — the surface from which the Public Health Authority Director governs Surakkha without altering the operational record. Per `EXPERIENCE.md` §32: "PHA-pane: read-mostly regulator pane — cross-ward aggregates, deviation dashboards, threshold controls, audit-browser — playbook approvals, threshold edits, audit-chain browse, **dual-signature attestation on T3-boundary issuances** — govern; mandate standard; defend decisions; **never** operate as a message-issuance desk."

This surface is structurally closer to Priya-desktop than to Anjali/Priya-mobile: same web layout, same dim 5 grid, same dim 4 components. The differences are (1) read-mostly posture, (2) cross-ward aggregations instead of per-incident lists, (3) dual-signature T3-boundary approval flow, (4) `@media print` stylesheet for regulator reports (monthly report PDF + WB-aligned evidence export per FR-6.6).

**In scope:**
- 3 vertical sections on a single dashboard page: aggregate tiles (top), playbook amendment queue (middle), audit-chain browser (bottom)
- 6 aggregate tile kinds: time-to-T3 medians, deviation counts, threshold edit history, override-anomaly flags, false-positive rate, Anjali weekly-discipline aggregate
- Playbook amendment review: diff view, dual-signature flow (PHA + vendor counter-sign per AD-11), single-signature on city-wide config (per AD-15)
- Threshold-edit field with inline validation (per `EXPERIENCE.md` §201): "Threshold-edit field (PHA pane): inline validation; out-of-band values are rejected with a small inline message. No modal."
- Audit-chain browser: filter by time window / event_type / actor_role / geography; every read access-logged (NFR-S1.4)
- Monthly report preview (FR-5.6) — auto-generated from chain projection, exportable to PDF via `@media print` stylesheet
- WB-aligned evidence export (FR-6.6) — single-click aggregation export to the World Bank-aligned evidence template
- Light + dark parity
- Bangla primary on prose; Latin on tier badges, chain refs, ISO timestamps (per dim 6 §8.3)
- Print stylesheet for regulator PDF output
- Tap targets ≥ 44×44 px (admin desktop floor per dim 4 §16.1)

**Out of scope:**
- **T3 two-tap issuance** — does NOT appear on PHA-pane (per `EXPERIENCE.md` §294 "The two-tap affordance does not appear on PHA-pane; PHA has already approved"). PHA's role is the dual-signature attestation upstream of issuance, not issuance itself.
- **Per-incident action buttons** — PHA does not "resolve" incidents. He approves playbooks, edits thresholds, browses audit. The Incidents view is an aggregate rollup only.
- **Settings page** — PHA inherits the dim 5 extension Settings menu (Account, Notifications, Display, Bangla, Chain keys, Danger zone) per the existing lockdown; no PHA-specific settings page in v1.
- **PHA-side message preview or consumer-message drafting** — Mayor's office owns message tone; PHA owns the threshold where public notice fires (per `EXPERIENCE.md` §84).
- **Real-time push notifications** — read-mostly surface; no live-action-list, no toast spam. SSE updates the aggregate tiles every 30s; playbook amendment queue and audit browser are user-triggered fetches.

**Inherited from upstream dims:**
- Dim 1 colors (light + dark), dim 2 typography (Plex Sans + Noto Sans Bengali + Plex Mono), dim 3 icons (lucide)
- Dim 4 spacing (4-pt grid), `--height-control-lg` (44 px) for desktop tap targets
- Dim 5 §2 breakpoints (PHA-pane targets ≥1024 / ≥1280 — full desktop only; no mobile collapse)
- Dim 5 §3 container widths (PHA-pane uses `--container-wide` at default)
- Dim 5 §4 12-col grid
- Dim 5 §6 shadcn adoption (`<Card>`, `<Dialog>`, `<Sheet>`, `<Switch>`, `<Select>`)
- Dim 6 §4 page-template shapes (Dashboard, Audit Log), §4.4 Verify Flow shape, §4.5 Settings shape
- Dim 5b §6 chart primitives (donut, sparkline, time-series-line used in tiles)
- Dim 5b §13 map view (for cross-ward geography in audit browser)
- Dim 5b §10/§11 SSE contract (`reading`, `incident` event types extended in §10 below)
- `EXPERIENCE.md` §32, §77-84, §126, §201, §205-207, §240-241, §243, §263, §294

---

## 2. Breakpoint policy

PHA-pane is desktop-only by design. Per `EXPERIENCE.md` §41: "The three operator UIs are separate products with separate design, deployment, and update cadences — not one responsive app collapsing across breakpoints (spec C-2, AD-7)." The PHA-pane target environment is a director's office workstation at ≥1280 px.

| Token | Min width | Layout |
|---|---|---|
| `--bp-xl` (≥1024) | `1024 px` | Condensed: 8-col grid, tiles collapse 6→4 |
| `--bp-2xl` (≥1280) | `1280 px` | Standard: 12-col grid, tiles 6-up |
| `--bp-3xl` (≥1440) | `1440 px` | Wide: more whitespace, side-by-side compare panels |

Below 1024 px viewport, the surface shows a "Use a desktop" notice. Rationale: PHA decisions (dual-signature attestation, playbook amendment review, audit-chain drilldown) need screen real-estate for side-by-side diff views, dense event-type tables, and chart-heavy aggregate tiles — none of which work on mobile. Mobile access is via Priya's surfaces; Dr. Mensah does not approve amendments from a phone.

---

## 3. Container & layout

- **Container:** `--container-wide` (1280 px) at default. Caps at 1280 even at 3xl — "more whitespace, not wider content" per dim 5 §3.
- **Padding-inline:** `--space-2xl` (32 px) on ≥2xl, `--space-xl` (24 px) on <2xl.
- **Vertical rhythm:** `--space-2xl` (32 px) between the 3 main sections; `--space-xl` (24 px) between sub-sections inside a section.

```
┌──────────────────────────────────────────────────────────┐
│ TopChrome (h: 48 px)                                     │
│   Surakkha · Dr. Mensah · PHA · jurisdiction: Dhaka      │
│   [chain clock] ✓ gateway ✓ sensors ⚠ anomaly (3 flags) │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ §1 Cross-ward aggregate tiles (6 tiles, col-span-2 ×6) │
│   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│   │t-tT│ │ dev│ │t-ed│ │anom│ │FP% │ │Anj │            │
│   └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │
│                                                          │
│ §2 Playbook amendment queue (col-span-12)               │
│   ┌──────────────────────────────────────────────────┐  │
│   │ v3.2 → v3.3 chronic-lead · 1 of 2 sigs · 4 days │  │
│   │ [Review diff] [Sign] [Deny]                      │  │
│   └──────────────────────────────────────────────────┘  │
│                                                          │
│ §3 Audit-chain browser (col-span-12)                    │
│   [filter bar: time / type / role / ward]               │
│   ┌──────────────────────────────────────────────────┐  │
│   │ Time | Chain ref | Event | Ward | Actor | Action │  │
│   │ ... 12 rows ...                                  │  │
│   └──────────────────────────────────────────────────┘  │
│                                                          │
│ §4 Footer — Export controls                              │
│   [Monthly report →]  [WB evidence export →]  [Print]   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Top chrome

| Slot | Property |
|---|---|
| Height | 48 px (`--height-control-xl`) |
| Left | "Surakkha · Dr. Mensah · PHA · jurisdiction: Dhaka" |
| Right | Chain freshness clock + 3 status icons (gateway / sensor-silence / override-anomaly) |
| Background | `var(--bg-surface)` |
| Border-bottom | 1 px `var(--border-subtle)` |

**Jurisdiction label** ("Dhaka") sits beside the role tag — PHA may oversee multiple jurisdictions in v2 federation (per `personas.md` source gaps). For v1 it's a single string.

**Override-anomaly indicator** is elevated on PHA-pane: any flag ≥1 lights the icon yellow; ≥3 lights red. Dr. Mensah's persona win condition includes "Leverage over utilities via objective indicators" (per `personas.md` line 67), so the override-anomaly count is surfaced more prominently than on Priya-desktop.

---

## 5. Cross-ward aggregate tiles

Per `EXPERIENCE.md` §81: "Top: Cross-ward aggregate tiles. Deviations, time-to-T3 medians, threshold edit history, override-anomaly flags. Each tile is an aggregation, not raw data." Plus the FR-5.6 monthly-report rollup fields: "incidents handled, deviation clusters, time-to-action medians, false-positive rate, Anjali weekly-discipline aggregate" (per `EXPERIENCE.md` §460).

### 5.1 Six tile kinds (locked)

| # | Tile | Source data | Display |
|---|---|---|---|
| 1 | **Time-to-T3 median** | `IncidentEscalated{to_tier: T3}` events over last 7d / 30d | Median in minutes (e.g. "4 min 12s"). Sparkline showing 7-day trend. |
| 2 | **Deviation count** | `DeviationCaptured` events over last 24h / 7d | Number + delta-arrow vs prior period. Click → audit browser filtered to deviations. |
| 3 | **Threshold edits** | `ThresholdUpdated` events over last 7d / 30d | Number + last-edited-at timestamp. Click → audit browser filtered to threshold events. |
| 4 | **Override-anomaly flags** | Live count from `override_anomaly` SSE stream | Number + 7-day trend. Color-coded: 0 = `--success`, 1-2 = `--warning`, ≥3 = `--danger`. |
| 5 | **False-positive rate** | `IncidentVerified` ∩ `IncidentDismissed` (later) / total over 30d | Percentage + 30-day sparkline. Click → audit browser filtered to dismissed. |
| 6 | **Anjali weekly-discipline** | Distinct Anjali reporters who completed ≥1 weekly check-in / total enrolled Anjalis | Percentage + numerator/denominator. Click → Anjali-discipline rollup panel (dim 5c-derived shape). |

### 5.2 Tile anatomy

```
┌────────────────────────────────────┐
│ Time-to-T3 median                  │  ← label, --font-size-xs, --fg-tertiary
│                                    │
│  4 min 12s                         │  ← value, --font-size-xxl, --fg-default, mono
│  ↑ 0:23 vs prior 7d                │  ← delta, --font-size-xs, semantic color
│                                    │
│  [▁▂▃▅▆▇▅ sparkline 7d]           │  ← optional sparkline, dim 5b §5
│                                    │
│  Last 7 days · 8 T3 escalations    │  ← meta, --font-size-xs, --fg-tertiary
└────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Width | `col-span-2` of 12 (6 tiles × 2 = 12) |
| Background | `--bg-surface` |
| Border | 1 px `--border-subtle` |
| Border-radius | `var(--radius-lg)` |
| Padding | `--space-xl` |
| Tap target | ≥ 44×44 px (whole tile is a button; deep-links to drilldown) |
| Hover | 1 px ink-tint border (per `EXPERIENCE.md` §195 "subtle 1px ink-tint border on hover/focus, never elevation change. Elevation stays flat for 'list-of-things' surfaces.") |

### 5.3 Empty-state rule (per `EXPERIENCE.md` §241)

> "PHA-pane aggregate tiles: zero state shows `0` with a sub-line `last X days`. Never blank."

A tile with zero data shows:
- Value: `0` (in `--font-size-xxl`, `--fg-tertiary`)
- Sub-line: "Last 7 days · no events"
- No "—" or "—" placeholder.

### 5.4 Donut supplements sparkline

For the False-positive rate tile, a small donut chart (dim 5b §5.4) supplements the sparkline: the donut shows verified vs dismissed as two arcs. The sparkline shows trend over time. Both consume dim 5b chart tokens.

---

## 6. Playbook amendment queue

Per `EXPERIENCE.md` §82: "Middle: Playbook amendment queue. Approvals with dual-signature at T3 boundary (FR-6.1). Single-signature on city-wide config changes (AD-15)."

### 6.1 Amendment row anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│ v3.2 → v3.3  chronic-lead playbook                               │
│                                                                  │
│ Proposed by: Priya · 09:14                                       │
│ 1 of 2 signatures · 4 days pending                              │
│   ✓ Dr. Mensah (PHA) — 2026-09-03 11:14 — chain 0x4d2c          │
│   ☐ Vendor counter-sign pending                                 │
│                                                                  │
│ Summary of changes (3 lines):                                    │
│   − Chronic threshold: 7d amber → 5d amber                       │
│   − New step: request lab confirmation at 3-day mark            │
│   − Owner: PHA-issued letter (was: Priya-led)                    │
│                                                                  │
│ [Review diff] [Sign amendment] [Deny]                            │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Dual-signature flow (per AD-11)

For T3-boundary amendments (chronic-lead playbook, T3 trigger thresholds, public-notice policy):

1. **First signature** — Dr. Mensah clicks `[Sign amendment]`. A `<Dialog>` opens showing the full diff + a reasoning field (required, but empty-allowed per `EXPERIENCE.md` §200 — empty reasoning logs `PlaybookAmendmentSigned{reasoning: empty}` to the chain).
2. **First signature lands** — `SignatureAttestation{event_id, payload_hash, version_id: v3.3}` event. The amendment row updates to "1 of 2 sigs". The `[Sign amendment]` button changes to `[Sign amendment]` (still active — Dr. Mensah may amend his signature with a clarification).
3. **Vendor counter-sign** — A separate vendor actor (not Dr. Mensah) lands the second signature with the identical `(event_id, payload_hash, version_id)` triple. This is enforced server-side per AD-11; the PHA-pane cannot bypass it.
4. **Both signatures present** — `PlaybookAmendmentSigned` event with `effective_at: NOW`. The amendment row collapses to "Signed 2 of 2 · effective now".
5. **Deny path** — `[Deny]` button opens a `<Dialog>` with reasoning field. Lands `PlaybookAmendmentDenied{reasoning}` event. The row collapses to "Denied · reason logged to chain".

### 6.3 Single-signature flow (per AD-15)

For city-wide config changes (default thresholds, ward scope, operator assignments):

1. PHA clicks `[Sign]` — one signature suffices.
2. `ConfigUpdated` event with `signed_by: pha_approver` and `effective_at: NOW`.
3. No counter-signature required.

The amendment row UI is identical for both flows; the difference is in the `requires_counter_signature: boolean` field on the underlying `PlaybookAmendment` shape (dim 6 §6.4 amendment).

### 6.4 Amendment diff view

For amendments with ≥2 changes, `[Review diff]` opens a side-by-side diff dialog:

```
┌──────────────────────────────────────────────────────────────────┐
│ Playbook v3.2 → v3.3 · chronic-lead                  [Close ✕]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Step 2: Chronic threshold                                        │
│ ┌─────────────────────────────────┐ ┌─────────────────────────┐  │
│ │ v3.2                            │ │ v3.3                    │  │
│ │ Chronic threshold: 7 days       │ │ Chronic threshold:      │  │
│ │ at amber level → escalate to    │ │ 5 days at amber level   │  │
│ │ T3 chronic action               │ │ → escalate to T3        │  │
│ │                                 │ │ chronic action          │  │
│ └─────────────────────────────────┘ └─────────────────────────┘  │
│                                                                  │
│ Step 4 (NEW): Lab confirmation                                   │
│ ┌─────────────────────────────────┐ ┌─────────────────────────┐  │
│ │ (no prior step)                 │ │ At 3-day mark: request  │  │
│ │                                 │ │ lab confirmation from   │  │
│ │                                 │ │ city public-health lab  │  │
│ └─────────────────────────────────┘ └─────────────────────────┘  │
│                                                                  │
│ [Sign] [Deny] [Close]                                            │
└──────────────────────────────────────────────────────────────────┘
```

Diff is two-column layout: left = current (`v_n`), right = proposed (`v_n+1`). Removed text is `--danger-bg` background; added text is `--success-bg` background. No strikethrough — strikethrough breaks chain-cite readability when a regulator is scrolling fast.

### 6.5 Empty state (per `EXPERIENCE.md` §241)

Zero pending amendments: "No amendments pending. Playbook v3.2 is the version-of-record." with the current version's published-at timestamp.

---

## 7. Threshold-edit controls

Per `EXPERIENCE.md` §201: "Threshold-edit field (PHA pane): inline validation; out-of-band values are rejected with a small inline message. No modal."

### 7.1 Where thresholds live

Thresholds are embedded inside a playbook amendment, not edited in isolation. The PHA-pane exposes a "Threshold defaults" sub-section on the right rail (col-span-4) where the city-wide defaults (the 4 cardinal thresholds: T0/T1/T2/T3) are displayed read-only with a `[Propose amendment]` link.

### 7.2 Inline-validation rule

Each threshold input uses:
- `<Input>` dim 4 §6.1 with `aria-invalid="true"` on out-of-band
- Inline error message below the input (red `--danger` `--font-size-xs`)
- `[Save]` button disabled until value is valid
- No modal — inline only

Valid ranges (locked in v1):
- T0 (info): `≥0 NTU`
- T1 (caution): `0.5-2.0 NTU`
- T2 (escalate): `2.0-4.0 NTU`
- T3 (action): `>4.0 NTU`

(For turbidity; pH and Cl₂ thresholds are playbook-embedded.)

---

## 8. Audit-chain browser

Per `EXPERIENCE.md` §83: "Bottom: Audit-chain browser (read-only). Filter by time window, event_type, actor_role, geography. Every read is access-logged (NFR-S1.4)."

### 8.1 Filter bar

```
┌──────────────────────────────────────────────────────────────────┐
│ Time: [Last 24h ▾]  Type: [All ▾]  Role: [All ▾]  Ward: [All ▾] │
│ [Apply]                                                          │
└──────────────────────────────────────────────────────────────────┘
```

| Filter | Options |
|---|---|
| Time | Last 1h / 6h / 24h / 7d / 30d / Custom |
| Event type | All / Incident lifecycle / Playbook amendments / Threshold edits / Sign-in / Sign-out / Anonymized access events (subset of dim 6 §4.6 `AuditEntry.eventType`) |
| Actor role | All / `priya` / `operator` / `pha` / `anjali` / `admin` / `sensor` (dim 6 §4.6 `ActorKind`) |
| Ward | All / specific wards in PHA's jurisdiction |

### 8.2 Row layout

Inherits the dim 5 §9.1 audit-log row layout (6-slot grid): Time (80 px) | Chain ref (1fr) | Event (auto) | Ward (96 px) | Actor (160 px) | Action (auto). Plex Mono for chain refs.

### 8.3 Read-access logging (per NFR-S1.4)

> "Every read is access-logged."

When PHA filters / scrolls / opens an event detail, each interaction logs an `AuditEventRead{actor: pha_approver, filter_state, timestamp, chainRef_viewed?}` event. This is a v1 commitment, not deferred. The events surface in the row count at the bottom of the table: "Showing 12 of 1,847 events · your reads logged to chain (4 in this session)."

### 8.4 Event detail

Click any row → opens a `<Dialog>` (shadcn dim 5 §6) showing:
- Full event JSON (chain-stored format, dim 7 territory)
- `chainRef` and `payload_hash`
- All chain-linked predecessor events (visualized as a vertical chain timeline)
- `[Export single event]` button (PDF via print stylesheet)

### 8.5 Empty / boundary states

- 0 events: "No events match this filter. Try widening the time window."
- >500 events: shows first 500 with "Showing 500 of N · refine filter to see specific events"
- Read access limit: PHA can read but cannot delete or amend. The `[Export]` button is the only write-adjacent action and it creates a new chain event `AuditExportRequested{actor: pha_approver, scope}` — PHA's own actions are also on the chain.

---

## 9. Footer — Export controls

```
┌──────────────────────────────────────────────────────────────────┐
│ Monthly report (FR-5.6)  [Preview]  [Export PDF]                │
│ WB evidence export (FR-6.6)  [Preview]  [Export JSON]            │
│ Print current view  [🖨]                                          │
└──────────────────────────────────────────────────────────────────┘
```

- **Monthly report** — auto-generated from chain projection (per `EXPERIENCE.md` §460). Shows the rollup fields: incidents handled, deviation clusters, time-to-action medians, false-positive rate, Anjali weekly-discipline aggregate.
- **WB evidence export** — World Bank-aligned evidence format (per FR-6.6). Single JSON file with all aggregation tables + chain-anchor proofs. Used by PHA to satisfy regulatory reporting requirements to international bodies.
- **Print current view** — opens the browser's print dialog with `@media print` stylesheet active (see §12).

---

## 10. Real-time updates (SSE, aggregate-only)

PHA-pane receives a constrained subset of the SSE stream used by Priya-desktop / Priya-mobile:

```ts
type PhaSseEvent =
  | { type: 'aggregate_update'; payload: { tile: 't-tT3' | 'deviations' | 'thresholds' | 'anomalies' | 'fp-rate' | 'anjali'; value: number; asOf: ISOTimestamp } }
  | { type: 'amendment_state'; payload: { amendmentId: string; signatures: number; status: 'pending' | 'signed' | 'denied' | 'expired' } }
  | { type: 'chain_anchored'; payload: { chainRef: ChainRef; t: ISOTimestamp } };
```

No `reading` or `incident` events on PHA-pane — those are operator-level. PHA sees the rollup, not the raw signal.

### 10.1 Polling cadence

- Aggregate tiles: SSE-pushed when an aggregation recomputes (typically every 30-60s)
- Amendment queue: SSE-pushed on state change + user-triggered refresh
- Audit browser: user-triggered only (filter changes)

### 10.2 New-event flash

When an `amendment_state` event lands (e.g. second signature present):
- Amendment row background flashes `--success-bg` 1× (400ms ease-out) and a small toast appears: "Playbook v3.3 amendment — 2 of 2 signatures · effective now."

The toast uses the dim 4 §11.3 Sonner pattern but with an institutional register (per `EXPERIENCE.md` §126: "Approval required: ... dual signature pending. C-13 split: pha_approver + vendor. — Not 'Hey, sign this.'"). Example toast copy: "Playbook v3.3 signed by both parties. Effective at 14:01. — chain 0x4d2c."

---

## 11. Bangla + Latin render rules (per dim 2 §9.4 + dim 6 §8)

| Element | Default locale |
|---|---|
| Aggregate tile labels ("Time-to-T3 median") | English (institutional per `EXPERIENCE.md` §126) |
| Tile values ("4 min 12s") | **Latin always** — operational metadata, mono |
| Sub-lines ("Last 7 days · 8 T3 escalations") | English |
| Amendment queue headers ("Playbook amendment queue") | English (institutional) |
| Diff body text (e.g. "Chronic threshold") | English (technical / regulatory) |
| Audit browser event type labels ("sensor_spike") | **Latin always** in mono (cryptographic identifier per dim 6 §8.3) |
| Chain refs ("0x4d2c") | **Latin always** in mono |
| Actor names | Stored as Bangla-or-English plain string; renders per container locale |
| Bangla narrative in audit body | Bangla when container is `data-locale="bn"`, otherwise English |
| Empty-state copy | English (institutional; PHA is non-Bangla-locale in v1; Bangla-toggle allowed but not required) |
| Monthly report prose | English (regulator-facing; export to WB) |

**Bangla row-pad modifier:** PHA-pane rows are mostly dense tables (audit browser). The Bangla row-pad modifier from dim 4 Amendment A applies to any row with `data-locale="bn"` AND Bangla narrative content. Pure-Latin rows (chain refs, event types) don't trigger the modifier.

---

## 12. `@media print` stylesheet (regulator PDF output)

Per dim 5 §7.7 ("PHA-pane ... adds `@media print` for regulator reports") and dim 5b §3.8 (chart print overrides) — the PHA-pane MUST produce a print-ready PDF of the monthly report and audit browser view.

### 12.1 `@media print` rules

```css
@media print {
  /* Hide chrome */
  .priya-chrome, .pha-nav, .filter-bar, .footer-actions { display: none !important; }

  /* Body reset */
  body { background: #FFFFFF !important; color: #000000 !important; }

  /* Tile backgrounds to white */
  .aggregate-tile { background: #FFFFFF !important; border: 1px solid #000000 !important; }

  /* Tier badges — high contrast for print */
  .tier.t0 { background: #FFFFFF !important; color: #000000 !important; border: 1px solid #000000; }
  .tier.t1 { background: #FFFFFF !important; color: #000000 !important; border: 1px solid #000000; }
  .tier.t2 { background: #FFFFFF !important; color: #000000 !important; border: 2px solid #8A5A1A; }
  .tier.t3 { background: #FFFFFF !important; color: #000000 !important; border: 2px solid #8E2E1E; }

  /* Status dots in monochrome */
  .status-dot { border: 1px solid #000000; background: transparent !important; }

  /* Sparklines / charts — black on white */
  .sparkline polyline { stroke: #000000 !important; }

  /* Avoid page breaks inside tiles / amendment rows */
  .aggregate-tile, .amendment-row { page-break-inside: avoid; }

  /* Headers */
  h1, h2, h3 { page-break-after: avoid; }

  /* Footer with chain anchor + page numbers */
  @page {
    margin: 24mm 16mm 24mm 16mm;
    @bottom-right { content: counter(page) " of " counter(pages); }
    @bottom-left { content: "Surakkha · PHA-pane · chain " attr(data-chain-ref); }
  }
}
```

### 12.2 Why `#000000` and `#FFFFFF` in print

Print cannot rely on the dim 1 brand hues — ink-on-paper contrast differs from screen contrast, and the only reliable pass is pure black on pure white. The dim 5b §3.8 print-only hex literals (`#6B4710`, `#6B1F12`) for warning/danger are mirrored here for the tier badges (2-px solid border instead of filled bg).

### 12.3 `@media print [data-print="true"]` attribute gate

Same pattern as dim 5b: the print stylesheet activates only when the root has `data-print="true"`. This is set by the `[Print current view]` button via JS before calling `window.print()`, then unset after. Without the attribute, the print stylesheet is dormant — a PHA scrolling the live pane does not see the print preview styling.

### 12.4 Chain-ref in footer

Each printed page includes the chain anchor that PHA was viewing at print time. This embeds the audit reference into the printed artifact: a regulator handing a printed monthly report to a journalist is also handing the cryptographic anchor for every claim in the report.

### 12.5 Print preview button

The preview pane (opened by `[Preview]` on Monthly report) shows the report in print-stylesheet mode on-screen, before invoking the browser print dialog. This lets PHA review the artifact before committing ink.

---

## 13. Accessibility

- **Tap targets:** ≥ 44×44 px on every interactive element (admin desktop floor per dim 4 §16.1). Tiles are whole-card buttons (44×44+).
- **Focus order:** top chrome → aggregate tiles (left-to-right, top-to-bottom) → amendment queue → audit browser → footer.
- **Keyboard shortcuts:**
  - `g a` → jump to audit browser
  - `g p` → jump to playbook amendment queue
  - `g t` → jump to threshold controls
  - `/` → focus the audit browser filter bar
  - `?` → show keyboard shortcut legend
- **Screen reader:** aggregate tiles are announced with full text: "Time-to-T3 median. 4 minutes 12 seconds. Up 23 seconds versus prior 7 days. Sparkline trend."
- **Reduced motion:** SSE flash replaced with solid border highlight when `prefers-reduced-motion: reduce`.
- **Print button is reachable by keyboard:** `Tab` order includes it; `Enter` activates.
- **High-contrast mode:** the `@media print` stylesheet already uses pure black on white, so print preview respects `prefers-contrast: more`.

---

## 14. Hand-offs

### To dim 6 (data formats)

Add to `PlaybookAmendment` shape (dim 6 §4.4 follow-on):

```ts
type AmendmentKind = 't3-boundary' | 'city-config';
type AmendmentStatus = 'pending' | 'signed-1' | 'signed-2' | 'denied' | 'expired';

interface PlaybookAmendment {
  id: string;
  kind: AmendmentKind;           // determines dual vs single signature
  fromVersion: string;            // e.g. "v3.2"
  toVersion: string;              // e.g. "v3.3"
  proposedBy: ActorHandle;
  proposedAt: ISOTimestamp;
  status: AmendmentStatus;
  signatures: Array<{ actor: ActorHandle; signedAt: ISOTimestamp; chainRef: ChainRef; reasoning?: string }>;
  diff: AmendmentDiff[];          // each entry: { step: string; fromText: string; toText: string; isNew?: boolean }
  effectiveAt?: ISOTimestamp;     // present when status === 'signed-2'
}

interface PhaPageData {
  containerWidth: 'wide';
  aggregateTiles: AggregateTile[]; // 6 entries
  amendmentQueue: PlaybookAmendment[];
  auditBrowser: { entries: AuditEntry[]; totalCount: number; appliedFilter: AuditFilter };
  monthlyReport: MonthlyReportData; // rollup shape for FR-5.6
}

interface MonthlyReportData {
  periodStart: ISOTimestamp;
  periodEnd: ISOTimestamp;
  incidentsHandled: number;
  deviationClusters: number;
  timeToActionMedian: { minutes: number; seconds: number };
  falsePositiveRate: number;
  anjaliWeeklyDisciplinePct: number;
  chainAnchorProofs: ChainRef[];
}
```

### To dim 7 (sensor wire format)

- `ThresholdUpdated` event payload: `{ parameter: 'turbidity_ntu' | 'ph' | 'cl2_ppm'; oldValue: number; newValue: number; signedBy: ActorHandle; chainRef: ChainRef; }`.
- `SignatureAttestation` event payload: `{ event_id, payload_hash, version_id, signed_by: 'pha_approver' | 'utility_message_desk' | 'vendor', signed_at: ISOTimestamp }`.
- `PlaybookAmendmentSigned` event payload: `{ amendment_id, signatures: SignatureAttestation[], effective_at: ISOTimestamp }`.
- `AuditEventRead` event payload: `{ actor: ActorHandle, filter_state, chainRefs_viewed: ChainRef[], read_at: ISOTimestamp }`.
- `AuditExportRequested` event payload: `{ actor, scope: 'monthly-report' | 'wb-evidence' | 'single-event', chainRefs_included: ChainRef[], format: 'pdf' | 'json' }`.

### To dim 8 (motion)

- `--motion-aggregate-flash: 400ms ease-out` (background-color keyframe on tile when SSE pushes new value)
- `--motion-amendment-signed-flash: 600ms ease-out` (success-bg flash on amendment row)
- `--motion-toast-pane-in: 160ms ease-out` (institutional toast, no slide — just opacity)

Inherited from dim 5b:
- `--motion-chart-new-point-flash: 400ms ease-out`
- `--motion-chart-tooltip-in: 120ms ease-out`

### To engineering-setup workstream

- React + Vite + Tailwind + shadcn (per dim 5 §16 spec) — no Capacitor wrap needed (desktop only)
- shadcn `<Dialog>` for the diff view, `<Sheet>` for the side-rail threshold controls
- `react-to-print` or native `window.print()` for the PDF export
- PHA auth: separate role with `pha_approver` claim (per AD-12 `actor_identity.role` enum)
- SSE EventSource: same polyfill as Priya-desktop (eventsource-polyfill npm)
- Audit-event reads: throttled to 1 read per chain event per PHA session (avoid spam)

---

## 15. Verification checklist

### Ships in dim 5e

- [ ] `pha-pane-preview.html` renders the 3 sections (aggregate tiles, amendment queue, audit browser) at 1280 px and 1440 px
- [ ] 6 aggregate tile kinds demonstrated with sample data + sparklines
- [ ] Tile empty state shows `0` with sub-line, never blank (per `EXPERIENCE.md` §241)
- [ ] Playbook amendment row shows dual-signature state (0/1/2 sigs) + Sign/Deny buttons
- [ ] Diff dialog (review-diff) renders side-by-side with `--danger-bg` removed + `--success-bg` added
- [ ] Threshold-edit input demonstrates inline validation (no modal, per `EXPERIENCE.md` §201)
- [ ] Audit-chain browser filter bar (4 filters) + 6-slot row layout
- [ ] Footer: Monthly report + WB evidence export + Print current view buttons
- [ ] `data-print="true"` print stylesheet activates on print preview
- [ ] Print preview shows pure-black-on-white page with chain-ref in footer
- [ ] Light + dark parity (theme toggle at top of preview)
- [ ] Bangla toggle available (some tiles may switch to Bangla)
- [ ] `05e-pha-pane-lockdown.md` has 16 sections matching this lockdown

### Deferred to engineering-setup

- [ ] PHA auth + `pha_approver` role wiring
- [ ] Diff-rendering engine (line-level diff not step-level)
- [ ] PDF print engine (server-side or browser-side decision)
- [ ] Audit-event-read throttling
- [ ] Monthly report computation (server-side projection)
- [ ] WB evidence export schema v1 (locked with WB-aligned format)

---

## 16. Amendment log

- **v1 (2026-09-07):** Initial lockdown. 6 tile kinds (time-to-T3 median / deviation count / threshold edits / override-anomaly / false-positive rate / Anjali weekly-discipline), dual-signature amendment queue, threshold inline-validation, audit-chain browser with access logging, monthly report + WB evidence export, `@media print` stylesheet. Closes dim 5 §7.7 PHA-pane gap. Read-mostly posture enforced — no T3 issuance, no per-incident resolve actions, no message desk.
- **2026-09-07 — DEFERRED TO PHASE 2:** PHA-pane is removed from the v1 Phase 1 build. Phase 1 ships only the audit-chain gateway (Story 1.1) plus its monitor companions. The four operator surfaces (Anjali-mobile, Priya-desktop, Priya-mobile, PHA-pane) land in Phase 2. This document is preserved verbatim as the design contract for that work; preview HTML is kept for reference. **Verification checklist (§15) and engineering-setup hand-offs (§14) are deferred with the surface.**
