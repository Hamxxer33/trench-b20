# Trench

Instant **B20** launchpad on Base.

One transaction creates an admin-less B20 (1,000,000,000 supply) and seeds a locked Uniswap v4 ETH pool.

## Fees (o1-style)

Every swap pays **1% of the quote (ETH)**:

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
| `TrenchEscrow` | claimable ETH for creator / platform / referrer |
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

Live on Base (chain 8453):

| Contract | Address |
| --- | --- |
| Factory | [`0x1b80dB6b219B1d99057B47AC1038d80190AD3723`](https://basescan.org/address/0x1b80dB6b219B1d99057B47AC1038d80190AD3723) |
| Locker | [`0xa8eAAd47aF25B68aA491A0B0a692269716271235`](https://basescan.org/address/0xa8eAAd47aF25B68aA491A0B0a692269716271235) |
| Escrow | [`0x1CC566609531AB352AF44fCaCb9Ff9314eA7CFB2`](https://basescan.org/address/0x1CC566609531AB352AF44fCaCb9Ff9314eA7CFB2) |
| Profiles | [`0x61e3091458Ed6D8aBD0cfA0079f01ac37E848b8a`](https://basescan.org/address/0x61e3091458Ed6D8aBD0cfA0079f01ac37E848b8a) |
| Router | [`0x3aF610C51A08E7923E2624B82FB10D3728C1188C`](https://basescan.org/address/0x3aF610C51A08E7923E2624B82FB10D3728C1188C) |

Factory tx: [`0x0c9cb934…ca5e`](https://basescan.org/tx/0x0c9cb934edb6180b389aa958f4804a580bff753d07bc262c18f36c86c383ca5e)

## App

Login is **Privy** (email, Google, X, or wallet). Create an app at [dashboard.privy.io](https://dashboard.privy.io), allow `localhost:3000`, and set `NEXT_PUBLIC_PRIVY_APP_ID`.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

- `/` board
- `/launch` create
- `/token/[address]` trade + token referral link
- `/profile/[address]` identity, fee claim, global referral, launches

Unaudited. Use at your own risk.
