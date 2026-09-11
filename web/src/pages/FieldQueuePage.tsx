/**
 * FieldQueuePage.tsx — Story 1.2.
 *
 * React port of web/mockups/04-technician/work-queue.html.
 *
 * Data source: chain events of type `TechnicianAssigned` (active jobs) and
 * `IncidentResolved` (Karim-resolved jobs). The mock seed emits 5 events
 * for the demo (4 tech events + 1 IncidentResolved by Karim); the picker
 * renders what the chain actually has.
 *
 * Design tokens: every visual property is a CSS variable from
 * mockups/theme.css (already loaded by main.tsx). Component composition
 * lives in styles/tech.css + the Priya chrome at mockups/01-priya/dashboard.css.
 *
 * Post FE-1.6a:
 *   The page is rendered inside <AppLayout>, which owns the sidebar,
 *   top-chrome, logout button, and 5s chain-freshness poll. This file
 *   no longer fetches session or chain freshness — both come from
 *   useAppLayout(). The tech-sidebar__welcome strip (name + role) moved
 *   into the page header row so it lives with the page content rather
 *   than the chrome.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import '../styles/tech.css';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useDateFormatter } from '../hooks/useDateFormatter';

type Filter = 'all' | 'P1' | 'P2' | 'P3' | 'enroute' | 'onsite';

interface ChainEventLite {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
}

interface WorkOrderRow {
  id: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'enroute' | 'onsite' | 'assigned' | 'resolved';
  ticket: string;
  title: string;
  subtitle: string;
  timeLabel: string;
  timeVal: string;
  timeIsOverdue: boolean;
  isDone: boolean;
  isActive: boolean;
}

export function FieldQueuePage() {
  // Session comes from AppLayout; AppLayout already gates on
  // `role === 'field_technician'`. We only need the actor_ref to
  // filter the chain events to Karim's jobs.
  const { session } = useAppLayout();
  const { format: formatDateLocal } = useDateFormatter();
  const { t: tField } = useTranslation('fieldQueue');
  const technicianId = session.actor_ref;
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sortMode, setSortMode] = useState<'manual' | 'sla'>('manual');
  const [loading, setLoading] = useState(true);

  // 1. fetch chain events for Karim
  useEffect(() => {
    void (async () => {
      try {
        const [assigned, resolved] = await Promise.all([
          fetch('/api/events?event_type=TechnicianAssigned&limit=100').then((r) =>
            r.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=IncidentResolved&limit=100').then((r) =>
            r.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
        ]);

        setRows(buildRows(technicianId, assigned.events, resolved.events));
      } catch (err) {
        console.error('[surakkha] field queue fetch failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [technicianId]);

  // tech-sidebar__welcome moved here from the inline sidebar so the
  // persona greeting lives with the page content rather than the
  // chrome. AppLayout already shows the persona chip in top-chrome;
  // this strip gives the page header a more personal subtitle.
  const personaName = session.display_name.replace(' — Field Technician', '');
  const personaRole = tField('page.subtitleRole');

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === 'all') return true;
        if (filter === 'P1' || filter === 'P2' || filter === 'P3') return r.priority === filter;
        if (filter === 'enroute') return r.status === 'enroute';
        // filter is `'onsite'` here — TS exhaustively narrowed via prior returns
        return r.status === 'onsite';
      }),
    [rows, filter],
  );

  // SLA sort key: priority tier (P1=0 first), then overdue flag
  // (overdue → 0, on-track → 1), then status order (en route → on
  // site → assigned → resolved). Stable: Array#sort is stable per
  // ES2019, so ties preserve buildRows() arrival order.
  const slaSortKey = (r: WorkOrderRow): [number, number, number] => {
    const priorityRank =
      r.priority === 'P1' ? 0 : r.priority === 'P2' ? 1 : r.priority === 'P3' ? 2 : 3;
    const overdueRank = r.timeIsOverdue && !r.isDone ? 0 : 1;
    const statusRank =
      r.status === 'enroute'
        ? 0
        : r.status === 'onsite'
          ? 1
          : r.status === 'assigned'
            ? 2
            : 3;

    return [priorityRank, overdueRank, statusRank];
  };

  const sortedVisible = useMemo(() => {
    if (sortMode !== 'sla') return visible;
    return [...visible].sort((a, b) => {
      const ka = slaSortKey(a);
      const kb = slaSortKey(b);

      if (ka[0] !== kb[0]) return ka[0] - kb[0];
      if (ka[1] !== kb[1]) return ka[1] - kb[1];
      return ka[2] - kb[2];
    });
  }, [visible, sortMode]);

  const onOptimizeRoute = (): void => {
    setFilter('all');
    setSortMode('sla');
  };

  const chipCounts: Record<Filter, number> = {
    all: rows.length,
    P1: rows.filter((r) => r.priority === 'P1').length,
    P2: rows.filter((r) => r.priority === 'P2').length,
    P3: rows.filter((r) => r.priority === 'P3').length,
    enroute: rows.filter((r) => r.status === 'enroute').length,
    onsite: rows.filter((r) => r.status === 'onsite').length,
  };

  const chipFilterLabel: Record<Filter, string> = {
    all: tField('filters.all'),
    P1: tField('filters.P1'),
    P2: tField('filters.P2'),
    P3: tField('filters.P3'),
    enroute: tField('filters.enroute'),
    onsite: tField('filters.onsite'),
  };

  const today = new Date();
  const todayLabel = formatDateLocal('date-short', today);

  // Pre-FE-1.6a the page returned <div className="app-shell app-shell--tech">
  // with an inline <aside>, <header className="top-chrome">, and logout
  // button. Post FE-1.6a AppLayout owns the chrome; the page returns
  // only the page header + jobs.
  return (
    <main className="container--wide">
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{tField('page.title')}</h1>
            <div className="page-header__sub">
              {tField('page.subtitle', {
                name: personaName,
                role: personaRole,
                count: rows.length,
                date: todayLabel,
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="button button--secondary"
              type="button"
              disabled={sortMode === 'sla'}
              onClick={onOptimizeRoute}
              data-testid="field-optimize-route"
            >
              {tField('optimizeRoute')}
            </button>
          </div>
        </div>
        {sortMode === 'sla' && (
          <div className="page-header__sub" data-testid="field-optimized-subtitle">
            {tField('page.optimizedSubtitle')}
          </div>
        )}
      </div>

      <div className="tech-today">
        <div className="tech-today__cell">
          <span className="tech-today__label">{tField('today.todayLabel')}</span>
          <span className="tech-today__val">{rows.length}</span>
          <span className="tech-today__sub">
            {tField('today.remainingSuffix', { count: rows.filter((r) => !r.isDone).length })}
          </span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">{tField('today.inProgressLabel')}</span>
          <span className="tech-today__val">{chipCounts.enroute + chipCounts.onsite}</span>
          <span className="tech-today__sub">
            {chipCounts.enroute > 0
              ? tField('today.inProgressEnRoute', { count: chipCounts.enroute })
              : chipCounts.onsite > 0
                ? tField('today.inProgressOnSite', { count: chipCounts.onsite })
                : tField('today.inProgressEmDash')}
          </span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">{tField('today.overdueLabel')}</span>
          <span
            className="tech-today__val"
            style={{
              // Lockdown cascade 2026-09-11: overdue is operator-readable
              // (amber-bright), NOT alert-red-reserved.
              color: rows.some((r) => r.timeIsOverdue && !r.isDone) ? 'var(--color-amber-bright)' : undefined,
            }}
          >
            {rows.filter((r) => r.timeIsOverdue && !r.isDone).length}
          </span>
          <span className="tech-today__sub">
            {rows.find((r) => r.timeIsOverdue && !r.isDone)?.title ?? tField('today.inProgressEmDash')}
          </span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">{tField('today.closedLabel')}</span>
          <span className="tech-today__val">{rows.filter((r) => r.isDone).length}</span>
          <span className="tech-today__sub">{tField('today.closedAvgClose')}</span>
        </div>
      </div>

      <div className="tech-chips">
        {(Object.keys(chipFilterLabel) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`tech-chip${filter === f ? ' is-on' : ''}`}
            onClick={() => {
              setFilter(f);
            }}
          >
            {chipFilterLabel[f]} <span className="tech-chip__count">{chipCounts[f]}</span>
          </button>
        ))}
      </div>

      <div className="tech-jobs">
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
        {sortedVisible.map((r) => (
          <a
            key={r.id}
            href={`/field/incident-detail?work_order=${r.id}`}
            className={`tech-job${r.isActive ? ' is-active' : ''}${r.isDone ? ' is-done' : ''}`}
          >
            <span className={`tech-job__priority tech-job__priority--${r.priority.toLowerCase()}`}>
              {r.priority}
            </span>
            <div>
              <div className="tech-job__row1">
                <span className={`t-pill t-pill--${r.status}`}>
                  <span className="t-pill__dot"></span>
                  {pillLabel(tField, r.status)}
                </span>
                <span className="tech-job__ticket">{r.ticket}</span>
              </div>
              <p className="tech-job__title">{r.title}</p>
              <div className="tech-job__row2">{r.subtitle}</div>
            </div>
            <div className="tech-job__time">
              <div className="tech-job__time-label">{r.timeLabel}</div>
              <div className={`tech-job__time-val${r.timeIsOverdue ? ' is-overdue' : ''}`}>
                {r.timeVal}
              </div>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                color: r.isActive ? 'var(--color-primary)' : 'var(--fg-tertiary)',
              }}
            >
              {r.isDone ? '↗' : '→'}
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
// ────────────────────────────────────────────── helpers ──────────────
// pillLabel: localized status pill text. Returns the bare status label
// (e.g., "En route"); the time portion is appended separately by the
// caller when applicable. The `tField` argument is the parent's
// `useTranslation('fieldQueue')` so the label resolves in the active
// locale.
function pillLabel(tField: (k: string) => string, status: WorkOrderRow['status']): string {
  if (status === 'assigned') return tField('pill.assigned');
  if (status === 'enroute') return tField('pill.enroute');
  if (status === 'onsite') return tField('pill.onsite');
  // status is `'resolved'` here — TS exhaustively narrowed via prior returns
  return tField('pill.resolved');
}
function buildRows(
  technicianId: string,
  assigned: ChainEventLite[],
  resolved: ChainEventLite[],
): WorkOrderRow[] {
  const out: WorkOrderRow[] = [];

  // active jobs: TechnicianAssigned events where the technician matches
  for (const e of assigned) {
    const p = e.payload as {
      technician_id?: string;
      incident_id?: string;
      priority?: 'P1' | 'P2' | 'P3' | 'P4';
      eta_target_minutes?: number;
      work_order_summary?: string;
    };

    if (p.technician_id !== technicianId) continue;

    const priority = p.priority ?? 'P3';
    const summary = p.work_order_summary ?? '(no summary)';
    const ticket = `evt_${e.event_id.slice(-6)}`;
    const now = Date.now();
    const occurred = new Date(e.occurred_at).getTime();
    const ageMin = Math.round((now - occurred) / 60000);
    const overdue = ageMin > (p.eta_target_minutes ?? 30);

    out.push({
      id: e.event_id,
      priority,
      status: ageMin < 8 ? 'assigned' : 'enroute', // fresh dispatch = assigned; older = en route heuristic
      ticket,
      title: `Incident ${p.incident_id?.slice(-6) ?? '?'} — ${summary.split('—').pop()?.trim() ?? summary}`,
      subtitle: `priority ${priority} · ETA ${p.eta_target_minutes ?? '?'} min · ${ageMin}m since dispatch`,
      timeLabel: overdue ? 'SLA' : 'Window',
      timeVal: overdue ? `+${ageMin - (p.eta_target_minutes ?? 30)}m overdue` : `${ageMin}m ago`,
      timeIsOverdue: overdue,
      isDone: false,
      isActive: false,
    });
  }

  // resolved jobs: IncidentResolved events where the technician matches
  for (const e of resolved) {
    const p = e.payload as {
      technician_id?: string;
      fix_summary?: string;
      resolution_latency_seconds?: number;
    };

    if (p.technician_id !== technicianId) continue;

    const ticket = `evt_${e.event_id.slice(-6)}`;
    const minutes = Math.round((p.resolution_latency_seconds ?? 0) / 60);

    out.push({
      id: e.event_id,
      priority: 'P3', // resolved rows show ✓ instead of P#
      status: 'resolved',
      ticket,
      title: p.fix_summary?.split('—')[0]?.trim() ?? 'Resolved',
      subtitle: p.fix_summary ?? '',
      timeLabel: 'Closed',
      timeVal: minutes > 0 ? `${minutes} min` : '—',
      timeIsOverdue: false,
      isDone: true,
      isActive: false,
    });
  }

  // mark the first non-resolved row as active for the visual cue
  const firstActive = out.find((r) => !r.isDone);

  if (firstActive) firstActive.isActive = true;

  return out;
}
