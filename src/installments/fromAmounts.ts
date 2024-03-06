import sqrt from "../fixed-point-math/sqrt.js";
import WAD, { SQ_WAD, TWO_WAD } from "../fixed-point-math/WAD.js";
import fixedRate, { INTERVAL, type IRMParameters } from "../interest-rate-model/fixedRate.js";

export default function fromAmounts(
  amounts: readonly bigint[],
  totalAssets: bigint,
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp: number,
) {
  const sqFNatPools = (BigInt(maxPools) * SQ_WAD) / parameters.fixedAllocation;
  const fNatPools = sqrt(sqFNatPools * WAD);
  const natPools = ((TWO_WAD - sqFNatPools) * SQ_WAD) / (fNatPools * (WAD - fNatPools));

  let uGlobalAfter = uGlobal;
  return uFixed.map((uFixedBefore, index) => {
    const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const maturity = firstMaturity + index * INTERVAL;
    const uFixedAfter = amount ? uFixedBefore + (amount * WAD - 1n) / totalAssets + 1n : uFixedBefore;
    if (amount) uGlobalAfter += (amount * WAD - 1n) / totalAssets + 1n;
    const rate = fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAfter, parameters, timestamp, natPools);
    return amount + (amount * rate * BigInt(maturity - timestamp)) / (WAD * 365n * 86_400n);
  });
}
