import { type MutableRefObject, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DropdownOption } from './Dropdown.types';
import type { TypeAheadBuffer } from './useDropdownKeyboard';

interface UseDropdownStateArgs<T> {
  options: DropdownOption<T>[];
  value: T | T[] | null;
  onChange: (v: T | T[] | null) => void;
  isMulti: boolean;
  searchable: boolean;
  /** Optional ref shared with `useDropdownKeyboard`. On close +
   *  outside-click, the buffer is nulled so the next type-ahead opens
   *  at the first match of a fresh prefix instead of continuing the
   *  previous cycle. */
  typeAheadBufferRef?: MutableRefObject<TypeAheadBuffer>;
}
export interface DropdownState<T> {
  rootId: string;
  listboxId: string;
  searchInputId: string;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  searchRef: MutableRefObject<HTMLInputElement | null>;
  open: boolean;
  activeIndex: number;
  query: string;
  selectedSet: Set<T>;
  setQuery: (v: string) => void;
  setActiveIndex: import('./Dropdown.types').Setter<number>;
  setOpen: (b: boolean | ((prev: boolean) => boolean)) => void;
  close: (restoreFocus: boolean) => void;
  commit: (opt: DropdownOption<T>) => void;
  removeChip: (chipValue: T) => void;
}
export function useDropdownState<T>({
  value,
  onChange,
  isMulti,
  searchable,
  typeAheadBufferRef,
}: UseDropdownStateArgs<T>): DropdownState<T> {
  const rootId = useId();
  const listboxId = `${rootId}-listbox`;
  const searchInputId = `${rootId}-search`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => {
    if (isMulti) return new Set<T>((value as T[] | undefined) ?? []);
    return new Set<T>(value != null ? [value as T] : []);
  }, [isMulti, value]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
  }, [open, searchable]);

  // Outside-click: close the popover when a mousedown lands outside the
  // root container. We listen on `mousedown` (not `click`) so the close
  // happens before any subsequent `click` on the outside element. SSR-safe
  // via the `typeof document` guard.
  const clearTypeAheadBuffer = useCallback(() => {
    if (typeAheadBufferRef) {
      // eslint-disable-next-line no-param-reassign
      typeAheadBufferRef.current.buffer = null;
    }
  }, [typeAheadBufferRef]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const handler = (ev: MouseEvent) => {
      const target = ev.target;
      const root = rootRef.current;

      if (root && target instanceof Node && !root.contains(target)) {
        setOpen(false);
        setActiveIndex(-1);
        setQuery('');
        queueMicrotask(() => triggerRef.current?.focus());
        clearTypeAheadBuffer();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [clearTypeAheadBuffer, open]);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus());
    clearTypeAheadBuffer();
  }, [clearTypeAheadBuffer]);
  const commit = useCallback(
    (opt: DropdownOption<T>) => {
      if (opt.disabled) return;
      if (isMulti) {
        const cur = ((value as T[] | undefined) ?? []).slice();
        const i = cur.indexOf(opt.value);

        if (i >= 0) cur.splice(i, 1);
        else cur.push(opt.value);
        (onChangeRef.current as (v: T[]) => void)(cur);
      } else {
        (onChangeRef.current as (v: T | null) => void)(opt.value);
        close(true);
      }
    },
    [close, isMulti, value],
  );
  const removeChip = useCallback(
    (chipValue: T) => {
      if (!isMulti) return;
      (onChangeRef.current as (v: T[]) => void)(
        ((value as T[] | undefined) ?? []).filter((x) => x !== chipValue),
      );
    },
    [isMulti, value],
  );

  return {
    rootId,
    listboxId,
    searchInputId,
    rootRef,
    triggerRef,
    searchRef,
    open,
    activeIndex,
    query,
    selectedSet,
    setQuery,
    setActiveIndex,
    setOpen,
    close,
    commit,
    removeChip,
  };
}
