// useIncidentActions — Layer C write-path hook.
//
// Mirrors useIncidents (read) for the write side. Each method posts a
// typed envelope to `POST /api/events` (the MSW chain-write endpoint)
// and refetches `/api/incidents` on success so consumers' tables update
// without manual refresh. Toasts surface success / failure per the B2
// contract (FE-1.2 ToastProvider). State is intentionally coarse: a
// single `busy: boolean` and `lastError: Error | null` — fine-grained
// per-action state would balloon the surface area without adding value
// for the 5-7 actions we need.
//
// Why one hook, not one-per-action:
//   - The 7 actions share the same envelope shape (event_type + payload)
//     and the same error/loading plumbing. Splitting into 7 hooks would
//     duplicate that plumbing 7x.
//   - The hook is Layer C (state + fetch); the per-action types stay in
//     domain.ts so primitive components stay read-only consumers.
//
// Why `fetch()` and not MSW directly:
//   - Hooks always call `/api/*` so swapping VITE_USE_MOCKS=false works
//     with zero code change at the call site.

import { useCallback, useState } from 'react';
import { useToast } from '../components/ui/ToastProvider';
import { getSession } from '../mocks/idb';

export interface IncidentActionEnvelope<T = unknown> {
  event_type: string;
  payload: T;
}
export interface UseIncidentActionsResult {
  busy: boolean;
  lastError: Error | null;
  /** Append a typed envelope to the chain and refetch incidents. */
  post: <T>(envelope: IncidentActionEnvelope<T>) => Promise<{ event_id: string } | null>;
  /** Operator assigns a field tech to an open incident. */
  assignTech: (input: {
    incident_id: string;
    technician_id: string;
    technician_name: string;
    priority: 'P1' | 'P2' | 'P3';
    eta_target_minutes: number;
    work_order_summary: string;
  }) => Promise<boolean>;
  /** Operator requests citizen acknowledgement on a resolved/pending incident. */
  requestAck: (input: {
    incident_id: string;
    channel: 'sms' | 'whatsapp' | 'voice';
    summary: string;
  }) => Promise<boolean>;
  /** Anjali submits a citizen report. */
  submitReport: (input: {
    title: string;
    severity: 'T1' | 'T2' | 'T3';
    ward_id: string;
    description: string;
    photo_url?: string;
    voice_url?: string;
    gps?: { lat: number; lng: number };
  }) => Promise<boolean>;
  /** Field tech records arrival at the incident site. */
  techArrived: (input: { incident_id: string; technician_id: string }) => Promise<boolean>;
  /** Field tech submits a diagnosis note (still on site, not yet fixed). */
  techDiagnosis: (input: {
    incident_id: string;
    technician_id: string;
    diagnosis: string;
    parts_needed?: string[];
  }) => Promise<boolean>;
  /** Field tech submits a fix (will be verified by operator). */
  techFix: (input: {
    incident_id: string;
    technician_id: string;
    fix_summary: string;
    resolution_note?: string;
    photo_url?: string;
  }) => Promise<boolean>;
  /** Operator confirms the fix and closes the incident. */
  resolveIncident: (input: {
    incident_id: string;
    resolution_note: string;
  }) => Promise<boolean>;
  /** Citizen acknowledges closure — approve (✅) or dispute (❌). */
  citizenAcknowledge: (input: {
    incident_id: string;
    method: 'sms' | 'whatsapp' | 'voice' | 'in_app';
    approve: boolean;
  }) => Promise<boolean>;
  /** Operator marks an inbox row reviewed (bulk action). */
  markReviewed: (input: { incident_ids: string[] }) => Promise<boolean>;
}

