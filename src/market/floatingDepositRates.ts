import WAD from "../fixed-point-math/WAD.js";
import divWad from "../fixed-point-math/divWad.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulWad from "../fixed-point-math/mulWad.js";

const YEAR_IN_SECONDS = 365n * 86_400n;

export default function floatingDepositRates(snapshots: readonly MarketSnapshot[], timestamp: number, window: number) {
  return snapshots.map((snapshot) => {
    const projectedTotalAssets = projectTotalAssets(snapshot, timestamp + window);
    const totalAssetsBefore = snapshot.totalAssets;
    const assetsInYear = ((projectedTotalAssets - totalAssetsBefore) * YEAR_IN_SECONDS) / BigInt(window);
    return { market: snapshot.market, rate: divWad(assetsInYear, totalAssetsBefore) };
  });
}

function projectTotalAssets(snapshot: MarketSnapshot, timestamp: number) {
  const {
    earningsAccumulator,
    earningsAccumulatorSmoothFactor,
    floatingAssets,
    floatingDebt,
    floatingRate,
    interval,
    lastAccumulatorAccrual,
    lastFloatingDebtUpdate,
    maxFuturePools,
    pools,
    treasuryFeeRate,
  } = snapshot;
  const elapsedAccumulator = BigInt(timestamp - lastAccumulatorAccrual);
  const denominator = earningsAccumulator + mulWad(earningsAccumulatorSmoothFactor, BigInt(maxFuturePools) * interval);
  const accumulatedEarnings = denominator === 0n ? 0n : mulDiv(earningsAccumulator, elapsedAccumulator, denominator);

  const newDebt = mulWad(
    floatingDebt,
    mulDiv(floatingRate, BigInt(timestamp - lastFloatingDebtUpdate), YEAR_IN_SECONDS),
  );
  const backupEarnings = fixedPoolEarnings(pools, timestamp);
  return floatingAssets + backupEarnings + accumulatedEarnings + mulWad(newDebt, WAD - treasuryFeeRate);
}

function fixedPoolEarnings(pools: readonly FixedPool[], timestamp: number) {
  let backupEarnings = 0n;
  for (const { lastAccrual, maturity, unassignedEarnings } of pools) {
    if (maturity > lastAccrual) {
      backupEarnings +=
        timestamp < maturity
          ? mulDiv(unassignedEarnings, BigInt(timestamp) - lastAccrual, BigInt(maturity - lastAccrual))
          : unassignedEarnings;
    }
  }
  return backupEarnings;
}

export interface MarketSnapshot {
  market: string;
  floatingDebt: bigint;
  floatingBackupBorrowed: bigint;
  pools: readonly FixedPool[];
  floatingAssets: bigint;
  treasuryFeeRate: bigint;
  earningsAccumulator: bigint;
  earningsAccumulatorSmoothFactor: bigint;
  lastFloatingDebtUpdate: number;
  lastAccumulatorAccrual: number;
  maxFuturePools: number;
  interval: bigint;
  totalAssets: bigint;
  floatingRate: bigint;
}

interface FixedPool {
  maturity: bigint;
  lastAccrual: bigint;
  unassignedEarnings: bigint;
}
