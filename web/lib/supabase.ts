import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabase() {
  return Boolean(url && anon);
}

let client: SupabaseClient | null = null;

export function supabase() {
  if (!hasSupabase()) return null;
  if (!client) client = createClient(url, anon);
  return client;
}

export async function uploadLogo(file: File) {
  const sb = supabase();
  if (!sb) throw new Error("Supabase is not configured yet.");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from("logos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  const { data } = sb.storage.from("logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function indexToken(row: {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  image?: string;
  description?: string;
  tx_hash?: string;
}) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("tokens").upsert({
    address: row.address.toLowerCase(),
    name: row.name,
    symbol: row.symbol,
    creator: row.creator.toLowerCase(),
    image: row.image ?? "",
    description: row.description ?? "",
    tx_hash: row.tx_hash ?? "",
  });
}

export async function indexTrade(row: {
  token: string;
  trader: string;
  is_buy: boolean;
  amount_eth: number;
  tx_hash: string;
  fdv_eth?: number;
}) {
  const sb = supabase();
  if (!sb) return;
  await sb.from("trades").insert({
    token: row.token.toLowerCase(),
    trader: row.trader.toLowerCase(),
    is_buy: row.is_buy,
    amount_eth: row.amount_eth,
    tx_hash: row.tx_hash,
    fdv_eth: row.fdv_eth ?? null,
  });
}
