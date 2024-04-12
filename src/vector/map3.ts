export default function map3(
  a: readonly bigint[],
  b: readonly bigint[] | bigint,
  c: readonly bigint[] | bigint,
  f: (a: bigint, b: bigint, c: bigint) => bigint,
) {
  if (Array.isArray(b) && Array.isArray(c)) {
    if (a.length !== b.length || a.length !== c.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index] as bigint, c[index] as bigint));
  } else if (Array.isArray(b)) {
    if (a.length !== b.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index] as bigint, c as bigint));
  } else if (Array.isArray(c)) {
    if (a.length !== c.length) throw new Error("different length");
    return a.map((value, index) => f(value, b, c[index] as bigint));
  }
  return a.map((value) => f(value, b, c));
}

declare global {
  interface ArrayConstructor {
    isArray(argument: unknown): argument is unknown[] | readonly unknown[];
  }
}
