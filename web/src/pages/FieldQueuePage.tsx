/**
 * FieldQueuePage.tsx — Story 1.2.
 *
 * React port of web/mockups/04-technician/work-queue.html. Reads the
 * IndexedDB session; if not a `field_technician`, redirects to the picker
 * (defense-in-depth — App.tsx already gates this, but a direct visit to
 * /field without auth should still be handled).
 *
 * Data source: chain events of type `TechnicianAssigned` (active jobs) and
 * `IncidentResolved` (Karim-resolved jobs). The mock seed emits 5 events
 * for the demo (4 tech events + 1 IncidentResolved by Karim); the picker
 * renders what the chain actually has.
 *
 * Design tokens: every visual property is a CSS variable from
 * mockups/theme.css (already loaded by main.tsx). Component composition
 * lives in styles/tech.css + the Priya chrome at mockups/01-priya/dashboard.css.
 */

import { useEffect, useState } from 'react';
import '../../mockups/01-priya/dashboard.css';
import '../styles/tech.css';
import { type SessionRow, getSession } from '../mocks/idb';

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
  const [session, setSession] = useState<SessionRow | null | undefined>(undefined);
  const [rows, setRows] = useState<WorkOrderRow[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [chainFresh, setChainFresh] = useState<number | null>(null);

  // 1. read session — if not Karim, redirect to login
  useEffect(() => {
    void (async () => {
      const row = await getSession();

      if (row?.role !== 'field_technician') {
        window.history.pushState({}, '', '/');
        window.location.reload();
        return;
      }
      setSession(row);
    })();
  }, []);

  // 2. fetch chain events when session is ready
  useEffect(() => {
    if (!session) return;
    void (async () => {
      try {
        const [assigned, resolved, head] = await Promise.all([
          fetch('/api/events?event_type=TechnicianAssigned&limit=100').then((r) => r.json()) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=IncidentResolved&limit=100').then((r) => r.json()) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/chain/head').then((r) => r.ok ? r.json() as Promise<{ ingested_at: string }> : null),
        ]);

        if (head) {
          const age = Math.max(0, Math.round((Date.now() - new Date(head.ingested_at).getTime()) / 100) / 10);

          setChainFresh(age);
        }
        setRows(buildRows(session.actor_ref, assigned.events, resolved.events));
      } catch (err) {
        console.error('[surakkha] field queue fetch failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  if (session === undefined) return null;

  // session === null is rare: only on the brief tick after the
  // session-loading effect fires with no Karim row. The effect
  // immediately does `window.location.reload()` so the user won't
  // see the null render — we just guard for type narrowing.
  if (session === null) return null;

  // After the above two guards, `session` is `SessionRow` (non-null).
  // Render-time derivation of the persona chip label. Mirrors the
  // mockup's "Karim · field tech · NE zone" string without forcing
  // a `chip_label` field onto SessionRow.
  const chipLabel = session.display_name.replace('Karim — Field Technician', 'Karim · field tech · NE zone');

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
  const todayLabel = today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="app-shell app-shell--tech">

      <aside className="sidebar">
        <a className="sidebar__brand" href="/field">SURAKKHA</a>
        <div className="tech-sidebar__welcome">
          <div className="tech-sidebar__name">{session.display_name.replace(' — Field Technician', '')}</div>
          <div className="tech-sidebar__role">field tech · NE zone</div>
        </div>
        <nav className="sidebar__nav">
          <a href="/field" className="sidebar__link active">
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </span>
            <span>Work queue</span>
          </a>
          <a href="/field/my-day" className="sidebar__link">
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </span>
            <span>My day</span>
          </a>
          <a href="/field/incident-detail" className="sidebar__link">
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            </span>
            <span>Incident detail</span>
          </a>
          <a href="/field/history" className="sidebar__link">
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="3 12 6 9 13 16 21 6"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </span>
            <span>History</span>
          </a>
        </nav>
        <div className="sidebar__foot">
          <button
            className="sidebar__logout"
            type="button"
            onClick={() => { void logout().then(() => { window.location.href = '/'; }); }}
          >
            <span className="sidebar__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="top-chrome">
          <div className="top-chrome__left">
            <span className="pulse-dot" aria-hidden="true"></span>
            <span>{chainFresh !== null ? `chain fresh · ${chainFresh.toFixed(1)}s ago` : 'chain · connecting…'}</span>
          </div>
          <div className="top-chrome__right">
            <span className="top-chrome__persona">{chipLabel}</span>
          </div>
        </header>

        <main className="container--wide">
          <div className="page-header">
            <div className="page-header__row">
              <div>
                <h1>Work queue</h1>
                <div className="page-header__sub">{rows.length} jobs · {todayLabel} · 07:00–15:00</div>
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
                {chipCounts.enroute > 0 ? `${chipCounts.enroute} en route` : chipCounts.onsite > 0 ? `${chipCounts.onsite} on site` : '—'}
              </span>
            </div>
            <div className="tech-today__cell">
              <span className="tech-today__label">Overdue</span>
              <span className="tech-today__val" style={{ color: rows.some((r) => r.timeIsOverdue && !r.isDone) ? 'var(--danger)' : undefined }}>
                {rows.filter((r) => r.timeIsOverdue && !r.isDone).length}
              </span>
              <span className="tech-today__sub">{rows.find((r) => r.timeIsOverdue && !r.isDone)?.title ?? '—'}</span>
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
                className={`tech-chip${ filter === f ? ' is-on' : ''}`}
                onClick={() => { setFilter(f); }}
              >
                {chipFilterLabel[f]} <span className="tech-chip__count">{chipCounts[f]}</span>
              </button>
            ))}
          </div>

          <div className="tech-jobs">
            {loading && (
              <div style={{ padding: 'var(--space-lg)', fontFamily: 'var(--font-family-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>
                loading queue from chain…
              </div>
            )}
            {!loading && visible.length === 0 && (
              <div style={{ padding: 'var(--space-lg)', fontFamily: 'var(--font-family-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>
                no jobs in this filter
              </div>
            )}
            {visible.map((r) => (
              <a key={r.id} href={`/field/incident-detail?work_order=${r.id}`} className={`tech-job${ r.isActive ? ' is-active' : '' }${r.isDone ? ' is-done' : ''}`}>
                <span className={`tech-job__priority tech-job__priority--${r.priority.toLowerCase()}`}>{r.priority}</span>
                <div>
                  <div className="tech-job__row1">
                    <span className={`t-pill t-pill--${r.status}`}><span className="t-pill__dot"></span>{pillLabel(r.status, r.timeVal)}</span>
                    <span className="tech-job__ticket">{r.ticket}</span>
                  </div>
                  <p className="tech-job__title">{r.title}</p>
                  <div className="tech-job__row2">{r.subtitle}</div>
                </div>
                <div className="tech-job__time">
                  <div className="tech-job__time-label">{r.timeLabel}</div>
                  <div className={`tech-job__time-val${ r.timeIsOverdue ? ' is-overdue' : ''}`}>{r.timeVal}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-family-mono)', color: r.isActive ? 'var(--brand-500)' : 'var(--fg-tertiary)' }}>{r.isDone ? '↗' : '→'}</span>
              </a>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────── helpers ──────────────
async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('[surakkha] logout failed', err);
  }
}
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
