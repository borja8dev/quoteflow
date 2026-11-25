"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getQuoteStatusContext } from "./data/quotes";
import {
  quoteInputSchema,
  statusChangeSchema,
  type QuoteInput,
} from "./domain/quote-schema";
import { transitionQuoteStatus, type QuoteStatus } from "./domain/status";

export type QuoteItemFieldErrors = {
  description?: string;
  quantity?: string;
  unitPrice?: string;
};

export type QuoteFieldErrors = {
  clientId?: string;
  items?: Record<number, QuoteItemFieldErrors>;
};

export type QuoteActionResult = ActionResult<undefined, QuoteFieldErrors>;

const GENERIC_ERROR = "Something went wrong. Please try again.";
const UNAUTHENTICATED_ERROR = "You must be signed in to perform this action.";
const NOT_FOUND_ERROR = "Quote not found.";
const LOCKED_ERROR = "An accepted quote cannot be modified or deleted.";

function parseQuoteFormData(formData: FormData) {
  const clientId = formData.get("clientId");
  const itemCountRaw = formData.get("itemCount");
  const itemCount =
    typeof itemCountRaw === "string"
      ? Math.max(0, Number.parseInt(itemCountRaw, 10) || 0)
      : 0;

  const items: Array<{ description: string; quantity: string; unitPrice: string }> = [];
  for (let index = 0; index < itemCount; index += 1) {
    const description = formData.get(`items[${index}].description`);
    const quantity = formData.get(`items[${index}].quantity`);
    const unitPrice = formData.get(`items[${index}].unitPrice`);
    if (description === null && quantity === null && unitPrice === null) {
      continue;
    }
    items.push({
      description: typeof description === "string" ? description : "",
      quantity: typeof quantity === "string" ? quantity : "",
      unitPrice: typeof unitPrice === "string" ? unitPrice : "",
    });
  }

  return quoteInputSchema.safeParse({
    clientId: typeof clientId === "string" ? clientId : "",
    items,
  });
}

function collectFieldErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): QuoteFieldErrors {
  const fieldErrors: QuoteFieldErrors = {};
  for (const issue of issues) {
    const [first, second, third] = issue.path;
    if (first === "clientId" && !fieldErrors.clientId) {
      fieldErrors.clientId = issue.message;
      continue;
    }
    if (first === "items" && typeof second === "number") {
      fieldErrors.items = fieldErrors.items ?? {};
      const existing = fieldErrors.items[second] ?? {};
      if (third === "description" && !existing.description) {
        existing.description = issue.message;
      }
      if (third === "quantity" && !existing.quantity) {
        existing.quantity = issue.message;
      }
      if (third === "unitPrice" && !existing.unitPrice) {
        existing.unitPrice = issue.message;
      }
      fieldErrors.items[second] = existing;
    }
  }
  return fieldErrors;
}

/**
 * Inserts the item rows for a quote. Items are inserted in form order; the
 * database generates `created_at` so reads sort deterministically by it.
 */
