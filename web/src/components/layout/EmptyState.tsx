import { type ReactNode, createElement, useId } from 'react';

export interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  body?: string;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  testId?: string;
}
export function EmptyState({
  icon,
  heading,
  body,
  primaryCta,
  secondaryCta,
  headingLevel = 2,
  testId,
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section
      className="empty-state card card--with-heading"
      data-testid={testId ?? 'empty-state'}
      aria-labelledby={headingId}
    >
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      {createElement(
        `h${headingLevel}`,
        { className: 'empty-state__title', id: headingId },
        heading,
      )}
      {body ? <p className="empty-state__sub">{body}</p> : null}
      {(primaryCta !== undefined || secondaryCta !== undefined) && (
        <div className="empty-state__ctas">
          {primaryCta}
          {secondaryCta}
        </div>
      )}
    </section>
  );
}
