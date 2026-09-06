# Web-Verification Review — Surakkha v1 Architecture Spine

**Reviewer:** web-verification lens
**Spine under review:** `_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md`
**Date of review:** 2026-09-06
**Scope:** Verify each committed named technology in the spine's Stack section (and adjacent load-bearing technology references) against the live web as of September 2026. Flag existence, current versions, dominant role, licensing, and any 2026 paved-path defaults the spine should lean on.

---

## 1. What the spine commits to

The spine's "Stack" section names only seeds, not concrete technologies — by design. Reading the section in context, the committed seeds are:

| Seed | Where it appears | Spine disposition |
|---|---|---|
| Event store (Kafka / Postgres-with-append-only / dedicated event-store-DB) | Stack table, Deferred | Three candidates named; selection deferred to stack-pass |
| AWS ap-southeast-1 | Stack table, deployment topology | Candidate; "Bangladesh-region provider TBD" |
| Open-source observability (vendor-neutral) | Stack table, AD-10 | Internal stack; vendor-neutral per C-8/C-16 |
| Kubernetes-based cluster | Deployment topology | Implicit; named in source tree as `K8S` block |
| ULIDs for entity/event IDs | Consistency Conventions | Committed convention |
| Mermaid for diagrams | All sections | Documentation tooling |
| Event-sourced core + CQRS read-models | Design Paradigm | Architectural paradigm |
| Content-addressed blocks with prior-hash chaining | AD-1, AD-4, capability map | Committed structural pattern |
| EventSchema versioning with upcasters | AD-4 | Committed rule |

There are also implicit technology assumptions through the spec's channel adapters and WB procurement (C-16): WhatsApp Business API client, signed SMS gateway, OIDC/Keycloak-class IdP (deferred), and the World Bank "results framework" export format.

---

## 2. Verification per committed seed

### 2.1 Event store candidates

**Kafka.** Apache Kafka 4.0 was released in 2025 as the first major version where ZooKeeper is removed and KRaft is the sole consensus protocol. As of 2026 the latest line is in the 4.x series with 3.x receiving only maintenance updates. Kafka remains a healthy, viable event-streaming substrate. *However:* Kafka is not, by itself, a content-addressed block store with cryptographic chaining. To meet AD-1 ("event store IS the audit chain"), the team would need to layer the content-addressed block convention on top of Kafka topics, with the chain hash computed at the application/gateway layer. This is feasible and a recognized pattern, but the spine should be explicit that Kafka-as-named is being used as a **transport** with cryptographic chaining bolted on at the gateway — not as the chain itself.

**PostgreSQL with append-only table.** PostgreSQL 18 was released in September 2025 and is the current major version line; PostgreSQL 19 is in beta as of mid-2026. Postgres is a defensible substrate for a content-addressed audit chain (single-process append + hash function on insert + per-row prior_hash). The 18-series adds improvements relevant here (better logical replication, partitioning primitives that simplify per-tenant namespace, and improved write-path throughput under contention). Using Postgres as the chain has the operational advantage of one operational substrate for both projections and the chain (with the projections in separate databases), at the cost of treating the database as the chain-of-record. This is a known pattern.

**Dedicated event-store-DB.** As of 2026, the project historically known as **EventStoreDB has been renamed to KurrentDB** (rebranded by Kurrent, Inc.; the developer docs domain `developers.eventstore.com` now 301-redirects to `docs.kurrent.io`; the current server release line is documented as v25.x). This is a load-bearing rename the spine must reflect — the spine's "dedicated event-store-DB" candidate is, in 2026, **KurrentDB**, not EventStoreDB. Two further notes:
- KurrentDB's licensing model has evolved over 2024–2025. Prospective adopters must verify the current license (it has toggled between BSD-3-Clause and BSL/SSPL variants depending on version) before assuming it fits a WB-funded, multi-tenant public-sector deployment. WB procurement rules (C-16) typically disfavour BSL-class licenses. This needs an explicit check at the stack pass; do not assume the older "EventStoreDB = permissive open source" framing is current.
- An alternative Kafka-compatible engine worth naming alongside is **Redpanda** (Kafka API compatible, KRaft-native, no JVM, single-binary deployment). It deserves a mention as a candidate given AD-10's "operationally simpler" spirit.

**Spine section:** Stack (event store row); Deferred (event store implementation); AD-1; AD-4.
**Verdict:** The three-candidate framing survives, but two corrections are needed: (a) the dedicated-store candidate is KurrentDB in 2026, not EventStoreDB; (b) whichever candidate is selected, the spine should explicitly state where the cryptographic chain lives (gateway-computed, not implicit in the store).

### 2.2 AWS ap-southeast-1 (Singapore) as Bangladesh-region candidate

