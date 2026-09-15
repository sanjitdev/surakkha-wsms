# WO-014 — Settings Page

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/Settings.tsx` (278 LOC) — operator preferences. **5 MAJOR items** includes: Settings Reset → ghost variant + confirmation modal.

## Scope

**In:**
- Theme toggle (light/dark via `[data-theme]` attribute)
- Locale preference (EN/BN) persisted in IDB
- Notification preferences (in-app toast vs SMS)
- **MAJOR #3:** Reset → ghost variant (not destructive) + confirmation modal (`"Reset all settings? This cannot be undone."`)
- Reset clears IDB preferences and emits `SettingsReset{actor}`

**Out:** Account-level settings (Phase 1.7+)

## Acceptance criteria

1. Renders at `/settings` for `utility_operator`
2. Theme toggle persists across reloads
3. Locale preference persists
4. Notification preferences persist
5. **MAJOR #3:** Reset button is **ghost variant** (not destructive); click opens confirmation modal
6. Reset confirmation clears IDB + emits `SettingsReset` event
7. No Hindi strings

## Wire contract

- Read: local IDB (preferences)
- Emit: `POST /api/events` with `SettingsReset{actor}`

## i18n keys

Add to `settings.json` (en + bn): theme labels, locale labels, notification options, reset confirmation.

## Tests + lockdown compliance

- Vitest: `fe-settings-reconcile.test.tsx`
- Lockdown: theme + locale persisted, EN+BN only

---

_Ready for Stage 6._
