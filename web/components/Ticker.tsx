"use client";

import Link from "next/link";
import type { TradeRow } from "@/lib/api";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";

/**
 * Live tape of recent fills.
 *
 * Duplicated once so the CSS marquee can loop seamlessly at -50%. Renders
 * nothing at all when there is no activity — an empty scrolling bar reads as
 * broken, and the board has a proper empty state elsewhere.
 */
export function Ticker({
  trades,
  meta,
}: {
  trades: TradeRow[];
  meta: Map<string, { symbol: string; image: string }>;
}) {
  if (trades.length === 0) return null;
  const loop = [...trades, ...trades];

  return (
    <div className="relative overflow-hidden border-y border-line bg-panel/60">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-void to-transparent" />
      <div className="marquee py-2">
        {loop.map((t, i) => (
          <Fill key={`${t.tx_hash}-${t.log_index}-${i}`} trade={t} meta={meta} />
        ))}
      </div>
    </div>
  );
}

function Fill({
  trade,
  meta,
}: {
  trade: TradeRow;
  meta: Map<string, { symbol: string; image: string }>;
}) {
  const q = quoteByAddress(trade.quote);
  const symbol = meta.get(trade.token.toLowerCase())?.symbol ?? shortAddr(trade.token);
  const age = Math.floor(new Date(trade.created_at).getTime() / 1000);

  return (
    <Link
      href={`/token/${trade.token}`}
      className="mx-1 flex shrink-0 items-center gap-2 rounded-lg px-3 py-1 hover:bg-panel2"
    >
      <span className={trade.is_buy ? "pill pill-up" : "pill pill-down"}>{trade.is_buy ? "BUY" : "SELL"}</span>
      <span className="text-[12.5px] font-semibold text-paper">${symbol}</span>
      <span className="tnum text-[11px] text-mute">
        {formatNum(trade.amount_quote, 3)} {q.symbol}
      </span>
      <span className="tnum text-[10px] text-faint">{shortAddr(trade.trader)}</span>
      {age > 0 && <span className="tnum text-[10px] text-faint">{timeAgo(age)}</span>}
    </Link>
  );
}