Confirmed: as of 2026, AWS does **not** operate a Bangladesh region. The closest AWS regions are:
- `ap-southeast-1` Singapore (launched 2010)
- `ap-south-1` Mumbai, India
- `ap-southeast-3` Jakarta, Indonesia

The spine's deployment topology correctly notes "Bangladesh-region provider TBD" alongside AWS ap-southeast-1 as the candidate. However, **data-residency / data-sovereignty requirements (PRD §5.4: "Bangladesh data lives in Bangladesh-resident storage") are not satisfied by Singapore-resident storage.** This is the most significant web-verification finding in the review:

- The PRD's §5.4 commits to Bangladesh data residency.
- The spine defers cloud-region selection.
- AD-9 explicitly says "active write path stays in Bangladesh."

The deferred cloud-provider/region decision and the PRD's data-residency commit are in tension when the only AWS candidate in range is Singapore. Possible live-2026 resolutions:
- A **local Bangladesh cloud provider** — the spine's "Bangladesh-region provider TBD" line is the right gesture; needs a real candidate named at stack-pass.
- **Hybrid:** Bangladesh-local primary + out-of-region replicated peer, matching AD-9's "local + single replicated peer" topology — the local primary may need to be a local-provider deployment rather than AWS ap-southeast-1, with AWS serving only the out-of-region peer.
- If AWS is non-negotiable, the data-residency commitment in PRD §5.4 needs a regulatory carve-out explicitly negotiated with the Bangladesh government before M0.

**Spine section:** Stack (cloud row); Deferred (cloud provider / region); AD-9; PRD §5.4.
**Verdict:** The ap-southeast-1 candidate is a real, existing region and correct as a fallback. But the spine should not leave the residency-vs-region tension implicit. Add an explicit note that Singapore-resident storage does not satisfy the PRD's Bangladesh data residency, and that AD-9's "local + replicated peer" topology therefore requires a Bangladesh-resident primary that is **not** ap-southeast-1.

### 2.3 Open-source observability stack (vendor-neutral per AD-10)

In 2026 the dominant open-source observability stack is the OpenTelemetry (OTel) instrumentation framework combined with a deployer's choice of backend: Prometheus + Grafana + Loki + Tempo (the "PLGT" stack) is the most common CNCF-aligned combination, with OpenTelemetry Collector as the ingestion point. **OpenTelemetry graduated to CNCF Graduate status** in 2025 and is the de-facto vendor-neutral standard for instrumentation as of 2026 — replacing the older mix of Zipkin/Jaeger/OpenTracing/OpenCensus.

The spine's commitment to "internal — structured logs, metrics, traces — with vendor-neutral tooling" is well-aligned with 2026's norms. Suggested seeded naming that the spine could include (without committing to versions):
- **OpenTelemetry** for instrumentation (auto-instrumentation + Collector + OTLP).
- **Prometheus** for metrics.
- **Grafana** for dashboards.
- **Loki** or **OpenSearch** for logs.
- **Tempo** or **Jaeger** for traces.

The spine currently leaves the observability stack as just "open-source stack." Given AD-10 is binding and the spec calls out three specific monitors (chain-integrity, sensor-silence, override-anomaly), the spine could name OTel explicitly as the instrumentation layer to make AD-10 verifiable.

**Spine section:** Stack (observability row); AD-10.
**Verdict:** No issue; small upside opportunity to name OTel explicitly.

### 2.4 ULIDs for entity/event IDs

ULID specification (github.com/ulid/spec) is still maintained but the 2026 norm has shifted:

- **RFC 9562** ("Universally Unique IDentifiers (UUIDs)") was published in May 2024 as an IETF Standards Track document, **obsoleting RFC 4122**. It formalizes UUID v6, v7, and v8.
- **UUID v7** is a time-ordered UUID with millisecond Unix-epoch timestamp in the high bits and randomness in the low bits — explicitly suitable for event-sourced / append-only logs (RFC 9562 §5.7 documents the time-ordered property and the monotonic-counter guidance for high-frequency generation).
- UUID v7 is now the most commonly recommended default for new distributed systems in 2026, supported natively by Python's `uuid` module (Python 3.14 docs), JavaScript's `uuid` npm package, PostgreSQL 18 (`uuidv7()` function), and most other modern language runtimes.

ULID and UUID v7 are functionally equivalent for the spine's purposes (128-bit, time-ordered, lexicographically sortable). The spine's choice of ULID is **not wrong** — it predates the RFC and is still maintained — but the 2026 paved-path default for greenfield systems is UUID v7. The reasons ULID remains a fine choice:
- Smaller canonical string (26 vs 36 chars), useful for log brevity.
- Specification is stable and licensed permissively enough for vendor-neutral adoption.
- No language-runtime dependency.

