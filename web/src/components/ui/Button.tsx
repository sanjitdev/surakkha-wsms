import '../../styles/components.css';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  testId?: string;
  /**
   * Tooltip / native title text. Rendered as the `title` attribute so
   * the browser shows it on hover. Used by Phase 2 placeholders
   * (e.g. "Escalate to Pia" disabled button) to convey availability
   * without blocking the click.
   */
  title?: string;
  /**
   * Optional className appended to the base button class. Used by
   * consumers that need to attach ephemeral state classes — e.g.
   * WO-012 citizen-ack's 200ms green pulse on the Confirm button
   * (applied on focus/hover, removed after the animation finishes).
   */
  className?: string;
  onFocus?: ButtonHTMLAttributes<HTMLButtonElement>['onFocus'];
  onMouseEnter?: ButtonHTMLAttributes<HTMLButtonElement>['onMouseEnter'];
}
export function Button({
  variant,
  size,
  children,
  onClick,
  type = 'button',
  disabled = false,
  testId,
  title,
  className,
  onFocus,
  onMouseEnter,
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size}${className ? ` ${className}` : ''}`}
      type={type}
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      title={title}
      data-testid={testId ?? `button-${variant}`}
    >
      {children}
    </button>
  );
}
