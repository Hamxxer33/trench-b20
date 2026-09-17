import "server-only";

import { createPublicClient, http, type Address, type PublicClient } from "viem";
import { base } from "viem/chains";
import { SERVER_RPC_URL } from "./env";
import { erc20Abi } from "../abi";
import { ZERO } from "../addresses";

let client: PublicClient | null = null;

export function chain(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: base,
      transport: http(SERVER_RPC_URL, { batch: true, retryCount: 2 }),
    }) as PublicClient;
  }
  return client;
}

const decimalsCache = new Map<string, number>();

/**
 * Decimals for a quote asset. ETH is the zero address and has no contract,
 * so it short-circuits to 18. Stock B20s are 8, but we read rather than assume.
 */
export async function quoteDecimals(quote: Address): Promise<number> {
  if (!quote || quote === ZERO) return 18;
  const key = quote.toLowerCase();
  const hit = decimalsCache.get(key);
  if (hit !== undefined) return hit;
  try {
    const d = await chain().readContract({
      address: quote,
      abi: erc20Abi,
      functionName: "decimals",
    });
    decimalsCache.set(key, Number(d));
    return Number(d);
  } catch {
    decimalsCache.set(key, 18);
    return 18;
  }
}

export { toFloat } from "../events";
