# Changelog

All notable changes to QuoteFlow, one entry per task, newest first. The Orchestrator adds an
entry after every Testing `PASS`, in the same commit as the code (so entries written from task 6
onwards carry no commit hash; use `git log -- docs/CHANGELOG.md` to find it). Format based on [Keep a Changelog](https://keepachangelog.com/).
The reasons behind guideline changes are in [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md).

## Task 9 — UI polish (UI-07..UI-14) · review rounds: 2

### Added
- `src/components/ui/` with shared primitives `Button`, `Card`, `Badge` (+ pure
  `statusBadgeTone` mapper with unit tests), `Input`, `PageHeader`, `EmptyState`,
  `Alert` and `BackLink`. A tiny local `cn` helper, no new dependency (UI-08).
- Authenticated app shell at `src/app/(app)/layout.tsx` with a top nav (product name,
  Dashboard / Clients / Quotes, signed-in user's email, Sign out). The current section
  gets `aria-current="page"` plus an indigo pill. Nav is a compact two-row layout at
  375px, single row from `sm:` up (UI-07).

### Changed
- Every authenticated route moved into the `(app)` route group — URLs unchanged.
- Pages, forms and feature components rewritten to use the shared primitives. Indigo
  accent on a neutral slate scale; `bg-slate-50` page background; white cards with
  border, `rounded-lg` and a subtle shadow (UI-09).
- Clients and quotes lists: stacked cards on mobile, `<table>` from `md:` up, amounts
  right-aligned with `tabular-nums` (UI-11).
- Dashboard: four per-status cards (with the shared status→tone colour mapping) plus
  a prominent "Total accepted" card (UI-12).
- Login is a centred card with the product name and a one-line description, outside
  the authenticated shell (UI-14).
- Destructive actions (Delete client, Delete quote) use red styling and ask for
  confirmation via `window.confirm` on submit (UI-13).

### Fixed (review round 1 → 2)
- Inline error-alert class string (`rounded-lg border border-red-200 bg-red-50 …`)
  was duplicated across 11 sites, and the "Back to …" link class string across 12
  sites, violating UI-08 ("the same element is never styled with duplicated class
  strings in different files"). Extracted shared `Alert` and `BackLink` primitives
  under `src/components/ui/` and replaced every occurrence.

## Task 8 — Deploy readiness · review rounds: 1

### Added
- `README.md` covering what QuoteFlow is, tech stack, local setup, environment variables,
  how to run the two SQL migrations in order, deploying to Vercel, demo user seed
  (plus an optional SQL snippet that looks the demo user up in `auth.users` by email),
  npm scripts, project layout and pointers to the contributor docs (DOC-01).
- Production build (`npm run build`) verified green (CODE-05).

## Guidelines v1.4

### Added
- `UI-07` to `UI-14`: app shell with navigation, shared UI components, one visual language,
  status badges, responsive tables, dashboard stat cards, focus states and login layout.

## Task 7b — Dashboard aggregation in the domain · review rounds: 1

### Changed
- Moved the dashboard aggregation (count per status, accepted total) out of
  `src/features/dashboard/data/stats.ts` into a pure
  `src/features/dashboard/domain/stats.ts`. The data layer now only queries,
  coerces raw columns and delegates (ARCH-01, ARCH-02). Public API
  (`getDashboardStats`, `DashboardStats`, `DashboardStatsResult`) and
  `src/app/page.tsx` are unchanged.

### Added
- `src/features/dashboard/domain/stats.test.ts` — unit tests covering: no quotes,
  mixed statuses, accepted-only sum, VAT half-up boundary (per-quote rounding, not a
  single round over the raw sum), unknown status discarded, accepted-with-zero-lines
  edge case (TEST-02, TEST-03, TEST-04).

## Task 7 — Dashboard · review rounds: 1

### Added
- Dashboard at `/` showing quote count per status (Draft, Sent, Accepted, Rejected) and
  the total accepted amount, with loading, empty and error states. Mobile layout uses a
  2-up grid at 375px and expands to 4-up on wider screens; the accepted total spans the
  full row (UI-04, UI-05).
- `src/features/dashboard/data/stats.ts` fetches the stats server-side, scoped to the
  authenticated user, and sums accepted totals through `computeQuoteTotals`
  (ARCH-02, ARCH-05, SEC-06, BIZ-02).
- `src/app/loading.tsx` skeleton matching the clients/quotes pattern (UI-02).

## Task 6b — Grant table privileges + DB error logging · review rounds: 1

### Fixed
- Signed-in users saw `permission denied for table …` (`42501`) on `/clients` and
  `/quotes/new` because the initial migration never granted the `authenticated` role any
  privileges. New migration `supabase/migrations/20261125190000_grant_authenticated.sql`
  grants `select, insert, update, delete` on `public.clients`, `public.quotes`,
  `public.quote_items` to `authenticated` and defensively revokes everything from `anon`
  (DB-10). The migration still needs to be applied to Supabase by the human.

### Added
- Server-side `console.error` logging in every data-layer function and Server Action that
  maps a Supabase error to a generic user message, with an operation label plus the error
  `code` and `message` (ARCH-06). No user-submitted payloads are logged.
- `eslint.config.mjs` now allows `console.error` (and only `console.error`), matching the
  v1.3 CODE-04 update.

## Guidelines v1.3

### Added
- `DB-10`: migrations grant table privileges to `authenticated` explicitly (none to `anon`).
- `ARCH-06`: database errors are logged server-side before being mapped to a generic message;
  `CODE-04` allows `console.error` only for this.

## Task 6 — Quotes CRUD · review rounds: 2

### Added
- Quotes list, create, edit, read-only detail and delete under `/quotes`, with loading,
  empty and error states.
- Quote form with client selector, dynamic line items, labelled inputs, field-level errors,
  and a running totals preview computed via the domain.
- Status transition buttons on the detail page (Send / Accept / Reject / Return to draft),
  each driven by a Server Action that defers to `transitionQuoteStatus`.
- Shared euro formatter (`src/features/quotes/domain/format.ts`) for Spanish amount display.

### Fixed (review round 1 → 2)
- `listQuotes` was recomputing subtotal, VAT and total inline with `Math.round` and a
  literal `21`, bypassing `computeQuoteTotals` and the half-up rounding rule
  (BIZ-02, ARCH-01). It now delegates to the domain function.
- `quote-schema.ts` exported an unused `QUOTE_STATUSES_FOR_FORM` constant (CODE-04); removed.

## Task 5 — Clients CRUD · `a9b9802` · review rounds: 2

### Added
- Clients list, create, edit and delete pages under `/clients`, with loading, empty and error
  states.
- Client form with labels and field-level errors; tax ID and email validated with the domain
  rules from task 2.
- Server Actions with Zod validation and ownership-scoped data access
  (`src/features/clients/data/clients.ts`).

### Fixed (review round 1 → 2)
- `deleteClientAction` returned `void` and ignored the Supabase delete error, so a database
  failure looked like success. It now returns the typed `ActionResult` (ARCH-04).

## Task 4 — Auth · `3d10f0c` · review rounds: 1

### Added
- Supabase SSR clients for server and browser (`src/lib/supabase/`).
- Login page with email/password form, Zod validation and field-level errors.
- Logout action.
- Route protection in `src/proxy.ts`: every route except `/login` requires a session,
  validated with `supabase.auth.getUser()`.
- Shared `ActionResult` type for Server Actions.

### Security
- Login errors return a generic message and do not reveal whether an email exists.

## Task 3b — Harden schema · `916f4ce` · review rounds: 1

### Changed
- `quote_items.quantity` is now `numeric(12,2)`; the domain validates at most 2 decimals.

### Security
- Insert/update policies verify that `client_id` and `quote_id` belong to `auth.uid()` (DB-06).
- All SQL functions pin `search_path = ''` and use schema-qualified names (DB-07).

## Guidelines v1.2 · `6a22f1a`

### Added
- `DB-06` to `DB-09`; `BIZ-03` clarified to allow quantities with up to 2 decimals.

## Task 3 — Database schema · `1ecd3ae` · review rounds: 1

### Added
- Migration `supabase/migrations/20261125120000_init_schema.sql`: `clients`, `quotes`,
  `quote_items`, with RLS and own-row policies on every table.
- Triggers that prevent updating or deleting an accepted quote and changing its items.
- `updated_at` maintenance triggers.

## Task 2 — Domain logic · `86bed99` · review rounds: 1

### Added
- Quote money logic in integer cents: line totals, subtotal, 21% VAT, total, half-up rounding.
- Status transition rules (`draft → sent`, `sent → accepted | rejected | draft`).
- Spanish NIF / NIE / CIF validation including the control character.
- Unit tests for all domain functions.

## Task 1b — Upgrade dependencies · `62ff4d9` · review rounds: 1

### Changed
- `next` and `eslint-config-next` 15.0.3 → 16.4.6; `react` and `react-dom` 19 RC → 19.3.1.

### Security
- `npm audit --omit=dev`: from several critical advisories to 0 vulnerabilities.

## Guidelines v1.1 · `8240d4d`

### Added
- `SEC-08` (dependency audit) and `DEP-01` to `DEP-03` (dependency versions).
- Testing runs `npm audit` and checks framework versions; Develop must use `@latest`.

## Task 1 — Scaffold · `be28714` · review rounds: 1

### Added
- Next.js App Router project with TypeScript strict, Tailwind CSS, ESLint and Vitest.
- npm scripts `lint`, `typecheck`, `test`, `build`.
- `.env.example` with empty Supabase variables; `.env*.local` git-ignored.

## Agent team · `8808a00`, `d323439`

### Added
- Orchestrator (`CLAUDE.md`), `develop` and `testing` subagents, and guidelines v1.0
  (`docs/DIRECTRICES.md`).
