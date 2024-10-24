import { parseUnits } from "viem";
import { describe, expect, it } from "vitest";

import fixedRate, { MATURITY_INTERVAL, type IRMParameters } from "../src/interest-rate-model/fixedRate.js";
import floatingRate from "../src/interest-rate-model/floatingRate.js";

describe("interest rate model", () => {
  it("fixed rate", () => {
    expect(fixedRate(MATURITY_INTERVAL, 6, parseUnits("0.75", 18), 0n, parseUnits("0.75", 18), parameters, 1)).toBe(
      63726888252924763n, // eslint-disable-line unicorn/numeric-separators-style
    );
  });

  it("floating rate", () => {
    expect(floatingRate(parseUnits("0.75", 18), parseUnits("0.75", 18), parameters)).toBe(parseUnits("8", 16));
  });
});

const parameters: IRMParameters = {
  minRate: parseUnits("3.5", 16),
  naturalRate: parseUnits("8", 16),
  maxUtilization: parseUnits("1.3", 18),
  naturalUtilization: parseUnits("0.75", 18),
  growthSpeed: parseUnits("1.1", 18),
  sigmoidSpeed: parseUnits("2.5", 18),
  spreadFactor: parseUnits("0.2", 18),
  maturitySpeed: parseUnits("0.5", 18),
  timePreference: parseUnits("0.01", 18),
  fixedAllocation: parseUnits("0.6", 18),
  maxRate: parseUnits("15000", 16),
};
