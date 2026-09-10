/**
 * Settings.tsx — FE-1.5d.
 *
 * Settings surface at /settings. Per dim 5 §7.7:
 *   - Container width="bangla" (1080 px) — settings forms fit naturally
 *     in the mid-width column; not narrow (modal-feel) nor wide (table).
 *   - 3 stacked <Card> sections: Theme, Locale, Reset.
 *     Each card groups one concern so the page reads as a vertical
 *     stack of independent settings.
 *   - Theme + Locale are toggle <Button> pairs reading existing hooks
 *     (useTheme, useLocale) — single source of truth, no prop drilling.
 *   - Role config is read-only — the persona is selected on the login
 *     picker, not editable here.
 *   - Reset is a DangerButton that calls resetEverything() and reloads
 *     the page. Plain English copy explains the consequence.
 *
 * Why composition only:
 *   - All real persistence already happens in localStorage (theme,
 *     locale) and IndexedDB (session, chain). Reset just wipes those.
 *   - There is no backend "update profile" endpoint — the persona is
 *     login-time only.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../mockups/01-priya/dashboard.css';
import '../styles/settings.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../hooks/useTheme';
import { useLocale } from '../hooks/useLocale';
import { useAnjaliFilter } from '../hooks/useAnjaliFilter';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { resetEverything } from '../mocks/reset';
import { DatePicker } from '../components/ui/DatePicker';
import { ContainerWidth, Locale, Theme } from '../types/domain';

export function Settings() {
  const { t: tSettings } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { from: anjaliFrom, setFrom: setAnjaliFrom, clear: clearAnjaliFrom } = useAnjaliFilter();
  const { session } = useAppLayout();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetEverything();
      // resetEverything() calls window.location.reload() — control
      // does not return from this branch under normal conditions.
    } catch (err) {
      console.error('[surakkha] settings reset failed', err);
      setResetting(false);
    }
  };

  return (
    <Container width={ContainerWidth.Bangla}>
      <div className="page-header" data-testid="settings-header">
        <h1>{tSettings('header.title')}</h1>
        <p className="page-header__sub">
          {tSettings('header.subtitle', { name: session.display_name, role: session.role })}
        </p>
      </div>

      {/* ── Theme section ──────────────────────────────────────── */}
      <Card testId="settings-theme-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">{tSettings('theme.title')}</h3>
            <p className="settings-row__sub">{tSettings('theme.subtitle')}</p>
          </div>
          <div
            className="settings-row__control"
            role="group"
            aria-label={tSettings('theme.ariaLabel')}
            data-testid="settings-theme-control"
          >
            <Button
              variant={theme === Theme.Light ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setTheme(Theme.Light);
              }}
              testId="settings-theme-light"
            >
              {tSettings('theme.light')}
            </Button>
            <Button
              variant={theme === Theme.Dark ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setTheme(Theme.Dark);
              }}
              testId="settings-theme-dark"
            >
              {tSettings('theme.dark')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Locale section ─────────────────────────────────────── */}
      <Card testId="settings-locale-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">{tSettings('language.title')}</h3>
            <p className="settings-row__sub">{tSettings('language.subtitle')}</p>
          </div>
          <div
            className="settings-row__control"
            role="group"
            aria-label={tSettings('language.ariaLabel')}
            data-testid="settings-locale-control"
          >
            <Button
              variant={locale === Locale.En ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setLocale(Locale.En);
              }}
              testId="settings-locale-en"
            >
              {tSettings('language.english')}
            </Button>
            <Button
              variant={locale === Locale.Bn ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setLocale(Locale.Bn);
              }}
              testId="settings-locale-bn"
            >
              {tSettings('language.bangla')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Anjali IncidentDate filter (role-gated) ────────────── */}
      {session.role === 'anjali' ? (
        <Card testId="settings-anjali-card">
          <div className="settings-row">
            <div className="settings-row__label">
              <h3 className="settings-row__title">{tSettings('anjali.title')}</h3>
              <p className="settings-row__sub">{tSettings('anjali.subtitle')}</p>
            </div>
            <div className="settings-row__control" data-testid="settings-anjali-control">
              <DatePicker
                value={anjaliFrom}
                onChange={setAnjaliFrom}
                testId="settings-anjali-from"
                aria-label={tSettings('anjali.ariaFrom')}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={clearAnjaliFrom}
                disabled={anjaliFrom === null}
                testId="settings-anjali-clear"
              >
                {tSettings('anjali.clear')}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── Role / persona section (read-only) ─────────────────── */}
      <Card testId="settings-role-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">{tSettings('persona.title')}</h3>
            <p className="settings-row__sub">{tSettings('persona.subtitle')}</p>
          </div>
          <div
            className="settings-row__control settings-row__readout"
            data-testid="settings-role-readout"
          >
            <span className="badge badge--t1" data-testid="settings-role-role">
              {session.role}
            </span>
            <span className="settings-row__display-name">{session.display_name}</span>
          </div>
        </div>
      </Card>

      {/* ── Reset section (destructive) ────────────────────────── */}
      <Card testId="settings-reset-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">{tSettings('reset.title')}</h3>
            <p className="settings-row__sub">{tSettings('reset.subtitle')}</p>
          </div>
          <div className="settings-row__control">
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                void handleReset();
              }}
              disabled={resetting}
              testId="settings-reset-button"
            >
              {resetting ? tSettings('reset.buttonBusy') : tSettings('reset.buttonIdle')}
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
