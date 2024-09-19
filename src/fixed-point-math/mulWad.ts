import WAD from "./WAD.js";

export default function mulWad(a: bigint, b: bigint): bigint {
  return (a * b) / WAD;
}
