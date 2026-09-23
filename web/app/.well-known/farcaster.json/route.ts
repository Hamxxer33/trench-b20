import { NextResponse } from "next/server";

const ORIGIN = "https://launch.trenchb20.fun";

const miniapp = {
  version: "1",
  name: "Trench",
  subtitle: "B20 launchpad on Base",
  description:
    "Launch and trade B20 tokens on Base from Farcaster. ETH or stock pairs, locked Uniswap v4. No extra login.",
  iconUrl: `${ORIGIN}/icon.png`,
  homeUrl: `${ORIGIN}/mini`,
  imageUrl: `${ORIGIN}/image.png`,
  splashImageUrl: `${ORIGIN}/splash.png`,
  splashBackgroundColor: "#07080c",
  buttonTitle: "Open Trench",
  primaryCategory: "finance",
  tags: ["launchpad", "base", "b20", "stocks"],
  requiredChains: ["eip155:8453"],
  requiredCapabilities: ["wallet.getEthereumProvider"],
  tagline: "Launch B20s from Farcaster",
  ogTitle: "Trench Launchpad",
  ogDescription: "Create and trade B20 tokens on Base.",
  ogImageUrl: `${ORIGIN}/image.png`,
  webhookUrl: `${ORIGIN}/api/webhook`,
};

export function GET() {
  return NextResponse.json(
    {
      accountAssociation: {
        header:
          "eyJmaWQiOjEwNzk5MjIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg3NWNhQTExM0Y1NzJhNDA3RWRiOGE0OUZjZTFjZjk0MTBFZjE4ODFjIn0",
        payload: "eyJkb21haW4iOiJsYXVuY2gudHJlbmNoYjIwLmZ1biJ9",
        signature:
          "Qu0TUi3uugSDdk6J7ob04YP7jLRBDLcSftAyxaB6s3hsWVDmU8m/q+T53kp6EIBjD+AhbjjGnquYfooXvcI3Lxw=",
      },
      miniapp,
      frame: miniapp,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    },
  );
}
