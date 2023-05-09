import 'dotenv/config';
import { env } from 'process';
import queryRates from './queryRates';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-goerli',
} = env;

if (!MARKET) throw new Error('missing market');

console.log(MARKET);

Promise.all([
  queryRates(SUBGRAPH_URL, MARKET, 'deposit'),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow'),
  queryRates(SUBGRAPH_URL, MARKET, 'deposit', {
    interval: 24 * 3_600, count: 32, roundTicks: true,
  }),
  queryRates(SUBGRAPH_URL, MARKET, 'borrow', { count: 24, roundTicks: true }),
]).then((results) => results.forEach((result) => console.dir(result, { depth: null })));
