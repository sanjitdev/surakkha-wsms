/**
 * InboxRail.tsx — FE-1.5b right-rail composition.
 *
 * The InboxList page renders a 3-card right rail (severity bars +
 * "Awaiting your action" mini-table + "Recent decisions" timeline).
 * Extracting them keeps InboxList under the 200-line epic hard cap.
 *
 * Pure presentational — no hooks, no fetches. The parent passes the
 * derived `sevCounts`, `rows.slice(0, 2)`, and `recent[]` already
 * computed.
 */

import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
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
  return (
    <Card heading={t('severityRail.heading')}>
      <Hbar label={t('severityRail.t3')} value={T3} total={total} colour="var(--danger)" />
      <Hbar label={t('severityRail.t2')} value={T2} total={total} colour="var(--warning)" />
      <Hbar label={t('severityRail.t1')} value={T1} total={total} colour="var(--info)" />
      <Hbar label={t('severityRail.t0')} value={T0} total={total} colour="var(--band-medium)" last />
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
            <tr key={r.id}>
              <td className="col-warn">
                <span
                  className="row-severity-dot"
                  style={{ background: r.severity === 'T3' ? 'var(--danger)' : 'var(--warning)' }}
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
          <li>
            <span className="recent-decisions__time mono">{t('recentDecisionsRail.emptyTime')}</span>
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
