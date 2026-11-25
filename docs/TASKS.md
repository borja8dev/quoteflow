# TASKS — QuoteFlow

Ordered task list for the project. Tick a task only after Testing returns `PASS`.
Each task names the guideline IDs from `docs/DIRECTRICES.md` that apply; global rules
(`SEC-*`, `CODE-*`) apply to every task even when not listed.

Legend: `[ ]` pending · `[x]` done. `Iter:` records how many develop → testing rounds ran.

---

## 1. Scaffold the Next.js app

- [x] Status: done — Iter: 1
- **Goal:** Set up the Next.js (App Router) project with TypeScript strict, Tailwind CSS,
  ESLint and Vitest so later tasks have a working toolchain.
- **Acceptance criteria:**
  - `package.json` exists with scripts `lint`, `typecheck`, `test`, `build`, `dev`, `start`.
  - TypeScript is configured with `"strict": true`.
  - Tailwind is wired up (config file + directives in a global stylesheet) and used by the
    default page.
  - ESLint is configured and `npm run lint` passes with zero errors on a fresh scaffold.
  - Vitest is configured and `npm run test` passes with at least one placeholder test.
  - `npm run typecheck` and `npm run build` pass.
  - `.env.example` exists at the repo root with empty values for
    `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - `.gitignore` ignores `node_modules`, `.next`, `.env`, `.env*.local`.
  - No real secrets committed anywhere.
  - `CLAUDE.md`, `.claude/`, `docs/` are preserved unchanged.
- **Guidelines:** SEC-01, SEC-02, SEC-04, CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, TEST-01.
- **Files/areas:** repo root (`package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`,
  `postcss.config.*`, `.eslintrc*`, `vitest.config.*`, `src/app/**`, `.env.example`, `.gitignore`).

## 1b. Upgrade dependencies

- [x] Status: done — Iter: 1
- **Goal:** Upgrade `next`, `react`, `react-dom` and `eslint-config-next` to their latest stable
  versions so the scaffold meets SEC-08 and DEP-01..03.
- **Acceptance criteria:**
  - `next`, `react`, `react-dom` and `eslint-config-next` are at the latest stable release
    (resolved with `npm install <pkg>@latest`, never typed from memory).
  - `eslint-config-next` version matches the installed `next` version.
  - No `-rc`, `-canary`, `-beta` or `-preview` suffixes in any of these four packages.
  - `npm audit --omit=dev --audit-level=high` exits 0 (zero high/critical vulnerabilities).
  - `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` all pass after the upgrade.
- **Guidelines:** SEC-08, DEP-01, DEP-02, DEP-03, CODE-01, CODE-02, CODE-05, TEST-01.
- **Files/areas:** `package.json`, `package-lock.json`.

## 2. Domain: pure quote logic + Spanish tax ID validation

- [x] Status: done — Iter: 1
- **Goal:** Implement the pure business logic (line totals, subtotal, VAT, total in integer
  cents), the status-transition rule, and Spanish NIF/NIE/CIF validation, with full unit tests.
- **Acceptance criteria:**
  - Modules under `src/features/quotes/domain/` and `src/features/clients/domain/` are pure
    (no React, no Supabase, no Next.js imports).
  - Money math uses integer cents, with half-up rounding at the cent.
  - Status transitions implement only `draft → sent`, `sent → accepted`, `sent → rejected`,
    `sent → draft`; everything else is rejected.
  - Tax ID validator covers NIF, NIE and CIF including the control character.
  - `npm run test` passes; every domain function has unit tests covering happy path and edges
    (rounding, zero / negative, forbidden transitions, valid and invalid tax IDs).
- **Guidelines:** ARCH-01, BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-06, TEST-01, TEST-02, TEST-03, TEST-04.

## 3. Database: schema, RLS and locked-quote rule

- [x] Status: done — Iter: 1
- **Goal:** Write SQL migrations for `clients`, `quotes`, `quote_items`, RLS policies based on
  `auth.uid()`, and database-level enforcement of "accepted quote is locked".
- **Acceptance criteria:**
  - New file(s) under `supabase/migrations/` with timestamped names.
  - Each table has `user_id` and RLS enabled, with select/insert/update/delete policies based
    on `auth.uid() = user_id`.
  - Foreign keys declared with explicit `on delete` behaviour.
  - Trigger or policy that prevents update/delete when a quote (or its items) is `accepted`.
  - Human action instructions included for applying the migration in Supabase.
- **Guidelines:** DB-01, DB-02, DB-03, DB-04, DB-05, BIZ-05.

## 3b. Harden schema (cross-user refs, function search_path, quantity type)

- [x] Status: done — Iter: 1
- **Goal:** Fix the not-yet-applied initial migration so it meets DB-06, DB-07 and DB-08,
  and align the domain with the updated BIZ-03 (quantity is a positive number with up to
  2 decimals in both the domain and the database). The migration has **not** been applied
  to Supabase yet, so edit the existing migration file in place (DB-09).
- **Acceptance criteria:**
  - **DB-06 (no cross-user references):**
    - `quotes` insert/update policies verify `client_id` references a client owned by
      `auth.uid()` (e.g. `exists (select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())`).
    - `quote_items` insert/update policies verify `quote_id` references a quote owned by
      `auth.uid()` using the same pattern.
    - Checks are in both `using` and `with check` where applicable so updates cannot move
      a row to another user's client/quote.
  - **DB-07 (function search_path):**
    - Every `create ... function` in the migration includes `set search_path = ''` (or an
      equivalent explicit setting) and uses schema-qualified names (`public.*`, `auth.*`,
      `pg_catalog.*`) for every table, function and operator reference inside the body.
    - This applies to `public.set_updated_at`, `public.prevent_accepted_quote_mutation`
      and `public.prevent_accepted_quote_items_mutation`.
  - **DB-08 / BIZ-03 (quantity type matches domain):**
    - `quote_items.quantity` column type accepts positive values with up to 2 decimals
      (e.g. `numeric(12, 2)`), with a `check (quantity > 0)` constraint and a
      scale-matching check so values with more than 2 decimals are rejected at the DB.
    - Domain (`src/features/quotes/domain/money.ts`) rejects quantities that are not
      positive or that have more than 2 decimal places, with a new `QuoteTotalsError` code
      (e.g. `quantity_too_many_decimals`).
    - Existing domain tests are updated so no test case uses a quantity with more than
      2 decimals; new tests cover the 2-decimal boundary and the rejection of 3+ decimals.
  - **DB-09 (edit in place):** The schema change goes into the **existing** migration
    file (`supabase/migrations/20261125120000_init_schema.sql`); no new migration file is
    added, and the file still runs cleanly on an empty database.
  - `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` all pass.
- **Guidelines:** DB-06, DB-07, DB-08, DB-09, BIZ-03, ARCH-01, CODE-01, CODE-02, CODE-05,
  CODE-06, TEST-01, TEST-02, TEST-03, TEST-04.
- **Files/areas:** `supabase/migrations/20261125120000_init_schema.sql`,
  `src/features/quotes/domain/money.ts`, `src/features/quotes/domain/money.test.ts`.

## 4. Auth: Supabase SSR + protected routes

- [x] Status: done — Iter: 1
- **Goal:** Add Supabase SSR clients, login/logout, and middleware-based route protection.
- **Acceptance criteria:**
  - `src/lib/supabase/server.ts`, `client.ts`, `middleware.ts` exist using `@supabase/ssr`.
  - `/login` page with email/password form.
  - Logout action.
  - Middleware redirects unauthenticated users on protected routes to `/login`.
- **Guidelines:** SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, ARCH-03, ARCH-04, ARCH-05, UI-01, UI-03.

## 5. Clients CRUD

- [x] Status: done — Iter: 2
- **Goal:** Create / list / edit / delete clients, scoped by user via RLS.
- **Acceptance criteria:**
  - Server Actions under `src/features/clients/actions.ts` with Zod validation.
  - List page with loading, empty and error states.
  - Form uses labels, validation errors next to fields, mobile-friendly.
  - Tax ID and email validated via domain functions from Task 2.
- **Guidelines:** SEC-06, SEC-07, ARCH-02, ARCH-03, ARCH-04, BIZ-06, BIZ-07, UI-01, UI-02, UI-03, UI-04.

## 6. Quotes CRUD with items and status changes

- [x] Status: done — Iter: 2
- **Goal:** Manage quotes and their line items, with status transitions.
- **Acceptance criteria:**
  - Create/read/update of quotes with items; totals computed via domain from Task 2.
  - Status transitions only via Server Actions that call the domain validator.
  - Accepted quotes show no edit/delete controls.
- **Guidelines:** ARCH-02, ARCH-03, ARCH-04, BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-05, UI-01, UI-02, UI-03, UI-05, UI-06.

## 6b. Grant table privileges to `authenticated` and log DB errors (DB-10, ARCH-06)

- [x] Status: done — Iter: 1
- **Goal:** Fix the live `/clients` and `/quotes/new` failures caused by the Postgres role
  `authenticated` having no table privileges on `clients`, `quotes` and `quote_items` (RLS
  only filters rows; a missing `GRANT` yields error `42501` before RLS is even evaluated).
  Also wire ARCH-06 server-side logging into every data-layer function that maps a Supabase
  error to a generic message.
- **Acceptance criteria:**
  - **DB-01 / DB-09:** a NEW migration file under `supabase/migrations/` with a timestamped
    name (the initial migration has already been applied; do NOT edit it).
  - **DB-10:** the new migration contains explicit `grant select, insert, update, delete`
    statements on `public.clients`, `public.quotes` and `public.quote_items` to the
    `authenticated` role, and no grants to `anon`. Statements are idempotent-friendly
    (either preceded by a `revoke all on … from anon` or written so re-running does not
    fail). The migration file ends with clear "HUMAN ACTION REQUIRED" instructions (same
    style as `20261125120000_init_schema.sql`) because the Orchestrator will hand the SQL
    to the human to paste into Supabase.
  - **ARCH-06 / CODE-04:** every function in `src/features/*/data/*.ts` and `src/features/*/actions.ts`
    that currently maps a Supabase `error` to a generic user message adds a `console.error`
    first, including an operation label (e.g. `"clients.list"`) and the error `code` and
    `message`. Do not log user-submitted payloads. This is the only allowed use of
    `console.*` in `src/` (CODE-04).
  - **No regressions:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
    all pass; `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities.
- **Guidelines:** DB-01, DB-09, DB-10, ARCH-04, ARCH-06, CODE-01, CODE-02, CODE-04, CODE-05, SEC-08.
- **Files/areas:** `supabase/migrations/<new-timestamp>_grant_authenticated.sql`,
  `src/features/clients/data/clients.ts`, `src/features/clients/actions.ts`,
  `src/features/quotes/data/quotes.ts`, `src/features/quotes/actions.ts`.

## 7. Dashboard

- [x] Status: done — Iter: 1
- **Goal:** Dashboard showing quote count per status and total accepted amount.
- **Acceptance criteria:**
  - Data fetched server-side, scoped to the authenticated user.
  - Amounts formatted in euros (Spanish formatting).
  - Loading and empty states.
- **Guidelines:** ARCH-02, ARCH-05, SEC-06, UI-02, UI-04, UI-05.

## 8. Deploy readiness

- [ ] Status: pending — Iter: —
- **Goal:** The app is ready to deploy on Vercel with a demo user.
- **Acceptance criteria:**
  - `npm run build` passes in production mode.
  - `README.md` explains the app, local setup, env vars, how to run migrations,
    Vercel deploy steps, and the demo user seed.
- **Guidelines:** CODE-05, DOC-01, DOC-02.
