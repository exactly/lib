import { decodeFunctionResult, encodeFunctionData } from "viem";
import { beforeEach, describe, expect, inject, it } from "vitest";

import { integrationPreviewerAbi, marketUsdcAbi, ratePreviewerAbi } from "./generated/contracts.js";
import anvilClient from "./utils/anvilClient.js";
import MAX_UINT256 from "../src/fixed-point-math/MAX_UINT256.js";
import divWad from "../src/fixed-point-math/divWad.js";
import { MATURITY_INTERVAL } from "../src/interest-rate-model/fixedRate.js";
import fixedRepayAssets, { type FixedRepaySnapshot } from "../src/market/fixedRepayAssets.js";
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
});
