"use client";

import { useEffect, useState } from "react";
import type { Address } from "viem";

export function PriceChart({ token }: { token: Address }) {
  const [pool, setPool] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/base/tokens/${token}/pools?page=1`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data?: Array<{ id?: string; attributes?: { address?: string } }> };
        const first = json.data?.[0];
        const id = first?.attributes?.address || first?.id?.split("_").pop();
        if (!cancelled && id) setPool(id);
      } catch {
        /* token page embed still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const src = pool
    ? `https://www.geckoterminal.com/base/pools/${pool}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=price&resolution=15m&bg_color=000000`
    : `https://www.geckoterminal.com/base/tokens/${token}?embed=1&info=0&swaps=1&grayscale=0&light_chart=0&chart_type=market_cap&resolution=15m&bg_color=000000`;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-lg font-semibold">Chart</p>
        <a
          className="font-mono text-[11px] text-lime underline"
          href={pool ? `https://www.geckoterminal.com/base/pools/${pool}` : `https://www.geckoterminal.com/base/tokens/${token}`}
          target="_blank"
          rel="noreferrer"
        >
          GeckoTerminal ↗
        </a>
      </div>
      <iframe
        id="geckoterminal-embed"
        title="GeckoTerminal chart"
        src={src}
        className="mt-2 h-[420px] w-full border-0"
        allow="clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
