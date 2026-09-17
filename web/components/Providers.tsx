"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { WagmiProvider } from "wagmi";
import { useEffect, useState, type ReactNode } from "react";
import { config } from "@/lib/wagmi";
import { PRIVY_APP_ID, privyConfig } from "@/lib/privy";
import { captureReferralFromUrl } from "@/lib/referral";

function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}

/**
 * Wallet and data providers.
 *
 * Without a Privy app id we still mount wagmi, so the board, the charts and
 * every contract read work and the site is browsable. Only logging in is
 * unavailable — ConnectButton says so. Previously a missing key replaced the
 * entire site with a setup message, which is a bad first paint for anyone who
 * just wants to look at the launches.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID) {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ReferralCapture />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={config}>
          <ReferralCapture />
          {children}
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
