import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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

export const metadata: Metadata = {
  title: "Trench — launch a B20 on Base in one transaction",
  description:
    "Instant B20 launchpad on Base. One transaction mints an admin-less token and seeds a locked Uniswap v4 pool against ETH or a Base stock.",
  icons: { icon: "/logo.jpg" },
  openGraph: {
    title: "Trench — B20 launchpad on Base",
    description: "Launch an admin-less B20 with locked liquidity. ETH or stock pairs. Free to launch.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 py-10 sm:px-6">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
