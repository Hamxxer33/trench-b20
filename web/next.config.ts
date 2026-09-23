import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@privy-io/react-auth",
    "@privy-io/wagmi",
    "@farcaster/miniapp-sdk",
    "@farcaster/miniapp-wagmi-connector",
  ],
  async headers() {
    return [
      {
        source: "/mini/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://*.farcaster.xyz https://*.warpcast.com https://farcaster.xyz https://warpcast.com;",
          },
        ],
      },
      {
        source: "/.well-known/farcaster.json",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
};

export default nextConfig;
