"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { shortAddr } from "@/lib/format";

export function ConnectButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!ready) {
    return (
      <button className="btn-ghost" disabled>
        …
      </button>
    );
  }

  if (authenticated && chainId && chainId !== base.id) {
    return (
      <button className="btn-ghost" onClick={() => switchChain({ chainId: base.id })}>
        Switch to Base
      </button>
    );
  }

  if (authenticated) {
    return (
      <button className="btn-ghost font-mono text-xs" onClick={() => void logout()}>
        {address ? shortAddr(address) : "Log out"}
      </button>
    );
  }

  return (
    <button className="btn" onClick={() => login()}>
      Log in
    </button>
  );
}
