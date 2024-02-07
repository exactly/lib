import WAD, { SQ_WAD, TWO_WAD } from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import lnWad from "../fixed-point-math/lnWad.js";
import sqrt from "../fixed-point-math/sqrt.js";
import type IRMParameters from "./Parameters.d.ts";
import baseRate from "./baseRate.js";

export const INTERVAL = 4 * 7 * 86_400;

export default function fixedRate(
  maturity: number,
  maxPools: number,
  uFixed: bigint,
  uFloating: bigint,
  uGlobal: bigint,
  parameters: IRMParameters,
  timestamp = Date.now() / 1000,
  natPools?: bigint,
  base = baseRate(uFloating, uGlobal, parameters),
) {
  const { spreadFactor, maturitySpeed, timePreference, fixedAllocation, maxRate } = parameters;

  if (timestamp >= maturity) throw new Error("ALREADY_MATURED");
  if (uFixed > uGlobal) throw new Error("UTILIZATION_EXCEEDED");
  if (uFixed === 0n) return base > maxRate ? maxRate : base;

  const fixedFactor = (BigInt(maxPools) * uFixed * SQ_WAD) / (uGlobal * fixedAllocation);
  const maturityFactor =
    (BigInt(maturity - timestamp) * WAD) / BigInt(timestamp + maxPools * INTERVAL - (timestamp % INTERVAL));
  if (natPools == undefined) {
    const sqFNatPools = (BigInt(maxPools) * SQ_WAD) / fixedAllocation;
    const fNatPools = sqrt(sqFNatPools * WAD);
    natPools = ((TWO_WAD - sqFNatPools) * SQ_WAD) / (fNatPools * (WAD - fNatPools));
  }

  const spread =
    WAD +
    (expWad((maturitySpeed * lnWad(maturityFactor)) / WAD) *
      (timePreference +
        (spreadFactor * ((natPools * sqrt(fixedFactor * WAD)) / WAD + ((WAD - natPools) * fixedFactor) / WAD - WAD)) /
          WAD)) /
      WAD;

  if (base >= (maxRate * WAD) / spread) return maxRate;
  return (base * spread - 1n) / WAD + 1n;
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters } from "./Parameters.d.ts";