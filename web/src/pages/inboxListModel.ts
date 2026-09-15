/**
 * inboxListModel.ts — FE-1.5b helper module.
 *
 * Pure functions + typed constants pulled out of InboxList.tsx so the
 * page itself can stay under the 200-line hard cap from the epic context
 * invariant. No React imports here — this is plain data shaping.
 */

import type { InboxRowStatus, InboxRow as InboxRowType, IncidentSeverity } from '../types/inbox';
import type { Locale, ReporterKind } from '../types/domain';
import { formatDate } from '../hooks/useDateFormatter';

/**
 * Convert an unknown wire-payload field to a string. Rejects objects so we
 * never accidentally render `[object Object]`. Strings/numbers pass through;
 * everything else falls back to the default.
 */
function toStr(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}
export interface ChainEventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
}
export interface RecentDecision {
  time: string;
  verb: string;
  target: string;
}
export const SEVERITY_FROM_WIRE: Record<string, IncidentSeverity> = {
  high: 'T3',
  medium: 'T2',
  low: 'T1',
  none: 'T0',
};
export const STATUS_FROM_WIRE: Record<string, InboxRowStatus> = {
  awaiting_ack: 'awaiting_ack',
  awaiting_sig: 'awaiting_sig',
  awaiting_draft: 'awaiting_draft',
  citizen_report: 'citizen_report',
  chain_verify: 'chain_verify',
  info: 'info',
};
export function actionLabelFor(status: InboxRowStatus): string {
  if (status === 'awaiting_draft') return 'Edit';
  if (status === 'chain_verify') return 'Inspect';
  if (status === 'info') return 'Schedule';
  if (status === 'citizen_report') return 'Review';
  return 'Open';
}
export function buildRows(events: ChainEventLite[]): InboxRowType[] {
  return events.map((e) => {
    const p = e.payload;
    const inbox = (p.inbox ?? {}) as Record<string, unknown>;
    const severity = SEVERITY_FROM_WIRE[toStr(p.severity, 'low')] ?? 'T1';
    const status = STATUS_FROM_WIRE[toStr(inbox.status, 'info')] ?? 'info';
    const ward = toStr(p.ward_id, '');
    const sensorId = toStr(
      (p.sensor_snapshot as { sensor_id?: string }[] | undefined)?.[0]?.sensor_id ?? '—',
      '—',
    );
    // Truncate ULID-style sensor ids (e.g. "01JOSENSORWARD00000000000A")
    // so the where-column sub line doesn't overflow on narrow rows.
    // Real sensor ids like "SN-2208" pass through untouched.
    const sensorIdShort =
      sensorId.length > 12 && !sensorId.startsWith('SN-')
        ? `${sensorId.slice(0, 8)}…`
        : sensorId;
    const ownerKind = inbox.owner_kind as InboxRowType['ownerKind'];
    // The InboxDetail route at /inbox/:id expects an incident_id (it
    // looks the row up in the /api/incidents list, which keys by
    // payload.incident_id, not event_id). Prefer the explicit
    // inbox.href when set; otherwise fall back to payload.incident_id;
    // otherwise event_id (legacy rows that lack both).
    const payloadIncidentId = toStr(p.incident_id, '');
    const actionHref =
      toStr(inbox.href, '') ||
      (payloadIncidentId ? `/inbox/${payloadIncidentId}` : `/inbox/${e.event_id}`);

    // Reporter kind comes from inbox.reporter_kind (set by hotline
    // intake + webform submit + sensor ingestion). Default 'webform'
    // so a row without an explicit reporter_kind still gets a chip.
    const rawReporter = toStr(inbox.reporter_kind, '');
    const reporterKind: ReporterKind =
      rawReporter === 'anchor' || rawReporter === 'hotline' || rawReporter === 'sensor'
        ? (rawReporter as ReporterKind)
        : 'webform';

    // Missing evidence: chain payload surfaces a flat array on inbox.missing_evidence.
    const rawEvidence = (inbox.missing_evidence ?? []) as unknown[];
    const missingEvidence = rawEvidence.filter(
      (e): e is 'photo' | 'gps' | 'description' =>
        e === 'photo' || e === 'gps' || e === 'description',
    );

    return {
      id: e.event_id,
      severity,
      title: toStr(inbox.title, 'Untitled incident'),
      meta: toStr(inbox.summary, ''),
      // Use a non-breaking space (\u00A0) between "ward" and the suffix so
      // the prefix never splits onto its own line in the WHERE column.
      // A regular space let the mono span wrap into
      //   "ward"
      //   "dhanmondi"
      // when the column was narrower than the full id. The nbsp keeps
      // the pair atomic while still reading as a normal space.
      where: ward.startsWith('ward') ? `ward\u00A0${ward.slice(5)}` : ward,
      whereSub: sensorIdShort,
      ownerName: toStr(inbox.owner_display, 'System'),
      ownerKind,
      status,
      reporterKind,
      missingEvidence,
      action: { label: actionLabelFor(status), href: actionHref },
      href: actionHref,
      timestamp: e.occurred_at,
      read: Boolean(inbox.read),
      isUrgent: Boolean(inbox.isUrgent),
      isDraft: status === 'awaiting_draft',
      isCitizen: status === 'citizen_report',
      isAwaitingSig: Boolean(inbox.isAwaitingSig),
    };
  });
}
export function mergeRecentDecisions(
  locale: Locale,
  bcast: ChainEventLite[],
  esc: ChainEventLite[],
  csig: ChainEventLite[],
  rev: ChainEventLite[],
): RecentDecision[] {
  const items: RecentDecision[] = [
    ...bcast.map((e) => {
      return { time: formatDate(locale, 'time-24', e.occurred_at), verb: 'Broadcast', target: 'ward 7 notice' };
    }),
    ...esc.map((e) => {
      return { time: formatDate(locale, 'time-24', e.occurred_at), verb: 'Escalated', target: 'block #12' };
    }),
    ...csig.map((e) => {
      return { time: formatDate(locale, 'time-24', e.occurred_at), verb: 'Countersigned', target: 'ward 5' };
    }),
    ...rev.map((e) => {
      return { time: formatDate(locale, 'time-24', e.occurred_at), verb: 'Reviewed', target: 'ward 12 draft' };
    }),
  ];

  return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 4);
}
export interface ChipCounts {
  all: number;
  T3: number;
  sig: number;
  drafts: number;
  citizen: number;
  resolved: number;
}
export function countByFilter(rows: InboxRowType[]): ChipCounts {
  return {
    all: rows.length,
    T3: rows.filter((r) => r.severity === 'T3').length,
    sig: rows.filter((r) => r.isAwaitingSig).length,
    drafts: rows.filter((r) => r.isDraft).length,
    citizen: rows.filter((r) => r.isCitizen).length,
    resolved: rows.filter((r) => r.status === 'chain_verify').length,
  };
}

