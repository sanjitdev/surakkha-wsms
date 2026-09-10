# Product Brief — Surakkha v1

2026-09-10

> **Source.** Condensed discovery via Material Analyzer — extracted from `_bmad-output/planning-artifacts/project-context.md`, `prd-surakkha-2026-09-06/prd.md`, `epic-fe-1-context.md`, `docs/idea.md`, `AGENTS.md`, `CHANGELOG.md`, and `web/` source tree. No new decisions invented; gaps noted inline.
>
> **Tracker.** This document advances `_progress/wds-project-outline.yaml` `product-brief: not-started` → complete.

---

## Vision

Surakkha v1 (Bengali: সুরক্ষা — *protection*) is the **first lighthouse-city deployment** of a water-safety monitoring platform whose load-bearing system is the operator's response loop, not the sensor feed. Sensor signals and citizen reports flow into verified incidents that an operator can act on **without anyone driving across Dhaka to confirm a sensor is right**. Every action is anchored to a tamper-evident audit chain that any auditor can verify independently.

The product exists to prove the loop works end-to-end in one city — not to scale fleet-wide. If the loop proves out, it becomes the deployment pattern for any water utility that has to defend its public notices, its response times, and its playbook execution against an external auditor.

---

## Positioning

**Target market.** Single lighthouse deployment: Dhaka, Bangladesh, ~250,000 citizens across 25 wards, served by 50 Anjalis (2 per ward), 5 industrial sensors, and 30 sentinel strips. Funded through World Bank Water Global Practice (IDA/IBRD country lending).

**Differentiation.** Existing water-safety systems are raw-sensor dashboards. Surakkha replaces that with:

1. **Pre-triage trust band** — incidents are auto-routed to the right inbox bucket (`high | medium | low`) before any human sees them.
2. **Operator loop, not sensor feed** — the load-bearing product is Priya's response, not the sensor graph.
3. **Tamper-evident audit chain** — every action anchored to a content-addressed block hash; independently verifiable.
4. **Citizen closure loop** — Anjali gets a ✅ / ❌ on the resolution, with ❌ reopening the incident with full lineage preserved.
5. **Playbook as code** — WHO-grounded, simulator-tested, deviation-tracked, PHA-approved. Deviations are first-class with friction, not blocks.

**What this is not.** Not a real-time sensor dashboard. Not a multi-tenant SaaS. Not a fleet-management platform. Not a PHA pane (Phase 2). Not a public-notice channel (Phase 2).

---

## Business Model

**Revenue path:** Indirect, via World Bank procurement. No per-seat pricing, no subscription, no per-report charge in Phase 1.

**Commercial logic:** Funded as a **lighthouse city demonstration** that, if successful, becomes the deployment pattern for WB-funded water utilities globally. C-16 (no proprietary lock-in) is load-bearing: vendor-neutral observability (OpenTelemetry), Bangladesh-resident active write path, audit chain readable by any auditor without Surakkha installed.

**Phase 1 economics:** Single deployment, single tenant `dhaka`, single funder. Cost recovery deferred to Phase 2 fleet contracts.

---

## Business Customers

**Primary buyer:** Dhaka city Public Health Authority (PHA) — the analog of Dr. Mensah in the original personas. PHA owns:
- Playbook approval authority (T3 boundary dual signature)
- Per-contaminant-class threshold tuning
- PHA monthly report consumption (auto-generated from audit trail)
- Read-only audit chain browser

**Procurement path:** World Bank Water Global Practice country lending (Bangladesh). Vendor-neutral, open-spec, no proprietary lock-in. C-16 binding.

**Decision-maker:** PHA director signs off on playbook amendments and threshold changes. T3 boundary changes require dual signature.

**PHA is never a message-desk.** PHA does not issue public notices — that is a Phase 2 capability, owned by the Mayor's office for tone, PHA for the threshold that triggers the notice.

---

## Target Users

> Per project-context §2, persona count is locked at 4 + 1 non-persona. Behavioral profiles for the brief:

**Anjali — School operator (source lane).** Embedded in a micro-community. Reports via a no-login, no-dashboard, low-end-Android, intermittent-connectivity surface. Bangla primary, English fallback. Wins when her report is taken seriously, her status compounds (weekly check-in discipline, not per-report bounty), and her neighborhood stays safe. Hybrid incentive: BDT 2,000/month stipend + ICDDR,B / BSMMU credential + quarterly city-level recognition. Anti-abuse: 2+ verified-false reports in 30 days → auto-tagged `bulk_triage_routed = true` (not blocked).

**Priya — Central city operator (action lane).** Runs the ranked action list, executes PHA-approved playbooks, captures deviations with reasoning. Wins when she resolves incidents without harm, her expertise compounds, and her monthly report is auto-generated (not hand-built). Sees `IncidentCreated` ranked by fusion score, with source attribution and corroboration confidence — never raw sensor feeds. Executes each step in <3 minutes per incident.

