/**
 * ComingSoonPage.tsx — placeholder for unbuilt persona landings.
 *
 * Several personas in mocks/session.ts declare landings (/submit,
 * /approve, /audit, /vendor) that don't have a Phase 1 React page yet.
 * App.tsx mounts this placeholder inside the authenticated <AppLayout>
 * shell so the persona still sees the sidebar + top-chrome + logout
 * button — only the page content is "coming soon".
 *
 * Why inside the chrome (post FE-1.6a):
 *   Before this story, ComingSoonPage rendered bare (no sidebar). The
 *   rationale was "this surface isn't real yet, give it a humble
 *   look." But that meant the placeholder persona had no logout
 *   button — a regression risk. Inside <AppLayout>, the persona's
 *   full chrome is present, the sidebar shows their role's nav (so
 *   PHA Viewer sees "Audit" as a sidebar link they can visit), and
 *   TopChrome still pulses.
 *
 * Session source:
 *   ComingSoonPage reads the session via `useAppLayout()` instead of
 *   receiving it as a prop. This means App.tsx no longer needs to
 *   inject `persona={session}` and `landing={...}` — only the page-
 *   specific text (landing label + description) comes from the route.
 */

import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ContainerWidth } from '../types/domain';
import { useAppLayout } from '../components/layout/AppLayoutContext';

interface ComingSoonPageProps {
  landing: string;
  description: string;
}

export function ComingSoonPage({ landing, description }: ComingSoonPageProps) {
  const { t: tComing } = useTranslation('comingSoon');
  const { session, logout } = useAppLayout();

  return (
    <Container width={ContainerWidth.Narrow}>
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1>{landing}</h1>
            <div className="page-header__sub">
              {tComing('subtitle', { role: session.role, name: session.display_name })}
            </div>
          </div>
        </div>
      </div>
      <Card modifier="with-heading" testId="coming-soon-card">
        <div style={{ padding: 'var(--space-lg)' }}>
          <h3 className="data-card__title" style={{ marginBottom: 'var(--space-md)' }}>
            {tComing('card.title')}
          </h3>
          <p style={{ color: 'var(--fg-secondary)', marginBottom: 'var(--space-md)' }}>
            {description}
          </p>
          <p
            style={{
              color: 'var(--fg-tertiary)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            {tComing('card.trailer')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void logout();
              }}
            >
              {tComing('card.back')}
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
