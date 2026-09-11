# Phase 4 — UX Design · Closeout

> Status: Complete
> Source: 00-ux-scenarios.md, lockdown audit, lockdown-bound foundation, all 17 specs
> Produced by Saga/Freya — 2026-09-11

---

## 1. Phase 4 final state

**Phase 4 complete.** All 23 screens across 6 scenarios have lockdown-bound specs.

| Tier | Pages | Specs |
|------|-------|-------|
| **Tier 1** (gap screens, no implementation) | 3 | [citizen-status-timeline.md](specs/citizen-status-timeline.md), [hotline-intake-modal.md](specs/hotline-intake-modal.md), [per-incident-chain-segment.md](specs/per-incident-chain-segment.md) |
| **Tier 2** (load-bearing existing pages) | 5 | [operator-dashboard.md](specs/operator-dashboard.md), [inbox-detail.md](specs/inbox-detail.md), [field-queue.md](specs/field-queue.md), [field-incident-detail.md](specs/field-incident-detail.md), [audit-log.md](specs/audit-log.md) |
| **Tier 3** (light infrastructure pages) | 9 | inbox-list, inbox-rail, submit-report-page, citizen-ack-page, login-page, settings-page, styleguide-page, coming-soon-page, verify-flow |

**Total: 17 spec files, 3,428 lines.**

---

## 2. Lockdown binding cascade — final state

| Layer | Status |
|-------|--------|
| **Foundation** (`docs/D-UX-Design/01-design-system-foundation.md`) | Lockdown-bound. Supersedes Phase 4 draft (2026-09-10). |
| **Scenarios** (03 / 04 / 05) | Re-read; reporter-badge introduced as separate dimension from trust band. |
| **Tier 1 specs** | All re-edited; tokens replaced; no Hindi; no confetti; shadcn/ui referenced. |
| **Tier 2 specs** | 114 reconciliation items; 95-step migration plan; 7 MAJOR items flagged. |
| **Tier 3 specs** | 5 MAJOR items flagged (SubmitReportPage dropdown, CitizenAckPage VS15, Settings Reset confirmation, Styleguide 3-band docs). |
| **CSS bridge** (`web/mockups/theme.css`) | Lockdown tokens added additively; existing `--band-*` and `--brand-*` untouched. |
| **Decision documents** | [00-lockdown-audit.md](decisions/00-lockdown-audit.md), [01-token-deconfliction-plan.md](decisions/01-token-deconfliction-plan.md). |

---

## 3. Sign-off items locked 2026-09-11

| # | Item | Resolution |
|---|------|------------|
| 1 | T1 trust-band inversion | Lockdown wins. T1 = divider neutral. Anchors as reporter-badge dimension. |
| 2 | Closure confetti | Lockdown wins. 200ms green pulse only. |
| 3 | Hindi locale | Lockdown wins. English + Bangla only. Bangla-first on Anjali-mobile. |
| 4 | shadcn/ui adoption | Lockdown wins. Existing `web/src/components/ui/` is the project's shadcn layer. |
| 5 | Token collision | Lockdown names keep, hexes replaced. Reporter-badge is separate dimension. |

---

## 4. Implementation handoff

Phase 4 outputs feed Phase 5 (development). The handoff is:

### 4.1 Tier 1 gap screens (NEW builds)

Build 3 new pages against the Tier 1 specs:
- `web/src/pages/CitizenStatusTimeline.tsx`
- `web/src/components/operator/HotlineIntakeModal.tsx` (mounted on `OperatorDashboard`)
- `web/src/pages/IncidentChainSegmentPage.tsx` (linked from `InboxDetail` right rail)

Plus `web/src/lib/chain-verify.ts` — the load-bearing hash recomputation utility.

### 4.2 Tier 2 migration (95-step plan)

Execute the 95-step migration plan across 5 PRs:
- PR 1: Trust band badges → glyph + text pattern (24 OK + 57 MINOR items)
- PR 2: Reporter-badge chip on rows (26 MEDIUM items)
- PR 3: Three-column operator surface alignment (per `inbox-detail.md`)
- PR 4: AuditLog filter chips + chain-read logging
- PR 5: OperatorDashboard hotline modal trigger + chain-freshness indicator

### 4.3 Tier 3 quick fixes (5 MAJOR items)

