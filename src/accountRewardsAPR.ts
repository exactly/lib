import { WAD } from './FixedPointMathLib';
import accountsWorth from './accountsWorth';
import fetchAccounts from './fetchAccounts';
import rewardsAPR from './rewardsAPR';

type FixedPosition = {
  principal: bigint
  fee: bigint
  borrow: boolean
  maturity: number
  rate: bigint
};

const fixedRewardsAPRWeighted = (
  positions: FixedPosition[],
  timestamp: number,
  borrowRewardAPR: bigint,
) => (
  positions?.reduce(
    (acc, {
      principal, borrow, maturity,
    }) => (maturity >= timestamp && borrow
      ? acc + principal * borrowRewardAPR
      : 0n),
    0n,
  ) ?? 0n);

export default async (
  address: string,
  subgraph: string,
  assetPrices: Record<string, number>,
) => {
  const accounts = await fetchAccounts(subgraph, address);
  const timestamp = Math.floor(Date.now() / 1_000);

  const totalWeightedAPR = await accounts.reduce(async (
    total,
    account,
  ) => {
    const {
      depositShares,
      borrowShares,
      fixedPositions,
      market,
    } = account;

    const {
      borrow: borrowRewardAPR,
      deposit: depositRewardAPR,
    } = await rewardsAPR(timestamp, subgraph, market.id, assetPrices);

    const { asset, decimals } = market;
    const assetPrice = asset ? assetPrices[asset] : undefined;
    if (!assetPrice) throw new Error(`missing price for ${asset}`);

    const floatingAPRWeighted = depositRewardAPR * depositShares
      + borrowRewardAPR * borrowShares;

    const weightedAPR = (
      (floatingAPRWeighted + fixedRewardsAPRWeighted(fixedPositions, timestamp, depositRewardAPR))
      * BigInt(assetPrice))
      / BigInt(10 ** decimals);

    return (await total) + weightedAPR;
  }, Promise.resolve(0n));

  const total = accountsWorth(accounts, timestamp, assetPrices);

  if (total === 0n) return 0n;
  const weightedAverageAPR = (totalWeightedAPR * WAD) / total;

  return Number(weightedAverageAPR) / 1e18;
};
