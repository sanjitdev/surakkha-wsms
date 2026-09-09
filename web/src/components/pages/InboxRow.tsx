/**
 * InboxRow.tsx — FE-1.3a page primitive.
 *
 * One row from the dim 6 §4.2 `InboxRow` shape, rendered at
 * `--height-row-comfortable` (56 px). The page passes one row per
 * `IncidentCreated` event from the chain. Severity dot colour is derived
 * from `row.severity` (T3 → danger, T2 → warning, T1 → info, T0 → fg-tertiary).
 *
 * The row body is wrapped in a `<Link>` to `row.href` (typically inbox
 * detail) so the entire row is keyboard-activatable. The trailing action
 * column is rendered as a `<Link>` too so users with mouse focus land on
 * the action, not the row body. Per dim 6 §4.2 + dim 4 Amendment A the
 * Bangla locale bumps row block-padding via the `[data-locale="bn"]` CSS
 * rule on `.data-table--inbox tr` (handled in dashboard.css — no per-row
 * prop).
 */

import { Link } from 'react-router-dom';
import type { InboxRow } from '../../types/inbox';

export interface InboxRowProps {
  row: InboxRow;
  selected: boolean;
  onToggle: () => void;
  testId?: string;
}
function severityClass(severity: InboxRow['severity']): string {
  if (severity === 'T3') return 't3';
  if (severity === 'T2') return 't2';
  if (severity === 'T1') return 't1';
  return 't0';
}
function severityDotColor(severity: InboxRow['severity']): string {
  if (severity === 'T3') return 'var(--danger)';
  if (severity === 'T2') return 'var(--warning)';
  if (severity === 'T1') return 'var(--info)';
  return 'var(--band-medium)';
}
function ownerColor(kind: InboxRow['ownerKind']): string {
  if (kind === 'reporter') return 'var(--success)';
  if (kind === 'tech') return 'var(--brand-500)';
  if (kind === 'system') return 'var(--fg-tertiary)';
  if (kind === 'vendor') return 'var(--warning)';
  return 'var(--brand-500)';
}
export function InboxRow({ row, selected, onToggle, testId }: InboxRowProps) {
  const sev = severityClass(row.severity);
  const isUrgent = row.isUrgent;
  const rowClasses = ['data-table--inbox__tr'];

  if (isUrgent) rowClasses.push('row-urgent');
  if (selected) rowClasses.push('is-selected');
  return (
    <tr
      className={rowClasses.join(' ')}
      data-testid={testId ?? 'inbox-row'}
      data-priority={sev}
      data-read={row.read ? 'true' : 'false'}
    >
      <td className="col-check">
        <input
          type="checkbox"
          aria-label={`Select ${row.title}`}
          checked={selected}
          onChange={onToggle}
          data-testid={`inbox-row-check-${row.id}`}
        />
      </td>
      <td className="col-warn">
        <span
          className="row-severity-dot"
          style={{ background: severityDotColor(row.severity) }}
          aria-hidden="true"
        />
      </td>
      <td className="col-title">
        <Link to={row.href} className="inbox-row__title-link">
          <strong>{row.title}</strong>
          <div className="row-sub">{row.meta}</div>
        </Link>
      </td>
      <td className="col-where">
        <span className="mono">{row.where}</span>
        <div className="row-sub">{row.whereSub}</div>
      </td>
      <td className="col-owner">
        <span
          className="avatar-dot"
          style={{ background: ownerColor(row.ownerKind) }}
          aria-hidden="true"
        >
          {row.ownerName ? row.ownerName.slice(0, 2) : '?'}
        </span>
        {row.ownerName}
      </td>
      <td className="col-status">
        <span className={`badge badge--${sev}`}>{row.severity}</span>
      </td>
      <td className="col-action">
        <Link to={row.action.href}>{row.action.label} →</Link>
      </td>
    </tr>
  );
}
