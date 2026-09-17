import type { Address } from "viem";
import { profilesAbi } from "@/lib/abi";
import { chain } from "@/lib/server/chain";
import { SERVER_PROFILES } from "@/lib/server/env";
import { fail, handleError, ok, rateLimit } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/server/supabaseAdmin";
import { addressParam } from "@/lib/server/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS =
  "address, name, bio, avatar, website, twitter, telegram, global_referrer, updated_at";

/**
 * TrenchProfiles is the source of truth; this table is a read cache so the
 * board can show names without an RPC round trip per row.
 */
async function readOnChain(account: Address) {
  if (!SERVER_PROFILES) return null;
  try {
    const p = (await chain().readContract({
      address: SERVER_PROFILES,
      abi: profilesAbi,
      functionName: "profiles",
      args: [account],
    })) as readonly [string, string, string, string, string, string, Address, boolean];
    if (!p[7]) return null; // never set
    return {
      address: account.toLowerCase(),
      name: p[0],
      bio: p[1],
      avatar: p[2],
      website: p[3],
      twitter: p[4],
      telegram: p[5],
      global_referrer: p[6].toLowerCase(),
      updated_at: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** GET /api/profiles/0x… — cached profile, falling back to a live read. */
export async function GET(_req: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await ctx.params;
    const account = addressParam(address, "address");

    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .select(COLUMNS)
      .eq("address", account)
      .maybeSingle();
    if (error) throw error;
    if (data) return ok({ profile: data, source: "cache" }, 15);

    const live = await readOnChain(account);
    if (!live) return fail(404, "No profile set");
    return ok({ profile: live, source: "chain" }, 15);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/profiles/0x… — refresh the cache from the contract.
 *
 * Takes no body on purpose: the values are read from TrenchProfiles, so
 * calling this for someone else can only ever copy what they already signed.
 */
export async function POST(req: Request, ctx: { params: Promise<{ address: string }> }) {
  try {
    const limited = rateLimit(req, "profiles:post", 30, 60_000);
    if (limited) return limited;

    const { address } = await ctx.params;
    const account = addressParam(address, "address");

    const live = await readOnChain(account);
    if (!live) return fail(404, "No profile set on-chain for that address");

    const { data, error } = await supabaseAdmin()
      .from("profiles")
      .upsert(live, { onConflict: "address" })
      .select(COLUMNS)
      .single();
    if (error) throw error;

    return ok({ profile: data, source: "chain" });
  } catch (e) {
    return handleError(e);
  }
}
