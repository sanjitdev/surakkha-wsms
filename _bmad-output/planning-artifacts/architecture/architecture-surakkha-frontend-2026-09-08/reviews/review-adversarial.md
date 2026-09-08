# Adversarial Review — surakkha-v1-frontend (Epic FE-1)

**Reviewer role:** Adversarial (bmad-architecture Reviewer Gate)
**Target:** `ARCHITECTURE-SPINE.md` (surakkha-v1-frontend, 2026-09-08)
**Method:** Construct pairs of units (pages, hooks, primitives, CSS) that each obey every AD to the letter yet build incompatibly. Each pair is a hole to close.

---

## Verdict

**Verdict: CONDITIONAL PASS — 8 divergent pairs found, 1 deferred-item risk, 2 missing-dimension gaps.** The 5 ADs + inherited invariants give a clean *layering* contract, but they under-specify **shared data shape**, **shared entity ownership**, **state-mutation choreography**, and **token-class naming**. Without new ADs or tightened clauses, two well-meaning implementers of FE-1.3–1.5 can each pass every AD and ship a frontend that does not compose at runtime.

The most dangerous holes are pairs #1, #2, #3, and #6 — each produces a runtime bug the Vitest `__checks__/*` tests will not catch.

---

## Pair 1 — `incident.priority` string-casing divergence (HIGH)

**Units:** `hooks/useIncidents.ts` + `hooks/useIncident.ts` (Layer C) vs. `components/pages/InboxRow.tsx` + `components/pages/KpiCard.tsx` (Layer B)

**Scenario:** Each hook obeys AD-FE-1 (returns shaped data) and AD-FE-3 (calls `/api/incidents`). The MSW fixture returns the wire-envelope casing from dim 7 — say `'P1'`. `InboxRow` renders priority as a Tailwind-style class: `className={\`row-priority-\${incident.priority.toLowerCase()}\`}` → produces `row-priority-p1`. `KpiCard` on the Dashboard renders the same field with the raw value: `subtitle={\`${count} ${priority} incidents\`}` → produces `"3 P1 incidents"`. `FilterChip` filters on exact equality `incident.priority === activeFilter` where `activeFilter` is hand-typed `'p1'`. **Every file obeys all 5 ADs; the list shows 3 P1s, the filter shows zero matches.**

**Why no AD catches it:** AD-FE-1 names the return shape `{ data, loading, error, refresh? }` but does not pin field-level casing, enum membership, or canonicalization. AD-FE-3 only governs *transport boundary*, not *display layer*.

**Fix:** **Tighten AD-FE-1** with a new clause: "Hooks normalize all enum fields to a single canonical casing before returning (priority ∈ {`'P1'|'P2'|'P3'|'P4'`}; band ∈ {`'green'|'amber'|'red'`}; status ∈ {`'open'|'ack'|'verified'|'closed'`}). The canonical set is locked in dim 7 §4 and listed verbatim in `web/src/types/domain.ts`. A Vitest check at `web/src/__checks__/enum-canonicalization.test.ts` walks every hook's return shape and fails on any value outside the set." OR introduce **new AD-FE-6 — Domain enum canonicalization** with the same content.

---

## Pair 2 — Double ownership of `/api/chain/head` (HIGH)

**Units:** `hooks/useChain.ts` (Layer C) vs. `hooks/useEvents.ts` (Layer C) when used by `pages/AuditLog.tsx`

**Scenario:** `useChain` exists for "chain freshness" (per the seed tree). `AuditLog.tsx` is wired to both `useChain` AND `useEvents` (see the page-to-component diagram, lines 269–270). A second implementer reads AD-FE-1 literally — "every data fetch lives in a shared hook" — and adds the chain-head fetch inline inside `useEvents` so AuditLog only imports one hook. Result: **two hooks independently cache `/api/chain/head` with different polling intervals, different error semantics, and different cache invalidation triggers.** Both obey AD-FE-1 (data lives in a hook) and AD-FE-3 (relative path).

**Why no AD catches it:** AD-FE-1 says "data lives in a hook" but does not say "**each endpoint has exactly one owner hook**." Nothing prevents two hooks from fetching the same URL.

**Fix:** **New AD-FE-7 — Single-owner endpoint rule.** "Each `/api/<resource>[?<query>]` endpoint is owned by exactly one hook. Page imports that hook. Other hooks MAY NOT call the same endpoint even with different query params; if a second shape is needed, the owner hook exposes a second exported function (e.g. `useEvents({ event_type })` and `useEvents.paged({ cursor })`). A Vitest check at `web/src/__checks__/endpoint-ownership.test.ts` greps every `fetch('/api/...')` call and fails if the same URL appears in two hook files."

