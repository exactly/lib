import { decodeFunctionResult, encodeFunctionData } from "viem";
import { beforeEach, describe, expect, inject, it } from "vitest";

import { integrationPreviewerAbi, marketUsdcAbi, ratePreviewerAbi } from "./generated/contracts.js";
import anvilClient from "./utils/anvilClient.js";
import MAX_UINT256 from "../src/fixed-point-math/MAX_UINT256.js";
import divWad from "../src/fixed-point-math/divWad.js";
import mulWad from "../src/fixed-point-math/mulWad.js";
import { MATURITY_INTERVAL, WAD } from "../src/interest-rate-model/fixedRate.js";
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
