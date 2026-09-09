import type { ReactNode } from 'react';

export interface TopChromeProps {
  personaLabel: string;
  /** Brand label in the left slot. Defaults to "Surakkha"; pass to override. */
  brand?: string;
  chainFreshSeconds?: number;
  navSlot?: ReactNode;
  testId?: string;
}
export function TopChrome({
  personaLabel,
  brand = 'Surakkha',
  chainFreshSeconds,
  navSlot,
  testId,
}: TopChromeProps) {
  return (
    <header className="top-chrome" data-testid={testId ?? 'top-chrome'}>
      <div className="top-chrome__left">
        <span className="top-chrome__brand">{brand}</span>
        <span className="top-chrome__sep" aria-hidden="true">
          ·
        </span>
        <span className="top-chrome__chain">
          <span className="pulse-dot" aria-hidden="true" />
          <span className="mono">
            chain {chainFreshSeconds !== undefined ? `${chainFreshSeconds}s` : 'fresh'}
          </span>
        </span>
      </div>
      {navSlot ? <div className="top-chrome__nav">{navSlot}</div> : null}
      <div className="top-chrome__right">
        <span className="top-chrome__persona" data-testid="persona-chip">
          {personaLabel}
        </span>
      </div>
    </header>
  );
}
