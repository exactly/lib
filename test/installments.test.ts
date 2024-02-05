import { describe, expect, test } from "bun:test";
import { parseUnits } from "viem";

import { INTERVAL, type IRMParameters } from "../src/interest-rate-model/fixedRate";
import mulDivUp from "../src/vector/mulDivUp";
import sum from "../src/vector/sum";

import splitInstallments from "../src/installments/split";

describe("installments", () => {
  test("split", () => {
    const maxPools = 12;
    const timestamp = 0;
    const totalAmount = parseUnits("10000", 18);
    const totalAssets = parseUnits("1000000", 18);
    const uFloating = parseUnits("0.2", 18);
    const uGlobal = parseUnits("0.9", 18);
    let uFixed = Array.from({ length: 6 }).map(() => BigInt(Math.random() * 1e18));
    uFixed = mulDivUp(uFixed, uGlobal - uFloating, sum(uFixed));
    const amounts = splitInstallments(
      totalAmount,
      totalAssets,
      INTERVAL,
      maxPools,
      uFixed,
      uFloating,
      uGlobal,
      parameters,
      timestamp,
    );
    expect(sum(amounts)).toBeGreaterThanOrEqual(totalAmount);
  });
});

const parameters: IRMParameters = {
  minRate: parseUnits("3", 16),
  naturalRate: parseUnits("8", 16),
  maxUtilization: parseUnits("1.1", 18),
  naturalUtilization: parseUnits("0.7", 18),
  growthSpeed: parseUnits("1", 18),
  sigmoidSpeed: parseUnits("2.5", 18),
  spreadFactor: parseUnits("0.2", 18),
  maturitySpeed: parseUnits("0.5", 18),
  timePreference: parseUnits("0.01", 18),
  fixedAllocation: parseUnits("0.6", 18),
  maxRate: parseUnits("15000", 16),
};
