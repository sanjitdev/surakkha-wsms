/**
 * CitizenStatusTimeline.tsx — citizen-status-timeline.md (WO-001, Tier 1).
 *
 * Anjali-mobile public-mode projection of the audit chain. Renders the
 * curated `CitizenVisibleEventType` subset of chain events without
 * payloads, hashes, or JSON (Scenario 06 locked decision #1 + #6).
 *
 * URL pattern: /my-reports/:incident_id/timeline (per spec §13). Role
 * guard at the top of the component — non-`anjali` sessions redirect
 * to their persona landing (REQ-001).
 *
 * Lockdown compliance (per WO-001 §"Lockdown compliance"):
 *   - Public-mode hides payloads/hashes/JSON (REQ-002)
 *   - Bangla-first default + Bangla numerals (REQ-003)
 *   - Closure tap (✅/❌) inline when due (REQ-004)
 *   - ChainRead emitted on mount exactly once (REQ-005)
 *   - Card / Button / Modal / Toast primitives only (REQ-009)
 *   - --font-family-bangla + --line-height-body-bangla applied via
 *     .bangla-text on `[data-locale=bn]` body (REQ-010)
 *   - 200ms green pulse on closure ack; no confetti (REQ-010)
 *   - No --band-*, no T3 default, no Hindi keys (REQ-011)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import '../styles/components.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/ToastProvider';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { landingFor } from '../components/layout/nav-config';

// 06-data-formats-lockdown: Bangla numerals for any numeric formatters.
// `Intl.NumberFormat('bn-BD')` converts Latin digits to Bengali script
// (০-৯). Wired through i18next interpolation so the strings themselves
// stay locale-stable; this constant is exported for tests and for any
// numeric value that escapes i18next.
export const BN_NUMERALS = new Intl.NumberFormat('bn-BD');

/**
 * Citizen-visible event types per spec §12 mapping table. Operator-internal
 * events are filtered out at the data layer — this is the same projection
 * that Scenario 06 Use Case C describes, expressed as a constant set so
 * the filter is a one-liner.
 */
