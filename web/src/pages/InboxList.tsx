/** InboxList.tsx — FE-1.5b. Mirrors mockups/01-priya/inbox-list.html. */

import { useEffect, useMemo, useState } from 'react';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import { TopChrome } from '../components/layout/TopChrome';
import { Sidebar } from '../components/layout/Sidebar';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { InboxRow } from '../components/pages/InboxRow';
import { FilterChip } from '../components/pages/FilterChip';
import type { InboxRowFilter, InboxRow as InboxRowType } from '../types/inbox';
import { ContainerWidth } from '../types/domain';
import { type ChainEventLite, type RecentDecision, buildRows, countByFilter, mergeRecentDecisions } from './inboxListModel';
import { AwaitingActionRail, RecentDecisionsRail, SeverityRail } from './InboxRail';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: <span className="sidebar__icon" aria-hidden="true">D</span> },
  { label: 'Handover', href: '/handover', icon: <span className="sidebar__icon" aria-hidden="true">H</span> },
  { label: 'Inbox', href: '/inbox', icon: <span className="sidebar__icon" aria-hidden="true">I</span> },
  { label: 'Verify', href: '/verify-flow', icon: <span className="sidebar__icon" aria-hidden="true">V</span> },
  { label: 'Notices', href: '/notices', icon: <span className="sidebar__icon" aria-hidden="true">N</span> },
  { label: 'Sensors', href: '/sensors', icon: <span className="sidebar__icon" aria-hidden="true">S</span> },
  { label: 'Audit', href: '/audit-log', icon: <span className="sidebar__icon" aria-hidden="true">A</span> },
  { label: 'Settings', href: '/settings', icon: <span className="sidebar__icon" aria-hidden="true">·</span> },
];

