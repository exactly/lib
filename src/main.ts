import 'dotenv/config';
import fetch from 'cross-fetch';
import {
  ApolloClient, HttpLink, InMemoryCache, gql as gqld,
} from '@apollo/client/core';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly-rinkeby',
} = process.env;
const WAD = 10n ** 18n;
const INTERVAL = 86_400 * 7 * 4;
const MAX_FUTURE_POOLS = 3;

const now = () => Math.floor(Date.now() / 1_000);

const futurePools = (start = now(), n = MAX_FUTURE_POOLS, interval = INTERVAL) => [...new Array(n)]
  .map((_, i) => start - (start % interval) + interval * (i + 1));

const start = now() - 86_400 * 7;

new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URL, fetch }),
  cache: new InMemoryCache(),
  defaultOptions: { query: { fetchPolicy: 'no-cache' } },
}).query({
  variables: { market: MARKET, start },
  query: gqld`
    query GetAPY(
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
        smartPoolShares
        smartPoolAssets
        smartPoolEarningsAccumulator
      }

      final: marketUpdateds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        timestamp
        smartPoolShares
        smartPoolAssets
        smartPoolEarningsAccumulator
      }

      initialAccumulatedEarningsAccrual: marketUpdateds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, maturity: 0, timestamp_lte: $start }
      ) {
        timestamp
      }

      finalAccumulatedEarningsAccrual: marketUpdateds(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market, maturity: 0 }
      ) {
        timestamp
      }

      accumulatedEarningsSmoothFactor: accumulatedEarningsSmoothFactorSets(
        first: 1
        orderBy: timestamp
        orderDirection: desc
        where: { market: $market }
      ) {
        accumulatedEarningsSmoothFactor
      }

      ${futurePools(start).map((maturity) => `
        initial${maturity}: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity}, timestamp_lte: $start }
        ) {
          timestamp
          maturity
          maturityUnassignedEarnings
        }
      `).join('')}

      ${futurePools().map((maturity) => `
        final${maturity}: marketUpdateds(
          first: 1
          orderBy: timestamp
          orderDirection: desc
          where: { market: $market, maturity: ${maturity} }
        ) {
          timestamp
          maturity
          maturityUnassignedEarnings
        }
      `).join('')}
    }`,
}).then(({
  data: {
    initial: [initial = {
      timestamp: 0, smartPoolShares: '0', smartPoolAssets: '0', smartPoolEarningsAccumulator: '0',
    }],
    final: [final = {
      timestamp: 0, smartPoolShares: '0', smartPoolAssets: '0', smartPoolEarningsAccumulator: '0',
    }],
    initialAccumulatedEarningsAccrual: [initialAccumulatedEarningsAccrual = { timestamp: 0 }],
    finalAccumulatedEarningsAccrual: [finalAccumulatedEarningsAccrual = { timestamp: 0 }],
    accumulatedEarningsSmoothFactor: [accumulatedEarningsSmoothFactor],
    ...allMaturities
  },
}) => {
  const fixedPools = (prefix: string) => Object.entries(allMaturities)
    .filter(([key, res]: [string, [any]]) => res.length && key.startsWith(prefix))
    .map(([, [fixedPool]]: [string, [any]]) => fixedPool);

  const totalAssets = (
    marketState: {
      timestamp: number
      smartPoolAssets: string
      smartPoolEarningsAccumulator: string
    },
    accumulatedEarningsAccrual: { timestamp: number },
    maturities: { timestamp: number, maturity: number, maturityUnassignedEarnings: string }[],
  ) => {
    const elapsed = BigInt(marketState.timestamp - accumulatedEarningsAccrual.timestamp);

    return BigInt(marketState.smartPoolAssets)
      + maturities.reduce((smartPoolEarnings, fixedPool) => {
        const { timestamp: lastAccrual, maturity, maturityUnassignedEarnings } = fixedPool;
        return smartPoolEarnings + (maturity > lastAccrual
          ? (BigInt(maturityUnassignedEarnings)
            * BigInt(marketState.timestamp - lastAccrual)) / BigInt(maturity - lastAccrual)
          : 0n);
      }, 0n)
      + (elapsed
        && ((BigInt(marketState.smartPoolEarningsAccumulator) * elapsed)
          / (elapsed
            + ((BigInt(accumulatedEarningsSmoothFactor.accumulatedEarningsSmoothFactor)
              * BigInt(MAX_FUTURE_POOLS * INTERVAL)) / WAD))));
  };

  const initialShares = BigInt(initial.smartPoolShares);
  const initialAssets = totalAssets(initial, initialAccumulatedEarningsAccrual, fixedPools('initial'));

  const finalShares = BigInt(final.smartPoolShares);
  const finalAssets = totalAssets(final, finalAccumulatedEarningsAccrual, fixedPools('final'));

  console.log((((finalAssets * WAD) / finalShares) * WAD)
    / (initialShares ? ((initialAssets * WAD) / initialShares) : WAD));
});
