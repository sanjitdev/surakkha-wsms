/**
 * fixtures.ts
 *
 * Phase 1 seed dataset — exercises the chain by pre-populating IndexedDB
 * with one genesis block + ~17 follow-on blocks across the most-exercised
 * event types. Used on first launch only (idempotent: checks meta.seed_version
 * before re-seeding; bump the version to force re-seed on schema change).
 *
 * IMPORTANT: every block here is hashed through `blockHash()` (canonical.ts)
 * so the demo can show the chain-fail shake (dim 4 toast) by deliberately
 * corrupting one block via reset.ts → tamper().
 *
 * Seed event types covered (out of 33 in dim 7 §3 — 2026-09-08 amendment):
 *   - SensorReadingSubmitted × 5      (one sensor, last 6 hours)
 *   - SensorSilenceObserved × 1
 *   - AnjaliReportSubmitted × 1
 *   - IncidentCreated × 1
 *   - IncidentEscalated × 1
 *   - PlaybookStepExecuted × 1
 *   - PublicNoticeIssued × 1
 *   - SignatureAttestation × 1        (one half of AD-11 dual-sig pair)
 *   - OperatorAuthenticated × 1       (login event)
 *   - TechnicianAssigned × 1          (Story 1.2 — Karim dispatched)
 *   - TechnicianArrived × 1           (Story 1.2)
 *   - DiagnosisSubmitted × 1          (Story 1.2)
 *   - FixSubmitted × 1                (Story 1.2)
 *   - IncidentResolved × 1            (Story 1.2 — by Karim)
 *
 * Time anchoring: all timestamps are relative to Date.now() so the seed
 * always looks "fresh" regardless of when the demo is opened.
 */

import { ulid, blockHash, GENESIS_PREV_HASH } from './canonical';
import {
  appendBlock,
  setChainHead,
  setMeta,
  getMeta,
  type ChainBlock,
} from './idb';

const SEED_VERSION = 3;
const TENANT = 'dhaka';
const SCHEMA_VERSION = 1;

const NOW = () => new Date().toISOString();

const ACTORS = {
  sensor: { kind: 'system', ref: '01J0SENSOR00000000000000000', display: 'sensor-fleet' },
  anjali: { kind: 'citizen', ref: '01J0ANJALI00000000000000000', display: 'anjali@example.com' },
  priya: { kind: 'operator', ref: '01J0PRIYA000000000000000000', display: 'Priya (utility operator)' },
  pha: { kind: 'pha', ref: '01J0PHA000000000000000000000', display: 'Dr. Karim (PHA approver)' },
  vendor: { kind: 'vendor', ref: '01J0VENDOR000000000000000000', display: 'Acme Sensors' },
  // Story 1.2 — Field Technician. Per dim 7 amendment 2026-09-08, the
  // technician is `actor_identity` on the chain events he writes. His
  // `actor_ref` matches the SessionRow.actor_ref minted at login time.
  karim: { kind: 'technician', ref: '01J0KARIM0000000000000000000', display: 'Karim (field tech · NE zone)' },
};

