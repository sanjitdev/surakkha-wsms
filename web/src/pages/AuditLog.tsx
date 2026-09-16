/**
 * AuditLog.tsx — operator-mode cross-incident chain audit log at /audit-log
 * (per docs/D-UX-Design/audit-log.md + WO-008).
 *
 * FE-1.5d (2026-09-16) — impeccable pass:
 *   - Dropped visible labels on filter dropdowns (mirror InboxList).
 *   - 12 inline SVG glyph components moved to
 *     src/components/ui/icons/AuditEventIcon.tsx.
 *   - Removed the empty `useEffect` for `anyAnomaly` and the
 *     hidden `audit-log-authorization-stub` div that nothing tested.
 *   - Per-row chrome collapsed to a 5-column grid; the wrapping
 *     `<span data-testid="…">` around BandPill / ReporterBadge is
 *     gone — those components already carry their own testids.
 *
 * Lockdown binding (foundation §1.1, §4.2, §7, §10, §13):
 *   - 6 filter chips compose AND-combined: incident (search),
 *     event-type (multi-select), actor (search), band (multi-select),
 *     reporter-badge (multi-select), date range.
 *   - Filter state serialises to URL query string + pre-populates on mount.
 *   - Filter change emits ChainRead{actor, incident_id: null,
 *     filter_combo} via POST /api/events.
 *   - Cross-incident list grouped by incident_id with summary header.
 *   - Row chrome: timestamp + actor + event-type icon + band pill +
 *     reporter-badge + hash anchor (mono + copy-to-clipboard) +
 *     inline verify.
 *   - Anomaly in any row → ⚠ on row + top banner (persistent until
 *     acknowledged).
 *   - "Open chain segment" link per group header → /incidents/:id/chain.
 *   - Date range picker uses DateRangePicker primitive.
 *   - Single-block inline verify reuses web/src/lib/chain-verify.ts.
 */
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { ContainerWidth, Band } from '../types/domain';
import type { ReporterKind } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useLocale } from '../hooks/useLocale';
import { verifyBlockHash, type VerifyState } from '../lib/chain-verify';
import type { DropdownOption } from '../components/ui/Dropdown.types';
import type { DateRange } from '../components/ui/DateRangePicker';
import { AUDIT_ICON_BY_TYPE, UnknownEventIcon } from '../components/ui/icons/AuditEventIcon';

// ──────────────────────────────────────────────────────────── domain types

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}

interface IncidentSummary {
  incident_id: string;
  ward_id?: string;
  severity: string;
  reporter_kind?: ReporterKind;
}

type BandKey = 'T1' | 'T2' | 'T3';
const BANDS: BandKey[] = ['T1', 'T2', 'T3'];
const REPORTERS: ReporterKind[] = ['anchor', 'hotline', 'webform', 'sensor'];

const BAND_TO_ENUM: Record<BandKey, Band> = {
  T1: Band.High,
  T2: Band.Medium,
  T3: Band.Low,
};

// ──────────────────────────────────────────────────────────── helpers

function truncateHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

async function copyToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* Clipboard API unavailable in some test contexts. */
  }
}

function severityToBandKey(severity: string | undefined): BandKey | null {
  if (severity === 'T3') return 'T3';
  if (severity === 'T2') return 'T2';
  if (severity === 'T1') return 'T1';
  return null;
}

function reporterKindFromPayload(p: Record<string, unknown>): ReporterKind {
  const explicit = typeof p.reporter_kind === 'string' ? p.reporter_kind : undefined;

  if (
    explicit === 'anchor' ||
    explicit === 'hotline' ||
    explicit === 'webform' ||
    explicit === 'sensor'
  ) {
    return explicit;
  }
  return 'webform';
}

function relativeTime(occurredAt: string, tAudit: (key: string, opts?: Record<string, unknown>) => string): string {
  const occurred = new Date(occurredAt).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - occurred) / 60000));

  if (diffMin < 1) return tAudit('timestamp.justNow');
  if (diffMin < 60) return tAudit('timestamp.minutesAgo', { n: diffMin });
  const hours = Math.floor(diffMin / 60);

  if (hours < 24) return tAudit('timestamp.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);

  return tAudit('timestamp.daysAgo', { n: days });
}

// ─────────────────────────────────────────────────── URL serialisation