/**
 * Lockdown-bound sort: priority-first / age-second.
 * Tier order per inbox-list.md §3 #4 + foundation §1.1: T3 > T2 > T1 > Resolved.
 * Within a tier, oldest first (ascending age by timestamp).
 *
 * The "resolved" pseudo-tier sits at the bottom — rows whose status is
 * 'chain_verify' (verified/closed) rank below T1 so the operator sees
 * live work first and audit history last. T0 sits below T1 in operator
 * chrome (uninitialised; not a real priority).
 */
const TIER_RANK: Record<IncidentSeverity | 'resolved', number> = {
  T3: 0,
  T2: 1,
  T1: 2,
  T0: 3,
  resolved: 4,
};

function tierFor(row: InboxRowType): IncidentSeverity | 'resolved' {
  if (row.status === 'chain_verify') return 'resolved';
  return row.severity;
}

export function sortRowsByPriorityAge(rows: InboxRowType[]): InboxRowType[] {
  return [...rows].sort((a, b) => {
    const ta = TIER_RANK[tierFor(a)];
    const tb = TIER_RANK[tierFor(b)];

    if (ta !== tb) return ta - tb;
    // Within a tier: oldest first (ascending timestamp).
    return a.timestamp.localeCompare(b.timestamp);
  });
}
