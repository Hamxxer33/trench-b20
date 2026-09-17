/**
 * Decode + money math for the trade verifier.
 *
 * Run: npm test
 *
 * These build real Trade logs with viem's encoder and push them back through
 * the same ABI the server uses, so a drift between the Solidity event and
 * lib/events.ts shows up here rather than as wrong volume on the board.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { encodeEventTopics, encodeAbiParameters, parseEventLogs, parseEther } from "viem";

import { splitLegs, toFloat, tradeEventAbi } from "../lib/events.ts";

const ROUTER = "0x8d984c9f176157b11144c803eefb74cc76e1b708";
const TOKEN = "0xb200000000000000000000d9192b6b456483c2e8";
const TRADER = "0x8564d4849a520d9373f3fb3bcc91c7400e3089b6";
const ZERO = "0x0000000000000000000000000000000000000000";
const NO_COMMENT = `0x${"00".repeat(32)}`;

function tradeLog({
  token = TOKEN,
  trader = TRADER,
  referrer = ZERO,
  isBuy = true,
  amountIn = 0n,
  amountOut = 0n,
  fee = 0n,
  address = ROUTER,
  logIndex = 0,
} = {}) {
  return {
    address,
    topics: encodeEventTopics({
      abi: tradeEventAbi,
      eventName: "Trade",
      args: { token, trader, referrer },
    }),
    data: encodeAbiParameters(
      [{ type: "bool" }, { type: "uint256" }, { type: "uint256" }, { type: "uint256" }, { type: "bytes32" }],
      [isBuy, amountIn, amountOut, fee, NO_COMMENT],
    ),
    blockNumber: 51306713n,
    logIndex,
    transactionHash: `0x${"ab".repeat(32)}`,
  };
}

const decode = (logs) => parseEventLogs({ abi: tradeEventAbi, eventName: "Trade", logs });

test("decodes a Trade event emitted by the router", () => {
  const [log] = decode([tradeLog({ amountIn: parseEther("0.25"), amountOut: 1_000n * 10n ** 18n })]);
  assert.equal(log.args.token.toLowerCase(), TOKEN);
  assert.equal(log.args.trader.toLowerCase(), TRADER);
  assert.equal(log.args.isBuy, true);
  assert.equal(log.args.amountIn, parseEther("0.25"));
});

test("a buy spends quote, a sell receives it", () => {
  const buy = splitLegs(true, 100n, 7n);
  assert.deepEqual(buy, { quoteRaw: 100n, tokenRaw: 7n });

  const sell = splitLegs(false, 7n, 100n);
  assert.deepEqual(sell, { quoteRaw: 100n, tokenRaw: 7n });
});

test("ETH pairs price at 18 decimals", () => {
  assert.equal(toFloat(parseEther("0.25"), 18), 0.25);
  assert.equal(toFloat(parseEther("1"), 18), 1);
});

test("stock pairs price at 8 decimals, not 18", () => {
  // 12.5 AAPL-B20, which has 8 decimals.
  const raw = 1_250_000_000n;
  assert.equal(toFloat(raw, 8), 12.5);
  // Reading it as ETH would have silently shown ~0.0000000000125.
  assert.notEqual(toFloat(raw, 18), 12.5);
});

test("large token amounts stay exact to the unit", () => {
  // Full 1e9 supply at 18 decimals — naive Number division loses the tail.
  const supply = 1_000_000_000n * 10n ** 18n;
  assert.equal(toFloat(supply, 18), 1_000_000_000);
  assert.equal(toFloat(supply + 10n ** 18n, 18), 1_000_000_001);
});

test("zero is zero at any scale", () => {
  assert.equal(toFloat(0n, 18), 0);
  assert.equal(toFloat(0n, 8), 0);
});

test("logs from a different contract are filtered out", () => {
  const impostor = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
  const logs = decode([
    tradeLog({ amountIn: parseEther("1"), logIndex: 0 }),
    tradeLog({ address: impostor, amountIn: parseEther("999"), logIndex: 1 }),
  ]);
  const mine = logs.filter((l) => l.address.toLowerCase() === ROUTER);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].args.amountIn, parseEther("1"));
});

test("one tx can carry several fills and each keeps its log index", () => {
  const logs = decode([
    tradeLog({ amountIn: parseEther("1"), logIndex: 3 }),
    tradeLog({ isBuy: false, amountIn: 5n * 10n ** 18n, amountOut: parseEther("0.5"), logIndex: 9 }),
  ]);
  assert.deepEqual(
    logs.map((l) => l.logIndex),
    [3, 9],
  );
  assert.equal(splitLegs(logs[1].args.isBuy, logs[1].args.amountIn, logs[1].args.amountOut).quoteRaw, parseEther("0.5"));
});

test("the referrer survives the round trip", () => {
  const ref = "0x1111111111111111111111111111111111111111";
  const [log] = decode([tradeLog({ referrer: ref, amountIn: parseEther("1") })]);
  assert.equal(log.args.referrer.toLowerCase(), ref);
});
