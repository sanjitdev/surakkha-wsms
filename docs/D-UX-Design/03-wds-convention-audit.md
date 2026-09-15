# Phase 4 — WDS Convention Audit & Remaining Work

> Audit date: 2026-09-15
> Source: Whiteport Design Studio v1.0.0 (`~/.claude/wds/`, released 2026-04-26)
> Repo state: 1 commit ahead of origin/main; branch `main`

---

## 1. WDS conventions — source of truth

The conventions below are taken verbatim from the installed WDS v1.0.0 skill files.
Every deviation found in `docs/` is listed in §3.

### 1.1 Phase folder layout (`wds-glossary.md`)

```
{output_folder}/
├── A-Product-Brief/       Phase 1 — strategic foundation
├── B-Trigger-Map/         Phase 2 — user research & personas
├── C-UX-Scenarios/        Phase 3 — journey flows
├── D-UX-Design/           Phase 4 — page specifications & design assets
└── E-Development/         Phase 5 — technical requirements, work orders, code
```

Plus a machine-local `progress/` and `_progress/` directory for session state.

### 1.2 Page Spec location (`agents/spec-writer.md`)

> **Output:** `{output_folder}/D-UX-Design/[page-slug].md`

Page specs live **flat in `D-UX-Design/`**, not in a `specs/` subfolder.

### 1.3 Wireframes (`agents/wireframe.md`)

> Excalidraw wireframe saved to `{output_folder}/D-UX-Design/wireframes/[page-slug].excalidraw`
> PNG export at `{output_folder}/D-UX-Design/wireframes/[page-slug].png`

Wireframes are `.excalidraw` + `.png` pairs — not markdown files. The folder name (`wireframes/`, plural, lowercase) is correct.

### 1.4 Design tokens (`references/design-system.md`)

> Tokens = the DNA. Colors, typography, spacing, effects. Defined once, reused everywhere.

Tokens can live as a single foundation doc, or as a progressive registry. WDS does not require a `tokens/` subfolder — it is a convention the project chose.

### 1.5 Scenario file naming (`SKILL.md` — Freya, Saga)

> **Deliverable:** `{output_folder}/C-UX-Scenarios/` — one file per scenario + `00-ux-scenarios.md` index

Each scenario file: `NN-archetypal-slug.md` (zero-padded, lowercase, hyphenated).

### 1.6 Persona file naming (`SKILL.md` — Saga, `wds-glossary.md`)

> `NN-persona-[firstname]-the-[archetype].md` — Alliterative names required (e.g. Harriet the Hairdresser).

### 1.7 Component / file naming (`design-system/naming-conventions.md`)

- Lowercase, hyphenated.
- Component files: `button.md`, `navigation-button.md`.
- Folder names: `components/`, `design-tokens/`, `operations/`, `assessment/`, `templates/`.
- Plural for collections.

### 1.8 Decisions / change order

`wds-glossary.md` defines `E-Development/NNN-NN-[slug].xml` for change orders but does not name a `decisions/` folder inside D-UX-Design. The project's `decisions/` folder is project-specific (lockdown audit + token deconfliction plan) and is not a WDS-mandated location.

---

## 2. Repo as-is — `docs/` layout

```
docs/
├── idea.md
├── adr/
├── A-Product-Brief/                 ✓ matches WDS Phase 1
├── B-Trigger-Map/                   ✓ matches WDS Phase 2
├── C-UX-Scenarios/                  ✓ matches WDS Phase 3
└── D-UX-Design/
    ├── 00-phase-4-plan.md           ⚠ WDS has no such file; project-specific
    ├── 01-design-system-foundation.md  ⚠ WDS expects no leading number on foundation; project-specific
    ├── 02-phase-4-closeout.md       ⚠ WDS has no such file; project-specific
    ├── decisions/                   ⚠ not WDS-mandated; project-specific (lockdown artifacts)
    ├── specs/                       ❌ WDS expects specs FLAT in D-UX-Design/, not nested
    ├── tokens/                      ⚠ project-specific navigation mirror (acceptable)
    └── wireframes/                  ⚠ exists, but contains .md mirrors, not .excalidraw + .png
```

