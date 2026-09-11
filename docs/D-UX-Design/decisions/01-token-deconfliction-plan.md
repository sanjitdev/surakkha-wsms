# Token Deconfliction Plan — Surakkha v1

> Status: Plan + token-bridge, not a full rewrite
> Source: 00-lockdown-audit.md §E.4, audit step 4
> Cascade owner: Freya
> Produced by Saga/Freya — 2026-09-11

---

## A. The state of CSS tokens in the repo

Three CSS token systems are now in play. They were not built to interoperate.

| System | Origin | Tokens | Status |
|--------|--------|--------|--------|
| **bmad lockdown** (DESIGN.md + 18 dim files) | ratified 2026-09-06 | `--color-primary` (`#0F4C5C`), `--color-trust-t1/2/3`, `--color-reporter-anchor`, etc. | Authoritative; "spine wins on conflict" |
| **Existing web/mockups/theme.css** | shipped Phase 1.6a | `--brand-*` (blue-toned), `--band-high/medium/low` (green/grey/light-grey), `--badge-trusted/new/caution`, dark default + `[data-theme="light"]` swap | Active in 6 files; do not break the build |
| **Phase 4 foundation** (now superseded) | my 2026-09-10 draft | `--color-trust-t1/2/3` (emerald/sky/amber), `--color-trust-overridden` (indigo) | Superseded by lockdown-bound foundation rewrite 2026-09-11; never shipped |

The Phase 4 token names (`--color-trust-t1/2/3`) collided with the lockdown token names (`--color-trust-t1/2/3`). The existing `theme.css` uses different names (`--band-high/medium/low`, `--badge-trusted/new/caution`) so there is no three-way name collision — only a semantic collision.

## B. Resolution strategy

**Add lockdown tokens alongside existing tokens; do not rewrite existing tokens in Phase 4.**

Rationale:

1. **The 6 files consuming `--band-*` are working.** `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`, `OperatorDashboard.tsx`, `components.css`, `inbox.css`. The build passes. Touching them in Phase 4 risks regression on the working Phase 1.6a demo.
2. **Lockdown tokens describe a new dimension** — reporter-badge (anchor/hotline/webform/sensor) is genuinely new. The existing `--band-*` tokens cover trust-band tiers. Both are needed; they are orthogonal.
3. **Tier 2 reconciliations (Step 5) will progressively migrate components from `--band-*` to `--color-trust-t1/2/3`.** That is a multi-PR job, not a single Phase 4 commit.

So this step is **additive**: introduce lockdown tokens, document the migration path, leave existing tokens untouched.

## C. Token bridge — what gets added to `theme.css`

Append a new section to `web/mockups/theme.css`:

```css
/* ── Lockdown tokens (added 2026-09-11) ────────────────────────────
   Per docs/D-UX-Design/decisions/00-lockdown-audit.md and
   docs/D-UX-Design/01-design-system-foundation.md. These tokens
   describe:
   1. Brand palette (deep teal) — replaces the blue-toned --brand-*
      tokens in future migrations. Both currently coexist.
   2. Trust band palette (T1/T2/T3/resolved) — supersedes
      --band-high/medium/low in future migrations.
   3. Reporter-badge palette (anchor/hotline/webform/sensor) — NEW
      dimension not present in --band-* tokens.
   4. Status palette (pending/verified/failed/warn) — supersedes
      --success/warning/danger/info in future migrations.
   5. Typography — IBM Plex Sans/Mono + Noto Sans Bengali. Existing
      typography tokens stay; lockdown tokens are additive aliases.

   Migration path: Tier 2 reconciliation PRs will progressively
   replace --band-* and --brand-* usages with these tokens. Until
   then, both systems coexist. ──────────────────────────────────────── */

/* 1. Brand palette */
--color-primary:           #0F4C5C; /* deep teal — primary CTA */
--color-primary-tint:      #3F6E7C; /* hover, focus ring, secondary */
--color-surface:           #FAF7F2; /* warm off-white */
--color-ink:               #1B2026; /* body text, AAA */
--color-amber:             #B8801E; /* calibrated warning */
--color-amber-bright:      #E9A23B; /* large UI only */
--color-safe-green:        #2F6E45; /* resolved / verified */
--color-alert-red:         #B23A2A; /* T3+ issuance ONLY */
--color-alert-red-reserved:#B23A2A; /* same hex, lint-enforced */
--color-divider:           #E1DDD4; /* panel separator */

/* 2. Trust band palette */
--color-trust-t1:          #E1DDD4; /* divider neutral — unverified */
--color-trust-t2:          #B8801E; /* amber — verified */
--color-trust-t3-issuance: #B23A2A; /* alert-red — issuance ONLY */
--color-trust-resolved:    #2F6E45; /* safe-green */

/* 3. Reporter-badge palette (NEW dimension) */
--color-reporter-anchor:   #2F6E45; /* safe-green chip */
--color-reporter-hotline:  #3F6E7C; /* deep-teal-tint chip */
--color-reporter-webform:  #1B2026; /* ink chip */
--color-reporter-sensor:   #B8801E; /* amber chip */

/* 4. Status palette */
--color-status-pending:    #F1F1EE; /* subtle bg */
--color-status-verified:   #2F6E45; /* safe-green */
--color-status-failed:     #B23A2A; /* alert-red-reserved — issuance path */
--color-status-warn:       #B8801E; /* form validation errors */

/* 5. Spacing (7-token semantic scale) */
--space-xs:                4px;
--space-sm:                8px;
--space-md:                12px;
--space-lg:                16px;
--space-xl:                24px;
--space-2xl:               32px;
--space-3xl:               48px;

/* 6. Radii (4-token scale) */
--radius-xs:               2px;
--radius-sm:               3px;
--radius-md:               4px;
--radius-lg:               6px;

/* 7. Typography aliases (additive — existing tokens stay) */
--font-family-sans:        'IBM Plex Sans', 'Noto Sans', system-ui, sans-serif;
--font-family-bangla:      'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif;
--font-family-mono:        'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace;
--font-size-1:             0.75rem;
--font-size-2:             0.875rem;
--font-size-3:             1rem;
--font-size-4:             1.125rem;
--font-size-5:             1.375rem;
--font-size-6:             1.75rem;
--font-size-7:             2.25rem;
--line-height-tight:       1.2;
--line-height-body:        1.5;
--line-height-body-bangla: 1.6;
--line-height-heading-bangla: 1.3;
--line-height-loose:       1.7;
```

