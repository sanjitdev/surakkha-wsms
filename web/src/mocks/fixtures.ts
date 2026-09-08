/**
 * fixtures.ts
 *
 * Phase 1 seed dataset — exercises the chain by pre-populating IndexedDB
 * with one genesis block + ~12 follow-on blocks across the 6 most-exercised
 * event types. Used on first launch only (idempotent: checks meta.seed_version
 * before re-seeding; bump the version to force re-seed on schema change).
 *
 * IMPORTANT: every block here is hashed through `blockHash()` (canonical.ts)
 * so the demo can show the chain-fail shake (dim 4 toast) by deliberately
 * corrupting one block via reset.ts → tamper().
 *
 * Seed event types covered (out of 29 in dim 7 §3):
 *   - SensorReadingSubmitted × 5      (one sensor, last 6 hours)
 *   - SensorSilenceObserved × 1
 *   - AnjaliReportSubmitted × 1
 *   - IncidentCreated × 1
 *   - IncidentEscalated × 1
 *   - PlaybookStepExecuted × 1
 *   - PublicNoticeIssued × 1
 *   - SignatureAttestation × 1        (one half of AD-11 dual-sig pair)
 *   - OperatorAuthenticated × 1       (login event)
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

const SEED_VERSION = 1;
const TENANT = 'dhaka';
const SCHEMA_VERSION = 1;

const NOW = () => new Date().toISOString();

const ACTORS = {
  sensor: { kind: 'system', ref: '01J0SENSOR00000000000000000', display: 'sensor-fleet' },
  anjali: { kind: 'citizen', ref: '01J0ANJALI00000000000000000', display: 'anjali@example.com' },
  priya: { kind: 'operator', ref: '01J0PRIYA000000000000000000', display: 'Priya (utility operator)' },
  pha: { kind: 'pha', ref: '01J0PHA000000000000000000000', display: 'Dr. Karim (PHA approver)' },
  vendor: { kind: 'vendor', ref: '01J0VENDOR000000000000000000', display: 'Acme Sensors' },
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
