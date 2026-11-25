-- =============================================================================
-- QuoteFlow — grant table privileges to the `authenticated` role (DB-10)
-- -----------------------------------------------------------------------------
-- Row Level Security only filters which rows a role can see; it does NOT grant
-- the role permission to touch the table in the first place. Without an
-- explicit `GRANT`, PostgREST / Supabase clients authenticated via
-- `@supabase/ssr` receive error `42501` ("permission denied for table ...")
-- *before* RLS is ever evaluated.
--
-- The initial schema migration (20261125120000_init_schema.sql) created the
-- tables and their RLS policies but did not grant any privileges. In
-- production this makes `/clients` and `/quotes/new` fail for every signed-in
-- user. This migration fixes that by granting `select, insert, update, delete`
-- on each application table to the `authenticated` role, and no privileges to
-- the `anon` role (unauthenticated users have no business touching these
-- tables).
--
-- The `revoke all ... from anon` statements are defensive: on a fresh Supabase
-- project `anon` has no privileges on these tables, but a previous environment
-- may have granted some by accident. Running `revoke` first makes the
-- migration safe to re-apply and guarantees the end state.
--
-- Idempotence: `grant` and `revoke` on an already-correct grant set are
-- no-ops, so this file can be re-run safely.
-- -----------------------------------------------------------------------------
-- HUMAN ACTION REQUIRED — how to apply this migration
--
-- Option A — Supabase Dashboard (recommended for one-off setup):
--   1. Open your Supabase project.
--   2. Go to the SQL Editor (left sidebar).
--   3. Create a new query, paste the entire contents of this file.
--   4. Run the query. You should see "Success. No rows returned".
--   5. Verify by signing in to the app and loading `/clients` and
--      `/quotes/new`: both should load without a "permission denied" error.
--
-- Option B — Supabase CLI (recommended if you keep the project under source
-- control and want migrations tracked):
--   1. Install the CLI: https://supabase.com/docs/guides/cli
--   2. Link the project once: `supabase link --project-ref <your-project-ref>`
--   3. Apply the migration: `supabase db push`
--
-- Never edit this file after it has been applied. For further privilege
-- changes, add a new timestamped migration file in supabase/migrations/.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Revoke any privileges `anon` might hold on these tables. Unauthenticated
-- users must never touch application data; they should fail at the GRANT
-- layer, well before RLS.
-- -----------------------------------------------------------------------------
revoke all on public.clients      from anon;
revoke all on public.quotes       from anon;
revoke all on public.quote_items  from anon;

-- -----------------------------------------------------------------------------
-- Grant the minimum privileges each table needs to the `authenticated` role.
-- RLS policies (defined in 20261125120000_init_schema.sql) further restrict
-- these operations to rows where `auth.uid() = user_id`.
-- -----------------------------------------------------------------------------
grant select, insert, update, delete on public.clients      to authenticated;
grant select, insert, update, delete on public.quotes       to authenticated;
grant select, insert, update, delete on public.quote_items  to authenticated;