No `E-Development/` folder exists. Phase 5 will need to be created when WOs are written.

---

## 3. Convention deviations — file-by-file

| # | Current path | Expected (WDS) | Severity | Notes |
|---|---|---|---|---|
| 1 | `docs/D-UX-Design/specs/*.md` (17 files) | `docs/D-UX-Design/*.md` (flat) | **MAJOR** | WDS spec-writer output is flat. The `specs/` subfolder is non-standard. |
| 2 | `docs/D-UX-Design/specs/` folder itself | (removed) | **MAJOR** | Once specs are flattened, the folder should be deleted. |
| 3 | `docs/D-UX-Design/wireframes/*.md` (17 files) | `docs/D-UX-Design/wireframes/[page-slug].excalidraw` + `.png` | **MAJOR** | Wireframes must be Excalidraw + PNG, not MD mirrors. |
| 4 | `docs/D-UX-Design/wireframes/*.md` mirrors | (delete or move to `specs/`) | **MAJOR** | These are MD mirrors of the spec; they don't belong in `wireframes/`. |
| 5 | `docs/D-UX-Design/decisions/` | not WDS-mandated | MINOR | Project-specific lockdown artifacts. Keep, but document as project-specific. |
| 6 | `docs/D-UX-Design/tokens/*.md` (8 files) | not WDS-mandated | MINOR | Navigation mirror of foundation doc. Acceptable but project-specific. |
| 7 | `docs/D-UX-Design/00-phase-4-plan.md`, `01-…`, `02-…` | not WDS-mandated | MINOR | These are project governance files, not WDS artifacts. Acceptable but document. |
| 8 | No `docs/E-Development/` | required for Phase 5 | **MAJOR** | Must be created before Work Orders can be written. |
| 9 | `docs/adr/` (lowercase) | not WDS-mandated | OK | ADR-style decisions; project-specific. |
| 10 | `docs/idea.md` | not WDS-mandated | OK | Pre-Phase-1 spark note. |

---

## 4. What is left to do before Phase 5 (development)

### 4.1 Convention clean-up (mechanical, low-risk)

| Step | Action | Effort |
|---|---|---|
| A | Move `docs/D-UX-Design/specs/*.md` → `docs/D-UX-Design/*.md` (17 files, flat) | 15 min |
| B | Delete `docs/D-UX-Design/specs/` folder | 1 min |
| C | Decide what to do with `wireframes/*.md` mirrors: delete or convert to Excalidraw + PNG | 1–4 h |
| D | Update `02-phase-4-closeout.md` §7 file map to reflect flattened structure | 5 min |
| E | Update `00-phase-4-plan.md` §5 folder diagram to reflect flattened structure | 5 min |
| F | Update `01-design-system-foundation.md` header note that mirrors point to flat specs | 5 min |
| G | Update `tokens/README.md` to point at flat specs (not `specs/`) | 5 min |
| H | Decide on `decisions/` folder disposition: keep (project-specific) or rename to `_lockdown/` | 5 min decision |
| I | Update all cross-references in `02-phase-4-closeout.md` (`specs/x.md` → `x.md`) | 5 min |

### 4.2 WDS-mandated work (still pending)

| Step | Action | Effort |
|---|---|---|
| J | Create `docs/E-Development/` (Phase 5 home) | 1 min |
| K | Run `/saga` `prd` workflow to write `E-Development/000-PRD.md` (master PRD) | 1–2 h |
| L | Run `/freya` `work-order` workflow for each Tier 1 spec (3 WOs) | 1 h |
| M | Run `/freya` `work-order` workflow for each Tier 2 spec (5 WOs) | 2 h |
| N | Run `/freya` `work-order` workflow for each Tier 3 spec (9 WOs) | 3 h |
| O | `/sync` to refresh WDS to latest before each invocation | 1 min each |
| P | After WO → Mimir writes `E-Development/NNN-[feature].xml` per WO (17 feature PRDs) | per WO |

### 4.3 Pre-development prerequisites still missing

