import MAX_UINT256 from "../fixed-point-math/MAX_UINT256.js";
import WAD from "../fixed-point-math/WAD.js";
import divWad from "../fixed-point-math/divWad.js";
import divWadUp from "../fixed-point-math/divWadUp.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulDivUp from "../fixed-point-math/mulDivUp.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function accountLiquidity(
  data: AccountLiquidityData,
  timestamp = Math.floor(Date.now() / 1000),
  haircuts: Haircuts = defaultHaircuts,
): {
  adjCollateral: bigint;
  adjDebt: bigint;
} {
  let adjCollateral = 0n;
  let adjDebt = 0n;
  for (const {
    market,
    isCollateral,
    floatingBorrowAssets,
    floatingDepositAssets,
    fixedBorrowPositions,
    penaltyRate,
    decimals,
    adjustFactor,
    usdPrice,
  } of data) {
    const baseUnit = 10n ** BigInt(decimals);
    const haircut = marketHaircut(haircuts, market);
    if (haircut && (haircut < 0n || haircut > WAD)) throw new Error("haircut outside [0, 1]");

    if (isCollateral) {
      const adjusted = adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);
      adjCollateral += haircut ? mulWad(adjusted, WAD - haircut) : adjusted;
    }

    let totalDebt = floatingBorrowAssets;
    for (const { position, maturity } of fixedBorrowPositions) {
      const positionAssets = position.principal + position.fee;
      totalDebt += positionAssets;
      if (timestamp > maturity) totalDebt += mulWad(positionAssets, (BigInt(timestamp) - maturity) * penaltyRate);
    }
    const debt = adjustDebt(totalDebt, usdPrice, baseUnit, adjustFactor);
    adjDebt += haircut ? (haircut === WAD && debt !== 0n ? MAX_UINT256 : divWadUp(debt, WAD - haircut)) : debt;
  }

  return { adjCollateral, adjDebt };
}

export function adjustCollateral(
  floatingDepositAssets: bigint,
  usdPrice: bigint,
  baseUnit: bigint,
  adjustFactor: bigint,
): bigint {
  return mulWad(mulDiv(floatingDepositAssets, usdPrice, baseUnit), adjustFactor);
}

export function adjustDebt(debt: bigint, usdPrice: bigint, baseUnit: bigint, adjustFactor: bigint): bigint {
  return divWadUp(mulDivUp(debt, usdPrice, baseUnit), adjustFactor);
}

export function normalizeCollateral(
  adjustedCollateral: bigint,
  usdPrice: bigint,
  baseUnit: bigint,
  adjustFactor: bigint,
  haircut?: bigint,
) {
  if (haircut === WAD) return adjustedCollateral ? MAX_UINT256 : 0n;
  return divWad(
    mulDiv(haircut ? divWad(adjustedCollateral, WAD - haircut) : adjustedCollateral, baseUnit, usdPrice),
    adjustFactor,
  );
}

export function normalizeDebt(
  adjustedDebt: bigint,
  usdPrice: bigint,
  baseUnit: bigint,
  adjustFactor: bigint,
  haircut?: bigint,
) {
  return mulDiv(mulWad(haircut ? mulWad(adjustedDebt, WAD - haircut) : adjustedDebt, adjustFactor), baseUnit, usdPrice);
}

export function marketHaircut(haircuts: Haircuts | undefined, market: string): bigint {
  if (!haircuts) return 0n;

  const exact = haircuts[market];
  if (exact !== undefined) return exact;

  const lower = market.toLowerCase();
  return haircuts[lower] ?? Object.entries(haircuts).find(([key]) => key.toLowerCase() === lower)?.[1] ?? 0n;
}

export const defaultHaircuts: Haircuts = { "0x1Dcf89Dfa88363ef33d49dD591b1eE5e84DD0F75": WAD / 2n }; // cbXRP on base: 50%

export type Haircuts = Readonly<Record<string, bigint>>;

export type AccountLiquidityData = readonly {
  market: string;
  decimals: number;
  usdPrice: bigint;
  adjustFactor: bigint;
  isCollateral: boolean;
  floatingBorrowAssets: bigint;
  floatingDepositAssets: bigint;
  fixedBorrowPositions: readonly { maturity: bigint; position: { principal: bigint; fee: bigint } }[];
  penaltyRate: bigint;
}[];
