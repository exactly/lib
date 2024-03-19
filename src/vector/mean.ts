import sum from "./sum.js";

export default function mean(array: readonly bigint[]) {
  return sum(array) / BigInt(array.length);
}
