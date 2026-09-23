"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import { PadMark } from "./Mark";
import { HamburgerMenu, type MenuItem } from "./HamburgerMenu";
import { shortAddr } from "@/lib/format";

type FcUser = { fid?: number; username?: string; displayName?: string; pfpUrl?: string };

export function MiniHeader() {
  const path = usePathname();
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

  const meHref = address ? `/mini/profile/${address}` : "/mini/profile";
  const items: MenuItem[] = [
    { label: "Explore", href: "/mini", on: path === "/mini" },
    { label: "Create", href: "/mini/launch", on: path.startsWith("/mini/launch") },
    { label: "Me", href: meHref, on: path.startsWith("/mini/profile"), hint: address ? shortAddr(address) : undefined },
    { label: "More", href: "/mini/more", on: path.startsWith("/mini/more") },
    { label: "Full site", href: "/" },
    { label: "Trending", soon: true },
    { label: "Holders", soon: true },
    { label: "Comments", soon: true },
    { label: "Announcements", soon: true },
    { label: "Staking", soon: true },
    { label: "Limit / sniper / TWAP", soon: true },
    { label: "Multi-chain", soon: true },
  ];

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
          <HamburgerMenu title="Trench" items={items} />
        </div>
      </div>
    </header>
  );
}
