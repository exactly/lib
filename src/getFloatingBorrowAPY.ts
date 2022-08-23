import request from 'graphql-request';
import { formatFixed } from '@ethersproject/bignumber';
import type { FloatingDebtState, IRMParameters, MarketState } from './floatingAPY';
import {
  DEFAULT_MARKET_STATE, DEFAULT_FLOATING_DEBT_STATE, totalFloatingBorrowAssets, WAD,
} from './floatingAPY';
import SUBGRAPH_URL from './SUBGRAPH_URL';

export default async (market: string) => {
  const timeWindow = {
    start: Math.floor(Date.now() / 1_000) - 3_600,
    end: Math.floor(Date.now() / 1_000),
  };
  const {
    initial: [initial = DEFAULT_MARKET_STATE],
    final: [final = initial],
    initialDebtUpdate: [initialDebtUpdate = DEFAULT_FLOATING_DEBT_STATE],
    finalDebtUpdate: [finalDebtUpdate = initialDebtUpdate],
    floatingParameters: [floatingParameters],
  } = await request(SUBGRAPH_URL, `
    query(
      $market: Bytes
      $start: Int
    ) {
      initial: marketUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        floatingBorrowShares
        floatingDebt
        earningsAccumulator
      }

      final: marketUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        floatingDepositShares
        floatingAssets
        floatingBorrowShares
        floatingDebt
        earningsAccumulator
      }

      initialDebtUpdate: floatingDebtUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, timestamp_lte: $start }
      ) {
        timestamp
        utilization
      }

      finalDebtUpdate: floatingDebtUpdates(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        utilization
      }

      floatingParameters: floatingParametersSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
      ) {
        curveA
        curveB
        maxUtilization
        fullUtilization
      }
    }
  `, { market, ...timeWindow }) as {
    initial: MarketState[];
    final: MarketState[];
    initialDebtUpdate: FloatingDebtState[];
    finalDebtUpdate: FloatingDebtState[];
    floatingParameters: IRMParameters[];
  };

  const initialShares = BigInt(initial.floatingBorrowShares);
  const initialAssets = totalFloatingBorrowAssets(
    timeWindow.start,
    initial,
    initialDebtUpdate,
    floatingParameters,
  );

  const finalShares = BigInt(final.floatingBorrowShares);
  const finalAssets = totalFloatingBorrowAssets(
    timeWindow.end,
    final,
    finalDebtUpdate,
    floatingParameters,
  );

  const denominator = initialShares ? (initialAssets * WAD) / initialShares : WAD;
  const result = (((finalAssets * WAD) / finalShares) * WAD) / denominator;
  const time = 31_536_000 / (timeWindow.end - timeWindow.start);
  return ((Number(formatFixed(result, 18)) ** time - 1) * 100).toFixed(2);
};
