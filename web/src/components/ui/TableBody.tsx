/**
 * TableBody.tsx — FE-B5b <tbody> renderer.
 *
 * Per-row `<tr>` + per-column `<td>`. When `selectable`, prepends a
 * checkbox column; Space/Enter on the row checkbox toggles selection.
 */
import type { KeyboardEvent, ReactNode } from 'react';
import type { ResizeState, TableColumn } from './Table.types';

export interface TableBodyProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: keyof T;
  selectable: boolean;
  selectedRows: Set<string> | undefined;
  onSelectionChange?: ((next: Set<string>) => void) | undefined;
  widths: ResizeState;
  testId?: string;
}
function rowKeyOf<T>(row: T, key: keyof T): string {
  const v = row[key];

  if (v === null || v === undefined) return '';
  return String(v);
}
export function TableBody<T>(props: TableBodyProps<T>): ReactNode {
  const { columns, rows, rowKey, selectable, selectedRows, onSelectionChange, widths, testId } = props;
  const rootTestId = testId ?? 'table';

  const onCheckboxKey = (
    e: KeyboardEvent<HTMLInputElement>,
    row: T,
  ) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!selectable || onSelectionChange === undefined) return;
      const k = rowKeyOf(row, rowKey);
      const next = new Set(selectedRows ?? []);

      if (next.has(k)) next.delete(k);
      else next.add(k);
      onSelectionChange(next);
    }
  };

  const onToggleRow = (row: T) => {
    if (!selectable || onSelectionChange === undefined) return;
    const k = rowKeyOf(row, rowKey);
    const next = new Set(selectedRows ?? []);

    if (next.has(k)) next.delete(k);
    else next.add(k);
    onSelectionChange(next);
  };

  return (
    <tbody className="table__body" data-testid={`${rootTestId}-body`}>
      {rows.map((row, rowIndex) => {
        const k = rowKeyOf(row, rowKey);
        const checked = selectedRows?.has(k) ?? false;

        return (
          <tr
            key={k === '' ? String(rowIndex) : k}
            className="table__row"
            data-testid={`${rootTestId}-row-${k === '' ? String(rowIndex) : k}`}
          >
            {selectable ? (
              <td className="table__select-cell">
                <input
                  type="checkbox"
                  className="table__select-checkbox"
                  data-testid={`${rootTestId}-select-${k}`}
                  aria-label={`Select row ${k}`}
                  checked={checked}
                  onChange={() => {
                    onToggleRow(row);
                  }}
                  onKeyDown={(e) => {
                    onCheckboxKey(e, row);
                  }}
                />
              </td>
            ) : null}
            {columns.map((col) => {
              const ckey = String(col.key);
              const width = widths[ckey] ?? col.width;
              const align = col.align ?? 'left';
              const tdStyle: React.CSSProperties = {
                width,
                textAlign: align,
              };

              return (
                <td
                  key={ckey}
                  className={`table__cell ${col.className ?? ''}`.trim()}
                  style={tdStyle}
                >
                  {col.render !== undefined
                    ? col.render(row, rowIndex)
                    : (() => {
                        const v = (row as Record<string, unknown>)[ckey];

                        if (v === null || v === undefined) return '';
                        if (typeof v === 'string') return v;
                        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
                        return '';
                      })()}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  );
}
