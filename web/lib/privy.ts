import type { PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "viem/chains";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["wallet", "google", "farcaster"],
  appearance: {
    theme: "dark",
    accentColor: "#7EC8FF",
    logo: "/logo.jpg",
    showWalletLoginFirst: true,
    walletChainType: "ethereum-only",
    walletList: [
      "detected_ethereum_wallets",
      "metamask",
      "coinbase_wallet",
      "rainbow",
      "rabby_wallet",
      "wallet_connect_qr",
    ],
  },
  defaultChain: base,
  supportedChains: [base],
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
};
