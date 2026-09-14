import type { Hash, PublicClient, TransactionReceipt } from "viem";
import { BASESCAN } from "./addresses";

export function txUrl(hash: string) {
  return `${BASESCAN}/tx/${hash}`;
}

export function hashFromUnknown(err: unknown): Hash | null {
  const blob =
    err instanceof Error
      ? `${err.message} ${err.stack ?? ""} ${(err as { cause?: unknown }).cause ?? ""}`
      : String(err);
  const m = blob.match(/0x[a-fA-F0-9]{64}/);
  return m ? (m[0] as Hash) : null;
}

export function friendlyError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  if (/user rejected|denied|rejected the request/i.test(raw)) return "You rejected the signature.";
  if (/insufficient funds/i.test(raw)) return "Not enough ETH for gas.";
  if (/Slippage/i.test(raw)) return "Price moved. Try a smaller size.";
  if (/UnknownToken/i.test(raw)) return "Not a Trench token.";
  if (raw.length > 180) return "Wallet reported an error. If Basescan shows success, it went through.";
  return raw;
}

export async function waitMined(client: PublicClient, hash: Hash, timeoutMs = 120_000): Promise<TransactionReceipt> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const receipt = await client.getTransactionReceipt({ hash });
      if (receipt) return receipt;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  try {
    return await client.waitForTransactionReceipt({ hash, timeout: 15_000 });
  } catch {
    throw lastErr instanceof Error ? lastErr : new Error("Timed out waiting for the transaction.");
  }
}

export async function confirmWrite(
  client: PublicClient,
  send: () => Promise<Hash>,
): Promise<{ hash: Hash; receipt: TransactionReceipt; ok: boolean }> {
  let hash: Hash | null = null;
  try {
    hash = await send();
  } catch (e) {
    hash = hashFromUnknown(e);
    if (!hash) throw e;
  }
  const receipt = await waitMined(client, hash);
  return { hash, receipt, ok: receipt.status === "success" };
}
