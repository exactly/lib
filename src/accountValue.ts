import { WAD } from './FixedPointMathLib';
import { Account } from './fetchAccounts';

export default (
  accounts: Account[],
  timestamp: number,
  assetPrices: Record<string, number>,
) => (
  accounts.reduce(
    (acc, account) => {
      const {
        borrowShares, depositShares, market: { decimals, asset }, fixedPositions,
      } = account;

      const fixedShares = fixedPositions.reduce((
        fixedAcc,
        {
          principal, borrow, maturity,
        },
      ) => (
        maturity > timestamp ? fixedAcc + (borrow ? -1n : 1n) * principal : fixedAcc
      ), 0n);

      const weight = (((depositShares - borrowShares + fixedShares
      ) * WAD) / BigInt(10 ** decimals))
        * BigInt(assetPrices[asset]);

      return acc + weight;
    },
    0n,
  ));
