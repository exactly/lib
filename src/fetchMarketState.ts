import request from 'graphql-request';
import { MarketState, MarketStateResponse } from './types';

const responseToMarketState = ({
  id, treasuryFeeRate, fixedPools, timestamp, market,
  lastAccumulatorAccrual, earningsAccumulator,
  earningsAccumulatorSmoothFactor, floatingAssets, totalFloatingBorrowShares,
  floatingCurveA, floatingCurveB, floatingDebt,
  floatingMaxUtilization, floatingUtilization, totalSupply, lastFloatingDebtUpdate,
}: MarketStateResponse): MarketState => ({
  id,
  timestamp,
  market,
  lastAccumulatorAccrual,
  earningsAccumulator: BigInt(earningsAccumulator),
  earningsAccumulatorSmoothFactor: BigInt(earningsAccumulatorSmoothFactor),
  floatingAssets: BigInt(floatingAssets),
  totalFloatingBorrowShares: BigInt(totalFloatingBorrowShares),
  floatingCurveA: BigInt(floatingCurveA),
  floatingCurveB: BigInt(floatingCurveB),
  floatingDebt: BigInt(floatingDebt),
  floatingMaxUtilization: BigInt(floatingMaxUtilization),
  floatingUtilization: BigInt(floatingUtilization),
  totalSupply: BigInt(totalSupply),
  treasuryFeeRate: treasuryFeeRate ? BigInt(treasuryFeeRate) : null,
  lastFloatingDebtUpdate,
  fixedPools: fixedPools ? fixedPools.map(({
    id: poolId, timestamp: poolTimestamp, maturity, unassignedEarnings, lastAccrual,
  }) => ({
    id: poolId,
    maturity,
    timestamp: poolTimestamp,
    unassignedEarnings: BigInt(unassignedEarnings),
    lastAccrual,
  })) : null,
});

const query = (timestamp: number | null, market: string): string => `
  query {
    marketStates(
      where: {
        timestamp_lte: ${timestamp}
        market_: { id: "${market}" }
      }
      orderBy: timestamp
      first: 1
      orderDirection: desc
    ) {
      id
      market {
        id
      }
      timestamp
      floatingAssets
      totalFloatingBorrowShares
      floatingDebt
      earningsAccumulator
      floatingUtilization
      floatingCurveA
      floatingCurveB
      floatingMaxUtilization
      lastAccumulatorAccrual
      earningsAccumulatorSmoothFactor
      treasuryFeeRate
      lastFloatingDebtUpdate
      fixedPools {
        id
        maturity
        timestamp
        unassignedEarnings
        borrowed
        supplied
        lastAccrual
      }
      totalSupply
    }
  }
`;

export default async (
  timestamp: number,
  market: string,
  subgraph: string,
): Promise<MarketState> => {
  const { marketStates } = await request<{ marketStates: MarketStateResponse[] }>(
    subgraph,
    query(timestamp, market),
  );

  if (!marketStates.length) throw new Error(`No market state found for ${market} at ${timestamp}`);

  return responseToMarketState(marketStates[0]);
};
