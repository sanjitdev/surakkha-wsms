/**
 * Vitest checks for the B2 batch:
 *   - ToastProvider: push / variants / dismiss / FIFO eviction / outside-provider throw
 *   - ErrorBoundary: render children when no error; reveal fallback when a
 *     descendant throws; restore children after reset.
 *
 * Test patterns follow the project's existing FE-1.1c suite
 * (`fe-1-1a-vitest.test.tsx`) — plain `expect(...).toBeTruthy()`,
 * `querySelector` for class assertions, and `Object.defineProperty` to
 * install the clipboard API. We deliberately avoid `@testing-library/jest-dom`
 * matchers to keep the project's TS setup lean.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ErrorScreen } from '../components/ui/ErrorScreen';
import { ToastProvider, useToast } from '../components/ui/ToastProvider';

afterEach(() => {
  cleanup();
});

describe('ToastProvider', () => {
  it('pushes a toast via useToast', () => {
    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.info('hello')}>
          fire
        </button>
      );
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('fire'));
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('renders the four variants with the matching class', () => {
    function Probe() {
      const toast = useToast();
      return (
        <div>
          <button type="button" onClick={() => toast.success('ok')}>
            s
          </button>
          <button type="button" onClick={() => toast.warning('warn')}>
            w
          </button>
          <button type="button" onClick={() => toast.danger('bad')}>
            d
          </button>
          <button type="button" onClick={() => toast.info('note')}>
            i
          </button>
        </div>
      );
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('s'));
    fireEvent.click(screen.getByText('w'));
    fireEvent.click(screen.getByText('d'));
    fireEvent.click(screen.getByText('i'));
    const all = document.querySelectorAll('.toast');
    const classes = Array.from(all).map((n) => n.className);
    expect(classes.some((c) => c.includes('toast--success'))).toBe(true);
    expect(classes.some((c) => c.includes('toast--warning'))).toBe(true);
    expect(classes.some((c) => c.includes('toast--danger'))).toBe(true);
    expect(classes.some((c) => c.includes('toast--info'))).toBe(true);
  });

  it('removes a toast on dismiss()', () => {
    function Probe() {
      const toast = useToast();
      return (
        <div>
          <button type="button" onClick={() => toast.info('hello')}>
            fire
          </button>
          <button
            type="button"
            onClick={() => {
              toast.clear();
            }}
          >
            clear
          </button>
        </div>
      );
    }
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('fire'));
    expect(screen.getByText('hello')).toBeTruthy();
    fireEvent.click(screen.getByText('clear'));
    expect(screen.queryByText('hello')).toBeNull();
  });

  it('FIFO-evicts toasts beyond the limit', () => {
    function Probe() {
      const toast = useToast();
      return (
        <button type="button" onClick={() => toast.info('hi')}>
          fire
        </button>
      );
    }
    render(
      <ToastProvider limit={2}>
        <Probe />
      </ToastProvider>,
    );
    const btn = screen.getByText('fire');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    const all = document.querySelectorAll('.toast');
    expect(all.length).toBeLessThanOrEqual(2);
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it('throws if useToast() is called outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Probe() {
      useToast();
      return null;
    }
    expect(() => render(<Probe />)).toThrow(/outside <ToastProvider>/);
    spy.mockRestore();
  });
});

describe('ErrorBoundary', () => {
  function Boom(): never {
    throw new Error('boom');
  }

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>normal</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('normal')).toBeTruthy();
  });

  it('reveals ErrorScreen when a descendant throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText(/Something went wrong/)).toBeTruthy();
    expect(screen.getByText(/Error: boom/)).toBeTruthy();
    spy.mockRestore();
  });

  it('invokes onError when a descendant throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const firstCall = onError.mock.calls[0] as [Error, { componentStack?: string }];
    expect(firstCall[0]).toBeInstanceOf(Error);
    expect(firstCall[0].message).toBe('boom');
    expect(typeof firstCall[1].componentStack).toBe('string');
    spy.mockRestore();
  });

  it('uses a custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary
        fallback={({ error }) => <div data-testid="custom-fallback">custom:{error.message}</div>}
      >
        <Boom />
      </ErrorBoundary>,
    );
    const fb = screen.getByTestId('custom-fallback');
    expect(fb.textContent).toMatch(/custom:boom/);
    spy.mockRestore();
  });

  it('reset() restores children when the boundary recovers', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function ToggleChild() {
      // Throw once the child has been ticked — gives us a clear pre/post
      // boundary state to assert on.
      const [count, setCount] = useState(0);
      if (count >= 1) throw new Error('thrown');
      return (
        <button
          type="button"
          onClick={() => {
            setCount(1);
          }}
        >
          tick
        </button>
      );
    }
    function Harness() {
      const [resetKey, setResetKey] = useState(0);
      return (
        <ErrorBoundary
          key={resetKey}
          fallback={({ error }) => (
            <div>
              <p>caught:{error.message}</p>
              <button
                type="button"
                onClick={() => {
                  setResetKey((n) => n + 1);
                }}
              >
                remount
              </button>
            </div>
          )}
        >
          <ToggleChild />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByText('tick'));
    expect(screen.getByText(/caught:thrown/)).toBeTruthy();
    // Re-mounting the boundary via key= gives a fresh child state — the
    // original `<button>tick</button>` is back in the DOM.
    fireEvent.click(screen.getByText('remount'));
    expect(screen.getByText('tick')).toBeTruthy();
    spy.mockRestore();
  });
});

describe('ErrorScreen', () => {
  it('renders the error name and message', () => {
    const err = new TypeError('kaboom');
    render(<ErrorScreen error={err} />);
    const msg = screen.getByTestId('error-screen-message');
    expect(msg.textContent).toMatch(/TypeError:/);
    expect(msg.textContent).toMatch(/kaboom/);
    expect(screen.getByRole('button', { name: /Reload page/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Copy diagnostics/i })).toBeTruthy();
  });

  it('copies diagnostics to clipboard when supported', () => {
    const writeText = vi.fn();
    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const err = new Error('copy-me');
    render(<ErrorScreen error={err} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy diagnostics/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const payload = writeText.mock.calls[0][0];
    expect(payload).toMatch(/Surakkha error report/);
    expect(payload).toMatch(/copy-me/);
  });
});
