"use client";

import { useState } from "react";
import { usePublicClient, useWriteContract } from "wagmi";
import type { Address } from "viem";
import { escrowAbi } from "@/lib/abi";
import { BASESCAN, ESCROW, PLATFORM, ZERO } from "@/lib/addresses";
import { formatNum } from "@/lib/format";
import { confirmWrite, friendlyError } from "@/lib/tx";
import { useEscrowBalances, type EscrowBalance } from "@/lib/useEscrowBalances";
import { CopyAddress } from "./CopyAddress";

/**
 * Claimable fees for one address, per quote asset.
 *
 * Escrow is a pull-payment ledger: the router credits creator, platform and
 * referrer on every swap and the money stays in the escrow contract until
 * someone claims it. Balances are per asset, so an account that earned from
 * an ETH pool and an NVDA pool claims twice.
 */
export function FeesPanel({ account, isOwner }: { account: Address; isOwner: boolean }) {
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const { owed, hasAny, loading, refetch } = useEscrowBalances(account);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const isPlatform = PLATFORM !== ZERO && account.toLowerCase() === PLATFORM.toLowerCase();

  async function claim(b: EscrowBalance) {
    if (!client) return;
    setError("");
    setBusy(b.quote.symbol);
    try {
      setStatus(`Claiming ${b.quote.symbol}…`);
      const sent = await confirmWrite(client, () =>
        writeContractAsync({
          address: ESCROW,
          abi: escrowAbi,
          functionName: "claim",
          args: [b.quote.address],
        }),
      );
      if (!sent.ok) throw new Error("Claim reverted.");
      await refetch();
      setStatus(`Claimed ${b.quote.symbol}`);
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Claimable fees</p>
          <p className="mt-1 text-[12px] text-faint">
            {isPlatform ? "Platform share — 30% of every swap fee, 50% when a trade has no referrer." : "Creator and referral share, held in escrow until claimed."}
          </p>
        </div>
        {isPlatform && <span className="pill pill-gold">Platform</span>}
      </div>

      {loading ? (
        <div className="mt-4 grid gap-2">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      ) : !hasAny ? (
        <p className="mt-4 text-[13px] text-mute">
          Nothing owed right now, across ETH or any stock pair.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {owed.map((b) => (
            <div
              key={b.quote.symbol}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-void/50 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="tnum text-[15px] text-paper">
                  {formatNum(b.amount, 6)} <span className="text-faint">{b.quote.symbol}</span>
                </div>
                <div className="tnum text-[10px] text-faint">{b.quote.name}</div>
              </div>
              {isOwner ? (
                <button
                  className="btn h-9 shrink-0 px-4 text-[13px]"
                  type="button"
                  disabled={isPending || busy !== null}
                  onClick={() => void claim(b)}
                >
                  {busy === b.quote.symbol ? "Claiming…" : "Claim"}
                </button>
              ) : (
                <span className="pill shrink-0">owed</span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-[13px] text-ember">{error}</p>
      )}
      {status && <p className="tnum mt-3 text-xs text-lime">{status}</p>}

      <div className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-faint">
        <p className="mb-1.5">
          Funds sit in <span className="text-mute">TrenchEscrow</span> until claimed — not in any wallet.
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CopyAddress value={ESCROW} label="Escrow" className="text-[10px]" />
          <a
            className="text-mute hover:text-lime"
            href={`${BASESCAN}/address/${ESCROW}`}
            target="_blank"
            rel="noreferrer"
          >
            Basescan ↗
          </a>
        </div>
      </div>
    </div>
  );
}