export function InboxList() {
  const [rows, setRows] = useState<InboxRowType[]>([]);
  const [chainAge, setChainAge] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentDecision[]>([]);
  const [filter, setFilter] = useState<InboxRowFilter>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // (1) inbox rows — gated on chain head & recent fetches via separate effects
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/events?event_type=IncidentCreated&limit=100');
        const data = (await r.json()) as { events: ChainEventLite[] };

        setRows(buildRows(data.events));
      } catch (err) {
        console.error('[surakkha] inbox fetch failed', err);
        setRows([]);
      } finally { setLoading(false); }
    })();
  }, []);

  // (2) chain head age — gates TopChrome pulse
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/chain/head');

        if (!r.ok) return;
        const head = (await r.json()) as { ingested_at: string };
        const t = new Date(head.ingested_at).getTime();

        if (Number.isNaN(t)) return;
        setChainAge(Math.max(0, Math.round((Date.now() - t) / 100) / 10));
      } catch (err) { console.error('[surakkha] chain head fetch failed', err); }
    })();
  }, []);

  // (3) recent decisions — 4 parallel fetches via Promise.all
  useEffect(() => {
    void (async () => {
      try {
        const [b, e, c, r] = await Promise.all([
          fetch('/api/events?event_type=PublicNoticeIssued&limit=5').then((x) => x.json()) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=IncidentEscalated&limit=5').then((x) => x.json()) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=CouncillorEndorsementRecorded&limit=5').then((x) => x.json()) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=SignatureAttestation&limit=5').then((x) => x.json()) as Promise<{ events: ChainEventLite[] }>,
        ]);
        const merged: RecentDecision[] = mergeRecentDecisions(b.events, e.events, c.events, r.events);

        setRecent(merged);
      } catch (err) { console.error('[surakkha] recent fetch failed', err); setRecent([]); }
    })();
  }, []);

  const chipCounts = useMemo(() => countByFilter(rows), [rows]);
  const visibleRows = useMemo(() => rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'T3') return r.severity === 'T3';
    if (filter === 'sig') return r.isAwaitingSig;
    if (filter === 'drafts') return r.isDraft;
    if (filter === 'citizen') return r.isCitizen;
    // filter is `'resolved'` here — TS exhaustively narrowed via prior returns
    return r.status === 'chain_verify';
  }), [rows, filter]);
  const sevCounts = useMemo(() => {return {
    T3: rows.filter((r) => r.severity === 'T3').length,
    T2: rows.filter((r) => r.severity === 'T2').length,
    T1: rows.filter((r) => r.severity === 'T1').length,
    T0: rows.filter((r) => r.severity === 'T0').length,
  }}, [rows]);
  const allSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedRows.has(r.id));
  const toggleAll = () => {
    const next = new Set(selectedRows);

    if (allSelected) visibleRows.forEach((r) => next.delete(r.id)); else visibleRows.forEach((r) => next.add(r.id));
    setSelectedRows(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedRows);

    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedRows(next);
  };
  const total = Math.max(1, rows.length);

  return (
    <div className="app-shell">
      <Sidebar navItems={NAV} currentPath="/inbox" brand="SURAKKHA" />
      <div className="main">
        <TopChrome personaLabel="Priya · utility_operator" chainFreshSeconds={chainAge ?? undefined} />
        <Container width={ContainerWidth.Wide}>
          <div className="page-header">
            <div className="page-header__row">
              <div><h1>Inbox</h1>
                <div className="page-header__sub">{rows.length} threads · {chipCounts.T3} T3 broadcast · {chipCounts.sig} awaiting your sig</div></div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <Button variant="secondary" size="sm">Export queue</Button>
                <Button variant="primary" size="sm">New draft</Button>
              </div>
            </div>
          </div>
          <div className="inbox-toolbar">
            <div className="filter-chips" role="tablist" aria-label="Filter inbox">
              <FilterChip label="All" count={chipCounts.all} active={filter === 'all'} onClick={() => { setFilter('all'); }} />
              <FilterChip label="T3 urgent" count={chipCounts.T3} dotColor="var(--danger)" active={filter === 'T3'} onClick={() => { setFilter('T3'); }} />
              <FilterChip label="Awaiting sigs" count={chipCounts.sig} active={filter === 'sig'} onClick={() => { setFilter('sig'); }} />
              <FilterChip label="My drafts" count={chipCounts.drafts} active={filter === 'drafts'} onClick={() => { setFilter('drafts'); }} />
              <FilterChip label="Citizen reports" count={chipCounts.citizen} active={filter === 'citizen'} onClick={() => { setFilter('citizen'); }} />
              <FilterChip label="Resolved · today" count={chipCounts.resolved} active={filter === 'resolved'} onClick={() => { setFilter('resolved'); }} />
            </div>
            <div className="inbox-search"><span className="sidebar__icon" aria-hidden="true">⌕</span>
              <input type="search" className="inbox-search__input" placeholder="Search by ward, sensor, hash, or citizen name…" aria-label="Search inbox" /></div>
          </div>
          <div className="grid-12" style={{ marginTop: 'var(--space-md)' }}>
            <div className="col-8">
              <Card modifier="with-heading" testId="inbox-card">
                <div className="data-card__head" style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                  <h3 className="data-card__title">Action queue</h3>
                  <span className="data-card__meta">{visibleRows.length} · last updated {rows[0]?.timestamp ? new Date(rows[0].timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}</span>
                </div>
                {loading ? <div style={{ padding: 'var(--space-lg)', fontFamily: 'var(--font-family-mono)', fontSize: 10, color: 'var(--fg-tertiary)' }}>loading queue from chain…</div>
                  : rows.length === 0 ? <EmptyState icon={<span>○</span>} heading="No incidents" body="Chain unreachable — pull-to-refresh in Phase 2" />
                    : <table className="data-table data-table--inbox" style={{ width: '100%' }}>
                      <thead><tr>
                        <th className="col-check"><input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} /></th>
                        <th className="col-warn" aria-label="Severity" />
                        <th>Thread</th><th className="col-where">Where</th><th className="col-owner">Owner</th>
                        <th className="col-status">Severity</th><th className="col-action" />
                      </tr></thead>
                      <tbody>{visibleRows.map((r) => <InboxRow key={r.id} row={r} selected={selectedRows.has(r.id)} onToggle={() => { toggleOne(r.id); }} />)}</tbody>
                    </table>}
                <div className="inbox-bulkbar" hidden={selectedRows.size === 0}>
                  <span className="inbox-bulkbar__count"><strong>{selectedRows.size}</strong> selected</span>
                  <span className="inbox-bulkbar__count"><strong>{selectedRows.size}</strong> selected</span>
                  <div className="inbox-bulkbar__actions">
                    <Button variant="secondary" size="sm" disabled>Assign to me</Button>
                    <Button variant="secondary" size="sm" disabled>Mark reviewed</Button>
                    <Button variant="danger" size="sm" disabled>Archive</Button>
                  </div>
                </div>
              </Card>
              <div className="inbox-pager"><span className="inbox-pager__meta">{visibleRows.length} of {rows.length}</span></div>
            </div>
            <div className="col-4">
              <SeverityRail T3={sevCounts.T3} T2={sevCounts.T2} T1={sevCounts.T1} T0={sevCounts.T0} total={total} />
              <AwaitingActionRail rows={rows.filter((r) => r.isAwaitingSig)} />
              <RecentDecisionsRail recent={recent} />
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
