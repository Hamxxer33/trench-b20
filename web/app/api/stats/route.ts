import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { handleError, ok } from "@/lib/server/http";
import { intParam } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stats — board totals plus the top tokens by volume.
 *
 * Aggregated in Postgres. The old client path pulled every trade row into the
 * browser to sum it, which stopped being viable the moment the board got busy.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = intParam(url.searchParams.get("limit"), 12, 1, 50);
    const sb = supabaseAdmin();

    const [totalsRes, byTokenRes] = await Promise.all([
      sb.rpc("trade_totals"),
      sb.rpc("top_tokens", { p_limit: limit }),
    ]);

    if (totalsRes.error) throw totalsRes.error;
    if (byTokenRes.error) throw byTokenRes.error;

    const totals = Array.isArray(totalsRes.data) ? totalsRes.data[0] : totalsRes.data;

    return ok(
      {
        volumeEth: Number(totals?.volume_eth ?? 0),
        volumeQuote: Number(totals?.volume_quote ?? 0),
        trades: Number(totals?.trades ?? 0),
        traders: Number(totals?.traders ?? 0),
        tokens: Number(totals?.tokens ?? 0),
        byToken: (byTokenRes.data ?? []).map(
          (r: { token: string; volume_eth: number; volume_quote: number; trades: number }) => ({
            token: r.token,
            volumeEth: Number(r.volume_eth ?? 0),
            volumeQuote: Number(r.volume_quote ?? 0),
            trades: Number(r.trades ?? 0),
          }),
        ),
      },
      15,
    );
  } catch (e) {
    return handleError(e);
  }
}
