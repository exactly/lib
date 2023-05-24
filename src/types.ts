export type Rate = {
  date: Date;
  apr: number;
  apy: number;
  utilization: number;
};

export type MarketStateResponse = {
  id: string
  timestamp: number
  market: {
    id: string
    decimals: number
  }
  floatingAssets: string
  totalFloatingBorrowShares: string
  floatingDebt: string
  earningsAccumulator: string
  floatingUtilization: string
  floatingCurveA: string
  floatingCurveB: string
  floatingMaxUtilization: string
  lastAccumulatorAccrual: number
  earningsAccumulatorSmoothFactor: string
  treasuryFeeRate: string | null
  fixedPools: FixedPoolState[] | null
  totalSupply: string
  lastFloatingDebtUpdate: number
};

export type MarketState = {
  id: string
  timestamp: number
  market: {
    id: string
    decimals: number
  }
  floatingAssets: bigint
  totalFloatingBorrowShares: bigint
  floatingDebt: bigint
  earningsAccumulator: bigint
  floatingUtilization: bigint
  floatingCurveA: bigint
  floatingCurveB: bigint
  floatingMaxUtilization: bigint
  earningsAccumulatorSmoothFactor: bigint
  totalSupply: bigint
  treasuryFeeRate: bigint | null
  lastAccumulatorAccrual: number
  fixedPools: FixedPoolState[] | null
  lastFloatingDebtUpdate: number
};

export type FloatingDebtState = {
  utilization: bigint
  timestamp: number
};

export type FixedPoolState = {
  id: string
  maturity: number
  timestamp:number
  unassignedEarnings: bigint
  lastAccrual: number
  borrowed: bigint
  supplied: bigint
};

export type InterestRateModel = Pick<MarketState,
| 'floatingCurveA'
| 'floatingCurveB'
| 'floatingMaxUtilization'
>;
