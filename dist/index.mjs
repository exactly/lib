// src/fixed-point-math/WAD.ts
var WAD = 1000000000000000000n;
var WAD_default = WAD;
var SQ_WAD = WAD * WAD;
var TWO_WAD = 2n * WAD;

// src/fixed-point-math/divWad.ts
function divWad(a, b) {
  return a * WAD_default / b;
}

// src/fixed-point-math/divWadUp.ts
function divWadUp(a, b) {
  return a === 0n ? 0n : (a * WAD_default - 1n) / b + 1n;
}

// src/fixed-point-math/mulDiv.ts
function mulDiv(a, b, c) {
  return a * b / c;
}

// src/fixed-point-math/mulDivUp.ts
function mulDivUp(a, b, c) {
  const numerator = a * b;
  return numerator === 0n ? 0n : (numerator - 1n) / c + 1n;
}

// src/fixed-point-math/mulWad.ts
function mulWad(a, b) {
  return a * b / WAD_default;
}

// src/auditor/accountLiquidity.ts
function accountLiquidity(data, timestamp = Math.floor(Date.now() / 1e3)) {
  let adjCollateral = 0n;
  let adjDebt = 0n;
  for (const {
    isCollateral,
    floatingBorrowAssets,
    floatingDepositAssets,
    fixedBorrowPositions,
    penaltyRate,
    decimals,
    adjustFactor,
    usdPrice
  } of data) {
    const baseUnit = 10n ** BigInt(decimals);
    if (isCollateral) adjCollateral += adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);
    let totalDebt = floatingBorrowAssets;
    for (const { position, maturity } of fixedBorrowPositions) {
      const positionAssets = position.principal + position.fee;
      totalDebt += positionAssets;
      if (timestamp > maturity) totalDebt += mulWad(positionAssets, BigInt(timestamp) - maturity * penaltyRate);
    }
    adjDebt += divWadUp(mulDivUp(totalDebt, usdPrice, baseUnit), adjustFactor);
  }
  return { adjCollateral, adjDebt };
}
function adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor) {
  return mulWad(mulDiv(floatingDepositAssets, usdPrice, baseUnit), adjustFactor);
}
function normalizeCollateral(adjustedCollateral, usdPrice, baseUnit, adjustFactor) {
  return divWad(mulDiv(adjustedCollateral, baseUnit, usdPrice), adjustFactor);
}
function normalizeDebt(adjustedDebt, usdPrice, baseUnit, adjustFactor) {
  return mulDiv(mulWad(adjustedDebt, adjustFactor), baseUnit, usdPrice);
}

// src/auditor/borrowLimit.ts
function borrowLimit(data, market, targetHealthFactor = WAD_default * 105n / 100n, timestamp) {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");
  const { decimals, usdPrice, adjustFactor } = marketData;
  const maxAdjDebt = divWad(adjCollateral, targetHealthFactor);
  if (adjDebt >= maxAdjDebt) return 0n;
  const maxExtraDebt = maxAdjDebt - adjDebt;
  return normalizeDebt(maxExtraDebt, usdPrice, 10n ** BigInt(decimals), adjustFactor);
}

// src/fixed-point-math/MAX_UINT256.ts
var MAX_UINT256_default = 2n ** 256n - 1n;

// src/auditor/healthFactor.ts
function healthFactor(data, timestamp) {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  return adjDebt ? divWad(adjCollateral, adjDebt) : MAX_UINT256_default;
}

