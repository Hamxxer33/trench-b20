import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
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
  title: "Trench Launchpad — B20 tokens on Base",
  description: "Create and discover B20 tokens on Base. Launch in seconds, no code required.",
  icons: { icon: "/logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Providers>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-4.25rem)] max-w-6xl px-4 py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
