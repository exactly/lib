import WAD from "./WAD.js";

export default function divWad(a: bigint, b: bigint): bigint {
  return (a * WAD) / b;
}
