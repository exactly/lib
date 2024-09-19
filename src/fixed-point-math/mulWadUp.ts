import WAD from "./WAD.js";

export default function mulWadUp(a: bigint, b: bigint): bigint {
  const numerator = a * b;
  return numerator === 0n ? 0n : (numerator - 1n) / WAD + 1n;
}
