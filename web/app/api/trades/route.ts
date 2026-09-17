import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { handleError, ok, rateLimit } from "@/lib/server/http";
import { addressParam, hashParam, intParam, jsonBody } from "@/lib/server/validate";
import { verifyTrades } from "@/lib/server/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS =
  "token, trader, referrer, is_buy, quote, amount_quote, amount_eth, amount_token, fee_quote, fdv_eth, tx_hash, log_index, block_number, created_at";

/** GET /api/trades?token=0x… — recent fills, newest first. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = intParam(url.searchParams.get("limit"), 50, 1, 200);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 10_000);
    const token = url.searchParams.get("token");
    const trader = url.searchParams.get("trader");

    let query = supabaseAdmin()
      .from("trades")
      .select(COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (token) query = query.eq("token", addressParam(token, "token"));
    if (trader) query = query.eq("trader", addressParam(trader, "trader"));

    const { data, count, error } = await query;
    if (error) throw error;

    return ok({ trades: data ?? [], total: count ?? 0, limit, offset }, 5);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/trades — index a fill.
 *
 * Body is { tx_hash, token?, fdv_eth? }. Side, size, trader and quote asset all
 * come from the router's own Trade event, which is what makes the volume
 * numbers on the board worth showing. One tx can carry several fills; all of
 * them land. `(tx_hash, log_index)` is unique, so replaying a hash is a no-op.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(req, "trades:post", 60, 60_000);
    if (limited) return limited;

    const body = await jsonBody(req);
    const txHash = hashParam(body.tx_hash, "tx_hash");
    const expect = body.token ? addressParam(body.token, "token") : undefined;

    const fdv = Number(body.fdv_eth);
    const fdvEth = Number.isFinite(fdv) && fdv >= 0 ? fdv : null;

    const verified = await verifyTrades(txHash, expect);
    const rows = verified.map((t) => ({ ...t, fdv_eth: fdvEth }));

    const { data, error } = await supabaseAdmin()
      .from("trades")
      .upsert(rows, { onConflict: "tx_hash,log_index" })
      .select(COLUMNS);
    if (error) throw error;

    return ok({ trades: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}
