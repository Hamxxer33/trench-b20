"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchStats, listTrades, type Stats, type TradeRow } from "./api";
import { searchLaunches } from "./stats";
import { useLaunches } from "./useLaunches";
import type { Launch } from "@/components/TokenCard";

export type Sort = "new" | "volume" | "trades";
export type Pair = "all" | "eth" | "stock";

const ZERO = "0x0000000000000000000000000000000000000000";

const EMPTY_STATS: Stats = {
  volumeEth: 0,
  volumeQuote: 0,
  trades: 0,
  traders: 0,
  tokens: 0,
  byToken: [],
};

export type BoardRow = Launch & {
  volumeEth: number;
  volumeQuote: number;
  trades: number;
};

/**
 * One place for everything the board renders: launches from the factory,
 * volume from /api/stats, and the live tape from /api/trades.
 *
 * Launches are on-chain truth and load without a backend; the volume columns
 * simply stay at zero if the API is not configured on this deploy.
 */
export function useBoard({ q = "", sort = "new", pair = "all" }: { q?: string; sort?: Sort; pair?: Pair } = {}) {
  const { launches, total, loading, error } = useLaunches();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [activity, setActivity] = useState<TradeRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      const [s, t] = await Promise.all([
        fetchStats().catch(() => EMPTY_STATS),
        listTrades({ limit: 30 })
          .then((r) => r.trades)
          .catch(() => [] as TradeRow[]),
      ]);
      if (cancelled) return;
      setStats(s);
      setActivity(t);
    }

    void pull();
    // The tape should move on its own; the board is a live market.
    const timer = setInterval(() => void pull(), 20_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const volumeByToken = useMemo(
    () => new Map(stats.byToken.map((v) => [v.token.toLowerCase(), v])),
    [stats.byToken],
  );

  const rows = useMemo<BoardRow[]>(() => {
    const merged = launches.map((l) => {
      const v = volumeByToken.get(l.token.toLowerCase());
      return {
        ...l,
        volumeEth: v?.volumeEth ?? 0,
        volumeQuote: v?.volumeQuote ?? 0,
        trades: v?.trades ?? 0,
      };
    });

    const byPair =
      pair === "all"
        ? merged
        : merged.filter((r) => {
            const isEth = !r.quote || r.quote === ZERO;
            return pair === "eth" ? isEth : !isEth;
          });

    const found = searchLaunches(byPair, q);

    const sorted = [...found];
    if (sort === "volume") sorted.sort((a, b) => b.volumeQuote - a.volumeQuote || b.trades - a.trades);
    else if (sort === "trades") sorted.sort((a, b) => b.trades - a.trades || b.volumeQuote - a.volumeQuote);
    else sorted.sort((a, b) => b.createdAt - a.createdAt);

    return sorted;
  }, [launches, volumeByToken, q, sort, pair]);

  /** Highest-volume launch, used for the spotlight. Falls back to the newest. */
  const spotlight = useMemo(() => {
    if (rows.length === 0) return null;
    const top = [...rows].sort((a, b) => b.volumeQuote - a.volumeQuote)[0];
    return top.volumeQuote > 0 ? top : rows[0];
  }, [rows]);

  const nameByToken = useMemo(() => {
    const m = new Map<string, { symbol: string; image: string }>();
    for (const l of launches) m.set(l.token.toLowerCase(), { symbol: l.symbol, image: l.image });
    return m;
  }, [launches]);

  return { rows, spotlight, stats, activity, nameByToken, total, loading, error };
}
