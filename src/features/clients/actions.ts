"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/lib/action-result";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { clientInputSchema } from "./domain/client-schema";

export type ClientFieldErrors = {
  name?: string;
  taxId?: string;
  email?: string;
};

export type ClientActionResult = ActionResult<undefined, ClientFieldErrors>;

const GENERIC_ERROR = "Something went wrong. Please try again.";
const UNAUTHENTICATED_ERROR = "You must be signed in to perform this action.";
const NOT_FOUND_ERROR = "Client not found.";

function parseClientFormData(formData: FormData) {
  return clientInputSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId"),
    email: formData.get("email"),
  });
}

function collectFieldErrors(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): ClientFieldErrors {
  const fieldErrors: ClientFieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "name" && !fieldErrors.name) {
      fieldErrors.name = issue.message;
    }
    if (key === "taxId" && !fieldErrors.taxId) {
      fieldErrors.taxId = issue.message;
    }
    if (key === "email" && !fieldErrors.email) {
      fieldErrors.email = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * Creates a client for the authenticated user. Input is validated with Zod
 * before reaching Supabase (SEC-07). Supabase errors are turned into a
 * user-safe message (ARCH-04). On success, the function redirects to the
 * list page and never returns.
 */
export async function createClientAction(
  _previousState: ClientActionResult | null,
  formData: FormData,
): Promise<ClientActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: UNAUTHENTICATED_ERROR };
  }

  const parsed = parseClientFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name: parsed.data.name,
    tax_id: parsed.data.taxId,
    email: parsed.data.email,
  });

  if (error) {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/clients");
  redirect("/clients");
}

/**
 * Updates a client the current user owns. RLS restricts the update to rows
 * where `auth.uid() = user_id`, so sending an unknown id simply updates no
 * rows and the action reports a generic not-found message.
 */
export async function updateClientAction(
  id: string,
  _previousState: ClientActionResult | null,
  formData: FormData,
): Promise<ClientActionResult> {
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

  const parsed = parseClientFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues),
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      tax_id: parsed.data.taxId,
      email: parsed.data.email,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (!data) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  revalidatePath("/clients");
  redirect("/clients");
}

/**
 * Deletes a client the current user owns. Called from a form submission driven
 * by `useActionState`, so it returns a typed `ClientActionResult` on failure
 * and redirects on success (ARCH-04). RLS guarantees the user can only delete
 * their own rows; Supabase errors are turned into a user-safe message instead
 * of being swallowed silently.
 */
export async function deleteClientAction(
  _previousState: ClientActionResult | null,
  formData: FormData,
): Promise<ClientActionResult> {
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

  const { error } = await supabase.from("clients").delete().eq("id", rawId);

  if (error) {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/clients");
  redirect("/clients");
}
