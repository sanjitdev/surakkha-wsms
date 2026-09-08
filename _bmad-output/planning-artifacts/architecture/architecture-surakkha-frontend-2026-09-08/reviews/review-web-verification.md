# Review — Web Verification

**Reviewer:** web-verification (finalize_reviewers config)
**Date:** 2026-09-08
**Target:** `architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md`

---

## 1. Stack version currency (web-researched, 2026-09-08)

| Pinned in spine | Installed in `web/package.json` | Latest stable (web, 2026-09-08) | Verdict |
|---|---|---|---|
| React 18.x | `^18.3.1` | React 19.x is GA; 18.3.1 is the last 18.x | **Fit, but trailing** — 18.x still maintained (security), no forced upgrade |
| Vite 5.x | `^5.4.21` | **Vite 8.2.2** (8.0 shipped 2026-03-12 with Rolldown) | **OUT OF DATE** — greenfield; no documented reason to stay on 5.x |
| TypeScript 5.x | `^5.9.3` | TS 6.0 (2026-08-31) and TS 7.0 (2026-07-08) both GA | **OUT OF DATE** — greenfield; no documented reason to stay on 5.x |
| react-router-dom 6.x | not installed | `react-router-dom` was **removed in v8**; v7.18.3 is current, v6.30.6 is the last v6 | **Fit, but deprecation path** — v6 still works; v8 dropped the package entirely |
| MSW 2.x | `^2.15.0` | 2.15.0 is current; no v3 exists | **Current, OK** |
| idb-keyval | `^6.3.0` | 6.3.0 is current (NPM, 2 months old) | **Current, OK** |
| Vitest | not installed | Vitest 5.0 just shipped | **Plan OK** — still the Vite-native runner |
| pnpm | `pnpm@9.12.3` | pnpm 11.x is current (12.x in RC) | **Slightly trailing** — 9.x still maintained; not load-bearing |

**Greenfield concern:** the spine is greenfield (`status: draft`, `created: 2026-09-08`), yet pins React 18 + Vite 5 + TS 5 — three majors behind current stable. The `Notes` column claims "Already in `web/package.json`; not changed", which is true but irrelevant for a *new* architecture spine that other epics will be derived from. Pinning to majors 2–3 behind stable propagates the lag forward into FE-1.1…FE-1.6.

---

## 2. Named library viability

- **MSW v2** — confirmed current stable, no v3 in beta or GA. ✅
- **react-router-dom v6** — still works (v6.30.6 is the last), but v7.18.3 is the active line and v8.3.1 is the current stable as of 2026-08-27. The spine's own Deferred table correctly notes "v6 vs. v7" but the Stack row hard-pins v6 without flagging the 2-major drift. ⚠️
- **Vitest** — confirmed still the Vite-native test runner; v5.0 just shipped. ✅
- **TanStack Query** — dim 5 §17.1 says mock strategy uses "MSW + IndexedDB + TanStack Query", but the FE spine AD-FE-1 explicitly forbids TanStack Query ("premature introduction of TanStack Query / Zustand / Redux"). **CONTRADICTION.** The two docs need reconciliation.

---

## 3. Inherited backend AD references

Grepped `architecture-surakkha-2026-09-06/ARCHITECTURE-SPINE.md`:

- **AD-1 — Event store IS the audit chain** ✅ present (line 101), semantics match.
- **AD-7 — Three UIs as separate products** ✅ present (line 137), semantics match.
- **AD-12 — Closed role enum** — partial match. Backend spine says **"8 entries"** (line 171, also line 95). The FE spine inherits as **"9 entries incl. `field_technician`"**. The dim 7 enum code defines 9 (vendor, pha_approver, utility_operator, utility_message_desk, field_technician, anjali, priya, pha_viewer, system), and dim 7 prose (line 75) still says "8 entries" — prose wasn't fully updated when `field_technician` was added (per task #117). The FE spine inherited the *post-amendment* count correctly, but the backend spine and dim 7 prose are stale. ⚠️

---

## 4. Dim lockdown docs

- `../design/04-spacing-components-lockdown.md` ✅ exists
- `../design/05-grid-pages-stack-lockdown.md` ✅ exists; **dim 5 §17.1 confirmed present** — locks the Phase 1 frontend-only demo strategy with MSW + IndexedDB + (currently) TanStack Query
- `../design/06-data-formats-lockdown.md` ✅ exists
- `../design/07-sensor-wire-format-lockdown.md` ✅ exists; **dim 7 §2.5 confirmed present** — but prose says "8 entries" while code defines 9

All referenced docs and sections exist.

---

## 5. Brownfield reality check (vs. `web/src/` on disk)

Current `web/src/` contents:
- `mocks/{canonical,idb,reset,browser,session,handlers,fixtures}.ts` ✅
- `main.tsx`, `App.tsx` ✅
- `pages/{LoginPage,OperatorDashboard,FieldQueuePage}.tsx` ✅
- `styles/{app,tech}.css` ✅

**Missing from disk (claimed in spine Structural Seed):**
- `components/` directory — **does not exist** ❌
- `hooks/` directory — **does not exist** ❌
- `routes/` directory — does not exist ❌
- `pages/{Dashboard,InboxList,InboxDetail,VerifyFlow,AuditLog,Settings}.tsx` — missing ❌ (spine names `Dashboard.tsx` but disk has `OperatorDashboard.tsx` — naming mismatch)
- `__checks__/` directory — does not exist ❌

This is consistent with the spine being a *seed* for FE-1.1 through FE-1.6 stories. The story plan creates these files. **The mismatch is expected** — but the spine's prose claims "post FE-1.6" without flagging that none of the structure exists yet, which means a reader comparing "what's on disk vs. what the spine says" will see a near-total mismatch. This is fine as long as reviewers understand the spine is *target state*, not current state.

---

## Summary findings

1. **[HIGH] Stack pinned to majors 2–3 behind stable on a greenfield spine** — Vite 5.x (latest 8.2.2), TS 5.x (latest 7.0). Locking these into a new FE architecture means every FE-1 story inherits the lag. *Recommend: autofix Stack row to current majors, or document why Phase 1 deliberately stays on the installed versions.*
2. **[MEDIUM] dim 7 prose says "8 entries" but enum defines 9; backend spine says "8 entries"** — three places to reconcile. The FE spine inherits "9 entries" which is the post-amendment truth. *Recommend: autofix dim 7 §2.5 prose and backend AD-12 rule text to "9 entries"; leave FE spine as-is.*
3. **[MEDIUM] TanStack Query contradiction** — dim 5 §17.1 says mock strategy uses TanStack Query; FE spine AD-FE-1 forbids it. *Recommend: discuss — pick one source of truth.*
4. **[LOW] react-router-dom v6 hard-pinned while v8 is current stable** — v6 still works, v7/v8 are the active lines. The Deferred table already covers this; the Stack row should cross-reference. *Recommend: autofix — note "(see Deferred: v6 vs. v7)" in Stack row Notes.*
5. **[LOW] pnpm 9.x pinned while 11.x is current** — not load-bearing for the architecture; pnpm version doesn't constrain FE design. *Recommend: defer to ops decision.*
