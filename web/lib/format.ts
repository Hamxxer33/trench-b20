import { formatEther, type Address, type Hex, encodeAbiParameters, keccak256 } from "viem";

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toFixed(digits);
  if (n >= 0.0001) return n.toFixed(4);
  return n.toExponential(2);
}

export function formatEth(wei: bigint, digits = 4) {
  const n = Number(formatEther(wei));
  return `${formatNum(n, digits)} ETH`;
}

export function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000) - ts);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function poolId(token: Address): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        {
          type: "tuple",
          components: [
            { name: "currency0", type: "address" },
            { name: "currency1", type: "address" },
            { name: "fee", type: "uint24" },
            { name: "tickSpacing", type: "int24" },
            { name: "hooks", type: "address" },
          ],
        },
      ],
      [
        {
          currency0: "0x0000000000000000000000000000000000000000",
          currency1: token,
          fee: 0,
          tickSpacing: 200,
          hooks: "0x0000000000000000000000000000000000000000",
        },
      ],
    ),
  );
}

/** FDV in ETH from Uniswap v4 sqrtPriceX96, token as currency1 vs native ETH. */
export function fdvEthFromSqrtPrice(sqrtPriceX96: bigint, totalSupply = 10n ** 27n) {
  if (sqrtPriceX96 === 0n) return 0;
  const q96 = 2n ** 96n;
  const priceX192 = sqrtPriceX96 * sqrtPriceX96;
  if (priceX192 === 0n) return 0;
  const tokensPerEth = (priceX192 * 10n ** 18n) / (q96 * q96);
  if (tokensPerEth === 0n) return 0;
  const fdvWei = (totalSupply * 10n ** 18n) / tokensPerEth;
  return Number(formatEther(fdvWei));
}

export function identiconStops(address: string) {
  const h = Number.parseInt(address.slice(2, 8), 16);
  const a = h % 360;
  const b = (h * 7) % 360;
  return [`hsl(${a} 80% 52%)`, `hsl(${b} 70% 38%)`];
}
