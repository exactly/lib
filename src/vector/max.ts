export default function max(array: readonly bigint[]) {
  return array.reduce((maxValue, value) => (value > maxValue ? value : maxValue)); // eslint-disable-line unicorn/no-array-reduce
}
