/**
 * FE-B5b-sort-a11y — Vitest checks for the sort comparator hardening
 * (null-last + Date branch), resize listener cleanup on unmount,
 * tri-state select-all (indeterminate + aria-checked="mixed"), and
 * keyboard resize (ArrowLeft/ArrowRight ±8px, Shift = ±32px).
 *
 * Cases (12 total):
 *   1) nulls_sort_last_in_asc — sort asc with mixed nulls; nulls at end.
 *   2) nulls_sort_last_in_desc — sort desc; nulls STILL at end (NULLS LAST).
 *   3) date_values_sort_chronologically — Date objects sort via getTime().
 *   4) mixed_null_and_number — nulls sort last across numbers.
 *   5) unmount_during_drag_removes_listeners — spies prove cleanup refs match.
 *   6) partial_selection_shows_indeterminate — 2-of-5 → indeterminate + mixed.
 *   7) all_selected_clears_indeterminate — all → not indeterminate + 'true'.
 *   8) none_selected_clears_indeterminate — none → not indeterminate + 'false'.
 *   9) arrow_right_grows_column_8px — keyboard resize +8px.
 *  10) shift_arrow_right_grows_32px — Shift + ArrowRight = +32px.
 *  11) arrow_left_shrinks_column_8px — keyboard resize -8px.
 *  12) arrow_left_clamped_at_min_width — clamps to 48px.
 *
 * `afterEach(() => { cleanup(); vi.restoreAllMocks(); })` per FE-1.3c review.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Table, type TableColumn } from '../components/ui/Table';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface Row {
  id: string;
  name: string | null;
  age: number | null;
}

const ROWS_NULL: Row[] = [
  { id: 'r1', name: 'Banana', age: 1 },
  { id: 'r2', name: null, age: 2 },
  { id: 'r3', name: 'Apple', age: 3 },
  { id: 'r4', name: null, age: 4 },
  { id: 'r5', name: 'Cherry', age: 5 },
];

const ROWS_NUMBER_NULL: Row[] = [
  { id: 'r1', name: 'x', age: 1 },
  { id: 'r2', name: 'y', age: null },
  { id: 'r3', name: 'z', age: 3 },
  { id: 'r4', name: 'w', age: null },
  { id: 'r5', name: 'v', age: 2 },
];

const COLS_NAME: TableColumn<Row>[] = [
  { key: 'name', header: 'name', sortable: true, width: '120px' },
  { key: 'id', header: 'id' },
];

const COLS_AGE: TableColumn<Row>[] = [
  { key: 'age', header: 'age', sortable: true, width: '80px' },
  { key: 'id', header: 'id' },
];

const COLS_RESIZABLE: TableColumn<Row>[] = [
  { key: 'name', header: 'name', sortable: true, resizable: true, width: '120px' },
  { key: 'id', header: 'id' },
];

interface DateRow {
  id: string;
  d: Date;
}

const DATE_ROWS: DateRow[] = [
  { id: 'r1', d: new Date('2024-03-01T00:00:00Z') },
  { id: 'r2', d: new Date('2024-01-01T00:00:00Z') },
  { id: 'r3', d: new Date('2024-02-01T00:00:00Z') },
];

const DATE_COLS: TableColumn<DateRow>[] = [
  { key: 'd', header: 'date', sortable: true },
  { key: 'id', header: 'id' },
];

/** Read a row by its id (matches `data-testid="${testId}-row-${id}"`). */
function rowById(testId: string, id: string): HTMLElement | null {
  return screen.queryByTestId(`${testId}-row-${id}`);
}

