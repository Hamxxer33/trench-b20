"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress } from "viem";
import { useLaunches } from "@/lib/useLaunches";
import { searchLaunches } from "@/lib/stats";
import { TokenMark } from "./Mark";
import { shortAddr } from "@/lib/format";
import { useAppBase, withBase } from "@/lib/appBase";

export function SearchBar() {
  const router = useRouter();
  const base = useAppBase();
  const { launches } = useLaunches();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchLaunches(launches, q).slice(0, 8), [launches, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(token?: string) {
    const query = q.trim();
    if (token) {
      router.push(withBase(base, `/token/${token}`));
      setOpen(false);
      setQ("");
      return;
    }
    if (isAddress(query)) {
      router.push(withBase(base, `/token/${query}`));
      setOpen(false);
      setQ("");
      return;
    }
    router.push(base ? `${base}?q=${encodeURIComponent(query)}` : `/dashboard?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  return (
    <div ref={box} className={`relative min-w-0 flex-1 md:max-w-sm ${base ? "block" : "hidden sm:block"}`}>
      <input
        className="field h-9 py-1 text-sm"
        placeholder="Search token, ticker, or 0x…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            go(hits[0]?.token);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && q.trim() && (
        <div className="absolute top-11 z-40 w-full overflow-hidden rounded-xl border border-line2 bg-panel shadow-2xl">
          {hits.length === 0 ? (
            <p className="tnum px-3 py-3 text-xs text-faint">No matches on Trench.</p>
          ) : (
            hits.map((h) => (
              <button
                key={h.token}
                type="button"
                className="flex w-full items-center gap-3 border-b border-line px-3 py-2 text-left last:border-0 hover:bg-panel2"
                onClick={() => go(h.token)}
              >
                <TokenMark address={h.token} src={h.image || undefined} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm">{h.name}</span>
                <span className="tnum text-[11px] text-lime">${h.symbol}</span>
                <span className="tnum text-[10px] text-faint">{shortAddr(h.token)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
