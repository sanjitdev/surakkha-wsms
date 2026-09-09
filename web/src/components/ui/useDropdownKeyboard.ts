import { type KeyboardEvent, type MutableRefObject, useCallback } from 'react';
import type { DropdownOption } from './Dropdown.types';


/**
 * useDropdownKeyboard — FE-B5a keyboard handler for the Dropdown primitive.
 *
 * Returns a stable `onKeyDown` callback implementing:
 *   - ArrowUp/Down: move `activeIndex`; opens the popover if closed.
 *   - Home/End: jump to first/last option (open popover only).
 *   - Enter: select the active option (open popover only).
 *   - Escape: close the popover and restore focus to the trigger.
 *   - Type-ahead (single printable char): cycle within the prefix-match
 *     group. A short buffer tracks the last typed letters within the
 *     popover session. Repeating the buffer's last letter cycles within
 *     the prefix group (wrapping at the end); pressing a different
 *     letter extends the prefix. Disabled options are skipped. Matches
 *     the W3C ARIA combobox example for same-letter match groups.
 *
 * The type-ahead buffer is owned by the composition root (`Dropdown.tsx`)
 * and shared with the state hook via a `typeAheadBufferRef`; the state
 * hook nulls the buffer on close + outside-click so the next type-ahead
 * opens at the first match of a fresh prefix instead of continuing the
 * previous cycle.
 *
 * The handler is intentionally tolerant of being attached to either the
 * trigger `<button>` or the search `<input>` inside the popover — when the
 * search input owns typing, the per-char type-ahead branch is harmless
 * because the search `<input>` re-renders on each keystroke.
 */

/** Shared type-ahead buffer cell. Lives in a ref so the keyboard hook
 *  and the state hook can both read/write without re-rendering. */
