export default function abs(array: bigint[]) {
  return array.map((value) => (value < 0n ? -value : value));
}
