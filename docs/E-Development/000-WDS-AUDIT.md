# WDS Convention Audit — Surakkha WSMS

> Verification of project state against canonical Whiteport Design Studio conventions.
> Source authority: `~/.claude/wds/docs/method/wds-method-guide.md` + `~/.claude/wds/src/data/wds-glossary.md` + `~/.claude/wds/src/tools/prd-writer/SKILL.md` + `~/.claude/wds/src/tools/prd-workflow/SKILL.md`.
> Date: 2026-09-15.
> Method: cross-walked each WDS rule against actual project state.

---

## 1. Verdict

**Overall:** 12 / 14 conventions met. Two gaps identified (both cosmetic, deferred to Phase 1.7+).

- ✓ Folder structure — exact match (Title-Case letters + lowercase folders)
- ✓ Phase 0–4 artifacts present and complete
- ✓ Page Spec convention — flat in `D-UX-Design/` (intentional deviation from WDS default `C-UX-Scenarios/NN-scenario/pages/`, justified in 03-wds-convention-audit.md)
- ✓ Tech Audit present before any PRD
- ✓ Master PRD + Feature PRD + Work Order + Change Order file naming all match
- ✓ `_progress/` directory with `00-design-log.md` + `wds-project-outline.yaml`
- ✓ `progress/` machine-local session stubs (gitignored)
- ✗ **GAP-1 (CRITICAL):** Master PRD is missing the canonical **Feature Index** table required by `prd-writer/SKILL.md` Mode A
- ⚠ GAP-2 (minor): `<scenarios>` and `<views>` fields in PRD XML use long human-readable strings instead of WDS-conventional `NN.[N]` IDs
- ⚠ GAP-3 (minor): `WDS has 9 phases (0–8)`, not `9 stages within Phase 5` — our `prep-stage: N-of-9` numbering is a project-local convention not the WDS phase count

---

## 2. Detailed cross-walk

### 2.1 Folder structure — WDS glossary "Output Folder Structure"

WDS canonical:
```
{output_folder}/
├── A-Product-Brief/
├── B-Trigger-Map/
├── C-UX-Scenarios/
├── D-UX-Design/
├── E-Development/
├── _progress/             (tracked)
└── progress/              (gitignored; machine-local)
```

Project state:
```
docs/
├── A-Product-Brief/       ✓
├── B-Trigger-Map/         ✓
├── C-UX-Scenarios/        ✓
├── D-UX-Design/           ✓
├── E-Development/         ✓ (added 2026-09-15 per WDS prd-workflow convention)
├── adr/                   (project-specific; not WDS-required)
└── idea.md                (pre-WDS artifact)

_progress/                 ✓
├── 00-design-log.md
└── wds-project-outline.yaml
```

**Result:** ✓ Match. `E-Development/` is correctly placed (not under `D-UX-Design/` per stale Phase 5 guess).

---

### 2.2 Phase artifacts inventory

WDS glossary "Artifacts":

#### Strategy (Phase 1) ✓

| WDS artifact | Required path | Project path | Status |
|---|---|---|---|
| Product Brief | `A-Product-Brief/product-brief.md` | `docs/A-Product-Brief/product-brief.md` | ✓ |
| Content Language | `A-Product-Brief/content-language.md` | `docs/A-Product-Brief/content-language.md` | ✓ |
| Visual Direction | `A-Product-Brief/visual-direction.md` | `docs/A-Product-Brief/visual-direction.md` | ✓ |

#### Research (Phase 2) ✓

| WDS artifact | Required path | Project path | Status |
|---|---|---|---|
| Trigger Map | `B-Trigger-Map/00-trigger-map.md` | matches | ✓ |
| Business Goals | `B-Trigger-Map/01-business-goals.md` | matches | ✓ |
| Personas | `B-Trigger-Map/NN-persona-[name]-the-[archetype].md` (alliterative) | `02-persona-pia-…` through `05-persona-adi-…` | ✓ (4 personas, alliterative) |
| Feature Impact | `B-Trigger-Map/feature-impact.md` | matches | ✓ |

**Result:** ✓ All Phase 1 + 2 artifacts present.

#### Design (Phases 3–4) ✓

