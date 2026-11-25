import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "./env";

/**
 * Creates a Supabase client bound to the current server request.
 *
 * Call this from Server Components, Route Handlers and Server Actions. A fresh
 * client is returned per invocation so cookie writes from token refreshes are
 * attached to the correct response. In Server Components, Next.js forbids
 * writing cookies — the `setAll` handler swallows the resulting error so the
 * proxy keeps session cookies refreshed instead.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = readSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Writing cookies is not allowed from Server Components. The proxy
          // refreshes the session on every request, so losing one write here
          // is safe.
        }
      },
    },
  });
}
