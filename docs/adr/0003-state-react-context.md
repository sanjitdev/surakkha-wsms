# 0003 — React Context (no Redux/Zustand) for app state

- **Status:** Accepted
- **Date:** 2026-01-15

## Context

The Phase 1 app has three categories of state:

1. **Session** — who is logged in, their persona role.
2. **AppLayout chrome** — sidebar collapse, current nav highlight,
   theme + locale dataset attributes.
3. **Server cache** — events, inbox rows, audit chain (currently served
   by MSW handlers; in Phase 2 by the real API).

We needed a primitive that was:

- Native to React (no extra dep).
- Easy to test (just render with a wrapper provider).
- Easy to reason about for a small team.
- Cheap enough to refactor later if state grows.

## Decision

We use **React Context + `useState`/`useReducer`** for state categories
1 and 2, scoped narrowly:

- `AppLayoutContext` exposes `{ session, logout }` to anything inside
  `<AppLayout>`.
- `useTheme()` and `useLocale()` own their own dataset attributes on
  `<html>` via `useEffect`; both are mounted in `AppShell`.

For server state (category 3), we **defer** to TanStack Query (Tier 2).
Mock data flows through MSW handlers today and is consumed by `useEffect`
+ local state; once the real API lands, the same components will swap to
`useQuery` without a router-level change.

## Consequences

**Easier**
- Zero state-management dependency to install, learn, or audit.
- Provider tree mirrors the React tree — easy to test by wrapping.
- No action/reducer boilerplate for the small surface we have.

**Harder**
- Re-renders are coarse: every context consumer re-renders whenever any
  field in the provider's value changes. We mitigate with `useMemo`
  (see `AppLayoutContext`).
- Cross-cutting server cache (events, inbox) will eventually want
  TanStack Query for refetch/dedup/invalidation; we accept that we'll
  migrate ~10 hooks when Tier 2 lands.

## Alternatives Considered

- **Redux Toolkit.** Overkill for the current surface; ceremony-heavy.
- **Zustand.** Reasonable for global state but Context covers the
  same ground at this size with zero deps.
- **Jotai.** Atom-based — interesting but introduces a mental model the
  team would need to learn for marginal benefit.
- **TanStack Query for everything.** Misuse — it's a server-cache
  library, not an app-state library.
