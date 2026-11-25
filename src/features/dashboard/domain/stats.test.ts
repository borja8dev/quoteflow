import { describe, expect, it } from "vitest";

import { QUOTE_STATUSES } from "@/features/quotes/domain/status";

import { aggregateDashboardStats, type AggregableQuote } from "./stats";

describe("aggregateDashboardStats", () => {
  it("returns zero counts for every status when there are no quotes", () => {
    const result = aggregateDashboardStats([]);

    expect(result.quoteCount).toBe(0);
    expect(result.acceptedTotalCents).toBe(0);
    for (const status of QUOTE_STATUSES) {
      expect(result.countsByStatus[status]).toBe(0);
    }
  });

  it("counts quotes per status and quoteCount equals the sum of counts", () => {
    const quotes: ReadonlyArray<AggregableQuote> = [
      { status: "draft", lines: [] },
      { status: "draft", lines: [] },
      { status: "sent", lines: [{ quantity: 1, unitPriceCents: 100 }] },
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 1000 }] },
      { status: "accepted", lines: [{ quantity: 2, unitPriceCents: 500 }] },
      { status: "rejected", lines: [{ quantity: 1, unitPriceCents: 999 }] },
    ];

    const result = aggregateDashboardStats(quotes);

    expect(result.countsByStatus.draft).toBe(2);
    expect(result.countsByStatus.sent).toBe(1);
    expect(result.countsByStatus.accepted).toBe(2);
    expect(result.countsByStatus.rejected).toBe(1);
    expect(result.quoteCount).toBe(6);

    const sumOfCounts = QUOTE_STATUSES.reduce(
      (sum, status) => sum + result.countsByStatus[status],
      0,
    );
    expect(result.quoteCount).toBe(sumOfCounts);
  });

  it("only sums totals from accepted quotes", () => {
    // Each non-accepted quote has lines that would contribute if the filter
    // were missing. The expected acceptedTotalCents is derived only from the
    // single accepted quote: 1 × 10000 = 10000 subtotal, VAT = 2100, total = 12100.
    const quotes: ReadonlyArray<AggregableQuote> = [
      { status: "draft", lines: [{ quantity: 1, unitPriceCents: 10_000 }] },
      { status: "sent", lines: [{ quantity: 2, unitPriceCents: 5_000 }] },
      { status: "rejected", lines: [{ quantity: 3, unitPriceCents: 3_333 }] },
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 10_000 }] },
    ];

    const result = aggregateDashboardStats(quotes);

    expect(result.acceptedTotalCents).toBe(12_100);
    expect(result.countsByStatus.accepted).toBe(1);
  });

  it("sums per-quote-rounded totals (not a single rounding over the raw sum)", () => {
    // Each quote: subtotal = 50 cents -> VAT = round(50 × 21 / 100) = round(10.5) = 11
    // Per-quote total = 61 cents. Three accepted quotes -> 183 cents.
    //
    // A naive "sum subtotals then VAT once" approach would give:
    //   subtotal total = 150, VAT = round(31.5) = 32, grand total = 182 — off by one.
    // This test pins down that we round per quote, then sum.
    const quotes: ReadonlyArray<AggregableQuote> = [
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 50 }] },
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 50 }] },
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 50 }] },
    ];

    const result = aggregateDashboardStats(quotes);

    expect(result.acceptedTotalCents).toBe(183);
    expect(result.countsByStatus.accepted).toBe(3);
  });

  it("discards rows with an unknown status: no crash, no count bump, no total bump", () => {
    const quotes: ReadonlyArray<AggregableQuote> = [
      { status: "archived", lines: [{ quantity: 1, unitPriceCents: 10_000 }] },
      { status: "", lines: [] },
      { status: "ACCEPTED", lines: [{ quantity: 1, unitPriceCents: 10_000 }] },
      { status: "accepted", lines: [{ quantity: 1, unitPriceCents: 1_000 }] },
    ];

    const result = aggregateDashboardStats(quotes);

    expect(result.quoteCount).toBe(1);
    expect(result.countsByStatus.accepted).toBe(1);
    expect(result.countsByStatus.draft).toBe(0);
    expect(result.countsByStatus.sent).toBe(0);
    expect(result.countsByStatus.rejected).toBe(0);
    // Only the lowercase "accepted" quote contributes: subtotal 1000, VAT 210, total 1210.
    expect(result.acceptedTotalCents).toBe(1_210);
  });

  it("handles accepted quotes with no line items as a zero total", () => {
    const quotes: ReadonlyArray<AggregableQuote> = [
      { status: "accepted", lines: [] },
    ];

    const result = aggregateDashboardStats(quotes);

    expect(result.countsByStatus.accepted).toBe(1);
    expect(result.acceptedTotalCents).toBe(0);
  });
});
