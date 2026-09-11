/**
 * OperatorDashboard.tsx
 *
 * Surakkha Phase 1 — Priya's dashboard. React port of
 * web/mockups/01-priya/dashboard.html.
 *
 * - 3 layouts (A · grid / B · editorial / C · status-board) with the same
 *   localStorage-backed toggler the static mockup ships. Default = 'a'.
 * - 3 tabs (Overview / Sensors / Wards); arrow-key nav between tabs.
 * - Reads /api/incidents for KPI counts + thread rows, /api/sensors for the
 *   sensor fleet, /api/events for "Today on chain" timeline.
 * - Charts (Sensors tab + Wards tab) are SVG inline per the locked mockup —
 *   dim 5b §14 placement matrix: Sensors = 1× TimeSeriesLine + 1× Donut;
 *   Wards = 1× HorizontalBar. No chart library in Phase 1.
 *
 * Post FE-1.6a:
 *   - The page is rendered inside <AppLayout>, which owns the sidebar,
 *     top-chrome, logout button, and 5s chain-freshness poll. This file
 *     no longer fetches session or chain freshness — both come from
 *     useAppLayout().
 *   - The page renders ONLY the tab body (page-header + tabs +
 *     <main className="container--wide">). No .app-shell wrapper, no
 *     inline aside/top-chrome.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useIncidents } from '../hooks/useIncidents';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useNumberFormatter } from '../hooks/useNumberFormatter';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table.types';
import { FilterChip } from '../components/pages/FilterChip';
import type { IncidentSummary } from '../types/domain';

type Layout = 'a' | 'b' | 'c';
type Tab = 'overview' | 'sensors' | 'wards';

/**
 * Thread filter — operator-dashboard.md #7.
 *
 * Filter chip group above the Open threads table. The default is 'all';
 * picking a tier narrows the threads panel to incidents at that tier so
 * the operator can scan by trust-band without losing the global KPI
 * counts. Tier chips use the lockdown palette per operator-dashboard.md
 * #9/#10.
 */
type ThreadFilter = 'all' | 'T3' | 'T2' | 'T1' | 'T0';
type Severity = 'T3' | 'T2' | 'T1' | 'T0';
const THREAD_FILTERS: readonly ThreadFilter[] = ['all', 'T3', 'T2', 'T1', 'T0'];

interface SensorRow {
  sensor_id: string;
  ward_id: string;
  parameter: string;
  last_value: number;
  last_at: string;
}
interface ChainEventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  payload: Record<string, unknown>;
}
// ThreadRow is reserved for the planned threads-of-discussion panel;
// the panel itself ships in a follow-up story. Comment kept so the
// shape contract is preserved in the next iteration of this page.
// type ThreadRow { incident_id: string; ward_id?: string; severity: string; status: string; last_occurred_at: string; }

const LAYOUT_STORAGE_KEY = 'surakkha.layout';

