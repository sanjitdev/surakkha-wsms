/**
 * FilterChip.tsx — FE-1.3a page primitive.
 *
 * Per dim 4 + dim 5 §7, the inbox + audit-log + verify surfaces all share
 * the same filter-chip pattern: `<button aria-pressed>` inside a
 * `<div role="group" aria-label>` wrapper. This primitive is pure — it
 * never calls a hook or fetches data. The page owns the `filter` state
 * and the `chipCounts` derivation; the chip just renders the active
 * state via `aria-pressed`.
 *
 * Issue #3 (Critical — a11y correctness): chips used to be
 * `role="tab" aria-selected`, which contracts requires roving tabindex,
 * `aria-controls` pointing at the filtered panel, and arrow-key support.
 * Chips that filter the SAME panel don't behave as tabs — they're a
 * toggle group with `aria-pressed`. The role change is propagated to
 * every page that uses FilterChip; audit-log and verify-flow callers
 * still get the same visual affordance.
 */

export interface FilterChipProps {
  label: string;
  count?: number;
  dotColor?: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
}
export function FilterChip({ label, count, dotColor, active, onClick, testId }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-active={active ? 'true' : 'false'}
      data-testid={testId ?? `filter-chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`filter-chip${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {dotColor ? (
        <span className="filter-chip__dot" style={{ background: dotColor }} aria-hidden="true" />
      ) : null}
      <span>{label}</span>
      {typeof count === 'number' && count > 0 ? (
        <span className="filter-chip__count">{count}</span>
      ) : null}
    </button>
  );
}
