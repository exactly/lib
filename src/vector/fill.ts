import WAD from "../fixed-point-math/WAD.js";

export default function fill(length: number, value = WAD) {
  return Array.from<bigint>({ length }).fill(value);
}
