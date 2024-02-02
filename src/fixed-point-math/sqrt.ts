export default function sqrt(x: bigint): bigint {
  /* eslint-disable unicorn/numeric-separators-style */
  if (x === 0n) return 0n;

  let y = x;
  let z = 181n;

  if (y >= 0x10000000000000000000000000000000000n) {
    y >>= 128n;
    z <<= 64n;
  }
  if (y >= 0x1000000000000000000n) {
    y >>= 64n;
    z <<= 32n;
  }
  if (y >= 0x10000000000n) {
    y >>= 32n;
    z <<= 16n;
  }
  if (y >= 0x1000000n) {
    y >>= 16n;
    z <<= 8n;
  }

  z = (z * (y + 65536n)) >> 18n;

  for (let index = 0; index < 7; ++index) z = (z + x / z) >> 1n;

  if (x / z < z) z--;

  return z;
  /* eslint-enable unicorn/numeric-separators-style */
}
