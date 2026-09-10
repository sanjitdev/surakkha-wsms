# Surakkha v1 UX Spines — Structure Review

**Date:** 2026-09-06
**Reviewer lens:** Structure (canonical order, frontmatter, cross-references, sources, hygiene)
**Files reviewed:**
- `DESIGN.md` (visual identity)
- `EXPERIENCE.md` (IA, voice/tone, state, interactions, a11y, flows)

---

## 1. Canonical Section Order

### DESIGN.md

Required order: Brand & Style · Colors · Typography · Layout & Spacing · Elevation & Depth · Shapes · Components · Do's and Don'ts.

Actual order:
1. Brand & Style ✓
2. Colors ✓
3. Typography ✓
4. Layout & Spacing ✓
5. Elevation & Depth ✓
6. Shapes ✓
7. Components ✓
8. Do's and Don'ts ✓
9. Cross-references (appendix — not in canonical list but acceptable as trailing pointer)

**Verdict:** Canonical order preserved. All 8 required sections present in correct sequence.

### EXPERIENCE.md

Required order: Foundation · Information Architecture · Voice and Tone · Component Patterns · State Patterns · Interaction Primitives · Accessibility Floor · Key Flows.

Actual order:
1. Foundation ✓
2. Information Architecture ✓
3. Voice and Tone ✓
4. Component Patterns ✓
5. State Patterns ✓
6. Interaction Primitives ✓
7. Accessibility Floor ✓
8. Key Flows ✓
9. Cross-references (appendix — acceptable)

**Verdict:** Canonical order preserved. All 8 required sections present in correct sequence.

---

## 2. YAML Frontmatter Tokens

### DESIGN.md

Required: `colors`, `typography`, `rounded`, `spacing`, `components`.

| Token | Present | Well-formed | Notes |
|---|---|---|---|
| `colors` | ✓ | ✓ | 8 named tokens (primary, primary-tint, surface, ink, accent-amber, safe-green, alert-red, divider); each carries `name`, `hex`, `rationale` |
| `typography` | ✓ | ✓ | `family-sans`, `family-bangla`, `family-mono` with rationales; explicit `scale` (xs–display); `weights` (regular–bold); `line-heights` (tight/body/loose) |
| `rounded` | ✓ | ✓ | `radius-sm` (6px), `radius-md` (10px), `radius-lg` (16px), `radius-pill` (999px); rationale attached |
| `spacing` | ✓ | ✓ | `unit: 4px`, scale `s-1`–`s-8` (4–64px); rationale attached |
| `components` | ✓ | ✓ | 7 components declared (button-primary, button-secondary, button-danger, card, input-field, badge-status, message-template); each with token references, not free values |

All token references in component declarations point to declared tokens (e.g., `radius: radius-md`, `padding-x: s-5`) — no orphan tokens.

### EXPERIENCE.md

EXPERIENCE.md is not required to carry design-token frontmatter (tokens live in DESIGN.md). Frontmatter present is minimal and correct: title, status, created, updated, stepsCompleted, companions, sources.

**Verdict:** Both frontmatters well-formed. All required DESIGN.md tokens present, internally consistent, and referenced from component declarations.

---

## 3. Companion Pointer

- DESIGN.md frontmatter `companions: [EXPERIENCE.md]` ✓
- EXPERIENCE.md frontmatter `companions: [DESIGN.md]` ✓

Cross-pointer is symmetric and correct.

---

## 4. Status and Steps-Completed

- DESIGN.md: `status: final` ✓ ; `stepsCompleted: [discovery, finalize]` ✓
- EXPERIENCE.md: `status: final` ✓ ; `stepsCompleted: [discovery, finalize]` ✓

Both present and correctly set.

---

## 5. Cross-Reference Syntax (`{path#section}`)

### DESIGN.md → EXPERIENCE.md

| Reference | Format | Target valid? |
|---|---|---|
| `{EXPERIENCE.md#voice-and-tone}` | ✓ | matches EXPERIENCE.md §"Voice and Tone" (slugified) |
| `{EXPERIENCE.md#key-flows}` | ✓ | matches §"Key Flows" |
| `{EXPERIENCE.md#state-patterns}` | ✓ | matches §"State Patterns" |
| `{EXPERIENCE.md#accessibility-floor}` | ✓ | matches §"Accessibility Floor" |

Note: prose body also uses the inline form `{EXPERIENCE.md#section}` in the introductory paragraph — consistent with the cross-reference section below.

### EXPERIENCE.md → DESIGN.md

| Reference | Format | Target valid? |
|---|---|---|
| `{DESIGN.md#brand-and-style}` | ✓ | matches §"Brand & Style" |
| `{DESIGN.md#typography}` | ✓ | matches §"Typography" |
| `{DESIGN.md#components}` | ✓ | matches §"Components" |
| `{DESIGN.md#colors}` | ✓ | matches §"Colors" |
| `{DESIGN.md}` (whole-file pointer) | ✓ | acceptable |
| `{EXPERIENCE.md#accessibility-floor}` (self-pointer) | ✓ | valid internal cross-ref |
| `{EXPERIENCE.md#voice-and-tone#message-string-structure-ramesh-channel}` | ✓ | nested anchor — well-formed but unusual; resolves to "Message string structure (Ramesh-channel)" sub-section under Voice and Tone |
| `{DESIGN.md#components#message-template}` | ✓ | nested anchor — resolves to "Message template" component under Components |

**Verdict:** All `{path#section}` syntax well-formed. Nested anchors (`section#subsection`) used twice; both resolve to real headings. No broken or malformed references detected.