// src/auditor/withdrawLimit.ts
function withdrawLimit(data, market, targetHealthFactor = WAD_default * 105n / 100n, timestamp) {
  const { adjCollateral, adjDebt } = accountLiquidity(data, timestamp);
  const marketData = data.find(({ market: m }) => m.toLowerCase() === market.toLowerCase());
  if (!marketData) throw new Error("market not found");
  const { decimals, usdPrice, adjustFactor, floatingDepositAssets, isCollateral } = marketData;
  if (!isCollateral) return floatingDepositAssets;
  const baseUnit = 10n ** BigInt(decimals);
  const minAdjCollateral = mulWad(adjDebt, targetHealthFactor);
  if (adjCollateral <= minAdjCollateral) return 0n;
  const adjCollateralMarket = adjustCollateral(floatingDepositAssets, usdPrice, baseUnit, adjustFactor);
  if (adjCollateral - adjCollateralMarket >= minAdjCollateral) return floatingDepositAssets;
  const withdrawable = adjCollateral - minAdjCollateral;
  return normalizeCollateral(withdrawable, usdPrice, baseUnit, adjustFactor);
}

// src/fixed-point-math/expWad.ts
function expWad(x) {
  if (x <= -42139678854452767551n) return 0n;
  if (x >= 135305999368893231589n) throw new Error("EXP_OVERFLOW");
  x = (x << 78n) / 5n ** 18n;
  const k = (x << 96n) / 54916777467707473351141471128n + 2n ** 95n >> 96n;
  x -= k * 54916777467707473351141471128n;
  let y = x + 1346386616545796478920950773328n;
  y = (y * x >> 96n) + 57155421227552351082224309758442n;
  let p = y + x - 94201549194550492254356042504812n;
  p = (p * y >> 96n) + 28719021644029726153956944680412240n;
  p = p * x + (4385272521454847904659076985693276n << 96n);
  let q = x - 2855989394907223263936484059900n;
  q = (q * x >> 96n) + 50020603652535783019961831881945n;
  q = (q * x >> 96n) - 533845033583426703283633433725380n;
  q = (q * x >> 96n) + 3604857256930695427073651918091429n;
  q = (q * x >> 96n) - 14423608567350463180887372962807573n;
  q = (q * x >> 96n) + 26449188498355588339934803723976023n;
  const r = p / q;
  return r * 3822833074963236453042738258902158003155416615667n >> 195n - k;
}

// src/fixed-point-math/log2.ts
function log2(x) {
  if (x <= 0n) throw new Error("UNDEFINED");
  let r = BigInt(x > 0xffffffffffffffffffffffffffffffffn) << 7n;
  r |= BigInt(x >> r > 0xffffffffffffffffn) << 6n;
  r |= BigInt(x >> r > 0xffffffffn) << 5n;
  r |= BigInt(x >> r > 0xffffn) << 4n;
  r |= BigInt(x >> r > 0xffn) << 3n;
  r |= BigInt(x >> r > 0xfn) << 2n;
  r |= BigInt(x >> r > 0x3n) << 1n;
  r |= BigInt(x >> r > 0x1n);
  return r;
}

// src/fixed-point-math/lnWad.ts
function lnWad(x) {
  if (x <= 0n) throw new Error("UNDEFINED");
  const k = log2(x) - 96n;
  x <<= 159n - k;
  x >>= 159n;
  let p = x + 3273285459638523848632254066296n;
  p = (p * x >> 96n) + 24828157081833163892658089445524n;
  p = (p * x >> 96n) + 43456485725739037958740375743393n;
  p = (p * x >> 96n) - 11111509109440967052023855526967n;
  p = (p * x >> 96n) - 45023709667254063763336534515857n;
  p = (p * x >> 96n) - 14706773417378608786704636184526n;
  p = p * x - (795164235651350426258249787498n << 96n);
  let q = x + 5573035233440673466300451813936n;
  q = (q * x >> 96n) + 71694874799317883764090561454958n;
  q = (q * x >> 96n) + 283447036172924575727196451306956n;
  q = (q * x >> 96n) + 401686690394027663651624208769553n;
  q = (q * x >> 96n) + 204048457590392012362485061816622n;
  q = (q * x >> 96n) + 31853899698501571402653359427138n;
  q = (q * x >> 96n) + 909429971244387300277376558375n;
  let r = p / q;
  r *= 1677202110996718588342820967067443963516166n;
  r += 16597577552685614221487285958193947469193820559219878177908093499208371n * k;
  r += 600920179829731861736702779321621459595472258049074101567377883020018308n;
  r >>= 174n;
  return r;
}

