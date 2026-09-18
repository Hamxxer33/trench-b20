import { chain } from "@/lib/server/chain";
import {
  SERVER_FACTORY,
  SERVER_ROUTER,
  SUPABASE_SERVICE_KEY,
  SUPABASE_URL,
  hasAdminSupabase,
  hasChainConfig,
} from "@/lib/server/env";
import { handleError, ok } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health — what this deployment is actually wired to.
 *
 * Reports whether each key is present, never what it is. Env vars are baked
 * into a deployment when it builds, so this answers the question that actually
 * matters after setting one in the dashboard: did the redeploy pick it up?
 */
/**
 * The role a Supabase key carries, without contacting anything.
 *
 * Legacy keys are JWTs with a `role` claim, so pasting the anon key into
 * SUPABASE_SERVICE_ROLE_KEY — the likeliest setup mistake, and one that leaves
 * reads working while every write is silently denied — shows up as "anon".
 * Newer `sb_secret_…` keys are opaque, so there is nothing to read.
 */
function roleOf(key: string): string {
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  const parts = key.split(".");
  if (parts.length !== 3) return "unknown";
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : "unknown";
  } catch {
    return "unknown";
  }
}

export async function GET() {
  try {
    const checks: Record<string, unknown> = {
      supabaseUrl: Boolean(SUPABASE_URL),
      // Distinct from `supabaseUrl`: with the URL set but the key missing, every
      // write 503s while reads look fine, which is easy to misread as healthy.
      serviceKey: Boolean(SUPABASE_SERVICE_KEY),
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
      const sb = supabaseAdmin();

      const { error: readError } = await sb.from("tokens").select("address", { head: true, count: "exact" });
      checks.dbRead = readError ? readError.message : "ok";

      // RLS now blocks every write that is not service-role, so "can read" no
      // longer implies "can index". Checked by reading the key's own role claim
      // rather than by writing: a probe row would have to be inserted into
      // `tokens`, and that lands on the board.
      checks.keyRole = roleOf(SUPABASE_SERVICE_KEY);

      // Aggregation lives in Postgres; a missing function only shows up here.
      const { error: rpcError } = await sb.rpc("trade_totals");
      checks.aggregates = rpcError ? rpcError.message : "ok";
    }

    const ready =
      checks.serviceKey === true &&
      checks.contracts === true &&
      checks.dbRead === "ok" &&
      checks.keyRole !== "anon" &&
      checks.aggregates === "ok";

    return ok({ ready, ...checks });
  } catch (e) {
    return handleError(e);
  }
}
