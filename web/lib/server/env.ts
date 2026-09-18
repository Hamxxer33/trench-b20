import "server-only";

import { FACTORY, ROUTER, ZERO } from "../addresses";

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

/**
 * Addresses the verifier trusts. Anything not emitted by these is rejected.
 * Shared with the client so the server can never end up proving trades against
 * a different deployment than the one the board is reading.
 */
export { FACTORY as SERVER_FACTORY, ROUTER as SERVER_ROUTER, PROFILES as SERVER_PROFILES } from "../addresses";

export function hasChainConfig() {
  return Boolean(FACTORY && ROUTER && FACTORY !== ZERO && ROUTER !== ZERO);
}

/** Storage bucket for launch logos. */
export const LOGO_BUCKET = process.env.LOGO_BUCKET ?? "logos";

export const MAX_LOGO_BYTES = Number(process.env.MAX_LOGO_BYTES ?? 3 * 1024 * 1024);
