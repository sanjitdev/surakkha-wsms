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
}
export function Button({
  variant,
  size,
  children,
  onClick,
  type = 'button',
  disabled = false,
  testId,
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId ?? `button-${variant}`}
    >
      {children}
    </button>
  );
}
