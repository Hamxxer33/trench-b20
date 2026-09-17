/**
 * Pure helpers shared by the verifier. No `server-only` import here on
 * purpose, so the amount math stays unit-testable.
 */

/** TrenchRouter's Trade event. lib/abi.ts carries the router's functions only. */
export const tradeEventAbi = [
  {
    type: "event",
    name: "Trade",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "referrer", type: "address", indexed: true },
      { name: "isBuy", type: "bool", indexed: false },
      { name: "amountIn", type: "uint256", indexed: false },
      { name: "amountOut", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "comment", type: "bytes32", indexed: false },
    ],
  },
] as const;

/**
 * Scale a raw integer amount by `decimals`.
 *
 * Splitting whole from fraction first keeps large balances exact to the unit —
 * Number(raw) / 10**decimals loses the low digits well before a 1e9 supply.
 */
export function toFloat(raw: bigint, decimals: number): number {
  if (raw === 0n) return 0;
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const frac = raw % scale;
  return Number(whole) + Number(frac) / Number(scale);
}

/**
 * Which leg of a fill is denominated in the quote asset.
 * Exact-in both directions: a buy spends quote, a sell receives it.
 */
export function splitLegs(isBuy: boolean, amountIn: bigint, amountOut: bigint) {
  return {
    quoteRaw: isBuy ? amountIn : amountOut,
    tokenRaw: isBuy ? amountOut : amountIn,
  };
}