/** Seed only when meta.seed_version is missing or stale. */
export async function seedIfEmpty(): Promise<boolean> {
  const current = await getMeta('seed_version');
  if (current === SEED_VERSION) return false;

  const t0 = Date.now();
  let prevHash: string | null = null;
  let height = 0;

  // ── block 0: genesis ──────────────────────────────────────────────────
  const genesis: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'SchemaVersionBumped',
    event_id: ulid(t0),
    occurred_at: NOW(),
    actor_identity: ACTORS.system,
    payload: { from: 0, to: SCHEMA_VERSION, reason: 'genesis' },
  });
  await write(genesis);
  prevHash = genesis.block_hash;
  height = 1;

  // ── 5 sensor readings (one sensor, 6h apart, last reading 5 min ago) ──
  const sensorId = '01J0SENSOR0WARD0000000000000A';
  for (let i = 0; i < 5; i++) {
    const t = t0 - (5 - i) * 90 * 60 * 1000;  // 90 min apart, 5..1
    const value = 7.2 + i * 0.1;              // gentle upward drift
    const block: ChainBlock = await buildBlock({
      prev_block_hash: prevHash,
      event_type: 'SensorReadingSubmitted',
      event_id: ulid(t),
      occurred_at: new Date(t).toISOString(),
      actor_identity: ACTORS.sensor,
      payload: {
        sensor_id: sensorId,
        ward_id: 'ward-dhanmondi',
        parameter: 'pH',
        value,
        unit: 'pH',
        captured_at: new Date(t).toISOString(),
        ingestion_window_id: `iw-${Math.floor(t / 900000)}`,
      },
    });
    await write(block);
    prevHash = block.block_hash;
    height++;
  }

  // ── sensor silence observed ───────────────────────────────────────────
  const silence: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'SensorSilenceObserved',
    event_id: ulid(t0 + 1000),
    occurred_at: NOW(),
    actor_identity: ACTORS.system,
    payload: {
      sensor_id: sensorId,
      expected_period_seconds: 300,
      last_reading_at: new Date(t0 - 8 * 60 * 1000).toISOString(),
    },
  });
  await write(silence);
  prevHash = silence.block_hash;
  height++;

  // ── anjali report ────────────────────────────────────────────────────
  const anjaliReport: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'AnjaliReportSubmitted',
    event_id: ulid(t0 + 2000),
    occurred_at: NOW(),
    actor_identity: ACTORS.anjali,
    payload: {
      report_id: ulid(t0 + 2001),
      submitted_via: 'sms',
      from_e164: '+8801700000001',
      ward_id: 'ward-dhanmondi',
      category: 'taste_change',
      description: 'Water tastes metallic this morning.',
      captured_at: NOW(),
    },
  });
  await write(anjaliReport);
  prevHash = anjaliReport.block_hash;
  height++;

  // ── incident created from the anjali report ───────────────────────────
  const incident: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'IncidentCreated',
    event_id: ulid(t0 + 3000),
    occurred_at: NOW(),
    actor_identity: ACTORS.priya,
    payload: {
      incident_id: ulid(t0 + 3001),
      correlation_id: anjaliReport.event_id,
      ward_id: 'ward-dhanmondi',
      severity: 'medium',
      source: 'AnjaliReport',
      sensor_snapshot: [
        { sensor_id: sensorId, parameter: 'pH', value: 7.6, band: 'medium' },
      ],
    },
  });
  await write(incident);
  prevHash = incident.block_hash;
  height++;

  // ── incident escalated ───────────────────────────────────────────────
  const escalated: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'IncidentEscalated',
    event_id: ulid(t0 + 4000),
    occurred_at: NOW(),
    actor_identity: ACTORS.priya,
    payload: {
      incident_id: incident.payload.incident_id,
      from_severity: 'medium',
      to_severity: 'high',
      reason: 'Cluster shows 3+ sensors drifting upward simultaneously.',
    },
  });
  await write(escalated);
  prevHash = escalated.block_hash;
  height++;

  // ── playbook step executed ───────────────────────────────────────────
  const playbookStep: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'PlaybookStepExecuted',
    event_id: ulid(t0 + 5000),
    occurred_at: NOW(),
    actor_identity: ACTORS.priya,
    payload: {
      playbook_version_id: '01J0PLAYBOOKVERSION00000000A',
      step_id: 'flush-hydrant-line',
      incident_id: incident.payload.incident_id,
      notes: 'Flushed hydrant line 12 for 8 minutes; pH trending down.',
    },
  });
  await write(playbookStep);
  prevHash = playbookStep.block_hash;
  height++;

  // ── public notice issued (will require dual-sig in production) ────────
  const notice: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'PublicNoticeIssued',
    event_id: ulid(t0 + 6000),
    occurred_at: NOW(),
    actor_identity: ACTORS.priya,
    payload: {
      notice_id: ulid(t0 + 6001),
      incident_id: incident.payload.incident_id,
      locale: 'bn',
      character_count: 138,
      channel_targets: ['sms', 'whatsapp', 'local-radio'],
      attestation_event_ids: [],  // production: [phasingULID, messageDeskULID]
      body_summary: 'Ward dhanmondi — flush taps before use until noon.',
    },
  });
  await write(notice);
  prevHash = notice.block_hash;
  height++;

  // ── signature attestation (one half of dual-sig) ─────────────────────
  const attestation: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'SignatureAttestation',
    event_id: ulid(t0 + 7000),
    occurred_at: NOW(),
    actor_identity: ACTORS.pha,
    payload: {
      attestation_id: ulid(t0 + 7001),
      attesting_event_id: notice.event_id,
      attesting_event_type: 'PublicNoticeIssued',
      payload_hash: 'mock-hash-not-checked-in-phase-1',
      version_id: 'v1',
      signature: 'mock-sig-placeholder',
    },
  });
  await write(attestation);
  prevHash = attestation.block_hash;
  height++;

  // ── operator authenticated ───────────────────────────────────────────
  const login: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'OperatorAuthenticated',
    event_id: ulid(t0 + 8000),
    occurred_at: NOW(),
    actor_identity: ACTORS.priya,
    payload: {
      session_id: ulid(t0 + 8001),
      auth_method: 'password',
      client_kind: 'web',
    },
  });
  await write(login);
  prevHash = login.block_hash;
  height++;

  // ── Story 1.2 — field-tech side events ───────────────────────────────
  // Karim is dispatched, arrives, files diagnosis + fix, and resolves the
  // incident. All 5 events use ACTORS.karim as `actor_identity` (per dim 7
  // amendment 2026-09-08). The `incident_id` here reuses the dhanmondi
  // incident created earlier in this seed, so the chain tells a complete
  // story (incident → escalation → notice → fix → resolved).

  const technicianId = ACTORS.karim.ref;
  const incidentId = incident.payload.incident_id;
  const workOrderEventId = ulid(t0 + 9000);

  const techAssigned: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'TechnicianAssigned',
    event_id: ulid(t0 + 9001),
    occurred_at: new Date(t0 + 5 * 60 * 1000).toISOString(),
    actor_identity: ACTORS.karim,
    payload: {
      technician_id: technicianId,
      incident_id: incidentId,
      priority: 'P1',
      eta_target_minutes: 15,
      work_order_summary: 'Ward dhanmondi — chlorination drift, flush + recalibrate.',
      work_order_payload_hash: 'mock-wo-hash-not-checked-in-phase-1',
      correlation_id: escalated.event_id,
      work_order_event_id: workOrderEventId,
    },
  });
  await write(techAssigned);
  prevHash = techAssigned.block_hash;
  height++;

  const techArrived: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'TechnicianArrived',
    event_id: ulid(t0 + 10000),
    occurred_at: new Date(t0 + 13 * 60 * 1000).toISOString(),
    actor_identity: ACTORS.karim,
    payload: {
      technician_id: technicianId,
      incident_id: incidentId,
      arrived_at: new Date(t0 + 13 * 60 * 1000).toISOString(),
      gps_sha256: 'mock-gps-sha256-dhanmondi-pump-station',
      device_actor_ref: technicianId,
      correlation_id: techAssigned.event_id,
    },
  });
  await write(techArrived);
  prevHash = techArrived.block_hash;
  height++;

  const diagnosis: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'DiagnosisSubmitted',
    event_id: ulid(t0 + 11000),
    occurred_at: new Date(t0 + 18 * 60 * 1000).toISOString(),
    actor_identity: ACTORS.karim,
    payload: {
      technician_id: technicianId,
      incident_id: incidentId,
      diagnosis_text: 'Stuck chlorinator solenoid — flow regulator not opening under load.',
      diagnosis_payload_hash: 'mock-diag-hash-not-checked-in-phase-1',
      photo_sha256_hashes: ['mock-photo-broken-seal-sha256'],
      diagnosis_class: 'hardware',
      correlation_id: techArrived.event_id,
    },
  });
  await write(diagnosis);
  prevHash = diagnosis.block_hash;
  height++;

  const fix: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'FixSubmitted',
    event_id: ulid(t0 + 12000),
    occurred_at: new Date(t0 + 25 * 60 * 1000).toISOString(),
    actor_identity: ACTORS.karim,
    payload: {
      technician_id: technicianId,
      incident_id: incidentId,
      fix_summary: 'Replaced solenoid (part CH-22-04). Flow back to nominal 0.6 mg/L.',
      fix_payload_hash: 'mock-fix-hash-not-checked-in-phase-1',
      before_photo_sha256: 'mock-photo-broken-seal-sha256',
      after_photo_sha256: 'mock-photo-resealed-sha256',
      parts_replaced: [
        { sku: 'CH-22-04', serial: 'sn-94a1-2626', reason: 'broken' },
      ],
      signature_algorithm: 'ed25519',
      signature: 'mock-sig-placeholder',
      correlation_id: diagnosis.event_id,
    },
  });
  await write(fix);
  prevHash = fix.block_hash;
  height++;

  const resolved: ChainBlock = await buildBlock({
    prev_block_hash: prevHash,
    event_type: 'IncidentResolved',
    event_id: ulid(t0 + 13000),
    occurred_at: new Date(t0 + 27 * 60 * 1000).toISOString(),
    actor_identity: ACTORS.karim,
    payload: {
      incident_id: incidentId,
      technician_id: technicianId,
      fix_summary: 'Solenoid swap verified — pH stable at 7.1 since 09:30, no leaks.',
      fix_summary_payload_hash: 'mock-fix-summary-hash-not-checked-in-phase-1',
      after_photo_sha256: 'mock-photo-resealed-sha256',
      before_photo_sha256: 'mock-photo-broken-seal-sha256',
      resolution_latency_seconds: 22 * 60,  // arrived 13min after dispatch, closed 22min later
      correlation_id: fix.event_id,
      causation_id: fix.event_id,
    },
  });
  await write(resolved);
  prevHash = resolved.block_hash;
  height++;

  // ── FE-1.5b — 7 inbox-row fixtures (one per mockup row) ──────────────
  // Each IncidentCreated payload embeds the inbox-row fields the page's
  // useEffect parser needs: incident_id, severity, ward + sensor_id (→ where),
  // owner_role / owner_display (→ owner), status (→ pill caption + chip
  // mapping), href (→ row + trailing action target), summary (→ title +
  // meta), occurred_at (→ timestamp), read (→ muted styling). Actor kind
  // diverges per row (operator vs technician vs citizen vs system vs vendor)
  // so the right-rail severity counts and the filter-chip "Awaiting sigs"
  // count derive correctly from the kind:actor ref.
  type InboxFixture = {
    severity: 'high' | 'medium' | 'low' | 'none';
    ward: string;
    sensor_id: string;
    owner_kind: 'operator' | 'technician' | 'citizen' | 'system' | 'vendor';
    owner_ref: string;
    owner_display: string;
    status: 'awaiting_ack' | 'awaiting_sig' | 'awaiting_draft' | 'citizen_report' | 'chain_verify' | 'info';
    href: string;
    title: string;
    summary: string;
    occurred_at: string;
    isUrgent: boolean;
    isDraft: boolean;
    isCitizen: boolean;
    isAwaitingSig: boolean;
  };
  const inboxFixtures: InboxFixture[] = [
    {
      severity: 'high',
      ward: 'ward-07',
      sensor_id: 'SN-2208',
      owner_kind: 'operator',
      owner_ref: ACTORS.priya.ref,
      owner_display: 'Priya',
      status: 'awaiting_ack',
      href: '/inbox-detail',
      title: 'Ward 7 chlorination spike',
      summary: 'citizen-ack request sent · Anjali (reporter) · SN-2208 silent 8 min',
      occurred_at: new Date(t0 - 12 * 60 * 1000).toISOString(),
      isUrgent: true,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: true,
    },
    {
      severity: 'medium',
      ward: 'ward-05',
      sensor_id: 'SN-3301',
      owner_kind: 'citizen',
      owner_ref: ACTORS.anjali.ref,
      owner_display: 'Babul',
      status: 'awaiting_ack',
      href: '/inbox-detail',
      title: 'Ward 5 lead-leach chronic',
      summary: '8-day trend · awaiting citizen ack from Babul (reporter)',
      occurred_at: new Date(t0 - 30 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: false,
    },
    {
      severity: 'medium',
      ward: 'ward-03',
      sensor_id: 'SN-1142',
      owner_kind: 'technician',
      owner_ref: ACTORS.karim.ref,
      owner_display: 'Ramesh',
      status: 'awaiting_sig',
      href: '/inbox-detail',
      title: 'Ward 3 pH drift correction',
      summary: 'Ramesh (tech) on site · diagnosis + fix in progress',
      occurred_at: new Date(t0 - 65 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: true,
    },
    {
      severity: 'medium',
      ward: 'ward-12',
      sensor_id: 'SN-4407',
      owner_kind: 'operator',
      owner_ref: ACTORS.priya.ref,
      owner_display: 'Priya',
      status: 'awaiting_draft',
      href: '/inbox-detail',
      title: 'Ward 12 pH drift — advisory',
      summary: 'Draft by Priya · 2 d ago · not yet sent',
      occurred_at: new Date(t0 - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: true,
      isCitizen: false,
      isAwaitingSig: false,
    },
    {
      severity: 'low',
      ward: 'ward-09',
      sensor_id: 'SN-5503',
      owner_kind: 'citizen',
      owner_ref: ACTORS.anjali.ref,
      owner_display: 'Anjali',
      status: 'citizen_report',
      href: '/inbox-detail',
      title: 'Citizen report — discoloured water',
      summary: 'Reported by Anjali (citizen) · 2 photos attached',
      occurred_at: new Date(t0 - 3 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: false,
      isCitizen: true,
      isAwaitingSig: false,
    },
    {
      severity: 'low',
      ward: 'block-12',
      sensor_id: 'system',
      owner_kind: 'system',
      owner_ref: ACTORS.sensor.ref,
      owner_display: 'System',
      status: 'chain_verify',
      href: '/verify-flow',
      title: 'Chain verification failed',
      summary: 'Block #12 · auto-flagged · sensor batch hash mismatch',
      occurred_at: new Date(t0 - 4 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: false,
    },
    {
      severity: 'none',
      ward: 'ward-12',
      sensor_id: 'SN-4407',
      owner_kind: 'vendor',
      owner_ref: ACTORS.vendor.ref,
      owner_display: 'Acme',
      status: 'info',
      href: '/sensors',
      title: 'Ward 12 cal. due in 14 days',
      summary: 'Scheduled maintenance · no action required',
      occurred_at: new Date(t0 - 8 * 60 * 60 * 1000).toISOString(),
      isUrgent: false,
      isDraft: false,
      isCitizen: false,
      isAwaitingSig: false,
    },
  ];
  for (const f of inboxFixtures) {
    const ev: ChainBlock = await buildBlock({
      prev_block_hash: prevHash,
      event_type: 'IncidentCreated',
      event_id: ulid(t0 + 14000 + inboxFixtures.indexOf(f)),
      occurred_at: f.occurred_at,
      actor_identity: { kind: f.owner_kind, ref: f.owner_ref, display: f.owner_display },
      payload: {
        incident_id: ulid(t0 + 14000 + inboxFixtures.indexOf(f) + 1),
        severity: f.severity,
        ward_id: f.ward,
        source: 'sensor',
        sensor_snapshot: [{ sensor_id: f.sensor_id, parameter: 'pH', value: 7.4 }],
        // inbox-row extensions (the page's useEffect parser reads these)
        inbox: {
          owner_kind: f.owner_kind,
          owner_display: f.owner_display,
          status: f.status,
          href: f.href,
          title: f.title,
          summary: f.summary,
          isUrgent: f.isUrgent,
          isDraft: f.isDraft,
          isCitizen: f.isCitizen,
          isAwaitingSig: f.isAwaitingSig,
          read: false,
        },
      },
    });
    await write(ev);
    prevHash = ev.block_hash;
    height++;
  }

  // ── chain head + meta ────────────────────────────────────────────────
  await setChainHead({
    block_hash: prevHash!,
    height,
    ingested_at: NOW(),
  });
  await setMeta('seed_version', SEED_VERSION);
  await setMeta('seeded_at', NOW());

  return true;
}

// ───────────────────────────────────────────────────────── helpers ───────

async function buildBlock(input: {
  prev_block_hash: string | null;
  event_type: string;
  event_id: string;
  occurred_at: string;
  actor_identity: unknown;
  payload: unknown;
}): Promise<ChainBlock> {
  const ingested_at = new Date().toISOString();
  const block_hash = await blockHash({
    prev_block_hash: input.prev_block_hash ?? GENESIS_PREV_HASH,
    tenant_id: TENANT,
    schema_version: SCHEMA_VERSION,
    event_type: input.event_type,
    event_id: input.event_id,
    occurred_at: input.occurred_at,
    ingested_at,
    actor_identity: input.actor_identity,
    payload: input.payload,
  });
  return {
    block_hash,
    height: 0, // set by caller via write()
    prev_block_hash: input.prev_block_hash ?? GENESIS_PREV_HASH,
    tenant_id: TENANT,
    schema_version: SCHEMA_VERSION,
    event_type: input.event_type,
    event_id: input.event_id,
    occurred_at: input.occurred_at,
    ingested_at,
    actor_identity: input.actor_identity,
    payload: input.payload,
  };
}

async function write(block: ChainBlock): Promise<void> {
  const head = await import('./idb').then((m) => m.getChainHead());
  block.height = (head?.height ?? 0) + 1;
  await appendBlock(block);
  await setChainHead({
    block_hash: block.block_hash,
    height: block.height,
    ingested_at: block.ingested_at,
  });
}
