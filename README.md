# Trench

Instant **B20** launchpad on Base.

One transaction creates an admin-less B20 (1,000,000,000 supply) and seeds a locked Uniswap v4 pool against **ETH or a Base stock B20**.

## Fees (o1-style)

Every swap pays **1% of the quote asset** (ETH, or the stock you paired against):

| Recipient | Share of the 1% |
| --- | ---: |
| Creator | 50% |
| Platform wallet | 30% |
| Referrer | 20% |

No referrer → the 20% goes to the platform. For the first 20 seconds the total fee starts at 99% and decays to 1%; the extra above 1% is anti-snipe and goes to the platform.

Launch is **free** — Base gas only. No protocol creation fee.

Claim from **Profile → Claim fees**. Balances sit in `TrenchEscrow` until claimed.

## Contracts

| Contract | Role |
| --- | --- |
| `TrenchFactory` | create B20, seed pool, token profiles |
| `TrenchLocker` | owns the v4 position forever (no withdraw) |
| `TrenchRouter` | buy/sell, 1% fee, referral, anti-snipe |
| `TrenchEscrow` | claimable quote (ETH or stock) for creator / platform / referrer |
| `TrenchProfiles` | user identity + first-write-wins global referrer |

Platform wallet (30% of swap fees):

`0x8564d4849A520D9373f3FB3BCC91c7400E3089B6`

```bash
cd contracts
export RPC_URL=https://mainnet.base.org
export PRIVATE_KEY=0x...
export PLATFORM=0x8564d4849A520D9373f3FB3BCC91c7400E3089B6
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

Live on Base (chain 8453), ETH + stock pairs:

| Contract | Address |
| --- | --- |
| Factory | [`0x4F03402ba3DC942fDE77F31B335ae51111129d55`](https://basescan.org/address/0x4F03402ba3DC942fDE77F31B335ae51111129d55) |
| Locker | [`0x816ECAff16c44689F01B44b939c4261bf6BF2De7`](https://basescan.org/address/0x816ECAff16c44689F01B44b939c4261bf6BF2De7) |
| Escrow | [`0x193BcAc66a18B4b7CC47eE975F9917eD9ed0Ae92`](https://basescan.org/address/0x193BcAc66a18B4b7CC47eE975F9917eD9ed0Ae92) |
| Profiles | [`0x386c8634893bc6547FDc6C63Cdd2Af2573f4C360`](https://basescan.org/address/0x386c8634893bc6547FDc6C63Cdd2Af2573f4C360) |
| Router | [`0x8D984C9F176157b11144C803EEFB74CC76e1B708`](https://basescan.org/address/0x8D984C9F176157b11144C803EEFB74CC76e1B708) |

Factory tx: [`0xec4e1b5b…6f4a`](https://basescan.org/tx/0xec4e1b5bbe103c67eabef6e74a769c9f49f1757d9487e336bb94f037ef156f4a)

On a stock pair, buyers spend that stock B20 (approve + transfer), not ETH. ETH is still required for gas. The deployer private key lives only in gitignored `contracts/.env` and is never sent to Vercel.

## App

Login is **Privy** (wallet, Google, or Farcaster). Create an app at [dashboard.privy.io](https://dashboard.privy.io), allow `localhost:3000`, and set `NEXT_PUBLIC_PRIVY_APP_ID`.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

- `/` board — live fill tape, spotlight token, stat strip, sortable tile grid
- `/dashboard` full board — grid or table, search, sort and pair filters
- `/launch` create
- `/token/[address]` chart, market stats, live fills, trade panel, referral link
- `/profile/[address]` identity, fee claim, global referral, launches

Sort by New, Top volume or Most traded; filter by ETH or stock pairs. Volume on
a tile is denominated in that pool's own quote asset, so an AAPL-paired token
reads in AAPL and never gets added to an ETH total.

The site is browsable without `NEXT_PUBLIC_PRIVY_APP_ID` — the board, charts
and contract reads all work from Base, and only login is disabled. Set the key
to enable wallet, Google and Farcaster login.

## Backend

Next.js route handlers under `web/app/api`. Base is the source of truth; the
database is an index in front of it.

**Every write is proved against the chain first.** A client posts a tx hash and
nothing else that counts — the server pulls the receipt, finds the `Launched`
event from our factory or the `Trade` event from our router, and stores what
those say. Amounts, side, trader and quote asset are never taken from the
request body, so the volume on the board cannot be inflated by anyone holding
the anon key (it ships in the bundle — it always was public).

| Route | Does |
| --- | --- |
| `GET /api/tokens` | board, with `?q=`, `?creator=`, paging |
| `POST /api/tokens` | index a launch from `{ tx_hash }` |
| `GET /api/tokens/[address]` | one token + its rolled-up stats |
| `GET /api/trades` | fills, by `?token=` or `?trader=` |
| `POST /api/trades` | index a fill from `{ tx_hash }` |
| `GET /api/stats` | totals + top tokens, aggregated in Postgres |
| `GET /api/profiles/[address]` | cached profile, falls back to a live read |
| `POST /api/profiles/[address]` | refresh that cache from `TrenchProfiles` |
| `POST /api/upload` | launch logo, type-sniffed, service-role write |
| `GET /api/health` | which env vars actually landed on this deploy |

**Stock pairs count now.** The old client hardcoded `amount_eth: 0` for
anything not paired against ETH, so every AAPL- or TSLA-paired fill recorded as
zero volume. Trades carry `quote` and `amount_quote` scaled by that asset's own
decimals (8 for a stock B20, 18 for ETH); `amount_eth` stays populated only for
ETH pairs, so "volume in ETH" never sums Apple shares into it.

Setup:

1. Supabase → SQL editor → run `supabase/schema.sql`. Upgrading an existing
   database instead: run `supabase/migrations/0001_backend.sql` first, then
   `schema.sql` (it is idempotent).
2. Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel. **Server-side only** — the
   `NEXT_PUBLIC_` prefix would publish it, and it bypasses RLS.
3. Hit `/api/health` after deploying. `ready: true` means the keys, the RPC and
   the database all answered.

RLS is now read-only for the anon key; writes happen with the service role
behind the API. `npm test` in `web/` covers the decode and the amount scaling.

## GitHub / Vercel

Do **not** commit `.env`, `.env.local`, or `.env.production`. Copy `web/.env.example` locally, and paste the same `NEXT_PUBLIC_*` keys into the Vercel project settings. Never add `PRIVATE_KEY`.

Import the app on Vercel from GitHub:

1. [vercel.com/new](https://vercel.com/new) → import `Hamxxer33/trench-b20` (public) or `Hamxxer33/trench-launchpad` (private; GitHub app must be allowed).
2. Set **Root Directory** to `web`.
3. Framework: Next.js. Add env vars in the Vercel dashboard, not in git.
4. Add the Vercel domain in the Privy dashboard allowlist.

Unaudited. Use at your own risk.
