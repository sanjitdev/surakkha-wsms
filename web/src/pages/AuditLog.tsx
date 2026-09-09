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
import { useEffect, useMemo, useState } from 'react';
import '../../mockups/01-priya/dashboard.css';
import '../styles/audit.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/layout/EmptyState';
import { FilterChip } from '../components/pages/FilterChip';
import { Button } from '../components/ui/Button';
import { AuditIcon } from '../components/icons/sidebar-icons';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';

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
  label: string;
  testId: string;
  match: (e: ChainEvent) => boolean;
}
const CHIPS: readonly ChipDef[] = [
  { id: 'all', label: 'All events', testId: 'chip-all', match: () => true },
  {
    id: 'errors',
    label: 'Errors',
    testId: 'chip-errors',
    match: (e) => /escalated|failed|breach|tamper/i.test(e.event_type),
  },
  {
    id: 'signatures',
    label: 'Signatures',
    testId: 'chip-sig',
    match: (e) => /Signature|Attestation|Endorsement|Acknowledgement/i.test(e.event_type),
  },
  {
    id: 'sensor',
    label: 'Sensor data',
    testId: 'chip-sensor',
    match: (e) => e.event_type === 'SensorReadingSubmitted',
  },
  {
    id: 'citizen',
    label: 'Citizen reports',
    testId: 'chip-citizen',
    match: (e) => /Citizen|CitizenComplaint/i.test(e.event_type),
  },
  {
    id: 'notices',
    label: 'Notices',
    testId: 'chip-notices',
    match: (e) => /PublicNotice/i.test(e.event_type),
  },
  {
    id: 'auth',
    label: 'Auth',
    testId: 'chip-auth',
    match: (e) => /Login|Logout|Session/i.test(e.event_type),
  },
];

function formatTime(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleTimeString('en-GB', { hour12: false });
}
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
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [loading, setLoading] = useState(true);

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

    return events.filter(chip.match);
  }, [events, filter]);

  return (
    <Container width={ContainerWidth.Wide}>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>Audit log</h1>
            <p className="page-header__sub" data-testid="audit-log-summary">
              {events.length} events · chain head block #{chainHead?.height ?? '—'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button variant="secondary" size="md">
              Export CSV
            </Button>
            <Button variant="secondary" size="md">
              Export PDF
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
                Chain head · block #{chainHead.height} ·{' '}
                <span data-testid="chain-head-hash">
                  {chainHead.block_hash ? truncateHash(chainHead.block_hash) : '—'}
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
                prev {chainHead.prev_hash ? truncateHash(chainHead.prev_hash) : '—'}
                {chainHead.sealed_at ? ` · sealed ${formatTime(chainHead.sealed_at)}` : ''}
                {' · root ok'}
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
              <div>events total</div>
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
              <div>blocks</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter chips */}
      <div
        className="inbox-toolbar"
        style={{ marginTop: 'var(--space-md)' }}
        role="tablist"
        aria-label="Filter audit log"
        data-testid="audit-filters"
      >
        {CHIPS.map((chip) => (
          <FilterChip
            key={chip.id}
            label={`${chip.label} ${counts.get(chip.id) ?? 0}`}
            active={filter === chip.id}
            onClick={() => {
              setFilter(chip.id);
            }}
            testId={chip.testId}
          />
        ))}
      </div>

      {/* Events table */}
      <Card>
        {loading ? (
          <div data-testid="audit-loading">Loading…</div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<AuditIcon />}
            heading="No matching events"
            body="No events match the current filter. Reset to ‘All events’ to see the full chain."
          />
        ) : (
          <table
            className="data-table audit-table"
            data-testid="audit-table"
            aria-label="Audit events"
          >
            <thead>
              <tr>
                <th className="col-time">Time</th>
                <th aria-label="Severity" className="col-warn"></th>
                <th>Event</th>
                <th className="col-where">Ward / chain-ref</th>
                <th>Actor</th>
                <th className="col-status">Type</th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const ward = (e.payload as { ward_id?: string }).ward_id ?? '—';

                return (
                  <tr
                    key={e.event_id}
                    className="data-table--inbox__tr audit-row"
                    data-testid={`audit-row-${e.event_id}`}
                  >
                    <td className="col-time mono">{formatTime(e.occurred_at)}</td>
                    <td className="col-warn">
                      <span
                        className="row-severity-dot"
                        style={{
                          background: e.event_type.includes('Error')
                            ? 'var(--danger)'
                            : 'var(--success)',
                        }}
                        aria-hidden="true"
                      />
                    </td>
                    <td>
                      <strong>{e.event_type}</strong>
                      <div
                        className="row-sub"
                        style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-xs)' }}
                      >
                        block #{e.height}
                      </div>
                    </td>
                    <td className="col-where">
                      <span className="mono">{ward}</span>
                      <div className="row-sub mono" style={{ fontSize: 'var(--font-size-xs)' }}>
                        {truncateHash(e.block_hash)}
                      </div>
                    </td>
                    <td className="mono">{e.actor_identity?.display ?? '—'}</td>
                    <td>
                      <span className="badge badge--tier">
                        {e.event_type.split(/(?=[A-Z])/)[0]}
                      </span>
                    </td>
                    <td className="col-action">
                      <button
                        type="button"
                        className="audit-copy"
                        onClick={() => {
                          void copyToClipboard(e.block_hash);
                        }}
                        title="Copy block hash"
                        data-testid={`audit-copy-${e.event_id}`}
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </Container>
  );
}
