"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TokenCard } from "@/components/TokenCard";
import { useLaunches } from "@/lib/useLaunches";
import { fetchTradeStats, type TokenVolume } from "@/lib/stats";
import { formatNum } from "@/lib/format";
import { isDeployed } from "@/lib/addresses";

export default function HomePage() {
  const { launches, total, loading, error } = useLaunches();
  const deployed = isDeployed();
  const [vol, setVol] = useState({ volumeEth: 0, trades: 0, byToken: [] as TokenVolume[] });

  useEffect(() => {
    let cancelled = false;
    fetchTradeStats().then((s) => {
      if (!cancelled) setVol(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-12">
      <section className="max-w-3xl pt-4">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          <span className="text-lime">Trench</span> Launchpad
        </h1>
        <p className="mt-4 max-w-xl text-lg text-mute">
          Create and discover B20 tokens on Base. Launch in seconds, no code required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/launch" className="btn">
            Launch a token
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Explore feed →
          </Link>
        </div>
      </section>

      <div className="grid overflow-hidden rounded-2xl border border-line sm:grid-cols-3">
        <HeroStat k="Tokens launched" v={loading ? "—" : formatNum(total, 0)} />
        <HeroStat k="Indexed trades" v={formatNum(vol.trades, 0)} />
        <HeroStat k="Indexed volume" v={`${formatNum(vol.volumeEth, 2)} ETH`} />
        <HeroStat k="Creator earnings" v={`${formatNum(vol.volumeEth * 0.005, 3)} ETH`} />
        <HeroStat k="Launch-pool fee" v="1%" />
        <HeroStat k="Split" v="50 / 30 / 20" />
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">New launches</h2>
            <p className="text-sm text-mute">Live Trench board on Base</p>
          </div>
          <Link href="/dashboard" className="text-sm text-lime">
            View dashboard →
          </Link>
        </div>

        {!deployed && (
          <div className="rounded-2xl border border-ember/40 bg-ember/10 p-5 text-sm">Factory is not configured.</div>
        )}
        {loading && <p className="font-mono text-sm text-mute">Reading launches from Base…</p>}
        {error && <p className="text-sm text-ember">{error}</p>}
        {deployed && !loading && launches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="text-xl font-semibold">No tokens yet</p>
            <p className="mt-2 text-mute">Be the first to launch a B20.</p>
            <Link href="/launch" className="btn mt-6">
              Launch a token
            </Link>
          </div>
        )}
        <div className="grid gap-2">
          {launches.map((l) => (
            <TokenCard key={l.token} launch={l} />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-line px-5 py-5 sm:border-r sm:border-b last:border-r-0 [&:nth-child(3n)]:border-r-0">
      <div className="text-2xl font-semibold tracking-tight">{v}</div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-mute">{k}</div>
    </div>
  );
}
