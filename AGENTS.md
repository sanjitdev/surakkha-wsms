# AGENTS.md — Surakkha AI Agent Briefing

> **Read this before doing anything in this repo.** It captures the
> Surakkha-specific gotchas, conventions, and the bash-permit trap that
> has wasted tokens across multiple sessions.

---

## 0. The bash-permit trap (READ FIRST — most important section)

This sandbox **silently denies** most `Bash` tool invocations. The deny is
exit-code-2 with **no stdout and no stderr** — there's no error message to
read, no retry that helps. The denial list (observed across sessions) is
**broad and includes simple `ls` / `cd` / `pnpm` calls** that you'd expect
to work on a developer machine.

### What works vs. what gets denied

| Command | Verdict | Notes |
|---|---|---|
| `Bash` with `cd "C:\ZDrive Folders\E2E_Training\Surakkha" && pnpm --filter surakkha-app test` | **DENIED** silently (exit 2) | The exact phrasing of the denial message varies; the shell sandbox rejects it without explanation. |
| `Bash` with `pnpm --filter surakkha-app test 2>&1 | tail -15` (no `cd`) | **APPROVED** when run from a fresh shell | The shell's working dir is already the workspace root. No `cd` needed. |
| `Bash` with `ls` or `cd && ls` | **DENIED** in some sessions, **APPROVED** in others | Inconsistent. Don't waste tokens retrying — use Glob instead. |
| `Bash` with `uv run …` (for the `bmad-build` skill) | **DENIED** | `uv` is not installed on this machine. The bmad-build skill cannot run. Work the workflow manually. |
| `Glob`, `Grep`, `Read`, `Write`, `Edit`, `Agent`, `AskUserQuestion`, `TaskCreate` | **APPROVED** | Use these. |

### The rule

1. **Never run `pnpm` from inside `cd "…" &&`.** Just run `pnpm --filter surakkha-app …` from the default cwd. The cwd is already the workspace root.
2. **Never try `ls` via Bash.** Use `Glob` with a pattern — it returns the same result, never gets denied.
3. **Never try `cat` / `head` / `tail` via Bash.** Use `Read` with optional `offset` + `limit`.
4. **Never try `find` / `grep` / `rg` via Bash.** Use `Grep` and `Glob` — built for this.
5. **Never run the `bmad-build` skill via `/bmad-build`.** The `uv` runtime isn't installed; the skill exits 2 with no output. Run the bmad-build workflow manually (Step-01 → Step-05 below).
6. **If a Bash command is denied, do not retry.** Diagnose from the existing tool output (Grep/Glob/Read) and proceed. The denial is silent, not transient.
7. **If verification gates (test/typecheck/lint/build) are required by the workflow** and the user has approved them, run them one at a time without `cd &&`. The shell may approve each individually.
8. **When dispatching subagents with `Agent`:** tell them in the prompt to use Glob/Read/Grep/Write/Edit instead of Bash where possible, and to use the cwd as-is (no `cd`).

---

## 1. Project snapshot

