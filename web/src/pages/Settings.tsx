/**
 * Settings.tsx — FE-1.5d.
 *
 * Settings surface at /settings. Per dim 5 §7.7:
 *   - Container width="bangla" (1080 px) — settings forms fit naturally
 *     in the mid-width column; not narrow (modal-feel) nor wide (table).
 *   - Stacked <Card> sections: Theme, Locale, Anjali filter (role-gated),
 *     Persona (read-only), Reset. Each card groups one concern so the
 *     page reads as a vertical stack of independent settings.
 *   - Theme + Locale are toggle <Button> pairs reading existing hooks
 *     (useTheme, useLocale) — single source of truth, no prop drilling.
 *   - Role config is read-only — the persona is selected on the login
 *     picker, not editable here.
 *   - Reset is a destructive action; lockdown §7.1 reserves the Danger
 *     button variant for the T3+ issuance path only. Settings uses
 *     `variant="ghost"` plus a confirmation <Modal> (lockdown §3.4
 *     modal pattern) before emitting `SettingsReset{actor}` to the
 *     chain and clearing IDB.
 *
 * Why composition only:
 *   - All real persistence already happens in localStorage (theme,
 *     locale) and IndexedDB (session, chain). Reset just wipes those.
 *   - There is no backend "update profile" endpoint — the persona is
 *     login-time only.
 *
 * Lockdown cascade (2026-09-11):
 *   - Reset: variant="danger" → variant="ghost"; confirmation <Modal>
 *     before destructive action.
 *   - Persona readout: badge--t1 → badge--t1-locked (divider neutral
 *     --color-trust-t1, not legacy sky-blue).
 *
 * WO-014 (2026-09-15) — wire contract:
 *   - On Reset confirmation, POST /api/events with envelope
 *     `{ event_type: "SettingsReset", actor_identity: { kind, ref,
 *     display }, payload: { actor: <actor_ref> } }` BEFORE wiping IDB.
 *   - Then `wipeAll()` clears local chain + session + meta + theme/locale.
 *   - Finally `window.location.reload()` to surface the sign-in screen.
 *   - Failures in the POST are swallowed (best-effort audit) so a
 *     network blip doesn't block the user from resetting.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/settings.css';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useTheme } from '../hooks/useTheme';
import { useLocale } from '../hooks/useLocale';
import { useAnjaliFilter } from '../hooks/useAnjaliFilter';
import { useAppLayout } from '../components/layout/AppLayoutContext';
import { wipeAll } from '../mocks/idb';
import { DatePicker } from '../components/ui/DatePicker';
import { ContainerWidth, Locale, Theme } from '../types/domain';

export function Settings() {
  const { t: tSettings } = useTranslation('settings');
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const { from: anjaliFrom, setFrom: setAnjaliFrom, clear: clearAnjaliFrom } = useAnjaliFilter();
  const { session } = useAppLayout();
  const [resetting, setResetting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      // WO-014 wire contract — emit `SettingsReset{actor}` to the chain
      // BEFORE wiping IDB. This is best-effort: a network blip should
      // not block the destructive reset. The audit log (and any
      // downstream dashboards) still receives the canonical event from
      // the chain projection once the gateway processes the POST.
      const actorRef = session.actor_ref;

      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            event_type: 'SettingsReset',
            actor_identity: {
              kind: session.role,
              ref: actorRef,
              display: session.display_name,
            },
            payload: { actor: actorRef },
          }),
        });
      } catch (emitErr) {
        // eslint-disable-next-line no-console
        console.warn('[surakkha] settings reset emit failed', emitErr);
      }

      // Clear IDB (chain + session + meta) directly instead of going
      // through mocks/reset.resetEverything() so the wire emit happens
      // first. The end state is identical: a wiped DB + a reload.
      await wipeAll();
      window.location.reload();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[surakkha] settings reset failed', err);
      setResetting(false);
      setConfirmOpen(false);
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

      <div className="settings-page__stack" data-testid="settings-stack">

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
            <span className="badge badge--t1-locked" data-testid="settings-role-role">
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
            {/* Lockdown cascade 2026-09-11: variant="danger" is reserved
                for the issuance path. Reset is destructive but not T3+
                issuance, so it uses variant="ghost" + a confirm-modal. */}
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setConfirmOpen(true);
              }}
              disabled={resetting}
              testId="settings-reset-button"
            >
              {resetting ? tSettings('reset.buttonBusy') : tSettings('reset.buttonIdle')}
            </Button>
          </div>
        </div>
      </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!resetting) setConfirmOpen(false);
        }}
        ariaLabel={tSettings('reset.confirmAria')}
        testId="settings-reset-confirm-modal"
      >
        <h2
          id="settings-reset-confirm-title"
          style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: 'var(--fg-default)' }}
        >
          {tSettings('reset.confirmHeading')}
        </h2>
        <p
          style={{
            margin: 'var(--space-md) 0 var(--space-lg)',
            color: 'var(--fg-secondary)',
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-body)',
          }}
        >
          {tSettings('reset.confirmBody')}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setConfirmOpen(false);
            }}
            disabled={resetting}
            testId="settings-reset-confirm-cancel"
          >
            {tSettings('reset.confirmCancel')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              void handleReset();
            }}
            disabled={resetting}
            testId="settings-reset-confirm-confirm"
          >
            {resetting ? tSettings('reset.buttonBusy') : tSettings('reset.confirmConfirm')}
          </Button>
        </div>
      </Modal>
    </Container>
  );
}
