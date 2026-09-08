/**
 * inboxListModel.ts — FE-1.5b helper module.
 *
 * Pure functions + typed constants pulled out of InboxList.tsx so the
 * page itself can stay under the 200-line hard cap from the epic context
 * invariant. No React imports here — this is plain data shaping.
 */

import type {
  InboxRow as InboxRowType,
  InboxRowStatus,
  IncidentSeverity,
} from '../types/inbox';

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

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function actionLabelFor(status: InboxRowStatus): string {
  if (status === 'awaiting_draft') return 'Edit';
  if (status === 'chain_verify') return 'Inspect';
  if (status === 'info') return 'Schedule';
  if (status === 'citizen_report') return 'Review';
  return 'Open';
}

export function buildRows(events: ChainEventLite[]): InboxRowType[] {
  return events.map((e) => {
    const p = e.payload as Record<string, unknown>;
    const inbox = (p.inbox ?? {}) as Record<string, unknown>;
    const severity = SEVERITY_FROM_WIRE[String(p.severity ?? 'low')] ?? 'T1';
    const status = STATUS_FROM_WIRE[String(inbox.status ?? 'info')] ?? 'info';
    const ward = String(p.ward_id ?? '');
    const sensorId = String(
      (p.sensor_snapshot as { sensor_id?: string }[] | undefined)?.[0]?.sensor_id ?? '—',
    );
    const ownerKind = (inbox.owner_kind as InboxRowType['ownerKind']) ?? 'system';
    const actionHref = String(inbox.href ?? '/inbox-detail');
    return {
      id: e.event_id,
      severity,
      title: String(inbox.title ?? 'Untitled incident'),
      meta: String(inbox.summary ?? ''),
      where: ward.startsWith('ward') ? `ward ${ward.slice(5)}` : ward,
      whereSub: sensorId,
      ownerName: String(inbox.owner_display ?? 'System'),
      ownerKind,
      status,
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
  bcast: ChainEventLite[],
  esc: ChainEventLite[],
  csig: ChainEventLite[],
  rev: ChainEventLite[],
): RecentDecision[] {
  const items: RecentDecision[] = [
    ...bcast.map((e) => ({ time: fmtTime(e.occurred_at), verb: 'Broadcast', target: 'ward 7 notice' })),
    ...esc.map((e) => ({ time: fmtTime(e.occurred_at), verb: 'Escalated', target: 'block #12' })),
    ...csig.map((e) => ({ time: fmtTime(e.occurred_at), verb: 'Countersigned', target: 'ward 5' })),
    ...rev.map((e) => ({ time: fmtTime(e.occurred_at), verb: 'Reviewed', target: 'ward 12 draft' })),
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
