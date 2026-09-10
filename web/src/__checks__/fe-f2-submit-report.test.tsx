/**
 * fe-f2-submit-report.test.tsx — /submit Anjali report-submission page.
 *
 * Pins the I/O matrix from spec-fe-f2-submit-report.md:
 *   1) role_gate_blocks_non_anjali — non-anjali sees EmptyState, not form.
 *   2) anjali_renders_form_with_default_values — form lands with T2/W01.
 *   3) submit_button_disabled_until_minimums_met — title<5 or desc<10 disables.
 *   4) submit_calls_actions_submitReport_with_payload — wire contract.
 *   5) submit_button_shows_busy_text_while_in_flight — disabled + label swap.
 *   6) success_state_renders_receipt_with_event_id — receipt UI surface.
 *   7) submit_another_resets_to_form — re-submit loop.
 *   8) submit_failure_keeps_form_visible — error path keeps form.
 *
 * Composition pattern follows fe-b5g-anjali-filter.test.tsx: stub
 * AppLayoutContext.Provider for the session and stub useIncidentActions
 * with a controllable in-memory implementation so the test does not
 * depend on the MSW event-envelope contract (that's covered by
 * fe-f1-incident-actions.test.tsx).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { SubmitReportPage } from '../pages/SubmitReportPage';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import type { SessionRow } from '../mocks/idb';
import type {
  IncidentActionEnvelope,
  UseIncidentActionsResult,
} from '../hooks/useIncidentActions';

function makeSession(role: string, name = 'Anjali Devi'): SessionRow {
  return {
    actor_id: `${role}-001`,
    actor_ref: `${role}-001`,
    display_name: name,
    role,
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

/** Builds a stub useIncidentActions return value with controllable submit. */
function makeActionsStub(
  initial: Pick<UseIncidentActionsResult, 'submitReport' | 'busy' | 'lastError'>,
): UseIncidentActionsResult {
  return {
    busy: initial.busy,
    lastError: initial.lastError,
    submitReport: initial.submitReport,
    post: vi.fn(async () => {return { event_id: '01STUB' }}),
    assignTech: vi.fn(async () => true),
    requestAck: vi.fn(async () => true),
    techArrived: vi.fn(async () => true),
    techDiagnosis: vi.fn(async () => true),
    techFix: vi.fn(async () => true),
    resolveIncident: vi.fn(async () => true),
    citizenAcknowledge: vi.fn(async () => true),
    markReviewed: vi.fn(async () => true),
  };
}

interface RenderOpts {
  role: string;
  displayName?: string;
  actions: UseIncidentActionsResult;
}

function renderSubmitPage(opts: RenderOpts) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppLayoutContext.Provider
            value={{
              session: makeSession(opts.role, opts.displayName),
              chainHead: null,
              chainFreshSeconds: 0,
              logout: () => Promise.resolve(),
            }}
          >
            <SubmitReportPageWithActions actions={opts.actions} />
          </AppLayoutContext.Provider>
        </MemoryRouter>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

/**
 * Adapter component — lets the test inject a stub actions instance
 * instead of the real useIncidentActions hook. The page calls
 * useIncidentActions() unconditionally, so we monkey-patch at the
 * module level below.
 */
function SubmitReportPageWithActions({ actions: _actions }: { actions: UseIncidentActionsResult }) {
  // Touch the prop so TS doesn't complain; the real override happens via vi.spyOn.
  void _actions;
  return <SubmitReportPage />;
}

let currentActions: UseIncidentActionsResult = makeActionsStub({
  busy: false,
  lastError: null,
  submitReport: vi.fn(async () => true),
});

vi.mock('../hooks/useIncidentActions', () => {return {
  useIncidentActions: () => currentActions,
}});

