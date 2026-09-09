// Layer C data hook for the per-incident summary projection. Fetches
// `/api/incidents` once on mount and exposes the standard
// `{ data, loading, error }` triple. No cache layer (no useRef, SWR,
// TanStack Query) — fetch-on-mount only per FE-1 architecture invariants
// (epic-fe-1-context.md:35-43). Wire shape is the canonical
// IncidentSummary defined in `web/src/types/domain.ts`; the MSW handler
// at `web/src/mocks/handlers.ts:425-463` is the single source of truth.

import { useEffect, useState } from 'react';
import { IncidentStatus, type IncidentSummary } from '../types/domain';

export interface UseIncidentsResult {
  incidents: IncidentSummary[];
  loading: boolean;
  error: Error | null;
}
export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cancelled = { current: false };

    void (async () => {
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
        }[];

        if (cancelled.current) return;
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
            };
          }),
        );
        setError(null);
      } catch (err) {
        if (cancelled.current) return;
        setIncidents([]);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  return { incidents, loading, error };
}
function projectStatus(wire: string): IncidentStatus {
  if (wire === 'resolved') return IncidentStatus.Resolved;
  if (wire === 'escalated') return IncidentStatus.Escalated;
  return IncidentStatus.Open;
}
