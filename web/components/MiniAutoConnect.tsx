"use client";

import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";

export function MiniAutoConnect() {
  const { isConnected } = useAccount();
  const { connect, connectors, status } = useConnect();

  useEffect(() => {
    const connector = connectors[0];
    if (!connector || isConnected || status === "pending") return;
    connect({ connector });
  }, [connect, connectors, isConnected, status]);

  return null;
}
