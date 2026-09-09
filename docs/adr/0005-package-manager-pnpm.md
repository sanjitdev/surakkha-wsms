# 0005 — pnpm as the package manager

- **Status:** Accepted
- **Date:** 2026-01-15

## Context

Phase 1 was initially scaffolded with npm. We needed a package manager
that:

- Was fast on cold installs (citizen personas on rural networks will
  visit pages with cached deps, but CI runs every PR).
- Used a content-addressable store to avoid duplicating React, Vite,
  and friends across multiple workspaces we anticipate (`web/`, `api/`,
  shared `packages/types`).
- Was drop-in compatible with the npm CLI and registry.
- Had first-class support for peer-dependency strictness (catches the
  "this package secretly depends on React 19" bug class).
- Played well with Vite/Vitest (Vitest's Vite-native config assumed a
  hoisted layout, which pnpm supports via `shamefully-hoist` if needed).

## Decision

We adopted **pnpm 9.12** (pinned via `packageManager` field in
`web/package.json`) in story #112:

- `pnpm install --frozen-lockfile` is the install command in CI
  (`.github/workflows/ci.yml`).
- `pnpm exec <bin>` is the canonical way to invoke dev tools (Prettier,
  ESLint, Lefthook, commitlint) — they live in `node_modules/.bin/`.
- The `prepare` script runs `lefthook install` so contributors get
  pre-commit hooks on `pnpm install`.
- Engines field pins Node >= 18.18.

## Consequences

**Easier**
- Cold install is 2–3× faster than the equivalent npm install on the
  current dependency graph.
- Disk usage is dramatically lower across multiple workspaces
  (content-addressable store).
- Peer-dependency mismatches surface at install time, not in CI.

**Harder**
- Some legacy tooling still assumes npm's flat `node_modules`. We work
  around this by using `pnpm exec` for binaries.
- The hooks (`prepare` → `lefhook install`) need `pnpm` on PATH; CI
  installs via `pnpm/action-setup@v4`.

## Alternatives Considered

- **npm.** Default; we switched off it because of install speed and the
  anticipated workspace structure (we'll add `api/` and `packages/*`).
- **yarn (classic).** Slower than pnpm in our benchmarks and Berry
  introduces a `yarn.lock` format that splits tooling opinions.
- **bun.** Faster still, but immature for Vite/Vitest workflows in
  2026-01. Revisit if it stabilizes.