**Admin (decision lane).** Verifies (overrides trust band), assigns operators with structured `due_at`, verifies resolution proofs (photo + GPS + EXIF), closes incidents, dispatches ack requests to citizens. Wins when false-positive public notices never fire and the audit chain stands up to a WB auditor's review.

**Sensor (source lane, non-human).** Industrial probes at intakes / pump stations. Cellular radio, auto-detects contamination above WHO-grounded thresholds. NTU + conductivity + chlorine_residual in Phase 1 payload. No surface — writes via `POST /v1/chain` adapter.

**System (non-persona trust actor).** Runs the 5-min cluster window, sensor cross-check, reporter-reputation lookup, trust-band computation, auto-routing, and the two background monitors (chain-integrity at 60s tick, sensor-silence at 60s tick). Background asyncio tasks in the gateway.

**PHA director (constraint persona — Dr. Mensah BD equivalent, no Phase 1 surface).** Per project-context §2 the persona count is locked at 4 for Phase 1 UIs and the PHA pane is deferred to Phase 2 (line 42 + line 152). PHA is workshopped here as a constraint persona — like the Attacker in the original PRD — whose driving forces shape Phase 1 design without becoming a Phase 1 UI surface. PHA owns: T3-boundary playbook approval (dual signature at the T3 threshold), per-contaminant-class threshold tuning (chronic vs acute SLA tiers), read-only audit-chain browser, PHA monthly report consumption (auto-assembled from the trail, never hand-built). PHA's force profile matters because Goal 2 (defensible) is the only goal she can directly bless or veto; if her audit forces aren't met, no lighthouse demo survives the WB review.

---

## Product Concept

**What kind of product:** A tamper-evident, event-sourced, content-addressed incident-response platform with three UI products (Anjali-mobile minimal form, Admin desktop, Operator mobile-friendly web), one single write path (the gateway), and one system-of-record (the audit chain).

**Founding structural principles:**

| Principle | What it means in code |
|---|---|
| **The chain is the database** (AD-1) | Single gateway is the sole writer. The chain is the event store. No module writes directly to chain storage. |
| **Single tenant per chain** (AD-5) | Per-tenant chain with `prev_block_hash` linking same-tenant rows. Cross-tenant read attempts logged as `CrossTenantAccessAttempted`. |
| **Pre-triage, not post-triage** | Trust band is computed *before* any admin sees the report. Drives inbox routing. |
| **Operator loop is the product** | The load-bearing thing is what Priya does after the report lands. Sensor graph is a means, not an end. |
| **Playbook as code, deviation as first-class** | Deviations are logged with reasoning, clustered monthly, promoted to amendment candidates with lineage. |
| **Three UIs as separate products** (AD-7) | Anjali-mobile, Admin desktop, Operator mobile-friendly web. Each has its own design lockdown, primitives, and trade-offs. |

**Phase 1 scope (demo bar — what ships):**
- A sensor reading above threshold, or an Anjali report, lands in the gateway within 60 s.
- 5-minute cluster window, sensor cross-check, reporter-reputation lookup all fire as chain events.
- `IncidentCreated` lands with a trust band and routes to the correct admin inbox bucket.
- Admin acks, verifies (or rejects with `reason_category`), assigns an operator with structured `due_at`.
- Operator acks, dispatches a team, submits resolution proof (photo + GPS + device-clock timestamp).
- Admin verifies the proof and closes; Anjali gets a closure notification with ✅ / ❌ taps.
- ❌ triggers `IncidentReopened{parent}` with full lineage preserved on the chain.
- Any auditor can open the per-incident audit timeline and see every event anchored to a chain hash.

**Out of Phase 1 (deliberate non-goals — see project-context §8 for the full list):** PHA pane, public notice channel, dual-signature attestation, simulator harness, multi-tenancy, WB evidence export, multi-radio fallback, phone-as-network, hybrid incentive, RTBF tombstones, councillor trust-bridging voice, playbook engine, override-anomaly enforcement, operator UI Bangla locale, Anjali-mobile polish.

---

## Success Criteria

**Primary KPI:** End-to-end lifecycle reproducible in a single demo from sensor trigger to citizen closure to audit.

**Secondary indicators:**
- Trust-band pre-triage fires on 100% of incoming reports (no human sees a report before its band is computed).
- Audit chain verifiable independently — any auditor can hash the chain and reproduce it without the gateway code.
- 5-minute cluster window matches ≥1 corroborating signal in ≥40% of incidents (caller: synthetic / historical replay).
- Operator median time-to-resolve: <2 hours for T2-class incidents.
- 100% of operator actions and non-actions are anchored to a playbook step with reasoning.
- 0 unverifiable chain blocks in the chain-integrity monitor (the 60s background tick).

