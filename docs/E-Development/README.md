# E-Development/

WDS Phase 5 home — technical requirements, work orders, and feature PRDs.

Per WDS `wds-glossary.md` and `saga/SKILL.md`:

```
E-Development/
├── 000-tech-audit.md          Tech audit (brownfield). Required before any PRD on existing codebase.
├── 000-PRD.md                 Master PRD. Platform-wide requirements; written once, updated as project evolves.
├── WO-NNN-[slug].md           Work Order. Narrative handoff from Freya → Mimir.
└── NNN-[feature].xml          Feature PRD. One per Work Order; Mimir reads to build.
```

Plus change orders:

```
└── NNN-NN-[slug].xml          Change Order. Feedback/change against a parent PRD.
```

---

## Current state (2026-09-15)

| Slot | File | Status |
|---|---|---|
| `000-tech-audit.md` | ✓ done | ✓ complete 2026-09-15 |
| `000-PRD.md` | ✓ done | ✓ complete 2026-09-15 |
| `WO-001-…` through `WO-017-…` | ✓ done | ✓ complete 2026-09-15 |
| `001-…` through `017-…` feature PRDs | — | ○ pending (Mimir) |

## Naming convention (WDS)

| Type | Pattern | Example |
|---|---|---|
| Tech audit | `000-tech-audit.md` | `E-Development/000-tech-audit.md` |
| Master PRD | `000-PRD.md` | `E-Development/000-PRD.md` |
| Work Order | `WO-NNN-[slug].md` (zero-padded) | `E-Development/WO-001-citizen-status-timeline.md` |
| Feature PRD | `NNN-[feature].xml` (zero-padded) | `E-Development/001-citizen-status-timeline.xml` |
| Change Order | `NNN-NN-[slug].xml` | `E-Development/001-01-fix-band-color.xml` |

## Page → WO → PRD mapping (planned)

| WO | Page (spec) | Tier |
|---|---|---|
| 001 | citizen-status-timeline.md | 1 |
| 002 | hotline-intake-modal.md | 1 |
| 003 | per-incident-chain-segment.md | 1 |
| 004 | operator-dashboard.md | 2 |
| 005 | inbox-detail.md | 2 |
| 006 | field-queue.md | 2 |
| 007 | field-incident-detail.md | 2 |
| 008 | audit-log.md | 2 |
| 009 | inbox-list.md | 3 |
| 010 | inbox-rail.md | 3 |
| 011 | submit-report-page.md | 3 |
| 012 | citizen-ack-page.md | 3 |
| 013 | login-page.md | 3 |
| 014 | settings-page.md | 3 |
| 015 | styleguide-page.md | 3 |
| 016 | coming-soon-page.md | 3 |
| 017 | verify-flow.md | 3 |

---

_Folder created 2026-09-15 (WDS convention cleanup, Stage 2)._
