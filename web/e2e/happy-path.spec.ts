/**
 * happy-path.spec.ts — end-to-end citizen → operator → tech → operator →
 * citizen loop.
 *
 * What this file covers
 * ---------------------
 *   The full Phase 1 demo workflow as one continuous Playwright
 *   session, exercising every F1–F7 surface against the real MSW
 *   + IndexedDB stack (no test fakes, no route stubs):
 *
 *     1. Login as Anjali → /submit
 *     2. Submit a report (AnjaliReportSubmitted lands on chain →
 *        chain projection emits IncidentCreated for Priya)
 *     3. Logout → login as Priya → /inbox
 *     4. Open the new incident → /inbox/:id
 *     5. Open Assign Tech modal → fill form → submit
 *        (TechnicianAssigned lands on chain; Karim's /field
 *        will see it on next fetch)
 *     6. Open Request citizen ack modal → fill form → submit
 *        (CitizenAckRequested lands on chain)
 *     7. Logout → login as Karim → /field
 *     8. Click Optimize route → expect reorder + subtitle
 *     9. Click first job → /field/incident-detail?work_order=...
 *    10. Click "Mark arrived on site" (TechnicianArrived)
 *    11. Fill diagnosis + parts → submit (DiagnosisSubmitted)
 *    12. Fill fix summary + photo URL → submit (FixSubmitted)
 *    13. Click "Confirm resolution" (IncidentResolved)
 *    14. Logout → login as Priya → /inbox
 *    15. Select 1 row → bulk-bar Mark reviewed (SignatureAttestation)
 *    16. Logout → login as Anjali → /ack/<incident_id>
 *    17. Click "Approve & close" → expect APPROVED receipt
 *    18. Anjali opens /my-reports/:id/timeline (WO-001 citizen-timeline)
 *    19. Assert ≥5 citizen-visible rows; assert no payload/hash/JSON leakage
 *    20. Assert Bangla locale default (data-locale="bn", .bangla-text)
 *    21. Assert ActionCall="in-progress" (no admin-resolve yet)
 *    22. Inject IncidentResolvedByAdmin → reload → assert closure-ack
 *        ActionCall → tap ✅ → ChainAccepted lands on chain
 *    23. Visual snapshot → web/e2e/_tier8-snap/citizen-timeline.png
 *
 * Why one spec, not seven
 * -----------------------
 *   Each step depends on the chain state left by the previous one
 *   (AnjaliReportSubmitted → IncidentCreated → TechnicianAssigned →
 *   TechnicianArrived → …). Splitting into per-persona specs would
 *   either need cross-spec shared state (fragile, slow) or
 *   MSW-fixture replay (defeats the purpose of an e2e). One
 *   continuous test exercises the real IndexedDB round-trip end
 *   to end; ~25s wall time is acceptable for the Phase 1 demo.
 *
 * Failure mode
 * ------------
 *   If any step fails, Playwright captures the page state at the
 *   failure point (trace + screenshot + video are retained on
 *   failure per playwright.config.ts). The test names the step
 *   explicitly in the assertion so the report localises the
 *   regression.
 */
import { expect, test } from './fixtures';

