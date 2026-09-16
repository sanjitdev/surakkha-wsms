/**
 * AuditEventIcon.tsx — glyphs for the 12 audit-log event types
 * (foundation §4.2 / audit-log.md Lucide mapping).
 *
 * Inline SVG so the audit log page doesn't pull a separate icon
 * dependency. Every glyph renders `aria-hidden="true"` — the
 * event-type label next to it carries the semantic name.
 *
 * One map (`AUDIT_ICON_BY_TYPE`) is the closed set the page looks
 * up; the fallback `ChevronRightGlyph` is what unknown event types
 * get so a forward-compatible wire event still renders something.
 */

import type { JSX } from 'react';

const Icon = ({ children }: { children: JSX.Element | JSX.Element[] }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const AUDIT_ICON_BY_TYPE: Record<string, () => JSX.Element> = {
  IncidentCreated: () => (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </Icon>
  ),
  TrustBandSet: () => (
    <Icon>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Icon>
  ),
  TrustBandOverridden: () => (
    <Icon>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </Icon>
  ),
  TechnicianAssigned: () => (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </Icon>
  ),
  TechnicianArrived: () => (
    <Icon>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  ),
  DiagnosisSubmitted: () => <Icon><PackagePath /></Icon>,
  FixSubmitted: () => <Icon><PackagePath /></Icon>,
  ProofSubmitted: () => <Icon><PackagePath /></Icon>,
  ProofAccepted: () => (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="22 12 18 12 15 21 9 8 6 12" />
    </Icon>
  ),
  Resolved: () => (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="22 12 18 12 15 21 9 8 6 12" />
    </Icon>
  ),
  Closed: () => (
    <Icon>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  ),
  CitizenAcknowledgement: () => (
    <Icon>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <polyline points="9 12 11 14 15 10" />
    </Icon>
  ),
  ChainRead: () => (
    <Icon>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  ChainAnomalyDetected: () => (
    <Icon>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  ),
};

/** Fallback for unknown event types so a forward-compatible wire event
 *  still renders something meaningful. */
export const UnknownEventIcon = () => (
  <Icon>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);

function PackagePath() {
  return (
    <>
      <path d="M16.5 9.4l-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  );
}
