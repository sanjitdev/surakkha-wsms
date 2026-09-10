/**
 * useTableSort.ts — FE-B5b sort state hook.
 *
 * Encapsulates the click-to-cycle state machine (null → asc → desc → null)
 * and the comparator. Numeric compare when both values are numbers, else
 * `String.localeCompare`. Stable enough for table-scale rows (no virtual
 * scrolling in B5b per spec).
 */
import { useCallback, useMemo, useState } from 'react';
import type { SortDir, SortState } from './Table.types';

/** Cycle the sort direction for a given column. `null` cycles to asc first. */
export function cycleSort(current: SortState | null, key: string): SortState {
  if (current?.key !== key) {
    return { key, dir: 'asc' };
  }
  if (current.dir === 'asc') {
    return { key, dir: 'desc' };
  }
  if (current.dir === 'desc') {
    return { key, dir: null };
  }
  return { key, dir: 'asc' };
}
export interface UseTableSortResult<T> {
  sort: SortState | null;
  onToggle: (key: string) => void;
  sortRows: (rows: T[]) => T[];
}
/**
 * Generic sort hook. Returns the current sort state, a toggle handler bound
 * to the cycle, and a memoised `sortRows` function. Caller passes `rows` in
 * fresh each render so memo cache invalidates on data change.
 */
export function useTableSort<T>(): UseTableSortResult<T> {
  const [sort, setSort] = useState<SortState | null>(null);

  const onToggle = useCallback((key: string) => {
    setSort((prev) => cycleSort(prev, key));
  }, []);

  const sortRows = useCallback(
    (rows: T[]): T[] => {
      if (sort === null) return rows;
      const { key, dir } = sort;
      const mul = dir === 'desc' ? -1 : 1;

      // Spread to avoid mutating caller's array. Slice is shallow-copied so
      // downstream sorting never mutates the original `rows`.
      return rows.slice().sort((a, b) => {
        const av = (a as Record<string, unknown>)[key];
        const bv = (b as Record<string, unknown>)[key];

        // Null/undefined always sort last (NULLS LAST) — most databases do
        // NULLS LAST by default, which matches Surakkha's "missing = bottom"
        // dashboard convention. Same direction handling for asc + desc.
        const aNull = av === null || av === undefined;
        const bNull = bv === null || bv === undefined;

        if (aNull && !bNull) return 1;
        if (!aNull && bNull) return -1;
        if (aNull && bNull) return 0;

        // Date branch — chronological compare via getTime() (avoids locale
        // ordering of Date#toString). Only triggers when BOTH values are
        // Date instances; mixed Date + string falls through to stringify.
        if (av instanceof Date && bv instanceof Date) {
          return (av.getTime() - bv.getTime()) * mul;
        }

        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * mul;
        }
        const stringify = (v: unknown): string => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string') return v;
          if (typeof v === 'number' || typeof v === 'boolean') return String(v);
          return '';
        };
        const as = stringify(av);
        const bs = stringify(bv);

        return as.localeCompare(bs) * mul;
      });
    },
    [sort],
  );

  // useMemo wrapper so callers can pass `sortRows` directly to useMemo deps.
  // Returning the same function reference when `[sort]` is stable means
  // downstream useMemo([...]) doesn't invalidate on re-render for free.
  return useMemo(() => {
    return { sort, onToggle, sortRows };
  }, [sort, onToggle, sortRows]);
}
export type { SortDir };
