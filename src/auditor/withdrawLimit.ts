import type { AccountLiquidityData } from "./accountLiquidity.js";
import accountLiquidity, { adjustCollateral, normalizeCollateral } from "./accountLiquidity.js";
import WAD from "../fixed-point-math/WAD.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function withdrawLimit(
  data: AccountLiquidityData,
  market: string,
  targetHealthFactor = (WAD * 105n) / 100n,
  timestamp?: number,
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");

  const { decimals, usdPrice, adjustFactor, floatingDepositAssets, isCollateral } = marketData;
  if (!isCollateral) return floatingDepositAssets;

  const baseUnit = 10n ** BigInt(decimals);
  const minAdjCollateral = mulWad(adjDebt, targetHealthFactor);

  if (adjCollateral <= minAdjCollateral) return 0n;

  const adjCollateralMarket = adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);
  if (adjCollateral - adjCollateralMarket >= minAdjCollateral) return floatingDepositAssets;

  const withdrawable = adjCollateral - minAdjCollateral;
  return normalizeCollateral(withdrawable, usdPrice, baseUnit, adjustFactor);
}
