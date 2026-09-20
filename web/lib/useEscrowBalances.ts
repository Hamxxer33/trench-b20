"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatUnits, type Address } from "viem";
import { escrowAbi } from "./abi";
import { ESCROW, ZERO } from "./addresses";
import { CLAIMABLE_ASSETS, type Quote } from "./quotes";

export type { Quote };

export type EscrowBalance = {
  quote: Quote;
  raw: bigint;
  amount: number;
  formatted: string;
};

/**
 * What the escrow owes one address, across every quote asset.
 *
 * Balances are keyed `owed[account][asset]`, so a wallet earning from an
 * ETH pool and a TSLA pool has two separate balances and two separate
 * claims. Reading only the ETH slot — which the profile page used to do —
 * hides every stock-paired fee the account has earned.
 *
 * This is the same ledger for all three roles: creator, referrer and the
 * platform are just addresses. Pointing this at the platform address shows
 * the platform's take.
 */
export function useEscrowBalances(account?: Address) {
  const enabled = Boolean(account && ESCROW !== ZERO);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: CLAIMABLE_ASSETS.map((q) => ({
      address: ESCROW,
      abi: escrowAbi,
      functionName: "owed" as const,
      args: [account as Address, q.address] as const,
    })),
    query: { enabled, refetchInterval: 30_000 },
  });

  const balances = useMemo<EscrowBalance[]>(() => {
    if (!data) return [];
    return CLAIMABLE_ASSETS.map((quote, i) => {
      const res = data[i];
      const raw = res?.status === "success" ? (res.result as bigint) : 0n;
      return {
        quote,
        raw,
        amount: Number(formatUnits(raw, quote.decimals)),
        formatted: formatUnits(raw, quote.decimals),
      };
    });
  }, [data]);

  const owed = useMemo(() => balances.filter((b) => b.raw > 0n), [balances]);

  return {
    /** Only the assets with something to claim. */
    owed,
    /** Every asset, including zeroes — useful for an explicit "nothing owed". */
    balances,
    hasAny: owed.length > 0,
    loading: isLoading,
    refetch,
  };
}
