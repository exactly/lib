import accountsWorth from './accountsWorth';
import fetchAccounts from './fetchAccounts';

export default async (
  address: string,
  timestamp: number,
  assetPirces: Record<string, number>,
  subgraph: string,
) => {
  const accounts = await fetchAccounts(subgraph, address);
  const worth = accountsWorth(accounts, timestamp, assetPirces);
  const rewards = 0n;

  return worth + rewards;
};
