# Development log — QuoteFlow

How QuoteFlow was built: the agent workflow, what each task delivered, and how the
guidelines evolved when human review found gaps. For a per-task list of changes, see
[`CHANGELOG.md`](./CHANGELOG.md).

## 1. Setup

### Agent team

| Agent | Definition | Responsibility |
|---|---|---|
| Orchestrator | [`CLAUDE.md`](../CLAUDE.md) | Plans tasks in [`TASKS.md`](./TASKS.md), delegates, loops until `PASS`, commits. Never writes application code. |
| Develop | [`.claude/agents/develop.md`](../.claude/agents/develop.md) | Implements tasks and fixes reported failures. Never approves its own work. |
| Testing | [`.claude/agents/testing.md`](../.claude/agents/testing.md) | Read-only reviewer (no write/edit tools). Runs lint, typecheck, tests, build and audit, and checks every applicable rule. Returns `PASS` or `FAIL` with failures that cite a guideline ID. |

The contract between Develop and Testing is [`DIRECTRICES.md`](./DIRECTRICES.md): rules with
stable IDs (`SEC`, `CODE`, `DEP`, `ARCH`, `DB`, `BIZ`, `TEST`, `UI`, `DOC`).

### Isolated execution environment

The developer's machine has a global Claude Code configuration with its own agents, plugins
and instructions. To make sure **only the three agents in this repository** did the work, the
project ran with a dedicated configuration directory:

```bash
CLAUDE_CONFIG_DIR=$HOME/.claude-prueba claude
```

and the global `CLAUDE.md` was excluded with the `claudeMdExcludes` setting. `/agents` lists
only `develop` and `testing`.

### Workflow per task

```
Orchestrator → Develop (implement) → Testing (review)
                    ▲                      │
                    └──── FAIL: failures ──┘
                          PASS: TASKS.md updated, one Conventional Commit
```

The loop escalates to the human after 5 failed iterations. Steps that touch external services
(Supabase project, applying SQL, Vercel, pushing to GitHub) are always done by the human.

## 2. Timeline

| # | Task | Commit | Review rounds | Notes |
|---|---|---|---|---|
| — | Agent team | `8808a00`, `d323439` | — | Orchestrator, Develop, Testing and guidelines v1.0. |
| 1 | Scaffold | `be28714` | 1 | Next.js, TypeScript strict, Tailwind, ESLint, Vitest. |
| — | Guidelines v1.1 | `8240d4d` | — | Dependency security rules (see §3.1). |
| 1b | Upgrade dependencies | `62ff4d9` | 1 | Next.js 16 and React 19 stable; `npm audit` clean. |
| 2 | Domain logic | `86bed99` | 1 | Money in integer cents, 21% VAT, status transitions, NIF/NIE/CIF validation. |
| 3 | Database schema | `1ecd3ae` | 1 | Tables, RLS, accepted-quote lock triggers. |
| — | Guidelines v1.2 | `6a22f1a` | — | Schema rules (see §3.2). |
| 3b | Harden schema | `916f4ce` | 1 | Cross-user checks in RLS, pinned `search_path`, `numeric(12,2)` quantity. |
| 4 | Auth | `3d10f0c` | 1 | Supabase SSR auth, login/logout, route protection with `proxy.ts`. |
| 5 | Clients CRUD | `a9b9802` | **2** | First `FAIL` from Testing (see §2.1). |
| 6 | Quotes CRUD | `d8bc2e6` | **2** | Testing caught VAT recomputed outside the domain (`BIZ-02`, `ARCH-01`). |
| — | Guidelines v1.3 | `0270ddc` | — | Table grants and error logging (see §3.3). |
| 6b | Grants and error logging | `2c56303` | 1 | New migration with explicit grants; data layer logs DB errors. Verified live in the browser. |
| 7 | Dashboard | `049b729` | 1 | Quote count per status and total accepted amount. |
| 7b | Dashboard aggregation in the domain | `6024162` | 1 | Human review: aggregation lived in the data layer without tests (`ARCH-01`). Moved to a pure function with 6 tests. |
| 8 | Deploy readiness | `7b13aff` | 1 | README with setup, migrations, Vercel deploy and demo user. |

### 2.1 The review loop in action (task 5)

Round 1 passed lint, typecheck, 81 tests, build and audit, but Testing returned `FAIL`:

> `[ARCH-04]` `deleteClientAction` returns `Promise<void>` instead of the typed `ActionResult`,
> and ignores the error returned by Supabase's `.delete()`, so a database failure is
> indistinguishable from success.