// src/fixed-point-math/max.ts
function max(a, b) {
  return a > b ? a : b;
}

// src/fixed-point-math/min.ts
function min(a, b) {
  return a < b ? a : b;
}

// src/fixed-point-math/mulWadUp.ts
function mulWadUp(a, b) {
  const numerator = a * b;
  return numerator === 0n ? 0n : (numerator - 1n) / WAD_default + 1n;
}

// src/fixed-point-math/sqrt.ts
function sqrt(x) {
  if (x === 0n) return 0n;
  let y = x;
  let z = 181n;
  if (y >= 0x10000000000000000000000000000000000n) {
    y >>= 128n;
    z <<= 64n;
  }
  if (y >= 0x1000000000000000000n) {
    y >>= 64n;
    z <<= 32n;
  }
  if (y >= 0x10000000000n) {
    y >>= 32n;
    z <<= 16n;
  }
  if (y >= 0x1000000n) {
    y >>= 16n;
    z <<= 8n;
  }
  z = z * (y + 65536n) >> 18n;
  for (let index = 0; index < 7; ++index) z = z + x / z >> 1n;
  if (x / z < z) z--;
  return z;
}

// src/interest-rate-model/baseRate.ts
var EXP_THRESHOLD = 135305999368893231588n;
function baseRate(uFloating, uGlobal, { maxUtilization, naturalUtilization, sigmoidSpeed, growthSpeed, ...p }) {
  if (uFloating > uGlobal) throw new Error("UTILIZATION_EXCEEDED");
  if (uGlobal >= WAD_default) return MAX_UINT256_default;
  const curveA = p.curveA ?? ((p.naturalRate * expWad(growthSpeed * lnWad(WAD_default - naturalUtilization / 2n) / WAD_default) - 1n) / WAD_default + 1n - p.minRate) * (maxUtilization - naturalUtilization) * maxUtilization / (naturalUtilization * WAD_default);
  const curveB = p.curveB ?? p.minRate - curveA * WAD_default / maxUtilization;
  const r = curveA * WAD_default / (maxUtilization - uFloating) + curveB;
  if (uGlobal === 0n) return r;
  const auxSigmoid = lnWad(naturalUtilization * WAD_default / (WAD_default - naturalUtilization));
  let x = -(sigmoidSpeed * (lnWad(uGlobal * WAD_default / (WAD_default - uGlobal)) - auxSigmoid) / WAD_default);
  const sigmoid = x > EXP_THRESHOLD ? 0n : WAD_default * WAD_default / (WAD_default + expWad(x));
  x = -growthSpeed * lnWad(WAD_default - sigmoid * uGlobal / WAD_default) / WAD_default;
  const globalFactor = expWad(x > EXP_THRESHOLD ? EXP_THRESHOLD : x);
  if (globalFactor > MAX_UINT256_default / r) return MAX_UINT256_default;
  return (r * globalFactor - 1n) / WAD_default + 1n;
}

