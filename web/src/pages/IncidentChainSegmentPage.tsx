/**
 * IncidentChainSegmentPage.tsx — per-incident-chain-segment.md.
 *
 * Tier 1 NEW build (Batch 5) — the dedicated verification surface for
 * one incident's chain segment. Operator mode only in Phase 1; the
 * public-mode projection lives on CitizenStatusTimeline.
 *
 * URL pattern: /incidents/:incident_id/chain. Linked from the
 * InboxDetail right rail via "View full chain" (per §13 wireframe).
 *
 * Phase 1 scope (deliberately narrow):
 *   - Vertical timeline of chain events for the incident.
 *   - Per-row verify button (reuses shared `verifyBlockHash` from
 *     `web/src/lib/chain-verify.ts` so the 200ms badge contract is
 *     shared with AuditLog + InboxDetail).
 *   - Full-segment verification — single-click, triggers every
 *     verifyBlockHash sequentially; aggregated status shown at
 *     bottom (verified / anomaly / verifying).
 *   - Anomaly banner when any row fails verification; Acknowledge +
 *     Escalate to Pia actions (escalate disabled per §16 #5 lockdown
 *     reconciliation — Phase 2 PHA dashboard placeholder).
 *
 * Out of Phase 1 scope (deferred to Phase 4.5):
 *   - Public mode (rendered by CitizenStatusTimeline instead).
 *   - Web Worker for chains >50 events.
 *   - Cache (60s) per Scenario 06 §5 — current behaviour is recompute
 *     on click, which is fine for the <50-event Phase 1 chains.
 *   - Cross-tenant chain export / Share with Pia.
 *   - Hash anchor copy-to-clipboard (retained for Phase 2 — full hash
 *     is shown but copy UX lives in the row metadata).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AlertIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useIncidents } from '../hooks/useIncidents';
import { verifyBlockHash, type VerifyState } from '../lib/chain-verify';

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
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());
  const [fullSegmentState, setFullSegmentState] = useState<
    'idle' | 'verifying' | 'verified' | 'anomaly'
  >('idle');
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

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
  }, [fullSegmentState, threadEvents]);

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
      <div className="page-header">
        <div className="page-header__row">
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
        {threadEvents.length === 0 ? (
          <div className="empty-state" data-testid="chain-segment-empty">
            <h2 className="empty-state__title">{tChain('empty.heading')}</h2>
            <p className="empty-state__sub">{tChain('empty.body')}</p>
          </div>
        ) : (
          <ul
            className="timeline"
            data-testid="chain-segment-timeline"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {threadEvents.map((e) => {
              const vs = verifyStates.get(e.event_id) ?? { status: 'idle' as const };

              return (
                <li
                  key={e.event_id}
                  data-testid={`chain-event-row-${e.event_id}`}
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
    </Container>
  );
}
