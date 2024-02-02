export default function log2(x: bigint) {
  /* eslint-disable unicorn/numeric-separators-style */
  if (x <= 0n) throw new Error("UNDEFINED");

  let r = BigInt(0xffffffffffffffffffffffffffffffffn < x) << 7n;
  r |= BigInt(0xffffffffffffffffn < x >> r) << 6n;
  r |= BigInt(0xffffffffn < x >> r) << 5n;
  r |= BigInt(0xffffn < x >> r) << 4n;
  r |= BigInt(0xffn < x >> r) << 3n;
  r |= BigInt(0xfn < x >> r) << 2n;
  r |= BigInt(0x3n < x >> r) << 1n;
  r |= BigInt(0x1n < x >> r);

  return r;
  /* eslint-enable unicorn/numeric-separators-style */
}
