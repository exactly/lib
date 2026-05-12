import accountLiquidity, {
  defaultHaircuts,
  marketHaircut,
  normalizeDebt,
  type AccountLiquidityData,
  type Haircuts,
} from "./accountLiquidity.js";
import WAD from "../fixed-point-math/WAD.js";
import divWad from "../fixed-point-math/divWad.js";

export default function borrowLimit(
  data: AccountLiquidityData,
  market: string,
  targetHealthFactor = (WAD * 105n) / 100n,
  timestamp?: number,
  haircuts: Haircuts = defaultHaircuts,
): bigint {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp, haircuts);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");

  const { decimals, usdPrice, adjustFactor } = marketData;

  const maxAdjDebt = divWad(adjCollateral, targetHealthFactor);
  if (adjDebt >= maxAdjDebt) return 0n;

  const maxExtraDebt = maxAdjDebt - adjDebt;
  return normalizeDebt(
    maxExtraDebt,
    usdPrice,
    10n ** BigInt(decimals),
    adjustFactor,
    marketHaircut(haircuts, marketData.market),
  );
}
