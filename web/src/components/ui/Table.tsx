/**
 * Table.tsx — FE-B5b composition root.
 *
 * Generic `Table<T>` over a row record. Owns the sort / selection / resize
 * state via the three use*Table* hooks. Empty + loading slots compose the
 * existing Layer-A primitives (`<EmptyState>`, skeleton `<td>`s).
 *
 * AD-FE-5 ceiling: kept ≤200 LoC. Heavier concerns (sorting, selection,
 * resize, header markup) live in dedicated per-file modules.
 */
import { type ReactNode, useCallback, useMemo } from 'react';
import '../../styles/table.css';
import { EmptyState } from '../layout/EmptyState';
import type { TableColumn, TableProps } from './Table.types';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { useTableSort } from './useTableSort';
import { useTableResize } from './useTableResize';

const SKELETON_ROW_COUNT = 5;

export function Table<T>(props: TableProps<T>): ReactNode {
  const {
    columns,
    rows,
    rowKey,
    selectable = false,
    selectedRows,
    onSelectionChange,
    loading = false,
    emptyState,
    testId = 'table',
    className = '',
  } = props;
  const effectiveRowKey: keyof T = rowKey ?? ('id' as keyof T);

  const { sort, onToggle, sortRows } = useTableSort<T>();
  const resize = useTableResize();

  const sortedRows = useMemo(() => sort !== null ? sortRows(rows) : rows, [rows, sort, sortRows]);

  const pageKeys = useMemo(() => sortedRows.map((row) => {
      const v = (row as Record<string, unknown>)[effectiveRowKey as string];

      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return '';
    }), [sortedRows, effectiveRowKey]);

  const allSelected = useMemo(() => {
    if (!selectable || pageKeys.length === 0) return false;
    if (selectedRows === undefined) return false;
    return pageKeys.every((k) => selectedRows.has(k));
  }, [selectable, pageKeys, selectedRows]);

  // B5b-3: tri-state — "some but not all" selected. Drives the indeterminate
  // DOM property + aria-checked="mixed" on the select-all checkbox.
  const partialSelected = useMemo(() => {
    if (!selectable || pageKeys.length === 0 || selectedRows === undefined) return false;
    if (allSelected) return false;
    return pageKeys.some((k) => selectedRows.has(k));
  }, [selectable, pageKeys, selectedRows, allSelected]);

  const ariaChecked = allSelected ? 'true' : partialSelected ? 'mixed' : 'false';

  const onToggleAll = useCallback(() => {
    if (onSelectionChange === undefined) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(pageKeys));
    }
  }, [allSelected, pageKeys, onSelectionChange]);

  // Loading state: render skeleton rows in <tbody> instead of empty-state.
  if (loading) {
    const colSpan = columns.length + (selectable ? 1 : 0);

    return (
      <div className={`table ${className}`.trim()} data-testid={`${testId}-loading`}>
        <table role="table" className="table__inner">
          <TableHeader<T>
            columns={columns}
            sort={null}
            onToggleSort={() => undefined}
            widths={resize.widths}
            onResizeStart={resize.onResizeStart}
            selectable={false}
            activeResizeColumn={null}
            testId={testId}
          />
          <tbody>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="table__row table__row--skeleton">
                  <td colSpan={colSpan} className="table__cell">
                    <span className="table__skeleton" aria-hidden="true" />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    if (emptyState !== undefined) {
      return (
        <div className={`table ${className}`.trim()} data-testid={`${testId}-empty`}>
          {emptyState}
        </div>
      );
    }
    return (
      <div className={`table ${className}`.trim()} data-testid={`${testId}-empty`}>
        <EmptyState
          icon={<span aria-hidden="true">∅</span>}
          heading="No matches"
          body="Try adjusting your filters or refreshing the page."
        />
      </div>
    );
  }

  return (
    <div className={`table ${className}`.trim()} data-testid={testId}>
      <table role="table" className="table__inner">
        <TableHeader<T>
          columns={columns}
          sort={sort}
          onToggleSort={onToggle}
          widths={resize.widths}
          onResizeStart={resize.onResizeStart}
          onResizeAdjust={resize.onResizeAdjust}
          selectable={selectable}
          allSelected={allSelected}
          partialSelected={partialSelected}
          ariaChecked={ariaChecked}
          onToggleAll={onToggleAll}
          activeResizeColumn={resize.activeColumn}
          testId={testId}
        />
        <TableBody<T>
          columns={columns}
          rows={sortedRows}
          rowKey={effectiveRowKey}
          selectable={selectable}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
          widths={resize.widths}
          testId={testId}
        />
      </table>
    </div>
  );
}
// Export the column type for ergonomics — keeps TableColumn import paths short.
export type { TableColumn };
