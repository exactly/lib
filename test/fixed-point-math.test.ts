import { describe, expect, test } from "bun:test";
import { parseUnits } from "viem";

import WAD from "../src/fixed-point-math/WAD";
import expWad from "../src/fixed-point-math/expWad";
import lnWad from "../src/fixed-point-math/lnWad";
import log2 from "../src/fixed-point-math/log2";
import sqrt from "../src/fixed-point-math/sqrt";

describe("fixed point math", () => {
  /* eslint-disable unicorn/numeric-separators-style */
  test("expWad", () => {
    expect(expWad(-42139678854452767551n)).toBe(0n);
    expect(expWad(parseUnits("-3", 18))).toBe(49787068367863942n);
    expect(expWad(parseUnits("-2", 18))).toBe(135335283236612691n);
    expect(expWad(parseUnits("-1", 18))).toBe(367879441171442321n);
    expect(expWad(parseUnits("-0.5", 18))).toBe(606530659712633423n);
    expect(expWad(parseUnits("-0.3", 18))).toBe(740818220681717866n);
    expect(expWad(0n)).toBe(WAD);
    expect(expWad(parseUnits("0.3", 18))).toBe(1349858807576003103n);
    expect(expWad(parseUnits("0.5", 18))).toBe(1648721270700128146n);
    expect(expWad(parseUnits("1", 18))).toBe(2718281828459045235n);
    expect(expWad(parseUnits("2", 18))).toBe(7389056098930650227n);
    expect(expWad(parseUnits("3", 18))).toBe(20085536923187667741n);
    expect(expWad(parseUnits("10", 18))).toBe(22026465794806716516980n);
    expect(expWad(parseUnits("50", 18))).toBe(5184705528587072464148529318587763226117n);
    expect(expWad(parseUnits("100", 18))).toBe(26881171418161354484134666106240937146178367581647816351662017n);
    expect(expWad(135305999368893231588n)).toBe(
      57896044618658097650144101621524338577433870140581303254786265309376407432913n,
    );
  });
  test("lnWad", () => {
    expect(lnWad(WAD)).toBe(0n);
    expect(lnWad(2718281828459045235n)).toBe(999999999999999999n);
    expect(lnWad(11723640096265400935n)).toBe(2461607324344817918n);
    expect(lnWad(1n)).toBe(-41446531673892822313n);
    expect(lnWad(42n)).toBe(-37708862055609454007n);
    expect(lnWad(parseUnits("1", 4))).toBe(-32236191301916639577n);
    expect(lnWad(parseUnits("1", 9))).toBe(-20723265836946411157n);
    expect(lnWad(2n ** 255n - 1n)).toBe(135305999368893231589n);
    expect(lnWad(2n ** 170n)).toBe(76388489021297880288n);
    expect(lnWad(2n ** 128n)).toBe(47276307437780177293n);
  });
  test("log2", () => {
    expect(log2(2n)).toBe(1n);
    expect(log2(4n)).toBe(2n);
    expect(log2(1024n)).toBe(10n);
    expect(log2(1048576n)).toBe(20n);
    expect(log2(1073741824n)).toBe(30n);
  });
  test("sqrt", () => {
    expect(sqrt(0n)).toBe(0n);
    expect(sqrt(1n)).toBe(1n);
    expect(sqrt(2704n)).toBe(52n);
    expect(sqrt(110889n)).toBe(333n);
    expect(sqrt(32239684n)).toBe(5678n);
  });
  /* eslint-enable unicorn/numeric-separators-style */
});
