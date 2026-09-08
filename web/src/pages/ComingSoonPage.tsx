/**
 * ComingSoonPage.tsx — placeholder for unbuilt persona landings.
 *
 * Several personas in mocks/session.ts declare landings (/submit,
 * /approve, /audit, /vendor) that don't have a Phase 1 React page yet.
 * Rather than letting `<LoginPage />` swallow them via the catch-all
 * route (which created an infinite re-login loop), this placeholder
 * mounts in their place. It shows the persona + role + a "Sign in as
 * different persona" link that clears the session and routes back to /.
 *
 * Built around the existing primitives — TopChrome + Container + Card +
 * Button — so the visual rhythm matches the operator surfaces.
 */

import { useNavigate } from 'react-router-dom';
import { TopChrome } from '../components/layout/TopChrome';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { SessionRow } from '../mocks/idb';
import { logout } from '../mocks/session';
import { notifySessionChanged } from '../mocks/session-bus';
import { ContainerWidth } from '../types/domain';

interface ComingSoonPageProps {
  persona: SessionRow;
  landing: string;
  description: string;
}

export function ComingSoonPage({ persona, landing, description }: ComingSoonPageProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    notifySessionChanged();
    navigate('/', { replace: true });
  }

  return (
    <div className="app-shell">
      <div className="main">
        <TopChrome personaLabel={persona.display_name} />
        <Container width={ContainerWidth.Narrow}>
          <div className="page-header">
            <div className="page-header__row">
              <div>
                <h1>{landing}</h1>
                <div className="page-header__sub">
                  {persona.role} · {persona.display_name}
                </div>
              </div>
            </div>
          </div>
          <Card modifier="with-heading" testId="coming-soon-card">
            <div style={{ padding: 'var(--space-lg)' }}>
              <h3 className="data-card__title" style={{ marginBottom: 'var(--space-md)' }}>
                Coming in a later story
              </h3>
              <p style={{ color: 'var(--fg-secondary)', marginBottom: 'var(--space-md)' }}>
                {description}
              </p>
              <p style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                This persona is wired to the chain and the session row is live — only
                the page surface is deferred. Click below to return to the login picker
                and try a different persona.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <Button variant="secondary" size="sm" onClick={handleLogout}>
                  ← Back to login
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </div>
    </div>
  );
}