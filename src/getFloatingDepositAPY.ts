import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import INTERVAL from './INTERVAL';
import SUBGRAPH_URL from './SUBGRAPH_URL';
import MAX_FUTURE_POOLS from './MAX_FUTURE_POOLS';
import futurePools from './futurePools';
import { WAD } from './FixedPointMathLib';

export default async (market: string) => {
  const timeWindow = {
    start: Math.floor(Date.now() / 1_000) - 86_400 * 7,
    end: Math.floor(Date.now() / 1_000),
  };
  const {
    initial: [initial = {
      timestamp: 0, floatingDepositShares: '0', floatingAssets: '0', earningsAccumulator: '0',
    }],
    final: [final = initial],
    initialAccumulatorAccrual: [{ timestamp: initialAccumulatorAccrual } = { timestamp: 0 }],
    finalAccumulatorAccrual: [{ timestamp: finalAccumulatorAccrual } = { timestamp: 0 }],
    earningsAccumulatorSmoothFactor: [{ earningsAccumulatorSmoothFactor }],
    ...allMaturities
  } = await request(SUBGRAPH_URL, `
    query(
      $market: Bytes
      $start: Int
    ) {
      initial: marketUpdateds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        earningsAccumulator
      }

      final: marketUpdateds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        earningsAccumulator
      }

      initialAccumulatorAccrual: accumulatorAccrueds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
      }

      finalAccumulatorAccrual: accumulatorAccrueds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
      }

      earningsAccumulatorSmoothFactor: earningsAccumulatorSmoothFactorSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        earningsAccumulatorSmoothFactor
      }

      ${futurePools(timeWindow.start).map((maturity) => `
        initial${maturity}: fixedEarningsUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity}, timestamp_lte: $start }
        ) {
          timestamp
          maturity
          unassignedEarnings
        }
      `).join('')}

      ${futurePools(timeWindow.end).map((maturity) => `
        final${maturity}: fixedEarningsUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity} }
        ) {
          timestamp
          maturity
          unassignedEarnings
        }
      `).join('')}
    }
  `, { market, ...timeWindow }) as {
    initial: MarketState[];
    final: MarketState[];
    initialAccumulatorAccrual: State[];
    finalAccumulatorAccrual: State[];
    earningsAccumulatorSmoothFactor: { earningsAccumulatorSmoothFactor: string }[];
  };

  const fixedPool = (prefix: string) => Object.entries(allMaturities)
    .filter(([key, pools]: [string, FixedPool[]]) => pools.length && key.startsWith(prefix))
    .map(([, [pool]]: [string, FixedPool[]]) => pool);

  const totalAssets = (
    timestamp: number,
    { floatingAssets, earningsAccumulator }: MarketState,
    accumulatorAccrual: number,
    maturities: FixedPool[],
  ) => {
    const elapsed = BigInt(timestamp - accumulatorAccrual);
    return (
      BigInt(floatingAssets)
      + maturities.reduce((
        smartPoolEarnings,
        { timestamp: lastAccrual, maturity, unassignedEarnings },
      ) => (
        smartPoolEarnings
          + (maturity > lastAccrual
            ? (BigInt(unassignedEarnings) * BigInt(timestamp - lastAccrual))
              / BigInt(maturity - lastAccrual)
            : 0n)
      ), 0n)
      + (elapsed
        && (BigInt(earningsAccumulator) * elapsed)
          / (elapsed
            + (BigInt(earningsAccumulatorSmoothFactor) * BigInt(MAX_FUTURE_POOLS * INTERVAL))
              / WAD))
    );
  };

  const initialShares = BigInt(initial.floatingDepositShares);
  const initialAssets = totalAssets(
    timeWindow.start,
    initial,
    initialAccumulatorAccrual,
    fixedPool('initial'),
  );

  const finalShares = BigInt(final.floatingDepositShares);
  const finalAssets = totalAssets(
    timeWindow.end,
    final,
    finalAccumulatorAccrual,
    fixedPool('final'),
  );

  const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
  const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;
  const time = 31_536_000 / (timeWindow.end - timeWindow.start);
  return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
};

interface State {
  timestamp: number;
}

interface MarketState extends State {
  floatingDepositShares: string;
  floatingAssets: string;
  earningsAccumulator: string;
}

interface FixedPool extends State {
  maturity: number;
  unassignedEarnings: string;
}
