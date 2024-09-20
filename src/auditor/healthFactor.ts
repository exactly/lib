import divWad from "../fixed-point-math/divWad.js";
import divWadUp from "../fixed-point-math/divWadUp.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulDivUp from "../fixed-point-math/mulDivUp.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function healthFactor(
  p: readonly {
    readonly decimals: number;
    readonly usdPrice: bigint;
    readonly adjustFactor: bigint;
    readonly isCollateral: boolean;
    readonly floatingBorrowAssets: bigint;
    readonly floatingDepositAssets: bigint;
    readonly fixedBorrowPositions: readonly { maturity: number; principal: bigint; fee: bigint }[];
    readonly penaltyRate: bigint;
  }[],
  timestamp: number,
) {
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
  } of p) {
    const baseUnit = 10n ** BigInt(decimals);
    if (isCollateral) adjCollateral += mulWad(mulDiv(floatingDepositAssets, usdPrice, baseUnit), adjustFactor);

    let totalDebt = floatingBorrowAssets;
    for (const { principal, fee, maturity } of fixedBorrowPositions) {
      const positionAssets = principal + fee;
      totalDebt += positionAssets;
      if (timestamp > maturity) totalDebt += mulWad(positionAssets, BigInt(timestamp - maturity) * penaltyRate);
    }
    adjDebt += divWadUp(mulDivUp(totalDebt, usdPrice, baseUnit), adjustFactor);
  }
  return divWad(adjCollateral, adjDebt);
}
