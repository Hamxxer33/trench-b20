import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const repo = join(process.cwd(), "..");
const contracts = join(repo, "contracts");

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
if (!pk) throw new Error("PRIVATE_KEY missing");
if (!pk.startsWith("0x")) pk = `0x${pk}`;

const rpc = "https://base.publicnode.com";
const platform = env.PLATFORM;
const poolManager = "0x498581fF718922c3f8e6A244956aF099B2652b2b";

const account = privateKeyToAccount(pk);
const transport = http(rpc);
const publicClient = createPublicClient({ chain: base, transport });
const wallet = createWalletClient({ account, chain: base, transport });

const factoryArt = artifact("TrenchFactory");
const routerArt = artifact("TrenchRouter");

console.log("deployer", account.address);
const bal = await publicClient.getBalance({ address: account.address });
console.log("balance_eth", Number(bal) / 1e18);

const factoryHash = await wallet.deployContract({
  abi: factoryArt.abi,
  bytecode: factoryArt.bytecode.object,
  args: [poolManager, platform],
});
console.log("factory_tx", factoryHash);
const factoryRcpt = await publicClient.waitForTransactionReceipt({ hash: factoryHash });
if (factoryRcpt.status !== "success") throw new Error("factory deploy failed");
const factory = factoryRcpt.contractAddress;
console.log("TrenchFactory", factory);

const locker = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "locker" });
const escrow = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "escrow" });
const profiles = await publicClient.readContract({ address: factory, abi: factoryArt.abi, functionName: "userProfiles" });
console.log("TrenchLocker", locker);
console.log("TrenchEscrow", escrow);
console.log("TrenchProfiles", profiles);

const routerHash = await wallet.deployContract({
  abi: routerArt.abi,
  bytecode: routerArt.bytecode.object,
  args: [poolManager, factory],
});
console.log("router_tx", routerHash);
const routerRcpt = await publicClient.waitForTransactionReceipt({ hash: routerHash });
if (routerRcpt.status !== "success") throw new Error("router deploy failed");
const router = routerRcpt.contractAddress;
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

const addrs = {
  factory,
  locker,
  escrow,
  profiles,
  router,
  platform,
  factoryTx: factoryHash,
  routerTx: routerHash,
  setRouterTx: setHash,
  factoryBlock: factoryRcpt.blockNumber.toString(),
};
writeFileSync(join(contracts, "deployed.json"), JSON.stringify(addrs, null, 2));
console.log("wrote contracts/deployed.json");
console.log(JSON.stringify(addrs, null, 2));
