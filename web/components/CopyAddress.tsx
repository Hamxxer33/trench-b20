"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { shortAddr } from "@/lib/format";

/**
 * Copies text to the clipboard, with a fallback for the browsers this audience
 * actually uses.
 *
 * `navigator.clipboard` is undefined outside a secure context and inside some
 * in-app webviews (Telegram, X), which is exactly where a token link gets
 * opened. The execCommand path is deprecated but still works there, and a
 * silent failure to copy a contract address is worse than a deprecation.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "-1000px";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, text.length);
    const copied = document.execCommand("copy");
    document.body.removeChild(el);
    return copied;
  } catch {
    return false;
  }
}

type Props = {
  value: string;
  /** Shown instead of the shortened address, e.g. a full address on wide screens. */
  label?: string;
  className?: string;
  /** Larger, bordered treatment for the token page header. */
  variant?: "inline" | "pill";
  title?: string;
};

export function CopyAddress({ value, label, className = "", variant = "inline", title }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onCopy = useCallback(
    async (e: React.MouseEvent) => {
      // These sit inside clickable cards; copying must not also navigate.
      e.preventDefault();
      e.stopPropagation();
      const ok = await copyText(value);
      setState(ok ? "copied" : "failed");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), ok ? 1400 : 2600);
    },
    [value],
  );

  const text = state === "copied" ? "Copied" : state === "failed" ? "Press ⌘C" : (label ?? shortAddr(value));

  const base =
    variant === "pill"
      ? "pill hover:border-lime hover:text-lime"
      : "inline-flex items-center gap-1 rounded text-faint transition hover:text-lime";

  return (
    <button
      type="button"
      onClick={onCopy}
      // Full value in the tooltip and for anyone who wants to select it by hand.
      title={title ?? (state === "failed" ? value : `Copy ${value}`)}
      aria-label={`Copy address ${value}`}
      className={`tnum ${base} ${state === "copied" ? "text-up" : ""} ${className}`}
    >
      <span className="truncate">{text}</span>
      {state === "copied" ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10.5 3.2V3A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0">
      <path d="M3 8.5 6.2 11.6 13 4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
