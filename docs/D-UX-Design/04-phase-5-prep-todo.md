# Phase 5 Prep — TODO Tracker

> Tracking file for the WDS convention cleanup and Phase 5 (development) preparation work.
> Source audit: `docs/D-UX-Design/03-wds-convention-audit.md`
> Date opened: 2026-09-15

---

## Status legend

- `[ ]` not started
- `[~]` in progress
- `[x]` complete
- `[!]` blocked / needs decision
- `[-]` skipped / out of scope

---

## Stage 0 — Decisions to lock

These need a call before any mechanical work starts.

- [ ] **D1.** `wireframes/*.md` mirrors — **delete** or **keep as `_spec-mirrors/`** (informational only)?
- [ ] **D2.** `decisions/` folder — **keep as-is** (project-specific) or **rename to `_lockdown/`** (signals "not WDS")?
- [ ] **D3.** `tokens/*.md` mirrors — **keep** (navigation aid) or **delete** (foundation doc is source of truth)?
- [ ] **D4.** `00-phase-4-plan.md` / `01-design-system-foundation.md` / `02-phase-4-closeout.md` — **keep leading numbers** (current sort order) or **rename to drop them**?
- [ ] **D5.** Audit doc numbering — should `03-wds-convention-audit.md` become a WDS artifact or stay project-specific?

---

## Stage 1 — Convention cleanup (mechanical, ~1 h)

### 1.1 Flatten page specs

- [x] **1.1.a** Move 17 files from `docs/D-UX-Design/specs/` → `docs/D-UX-Design/` — **done 2026-09-15** (git mv preserves history)
- [x] **1.1.b** Delete empty `docs/D-UX-Design/specs/` folder — **done 2026-09-15**
- [x] **1.1.c** `git mv` each file (preserves history) — **done 2026-09-15** (used `git mv`)
- [x] **1.1.d** Grep `docs/` for any remaining `specs/` references — fix them — **done 2026-09-15** (clean; only 2 historical-narrative hits remain in `00-phase-4-plan.md` and `00-lockdown-audit.md` "Layout note (2026-09-15)")

### 1.2 Wireframes folder

- [x] **1.2.a** Per D1: delete `wireframes/*.md` mirrors — **done 2026-09-15**
- [x] **1.2.b** Add `wireframes/README.md` documenting the WDS-spec folder role — **done 2026-09-15**

### 1.3 Cross-reference updates

- [x] **1.3.a** Update `docs/D-UX-Design/02-phase-4-closeout.md` §1, §7 — change `specs/x.md` → `x.md` — **done 2026-09-15**
- [x] **1.3.b** Update `docs/D-UX-Design/00-phase-4-plan.md` §5 folder diagram — **done 2026-09-15**
- [x] **1.3.c** Update `docs/D-UX-Design/01-design-system-foundation.md` mirror-pointer note — **done 2026-09-15**
- [x] **1.3.d** Update `docs/D-UX-Design/tokens/README.md` point-at-specs links — **done 2026-09-15**
- [x] **1.3.e** Update `docs/D-UX-Design/wireframes/README.md` (new) point-at-specs — **done 2026-09-15**
- [x] **1.3.f** Update `docs/D-UX-Design/decisions/00-lockdown-audit.md` (narrative mention) — **done 2026-09-15** (replaced with "Layout note" explaining the historical state)
- [x] **1.3.g** Update `docs/D-UX-Design/decisions/01-token-deconfliction-plan.md` — **N/A** (no `specs/` references found)
- [x] **1.3.h** Final grep: `grep -rn "specs/" docs/` must return zero hits — **done 2026-09-15** (2 hits remain, both intentional historical-narrative)

### 1.4 Convention audit commit

- [x] **1.4.a** Stage 1.1 + 1.2 + 1.3 as one commit — **in flight 2026-09-15**

---

## Stage 2 — WDS-mandated scaffolding (~5 min)

- [x] **2.a** Create `docs/E-Development/` folder (with README documenting the slot inventory + WO-001→WO-017 mapping) — **done 2026-09-15**
- [x] **2.b** Create `_progress/00-design-log.md` with Design Loop Status table (17 rows across Tier 1/2/3) — **done 2026-09-15**
- [x] **2.c** Create `progress/saga.md`, `progress/freya.md`, `progress/mimir.md` stub session-state files — **done 2026-09-15** (gitignored — machine-local per WDS glossary)
- [x] **2.d** Update `_progress/wds-project-outline.yaml` to mark `ux-design: complete`, `development: in-progress`, prep-stage 2-of-9, and lock the 5 stage-0 decisions — **done 2026-09-15**
- [x] **2.e** Commit: `chore(ux-design): create E-Development/ scaffold + design-log` — **done 2026-09-15** (commit `db4c8f4`)

---

## Stage 3 — Brownfield tech audit (Mimir, 2–3 h)

- [ ] **3.a** Run `/sync` to refresh WDS to latest
- [ ] **3.b** Wake `/mimir` (or invoke `mimir/SKILL.md` directly) with phase = tech-audit
- [ ] **3.c** Mimir produces `docs/E-Development/000-tech-audit.md` covering:
  - Stack inventory (`web/`, `src/`, mockups, etc.)
  - Existing routes/pages/components map
  - Data model audit
  - Risks and constraints
- [ ] **3.d** Review audit; resolve any blockers before moving to PRDs
- [ ] **3.e** Commit: `docs(development): add brownfield tech audit`

---

## Stage 4 — Master PRD (Saga, 1–2 h)

