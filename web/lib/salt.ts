import { type Address, type Hex, encodeAbiParameters, keccak256, pad, toHex } from "viem";
import { TOKEN_SUFFIX } from "./addresses";

function suffixOf(addr: Address) {
  return Number(BigInt(addr) & 0xfffn);
}

/**
 * Canonical B20 address:
 * byte[0] = 0xB2, bytes[1:10] = 0, byte[10] = variant,
 * bytes[11:20] = keccak256(abi.encode(sender, salt))[0:9]
 */
export function predictB20Address(deployer: Address, salt: Hex, variant = 0): Address {
  const hash = keccak256(encodeAbiParameters([{ type: "address" }, { type: "bytes32" }], [deployer, salt]));
  const tail = hash.slice(2, 20);
  const prefix = variant === 0 ? "b200000000000000000000" : "b201000000000000000000";
  return (`0x${prefix}${tail}`) as Address;
}

export function mineSalt(deployer: Address, startFrom: bigint, suffix = TOKEN_SUFFIX, maxTries = 80_000) {
  for (let i = 0n; i < BigInt(maxTries); i++) {
    const n = startFrom + i;
    const salt = pad(toHex(n), { size: 32 });
    const token = predictB20Address(deployer, salt);
    if (suffixOf(token) === suffix) {
      return { salt, token, tries: Number(i) + 1, saltUint: n };
    }
  }
  return null;
}

export async function mineSaltVerified(
  predict: (salt: Hex) => Promise<Address>,
  startFrom: bigint,
  suffix = TOKEN_SUFFIX,
  maxTries = 12_000,
) {
  for (let i = 0n; i < BigInt(maxTries); i++) {
    const n = startFrom + i;
    const salt = pad(toHex(n), { size: 32 });
    const token = await predict(salt);
    if (suffixOf(token) === suffix) {
      return { salt, token, tries: Number(i) + 1, saltUint: n };
    }
  }
  return null;
}
