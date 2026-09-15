# VerifyFlow — Tier 3 spec

> **Status:** RECONCILE — confirm flow matches the lockdown-bound inbox-detail Tier 2 spec
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/VerifyFlow.tsx`
> **Source scenario:** [C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md](../../C-UX-Scenarios/01-priya-the-pipeline-pilot-triage-verify-assign.md) (verify + assign single submit)
> **Actors:** Priya (operator, primary)

---

## 1. Existing implementation inventory

`VerifyFlow.tsx` is a 3-step wizard at `/verify-flow` per dim 5 §7.5: `ContainerWidth.Narrow` (720 px), 3 steps (Sensor cluster · Anjali corroboration · Councillor notify), each rendered as a `<Card>` with `--space-xl` gap. Step state lives in the page; advance on primary `<Button>` click, rewind on Back. Each step has a `<Card>` heading, icon (Lucide), bullet list, and action row with Back / Continue / Seal. Rendered inside `<AppLayout>` (sidebar visible; dim 5 §7.5 calls for no sidebar but the AppLayout wrapper owns it — tradeoff documented in file header). Final "Seal" button is a no-op in Phase 1 (real signing ships later; chain is mock).

## 2. Lockdown binding (compact)

- This page is confirmatory only — the Tier 2 spec `inbox-detail.md` is the canonical lockdown-bound source for the verify + assign flow. VerifyFlow.tsx is the standalone wizard route at `/verify-flow` (used in dev demos); both should converge.
- 3-step wizard: each step is a `<Card>` with `--space-xl` vertical gap (foundation §5 spacing).
- Bangla-first per lockdown §11.2 — `useTranslation('verifyFlow')` namespace already aligned.
- Primary button = deep teal (`--color-primary`); secondary = surface + ink + divider border (foundation §7.1).
- Lucide icons per lockdown §3 — current `ClipboardListIcon / InboxIcon / SendIcon / CheckIcon` resolve through `components/icons/sidebar-icons`. Verify these map to lockdown-approved Lucide icons.
- `prefers-reduced-motion` honoured via the global motion tokens (foundation §8.3); no bespoke animation in this page.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Container width | `ContainerWidth.Narrow` (720) | 720 OK for focused reading (dim 5 §7.5) | OK |
| 2 | Step count | 3 (sensor / anjali / councillor) | Matches Scenario 01 verify-and-assign flow | OK |
| 3 | Step state | Local `useState<StepIndex>` | Wizard state is page-local; no global state needed | OK |
| 4 | Primary CTA variant | `variant="primary"` (deep teal) | Lockdown primary = deep teal | OK |
| 5 | Secondary CTA (Back) | `variant="secondary"` | Lockdown secondary = surface + ink + divider | OK |
| 6 | Final step Seal | No-op (Phase 1 mock); `CheckIcon` glyph | Real signing ships later; OK as no-op for now | OK |
| 7 | Sidebar visibility | Inside `<AppLayout>` (sidebar visible) | dim 5 §7.5 calls for "no sidebar"; existing layout route owns it | MINOR — semantic divergence; acceptable per file-header tradeoff. Spec note: full lockdown would require a separate `<WizardLayout>` route without the sidebar. |
| 8 | Lucide icon mapping | `ClipboardListIcon / InboxIcon / SendIcon / CheckIcon` | Lockdown §3-iconography 27 approved icons; verify `ClipboardList` and `Inbox` are on the approved list | MINOR — verify each icon against the 27-icon lockdown. |
| 9 | Step indicator list | `<ol>` with `verify-step / verify-step--active / verify-step--done` | Lockdown §10.3 keyboard nav requires arrow-key support and `aria-current="step"` | MINOR — confirm ArrowUp/Down keyboard nav on the step list. |
| 10 | Bangla strings | `useTranslation('verifyFlow')` keyed | Locale-at-container | OK |
| 11 | i18n key namespace | `verifyFlow.*` | Lockdown `06-data-formats` namespace convention OK | OK |
| 12 | Convergence with InboxDetail Tier 2 spec | This page is standalone at `/verify-flow` | Tier 2 inbox-detail spec owns the verify + assign flow on the InboxDetail page; this page should mirror it | MINOR — cross-reference link both ways; ensure terminology (severity / category / tags / reasoning) matches the Tier 2 spec. |

## 4. Migration plan

1. Add cross-reference link from `inbox-detail.md` (Tier 2) → `verify-flow.md` (Tier 3) noting the standalone wizard mirrors the InboxDetail verify-and-assign flow.
2. Verify each Lucide icon (`ClipboardList`, `Inbox`, `Send`, `Check`) against the 27-icon approved lockdown list in `03-iconography-lockdown.md`. Open amendment tickets for any gap.
3. Add `aria-current="step"` (already present) + keyboard ArrowUp/Down nav on the step indicator `<ol>` if not already wired.
4. Ensure the wizard seals the chain event when "Seal" is clicked; the no-op behaviour is documented in the file header and acceptable for Phase 1.

## 5. Open questions

1. Should the standalone `/verify-flow` wizard be deprecated in favour of the InboxDetail-side verify action, or kept as a dev/demo entry point?
2. Does the final "Seal" step fire `SignatureAttestation` (per inbox-detail Tier 2), or does it just emit a UI-level success state for now? (Phase 1 mock: the latter; Phase 2 backend lands with real signing.)
