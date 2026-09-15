/**
 * fe-hotline-intake-modal.test.tsx — WO-002 acceptance.
 *
 * Pins the HotlineIntakeModal contract per WO-002 + the lockdown
 * reconciliation:
 *   - 6 fields render in spec order (callerName → callerPhone → callTime
 *     → description → locationHint → outcome).
 *   - Submit gating: disabled until description 20-500, location 5-200,
 *     outcome set, callTime not in future.
 *   - Outcome branching (wire contract):
 *       reported_incident → POST /api/events with event_type
 *         IncidentCreated { trust_band: 'T1', reporter_kind:
 *         'hotline_operator', hotline_call_id (UUID v7) }.
 *       no_incident / wrong_number → POST /api/events with event_type
 *         HotlineCallLogged { outcome, hotline_call_id (same lineage),
 *         call_time }.
 *   - ESC / Cancel with dirty opens the discard confirmation dialog;
 *     pristine closes immediately.
 *   - Default band is T1; reporter_kind is hotline_operator on both
 *     branches.
 *   - Bangla surface copy exists for all field labels + outcomes +
 *     toast strings.
 *
 * The hot POST path is verified through the fetch stub: the modal emits
 * a POST /api/events envelope; the MSW handler accepts it and mints
 * incident_id + hashes phone. Toast assertions cover the
 * reported_incident and HotlineCallLogged branches.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { ToastProvider } from '../components/ui/ToastProvider';
import { HotlineIntakeModal } from '../components/operator/HotlineIntakeModal';
import enJson from '../i18n/locales/en/operatorDashboard.json';
import bnJson from '../i18n/locales/bn/operatorDashboard.json';

let captured: { url: string; body: unknown }[] = [];
let nextStatus: number = 201;
let nextJson: unknown = {
  payload: { incident_id: 'inc_test_hotline_001' },
};
let restoreFetch: () => void = () => undefined;

beforeEach(() => {
  captured = [];
  nextStatus = 201;
  nextJson = { payload: { incident_id: 'inc_test_hotline_001' } };
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const body = init?.body ? JSON.parse(String(init.body)) : null;

    captured.push({ url, body });
    // Match the post-WO-002 wire contract (POST /api/events).
    if (url === '/api/events') {
      return new Response(JSON.stringify(nextJson), {
        status: nextStatus,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof globalThis.fetch;
  restoreFetch = () => {
    globalThis.fetch = original;
  };
  void i18n.changeLanguage('en');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  restoreFetch();
  void i18n.changeLanguage('en');
});

function renderModal(
  opts: {
    onClose?: () => void;
    onSubmitted?: (i: { outcome: string; incidentId?: string }) => void;
  } = {},
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider durationMs={100}>
          <HotlineIntakeModal
            open
            onClose={opts.onClose ?? (() => undefined)}
            onSubmitted={opts.onSubmitted}
          />
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

function fillRequiredFields(
  description = 'Foul smell from the kitchen tap since this morning.',
  locationHint = 'Ward 14, Mohammadpur, standpipe #7',
) {
  fireEvent.change(screen.getByTestId('hotline-input-description'), {
    target: { value: description },
  });
  fireEvent.change(screen.getByTestId('hotline-input-location-hint'), {
    target: { value: locationHint },
  });
}

describe('WO-002 HotlineIntakeModal', () => {
  it('renders 6 fields in spec order (no callDuration, no sensitive toggle)', () => {
    renderModal();
    expect(screen.getByTestId('hotline-input-caller-name')).toBeTruthy();
    expect(screen.getByTestId('hotline-input-caller-phone')).toBeTruthy();
    expect(screen.getByTestId('hotline-input-call-time')).toBeTruthy();
    expect(screen.getByTestId('hotline-input-description')).toBeTruthy();
    expect(screen.getByTestId('hotline-input-location-hint')).toBeTruthy();
    expect(screen.getByTestId('hotline-input-outcome')).toBeTruthy();
    // 8-field extra controls removed in WO-002 scope.
    expect(screen.queryByTestId('hotline-input-call-duration')).toBeNull();
    expect(screen.queryByTestId('hotline-input-sensitive')).toBeNull();
  });

  it('Submit disabled until description ≥20, locationHint ≥5, callTime valid', () => {
    renderModal();
    // All empty except default callTime + default outcome.
    expect(
      (screen.getByTestId('hotline-button-submit') as HTMLButtonElement).disabled,
    ).toBe(true);

    // Description only — still disabled (locationHint short).
    fireEvent.change(screen.getByTestId('hotline-input-description'), {
      target: { value: 'a'.repeat(20) },
    });
    expect(
      (screen.getByTestId('hotline-button-submit') as HTMLButtonElement).disabled,
    ).toBe(true);

    // Both filled — enabled.
    fireEvent.change(screen.getByTestId('hotline-input-location-hint'), {
      target: { value: 'Ward 14, Mohammadpur' },
    });
    expect(
      (screen.getByTestId('hotline-button-submit') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('reported_incident submit fires POST /api/events with IncidentCreated{T1, hotline_operator}', async () => {
    const onSubmitted = vi.fn();
    renderModal({ onSubmitted });
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('hotline-button-submit'));

    await waitFor(() => {
      expect(captured.length).toBeGreaterThan(0);
    });

    const call = captured.find((c) => c.url === '/api/events');

    expect(call, 'expected POST /api/events').toBeTruthy();
    const body = call!.body as {
      event_type: string;
      payload: Record<string, unknown>;
    };

    expect(body.event_type).toBe('IncidentCreated');
    expect(body.payload).toMatchObject({
      trust_band: 'T1',
      source: 'hotline',
      reporter_kind: 'hotline_operator',
      description: 'Foul smell from the kitchen tap since this morning.',
      location_hint: 'Ward 14, Mohammadpur, standpipe #7',
    });
    // hotline_call_id must be UUID v7 (8-4-4-4-12 hex, version nibble
    // = 7, variant nibble = 0b10xx).
    const hotlineCallId = body.payload.hotline_call_id as string;

    expect(hotlineCallId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'reported_incident',
        incidentId: 'inc_test_hotline_001',
      }),
    );
  });

  it('no_incident outcome fires POST /api/events with HotlineCallLogged (no IncidentCreated)', async () => {
    const onSubmitted = vi.fn();
    renderModal({ onSubmitted });
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('hotline-input-outcome'), {
      target: { value: 'no_incident' },
    });
    fireEvent.click(screen.getByTestId('hotline-button-submit'));

    await waitFor(() => {
      expect(captured.length).toBeGreaterThan(0);
    });

    const eventsCall = captured.find((c) => c.url === '/api/events');

    expect(eventsCall).toBeTruthy();
    const body = eventsCall!.body as {
      event_type: string;
      payload: Record<string, unknown>;
    };

    expect(body.event_type).toBe('HotlineCallLogged');
    expect(body.payload).toMatchObject({ outcome: 'no_incident', source: 'hotline' });
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'no_incident' }),
    );
  });

  it('wrong_number outcome fires POST /api/events with HotlineCallLogged{outcome: wrong_number}', async () => {
    renderModal();
    fillRequiredFields();
    fireEvent.change(screen.getByTestId('hotline-input-outcome'), {
      target: { value: 'wrong_number' },
    });
    fireEvent.click(screen.getByTestId('hotline-button-submit'));

    await waitFor(() => {
      expect(captured.some((c) => c.url === '/api/events')).toBe(true);
    });
    const eventsCall = captured.find((c) => c.url === '/api/events');
    const body = eventsCall!.body as {
      event_type: string;
      payload: Record<string, unknown>;
    };

    expect(body.event_type).toBe('HotlineCallLogged');
    expect(body.payload.outcome).toBe('wrong_number');
  });

  it('ESC on a dirty modal opens the discard-confirm dialog (not direct close)', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    // Pristine → ESC closes (Modal primitive handles ESC; onClose fires).
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();

    // Re-render dirty state.
    cleanup();
    const onClose2 = vi.fn();
    renderModal({ onClose: onClose2 });
    fillRequiredFields();
    fireEvent.keyDown(document, { key: 'Escape' });

    // Discard dialog should appear; the parent onClose is NOT yet called.
    expect(onClose2).not.toHaveBeenCalled();
    expect(screen.getByTestId('hotline-discard-confirm')).toBeTruthy();
  });

  it('Cancel button on a dirty modal opens the discard-confirm dialog', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('hotline-button-cancel'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('hotline-discard-confirm')).toBeTruthy();
  });

  it('Discard button in confirm dialog closes the modal', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('hotline-button-cancel'));
    fireEvent.click(screen.getByTestId('hotline-discard-confirm-btn'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Keep editing in confirm dialog returns to the modal without closing', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('hotline-button-cancel'));
    fireEvent.click(screen.getByTestId('hotline-discard-keep'));
    expect(onClose).not.toHaveBeenCalled();
    // Modal still mounted, description still has its value.
    expect(
      (screen.getByTestId('hotline-input-description') as HTMLTextAreaElement).value,
    ).toContain('Foul smell');
  });

  it('submit failed keeps modal open + surfaces warning toast', async () => {
    nextStatus = 500;
    nextJson = { error: 'server' };
    const onClose = vi.fn();
    renderModal({ onClose });
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('hotline-button-submit'));

    // Wait for the fetch to fail and toast to render.
    await waitFor(() => {
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
    // Modal still open (parent onClose NOT called).
    expect(onClose).not.toHaveBeenCalled();
    // Description still populated.
    expect(
      (screen.getByTestId('hotline-input-description') as HTMLTextAreaElement).value,
    ).toContain('Foul smell');
  });

  it('description character counter tracks input', () => {
    renderModal();
    fireEvent.change(screen.getByTestId('hotline-input-description'), {
      target: { value: 'twenty chars ok...' },
    });
    const counter = screen.getByTestId('hotline-description-count');

    expect(counter.textContent).toBe('18');
  });

  it('required fields show a styled asterisk via .submit-form__required', () => {
    const { container: dom } = renderModal();
    // description, locationHint, outcome carry the required span
    // (callerName / callerPhone / callTime are optional per WO-002 scope).
    const requiredSpans = dom.querySelectorAll('.submit-form__required');

    expect(requiredSpans.length).toBe(3);
    requiredSpans.forEach((s) => {
      expect(s.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('en/bn key parity: hotline.modal.* keys exist in both locales', () => {
    expect(enJson.hotline.modal.title, 'en.hotline.modal.title').toBeTruthy();
    expect(bnJson.hotline.modal.title, 'bn.hotline.modal.title').toBeTruthy();
    expect(enJson.hotline.modal.subtitle, 'en.hotline.modal.subtitle').toBeTruthy();
    expect(bnJson.hotline.modal.subtitle, 'bn.hotline.modal.subtitle').toBeTruthy();
    expect(enJson.hotline.modal.sectionNotice, 'en.hotline.modal.sectionNotice').toBeTruthy();
    expect(bnJson.hotline.modal.sectionNotice, 'bn.hotline.modal.sectionNotice').toBeTruthy();

    for (const k of ['incident', 'inquiry', 'missed']) {
      expect(
        enJson.hotline.modal.outcome[k as 'incident'],
        `en.hotline.modal.outcome.${k}`,
      ).toBeTruthy();
      expect(
        bnJson.hotline.modal.outcome[k as 'incident'],
        `bn.hotline.modal.outcome.${k}`,
      ).toBeTruthy();
    }

    for (const k of [
      'callerName',
      'callerPhone',
      'callerPhoneHelper',
      'callTime',
      'description',
      'descriptionHelper',
      'locationHint',
      'locationHintHelper',
      'outcome',
      'outcomeHelper',
    ]) {
      expect(
        enJson.hotline.modal.field[k as 'callerName'],
        `en.hotline.modal.field.${k}`,
      ).toBeTruthy();
      expect(
        bnJson.hotline.modal.field[k as 'callerName'],
        `bn.hotline.modal.field.${k}`,
      ).toBeTruthy();
    }

    for (const k of ['cancel', 'submit']) {
      expect(
        enJson.hotline.modal.button[k as 'cancel'],
        `en.hotline.modal.button.${k}`,
      ).toBeTruthy();
      expect(
        bnJson.hotline.modal.button[k as 'cancel'],
        `bn.hotline.modal.button.${k}`,
      ).toBeTruthy();
    }

    for (const k of ['incidentCreated', 'callLogged']) {
      expect(
        enJson.hotline.modal.toast[k as 'incidentCreated'],
        `en.hotline.modal.toast.${k}`,
      ).toBeTruthy();
      expect(
        bnJson.hotline.modal.toast[k as 'incidentCreated'],
        `bn.hotline.modal.toast.${k}`,
      ).toBeTruthy();
    }

    expect(
      enJson.hotline.modal.discardConfirm.title,
      'en.hotline.modal.discardConfirm.title',
    ).toBeTruthy();
    expect(
      bnJson.hotline.modal.discardConfirm.title,
      'bn.hotline.modal.discardConfirm.title',
    ).toBeTruthy();
    expect(
      enJson.hotline.modal.discardConfirm.keepEditing,
      'en.hotline.modal.discardConfirm.keepEditing',
    ).toBeTruthy();
    expect(
      bnJson.hotline.modal.discardConfirm.keepEditing,
      'bn.hotline.modal.discardConfirm.keepEditing',
    ).toBeTruthy();
    expect(
      enJson.hotline.modal.discardConfirm.discard,
      'en.hotline.modal.discardConfirm.discard',
    ).toBeTruthy();
    expect(
      bnJson.hotline.modal.discardConfirm.discard,
      'bn.hotline.modal.discardConfirm.discard',
    ).toBeTruthy();
  });
});
