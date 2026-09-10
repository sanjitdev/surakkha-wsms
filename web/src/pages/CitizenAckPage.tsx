/**
 * CitizenAckPage.tsx — FE-F6.
 *
 * Citizen (Anjali) acknowledgement surface at /ack/:incident_id. The
 * operator's `Request citizen ack →` action (F3) emits
 * `CitizenAckRequested` with the channel + summary that Anjali then
 * receives out-of-band (SMS, WhatsApp, or voice call). This page is
 * the in-app fallback / demo surface: Anjali opens the URL directly,
 * reviews what the operator sent, and confirms (✅ approve) or
 * disputes (❌ reopen) the fix.
 *
 * Why a dedicated page (not a modal on the inbox): Anjali uses a
 * different persona login than the operator. The cycle ends with the
 * citizen pressing "Approve" — that final UX surface must live
 * somewhere Anjali can reach without owning the operator chrome.
 *
 * Mirrors `SubmitReportPage` (F2) for the citizen report submit
 * pattern; mirrors `InboxDetail` (F3) for the operator-side read +
 * CTA pattern.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/submit.css';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/layout/EmptyState';
import { AlertIcon, SendIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useIncidentActions } from '../hooks/useIncidentActions';
import { useIncidents } from '../hooks/useIncidents';
import { useDateFormatter } from '../hooks/useDateFormatter';

type Method = 'sms' | 'whatsapp' | 'voice' | 'in_app';

interface AckEvent {
  event_id: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}

export function CitizenAckPage() {
  const { incident_id: incidentId = '' } = useParams<{ incident_id: string }>();
  const { session } = useAppLayout();
  const { format } = useDateFormatter();
  const { incidents, loading } = useIncidents();
  const actions = useIncidentActions();
  const [submitted, setSubmitted] = useState<{ approve: boolean; method: Method } | null>(null);
  const [ackEvents, setAckEvents] = useState<AckEvent[]>([]);

  const isAnjali = session.role === 'anjali';
  const incident = useMemo(
    () => incidents.find((i) => i.incident_id === incidentId) ?? null,
    [incidents, incidentId],
  );

  // Pull the CitizenAckRequested event(s) for this incident from the
  // chain so we can show the operator's notice copy to the citizen.
  // This is a one-shot read on mount; refresh after a successful ack
  // re-derives the thread.
  const refreshAckEvents = async (): Promise<void> => {
    try {
      const r = await fetch('/api/events?event_type=CitizenAckRequested&limit=50');
      const body = (await r.json()) as { events: AckEvent[] };
      const filtered = body.events.filter(
        (e) => (e.payload as { incident_id?: string }).incident_id === incidentId,
      );
      const sorted = [...filtered].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
      );

      setAckEvents(sorted);
    } catch {
      setAckEvents([]);
    }
  };

  const lastAckRequest = ackEvents.length > 0 ? ackEvents[0] : null;

  // Fetch the operator's notice on mount so Anjali sees the channel +
  // summary the operator sent (or the generic fallback copy).
  useEffect(() => {
    if (!isAnjali || !incidentId) return;
    void refreshAckEvents();
    // We deliberately depend only on incidentId; the page is mounted
    // once per route, so a refresh is fired exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId, isAnjali]);

  const onSubmit = async (approve: boolean) => {
    const channelRaw =
      lastAckRequest !== null ? (lastAckRequest.payload as { channel?: Method }).channel : null;
    const method: Method = channelRaw ?? 'in_app';
    const ok = await actions.citizenAcknowledge({
      incident_id: incidentId,
      method,
      approve,
    });

    if (ok) {
      setSubmitted({ approve, method });
      await refreshAckEvents();
    }
  };

  if (!isAnjali) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Citizen acknowledgement</h1>
        </div>
        <Card>
          <EmptyState
            icon={<SendIcon />}
            heading="Wrong persona"
            body={`You are signed in as ${session.role}. Sign in as Anjali to acknowledge an incident.`}
          />
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Citizen acknowledgement</h1>
          <p className="page-header__sub">Loading incident…</p>
        </div>
      </Container>
    );
  }

  if (!incident) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Citizen acknowledgement</h1>
        </div>
        <Card>
          <EmptyState
            icon={<AlertIcon />}
            heading="Incident not found"
            body={`No active incident matches ${incidentId.slice(0, 12)}.`}
          />
        </Card>
      </Container>
    );
  }

  if (submitted) {
    const heading = submitted.approve ? 'You approved the fix' : 'You disputed the fix';
    const body = submitted.approve
      ? 'Thank you. The operator will seal the incident as resolved on the chain.'
      : 'Thank you. The operator will reopen the incident for review.';
    const badge = submitted.approve ? 'badge badge--t1' : 'badge badge--t3';

    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>Citizen acknowledgement</h1>
          <p className="page-header__sub">Recorded on the chain.</p>
        </div>
        <Card testId="ack-submitted-card">
          <div className="submit-receipt">
            <span className={badge}>{submitted.approve ? 'APPROVED' : 'DISPUTED'}</span>
            <h2 className="submit-receipt__title">{heading}</h2>
            <dl className="submit-receipt__meta">
              <dt>Incident</dt>
              <dd>
                <span className="mono">{incidentId.slice(0, 12)}</span>
              </dd>
              <dt>Channel</dt>
              <dd>
                <span className="mono">{submitted.method}</span>
              </dd>
              <dt>Decided</dt>
              <dd>
                <span className="mono">{format('time-full', new Date().toISOString())}</span>
              </dd>
            </dl>
            <p className="submit-receipt__hint">{body}</p>
          </div>
        </Card>
      </Container>
    );
  }

// Initial form. Reachable only for active Anjali.
  const summaryRaw =
    lastAckRequest !== null ? (lastAckRequest.payload as { summary?: string }).summary : null;
  const noticeSummary =
    summaryRaw ?? `The operator confirmed the fix for incident ${incident.incident_id.slice(0, 12)}.`;

  return (
    <Container width={ContainerWidth.Bangla}>
      <div className="page-header">
        <h1 data-testid="ack-page-title">Citizen acknowledgement</h1>
        <p className="page-header__sub">
          {session.display_name} · incident{' '}
          <Link to={`/inbox/${incidentId}`} className="mono">
            {incidentId.slice(0, 12)}
          </Link>{' '}
          · ward {incident.ward_id ?? '—'}
        </p>
      </div>

      <Card testId="ack-notice-card">
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Operator notice</h3>
        <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
          {lastAckRequest !== null
            ? `Sent via ${(lastAckRequest.payload as { channel?: string }).channel ?? 'in-app'} · ${format('time-full', lastAckRequest.occurred_at)}`
            : 'No notice was sent. You can still respond to the operator.'}
        </p>
        <blockquote
          className="page-header__sub"
          data-testid="ack-notice-body"
          style={{
            margin: 0,
            marginTop: 'var(--space-md)',
            padding: 'var(--space-md)',
            borderLeft: '3px solid var(--brand-500)',
            background: 'var(--bg-inset)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--fg-default)',
            lineHeight: 'var(--line-height-body)',
          }}
        >
          {noticeSummary}
        </blockquote>
      </Card>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <Card testId="ack-decision-card">
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Did the fix resolve the issue?</h3>
          <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
            Approve to close the incident. Dispute to reopen it for review.
          </p>

          <div className="submit-form__actions">
            <Button
              variant="primary"
              size="md"
              disabled={actions.busy}
              onClick={() => {
                void onSubmit(true);
              }}
              testId="ack-approve"
            >
              {actions.busy ? 'Sealing…' : '✅ Approve & close'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              disabled={actions.busy}
              onClick={() => {
                void onSubmit(false);
              }}
              testId="ack-dispute"
            >
              {actions.busy ? 'Sealing…' : '❌ Dispute & reopen'}
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
