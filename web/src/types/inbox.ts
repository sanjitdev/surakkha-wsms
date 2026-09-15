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
 */
export interface FilterState {
  band: IncidentSeverity[];
  reporter: ReporterKind[];
  status: ('open' | 'in-flight' | 'resolved')[];
  from: string | null;
  to: string | null;
}

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
      state.status = v
        .split(',')
        .filter(
          (s): s is 'open' | 'in-flight' | 'resolved' =>
            s === 'open' || s === 'in-flight' || s === 'resolved',
        );
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
      const mapped = rowStatusFilterCategory(r);
      if (!f.status.includes(mapped)) return false;
    }
    if (f.from !== null && r.timestamp < f.from) return false;

    if (f.to !== null && r.timestamp > f.to) return false;

    return true;
  });
}

/**
 * Map an InboxRow to one of the three filter-status buckets:
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
