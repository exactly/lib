import effectiveRate, { ONE_YEAR } from "./effectiveRate.js";
import WAD from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import lnWad from "../fixed-point-math/lnWad.js";
import fixedRate, { MATURITY_INTERVAL, type IRMParameters } from "../interest-rate-model/fixedRate.js";
import abs from "../vector/abs.js";
import fill from "../vector/fill.js";
import mean from "../vector/mean.js";
import mulDivUp from "../vector/mulDivUp.js";
import sub from "../vector/sub.js";
import sum from "../vector/sum.js";

export default function splitInstallments(
  totalAmount: bigint,
  totalAssets: bigint,
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp = Math.floor(Date.now() / 1000),
  { power = (WAD * 60n) / 100n, scaleFactor = (WAD * 95n) / 100n, tolerance = 20n, maxIterations = 66_666n } = {},
) {
  const uGlobalAfter = uGlobal + (totalAmount * WAD - 1n) / totalAssets + 1n;
  const weight = max(
    uGlobalAfter < WAD ? (scaleFactor * expWad((power * lnWad(WAD - uGlobalAfter)) / WAD)) / WAD : 1n,
    10n ** 15n,
  );

  let iterations = 0;
  let rates: bigint[] = [];
  let installments: bigint[] = [];
  let amounts = fill(uFixed.length, (totalAmount - 1n) / BigInt(uFixed.length) + 1n);
  let error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    let uGlobalAccumulator = uGlobal;
    rates = uFixed.map((uFixedBefore, index) => {
      const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      const maturity = firstMaturity + index * MATURITY_INTERVAL;
      const uFixedAfter = amount ? uFixedBefore + (amount * WAD - 1n) / totalAssets + 1n : uFixedBefore;
      if (amount) uGlobalAccumulator += (amount * WAD - 1n) / totalAssets + 1n;
      return fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAccumulator, parameters, timestamp);
    });
    installments = rates.map((rate, index) => {
      const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      const maturity = firstMaturity + index * MATURITY_INTERVAL;
      return amount + (amount * rate * BigInt(maturity - timestamp)) / (WAD * ONE_YEAR);
    });

    const diffs = sub(installments, mean(installments));
    amounts = sub(amounts, mulDivUp(diffs, weight, WAD));
    amounts = mulDivUp(amounts, totalAmount, sum(amounts));
    const excess = sum(amounts) - totalAmount;
    for (let index = 0; index < excess; ++index) amounts[index]! -= 1n; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    error = mean(mulDivUp(abs(diffs), weight, WAD));
  } while (error >= tolerance);

  return {
    amounts,
    installments,
    rates,
    effectiveRate: effectiveRate(totalAmount, firstMaturity, installments, rates, timestamp, {
      tolerance,
      maxIterations,
    }),
  };
}

function max(a: bigint, b: bigint) {
  return a > b ? a : b;
}
