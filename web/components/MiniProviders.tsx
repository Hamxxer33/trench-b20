"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useEffect, useState, type ReactNode } from "react";
import { miniConfig } from "@/lib/miniWagmi";
import { AppBaseProvider } from "@/lib/appBase";
import { captureReferralFromUrl } from "@/lib/referral";
import { FarcasterReady } from "./FarcasterReady";
import { MiniAutoConnect } from "./MiniAutoConnect";

function ReferralCapture() {
  useEffect(() => {
    captureReferralFromUrl();
  }, []);
  return null;
}

export function MiniProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <AppBaseProvider base="/mini">
      <WagmiProvider config={miniConfig}>
        <QueryClientProvider client={queryClient}>
          <FarcasterReady />
          <MiniAutoConnect />
          <ReferralCapture />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AppBaseProvider>
  );
}