async function insertQuoteItems(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  quoteId: string,
  items: QuoteInput["items"],
): Promise<{ ok: true } | { ok: false }> {
  if (items.length === 0) {
    return { ok: true };
  }
  const rows = items.map((item) => ({
    user_id: userId,
    quote_id: quoteId,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  }));
  const { error } = await supabase.from("quote_items").insert(rows);
  if (error) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Creates a quote for the authenticated user along with its line items.
 * Inputs are validated with Zod (SEC-07) before touching Supabase. On
 * success the function redirects to the quote detail page. Supabase errors
 * are collapsed into a user-safe message (ARCH-04).
 */
export async function createQuoteAction(
  _previousState: QuoteActionResult | null,
  formData: FormData,
): Promise<QuoteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: UNAUTHENTICATED_ERROR };
  }

  const parsed = parseQuoteFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { data: quote, error: insertError } = await supabase
    .from("quotes")
    .insert({
      user_id: user.id,
      client_id: parsed.data.clientId,
      status: "draft",
    })
    .select("id")
    .maybeSingle();

  if (insertError || !quote) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const itemsResult = await insertQuoteItems(
    supabase,
    user.id,
    quote.id,
    parsed.data.items,
  );
  if (!itemsResult.ok) {
    // Best-effort cleanup so a failed item insert does not leave an orphan
    // quote. If the delete also fails there is nothing to recover from on
    // the server; the user will see the generic error.
    await supabase.from("quotes").delete().eq("id", quote.id);
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

/**
 * Updates the client and line items of a quote the current user owns. The
 * items are replaced wholesale (delete-then-insert); the DB trigger blocks
 * writes if the quote is already `accepted` (BIZ-05 / DB-05), so the UI's
 * "no edit controls for accepted" rule is defence in depth.
 */
export async function updateQuoteAction(
  id: string,
  _previousState: QuoteActionResult | null,
  formData: FormData,
): Promise<QuoteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: UNAUTHENTICATED_ERROR };
  }

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const parsed = parseQuoteFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const context = await getQuoteStatusContext(id);
  if (!context.ok) {
    return {
      ok: false,
      error: context.error === "not_found" ? NOT_FOUND_ERROR : GENERIC_ERROR,
    };
  }

  if (context.status === "accepted") {
    return { ok: false, error: LOCKED_ERROR };
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("quotes")
    .update({ client_id: parsed.data.clientId })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!updatedRow) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const { error: deleteItemsError } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", id);

  if (deleteItemsError) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const itemsResult = await insertQuoteItems(
    supabase,
    user.id,
    id,
    parsed.data.items,
  );
  if (!itemsResult.ok) {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

/**
 * Deletes a quote the current user owns. RLS limits deletion to the user's
 * rows; the DB trigger blocks the delete if the quote is already accepted
 * (BIZ-05).
 */
export async function deleteQuoteAction(
  _previousState: QuoteActionResult | null,
  formData: FormData,
): Promise<QuoteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: UNAUTHENTICATED_ERROR };
  }

  const rawId = formData.get("id");
  if (typeof rawId !== "string" || rawId.length === 0) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const context = await getQuoteStatusContext(rawId);
  if (!context.ok) {
    return {
      ok: false,
      error: context.error === "not_found" ? NOT_FOUND_ERROR : GENERIC_ERROR,
    };
  }

  if (context.status === "accepted") {
    return { ok: false, error: LOCKED_ERROR };
  }

  const { error } = await supabase.from("quotes").delete().eq("id", rawId);

  if (error) {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/quotes");
  redirect("/quotes");
}

/**
 * Changes a quote's status. The domain validator decides whether the
 * transition is allowed, including the "at least one line item to send"
 * rule (BIZ-03) and the accepted-is-locked rule (BIZ-05). The DB also
 * enforces the lock as defence in depth.
 */
export async function changeQuoteStatusAction(
  id: string,
  _previousState: QuoteActionResult | null,
  formData: FormData,
): Promise<QuoteActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: UNAUTHENTICATED_ERROR };
  }

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const rawNext = formData.get("nextStatus");
  const parsedNext = statusChangeSchema.safeParse(
    typeof rawNext === "string" ? rawNext : "",
  );
  if (!parsedNext.success) {
    return { ok: false, error: "Unknown target status." };
  }
  const nextStatus: QuoteStatus = parsedNext.data;

  const context = await getQuoteStatusContext(id);
  if (!context.ok) {
    return {
      ok: false,
      error: context.error === "not_found" ? NOT_FOUND_ERROR : GENERIC_ERROR,
    };
  }

  const transition = transitionQuoteStatus(context.status, nextStatus, {
    lineItemCount: context.lineItemCount,
  });

  if (!transition.ok) {
    return { ok: false, error: transition.message };
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({ status: transition.next })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!data) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  return { ok: true, data: undefined };
}
