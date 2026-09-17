import "server-only";

import type { Address } from "viem";

/**
 * Server-side configuration. Never import this from a "use client" module —
 * `server-only` makes that a build error rather than a leaked service key.
 */

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/** Service-role key. Bypasses RLS, so it must stay server-side. */
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function hasAdminSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

export function requireAdminSupabase() {
  return { url: req("SUPABASE_URL"), key: req("SUPABASE_SERVICE_ROLE_KEY") };
}

/**
 * Server RPC. Prefer a private, higher-limit endpoint (Alchemy/QuickNode) —
 * every write to this API costs one receipt fetch plus a few reads.
 */
export const SERVER_RPC_URL =
  process.env.RPC_URL ??
  process.env.NEXT_PUBLIC_RPC_URL ??
  "https://mainnet.base.org";

/** Addresses the verifier trusts. Anything not emitted by these is rejected. */
export const SERVER_FACTORY = (process.env.NEXT_PUBLIC_FACTORY ?? "") as Address;
export const SERVER_ROUTER = (process.env.NEXT_PUBLIC_ROUTER ?? "") as Address;
export const SERVER_PROFILES = (process.env.NEXT_PUBLIC_PROFILES ?? "") as Address;

export function hasChainConfig() {
  return Boolean(SERVER_FACTORY && SERVER_ROUTER);
}

/** Storage bucket for launch logos. */
export const LOGO_BUCKET = process.env.LOGO_BUCKET ?? "logos";

export const MAX_LOGO_BYTES = Number(process.env.MAX_LOGO_BYTES ?? 3 * 1024 * 1024);
