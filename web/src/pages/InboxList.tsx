/**
 * InboxList.tsx — FE-1.5b. Mirrors mockups/01-priya/inbox-list.html.
 *
 * Post FE-1.6a:
 *   The page is rendered inside <AppLayout>, which owns the sidebar,
 *   top-chrome, logout button, and 5s chain-freshness poll. This file
 *   no longer fetches chain freshness or renders the chrome — both are
 *   consumed via useAppLayout() and the parent layout route.
 *
 *   The page returns a <Container> directly, no .app-shell wrapper.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table.types';
import { FilterChip } from '../components/pages/FilterChip';
import type { InboxRowFilter, InboxRow as InboxRowType } from '../types/inbox';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useIncidentActions } from '../hooks/useIncidentActions';
import {
  type ChainEventLite,
  type RecentDecision,
  buildRows,
  countByFilter,
  mergeRecentDecisions,
} from './inboxListModel';
import { AwaitingActionRail, RecentDecisionsRail, SeverityRail } from './InboxRail';

export function InboxList() {
  const { format: formatTime, locale } = useDateFormatter();
  const { t: tInbox } = useTranslation('inboxList');
  const actions = useIncidentActions();
  const [rows, setRows] = useState<InboxRowType[]>([]);
  const [recent, setRecent] = useState<RecentDecision[]>([]);
  const [filter, setFilter] = useState<InboxRowFilter>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // (1) inbox rows — gated on chain head & recent fetches via separate effects
  // refetchRows is pulled out so the bulk-bar Mark-reviewed CTA can call it
  // after a successful SignatureAttestation chain write to refresh the table
  // + AwaitingActionRail (each review drops isAwaitingSig to false).
  const refetchRows = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch('/api/events?event_type=IncidentCreated&limit=100');
      const data = (await r.json()) as { events: ChainEventLite[] };

      setRows(buildRows(data.events));
    } catch (err) {
      console.error('[surakkha] inbox fetch failed', err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchRows();
  }, [refetchRows]);

  // (2) recent decisions — 4 parallel fetches via Promise.all
  // Chain freshness polling moved to AppLayout (single source of truth).
  // Re-fetches when `locale` changes so the rail re-renders in the active
  // locale immediately after the user toggles /settings.
  useEffect(() => {
    void (async () => {
      try {
        const [b, e, c, r] = await Promise.all([
          fetch('/api/events?event_type=PublicNoticeIssued&limit=5').then((x) =>
            x.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=IncidentEscalated&limit=5').then((x) =>
            x.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=CouncillorEndorsementRecorded&limit=5').then((x) =>
            x.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
          fetch('/api/events?event_type=SignatureAttestation&limit=5').then((x) =>
            x.json(),
          ) as Promise<{ events: ChainEventLite[] }>,
        ]);
        const merged: RecentDecision[] = mergeRecentDecisions(
          locale,
          b.events,
          e.events,
          c.events,
          r.events,
        );

        setRecent(merged);
      } catch (err) {
        console.error('[surakkha] recent fetch failed', err);
        setRecent([]);
      }
    })();
  }, [locale]);

  const chipCounts = useMemo(() => countByFilter(rows), [rows]);
  const visibleRows = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === 'all') return true;
        if (filter === 'T3') return r.severity === 'T3';
        if (filter === 'sig') return r.isAwaitingSig;
        if (filter === 'drafts') return r.isDraft;
        if (filter === 'citizen') return r.isCitizen;
        // filter is `'resolved'` here — TS exhaustively narrowed via prior returns
        return r.status === 'chain_verify';
      }),
    [rows, filter],
  );
  const sevCounts = useMemo(() => {
    return {
      T3: rows.filter((r) => r.severity === 'T3').length,
      T2: rows.filter((r) => r.severity === 'T2').length,
      T1: rows.filter((r) => r.severity === 'T1').length,
      T0: rows.filter((r) => r.severity === 'T0').length,
    };
  }, [rows]);
  const total = Math.max(1, rows.length);

  // Bulk-bar Mark-reviewed CTA handler. F1's markReviewed posts one
  // SignatureAttestation(action: reviewed_by_operator) per selected
  // incident; on success we clear the selection + refetch the inbox
  // so each row drops out of AwaitingActionRail (isAwaitingSig → false).
  const onMarkReviewed = async (): Promise<void> => {
    if (selectedRows.size === 0) return;

    const incidentIds = Array.from(selectedRows);
    const ok = await actions.markReviewed({ incident_ids: incidentIds });

    if (ok) {
      setSelectedRows(new Set());
      await refetchRows();
    }
  };

  const inboxColumns: TableColumn<InboxRowType>[] = useMemo(
    () => [
      {
        key: 'severity-dot',
        header: tInbox('columns.severityDot'),
        render: (r) => (
          <span
            className="row-severity-dot"
            style={{
              background:
                r.severity === 'T3'
                  ? 'var(--danger)'
                  : r.severity === 'T2'
                    ? 'var(--warning)'
                    : r.severity === 'T1'
                      ? 'var(--info)'
                      : 'var(--band-medium)',
            }}
            aria-hidden="true"
          />
        ),
        className: 'col-warn',
      },
      {
        key: 'thread',
        header: tInbox('columns.thread'),
        render: (r) => (
          <div
            className={`data-table--inbox__tr${r.isUrgent ? ' row-urgent' : ''}${
              selectedRows.has(r.id) ? ' is-selected' : ''
            }`}
            data-testid="inbox-row"
            data-priority={r.severity.toLowerCase()}
            data-read={r.read ? 'true' : 'false'}
          >
            <Link to={r.href} className="inbox-row__title-link">
              <strong>{r.title}</strong>
              <div className="row-sub">{r.meta}</div>
            </Link>
          </div>
        ),
        className: 'col-title',
      },
      {
        key: 'where',
        header: tInbox('columns.where'),
        render: (r) => (
          <>
            <span className="mono">{r.where}</span>
            <div className="row-sub">{r.whereSub}</div>
          </>
        ),
        className: 'col-where',
      },
      {
        key: 'ownerName',
        header: tInbox('columns.owner'),
        render: (r) => (
          <>
            <span
              className="avatar-dot"
              style={{
                background:
                  r.ownerKind === 'reporter'
                    ? 'var(--success)'
                    : r.ownerKind === 'tech'
                      ? 'var(--brand-500)'
                      : r.ownerKind === 'system'
                        ? 'var(--fg-tertiary)'
                        : r.ownerKind === 'vendor'
                          ? 'var(--warning)'
                          : 'var(--brand-500)',
              }}
              aria-hidden="true"
            >
              {r.ownerName ? r.ownerName.slice(0, 2) : tInbox('columns.ownerUnknown')}
            </span>
            {r.ownerName}
          </>
        ),
        className: 'col-owner',
      },
      {
        key: 'severity',
        header: tInbox('columns.severity'),
        render: (r) => (
          <span className={`badge badge--${r.severity.toLowerCase()}`}>{r.severity}</span>
        ),
        className: 'col-status',
      },
      {
        key: 'action',
        header: tInbox('columns.action'),
        render: (r) => <a href={r.action.href}>{r.action.label} →</a>,
        className: 'col-action',
      },
    ],
    [selectedRows, tInbox],
  );

  return (
    <Container width={ContainerWidth.Wide}>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{tInbox('page.title')}</h1>
            <div className="page-header__sub">
              {tInbox('page.subtitle', {
                count: rows.length,
                t3: chipCounts.T3,
                sig: chipCounts.sig,
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button variant="secondary" size="sm">
              {tInbox('actions.exportQueue')}
            </Button>
            <Button variant="primary" size="sm">
              {tInbox('actions.newDraft')}
            </Button>
          </div>
        </div>
      </div>
      <div className="inbox-toolbar">
        <div className="filter-chips" role="tablist" aria-label={tInbox('toolbar.filterAriaLabel')}>
          <FilterChip
            label={tInbox('filters.all')}
            count={chipCounts.all}
            active={filter === 'all'}
            onClick={() => {
              setFilter('all');
            }}
          />
          <FilterChip
            label={tInbox('filters.t3Urgent')}
            count={chipCounts.T3}
            dotColor="var(--danger)"
            active={filter === 'T3'}
            onClick={() => {
              setFilter('T3');
            }}
          />
          <FilterChip
            label={tInbox('filters.awaitingSigs')}
            count={chipCounts.sig}
            active={filter === 'sig'}
            onClick={() => {
              setFilter('sig');
            }}
          />
          <FilterChip
            label={tInbox('filters.myDrafts')}
            count={chipCounts.drafts}
            active={filter === 'drafts'}
            onClick={() => {
              setFilter('drafts');
            }}
          />
          <FilterChip
            label={tInbox('filters.citizenReports')}
            count={chipCounts.citizen}
            active={filter === 'citizen'}
            onClick={() => {
              setFilter('citizen');
            }}
          />
          <FilterChip
            label={tInbox('filters.resolvedToday')}
            count={chipCounts.resolved}
            active={filter === 'resolved'}
            onClick={() => {
              setFilter('resolved');
            }}
          />
        </div>
        <div className="inbox-search">
          <span className="sidebar__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            type="search"
            className="inbox-search__input"
            placeholder={tInbox('toolbar.searchPlaceholder')}
            aria-label={tInbox('toolbar.searchAriaLabel')}
          />
        </div>
      </div>
      <div className="grid-12" style={{ marginTop: 'var(--space-md)' }}>
        <div className="col-8">
          <Card modifier="with-heading" testId="inbox-card">
            <div
              className="data-card__head"
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <h3 className="data-card__title">{tInbox('card.title')}</h3>
              <span className="data-card__meta">
                {tInbox('card.meta', {
                  count: visibleRows.length,
                  time: rows[0]?.timestamp
                    ? formatTime('time-24', rows[0].timestamp)
                    : tInbox('card.metaFallback'),
                })}
              </span>
            </div>
            {loading ? (
              <Table<InboxRowType>
                columns={inboxColumns}
                rows={visibleRows}
                rowKey="id"
                testId="table-inbox"
                selectable
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                loading
              />
            ) : rows.length === 0 ? (
              <Table<InboxRowType>
                columns={inboxColumns}
                rows={visibleRows}
                rowKey="id"
                testId="table-inbox"
                selectable
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                emptyState={
                  <EmptyState
                    icon={<span>{tInbox('empty.icon')}</span>}
                    heading={tInbox('empty.heading')}
                    body={tInbox('empty.body')}
                  />
                }
              />
            ) : (
              <Table<InboxRowType>
                columns={inboxColumns}
                rows={visibleRows}
                rowKey="id"
                testId="table-inbox"
                selectable
                selectedRows={selectedRows}
                onSelectionChange={setSelectedRows}
                className="data-table--inbox"
              />
            )}
            <div className="inbox-bulkbar" hidden={selectedRows.size === 0}>
              <span className="inbox-bulkbar__count">
                <strong>{selectedRows.size}</strong> {tInbox(selectedRows.size === 1 ? 'bulkBar.count_one' : 'bulkBar.count_other', { count: selectedRows.size })}
              </span>
              <div className="inbox-bulkbar__actions">
                <Button variant="secondary" size="sm" disabled>
                  {tInbox('bulkBar.assignToMe')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actions.busy || selectedRows.size === 0}
                  onClick={() => {
                    void onMarkReviewed();
                  }}
                  testId="bulk-mark-reviewed"
                >
                  {tInbox('bulkBar.markReviewed')}
                </Button>
                <Button variant="danger" size="sm" disabled>
                  {tInbox('bulkBar.archive')}
                </Button>
              </div>
            </div>
          </Card>
          <div className="inbox-pager">
            <span className="inbox-pager__meta">
              {tInbox('pager.meta', { visible: visibleRows.length, total: rows.length })}
            </span>
          </div>
        </div>
        <div className="col-4">
          <SeverityRail
            T3={sevCounts.T3}
            T2={sevCounts.T2}
            T1={sevCounts.T1}
            T0={sevCounts.T0}
            total={total}
          />
          <AwaitingActionRail rows={rows.filter((r) => r.isAwaitingSig)} />
          <RecentDecisionsRail recent={recent} />
        </div>
      </div>
    </Container>
  );
}
