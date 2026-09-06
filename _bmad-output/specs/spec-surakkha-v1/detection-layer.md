# Detection Layer

The detection layer is most visible to outside viewers but not highest leverage. The response loop and sales motion are. v1 ships a deliberately narrow detection layer to prove the loop, with the architecture designed to absorb sophistication in v2.

## 1. Sensor tier pyramid

v1 occupies tier 1 (industrial, small footprint) and tier 3 (sentinel-only). The intermediate municipal tier is deferred to v2 once the integration pattern is proven.

| Tier | Cost (capex) | What it does | Where it goes | Who makes it |
|---|---|---|---|---|
| Industrial (lab-grade) | $5K–$20K lab / $200–$500 OEM, integrated | High-leverage source-grade measurements: free chlorine residual, turbidity, pH, conductivity (bacterial focus) with chemical baseline capability. One reading at source protects the entire downstream. | Source intakes, pump stations. Mains power, fixed connectivity. | Hach / Thermo / Xylem. We integrate, not manufacture. |
| Sentinel (ward-grade) | $1 paper strip + Anjali's phone + on-device CV | Colorimetric chemistry read weekly via smartphone photo and CV model. 10x denser spatial coverage than industrial-only at the same budget. | Schools (Anjali's site), hospitals, community points — the ward's human-traffic node. | Vendor owns strip manufacture. Anjali owns handling and reading at her site. |
| Municipal (deferred v2) | $200–$500 Chinese OEM | Intermediate-grade utility probes. | Utility distribution network. | Chinese OEMs. Not in v1. |

**v1 footprint:** 5 industrial probes + 30 sentinel strips. Approximately $2,500 industrial capex + 30 × $1 strips + 30 × phone-as-network = a 20x denser coverage footprint than industrial-only at a 6x lower capex.

## 2. Sentinel strip design

A strip is a $1 paper test using colorimetric chemistry — commodity-grade, similar to pool or aquarium test strips — combined with a smartphone photo and an on-device CV model that converts the color reading into a quantitative value. The strip is the data node; the phone is the network.

**How Anjali uses it.** Weekly. Dip, photograph, the CV model reads the color, the photo and reading upload when connectivity allows. Phone-as-network — the Anjali's phone syncs to cloud when it can, inheriting offline-first patterns from community-health-worker systems. SMS fallback covers feature-phone and low-bandwidth cases.

**What it does for the system.**
- 10x denser spatial coverage than industrial-only at the same budget.
- Lives at the ward's human-traffic point — exactly where Anjali is and where Ramesh passes.
- Anchors Anjali's authority: she is the human-in-the-loop for the sensor at her site. Her handling discipline is the QA.
- Creates a **structural data moat** as the network scales: 50K strip readings across 50 cities > 50 readings in one city. This compounds through the audit chain into ML training fuel in v2+.
- Gillette-model razor-and-blade economics on the strip is the key cost lever.

## 3. Sentinel QA discipline

QA/QC is a challenge at scale — storage, handling, lot degradation, reader variance. It must be designed in v1 even if not load-bearing yet. **Bad lot = silent trust destruction.** (C-9, load-bearing)

### 3a. Third-party lab certification before shipment (C-9)

Every sentinel lot is **third-party lab certified before shipment.** This is not vendor self-test — it is an independent certification from a lab external to the strip manufacturer and external to Surakkha. The certification record is content-addressed and chained into the audit log; the strip lot cannot ship without a signed certification entry visible to all parties.

The discipline is:

- **Vendor's role ends at certified delivery.** The vendor manufactures strips and delivers them bundled with the third-party certification. Vendor's warranty is that each shipped lot carries a valid certification entry.
- **City owns handling discipline.** From the moment the lot crosses the city boundary, ownership of handling, storage, and field-use integrity belongs to the city — typically the utility under PHA oversight. Bad storage, expired strip use, or mishandling at the ward sentinel site is a city-side failure mode, not a vendor failure mode.
- **City owns field failures.** A bad-lot discovered after deployment is the city's incident to own and disclose. Vendor provides the audit-chain evidence (lot ID, certification timestamp, ship date, recipient) to support attribution; city owns the public acknowledgement and remediation.

This split is what makes the vendor-disclaims-liability position (C-13) defensible: the vendor's liability is bounded to certified-delivery; everything after that is city-owned. Insurance, legal exposure, and public communications map cleanly to this line.

### 3b. Operational QA mechanics

**Lot tracking.** Each strip lot carries a manufacture ID. The system records which lot was read where, when, by whom, and what CV reading it produced.

**Expiration.** Strips expire. Expired strips must be visually flagged in the Anjali UX and excluded from fusion input.

