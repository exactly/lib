import WAD, { SQ_WAD } from "../fixed-point-math/WAD.js";
import fixedRate, { INTERVAL, type IRMParameters } from "../interest-rate-model/fixedRate.js";
import abs from "../vector/abs.js";
import fill from "../vector/fill.js";
import mean from "../vector/mean.js";
import mulDivUp from "../vector/mulDivUp.js";
import sub from "../vector/sub.js";
import sum from "../vector/sum.js";

export type SolverParameters = { weight?: bigint; tolerance?: bigint };

export default function splitInstallments(
  totalAmount: bigint,
  totalAssets: bigint,
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  irmParameters: IRMParameters,
  timestamp = Date.now() / 1000,
  { weight = 95n * 10n ** 16n, tolerance = 10n ** 9n }: SolverParameters = {},
) {
  let amounts = fill(uFixed.length, (totalAmount - 1n) / BigInt(uFixed.length) + 1n);
  let error = 0n;
  do {
    let uGlobalAfter = uGlobal;
    const installments = uFixed.map((uFixedBefore, index) => {
      const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      const maturity = firstMaturity + index * INTERVAL;
      const maturityFactor =
        (BigInt(maturity - timestamp) * WAD) / BigInt(timestamp + maxPools * INTERVAL - (timestamp % INTERVAL));
      const uFixedAfter = uFixedBefore + (amount * WAD - 1n) / totalAssets + 1n;
      uGlobalAfter += (amount * WAD - 1n) / totalAssets + 1n;
      const rate = fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAfter, irmParameters, timestamp);
      return amount + (amount * rate * maturityFactor) / SQ_WAD;
    });
    const diffs = sub(installments, mean(installments));
    amounts = sub(amounts, mulDivUp(diffs, weight, WAD));
    amounts = mulDivUp(amounts, totalAmount, sum(amounts));
    error = mean(mulDivUp(abs(diffs), weight, WAD));
  } while (error >= tolerance);
  return amounts;
}
