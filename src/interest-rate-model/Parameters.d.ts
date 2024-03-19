export default interface IRMParameters {
  minRate: bigint;
  naturalRate: bigint;
  maxUtilization: bigint;
  naturalUtilization: bigint;
  growthSpeed: bigint;
  sigmoidSpeed: bigint;
  spreadFactor: bigint;
  maturitySpeed: bigint;
  timePreference: bigint;
  fixedAllocation: bigint;
  maxRate: bigint;
}

export type IRMBaseParameters = Prettify<
  Pick<IRMParameters, "maxUtilization" | "naturalUtilization" | "sigmoidSpeed" | "growthSpeed"> &
    (
      | (Pick<IRMParameters, "minRate" | "naturalRate"> & { curveA?: undefined; curveB?: undefined })
      | { curveA: bigint; curveB: bigint }
    )
>;

export type IRMFloatingParameters = Prettify<IRMBaseParameters & Pick<IRMParameters, "maxRate">>;

type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {}; // eslint-disable-line @typescript-eslint/ban-types
