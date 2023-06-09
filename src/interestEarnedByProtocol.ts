import request from 'graphql-request';

export default async (subgraph: string, market: string) => {
  const { market: marketResponse } = await request<{ market: { treasuryFeesCollected: string } }>(
    subgraph,
    `{market(id: "${market}") {treasuryFeesCollected}}`,
  );

  return BigInt(marketResponse.treasuryFeesCollected);
};
