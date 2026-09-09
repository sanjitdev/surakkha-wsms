import type { DropdownMode } from '../../types/domain';

export interface DropdownOption<T> {
  value: T;
  label: string;
  disabled?: boolean;
}
interface DropdownBaseProps<T> {
  options: DropdownOption<T>[];
  mode?: DropdownMode;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  testId?: string;
  className?: string;
  label?: string;
}
export type DropdownProps<T> =
  | (DropdownBaseProps<T> & { mode?: 'single'; value: T | null; onChange: (v: T | null) => void })
  | (DropdownBaseProps<T> & { mode: 'multi'; value: T[]; onChange: (v: T[]) => void });
/** Internal state setter signatures — `setActiveIndex` accepts either a
 *  direct value or an updater function (matches `React.Dispatch<SetStateAction<number>>`). */
export type Setter<T> = (v: T | ((prev: T) => T)) => void;