describe('FE-B5b-sort-a11y sort comparator', () => {
  // (1) nulls last — asc.
  it('nulls_sort_last_in_asc: asc sort → nulls at end', () => {
    render(<Table<Row> columns={COLS_NAME} rows={ROWS_NULL} testId="sort-a11y" />);
    act(() => {
      fireEvent.click(screen.getByTestId('sort-a11y-sort-name'));
    });
    // asc by name with nulls last: Apple (r3), Banana (r1), Cherry (r5),
    // then null rows r2, r4.
    expect(rowById('sort-a11y', 'r3')?.textContent).toContain('Apple');
    expect(rowById('sort-a11y', 'r1')?.textContent).toContain('Banana');
    expect(rowById('sort-a11y', 'r5')?.textContent).toContain('Cherry');
    // Null-named rows still render at index 3 + 4. Verify their textContent
    // does NOT contain Apple/Banana/Cherry (they render as empty name cells).
    const r2 = rowById('sort-a11y', 'r2');
    const r4 = rowById('sort-a11y', 'r4');

    expect(r2).toBeTruthy();
    expect(r4).toBeTruthy();
    // Both null-name rows should sit after the Cherry row.
    const allRows = screen.getAllByTestId(/^sort-a11y-row-/);
    const cherryIdx = allRows.findIndex((r) => r.textContent?.includes('Cherry'));

    expect(cherryIdx).toBe(2);
    // r2 and r4 appear at index 3 and 4.
    const r2Idx = allRows.findIndex((r) => r === r2);
    const r4Idx = allRows.findIndex((r) => r === r4);

    expect(r2Idx).toBeGreaterThan(cherryIdx);
    expect(r4Idx).toBeGreaterThan(cherryIdx);
  });

  // (2) nulls last — desc (same direction handling).
  it('nulls_sort_last_in_desc: desc sort → nulls STILL at end', () => {
    render(<Table<Row> columns={COLS_NAME} rows={ROWS_NULL} testId="sort-a11y" />);
    // First click → asc, second click → desc.
    act(() => {
      fireEvent.click(screen.getByTestId('sort-a11y-sort-name'));
    });
    act(() => {
      fireEvent.click(screen.getByTestId('sort-a11y-sort-name'));
    });
    const th = screen.getByTestId('sort-a11y-th-name');
    expect(th.getAttribute('aria-sort')).toBe('descending');
    // In desc, named values sort reverse: Cherry, Banana, Apple; nulls STILL last.
    expect(rowById('sort-a11y', 'r5')?.textContent).toContain('Cherry');
    expect(rowById('sort-a11y', 'r1')?.textContent).toContain('Banana');
    expect(rowById('sort-a11y', 'r3')?.textContent).toContain('Apple');
    const allRows = screen.getAllByTestId(/^sort-a11y-row-/);
    const cherryIdx = allRows.findIndex((r) => r.textContent?.includes('Cherry'));
    const r2 = rowById('sort-a11y', 'r2');
    const r4 = rowById('sort-a11y', 'r4');
    const r2Idx = allRows.findIndex((r) => r === r2);
    const r4Idx = allRows.findIndex((r) => r === r4);

    expect(cherryIdx).toBe(0);
    expect(r2Idx).toBeGreaterThan(cherryIdx);
    expect(r4Idx).toBeGreaterThan(cherryIdx);
  });

  // (3) Date branch — chronological ordering via getTime().
  it('date_values_sort_chronologically: Date values sort Jan→Feb→Mar asc', () => {
    render(<Table<DateRow> columns={DATE_COLS} rows={DATE_ROWS} testId="sort-a11y" />);
    act(() => {
      fireEvent.click(screen.getByTestId('sort-a11y-sort-d'));
    });
    const th = screen.getByTestId('sort-a11y-th-d');
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    // Asc by date: r2 (Jan) → r3 (Feb) → r1 (Mar).
    const allRows = screen.getAllByTestId(/^sort-a11y-row-/);

    expect(allRows[0]?.getAttribute('data-testid')).toBe('sort-a11y-row-r2');
    expect(allRows[1]?.getAttribute('data-testid')).toBe('sort-a11y-row-r3');
    expect(allRows[2]?.getAttribute('data-testid')).toBe('sort-a11y-row-r1');
  });

  // (4) mixed null + number.
  it('mixed_null_and_number: nulls sort last across numeric sort', () => {
    render(<Table<Row> columns={COLS_AGE} rows={ROWS_NUMBER_NULL} testId="sort-a11y" />);
    act(() => {
      fireEvent.click(screen.getByTestId('sort-a11y-sort-age'));
    });
    const allRows = screen.getAllByTestId(/^sort-a11y-row-/);
    // asc by age with nulls last: 1 (r1), 2 (r5), 3 (r3), null (r2), null (r4).
    expect(allRows[0]?.getAttribute('data-testid')).toBe('sort-a11y-row-r1');
    expect(allRows[1]?.getAttribute('data-testid')).toBe('sort-a11y-row-r5');
    expect(allRows[2]?.getAttribute('data-testid')).toBe('sort-a11y-row-r3');
    expect(allRows[3]?.getAttribute('data-testid')).toBe('sort-a11y-row-r2');
    expect(allRows[4]?.getAttribute('data-testid')).toBe('sort-a11y-row-r4');
  });
});

