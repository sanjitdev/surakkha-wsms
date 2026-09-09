/**
 * FE-B5a-keyboard — Vitest checks for the Dropdown type-ahead cycling
 * behavior. 7 cases pin the I/O matrix from spec-fe-b5a-keyboard-typeahead.md:
 * (1) single match opens at index; (2) repeated char cycles within match
 * group; (3) wraps at end of match group; (4) multi-char advances within
 * group; (5) skips disabled options; (6) no-match leaves popover closed;
 * (7) reset on Escape.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Dropdown, type DropdownOption } from '../components/ui/Dropdown';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ABC: DropdownOption<string>[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];

const APPLES: DropdownOption<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'avocado', label: 'Avocado' },
];

const APPLES_WITH_DISABLED: DropdownOption<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot', disabled: true },
  { value: 'avocado', label: 'Avocado' },
];

const AP_AP: DropdownOption<string>[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
];

describe('FE-B5a-keyboard type-ahead cycling', () => {
  // (1) HAPPY_PATH_single_match — typing `b` opens popover at Banana.
  it('typeahead_single_match_opens_at_index', () => {
    render(
      <Dropdown<string>
        options={ABC}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    act(() => {
      fireEvent.keyDown(screen.getByTestId('kbd-ty-trigger'), { key: 'b' });
    });
    expect(screen.getByTestId('kbd-ty-trigger').getAttribute('aria-activedescendant')).toBe(
      screen.getByTestId('kbd-ty-option-b').id,
    );
  });

  // (2) HAPPY_PATH_cycling_repeat — typing `a` twice advances Apple → Apricot.
  it('typeahead_repeated_char_cycles_within_match_group', () => {
    render(
      <Dropdown<string>
        options={APPLES}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    act(() => {
      fireEvent.keyDown(screen.getByTestId('kbd-ty-trigger'), { key: 'a' });
    });
    expect(screen.getByTestId('kbd-ty-trigger').getAttribute('aria-activedescendant')).toBe(
      screen.getByTestId('kbd-ty-option-apple').id,
    );
    act(() => {
      fireEvent.keyDown(screen.getByTestId('kbd-ty-trigger'), { key: 'a' });
    });
    expect(screen.getByTestId('kbd-ty-trigger').getAttribute('aria-activedescendant')).toBe(
      screen.getByTestId('kbd-ty-option-apricot').id,
    );
  });

  // (3) HAPPY_PATH_cycling_wraps — typing `a` 3 times wraps Apple → Apricot
  // → Avocado → Apple.
  it('typeahead_wraps_at_end_of_match_group', () => {
    render(
      <Dropdown<string>
        options={APPLES}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    const trigger = screen.getByTestId('kbd-ty-trigger');
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apple').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apricot').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-avocado').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apple').id);
  });

  // (4) HAPPY_PATH_multi_char — typing `ap` advances from Apple to Apricot.
  it('typeahead_multi_char_advances_to_next_within_group', () => {
    render(
      <Dropdown<string>
        options={AP_AP}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    const trigger = screen.getByTestId('kbd-ty-trigger');
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apple').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'p' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apricot').id);
  });

  // (5) HAPPY_PATH_disabled_skipped — Apricot is disabled, so `a` twice
  // goes Apple (0) → Avocado (2).
  it('typeahead_skips_disabled_options', () => {
    render(
      <Dropdown<string>
        options={APPLES_WITH_DISABLED}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    const trigger = screen.getByTestId('kbd-ty-trigger');
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-apple').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-avocado').id);
  });

  // (6) ERROR_CASE_no_matches — typing `z` does NOT open the popover.
  it('typeahead_no_match_does_not_open', () => {
    render(
      <Dropdown<string>
        options={ABC}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    act(() => {
      fireEvent.keyDown(screen.getByTestId('kbd-ty-trigger'), { key: 'z' });
    });
    expect(screen.queryByTestId('kbd-ty-listbox')).toBeNull();
  });

  // (7) REGRESSION reset on Escape — after Escape, type-ahead starts fresh.
  it('typeahead_resets_on_escape', () => {
    render(
      <Dropdown<string>
        options={ABC}
        value={null}
        onChange={() => undefined}
        testId="kbd-ty"
      />,
    );
    const trigger = screen.getByTestId('kbd-ty-trigger');
    act(() => {
      fireEvent.keyDown(trigger, { key: 'a' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-a').id);
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Escape' });
    });
    expect(screen.queryByTestId('kbd-ty-listbox')).toBeNull();
    act(() => {
      fireEvent.keyDown(trigger, { key: 'b' });
    });
    expect(trigger.getAttribute('aria-activedescendant')).toBe(screen.getByTestId('kbd-ty-option-b').id);
  });
});