---

## Pair 3 — Incompatible state-mutation paths for session role (HIGH)

**Units:** `hooks/useSessionRole.ts` (Layer C) vs. `routes/priya.tsx` (Layer D route element)

**Scenario:** AD-FE-2 mandates "defense-in-depth role re-check inside each persona's route element via `useSessionRole()`" (convention row, line 139). `useSessionRole` reads from IDB at mount. Two implementers diverge: (a) `useSessionRole` exposes `setRole(r: Role)` which writes to IDB and dispatches a `storage` event; (b) the route element writes the role by directly mutating `idb-keyval` and then calls `window.location.reload()` to force re-read. Both obey AD-FE-1 (hook is the only writer *or* hook is the only reader) — they just split ownership differently. After role-switch, pages A and B disagree on the active role until reload.

**Why no AD catches it:** No AD governs **who owns the *write* side of session state**. AD-FE-1 only governs read paths. The convention table is silent on mutation choreography.

**Fix:** **New AD-FE-8 — Session-state write surface.** "`useSessionRole` is the only writer of session/role state (IDB key `session:active`). Route elements call `setRole()` on the hook's returned object. Direct `idb-keyval` writes outside `useSessionRole` are forbidden. A Vitest check at `web/src/__checks__/session-writes.test.ts` greps for `idb-keyval.set(` and fails on any caller outside `useSessionRole.ts`."

---

## Pair 4 — `BandPill` vs. `BandBadge` token divergence (MEDIUM)

**Units:** `components/ui/BandPill.tsx` (Layer A) vs. `components/pages/BandBadge.tsx` (Layer B)

**Scenario:** The seed tree lists `BandPill` in Layer A and `BandBadge` in Layer B — two primitives that both render a trust-band indicator (per the `BandBadge` description, "compact trust-band pill"). Both obey AD-FE-4 (every color references `var(--*)`) and AD-FE-2 (B composes A or is prop-driven). Implementer A has `BandPill` consume `--band-green-bg` / `--band-green-fg` while `BandBadge` consumes `--trust-green` / `--trust-fg` (different tokens — but both exist in the locked token system). Result: two semantically-identical components render with visually different green hues, different paddings, different radii. AD-FE-4 is satisfied because every `var()` resolves.

**Why no AD catches it:** AD-FE-4 forbids *new* tokens but does not forbid *which existing token to use for a given concept*. Nothing maps semantic concepts (band, trust, status) to canonical token groups.

**Fix:** **New AD-FE-9 — Semantic-token map.** "A single source-of-truth table at `web/src/styles/token-map.ts` (or `.json`) lists the canonical token group per concept (band → `--band-*`, trust → `--trust-*`, priority → `--priority-*`, status → `--status-*`). Components consume tokens only via this map (`import { bandFg } from '@/styles/token-map'`). Direct `var(--band-*)` references in `.tsx` are forbidden. A Vitest check at `web/src/__checks__/token-map.test.ts` walks every `var(--` occurrence in `.tsx` files and fails if the prefix is not the canonical one for the concept." **DEFERRED-item conflict:** the deferred list mentions "Storybook 8" but not "semantic token map" — yet the map is what would let the dim-1–4 lockdown survive at scale.

---

## Pair 5 — `EmptyState` polymorphism divergence (MEDIUM)

**Units:** `components/layout/EmptyState.tsx` (Layer A) vs. the 8 "patterns" named in dim 5 §8

**Scenario:** The seed tree says `EmptyState` has "8 patterns" (dim 5 §8). The convention table says hooks return empty as `[]`. A implementer of `EmptyState` makes it a **switch on `data.length`** (good). A second implementer — also obeying all ADs — adds an optional `kind?: 'inbox' | 'audit' | 'queue'` prop because dim 5 §8 names patterns, and writes the kind logic *inside* `EmptyState`. A third implementer writes the same kind logic *inside the page primitives*. Three pages that each render the same empty-inbox pattern ship three slightly different `<EmptyState>` calls with different token classes.

**Why no AD catches it:** AD-FE-2 says primitives are prop-driven, which both versions satisfy. AD-FE-5 caps lines but does not forbid multiple props that mean the same thing.

