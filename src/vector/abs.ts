export default function abs(array: readonly bigint[]) {
  return array.map((value) => (value < 0n ? -value : value));
}
