import fc from "fast-check";
import {
  BaseError,
  decodeErrorResult,
  decodeFunctionResult,
  encodeFunctionData,
  type Hex,
  type StateOverride,
  toHex,
} from "viem";
import { beforeEach, describe, expect, inject, it } from "vitest";

import {
  integrationPreviewerAbi,
  interestRateModelAbi,
  marketUsdcAbi,
  ratePreviewerAbi,
} from "./generated/contracts.js";
import anvilClient from "./utils/anvilClient.js";
import MAX_UINT256 from "../src/fixed-point-math/MAX_UINT256.js";
import divWad from "../src/fixed-point-math/divWad.js";
import mulWad from "../src/fixed-point-math/mulWad.js";
import { MATURITY_INTERVAL, WAD } from "../src/interest-rate-model/fixedRate.js";
import fixedBorrowAssets from "../src/market/fixedBorrowAssets.js";
import fixedBorrowPosition, { type FixedBorrowSnapshot } from "../src/market/fixedBorrowPosition.js";
import fixedRepayAssets, { type FixedRepaySnapshot } from "../src/market/fixedRepayAssets.js";
import fixedRepayPosition from "../src/market/fixedRepayPosition.js";
import floatingDepositRates from "../src/market/floatingDepositRates.js";

describe("floating deposit rate", () => {
  it("projects rate", async () => {
    const snapshot = await anvilClient.readContract({
      address: inject("RatePreviewer"),
      functionName: "snapshot",
      args: [],
      abi: ratePreviewerAbi,
    });
    const usdcSnapshot = snapshot.find(({ market }) => market === inject("MarketUSDC"));

    expect(usdcSnapshot).toBeDefined();

    if (!usdcSnapshot) return; // eslint-disable-line vitest/no-conditional-in-test -- already expected to be defined

    const elapsed = 69_420;
    const block = await anvilClient.getBlock();
    const { data = "0x" } = await anvilClient.call({
      to: inject("MarketUSDC"),
      data: encodeFunctionData({ functionName: "totalAssets", abi: marketUsdcAbi }),
      blockOverrides: { time: block.timestamp + BigInt(elapsed) },
    });
    const newTotalAssets = decodeFunctionResult({ data, functionName: "totalAssets", abi: marketUsdcAbi });

    const rates = floatingDepositRates(snapshot, Number(block.timestamp), elapsed);

    const usdcRate = rates.find(({ market }) => market === inject("MarketUSDC"))?.rate;

    expect(usdcRate).toBe(
      divWad(
        ((newTotalAssets - usdcSnapshot.totalAssets) * BigInt(365 * 86_400)) / BigInt(elapsed),
        usdcSnapshot.totalAssets,
      ),
    );
  });
});

