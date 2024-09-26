import type { AccountLiquidityData } from "./accountLiquidity.js";
import accountLiquidity, { adjustCollateral } from "./accountLiquidity.js";
import divWad from "../fixed-point-math/divWad.js";
import min from "../fixed-point-math/min.js";
import mulDiv from "../fixed-point-math/mulDiv.js";

export default function withdrawLimit(
  data: AccountLiquidityData,
  market: string,
  timestamp = Math.floor(Date.now() / 1000),
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");

  const { decimals, usdPrice, adjustFactor, floatingDepositAssets } = marketData;
  const baseUnit = 10n ** BigInt(decimals);

  const adjCollateralMarket = adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);

  const limit = min(adjCollateral - adjDebt, adjCollateralMarket);
  if (limit < 0n) return 0n;

  return mulDiv(divWad(limit, adjustFactor), baseUnit, usdPrice);
}
