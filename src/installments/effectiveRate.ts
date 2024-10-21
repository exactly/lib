import WAD from "../fixed-point-math/WAD.js";
import { MATURITY_INTERVAL } from "../interest-rate-model/fixedRate.js";
import add from "../vector/add.js";
import mul from "../vector/mul.js";
import mulDivUp from "../vector/mulDivUp.js";
import powDiv from "../vector/powDiv.js";
import sum from "../vector/sum.js";

export const ONE_YEAR = 365n * 86_400n;

export default function effectiveRate(
  totalAmount: bigint,
  firstMaturity: number,
  installments: readonly bigint[],
  rates: readonly bigint[],
  timestamp = Math.floor(Date.now() / 1000),
  { tolerance = 20n, maxIterations = 66_666n } = {},
) {
  if (installments.length !== rates.length || rates.length < 2) throw new Error("INVALID_INPUT");
  const maturityFactors = rates.map(
    (_, index) => (BigInt(firstMaturity + index * MATURITY_INTERVAL - timestamp) * WAD) / ONE_YEAR,
  );
  const y = mul(installments, WAD);
  let rate = rates[0]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
  let iterations = 0;
  let error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    const aux = add(mulDivUp(maturityFactors, rate, WAD), WAD);
    const f = sum(mulDivUp(y, WAD, aux)) - totalAmount * WAD;
    const fp = -sum(mulDivUp(y, maturityFactors, powDiv(aux, 2n, WAD)));
    const rateDiff = (-f * WAD) / fp;
    rate += rateDiff;
    error = rateDiff < 0n ? -rateDiff : rateDiff;
  } while (error >= tolerance);
  return rate;
}
