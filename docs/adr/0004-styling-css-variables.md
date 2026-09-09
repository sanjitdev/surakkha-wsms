# 0004 — CSS variables + scoped stylesheets (no Tailwind / CSS-in-JS)

- **Status:** Accepted
- **Date:** 2026-01-15

## Context

The dim 1–8 lockdown contracts establish a fixed design language:

- A palette of color tokens (`--brand-500`, `--success`, `--danger`, …).
- A type scale (`--font-size-sm`, `--line-height-body`, …).
- A spacing scale (`--space-xs` … `--space-2xl`).
- A set of component primitives (Button, Modal, Toast, Card, …) whose
  visuals must be **identical** across the static mockups (HTML) and
  the React app.

We needed a styling approach that:

- Lets static HTML mockups and React components share the same tokens.
- Allows runtime theme switching (light/dark) without rebuilding the app.
- Produces small CSS bundles (the citizen persona uses low-end Android).
- Has zero runtime cost (CSS-in-JS would violate this).
- Is greppable — designers and engineers work in the same files.

## Decision

We use **plain CSS with CSS custom properties** for tokens and
component classes:

- Tokens: `web/mockups/theme.css` (and per-mockup overrides). Variables
  are consumed by `web/src/styles/components.css` and the page-level
  stylesheets.
- Component classes: BEM-lite (`toast`, `toast--success`,
  `toast__message`, …) — no preprocessor needed.
- Per-page styles live in `web/src/styles/<page>.css` (e.g. `dashboard.css`,
  `inbox.css`, `tech.css`) and are imported by the page component.
- React components carry **no `style=` props** except for the rare
  truly-dynamic value (e.g. toast progress bar width). This keeps
  styling reviewable in CSS, not in TSX.

## Consequences

**Easier**
- Static mockups under `web/mockups/*.html` import the same `theme.css`
  and render identically to the React app — we have one source of truth.
- Theme/locale switches are a single `document.documentElement.dataset.theme = ...`
  call; no rebuild required.
- Designers can read `components.css` directly without learning JSX.

**Harder**
- No static analysis for unused classes (we accept this; PurgeCSS is a
  Tier 4 follow-up if bundle size becomes a problem).
- Naming collisions are possible; we mitigate with the `.namespace__part`
  BEM convention.
- No JS-side type-safety for class names. We accept this trade for the
  performance and shared-mockup benefits.

## Alternatives Considered

- **Tailwind CSS.** Would speed up component prototyping, but breaks
  the "mockups and React share the same CSS" property because utility
  classes would still need a build step. Also bloats HTML/JSX with
  class strings.
- **CSS Modules.** Per-file scoping is nice but prevents the mockup-to-React
  sharing we rely on.
- **styled-components / Emotion.** Runtime cost is too high for our
  target devices, and it locks styling out of static HTML mockups.
- **Vanilla-extract.** Type-safe zero-runtime CSS — promising, but adds
  a toolchain we don't need yet. Revisit in a year if we hire more
  engineers.
