/**
 * ToastProvider — app-wide toast queue.
 *
 * Wraps the existing `<Toast />` presentation primitive (FE-1.1a) with a
 * small push queue so any component can call:
 *
 *   const toast = useToast();
 *   toast.danger('Chain integrity check failed');
 *
 * without having to manage per-toast state. Toasts auto-dismiss after
 * 4s (matches the primitive's DURATION_MS); callers can also `dismiss`
 * an id manually. The container is fixed bottom-right with
 * role="region" + aria-live="polite" so screen readers announce new
 * toasts without stealing focus.
 */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ToastVariant } from '../../types/domain';
import { Toast } from './Toast';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}
export interface ToastApi {
  success: (message: string) => number;
  warning: (message: string) => number;
  danger: (message: string) => number;
  info: (message: string) => number;
  dismiss: (id: number) => void;
  clear: () => void;
}
const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_LIMIT = 5;

export interface ToastProviderProps {
  children: ReactNode;
  /** Max simultaneous toasts. Older toasts are evicted FIFO. */
  limit?: number;
  /**
   * Override the per-toast duration (ms). Defaults to the primitive's
   * 4000 ms. Tests pass a small value to keep them fast.
   */
  durationMs?: number;
}
export function ToastProvider({ children, limit = DEFAULT_LIMIT, durationMs }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string): number => {
      idRef.current += 1;
      const id = idRef.current;

      setItems((prev) => {
        const next = [...prev, { id, variant, message }];

        // Evict oldest if over the cap.
        return next.length > limit ? next.slice(next.length - limit) : next;
      });
      return id;
    },
    [limit],
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const api = useMemo<ToastApi>(() => {
    return {
      success: (m) => push(ToastVariant.Success, m),
      warning: (m) => push(ToastVariant.Warning, m),
      danger: (m) => push(ToastVariant.Danger, m),
      info: (m) => push(ToastVariant.Info, m),
      dismiss,
      clear,
    };
  }, [push, dismiss, clear]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            message={t.message}
            onDismiss={() => {
              dismiss(t.id);
            }}
            testId={`toast-${t.id}`}
            durationMs={durationMs}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast() called outside <ToastProvider>');
  }
  return ctx;
}
