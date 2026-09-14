"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { erc20Abi, factoryAbi, stateViewAbi } from "@/lib/abi";
import { BASESCAN, FACTORY, V4_STATE_VIEW, ZERO } from "@/lib/addresses";
import { fdvEthFromSqrtPrice, formatNum, poolId, shortAddr, timeAgo } from "@/lib/format";
import { quoteByAddress } from "@/lib/quotes";
import { referralLink } from "@/lib/referral";
import { TokenMark } from "@/components/Mark";
import { TradePanel } from "@/components/TradePanel";
import { PriceChart } from "@/components/PriceChart";

export default function TokenPage() {
  const params = useParams<{ address: string }>();
  const token = params.address as Address;
  const valid = isAddress(token);
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

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

  function copyRef() {
    if (!address) return;
    const link = referralLink(window.location.origin, address, token);
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="flex items-start gap-4">
          <TokenMark address={token} src={image || undefined} size={64} />
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{name ?? "…"}</h1>
            <p className="font-mono text-sm text-lime">
              ${symbol ?? ""} · {quoteByAddress(quote).symbol}
            </p>
            <p className="mt-1 font-mono text-[11px] text-mute">
              {shortAddr(token)}
              {createdAt ? ` · ${timeAgo(createdAt)}` : ""}
            </p>
          </div>
        </div>
        {description && <p className="mt-6 max-w-xl text-mute">{description}</p>}

        <div className="mt-8">
          <PriceChart token={token} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat k="FDV" v={fdv ? `${formatNum(fdv, 3)} ETH` : "—"} />
          <Stat k="Supply" v="1B" />
          <Stat k="Fee" v="50/30/20" />
          <Stat k="LP" v="locked" />
        </div>

        <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs">
          <a className="btn-ghost" href={`${BASESCAN}/token/${token}`} target="_blank" rel="noreferrer">
            Basescan
          </a>
          {website && (
            <a className="btn-ghost" href={website} target="_blank" rel="noreferrer">
              Website
            </a>
          )}
          {twitter && (
            <a className="btn-ghost" href={`https://x.com/${twitter}`} target="_blank" rel="noreferrer">
              X
            </a>
          )}
          {telegram && (
            <a
              className="btn-ghost"
              href={telegram.startsWith("http") ? telegram : `https://t.me/${telegram}`}
              target="_blank"
              rel="noreferrer"
            >
              Telegram
            </a>
          )}
          {creator && creator !== ZERO && (
            <Link className="btn-ghost" href={`/profile/${creator}`}>
              creator {shortAddr(creator)}
            </Link>
          )}
          {address && (
            <button className="btn-ghost" type="button" onClick={copyRef}>
              {copied ? "Copied" : "Referral link"}
            </button>
          )}
        </div>
      </div>
      <TradePanel token={token} symbol={symbol ?? "TOKEN"} quote={quote} />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="font-mono text-[11px] uppercase text-mute">{k}</div>
      <div className="mt-1 font-display text-2xl">{v}</div>
    </div>
  );
}
