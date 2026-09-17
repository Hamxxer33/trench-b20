"use client";

import Link from "next/link";
import type { Address } from "viem";
import { TokenMark } from "./Mark";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import { ZERO } from "@/lib/addresses";

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
  const q = quoteByAddress(launch.quote);
  const vol = launch.volumeQuote ?? 0;
  const trades = launch.trades ?? 0;

  return (
    <Link href={`/token/${launch.token}`} className="tile group flex flex-col gap-3 p-4">
      {rank !== undefined && rank < 3 && (
        <span className="absolute right-3 top-3 pill pill-gold">#{rank + 1}</span>
      )}

      <div className="flex items-start gap-3">
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
        <p className="line-clamp-2 min-h-[2.1rem] text-[12.5px] leading-snug text-mute">{launch.description}</p>
      ) : (
        <p className="min-h-[2.1rem] text-[12.5px] italic leading-snug text-faint">No description.</p>
      )}

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-line pt-3">
        <Metric label="Volume" value={vol > 0 ? `${formatNum(vol, 2)} ${q.symbol}` : "—"} />
        <Metric label="Fills" value={trades > 0 ? formatNum(trades, 0) : "—"} align="right" />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="tnum text-faint">{shortAddr(launch.token)}</span>
        <span className="tnum text-faint">{launch.createdAt ? timeAgo(launch.createdAt) : "new"}</span>
      </div>
    </Link>
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
  return (
    <Link
      href={`/token/${launch.token}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-line bg-panel/70 px-3 py-2.5 transition hover:border-lime/40 hover:bg-panel2"
    >
      <TokenMark address={launch.token} src={launch.image || undefined} size={36} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold text-paper">{launch.name}</span>
          <span className="tnum text-[11px] text-lime">${launch.symbol}</span>
        </div>
        <span className="tnum text-[10px] text-faint">
          {shortAddr(launch.token)}
          {launch.createdAt ? ` · ${timeAgo(launch.createdAt)}` : ""}
        </span>
      </div>
      <PairBadge quote={launch.quote} />
    </Link>
  );
}