---

## 6. Cross-References to Upstream Artifacts

### DESIGN.md sources
- `../../../specs/spec-surakkha-v1/SPEC.md` ✓
- `../../../specs/spec-surakkha-v1/personas.md` ✓
- `../../../specs/spec-surakkha-v1/architecture-invariants.md` ✓
- `../../../specs/spec-surakkha-v1/escalation-policy.md` ✓
- `../../../planning-artifacts/epics-backend.md` ✓

Path depth: `ux-designs/ux-Surakkha-2026-09-06/` → 3 levels up to repo root. `specs/spec-surakkha-v1/` and `planning-artifacts/` are sibling directories of `ux-designs/`. Path resolution consistent.

### EXPERIENCE.md sources
- `../../../specs/spec-surakkha-v1/SPEC.md` ✓
- `../../../specs/spec-surakkha-v1/personas.md` ✓
- `../../../specs/spec-surakkha-v1/architecture-invariants.md` ✓
- `../../../specs/spec-surakkha-v1/escalation-policy.md` ✓
- `../../../specs/spec-surakkha-v1/playbook-lifecycle.md` ✓
- `../../../planning-artifacts/epics-backend.md` ✓

**Path-consistency check:** DESIGN.md references 5 sources (omits playbook-lifecycle); EXPERIENCE.md references 6 sources (includes playbook-lifecycle). This is correct asymmetry — DESIGN.md is not deeply about playbook lifecycle; EXPERIENCE.md owns flow content that depends on playbook lifecycle. Path prefixes identical (`../../../specs/spec-surakkha-v1/...`, `../../../planning-artifacts/epics-backend.md`).

Cross-reference body in EXPERIENCE.md also references these upstream files with the same `{../../../specs/spec-surakkha-v1/...}` syntax — consistent with frontmatter.

**Verdict:** Upstream cross-references accurate, well-formed, and asymmetric in the right places. No phantom paths.

---

## 7. Sources List Accuracy vs. Content Absorbed

DESIGN.md content draws from:
- SPEC.md (visual identity, brand voice cues) ✓ referenced
- personas.md (Anjali trust-bridge, humane-cue rationale) ✓ referenced
- architecture-invariants.md (color reservation for T3 consumer messaging — drawn from NFR/C-* logic) ✓ referenced
- escalation-policy.md (T3+ threshold) ✓ referenced
- epics-backend.md (component list alignment) ✓ referenced

DESIGN.md does not visibly depend on playbook-lifecycle.md — its omission is correct.

EXPERIENCE.md content draws from all six listed sources — especially playbook-lifecycle.md (Flow 2 depends on `PlaybookVersionPublished`, AD-13 content-addressed version_id, dual-signature rule from C-13 split, AD-11 identical-payload-triple). Correct attribution.

**Verdict:** Sources lists accurately reflect what was absorbed. No phantom sources; no missing sources.

---

## 8. Template-Comment Artifacts

Scanned both files for:
- `<!-- Repeat for ... -->` markers
- `<!-- TODO ... -->` markers
- `<!-- Add more ... -->` placeholders
- Literal `[PLACEHOLDER]` tokens
- Unfilled `{{ }}` template slots

**Verdict:** None detected. Both files are clean of template-comment residue.

---

## 9. Structural Hygiene Summary

| Item | DESIGN.md | EXPERIENCE.md |
|---|---|---|
| Canonical section order | ✓ | ✓ |
| Required frontmatter tokens | ✓ (all 5 present) | ✓ (not required, correctly minimal) |
| Companion pointer | ✓ | ✓ |
| Status = final | ✓ | ✓ |
| stepsCompleted present | ✓ | ✓ |
| Cross-ref syntax correct | ✓ | ✓ |
| Upstream artifact paths accurate | ✓ | ✓ |
| Sources list matches absorbed content | ✓ | ✓ |
| No template-comment artifacts | ✓ | ✓ |

---

## 10. Findings

1. **[low]** DESIGN.md adds a trailing "Cross-references" section after "Do's and Don'ts" — not in the canonical 8-section list. This is a useful appendix, not a violation, but readers expecting strict 8-section spine will see 9. Recommend either (a) leave as-is and document as appendix convention, or (b) fold the cross-references into a single footer block.

2. **[low]** EXPERIENCE.md uses a nested anchor (`{EXPERIENCE.md#voice-and-tone#message-string-structure-ramesh-channel}`) once and (`{DESIGN.md#components#message-template}`) once. Both resolve, but downstream tooling that expects only single-level `#section` may break. If tooling is strict, consider a single-level anchor.

3. **[low]** Asymmetric source lists (DESIGN.md omits playbook-lifecycle.md; EXPERIENCE.md includes it) is correct and intentional, but the rationale is not documented. A one-line comment in DESIGN.md ("playbook-lifecycle not used by visual identity") would prevent future reviewers from flagging it as an inconsistency.

4. **[low]** Both files end with a "Cross-references" section. This duplicates the cross-reference list already present in the intro paragraph (DESIGN.md) or in the companion pointer (EXPERIENCE.md). Acceptable, but slightly redundant.

No critical, high, or medium findings.

---

## Overall Verdict

**PASS.** Both spines are structurally sound. Canonical section orders preserved, frontmatter complete and well-formed, cross-references accurate and well-formed, sources lists correct, no template residue, status and steps-completed fields correct.

The four low-severity findings are stylistic refinements, not blockers. The spines can be considered final from a structure standpoint.