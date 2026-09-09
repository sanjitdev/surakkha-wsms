/**
 * Table.types.ts — FE-B5b Layer-A primitive shared types.
 *
 * Pure type module — no runtime code (keeps the bundle entry tree-shakeable
 * and avoids accidental runtime side-effects per AD-FE-5). Consumed by
 * Table.tsx + TableHeader.tsx + TableBody.tsx + Pagination.tsx.
 */
import type { ReactNode } from 'react';

/** Sort direction cycle. `null` is the "no sort" terminal state. */
export type SortDir = 'asc' | 'desc' | null;
/** Sort state shape. `null` when no sort is active. */
export interface SortState {
  key: string;
  dir: SortDir;
}
/** Per-column width map. Keys are `TableColumn.key` strings; values are px strings. */
export type ResizeState = Record<string, string>;
/** Column descriptor. `key` can be a `keyof T` (for sorting) or any stable string. */
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  /** Custom cell renderer. Falls back to `String(row[key])` when omitted. */
  render?: (row: T, rowIndex: number) => ReactNode;
  /** Opt-in per the FE-B5b spec. When false, header click is a no-op. */
  sortable?: boolean;
  /** Initial width (CSS length string, e.g. "120px"). Mutated by drag. */
  width?: string;
  /** Cell text-align. Default "left". */
  align?: 'left' | 'right' | 'center';
  /** Opt-in per-column drag handle. */
  resizable?: boolean;
  /** Extra className appended to the `<th>` only (use for column-level modifiers). */
  className?: string;
  /** Extra className appended to the matching `<td>` cells (e.g. `table__cell--mono`). */
  cellClassName?: string;
}
/** Top-level Table props. Generic over the row record type. */
export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Property of T used as the unique row key for selection. Defaults to "id". */
  rowKey?: keyof T;
  selectable?: boolean;
  selectedRows?: Set<string>;
  onSelectionChange?: (rows: Set<string>) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  testId?: string;
  className?: string;
}
/** Pagination props — decoupled from Table per the FE-B5b design note. */
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  testId?: string;
}
