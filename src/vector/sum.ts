export default function sum(array: bigint[]) {
  return array.reduce((accumulator, value) => accumulator + value);
}
