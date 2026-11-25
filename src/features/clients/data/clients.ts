import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClientRow = {
  id: string;
  name: string;
  tax_id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientListResult =
  | { ok: true; data: ReadonlyArray<ClientRow> }
  | { ok: false; error: string };

export type ClientFetchResult =
  | { ok: true; data: ClientRow }
  | { ok: false; error: "not_found" | "unknown" };

const CLIENT_COLUMNS = "id, name, tax_id, email, created_at, updated_at";

/**
 * Lists the clients owned by the authenticated user. RLS enforces ownership
 * at the database level, so we only need a `select` scoped to the current
 * session.
 */
export async function listClients(): Promise<ClientListResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: "We could not load your clients." };
  }

  return { ok: true, data: (data ?? []) as ReadonlyArray<ClientRow> };
}

/**
 * Loads a single client by id. The query is implicitly scoped by RLS; a
 * client the user does not own looks exactly like a missing row, so we do
 * not leak another user's existence.
 */
export async function getClientById(id: string): Promise<ClientFetchResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "unknown" };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true, data: data as ClientRow };
}
