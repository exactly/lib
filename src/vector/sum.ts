export default function sum(array: readonly bigint[]) {
  return array.reduce((accumulator, value) => accumulator + value);
}
