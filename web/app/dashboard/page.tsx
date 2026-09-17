"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TokenCard } from "@/components/TokenCard";
import { TokenMark } from "@/components/Mark";
import { BoardControls } from "@/components/BoardControls";
import { StatStrip } from "@/components/StatStrip";
import { Ticker } from "@/components/Ticker";
import { useBoard, type Pair, type Sort } from "@/lib/useBoard";
import { formatNum, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import { isDeployed } from "@/lib/addresses";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 w-full" />}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";

  const [sort, setSort] = useState<Sort>("new");
  const [pair, setPair] = useState<Pair>("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const { rows, stats, activity, nameByToken, total, loading, error } = useBoard({ q, sort, pair });
  const deployed = isDeployed();

  return (
    <div className="grid gap-7">
      <div className="-mx-4 -mt-10 sm:-mx-6">
        <Ticker trades={activity} meta={nameByToken} />
      </div>

      <header className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Explore</span>
            <h1 className="mt-1.5 font-display text-4xl">The board</h1>
            <p className="mt-2 max-w-xl text-[14px] text-mute">
              Every Trench launch with its indexed volume. Search a name, a ticker, or paste a token address.
            </p>
          </div>
          <Link href="/launch" className="btn">
            Launch a token
          </Link>
        </div>

        <input
          className="field max-w-xl"
          defaultValue={q}
          placeholder="Search name, $TICKER, or 0x address"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value.trim();
              router.push(v ? `/dashboard?q=${encodeURIComponent(v)}` : "/dashboard");
            }
          }}
        />
      </header>

      <StatStrip stats={stats} tokens={total} loading={loading} />

      <div className="flex flex-wrap items-center gap-3">
        <BoardControls sort={sort} onSort={setSort} pair={pair} onPair={setPair} count={rows.length} />
        <div className="seg inline-flex">
          <button type="button" className="seg-item" data-on={view === "grid"} onClick={() => setView("grid")}>
            Grid
          </button>
          <button type="button" className="seg-item" data-on={view === "table"} onClick={() => setView("table")}>
            Table
          </button>
        </div>
      </div>

      {q && (
        <p className="tnum text-[11px] text-faint">
          “{q}” · {rows.length} match{rows.length === 1 ? "" : "es"}
        </p>
      )}
      {!deployed && <p className="text-sm text-ember">Factory address is not configured on this deploy.</p>}
      {error && <p className="text-sm text-ember">{error}</p>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="font-display text-xl">No matches</p>
          <p className="mt-2 text-sm text-mute">Try a different ticker, or clear the filters.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r, i) => (
            <TokenCard key={r.token} launch={r} rank={sort === "volume" ? i : undefined} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[42rem] border-collapse">
            <thead>
              <tr className="bg-panel2">
                {["#", "Token", "Pair", "Volume", "Fills", "Age"].map((h, i) => (
                  <th
                    key={h}
                    className={`eyebrow px-4 py-2.5 ${i > 2 ? "text-right" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const qa = quoteByAddress(r.quote);
                return (
                  <tr key={r.token} className="border-t border-line hover:bg-panel2">
                    <td className="tnum px-4 py-3 text-xs text-faint">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/token/${r.token}`} className="flex min-w-0 items-center gap-3">
                        <TokenMark address={r.token} src={r.image || undefined} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{r.name}</span>
                          <span className="tnum text-[11px] text-lime">${r.symbol}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="tnum text-xs text-mute">{qa.symbol}</span>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-xs">
                      {r.volumeQuote > 0 ? `${formatNum(r.volumeQuote, 3)} ${qa.symbol}` : "—"}
                    </td>
                    <td className="tnum px-4 py-3 text-right text-xs text-mute">{r.trades || "—"}</td>
                    <td className="tnum px-4 py-3 text-right text-[11px] text-faint">
                      {r.createdAt ? timeAgo(r.createdAt) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rows[0] && (
        <p className="tnum text-[10px] text-faint">
          Newest {shortAddr(rows[0].token)}
          {rows[0].createdAt ? ` · ${timeAgo(rows[0].createdAt)}` : ""}
        </p>
      )}
    </div>
  );
}
