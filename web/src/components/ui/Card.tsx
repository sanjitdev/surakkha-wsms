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
  /** Optional extra classNames appended to `.card`. Used by InboxList
   *  to flag the action-queue card as scrollable (FE-1.5d 2026-09-16)
   *  so the internal pane can drive a viewport-anchored max-height. */
  className?: string;
}
export function Card({ children, heading, modifier, testId, ariaLabel, className }: CardProps) {
  const modifierClass = modifier ? ` card--${modifier}` : '';
  const extraClass = className ? ` ${className}` : '';
  const headingId = useId();

  return (
    <section
      className={`card${modifierClass}${extraClass}`}
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
