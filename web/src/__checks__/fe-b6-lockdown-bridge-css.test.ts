/**
 * fe-b6-lockdown-bridge-css.test.ts — Pin lockdown-bridge.css token swaps.
 *
 * Asserts the CSS bridge file exports all expected lockdown-bound
 * selectors that bind legacy tokens to lockdown tokens per
 * `docs/D-UX-Design/decisions/01-token-deconfliction-plan.md`.
 *
 * Reads lockdown-bridge.css as raw text (no jsdom interpretation) so
 * the test does not depend on whether the CSS is parsed / applied at
 * test time.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BRIDGE = readFileSync(
  resolve(__dirname, '..', 'styles', 'lockdown-bridge.css'),
  'utf8',
);

interface Expect {
  selector: string;
  /** token name expected to appear on the same line */
  token: string;
  rationale: string;
}

const EXPECTATIONS: Expect[] = [
  // Severity dots — T3 must use amber-bright (NOT alert-red).
  { selector: '.severity-dot--t3', token: 'color-amber-bright', rationale: 'T3 operator dot' },
  { selector: '.severity-dot--t2', token: 'color-amber', rationale: 'T2 operator dot' },
  { selector: '.severity-dot--t1', token: 'color-trust-t1', rationale: 'T1 = divider neutral' },
  { selector: '.row-severity-dot.is-t3', token: 'color-amber-bright', rationale: 'inbox row T3' },
  { selector: '.row-severity-dot.is-error', token: 'color-status-warn', rationale: 'audit Error' },
  {
    selector: '.row-severity-dot.is-anomaly',
    token: 'color-alert-red-reserved',
    rationale: 'ChainAnomalyDetected → issuance path',
  },

  // Audit-log anomaly/error row borders.
  { selector: '.audit-row--anomaly', token: 'color-alert-red-reserved', rationale: 'audit anomaly row' },
  { selector: '.audit-row--error', token: 'color-status-warn', rationale: 'audit error row' },

  // Sidebar active state + unread badge.
  { selector: '.sidebar__link.active', token: 'color-primary', rationale: 'sidebar active' },
  { selector: '.sidebar__badge', token: 'color-amber-bright', rationale: 'unread count badge' },

  // Primary CTA surfaces.
  { selector: '.toggle-switch input:checked + .toggle-switch__slider', token: 'color-primary', rationale: 'toggle switch' },
  { selector: '.two-tap__btn.is-armed', token: 'color-primary', rationale: 'two-tap armed' },
  { selector: '.verify-step--active', token: 'color-primary-tint', rationale: 'verify step active' },
  { selector: '.verify-step--done', token: 'color-safe-green', rationale: 'verify step done' },

  // Input focus ring.
  { selector: '.input:focus', token: 'color-primary-tint', rationale: 'focus ring' },

  // Owner avatar dot kinds.
  { selector: '.avatar-dot.owner-kind-reporter', token: 'color-safe-green', rationale: 'reporter avatar' },
  { selector: '.avatar-dot.owner-kind-tech', token: 'color-primary', rationale: 'tech avatar' },

  // Hbar severity colours (operator-side rail).
  { selector: '.severity-bar-t3', token: 'color-amber-bright', rationale: 'rail T3 bar' },
  { selector: '.severity-bar-t1', token: 'color-trust-t1', rationale: 'rail T1 bar' },

  // FieldQueue P1 chip → amber-bright (NOT alert-red).
  { selector: '.tech-job__priority--p1', token: 'color-amber-bright', rationale: 'field P1 priority chip' },
];

describe('FE-B6 lockdown-bridge.css token swaps', () => {
  for (const exp of EXPECTATIONS) {
    it(`binds ${exp.selector} → ${exp.token} (${exp.rationale})`, () => {
      // Find the selector block and verify a var(--color-...) reference
      // for the expected token appears within the next ~3 lines (rule body).
      const idx = BRIDGE.indexOf(exp.selector);

      expect(idx, `selector "${exp.selector}" missing from lockdown-bridge.css`).toBeGreaterThan(-1);
      const slice = BRIDGE.slice(idx, idx + 800);

      expect(
        slice,
        `selector "${exp.selector}" should reference var(--${exp.token})`,
      ).toContain(`var(--${exp.token})`);
    });
  }

  it('does_NOT bind any operator-readable T3 surface to alert-red-reserved', () => {
    // Per audit §B.1 + lockdown §trust-band-palette: alert-red-reserved is
    // EXCLUSIVELY for the consumer-notice issuance path. It must NOT bleed
    // into operator-readable T3 dots/badges.
    // Allow .row-severity-dot.is-anomaly (ChainAnomalyDetected is the
    // bridge between operator and issuance path), but explicitly forbid
    // the legacy T3 dot bindings.
    const t3Line = BRIDGE.match(/\.severity-dot--t3\s*\{[^}]*\}/);

    expect(t3Line, '.severity-dot--t3 rule must exist').toBeTruthy();
    expect(t3Line![0], '.severity-dot--t3 must NOT use alert-red-reserved').not.toContain(
      'alert-red-reserved',
    );
  });
});
