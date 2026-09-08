import { type ReactNode, useId } from 'react';

export interface CardProps {
  children: ReactNode;
  heading?: string;
  modifier?: 'with-heading' | 'compact';
  testId?: string;
}
export function Card({ children, heading, modifier, testId }: CardProps) {
  const modifierClass = modifier ? ` card--${modifier}` : '';
  const headingId = useId();

  return (
    <section
      className={`card${modifierClass}`}
      data-testid={testId ?? 'card'}
      aria-labelledby={heading ? headingId : undefined}
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