describe("fixed repay", () => {
  let snapshot: FixedRepaySnapshot;

  beforeEach(async () => {
    snapshot = await anvilClient.readContract({
      address: inject("IntegrationPreviewer"),
      functionName: "fixedRepaySnapshot",
      args: [inject("deployer"), inject("MarketUSDC"), BigInt(MATURITY_INTERVAL)],
      abi: integrationPreviewerAbi,
    });
  });

  describe("assets", () => {
    it("calculates before maturity", async () => {
      const timestamp = 69_420;
      const positionAssets = 420_000_000n;

      const repayAssets = fixedRepayAssets(snapshot, MATURITY_INTERVAL, positionAssets, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), positionAssets, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });

      expect(repayAssets).toBe(decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi }));
    });

    it("calculates after maturity", async () => {
      const timestamp = 69_420 + MATURITY_INTERVAL;
      const positionAssets = 420_000_000n;

      const repayAssets = fixedRepayAssets(snapshot, MATURITY_INTERVAL, positionAssets, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), positionAssets, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });

      expect(repayAssets).toBe(decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi }));
    });

    it("calculates with max position before maturity", async () => {
      const timestamp = 69_420;

      const repayAssets = fixedRepayAssets(snapshot, MATURITY_INTERVAL, MAX_UINT256, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), MAX_UINT256, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });

      expect(repayAssets).toBe(decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi }));
    });

    it("calculates with max position after maturity", async () => {
      const timestamp = 69_420 + MATURITY_INTERVAL;

      const repayAssets = fixedRepayAssets(snapshot, MATURITY_INTERVAL, MAX_UINT256, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), MAX_UINT256, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });

      expect(repayAssets).toBe(decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi }));
    });

    it("calculates with empty position", () => {
      const timestamp = 69_420;

      const repayAssets = fixedRepayAssets(
        { ...snapshot, principal: 0n, fee: 0n },
        MATURITY_INTERVAL,
        MAX_UINT256,
        timestamp,
      );

      expect(repayAssets).toBe(0n);
    });
  });

  describe("position", () => {
    it("calculates before maturity", async () => {
      const timestamp = 69_420;
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(snapshot, MATURITY_INTERVAL, repayAssets, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), positionAssets, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });

      expect(repayAssets).toBe(decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi }));
    });

    it("calculates after maturity", async () => {
      const timestamp = 69_420 + MATURITY_INTERVAL;
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(snapshot, MATURITY_INTERVAL, repayAssets, timestamp);

      const { data = "0x" } = await anvilClient.call({
        account: inject("deployer"),
        to: inject("MarketUSDC"),
        data: encodeFunctionData({
          functionName: "repayAtMaturity",
          args: [BigInt(MATURITY_INTERVAL), positionAssets, MAX_UINT256, inject("deployer")],
          abi: marketUsdcAbi,
        }),
        blockOverrides: { time: BigInt(timestamp) },
      });
      const actualRepayAssets = decodeFunctionResult({ data, functionName: "repayAtMaturity", abi: marketUsdcAbi });

      expect(actualRepayAssets).toBeLessThanOrEqual(repayAssets);
      expect(repayAssets - actualRepayAssets).toBeLessThanOrEqual(1n);
    });

    it("calculates with max position", () => {
      const positionAssets = fixedRepayPosition(snapshot, MATURITY_INTERVAL, MAX_UINT256, 69_420);

      expect(positionAssets).toBe(snapshot.principal + snapshot.fee);
    });

    it("calculates with empty position", () => {
      const positionAssets = fixedRepayPosition(
        { ...snapshot, principal: 0n, fee: 0n },
        MATURITY_INTERVAL,
        MAX_UINT256,
        69_420,
      );

      expect(positionAssets).toBe(0n);
    });

    it("calculates without unassigned earnings", () => {
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(
        { ...snapshot, unassignedEarnings: 0n },
        MATURITY_INTERVAL,
        repayAssets,
        69_420,
      );

      expect(positionAssets).toBe(repayAssets);
    });

    it("calculates without backup supplied", () => {
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(
        { ...snapshot, supplied: snapshot.borrowed },
        MATURITY_INTERVAL,
        repayAssets,
        69_420,
      );

      expect(positionAssets).toBe(repayAssets);
    });

    it("calculates without principal", () => {
      const repayAssets = 69n;

      const positionAssets = fixedRepayPosition({ ...snapshot, principal: 0n }, MATURITY_INTERVAL, repayAssets, 69_420);

      expect(positionAssets).toBe(repayAssets);
    });

    it("calculates without net unassigned earnings", () => {
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(
        { ...snapshot, unassignedEarnings: 1n },
        MATURITY_INTERVAL,
        repayAssets,
        69_420,
      );

      expect(positionAssets).toBe(repayAssets);
    });

    it("calculates with high earnings proportion", () => {
      const timestamp = 69_420;
      const repayAssets = 420_000_000n;

      const positionAssets = fixedRepayPosition(
        { ...snapshot, supplied: snapshot.borrowed - 1n, lastAccrual: BigInt(timestamp) },
        MATURITY_INTERVAL,
        repayAssets,
        timestamp,
      );

      expect(positionAssets).toBe(repayAssets + mulWad(snapshot.unassignedEarnings, WAD - snapshot.backupFeeRate));
    });

    it("calculates with high saturated fallback", () => {
      const timestamp = 69_420;
      const repayAssets = 420_000_000n;
      const unassignedEarnings = 420n;

      const positionAssets = fixedRepayPosition(
        { ...snapshot, supplied: snapshot.borrowed - 420n, unassignedEarnings, lastAccrual: BigInt(timestamp) },
        MATURITY_INTERVAL,
        repayAssets,
        timestamp,
      );

      expect(positionAssets).toBe(repayAssets + mulWad(unassignedEarnings, WAD - snapshot.backupFeeRate));
    });
  });
});

