"use client";

import Link from "next/link";
import { TokenMark } from "./Mark";
import { PairBadge } from "./TokenCard";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import type { BoardRow } from "@/lib/useBoard";

/**
 * The board's headline token — highest volume, or the newest launch before any
 * trading has happened. Gives the page something to lead with that is not a
 * marketing block.
 */
export function Spotlight({ row }: { row: BoardRow }) {
  const q = quoteByAddress(row.quote);
  const traded = row.volumeQuote > 0;

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-lime/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="pill pill-accent">
          <span className="live-dot" /> {traded ? "Top volume" : "Latest launch"}
        </span>
        <PairBadge quote={row.quote} />
        {row.createdAt > 0 && <span className="pill">{timeAgo(row.createdAt)} old</span>}
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-5">
        <TokenMark address={row.token} src={row.image || undefined} size={72} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-3xl sm:text-4xl">{row.name}</h2>
          <p className="tnum mt-1 text-sm text-lime">
            ${row.symbol} <span className="text-faint">/ {q.symbol}</span>
          </p>
        </div>
        <Link href={`/token/${row.token}`} className="btn shrink-0">
          Trade ${row.symbol}
        </Link>
      </div>

      {row.description && <p className="relative mt-4 max-w-2xl text-sm text-mute">{row.description}</p>}

      <div className="relative mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Cell k="Volume" v={traded ? `${formatNum(row.volumeQuote, 3)} ${q.symbol}` : "—"} />
        <Cell k="Fills" v={row.trades > 0 ? formatNum(row.trades, 0) : "—"} />
        <Cell k="Supply" v="1B" />
        <Cell k="Liquidity" v="Locked" accent />
      </div>

      <p className="tnum relative mt-3 text-[10px] text-faint">
        {shortAddr(row.token)} · creator {shortAddr(row.creator)}
      </p>
    </div>
  );
}

function Cell({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-panel px-4 py-3">
      <div className="eyebrow">{k}</div>
      <div className={`tnum mt-1 text-[15px] ${accent ? "text-up" : "text-paper"}`}>{v}</div>
    </div>
  );
}
