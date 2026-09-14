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

export function LaunchForm() {
  const router = useRouter();
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
      setError("Connect a wallet on Base first.");
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
      void indexToken({
        address: token,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        creator: address,
        image: imageUrl,
        description: description.trim(),
        tx_hash: sent.hash,
      });
      setStatus(`Live · ${shortAddr(sent.hash)}`);
      router.push(`/token/${token}`);
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
        <span className="font-mono text-[11px] uppercase tracking-wide text-mute">Pair</span>
        <div className="grid grid-cols-2 rounded-full bg-panel p-1">
          <button
            type="button"
            className={`rounded-full py-2 text-sm ${market === "eth" ? "bg-lime text-[#071018]" : "text-mute"}`}
            onClick={() => {
              setMarket("eth");
              setQuote(ZERO);
            }}
          >
            ETH
          </button>
          <button
            type="button"
            className={`rounded-full py-2 text-sm ${market === "stock" ? "bg-lime text-[#071018]" : "text-mute"}`}
            onClick={() => {
              setMarket("stock");
              setQuote(STOCK_QUOTES[0].address);
            }}
          >
            Stocks
          </button>
        </div>
        {market === "stock" && (
          <div className="flex flex-wrap gap-2">
            {STOCK_QUOTES.map((s) => (
              <button
                key={s.symbol}
                type="button"
                className={`rounded-full border px-3 py-1.5 font-mono text-xs ${
                  quote.toLowerCase() === s.address.toLowerCase()
                    ? "border-lime bg-lime/10 text-paper"
                    : "border-line text-mute"
                }`}
                onClick={() => setQuote(s.address)}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        )}
        <p className="font-mono text-[11px] text-mute">
          Buyers pay {market === "eth" ? "ETH" : STOCK_QUOTES.find((s) => s.address.toLowerCase() === quote.toLowerCase())?.symbol ?? "stock"} ·
          you still launch a B20
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
        <span className="font-mono text-[11px] uppercase tracking-wide text-mute">Logo</span>
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

      <label className="flex items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-3 text-sm">
        <input type="checkbox" checked={editable} onChange={(e) => setEditable(e.target.checked)} />
        Allow me to edit this token’s public profile after launch
      </label>

      <div className="rounded-2xl border border-line bg-panel p-4 font-mono text-xs leading-relaxed text-mute">
        <div>Supply 1,000,000,000 · 18 decimals · B20 Asset</div>
        <div>Admin-less. Cap equals supply. Liquidity locked.</div>
        <div>Swap fee 1% in the paired asset → 50% creator / 30% platform / 20% referral</div>
        <div>Anti-snipe 99% → 1% over 20s · launch is free (Base gas only)</div>
        <div>Vanity suffix …b20</div>
      </div>

      {error && <p className="rounded-xl bg-ember/15 px-3 py-2 text-sm text-ember">{error}</p>}
      {status && <p className="font-mono text-xs text-lime">{status}</p>}

      <button className="btn h-12 text-base" type="submit" disabled={isPending}>
        {isPending ? "Launching…" : "Launch B20"}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-mute">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
