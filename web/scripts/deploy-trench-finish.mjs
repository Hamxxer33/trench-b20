import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const contracts = join(process.cwd(), "..", "contracts");
const rpc = "https://mainnet.base.org";
const factory = "0x4f03402ba3dc942fde77f31b335ae51111129d55";
const poolManager = "0x498581fF718922c3f8e6A244956aF099B2652b2b";

function loadEnv() {
  const out = {};
  for (const line of readFileSync(join(contracts, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function artifact(name) {
  return JSON.parse(readFileSync(join(contracts, "out", `${name}.sol`, `${name}.json`), "utf8"));
}

const env = loadEnv();
let pk = env.PRIVATE_KEY;
if (!pk.startsWith("0x")) pk = `0x${pk}`;

const account = privateKeyToAccount(pk);
const transport = http(rpc);
const publicClient = createPublicClient({ chain: base, transport });
const wallet = createWalletClient({ account, chain: base, transport });
const factoryArt = artifact("TrenchFactory");
const routerArt = artifact("TrenchRouter");

const locker = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "locker" });
const escrow = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "escrow" });
const profiles = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "userProfiles" });
const existingRouter = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "router" });
console.log({ factory, locker, escrow, profiles, existingRouter });

let router = existingRouter;
if (router === "0x0000000000000000000000000000000000000000") {
  const routerHash = await wallet.deployContract({
    abi: routerArt.abi,
    bytecode: routerArt.bytecode.object,
    args: [poolManager, factory],
  });
  console.log("router_tx", routerHash);
  const routerRcpt = await publicClient.waitForTransactionReceipt({ hash: routerHash });
  if (routerRcpt.status !== "success") throw new Error("router deploy failed");
  router = routerRcpt.contractAddress;
  console.log("TrenchRouter", router);

  const setHash = await wallet.writeContract({
    address: factory,
    abi: factoryArt.abi,
    functionName: "setRouter",
    args: [router],
  });
  console.log("setRouter_tx", setHash);
  const setRcpt = await publicClient.waitForTransactionReceipt({ hash: setHash });
  if (setRcpt.status !== "success") throw new Error("setRouter failed");
}

const block = await publicClient.getBlockNumber();
const addrs = {
  factory,
  locker,
  escrow,
  profiles,
  router,
  platform: env.PLATFORM,
  factoryTx: "0xec4e1b5bbe103c67eabef6e74a769c9f49f1757d9487e336bb94f037ef156f4a",
  factoryBlock: Number(0x30ee0d9n),
};
writeFileSync(join(contracts, "deployed.json"), JSON.stringify(addrs, null, 2));
console.log("wrote contracts/deployed.json");
console.log(JSON.stringify(addrs, null, 2));
console.log("head_block", block.toString());