- SubmitReportPage: replace T1/T2/T3 dropdown with plain-language
- CitizenAckPage: add VS15 + glyph characters + ack-window expiry
- Settings: Reset → ghost variant + confirmation modal
- Styleguide: update 3-band docs to 5-band (T0/T1/T2/T3/resolved) + remove Danger button misuse demo

### 4.4 Follow-up (not Phase 4)

- Progressive `--band-*` → `--color-trust-t1/2/3` migration across `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`, `components.css`, `inbox.css` (multi-PR rollout in Phase 1.7+).
- Stylelint rule for alert-red reservation (Phase 1.7+ tooling work).
- 37 open questions tracked across Tier 2 specs (mostly structural decisions deferred to implementation).

---

## 5. Key cascade shift — trust band + reporter-badge

The structural change that ripples through every spec, scenario, and implementation:

**Before (Phase 4, wrong):** trust band was a single dimension with semantic load — T1=anchor-priority highest, T2=verified, T3=hotline-sourced lowest.

**After (lockdown, binding):** trust band = verification state (T1 unverified / T2 verified / T3 issuance / resolved); reporter-badge = separate source attribute (anchor / hotline / webform / sensor). A reporter can be an anchor at any trust band. Hotline-sourced is **T1 default + hotline reporter-badge**, not T3.

This separation:
- Lets anchor citizens render their badge regardless of whether the incident is verified.
- Lets hotline-sourced incidents render their source badge regardless of band.
- Lets Pia (Phase 2) drill on either dimension independently in Scenario 05's data contract.
- Eliminates the "T3 hotline" semantic confusion from Phase 4 — T3 is now reserved for the consumer-notice issuance path (build-time lint-enforced).

---

## 6. Surprises worth remembering

- The bmad design lockdown system existed before Phase 4. It should have been the starting point, not discovered mid-phase.
- The existing `web/mockups/theme.css` uses different token names (`--band-high/medium/low`, `--brand-*`). Lockdown tokens are additive; migration is progressive.
- No Tailwind utilities in the repo (no `tailwind.config.js`, no `@tailwind` directives). Phase 4's reference to Tailwind defaults was hypothetical.
- No `emerald-600` / `blue-600` / `indigo-600` / `rose-600` classes in the codebase — Phase 4 tokens never shipped. The collision is purely additive.
- The bmad lockdown was authored 2026-09-06 (4 days before Phase 4 foundation was drafted). The lockdown is ratified; "spine wins on conflict."

---

## 7. File map

```
docs/D-UX-Design/
├── 00-phase-4-plan.md                     (this file's predecessor; preserved)
├── 01-design-system-foundation.md         (lockdown-bound; rewritten 2026-09-11)
├── 02-phase-4-closeout.md                 (this file)
├── specs/
│   ├── Tier 1 (3):
│   │   ├── citizen-status-timeline.md
│   │   ├── hotline-intake-modal.md
│   │   └── per-incident-chain-segment.md
│   ├── Tier 2 (5):
│   │   ├── operator-dashboard.md
│   │   ├── inbox-detail.md
│   │   ├── field-queue.md
│   │   ├── field-incident-detail.md
│   │   └── audit-log.md
│   └── Tier 3 (9):
│       ├── inbox-list.md
│       ├── inbox-rail.md
│       ├── submit-report-page.md
│       ├── citizen-ack-page.md
│       ├── login-page.md
│       ├── settings-page.md
│       ├── styleguide-page.md
│       ├── coming-soon-page.md
│       └── verify-flow.md
└── decisions/
    ├── 00-lockdown-audit.md               (587 lines, 29 high-severity conflicts)
    └── 01-token-deconfliction-plan.md     (additive bridge strategy)
```

Plus CSS update at `web/mockups/theme.css` (442 lines; lockdown tokens added additively).

---

## 8. Commit timeline

| Commit | Step |
|--------|------|
| `39cb4a2` | Lockdown audit (read-only review) |
| `66e269a` | Foundation rewrite (lockdown-bound) |
| `0e31153` | 3 Tier 1 spec re-edits |
| `1a295fe` | Scenarios 03/04/05 re-read |
| `a97d931` | Token deconfliction plan + theme.css additive bridge |
| `9c8d6e1` | 5 Tier 2 reconciliation specs |
| `e1aa449` | 9 Tier 3 light reconciliation specs |

---

_Phase 4 complete — 2026-09-11_
_Phase 5 (development) unblocked with implementation handoff in §4_
