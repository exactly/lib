import map2 from "./map2.js";

export default function mul(a: readonly bigint[], b: readonly bigint[] | bigint) {
  return map2(a, b, (a_, b_) => a_ * b_);
}
