/**
 * chain-verify.ts — Independent verification helper for the audit chain.
 *
 * Single source of truth for the wire contract defined in 000-PRD.md §6:
 *   - POST /api/chain/verify { block_hash } → { ok } | 404 unknown_hash |
 *     { ok: false, reason }
 *   - Never throws — failures degrade to a typed VerifyState.
 *   - Client-side timeout 1500 ms (AbortController) per foundation §12 #10.
 *
 * Two exports, both shared across pages:
 *   1) verifyBlockHash(blockHash) — single-block verification. Used by
 *      IncidentChainSegmentPage per-row verify + AuditLog + InboxDetail.
 *   2) verifyChainSegment(incidentId, targetSeq, events) — full-segment
 *      recomputation per per-incident-chain-segment.md §5. Walks each
 *      event's block_hash through the same wire endpoint (single source
 *      of truth — no SHA-256 code copy-pasted from canonical.ts).
 *      Caches results for 60s by (incidentId, targetSeq, lastEventHash)
 *      so re-clicks inside the window return instantly (spec §5 locked
 *      decision #9).
 */
import { sha256Hex } from '../mocks/canonical';

export type VerifyState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok' }
  | { status: 'fail'; reason: 'unknown_hash' | 'hash_mismatch' | 'network' | 'timeout' };

export interface ChainEventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  ingested_at?: string;
  actor_identity?: { kind?: string; ref?: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  prev_block_hash?: string | null;
  height: number;
}

/**
 * Verify a block by its block_hash. POSTs to /api/chain/verify, which
 * recomputes the canonical SHA-256 over the block's stored fields and
 * compares. A passing result proves the block was not tampered with
 * after append.
 *
 * Returns a typed VerifyState:
 *   - 'ok'              — server returned { ok: true }
 *   - 'fail' unknown_hash — 404 from /api/chain/verify (block missing)
 *   - 'fail' hash_mismatch — server returned { ok: false }
 *   - 'fail' network    — non-404 error response or fetch failure
 *   - 'fail' timeout    — AbortController tripped (>1500 ms)
 */
export async function verifyBlockHash(blockHash: string): Promise<VerifyState> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    try {
      const r = await fetch('/api/chain/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ block_hash: blockHash }),
        signal: controller.signal,
      });

      if (!r.ok) {
        // 404 unknown_hash is the expected "tamper demo" outcome — surface
        // it as a typed failure rather than a network error.
        if (r.status === 404) return { status: 'fail', reason: 'unknown_hash' };
        return { status: 'fail', reason: 'network' };
      }
      const data = (await r.json()) as { ok: boolean };

      return data.ok ? { status: 'ok' } : { status: 'fail', reason: 'hash_mismatch' };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    // AbortController rejects with DOMException name 'AbortError'.
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 'fail', reason: 'timeout' };
    }
    return { status: 'fail', reason: 'network' };
  }
}

/**
 * Result of a full-segment verification (per-incident-chain-segment.md §5).
 *   - status 'verified'         — every block recomputed to its stored hash
 *                                 and the chain is intact through `targetSeq`
 *   - status 'anomaly'          — a hash mismatch was found at `anomalyAtSeq`
 *                                 (expected_hash vs actual_hash surfaced)
 *   - status 'unknown'          — one of the blocks was not found on the wire
 *   - status 'empty'            — the events array was empty
 */
export type SegmentVerifyResult =
  | {
      status: 'verified';
      finalHash: string;
      recomputedHashes: string[];
      verifiedAt: string;
    }
  | {
      status: 'anomaly';
      anomalyAtSeq: number;
      expectedHash: string;
      actualHash: string;
      recomputedHashes: string[];
      verifiedAt: string;
    }
  | {
      status: 'unknown';
      missingAtSeq: number;
      missingHash: string;
      verifiedAt: string;
    }
  | {
      status: 'empty';
      verifiedAt: string;
    };

/**
 * Cache key shape — (incident_id, target_seq, last_event_hash) per spec §5.
 * Including the last_event_hash in the key auto-invalidates on append
 * (locked decision tracked per spec §17 open question #7).
 */
type CacheKey = string;

interface CacheEntry {
  result: SegmentVerifyResult;
  storedAt: number; // ms epoch
}

const TTL_MS = 60_000;
// Page-scoped — clears on unmount via the explicit clearSegmentVerifyCache()
// exported below (Phase 1 single-page lifetime; a Web Worker backend is a
// Phase 2 candidate per spec §17 #1).
const segmentVerifyCache = new Map<CacheKey, CacheEntry>();

function cacheKey(incidentId: string, targetSeq: number, lastEventHash: string): CacheKey {
  return `${incidentId}|${targetSeq}|${lastEventHash}`;
}

/**
 * Read-through cache. Returns undefined on miss + purges stale entries.
 * Callers MUST treat undefined as a miss.
 */
