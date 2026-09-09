// Canonical domain enums for the FE-1 app — AD-FE-6 mandates the `as const`
// pattern (no `enum` keyword) so values tree-shake and avoid reverse-mapping
// overhead. Hooks return verbatim; primitives lowercase only inside their own
// JSX class-mapping.

export const Priority = { P1: 'P1', P2: 'P2', P3: 'P3', P4: 'P4' } as const;
export type Priority = (typeof Priority)[keyof typeof Priority];
export const Band = { High: 'High', Medium: 'Medium', Low: 'Low' } as const;
export type Band = (typeof Band)[keyof typeof Band];
export const ToastVariant = {
  Success: 'Success',
  Warning: 'Warning',
  Danger: 'Danger',
  Info: 'Info',
} as const;
export type ToastVariant = (typeof ToastVariant)[keyof typeof ToastVariant];
export const ContainerWidth = {
  Narrow: 'Narrow',
  Bangla: 'Bangla',
  Wide: 'Wide',
} as const;
export type ContainerWidth = (typeof ContainerWidth)[keyof typeof ContainerWidth];
export const Locale = { En: 'en', Bn: 'bn' } as const;
export type Locale = (typeof Locale)[keyof typeof Locale];
export const Theme = { Light: 'light', Dark: 'dark' } as const;
export type Theme = (typeof Theme)[keyof typeof Theme];
// Incident lifecycle status — projected from the latest incident-bearing
// chain event (IncidentResolved / IncidentEscalated / IncidentCreated) per
// dim 7 §6. Mirrors `web/src/mocks/handlers.ts:443-461` verbatim so the
// frontend projection cannot drift from the MSW wire shape.
export const IncidentStatus = {
  Open: 'open',
  Resolved: 'resolved',
  Escalated: 'escalated',
} as const;
export type IncidentStatus = (typeof IncidentStatus)[keyof typeof IncidentStatus];
// Lightweight per-incident summary — the row shape the dashboard + inbox
// detail render. Built server-side by collapsing IncidentCreated/
// IncidentEscalated/IncidentResolved chain blocks into one row per
// incident_id. Mirrors `web/src/mocks/handlers.ts:443-461` verbatim.
export interface IncidentSummary {
  incident_id: string;
  status: IncidentStatus;
  severity: string;
  ward_id?: string;
  last_block_height: number;
  last_event_type: string;
  last_occurred_at: string;
}
