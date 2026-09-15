import { type ReactNode, useId } from 'react';

export interface CardProps {
  children: ReactNode;
  heading?: string;
  modifier?: 'with-heading' | 'compact';
  testId?: string;
  /** foundation §13 — explicit region label for landmark nav. Wins
   *  over `heading` (labelledby) when both are present so callers
   *  can pass an i18n key directly. */
  ariaLabel?: string;
}
export function Card({ children, heading, modifier, testId, ariaLabel }: CardProps) {
  const modifierClass = modifier ? ` card--${modifier}` : '';
  const headingId = useId();

  return (
    <section
      className={`card${modifierClass}`}
      data-testid={testId ?? 'card'}
      aria-label={ariaLabel}
      aria-labelledby={!ariaLabel && heading ? headingId : undefined}
    >
      {heading ? (
        <h3 id={headingId} className="card-heading">
          {heading}
        </h3>
      ) : null}
      {children}
    </section>
  );
}