- **Repo root:** `C:\ZDrive Folders\E2E_Training\Surakkha` (Windows path with spaces — quote it).
- **Surfaces:** frontend SPA at `web/`, mock backend at `web/src/mocks/` (MSW). No real backend in Phase 1.
- **Stack:** React 18 + Vite 5 + TypeScript 5 + react-router-dom 6 + MSW 2 + idb-keyval + Vitest 3 + pnpm.
- **Workspace name:** `surakkha-app`. All commands: `pnpm --filter surakkha-app <script>`.
- **Default branch:** `master`. Remote name: `surakkha-wsms` (NOT `origin` — that remote doesn't exist in this clone).
- **Test count:** 97 cases passing across 10 test files (as of B5d ship, 2026-09-09). Suite grows monotonically — always note the new count in CHANGELOG.
- **Current HEAD:** see `git log --oneline -1` (Bash, if approved) or read `CHANGELOG.md` `[Unreleased]` for the latest shipped spec.

## 2. Architecture invariants (LOCKED — never violate)

These come from `_bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md` and the FE-1 epic context. Violating them fails the architecture review and breaks the lockdown.

### 2.1 4-layer component separation
- **Layer A (dim-4 primitives):** pure presentational. Never call a hook. File: `web/src/components/ui/{Button,Input,Card,Modal,Toast,BandPill,Dropdown,Table,Pagination,DatePicker,DateRangePicker,Calendar,useCalendar}.tsx`.
- **Layer B (page primitives):** compose A, accept plain props. File: `web/src/components/pages/{FilterChip,InboxRow,JobRow,AuditLogRow,Timeline,BandBadge}.tsx` + `web/src/components/pages/charts/*.tsx`.
- **Layer C (hooks):** own all data fetches. File: `web/src/hooks/{useChain,useIncidents,useIncident,useSensors,useEvents,useSessionRole,useTheme,useLocale,useDateFormatter}.ts(x)`. Never import a primitive.
- **Layer D (pages):** thin compositions of B + C. File: `web/src/pages/*.tsx`. ≤200 LoC each.

### 2.2 Hard constraints (any of these fails the lockdown)

| ID | Rule | Penalty |
|---|---|---|
| **AD-FE-4** | Every visual value is `var(--*)`. No raw hex / rgb / px / rem in component code. | Fails design lockdown sweep |
| **AD-FE-5** | Every component file ≤200 LoC (excluding comments + type imports). | Fails size cap |
| **AD-FE-6** | Domain enums (priority, status, band, locale, etc.) declared **once** in `web/src/types/domain.ts` as `as const`. | Fails single-source-of-truth audit |
| **AD-FE-7** | Mobile floor at `@media (max-width: 767px)`. Touch targets ≥48×48 px. Focus rings via `:focus-visible` only. | Fails responsive sweep |
| **AD-FE-8** | All 6 dim-5 page templates match `web/mockups/01-priya/`. | Fails mockup-parity audit |
| **AD-FE-9** | **NO barrel files** (`index.ts`) inside `components/` or `hooks/`. Import paths respect A→B→C→D direction. | Fails layer-boundary audit |
| **Token lockdown** | No new design tokens. Token system locked 2026-09-07. Adding a token requires amending the relevant dim doc (`_bmad-output/design/0X-*-lockdown.md`). | Fails token audit |
| **No third-party deps for primitives** | DatePicker ships zero-dep (native `Date` + `Intl.DateTimeFormat`). Dropdown ships zero-dep (ARIA combobox from scratch). Table ships zero-dep (no `@tanstack/react-table`). | Fails the "primitive must be ~16 KB or less" budget |
| **Test convention** | Every new primitive ships a `web/src/__checks__/fe-{id}-{slug}.test.tsx`. `afterEach(() => { cleanup(); vi.restoreAllMocks(); })`. Locale storage reset in `beforeEach`. | Fails FE-1.3c + FE-1.5b review pattern |

### 2.3 Domain enums (single source of truth)
`web/src/types/domain.ts` is the canonical home for `Locale`, `Theme`, `ContainerWidth`, `IncidentSeverity`, `InboxRowStatus`, etc. Never re-declare these locally. Import from there.

## 3. bmad-build workflow (manual — `uv` is unavailable)

The `/bmad-build` skill fails silently (exit 2, `uv` not installed). Run the same workflow manually:

### Step-01: Clarify
- Read the user's request. If it overlaps an existing spec at `_bmad-output/implementation-artifacts/`, surface that spec.
- If scope is ambiguous, ask via `AskUserQuestion` before drafting a spec. **Never invent features the user didn't ask for.** A prior B5d mistake was listing 3 fictional migrations in the spec; check the actual code via `Grep` first.

### Step-02: Plan
- Write the spec to `_bmad-output/implementation-artifacts/spec-fe-{id}-{slug}.md`.
- Required spec sections (frozen-after-approval format used by all shipped specs):
  1. YAML front-matter: `title`, `type`, `created`, `status: 'in-review'`, `review_loop_iteration`, `baseline_commit`, `context:` (links to upstream docs).
  2. `## Intent` — Problem + Approach.
  3. `## Boundaries & Constraints` — Always / Ask First / Never bullets.
  4. `## I/O & Edge-Case Matrix` — table of scenario rows.
  5. `<frozen-after-approval>` marker line, then:
  6. `## Code Map` — New / Modified / Tests / Reuse / Read-only refs / CHANGELOG.
  7. `## Tasks & Acceptance` — Execution checklist + ACs.
  8. `## Verification` — Commands + Manual checks.
  9. `## Design Notes` — Why-this-and-not-that reasoning.
  10. `## Out of scope (deferred to later specs)` — explicit deferrals.
  11. `## Suggested Review Order` — links to files in implementation order.

### Step-03: Approval gate
- Flip spec `status: 'in-review'` → `'approved'` only after the user approves.
- Use `AskUserQuestion` to present the spec summary and confirm.
- **Never implement before approval.** Even "small" bug fixes get a spec.

### Step-04: Implement
- Dispatch a single `Agent` subagent (subagent_type: `general-purpose`) with:
  - The full spec text inlined in the prompt (do NOT link — subagents don't share context).
  - Explicit Windows-style absolute paths (`C:\ZDrive Folders\E2E_Training\Surakkha\web\src\...`) — Unix paths fail in this clone.
  - The 4 verification commands to run at the end (test/typecheck/lint/build).
  - A "report at the end" instruction with the 4 gate outputs.
- Subagents have full tool access including Bash. The bash-permit rules above apply to them too — restate them in the prompt.

### Step-05: Review + present
- For small bug fixes / refactors (≤10 LoC, ≤5 file changes): skip the formal 3-reviewer loop. Just verify + commit.
- For new primitives / new pages: launch 3 parallel review subagents (`review-adversarial` / `review-edge-case` / `review-verification`) if the user wants that level of rigor. Otherwise trust the implementation subagent + the test suite.
- Mark spec `status: 'done'`. Append a `## Spec Change Log` section if the implementation diverged from the spec at all.
- Stage + commit + push. Commit message format used by all shipped work:
  ```
  {type}({scope}): {spec-id} {one-line summary}

  {2-3 sentence body explaining intent, the bug/feature, the trade-off}

  Co-Authored-By: puku-ai-2.8 <noreply@puku.sh>
  ```
  `{type}` ∈ `feat`, `fix`, `style`, `refactor`, `test`, `docs`. Push to `surakkha-wsms/master` (NOT `origin`).
- Update `CHANGELOG.md` `[Unreleased]` with `### Added` / `### Fixed` / `### Refactor` / `### Tests` / `### Changed` bullets as appropriate. Note test count delta + bundle delta + zero-new-deps claim.

## 4. Verification gates (the 4 commands every spec ends with)

```bash
pnpm --filter surakkha-app test       # expect N passed, 0 failed, exit 0
pnpm --filter surakkha-app typecheck  # expect no new errors (baseline may have 7 pre-existing — see B5c deferred-work.md)
pnpm --filter surakkha-app lint       # expect 0 errors; 74 pre-existing warnings OK (no NEW warnings)
pnpm --filter surakkha-app build      # expect success; bundle delta vs. baseline
```

Run each in its own `Bash` call. Don't chain via `&&` in a single call — the sandbox is more likely to deny chained commands.

## 5. Existing primitives inventory (don't reinvent)

Layer A components that already exist and can be composed:
- `Button` — variants: primary/secondary/ghost/danger; sizes: sm/md.
- `Input`, `SearchInput` — controlled; `testId` decoupled from label.
- `Card` — modifier="with-heading" for the heading-strip pattern.
- `Modal` — focus-trap + restore-on-close.
- `Toast` — `DURATION_MS=4000`, hover-pause, `role="status"`.
- `BandPill` — high/medium/low bands.
- `Container` — widths: narrow(720) / bangla(1080) / wide(1280).
- `EmptyState` — `headingLevel: 2|3|4`.
- `Dropdown` (B5a) — single/multi, searchable, ARIA combobox.
- `Table` + `Pagination` (B5b) — generic, sortable, selectable, resizable.
- `DatePicker` + `DateRangePicker` + `Calendar` (B5c) — ARIA grid, locale-aware, Bangla-first.

Layer B primitives: `KpiCard`, `FilterChip`, `InboxRow`, `JobRow`, `AuditLogRow`, `Timeline`, `BandBadge`.

Layer C hooks: `useChain`, `useIncidents`, `useIncident`, `useSensors`, `useEvents`, `useSessionRole`, `useTheme`, `useLocale`, `useDateFormatter`.

## 6. Things that already shipped — DON'T redo

| ID | What's done | Don't re-do |
|---|---|---|
| FE-1.1 | 10 foundation primitives + styleguide | Don't write new Button/Input/Card/etc. |
| FE-1.2 | react-router-dom wired + 6 persona routes | Don't re-add routing |
| FE-1.3 | Page primitives (KpiCard, FilterChip, JobRow, InboxRow, AuditLogRow, Timeline, BandBadge) + charts | Don't re-roll these |
| FE-1.5 | 4 Priya pages (InboxList, InboxDetail, VerifyFlow, AuditLog, Settings) + AppLayout | Don't re-add pages |
| FE-1.6 | Vitest harness + 19-case foundation test | Don't re-set up vitest |
| FE-B5a | Dropdown primitive + styleguide Section 9 | Don't write new Dropdown |
| FE-B5b | Table primitive + Pagination + styleguide Section 10 | Don't write new Table |
| FE-B5c | DatePicker + DateRangePicker + Calendar + styleguide Section 11 | Don't write new DatePicker |
| FE-B5d | useDateFormatter hook + 8 call sites migrated to locale-aware formatting | Don't re-fix the `en-GB` hardcoding (already grep-verified clean) |

## 7. Known deferred work (from `_bmad-output/implementation-artifacts/deferred-work.md`)

These are tracked follow-ups. Before suggesting one as "next", check the deferred list — it may already be there with a reason:
- B5b: column resize state cleanup, sort comparator edge cases, tri-state select-all, keyboard resize, virtualization, server-side sort.
- B5a: viewport collision auto-flip, aria-controls linkage, click-outside focus restore.
- B5d: B5e (relative-time formatter), B5f (AuditLog opened-between filter), B5g (Settings date filter).
- FE-1.5: inbox.css hex literal sweep, InboxList shape migration to IncidentSummary.
- FE-1.3c: `bigint` hardening on `last_block_height`, error UX in InboxDetail.

## 8. Project conventions (style + naming)

- **Component naming:** PascalCase file + export. Hook naming: `useCamelCase`.
- **Test file naming:** `fe-{spec-id}-{slug}.test.tsx` in `web/src/__checks__/`.
- **Spec file naming:** `spec-fe-{id}-{slug}.md` in `_bmad-output/implementation-artifacts/`.
- **Spec status lifecycle:** `in-review` → `approved` → `done`. `review_loop_iteration: 0` → bumps each review cycle.
- **CHANGELOG format:** Keep a Changelog 1.1; SemVer 2.0. Manual curation (don't auto-generate). `[Unreleased]` is the active slot.
- **i18n:** `web/src/i18n/locales/{en,bn}/common.json`. Both locales must be updated together for any UI copy.
- **TestID convention:** kebab-case. `data-testid="settings-theme-light"`, `data-testid="dr-trigger"`, etc.

## 9. Common mistakes agents make here

| Mistake | Fix |
|---|---|
| Run `cd && pnpm` in one Bash call | Split. Just `pnpm --filter surakkha-app <cmd>` from default cwd. |
| Try `/bmad-build` skill | Doesn't work; `uv` not installed. Run the workflow manually. |
| Invent migrations in a spec that don't exist in code | `Grep` for the literal names FIRST. If zero hits, ask the user. |
| Add a third-party dep ("wouldn't `date-fns` be easier?") | The primitives are zero-dep by lockdown. Don't pull deps. |
| Add a barrel file (`components/ui/index.ts`) | AD-FE-9 violation. Direct imports only. |
| Add a new design token ("we need a `--brand-600`") | Token system is locked. Amend the dim doc first. |
| Skip the spec for a "small" bug fix | Always write a spec. Always get approval. |
| Commit + push before spec is `status: 'done'` | Never. Spec drives the commit. |
| Try `git push origin master` | `origin` doesn't exist. Use `surakkha-wsms`. |
| Disable an ESLint rule (`// eslint-disable-next-line …`) to skip a missing dep | Fix the dep instead. The prior B5d mistake was disabling `exhaustive-deps` to hide a `locale` dep that should have been added. |
| Skip the locale test (only test en) | Locale behavior is the test. bn case is the contract. Always test both. |

## 10. Quick reference: how to read this codebase

- **Architecture spine:** `_bmad-output/planning-artifacts/architecture/architecture-surakkha-frontend-2026-09-08/ARCHITECTURE-SPINE.md` — the locked Layer A/B/C/D contract.
- **Epic context:** `_bmad-output/implementation-artifacts/epic-fe-1-context.md` — story list, requirements, constraints, technical decisions.
- **Foundation contract:** `_bmad-output/implementation-artifacts/spec-fe-1-1-foundation-component-library.md` — what every primitive must do.
- **Deferred work log:** `_bmad-output/implementation-artifacts/deferred-work.md` — every known follow-up with evidence + source spec.
- **Recent shipped specs (best examples to mimic):** `spec-fe-b5a-dropdown.md` (Dropdown), `spec-fe-b5b-table.md` (Table), `spec-fe-b5c-datepicker.md` (DatePicker), `spec-fe-b5d-locale-format-helper.md` (helper extraction). These four are the most recently shipped; their spec format is the current convention.

---

**If you only read one thing: read section 0 (the bash-permit trap).** Everything else is recoverable from the codebase; wasting 10 turns retrying `cd && pnpm` is not.

---

## 11. UI/UX skills — when and how to use them

Two local skills are available for design-quality work. They live at
`~/.claude/skills/{ui-ux-pro-max,impeccable}/SKILL.md`. Load the relevant
one as soon as a UI task surfaces — not after the design is already
shaped.

### 11.1 `ui-ux-pro-max` — design intelligence (load FIRST, on any UI task)

Use for: new pages, new components, component refactors, design reviews,
visual fixes, accessibility audits, responsive layout, typography, color,
icons, charts, motion, design-system decisions.

Skip for: pure backend, API/DB design, non-visual infra, performance-only
work that doesn't touch the interface.

Primary use cases (per the skill's own brief):
- Building or refactoring a page / component / form / table / chart.
- Choosing palette, font system, spacing, layout system.
- Reviewing UI code for UX, a11y, or visual consistency.
- Cross-platform alignment (web / iOS / Android).
- Raising perceived quality, clarity, or usability.
- Pre-ship UI polish.

Rule priorities (must-have checks, in order):
1. **Accessibility** — contrast ≥4.5:1 body / ≥3:1 large, alt text,
   keyboard nav, aria-labels. Never remove focus rings.
2. **Touch & interaction** — targets ≥44×44 px, 8 px+ spacing,
   loading feedback, no hover-only flows.
3. **Performance** — WebP/AVIF, lazy load, reserve space (CLS < 0.1).
4. **Style selection** — match product type, consistency, SVG icons
   (never emoji as icons).
5. **Layout & responsive** — mobile-first breakpoints, no horizontal
   scroll, no fixed-px container widths.
6. **Typography & color** — base 16 px, line-height 1.5, semantic
   color tokens. **Surakkha's lockdown extends this: no raw hex/rgb
   in components; no new tokens without amending the dim doc.**
7. **Animation** — context-aware timing, spatial continuity,
   respect `prefers-reduced-motion`.
8. **Forms & feedback** — visible labels, error near field, helper
   text, progressive disclosure.
9. **Navigation** — clear current location, breadcrumbs where deep.
10. **Data display** — tabular numerals, monospace for refs/digits,
    right-align numerics, empty states.

When to invoke: as soon as the user says "build", "design", "polish",
"redesign", "fix the look", "make this page better", "review this UI",
or any variant. Do not wait for the implementation subagent.

### 11.2 `impeccable` — design craft floor (load on refinement / polish / critique)

Use for: refining an existing surface, polishing before ship, critiquing
a UI, distilling complexity out of a page, hardening i18n/edge cases,
adapting to a new device class, improving typography hierarchy, fixing
spacing rhythm, adapting a design to a stricter visual world.

Skip for: greenfield design (use `ui-ux-pro-max` first), backend work,
non-UI refactors.

Sub-commands (the work the skill actually performs):

| Sub-command | When to invoke |
|---|---|
| `shape <feature>` | New surface / replacement visual world — upfront design plan before code. |
| `audit <target>` | Mechanical quality checks (a11y, perf, responsive). Use on shipped pages. |
| `critique <target>` | UX heuristic review with scoring. Use when "is this good?" is the question. |
| `polish <target>` | Final pre-ship pass. Use once, near the end. |
| `distill <target>` | Strip to essence, remove complexity / AI slop. **Default for "clean this up" requests.** |
| `harden <target>` | Production-ready: errors, i18n, edge cases. Use before feature freeze. |
| `clarify <target>` | UX copy / labels / errors. Use when copy is the blocker. |
| `adapt <target>` | Responsive / device-class adaptation. |
| `layout <target>` | Spacing / rhythm / visual hierarchy fixes. |
| `typeset <target>` | Typography hierarchy / fonts. |
| `colorize <target>` | Strategic color in monochromatic UI. |
| `animate <target>` | Purposeful motion. |
| `delight <target>` | Personality + memorable touches. |
| `bolder` / `quieter` / `overdrive` | Tone shifts. |
| `init` / `document` / `extract` | Product / DESIGN.md / system extraction. |

### 11.3 Combined workflow (recommended)

For a non-trivial UI change (new page, refactor of an existing surface,
"make this better"):

1. **`ui-ux-pro-max`** — load first, BEFORE writing code. Use its rule
   priorities (a11y → touch → perf → style → layout → type → motion
   → forms → nav → data) to set the floor. Pick the visual direction.
2. **`impeccable shape`** — when the surface is new or the visual
   world is changing. Use its discovery interview before any code.
3. **Write / dispatch the implementation** — subagent or in-thread,
   per the bmad-build workflow (§3).
4. **`impeccable distill`** — after the implementation lands, sweep
   for AI slop: empty `useEffect`s, hidden stub DOM, duplicate
   wrapper testids, "X of Y" copy that says nothing, inline SVG
   components that should live in `components/ui/icons/`.
5. **`impeccable polish`** — final pre-ship pass. Inspect at desktop
   and mobile; check the four verification gates per §4.
6. **`ui-ux-pro-max`** — re-check against its 10 priority categories.
   Fix anything below the floor.
7. **`impeccable detect`** — run the mechanical detector:
   `node ~/.claude/skills/impeccable/scripts/detect.mjs --json <paths>`.
   Empty output = clean.

### 11.4 When the user just says "make it better"

Default to **`impeccable distill`** for an existing page, or
**`impeccable shape`** if a brief needs clarification first. If the
user mentions visual hierarchy / typography / spacing / motion
specifically, jump to the matching `impeccable` sub-command or to
`ui-ux-pro-max`.

### 11.5 Loading the skills

Both skills ship as `SKILL.md` files at `~/.claude/skills/<name>/`.
When invoking, read the `SKILL.md` directly via `Read` (not via the
`Skill` tool — the CLI's skill registry does not include these), then
run the skill's own scripts (`node ~/.claude/skills/impeccable/scripts/...`)
for the mechanical work. The `impeccable` skill also expects the
agent to run `node ~/.claude/skills/impeccable/scripts/context.mjs --target <path>`
once per session before acting.

### 11.6 Surakkha-specific overrides

Both skills assume a generic project. Apply these Surakkha locks on top:

- **No new tokens.** If `impeccable polish` suggests a new color or
  spacing value, look it up in `web/src/styles/theme.css` first —
  chances are it already exists under `--*`. If it doesn't, the
  suggestion violates the lockdown (see §2.2 Token lockdown) and
  must be declined.
- **No third-party deps for primitives.** `ui-ux-pro-max` may suggest
  a library; Surakkha's primitives are zero-dep by lockdown. Decline
  the dep, keep the suggestion's intent.
- **≤200 LoC per component file** (AD-FE-5). If `impeccable distill`
  produces a longer component, split it into the layer-A/B/C hierarchy
  in §2.1.
- **Bangla parity.** Any UI copy change must update both
  `web/src/i18n/locales/en/*.json` AND `web/src/i18n/locales/bn/*.json`
  in the same commit. `impeccable harden` covers this; `distill` does
  not — check manually.
- **Testid preservation.** If `impeccable distill` wants to drop a
  testid-bearing wrapper (e.g. a `<span data-testid="…">` around an
  inner component), first check whether the wrapping testid is asserted
  on by any test in `web/src/__checks__/`. If yes, keep the wrapper
  or update the test in the same commit.

### 11.7 Anti-patterns to refuse

Both skills can recommend AI-slop defaults — refuse them explicitly:

| Suggestion | Why refuse |
|---|---|
| Hero metric (big number + small label + stats + accent) | Template; not a craft choice. The Surakkha foundation already defines the dim-5 page templates — match them, don't re-roll. |
| Eyebrow / kicker label above a heading | The foundation's heading carries its own weight; the kicker is decoration. |
| Card-per-feature homepage layout | Cards are the lazy container; never nest cards. |
| Modal for an in-page task | Use inline editing or a dedicated route. |
| `border-left: 4px solid <color>` on a list/callout | Decoration, not hierarchy. Foundation uses hairline borders + tokens. |
| Gradient text / glass / blur as decoration | Reserved for specific effects, never as default emphasis. |
| Hard offset shadow (`4px 4px 0`) outside a committed neobrutalist world | Costume, not depth. |
| Emoji / unicode glyphs as icon system | Surakkha uses inline SVG (Lucide mapping per dim §4.2). |
| `box-shadow: 0 0 24px` colored halo without offset | Zero-offset halo is decoration, not depth. |
| Section numbers (01 / 02 / 03) | Only when the sequence itself carries meaning. |

---

**If you only read one thing: read section 0 (the bash-permit trap).**
Everything else is recoverable from the codebase; wasting 10 turns
retrying `cd && pnpm` is not.
