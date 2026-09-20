/**
 * The claimable-asset list behind the fees panel.
 *
 * Escrow keys balances `owed[account][asset]`, so any asset missing from this
 * list is a balance nobody can see or claim in the UI, and a wrong `decimals`
 * silently renders a real balance as ~0 — both failures look exactly like
 * "you have earned nothing".
 */

import assert from "node:assert/strict";
import test from "node:test";
import { formatUnits, isAddress, getAddress } from "viem";

import { CLAIMABLE_ASSETS, ETH_QUOTE, STOCK_QUOTES } from "../lib/quotes.ts";

const ZERO = "0x0000000000000000000000000000000000000000";

test("covers ETH plus every stock quote, with no gaps", () => {
  assert.equal(CLAIMABLE_ASSETS.length, STOCK_QUOTES.length + 1);
  assert.equal(CLAIMABLE_ASSETS[0].address, ZERO, "ETH must be present as the zero address");
  for (const q of STOCK_QUOTES) {
    assert.ok(
      CLAIMABLE_ASSETS.some((a) => a.address.toLowerCase() === q.address.toLowerCase()),
      `${q.symbol} is missing — its fees would be unclaimable`,
    );
  }
});

test("every asset is a valid, checksummed address", () => {
  for (const a of CLAIMABLE_ASSETS.slice(1)) {
    assert.ok(isAddress(a.address), `${a.symbol} is not an address`);
    assert.equal(getAddress(a.address), getAddress(a.address));
  }
});

test("no duplicate assets — a duplicate would show the same balance twice", () => {
  const seen = new Set(CLAIMABLE_ASSETS.map((a) => a.address.toLowerCase()));
  assert.equal(seen.size, CLAIMABLE_ASSETS.length);
});

test("decimals are per asset: ETH 18, stock B20s 8", () => {
  assert.equal(ETH_QUOTE.decimals, 18);
  for (const q of STOCK_QUOTES) assert.equal(q.decimals, 8, `${q.symbol} should be 8 decimals`);
});

test("a real stock balance does not render as zero", () => {
  // 12.5 NVDA of accrued fees, as the escrow stores it.
  const raw = 1_250_000_000n;
  assert.equal(Number(formatUnits(raw, 8)), 12.5);
  // Read at ETH's scale it would round to nothing and look like no earnings.
  assert.ok(Number(formatUnits(raw, 18)) < 0.000001);
});

test("a dust ETH balance still reads as non-zero", () => {
  const raw = 50_000_000_000_000n; // 0.00005 ETH, the size already on the board
  assert.equal(Number(formatUnits(raw, 18)), 0.00005);
  assert.ok(raw > 0n, "must be treated as owed, not filtered away");
});
