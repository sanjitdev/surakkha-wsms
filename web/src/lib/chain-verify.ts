/**
 * chain-verify.ts — Independent single-block hash verification helper.
 *
 * Promoted from `pages/AuditLog.tsx` (Batch 3 — audit-log.md #13) so both
 * the audit log and the inbox detail (inbox-detail.md #16) can share the
 * same verification logic without copy-paste. Future Tier 1 chain-segment
 * page (per-incident-chain-segment.md) will also import this helper.
 *
 * Per foundation §12 #10: verification completes in <200 ms (mock), with
 * a 1500 ms client-side abort timeout. Never throws — failures degrade
 * gracefully so the calling component renders a stable shape.
 */
export type VerifyState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok' }
  | { status: 'fail'; reason: 'unknown_hash' | 'hash_mismatch' | 'network' | 'timeout' };

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
