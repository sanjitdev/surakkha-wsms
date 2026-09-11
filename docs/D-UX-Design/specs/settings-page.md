# Settings — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/Settings.tsx`
> **Source scenario:** Implicit (operator settings; dim 5 §05-settings-lockdown.md defines 6 SettingControl kinds)
> **Actors:** All authenticated personas (theme + locale + role-gated Anjali filter; reset is destructive)

---

## 1. Existing implementation inventory

`Settings.tsx` renders four stacked Cards in `ContainerWidth.Bangla`: Theme (Light/Dark toggle pair bound to `useTheme`), Locale (English/Bangla toggle pair bound to `useLocale`), Anjali IncidentDate filter (role-gated to `anjali` — `DatePicker` + Clear), Persona (read-only display of `session.role` + `session.display_name` with a `badge--t1` chip), and Reset (DangerButton calling `resetEverything()` which wipes localStorage + IndexedDB and reloads). All persistence happens in hooks (theme/locale) or IndexedDB (session/chain).

## 2. Lockdown binding (compact)

- Bangla-first per foundation §11.2; Settings surface is locale-at-container (lockdown §11.4).
- 6 SettingControl kinds per dim 5 §05-settings-lockdown.md: toggle / select / text / numeric / link / danger. Settings page implements **toggle** (Theme, Locale) and **danger** (Reset). The Anjali filter adds a **date-picker** pattern (extension to the 6 kinds, OK as composition).
- Theme: Light / Dark via `[data-theme="dark"]` selector (foundation §1.4, lockdown §color-lockdown §10). Dark mode is supported, NOT forbidden (audit §B.4 — Phase 4 was wrong to forbid it).
- Locale: English / Bangla (lockdown §11.1 — no Hindi in Phase 1).
- Reset: Destructive action; lockdown §7.1 Danger variant reserved for **issuance path only**. **Current usage is a MAJOR conflict:** Reset button uses `variant="danger"` but is not T3+ issuance — should be Secondary or Ghost.
- Persona readout: `badge--t1` — T1 in lockdown is divider neutral, NOT sky-blue (audit §B.1).
- Anjali filter: role-gated; reads `useAnjaliFilter()` (localStorage-backed).

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Locale | English / Bangla (no Hindi) | English + Bangla only (lockdown §11.1) | OK |
| 2 | Theme | Light / Dark toggle | `[data-theme="dark"]` selector (foundation §1.4) | OK |
| 3 | Reset button variant | `variant="danger"` | Danger reserved for T3+ issuance path (foundation §7.1) | MAJOR — swap to `variant="ghost"` or `variant="secondary"` with confirmation modal. The destructive action warrants a modal confirmation (lockdown §3.4 modal pattern), not a Danger CTA. |
| 4 | Persona readout badge | `badge--t1` (legacy sky-blue) | T1 = divider neutral (lockdown §1.1) | MEDIUM — bind to `--color-trust-t1`. |
| 5 | Theme + Locale toggle pair | Primary (active) / Secondary (inactive) | Lockdown: Primary for the selected state is OK | OK |
| 6 | Anjali filter DatePicker | `DatePicker` from `components/ui/DatePicker` | Composition from existing primitives (foundation §7.6) | OK |
| 7 | Reset confirmation | No confirmation modal | Destructive action → confirmation modal (lockdown §3.4) | MAJOR — add a confirm-modal pattern before wiping localStorage/IndexedDB. |
| 8 | Bangla strings | `useTranslation('settings')` keyed | Locale-at-container (lockdown §11.4) | OK |
| 9 | Container width | `ContainerWidth.Bangla` (1080) | 1080 = mid-width column (dim 5 §7.7) | OK |
| 10 | Role-gating (Anjali filter) | `session.role === 'anjali'` renders the card | Role-gating pattern (foundation §12 rule 9: named actors) | OK |

## 4. Migration plan

1. Replace Reset `variant="danger"` with `variant="ghost"` + a confirm-modal before calling `resetEverything()`.
2. Bind `badge--t1` on the persona readout to `--color-trust-t1` (divider neutral) — same migration as inbox-list.md / citizen-ack-page.md.
3. Verify all 4 setting cards render in `--space-xl` gap; add binding if not present.
4. Document locale-at-container behaviour in the spec: persona's saved locale choice persists across sessions; new sessions default to the persona's default (operator = English, anjali = Bangla).

## 5. Open questions

1. Should the destructive Reset action require a second confirmation (typed-string or hold-to-confirm), or is a single confirm-modal sufficient?
2. Should the Anjali filter persist as a session-level preference or a per-incident query parameter? (Currently `useAnjaliFilter()` is localStorage-backed.)
