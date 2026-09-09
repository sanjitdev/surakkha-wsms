/**
 * useTableResize.ts — FE-B5b per-column resize hook.
 *
 * Drag a 8px right-edge handle in the header. State is `Record<columnKey, px>`.
 * Widths are stored as raw px strings (e.g. "184px") so the consumer can drop
 * them straight into `style={{ width }}` without conversion.
 */
import { type MouseEvent as ReactMouseEvent, useCallback, useMemo, useRef, useState } from 'react';
import type { ResizeState } from './Table.types';

const MIN_WIDTH_PX = 48;

export interface UseTableResizeResult {
  widths: ResizeState;
  /** Mouse-down on the handle — start tracking. */
  onResizeStart: (columnKey: string, initialWidthPx: number) => (e: ReactMouseEvent<HTMLSpanElement>) => void;
  /** Cleared on mouse-up. Stable identity so the global listener always sees the latest. */
  clear: () => void;
  /** Active column key during a drag (or null). For test hooks + ARIA. */
  activeColumn: string | null;
}
/**
 * Owns the resize state. Mouse-down captures the starting px + column key;
 * global mousemove updates `widths`; mouseup clears via `clear()`. The
 * window listeners are attached only while a drag is in flight.
 */
export function useTableResize(): UseTableResizeResult {
  const [widths, setWidths] = useState<ResizeState>({});
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  // Refs hold the drag-in-progress values so mousemove handlers see the
  // latest without re-binding listeners on every state tick.
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const columnRef = useRef<string>('');

  const onResizeStart = useCallback(
    (columnKey: string, initialWidthPx: number) => (e: ReactMouseEvent<HTMLSpanElement>) => {
        e.preventDefault();
        e.stopPropagation();
        startXRef.current = e.clientX;
        startWidthRef.current = initialWidthPx;
        columnRef.current = columnKey;
        setActiveColumn(columnKey);

        const onMove = (ev: MouseEvent) => {
          const delta = ev.clientX - startXRef.current;
          const next = Math.max(MIN_WIDTH_PX, startWidthRef.current + delta);
          const col = columnRef.current;

          setWidths((prev) => {
            return { ...prev, [col]: `${next}px` };
          });
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          columnRef.current = '';
          startXRef.current = 0;
          startWidthRef.current = 0;
          setActiveColumn(null);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      },
    [],
  );

  const clear = useCallback(() => {
    setActiveColumn(null);
    columnRef.current = '';
    startXRef.current = 0;
    startWidthRef.current = 0;
  }, []);

  return useMemo(() => {
    return { widths, onResizeStart, clear, activeColumn };
  }, [widths, onResizeStart, clear, activeColumn]);
}
