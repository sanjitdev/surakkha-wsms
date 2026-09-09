/**
 * useCalendar.ts — FE-B5c Layer-A helper for the Calendar primitive.
 *
 * Owns visible-month state + cell-grid construction + min/max guard for the
 * `<Calendar>` surface. Zero deps (native `Date` + `Intl.DateTimeFormat`).
 *
 * Cell model: a 7×6 grid (always 42 cells) is built for the visible month.
 * Days outside the month are still rendered (dimmed) so the grid is always
 * rectangular — matches the WAI-ARIA grid pattern (which requires a fixed
 * row count for screen readers).
 *
 * Locale handling: weekday headers come from
 * `Intl.DateTimeFormat(locale, { weekday: 'short' })`, month name from
 * `Intl.DateTimeFormat(locale, { month: 'long' })`. Bangla names come free
 * from the `bn` locale.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Locale } from '../../types/domain';

/** A single day cell in the calendar grid. */
export interface CalendarCell {
  date: Date;
  /** 1-31 day-of-month. */
  day: number;
  /** Whether this day belongs to the visible month (else dimmed). */
  inMonth: boolean;
  /** Whether `date` is the same calendar day as `today`. */
  isToday: boolean;
  /** Whether the cell is within [min, max] (or no bounds set). */
  isDisabled: boolean;
  /** Stable testid suffix — e.g. `c-day-15` or `c-day-15-other`. */
  testId: string;
}
export interface UseCalendarArgs {
  initialMonth?: Date;
  /** Optional lower bound — days before are `isDisabled: true`. */
  min?: Date | null;
  /** Optional upper bound — days after are `isDisabled: true`. */
  max?: Date | null;
  /** Locale string ('en' | 'bn') — controls header/aria-label formatting. */
  locale: Locale;
}
export interface UseCalendarResult {
  /** The currently-displayed month (1st day, local time). */
  visibleMonth: Date;
  /** Localized month + year label, e.g. "September 2026". */
  monthLabel: string;
  /** 7 weekday short names, Sun→Sat (or per locale). */
  weekdays: string[];
  /** 42 cells (6 weeks × 7 days). */
  cells: CalendarCell[];
  nextMonth: () => void;
  prevMonth: () => void;
  nextYear: () => void;
  prevYear: () => void;
  /** True if both `d` and `e` fall on the same calendar day. */
  isSameDay: (d: Date, e: Date) => boolean;
  /** Localized long-date label for a cell, e.g. "Tuesday, September 1, 2026". */
  formatDateLabel: (d: Date) => string;
  /** Today's date (truncated to midnight). */
  today: Date;
}
/** Return a new Date at local midnight. */
function startOfDay(d: Date): Date {
  const out = new Date(d);

  out.setHours(0, 0, 0, 0);
  return out;
}
/** Return a new Date at the 1st of `d`'s month, local midnight. */
function startOfMonth(d: Date): Date {
  const out = startOfDay(d);

  out.setDate(1);
  return out;
}
/** Add `n` whole months to `d` and return the 1st of that month. */
function addMonths(d: Date, n: number): Date {
  const out = startOfMonth(d);

  out.setMonth(out.getMonth() + n);
  return out;
}
/** Add `n` whole days to `d`. */
function addDays(d: Date, n: number): Date {
  const out = startOfDay(d);

  out.setDate(out.getDate() + n);
  return out;
}
/** True if two dates share the same calendar day (local time). */
export function isSameDayUtil(d: Date, e: Date): boolean {
  return (
    d.getFullYear() === e.getFullYear() &&
    d.getMonth() === e.getMonth() &&
    d.getDate() === e.getDate()
  );
}
export function useCalendar({
  initialMonth, min, max, locale,
}: UseCalendarArgs): UseCalendarResult {
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => startOfMonth(initialMonth ?? new Date()),
  );
  // `today` refreshes when the tab regains focus so a session that crosses
  // local midnight doesn't keep yesterday's "today" highlight.
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const onVis = () => { setNow(new Date()); };

    document.addEventListener('visibilitychange', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); };
  }, []);
  const today = useMemo(() => startOfDay(now), [now]);
  const minBound = useMemo(() => (min ? startOfDay(min) : null), [min]);
  const maxBound = useMemo(() => (max ? startOfDay(max) : null), [max]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(visibleMonth),
    [locale, visibleMonth],
  );
  // Weekday names: format 2026-01-04 (Sun) through 2026-01-10 (Sat). Intl requires
  // a real Date; anchor on a known Sunday so the array stays Sun→Sat regardless
  // of the user's locale start-of-week.
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const out: string[] = [];

    for (let i = 0; i < 7; i++) out.push(fmt.format(new Date(2026, 0, 4 + i)));
    return out;
  }, [locale]);
  const cells = useMemo<CalendarCell[]>(() => {
    const offset = visibleMonth.getDay();
    // First cell is `offset` days BEFORE the 1st of the month; that spills
    // into the previous month, so step backward by `offset`.
    const start = addDays(visibleMonth, -offset);
    const out: CalendarCell[] = [];

    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      const inMonth = d.getMonth() === visibleMonth.getMonth();
      const t = d.getTime();
      const disabled = (minBound !== null && t < minBound.getTime()) ||
        (maxBound !== null && t > maxBound.getTime());

      out.push({
        date: d, day: d.getDate(), inMonth,
        isToday: isSameDayUtil(d, today), isDisabled: disabled,
        testId: `c-day-${d.getDate()}${inMonth ? '' : '-other'}`,
      });
    }
    return out;
  }, [visibleMonth, today, minBound, maxBound]);
  const nextMonth = useCallback(() => {
    setVisibleMonth((m) => addMonths(m, 1));
  }, []);
  const prevMonth = useCallback(() => {
    setVisibleMonth((m) => addMonths(m, -1));
  }, []);
  const shiftYear = useCallback((delta: number) => {
    setVisibleMonth((m) => {
      const out = startOfMonth(m);

      out.setFullYear(out.getFullYear() + delta);
      return out;
    });
  }, []);
  const nextYear = useCallback(() => { shiftYear(1); }, [shiftYear]);
  const prevYear = useCallback(() => { shiftYear(-1); }, [shiftYear]);
  const formatDateLabel = useCallback(
    (d: Date) => new Intl.DateTimeFormat(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }).format(d),
    [locale],
  );

  return {
    visibleMonth, monthLabel, weekdays, cells,
    nextMonth, prevMonth, nextYear, prevYear,
    isSameDay: isSameDayUtil, formatDateLabel, today,
  };
}
