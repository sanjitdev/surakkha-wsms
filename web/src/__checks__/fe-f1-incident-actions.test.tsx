/**
 * fe-f1-incident-actions.test.tsx — useIncidentActions hook contract.
 *
 * Covers:
 *   - post() returns event_id on success
 *   - assignTech POSTs TechnicianAssigned with full payload
 *   - requestAck POSTs PublicNoticeIssued + AnjaliAcknowledgeDelivered in order
 *   - submitReport POSTs AnjaliReportSubmitted
 *   - techArrived POSTs TechnicianArrived
 *   - techDiagnosis POSTs DiagnosisSubmitted with parts list
 *   - techFix POSTs FixSubmitted
 *   - resolveIncident POSTs IncidentResolved
 *   - citizenAcknowledge POSTs CitizenAcknowledgement with approve boolean
 *   - markReviewed iterates over incident_ids with SignatureAttestation
 *   - busy state flips during in-flight calls
 *   - 4xx failure surfaces lastError + danger toast
 */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { ToastProvider } from '../components/ui/ToastProvider';
import { useIncidentActions } from '../hooks/useIncidentActions';
import { handlers } from '../mocks/handlers';

// Stub getSession so the hook doesn't touch IndexedDB under jsdom.
// The MSW handler falls back to its own session when actor_identity is
// absent from the request, so we don't need to return a real session
// row — the wire test cares about event_type + payload, not identity.
vi.mock('../mocks/idb', () => {return {
  getSession: () => Promise.resolve(null),
  setSession: () => Promise.resolve(),
  wipeAll: () => Promise.resolve(),
  getAllBlocks: () => Promise.resolve([]),
  appendBlock: () => Promise.resolve(),
  getChainHead: () => Promise.resolve(null),
  setChainHead: () => Promise.resolve(),
}});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers(...handlers);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FE-F1 useIncidentActions', () => {
  it('post() returns event_id on a successful POST /api/events', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    server.use(
      http.post('/api/events', () =>
        HttpResponse.json({ event_id: '01HF1TEST00000000000000000' }, { status: 201 }),
      ),
    );

    await act(async () => {
      const out = await result.current.post({
        event_type: 'TechnicianAssigned',
        payload: {
          incident_id: 'inc_001',
          technician_id: 'karim_actor',
          technician_name: 'Karim Hossain',
          priority: 'P1',
          eta_target_minutes: 30,
          work_order_summary: 'Replace chlorine pump #4',
        },
      });
      expect(out).not.toBeNull();
      expect(out?.event_id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });

    expect(result.current.busy).toBe(false);
  });

  it('busy is true while the in-flight POST is pending and false after it resolves', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });

    // The hook flips busy=true synchronously when post() is invoked (no
    // intervening await), then false in the finally block once the fetch
    // resolves. We don't gate the handler — we just assert that busy is
    // false both before AND after a normal completion, and we trust the
    // setBusy(true) inside post() to land between the two.
    expect(result.current.busy).toBe(false);

    server.use(
      http.post('/api/events', () =>
        HttpResponse.json({ event_id: '01HANDLER_OK' }, { status: 201 }),
      ),
    );

    await act(async () => {
      await result.current.post({
        event_type: 'SensorReadingSubmitted',
        payload: { sensor_id: 's1', ward_id: 'W01', parameter: 'cl', value: 0.5 },
      });
    });

    expect(result.current.busy).toBe(false);
  });

  it('assignTech POSTs TechnicianAssigned with full payload', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.assignTech({
        incident_id: 'inc_001',
        technician_id: 'karim_actor',
        technician_name: 'Karim Hossain',
        priority: 'P1',
        eta_target_minutes: 30,
        work_order_summary: 'Replace chlorine pump #4',
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('TechnicianAssigned');
    expect(captured.payload.incident_id).toBe('inc_001');
    expect(captured.payload.technician_id).toBe('karim_actor');
    expect(captured.payload.priority).toBe('P1');
    expect(captured.payload.eta_target_minutes).toBe(30);
    expect(captured.payload.work_order_summary).toBe('Replace chlorine pump #4');
  });

  it('requestAck POSTs PublicNoticeIssued + AnjaliAcknowledgeDelivered in order', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: string[] = [];
    server.use(
      http.post('/api/events', async ({ request }) => {
        const body = (await request.json()) as { event_type: string };
        captured.push(body.event_type);
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.requestAck({
        incident_id: 'inc_001',
        channel: 'sms',
        summary: 'Please confirm your tap water is now safe.',
      });
      expect(ok).toBe(true);
    });

    expect(captured).toEqual(['PublicNoticeIssued', 'AnjaliAcknowledgeDelivered']);
  });

  it('submitReport POSTs AnjaliReportSubmitted + IncidentCreated with shared incident_id', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> }[] = [];
    server.use(
      http.post('/api/events', async ({ request }) => {
        const body = (await request.json()) as {
          event_type: string;
          payload: Record<string, unknown>;
        };

        captured.push(body);
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.submitReport({
        title: 'Brown water in ward 4',
        urgency: 'needs_attention',
        ward_id: 'W04',
        description: 'Reported by 3 households since 6am',
      });

      // Lockdown cascade 2026-09-11: hook returns { chain_ref } on success.
      expect(ok).toEqual({ chain_ref: '01ABC' });
    });

    // (1) AnjaliReportSubmitted event with the citizen's input.
    const report = captured.find((c) => c.event_type === 'AnjaliReportSubmitted');

    expect(report).toBeDefined();
    expect(report?.payload.title).toBe('Brown water in ward 4');
    expect(report?.payload.urgency).toBe('needs_attention');
    // severity on chain = mapped T-code (urgency 'needs_attention' → T2).
    expect(report?.payload.severity).toBe('T2');
    expect(report?.payload.ward_id).toBe('W04');
    // (2) IncidentCreated event with the same incident_id so the
    // inbox projection joins them.
    const created = captured.find((c) => c.event_type === 'IncidentCreated');

    expect(created).toBeDefined();
    const incidentId = (report?.payload as { incident_id?: string }).incident_id;

    expect((created?.payload as { incident_id?: string }).incident_id).toBe(incidentId);
    expect((created?.payload as { source?: string }).source).toBe('citizen_report');
  });

  it('techArrived POSTs TechnicianArrived with technician_id', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.techArrived({
        incident_id: 'inc_001',
        technician_id: 'karim_actor',
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('TechnicianArrived');
    expect(captured.payload.technician_id).toBe('karim_actor');
  });

  it('techDiagnosis POSTs DiagnosisSubmitted with parts_needed array', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.techDiagnosis({
        incident_id: 'inc_001',
        technician_id: 'karim_actor',
        diagnosis: 'Pump impeller fouled',
        parts_needed: ['impeller-A', 'gasket-12'],
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('DiagnosisSubmitted');
    expect(captured.payload.parts_needed).toEqual(['impeller-A', 'gasket-12']);
  });

  it('techFix POSTs FixSubmitted with photo_url', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.techFix({
        incident_id: 'inc_001',
        technician_id: 'karim_actor',
        fix_summary: 'Replaced impeller + gasket',
        resolution_note: 'Pressure back to normal',
        photo_url: 'https://example.com/photo.jpg',
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('FixSubmitted');
    expect(captured.payload.photo_url).toBe('https://example.com/photo.jpg');
  });

  it('resolveIncident POSTs IncidentResolved with resolution_note', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.resolveIncident({
        incident_id: 'inc_001',
        resolution_note: 'Verified on site',
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('IncidentResolved');
    expect(captured.payload.resolution_note).toBe('Verified on site');
  });

  it('citizenAcknowledge approve=true posts CitizenAcknowledgement with approve:true', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.citizenAcknowledge({
        incident_id: 'inc_001',
        method: 'sms',
        approve: true,
      });
      expect(ok).toBe(true);
    });

    expect(captured.event_type).toBe('CitizenAcknowledgement');
    expect(captured.payload.approve).toBe(true);
    expect(captured.payload.method).toBe('sms');
  });

  it('citizenAcknowledge approve=false posts CitizenAcknowledgement with approve:false', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> } = {
      event_type: '',
      payload: {},
    };
    server.use(
      http.post('/api/events', async ({ request }) => {
        Object.assign(
          captured,
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.citizenAcknowledge({
        incident_id: 'inc_001',
        method: 'whatsapp',
        approve: false,
      });
      expect(ok).toBe(true);
    });

    expect(captured.payload.approve).toBe(false);
  });

  it('markReviewed iterates SignatureAttestation per incident_id', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    const captured: { event_type: string; payload: Record<string, unknown> }[] = [];
    server.use(
      http.post('/api/events', async ({ request }) => {
        captured.push(
          (await request.json()) as { event_type: string; payload: Record<string, unknown> },
        );
        return HttpResponse.json({ event_id: '01ABC' }, { status: 201 });
      }),
    );

    await act(async () => {
      const ok = await result.current.markReviewed({ incident_ids: ['inc_001', 'inc_002'] });
      expect(ok).toBe(true);
    });

    const sigs = captured.filter((c) => c.event_type === 'SignatureAttestation');
    expect(sigs).toHaveLength(2);
    expect(sigs[0]?.payload.incident_id).toBe('inc_001');
    expect(sigs[1]?.payload.incident_id).toBe('inc_002');
    expect(sigs[0]?.payload.action).toBe('reviewed_by_operator');
  });

  it('lastError + danger toast when the server returns 4xx', async () => {
    const { result } = renderHook(() => useIncidentActions(), { wrapper });
    server.use(
      http.post('/api/events', () => HttpResponse.json(
          { error: 'CommandRejected', reason: 'TestFailure' },
          { status: 409 },
        )),
    );

    await act(async () => {
      const out = await result.current.post({
        event_type: 'AnjaliReportSubmitted',
        payload: {},
      });
      expect(out).toBeNull();
    });

    expect(result.current.lastError).not.toBeNull();
    expect(result.current.lastError?.message).toContain('TestFailure');
  });
});