interface FilterState {
  incident: string;
  eventTypes: string[];
  actor: string;
  bands: BandKey[];
  reporters: ReporterKind[];
  range: { from: Date | null; to: Date | null };
}

const DEFAULT_FILTERS: FilterState = {
  incident: '',
  eventTypes: [],
  actor: '',
  bands: [],
  reporters: [],
  range: { from: null, to: null },
};

const FILTER_KEYS = ['incident', 'actor', 'eventType', 'band', 'reporter', 'from', 'to'];

function parseFiltersFromUrl(params: URLSearchParams): FilterState {
  const incident = params.get('incident') ?? '';
  const actor = params.get('actor') ?? '';
  const eventTypes = (params.get('eventType') ?? '').split(',').filter(Boolean);
  const bands = (params.get('band') ?? '').split(',').filter((s): s is BandKey =>
    BANDS.includes(s as BandKey),
  );
  const reporters = (params.get('reporter') ?? '').split(',').filter((s): s is ReporterKind =>
    REPORTERS.includes(s as ReporterKind),
  );
  const fromStr = params.get('from');
  const toStr = params.get('to');

  return {
    incident,
    eventTypes,
    actor,
    bands,
    reporters,
    range: {
      from: fromStr ? new Date(fromStr) : null,
      to: toStr ? new Date(toStr) : null,
    },
  };
}

function serialiseFiltersToParams(f: FilterState): URLSearchParams {
  const out = new URLSearchParams();

  if (f.incident) out.set('incident', f.incident);
  if (f.actor) out.set('actor', f.actor);
  if (f.eventTypes.length > 0) out.set('eventType', f.eventTypes.join(','));
  if (f.bands.length > 0) out.set('band', f.bands.join(','));
  if (f.reporters.length > 0) out.set('reporter', f.reporters.join(','));
  if (f.range.from) out.set('from', f.range.from.toISOString());
  if (f.range.to) out.set('to', f.range.to.toISOString());
  return out;
}

function filterCombo(f: FilterState): Record<string, unknown> {
  // Wire contract — serialise only the active filters so the chain event
  // payload stays compact.
  const combo: Record<string, unknown> = {};

  if (f.incident) combo.incident = f.incident;
  if (f.actor) combo.actor = f.actor;
  if (f.eventTypes.length > 0) combo.event_types = f.eventTypes;
  if (f.bands.length > 0) combo.bands = f.bands;
  if (f.reporters.length > 0) combo.reporters = f.reporters;
  if (f.range.from) combo.from = f.range.from.toISOString();
  if (f.range.to) combo.to = f.range.to.toISOString();
  return combo;
}

// ──────────────────────────────────────────────────────────── component

