# CitizenAckPage — Tier 3 spec

> **Status:** RECONCILE — existing implementation, lockdown-bound
> **Priority tier:** 3 (light)
> **Source file:** `web/src/pages/CitizenAckPage.tsx`
> **Source scenario:** [C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md](../../C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md) (5-min dual-channel ack surface)
> **Actors:** Anjali (citizen, primary); other roles see role-gate EmptyState

---

## 1. Existing implementation inventory

`CitizenAckPage.tsx` is the citizen acknowledgement surface at `/ack/:incident_id`. Pulls the most recent `CitizenAckRequested` event from the chain to display the operator's notice (channel + summary). Renders two stacked Cards: notice (with blockquote-style quote) + decision (Approve/Dispute buttons). On submit, fires `citizenAcknowledge` which lands as `CitizenAckReceived` or `CitizenAckDisputed` on the chain. Receipt state shows a T1 badge (approve) or T3 badge (dispute). Bangla-first via `ContainerWidth.Bangla` and i18n namespace `citizenAck`.

## 2. Lockdown binding (compact)

- Bangla-first per foundation §11.2.
- Decision is dual-channel: in-app + SMS/WhatsApp/voice fallback. Channel is taken from `CitizenAckRequested.payload.channel`; defaults to `in_app` if not present.
- Closure celebration: 200ms green pulse only on approve (lockdown §8.1, audit §D.2) — no confetti.
- Form-success badge: approve → T1 neutral; dispute → T3 alert-red-reserved. **Dispute IS the issuance path: a citizen-disputed incident escalates to T3+ and triggers consumer-notice issuance.** Alert-red usage is correct here.
- "Citizen-ack silence is data" (foundation rule 11): the page must show a calm fallback when the ack window expires. Currently, expiry is not rendered — the form simply shows the last `CitizenAckRequested` event.
- VS15 text-style glyph: `✓` MUST carry U+FE0E on this citizen surface (lockdown §2.7 / §11.3) — currently the page renders emoji-like Unicode without explicit VS15.
- Glyph + text redundancy: trust-band badges on the receipt show `badge--t1` or `badge--t3`; both should pair with glyph (`◔` for T1, `●` for T3) and text per foundation §4.1.

## 3. Reconciliation diff

| # | Item | Existing | Lockdown | Status |
|---|------|----------|----------|--------|
| 1 | Locale | Bangla-first (ContainerWidth.Bangla) | Bangla-first per foundation §11.2 | OK |
| 2 | Dispute badge colour | `badge--t3` (alert-red) | T3 dispute IS the issuance path → alert-red OK | OK |
| 3 | Approve badge colour | `badge--t1` (legacy `--info` sky-blue or divider neutral) | T1 = divider neutral per lockdown §1.1; sky-blue is the inverted-semantics flag from audit §B.1 | MEDIUM — bind `badge--t1` to `--color-trust-t1` (divider neutral). |
| 4 | Closure celebration | Implicit (no animation visible in code) | 200ms green pulse on approve (lockdown §8.1) | MINOR — add green pulse on approve success state. No confetti. |
| 5 | Ack window expiry | Not rendered | Calm "we marked this closed; reopen within 30 days" message (foundation rule 11) | MEDIUM — add expired state with the lockdown-mandated copy. |
| 6 | Channel fallback | `method = channelRaw ?? 'in_app'` | Dual-channel surface (SMS / WhatsApp / voice / in_app) per lockdown §consumer-messaging | OK |
| 7 | VS15 glyph | `✓` rendered as Unicode plain | `✓\uFE0E` mandatory on consumer surfaces (lockdown §2.7) | MAJOR — add VS15 to all `✓` and `⚠` literals. |
| 8 | Glyph + text redundancy | Badge text only ("T1"/"T3"), no glyph | Glyph + text per foundation §4.1 (T1=`◔`, T3=`●`) | MAJOR — add glyph characters next to text labels. |
| 9 | Mono font for chain-ref | `.mono` class — resolves to legacy system mono | IBM Plex Mono (foundation §2.1, lockdown §typography-amendment) | MINOR — bind `.mono` to `--font-family-mono` (IBM Plex Mono). |
| 10 | Notice blockquote border | `borderLeft: '3px solid var(--brand-500)'` | `--color-primary` (deep teal) or `--color-divider` | OK — semantic match |

## 4. Migration plan

1. Bind `badge--t1` to `--color-trust-t1` (divider neutral `#E1DDD4`); keep `badge--t3` as alert-red-reserved since dispute IS the issuance path.
2. Add `◔` glyph next to "T1" and `●` glyph next to "T3" in the receipt badge (foundation §4.1).
3. Add VS15 to `✓` and `⚠` on the page — string literals become `\u2713\uFE0E` and `\u26A0\uFE0E` per lockdown §2.7.
4. Add ack-window-expiry state: when `incident.ack_window_expires_at < now()`, show calm "closed" message with reopen CTA (foundation rule 11).
5. Bind `.mono` class to `--font-family-mono` (IBM Plex Mono) on the receipt's chain-ref and timestamp.
6. Add 200ms green pulse on approve success (no confetti; lockdown §8.1).

## 5. Open questions

1. Is the ack window expiry state a Phase 1 surface, or does it land with the 5-min dual-channel timer feature in Phase 2?
2. Does Anjali-mobile Phase 2 mobile lockdown replace this desktop form, or does the desktop form persist as the in-app fallback?
