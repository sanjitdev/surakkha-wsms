/**
 * FE-B5d — locale-aware date/time helper test suite. 6 cases:
 *   1) en time-24 — pure function returns HH:MM-ish digits
 *   2) bn time-24 — same input yields Bengali-script output
 *   3) en date-short — pure function returns weekday + day + month
 *   4) bn date-short — Bengali-script output for the date
 *   5) hook wires locale — useDateFormatter().format reads useLocale()
 *   6) invalid input — null and 'not-a-date' both collapse to '—'
 *
 * Tests stay timezone-resilient by avoiding exact-value assertions for the
 * HH:MM digits (the runner's TZ would shift the formatted output). Use
 * the Bengali-script regex (U+0980–U+09FF) and the digit-and-colon regex
 * instead.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Locale } from '../types/domain';
import { LocaleProvider } from '../hooks/useLocale';
import { formatDate, useDateFormatter } from '../hooks/useDateFormatter';

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

describe('FE-B5d useDateFormatter', () => {
  // (1) en time-24 — output contains HH:MM-shaped digits.
  it('en time-24: pure function returns a non-empty HH:MM-shaped string', () => {
    const out = formatDate(Locale.En, 'time-24', '2026-09-09T14:35:00Z');

    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/\d{1,2}[:.]\d{2}/);
  });

  // (2) bn time-24 — Bengali-script output, not ASCII digits.
  it('bn time-24: pure function returns Bengali-script output', () => {
    const out = formatDate(Locale.Bn, 'time-24', '2026-09-09T14:35:00Z');

    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/[\u0980-\u09FF]/);
    // Bengali output should NOT be the en-glyph form (digits differ).
    expect(out).not.toMatch(/^1?\d:\d{2}$/);
  });

  // (3) en date-short — weekday + day + month tokens.
  it('en date-short: pure function returns weekday + day + month', () => {
    const out = formatDate(Locale.En, 'date-short', '2026-09-09T14:35:00Z');

    expect(out.length).toBeGreaterThan(0);
    // Tolerant: EN locale outputs one of (Sun|Mon|Tue|Wed|Thu|Fri|Sat) +
    // a day number + a month abbreviation.
    expect(out).toMatch(/(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/);
    expect(out).toMatch(/\d{1,2}/);
    expect(out).toMatch(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
  });

  // (4) bn date-short — Bengali-script output.
  it('bn date-short: pure function returns Bengali-script output', () => {
    const out = formatDate(Locale.Bn, 'date-short', '2026-09-09T14:35:00Z');

    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/[\u0980-\u09FF]/);
  });

  // (5) hook wires locale — render a Harness inside LocaleProvider with bn.
  it('hook wires locale: useDateFormatter reads LocaleProvider state', () => {
    function Harness() {
      const { format } = useDateFormatter();

      return <span data-testid="out">{format('time-24', '2026-09-09T14:35:00Z')}</span>;
    }
    render(withLocale(<Harness />, Locale.Bn));
    const out = screen.getByTestId('out').textContent ?? '';

    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/[\u0980-\u09FF]/);
  });

  // (6) invalid input — null + 'not-a-date' both collapse to '—'.
  it('null handling: null + empty string + invalid string collapse to "—"', () => {
    expect(formatDate(Locale.En, 'time-24', null)).toBe('—');
    expect(formatDate(Locale.En, 'time-24', '')).toBe('—');
    expect(formatDate(Locale.En, 'time-24', 'not-a-date')).toBe('—');
  });
});
