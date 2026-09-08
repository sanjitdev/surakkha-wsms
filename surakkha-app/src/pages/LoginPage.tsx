/**
 * LoginPage.tsx — first screen.
 *
 * Replaces 00-login/login.html with a React component that talks to the
 * MSW mock backend (via the session API in src/mocks/session.ts). The
 * visual treatment matches the mockup exactly because both consume
 * mockups/theme.css tokens.
 *
 * Behaviour mirrors the mockup:
 *   - Click a persona card → selected state
 *   - Click Continue → POST /api/auth/login (via MSW) → redirect to landing
 *   - Live status strip in the picker shows chain height + last-block age
 *
 * When Story 5 wires Priya's Inbox, "Continue" navigates there.
 */
import { useEffect, useState } from 'react';
import { PERSONAS, type Persona, loginAs } from '../mocks/session';

const PERSONA_INITIALS: Record<string, string> = {
  priya: 'P',
  anjali: 'A',
  pha_approver: 'K',
  pha_viewer: 'V',
  vendor: 'S',
};

interface ChainStatus {
  block_hash: string;
  height: number;
  ingested_at: string;
}

export function LoginPage() {
  const [selected, setSelected] = useState<Persona>(PERSONAS[0]);
  const [status, setStatus] = useState<'pending' | 'ready' | 'error'>('pending');
  const [chainHeight, setChainHeight] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/chain/head');
        // 404 is expected before the chain is seeded (first boot before
        // MSW finishes). Show "pending" rather than "error".
        if (res.status === 404) {
          if (cancelled) return;
          setStatus('pending');
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as ChainStatus;
        if (cancelled) return;
        setChainHeight(body.height);
        setStatus('ready');
      } catch {
        if (cancelled) return;
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleContinue() {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginAs(selected.id);
      // Phase 2: real router lands on `selected.landing`. For Phase 1,
      // the route is unchanged because we have one screen — but we still
      // push the path so a future router picks it up.
      window.history.pushState({}, '', selected.landing);
      window.location.reload(); // simplest way for now to re-evaluate route
    } catch (err) {
      console.error('[surakkha] login failed', err);
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="login-shell">
      <aside className="brand-panel">
        <div className="brand-panel__mark">
          <div className="brand-panel__mark-glyph" aria-hidden="true">S</div>
          <div className="brand-panel__mark-text">Surakkha</div>
        </div>
        <h1 className="brand-panel__title">
          Civic water-safety,<br />audited.
        </h1>
        <div className="brand-panel__live">
          <span className="brand-panel__live-dot" aria-hidden="true"></span>
          <span>
            chain {status === 'ready' && chainHeight !== null
              ? `live · ${chainHeight} blocks`
              : status === 'pending'
                ? 'connecting…'
                : 'unreachable'}
          </span>
        </div>
      </aside>

      <main className="picker-panel">
        <div className="picker-panel__inner">
          <div
            className={
              'picker-status ' +
              (status === 'ready'
                ? 'picker-status--ready'
                : status === 'error'
                  ? 'picker-status--error'
                  : 'picker-status--pending')
            }
          >
            <span className="picker-status__dot" aria-hidden="true"></span>
            mock backend · {status}
          </div>

          <h2 className="picker-panel__heading">Sign in</h2>

          <ul className="picker-list" role="radiogroup" aria-label="Persona picker">
            {PERSONAS.map((p) => {
              const isSel = p.id === selected.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSel}
                    className={'persona' + (isSel ? ' persona--selected' : '')}
                    onClick={() => setSelected(p)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        const idx = PERSONAS.findIndex((q) => q.id === selected.id);
                        const nextIdx = e.key === 'ArrowDown'
                          ? (idx + 1) % PERSONAS.length
                          : (idx - 1 + PERSONAS.length) % PERSONAS.length;
                        setSelected(PERSONAS[nextIdx]);
                      }
                    }}
                  >
                    <div className="persona__avatar" aria-hidden="true">
                      {PERSONA_INITIALS[p.id] ?? p.display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="persona__name">{p.display_name}</div>
                      <div className="persona__hint" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--fg-tertiary)' }}>
                        {p.hint}
                      </div>
                    </div>
                    <div className="persona__check" aria-hidden="true"></div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="picker-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={handleContinue}
              disabled={isLoggingIn || status !== 'ready'}
            >
              {isLoggingIn ? 'Signing in…' : 'Continue →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
