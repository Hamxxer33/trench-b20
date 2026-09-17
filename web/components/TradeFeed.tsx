"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";
import { listTrades, type TradeRow } from "@/lib/api";
import { BASESCAN } from "@/lib/addresses";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";

/**
 * Recent fills for one token, polled off /api/trades. Silent when the backend
 * is not configured — the trade panel still works without an index.
 */
export function TradeFeed({ token }: { token: Address }) {
  const [trades, setTrades] = useState<TradeRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const r = await listTrades({ token, limit: 25 });
        if (!cancelled) setTrades(r.trades);
      } catch {
        if (!cancelled) setTrades([]);
      }
    }
    void pull();
    const timer = setInterval(() => void pull(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="live-dot" />
        <h3 className="text-[15px] font-semibold">Recent fills</h3>
        {trades && trades.length > 0 && (
          <span className="tnum ml-auto text-[11px] text-faint">{trades.length}</span>
        )}
      </div>

      {trades === null ? (
        <div className="grid gap-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : trades.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-faint">
          No fills indexed yet. Be the first to trade it.
        </p>
      ) : (
        <div className="max-h-[22rem] overflow-y-auto">
          {trades.map((t) => {
            const q = quoteByAddress(t.quote);
            const age = Math.floor(new Date(t.created_at).getTime() / 1000);
            return (
              <a
                key={`${t.tx_hash}-${t.log_index}`}
                href={`${BASESCAN}/tx/${t.tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0 hover:bg-panel2"
              >
                <span className={t.is_buy ? "pill pill-up" : "pill pill-down"}>{t.is_buy ? "BUY" : "SELL"}</span>
                <span className="tnum min-w-0 truncate text-[12.5px]">
                  {formatNum(t.amount_quote, 4)} <span className="text-faint">{q.symbol}</span>
                </span>
                <span className="tnum text-right text-[10px] text-faint">
                  {shortAddr(t.trader)}
                  {age > 0 && <span className="ml-2">{timeAgo(age)}</span>}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
