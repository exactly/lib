import fc from "fast-check";
import { formatUnits, parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import WAD, { SQ_WAD } from "../src/fixed-point-math/WAD.js";
import divWad from "../src/fixed-point-math/divWad.js";
import splitInstallments from "../src/installments/split.js";
import { MATURITY_INTERVAL, type IRMParameters } from "../src/interest-rate-model/fixedRate.js";
import max from "../src/vector/max.js";
import mean from "../src/vector/mean.js";
import min from "../src/vector/min.js";
import mulDiv from "../src/vector/mulDiv.js";
import sum from "../src/vector/sum.js";

describe("installments", () => {
  it("split", () => {
    expect.hasAssertions();

    const decimals = 6;
    const maxPools = 13;
    const baseUnit = 10n ** BigInt(decimals);
    const totalAssets = 1_000_000n * baseUnit;
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: maxPools - 1 }),
        fc.float({ min: 0, max: 1, maxExcluded: true, noNaN: true }),
        fc.bigInt(WAD / 10_000n, (WAD * 9n) / 10n),
        fc.array(fc.bigInt(0n, WAD), { minLength: maxPools, maxLength: maxPools }),
        fc.bigInt(0n, WAD),
        fc.bigInt(0n, (WAD * 95n) / 100n),
        fc.integer({ min: 0, max: Math.floor(MATURITY_INTERVAL * 0.9) }),
        (count, firstIndex, totalAmount, uFixed, uFloating, uGlobal, timestamp) => {
          firstIndex = Math.floor(firstIndex * (maxPools - count));
          uFloating = (uFloating * uGlobal) / WAD;
          totalAmount = (totalAmount * totalAssets * (WAD - uGlobal)) / SQ_WAD;
          if (sum(uFixed) > 0n) uFixed = mulDiv(uFixed, uGlobal - uFloating, sum(uFixed));
          const firstMaturity = firstIndex * MATURITY_INTERVAL + MATURITY_INTERVAL;

          const { amounts, installments, rates, effectiveRate } = splitInstallments(
            totalAmount,
            totalAssets,
            firstMaturity,
            maxPools,
            uFixed.slice(firstIndex, firstIndex + count),
            uFloating,
            uGlobal,
            parameters,
            timestamp,
          );

          expect(amounts).toHaveLength(count);
          expect(sum(amounts)).toStrictEqual(totalAmount);
          expect(effectiveRate).toBeGreaterThanOrEqual(min(rates));
          expect(effectiveRate).toBeLessThanOrEqual(max(rates));

          const avg = mean(installments);
          for (const installment of installments) {
            const proportion = divWad(installment, avg);
            const error = proportion > WAD ? proportion - WAD : WAD - proportion;

            expect(error, `${formatUnits(installment, decimals)}, ${formatUnits(avg, decimals)}`).toBeLessThan(
              (1000n * WAD) / baseUnit,
            );
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
