import accountLiquidity, { type AccountLiquidityData } from "./accountLiquidity.js";
import MAX_UINT256 from "../fixed-point-math/MAX_UINT256.js";
import divWad from "../fixed-point-math/divWad.js";

export default function healthFactor(data: AccountLiquidityData, timestamp = Math.floor(Date.now() / 1000)): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  return adjDebt ? divWad(adjCollateral, adjDebt) : MAX_UINT256;
}
