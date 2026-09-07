# Dimension 7 — Sensor Wire Format · Lockdown

**Status:** LOCKED (v1, 2026-09-07)
**Source preview:** `_bmad-output/design/wire-preview.html`
**Source companions:** `_bmad-output/specs/spec-surakkha-v1/architecture-invariants.md` §6, §8; `_bmad-output/planning-artifacts/architecture/architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md` AD-1, AD-4, AD-8, AD-11, AD-12, AD-14, AD-15, AD-17; `_bmad-output/design/06-data-formats-lockdown.md` §6, §9; `_bmad-output/specs/spec-surakkha-v1/detection-layer.md` §7

---

## 1. Scope

This document locks the **network-side wire format** that carries data between Surakkha v1 surfaces and the audit-chain gateway. It owns:

- **Event-envelope schema** (the body of every chain write, on every transport).
- **Transport protocols** (HTTP for write/poll, SSE for live push, IndexedDB-backed offline queue for Anjali-mobile).
- **Sensor status state machine** (online nominal → online caution → online breach → degraded → offline).
- **Chain anchor format** (the `chain_ref` string shape — what dim 6 brands).
- **Signature attestation envelope** (the dual-signature AD-11 primitive).
- **Offline batch envelope** (the SD-card / phone-as-network store-and-forward shape).
- **Polling cadence contract** (the cadence, jitter, and 30-second default per dim 5b §F).

**Out of scope:**

- React Query / SWR cache shape — engineering-setup workstream (dim 6 owns *prop* shapes; dim 9 owns *transit* shapes; dim 7 owns *wire* shapes).
- KurrentDB vs Postgres-vs-append-only-table selection — Deferred in the architecture spine; dim 7 specifies what crosses the seam, not which storage backs it.
- WHO template library message strings — CONTENT owned by playbook lifecycle + Bangla copy review; dim 7 owns the *envelope*, not the *body*.

This is **dim 7**, not dim 9. dim 9 (system integration) will take these contracts and wire them into the React scaffold + adapter layer.

---

## 2. Format conventions

### 2.1 Every shape on the wire is TypeScript first, JSON second

Same convention as dim 6 §2.1. Each locked shape is presented as:

1. A **TypeScript interface** — canonical, lives in `surakkha-app/src/types/wire/*.ts`.
2. A **JSON example** — sample payload that matches the interface.
3. A **canonical serialization rule** — what the bytes look like over HTTP / SSE body.

Zod validators are deferred to engineering-setup; TypeScript types + a hand-written `assertNever` switch on `event_type` is the runtime guarantee in v1.

### 2.2 ULIDs for client-minted IDs

Per ARCHITECTURE-SPINE "Consistency Conventions" row and AD-14: every `event_id`, `actor_ref`, `sensor_id`, and `incident_id` is a **ULID** (lexicographically sortable, time-ordered, 26 characters Crockford-base32). ULIDs are written as **strings** on the wire — never as numbers, dates, or objects.

```ts
// ULID format: 26 chars, Crockford base32 (no I, L, O, U)
type ULID = string & { readonly __brand: 'ULID' };
// Example: 01J0A0A0A0A0A0A0A0A0A0A0A0
```

The first 10 chars encode timestamp ms (sortable); the last 16 chars encode 80 bits of randomness. ULIDs **do not** carry tenant prefix on the wire — tenant_id is a **separate field** on the envelope (per AD-5 + AD-14 consistency convention: "tenant prefix: `{tenant_id}:{entity_id}`" applies inside the *operational* store, not on the wire).

### 2.3 All timestamps are ISO 8601 UTC strings

Same rule as dim 6 §2.4. The envelope has **two** timestamps (consistent with AD-4 + Consistency Conventions "Event timestamps" row):

- `occurred_at`: source-side time (when the sensor reading was taken, when Anjali tapped, when PHA signed).
- `ingested_at`: gateway-side time (when the gateway received it).

Skew between `occurred_at` and `ingested_at` is **captured, not normalized** — it is data, not noise. The chain-integrity monitor uses it for replay analytics.

### 2.4 Correlation + causation IDs

Per Consistency Conventions (AD-1): every event carries:

