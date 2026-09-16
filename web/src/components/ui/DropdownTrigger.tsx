import type { DropdownOption } from './Dropdown.types';
import type { KeyboardEvent, MutableRefObject } from 'react';

interface DropdownTriggerProps<T> {
  rootId: string;
  listboxId: string;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  open: boolean;
  activeOptionId: string | undefined;
  disabled: boolean;
  /** Accessible name — falls back to `placeholder` when no label prop was
   *  supplied to the parent Dropdown. Always required for ARIA. */
  label: string;
  placeholder: string;
  testId: string;
  /** When true, `aria-controls` lists both the listbox and the search input. */
  searchable?: boolean;
  /** Id of the search input inside the popover; only consulted when `searchable` is true. */
  searchInputId?: string;
  /** Label of the currently-selected option, or `undefined` for placeholder. */
  selectedLabel: string | undefined;
  /** Multi-mode: selected values rendered as chips inside the trigger. */
  isMulti: boolean;
  multiValue: T[];
  options: DropdownOption<T>[];
  /** Remove a single chip value (multi mode). */
  onRemoveChip: (value: T) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => void;
  onToggle: () => void;
}

/**
 * Trigger button — ARIA combobox. Renders chips (multi-mode) + the
 * label/placeholder + caret INSIDE the `<button>` so the whole pill
 * reads as one interactive box. Chip × buttons stopPropagation so the
 * trigger's onClick does not also toggle the popover open.
 *
 * FE-1.5d (2026-09-16): chips moved inside the trigger (used to sit as
 * a sibling above). With chips in-button the operator sees the
 * selection rendered inside the box outline, which is what we want on
 * the inbox toolbar.
 */
export function DropdownTrigger<T>({
  rootId,
  listboxId,
  triggerRef,
  open,
  activeOptionId,
  disabled,
  label,
  placeholder,
  testId,
  searchable,
  searchInputId,
  selectedLabel,
  isMulti,
  multiValue,
  options,
  onRemoveChip,
  onKeyDown,
  onToggle,
}: DropdownTriggerProps<T>) {
  // WAI-ARIA combobox pattern: when `searchable`, the trigger controls
  // BOTH the listbox AND the search input. `aria-controls` accepts
  // space-separated id tokens, so we concatenate both ids.
  const controls = searchable && searchInputId ? `${listboxId} ${searchInputId}` : listboxId;

  const hasChips = isMulti && multiValue.length > 0;

  return (
    <button
      id={`${rootId}-trigger`}
      ref={triggerRef}
      type="button"
      role="combobox"
      className="dropdown__trigger"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={controls}
      aria-activedescendant={activeOptionId}
      aria-disabled={disabled}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      data-testid={`${testId}-trigger`}
    >
      {hasChips ? (
        <span className="dropdown__chips" data-testid={`${testId}-chips`}>
          {multiValue
            .map((v) => options.find((o) => o.value === v))
            .filter((o): o is DropdownOption<T> => o !== undefined)
            .map((o) => (
              <span
                key={String(o.value)}
                className="dropdown__chip"
                data-testid={`${testId}-chip-${String(o.value)}`}
              >
                {o.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${o.label}`}
                  className="dropdown__chip-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveChip(o.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveChip(o.value);
                    }
                  }}
                >
                  ×
                </span>
              </span>
            ))}
        </span>
      ) : (
        <span
          className={
            selectedLabel
              ? 'dropdown__value'
              : 'dropdown__value dropdown__value--placeholder'
          }
        >
          {selectedLabel ?? placeholder}
        </span>
      )}
      <span className="dropdown__caret" aria-hidden="true">
        ▾
      </span>
    </button>
  );
}
