/**
 * fe-b6-inbox-detail-pane-swap.test.tsx — InboxDetail left↔right pane swap.
 *
 * Pins inbox-detail.md #6 (reconciled 2026-09-11): the chain-event
 * timeline moves from the LEFT pane (col-7) to a new RIGHT rail (col-5);
 * the related (sibling) incidents pane takes the LEFT col-7 slot.
 *
 * Asserts:
 *   1) The chain-event timeline test-id sits in a `col-5` parent.
 *   2) The related-incidents test-id sits in a `col-7` parent.
 *   3) Both panes still render their card titles (no regression on
 *      ordering of components within each pane).
 *   4) Timeline precedes related in DOM order within the grid (left=related
 *      comes first; right=timeline comes second).
 *   5) en/bn key parity for timeline.* and related.* still hold.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InboxDetail } from '../pages/InboxDetail';
import i18n from '../i18n';
import { LocaleProvider } from '../hooks/useLocale';
import { AppLayoutContext } from '../components/layout/AppLayoutContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import type { SessionRow } from '../mocks/idb';
import enJson from '../i18n/locales/en/inboxDetail.json';
import bnJson from '../i18n/locales/bn/inboxDetail.json';

function makeSession(): SessionRow {
  return {
    actor_id: 'priya-001',
    actor_ref: 'priya-001',
    display_name: 'Priya — Utility Operator',
    role: 'utility_operator',
    token: 'test-token',
    logged_in_at: '2024-01-01T00:00:00Z',
    tenant_id: 'tenant-001',
  };
}

const incidentsFixture = [
  { incident_id: 'inc_test_001', severity: 'T2', ward_id: 'W04', status: 'open', last_block_height: 12, last_event_type: 'IncidentCreated' },
  { incident_id: 'inc_test_002', severity: 'T3', ward_id: 'W04', status: 'open', last_block_height: 13, last_event_type: 'IncidentCreated' },
  { incident_id: 'inc_test_003', severity: 'T1', ward_id: 'W04', status: 'open', last_block_height: 14, last_event_type: 'IncidentCreated' },
];

vi.mock('../hooks/useIncidents', () => {
  return {
    useIncidents: () => ({
      incidents: incidentsFixture,
      loading: false,
      error: null,
    }),
  };
});

const chainEventsFixture = [
  {
    event_id: 'ev-1',
    event_type: 'IncidentCreated',
    occurred_at: '2024-01-15T12:00:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_test_001', ward_id: 'W04' },
    block_hash: 'abcdef1234567890',
    height: 12,
  },
  {
    event_id: 'ev-2',
    event_type: 'PublicNoticeIssued',
    occurred_at: '2024-01-15T12:05:00Z',
    actor_identity: { kind: 'operator', ref: 'priya-001', display: 'Priya' },
    payload: { incident_id: 'inc_test_001' },
    block_hash: 'fedcba0987654321',
    height: 13,
  },
];

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn(async (url: RequestInfo | URL) => {
    const u = typeof url === 'string' ? url : url instanceof URL ? url.toString() : '';

    if (u.startsWith('/api/events')) {
      return new Response(JSON.stringify({ events: chainEventsFixture }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('{}', { status: 200 });
  }) as typeof global.fetch;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
  void i18n.changeLanguage('en');
});

function renderInboxDetail() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LocaleProvider>
        <ToastProvider>
          <MemoryRouter
            initialEntries={['/inbox/inc_test_001']}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppLayoutContext.Provider
              value={{
                session: makeSession(),
                chainHead: null,
                chainFreshSeconds: 0,
                logout: () => Promise.resolve(),
              }}
            >
              <Routes>
                <Route path="/inbox/:id" element={<InboxDetail />} />
              </Routes>
            </AppLayoutContext.Provider>
          </MemoryRouter>
        </ToastProvider>
      </LocaleProvider>
    </I18nextProvider>,
  );
}

function parentClassChain(el: HTMLElement | null): string {
  const chain: string[] = [];

  let cur: HTMLElement | null = el;
  while (cur) {
    if (cur.className && typeof cur.className === 'string') {
      chain.push(cur.className);
    }
    cur = cur.parentElement;
  }
  return chain.join(' > ');
}

describe('FE-B6 InboxDetail pane swap (inbox-detail.md #6)', () => {
  // (1) Timeline test-id lives in a col-5 parent.
  it('chain-event timeline sits in a col-5 parent (right rail)', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    const timeline = screen.getByTestId('inbox-detail-timeline');

    expect(timeline.className).toContain('col-5');
    // And it must NOT live in col-7.
    expect(timeline.className).not.toContain('col-7');
  });

  // (2) Related test-id lives in a col-7 parent.
  it('related incidents pane sits in a col-7 parent (left slot)', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline-list')).toBeTruthy();
    });

    const related = screen.getByTestId('inbox-detail-related');

    expect(related.className).toContain('col-7');
    expect(related.className).not.toContain('col-5');
  });

  // (3) Both panes still render their card titles.
  it('both panes still render their titles (no regression)', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-timeline')).toBeTruthy();
      expect(screen.getByTestId('inbox-detail-related')).toBeTruthy();
    });

    // Timeline title.
    expect(screen.getByText(enJson.timeline.title)).toBeTruthy();
    // Related title — interpolated ward id, so check prefix.
    const relatedTitle = screen.getByText((content) => {
      return content.startsWith(enJson.related.title.split('{')[0]);
    });

    expect(relatedTitle).toBeTruthy();
  });

  // (4) DOM order: related (left) precedes timeline (right) within the grid.
  it('DOM order: related first (left), timeline second (right)', async () => {
    renderInboxDetail();
    await waitFor(() => {
      expect(screen.getByTestId('inbox-detail-related')).toBeTruthy();
      expect(screen.getByTestId('inbox-detail-timeline')).toBeTruthy();
    });

    const related = screen.getByTestId('inbox-detail-related');
    const timeline = screen.getByTestId('inbox-detail-timeline');

    // .compareDocumentOrder: <0 means related comes before timeline.
    const cmp = related.compareDocumentPosition(timeline);

    expect(cmp & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // And they're both inside the same grid-12.
    expect(parentClassChain(related)).toContain('grid-12');
    expect(parentClassChain(timeline)).toContain('grid-12');
  });

  // (5) Key parity.
  it('en/bn key parity: timeline.* + related.* still exist', () => {
    const timelineKeys = ['title', 'emptyHeading', 'emptyBody', 'unknownActor', 'separator', 'blockRef', 'eventCount_one', 'eventCount_other'];
    const relatedKeys = ['title', 'subtitle_one', 'subtitle_other', 'emptyHeading', 'emptyBody', 'rowMeta'];

    for (const k of timelineKeys) {
      expect(enJson.timeline[k], `en.timeline.${k}`).toBeTruthy();
      expect(bnJson.timeline[k], `bn.timeline.${k}`).toBeTruthy();
    }
    for (const k of relatedKeys) {
      expect(enJson.related[k], `en.related.${k}`).toBeTruthy();
      expect(bnJson.related[k], `bn.related.${k}`).toBeTruthy();
    }
  });
});
