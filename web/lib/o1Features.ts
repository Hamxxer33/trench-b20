export type FeatureStatus = "live" | "soon";

export type Feature = {
  title: string;
  blurb: string;
  status: FeatureStatus;
  href?: string;
};

/** o1 Launchpad surfaces, mapped to what Trench can do on Base today. */
export const O1_FEATURES: Feature[] = [
  {
    title: "Launch on Base",
    blurb: "1B B20, locked Uniswap v4, free besides gas.",
    status: "live",
    href: "/launch",
  },
  {
    title: "ETH or stock pair",
    blurb: "Pair against ETH or a Base stock B20 (AAPL, TSLA, NVDA, …).",
    status: "live",
    href: "/launch",
  },
  {
    title: "Buy & sell",
    blurb: "Exact-in swaps through TrenchRouter with the Farcaster wallet.",
    status: "live",
  },
  {
    title: "Anti-snipe",
    blurb: "Fee starts at 99% and decays to 1% over 20 seconds.",
    status: "live",
  },
  {
    title: "Feed · New",
    blurb: "Live board of Trench launches on Base.",
    status: "live",
    href: "/",
  },
  {
    title: "Volume board",
    blurb: "Indexed trade volume leaderboard.",
    status: "live",
    href: "/",
  },
  {
    title: "Search",
    blurb: "Find a token by name, ticker, or 0x.",
    status: "live",
  },
  {
    title: "GeckoTerminal chart",
    blurb: "Embedded price chart on every token page.",
    status: "live",
  },
  {
    title: "Creator profile",
    blurb: "Identity, launches, and onchain fee claims.",
    status: "live",
    href: "/profile",
  },
  {
    title: "Referral links",
    blurb: "Global and per-token referral attribution.",
    status: "live",
  },
  {
    title: "All / Crypto / Stocks tabs",
    blurb: "Filter the board by ETH markets vs stock markets.",
    status: "live",
    href: "/",
  },
  {
    title: "Trending now",
    blurb: "o1-style ranked feed from live 24h activity and liquidity.",
    status: "soon",
  },
  {
    title: "Sort by liquidity / 24h volume",
    blurb: "Ranked views with pool-coverage checks.",
    status: "soon",
  },
  {
    title: "USDC & Coinbase majors",
    blurb: "Pair against USDC, cbBTC, cbDOGE, and other registered crypto majors.",
    status: "soon",
  },
  {
    title: "Dev buy at launch",
    blurb: "Create the token and buy in the same transaction.",
    status: "soon",
  },
  {
    title: "Holders",
    blurb: "Labeled holder list: creator, LP, you, infrastructure.",
    status: "soon",
  },
  {
    title: "Comments",
    blurb: "Public comments on a token page.",
    status: "soon",
  },
  {
    title: "Announcements",
    blurb: "Creator-signed updates on the token.",
    status: "soon",
  },
  {
    title: "Staking vaults",
    blurb: "Optional fully funded reward vault after launch.",
    status: "soon",
  },
  {
    title: "Cashback tiers",
    blurb: "Trade more, earn back up to 0.40% across markets.",
    status: "soon",
  },
  {
    title: "Spot · Limit · Sniper · TWAP",
    blurb: "o1 Terminal order types from a single ticket.",
    status: "soon",
  },
  {
    title: "Unified swap",
    blurb: "Memecoins, stocks, and synthetics across chains.",
    status: "soon",
  },
  {
    title: "Multi-chain",
    blurb: "Robinhood, Monad, Arc, BSC, and X Layer factories.",
    status: "soon",
  },
  {
    title: "Trade comments",
    blurb: "Public note attached to a swap.",
    status: "soon",
  },
  {
    title: "Slippage & impact guards",
    blurb: "1/3/10% presets, warn at 10%, block at 50%.",
    status: "soon",
  },
  {
    title: "IPFS token profile",
    blurb: "Store image and metadata on IPFS at launch.",
    status: "soon",
  },
  {
    title: "Chart markers",
    blurb: "Launch, creator trades, and announcements on the chart.",
    status: "soon",
  },
  {
    title: "Cross-chain search",
    blurb: "Search tokens across every o1 chain from one box.",
    status: "soon",
  },
  {
    title: "Notifications",
    blurb: "Farcaster mini-app alerts for launches and fills.",
    status: "soon",
  },
];
