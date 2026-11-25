# Changelog

All notable changes to QuoteFlow, one entry per task, newest first. The Orchestrator adds an
entry after every Testing `PASS`, in the same commit as the code (so entries written from task 6
onwards carry no commit hash; use `git log -- docs/CHANGELOG.md` to find it). Format based on [Keep a Changelog](https://keepachangelog.com/).
The reasons behind guideline changes are in [`DEVELOPMENT_LOG.md`](./DEVELOPMENT_LOG.md).

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
