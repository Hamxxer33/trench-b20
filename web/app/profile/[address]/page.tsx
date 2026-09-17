"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { erc20Abi, escrowAbi, factoryAbi, profilesAbi } from "@/lib/abi";
import { ESCROW, FACTORY, PROFILES, ZERO } from "@/lib/addresses";
import { formatEth, shortAddr } from "@/lib/format";
import { referralLink } from "@/lib/referral";
import { TokenMark } from "@/components/Mark";
import { confirmWrite, friendlyError } from "@/lib/tx";

type Created = { token: Address; name: string; symbol: string; image: string };

export default function ProfilePage() {
  const params = useParams<{ address: string }>();
  const account = params.address as Address;
  const valid = isAddress(account);
  const { address } = useAccount();
  const mine = valid && address && account.toLowerCase() === address.toLowerCase();
  const client = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: profile, refetch } = useReadContract({
    address: PROFILES,
    abi: profilesAbi,
    functionName: "profiles",
    args: valid ? [account] : undefined,
    query: { enabled: valid && PROFILES !== ZERO },
  });
  const { data: owed, refetch: refetchOwed } = useReadContract({
    address: ESCROW,
    abi: escrowAbi,
    functionName: "owed",
    args: valid ? [account, ZERO] : undefined,
    query: { enabled: valid && ESCROW !== ZERO },
  });

  const [tokens, setTokens] = useState<Created[]>([]);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client || !valid || PROFILES === ZERO) return;
    let cancelled = false;
    (async () => {
      try {
        const n = await client.readContract({
          address: PROFILES,
          abi: profilesAbi,
          functionName: "launchCount",
          args: [account],
        });
        const addrs =
          n === 0n
            ? []
            : await client.readContract({
                address: PROFILES,
                abi: profilesAbi,
                functionName: "launches",
                args: [account, 0n, 80n],
              });
        const rows: Created[] = await Promise.all(
          addrs.map(async (token) => {
            let image = "";
            let tokenName = shortAddr(token);
            let tokenSymbol = "";
            try {
              const tp = await client.readContract({
                address: FACTORY,
                abi: factoryAbi,
                functionName: "tokenProfiles",
                args: [token],
              });
              image = tp[8];
            } catch {
              /* ignore */
            }
            try {
              tokenName = await client.readContract({ address: token, abi: erc20Abi, functionName: "name" });
              tokenSymbol = await client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" });
            } catch {
              /* ignore */
            }
            return { token, name: tokenName, symbol: tokenSymbol, image };
          }),
        );
        if (!cancelled) setTokens(rows);
      } catch {
        if (!cancelled) setTokens([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, valid, account]);

  if (!valid) return <p className="text-ember">Not an address.</p>;

  const display = profile?.[0] || shortAddr(account);

  async function save() {
    if (!client) return;
    setError("");
    try {
      setStatus("Saving…");
      const sent = await confirmWrite(client, () =>
        writeContractAsync({
          address: PROFILES,
          abi: profilesAbi,
          functionName: "setProfile",
          args: [name, bio, avatar, website, twitter.replace(/^@/, ""), telegram.replace(/^@/, "")],
        }),
      );
      if (!sent.ok) throw new Error("Save reverted.");
      await refetch();
      setStatus("Saved");
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    }
  }

  async function claim() {
    if (!client) return;
    setError("");
    try {
      setStatus("Claiming…");
      const sent = await confirmWrite(client, () =>
        writeContractAsync({
          address: ESCROW,
          abi: escrowAbi,
          functionName: "claim",
          args: [ZERO],
        }),
      );
      if (!sent.ok) throw new Error("Claim reverted.");
      await refetchOwed();
      setStatus("Claimed");
    } catch (e) {
      setStatus("");
      setError(friendlyError(e));
    }
  }

  function copyRef() {
    const link = referralLink(window.location.origin, account);
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-7">
      <div className="card flex flex-wrap items-start gap-4 p-5">
        <TokenMark address={account} src={profile?.[2] || undefined} size={72} />
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Creator</span>
          <h1 className="mt-1 truncate font-display text-4xl">{display}</h1>
          <p className="tnum text-xs text-faint">{shortAddr(account)}</p>
          {profile?.[1] && <p className="mt-3 text-[14px] text-mute">{profile[1]}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="eyebrow">Tokens created</div>
          <div className="tnum mt-1.5 text-3xl">{tokens.length}</div>
        </div>
        <div className="card p-4">
          <div className="eyebrow">Claimable ETH</div>
          <div className="tnum mt-1.5 text-3xl text-up">{owed ? formatEth(owed, 4) : "0"}</div>
          {mine && (
            <button className="btn mt-3 w-full" type="button" disabled={isPending || !owed} onClick={() => void claim()}>
              Claim fees
            </button>
          )}
        </div>
        <div className="card p-4">
          <div className="eyebrow">Referral</div>
          <p className="mt-2 text-[13px] text-mute">20% of every swap fee you send in.</p>
          <button className="btn-ghost mt-3 w-full" type="button" onClick={copyRef}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      </div>

      {mine && PROFILES !== ZERO && (
        <form
          className="card grid gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <p className="font-display text-xl">Edit identity</p>
          <input className="field" placeholder="Display name" defaultValue={profile?.[0]} onChange={(e) => setName(e.target.value)} />
          <textarea className="field min-h-20" placeholder="Bio" defaultValue={profile?.[1]} onChange={(e) => setBio(e.target.value)} />
          <input className="field" placeholder="Avatar URL" defaultValue={profile?.[2]} onChange={(e) => setAvatar(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="field" placeholder="Website" defaultValue={profile?.[3]} onChange={(e) => setWebsite(e.target.value)} />
            <input className="field" placeholder="X" defaultValue={profile?.[4]} onChange={(e) => setTwitter(e.target.value)} />
            <input className="field" placeholder="Telegram" defaultValue={profile?.[5]} onChange={(e) => setTelegram(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={isPending}>
            Save profile
          </button>
        </form>
      )}

      {error && <p className="text-sm text-ember">{error}</p>}
      {status && <p className="tnum text-xs text-lime">{status}</p>}

      <div>
        <h2 className="font-display text-2xl">Created tokens</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {tokens.length === 0 && (
            <p className="text-sm text-mute">No Trench launches from this wallet yet.</p>
          )}
          {tokens.map((t) => (
            <Link
              key={t.token}
              href={`/token/${t.token}`}
              className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 transition hover:border-lime/40 hover:bg-panel2"
            >
              <TokenMark address={t.token} src={t.image || undefined} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{t.name}</div>
                <div className="tnum text-[11px] text-lime">${t.symbol}</div>
              </div>
              <span className="tnum text-[11px] text-faint">open →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
