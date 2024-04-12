import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { parseUnits } from "viem";

import WAD, { SQ_WAD } from "../src/fixed-point-math/WAD";
import { INTERVAL, type IRMParameters } from "../src/interest-rate-model/fixedRate";
import max from "../src/vector/max";
import mean from "../src/vector/mean";
import min from "../src/vector/min";
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

          const { amounts, installments, rates, effectiveRate } = splitInstallments(
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
          expect(effectiveRate).toBeGreaterThanOrEqual(min(rates));
          expect(effectiveRate).toBeLessThanOrEqual(max(rates));

          const decimals = 2n;
          const denominator = 10n ** (18n - decimals);
          expect(effectiveRate / denominator).toBeGreaterThanOrEqual(min(rates) / denominator);
          expect(effectiveRate / denominator).toBeLessThanOrEqual(max(rates) / denominator);

          const avg = mean(installments);
          for (const installment of installments) {
            expect(installment > avg ? installment - avg : avg - installment).toBeLessThan(WAD / 1000n);
          }
        },
      ),
      {
        numRuns: process.env.NUM_RUNS ? Number(process.env.NUM_RUNS) : undefined,
        seed: -211859287,
        path: "55:1:1:2:3:0:0:0:1:3:0:3:3:4:0:8:0:2:0:1:3:0:0:0:1:0:0:0:1:1:2:1:0:0:0:0:5:0:2:2:0:1:0:1:0:0:0:0:0:0:0:0:2:0:0:3:5:6:5:2:5:4:3:2:2:2:2:3:2:2:10:2:4:3:2:2:3:2:2:7:2:2:2:7:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:4:2:2:2:3:2:2:2:9:0:0:0:0:1:2:0:0:2:1:5:0:3:0:0:1:2:1:3:0:1:0:1:0:3:0:1:3:0:0:1:48:1:3:3:1:2:2:0:0:2:0:0:1:2:2:2:0:1:5:1:0:1:1:1:1:4:0:4:0:1:0:1:2:2:49:2:2:3:3:2:2:2:4:0:0:0:2:1:0:0:1:1:1:0:1:0:1:0:1:2:1:0:3:0:0:0:3:2:0:0:0:1:1:2:1:1:1:1:1:47:1:1:1:1:1:2:2:1:1:1:1:2:0:2:4:1:2:0:0:1:1:1:0:1:3:2:0:0:0:0:1:0:0:1:0:0:0:0:1:2:0:0:0:1:46:0:1:0:6:1:5:0:0:2:0:0:3:0:3:4:0:0:0:1:0:1:1:1:1:0:0:0:1:0:52:52:52:52:52:52:52:52:52:52:52:52:52:99:52:52:51:1:2:1:4:2:0:0:3:1:0:1:0:0:1:1:1:0:0:0:1:0:0:0:1:2:0:4:1:1:0:5:0:0:2:0:1:1:45:0:51:3:3:1:1:1:2:2:2:0:5:0:0:2:0:1:0:3:2:0:1:0:1:4:0:6:0:1:3:0:0:1:1:1:48:3:2:3:2:2:0:0:5:0:0:1:0:0:1:2:4:0:0:0:1:1:0:1:1:1:0:0:1:2:0:5:0:1:1:46:1:3:2:4:3:2:0:0:0:4:2:1:0:4:1:0:0:1:3:1:0:5:4:0:0:0:1:0:5:1:47:2:2:2:2:1:47:1:1:1:1:10:0:1:1:2:0:0:2:3:0:0:0:0:0:1:1:0:0:0:0:0:0:1:0:0:0:0:1:0:0:0:0:0:1:1:0:1:0:0:1:49:8:4:1:1:1:55:4:4:0:2:0:0:2:1:1:0:0:1:3:1:0:1:0:1:3:0:3:2:4:1:0:1:0:1:51:2:2:1:1:3:1:1:1:1:55:9:0:1:2:0:0:0:0:0:2:0:2:0:1:2:0:1:4:0:0:1:2:2:0:0:3:1:1:1:1:1:1:1:50:1:3:1:3:2:1:1:55:3:1:7:0:0:0:0:3:2:0:1:0:2:0:1:0:0:0:1:1:0:0:1:0:0:0:2:0:0:1:2:1:1:3:0:0:2:1:2:1:0:4:0:1:0:0:0:0:4:0:0:3:1:0:1:0:0:0:0:1:0:0:1:0:0:0:0:1:1:0:1:1:1:0:1:0:0:1:0:0:6:5:2:2:0:4:4:2:0:0:0:0:0:2:0:3:1:0:1:3:0:1:0:2:0:5:0:0:2:4:0:3:0:5:4:0:0:1:0:3:3:0:0:0:2:0:0:2:50:0:0:0:57",
        endOnFailure: true,
      },
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
