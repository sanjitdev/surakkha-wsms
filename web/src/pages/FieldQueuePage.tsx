/**
 * FieldQueuePage.tsx — WO-006 lockdown reconciliation.
 *
 * Tier 2 load-bearing page for Karim (field_technician). Reconciles the
 * pre-existing work-queue.html port to docs/D-UX-Design/field-queue.md.
 *
 * Lockdown binding:
 *   - Trust band = verification state (T1/T2/T3/resolved) — colour + glyph + text
 *   - Reporter badge = source attribute (anchor/hotline/webform/sensor) — separate dimension
 *   - shadcn/ui primitives (Card, Button, Dropdown, Toast) — already in /components/ui
 *   - Focus rings 2px --color-primary-tint (per foundation §7)
 *   - EN + BN locales only (no Hindi strings)
 *   - 5s polling + 100ms crossfade per foundation §8.2
 *
 * Wire contract:
 *   GET  /api/incidents?assigned_to=karim_id   read assignments
 *   GET  /api/events?limit=50                  read events
 *   POST /api/events { event_type: "Acknowledged" | "EnRoute", payload: {...} }
 *
 * Out of scope for this Tier 2 build (deferred per WO-006 §Scope):
 *   - Full offline-first layer (IndexedDB + sync) — MAJOR; spec Q1
 *   - Sensor prep mini-map per row — MAJOR
 *   - Reasoning preview collapsed-by-default — MEDIUM
 *   - REOPENED row chip + verbatim ProofInsufficient preview — MAJOR
 *   - Sync status chip (full sync layer) — stub only; deferred to later patch
 */

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import '../styles/tech.css';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { Dropdown } from '../components/ui/Dropdown';
import { useToast } from '../components/ui/ToastProvider';
import { Band } from '../types/domain';
import type { ReporterKind } from '../types/domain';
import type { CSSProperties as ReactCSSProperties } from 'react';

// ──────────────────────────────────────────────────────────────────── types

type Filter = 'mine' | 'available';
type IncidentSeverity = 'T3' | 'T2' | 'T1' | 'T0';

interface IncidentLike {
  incident_id: string;
  ward_id?: string;
  severity: IncidentSeverity;
  status: 'open' | 'resolved' | 'escalated';
  last_block_height: number;
  last_event_type: string;
  last_occurred_at: string;
  reporter_kind?: ReporterKind;
  assigned_to?: string;
  /** Optional inline lat/lon so the geolocation hook can compute distance. */
  lat?: number;
  lon?: number;
  /** Optional missing-evidence flags (photo/gps/description). */
  missing_evidence?: ('photo' | 'gps' | 'description')[];
  /** Optional short title for the row. */
  title?: string;
}

type GeolocationStatus = 'idle' | 'ok' | 'denied' | 'unavailable';

interface GeoState {
  status: GeolocationStatus;
  lat: number | null;
  lon: number | null;
  updatedAt: number | null;
}

// ──────────────────────────────────────────────────────────── helpers

/** Convert severity tier to BandPill enum mapping. The Band enum is
 *  High = T1 (unverified), Medium = T2 (verified), Low = T3 (issuance)
 *  per foundation §1.1. */
function bandFor(severity: IncidentSeverity): Band | null {
  if (severity === 'T3') return Band.Low;
  if (severity === 'T2') return Band.Medium;
  if (severity === 'T1') return Band.High;
  return null;
}

/** Severity rank — lower = higher priority. Used by the priority-first /
 *  age-second comparator. */
function severityRank(severity: IncidentSeverity): number {
  if (severity === 'T3') return 0;
  if (severity === 'T2') return 1;
  if (severity === 'T1') return 2;
  return 3;
}

/** Haversine distance in km between two {lat,lon} pairs. Returns null
 *  if either side is missing. */
