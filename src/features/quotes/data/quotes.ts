import { createSupabaseServerClient } from "@/lib/supabase/server";

import { computeQuoteTotals, type QuoteLineInput } from "../domain/money";
import { isQuoteStatus, type QuoteStatus } from "../domain/status";

export type QuoteItemRow = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  created_at: string;
};

export type QuoteRow = {
  id: string;
  client_id: string;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
};

export type QuoteWithClient = QuoteRow & {
  client_name: string;
};

export type QuoteWithItems = QuoteRow & {
  client_name: string;
  items: ReadonlyArray<QuoteItemRow>;
};

export type QuoteListResult =
  | { ok: true; data: ReadonlyArray<QuoteWithClient & { total_cents: number }> }
  | { ok: false; error: string };

export type QuoteFetchResult =
  | { ok: true; data: QuoteWithItems }
  | { ok: false; error: "not_found" | "unknown" };

const QUOTE_LIST_SELECT =
  "id, client_id, status, created_at, updated_at, clients ( name ), quote_items ( id, quantity, unit_price_cents )";

const QUOTE_DETAIL_SELECT =
  "id, client_id, status, created_at, updated_at, clients ( name ), quote_items ( id, quote_id, description, quantity, unit_price_cents, created_at )";

type QuoteListClientShape = { name: string };

type QuoteListRowShape = {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  clients: QuoteListClientShape | ReadonlyArray<QuoteListClientShape> | null;
  quote_items: ReadonlyArray<{
    id: string;
    quantity: number | string;
    unit_price_cents: number | string;
  }>;
};

type QuoteDetailClientShape = { name: string };

type QuoteDetailRowShape = {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  clients: QuoteDetailClientShape | ReadonlyArray<QuoteDetailClientShape> | null;
  quote_items: ReadonlyArray<{
    id: string;
    quote_id: string;
    description: string;
    quantity: number | string;
    unit_price_cents: number | string;
    created_at: string;
  }>;
};

function pickClientName(
  value:
    | { name: string }
    | ReadonlyArray<{ name: string }>
    | null
    | undefined,
): string {
  if (!value) {
    return "Unknown client";
  }
  if (Array.isArray(value)) {
    return value[0]?.name ?? "Unknown client";
  }
  return (value as { name: string }).name;
}

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number.parseFloat(value);
}

function toInteger(value: number | string): number {
  return typeof value === "number" ? value : Number.parseInt(value, 10);
}

/**
 * Lists the quotes owned by the authenticated user. Each row carries the
 * client's name and the pre-computed line items so the UI can render a total
 * without a second round trip. RLS enforces ownership at the database level.
 */
export async function listQuotes(): Promise<QuoteListResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "We could not load your quotes." };
  }

  const rows = (data ?? []) as ReadonlyArray<QuoteListRowShape>;

  const mapped = rows
    .filter((row) => isQuoteStatus(row.status))
    .map((row) => {
      const lines: QuoteLineInput[] = (row.quote_items ?? []).map((item) => ({
        quantity: toNumber(item.quantity),
        unitPriceCents: toInteger(item.unit_price_cents),
      }));
      const totals = computeQuoteTotals(lines);

      return {
        id: row.id,
        client_id: row.client_id,
        status: row.status as QuoteStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
        client_name: pickClientName(row.clients),
        total_cents: totals.totalCents,
      };
    });

  return { ok: true, data: mapped };
}

/**
 * Loads a single quote by id along with its items (ordered by creation time
 * so the display is stable). Quotes the user does not own look identical to
 * missing rows thanks to RLS.
 */
export async function getQuoteById(id: string): Promise<QuoteFetchResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select(QUOTE_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "unknown" };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  const row = data as QuoteDetailRowShape;
  if (!isQuoteStatus(row.status)) {
    return { ok: false, error: "unknown" };
  }

  const items = [...(row.quote_items ?? [])]
    .map((item) => ({
      id: item.id,
      quote_id: item.quote_id,
      description: item.description,
      quantity: toNumber(item.quantity),
      unit_price_cents: toInteger(item.unit_price_cents),
      created_at: item.created_at,
    }))
    .sort((left, right) => left.created_at.localeCompare(right.created_at));

  return {
    ok: true,
    data: {
      id: row.id,
      client_id: row.client_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      client_name: pickClientName(row.clients),
      items,
    },
  };
}

/**
 * Fetches just the status and line item count for a quote owned by the
 * current user. Used by the status-change action to feed the domain
 * transition validator without loading the whole payload.
 */
export async function getQuoteStatusContext(id: string): Promise<
  | {
      ok: true;
      status: QuoteStatus;
      lineItemCount: number;
    }
  | { ok: false; error: "not_found" | "unknown" }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, quote_items ( id )")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "unknown" };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  const row = data as {
    id: string;
    status: string;
    quote_items: ReadonlyArray<{ id: string }>;
  };

  if (!isQuoteStatus(row.status)) {
    return { ok: false, error: "unknown" };
  }

  return {
    ok: true,
    status: row.status,
    lineItemCount: row.quote_items.length,
  };
}
