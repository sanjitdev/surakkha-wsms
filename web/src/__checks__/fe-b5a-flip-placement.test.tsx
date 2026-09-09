/**
 * FE-B5a-flip — Vitest checks for the Dropdown popover viewport-collision
 * auto-flip (B5a-1). 5 cases per the I/O matrix in
 * spec-fe-b5a-flip-dropdown.md:
 *   (1) below_default — room available below → data-placement="below"
 *   (2) above_no_room_below — viewport collision → data-placement="above"
 *   (3) at_threshold_below_inclusive — boundary (rect.bottom ≤ innerHeight-256) → "below"
 *   (4) short_viewport_flips — small viewport forces flip
 *   (5) mobile_no_flip_regression — narrow viewport still gets data-placement set
 *
 * jsdom doesn't compute real layout — we mock `window.innerHeight` and
 * override `Element.prototype.getBoundingClientRect` to return a
 * deterministic trigger rect. `afterEach` restores both.
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

/**
 * Mock `window.innerHeight` + the trigger element's bounding rect.
 * Returns a teardown function that restores the original
 * `getBoundingClientRect` prototype method. Any element with
 * `data-testid="flip-trigger"` (the dropdown's `<button>`) gets the
 * specified top + 40px height; everything else returns 0,0,0,0.
 */
function mockViewport(innerHeight: number, triggerTop: number): () => void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight });
  // Save + restore via a wrapper that calls the original. Avoids the
  // unbound-method lint (which fires on direct property reassignment)
  // because the original method is invoked with the correct receiver.
  const orig = Element.prototype.getBoundingClientRect.bind(Element.prototype);

  // `this`-aware mock: `getBoundingClientRect` is invoked with the
  // element as the receiver, so we need a regular `function` to read
  // `this.dataset.testid`.
  const mockFn = vi.fn(function mockRect(this: Element) {
    if (this instanceof HTMLElement && this.dataset.testid === 'flip-trigger') {
      return {
        top: triggerTop,
        bottom: triggerTop + 40,
        left: 0,
        right: 200,
        width: 200,
        height: 40,
        x: 0,
        y: triggerTop,
        toJSON: () => undefined,
      };
    }
    return orig.call(this);
  });

  Element.prototype.getBoundingClientRect = mockFn;
  return () => {
    Element.prototype.getBoundingClientRect = orig;
  };
}

function renderFlipDropdown(innerHeight: number, triggerTop: number, testId = 'flip') {
  const restore = mockViewport(innerHeight, triggerTop);
  render(
    <Dropdown<string> options={CITIES} value={null} onChange={() => undefined} testId={testId} />,
  );
  return restore;
}

describe('FE-B5a-flip Dropdown popover auto-flip', () => {
  // (1) HAPPY_PATH_below_default — trigger near top of viewport, plenty
  // of room below → data-placement="below".
  it('placement_below_when_room_available', () => {
    const restore = renderFlipDropdown(900, 100);
    act(() => {
      fireEvent.click(screen.getByTestId('flip-trigger'));
    });
    const popover = screen.getByTestId('flip-popover');
    expect(popover.getAttribute('data-placement')).toBe('below');
    restore();
  });

  // (2) HAPPY_PATH_above_when_no_room_below — trigger near the bottom,
  // 240px popover + 16px margin would overflow the viewport → "above".
  // Math: triggerTop=750 → rect.bottom=790; 790+256=1046 > 900 → flip.
  it('placement_above_when_no_room_below', () => {
    const restore = renderFlipDropdown(900, 750);
    act(() => {
      fireEvent.click(screen.getByTestId('flip-trigger'));
    });
    const popover = screen.getByTestId('flip-popover');
    expect(popover.getAttribute('data-placement')).toBe('above');
    restore();
  });

  // (3) Boundary inclusive — exactly rect.bottom == innerHeight-256 →
  // no flip ("below"). triggerTop=604 → rect.bottom=644, threshold=644
  // (900-256). 644 ≤ 644 → no flip.
  it('placement_at_threshold_below_inclusive', () => {
    const restore = renderFlipDropdown(900, 604);
    act(() => {
      fireEvent.click(screen.getByTestId('flip-trigger'));
    });
    const popover = screen.getByTestId('flip-popover');
    expect(popover.getAttribute('data-placement')).toBe('below');
    restore();
  });

  // (4) Short viewport flips — laptop-with-split-window scenario.
  // innerHeight=500, triggerTop=210 → rect.bottom=250, threshold=244
  // (500-256). 250 > 244 → flip to "above".
  it('placement_short_viewport_flips', () => {
    const restore = renderFlipDropdown(500, 210);
    act(() => {
      fireEvent.click(screen.getByTestId('flip-trigger'));
    });
    const popover = screen.getByTestId('flip-popover');
    expect(popover.getAttribute('data-placement')).toBe('above');
    restore();
  });

  // (5) REGRESSION — data-placement attribute is still set even when
  // the mobile bottom-sheet CSS would override positioning. The mobile
  // `@media (max-width: 767px)` rule forces `position: fixed; bottom: 0`
  // regardless of data-placement, so the JS attribute remains "above"
  // for triggers near the fold (CSS wins at the breakpoint).
  it('placement_attribute_set_even_for_mobile_viewport', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    const restore = mockViewport(600, 550);
    render(
      <Dropdown<string> options={CITIES} value={null} onChange={() => undefined} testId="flip" />,
    );
    act(() => {
      fireEvent.click(screen.getByTestId('flip-trigger'));
    });
    const popover = screen.getByTestId('flip-popover');
    // Attribute is unconditional — JS still computes "above" for a low
    // trigger; CSS @media (max-width: 767px) overrides positioning.
    expect(popover.getAttribute('data-placement')).toBe('above');
    restore();
  });
});
