import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { parseUnits } from "viem";

import WAD, { SQ_WAD } from "../src/fixed-point-math/WAD";
import { INTERVAL, type IRMParameters } from "../src/interest-rate-model/fixedRate";
import mean from "../src/vector/mean";
import mulDivDown from "../src/vector/mulDivDown";
import sum from "../src/vector/sum";

import splitInstallments from "../src/installments/split";

describe("installments", () => {
  test("split", () => {
    fc.assert(
      fc.property(
        fc.bigInt(WAD / 10_000n, WAD),
        fc.array(fc.bigInt(0n, WAD), { minLength: 2, maxLength: 12 }),
        fc.bigInt(0n, WAD),
        fc.bigInt(0n, (WAD * 999n) / 1000n),
        (totalAmount, uFixed, uFloating, uGlobal) => {
          const maxPools = 13;
          const timestamp = 0;
          const firstMaturity = INTERVAL;
          const totalAssets = 1_000_000n * WAD;

          uFloating = (uFloating * uGlobal) / WAD;
          totalAmount = (totalAmount * totalAssets * (WAD - uGlobal)) / SQ_WAD;
          if (sum(uFixed) > 0n) uFixed = mulDivDown(uFixed, uGlobal - uFloating, sum(uFixed));

          const { amounts, installments } = splitInstallments(
            totalAmount,
            totalAssets,
            firstMaturity,
            maxPools,
            uFixed,
            uFloating,
            uGlobal,
            parameters,
            timestamp,
          );

          expect(amounts).toHaveLength(uFixed.length);
          expect(sum(amounts)).toBeGreaterThanOrEqual(totalAmount);
          expect(sum(amounts) - totalAmount).toBeLessThan(totalAmount / 100_000n);

          const avg = mean(installments);
          for (const installment of installments) {
            expect(installment > avg ? installment - avg : avg - installment).toBeLessThan(WAD / 1000n);
          }
        },
      ),
      { numRuns: process.env.NUM_RUNS ? Number(process.env.NUM_RUNS) : undefined },
    );
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