export function OperatorDashboard() {
  // Session + chain freshness come from the AppLayout context. AppLayout
  // already gates on `role === 'utility_operator'` so by the time this
  // page renders, the role check is implicit.
  const { session } = useAppLayout();
  const { format: formatTime } = useDateFormatter();
  const { formatRelative } = useRelativeTime();
  const { format: formatNum } = useNumberFormatter();
  const { t: tDash } = useTranslation('operatorDashboard');
  const [layout, setLayout] = useState<Layout>('a');
  const [tab, setTab] = useState<Tab>('overview');
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>('all');
  const { incidents, loading: incLoading } = useIncidents();

  // incLoading is surfaced for future skeleton use; the page today renders
  // an empty `openIncidents` slice instead of a loading spinner so the
  // hook's flag is intentionally unused.
  void incLoading;

  const [sensors, setSensors] = useState<SensorRow[]>([]);
  const [recent, setRecent] = useState<ChainEventLite[]>([]);

  // 1. layout persistence — localStorage.surakkha.layout, default 'a'
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);

      if (saved === 'a' || saved === 'b' || saved === 'c') setLayout(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    } catch {
      /* ignore */
    }
  }, [layout]);

  // 2. data fetch — sensors + recent chain events only. Incidents come
  // from `useIncidents()` (Layer C) so the dashboard, inbox detail, and
  // any future incident consumer share a single fetch path.
  useEffect(() => {
    const cancelled = { current: false };

    void (async () => {
      try {
        const [senRes, evtRes] = await Promise.all([
          fetch('/api/sensors').then((r) => r.json()) as Promise<SensorRow[]>,
          fetch('/api/events?limit=20').then((r) => r.json()) as Promise<{
            events: ChainEventLite[];
          }>,
        ]);

        if (cancelled.current) return;
        setSensors(senRes);
        setRecent(evtRes.events);
      } catch (err) {
        console.error('[surakkha] dashboard fetch failed', err);
      }
    })();
    return () => {
      cancelled.current = true;
    };
  }, []);

  // Suppress unused-var for `session` — AppLayout guarantees it's the
  // utility_operator session, but reading it here keeps a stable hook
  // call ordering if a future story needs it for personalised KPIs.
  void session;

  // derive KPIs from incident list
  const openIncidents = incidents.filter((i) => i.status !== 'resolved');
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const noticesToday = recent.filter(
    (e) => e.event_type === 'PublicNoticeIssued' && e.occurred_at.startsWith(todayKey),
  ).length;
  const pendingSigs = recent.filter((e) => e.event_type === 'SignatureAttestation').length; // rough proxy
  const pHAvg = computePHAvg(sensors);

  // Thread filter chips — operator-dashboard.md #7.
  // Counts per tier drive the chip badge; the filtered slice drives the
  // table. 'all' means no filter (i.e., keep the original openIncidents
  // list but still cap at the visible row count).
  const threadCounts = useMemo(() => {
    const counts: Record<ThreadFilter, number> = {
      all: openIncidents.length,
      T3: 0,
      T2: 0,
      T1: 0,
      T0: 0,
    };

    for (const i of openIncidents) {
      const sev = i.severity as Severity;

      if (sev === 'T3' || sev === 'T2' || sev === 'T1' || sev === 'T0') {
        counts[sev] += 1;
      }
    }
    return counts;
  }, [openIncidents]);
  const filteredThreads = useMemo(() => {
    if (threadFilter === 'all') return openIncidents;
    return openIncidents.filter((i) => i.severity === threadFilter);
  }, [openIncidents, threadFilter]);
  // Per lockdown cascade 2026-09-11: chip dot color for T3 is amber-bright
  // (NOT alert-red — alert-red is reserved for the issuance path).
  const threadChipDotColor: Record<Exclude<ThreadFilter, 'all'>, string> = {
    T3: 'var(--color-amber-bright)',
    T2: 'var(--color-amber)',
    T1: 'var(--color-trust-t1)',
    T0: 'var(--color-divider)',
  };
  const threadChipLabelKey: Record<ThreadFilter, string> = {
    all: 'threads.filters.all',
    T3: 'threads.filters.t3',
    T2: 'threads.filters.t2',
    T1: 'threads.filters.t1',
    T0: 'threads.filters.t0',
  };

  // FE-B5b-migrate: column descriptors for the 3 dashboard tables. Each
  // preserves the original `<th>` class names + custom cell renderers
  // (severity dots, badges, action links) so the visual layout is identical
  // post-migration. Cards' `<thead>` is now owned by Table primitive.
  const sensorColumns: TableColumn<SensorRow>[] = useMemo(
    () => [
      {
        key: 'severity',
        header: '',
        className: 'col-warn',
        render: () => <span className="row-severity-dot" style={{ background: 'var(--warning)' }} />,
      },
      {
        key: 'sensor_id',
        header: tDash('sensors.table.colTitle'),
        className: 'col-title',
        render: (s: SensorRow) => (
          <>
            {s.ward_id} · <span className="mono">{s.sensor_id}</span>
          </>
        ),
      },
      { key: 'parameter', header: tDash('sensors.table.colIssue'), className: 'col-sensor' },
      {
        key: 'last_value',
        header: tDash('sensors.table.colReading'),
        className: 'col-value',
        render: (s: SensorRow) =>
          typeof s.last_value === 'number' ? s.last_value.toFixed(1) : String(s.last_value),
      },
      {
        key: 'last_at',
        header: tDash('sensors.table.colDetected'),
        className: 'col-time',
        render: (s: SensorRow) => formatTime('time', s.last_at),
      },
      {
        key: 'severity-badge',
        header: tDash('sensors.table.colSeverity'),
        className: 'col-status',
        render: () => <span className="badge badge--t2">{tDash('sensors.table.severityBadgeT2')}</span>,
      },
      {
        key: 'action',
        header: '',
        className: 'col-action',
        render: () => <a href="/sensors">{tDash('sensors.table.inspectAction')}</a>,
      },
    ],
    [formatTime, tDash],
  );

  const chainColumns: TableColumn<ChainEventLite>[] = useMemo(
    () => [
      {
        key: 'occurred_at',
        header: tDash('chain.table.colTime'),
        className: 'col-time',
        render: (e) => formatTime('time', e.occurred_at),
      },
      { key: 'event_type', header: tDash('chain.table.colWhat'), render: (e) => summarizeEvent(e, tDash) },
      {
        key: 'where',
        header: tDash('chain.table.colWhere'),
        render: (e) => (e.payload as { ward_id?: string }).ward_id ?? tDash('common.emDash'),
      },
      {
        key: 'status',
        header: tDash('chain.table.colStatus'),
        className: 'col-status',
        render: (e) => (
          <span className={`badge badge--${statusBadgeClass(e.event_type)}`}>
            {statusBadgeLabel(e.event_type, tDash)}
          </span>
        ),
      },
    ],
    [formatTime, tDash],
  );

  const threadColumns: TableColumn<IncidentSummary>[] = useMemo(
    () => [
      {
        key: 'severity-dot',
        header: '',
        className: 'col-warn',
        render: (i) => (
          <span
            className="row-severity-dot"
            style={{ background: severityColor(i.severity) }}
          />
        ),
      },
      {
        key: 'incident_id',
        header: tDash('threads.table.colThread'),
        render: (i) => tDash('threads.table.threadLabel', {
          ward: i.ward_id ?? tDash('common.emDash'),
        }),
      },
      {
        key: 'status',
        header: tDash('threads.table.colStatusBlocker'),
        render: (i) => i.status,
      },
      {
        key: 'last_occurred_at',
        header: tDash('threads.table.colOpened'),
        className: 'col-time',
        render: (i) => formatRelative(i.last_occurred_at),
      },
      {
        key: 'severity-badge',
        header: tDash('threads.table.colSeverity'),
        className: 'col-status',
        render: (i) => (
          <span className={`badge badge--${severityBadgeClass(i.severity)}`}>{i.severity}</span>
        ),
      },
      {
        key: 'action',
        header: '',
        className: 'col-action',
        render: () => <a href="/inbox">{tDash('threads.table.openAction')}</a>,
      },
    ],
    [formatRelative, tDash],
  );

  const threadColumnsCompact: TableColumn<IncidentSummary>[] = useMemo(
    () => [
      {
        key: 'severity-dot',
        header: '',
        className: 'col-warn',
        render: (i) => (
          <span
            className="row-severity-dot"
            style={{ background: severityColor(i.severity) }}
          />
        ),
      },
      {
        key: 'incident_id',
        header: tDash('threads.tableCompact.colThread'),
        render: (i) => tDash('threads.tableCompact.threadLabel', {
          ward: i.ward_id ?? tDash('common.emDash'),
        }),
      },
      {
        key: 'last_occurred_at',
        header: tDash('threads.tableCompact.colOpened'),
        className: 'col-time',
        render: (i) => formatRelative(i.last_occurred_at),
      },
      {
        key: 'severity-badge',
        header: tDash('threads.tableCompact.colSeverity'),
        className: 'col-status',
        render: (i) => (
          <span className={`badge badge--${severityBadgeClass(i.severity)}`}>{i.severity}</span>
        ),
      },
      {
        key: 'action',
        header: '',
        className: 'col-action',
        render: () => <a href="/inbox">{tDash('threads.tableCompact.openAction')}</a>,
      },
    ],
    [formatRelative, tDash],
  );

  const chainColumnsCompact: TableColumn<ChainEventLite>[] = useMemo(
    () => [
      {
        key: 'occurred_at',
        header: tDash('chain.tableCompact.colTime'),
        className: 'col-time',
        render: (e) => formatTime('time', e.occurred_at),
      },
      { key: 'event_type', header: tDash('chain.tableCompact.colWhat'), render: (e) => summarizeEvent(e, tDash) },
      {
        key: 'status',
        header: tDash('chain.tableCompact.colStatus'),
        className: 'col-status',
        render: (e) => (
          <span className={`badge badge--${statusBadgeClass(e.event_type)}`}>
            {statusBadgeLabel(e.event_type, tDash)}
          </span>
        ),
      },
    ],
    [formatTime, tDash],
  );

  // Pre-FE-1.6a the page returned <div className="app-shell"><aside
  // className="sidebar">...<header className="top-chrome">...</header>{children}.
  // Post FE-1.6a AppLayout owns the chrome, so the page returns only the
  // page header + tabs + main content.
  return (
    <>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{tDash('pageHeader.title')}</h1>
            <div className="page-header__sub">
              {tDash('pageHeader.subtitle', {
                count: openIncidents.length,
                unit: tDash(openIncidents.length === 1 ? 'pageHeader.subtitleUnit_one' : 'pageHeader.subtitleUnit_other'),
              })}{' '}
              {tDash('pageHeader.sensorsOnline', { count: sensors.length })}
            </div>
          </div>
          <div className="layout-toggle" role="radiogroup" aria-label={tDash('layoutToggle.ariaLabel')}>
            {(['a', 'b', 'c'] as Layout[]).map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={layout === opt}
                className={`layout-toggle__btn${layout === opt ? ' is-active' : ''}`}
                onClick={() => {
                  setLayout(opt);
                }}
              >
                {opt.toUpperCase()} ·{' '}
                {opt === 'a'
                  ? tDash('layoutToggle.optionA')
                  : opt === 'b'
                    ? tDash('layoutToggle.optionB')
                    : tDash('layoutToggle.optionC')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label={tDash('tabs.ariaLabel')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          className={`tab${tab === 'overview' ? ' active' : ''}`}
          onClick={() => {
            setTab('overview');
          }}
        >
          {tDash('tabs.overview')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'sensors'}
          className={`tab${tab === 'sensors' ? ' active' : ''}`}
          onClick={() => {
            setTab('sensors');
          }}
        >
          {tDash('tabs.sensors')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'wards'}
          className={`tab${tab === 'wards' ? ' active' : ''}`}
          onClick={() => {
            setTab('wards');
          }}
        >
          {tDash('tabs.wards')}
        </button>
      </div>

      <main className="container--wide" data-layout={layout}>
        {/* ── TAB: OVERVIEW ── */}
        <section
          className={`tab-panel${tab === 'overview' ? ' active' : ''}`}
          data-tab="overview"
          role="tabpanel"
          hidden={tab !== 'overview'}
        >
          {/* Variant A — Dense grid */}
          <div data-layout-only="a" hidden={layout !== 'a'}>
            <div className="kpi-row">
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.activeIncidents.label')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(openIncidents.length)}
                  <span className="kpi__unit">{tDash('kpi.activeIncidents.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.phAvg.label')}</span>
                </div>
                <div className="kpi__value">
                  {pHAvg !== null ? pHAvg.toFixed(1) : tDash('common.emDash')}
                  <span className="kpi__unit">{tDash('kpi.phAvg.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.responseTime.label')}</span>
                </div>
                <div className="kpi__value">
                  2.4<span className="kpi__unit">{tDash('kpi.responseTime.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.pendingSignatures.label')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(pendingSigs)}
                  <span className="kpi__unit">{tDash('kpi.pendingSignatures.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.noticesIssued.label')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(noticesToday)}
                  <span className="kpi__unit">{tDash('kpi.noticesIssued.unit')}</span>
                </div>
              </div>
            </div>

            <div className="dense-row">
              <div className="card data-card">
                <div className="data-card__head">
                  <h3 className="data-card__title">{tDash('sensors.cardTitle')}</h3>
                </div>
                <Table<SensorRow>
                  columns={sensorColumns}
                  rows={sensors.slice(0, 4)}
                  rowKey="sensor_id"
                  testId="table-sensors"
                  className="data-table"
                />
              </div>

              <div className="card data-card">
                <div className="data-card__head">
                  <h3 className="data-card__title">{tDash('chain.cardTitle')}</h3>
                </div>
                <Table<ChainEventLite>
                  columns={chainColumns}
                  rows={recent.slice(0, 6)}
                  rowKey="event_id"
                  testId="table-chain"
                  className="data-table"
                />
              </div>
            </div>

            <div className="dense-foot">
              <div className="card data-card">
                <div
                  className="data-card__head"
                  style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                  }}
                >
                  <h3 className="data-card__title">{tDash('threads.cardTitle')}</h3>
                  {/* Thread filter chips — operator-dashboard.md #7 */}
                  <div
                    className="filter-chips"
                    role="tablist"
                    aria-label={tDash('threads.filters.ariaLabel')}
                    data-testid="dashboard-thread-filters"
                    style={{ marginTop: 'var(--space-xs)' }}
                  >
                    {THREAD_FILTERS.map((f) => (
                      <FilterChip
                        key={f}
                        label={`${tDash(threadChipLabelKey[f])} ${threadCounts[f]}`}
                        active={threadFilter === f}
                        dotColor={f === 'all' ? undefined : threadChipDotColor[f]}
                        onClick={() => {
                          setThreadFilter(f);
                        }}
                        testId={`dashboard-thread-chip-${f.toLowerCase()}`}
                      />
                    ))}
                  </div>
                </div>
                <Table<IncidentSummary>
                  columns={threadColumns}
                  rows={filteredThreads.slice(0, 3)}
                  rowKey="incident_id"
                  testId="table-threads"
                  className="data-table"
                />
              </div>
            </div>
          </div>

          {/* Variant B — Editorial */}
          <div data-layout-only="b" hidden={layout !== 'b'}>
            <div className="editorial-hero">
              <div className="card handover-card kpi--hero">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.activeIncidents.label')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(openIncidents.length)}
                  <span className="kpi__unit">{tDash('kpi.activeIncidents.unit')}</span>
                </div>
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <a className="handover-list__action" href="/inbox">
                    {tDash('editorial.triageAll')}
                  </a>
                </div>
              </div>
              <div className="card data-card">
                <div className="data-card__head">
                  <h3 className="data-card__title">{tDash('chain.cardTitle')}</h3>
                </div>
                <Table<ChainEventLite>
                  columns={chainColumns}
                  rows={recent.slice(0, 6)}
                  rowKey="event_id"
                  testId="table-chain"
                  className="data-table"
                />
              </div>
            </div>
            <p className="section-label">{tDash('editorial.sectionLabel')}</p>
            <div className="editorial-second">
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.phAvg.label')}</span>
                </div>
                <div className="kpi__value">
                  {pHAvg !== null ? pHAvg.toFixed(1) : tDash('common.emDash')}
                  <span className="kpi__unit">{tDash('kpi.phAvg.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.responseTime.label')}</span>
                </div>
                <div className="kpi__value">
                  2.4<span className="kpi__unit">{tDash('kpi.responseTime.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.pendingSignatures.shortLabel')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(pendingSigs)}
                  <span className="kpi__unit">{tDash('kpi.pendingSignatures.unit')}</span>
                </div>
              </div>
              <div className="kpi">
                <div className="kpi__head">
                  <span className="kpi__label">{tDash('kpi.noticesIssued.label')}</span>
                </div>
                <div className="kpi__value">
                  {formatNum(noticesToday)}
                  <span className="kpi__unit">{tDash('kpi.noticesIssued.unit')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Variant C — Status-board */}
          <div data-layout-only="c" className="status-board" hidden={layout !== 'c'}>
            <div className="kpi-strip">
              <div className="kpi-strip__cell kpi">
                <div className="kpi__label">{tDash('kpi.activeIncidents.label')}</div>
                <div className="kpi__value">
                  {formatNum(openIncidents.length)}
                  <span className="kpi__unit">{tDash('kpi.activeIncidents.unit')}</span>
                </div>
              </div>
              <div className="kpi-strip__cell kpi">
                <div className="kpi__label">{tDash('kpi.phAvg.label')}</div>
                <div className="kpi__value">
                  {pHAvg !== null ? pHAvg.toFixed(1) : tDash('common.emDash')}
                  <span className="kpi__unit">{tDash('kpi.phAvg.unit')}</span>
                </div>
              </div>
              <div className="kpi-strip__cell kpi">
                <div className="kpi__label">{tDash('kpi.responseTime.label')}</div>
                <div className="kpi__value">
                  2.4<span className="kpi__unit">{tDash('kpi.responseTime.unit')}</span>
                </div>
              </div>
              <div className="kpi-strip__cell kpi">
                <div className="kpi__label">{tDash('kpi.pendingSignatures.shortLabel')}</div>
                <div className="kpi__value">
                  {formatNum(pendingSigs)}
                  <span className="kpi__unit">{tDash('kpi.pendingSignatures.unit')}</span>
                </div>
              </div>
              <div className="kpi-strip__cell kpi">
                <div className="kpi__label">{tDash('kpi.noticesIssued.label')}</div>
                <div className="kpi__value">
                  {formatNum(noticesToday)}
                  <span className="kpi__unit">{tDash('kpi.noticesIssued.unit')}</span>
                </div>
              </div>
            </div>
            <div className="split-pane">
              <div className="card data-card">
                <div className="data-card__head">
                  <h3 className="data-card__title">{tDash('sensors.cardTitle')}</h3>
                </div>
                <Table<SensorRow>
                  columns={sensorColumns}
                  rows={sensors.slice(0, 4)}
                  rowKey="sensor_id"
                  testId="table-sensors"
                  className="data-table"
                />
              </div>
              <div className="right-rail">
                <div className="card data-card">
                  <div
                    className="data-card__head"
                    style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-sm)',
                    }}
                  >
                    <h3 className="data-card__title">{tDash('threads.cardTitle')}</h3>
                    <div
                      className="filter-chips"
                      role="tablist"
                      aria-label={tDash('threads.filters.ariaLabel')}
                      data-testid="dashboard-thread-filters-b"
                      style={{ marginTop: 'var(--space-xs)' }}
                    >
                      {THREAD_FILTERS.map((f) => (
                        <FilterChip
                          key={f}
                          label={`${tDash(threadChipLabelKey[f])} ${threadCounts[f]}`}
                          active={threadFilter === f}
                          dotColor={f === 'all' ? undefined : threadChipDotColor[f]}
                          onClick={() => {
                            setThreadFilter(f);
                          }}
                          testId={`dashboard-thread-chip-b-${f.toLowerCase()}`}
                        />
                      ))}
                    </div>
                  </div>
                  <Table<IncidentSummary>
                    columns={threadColumnsCompact}
                    rows={filteredThreads.slice(0, 3)}
                    rowKey="incident_id"
                    testId="table-threads"
                    className="data-table"
                  />
                </div>
                <div className="card data-card">
                  <div className="data-card__head">
                    <h3 className="data-card__title">{tDash('chain.cardTitle')}</h3>
                  </div>
                  <Table<ChainEventLite>
                    columns={chainColumnsCompact}
                    rows={recent.slice(0, 6)}
                    rowKey="event_id"
                    testId="table-chain"
                    className="data-table"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TAB: SENSORS ── */}
        <section
          className="tab-panel"
          data-tab="sensors"
          role="tabpanel"
          hidden={tab !== 'sensors'}
        >
          <div className="grid-12">
            <div className="col-8">
              <div className="chart-card">
                <div className="chart-card__head">
                  <h3 className="chart-card__title">{tDash('sensors.historyChart.title')}</h3>
                  <span className="chart-card__meta">
                    {tDash('sensors.historyChart.meta', { count: sensors.length })}
                  </span>
                </div>
                <div className="chart-card__body">
                  <svg
                    viewBox="0 0 800 220"
                    width="100%"
                    height="100%"
                    aria-label={tDash('sensors.historyChart.ariaLabel')}
                  >
                    <g stroke="var(--border-subtle)" strokeWidth="1">
                      <line x1="0" y1="40" x2="800" y2="40" />
                      <line x1="0" y1="100" x2="800" y2="100" />
                      <line x1="0" y1="160" x2="800" y2="160" />
                    </g>
                    <g fontFamily="var(--font-family-mono)" fontSize="10" fill="var(--fg-tertiary)">
                      <text x="0" y="218">
                        {tDash('sensors.historyChart.axis.0')}
                      </text>
                      <text x="200" y="218">
                        {tDash('sensors.historyChart.axis.6')}
                      </text>
                      <text x="400" y="218">
                        {tDash('sensors.historyChart.axis.12')}
                      </text>
                      <text x="600" y="218">
                        {tDash('sensors.historyChart.axis.18')}
                      </text>
                      <text x="775" y="218" textAnchor="end">
                        {tDash('sensors.historyChart.axis.now')}
                      </text>
                    </g>
                    <path
                      d="M0,160 L100,155 L200,148 L300,140 L400,130 L500,118 L600,100 L700,82 L800,68"
                      fill="none"
                      stroke="var(--brand-500)"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,170 L100,168 L200,165 L300,162 L400,160 L500,160 L600,162 L700,165 L800,168"
                      fill="none"
                      stroke="var(--success)"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,180 L100,178 L200,180 L300,176 L400,178 L500,180 L600,176 L700,178 L800,180"
                      fill="none"
                      stroke="var(--warning)"
                      strokeWidth="2"
                    />
                    <g
                      fontFamily="var(--font-family-sans)"
                      fontSize="11"
                      fill="var(--fg-secondary)"
                    >
                      <rect x="640" y="10" width="12" height="3" fill="var(--brand-500)" />
                      <text x="656" y="14">
                        {tDash('sensors.historyChart.legend.ph')}
                      </text>
                      <rect x="640" y="22" width="12" height="3" fill="var(--success)" />
                      <text x="656" y="26">
                        {tDash('sensors.historyChart.legend.chlorine')}
                      </text>
                      <rect x="720" y="22" width="12" height="3" fill="var(--warning)" />
                      <text x="736" y="26">
                        {tDash('sensors.historyChart.legend.turbidity')}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div className="chart-card">
                <div className="chart-card__head">
                  <h3 className="chart-card__title">{tDash('sensors.bandDistribution.title')}</h3>
                  <span className="chart-card__meta">{tDash('sensors.bandDistribution.meta')}</span>
                </div>
                <div className="chart-card__body donut-body">
                  <svg
                    viewBox="0 0 200 200"
                    width="180"
                    height="180"
                    aria-label={tDash('sensors.bandDistribution.ariaLabel')}
                  >
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="var(--band-low)"
                      strokeWidth="32"
                      strokeDasharray="254.5 439.8"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="var(--band-medium)"
                      strokeWidth="32"
                      strokeDasharray="79.2 615.1"
                      strokeDashoffset="-254.5"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="var(--band-high)"
                      strokeWidth="32"
                      strokeDasharray="105.6 588.7"
                      strokeDashoffset="-333.7"
                      transform="rotate(-90 100 100)"
                    />
                    <text
                      x="100"
                      y="96"
                      textAnchor="middle"
                      fontSize="var(--font-size-display)"
                      fontWeight="var(--font-weight-bold)"
                      fill="var(--fg-default)"
                      fontFamily="var(--font-family-sans)"
                    >
                      {recent.length * 12}
                    </text>
                    <text
                      x="100"
                      y="118"
                      textAnchor="middle"
                      fontSize="var(--font-size-xs)"
                      fill="var(--fg-tertiary)"
                      fontFamily="var(--font-family-sans)"
                    >
                      {tDash('sensors.bandDistribution.totalLabel')}
                    </text>
                  </svg>
                </div>
                <div className="donut-legend">
                  <span>
                    <span
                      className="donut-legend__dot"
                      style={{ background: 'var(--band-high)' }}
                    ></span>
                    {tDash('sensors.bandDistribution.legend.high')}
                  </span>
                  <span>
                    <span
                      className="donut-legend__dot"
                      style={{ background: 'var(--band-medium)' }}
                    ></span>
                    {tDash('sensors.bandDistribution.legend.medium')}
                  </span>
                  <span>
                    <span
                      className="donut-legend__dot"
                      style={{ background: 'var(--band-low)' }}
                    ></span>
                    {tDash('sensors.bandDistribution.legend.low')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TAB: WARDS ── */}
        <section className="tab-panel" data-tab="wards" role="tabpanel" hidden={tab !== 'wards'}>
          <div className="grid-12">
            <div className="col-12">
              <div className="chart-card">
                <div className="chart-card__head">
                  <h3 className="chart-card__title">{tDash('wards.chart.title')}</h3>
                  <span className="chart-card__meta">{tDash('wards.chart.meta')}</span>
                </div>
                <div className="chart-card__body chart-card__body--auto">
                  <WardRanking incidents={incidents} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
