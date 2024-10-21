declare function accountLiquidity(data: AccountLiquidityData, timestamp?: number): {
    adjCollateral: bigint;
    adjDebt: bigint;
};
type AccountLiquidityData = readonly {
    market: string;
    decimals: number;
    usdPrice: bigint;
    adjustFactor: bigint;
    isCollateral: boolean;
    floatingBorrowAssets: bigint;
    floatingDepositAssets: bigint;
    fixedBorrowPositions: readonly {
        maturity: bigint;
        position: {
            principal: bigint;
            fee: bigint;
        };
    }[];
    penaltyRate: bigint;
}[];

declare function borrowLimit(data: AccountLiquidityData, market: string, targetHealthFactor?: bigint, timestamp?: number): bigint;

declare function healthFactor(data: AccountLiquidityData, timestamp?: number): bigint;

declare function withdrawLimit(data: AccountLiquidityData, market: string, targetHealthFactor?: bigint, timestamp?: number): bigint;

declare function divWad(a: bigint, b: bigint): bigint;

declare function divWadUp(a: bigint, b: bigint): bigint;

declare function expWad(x: bigint): bigint;

declare function lnWad(x: bigint): bigint;

declare function log2(x: bigint): bigint;

declare const _default: bigint;

declare function max$1(a: bigint, b: bigint): bigint;

declare function min$1(a: bigint, b: bigint): bigint;

declare function mulDiv$1(a: bigint, b: bigint, c: bigint): bigint;

declare function mulDivUp$1(a: bigint, b: bigint, c: bigint): bigint;

declare function mulWad(a: bigint, b: bigint): bigint;

declare function mulWadUp(a: bigint, b: bigint): bigint;

declare function sqrt(x: bigint): bigint;

declare const WAD = 1000000000000000000n;

interface IRMParameters {
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
type IRMBaseParameters = Prettify<Pick<IRMParameters, "maxUtilization" | "naturalUtilization" | "sigmoidSpeed" | "growthSpeed"> & ((Pick<IRMParameters, "minRate" | "naturalRate"> & {
    curveA?: undefined;
    curveB?: undefined;
}) | {
    curveA: bigint;
    curveB: bigint;
})>;
type IRMFloatingParameters = Prettify<IRMBaseParameters & Pick<IRMParameters, "maxRate">>;
type Prettify<T> = {
    [K in keyof T]: Prettify<T[K]>;
} & {};

declare const MATURITY_INTERVAL: number;
declare function fixedRate(maturity: number, maxPools: number, uFixed: bigint, uFloating: bigint, uGlobal: bigint, parameters: IRMParameters, timestamp?: number, base?: bigint, z?: bigint): bigint;

declare function splitInstallments(totalAmount: bigint, totalAssets: bigint, firstMaturity: number, maxPools: number, uFixed: readonly bigint[], uFloating: bigint, uGlobal: bigint, parameters: IRMParameters, timestamp?: number, { power, scaleFactor, tolerance, maxIterations }?: {
    power?: bigint | undefined;
    scaleFactor?: bigint | undefined;
    tolerance?: bigint | undefined;
    maxIterations?: bigint | undefined;
}): {
    amounts: bigint[];
    installments: bigint[];
    rates: bigint[];
    effectiveRate: bigint;
};

declare function baseRate(uFloating: bigint, uGlobal: bigint, { maxUtilization, naturalUtilization, sigmoidSpeed, growthSpeed, ...p }: IRMBaseParameters): bigint;

declare function fixedRates(firstMaturity: number, maxPools: number, uFixed: readonly bigint[], uFloating: bigint, uGlobal: bigint, parameters: IRMParameters, timestamp?: number): void[];

declare function fixedUtilization(supplied: bigint, borrowed: bigint, assets: bigint): bigint;

declare function floatingRate(uFloating: bigint, uGlobal: bigint, parameters: IRMFloatingParameters): bigint;

declare function floatingUtilization(assets: bigint, debt: bigint): bigint;

declare function globalUtilization(assets: bigint, debt: bigint, backupBorrowed: bigint): bigint;

declare function floatingDepositRates(snapshots: readonly MarketSnapshot[], timestamp?: number, elapsed?: number): {
    market: string;
    rate: bigint;
}[];
interface MarketSnapshot {
    market: string;
    floatingDebt: bigint;
    floatingBackupBorrowed: bigint;
    pools: readonly FixedPool[];
    floatingAssets: bigint;
    treasuryFeeRate: bigint;
    earningsAccumulator: bigint;
    earningsAccumulatorSmoothFactor: bigint;
    lastFloatingDebtUpdate: number;
    lastAccumulatorAccrual: number;
    maxFuturePools: number;
    interval: bigint;
    totalAssets: bigint;
    floatingRate: bigint;
}
interface FixedPool {
    maturity: bigint;
    lastAccrual: bigint;
    unassignedEarnings: bigint;
}

declare function abs(array: readonly bigint[]): bigint[];

declare function add(a: readonly bigint[], b: readonly bigint[] | bigint): bigint[];

declare function fill(length: number, value?: bigint): bigint[];

declare function map2(a: readonly bigint[], b: readonly bigint[] | bigint, f: (a: bigint, b: bigint) => bigint): bigint[];
declare global {
    interface ArrayConstructor {
        isArray(argument: unknown): argument is unknown[] | readonly unknown[];
    }
}

declare function map3(a: readonly bigint[], b: readonly bigint[] | bigint, c: readonly bigint[] | bigint, f: (a: bigint, b: bigint, c: bigint) => bigint): bigint[];
declare global {
    interface ArrayConstructor {
        isArray(argument: unknown): argument is unknown[] | readonly unknown[];
    }
}

declare function max(array: readonly bigint[]): bigint;

declare function mean(array: readonly bigint[]): bigint;

declare function min(array: readonly bigint[]): bigint;

declare function mul(a: readonly bigint[], b: readonly bigint[] | bigint): bigint[];

declare function mulDiv(a: readonly bigint[], b: readonly bigint[] | bigint, c: readonly bigint[] | bigint): bigint[];

declare function mulDivUp(a: readonly bigint[], b: readonly bigint[] | bigint, c: readonly bigint[] | bigint): bigint[];

declare function powDiv(a: readonly bigint[], b: readonly bigint[] | bigint, c: readonly bigint[] | bigint): bigint[];

declare function sub(a: readonly bigint[], b: readonly bigint[] | bigint): bigint[];

declare function sum(array: readonly bigint[]): bigint;

export { type IRMFloatingParameters, type IRMParameters, MATURITY_INTERVAL, _default as MAX_UINT256, WAD, abs, accountLiquidity, add, baseRate, borrowLimit, divWad, divWadUp, expWad, fill, fixedRate, fixedRates, fixedUtilization, floatingDepositRates, floatingRate, floatingUtilization, globalUtilization, healthFactor, lnWad, log2, map2, map3, max$1 as max, max as maxV, mean, min$1 as min, min as minV, mul, mulDiv$1 as mulDiv, mulDivUp$1 as mulDivUp, mulDivUp as mulDivUpV, mulDiv as mulDivV, mulWad, mulWadUp, powDiv, splitInstallments, sqrt, sub, sum, withdrawLimit };
