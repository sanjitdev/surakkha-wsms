/**
 * InboxRail.tsx — Composition root for the right-rail sub-cards
 * (SeverityRail, AwaitingActionRail, RecentDecisionsRail) consumed
 * by InboxList.tsx.
 *
 * WO-020 — InboxIncidentRail (the WO-010 240 px ranked-incident list)
 * was removed: it duplicated the Action queue table (both render the
 * same priority-sorted incidents) and competed for vertical space.
 * Action queue is now the single source of truth for ranked incidents;
 * the right rail keeps only complementary information (severity
 * breakdown, awaiting actions, recent decisions).
 *
 * Lockdown cascade 2026-09-11:
 *   - Hbar colours map to the lockdown palette. T3 in operator chrome
 *     is amber-bright (NOT alert-red-reserved); alert-red is reserved
 *     for the consumer-notice issuance path only.
 *   - T1 = divider neutral (not legacy sky-blue --info).
 *   - AwaitingActionRail shows a reporter-badge column per row
 *     (anchor / hotline / webform / sensor) so the source attribute
 *     is visible without conflating it with the trust band.
 */

import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { ReporterBadge } from '../components/operator/ReporterBadge';
import type { InboxRow } from '../types/inbox';
import type { RecentDecision } from './inboxListModel';

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
