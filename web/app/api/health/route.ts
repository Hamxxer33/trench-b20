import { chain } from "@/lib/server/chain";
import { SERVER_FACTORY, SERVER_ROUTER, hasAdminSupabase, hasChainConfig } from "@/lib/server/env";
import { handleError, ok } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — what the backend is actually wired to.
 *
 * Deliberately says whether a key is present, never what it is. Useful right
 * after a Vercel deploy to see which env var was missed.
 */
export async function GET() {
  try {
    const checks: Record<string, unknown> = {
      supabase: hasAdminSupabase(),
      contracts: hasChainConfig(),
      factory: SERVER_FACTORY || null,
      router: SERVER_ROUTER || null,
    };

    if (hasChainConfig()) {
      try {
        checks.block = Number(await chain().getBlockNumber());
      } catch {
        checks.block = null;
        checks.rpc = "unreachable";
      }
    }

    if (hasAdminSupabase()) {
      const { error } = await supabaseAdmin().from("tokens").select("address", { head: true, count: "exact" });
      checks.db = error ? "error" : "ok";
    }

    const ready = checks.supabase === true && checks.contracts === true && checks.db === "ok";
    return ok({ ready, ...checks });
  } catch (e) {
    return handleError(e);
  }
}
