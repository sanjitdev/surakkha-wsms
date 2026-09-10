# Business Goals — Surakkha v1

> Phase 2 — Trigger Mapping · Workshop 1
> Source: docs/A-Product-Brief/product-brief.md, confirmed in conversation (Sanjit + Saga, 2026-09-10)
> Status: Draft — pending review

---

## Vision

Surakkha proves the operator-response loop end-to-end in one lighthouse city (Dhaka) — sensor + citizen report → verified incident → operator action → citizen closure — with every event on a tamper-evident chain that an auditor can verify without the gateway code.

---

## Strategic Goals

### Goal 1 — Loop is reproducible

*One sentence:* A single end-to-end lifecycle runs reproducibly in Dhaka — the demo bar is the ship bar.

| # | Objective | Target |
|---|-----------|--------|
| 1.1 | Sensor or Anjali report lands in the gateway | within 60 s of source-side timestamp |
| 1.2 | Cluster window + sensor cross-check + reputation lookup all fire as chain events | 100% of incoming reports |
| 1.3 | End-to-end lifecycle reproducible on demand for an auditor demo | runs without manual recovery, in <30 min wall-clock |

### Goal 2 — Loop is defensible

*One sentence:* Every event is anchored to a tamper-evident chain that an auditor can verify independently — without the gateway code.

| # | Objective | Target |
|---|-----------|--------|
| 2.1 | Audit chain verifiable by independent hash recomputation | 100% of blocks, verified daily by the chain-integrity monitor |
| 2.2 | Every operator action and non-action anchored to a playbook step with reasoning | 100% of writes (R5 binding) |
| 2.3 | Read access to chain is policy-controlled per role, with per-read access-log | 100% of chain reads logged to `ChainRead` event |

### Goal 3 — Citizens feel heard in motion

*One sentence:* When a citizen reports a problem, the system keeps signaling back so the citizen believes their report is alive — not just at the start, but across the entire resolution arc.

The acknowledgment is a continuum, not a binary. Three signal moments:

1. **Got heard** — the report landed, was understood, did not disappear.
2. **In progress** — someone (or some process) is working on it; the citizen sees motion.
3. **Closed** — the resolution lands; citizen confirms (✅) or reopens (❌) with full lineage.

Speed matters most at the first signal (got heard). The in-progress signal is the bridge that holds trust while the fix takes its real-world time. The closed signal preserves the audit trail whether or not the citizen confirms.

| # | Objective | Target |
|---|-----------|--------|
| 3.1 | Citizen receives the "got heard" acknowledgment after their report lands | within 5 min of source-side timestamp (matches FR-4.3 for Anjali; same SLA for Ramesh surface) |
| 3.2 | Citizen receives an "in progress" signal whenever the incident advances through a playbook step | every state transition within the same SLA chain, surfaced to the citizen's surface |
| 3.3 | Citizen receives a closure signal with ✅ / ❌ tap and a plain-language summary of what happened | within 1 hour of `IncidentClosed` (matches FR-6 + the citizen-ack closure surface FE-F6) |

---

_Produced by Saga — 2026-09-10_
_Source: docs/A-Product-Brief/product-brief.md, Workshop 1 conversation_
