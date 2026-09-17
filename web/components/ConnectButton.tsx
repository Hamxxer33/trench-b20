"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { shortAddr } from "@/lib/format";
import { PRIVY_APP_ID } from "@/lib/privy";

/**
 * Two components, not one branch: `usePrivy` throws outside PrivyProvider, and
 * hooks cannot be called conditionally. The provider is only mounted when an
 * app id exists, so the choice has to happen before the hook runs.
 */
export function ConnectButton() {
  if (!PRIVY_APP_ID) return <LoginUnavailable />;
  return <PrivyConnect />;
}

function LoginUnavailable() {
  return (
    <button
      className="btn-ghost cursor-not-allowed px-3 text-[13px] opacity-60"
      disabled
      title="Set NEXT_PUBLIC_PRIVY_APP_ID to enable login"
    >
      Log in
    </button>
  );
}

function PrivyConnect() {
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
      <button className="btn-ghost text-[13px]" onClick={() => switchChain({ chainId: base.id })}>
        Switch to Base
      </button>
    );
  }

  if (authenticated) {
    return (
      <button className="btn-ghost tnum text-xs" onClick={() => void logout()}>
        {address ? shortAddr(address) : "Log out"}
      </button>
    );
  }

  return (
    <button className="btn h-9 px-4 text-[13.5px]" onClick={() => login()}>
      Log in
    </button>
  );
}
