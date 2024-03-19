export default function min(array: readonly bigint[]) {
  return array.reduce((minValue, value) => (value < minValue ? value : minValue)); // eslint-disable-line unicorn/no-array-reduce
}
