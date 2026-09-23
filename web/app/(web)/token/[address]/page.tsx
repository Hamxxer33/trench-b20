"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { erc20Abi, factoryAbi, stateViewAbi } from "@/lib/abi";
import { BASESCAN, FACTORY, V4_STATE_VIEW, ZERO } from "@/lib/addresses";
import { fdvEthFromSqrtPrice, formatNum, poolId, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import { referralLink } from "@/lib/referral";
import { getToken, type TokenStats } from "@/lib/api";
import { TokenMark } from "@/components/Mark";
import { CopyAddress } from "@/components/CopyAddress";
import { PairBadge } from "@/components/TokenCard";
import { TradePanel } from "@/components/TradePanel";
import { TradeFeed } from "@/components/TradeFeed";
import { PriceChart } from "@/components/PriceChart";
import { ComingSoonCard } from "@/components/ComingSoon";
import { useAppBase, withBase } from "@/lib/appBase";

export default function TokenPage() {
  const params = useParams<{ address: string }>();
  const token = params.address as Address;
  const valid = isAddress(token);
  const { address } = useAccount();
  const base = useAppBase();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<TokenStats | null>(null);

  const { data: name } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "name",
    query: { enabled: valid },
  });
  const { data: symbol } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "symbol",
    query: { enabled: valid },
  });
  const { data: profile } = useReadContract({
    address: FACTORY,
    abi: factoryAbi,
    functionName: "tokenProfiles",
    args: valid ? [token] : undefined,
    query: { enabled: valid && FACTORY !== ZERO },
  });
  const id = useMemo(() => (valid ? poolId(token) : undefined), [token, valid]);
  const { data: slot0 } = useReadContract({
    address: V4_STATE_VIEW,
    abi: stateViewAbi,
    functionName: "getSlot0",
    args: id ? [id] : undefined,
    query: { enabled: !!id },
  });

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    getToken(token)
      .then((r) => {
        if (!cancelled) setStats(r.stats);
      })
      .catch(() => {
        /* not indexed yet — the page still works from chain reads */
      });
    return () => {
      cancelled = true;
    };
  }, [token, valid]);

  if (!valid) return <p className="text-ember">Not a token address.</p>;

  const creator = profile?.[1] ?? profile?.[0];
  const createdAt = profile ? Number(profile[3]) : 0;
  const quote = profile?.[7] ?? ZERO;
  const image = profile?.[8] ?? "";
  const description = profile?.[9] ?? "";
  const website = profile?.[10] ?? "";
  const twitter = profile?.[11] ?? "";
  const telegram = profile?.[12] ?? "";
  const fdv = slot0 ? fdvEthFromSqrtPrice(slot0[0]) : 0;
  const q = quoteByAddress(quote);

  function copyRef() {
    if (!address) return;
    const link = referralLink(window.location.origin, address, token);
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6">
      {/* Identity bar */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <TokenMark address={token} src={image || undefined} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl">{name ?? "…"}</h1>
              <PairBadge quote={quote} />
            </div>
            <p className="tnum mt-1.5 text-sm text-lime">
              ${symbol ?? ""} <span className="text-faint">/ {q.symbol}</span>
            </p>
            <p className="tnum mt-1 text-[11px] text-faint">
              {createdAt ? `Launched ${timeAgo(createdAt)} ago` : "Just launched"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn-ghost text-[13px]" href={`${BASESCAN}/token/${token}`} target="_blank" rel="noreferrer">
              Basescan ↗
            </a>
            {address && (
              <button className="btn-ghost text-[13px]" type="button" onClick={copyRef}>
                {copied ? "Copied ✓" : "Referral link"}
              </button>
            )}
          </div>
        </div>

        {/* The contract address is what people came for — paste it into a
            wallet, a scanner, a group chat. Full value on screens wide enough
            to hold it, one tap to copy on every screen. */}
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-void/60 px-3 py-2.5">
          <span className="eyebrow shrink-0">Contract</span>
          <code className="tnum hidden min-w-0 flex-1 truncate text-[12.5px] text-paper sm:block">{token}</code>
          <code className="tnum min-w-0 flex-1 truncate text-[12.5px] text-paper sm:hidden">{shortAddr(token)}</code>
          <CopyAddress value={token} label="Copy" variant="pill" className="shrink-0" />
        </div>

        {description && <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-mute">{description}</p>}

        <div className="mt-5 flex flex-wrap gap-2 text-[12.5px]">
          {website && (
            <a className="pill hover:border-lime hover:text-lime" href={website} target="_blank" rel="noreferrer">
              Website ↗
            </a>
          )}
          {twitter && (
            <a
              className="pill hover:border-lime hover:text-lime"
              href={`https://x.com/${twitter}`}
              target="_blank"
              rel="noreferrer"
            >
              @{twitter} ↗
            </a>
          )}
          {telegram && (
            <a
              className="pill hover:border-lime hover:text-lime"
              href={telegram.startsWith("http") ? telegram : `https://t.me/${telegram}`}
              target="_blank"
              rel="noreferrer"
            >
              Telegram ↗
            </a>
          )}
          {creator && creator !== ZERO && (
            <Link className="pill hover:border-lime hover:text-lime" href={withBase(base, `/profile/${creator}`)}>
              creator {shortAddr(creator)}
            </Link>
          )}
        </div>
      </div>
      {/* Market stats */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        <Stat k="FDV" v={fdv ? `${formatNum(fdv, 3)} ETH` : "—"} />
        <Stat k={`Volume · ${q.symbol}`} v={stats ? formatNum(stats.volumeQuote, 3) : "—"} />
        <Stat k="Fills" v={stats ? formatNum(stats.trades, 0) : "—"} />
        <Stat
          k="Buy / sell"
          v={stats && stats.trades > 0 ? `${stats.buys} / ${stats.sells}` : "—"}
          tone={stats && stats.buys > stats.sells ? "up" : stats && stats.sells > stats.buys ? "down" : undefined}
        />
        <Stat k="Supply" v="1B" />
        <Stat k="Liquidity" v="Locked" tone="up" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="grid gap-6">
          <PriceChart token={token} />
          <TradeFeed token={token} />
        </div>
        <div className="grid gap-4 lg:sticky lg:top-24">
          <TradePanel token={token} symbol={symbol ?? "TOKEN"} quote={quote} />
          <div className="card p-4 text-[12px] leading-relaxed text-faint">
            <p className="eyebrow mb-2">Fees</p>
            Every swap pays 1% of {q.symbol}: 50% to the creator, 30% to the platform, 20% to the
            referrer. For the first 20 seconds the fee starts at 99% and decays to 1% — anti-snipe,
            and the excess goes to the platform.
          </div>
          {base === "/mini" && (
            <div className="grid gap-2">
              <ComingSoonCard title="Holders" blurb="Labeled holder list: creator, LP, you." />
              <ComingSoonCard title="Comments" blurb="Public thread on this token." />
              <ComingSoonCard title="Announcements" blurb="Creator-signed updates." />
              <ComingSoonCard title="Staking" blurb="Optional reward vault after launch." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-paper";
  return (
    <div className="bg-panel px-4 py-3">
      <div className="eyebrow">{k}</div>
      <div className={`tnum mt-1 text-[15px] ${color}`}>{v}</div>
    </div>
  );
}
