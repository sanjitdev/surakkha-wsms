/**
 * FE-B5e — locale-aware relative-time formatter test suite. 9 cases:
 *   1) just_now_within_30s — |delta| < 30s → 'just now'
 *   2) seconds_under_1_minute — 45s ago → '45 seconds ago'
 *   3) minutes — 5m ago → '5 minutes ago'
 *   4) hours — 3h ago → '3 hours ago'
 *   5) days — 2d ago → '2 days ago'
 *   6) future_minutes — 5m future → 'in 5 minutes'
 *   7) null_returns_dash — null → '—'
 *   8) invalid_date_returns_dash — 'foo' → '—'
 *   9) bangla_locale_returns_localized — bn input contains non-ASCII
 *
 * All cases use a fixed `now` injected via the 3rd parameter for
 * tz-resilient, deterministic assertions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { Locale } from '../types/domain';
import { formatRelativeTime } from '../hooks/useRelativeTime';

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

describe('FE-B5e formatRelativeTime', () => {
  // (1) |delta| < 30s → 'just now' regardless of locale.
  it('just_now_within_30s: 15s delta returns "just now"', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T11:59:45Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('just now');
  });

  // (2) 45s ago → '45 seconds ago' (NOT '1 minute ago' — the ladder
  // walks the smallest unit that doesn't round to zero).
  it('seconds_under_1_minute: 45s ago returns "45 seconds ago"', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T11:59:15Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('45 seconds ago');
  });

  // (3) 5m ago → '5 minutes ago'.
  it('minutes: 5m ago returns "5 minutes ago"', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T11:55:00Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('5 minutes ago');
  });

  // (4) 3h ago → '3 hours ago'.
  it('hours: 3h ago returns "3 hours ago"', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T09:00:00Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('3 hours ago');
  });

  // (5) 2d ago → '2 days ago'.
  it('days: 2d ago returns "2 days ago"', () => {
    const now = Date.parse('2024-01-03T12:00:00Z');
    const input = '2024-01-01T12:00:00Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('2 days ago');
  });

  // (6) Future time (5m) → 'in 5 minutes' (Intl.RelativeTimeFormat's
  // built-in future prefix — no manual 'in ' string).
  it('future_minutes: 5m future returns "in 5 minutes"', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T12:05:00Z';
    const out = formatRelativeTime(Locale.En, input, now);

    expect(out).toBe('in 5 minutes');
  });

  // (7) null input → '—' (matches B5d contract).
  it('null_returns_dash: null input collapses to "—"', () => {
    const out = formatRelativeTime(Locale.En, null);

    expect(out).toBe('—');
  });

  // (8) Invalid date string → '—' (matches B5d contract).
  it('invalid_date_returns_dash: "foo" collapses to "—"', () => {
    const out = formatRelativeTime(Locale.En, 'foo');

    expect(out).toBe('—');
  });

  // (9) Bangla locale — Intl emits Bengali-script output (non-ASCII).
  it('bangla_locale_returns_localized: bn input contains non-ASCII chars', () => {
    const now = Date.parse('2024-01-01T12:00:00Z');
    const input = '2024-01-01T11:55:00Z';
    const out = formatRelativeTime(Locale.Bn, input, now);

    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
    // Bengali-script + non-Latin characters (U+0080 and above).
    expect(out).toMatch(/[\u0080-\uFFFF]/);
    // Should be a Bangla minute-form, not the English form.
    expect(out).not.toBe('5 minutes ago');
  });
});
