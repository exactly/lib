import 'dotenv/config';
import { env } from 'process';
import getFloatingDepositAPY from './getFloatingDepositAPY';

getFloatingDepositAPY(env.MARKET).then(console.log);
