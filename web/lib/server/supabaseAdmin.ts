import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdminSupabase } from "./env";

let admin: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS — only reachable from route handlers,
 * which verify every write against Base before calling it.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!admin) {
    const { url, key } = requireAdminSupabase();
    admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-trench-server": "1" } },
    });
  }
  return admin;
}
