# LoginPage — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound (visual-only; login flow is backend-handled)
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/LoginPage.tsx`
> **Source scenario:** Implicit (every persona starts here)
> **Actors:** All (login picker)

---

## 1. Existing implementation inventory

`LoginPage.tsx` renders the persona picker (`login-shell` with `brand-panel` + `picker-panel`). Six persona buttons via `radiogroup` (priya, anjali, pha_approver, pha_viewer, vendor, karim). Live chain-status strip in the brand panel (block height + last-block age from `/api/chain/head`). Continue button posts to MSW mock backend via `loginAs(selected.id)`, writes session to IndexedDB, fires `surakkha:session-changed`, and navigates to `selected.landing`. Keyboard nav: ArrowUp/Down cycles selected persona.

## 2. Lockdown binding (compact)

- Out of scope for Phase 4 design (login flow is backend-handled). Spec covers **visual lockdown binding only**.
- Logo / brand mark "S" in `brand-panel__mark-glyph` — bind to `--color-primary` (deep teal `#0F4C5C`).
- Live chain-status dot in `brand-panel__live-dot` — coloured per `status` (ready / pending / error). Reserve `alert-red` for issuance path; error dot should use `--color-status-warn` (amber) or `--color-status-failed` if it qualifies.
- Continue button uses class `button button--primary` (legacy selectors). Lockdown primary = `--color-primary` deep teal (foundation §7.1).
- Focus ring: `2px solid --color-primary-tint` with `2px offset` (lockdown §10.2, audit §B.12) — replaces the audit-flagged "emerald-600 ring".
- Bangla toggle not on LoginPage itself; the login surface is locale-neutral until persona is selected. **MINOR:** confirm Bangla copy exists for `login:brandPanel.title` and `login:picker.heading` (the page calls `useTranslation()` not `useTranslation('login')` with explicit ns).
- Persona picker is accessible: `role="radiogroup"` + `role="radio"` + `aria-checked`. OK per lockdown §10.3 keyboard nav.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Brand mark colour | `var(--brand-500)` legacy | `--color-primary` (deep teal) | MINOR — swap to `--color-primary`. |
| 2 | Primary CTA (Continue) | `button button--primary` legacy class | Lockdown primary = `--color-primary` | MINOR — verify class resolves to deep teal, not legacy blue. |
| 3 | Live chain-status dot | `.brand-panel__live-dot` — colour undefined in spec | Three-state colour: ready = safe-green, pending = neutral, error = status-warn (NOT alert-red reserved) | MINOR — bind error dot to `--color-status-warn`. |
| 4 | Picker status colour | `picker-status--ready/--error/--pending` classes | Same three-state mapping | MINOR — verify `--error` resolves to `--color-status-warn`, not alert-red. |
| 5 | Focus ring | Inherited from `button` class | `2px solid --color-primary-tint` + `2px offset` | MINOR — bind focus ring per lockdown §10.2. |
| 6 | Login error display | Inline `<div role="alert">` with error message | Form validation uses `--color-status-warn` (foundation §13 rule) | OK — error text is informational, not form-validation |
| 7 | Persona card selection state | `persona--selected` legacy class | Lockdown focus-visible + checkmark iconography OK | OK |
| 8 | Localised copy | `useTranslation()` (no namespace) | Locale-at-container per lockdown §11.4. ns implicit = OK. | OK |
| 9 | Direct person → persona mapping | Hardcoded `PERSONA_INITIALS` table | N/A — data model is unchanged | OK |

## 4. Migration plan

1. Bind `brand-panel__mark-glyph` background to `--color-primary` (deep teal).
2. Bind focus rings on persona cards + Continue CTA to `2px solid --color-primary-tint` with `2px offset` per lockdown §10.2.
3. Bind `picker-status--error` colour to `--color-status-warn` (amber) — reservation rule: alert-red is issuance path only.
4. Verify the `button--primary` class resolves to `--color-primary` (deep teal), not legacy blue.
5. Add a Bangla string pass to the `login:brandPanel.*` and `login:picker.*` keys (locale-at-container toggle on the parent route will surface the existing `en` copy; ensure `bn` exists with parallel text).

## 5. Open questions

1. Should the login page offer a language toggle inline (English / Bangla), or does the container locale decide (default English until persona selected)?
2. Is the live chain-status dot on login meant to communicate readiness for an operator to start work, or purely informational? If the former, consider semantic markers beyond colour.
