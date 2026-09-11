/**
 * fe-b6-settings-reset-modal.test.tsx — Regression for lockdown cascade.
 *
 * Per bmad lockdown §7.1, the Danger button variant is reserved for
 * the T3+ issuance path. The Settings reset action is destructive but
 * not issuance, so it must use a Ghost button + a confirm-modal
 * pattern before invoking resetEverything().
 *
 *   1) Clicking the reset button opens the confirm modal — no destructive
 *      call lands immediately.
 *   2) Cancelling the modal closes it without calling resetEverything().
 *   3) Confirming the modal calls resetEverything().
 *   4) The persona readout uses badge--t1-locked (divider neutral), not
 *      legacy badge--t1 (which still bound to --info / sky-blue).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { Settings } from '../pages/Settings';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';

const SESSION: SessionRow = {
  actor_id: 'priya-001',
  actor_ref: 'priya-001',
  display_name: 'Priya',
  role: 'utility_operator',
  token: 'test-token',
  logged_in_at: '2024-01-01T00:00:00Z',
  tenant_id: 'tenant-001',
};

// Mock resetEverything at module level so the test does not actually
// wipe localStorage / IndexedDB / reload the page.
vi.mock('../mocks/reset', () => {return {
  resetEverything: vi.fn(async () => undefined),
}});
import { resetEverything } from '../mocks/reset';

function renderSettings() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <MemoryRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppLayoutContext.Provider
            value={{
              session: SESSION,
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <Settings />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

beforeEach(() => {
  (resetEverything as unknown as { mockClear: () => void }).mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FE-B6 Settings reset confirm-modal', () => {
  it('clicking_reset_button_opens_confirm_modal_without_calling_reset', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    // Confirmation modal opened — but the destructive call has NOT landed.
    expect(resetEverything as unknown as { mock: { calls: unknown[] } }).toBeDefined();
    expect(((resetEverything as unknown as { mock: { calls: unknown[] } }).mock.calls)).toHaveLength(0);
  });

  it('cancelling_confirm_modal_closes_it_without_calling_reset', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));
    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('settings-reset-confirm-cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('settings-reset-confirm-modal')).toBeNull();
    });
    expect(((resetEverything as unknown as { mock: { calls: unknown[] } }).mock.calls)).toHaveLength(0);
  });

  it('confirming_confirm_modal_calls_resetEverything', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));
    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings-reset-confirm-confirm'));
    });
    await waitFor(() => {
      expect((resetEverything as unknown as { mock: { calls: unknown[] } }).mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('persona_readout_uses_t1_locked_badge', () => {
    renderSettings();
    const badge = screen.getByTestId('settings-role-role');

    expect(badge.className).toContain('badge--t1-locked');
    expect(badge.className).not.toContain('badge--t1 ');
  });
});
