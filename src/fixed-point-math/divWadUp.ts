import WAD from "./WAD.js";

export default function divWadUp(a: bigint, b: bigint): bigint {
  return a === 0n ? 0n : (a * WAD - 1n) / b + 1n;
}
