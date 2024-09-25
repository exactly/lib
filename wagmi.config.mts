import Previewer from "@exactly/protocol/deployments/optimism/Previewer.json" with { type: "json" };
import { defineConfig } from "@wagmi/cli";
import type { Abi } from "viem";

export default defineConfig({
  out: "test/generated/contracts.ts",
  contracts: [{ name: "Previewer", abi: Previewer.abi as Abi }],
});
