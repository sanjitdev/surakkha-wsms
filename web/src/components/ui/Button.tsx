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
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-testid={testId ?? `button-${variant}`}
    >
      {children}
    </button>
  );
}