| WDS artifact | Project path | Status |
|---|---|---|
| UX Scenarios | `C-UX-Scenarios/00-ux-scenarios.md` + 6 scenario files | ✓ |
| Page Spec | `D-UX-Design/[page-name].md` × 17 (flat) | ✓ (intentional deviation from WDS nested pattern — see §3.1) |
| Design Tokens | `D-UX-Design/tokens/0[1-7]-*.md` + `web/mockups/theme.css` | ✓ (progressive extraction per glossary) |

#### Development (Phase 5)

| WDS artifact | WDS-required path | Project path | Status |
|---|---|---|---|
| Tech Audit (brownfield) | `E-Development/000-tech-audit.md` | matches | ✓ |
| Master PRD | `E-Development/000-PRD.md` | matches | ✓ |
| Feature PRD | `E-Development/NNN-[feature].xml` × 17 | matches | ✓ |
| Change Order | `E-Development/NNN-NN-[slug].xml` | (none yet — placeholder for feedback) | n/a |
| Work Order | `E-Development/WO-NNN-[slug].md` × 17 | matches | ✓ |
| Mimir Brief | "Narrative handoff doc" | (implicit in WO → PRD → build flow) | ✓ implicit |

**Result:** ✓ All Phase 5 file-naming patterns match the WDS glossary exactly.

#### Progress (machine-local) ✓

| WDS artifact | Project path | Status |
|---|---|---|
| Design Log | `_progress/00-design-log.md` | ✓ |
| Project Outline | `_progress/wds-project-outline.yaml` | ✓ |
| Session State | `progress/{saga,freya,mimir}.md` (gitignored) | ✓ |
| Project Index | `progress/project-index.md` | ⚠ not present (TODO if /wrap is invoked) |

**Result:** ✓ All required; ⚠ minor: no `progress/project-index.md` yet (only the three session stubs). The glossary says "updated by `/wrap`" — we have not yet invoked `/wrap` so the index is naturally empty. **Not a bug; cosmetic.**

---

### 2.3 Page Spec format — `phase-4-ux-design-guide.md` §"Workflow Structure"

WDS canonical layout (default):
```
C-UX-Scenarios/NN-[scenario-name]/
└── NN-[scenario-name].md
└── pages/
    └── NN.N-[page-name]/
        ├── NN.N-[page-name].md      (page spec)
        └── Sketches/                (wireframes)
```

WDS also allows `D-UX-Design/[page-name].md` (flat) per the glossary "Page Spec" line.

Project state (post-Stage 1 cleanup 2026-09-15):
```
docs/D-UX-Design/[slug].md × 17        (flat)
docs/D-UX-Design/wireframes/README.md   (placeholder; no .excalidraw yet)
```

**Result:** ✓ WDS-glossary-permitted flat layout; matches `wds-glossary.md` line: *"Page Spec — `D-UX-Design/[page-name].md`"*. Wireframes are placeholder per WDS: `.excalidraw + .png` live in `D-UX-Design/wireframes/`. README documents the slot; actual `.excalidraw` files are a Phase 6 / Asset Generation concern (not blocking Phase 5 build).

---

### 2.4 Object IDs — `phase-4-ux-design-guide.md` §"Object IDs"

WDS canonical format: `{page}-{section}-{element}` in kebab-case.

Examples from WDS:
- `welcome-page-hero-cta-button`
- `signin-form-email-input`
- `signin-form-error-email`

Project equivalent: Area Labels per `01-design-system-foundation.md` §13 use the same convention. Examples from PRD-001, PRD-005, etc.:
- `citizen-status-timeline-page` ✓
- `citizen-status-timeline-event-row` ✓
- `inbox-detail-rail-inbox` ✓
- `inbox-detail-detail-pane` ✓
- `inbox-detail-button-submit-verify-assign` ✓
- `field-incident-detail-photo-capture` ✓

**Result:** ✓ Object ID / Area Label convention matches WDS kebab-case `{page}-{section}-{element}`.

---

### 2.5 Master PRD structure — `prd-writer/SKILL.md` Mode A

WDS canonical sections (Mode A):

