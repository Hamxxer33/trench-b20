"use client";

import Link from "next/link";
import type { Address } from "viem";
import { TokenMark } from "./Mark";
import { shortAddr, timeAgo } from "@/lib/format";

export type Launch = {
  token: Address;
  creator: Address;
  name: string;
  symbol: string;
  createdAt: number;
  image: string;
  description: string;
};

export function TokenCard({ launch }: { launch: Launch }) {
  return (
    <Link
      href={`/token/${launch.token}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-panel/80 px-4 py-3.5 transition hover:border-lime/40 hover:bg-panel2"
    >
      <TokenMark address={launch.token} src={launch.image || undefined} size={44} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <h3 className="truncate text-[15px] font-semibold text-paper">{launch.name}</h3>
          <span className="font-mono text-xs text-mute">${launch.symbol}</span>
        </div>
        <p className="truncate font-mono text-[11px] text-mute">
          {shortAddr(launch.token)}
          {launch.createdAt ? ` · ${timeAgo(launch.createdAt)}` : ""}
        </p>
      </div>
      <span className="rounded-full border border-line px-3 py-1 font-mono text-[11px] text-mute group-hover:border-lime/50 group-hover:text-lime">
        Trade
      </span>
    </Link>
  );
}
