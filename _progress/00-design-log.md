# Design Log — Surakkha WSMS

> WDS Phase 4 / 5 progress.
> Maintained by Freya (Phase 4) and Mimir (Phase 5).
> Last updated: 2026-09-15 (Stage 2 scaffold).

---

## 1. Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Alignment & Signoff | ✓ complete (2026-09-09) |
| 1 | Product Brief | ✓ complete (2026-09-10) |
| 2 | Trigger Map | ✓ complete (2026-09-10) |
| 3 | UX Scenarios | ✓ complete (2026-09-10) |
| 4 | UX Design | ✓ complete (2026-09-11, lockdown-bound) |
| 5 | Agentic Development | 🔄 in-progress (master PRD complete 2026-09-15) |
| 6 | Asset Generation | ○ not started |
| 7 | Design System | 🔄 partial (foundation + tokens extracted; full atomic library deferred) |
| 8 | Product Evolution | ○ not started |

---

## 2. Design Loop Status

Per WDS `references/ux-design-workflow.md`:

`○` not started · `S` speccing · `S✓` spec approved · `W` wireframed · `✓` approved · `✓S` spec synced · `B` building · `B✓` built · `R` reviewed · `T` tokens extracted

### 2.1 Tier 1 — gap screens

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| citizen-status-timeline.md | S✓ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| hotline-intake-modal.md | S✓ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |
| per-incident-chain-segment.md | S✓ | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

### 2.2 Tier 2 — load-bearing existing pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| operator-dashboard.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| inbox-detail.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| field-queue.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| field-incident-detail.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| audit-log.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |

### 2.3 Tier 3 — light infrastructure pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| inbox-list.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| inbox-rail.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| submit-report-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| citizen-ack-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| login-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| settings-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| styleguide-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| coming-soon-page.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |
| verify-flow.md | S✓ | ○ | ○ | existing (web/) | ○ | partial | ○ | ○ |

---

## 3. Phase 5 prep — open items

Tracked in `docs/D-UX-Design/04-phase-5-prep-todo.md`.

| Stage | Description | Status |
|---|---|---|
| 1 | Convention cleanup (flatten specs/) | ✓ complete (2026-09-15) |
| 2 | WDS scaffolding (E-Development/ + design log) | ✓ complete (2026-09-15) |
| 3 | Brownfield tech audit (Mimir) | ✓ complete (2026-09-15) |
| 4 | Master PRD (Saga) | ✓ complete (2026-09-15) |
| 5 | 17 Work Orders (Freya) | ○ pending |
| 6 | 17 feature PRDs (Mimir) | ○ pending |
| 7 | Resolve open questions + 5 MAJOR items | ○ pending |
| 9 | Ready-for-build handoff | ○ pending |

---

## 4. Lockdown binding (Phase 4 closeout cascade)

From `02-phase-4-closeout.md`:

| Layer | Status |
|---|---|
| Foundation (`01-design-system-foundation.md`) | Lockdown-bound 2026-09-11 |
| Scenarios (03 / 04 / 05) | Re-read; reporter-badge separated from trust band |
| Tier 1 specs | Re-edited; lockdown tokens applied; no Hindi; no confetti; shadcn/ui referenced |
| Tier 2 specs | 114 reconciliation items; 95-step migration plan |
| Tier 3 specs | 5 MAJOR items flagged for fix |
| CSS bridge (`web/mockups/theme.css`) | Lockdown tokens added additively |
| Decision documents | `decisions/00-lockdown-audit.md`, `decisions/01-token-deconfliction-plan.md` |

---

## 5. Cascade shift — trust band × reporter badge

**Before:** trust band carried all semantic load (T1 = anchor-priority, T3 = hotline-sourced lowest).

**After (lockdown, binding):**
- Trust band = verification state: T1 unverified · T2 verified · T3 issuance · resolved
- Reporter badge = separate source attribute: anchor · hotline · webform · sensor
- A reporter can be an anchor at any trust band.
- Hotline-sourced = T1 default + hotline reporter-badge (not T3).
- T3 is reserved for consumer-notice issuance path (build-time lint-enforced).

---

_End of design log. Updated by Freya at each Design Loop step; by Mimir at each build step._
