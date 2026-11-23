import WAD from "../fixed-point-math/WAD.js";
import expWad from "../fixed-point-math/expWad.js";
import max from "../fixed-point-math/max.js";
import min from "../fixed-point-math/min.js";
import mulDiv from "../fixed-point-math/mulDiv.js";
import mulWad from "../fixed-point-math/mulWad.js";
import mulWadUp from "../fixed-point-math/mulWadUp.js";
import { ONE_YEAR } from "../installments/effectiveRate.js";
import type IRMParameters from "../interest-rate-model/Parameters.ts";
import fixedRate, { MATURITY_INTERVAL } from "../interest-rate-model/fixedRate.js";
import fixedUtilization from "../interest-rate-model/fixedUtilization.js";
import floatingRate from "../interest-rate-model/floatingRate.js";
import floatingUtilization from "../interest-rate-model/floatingUtilization.js";
import globalUtilization from "../interest-rate-model/globalUtilization.js";

export default function fixedBorrowPosition(
  snapshot: FixedBorrowSnapshot,
  maturity: number,
  assets: bigint,
  timestamp = Math.floor(Date.now() / 1000),
) {
  if (assets === 0n) throw new Error("ZERO_BORROW");
  const market = fixedBorrowMarket(snapshot, maturity, timestamp);
  if (assets > market.available) throw new Error("INSUFFICIENT_PROTOCOL_LIQUIDITY");
  return assets + mulWadUp(assets, fixedBorrowFactor(market, assets));
}

export function fixedBorrowMarket(
  {
    floatingAssets,
    floatingAssetsAverage,
    floatingDebt,
    floatingBackupBorrowed,
    lastAverageUpdate,
    lastFloatingDebtUpdate,
    dampSpeedUp,
    dampSpeedDown,
    reserveFactor,
    maxFuturePools,
    parameters,
    borrowed,
    supplied,
    unassignedEarnings,
    lastAccrual,
  }: FixedBorrowSnapshot,
  maturity: number,
  timestamp: number,
): FixedBorrowMarket {
  if (
    maturity % MATURITY_INTERVAL !== 0 ||
    maturity <= timestamp ||
    maturity > timestamp - (timestamp % MATURITY_INTERVAL) + maxFuturePools * MATURITY_INTERVAL
  ) {
    throw new Error("UNMATCHED_POOL_STATE");
  }

  const newDebt = mulWad(
    floatingDebt,
    mulDiv(
      floatingRate(
        floatingUtilization(floatingAssets, floatingDebt),
        globalUtilization(floatingAssets, floatingDebt, floatingBackupBorrowed),
        parameters,
      ),
      BigInt(Math.max(timestamp - lastFloatingDebtUpdate, 0)),
      ONE_YEAR,
    ),
  );
  const debt = floatingDebt + newDebt;
  const assets =
    floatingAssets +
    newDebt +
    mulDiv(unassignedEarnings, max(BigInt(timestamp) - lastAccrual, 0n), BigInt(maturity) - lastAccrual);

  const damp = assets < floatingAssetsAverage ? dampSpeedDown : dampSpeedUp;
  const averageFactor = WAD - expWad(-(damp * BigInt(Math.max(timestamp - lastAverageUpdate, 0))));
  const average = mulWad(floatingAssetsAverage, WAD - averageFactor) + mulWad(averageFactor, assets);

  const cap = mulWad(assets, WAD - reserveFactor);
  const used = floatingBackupBorrowed + debt;
  const available = max(borrowed, supplied) - borrowed + (cap > used ? cap - used : 0n);

  return {
    maturity,
    timestamp,
    maxFuturePools,
    parameters,
    borrowed,
    supplied,
    average,
    debt,
    backupBorrowed: floatingBackupBorrowed,
    available,
  };
}

export function fixedBorrowFactor(
  {
    maturity,
    timestamp,
    maxFuturePools,
    parameters,
    borrowed,
    supplied,
    average,
    debt,
    backupBorrowed,
  }: FixedBorrowMarket,
  assets: bigint,
) {
  const newBorrowed = borrowed + assets;
  const rate = fixedRate(
    maturity,
    maxFuturePools,
    fixedUtilization(supplied, newBorrowed, average),
    floatingUtilization(average, debt),
    globalUtilization(average, debt, backupBorrowed + newBorrowed - min(max(borrowed, supplied), newBorrowed)),
    parameters,
    timestamp,
  );
  return mulDiv(rate, BigInt(maturity - timestamp), ONE_YEAR);
}

export interface FixedBorrowSnapshot {
  floatingAssets: bigint;
  floatingAssetsAverage: bigint;
  floatingDebt: bigint;
  floatingBackupBorrowed: bigint;
  lastAverageUpdate: number;
  lastFloatingDebtUpdate: number;
  dampSpeedUp: bigint;
  dampSpeedDown: bigint;
  reserveFactor: bigint;
  maxFuturePools: number;
  parameters: IRMParameters;
  borrowed: bigint;
  supplied: bigint;
  unassignedEarnings: bigint;
  lastAccrual: bigint;
}

export interface FixedBorrowMarket {
  maturity: number;
  timestamp: number;
  maxFuturePools: number;
  parameters: IRMParameters;
  borrowed: bigint;
  supplied: bigint;
  average: bigint;
  debt: bigint;
  backupBorrowed: bigint;
  available: bigint;
}
