import map3 from "./map3.js";

export default function mulDivUp(a: readonly bigint[], b: readonly bigint[] | bigint, c: readonly bigint[] | bigint) {
  return map3(a, b, c, (a_, b_, c_) => (a_ * b_ - 1n) / c_ + 1n);
}
