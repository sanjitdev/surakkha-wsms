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
 *   - Rows carry BandPill (locked=true) + age + missing-evidence chips
 *     (FE-1.5d 2026-09-16: ReporterBadge dropped from the action queue;
 *      it now lives on the inbox-detail header — hotline-only — and
 *      inside the right-rail SeverityRail.)
 *   - Pagination via <Pagination> primitive, default 20 per page
 *   - Empty / loading / error states pinned
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import '../styles/inbox.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table.types';
import { BandPill } from '../components/ui/BandPill';
import { Dropdown } from '../components/ui/Dropdown';
import type { DropdownOption } from '../components/ui/Dropdown';
import { Pagination } from '../components/ui/Pagination';
import { Band } from '../types/domain';
import {
  type FilterState,
  type InboxRow as InboxRowType,
  type InboxStatusFilter,
  type IncidentSeverity,
  EMPTY_FILTERS,
  applyFilters,
  parseFiltersFromQuery,
  serialiseFiltersToQuery,
} from '../types/inbox';
import type { ReporterKind } from '../types/domain';
import { ContainerWidth } from '../types/domain';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useDateFormatter } from '../hooks/useDateFormatter';
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
  const { formatRelative } = useRelativeTime();
  const { locale } = useDateFormatter();
  const { t: tInbox } = useTranslation('inboxList');
  const { t: tCommon } = useTranslation('common');
  const actions = useIncidentActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<InboxRowType[]>([]);
  const [recent, setRecent] = useState<RecentDecision[]>([]);
  // Filter state — bands / reporters / status / date range. Pre-populates
  // from `?filter=...` on mount (REQ-003 URL persistence). FE-1.5d
  // (2026-09-16): the legacy single-chip filter row merged into the
  // `status` dimension, so this is now the only filter state — no
  // parallel `filter` + `richFilter` to keep in sync.
  const [filter, setFilter] = useState<FilterState>(
    () => parseFiltersFromQuery(searchParams.toString()) ?? EMPTY_FILTERS,
  );
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // True when any filter is active — drives the "Clear" affordance so the
  // operator can wipe the toolbar back to its unfiltered state in one click.
  const filtersActive =
    filter.band.length > 0 ||
    filter.reporter.length > 0 ||
    filter.status.length > 0 ||
    filter.from !== null ||
    filter.to !== null;
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
  // Apply the (single-source-of-truth) filter. Multi-select dropdowns
  // each drive one dimension of `filter`; `applyFilters` ANDs the
  // dimensions per inbox-list.md #3.
  const visibleRows = useMemo(() => applyFilters(sortedRows, filter), [sortedRows, filter]);

  // Dropdown option lists. Memoised on `tInbox`/`tCommon` so the labels
  // re-resolve when the locale changes without rebuilding the array
  // on every keystroke. Each list mirrors the FilterState union so
  // the Dropdown's onChange matches the FilterState dimension type.
  // Order matches the visual priority the operator scans the toolbar.
  const statusDropdownOptions = useMemo<DropdownOption<InboxStatusFilter>[]>(
    () => [
      { value: 'urgent', label: tInbox('filters.t3Urgent') },
      { value: 'awaiting-sig', label: tInbox('filters.awaitingSigs') },
      { value: 'my-drafts', label: tInbox('filters.myDrafts') },
      { value: 'citizen', label: tInbox('filters.citizenReports') },
      { value: 'open', label: tInbox('filters.open') },
      { value: 'in-flight', label: tInbox('filters.inFlight') },
      { value: 'resolved', label: tInbox('filters.resolved') },
    ],
    [tInbox],
  );
  const bandDropdownOptions = useMemo<DropdownOption<IncidentSeverity>[]>(
    () => [
      { value: 'T3', label: tCommon('band.tier.T3') },
      { value: 'T2', label: tCommon('band.tier.T2') },
      { value: 'T1', label: tCommon('band.tier.T1') },
    ],
    [tCommon],
  );
  const reporterDropdownOptions = useMemo<DropdownOption<ReporterKind>[]>(
    () => [
      { value: 'anchor', label: tInbox('reporterBadge.anchor') },
      { value: 'hotline', label: tInbox('reporterBadge.hotline') },
      { value: 'webform', label: tInbox('reporterBadge.webform') },
      { value: 'sensor', label: tInbox('reporterBadge.sensor') },
    ],
    [tInbox],
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

  // ── URL persistence (REQ-003) — serialise the filter to ?filter=… on change.
  // Uses replace:true so the back button doesn't pile up one entry per
  // dropdown toggle. Does not touch search params that aren't ours.
  useEffect(() => {
    const next = serialiseFiltersToQuery(filter);

    if (next === '') {
      // Strip the `filter` param entirely when the user clears the toolbar.
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
  }, [filter, searchParams, setSearchParams]);

  // ── Pagination slice (REQ-005).
  // The Pagination primitive is page + pageSize driven. We slice the
  // sorted, filtered rows and pass the count up to it.
  const pagedRows = useMemo(
    () => visibleRows.slice((page - 1) * pageSize, page * pageSize),
    [visibleRows, page, pageSize],
  );

  // Reset to page 1 when filters change so the user isn't stranded on
  // an empty page after a dropdown toggle.
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // ── Dropdown onChange handlers. Each replaces the dimension's array
  // in one shot (the Dropdown primitive is already multi-select; we
  // don't need toggle helpers here).
  const setBand = (next: IncidentSeverity[]): void => {
    setFilter((cur) => ({ ...cur, band: next }));
  };

  const setReporter = (next: ReporterKind[]): void => {
    setFilter((cur) => ({ ...cur, reporter: next }));
  };

  const setStatusFilter = (next: InboxStatusFilter[]): void => {
    setFilter((cur) => ({ ...cur, status: next }));
  };

  const setDateRange = (from: string | null, to: string | null): void => {
    setFilter((cur) => ({ ...cur, from, to }));
  };

  const clearFilters = (): void => {
    setFilter(EMPTY_FILTERS);
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
      // ── Severity column (single data per request).
      // BandPill already encodes the verification tier via glyph + colour
      // + label (foundation §1.1). No auxiliary severity dot rail and no
      // co-mingled age / evidence chips — those live in their own columns
      // below so the operator can scan a single axis at a time.
      // (FE-1.5d 2026-09-16: reporter-badge dropped from the row.)
      {
        key: 'severity',
        header: tInbox('columns.severity'),
        width: '96px',
        render: (r) => {
          const band =
            r.severity === 'T3'
              ? Band.Low
              : r.severity === 'T2'
                ? Band.Medium
                : Band.High;

          // Missing-evidence marker: a compact "! N" badge beside the
          // BandPill so the row carries the flag without the visible
          // chip-line that used to overflow at 96 px. Tooltip lists
          // the missing fields. If none, no marker.
          const evidenceTitles = r.missingEvidence.map((m) => tInbox(`evidence.${m}`));

          return (
            <span className="inbox-row-severity">
              <BandPill band={band} locked={true} testId={`inbox-row-band-${r.id}`} />
              {r.missingEvidence.length > 0 ? (
                <span
                  className="inbox-row-evidence-marker"
                  data-testid={`inbox-row-evidence-${r.id}`}
                  title={evidenceTitles.join(' · ')}
                  aria-label={`Missing evidence: ${evidenceTitles.join(', ')}`}
                >
                  <span aria-hidden="true">!</span>
                  <span className="inbox-row-evidence-marker__count">
                    {r.missingEvidence.length}
                  </span>
                </span>
              ) : null}
            </span>
          );
        },
        className: 'col-severity',
      },
      // FE-1.5d reconciliation (2026-09-16): the source column was
      // dropped per the operator's refinement pass. Reporter-badge
      // remains on the inbox-detail header (hotline-only) and on the
      // right-rail's SeverityRail, but the action queue no longer
      // carries a 5th column. The thread column absorbed the freed
      // space (460 → 416 → 396 → 386 px as the severity column
      // grew 96 → 140 → 160 → 170 px to hold the locked BandPill
      // with breathing room).
      {
        key: 'thread',
        header: tInbox('columns.thread'),
        // Title takes the remaining width. tooltip = r.meta so the
        // summary stays accessible without burning a sub-line that
        // pushes the row to 88 px and ruins the 8-rows-on-screen scan.
        // The action label (Edit / Review / Schedule / Inspect / Open)
        // rides beside the title as a tertiary type-only affordance —
        // no second button, since the title link already opens the
        // same target (r.href === r.action.href). The action column
        // was removed in this pass; the thread column grows from
        // 260 px to 360 px to absorb the freed horizontal space so
        // the title doesn't float with whitespace to its right.
        width: '386px',
        // cellClassName drives the <td> background — the urgent and
        // selected visuals land on the title cell directly because
        // the row-level classes on the inner <a> can't reach the
        // surrounding <tr> (Table primitive owns the tr-level state).
        cellClassName: (r) =>
          `${r.isUrgent ? 'is-urgent' : ''}${selectedRows.has(r.id) ? ' is-selected' : ''}`.trim(),
        render: (r) => (
          <Link
            to={r.href}
            className="inbox-row__title-link"
            data-testid="inbox-row"
            data-priority={r.severity.toLowerCase()}
            data-read={r.read ? 'true' : 'false'}
            title={r.meta || undefined}
          >
            <div className="inbox-row__title-row">
              <span
                className={`row-severity-dot is-${r.severity.toLowerCase()}`}
                aria-hidden="true"
                data-testid={`inbox-row-severity-dot-${r.id}`}
              />
              <strong>{r.title}</strong>
              <span
                className="inbox-row-verb"
                aria-hidden="true"
                data-testid={`inbox-row-verb-${r.id}`}
              >
                {r.action.label}
              </span>
            </div>
          </Link>
        ),
        className: 'col-title',
      },
      {
        key: 'where',
        header: tInbox('columns.where'),
        width: '130px',
        render: (r) => (
          <span className="mono" title={r.whereSub || undefined}>
            {r.where}
          </span>
        ),
        className: 'col-where',
      },
      // ── Age column (own column per request). Tooltip = full ISO
      // timestamp so the operator can audit the exact moment without
      // expanding the cell.
      {
        key: 'age',
        header: tInbox('columns.age'),
        width: '88px',
        render: (r) => (
          <span
            className="inbox-row-age mono"
            data-testid={`inbox-row-age-${r.id}`}
            title={r.timestamp}
          >
            {formatRelative(r.timestamp)}
          </span>
        ),
        className: 'col-age',
      },
      // ── Owner column. Compact avatar-dot + name. The avatar dot uses
      // the carbonized reporter-avatar-dot sizing (16 px) so the cell
      // visual rhythm matches the source column. Name truncates with
      // ellipsis; tooltip carries the full name. Hard min/max width
      // ensures the header (uppercase) doesn't expand to fit the body
      // text on long names like "Karim Hossain".
      {
        key: 'owner',
        header: tInbox('columns.owner'),
        width: '120px',
        render: (r) => {
          const ownerColor =
            r.ownerKind === 'reporter'
              ? 'var(--success)'
              : r.ownerKind === 'tech'
                ? 'var(--brand-500)'
                : r.ownerKind === 'system'
                  ? 'var(--fg-tertiary)'
                  : r.ownerKind === 'vendor'
                    ? 'var(--warning)'
                    : 'var(--brand-500)';
          const initial = r.ownerName
            ? r.ownerName
                .split(/\s+/)
                .map((s) => s[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase()
            : tInbox('columns.ownerUnknown');

          return (
            <span className="inbox-row-owner" title={r.ownerName || undefined}>
              <span
                className="inbox-row-owner__dot"
                style={{ background: ownerColor }}
                aria-hidden="true"
              >
                {initial}
              </span>
              <span className="inbox-row-owner__name">{r.ownerName}</span>
            </span>
          );
        },
        className: 'col-owner',
      },
      // (Removed — action column. The thread <Link> already navigates
      // to r.href, which is identical to r.action.href by construction
      // (see inboxListModel.ts buildRows). The action label carries
      // status semantics (Edit / Review / Schedule / Inspect / Open)
      // and now rides as a small tertiary type-only mark beside the
      // title in the thread cell — no duplicate button.)
    ],
    [selectedRows, tInbox, formatRelative],
  );

  return (
    <Container width={ContainerWidth.Wide} testId="inbox-list-page">
      <div className="page-header">
        <div className="page-header__row">
          <div className="page-header__head">
            <div className="page-header__eyebrow">
              <span>{tInbox('page.eyebrow')}</span>
              <span className="page-header__eyebrow-sep" aria-hidden="true">›</span>
              <span>{tInbox('page.title')}</span>
            </div>
            <h1 className="page-header__title">{tInbox('page.title')}</h1>
            <div className="page-header__sub">
              {tInbox('page.subtitle', {
                count: rows.length,
                t3: chipCounts.T3,
                sig: chipCounts.sig,
              })}
            </div>
          </div>
          <div className="page-header__actions">
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
        {/* FE-1.5d (2026-09-16): toolbar collapsed to a single row of
            multi-select dropdowns. Search leads the toolbar (most-used
            affordance), then Status / Priority / Source / Date range.
            Each dropdown is independently multi-select — the operator
            can combine any axis without the "open rich panel" dance.
            A single "Clear" affordance wipes the toolbar back to its
            unfiltered state. The legacy fast-path chips + the More
            filters toggle + the rich filter panel are gone; the
            fast-path status values (urgent / awaiting-sig / my-drafts
            / citizen) moved into the Status dropdown so the operator
            still has targeted narrowing. */}
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
        {/* FE-1.5d (2026-09-16): no `label` prop — the visible label was
            dropped so the trigger reads as a compact inline pill. The
            `placeholder` doubles as the aria-label via Dropdown.tsx. */}
        <Dropdown<InboxStatusFilter>
          mode="multi"
          options={statusDropdownOptions}
          value={filter.status}
          onChange={setStatusFilter}
          placeholder={tInbox('filters.status')}
          testId="inbox-filter-status"
        />
        <Dropdown<IncidentSeverity>
          mode="multi"
          options={bandDropdownOptions}
          value={filter.band}
          onChange={setBand}
          placeholder={tInbox('filters.priorityBand')}
          testId="inbox-filter-band"
        />
        <Dropdown<ReporterKind>
          mode="multi"
          options={reporterDropdownOptions}
          value={filter.reporter}
          onChange={setReporter}
          placeholder={tInbox('filters.reporterBadge')}
          testId="inbox-filter-reporter"
        />
        <div className="filter-chips" role="group" aria-label={tInbox('filters.dateRange')}>
          {/* FE-1.5d (2026-09-16): the visible "Date range" label was
              dropped to match the rest of the compact toolbar; the
              `aria-label` on each <input> still announces the field to
              screen readers. */}
          <input
            type="date"
            className="inbox-rich-date"
            data-testid="inbox-filter-date-from"
            value={filter.from ?? ''}
            onChange={(e) => {
              setDateRange(e.target.value || null, filter.to);
            }}
            aria-label={tInbox('filters.dateRange')}
          />
          <input
            type="date"
            className="inbox-rich-date"
            data-testid="inbox-filter-date-to"
            value={filter.to ?? ''}
            onChange={(e) => {
              setDateRange(filter.from, e.target.value || null);
            }}
            aria-label={tInbox('filters.dateRange')}
          />
        </div>
        {filtersActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            testId="inbox-filter-clear"
          >
            {tInbox('toolbar.clearAll')}
          </Button>
        ) : null}
      </div>
      <div style={{ marginTop: 'var(--space-md)' }}>
        {/* FE-1.5d (2026-09-16) layout pass — the action queue card
            spans the full container width so the table can host more
            columns without horizontal squeeze. The card has a fixed
            viewport-anchored max-height and an internal scroll pane
            (`.inbox-card__scroll` in inbox.css) so the operator sees a
            constant "first screen" of rows regardless of queue depth;
            sticky <thead> (already in table.css ≥768 px) stays pinned
            to the top of the scroll area so column labels never scroll
            out of view. The right-rail content (Severity breakdown,
            Awaiting action, Recent decisions) now stacks BELOW the
            card in its own 3-up grid so it reads as supplementary
            context instead of competing chrome. */}
        <Card
          modifier="with-heading"
          testId="inbox-card"
          className="inbox-card--scrollable"
        >
          {/* Card head — stays pinned at the top of the flex column
              (flex: 0 0 auto). FE-1.5d (2026-09-16): the previous
              card head carried a duplicate "last updated X" line on
              both sides of the title (one as `card.meta`, one as
              `card.metaTime`); dropped both so the chrome is just
              the title + a single visible-row count, both aligned
              to the baseline so the chrome reads as one tight line. */}
          <div
            className="data-card__head inbox-card-head"
            data-testid="inbox-card-head"
          >
            <h3 className="data-card__title">{tInbox('card.title')}</h3>
            <span
              className="inbox-card-head__sub"
              data-testid="inbox-card-head-count"
            >
              {visibleRows.length}
            </span>
          </div>
          {/* Scroll pane — flex: 1 1 auto + min-height: 0 so the
              child overflows inside the card instead of pushing the
              card past its max-height. Empty / loading / error
              states render centered inside this pane so they don't
              collapse the surrounding chrome. The sticky <thead>
              (table.css @ ≥768 px) anchors to the top of this
              pane — column labels stay readable while the body
              scrolls underneath. */}
          <div className="inbox-card__scroll" data-testid="inbox-card-scroll">
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
          </div>
          {/* Bulk-bar — FE-1.5d (2026-09-16): collapsed to a single
              line carrying only the count + a Clear affordance + the
              one active CTA (Mark reviewed). The previous design
              carried two extra disabled placeholder buttons
              (AssignToMe / Archive) which read as competing chrome
              without doing anything — dropped. The bar stays pinned
              at the bottom of the card via flex: 0 0 auto so the
              operator always sees their selection state even when
              the table body is mid-scroll. */}
          <div className="inbox-bulkbar" hidden={selectedRows.size === 0}>
            <span className="inbox-bulkbar__count">
              <strong>{selectedRows.size}</strong> {tInbox(selectedRows.size === 1 ? 'bulkBar.count_one' : 'bulkBar.count_other', { count: selectedRows.size })}
            </span>
            <div className="inbox-bulkbar__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedRows(new Set());
                }}
                testId="bulk-clear-selection"
              >
                {tInbox('bulkBar.clear')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={actions.busy || selectedRows.size === 0}
                onClick={() => {
                  void onMarkReviewed();
                }}
                testId="bulk-mark-reviewed"
              >
                {tInbox('bulkBar.markReviewed')}
              </Button>
            </div>
          </div>
        </Card>
        {/* Pagination (REQ-005): <Pagination> primitive, default 20/page.
            Sits below the card so the operator can flip pages even
            when the table body is mid-scroll. The previous `inbox-pager`
            "X of Y" line for the single-page case was dropped — the
            visible-row count is already in the card head, so a second
            copy below the table was redundant. */}
        {visibleRows.length > pageSize ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={visibleRows.length}
            onPageChange={setPage}
            testId="inbox-pagination"
          />
        ) : null}
        {/* Right-rail content — relocated below the action queue card
            per the operator's FE-1.5d layout pass. Each rail stays in
            its own 1/3 column so the supplementary context reads as
            three independent summaries instead of a single sidebar. */}
        <div
          className="grid-12 inbox-rails"
          style={{ marginTop: 'var(--space-md)' }}
        >
          <div className="col-4">
            <SeverityRail
              T3={sevCounts.T3}
              T2={sevCounts.T2}
              T1={sevCounts.T1}
              T0={sevCounts.T0}
              total={total}
            />
          </div>
          <div className="col-4">
            <AwaitingActionRail rows={rows.filter((r) => r.isAwaitingSig)} />
          </div>
          <div className="col-4">
            <RecentDecisionsRail recent={recent} />
          </div>
        </div>
      </div>
    </Container>
  );
}
