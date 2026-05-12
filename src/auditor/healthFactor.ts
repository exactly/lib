import accountLiquidity, { defaultHaircuts, type AccountLiquidityData, type Haircuts } from "./accountLiquidity.js";
import MAX_UINT256 from "../fixed-point-math/MAX_UINT256.js";
import divWad from "../fixed-point-math/divWad.js";

export default function healthFactor(
  data: AccountLiquidityData,
  timestamp?: number,
  haircuts: Haircuts = defaultHaircuts,
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp, haircuts);
  return adjDebt ? divWad(adjCollateral, adjDebt) : MAX_UINT256;
}
