/**
 * TableHeader.tsx — FE-B5b <thead> renderer.
 *
 * Per-column `<th>` with sort button + optional resize handle. ARIA
 * `aria-sort="ascending"|"descending"|"none"` for assistive tech. Keyboard:
 * Space/Enter on the sort button toggles sort, matching the W3C ARIA APG
 * sortable column pattern.
 */
import { type KeyboardEvent, type ReactNode, useEffect, useRef } from 'react';
import type { ResizeState, SortState, TableColumn } from './Table.types';

export interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  sort: SortState | null;
  onToggleSort: (key: string) => void;
  widths: ResizeState;
  onResizeStart: (columnKey: string, initialWidthPx: number) => (e: React.MouseEvent<HTMLSpanElement>) => void;
  /** B5b-4: keyboard resize from the focused column header. */
  onResizeAdjust?: (columnKey: string, deltaPx: number) => void;
  selectable: boolean;
  allSelected?: boolean;
  /** B5b-3: partial selection — drives `indeterminate` DOM property. */
  partialSelected?: boolean;
  /** B5b-3: ARIA tri-state — `'true' | 'mixed' | 'false'`. */
  ariaChecked?: 'true' | 'mixed' | 'false';
  onToggleAll?: () => void;
  /** Currently active column being resized (for ARIA on the handle). */
  activeResizeColumn: string | null;
  testId?: string;
}
function ariaSortFor(sort: SortState | null, key: string): 'ascending' | 'descending' | 'none' {
  const dir = sort?.key === key ? sort.dir : null;

  if (dir === null) return 'none';
  return dir === 'asc' ? 'ascending' : 'descending';
}
export function TableHeader<T>(props: TableHeaderProps<T>): ReactNode {
  const {
    columns,
    sort,
    onToggleSort,
    widths,
    onResizeStart,
    onResizeAdjust,
    selectable,
    allSelected = false,
    partialSelected = false,
    ariaChecked,
    onToggleAll,
    activeResizeColumn,
    testId,
  } = props;
  const rootTestId = testId ?? 'table';
  // B5b-3: tri-state select-all — indeterminate is a DOM property, not an
  // attribute. React doesn't support it as a prop, so we toggle via ref.
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partialSelected && !allSelected;
    }
  }, [partialSelected, allSelected]);

  return (
    <thead className="table__head" data-testid={`${rootTestId}-head`}>
      <tr>
        {selectable ? (
          <th scope="col" className="table__select-cell table__head-select">
            <input
              ref={selectAllRef}
              type="checkbox"
              className="table__select-checkbox"
              data-testid={`${rootTestId}-select-all`}
              aria-label="Select all rows on this page"
              checked={allSelected}
              aria-checked={ariaChecked ?? (allSelected ? 'true' : 'false')}
              onChange={() => {
                if (onToggleAll !== undefined) onToggleAll();
              }}
            />
          </th>
        ) : null}
        {columns.map((col) => {
          const key = String(col.key);
          const ariaSort = ariaSortFor(sort, key);
          const isSortable = col.sortable === true;
          const width = widths[key] ?? col.width;
          const isResizable = col.resizable === true;
          const align = col.align ?? 'left';
          const thStyle: React.CSSProperties = {
            width,
            textAlign: align,
            position: 'relative',
          };
          const onSortKey = (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (isSortable) onToggleSort(key);
            }
          };
          const sortIndicator =
            ariaSort === 'ascending' ? '▲' : ariaSort === 'descending' ? '▼' : '';

          // B5b-4: keyboard resize — focusable <th> + ArrowLeft/ArrowRight.
          // Shift = larger step (matches Figma / common design-tool convention).
          const onKey = (e: KeyboardEvent<HTMLTableCellElement>) => {
            if (!isResizable || onResizeAdjust === undefined) return;
            const step = e.shiftKey ? 32 : 8;

            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              onResizeAdjust(key, -step);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              onResizeAdjust(key, step);
            }
          };

          return (
            <th
              key={key}
              scope="col"
              className={`table__header-cell ${col.className ?? ''}`.trim()}
              data-testid={`${rootTestId}-th-${key}`}
              aria-sort={isSortable ? ariaSort : undefined}
              tabIndex={isResizable ? 0 : undefined}
              onKeyDown={isResizable ? onKey : undefined}
              style={thStyle}
            >
              {isSortable ? (
                <button
                  type="button"
                  className="table__sort-button"
                  data-testid={`${rootTestId}-sort-${key}`}
                  onClick={() => {
                    onToggleSort(key);
                  }}
                  onKeyDown={onSortKey}
                  aria-label={`Sort by ${col.header}`}
                >
                  <span className="table__header-label">{col.header}</span>
                  <span className="table__sort-indicator" aria-hidden="true">
                    {sortIndicator}
                  </span>
                </button>
              ) : (
                <span className="table__header-label">{col.header}</span>
              )}
              {isResizable ? (
                <span
                  className="table__resize-handle"
                  data-testid={`${rootTestId}-resize-${key}`}
                  aria-hidden="true"
                  role="separator"
                  aria-orientation="vertical"
                  aria-valuenow={activeResizeColumn === key ? 1 : 0}
                  onMouseDown={onResizeStart(key, parsePx(width))}
                />
              ) : null}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
/** Parse a width string ("120px" / "8rem") into a numeric px for drag deltas. */
function parsePx(width: string | undefined): number {
  if (width === undefined) return 120;
  const m = width.match(/^(\d+(?:\.\d+)?)px$/);

  if (m?.[1] !== undefined) return Number(m[1]);
  // For non-px strings we start from a sane default; the consumer can
  // always reset to a px value via `width` prop on the column.
  return 120;
}
