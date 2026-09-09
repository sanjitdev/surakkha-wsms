import type { DropdownOption } from './Dropdown.types';
import type { KeyboardEvent, MutableRefObject } from 'react';

interface DropdownTriggerProps {
  rootId: string;
  listboxId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  open: boolean;
  activeOptionId: string | undefined;
  disabled: boolean;
  label: string | undefined;
  placeholder: string;
  testId: string;
  /** Label of the currently-selected option, or `undefined` for placeholder. */
  selectedLabel: string | undefined;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => void;
  onToggle: () => void;
}

/**
 * Trigger button — ARIA combobox. Renders ONLY plain text inside the
 * `<button>` so chip × buttons can be rendered as siblings by
 * `DropdownChips` (the chips live above the trigger in multi mode).
 */
export function DropdownTrigger({
  rootId,
  listboxId,
  triggerRef,
  open,
  activeOptionId,
  disabled,
  label,
  placeholder,
  testId,
  selectedLabel,
  onKeyDown,
  onToggle,
}: DropdownTriggerProps) {
  return (
    <button
      id={`${rootId}-trigger`}
      ref={triggerRef}
      type="button"
      role="combobox"
      className="dropdown__trigger"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={activeOptionId}
      aria-disabled={disabled}
      aria-label={label ?? placeholder}
      disabled={disabled}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      data-testid={`${testId}-trigger`}
    >
      <span
        className={
          selectedLabel
            ? 'dropdown__value'
            : 'dropdown__value dropdown__value--placeholder'
        }
      >
        {selectedLabel ?? placeholder}
      </span>
      <span className="dropdown__caret" aria-hidden="true">
        ▾
      </span>
    </button>
  );
}
interface DropdownChipProps<T> {
  values: T[];
  options: DropdownOption<T>[];
  testId: string;
  onRemove: (chipValue: T) => void;
}

/** Renders selected values as removable chips. Independent of the trigger
 *  so chip × buttons are not nested inside the combobox `<button>`. */
export function DropdownChips<T>({ values, options, testId, onRemove }: DropdownChipProps<T>) {
  return (
    <span className="dropdown__chips">
      {values
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is DropdownOption<T> => o !== undefined)
        .map((o) => (
          <span key={String(o.value)} className="dropdown__chip" data-testid={`${testId}-chip-${String(o.value)}`}>
            {o.label}
            <button
              type="button"
              className="dropdown__chip-remove"
              aria-label={`Remove ${o.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(o.value);
              }}
            >
              ×
            </button>
          </span>
        ))}
    </span>
  );
}
