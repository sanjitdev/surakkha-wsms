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
  /**
   * Audit attribute (added 2026-09-16, FE-1.5d reconciliation).
   * When provided, mirrors the wire severity tier (T1 / T2 / T3) onto
   * the rendered element for downstream tooling + assertions without
   * leaking the code into operator-visible text. The text content is
   * always the resolved label (Pending / Verified / Issuance /
   * Resolved) per the i18n keys `common:band.tier.T1..T3`. T1 was
   * renamed from "Unverified" → "Pending" (FE-1.5d, 2026-09-16) so the
   * T1 pill fits inside the 170 px severity column without clipping;
   * the semantics still align with foundation §1.1 "divider neutral".
   */
  'data-band'?: string;
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
// Lockdown labels are resolved through i18n (common:band.tier.T1/T2/T3/resolved)
// so the operator surface shows human-readable status (Pending /
// Verified / Issuance / Resolved) instead of the tier code. Internal
// data model still uses T1/T2/T3 — the codes drive the colour bridge
// (.band-pill--t1-locked etc.) and the priority-first sort (foundation
// §1.1) but never appear in operator-visible text.
const LOCKED_I18N_KEY: Record<Band, string> = {
  [Band.High]: 'band.tier.T1',
  [Band.Medium]: 'band.tier.T2',
  [Band.Low]: 'band.tier.T3',
};

export function BandPill({ band, testId, locked = false, compact = false, 'data-band': dataBand }: BandPillProps) {
  const { t } = useTranslation();
  if (locked) {
    const className = LOCKED_CLASS[band];
    const icon = LOCKED_ICONS[band];
    const label = t(`common:${LOCKED_I18N_KEY[band]}`);
    const compactClass = compact ? ' band-pill--compact' : '';

    return (
      <span
        className={`band-pill ${className}${compactClass}`}
        data-testid={testId ?? `band-pill-${className}`}
        data-band={dataBand}
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
      data-band={dataBand}
      aria-label={ariaLabel}
    >
      <span className="band-pill__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{band.toUpperCase()}</span>
    </span>
  );
}
