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
 * Header CTAs (FE-F3 → inbox-detail.md #14 reconciled 2026-09-11):
 *   - The two previous modal CTAs (AssignTechModal + RequestAckModal)
 *     collapse to a single inline form below the page header. Both
 *     write paths (actions.assignTech + actions.requestAck) fire on
 *     submit when their respective sections have content. This is the
 *     structural prefigure for the Batch 5 Tier 1 verifyAndAssign
 *     single-submit surface; Phase 1 ships the two-action version.
 *
 * Data sources:
 *   - GET /api/incidents → finds the matching row by id.
 *   - GET /api/events?limit=200 → filtered client-side by
 *     payload.incident_id === params.id.
 *
 * The page is intentionally lightweight — composition only. Heavy lifting
 * lives in the fixtures + handlers; this component just maps wire data
 * into the existing primitives (Container, Card, EmptyState).
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
}

/**
 * InlineActionForm — inbox-detail.md #14.
 *
 * Single inline form replacing the AssignTechModal + RequestAckModal
 * pair. Both write paths (actions.assignTech + actions.requestAck)
 * fire on submit when their respective sections have content; leaving
 * either section blank skips that side. Submit is disabled until at
 * least one side has the minimum-required fields filled.
 *
 * Validation mirrors the previous modals (per-side):
 *   - assign side: workOrder ≥ 5 chars; techId valid; eta > 0
 *   - ack side:    copy ≥ 5 chars
 *
 * On submit, the form fires whichever side(s) are valid (sequentially,
 * not in parallel — preserves ordering in the toast stream) and shows
 * the post-submit busy state until both complete. The form does NOT
 * reset on success — that's the parent's responsibility since the
 * page navigates back to /inbox after the chain event lands.
 */
interface InlineActionFormProps {
  incidentId: string;
  busy: boolean;
  techId: TechId;
  onTechIdChange: (id: TechId) => void;
  priority: 'P1' | 'P2' | 'P3';
  onPriorityChange: (p: 'P1' | 'P2' | 'P3') => void;
  eta: string;
  onEtaChange: (s: string) => void;
  workOrder: string;
  onWorkOrderChange: (s: string) => void;
  ackChannel: 'sms' | 'whatsapp' | 'voice';
  onAckChannelChange: (c: 'sms' | 'whatsapp' | 'voice') => void;
  ackCopy: string;
  onAckCopyChange: (s: string) => void;
  assignTech: (input: {
    incident_id: string;
    technician_id: string;
    technician_name: string;
    priority: 'P1' | 'P2' | 'P3';
    eta_target_minutes: number;
    work_order_summary: string;
  }) => Promise<boolean>;
  requestAck: (input: {
    incident_id: string;
    channel: 'sms' | 'whatsapp' | 'voice';
    summary: string;
  }) => Promise<boolean>;
}

