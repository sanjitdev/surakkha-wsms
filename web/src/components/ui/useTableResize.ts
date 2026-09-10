/**
 * useTableResize.ts — FE-B5b per-column resize hook.
 *
 * Drag a 8px right-edge handle in the header. State is `Record<columnKey, px>`.
 * Widths are stored as raw px strings (e.g. "184px") so the consumer can drop
 * them straight into `style={{ width }}` without conversion.
 */
import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResizeState } from './Table.types';

const MIN_WIDTH_PX = 48;

export interface UseTableResizeResult {
  widths: ResizeState;
  /** Mouse-down on the handle — start tracking. */
  onResizeStart: (columnKey: string, initialWidthPx: number) => (e: ReactMouseEvent<HTMLSpanElement>) => void;
  /** Keyboard resize (ArrowLeft/ArrowRight). Adjusts width by delta px, clamped to MIN. */
  onResizeAdjust: (columnKey: string, deltaPx: number) => void;
  /** Cleared on mouse-up. Stable identity so the global listener always sees the latest. */
  clear: () => void;
  /** Active column key during a drag (or null). For test hooks + ARIA. */
  activeColumn: string | null;
}
/**
 * Owns the resize state. Mouse-down captures the starting px + column key;
 * global mousemove updates `widths`; mouseup clears via `clear()`. The
 * window listeners are attached only while a drag is in flight.
 *
 * The active `mousemove`/`mouseup` handlers are stored in refs so the
 * unmount `useEffect` cleanup can call `removeEventListener` with the
 * SAME function references (B5b-2 — prevents listener leak if the
 * consumer unmounts mid-drag).
 */
export function useTableResize(): UseTableResizeResult {
  const [widths, setWidths] = useState<ResizeState>({});
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  // Refs hold the drag-in-progress values so mousemove handlers see the
  // latest without re-binding listeners on every state tick.
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const columnRef = useRef<string>('');
  // B5b-2: keep the active listener functions so unmount cleanup can
  // removeEventListener with the SAME references used at addEventListener.
  const onMoveRef = useRef<((ev: MouseEvent) => void) | null>(null);
  const onUpRef = useRef<(() => void) | null>(null);

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
          onMoveRef.current = null;
          onUpRef.current = null;
          columnRef.current = '';
          startXRef.current = 0;
          startWidthRef.current = 0;
          setActiveColumn(null);
        };

        onMoveRef.current = onMove;
        onUpRef.current = onUp;

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

  // B5b-4: keyboard resize — adjust width by deltaPx, clamped to MIN.
  const onResizeAdjust = useCallback((columnKey: string, deltaPx: number) => {
    setWidths((prev) => {
      const cur = parsePx(prev[columnKey]);
      const next = Math.max(MIN_WIDTH_PX, cur + deltaPx);

      return { ...prev, [columnKey]: `${next}px` };
    });
  }, []);

  // B5b-2: cleanup on unmount — remove any active drag listeners.
  useEffect(() => () => {
    if (onMoveRef.current) window.removeEventListener('mousemove', onMoveRef.current);
    if (onUpRef.current) window.removeEventListener('mouseup', onUpRef.current);
    onMoveRef.current = null;
    onUpRef.current = null;
  }, []);

  return useMemo(() => {
    return { widths, onResizeStart, onResizeAdjust, clear, activeColumn };
  }, [widths, onResizeStart, onResizeAdjust, clear, activeColumn]);
}
/** Parse a width string ("120px" / "8rem") into a numeric px for delta math. */
function parsePx(width: string | undefined): number {
  if (width === undefined) return 120;
  const m = width.match(/^(\d+(?:\.\d+)?)px$/);

  if (m?.[1] !== undefined) return Number(m[1]);
  // For non-px strings we start from a sane default; the consumer can
  // always reset to a px value via `width` prop on the column.
  return 120;
}
