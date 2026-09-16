/**
 * IncidentChainSegmentPage.tsx — per-incident-chain-segment.md (WO-003).
 *
 * Tier 1 NEW build — the dedicated verification surface for one
 * incident's chain segment. Operator mode only in Phase 1; the
 * public-mode projection lives on CitizenStatusTimeline.
 *
 * URL pattern: /incidents/:incident_id/chain. Linked from the
 * InboxDetail right rail via "View full chain" (per §13 wireframe).
 *
 * Phase 1 scope (WO-003 REQs 001-011):
 *   - REQ-001 route mount at /incidents/:incident_id/chain
 *   - REQ-002 reuses verifyBlockHash + verifyChainSegment from
 *     web/src/lib/chain-verify.ts (no copy-paste)
 *   - REQ-003 single-click verification (per-row + full segment)
 *   - REQ-004 60s cache for full-segment verification (cache key
 *     includes lastEventHash so new appends auto-invalidate)
 *   - REQ-005 anomaly surfacing — row ⚠️ + top banner with
 *     aria-live="polite"
 *   - REQ-006 acknowledge emits ChainAnomalyAcknowledged on the
 *     chain; escalate button disabled with tooltip (Phase 2)
 *   - REQ-007 ChainRead emitted on mount exactly once per route
 *   - REQ-008 operator-mode render with full payloads + hashes + JSON
 *   - REQ-009 area-labels + primitives from web/src/components/ui/
 *   - REQ-010 i18n keys added EN + BN (Hindi removed per lockdown)
 *   - REQ-011 MSW handlers + fixtures for ChainAnomalyAcknowledged /
 *     ChainAnomalyEscalated in web/src/mocks/handlers.ts
 *
 * Out of Phase 1 scope (deferred):
 *   - Public mode (rendered by CitizenStatusTimeline instead)
 *   - Web Worker for chains >50 events (Phase 2 candidate)
 *   - Cross-tenant chain export / Share with Pia
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import '../styles/inbox.css';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useIncidents } from '../hooks/useIncidents';
import {
  verifyBlockHash,
  verifyChainSegment,
  type SegmentVerifyResult,
  type VerifyState,
} from '../lib/chain-verify';
import { useAppLayout } from '../components/layout/AppLayoutContext';

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}

function severityBadgeClass(sev: string): string {
  if (sev === 'T3' || sev === 't3') return 'badge badge--t3';
  if (sev === 'T2' || sev === 't2') return 'badge badge--t2';
  if (sev === 'T1' || sev === 't1') return 'badge badge--t1';
  return 'badge badge--t0';
}

/**
 * Single-row verify badge — mirrors the AuditLog + InboxDetail pattern
 * so operators see the same shape across surfaces (audit-log.md #13 +
 * inbox-detail.md #16).
 */
