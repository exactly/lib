import accountLiquidity, { normalizeDebt, type AccountLiquidityData } from "./accountLiquidity.js";
import WAD from "../fixed-point-math/WAD.js";
import divWad from "../fixed-point-math/divWad.js";

export default function borrowLimit(
  data: AccountLiquidityData,
  market: string,
  targetHealthFactor = (WAD * 105n) / 100n,
  timestamp = Math.floor(Date.now() / 1000),
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");

  const { decimals, usdPrice, adjustFactor } = marketData;

  const maxAdjDebt = divWad(adjCollateral, targetHealthFactor);
  if (adjDebt >= maxAdjDebt) return 0n;

  const maxExtraDebt = maxAdjDebt - adjDebt;
  return normalizeDebt(maxExtraDebt, usdPrice, 10n ** BigInt(decimals), adjustFactor);
}
