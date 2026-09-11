/**
 * InboxDetail.tsx — FE-1.5a + FE-F3 + inbox-detail.md reconciliation.
 *
 * 2-pane incident detail at /inbox/:id. Per dim 5 §7.4:
 *   - Container width="bangla" (1080 px) for the mixed Latin/Bangla body.
 *   - **inbox-detail.md #6 (reconciled 2026-09-11):** chain-event timeline
 *     moved from the LEFT pane (col-7) to a new RIGHT rail. The sibling
 *     (related) incidents pane now occupies the LEFT col-7 slot; the
 *     timeline lives on the RIGHT col-5. This is the Tier 2 structural
 *     reorder that prefigures the full 3-column 240/flex/360 layout
 *     (Batch 5 Tier 1 builds). For Phase 1 we keep Bangla width 1080 px
 *     so the swap is a pure left↔right flip.
 *   - Drops to single pane below <bp-lg> (768 px).
 *
 * Header CTAs (FE-F3):
 *   - "Assign field tech" opens <AssignTechModal>: pick a tech from the
 *     team list, choose P1/P2/P3 priority, set ETA + work-order summary,
 *     submit `actions.assignTech(...)`. Closes on success.
 *   - "Request citizen ack →" opens <RequestAckModal>: choose channel
 *     (sms/whatsapp/voice) + summary copy, submit
 *     `actions.requestAck(...)`. Closes on success.
 *
 * Data sources:
 *   - GET /api/incidents → finds the matching row by id.
 *   - GET /api/events?limit=200 → filtered client-side by
 *     payload.incident_id === params.id.
 *
 * The page is intentionally lightweight — composition only. Heavy lifting
 * lives in the fixtures + handlers; this component just maps wire data
 * into the existing primitives (Container, Card, EmptyState, Modal).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { AlertIcon, InboxIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useIncidents } from '../hooks/useIncidents';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useIncidentActions } from '../hooks/useIncidentActions';
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

/** Hardcoded field-tech roster for the demo. In production this would
 *  come from GET /api/field/technicians. Karim is the seed persona;
 *  Rashid + Sumi round out the dispatch team. */
const TECH_ROSTER = [
  { id: 'karim_actor', name: 'Karim Hossain' },
  { id: 'rashid_actor', name: 'Rashid Ahmed' },
  { id: 'sumi_actor', name: 'Sumi Akter' },
] as const;

type TechId = (typeof TECH_ROSTER)[number]['id'];

function severityBadgeClass(sev: string): string {
  if (sev === 'T3' || sev === 't3') return 'badge badge--t3';
  if (sev === 'T2' || sev === 't2') return 'badge badge--t2';
  if (sev === 'T1' || sev === 't1') return 'badge badge--t1';
  return 'badge badge--t0';
}
function eventTitle(
  event: ChainEvent,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
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
    return summary || title || t('events.incidentOpened', { ward });
  }
  if (event.event_type === 'IncidentEscalated') {
    return t('events.incidentEscalated', {
      severity: toSeverity || severity || '?',
    });
  }
  if (event.event_type === 'IncidentResolved') {
    return note || t('events.incidentResolved');
  }
  if (event.event_type === 'PublicNoticeIssued') {
    return t('events.publicNotice');
  }
  if (event.event_type === 'CitizenAcknowledgement') {
    return t('events.citizenAck', { channel: ackMethod });
  }
  if (event.event_type === 'SensorReadingSubmitted') {
    const paramRaw = payload.parameter;
    const parameter =
      typeof paramRaw === 'string' || typeof paramRaw === 'number' ? String(paramRaw) : '';

    return t('events.sensorReading', {
      sensorId,
      value: typeof valueRaw === 'number' ? valueRaw : '?',
      parameter,
    });
  }
  return event.event_type;
}interface AssignTechModalProps {
  open: boolean;
  onClose: () => void;
  incidentId: string;
  busy: boolean;
  onSubmit: (input: {
    incident_id: string;
    technician_id: string;
    technician_name: string;
    priority: 'P1' | 'P2' | 'P3';
    eta_target_minutes: number;
    work_order_summary: string;
  }) => Promise<boolean>;
}

