import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { handleError, ok, rateLimit } from "@/lib/server/http";
import { addressParam, hashParam, intParam, jsonBody } from "@/lib/server/validate";
import { verifyLaunch } from "@/lib/server/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS =
  "address, name, symbol, creator, quote, image, description, website, twitter, telegram, tx_hash, block_number, created_at";

/** GET /api/tokens — newest launches, with optional search and creator filter. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = intParam(url.searchParams.get("limit"), 40, 1, 100);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 10_000);
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
    const creator = url.searchParams.get("creator");

    let query = supabaseAdmin()
      .from("tokens")
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (creator) query = query.eq("creator", addressParam(creator, "creator"));
    if (q) {
      // Postgrest `or` needs commas escaped; the slice above keeps this bounded.
      const safe = q.replace(/[,()]/g, " ");
      query = query.or(`name.ilike.%${safe}%,symbol.ilike.%${safe}%,address.ilike.%${safe}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return ok({ tokens: data ?? [], total: count ?? 0, limit, offset }, 10);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/tokens — index a launch.
 *
 * Body is just { tx_hash, address? }. Everything stored is read back off the
 * chain, so a caller cannot invent a token or attribute one to someone else.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, "tokens:post", 10, 60_000);
    if (limited) return limited;

    const body = await jsonBody(req);
    const txHash = hashParam(body.tx_hash, "tx_hash");
    const expect = body.address ? addressParam(body.address, "address") : undefined;

    const launch = await verifyLaunch(txHash, expect);

    const { data, error } = await supabaseAdmin()
      .from("tokens")
      .upsert(launch, { onConflict: "address" })
      .select(COLUMNS)
      .single();
    if (error) throw error;

    return ok({ token: data });
  } catch (e) {
    return handleError(e);
  }
}
