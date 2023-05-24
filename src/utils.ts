import { WAD } from './FixedPointMathLib';
import { ONE_YEAR_IN_S } from './shareValueProportion';
import { MarketState } from './types';

export const utilization = (
  { floatingDebt, floatingAssets }: MarketState,
) => {
  if (floatingAssets === 0n) return 0n;

  return (floatingDebt * WAD) / (floatingAssets);
};

export const apr = (
  proportion_: bigint,
  interval: number,
) => ((Number(proportion_) / 1e18) - 1) * (ONE_YEAR_IN_S / interval);

export const apy = (
  proportion_: bigint,
  interval: number,
) => ((Number(proportion_) / 1e18) ** (ONE_YEAR_IN_S / interval)) - 1;
