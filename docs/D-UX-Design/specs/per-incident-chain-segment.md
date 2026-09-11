# Per-incident Chain Segment Viewer — Spec

**File path target:** `web/src/pages/IncidentChainSegmentPage.tsx`
**Source scenario:** [Scenario 06 — Audit chain timeline](../C-UX-Scenarios/06-audit-chain-timeline-cross-cutting.md), Screen 2
**Status:** NEW. Partial existing implementation lives inside `web/src/pages/01-priya/InboxDetail.tsx`'s chain-tab (right rail); this spec extracts the dedicated verification surface into its own page.
**Priority tier:** 1 (load-bearing — Goal 2.1 enforcement surface)

---

## Locked decisions (from Scenario 06)

> Re-stating the 10 locked decisions that govern this page; spec sections below map to them.

1. **Two render modes, one source of truth.** Operator mode (Priya / Adi / Karim) and public mode (Anjali) read the same chain; the mode is a render-layer choice.
2. **Screen 2 = per-incident chain segment.** Full chain segment for a specific `incident_id`, ordered by `seq` ascending.
3. **Single-click independent verification.** Local hash recomputation triggered by one click; pass/fail badge result; no two-click confirm.
4. **Use cases:** A — Priya dispute (30s); B — Adi override audit (60s); C — Anjali public view; D — Anomaly detection.
5. **100% of chain reads logged.** Each view mount writes `ChainRead{actor, incident_id, filter_combo}` once.
6. **Authorization per role:** Priya, Adi, Karim (read-only), Anjali (public), Pia (Phase 2 aggregates).
7. **Chain anomaly surfacing.** Row ⚠️ + top-banner warning; Phase 1 escalates to operator; Phase 2 routes to Pia.
8. **Filter chips are Screen 1 (`AuditLogPage`) only.** This page is read-only linkage back to Screen 1.
9. **Hash recomputation is local + cached.** Cached per `(incident_id, last_known_seq)` for 60s.
10. **Pass/fail badge UX.** Emerald Verified (3s auto-dismiss toast; durable in row metadata) / rose Anomaly (persistent until acknowledged; opens escalation modal).

---

## Cross-scenario linkage

| Scenario | Chain-segment operations used |
|----------|--------------------------------|
| **01 — Priya (triage, verify, assign)** | Reads `IncidentCreated`, `Verified{reasoning}`, `Assigned` for dispute resolution (Use Case A) |
| **02 — Adi (mark resolved, handoff)** | Reads `TrustBandOverridden{reasoning}`, `ProofAccepted`, `IncidentResolvedByAdmin` for override audit (Use Case B) |
| **03 — Anjali (citizen arc)** | Public-mode render — `IncidentCreated`, `VerificationSubmitted`, `TechnicianArrived`, `FixSubmitted`, `CitizenAckAccepted` (Use Case C) |
| **04 — Karim (field lane)** | Read-only lineage of `Assigned{to: karim}`, `TechnicianArrived`, `DiagnosisSubmitted`, `FixSubmitted` (read-only) |
| **05 — Pia (PHA dashboard, Phase 2)** | Drill-to-incident from aggregates; consumes `ChainRead`, `ChainAnomalyDetected` events |
| **06 — Audit chain (this scenario)** | Self — both the per-incident view (Screen 2) and the cross-incident view (Screen 1) |

---

## 1. Purpose

