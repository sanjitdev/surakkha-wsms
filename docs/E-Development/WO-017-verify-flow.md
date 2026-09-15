# WO-017 — Verify Flow

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.3 — Tier 3 (light).
> Date: 2026-09-15

## Objective

Reconcile `web/src/pages/VerifyFlow.tsx` (219 LOC) — operator's standalone verification flow (used outside the inbox context).

## Scope

**In:**
- Standalone verification surface (different from `InboxDetail` per WO-005)
- Reuses `web/src/lib/chain-verify.ts` (no copy-paste)
- Single-click verify (per lockdown §12)
- Pass/fail badge result + 3s auto-dismiss toast + durable row metadata
- Bangla toggle
- Tab order matches visual order

**Out:** Filter chips (live on `/audit-log` per WO-008)

## Acceptance criteria

1. Renders at `/verify-flow` for `utility_operator`
2. Single-click verify calls `verifyBlock()` via chain-verify.ts
3. Pass/fail badge with `--color-safe-green` (pass) or `--color-alert-red-reserved` (fail)
4. 3s auto-dismiss toast; durable badge in row metadata
5. Bangla toggle works
6. No Hindi strings

## Wire contract

- Verify: `POST /api/chain/verify` via helper

## i18n keys

Add to `verifyFlow.json` (en + bn): verify button label, pass/fail toasts.

## Tests + lockdown compliance

- Vitest: `fe-verify-flow-reconcile.test.tsx`
- Lockdown: uses helper (not copy-paste), single-click, lockdown tokens

---

_Ready for Stage 6._