**Fix:** **Tighten AD-FE-2** with a clause: "`EmptyState` (and any other primitive with `kind`/`variant` props) has exactly one discriminant prop whose TypeScript union is a closed enum in `web/src/types/empty-state.ts`. No page primitive may replicate the kind → token-class mapping. If a page needs a new kind, extend the enum and the primitive; do not branch in B." OR introduce **new AD-FE-10 — Discriminant prop locality.**

---

## Pair 6 — Cross-layer import via barrel files (HIGH)

**Units:** `components/ui/index.ts` (potential barrel, Layer A) → consumed by `hooks/useEvents.ts` (Layer C) → consumed by `pages/AuditLog.tsx` (Layer D)

**Scenario:** A well-meaning implementer creates `components/ui/index.ts` re-exporting `Button`, `Input`, `EmptyState`. Then `useEvents.ts` (which AD-FE-2 says "does not import primitives") writes `import { EmptyState } from '../components/ui'` to render a fallback when `error !== null`. EmptyState is Layer A; this import is **forbidden by the flowchart on line 102-105** (`C → A` is in the Forbidden subgraph). But the **Vitest check `component-size.test.ts` does not enforce layer direction**, and `no-hardcoded-values.ts` does not enforce it either. The implementer passes both checks.

**Why no AD catches it:** AD-FE-2 names the rule but does not name a check. There is no `eslint-plugin-boundaries` or `dependency-cruiser` config in the stack table.

**Fix:** **Tighten AD-FE-2** with: "A Vitest check at `web/src/__checks__/layer-boundaries.test.ts` (or an `eslint-plugin-import` config committed in FE-1.6) enforces: no `hooks/**` file may import from `components/**`; no `components/pages/**` file may import from `hooks/**` or `pages/**`; no `components/ui/**` or `components/layout/**` file may import from any other layer. The check runs in `pnpm test` and fails the build on violation." **Add this to the deferred list explicitly** if not added now, with revisit = "FE-1.6 or earlier if any cross-layer leak is found."

---

## Pair 7 — Polling-interval drift on `useSensors` vs. `useEvents` (MEDIUM)

**Units:** `hooks/useSensors.ts` vs. `hooks/useEvents.ts` (both Layer C)

