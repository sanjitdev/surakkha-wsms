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
 *
 * WO-009 lockdown reconciliation (2026-09-15):
 *   - Sort: priority-first / age-second (T3 > T2 > T1 > Resolved)
 *   - Filter chips: priority band, reporter-badge, status (open/in-flight/resolved), date range
 *   - URL persistence: ?filter=band=T3&reporter=anchor&status=open&from=…&to=…
 *   - Rows carry BandPill (locked=true) + ReporterBadge + age + missing-evidence chips
 *   - Pagination via <Pagination> primitive, default 20 per page
 *   - Empty / loading / error states pinned
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import '../../mockups/01-priya/dashboard.css';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table.types';
import { FilterChip } from '../components/pages/FilterChip';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { Pagination } from '../components/ui/Pagination';
import { Band } from '../types/domain';
import {
  type FilterState,
  type InboxRowFilter,
  type InboxRow as InboxRowType,
  type IncidentSeverity,
  EMPTY_FILTERS,
  applyFilters,
  parseFiltersFromQuery,
  serialiseFiltersToQuery,
} from '../types/inbox';
import type { ReporterKind } from '../types/domain';
import { ContainerWidth } from '../types/domain';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useIncidentActions } from '../hooks/useIncidentActions';
import {
  type ChainEventLite,
  type RecentDecision,
  buildRows,
  countByFilter,
  mergeRecentDecisions,
  sortRowsByPriorityAge,
} from './inboxListModel';
import { AwaitingActionRail, RecentDecisionsRail, SeverityRail } from './InboxRail';

