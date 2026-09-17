"use client";

import { formatNum } from "@/lib/format";
import type { Stats } from "@/lib/api";

/**
 * Protocol-level numbers. Volume is labelled "ETH pairs" on purpose: stock
 * pairs settle in shares, and summing those into an ETH figure would be a lie.
 */
export function StatStrip({ stats, tokens, loading }: { stats: Stats; tokens: number; loading?: boolean }) {
  const cells = [
    { k: "Tokens launched", v: loading ? null : formatNum(tokens, 0) },
    { k: "Fills indexed", v: formatNum(stats.trades, 0) },
    { k: "Volume · ETH pairs", v: `${formatNum(stats.volumeEth, 2)} ETH` },
    { k: "Traders", v: formatNum(stats.traders, 0) },
    { k: "Swap fee", v: "1%" },
    { k: "Creator / platform / ref", v: "50 / 30 / 20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((c) => (
        <div key={c.k} className="bg-panel px-4 py-3.5">
          <div className="eyebrow">{c.k}</div>
          {c.v === null ? (
            <div className="skeleton mt-1.5 h-5 w-16" />
          ) : (
            <div className="tnum mt-1 text-[17px] text-paper">{c.v}</div>
          )}
        </div>
      ))}
    </div>
  );
}
