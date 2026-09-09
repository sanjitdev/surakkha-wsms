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

import { useEffect, useState } from 'react';
import '../../mockups/01-priya/dashboard.css';
import '../styles/tech.css';
import { useAppLayout } from '../components/layout/AppLayoutContext';

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
  const technicianId = session.actor_ref;
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
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
  const personaRole = 'field tech · NE zone';

  const visible = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'P1' || filter === 'P2' || filter === 'P3') return r.priority === filter;
    if (filter === 'enroute') return r.status === 'enroute';
    // filter is `'onsite'` here — TS exhaustively narrowed via prior returns
    return r.status === 'onsite';
  });

  const chipCounts: Record<Filter, number> = {
    all: rows.length,
    P1: rows.filter((r) => r.priority === 'P1').length,
    P2: rows.filter((r) => r.priority === 'P2').length,
    P3: rows.filter((r) => r.priority === 'P3').length,
    enroute: rows.filter((r) => r.status === 'enroute').length,
    onsite: rows.filter((r) => r.status === 'onsite').length,
  };

  const chipFilterLabel: Record<Filter, string> = {
    all: 'All',
    P1: 'P1 critical',
    P2: 'P2',
    P3: 'P3',
    enroute: 'En route',
    onsite: 'On site',
  };

  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  // Pre-FE-1.6a the page returned <div className="app-shell app-shell--tech">
  // with an inline <aside>, <header className="top-chrome">, and logout
  // button. Post FE-1.6a AppLayout owns the chrome; the page returns
  // only the page header + jobs.
  return (
    <main className="container--wide">
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>Work queue</h1>
            <div className="page-header__sub">
              {personaName} · {personaRole} · {rows.length} jobs · {todayLabel} · 07:00–15:00
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="button button--secondary" type="button" disabled title="Phase 2">
              Optimize route
            </button>
          </div>
        </div>
      </div>

      <div className="tech-today">
        <div className="tech-today__cell">
          <span className="tech-today__label">Today</span>
          <span className="tech-today__val">{rows.length}</span>
          <span className="tech-today__sub">{rows.filter((r) => !r.isDone).length} remaining</span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">In progress</span>
          <span className="tech-today__val">{chipCounts.enroute + chipCounts.onsite}</span>
          <span className="tech-today__sub">
            {chipCounts.enroute > 0
              ? `${chipCounts.enroute} en route`
              : chipCounts.onsite > 0
                ? `${chipCounts.onsite} on site`
                : '—'}
          </span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">Overdue</span>
          <span
            className="tech-today__val"
            style={{
              color: rows.some((r) => r.timeIsOverdue && !r.isDone) ? 'var(--danger)' : undefined,
            }}
          >
            {rows.filter((r) => r.timeIsOverdue && !r.isDone).length}
          </span>
          <span className="tech-today__sub">
            {rows.find((r) => r.timeIsOverdue && !r.isDone)?.title ?? '—'}
          </span>
        </div>
        <div className="tech-today__cell">
          <span className="tech-today__label">Closed this week</span>
          <span className="tech-today__val">{rows.filter((r) => r.isDone).length}</span>
          <span className="tech-today__sub">avg close —</span>
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
            loading queue from chain…
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div
            style={{
              padding: 'var(--space-lg)',
              fontFamily: 'var(--font-family-mono)',
              fontSize: 10,
              color: 'var(--fg-tertiary)',
            }}
          >
            no jobs in this filter
          </div>
        )}
        {visible.map((r) => (
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
                  {pillLabel(r.status, r.timeVal)}
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
                color: r.isActive ? 'var(--brand-500)' : 'var(--fg-tertiary)',
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
function pillLabel(status: WorkOrderRow['status'], timeVal: string): string {
  if (status === 'assigned') return timeVal.endsWith('ago') ? `Assigned · ${timeVal}` : 'Assigned';
  if (status === 'enroute') return 'En route';
  if (status === 'onsite') return 'On site';
  // status is `'resolved'` here — TS exhaustively narrowed via prior returns
  return `Resolved · ${timeVal}`;
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