export function AuditLog(): ReactNode {
  const { chainHead } = useAppLayout();
  const { t: tAudit } = useTranslation('auditLog');
  const { format: formatTime } = useDateFormatter();
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [incidents, setIncidents] = useState<IncidentSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromUrl(new URLSearchParams(searchParams.toString())),
  );
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());
  const [anomalyBannerAcknowledged, setAnomalyBannerAcknowledged] = useState<boolean>(false);

  // ── Load chain events + incident summaries on mount.
  useEffect(() => {
    void (async () => {
      try {
        const rEvents = await fetch('/api/events?limit=200');
        const dataEvents = (await rEvents.json()) as { events: ChainEvent[] };

        setEvents([...dataEvents.events].sort((a, b) => b.height - a.height));
      } catch (err) {
        console.error('[surakkha] audit events fetch failed', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
      // Incident summaries are optional — fetch defensively so a missing
      // or non-JSON /api/incidents response doesn't crash the page.
      try {
        const rIncidents = await fetch('/api/incidents');
        const dataIncidents = (await rIncidents.json()) as IncidentSummary[];

        if (Array.isArray(dataIncidents)) setIncidents(dataIncidents);
      } catch {
        // soft fail — leave incidents as null (no group headers, but
        // the rows still render under their incident_id groups).
      }
    })();
  }, []);

  // ── Emit ChainRead on filter change (debounced 300ms — see audit-log.md Q1).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'ChainRead',
          payload: {
            actor: 'audit-log-viewer',
            incident_id: null,
            filter_combo: filterCombo(filters),
          },
        }),
      }).catch(() => undefined);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [filters]);

  // ── Filter chip URL persistence (REQ-002).
  useEffect(() => {
    const next = serialiseFiltersToParams(filters);
    const current = new URLSearchParams(searchParams.toString());

    // Don't clobber unrelated params.
    for (const [k] of current) {
      if (!next.has(k) && !FILTER_KEYS.includes(k)) {
        next.set(k, current.get(k) ?? '');
      }
    }
    setSearchParams(next, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Filter event types known from the wire (closed enum per chain spec).
  const eventTypeOptions = useMemo<DropdownOption<string>[]>(() => {
    const known = new Set<string>();

    for (const e of events) known.add(e.event_type);
    return Array.from(known).sort().map((v) => ({ value: v, label: v }));
  }, [events]);

  const incidentIdOptions = useMemo(() => {
    const ids = new Set<string>();

    for (const e of events) {
      const id = (e.payload as { incident_id?: string }).incident_id;
      if (id) ids.add(id);
    }
    return Array.from(ids).sort();
  }, [events]);

  const actorOptions = useMemo(() => {
    const actors = new Set<string>();

    for (const e of events) {
      const ref = e.actor_identity?.ref;
      if (ref) actors.add(ref);
    }
    return Array.from(actors).sort();
  }, [events]);

  const bandOptions = useMemo<DropdownOption<BandKey>[]>(() =>
    BANDS.map((b) => ({ value: b, label: tAudit(`band.${b}`) })), [tAudit]);

  const reporterOptions = useMemo<DropdownOption<ReporterKind>[]>(() =>
    REPORTERS.map((r) => ({ value: r, label: tAudit(`reporter.${r}`) })), [tAudit]);

  // ── Apply filter chips (AND-composed per locked #8).
  const visible = useMemo(() => {
    const incidentMatches = (e: ChainEvent): boolean => {
      if (!filters.incident) return true;
      return (e.payload as { incident_id?: string }).incident_id === filters.incident;
    };
    const eventTypeMatches = (e: ChainEvent): boolean => {
      if (filters.eventTypes.length === 0) return true;
      return filters.eventTypes.includes(e.event_type);
    };
    const actorMatches = (e: ChainEvent): boolean => {
      if (!filters.actor) return true;
      return e.actor_identity?.ref === filters.actor;
    };
    const bandMatches = (e: ChainEvent): boolean => {
      if (filters.bands.length === 0) return true;
      const sev = severityToBandKey((e.payload as { severity?: string }).severity);

      return sev !== null && filters.bands.includes(sev);
    };
    const reporterMatches = (e: ChainEvent): boolean => {
      if (filters.reporters.length === 0) return true;
      return filters.reporters.includes(reporterKindFromPayload(e.payload));
    };
    const inRange = (e: ChainEvent): boolean => {
      const ev = new Date(e.occurred_at);

      if (Number.isNaN(ev.getTime())) return true;
      if (filters.range.from && ev < filters.range.from) return false;
      if (filters.range.to && ev > new Date(filters.range.to.getTime() + 86_400_000 - 1)) {
        return false;
      }
      return true;
    };

    return events.filter((e) =>
      incidentMatches(e) &&
      eventTypeMatches(e) &&
      actorMatches(e) &&
      bandMatches(e) &&
      reporterMatches(e) &&
      inRange(e),
    );
  }, [events, filters, locale]);

  // ── Group by incident_id (REQ-004).
  const grouped = useMemo(() => {
    const map = new Map<string, ChainEvent[]>();
    const summaryById = new Map<string, IncidentSummary>();

    if (Array.isArray(incidents)) {
      for (const inc of incidents) summaryById.set(inc.incident_id, inc);
    }

    for (const e of visible) {
      const id = (e.payload as { incident_id?: string }).incident_id ?? '__unscoped__';

      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(e);
    }
    const out: Array<{ id: string; rows: ChainEvent[]; summary?: IncidentSummary }> = [];

    for (const [id, rows] of map) {
      out.push({ id, rows, summary: summaryById.get(id) });
    }
    // Newest incidents first (top event determines order).
    out.sort((a, b) => {
      const aTop = a.rows[0]?.height ?? 0;
      const bTop = b.rows[0]?.height ?? 0;

      return bTop - aTop;
    });
    return out;
  }, [visible, incidents]);

  // ── Per-row inline verify reuses chain-verify.ts (REQ-005 #11).
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

  // ── Anomaly surfacing — fail rows (status: fail) + persistent banner (REQ-006).
  const anomalyEventIds = useMemo(() => {
    const out = new Set<string>();

    for (const [eventId, state] of verifyStates) {
      if (state.status === 'fail') out.add(eventId);
    }
    return out;
  }, [verifyStates]);

  const anyAnomaly = anomalyEventIds.size > 0;

  // ── Filter change handlers (REQ-001 + REQ-002 + REQ-003).
  const onIncidentChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, incident: ev.target.value }));
  }, []);
  const onActorChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, actor: ev.target.value }));
  }, []);
  const onEventTypesChange = useCallback((next: string[]) => {
    setFilters((prev) => ({ ...prev, eventTypes: next }));
  }, []);
  const onBandsChange = useCallback((next: BandKey[]) => {
    setFilters((prev) => ({ ...prev, bands: next }));
  }, []);
  const onReportersChange = useCallback((next: ReporterKind[]) => {
    setFilters((prev) => ({ ...prev, reporters: next }));
  }, []);
  const onRangeChange = useCallback((next: DateRange | null) => {
    setFilters((prev) => ({ ...prev, range: next ?? { from: null, to: null } }));
  }, []);
  const onClearAll = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
    setVerifyStates(new Map());
    setAnomalyBannerAcknowledged(false);
  }, []);

  // ──────────────────────────────────────────────────────────── render

  return (
    <Container width={ContainerWidth.Wide}>
      <div
        className="audit-log-page"
        data-testid="audit-log-page"
        aria-labelledby="audit-log-page-title"
      >
        <header className="audit-log-header" data-testid="audit-log-header">
          <h1 id="audit-log-page-title">{tAudit('page.title')}</h1>
          <p className="audit-log-header__sub">
            {tAudit('page.subtitle')}
            {' · '}
            <span data-testid="audit-log-summary">
              {tAudit('header.summaryFull', {
                total: visible.length,
                height: chainHead?.height ?? tAudit('header.heightEmDash'),
              })}
            </span>
          </p>
        </header>

        <main data-testid="audit-log-main">
          {/* Anomaly banner — persistent until acknowledged (REQ-006). */}
          {anyAnomaly && !anomalyBannerAcknowledged ? (
            <div
              className="audit-log-anomaly-banner"
              data-testid="audit-log-anomaly-banner"
              role="alert"
              aria-live="polite"
            >
              <span className="audit-log-anomaly-banner__icon" aria-hidden="true">{'\u26A0'}</span>
              <div className="audit-log-anomaly-banner__body">
                <strong>{tAudit('anomaly.bannerTitle')}</strong>
                <p>{tAudit('anomaly.bannerBody')}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setAnomalyBannerAcknowledged(true); }}
                testId="audit-log-anomaly-banner-ack"
              >
                {tAudit('anomaly.bannerAcknowledge')}
              </Button>
            </div>
          ) : null}

          {/* Chain head strip — height + prev + sealed + root ok. Single
              line; reads as a status header, not a competing card. */}
          {chainHead ? (
            <div className="audit-log-chain-head" data-testid="audit-log-chain-head">
              <span className="mono">
                {tAudit('chainHead.headLabel')}
                {chainHead.height}
              </span>
              <span className="mono" data-testid="chain-head-hash">
                {chainHead.block_hash
                  ? truncateHash(chainHead.block_hash)
                  : tAudit('table.actorEmDash')}
              </span>
              <span className="mono">
                {tAudit('chainHead.prevLabel')}{' '}
                {chainHead.prev_hash
                  ? truncateHash(chainHead.prev_hash)
                  : tAudit('table.actorEmDash')}
              </span>
              {chainHead.sealed_at ? (
                <span className="mono">
                  {tAudit('chainHead.sealedLabel')} {formatTime('time-full', chainHead.sealed_at)}
                </span>
              ) : null}
              <span className="mono">{tAudit('chainHead.rootOk')}</span>
            </div>
          ) : null}

          {/* Filter chips (REQ-001 + REQ-008 #10 DateRangePicker primitive).
              FE-1.5d: each Dropdown drops its visible `label` — the
              placeholder doubles as the aria-label so the toolbar stays
              compact, matching the InboxList pattern. */}
          <section
            className="audit-log-filter-chips"
            data-testid="audit-log-filter-chips"
            aria-label={tAudit('filter.compose')}
          >
            <div className="audit-log-filter-chip" data-testid="audit-log-chip-incident">
              <Input
                type="search"
                value={filters.incident}
                onChange={onIncidentChange}
                placeholder={tAudit('filter.incident.placeholder')}
                list="audit-log-incident-options"
                aria-label={tAudit('filter.incident.label')}
                testId="audit-log-chip-incident-input"
              />
              {incidentIdOptions.length > 0 ? (
                <datalist id="audit-log-incident-options">
                  {incidentIdOptions.map((id) => (
                    <option key={id} value={id} />
                  ))}
                </datalist>
              ) : null}
            </div>

            <div className="audit-log-filter-chip" data-testid="audit-log-chip-event-type">
              <Dropdown<string>
                options={eventTypeOptions}
                mode="multi"
                value={filters.eventTypes}
                onChange={onEventTypesChange}
                placeholder={tAudit('filter.eventType.placeholder')}
                searchable
                testId="audit-log-chip-event-type-dropdown"
              />
            </div>

            <div className="audit-log-filter-chip" data-testid="audit-log-chip-actor">
              <Input
                type="search"
                value={filters.actor}
                onChange={onActorChange}
                placeholder={tAudit('filter.actor.placeholder')}
                list="audit-log-actor-options"
                aria-label={tAudit('filter.actor.label')}
                testId="audit-log-chip-actor-input"
              />
              {actorOptions.length > 0 ? (
                <datalist id="audit-log-actor-options">
                  {actorOptions.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              ) : null}
            </div>

            <div className="audit-log-filter-chip" data-testid="audit-log-chip-band">
              <Dropdown<BandKey>
                options={bandOptions}
                mode="multi"
                value={filters.bands}
                onChange={onBandsChange}
                placeholder={tAudit('filter.band.placeholder')}
                testId="audit-log-chip-band-dropdown"
              />
            </div>

            <div className="audit-log-filter-chip" data-testid="audit-log-chip-reporter-badge">
              <Dropdown<ReporterKind>
                options={reporterOptions}
                mode="multi"
                value={filters.reporters}
                onChange={onReportersChange}
                placeholder={tAudit('filter.reporterBadge.placeholder')}
                testId="audit-log-chip-reporter-badge-dropdown"
              />
            </div>

            <div className="audit-log-filter-chip" data-testid="audit-log-chip-date-range">
              <DateRangePicker
                value={filters.range}
                onChange={onRangeChange}
                testId="audit-log-chip-date-range-trigger"
              />
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={onClearAll}
              testId="audit-log-filter-clear"
            >
              {tAudit('filter.clearAll')}
            </Button>
          </section>

          {/* Event list — grouped by incident_id (REQ-004). */}
          <section
            className="audit-log-event-list"
            data-testid="audit-log-event-list"
            aria-label={tAudit('table.eventRowsLabel', { count: visible.length })}
          >
            {grouped.length === 0 && !loading ? (
              <Card>
                <p className="audit-log-empty">
                  {tAudit('empty.heading')}
                  {' · '}
                  {tAudit('empty.bodyWithFilter')}
                </p>
              </Card>
            ) : null}

            {grouped.map((group) => (
              <Card
                key={group.id}
                className={`audit-log-group${anyAnomaly ? ' audit-log-group--has-anomaly' : ''}`}
              >
                <header
                  className="audit-log-group__header"
                  data-testid="audit-log-group-header"
                  data-incident-id={group.id}
                >
                  <h3>{tAudit('table.incidentGroupHeading', { id: group.id })}</h3>
                  <span className="audit-log-group__count">
                    {tAudit('table.eventRowsLabel', { count: group.rows.length })}
                  </span>
                  {group.summary ? (
                    <span className="audit-log-group__summary">
                      {group.summary.ward_id ? `ward ${group.summary.ward_id}` : ''}
                      {group.summary.severity ? ` · ${group.summary.severity}` : ''}
                    </span>
                  ) : null}
                  <Link
                    to={`/incidents/${group.id}/chain`}
                    className="audit-log-button-open-chain-segment"
                    data-testid="audit-log-button-open-chain-segment"
                    data-incident-id={group.id}
                    title={tAudit('openChain.title')}
                  >
                    {tAudit('openChain.label')}
                  </Link>
                </header>

                <ul className="audit-log-group__rows">
                  {group.rows.map((e) => {
                    const bandKey = severityToBandKey((e.payload as { severity?: string }).severity);
                    const verifyState = verifyStates.get(e.event_id) ?? { status: 'idle' as const };
                    const isAnomaly = verifyState.status === 'fail';
                    const Icon = AUDIT_ICON_BY_TYPE[e.event_type] ?? UnknownEventIcon;
                    const reporterKind = reporterKindFromPayload(e.payload);

                    return (
                      <li
                        key={e.event_id}
                        className={`audit-log-event-row${isAnomaly ? ' audit-log-event-row--anomaly' : ''}`}
                        data-testid="audit-log-event-row"
                        data-event-id={e.event_id}
                        data-incident-id={group.id}
                      >
                        <span
                          className="audit-log-event-timestamp"
                          data-testid="audit-log-event-timestamp"
                        >
                          <time
                            dateTime={e.occurred_at}
                            title={formatTime('time-full', e.occurred_at)}
                          >
                            {relativeTime(e.occurred_at, tAudit)}
                          </time>
                        </span>

                        <span
                          className="audit-log-actor-chip mono"
                          data-testid="audit-log-actor-chip"
                        >
                          {e.actor_identity?.display ?? e.actor_identity?.ref ?? tAudit('table.actorEmDash')}
                        </span>

                        <span
                          className="audit-log-event-type-icon"
                          data-testid="audit-log-event-type-icon"
                          data-event-type={e.event_type}
                        >
                          <Icon />
                          <span className="audit-log-event-type-label">{e.event_type}</span>
                        </span>

                        <span
                          className="audit-log-band-pill"
                          data-testid="audit-log-band-pill"
                        >
                          {bandKey ? (
                            <BandPill band={BAND_TO_ENUM[bandKey]} locked={true} testId={`audit-log-band-pill-${e.event_id}`} />
                          ) : (
                            <span aria-hidden="true">{tAudit('table.actorEmDash')}</span>
                          )}
                        </span>

                        <span
                          className="audit-log-reporter-badge-chip"
                          data-testid="audit-log-reporter-badge-chip"
                          data-reporter-kind={reporterKind}
                        >
                          <ReporterBadge
                            kind={reporterKind}
                            i18nNamespace="auditLog"
                            i18nKeyPrefix="reporter"
                            testId={`audit-log-reporter-badge-${e.event_id}`}
                          />
                        </span>

                        <span
                          className="audit-log-hash-anchor mono"
                          data-testid="audit-log-hash-anchor"
                          data-hash={e.block_hash}
                        >
                          <button
                            type="button"
                            onClick={() => { void copyToClipboard(e.block_hash); }}
                            title={tAudit('table.blockHashTitle')}
                            data-testid={`audit-log-hash-copy-${e.event_id}`}
                            aria-label={`${tAudit('table.blockHashTitle')}: ${e.block_hash}`}
                          >
                            {truncateHash(e.block_hash)}
                          </button>
                        </span>

                        <span
                          className="audit-log-verify-inline"
                          data-testid={`audit-log-verify-inline-${e.event_id}`}
                          data-event-id={e.event_id}
                        >
                          {verifyState.status === 'pending' ? (
                            <span aria-label={tAudit('table.verifyPendingAria')}>{tAudit('table.verifyPending')}</span>
                          ) : verifyState.status === 'ok' ? (
                            <span aria-label={tAudit('table.verifyOkAria')}>{tAudit('table.verifyOk')}</span>
                          ) : verifyState.status === 'fail' ? (
                            <>
                              <span
                                className="audit-log-anomaly-badge"
                                data-testid={`audit-log-row-anomaly-${e.event_id}`}
                                title={tAudit('anomaly.rowBadgeTitle')}
                                aria-label={tAudit('anomaly.rowBadgeAria')}
                              >
                                {'\u26A0'}
                              </span>
                              <span
                                className="audit-log-verify-fail-label"
                                aria-label={tAudit(`table.verifyFail.${verifyState.reason}.aria`)}
                              >
                                {tAudit('table.verifyFail.label')}
                              </span>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { void onVerifyRow(e.event_id, e.block_hash); }}
                              data-testid={`audit-log-verify-btn-${e.event_id}`}
                              title={tAudit('table.verifyButtonTitle')}
                            >
                              {tAudit('table.verify')}
                            </button>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </section>
        </main>
      </div>
    </Container>
  );
}