This block adds the tokens **without removing any existing tokens**. Both systems coexist; consumers can pick either.

## D. Token name deconfliction audit (grep-based)

Per audit §E.4 #38: "Grep the codebase for `emerald-600`, `blue-600`, `indigo-600`, `rose-600` — these should NOT appear on trust-band or anomaly surfaces."

Status:

- **No Tailwind utilities used in repo** (no `tailwind.config.js`, no `@tailwind` directives). The Phase 4 foundation's reference to Tailwind defaults was hypothetical.
- **No `emerald-600` / `blue-600` / `indigo-600` / `rose-600` classes** in the React codebase (verified via grep). Phase 4 never shipped those to the codebase.
- **`theme.css` uses hex codes directly**, not Tailwind classes. Tokens live in `:root` and `[data-theme="light"]` blocks.

Conclusion: the Phase 4 token names never made it into the codebase (foundation stayed at the spec layer). The deconfliction is purely additive — no existing code needs to be modified to avoid Phase 4 token collisions.

## E. Stylelint rule (future)

Audit §E.4 #35: "Add rule that fails any consumer of `surakkha-alert-red` outside the T3+ issuance path."

This is a Phase 4.5 follow-up. The `web/` project doesn't currently use stylelint (verified: no `.stylelintrc`, no `stylelint` in `package.json` dependencies — placeholder for future). Out of scope for Step 4.

## F. i18n key namespace alignment

Audit §E.4 #36: "Rename namespaces to align with lockdown: `citizen.statusTimeline.*` (already aligned), `operator.hotlineIntake.*` (already aligned), `chain.operator.*` and `chain.public.*` (already aligned)."

Verified: the 3 Tier 1 specs already use the lockdown-aligned namespaces. No changes needed.

## G. Build verification (post-Step 4)

| Check | Expected |
|-------|----------|
| `pnpm build` | Succeeds (theme.css syntax-only addition) |
| `pnpm test` | Existing tests pass (no behaviour change) |
| Visual smoke test | Inbox still renders green/grey badges via `--band-*`; nothing changes visually because lockdown tokens are additive |

## H. Migration roadmap (Tier 2 / Phase 4.5+)

| Order | Migration | Owner |
|-------|-----------|-------|
| 1 | Add lockdown tokens to `theme.css` (this Step 4) | Freya |
| 2 | Tier 1 specs (`citizen-status-timeline`, `hotline-intake-modal`, `per-incident-chain-segment`) reference lockdown tokens at the spec level | already done 2026-09-11 |
| 3 | Tier 2 pages (`OperatorDashboard`, `InboxDetail`, `FieldQueuePage`, `FieldIncidentDetailPage`, `AuditLog`) reconcile to lockdown tokens | Step 5 (this plan) |
| 4 | Phase 1.7 / 2.0: progressive `--band-*` → `--color-trust-t*` migration in `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`, `components.css`, `inbox.css` | not Phase 4 |
| 5 | Phase 2: stylelint rule for alert-red reservation | not Phase 4 |

---

_Plan produced by Saga/Freya — 2026-09-11_
_Reference: docs/D-UX-Design/decisions/00-lockdown-audit.md §E.4_