export function useIncidentActions(): UseIncidentActionsResult {
  const toast = useToast();
  const [busy, setBusy] = useState<boolean>(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const post = useCallback(
    async <T,>(envelope: IncidentActionEnvelope<T>): Promise<{ event_id: string } | null> => {
      // setBusy(true) MUST happen synchronously before any await so callers
      // observing `busy` right after invoking post() (without await) see true.
      // Tests rely on this for the "in-flight window" assertion.
      setBusy(true);
      setLastError(null);
      const sessionPromise = getSession();
      try {
        const sess = await sessionPromise;
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: envelope.event_type,
            payload: envelope.payload,
            actor_identity: sess
              ? {
                  kind: sess.role,
                  ref: sess.actor_ref,
                  display: sess.display_name,
                }
              : undefined,
          }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as {
            error?: string;
            reason?: string;
          };
          throw new Error(
            errBody.reason ? `${errBody.error}: ${errBody.reason}` : `HTTP ${res.status}`,
          );
        }
        const body = (await res.json()) as { event_id: string };
        // Trigger a soft refresh so consumers' IncidentSummary tables update.
        // No-op for endpoints that don't read /api/incidents (e.g. tech queue
        // reads /api/events?event_type=... directly).
        void fetch('/api/incidents', { method: 'GET' }).catch(() => undefined);
        return { event_id: body.event_id };
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setLastError(e);
        toast.danger(`Action failed: ${e.message}`);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  const assignTech = useCallback<UseIncidentActionsResult['assignTech']>(
    async (input) => {
      const result = await post({
        event_type: 'TechnicianAssigned',
        payload: {
          incident_id: input.incident_id,
          technician_id: input.technician_id,
          technician_name: input.technician_name,
          priority: input.priority,
          eta_target_minutes: input.eta_target_minutes,
          work_order_summary: input.work_order_summary,
        },
      });
      if (result) {
        toast.success(`Assigned to ${input.technician_name}`);
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const requestAck = useCallback<UseIncidentActionsResult['requestAck']>(
    async (input) => {
      // Two-step: (1) PublicNoticeIssued broadcasts the ack request via the
      // chosen channel; (2) AnjaliAcknowledgeDelivered records the delivery
      // for SLA timing. Both land on the same envelope so the chain has the
      // full receipt.
      const notice = await post({
        event_type: 'PublicNoticeIssued',
        payload: {
          incident_id: input.incident_id,
          channel: input.channel,
          notice_type: 'citizen_acknowledgement_request',
          body: input.summary,
        },
      });
      if (!notice) return false;
      const ackDelivered = await post({
        event_type: 'AnjaliAcknowledgeDelivered',
        payload: {
          incident_id: input.incident_id,
          channel: input.channel,
        },
      });
      if (ackDelivered) {
        toast.success(`Ack request sent via ${input.channel}`);
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const submitReport = useCallback<UseIncidentActionsResult['submitReport']>(
    async (input) => {
      const result = await post({
        event_type: 'AnjaliReportSubmitted',
        payload: {
          title: input.title,
          severity: input.severity,
          ward_id: input.ward_id,
          description: input.description,
          photo_url: input.photo_url ?? null,
          voice_url: input.voice_url ?? null,
          gps: input.gps ?? null,
          // Auto-create the incident from the report so the chain has a
          // single anchor for the operator's view.
          incident_followup: 'IncidentCreated',
        },
      });
      if (result) {
        toast.success('Report submitted to the chain');
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const techArrived = useCallback<UseIncidentActionsResult['techArrived']>(
    async (input) => {
      const result = await post({
        event_type: 'TechnicianArrived',
        payload: {
          incident_id: input.incident_id,
          technician_id: input.technician_id,
        },
      });
      if (result) {
        toast.success('Marked on site');
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const techDiagnosis = useCallback<UseIncidentActionsResult['techDiagnosis']>(
    async (input) => {
      const result = await post({
        event_type: 'DiagnosisSubmitted',
        payload: {
          incident_id: input.incident_id,
          technician_id: input.technician_id,
          diagnosis: input.diagnosis,
          parts_needed: input.parts_needed ?? [],
        },
      });
      if (result) {
        toast.success('Diagnosis recorded');
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const techFix = useCallback<UseIncidentActionsResult['techFix']>(
    async (input) => {
      const result = await post({
        event_type: 'FixSubmitted',
        payload: {
          incident_id: input.incident_id,
          technician_id: input.technician_id,
          fix_summary: input.fix_summary,
          resolution_note: input.resolution_note ?? '',
          photo_url: input.photo_url ?? null,
        },
      });
      if (result) {
        toast.success('Fix submitted for operator review');
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const resolveIncident = useCallback<UseIncidentActionsResult['resolveIncident']>(
    async (input) => {
      const result = await post({
        event_type: 'IncidentResolved',
        payload: {
          incident_id: input.incident_id,
          resolution_note: input.resolution_note,
          closed_by: 'operator',
        },
      });
      if (result) {
        toast.success('Incident closed — awaiting citizen ack');
        return true;
      }
      return false;
    },
    [post, toast],
  );

  const citizenAcknowledge = useCallback<UseIncidentActionsResult['citizenAcknowledge']>(
    async (input) => {
      const ack = await post({
        event_type: 'CitizenAcknowledgement',
        payload: {
          incident_id: input.incident_id,
          method: input.method,
          approve: input.approve,
        },
      });
      if (!ack) return false;
      // Citizen ack with approve=true seals the closure as final. With
      // approve=false the incident reopens with parent link to the
      // original closure.
      if (input.approve) {
        toast.success('✅ Citizen approved — incident closed');
      } else {
        toast.warning('❌ Citizen disputed — incident reopened for review');
      }
      return true;
    },
    [post, toast],
  );

  const markReviewed = useCallback<UseIncidentActionsResult['markReviewed']>(
    async (input) => {
      // One SignatureAttestation per selected incident. Chain records each
      // review action atomically.
      let ok = true;
      for (const incident_id of input.incident_ids) {
        const r = await post({
          event_type: 'SignatureAttestation',
          payload: {
            incident_id,
            action: 'reviewed_by_operator',
          },
        });
        if (!r) ok = false;
      }
      if (ok) toast.success(`Marked ${input.incident_ids.length} row(s) reviewed`);
      return ok;
    },
    [post, toast],
  );

  return {
    busy,
    lastError,
    post,
    assignTech,
    requestAck,
    submitReport,
    techArrived,
    techDiagnosis,
    techFix,
    resolveIncident,
    citizenAcknowledge,
    markReviewed,
  };
}
