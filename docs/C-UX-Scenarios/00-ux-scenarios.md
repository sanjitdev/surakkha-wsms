# UX Scenarios — Surakkha v1

> Phase 3 — UX Scenarios
> Source: product-brief.md, 00-trigger-map.md, four primary personas, feature-impact.md, Freya scenario walkthroughs 2026-09-10
> Status: Complete — pending review

---

## Index

| # | Scenario | Archetype | Lane | Screens | File |
|---|----------|-----------|------|---------|------|
| 01 | Priya's shift — Triage, verify, assign (with hotline intake) | Priya the Pipeline Pilot | Action (load-bearing) | 5 | [01-priya-the-pipeline-pilot-triage-verify-assign.md](01-priya-the-pipeline-pilot-triage-verify-assign.md) |
| 02 | Adi's shift — Mark resolved, hand back to Priya (closed-loop queue) | Adi the Auditor | Decision (verifier, closer-support) | 5 | [02-adi-the-auditor-mark-resolved-handoff.md](02-adi-the-auditor-mark-resolved-handoff.md) |
| 03 | Anjali's full citizen arc — Report, got-heard ack, in-progress signals, closure tap | Anjali the Anchor | Source (citizen edge) | 5 | [03-anjali-the-anchor-citizen-arc.md](03-anjali-the-anchor-citizen-arc.md) |
| 04 | Karim's shift — Ack, diagnose, fix, submit proof (field lane) | Karim the Technician | Field (implicit worker) | 6 | [04-karim-the-technician-field-lane.md](04-karim-the-technician-field-lane.md) |
| 05 | Pia's data contract — Phase 1 emission contract for Phase 2 PHA dashboard | Pia the Public Health Authority | Constraint (no Phase 1 UI; data contract only) | 0 Phase 1 | [05-pia-data-contract-pha-deferred.md](05-pia-data-contract-pha-deferred.md) |
| 06 | Audit chain timeline — Cross-cutting surface for verification, audit, citizen motion | Cross-cutting (all four roles + constraint) | Cross-cutting (verification, audit, public projection) | 2 | [06-audit-chain-timeline-cross-cutting.md](06-audit-chain-timeline-cross-cutting.md) |

**Total screens identified:** 23 (5 + 5 + 5 + 6 + 0 + 2, with overlap — the chain viewer is rendered inside all the operator scenarios)

---

## Scenario coverage map

### By persona (Trigger Map target groups)

