export default function mulDivUp(array: bigint[], multiplier: bigint, denominator: bigint) {
  return array.map((value) => (value * multiplier - 1n) / denominator + 1n); // round up
}
