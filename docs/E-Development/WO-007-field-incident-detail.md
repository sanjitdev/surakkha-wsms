# WO-007 — Field Incident Detail (Karim)

> **Work Order** (Freya → Mimir) per WDS `agents/mimir-brief.md`.
> Phase 5 Stage 5.2 — Tier 2 (load-bearing).
> Date: 2026-09-15

---

## Objective

Reconcile `web/src/pages/FieldIncidentDetailPage.tsx` (601 LOC) — Karim's on-site detail page. Photo capture + EXIF, diagnosis submission (structured: severity / category / tags), fix submission (parts list + photo), proof-of-completion flow.

## Scope

**In:**
- Reconcile `web/src/pages/FieldIncidentDetailPage.tsx` to spec
- Photo capture (camera or gallery) with auto-EXIF strip (lat/lon/timestamp/device) shown but editable
- Diagnosis submission: structured fields (severity / category / tags) per foundation §12 #7
- Fix submission: parts list (add/remove rows) + photo proof
- Proof-of-completion: emits `FixSubmitted{actor: karim, incident_id, parts, photo_hash, diagnosis}`
- Lifecycle actions in order:
  - `Acknowledged` → `TechnicianArrived` (on GPS proximity) → `DiagnosisSubmitted` → `FixSubmitted`
- "Submit proof" button emits single event when all required fields filled
- Show citizen context (location hint, description) read-only
- `due_at` countdown shown in header (if assigned)
- Override surface for `TrustBandOverridden` event in segment

**Out:**
- Voice notes (Phase 1.7+)
- Automatic GPS proximity detection (manual `Arrived` button instead)
- Offline mode (Phase 1.7+ — currently relies on live MSW)

## Parent artifacts

- **Spec:** `docs/D-UX-Design/field-incident-detail.md`
- **Scenario:** `docs/C-UX-Scenarios/04-karim-the-technician-field-lane.md` Screen 2
- **Lockdown:** foundation §4.1, §6.2, §8, §12
- **Master PRD:** `docs/E-Development/000-PRD.md` §3, §13

## Acceptance criteria

1. Page renders at `/field/:incident_id` for `field_technician` ✅
2. Header shows: BandPill, reporter-badge chip, `due_at` countdown, "Mark arrived" button ✅
3. Photo capture: opens camera/gallery picker; auto-populates EXIF (lat/lon/timestamp/device); all editable ✅
4. Diagnosis form: structured (severity / category / tags) — never single textarea ✅
5. Fix form: parts list (add/remove rows) + photo proof (required before submit) ✅
6. `Submit proof` button enabled only when all required fields filled ✅
7. On submit: emits `FixSubmitted{actor, incident_id, parts, photo_hash, diagnosis}` in one transaction ✅
8. Toast confirms "Proof submitted — awaiting review" ✅
9. `TrustBandOverridden` event in segment shows "View override reasoning" affordance ✅
10. Bangla toggle works; preference persists ✅
11. No Hindi strings ✅

## UI rules

- **Area Labels:**
  - `field-incident-detail-page`, `…-header`, `…-main`
  - `field-incident-detail-button-mark-arrived`
  - `field-incident-detail-photo-capture`, `…-exif-strip`, `…-exif-lat`, `…-exif-lon`, `…-exif-timestamp`, `…-exif-device`
  - `field-incident-detail-diagnosis-form`, `…-severity`, `…-category`, `…-tags`
  - `field-incident-detail-fix-form`, `…-parts-list`, `…-parts-row`, `…-add-part`, `…-remove-part`
  - `field-incident-detail-fix-photo`
  - `field-incident-detail-button-submit-proof`
- **Primitives:** `Card`, `Button`, `Input`, `Dropdown`, `Toast`, `Modal` (photo viewer)

## Wire contract

- **Read:** `GET /api/incidents/:id`, `GET /api/events?incident_id=…&limit=50`
- **Emit (arrived):** `POST /api/events` with `TechnicianArrived{actor: karim, incident_id, lat, lon}`
- **Emit (proof):** `POST /api/events` with `FixSubmitted{actor: karim, incident_id, parts, photo_hash, diagnosis}`
- **Photo upload:** `POST /api/photos` (multipart; returns `photo_hash`)

`web/src/mocks/handlers.ts` additions:
- `POST /api/photos` handler (multipart stub)
- Photo fixture in `web/src/mocks/fixtures.ts`

## i18n keys

Add to both `web/src/i18n/locales/en/fieldIncidentDetail.json` and `…/bn/`:

```
"page.title": "Incident detail"
"button.markArrived": "Mark arrived"
"photo.capture": "Capture photo"
"photo.fromGallery": "From gallery"
"exif.label": "Photo metadata"
"diagnosis.severity.label": "Severity"
"diagnosis.category.label": "Category"
"diagnosis.tags.label": "Tags"
"fix.parts.label": "Parts used"
"fix.parts.addRow": "Add part"
"fix.parts.removeRow": "Remove"
"fix.photo.label": "Proof photo"
"fix.photo.required": "Required"
"button.submitProof": "Submit proof"
"toast.proofSubmitted": "Proof submitted — awaiting review"
"dueAt.countdown": "Due in {hours}h {minutes}m"
"override.viewReasoning": "View override reasoning"
```

## Tests required

- **Vitest:** `web/src/__checks__/fe-field-incident-detail-reconcile.test.tsx`
  - Photo capture opens picker; EXIF auto-populated
  - Diagnosis form rejects single textarea (must be structured fields)
  - Fix form: parts list add/remove works
  - Submit disabled until all required fields + photo filled
  - On submit: emits `FixSubmitted` with correct shape
  - `Mark arrived` emits `TechnicianArrived`
  - `due_at` countdown renders correctly
  - Override affordance shows when override event exists
- **Playwright:** extend `web/e2e/happy-path.spec.ts` with field → incident → arrived → diagnose → submit proof round-trip

## Migration debt

- None direct
- Shared `InboxRow.tsx` styling may need `--band-*` → `--color-trust-*` migration (covered in WO-004/WO-005)

## Lockdown compliance

| Decision | Compliance |
|---|---|
| Trust-band × reporter-badge separation | ✅ Both dimensions rendered; reporter-badge shows source (karim never anchors his own work; just renders citizen's badge) |
| Closure confetti removed | ✅ N/A |
| Hindi locale removed | ✅ EN + BN only |
| shadcn/ui adopted | ✅ Uses Card, Button, Input, Dropdown, Toast, Modal |
| Token names kept, hexes replaced | ✅ References `--color-trust-*`, `--color-reporter-*` |

---

_Ready for Mimir's feature PRD authoring (Stage 6)._
