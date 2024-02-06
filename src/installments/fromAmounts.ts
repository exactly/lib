import WAD, { SQ_WAD } from "../fixed-point-math/WAD.js";
import fixedRate, { INTERVAL, type IRMParameters } from "../interest-rate-model/fixedRate.js";

export default function fromAmounts(
  amounts: readonly bigint[],
  totalAssets: bigint,
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  irmParameters: IRMParameters,
  timestamp: number,
) {
  let uGlobalAfter = uGlobal;
  return uFixed.map((uFixedBefore, index) => {
    const amount = amounts[index]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const maturity = firstMaturity + index * INTERVAL;
    const maturityFactor =
      (BigInt(maturity - timestamp) * WAD) / BigInt(timestamp + maxPools * INTERVAL - (timestamp % INTERVAL));
    const uFixedAfter = uFixedBefore + (amount * WAD - 1n) / totalAssets + 1n;
    uGlobalAfter += (amount * WAD - 1n) / totalAssets + 1n;
    const rate = fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAfter, irmParameters, timestamp);
    return amount + (amount * rate * maturityFactor) / SQ_WAD;
  });
}