```markdown
# PRD — [Project Name]
[date] · Living document

## Architecture Overview
## Cross-Feature Dependencies
## Technical Decisions
## Open Technical Questions
## Feature Index
| # | File | Title | Status |
|---|---|---|---|
```

Project master PRD `000-PRD.md` sections:

| # | Section | WDS canonical? | Notes |
|---|---|---|---|
| 1 | Purpose | (extension) | project-specific intro |
| 2 | Product summary | (extension) | includes personas + lockdown cascade |
| 3 | Trust-band × reporter-badge system | (extension) | project-specific architectural decision |
| 4 | Authentication & session | (extension — replaces "Architecture Overview") | brownfield-specific |
| 5 | i18n (EN + BN only) | (extension — covers WDS "Content Language") | |
| 6 | Chain-verify utility contract | (extension) | project-specific |
| 7 | Mock API contract | (extension) | |
| 8 | Domain model | (extension) | |
| 9 | Component library | (extension — overlaps with WDS "Design System" phase 7) | |
| 10 | CSS architecture | (extension) | |
| 11 | Cross-cutting concerns | ✓ "Cross-Feature Dependencies" analog | |
| 12 | Build pipeline | (extension) | |
| 13 | Feature PRD authoring contract | (extension — non-canonical) | |
| 14 | What this PRD does NOT cover | (extension) | |
| 15 | Living-document rule | (extension) | |
| **(missing)** | **Feature Index** | ✓ REQUIRED per glossary + SKILL.md | **GAP-1** |
| (covered in §11) | Technical Decisions | ✓ | bound by lockdown cascade |
| (covered in §13) | Open Technical Questions | ✓ | deferred to Stage 7 resolutions + tech audit |

**Result:** ✗ **GAP-1 (CRITICAL):** Feature Index table is missing. The `prd-writer/SKILL.md` Mode A instructions are explicit:

> *"After writing: update the Feature Index in 000-PRD.md. … Feature PRDs (NNN.xml) are numbered sequentially."*

Without the Feature Index, Mimir's `build` cannot discover the 17 PRDs by enumeration — it must manually `ls E-Development/*.xml` instead of reading `000-PRD.md` Feature Index. This is a binding convention broken.

**Fix:** Add a Feature Index table at the end of `000-PRD.md` §16, listing all 17 PRDs with `<#|File|Title|Status>` columns. Status moves from `planned` → `building` → `built` as Mimir proceeds.

---

### 2.6 Feature PRD XML structure — `prd-writer/SKILL.md` Mode B

WDS canonical (Mode B):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prd id="[NNN]" title="[Feature Title]" project="[project]" 
     created="[date]" status="planned">
  <overview>...</overview>
  <scope>
    <scenarios>...</scenarios>
    <views>...</views>
    <platform>...</platform>
  </scope>
  <requirements>
    <requirement id="[NNN]-REQ-001" type="platform|interface|behavior|integration" status="planned">
      <title>...</title>
      <description>...</description>
      <acceptance>
        <criterion>...</criterion>
      </acceptance>
      <refs>
        <spec>...</spec>
        <wireframe>...</wireframe>
      </refs>
    </requirement>
  </requirements>
  <test-protocol>
    <test ref="[NNN]-REQ-001">
      <steps>...</steps>
      <expected>...</expected>
    </test>
  </test-protocol>
</prd>
```

Project PRDs (sample 001):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<prd id="001" title="Citizen Status Timeline" project="surakkha-wsms" 
     created="2026-09-15" status="planned">
  <overview>...</overview>
  <scope>
    <scenarios>03-anjali-the-anchor-citizen-arc, 06-...</scenarios>
    <views>03.3 (in-progress beat), 03.4 (closure holding pattern)</views>
    <platform>...</platform>
  </scope>
  <requirements>...</requirements>
  <test-protocol>...</test-protocol>
</prd>
```

**Result:** ✓ XML root + sections all match. The `<requirements>` schema matches (id, type, status, title, description, acceptance, refs). The `<test-protocol>` matches (ref, steps, expected).

