"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TokenCard } from "@/components/TokenCard";
import { SearchBar } from "@/components/SearchBar";
import { SoonBadge } from "@/components/ComingSoon";
import { useLaunches } from "@/lib/useLaunches";
import { searchLaunches } from "@/lib/stats";
import { ZERO } from "@/lib/addresses";
import { quoteByAddress } from "@/lib/quotes";

export default function MiniHomePage() {
  return (
    <Suspense fallback={<p className="font-mono text-sm text-mute">Loading…</p>}>
      <MiniHome />
    </Suspense>
  );
}

function MiniHome() {
  const q = useSearchParams().get("q") ?? "";
  const { launches, loading, error } = useLaunches();
  const [market, setMarket] = useState<"all" | "crypto" | "stocks">("all");
  const [sort, setSort] = useState<"new" | "trending">("new");

  const filtered = useMemo(() => {
    let rows = searchLaunches(launches, q);
    if (market === "crypto") rows = rows.filter((l) => !l.quote || l.quote === ZERO);
    if (market === "stocks") rows = rows.filter((l) => l.quote && l.quote !== ZERO);
    return rows;
  }, [launches, q, market]);

  return (
    <div className="grid gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Base · B20</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Trench</h1>
        <p className="mt-1 text-sm text-mute">No extra login. Your Farcaster wallet is the signer.</p>
      </div>

      <SearchBar />

      <div className="flex gap-2">
        {(["all", "crypto", "stocks"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMarket(m)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              market === m ? "bg-lime text-ink" : "border border-line text-mute"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSort("new")}
          className={`rounded-full px-3 py-1.5 text-sm ${sort === "new" ? "bg-panel2 text-paper" : "text-mute"}`}
        >
          New
        </button>
        <button
          type="button"
          onClick={() => setSort("trending")}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-mute"
        >
          Trending <SoonBadge />
        </button>
      </div>

      {loading && <p className="font-mono text-xs text-mute">Reading launches…</p>}
      {error && <p className="text-sm text-ember">{error}</p>}
      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-mute">
          No launches in this view yet.
        </p>
      )}
      <div className="grid gap-2">
        {filtered.map((l) => (
          <div key={l.token} className="relative">
            <TokenCard launch={l} />
            {l.quote && l.quote !== ZERO && (
              <span className="pointer-events-none absolute right-3 top-2 font-mono text-[10px] text-lime">
                {quoteByAddress(l.quote).symbol}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
