import type IRMParameters from "./Parameters.d.ts";
import baseRate from "./baseRate.js";

export default function floatingRate(uFloating: bigint, uGlobal: bigint, parameters: IRMParameters) {
  const { maxRate } = parameters;
  const base = baseRate(uFloating, uGlobal, parameters);
  return base > maxRate ? maxRate : base;
}

export { default as WAD } from "../fixed-point-math/WAD.js";
export type { default as IRMParameters } from "./Parameters.d.ts";
