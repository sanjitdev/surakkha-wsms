/**
 * FilterChip.tsx — FE-1.3a page primitive.
 *
 * Per dim 4 + dim 5 §7, the inbox + audit-log + verify surfaces all share
 * the same filter-chip pattern: `<button role="tab" aria-selected>` with
 * an optional dot indicator + count badge. This primitive is pure — it
 * never calls a hook or fetches data. The page owns the `filter` state
 * and the `chipCounts` derivation; the chip just renders the active class
 * when its `active` prop is true.
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
      role="tab"
      aria-selected={active}
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
