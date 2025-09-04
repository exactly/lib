import type { FixedRepaySnapshot } from "./fixedRepayAssets.js";
import WAD from "../fixed-point-math/WAD.js";
import divWad from "../fixed-point-math/divWad.js";
import min from "../fixed-point-math/min.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulWad from "../fixed-point-math/mulWad.js";

export default function fixedRepayPosition(
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
  assets: bigint,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const totalPosition = principal + fee;
  if (totalPosition === 0n) return 0n;
  if (timestamp >= maturity) {
    return min(divWad(assets, WAD + BigInt(timestamp - maturity) * penaltyRate), totalPosition);
  }
  if (assets >= totalPosition) return totalPosition;
  if (maturity > lastAccrual) {
    unassignedEarnings -= mulDiv(unassignedEarnings, BigInt(timestamp) - lastAccrual, BigInt(maturity) - lastAccrual);
  }
  if (unassignedEarnings === 0n) return assets;
  const backupSupplied = borrowed - min(borrowed, supplied);
  if (backupSupplied === 0n) return assets;
  const k = divWad(principal, totalPosition);
  if (k === 0n) return assets;
  const netUnassignedEarnings = mulWad(unassignedEarnings, WAD - backupFeeRate);
  if (netUnassignedEarnings === 0n) return assets;
  const r = mulDiv(netUnassignedEarnings, k, backupSupplied);
  if (r >= WAD) return min(assets + netUnassignedEarnings, totalPosition);
  const x = divWad(assets, WAD - r);
  if (mulWad(k, x) <= backupSupplied && x <= totalPosition) return x;
  return min(assets + netUnassignedEarnings, totalPosition);
}
