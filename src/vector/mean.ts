import sum from "./sum.js";

export default function mean(array: bigint[]) {
  return sum(array) / BigInt(array.length);
}
