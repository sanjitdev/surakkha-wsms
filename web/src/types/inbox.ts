/**
 * inbox.ts — FE-1.5b + FE-1.3a.
 *
 * Domain types for the Priya inbox-list surface. Mirrors dim 6 §4.2
 * (`InboxRow`) with one extension: `severity` (T3|T2|T1|T0) drives the
 * row-level pill colour and is decoded from `IncidentCreated.payload.severity`
 * by the page's `useEffect` parser. The `Band` enum in `domain.ts` uses
 * three entries (high/medium/low); the inbox needs four tiers so we keep
 * the severity union local to this surface (the page maps severity → Band
 * at render time if a BandPill is needed).
 *
 * `InboxRowFilter` is the closed set of chip filters the page supports.
 * Both unions are exported so the page and the FilterChip primitive can
 * import them without dragging in React.
 */

import type { ReporterKind } from './domain';

export type IncidentSeverity = 'T3' | 'T2' | 'T1' | 'T0';
export type InboxRowFilter = 'all' | 'T3' | 'sig' | 'drafts' | 'citizen' | 'resolved';
export type InboxRowStatus =
  'awaiting_ack' | 'awaiting_sig' | 'awaiting_draft' | 'citizen_report' | 'chain_verify' | 'info';
export type EvidenceFlag = 'photo' | 'gps' | 'description';
export interface InboxRowAction {
  label: string;
  href: string;
}
export interface InboxRow {
  id: string;
  severity: IncidentSeverity;
  title: string;
  meta: string;
  where: string;
  whereSub: string;
  ownerName: string;
  ownerKind: 'priya' | 'reporter' | 'tech' | 'system' | 'vendor';
  status: InboxRowStatus;
  reporterKind: ReporterKind;
  missingEvidence: EvidenceFlag[];
  action: InboxRowAction;
  href: string;
  timestamp: string;
  read: boolean;
  isUrgent: boolean;
  isDraft: boolean;
  isCitizen: boolean;
  isAwaitingSig: boolean;
}

/**
 * Rich filter state (REQ-002). Each dimension is optional; an absent
 * dimension means "no filter" (matches everything in that axis).
 *
 * FE-1.5d (2026-09-16) — the toolbar collapsed into a row of
 * multi-select dropdowns; the fast-path status values that used to
 * live as standalone chips (urgent / awaiting-sig / my-drafts /
 * citizen) merged into the `status` dimension so the operator has
 * one place to refine. The legacy buckets (open / in-flight /
 * resolved) stay as the wider "rollup" view.
 */
export interface FilterState {
  band: IncidentSeverity[];
  reporter: ReporterKind[];
  status: InboxStatusFilter[];
  from: string | null;
  to: string | null;
}
/**
 * Status filter values. Two layers co-exist:
 *  - The three rollups (`open` / `in-flight` / `resolved`) match
 *    `rowStatusFilterCategory` — they give the operator a coarse
 *    view of the queue.
 *  - The four fast-path values (`urgent` / `awaiting-sig` /
 *    `my-drafts` / `citizen`) match the legacy chip rows — they
 *    give the operator targeted narrowing on the action sub-
 *    state of a row.
 * Both layers apply OR within the status dimension; the dimension
 * ANDs with band + reporter + date.
 */
export type InboxStatusFilter =
  | 'open'
  | 'in-flight'
  | 'resolved'
  | 'urgent'
  | 'awaiting-sig'
  | 'my-drafts'
  | 'citizen';

export const EMPTY_FILTERS: FilterState = {
  band: [],
  reporter: [],
  status: [],
  from: null,
  to: null,
};

export function isFilterEmpty(f: FilterState): boolean {
  return (
    f.band.length === 0 &&
    f.reporter.length === 0 &&
    f.status.length === 0 &&
    f.from === null &&
    f.to === null
  );
}
/** Type guard — keeps the URL-parser narrowing honest. Used by both
 *  `parseFiltersFromQuery` and the InboxList dropdown builder. */
export function isInboxStatusFilter(s: string): s is InboxStatusFilter {
  return (
    s === 'open' ||
    s === 'in-flight' ||
    s === 'resolved' ||
    s === 'urgent' ||
    s === 'awaiting-sig' ||
    s === 'my-drafts' ||
    s === 'citizen'
  );
}

/**
 * Map a FilterState to a deterministic URL query string. Used by both
 * the URL persistence effect (REQ-003) and the test suite's round-trip
 * assertions. Empty filters collapse to "" so the URL stays clean when
 * the user clears the chip row.
 */
