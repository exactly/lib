import type IRMParameters from "./Parameters.js";
import baseRate from "./baseRate.js";
import fixedRate, { MATURITY_INTERVAL } from "./fixedRate.js";

export default function fixedRates(
  firstMaturity: number,
  maxPools: number,
  uFixed: readonly bigint[],
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp?: number,
) {
  const base = baseRate(uFloating, uGlobal, parameters);
  return uFixed.map((uFixedBefore, index) => {
    const maturity = firstMaturity + index * MATURITY_INTERVAL;
    fixedRate(maturity, maxPools, uFixedBefore, uFloating, uGlobal, parameters, timestamp, base);
  });
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters } from "./Parameters.js";
