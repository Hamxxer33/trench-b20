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
      void indexTrade({
        token,
        trader: address,
        is_buy: side === "buy",
        amount_eth: isEth && side === "buy" ? Number(amount) : 0,
        tx_hash: result.hash,
      });
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-panel p-5">
      <div className="mb-4 grid grid-cols-2 rounded-full bg-void p-1">
        <button
          className={`rounded-full py-2 text-sm ${side === "buy" ? "bg-lime text-[#071018]" : "text-mute"}`}
          onClick={() => setSide("buy")}
          type="button"
        >
          Buy
        </button>
        <button
          className={`rounded-full py-2 text-sm ${side === "sell" ? "bg-ember text-paper" : "text-mute"}`}
          onClick={() => setSide("sell")}
          type="button"
        >
          Sell
        </button>
      </div>
      <label className="grid gap-1.5">
        <span className="font-mono text-[11px] uppercase text-mute">
          {side === "buy" ? `${q.symbol} in` : `${symbol} in`}
        </span>
        <input
          className="field text-lg"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      {address && (
        <p className="mt-2 font-mono text-[11px] text-mute">
          Wallet {formatNum(Number(formatUnits(tokenBal ?? 0n, 18)), 6)} {symbol}
          {!isEth && quoteBal !== undefined ? ` · ${formatNum(Number(formatUnits(quoteBal, q.decimals)), 4)} ${q.symbol}` : ""}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-ember">{error}</p>}
      {status && <p className="mt-3 font-mono text-xs text-lime">{status}</p>}
      {tx && (
        <a className="mt-2 block font-mono text-[11px] text-lime underline" href={txUrl(tx)} target="_blank" rel="noreferrer">
          View on Basescan
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
      <p className="mt-3 font-mono text-[11px] text-mute">
        Pair {q.symbol} · 1% fee in {q.symbol} · 50/30/20
      </p>
    </div>
  );
}
