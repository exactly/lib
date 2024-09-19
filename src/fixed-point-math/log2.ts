export default function log2(x: bigint) {
  /* eslint-disable unicorn/numeric-separators-style */
  if (x <= 0n) throw new Error("UNDEFINED");

  let r = BigInt(x > 0xffffffffffffffffffffffffffffffffn) << 7n;
  r |= BigInt(x >> r > 0xffffffffffffffffn) << 6n;
  r |= BigInt(x >> r > 0xffffffffn) << 5n;
  r |= BigInt(x >> r > 0xffffn) << 4n;
  r |= BigInt(x >> r > 0xffn) << 3n;
  r |= BigInt(x >> r > 0xfn) << 2n;
  r |= BigInt(x >> r > 0x3n) << 1n;
  r |= BigInt(x >> r > 0x1n);

  return r;
  /* eslint-enable unicorn/numeric-separators-style */
}
