export default function mulDivUp(a: bigint, b: bigint, c: bigint): bigint {
  const numerator = a * b;
  return numerator === 0n ? 0n : (numerator - 1n) / c + 1n;
}