// src/interest-rate-model/fixedRate.ts
var MATURITY_INTERVAL = 4 * 7 * 86400;
function fixedRate(maturity, maxPools, uFixed, uFloating, uGlobal, parameters, timestamp = Math.floor(Date.now() / 1e3), base = baseRate(uFloating, uGlobal, parameters), z) {
  const { spreadFactor, maturitySpeed, timePreference, fixedAllocation, maxRate } = parameters;
  if (timestamp >= maturity) throw new Error("ALREADY_MATURED");
  if (uFixed > uGlobal) throw new Error("UTILIZATION_EXCEEDED");
  if (uGlobal === 0n) return base > maxRate ? maxRate : base;
  if (z === void 0) {
    const fixedFactor = BigInt(maxPools) * uFixed * SQ_WAD / (uGlobal * fixedAllocation);
    const sqFNatPools = BigInt(maxPools) * SQ_WAD / fixedAllocation;
    const fNatPools = sqrt(sqFNatPools * WAD_default);
    const natPools = (TWO_WAD - sqFNatPools) * SQ_WAD / (fNatPools * (WAD_default - fNatPools));
    z = natPools * sqrt(fixedFactor * WAD_default) / WAD_default + (WAD_default - natPools) * fixedFactor / WAD_default - WAD_default;
  }
  const maturityFactor = BigInt(maturity - timestamp) * WAD_default / BigInt(maxPools * MATURITY_INTERVAL);
  const spread = WAD_default + expWad(maturitySpeed * lnWad(maturityFactor) / WAD_default) * (timePreference + spreadFactor * z / WAD_default) / WAD_default;
  if (base >= maxRate * WAD_default / spread) return maxRate;
  return (base * spread - 1n) / WAD_default + 1n;
}

// src/vector/map2.ts
function map2(a, b, f) {
  if (Array.isArray(b)) {
    if (a.length !== b.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index]));
  }
  return a.map((value) => f(value, b));
}

// src/vector/add.ts
function add(a, b) {
  return map2(a, b, (a_, b_) => a_ + b_);
}

// src/vector/mul.ts
function mul(a, b) {
  return map2(a, b, (a_, b_) => a_ * b_);
}

// src/vector/map3.ts
function map3(a, b, c, f) {
  if (Array.isArray(b) && Array.isArray(c)) {
    if (a.length !== b.length || a.length !== c.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index], c[index]));
  } else if (Array.isArray(b)) {
    if (a.length !== b.length) throw new Error("different length");
    return a.map((value, index) => f(value, b[index], c));
  } else if (Array.isArray(c)) {
    if (a.length !== c.length) throw new Error("different length");
    return a.map((value, index) => f(value, b, c[index]));
  }
  return a.map((value) => f(value, b, c));
}

// src/vector/mulDivUp.ts
function mulDivUp2(a, b, c) {
  return map3(a, b, c, (a_, b_, c_) => (a_ * b_ - 1n) / c_ + 1n);
}

// src/vector/powDiv.ts
function powDiv(a, b, c) {
  return map3(a, b, c, (a_, b_, c_) => a_ ** b_ / c_);
}

// src/vector/sum.ts
function sum(array) {
  return array.reduce((accumulator, value) => accumulator + value);
}

// src/installments/effectiveRate.ts
var ONE_YEAR = 365n * 86400n;
function effectiveRate(totalAmount, firstMaturity, installments, rates, timestamp = Math.floor(Date.now() / 1e3), { tolerance = 20n, maxIterations = 66666n } = {}) {
  if (installments.length !== rates.length || rates.length < 2) throw new Error("INVALID_INPUT");
  const maturityFactors = rates.map(
    (_, index) => BigInt(firstMaturity + index * MATURITY_INTERVAL - timestamp) * WAD_default / ONE_YEAR
  );
  const y = mul(installments, WAD_default);
  let rate = rates[0];
  let iterations = 0;
  let error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    const aux = add(mulDivUp2(maturityFactors, rate, WAD_default), WAD_default);
    const f = sum(mulDivUp2(y, WAD_default, aux)) - totalAmount * WAD_default;
    const fp = -sum(mulDivUp2(y, maturityFactors, powDiv(aux, 2n, WAD_default)));
    const rateDiff = -f * WAD_default / fp;
    rate += rateDiff;
    error = rateDiff < 0n ? -rateDiff : rateDiff;
  } while (error >= tolerance);
  return rate;
}

// src/vector/abs.ts
function abs(array) {
  return array.map((value) => value < 0n ? -value : value);
}

// src/vector/fill.ts
function fill(length, value = 0n) {
  return Array.from({ length }).fill(value);
}

// src/vector/mean.ts
function mean(array) {
  return sum(array) / BigInt(array.length);
}

