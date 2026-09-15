# Design Log — Surakkha WSMS

> WDS Phase 4 / 5 progress.
> Maintained by Freya (Phase 4) and Mimir (Phase 5).
> Last updated: 2026-09-15 (Stage 9 complete — ready-for-build; WDS audit complete, GAP-1 closed; GAP-TRIG-KARIM closed; wireframe convention migrated to Mermaid + mmdc; outline rendering-tool updated; WO-008 audit-log reconciled — **Tier 2 DONE**: WO-004 · WO-005 · WO-006 · WO-007 · WO-008).
>
> **Handoff status:** All 17 PRDs in `docs/E-Development/NNN-[slug].xml` are
> `status="planned"` and ready for `mimir build`. Master PRD at
> `docs/E-Development/000-PRD.md`. Open-question resolutions at
> `docs/E-Development/000-STAGE-7-RESOLUTIONS.md`. Wireframes at
> `docs/D-UX-Design/wireframes/*.mmd` (rendered via mmdc 11.17.0).

---

## 1. Phase status

| Phase | Name | Status |
|---|---|---|
| 0 | Alignment & Signoff | ✓ complete (2026-09-09) |
| 1 | Product Brief | ✓ complete (2026-09-10) |
| 2 | Trigger Map | ✓ complete (2026-09-10) |
| 3 | UX Scenarios | ✓ complete (2026-09-10) |
| 4 | UX Design | ✓ complete (2026-09-11, lockdown-bound) |
| 5 | Agentic Development | ✓ ready-for-build (17 WO + 17 PRD + 51 questions resolved + 4 MAJOR closed 2026-09-15) |
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
| citizen-status-timeline.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |
| hotline-intake-modal.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |
| per-incident-chain-segment.md | S✓ | ○ | ○ | ○ | ○ | ○ | ✓ | S✓ |

### 2.2 Tier 2 — load-bearing existing pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| operator-dashboard.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| inbox-detail.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| field-queue.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| field-incident-detail.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| audit-log.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |

### 2.3 Tier 3 — light infrastructure pages

| Page | Spec | Wireframe | Approved | Built | Reviewed | Tokens | WO | PRD |
|---|---|---|---|---|---|---|---|---|
| inbox-list.md | S✓ | ○ | ○ | B✓ | ○ | T | ✓ | S✓ |
| inbox-rail.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| submit-report-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| citizen-ack-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| login-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| settings-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| styleguide-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| coming-soon-page.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |
| verify-flow.md | S✓ | ○ | ○ | existing (web/) | ○ | T | ✓ | S✓ |

---

## 3. Phase 5 prep — open items

Tracked in `docs/D-UX-Design/04-phase-5-prep-todo.md`.

| Stage | Description | Status |
|---|---|---|
| 1 | Convention cleanup (flatten specs/) | ✓ complete (2026-09-15) |
| 2 | WDS scaffolding (E-Development/ + design log) | ✓ complete (2026-09-15) |
| 3 | Brownfield tech audit (Mimir) | ✓ complete (2026-09-15) |
| 4 | Master PRD (Saga) | ✓ complete (2026-09-15) |
| 5 | 17 Work Orders (Freya) | ✓ complete (2026-09-15; 3 Tier 1, 5 Tier 2, 9 Tier 3) |
| 6 | 17 feature PRDs (Mimir) | ✓ complete (2026-09-15) |
| 7 | Resolve open questions + 5 MAJOR items | ✓ complete (2026-09-15; 51 questions + 4 MAJOR items via `000-STAGE-7-RESOLUTIONS.md`) |
| 9 | Ready-for-build handoff | ✓ complete (2026-09-15) |

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

## 6. Tier 3 build log

### WO-009 inbox-list — Mimir 2026-09-15

Built. 6 REQs (001..006) + 6 acceptance criteria + lockdown sweep pinned via `web/src/__checks__/fe-inbox-list-reconcile.test.tsx` (14 tests, all green).

Key reconciliations:
- Trust band = verification state; reporter-badge = source attribute. Both chips land on every row in a new `chrome` column (BandPill locked + ReporterBadge from WO-006 + age + missing-evidence chips).
- URL persistence: `?filter=band=…&reporter=…&status=…&from=…&to=…` round-trips on mount + every chip toggle.
- Loading / error / empty states split into 3 branches: chain-unreachable vs fetch-error vs no-matches.
- Pagination via `<Pagination>` primitive, default 20/page.

Files: `web/src/pages/InboxList.tsx` (+258 LOC), `web/src/pages/inboxListModel.ts` (+45), `web/src/types/inbox.ts` (+150), `web/src/styles/inbox.css` (+90), i18n en+bn (+60 LOC), test file new (561 LOC).

---

_End of design log. Updated by Freya at each Design Loop step; by Mimir at each build step._
