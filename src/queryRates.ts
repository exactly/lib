import { Rate } from './types';
import fetchMarketState from './fetchMarketState';
import shareValueProportion from './shareValueProportion';
import { apr, apy, marketStateUtilization } from './utils';

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
    apr: apr(proportion, interval),
    apy: apy(proportion, interval),
    utilization: Number(marketStateUtilization(currentMarketState)) / 1e18,
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
): Promise<Rate[]> => {
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
