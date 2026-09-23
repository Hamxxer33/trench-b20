"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useRouter } from "next/navigation";
import { factoryAbi } from "@/lib/abi";
import { FACTORY, TOKEN_SUFFIX, ZERO, isDeployed } from "@/lib/addresses";
import { STOCK_QUOTES } from "@/lib/quotes";
import { mineSalt, mineSaltVerified, predictB20Address } from "@/lib/salt";
import { shortAddr } from "@/lib/format";
import { confirmWrite, friendlyError } from "@/lib/tx";
import { indexToken } from "@/lib/supabase";
import { LogoDrop } from "./LogoDrop";
import type { Address, Hex } from "viem";
import { useAppBase, withBase } from "@/lib/appBase";

export function LaunchForm() {
  const router = useRouter();
  const base = useAppBase();
  const { address, isConnected } = useAccount();
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [editable, setEditable] = useState(false);
  const [market, setMarket] = useState<"eth" | "stock">("eth");
  const [quote, setQuote] = useState<string>(ZERO);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const deployed = isDeployed();

  async function onLaunch() {
    setError("");
    if (!deployed) {
      setError("Factory is not deployed yet. Run the deploy script, then set NEXT_PUBLIC_FACTORY and NEXT_PUBLIC_ROUTER.");
      return;
    }
    if (!isConnected || !address || !client) {
      setError(base ? "Waiting for the Farcaster wallet on Base." : "Connect a wallet on Base first.");
      return;
    }
    if (!name.trim() || !symbol.trim()) {
      setError("Name and symbol are required.");
      return;
    }

    try {
      setStatus("Mining a vanity salt…");
      const last = await client.readContract({
        address: FACTORY,
        abi: factoryAbi,
        functionName: "lastSaltUint",
      });
      const start = last + 1n;

      let mined = mineSalt(FACTORY, start, TOKEN_SUFFIX);
      if (mined) {
        const onchain = await client.readContract({
          address: FACTORY,
          abi: factoryAbi,
          functionName: "predictToken",
          args: [mined.salt],
        });
        if (onchain.toLowerCase() !== mined.token.toLowerCase()) {
          setStatus("Local formula missed — mining on-chain…");
          mined = await mineSaltVerified(
            (salt: Hex) =>
              client.readContract({
                address: FACTORY,
                abi: factoryAbi,
                functionName: "predictToken",
                args: [salt],
              }),
            start,
            TOKEN_SUFFIX,
          );
        }
      } else {
        mined = await mineSaltVerified(
          (salt: Hex) =>
            client.readContract({
              address: FACTORY,
              abi: factoryAbi,
              functionName: "predictToken",
              args: [salt],
            }),
          start,
          TOKEN_SUFFIX,
        );
      }

      if (!mined) throw new Error("Could not find a salt ending in b20. Retry.");

      setStatus(`Token will land at ${shortAddr(mined.token)}. Confirm in wallet…`);
      const imageUrl = image.startsWith("blob:") ? "" : image.trim();
      const sent = await confirmWrite(client, () =>
        writeContractAsync({
          address: FACTORY,
          abi: factoryAbi,
          functionName: "launch",
          args: [
            {
              name: name.trim(),
              symbol: symbol.trim().toUpperCase(),
              salt: mined.salt,
              image: imageUrl,
              description: description.trim(),
              website: website.trim(),
              twitter: twitter.trim().replace(/^@/, ""),
              telegram: telegram.trim().replace(/^@/, ""),
              editable,
              quote: (market === "eth" ? ZERO : quote) as Address,
            },
          ],
        }),
      );
      const token = (mined.token ?? predictB20Address(FACTORY, mined.salt)) as Address;
      if (!sent.ok) throw new Error("Launch transaction reverted.");
      // The server re-reads the receipt and the factory profile, so the hash
      // is all it needs — nothing typed above is taken on trust.
      void indexToken({ tx_hash: sent.hash, address: token });
      setStatus(`Live · ${shortAddr(sent.hash)}`);
      router.push(withBase(base, `/token/${token}`));
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    }
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(ev) => {
        ev.preventDefault();
        void onLaunch();
      }}
    >
      <div className="grid gap-3">
        <span className="eyebrow">Pair against</span>
        <div className="seg grid w-full grid-cols-2">
          <button
            type="button"
            className="seg-item text-center"
            data-on={market === "eth"}
            onClick={() => {
              setMarket("eth");
              setQuote(ZERO);
            }}
          >
            ◆ ETH
          </button>
          <button
            type="button"
            className="seg-item text-center"
            data-on={market === "stock"}
            onClick={() => {
              setMarket("stock");
              setQuote(STOCK_QUOTES[0].address);
            }}
          >
            ▮ Base stocks
          </button>
        </div>
        {market === "stock" && (
          <div className="flex flex-wrap gap-1.5">
            {STOCK_QUOTES.map((s) => {
              const on = quote.toLowerCase() === s.address.toLowerCase();
              return (
                <button
                  key={s.symbol}
                  type="button"
                  title={s.name}
                  className={on ? "pill pill-gold" : "pill hover:border-lime hover:text-lime"}
                  onClick={() => setQuote(s.address)}
                >
                  {s.symbol}
                </button>
              );
            })}
          </div>
        )}
        <p className="tnum text-[11px] text-faint">
          Buyers spend{" "}
          {market === "eth"
            ? "ETH"
            : (STOCK_QUOTES.find((s) => s.address.toLowerCase() === quote.toLowerCase())?.symbol ?? "the stock")}{" "}
          — you still launch a B20. Gas is always ETH.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <input className="field" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} placeholder="Trench" />
        </Field>
        <Field label="Symbol" required>
          <input
            className="field uppercase"
            maxLength={12}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="DITCH"
          />
        </Field>
      </div>
      <div className="grid gap-1.5">
        <span className="eyebrow">Logo</span>
        <LogoDrop value={image} onChange={setImage} />
      </div>
      <Field label="Description">
        <textarea
          className="field min-h-24"
          maxLength={280}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One sentence. Native B20. Liquidity locked."
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Website">
          <input className="field" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </Field>
        <Field label="X">
          <input className="field" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@handle" />
        </Field>
        <Field label="Telegram">
          <input className="field" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="t.me/…" />
        </Field>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm">
        <input type="checkbox" checked={editable} onChange={(e) => setEditable(e.target.checked)} />
        Allow me to edit this token’s public profile after launch
      </label>

      <div className="card p-4">
        <p className="eyebrow mb-2.5">What gets deployed</p>
        <dl className="grid gap-x-8 gap-y-2 text-[12px] sm:grid-cols-2">
          <Spec k="Supply" v="1,000,000,000 · 18 decimals" />
          <Spec k="Owner" v="None — admin-less" />
          <Spec k="Liquidity" v="Locked forever" />
          <Spec k="Swap fee" v="1% → 50 / 30 / 20" />
          <Spec k="Anti-snipe" v="99% → 1% over 20s" />
          <Spec k="Address" v="Vanity suffix …b20" />
        </dl>
      </div>

      {error && <p className="rounded-xl border border-ember/40 bg-ember/10 px-3 py-2.5 text-sm text-ember">{error}</p>}
      {status && (
        <p className="tnum flex items-center gap-2 rounded-xl border border-lime/30 bg-lime/10 px-3 py-2.5 text-xs text-lime">
          <span className="live-dot" style={{ background: "currentColor" }} />
          {status}
        </p>
      )}

      <button className="btn h-12 text-base" type="submit" disabled={isPending}>
        {isPending ? "Launching…" : "Launch B20"}
      </button>
    </form>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5">
      <dt className="shrink-0 text-faint">{k}</dt>
      <dd className="tnum text-right text-paper">{v}</dd>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="eyebrow">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
