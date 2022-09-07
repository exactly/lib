import 'dotenv/config';
import { env } from 'process';
import queryRates from './queryRates';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-rinkeby',
} = env;

Promise.all([
  queryRates(SUBGRAPH_URL, MARKET, 'deposit', { maxFuturePools: 3 }),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow'),

  queryRates(SUBGRAPH_URL, MARKET, 'deposit', {
    maxFuturePools: 3, interval: 24 * 3_600, count: 25, roundTicks: true,
  }),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow', { interval: 24 * 3_600, count: 20, roundTicks: true }),
]).then(console.log);
