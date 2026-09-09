# Architecture Decision Records

This directory captures the **why** behind the major tech decisions in
Surakkha. Each ADR is short (one page), timestamped, and immutable once
accepted. Superseding decisions get a new ADR that links back to its
predecessor.

## Format

We follow the lightweight [MADR](https://adr.madr.tools/) shape:

- **Context** — what's the situation, what forces are at play.
- **Decision** — what we chose and what we committed to.
- **Consequences** — what becomes easier, what becomes harder.
- **Alternatives Considered** — what we rejected, and the one-line reason.

## Index

| #   | Title                                                | Status   |
| --- | ---------------------------------------------------- | -------- |
| 001 | [React 18 + Vite 5 as the web app foundation](./0001-react-vite.md) | Accepted |
| 002 | [react-router-dom v6 for client-side routing](./0002-router-react-router.md) | Accepted |
| 003 | [React Context (no Redux/Zustand) for app state](./0003-state-react-context.md) | Accepted |
| 004 | [CSS variables + scoped stylesheets (no Tailwind/CSS-in-JS)](./0004-styling-css-variables.md) | Accepted |
| 005 | [pnpm as the package manager](./0005-package-manager-pnpm.md) | Accepted |
| 006 | [Testing strategy (Vitest + Playwright + MSW)](./0006-testing-strategy.md) | Accepted |

## How to add a new ADR

1. Copy the most recent `NNNN-*.md` to `NNNN+1-your-title.md`.
2. Fill in Context / Decision / Consequences / Alternatives.
3. Open a PR titled `chore(adr): add 0006-…`. Reviewers sign off on the
   decision; merge once accepted.
4. Update the index table above in the same commit.
