/**
 * FE-B5g-1 — Settings.Anjali IncidentDate filter contract.
 *
 * Pins the I/O matrix from spec-fe-b5g-anjali-filter-bangla-counters.md:
 *   1) settings_card_hidden_for_non_anjali_role — Priya sees no Anjali card.
 *   2) settings_card_visible_for_anjali_role — Anjali sees the card.
 *   3) setting_from_persists_to_local_storage — setFrom writes ISO to storage.
 *   4) mount_with_existing_localStorage_returns_stored_date — read-through works.
 *   5) invalid_localStorage_value_returns_null — defensive parse.
 *
 * The Settings page depends on `useAppLayout()` for the session; we wrap
 * each render in a stub <AppLayoutContext.Provider>. The hook itself
 * (useAnjaliFilter) is mounted standalone via renderHook with a
 * LocaleProvider wrapper so the DatePicker + locale aren't required.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Settings } from '../pages/Settings';
import { LocaleProvider } from '../hooks/useLocale';
import { useAnjaliFilter } from '../hooks/useAnjaliFilter';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';

const STORAGE_KEY = 'surakkha.anjali.incidentDateFrom';

function makeSession(role: string): SessionRow {
  return {
    actor_id: `${role}-001`,
    actor_ref: `${role}-001`,
    display_name: role === 'anjali' ? 'Anjali' : 'Priya',
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

function renderSettings(role: string) {
  return render(
    <LocaleProvider>
      <MemoryRouter>
        <AppLayoutContext.Provider
          value={{
            session: makeSession(role),
            chainHead: null,
            chainFreshSeconds: 0,
            logout: () => Promise.resolve(),
          }}
        >
          <Settings />
        </AppLayoutContext.Provider>
      </MemoryRouter>
    </LocaleProvider>,
  );
}

function renderAnjaliHook() {
  return renderHook(() => useAnjaliFilter(), { wrapper: LocaleProvider });
}

beforeEach(() => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
});

describe('FE-B5g-1 Settings.Anjali role gating', () => {
  // (1) settings_card_hidden_for_non_anjali_role — Priya must not see it.
  it('settings_card_hidden_for_non_anjali_role: Priya sees no Anjali card', () => {
    renderSettings('priya');
    expect(screen.queryByTestId('settings-anjali-card')).toBeNull();
    // Other cards still render (regression guard).
    expect(screen.getByTestId('settings-theme-card')).toBeTruthy();
    expect(screen.getByTestId('settings-locale-card')).toBeTruthy();
  });

  // (2) settings_card_visible_for_anjali_role — card renders when role === 'anjali'.
  it('settings_card_visible_for_anjali_role: Anjali sees the Citizen reports card', () => {
    renderSettings('anjali');
    const card = screen.getByTestId('settings-anjali-card');

    expect(card).toBeTruthy();
    // Card body text asserts copy contract + control testIds.
    expect(card.textContent).toContain('Citizen reports');
    expect(screen.getByTestId('settings-anjali-control')).toBeTruthy();
    expect(screen.getByTestId('settings-anjali-from-trigger')).toBeTruthy();
    expect(screen.getByTestId('settings-anjali-clear')).toBeTruthy();
    // Clear starts disabled when no date set.
    const clear = screen.getByTestId('settings-anjali-clear');

    expect((clear as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('FE-B5g-1 useAnjaliFilter localStorage', () => {
  // (3) setting_from_persists_to_local_storage — setFrom writes the ISO string.
  it('setting_from_persists_to_local_storage: setFrom writes ISO to localStorage', () => {
    const { result } = renderAnjaliHook();
    const picked = new Date('2024-01-01T00:00:00.000Z');

    act(() => {
      result.current.setFrom(picked);
    });

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('2024-01-01T00:00:00.000Z');
  });

  // (4) mount_with_existing_localStorage_returns_stored_date — read-through.
  it('mount_with_existing_localStorage_returns_stored_date: read-through returns the stored Date', () => {
    window.localStorage.setItem(STORAGE_KEY, '2024-06-15T00:00:00.000Z');
    const { result } = renderAnjaliHook();

    expect(result.current.from).not.toBeNull();
    expect(result.current.from?.toISOString()).toBe('2024-06-15T00:00:00.000Z');
  });

  // (5) invalid_localStorage_value_returns_null — defensive parse.
  it('invalid_localStorage_value_returns_null: "not-a-date" returns null', () => {
    window.localStorage.setItem(STORAGE_KEY, 'not-a-date');
    const { result } = renderAnjaliHook();

    expect(result.current.from).toBeNull();
  });

  // (Bonus) clear removes the storage key.
  it('clear_removes_storage_key', () => {
    window.localStorage.setItem(STORAGE_KEY, '2024-01-01T00:00:00.000Z');
    const { result } = renderAnjaliHook();

    expect(result.current.from).not.toBeNull();
    act(() => {
      result.current.clear();
    });
    expect(result.current.from).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
