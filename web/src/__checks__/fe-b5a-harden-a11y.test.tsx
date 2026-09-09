/**
 * FE-B5a-harden — Vitest checks for the Dropdown a11y hardening patches
 * (B5a-3 outside-click focus restore + B5a-2 dual aria-controls when
 * `searchable={true}`). 5 cases per the I/O matrix in
 * spec-fe-b5a-harden-dropdown-a11y.md. `afterEach` mirrors the FE-1.3c
 * pattern: `cleanup()` + `vi.restoreAllMocks()`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dropdown, type DropdownOption } from '../components/ui/Dropdown';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CITIES: DropdownOption<string>[] = [
  { value: 'dhaka', label: 'Dhaka' },
  { value: 'chittagong', label: 'Chittagong' },
  { value: 'khulna', label: 'Khulna' },
];

describe('FE-B5a-harden Dropdown a11y', () => {
  // (1) B5a-3 — click outside closes the popover AND restores focus to
  // the trigger button. Previously focus leaked to `document.body`.
  it('click_outside_restores_focus_to_trigger', async () => {
    render(
      <div>
        <button data-testid="outside-btn" type="button">
          outside
        </button>
        <Dropdown<string>
          options={CITIES}
          value={null}
          onChange={() => undefined}
          testId="dd-harden"
        />
      </div>,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dd-harden-trigger'));
    });
    expect(screen.getByTestId('dd-harden-listbox')).toBeTruthy();
    // Dispatch a mousedown on a node outside the dropdown root.
    act(() => {
      fireEvent.mouseDown(screen.getByTestId('outside-btn'));
    });
    expect(screen.queryByTestId('dd-harden-listbox')).toBeNull();
    // queueMicrotask defers focus restoration past the current tick.
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.activeElement?.getAttribute('data-testid')).toBe('dd-harden-trigger');
  });

  // (2) regression — Escape still restores focus (existing B5a case).
  it('escape_still_restores_focus_regression', async () => {
    render(
      <Dropdown<string>
        options={CITIES}
        value={null}
        onChange={() => undefined}
        testId="dd-harden"
      />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dd-harden-trigger'));
    });
    act(() => {
      fireEvent.keyDown(screen.getByTestId('dd-harden-trigger'), { key: 'Escape' });
    });
    expect(screen.queryByTestId('dd-harden-listbox')).toBeNull();
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.activeElement?.getAttribute('data-testid')).toBe('dd-harden-trigger');
  });

  // (3) regression — option commit (Enter on a single) still restores focus.
  it('option_commit_still_restores_focus_regression', async () => {
    render(
      <Dropdown<string>
        options={CITIES}
        value={null}
        onChange={() => undefined}
        testId="dd-harden"
      />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dd-harden-trigger'));
    });
    act(() => {
      fireEvent.keyDown(screen.getByTestId('dd-harden-trigger'), { key: 'Enter' });
    });
    expect(screen.queryByTestId('dd-harden-listbox')).toBeNull();
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.activeElement?.getAttribute('data-testid')).toBe('dd-harden-trigger');
  });

  // (4) B5a-2 — when `searchable={true}`, the trigger's `aria-controls`
  // lists BOTH the listbox id AND the search input id (space-separated).
  it('aria_controls_includes_search_input_when_searchable', () => {
    render(
      <Dropdown<string>
        options={CITIES}
        value={null}
        onChange={() => undefined}
        searchable
        testId="dd-harden"
      />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dd-harden-trigger'));
    });
    const trigger = screen.getByTestId('dd-harden-trigger');
    const listbox = screen.getByTestId('dd-harden-listbox');
    const search = screen.getByTestId('dd-harden-search');
    const controls = trigger.getAttribute('aria-controls') ?? '';
    expect(controls).toBe(`${listbox.id} ${search.id}`);
    // The search input's id must match the second token in aria-controls.
    expect(search.id.length).toBeGreaterThan(0);
  });

  // (5) regression — when `searchable={false}`, the trigger's
  // `aria-controls` is just the listbox id (unchanged from B5a).
  it('aria_controls_single_when_not_searchable_regression', () => {
    render(
      <Dropdown<string>
        options={CITIES}
        value={null}
        onChange={() => undefined}
        testId="dd-harden"
      />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('dd-harden-trigger'));
    });
    const trigger = screen.getByTestId('dd-harden-trigger');
    const listbox = screen.getByTestId('dd-harden-listbox');
    expect(trigger.getAttribute('aria-controls')).toBe(listbox.id);
  });
});
