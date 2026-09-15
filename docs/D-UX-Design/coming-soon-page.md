# ComingSoonPage — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/ComingSoonPage.tsx`
> **Source scenario:** Internal (placeholder for unimplemented persona landings)
> **Actors:** Any persona whose landing route does not yet have a Phase 1 page

---

## 1. Existing implementation inventory

`ComingSoonPage.tsx` is a placeholder rendered inside `<AppLayout>` for persona landings that don't yet have a Phase 1 React page (e.g., `/submit` for non-Anjali roles historically, `/approve`, `/audit`, `/vendor`). Renders a single `Card` (with-heading modifier) at `ContainerWidth.Narrow` showing the landing label, a description, a trailer line, and a Back button that calls `logout()`. Reads `session.role` + `session.display_name` from `useAppLayout()` for the role-gated subtitle.

## 2. Lockdown binding (compact)

- Bangla-first copy (lockdown §11.2) — placeholder copy must exist in `bn` locale.
- Card modifier `with-heading` — bind to `--space-xl` block padding per lockdown §3.5.
- Back button is destructive in spirit (logs the user out) — should NOT use `variant="danger"` (reserved for issuance). Use `variant="secondary"` with a confirmation prompt, or `variant="ghost"`.
- Lockdown trust-bridge rule (foundation §6): rounded corners carry the humane trust-bridge cue. The placeholder Card uses `--radius-md` (4px) per lockdown radii; verify the class resolves to that, not legacy `rounded-md` (8px).
- Bangla numerals / locale-at-container: trailer copy follows the container locale.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Container width | `ContainerWidth.Narrow` (720) | 720 OK for placeholder focused reading | OK |
| 2 | Card modifier | `with-heading` (24px block padding) | `--space-xl` = 24px per foundation §5 | OK |
| 3 | Back button | `variant="secondary"` | OK — secondary is correct for non-issuance actions | OK |
| 4 | Logout behaviour | Direct call to `logout()` from Back button | Logout should ideally route through the AppLayout top-chrome logout button for consistency; Back-as-logout is unconventional | MINOR — UX clarity: rename to "Sign out" and route through top-chrome, or add a confirm modal. |
| 5 | Bangla copy | `useTranslation('comingSoon')` keyed | Locale-at-container | OK |
| 6 | Placeholder iconography | None | Optional: lockup glyph (`○`) per lockdown §4.1 to signal "not yet verified" state | MINOR |
| 7 | Rounded corners | Inherited from Card | Lockdown §6 trust-bridge: do NOT switch to 0px | OK |

## 4. Migration plan

1. Rename "Back" to "Sign out" and route through `AppLayout`'s top-chrome logout (already wired); drop the inline Back button from the placeholder, or keep it as a Secondary ghost that calls logout for persona who lacks chrome awareness.
2. Add an optional `○` glyph in the Card heading to signal the "not yet verified" / placeholder state per lockdown §4.1.
3. Confirm Bangla trailer copy exists in `comingSoon:card.trailer` for `bn` locale.

## 5. Open questions

1. Should the placeholder surface also offer a "Switch persona" CTA (which would route back to `/`) for personas who landed here by mistake?
2. Is the "Sign out via Back" pattern intentional (i.e., the placeholder is the only way to leave the surface because the persona's real landing is missing)? If so, document it; otherwise, defer to top-chrome logout.
