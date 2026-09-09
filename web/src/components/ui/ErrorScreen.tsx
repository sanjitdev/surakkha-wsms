/**
 * ErrorScreen — recovery UI shown when an ErrorBoundary catches a render error.
 *
 * Single source of truth for the full-screen error layout. Designed to be
 * simple and dependable: a heading, the message, the stack (collapsible
 * for non-dev environments), and two buttons:
 *   - Reload page  → window.location.reload()
 *   - Copy diagnostics → copies `error.message + error.stack` to the clipboard
 *
 * The "copy" path uses the modern `navigator.clipboard.writeText` API
 * with a textarea fallback so it works in any browser context.
 */
import { useState } from 'react';

export interface ErrorScreenProps {
  error: Error;
  /** Where the error came from — typically `componentDidCatch`'s info.componentStack`. */
  componentStack?: string | null;
  /** Show the stack trace. Defaults to import.meta.env.DEV. */
  showStack?: boolean;
}
interface Diagnostics {
  message: string;
  name: string;
  stack: string | undefined;
  componentStack: string | null | undefined;
  url: string;
  timestamp: string;
}

function buildDiagnostics(error: Error, componentStack: string | null | undefined): Diagnostics {
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentStack: componentStack ?? null,
    url: typeof window !== 'undefined' ? window.location.href : '<ssr>',
    timestamp: new Date().toISOString(),
  };
}
function format(d: Diagnostics): string {
  return [
    `# Surakkha error report`,
    `timestamp: ${d.timestamp}`,
    `url:       ${d.url}`,
    `name:      ${d.name}`,
    `message:   ${d.message}`,
    ``,
    `## stack`,
    d.stack ?? '<no stack>',
    ``,
    d.componentStack ? `## component stack\n${d.componentStack}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
export function ErrorScreen({ error, componentStack, showStack }: ErrorScreenProps) {
  const dev = import.meta.env.DEV;
  const reveal = showStack ?? dev;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const text = format(buildDiagnostics(error, componentStack));

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Fallback for environments without the Clipboard API (e.g. older
      // browsers or non-secure contexts).
      try {
        const ta = document.createElement('textarea');

        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        window.setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error('[surakkha] failed to copy error diagnostics', fallbackErr);
      }
    }
  };

  const onReload = () => {
    window.location.reload();
  };

  return (
    <div className="error-screen" role="alert" aria-live="assertive">
      <div className="error-screen__panel">
        <h1 className="error-screen__title">Something went wrong</h1>
        <p className="error-screen__subtitle">
          The app hit an unexpected error and recovered itself. Your work in this tab may be lost.
        </p>
        <p className="error-screen__message" data-testid="error-screen-message">
          <strong>{error.name}:</strong> {error.message}
        </p>
        {reveal && error.stack && (
          <details className="error-screen__stack">
            <summary>Show stack trace</summary>
            <pre>{error.stack}</pre>
            {componentStack && (
              <>
                <h3>Component stack</h3>
                <pre>{componentStack}</pre>
              </>
            )}
          </details>
        )}
        <div className="error-screen__actions">
          <button type="button" className="button button--primary" onClick={onReload}>
            Reload page
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              void onCopy();
            }}
          >
            {copied ? 'Copied' : 'Copy diagnostics'}
          </button>
        </div>
      </div>
    </div>
  );
}
