export default function fill(length: number, value = 0n) {
  return Array.from<bigint>({ length }).fill(value);
}
