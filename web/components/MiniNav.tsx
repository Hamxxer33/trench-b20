"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export function MiniNav() {
  const path = usePathname();
  const { address } = useAccount();
  const profileHref = address ? `/mini/profile/${address}` : "/mini/profile";
  const items = [
    { href: "/mini", label: "Explore", on: path === "/mini" },
    { href: "/mini/launch", label: "Create", on: path.startsWith("/mini/launch") },
    { href: profileHref, label: "Me", on: path.startsWith("/mini/profile") },
    { href: "/mini/more", label: "More", on: path.startsWith("/mini/more") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-void/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className={`py-3 text-center font-mono text-[11px] uppercase tracking-wide ${it.on ? "text-lime" : "text-mute"}`}
          >
            {it.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
