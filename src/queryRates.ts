import fetchMarketState from './fetchMarketState';
import shareValueProportion from './shareValueProportion';
import { Rate } from './types';
import { apr, apy, utilization } from './utils';

const rate = async (
  subgraph: string,
  market: string,
  type: 'deposit' | 'borrow',
  interval: number,
  startTimestamp: number,
): Promise<Rate> => {
  const [currentMarketState, previousMarketState] = await Promise.all(
    [startTimestamp, startTimestamp - interval].map(
      (timestamp) => fetchMarketState(timestamp, market, subgraph),
    ),
  );

  const proportion = shareValueProportion(
    currentMarketState,
    previousMarketState,
    type,
    startTimestamp,
    interval,
  );

  return {
    date: new Date(startTimestamp * 1_000),
    apr: Number(apr(proportion, interval)) / 1e18,
    apy: apy(proportion, interval),
    utilization: Number(utilization(currentMarketState)) / 1e18,
  };
};

export default async (
  subgraph: string,
  market: string,
  type: 'deposit' | 'borrow',
  {
    roundTicks = false,
    interval = 60 * 60,
    offset = 0,
    count = 1,
  }: {
    roundTicks?: boolean,
    interval?: number,
    offset?: number,
    count?: number,
  } = {},
) => {
  const now = Math.floor(Date.now() / 1_000) - offset * interval;
  const lastTimestamp = roundTicks ? now - (now % interval) : now;
  const timestamps = Array
    .from({ length: count }, (_, i) => lastTimestamp - interval * i).reverse();

  return Promise.all(timestamps.map((timestamp) => rate(
    subgraph,
    market,
    type,
    interval,
    timestamp,
  )));
};
