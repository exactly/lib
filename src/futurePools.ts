import INTERVAL from './INTERVAL';
import MAX_FUTURE_POOLS from './MAX_FUTURE_POOLS';

export default (start: number, n = MAX_FUTURE_POOLS, interval = INTERVAL) => [...new Array(n)]
  .map((_, i) => start - (start % interval) + interval * (i + 1));
