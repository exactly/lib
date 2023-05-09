import { WAD, lnWad } from './FixedPointMathLib';
import { MarketState } from './types';

export const ONE_YEAR_IN_S = 60 * 60 * 24 * 365;
const FIXED_INTERVAL = 86_400 * 7 * 4;
const PRECISION_THRESHOLD = 750_000_000_000_000n;
const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

const floatingRate = (
  { floatingCurveA, floatingCurveB, floatingMaxUtilization }: MarketState,
  utilizationBefore: bigint,
  utilizationAfter: bigint,
) => {
  const alpha = floatingMaxUtilization - utilizationBefore;
  const delta = utilizationAfter - utilizationBefore;
  const weightedAverageDifference = (delta * WAD) / alpha;
  const fourWeightedCurveA = floatingCurveA * 4n * WAD;
  const curveA1 = ((floatingCurveA * WAD) / alpha);
  const curveA2 = fourWeightedCurveA
  / (floatingMaxUtilization - (utilizationAfter + utilizationBefore) / 2n);

  const curveA3 = (floatingCurveA * WAD) / (floatingMaxUtilization - utilizationAfter);
  const weightedCurveSum = (curveA1 + curveA2 + curveA3) / 6n;

  const logCurveA = (floatingCurveA * lnWad((alpha * WAD)
  / (floatingMaxUtilization - utilizationAfter))) / delta;

  const baseRate = weightedAverageDifference < PRECISION_THRESHOLD ? weightedCurveSum : logCurveA;

  return baseRate + floatingCurveB;
};

const totalFloatingBorrowAssets = (timestamp: number, marketState: MarketState) => {
  const {
    floatingAssets, floatingDebt,
  } = marketState;

  const utilization = marketState.floatingUtilization;
  const newUtilization = floatingAssets > 0n
    ? (floatingDebt * WAD) / floatingAssets
    : 0n;

  const borrowRate = floatingRate(
    marketState,
    min(utilization, newUtilization),
    max(utilization, newUtilization),
  );

  return floatingDebt
  + (floatingDebt * ((borrowRate * BigInt(timestamp - marketState.lastFloatingDebtUpdate))
  / BigInt(ONE_YEAR_IN_S)))
  / WAD;
};

const totalAssets = (timestamp: number, marketState: MarketState) => {
  const {
    floatingAssets, floatingDebt, earningsAccumulator,
    lastAccumulatorAccrual, earningsAccumulatorSmoothFactor,
  } = marketState;

  const fixedPools = marketState.fixedPools || [];
  const treasuryFeeRate = marketState.treasuryFeeRate || 0n;
  const maxFuturePools = fixedPools.length;
  const elapsed = BigInt(timestamp - lastAccumulatorAccrual);
  const fixedPoolsAssets = fixedPools.filter(Boolean).reduce((
    floatingPoolEarnings,
    { lastAccrual, maturity, unassignedEarnings },
  ) => (
    floatingPoolEarnings
      + (maturity > lastAccrual
        ? (timestamp < maturity
          ? (unassignedEarnings * BigInt(timestamp - lastAccrual))
            / BigInt(maturity - lastAccrual)
          : unassignedEarnings)
        : 0n)
  ), 0n);

  const adjustedEarnings = elapsed && (earningsAccumulator * elapsed)
      / (elapsed + (earningsAccumulatorSmoothFactor
        * BigInt(maxFuturePools * FIXED_INTERVAL)) / WAD);

  const netBorrowAssets = ((
    totalFloatingBorrowAssets(timestamp, marketState)
    - floatingDebt
  ) * (WAD - treasuryFeeRate)) / WAD;

  return floatingAssets + fixedPoolsAssets + adjustedEarnings + netBorrowAssets;
};

const shareValue = (type: 'deposit' | 'borrow', marketState: MarketState, timestamp: number) => {
  const assets = (type === 'deposit' ? totalAssets : totalFloatingBorrowAssets)(timestamp, marketState);
  const shares = type === 'deposit' ? marketState.totalSupply : marketState.totalFloatingBorrowShares;

  if (shares === 0n) return 0n;
  return (assets * WAD) / shares;
};

export default (
  current: MarketState,
  previous: MarketState,
  type: 'deposit' | 'borrow',
  timestamp: number,
  interval:number,
) => {
  const currentShareValue = shareValue(type, current, timestamp);
  const previousShareValue = shareValue(type, previous, timestamp - interval);
  if (previousShareValue === 0n) return 0n;

  return (currentShareValue * WAD) / previousShareValue;
};
