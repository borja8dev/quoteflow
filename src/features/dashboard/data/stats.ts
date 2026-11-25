import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  aggregateDashboardStats,
  type AggregableQuote,
  type DashboardStats,
} from "@/features/dashboard/domain/stats";

export type { DashboardStats };

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

function toAggregableQuote(row: DashboardRowShape): AggregableQuote {
  return {
    status: row.status,
    lines: (row.quote_items ?? []).map((item) => ({
      quantity: toNumber(item.quantity),
      unitPriceCents: toInteger(item.unit_price_cents),
    })),
  };
}

/**
 * Loads the dashboard summary for the authenticated user.
 *
 * This function is a thin data-layer adapter: it guards the session, runs the
 * Supabase query, coerces raw numeric/text columns, and delegates the
 * aggregation to `aggregateDashboardStats` in the domain (ARCH-01). RLS
 * enforces ownership at the database level; we also verify the session here
 * as defence in depth (SEC-06).
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
  const stats = aggregateDashboardStats(rows.map(toAggregableQuote));

  return { ok: true, data: stats };
}
