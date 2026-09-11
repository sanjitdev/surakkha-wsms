# Phase 4 — UX Design Plan

> Status: Plan established; executing per auto-mode mandate
> Source: 00-ux-scenarios.md, product-brief.md, existing web/src/pages/* implementation
> Produced by Saga/Freya — 2026-09-10

---

## 1. Scope summary

**23 screens across 6 scenarios** inventoried in `00-ux-scenarios.md`:

- 14 existing React pages already implemented (Phase 1.6a, `web/src/pages/*`)
- 3 **gap screens** with no implementation (priority new builds):
  - Citizen Status Timeline (Scenario 03 Screen 3) — Goal 3's middle beat
  - Hotline Intake Modal (Scenario 01 Screen 3)
  - Per-incident Chain Segment Viewer (Scenario 06 Screen 2) — single-click independent hash verification
- 6 screens that exist but need scenario-spec reconciliation
- (Implicit: the chain viewer is rendered inside all operator scenarios; specs are shared via Scenario 06)

## 2. Design Loop approach for auto mode

The full WDS Design Loop is `discuss → spec → wireframe → approve → iterate → update spec → implement → browser review → extract tokens` — repeated once per page. In auto mode without per-page approval checkpoints, the loop becomes:

1. **Establish design system foundation once** (tokens + components + layout rules)
2. **Write per-page spec** referencing the foundation
3. **Implement per-page** using existing React ports + new code where needed
4. **Extract tokens** from changes
5. **Document reconciliation notes** for any divergence between scenario spec and existing implementation
6. **Iterate based on user course corrections** as they arrive

This produces a working system rather than 23 sealed mockups waiting on approval.

## 3. Priority ordering

**Tier 1 (build first — load-bearing surfaces):**

1. **Citizen Status Timeline** — Scenario 03 Screen 3; Goal 3's middle beat; no existing page
2. **Per-incident Chain Segment Viewer** — Scenario 06 Screen 2; Goal 2 enforcement; single-click verification; partially served by InboxDetail chain tab but needs the dedicated verification surface
3. **Hotline Intake Modal** — Scenario 01 Screen 3; no existing page

**Tier 2 (reconcile to spec):**

4. OperatorDashboard (Priya) — existing; reconcile to Scenario 01's locked layout decisions
5. FieldQueuePage + FieldIncidentDetailPage (Karim) — existing; reconcile to Scenario 04's structured-proof feedback flow
6. InboxDetail (Priya's inbox detail) — existing; reconcile to Scenario 01's three-column layout and verify+assign single submit
7. AuditLog (cross-cutting chain) — existing; reconcile to Scenario 06's filter chips and operator-mode rendering

**Tier 3 (light reconciliation):**

8. InboxList, SubmitReportPage, CitizenAckPage, LoginPage, Settings, StyleguidePage, ComingSoonPage, VerifyFlow, InboxRail — light pass

## 4. Design system foundation (locked here, used by all specs)

### 4.1 Trust band colour palette

T1 (anchor priority, highest) — emerald/green
T2 (verified, routine) — sky/blue
T3 (hotline-sourced or low-verification, lowest) — amber/yellow
T_overridden (Adi overrode) — indigo with hash-mark icon

These are the only colour-coded categorical badges in Phase 1. Use neutrals for everything else.

### 4.2 Density and layout

- **Operator surfaces (Priya / Adi / Karim)** — dense, scannable, multi-column; supports keyboard nav; status-board layouts available for power users
- **Citizen surfaces (Anjali)** — generous whitespace, plain-language, motion over data; web-portal primary, SMS secondary
- **Cross-cutting chain viewer** — operator mode dense + JSON; public mode sparse + plain-language

### 4.3 Typography

- Operators: system UI sans (already used in React ports)
- Citizens: same system UI but larger, fewer weights
- Chain events: monospace for hash anchors, system UI for everything else

### 4.4 Iconography

- Event types get icons from the trust-band palette's neutral companion set
- Hash anchor icon: lock + check (verified) or lock + warning (anomaly)
- Override icon: shield with chevron-up

### 4.5 Layout primitives

- `AppLayout` shell (sidebar + top-chrome) — already shipped Phase 1.6a
- Three-column operator surface: `InboxRail | DetailPane | EventChain`
- Single-pane citizen surface: `StatusTimeline + ActionCall`
- Modal layer for hotline intake + dispute resolution

## 5. Output structure

```
docs/D-UX-Design/
├── 00-phase-4-plan.md             (this file)
├── 01-design-system-foundation.md (locked tokens + components + rules)
├── specs/
│   ├── citizen-status-timeline.md
│   ├── hotline-intake-modal.md
│   ├── per-incident-chain-segment.md
│   ├── operator-dashboard.md
│   ├── inbox-detail.md
│   ├── field-queue.md
│   ├── field-incident-detail.md
│   └── audit-log.md
├── wireframes/
│   └── (ascii wireframes per page)
├── decisions/
│   └── (per-page reconciliation log)
└── tokens/
    └── (extracted per phase)
```

## 6. Constraints honoured throughout

- **Phase 1 PWA-only.** No native mobile app, no SMS-only flows (citizen closure ✅/❌ is web portal; SMS is reminder-only).
- **No dark mode.** Light theme only in Phase 1.
- **English + Hindi + Bengali** (per `content-language.md`). i18n keys at the page level.
- **Offline-first for Karim's surface.** Existing implementation already supports this.
- **Chain is the source of truth.** Every UI surface reads from chain events, never from mutable state. This is the structural property Goal 2 demands.

---

_Plan produced by Saga/Freya — 2026-09-10_
