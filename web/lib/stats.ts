import { fetchStats, type Stats } from "./api";

export type TokenVolume = {
  token: string;
  volumeEth: number;
  volumeQuote: number;
  trades: number;
};

const EMPTY: Stats = {
  volumeEth: 0,
  volumeQuote: 0,
  trades: 0,
  traders: 0,
  tokens: 0,
  byToken: [],
};

/**
 * Board totals, aggregated in Postgres behind /api/stats. The previous version
 * selected every trade row into the browser and summed it there.
 */
export async function fetchTradeStats(): Promise<Stats> {
  try {
    return await fetchStats();
  } catch {
    return EMPTY;
  }
}

export function searchLaunches<T extends { name: string; symbol: string; token: string }>(rows: T[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(s) ||
      r.symbol.toLowerCase().includes(s) ||
      r.token.toLowerCase().includes(s),
  );
}