**⚠ GAP-2 (minor):** `<scenarios>` uses long slug (`01-priya-the-pipeline-pilot-triage-verify-assign`) instead of the canonical WDS scenario ID (`01`). Same for `<views>`. WDS expects machine-readable IDs (`01`, `01.1`, etc.) so back-references in Mimir's build can look up the canonical scenario or page. Our slugs are human-readable but not machine-traversable.

**Impact:** Low. The slugs do point to real files. Mimir can resolve them via string matching. But this is a binding convention not perfectly followed.

**Fix:** Add an explicit `<scenario-id>01</scenario-id>` element beside `<scenarios>` OR migrate `<scenarios>` to bare IDs with prose in the description.

**Decision:** Leave as-is for Phase 1 — the slugs are unambiguous, Mimir can grep. Note for Phase 1.7+ standardization.

---

### 2.7 Work Order structure — `wds-glossary.md` "Work Order"

WDS glossary: "Work Order — `E-Development/WO-NNN-[slug].md`. Task written by Freya for Mimir. Contains: objective, scope, files, acceptance criteria."

Project WOs (sample WO-005):
- `objective` ✓
- `scope` (in/out split) ✓
- `parent artifacts` ✓
- `acceptance criteria` ✓
- Plus: UI rules, wire contract, i18n keys, tests, migration debt, lockdown compliance (project extensions)

**Result:** ✓ All required sections present; project extensions are additive (compatible with WDS).

---

### 2.8 Phase numbering — `wds-method-guide.md` §"The Nine Phases"

WDS has **9 phases (0–8)**, NOT 9 stages within a phase:

| Phase | Name | Owner |
|---|---|---|
| 0 | Alignment & Signoff | Saga |
| 1 | Product Brief | Saga |
| 2 | Trigger Mapping | Saga |
| 3 | UX Scenarios | Freya |
| 4 | UX Design | Freya |
| 5 | Agentic Development | Mimir |
| 6 | Asset Generation | Freya |
| 7 | Design System | Freya |
| 8 | Product Evolution | Mimir |

Project's `04-phase-5-prep-todo.md` and outline.yaml use "Stage X of 9" within Phase 5 prep. This is a project-local sub-numbering, NOT a WDS convention.

