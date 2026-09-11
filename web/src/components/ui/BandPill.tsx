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

export function BandPill({ band, testId, locked = false }: BandPillProps) {
  if (locked) {
    const className = LOCKED_CLASS[band];
    const icon = LOCKED_ICONS[band];
    const label = LOCKED_LABEL[band];

    return (
      <span
        className={`band-pill ${className}`}
        data-testid={testId ?? `band-pill-${className}`}
        aria-label={`${label} trust band (lockdown palette)`}
      >
        <span className="band-pill__icon" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </span>
    );
  }

  // Legacy rendering (Phase 1.6a) — preserved for existing consumers
  const className = band.toLowerCase();
  const icon = ICONS[band];

  return (
    <span
      className={`band-pill band-pill--${className}`}
      data-testid={testId ?? `band-pill-${className}`}
      aria-label={`${band} trust band`}
    >
      <span className="band-pill__icon" aria-hidden="true">
        {icon}
      </span>
      <span>{band.toUpperCase()}</span>
    </span>
  );
}
