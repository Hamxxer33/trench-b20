"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";
import { PadMark } from "./Mark";
import { SearchBar } from "./SearchBar";

export function Header() {
  const path = usePathname();
  const { address } = useAccount();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[84rem] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <PadMark size={32} />
          <span className="font-display text-[18px] text-paper">Trench</span>
          {/* Wrapper, not `hidden` on the pill itself: .pill sets display and
              would win the specificity tie against Tailwind's .hidden. */}
          <span className="hidden sm:block">
            <span className="pill pill-accent">B20</span>
          </span>
        </Link>

        <SearchBar />

        <nav className="ml-auto flex shrink-0 items-center gap-0.5 text-[13.5px] sm:gap-1">
          <Link className={nav(path === "/" || path.startsWith("/dashboard"))} href="/dashboard">
            Board
          </Link>
          {address && (
            <Link className={nav(path.startsWith("/profile"))} href={`/profile/${address}`}>
              Profile
            </Link>
          )}
          <Link href="/launch" className="btn ml-1 hidden h-9 px-4 text-[13.5px] sm:inline-flex">
            Launch
          </Link>
          <div className="sm:ml-1">
            <ConnectButton />
          </div>
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
