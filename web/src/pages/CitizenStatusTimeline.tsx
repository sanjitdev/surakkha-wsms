/**
 * CitizenStatusTimeline.tsx — citizen-status-timeline.md.
 *
 * Tier 1 NEW build (Batch 5) — the public-mode timeline projection for
 * an Anjali (citizen) report. Renders the curated `CitizenVisibleEventType`
 * subset of chain events without payloads, hashes, or JSON (Scenario 06
 * locked decision #1 + #6).
 *
 * URL pattern: /my-reports/:incident_id/timeline (per §13). Phase 1
 * reads the same `/api/events` feed as the operator surfaces and
 * filters client-side.
 *
 * Phase 1 scope (deliberately narrow):
 *   - Vertical timeline of citizen-visible events, newest at top.
 *   - Plain-language titles via `citizen.statusTimeline.event.*` keys.
 *   - Relative timestamps (`x min ago`) honouring locale.
 *   - ActionCall card with the four canonical states (closure-ack,
 *     silent-closure-reopen, in-progress-reassurance, all-caught-up)
 *     rendered as informational placeholders. Closure tap UI is wired
 *     to CitizenAckPage rather than inlined — keeping this surface
 *     informational per §2.
 *
 * Out of Phase 1 scope (deferred):
 *   - Live `CitizenAckAccepted` / `CitizenReopened` write paths
 *     (those land on CitizenAckPage already).
 *   - "Quiet for X days" auto-injected row (§14 #5) — Phase 4.5.
 *   - Reopen-with-reason modal — already lives in CitizenAckPage.
 *   - Auto-poll / visibilitychange listener — Phase 4.5.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';

/**
 * Citizen-visible event types per spec §12 mapping table. Operator-internal
 * events are filtered out at the data layer — this is the same projection
 * that Scenario 06 Use Case C describes, expressed as a constant set so
 * the filter is a one-liner.
 */
const CITIZEN_VISIBLE_EVENTS = new Set<string>([
  'IncidentCreated',
  'TrustBandAssigned',
  'AssignedToTechnician',
  'TechnicianEnRoute',
  'TechnicianArrived',
  'DiagnosisSubmitted',
  'FixSubmitted',
  'ProofSubmitted',
  'ProofAccepted',
  'IncidentResolvedByAdmin',
  'CitizenAckAccepted',
  'CitizenAckRejected',
  'CitizenReopened',
  'CitizenAckWindowExpired',
  'IncidentClosed',
]);

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}

