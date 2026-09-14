import { http } from "wagmi";
import { base } from "wagmi/chains";
import { createConfig } from "@privy-io/wagmi";
import { BASE_RPC } from "./addresses";

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(BASE_RPC),
  },
});