function RowVerifyBadge({
  state,
  onClick,
  okLabel,
  failLabel,
  pendingLabel,
  buttonLabel,
}: {
  state: VerifyState;
  onClick: () => void;
  okLabel: string;
  failLabel: string;
  pendingLabel: string;
  buttonLabel: string;
}) {
  if (state.status === 'ok') {
    return (
      <span className="audit-verify audit-verify--ok" data-testid="chain-row-verify-ok">
        <span aria-hidden="true">{'\u2713\uFE0E'}</span>
        {okLabel}
      </span>
    );
  }
  if (state.status === 'fail') {
    return (
      <span
        className="audit-verify audit-verify--fail"
        data-testid="chain-row-verify-fail"
        aria-label={failLabel}
      >
        <span aria-hidden="true">{'\u26A0\uFE0E'}</span>
        {failLabel}
      </span>
    );
  }
  if (state.status === 'pending') {
    return (
      <span className="audit-verify audit-verify--pending" data-testid="chain-row-verify-pending">
        {pendingLabel}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="audit-verify-btn"
      data-testid="chain-row-verify-btn"
      onClick={onClick}
    >
      {buttonLabel}
    </button>
  );
}

export function IncidentChainSegmentPage() {
  const { incident_id: incidentId = '' } = useParams<{ incident_id: string }>();
  const { incidents } = useIncidents();
  const { format: formatTime } = useDateFormatter();
  const { t: tChain } = useTranslation('chainSegment');
  const { session } = useAppLayout();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());
  const [fullSegmentState, setFullSegmentState] = useState<
    'idle' | 'verifying' | 'verified' | 'anomaly'
  >('idle');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  // REQ-004 — segmented verify result (cached for 60s inside
  // chain-verify.ts; lastEventHash in the cache key auto-invalidates on
  // new append). Surfaced in the footer badge so the operator sees the
  // current cache-hit / cache-miss state.
  const [segmentResult, setSegmentResult] = useState<SegmentVerifyResult | null>(null);

  // REQ-007 — ChainRead emitted on mount exactly once per route. The
  // ref guards against React 18 strict-mode double-invoke (no-op second
  // mount shouldn't double-log). Fires `ChainRead{actor, incident_id,
  // filter_combo: ['all']}` so the audit log sees every chain read per
  // PRD §11.1.
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
              kind: 'operator',
              ref: session?.actor_ref ?? 'anonymous-operator',
              display: session?.display_name ?? 'Operator',
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

  const incident = useMemo(
    () => incidents.find((i) => i.incident_id === incidentId) ?? null,
    [incidents, incidentId],
  );

  const threadEvents = useMemo(() => {
    return events
      .filter((e) => (e.payload as { incident_id?: string }).incident_id === incidentId)
      .sort((a, b) => a.height - b.height);
  }, [events, incidentId]);

  const anomalyRows = useMemo(() => {
    return Array.from(verifyStates.entries())
      .filter(([, v]) => v.status === 'fail')
      .map(([eventId]) => eventId);
  }, [verifyStates]);

  // Fetch chain events once on mount. Phase 1 reads /api/events?limit=200
  // and filters client-side, matching InboxDetail (per spec §1).
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
        console.error('[surakkha] chain-segment fetch failed', err);
        if (!cancelled.current) setEvents([]);
      } finally {
        if (!cancelled.current) setLoading(false);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const onVerifyRow = useCallback(async (eventId: string, blockHash: string) => {
    setVerifyStates((prev) => {
      const next = new Map(prev);
      next.set(eventId, { status: 'pending' });
      return next;
    });
    const result = await verifyBlockHash(blockHash);

    setVerifyStates((prev) => {
      const next = new Map(prev);
      next.set(eventId, result);
      return next;
    });
  }, []);

  const onVerifyFullSegment = useCallback(async () => {
    if (fullSegmentState === 'verifying') return;
    setFullSegmentState('verifying');
    // Mark every row pending so the per-row badges reflect live state.
    setVerifyStates((prev) => {
      const next = new Map(prev);
      for (const ev of threadEvents) next.set(ev.event_id, { status: 'pending' });
      return next;
    });
    let anomaly = false;
    for (const ev of threadEvents) {
      const result = await verifyBlockHash(ev.block_hash);

      setVerifyStates((prev) => {
        const next = new Map(prev);
        next.set(ev.event_id, result);
        return next;
      });
      if (result.status === 'fail') anomaly = true;
    }
    setFullSegmentState(anomaly ? 'anomaly' : 'verified');

    // REQ-004 — cache-backed segment verification. After the per-row
    // walk, run the cache helper so the next click within 60s returns
    // the cached result instantly. We deliberately don't *replace* the
    // per-row walk (it's what the row badges + ack/escalate button
    // rely on); the cache helper is the typed source of truth for the
    // footer badge.
    if (threadEvents.length > 0) {
      const lastEvent = threadEvents[threadEvents.length - 1];
      const segResult = await verifyChainSegment(
        incidentId,
        lastEvent.height,
        threadEvents,
      );
      setSegmentResult(segResult);
    }
  }, [fullSegmentState, threadEvents, incidentId]);

  // REQ-006 — anomaly ack/escalate event emission. The ack itself is
  // on the chain (meta-audit principle per Scenario 06). Escalate is
  // disabled in Phase 1 (Phase 2 PHA queue placeholder) but still
  // surfaces the click intent through the title tooltip.
  const emitAnomalyEvent = useCallback(
    async (eventType: 'ChainAnomalyAcknowledged' | 'ChainAnomalyEscalated', seq: number) => {
      if (!incidentId) return;
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: eventType,
            actor_identity: {
              kind: 'operator',
              ref: session?.actor_ref ?? 'anonymous-operator',
              display: session?.display_name ?? 'Operator',
            },
            payload: {
              actor: session?.actor_ref ?? 'anonymous-operator',
              incident_id: incidentId,
              seq,
            },
          }),
        });
      } catch (err) {
        console.error(`[surakkha] ${eventType} emission failed`, err);
      }
    },
    [incidentId, session],
  );

  if (loading) {
    return (
      <Container width={ContainerWidth.Bangla}>
        <div className="page-header">
          <h1>{tChain('loading.title')}</h1>
        </div>
      </Container>
    );
  }

  return (
    <Container width={ContainerWidth.Bangla}>
      <section
        data-area-id="incident-chain-segment-page"
        aria-label={tChain('page.ariaLabel')}
        className="incident-chain-segment-page"
      >
        <div className="page-header">
          <div
            data-area-id="incident-chain-segment-header"
            className="page-header__row"
          >
            <div>
              <Link
                to="/inbox"
                className="mono"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--fg-tertiary)',
                  textDecoration: 'none',
                }}
                data-testid="chain-back-to-inbox"
              >
                {tChain('header.backToInbox')}
              </Link>
              <div
                className="thread-head__row1"
                style={{ marginTop: 'var(--space-sm)' }}
              >
                <span className="mono" style={{ fontSize: 'var(--font-size-md)' }}>
                  {incidentId}
                </span>
                {incident && (
                  <span className={severityBadgeClass(incident.severity)}>
                    {incident.severity}
                  </span>
                )}
                {incident && (
                  <span className={`badge badge--${incident.status}`}>{incident.status}</span>
                )}
              </div>
              <h1
                data-testid="chain-segment-title"
                style={{ marginTop: 'var(--space-md)' }}
              >
                {tChain('title', { count: threadEvents.length })}
              </h1>
            </div>
          </div>
        </div>

      {/* Anomaly banner — top banner per spec §3.2 + §6. Renders only
          when at least one row fails verification AND the operator
          hasn't acknowledged. */}
      {anomalyRows.length > 0 && !acknowledged && (
        <Card>
          <div
            className="chain-anomaly-banner"
            data-testid="chain-anomaly-banner"
            aria-live="polite"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              borderLeft: '3px solid var(--color-amber)',
              padding: 'var(--space-md)',
              background: 'var(--bg-subtle)',
            }}
          >
            <span aria-hidden="true">
              <AlertIcon />
            </span>
            <div style={{ flex: 1 }}>
              <strong>{tChain('anomaly.banner', { incident_id: incidentId })}</strong>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              testId="chain-anomaly-acknowledge"
              onClick={() => {
                setAcknowledged(true);
                // REQ-006 — acknowledge emits ChainAnomalyAcknowledged
                // (the ack itself is on the chain — meta-audit
                // principle per Scenario 06). The seq defaults to the
                // highest anomaly row; in operator mode a single banner
                // surfaces per-click. Falls back to 0 if no rows failed.
                const lastAnomalySeq =
                  threadEvents.find((ev) => verifyStates.get(ev.event_id)?.status === 'fail')
                    ?.height ?? 0;
                void emitAnomalyEvent('ChainAnomalyAcknowledged', lastAnomalySeq);
              }}
            >
              {tChain('anomaly.acknowledge')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled
              testId="chain-anomaly-escalate"
              title={tChain('anomaly.escalateDisabledTooltip')}
            >
              {tChain('anomaly.escalate')}
            </Button>
          </div>
        </Card>
      )}

      {/* Vertical timeline — §3.3. */}
      <Card>
        <div data-area-id="incident-chain-segment-main">
          {threadEvents.length === 0 ? (
            <div className="empty-state" data-testid="chain-segment-empty">
              <h2 className="empty-state__title">{tChain('empty.heading')}</h2>
              <p className="empty-state__sub">{tChain('empty.body')}</p>
            </div>
          ) : (
            <ul
              className="timeline"
              data-testid="chain-segment-timeline"
              data-area-id="incident-chain-segment-timeline"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {threadEvents.map((e) => {
                const vs = verifyStates.get(e.event_id) ?? { status: 'idle' as const };

                return (
                  <li
                    key={e.event_id}
                    data-testid={`chain-event-row-${e.event_id}`}
                    data-area-id="incident-chain-segment-event-row"
                    style={{
                      background:
                        vs.status === 'fail'
                          ? 'var(--bg-warn-tint, rgba(245, 158, 11, 0.08))'
                          : undefined,
                    }}
                  >
                  <div className="timeline__time mono">{formatTime('time', e.occurred_at)}</div>
                  <p className="timeline__title">{e.event_type}</p>
                  <div
                    className="timeline__meta"
                    style={{
                      display: 'flex',
                      gap: 'var(--space-sm)',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                    }}
                  >
                    <span className="mono">
                      {e.actor_identity?.display ?? tChain('meta.unknownActor')}
                    </span>
                    <span className="mono">·</span>
                    <span className="mono" data-testid={`chain-event-hash-${e.event_id}`}>
                      {e.block_hash.slice(0, 8)}…
                    </span>
                    <RowVerifyBadge
                      state={vs}
                      onClick={() => {
                        void onVerifyRow(e.event_id, e.block_hash);
                      }}
                      okLabel={tChain('verify.ok')}
                      failLabel={tChain('verify.fail')}
                      pendingLabel={tChain('verify.pending')}
                      buttonLabel={tChain('verify.button')}
                    />
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* Full-segment verification — §3.4. */}
      <div
        className="submit-form__actions"
        style={{ marginTop: 'var(--space-md)' }}
      >
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={fullSegmentState === 'verifying'}
          testId="chain-segment-verify-full"
          onClick={() => {
            void onVerifyFullSegment();
          }}
        >
          {fullSegmentState === 'verifying'
            ? tChain('fullSegment.verifying', {
                current: threadEvents.filter(
                  (e) => verifyStates.get(e.event_id)?.status === 'pending',
                ).length,
                total: threadEvents.length,
              })
            : tChain('fullSegment.button')}
        </Button>
        {fullSegmentState === 'verified' && (
          <span
            className="audit-verify audit-verify--ok"
            data-testid="chain-segment-full-verified"
            style={{ marginLeft: 'var(--space-md)' }}
          >
            <span aria-hidden="true">{'\u2713\uFE0E'}</span>
            {tChain('fullSegment.verified', { timestamp: formatTime('time', new Date().toISOString()) })}
          </span>
        )}
        {fullSegmentState === 'anomaly' && (
          <span
            className="audit-verify audit-verify--fail"
            data-testid="chain-segment-full-anomaly"
            style={{ marginLeft: 'var(--space-md)' }}
          >
            <span aria-hidden="true">{'\u26A0\uFE0E'}</span>
            {tChain('fullSegment.failed')}
          </span>
        )}
      </div>

      {/* REQ-004 — cache footer badge. Visible after a full-segment
          verify completes; shows the cache-backed typed result so the
          operator sees the same answer on the next click within 60s.
          The `cached` testid is asserted by fe-incident-chain-segment-render
          to prove the cache surface is wired. */}
      {segmentResult && (
        <div
          data-testid="chain-segment-cache-footer"
          aria-live="polite"
          style={{
            marginTop: 'var(--space-sm)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--fg-tertiary)',
          }}
        >
          {segmentResult.status === 'verified' &&
            tChain('fullSegment.verified', {
              timestamp: formatTime('time', segmentResult.verifiedAt),
            })}
          {segmentResult.status === 'anomaly' &&
            `${tChain('fullSegment.failed')} · anomaly @ seq ${segmentResult.anomalyAtSeq}`}
          {segmentResult.status === 'unknown' &&
            `unknown block @ seq ${segmentResult.missingAtSeq}`}
          {segmentResult.status === 'empty' && 'no events'}
        </div>
      )}
      </section>
    </Container>
  );
}
