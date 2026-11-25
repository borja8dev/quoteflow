"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "./env";

/**
 * Creates a Supabase client for use inside client components. It reads the
 * public env vars at call time so the module can be imported during build.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, anonKey } = readSupabasePublicEnv();
  return createBrowserClient(url, anonKey);
}
