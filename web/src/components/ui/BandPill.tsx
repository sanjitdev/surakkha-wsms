import { useTranslation } from 'react-i18next';
import { Band } from '../../types/domain';

export interface BandPillProps {
  band: Band;
  testId?: string;
  /**
   * Lockdown binding (added 2026-09-11).
   * When true, renders with the bmad lockdown palette + glyph characters
   * per docs/D-UX-Design/01-design-system-foundation.md §1.1.
   * Default false = legacy palette (Phase 1.6a).
   * Progressive migration: legacy mode stays for existing consumers.
   */
  locked?: boolean;
  /**
   * WO-010 (inbox-rail) — compact rendering for the 240 px rail.
   * Hides the text label and shows only the glyph so 5+ rows fit in a
   * narrow column without overflow. Glyph + tooltip keeps the trust
   * band accessible per foundation §10.4.
   */
  compact?: boolean;
}
const ICONS: Record<Band, string> = {
  [Band.High]: '\u26A0',
  [Band.Medium]: '\u2296',
  [Band.Low]: '\u24D8',
};
// Lockdown glyph characters per foundation §4.1
const LOCKED_ICONS: Record<Band, string> = {
  [Band.High]: '\u25D0',   // ◐ — verified tier glyph (T2)
  [Band.Medium]: '\u25D1', // ◑ — verified glyph
  [Band.Low]: '\u25D2',    // ◒ — reserved
};
const LOCKED_CLASS: Record<Band, string> = {
  [Band.High]: 'band-pill--t1-locked',
  [Band.Medium]: 'band-pill--t2-locked',
  [Band.Low]: 'band-pill--t3-locked',
};
const LOCKED_LABEL: Record<Band, string> = {
  [Band.High]: 'T1 unverified',
  [Band.Medium]: 'T2 verified',
  [Band.Low]: 'T3 issuance',
};

export function BandPill({ band, testId, locked = false, compact = false }: BandPillProps) {
  if (locked) {
    const className = LOCKED_CLASS[band];
    const icon = LOCKED_ICONS[band];
    const label = LOCKED_LABEL[band];
    const compactClass = compact ? ' band-pill--compact' : '';

    return (
      <span
        className={`band-pill ${className}${compactClass}`}
        data-testid={testId ?? `band-pill-${className}`}
        data-compact={compact ? 'true' : undefined}
        aria-label={`${label} trust band (lockdown palette)`}
      >
        <span className="band-pill__icon" aria-hidden="true">
          {icon}
        </span>
        {compact ? null : <span>{label}</span>}
      </span>
    );
  }

  // Legacy rendering (Phase 1.6a) — preserved for existing consumers
  const className = band.toLowerCase();
  const icon = ICONS[band];
  const { t } = useTranslation();
  // band.* is lower-case (high / medium / low); ariaTrustBand interpolates {{band}}.
  const bandLabel = t(`common:band.${className}`, { defaultValue: className });
  const ariaLabel = t('common:band.ariaTrustBand', {
    band: bandLabel,
    defaultValue: `${className} trust band`,
  });

  return (
    <span
      className={`band-pill band-pill--${className}`}
      data-testid={testId ?? `band-pill-${className}`}
      aria-label={ariaLabel}
    >
      <span className="band-pill__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{band.toUpperCase()}</span>
    </span>
  );
}
