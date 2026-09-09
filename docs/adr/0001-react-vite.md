# 0001 — React 18 + Vite 5 as the web app foundation

- **Status:** Accepted
- **Date:** 2026-01-15
- **Authors:** Surakkha FE maintainers

## Context

We needed a client-side stack for the Surakkha civic water-safety web app that:

- Could be shipped as a static SPA on cheap CDN hosting at first, with
  room to grow into SSR / RSC if SEO and first-paint ever become concerns.
- Had a fast local feedback loop (sub-second HMR) so the dim 3–8 lockdown
  contract workflow — which is design-driven and iterated on by mockup
  in the browser — stays productive.
- Bundled a small enough payload to load on low-end Android phones and
  spotty rural networks (the citizen persona, Anjali, uses SMS/WhatsApp
  primarily and the web app must not feel heavy).
- Had a deep ecosystem of accessibility primitives and a stable type
  story (TypeScript-first).

## Decision

We adopted **React 18.3 + Vite 5.4** as the foundation:

- **React 18** for its concurrent rendering and stable StrictMode.
- **TypeScript 5** with `strict: true` from day one.
- **Vite 5** for the dev server, build, and Rollup-based production
  output. JSX via `@vitejs/plugin-react` (no Next.js, no Remix).
- **Vitest 3** for unit/integration tests (Vite-native, no Karma/Jest).
- **pnpm 9** for package management (see ADR 0005).
- **ESLint 9** flat config + **Prettier 3** for code quality
  (enforced through Lefthook pre-commit hooks — see B1).

## Consequences

**Easier**
- Sub-second HMR; mockup-style work in `*.html` files is fast.
- One `pnpm dev` serves the React app on port 5173 with HMR.
- Vitest re-uses the Vite config, so test setup is minimal.
- React 18's `useId`, `useTransition`, and `<Suspense>` give us room
  for future async work without a major rewrite.

**Harder**
- We own bundling and runtime concerns Next/Remix would have absorbed.
- No built-in routing, data-loading, or server actions — we adopted
  react-router-dom (ADR 0002) and will revisit TanStack Query (Tier 2)
  for server state.
- Strict React 18 concurrent semantics require care in third-party
  libraries that mutate outside `useEffect`.

## Alternatives Considered

- **Next.js (App Router).** Rejected — we want a static-first SPA for
  now; we can migrate to Next or Remix if SSR/RSC becomes a requirement.
  Keeping the door open is cheaper than committing early.
- **Remix / SolidJS / SvelteKit.** Rejected — the team's existing
  expertise is React; the marginal benefits of a non-React framework
  do not outweigh the hiring/onboarding cost.
- **Create React App.** Rejected — unmaintained; CRA has been the wrong
  choice since 2022.
