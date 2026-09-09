import { useEffect, useRef, useState } from 'react';
import type { ToastVariant } from '../../types/domain';

export interface ToastProps {
  variant: ToastVariant;
  message: string;
  onDismiss?: () => void;
  testId?: string;
}
const DURATION_MS = 4000;

export function Toast({ variant, message, onDismiss, testId }: ToastProps) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const consumedRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const onDismissRef = useRef(onDismiss);
  const prevPausedRef = useRef(false);

  // Keep the latest onDismiss without retriggering the RAF effect.
  onDismissRef.current = onDismiss;

  useEffect(() => {
    // On the un-pause transition (paused true→false), realign startRef
    // exactly once so that elapsed continues smoothly from consumedRef.
    if (!paused && prevPausedRef.current) {
      startRef.current = Date.now() - consumedRef.current;
    }
    prevPausedRef.current = paused;

    function tick() {
      if (paused) {
        // While paused, do NOT touch startRef — preserve consumedRef.
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startRef.current;

      consumedRef.current = elapsed;
      const pct = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);

      setProgress(pct);
      if (elapsed >= DURATION_MS) {
        onDismissRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [paused]);

  const variantKey = variant.toLowerCase() as 'success' | 'warning' | 'danger' | 'info';

  return (
    // role=status is the right ARIA semantics; the auto-dismiss pause on
    // hover is a quality-of-life enhancement, not a primary interaction.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={`toast toast--${variantKey}`}
      role="status"
      aria-live="polite"
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      data-testid={testId ?? `toast-${variantKey}`}
    >
      <span className="toast__message">{message}</span>
      <span className="toast__progress" aria-hidden="true" style={{ width: `${progress}%` }} />
    </div>
  );
}