// src/vector/sub.ts
function sub(a, b) {
  return map2(a, b, (a_, b_) => a_ - b_);
}

// src/installments/split.ts
function splitInstallments(totalAmount, totalAssets, firstMaturity, maxPools, uFixed, uFloating, uGlobal, parameters, timestamp = Math.floor(Date.now() / 1e3), { power = WAD_default * 60n / 100n, scaleFactor = WAD_default * 95n / 100n, tolerance = 20n, maxIterations = 66666n } = {}) {
  const uGlobalAfter = uGlobal + (totalAmount * WAD_default - 1n) / totalAssets + 1n;
  const weight = max2(
    uGlobalAfter < WAD_default ? scaleFactor * expWad(power * lnWad(WAD_default - uGlobalAfter) / WAD_default) / WAD_default : 1n,
    10n ** 15n
  );
  let iterations = 0;
  let rates = [];
  let installments = [];
  let amounts = fill(uFixed.length, (totalAmount - 1n) / BigInt(uFixed.length) + 1n);
  let error = 0n;
  do {
    if (iterations++ >= maxIterations) throw new Error("MAX_ITERATIONS_EXCEEDED");
    let uGlobalAccumulator = uGlobal;
    rates = uFixed.map((uFixedBefore, index) => {
      const amount = amounts[index];
      const maturity = firstMaturity + index * MATURITY_INTERVAL;
      const uFixedAfter = amount ? uFixedBefore + (amount * WAD_default - 1n) / totalAssets + 1n : uFixedBefore;
      if (amount) uGlobalAccumulator += (amount * WAD_default - 1n) / totalAssets + 1n;
      return fixedRate(maturity, maxPools, uFixedAfter, uFloating, uGlobalAccumulator, parameters, timestamp);
    });
    installments = rates.map((rate, index) => {
      const amount = amounts[index];
      const maturity = firstMaturity + index * MATURITY_INTERVAL;
      return amount + amount * rate * BigInt(maturity - timestamp) / (WAD_default * ONE_YEAR);
    });
    const diffs = sub(installments, mean(installments));
    amounts = sub(amounts, mulDivUp2(diffs, weight, WAD_default));
    amounts = mulDivUp2(amounts, totalAmount, sum(amounts));
    const excess = sum(amounts) - totalAmount;
    for (let index = 0; index < excess; ++index) amounts[index] -= 1n;
    error = mean(mulDivUp2(abs(diffs), weight, WAD_default));
  } while (error >= tolerance);
  return {
    amounts,
    installments,
    rates,
    effectiveRate: effectiveRate(totalAmount, firstMaturity, installments, rates, timestamp, {
      tolerance,
      maxIterations
    })
  };
}
function max2(a, b) {
  return a > b ? a : b;
}

// src/interest-rate-model/fixedRates.ts
function fixedRates(firstMaturity, maxPools, uFixed, uFloating, uGlobal, parameters, timestamp) {
  const base = baseRate(uFloating, uGlobal, parameters);
  return uFixed.map((uFixedBefore, index) => {
    const maturity = firstMaturity + index * MATURITY_INTERVAL;
    fixedRate(maturity, maxPools, uFixedBefore, uFloating, uGlobal, parameters, timestamp, base);
  });
}

// src/interest-rate-model/fixedUtilization.ts
function fixedUtilization(supplied, borrowed, assets) {
  return assets !== 0n && borrowed > supplied ? ((borrowed - supplied) * WAD_default - 1n) / assets + 1n : 0n;
}

// src/interest-rate-model/floatingRate.ts
function floatingRate(uFloating, uGlobal, parameters) {
  const { maxRate } = parameters;
  const base = baseRate(uFloating, uGlobal, parameters);
  return base > maxRate ? maxRate : base;
}

// src/interest-rate-model/floatingUtilization.ts
function floatingUtilization(assets, debt) {
  return assets !== 0n && debt !== 0n ? (debt * WAD_default - 1n) / assets + 1n : 0n;
}