Goal 2 requires the audit chain to be the **proof surface** for every decision. This page is where operators (and Phase 2's Pia) verify that the chain is intact, that every event is attributable to a named actor, and that any aggregate number drills back to its underlying incident.

The page is the load-bearing surface for **Goal 2.1** ("chain verifiable by independent hash recomputation") and **Goal 2.3** ("100% of chain reads logged"). Per Scenario 06's locked decision #3, the verification is one click — no two-click confirm, no captcha, no operator-typed challenge phrase. The act of clicking is operator authorization.

---

## 2. User journeys

### Journey A — Priya incident dispute (30 seconds)

Three months after `IncidentClosed`, Anjali disputes: *"I never reported that."* Priya opens the per-incident chain segment for `inc_01HX...`.

1. Renders vertical timeline. First row: `IncidentCreated{source: web_form, reporter: nid_hash, anchor: true, band: T1, created_at}` — original report's existence on the chain. ✅ verified.
2. Second row: her own `Verified{inc, reasoning: "Two corroborating signals + reporter confirms. Assigning Karim at standard priority.", signals_state, path: A}`. **This is the line that defends her call.** ✅ verified.
3. Clicks the bottom "Independent verification" button → emerald "Verified" badge with checkmark icon appears within 200ms. Toast auto-dismisses after 3s; badge stays in the row metadata column.
4. Shows Anjali the segment. Dispute resolved in 30 seconds. Chain remembered; Priya didn't have to.

### Journey B — Adi override audit (60 seconds)

Pia asks: *"Why did you override T3 to T1 on `inc_01HX...` last week?"* Adi opens the per-incident chain segment.

1. Renders timeline. Locates `TrustBandOverridden{reviewer: adi, from_band: T3, to_band: T1, reason_category: prior_incident_pattern, free_text: "Two similar reports in ward 14 in the past 30 days, both resolved T1. The third match in the cluster is the trigger; not overriding would have missed the pattern."}`.
2. Expands the row → full structured payload as JSON. Copy-to-clipboard on the row's hash anchor.
3. Clicks "Independent verification" → full segment ✅. The override reasoning is in context with the segment's full chain — `IncidentCreated{band: T3}` → `Verified{reasoning}` → override → `Assigned{operator: karim}` → ... → `CitizenAckAccepted` → `IncidentClosed`.
4. Points Pia at the row. Closed in 60 seconds. **The close defends itself.**

### Journey C — Karim field-worker lineage (read-only)

Karim opens his assignment page → drill into a previously-completed incident. Reads his own chain emissions: `Acknowledged{by: karim}`, `TechnicianArrived{by: karim}`, `DiagnosisSubmitted`, `FixSubmitted{parts}`. Read-only — he reviews but cannot edit history. **This is his memory of what he did.** If a `ProofInsufficient` reopen fires, he sees Adi's structured feedback inline at the top of the segment.

### Journey D — Anomaly detection

An operator opens the chain segment. One row shows ⚠️ (recomputed hash ≠ stored hash).

1. Top banner appears: **"Chain anomaly detected on `inc_01HX...` — escalate to Pia."** Persistent across page navigations until acknowledged. `aria-live="polite"`.
2. Operator clicks the ⚠️ row → expected_hash vs actual_hash expansion visible.
3. Operator clicks "Acknowledge" → `ChainAnomalyAcknowledged{actor, incident_id, seq}` event lands on the chain (the acknowledgment itself is on the chain).
4. Operator clicks "Escalate to Pia" → `ChainAnomalyEscalated{actor, incident_id, seq}` event lands; routes to placeholder Phase 2 escalation queue. Phase 1 surfaces the anomaly; Phase 2 holds the queue.

---

## 3. Layout — Operator mode

### 3.1 Top bar
- Incident id (mono, copy-to-clipboard)
- Current trust band pill (T1 / T2 / T3 / Overridden) with icon
- State pill: `OPEN` / `RESOLVED` / `CLOSED` / `REOPENED`
- Close button (returns to `AuditLogPage` for that incident's filtered view)

### 3.2 Top banner (conditional)
Renders only if any row fails verification.
- Amber background (`rose-50` border, amber-600 icon)
- Text: "Chain anomaly detected on `inc_01HX...` — escalate to Pia."
- Actions: "Acknowledge" + "Escalate to Pia" (primary)

### 3.3 Main area — vertical timeline
Chronological order: oldest at top, newest at bottom. `seq` ascending.

**Per-row collapsed (default):**

```
[●]  T1 dot  2026-09-08 07:35  IncidentCreated       [Anjali (reporter)]    "Report received"   │ 01HX...9A  ✅
[●]  T2 dot  2026-09-08 07:45  Verified              [Priya (operator)]     "Two corroborating…"│ 01HX...C2  ✅
[●]  T1 dot  2026-09-08 08:15  Assigned              [Priya → Karim]        "Dispatch at std priority"│ 01HX...F1  ✅
[●]  T3 dot  2026-09-08 08:30  TechnicianArrived     [Karim (technician)]   "On site"            │ 01HX...B4  ✅
```

- **Left rail:** trust-band-coloured dot + event-type icon (per foundation §4.2).
- **Center:** ISO-8601 timestamp with relative-time-on-hover (`text-xs`); event type (`text-sm-medium`); actor name + role badge; one-line summary.
- **Right rail:** hash anchor (mono 12px, truncated to first 8 chars + ellipsis, copy-to-clipboard); ✅ verified / ⚠️ anomaly badge.

**Per-row expanded (click):**
- Full payload as collapsible JSON (`text-sm mono`), syntax-highlighted.
- Copy-to-clipboard for the full payload.
- Per-row "Independent verification" button (single-click, recomputes only that row's hash).
- Expected hash vs actual hash shown inline when ⚠️ is present.

### 3.4 Bottom — full-segment verification
- Primary button: "Independent verification" (recomputes entire chain segment from genesis to last event).
- Progress: "Verifying… (12/30)" with spinner while recomputation runs.
- On pass: button text → "Full chain verified" with timestamp of last verification; emerald badge persists.
- On fail: button text → "Chain anomaly detected — see banner"; opens escalation modal.

---

## 4. Layout — Public mode (Anjali)

Per Scenario 03's locked decisions — same vertical timeline, no JSON, no hashes, no payload, no operator actions.

| Visible | Hidden |
|---------|--------|
| `IncidentCreated` | `Verified`, `Assigned`, `DeferRequested`, `EscalatedToPia`, `HotlineIntakeReceived` |
| `VerificationSubmitted` (Bangla: "যাচাই করা হচ্ছে") | `ProofInsufficient` |
| `AssignedToTechnician` | `TrustBandOverridden` |
| `TechnicianArrived` | `EscalationTriggered` |
| `DiagnosisSubmitted` | All `LoginSucceeded`, all chain-integrity events |
| `FixSubmitted` | All `ChainRead` events (meta-audit never visible to Anjali) |
| `ProofAccepted` | All payloads, all hash anchors, all verification buttons |
| `IncidentResolvedByAdmin` | — |
| `CitizenAckRequested` | — |
| `CitizenAckAccepted` / `CitizenAckRejected` | — |
| `IncidentClosed` | — |
| `IncidentReopened{parent}` (rendered as a branch) | — |

- Plain-language Bangla event descriptions only (per Scenario 03 spec).
- Timestamp in Bangla numerals per `content-language.md`.
- Verified ✅ shown only when the **full chain** verified (not per-row).
- No override, reassign, or escalation actions.
- See Scenario 03 spec for the public timeline rendering details.

---

## 5. Hash recomputation algorithm

This section becomes the basis for `web/src/lib/chain-verify.ts`. Pure function for testability.

### Inputs
- `incident_id: string` (ULID)
- `target_seq?: number` (default = last event's `seq` for the incident)
- `events: ChainEvent[]` (fetched from `GET /api/incidents/:id/chain`, ordered by `seq` ascending)

### Algorithm

```
function verifyChainSegment(incident_id, target_seq, events):
  if events.length == 0:
    return { status: 'empty', recomputed: null }
  
  prev_hash = GENESIS_HASH  // tenant-specific genesis
  recomputed_hashes = []
  
  for event in events (ordered by seq ascending):
    if event.seq > target_seq:
      break
    
    // Hash input: prev_hash || seq || actor || event_type || payload || timestamp
    input = prev_hash || '|' || event.seq || '|' || event.actor || '|' || event.event_type || '|' || JSON.stringify(event.payload) || '|' || event.timestamp
    
    expected_hash = sha256(input)
    recomputed_hashes.push(expected_hash)
    
    if expected_hash != event.block_hash:
      return {
        status: 'anomaly',
        anomaly_at_seq: event.seq,
        expected_hash,
        actual_hash: event.block_hash,
        recomputed_hashes,
      }
    
    prev_hash = event.block_hash
  
  return { status: 'verified', final_hash: prev_hash, recomputed_hashes }
```

### Performance budget
- <200ms for chains up to 50 events.
- Show "Verifying…" spinner with progress (`current/total`).
- For chains >50 events, paginate or use a Web Worker (Phase 2).

### Cache
- Key: `(incident_id, target_seq, last_event_hash)`.
- TTL: 60 seconds.
- Storage: in-memory `Map` (page-scoped); clears on unmount.
- Cache miss → recompute; cache hit → return cached result instantly.

### Chain event emitted
- On verification request: `VerificationRequested{actor, incident_id, scope: 'segment' | 'single_row', requested_at}`.
- On anomaly: `ChainAnomalyDetected{incident_id, row_seq, expected_hash, actual_hash, actor_requested, detected_at}`.

---

## 6. Anomaly handling

| Element | Behaviour |
|---------|-----------|
| **Affected row** | Background shifts to amber warning tint. ⚠️ badge replaces ✅. Tap shows both hashes inline. |
| **Other rows** | Pass badge ✅ unchanged. An anomaly on one row does not invalidate other rows. |
| **Top banner** | Persistent amber banner at top of page: **"Chain anomaly detected on `inc_01HX...` — escalate to Pia."** Dismissable but persistent across page navigations until acknowledged. |
| **TopChrome pulse-dot** | Shifts from green → amber. Tapping opens the shared `ChainIntegritySheet`. |
| **Chain event** | `ChainAnomalyDetected` lands on the chain (see §5). |

### Acknowledge / escalate actions
- **Acknowledge** → logs `ChainAnomalyAcknowledged{actor, incident_id, seq}`. The acknowledgment itself is on the chain (the audit log is part of the audit trail).
- **Escalate to Pia** → logs `ChainAnomalyEscalated{actor, incident_id, seq}`. Routes to placeholder Phase 2 escalation queue. Phase 1 surfaces; Phase 2 holds the queue.

---

## 7. Authorization enforcement

| Role | Authorization |
|------|---------------|
| **Priya** | `incident_id` in her inbox (verified/assigned by her) + all segments in her wards for handover context |
| **Adi** | `incident_id` in her queue (overrides/proofs/escalations/formerly-citizen-ack) + per-incident drill-down from any operator surface |
| **Karim** | `incident_id` he has been assigned (read-only on his own chain emissions) |
| **Anjali** | Only her own `incident_id`s; public mode render only |
| **Pia (Phase 2)** | Aggregates + drill-to-incident on demand |

### Enforcement
- Page checks `useAppLayout().session.role` + `incident_id` visibility at mount.
- Unauthorised access → 403 page with explanation ("You don't have access to this incident's chain segment").
- Anjali's authorization is enforced at the route level: only her own `incident_id`s are reachable via URL.
- Unauthorised access attempts log `UnauthorizedSegmentAccessAttempted{actor, incident_id, authorization_basis}` per Goal 2.3.

---

## 8. State mapping

| Page state | What renders |
|------------|--------------|
| **Loading** | Skeleton with 5 row placeholders (animated pulse per foundation §8) |
| **Empty (no events)** | "No events yet. This incident was created but no chain events have been emitted." (defensive; shouldn't happen) |
| **Loaded, all verified** | Standard view; bottom button shows "Full chain verified" with timestamp |
| **Loaded, one row anomalous** | Anomaly banner + ⚠️ on the row + escalation affordances |
| **Loaded, unauthorized** | 403 page with role-appropriate explanation |
| **Loaded, public mode** | Per §4 — motion-only projection; no JSON, no hashes, no payloads |

---

## 9. Wireframes (ASCII)

### 9.1 Operator mode — all verified

```
+----------------------------------------------------------------------+
| < Back   inc_01HX...9A2F    [T1 Anchor]    [RESOLVED]      [✕ Close]  |
+----------------------------------------------------------------------+
|                                                                      |
|  Full chain segment — 8 events                                       |
|                                                                      |
|  ●─ 2026-09-08 07:35   IncidentCreated                                |
|  │  Anjali (reporter, anchor)                                         |
|  │  "Report received"                                                |
|  │                                            │ 01HX...9A   ✅        |
|                                                                      |
|  ●─ 2026-09-08 07:45   Verified                                       |
|  │  Priya (operator)                                                 |
|  │  "Two corroborating signals + reporter confirms."                 |
|  │                                            │ 01HX...C2   ✅        |
|                                                                      |
|  ●─ 2026-09-08 08:15   Assigned                                       |
|  │  Priya → Karim (technician)                                       |
|  │  "Dispatch at standard priority"                                  |
|  │                                            │ 01HX...F1   ✅        |
|                                                                      |
|  ●─ 2026-09-08 08:30   TechnicianArrived                              |
|  │  Karim (technician)                                               |
|  │  "On site"                                                        |
|  │                                            │ 01HX...B4   ✅        |
|                                                                      |
|  ●─ ... (4 more rows)                                                 |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  [ ✓ Independent verification ]    Full chain verified 09:42:11 UTC  |
|                                                                      |
+----------------------------------------------------------------------+
```

### 9.2 Operator mode — anomaly detected

```
+----------------------------------------------------------------------+
| < Back   inc_01HX...9A2F    [T1 Anchor]    [RESOLVED]      [✕ Close]  |
+----------------------------------------------------------------------+
| ⚠ Chain anomaly detected on inc_01HX...9A2F — escalate to Pia.       |
|   [Acknowledge]  [Escalate to Pia]                                    |
+----------------------------------------------------------------------+
|                                                                      |
|  ●─ 2026-09-08 07:35   IncidentCreated                                |
|  │  Anjali (reporter, anchor)                                         |
|  │  "Report received"                                                |
|  │                                            │ 01HX...9A   ✅        |
|                                                                      |
|  ●─ 2026-09-08 07:45   Verified                                       |
|  │  Priya (operator)                                                 |
|  │  "Two corroborating signals + reporter confirms."                 |
|  │                                            │ 01HX...C2   ⚠️       |  <-- amber tint row
|  │     expected: 01HX...C2                                            |
|  │     actual:   01HX...EE  (hash mismatch)                          |
|                                                                      |
|  ●─ 2026-09-08 08:15   Assigned                                       |
|  │  Priya → Karim (technician)                                       |
|  │  "Dispatch at standard priority"                                  |
|  │                                            │ 01HX...F1   ✅        |
|                                                                      |
+----------------------------------------------------------------------+
|                                                                      |
|  [ ✓ Independent verification ]    Chain anomaly — see banner        |
|                                                                      |
+----------------------------------------------------------------------+
```

### 9.3 Public mode (Anjali)

```
+----------------------------------------------------------------------+
| My Report · 2026-09-08                              [EN | বাংলা]     |
+----------------------------------------------------------------------+
|                                                                      |
|  আজ সকাল ১০:১৫    সমাধান হয়েছে                                       |
|                     পর্যালোচক: অদি                                    |
|                                                                      |
|  আজ সকাল ৯:৪৫     মেরামত যাচাই করা হয়েছে                             |
|                     পর্যালোচক: অদি                                    |
|                                                                      |
|  আজ সকাল ৯:৩০     মেরামত করা হয়েছে                                  |
|                     মাঠ কর্মী: করিম                                   |
|                                                                      |
|  আজ সকাল ৮:৫০     সমস্যা নির্ণয় করা হয়েছে                            |
|                     মাঠ কর্মী: করিম                                   |
|                                                                      |
|  আজ সকাল ৮:৩০     মাঠ কর্মী পৌঁছেছে                                  |
|                     মাঠ কর্মী: করিম                                   |
|                                                                      |
|  আজ সকাল ৮:১৫     মাঠ কর্মী পাঠানো হচ্ছে                              |
|                     পরিচালক: প্রিয়া                                   |
|                                                                      |
|  আজ সকাল ৭:৪৫     যাচাই করা হচ্ছে                                    |
|                     পরিচালক: প্রিয়া                                   |
|                                                                      |
|  আজ সকাল ৭:৩৫     রিপোর্ট গ্রহণ করা হয়েছে                             |
|                                                                      |
|                              ✅ Full chain verified                  |
|                                                                      |
+----------------------------------------------------------------------+
```

---

## 10. Empty / loading / error states

| State | Render |
|-------|--------|
| **Loading** | 5 skeleton row placeholders, animated pulse (foundation §8). Top bar shows incident id immediately when known. |
| **Empty (no events)** | Centered empty-state illustration + "No events yet. This incident was created but no chain events have been emitted." + contact-link to escalate if unexpected. |
| **Unauthorized (403)** | Full-page 403 with explanation: "You don't have access to this incident's chain segment." + role-appropriate guidance (e.g., "Anjali can only see her own reports"). |
| **Fetch error** | Centered error card: "Could not load chain segment." + retry button. Logs `ChainReadFailed{actor, incident_id, error}` for debugging. |
| **Partial render (one row fetch failed)** | Render available rows + inline error chip on the failed row: "Could not load this event." + retry button on that row. |

---

## 11. i18n key surface

Namespaces:

- `chain.operator.*` — labels, button text, banners, badges, JSON copy actions (English + Bengali + Hindi)
- `chain.public.*` — plain-language event descriptions (Bengali primary, English fallback, Hindi per locale)
- `chain.anomaly.*` — anomaly banner text, escalation copy, acknowledgment confirmation

Key strings (English baseline):

| Key | Value |
|-----|-------|
| `chain.operator.title` | "Full chain segment — {count} events" |
| `chain.operator.verify.button` | "Independent verification" |
| `chain.operator.verify.verifying` | "Verifying… ({current}/{total})" |
| `chain.operator.verify.passed` | "Full chain verified {timestamp}" |
| `chain.operator.verify.failed` | "Chain anomaly — see banner" |
| `chain.operator.badge.verified` | "Verified" |
| `chain.operator.badge.anomaly` | "Anomaly" |
| `chain.operator.row.expand` | "Expand payload" |
| `chain.operator.row.copy` | "Copy hash" |
| `chain.operator.anomaly.banner` | "Chain anomaly detected on {incident_id} — escalate to Pia." |
| `chain.operator.anomaly.acknowledge` | "Acknowledge" |
| `chain.operator.anomaly.escalate` | "Escalate to Pia" |
| `chain.public.event.IncidentCreated` | "Report received" (Bangla: "রিপোর্ট গ্রহণ করা হয়েছে") |
| `chain.public.event.VerificationSubmitted` | "Being verified" (Bangla: "যাচাই করা হচ্ছে") |
| `chain.public.event.TechnicianArrived` | "Field worker arrived" (Bangla: "মাঠ কর্মী পৌঁছেছে") |
| `chain.public.event.FixSubmitted` | "Repair completed" (Bangla: "মেরামত করা হয়েছে") |
| `chain.public.event.CitizenAckAccepted` | "Confirmed by reporter" (Bangla: "রিপোর্টার নিশ্চিত করেছেন") |
| `chain.public.event.IncidentClosed` | "Closed" (Bangla: "বন্ধ করা হয়েছে") |
| `chain.public.verified` | "Full chain verified" |
| `chain.empty.noEvents` | "No events yet. This incident was created but no chain events have been emitted." |
| `chain.unauthorized.title` | "You don't have access to this incident's chain segment." |

Hash anchors and chain event type names are **not translated** — they are technical identifiers per foundation §10.

---

## 12. Accessibility notes

- **Keyboard nav** (operator mode):
  - `j` / `k` — move down / up through events
  - `Enter` — expand / collapse focused row payload
  - `v` — trigger single-click verification on focused row
  - `a` — acknowledge anomaly on focused row (only when ⚠️ present)
  - `e` — escalate to Pia (only when ⚠️ present)
  - `Tab` — standard tab order for buttons
- **`aria-live="polite"`** on the anomaly banner — announces when anomaly surfaces.
- **`aria-live="polite"`** on the verification result toast (operator mode).
- **High-contrast** verified/anomaly badges — emerald-600 / rose-600 on white with border (meets WCAG AA+).
- **Focus rings** — 2px emerald-600 ring, 2px offset per foundation §9.
- **Screen reader** — each event row has `aria-label` with full context: timestamp, event type, actor name + role, hash anchor.
- **Reduced motion** — per foundation §8, replace animations with instant state changes for `prefers-reduced-motion`.
- **No colour-only signalling** — every badge pairs colour with text + icon per foundation §1.1.

---

## 13. Implementation notes

- **Component location:** `web/src/pages/IncidentChainSegmentPage.tsx`.
- **Reuses existing primitives:** `Card`, `Button`, `Badge`, `Modal` from `web/src/components/ui/`.
- **Custom subcomponents:**
  - `ChainEventRow` — collapsed + expanded row states
  - `HashAnchor` — mono hash chip with copy-to-clipboard
  - `VerificationButton` — single-click verification trigger + progress
  - `AnomalyBanner` — top banner with acknowledge/escalate actions
  - `AnomalyModal` — escalation modal (opened from banner)
- **Hash recomputation:** `web/src/lib/chain-verify.ts` (new util, pure function, exported for unit testing).
- **Data source:** `GET /api/incidents/:id/chain` returns `ChainEvent[]` ordered by `seq`.
- **Chain read logging:** fires `ChainRead{actor, incident_id, filter_combo: {incident_id}}` once per page mount (not per row expand, per Scenario 06 locked decision #5).
- **Anomaly logging:** fires `ChainAnomalyDetected` on detection; `ChainAnomalyAcknowledged` on acknowledge; `ChainAnomalyEscalated` on escalate. Per Scenario 06 §"Anomaly surfacing".
- **Three-column operator surface placement:** this page is the **right rail** of `InboxDetail` extracted to its own route. URL pattern: `/incidents/:incident_id/chain`. The right rail of `InboxDetail` becomes a mini-preview that links to this full page.
- **Public mode route:** `/my-reports/:incident_id/timeline` (same data, public-mode render layer).
- **No new component primitives.** Per foundation §7, new visual patterns compose from existing primitives.

---

## 14. Test scenarios

1. **Priya opens incident `inc_01HX...`, clicks "Independent verification" → emerald Verified badge within 200ms.** Verifies the verification button triggers recomputation and surfaces a pass result quickly enough for the 30s dispute-resolution use case.
2. **Adi opens incident, expands `TrustBandOverridden` row → full JSON payload visible.** Verifies the JSON expansion, copy-to-clipboard, and that override reasoning is rendered in context.
3. **Anjali opens her own incident → public mode renders, no JSON, no hashes, no payloads.** Verifies the operator-vs-public render split is enforced at the data layer (not just CSS hidden).
4. **Operator opens incident with anomaly → top banner + ⚠️ on the row.** Verifies anomaly detection surfaces per Scenario 06 locked decision #7.
5. **Operator clicks "Acknowledge" on anomaly → `ChainAnomalyAcknowledged` event added to chain.** Verifies the acknowledgment is itself on the chain (meta-audit principle).
6. **Operator opens unauthorized incident → 403.** Verifies the authorization model per §7 — e.g., Karim tries to open an incident assigned to another technician.
7. **Karim opens his own assignment → read-only lineage visible.** Verifies Karim's read-only mode renders his own `Acknowledged` / `TechnicianArrived` / `FixSubmitted` events with no edit affordances.
8. **Operator triggers per-row verification → only that row's hash recomputed.** Verifies the per-row verification path (§3.3) works independently of full-segment verification.
9. **Cache hit on second verification within 60s → instant result.** Verifies the `(incident_id, target_seq, last_event_hash)` cache per §5.
10. **`ChainRead` event fires exactly once per mount, not per row expand.** Verifies meta-audit emission discipline per Scenario 06 locked decision #5.

---

## 15. Cross-scenario linkage (detail)

| Scenario | Chain-segment operations |
|----------|--------------------------|
| **01 — Priya** | Reads `IncidentCreated`, `Verified{reasoning, signals_state, path}`, `Assigned{operator, due_at}` on the segment for Use Case A (dispute resolution). Also drills from `InboxDetail` right rail to full page. |
| **02 — Adi** | Reads `TrustBandOverridden{reviewer, from_band, to_band, reason_category, free_text}`, `ProofAccepted{reviewer}`, `CitizenAckRequested`, `IncidentResolvedByAdmin` for Use Case B (override audit). |
| **03 — Anjali** | Public-mode projection — only motion-only events visible per Scenario 03 locked decisions. Hash anchors hidden; ✅ shown only on full-chain verified state. |
| **04 — Karim** | Read-only lineage of `Acknowledged{by: karim}`, `TechnicianArrived{by: karim}`, `DiagnosisSubmitted`, `FixSubmitted{parts}`. If `ProofInsufficient` reopens, sees Adi's structured feedback inline. |
| **05 — Pia (Phase 2)** | Drill-to-incident from aggregates (Shape 1 trust-band distribution; Shape 2 resolution-ack divergence; Shape 3 SLA compliance). Consumes `ChainRead`, `ChainAnomalyDetected`, `ChainAnomalyAcknowledged` events from this surface. |
| **06 — Audit chain** | Self — this is Scenario 06 Screen 2. Screen 1 (`AuditLogPage`) links here via incident id. Filter chips live on Screen 1; Screen 2 is per-incident read-only linkage back. |

---

## 16. Open questions (deferred from Scenario 06)

1. **Web Worker for chains >50 events.** The §5 algorithm runs synchronously in the page. For incident histories that grow beyond 50 events (e.g., multi-reopen arcs), should we move recomputation to a Web Worker to keep the main thread responsive? Phase 2 candidate.
2. **Cross-tenant chain export.** Scenario 06 references "shares the segment with Pia via the per-incident chain export (URL with HMAC + per-tenant boundary; out of scope for UI design here but flagged for Phase 4)." — this page exposes a "Share with Pia" button that is a placeholder until the export format is locked.
3. **Phase 2 PHA dashboard integration.** When Phase 2 ships, this page becomes the drill-down target for Pia's aggregates. URL stability across phases is required (no URL breaking changes).
4. **Hash anchor truncation.** Right-rail shows first 8 chars + ellipsis (e.g., `01HX...9A`). Full hash is in the expanded view. Confirm 8 chars is sufficient for at-a-glance identification; may need to be 12.
5. **Anomaly escalation queue (Phase 2 placeholder).** Phase 1 logs `ChainAnomalyEscalated` but routes to a local log file. Phase 2 owns the queue UI. Confirm the Phase 1 log-only behaviour is acceptable for the demo bar.
6. **i18n locale for hash anchors and event type names.** Per foundation §10, these are not translated. Confirm with the team that this is acceptable for Bengali-first citizens (technical identifiers stay in English).
7. **Cache invalidation on new event.** If a new chain event arrives while the page is open (5s chain-freshness poll), the cached verification result may be stale. Confirm: invalidate cache on new event arrival, or rely on the user re-clicking verification.

---

_Spec produced by Saga/Freya — 2026-09-11_
_Source: Scenario 06 Screen 2 — Audit chain timeline (cross-cutting)_
_Foundation reference: docs/D-UX-Design/01-design-system-foundation.md §1.1 (trust-band palette), §3.2 (three-column operator surface), §4.2 (chain event icons), §8 (motion), §9 (accessibility)_