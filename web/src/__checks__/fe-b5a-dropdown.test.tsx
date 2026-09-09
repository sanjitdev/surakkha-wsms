/**
 * FE-B5a — Vitest checks for the Dropdown primitive. 8 cases per the I/O
 * matrix (idle / open / single / multi / remove_chip / searchable /
 * disabled / keyboard_escape). `afterEach` mirrors the FE-1.3c pattern:
 * `cleanup()` + `vi.restoreAllMocks()`.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Dropdown, type DropdownOption } from '../components/ui/Dropdown';
import { DropdownMode } from '../types/domain';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CITIES: DropdownOption<string>[] = [
  { value: 'dhaka', label: 'Dhaka' },
  { value: 'chittagong', label: 'Chittagong' },
  { value: 'khulna', label: 'Khulna' },
];

describe('FE-B5a Dropdown', () => {
  // (1) idle — placeholder visible, listbox closed.
  it('idle: placeholder visible + listbox closed', () => {
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={() => undefined}
      placeholder="Choose a city…"
      testId="city"
    />,
  );
  const trigger = screen.getByTestId('city-trigger');
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
  expect(screen.getByText('Choose a city…')).toBeTruthy();
  expect(screen.queryByTestId('city-listbox')).toBeNull();
});

// (2) open — click trigger → aria-expanded=true + 3 role=option.
it('open: click trigger → aria-expanded=true + 3 role=option', () => {
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={() => undefined}
      testId="city"
    />,
  );
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  const trigger = screen.getByTestId('city-trigger');
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  const listbox = screen.getByTestId('city-listbox');
  expect(listbox.getAttribute('role')).toBe('listbox');
  const options = screen.getAllByRole('option');
  expect(options.length).toBe(3);
  expect(options[0].textContent).toContain('Dhaka');
  expect(options[1].textContent).toContain('Chittagong');
  expect(options[2].textContent).toContain('Khulna');
});

// (3) single — ArrowDown×2 + Enter → onChange(3rd value) + listbox closes + focus returns.
it('single: ArrowDown×2 + Enter → onChange(3rd) + listbox closes', async () => {
  const onChange = vi.fn();
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={onChange}
      testId="city"
    />,
  );
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  expect(screen.getByTestId('city-listbox')).toBeTruthy();
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'ArrowDown' });
  });
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'ArrowDown' });
  });
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'Enter' });
  });
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('khulna');
  expect(screen.queryByTestId('city-listbox')).toBeNull();
  // queueMicrotask defers focus restoration.
  await Promise.resolve();
  expect(document.activeElement).toBe(screen.getByTestId('city-trigger'));
});

// (4) multi — click 2 options → 2 chips render + onChange called with both.
it('multi: click 2 options → 2 chips render + onChange called', () => {
  function Harness() {
    const [val, setVal] = useState<string[]>([]);
    return (
      <Dropdown<string>
        options={CITIES}
        mode={DropdownMode.Multi}
        value={val}
        onChange={setVal}
        testId="city"
      />
    );
  }
  render(<Harness />);
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  act(() => {
    fireEvent.click(screen.getByTestId('city-option-dhaka'));
  });
  act(() => {
    fireEvent.click(screen.getByTestId('city-option-chittagong'));
  });
  expect(screen.getByTestId('city-chip-dhaka')).toBeTruthy();
  expect(screen.getByTestId('city-chip-chittagong')).toBeTruthy();
});

// (5) remove chip — click × → chip removed + remaining values stay selected.
it('remove chip: click × → chip removed + remaining values stay selected', () => {
  function Harness() {
    const [val, setVal] = useState<string[]>(['dhaka', 'chittagong']);
    return (
      <Dropdown<string>
        options={CITIES}
        mode={DropdownMode.Multi}
        value={val}
        onChange={setVal}
        testId="city"
      />
    );
  }
  render(<Harness />);
  expect(screen.getByTestId('city-chip-dhaka')).toBeTruthy();
  expect(screen.getByTestId('city-chip-chittagong')).toBeTruthy();
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /Remove Dhaka/ }));
  });
  expect(screen.queryByTestId('city-chip-dhaka')).toBeNull();
  expect(screen.getByTestId('city-chip-chittagong')).toBeTruthy();
});

// (6) searchable — typing "dh" filters listbox to matching options.
it('searchable: type "dh" filters listbox to matching options', () => {
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={() => undefined}
      searchable
      testId="city"
    />,
  );
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  const search = screen.getByTestId('city-search');
  act(() => {
    fireEvent.change(search, { target: { value: 'dh' } });
  });
  const options = screen.getAllByRole('option');
  expect(options.length).toBe(1);
  expect(options[0].textContent).toContain('Dhaka');
});

// (7) disabled — click no-op + aria-disabled="true".
it('disabled: click is a no-op + aria-disabled="true"', () => {
  const onChange = vi.fn();
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={onChange}
      disabled
      testId="city"
    />,
  );
  const trigger = screen.getByTestId('city-trigger');
  expect(trigger.getAttribute('aria-disabled')).toBe('true');
  expect((trigger as HTMLButtonElement).disabled).toBe(true);
  act(() => {
    fireEvent.click(trigger);
  });
  expect(screen.queryByTestId('city-listbox')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
});

// (8) keyboard escape — open + Escape closes listbox + focus returns + no onChange.
it('keyboard escape: open + Escape closes listbox + no onChange', async () => {
  const onChange = vi.fn();
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={onChange}
      testId="city"
    />,
  );
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  expect(screen.getByTestId('city-listbox')).toBeTruthy();
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'Escape' });
  });
  expect(screen.queryByTestId('city-listbox')).toBeNull();
  expect(onChange).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(document.activeElement).toBe(screen.getByTestId('city-trigger'));
});

// (9) keyboard Home/End — open + End jumps to last option; Home jumps to first.
it('keyboard Home/End: End jumps to last + Home jumps to first', () => {
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={() => undefined}
      testId="city"
    />,
  );
  act(() => {
    fireEvent.click(screen.getByTestId('city-trigger'));
  });
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'End' });
  });
  expect(screen.getByTestId('city-trigger').getAttribute('aria-activedescendant')).toBe(
    screen.getByTestId('city-option-khulna').id,
  );
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'Home' });
  });
  expect(screen.getByTestId('city-trigger').getAttribute('aria-activedescendant')).toBe(
    screen.getByTestId('city-option-dhaka').id,
  );
});

// (10) type-ahead on closed trigger — typing a printable char opens the
// popover and jumps to the first option whose label starts with that char.
it('type-ahead: type "k" on closed trigger opens listbox + highlights Khulna', () => {
  render(
    <Dropdown<string>
      options={CITIES}
      value={null}
      onChange={() => undefined}
      testId="city"
    />,
  );
  expect(screen.queryByTestId('city-listbox')).toBeNull();
  act(() => {
    fireEvent.keyDown(screen.getByTestId('city-trigger'), { key: 'k' });
  });
  expect(screen.getByTestId('city-listbox')).toBeTruthy();
  expect(screen.getByTestId('city-trigger').getAttribute('aria-activedescendant')).toBe(
    screen.getByTestId('city-option-khulna').id,
  );
});
});
