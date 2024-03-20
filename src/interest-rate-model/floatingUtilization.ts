import WAD from "../fixed-point-math/WAD.js";

export default function floatingUtilization(assets: bigint, debt: bigint) {
  return assets !== 0n && debt !== 0n ? (debt * WAD - 1n) / assets + 1n : 0n;
}
