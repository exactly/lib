import divWadUp from "../fixed-point-math/divWadUp.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulDivUp from "../fixed-point-math/mulDivUp.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function accountLiquidity(
  data: AccountLiquidityData,
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
  } of data) {
    const baseUnit = 10n ** BigInt(decimals);
    if (isCollateral) adjCollateral += adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);

    let totalDebt = floatingBorrowAssets;
    for (const { position, maturity } of fixedBorrowPositions) {
      const positionAssets = position.principal + position.fee;
      totalDebt += positionAssets;
      if (timestamp > maturity) totalDebt += mulWad(positionAssets, BigInt(timestamp) - maturity * penaltyRate);
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