const CITIZEN_VISIBLE_EVENTS = new Set<string>([
  'IncidentCreated',
  'TrustBandAssigned',
  'TechnicianAssigned',
  'TechnicianEnRoute',
  'TechnicianArrived',
  'DiagnosisSubmitted',
  'FixSubmitted',
  'ProofSubmitted',
  'ProofAccepted',
  'PublicNoticeIssued',
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
 * Map an `actor_identity.kind` to one of the three citizen-readable actor
 * chips ("You" / "City operator" / "Field crew"). Anything we don't
 * recognise collapses to "City operator" so the chip stays stable.
 */
function actorChipKey(kind: string | undefined): 'reporter' | 'operator' | 'field' {
  if (kind === 'citizen' || kind === 'reporter') return 'reporter';
  if (kind === 'field_tech' || kind === 'technician') return 'field';
  return 'operator';
}

/**
 * Derives one of the four canonical ActionCall states from the timeline.
 * Pure projection per spec §7 — no separate mutable state.
 *
 * Priority order matches spec §6:
 *   1) closure-ack     — IncidentResolvedByAdmin, no ack yet
 *   2) silent-closure  — CitizenAckWindowExpired in timeline
 *   3) in-progress     — work is still happening (the common case)
 *   4) all-caught-up   — IncidentClosed ack'd ✅ (terminal happy path)
 */
function deriveActionCallState(events: ChainEvent[]):
  | 'all-caught-up'
  | 'closure-ack'
  | 'silent-closure'
  | 'in-progress'
  | 'reopened' {
  const types = new Set(events.map((e) => e.event_type));
  if (types.has('CitizenReopened')) return 'reopened';
  if (types.has('CitizenAckWindowExpired') && types.has('IncidentClosed'))
    return 'silent-closure';
  if (
    types.has('IncidentResolvedByAdmin') &&
    !types.has('CitizenAckAccepted') &&
    !types.has('CitizenAckWindowExpired')
  ) {
    return 'closure-ack';
  }
  if (types.has('IncidentClosed') && types.has('CitizenAckAccepted'))
    return 'all-caught-up';
  return 'in-progress';
}

export function CitizenStatusTimeline() {
  const { incident_id: incidentId = '' } = useParams<{ incident_id: string }>();
  const { t } = useTranslation('citizenStatusTimeline');
  const { format: formatTime, locale } = useDateFormatter();
  const { session } = useAppLayout();
  const toast = useToast();

  // REQ-001 — role guard. Both `anjali` (the persona minted at login)
  // and `citizen` (the role enum value per PRD §4.2) are the citizen
  // surface; redirect everyone else to their persona landing.
  if (session && session.role !== 'anjali' && session.role !== 'citizen') {
    return <Navigate to={landingFor(session.role)} replace />;
  }

  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<number>(Date.now());

  // Local optimistic flag for "you've already tapped ✅" so the closure tap
  // doesn't re-appear after a ChainAccepted write that hasn't yet round-
  // tripped through GET /api/events.
  const [acked, setAcked] = useState<boolean>(false);
  const [pulseActive, setPulseActive] = useState<boolean>(false);
  // Reopen reason picker — Modal-driven.
  const [reopenOpen, setReopenOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenSubmitted, setReopenSubmitted] = useState<boolean>(false);

  // Fetch the incident's chain segment. The MSW handler now filters by
  // ?incident_id= so we get a small slice even when the chain is large.
  useEffect(() => {
    if (!incidentId) return undefined;
    const cancelled = { current: false };

    void (async () => {
      try {
        const r = (await fetch(
          `/api/events?incident_id=${encodeURIComponent(incidentId)}&limit=200`,
        ).then((res) => res.json())) as { events: ChainEvent[] };

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
  }, [incidentId]);

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

  // REQ-005 — ChainRead on mount exactly once per route. A ref guards
  // against React 18 strict-mode double-invoke (the page mounts, the
  // effect runs, then unmounts + remounts in dev; without the flag we'd
  // emit two ChainRead events for the same render).
  const chainReadEmittedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!incidentId) return;
    if (chainReadEmittedRef.current) return;
    chainReadEmittedRef.current = true;
    void (async () => {
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: 'ChainRead',
            actor_identity: {
              kind: 'citizen',
              ref: session?.actor_ref ?? 'anonymous-citizen',
              display: session?.display_name ?? 'Citizen',
            },
            payload: {
              incident_id: incidentId,
              filter_combo: ['all'],
            },
          }),
        });
      } catch (err) {
        console.error('[surakkha] ChainRead emission failed', err);
      }
    })();
  }, [incidentId, session]);

  // Public-mode projection: hide operator-internal events AND any event
  // whose payload is stamped trust_band: T3 (consumer-notice path —
  // citizens never receive T3 incidents; PRD §3.3).
  const visibleEvents = useMemo(() => {
    return events
      .filter((e) => {
        if (e.event_type === 'ChainRead') return false;
        if ((e.payload as { trust_band?: string }).trust_band === 'T3') return false;
        return CITIZEN_VISIBLE_EVENTS.has(e.event_type);
      })
      .sort((a, b) => b.height - a.height);
  }, [events]);

  const actionCallState = deriveActionCallState(visibleEvents);

  // Hide the tap UI if the user already acked (optimistic flag).
  const effectiveActionCallState =
    actionCallState === 'closure-ack' && acked ? 'all-caught-up' : actionCallState;

  // 200ms green-pulse keyframe — set ONCE on mount via injected <style>.
  // Not a Tailwind utility; pure CSS so it survives the lockdown.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'cst-pulse-once';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');

    style.id = id;
    style.textContent = `
      @keyframes cst-green-pulse {
        0% { background-color: var(--color-safe-green-bg, #dff5e3); }
        100% { background-color: transparent; }
      }
      .cst-pulse-once {
        animation: cst-green-pulse 200ms ease-out 1;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const incidentResolvedAt = useMemo(() => {
    const e = visibleEvents.find((x) => x.event_type === 'IncidentResolvedByAdmin');
    return e?.occurred_at ?? null;
  }, [visibleEvents]);

  const ackWindowExpired = useMemo(() => {
    if (!incidentResolvedAt) return false;
    const ageMs = Date.now() - new Date(incidentResolvedAt).getTime();

    return ageMs > 24 * 60 * 60 * 1000;
  }, [incidentResolvedAt]);

  // REQ-004 — ✅ closure tap. Emits ChainAccepted and flips the surface
  // to "thanks" + 200ms green pulse + Toast confirmation.
  async function emitChainAccepted() {
    if (!incidentId) return;
    setAcked(true);
    setPulseActive(true);
    window.setTimeout(() => {
      setPulseActive(false);
    }, 220);
    toast.success(t('actionCall.thanks'));
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'ChainAccepted',
          actor_identity: {
            kind: 'citizen',
            ref: session?.actor_ref ?? 'anonymous-citizen',
            display: session?.display_name ?? 'Citizen',
          },
          payload: { incident_id: incidentId },
        }),
      });
    } catch (err) {
      console.error('[surakkha] ChainAccepted emission failed', err);
    }
  }

  // REQ-004 — ❌ reopen. Opens reason picker; on submit emits
  // ChainReopened{actor, incident_id, reason}.
  async function emitChainReopened() {
    if (!incidentId) return;
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'ChainReopened',
          actor_identity: {
            kind: 'citizen',
            ref: session?.actor_ref ?? 'anonymous-citizen',
            display: session?.display_name ?? 'Citizen',
          },
          payload: {
            incident_id: incidentId,
            reason: reopenReason.trim() || null,
          },
        }),
      });
      setReopenOpen(false);
      setReopenSubmitted(true);
      toast.info(t('actionCall.closure-ack.reopen'));
    } catch (err) {
      console.error('[surakkha] ChainReopened emission failed', err);
    }
  }

  // Bangla numeral formatter (REQ-003 acceptance #3). Used for any
  // numeric label that escapes i18next interpolation. Surfaced via the
  // BN_NUMERALS export above; i18next interpolation handles the BN
  // labels natively, so we don't need an inline helper here.

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <section
          className="citizen-status-timeline-page"
          data-area-id="citizen-status-timeline-page"
          aria-label={t('page.title')}
          data-locale={locale}
        >
          <div className="page-header">
            <h1 data-testid="citizen-timeline-title">{t('loading.title')}</h1>
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
        </section>
      </Container>
    );
  }

  return (
    <Container width={ContainerWidth.Bangla}>
      <section
        className={`citizen-status-timeline-page bangla-text`}
        data-area-id="citizen-status-timeline-page"
        aria-label={t('page.title')}
        data-locale={locale}
      >
        <header
          className="citizen-status-timeline-header"
          data-area-id="citizen-status-timeline-header"
          aria-label={t('page.title')}
        >
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
            {t('page.title')}
          </h1>
          <p
            className="page-header__sub"
            data-testid="citizen-timeline-subtitle"
            style={{ color: 'var(--fg-tertiary)' }}
          >
            {t('page.subtitle')}
          </p>
        </header>

        <main
          className="citizen-status-timeline-main"
          data-area-id="citizen-status-timeline-main"
          aria-label={t('page.subtitle')}
        >
          {visibleEvents.length === 0 ? (
            <Card>
              <div
                className="empty-state"
                data-testid="citizen-timeline-empty"
                data-area-id="citizen-status-timeline-empty"
              >
                <h2 className="empty-state__title">{t('timeline.empty')}</h2>
              </div>
            </Card>
          ) : (
            <Card>
              <ul
                className="timeline citizen-status-timeline-timeline"
                data-testid="citizen-timeline-list"
                data-area-id="citizen-status-timeline-timeline"
                aria-live="polite"
                style={{ listStyle: 'none', padding: 0, margin: 0 }}
              >
                {visibleEvents.map((e) => {
                  const chipKey = actorChipKey(e.actor_identity?.kind);
                  const chipLabel = t(`actor.${chipKey}`);
                  const titleKey = `event.${e.event_type}`;
                  const title = t(titleKey, { defaultValue: e.event_type });

                  return (
                    <li
                      key={e.event_id}
                      data-testid={`citizen-event-row-${e.event_id}`}
                      data-area-id="citizen-status-timeline-event-row"
                      className="citizen-status-timeline-event-row"
                      aria-label={`${title} · ${chipLabel}`}
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
                        <span
                          className="citizen-status-timeline-actor-chip actor-chip"
                          data-area-id="citizen-status-timeline-actor-chip"
                          data-actor-kind={chipKey}
                          aria-label={chipLabel}
                        >
                          {chipLabel}
                        </span>
                        <span className="mono">·</span>
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

          {/* ActionCall — the one thing to do (per spec §6). */}
          <section
            aria-labelledby="citizen-action-call-title"
            data-area-id="citizen-status-timeline-action-call"
            data-testid={`citizen-action-call-${effectiveActionCallState}`}
            className={`citizen-status-timeline-action-call citizen-action-call--${effectiveActionCallState}${pulseActive ? ' cst-pulse-once' : ''}`}
            style={{ marginTop: 'var(--space-md)' }}
          >
            <Card>
              <h2
                id="citizen-action-call-title"
                style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}
              >
                {effectiveActionCallState === 'reopened'
                  ? t('actionCall.closure-ack.title')
                  : t(`actionCall.${effectiveActionCallState}.title`)}
              </h2>
              <p
                className="page-header__sub"
                style={{ marginTop: 'var(--space-xs)' }}
              >
                {effectiveActionCallState === 'closure-ack'
                  ? t('actionCall.closure-ack.closurePrompt')
                  : t(`actionCall.${effectiveActionCallState}.body`)}
              </p>

              {effectiveActionCallState === 'closure-ack' && !reopenSubmitted && (
                <>
                  {incidentResolvedAt && !ackWindowExpired && (
                    <p
                      data-testid="citizen-action-call-ack-window-hint"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--fg-tertiary)',
                        marginTop: 'var(--space-xs)',
                      }}
                    >
                      {t('actionCall.closure-ack.ackWindowHint')}
                    </p>
                  )}
                  <div
                    className="submit-form__actions"
                    style={{ marginTop: 'var(--space-md)' }}
                  >
                    <Button
                      variant="primary"
                      size="md"
                      testId="citizen-action-call-confirm-yes"
                      onClick={() => {
                        void emitChainAccepted();
                      }}
                    >
                      {t('actionCall.closure-ack.confirm')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      testId="citizen-action-call-confirm-no"
                      onClick={() => {
                        setReopenOpen(true);
                      }}
                    >
                      {t('actionCall.closure-ack.reopen')}
                    </Button>
                  </div>
                </>
              )}

              {effectiveActionCallState === 'all-caught-up' && (
                <p
                  data-testid="citizen-action-call-thanks"
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  {t('actionCall.thanks')}
                </p>
              )}

              {effectiveActionCallState === 'reopened' && (
                <p
                  data-testid="citizen-action-call-reopened-msg"
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  {t('actionCall.closure-ack.reopen')}
                </p>
              )}
            </Card>
          </section>
        </main>

        {/* Reopen reason picker — Modal primitive, focus-trapped. */}
        <Modal
          open={reopenOpen}
          onClose={() => {
            setReopenOpen(false);
          }}
          ariaLabel={t('actionCall.reopenReasonPrompt')}
          testId="citizen-action-call-reopen-modal"
        >
          <div style={{ padding: 'var(--space-md)', minWidth: '320px' }}>
            <h2 style={{ margin: 0 }}>{t('actionCall.reopenReasonPrompt')}</h2>
            <textarea
              data-testid="citizen-action-call-reopen-reason"
              value={reopenReason}
              onChange={(e) => {
                setReopenReason(e.target.value);
              }}
              placeholder={t('actionCall.reopenReasonPlaceholder')}
              style={{
                width: '100%',
                minHeight: '80px',
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-sm)',
                fontFamily: 'inherit',
              }}
              maxLength={280}
            />
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-md)',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                variant="ghost"
                size="md"
                testId="citizen-action-call-reopen-cancel"
                onClick={() => {
                  setReopenOpen(false);
                }}
              >
                {t('actionCall.reopenCancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                testId="citizen-action-call-reopen-submit"
                onClick={() => {
                  void emitChainReopened();
                }}
              >
                {t('actionCall.reopenSubmit')}
              </Button>
            </div>
          </div>
        </Modal>
      </section>
    </Container>
  );
}
