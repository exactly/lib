import { describe, expect, inject, it } from "vitest";

import { marketUsdcAbi, ratePreviewerAbi } from "./generated/contracts.js";
import anvilClient from "./utils/anvilClient.js";
import divWad from "../src/fixed-point-math/divWad.js";
import floatingDepositRates from "../src/market/floatingDepositRates.js";

describe("floating deposit rate", () => {
  it("projects rate", async () => {
    const interval = 100;
    await anvilClient.mine({ blocks: 1, interval });

    const snapshot = await anvilClient.readContract({
      address: inject("RatePreviewer"),
      functionName: "snapshot",
      args: [],
      abi: ratePreviewerAbi,
    });

    const exaUSDC = inject("MarketUSDC");
    const usdcSnapshot = snapshot.find(({ market }) => market === exaUSDC);

    expect(usdcSnapshot).toBeDefined();

    // eslint-disable-next-line @vitest/no-conditional-in-test -- already expected to be defined
    if (!usdcSnapshot) return;

    const block = await anvilClient.getBlock();
    await anvilClient.mine({ blocks: 1, interval });
    const newTotalAssets = await anvilClient.readContract({
      address: exaUSDC,
      functionName: "totalAssets",
      args: [],
      abi: marketUsdcAbi,
    });

    const newBlock = await anvilClient.getBlock();
    const timePassed = newBlock.timestamp - block.timestamp;
    const rates = floatingDepositRates(snapshot, Number(block.timestamp), Number(timePassed));

    const rate = divWad(
      ((newTotalAssets - usdcSnapshot.totalAssets) * BigInt(365 * 86_400)) / timePassed,
      usdcSnapshot.totalAssets,
    );

    const usdcRate = rates.find(({ market }) => market === exaUSDC)?.rate;

    expect(usdcRate).toBe(rate);
  });
});