export interface TypeAheadBuffer {
  /** The cumulative prefix typed so far within the popover session
   *  (lowercase). Null when the buffer is empty. */
  buffer: string | null;
}
export interface DropdownKeyboardState<T> {
  open: boolean;
  activeIndex: number;
  setOpen: (v: boolean) => void;
  setActiveIndex: import('./Dropdown.types').Setter<number>;
  filtered: DropdownOption<T>[];
  options: DropdownOption<T>[];
  disabled: boolean;
  commit: (opt: DropdownOption<T>) => void;
  close: (restoreFocus: boolean) => void;
  /** Stable ref shared with `useDropdownState`; mutated on close + Escape
   *  to clear the type-ahead buffer. */
  typeAheadBufferRef: MutableRefObject<TypeAheadBuffer>;
}
export function useDropdownKeyboard<T>(state: DropdownKeyboardState<T>) {
  const { open, activeIndex, setOpen, setActiveIndex, filtered, options, disabled, commit, close, typeAheadBufferRef } = state;

  return useCallback(
    (e: KeyboardEvent<HTMLButtonElement | HTMLInputElement>) => {
      if (disabled) return;
      const max = filtered.length;

      // Type-ahead — applies to BOTH closed and open popovers. The
      // regex guard stays: only letter/number chars trigger.
      if (e.key.length === 1 && /[\p{L}\p{N}]/u.test(e.key)) {
        const typed = e.key.toLowerCase();
        const prev = typeAheadBufferRef.current.buffer;
        // Determine the prefix used for matching:
        //   - First letter (prev === null): prefix is `typed`.
        //   - Same letter as the buffer's last char: prefix is `prev`
        //     (the user is cycling within the existing group).
        //   - Different letter: extend the prefix to `prev + typed`
        //     (multi-char match, e.g. "a" + "p" → "ap").
        let prefix: string;
        let isRepeatSameLast: boolean;

        if (prev === null) {
          prefix = typed;
          isRepeatSameLast = false;
        } else if (prev.charAt(prev.length - 1) === typed) {
          prefix = prev;
          isRepeatSameLast = true;
        } else {
          prefix = prev + typed;
          isRepeatSameLast = false;
        }
        const matches: number[] = [];

        for (let i = 0; i < filtered.length; i += 1) {
          const o = filtered[i];

          if (!o.disabled && o.label.toLowerCase().startsWith(prefix)) {
            matches.push(i);
          }
        }
        if (matches.length > 0) {
          e.preventDefault();
          const currentMatchIdx = matches.indexOf(activeIndex);

          let nextIdx: number;

          if (!open) {
            // Closed popover: open + jump to first match of the prefix.
            nextIdx = matches[0];
            setOpen(true);
          } else if (isRepeatSameLast) {
            // Already open + same letter as the buffer's last char:
            // cycle within the prefix group, wrapping at the end.
            const from = currentMatchIdx >= 0 ? currentMatchIdx : -1;

            nextIdx = matches[(from + 1) % matches.length];
          } else {
            // Already open + extended/new prefix: jump to the next
            // match past the current activeIndex if it's still in
            // the matches list (multi-char type-ahead continuation);
            // otherwise land on the first match of the new prefix.
            nextIdx = currentMatchIdx >= 0 ? matches[(currentMatchIdx + 1) % matches.length] : matches[0];
          }
          typeAheadBufferRef.current.buffer = prefix;
          setActiveIndex(nextIdx);
          return;
        }
        // No matches: buffer is unchanged; popover state is unchanged
        // (closed stays closed; open stays open). Resetting the buffer
        // here would cause type-ahead to "lose" previous prefix chars
        // after a missed keystroke — don't.
      }
      /** Returns the next non-disabled option index (wraps in `dir`=+1/-1).
       *  If every option is disabled, returns `null` and the caller should
       *  not move the active index. */
      const nextEnabled = (from: number, dir: 1 | -1): number | null => {
        if (max === 0) return null;
        let i = from;

        for (let step = 0; step < max; step += 1) {
          i = (i + dir + max) % max;
          if (!filtered[i]?.disabled) return i;
        }
        return null;
      };

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) {
            setOpen(true);
            const first = nextEnabled(-1, 1);

            setActiveIndex(first ?? -1);
            return;
          }
          setActiveIndex((i: number) => {
            const start = i < 0 ? -1 : i;
            const next = nextEnabled(start, 1);

            return next ?? i;
          });
          return;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) {
            setOpen(true);
            const last = nextEnabled(max, -1);

            setActiveIndex(last ?? -1);
            return;
          }
          setActiveIndex((i: number) => {
            const start = i < 0 ? max : i;
            const next = nextEnabled(start, -1);

            return next ?? i;
          });
          return;
        case 'Home':
          if (open && max > 0) {
            e.preventDefault();
            const firstEnabled = filtered.findIndex((o) => !o.disabled);

            setActiveIndex(firstEnabled >= 0 ? firstEnabled : -1);
          }
          return;
        case 'End':
          if (open && max > 0) {
            e.preventDefault();
            let lastEnabled = -1;

            for (let i = filtered.length - 1; i >= 0; i -= 1) {
              if (!filtered[i]?.disabled) {
                lastEnabled = i;
                break;
              }
            }
            setActiveIndex(lastEnabled);
          }
          return;
        case 'Enter':
          // Always preventDefault when the Dropdown is inside a <form>:
          // - Open + active option: commit.
          // - Open + no active: ignore.
          // - Closed: don't submit the parent form on Enter/Space.
          if (!open) {
            e.preventDefault();
            break;
          }
          if (activeIndex >= 0 && activeIndex < max) {
            const opt = filtered[activeIndex];

            if (!opt.disabled) {
              e.preventDefault();
              commit(opt);
            }
          }
          break;
        case 'Escape':
          if (open) {
            e.preventDefault();
            close(true);
          }
          break;
        default:
      }
    },
    [activeIndex, close, commit, disabled, filtered, open, options, setActiveIndex, setOpen, typeAheadBufferRef],
  );
}
