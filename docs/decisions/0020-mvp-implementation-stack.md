# 0020 Development stack for the first working slice (recommendation, awaiting founder approval)

- Status: proposed (recommendation; not a decision)
- Date: 2026-10-31
- Decided by: pending Phil (backlog A-01; decision 0019 says the stack decision is still the founder's approval)

## Scope of this record

This recommends the **development stack for the first working slice**: what to build it with, locally, on synthetic data. It is not the full A-01 decision: backlog A-01 also depends on spikes S-03, S-04, S-11 and S-13, and production hosting is A-09. Ledger T-011 owns A-01; T-046 is its first, narrower step. Approving this record lets the slice start but does not choose realtime, storage, hosting or the production database, and any of those can still change the stack.

## Context

The first working slice (create event, save it, list events, open details) needs a stack. `CLAUDE.md` says no framework or provider is assumed until a decision record exists, and [0019](0019-milestone-1-development-authorised-with-synthetic-data.md) says authorising Milestone 1 does not choose a stack. The shortlist ([stack-and-hosting-shortlist.md](../research/stack-and-hosting-shortlist.md), no decision) leaves the choice to A-01. Constraints that bind this choice: modular monolith ([0006](0006-modular-monolith-direction.md), still only proposed, so this record follows its direction without treating it as settled); relational database with transactions and, ideally, row-level security (AS-4, AS-6); local development with no accounts, no spend and no Docker or WSL2 (this machine has neither, and installing them is not approved); Windows; one founder plus Claude Code; synthetic data only.

This machine has Node.js 24.14 and npm 11.9 (observed 2026-10-31) and Python 3.11.

## Evidence labels used below

**Verified (summary)** means a fetch agent read the vendor or project page on 2026-10-31 and reported it; the reports mix verbatim text and summaries, and I did not re-read the pages myself. **Judgement** is my reasoning, unmeasured. Page URLs are in the evidence section. Versions change; re-check at install time.

## Recommendation

| Layer | Choice | Why (judgement unless marked) |
|---|---|---|
| Language | TypeScript, strict mode, on Node.js 24 LTS | One language for server, browser, future worker and PWA. Node 24 is already installed. The shortlist lists v24 as an LTS line (verified 2026-10-30); the end-of-life date still needs checking before production |
| Web framework | Next.js 16 (App Router), run as a long-lived Node server (`next start`) | Most widely used React framework, so the most examples and library support for the agents and the founder. Official docs list 16.x as Active LTS and require Node 20.9 or later, and list Windows as supported (verified by summary 2026-10-31). It runs as a normal Node process, which keeps the monolith and later SSE or WebSockets possible (S-03). Server-only platform features are avoided |
| Validation | Zod 4 | One schema for form, server and tests. The Zod site says "Zod 4 is stable" (verified by summary) |
| Database, now | PostgreSQL-compatible SQL on **PGlite** (Postgres compiled to WASM, in-process, data kept in a local folder), pinned version | Real Postgres SQL with no install, no account, no Docker. Keeps the door open to Postgres, RLS and transactions (AS-4, AS-6). **Risks (verified by summary): PGlite's own README labels it Alpha and says it is single user and connection; its docs do not mention row-level security or roles, so RLS on PGlite is unproven** |
| Data access | Plain SQL migration files applied in order by a small runner (about 30 lines, recorded in a migrations table), and a small repository layer; every query parameterised (no string-built SQL); no ORM yet | Drizzle has a PGlite driver and RLS helpers, but its PGlite guide installs release-candidate packages and drizzle-kit against PGlite is not documented (verified by summary). Plain SQL is portable to any Postgres and avoids that risk. An ORM can be added later by a separate decision |
| Database, later | Managed or self-run PostgreSQL with row-level security, region chosen under A-09 | Not decided here. Real guest data stays gated |
| Tests | Vitest 5 (Node 22.12 or later required, verified), Testing Library for components later, Playwright for end-to-end later | Fast, TypeScript-native, no accounts |
| Authentication | Deferred for the local slice. Every row belongs to a fixed local "demo account" (`account_id`), and all queries go through one repository that takes the account as an argument | Architecture 6 keeps the identity method swappable. The prototype must say clearly that it has no sign-in and is not secure |
| Hosting | Local only for now | Production hosting is A-09; deploying needs separate approval |
| Realtime, storage, offline, CI | Not in the slice | Stay with their spikes (S-01, S-03, S-04) |

Judgement on Next.js: it is chosen for ecosystem and agent familiarity, not because it is proven for this product's offline PWA, display screens and realtime needs. Those live behind spikes S-01, S-03 and S-05 and the app code outside the framework (shared renderer, keyboard service, sync queue) should stay framework-independent as the shortlist suggests. If the founder prefers a lighter fit for kiosk displays and PWAs, SvelteKit is the alternative (option E below).

Not chosen: SvelteKit (smaller ecosystem, fewer accessible component examples), a separate API plus SPA (more plumbing), Python or Rails (a second language beside the browser code), microservices (decision 0006).

## Go/no-go gate before any slice code

First task after approval, with a small throwaway test: on this Windows machine install the pinned packages, start PGlite from a local folder, run a migration, create a role and a policy, and run a cross-account query as that role. Also run it with `next dev`, `next build` and the test runner together to see whether PGlite's single-process model collides with them. Decide from the result:

- Works: proceed with option A.
- RLS fails but everything else works: proceed with repository-level scoping for the slice, record that RLS is unproven, and plan a real Postgres for the RLS spike (needs your approval to install).
- PGlite is unstable on Windows or collides with the dev server: stop and return to you with options B, C or E.

## What this recommendation does not settle

- RLS: whether PGlite can enforce it is **untested**. First task after approval: a small test that creates a role, a policy and a cross-account query on PGlite. If it fails, tenant isolation relies on the repository layer plus tests for the slice, and a real Postgres is needed for the RLS spike (installing it needs your approval).
- PGlite stability (Alpha) and Windows behaviour for it are **not verified** beyond a docs read; the first install and test run will show. It is a development and test database only. No real guest data, no production use.
- Next.js version churn and its hosting coupling are judgement; the plan avoids platform-specific features.
- Prices and hosting are not part of this choice.

## Options for the founder

- **A (recommended):** the table above.
- **B:** same stack but SQLite (via a Node driver) for local storage. Simpler and more mature locally, but it drops Postgres SQL and RLS parity, so more rework later.
- **C:** same as A but a native PostgreSQL install on this machine for local development. Real RLS testing and no PGlite risk, but a host software install (needs your approval) and more setup for the founder.
- **D:** another stack, with your reasons.
- **E:** the same as A but SvelteKit instead of Next.js.
- Also noted, not recommended: a plain JSON-file store for the very first slice (simplest, but throwaway work and no transactions), and a portable or embedded real PostgreSQL build that I have not researched (it may exist; unverified). The shortlist calls SQLite a spike-only curiosity for the production workload; B is for local storage only and that remains a judgement.

## The first slice, once a stack is approved

User journey: open the application, create an event (name, date, location, optional description), save it, see the list of events, open an event's details. UK English. Responsive. Validation messages for missing or invalid fields. No sign-in, labelled clearly on every page with a banner ("Local prototype: no sign-in, not secure, synthetic data only"). The server binds to localhost only, the account is read from server configuration and never from the request, and no request value can select another account. A fixed local demo account owns every event and every query is scoped to it, so a real account boundary can replace it later. No billing, no guest data, no later-product features.

Details to fix in the slice task: event date is a calendar date with an optional start time and time zone kept as Europe/London for now (to be confirmed); name up to 120 characters, location up to 200, description up to 2,000; identifiers are UUIDs (consistent with decision 0007's direction); an unknown or other-account event id returns a plain not-found page; all output is escaped; the pages meet the accessibility baseline in decision 0016 (labels, focus, contrast, keyboard use) and the list and details pages work on a phone width. Who may create events (decision 0011's owner and collaborator roles) is not modelled yet and is listed as deferred.

Acceptance criteria: documented install, start and test commands; tests for creating a valid event, rejecting invalid data, saving and retrieving, listing, an injection test with hostile input, and repository-level account separation (an event created under one account is not returned for another). The separation test shows the repository scopes correctly; it is **not** evidence of tenant isolation, which needs the cross-tenant suite in spec section 11.1 later; tests run in the founder-supervised session with results recorded as observed; independent review; secret scan; ledger updated; pushed on a task branch only.

## Consequences

- If approved, the go/no-go gate runs first, then the slice (ledger T-047), using Node and npm only.
- The architecture document should record the approved stack as the answer to A-01 and mark any assumptions revised.
- If not approved, no dependent code is written.

## Evidence / sources

Pages read through a fetch agent on 2026-10-31: https://pglite.dev/docs/ , https://pglite.dev/docs/api , https://pglite.dev/docs/filesystems , https://github.com/electric-sql/pglite (README: "Status - Alpha", "PGlite is single user/connection"), https://orm.drizzle.team/docs/connect-pglite , https://orm.drizzle.team/docs/rls , https://nextjs.org/docs/app/getting-started/installation (Node 20.9 minimum), https://nextjs.org/support-policy (16.x Active LTS), https://vitest.dev/guide/ (Node 22.12 minimum), https://zod.dev/ ("Zod 4 is stable").

Shortlist note (sources S1 to S14, accessed 2026-10-30). Documentation read 2026-10-31 through a fetch agent (parts are summaries): PGlite docs and README (pglite.dev, github.com/electric-sql/pglite), Drizzle docs (orm.drizzle.team), Next.js installation and support policy pages (nextjs.org), Vitest guide (vitest.dev), Zod (zod.dev). Not read: package registry pages, Next.js self-hosting page, Drizzle migrations pages. Local tool versions observed by running `node --version` and `npm --version`.
