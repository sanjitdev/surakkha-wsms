# Prose Review — Surakkha v1 UX Spines

Reviewer lens: lean prose, no decoration, consistent terminology, demonstrative voice/tone sections, table-vs-bullet discipline, inline anchor cross-references.

Verdict: **PASS WITH CONCERNS**. Spines are unusually disciplined for design docs — declarative, source-anchored, persona-bound. A small set of medium-severity prose and structural issues remain.

---

## DESIGN.md

### Strengths

- **Front-matter carries the whole spine's contract.** Rationale strings on each color/typography token (e.g., `accent-amber` "calibrated warning; NOT a danger signal; used for acute-class indicators") are tight and load-bearing — they justify the token in the same line that defines it. No decoration.
- **Tables used where structure helps.** Colors, Typography, Elevation, Shapes all deliver in tables; bullets reserved for the Do/Don't list. This is the right discipline.
- **Cross-references use anchor syntax** (`{EXPERIENCE.md#voice-and-tone}`), never prose. Clean.
- **Color rule and Shape rule** are stated as one-line normative constraints immediately after the table that defines them — no duplication.
- **"Do not switch to `0px` corners for 'operational density'"** — sharp, evocative, on-brand. No hedging.

### Concerns

- **Lead paragraph (Brand & Style, line 149) is the longest sentence in the spine.** "Rounded corners carry the humane-trust-bridge cue — sharp corners read as corporate-formal and undercut the persona wins the three-UIs-as-separate-products architecture is built to deliver." This is a *relative clause whose relative clause has a relative clause*. Reads as throat-clearing back-formation; the same claim lands in 8 words as "Sharp corners undercut the trust-bridge cue Anjali relies on." **Severity: medium.**
- **Elevation rule paragraph** (line 199) — "elevation follows cognitive load, not visual hierarchy alone. An incident row on Priya-desktop does not need elevation beyond `card`; it needs scan-ability." The second sentence is good. The first is a marketing-sounding abstraction. The rule is implicit in the table above. **Severity: low.**
- **Two near-duplicate phrasings of the rounded-corners rule.** Appears in front-matter `rounded.rationale`, in the Brand & Style paragraph (line 149), and in the Shape rule (line 208). The repetition is not load-bearing — pick one location, link the rest. **Severity: low.**
- **Front-matter duplicates content that the body also states** (e.g., color rationale strings appear in YAML and again as plain text in line 149 and Color section). This is fine for a single-document spine but the YAML rationale strings are richer than the body prose, inverting the usual pattern. No fix needed; flagging as observation. **Severity: low.**

---

## EXPERIENCE.md

### Strengths

- **Foundation table is exemplary.** Six columns, persona-anchored, includes "outputs" and "core jobs" — a design doc rarely lands the jobs column in one row. Every cell earns its place.
- **Voice & tone is demonstrative, not abstract.** Each register (Anjali-mobile, Priya-desktop, PHA-pane, Ramesh-channel) shows actual microcopy alongside its register description. The contrast pair "Your report reached Priya. Thank you." vs "Submission accepted at 14:03." does the work of a page of rules.
- **Consistent terminology across the spine.** "incident", "report", "playbook", "version-of-record", "chain", "PHA", "tier", "fusion score" — used identically from section 1 to the end. No drift.
- **State Patterns section is exemplary.** Each state (empty / loading / error / offline / deviation) gives concrete copy strings, not abstract rules. The `CommandRejected{reason: "..."}` typed-rejection list is the right level of specificity.
- **Key Flows use named sessions, real times, chain events.** Each step names a chain event (`IncidentEscalated`, `PlaybookVersionPublished`, `SignatureAttestation`). No narrative filler.
- **Anchor cross-references throughout** (`{DESIGN.md#brand-and-style}`, `{EXPERIENCE.md#accessibility-floor}`). Used inline, not duplicated as prose.
- **The "Maybe a playbook amendment" line (Flow 1, step 18)** is the only hedge word in 380+ lines. It works because it's *narrative inside a flow*, not editorializing in a rule.

### Concerns

