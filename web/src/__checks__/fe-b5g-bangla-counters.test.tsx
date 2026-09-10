/**
 * FE-B5g-2 — Intl.NumberFormat Bangla counter contract.
 *
 * Pins the I/O matrix from spec-fe-b5g-anjali-filter-bangla-counters.md:
 *   1) formatNumber_en_returns_arabic — en locale keeps 0-9 glyphs.
 *   2) formatNumber_bn_returns_bengali_digits — bn swaps to ০-৯.
 *   3) formatNumber_bn_with_thousands — bn adds locale grouping separators.
 *   4) formatNumber_null_returns_dash — null → '—'.
 *   5) formatNumber_undefined_returns_dash — undefined → '—'.
 *   6) useNumberFormatter_subscribes_to_locale_change — hook re-renders.
 *
 * Bengali digits are matched via `/[০-৯]/` (the Unicode Bengali numeral
 * range) — avoids the `no-control-regex` lint issue that bit B5e.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { Locale } from '../types/domain';
import { LocaleProvider, useLocale } from '../hooks/useLocale';
import { formatNumber, useNumberFormatter } from '../hooks/useNumberFormatter';

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

describe('FE-B5g-2 formatNumber (pure)', () => {
  // (1) en locale returns Arabic numerals — no surprise.
  it('formatNumber_en_returns_arabic: en keeps ASCII digits', () => {
    expect(formatNumber(Locale.En, 42)).toBe('42');
    expect(formatNumber(Locale.En, 0)).toBe('0');
    expect(formatNumber(Locale.En, 1000)).toBe('1,000');
  });

  // (2) bn locale returns Bengali-digit numerals (৪২ = 4 then 2 in Bengali).
  it('formatNumber_bn_returns_bengali_digits: bn swaps digits', () => {
    const out = formatNumber(Locale.Bn, 42);

    expect(out).toMatch(/[০-৯]/);
    expect(out).not.toMatch(/[0-9]/);
    // 42 → ৪২ (specific assertion).
    expect(out).toBe('৪২');
  });

  // (3) bn with thousands — Intl picks the locale-appropriate separator.
  it('formatNumber_bn_with_thousands: bn groups digits per CLDR', () => {
    const out = formatNumber(Locale.Bn, 1234567);

    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    expect(out).toMatch(/[০-৯]/);
    expect(out).not.toMatch(/[0-9]/);
    // Locale grouping: either the en "," separator OR bn's "৹" / " " —
    // either way the string contains a non-digit separator.
    expect(out).not.toBe('১২৩৪৫৬৭');
  });

  // (4) null → '—'.
  it('formatNumber_null_returns_dash: null input collapses to "—"', () => {
    expect(formatNumber(Locale.En, null)).toBe('—');
    expect(formatNumber(Locale.Bn, null)).toBe('—');
  });

  // (5) undefined → '—'.
  it('formatNumber_undefined_returns_dash: undefined input collapses to "—"', () => {
    expect(formatNumber(Locale.En, undefined)).toBe('—');
    expect(formatNumber(Locale.Bn, undefined)).toBe('—');
  });

  // Bonus: NaN → '—'.
  it('formatNumber_NaN_returns_dash: NaN input collapses to "—"', () => {
    expect(formatNumber(Locale.En, Number.NaN)).toBe('—');
  });
});

describe('FE-B5g-2 useNumberFormatter', () => {
  // (6) hook subscribes to locale change.
  it('useNumberFormatter_subscribes_to_locale_change: hook re-renders on locale flip', async () => {
    function Harness() {
      const { format } = useNumberFormatter();

      return <span data-testid="out">{format(42)}</span>;
    }

    function Toggle() {
      const { locale, setLocale } = useLocale();

      return (
        <div>
          <span data-testid="seed">{locale}</span>
          <button
            type="button"
            data-testid="toggle"
            onClick={() => {
              setLocale(locale === Locale.En ? Locale.Bn : Locale.En);
            }}
          >
            toggle
          </button>
        </div>
      );
    }

    render(
      <LocaleProvider>
        <Harness />
        <Toggle />
      </LocaleProvider>,
    );

    // Initial: en → ASCII digits.
    const out = screen.getByTestId('out');

    expect(out.textContent).toBe('42');

    // Flip to bn → Bengali digits.
    const btn = screen.getByTestId('toggle');

    fireEvent.click(btn);
    // setLocale writes localStorage in a useEffect; wait for the new render.
    await waitFor(() => {
      expect(screen.getByTestId('out').textContent).toBe('৪২');
    });

    // Flip back to en → ASCII digits again.
    fireEvent.click(btn);
    await waitFor(() => {
      expect(screen.getByTestId('out').textContent).toBe('42');
    });
  });

  // (Bonus) renderHook shape — locale surfaced.
  it('useNumberFormatter_returns_locale_in_payload', () => {
    const { result } = renderHook(() => useNumberFormatter(), { wrapper: LocaleProvider });

    expect(result.current.locale).toBe(Locale.En);
    expect(typeof result.current.format).toBe('function');
    expect(result.current.format(7)).toBe('7');
  });
});