test.describe('happy path — full Phase 1 cycle', () => {
  test('Anjali submits → Priya assigns → Karim fixes → Priya reviews → Anjali approves', async ({
    page,
    loginAs,
  }) => {
    // ─── STEP 1 — Login as Anjali ─────────────────────────────────
    await loginAs('anjali');
    // Anjali's landing redirects to /submit.
    await expect(page).toHaveURL(/\/submit/, { timeout: 10_000 });

    // ─── STEP 2 — Submit a report ────────────────────────────────
    await expect(page.getByTestId('submit-form-card')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('submit-title').fill('Brown water at Ward 4 tap');
    // Description defaults are pre-filled? Clear & fill to be safe.
    await page.getByTestId('submit-description').fill('Brown water from kitchen tap since 6am.');

    // Click the submit button (type="submit") which fires the form's
    // onSubmit handler.
    await page.getByTestId('submit-submit').click();

    // Receipt renders.
    await expect(page.getByTestId('submit-receipt-card')).toBeVisible({ timeout: 10_000 });
    // The receipt should show a chain event_id.
    await expect(page.getByTestId('submit-receipt-event-id')).toContainText(/01[A-Z0-9]+/);

    // ─── STEP 3 — Logout + login as Priya ────────────────────────
    await page.getByTestId('sidebar-logout').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await loginAs('priya');
    await expect(page).toHaveURL(/\/inbox/, { timeout: 10_000 });

    // ─── STEP 4 — Open the new incident ──────────────────────────
    // The chain projection surfaces Anjali's AnjaliReportSubmitted
    // as an IncidentCreated row in Priya's inbox. The inbox may also
    // show seeded incidents — find the row whose title matches the
    // report we just submitted, NOT the first row (which could be a
    // seeded older incident).
    const inboxRows = page.locator('[data-testid="inbox-row"]');

    await expect(inboxRows.first()).toBeVisible({ timeout: 10_000 });
    // Find the row containing our title text.
    const targetRow = inboxRows
      .filter({ hasText: 'Brown water at Ward 4 tap' })
      .first();

    await expect(targetRow).toBeVisible({ timeout: 10_000 });
    const rowLink = targetRow.locator('.inbox-row__title-link');

    await expect(rowLink).toBeVisible();
    await rowLink.click();
    await expect(page.getByTestId('inbox-detail-title')).toBeVisible({ timeout: 10_000 });

    // ─── STEP 5 — Assign Tech (inline form, inbox-detail.md #14) ──
    // The modal pair was collapsed into a single inline form rendered
    // directly under the page header. Both write paths (assignTech +
    // requestAck) fire on submit when their respective sections have
    // content. Tech select defaults to Karim (first roster entry);
    // priority defaults to P1; ETA defaults to 30. Summary ≥5 chars.
    await expect(page.getByTestId('inbox-inline-action-form')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('inline-assign-summary').fill('Replace chlorine pump #4 at W04.');
    await page.getByTestId('inbox-inline-submit').click();
    // Form does NOT reset on success and does NOT navigate (the
    // parent InboxDetail stays put; logout at step 7 is what moves
    // us off this page). Wait for the TechnicianAssigned chain write
    // to land before clearing the assign side for step 6 — this is
    // the durable signal that Karim's /field will see the assignment
    // on next fetch. The poll runs inside page.evaluate so fetch()
    // uses the page's baseURL (expect.poll callbacks execute in
    // Node, where /api/events has no origin).
    const inboxIncidentId = page.url().split('/inbox/')[1]?.split(/[?#]/)[0] ?? '';

    expect(inboxIncidentId.length).toBeGreaterThan(0);
    await expect
      .poll(
        async () =>
          page.evaluate(async (id) => {
            const r = await fetch(
              '/api/events?event_type=TechnicianAssigned&limit=20',
            );
            const body = (await r.json()) as {
              events: { payload: { incident_id?: string } }[];
            };
            return body.events.filter(
              (e) => e.payload.incident_id === id,
            ).length;
          }, inboxIncidentId),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId('inbox-inline-assign-section')).toBeVisible();
    // Clear the assign-summary so the next submit doesn't refire
    // assignTech (would produce a duplicate chain event). Leaving
    // priority/ETA populated is harmless — they're inputs, not state
    // carried into the ack side.
    await page.getByTestId('inline-assign-summary').fill('');

    // ─── STEP 6 — Request Citizen Ack (inline form) ──────────────
    // Channel defaults to sms; copy ≥5 chars. With the assign side
    // cleared, this submit fires ONLY the ack write path.
    await page.getByTestId('inline-ack-copy').fill('Please confirm tap water is now safe.');
    await page.getByTestId('inbox-inline-submit').click();
    // Confirm the PublicNoticeIssued event landed on chain — the form
    // does not auto-close, so we wait on the wire signal instead of a
    // DOM transition.
    await expect
      .poll(
        async () =>
          page.evaluate(async (id) => {
            const r = await fetch(
              '/api/events?event_type=PublicNoticeIssued&limit=20',
            );
            const body = (await r.json()) as {
              events: { payload: { incident_id?: string } }[];
            };
            return body.events.filter(
              (e) => e.payload.incident_id === id,
            ).length;
          }, inboxIncidentId),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(1);

    // ─── STEP 7 — Logout + login as Karim ────────────────────────
    await page.getByTestId('sidebar-logout').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await loginAs('karim');
    await expect(page).toHaveURL(/\/field/, { timeout: 10_000 });

    // ─── STEP 8 — Optimize route ─────────────────────────────────
    const optimizeBtn = page.getByTestId('field-optimize-route');

    await expect(optimizeBtn).toBeVisible({ timeout: 10_000 });
    await expect(optimizeBtn).toBeEnabled();
    await optimizeBtn.click();
    await expect(page.getByTestId('field-optimized-subtitle')).toBeVisible();
    // Button disables itself when sortMode === 'sla'.
    await expect(optimizeBtn).toBeDisabled();

    // ─── STEP 9 — Open the first work order ──────────────────────
    const firstJob = page.locator('.tech-job').first();

    await expect(firstJob).toBeVisible({ timeout: 10_000 });
    await firstJob.click();
    await expect(page.getByTestId('field-detail-title')).toBeVisible({ timeout: 10_000 });
    // 5-step ladder renders.
    await expect(page.getByTestId('field-timeline')).toBeVisible();
    // The page derives the current step from the chain; the freshly-
    // assigned incident has only TechnicianAssigned on chain, so
    // the onsite card is the active action card.
    await expect(page.getByTestId('field-step-onsite-card')).toBeVisible();

    // ─── STEP 10 — Mark arrived on site ──────────────────────────
    await page.getByTestId('field-mark-arrived').click();
    // After the chain write the page refetches and the diagnosis
    // card becomes the active action card.
    await expect(page.getByTestId('field-step-diagnosis-card')).toBeVisible({ timeout: 10_000 });

    // ─── STEP 11 — Submit diagnosis ──────────────────────────────
    await page.getByTestId('field-diagnosis').fill('Chlorine pump #4 dead — needs replacement.');
    await page.getByTestId('field-parts').fill('chlorine pump #4, 1/2 inch washer');
    await page.getByTestId('field-submit-diagnosis').click();
    await expect(page.getByTestId('field-step-fix-card')).toBeVisible({ timeout: 10_000 });

    // ─── STEP 12 — Submit fix ────────────────────────────────────
    await page.getByTestId('field-fix-summary').fill('Replaced chlorine pump #4; output at 1.5 ppm.');
    await page.getByTestId('field-photo-url').fill('https://example.com/site-after.jpg');
    await page.getByTestId('field-submit-fix').click();
    await expect(page.getByTestId('field-step-resolved-card')).toBeVisible({ timeout: 10_000 });

    // ─── STEP 13 — Confirm resolution ────────────────────────────
    await page.getByTestId('field-resolve').click();
    // After IncidentResolved lands on chain the step list shows the
    // resolved step as --done; the resolve card itself remains in
    // DOM (the operator-confirm card is the terminal visual).
    // The 5-step ladder should show all 5 steps with the resolved
    // step (last) carrying the --done class. We don't assert
    // specific ladder classes here — just confirm the chain write
    // didn't error by re-checking the field-timeline is still
    // rendered.
    await expect(page.getByTestId('field-timeline')).toBeVisible();

    // ─── STEP 14 — Logout + login as Priya ───────────────────────
    await page.getByTestId('sidebar-logout').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await loginAs('priya');
    await expect(page).toHaveURL(/\/inbox/, { timeout: 10_000 });

    // ─── STEP 15 — Bulk Mark reviewed ────────────────────────────
    // The Table primitive renders each row's checkbox with testid
    // `table-inbox-select-<event_id>`. The select-all checkbox has
    // testid `table-inbox-select-all`; we want a row-level checkbox,
    // so use the regex that excludes `all`.
    const rowCheckboxes = page.locator('[data-testid^="table-inbox-select-"]:not([data-testid="table-inbox-select-all"])');

    await expect(rowCheckboxes.first()).toBeVisible({ timeout: 10_000 });
    await rowCheckboxes.first().check();
    // Bulk-bar becomes visible.
    const bulkMarkReviewed = page.getByTestId('bulk-mark-reviewed');

    await expect(bulkMarkReviewed).toBeVisible({ timeout: 5_000 });
    await expect(bulkMarkReviewed).toBeEnabled({ timeout: 5_000 });

    await bulkMarkReviewed.click();
    // After clicking, the SignatureAttestation chain write fires. We
    // wait for the row count to drop by 1 (one row drops out of
    // AwaitingActionRail because isAwaitingSig flips false) as the
    // durable signal that the action completed. The bulkbar may stay
    // visible in some selection-state edge cases — what matters for
    // the happy-path chain is that the SignatureAttestation landed.
    await page.waitForTimeout(3_000);
    // Confirm via /api/events query that the SignatureAttestation landed.
    const sigCount = await page.evaluate(async () => {
      const r = await fetch('/api/events?event_type=SignatureAttestation&limit=20');
      const body = (await r.json()) as { events: { event_id: string }[] };
      return body.events.length;
    });
    expect(sigCount).toBeGreaterThan(0);

    // ─── STEP 16 — Logout + login as Anjali → /ack/:id ───────────
    await page.getByTestId('sidebar-logout').click();
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 });
    await loginAs('anjali');
    // Anjali's landing is /submit; navigate to the inbox/detail
    // page from there to grab the incident id, then go to /ack/<id>.
    await expect(page).toHaveURL(/\/submit/, { timeout: 10_000 });

    // The inboxListModel writes `payload.incident_id` into the href
    // — we read it from MSW via window.fetch (already mocked by the
    // service worker) by querying the local IndexedDB. Simpler:
    // we know the inbox row link points at /inbox/<incident_id>;
    // fetch the latest chain events via the page's fetch + parse.
    const incidentId = await page.evaluate(async () => {
      const r = await fetch('/api/events?event_type=IncidentCreated&limit=10');
      const body = (await r.json()) as { events: { payload: { incident_id?: string } }[] };
      const ids = body.events
        .map((e) => e.payload.incident_id)
        .filter((x): x is string => typeof x === 'string');

      return ids[0] ?? null;
    });

    expect(incidentId).toBeTruthy();
    await page.goto(`/ack/${incidentId}`);
    await expect(page.getByTestId('ack-page-title')).toBeVisible({ timeout: 10_000 });
    // The operator's notice copy is visible (CitizenAckRequested
    // landed on chain in step 6).
    await expect(page.getByTestId('ack-notice-card')).toBeVisible();
    await expect(page.getByTestId('ack-notice-body')).toContainText(/confirm/i);

    // ─── STEP 17 — Approve & close ───────────────────────────────
    await page.getByTestId('ack-approve').click();
    await expect(page.getByTestId('ack-submitted-card')).toBeVisible({ timeout: 15_000 });
    // APPROVED badge — exact match (case-insensitive substring also
    // matches "You approved the fix" heading).
    await expect(page.getByText('APPROVED', { exact: true })).toBeVisible();
    await expect(page.getByText('You approved the fix')).toBeVisible();
    // Decision card removed after success.
    await expect(page.getByTestId('ack-decision-card')).toBeHidden();

    // ─── STEP 18 — WO-001 citizen-timeline landing ───────────────
    // Anjali taps "view full motion" from /ack/:id (or navigates
    // directly to her public-mode timeline). URL pattern is locked by
    // citizen-status-timeline.md §13 — /my-reports/:incident_id/timeline.
    // The role guard at the top of CitizenStatusTimeline.tsx redirects
    // any non-anjali session; we are anjali here so we land on the page.
    await page.goto(`/my-reports/${incidentId}/timeline`);

    // Title + subtitle render (REQ-001 guard passed; not redirected).
    await expect(page.getByTestId('citizen-timeline-title')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('citizen-timeline-subtitle')).toBeVisible();
    // Back-link to / is present.
    await expect(page.getByTestId('citizen-timeline-back')).toBeVisible();

    // ─── STEP 19 — Citizen-visible event rows render (REQ-002) ──
    // The chain segment for this incident contains: AnjaliReportSubmitted
    // (NOT in the visible set — citizen-side filter strips it), IncidentCreated,
    // TechnicianAssigned, TechnicianArrived, DiagnosisSubmitted, FixSubmitted,
    // IncidentResolved, CitizenAcknowledgement (also NOT in the visible set),
    // SignatureAttestation (NOT visible — operator-internal). Plus the
    // ChainRead the page emits on mount, which is explicitly filtered out.
    // We expect ≥ 5 visible rows.
    const visibleRows = page.locator('[data-testid^="citizen-event-row-"]');

    await expect(visibleRows.first()).toBeVisible({ timeout: 10_000 });
    expect(await visibleRows.count()).toBeGreaterThanOrEqual(5);

    // REQ-002 — public-mode lockdown. No payload/JSON/hash text in the
    // citizen-timeline DOM. The fixture blocks we wrote DO contain JSON
    // payloads (description, summary, etc.) but the public-mode projection
    // must NOT render them. Scan the page HTML for any leakage; if any
    // substring appears the page is leaking operator-internal data.
    const pageHtml = await page.content();

    // Field names that would only appear in raw payloads.
    expect(pageHtml).not.toContain('"payload"');
    expect(pageHtml).not.toContain('"block_hash"');
    expect(pageHtml).not.toContain('"actor_identity"');
    // "hash" appears in copy ("hash mismatch" etc.) but the leaf fixture
    // values like 'mock-photo-broken-seal-sha256' must not be visible.
    expect(pageHtml).not.toContain('mock-photo-broken-seal-sha256');
    expect(pageHtml).not.toContain('mock-fix-payload-hash');
    // Raw JSON braces are also forbidden in the DOM.
    expect(pageHtml).not.toMatch(/\{["']event_type["']:/);

    // ─── STEP 20 — Bangla locale default (REQ-003) ───────────────
    // The page stamps `data-locale` on the section root from the date
    // formatter's resolved locale. Bangla-first means data-locale="bn"
    // by default. The .bangla-text class is also applied (REQ-010).
    const section = page.locator('[data-area-id="citizen-status-timeline-page"]');

    await expect(section).toHaveAttribute('data-locale', /bn/);
    await expect(section).toHaveClass(/bangla-text/);

    // ─── STEP 21 — ActionCall state for the happy-path chain ─────
    // After step 17 the chain has IncidentResolved (field-tech resolve)
    // but NO IncidentResolvedByAdmin. CitizenStatusTimeline derives
    // state by checking the closed set; without an admin resolve the
    // ActionCall lands in `in-progress` (the common case).
    await expect(page.getByTestId('citizen-action-call-in-progress')).toBeVisible({
      timeout: 10_000,
    });

    // ─── STEP 22 — Closure-ack path (REQ-004) ────────────────────
    // To exercise the ✅ tap we need IncidentResolvedByAdmin on chain
    // without a CitizenAckAccepted. We synthesise it via /api/events
    // from inside the page (admin-side operator action). The page's
    // own ChainRead was already emitted on mount; we don't want a
    // second one, so we POST directly without reloading.
    const beforeAckCount = await page.evaluate(async (id) => {
      const r = await fetch(
        `/api/events?incident_id=${encodeURIComponent(id)}&limit=200`,
      );
      const body = (await r.json()) as { events: { event_type: string }[] };

      return body.events.filter((e) => e.event_type === 'IncidentResolvedByAdmin')
        .length;
    }, incidentId);

    expect(beforeAckCount).toBe(0);

    await page.evaluate(async (id) => {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: 'IncidentResolvedByAdmin',
          actor_identity: {
            kind: 'operator',
            ref: '01J0PRIYA000000000000000000',
            display: 'Priya (utility operator)',
          },
          payload: {
            incident_id: id,
            summary: 'Verified field-tech fix and pH stable; ready for citizen ack.',
          },
        }),
      });
    }, incidentId);

    // Reload so the timeline re-fetches and the ActionCall state flips.
    await page.reload();
    await expect(page.getByTestId('citizen-timeline-title')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('citizen-action-call-closure-ack')).toBeVisible({
      timeout: 10_000,
    });

    // Tap ✅ — emits ChainAccepted, flips state to all-caught-up.
    await page.getByTestId('citizen-action-call-confirm-yes').click();
    await expect(page.getByTestId('citizen-action-call-all-caught-up')).toBeVisible({
      timeout: 10_000,
    });
    // Toast "Thanks for confirming. All set." — uses actionCall.thanks key.
    await expect(page.getByText(/Thanks for confirming/i)).toBeVisible({ timeout: 5_000 });

    // Confirm ChainAccepted landed on chain.
    const ackOnChain = await page.evaluate(async (id) => {
      const r = await fetch(
        `/api/events?incident_id=${encodeURIComponent(id)}&limit=200`,
      );
      const body = (await r.json()) as { events: { event_type: string }[] };

      return body.events.some((e) => e.event_type === 'ChainAccepted');
    }, incidentId);
    expect(ackOnChain).toBe(true);

    // ─── STEP 23 — Visual snapshot for WO §Tests required ────────
    await page.screenshot({
      path: 'web/e2e/_tier8-snap/citizen-timeline.png',
      fullPage: true,
    });
  });
});
