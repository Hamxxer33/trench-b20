import "server-only";

import { parseEventLogs, type Address, type Hash } from "viem";
import { factoryAbi } from "../abi";
import { ZERO } from "../addresses";
import { splitLegs, tradeEventAbi } from "../events";
import { chain, quoteDecimals, toFloat } from "./chain";
import { SERVER_FACTORY, SERVER_ROUTER, hasChainConfig } from "./env";
import { BadRequest } from "./validate";

/**
 * Every write to this API is proved against Base before it lands. The client
 * supplies only a tx hash; the amounts, addresses and sides below come out of
 * the receipt, so a forged body cannot inflate volume or fake a launch.
 */

export class NotVerified extends Error {
  readonly status = 422;
}

function requireChain() {
  if (!hasChainConfig()) {
    throw new NotVerified("Server is missing NEXT_PUBLIC_FACTORY / NEXT_PUBLIC_ROUTER");
  }
}

async function receiptOf(hash: Hash) {
  let receipt;
  try {
    receipt = await chain().getTransactionReceipt({ hash });
  } catch {
    throw new NotVerified("Transaction not found on Base yet");
  }
  if (receipt.status !== "success") throw new NotVerified("Transaction reverted");
  return receipt;
}

/** Factory-held metadata for a token, or null if the read fails. */
async function tokenProfile(token: Address) {
  try {
    return await chain().readContract({
      address: SERVER_FACTORY,
      abi: factoryAbi,
      functionName: "tokenProfiles",
      args: [token],
    });
  } catch {
    return null;
  }
}

async function blockTime(blockNumber: bigint): Promise<string> {
  try {
    const block = await chain().getBlock({ blockNumber });
    return new Date(Number(block.timestamp) * 1000).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export type VerifiedLaunch = {
  address: string;
  name: string;
  symbol: string;
  creator: string;
  quote: string;
  image: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  tx_hash: string;
  block_number: number;
  created_at: string;
};

/**
 * Confirm a launch tx really emitted `Launched` from our factory, then take
 * the token metadata from the factory's own profile storage.
 */
export async function verifyLaunch(txHash: Hash, expectToken?: Address): Promise<VerifiedLaunch> {
  requireChain();
  const receipt = await receiptOf(txHash);

  const logs = parseEventLogs({
    abi: factoryAbi,
    eventName: "Launched",
    logs: receipt.logs,
  }).filter((l) => l.address.toLowerCase() === SERVER_FACTORY.toLowerCase());

  if (logs.length === 0) throw new NotVerified("No Launched event from the Trench factory in that tx");

  const hit = expectToken
    ? logs.find((l) => l.args.token.toLowerCase() === expectToken.toLowerCase())
    : logs[0];
  if (!hit) throw new NotVerified("That tx did not launch the token you named");

  const token = hit.args.token as Address;

  // Profile is the on-chain source of truth for image/socials/quote.
  const profile = await tokenProfile(token);

  return {
    address: token.toLowerCase(),
    name: hit.args.name,
    symbol: hit.args.symbol,
    creator: (profile?.[1] || profile?.[0] || hit.args.creator).toLowerCase(),
    quote: (profile?.[7] ?? ZERO).toLowerCase(),
    image: profile?.[8] ?? "",
    description: profile?.[9] ?? "",
    website: profile?.[10] ?? "",
    twitter: profile?.[11] ?? "",
    telegram: profile?.[12] ?? "",
    tx_hash: txHash.toLowerCase(),
    block_number: Number(receipt.blockNumber),
    created_at: profile?.[3]
      ? new Date(Number(profile[3]) * 1000).toISOString()
      : await blockTime(receipt.blockNumber),
  };
}

export type VerifiedTrade = {
  token: string;
  trader: string;
  referrer: string;
  is_buy: boolean;
  quote: string;
  /** Quote-side size: what was spent on a buy, what was received on a sell. */
  amount_quote: number;
  /** Same figure, only when the quote is native ETH — keeps the legacy column honest. */
  amount_eth: number;
  amount_token: number;
  fee_quote: number;
  tx_hash: string;
  log_index: number;
  block_number: number;
  created_at: string;
};

/**
 * Confirm a trade tx emitted `Trade` from our router and price it in the
 * pool's real quote asset — ETH or the stock B20 it was paired against.
 */
export async function verifyTrades(txHash: Hash, expectToken?: Address): Promise<VerifiedTrade[]> {
  requireChain();
  const receipt = await receiptOf(txHash);

  const logs = parseEventLogs({
    abi: tradeEventAbi,
    eventName: "Trade",
    logs: receipt.logs,
  }).filter((l) => l.address.toLowerCase() === SERVER_ROUTER.toLowerCase());

  const matched = expectToken
    ? logs.filter((l) => l.args.token.toLowerCase() === expectToken.toLowerCase())
    : logs;

  if (matched.length === 0) throw new NotVerified("No Trade event from the Trench router in that tx");

  const at = await blockTime(receipt.blockNumber);

  return Promise.all(
    matched.map(async (log) => {
      const token = log.args.token as Address;

      const profile = await tokenProfile(token);
      const quote: Address = profile?.[7] ?? ZERO;

      const qDecimals = await quoteDecimals(quote);
      const isBuy = log.args.isBuy;

      const { quoteRaw, tokenRaw } = splitLegs(isBuy, log.args.amountIn, log.args.amountOut);
      const amountQuote = toFloat(quoteRaw, qDecimals);
      const isEthQuote = !quote || quote === ZERO;

      return {
        token: token.toLowerCase(),
        trader: log.args.trader.toLowerCase(),
        referrer: log.args.referrer.toLowerCase(),
        is_buy: isBuy,
        quote: quote.toLowerCase(),
        amount_quote: amountQuote,
        amount_eth: isEthQuote ? amountQuote : 0,
        amount_token: toFloat(tokenRaw, 18),
        fee_quote: toFloat(log.args.fee, qDecimals),
        tx_hash: txHash.toLowerCase(),
        log_index: log.logIndex,
        block_number: Number(receipt.blockNumber),
        created_at: at,
      };
    }),
  );
}

/** True if the factory recognises this address as one of ours. */
export async function isTrenchToken(token: Address): Promise<boolean> {
  requireChain();
  try {
    return (await chain().readContract({
      address: SERVER_FACTORY,
      abi: factoryAbi,
      functionName: "isTrench",
      args: [token],
    })) as boolean;
  } catch {
    throw new BadRequest("Could not reach Base to check that token");
  }
}
