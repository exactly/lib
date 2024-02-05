export default function sub(a: bigint[], b: bigint[] | bigint) {
  if (Array.isArray(b)) {
    if (a.length !== b.length) throw new Error("different length");
    return a.map((value, index) => value - (b[index] as bigint));
  }
  return a.map((value) => value - b);
}