function AssignTechModal({ open, onClose, incidentId, busy, onSubmit }: AssignTechModalProps) {
  const { t: tDetail } = useTranslation('inboxDetail');
  const [techId, setTechId] = useState<TechId>(TECH_ROSTER[0].id);
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [eta, setEta] = useState<string>('30');
  const [summary, setSummary] = useState<string>('');

  const tech = TECH_ROSTER.find((t) => t.id === techId);
  const etaNum = Number(eta);
  const summaryTrim = summary.trim();
  const canSubmit = !busy && tech !== undefined && Number.isFinite(etaNum) && etaNum > 0 && summaryTrim.length >= 5;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await onSubmit({
      incident_id: incidentId,
      technician_id: tech.id,
      technician_name: tech.name,
      priority,
      eta_target_minutes: etaNum,
      work_order_summary: summaryTrim,
    });

    if (ok) {
      // Reset on success so the next open starts fresh.
      setSummary('');
      setEta('30');
      setPriority('P1');
      setTechId(TECH_ROSTER[0].id);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      testId="assign-tech-modal"
      ariaLabel={tDetail('assignModal.ariaLabel')}
    >
      <form onSubmit={handleSubmit} data-testid="assign-tech-form">
        <header style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{tDetail('assignModal.title')}</h2>
          <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
            {tDetail('assignModal.description', { id: incidentId.slice(0, 8) })}
          </p>
        </header>

        <div className="submit-form__row">
          <label htmlFor="assign-tech-tech" className="submit-form__label">
            {tDetail('assignModal.technicianLabel')}
          </label>
          <select
            id="assign-tech-tech"
            data-testid="assign-tech-tech"
            className="submit-form__input"
            value={techId}
            onChange={(e) => {
              setTechId(e.target.value as TechId);
            }}
            disabled={busy}
          >
            {TECH_ROSTER.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="submit-form__row submit-form__row--split">
          <div>
            <label htmlFor="assign-tech-priority" className="submit-form__label">
              {tDetail('assignModal.priorityLabel')}
            </label>
            <select
              id="assign-tech-priority"
              data-testid="assign-tech-priority"
              className="submit-form__input"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as 'P1' | 'P2' | 'P3');
              }}
              disabled={busy}
            >
              <option value="P1">{tDetail('assignModal.priorityP1')}</option>
              <option value="P2">{tDetail('assignModal.priorityP2')}</option>
              <option value="P3">{tDetail('assignModal.priorityP3')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="assign-tech-eta" className="submit-form__label">
              {tDetail('assignModal.etaLabel')}
            </label>
            <input
              id="assign-tech-eta"
              data-testid="assign-tech-eta"
              type="number"
              min={1}
              max={1440}
              className="submit-form__input"
              value={eta}
              onChange={(e) => {
                setEta(e.target.value);
              }}
              disabled={busy}
            />
          </div>
        </div>

        <div className="submit-form__row">
          <label htmlFor="assign-tech-summary" className="submit-form__label">
            {tDetail('assignModal.summaryLabel')}
          </label>
          <textarea
            id="assign-tech-summary"
            data-testid="assign-tech-summary"
            className="submit-form__textarea"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
            }}
            rows={3}
            placeholder={tDetail('assignModal.summaryPlaceholder')}
            disabled={busy}
            required
          />
          <p className="submit-form__hint">{tDetail('assignModal.summaryHint')}</p>
        </div>

        <div className="submit-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            testId="assign-tech-submit"
          >
            {busy ? tDetail('assignModal.dispatching') : tDetail('assignModal.submit')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={busy}
            testId="assign-tech-cancel"
          >
            {tDetail('assignModal.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}interface RequestAckModalProps {
  open: boolean;
  onClose: () => void;
  incidentId: string;
  busy: boolean;
  onSubmit: (input: {
    incident_id: string;
    channel: 'sms' | 'whatsapp' | 'voice';
    summary: string;
  }) => Promise<boolean>;
}

function RequestAckModal({ open, onClose, incidentId, busy, onSubmit }: RequestAckModalProps) {
  const { t: tDetail } = useTranslation('inboxDetail');
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'voice'>('sms');
  const [summary, setSummary] = useState<string>('');

  const summaryTrim = summary.trim();
  const canSubmit = !busy && summaryTrim.length >= 5;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await onSubmit({
      incident_id: incidentId,
      channel,
      summary: summaryTrim,
    });

    if (ok) {
      setSummary('');
      setChannel('sms');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      testId="request-ack-modal"
      ariaLabel={tDetail('ackModal.ariaLabel')}
    >
      <form onSubmit={handleSubmit} data-testid="request-ack-form">
        <header style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{tDetail('ackModal.title')}</h2>
          <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
            {tDetail('ackModal.description', { id: incidentId.slice(0, 8) })}
          </p>
        </header>

        <div className="submit-form__row">
          <label htmlFor="request-ack-channel" className="submit-form__label">
            {tDetail('ackModal.channelLabel')}
          </label>
          <select
            id="request-ack-channel"
            data-testid="request-ack-channel"
            className="submit-form__input"
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value as 'sms' | 'whatsapp' | 'voice');
            }}
            disabled={busy}
          >
            <option value="sms">{tDetail('ackModal.channelSms')}</option>
            <option value="whatsapp">{tDetail('ackModal.channelWhatsapp')}</option>
            <option value="voice">{tDetail('ackModal.channelVoice')}</option>
          </select>
        </div>

        <div className="submit-form__row">
          <label htmlFor="request-ack-summary" className="submit-form__label">
            {tDetail('ackModal.copyLabel')}
          </label>
          <textarea
            id="request-ack-summary"
            data-testid="request-ack-summary"
            className="submit-form__textarea"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
            }}
            rows={4}
            placeholder={tDetail('ackModal.copyPlaceholder')}
            disabled={busy}
            required
          />
          <p className="submit-form__hint">{tDetail('ackModal.copyHint')}</p>
        </div>

        <div className="submit-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            testId="request-ack-submit"
          >
            {busy ? tDetail('ackModal.sending') : tDetail('ackModal.submit')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={busy}
            testId="request-ack-cancel"
          >
            {tDetail('ackModal.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}export function InboxDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { incidents, loading: incLoading, error: incError } = useIncidents();
  const { format: formatTime } = useDateFormatter();
  const actions = useIncidentActions();
  const { t: tDetail } = useTranslation('inboxDetail');
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [ackOpen, setAckOpen] = useState(false);

  /**
   * Per-row verify state — inbox-detail.md #16.
   *
   * Keyed by event_id so a verification badge persists across re-renders
   * for the same row. Mirrors the AuditLog pattern (audit-log.md #13) so
   * the operator's spot-check workflow is consistent across surfaces:
   * click → POST /api/chain/verify → typed badge in <200ms.
   */
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());
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
                {tDetail('header.backToInbox')}
              </Link>
              <h1 style={{ marginTop: 'var(--space-md)' }}>{tDetail('header.loading')}</h1>
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
                {tDetail('header.backToInbox')}
              </Link>
              <h1 style={{ marginTop: 'var(--space-md)' }}>{tDetail('notFound.title')}</h1>
              <p className="page-header__sub">
                {tDetail('notFound.body', { id })}
              </p>
            </div>
          </div>
        </div>
        <Card>
          <EmptyState
            icon={<InboxIcon />}
            heading={tDetail('notFound.emptyHeading')}
            body={tDetail('notFound.emptyBody')}
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
              {tDetail('header.backToInbox')}
            </Link>
            <div className="thread-head__row1" style={{ marginTop: 'var(--space-sm)' }}>
              <span className={severityBadgeClass(incident.severity)}>
                {tDetail('header.severityUrgent', { severity: incident.severity })}
              </span>
              <span className={`badge badge--${incident.status}`}>{incident.status}</span>
            </div>
            <h1 data-testid="inbox-detail-title" style={{ marginTop: 'var(--space-md)' }}>
              {tDetail('header.incidentTitle', { id: incident.incident_id.slice(0, 8) })}
            </h1>
            <p className="page-header__sub">
              {tDetail('header.metaLine', {
                ward: incident.ward_id ?? '—',
                block: incident.last_block_height,
                eventType: incident.last_event_type,
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setAssignOpen(true);
              }}
              testId="inbox-assign-tech"
            >
              {tDetail('actions.assignTech')}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setAckOpen(true);
              }}
              testId="inbox-request-ack"
            >
              {tDetail('actions.requestAck')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid-12">
        {/* Left pane: related incidents (col-span-7).
            Per inbox-detail.md #6 (reconciled 2026-09-11), the related
            pane moves to the LEFT slot; the chain-event timeline now
            lives on the RIGHT (EventChain rail). The full 240/flex/360
            3-column grid is a Phase 5 Batch 5 build; this swap is the
            Tier 2 reconciliation step. */}
        <div className="col-7" data-testid="inbox-detail-related">
          <Card>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
              {tDetail('related.title', { ward: incident.ward_id })}
            </h3>
            <p
              className="page-header__sub"
              style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}
            >
              {tDetail(
                related.length === 1 ? 'related.subtitle_one' : 'related.subtitle_other',
                { count: related.length },
              )}
            </p>
            {related.length === 0 ? (
              <EmptyState
                icon={<InboxIcon />}
                heading={tDetail('related.emptyHeading')}
                body={tDetail('related.emptyBody')}
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
                          {tDetail('related.rowMeta', {
                            eventType: r.last_event_type,
                            height: r.last_block_height,
                          })}
                        </div>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right pane: chain-event timeline (EventChain rail, col-span-5).
            Per inbox-detail.md #6 (reconciled 2026-09-11), the timeline
            moves from the LEFT to a new RIGHT rail. Test-id stays
            `inbox-detail-timeline` so existing assertions still find the
            node; this is the Tier 2 reconciliation step that prefigures
            the Batch 5 Tier 1 `PerIncidentChainSegment` component. */}
        <div className="col-5" data-testid="inbox-detail-timeline">
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>{tDetail('timeline.title')}</h3>
              <span
                className="mono"
                style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-xs)' }}
              >
                {tDetail(
                  threadEvents.length === 1 ? 'timeline.eventCount_one' : 'timeline.eventCount_other',
                  { count: threadEvents.length },
                )}
              </span>
            </div>
            {threadEvents.length === 0 ? (
              <EmptyState
                icon={<AlertIcon />}
                heading={tDetail('timeline.emptyHeading')}
                body={tDetail('timeline.emptyBody')}
              />
            ) : (
              <ul className="timeline" data-testid="inbox-detail-timeline-list">
                {threadEvents.map((e) => {
                  const vs = verifyStates.get(e.event_id) ?? { status: 'idle' };
                  // Per-row verify badge — inbox-detail.md #16. Mirrors
                  // audit-log.md #13 / AuditLog.tsx render contract: idle
                  // shows a Verify button, pending shows busy text, ok
                  // shows ✓\uFE0E, fail shows ⚠\uFE0E with the typed reason.
                  let verifyControl: React.ReactNode;

                  if (vs.status === 'ok') {
                    verifyControl = (
                      <span
                        className="audit-verify audit-verify--ok"
                        data-testid={`inbox-verify-${e.event_id}`}
                        aria-label={tDetail('timeline.verifyOkAria')}
                        style={{ marginLeft: 'var(--space-sm)' }}
                      >
                        <span aria-hidden="true">{'\u2713\uFE0E'}</span>
                        {tDetail('timeline.verifyOk')}
                      </span>
                    );
                  } else if (vs.status === 'fail') {
                    verifyControl = (
                      <span
                        className="audit-verify audit-verify--fail"
                        data-testid={`inbox-verify-${e.event_id}`}
                        aria-label={tDetail(`timeline.verifyFail.${vs.reason}.aria`)}
                        title={tDetail(`timeline.verifyFail.${vs.reason}.title`)}
                        style={{ marginLeft: 'var(--space-sm)' }}
                      >
                        <span aria-hidden="true">{'\u26A0\uFE0E'}</span>
                        {tDetail('timeline.verifyFail.label')}
                      </span>
                    );
                  } else if (vs.status === 'pending') {
                    verifyControl = (
                      <span
                        className="audit-verify audit-verify--pending"
                        data-testid={`inbox-verify-${e.event_id}`}
                        aria-label={tDetail('timeline.verifyPendingAria')}
                        style={{ marginLeft: 'var(--space-sm)' }}
                      >
                        {tDetail('timeline.verifyPending')}
                      </span>
                    );
                  } else {
                    verifyControl = (
                      <button
                        type="button"
                        className="audit-verify-btn"
                        data-testid={`inbox-verify-btn-${e.event_id}`}
                        onClick={() => {
                          void onVerifyRow(e.event_id, e.block_hash);
                        }}
                        style={{ marginLeft: 'var(--space-sm)' }}
                      >
                        {tDetail('timeline.verify')}
                      </button>
                    );
                  }

                  return (
                    <li key={e.event_id} data-testid={`inbox-event-row-${e.event_id}`}>
                      <div className="timeline__time mono">{formatTime('time', e.occurred_at)}</div>
                      <p className="timeline__title">{eventTitle(e, tDetail)}</p>
                      <div
                        className="timeline__meta"
                        style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' }}
                      >
                        <span className="mono">{e.actor_identity?.display ?? tDetail('timeline.unknownActor')}</span>
                        <span className="mono">{tDetail('timeline.separator')}</span>
                        <span className="mono">{tDetail('timeline.blockRef', { height: e.height })}</span>
                        {verifyControl}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* FE-F3 action modals — mounted at the page root so the
          Modal portal target is consistent and Escape/click-outside
          dismissal is shared. */}
      <AssignTechModal
        open={assignOpen}
        onClose={() => {
          setAssignOpen(false);
        }}
        incidentId={incident.incident_id}
        busy={actions.busy}
        onSubmit={actions.assignTech}
      />
      <RequestAckModal
        open={ackOpen}
        onClose={() => {
          setAckOpen(false);
        }}
        incidentId={incident.incident_id}
        busy={actions.busy}
        onSubmit={actions.requestAck}
      />
    </Container>
  );
}
