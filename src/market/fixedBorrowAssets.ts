import { fixedBorrowFactor, fixedBorrowMarket, type FixedBorrowSnapshot } from "./fixedBorrowPosition.js";
import WAD from "../fixed-point-math/WAD.js";
import max from "../fixed-point-math/max.js";
import min from "../fixed-point-math/min.js";

export default function fixedBorrowAssets(
  snapshot: FixedBorrowSnapshot,
  maturity: number,
  position: bigint,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const market = fixedBorrowMarket(snapshot, maturity, timestamp);
  const target = position * WAD;
  const excess = (assets: bigint) => assets * (WAD + fixedBorrowFactor(market, assets)) - target;
  let upper = min(position, market.available);
  let upperExcess = excess(upper);
  if (upperExcess <= 0n) return upper;
  let lower = 0n;
  let lowerExcess = -target;
  let side = 0;
  while (upper - lower > 1n) {
    const assets = min(
      max(lower + (-lowerExcess * (upper - lower)) / (upperExcess - lowerExcess), lower + 1n),
      upper - 1n,
    );
    const assetsExcess = excess(assets);
    if (assetsExcess <= 0n) {
      lower = assets;
      lowerExcess = assetsExcess;
      if (side === -1) upperExcess /= 2n;
      side = -1;
    } else {
      upper = assets;
      upperExcess = assetsExcess;
      if (side === 1) lowerExcess /= 2n;
      side = 1;
    }
  }
  return lower;
}
