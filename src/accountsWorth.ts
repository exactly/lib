import { WAD } from './FixedPointMathLib';
import { Account } from './fetchAccounts';
import { Asset } from './types';

export default (
  accounts: Account[],
  timestamp: number,
  assets: Record<string, Asset>,
) => (
  accounts.reduce(
    (total, account) => {
      const {
        borrowShares, depositShares, market: { decimals, asset }, fixedPositions,
      } = account;

      const fixedPosition = fixedPositions.reduce((
        fixedAcc,
        {
          principal, borrow, maturity,
        },
      ) => (
        maturity > timestamp ? fixedAcc + (borrow ? -1n : 1n) * principal : fixedAcc
      ), 0n);

      const { decimals: assetDecimals, price } = assets[asset];

      const weight = ((
        (((depositShares - borrowShares + fixedPosition) * WAD) / BigInt(10 ** decimals)))
        * ((price * WAD) / BigInt(10 ** assetDecimals)));

      return total + weight;
    },
    0n,
  ));
