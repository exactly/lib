export default function map2(a: readonly bigint[], b: readonly bigint[] | bigint, f: (a: bigint, b: bigint) => bigint) {
  if (Array.isArray(b)) {
    if (a.length !== b.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index]!)); // eslint-disable-line @typescript-eslint/no-non-null-assertion
  }
  return a.map((value) => f(value, b));
}

declare global {
  interface ArrayConstructor {
    isArray(argument: unknown): argument is unknown[] | readonly unknown[];
  }
}
