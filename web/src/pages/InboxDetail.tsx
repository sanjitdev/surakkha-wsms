/**
 * InboxDetail.tsx — FE-1.5a.
 *
 * 2-pane incident detail at /inbox/:id. Per dim 5 §7.4:
 *   - Container width="bangla" (1080 px) for the mixed Latin/Bangla body.
 *   - Left col-span-7: timeline of chain events for this incident.
 *   - Right col-span-5: related incident list (sibling incidents by ward).
 *   - Drops to single pane below <bp-lg> (768 px).
 *
 * Data sources:
 *   - GET /api/incidents → finds the matching row by id.
 *   - GET /api/events?event_type=IncidentCreated (then filtered client-side
 *     by payload.incident_id === params.id).
 *
 * The page is intentionally lightweight — composition only. Heavy lifting
 * lives in the fixtures + handlers; this component just maps wire data
 * into the existing primitives (Container, Card, EmptyState).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { AlertIcon, InboxIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useIncidents } from '../hooks/useIncidents';

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function severityBadgeClass(sev: string): string {
  if (sev === 'T3' || sev === 't3') return 'badge badge--t3';
  if (sev === 'T2' || sev === 't2') return 'badge badge--t2';
  if (sev === 'T1' || sev === 't1') return 'badge badge--t1';
  return 'badge badge--t0';
}
function eventTitle(event: ChainEvent): string {
  const payload = event.payload;

  const summary = typeof payload.summary === 'string' ? payload.summary : '';
  const title = typeof payload.title === 'string' ? payload.title : '';
  const wardRaw = payload.ward_id;
  const ward =
    typeof wardRaw === 'string' || typeof wardRaw === 'number' ? String(wardRaw) : 'unknown ward';
  const noteRaw = payload.resolution_note;
  const note = typeof noteRaw === 'string' ? noteRaw : '';
  const sevRaw = payload.severity;
  const severity = typeof sevRaw === 'string' || typeof sevRaw === 'number' ? String(sevRaw) : '';
  const toSevRaw = payload.to_severity;
  const toSeverity =
    typeof toSevRaw === 'string' || typeof toSevRaw === 'number' ? String(toSevRaw) : '';
  const ackMethodRaw = payload.ack_method;
  const ackMethod =
    typeof ackMethodRaw === 'string' || typeof ackMethodRaw === 'number'
      ? String(ackMethodRaw)
      : 'unknown';
  const sensorIdRaw = payload.sensor_id;
  const sensorId = typeof sensorIdRaw === 'string' ? sensorIdRaw : '';
  const valueRaw = payload.value;

  if (event.event_type === 'IncidentCreated') {
    return summary || title || `Incident opened (${ward})`;
  }
  if (event.event_type === 'IncidentEscalated') {
    return `Incident escalated to ${toSeverity || severity || '?'}`;
  }
  if (event.event_type === 'IncidentResolved') {
    return note || 'Incident resolved';
  }
  if (event.event_type === 'PublicNoticeIssued') {
    return 'Public notice drafted';
  }
  if (event.event_type === 'CitizenAcknowledgement') {
    return `Citizen acknowledgement (${ackMethod})`;
  }
  if (event.event_type === 'SensorReadingSubmitted') {
    const paramRaw = payload.parameter;
    const parameter =
      typeof paramRaw === 'string' || typeof paramRaw === 'number' ? String(paramRaw) : '';

    return `Sensor ${sensorId} reading: ${typeof valueRaw === 'number' ? valueRaw : '?'} ${parameter}`;
  }
  return event.event_type;
}
export function InboxDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { incidents, loading: incLoading, error: incError } = useIncidents();
  const [events, setEvents] = useState<ChainEvent[]>([]);

  useEffect(() => {
    // Chain poll is owned by AppLayout; this page only fetches the
    // chain-event feed it needs to render the incident thread timeline.
    const cancelled = { current: false };

    void (async () => {
      try {
        const evR = (await fetch('/api/events?limit=200').then((r) => r.json())) as {
          events: ChainEvent[];
        };

        if (cancelled.current) return;
        setEvents(evR.events);
      } catch (err) {
        if (cancelled.current) return;
        console.error('[surakkha] inbox-detail fetch failed', err);
        setEvents([]);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  const loading = incLoading;

  // Surface the hook's error in dev — no toast, per spec §HAPPY_PATH_memo
  // contract. The page still renders "Incident not found" if the
  // incidents projection never resolves the requested id.
  void incError;

  const incident = useMemo(
    () => incidents.find((i) => i.incident_id === id) ?? null,
    [incidents, id],
  );
  const threadEvents = useMemo(() => {
    const list = events
      .filter((e) => (e.payload as { incident_id?: string }).incident_id === id)
      .sort((a, b) => a.height - b.height);

    return list;
  }, [events, id]);
  // Sibling incidents by ward — used in the right pane.
  const related = useMemo(() => {
    if (!incident?.ward_id) return [];
    return incidents
      .filter((i) => i.ward_id === incident.ward_id && i.incident_id !== id)
      .slice(0, 5);
  }, [incidents, incident, id]);

  if (loading) {
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
                data-testid="back-to-inbox"
              >
                ← Back to inbox
              </Link>
              <h1 style={{ marginTop: 'var(--space-md)' }}>Loading…</h1>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!incident) {
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
                data-testid="back-to-inbox"
              >
                ← Back to inbox
              </Link>
              <h1 style={{ marginTop: 'var(--space-md)' }}>Incident not found</h1>
              <p className="page-header__sub">
                The incident <span className="mono">{id}</span> is not in the current chain.
              </p>
            </div>
          </div>
        </div>
        <Card>
          <EmptyState
            icon={<InboxIcon />}
            heading="No matching incident"
            body="This thread may have been pruned from the read-model or never existed."
          />
        </Card>
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
              data-testid="back-to-inbox"
            >
              ← Back to inbox
            </Link>
            <div className="thread-head__row1" style={{ marginTop: 'var(--space-sm)' }}>
              <span className={severityBadgeClass(incident.severity)}>
                {incident.severity} urgent
              </span>
              <span className={`badge badge--${incident.status}`}>{incident.status}</span>
            </div>
            <h1 data-testid="inbox-detail-title" style={{ marginTop: 'var(--space-md)' }}>
              Incident {incident.incident_id.slice(0, 8)}
            </h1>
            <p className="page-header__sub">
              Ward {incident.ward_id ?? '—'} · block #{incident.last_block_height} ·{' '}
              {incident.last_event_type}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button variant="secondary" size="md">
              Assign field tech
            </Button>
            <Button variant="primary" size="md">
              Request citizen ack →
            </Button>
          </div>
        </div>
      </div>

      <div className="grid-12">
        {/* Left pane: thread timeline (col-span-7) */}
        <div className="col-7" data-testid="inbox-detail-timeline">
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Thread timeline</h3>
              <span
                className="mono"
                style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-xs)' }}
              >
                {threadEvents.length} {threadEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            {threadEvents.length === 0 ? (
              <EmptyState
                icon={<AlertIcon />}
                heading="No events yet"
                body="Once actions land on the chain for this incident, they show here."
              />
            ) : (
              <ul className="timeline" data-testid="inbox-detail-timeline-list">
                {threadEvents.map((e) => (
                  <li key={e.event_id}>
                    <div className="timeline__time mono">{formatTime(e.occurred_at)}</div>
                    <p className="timeline__title">{eventTitle(e)}</p>
                    <div
                      className="timeline__meta"
                      style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}
                    >
                      <span className="mono">{e.actor_identity?.display ?? '—'}</span>
                      <span className="mono">·</span>
                      <span className="mono">block #{e.height}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right pane: related incidents (col-span-5) */}
        <div className="col-5" data-testid="inbox-detail-related">
          <Card>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
              Related incidents · ward {incident.ward_id}
            </h3>
            <p
              className="page-header__sub"
              style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}
            >
              {related.length} sibling {related.length === 1 ? 'incident' : 'incidents'} in this
              ward
            </p>
            {related.length === 0 ? (
              <EmptyState
                icon={<InboxIcon />}
                heading="No siblings"
                body="This is the only active incident in the ward."
              />
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {related.map((r) => (
                  <li
                    key={r.incident_id}
                    style={{
                      padding: 'var(--space-sm) 0',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Link
                      to={`/inbox/${r.incident_id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                      data-testid={`inbox-related-${r.incident_id}`}
                    >
                      <span className={severityBadgeClass(r.severity)}>{r.severity}</span>
                      <span style={{ flex: 1 }}>
                        <span className="mono" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {r.incident_id.slice(0, 12)}
                        </span>
                        <div
                          className="row-sub"
                          style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-xs)' }}
                        >
                          {r.last_event_type} · block #{r.last_block_height}
                        </div>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Container>
  );
}