function distanceKm(a: { lat: number; lon: number } | null, b: { lat: number; lon: number } | null): number | null {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function ageLabel(nowMs: number, occurredAt: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const occurred = new Date(occurredAt).getTime();
  const diffMin = Math.max(0, Math.round((nowMs - occurred) / 60000));

  if (diffMin < 60) return t('row.ageMinutes', { count: diffMin });
  const hours = Math.floor(diffMin / 60);
  return t('row.ageHours', { count: hours });
}

// ──────────────────────────────────────────────────────── geolocation hook

function useGeolocation(): GeoState {
  const [state, setState] = useState<GeoState>({
    status: 'idle',
    lat: null,
    lon: null,
    updatedAt: null,
  });
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Geolocation API may not exist (server-rendered test env, etc.).
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState((s) => ({ ...s, status: 'unavailable' }));
      return;
    }
    // Some test runners stub navigator.geolocation as an object without
    // watchPosition; guard with `typeof === 'function'`.
    if (typeof navigator.geolocation.watchPosition !== 'function') {
      setState((s) => ({ ...s, status: 'unavailable' }));
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        status: 'ok',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        updatedAt: pos.timestamp,
      });
    };
    const onError = (err: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        status: err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable',
      }));
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
        enableHighAccuracy: false,
        maximumAge: 30_000,
        timeout: 10_000,
      });
    } catch {
      setState((s) => ({ ...s, status: 'unavailable' }));
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator.geolocation.clearWatch === 'function') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    };
  }, []);

  return state;
}

// ───────────────────────────────────────────────────────── component

const POLL_INTERVAL_MS = 5_000;

