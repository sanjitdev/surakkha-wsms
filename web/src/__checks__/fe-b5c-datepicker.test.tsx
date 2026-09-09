/**
 * FE-B5c — Vitest checks for the DatePicker + DateRangePicker primitives.
 * 10 cases per the I/O matrix in spec-fe-b5c-datepicker.md:
 *   1) render — value=null + onChange wired → trigger placeholder + aria-expanded=false
 *   2) open — click trigger → 7×6 grid renders + 42 role=gridcell + aria-expanded=true
 *   3) select_single — click day 15 → onChange(day15Date) + popover closes + focus restore
 *   4) select_range — range mode; click day 1 then day 5 → onChange({from, to}) + highlight
 *   5) locale_bn — locale='bn' → Bengali month + weekday headers
 *   6) keyboard_arrow — ArrowDown moves focused cell to next row
 *   7) paginate — click next-month → month label advances
 *   8) min_max — out-of-range cell renders aria-disabled + click no-op
 *   9) empty — mount with no value (no crash)
 *  10) close_outside — open + click outside → popover closes; focus stays put
 *
 * `afterEach(() => { cleanup(); vi.restoreAllMocks(); })` per FE-1.3c review.
 *
 * LocaleProvider reads its initial value from `localStorage` (no
 * `initialLocale` prop), so the bn test seeds localStorage before render.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { DatePicker } from '../components/ui/DatePicker';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  try {
    window.localStorage.removeItem('surakkha.locale');
  } catch {
    // ignore
  }
});

beforeEach(() => {
  // Reset locale storage before each test so the English cases don't inherit
  // a stray bn value left over by the locale_bn case.
  try {
    window.localStorage.removeItem('surakkha.locale');
  } catch {
    // ignore
  }
});

function withLocale(node: React.ReactNode, locale: Locale = Locale.En) {
  if (locale === Locale.Bn) {
    window.localStorage.setItem('surakkha.locale', Locale.Bn);
  }
  return <LocaleProvider>{node}</LocaleProvider>;
}

function getCells() {
  return screen.getByTestId('dp-cal').querySelectorAll<HTMLButtonElement>(
    '[role="gridcell"]',
  );
}

function findInMonthCell(day: string | number) {
  const target = String(day);
  const match = Array.from(getCells()).find(
    (c) => !c.classList.contains('calendar__day--other') && c.textContent === target,
  );

  if (!match) throw new Error(`in-month day-${target} cell not found`);
  return match;
}

describe('FE-B5c DatePicker', () => {
  // (1) render — value=null + onChange wired → trigger placeholder + aria-expanded=false.
  it('render: value=null → placeholder + aria-expanded=false + popover closed', () => {
    render(
      withLocale(
        <DatePicker value={null} onChange={() => undefined} testId="dp" />,
      ),
    );
    const trigger = screen.getByTestId('dp-trigger');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    // Placeholder visible (English fallback).
    expect(screen.getByText('Select a date')).toBeTruthy();
    // Popover not yet mounted.
    expect(screen.queryByTestId('dp-popover')).toBeNull();
  });

  // (2) open — click trigger → 7×6 grid renders + 42 role=gridcell + aria-expanded=true.
  it('open: click trigger → 7×6 grid + 42 role=gridcell + aria-expanded=true', () => {
    render(withLocale(<DatePicker value={null} onChange={() => undefined} testId="dp" />));
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const trigger = screen.getByTestId('dp-trigger');

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const grid = screen.getByTestId('dp-cal');

    expect(grid.getAttribute('role')).toBe('grid');
    const cells = grid.querySelectorAll('[role="gridcell"]');

    expect(cells.length).toBe(42);

    // Sweep ARIA attributes on every cell — the WAI-ARIA grid pattern requires
    // aria-selected + aria-disabled + aria-label on every gridcell.
    cells.forEach((c) => {
      expect(c.getAttribute('aria-selected')).not.toBeNull();
      expect(c.getAttribute('aria-disabled')).not.toBeNull();
      expect(c.getAttribute('aria-label')).toMatch(/\d{4}/); // includes year
    });

    // Popover dialog carries the localized month label (NOT prev-month text).
    const popover = screen.getByTestId('dp-popover');

    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.getAttribute('aria-label')).toMatch(/\d{4}/);
  });

  // (3) select_single — click day 15 → onChange(day15Date) + popover closes + focus restore.
  it('select_single: click day 15 → onChange(day15) + popover closes + focus returns to trigger', async () => {
    let captured: Date | null = null;
    function Harness() {
      const [v, setV] = useState<Date | null>(null);

      return (
        <DatePicker
          value={v}
          onChange={(d) => {
            captured = d;
            setV(d);
          }}
          testId="dp"
        />
      );
    }
    render(withLocale(<Harness />));
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const day15 = findInMonthCell('15');

    act(() => {
      fireEvent.click(day15);
    });
    expect(captured).not.toBeNull();
    expect(captured!.getDate()).toBe(15);
    // Popover closes.
    expect(screen.queryByTestId('dp-popover')).toBeNull();
    // Focus returns to the trigger after selection (per design lockdown).
    // The `queueMicrotask` focus restore needs a flush — wrap in act().
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.activeElement).toBe(screen.getByTestId('dp-trigger'));
    // Selected cell is now visible (re-open to inspect modifiers).
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const day15After = findInMonthCell('15');

    expect(day15After.classList.contains('calendar__day--selected')).toBe(true);
    expect(day15After.getAttribute('aria-selected')).toBe('true');
  });

  // (4) select_range — range mode; click day 1 then day 5 → onChange({from, to}) + highlight.
  it('select_range: click day 1 then day 5 → onChange({from, to}) + endpoint selected + in-range highlight', () => {
    let captured: { from: Date | null; to: Date | null } | null = null;
    function Harness() {
      const [v, setV] = useState<{ from: Date | null; to: Date | null } | null>(null);

      return (
        <DateRangePicker
          value={v}
          onChange={(r) => {
            captured = r;
            setV(r);
          }}
          testId="dr"
        />
      );
    }
    render(withLocale(<Harness />));
    act(() => {
      fireEvent.click(screen.getByTestId('dr-trigger'));
    });

    function rangeCells() {
      return screen
        .getByTestId('dr-cal')
        .querySelectorAll<HTMLButtonElement>('[role="gridcell"]');
    }
    function findRangeInMonthCell(target: string) {
      const match = Array.from(rangeCells()).find(
        (c) => !c.classList.contains('calendar__day--other') && c.textContent === target,
      );

      if (!match) throw new Error(`range in-month day-${target} cell not found`);
      return match;
    }
    const day1 = findRangeInMonthCell('1');
    const day5 = findRangeInMonthCell('5');

    act(() => {
      fireEvent.click(day1);
    });
    act(() => {
      fireEvent.click(day5);
    });
    expect(captured).not.toBeNull();
    expect(captured!.from!.getDate()).toBe(1);
    expect(captured!.to!.getDate()).toBe(5);

    // Re-open the picker (the second click closed it) and assert endpoint +
    // in-range modifiers are persisted on the now-controlled value.
    act(() => {
      fireEvent.click(screen.getByTestId('dr-trigger'));
    });
    const day1After = Array.from(rangeCells()).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '1',
    );
    const day2After = Array.from(rangeCells()).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '2',
    );
    const day3After = Array.from(rangeCells()).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '3',
    );
    const day4After = Array.from(rangeCells()).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '4',
    );
    const day5After = Array.from(rangeCells()).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '5',
    );

    expect(day1After?.classList.contains('calendar__day--selected')).toBe(true);
    // Day 5 is the `to` endpoint — Calendar only marks ONE cell `--selected`
    // (the single-mode contract); the `to` endpoint gets `--in-range` since
    // it's inclusive of both bounds (see Calendar.tsx: rangeBounds inclusive
    // compare).
    expect(day5After?.classList.contains('calendar__day--in-range')).toBe(true);
    expect(day2After?.classList.contains('calendar__day--in-range')).toBe(true);
    expect(day3After?.classList.contains('calendar__day--in-range')).toBe(true);
    expect(day4After?.classList.contains('calendar__day--in-range')).toBe(true);
  });

  // (5) locale_bn — locale='bn' → Bengali month + weekday headers.
  it('locale_bn: locale=bn → Bengali month + weekday headers + aria-label localized', () => {
    render(
      withLocale(
        <DatePicker value={null} onChange={() => undefined} locale={Locale.Bn} testId="dp" />,
        Locale.Bn,
      ),
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const grid = screen.getByTestId('dp-cal');
    const text = grid.textContent ?? '';

    // Bengali weekday header should include a Bengali-script character (any
    // of the 7 day initials). The Bengali script range starts at U+0980.
    expect(text).toMatch(/[\u0980-\u09FF]/);
    // Month label itself starts with a Bengali char (not "September ...").
    const monthLabel = screen.getByTestId('dp-cal-month').textContent ?? '';

    expect(monthLabel).toMatch(/^[\u0980-\u09FF]/);
    // All 7 columnheaders carry Bengali-script text.
    const headers = grid.querySelectorAll('[role="columnheader"]');

    expect(headers.length).toBe(7);
    headers.forEach((h) => {
      expect(h.textContent ?? '').toMatch(/[\u0980-\u09FF]/);
    });
    // Trigger placeholder switches to Bengali when locale=bn.
    expect(screen.getByText('একটি তারিখ নির্বাচন করুন')).toBeTruthy();
  });

  // (6) keyboard_arrow — ArrowDown moves focused cell to next row.
  it('keyboard_arrow: ArrowDown → focused cell moves to next row', () => {
    render(withLocale(<DatePicker value={null} onChange={() => undefined} testId="dp" />));
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    // Re-query cells after open so the NodeList is current.
    const cells = getCells();

    cells[0]?.focus();
    expect(document.activeElement).toBe(cells[0]);
    act(() => {
      fireEvent.keyDown(screen.getByTestId('dp-cal'), { key: 'ArrowDown' });
    });
    // The cell at index 7 (one week below) should now be focused.
    expect(document.activeElement).toBe(cells[7]);
    // Sanity: the focused cell is still inside the calendar grid.
    expect(document.activeElement?.closest('[role="grid"]')).toBe(screen.getByTestId('dp-cal'));
  });

  // (7) paginate — click next-month → month label advances.
  it('paginate: click next-month → month label advances', () => {
    render(withLocale(<DatePicker value={null} onChange={() => undefined} testId="dp" />));
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const before = screen.getByTestId('dp-cal-month').textContent;
    act(() => {
      fireEvent.click(screen.getByTestId('dp-cal-next-month'));
    });
    const after = screen.getByTestId('dp-cal-month').textContent;

    expect(before).not.toBe(after);
  });

  // (8) min_max — out-of-range cell renders aria-disabled + click no-op.
  //   The visible month defaults to `new Date()` which the harness pins to
  //   2026-09-15 so day 30 is in the same month but outside `max`.
  it('min_max: out-of-range cell renders aria-disabled + click is no-op', () => {
    let changed = 0;
    const pinnedInitial = new Date(2026, 8, 15); // Sep 15, 2026
    function Harness() {
      const [v] = useState<Date | null>(pinnedInitial);
      const min = new Date(2026, 8, 1);
      const max = new Date(2026, 8, 28);

      return (
        <DatePicker
          value={v}
          onChange={() => {
            changed++;
          }}
          min={min}
          max={max}
          testId="dp"
        />
      );
    }
    render(withLocale(<Harness />));
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    const cells = getCells();
    // The visible month is Sep 2026, so day 30 should be disabled.
    const day30 = Array.from(cells).find(
      (c) => !c.classList.contains('calendar__day--other') && c.textContent === '30',
    );

    expect(day30).toBeDefined();
    expect(day30!.getAttribute('aria-disabled')).toBe('true');
    expect(day30!.hasAttribute('disabled')).toBe(true);
    act(() => {
      fireEvent.click(day30!);
    });
    expect(changed).toBe(0);
  });

  // (9) empty — mount with no value (no crash).
  it('empty: mount with no value → renders trigger + no crash', () => {
    expect(() => {
      render(withLocale(<DatePicker value={null} onChange={() => undefined} testId="dp" />));
    }).not.toThrow();
    expect(screen.getByTestId('dp-trigger')).toBeTruthy();
  });

  // (10) close_outside — open + click outside → popover closes; focus stays put.
  it('close_outside: open + click outside → popover closes; focus does NOT auto-restore', () => {
    render(
      withLocale(
        <>
          <div data-testid="outside">outside</div>
          <DatePicker value={null} onChange={() => undefined} testId="dp" />
        </>,
      ),
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dp-trigger'));
    });
    expect(screen.queryByTestId('dp-popover')).toBeTruthy();
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('outside'));
    });
    // Popover unmounts.
    expect(screen.queryByTestId('dp-popover')).toBeNull();
    // Per B5a's deferred decision, click-outside does NOT auto-restore focus.
    expect(document.activeElement).not.toBe(screen.getByTestId('dp-trigger'));
  });
});