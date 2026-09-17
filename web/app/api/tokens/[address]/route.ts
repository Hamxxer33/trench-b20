import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { fail, handleError, ok } from "@/lib/server/http";
import { addressParam } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tokens/0x… — one token, with its rolled-up trade stats. */
export async function GET(_req: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await ctx.params;
    const token = addressParam(address, "address");
    const sb = supabaseAdmin();

    const [tokenRes, statsRes] = await Promise.all([
      sb
        .from("tokens")
        .select(
          "address, name, symbol, creator, quote, image, description, website, twitter, telegram, tx_hash, block_number, created_at",
        )
        .eq("address", token)
        .maybeSingle(),
      sb.rpc("token_stats", { p_token: token }),
    ]);

    if (tokenRes.error) throw tokenRes.error;
    if (!tokenRes.data) return fail(404, "Token not indexed");

    const stats = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;

    return ok(
      {
        token: tokenRes.data,
        stats: {
          trades: Number(stats?.trades ?? 0),
          volumeQuote: Number(stats?.volume_quote ?? 0),
          volumeEth: Number(stats?.volume_eth ?? 0),
          buys: Number(stats?.buys ?? 0),
          sells: Number(stats?.sells ?? 0),
          traders: Number(stats?.traders ?? 0),
        },
      },
      10,
    );
  } catch (e) {
    return handleError(e);
  }
}
