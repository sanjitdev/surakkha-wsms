/**
 * reset.ts
 *
 * Phase 1 demo utilities — wipe the chain, reseed it, or tamper with one
 * block to demonstrate the chain-fail shake (dim 4 toast on hash mismatch).
 *
 * Wired into the demo UI:
 *   - Top-right "Demo controls" dropdown exposes:
 *       • Reset chain → wipeAll() + seedIfEmpty() + reload (or in-place re-seed)
 *       • Reseed chain → wipeAll() + seedIfEmpty() (clears user-added events)
 *       • Tamper block #5 → flip the 5th oldest block's hash to demonstrate
 *         /api/chain/head verification failure
 *
 * The tamper one is intentionally destructive — it lets stakeholders see
 * what the audit chain ACTUALLY detects. Use with care during demos.
 *
 * Production wiring (Phase 2) replaces these buttons with no-ops; the file
 * stays in the bundle but its exports are only invoked when VITE_USE_MOCKS=true.
 */

import { appendBlock, getAllBlocks, getChainHead, setChainHead, wipeAll } from './idb';
import { seedIfEmpty } from './fixtures';
import { ulid } from './canonical';

/** Clear everything (chain + session + meta) and reload the page. */
export async function resetEverything(): Promise<void> {
  await wipeAll();
  // Reload so all MSW-cached state (Auth, React Query cache) is cleared.
  window.location.reload();
}
/** Clear the chain only (keep session) and reseed genesis + 10 follow-on blocks. */
export async function reseedChain(): Promise<boolean> {
  // Wipe only chain_blocks + chain_head, leave session + meta alone.
  // But our wipeAll() does all four — so we save session first.
  const session = (await import('./idb')).getSession;
  const savedSession = await session();

  await wipeAll();
  if (savedSession) await (await import('./idb')).setSession(savedSession);
  return seedIfEmpty();
}
/**
 * Tamper with block N — flip a single character of its block_hash so the
 * chain head fails verification on next /api/chain/head fetch. The tamper
 * is at the storage layer; the mock re-emits a ChainVerificationFailed event
 * (dim 7 §13) on the next chain poll, which triggers the dim-4 toast.
 *
 * `blockIndex` is 0-based from genesis. Genesis (index 0) cannot be tampered
 * because the chain only verifies forward from the head; pass index >= 1.
 */
export async function tamperBlock(blockIndex: number = 1): Promise<{ block_hash: string } | null> {
  const all = await getAllBlocks();
  const sorted = all.sort((a, b) => a.height - b.height);
  const target = sorted[blockIndex];

  if (!target) return null;

  // Replace the block with a hash-mismatched twin at the same key — this
  // makes the verified head pointer's `next_block` traversal fail.
  const corrupted = {
    ...target,
    block_hash: `0x${'f'.repeat(64)}`, // obvious corruption
  };

  await appendBlock(corrupted);
  // Re-establish head to the corrupted block so the next /chain/head fetch
  // returns it. (Production would NOT do this — the gateway would refuse to
  // advance. The mock simulates the operator-UI state where the head
  // reflects the corrupted pointer.)
  await setChainHead({
    block_hash: corrupted.block_hash,
    height: target.height,
    ingested_at: corrupted.ingested_at,
  });
  return { block_hash: corrupted.block_hash };
}
/** Emit a fresh ChainVerificationFailed event (separate from tamperBlock
 * — useful for triggering the demo toast without modifying storage). */
export async function simulateChainVerificationFailed(
  reason: string = 'tamper-detected',
): Promise<void> {
  const head = await getChainHead();

  if (!head) return;
  const event_id = ulid();
  const occurred_at = new Date().toISOString();
  const ingested_at = new Date().toISOString();

  // We just record it inline without recomputing the hash for the chain
  // extension — the demo only needs the toast to fire. In production, the
  // gateway would refuse to advance past a failed-verification point.
  await appendBlock({
    block_hash: `0x${Math.floor(Math.random() * 1e16)
      .toString(16)
      .padStart(16, '0')
      .repeat(4)
      .slice(0, 64)}`,
    height: head.height + 1,
    prev_block_hash: head.block_hash,
    tenant_id: 'dhaka',
    schema_version: 1,
    event_type: 'ChainVerificationFailed',
    event_id,
    occurred_at,
    ingested_at,
    actor_identity: { kind: 'system', ref: 'monitor', display: 'chain monitor' },
    payload: {
      failing_block_height: head.height,
      reason,
    },
  });
}
/** Demo-controls button labels — pure presentational. */
export const DEMO_CONTROLS = [
  { id: 'reset', label: 'Reset everything', action: resetEverything, kind: 'destructive' },
  { id: 'reseed', label: 'Reseed chain', action: reseedChain, kind: 'safe' },
  { id: 'tamper', label: 'Tamper block #5', action: () => tamperBlock(5), kind: 'warning' },
  {
    id: 'fail',
    label: 'Simulate chain failure',
    action: () => simulateChainVerificationFailed(),
    kind: 'warning',
  },
] as const;
