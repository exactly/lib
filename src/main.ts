import 'dotenv/config';
import request from 'graphql-request';
import { env } from 'process';
import rewardsAPR from './rewardsAPR';
import { Asset } from './types';

const {
  MARKET,
  SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-goerli',
} = env;

if (!MARKET) throw new Error('missing market');

console.log(MARKET);

const assets: Record<string, Asset> = {
  '0x1f32b1c2345538c0c6f582fcb022739c4a194ebb': { price: 1957000000000000000000n, decimals: 18 }, // wstETH
  '0x7f5c764cbc14f9669b88837ca1490cca17c31607': { price: 1000000000000000000n, decimals: 18 }, // USDC
  '0x4200000000000000000000000000000000000042': { price: 112000000000000000000n, decimals: 18 }, // OP
  '0x4200000000000000000000000000000000000006': { price: 1735000000000000000000n, decimals: 18 }, // WETH
};

// rewardsAPR(
//   Math.round(Date.now() / 1000),
//   SUBGRAPH_URL,
//   '0x22ab31cd55130435b5efbf9224b6a9d5ec36533f',
//   assetPricesOptimsim,
// ).then((r) => console.log({
//   market: '22ab',
//   deposit: `${((Number(r.deposit) / 1e18) * 100).toFixed(2)}%`,
//   borrow: `${((Number(r.borrow) / 1e18) * 100).toFixed(2)}%`,
// }));
// rewardsAPR(
//   Math.round(Date.now() / 1000),
//   SUBGRAPH_URL,
//   '0x81c9a7b55a4df39a9b7b5f781ec0e53539694873',
//   assetPricesOptimsim,
// ).then((r) => console.log({
//   market: '81c9',
//   deposit: `${((Number(r.deposit) / 1e18) * 100).toFixed(2)}%`,
//   borrow: `${((Number(r.borrow) / 1e18) * 100).toFixed(2)}%`,
// }));
// rewardsAPR(
//   Math.round(Date.now() / 1000),
//   SUBGRAPH_URL,
//   '0xa430a427bd00210506589906a71b54d6c256cedb',
//   assetPricesOptimsim,
// ).then((r) => console.log({
//   market: 'a430',
//   deposit: `${((Number(r.deposit) / 1e18) * 100).toFixed(2)}%`,
//   borrow: `${((Number(r.borrow) / 1e18) * 100).toFixed(2)}%`,
// }));
// rewardsAPR(
//   Math.round(Date.now() / 1000),
//   SUBGRAPH_URL,
//   '0xc4d4500326981eacd020e20a81b1c479c161c7ef',
//   assetPricesOptimsim,
// ).then((r) => console.log({
//   market: 'c4d4',
//   deposit: `${((Numberr.deposit) / 1e18) * 100).toFixed(2)}%`,
//   borrow: `${((Number(r.borrow) / 1e18) * 100).toFixed(2)}%`,
// }));

// const address = '0x3A0B303FF6B7250ddb659AdD318c8e74f3e8104d';

// accountRewardsAPR(address, SUBGRAPH_URL, assets).then((r) => console.log(r));

// interestEarnedByProtocol(SUBGRAPH_URL, MARKET).then((r) => console.log(r));

const x = async () => {
  const { markets } = await request(SUBGRAPH_URL, `
  {
    markets {
      id
      assetSymbol
    }
  }`);

  await Promise.all(
    markets.map(async ({ id: market, assetSymbol }: { id: string; assetSymbol: string }) => {
      const ra = await rewardsAPR(Math.round(Date.now() / 1000), SUBGRAPH_URL, market, assets);
      console.log('REWARDS');
      console.log({
        [assetSymbol]: {
          deposit: (Number(ra.deposit) / 1e18).toFixed(2),
          borrow: (Number(ra.borrow) / 1e18).toFixed(2),
        },
      });
    }),
  );
};
x();
