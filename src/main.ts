import 'dotenv/config';
import { env } from 'process';
import queryRates from './queryRates';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-goerli',
} = env;

if (!MARKET) throw new Error('missing market');

Promise.all([
  queryRates(SUBGRAPH_URL, MARKET, 'deposit', { maxFuturePools: 3 }),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow'),

  queryRates(SUBGRAPH_URL, MARKET, 'deposit', {
    maxFuturePools: 3, interval: 24 * 3_600, count: 32, roundTicks: true,
  }),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow', { count: 24, roundTicks: true }),
]).then(console.log);
