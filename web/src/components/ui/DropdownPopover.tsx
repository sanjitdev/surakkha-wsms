import type { DropdownOption } from './Dropdown.types';
import type { KeyboardEvent, MutableRefObject } from 'react';

interface DropdownPopoverProps<T> {
  rootId: string;
  listboxId: string;
  searchable: boolean;
  query: string;
  setQuery: (v: string) => void;
  setActiveIndex: (i: number) => void;
  searchRef: MutableRefObject<HTMLInputElement | null>;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => void;
  isMulti: boolean;
  filtered: DropdownOption<T>[];
  activeIndex: number;
  selectedSet: Set<T>;
  commit: (opt: DropdownOption<T>) => void;
  testId: string;
}

export function DropdownPopover<T>({
  rootId,
  listboxId,
  searchable,
  query,
  setQuery,
  setActiveIndex,
  searchRef,
  onKeyDown,
  isMulti,
  filtered,
  activeIndex,
  selectedSet,
  commit,
  testId,
}: DropdownPopoverProps<T>) {
  return (
    <div className="dropdown__popover" data-testid={`${testId}-popover`}>
      {searchable ? (
        <div className="dropdown__search">
          <input
            ref={searchRef}
            type="text"
            className="dropdown__search-input"
            placeholder="Type to filter…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            data-testid={`${testId}-search`}
          />
        </div>
      ) : null}
      {/* WAI-ARIA combobox pattern: <ul role="listbox"> is the canonical
          way to expose a list of options; jsx-a11y flags it because <ul>
          is normally non-interactive. The combobox trigger owns keyboard
          navigation; clicks on <li> are intentional. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */}
      <ul
        id={listboxId}
        role="listbox"
        className="dropdown__list"
        aria-multiselectable={isMulti}
        data-testid={`${testId}-listbox`}
      >
        {filtered.length === 0 ? (
          <li className="dropdown__empty">No matches</li>
        ) : (
          filtered.map((opt, i) => {
            const isSelected = selectedSet.has(opt.value);
            const isActive = i === activeIndex;
            const cls = `dropdown__option${isActive ? ' dropdown__option--active' : ''}${
              isSelected ? ' dropdown__option--selected' : ''
            }`;

            return (
              <li
                key={String(opt.value)}
                id={`${rootId}-opt-${i}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled === true}
                className={cls}
                onClick={() => {
                  commit(opt);
                }}
                onMouseEnter={() => {
                  setActiveIndex(i);
                }}
                data-testid={`${testId}-option-${String(opt.value)}`}
              >
                <span>{opt.label}</span>
                {isSelected && isMulti ? (
                  <span className="dropdown__option-check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
      {/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */}
    </div>
  );
}
