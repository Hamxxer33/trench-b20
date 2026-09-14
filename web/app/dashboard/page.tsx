"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TokenCard } from "@/components/TokenCard";
import { TokenMark } from "@/components/Mark";
import { useLaunches } from "@/lib/useLaunches";
import { fetchTradeStats, searchLaunches, type TokenVolume } from "@/lib/stats";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { isDeployed } from "@/lib/addresses";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="font-mono text-sm text-mute">Loading dashboard…</p>}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { launches, total, loading, error } = useLaunches();
  const [tab, setTab] = useState<"new" | "volume">(q ? "new" : "new");
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

  const filtered = useMemo(() => searchLaunches(launches, q), [launches, q]);
  const newest = filtered;
  const byVolume = useMemo(() => {
    const map = new Map(vol.byToken.map((v) => [v.token.toLowerCase(), v]));
    return [...filtered]
      .map((l) => ({ launch: l, vol: map.get(l.token.toLowerCase()) }))
      .sort((a, b) => (b.vol?.volumeEth ?? 0) - (a.vol?.volumeEth ?? 0));
  }, [filtered, vol.byToken]);

  const creatorFees = vol.volumeEth * 0.005;
  const deployed = isDeployed();

  return (
    <div className="grid gap-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lime">Explore</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Feed</h1>
        <p className="mt-2 max-w-xl text-mute">
          Every Trench launch, indexed volume, and creator take. Search a ticker or paste a token address.
        </p>
        <input
          className="field mt-5 max-w-xl"
          defaultValue={q}
          placeholder="Search name, $TICKER, or 0x address"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value.trim();
              router.push(v ? `/dashboard?q=${encodeURIComponent(v)}` : "/dashboard");
            }
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Tokens launched" v={loading ? "…" : String(total)} />
        <Stat k="Indexed volume" v={`${formatNum(vol.volumeEth, 3)} ETH`} />
        <Stat k="Trades" v={String(vol.trades)} />
        <Stat k="Creator earnings" v={`${formatNum(creatorFees, 4)} ETH`} hint="50% of the 1% swap fee" />
      </div>

      {q && (
        <p className="font-mono text-xs text-mute">
          Results for “{q}” · {filtered.length} token{filtered.length === 1 ? "" : "s"}
        </p>
      )}

      <div className="flex gap-2">
        <button className={tabBtn(tab === "new")} type="button" onClick={() => setTab("new")}>
          New launches
        </button>
        <button className={tabBtn(tab === "volume")} type="button" onClick={() => setTab("volume")}>
          Volume leaderboard
        </button>
      </div>

      {error && <p className="text-sm text-ember">{error}</p>}
      {loading && <p className="font-mono text-sm text-mute">Loading board…</p>}

      {!deployed && <p className="text-sm text-ember">Factory is not configured.</p>}

      {tab === "new" && (
        <div className="grid gap-3">
          {newest.length === 0 && !loading && <p className="text-mute">No launches match.</p>}
          {newest.map((l) => (
            <TokenCard key={l.token} launch={l} />
          ))}
        </div>
      )}

      {tab === "volume" && (
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-[2.5rem_1fr_7rem_7rem] gap-2 bg-panel2 px-4 py-2 font-mono text-[11px] uppercase text-mute">
            <span>#</span>
            <span>Token</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Trades</span>
          </div>
          {byVolume.length === 0 && !loading && <p className="px-4 py-8 text-mute">No volume yet. Buy something.</p>}
          {byVolume.map((row, i) => (
            <Link
              key={row.launch.token}
              href={`/token/${row.launch.token}`}
              className="grid grid-cols-[2.5rem_1fr_7rem_7rem] items-center gap-2 border-t border-line px-4 py-3 hover:bg-panel2"
            >
              <span className="font-mono text-xs text-mute">{i + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                <TokenMark address={row.launch.token} src={row.launch.image || undefined} size={32} />
                <span className="min-w-0">
                  <span className="block truncate font-display">{row.launch.name}</span>
                  <span className="font-mono text-[11px] text-lime">${row.launch.symbol}</span>
                </span>
              </span>
              <span className="text-right font-mono text-xs">{formatNum(row.vol?.volumeEth ?? 0, 3)} ETH</span>
              <span className="text-right font-mono text-xs text-mute">{row.vol?.trades ?? 0}</span>
            </Link>
          ))}
        </div>
      )}

      {newest[0] && tab === "new" && (
        <p className="font-mono text-[11px] text-mute">
          Latest {shortAddr(newest[0].token)}
          {newest[0].createdAt ? ` · ${timeAgo(newest[0].createdAt)}` : ""}
        </p>
      )}
    </div>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="font-mono text-[11px] uppercase text-mute">{k}</div>
      <div className="mt-1 font-display text-3xl">{v}</div>
      {hint && <div className="mt-1 font-mono text-[10px] text-mute">{hint}</div>}
    </div>
  );
}

function tabBtn(on: boolean) {
  return `rounded-full px-4 py-1.5 text-sm ${on ? "bg-lime text-white" : "border border-line text-mute"}`;
}
