// useAnjaliFilter — FE-B5g-1. localStorage-backed hook for the Anjali
// persona's "IncidentDate From" filter. Persists under
// `surakkha.anjali.incidentDateFrom` as an ISO string (or removes the
// key when cleared). Defensive parse: invalid → null. SSR-safe via
// `typeof window === 'undefined'` guard. See
// web/src/__checks__/fe-b5g-anjali-filter.test.tsx for the contract.
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'surakkha.anjali.incidentDateFrom';

function readStored(): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;
    const d = new Date(raw);

    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
function writeStored(d: Date | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (d) window.localStorage.setItem(STORAGE_KEY, d.toISOString());
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore — localStorage may throw in privacy mode */
  }
}
export function useAnjaliFilter(): {
  from: Date | null;
  setFrom: (d: Date | null) => void;
  clear: () => void;
} {
  const [from, setFromState] = useState<Date | null>(readStored);

  useEffect(() => {
    writeStored(from);
  }, [from]);

  const setFrom = useCallback((d: Date | null) => {
    setFromState(d);
  }, []);
  const clear = useCallback(() => {
    setFromState(null);
  }, []);

  return { from, setFrom, clear };
}
