import accountLiquidity, {
  adjustCollateral,
  defaultHaircuts,
  marketHaircut,
  normalizeCollateral,
  type AccountLiquidityData,
  type Haircuts,
} from "./accountLiquidity.js";
import WAD from "../fixed-point-math/WAD.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function withdrawLimit(
  data: AccountLiquidityData,
  market: string,
  targetHealthFactor = (WAD * 105n) / 100n,
  timestamp?: number,
  haircuts: Haircuts = defaultHaircuts,
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp, haircuts);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");

  const { decimals, usdPrice, adjustFactor, floatingDepositAssets, isCollateral } = marketData;
  if (!isCollateral) return floatingDepositAssets;

  const baseUnit = 10n ** BigInt(decimals);
  const minAdjCollateral = mulWad(adjDebt, targetHealthFactor);

  if (adjCollateral <= minAdjCollateral) return 0n;

  const adjusted = adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);
  const haircut = marketHaircut(haircuts, marketData.market);
  if (adjCollateral - (haircut ? mulWad(adjusted, WAD - haircut) : adjusted) >= minAdjCollateral) {
    return floatingDepositAssets;
  }

  const withdrawable = adjCollateral - minAdjCollateral;
  return normalizeCollateral(withdrawable, usdPrice, baseUnit, adjustFactor, haircut);
}
