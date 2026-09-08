import type {
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

export interface InputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  testId?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  disabled?: boolean;
  'aria-label'?: string;
}
export function Input({
  value,
  onChange,
  placeholder,
  size = 'md',
  icon,
  testId,
  type = 'text',
  disabled = false,
  'aria-label': ariaLabel,
}: InputProps) {
  if (icon) {
    return (
      <div className={`input-wrap input-wrap--${size}`}>
        <span className="input-wrap__icon" aria-hidden="true">
          {icon}
        </span>
        <input
          className={`input input--with-icon input--${size}`}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          data-testid={testId ?? `input-icon-${size}`}
        />
      </div>
    );
  }
  return (
    <input
      className={`input input--${size}`}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testId ?? `input-${size}`}
    />
  );
}
export type SearchInputProps = Pick<
  InputProps,
  'value' | 'onChange' | 'placeholder' | 'size' | 'disabled' | 'icon' | 'testId' | 'type'
>;
export function SearchInput({
  value,
  onChange,
  placeholder,
  size,
  disabled,
  icon,
  testId,
  type,
}: SearchInputProps) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size={size}
      disabled={disabled}
      icon={icon}
      testId={testId ?? 'input-search-md'}
      type={type}
      aria-label={placeholder ?? 'search'}
    />
  );
}
