"use client";

import type { Pair, Sort } from "@/lib/useBoard";

const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "New" },
  { id: "volume", label: "Top volume" },
  { id: "trades", label: "Most traded" },
];

const PAIRS: { id: Pair; label: string }[] = [
  { id: "all", label: "All" },
  { id: "eth", label: "ETH" },
  { id: "stock", label: "Stocks" },
];

/**
 * Sort and pair rail. The pair filter is here because a stock-paired launch is
 * a different market from an ETH one — traders want to see one or the other.
 */
export function BoardControls({
  sort,
  onSort,
  pair,
  onPair,
  count,
}: {
  sort: Sort;
  onSort: (s: Sort) => void;
  pair: Pair;
  onPair: (p: Pair) => void;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="seg inline-flex">
        {SORTS.map((s) => (
          <button key={s.id} type="button" className="seg-item" data-on={sort === s.id} onClick={() => onSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="seg inline-flex">
        {PAIRS.map((p) => (
          <button key={p.id} type="button" className="seg-item" data-on={pair === p.id} onClick={() => onPair(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <span className="tnum ml-auto text-[11px] text-faint">
        {count} {count === 1 ? "token" : "tokens"}
      </span>
    </div>
  );
}
