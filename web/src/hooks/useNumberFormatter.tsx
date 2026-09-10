// useNumberFormatter — FE-B5g-2. Locale-aware number formatter that subscribes
// to useLocale() and exposes a memoized bound formatter. A pure function
// (formatNumber) is also exported for non-React callers. Mirrors the
// useDateFormatter (B5d) shape so the codebase stays consistent.
// See web/src/__checks__/fe-b5g-bangla-counters.test.tsx for the contract.
import { useMemo } from 'react';
import type { Locale } from '../types/domain';
import { useLocale } from './useLocale';
export type NumberFormatOptions = Pick<
  Intl.NumberFormatOptions,
  'style' | 'currency' | 'minimumFractionDigits' | 'maximumFractionDigits' | 'useGrouping'
>;
export function formatNumber(
  locale: Locale,
  value: number | null | undefined,
  options?: NumberFormatOptions,
): string {
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) return '—';
  return new Intl.NumberFormat(locale, options).format(value);
}
export function useNumberFormatter(): {
  format: (value: number | null | undefined, options?: NumberFormatOptions) => string;
  locale: Locale;
} {
  const { locale } = useLocale();
  const format = useMemo(
    () => (value: number | null | undefined, options?: NumberFormatOptions) =>
      formatNumber(locale, value, options),
    [locale],
  );

  return { format, locale };
}
