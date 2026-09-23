"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MenuItem = {
  label: string;
  href?: string;
  on?: boolean;
  soon?: boolean;
  hint?: string;
  onClick?: () => void;
  external?: boolean;
};

export function HamburgerMenu({
  items,
  footer,
  title = "Menu",
}: {
  items: MenuItem[];
  footer?: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const labelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-lg border border-line2 bg-panel2 text-paper hover:border-lime"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex w-4 flex-col gap-[3.5px]">
          <span className={`h-px bg-current transition ${open ? "translate-y-[4.5px] rotate-45" : ""}`} />
          <span className={`h-px bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-px bg-current transition ${open ? "-translate-y-[4.5px] -rotate-45" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside
            className="absolute right-0 top-0 flex h-full w-[min(22rem,100%)] flex-col border-l border-line bg-void shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p id={labelId} className="font-display text-[15px]">
                {title}
              </p>
              <button
                type="button"
                className="btn-ghost h-8 px-3 text-xs"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              <ul className="grid gap-1">
                {items.map((item) => (
                  <li key={item.label}>
                    <MenuRow item={item} onDone={() => setOpen(false)} />
                  </li>
                ))}
              </ul>
            </nav>
            {footer && <div className="border-t border-line p-4">{footer}</div>}
          </aside>
        </div>
      )}
    </>
  );
}

function MenuRow({ item, onDone }: { item: MenuItem; onDone: () => void }) {
  const className = `flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] transition ${
    item.on ? "bg-raised text-paper" : "text-paper hover:bg-panel2"
  }`;
  const right = item.soon ? (
    <span className="rounded-full border border-lime/30 bg-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lime">
      Soon
    </span>
  ) : item.hint ? (
    <span className="font-mono text-[11px] text-mute">{item.hint}</span>
  ) : null;

  if (item.href) {
    if (item.external) {
      return (
        <a className={className} href={item.href} target="_blank" rel="noreferrer" onClick={onDone}>
          <span>{item.label}</span>
          {right}
        </a>
      );
    }
    return (
      <Link className={className} href={item.href} onClick={onDone}>
        <span>{item.label}</span>
        {right}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        item.onClick?.();
        onDone();
      }}
    >
      <span>{item.label}</span>
      {right}
    </button>
  );
}
