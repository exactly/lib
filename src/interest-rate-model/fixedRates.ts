import WAD, { SQ_WAD, TWO_WAD } from "../fixed-point-math/WAD.js";
import sqrt from "../fixed-point-math/sqrt.js";
import type IRMParameters from "./Parameters.js";
import baseRate from "./baseRate.js";
import fixedRate, { INTERVAL } from "./fixedRate.js";

export default function fixedRates(
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp = Date.now() / 1000,
) {
  const base = baseRate(uFloating, uGlobal, parameters);
  const sqFNatPools = (BigInt(maxPools) * SQ_WAD) / parameters.fixedAllocation;
  const fNatPools = sqrt(sqFNatPools * WAD);
  const natPools = ((TWO_WAD - sqFNatPools) * SQ_WAD) / (fNatPools * (WAD - fNatPools));

  return uFixed.map((uFixedBefore, index) => {
    const maturity = firstMaturity + index * INTERVAL;
    fixedRate(maturity, maxPools, uFixedBefore, uFloating, uGlobal, parameters, timestamp, natPools, base);
  });
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters } from "./Parameters.js";
