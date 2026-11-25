import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export type DashboardStatsResult =
  | { ok: true; data: DashboardStats }
  | { ok: false; error: string };

const DASHBOARD_SELECT =
  "id, status, quote_items ( id, quantity, unit_price_cents )";

type DashboardRowShape = {
  id: string;
  status: string;
  quote_items: ReadonlyArray<{
    id: string;
    quantity: number | string;
    unit_price_cents: number | string;
  }>;
};

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function toInteger(value: number | string): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

function emptyCounts(): Record<QuoteStatus, number> {
  const counts = {} as Record<QuoteStatus, number>;
  for (const status of QUOTE_STATUSES) {
    counts[status] = 0;
  }
  return counts;
}

/**
 * Loads the dashboard summary for the authenticated user.
 *
 * Returns a count for every status in `QUOTE_STATUSES` (zero when none exist)
 * so the UI does not need to know the status catalogue (ARCH-02). The accepted
 * total is the sum of `computeQuoteTotals(lines).totalCents` over every
 * accepted quote — totals are never recomputed inline (BIZ-02, ARCH-01).
 *
 * The query is scoped to the current session: RLS enforces ownership at the
 * database level, and we additionally verify the session here as defence in
 * depth (SEC-06).
 */
export async function getDashboardStats(): Promise<DashboardStatsResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to view the dashboard." };
  }

  const { data, error } = await supabase
    .from("quotes")
    .select(DASHBOARD_SELECT);

  if (error) {
    console.error("dashboard.stats", { code: error.code, message: error.message });
    return { ok: false, error: "We could not load your dashboard." };
  }

  const rows = (data ?? []) as ReadonlyArray<DashboardRowShape>;
  const countsByStatus = emptyCounts();
  let acceptedTotalCents = 0;
  let quoteCount = 0;

  for (const row of rows) {
    if (!isQuoteStatus(row.status)) {
      continue;
    }
    countsByStatus[row.status] += 1;
    quoteCount += 1;

    if (row.status === "accepted") {
      const lines: QuoteLineInput[] = (row.quote_items ?? []).map((item) => ({
        quantity: toNumber(item.quantity),
        unitPriceCents: toInteger(item.unit_price_cents),
      }));
      acceptedTotalCents += computeQuoteTotals(lines).totalCents;
    }
  }

  return {
    ok: true,
    data: {
      countsByStatus,
      acceptedTotalCents,
      quoteCount,
    },
  };
}
