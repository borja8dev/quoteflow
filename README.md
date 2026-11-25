# QuoteFlow

## What QuoteFlow is

QuoteFlow is a quote manager for small businesses. You keep a list of clients, build quotes with line items (description, quantity, unit price), and move each quote through a status flow (`draft` → `sent` → `accepted` or `rejected`). Totals are computed server-side with VAT at 21 %, and an `accepted` quote is locked: it cannot be edited or deleted.

## Tech stack

- Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Supabase (Postgres + Auth + Row Level Security)
- Zod for input validation
- Vitest for unit tests
- Vercel for hosting

## Local setup

Prerequisites:

- Node.js 20 or later
- npm 10 or later
- A Supabase project (create one in your Supabase dashboard; the free tier is enough)

Steps:

1. Install dependencies.

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your Supabase values.

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the values from your Supabase project's API settings. `.env.local` is git-ignored and must never be committed.

3. Apply the SQL migrations to your Supabase project. See [Running migrations](#running-migrations) below. Both migrations must be applied, in order, before the app will work.

4. Start the dev server.

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`. Anonymous visits are redirected to `/login`. After signing in you land on the dashboard at `/`.

## Environment variables

Only two variables are needed, and both are public (`NEXT_PUBLIC_*`) because they are safe to expose to the browser.

| Variable | Where it comes from | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API → Project URL | Public (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → `anon` public key | Public (browser + server) |

The Supabase **service role key is not used** by this application and must not be added. Application code relies on Row Level Security to scope every row to `auth.uid()`; a service role key would bypass RLS and expose every user's data. If you ever need it for one-off administrative tasks, use it only from the Supabase SQL Editor, never from this codebase.

## Running migrations

The SQL migrations live in [`supabase/migrations/`](supabase/migrations/). Apply them in order:

1. `20261125120000_init_schema.sql` — creates `clients`, `quotes` and `quote_items`, enables RLS, defines the per-user policies, and installs the trigger that locks accepted quotes.
2. `20261125190000_grant_authenticated.sql` — grants `select, insert, update, delete` on those tables to the `authenticated` role. Without this grant, every signed-in user hits Postgres error `42501` the moment they open `/clients` or `/quotes/new`.

Each migration file begins with a `HUMAN ACTION REQUIRED` block describing both paths: applying through the Supabase Dashboard SQL Editor (fastest for a one-off setup) and applying through the [Supabase CLI](https://supabase.com/docs/guides/cli) (recommended if you want migrations tracked in version control). Follow the instructions inside the file; do not copy the SQL into this README.

## Deploying to Vercel

1. Push the repository to GitHub.
2. In your Vercel dashboard, choose "New Project" and import the GitHub repository. Vercel auto-detects the Next.js preset; keep the default settings.
3. In the Vercel project settings, add the two environment variables from the table above to both the **Production** and **Preview** environments. Do not add the Supabase service role key. Do not commit `.env.local` — it is git-ignored on purpose.
4. Make sure both SQL migrations have already been applied to the Supabase project whose URL and anon key you pasted into Vercel. A fresh Supabase project without the migrations will accept the deploy but every data screen will fail at runtime.
5. Deploy. The default build command is `next build` and the default output directory is `.next`; no custom build command is needed. On the first production URL, anonymous visits redirect to `/login`.

## Demo user seed

Seeding is a manual, one-off step. Pick a path:

1. In your Supabase project, go to **Authentication → Users → Add user**.
2. Enter an email you control and a strong password of your choice. Suggested placeholder: email `demo@example.com`, password `change-me-please`. Pick your own values — do not ship those.
3. If "Confirm email" is enabled on the project, use the Supabase UI to confirm the user, or disable email confirmation for the demo environment.
4. Confirm that migration `20261125190000_grant_authenticated.sql` has been applied to the same project. Without it, the demo user will log in successfully but every table access will fail with Postgres error `42501`.
5. Sign in at `/login` with the credentials you just created.

Optional: seed one demo client and one draft quote for that user. Paste the snippet below into the Supabase SQL Editor after replacing the email with whatever you used in step 2. The query looks the user up in `auth.users` so you do not have to copy a UUID.

```sql
-- OPTIONAL demo data. Run as a project admin in the Supabase SQL Editor.
-- Replace the email literal with the demo user's email.
with demo_user as (
  select id as user_id
  from auth.users
  where email = 'demo@example.com'
  limit 1
),
new_client as (
  insert into public.clients (user_id, name, tax_id, email)
  select user_id, 'Demo Client S.L.', 'B12345674', 'billing@demo-client.example'
  from demo_user
  returning id, user_id
),
new_quote as (
  insert into public.quotes (user_id, client_id, status)
  select user_id, id, 'draft'
  from new_client
  returning id, user_id
)
insert into public.quote_items (user_id, quote_id, description, quantity, unit_price_cents)
select user_id, id, 'Consulting hours', 10, 7500
from new_quote;
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server with hot reload. |
| `npm run build` | Build the production bundle. |
| `npm run start` | Serve the production build locally. |
| `npm run lint` | Run ESLint over the whole repo. |
| `npm run typecheck` | Run `tsc --noEmit` with strict settings. |
| `npm run test` | Run the Vitest suite once. |

## Project layout

```
src/
  app/              Next.js App Router routes (login, dashboard, clients, quotes).
  features/         One folder per domain (auth, clients, quotes, dashboard).
                    Each feature contains its own domain/, data/, actions.ts and components.
  lib/              Shared utilities: Supabase server/client factories, action-result type.
supabase/
  migrations/       Versioned SQL migrations applied to the Supabase project.
docs/               Project rules (DIRECTRICES.md), roadmap (TASKS.md), changelog.
```

## Where to look next

- [`docs/DIRECTRICES.md`](docs/DIRECTRICES.md) — the rules every contribution must follow. Read this before opening a pull request.
- [`docs/TASKS.md`](docs/TASKS.md) — current roadmap and task status.
