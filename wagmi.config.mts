import { defineConfig } from "@wagmi/cli";
import { readFileSync } from "node:fs";
import type { Abi } from "viem";

export default defineConfig({
  out: "test/generated/contracts.ts",
  contracts: [
    { name: "Previewer", abi: loadDeployment("Previewer").abi },
    { name: "RatePreviewer", abi: loadDeployment("RatePreviewer").abi },
    { name: "MarketUSDC", abi: loadDeployment("MarketUSDC").abi },
  ],
});

function loadDeployment(contract: string) {
  return JSON.parse(readFileSync(`node_modules/@exactly/protocol/deployments/op-sepolia/${contract}.json`, "utf8")) as {
    address: string;
    abi: Abi;
  };
}
