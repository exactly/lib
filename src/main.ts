import 'dotenv/config';
import { env } from 'process';
import getFloatingBorrowAPY from './getFloatingBorrowAPY';
import getFloatingDepositAPY from './getFloatingDepositAPY';

Promise.all([
  getFloatingDepositAPY(env.MARKET),
  getFloatingBorrowAPY(env.MARKET),
]).then(console.log);