The only practical risk is that storing ULIDs alongside UUIDs in an event-sourced system occasionally requires translation shims; storing them as raw 128-bit values (BINARY(16)) avoids that. The spine's identifier convention uses `{tenant_id}:{entity_id}` as a prefixed composite; this is fine.

**Spine section:** Consistency Conventions (Identifiers row).
**Verdict:** No issue. Optional note: UUID v7 (RFC 9562) is the 2026 default; ULID remains a defensible equivalent. If the implementing team prefers the IETF-standardized identifier, the switch is mechanically trivial.

### 2.5 Kubernetes-based cluster

Kubernetes remains the dominant container-orchestration substrate in 2026, with active CNCF stewardship. No issue. The spine's deployment-topology diagram showing a per-tenant K8s cluster, a per-tenant data plane, and a warm-standby replicated peer is consistent with current best practice for region-local, multi-tenant SaaS.

**Spine section:** Deployment topology.
**Verdict:** No issue.

### 2.6 Mermaid for diagrams

Mermaid is alive and well in 2026, with a stable open-source project at mermaid.js.org and a SaaS companion at mermaid.ai ("Mermaid Chart"). Diagrams in the spine render correctly with current Mermaid syntax. No issue.

**Spine section:** All Mermaid blocks.
**Verdict:** No issue.

### 2.7 Event-sourced core + CQRS read-models (paradigm)

Event sourcing and CQRS remain standard, well-supported architectural patterns in 2026. The chosen hybrid (Observation events written independently + lazy Incident materialization) maps cleanly onto current event-store APIs (Kafka topics for observation stream + projection jobs for incident aggregation). No paradigm-level issue. The pairing of event-sourcing with a content-addressed chain is unusual but principled — the chain is a structural property of the store, not an afterthought log.

**Spine section:** Design Paradigm; AD-1 to AD-4.
**Verdict:** No issue.

### 2.8 Content-addressed blocks with prior-hash chaining

