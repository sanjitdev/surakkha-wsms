/**
 * LoginPage.tsx — first screen.
 *
 * Replaces 00-login/login.html with a React component that talks to the
 * MSW mock backend (via the session API in src/mocks/session.ts). The
 * visual treatment matches the mockup exactly because both consume
 * mockups/theme.css tokens.
 *
 * Behaviour:
 *   - Click a persona card → selected state
 *   - Click Continue → POST /api/auth/login (via MSW) → write session
 *     into IndexedDB → emit `surakkha:session-changed` → `<RoutedSurface>`
 *     re-reads session + Routes naturally lands on `selected.landing`
 *     via `<Navigate>`.
 *   - Live status strip in the picker shows chain height + last-block age.
 *
 * The chain status is purely informational. The Continue button is
 * always enabled once a persona is selected — the user shouldn't be
 * locked out by a slow MSW seed or a transient /api/chain/head 404.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PERSONAS, type Persona, loginAs } from '../mocks/session';
import { notifySessionChanged } from '../mocks/session-bus';

const PERSONA_INITIALS: Record<string, string> = {
  priya: 'P',
  anjali: 'A',
  pha_approver: 'K',
  pha_viewer: 'V',
  vendor: 'S',
  karim: 'F', // field technician (avoids clash with pha_approver: K)
};

interface ChainStatus {
  block_hash: string;
  height: number;
  ingested_at: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Persona>(PERSONAS[0]);
  const [status, setStatus] = useState<'pending' | 'ready' | 'error'>('pending');
  const [chainHeight, setChainHeight] = useState<number | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const cancelledRef = { current: false };

    void (async () => {
      try {
        const res = await fetch('/api/chain/head');

        // 404 is expected before the chain is seeded (first boot before
        // MSW finishes). Show "pending" rather than "error".
        if (res.status === 404) {
          if (cancelledRef.current) return;
          setStatus('pending');
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as ChainStatus;

        if (cancelledRef.current) return;
        setChainHeight(body.height);
        setStatus('ready');
      } catch {
        if (cancelledRef.current) return;
        setStatus('error');
      }
    })();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function handleContinue() {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginAs(selected.id);
      // Notify <RoutedSurface> to re-read session + navigate to landing.
      // No window.location.reload — the Routes tree handles the
      // transition via <Navigate> from the `session ? landing : loginPage>`
      // element on the `/` route.
      notifySessionChanged();
      navigate(selected.landing, { replace: true });
    } catch (err) {
      console.error('[surakkha] login failed', err);
      setLoginError(err instanceof Error ? err.message : 'login failed');
      setIsLoggingIn(false);
    }
  }
  return (
    <div className="login-shell">
      <aside className="brand-panel">
        <div className="brand-panel__mark">
          <div className="brand-panel__mark-glyph" aria-hidden="true">
            S
          </div>
          <div className="brand-panel__mark-text">Surakkha</div>
        </div>
        <h1 className="brand-panel__title">
          {t('login:brandPanel.title')}
          <br />
          {t('login:brandPanel.titleLine2')}
        </h1>
        <div className="brand-panel__live">
          <span className="brand-panel__live-dot" aria-hidden="true"></span>
          <span>
            {status === 'ready' && chainHeight !== null
              ? t('login:chain.liveWithCount', { count: chainHeight })
              : status === 'pending'
                ? t('login:chain.connecting')
                : t('login:chain.unreachable')}
          </span>
        </div>
      </aside>

      <main className="picker-panel">
        <div className="picker-panel__inner">
          <div
            className={`picker-status ${
              status === 'ready'
                ? 'picker-status--ready'
                : status === 'error'
                  ? 'picker-status--error'
                  : 'picker-status--pending'
            }`}
            data-testid="picker-status"
          >
            <span className="picker-status__dot" aria-hidden="true"></span>
            {status === 'ready'
              ? t('login:picker.statusReady')
              : status === 'error'
                ? t('login:picker.statusError')
                : t('login:picker.statusPending')}
          </div>

          <h2 className="picker-panel__heading">{t('login:picker.heading')}</h2>

          <div
            className="picker-list"
            role="radiogroup"
            aria-label={t('login:picker.radiogroupLabel')}
          >
            {PERSONAS.map((p) => {
              const isSel = p.id === selected.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  data-testid={`persona-${p.id}`}
                  className={`persona${isSel ? ' persona--selected' : ''}`}
                  onClick={() => {
                    setSelected(p);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      const idx = PERSONAS.findIndex((q) => q.id === selected.id);
                      const nextIdx =
                        e.key === 'ArrowDown'
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
                    <div
                      className="persona__hint"
                      style={{ fontSize: 'var(--font-size-xs)', color: 'var(--fg-tertiary)' }}
                    >
                      {p.hint}
                    </div>
                  </div>
                  <div className="persona__check" aria-hidden="true"></div>
                </button>
              );
            })}
          </div>

          <div className="picker-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={handleContinue}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? t('login:picker.signingIn') : t('login:picker.continue')}
            </button>
            {loginError ? (
              <div
                role="alert"
                className="picker-status picker-status--error"
                style={{ marginTop: 'var(--space-sm)' }}
              >
                {loginError}
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
