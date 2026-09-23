"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export default function MiniProfileIndex() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected && address) router.replace(`/mini/profile/${address}`);
  }, [address, isConnected, router]);

  return <p className="font-mono text-sm text-mute">Connecting Farcaster wallet…</p>;
}
