import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import { appUrl, miniHomeUrl } from "@/lib/appUrl";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const home = miniHomeUrl();
const origin = appUrl();

export const metadata: Metadata = {
  title: "Trench — launch a B20 on Base in one transaction",
  description:
    "Instant B20 launchpad on Base. One transaction mints an admin-less token and seeds a locked Uniswap v4 pool against ETH or a Base stock.",
  icons: { icon: "/icon.png" },
  openGraph: {
    title: "Trench — B20 launchpad on Base",
    description: "Launch an admin-less B20 with locked liquidity. ETH or stock pairs. Free to launch.",
    type: "website",
    images: [`${origin}/image.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${origin}/image.png`,
      button: {
        title: "Open Trench",
        action: {
          type: "launch_miniapp",
          name: "Trench",
          url: home,
          splashImageUrl: `${origin}/splash.png`,
          splashBackgroundColor: "#07080c",
        },
      },
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
