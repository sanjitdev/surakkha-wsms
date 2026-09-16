import type { ChangeEventHandler, InputHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface InputProps {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  testId?: string;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  disabled?: boolean;
  /** Native `<datalist>` id for autocomplete suggestions. */
  list?: string;
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
  list,
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
          list={list}
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
      list={list}
      aria-label={ariaLabel}
      data-testid={testId ?? `input-${size}`}
    />
  );
}
export type SearchInputProps = Pick<
  InputProps,
  'value' | 'onChange' | 'placeholder' | 'size' | 'disabled' | 'icon' | 'testId' | 'type' | 'list'
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
  list,
}: SearchInputProps) {
  const { t } = useTranslation();
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
      list={list}
      aria-label={placeholder ?? t('common:input.search', { defaultValue: 'search' })}
    />
  );
}
