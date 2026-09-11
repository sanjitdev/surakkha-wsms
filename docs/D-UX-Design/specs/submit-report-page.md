# SubmitReportPage — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/SubmitReportPage.tsx`
> **Source scenario:** [C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md](../../C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md)
> **Actors:** Anjali (citizen, primary); other roles see role-gate EmptyState

---

## 1. Existing implementation inventory

`SubmitReportPage.tsx` is the citizen report-submission surface at `/submit`. Renders a 5-field form (title, severity T1/T2/T3, ward, description, optional photo + voice URLs in `<details>`). On submit, POSTs `AnjaliReportSubmitted` via `useIncidentActions().submitReport`, then projects `IncidentCreated` with `trust_band` from the chosen severity and `source: web_form` on the chain. Form uses native `useState` (no third-party form library per Phase 1 lockdown). Bangla-first (ContainerWidth.Bangla, Bangla locale default for Anjali per foundation §11.2). Receipt state shows badge + chain-ref + submit-another CTA.

## 2. Lockdown binding (compact)

- Bangla-first locale per foundation §11.2 (Anjali-mobile default).
- Form error colour = `--color-status-warn` (amber), NOT alert-red (foundation §1.3 carve-out, rule 13).
- Severity dropdown values T1/T2/T3 — lockdown semantics: T1 = unverified (lowest), T2 = verified, T3 = issuance path only. **The current dropdown lets Anjali choose T3, but T3 is reserved for the issuance confirmation modal — Anjali should choose severity on a plain-language scale ("how serious?").** Recommend replacing the T-code dropdown with plain-language options.
- Anchor status: per Scenario 03, an anchor citizen whose nid verifies gets a visual confirmation. Currently the form has no anchor-nid field; the chain event carries `reporter_kind: anchor | webform`. **Spec gap:** add anchor verification surface (per lockdown §11.5 reporter-badge attribute; the badge is rendered on the receipt, not on the form).
- Receipt badge: `badge--${severity.toLowerCase()}` — same colour-reservation issue as InboxList (see inbox-list.md).
- `actions.busy` state with `tSubmit('form.submitBusy')` — inline loading label, NOT a spinner (lockdown §8.4 sub-second = no spinner rule).
- Form validation: `titleTrimmed.length >= 5 && descTrimmed.length >= 10` — pass/fail is binary; field-level error rendering absent. **MINOR gap:** show per-field error in `--color-status-warn`.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Locale | Bangla-first (ContainerWidth.Bangla + i18n namespace `submitReport`) | Bangla-first per foundation §11.2 | OK |
| 2 | Severity dropdown labels | `T1/T2/T3` raw codes | Plain language ("not urgent" / "needs attention" / "urgent"); T-codes are operator-only | MAJOR — Anjali should not see T-codes. Replace dropdown with Bangla + English plain-language options. |
| 3 | Severity → trust_band | Form picks T1/T2/T3, posts as `severity` payload; backend maps to trust_band | Trust band = verification state (lockdown §1.1); reporter-picked severity ≠ trust_band. The form-picked severity should map to a **severity hint** on the chain, not the trust_band. | MEDIUM — semantic misalignment. Trust band is computed by the chain from verification signals; the form's severity field is reporter-asserted urgency. |
| 4 | Form error colour | Not rendered (no per-field errors) | `--color-status-warn` (amber) per foundation §13 carve-out | MINOR — add per-field validation rendering on the next pass. |
| 5 | Anchor verification badge | Not rendered | Reporter-badge dimension: anchor citizen gets `--color-reporter-anchor` chip on receipt per lockdown §1.1 | MEDIUM — add anchor chip on receipt when `reporter_kind === 'anchor'` lands on the chain. |
| 6 | Submit button variant | `variant="primary"` (deep teal) | Primary = deep teal per foundation §7.1 | OK |
| 7 | Receipt badge | `badge--${severity.toLowerCase()}` colour-from-CSS | Lockdown: T1 = divider neutral; T2 = amber; T3 = alert-red reserved | MEDIUM — same colour-reservation issue. Map T3 receipt to `--color-amber-bright`. |
| 8 | Photo / voice URL fields | `<input type="url">` raw text fields | Phase 1 is desktop demo only; Phase 2 mobile lockdown ships real photo capture with EXIF | OK — placeholder |
| 9 | Submit success | Synthetic `event_id` generated via `Math.random()` for receipt | Lockdown: chain is the source of truth; UI must read from chain events, not synthetic IDs | MEDIUM — receipt should pull the actual `event_id` from the chain projection after submit, not generate a synthetic one. |
| 10 | `actions.busy` indicator | Inline text ("Sealing…") replacing submit button label | Inline spinner only after 2s (foundation §8.4) | OK for sub-second |

## 4. Migration plan

1. Replace severity dropdown options with plain-language Bangla-first labels: "জরুরি নয় (T1) / মনোযোগ দরকার (T2) / জরুরি (T3)". T-code suffix kept for operator reference but visible to Anjali as informational only.
2. Render anchor-chip on receipt when `reporter_kind === 'anchor'` lands via SSE/chain projection (lockdown §1.1 reporter-badge dimension).
3. Bind per-field error rendering to `--color-status-warn` (foundation §13 carve-out) on `titleTrimmed.length < 5` and `descTrimmed.length < 10`.
4. After submit, the chain projection rebuilds `/api/incidents`; pull the real `event_id` from that projection instead of generating a synthetic one.
5. Swap T3 receipt badge colour from `badge--t3` (alert-red) to `badge--t3-issuance` mapped to `--color-amber-bright` for citizen-readable T3 (lockdown: alert-red is issuance-path-only).

## 5. Open questions

1. Does Anjali's submission form need an explicit anchor-nid field, or is the anchor status inferred server-side from session and surfaced only on receipt? (Scenario 03 implies server-side inference.)
2. Should the photo/voice URL fields ship in Phase 1 or stub them until Phase 2 mobile lockdown (dim 5 §5c)?
