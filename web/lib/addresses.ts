import type { Address } from "viem";

export const BASE_CHAIN_ID = 8453;

export const B20_FACTORY =
  "0xB20f000000000000000000000000000000000000" as Address;

export const V4_POOL_MANAGER =
  "0x498581fF718922c3f8e6A244956aF099B2652b2b" as Address;

export const V4_STATE_VIEW =
  "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71" as Address;

export const ZERO = "0x0000000000000000000000000000000000000000" as Address;

/**
 * Live Trench deployment on Base mainnet (chain 8453).
 *
 * Source of truth is `contracts/deployed.json`; the README lists the same
 * addresses with Basescan links. These are public on-chain values, so they
 * ship as defaults and the app works with no configuration at all — a missing
 * env var should not leave the board empty on a fresh deploy.
 *
 * The NEXT_PUBLIC_* vars still win where they are set, which is what a fork or
 * a testnet redeploy needs.
 */
const DEPLOYED = {
  factory: "0x4F03402ba3DC942fDE77F31B335ae51111129d55",
  router: "0x8D984C9F176157b11144C803EEFB74CC76e1B708",
  locker: "0x816ECAff16c44689F01B44b939c4261bf6BF2De7",
  escrow: "0x193BcAc66a18B4b7CC47eE975F9917eD9ed0Ae92",
  profiles: "0x386c8634893bc6547FDc6C63Cdd2Af2573f4C360",
  platform: "0x8564d4849A520D9373f3FB3BCC91c7400E3089B6",
  /** Block the factory was deployed in — the floor for any log scan. */
  factoryBlock: "51306713",
} as const;

// `||` rather than `??`: Vercel hands an unset variable through as an empty
// string, which `??` would happily accept and then read the zero address.
export const FACTORY = (process.env.NEXT_PUBLIC_FACTORY || DEPLOYED.factory) as Address;
export const ROUTER = (process.env.NEXT_PUBLIC_ROUTER || DEPLOYED.router) as Address;
export const LOCKER = (process.env.NEXT_PUBLIC_LOCKER || DEPLOYED.locker) as Address;
export const ESCROW = (process.env.NEXT_PUBLIC_ESCROW || DEPLOYED.escrow) as Address;
export const PROFILES = (process.env.NEXT_PUBLIC_PROFILES || DEPLOYED.profiles) as Address;
export const PLATFORM = (process.env.NEXT_PUBLIC_PLATFORM || DEPLOYED.platform) as Address;

export const FACTORY_DEPLOY_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK || DEPLOYED.factoryBlock,
);

export const TOKEN_SUFFIX = 0xb20;
export const TOTAL_SUPPLY = 1_000_000_000n * 10n ** 18n;
export const POOL_FEE = 0;
export const TICK_SPACING = 200;

export const BASESCAN = "https://basescan.org";
export const BASE_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";

export function isDeployed() {
  return FACTORY !== ZERO && ROUTER !== ZERO;
}
