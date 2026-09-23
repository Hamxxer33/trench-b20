"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, useConnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { PadMark } from "./Mark";
import { shortAddr } from "@/lib/format";

type FcUser = { fid?: number; username?: string; displayName?: string; pfpUrl?: string };

export function MiniHeader() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const [user, setUser] = useState<FcUser | null>(null);

  useEffect(() => {
    void sdk.context
      .then((ctx) => {
        if (ctx?.user) setUser(ctx.user);
      })
      .catch(() => {
        /* browser preview */
      });
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
        <Link href="/mini" className="flex min-w-0 items-center gap-2">
          <PadMark size={26} />
          <span className="text-[15px] font-semibold tracking-tight">Trench</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user?.username && <span className="max-w-[7rem] truncate font-mono text-[11px] text-mute">@{user.username}</span>}
          {isConnected && address ? (
            <span className="rounded-full border border-line px-2 py-1 font-mono text-[10px] text-mute">
              {shortAddr(address)}
            </span>
          ) : (
            <button
              className="btn h-7 px-3 text-xs"
              type="button"
              disabled={isPending}
              onClick={() => connectors[0] && connect({ connector: connectors[0] })}
            >
              {isPending ? "…" : "Use wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