| Item | Owner | Status |
|---|---|---|
| Brownfield tech audit (`E-Development/000-tech-audit.md`) | Mimir | **NOT STARTED** — required before any PRD on existing codebase |
| Master PRD (`E-Development/000-PRD.md`) | Saga | **NOT STARTED** — required before feature PRDs |
| 17 Work Orders (`E-Development/WO-001-…` through `WO-017-…`) | Freya | **NOT STARTED** — page specs are specced & approved, but WOs not written |
| 17 feature PRDs (`E-Development/001-…` through `017-…`) | Mimir | **NOT STARTED** — depends on WOs |
| `_progress/00-design-log.md` | Freya | **NOT STARTED** — required by WDS init step |
| `progress/saga.md`, `progress/freya.md`, `progress/mimir.md` | agents | **NOT STARTED** — required for `/start` and `/wrap` |

### 4.4 Per-spec open items (from `02-phase-4-closeout.md`)

- 37 open questions across Tier 2 specs (mostly structural decisions deferred to implementation).
- 5 MAJOR items in Tier 3 (SubmitReportPage dropdown, CitizenAckPage VS15, Settings reset, Styleguide 3-band docs).
- Progressive `--band-*` → `--color-trust-t1/2/3` migration (Phase 1.7+).
- Stylelint rule for alert-red reservation (Phase 1.7+ tooling).

---

## 5. Recommended action plan

**Phase 5 readiness = convention cleanup (1h) + brownfield audit (2-3h) + WO writing (6h).**

### Sequence

1. **Now (1 h):** convention cleanup steps A–I. Mechanical, zero risk, unblocks everything else.
2. **Next session:** `/saga` `prd` workflow → writes master PRD against current specs.
3. **Then:** `/mimir` `tech-audit` workflow → writes `000-tech-audit.md` against `web/` codebase.
4. **Then:** `/freya` `work-order` workflow → writes 17 WOs in tier order (Tier 1 → Tier 2 → Tier 3).
5. **Then:** `/mimir` writes 17 feature PRDs against the WOs.
6. **Then:** Wake `/mimir` `build` workflow to start implementation.

### Time budget

| Activity | Hours |
|---|---|
| Convention cleanup (steps A–I) | 1 |
| Master PRD + tech audit | 3 |
| 17 Work Orders | 6 |
| 17 feature PRDs | 4 |
| **Total Phase 5 prep** | **14 h ≈ 2 working days** |

---

## 6. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Flattening specs/ breaks inbound links | Medium | grep all `specs/` references in `docs/` before deleting |
| Mirror files in wireframes/ confuse Mimir | Medium | Rename to `_spec-mirrors/` or delete in step C |
| Renames during Phase 4 cleanup collide with in-flight commits | Low | Single rename commit; no parallel work |
| Missing `_progress/00-design-log.md` blocks WDS init | High | Add it during cleanup phase; populated from existing closeout doc |

---

## 7. Naming conventions — quick reference card

For all files and folders touched by WDS:

| Item | Rule | Example |
|---|---|---|
| Phase folders | Uppercase letter prefix + dash + name | `D-UX-Design/` |
| Sub-folders inside D-UX-Design | lowercase, plural, hyphenated | `wireframes/`, `decisions/`, `tokens/` |
| Page specs | lowercase, hyphenated, `.md`, FLAT in D-UX-Design/ | `D-UX-Design/operator-dashboard.md` |
| Wireframes | `[page-slug].excalidraw` + `.png` | `D-UX-Design/wireframes/operator-dashboard.excalidraw` |
| Scenarios | zero-padded + slug, alliterative archetype in slug | `C-UX-Scenarios/03-anjali-the-anchor-citizen-arc.md` |
| Personas | zero-padded + `persona-[firstname]-the-[archetype]` | `B-Trigger-Map/03-persona-priya-the-pipeline-pilot.md` |
| Work Orders | `WO-NNN-[slug].md` | `E-Development/WO-001-citizen-status-timeline.md` |
| Feature PRDs | `NNN-[feature].xml` | `E-Development/001-citizen-status-timeline.xml` |
| Design tokens | kebab-case CSS vars | `--color-trust-t1`, `--spacing-4` |
| Component IDs | `[type-prefix]-[number]` zero-padded | `btn-001`, `mdl-003` |
| Component files | lowercase, hyphenated, matches component | `button.md`, `hotline-intake-modal.md` |

---

_End of audit._
