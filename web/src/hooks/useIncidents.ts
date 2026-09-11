// Layer C data hook for the per-incident summary projection. Fetches
// `/api/incidents` once on mount and exposes the standard
// `{ data, loading, error }` triple. No cache layer (no useRef, SWR,
// TanStack Query) — fetch-on-mount only per FE-1 architecture invariants
// (epic-fe-1-context.md:35-43). Wire shape is the canonical
// IncidentSummary defined in `web/src/types/domain.ts`; the MSW handler
// at `web/src/mocks/handlers.ts:425-463` is the single source of truth.

import { useCallback, useEffect, useState } from 'react';
import { IncidentStatus, type IncidentSummary } from '../types/domain';

export interface UseIncidentsResult {
  incidents: IncidentSummary[];
  loading: boolean;
  error: Error | null;
  /**
   * Force a refetch against `/api/incidents`. Used after a write-path
   // action (e.g. HotlineIntakeModal submit) to surface the new row in
   // the inbox without a page refresh.
   */
  refetch: () => Promise<void>;
}
export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');

      if (!res.ok) {
        throw new Error(`useIncidents: /api/incidents returned ${res.status}`);
      }
      const rows = (await res.json()) as {
        incident_id: string;
        status: string;
        severity: string;
        ward_id?: string;
        last_block_height: number;
        last_event_type: string;
        last_occurred_at: string;
        reporter_kind?: string;
      }[];

      setIncidents(
        rows.map((r) => {
          return {
            incident_id: r.incident_id,
            status: projectStatus(r.status),
            severity: r.severity,
            ward_id: r.ward_id,
            last_block_height: r.last_block_height,
            last_event_type: r.last_event_type,
            last_occurred_at: r.last_occurred_at,
            // operator-dashboard.md #9 — reporter_kind projects onto
            // the row as a source-attribute chip. Hook passes it through
            // unchanged; the dashboard defaults to 'webform' when
            // undefined (older fixtures without reporter_kind).
            reporter_kind: r.reporter_kind as IncidentSummary['reporter_kind'],
          };
        }),
      );
      setError(null);
    } catch (err) {
      setIncidents([]);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };

    void (async () => {
      await load();
      if (!cancelled.current) setLoading(false);
    })();
    return () => {
      cancelled.current = true;
    };
  }, [load]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  return { incidents, loading, error, refetch };
}
function projectStatus(wire: string): IncidentStatus {
  if (wire === 'resolved') return IncidentStatus.Resolved;
  if (wire === 'escalated') return IncidentStatus.Escalated;
  return IncidentStatus.Open;
}
