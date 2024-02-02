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