describe('FE-B5b-sort-a11y resize cleanup', () => {
  // (5) unmount_during_drag — spies prove removeEventListener uses the same fn refs.
  it('unmount_during_drag_removes_listeners: removeEventListener uses same fn refs', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          {open ? <Table<Row> columns={COLS_RESIZABLE} rows={ROWS_NULL} testId="sort-a11y" /> : null}
          <button type="button" data-testid="unmount-trigger" onClick={() => setOpen(false)}>
            unmount
          </button>
        </>
      );
    }
    render(<Harness />);

    const handle = screen.getByTestId('sort-a11y-resize-name');
    act(() => {
      fireEvent.mouseDown(handle, { clientX: 100 });
    });

    // After mouseDown, the hook stored `onMove` + `onUp` refs.
    const addedAfterMouseDown = addSpy.mock.calls.filter((c) => c[0] === 'mousemove' || c[0] === 'mouseup');
    const moveAdded = addedAfterMouseDown.find((c) => c[0] === 'mousemove');
    const upAdded = addedAfterMouseDown.find((c) => c[0] === 'mouseup');

    expect(moveAdded).toBeTruthy();
    expect(upAdded).toBeTruthy();

    // Now unmount — cleanup should removeEventListener with same function refs.
    act(() => {
      fireEvent.click(screen.getByTestId('unmount-trigger'));
    });

    const removed = removeSpy.mock.calls.filter((c) => c[0] === 'mousemove' || c[0] === 'mouseup');
    const moveRemoved = removed.find((c) => c[0] === 'mousemove');
    const upRemoved = removed.find((c) => c[0] === 'mouseup');

    expect(moveRemoved).toBeTruthy();
    expect(upRemoved).toBeTruthy();
    // Same function reference was used at add and at remove (B5b-2 contract).
    expect(moveRemoved?.[1]).toBe(moveAdded?.[1]);
    expect(upRemoved?.[1]).toBe(upAdded?.[1]);
  });
});

