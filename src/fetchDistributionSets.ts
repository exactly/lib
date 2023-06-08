import request from 'graphql-request';

type Config = {
  id: string
  market: string
  reward: string
  priceFeed: string
  start: bigint
  distributionPeriod: bigint
  targetDebt: bigint
  totalDistribution: bigint
  undistributedFactor: bigint
  flipSpeed: bigint
  compensationFactor: bigint
  transitionFactor: bigint
  borrowAllocationWeightFactor: bigint
  depositAllocationWeightAddend: bigint
  depositAllocationWeightFactor: bigint
};

type ConfigResponse = {
  id: string
  market: string
  reward: string
  priceFeed: string
  start: string
  distributionPeriod: string
  targetDebt: string
  totalDistribution: string
  undistributedFactor: string
  flipSpeed: string
  compensationFactor: string
  transitionFactor: string
  borrowAllocationWeightFactor: string
  depositAllocationWeightAddend: string
  depositAllocationWeightFactor: string
};

type DistributionSet<C> = {
  id: string
  market: string
  reward: string
  config: C
  timestamp: number
  block: number
};

export default async (
  timestamp: number,
  subgraph: string,
  market: string,
): Promise<DistributionSet<Config>[]> => {
  const { distributionSets: response } = await request<{ distributionSets: DistributionSet<ConfigResponse>[] }>(subgraph, `{
    distributionSets(
      where: {market: "${market}", timestamp_lte: ${timestamp}}
      orderBy: timestamp
      orderDirection: desc
    ){
      id
      market
      reward
      timestamp
      block
      config {
        id
        market
        reward
        priceFeed
        start
        distributionPeriod
        targetDebt
        totalDistribution
        undistributedFactor
        flipSpeed
        compensationFactor
        transitionFactor
        borrowAllocationWeightFactor
        depositAllocationWeightAddend
        depositAllocationWeightFactor
      }
    }
  }`);

  return response.map(({
    config: {
      start,
      distributionPeriod,
      targetDebt,
      totalDistribution,
      undistributedFactor,
      flipSpeed,
      compensationFactor,
      transitionFactor,
      borrowAllocationWeightFactor,
      depositAllocationWeightAddend,
      depositAllocationWeightFactor,
      ...configRest
    },
    ...rest
  }) => ({
    ...rest,
    config: {
      ...configRest,
      start: BigInt(start),
      distributionPeriod: BigInt(distributionPeriod),
      targetDebt: BigInt(targetDebt),
      totalDistribution: BigInt(totalDistribution),
      undistributedFactor: BigInt(undistributedFactor),
      flipSpeed: BigInt(flipSpeed),
      compensationFactor: BigInt(compensationFactor),
      transitionFactor: BigInt(transitionFactor),
      borrowAllocationWeightFactor: BigInt(borrowAllocationWeightFactor),
      depositAllocationWeightAddend: BigInt(depositAllocationWeightAddend),
      depositAllocationWeightFactor: BigInt(depositAllocationWeightFactor),
    },
  }));
};
