import min from "../fixed-point-math/min.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function fixedRepayAssets(
  {
    penaltyRate,
    backupFeeRate,
    borrowed,
    supplied,
    unassignedEarnings,
    lastAccrual,
    principal,
    fee,
  }: FixedRepaySnapshot,
  maturity: number,
  positionAssets: bigint,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const totalPosition = principal + fee;
  if (totalPosition === 0n) return 0n;
  if (positionAssets > totalPosition) positionAssets = totalPosition;
  if (timestamp >= maturity) {
    return positionAssets + mulWad(positionAssets, BigInt(timestamp - maturity) * penaltyRate);
  }
  if (maturity > lastAccrual) {
    unassignedEarnings -= mulDiv(unassignedEarnings, BigInt(timestamp) - lastAccrual, BigInt(maturity) - lastAccrual);
  }
  let yieldAssets = 0n;
  const backupSupplied = borrowed - min(borrowed, supplied);
  if (backupSupplied) {
    const scaledPrincipal = mulDiv(positionAssets, principal, principal + fee);
    yieldAssets = mulDiv(unassignedEarnings, min(scaledPrincipal, backupSupplied), backupSupplied);
    yieldAssets -= mulWad(yieldAssets, backupFeeRate);
  }
  return positionAssets - yieldAssets;
}

export interface FixedRepaySnapshot {
  penaltyRate: bigint;
  backupFeeRate: bigint;
  borrowed: bigint;
  supplied: bigint;
  unassignedEarnings: bigint;
  lastAccrual: bigint;
  principal: bigint;
  fee: bigint;
}
