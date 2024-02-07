import WAD from "../fixed-point-math/WAD.js";
import type { IRMParameters } from "../interest-rate-model/fixedRate.js";
import abs from "../vector/abs.js";
import fill from "../vector/fill.js";
import mean from "../vector/mean.js";
import mulDivUp from "../vector/mulDivUp.js";
import sub from "../vector/sub.js";
import sum from "../vector/sum.js";
import fromAmounts from "./fromAmounts.js";

export default function splitInstallments(
  totalAmount: bigint,
  totalAssets: bigint,
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp = Date.now() / 1000,
  { weight = (WAD * 95n) / 100n, tolerance = WAD / 1000n, maxIterations = 16 } = {},
) {
  let iterations = 0;
  let amounts = fill(uFixed.length, (totalAmount - 1n) / BigInt(uFixed.length) + 1n);
  let error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    const installments = fromAmounts(
      amounts,
      totalAssets,
      firstMaturity,
      maxPools,
      uFixed,
      uFloating,
      uGlobal,
      parameters,
      timestamp,
    );
    const diffs = sub(installments, mean(installments));
    amounts = sub(amounts, mulDivUp(diffs, weight, WAD));
    amounts = mulDivUp(amounts, totalAmount, sum(amounts));
    error = mean(mulDivUp(abs(diffs), weight, WAD));
  } while (error >= tolerance);
  return amounts;
}
