import WAD, { SQ_WAD, TWO_WAD } from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import lnWad from "../fixed-point-math/lnWad.js";
import sqrt from "../fixed-point-math/sqrt.js";
import type IRMParameters from "./Parameters.ts";
import baseRate from "./baseRate.js";

export const INTERVAL = 4 * 7 * 86_400;

export default function fixedRate(
  maturity: number,
  maxPools: number,
  uFixed: bigint,
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp = Math.floor(Date.now() / 1000),
  base = baseRate(uFloating, uGlobal, parameters),
  z?: bigint,
) {
  const { spreadFactor, maturitySpeed, timePreference, fixedAllocation, maxRate } = parameters;

  if (timestamp >= maturity) throw new Error("ALREADY_MATURED");
  if (uFixed > uGlobal) throw new Error("UTILIZATION_EXCEEDED");
  if (uGlobal === 0n) return base > maxRate ? maxRate : base;

  if (z === undefined) {
    const fixedFactor = (BigInt(maxPools) * uFixed * SQ_WAD) / (uGlobal * fixedAllocation);
    const sqFNatPools = (BigInt(maxPools) * SQ_WAD) / fixedAllocation;
    const fNatPools = sqrt(sqFNatPools * WAD);
    const natPools = ((TWO_WAD - sqFNatPools) * SQ_WAD) / (fNatPools * (WAD - fNatPools));
    z = (natPools * sqrt(fixedFactor * WAD)) / WAD + ((WAD - natPools) * fixedFactor) / WAD - WAD;
  }

  const maturityFactor = (BigInt(maturity - timestamp) * WAD) / BigInt(maxPools * INTERVAL - (timestamp % INTERVAL));

  const spread =
    WAD + (expWad((maturitySpeed * lnWad(maturityFactor)) / WAD) * (timePreference + (spreadFactor * z) / WAD)) / WAD;

  if (base >= (maxRate * WAD) / spread) return maxRate;
  return (base * spread - 1n) / WAD + 1n;
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters } from "./Parameters.ts";
