"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { PadMark } from "./Mark";
import { SearchBar } from "./SearchBar";
import { HamburgerMenu, type MenuItem } from "./HamburgerMenu";
import { BASESCAN, FACTORY, ROUTER, ZERO } from "@/lib/addresses";
import { shortAddr } from "@/lib/format";

export function Header() {
  const path = usePathname();
  const { address } = useAccount();
  const meHref = address ? `/profile/${address}` : undefined;

  const items: MenuItem[] = [
    { label: "Board", href: "/dashboard", on: path === "/" || path.startsWith("/dashboard") },
    { label: "Create", href: "/launch", on: path.startsWith("/launch") },
    {
      label: "Me",
      href: meHref,
      on: path.startsWith("/profile"),
      hint: address ? shortAddr(address) : "log in first",
    },
    { label: "Farcaster mini", href: "/mini", on: path.startsWith("/mini") },
    { label: "More", href: "/more", on: path.startsWith("/more") },
    { label: "Trending", soon: true },
    { label: "Holders", soon: true },
    { label: "Comments", soon: true },
    { label: "Announcements", soon: true },
    { label: "Staking", soon: true },
    { label: "Limit / sniper / TWAP", soon: true },
    { label: "Multi-chain", soon: true },
  ];

  if (FACTORY !== ZERO) {
    items.push(
      { label: `Factory ${shortAddr(FACTORY)}`, href: `${BASESCAN}/address/${FACTORY}`, external: true },
      { label: `Router ${shortAddr(ROUTER)}`, href: `${BASESCAN}/address/${ROUTER}`, external: true },
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <PadMark size={32} />
          <span className="font-display text-[18px] text-paper">Trench</span>
          <span className="hidden sm:block">
            <span className="pill pill-accent">B20</span>
          </span>
        </Link>

        <SearchBar />

        <nav className="ml-auto flex shrink-0 items-center gap-0.5 text-[13.5px] sm:gap-1">
          <Link className={`${nav(path === "/" || path.startsWith("/dashboard"))} hidden sm:inline-flex`} href="/dashboard">
            Board
          </Link>
          <Link className={`${nav(path.startsWith("/launch"))} hidden sm:inline-flex`} href="/launch">
            Create
          </Link>
          {address && (
            <Link className={`${nav(path.startsWith("/profile"))} hidden sm:inline-flex`} href={`/profile/${address}`}>
              Me
            </Link>
          )}
          <Link className={`${nav(path.startsWith("/more"))} hidden md:inline-flex`} href="/more">
            More
          </Link>
          <Link href="/launch" className="btn ml-1 hidden h-9 px-4 text-[13.5px] lg:inline-flex">
            Launch
          </Link>
          <div className="sm:ml-1">
            <ConnectButton />
          </div>
          <HamburgerMenu title="Trench" items={items} footer={<ConnectButton />} />
        </nav>
      </div>
    </header>
  );
}

function nav(on: boolean) {
  return `rounded-lg px-2 py-1.5 transition sm:px-3 ${
    on ? "bg-raised text-paper" : "text-mute hover:bg-panel2 hover:text-paper"
  }`;
}
