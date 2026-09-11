# StyleguidePage — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound (update to reflect lockdown tokens)
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/StyleguidePage.tsx`
> **Source scenario:** Internal (dev-only showcase; gated by `import.meta.env.DEV` in App.tsx)
> **Actors:** Internal team only

---

## 1. Existing implementation inventory

`StyleguidePage.tsx` is a dev-only showcase gated by `import.meta.env.DEV`. Renders a 2-column shell (Sidebar + main) and a vertical stack of `<Section>` cards — Container (3 widths + Full bleed), Button (4 variants × 3 sizes), Input (plain/icon/search/disabled), Card (no modifier / with-heading / compact), Modal (open/close with focus-trap demo), Toast (4 variants × 4s auto-dismiss with hover-pause), BandPill (3 bands), EmptyState (with CTA), Dropdown (5 patterns), TopChrome + Sidebar, Table (25-row fixture), DatePicker (5 patterns). Theme + locale toggles drive `document.body.dataset.theme` and `document.body.dataset.locale` so the showcase responds to the same hooks as production.

## 2. Lockdown binding (compact)

- The Styleguide MUST document lockdown-bound tokens, not legacy tokens. After Tier 2 reconciliations land, swap any showcase that still uses `--brand-*` / `--band-*` / `--success` / `--danger` / `--warning` / `--info` to lockdown tokens (`--color-primary`, `--color-trust-t1/t2/t3`, `--color-reporter-*`, `--color-status-*`).
- Trust band badge showcase: render glyph + text per lockdown §4.1 (`○`/`◔`/`◑`/`●`/`✓` + "T0/T1/T2/T3/resolved"), NOT Lucide icons. Currently uses `BandPill` which is 3-band (High/Medium/Low) — does not match the 5-band lockdown palette.
- Reporter-badge showcase: add a section showing the `--color-reporter-anchor/hotline/webform/sensor` chips with Lucide icons (Anchor / Phone / Edit / RadioTower).
- Danger button showcase: clarify that `variant="danger"` is reserved for T3+ consumer-notice issuance; the showcase currently demonstrates "Reject" / "Override" / "Force Resolve" — these are operator-internal destructive actions that should use `variant="secondary"` + warning icon, not Danger.
- Focus ring showcase: include a 2px primary-tint ring demo (lockdown §10.2).
- VS15 glyph demo: include the `✓\uFE0E` and `⚠\uFE0E` literals on a Bangla consumer surface (lockdown §2.7).
- Bangla line-height demo: render a Bangla sentence at `--line-height-body-bangla: 1.6` vs Latin `--line-height-body: 1.5` (foundation §2.3).
- Mono font showcase: render chain hashes / event IDs in `--font-family-mono` (IBM Plex Mono) — foundation §2.1, lockdown §typography-amendment.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Trust band showcase | `BandPill` 3-band (High/Medium/Low) | 5-band palette (T0/T1/T2/T3/resolved) with glyph + text per lockdown §4.1 | MAJOR — replace BandPill with a 5-band showcase; drop High/Medium/Low vocabulary. |
| 2 | Reporter-badge showcase | Not present | `--color-reporter-*` chip set per lockdown §1.1 | MAJOR — add reporter-badge section. |
| 3 | Danger button demo | "Reject" / "Override" / "Force Resolve" examples | Danger reserved for issuance path (foundation §7.1) | MAJOR — relabel examples to issuance-only ("Confirm consumer notice") or move destructive operator actions to Secondary + warning icon. |
| 4 | Focus ring showcase | Implicit (button class) | `2px solid --color-primary-tint` + `2px offset` (lockdown §10.2) | MINOR — add explicit focus-ring demo. |
| 5 | Bangla line-height demo | Not present | `--line-height-body-bangla: 1.6` (foundation §2.3) | MINOR — add Bangla text demo with line-height comparison. |
| 6 | VS15 glyph demo | Not present | `✓\uFE0E` / `⚠\uFE0E` on consumer surfaces (lockdown §2.7) | MINOR — add VS15 example. |
| 7 | Mono font for hashes | `.mono` class — system mono | IBM Plex Mono (foundation §2.1) | MINOR — bind to `--font-family-mono`. |
| 8 | Theme toggle | Light / Dark via `useTheme` | `[data-theme="dark"]` selector | OK |
| 9 | Locale toggle | English / Bangla | English + Bangla only | OK |
| 10 | Sidebar active-state demo | Yes | aria-current + border per lockdown §10.3 | OK |
| 11 | Toast hover-pause | Yes | State-change pattern (foundation §8) | OK |

## 4. Migration plan

1. Replace `BandPill` 3-band showcase with a 5-band lockdown showcase: glyph (`○`/`◔`/`◑`/`●`/`✓`) + text label + colour swatch per band.
2. Add reporter-badge section with Anchor (Lucide `Anchor`) / Phone (Lucide `Phone`) / Edit (Lucide `Edit`) / RadioTower (Lucide `RadioTower`) on top of each trust band.
3. Update Danger button demo copy to reflect the issuance-only reservation: "Confirm consumer notice" instead of "Reject" / "Override" / "Force Resolve". Add a "Destructive operator action" demo using `variant="secondary"` + warning icon.
4. Add a focus-ring section showing the `2px solid --color-primary-tint` ring with `2px offset` on a button + an input.
5. Add Bangla line-height demo: side-by-side Bangla sentence at `1.5` vs `1.6` leading.
6. Add VS15 demo: `✓` plain vs `✓\uFE0E` on a Bangla-locale sample message.
7. Bind `.mono` class to IBM Plex Mono via `--font-family-mono`.

## 5. Open questions

1. Should the Styleguide ship with a "Forbidden tokens" section that explicitly demonstrates what NOT to use (`emerald-*`, `blue-*`, `indigo-*`, `rose-*`, `alert-red` outside issuance) so reviewers can spot regressions?
2. Does the showcase include PHA-pane primitives (`AggregateTile`, `AuditBrowser`, dual-signature amendment queue)? Those are Phase 2 surfaces — current showcase correctly defers them, but the spec should note that.
