/**
 * Reads the Supabase public environment variables at request time.
 *
 * These are the only Supabase values that may be exposed to the browser
 * (SEC-04). The service role key must never be read from application code
 * (SEC-03), so it is not referenced here.
 *
 * Values are read lazily from inside a function so that the module can be
 * imported during `next build` without the env vars being set. Missing
 * variables surface as a clear runtime error on the first request, not as
 * an obscure build-time crash.
 */
export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

export function readSupabasePublicEnv(): SupabasePublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}
