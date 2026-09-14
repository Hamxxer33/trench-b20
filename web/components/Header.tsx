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
    <header className="sticky top-0 z-30 border-b border-line/80 bg-void/85 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <PadMark size={34} />
          <span className="text-[17px] font-semibold tracking-tight text-paper">
            Trench
          </span>
        </Link>
        <SearchBar />
        <nav className="ml-auto flex shrink-0 items-center gap-1 text-sm">
          <Link className={nav(path === "/" || path.startsWith("/dashboard"))} href="/dashboard">
            Explore
          </Link>
          <Link className={nav(path === "/launch")} href="/launch">
            Create
          </Link>
          {address && (
            <Link className={nav(path.startsWith("/profile"))} href={`/profile/${address}`}>
              Profile
            </Link>
          )}
          <Link href="/launch" className="btn ml-1 hidden h-9 px-4 text-sm sm:inline-flex">
            Launch a token
          </Link>
          <div className="ml-1">
            <ConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
}

function nav(on: boolean) {
  return `rounded-full px-3 py-1.5 ${on ? "text-paper" : "text-mute hover:text-paper"}`;
}
