import divWadUp from "../fixed-point-math/divWadUp.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulDivUp from "../fixed-point-math/mulDivUp.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function accountLiquidity(
  { marketsData }: AccountLiquidityParameters,
  timestamp = Math.floor(Date.now() / 1000),
): {
  adjCollateral: bigint;
  adjDebt: bigint;
} {
  let adjCollateral = 0n;
  let adjDebt = 0n;
  for (const {
    isCollateral,
    floatingBorrowAssets,
    floatingDepositAssets,
    fixedBorrowPositions,
    penaltyRate,
    decimals,
    adjustFactor,
    usdPrice,
  } of marketsData) {
    const baseUnit = 10n ** BigInt(decimals);
    if (isCollateral) adjCollateral += adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);

    let totalDebt = floatingBorrowAssets;
    for (const { principal, fee, maturity } of fixedBorrowPositions) {
      const positionAssets = principal + fee;
      totalDebt += positionAssets;
      if (timestamp > maturity) totalDebt += mulWad(positionAssets, BigInt(timestamp - maturity) * penaltyRate);
    }
    adjDebt += divWadUp(mulDivUp(totalDebt, usdPrice, baseUnit), adjustFactor);
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

export interface AccountLiquidityParameters {
  marketsData: readonly {
    market: string;
    decimals: number;
    usdPrice: bigint;
    adjustFactor: bigint;
    isCollateral: boolean;
    floatingBorrowAssets: bigint;
    floatingDepositAssets: bigint;
    fixedBorrowPositions: readonly { maturity: number; principal: bigint; fee: bigint }[];
    penaltyRate: bigint;
  }[];
}
