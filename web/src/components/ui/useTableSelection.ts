/**
 * useTableSelection.ts — FE-B5b selection state hook.
 *
 * Encapsulates the per-page selection set. Caller is responsible for
 * keying rows (the `keys` arg to `toggleAll`/`isAllSelected` is whatever
 * the table decides to scope "all" to — usually the visible page).
 */
import { useCallback, useMemo, useState } from 'react';

export interface UseTableSelectionResult {
  selected: Set<string>;
  toggle: (key: string) => void;
  toggleAll: (keys: string[]) => void;
  isAllSelected: (keys: string[]) => boolean;
  clear: () => void;
}
/**
 * Manages a `Set<string>` of selected row keys. `toggleAll` is a deterministic
 * flip — if every key in `keys` is already selected, clears the set; otherwise
 * replaces the set with `keys`. `isAllSelected` returns true when `keys` is
 * non-empty AND every member is in the selected set.
 */
export function useTableSelection(): UseTableSelectionResult {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((keys: string[]) => {
    setSelected((prev) => {
      const allOn = keys.length > 0 && keys.every((k) => prev.has(k));

      if (allOn) {
        return new Set();
      }
      return new Set(keys);
    });
  }, []);

  const isAllSelected = useCallback(
    (keys: string[]) => {
      if (keys.length === 0) return false;
      return keys.every((k) => selected.has(k));
    },
    [selected],
  );

  const clear = useCallback(() => {
    setSelected(() => new Set());
  }, []);

  return useMemo(() => {
    return { selected, toggle, toggleAll, isAllSelected, clear };
  }, [selected, toggle, toggleAll, isAllSelected, clear]);
}