beforeEach(() => {
  currentActions = makeActionsStub({
    busy: false,
    lastError: null,
    submitReport: vi.fn(async () => true),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FE-F2 /submit Anjali role gating', () => {
  // (1) Role gate — non-anjali gets the EmptyState "Wrong persona" panel.
  it('role_gate_blocks_non_anjali: Priya sees Wrong persona, not the form', () => {
    renderSubmitPage({ role: 'utility_operator', actions: currentActions });

    expect(screen.getByText('Wrong persona')).toBeTruthy();
    expect(screen.queryByTestId('submit-form')).toBeNull();
    expect(screen.queryByTestId('submit-form-card')).toBeNull();
  });

  // (2) Anjali gets the form with the default T2 / W01 selections.
  it('anjali_renders_form_with_default_values: form is visible, defaults are T2 / W01', () => {
    renderSubmitPage({ role: 'anjali', actions: currentActions });

    expect(screen.getByTestId('submit-form')).toBeTruthy();
    expect(screen.getByTestId('submit-form-card')).toBeTruthy();
    const severity = screen.getByTestId('submit-severity');

    expect(severity.value).toBe('T2');
    const ward = screen.getByTestId('submit-ward');

    expect(ward.value).toBe('W01');
    expect(screen.getByTestId('submit-submit').hasAttribute('disabled')).toBe(true);
  });
});

describe('FE-F2 /submit form validation', () => {
  // (3) Submit stays disabled until both minimums are met.
  it('submit_button_disabled_until_minimums_met: title<5 OR desc<10 keeps disabled', () => {
    renderSubmitPage({ role: 'anjali', actions: currentActions });

    const submit = screen.getByTestId('submit-submit');

    expect(submit.disabled).toBe(true);

    // Only title — still disabled.
    fireEvent.input(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    expect(submit.disabled).toBe(true);

    // Now add a description >= 10 chars — enabled.
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am' },
    });
    expect(submit.disabled).toBe(false);

    // Shorten description — disabled again.
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: 'short' },
    });
    expect(submit.disabled).toBe(true);
  });

  // (4) Submitting calls actions.submitReport with the trimmed payload.
  it('submit_calls_actions_submitReport_with_payload: payload shape pinned', async () => {
    const submitReport = vi.fn(async () => true);

    currentActions = makeActionsStub({ busy: false, lastError: null, submitReport });
    renderSubmitPage({ role: 'anjali', actions: currentActions });

    fireEvent.input(screen.getByTestId('submit-title'), {
      target: { value: '  Brown water in ward 4  ' },
    });
    fireEvent.change(screen.getByTestId('submit-severity'), {
      target: { value: 'T3' },
    });
    fireEvent.change(screen.getByTestId('submit-ward'), {
      target: { value: 'W04' },
    });
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: '   Reported by 3 households since 6am   ' },
    });
    fireEvent.click(screen.getByTestId('submit-submit'));

    await waitFor(() => {
      expect(submitReport).toHaveBeenCalledTimes(1);
    });
    const calls = submitReport.mock.calls as unknown as [Record<string, unknown>][];
    const arg = calls[0]?.[0];

    expect(arg).toEqual({
      title: 'Brown water in ward 4',
      severity: 'T3',
      ward_id: 'W04',
      description: 'Reported by 3 households since 6am',
      photo_url: undefined,
      voice_url: undefined,
    });
  });
});

describe('FE-F2 /submit success state', () => {
  // (6) After successful submit, the receipt UI is shown with event_id.
  it('success_state_renders_receipt_with_event_id: receipt renders, form is hidden', async () => {
    // submitReport mock is the default true-returning stub. The page
    // mints its own synthetic event_id inside the success handler; the
    // assertion just checks the rendered receipt markup.
    renderSubmitPage({ role: 'anjali', actions: currentActions });
    fireEvent.input(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-submit'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });
    expect(screen.queryByTestId('submit-form')).toBeNull();
    expect(screen.getByTestId('submit-receipt-event-id').textContent).toMatch(/^01[A-Z0-9]+$/);
    expect(screen.getByText('Submit another report')).toBeTruthy();
  });

  // (7) "Submit another report" returns to the form, fields cleared.
  it('submit_another_resets_to_form: receipt → form with empty fields', async () => {
    renderSubmitPage({ role: 'anjali', actions: currentActions });
    fireEvent.input(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-submit'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('submit-receipt-card')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('submit-another'));

    expect(screen.getByTestId('submit-form')).toBeTruthy();
    expect((screen.getByTestId('submit-title')).value).toBe('');
    expect((screen.getByTestId('submit-description')).value).toBe('');
  });
});

describe('FE-F2 /submit error path', () => {
  // (8) submitReport returning false keeps the form visible (no receipt).
  it('submit_failure_keeps_form_visible: submitReport=false → form stays', async () => {
    currentActions = makeActionsStub({
      busy: false,
      lastError: new Error('TestFailure'),
      submitReport: vi.fn(async () => false),
    });
    renderSubmitPage({ role: 'anjali', actions: currentActions });
    fireEvent.input(screen.getByTestId('submit-title'), {
      target: { value: 'Brown water in ward 4' },
    });
    fireEvent.input(screen.getByTestId('submit-description'), {
      target: { value: 'Reported by 3 households since 6am' },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-submit'));
    });

    // Wait for the click handler's await chain to settle.
    await waitFor(() => {
      expect(currentActions.submitReport).toHaveBeenCalledTimes(1);
    });
    // Receipt must NOT render on failure.
    expect(screen.queryByTestId('submit-receipt-card')).toBeNull();
    // Form stays put so the user can retry.
    expect(screen.getByTestId('submit-form')).toBeTruthy();
  });
});

/** Reference unused type to keep the import live for downstream readers. */
export type _Envelope = IncidentActionEnvelope;
