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
        <h1>Settings</h1>
        <p className="page-header__sub">
          Preferences for this device · {session.display_name} · {session.role}
        </p>
      </div>

      {/* ── Theme section ──────────────────────────────────────── */}
      <Card testId="settings-theme-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">Theme</h3>
            <p className="settings-row__sub">
              Switch between light and dark mode. Choice is remembered on this device.
            </p>
          </div>
          <div
            className="settings-row__control"
            role="group"
            aria-label="Theme"
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
              Light
            </Button>
            <Button
              variant={theme === Theme.Dark ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setTheme(Theme.Dark);
              }}
              testId="settings-theme-dark"
            >
              Dark
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Locale section ─────────────────────────────────────── */}
      <Card testId="settings-locale-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">Language</h3>
            <p className="settings-row__sub">
              Switch between English and বাংলা (Bangla). Affects all UI copy on this device.
            </p>
          </div>
          <div
            className="settings-row__control"
            role="group"
            aria-label="Language"
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
              English
            </Button>
            <Button
              variant={locale === Locale.Bn ? 'primary' : 'secondary'}
              size="md"
              onClick={() => {
                setLocale(Locale.Bn);
              }}
              testId="settings-locale-bn"
            >
              বাংলা
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Anjali IncidentDate filter (role-gated) ────────────── */}
      {session.role === 'anjali' ? (
        <Card testId="settings-anjali-card">
          <div className="settings-row">
            <div className="settings-row__label">
              <h3 className="settings-row__title">Citizen reports</h3>
              <p className="settings-row__sub">
                Scope citizen reports to those filed from this date forward. Affects the reports
                you see on the dashboard. Persists on this device.
              </p>
            </div>
            <div className="settings-row__control" data-testid="settings-anjali-control">
              <DatePicker
                value={anjaliFrom}
                onChange={setAnjaliFrom}
                testId="settings-anjali-from"
                aria-label="Filter citizen reports from date"
              />
              <Button
                variant="secondary"
                size="md"
                onClick={clearAnjaliFrom}
                disabled={anjaliFrom === null}
                testId="settings-anjali-clear"
              >
                Clear
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* ── Role / persona section (read-only) ─────────────────── */}
      <Card testId="settings-role-card">
        <div className="settings-row">
          <div className="settings-row__label">
            <h3 className="settings-row__title">Persona</h3>
            <p className="settings-row__sub">
              The role you logged in with. To switch persona, log out and pick another from the
              sign-in screen.
            </p>
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
            <h3 className="settings-row__title">Reset demo</h3>
            <p className="settings-row__sub">
              Clears the local chain, session, and theme/locale prefs, then reloads the page. Use
              this when you want to start fresh from the seeded fixtures.
            </p>
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
              {resetting ? 'Resetting…' : 'Reset everything'}
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
