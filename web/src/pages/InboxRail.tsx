/**
 * InboxRail.tsx — WO-010 Inbox Incident Rail (Tier 3 light).
 *
 * Composition root for the right-rail sub-cards (SeverityRail,
 * AwaitingActionRail, RecentDecisionsRail) consumed by InboxList.tsx.
 * Adds the WO-010 InboxIncidentRail — a 240 px compact ranked-incident
 * list per foundation §3.2.
 *
 * Lockdown cascade 2026-09-11:
 *   - Hbar colours map to the lockdown palette. T3 in operator chrome
 *     is amber-bright (NOT alert-red-reserved); alert-red is reserved
 *     for the consumer-notice issuance path only.
 *   - T1 = divider neutral (not legacy sky-blue --info).
 *   - AwaitingActionRail shows a reporter-badge column per row
 *     (anchor / hotline / webform / sensor) so the source attribute
 *     is visible without conflating it with the trust band.
 *   - InboxIncidentRail pairs a compact BandPill (glyph only) with an
 *     icon-only ReporterBadge so 5+ rows fit the 240 px rail width.
 *     Trust band is a SEPARATE dimension from the reporter badge
 *     (foundation §1.1).
 *
 * URL sync (REQ-002) + navigation (REQ-003):
 *   InboxIncidentRail reads `?selected=<incident_id>` on mount and
 *   syncs the selected incident back to the URL when the operator
 *   clicks a row. Clicking a row navigates to `/inbox/:id` via
 *   react-router; the parent InboxDetail reads the URL parameter to
 *   pick which incident to render in the right pane.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { BandPill } from '../components/ui/BandPill';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import { Band, type ReporterKind } from '../types/domain';
import type { InboxRow } from '../types/inbox';
import type { RecentDecision } from './inboxListModel';
import { useRelativeTime } from '../hooks/useRelativeTime';

interface HbarProps {
  label: string;
  value: number;
  total: number;
  colour: string;
  last?: boolean;
}
function Hbar({ label, value, total, colour, last }: HbarProps) {
  const pct = Math.round((value / total) * 100);

  return (
    <div className="hbar-row" style={last ? { marginBottom: 0 } : undefined}>
      <span className="hbar-label">{label}</span>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${pct}%`, background: colour }} />
      </div>
      <span className="hbar-value mono">
        {value} / {total}
      </span>
    </div>
  );
}
interface SevProps {
  T3: number;
  T2: number;
  T1: number;
  T0: number;
  total: number;
}
export function SeverityRail({ T3, T2, T1, T0, total }: SevProps) {
  const { t } = useTranslation('inboxCommon');
  // Lockdown cascade 2026-09-11: Hbar colours map to lockdown palette.
  // T3 in operator chrome is amber-bright (NOT alert-red-reserved);
  // alert-red is reserved for the consumer-notice issuance path.
  // T1 = divider neutral (not legacy sky-blue --info).
  return (
    <Card heading={t('severityRail.heading')}>
      <Hbar label={t('severityRail.t3')} value={T3} total={total} colour="var(--color-amber-bright)" />
      <Hbar label={t('severityRail.t2')} value={T2} total={total} colour="var(--color-amber)" />
      <Hbar label={t('severityRail.t1')} value={T1} total={total} colour="var(--color-trust-t1)" />
      <Hbar label={t('severityRail.t0')} value={T0} total={total} colour="var(--color-divider)" last />
    </Card>
  );
}
export function AwaitingActionRail({ rows }: { rows: InboxRow[] }) {
  const { t } = useTranslation('inboxCommon');
  const top = rows.slice(0, 2);

  return (
    <Card heading={t('awaitingActionRail.heading')} modifier="with-heading">
      <table className="data-table" style={{ fontSize: 'var(--font-size-xs)', width: '100%' }}>
        <tbody>
          {top.map((r) => (
            <tr key={r.id} data-testid={`awaiting-action-row-${r.id}`}>
              <td className="col-warn">
                <span
                  className={`row-severity-dot ${r.severity === 'T3' ? 'is-t3' : 'is-t2'}`}
                  aria-hidden="true"
                />
              </td>
              <td>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>
                  {r.severity === 'T3'
                    ? t('awaitingActionRail.citizenAckNeeded')
                    : t('awaitingActionRail.sendDraft')}
                </strong>
                <div className="row-sub">
                  {r.where} · {r.severity}
                </div>
              </td>
              {/* WO-010 REQ-004 — reporter-badge column per awaiting
                  action row so the source attribute is identifiable
                  without conflating with the trust band (foundation
                  §1.1 + inbox-rail.md §4 #3). The shared ReporterBadge
                  reuses the WO-006 styling. */}
              <td className="col-reporter" style={{ width: 1, whiteSpace: 'nowrap' }}>
                <ReporterBadge
                  kind={r.reporterKind}
                  i18nNamespace="inboxCommon"
                  i18nKeyPrefix="severityRail"
                  iconOnly
                  testId={`awaiting-action-reporter-${r.id}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
export function RecentDecisionsRail({ recent }: { recent: RecentDecision[] }) {
  const { t } = useTranslation('inboxCommon');
  return (
    <Card heading={t('recentDecisionsRail.heading')} modifier="with-heading">
      <ul className="recent-decisions">
        {recent.length === 0 ? (
          /*
           * Empty state: when no recent decisions exist, drop the time
           * slot entirely. Previously the empty row showed "—" in the
           * time column + "No decisions yet" in the text column, which
           * read as an orphaned em-dash floating next to the message.
           * Collapsing to a single muted line keeps the rail tidy.
           */
          <li className="recent-decisions__empty">
            <span className="recent-decisions__text">{t('recentDecisionsRail.emptyText')}</span>
          </li>
        ) : (
          recent.map((d, i) => (
            <li key={i}>
              <span className="recent-decisions__time mono">{d.time}</span>
              <span className="recent-decisions__text">
                <strong>{d.verb}</strong> {d.target}
              </span>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

/**
 * WO-010 — InboxIncidentRail.
 *
 * 240 px compact rail listing the top-N ranked incidents (priority
 * first, age second — caller passes already-sorted rows). Each row
 * shows a compact BandPill (glyph only) + icon-only ReporterBadge +
 * age + incident title. Selection state syncs to ?selected=<id>; a
 * row click navigates to /inbox/:id so the parent InboxDetail picks
 * the matching incident.
 */
export interface InboxIncidentRailProps {
  /** Already-sorted rows (priority-first / age-second). Caller owns
   *  the sort — the rail just renders in order. */
  rows: InboxRow[];
  /** Cap the rail at N rows so it never overflows its 240 px column. */
  maxRows?: number;
}
export function InboxIncidentRail({ rows, maxRows = 5 }: InboxIncidentRailProps) {
  const { t } = useTranslation('inboxCommon');
  const { formatRelative } = useRelativeTime();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // REQ-002: selection state syncs to URL ?selected=<incident_id>.
  // Pre-populates from URL on mount; clicks update both state + URL.
  const selectedId = searchParams.get('selected') ?? null;
  const [, setLocalSelected] = useState<string | null>(selectedId);

  // REQ-002 — keep local state in sync if the URL changes externally
  // (back / forward navigation, parent re-mount, etc.).
  useEffect(() => {
    setLocalSelected(selectedId);
  }, [selectedId]);

  const visibleRows = useMemo(() => rows.slice(0, maxRows), [rows, maxRows]);

  const handleSelect = useCallback(
    (row: InboxRow): void => {
      const next = new URLSearchParams(searchParams.toString());

      next.set('selected', row.id);
      setSearchParams(next, { replace: true });
      setLocalSelected(row.id);
      // REQ-003 — click navigates to detail.
      navigate(`/inbox/${row.id}`);
    },
    [navigate, searchParams, setSearchParams],
  );

  // Map severity → Band for the compact BandPill.
  function bandFor(severity: InboxRow['severity']): Band {
    if (severity === 'T3') return Band.Low;
    if (severity === 'T2') return Band.Medium;
    return Band.High;
  }

  // Reporter-badge aria-label reuse — pull the localised label from
  // the same i18n namespace so EN + BN both render plain language.
  const reporterLabel = (kind: ReporterKind): string => {
    const labels: Record<ReporterKind, string> = {
      anchor: t('awaitingActionRail.heading', { defaultValue: 'Anchor' }),
      hotline: t('awaitingActionRail.heading', { defaultValue: 'Hotline' }),
      webform: t('awaitingActionRail.heading', { defaultValue: 'Webform' }),
      sensor: t('awaitingActionRail.heading', { defaultValue: 'Sensor' }),
    };

    return labels[kind];
  };

  return (
    <Card
      heading={t('inboxIncidentRail.heading')}
      modifier="with-heading"
      ariaLabel={t('inboxIncidentRail.railLabel')}
      testId="inbox-incident-rail"
    >
      <ul
        className="inbox-rail"
        data-testid="inbox-rail-list"
        role="list"
        aria-label={t('inboxIncidentRail.railLabel')}
      >
        {visibleRows.length === 0 ? (
          <li className="inbox-rail__empty" data-testid="inbox-rail-empty">
            {t('inboxIncidentRail.empty')}
          </li>
        ) : (
          visibleRows.map((r) => {
            const isSelected = r.id === selectedId;

            return (
              <li key={r.id} role="listitem">
                <button
                  type="button"
                  className={`inbox-rail__row${isSelected ? ' is-selected' : ''}`}
                  data-testid={`inbox-rail-row-${r.id}`}
                  data-selected={isSelected ? 'true' : 'false'}
                  aria-pressed={isSelected}
                  aria-label={t('inboxIncidentRail.rowAriaLabel', {
                    title: r.title,
                    severity: r.severity,
                    reporter: reporterLabel(r.reporterKind),
                  })}
                  onClick={() => {
                    handleSelect(r);
                  }}
                >
                  <BandPill band={bandFor(r.severity)} locked compact testId={`inbox-rail-band-${r.id}`} />
                  <ReporterBadge
                    kind={r.reporterKind}
                    i18nNamespace="inboxList"
                    i18nKeyPrefix="reporterBadge"
                    iconOnly
                    testId={`inbox-rail-reporter-${r.id}`}
                  />
                  <span className="inbox-rail__row-title">{r.title}</span>
                  <span
                    className="inbox-rail__row-age"
                    data-testid={`inbox-rail-age-${r.id}`}
                    title={r.timestamp}
                  >
                    {formatRelative(r.timestamp)}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
