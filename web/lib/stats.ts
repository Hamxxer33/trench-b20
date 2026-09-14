import { supabase } from "./supabase";

export type TokenVolume = {
  token: string;
  volumeEth: number;
  trades: number;
};

export async function fetchTradeStats() {
  const sb = supabase();
  if (!sb) return { volumeEth: 0, trades: 0, byToken: [] as TokenVolume[] };

  const { data, error } = await sb.from("trades").select("token, amount_eth, is_buy");
  if (error || !data) return { volumeEth: 0, trades: 0, byToken: [] as TokenVolume[] };

  const map = new Map<string, TokenVolume>();
  let volumeEth = 0;
  for (const row of data) {
    const amt = Number(row.amount_eth) || 0;
    volumeEth += amt;
    const key = String(row.token).toLowerCase();
    const cur = map.get(key) ?? { token: key, volumeEth: 0, trades: 0 };
    cur.volumeEth += amt;
    cur.trades += 1;
    map.set(key, cur);
  }

  const byToken = [...map.values()].sort((a, b) => b.volumeEth - a.volumeEth);
  return { volumeEth, trades: data.length, byToken };
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
