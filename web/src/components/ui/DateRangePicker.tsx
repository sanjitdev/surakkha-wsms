/**
 * DateRangePicker.tsx — FE-B5c Layer-A range sibling to `<DatePicker>`.
 *
 * Wraps the single-mode DatePicker by tracking a 2-step selection state:
 *   1. First click → `pending` starts, `from` is set.
 *   2. Second click → `to` is set, `onChange({from, to})` fires, picker closes.
 * While `pending` is non-null, cells between `pending` and the selected `from`
 * render with the `--in-range` modifier via the parent Calendar.
 *
 * The state machine is intentionally separate from `<DatePicker>` because
 * the range value shape (`{from, to}`) is fundamentally different from the
 * single-value (`Date | null`) one. Composing them inside one component
 * would blow past the 200 LoC ceiling and conflate two state shapes.
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

export interface DateRange {
  from: Date | null;
  to: Date | null;
}
export interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (r: DateRange | null) => void;
  placeholder?: string;
  min?: Date | null;
  max?: Date | null;
  locale?: Locale;
  disabled?: boolean;
  testId?: string;
}
const DEFAULT_PLACEHOLDER_EN = 'Select a range';
const DEFAULT_PLACEHOLDER_BN = 'একটি পরিসর নির্বাচন করুন';

function startOfDay(d: Date): Date {
  const out = new Date(d);

  out.setHours(0, 0, 0, 0);
  return out;
}
export function DateRangePicker(props: DateRangePickerProps): ReactNode {
  const {
    value, onChange, placeholder, min, max,
    locale: localeOverride, disabled = false, testId = 'date-range-picker',
  } = props;
  const { locale: hookLocale } = useLocale();
  const locale: Locale = localeOverride ?? hookLocale;
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  // pending tracks the first click (the range "from"). When non-null, the
  // second click becomes "to" and the parent is notified.
  const [pending, setPending] = useState<Date | null>(null);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;
  const initial = useMemo(() => value?.from ?? new Date(), [value?.from]);
  const calendar = useCalendar({ initialMonth: initial, min, max, locale });

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const handler = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      const root = rootRef.current;

      if (root && target && !root.contains(target)) {
        setOpen(false);
        setPending(null);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); };
  }, [open]);
  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    setOpen((o) => !o);
  }, [disabled]);
  const onSelect = useCallback((d: Date) => {
    const day = startOfDay(d);

    if (pending === null) {
      setPending(day);
      onChangeRef.current({ from: day, to: null });
      return;
    }
    // Same-day second click — emit a zero-length range rather than no-oping
    // so the consumer can distinguish "user confirmed today" from "user
    // dismissed the popover".
    if (day.getTime() === pending.getTime()) {
      onChangeRef.current({ from: day, to: day });
      setPending(null);
      setOpen(false);
      queueMicrotask(() => triggerRef.current?.focus());
      return;
    }
    // Second click — normalize so `from <= to`.
    const lo = day.getTime() < pending.getTime() ? day : pending;
    const hi = day.getTime() < pending.getTime() ? pending : day;

    onChangeRef.current({ from: lo, to: hi });
    setPending(null);
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }, [pending]);
  const onEscape = useCallback(() => {
    setOpen(false);
    setPending(null);
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);
  const triggerLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });

    if (value?.from && value.to) {
      return `${fmt.format(value.from)} – ${fmt.format(value.to)}`;
    }
    if (value?.from) return `${fmt.format(value.from)} – …`;
    return placeholder ??
      (locale === Locale.Bn ? DEFAULT_PLACEHOLDER_BN : DEFAULT_PLACEHOLDER_EN);
  }, [value, locale, placeholder]);
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
  // Range highlighting — both directions so the picker highlights while the
  // pending start is set even before `value.to` is finalised.
  const from = pending ?? value?.from ?? null;
  const to = value?.to ?? null;

  return (
    <div ref={rootRef} className="datepicker" data-testid={testId} data-locale={locale}>
      <button ref={triggerRef} type="button"
        className={`datepicker__trigger ${value?.from ? '' : 'datepicker__trigger--placeholder'}`.trim()}
        aria-haspopup="dialog" aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        disabled={disabled} data-testid={`${testId}-trigger`} onClick={onTriggerClick}>
        <span className="datepicker__value">{triggerLabel}</span>
        <span className="datepicker__caret" aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="datepicker__popover" role="dialog"
          aria-label={calendar.monthLabel} id={popoverId}
          data-testid={`${testId}-popover`}>
          <Calendar calendar={calendar} selected={from} onSelect={onSelect}
            rangeFrom={from} rangeTo={to} onEscape={onEscape} labels={labels}
            testId={`${testId}-cal`} />
        </div>
      ) : null}
    </div>
  );
}
