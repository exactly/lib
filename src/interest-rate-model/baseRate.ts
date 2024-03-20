import MAX_UINT256 from "../fixed-point-math/MAX_UINT256.js";
import WAD from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import lnWad from "../fixed-point-math/lnWad.js";
import type { IRMBaseParameters } from "./Parameters.ts";

const EXP_THRESHOLD = 135_305_999_368_893_231_588n;

export default function baseRate(
  uFloating: bigint,
  uGlobal: bigint,
  { maxUtilization, naturalUtilization, sigmoidSpeed, growthSpeed, ...p }: IRMBaseParameters,
) {
  if (uFloating > uGlobal) throw new Error("UTILIZATION_EXCEEDED");
  if (uGlobal >= WAD) return MAX_UINT256;

  const curveA =
    p.curveA === undefined
      ? (((p.naturalRate * expWad((growthSpeed * lnWad(WAD - naturalUtilization / 2n)) / WAD) - 1n) / WAD +
          1n -
          p.minRate) *
          (maxUtilization - naturalUtilization) *
          maxUtilization) /
        (naturalUtilization * WAD)
      : p.curveA;
  const curveB = p.curveB === undefined ? p.minRate - (curveA * WAD) / maxUtilization : p.curveB;

  const r = (curveA * WAD) / (maxUtilization - uFloating) + curveB;
  if (uGlobal === 0n) return r;

  const auxSigmoid = lnWad((naturalUtilization * WAD) / (WAD - naturalUtilization));
  let x = -((sigmoidSpeed * (lnWad((uGlobal * WAD) / (WAD - uGlobal)) - auxSigmoid)) / WAD);
  const sigmoid = x > EXP_THRESHOLD ? 0n : (WAD * WAD) / (WAD + expWad(x));

  x = (-growthSpeed * lnWad(WAD - (sigmoid * uGlobal) / WAD)) / WAD;
  const globalFactor = expWad(x > EXP_THRESHOLD ? EXP_THRESHOLD : x);

  if (globalFactor > MAX_UINT256 / r) return MAX_UINT256;

  return (r * globalFactor - 1n) / WAD + 1n;
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters, IRMBaseParameters } from "./Parameters.ts";