| Persona | Lane | Primary scenario | Handoff in | Handoff out |
|---------|------|------------------|-----------|-------------|
| Priya the Pipeline Pilot | Action | 01 (5 screens) | — | 02 (Karim's assignment) |
| Adi the Auditor | Decision | 02 (5 screens) | 04 (Karim's `ProofSubmitted`) | 01 (back to Priya's confirmation) and 03 (Anjali's tap) |
| Anjali the Anchor | Source | 03 (5 screens) | 02 (Adi's `IncidentResolvedByAdmin` triggers closure ack) | 01 (her submit → Priya's verify) |
| Karim the Technician | Field | 04 (6 screens) | 01 (Priya's `AssignedToTechnician`) | 02 (his `ProofSubmitted` routes to Adi) |

**Constraint persona:** Pia the Public Health Authority has no Phase 1 UI; her scenario (05) is a **data contract** that Phase 1 must satisfy so the Phase 2 PHA dashboard can answer her 12 forces.

**Cross-cutting surface:** Scenario 06 (audit chain timeline) is the shared verification surface used by all four roles at different moments — Priya for dispute, Adi for override audit, Karim for assignment lineage, Anjali for public-mode status timeline.

### By locked Phase 1 incident lifecycle (re-stated for trace)

```
Anjali reports (or sensor fires)        [03 SubmitReportPage, 01 hotline IntakeForm, sensor event]
       ↓
IncidentCreated lands with trust band   [03 Screen 2 confirmation, Scenario 05 chain emission]
       ↓
Priya verifies + assigns Karim          [01 InboxDetail — verify + assign in one submit]
       ↓
Karim on-site                           [04 FieldQueuePage → FieldIncidentDetailPage]
       ↓
Karim submits proof                     [04 ProofSubmitted — 5 fields]
       ↓
Adi marks resolved by admin             [02 FieldIncidentDetailPage — Mark resolved]
       ↓
Anjali receives closure ack             [03 Closure tap — web portal, ✅/❌]
       ↓
(✅ or Priya's confirmation or 30d silence)
       ↓
IncidentClosed                          [01 close back in Priya's queue, 03 Final SMS, 06 chain shows close]
```

### By Goal mapping

| Goal | Coverage | Primary scenario(s) |
|------|----------|---------------------|
| G1 — Loop is reproducible | All four operator scenarios + the locked lifecycle trace | 01 (Priya, primary), 02 (Adi, primary), 03 (Anjali, primary), 04 (Karim, primary) |
| G2 — Loop is defensible | Reasoning capture + chain anchoring + named-actor attribution | 01 (P3 decideless + Path B + Path C reasoning), 02 (closure reasoning), 06 (chain viewer + verification) |
| G3 — Citizens feel heard in motion | Three-beat signal map | 03 (got-heard ack + in-progress timeline + closure tap; primary for G3) |

### By trust band coverage

- **Anchors (T1 priority default):** 03 (anchor badge visible + T1 default band)
- **Non-anchor reporters (T2 default):** 03 (form behaviour at T2)
- **Hotline-sourced incidents (T3 default, three-of-five signals missing):** 01 (Path C — heaviest reasoning weight)
- **Sensor-only incidents (no human report):** Not yet specced — flag for Phase 1.5 if Surakkha's sensor deployment begins firing autonomous incidents.

### By feature-impact (top 5 priority features)

| # | Feature | Scenario coverage |
|---|---------|-------------------|
| 1 | Pre-triage trust band + auto-routing | 01 (OperatorDashboard sorted priority-first; auto-routed tail collapsed) |
| 2 | In-flight citizen motion signals | 03 (Screen 3 — gap screen for citizen status timeline; Scenario 05 emits the data, 06 reads it) |
| 3 | Post-resolution sensor readback | 02 (FieldIncidentDetailPage left-rail post-resolution readback as close-justification signal), 03 (reopen trigger if readback shows contamination not cleared) |
| 4 | Closure ack with ✅/❌ | 03 (Screen 4 — closure tap, web portal, silent path with periodic reminders), 02 (Mark resolved triggers ack dispatch) |
| 5 | Resolution-proof bundle viewer | 02 (FieldIncidentDetailPage proof-bundle viewer, fields 1–4 required + 5 optional), 04 (Karim's ProofSubmitted form — same fields inverse direction) |

---

## Gap screens identified (Phase 1 design work)

Two screens surfaced in this scenario cycle that have NO existing page in the codebase:

1. **Citizen status timeline** (Scenario 03 Screen 3) — Anjali's in-progress signal surface. Not implemented in `web/src/pages/`. Highest-priority Phase 1 design.
2. **Hotline intake modal/side-panel** (Scenario 01 Screen 3) — manual report entry from hotline calls. Not implemented in `web/src/pages/`. Spec call for: dashboard-mounted modal, six-field capture (caller info + report + call outcome), T3 default band, hotline-reporter lineage preserved through Scenario 05 data contract.

A third candidate surfaced but is described as a reuse:

3. **Per-incident chain segment viewer** (Scenario 06 Screen 2) — the existing `AuditLog.tsx` is the cross-incident view; the per-incident segment may already be served by `InboxDetail.tsx` chain-tab or may need a new dedicated view. Flag for Freya's brownfield reconciliation.

---

## Phase 4 readiness

All 6 scenarios are specced, force-mapped, and source-linked. The scenarios name screens and describe user behavior; **Phase 4 UX Design adds**:
- Page specs (one per page; specs are produced by Freya's `agents/spec-writer.md` sub-agent in conversation with the user)
- Excalidraw wireframes (one per page; produced by Freya's `agents/wireframe.md` sub-agent)
- Design tokens (extracted progressively per page; produced by Freya's `agents/token-extractor.md` sub-agent)

The Design Loop runs once per page: discuss → spec → wireframe → approve → iterate → update spec → implement → browser review → extract tokens.

**Estimated Phase 4 scope:** 23 page specs + 23 wireframes + progressive token extraction. The complexity clusters around:
- The 5 cross-cutting surfaces (OperatorDashboard, FieldQueuePage, FieldIncidentDetailPage, AuditLog, StatusTimeline) that have multiple personas reading them.
- The 2 gap screens (Citizen Status Timeline, Hotline Intake Modal) that have no existing implementation to reconcile against.
- The 1 data contract (Scenario 05) that has no UX surface but needs Phase 2 build coordination.

---

_Produced by Saga/Freya — 2026-09-10_
_Source: product-brief.md, 00-trigger-map.md, 01-business-goals.md, 02-persona-pia-the-public-health-authority.md, 03-persona-priya-the-pipeline-pilot.md, 04-persona-anjali-the-anchor.md, 05-persona-adi-the-auditor.md, feature-impact.md, A-Product-Brief/{content-language.md, visual-direction.md}, individual scenario files 01–06._
