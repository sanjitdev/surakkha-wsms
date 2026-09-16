/**
 * ReporterBadge.tsx — WO-006 (field-queue) shared source-attribute mark.
 *
 * Lockdown-bound per docs/D-UX-Design/01-design-system-foundation.md §1.1
 * and §6.2. Renders one of four source-attribute marks (anchor / hotline /
 * webform / sensor) as an avatar-dot + label pair. Source attribute is a
 * SEPARATE dimension from trust band — never collapse into a single chip
 * or colour.
 *
 * Carbonized shape (FO-052ea155, accepted variant 3):
 *   - 16 px mono-typed avatar-dot, single uppercase letter (current
 *     i18n label). Dot border + colour bridge from lockdown-bridge.css
 *     (.reporter-avatar-dot--*).
 *   - Visible label (11px / 14px line-height, weight 500) sits inline.
 *   - No chip shell: no padding, no background, no border on the row.
 *     The dot carries the colour; the label carries the language.
 *
 * `iconOnly` (WO-010 inbox-rail) drops the label, leaving a 16 px dot —
 * the row fits the 240 px rail. aria-label + title carry the full text.
 *
 * Usage: shared between operator-dashboard (Tier 2) and field-queue
 * (Tier 2) per field-queue.md diff #4 + operator-dashboard.md #9.
 */

import { useTranslation } from 'react-i18next';
import type { ReporterKind } from '../../types/domain';

export interface ReporterBadgeProps {
  kind: ReporterKind;
  /** Override the i18n namespace — defaults to `fieldQueue` so the
   *  field-queue page renders localised labels out-of-the-box. */
  i18nNamespace?: string;
  /** Override the i18n key prefix — defaults to `reporterBadge`. */
  i18nKeyPrefix?: string;
  /** Class hook for callers that need to attach their own testid. */
  className?: string;
  testId?: string;
  /**
   * WO-010 (inbox-rail) — label-hidden rendering for the 240 px rail.
   * Drops the visible text label so the mark fits within ~16 px wide
   * alongside the compact BandPill. The aria-label + title still
   * carry the full text for screen-reader + tooltip access
   * (foundation §10.4).
   */
  iconOnly?: boolean;
}

const KIND_LABEL_KEY: Record<ReporterKind, string> = {
  anchor: 'anchor',
  hotline: 'hotline',
  webform: 'webform',
  sensor: 'sensor',
};

/**
 * ReporterBadge — avatar-dot + label showing the source attribute of
 * an incident. Renders a coloured dot + text (never colour-only per
 * foundation §1.1). The carbonized shape has no chip shell; the dot
 * carries the colour and the label carries the language.
 */
export function ReporterBadge({
  kind,
  i18nNamespace = 'fieldQueue',
  i18nKeyPrefix = 'reporterBadge',
  className,
  testId,
  iconOnly = false,
}: ReporterBadgeProps) {
  const { t } = useTranslation(i18nNamespace);
  const label = t(`${i18nKeyPrefix}.${KIND_LABEL_KEY[kind]}`);
  // Initial-letter cap for the dot. Empty label → '·' placeholder so
  // the dot never collapses to a blank 16 px ring (lockdown §6.2:
  // never colour-only / shape-only).
  const initial = label.charAt(0).toUpperCase() || '·';
  const composedClass = [
    'reporter-badge-chip',
    'reporter-badge-chip--avatar',
    `reporter-badge-chip--avatar-${kind}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={composedClass}
      data-testid={testId ?? `field-queue-reporter-badge-chip-${kind}`}
      data-icon-only={iconOnly ? 'true' : undefined}
      data-reporter-kind={kind}
      aria-label={`Reporter: ${label}`}
      title={label}
    >
      <span
        className={`reporter-avatar-dot reporter-avatar-dot--${kind}`}
        aria-hidden="true"
      >
        {initial}
      </span>
      {iconOnly ? null : (
        <span className="reporter-badge-chip__label">{label}</span>
      )}
    </span>
  );
}
