/**
 * Pure dashboard aggregation (ARCH-01).
 *
 * Given a list of quotes (each with a status and the line items needed to
 * compute its total), returns the dashboard summary: a count per known status
 * and the sum of accepted-quote totals in integer cents.
 *
 * The function:
 *  - initialises counts for every status in `QUOTE_STATUSES` so the UI never
 *    has to know the catalogue (BIZ model boundary stays in the domain).
 *  - silently discards rows whose status is not a recognised `QuoteStatus`
 *    (defence in depth against unexpected database values);
 *    `quoteCount` only counts rows with a known status.
 *  - computes each accepted quote's total via `computeQuoteTotals` so VAT and
 *    line rounding follow BIZ-02 exactly. The accepted total is the sum of
 *    per-quote-rounded totals, not a single rounding over the raw sum.
 *
 * This module is intentionally free of React, Supabase or Next.js imports.
 */

import { computeQuoteTotals, type QuoteLineInput } from "@/features/quotes/domain/money";
import {
  QUOTE_STATUSES,
  isQuoteStatus,
  type QuoteStatus,
} from "@/features/quotes/domain/status";

export type DashboardStats = {
  readonly countsByStatus: Record<QuoteStatus, number>;
  readonly acceptedTotalCents: number;
  readonly quoteCount: number;
};

/**
 * Input shape for aggregation. `status` is a raw string: the domain guards
 * against unknown values so the data layer does not need a secondary filter.
 * Line items are already numerically coerced (quantity as a finite number,
 * unit price as integer cents) — see `src/features/quotes/domain/money.ts`.
 */
export type AggregableQuote = {
  readonly status: string;
  readonly lines: ReadonlyArray<QuoteLineInput>;
};

function emptyCounts(): Record<QuoteStatus, number> {
  const counts = {} as Record<QuoteStatus, number>;
  for (const status of QUOTE_STATUSES) {
    counts[status] = 0;
  }
  return counts;
}

/**
 * Aggregate dashboard statistics from a list of quotes.
 *
 * Rows with an unknown status are discarded (not counted, not summed).
 * The accepted total sums `computeQuoteTotals(lines).totalCents` across every
 * `accepted` quote; other statuses do not contribute to it.
 */
export function aggregateDashboardStats(
  quotes: ReadonlyArray<AggregableQuote>,
): DashboardStats {
  const countsByStatus = emptyCounts();
  let acceptedTotalCents = 0;
  let quoteCount = 0;

  for (const quote of quotes) {
    if (!isQuoteStatus(quote.status)) {
      continue;
    }
    countsByStatus[quote.status] += 1;
    quoteCount += 1;

    if (quote.status === "accepted") {
      acceptedTotalCents += computeQuoteTotals(quote.lines).totalCents;
    }
  }

  return {
    countsByStatus,
    acceptedTotalCents,
    quoteCount,
  };
}
