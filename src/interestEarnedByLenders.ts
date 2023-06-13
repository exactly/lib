import { WAD } from './FixedPointMathLib';
import fetchMarketState from './fetchMarketState';
import shareValueProportion from './shareValueProportion';

export default async (
  subgraph: string,
  market: string,
  timestamp: number,
  period: number = 60 * 60 * 24,
) => {
  const previousMarketState = await fetchMarketState(timestamp - period, market, subgraph);
  const currentMarketState = await fetchMarketState(timestamp, market, subgraph);
  const proportion = shareValueProportion(currentMarketState, previousMarketState, 'deposit', timestamp, period);
  return Number(proportion - WAD) / 1e18;
};
