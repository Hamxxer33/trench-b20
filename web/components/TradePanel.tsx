"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits, type Address, maxUint256 } from "viem";
import { erc20Abi, routerAbi } from "@/lib/abi";
import { ROUTER, ZERO } from "@/lib/addresses";
import { formatNum } from "@/lib/format";
import { referralFor } from "@/lib/referral";
import { confirmWrite, friendlyError, txUrl } from "@/lib/tx";
import { indexTrade } from "@/lib/supabase";
import { quoteByAddress } from "@/lib/quotes";

export function TradePanel({
  token,
  symbol,
  quote,
}: {
  token: Address;
  symbol: string;
  quote: Address;
}) {
  const q = quoteByAddress(quote);
  const isEth = q.address === ZERO;
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [tx, setTx] = useState<string>("");

  const { data: tokenBal, refetch: refetchBal } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: quoteBal } = useReadContract({
    address: q.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isEth },
  });
  const approveToken = side === "sell" ? token : q.address;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: approveToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, ROUTER] : undefined,
    query: { enabled: !!address && !(side === "buy" && isEth) },
  });

  const parsed = useMemo(() => {
    try {
      if (!amount) return 0n;
      const dec = side === "buy" ? q.decimals : 18;
      return parseUnits(amount, dec);
    } catch {
      return 0n;
    }
  }, [amount, side, q.decimals]);

  const needsApprove = !(side === "buy" && isEth) && (allowance ?? 0n) < parsed;

  async function submit() {
    setError("");
    setTx("");
    if (!isConnected || !address || !client) {
      setError("Connect wallet");
      return;
    }
    if (parsed === 0n) {
      setError("Enter an amount");
      return;
    }
    try {
      if (needsApprove) {
        setStatus(`Approve ${side === "buy" ? q.symbol : symbol}…`);
        const approved = await confirmWrite(client, () =>
          writeContractAsync({
            address: approveToken,
            abi: erc20Abi,
            functionName: "approve",
            args: [ROUTER, maxUint256],
          }),
        );
        if (!approved.ok) throw new Error("Approve did not land.");
        await refetchAllowance();
      }
      setStatus(side === "buy" ? "Buying…" : "Selling…");
      const referrer = referralFor(token);
      const comment = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;
      const result = await confirmWrite(client, () =>
        side === "buy"
          ? writeContractAsync({
              address: ROUTER,
              abi: routerAbi,
              functionName: "buy",
              args: [token, isEth ? 0n : parsed, 0n, ZERO, referrer, comment],
              value: isEth ? parsed : 0n,
            })
          : writeContractAsync({
              address: ROUTER,
              abi: routerAbi,
              functionName: "sell",
              args: [token, parsed, 0n, ZERO, referrer, comment],
            }),
      );
      setTx(result.hash);
      if (!result.ok) throw new Error("Transaction reverted onchain.");
      setStatus("Filled");
      setAmount("");
      await refetchBal();
      setTimeout(() => void refetchBal(), 2000);
      // Side, size and quote asset come out of the router's Trade event
      // server-side — that is what makes stock-paired volume count too.
      void indexTrade({ tx_hash: result.hash, token });
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    }
  }

  return (
    <div className="card p-5">
      <div className="seg mb-4 grid w-full grid-cols-2">
        <button
          className="seg-item text-center font-semibold"
          data-on={side === "buy"}
          style={side === "buy" ? { background: "rgba(47,212,143,0.16)", color: "var(--color-up)" } : undefined}
          onClick={() => setSide("buy")}
          type="button"
        >
          Buy
        </button>
        <button
          className="seg-item text-center font-semibold"
          data-on={side === "sell"}
          style={side === "sell" ? { background: "rgba(251,111,132,0.16)", color: "var(--color-down)" } : undefined}
          onClick={() => setSide("sell")}
          type="button"
        >
          Sell
        </button>
      </div>

      <label className="grid gap-1.5">
        <span className="eyebrow">{side === "buy" ? `${q.symbol} in` : `${symbol} in`}</span>
        <input
          className="field tnum text-lg"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      {address && (
        <p className="tnum mt-2 text-[11px] text-faint">
          Wallet {formatNum(Number(formatUnits(tokenBal ?? 0n, 18)), 6)} {symbol}
          {!isEth && quoteBal !== undefined
            ? ` · ${formatNum(Number(formatUnits(quoteBal, q.decimals)), 4)} ${q.symbol}`
            : ""}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-[13px] text-ember">{error}</p>
      )}
      {status && <p className="tnum mt-3 text-xs text-lime">{status}</p>}
      {tx && (
        <a
          className="tnum mt-2 block text-[11px] text-lime underline"
          href={txUrl(tx)}
          target="_blank"
          rel="noreferrer"
        >
          View on Basescan ↗
        </a>
      )}

      <button className="btn mt-4 h-12 w-full" type="button" disabled={isPending} onClick={() => void submit()}>
        {isPending
          ? "Confirm…"
          : needsApprove
            ? `Approve ${side === "buy" ? q.symbol : symbol}`
            : side === "buy"
              ? `Buy ${symbol} with ${q.symbol}`
              : `Sell ${symbol}`}
      </button>

      <p className="tnum mt-3 text-[11px] text-faint">
        Pair {q.symbol} · 1% fee in {q.symbol} · 50 / 30 / 20
      </p>
    </div>
  );
}