describe('FE-B5b-sort-a11y tri-state select-all', () => {
  // (6) partial → indeterminate + aria-checked="mixed".
  it('partial_selection_shows_indeterminate: 2-of-5 → indeterminate=true + aria-checked=mixed', () => {
    function Harness() {
      const [sel, setSel] = useState<Set<string>>(new Set(['r1', 'r3']));
      return (
        <Table<Row>
          columns={COLS_NAME}
          rows={ROWS_NULL}
          selectable
          selectedRows={sel}
          onSelectionChange={setSel}
          testId="sort-a11y"
        />
      );
    }
    render(<Harness />);
    const cb = screen.getByTestId('sort-a11y-select-all') as HTMLInputElement;

    expect(cb.indeterminate).toBe(true);
    expect(cb.getAttribute('aria-checked')).toBe('mixed');
    // `checked` is the boolean prop (still false in partial).
    expect(cb.checked).toBe(false);
  });

  // (7) all selected → indeterminate=false + aria-checked="true".
  it('all_selected_clears_indeterminate: all 5 → indeterminate=false + aria-checked=true', () => {
    function Harness() {
      const [sel, setSel] = useState<Set<string>>(new Set(['r1', 'r2', 'r3', 'r4', 'r5']));
      return (
        <Table<Row>
          columns={COLS_NAME}
          rows={ROWS_NULL}
          selectable
          selectedRows={sel}
          onSelectionChange={setSel}
          testId="sort-a11y"
        />
      );
    }
    render(<Harness />);
    const cb = screen.getByTestId('sort-a11y-select-all') as HTMLInputElement;

    expect(cb.indeterminate).toBe(false);
    expect(cb.getAttribute('aria-checked')).toBe('true');
    expect(cb.checked).toBe(true);
  });

  // (8) none selected → indeterminate=false + aria-checked="false".
  it('none_selected_clears_indeterminate: empty selection → indeterminate=false + aria-checked=false', () => {
    function Harness() {
      const [sel, setSel] = useState<Set<string>>(new Set());
      return (
        <Table<Row>
          columns={COLS_NAME}
          rows={ROWS_NULL}
          selectable
          selectedRows={sel}
          onSelectionChange={setSel}
          testId="sort-a11y"
        />
      );
    }
    render(<Harness />);
    const cb = screen.getByTestId('sort-a11y-select-all') as HTMLInputElement;

    expect(cb.indeterminate).toBe(false);
    expect(cb.getAttribute('aria-checked')).toBe('false');
    expect(cb.checked).toBe(false);
  });
});

describe('FE-B5b-sort-a11y keyboard resize', () => {
  // (9) ArrowRight grows by 8px.
  it('arrow_right_grows_column_8px: focus <th> + ArrowRight → width = 128px', () => {
    render(<Table<Row> columns={COLS_RESIZABLE} rows={ROWS_NULL} testId="sort-a11y" />);
    const th = screen.getByTestId('sort-a11y-th-name');
    act(() => {
      th.focus();
      fireEvent.keyDown(th, { key: 'ArrowRight' });
    });
    const style = th.getAttribute('style') ?? '';
    expect(style).toMatch(/128px/);
  });

  // (10) Shift+ArrowRight grows by 32px.
  it('shift_arrow_right_grows_32px: focus <th> + Shift+ArrowRight → width = 152px', () => {
    render(<Table<Row> columns={COLS_RESIZABLE} rows={ROWS_NULL} testId="sort-a11y" />);
    const th = screen.getByTestId('sort-a11y-th-name');
    act(() => {
      th.focus();
      fireEvent.keyDown(th, { key: 'ArrowRight', shiftKey: true });
    });
    const style = th.getAttribute('style') ?? '';
    expect(style).toMatch(/152px/);
  });

  // (11) ArrowLeft shrinks by 8px.
  it('arrow_left_shrinks_column_8px: focus <th> + ArrowLeft → width = 112px', () => {
    render(<Table<Row> columns={COLS_RESIZABLE} rows={ROWS_NULL} testId="sort-a11y" />);
    const th = screen.getByTestId('sort-a11y-th-name');
    act(() => {
      th.focus();
      fireEvent.keyDown(th, { key: 'ArrowLeft' });
    });
    const style = th.getAttribute('style') ?? '';
    expect(style).toMatch(/112px/);
  });

  // (12) ArrowLeft clamped at min 48px.
  it('arrow_left_clamped_at_min_width: many Shift+ArrowLeft → width stops at 48px', () => {
    render(<Table<Row> columns={COLS_RESIZABLE} rows={ROWS_NULL} testId="sort-a11y" />);
    const th = screen.getByTestId('sort-a11y-th-name');
    act(() => {
      th.focus();
      // 120px → -32px step x 10 = -320 → should clamp at 48px.
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(th, { key: 'ArrowLeft', shiftKey: true });
      }
    });
    const style = th.getAttribute('style') ?? '';
    expect(style).toMatch(/48px/);
  });
});
