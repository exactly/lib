import accountLiquidity, { type AccountLiquidityData } from "./accountLiquidity.js";
import divWad from "../fixed-point-math/divWad.js";

export default function healthFactor(data: AccountLiquidityData, timestamp = Math.floor(Date.now() / 1000)): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  return divWad(adjCollateral, adjDebt);
}
