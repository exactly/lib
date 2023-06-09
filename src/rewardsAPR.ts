import { WAD } from './FixedPointMathLib';
import fetchDistributionSets from './fetchDistributionSets';
import fetchMarketState from './fetchMarketState';
import fetchRewardsIndexUpdate from './fetchRewardsIndexUpdates';
import { ONE_YEAR_IN_S, totalAssets as getTotalAssets, totalFloatingBorrowAssets } from './shareValueProportion';
import { MarketState } from './types';

const previewRepay = (assets: bigint, marketState: MarketState, timestamp: number) => (
  marketState.totalFloatingBorrowShares === 0n
    ? assets
    : (assets * marketState.totalFloatingBorrowShares)
    / totalFloatingBorrowAssets(timestamp, marketState));

export default async (
  timestamp: number,
  subgraph: string,
  market: string,
  assetPrices: Record<string, number>,
) => {
  const rewardIndices = await fetchRewardsIndexUpdate(timestamp, subgraph, market);

  if (rewardIndices.length < 2) return { deposit: 0n, borrow: 0n };

  const [currIndex, prevIndex] = rewardIndices;

  const prevMarketState = await fetchMarketState(prevIndex.timestamp, market, subgraph);
  const {
    totalFloatingBorrowShares,
    totalSupply,
    market: { asset },
  } = prevMarketState;

  const fixedDebt = prevMarketState.fixedPools?.reduce((acc, { borrowed }) => (
    acc + borrowed), 0n) ?? 0n;

  const [distributionSet] = await fetchDistributionSets(timestamp, subgraph, market);

  const { config: { reward, start, distributionPeriod } } = distributionSet;

  const isActive = BigInt(timestamp) <= start + distributionPeriod;

  if (!isActive) return { deposit: 0n, borrow: 0n };

  const rewardUSD = BigInt(assetPrices[reward] * 1e18);
  const usdUnitPrice = BigInt(assetPrices[asset] * 1e18);

  const baseUnit = BigInt(10 ** prevMarketState.market.decimals);
  const floatingBorrowAssets = totalFloatingBorrowAssets(currIndex.timestamp, prevMarketState);
  const totalAssets = getTotalAssets(currIndex.timestamp, prevMarketState);
  const realInteval = currIndex.timestamp - prevIndex.timestamp;
  const borrowIndexDiff = currIndex.borrowIndex - prevIndex.borrowIndex;
  const previewRepayResult = previewRepay(fixedDebt, prevMarketState, prevIndex.timestamp);

  const borrowProportion = (((((
    borrowIndexDiff * (totalFloatingBorrowShares + previewRepayResult))
    / baseUnit)
    * rewardUSD)
    / WAD)
    * baseUnit)
    / (((floatingBorrowAssets + fixedDebt) * usdUnitPrice) / WAD);

  const depositIndexDiff = currIndex.depositIndex - prevIndex.depositIndex;
  const depositProportion = (((depositIndexDiff * (totalSupply / baseUnit) * rewardUSD) / WAD)
    * baseUnit) / ((totalAssets * usdUnitPrice) / WAD);

  return {
    deposit:
      totalAssets > 0n
        ? (
          depositProportion / BigInt(realInteval)
        ) * BigInt(ONE_YEAR_IN_S)
        : 0n,
    borrow:
      floatingBorrowAssets + fixedDebt > 0n
        ? (
          borrowProportion / BigInt(realInteval)
        ) * BigInt(ONE_YEAR_IN_S)
        : 0n,
  };
};
