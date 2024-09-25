import MarketUSDC from "@exactly/protocol/deployments/op-sepolia/MarketUSDC.json" with { type: "json" };
import Previewer from "@exactly/protocol/deployments/op-sepolia/Previewer.json" with { type: "json" };
import RatePreviewer from "@exactly/protocol/deployments/op-sepolia/RatePreviewer.json" with { type: "json" };
import { defineConfig } from "@wagmi/cli";
import type { Abi } from "viem";

export default defineConfig({
  out: "test/generated/contracts.ts",
  contracts: [
    { name: "Previewer", abi: Previewer.abi as Abi },
    { name: "RatePreviewer", abi: RatePreviewer.abi as Abi },
    { name: "MarketUSDC", abi: MarketUSDC.abi as Abi },
  ],
});