This is a well-understood pattern (blockchains, certificate transparency, Git's content-addressed model, IPFS, and a number of audit-log products follow it). The spine correctly distinguishes between "content-addressed block store" (the substrate concern) and "append-only stream" (the ordering concern). Note for the implementing code:

- Merkle-tree aggregation over the chain enables O(log n) inclusion proofs and efficient cryptographic verification of arbitrary historical blocks.
- The spine's `chain-integrity monitor` (AD-10, observability block) should not just verify the linear chain; it should maintain a Merkle root and verify against a periodically-anchored external witness (e.g., a daily Merkle-root publication to a public timestamping service or a notarized evidence file in the WB evidence export). This is what turns "retroactive tampering is detectable" from a property into a verifiable one — a regulator's strongest card under inquiry.

**Spine section:** AD-1, AD-4, AD-10, observability block.
**Verdict:** No issue; add Merkle-aggregation + external anchoring as a follow-on note for the chain-integrity monitor.

### 2.9 Event-schema versioning with upcasters (AD-4)

The strict-versioning-plus-upcasters pattern is a well-established approach in event-sourced systems (used by Eventide, Axon, EventStoreDB/KurrentDB projection rebuilds, and others). The spine's "old events are upcasted on read" rule is sound and is the modern alternative to in-place schema migration. No issue.

**Spine section:** AD-4.
**Verdict:** No issue.

### 2.10 Implicit technology assumptions in adjacent spec material

The spine does not name these, but the spec/PRD does — flagging for completeness:

- **WhatsApp Business API.** WhatsApp Business Platform remains operational in 2026 with conversation-based pricing tiers (utility / authentication / marketing / service categories). Bangladesh is supported. The spec correctly commits to SMS as first-class per C-11 ("the system must work end-to-end on SMS, not implicitly depend on WhatsApp") and to WhatsApp as the primary front surface — both consistent with the current WhatsApp Business Platform pricing model. No issue.
- **World Bank "results framework" export.** WB procurement under the Water Global Practice continues to use disbursement-linked indicators and results frameworks. The spine's "WB evidence export — scheduled job producing results-framework-compatible artifacts" line is appropriate. No issue.
- **LPWAN availability in Bangladesh.** Banglalink, Grameenphone, and Robi operate LTE-M / NB-IoT networks in Bangladesh. LoRaWAN deployments exist in Bangladesh under a number of municipal and academic pilots; commercial carrier-managed LoRaWAN is not yet as widely deployed as LTE-M/NB-IoT. The spine's "cellular primary → LPWAN secondary → SD-card tertiary" tiering is reasonable but the LPWAN-specific carrier availability in Dhaka should be validated at M5 (alongside the industrial-sensor procurement validation already scheduled).
- **OIDC / Keycloak / Auth0 (deferred).** All three remain viable in 2026. Keycloak is the most common open-source IdP for WB-style public-sector deployments; Auth0 is now part of Okta and its free tier has been progressively narrowed. No spine change needed at the deferred level.

**Spine section:** Adjacent (not in spine directly); PRD §5.6.
**Verdict:** No issue; LPWAN-in-Bangladesh carrier validation should be folded into M5 alongside the industrial-sensor procurement validation.

---

## 3. Summary findings

### Findings worth flagging (3 substantive, 1 minor)

**F1 — Dedicated event-store-DB candidate name is stale.** The spine's "dedicated event-store-DB" candidate should be named **KurrentDB** (renamed from EventStoreDB; `developers.eventstore.com` 301-redirects to `docs.kurrent.io`; current server line v25.x). KurrentDB's licensing model has also evolved across 2024–2025 and must be verified against C-16 (WB procurement, which typically disfavors BSL/SSPL). *Spine section:* Stack (event store row); Deferred (event store implementation). *Fix direction:* Rename the candidate to KurrentDB and add a license-verification step to the deferred stack-selection task.

**F2 — AWS ap-southeast-1 does not satisfy Bangladesh data residency (PRD §5.4).** The spine defers region selection but also defers the residency-vs-region tension. Singapore-resident storage is not Bangladesh-resident. *Spine section:* Stack (cloud row); AD-9; PRD §5.4. *Fix direction:* Either (a) name a Bangladesh-resident local provider as the primary, with AWS ap-southeast-1 or AWS Mumbai as the replicated peer only; or (b) explicitly mark the data-residency commit in PRD §5.4 as "subject to WB + Bangladesh-government carve-out if AWS ap-southeast-1 is selected." Add this to the deferred cloud-region task.

**F3 — Spine is silent on where the cryptographic chain actually lives.** Kafka is a transport; Postgres can serve as the substrate but the chain must be computed at the gateway layer. The spine correctly puts "Audit Chain Gateway — single write path" in the structural seed but doesn't explicitly state that the chain hash is computed at the gateway, not implicit in whatever store is selected. *Spine section:* AD-1, AD-4, structural seed. *Fix direction:* Add one sentence to AD-1 clarifying that the chain hash and content addressing are gateway-computed; the underlying store is a substrate for the chained blocks. Optional follow-on: add Merkle aggregation + external anchoring for the chain-integrity monitor (this turns the "retroactive tampering is detectable" property into a regulator-verifiable one).

**F4 (minor) — Open-source observability stack could name OpenTelemetry explicitly.** AD-10 is binding and the observability block names three specific monitors. In 2026 OpenTelemetry is the vendor-neutral instrumentation default (CNCF Graduated). The spine currently leaves "open-source stack" unnamed. *Spine section:* Stack (observability row); AD-10. *Fix direction:* Add OpenTelemetry as the named instrumentation layer; allow backend (Prometheus/Grafana/Loki/Tempo) to be picked at stack-pass.

### Positive observations (no fix needed)

- **ULID convention.** Defensible in 2026; UUID v7 (RFC 9562, May 2024) is the 2026 default but ULID remains a sound equivalent. No spine change required.
- **Event-sourced + CQRS paradigm, content-addressed chaining, schema versioning with upcasters.** All standard 2026 patterns; no issue.
- **Kubernetes deployment topology.** Standard, no issue.
- **Mermaid diagrams.** Stable, no issue.
- **WhatsApp Business Platform + SMS + WB procurement assumptions.** All still valid in 2026.
- **OIDC / Keycloak / Auth0 as IdP candidates.** All viable; Keycloak most appropriate for WB-style public-sector deployments.

---

## 4. Verdict

**PASS-with-notes.** The spine's seeds are mostly sound for a 2026 greenfield deployment targeting Dhaka. The paradigm (event-sourced core + CQRS), the chain integrity pattern, the strict-versioning-with-upcasters rule, and the multi-tenant / sealed-component architectural moves all map cleanly onto current best practice. Two corrections are warranted before this spine leaves draft status:

1. **Rename the dedicated event-store candidate to KurrentDB and add a license-verification step against C-16.**
2. **Resolve the AWS ap-southeast-1 vs. Bangladesh data-residency tension explicitly — either by naming a Bangladesh-resident primary or by flagging the residency commit as carve-out-dependent.**

One optional improvement (OpenTelemetry as the named instrumentation layer in AD-10) and one optional follow-on (Merkle aggregation + external anchoring for the chain-integrity monitor) would tighten the spine but are not blocking.

No FAIL findings. No deprecated technology, no wrong version pin, no architectural pattern that has been superseded. The seeds are reasonable; the corrections above are clarifications rather than rework.