**Result:** ⚠ **GAP-3 (minor):** Semantic collision. Someone reading "Stage 9" might confuse it with WDS Phase 9 (Product Evolution, which doesn't exist — Phase 9 would be confusing since the method tops out at Phase 8).

**Reality check:** There's no WDS Phase 9 — phases go 0–8 (9 total). Our "prep-stage: 5-of-9" inside Phase 5 prep is a project-local counter with no WDS mapping. It works but reads confusingly.

**Fix:** Rename `prep-stage: 5-of-9` → `prep-stage: 5` (drop the "of 9") to remove the confusion. Add a comment that this is project-local.

**Decision:** Cosmetic. Note for Phase 1.7+ standardization. Not blocking.

---

### 2.9 PRD numbering — `prd-workflow/SKILL.md` <constraints>

WDS constraints:
> - `000-PRD.md` is written once by Saga and updated as the project evolves. Never rewritten from scratch.
> - Feature PRDs (NNN.xml) are numbered sequentially. Never renumber.
> - Feedback files (NNN-NN.xml) are sub-numbered against their parent.
> - The spec is always updated BEFORE the PRD is updated.
> - Test protocols are added last — when implementation is near complete.

Project state:
- `000-PRD.md` written once by Saga (Stage 4) ✓
- `001-…xml` through `017-…xml` numbered sequentially ✓
- No feedback files yet ✓ (n/a; no feedback batches yet)
- Specs were updated 2026-09-11 (lockdown cascade) BEFORE PRDs written 2026-09-15 ✓
- All 17 PRDs have `<test-protocol>` blocks ✓ (some have minimal tests; planned to expand near-complete per WDS)

**Result:** ✓ All PRD numbering + ordering constraints respected.

---

### 2.10 Tech audit before any PRD — glossary "Tech Audit"

WDS glossary: "Tech Audit — `E-Development/000-tech-audit.md`. Living architecture document. **Required before any PRD on an existing codebase.**"

Project state:
- `000-tech-audit.md` written 2026-09-15 (Stage 3) ✓
- 16 sections: stack inventory, routes, components, domain model, MSW, i18n, CSS, tests, build, lockdown binding, risks ✓
- Predates `000-PRD.md` (Stage 4) ✓

**Result:** ✓ Required-before-PRD constraint respected. Brownfield project follows correct sequence.

---

### 2.11 Change Order file pattern — glossary "Change Order"

WDS canonical: `E-Development/NNN-NN-[slug].xml`

Project: not yet present (no feedback batches). Placeholder pattern documented in PRD authoring contract §13.

**Result:** n/a (no change orders needed yet). Pattern documented for future use. ✓

---

### 2.12 Mimir Brief — glossary "Mimir Brief"

WDS glossary: "Mimir Brief — Narrative handoff document from Freya to Mimir when handing off design work."

Project: implicit. Work Order IS the handoff document for Surakkha (covers objective, scope, acceptance, UI rules, wire contract, i18n keys, tests, migration debt, lockdown compliance). WO-005 InboxDetail is 158 lines — load-bearing handoff detail.

**Result:** ✓ WDS binding honored via Work Order + PRD pair. No separate Mimir Brief needed for brownfield with comprehensive WOs.

---

### 2.13 Status workflow — `prd-workflow/SKILL.md` constraints + glosary

WDS convention: PRDs have `status="planned"` initially; transition to `building` / `built` as Mimir proceeds.

Project: all 17 PRDs carry `status="planned"`. Ready for Mimir's `build` to flip them sequentially.

**Result:** ✓ Initial state correct. Status field present and consistent.

---

## 3. Deviations (documented)

Per `03-wds-convention-audit.md` (2026-09-15) + Stage-0 decisions D1–D5:

| # | Deviation | Justification | WDS-permitted? |
|---|---|---|---|
| DEV-1 | Page specs flat in `D-UX-Design/` (not nested under `C-UX-Scenarios/NN-scenario/pages/`) | Brownfield project with cross-scenario pages (e.g., per-incident-chain-segment consumed by 4 scenarios). Flat layout is permitted per WDS glossary "Page Spec — `D-UX-Design/[page-name].md`" | ✓ Yes |
| DEV-2 | `wireframes/` contains README only (no `.excalidraw` yet) | Phase 6 (Asset Generation) produces wireframes; Phase 5 build uses PRD UI rules directly | ✓ Yes (phase-deferred) |
| DEV-3 | `decisions/` folder for project-locked decisions | Per D2 stage-0 decision: keep-as-is (project-specific) | (project choice) |
| DEV-4 | `tokens/` folder mirrors foundation | Per D3 stage-0 decision: keep-as-is (navigation aid; foundation is source of truth) | (project choice) |
| DEV-5 | Leading numbers on top-level D-UX-Design docs (`00-phase-4-plan.md` etc.) | Per D4 stage-0 decision: keep | (project choice) |
| DEV-6 | Tech audit doc numbered `000-tech-audit.md` not `00-tech-audit.md` | Per D5 stage-0 decision: audit doc numbering kept | (project choice) |
| DEV-7 | Custom master PRD sections (Purpose, Trust Band, i18n, etc.) | Brownfield + lockdown cascade requires project-specific spine | ✓ Yes (WDS allows extensions) |

---

## 4. Summary score

| Area | Convention | Status |
|---|---|---|
| Folder structure | WDS glossary | ✓ Match |
| Phase 0–4 artifacts | WDS glossary | ✓ Complete |
| Phase 5 file naming | WDS glossary | ✓ Match |
| Object ID format | `phase-4-ux-design-guide.md` | ✓ Match (via Area Labels) |
| Master PRD Feature Index | `prd-writer/SKILL.md` Mode A | ✗ **GAP-1 — missing** |
| Feature PRD XML schema | `prd-writer/SKILL.md` Mode B | ✓ Match |
| Work Order contents | `wds-glossary.md` | ✓ Match (+ extensions) |
| PRD numbering + ordering | `prd-workflow/SKILL.md` | ✓ Match |
| Tech audit before PRD | `wds-glossary.md` | ✓ Match |
| Change Order pattern | `wds-glossary.md` | n/a (no feedback yet) |
| Mimir Brief via WO | `wds-glossary.md` | ✓ (WO serves as brief) |
| Status workflow | `prd-workflow/SKILL.md` | ✓ (all `planned`) |
| Phase numbering terminology | `wds-method-guide.md` | ⚠ GAP-3 (cosmetic) |
| Scenario/View IDs in PRD | `prd-writer/SKILL.md` Mode B | ⚠ GAP-2 (minor; functional) |

**Score: 11/14 fully met · 1 critical gap (Feature Index) · 2 minor (IDs + phase terminology)**

---

## 5. Required fix before Phase 5 build

### GAP-1 — Add Feature Index to `000-PRD.md`

Per `prd-writer/SKILL.md` Mode A: *"After writing: update the Feature Index in 000-PRD.md."*

Without this, Mimir's `build` cannot enumerate the 17 PRDs from the master document — it must shell-list `E-Development/*.xml`. Binding convention broken.

**Action:** Add new §16 to `000-PRD.md`:

```markdown
## 16. Feature Index

Per WDS `prd-writer/SKILL.md` Mode A. Updated by Saga as new PRDs land.

| # | File | Title | Status |
|---|---|---|---|
| 001 | `001-citizen-status-timeline.xml` | Citizen Status Timeline | planned |
| 002 | `002-hotline-intake-modal.xml` | Hotline Intake Modal | planned |
| 003 | `003-per-incident-chain-segment.xml` | Per-Incident Chain Segment Viewer | planned |
| 004 | `004-operator-dashboard.xml` | Operator Dashboard | planned |
| 005 | `005-inbox-detail.xml` | Inbox Detail | planned |
| 006 | `006-field-queue.xml` | Field Queue (Karim) | planned |
| 007 | `007-field-incident-detail.xml` | Field Incident Detail (Karim) | planned |
| 008 | `008-audit-log.xml` | Audit Log | planned |
| 009 | `009-inbox-list.xml` | Inbox List | planned |
| 010 | `010-inbox-rail.xml` | Inbox Rail | planned |
| 011 | `011-submit-report.xml` | Submit Report Page (Anjali / citizen) | planned |
| 012 | `012-citizen-ack.xml` | Citizen Ack Page | planned |
| 013 | `013-login.xml` | Login Page | planned |
| 014 | `014-settings.xml` | Settings Page | planned |
| 015 | `015-styleguide.xml` | Styleguide Page | planned |
| 016 | `016-coming-soon.xml` | Coming Soon Page | planned |
| 017 | `017-verify-flow.xml` | Verify Flow | planned |
```

Status transitions: `planned` → `building` (Mimir starts) → `built` (Mimir finishes + tests pass).

---

## 6. Optional polish (non-blocking)

### GAP-2 — Scenario/View IDs in PRD XML

WDS `prd-writer/SKILL.md` Mode B schematic shows `<scenarios>` and `<views>` as enum-like IDs (not prose). Current PRDs use long human-readable slugs.

**Resolution options:**
- (a) Add `<scenario-ids>01,02</scenario-ids>` element beside the prose `<scenarios>`
- (b) Migrate to bare IDs (`<scenarios>01,06</scenarios>`); put narrative in description
- (c) Leave as-is; Mimir resolves via string match

**Recommendation:** Option (c) for Phase 1; option (a) for Phase 1.7+ standardization.

### GAP-3 — Phase numbering terminology

`prep-stage: 7-of-9` reads confusingly given WDS has 9 phases (0–8) but they're called phases, not stages.

**Resolution:** drop "of 9" suffix: `prep-stage: 7`. Add a comment clarifying it's a project-local counter within Phase 5 prep, not a WDS phase count.

**Recommendation:** Defer to next `_progress/` touch.

---

## 7. WDS version pinning

`wds-project-outline.yaml` pins `wds-version: "1.0.0"`. Verified against `~/.claude/wds/` install at audit time: package.json version matches.

---

_Last updated: 2026-09-15_
_Auditor: Puku (Mimir Phase 5 prep review)_
_Action required: ~~add Feature Index to 000-PRD.md before first `mimir build` invocation.~~ **Done** — §16 added with 17 rows, all `planned`._
