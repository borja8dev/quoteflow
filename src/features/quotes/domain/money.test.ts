import { describe, expect, it } from "vitest";

import {
  QuoteTotalsError,
  VAT_RATE_PERCENT,
  computeLineTotalCents,
  computeQuoteTotals,
  roundHalfUpToCent,
} from "./money";

describe("roundHalfUpToCent", () => {
  it("returns integers unchanged", () => {
    expect(roundHalfUpToCent(0)).toBe(0);
    expect(roundHalfUpToCent(1234)).toBe(1234);
    expect(roundHalfUpToCent(-7)).toBe(-7);
  });

  it("rounds down values below the midpoint", () => {
    expect(roundHalfUpToCent(10.49)).toBe(10);
    expect(roundHalfUpToCent(0.4)).toBe(0);
  });

  it("rounds up at or above the midpoint (half-up)", () => {
    expect(roundHalfUpToCent(10.5)).toBe(11);
    expect(roundHalfUpToCent(10.51)).toBe(11);
    expect(roundHalfUpToCent(0.5)).toBe(1);
  });

  it("rounds negatives away from zero at the midpoint", () => {
    expect(roundHalfUpToCent(-10.5)).toBe(-11);
    expect(roundHalfUpToCent(-10.49)).toBe(-10);
    expect(roundHalfUpToCent(-0.5)).toBe(-1);
  });

  it("throws for non-finite inputs", () => {
    expect(() => roundHalfUpToCent(Number.NaN)).toThrow(RangeError);
    expect(() => roundHalfUpToCent(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => roundHalfUpToCent(Number.NEGATIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("computeLineTotalCents", () => {
  it("multiplies integer quantities by integer cents", () => {
    expect(
      computeLineTotalCents({ quantity: 3, unitPriceCents: 1000 }),
    ).toBe(3000);
  });

  it("accepts a zero unit price", () => {
    expect(
      computeLineTotalCents({ quantity: 2, unitPriceCents: 0 }),
    ).toBe(0);
  });

  it("rounds fractional-cent results half-up", () => {
    // 1.5 h × 333 cents = 499.5 cents -> 500
    expect(
      computeLineTotalCents({ quantity: 1.5, unitPriceCents: 333 }),
    ).toBe(500);

    // 0.333 × 100 = 33.3 cents -> 33
    expect(
      computeLineTotalCents({ quantity: 0.333, unitPriceCents: 100 }),
    ).toBe(33);
  });

  it("rejects zero or negative quantities", () => {
    expect(() =>
      computeLineTotalCents({ quantity: 0, unitPriceCents: 1000 }),
    ).toThrow(QuoteTotalsError);
    expect(() =>
      computeLineTotalCents({ quantity: -1, unitPriceCents: 1000 }),
    ).toThrow(QuoteTotalsError);
  });

  it("rejects negative unit prices", () => {
    expect(() =>
      computeLineTotalCents({ quantity: 1, unitPriceCents: -1 }),
    ).toThrow(QuoteTotalsError);
  });

  it("rejects non-integer unit prices (cents must be whole)", () => {
    expect(() =>
      computeLineTotalCents({ quantity: 1, unitPriceCents: 10.5 }),
    ).toThrow(QuoteTotalsError);
  });

  it("rejects non-finite quantities and unit prices", () => {
    expect(() =>
      computeLineTotalCents({ quantity: Number.NaN, unitPriceCents: 1000 }),
    ).toThrow(QuoteTotalsError);
    expect(() =>
      computeLineTotalCents({
        quantity: 1,
        unitPriceCents: Number.POSITIVE_INFINITY,
      }),
    ).toThrow(QuoteTotalsError);
  });

  it("carries the line index in the thrown error", () => {
    try {
      computeLineTotalCents({ quantity: 0, unitPriceCents: 10 }, 4);
      expect.unreachable("expected a QuoteTotalsError");
    } catch (error) {
      expect(error).toBeInstanceOf(QuoteTotalsError);
      const asError = error as QuoteTotalsError;
      expect(asError.code).toBe("quantity_not_positive");
      expect(asError.lineIndex).toBe(4);
    }
  });
});

describe("computeQuoteTotals", () => {
  it("returns zeros for an empty quote", () => {
    const result = computeQuoteTotals([]);
    expect(result).toEqual({
      lines: [],
      subtotalCents: 0,
      vatCents: 0,
      totalCents: 0,
    });
  });

  it("computes a single-line total with exact VAT", () => {
    // 1 × 10000 cents = 100.00 €; VAT 21 % = 21.00 € = 2100 cents.
    const result = computeQuoteTotals([{ quantity: 1, unitPriceCents: 10000 }]);
    expect(result.subtotalCents).toBe(10000);
    expect(result.vatCents).toBe(2100);
    expect(result.totalCents).toBe(12100);
    expect(result.lines[0]?.lineTotalCents).toBe(10000);
  });

  it("sums multiple lines and rounds VAT half-up at the cent", () => {
    // subtotal = 1 × 333 + 2 × 100 = 333 + 200 = 533 cents
    // VAT      = round(533 × 21 / 100) = round(111.93) = 112 cents
    // total    = 533 + 112 = 645 cents
    const result = computeQuoteTotals([
      { quantity: 1, unitPriceCents: 333 },
      { quantity: 2, unitPriceCents: 100 },
    ]);
    expect(result.subtotalCents).toBe(533);
    expect(result.vatCents).toBe(112);
    expect(result.totalCents).toBe(645);
  });

  it("rounds VAT up when the fractional cent is exactly 0.5", () => {
    // subtotal = 50 cents -> VAT = 10.5 cents -> 11 cents (half-up)
    const result = computeQuoteTotals([{ quantity: 1, unitPriceCents: 50 }]);
    expect(result.subtotalCents).toBe(50);
    expect(result.vatCents).toBe(11);
    expect(result.totalCents).toBe(61);
  });

  it("supports fractional quantities with line-level rounding", () => {
    // line = round(0.333 × 100) = round(33.3) = 33
    // subtotal = 33, VAT = round(33 × 21 / 100) = round(6.93) = 7
    const result = computeQuoteTotals([{ quantity: 0.333, unitPriceCents: 100 }]);
    expect(result.lines[0]?.lineTotalCents).toBe(33);
    expect(result.subtotalCents).toBe(33);
    expect(result.vatCents).toBe(7);
    expect(result.totalCents).toBe(40);
  });

  it("produces VAT equal to subtotal × rate / 100 for amounts that divide evenly", () => {
    // subtotal = 10000 (100.00 €)
    // VAT      = 10000 × 21 / 100 = 2100 cents exactly
    const result = computeQuoteTotals([{ quantity: 10, unitPriceCents: 1000 }]);
    expect(result.vatCents).toBe((result.subtotalCents * VAT_RATE_PERCENT) / 100);
  });

  it("propagates errors from invalid lines", () => {
    expect(() =>
      computeQuoteTotals([
        { quantity: 1, unitPriceCents: 1000 },
        { quantity: 0, unitPriceCents: 500 },
      ]),
    ).toThrow(QuoteTotalsError);
  });
});
