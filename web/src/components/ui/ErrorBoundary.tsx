/**
 * ErrorBoundary — top-level safety net for render-time exceptions.
 *
 * Catches anything thrown during render in any descendant component and
 * swaps the subtree for the <ErrorScreen /> recovery UI. Designed to
 * wrap the entire app (above BrowserRouter) so even a routing error
 * doesn't white-screen the SPA.
 *
 * Usage:
 *
 *   <ErrorBoundary>
 *     <BrowserRouter>
 *       ...routes...
 *     </BrowserRouter>
 *   </ErrorBoundary>
 *
 * The boundary is intentionally simple: it does not swallow async errors
 * (those still need to be handled by try/catch or a Promise rejection
 * hook — see `src/mocks/reset.ts` for the boot-time safety net).
 *
 * A custom fallback is supported for tests or design overrides.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorScreen } from './ErrorScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Receives `error` and `reset`. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Called whenever a render error is caught. Useful for logging. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to the console so devtools catches it even if no onError is wired.
    console.error('[surakkha] caught render error', error, info);
    this.setState({ componentStack: info.componentStack ?? null });
    this.props.onError?.(error, info);
  }

  reset = (): void => {
    this.setState({ error: null, componentStack: null });
  };

  render(): ReactNode {
    const { error, componentStack } = this.state;

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback({ error, reset: this.reset });
      }
      return <ErrorScreen error={error} componentStack={componentStack} />;
    }
    return this.props.children;
  }
}
