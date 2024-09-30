import WAD from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import lnWad from "../fixed-point-math/lnWad.js";
import fixedRate, { INTERVAL, type IRMParameters } from "../interest-rate-model/fixedRate.js";
import abs from "../vector/abs.js";
import add from "../vector/add.js";
import fill from "../vector/fill.js";
import mean from "../vector/mean.js";
import mul from "../vector/mul.js";
import mulDivUp from "../vector/mulDivUp.js";
import powDiv from "../vector/powDiv.js";
import sub from "../vector/sub.js";
import sum from "../vector/sum.js";

export const ONE_YEAR = 365n * 86_400n;

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
  {
    power = (WAD * 60n) / 100n,
    scaleFactor = (WAD * 95n) / 100n,
    tolerance = WAD / 1_000_000_000n,
    maxIterations = 66_666n,
  } = {},
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
      const maturity = firstMaturity + index * INTERVAL;
      const uFixedAfter = amount ? uFixedBefore + (amount * WAD - 1n) / totalAssets + 1n : uFixedBefore;
      if (amount) uGlobalAccumulator += (amount * WAD - 1n) / totalAssets + 1n;
      return fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAccumulator, parameters, timestamp);
    });
    installments = rates.map((rate, index) => {
      const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      const maturity = firstMaturity + index * INTERVAL;
      return amount + (amount * rate * BigInt(maturity - timestamp)) / (WAD * ONE_YEAR);
    });

    const diffs = sub(installments, mean(installments));
    amounts = sub(amounts, mulDivUp(diffs, weight, WAD));
    amounts = mulDivUp(amounts, totalAmount, sum(amounts));
    error = mean(mulDivUp(abs(diffs), weight, WAD));
  } while (error >= tolerance);

  const maturityFactors = rates.map(
    (_, index) => (BigInt(firstMaturity + index * INTERVAL - timestamp) * WAD) / ONE_YEAR,
  );
  const y = mul(installments, WAD);
  let effectiveRate = rates[0]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  iterations = 0;
  error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    const aux = add(mulDivUp(maturityFactors, effectiveRate, WAD), WAD);
    const f = sum(mulDivUp(y, WAD, aux)) - totalAmount * WAD;
    const fp = -sum(mulDivUp(y, maturityFactors, powDiv(aux, 2n, WAD)));
    const rateDiff = (-f * WAD) / fp;
    effectiveRate += rateDiff;
    error = rateDiff < 0n ? -rateDiff : rateDiff;
  } while (error >= tolerance);

  return { amounts, installments, rates, effectiveRate };
}

function max(a: bigint, b: bigint) {
  return a > b ? a : b;
}