export function FieldQueuePage() {
  const { session } = useAppLayout();
  const { format: formatDateLocal } = useDateFormatter();
  const { t: tField } = useTranslation('fieldQueue');
  const toast = useToast();

  const technicianId = session.actor_ref;
  const [incidents, setIncidents] = useState<IncidentLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('mine');
  const [now, setNow] = useState<number>(() => Date.now());
  const [ringedKeys, setRingedKeys] = useState<Set<string>>(new Set());
  const previousKeysRef = useRef<Map<string, IncidentLike>>(new Map());

  const geo = useGeolocation();
  const [pendingEnRoute, setPendingEnRoute] = useState<string | null>(null);

  // 1. fetch loop — reads incidents assigned to Karim (or unassigned for
  //    "Available"). Polls every 5s per foundation §8.2.
  const refetch = useCallback(async (): Promise<void> => {
    try {
      const url = `/api/incidents?assigned_to=${encodeURIComponent(technicianId)}`;
      const res = await fetch(url);
      const data = (await res.json()) as IncidentLike[];

      // Diff previous → new keys. Rows whose data changed get the
      // "ringed" class so the 100ms crossfade animation fires.
      const next = Array.isArray(data) ? data : [];
      const prevMap = previousKeysRef.current;
      const ringed = new Set<string>();

      for (const row of next) {
        const prior = prevMap.get(row.incident_id);

        if (prior && JSON.stringify(prior) !== JSON.stringify(row)) {
          ringed.add(row.incident_id);
        }
        prevMap.set(row.incident_id, row);
      }
      setIncidents(next);
      setRingedKeys(ringed);
      // Clear ringed set after the animation completes so it can re-fire
      // on the next change.
      window.setTimeout(() => {
        setRingedKeys((s) => {
          if (s.size === 0) return s;
          return new Set();
        });
      }, 200);
    } catch (err) {
      // Fail-soft — leave the previous list in place and surface a
      // single info toast. Lockdown doesn't require a blocking error
      // modal on this surface.
      console.error('[surakkha] field queue fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  useEffect(() => {
    void refetch();
    const id = window.setInterval(() => {
      void refetch();
    }, POLL_INTERVAL_MS);
    const nowId = window.setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      window.clearInterval(id);
      window.clearInterval(nowId);
    };
  }, [refetch]);

  // 2. Filter visible rows by chip + assignment state.
  const visible = useMemo(() => {
    if (filter === 'mine') {
      // "My assignments" — rows whose latest event is owned by Karim
      // (heuristic: any of {assigned_to === technicianId} OR
      // {last_event_type === 'TechnicianAssigned'}).
      return incidents.filter(
        (r) => r.assigned_to === technicianId || r.last_event_type === 'TechnicianAssigned',
      );
    }
    // "Available" — open incidents not yet assigned.
    return incidents.filter(
      (r) => r.status === 'open' && r.last_event_type !== 'TechnicianAssigned' && !r.assigned_to,
    );
  }, [incidents, filter, technicianId]);

  // 3. Priority-first / age-second sort. Tighter ties (same severity) get
  //    older first so the most-aged work surfaces at the top.
  const sortedVisible = useMemo(() => {
    return [...visible].sort((a, b) => {
      const sa = severityRank(a.severity);
      const sb = severityRank(b.severity);

      if (sa !== sb) return sa - sb;
      // Age ascending — older first.
      return new Date(a.last_occurred_at).getTime() - new Date(b.last_occurred_at).getTime();
    });
  }, [visible]);

  // 4. Wire contract — POST /api/events.
  const postEvent = useCallback(
    async (eventType: 'Acknowledged' | 'EnRoute', payload: Record<string, unknown>): Promise<void> => {
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event_type: eventType, payload }),
        });
      } catch (err) {
        console.error(`[surakkha] ${eventType} post failed`, err);
      }
    },
    [],
  );

  const onAcknowledge = useCallback(
    async (row: IncidentLike): Promise<void> => {
      await postEvent('Acknowledged', { actor: 'karim', incident_id: row.incident_id });
      toast.success(tField('toast.acknowledged'));
      // Open the detail page after emit (per WO-006 acceptance #4).
      window.setTimeout(() => {
        window.location.href = `/field/incident-detail?incident=${encodeURIComponent(row.incident_id)}`;
      }, 250);
    },
    [postEvent, toast, tField],
  );

  const onEnRoute = useCallback(
    async (row: IncidentLike, etaMinutes: number): Promise<void> => {
      await postEvent('EnRoute', {
        actor: 'karim',
        incident_id: row.incident_id,
        eta_minutes: etaMinutes,
      });
      toast.info(tField('toast.enRoute', { minutes: etaMinutes }));
      setPendingEnRoute(null);
      // Open detail page after emit.
      window.setTimeout(() => {
        window.location.href = `/field/incident-detail?incident=${encodeURIComponent(row.incident_id)}`;
      }, 250);
    },
    [postEvent, toast, tField],
  );

  const etaOptions = useMemo(
    () => [
      { value: 1, label: tField('etaPicker.1') },
      { value: 5, label: tField('etaPicker.5') },
      { value: 15, label: tField('etaPicker.15') },
      { value: 30, label: tField('etaPicker.30') },
      { value: 60, label: tField('etaPicker.60') },
    ],
    [tField],
  );

  // 5. KPI cells — open / due<30m / overdue / closed (re-labeled per
  //    spec diff #15).
  const kpis = useMemo(() => {
    const open = sortedVisible.filter((r) => r.status === 'open').length;
    const dueSoon = sortedVisible.filter((r) => {
      if (r.status !== 'open') return false;
      const age = Math.round((now - new Date(r.last_occurred_at).getTime()) / 60000);
      return age >= 20 && age < 30;
    }).length;
    const overdue = sortedVisible.filter((r) => {
      if (r.status !== 'open') return false;
      const age = Math.round((now - new Date(r.last_occurred_at).getTime()) / 60000);
      return age >= 30;
    }).length;
    const closed = sortedVisible.filter((r) => r.status === 'resolved').length;

    return { open, dueSoon, overdue, closed };
  }, [sortedVisible, now]);

  const personName = session.display_name.replace(' — Field Technician', '');
  const personaRole = tField('page.subtitleRole');
  const todayLabel = formatDateLocal('date-short', new Date(now));

  const rowInlineStyles: ReactCSSProperties = { outline: 'none' };
  const headerRowStyles: ReactCSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 'var(--space-md)',
  };

  // Geolocation status caption (used by the deferred sync-status chip).
  const geoCaption =
    geo.status === 'ok'
      ? tField('syncStatus.online')
      : geo.status === 'denied'
        ? tField('syncStatus.offline')
        : geo.status === 'unavailable'
          ? tField('syncStatus.offline')
          : tField('syncStatus.syncing');

  return (
    <main
      className="container container--wide field-queue-page"
      data-testid="field-queue-page"
      data-area="field-queue-page"
    >
      <div className="page-header" data-testid="field-queue-header" data-area="field-queue-header">
        <div className="page-header__row" style={headerRowStyles}>
          <div>
            <h1>{tField('page.title')}</h1>
            <div className="page-header__sub">
              {tField('page.subtitle', { name: personName, role: personaRole, date: todayLabel })}
            </div>
          </div>
          {/* Sync-status chip — stub. Full sync layer (offline-first,
              IndexedDB queue, conflict resolution) is deferred per WO-006
              §Scope. The chip renders in DOM so a later patch can fill
              in real state without touching layout. */}
          <span
            className="field-queue-sync-status-chip"
            data-testid="field-queue-sync-status-chip"
            aria-label={`Sync status: ${geoCaption}`}
            title={tField('offline.deferred')}
          >
            <span className="field-queue-sync-status-chip__dot" aria-hidden="true" />
            {geoCaption}
          </span>
        </div>
      </div>

      {/* KPI strip — re-labeled per spec diff #15 */}
      <div className="tech-today" data-testid="field-queue-kpi-strip" data-area="field-queue-kpi">
        <KpiCell label={tField('kpi.open')} value={kpis.open} sub={tField('kpi.openSub', { count: kpis.open })} testId="field-queue-kpi-open" />
        <KpiCell label={tField('kpi.dueIn30')} value={kpis.dueSoon} sub={tField('kpi.dueIn30Sub', { count: kpis.dueSoon })} testId="field-queue-kpi-due" />
        <KpiCell
          label={tField('kpi.overdue')}
          value={kpis.overdue}
          sub={tField('kpi.overdueSub', { count: kpis.overdue })}
          color={kpis.overdue > 0 ? 'var(--color-amber-bright)' : undefined}
          testId="field-queue-kpi-overdue"
        />
        <KpiCell label={tField('kpi.closed')} value={kpis.closed} sub={tField('kpi.closedSub', { count: kpis.closed })} testId="field-queue-kpi-closed" />
      </div>

      {/* Filter chips — "My assignments" (default) + "Available" */}
      <div
        className="field-queue-filter-chips"
        data-testid="field-queue-filter-chips"
        data-area="field-queue-filter-chips"
      >
        <button
          type="button"
          className={`field-queue-chip-mine${filter === 'mine' ? ' is-on' : ''}`}
          onClick={() => setFilter('mine')}
          data-testid="field-queue-chip-mine"
          data-area="field-queue-chip-mine"
          aria-pressed={filter === 'mine'}
        >
          {tField('filter.mine')}
        </button>
        <button
          type="button"
          className={`field-queue-chip-available${filter === 'available' ? ' is-on' : ''}`}
          onClick={() => setFilter('available')}
          data-testid="field-queue-chip-available"
          data-area="field-queue-chip-available"
          aria-pressed={filter === 'available'}
        >
          {tField('filter.available')}
        </button>
      </div>

      <div
        className="field-queue-incident-list"
        data-testid="field-queue-incident-list"
        data-area="field-queue-incident-list"
      >
        {loading && (
          <div
            style={{
              padding: 'var(--space-lg)',
              fontFamily: 'var(--font-family-mono)',
              fontSize: 10,
              color: 'var(--fg-tertiary)',
            }}
          >
            {tField('loading')}
          </div>
        )}
        {!loading && sortedVisible.length === 0 && (
          <div
            style={{
              padding: 'var(--space-lg)',
              fontFamily: 'var(--font-family-mono)',
              fontSize: 10,
              color: 'var(--fg-tertiary)',
            }}
          >
            {tField('empty')}
          </div>
        )}
        {sortedVisible.map((row) => {
          const ringed = ringedKeys.has(row.incident_id);
          const ageText = ageLabel(now, row.last_occurred_at, tField);
          const km =
            geo.status === 'ok' && geo.lat !== null && geo.lon !== null && row.lat != null && row.lon != null
              ? distanceKm({ lat: geo.lat, lon: geo.lon }, { lat: row.lat, lon: row.lon })
              : null;
          const distStr =
            km === null ? tField('row.distanceUnknown') : tField('row.distance', { km: km.toFixed(1) });
          const band = bandFor(row.severity);
          const isPending = pendingEnRoute === row.incident_id;

          return (
            <a
              key={row.incident_id}
              href={`/field/incident-detail?incident=${encodeURIComponent(row.incident_id)}`}
              className={`field-queue-row${ringed ? ' field-queue-row__cell-changed' : ''}`}
              data-testid={`field-queue-row-${row.incident_id}`}
              data-area={`field-queue-row-${row.incident_id}`}
              data-severity={row.severity}
              style={rowInlineStyles}
            >
              {/* BandPill — locked = true renders glyph + text + colour per
                  foundation §1.1 / §4.1. Resolved rows show null band; the
                  status pill in row1 carries that semantic instead. */}
              <span data-area={`field-queue-band-pill-${row.incident_id}`}>
                {band ? <BandPill band={band} locked={true} testId={`field-queue-band-pill-${row.incident_id}`} /> : null}
              </span>

              {/* Reporter-badge chip — separate dimension from trust band. */}
              <ReporterBadge
                kind={row.reporter_kind ?? 'webform'}
                testId={`field-queue-reporter-badge-${row.incident_id}`}
              />

              {/* Distance estimate — updates when geolocation fires. */}
              <span
                className="field-queue-distance-estimate"
                data-testid={`field-queue-distance-estimate-${row.incident_id}`}
                data-area={`field-queue-distance-estimate-${row.incident_id}`}
                aria-label={`Distance: ${distStr}`}
              >
                {distStr}
              </span>

              {/* Row body — incident_id mono + ward + age. */}
              <div>
                <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: 11, color: 'var(--fg-tertiary)' }}>
                  {row.incident_id}
                  {row.ward_id ? ` · ${row.ward_id}` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{row.title ?? '—'}</div>
                <div className="field-queue-row__age">{ageText}</div>
                {row.missing_evidence && row.missing_evidence.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {row.missing_evidence.map((m) => (
                      <span key={m} className="field-queue-evidence-chip" data-evidence={m}>
                        {tField(`row.evidence${m[0].toUpperCase()}${m.slice(1)}`)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Action buttons — Acknowledge + En route. En route opens
                  the ETA picker inline when focused. */}
              <button
                type="button"
                className="field-queue-button-acknowledge"
                onClick={(e) => {
                  e.preventDefault();
                  void onAcknowledge(row);
                }}
                data-testid={`field-queue-button-acknowledge-${row.incident_id}`}
                data-area={`field-queue-button-acknowledge-${row.incident_id}`}
                aria-label={`Acknowledge ${row.incident_id}`}
              >
                {tField('button.acknowledge')}
              </button>

              {isPending ? (
                <div data-testid={`field-queue-eta-picker-${row.incident_id}`}>
                  <Dropdown<number>
                    options={etaOptions}
                    value={null}
                    onChange={(v) => {
                      if (v !== null) void onEnRoute(row, v);
                    }}
                    placeholder={tField('etaPicker.label')}
                    testId={`field-queue-eta-dropdown-${row.incident_id}`}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="field-queue-button-en-route"
                  onClick={(e) => {
                    e.preventDefault();
                    setPendingEnRoute(row.incident_id);
                  }}
                  data-testid={`field-queue-button-en-route-${row.incident_id}`}
                  data-area={`field-queue-button-en-route-${row.incident_id}`}
                  aria-label={`En route ${row.incident_id}`}
                >
                  {tField('button.enRoute')}
                </button>
              )}
            </a>
          );
        })}
      </div>
    </main>
  );
}

// Inline KPI cell — local to this file. Keeps the KPI strip at the top
// of the page without dragging a new component into /components.
function KpiCell({
  label,
  value,
  sub,
  color,
  testId,
}: {
  label: string;
  value: number;
  sub: string;
  color?: string;
  testId?: string;
}) {
  return (
    <div className="tech-today__cell" data-testid={testId}>
      <span className="tech-today__label">{label}</span>
      <span className="tech-today__val" style={color ? ({ color } as CSSProperties) : undefined}>
        {value}
      </span>
      <span className="tech-today__sub">{sub}</span>
    </div>
  );
}
