import type { Address } from "viem";

export const BASE_CHAIN_ID = 8453;

export const B20_FACTORY =
  "0xB20f000000000000000000000000000000000000" as Address;

export const V4_POOL_MANAGER =
  "0x498581fF718922c3f8e6A244956aF099B2652b2b" as Address;

export const V4_STATE_VIEW =
  "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71" as Address;

export const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export const FACTORY = (process.env.NEXT_PUBLIC_FACTORY ?? ZERO) as Address;
export const ROUTER = (process.env.NEXT_PUBLIC_ROUTER ?? ZERO) as Address;
export const LOCKER = (process.env.NEXT_PUBLIC_LOCKER ?? ZERO) as Address;
export const ESCROW = (process.env.NEXT_PUBLIC_ESCROW ?? ZERO) as Address;
export const PROFILES = (process.env.NEXT_PUBLIC_PROFILES ?? ZERO) as Address;
export const PLATFORM = (process.env.NEXT_PUBLIC_PLATFORM ?? ZERO) as Address;

export const FACTORY_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK ?? "0",
);

export const TOKEN_SUFFIX = 0xb20;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
export const POOL_FEE = 0;
export const TICK_SPACING = 200;

export const BASESCAN = "https://basescan.org";
export const BASE_RPC =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://mainnet.base.org";

export function isDeployed() {
  return FACTORY !== ZERO && ROUTER !== ZERO;
}
