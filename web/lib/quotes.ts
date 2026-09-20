import type { Address } from "viem";

// Inlined rather than imported from ./addresses so this module stays
// dependency-free and can be unit tested directly. It is the zero address,
// not a configurable value.
const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export const ETH_QUOTE = {
  symbol: "ETH",
  name: "Ethereum",
  address: ZERO,
  decimals: 18,
} as const;

export const STOCK_QUOTES = [
  { symbol: "AAPL", name: "Apple", address: "0xb200000000000000000000C2e324d24d7eEcd1fb" as Address, decimals: 8 },
  { symbol: "AMZN", name: "Amazon", address: "0xb200000000000000000000d9192b6B456483C2E8" as Address, decimals: 8 },
  { symbol: "GOOGL", name: "Alphabet", address: "0xb2000000000000000000002D0BA3164cc74f58B7" as Address, decimals: 8 },
  { symbol: "META", name: "Meta", address: "0xb2000000000000000000008bC8786B856E61707C" as Address, decimals: 8 },
  { symbol: "MSFT", name: "Microsoft", address: "0xB200000000000000000000Ab99cFa739E253872B" as Address, decimals: 8 },
  { symbol: "MSTR", name: "Strategy", address: "0xb2000000000000000000004884b426556b92883d" as Address, decimals: 8 },
  { symbol: "NVDA", name: "NVIDIA", address: "0xb20000000000000000000078ee7ce2fE4908108C" as Address, decimals: 8 },
  { symbol: "SNDK", name: "Sandisk", address: "0xb200000000000000000000397293Cb8cda9a10c5" as Address, decimals: 8 },
  { symbol: "SPCX", name: "SpaceX", address: "0xb2000000000000000000007b9fcbd005511aCBd5" as Address, decimals: 8 },
  { symbol: "TSLA", name: "Tesla", address: "0xb2000000000000000000001e800a7f5189430cD0" as Address, decimals: 8 },
] as const;

export type Quote = { symbol: string; name: string; address: Address; decimals: number };

export function quoteByAddress(addr: string | undefined): Quote {
  if (!addr || addr === ZERO) return ETH_QUOTE;
  const hit = STOCK_QUOTES.find((q) => q.address.toLowerCase() === addr.toLowerCase());
  return hit ?? { symbol: "TOKEN", name: "Quote", address: addr as Address, decimals: 18 };
}

/**
 * Every asset a Trench pool can settle fees in: native ETH, plus each stock
 * B20. Escrow keys balances per asset, so anything missing here is a balance
 * the UI can neither show nor claim.
 */
export const CLAIMABLE_ASSETS: Quote[] = [ETH_QUOTE, ...STOCK_QUOTES];
