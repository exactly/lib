import { decodeFunctionResult, encodeFunctionData } from "viem";
import { describe, expect, inject, it } from "vitest";

import { marketUsdcAbi, ratePreviewerAbi } from "./generated/contracts.js";
import anvilClient from "./utils/anvilClient.js";
import divWad from "../src/fixed-point-math/divWad.js";
import floatingDepositRates from "../src/market/floatingDepositRates.js";

describe("floating deposit rate", () => {
  it("projects rate", async () => {
    const snapshot = await anvilClient.readContract({
      address: inject("RatePreviewer"),
      functionName: "snapshot",
      args: [],
      abi: ratePreviewerAbi,
    });
    const usdcSnapshot = snapshot.find(({ market }) => market === inject("MarketUSDC"));

    expect(usdcSnapshot).toBeDefined();

    if (!usdcSnapshot) return; // eslint-disable-line vitest/no-conditional-in-test -- already expected to be defined

    const elapsed = 69_420;
    const block = await anvilClient.getBlock();
    const { data = "0x" } = await anvilClient.call({
      to: inject("MarketUSDC"),
      data: encodeFunctionData({ functionName: "totalAssets", abi: marketUsdcAbi }),
      blockOverrides: { time: block.timestamp + BigInt(elapsed) },
    });
    const newTotalAssets = decodeFunctionResult({ data, functionName: "totalAssets", abi: marketUsdcAbi });

    const rates = floatingDepositRates(snapshot, Number(block.timestamp), elapsed);

    const usdcRate = rates.find(({ market }) => market === inject("MarketUSDC"))?.rate;

    expect(usdcRate).toBe(
      divWad(
        ((newTotalAssets - usdcSnapshot.totalAssets) * BigInt(365 * 86_400)) / BigInt(elapsed),
        usdcSnapshot.totalAssets,
      ),
    );
  });
});
