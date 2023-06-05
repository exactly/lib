import 'dotenv/config';
import { env } from 'process';
import netAccountApr from './netAccountApr';
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

const assetPrices: Record<string, number> = {
  '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f': 2129, // wstETH
  '0xa2025b15a1757311bfd68cb14eaefcc237af5b43': 1, // USDC
  '0x4200000000000000000000000000000000000042': 1.61, // OP
  '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6': 1900, // WETH
  '0x8869dfd060c682675c2a8ae5b21f2cf738a0e3ce': 27600, // WBTC
  '0xdf1742fe5b0bfc12331d8eaec6b478dfdbd31464': 1, // DAI
};

netAccountApr('0x9684d783363433C57767782C649954CE089976Ac', SUBGRAPH_URL, 3_600, assetPrices)
  .then((netAccountAprResult) => console.log({ netAccountAprResult }));
