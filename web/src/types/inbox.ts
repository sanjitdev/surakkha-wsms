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

export type IncidentSeverity = 'T3' | 'T2' | 'T1' | 'T0';

export type InboxRowFilter = 'all' | 'T3' | 'sig' | 'drafts' | 'citizen' | 'resolved';

export type InboxRowStatus = 'awaiting_ack' | 'awaiting_sig' | 'awaiting_draft' | 'citizen_report' | 'chain_verify' | 'info';

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
  action: InboxRowAction;
  href: string;
  timestamp: string;
  read: boolean;
  isUrgent: boolean;
  isDraft: boolean;
  isCitizen: boolean;
  isAwaitingSig: boolean;
}
