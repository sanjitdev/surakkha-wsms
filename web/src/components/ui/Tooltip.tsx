/**
 * Tooltip.tsx — accessible hover/tap tooltip primitive.
 *
 * Per ui-ux-pro-max (Forms / Help Text): helper text under inputs
 * can clutter the form; a small `?` button next to the label that
 * surfaces the same information on hover or tap keeps the form
 * compact without losing accessibility. This primitive handles:
 *
 *   - Hover  (mouseenter / mouseleave)
 *   - Focus  (keyboard users tabbing to the trigger)
 *   - Tap    (click on touch devices — toggles open/closed, also
 *             closes on outside-click or Escape)
 *
 * ARIA: the trigger exposes `aria-describedby` pointing at the panel;
 * the panel carries `role="tooltip"`. Both are wired so screen readers
 * announce the help text alongside the field.
 *
 * Two consumers:
 *   - <Tooltip label="…">…</Tooltip>        — generic trigger + tooltip
 *   - <HelpTooltip label="…" />              — small "?" icon button
 */
import {
  type ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipProps {
  /** The element that triggers the tooltip. Renders inline. */
  children: ReactElement;
  /** Text content of the tooltip. Kept as a string so screen readers
   *  read it as a single announcement. */
  label: string;
  /** Position of the panel relative to the trigger. Default "top". */
  placement?: TooltipPlacement;
  /** Optional id for the panel. Useful when the trigger is already
   *  the target of another element's aria-describedby (we then
   *  concatenate the panel id onto the existing list). */
  id?: string;
  /** testId for the trigger button (for the integration test). */
  testId?: string;
}

interface PanelStyle {
  placement: TooltipPlacement;
}

const panelStyleFor = ({ placement }: PanelStyle): React.CSSProperties => {
  // Two-line CSS for top/bottom; the panel sits centered over/below
  // the trigger. We keep the offset modest so the tooltip doesn't
  // float far from its anchor.
  const offset = 'calc(100% + var(--space-xs))';
  if (placement === 'top') {
    return {
      bottom: offset,
      top: 'auto',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  }
  return {
    top: offset,
    bottom: 'auto',
    left: '50%',
    transform: 'translateX(-50%)',
  };
};

export function Tooltip({
  children,
  label,
  placement = 'top',
  id: idProp,
  testId,
}: TooltipProps): ReactElement {
  const reactId = useId();
  const panelId = idProp ?? `tooltip-${reactId}`;
  const [open, setOpen] = useState<boolean>(false);
  // Tracks the trigger interaction that opened the tooltip so we
  // don't fight mouse-vs-keyboard state (e.g. mouse hover leaving
  // while keyboard focus is still on the button).
  const openSourceRef = useRef<'hover' | 'focus' | 'tap' | null>(null);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  const show = useCallback((source: 'hover' | 'focus' | 'tap') => {
    openSourceRef.current = source;
    setOpen(true);
  }, []);
  const hide = useCallback((source: 'hover' | 'focus' | 'tap') => {
    // Only honor hide if it matches the open source (otherwise we'd
    // dismiss hover-only when keyboard focus is still on the button).
    if (openSourceRef.current === source) {
      openSourceRef.current = null;
      setOpen(false);
    }
  }, []);

  // Outside-click + Escape dismissal for tap-open tooltips.
  useEffect(() => {
    if (!open) return undefined;
    function onDocPointer(e: PointerEvent): void {
      const root = rootRef.current;
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        openSourceRef.current = null;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        openSourceRef.current = null;
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Clone the trigger so we can attach hover/focus/click handlers
  // without forcing every consumer to write the same wrapper.
  const triggerProps = {
    onMouseEnter: () => {
      show('hover');
    },
    onMouseLeave: () => {
      hide('hover');
    },
    onFocus: () => {
      show('focus');
    },
    onBlur: () => {
      hide('focus');
    },
    onClick: () => {
      // Tap toggles on touch devices and is harmless on mouse.
      if (open) {
        openSourceRef.current = null;
        setOpen(false);
      } else {
        show('tap');
      }
    },
    'aria-describedby': open ? panelId : undefined,
    'data-testid': testId,
  } as const;

  // We expect a single element child (a button / anchor / icon).
  const child = children as ReactElement<{
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onClick?: () => void;
    'aria-describedby'?: string;
    'data-testid'?: string;
  }>;

  return (
    <span ref={rootRef} className="tooltip" data-open={open || undefined}>
      {(() => {
        const cloned = {
          ...child,
          props: {
            ...child.props,
            ...triggerProps,
          },
        };
        return cloned;
      })()}
      {open ? (
        <span
          id={panelId}
          role="tooltip"
          className={`tooltip__panel tooltip__panel--${placement}`}
          style={panelStyleFor({ placement })}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}

/** HelpTooltip — small "?" icon button + tooltip, designed to sit
 *  next to a form label. Use as:
 *    <label>
 *      Field name
 *      <HelpTooltip label="…helper text…" />
 *    </label>
 *  The label text remains the visible primary affordance; the
 *  tooltip is the secondary, on-demand explanation. */
export interface HelpTooltipProps {
  label: string;
  placement?: TooltipPlacement;
  testId?: string;
}

function HelpIcon(): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function HelpTooltip({ label, placement = 'top', testId }: HelpTooltipProps): ReactElement {
  return (
    <Tooltip
      label={label}
      placement={placement}
      testId={testId ?? 'help-tooltip'}
    >
      <button
        type="button"
        className="tooltip__help-trigger"
        aria-label="More information"
      >
        <HelpIcon />
      </button>
    </Tooltip>
  );
}

/** useTooltipId — returns a stable id for callers that need to
 *  reference the tooltip panel from `aria-describedby` on the
 *  field's <input>. Lets the input keep describing itself via the
 *  helper-text id, while the tooltip trigger also describes via
 *  this id. */
export function useTooltipId(prefix = 'tooltip'): string {
  const reactId = useId();
  return `${prefix}-${reactId}`;
}
