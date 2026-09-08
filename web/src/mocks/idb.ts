/**
 * idb.ts
 *
 * Phase 1 IndexedDB wrapper — 4 object stores per dim 6 §6.4:
 *
 *   chain_blocks   : audit-chain blocks (append-only)
 *   chain_head     : singleton row holding { hash: string, height: number }
 *   session        : actor identity row (login persona + ephemeral token)
 *   meta           : key-value metadata (seed_version, last_login_at, …)
 *
 * We use idb-keyval (3.3 KB minified) for simplicity. All keys are strings;
 * values are JSON-serialisable. Phase 1 deliberately does NOT use Dexie —
 * one store per concern is enough at this scale, and idb-keyval has zero
 * dependency tree to audit.
 *
 * Singleton-row pattern (`chain_head`, `session`):
 *   - stored under a fixed key (e.g. 'head', 'current')
 *   - read returns `undefined` if absent → handlers fall back to a default
 */

import { type UseStore, createStore, del, get, keys, set, values } from 'idb-keyval';

const DB_NAME = 'surakkha-mock';

function makeStore(name: string): UseStore {
  return createStore(DB_NAME, name);
}
const stores = {
  chain_blocks: makeStore('chain_blocks'),
  chain_head: makeStore('chain_head'),
  session: makeStore('session'),
  meta: makeStore('meta'),
};

// ───────────────────────────────────────────────────────── chain_blocks ──

export async function getAllBlocks() {
  return (values(stores.chain_blocks));
}
export async function getBlock(hash: string): Promise<ChainBlock | undefined> {
  return (get(hash, stores.chain_blocks));
}
export async function appendBlock(block: ChainBlock): Promise<void> {
  await set(block.block_hash, block, stores.chain_blocks);
}
// ───────────────────────────────────────────────────────── chain_head ─────
export interface ChainHead {
  block_hash: string;
  height: number;
  ingested_at: string;
}
export async function getChainHead(): Promise<ChainHead | undefined> {
  return (get('head', stores.chain_head));
}
export async function setChainHead(head: ChainHead): Promise<void> {
  await set('head', head, stores.chain_head);
}
// ───────────────────────────────────────────────────────── session ────────
export interface SessionRow {
  actor_id: string;
  actor_ref: string; // dim 7 ActorIdentity.ref — ULID
  display_name: string;
  role: string; // closed enum per dim 7 §2.5
  token: string; // opaque, server-minted in prod; mock mints locally
  logged_in_at: string;
  tenant_id: string;
  /**
   * Optional persona chip rendered in <TopChrome>. Stories 1.2 (Karim)
   * added this so the field-tech persona shows
   * "Karim · field tech · NE zone" instead of the raw display_name.
   * AppLayout falls back to display_name when unset.
   */
  chip_label?: string;
}
export async function getSession(): Promise<SessionRow | undefined> {
  return (get('current', stores.session));
}
export async function setSession(session: SessionRow): Promise<void> {
  await set('current', session, stores.session);
}
export async function clearSession(): Promise<void> {
  await del('current', stores.session);
}
// ───────────────────────────────────────────────────────── meta ────────────
export async function getMeta(key: string): Promise<unknown> {
  return get(key, stores.meta);
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await set(key, value, stores.meta);
}
// ───────────────────────────────────────────────────────── reset ───────────
/** Wipe the entire DB. Used by reset.ts on the demo "Reset mock data" button. */
export async function wipeAll(): Promise<void> {
  for (const store of Object.values(stores)) {
    const allKeys = await keys(store);

    await Promise.all(allKeys.map((k) => del(k, store)));
  }
}
// ───────────────────────────────────────────────────────── shared types ────
export interface ChainBlock {
  block_hash: string;
  height: number;
  prev_block_hash: string;
  tenant_id: string;
  schema_version: number;
  event_type: string;
  event_id: string;
  occurred_at: string;
  ingested_at: string;
  actor_identity: unknown;
  payload: unknown;
}