export function serialiseFiltersToQuery(f: FilterState): string {
  const parts: string[] = [];

  if (f.band.length > 0) parts.push(`band=${f.band.join(',')}`);
  if (f.reporter.length > 0) parts.push(`reporter=${f.reporter.join(',')}`);
  if (f.status.length > 0) parts.push(`status=${f.status.join(',')}`);
  if (f.from) parts.push(`from=${encodeURIComponent(f.from)}`);
  if (f.to) parts.push(`to=${encodeURIComponent(f.to)}`);

  return parts.length > 0 ? `?filter=${parts.join('&')}` : '';
}

export function parseFiltersFromQuery(query: string): FilterState {
  const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
  const raw = params.get('filter') ?? '';

  const state: FilterState = {
    band: [],
    reporter: [],
    status: [],
    from: null,
    to: null,
  };

  if (!raw) return state;

  // The `filter` value is itself a list of &-separated key=value pairs;
  // parse them manually so we don't try to round-trip a second
  // URLSearchParams layer.
  for (const pair of raw.split('&')) {
    const [k, v] = pair.split('=');
    if (!k || !v) continue;

    if (k === 'band') {
      state.band = v
        .split(',')
        .filter((s): s is IncidentSeverity => s === 'T3' || s === 'T2' || s === 'T1' || s === 'T0');
    } else if (k === 'reporter') {
      state.reporter = v
        .split(',')
        .filter(
          (s): s is ReporterKind =>
            s === 'anchor' || s === 'hotline' || s === 'webform' || s === 'sensor',
        );
    } else if (k === 'status') {
      state.status = v.split(',').filter(isInboxStatusFilter);
    } else if (k === 'from') {
      state.from = decodeURIComponent(v);
    } else if (k === 'to') {
      state.to = decodeURIComponent(v);
    }
  }

  return state;
}

/**
 * Apply a FilterState to a sorted row list. Each dimension AND-combines
 * so the user can narrow by band + reporter + status simultaneously
 * (per lockdown, multi-select inside one chip row is OR; chips across
 * dimensions compose AND).
 */
export function applyFilters(rows: InboxRow[], f: FilterState): InboxRow[] {
  if (isFilterEmpty(f)) return rows;

  return rows.filter((r) => {
    if (f.band.length > 0 && !f.band.includes(r.severity)) return false;
    if (f.reporter.length > 0 && !f.reporter.includes(r.reporterKind)) return false;
    if (f.status.length > 0) {
      const matched = f.status.some((s) => rowMatchesStatusFilter(r, s));
      if (!matched) return false;
    }
    if (f.from !== null && r.timestamp < f.from) return false;

    if (f.to !== null && r.timestamp > f.to) return false;

    return true;
  });
}

/**
 * Map an InboxRow to one of the three rollup filter-status buckets:
 *   - open      = rows needing operator action (awaiting_ack / awaiting_sig / awaiting_draft / citizen_report / info)
 *   - in-flight = rows where verification or on-site work is actively in progress
 *   - resolved  = rows that have been verified/closed (chain_verify status)
 *
 * The inbox wire doesn't have an explicit "in-flight" status — we
 * derive it from isUrgent + non-resolved state so the filter chip
 * has somewhere to land.
 */
function rowStatusFilterCategory(r: InboxRow): 'open' | 'in-flight' | 'resolved' {
  if (r.status === 'chain_verify') return 'resolved';

  if (r.isUrgent) return 'in-flight';

  return 'open';
}
/**
 * Check whether a single row matches a single status filter value.
 * Status values fall into two families:
 *  - Rollups (`open` / `in-flight` / `resolved`) match by category.
 *  - Fast-path values (`urgent` / `awaiting-sig` / `my-drafts` /
 *    `citizen`) match by row sub-state. The legacy fast-path values
 *    supersede the rollups for the rows they cover — so a row with
 *    `isUrgent=true` matches BOTH `urgent` and `in-flight`, and
 *    selecting either one narrows the queue to that row.
 *
 * `rowStatusFilterCategory` is reused for the rollup family so the
 * existing semantics (resolved = chain_verify, etc.) carry over
 * without duplication.
 */
function rowMatchesStatusFilter(r: InboxRow, s: InboxStatusFilter): boolean {
  if (s === 'urgent') return r.isUrgent;
  if (s === 'awaiting-sig') return r.isAwaitingSig;
  if (s === 'my-drafts') return r.isDraft;
  if (s === 'citizen') return r.isCitizen;

  return rowStatusFilterCategory(r) === s;
}
