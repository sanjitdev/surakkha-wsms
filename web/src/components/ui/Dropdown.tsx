/**
 * Dropdown.tsx — FE-B5a Layer-A primitive (composition root).
 *
 * Controlled combobox implementing the [W3C ARIA combobox pattern](
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with listbox
 * autocomplete. Single + multi (chip deselect) modes; optional searchable
 * filter; full keyboard nav via `useDropdownKeyboard`. Pure presentational
 * Layer A — no I/O hooks. State + handlers split out into per-file helpers
 * to keep each file ≤ 200 lines (AD-FE-5 ceiling).
 */
import '../../styles/dropdown.css';
import { useDropdownKeyboard } from './useDropdownKeyboard';
import { useDropdownState } from './useDropdownState';
import { DropdownChips, DropdownTrigger } from './DropdownTrigger';
import { DropdownPopover } from './DropdownPopover';
import type { DropdownOption, DropdownProps } from './Dropdown.types';

export type { DropdownOption, DropdownProps };
function useFiltered<T>(options: DropdownOption<T>[], searchable: boolean, query: string): DropdownOption<T>[] {
  if (!searchable || query === '') return options;
  const q = query.toLowerCase();

  return options.filter((o) => o.label.toLowerCase().startsWith(q));
}
export function Dropdown<T>(props: DropdownProps<T>) {
  const {
    options,
    mode = 'single',
    placeholder = 'Select…',
    disabled = false,
    searchable = false,
    testId = 'dropdown',
    className = '',
    label,
  } = props;
  const isMulti = mode === 'multi';
  const value = props.value;
  const onChange = props.onChange;

  const state = useDropdownState<T>({
    options,
    value,
    onChange: onChange as (v: T | T[] | null) => void,
    isMulti,
    searchable,
  });
  const { rootId, listboxId, rootRef, triggerRef, searchRef, open, activeIndex, query, selectedSet, setQuery, setActiveIndex, setOpen, close, commit, removeChip } = state;
  const filtered = useFiltered(options, searchable, query);

  const onKeyDown = useDropdownKeyboard<T>({
    open,
    activeIndex,
    setOpen,
    setActiveIndex,
    filtered,
    options,
    disabled,
    commit,
    close,
  });

  const activeOptionId =
    open && activeIndex >= 0 && activeIndex < filtered.length ? `${rootId}-opt-${activeIndex}` : undefined;

  const onToggle = () => {
    if (disabled) return;
    // Read the current value before flipping; seeding `activeIndex` lives
    // outside the `setOpen` updater so React.StrictMode's double-invocation
    // of state updaters does not double-set the index.
    if (!open) setActiveIndex(filtered.length > 0 ? 0 : -1);
    setOpen(!open);
  };

  // Single mode: derive the label of the currently-selected option, if any.
  // Multi mode: trigger shows the placeholder; selected options live as
  // chips above the trigger (rendered as a sibling, not a child of the
  // combobox `<button>`).
  let selectedLabel: string | undefined;

  if (!isMulti) {
    const single = (value as T | null) ?? null;
    const match = single !== null ? options.find((o) => o.value === single) : undefined;

    selectedLabel = match?.label;
  }
  return (
    <div ref={rootRef} className={`dropdown ${className}`.trim()} data-testid={testId}>
      {label ? (
        <label className="dropdown__label" htmlFor={`${rootId}-trigger`}>
          {label}
        </label>
      ) : null}
      {isMulti ? (
        <DropdownChips<T>
          values={(value as T[] | undefined) ?? []}
          options={options}
          testId={testId}
          onRemove={removeChip}
        />
      ) : null}
      <DropdownTrigger
        rootId={rootId}
        listboxId={listboxId}
        triggerRef={triggerRef}
        open={open}
        activeOptionId={activeOptionId}
        disabled={disabled}
        label={label}
        placeholder={placeholder}
        testId={testId}
        selectedLabel={selectedLabel}
        onKeyDown={onKeyDown}
        onToggle={onToggle}
      />
      {open ? (
        <DropdownPopover
          rootId={rootId}
          listboxId={listboxId}
          searchable={searchable}
          query={query}
          setQuery={setQuery}
          setActiveIndex={setActiveIndex}
          searchRef={searchRef}
          onKeyDown={onKeyDown}
          isMulti={isMulti}
          filtered={filtered}
          activeIndex={activeIndex}
          selectedSet={selectedSet}
          commit={commit}
          testId={testId}
        />
      ) : null}
    </div>
  );
}
