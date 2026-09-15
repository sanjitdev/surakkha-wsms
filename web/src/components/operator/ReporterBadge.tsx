/**
 * ReporterBadge.tsx — WO-006 (field-queue) shared chip.
 *
 * Lockdown-bound per docs/D-UX-Design/01-design-system-foundation.md §1.1
 * and §6.2. Renders one of four source-attribute chips (anchor / hotline /
 * webform / sensor). Source attribute is a SEPARATE dimension from trust
 * band — never collapse into a single chip or colour.
 *
 * Colour follows lockdown-bridge.css `.chip-reporter-{kind}` (token
 * bridge to --color-reporter-*); text comes from the active locale's
 * i18n namespace so both EN + BN render plain language.
 *
 * Usage: shared between operator-dashboard (Tier 2) and field-queue (Tier 2)
 * per field-queue.md diff #4 + operator-dashboard.md #9.
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
   * WO-010 (inbox-rail) — icon-only rendering for the 240 px rail.
   * Hides the visible text label so the chip fits within ~24 px wide
   * alongside the compact BandPill. The aria-label + title still carry
   * the full text for screen-reader + tooltip access (foundation §10.4).
   */
  iconOnly?: boolean;
}

/**
 * Inline SVG glyphs per lockdown §6.2 — Lucide-style 14×14.
 * Implemented inline (no extra dependency) so the field-queue
 * page doesn't pull another icon import.
 */
const ReporterAnchorGlyph = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22V8" />
    <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
    <circle cx="12" cy="5" r="3" />
  </svg>
);

const ReporterPhoneGlyph = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const ReporterWebformGlyph = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M9 14h6" />
  </svg>
);

const ReporterSensorGlyph = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M3 12h3" />
    <path d="M18 12h3" />
    <path d="M12 3v3" />
    <path d="M12 18v3" />
  </svg>
);

const GLYPH: Record<ReporterKind, () => JSX.Element> = {
  anchor: ReporterAnchorGlyph,
  hotline: ReporterPhoneGlyph,
  webform: ReporterWebformGlyph,
  sensor: ReporterSensorGlyph,
};

const KIND_LABEL_KEY: Record<ReporterKind, string> = {
  anchor: 'anchor',
  hotline: 'hotline',
  webform: 'webform',
  sensor: 'sensor',
};

/**
 * ReporterBadge — chip showing the source attribute of an incident.
 * Renders an icon + label (text + colour, never colour-only per
 * foundation §1.1).
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
  const Glyph = GLYPH[kind];
  const label = t(`${i18nKeyPrefix}.${KIND_LABEL_KEY[kind]}`);
  const compactClass = iconOnly ? ' reporter-badge-chip--icon-only' : '';

  return (
    <span
      className={`chip chip-reporter-${kind} badge--reporter-${kind} reporter-badge-chip${compactClass}${className ? ` ${className}` : ''}`}
      data-testid={testId ?? `field-queue-reporter-badge-chip-${kind}`}
      data-icon-only={iconOnly ? 'true' : undefined}
      data-reporter-kind={kind}
      aria-label={`Reporter: ${label}`}
      title={label}
    >
      <Glyph />
      {iconOnly ? null : <span>{label}</span>}
    </span>
  );
}
