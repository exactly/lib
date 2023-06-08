import request from 'graphql-request';

type IndexUpdateResponse = {
  market: string
  reward: string
  borrowIndex: string
  depositIndex: string
  newUndistributed: string
  timestamp: number
};

type IndexUpdate = {
  market: string
  reward: string
  borrowIndex: bigint
  depositIndex: bigint
  newUndistributed: bigint
  timestamp: number
};

export default async (
  timestamp: number,
  subgraph: string,
  market: string,
): Promise<IndexUpdate[]> => {
  const { indexUpdates: indexUpdatesResponse } = await request<{ indexUpdates: IndexUpdateResponse[] }>(subgraph, `{
    indexUpdates(
      where: {
        timestamp_lte: ${timestamp}
        market: "${market}"
      }
      orderBy: timestamp
      orderDirection: desc
      first: 2
    ) {
      market
      reward
      borrowIndex
      depositIndex
      newUndistributed
      timestamp
    }
  }`);

  return indexUpdatesResponse.map(({
    market: market_,
    reward,
    borrowIndex,
    depositIndex,
    newUndistributed,
    timestamp: timestamp_,
  }) => ({
    market: market_,
    reward,
    borrowIndex: BigInt(borrowIndex),
    depositIndex: BigInt(depositIndex),
    newUndistributed: BigInt(newUndistributed),
    timestamp: timestamp_,
  }));
};
