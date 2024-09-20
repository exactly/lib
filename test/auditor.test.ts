import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import accountLiquidity from "../src/auditor/accountLiquidity.js";
import healthFactor from "../src/auditor/healthFactor.js";
import withdrawLimit from "../src/auditor/withdrawLimit.js";
import divWad from "../src/fixed-point-math/divWad.js";
import divWadUp from "../src/fixed-point-math/divWadUp.js";
import min from "../src/fixed-point-math/min.js";
import mulDiv from "../src/fixed-point-math/mulDiv.js";
import mulWad from "../src/fixed-point-math/mulWad.js";
import { INTERVAL } from "../src/interest-rate-model/fixedRate.js";

describe("auditor", () => {
  it("account liquidity", () => {
    const { collateral, debt } = exactlyAccountLiquidity();
    const { adjCollateral, adjDebt } = accountLiquidity(exactly, 0);

    expect(adjCollateral).toBe(collateral);
    expect(adjDebt).toBe(debt);
  });

  it("health factor", () => {
    const { collateral, debt } = exactlyAccountLiquidity();

    expect(healthFactor(exactly, 0)).toBe(divWad(collateral, debt));
  });

  it("withdraw limit", () => {
    const { collateral, debt } = exactlyAccountLiquidity();
    const limit = min(collateral - debt, collateral);
    const normalizedLimit = mulDiv(
      divWad(limit, exactly.marketsData[0].adjustFactor),
      10n ** BigInt(exactly.marketsData[0].decimals),
      exactly.marketsData[0].usdPrice,
    );

    expect(normalizedLimit).toBe(withdrawLimit(exactly, exactly.marketsData[0].market, 0));
  });
});

function exactlyAccountLiquidity(): { collateral: bigint; debt: bigint } {
  const usdcBaseUnit = 10n ** 6n;
  return {
    collateral:
      mulDiv(parseUnits("10000", 6), parseUnits("0.91", 18), usdcBaseUnit) +
      mulDiv(mulWad(parseUnits("1", 18), parseUnits("2500", 18)), parseUnits("0.86", 18), 10n ** 18n),
    debt:
      divWadUp(parseUnits("2000", 18), parseUnits("0.91", 18)) +
      divWadUp(parseUnits("5000", 18), parseUnits("0.86", 18)),
  };
}

const exactly = {
  marketsData: [
    {
      market: "0x6926B434CCe9b5b7966aE1BfEef6D0A7DCF3A8bb",
      decimals: 6,
      usdPrice: parseUnits("1", 18),
      adjustFactor: parseUnits("0.91", 18),
      isCollateral: true,
      floatingBorrowAssets: parseUnits("1000", 6),
      floatingDepositAssets: parseUnits("10000", 6),
      fixedBorrowPositions: [{ principal: parseUnits("990", 6), fee: parseUnits("10", 6), maturity: INTERVAL }],
      penaltyRate: parseUnits("0.000000052083333333", 18),
    },
    {
      market: "0xc4d4500326981eacD020e20A81b1c479c161c7EF",
      decimals: 18,
      usdPrice: parseUnits("2500", 18),
      adjustFactor: parseUnits("0.86", 18),
      isCollateral: true,
      floatingBorrowAssets: parseUnits("1", 18),
      floatingDepositAssets: parseUnits("1", 18),
      fixedBorrowPositions: [{ principal: parseUnits("0.9", 18), fee: parseUnits("0.1", 18), maturity: INTERVAL }],
      penaltyRate: parseUnits("0.000000052083333333", 18),
    },
  ],
} as const;
