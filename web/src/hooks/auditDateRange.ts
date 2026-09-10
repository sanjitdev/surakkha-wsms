/**
 * auditDateRange.ts — FE-B5f.
 *
 * Day-granularity inclusive range predicate for AuditLog events. Both
 * bounds are compared as local-day strings (zero-padded, sorted-order)
 * so the "midnight UTC != midnight BDT" off-by-one cannot bite.
 *
 * The original spec called for Intl.DateTimeFormat, but Intl's output
 * format varies by Node version (`'en'` defaults to `'en-US'` MM/DD/YYYY
 * or `'en-GB'` DD/MM/YYYY depending on the build), making string
 * comparison unreliable across environments. We keep the locale-aware
 * intent (timezone via Date's local methods) but use a stable
 * YYYY-MM-DD key derived from getFullYear/getMonth/getDate.
 *
 * Empty bounds are unbounded on that side. Invalid `occurred_at`
 * strings pass through (defensive — keeps the table from going empty
 * if the backend ever emits a malformed timestamp).
 *
 * Extracted from AuditLog.tsx (AD-FE-5 ceiling: pages must stay ≤200
 * LoC). Reused by the B5f test suite to unit-test the predicate without
 * rendering the page.
 */

/**
 * Format a Date as a local-day `YYYY-MM-DD` key. Uses the runtime's
 * local timezone via getFullYear/getMonth/getDate — locale is reserved
 * for any future i18n formatting we layer on top, but the day key
 * itself is locale-agnostic so string comparison is well-defined.
 */
export function localDayKey(d: Date, _locale: string): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;
}

/**
 * Returns true if `occurredAt` falls within `[from, to]` at local-day
 * granularity. `null` bounds are unbounded on that side.
 */
export function isInRange(
  occurredAt: string,
  from: Date | null,
  to: Date | null,
  locale: string,
): boolean {
  const ev = new Date(occurredAt);
  if (Number.isNaN(ev.getTime())) return true;
  if (from && localDayKey(ev, locale) < localDayKey(from, locale)) return false;
  if (to && localDayKey(ev, locale) > localDayKey(to, locale)) return false;
  return true;
}