**Tertiary (Phase 1 demo non-goals, tracked not blocked):**
- PHA pane adoption — Phase 2.
- Public notice issuance rate — Phase 2.
- Multi-tenant federation — Phase 2.

---

## Competitive Landscape

**Today's alternatives:**

| Alternative | What it does | What it doesn't |
|---|---|---|
| Raw sensor dashboards (utility SCADA) | Real-time sensor feed | No operator loop, no trust band, no audit chain, no citizen loop |
| Consumer complaint apps (311-style) | Citizen reports in | No operator response loop, no audit chain, no fusion with sensors |
| Generic ticketing (Jira, ServiceNow) | Workflow | Not content-addressed, no chain, no WHO playbook |
| Manual operator notebooks + WhatsApp | Tribal knowledge | No audit, no per-step reasoning, no public defensibility |

**Surakkha's unfair advantage:** The combination of all five — content-addressed audit chain + pre-triage trust band + operator loop + WHO-grounded playbook + citizen closure loop — is what no other system in this space offers. Each piece alone exists somewhere; the combination is the moat.

**Why a lighthouse city, not a fleet play:** A fleet play requires every city to adopt the same playbook engine, the same threshold language, the same trust-band model. That's a 5-year sales cycle. The lighthouse proves the loop in one city under one PHA, then the pattern travels via the WB funding channel.

---

## Constraints

**Technical (locked 2026-09-07):** Python 3.11+ / FastAPI / SQLite (WAL mode, single-node) / asyncio / pytest + httpx + in-memory SQLite / OpenTelemetry SDK / React + Vite + TS + TanStack Query (later epics) / pnpm. ULID identifiers, SHA-256 block hashing, per-tenant chain. No TanStack Query / Zustand / Redux in the frontend (per FE-1 spine). Zero-dep primitives (no `date-fns`, no `@tanstack/react-table`).

**Operational:** Single-region Dhaka deployment. Local DB + replicated peer (out-of-region backup snapshots only). Active write path stays Bangladesh-resident (C-16). Per-city namespace `dhaka`; federation-ready but not active.

**Regulatory / commercial:**
- C-16: No proprietary lock-in. Vendor-neutral observability, WB procurement compatible.
- C-13: Liability split codified — vendor carries platform-integrity liability; PHA carries approval liability; utility carries operational liability. The audit chain is the evidence surface.
- C-11: SMS-first-class (not fallback). 160-char GSM-7 / 70-char UCS-2 hard cap; multi-segment rejected in Phase 1.
- C-14: WHO template library is a v1 deliverable, not an external dependency.

**Timeline:** Phase 1 ships when the end-to-end demo bar is reproducible. WB evidence export tooling, PHA pane, multi-tenancy, simulator harness are Phase 2.

**Frontend lockdown (lockstep with backend, not separable):** Color palette / typography / spacing / iconography / data display formats / component patterns / per-persona wireframes / accessibility baseline / trust-band inbox layout / per-incident audit timeline / Bangla copy rules — all locked before any code. Token system locked 2026-09-07 (no new tokens without amending the relevant dim doc).

**Stack change protocol:** Stack swaps require explicit user approval and a fresh epic-context edit. The implementation does not silently re-decide these.

---

## Gaps (flagged, not invented)

- `[GAP]` Concrete event schemas for each of the 15 Phase 1 event types (owned by implementing code per AD-4; first event-schema design pass follows UX lockdown).
- `[GAP]` Per-city config values: NTU threshold default (1.0 stated in `epics-backend.md`, needs explicit projection-config landing), cluster window default (5 min), sensor cross-check threshold (NTU match ±15 min, 500 m radius), silence threshold (30 min), operator ack SLA (10 min), admin verify SLA, citizen ✅ / ❌ window.
- `[GAP]` WHO template library content (C-14 — deferred to PRD M1 milestone, not Phase 1).
- `[GAP]` WB evidence export format (operational, deferred).
- `[GAP]` Identity provider / RBAC implementation choice (deferred — Story 1.2 wires the mechanism with a placeholder auth session).
- `[GAP]` Brand-language / SEO strategy (Phase 1 has no public marketing surface; not invented here).

---

## What is NOT in the brief (and where it lives)

- **UX / interaction patterns** (TopChrome 48px, Sidebar persona-aware, Inbox row 56px, etc.) — `_bmad-output/implementation-artifacts/epic-fe-1-context.md` and the FE-1.x shipped specs.
- **Frontend architecture invariants** (4-layer A/B/C/D, 200 LoC cap, AD-FE-4 through AD-FE-9) — `AGENTS.md` §2 and `_bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md`.
- **Backend architecture decisions** (AD-1 through AD-17) — `_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md`.
- **Trigger map** — next phase; this brief sets up its inputs.
