// useRelativeTime — FE-B5e. Locale-aware relative-time formatter that
// subscribes to useLocale() and exposes a memoized bound formatter. A
// pure function (formatRelativeTime) is also exported for non-React
// callers (e.g. inboxListModel). Mirrors the dual-surface pattern from
// useDateFormatter.tsx. See web/src/__checks__/fe-b5e-relative-time.test.tsx
// for the I/O contract.

import { useMemo } from 'react';
import type { Locale } from '../types/domain';
import { useLocale } from './useLocale';

const MS = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_629_800_000,
  year: 31_557_600_000,
} as const;

const UNIT_LADDER: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['second', MS.second],
  ['minute', MS.minute],
  ['hour', MS.hour],
  ['day', MS.day],
  ['week', MS.week],
  ['month', MS.month],
  ['year', MS.year],
];

const JUST_NOW_THRESHOLD_MS = 30_000;

export function formatRelativeTime(
  locale: Locale,
  input: string | number | Date | null | undefined,
  now: number = Date.now(),
): string {
  if (input == null || input === '') return '—';
  const d = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(d.getTime())) return '—';
  const delta = d.getTime() - now;

  if (Math.abs(delta) < JUST_NOW_THRESHOLD_MS) return 'just now';

  const absDelta = Math.abs(delta);

  // Walk the ladder largest-to-smallest to find the largest unit that
  // still covers the delta. This avoids over-counting (e.g. 90s → 2
  // minutes because 1.5 rounds to 2, not "1 minute").
  let chosenUnit: Intl.RelativeTimeFormatUnit = 'second';
  let chosenMs: number = MS.second;

  for (let i = UNIT_LADDER.length - 1; i >= 0; i -= 1) {
    const entry = UNIT_LADDER[i];
    const ms = entry[1];

    if (absDelta >= ms) {
      chosenUnit = entry[0];
      chosenMs = ms;
      break;
    }
  }
  let value = delta / chosenMs;

  // Round-half-away-from-zero for negative future values (so -89s → -1m, not 0m).
  if (value < 0) value = -Math.round(-value);
  else value = Math.round(value);

  // Defensive: if rounding produced 0 (e.g. 30s threshold + ladder collision),
  // fall back to the next-smaller unit so the user still sees a real number.
  if (value === 0) {
    const chosenIdx = UNIT_LADDER.findIndex((entry) => entry[0] === chosenUnit);

    for (let i = chosenIdx - 1; i >= 0; i -= 1) {
      const entry = UNIT_LADDER[i];
      const candidate = Math.round(delta / entry[1]);

      if (candidate !== 0) {
        chosenUnit = entry[0];
        value = candidate;
        break;
      }
    }

    if (value === 0) return 'just now';
  }

  // numeric: 'auto' downgrades 1 day ago → 'yesterday', etc.
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const formatted = rtf.format(value, chosenUnit);

    if (formatted) return formatted;
  } catch {
    // fall through to numeric: 'always'
  }
  const rtfFallback = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });

  return rtfFallback.format(value, chosenUnit);
}
export function useRelativeTime(): {
  formatRelative: (input: string | number | Date | null | undefined, now?: number) => string;
  locale: Locale;
} {
  const { locale } = useLocale();
  const formatRelative = useMemo(
    () => (input: string | number | Date | null | undefined, now?: number) =>
      formatRelativeTime(locale, input, now),
    [locale],
  );

  return { formatRelative, locale };
}
