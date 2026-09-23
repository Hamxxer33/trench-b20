"use client";

import Link from "next/link";
import type { Address } from "viem";
import { TokenMark } from "./Mark";
import { CopyAddress } from "./CopyAddress";
import { formatNum, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import { ZERO } from "@/lib/addresses";
import { useAppBase, withBase } from "@/lib/appBase";

export type Launch = {
  token: Address;
  creator: Address;
  name: string;
  symbol: string;
  createdAt: number;
  image: string;
  description: string;
  /** Quote asset the pool is paired against — ETH, or a stock B20. */
  quote?: Address;
};

export function PairBadge({ quote }: { quote?: Address }) {
  const q = quoteByAddress(quote);
  const isEth = !quote || quote === ZERO;
  return (
    <span className={isEth ? "pill pill-accent" : "pill pill-gold"}>
      {isEth ? "◆" : "▮"} {q.symbol}
    </span>
  );
}

/**
 * Grid tile for one launch. Ticker, pair and age read at a glance; volume and
 * fill count sit on the baseline so a column of tiles scans vertically.
 */
export function TokenCard({
  launch,
  rank,
}: {
  launch: Launch & { volumeQuote?: number; volumeEth?: number; trades?: number };
  rank?: number;
}) {
  const base = useAppBase();
  const q = quoteByAddress(launch.quote);
  const vol = launch.volumeQuote ?? 0;
  const trades = launch.trades ?? 0;

  return (
    // Stretched link rather than a link wrapping everything: the copy control
    // is a button, and a button inside an anchor is invalid and would navigate
    // on click. The overlay takes the card's clicks; content sits above it with
    // pointer events off, and only the copy button turns them back on.
    <div className="tile group flex flex-col gap-3 p-4">
      <Link
        href={withBase(base, `/token/${launch.token}`)}
        className="absolute inset-0 z-0"
        aria-label={`Open ${launch.name} ($${launch.symbol})`}
      />

      {rank !== undefined && rank < 3 && (
        <span className="pointer-events-none absolute right-3 top-3 z-10 pill pill-gold">#{rank + 1}</span>
      )}

      <div className="pointer-events-none relative z-10 flex items-start gap-3">
        <TokenMark address={launch.token} src={launch.image || undefined} size={46} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold leading-tight text-paper">{launch.name}</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="tnum text-xs font-medium text-lime">${launch.symbol}</span>
            <PairBadge quote={launch.quote} />
          </div>
        </div>
      </div>

      {launch.description ? (
        <p className="pointer-events-none relative z-10 line-clamp-2 min-h-[2.1rem] text-[12.5px] leading-snug text-mute">
          {launch.description}
        </p>
      ) : (
        <p className="pointer-events-none relative z-10 min-h-[2.1rem] text-[12.5px] italic leading-snug text-faint">
          No description.
        </p>
      )}

      <div className="pointer-events-none relative z-10 mt-auto grid grid-cols-2 gap-2 border-t border-line pt-3">
        <Metric label="Volume" value={vol > 0 ? `${formatNum(vol, 2)} ${q.symbol}` : "—"} />
        <Metric label="Fills" value={trades > 0 ? formatNum(trades, 0) : "—"} align="right" />
      </div>

      <div className="relative z-10 flex items-center justify-between text-[10px]">
        <CopyAddress value={launch.token} className="pointer-events-auto text-[10px]" />
        <span className="pointer-events-none tnum text-faint">
          {launch.createdAt ? timeAgo(launch.createdAt) : "new"}
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, align = "left" }: { label: string; value: string; align?: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="eyebrow">{label}</div>
      <div className="tnum mt-0.5 text-[13px] text-paper">{value}</div>
    </div>
  );
}

/** Compact row for lists where a grid would be too heavy (profile, search). */
export function TokenRow({ launch }: { launch: Launch }) {
  const base = useAppBase();
  return (
    <div className="group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-line bg-panel/70 px-3 py-2.5 transition hover:border-lime/40 hover:bg-panel2">
      <Link
        href={withBase(base, `/token/${launch.token}`)}
        className="absolute inset-0 z-0"
        aria-label={`Open ${launch.name} ($${launch.symbol})`}
      />
      <TokenMark address={launch.token} src={launch.image || undefined} size={36} />
      <div className="relative z-10 min-w-0">
        <div className="pointer-events-none flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold text-paper">{launch.name}</span>
          <span className="tnum text-[11px] text-lime">${launch.symbol}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <CopyAddress value={launch.token} className="text-[10px]" />
          {launch.createdAt > 0 && <span className="tnum text-faint">{timeAgo(launch.createdAt)}</span>}
        </div>
      </div>
      <span className="pointer-events-none relative z-10">
        <PairBadge quote={launch.quote} />
      </span>
    </div>
  );
}
