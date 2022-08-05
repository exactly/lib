import { env } from 'process';

export default env.SUBGRAPH_URL ?? 'https://api.thegraph.com/subgraphs/name/exactly-protocol/exactly-rinkeby';