// src/interest-rate-model/globalUtilization.ts
function globalUtilization(assets, debt, backupBorrowed) {
  return assets !== 0n && debt + backupBorrowed !== 0n ? ((debt + backupBorrowed) * WAD_default - 1n) / assets + 1n : 0n;
}

// src/market/floatingDepositRates.ts
var YEAR_IN_SECONDS = 365n * 86400n;
function floatingDepositRates(snapshots, timestamp = Math.floor(Date.now() / 1e3), elapsed = 10 * 60) {
  return snapshots.map((snapshot) => {
    const projectedTotalAssets = projectTotalAssets(snapshot, timestamp + elapsed);
    const totalAssetsBefore = snapshot.totalAssets;
    const assetsInYear = (projectedTotalAssets - totalAssetsBefore) * YEAR_IN_SECONDS / BigInt(elapsed);
    return { market: snapshot.market, rate: divWad(assetsInYear, totalAssetsBefore) };
  });
}
function projectTotalAssets(snapshot, timestamp) {
  const {
    earningsAccumulator,
    earningsAccumulatorSmoothFactor,
    floatingAssets,
    floatingDebt,
    floatingRate: floatingRate2,
    interval,
    lastAccumulatorAccrual,
    lastFloatingDebtUpdate,
    maxFuturePools,
    pools,
    treasuryFeeRate
  } = snapshot;
  const elapsedAccumulator = BigInt(timestamp - lastAccumulatorAccrual);
  const accumulatedEarnings = earningsAccumulator * elapsedAccumulator / (elapsedAccumulator + mulWad(earningsAccumulatorSmoothFactor, BigInt(maxFuturePools) * interval));
  const newDebt = mulWad(
    floatingDebt,
    mulDiv(floatingRate2, BigInt(timestamp - lastFloatingDebtUpdate), YEAR_IN_SECONDS)
  );
  const backupEarnings = fixedPoolEarnings(pools, timestamp);
  return floatingAssets + backupEarnings + accumulatedEarnings + mulWad(newDebt, WAD_default - treasuryFeeRate);
}
function fixedPoolEarnings(pools, timestamp) {
  let backupEarnings = 0n;
  for (const { lastAccrual, maturity, unassignedEarnings } of pools) {
    if (maturity > lastAccrual) {
      backupEarnings += timestamp < maturity ? mulDiv(unassignedEarnings, BigInt(timestamp) - lastAccrual, BigInt(maturity - lastAccrual)) : unassignedEarnings;
    }
  }
  return backupEarnings;
}

// src/vector/max.ts
function max3(array) {
  return array.reduce((maxValue, value) => value > maxValue ? value : maxValue);
}

// src/vector/min.ts
function min2(array) {
  return array.reduce((minValue, value) => value < minValue ? value : minValue);
}

// src/vector/mulDiv.ts
function mulDiv2(a, b, c) {
  return map3(a, b, c, (a_, b_, c_) => a_ * b_ / c_);
}
export {
  MATURITY_INTERVAL,
  MAX_UINT256_default as MAX_UINT256,
  WAD_default as WAD,
  abs,
  accountLiquidity,
  add,
  baseRate,
  borrowLimit,
  divWad,
  divWadUp,
  effectiveRate,
  expWad,
  fill,
  fixedRate,
  fixedRates,
  fixedUtilization,
  floatingDepositRates,
  floatingRate,
  floatingUtilization,
  globalUtilization,
  healthFactor,
  lnWad,
  log2,
  map2,
  map3,
  max,
  max3 as maxV,
  mean,
  min,
  min2 as minV,
  mul,
  mulDiv,
  mulDivUp,
  mulDivUp2 as mulDivUpV,
  mulDiv2 as mulDivV,
  mulWad,
  mulWadUp,
  powDiv,
  splitInstallments,
  sqrt,
  sub,
  sum,
  withdrawLimit
};
//# sourceMappingURL=index.mjs.map