/**
 * ComingSoonPage.tsx — placeholder for unbuilt persona landings.
 *
 * Several personas in mocks/session.ts declare landings (/approve,
 * /audit, /vendor) that don't have a Phase 1 React page yet. App.tsx
 * mounts this placeholder inside the authenticated <AppLayout> shell
 * so the persona still sees the sidebar + top-chrome + logout button
 * — only the page content is "coming soon".
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
 * WO-016 reconciliation:
 *   - Back button renamed "Sign out" (it calls `logout()`). Per the
 *     lockdown cascade, Back-as-logout is destructive in spirit and
 *     MUST NOT use `variant="danger"` (reserved for T3+ consumer-
 *     notice issuance). It uses `variant="secondary"` per §2 of the
 *     Tier 3 reconciliation diff.
 *   - Card heading now prefixes the T0 `○` glyph as an optional
 *     "not-yet-verified / placeholder" cue per foundation §4.1.
 *   - Title now states "Coming in Phase 2" so the placeholder
 *     distinguishes itself from a live but deferred page.
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
          {/* ○ = T0 unverified glyph (foundation §4.1). Non-interactive;
              signals the placeholder is "not yet verified" content. */}
          <h3
            className="data-card__title"
            style={{ marginBottom: 'var(--space-md)' }}
            data-testid="coming-soon-title"
          >
            <span aria-hidden="true" data-testid="coming-soon-title-glyph">
              {tComing('card.titlePrefix')}
            </span>{' '}
            {tComing('card.title')}
          </h3>
          <p
            style={{ color: 'var(--fg-secondary)', marginBottom: 'var(--space-md)' }}
            data-testid="coming-soon-phase-notice"
          >
            {tComing('card.phaseNotice')}
          </p>
          <p style={{ color: 'var(--fg-secondary)', marginBottom: 'var(--space-md)' }}>
            {description}
          </p>
          <p
            style={{
              color: 'var(--fg-tertiary)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-lg)',
            }}
            data-testid="coming-soon-trailer"
          >
            {tComing('card.trailer')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <Button
              variant="secondary"
              size="sm"
              testId="coming-soon-sign-out"
              onClick={() => {
                void logout();
              }}
            >
              {tComing('card.signOut')}
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
