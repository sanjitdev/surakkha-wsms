/**
 * Calendar.tsx — FE-B5c Layer-A primitive (DOM surface).
 *
 * Renders a 7×6 month grid implementing the WAI-ARIA grid pattern:
 *   - `<div role="grid">` wrapping the grid
 *   - `<div role="row">` per week
 *   - `<button role="gridcell">` per day, with `aria-selected` + `aria-disabled`
 *     + `aria-label` (full localized date string).
 * Keyboard nav: Arrow keys move focus; PageUp/Down moves month; Shift+PageUp/Down
 * moves year; Home/End jumps to start/end of week; Enter/Space selects;
 * Escape closes the popover (handled by the parent).
 *
 * Selected state is *single* — one selected cell at a time. Range highlighting
 * (the `--in-range` modifier) is applied via the `rangeFrom` + `rangeTo` props.
 */
import '../../styles/datepicker.css';
import { type KeyboardEvent, useCallback, useMemo } from 'react';
import type { CalendarCell, UseCalendarResult } from './useCalendar';
export interface CalendarProps {
  /** Result from useCalendar — owns the cells + month label + nav handlers. */
  calendar: UseCalendarResult;
  /** Currently-selected date (single mode) or null. */
  selected: Date | null;
  /** Fires when the user activates a non-disabled cell. */
  onSelect: (d: Date) => void;
  /** Optional range highlight — cells whose `date` falls between these
   *  (inclusive) get the `--in-range` modifier. */
  rangeFrom?: Date | null;
  rangeTo?: Date | null;
  /** Called when the user presses Escape — parent typically closes popover. */
  onEscape?: () => void;
  /** i18n strings (provided by DatePicker parent). */
  labels: {
    previousMonth: string;
    nextMonth: string;
    previousYear: string;
    nextYear: string;
    today: string;
  };
  /** Root testid prefix. */
  testId?: string;
}
export function Calendar({
  calendar,
  selected,
  onSelect,
  rangeFrom,
  rangeTo,
  onEscape,
  labels,
  testId = 'calendar',
}: CalendarProps) {
  const {
    cells, weekdays, monthLabel, nextMonth, prevMonth, nextYear, prevYear,
    isSameDay, formatDateLabel,
  } = calendar;
  // Cache the [lo,hi] range bounds so JSX stays a single comparison per cell.
  const rangeBounds = useMemo(() => {
    if (!rangeFrom || !rangeTo) return null;
    const lo = Math.min(rangeFrom.getTime(), rangeTo.getTime());
    const hi = Math.max(rangeFrom.getTime(), rangeTo.getTime());

    return { lo, hi };
  }, [rangeFrom, rangeTo]);
  // Build a 6-row chunking of the cells (always 7 per row).
  const weeks = useMemo(() => {
    const out: CalendarCell[][] = [];

    for (let i = 0; i < 6; i++) out.push(cells.slice(i * 7, i * 7 + 7));
    return out;
  }, [cells]);
  const onKeyDown = useCallback((ev: KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const focusedIdx = active?.dataset.cellIndex ? Number(active.dataset.cellIndex) : -1;
    const idx = focusedIdx >= 0 ? focusedIdx : (() => {
      if (!selected) return -1;
      return cells.findIndex((c) => isSameDay(c.date, selected));
    })();

    if (idx < 0) return;
    let nextIdx = idx;

    switch (ev.key) {
      case 'ArrowLeft': nextIdx = Math.max(0, idx - 1); break;
      case 'ArrowRight': nextIdx = Math.min(cells.length - 1, idx + 1); break;
      case 'ArrowUp': nextIdx = Math.max(0, idx - 7); break;
      case 'ArrowDown': nextIdx = Math.min(cells.length - 1, idx + 7); break;
      case 'Home': nextIdx = idx - (idx % 7); break;
      case 'End': nextIdx = idx + (6 - (idx % 7)); break;
      case 'PageDown':
        if (ev.shiftKey) nextYear();
        else nextMonth();
        ev.preventDefault();
        return;
      case 'PageUp':
        if (ev.shiftKey) prevYear();
        else prevMonth();
        ev.preventDefault();
        return;
      case 'Enter':
      case ' ': {
        const cell = cells[idx];

        if (!cell.isDisabled) {
          onSelect(cell.date);
          ev.preventDefault();
        }
        return;
      }
      case 'Escape':
        onEscape?.();
        ev.preventDefault();
        return;
      default:
        return;
    }
    if (nextIdx !== idx) {
      ev.preventDefault();
      const target = document.querySelector<HTMLButtonElement>(
        `[data-testid="${testId}-cell"][data-cell-index="${nextIdx}"]`,
      );

      target?.focus();
    }
  }, [cells, isSameDay, nextMonth, prevMonth, nextYear, prevYear, onSelect, onEscape, selected, testId]);

  return (
    <div role="grid" aria-label={monthLabel} data-testid={testId}
      onKeyDown={onKeyDown} className="calendar" tabIndex={-1}>
      <div className="calendar__header">
        <button type="button" className="calendar__nav calendar__nav--year"
          aria-label={labels.previousYear} data-testid={`${testId}-prev-year`}
          onClick={prevYear}>«</button>
        <button type="button" className="calendar__nav calendar__nav--month"
          aria-label={labels.previousMonth} data-testid={`${testId}-prev-month`}
          onClick={prevMonth}>‹</button>
        <div className="calendar__label" data-testid={`${testId}-month`}>
          {monthLabel}
        </div>
        <button type="button" className="calendar__nav calendar__nav--month"
          aria-label={labels.nextMonth} data-testid={`${testId}-next-month`}
          onClick={nextMonth}>›</button>
        <button type="button" className="calendar__nav calendar__nav--year"
          aria-label={labels.nextYear} data-testid={`${testId}-next-year`}
          onClick={nextYear}>»</button>
      </div>
      <div className="calendar__weekdays" role="row">
        {weekdays.map((w) => (
          <div key={w} className="calendar__weekday" role="columnheader">{w}</div>
        ))}
      </div>
      {weeks.map((week, wIdx) => (
        <div key={wIdx} className="calendar__week" role="row"
          data-testid={`${testId}-week-${wIdx}`}>
          {week.map((cell, cIdx) => {
            const idx = wIdx * 7 + cIdx;
            const isSelected = selected !== null && isSameDay(cell.date, selected);
            const t = cell.date.getTime();
            const inRange = rangeBounds !== null && t >= rangeBounds.lo && t <= rangeBounds.hi;
            const className = [
              'calendar__day',
              cell.inMonth ? '' : 'calendar__day--other',
              cell.isToday ? 'calendar__day--today' : '',
              isSelected ? 'calendar__day--selected' : '',
              inRange ? 'calendar__day--in-range' : '',
              cell.isDisabled ? 'calendar__day--disabled' : '',
            ].filter(Boolean).join(' ');

            return (
              <button key={idx} type="button" role="gridcell"
                aria-selected={isSelected} aria-disabled={cell.isDisabled}
                aria-label={formatDateLabel(cell.date)} data-testid={`${testId}-cell`}
                data-cell-index={idx} className={className} disabled={cell.isDisabled}
                onClick={() => { if (!cell.isDisabled) onSelect(cell.date); }}>
                {cell.day}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