- [ ] **4.a** Run `/sync` to refresh WDS
- [ ] **4.b** Wake Saga with `prd` workflow
- [ ] **4.c** Saga writes `docs/E-Development/000-PRD.md`:
  - Platform-wide requirements (auth, i18n, accessibility)
  - Trust-band system architecture (post-lockdown binding)
  - Reporter-badge dimension (separate from trust band)
  - Chain-verification utility (`chain-verify.ts`) contract
  - Cross-cutting concerns (logging, audit, telemetry)
- [ ] **4.d** Review + approve
- [ ] **4.e** Commit: `docs(development): add master PRD`

---

## Stage 5 — Work Orders (Freya, ~6 h, by tier)

### 5.1 Tier 1 (gap screens, 3 WOs)

- [ ] **5.1.a** Run `/sync` to refresh WDS
- [ ] **5.1.b** Wake Freya with `work-order` workflow
- [ ] **5.1.c** WO-001 — Citizen Status Timeline (`docs/E-Development/WO-001-citizen-status-timeline.md`)
- [ ] **5.1.d** WO-002 — Hotline Intake Modal (`docs/E-Development/WO-002-hotline-intake-modal.md`)
- [ ] **5.1.e** WO-003 — Per-Incident Chain Segment (`docs/E-Development/WO-003-per-incident-chain-segment.md`)
- [ ] **5.1.f** Tier 1 commit: `docs(development): tier 1 work orders`

### 5.2 Tier 2 (load-bearing, 5 WOs)

- [ ] **5.2.a** Run `/sync` to refresh WDS
- [ ] **5.2.b** WO-004 — Operator Dashboard
- [ ] **5.2.c** WO-005 — Inbox Detail
- [ ] **5.2.d** WO-006 — Field Queue
- [ ] **5.2.e** WO-007 — Field Incident Detail
- [ ] **5.2.f** WO-008 — Audit Log
- [ ] **5.2.g** Tier 2 commit: `docs(development): tier 2 work orders`

### 5.3 Tier 3 (light, 9 WOs)

- [ ] **5.3.a** Run `/sync` to refresh WDS
- [ ] **5.3.b** WO-009 — Inbox List
- [ ] **5.3.c** WO-010 — Inbox Rail
- [ ] **5.3.d** WO-011 — Submit Report Page
- [ ] **5.3.e** WO-012 — Citizen Ack Page
- [ ] **5.3.f** WO-013 — Login Page
- [ ] **5.3.g** WO-014 — Settings Page
- [ ] **5.3.h** WO-015 — Styleguide Page
- [ ] **5.3.i** WO-016 — Coming Soon Page
- [ ] **5.3.j** WO-017 — Verify Flow
- [ ] **5.3.k** Tier 3 commit: `docs(development): tier 3 work orders`

---

## Stage 6 — Feature PRDs (Mimir, ~4 h)

- [ ] **6.a** Run `/sync`
- [ ] **6.b** Wake Mimir with `prd-workflow`
- [ ] **6.c** For each WO → produce `docs/E-Development/NNN-[slug].xml`
- [ ] **6.d** Each feature PRD references its parent WO + spec + scenario
- [ ] **6.e** Commit per tier (or one mega-commit)

---

## Stage 7 — Open questions / MAJOR items

- [ ] **7.a** Resolve 37 open questions across Tier 2 specs (mostly structural — defer to implementation per current plan)
- [ ] **7.b** Fix 5 MAJOR Tier 3 items:
  - SubmitReportPage dropdown → plain-language
  - CitizenAckPage VS15 + glyph chars + ack-window expiry
  - Settings Reset → ghost variant + confirmation modal
  - Styleguide 3-band → 5-band docs + remove Danger button misuse demo
  - (1 more — verify from `02-phase-4-closeout.md` §4.3)

---

## Stage 8 — Migration debt (Phase 1.7+, not blocking)

- [ ] **8.a** Progressive `--band-*` → `--color-trust-t1/2/3` migration across:
  - `InboxRow.tsx`, `InboxList.tsx`, `InboxRail.tsx`
  - `components.css`, `inbox.css`
- [ ] **8.b** Stylelint rule for alert-red reservation

---

## Stage 9 — Done = ready for `/mimir` `build`

- [ ] **9.a** `_progress/wds-project-outline.yaml` → `development: ready-for-build`
- [ ] **9.b** `_progress/00-design-log.md` → all 17 pages at `T` (tokens extracted)
- [ ] **9.c** `/mimir` `build` invocation runs without missing prerequisites

---

## Time budget rollup

| Stage | Estimate |
|---|---|
| 0 — Decisions | 10 min (waiting on user) |
| 1 — Convention cleanup | 1 h |
| 2 — Scaffolding | 5 min |
| 3 — Brownfield audit | 2–3 h |
| 4 — Master PRD | 1–2 h |
| 5 — Work Orders | ~6 h |
| 6 — Feature PRDs | ~4 h |
| 7 — Open items | 1–2 h |
| **Total** | **~15–18 h ≈ 2 working days** |

---

## Commit plan

| # | Stage | Commit message |
|---|---|---|
| 1 | 1.1 + 1.2 + 1.3 | `refactor(ux-design): flatten specs/ to WDS spec-writer convention` |
| 2 | 2 | `chore(ux-design): create E-Development/ scaffold + design-log` |
| 3 | 3 | `docs(development): add brownfield tech audit` |
| 4 | 4 | `docs(development): add master PRD` |
| 5a | 5.1 | `docs(development): tier 1 work orders` |
| 5b | 5.2 | `docs(development): tier 2 work orders` |
| 5c | 5.3 | `docs(development): tier 3 work orders` |
| 6 | 6 | `docs(development): feature PRDs (all tiers)` |

---

_Last updated: 2026-09-15_
