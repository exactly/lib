import 'dotenv/config';
import { env } from 'process';
import getFloatingBorrowAPY from './getFloatingBorrowAPY';
import getFloatingDepositAPY from './getFloatingDepositAPY';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-rinkeby',
} = env;

Promise.all([
  getFloatingDepositAPY(MARKET, SUBGRAPH_URL),
  getFloatingBorrowAPY(MARKET, SUBGRAPH_URL),
]).then(console.log);