**Operator-reading variance.** Reader variance is the dominant error source. The CV model normalizes for camera and lighting, but Anjali's handling (dip time, rinse, photo angle) is the variance floor. Self-service QA: photos out-of-band for a strip's expected range are flagged for re-read.

**Bad-lot incident response plan.** A bad-lot incident response plan must exist before first lot ships. The plan must be written, signed by the PHA, and rehearsed by the city before any lot is dispatched to a sentinel site. The plan must specify: (a) the lab that will perform post-incident re-certification; (b) the public-communication template the PHA owns; (c) the city's responsibility chain from lot ID to public acknowledgement. The system must surface bad-lot attribution fast — by lot ID, by site, by time window — so that a confirmed failure becomes a public acknowledgement, not a silent correction. Failures acknowledged publicly are a trust pillar (Section 10); silent behavior changes destroy trust permanently.

## 4. Source-fusion engine v1 math

Basic weighted-source voting, deliberately not ML-heavy. v1 ships weighted-voting; v2 swaps in ML without changing the interface.

```
score = w_sensor · sensor_reading
      + w_anjali · anjali_report
      + w_citizen · complaint_cluster
      + w_lab · lab_result
      + w_env · environmental_signal
```

**Defaults.** Weights are city-configurable per contaminant class; defaults come from WHO-grounded calibration.

**Source-credibility weights.** Anjali's credibility weight is learned from her historical accuracy (overridden outcomes) but updated **weekly in v1, not real-time**. Real-time credibility creates gaming and panic-sensitivity — weekly cadence is the deliberate v1 choice.

**Output.** A ranked action list, not raw sensor feeds. Priya does not see 36 sensor readings; she sees an ordered list of 4–6 incidents to action with playbook recommendation, source attribution, and corroborated confidence score. The output feeds the tiered escalation policy: T1 (single anomaly) triggers on a single source crossing threshold; T2 (multi-source corroboration) is what the fusion engine surfaces.

## 5. Why basic voting, not ML-heavy, in v1

Three reasons, each load-bearing:

1. **The response loop is the load-bearing test.** v1 ships to prove that the playbook-driven, two-tier-operator, tiered-escalation, audit-tracked response loop works in a real city. Detection sophistication that doesn't feed the loop is decoration.
2. **ML without data overfits.** A model trained on 50 events from one city is not a model. It is overfitting.
3. **The audit chain generates the training data that justifies ML in v2+.** Every override, every deviation, every outcome is labeled incident data at scale. A model trained on 50,000 such events from 50 cities beats a model trained on 50 events from one city. The moat compounds city by city — but only if v1 captures the data faithfully, which means a simple engine that runs every time.

## 6. Sensor placement optimization

Placement is **information-gain-per-dollar, not uniform coverage.** Two regimes:

- **Source-grade = high leverage.** Industrial probes cluster at intakes and pumps. One reading at source protects the entire downstream. 5 probes cover the city's hydraulic spine.
- **Tap-grade = low cost, high density.** Sentinels cluster at the ward's human-traffic nodes — schools, hospitals, community points. 30 strips provide ~1 reading per ward-level node.

Placement is also a political decision. Ward-by-ward resource allocation is a negotiation; the PHA approval gate at T2→T3 is the political wrapper for that allocation in steady state, and the same PHA relationship legitimizes initial siting. PHA approval is not a UI nuisance — it is embedded governance.

## 7. Multi-radio connectivity (architecture, not user capability — C-15)

The detection layer sits on top of a multi-radio connectivity layer. Connectivity is an **architectural property of the system, not a user capability** — Anjali does not "select" connectivity; the platform routes around outages silently. Sensor silence is an audit-logged event, not maintenance noise.

The tiers by site class:

- **Source-grade** = trivial. Mains power, fixed connectivity.
- **Pump-grade** = medium. Mostly connected, intermittent outages common.
- **Distribution-grade** = hard. Diesel generator, intermittent.
- **Tap-grade (sentinel)** = very hard. No mains, possibly no fixed network.

**Multi-radio fallback in v1:** cellular primary → LPWAN secondary → store-and-forward on SD card tertiary. **Ward sentinel uses phone-as-network** — the Anjali's phone syncs to cloud when it can, offline-first. The system tolerates connectivity loss as expected operation, not as exception. Latency of action beats measurement accuracy — the architecture optimizes for the bad-day path, not the good-day path.

**Audit consequence.** Every sensor-silence window beyond a configurable threshold is itself an audit-logged event. The audit chain treats silence the same as a reading — it is data. The PHA can query "which sensors have been silent for >24h?" and the answer is on-chain with timestamps. This is what makes "silent trust destruction" impossible: the absence of a reading is a recorded event, not a missing record.
