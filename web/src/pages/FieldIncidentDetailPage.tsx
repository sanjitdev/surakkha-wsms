/**
 * FieldIncidentDetailPage.tsx — FE-F4.
 *
 * Karim's work-order detail page at /field/incident-detail. The
 * FieldQueuePage links each job to this URL with `?work_order=<id>`
 * (work_order is the TechnicianAssigned event_id, not the incident
 * id — that's how FieldQueuePage finds the row).
 *
 * Surface (mirrors work-queue.html priority cards):
 *   - Header: incident_id summary, severity badge, dispatch time,
 *     priority pill, ETA timer.
 *   - Status timeline: 4-step ladder (Assigned → En route → On site →
 *     Diagnosis submitted → Fix submitted → Operator confirms).
 *     The active step is highlighted; completed steps get a check.
 *   - Action panel that morphs to the next step:
 *       1. "Mark en route" → POSTs TechEnRoute
 *       2. "Mark arrived on site" → POSTs TechnicianArrived
 *       3. "Submit diagnosis" → POSTs TechDiagnosisSubmitted with a
 *          diagnosis textarea + optional parts list
 *       4. "Submit fix" → POSTs TechFixSubmitted with fix summary +
 *          resolution note + optional photo URL
 *       5. "Resolve (operator confirms)" → POSTs IncidentResolved
 *          (would normally be done by the operator, but allowed here
 *          for demo so the chain round-trips end-to-end)
 *
 * All 4 chain writes go through `useIncidentActions` (F1). The page
 * only owns local UI state (which step is active, the diagnosis
 * textarea contents). The source of truth for *what happened so far*
 * is the chain — the page reads it back via /api/events filtered to
 * `payload.incident_id === :id`.
 *
 * Role: gated to `session.role === 'field_technician'` via the same
 * pattern F2 used for `anjali` on /submit.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/tech.css';
import '../styles/submit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/layout/EmptyState';
import { AlertIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useIncidentActions } from '../hooks/useIncidentActions';
import { useDateFormatter } from '../hooks/useDateFormatter';

interface ChainEventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
}

type Step = 'assigned' | 'onsite' | 'diagnosis' | 'fix' | 'resolved';

const STEP_ORDER: Step[] = ['assigned', 'onsite', 'diagnosis', 'fix', 'resolved'];

const STEP_LABELS: Record<Step, string> = {
  assigned: 'Dispatched',
  onsite: 'On site',
  diagnosis: 'Diagnosis',
  fix: 'Fix submitted',
  resolved: 'Operator confirmed',
};

function nextStepFromEvents(events: ChainEventLite[], incidentId: string): Step {
  const types = new Set(
    events.filter((e) => (e.payload as { incident_id?: string }).incident_id === incidentId)
      .map((e) => e.event_type),
  );

  if (types.has('IncidentResolved')) return 'resolved';
  if (types.has('FixSubmitted')) return 'resolved';
  if (types.has('DiagnosisSubmitted')) return 'fix';
  if (types.has('TechnicianArrived')) return 'diagnosis';
  // The "assigned" event always exists for any open work order;
  // until the tech marks "arrived on site" the next actionable step
  // is the onsite transition.
  return 'onsite';
}
export function FieldIncidentDetailPage() {
  const { session } = useAppLayout();
  const { format } = useDateFormatter();
  const actions = useIncidentActions();
  const [searchParams] = useSearchParams();
  const workOrderId = searchParams.get('work_order') ?? '';
  const [events, setEvents] = useState<ChainEventLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state for the diagnosis + fix steps.
  const [diagnosis, setDiagnosis] = useState('');
  const [partsCsv, setPartsCsv] = useState('');
  const [fixSummary, setFixSummary] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [resolveNote, setResolveNote] = useState('');

  const isFieldTech = session.role === 'field_technician';

  // The TechnicianAssigned event itself — gives us incident_id,
  // priority, ETA, and the original work-order summary.
  const assignedEvent = useMemo(() => {
    if (!workOrderId) return null;
    return events.find((e) => e.event_id === workOrderId) ?? null;
  }, [events, workOrderId]);

  const incidentId = useMemo(() => {
    if (!assignedEvent) return '';
    const raw = (assignedEvent.payload as { incident_id?: string }).incident_id;

    return typeof raw === 'string' ? raw : '';
  }, [assignedEvent]);

  // After refresh, re-derive what step the tech should be on.
  const step = useMemo(() => {
    if (!incidentId) return 'assigned';

    return nextStepFromEvents(events, incidentId);
  }, [events, incidentId]);

  useEffect(() => {
    const cancelled = { current: false };

    void (async () => {
      try {
        const r = await fetch('/api/events?limit=200');
        const body = (await r.json()) as { events: ChainEventLite[] };

        if (cancelled.current) return;
        setEvents(body.events);
      } catch (err) {
        if (!cancelled.current) return;
        console.error('[surakkha] field-detail fetch failed', err);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const refreshEvents = async (): Promise<void> => {
    try {
      const r = await fetch('/api/events?limit=200');
      const body = (await r.json()) as { events: ChainEventLite[] };

      setEvents(body.events);
    } catch {
      // soft failure — leave existing state intact
    }
  };

  if (!isFieldTech) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Work order</h1>
        </div>
        <Card>
          <EmptyState
            icon={<AlertIcon />}
            heading="Field-tech only"
            body={`You are signed in as ${session.role}. Sign in as Karim to access work orders.`}
          />
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <Link
            to="/field"
            className="mono"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--fg-tertiary)',
              textDecoration: 'none',
            }}
            data-testid="back-to-field"
          >
            ← Back to queue
          </Link>
          <h1 style={{ marginTop: 'var(--space-md)' }}>Loading work order…</h1>
        </div>
      </Container>
    );
  }

  if (!assignedEvent) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <Link
            to="/field"
            className="mono"
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--fg-tertiary)',
              textDecoration: 'none',
            }}
            data-testid="back-to-field"
          >
            ← Back to queue
          </Link>
          <h1 style={{ marginTop: 'var(--space-md)' }}>Work order not found</h1>
        </div>
        <Card>
          <EmptyState
            icon={<AlertIcon />}
            heading="No matching work order"
            body={workOrderId ? `Event ${workOrderId.slice(-6)} is not in the current chain.` : 'No work_order id supplied in the URL.'}
          />
        </Card>
      </Container>
    );
  }

  const payload = assignedEvent.payload as {
    priority?: 'P1' | 'P2' | 'P3' | 'P4';
    eta_target_minutes?: number;
    work_order_summary?: string;
  };
  const priority = payload.priority ?? 'P3';
  const etaMin = payload.eta_target_minutes ?? 30;
  const summary = payload.work_order_summary ?? '(no summary)';
  const techId = session.actor_ref;

  // Per-step action handlers
  const onMarkArrived = async () => {
    const ok = await actions.techArrived({ incident_id: incidentId, technician_id: techId });

    if (ok) await refreshEvents();
  };
  const onSubmitDiagnosis = async () => {
    const parts = partsCsv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const ok = await actions.techDiagnosis({
      incident_id: incidentId,
      technician_id: techId,
      diagnosis: diagnosis.trim(),
      ...(parts.length > 0 ? { parts_needed: parts } : {}),
    });

    if (ok) {
      setDiagnosis('');
      setPartsCsv('');
      await refreshEvents();
    }
  };
  const onSubmitFix = async () => {
    const ok = await actions.techFix({
      incident_id: incidentId,
      technician_id: techId,
      fix_summary: fixSummary.trim(),
      resolution_note: resolutionNote.trim() || undefined,
      photo_url: photoUrl.trim() || undefined,
    });

    if (ok) {
      setFixSummary('');
      setResolutionNote('');
      setPhotoUrl('');
      await refreshEvents();
    }
  };
  const onResolve = async () => {
    const ok = await actions.resolveIncident({
      incident_id: incidentId,
      resolution_note: resolveNote.trim() || 'Operator confirmed fix',
    });

    if (ok) {
      setResolveNote('');
      await refreshEvents();
    }
  };

  const canSubmitDiagnosis = !actions.busy && diagnosis.trim().length >= 5;
  const canSubmitFix =
    !actions.busy &&
    fixSummary.trim().length >= 5 &&
    incidentId.length > 0;
  const canResolve = !actions.busy && resolveNote.trim().length === 0 || resolveNote.trim().length >= 3;

  return (
    <Container width={ContainerWidth.Bangla}>
      <div className="page-header">
        <Link
          to="/field"
          className="mono"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--fg-tertiary)',
            textDecoration: 'none',
          }}
          data-testid="back-to-field"
        >
          ← Back to queue
        </Link>
        <div style={{ marginTop: 'var(--space-sm)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <span className={`tech-job__priority tech-job__priority--${priority.toLowerCase()}`}>
            {priority}
          </span>
          <span className="mono" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--fg-secondary)' }}>
            Work order {workOrderId.slice(-6)} · incident {incidentId.slice(-6)}
          </span>
        </div>
        <h1 data-testid="field-detail-title" style={{ marginTop: 'var(--space-md)' }}>
          {summary}
        </h1>
        <p className="page-header__sub">
          Dispatched {format('date-short', assignedEvent.occurred_at)} ·{' '}
          {format('time', assignedEvent.occurred_at)} · ETA {etaMin} min
        </p>
      </div>

      {/* 6-step timeline */}
      <Card testId="field-step-list">
        <ol className="verify-steps" data-testid="field-timeline">
          {STEP_ORDER.map((s) => {
            const reached = STEP_ORDER.indexOf(s) <= STEP_ORDER.indexOf(step);
            const isCurrent = s === step;

            return (
              <li
                key={s}
                className={`verify-step${isCurrent ? ' verify-step--active' : ''}${
                  reached && !isCurrent ? ' verify-step--done' : ''
                }`}
                data-testid={`field-step-${s}`}
              >
                <span className="verify-step__num">Step {STEP_ORDER.indexOf(s) + 1}</span>
                <span className="verify-step__label">{STEP_LABELS[s]}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Action panel — morphs by current step */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        {step === 'onsite' && (
          <Card testId="field-step-onsite-card">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Mark arrived on site</h3>
            <p className="page-header__sub">
              Logs your arrival on the incident&apos;s chain thread.
            </p>
            <div className="submit-form__actions">
              <Button
                variant="primary"
                size="md"
                disabled={actions.busy}
                onClick={onMarkArrived}
                testId="field-mark-arrived"
              >
                {actions.busy ? 'Sealing…' : 'Mark arrived on site'}
              </Button>
            </div>
          </Card>
        )}

        {step === 'diagnosis' && (
          <Card testId="field-step-diagnosis-card">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Submit diagnosis</h3>
            <p className="page-header__sub">
              What you found on site; the operator reads this before authorising the fix.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onSubmitDiagnosis();
              }}
              data-testid="field-diagnosis-form"
            >
              <div className="submit-form__row">
                <label htmlFor="field-diagnosis" className="submit-form__label">
                  Diagnosis
                </label>
                <textarea
                  id="field-diagnosis"
                  data-testid="field-diagnosis"
                  className="submit-form__textarea"
                  rows={4}
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                  }}
                  placeholder="Chlorine pump #4 dead — needs replacement"
                />
                <p className="submit-form__hint">Min 5 characters.</p>
              </div>
              <div className="submit-form__row">
                <label htmlFor="field-parts" className="submit-form__label">
                  Parts needed (comma-separated)
                </label>
                <input
                  id="field-parts"
                  data-testid="field-parts"
                  className="submit-form__input"
                  value={partsCsv}
                  onChange={(e) => {
                    setPartsCsv(e.target.value);
                  }}
                  placeholder="chlorine pump #4, 1/2 inch washer"
                />
              </div>
              <div className="submit-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!canSubmitDiagnosis}
                  testId="field-submit-diagnosis"
                >
                  {actions.busy ? 'Sealing…' : 'Submit diagnosis'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 'fix' && (
          <Card testId="field-step-fix-card">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Submit fix</h3>
            <p className="page-header__sub">
              Operator reviews this and either confirms or sends you back.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void onSubmitFix();
              }}
              data-testid="field-fix-form"
            >
              <div className="submit-form__row">
                <label htmlFor="field-fix-summary" className="submit-form__label">
                  Fix summary
                </label>
                <textarea
                  id="field-fix-summary"
                  data-testid="field-fix-summary"
                  className="submit-form__textarea"
                  rows={4}
                  value={fixSummary}
                  onChange={(e) => {
                    setFixSummary(e.target.value);
                  }}
                  placeholder="Replaced chlorine pump #4; output verified at 1.5 ppm."
                />
                <p className="submit-form__hint">Min 5 characters.</p>
              </div>
              <div className="submit-form__row">
                <label htmlFor="field-resolution-note" className="submit-form__label">
                  Resolution note
                </label>
                <textarea
                  id="field-resolution-note"
                  data-testid="field-resolution-note"
                  className="submit-form__textarea"
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => {
                    setResolutionNote(e.target.value);
                  }}
                  placeholder="Optional — handed off to PHA for monitoring."
                />
              </div>
              <div className="submit-form__row">
                <label htmlFor="field-photo-url" className="submit-form__label">
                  Photo URL
                </label>
                <input
                  id="field-photo-url"
                  data-testid="field-photo-url"
                  className="submit-form__input"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => {
                    setPhotoUrl(e.target.value);
                  }}
                  placeholder="https://example.com/site.jpg"
                />
              </div>
              <div className="submit-form__actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!canSubmitFix}
                  testId="field-submit-fix"
                >
                  {actions.busy ? 'Sealing…' : 'Submit fix'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {step === 'resolved' && (
          <Card testId="field-step-resolved-card">
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Operator confirmed</h3>
            <p className="page-header__sub">
              The fix is sealed; the next step is the citizen&apos;s acknowledgement.
            </p>
            <div className="submit-form__row">
              <label htmlFor="field-resolve-note" className="submit-form__label">
                Operator resolution note
              </label>
              <textarea
                id="field-resolve-note"
                data-testid="field-resolve-note"
                className="submit-form__textarea"
                rows={2}
                value={resolveNote}
                onChange={(e) => {
                  setResolveNote(e.target.value);
                }}
                placeholder="Optional — seal a public notice; defaults to &quot;Operator confirmed fix&quot;."
              />
            </div>
            <div className="submit-form__actions">
              <Button
                variant="primary"
                size="md"
                disabled={!canResolve}
                onClick={onResolve}
                testId="field-resolve"
              >
                {actions.busy ? 'Sealing…' : 'Confirm resolution'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Sidebar: thread timeline for the incident. */}
      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Card testId="field-thread-card">
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Thread timeline</h3>
          <ThreadEvents incidentId={incidentId} events={events} formatTime={format} />
        </Card>
      </div>
    </Container>
  );
}
interface ThreadEventsProps {
  incidentId: string;
  events: ChainEventLite[];
  formatTime: (mode: 'time', input: string | number | Date | null | undefined) => string;
}

function ThreadEvents({ incidentId, events, formatTime }: ThreadEventsProps) {
  const list = useMemo(() => events
      .filter((e) => (e.payload as { incident_id?: string }).incident_id === incidentId)
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()), [events, incidentId]);

  if (!incidentId) {
    return (
      <p className="page-header__sub" style={{ marginTop: 'var(--space-md)' }}>
        No incident id resolved yet.
      </p>
    );
  }
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<AlertIcon />}
        heading="No events yet"
        body="Once the technician submits status updates they show here."
      />
    );
  }
  return (
    <ul className="timeline" data-testid="field-thread-list" style={{ marginTop: 'var(--space-md)' }}>
      {list.map((e) => (
        <li key={e.event_id}>
          <div className="timeline__time mono">{formatTime('time', e.occurred_at)}</div>
          <p className="timeline__title">{e.event_type}</p>
          <div className="timeline__meta mono">{e.actor_identity?.display ?? '—'}</div>
        </li>
      ))}
    </ul>
  );
}
