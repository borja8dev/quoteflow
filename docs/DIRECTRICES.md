# DIRECTRICES — QuoteFlow guidelines

These are the rules **Develop must meet** and **Testing enforces**. Every rule has an ID, and
every Testing failure must cite one. If a rule is ambiguous, the Orchestrator asks the human —
nobody reinterprets it alone.

`SEC-*` and `CODE-*` apply to **every** task. The other groups apply when the task touches that area.

## SEC — Security

- **SEC-01** No secrets in the repository: no API keys, tokens, passwords or Supabase keys in
  code, tests, docs or committed files. Only `.env.example` with empty values is committed.
- **SEC-02** `.env*.local` and `.env` are listed in `.gitignore`.
- **SEC-03** The Supabase service role key is never used in application code.
- **SEC-04** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be exposed
  to the browser.
- **SEC-05** Every route under the protected area redirects unauthenticated users to `/login`
  (enforced in middleware).
- **SEC-06** Every Server Action checks the authenticated user before reading or writing data.
- **SEC-07** All user input is validated server-side with Zod before it reaches the database.

## CODE — Code quality

- **CODE-01** `npm run lint` passes with zero errors.
- **CODE-02** `npm run typecheck` passes; TypeScript `strict` is enabled.
- **CODE-03** No `any`, no `@ts-ignore`, no `@ts-expect-error` in `src/`.
- **CODE-04** No `console.log`, no commented-out code, no unused exports in `src/`.
- **CODE-05** `npm run build` passes.
- **CODE-06** Names and code are in English and descriptive.

## ARCH — Architecture

- **ARCH-01** Business rules live in `src/features/*/domain/` as pure functions (no React,
  no Supabase, no Next.js imports).
- **ARCH-02** Route files in `src/app/` contain no business logic; they compose features.
- **ARCH-03** Writes happen only through Server Actions in `src/features/*/actions.ts`.
- **ARCH-04** Server Actions return a typed result (`{ ok: true, data } | { ok: false, error }`)
  and never leak raw database errors to the client.
- **ARCH-05** Server code uses `lib/supabase/server.ts`; client components use
  `lib/supabase/client.ts` only.

## DB — Database

- **DB-01** Every schema change is a new SQL file in `supabase/migrations/`.
- **DB-02** Every table has Row Level Security enabled.
- **DB-03** Every table has a `user_id` column and policies that restrict select, insert, update
  and delete to `auth.uid() = user_id`.
- **DB-04** Foreign keys are declared (`quotes.client_id`, `quote_items.quote_id`) with explicit
  `on delete` behaviour.
- **DB-05** The rule "an accepted quote cannot be modified or deleted" is enforced in the
  database (trigger or policy), not only in the UI.

## BIZ — Business rules

- **BIZ-01** All money amounts are stored and computed as integer cents.
- **BIZ-02** Line total = quantity × unit price. Subtotal = sum of line totals.
  VAT = round(subtotal × 21 / 100). Total = subtotal + VAT. Rounding is half-up to the cent.
- **BIZ-03** Quantity is a positive number and unit price is ≥ 0. A quote needs at least one
  line item before it can be sent.
- **BIZ-04** Allowed status transitions: `draft → sent`, `sent → accepted`, `sent → rejected`,
  `sent → draft`. Any other transition is rejected.
- **BIZ-05** An `accepted` quote cannot be edited, have its items changed, or be deleted.
- **BIZ-06** Client tax ID is validated as a Spanish NIF, NIE or CIF, including the control
  character.
- **BIZ-07** Client email, when present, is a valid email address.

## TEST — Tests

- **TEST-01** `npm run test` passes.
- **TEST-02** Every pure function in `domain/` has unit tests.
- **TEST-03** Domain tests cover the happy path **and** edge cases: rounding, zero/negative
  values, every forbidden status transition, valid and invalid NIF/NIE/CIF.
- **TEST-04** Tests are deterministic: no network, no real database, no dependence on the
  current date.

## UI — User interface

- **UI-01** Every form input has an associated `<label>`.
- **UI-02** Every data list has loading, empty and error states.
- **UI-03** Form validation errors are shown next to the field that caused them.
- **UI-04** Layouts work at 375px width (mobile) without horizontal scroll.
- **UI-05** Amounts are displayed in euros with Spanish formatting (e.g. `1.234,56 €`).
- **UI-06** Locked (accepted) quotes show no edit or delete controls.

## DOC — Documentation

- **DOC-01** `README.md` explains: what the app is, local setup, environment variables,
  how to run migrations, how to deploy to Vercel, and the demo user.
- **DOC-02** `docs/TASKS.md` is updated by the Orchestrator after every `PASS`.
