import WAD from "../fixed-point-math/WAD.js";

export default function globalUtilization(assets: bigint, debt: bigint, backupBorrowed: bigint) {
  return assets !== 0n && debt + backupBorrowed !== 0n ? ((debt + backupBorrowed) * WAD - 1n) / assets + 1n : 0n;
}
