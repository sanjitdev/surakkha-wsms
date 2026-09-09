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
 * We use idb-keyval (3.3 KB minified) for the put/get/del/keys/values
 * primitives, but we DO NOT use its `createStore()` helper — it opens
 * the DB without specifying a version, so `onupgradeneeded` only fires
 * the first time. With multiple stores in one DB, that means the first
 * store to be opened creates the DB (creating ONLY itself), and every
 * subsequent store silently fails because the DB already exists and no
 * upgrade runs. The third-party doc examples sidestep this by using
 * separate DBs per concern.
 *
 * We instead open the DB once at a known version with all 4 stores
 * pre-declared in `onupgradeneeded`. From there idb-keyval's primitives
 * work unchanged — they just receive a shared `UseStore` factory bound
 * to the right object store inside the existing DB.
 *
 * Phase 1 deliberately does NOT use Dexie — one store per concern is
 * enough at this scale, and idb-keyval has zero dependency tree to audit.
 */

import { type UseStore, del, get, keys, set, values } from 'idb-keyval';

const DB_NAME = 'surakkha-mock';
/**
 * DB schema version.
 *
 *   v1 — original idb-keyval `createStore()` flow, which only ever created
 *        a single store per DB on first run. Subsequent stores for the
 *        same DB silently never materialised, so writes to `session`
 *        failed with "object store not found" on first login.
 *   v2 — we open the DB explicitly and declare all 4 stores in
 *        `onupgradeneeded`. Bumping from 1 → 2 triggers `onupgradeneeded`
 *        on existing dev DBs (which usually only have `chain_blocks`)
 *        and adds the missing three. The conditional `contains()` check
 *        is idempotent — clean installs skip the upgrade entirely.
 */
const DB_VERSION = 2;
const STORE_NAMES = ['chain_blocks', 'chain_head', 'session', 'meta'] as const;

type StoreName = (typeof STORE_NAMES)[number];

/**
 * Open the shared DB once per page, pre-declaring every object store.
 *
 * Returns a Promise that resolves with the `IDBDatabase` handle. Subsequent
 * calls return the same handle (idb-keyval's `UseStore` pattern caches the
 * connection internally).
 *
 * Why this matters: see the file header. Without an explicit version +
 * `onupgradeneeded`, only one store ever exists in the DB, and the other
 * stores throw "object store not found" the first time they're written to.
 */
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      for (const name of STORE_NAMES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };
    req.onsuccess = () => {
      // If the connection closes (Safari, quota eviction), reset so the next
      // caller reopens. Mirrors the behaviour of idb-keyval's own wrapper.
      req.result.onclose = () => {
        dbPromise = null;
      };
      resolve(req.result);
    };
    req.onerror = () => {
      dbPromise = null;
      const err = req.error ?? new Error(`IndexedDB open failed for ${DB_NAME}`);

      reject(err instanceof Error ? err : new Error(String(err)));
    };
    req.onblocked = () => {
      // Another tab holds the DB at an older version. Surface a clear error
      // rather than letting writes silently fail later.
      dbPromise = null;
      reject(new Error(`IndexedDB open blocked for ${DB_NAME}`));
    };
  });
  return dbPromise;
}
/**
 * Build a `UseStore` (idb-keyval's callback signature) bound to the named
 * object store in the shared DB. Mirrors `createStore(dbName, storeName)`
 * from idb-keyval but uses our pre-declared multi-store DB.
 */
function makeStore(storeName: StoreName): UseStore {
  return async (txMode, callback) => {
    const db = await openDb();

    return callback(db.transaction(storeName, txMode).objectStore(storeName));
  };
}
const stores: Record<StoreName, UseStore> = {
  chain_blocks: makeStore('chain_blocks'),
  chain_head: makeStore('chain_head'),
  session: makeStore('session'),
  meta: makeStore('meta'),
};

// ───────────────────────────────────────────────────────── chain_blocks ──

export async function getAllBlocks() {
  return values(stores.chain_blocks);
}
export async function getBlock(hash: string): Promise<ChainBlock | undefined> {
  return get(hash, stores.chain_blocks);
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
  return get('head', stores.chain_head);
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
  return get('current', stores.session);
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
