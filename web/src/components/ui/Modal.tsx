import { type ReactNode, useEffect, useRef } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog when no heading-id is supplied. */
  ariaLabel?: string;
  /** id of an element inside the dialog whose text labels it. */
  ariaLabelledBy?: string;
  testId?: string;
}
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// document.activeElement is typed `Element | null`; in a Modal context we
// only care about HTML elements (SVG/SVG-related elements aren't focusable
// via .focus() in this app). Narrow without an unsafe cast.
function activeHTMLElement(): HTMLElement | null {
  const el = document.activeElement;

  if (el && el instanceof HTMLElement) return el;
  return null;
}
export function Modal({
  open,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
  testId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const prevOpenRef = useRef(open);

  // Keep the latest onClose without retriggering the focus-trap effect
  // (consumer-side identity changes must not re-bind the trap).
  onCloseRef.current = onClose;

  useEffect(() => {
    const wasOpen = prevOpenRef.current;

    prevOpenRef.current = open;
    if (!open) {
      // Restore focus exactly once on the open→close transition.
      if (wasOpen) {
        const trigger = lastFocusedRef.current;

        if (trigger && document.contains(trigger)) {
          trigger.focus();
        }
      }
      return undefined;
    }
    lastFocusedRef.current = activeHTMLElement();
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);

    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return undefined;
      }
      if (e.key !== 'Tab' || !dialog) return undefined;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));

      if (items.length === 0) return undefined;
      const first = items[0];
      const last = items[items.length - 1];
      const active = activeHTMLElement();

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      return undefined;
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  // WAI-ARIA APG: every dialog must have an accessible name. Consumers may
  // pass `ariaLabelledBy` (preferred — point to a heading id) or `ariaLabel`
  // (fallback). If neither is supplied, fall back to a generic label so the
  // dialog is never announced as bare "dialog".
  const dialogAriaLabel = ariaLabelledBy
    ? undefined
    : ariaLabel ?? 'Dialog';
  const dialogLabelledBy = ariaLabelledBy;

  return (
    <div className="modal-stage" data-testid={testId ?? 'modal'}>
      <div
        className="modal-scrim"
        onClick={onClose}
        // Keyboard parity: pressing Escape already closes via the keydown
        // handler bound in useEffect, so the scrim's a11y contract is
        // mouse-only. Mark it aria-hidden so AT doesn't expose it.
        aria-hidden="true"
      />
      {/* role="dialog" is keyboard-interactive (focus-trap is wired in
          useEffect above) so the click handler below is a thin wrapper
          for stopPropagation, not a primary action. jsx-a11y treats
          role="dialog" as non-interactive, hence the per-line disable. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={dialogAriaLabel}
        aria-labelledby={dialogLabelledBy}
        ref={dialogRef}
        onClick={(e) => { e.stopPropagation(); }}
      >
        {children}
      </div>
    </div>
  );
}