export function InboxList() {
  const { format: formatTime, locale } = useDateFormatter();
  const { formatRelative } = useRelativeTime();
  const { t: tInbox } = useTranslation('inboxList');
  const actions = useIncidentActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<InboxRowType[]>([]);
  const [recent, setRecent] = useState<RecentDecision[]>([]);
  // Legacy single-filter chip row (left side of the toolbar). Kept so
  // the existing pattern (all / T3 / sig / drafts / citizen / resolved)
  // stays as a fast-path; the rich FilterState (REQ-002) handles
  // multi-dimensional filtering per inbox-list.md §3 #3.
  const [filter, setFilter] = useState<InboxRowFilter>('all');
  // Rich filter state — bands / reporters / status / date range.
  // Pre-populates from `?filter=...` on mount (REQ-003 URL persistence).
  const [richFilter, setRichFilter] = useState<FilterState>(
    () => parseFiltersFromQuery(searchParams.toString()) ?? EMPTY_FILTERS,
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pagination state (REQ-005).
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // (1) inbox rows — gated on chain head & recent fetches via separate effects
  // refetchRows is pulled out so the bulk-bar Mark-reviewed CTA can call it
  // after a successful SignatureAttestation chain write to refresh the table
  // + AwaitingActionRail (each review drops isAwaitingSig to false).
  const refetchRows = useCallback(async (): Promise<void> => {
    try {
      const r = await fetch('/api/events?event_type=IncidentCreated&limit=100');

      if (!r.ok) {
        throw new Error(`chain responded ${r.status}`);
      }
      const data = (await r.json()) as { events: ChainEventLite[] };

      setRows(buildRows(data.events));
      setError(null);
    } catch (err) {
      console.error('[surakkha] inbox fetch failed', err);
      setRows([]);
      setError((err as Error).message ?? 'unknown error');
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
  // Lockdown-bound sort (REQ-001): priority-first / age-second.
  // T3 → T2 → T1 → Resolved, then oldest within tier. Applied before
  // the filter so the user sees the same row order regardless of which
  // chip is active.
  const sortedRows = useMemo(() => sortRowsByPriorityAge(rows), [rows]);
  // Compose legacy single-chip filter + rich multi-dimensional filter.
  // The legacy chip is a fast-path AND applies on top of the rich filter.
  const visibleRows = useMemo(() => {
    const richFiltered = applyFilters(sortedRows, richFilter);

    return richFiltered.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'T3') return r.severity === 'T3';
      if (filter === 'sig') return r.isAwaitingSig;
      if (filter === 'drafts') return r.isDraft;
      if (filter === 'citizen') return r.isCitizen;
      // filter is `'resolved'` here — TS exhaustively narrowed via prior returns
      return r.status === 'chain_verify';
    });
  }, [sortedRows, filter, richFilter]);
  const sevCounts = useMemo(() => {
    return {
      T3: rows.filter((r) => r.severity === 'T3').length,
      T2: rows.filter((r) => r.severity === 'T2').length,
      T1: rows.filter((r) => r.severity === 'T1').length,
      T0: rows.filter((r) => r.severity === 'T0').length,
    };
  }, [rows]);
  const total = Math.max(1, rows.length);

  // ── URL persistence (REQ-003) — serialise the rich filter to ?filter=… on change.
  // Uses replace:true so the back button doesn't pile up one entry per chip toggle.
  // Does not touch search params that aren't ours.
  useEffect(() => {
    const next = serialiseFiltersToQuery(richFilter);

    if (next === '') {
      // Strip the `filter` param entirely when the user clears all chips.
      if (searchParams.has('filter')) {
        const clone = new URLSearchParams(searchParams.toString());

        clone.delete('filter');
        setSearchParams(clone, { replace: true });
      }
      return;
    }

    const currentFilter = searchParams.get('filter');

    if (currentFilter !== next.slice('?filter='.length)) {
      const clone = new URLSearchParams(searchParams.toString());

      clone.set('filter', next.slice('?filter='.length));
      setSearchParams(clone, { replace: true });
    }
  }, [richFilter, searchParams, setSearchParams]);

  // ── Pagination slice (REQ-005).
  // The Pagination primitive is page + pageSize driven. We slice the
  // sorted, filtered rows and pass the count up to it.
  const pagedRows = useMemo(
    () => visibleRows.slice((page - 1) * pageSize, page * pageSize),
    [visibleRows, page, pageSize],
  );

  // Reset to page 1 when filters change so the user isn't stranded on
  // an empty page after a chip toggle.
  useEffect(() => {
    setPage(1);
  }, [filter, richFilter]);

  // ── Filter-chip toggles (REQ-002).
  const toggleBand = (b: IncidentSeverity): void => {
    setRichFilter((cur) => ({
      ...cur,
      band: cur.band.includes(b) ? cur.band.filter((x) => x !== b) : [...cur.band, b],
    }));
  };

  const toggleReporter = (r: ReporterKind): void => {
    setRichFilter((cur) => ({
      ...cur,
      reporter: cur.reporter.includes(r) ? cur.reporter.filter((x) => x !== r) : [...cur.reporter, r],
    }));
  };

  const toggleStatus = (s: 'open' | 'in-flight' | 'resolved'): void => {
    setRichFilter((cur) => ({
      ...cur,
      status: cur.status.includes(s) ? cur.status.filter((x) => x !== s) : [...cur.status, s],
    }));
  };

  const setDateRange = (from: string | null, to: string | null): void => {
    setRichFilter((cur) => ({ ...cur, from, to }));
  };

  const clearFilters = (): void => {
    setRichFilter(EMPTY_FILTERS);
  };

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
        // No visible header for the dot column — it's a visual rail,
        // not a labelled field. Passing an empty literal avoids the
        // i18n-key-leak that happens when t() resolves a missing/empty
        // value to the key string itself.
        header: '',
        render: (r) => {
          // Lockdown cascade 2026-09-11: severity dot uses the lockdown
          // palette per inbox-list.md #1 / inbox-rail.md. T3 in operator
          // chrome is amber-bright (NOT alert-red-reserved); alert-red is
          // reserved for the consumer-notice issuance path.
          const sevClass =
            r.severity === 'T3'
              ? 'is-t3'
              : r.severity === 'T2'
                ? 'is-t2'
                : r.severity === 'T1'
                  ? 'is-t1'
                  : 'is-t0';

          return (
            <span
              className={`row-severity-dot ${sevClass}`}
              aria-hidden="true"
            />
          );
        },
        className: 'col-warn',
      },
      // ── Row chrome column (REQ-004) — BandPill + ReporterBadge + age + missing-evidence chips.
      // Trust band is a SEPARATE dimension from the reporter badge (foundation §1.1).
      // Both render side-by-side so the operator sees verification state (T1/T2/T3/Resolved)
      // and source attribute (anchor/hotline/webform/sensor) without conflating them.
      {
        key: 'chrome',
        header: tInbox('columns.severity'),
        render: (r) => {
          const band =
            r.severity === 'T3'
              ? Band.Low
              : r.severity === 'T2'
                ? Band.Medium
                : Band.High;

          return (
            <div
              data-testid={`inbox-row-chrome-${r.id}`}
              className="inbox-row-chrome"
            >
              <BandPill band={band} locked={true} testId={`inbox-row-band-${r.id}`} />
              <ReporterBadge
                kind={r.reporterKind}
                i18nNamespace="inboxList"
                i18nKeyPrefix="reporterBadge"
                testId={`inbox-row-reporter-badge-${r.id}`}
              />
              <span
                className="inbox-row-age"
                data-testid={`inbox-row-age-${r.id}`}
                title={r.timestamp}
              >
                {formatRelative(r.timestamp)}
              </span>
              {r.missingEvidence.length > 0 ? (
                <span className="inbox-row-evidence" data-testid={`inbox-row-evidence-${r.id}`}>
                  {r.missingEvidence.map((m) => (
                    <span
                      key={m}
                      className="inbox-row-evidence-chip"
                      data-evidence={m}
                      data-testid={`inbox-row-evidence-chip-${r.id}-${m}`}
                    >
                      {tInbox(`evidence.${m}`)}
                    </span>
                  ))}
                </span>
              ) : null}
            </div>
          );
        },
        className: 'col-chrome',
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
        key: 'action',
        // Action column has no visible header — rows link directly to the
        // work surface. Empty literal avoids the i18n-key-leak when t()
        // resolves a missing/empty value to the key string itself.
        header: '',
        render: (r) => <a href={r.action.href}>{r.action.label}</a>,
        className: 'col-action',
      },
    ],
    [selectedRows, tInbox, formatTime],
  );

  return (
    <Container width={ContainerWidth.Wide} testId="inbox-list-page">
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
            dotColor="var(--color-amber-bright)"
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
      {/* Rich filter chip row (REQ-002): priority band, reporter-badge,
          status, date range. Multi-select inside a chip row is OR;
          chip rows compose AND with the legacy single-filter above. */}
      <div
        className="inbox-toolbar inbox-toolbar--rich"
        data-testid="inbox-rich-filter-row"
      >
        <div
          className="filter-chips"
          role="tablist"
          aria-label={tInbox('filters.priorityBand')}
          data-testid="inbox-rich-filter-band"
        >
          <span className="inbox-toolbar__label">{tInbox('filters.priorityBand')}</span>
          {(['T3', 'T2', 'T1'] as IncidentSeverity[]).map((b) => (
            <FilterChip
              key={b}
              label={tInbox(`bandPill.${b}`)}
              active={richFilter.band.includes(b)}
              onClick={() => {
                toggleBand(b);
              }}
              testId={`inbox-rich-band-${b.toLowerCase()}`}
            />
          ))}
        </div>
        <div
          className="filter-chips"
          role="tablist"
          aria-label={tInbox('filters.reporterBadge')}
          data-testid="inbox-rich-filter-reporter"
        >
          <span className="inbox-toolbar__label">{tInbox('filters.reporterBadge')}</span>
          {(['anchor', 'hotline', 'webform', 'sensor'] as ReporterKind[]).map((r) => (
            <FilterChip
              key={r}
              label={tInbox(`reporterBadge.${r}`)}
              active={richFilter.reporter.includes(r)}
              onClick={() => {
                toggleReporter(r);
              }}
              testId={`inbox-rich-reporter-${r}`}
            />
          ))}
        </div>
        <div
          className="filter-chips"
          role="tablist"
          aria-label={tInbox('filters.status')}
          data-testid="inbox-rich-filter-status"
        >
          <span className="inbox-toolbar__label">{tInbox('filters.status')}</span>
          {(['open', 'in-flight', 'resolved'] as const).map((s) => (
            <FilterChip
              key={s}
              label={tInbox(`filters.${s}`)}
              active={richFilter.status.includes(s)}
              onClick={() => {
                toggleStatus(s);
              }}
              testId={`inbox-rich-status-${s}`}
            />
          ))}
        </div>
        <div
          className="filter-chips"
          role="tablist"
          aria-label={tInbox('filters.dateRange')}
          data-testid="inbox-rich-filter-daterange"
        >
          <span className="inbox-toolbar__label">{tInbox('filters.dateRange')}</span>
          <input
            type="date"
            className="inbox-rich-date"
            data-testid="inbox-rich-date-from"
            value={richFilter.from ?? ''}
            onChange={(e) => {
              setDateRange(e.target.value || null, richFilter.to);
            }}
            aria-label={tInbox('filters.dateRange')}
          />
          <input
            type="date"
            className="inbox-rich-date"
            data-testid="inbox-rich-date-to"
            value={richFilter.to ?? ''}
            onChange={(e) => {
              setDateRange(richFilter.from, e.target.value || null);
            }}
            aria-label={tInbox('filters.dateRange')}
          />
          {richFilter.from !== null || richFilter.to !== null ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateRange(null, null);
              }}
              testId="inbox-rich-date-clear"
            >
              ×
            </Button>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          testId="inbox-rich-clear-all"
        >
          {tInbox('filters.all')}
        </Button>
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
              <div
                className="inbox-loading"
                data-testid="inbox-loading"
                aria-label={tInbox('loading.message')}
              >
                {tInbox('loading.message')}
              </div>
            ) : error !== null ? (
              <EmptyState
                icon={<span>{tInbox('empty.icon')}</span>}
                heading={tInbox('error.title')}
                body={tInbox('error.body')}
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<span>{tInbox('empty.icon')}</span>}
                heading={tInbox('empty.heading')}
                body={tInbox('empty.body')}
              />
            ) : pagedRows.length === 0 ? (
              <EmptyState
                icon={<span>{tInbox('empty.icon')}</span>}
                heading={tInbox('empty.heading')}
                body={tInbox('empty.noMatches')}
              />
            ) : (
              <Table<InboxRowType>
                columns={inboxColumns}
                rows={pagedRows}
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
                <Button variant="secondary" size="sm" disabled>
                  {tInbox('bulkBar.archive')}
                </Button>
              </div>
            </div>
          </Card>
          {/* Pagination (REQ-005): <Pagination> primitive, default 20/page. */}
          {visibleRows.length > pageSize ? (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={visibleRows.length}
              onPageChange={setPage}
              testId="inbox-pagination"
            />
          ) : (
            <div className="inbox-pager">
              <span className="inbox-pager__meta">
                {tInbox('pager.meta', { visible: visibleRows.length, total: rows.length })}
              </span>
            </div>
          )}
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