function InlineActionForm({
  incidentId,
  busy,
  techId,
  onTechIdChange,
  priority,
  onPriorityChange,
  eta,
  onEtaChange,
  workOrder,
  onWorkOrderChange,
  ackChannel,
  onAckChannelChange,
  ackCopy,
  onAckCopyChange,
  assignTech,
  requestAck,
}: InlineActionFormProps) {
  const { t: tDetail } = useTranslation('inboxDetail');

  // Per-side validity. Each side has minimum requirements; either side
  // can fire independently on submit.
  const etaNum = Number(eta);
  const assignValid =
    techId !== undefined &&
    Number.isFinite(etaNum) &&
    etaNum > 0 &&
    workOrder.trim().length >= 5;
  const ackValid = ackCopy.trim().length >= 5;
  const canSubmit = !busy && (assignValid || ackValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // Fire assignTech first (chronologically: dispatch then notify),
    // then requestAck. Each call is independent — if either fails, the
    // other still attempts, matching the previous modal behaviour.
    if (assignValid) {
      const tech = TECH_ROSTER.find((x) => x.id === techId);
      if (tech) {
        await assignTech({
          incident_id: incidentId,
          technician_id: tech.id,
          technician_name: tech.name,
          priority,
          eta_target_minutes: etaNum,
          work_order_summary: workOrder.trim(),
        });
      }
    }
    if (ackValid) {
      await requestAck({
        incident_id: incidentId,
        channel: ackChannel,
        summary: ackCopy.trim(),
      });
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} data-testid="inbox-inline-action-form">
        <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
          {tDetail('inlineForm.title')}
        </h3>
        <p className="page-header__sub" style={{ marginTop: 'var(--space-xs)' }}>
          {tDetail('inlineForm.subtitle', { id: incidentId.slice(0, 8) })}
        </p>

        <div className="grid-12" style={{ marginTop: 'var(--space-md)' }}>
          {/* ASSIGN-TECH HALF — col-6 */}
          <div className="col-6" data-testid="inbox-inline-assign-section">
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {tDetail('inlineForm.assignHeading')}
            </h4>
            <div className="submit-form__row">
              <label htmlFor="inline-assign-tech" className="submit-form__label">
                {tDetail('assignModal.technicianLabel')}
              </label>
              <select
                id="inline-assign-tech"
                data-testid="inline-assign-tech"
                className="submit-form__input"
                value={techId}
                onChange={(e) => {
                  onTechIdChange(e.target.value as TechId);
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
                <label htmlFor="inline-assign-priority" className="submit-form__label">
                  {tDetail('assignModal.priorityLabel')}
                </label>
                <select
                  id="inline-assign-priority"
                  data-testid="inline-assign-priority"
                  className="submit-form__input"
                  value={priority}
                  onChange={(e) => {
                    onPriorityChange(e.target.value as 'P1' | 'P2' | 'P3');
                  }}
                  disabled={busy}
                >
                  <option value="P1">{tDetail('assignModal.priorityP1')}</option>
                  <option value="P2">{tDetail('assignModal.priorityP2')}</option>
                  <option value="P3">{tDetail('assignModal.priorityP3')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="inline-assign-eta" className="submit-form__label">
                  {tDetail('assignModal.etaLabel')}
                </label>
                <input
                  id="inline-assign-eta"
                  data-testid="inline-assign-eta"
                  type="number"
                  min={1}
                  max={1440}
                  className="submit-form__input"
                  value={eta}
                  onChange={(e) => {
                    onEtaChange(e.target.value);
                  }}
                  disabled={busy}
                />
              </div>
            </div>
            <div className="submit-form__row">
              <label htmlFor="inline-assign-summary" className="submit-form__label">
                {tDetail('assignModal.summaryLabel')}
              </label>
              <textarea
                id="inline-assign-summary"
                data-testid="inline-assign-summary"
                className="submit-form__textarea"
                value={workOrder}
                onChange={(e) => {
                  onWorkOrderChange(e.target.value);
                }}
                rows={3}
                placeholder={tDetail('assignModal.summaryPlaceholder')}
                disabled={busy}
              />
              <p className="submit-form__hint">{tDetail('assignModal.summaryHint')}</p>
            </div>
          </div>

          {/* ACK HALF — col-6 */}
          <div className="col-6" data-testid="inbox-inline-ack-section">
            <h4
              style={{
                margin: 0,
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {tDetail('inlineForm.ackHeading')}
            </h4>
            <div className="submit-form__row">
              <label htmlFor="inline-ack-channel" className="submit-form__label">
                {tDetail('ackModal.channelLabel')}
              </label>
              <select
                id="inline-ack-channel"
                data-testid="inline-ack-channel"
                className="submit-form__input"
                value={ackChannel}
                onChange={(e) => {
                  onAckChannelChange(e.target.value as 'sms' | 'whatsapp' | 'voice');
                }}
                disabled={busy}
              >
                <option value="sms">{tDetail('ackModal.channelSms')}</option>
                <option value="whatsapp">{tDetail('ackModal.channelWhatsapp')}</option>
                <option value="voice">{tDetail('ackModal.channelVoice')}</option>
              </select>
            </div>
            <div className="submit-form__row">
              <label htmlFor="inline-ack-copy" className="submit-form__label">
                {tDetail('ackModal.copyLabel')}
              </label>
              <textarea
                id="inline-ack-copy"
                data-testid="inline-ack-copy"
                className="submit-form__textarea"
                value={ackCopy}
                onChange={(e) => {
                  onAckCopyChange(e.target.value);
                }}
                rows={4}
                placeholder={tDetail('ackModal.copyPlaceholder')}
                disabled={busy}
              />
              <p className="submit-form__hint">{tDetail('ackModal.copyHint')}</p>
            </div>
          </div>
        </div>

        <div className="submit-form__actions">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmit}
            testId="inbox-inline-submit"
          >
            {busy ? tDetail('inlineForm.submitting') : tDetail('inlineForm.submit')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function InboxDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const { incidents, loading: incLoading, error: incError } = useIncidents();
  const { format: formatTime } = useDateFormatter();
  const actions = useIncidentActions();
  const { t: tDetail } = useTranslation('inboxDetail');
  const [events, setEvents] = useState<ChainEvent[]>([]);

  /**
   * inbox-detail.md #14 (reconciled 2026-09-11) — single inline form
   * replaces the AssignTechModal + RequestAckModal pair.
   *
   * The two CTAs (Assign field tech / Request citizen ack) collapse to
   * one inline form under the page header. Both write paths
   * (actions.assignTech + actions.requestAck) fire on submit when their
   * respective sections have content — leaving either section blank
   * skips that side. The submit button stays disabled until at least
   * one side has the minimum-required fields filled.
   *
   * This is the structural prefigure for the Batch 5 Tier 1
   * "verifyAndAssign" single-submit surface; Phase 1 ships the
   * two-action version, the gateway-side 4-event unification lands in
   * Phase 2 per migration plan step #11.
   */
  const [techId, setTechId] = useState<TechId>(TECH_ROSTER[0].id);
  const [priority, setPriority] = useState<'P1' | 'P2' | 'P3'>('P1');
  const [eta, setEta] = useState<string>('30');
  const [workOrder, setWorkOrder] = useState<string>('');
  const [ackChannel, setAckChannel] = useState<'sms' | 'whatsapp' | 'voice'>('sms');
  const [ackCopy, setAckCopy] = useState<string>('');

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
        </div>
      </div>

      {/* inbox-detail.md #14 — single inline form replaces the two
          previous modals (AssignTechModal + RequestAckModal). One
          submit button fires both write paths when their respective
          sections have content; leaving a section blank skips that
          side. Submit is disabled until at least one side has the
          minimum fields. The form sits in the page header band so the
          operator doesn't lose context with the timeline below. */}
      <InlineActionForm
        incidentId={incident.incident_id}
        busy={actions.busy}
        techId={techId}
        onTechIdChange={setTechId}
        priority={priority}
        onPriorityChange={setPriority}
        eta={eta}
        onEtaChange={setEta}
        workOrder={workOrder}
        onWorkOrderChange={setWorkOrder}
        ackChannel={ackChannel}
        onAckChannelChange={setAckChannel}
        ackCopy={ackCopy}
        onAckCopyChange={setAckCopy}
        assignTech={actions.assignTech}
        requestAck={actions.requestAck}
      />

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
    </Container>
  );
}
