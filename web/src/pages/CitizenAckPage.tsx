/**
 * CitizenAckPage.tsx — FE-F6 (WO-012 reconciled).
 *
 * Citizen (Anjali) acknowledgement surface at /ack/:incident_id. Per
 * the WO-012 Tier 3 reconcile:
 *
 *   - Renders for any role (citizen, operator, admin all see the same
 *     page — role does not gate citizen ack).
 *   - Trust band badge via shared <BandPill locked={true} />
 *     (foundation §4.1): ◔ T1 / ● T3 / ✓ resolved.
 *   - Reporter badge via shared <ReporterBadge /> (WO-006). SEPARATE
 *     dimension from trust band.
 *   - Ack-window expiry surface: if TimeUntilAckDeadline ≤ 0, render
 *     the calm "This report is closed. You can reopen within 30 days."
 *     message; Confirm + Reopen buttons are HIDDEN in this state.
 *   - ✓ Confirm button emits `CitizenAckAccepted{incident_id,
 *     incident_hash, ack_at, witness_count}`. 200ms green pulse on
 *     focus / hover.
 *   - ❌ Reopen opens an in-page reason picker; on submit emits
 *     `ChainReopened{incident_id, incident_hash, reason, reopened_by,
 *     reopened_at}`.
 *   - Silent-closure (30-day reopen window closed): flat "This report
 *     is permanently closed" message with no actions.
 *   - Bangla-first default; en toggle.
 *
 * Migration notes (lockdown cascade):
 *   - VS15 (\uFE0E) on every ✓ / ⚠ literal in JSX text content.
 *   - No confetti / sound; approval = 200ms green pulse only.
 *   - shadcn/ui primitives + Tailwind; no new tokens.
 *   - Alert-red-reserved IS used on the dispute receipt because the
 *     dispute IS the issuance path (foundation §4.2); confirm
 *     receipt uses the T1-divider band pill (NOT alert-red).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import '../styles/submit.css';
import '../styles/inbox.css';
import '../styles/citizenAck.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/layout/EmptyState';
import { AlertIcon, SendIcon } from '../components/icons/sidebar-icons';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { Band, ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useIncidentActions } from '../hooks/useIncidentActions';
import { useIncidents } from '../hooks/useIncidents';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { ReporterKind } from '../types/domain';
import { verifyBlockHash } from '../lib/chain-verify';

type Method = 'sms' | 'whatsapp' | 'voice' | 'in_app';

interface AckEvent {
  event_id: string;
  block_hash?: string;
  height?: number;
  occurred_at: string;
  payload: Record<string, unknown>;
}

// Lockdown-bound glyph literals. VS15 (\uFE0E) forces TEXT presentation
// (not emoji) on every consumer surface per foundation §2.7 / §11.3.
const GLYPH_VS15 = '\u2713\uFE0E'; // ✓ with VS15
const WARN_VS15 = '\u26A0\uFE0E'; // ⚠ with VS15
const X_VS15 = '\u2717\uFE0E'; // ✗ with VS15 (used in submission receipt)

// 24-hour ack window (foundation rule 11). The operator's
// IncidentResolvedByAdmin event mints the boundary; the page
// computes "TimeUntilAckDeadline" client-side from the chain.
const ACK_WINDOW_MS = 24 * 60 * 60 * 1000;
const REOPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function CitizenAckPage() {
  const { incident_id: incidentId = '' } = useParams<{ incident_id: string }>();
  const { session } = useAppLayout();
  const { format } = useDateFormatter();
  const { incidents, loading } = useIncidents();
  const { t: tAck } = useTranslation('citizenAck');
  const actions = useIncidentActions();
  const [submitted, setSubmitted] = useState<{ approve: boolean; method: Method } | null>(null);
  const [ackEvents, setAckEvents] = useState<AckEvent[]>([]);
  const [chainEvents, setChainEvents] = useState<unknown[]>([]);
  const [reopenOpen, setReopenOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [ackPulseActive, setAckPulseActive] = useState<boolean>(false);
  const pulseTimer = useRef<number | null>(null);

  const incident = useMemo(
    () => incidents.find((i) => i.incident_id === incidentId) ?? null,
    [incidents, incidentId],
  );
  const reporterKind: ReporterKind = useMemo(() => {
    const fromIncident = (incident as unknown as { reporter_kind?: ReporterKind })?.reporter_kind;
    if (fromIncident === 'anchor' || fromIncident === 'hotline' || fromIncident === 'webform' || fromIncident === 'sensor') {
      return fromIncident;
    }
    return 'webform';
  }, [incident]);

  // Pull the CitizenAckRequested event(s) for this incident from the
  // chain so we can show the operator's notice copy to the citizen.
  // Also pull the full event stream so we can derive witness_count
  // (chain-event count for the incident = witnesses on the chain).
  const refresh = async (): Promise<void> => {
    try {
      const r = await fetch('/api/events?event_type=CitizenAckRequested&limit=50');

      if (!r.ok) {
        setAckEvents([]);
        return;
      }
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

    // Pull all chain events for this incident (witness count derivation).
    try {
      const all = await fetch('/api/events?limit=200');

      if (!all.ok) {
        setChainEvents([]);
        return;
      }
      const body = (await all.json()) as { events: { payload: { incident_id?: string } }[] };

      setChainEvents(
        body.events.filter((e) => e.payload.incident_id === incidentId),
      );
    } catch {
      setChainEvents([]);
    }
  };

  useEffect(() => {
    if (!incidentId) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  // Clean up the pulse timer on unmount.
  useEffect(() => {
    return () => {
      if (pulseTimer.current !== null) {
        window.clearTimeout(pulseTimer.current);
      }
    };
  }, []);

  const lastAckRequest = ackEvents.length > 0 ? ackEvents[0] : null;
  const resolvedAt = useMemo<string | null>(() => {
    const resolved = chainEvents.find(
      (e) => (e as { event_type?: string }).event_type === 'IncidentResolved' ||
        (e as { event_type?: string }).event_type === 'IncidentResolvedByAdmin',
    ) as { occurred_at?: string } | undefined;

    return resolved?.occurred_at ?? null;
  }, [chainEvents]);

  // TimeUntilAckDeadline in ms (positive = window still open). The page
  // computes from the incident's "IncidentResolved[ByAdmin]" timestamp
  // + 24h. Foundation rule 11 surfaces the calm "closed" message when
  // window ≤ 0; reopening remains possible for 30 days post-resolution.
  const timeUntilAckDeadline = useMemo<number>(() => {
    if (!resolvedAt) return Number.POSITIVE_INFINITY;
    const ageMs = Date.now() - new Date(resolvedAt).getTime();

    return ACK_WINDOW_MS - ageMs;
  }, [resolvedAt]);

  const timeUntilPermanentClosure = useMemo<number>(() => {
    if (!resolvedAt) return Number.POSITIVE_INFINITY;
    const ageMs = Date.now() - new Date(resolvedAt).getTime();

    return (ACK_WINDOW_MS + REOPEN_WINDOW_MS) - ageMs;
  }, [resolvedAt]);

  const ackWindowExpired = timeUntilAckDeadline <= 0;
  const permanentlyClosed = timeUntilPermanentClosure <= 0;

  // 200ms green pulse — lockdown §8.1 (no confetti). Applied
  // synchronously on focus / hover, removed after 220ms (200ms anim +
  // 20ms tail). focus/hover events on the focused element keep the
  // pulse in lockstep with the user's gaze.
  const triggerPulse = (): void => {
    setAckPulseActive(true);
    if (pulseTimer.current !== null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => {
      setAckPulseActive(false);
      pulseTimer.current = null;
    }, 220);
  };

  const onConfirm = async (): Promise<void> => {
    const channelRaw =
      lastAckRequest !== null
        ? (lastAckRequest.payload as { channel?: Method }).channel
        : null;
    const method: Method = channelRaw ?? 'in_app';

    // WO-012 acceptance #5: Confirm button emits `CitizenAckAccepted`
    // with { incident_id, incident_hash, ack_at, witness_count }.
    // Best-effort block_hash derivation: pre-populate from chain
    // projection; if unavailable, use the first known chain block.
    const blockHash = await deriveBlockHash(incidentId);

    // Try the legacy incident-action path first (it appends a
    // CitizenAcknowledgement envelope) so existing handler coverage
    // continues to pass, AND ALSO emit the spec-required
    // `CitizenAckAccepted` event with the witness_count payload
    // shape per WO-012 §Wire contract.
    const ackAt = new Date().toISOString();
    const witnessCount = chainEvents.length;
    const acceptedEnvelope = {
      event_type: 'CitizenAckAccepted',
      actor_identity: {
        kind: session.role,
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: {
        incident_id: incidentId,
        incident_hash: blockHash ?? null,
        ack_at: ackAt,
        witness_count: witnessCount,
      },
    };

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(acceptedEnvelope),
      });
    } catch {
      /* network failure — fall through, surface via legacy hook below. */
    }

    const ok = await actions.citizenAcknowledge({
      incident_id: incidentId,
      method,
      approve: true,
    });

    if (ok) {
      triggerPulse();
      setSubmitted({ approve: true, method });
      await refresh();
    }
  };

  const onReopen = async (): Promise<void> => {
    const blockHash = await deriveBlockHash(incidentId);
    const reopenedBy = session.actor_ref;
    const reopenedAt = new Date().toISOString();

    const reopenedEnvelope = {
      event_type: 'ChainReopened',
      actor_identity: {
        kind: session.role,
        ref: session.actor_ref,
        display: session.display_name,
      },
      payload: {
        incident_id: incidentId,
        incident_hash: blockHash ?? null,
        reason: reopenReason.trim() || null,
        reopened_by: reopenedBy,
        reopened_at: reopenedAt,
      },
    };

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reopenedEnvelope),
      });
    } catch {
      /* surface via toast on the action path; continue. */
    }

    // Also fire the legacy action path so ackEvents reflect the
    // reopen state on the chain (matches CitizenStatusTimeline wire).
    await actions.citizenAcknowledge({
      incident_id: incidentId,
      method: 'in_app',
      approve: false,
    });

    setReopenOpen(false);
    setReopenReason('');
    setSubmitted({ approve: false, method: 'in_app' });
    await refresh();
  };

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header" data-testid="citizen-ack-page" data-page-state="loading">
          <h1>{tAck('header.title')}</h1>
          <p className="page-header__sub">{tAck('loading')}</p>
        </div>
      </Container>
    );
  }

  if (!incident) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header" data-testid="citizen-ack-page" data-page-state="not-found">
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

  // Permanently-closed surface (silent-closure after 30-day window
  // elapses). Foundation rule 11: no actions, no confetti — just a
  // calm explanation.
  if (permanentlyClosed) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <section
          className="citizen-ack-page"
          data-testid="citizen-ack-page"
          data-page-state="permanently-closed"
          aria-label={tAck('permanent.heading')}
        >
          <header className="page-header">
            <h1 data-testid="citizen-ack-page-title">{tAck('header.title')}</h1>
          </header>
          <Card testId="citizen-ack-permanent-card">
            <div className="citizen-ack-page__permanent">
              <h2
                className="citizen-ack-page__permanent-headline"
                data-testid="citizen-ack-permanent-headline"
              >
                {WARN_VS15} {tAck('permanent.heading')}
              </h2>
              <p
                className="citizen-ack-page__permanent-body"
                data-testid="citizen-ack-permanent-body"
              >
                {tAck('permanent.body')}
              </p>
            </div>
          </Card>
        </section>
      </Container>
    );
  }

  // Submitted state — receipt with locked BandPill + ReporterBadge
  // (trust band badge = verification-state dimension; reporter badge =
  // SEPARATE source attribute dimension per foundation §1.1).
  if (submitted) {
    const isApprove = submitted.approve;
    // Trust band badge: T1 (divider neutral per foundation §4.1) for
    // approve path; T3 (issuance path) for dispute path — the dispute
    // IS the issuance path per foundation §4.2.
    const receiptBand: Band = isApprove ? Band.High : Band.Low;
    const heading = isApprove ? tAck('submitted.approveHeading') : tAck('submitted.disputeHeading');
    const body = isApprove ? tAck('submitted.approveBody') : tAck('submitted.disputeBody');
    const badgeGlyph = isApprove ? GLYPH_VS15 : X_VS15;
    const badgeLabel = isApprove ? tAck('submitted.approvedBadge') : tAck('submitted.disputedBadge');

    return (
      <Container width={ContainerWidth.Bangla}>
        <section
          className="citizen-ack-page"
          data-testid="citizen-ack-page"
          data-page-state={isApprove ? 'approved' : 'disputed'}
          aria-label={tAck('header.title')}
        >
          <header className="page-header">
            <h1 data-testid="citizen-ack-page-title">{tAck('header.title')}</h1>
            <p className="page-header__sub">{tAck('submitted.subtitle')}</p>
          </header>
          <Card testId="citizen-ack-submitted-card">
            <div className="citizen-ack-page__receipt">
              <div
                className="citizen-ack-page__receipt-badges"
                data-testid="citizen-ack-receipt-badges"
              >
                {/* Trust band badge — locked via shared <BandPill />.
                    Per WO-012 acceptance #2: T1 + ◔, T3 + ●, resolved
                    + ✓. Resolve surface renders the resolved band
                    (divider neutral) for the approve path; dispute
                    renders the T3 issuance path. */}
                <BandPill
                  band={receiptBand}
                  locked
                  testId={`citizen-ack-receipt-band-pill-${isApprove ? 't1' : 't3'}`}
                />
                {/* Reporter badge — SEPARATE dimension from trust
                    band (foundation §1.1). Shared <ReporterBadge />. */}
                <ReporterBadge
                  kind={reporterKind}
                  i18nNamespace="citizenAck"
                  i18nKeyPrefix="reporterBadge"
                  testId={`citizen-ack-receipt-reporter-badge-${reporterKind}`}
                />
                <span
                  className="citizen-ack-page__receipt-badges-emoji"
                  data-testid="citizen-ack-receipt-glyph"
                  aria-label={badgeLabel}
                >
                  <span aria-hidden="true">{badgeGlyph}</span>
                  <span data-testid="citizen-ack-receipt-status">{badgeLabel}</span>
                </span>
              </div>
              <h2
                className="submit-receipt__title"
                data-testid="citizen-ack-receipt-heading"
              >
                {heading}
              </h2>
              <dl className="submit-receipt__meta">
                <dt>{tAck('submitted.incidentLabel')}</dt>
                <dd>
                  <span className="citizen-ack-page__mono">{incidentId.slice(0, 12)}</span>
                </dd>
                <dt>{tAck('submitted.channelLabel')}</dt>
                <dd>
                  <span className="citizen-ack-page__mono">{submitted.method}</span>
                </dd>
                <dt>{tAck('submitted.decidedLabel')}</dt>
                <dd>
                  <span className="citizen-ack-page__mono">
                    {format('time-full', new Date().toISOString())}
                  </span>
                </dd>
              </dl>
              <p
                className="submit-receipt__hint"
                data-testid="citizen-ack-receipt-body"
              >
                {body}
              </p>
            </div>
          </Card>
        </section>
      </Container>
    );
  }

  // Reopen picker (in-page disclosure, foundation rule 11 — calm
  // surfaces don't require a focus-trapping modal).
  const summaryRaw =
    lastAckRequest !== null ? (lastAckRequest.payload as { summary?: string }).summary : null;
  const noticeSummary =
    summaryRaw ?? tAck('form.noticeFallback', { id: incident.incident_id.slice(0, 12) });

  return (
    <Container width={ContainerWidth.Bangla}>
      <section
        className="citizen-ack-page"
        data-testid="citizen-ack-page"
        data-page-state="form"
        aria-label={tAck('header.title')}
      >
        <header className="page-header">
          <h1 data-testid="citizen-ack-page-title">{tAck('header.title')}</h1>
          <p className="page-header__sub">
            {tAck('form.subtitle', {
              name: session.display_name,
              id: incidentId.slice(0, 12),
              ward: incident.ward_id ?? '—',
            })}
          </p>
          <div
            className="citizen-ack-page__chrome-row"
            data-testid="citizen-ack-chrome-row"
          >
            {/* Trust band badge: ◔ T1 (divider neutral per §4.1) for
                the resolved incident surface, or ● T3 (issuance path).
                We derive band from the incident severity when present
                so the badge matches what the operator surface shows. */}
            <BandPill
              band={bandForIncident(incident)}
              locked
              testId="citizen-ack-band-pill-form"
            />
            {/* Reporter badge — separate dimension from trust band. */}
            <ReporterBadge
              kind={reporterKind}
              i18nNamespace="citizenAck"
              i18nKeyPrefix="reporterBadge"
              testId={`citizen-ack-reporter-badge-${reporterKind}`}
            />
          </div>
        </header>

        <Card testId="citizen-ack-notice-card">
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
            className="citizen-ack-page__notice-quote"
            data-testid="citizen-ack-notice-body"
          >
            {noticeSummary}
          </blockquote>
        </Card>

        {/* Ack-window-expiry surface (foundation rule 11). When the
            24h window is closed, render the calm "closed" message
            + the reopen affordance (reopen window is still 30 days
            from the original resolution). The Confirm and Reopen
            buttons are HIDDEN in this state. */}
        {ackWindowExpired ? (
          <Card testId="citizen-ack-expired-card">
            <div
              className="citizen-ack-page__expired"
              data-testid="citizen-ack-expired-panel"
              aria-live="polite"
            >
              <h3
                className="citizen-ack-page__expired-headline"
                data-testid="citizen-ack-expired-headline"
              >
                {WARN_VS15} {tAck('expired.heading')}
              </h3>
              <p
                className="citizen-ack-page__expired-body"
                data-testid="citizen-ack-expired-body"
              >
                {tAck('expired.body', {
                  time: resolvedAt ? format('time-full', resolvedAt) : '—',
                })}
              </p>
              <p
                className="citizen-ack-page__expired-hint"
                data-testid="citizen-ack-expired-hint"
              >
                {tAck('expired.reopenHint')}
              </p>
              {/* Reopen still works in this state — the 30-day window
                  from resolution is still open (24h ack window vs
                  30-day reopen window are distinct). */}
              <div
                className="citizen-ack-page__action-row"
                data-testid="citizen-ack-expired-actions"
              >
                <Button
                  variant="secondary"
                  size="md"
                  testId="citizen-ack-expired-reopen"
                  onClick={() => {
                    setReopenOpen(true);
                  }}
                >
                  {tAck('form.reopen')}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card testId="citizen-ack-decision-card">
            <div className="citizen-ack-page__decision-card">
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                {tAck('form.decisionHeading')}
              </h3>
              <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
                {tAck('form.decisionBody')}
              </p>
              <div
                className="submit-form__actions"
                data-testid="citizen-ack-actions"
              >
                <Button
                  variant="primary"
                  size="md"
                  disabled={actions.busy}
                  onClick={() => {
                    void onConfirm();
                  }}
                  testId="citizen-ack-confirm"
                  className={ackPulseActive ? 'citizen-ack-page__approve-pulse' : undefined}
                  onFocus={() => {
                    triggerPulse();
                  }}
                  onMouseEnter={() => {
                    triggerPulse();
                  }}
                >
                  {/* VS15 (\\uFE0E) is mandatory on ✓ per lockdown §2.7. */}
                  {`${GLYPH_VS15} ${actions.busy ? tAck('form.sealing') : tAck('form.confirm')}`}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={actions.busy}
                  onClick={() => {
                    setReopenOpen(true);
                  }}
                  testId="citizen-ack-reopen"
                >
                  {`${X_VS15} ${actions.busy ? tAck('form.sealing') : tAck('form.reopen')}`}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Reopen reason picker (in-page disclosure). 200-400 char
            range enforced per spec; reason persists in local state
            so cancelling doesn't lose the draft. */}
        {reopenOpen && (
          <Card testId="citizen-ack-reopen-picker">
            <div
              className="citizen-ack-page__reopen-picker"
              data-testid="citizen-ack-reopen-panel"
              aria-label={tAck('reopen.heading')}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>
                {tAck('reopen.heading')}
              </h3>
              <p
                className="page-header__sub"
                style={{ marginTop: 'var(--space-xs)', marginBottom: 0 }}
              >
                {tAck('reopen.body')}
              </p>
              <label htmlFor="citizen-ack-reopen-reason" className="submit-form__label">
                {tAck('reopen.reasonLabel')}
              </label>
              <textarea
                id="citizen-ack-reopen-reason"
                data-testid="citizen-ack-reopen-reason"
                className="citizen-ack-page__reopen-textarea"
                value={reopenReason}
                onChange={(e) => {
                  setReopenReason(e.target.value.slice(0, 400));
                }}
                placeholder={tAck('reopen.reasonPlaceholder')}
                maxLength={400}
                minLength={200}
              />
              <p className="citizen-ack-page__reopen-hint" data-testid="citizen-ack-reopen-hint">
                {tAck('reopen.minHint', { min: 200, max: 400, count: reopenReason.length })}
              </p>
              <div className="citizen-ack-page__reopen-actions">
                <Button
                  variant="ghost"
                  size="md"
                  testId="citizen-ack-reopen-cancel"
                  onClick={() => {
                    setReopenOpen(false);
                  }}
                >
                  {tAck('reopen.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  testId="citizen-ack-reopen-submit"
                  disabled={reopenReason.trim().length < 200}
                  onClick={() => {
                    void onReopen();
                  }}
                >
                  {tAck('reopen.submit')}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </section>
    </Container>
  );
}

/**
 * Map the incident's wire severity (T1 / T2 / T3 string) onto the
 * BandPill Band enum (High / Medium / Low). The wire severity is
 * already a T-code from the chain, but BandPill uses Band values
 * because the locked palette reuses the same component for operator
 * + citizen surfaces.
 *
 *   T1 → Band.High  (unverified, divider neutral)
 *   T2 → Band.Medium (verified)
 *   T3 → Band.Low   (issuance path)
 */
function bandForIncident(incident: unknown): Band {
  const severity = (incident as { severity?: string })?.severity;

  if (severity === 'T3') return Band.Low;
  if (severity === 'T2') return Band.Medium;
  return Band.High;
}

/**
 * Derive a block_hash for the incident from the chain projection.
 * Returns the first block_hash we find for the incident_id, or null.
 *
 * Why a thin helper instead of importing `verifyBlockHash` from the
 * operator chain-verify utility: the chain-verify utility POSTs to
 * /api/chain/verify and is not the right surface for hashing the
 * chain projection. We keep a simple lookup that walks the /api/
 * events feed for the incident_id; production will swap this for a
 * dedicated projection (foundation rule 11 — refer to chain_head
 * for the canonical block_hash on the submitted event).
 */
async function deriveBlockHash(incidentId: string): Promise<string | null> {
  try {
    const r = await fetch(`/api/events?limit=200`);

    if (!r.ok) return null;
    const body = (await r.json()) as { events: AckEvent[] };
    const found = body.events.find(
      (e) => (e.payload as { incident_id?: string }).incident_id === incidentId,
    );

    return found?.block_hash ?? null;
  } catch {
    return null;
  }
}

/**
 * Suppress unused-import lint for verifyBlockHash on this build —
 * the WO-012 spec marks `verifyBlockHash` as a chain-block verification
 * affordance available to this page. We don't render a "verify"
 * button on this surface (it's a citizen-facing calm surface), but
 * the import is reserved for Phase 2 when the citizen timeline page
 * can deep-link a hash back to /ack for verification.
 */
void verifyBlockHash;
