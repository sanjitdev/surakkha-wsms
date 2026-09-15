/**
 * fe-b6-settings-reset-modal.test.tsx — Regression for lockdown cascade.
 *
 * Per bmad lockdown §7.1, the Danger button variant is reserved for
 * the T3+ issuance path. The Settings reset action is destructive but
 * not issuance, so it must use a Ghost button + a confirm-modal
 * pattern before wiping IDB.
 *
 * WO-014 (2026-09-15) updated the wire contract — confirming the
 * modal now (1) emits `SettingsReset{actor}` to POST /api/events
 * FIRST and (2) then calls `wipeAll()` to clear IDB. The legacy
 * `resetEverything()` helper (which only did wipeAll + reload) was
 * removed; the new handler composes both halves explicitly so the
 * audit event lands before the wipe.
 *
 *   1) Clicking the reset button opens the confirm modal — no destructive
 *      call lands immediately.
 *   2) Cancelling the modal closes it without wiping IDB or firing POST.
 *   3) Confirming the modal fires POST /api/events { event_type:
 *      "SettingsReset", payload: { actor: <ref> } } + calls wipeAll().
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

// Stub wipeAll at module level so the test does not actually wipe
// localStorage / IndexedDB / reload the page. The new handler
// (WO-014) calls wipeAll() directly instead of going through the
// legacy resetEverything() helper.
const { wipeAllSpy, capturePosts, restoreFetchRef } = vi.hoisted(() => {
  const capture: { url: string; body: unknown }[] = [];
  const restoreRef: { current: () => void } = { current: () => undefined };

  return {
    wipeAllSpy: vi.fn(async () => undefined),
    capturePosts: capture,
    restoreFetchRef: restoreRef,
  };
});

function installFetchStub(): void {
  capturePosts.length = 0;
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (init?.method === 'POST' && url === '/api/events') {
      const body = init.body ? JSON.parse(String(init.body)) : null;

      capturePosts.push({ url, body });
      return new Response(
        JSON.stringify({ event_id: '01STUB', block_hash: '01STUBHASH' }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      );
    }
    return original(input as RequestInfo, init);
  }) as typeof globalThis.fetch;

  restoreFetchRef.current = () => {
    globalThis.fetch = original;
  };
}

vi.mock('../mocks/idb', async () => {
  const actual = await vi.importActual<typeof import('../mocks/idb')>('../mocks/idb');

  return {
    ...actual,
    wipeAll: wipeAllSpy,
  };
});

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
  wipeAllSpy.mockClear();
  installFetchStub();
  // jsdom has no window.location.reload — stub so confirm doesn't crash.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: vi.fn() },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreFetchRef.current();
});

describe('FE-B6 Settings reset confirm-modal', () => {
  it('clicking_reset_button_opens_confirm_modal_without_firing_post', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    // Confirmation modal opened — but the destructive call has NOT landed.
    // No POST yet, no wipeAll() yet.
    expect(capturePosts.length).toBe(0);
    expect(wipeAllSpy).not.toHaveBeenCalled();
  });

  it('cancelling_confirm_modal_closes_it_without_firing_post', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));
    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('settings-reset-confirm-cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('settings-reset-confirm-modal')).toBeNull();
    });
    // Cancel is a no-op — no SettingsReset capture, no wipe.
    const resetPost = capturePosts.find(
      (c) => (c.body as { event_type?: string }).event_type === 'SettingsReset',
    );

    expect(resetPost).toBeFalsy();
    expect(wipeAllSpy).not.toHaveBeenCalled();
  });

  it('confirming_confirm_modal_fires_SettingsReset_then_wipes', async () => {
    renderSettings();
    fireEvent.click(screen.getByTestId('settings-reset-button'));
    await waitFor(() => {
      expect(screen.getByTestId('settings-reset-confirm-modal')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('settings-reset-confirm-confirm'));
    });
    // The wire contract: POST SettingsReset{actor} FIRST, then wipeAll().
    await waitFor(() => {
      expect(capturePosts.length).toBeGreaterThanOrEqual(1);
    });
    const resetPost = capturePosts.find(
      (c) => (c.body as { event_type?: string }).event_type === 'SettingsReset',
    );

    expect(resetPost).toBeTruthy();
    expect(resetPost!.body).toMatchObject({
      event_type: 'SettingsReset',
      actor_identity: {
        kind: 'utility_operator',
        ref: 'priya-001',
        display: 'Priya',
      },
      payload: { actor: 'priya-001' },
    });
    await waitFor(() => {
      expect(wipeAllSpy).toHaveBeenCalled();
    });
  });

  it('persona_readout_uses_t1_locked_badge', () => {
    renderSettings();
    const badge = screen.getByTestId('settings-role-role');

    expect(badge.className).toContain('badge--t1-locked');
    expect(badge.className).not.toContain('badge--t1 ');
  });
});
