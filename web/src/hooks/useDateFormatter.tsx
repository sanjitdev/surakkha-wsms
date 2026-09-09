// useDateFormatter — FE-B5d. Locale-aware date/time helper that subscribes
// to useLocale() and exposes a memoized bound formatter. A pure function
// (formatDate) is also exported for non-React callers (e.g. inboxListModel).
// See web/src/__checks__/fe-b5d-locale-format.test.tsx for the contract.

import { useMemo } from 'react';
import type { Locale } from '../types/domain';
import { useLocale } from './useLocale';

export type DateFormatMode =
  | 'time'
  | 'time-24'
  | 'time-full'
  | 'date-short'
  | 'date-medium'
  | 'date-full';
const OPTIONS: Record<DateFormatMode, Intl.DateTimeFormatOptions> = {
  time: { hour: '2-digit', minute: '2-digit' },
  'time-24': { hour: '2-digit', minute: '2-digit', hour12: false },
  'time-full': {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  },
  'date-short': { weekday: 'short', day: '2-digit', month: 'short' },
  'date-medium': { dateStyle: 'medium' },
  'date-full': { dateStyle: 'full' },
};

function buildFormatter(
  locale: Locale,
  mode: DateFormatMode,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale, OPTIONS[mode]);
}
export function formatDate(
  locale: Locale,
  mode: DateFormatMode,
  input: string | number | Date | null | undefined,
): string {
  if (input == null || input === '') return '—';
  const d = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(d.getTime())) return '—';
  return buildFormatter(locale, mode).format(d);
}
export function useDateFormatter(): {
  format: (mode: DateFormatMode, input: string | number | Date | null | undefined) => string;
  locale: Locale;
} {
  const { locale } = useLocale();

  const format = useMemo(
    () =>
      (mode: DateFormatMode, input: string | number | Date | null | undefined) =>
        formatDate(locale, mode, input),
    [locale],
  );

  return { format, locale };
}
