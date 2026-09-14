"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
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

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (!PRIVY_APP_ID) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-md text-sm text-mute">
          Set <span className="font-mono text-lime">NEXT_PUBLIC_PRIVY_APP_ID</span> in{" "}
          <span className="font-mono">web/.env.local</span>. Create an app at{" "}
          <a className="text-lime underline" href="https://dashboard.privy.io" target="_blank" rel="noreferrer">
            dashboard.privy.io
          </a>{" "}
          and allow <span className="font-mono">localhost:3000</span>.
        </p>
      </div>
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <ReferralCapture />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
