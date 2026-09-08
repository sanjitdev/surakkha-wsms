/**
 * FE-1.3a — Vitest test harness for InboxRow + FilterChip primitives.
 *
 * Mirrors the fe-1-1a-vitest.test.tsx style: explicit imports from
 * 'vitest' + '@testing-library/react' (no globals), `MemoryRouter` for
 * any InboxRow test (it renders <Link>), jsdom stubs for matchMedia if
 * needed. Six cases per the FE-1.5b spec:
 *   (1) InboxRow renders title + meta + T3 badge
 *   (2) InboxRow wraps the row title in an <a href>
 *   (3) InboxRow trailing action renders a "Edit →" link when action set
 *   (4) FilterChip aria-selected flips on click
 *   (5) FilterChip count renders when > 0
 *   (6) FilterChip data-active=true when active
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { InboxRow } from '../components/pages/InboxRow';
import { FilterChip } from '../components/pages/FilterChip';
import type { InboxRow as InboxRowType } from '../types/inbox';

function buildRow(overrides: Partial<InboxRowType> = {}): InboxRowType {
  return {
    id: 'evt_test_001',
    severity: 'T3',
    title: 'Ward 7 chlorination spike',
    meta: 'citizen-ack request sent · Anjali (reporter) · SN-2208 silent 8 min',
    where: 'ward 7',
    whereSub: 'SN-2208',
    ownerName: 'Priya',
    ownerKind: 'priya',
    status: 'awaiting_ack',
    action: { label: 'Open', href: '/inbox-detail' },
    href: '/inbox-detail',
    timestamp: '2026-09-08T10:00:00.000Z',
    read: false,
    isUrgent: true,
    isDraft: false,
    isCitizen: false,
    isAwaitingSig: true,
    ...overrides,
  };
}

// ─── (1) InboxRow renders title + meta + T3 badge ────────────────────

describe('FE-1.3a · InboxRow', () => {
  afterEach(() => { cleanup(); });

  it('(1) renders the row title, meta line, and a T3 priority pill', () => {
    render(
      <MemoryRouter>
        <table><tbody>
          <InboxRow row={buildRow()} selected={false} onToggle={() => {}} />
        </tbody></table>
      </MemoryRouter>,
    );

    const row = screen.getByTestId('inbox-row');

    expect(row).not.toBeNull();
    expect(row.getAttribute('data-priority')).toBe('t3');
    expect(row.querySelector('strong')?.textContent).toBe('Ward 7 chlorination spike');
    expect(row.textContent).toContain('citizen-ack request sent');
    // The badge cell renders the severity string T3.
    expect(within(row).getByText('T3')).not.toBeNull();
  });

  // ─── (2) InboxRow wraps the row title in an <a href> ────────────────

  it('(2) wraps the title in a <Link href="/inbox-detail">', () => {
    render(
      <MemoryRouter>
        <table><tbody>
          <InboxRow row={buildRow()} selected={false} onToggle={() => {}} />
        </tbody></table>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /Ward 7 chlorination spike/ });

    expect(link.getAttribute('href')).toBe('/inbox-detail');
  });

  // ─── (3) InboxRow trailing action renders the action label ──────────

  it('(3) trailing action column renders the action label as a Link href when `action` set', () => {
    render(
      <MemoryRouter>
        <table><tbody>
          <InboxRow
            row={buildRow({ action: { label: 'Edit', href: '/inbox-detail?edit=1' } })}
            selected={false}
            onToggle={() => {}}
          />
        </tbody></table>
      </MemoryRouter>,
    );

    // Both the title link and the action link point at /inbox-detail;
    // the action link includes "Edit →" as the anchor text.
    const links = screen.getAllByRole('link');
    const editLink = links.find((a) => a.textContent?.includes('Edit'));

    expect(editLink).not.toBeUndefined();
    expect(editLink?.getAttribute('href')).toBe('/inbox-detail?edit=1');
  });
});

// ─── (4-6) FilterChip ────────────────────────────────────────────────

describe('FE-1.3a · FilterChip', () => {
  beforeEach(() => {
    if (!('matchMedia' in window)) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (q: string) => {return {
          matches: false, media: q, onchange: null,
          addListener: () => {}, removeListener: () => {},
          addEventListener: () => {}, removeEventListener: () => {},
          dispatchEvent: () => false,
        }},
      });
    }
  });
  afterEach(() => { cleanup(); });

  // ─── (4) FilterChip aria-selected flips on click ────────────────────

  it('(4) starts aria-selected="false" and flips to "true" on click', () => {
    function Wrapper() {
      const [active, setActive] = useState(false);
      const clickSpy = vi.fn();

      return (
        <FilterChip
          label="All"
          active={active}
          onClick={() => { clickSpy(); setActive((s) => !s); }}
          testId="chip-all"
        />
      );
    }
    render(<Wrapper />);
    const chip = screen.getByTestId('chip-all');

    expect(chip.getAttribute('aria-selected')).toBe('false');
    act(() => { chip.click(); });
    expect(chip.getAttribute('aria-selected')).toBe('true');
  });

  it('(4b) when rendered with active=true, aria-selected="true" + is-active class', () => {
    render(<FilterChip label="T3 urgent" active={true} onClick={() => {}} testId="chip-t3" />);
    const chip = screen.getByTestId('chip-t3');

    expect(chip.getAttribute('aria-selected')).toBe('true');
    expect(chip.className).toContain('is-active');
  });

  // ─── (5) FilterChip count renders when > 0 ──────────────────────────

  it('(5) renders a .filter-chip__count chip when count > 0', () => {
    render(<FilterChip label="T3 urgent" count={3} active={false} onClick={() => {}} />);
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('(5b) does NOT render a count chip when count is 0 or undefined', () => {
    const { container: c1 } = render(<FilterChip label="All" count={0} active={false} onClick={() => {}} />);

    expect(c1.querySelectorAll('.filter-chip__count')).toHaveLength(0);
    const { container: c2 } = render(<FilterChip label="Other" active={false} onClick={() => {}} />);

    expect(c2.querySelectorAll('.filter-chip__count')).toHaveLength(0);
  });

  // ─── (6) FilterChip data-active="true" when active ──────────────────

  it('(6) data-active="true" when active; "false" when not', () => {
    const { rerender } = render(<FilterChip label="All" active={false} onClick={() => {}} testId="chip-x" />);

    expect(screen.getByTestId('chip-x').getAttribute('data-active')).toBe('false');
    rerender(<FilterChip label="All" active={true} onClick={() => {}} testId="chip-x" />);
    expect(screen.getByTestId('chip-x').getAttribute('data-active')).toBe('true');
  });

  // ─── (4c) Click fires onClick ───────────────────────────────────────

  it('(4c) onClick fires once per click event', () => {
    const handler = vi.fn();

    render(<FilterChip label="X" active={false} onClick={handler} testId="chip-y" />);
    act(() => { fireEvent.click(screen.getByTestId('chip-y')); });
    act(() => { fireEvent.click(screen.getByTestId('chip-y')); });
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
