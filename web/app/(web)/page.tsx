"use client";

import { useState } from "react";
import Link from "next/link";
import { TokenCard } from "@/components/TokenCard";
import { BoardControls } from "@/components/BoardControls";
import { Spotlight } from "@/components/Spotlight";
import { StatStrip } from "@/components/StatStrip";
import { Ticker } from "@/components/Ticker";
import { useBoard, type Pair, type Sort } from "@/lib/useBoard";
import { isDeployed } from "@/lib/addresses";

export default function HomePage() {
  const [sort, setSort] = useState<Sort>("new");
  const [pair, setPair] = useState<Pair>("all");
  const { rows, spotlight, stats, activity, nameByToken, total, loading, error } = useBoard({ sort, pair });
  const deployed = isDeployed();

  return (
    <div className="grid gap-8">
      {/* Live tape sits above everything — the board is the product. */}
      <div className="-mx-4 -mt-10 sm:-mx-6">
        <Ticker trades={activity} meta={nameByToken} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
        <div>
          <span className="pill pill-accent">
            <span className="live-dot" /> Live on Base
          </span>
          <h1 className="mt-4 font-display text-[2.7rem] leading-[1.05] sm:text-6xl">
            Launch a token
            <br />
            <span className="text-lime">in one transaction.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-mute">
            Trench mints an admin-less B20 with a locked Uniswap v4 pool, paired against ETH or a
            Base stock. No presale, no team allocation, no code. Launch is free — you pay Base gas.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/launch" className="btn">
              Launch a token
            </Link>
            <Link href="/dashboard" className="btn-ghost">
              Explore the board →
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-faint">
            <li>✓ Liquidity locked forever</li>
            <li>✓ 50% of swap fees to the creator</li>
            <li>✓ 20-second anti-snipe</li>
          </ul>
        </div>

        <div>
          {spotlight ? (
            <Spotlight row={spotlight} />
          ) : (
            <div className="card grid min-h-[18rem] place-items-center p-8 text-center">
              {loading ? (
                <div className="grid w-full max-w-xs gap-3">
                  <div className="skeleton mx-auto h-16 w-16 rounded-full" />
                  <div className="skeleton h-6 w-full" />
                  <div className="skeleton h-4 w-2/3 justify-self-center" />
                </div>
              ) : (
                <div>
                  <p className="font-display text-2xl">The board is empty</p>
                  <p className="mt-2 text-sm text-mute">Nothing has launched yet. That is an opportunity.</p>
                  <Link href="/launch" className="btn mt-6">
                    Be the first
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <StatStrip stats={stats} tokens={total} loading={loading} />

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">The board</h2>
            <p className="mt-1 text-[13px] text-mute">Every B20 launched through Trench, straight from Base.</p>
          </div>
          <Link href="/dashboard" className="text-[13px] text-lime hover:underline">
            Full dashboard →
          </Link>
        </div>

        <BoardControls sort={sort} onSort={setSort} pair={pair} onPair={setPair} count={rows.length} />

        {!deployed && (
          <div className="card border-ember/40 bg-ember/5 p-5 text-sm">
            Factory address is not configured on this deploy — set <code className="tnum">NEXT_PUBLIC_FACTORY</code>.
          </div>
        )}
        {error && <p className="text-sm text-ember">{error}</p>}

        {loading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="tile grid gap-3 p-4">
                <div className="flex gap-3">
                  <div className="skeleton h-[46px] w-[46px] rounded-full" />
                  <div className="grid flex-1 gap-2">
                    <div className="skeleton h-4 w-2/3" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
                <div className="skeleton h-8 w-full" />
                <div className="skeleton h-6 w-full" />
              </div>
            ))}
          </Grid>
        ) : rows.length === 0 ? (
          <div className="card grid place-items-center p-12 text-center">
            <p className="font-display text-xl">Nothing here yet</p>
            <p className="mt-2 text-sm text-mute">
              {pair === "stock"
                ? "No stock-paired launches so far."
                : pair === "eth"
                  ? "No ETH-paired launches so far."
                  : "Be the first to launch a B20 on Trench."}
            </p>
            <Link href="/launch" className="btn mt-6">
              Launch a token
            </Link>
          </div>
        ) : (
          <Grid>
            {rows.slice(0, 12).map((r, i) => (
              <TokenCard key={r.token} launch={r} rank={sort === "volume" ? i : undefined} />
            ))}
          </Grid>
        )}

        {rows.length > 12 && (
          <Link href="/dashboard" className="btn-ghost justify-self-center">
            See all {rows.length} tokens
          </Link>
        )}
      </section>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
