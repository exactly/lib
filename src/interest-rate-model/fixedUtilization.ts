import WAD from "../fixed-point-math/WAD.js";

export default function fixedUtilization(supplied: bigint, borrowed: bigint, assets: bigint) {
  return assets !== 0n && borrowed > supplied ? ((borrowed - supplied) * WAD - 1n) / assets + 1n : 0n;
}
