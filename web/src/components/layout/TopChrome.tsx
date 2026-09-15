import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface TopChromeProps {
  personaLabel: string;
  /** Brand label in the left slot. Defaults to the `layout:topChrome.brand` key. */
  brand?: string;
  chainFreshSeconds?: number;
  navSlot?: ReactNode;
  testId?: string;
}
export function TopChrome({
  personaLabel,
  brand,
  chainFreshSeconds,
  navSlot,
  testId,
}: TopChromeProps) {
  const { t } = useTranslation();

  // Brand: prop wins; otherwise the localised brand from the layout NS.
  const resolvedBrand = brand ?? t('layout:topChrome.brand', { defaultValue: 'Surakkha' });
  // chain label: deterministic from `chainFreshSeconds` (number when known,
  // undefined while the first poll is in flight → "fresh").
  const chainLabel =
    chainFreshSeconds !== undefined
      ? t('layout:topChrome.chainSeconds', { seconds: chainFreshSeconds })
      : t('layout:topChrome.chainFresh');

  return (
    <header className="top-chrome" data-testid={testId ?? 'top-chrome'}>
      <div className="top-chrome__left">
        <span className="top-chrome__brand">{resolvedBrand}</span>
        <span className="top-chrome__sep" aria-hidden="true">
          ·
        </span>
        <span className="top-chrome__chain">
          <span className="pulse-dot" aria-hidden="true" />
          <span className="mono">{chainLabel}</span>
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