describe("fixed borrow", () => {
  const timestamps = [69_420, MATURITY_INTERVAL + 69_420, 3 * MATURITY_INTERVAL - 69_420];

  describe("position", () => {
    it.each(timestamps)("matches market at %i", async (timestamp) => {
      expect.assertions(12);

      for (const maturity of maturities(timestamp)) {
        const snapshot = await borrowSnapshot(maturity);
        for (const assets of [1n, 1_000_000n, 50_000_000_000n, 100_000_000_000n]) {
          expect(fixedBorrowPosition(snapshot, maturity, assets, timestamp)).toBe(
            await borrow(maturity, assets, timestamp),
          );
        }
      }
    });

    it("throws without protocol liquidity", async () => {
      const timestamp = 69_420;
      const maturity = MATURITY_INTERVAL * 2;
      const snapshot = await borrowSnapshot(maturity);
      const available = fixedBorrowAssets(snapshot, maturity, MAX_UINT256, timestamp);

      expect(() => fixedBorrowPosition(snapshot, maturity, available + 1n, timestamp)).toThrow(
        "INSUFFICIENT_PROTOCOL_LIQUIDITY",
      );
      await expect(borrow(maturity, available + 1n, timestamp)).rejects.toThrow("InsufficientProtocolLiquidity");
      await expect(borrow(maturity, available, timestamp).catch(String)).resolves.not.toMatch(
        "InsufficientProtocolLiquidity",
      );
    });

    it("matches market when assets shrink below average", async () => {
      const timestamp = 69_420;
      const maturity = 2 * MATURITY_INTERVAL;
      const assets = 1_000_000_000n;
      const snapshot = await borrowSnapshot(maturity);
      const floatingAssetsAverage = snapshot.floatingAssets * 2n;

      expect(fixedBorrowPosition({ ...snapshot, floatingAssetsAverage }, maturity, assets, timestamp)).toBe(
        await borrow(maturity, assets, timestamp, [
          {
            address: inject("MarketUSDC"),
            stateDiff: [{ slot: toHex(222, { size: 32 }), value: toHex(floatingAssetsAverage, { size: 32 }) }],
          },
        ]),
      );
    });

    it("holds market at last update when timestamp lags", async () => {
      const timestamp = 69_420;
      const maturity = 2 * MATURITY_INTERVAL;
      const snapshot = await borrowSnapshot(maturity);
      const at = (update: number) => ({
        ...snapshot,
        lastAverageUpdate: update,
        lastFloatingDebtUpdate: update,
        lastAccrual: BigInt(update),
      });

      expect(fixedBorrowPosition(at(timestamp + 1000), maturity, 1_000_000_000n, timestamp)).toBe(
        fixedBorrowPosition(at(timestamp), maturity, 1_000_000_000n, timestamp),
      );
    });

    it("throws with zero assets", async () => {
      const snapshot = await borrowSnapshot(MATURITY_INTERVAL);

      expect(() => fixedBorrowPosition(snapshot, MATURITY_INTERVAL, 0n, 69_420)).toThrow("ZERO_BORROW");
      await expect(borrow(MATURITY_INTERVAL, 0n, 69_420)).rejects.toThrow("ZeroBorrow");
    });

    it("throws with unmatched pool", async () => {
      const snapshot = await borrowSnapshot(MATURITY_INTERVAL);

      expect(() => fixedBorrowPosition(snapshot, MATURITY_INTERVAL, 1n, MATURITY_INTERVAL)).toThrow(
        "UNMATCHED_POOL_STATE",
      );
      expect(() => fixedBorrowPosition(snapshot, 4 * MATURITY_INTERVAL, 1n, 69_420)).toThrow("UNMATCHED_POOL_STATE");
      expect(() => fixedBorrowPosition(snapshot, MATURITY_INTERVAL + 1, 1n, 69_420)).toThrow("UNMATCHED_POOL_STATE");
    });
  });

  describe("assets", () => {
    it.each(timestamps)("borrows the most that fits the position at %i", async (timestamp) => {
      expect.assertions(36);

      for (const maturity of maturities(timestamp)) {
        const snapshot = await borrowSnapshot(maturity);
        for (const position of [2n, 1_000_000n, 10_000_000_000n, 100_000_000_000n]) {
          const assets = fixedBorrowAssets(snapshot, maturity, position, timestamp);

          expect(assets).toBeGreaterThan(0n);
          await expect(borrow(maturity, assets, timestamp)).resolves.toBeLessThanOrEqual(position);
          await expect(borrow(maturity, assets + 1n, timestamp)).resolves.toBeGreaterThan(position);
        }
      }
    });

    it("inverts position", () => {
      expect.hasAssertions();

      const parameters = {
        minRate: 3.5e16,
        naturalRate: 8e16,
        maxUtilization: 1.3e18,
        naturalUtilization: 0.75e18,
        growthSpeed: 1.1e18,
        sigmoidSpeed: 2.5e18,
        spreadFactor: 0.2e18,
        maturitySpeed: 0.5e18,
        timePreference: 0.01e18,
        fixedAllocation: 0.6e18,
        maxRate: 15_000e16,
      } as const;
      fc.assert(
        fc.property(
          fc.bigInt(10n ** 6n, 10n ** 15n),
          fc.bigInt(0n, (WAD * 9n) / 10n),
          fc.bigInt(0n, WAD),
          fc.bigInt(0n, WAD),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: MATURITY_INTERVAL - 1 }),
          fc.bigInt(0n, 10n ** 15n),
          fc.bigInt(WAD / 2n, WAD * 2n),
          fc.bigInt(0n, WAD / 2n),
          fc.bigInt(0n, WAD),
          fc.bigInt(0n, 10n ** 12n),
          fc.integer({ min: 0, max: MATURITY_INTERVAL - 1 }),
          (
            floatingAssets,
            uGlobal,
            floatingShare,
            positionShare,
            pools,
            timestamp,
            supplied,
            average,
            reserveFactor,
            borrowedShare,
            unassignedEarnings,
            accrual,
          ) => {
            const used = mulWad(floatingAssets, uGlobal);
            const floatingDebt = mulWad(used, floatingShare);
            const snapshot: FixedBorrowSnapshot = {
              floatingAssets,
              floatingAssetsAverage: mulWad(floatingAssets, average),
              floatingDebt,
              floatingBackupBorrowed: used - floatingDebt,
              lastAverageUpdate: 0,
              lastFloatingDebtUpdate: 0,
              dampSpeedUp: 46n * 10n ** 13n,
              dampSpeedDown: 4n * 10n ** 17n,
              reserveFactor,
              maxFuturePools: 12,
              parameters: Object.fromEntries(
                Object.entries(parameters).map(([key, value]) => [key, BigInt(value)]),
              ) as Record<keyof typeof parameters, bigint>,
              borrowed: mulWad(supplied + used - floatingDebt, borrowedShare),
              supplied,
              unassignedEarnings,
              lastAccrual: BigInt(Math.min(accrual, timestamp)),
            };
            const maturity = pools * MATURITY_INTERVAL;
            const position = mulWad(floatingAssets, positionShare);
            const assets = fixedBorrowAssets(snapshot, maturity, position, timestamp);

            expect(previewPosition(snapshot, maturity, assets, timestamp)).toBeLessThanOrEqual(position);
            expect(previewPosition(snapshot, maturity, assets + 1n, timestamp)).toBeGreaterThan(position);
          },
        ),
      );
    });

    it("returns zero when the fee does not fit", async () => {
      const snapshot = await borrowSnapshot(MATURITY_INTERVAL);

      expect(fixedBorrowAssets(snapshot, MATURITY_INTERVAL, 0n, 69_420)).toBe(0n);
      expect(fixedBorrowAssets(snapshot, MATURITY_INTERVAL, 1n, 69_420)).toBe(0n);
    });
  });
});

