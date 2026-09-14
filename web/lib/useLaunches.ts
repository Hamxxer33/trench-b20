"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc20Abi, factoryAbi } from "./abi";
import { FACTORY, isDeployed } from "./addresses";
import type { Launch } from "@/components/TokenCard";

export function useLaunches() {
  const client = usePublicClient();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !isDeployed()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const count = await client.readContract({
          address: FACTORY,
          abi: factoryAbi,
          functionName: "launchCount",
        });
        if (!cancelled) setTotal(Number(count));
        if (count === 0n) {
          if (!cancelled) setLaunches([]);
          return;
        }
        const addrs = await client.readContract({
          address: FACTORY,
          abi: factoryAbi,
          functionName: "tokens",
          args: [0n, 80n],
        });
        const rows: Launch[] = await Promise.all(
          addrs.map(async (token) => {
            let creator = token as Address;
            let createdAt = 0;
            let image = "";
            let description = "";
            let name = "Token";
            let symbol = "TKN";
            try {
              const profile = await client.readContract({
                address: FACTORY,
                abi: factoryAbi,
                functionName: "tokenProfiles",
                args: [token],
              });
              creator = profile[1] || profile[0];
              createdAt = Number(profile[3]);
              image = profile[8];
              description = profile[9];
            } catch {
              /* ignore */
            }
            try {
              name = await client.readContract({ address: token, abi: erc20Abi, functionName: "name" });
              symbol = await client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" });
            } catch {
              /* ignore */
            }
            return { token, creator, name, symbol, createdAt, image, description };
          }),
        );
        if (!cancelled) setLaunches(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load launches");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return { launches, total, loading, error };
}