function relativeLabel(
  iso: string,
  now: number,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  const ts = new Date(iso).getTime();
  const deltaSec = Math.max(0, Math.round((now - ts) / 1000));
  if (deltaSec < 60) return t('time.justNow');
  const minutes = Math.round(deltaSec / 60);
  if (minutes < 60) return t('time.minutesAgo', { count: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t('time.hoursAgo', { count: hours });
  const days = Math.round(hours / 24);
  return t('time.daysAgo', { count: days });
}

/**
 * Derives one of the four canonical ActionCall states from the timeline.
 * Pure projection per spec §7 — no separate mutable state.
 *
 * Priority order matches spec §6:
 *   1) closure-ack     — IncidentResolvedByAdmin, no ack yet, <30 days
 *   2) silent-closure  — CitizenAckWindowExpired in timeline
 *   3) in-progress     — work is still happening (the common case)
 *   4) all-caught-up   — IncidentClosed ack'd ✅ (terminal happy path)
 */
function deriveActionCallState(events: ChainEvent[]): 'all-caught-up' | 'closure-ack' | 'silent-closure' | 'in-progress' {
  const types = new Set(events.map((e) => e.event_type));
  if (types.has('CitizenAckWindowExpired') && types.has('IncidentClosed')) return 'silent-closure';
  if (types.has('IncidentResolvedByAdmin') && !types.has('CitizenAckAccepted') && !types.has('CitizenAckWindowExpired')) {
    return 'closure-ack';
  }
  // Terminal: closed + acked
  if (types.has('IncidentClosed') && types.has('CitizenAckAccepted')) return 'all-caught-up';
  // Work still in progress (default case for non-terminal chains).
  return 'in-progress';
}

export function CitizenStatusTimeline() {
  const { incident_id: incidentId = '' } = useParams<{ incident_id: string }>();
  const { t } = useTranslation('citizenStatusTimeline');
  const { format: formatTime } = useDateFormatter();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const cancelled = { current: false };

    void (async () => {
      try {
        const r = (await fetch('/api/events?limit=200').then((res) => res.json())) as {
          events: ChainEvent[];
        };

        if (cancelled.current) return;
        setEvents(r.events);
      } catch (err) {
        console.error('[surakkha] citizen-timeline fetch failed', err);
        if (!cancelled.current) setEvents([]);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  // Tick the relative timestamp every minute. Cheap; one setState per
  // minute keeps the "X min ago" labels honest.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  const visibleEvents = useMemo(() => {
    return events
      .filter((e) => (e.payload as { incident_id?: string }).incident_id === incidentId)
      .filter((e) => CITIZEN_VISIBLE_EVENTS.has(e.event_type))
      .sort((a, b) => b.height - a.height);
  }, [events, incidentId]);

  const actionCallState = deriveActionCallState(visibleEvents);

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{t('loading.title')}</h1>
        </div>
        <Card>
          <div
            className="skeleton-stack"
            data-testid="citizen-timeline-skeleton"
            aria-label={t('loading.ariaLabel')}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '64px',
                  marginBottom: 'var(--space-sm)',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              />
            ))}
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container width={ContainerWidth.Bangla}>
      <div className="page-header">
        <Link
          to="/"
          className="mono"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--fg-tertiary)',
            textDecoration: 'none',
          }}
          data-testid="citizen-timeline-back"
        >
          {t('header.back')}
        </Link>
        <h1
          data-testid="citizen-timeline-title"
          style={{ marginTop: 'var(--space-md)' }}
        >
          {t('title')}
        </h1>
      </div>

      {visibleEvents.length === 0 ? (
        <Card>
          <div className="empty-state" data-testid="citizen-timeline-empty">
            <h2 className="empty-state__title">{t('empty.heading')}</h2>
            <p className="empty-state__sub">{t('empty.body')}</p>
          </div>
        </Card>
      ) : (
        <Card>
          <ul
            className="timeline"
            data-testid="citizen-timeline-list"
            aria-live="polite"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {visibleEvents.map((e) => {
              const actor = e.actor_identity?.display ?? '';
              const titleKey = `event.${e.event_type}`;
              const title = t(titleKey, { defaultValue: e.event_type });
              return (
                <li
                  key={e.event_id}
                  data-testid={`citizen-event-row-${e.event_id}`}
                >
                  <div className="timeline__time mono">{formatTime('time', e.occurred_at)}</div>
                  <p className="timeline__title">{title}</p>
                  <div
                    className="timeline__meta"
                    style={{
                      display: 'flex',
                      gap: 'var(--space-sm)',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      color: 'var(--fg-tertiary)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    {actor && <span className="mono">{actor}</span>}
                    {actor && <span className="mono">·</span>}
                    <span
                      className="mono"
                      data-testid={`citizen-event-relative-${e.event_id}`}
                    >
                      {relativeLabel(e.occurred_at, now, t)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* ActionCall — the one thing to do (per §6). */}
      <section
        aria-labelledby="citizen-action-call-title"
        data-testid={`citizen-action-call-${actionCallState}`}
        style={{ marginTop: 'var(--space-md)' }}
      >
        <Card>
          <h2
            id="citizen-action-call-title"
            style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}
          >
            {t(`actionCall.${actionCallState}.title`)}
          </h2>
          <p
            className="page-header__sub"
            style={{ marginTop: 'var(--space-xs)' }}
          >
            {t(`actionCall.${actionCallState}.body`)}
          </p>
          {actionCallState === 'closure-ack' && (
            <div className="submit-form__actions" style={{ marginTop: 'var(--space-md)' }}>
              <Link to={`/ack/${incidentId}`} data-testid="citizen-action-call-confirm">
                <span
                  style={{
                    display: 'inline-block',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--color-safe-green)',
                    color: 'white',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {t('actionCall.closure-ack.confirm')}
                </span>
              </Link>
              <Link
                to={`/ack/${incidentId}?reopen=1`}
                style={{ marginLeft: 'var(--space-sm)' }}
                data-testid="citizen-action-call-reopen"
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: 'var(--space-sm) var(--space-md)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {t('actionCall.closure-ack.reopen')}
                </span>
              </Link>
            </div>
          )}
          {actionCallState === 'silent-closure' && (
            <div className="submit-form__actions" style={{ marginTop: 'var(--space-md)' }}>
              <Link
                to={`/ack/${incidentId}?reopen=1`}
                data-testid="citizen-action-call-reopen-only"
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: 'var(--space-sm) var(--space-md)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {t('actionCall.silent-closure.reopen')}
                </span>
              </Link>
            </div>
          )}
        </Card>
      </section>
    </Container>
  );
}