function previewPosition(snapshot: FixedBorrowSnapshot, maturity: number, assets: bigint, timestamp: number) {
  try {
    return assets === 0n ? 0n : fixedBorrowPosition(snapshot, maturity, assets, timestamp);
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_PROTOCOL_LIQUIDITY") return MAX_UINT256;
    throw error;
  }
}

function maturities(timestamp: number) {
  const first = timestamp - (timestamp % MATURITY_INTERVAL) + MATURITY_INTERVAL;
  return [first, first + MATURITY_INTERVAL, first + 2 * MATURITY_INTERVAL];
}

async function borrowSnapshot(maturity: number): Promise<FixedBorrowSnapshot> {
  const market = { address: inject("MarketUSDC"), abi: marketUsdcAbi } as const;
  const [
    floatingAssets,
    floatingAssetsAverage,
    floatingDebt,
    floatingBackupBorrowed,
    lastAverageUpdate,
    lastFloatingDebtUpdate,
    dampSpeedUp,
    dampSpeedDown,
    reserveFactor,
    maxFuturePools,
    interestRateModel,
    [borrowed, supplied, unassignedEarnings, lastAccrual],
  ] = await Promise.all([
    anvilClient.readContract({ ...market, functionName: "floatingAssets" }),
    anvilClient.readContract({ ...market, functionName: "floatingAssetsAverage" }),
    anvilClient.readContract({ ...market, functionName: "floatingDebt" }),
    anvilClient.readContract({ ...market, functionName: "floatingBackupBorrowed" }),
    anvilClient.readContract({ ...market, functionName: "lastAverageUpdate" }),
    anvilClient.readContract({ ...market, functionName: "lastFloatingDebtUpdate" }),
    anvilClient.readContract({ ...market, functionName: "dampSpeedUp" }),
    anvilClient.readContract({ ...market, functionName: "dampSpeedDown" }),
    anvilClient.readContract({ ...market, functionName: "reserveFactor" }),
    anvilClient.readContract({ ...market, functionName: "maxFuturePools" }),
    anvilClient.readContract({ ...market, functionName: "interestRateModel" }),
    anvilClient.readContract({ ...market, functionName: "fixedPools", args: [BigInt(maturity)] }),
  ]);
  const parameters = await anvilClient.readContract({
    address: interestRateModel,
    abi: interestRateModelAbi,
    functionName: "parameters",
  });
  return {
    floatingAssets,
    floatingAssetsAverage,
    floatingDebt,
    floatingBackupBorrowed,
    lastAverageUpdate,
    lastFloatingDebtUpdate,
    dampSpeedUp,
    dampSpeedDown,
    reserveFactor,
    maxFuturePools,
    parameters,
    borrowed,
    supplied,
    unassignedEarnings,
    lastAccrual,
  };
}

async function borrow(maturity: number, assets: bigint, timestamp: number, stateOverride?: StateOverride) {
  const { data = "0x" } = await anvilClient
    .call({
      account: inject("deployer"),
      to: inject("MarketUSDC"),
      data: encodeFunctionData({
        functionName: "borrowAtMaturity",
        args: [BigInt(maturity), assets, MAX_UINT256, inject("deployer"), inject("deployer")],
        abi: marketUsdcAbi,
      }),
      blockOverrides: { time: BigInt(timestamp) },
      stateOverride,
    })
    .catch((error: unknown) => {
      const revert =
        error instanceof BaseError
          ? error.walk((cause) => typeof (cause as { data?: unknown }).data === "string")
          : undefined;
      if (!revert) throw error;
      throw new Error(
        decodeErrorResult({ abi: marketUsdcAbi, data: (revert as unknown as { data: Hex }).data }).errorName,
      );
    });
  return decodeFunctionResult({ data, functionName: "borrowAtMaturity", abi: marketUsdcAbi });
}