- **Section opener on line 24 mixes a sentence with a long parenthetical.** "Surakkha v1 ships **four product surfaces** to **three named personas** (Anjali, Priya, Dr. Mensah) plus the consumer (Ramesh), where the consumer surface is invisible infrastructure — there is no app to install, no dashboard to log into; the WhatsApp and SMS threads *are* the product for Ramesh." Two clauses ("plus the consumer…" and "where the consumer surface is invisible infrastructure…") could split into a sentence + one sentence of elaboration. **Severity: medium.**
- **"persona wins" terminology used in DESIGN.md (line 149) but not in EXPERIENCE.md.** EXPERIENCE.md says "win condition" (Surface closure check, lines 95–98). Same concept, two words. Pick one across both spines. **Severity: medium.**
- **"trust-bridge" used four times in DESIGN.md and twice in EXPERIENCE.md** without a one-line definition anywhere. It's the spine's load-bearing metaphor; first use should land a definition or a gloss. **Severity: medium.**
- **Flow 1 step 18 — "Maybe a playbook amendment"** is the only place where the prose slips into hedge-language. Acceptable in a narrative flow but inconsistent with the spine's "no hedging" discipline. Either commit ("a playbook amendment is queued") or accept and document the exception. **Severity: low.**
- **Ramesh-channel section repeats microcopy-rules material** that the Message string structure table already encodes (e.g., footer line is "uniform", "no free composition", "the chain fills the slots"). The repetition is small but the table is already complete. **Severity: low.**
- **Heading "Anjali-mobile register / Priya-desktop register / PHA-pane register / Ramesh-channel register"** uses "register" four times — good. But the labels "warm, direct, second-person" / "plain, workmanlike, third-person" / "institutional, third-person, audit-precise" / "friendlier, more-direct, second-person, imperative for the action" mix descriptive adjectives with grammatical-person labels. The grammatical labels (second/third-person) carry the load; the adjectives can drift over time. Consider standardizing the adjective form too. **Severity: low.**
- **EXPERIENCE.md header line 18 has an em-dash that's slightly long** ("How it works. EXPERIENCE.md governs copy, state, interaction, accessibility behavior, and named-protagonist key flows.") — four sentences in the header. Could be two. **Severity: low.**

---

## Cross-cutting

- **Terminology drift: "win condition" vs "persona win".** Use one. Recommend **"win condition"** — already established in EXPERIENCE.md §Surface closure check.
- **Anchor syntax is consistent and correctly formatted** in both spines. No findings.
- **Voice consistency across surfaces — demonstrated, not declared.** Both spines show microcopy for each register. This is the strongest part of the prose discipline.
- **Tables vs bullets — appropriately applied.** Tables used for: foundation surfaces, colors, typography, message shapes, button states. Bullets used for: component behavioral rules, voice rules, flow steps. The discipline holds.
- **Hedge-word audit:** Only one occurrence ("Maybe", Flow 1 step 18). All other prose is declarative.
- **Throat-clearing audit:** The opening sentences of both spines *are* the throat — they earn their length by stating the spine's contract. The only real throat-clearing is the relative-clause chain in DESIGN.md line 149.

---

## Top findings (for summary)

1. **DESIGN.md line 149 — over-nested relative clause** in Brand & Style lead. **Medium.** Tighten from ~40 words to ~12.
2. **"persona win" vs "win condition" terminology drift across spines.** **Medium.** Standardize on "win condition".
3. **"trust-bridge" used as load-bearing metaphor without a one-line definition** in either spine. **Medium.** Add a single-sentence gloss at first use in each.
4. **EXPERIENCE.md Foundation opener (line 24) — packed parenthetical.** **Medium.** Split for clarity; the consumer-as-invisible-infrastructure point deserves its own sentence.
5. **Hedge word "Maybe" in Flow 1 step 18.** **Low.** Replace with a committed verb or document the exception.

## Recommended fixes (small)

- DESIGN.md line 149 → "Sharp corners undercut the trust-bridge cue Anjali relies on."
- EXPERIENCE.md line 24 → split into two sentences; move "where the consumer surface is invisible infrastructure…" to a new sentence.
- Add a one-line gloss at first use of "trust-bridge" in each spine (e.g., "trust-bridge — the cue that earns consumer and operator trust without asking for it").
- Replace "persona win" with "win condition" wherever it appears.
- Flow 1 step 18 → "A playbook amendment is queued" (or leave "Maybe" and document the exception in the voice rules section).
