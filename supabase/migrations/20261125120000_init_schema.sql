-- =============================================================================
-- QuoteFlow — initial schema migration
-- -----------------------------------------------------------------------------
-- Creates the clients, quotes and quote_items tables with Row Level Security
-- (RLS) policies scoped to the authenticated user, plus triggers that enforce
-- the "accepted quote is locked" business rule at the database level (BIZ-05 /
-- DB-05).
-- -----------------------------------------------------------------------------
-- HUMAN ACTION REQUIRED — how to apply this migration
--
-- Option A — Supabase Dashboard (recommended for one-off setup):
--   1. Open your Supabase project.
--   2. Go to the SQL Editor (left sidebar).
--   3. Create a new query, paste the entire contents of this file.
--   4. Run the query. You should see "Success. No rows returned".
--   5. Verify in Table Editor that clients, quotes and quote_items exist and
--      show "RLS enabled" next to their names.
--
-- Option B — Supabase CLI (recommended if you keep the project under source
-- control and want migrations tracked):
--   1. Install the CLI: https://supabase.com/docs/guides/cli
--   2. Link the project once: `supabase link --project-ref <your-project-ref>`
--   3. Apply the migration: `supabase db push`
--
-- Never edit this file after it has been applied. For schema changes, add a
-- new timestamped migration file in supabase/migrations/.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- =============================================================================
-- Table: clients
-- =============================================================================
create table if not exists public.clients (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null check (char_length(name) between 1 and 200),
  tax_id      text        not null check (char_length(tax_id) between 1 and 32),
  email       text        null     check (email is null or char_length(email) <= 320),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

create policy "clients_select_own"
  on public.clients
  for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients
  for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- Table: quotes
-- =============================================================================
create table if not exists public.quotes (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  client_id   uuid        not null references public.clients (id) on delete restrict,
  status      text        not null default 'draft'
              check (status in ('draft', 'sent', 'accepted', 'rejected')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists quotes_user_id_idx    on public.quotes (user_id);
create index if not exists quotes_client_id_idx  on public.quotes (client_id);
create index if not exists quotes_status_idx     on public.quotes (status);

alter table public.quotes enable row level security;

create policy "quotes_select_own"
  on public.quotes
  for select
  using (auth.uid() = user_id);

create policy "quotes_insert_own"
  on public.quotes
  for insert
  with check (auth.uid() = user_id);

create policy "quotes_update_own"
  on public.quotes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quotes_delete_own"
  on public.quotes
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- Table: quote_items
-- -----------------------------------------------------------------------------
-- unit_price_cents is stored as an integer (BIZ-01: money as integer cents,
-- never numeric or money). quantity is a positive integer; fractional
-- quantities are not supported by the product (BIZ-03).
-- user_id is denormalised onto quote_items so RLS policies can filter directly
-- without joining to quotes.
-- =============================================================================
create table if not exists public.quote_items (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users (id) on delete cascade,
  quote_id          uuid        not null references public.quotes (id) on delete cascade,
  description       text        not null check (char_length(description) between 1 and 500),
  quantity          integer     not null check (quantity > 0),
  unit_price_cents  bigint      not null check (unit_price_cents >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists quote_items_user_id_idx   on public.quote_items (user_id);
create index if not exists quote_items_quote_id_idx  on public.quote_items (quote_id);

alter table public.quote_items enable row level security;

create policy "quote_items_select_own"
  on public.quote_items
  for select
  using (auth.uid() = user_id);

create policy "quote_items_insert_own"
  on public.quote_items
  for insert
  with check (auth.uid() = user_id);

create policy "quote_items_update_own"
  on public.quote_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "quote_items_delete_own"
  on public.quote_items
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- updated_at maintenance
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row
  execute function public.set_updated_at();

create trigger quote_items_set_updated_at
  before update on public.quote_items
  for each row
  execute function public.set_updated_at();

-- =============================================================================
-- BIZ-05 / DB-05 — Accepted quotes are locked
-- -----------------------------------------------------------------------------
-- Enforced at the database level: once a quote has status = 'accepted', the
-- row itself can no longer be updated or deleted, and its quote_items cannot
-- be inserted, updated or deleted.
-- Status transitions themselves (draft -> sent -> accepted/rejected, etc.)
-- are validated in the domain layer; the trigger below only enforces the
-- lock on rows that are already accepted.
-- =============================================================================

create or replace function public.prevent_accepted_quote_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'accepted' then
      raise exception 'Accepted quotes cannot be deleted'
        using errcode = 'check_violation';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = 'accepted' then
      raise exception 'Accepted quotes cannot be modified'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  return null;
end;
$$;

create trigger quotes_prevent_update_when_accepted
  before update on public.quotes
  for each row
  execute function public.prevent_accepted_quote_mutation();

create trigger quotes_prevent_delete_when_accepted
  before delete on public.quotes
  for each row
  execute function public.prevent_accepted_quote_mutation();

create or replace function public.prevent_accepted_quote_items_mutation()
returns trigger
language plpgsql
as $$
declare
  parent_status text;
  target_quote_id uuid;
begin
  if tg_op = 'DELETE' then
    target_quote_id := old.quote_id;
  else
    target_quote_id := new.quote_id;
  end if;

  select status into parent_status
  from public.quotes
  where id = target_quote_id;

  if parent_status = 'accepted' then
    raise exception 'Items of an accepted quote cannot be inserted, modified or deleted'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger quote_items_prevent_insert_when_accepted
  before insert on public.quote_items
  for each row
  execute function public.prevent_accepted_quote_items_mutation();

create trigger quote_items_prevent_update_when_accepted
  before update on public.quote_items
  for each row
  execute function public.prevent_accepted_quote_items_mutation();

create trigger quote_items_prevent_delete_when_accepted
  before delete on public.quote_items
  for each row
  execute function public.prevent_accepted_quote_items_mutation();