- `correlation_id`: links events to a logical operation (one logical Anjali report → one correlation across her submission, the gateway's SensorReadingSubmitted write, the IncidentCreated event, etc.).
- `causation_id`: links to the single prior event that **caused** this one (the gateway's ingestion of Anjali's submission is *caused by* her submission's HTTP request event).

Both are ULIDs. Both can be `null` for events with no precedent (genesis block, sensor's first reading).

### 2.5 Actor identity is closed-enum + session-bound ref

Per AD-12 (closed enum, 8 entries, frozen 2026-09-07):

```ts
type ActorRole =
  | 'vendor'
  | 'pha_approver'
  | 'utility_operator'
  | 'utility_message_desk'
  | 'anjali'
  | 'priya'
  | 'pha_viewer'
  | 'system';
```

The `ref` field is a ULID that the **auth service** resolves from the session token. The gateway rejects any event whose `ref` cannot be resolved to a live auth-session reference. Components that emit events **do not mint the ref** — they receive it from the auth middleware.

```ts
interface ActorIdentity {
  role: ActorRole;        // closed enum; gateway rejects non-enum values
  ref: ULID;              // session-bound; resolved by auth service, not emitting component
  display?: string;       // optional human-readable name (PHA Director Mensah, Anjali Ward 7)
}
```

For sensor-originated events, `role: 'system'` and `ref` is the **sensor's authenticated device ULID** (multi-radio adapter attests to the sensor's identity at provisioning, not at every reading). For monitor-emitted events (chain-integrity, sensor-silence, councillor-SLA), `role: 'system'` and `ref` is the **monitor's auth-service-bound actor ULID**.

### 2.6 Locale lives at the container, never on the wire

Same rule as dim 6 §2.5. Strings are plain strings; the rendering layer picks the font from `<body data-locale>`. **An exception on the wire**: the `PublicNoticeIssued` payload carries `recipient_locale: 'en' | 'bn'` because the message *content* must be locale-resolved before it goes out to SMS/WhatsApp. This is the single locale tag on the wire, and it lives in the *consumer message template body*, not on a per-string basis.

```ts
interface PublicNoticeRecipientList {
  ward_ids: WardId[];
  locale: 'en' | 'bn';           // the single locale tag allowed on the wire
  fallback_locale?: 'en' | 'bn';  // for feature-phone Bangla fallback (EXPERIENCE.md §"VS15 text-style")
}
```

---

## 3. Event envelope (the universal shape)

Every chain write — from any surface, over any transport — has the same envelope shape. The gateway does not parse past `event_type` until the typed payload matches.

```ts
interface EnvelopeBase {
  schema_version: number;              // bumped per AD-4; v1 = 1
  tenant_id: string;                   // 'dhaka' for v1; per-city ULID-slug in federation
  event_type: EventType;               // see §4 for the closed enum
  event_id: ULID;                      // client-minted (ULID)
  occurred_at: ISOTimestamp;           // source-side time
  ingested_at: ISOTimestamp;           // gateway-side time (set by gateway on accept, not by client)
  actor_identity: ActorIdentity;       // see §2.5
  correlation_id: ULID | null;
  causation_id: ULID | null;
  payload: EventPayload;               // discriminated union on event_type
}

type EventType =
  // sensor side
  | 'SensorReadingSubmitted'
  | 'SensorSilenceObserved'
  | 'SensorStatusChanged'
  // anjali side
  | 'AnjaliReportSubmitted'
  | 'AnjaliSentinelReadingSubmitted'
  | 'AnjaliAcknowledgeDelivered'
  // incident aggregate
  | 'IncidentCreated'
  | 'IncidentEscalated'
  | 'IncidentResolved'
  // operator side
  | 'PlaybookStepExecuted'
  | 'DeviationCaptured'
  | 'OverrideRecorded'
  | 'ShiftCoverageActivated'
  | 'ShiftCoverageEnded'
  // playbook lifecycle
  | 'PlaybookVersionDrafted'
  | 'PlaybookVersionPublished'
  | 'PlaybookVersionAbandoned'
  | 'PlaybookAmendmentApproved'
  // consumer messaging
  | 'PublicNoticeIssued'
  | 'PublicNoticeRetracted'
  | 'CouncillorEndorsementRecorded'
  | 'CouncillorRelayMissed'
  | 'CouncillorQualityFlagged'
  | 'CouncillorBypassActivated'
  | 'ChannelDeliveryFailed'
  // governance
  | 'SignatureAttestation'
  | 'CityConfigChanged'
  | 'SchemaVersionBumped'
  // auth + access
  | 'OperatorAuthenticated'
  | 'OperatorAccessLogged'
  // monitor-emitted
  | 'ChainVerificationFailed'
  // rejection (errors-as-events per Consistency Conventions)
  | 'CommandRejected'
  | 'ProjectionFailed';
```

**Ingested_at is server-minted.** The client never sets it. The gateway sets it on accept, before the row hits the chain. This prevents client-side clock skew from corrupting replay analytics.

**Schema version lives on the envelope**, not deep inside the payload (per Consistency Conventions). Upcasters read `schema_version` and apply per-version transforms. v1 ships only `schema_version: 1`.

**Idempotency by `(tenant_id, event_id)`** is enforced at the gateway via SQLite uniqueness constraint (`UNIQUE(tenant_id, event_id)` per spec-1-1 code map). The gateway returns 409 `DuplicateEventRejected` on duplicates — silent dedup is forbidden (AD-14).

---

## 4. Per-event-type payloads (subset)

Listed in priority of UI-visible impact; the rest follow the same discriminated-union pattern. **Payloads use branded ID types where applicable** (per dim 6 §2.3 + AD-3 source-attribution pin).

### 4.1 SensorReadingSubmitted (the v1 bread-and-butter)

```ts
interface SensorReadingSubmittedPayload {
  sensor_id: SensorId;
  ward_id: WardId;
  cluster_id?: ClusterId;
  // the wire shape — what crosses the transport, what gets upcasted on read
  readings: {
    turbidity_ntu: number;        // 0-1000, 2-decimal precision
    ph?: number;                   // 0-14, 2-decimal precision; absent = not measured
    chlorine_ppm?: number;        // 0-5, 2-decimal precision
    temperature_c?: number;       // 0-50, 1-decimal precision
    conductivity_us_cm?: number;  // 0-3000
  };
  radio_tier: 'cellular' | 'lpwan' | 'sd_card';   // AD-8 multi-radio contract
  battery_pct?: number;           // 0-100; absent = sensor has no battery telemetry
  flags?: Array<'spike' | 'drift' | 'low_battery' | 'tamper_suspect'>;
}
```

**Wire-level note:** the `flags` field comes from sensor-side pre-classification (firmware raises a flag before submission); the *server-side* classification (cross-sensor, time-windowed spike) is a **separate computation** that becomes `IncidentCreated`. Wire carries what the sensor said; server computes what the fusion engine decided.

**Source attribution** (per AD-3 pinning rule): `{observation_id: ULID, source_type: 'sensor_reading', weight: float, observed_at: ISO8601}`. The `payload` above carries the *observation*; the source-attribution record on the `IncidentCreated` event references its ULID.

### 4.2 SensorStatusChanged

```ts
interface SensorStatusChangedPayload {
  sensor_id: SensorId;
  from_status: SensorStatus;
  to_status: SensorStatus;
  reason:
    | 'reading_window_ok'          // online nominal after silence
    | 'reading_window_caution'     // borderline turbidity for >N minutes
    | 'reading_window_breach'      // threshold crossed for >N minutes
    | 'battery_low'                // <15%
    | 'battery_critical'           // <5%
    | 'tamper_detected'            // accelerometer / housing-open event
    | 'silent_for_too_long'        // no reading for >30 min default
    | 'communication_lost';        // gateway side, not sensor side
  observed_at: ISOTimestamp;   // when the status change was detected
}

type SensorStatus =
  | 'online_nominal'
  | 'online_caution'
  | 'online_breach'
  | 'degraded'
  | 'offline';
```

See §8 for the state machine.

### 4.3 SensorSilenceObserved (monitor-emitted)

```ts
interface SensorSilenceObservedPayload {
  sensor_id: SensorId;
  last_observed_at: ISOTimestamp;
  silent_since: ISOTimestamp;
  threshold_minutes: number;    // default 30, per spec-1-1 §3 monitors column
}
```

Emitted by the **sensor-silence monitor** (`role: 'system'`, `ref: monitor_actor`). Re-emitted only when the silence window has lengthened (idempotent against re-ticks).

### 4.4 AnjaliReportSubmitted

```ts
interface AnjaliReportSubmittedPayload {
  anjali_id: ReporterHandle;
  ward_id: WardId;
  modalities: {
    voice_note_url?: string;          // signed gateway upload URL; blob lives outside chain
    voice_transcription?: string;     // optional; null if transcription failed (per EXPERIENCE.md "Voice input")
    sentinel_photo_url?: string;      // sentinel-strip photo if attached
    free_text?: string;               // plain string; not { text, locale }
  };
  gps_coords?: { lat: number; lng: number };  // if collected; opt-in per FR-4
  cluster_match?: ClusterId;
}
```

**Wire-level note:** the Anjali-mobile client mints the `event_id` at **user-acknowledged submission time** (AD-14) and stores it locally. Re-tries on connectivity loss reuse the same `event_id`; a successful post returns 201 + `{chain_ref}`; a retry that hits the gateway after the first POST returns `DuplicateEventRejected` 409 (network still treats that as success — the report *did* land).

### 4.5 AnjaliSentinelReadingSubmitted

```ts
interface AnjaliSentinelReadingSubmittedPayload {
  anjali_id: ReporterHandle;
  ward_id: WardId;
  lot_id: string;                     // strip-lot ULID; C-9 traceability
  strip_expires_at: ISOTimestamp;    // passed in by Anjali-mobile from strip packaging
  cv_reading: {
    color_class: 'clear' | 'amber' | 'brown' | 'pink';   // CV model output
    confidence: number;               // 0-1, 3-decimal precision
    fallback: 'cv' | 'manual_swatch'; // 'manual_swatch' = Anjali picked a color (per EXPERIENCE.md "Photo input")
  };
  photo_url?: string;                 // original photo; only present for fallback != 'manual_swatch'
  expires_flag?: boolean;             // strip past expiry → flag, exclude from fusion input
}
```

### 4.6 IncidentCreated (Incident Aggregator sole emitter)

```ts
interface IncidentCreatedPayload {
  incident_id: ULID;                       // content-addressed per AD-2: sha256(canonical(observation_event_ids[] | tenant_id | correlation_window_id | contaminant_class))
  contaminant_class: ContaminantClass;     // 'bacterial_acute' | 'chronic_lead' | 'chemical_spill' | 'chlorine_residual' | 'turbidity' | 'ph_drift'
  correlation_window_id: ULID;            // points to the CityConfigChanged event that set the window
  observations: SourceAttribution[];      // AD-3 pinned shape
  fusion_score: number;                    // 0-1, 3-decimal precision
  ward_id: WardId;
  cluster_id?: ClusterId;
}

interface SourceAttribution {
  observation_id: ULID;
  source_type: 'anjali_report' | 'sensor_reading' | 'lab_result' | 'complaint' | 'env_signal';
  weight: number;     // 0-1
  observed_at: ISOTimestamp;
}
```

**Sole-emitter rule** (AD-2): only the Incident Aggregator component emits `IncidentCreated`. The gateway rejects `IncidentCreated` events whose `actor_identity.role != 'system'` or whose `actor_identity.ref` is not the Incident Aggregator's auth-bound actor.

### 4.7 SignatureAttestation (AD-11 primitive)

```ts
interface SignatureAttestationPayload {
  attestation_target_event_id: ULID;       // the (event_id, payload_hash, version_id) triple this signature attests to
  attestation_target_payload_hash: string; // sha256(canonical(payload)); computed by attestation emitter, verified by gateway
  attestation_target_version_id: ULID;     // the playbook_version_id or schema_version_id being attested
  attestation_kind: 'pha_approver' | 'utility_message_desk' | 'vendor' | 'utility_operator';
  signature_algorithm: 'ed25519';           // pinned for v1
  signature: string;                        // base64url(ed25519_sign(private_key, canonical({event_id, payload_hash, version_id, actor_ref, attestation_kind})));
}
```

**AD-11 invariant on the wire**: the gateway accepts an underlying dual-signature command only after **both** `SignatureAttestation` events are present with **identical `(event_id, payload_hash, version_id)` triples** (per ARCHITECTURE-SPINE AD-11). A second signature that lands against a typo-correction v2 produces a `CommandRejected{reason: 'attestation_triple_mismatch'}` event. **No buffered-admission window exists** (per AD-11 tightened post-review): both attestations must already be on the chain at write-time of the underlying command, or the gateway rejects before commit.

### 4.8 PublicNoticeIssued (dim 7 wire side; CONTENT owned by playbook)

```ts
interface PublicNoticeIssuedPayload {
  // AD-17 rule 1: same shape as issuance; retraction is a separate event type.
  notice_id: ULID;                          // content-addressed: sha256(canonical({template_id, locale, recipient_ward_ids, body_hash, verification_horizon}))
  template_id: string;                      // which of the 6 shapes per EXPERIENCE.md §"Message string structure"
  locale: 'en' | 'bn';                      // the one allowed locale tag (per §2.6)
  recipient_ward_ids: WardId[];
  body_hash: string;                        // sha256(canonical(filled_template_string))
  filled_template_preview: string;          // the redacted-preview form (per EXPERIENCE.md "Shoulder-surfing redaction")
  character_count: number;                  // gateway computes at write-time per AD-17 rule 5; ≤160 GSM-7 EN, ≤70 UCS-2 BN
  character_budget_alphabet: 'gsm7' | 'ucs2';
  verification_horizon_at: ISOTimestamp;    // when the next update is expected
  zone_label: string;                       // the {ZONE} slot from the template (e.g., 'Ward 7')
  issuing_authority: string;                // e.g., 'Dhaka PHA'
  triggered_by_incident_id?: ULID;          // set when issuance is tied to an incident; null for retraction roll-ups
  // attestation posture — both must be present in the chain BEFORE this event is accepted
  attestation_event_ids: [ULID, ULID];      // [pha_approver, utility_message_desk]; gateway verifies both are present with matching triples
}
```

**AD-17 rule 10 wire note:** the `filled_template_preview` field carries the **redacted** form by default (the chain-side full body is reconstructable from `body_hash` + `template_id` + locale-aware fill at audit time). The chain event itself is fully auditable — redaction is a presentation choice, not a record choice.

### 4.9 PublicNoticeRetracted

```ts
interface PublicNoticeRetractedPayload {
  retraction_target_event_id: ULID;         // the prior PublicNoticeIssued event_id being retracted
  retraction_target_payload_hash: string;   // sha256 of the prior event's payload
  reason_lang_field: string;                // the {REASON_LANG_FIELD} slot — false-alarm cause, locale-aware
  retracted_at: ISOTimestamp;               // gateway time on accept
  recipient_ward_ids: WardId[];             // copied from the retracted notice; same routing
  character_count: number;
  character_budget_alphabet: 'gsm7' | 'ucs2';
  attestation_event_ids: [ULID, ULID];      // dual-signature precondition (per AD-17 rule 2 — retraction is dual-signed)
}
```

**AD-17 retracted precondition** (post-review, tightened): the gateway rejects `PublicNoticeRetracted` events whose `retraction_target_event_id` is not on the chain. A `SubjectRedacted` tombstone on the prior issuance does **not** block retraction — the event remains chain-present even when its payload is projection-redacted (per AD-16 reconciliation + AD-17 rule 3 critical clarification).

### 4.10 CommandRejected (errors-are-events per Consistency Conventions)

```ts
interface CommandRejectedPayload {
  rejection_reason:
    | 'missing_tenant_id'
    | 'missing_actor_identity'
    | 'role_not_in_enum'
    | 'actor_ref_not_session_bound'
    | 'duplicate_event_id'
    | 'cross_tenant_attempt'
    | 'attestation_triple_mismatch'
    | 'dual_signature_missing'
    | 'character_budget_exceeded'
    | 'public_notice_rate_limit_exceeded'
    | 'shift_coverage_missing_or_expired'
    | 'retraction_target_not_on_chain'
    | 'malformed_payload'
    | 'unknown_event_type'
    | 'schema_version_unsupported';
  command_payload_excerpt: object;          // the rejected command's payload, with secrets redacted
  rejection_evidence: string;               // one-line plain English describing what went wrong
  rejected_at: ISOTimestamp;                // gateway-set
}
```

**Wire rule:** every reject emits a `CommandRejected` event with `actor_identity.role: 'system'` and a chain-anchor ref. Operators see the typed reason in plain English with a chain-reference ID — never raw JSON (per EXPERIENCE.md §"Error state").

### 4.11 CityConfigChanged (PHA-owned; single-signature per AD-15)

```ts
interface CityConfigChangedPayload {
  config_key: ConfigKey;
  before_value: unknown;   // serialized JSON-compatible value
  after_value: unknown;
  effective_from: ISOTimestamp;
  config_owner_actor: ActorIdentity;   // single-signature: pha_approver per AD-15
}

type ConfigKey =
  | 'correlation_window.bacterial_acute'
  | 'correlation_window.chemical_spill'
  | 'correlation_window.chronic_lead'
  | 'escalation.threshold.t1_to_t2'
  | 'escalation.threshold.t2_to_t3'
  | 'fusion.weight.anjali'
  | 'fusion.weight.sensor'
  | 'fusion.weight.citizen'
  | 'fusion.weight.lab'
  | 'fusion.weight.env'
  | 'sensor.silence_threshold_minutes'
  | 'councillor.sla_minutes'
  | 'phone_as_network.batch_size'
  | 'rate_limit.public_notice.max_per_hour';
```

`CityConfigChanged` is single-signature (`pha_approver`) per AD-15. The `before/after` diff is replayable — auditors can rebuild any time-window's config from the event stream.

### 4.12 SensorSilenceObserved (already covered §4.3)

---

## 5. Per-transport encoding rules

The same envelope crosses all three transports. Each transport wraps the envelope differently.

### 5.1 HTTP POST /v1/chain (the canonical write)

```
POST /v1/chain HTTP/1.1
Host: gateway.surakkha.bd
Content-Type: application/json
Authorization: Bearer <session_token>
Idempotency-Key: <event_id>           // client-minted ULID; gateway may use it as a Redis-style check before SQLite uniqueness fires

<request body = EnvelopeBase>
```

**Response codes:**
- `201 Created` — accepted; chain head advanced. Body: `{ block_hash: ULID, prev_block_hash: ULID, event_id: ULID }`.
- `400 Bad Request` — typed `CommandRejected` (role-outside-enum, missing-tenant, malformed payload, schema-version-unsupported).
- `401 Unauthorized` — `actor_ref_not_session_bound`; the session token resolved to no actor (token expired or forged).
- `409 Conflict` — `duplicate_event_id` (idempotency trip per AD-14).
- `413 Payload Too Large` — command body exceeded 64 KiB (sensor blocks should not hit this; consumer-message audio attachments ride on separate signed URL).
- `429 Too Many Requests` — `public_notice_rate_limit_exceeded`; `Retry-After: <seconds-until-window-resets>`.
- `422 Unprocessable Entity` — `attestation_triple_mismatch` or `dual_signature_missing` (AD-11; the underlying command is rejected; both events fire: the `CommandRejected` and **no** chain event for the underlying command).

**Content-Type: application/json** is the v1 only. Pickle, msgpack, protobuf — all deferred (no perf data to inform v1 choice).

### 5.2 Server-Sent Events /v1/stream (the live push)

SSE — per dim 5b §F. **One-way** (gateway → client). Reconnect handled by the browser's EventSource; backoff is browser-default (3s → 6s → 12s → 30s cap). The auth method: the browser sends the SSE request with the same `Authorization: Bearer <session_token>` header (Server-Sent Events support cookies and Bearer headers).

**SSE event stream:**

```
event: SensorReadingSubmitted
id: 01J0A0A0A0A0A0A0A0A0A0A0A0
data: {<EnvelopeBase>}

event: IncidentEscalated
id: 01J0A0A0A0A0A0A0A0A0A0A0B1
data: {<EnvelopeBase>}

event: heartbeat
data: {"ts": "2026-09-07T10:00:00.000Z", "chain_head": "0x7f3a·b9c2·4e8d"}
```

**SSE event names** match `event_type` 1:1 (camel-cased = snake-cased verbatim: `SensorReadingSubmitted`).

**Heartbeat** every 30 s with `chain_head` so the client can compute freshness without polling the chain. The chart's SSE pulse dot in dim 5b ticks on every heartbeat.

**Reconnection:** on `EventSource.CLOSE`, the client reconnects; the new connection replays from `Last-Event-Id` if the server supports it (v1: yes, via the `chain_blocks.id` SQLite rowid). On reconnect, the client receives events from the `Last-Event-Id` forward — this is the read-side durability, not the write-side.

**Authorization on SSE reconnect**: tokens refresh mid-session per story 1.2; `401 Unauthorized` on SSE causes the client to drop to **poll mode** (per dim 5d §F fallback) and emit `ChartOnConnectionLost` for the toast (per dim 4).

### 5.3 HTTP GET /v1/chain?cursor= (poll fallback)

When SSE is unavailable or has fallen back, every surface polls. **Default cadence: 30 s ± 10% jitter** (per dim 5b §F).

```
GET /v1/chain?cursor=<ULID>&limit=50 HTTP/1.1
Host: gateway.surakkha.bd
Authorization: Bearer <session_token>

Response:
200 OK
Content-Type: application/json

{
  "events": [<EnvelopeBase>, ...],
  "next_cursor": "<ULID>",
  "chain_head": "0x7f3a·b9c2·4e8d",
  "projection_lag_ms": 312
}
```

**Cursor** is the `event_id` ULID of the last event the client has consumed. Server returns `events` strictly greater than `cursor` (lexicographic, time-ordered by ULID). `limit: 50` default, max `200`. **This is a projection read**, not a chain read — the server translates the cursor to a projection offset (per Consistency Conventions: read models serve dashboards, not the chain itself; consistency is eventual per AD-3).

**Polling jitter math** (per dim 5b §F):
```
actual = intervalMs * (0.9 + Math.random() * 0.2)
```
±10% defeats thundering herd across multiple Priya operator sessions on the same gateway. v1 docs this; v2 may centralize jitter in the gateway (per dim 9 deferred section).

#### 5.3.1 Phase 1 demo: SSE replaced by polling (amendment 2026-09-07)

Per the user's call (and dim 5 §17.1 + dim 6 §6.4), Phase 1 ships frontend-only against MSW. MSW's service-worker model does not intercept Server-Sent Events cleanly (the `EventSource` API bypasses `fetch()` interception). Phase 1 demos therefore use the **polling transport exclusively**, at the same 30 s ± 10% jitter that the production polling fallback exercises (per dim 5d §F state machine: `connecting → connected → reconnecting → fallback-poll → offline`).

**What this means for Phase 1:**

1. **The SSE state machine in dim 5d §F is documented but not exercised.** The polling endpoint returns the same `EnvelopeBase` shapes SSE event bodies would carry; from the React component's perspective, the polling handler and the SSE handler produce identical TypeScript objects.
2. **The chain freshness clock** (§5.4) drives the chart's pulse animation (dim 5b §4.12) — Phase 1 polls the chain head endpoint every 5 s and updates the pulse on each response. The dim 8 ack-pulse and SSE heartbeat (§4.8) both fire from the polling cadence.
3. **The `chain-fail shake` (dim 8 §4.9)** can still be demonstrated: when a mock `ChainVerificationFailed` event lands in the seed dataset, the polling handler returns it on the next tick and the UI shakes — same code path as production.
4. **No EventSource polyfill, no SSE-mock workaround.** The Phase 1 demo is honest about what it is: a polling-driven frontend. When Story 1.1 ships in Phase 2, the SSE handler activates and the polling path becomes the fallback (the dim 5d state machine advances).

**Phase 2 swap:** when `VITE_USE_MOCKS=false`, the `EventSource('/v1/stream')` reconnect handler activates; the polling handler remains dormant unless the SSE state machine enters `reconnecting` or `offline`. The two transports share the same `EnvelopeBase` consumer code path.

### 5.4 HTTP GET /v1/chain/head/<tenant_id>

```
GET /v1/chain/head/dhaka HTTP/1.1
Authorization: Bearer <session_token>

Response:
200 OK
{
  "tenant_id": "dhaka",
  "chain_head_event_id": "01J0A0A0A0A0A0A0A0A0A0A0A9",
  "chain_head_hash": "0x7f3a·b9c2·4e8d",
  "block_height": 142857,
  "ingested_at": "2026-09-07T10:00:00.000Z",
  "verified_at": "2026-09-07T10:00:00.000Z"
}
```

The **chain freshness clock** on Priya-desktop (dim 5 §7.1) is a 5-second poll against this endpoint (the surface strips subsecond precision and shows "Last update 0.3s ago" or "Stale as of 14:08"). `block_height` is the chain head's row count — surfaces don't show it but admins do.

### 5.5 IndexedDB offline queue (Anjali-mobile)

Anjali's phone has **no reliable network**. The mobile client mints `event_id` at user-acknowledged submission time (AD-14), serializes the envelope as JSON, stores it in an IndexedDB store named `pending-events`, and POSTs when online. **The event_id is generated once and reused on retry** — this is how idempotency survives disconnect (AD-14 explicit rule).

```ts
// IndexedDB store schema (logical; IDB is schemaless so this is convention)
interface PendingEventRecord {
  event_id: ULID;                 // primary key, generated at user-acknowledged submit
  envelope: EnvelopeBase;         // serialized JSON
  submit_attempt_count: number;
  last_attempt_at: ISOTimestamp | null;
  last_response_code: number | null;  // 0 = not yet attempted
  chain_ref: ULID | null;         // populated on 201
  failure_reason: CommandRejected['rejection_reason'] | null;
}
```

**Sync algorithm** (engineering-setup workstream owns runtime; dim 7 owns the wire):

1. App startup → scan `pending-events` where `chain_ref is null AND submit_attempt_count < 8`.
2. POST each to `/v1/chain` (transport §5.1).
3. On `201`: set `chain_ref`, decrement badge to "X queued → Y sent".
4. On `409 DuplicateEventRejected`: set `chain_ref` (it landed earlier); no retry.
5. On `4xx` other: increment `submit_attempt_count`; pause until exponential backoff (3s, 6s, 12s, ..., 30m cap).
6. On `5xx` / network error: increment `submit_attempt_count`; same backoff.
7. Stop after 8 attempts; surface `SubmissionFailed{Permanent}` toast (per dim 4 toast pattern); queue persists for human review.

**The `submit_attempt_count` lives on the client, never on the gateway** — the gateway counts via idempotency and `event_id` alone.

### 5.6 SD-card store-and-forward (Anjali-mobile ward sentinel)

For *ward sentinel strips* on Anjali's phone, the SD-card path is the **store-and-forward tertiary** (per AD-8 multi-radio contract). When the phone has no network and no offline-on-IndexedDB path (cold start, full IDB), strips queue as JSON lines in `pending-strips.ndjson` on the phone's local storage. On connectivity recovery, the same submit algorithm replays the NDJSON file, mints an event_id per strip reading at the time Anjali tapped "Save reading" (AD-14 user-acknowledged submission time), and POSTs.

**Same envelope, different transport** — the envelope is `AnjaliSentinelReadingSubmitted`. Only the *bearer* of the envelope differs (HTTP body vs NDJSON line). v1 does not use the actual SD-card slot on the phone (sentinel flow uses the app's local store, which is file-backed on Android); the SD-card path is reserved for **future sensor hardware** that ships without the app.

---

## 6. Chain reference format (chain_ref / block_hash)

```ts
type BlockHash = string & { readonly __brand: 'BlockHash' };
// Format: hex 64 chars (sha256, lowercase), grouped visually as "xxxx · xxxx · xxxx · xxxx"
// (4 groups of 4 hex chars separated by middle-dot U+00B7 + spaces)
// Example: "0x7f3a·b9c2·4e8d·ac12" (full form below)
//
// On the wire (machine): "0x" + 64 lowercase hex chars
// On the UI (visual): "0x7f3a · b9c2 · 4e8d · ac12" (note: leftmost group drops 4 chars, UI shows 4×3 visible + 4 hidden via ellipsis)
// Typical UI display (per dim 4 §15.2): "0x7f3a · b9c2 · …"
// NOTE: full 64 hex chars always on chain; UI truncation is a rendering choice, never a storage choice.
```

**Hash computation** (per Consistency Conventions "Chain hash computation" row + spec-1-1 `canonical.py`):
```
block_hash = sha256(
  canonical_json({
    prev_block_hash,
    tenant_id,
    schema_version,
    event_type,
    event_id,
    occurred_at,
    ingested_at,
    actor_identity,
    payload
  })
)
```
where `canonical_json` is sorted-keys, no whitespace, stable UTF-8 (per spec-1-1).

**Display rule** (per dim 4 + EXPERIENCE.md §"Color independence"): `chain_ref` always renders in mono (`--family-mono` — dim 2) and is color-independent. Operator UI shows the **truncated form** (4×3 + ellipsis) — the full 64 hex is hover-to-reveal copyable on desktop and long-press on mobile.

**No second hashing layer**: the chain is content-addressed by **one** sha256. There is no merkle root, no multi-level proof. v1 ships single-level hashing; v2 may add merklization for cut-off proofs (deferred — not load-bearing for the audit-evidence claim).

---

## 7. Signature attestation envelope (deep dive on AD-11)

The dual-signature flow has **three** events on the wire, not one (per ARCHITECTURE-SPINE Consistency Conventions row):

1. `SignatureAttestation` (× 2): one each from `pha_approver` and `utility_message_desk`. Both reference the **identical `(event_id, payload_hash, version_id)` triple** they attest to.
2. The underlying command event (`PublicNoticeIssued`, `PublicNoticeRetracted`, `PlaybookAmendmentApproved`): carries the `attestation_event_ids: [ULID, ULID]` field (§4.8, §4.9).

**Wire-level flow for `PublicNoticeIssued`:**

```jsonc
// Step 1 (PHA-pane; PHA-pane does NOT issue — see AD-17 rule 9)
POST /v1/chain
{
  "event_type": "SignatureAttestation",
  "event_id": "01J0P...PHA1",
  "tenant_id": "dhaka",
  "schema_version": 1,
  "occurred_at": "2026-09-07T14:08:00.000Z",
  "actor_identity": { "role": "pha_approver", "ref": "<session_bound_actor_ref>" },
  "correlation_id": "01J0P...CORR",
  "causation_id": "01J0P...INCIDENT_ESCALATED",
  "payload": {
    "attestation_target_event_id": "01J0P...TARGET",        // the underlying PublicNoticeIssued event_id, min
    "attestation_target_payload_hash": "0xabc...",          // computed from the eventual issuance payload
    "attestation_target_version_id": "01J0P...V3.3",        // playbook version-of-record
    "attestation_kind": "pha_approver",
    "signature_algorithm": "ed25519",
    "signature": "0xd4f..."
  }
}
// → 201 { "block_hash": "0x...", "prev_block_hash": "0x...", "event_id": "01J0P...PHA1" }

// Step 2 (Priya-desktop; utility_message_desk signs the SAME triple)
POST /v1/chain
{
  "event_type": "SignatureAttestation",
  "event_id": "01J0P...UMD1",
  "payload": {
    "attestation_target_event_id": "01J0P...TARGET",        // SAME event_id as Step 1
    "attestation_target_payload_hash": "0xabc...",          // SAME hash as Step 1
    "attestation_target_version_id": "01J0P...V3.3",        // SAME version_id as Step 1
    "attestation_kind": "utility_message_desk",
    // ...
  }
  // ...
}
// → 201

// Step 3 (Priya-desktop two-tap modal fires; this is the underlying command)
// BEFORE this POST, the gateway verifies both attestations are on-chain with the matching triple.
// If either is missing or the triple mismatches:
//   → 422 Unprocessable Entity + CommandRejected{reason: dual_signature_missing}
//   → NO chain event for the underlying command is written (per AD-11 tightened).
POST /v1/chain
{
  "event_type": "PublicNoticeIssued",
  "event_id": "01J0P...TARGET",
  "payload": {
    "attestation_event_ids": ["01J0P...PHA1", "01J0P...UMD1"],
    // ...
  }
  // ...
}
// → 201 { block_hash: "0x...", ... }

// Replay protection: any replay of step 3 returns 409 DuplicateEventRejected because
// (tenant_id, event_id) is unique, and the same event_id would already exist.
```

**Triple-mismatch guard**: a typo-correction v2 of the underlying command would mint a **new** `event_id` (the payload's `body_hash` changed). The new `event_id` requires **two new `SignatureAttestation` events** referencing the new triple. The gateway would reject the second-sig against v1's triple (per AD-11); the operator must re-sign against v2. The lift is **operator-visible** in the modal — they see "PHA attested v2 at 14:08; vendor attestation pending" — surfaced as a disabled reason, not silently dismissed.

**`attestation_event_ids` field on the underlying command**: this is the *on-chain reference* to the two attestations. Without this field, the gateway cannot deterministically prove the dual-sig was satisfied (a hash lookup at write-time is OK but slow; the explicit field is the audit-evidence anchor).

---

## 8. Sensor status state machine

The `SensorStatusChanged` event reports transitions. The state machine itself lives **server-side** (per detection-layer §7 audit consequence: "the absence of a reading is a recorded event, not a missing record"). The states:

```
   ┌──────────────┐  reading_window_ok
   │   offline    │ ─────────────────▶ online_nominal
   └──────────────┘                        │
        ▲                                  │ reading_window_caution (N min borderline)
        │                                  ▼
        │                           online_caution
   communication_lost                    │
        ▲                                │ reading_window_breach (threshold crossed M min)
        │                                ▼
   ┌──────────────┐                online_breach
   │   degraded   │ ◀───────────── low_battery
   │              │ ◀───────────── low_battery (cascade)
   └──────────────┘ ◀── tamper_detected
        ▲           (auto-promotion to degraded)
        │
        │ battery_critical
        ▼
    (force offline within 24h)
```

**State transitions emit `SensorStatusChanged`** with the `from_status`, `to_status`, and `reason` fields (§4.2).

**Detection windows** (server-side, configurable per tenant via `CityConfigChanged`):

- **online_nominal → online_caution**: parameter `p` (turbidity / pH / chlorine) crosses `tier_low` for ≥ `caution_window_minutes` (default 5 min).
- **online_caution → online_breach**: parameter `p` crosses `tier_medium` (acute threshold) for ≥ `breach_window_minutes` (default 2 min).
- **online_\* → offline**: no `SensorReadingSubmitted` for ≥ `silence_threshold_minutes` (default 30 min). Sensor-silence monitor emits **both** `SensorSilenceObserved` and a `SensorStatusChanged{to_status: 'offline'}` event in a single atomic write.
- **offline → online_nominal**: first `SensorReadingSubmitted` after silence.
- **online_\* → degraded**: `low_battery` (<15%) OR `tamper_detected`. Degraded is a "still reading but unreliable" state — not silent.
- **degraded → offline**: same as above under battery_critical OR 24h of degraded with no fix.

**Fusion input exclusion** (per detection-layer §3a): sensors in `offline` or `degraded` are excluded from fusion **unless** the absence is the signal (silent trust destruction detection). The exclusion rule is a **fusion-engine concern** (AD-3 sealed contract); dim 7 only specifies the wire shape.

---

## 9. Server-aggregated heatmap rules

Per dim 5b §B type #8 (`<Heatmap>`): `data: { day: 0..6; hour: 0..23; count: number }[]`. **The 7×24 matrix is computed server-side, never client-side** (per dim 5b Hand-offs §"to dim 7": heatmap cells are server-aggregated, not client-derived).

```ts
interface ActivityHeatmapQuery {
  endpoint: 'GET /v1/projections/activity-heatmap';
  query_params: {
    from: ISOTimestamp;          // inclusive lower bound
    to: ISOTimestamp;            // exclusive upper bound
    actor_role_filter?: ActorRole;  // e.g., 'operator' for Priya's self-view; defaults to all
    event_type_filter?: EventType[]; // e.g., ['IncidentEscalated', 'OverrideRecorded']
    ward_filter?: WardId[];
  };
  response: {
    cells: HeatmapCell[];        // 168 entries (7 × 24) — one per (day, hour) bucket
    total_count: number;
    bucket_window_days: number;   // 7 (audit-log week view) — matches 'last 7 days'
  };
}

interface HeatmapCell {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = Sunday (per ISO 8601 week conventions)
  hour: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;
  count: number;
}
```

**Why server-aggregated, not client-computed:**
- The audit-log event stream has **60+ events / day / operator** at full v1 load (per docs / 12-hour shift / 200 incidents / day). A client-side aggregation over 7 days is ~840 events per operator — manageable but pushes compute onto a low-end device. Priya-desktop is fine but operator mobile (dim 5d) is not.
- Server aggregation is **read-once-per-page**: the heatmap endpoint caches the projection for the duration of the page load. Client-side aggregation would refresh on each new SSE event — re-paint storm.
- **Bucketing is non-trivial**: server uses UTC for bucket boundaries (consistent across all operators viewing the same cell); client-side would risk timezone conflation in Bangladesh timezone + UTC ambient zone.

**Bucket strategy:** hour 0 = `[00:00, 01:00)`. UTC boundary. **Day index uses Sunday=0** (ISO 8601). `total_count` is computed over the unfiltered event set so that even cells with explicit filters show their true share-of-total.

**Privacy:** PHA-pane shows aggregate across wards; Priya desktop filters to her own `actor_identity.ref`. The filter is **silent** — heatmap shows her events but does not highlight "this is your ward" cells.

---

## 10. Polling cadence contract (per dim 5b §F hand-off)

The polling cadence state machine lives in the **chart component** (per dim 5b §F); dim 7 owns the wire contract and the server's response shape.

### 10.1 Polling endpoint

```
GET /v1/projections/dashboard?cursor=<ULID>&limit=50 HTTP/1.1
Authorization: Bearer <session_token>

Response:
200 OK
{
  "events": [<EnvelopeBase>, ...],
  "next_cursor": "<ULID>",
  "chain_head_event_id": "01J0...",
  "chain_head_hash": "0x...",
  "projection_lag_ms": 312
}
```

**Default cadence: 30 s.** `refreshIntervalMs` prop on each chart overrides per-chart.

**Jitter:** ±10%, computed client-side (per dim 5b):
```
const actual = refreshIntervalMs * (0.9 + Math.random() * 0.2);
```

### 10.2 Polling fallback trigger

Polling kicks in when SSE has fallen back (per dim 5d §F SSE state machine: connecting → connected → reconnecting → fallback-poll → offline). The fallback fires after **3 consecutive SSE connection failures** with exponential backoff (3s, 6s, 12s, capped at 30s per the EventSource default). Once on polling, the chart remains on poll unless the operator manually re-enables SSE.

### 10.3 Server-side polling hard rate limit

The gateway **rate-limits polling endpoints** at 200 req/min per session token. Beyond this, the server returns `429 Too Many Requests` with `Retry-After: 60`. This prevents a misbehaving client from saturating the projection read-side; the rate-limit applies even for token refresh races.

### 10.4 Backpressure: sliding-window `maxPoints`

Per dim 5b §F: chart props `maxPoints: 200` for time-series, `30` for sparklines. Client-side sliding window. **Not a wire concern** — dim 7 mentions it here for the hand-off cross-reference; the wire does not know about `maxPoints`.

---

## 11. Offline batch envelope (Anjali mobile's IDB queue)

Already covered §5.5 + §5.6. The envelope shape itself is the universal `EnvelopeBase`; the IDB/NDJSON queue is purely a *bearer* choice, not a wire-format choice.

**One wire-format rule for offline queue:** the `submit_attempt_count` and `failure_reason` fields live **only in the IDB record**, never in the envelope. The envelope is the same shape regardless of whether it was generated from the live UI or from the offline replay queue.

**Replay order:** the client tracks the **oldest-first** order by `submit_attempt_count` rather than `occurred_at` (clients may have many queued items with seconds-apart timestamps; ordering by ULID `event_id` is the tie-breaker).

---

## 12. Multi-radio contract (per AD-8)

Every sensor reading declares a `radio_tier` field (§4.1). The gateways' adapters route through the right protocol based on the declared tier.

| Tier | Adapter | Transport | Retry | Notes |
|---|---|---|---|---|
| `cellular` | Multi-Radio primary | HTTPS POST `/v1/chain` | exponential (3s → 30s) | low-latency; ideal path |
| `lpwan` | Multi-Radio secondary | HTTPS POST `/v1/chain` over LPWAN gateway | every 5 min (LPWAN duty-cycle) | high-latency; long PAHO |
| `sd_card` | Store-and-forward tertiary | NDJSON file → HTTPS POST on next connectivity | manual replay on device sync | Anjali mobile sentinel flow |

**On the wire, all three tiers produce identical envelopes**. The `radio_tier` field is the only differentiator and it lives in `payload`, not the envelope header. This keeps the gateway's ingest logic uniform.

**The gateway MUST accept envelopes of any tier.** Adapter-layer rejection ("this radio tier is invalid") is a **pre-gateway rejection** — it returns the same `CommandRejected` envelope shape (HTTP 400 + payload) but does **not** write to the chain.

---

## 13. Chain verification + monitor-emitted events

### 13.1 ChainVerificationFailed (monitor-emitted)

```ts
interface ChainVerificationFailedPayload {
  tenant_id: string;
  failed_at_block_id: ULID;          // the row whose recomputed hash diverged
  expected_hash: string;             // the stored block_hash
  computed_hash: string;             // the recomputed value
  recompute_strategy: 'forward_from_genesis' | 'backward_from_head';
  monitor_actor_ref: ULID;           // session-bound; 'system' role
}
```

**Emitted by `chain_integrity_monitor`** (per spec-1-1 §3 monitors column) every 60 s. The failure is **itself** a chain event — the chain self-monitors. Subsequent writes continue; the chain does not halt.

### 13.2 Councillor monitoring events (per AD-17 rules 7-8)

```ts
interface CouncillorRelayMissedPayload {
  ward_id: WardId;
  sla_window_minutes: number;        // the configured councillor-SLA window (default 15)
  expected_at: ISOTimestamp;         // when the relay should have happened
  observed_at: ISOTimestamp;         // when the monitor tick fired
  original_notice_event_id: ULID;    // the PublicNoticeIssued event_id
}
interface CouncillorQualityFlaggedPayload {
  ward_id: WardId;
  pattern: string;                   // e.g., 'audible_refusal_pattern_match'
  evidence_hash: string;             // sha256 of the caller-transcript blob (signed gateway attachment)
  flagged_at: ISOTimestamp;
  observed_count_30d: number;
}
interface CouncillorBypassActivatedPayload {
  ward_id: WardId;
  reason: 'sla_breach' | 'quality_flag' | 'manual';
  fallback_channel: 'pha_direct';    // v1 only channel
  triggered_by_actor_ref: ULID;      // monitor ref for sla_breach/quality_flag; PHA ref for manual
  occurred_at: ISOTimestamp;
}
interface CouncillorEndorsementRecordedPayload {
  notice_event_id: ULID;             // the PublicNoticeIssued being endorsed
  ward_id: WardId;
  councillor_actor_ref: ULID;
  occurred_at: ISOTimestamp;
}
```

**Sole-emitter rule** (per AD-17 rule 8 tightened post-review): `CouncillorBypassActivated` is emitted only by the gateway SLA monitor (for SLA breach / quality flag) **or** a `pha_approver` PHA-pane operator (manual). Manual bypass requires a PHA-pane attestation event with `triggered_by_actor_ref` pointing at the PHA's session-bound actor.

---

## 14. Auth + access-logged events

### 14.1 OperatorAuthenticated

```ts
interface OperatorAuthenticatedPayload {
  session_token_ref: ULID;          // the issued token's id; NOT the token value
  actor_identity: ActorIdentity;    // authenticated as {role, ref, display}
  authenticated_at: ISOTimestamp;
  auth_method: 'session_cookie' | 'bearer_token' | 'session_token_refresh';
}
```

### 14.2 OperatorAccessLogged

Per NFR-S1.4 + architecture-invariants §6: every read of operator data is logged. **Always log on read**, never on write (writes emit their own events).

```ts
interface OperatorAccessLoggedPayload {
  reading_actor: ActorIdentity;      // who is reading
  resource_kind: 'incident' | 'playbook' | 'audit_chain' | 'sensor_reading' | 'anjali_report' | 'projection_slice';
  resource_ref: ULID;                // the resource accessed
  accessed_at: ISOTimestamp;
  access_pattern: 'single_read' | 'page' | 'range_query' | 'export';
  purpose?: string;                  // optional; populated for PHA audit-browser sessions
}
```

**Privacy note:** `OperatorAccessLogged` is itself an audit event — chain-integrity means PHA can audit *who looked at what*. This is by design (per NFR-S1.4: privacy is a saleable feature; access logs are the proof).

---

## 15. What is NOT on the wire

Per dim 6 §7 + dim 7's stricter rule (the wire is the trust-bearing surface):

1. **No per-string locale tags** — banned per dim 6 §2.5. The single exception is `PublicNotice*` payload's `recipient_locale` (§2.6).
2. **No animation / motion / duration values** — never on the envelope. dim 8 owns motion; the wire is motion-blind.
3. **No presentation-only fields** (padding, color, z-index, font) — visual tokens live in CSS.
4. **No analytics / metric tags** — telemetry is split: `actor_identity` carries `role: 'system'` for monitor events; OTel is a separate seam (per AD-10).
5. **No raw PII** for cross-tenant or WB evidence export — k-anonymization happens at the projection layer (per AD-9 + AD-16).
6. **No bearer tokens in payload** — only the `event_id` of the issued `OperatorAuthenticated` event references the token (the token itself never crosses the wire as a field).
7. **No secret keys / shared secrets** — public-key signatures only (ed25519 per §4.7; private keys never leave the auth-service secrets vault).
8. **No chain-private identifiers** that are not on the chain — `correlation_id` and `causation_id` are ULIDs but never carry sensitive semantics; they exist for replay analytics, not for cross-system identification.

---

## 16. Hand-offs

### To dim 6 (data formats)

- **Carry forward unchanged:** `Band`, `SensorId`, `WardId`, `ClusterId`, `ISOTimestamp`, `ChainRef`, branded ID types.
- **New wire-string overlaps (the wire shapes are wire-only; dim 6's prop shapes are prop-only):**
  - `ChainRef` brand is dim 6; dim 7 owns the wire format (`0x` + 64 hex chars).
  - `SensorReading.flags` enum (`spike | drift | low-battery | tamper-suspect`) is dim 6; the wire uses `low_battery` (snake-case) and dim 6's prop shape uses `low-battery` (kebab-case) — same canonical enum, different conventions per surface.
- **Add to dim 6 §6.3 (`ChainRef` format)**: "ChainRef formats and validation are dim 7 territory. dim 6 owns only the brand."

### To dim 8 (motion)

- The wire is motion-blind. No hand-off.

### To dim 9 (system integration)

- **Recharts bundle split per route** (per dim 5b §Deferred) — engineering-setup.
- **SSE auth-header wiring** with token refresh race — engineering-setup. Token refresh may close an EventSource mid-stream; the client must reconnect with the new token.
- **Map tile caching policy** for OSM raster — engineering-setup (Service Worker deferred).
- **Polling jitter centralized at gateway** — engineering-setup. Currently client-side; a future improvement is server-side jitter to defend against coordinated bursts.
- **Multi-radio adapter production deployment** — engineering-setup. The wire shape is locked; the adapter implementations (cellular / LPWAN / SD) are engineering picks.

### To engineering-setup workstream (post-Gate-0)

- **Production wire implementation:** FastAPI gateway endpoints (`POST /v1/chain`, `GET /v1/chain`, `GET /v1/chain/head/<tenant_id>`, `GET /v1/projections/*`) implementing EnvelopeBase + the discriminated-union payload shape. Zod (`pydantic` on the Python side per spec-1-1) validators.
- **SSE implementation:** FastAPI `sse-starlette` or equivalent; the SSE event stream shape is the JSON serialization of EnvelopeBase + the typed-event discriminator.
- **IndexedDB queue** for Anjali-mobile — engineering setup owns the runtime; the schema is `PendingEventRecord` per §5.5.
- **ed25519 key infrastructure** for dual-signature — auth-service owns key generation; the wire uses only public-key signatures.
- **OSM tile caching policy** — Service Worker for the map (per dim 5b §G); deferred.
- **i18n bundle weight** for `bn` locale — dim 5b cross-reference; deferred.

---

## 17. Verification checklist (for dim 7 sign-off)

### Dim-7-ships (validate before lockdown sign-off)

- [ ] All 29 event types defined with discriminated-union payloads
- [ ] `EnvelopeBase` carries `schema_version`, `tenant_id`, `event_type`, `event_id`, `occurred_at`, `ingested_at`, `actor_identity`, `correlation_id`, `causation_id`, `payload`
- [ ] `actor_identity.role` is the closed enum (8 entries, AD-12)
- [ ] `actor_identity.ref` is session-bound; gateway rejects non-resolvable refs
- [ ] HTTP `/v1/chain` returns 201/400/401/409/413/422/429 with typed rejection events
- [ ] SSE `/v1/stream` carries `data: <envelope>` per event; every 30 s heartbeat with `chain_head`
- [ ] Polling `/v1/chain?cursor=` returns events strictly greater than cursor; limit ≤ 200
- [ ] IndexedDB `pending-events` queue schema documented; `event_id` minted at user-acknowledged submission time, reused on retry
- [ ] Sensor status state machine (5 states) documented with detection windows
- [ ] Chain hash computation matches spec-1-1 `canonical_json` + `sha256`
- [ ] AD-11 dual-signature wire flow documented (3-step: PHA sig → UMD sig → underlying command)
- [ ] AD-17 public-notice wire shape documents character budget enforcement (EN ≤160 GSM-7, BN ≤70 UCS-2) and rate limit (5/hr/actor)
- [ ] CityConfigChanged payload serializes `before/after` diff (single-signature)
- [ ] All 4 rejection paths emit `CommandRejected` events with typed reasons
- [ ] `wire-preview.html` renders the envelope schema + per-event-type JSON examples + the SSE / poll / HTTP-write / IDB-queue diagrams
- [ ] Locale-on-wire rule enforced: only `PublicNotice*.locale` is the single permitted locale tag
- [ ] No `any` types in any wire interface
- [ ] No `Date` types anywhere — ISO 8601 strings only
- [ ] Branded IDs for all entity types (`ULID`, `WardId`, `SensorId`, `ClusterId`, etc.)
- [ ] No animation / motion / duration / color / spacing fields on any wire shape

### Deferred to engineering-setup (dim 7 does not gate these)

- [ ] FastAPI handlers implementing all endpoints (1.2, 1.3, etc.)
- [ ] SSE auth-header refresh handling (mid-session token rotation)
- [ ] ed25519 key management; signature verification at gateway
- [ ] Polling-jitter centralization (currently client-side ±10%)
- [ ] Map tile Service Worker
- [ ] Low-end-Android SSE reconnect test (Anjali-mobile context — though Anjali doesn't see charts, the SSE client lib must work on her handset)
- [ ] Localization of the Bangla `bn` string fillers in message templates (live in playbook content, not in dim 7)
- [ ] Production webhook payload signing (HMAC for inbound SCADA).

---

## 18. What was deliberately rejected

| Considered | Rejected because |
|---|---|
| Protobuf / msgpack / Pickle for the wire | JSON is the lingua franca; v1 has no perf data to motivate a binary format; debugging wins (per dim 6 §13). |
| WebSocket (not SSE) | SSE is one-way, simpler auth, native EventSource, automatic reconnection. WebSocket is bi-directional overkill. Per dim 5b §D "Why poll-default + SSE opt-in". |
| Merkle-tree chain (multi-level) | Adds Merkle proof complexity for a cut-off we don't yet need. Single-level sha256 with a chain-integrity monitor is enough for the v1 evidence claim. |
| Webhook-based push | Requires outbound HTTPS from gateway to client — auth complexity + NAT traversal. SSE is server-inbound only. |
| Per-event API key signing | The session-bound `actor_identity.ref` is the auth primitive; event-sig keys would require new secrets management. |
| Time-window hashing (per dim 5 deferred band) | Adds complexity to the chain-integrity monitor. v1 goes with single-level. |
| Binary encrypted events | C-10 privacy is honored via projection-time redaction (AD-16), not at-rest encryption. Encryption at rest is an infra concern, not a wire concern. |
| Different envelope shapes per transport | Increases contract surface. One envelope, three transports. |
| Mixing actor role into event_type | The enum has 25+ entries; per-role event types would triple it. Role is metadata, not type discrimination. |
| Server-enforced order on `SignatureAttestation` events | The gateway verifies both are present (no time-order requirement); the issuance contract is "both present" not "PHA first then UMD" — order is operator-choice. |
| Ed25519 variants (Ed448, RSA-PSS) | Ed25519 is the v1 standard; rotation can come in v2 if WB procurement requires it. |
| Per-string locale tags on every Bangla string | Doubles payload size; locale lives at the container per dim 4 §15 + dim 6 §2.5; single allowed exception is `PublicNotice*.locale` because the consumer-message routing depends on it. |
| Per-string "severity" tags for chart axis hints | SensorReading carries `flags: Array<...>`; severity is server-derived (fusion score + tier), not wire-asserted. |
| Mixing chain private + chain public data in one event | The wire carries only what gets written to the chain. Projection-level redaction handles "private" data (per AD-16). |
| A separate "v1.5" envelope (deprecate v1 early) | AD-4 versioning is the v1 → v2 path; no deprecations planned in v1. |
| GraphQL / OData for projections | REST `/v1/projections/*` matches the existing stack choice and is simpler to cache. |

---

## 19. Amendment log

| Date | Action | Rationale |
|---|---|---|
| 2026-09-07 | Document created. 29 event types defined with discriminated-union payloads. Envelope base + HTTP/SSE/poll/IDB-wire transports locked. Sensor status state machine (5 states). Chain hash format = sha256(canonical) per spec-1-1. AD-11 3-step dual-signature wire flow documented. AD-17 character budget + rate limit + retraction precondition on wire. Locale-at-container enforced (single permitted `PublicNotice*.locale` exception). | Gate 0 dim 7 lockdown. |
| 2026-09-07 | §5.3.1 added — Phase 1 demo: SSE replaced by polling. MSW service worker cannot intercept EventSource, so Phase 1 uses the polling fallback (30s ± 10% jitter) which is the same code path production uses when SSE drops. Chain freshness clock (`/api/chain/head`) drives the SSE pulse animation every 5s. Chain-fail shake still demonstrable. No EventSource polyfill. Phase 2 swap = remove `pollOnly` flag, MSW deletes, real SSE gateway takes over with zero component code changes. | Phase 1 = frontend-only demo against MSW + IndexedDB. Locked wire shapes unchanged. |
