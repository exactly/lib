import { WAD } from './FixedPointMathLib';
import fetchAccounts, { Account } from './fetchAccounts';
import fetchMarketState from './fetchMarketState';
import shareValueProportion from './shareValueProportion';
import { apr } from './utils';

type FixedPosition = {
  principal: bigint
  fee: bigint
  borrow: boolean
  maturity: number
  rate: bigint
};

const totalWeight = (
  accounts: Account[],
  timestamp: number,
  assetPrices: Record<string, number>,
) => accounts.reduce(
  (acc, account) => {
    const {
      borrowShares, depositShares, market: { decimals, asset }, fixedPositions,
    } = account;

    const fixedShares = fixedPositions.reduce((
      fixedAcc,
      {
        principal, borrow, maturity,
      },
    ) => (
      maturity > timestamp ? fixedAcc + (borrow ? -1n : 1n) * principal : fixedAcc
    ), 0n);

    const weight = (((depositShares - borrowShares + fixedShares
    ) * WAD) / BigInt(10 ** decimals))
      * BigInt(assetPrices[asset]);

    return acc + weight;
  },
  0n,
);

const fixedAPRWeighted = (positions: FixedPosition[], timestamp: number) => (
  positions?.reduce(
    (fixedAcc, {
      principal, borrow, maturity, rate,
    }) => (maturity > timestamp
      ? fixedAcc
      + principal
      * rate
      * (borrow ? -1n : 1n)
      : 0n),
    0n,
  ) ?? 0n);

const floatingAPRs = async (
  market: string,
  timestamp: number,
  interval: number,
  subgraph: string,
) => {
  const [currentMarketState, previousMarketState] = await Promise.all(
    [timestamp, timestamp - interval].map(
      (timestamp_) => fetchMarketState(timestamp_, market, subgraph),
    ),
  );
  const [deposit, borrow] = (['deposit', 'borrow'] as const).map((type) => {
    const proportion = shareValueProportion(
      currentMarketState,
      previousMarketState,
      type,
      timestamp,
      interval,
    );
    return apr(proportion, interval);
  });

  return {
    deposit,
    borrow,
  };
};

export default async (
  address: string,
  subgraph: string,
  interval: number,
  assetPrices: Record<string, number>,
) => {
  const accounts = await fetchAccounts(subgraph, address);
  const timestamp = Math.floor(Date.now() / 1_000);

  const totalWeightedAPR = await accounts.reduce(async (
    acc,
    account,
  ) => {
    const {
      depositShares,
      borrowShares,
      fixedPositions,
      market,
    } = account;

    const {
      borrow: floatingBorrowAPR,
      deposit: floatingDepositAPR,
    } = await floatingAPRs(market.id, timestamp, interval, subgraph);

    const { asset, decimals } = market;
    const assetPrice = asset ? assetPrices[asset] : undefined;
    if (!assetPrice) throw new Error(`missing price for ${asset}`);

    const floatingAPRWeighted = floatingDepositAPR * depositShares
      - floatingBorrowAPR * borrowShares;

    const weightedAPR = (
      (floatingAPRWeighted + fixedAPRWeighted(fixedPositions, timestamp)) * BigInt(assetPrice))
      / BigInt(10 ** decimals);

    return (await acc) + weightedAPR;
  }, Promise.resolve(0n));

  const weight = totalWeight(accounts, timestamp, assetPrices);

  if (weight === 0n) return 0n;
  const weightedAverageAPR = (totalWeightedAPR * WAD) / weight;

  return Number(weightedAverageAPR) / 1e18;
};
