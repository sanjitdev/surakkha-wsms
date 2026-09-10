# Content & Language — Surakkha v1

2026-09-10

> **Source.** Extracted from project-context §1–§3, §9 lockdown, and the persona surfaces (Anjali, Priya, Admin) in `prd-surakkha-2026-09-06/prd.md` §3 + `personas.md`. Not invented; partial data flagged.

---

## Brand Personality

**Stewardship, not surveillance.** Surakkha is a public-health platform — its voice is the voice of the city health authority, not a tech product. It speaks the way a careful city operator speaks to a citizen who just reported a problem.

**Verifiable, not evasive.** Every claim Surakkha makes is anchored to a chain event that the citizen can verify. The voice must reflect that — concrete, dated, sourced.

**Dignified, not paternalistic.** Citizens are partners, not subjects. Anjali earns status and credential; Priya earns monthly reports; Ramesh gets a clear answer without installing an app. The voice respects that.

**Bangla-first where it matters, English-first where it doesn't.** Anjali-mobile and the admin inbox are Bangla-primary because those are the surfaces where Bangla is the correct operating language. The operator (Priya) UI is English-only in Phase 1 because the operator class is small (1–2 people per city) and tooling precision matters more than language choice there.

---

## Tone of Voice

| Surface | Tone | Notes |
|---|---|---|
| Anjali-mobile submission | Friendly, concrete, low-literacy-aware | "জল নেওয়ার পরীক্ষা করে দেখুন।" — action prompts, not lectures. |
| Citizen ack (✅ / ❌ tap) | Direct, factual | "আপনার রিপোর্টে পানীয় জল ঠিক করা হয়েছে।" — name the action taken. |
| Admin desktop | Professional, evidence-led | "Incident 01ARZ3NDEKTSV4RRFFQ69G5FAV — trust band high — 2 corroborating reports within 400m." |
| Operator desktop (Priya) | Terse, playbook-aligned | Steps reference the playbook ID, deviations capture the reasoning. |
| SMS / WhatsApp template | GSM-7 friendly, 160 char hard cap (EN) / UCS-2 70 char hard cap (BN) | No free composition. Slots come from a pre-approved glossary. |
| Audit browser (read-only) | Forensic, neutral | Each line is a chain event with block hash + actor identity. |

**Never:** paternalistic, marketing-y, or apologetic for delays the chain can explain. The chain is the explanation; the voice just names what the chain shows.

---

## Language Strategy

**Phase 1 locales:** English (`en-GB`) + Bengali (`bn-BD`). Locale persistence via `data-locale` on `<body>`; no per-component branches. Already shipped as `useLocale()` hook + styleguide live-toggle (per CHANGELOG FE-B5d).

**Per-surface language policy:**

| Surface | Primary | Fallback | Notes |
|---|---|---|---|
| Anjali-mobile submission | `bn` | `en` | Bangla primary per FR-4.2 + project-context §2. |
| Admin desktop inbox | `bn` | `en` | Admin is a city operator, Bangla is their working language. |
| Operator desktop (Priya) | `en` | — | Operator UI stays English in Phase 1 (project-context §8 — deferred to Phase 2). |
| Sentinel strip captions / system messages | `bn` | `en` | Matches Anjali. |
| Audit timeline / chain-hash display | `en` | — | Forensic surface, language clarity matters. |
| Citizen SMS / WhatsApp | matches recipient language | — | Slot composition from pre-approved glossary. |

**Glossary discipline (C-11 + project-context §9):** Templates use a `{CLASS}` slot that must be filled from a pre-approved glossary. No free composition. Minimum 3 low-literacy readers per template before any template ships.

---

## SEO Keywords

**Phase 1 has no public SEO surface.** Surakkha v1 is an internal lighthouse deployment — there is no public marketing site, no consumer-facing landing page, no organic-search acquisition channel. SEO keywords are out of scope until Phase 2 fleet contracts, when a public PHA pane + project pitch exist.

**Tracked for Phase 2 (not invented here):**
- "water safety monitoring platform"
- "DHA WASA partnership" / "Bangladesh water utility digital"
- "tamper-evident audit chain for public health"
- "real-time contamination response"

When Phase 2 lands, the SEO strategy lives in a separate doc owned by the sales channel.

---

## Content Structure

**Principle:** Slots, not sentences. Every outbound surface uses a structured template with a fixed number of slots, each slot bound to a pre-approved glossary term. The gateway enforces this at write-time — if the SMS budget (EN ≤ 160, BN ≤ 70) is exceeded, the event is rejected and `BulkSendRejected` is logged to the chain.

**Per-surface content skeletons:**

| Surface | Skeleton | Slot budget |
|---|---|---|
| Anjali submission title | `[action verb] at [location]` | 60 chars (BN) / 120 chars (EN) |
| Anjali submission body | `[observed condition]. [optional photo URL]` | 140 chars (BN) / 280 chars (EN) |
| Citizen acknowledgment | `[CLASS slot]. [decision] at [time]. [next-step slot]` | 70 chars BN / 160 chars EN hard cap |
| Operator handoff brief | `Today's open threads: [N]. [top-ranked incident title]. [playbook id].` | — |
| PHA monthly report | Auto-generated from chain — no free prose. Aggregation only. | 5 sections locked. |

**Operator handoff brief is auto-generated.** It kills the tribal-knowledge dependency at shift change (FR-5.2). The structure is locked; the content is derived from the chain.

**PHA monthly report is auto-generated from the audit trail, not by hand** (FR-5.6, FR-6.6). Five sections, locked: cross-ward aggregates, deviation clusters, threshold edit history, audit-chain integrity, event-type ledger.

---

## Localisation Source-of-Truth

| File | Locale | Owner |
|---|---|---|
| `web/src/i18n/locales/en/common.json` | `en-GB` | FE-1 (shipped) |
| `web/src/i18n/locales/bn/common.json` | `bn-BD` | FE-1 (shipped) |
| `web/src/i18n/locales/en/sms.json` | `en-GB` | SM-2 SMS templates (Phase 2) |
| `web/src/i18n/locales/bn/sms.json` | `bn-BD` | SM-2 SMS templates (Phase 2) |

Both locales must be updated together for any UI copy change (per AGENTS.md §8). Bangla strings are reviewed by at least 3 low-literacy readers before any template ships.
