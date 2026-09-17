/**
 * Read-only Supabase access from the browser.
 *
 * Writes used to happen here with the anon key against open RLS policies,
 * which meant anyone holding that key — it ships in the bundle — could mint
 * fake launches and fake volume. All writes now go through /api/* , which
 * verifies them against Base first. See lib/api.ts.
 */

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

export { indexToken, indexTrade, uploadLogo } from "./api";
