export default function mulDivDown(array: bigint[], multiplier: bigint, denominator: bigint) {
  return array.map((value) => (value * multiplier) / denominator);
}
