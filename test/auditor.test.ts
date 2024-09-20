import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import healthFactor from "../src/auditor/healthFactor.js";
import divWad from "../src/fixed-point-math/divWad.js";
import divWadUp from "../src/fixed-point-math/divWadUp.js";
import mulDiv from "../src/fixed-point-math/mulDiv.js";
import { INTERVAL } from "../src/interest-rate-model/fixedRate.js";

describe("auditor", () => {
  it("health factor", () => {
    const usdcBaseUnit = 10n ** 6n;
    const adjCollateral = mulDiv(parseUnits("10000", 6), parseUnits("0.91", 18), usdcBaseUnit);
    const adjDebt =
      divWadUp(parseUnits("2000", 18), parseUnits("0.91", 18)) +
      divWadUp(parseUnits("5000", 18), parseUnits("0.86", 18));

    expect(healthFactor(exactly, 0)).toBe(divWad(adjCollateral, adjDebt));
  });
});

const exactly = [
  {
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
    decimals: 18,
    usdPrice: parseUnits("2500", 18),
    adjustFactor: parseUnits("0.86", 18),
    isCollateral: false,
    floatingBorrowAssets: parseUnits("1", 18),
    floatingDepositAssets: parseUnits("1", 18),
    fixedBorrowPositions: [{ principal: parseUnits("0.9", 18), fee: parseUnits("0.1", 18), maturity: INTERVAL }],
    penaltyRate: parseUnits("0.000000052083333333", 18),
  },
] as const;
