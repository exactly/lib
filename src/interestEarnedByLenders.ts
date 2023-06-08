import { WAD } from './FixedPointMathLib';
import fetchMarketState from './fetchMarketState';
import shareValueProportion from './shareValueProportion';

export default async (subgraph: string, market: string, timestamp: number) => {
  const interval = 60 * 60 * 24;
  const previousMarketState = await fetchMarketState(timestamp - interval, market, subgraph);
  const currentMarketState = await fetchMarketState(timestamp, market, subgraph);
  const proportion = shareValueProportion(currentMarketState, previousMarketState, 'deposit', timestamp, interval);
  return Number(proportion - WAD) / 1e18;
};