**Scenario:** Both hooks obey AD-FE-1 (each owns its endpoint) and AD-FE-3 (relative fetch). `Dashboard.tsx` mounts both side-by-side. `useSensors` polls every 5 s (sensors are live data per dim 7 §6); `useEvents` polls every 30 s. A second implementer of `useEvents` reads dim 7 §6.2 and sets 5 s "because dashboard activity is also live-ish." Result: dashboard makes 12× the network calls the audit-log page makes for the same `/api/events` endpoint. Same owner hook (Pair #2 fix prevents the *dual-owner* case but not the *same-owner-different-config* case).

**Why no AD catches it:** AD-FE-1 does not name polling cadence. AD-FE-3 does not either. The convention table is silent.

**Fix:** **New AD-FE-11 — Polling cadence table** (or **Tighten AD-FE-1**): "Polling interval per endpoint is fixed and listed in `web/src/hooks/policy.ts`. Hooks read `policy[endpoint]` once at module load. No hook may inline a magic-number interval." Combined with Pair #2's endpoint-ownership check, this closes the dual divergence.

---

## Pair 8 — `data-testid` naming drift (LOW)

**Units:** any two `.tsx` files in B or D

**Scenario:** Convention table says `data-testid="<role>-<name>"` with examples like `button-primary` and `kpi-card`. `KpiCard` uses `data-testid="kpi-card"` (kebab-case). `JobRow` uses `data-testid="jobRow"` (camelCase, "because it's a row not a card"). `AuditLogRow` uses `data-testid="audit-log-row"` (kebab-case with hyphens). Three conventions in three files, all passing the ADs. Tests written against one break against the others.

**Why no AD catches it:** Convention table names a pattern but does not pin the case convention.

**Fix:** **Tighten convention table** with: "`<role>` and `<name>` are always kebab-case (e.g. `button-primary`, `kpi-card`, `audit-log-row`). The role is one of a fixed enum: `button | input | card | row | chip | modal | toast | nav | field`. A Vitest check at `web/src/__checks__/testid-format.test.ts` walks every `data-testid=` occurrence and fails on camelCase or on a role outside the enum."

---

## Deferred-list risks

| Deferred item | Divergence risk if shipped without the AD | Recommendation |
| --- | --- | --- |
| **react-router-dom v6 vs. v7** | Low for Phase 1; no data-router APIs in use. | Keep deferred. |
| **Test discipline (RTL + Playwright)** | MEDIUM — the two Vitest `__checks__/*` tests cover token + size but **not layer boundaries, endpoint ownership, enum canonicalization, polling cadence, or session writes**. Five of the eight pairs above will not be caught. | **Promote a subset to FE-1.6** (or add to FE-1.4) — at minimum: layer-boundaries, endpoint-ownership, enum-canonicalization. Defer RTL/Playwright per current plan. |
| **`React.lazy` code-splitting** | None for Phase 1. | Keep deferred. |
| **i18n library** | None — single `useLocale` toggle, body attribute only. | Keep deferred. |
| **Charting library** | None — hand-rolled SVG per dim 5b. | Keep deferred. |
| **Form library** | None — read-mostly pages. | Keep deferred. |
| **Drag/drop / virtualization / animation libs** | None. | Keep deferred. |
| **Global `ErrorBoundary`** | LOW — current convention (inline error placeholder) is workable. | Keep deferred. |
| **Storybook 8** | None. | Keep deferred. |
| **TS path aliases (`@/components/*`)** | LOW — relative imports are noisy but unambiguous. | Keep deferred. |

**Deferred item most worth promoting:** the test discipline row. The current FE-1.6 check suite is **inadequate to catch 5 of 8 adversarial pairs**. Recommend splitting: ship RTL+checks in FE-1.6 (already planned); add **layer-boundaries + endpoint-ownership + enum-canonicalization + testid-format** to FE-1.4 or FE-1.6 explicitly, with file paths named in the spine.

---

## Dimensions not owned — gaps found

| Dimension | Owned at (spine says) | Gap | Recommendation |
| --- | --- | --- | --- |
| Backend service shape | backend spine | OK | — |
| Mobile surfaces | dim 5c/5d/5e | OK | — |
| Wire envelope additions | dim 7 | OK for Phase 1 | — |
| Token additions | dim 1–4 + AD-FE-4 | **GAP**: no map from semantic concept → token group. See Pair #4. | **Add semantic-token-map to the spine OR defer to dim 1-4 amendment.** |
| Deployment / hosting | not yet owned | OK for Phase 1 (local-dev only) | — |
| Telemetry | backend AD-10 | OK | — |
| **MISSING: hook polling cadence** | not owned | See Pair #7. | **Own here** — add to spine or new AD. |
| **MISSING: endpoint → owner-hook registry** | not owned | See Pair #2. | **Own here** — new AD-FE-7. |
| **MISSING: enum canonical set** | not owned | See Pair #1. | **Own here** — new AD-FE-6. |
| **MISSING: cross-layer import lint config** | not owned (AD-FE-2 names the rule but no check) | See Pair #6. | **Own here** — add check + config to FE-1.6. |
| **MISSING: session-state write surface** | not owned | See Pair #3. | **Own here** — new AD-FE-8. |

---

## Proposed new ADs / tightened clauses — summary

| ID | Action | Target | Closes pair |
| --- | --- | --- | --- |
| **AD-FE-6 (NEW)** | Domain enum canonicalization | `web/src/types/domain.ts` + Vitest check | #1 |
| **AD-FE-7 (NEW)** | Single-owner endpoint rule | Endpoint registry + Vitest check | #2 |
| **AD-FE-8 (NEW)** | Session-state write surface | `useSessionRole` only-writer + Vitest check | #3 |
| **AD-FE-9 (NEW)** | Semantic-token map | `web/src/styles/token-map.ts` + Vitest check | #4 |
| **AD-FE-10 (NEW)** | Discriminant prop locality | Tighten AD-FE-2 with closed-enum rule | #5 |
| **Tighten AD-FE-2** | Add layer-boundary Vitest check | `web/src/__checks__/layer-boundaries.test.ts` | #6 |
| **AD-FE-11 (NEW)** | Polling cadence policy | `web/src/hooks/policy.ts` + Vitest check | #7 |
| **Tighten convention table** | Kebab-case + role enum for `data-testid` | Vitest check | #8 |

**Total:** 6 new ADs (or 4 new + 2 tightened) to close 8 adversarial pairs.

---

## Reader's quick check

Ask the implementer of FE-1.5 (the 8 templates) and FE-1.3 (page primitives) to each describe, without consulting each other, how `incident.priority` is rendered and how `/api/chain/head` is fetched. If their answers diverge on casing or owner, **the spine has not earned its "draft → final" promotion**. Apply the eight fixes above first.