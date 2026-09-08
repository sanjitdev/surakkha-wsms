/**
 * canonical.ts
 *
 * Phase 1 mock helpers — port of spec-1-1 canonical_json + sha256 chain hash.
 * Implements exactly what the production gateway computes (dim 7 §6 + SPEC
 * Consistency Conventions "Chain hash computation"). Used by fixtures.ts and
 * handlers.ts to keep the append-only chain *content-addressed* in IndexedDB
 * so the demo can show the chain-fail shake (dim 4 toast on hash mismatch)
 * with the same wire shapes production will use.
 *
 * SPEC-1-1 RULE: canonical_json = sorted keys, no whitespace, stable UTF-8.
 * This is the only correct way to compute block_hash — any deviation from
 * sorted-keys + no-whitespace + UTF-8 produces a different hash and the
 * chain breaks. Phase 1 MUST match production; do not "simplify".
 */

/** Sort object keys recursively (RFC 8785 JSON Canonicalization Scheme — JCS-lite). */
function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj).sort()) out[k] = sortKeys(obj[k]);
  return out;
}

/** Stable JSON.stringify with sorted keys, no whitespace. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/** SHA-256 hex (lowercase, 64 chars). */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * blockHash — exact field set + ordering per dim 7 §6.
 * Field set is fixed: adding a field (or reordering) changes every downstream
 * hash, breaking the chain. If dim 7 §6 ever changes, this is the place.
 */
export async function blockHash(input: {
  prev_block_hash: string | null;
  tenant_id: string;
  schema_version: number;
  event_type: string;
  event_id: string;
  occurred_at: string;
  ingested_at: string;
  actor_identity: unknown;
  payload: unknown;
}): Promise<string> {
  const canonical = canonicalJson({
    prev_block_hash: input.prev_block_hash,
    tenant_id: input.tenant_id,
    schema_version: input.schema_version,
    event_type: input.event_type,
    event_id: input.event_id,
    occurred_at: input.occurred_at,
    ingested_at: input.ingested_at,
    actor_identity: input.actor_identity,
    payload: input.payload,
  });
  return sha256Hex(canonical);
}

/**
 * ULID minting — 26-char Crockford base32, lexicographically sortable.
 * 48 bits time (ms) + 80 bits randomness. Matches spec-1-1 ULID choice.
 *
 * Uses crypto.getRandomValues for the 80-bit random component.
 * Avoids `ulid` package to keep Phase 1 zero non-essential deps.
 */
const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford (no I, L, O, U)

function encodeTime(now: number, len: number): string {
  let out = '';
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % 32;
    out = ULID_ALPHABET[mod] + out;
    now = (now - mod) / 32;
  }
  return out;
}

function encodeRandom(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += ULID_ALPHABET[bytes[i] % 32];
  return out;
}

/** Mints a fresh ULID. Monotonic-unsafe (single browser tab) — fine for Phase 1. */
export function ulid(now: number = Date.now()): string {
  return encodeTime(now, 10) + encodeRandom(16);
}

/**
 * Genesis block sentinel — the very first block has prev_block_hash = null.
 * Genesis hash is sha256(canonical({ ...all fields, prev_block_hash: null })).
 * Returned as the literal "0x" + 64 hex chars per dim 7 §6 wire form.
 */
export const GENESIS_PREV_HASH = '0x' + '0'.repeat(64);
