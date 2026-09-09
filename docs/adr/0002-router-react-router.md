# 0002 — react-router-dom v6 for client-side routing

- **Status:** Accepted
- **Date:** 2026-01-15

## Context

The app has five persona landings, a dev-only `/styleguide`, and a
`/login` alias. We needed client-side routing that:

- Supports nested layouts (`<AppLayout>` wraps every authenticated
  route — see `web/src/App.tsx`).
- Lets us gate routes behind a session (`RequireSession` pattern).
- Plays nicely with TypeScript and React 18's StrictMode.
- Is small (~10 kB gz) and stable.

## Decision

We adopted **react-router-dom v6.28**.

- Nested routes via `<Route element={...}>` parent + `<Outlet />` in
  the child — used by `RequireSession` to mount `<AppLayout>` once.
- Hash-free SPA navigation, with `<Navigate>` for redirects.
- Session changes trigger re-renders via the `SESSION_CHANGED_EVENT`
  window event so `RequireSession` re-reads `getSession()` from IndexedDB.

## Consequences

**Easier**
- Nested layouts are first-class (no wrapper-component hacks).
- `<Navigate>` + `<Outlet>` are explicit and greppable.
- Route parameters are typed via `useParams<{ id: string }>()`.

**Harder**
- Data loading is manual (`useEffect` + `useState`) — we will adopt
  TanStack Query (Tier 2 ADR forthcoming) when the API surface is real.
- The "catch-all then route based on role" pattern (used for `<RoleAwareRedirect />`)
  is a small workaround for the lack of per-persona sub-routers.
- v7 is out; we will revisit when its data router stabilizes further.

## Alternatives Considered

- **TanStack Router.** Strong types and built-in data loading, but
  smaller ecosystem and a learning curve we don't need at Phase 1.
- **Next.js (App Router).** Tied to Next — see ADR 0001.
- **Wouter.** Smaller bundle but too minimal for nested layouts.
