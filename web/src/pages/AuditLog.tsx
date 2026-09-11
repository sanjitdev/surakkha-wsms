/**
 * AuditLog.tsx — FE-1.5c.
 *
 * Chain explorer at /audit-log. Per dim 5 §7.6:
 *   - Container width="wide" (1280 px) — chain tables need horizontal
 *     room for time + chain-ref + event + ward + actor + action.
 *   - Rows at --height-row-default (40 px) — dense mode.
 *   - Plex Mono for chain refs (--font-family-mono + tabular-nums).
 *   - Copy-to-clipboard on chain-ref click.
 *
 * Data source: GET /api/events?limit=N — the mock returns events sorted
 * by height (ascending). For a real audit explorer we'd want descending
 * + pagination, but Phase 1 ships the structure not the backend.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { FilterChip } from '../components/pages/FilterChip';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import type { TableColumn } from '../components/ui/Table.types';
import { DatePicker } from '../components/ui/DatePicker';
import { AuditIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useLocale } from '../hooks/useLocale';
import { isInRange } from '../hooks/auditDateRange';
import { verifyBlockHash, type VerifyState } from '../lib/chain-verify';

interface ChainEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  actor_identity?: { kind: string; ref: string; display?: string };
  payload: Record<string, unknown>;
  block_hash: string;
  height: number;
}
type FilterId = 'all' | 'errors' | 'signatures' | 'sensor' | 'citizen' | 'notices' | 'auth';
interface ChipDef {
  id: FilterId;
  /** i18n key suffix under `filters.*` — resolved at render time. */
  labelKey: FilterId;
  testId: string;
  match: (e: ChainEvent) => boolean;
}
const CHIPS: readonly ChipDef[] = [
  { id: 'all', labelKey: 'all', testId: 'chip-all', match: () => true },
  {
    id: 'errors',
    labelKey: 'errors',
    testId: 'chip-errors',
    match: (e) => /escalated|failed|breach|tamper/i.test(e.event_type),
  },
  {
    id: 'signatures',
    labelKey: 'signatures',
    testId: 'chip-sig',
    match: (e) => /Signature|Attestation|Endorsement|Acknowledgement/i.test(e.event_type),
  },
  {
    id: 'sensor',
    labelKey: 'sensor',
    testId: 'chip-sensor',
    match: (e) => e.event_type === 'SensorReadingSubmitted',
  },
  {
    id: 'citizen',
    labelKey: 'citizen',
    testId: 'chip-citizen',
    match: (e) => /Citizen|CitizenComplaint/i.test(e.event_type),
  },
  {
    id: 'notices',
    labelKey: 'notices',
    testId: 'chip-notices',
    match: (e) => /PublicNotice/i.test(e.event_type),
  },
  {
    id: 'auth',
    labelKey: 'auth',
    testId: 'chip-auth',
    match: (e) => /Login|Logout|Session/i.test(e.event_type),
  },
];

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
export function AuditLog() {
  const { chainHead } = useAppLayout();
  const { t: tAudit } = useTranslation('auditLog');
  const { format: formatTime } = useDateFormatter();
  const { locale } = useLocale();
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const rangeActive = range.from !== null || range.to !== null;
  // Per-row verification state. Keyed by event_id so the badge persists
  // across filter changes for the same row. Cleared on filter change is
  // intentional: a verified badge for a row the operator can't see is
  // misleading. Audit-log.md #13 says "single-click independent" — the
  // operator verifies only what they're currently inspecting.
  const [verifyStates, setVerifyStates] = useState<Map<string, VerifyState>>(new Map());

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/events?limit=200');
        const data = (await r.json()) as { events: ChainEvent[] };

        // Newest first — audit exploration always starts at the latest.
        setEvents([...data.events].sort((a, b) => b.height - a.height));
      } catch (err) {
        console.error('[surakkha] audit fetch failed', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts = useMemo(() => {
    const map = new Map<FilterId, number>();

    for (const chip of CHIPS) {
      map.set(chip.id, events.filter(chip.match).length);
    }
    return map;
  }, [events]);
  const visible = useMemo(() => {
    const chip = CHIPS.find((c) => c.id === filter) ?? CHIPS[0];

    return events
      .filter(chip.match)
      .filter((e) => isInRange(e.occurred_at, range.from, range.to, locale));
  }, [events, filter, range.from, range.to, locale]);

  // Single-click verify per row. Marks the row pending immediately so the
  // button shows an in-flight state, then replaces with the outcome.
  // No batching across rows: each click is independent so the operator can
  // spot-check a few rows without committing the whole table to a scan.
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

  const auditColumns: TableColumn<ChainEvent>[] = useMemo(
    () => [
      {
        key: 'occurred_at',
        header: tAudit('table.headerTime'),
        sortable: true,
        className: 'col-time',
        render: (e) => <span className="mono">{formatTime('time-24', e.occurred_at)}</span>,
      },
      {
        key: 'severity-dot',
        header: '',
        className: 'col-warn',
        render: (e) => {
          // Lockdown cascade 2026-09-11: severity dot uses the lockdown
          // palette per audit-log.md #6.
          //   - ChainAnomalyDetected / Tamper / Breach → alert-red-reserved
          //     (issuance path: anomaly surfaces escalate the operator to
          //     confirm consumer notice).
          //   - Error → --color-status-warn (amber; form-validation style,
          //     NOT issuance path).
          //   - everything else → --color-safe-green.
          let cls = 'is-ok';

          if (
            e.event_type.includes('Anomaly') ||
            e.event_type.includes('Tamper') ||
            e.event_type.includes('Breach')
          ) {
            cls = 'is-anomaly';
          } else if (e.event_type.includes('Error')) {
            cls = 'is-error';
          }

          return <span className={`row-severity-dot ${cls}`} aria-hidden="true" />;
        },
      },
      {
        key: 'event_type',
        header: tAudit('table.headerEvent'),
        sortable: true,
        render: (e) => (
          <>
            <strong>{e.event_type}</strong>
            <div
              className="row-sub"
              style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-xs)' }}
            >
              {tAudit('table.blockPrefix', { height: e.height })}
            </div>
          </>
        ),
      },
      {
        key: 'block_hash',
        header: tAudit('table.headerWard'),
        className: 'col-where',
        render: (e) => {
          const ward = (e.payload as { ward_id?: string }).ward_id ?? tAudit('table.actorEmDash');

          return (
            <>
              <span className="mono">{ward}</span>
              <div className="row-sub mono" style={{ fontSize: 'var(--font-size-xs)' }}>
                {truncateHash(e.block_hash)}
              </div>
            </>
          );
        },
      },
      {
        key: 'actor_identity',
        header: tAudit('table.headerActor'),
        render: (e) => (
          <span className="mono">
            {e.actor_identity?.display ?? tAudit('table.actorEmDash')}
          </span>
        ),
      },
      {
        key: 'type-badge',
        header: tAudit('table.headerType'),
        className: 'col-status',
        render: (e) => (
          <span className="badge badge--tier">{e.event_type.split(/(?=[A-Z])/)[0]}</span>
        ),
      },
      {
        key: 'copy',
        header: '',
        className: 'col-action',
        render: (e) => (
          <button
            type="button"
            className="audit-copy"
            onClick={() => {
              void copyToClipboard(e.block_hash);
            }}
            title={tAudit('table.blockHashTitle')}
            data-testid={`audit-copy-${e.event_id}`}
          >
            {tAudit('table.copy')}
          </button>
        ),
      },
      {
        key: 'verify',
        header: tAudit('table.verifyHeader'),
        className: 'col-verify',
        render: (e) => {
          const state = verifyStates.get(e.event_id) ?? { status: 'idle' };

          if (state.status === 'ok') {
            return (
              <span
                className="audit-verify audit-verify--ok"
                data-testid={`audit-verify-${e.event_id}`}
                title={tAudit('table.verifyOkTitle')}
                aria-label={tAudit('table.verifyOkAria')}
              >
                <span aria-hidden="true">{'\u2713\uFE0E'}</span>
                {tAudit('table.verifyOk')}
              </span>
            );
          }
          if (state.status === 'fail') {
            return (
              <span
                className="audit-verify audit-verify--fail"
                data-testid={`audit-verify-${e.event_id}`}
                title={tAudit(`table.verifyFail.${state.reason}.title`)}
                aria-label={tAudit(`table.verifyFail.${state.reason}.aria`)}
              >
                <span aria-hidden="true">{'\u26A0\uFE0E'}</span>
                {tAudit('table.verifyFail.label')}
              </span>
            );
          }
          if (state.status === 'pending') {
            return (
              <span
                className="audit-verify audit-verify--pending"
                data-testid={`audit-verify-${e.event_id}`}
                aria-label={tAudit('table.verifyPendingAria')}
              >
                {tAudit('table.verifyPending')}
              </span>
            );
          }

          // idle — show the Verify button.
          return (
            <button
              type="button"
              className="audit-verify-btn"
              onClick={() => {
                void onVerifyRow(e.event_id, e.block_hash);
              }}
              title={tAudit('table.verifyButtonTitle')}
              data-testid={`audit-verify-btn-${e.event_id}`}
            >
              {tAudit('table.verify')}
            </button>
          );
        },
      },
    ],
    [formatTime, tAudit, verifyStates, onVerifyRow],
  );

  return (
    <Container width={ContainerWidth.Wide}>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{tAudit('header.title')}</h1>
            <p className="page-header__sub" data-testid="audit-log-summary">
              {rangeActive
                ? tAudit('header.summaryWithRange', {
                    visible: visible.length,
                    total: events.length,
                    height: chainHead?.height ?? tAudit('header.heightEmDash'),
                  })
                : tAudit('header.summaryFull', {
                    total: events.length,
                    height: chainHead?.height ?? tAudit('header.heightEmDash'),
                  })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button variant="secondary" size="md">
              {tAudit('actions.exportCsv')}
            </Button>
            <Button variant="secondary" size="md">
              {tAudit('actions.exportPdf')}
            </Button>
          </div>
        </div>
      </div>

      {/* Chain head banner */}
      {chainHead && (
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 'var(--space-lg)',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--fg-default)',
                }}
              >
                {tAudit('chainHead.headLabel')}
                {chainHead.height}
                {' · '}
                <span data-testid="chain-head-hash">
                  {chainHead.block_hash ? truncateHash(chainHead.block_hash) : tAudit('table.actorEmDash')}
                </span>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--fg-tertiary)',
                  marginTop: 'var(--space-xs)',
                }}
              >
                {tAudit('chainHead.prevLabel')}{' '}
                {chainHead.prev_hash ? truncateHash(chainHead.prev_hash) : tAudit('table.actorEmDash')}
                {chainHead.sealed_at
                  ? `${tAudit('chainHead.sealedLabel')}${formatTime('time-full', chainHead.sealed_at)}`
                  : ''}
                {tAudit('chainHead.rootOk')}
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--fg-tertiary)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--fg-default)',
                }}
              >
                {events.length}
              </div>
              <div>{tAudit('chainHead.eventsTotal')}</div>
            </div>
            <div
              style={{
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--fg-tertiary)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--fg-default)',
                }}
              >
                {chainHead.height}
              </div>
              <div>{tAudit('chainHead.blocks')}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter chips */}
      <div
        className="inbox-toolbar"
        style={{ marginTop: 'var(--space-md)' }}
        role="tablist"
        aria-label={tAudit('filters.ariaLabel')}
        data-testid="audit-filters"
      >
        {CHIPS.map((chip) => (
          <FilterChip
            key={chip.id}
            label={`${tAudit(`filters.${chip.labelKey}`)} ${counts.get(chip.id) ?? 0}`}
            active={filter === chip.id}
            onClick={() => {
              setFilter(chip.id);
            }}
            testId={chip.testId}
          />
        ))}
      </div>

      {/* Date range — two DatePickers + Clear button. AND-combined with chip. */}
      <div className="audit-range" data-testid="audit-range">
        <div>
          <span className="audit-range__label">{tAudit('range.fromLabel')}</span>
          <DatePicker
            value={range.from}
            onChange={(d) => {
              setRange((r) => {
                return { ...r, from: d };
              });
            }}
            testId="audit-range-from"
            aria-label={tAudit('range.fromAria')}
          />
        </div>
        <div>
          <span className="audit-range__label">{tAudit('range.toLabel')}</span>
          <DatePicker
            value={range.to}
            onChange={(d) => {
              setRange((r) => {
                return { ...r, to: d };
              });
            }}
            testId="audit-range-to"
            aria-label={tAudit('range.toAria')}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setRange({ from: null, to: null });
          }}
          disabled={!rangeActive}
          testId="audit-range-clear"
        >
          {tAudit('range.clear')}
        </Button>
      </div>

      {/* Events table */}
      <Card>
        <Table<ChainEvent>
          columns={auditColumns}
          rows={visible}
          rowKey="event_id"
          testId="audit-table"
          loading={loading}
          className="data-table audit-table"
          emptyState={
            rangeActive ? (
              <EmptyState
                icon={<AuditIcon />}
                heading={tAudit('empty.heading')}
                body={tAudit('empty.bodyWithRange')}
              />
            ) : (
              <EmptyState
                icon={<AuditIcon />}
                heading={tAudit('empty.heading')}
                body={tAudit('empty.bodyWithFilter')}
              />
            )
          }
        />
      </Card>
    </Container>
  );
}