function computePHAvg(sensors: SensorRow[]): number | null {
  const ph = sensors.filter(
    (s) => s.parameter.toLowerCase() === 'ph' && typeof s.last_value === 'number',
  );

  if (ph.length === 0) return null;
  return ph.reduce((sum, s) => sum + s.last_value, 0) / ph.length;
}
function summarizeEvent(e: ChainEventLite, t: (k: string, opts?: Record<string, unknown>) => string): string {
  switch (e.event_type) {
    case 'SensorReadingSubmitted':
      return t('chain.eventTypes.sensorReading', {
        parameter: (e.payload as { parameter?: string }).parameter ?? t('common.emDash'),
      });
    case 'AnjaliReportSubmitted':
      return t('chain.eventTypes.anjaliReport');
    case 'IncidentCreated':
      return t('chain.eventTypes.incidentCreated');
    case 'IncidentEscalated':
      return t('chain.eventTypes.incidentEscalated');
    case 'IncidentResolved':
      return t('chain.eventTypes.incidentResolved');
    case 'PublicNoticeIssued':
      return t('chain.eventTypes.publicNoticeIssued');
    case 'PublicNoticeRetracted':
      return t('chain.eventTypes.publicNoticeRetracted');
    case 'SignatureAttestation':
      return t('chain.eventTypes.signatureAttestation');
    case 'OperatorAuthenticated':
      return t('chain.eventTypes.operatorAuthenticated');
    case 'OperatorAccessLogged':
      return t('chain.eventTypes.operatorAccessLogged');
    case 'PlaybookStepExecuted':
      return t('chain.eventTypes.playbookStepExecuted');
    case 'DeviationCaptured':
      return t('chain.eventTypes.deviationCaptured');
    case 'SensorSilenceObserved':
      return t('chain.eventTypes.sensorSilenceObserved');
    case 'ChainVerificationFailed':
      return t('chain.eventTypes.chainVerificationFailed');
    case 'TechnicianAssigned':
      return t('chain.eventTypes.technicianAssigned');
    case 'TechnicianArrived':
      return t('chain.eventTypes.technicianArrived');
    case 'DiagnosisSubmitted':
      return t('chain.eventTypes.diagnosisSubmitted');
    case 'FixSubmitted':
      return t('chain.eventTypes.fixSubmitted');
    default:
      return e.event_type.replace(/([A-Z])/g, ' $1').trim();
  }
}
function statusBadgeClass(eventType: string): string {
  if (
    eventType.includes('Resolved') ||
    eventType.includes('Issued') ||
    eventType.includes('Acknowledge')
  )
    return 'resolved';
  if (
    eventType.includes('Escalated') ||
    eventType === 'ChainVerificationFailed' ||
    eventType === 'DeviationCaptured'
  )
    return 't3';
  if (
    eventType.includes('Report') ||
    eventType === 'OperatorAuthenticated' ||
    eventType === 'OperatorAccessLogged' ||
    eventType === 'SignatureAttestation' ||
    eventType === 'TechnicianAssigned'
  )
    return 'tier';
  if (eventType === 'PlaybookStepExecuted') return 'tier';
  return 't1';
}
function statusBadgeLabel(
  eventType: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  if (eventType.includes('Resolved') || eventType.includes('Retracted')) return t('chain.badge.done');
  if (eventType.includes('Notice') || eventType.includes('Acknowledge')) return t('chain.badge.broadcast');
  if (eventType.includes('Escalated')) return t('chain.badge.esc');
  if (eventType === 'ChainVerificationFailed' || eventType === 'DeviationCaptured') return t('chain.badge.err');
  if (eventType.includes('Report')) return t('chain.badge.inbox');
  if (eventType === 'OperatorAuthenticated' || eventType === 'OperatorAccessLogged') return t('chain.badge.auth');
  if (eventType === 'SignatureAttestation') return t('chain.badge.signed');
  if (eventType === 'PlaybookStepExecuted') return t('chain.badge.exec');
  if (eventType.includes('Reading')) return t('chain.badge.data');
  if (eventType === 'TechnicianAssigned') return t('chain.badge.dispatch');
  if (eventType === 'TechnicianArrived') return t('chain.badge.onsite');
  if (eventType === 'DiagnosisSubmitted') return t('chain.badge.diag');
  if (eventType === 'FixSubmitted') return t('chain.badge.fix');
  return eventType
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
}
function severityColor(sev: string): string {
  if (sev === 'T3' || sev === 't3') return 'var(--danger)';
  if (sev === 'T2' || sev === 't2') return 'var(--warning)';
  if (sev === 'T1' || sev === 't1') return 'var(--info)';
  return 'var(--fg-tertiary)';
}
function severityBadgeClass(sev: string): string {
  if (sev === 'T3' || sev === 't3') return 't3';
  if (sev === 'T2' || sev === 't2') return 't2';
  if (sev === 'T1' || sev === 't1') return 't1';
  return 'tier';
}
// Renders the dim 5b §14 HorizontalBar chart for the Wards tab.
// Synthesises a ranking from incident data so the chart populates with
// whatever the chain has — falls back to the locked static layout if
// no incidents are reported yet.
function WardRanking({ incidents }: { incidents: IncidentSummary[] }) {
  const { t: tDash } = useTranslation('operatorDashboard');
  // group incidents by ward_id and count by severity
  const byWard = new Map<string, { count: number; weighted: number }>();

  for (const i of incidents) {
    const w = i.ward_id ?? 'unknown';
    const prev = byWard.get(w) ?? { count: 0, weighted: 0 };
    const weight = i.severity === 'T3' ? 3 : i.severity === 'T2' ? 2 : 1;

    byWard.set(w, { count: prev.count + 1, weighted: prev.weighted + weight });
  }

  const ranked = Array.from(byWard.entries())
    .map(([ward, { count, weighted }]) => {
      return { ward, count, score: weighted };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (ranked.length === 0) {
    // empty-state falls back to the 6-row locked layout from the mockup
    return (
      <>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.dhanmondi')}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: '78%', background: 'var(--danger)' }}></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.dhanmondiValue')}</span>
        </div>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.mirpur')}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: '62%', background: 'var(--warning)' }}></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.mirpurValue')}</span>
        </div>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.uttara')}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: '48%', background: 'var(--warning)' }}></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.uttaraValue')}</span>
        </div>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.mohammadpur')}</span>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{ width: '36%', background: 'var(--band-medium)' }}
            ></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.mohammadpurValue')}</span>
        </div>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.tejgaon')}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: '24%', background: 'var(--success)' }}></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.tejgaonValue')}</span>
        </div>
        <div className="hbar-row">
          <span className="hbar-label">{tDash('wards.fallback.gulshan')}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: '18%', background: 'var(--success)' }}></div>
          </div>
          <span className="mono hbar-value">{tDash('wards.fallback.gulshanValue')}</span>
        </div>
      </>
    );
  }

  const max = ranked[0]?.score ?? 1;

  return (
    <>
      {ranked.map((r) => {
        const width = Math.round((r.score / max) * 78);
        const bg =
          r.score >= max * 0.66
            ? 'var(--danger)'
            : r.score >= max * 0.33
              ? 'var(--warning)'
              : 'var(--success)';

        return (
          <div key={r.ward} className="hbar-row">
            <span className="hbar-label">{r.ward}</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: `${width}%`, background: bg }}></div>
            </div>
            <span className="mono hbar-value">
              {tDash('wards.row.count', {
                count: r.count,
                unit: tDash(r.count === 1 ? 'wards.row.unit_one' : 'wards.row.unit_other'),
              })}
            </span>
          </div>
        );
      })}
    </>
  );
}
