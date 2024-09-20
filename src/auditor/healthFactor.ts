import accountLiquidity, { type AccountLiquidityParameters } from "./accountLiquidity.js";
import divWad from "../fixed-point-math/divWad.js";

export default function healthFactor(p: AccountLiquidityParameters, timestamp = Math.floor(Date.now() / 1000)): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(p, timestamp);
  return divWad(adjCollateral, adjDebt);
}