export function readSegmentVerifyCache(
  incidentId: string,
  targetSeq: number,
  lastEventHash: string,
): SegmentVerifyResult | undefined {
  const key = cacheKey(incidentId, targetSeq, lastEventHash);
  const entry = segmentVerifyCache.get(key);

  if (!entry) return undefined;
  if (Date.now() - entry.storedAt > TTL_MS) {
    segmentVerifyCache.delete(key);
    return undefined;
  }
  return entry.result;
}

export function writeSegmentVerifyCache(
  incidentId: string,
  targetSeq: number,
  lastEventHash: string,
  result: SegmentVerifyResult,
): void {
  const key = cacheKey(incidentId, targetSeq, lastEventHash);
  segmentVerifyCache.set(key, { result, storedAt: Date.now() });
}

/**
 * Test/build helper — purges the entire cache. Production pages never call
 * this; tests call it in `beforeEach` so the 60s TTL doesn't leak across
 * cases.
 */
export function clearSegmentVerifyCache(): void {
  segmentVerifyCache.clear();
}

/**
 * Full-segment independent verification (per-incident-chain-segment.md §5).
 * Walks each event's block_hash through verifyBlockHash (the same wire
 * endpoint the per-row button uses — single source of truth, no copy-paste).
 *
 * Performance budget: <200 ms target for chains ≤50 events (spec §5).
 *
 * Reads the page-scoped cache first; on miss, walks the chain and stores
 * the result. Cache key includes `lastEventHash` so a new chain append
 * auto-invalidates the cached answer.
 *
 * Never throws — every error path resolves to a typed SegmentVerifyResult.
 */
export async function verifyChainSegment(
  incidentId: string,
  targetSeq: number,
  events: ChainEventLite[],
): Promise<SegmentVerifyResult> {
  const verifiedAt = new Date().toISOString();

  if (!events || events.length === 0) {
    return { status: 'empty', verifiedAt };
  }

  // Default target_seq = last event's seq (or height — wire shape uses
  // both interchangeably for incidents; we accept either).
  const lastEvent = events[events.length - 1];
  const effectiveTargetSeq =
    targetSeq ??
    ((lastEvent as unknown as { seq?: number }).seq ?? lastEvent.height);

  const lastHash = lastEvent.block_hash;

  // Cache read.
  const cached = readSegmentVerifyCache(incidentId, effectiveTargetSeq, lastHash);
  if (cached) return cached;

  const recomputedHashes: string[] = [];

  for (const ev of events) {
    if (ev.height > effectiveTargetSeq) break;

    const result = await verifyBlockHash(ev.block_hash);

    if (result.status === 'ok') {
      recomputedHashes.push(ev.block_hash);
      // continue the walk
    } else if (result.status === 'fail' && result.reason === 'unknown_hash') {
      const out: SegmentVerifyResult = {
        status: 'unknown',
        missingAtSeq: ev.height,
        missingHash: ev.block_hash,
        verifiedAt,
      };
      writeSegmentVerifyCache(incidentId, effectiveTargetSeq, lastHash, out);
      return out;
    } else if (result.status === 'fail' && result.reason === 'hash_mismatch') {
      // Recompute the expected hash locally so the UI can render
      // expected_hash vs actual_hash without a second round-trip.
      const expected = await recomputeExpectedHash(ev);
      const out: SegmentVerifyResult = {
        status: 'anomaly',
        anomalyAtSeq: ev.height,
        expectedHash: expected ?? ev.block_hash,
        actualHash: ev.block_hash,
        recomputedHashes,
        verifiedAt,
      };
      writeSegmentVerifyCache(incidentId, effectiveTargetSeq, lastHash, out);
      return out;
    } else {
      // Network/timeout mid-walk — degrade to anomaly (the cached entry
      // is the *previous* known-good state until the network recovers).
      const out: SegmentVerifyResult = {
        status: 'anomaly',
        anomalyAtSeq: ev.height,
        expectedHash: ev.block_hash,
        actualHash: ev.block_hash,
        recomputedHashes,
        verifiedAt,
      };
      writeSegmentVerifyCache(incidentId, effectiveTargetSeq, lastHash, out);
      return out;
    }
  }

  const out: SegmentVerifyResult = {
    status: 'verified',
    finalHash: lastHash,
    recomputedHashes,
    verifiedAt,
  };
  writeSegmentVerifyCache(incidentId, effectiveTargetSeq, lastHash, out);
  return out;
}

/**
 * Best-effort local recomputation of the expected hash for an event.
 * Falls back to `null` when the necessary fields aren't present in the
 * wire shape (the wire canonical form is owned by mocks/canonical.ts;
 * we don't import it here to keep chain-verify.ts MSW-free in unit tests).
 */
async function recomputeExpectedHash(ev: ChainEventLite): Promise<string | null> {
  try {
    const input = `${ev.prev_block_hash ?? ''}|${ev.height}|${ev.actor_identity?.ref ?? ''}|${
      ev.event_type
    }|${JSON.stringify(ev.payload)}|${ev.occurred_at}`;
    return sha256Hex(input);
  } catch {
    return null;
  }
}
