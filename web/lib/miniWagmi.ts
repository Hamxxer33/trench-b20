import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { BASE_RPC } from "./addresses";

export const miniConfig = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  ssr: true,
  transports: {
    [base.id]: http(BASE_RPC),
  },
});
