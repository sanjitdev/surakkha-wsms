# wireframes/

WDS-spec folder for page wireframes.

## Convention deviation (Surakkha)

WDS `agents/wireframe.md` specifies the wireframe pair
`[page-slug].excalidraw` + `[page-slug].png`. Surakkha instead uses a
**Mermaid + render** workflow, for these reasons:

1. **Code-as-mockup is the Phase 4 ground truth.** Per
   `docs/D-UX-Design/00-phase-4-plan.md` §2, we ship React ports directly
   rather than sealed Excalidraw mocks. Mermaid is a single text format
   that diffs cleanly in git.
2. **Mermaid is already approved.** Lockdown §4 (Hand-rolled shadcn) names
   Mermaid for diagrams; we extend that approval to wireframes here.
3. **Two diagrams per page, not one.** A **layout flowchart** (zones) plus
   a **sequence/state diagram** (interactions) gives both spatial and
   temporal coverage; Excalidraw typically mixes them into one drawing.
4. **Toolchain is already installed.** `@mermaid-js/mermaid-cli` (mmdc
   11.x) renders headlessly. No Excalidraw GUI dependency.

## File format

Each Tier 1 page gets a **pair**:

| File | Purpose | Rendered to |
|---|---|---|
| `[page-slug]-layout.mmd` | `flowchart` of zones (header, body, footer, drawer) | `[page-slug]-layout.svg` + `.png` |
| `[page-slug]-interaction.mmd` | `sequenceDiagram` or `stateDiagram-v2` of user flows | `[page-slug]-interaction.svg` + `.png` |

The `.mmd` source is committed (text diffs cleanly). The `.svg` is the
reviewable vector; the `.png` is the embeddable raster. Re-render with:

```bash
mmdc -i [page-slug]-layout.mmd        -o [page-slug]-layout.svg        -t neutral -b white
mmdc -i [page-slug]-layout.mmd        -o [page-slug]-layout.png        -t neutral -b white -w 1600
mmdc -i [page-slug]-interaction.mmd   -o [page-slug]-interaction.svg   -t neutral -b white
mmdc -i [page-slug]-interaction.mmd   -o [page-slug]-interaction.png   -t neutral -b white -w 1600
```

## Current contents

Tier 1 gap screens (3 pages, all `status="planned"`, ready for Phase 5 build):

| Page spec | Layout | Interaction |
|---|---|---|
| `../citizen-status-timeline.md` | `citizen-status-timeline-layout.{mmd,svg,png}` | `citizen-status-timeline-interaction.{mmd,svg,png}` |
| `../hotline-intake-modal.md` | `hotline-intake-modal-layout.{mmd,svg,png}` | `hotline-intake-modal-interaction.{mmd,svg,png}` |
| `../per-incident-chain-segment.md` | `per-incident-chain-segment-layout.{mmd,svg,png}` | `per-incident-chain-segment-interaction.{mmd,svg,png}` |

Tier 2 and Tier 3 specs reference existing React ports in `web/` — no
wireframes are needed because the source code IS the wireframe.

## Source of truth

The `.md` spec in the parent `D-UX-Design/` folder is canonical. Mermaid
wireframes are visual aids for review and handoff; if they ever drift from
the spec, the spec wins. Re-render after any spec edit that changes zones
or interaction flows.
