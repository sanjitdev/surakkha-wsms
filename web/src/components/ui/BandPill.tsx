import { Band } from '../../types/domain';

export interface BandPillProps {
  band: Band;
  testId?: string;
}
const ICONS: Record<Band, string> = {
  [Band.High]: '\u26A0',
  [Band.Medium]: '\u2296',
  [Band.Low]: '\u24D8',
};

export function BandPill({ band, testId }: BandPillProps) {
  const className = band.toLowerCase();
  const icon = ICONS[band];

  return (
    <span
      className={`band-pill band-pill--${className}`}
      data-testid={testId ?? `band-pill-${className}`}
      aria-label={`${band} trust band`}
    >
      <span className="band-pill__icon" aria-hidden="true">{icon}</span>
      <span>{band.toUpperCase()}</span>
    </span>
  );
}
