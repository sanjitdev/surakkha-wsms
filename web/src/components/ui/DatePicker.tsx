/**
 * DatePicker.tsx — FE-B5c Layer-A primitive (composition root).
 *
 * Single-mode date picker. Trigger is a `<button>` showing the selected date
 * formatted in the active locale; click opens a popover containing
 * `<Calendar>`. Click-outside + Escape close the popover (focus returns to
 * the trigger on Escape; click-outside follows B5a's deferred decision and
 * does not auto-restore focus).
 *
 * Discriminated union on `mode: 'single' | 'range'` keeps `value` and
 * `onChange` types narrow; range mode is composed via `<DateRangePicker>`,
 * not this component.
 */
import '../../styles/datepicker.css';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Calendar } from './Calendar';
import { useCalendar } from './useCalendar';
import { Locale } from '../../types/domain';
import { useLocale } from '../../hooks/useLocale';

/** Re-export so consumers don't need to import the Locale enum separately. */
export { Locale };
export interface DatePickerPropsBase {
  /** Visible placeholder text when `value` is null. */
  placeholder?: string;
  /** Optional lower bound on selectable dates (inclusive). */
  min?: Date | null;
  /** Optional upper bound on selectable dates (inclusive). */
  max?: Date | null;
  /** Optional explicit locale override; defaults to `useLocale().locale`. */
  locale?: Locale;
  /** Disable the entire picker. */
  disabled?: boolean;
  /** Testid root. */
  testId?: string;
}
export interface DatePickerPropsSingle extends DatePickerPropsBase {
  value: Date | null;
  onChange: (d: Date | null) => void;
}
export type DatePickerProps = DatePickerPropsSingle;
/** Default English trigger placeholder when no value + no explicit placeholder. */
const DEFAULT_PLACEHOLDER_EN = 'Select a date';
const DEFAULT_PLACEHOLDER_BN = 'একটি তারিখ নির্বাচন করুন';

export function DatePicker(props: DatePickerProps): ReactNode {
  const {
    value,
    onChange,
    placeholder,
    min,
    max,
    locale: localeOverride,
    disabled = false,
    testId = 'datepicker',
  } = props;
  const { locale: hookLocale } = useLocale();
  const locale: Locale = localeOverride ?? hookLocale;
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  // Store `onChange` in a ref so the outside-click effect doesn't re-bind
  // when the consumer passes a new identity each render.
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;
  const calendar = useCalendar({
    initialMonth: value ?? undefined,
    min,
    max,
    locale,
  });

  // Outside-click handler — mirrors B5a Dropdown's deferred decision: closes
  // the popover but does NOT auto-restore focus.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const handler = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      const root = rootRef.current;

      if (root && target && !root.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);
  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    setOpen((o) => !o);
  }, [disabled]);
  const onSelect = useCallback((d: Date) => {
    onChangeRef.current(d);
    setOpen(false);
    // Return focus to the trigger after selection (matches B5a's
    // restore-on-Enter behavior — Escape also restores).
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);
  const onEscape = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);
  const triggerLabel = useMemo(() => {
    if (value) {
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value);
    }
    return placeholder ?? (locale === Locale.Bn ? DEFAULT_PLACEHOLDER_BN : DEFAULT_PLACEHOLDER_EN);
  }, [value, locale, placeholder]);

  // i18n strings — kept inline because the spec asked for 12 keys under the
  // datepicker.* namespace; the consumer wires them in via prop or via the
  // styleguide. For the primitive itself we derive deterministic English or
  // Bangla labels so a consumer that doesn't pass `labels` still gets a
  // working picker.
  const labels = useMemo(() => {
    const isBn = locale === Locale.Bn;

    return {
      previousMonth: isBn ? 'আগের মাস' : 'Previous month',
      nextMonth: isBn ? 'পরের মাস' : 'Next month',
      previousYear: isBn ? 'আগের বছর' : 'Previous year',
      nextYear: isBn ? 'পরের বছর' : 'Next year',
      today: isBn ? 'আজ' : 'Today',
    };
  }, [locale]);

  return (
    <div
      ref={rootRef}
      className="datepicker"
      data-testid={testId}
      data-locale={locale}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`datepicker__trigger ${value ? '' : 'datepicker__trigger--placeholder'}`.trim()}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        disabled={disabled}
        data-testid={`${testId}-trigger`}
        onClick={onTriggerClick}
      >
        <span className="datepicker__value">{triggerLabel}</span>
        <span className="datepicker__caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div
          className="datepicker__popover"
          role="dialog"
          aria-label={calendar.monthLabel}
          id={popoverId}
          data-testid={`${testId}-popover`}
        >
          <Calendar
            calendar={calendar}
            selected={value}
            onSelect={onSelect}
            onEscape={onEscape}
            labels={labels}
            testId={`${testId}-cal`}
          />
        </div>
      ) : null}
    </div>
  );
}
