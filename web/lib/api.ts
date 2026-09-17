/**
 * Browser-side client for the Trench backend.
 *
 * Indexing calls take a tx hash and nothing else that matters — the server
 * re-reads the receipt on Base and stores what the chain says, so there is no
 * point sending amounts from here.
 */

export type TokenRow = {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  quote: string;
  image: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  tx_hash: string;
  block_number: number;
  created_at: string;
};

export type TradeRow = {
  token: string;
  trader: string;
  referrer: string;
  is_buy: boolean;
  quote: string;
  amount_quote: number;
  amount_eth: number;
  amount_token: number;
  fee_quote: number;
  fdv_eth: number | null;
  tx_hash: string;
  log_index: number;
  block_number: number;
  created_at: string;
};

export type ProfileRow = {
  address: string;
  name: string;
  bio: string;
  avatar: string;
  website: string;
  twitter: string;
  telegram: string;
  global_referrer: string;
  updated_at: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.body instanceof FormData ? init?.headers : { "content-type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as T;
}

/** Indexing is best-effort: a failure here must never break a landed trade. */
async function quiet<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[api]", e);
    return null;
  }
}

export function listTokens(params: { q?: string; creator?: string; limit?: number; offset?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.creator) qs.set("creator", params.creator);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString();
  return call<{ tokens: TokenRow[]; total: number }>(`/api/tokens${suffix ? `?${suffix}` : ""}`);
}

export function getToken(address: string) {
  return call<{ token: TokenRow; stats: TokenStats }>(`/api/tokens/${address}`);
}

export type TokenStats = {
  trades: number;
  volumeQuote: number;
  volumeEth: number;
  buys: number;
  sells: number;
  traders: number;
};

/** Called right after a launch lands. Server proves it against the factory. */
export function indexToken(input: { tx_hash: string; address?: string }) {
  return quiet(call<{ token: TokenRow }>("/api/tokens", { method: "POST", body: JSON.stringify(input) }));
}

export function listTrades(params: { token?: string; trader?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.token) qs.set("token", params.token);
  if (params.trader) qs.set("trader", params.trader);
  if (params.limit) qs.set("limit", String(params.limit));
  const suffix = qs.toString();
  return call<{ trades: TradeRow[]; total: number }>(`/api/trades${suffix ? `?${suffix}` : ""}`);
}

/** Called right after a fill lands. Server proves it against the router. */
export function indexTrade(input: { tx_hash: string; token?: string; fdv_eth?: number }) {
  return quiet(call<{ trades: TradeRow[] }>("/api/trades", { method: "POST", body: JSON.stringify(input) }));
}

export type Stats = {
  volumeEth: number;
  volumeQuote: number;
  trades: number;
  traders: number;
  tokens: number;
  byToken: { token: string; volumeEth: number; volumeQuote: number; trades: number }[];
};

export function fetchStats() {
  return call<Stats>("/api/stats");
}

export function getProfile(address: string) {
  return call<{ profile: ProfileRow }>(`/api/profiles/${address}`);
}

/** Refresh the cached profile from TrenchProfiles after a setProfile tx. */
export function syncProfile(address: string) {
  return quiet(call<{ profile: ProfileRow }>(`/api/profiles/${address}`, { method: "POST" }));
}

export async function uploadLogo(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await call<{ url: string }>("/api/upload", { method: "POST", body: form });
  return res.url;
}
