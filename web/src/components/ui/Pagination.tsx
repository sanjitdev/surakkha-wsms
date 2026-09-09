/**
 * Pagination.tsx — FE-B5b sub-component.
 *
 * Prev/next buttons + page chips + page-size <Dropdown> (B5a). Decoupled
 * from <Table> per the design note — caller slices `rows` and just passes
 * `page`/`pageSize`/`total` props.
 */
import { type ReactNode, useMemo } from 'react';
import { Button } from './Button';
import { Dropdown, type DropdownOption } from './Dropdown';
import { DropdownMode } from '../../types/domain';
import type { PaginationProps } from './Table.types';

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];
const MAX_VISIBLE_CHIPS = 7;

function clamp(n: number, lo: number, hi: number): number {
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
export function Pagination(props: PaginationProps): ReactNode {
  const {
    page,
    pageSize,
    total,
    onPageChange,
    pageSizeOptions = DEFAULT_PAGE_SIZES,
    onPageSizeChange,
    testId = 'pagination',
  } = props;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, totalPages);

  const chips = useMemo<number[]>(() => {
    if (totalPages <= MAX_VISIBLE_CHIPS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    // Sliding window: always show 1, last, current ±2.
    const around = new Set<number>([1, totalPages, safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2]);
    const arr = Array.from(around)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);

    return arr;
  }, [totalPages, safePage]);

  const sizeOptions: DropdownOption<number>[] = useMemo(() => pageSizeOptions.map((n) => {
      return { value: n, label: `${n} / page` };
    }), [pageSizeOptions]);

  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;
  const showingFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = Math.min(total, safePage * pageSize);

  return (
    <nav className="pagination" data-testid={testId} aria-label="Pagination">
      <div className="pagination__summary" data-testid={`${testId}-summary`}>
        <span>
          Showing <strong>{showingFrom}</strong>–<strong>{showingTo}</strong> of <strong>{total}</strong>
        </span>
      </div>
      <div className="pagination__controls">
        <Button
          variant="ghost"
          size="sm"
          disabled={prevDisabled}
          onClick={() => {
            onPageChange(safePage - 1);
          }}
          testId={`${testId}-prev`}
        >
          ← Prev
        </Button>
        <ol className="pagination__chips" data-testid={`${testId}-chips`}>
          {chips.map((p, idx) => {
            const prev: number | undefined = chips[idx - 1];

            // chips[-1] is undefined at runtime; TS treats it as `number`. This
            // `isGap` check opts out of the no-base-to-string / strict-check
            // lint family by re-asserting the narrowed runtime type.
            const isGap = typeof prev === 'number' && p - prev > 1;

            return (
              <li key={p} className="pagination__chip-wrap">
                {isGap ? <span className="pagination__ellipsis" aria-hidden="true">…</span> : null}
                <button
                  type="button"
                  className={`pagination__chip ${p === safePage ? 'pagination__chip--active' : ''}`.trim()}
                  aria-current={p === safePage ? 'page' : undefined}
                  data-testid={`${testId}-page-${p}`}
                  onClick={() => {
                    onPageChange(p);
                  }}
                >
                  {p}
                </button>
              </li>
            );
          })}
        </ol>
        <Button
          variant="ghost"
          size="sm"
          disabled={nextDisabled}
          onClick={() => {
            onPageChange(safePage + 1);
          }}
          testId={`${testId}-next`}
        >
          Next →
        </Button>
      </div>
      {onPageSizeChange !== undefined ? (
        <div className="pagination__size">
          <Dropdown<number>
            options={sizeOptions}
            mode={DropdownMode.Single}
            value={pageSize}
            onChange={(v) => {
              if (v !== null) onPageSizeChange(v);
            }}
            placeholder="Page size"
            testId={`${testId}-size`}
          />
        </div>
      ) : null}
    </nav>
  );
}
