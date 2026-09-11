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
 *
 * Lockdown cascade (2026-09-11):
 *   - VS15 on glyphs: `✓︎` and `⚠︎` (text style, not emoji style).
 *     Spec foundation §2.7 mandates U+FE0E on every consumer-surface
 *     glyph so the renderer doesn't fall back to color emoji on
 *     Android / Edge.
 *   - Glyph + text redundancy on receipt badges (foundation §4.1):
 *     T1 → `◔ APPROVED`; T3 → `● DISPUTED`.
 *   - Ack-window expiry state: per foundation rule 11 ("silence is
 *     data"), the page renders a calm closed-state when the 5-min
 *     window has elapsed (computed from `last_occurred_at` since the
 *     incident projection does not yet carry `ack_window_expires_at`).
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

// Lockdown §2.7: VS15 (\uFE0E) forces text-style glyphs across all
// renderers. Plain `✓` / `⚠` would fall back to color emoji on Android,
// which the lockdown forbids on consumer surfaces.
const GLYPH_CHECK = '\u2713\uFE0E';
const GLYPH_WARN = '\u26A0\uFE0E';
// Foundation §4.1 — trust-band glyphs that pair with the T1/T3 badge text.
const GLYPH_T1 = '\u25D4'; // ◔
const GLYPH_T3 = '\u25CF'; // ●

// Lockdown cascade 2026-09-11: the citizen ack window is the dual-channel
// SLA from scenario 03. After this elapses, silence becomes a verified
// outcome (foundation rule 11). 5 minutes matches the spec.
const ACK_WINDOW_MS = 5 * 60 * 1000;

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
  const { t: tAck } = useTranslation('citizenAck');

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

  // Lockdown cascade 2026-09-11: compute whether the ack window has
  // already elapsed. Foundation rule 11 — silence is data. We derive
  // the window from `last_occurred_at` since the incident projection
  // does not yet carry `ack_window_expires_at`; the incident_status
  // enum (open / resolved / escalated) is the wire-of-record. If the
  // most recent event was a CitizenAckRequested more than 5min ago
  // and no ack has landed, the window has expired.
  const ackWindowExpired = useMemo(() => {
    if (!lastAckRequest) return false;
    const elapsed = Date.now() - new Date(lastAckRequest.occurred_at).getTime();

    return elapsed > ACK_WINDOW_MS;
  }, [lastAckRequest]);

  if (!isAnjali) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{tAck('header.title')}</h1>
        </div>
        <Card>
          <EmptyState
            icon={<SendIcon />}
            heading={tAck('roleGate.heading')}
            body={tAck('roleGate.body', { role: session.role })}
          />
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{tAck('header.title')}</h1>
          <p className="page-header__sub">{tAck('loading')}</p>
        </div>
      </Container>
    );
  }

  if (!incident) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{tAck('header.title')}</h1>
        </div>
        <Card>
          <EmptyState
            icon={<AlertIcon />}
            heading={tAck('notFound.heading')}
            body={tAck('notFound.body', { id: incidentId.slice(0, 12) })}
          />
        </Card>
      </Container>
    );
  }

  if (submitted) {
    const heading = submitted.approve
      ? tAck('submitted.approveHeading')
      : tAck('submitted.disputeHeading');
    const body = submitted.approve ? tAck('submitted.approveBody') : tAck('submitted.disputeBody');
    // Lockdown cascade 2026-09-11: receipt uses the lockdown-bound badge
    // classes (--color-trust-t1 / --color-trust-t3-issuance) and pairs
    // the trust-band text label with the §4.1 glyph for accessibility.
    const badgeClass = submitted.approve ? 'badge badge--t1-locked' : 'badge badge--t3-locked';
    const badgeGlyph = submitted.approve ? GLYPH_T1 : GLYPH_T3;
    const badgeText = submitted.approve ? tAck('submitted.approvedBadge') : tAck('submitted.disputedBadge');
    const badgeDataTest = submitted.approve ? 'ack-approved-badge' : 'ack-disputed-badge';

    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{tAck('header.title')}</h1>
          <p className="page-header__sub">{tAck('submitted.subtitle')}</p>
        </div>
        <Card testId="ack-submitted-card">
          <div className="submit-receipt">
            <span
              className={badgeClass}
              data-testid={badgeDataTest}
              aria-label={`${badgeText} ${submitted.approve ? 'trust band T1' : 'trust band T3 issuance'}`}
            >
              <span className="badge__glyph" aria-hidden="true">{badgeGlyph}</span>
              <span>{badgeText}</span>
            </span>
            <h2 className="submit-receipt__title">{heading}</h2>
            <dl className="submit-receipt__meta">
              <dt>{tAck('submitted.incidentLabel')}</dt>
              <dd>
                <span className="mono">{incidentId.slice(0, 12)}</span>
              </dd>
              <dt>{tAck('submitted.channelLabel')}</dt>
              <dd>
                <span className="mono">{submitted.method}</span>
              </dd>
              <dt>{tAck('submitted.decidedLabel')}</dt>
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
    summaryRaw ?? tAck('form.noticeFallback', { id: incident.incident_id.slice(0, 12) });

  return (
    <Container width={ContainerWidth.Bangla}>
      <div className="page-header">
        <h1 data-testid="ack-page-title">{tAck('header.title')}</h1>
        <p className="page-header__sub">
          {tAck('form.subtitle', {
            name: session.display_name,
            id: incidentId.slice(0, 12),
            ward: incident.ward_id ?? '—',
          })}
        </p>
      </div>

      <Card testId="ack-notice-card">
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{tAck('form.noticeHeading')}</h3>
        <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
          {lastAckRequest !== null
            ? tAck('form.noticeMetaSent', {
                channel: (lastAckRequest.payload as { channel?: string }).channel ?? 'in-app',
                time: format('time-full', lastAckRequest.occurred_at),
              })
            : tAck('form.noticeMetaNone')}
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
        <Card testId={ackWindowExpired ? 'ack-expired-card' : 'ack-decision-card'}>
          {ackWindowExpired ? (
            <>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                <span aria-hidden="true">{GLYPH_CHECK}</span>{' '}
                {tAck('expired.heading')}
              </h3>
              <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
                {tAck('expired.body', {
                  time: format('time-full', lastAckRequest!.occurred_at),
                })}
              </p>
              <p className="submit-receipt__hint" style={{ marginTop: 'var(--space-md)' }}>
                {tAck('expired.reopenHint')}
              </p>
            </>
          ) : (
            <>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{tAck('form.decisionHeading')}</h3>
              <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
                {tAck('form.decisionBody')}
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
                  <span aria-hidden="true">{GLYPH_CHECK}</span>{' '}
                  {actions.busy ? tAck('form.sealing') : tAck('form.approve')}
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
                  <span aria-hidden="true">{GLYPH_WARN}</span>{' '}
                  {actions.busy ? tAck('form.sealing') : tAck('form.dispute')}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </Container>
  );
}