The Orchestrator sent the failure list verbatim to Develop, which changed the action to return
`ActionResult` and surface the error. Round 2 returned `PASS`. Automated checks were green in
both rounds: this was caught by the guideline review, not by the toolchain.

## 3. Guideline evolution (human review)

Testing approves strictly against the guidelines. Three times, human review found a real problem
that Testing approved **because no rule covered it**. In both cases the fix was the same:
add the missing rule, update the agents, then send a corrective task through the normal loop.
The guidelines are the contract, so they are what gets improved.

### 3.1 v1.1 — Dependency security (after task 1)

- **Finding:** the scaffold pinned `next@15.0.3` and a React 19 release candidate, versions
  written from model memory. `npm audit` reported critical advisories, including remote code
  execution in the React Server Components protocol and an authorization bypass in Next.js
  middleware — the mechanism planned for route protection.
- **Rules added:** `SEC-08` (zero high/critical audit findings) and `DEP-01..03` (latest stable
  framework versions, no pre-releases, versions resolved by the package manager, never typed
  from memory).
- **Agent changes:** Testing runs `npm audit` and compares versions with the registry; Develop
  must use `@latest` and pass the audit before reporting.
- **Result:** task 1b upgraded to Next.js 16.4.6 and React 19.3.1 with 0 vulnerabilities.

### 3.2 v1.2 — Schema consistency and tenant isolation (after task 3)

- **Findings** in the not-yet-applied migration:
  1. Insert/update policies checked `user_id` but not that `client_id` / `quote_id` belonged to
     the same user. Foreign key checks bypass RLS, so a user could reference another user's rows.
  2. The domain accepted fractional quantities (for example 1.5 hours) while the column was
     `integer`.
  3. SQL functions did not pin `search_path`.
- **Rules added:** `DB-06` (no cross-user references), `DB-07` (explicit `search_path`), `DB-08`
  (database types match the domain), `DB-09` (an unapplied migration may be corrected in place);
  `BIZ-03` clarified (quantity up to 2 decimals).
- **Result:** task 3b fixed the migration before it ever reached the database.

### 3.3 v1.3 — Table privileges and error visibility (after task 6)

- **Finding:** a manual browser test of `/quotes/new` showed "We could not load your clients"
  although all automated checks were green. A read-only catalog query
  (`information_schema.role_table_grants`) showed that `authenticated` had only
  `REFERENCES, TRIGGER, TRUNCATE` on the three tables: no `SELECT`, `INSERT`, `UPDATE` or
  `DELETE`. RLS policies were correct, but RLS only filters rows; without a `GRANT` the role
  cannot access the table. The project's Data API does not grant new tables automatically.
- **Why it took a manual test to find it:** unit tests do not hit the real database, and the
  data layer mapped the Supabase error to a generic message without logging it, so the
  real cause (`42501 permission denied`) was invisible.
- **Rules added:** `DB-10` (explicit grants to `authenticated`, none to `anon`) and `ARCH-06`
  (log database errors server-side before mapping them); `CODE-04` updated accordingly.
- **Result:** corrective task 6b (new migration with grants, error logging in the data layer).

## 4. Human-in-the-loop steps

| Step | Done by | Verification |
|---|---|---|
| Supabase project (free plan, EU region) | Human | — |
| `.env.local` with public URL and anon key | Human | File is git-ignored; format checked without reading values. |
| Migration applied in the Supabase SQL editor | Human | Read-only catalog query: RLS on 3/3 tables, 4 policies per table, `search_path` pinned on 3/3 functions, expected trigger counts. |
| Demo user (auto-confirmed) | Human | Login tested on the running app. |
| Route protection | Human + browser check | `/` redirects to `/login` without a session; wrong credentials return a generic error. |
| Public GitHub repository | Human | History scanned for `.env` files and keys before the first push. |
| Vercel deploy (Hobby plan) | Human | Only the two public Supabase variables configured; Supabase integration not added. Deployment Protection disabled; production URL checked without a Vercel session: `/` and `/clients` redirect to `/login`, login works in an incognito window. |

## 5. Lessons learned

- An automated reviewer is only as strict as its rules. The value of the human is spotting what
  the rules miss and turning it into a new rule, not fixing the code by hand.
- Dependency versions must come from the registry, not from a model's memory.
- In Postgres, foreign keys do not respect RLS; ownership of referenced rows must be checked in
  the policies.
- External and irreversible steps (databases, deploys, publishing) stay under human control.
