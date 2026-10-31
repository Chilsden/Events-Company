# MVP stack go/no-go gate: results (2026-10-31)

Gate for decision [0020](../decisions/0020-mvp-implementation-stack.md), option A, approved by the founder for the first local slice on condition that this gate passes. Prompt: [mvp-stack-gate-and-first-slice.md](../prompts/mvp-stack-gate-and-first-slice.md).

**Outcome: GO.** Persistence worked, account-scoped queries behaved correctly, and database-enforced row-level security worked in the tested scenario. One configuration requirement was found.

Method: a disposable folder in the Windows temp directory, synthetic data, Node v24.14.0, npm 11.9.0, Windows 11. The scripts are kept in [spikes/mvp-gate/](../../spikes/mvp-gate/) (`gate-pglite.mjs`, `probe-next.mjs`). All results below were observed by running them.

## Versions installed (observed with `npm ls`)

next 16.4.3, react and react-dom 19.3.1, zod 4.6.7, @electric-sql/pglite 0.5.13 (the exact package named in the prompt), vitest 5.0.5, typescript 7.0.2, @types/node (pinned to 24 in the application). PGlite reports PostgreSQL 18.6.

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Node 24 and npm work on Windows | Pass | `node --version` v24.14.0; `npm --version` 11.9.0 |
| 2 | Dependencies install with no native tooling or accounts | Pass | `npm install` of the approved packages took about 25 s; no compiler, Python or login was needed |
| 3 | PGlite starts with filesystem persistence | Pass | `PGlite.create("./gate-data")` returned PostgreSQL 18.6 (PGlite 0.5.13) |
| 4 | A SQL migration creates the tables | Pass | 2 tables created (accounts, events) |
| 5 | Data survives close and reopen | Pass | After `db.close()` and a new `PGlite.create`, both inserted events were returned |
| 6 | Two accounts can be represented | Pass | Two synthetic accounts, one event each |
| 7 | Account A queries cannot return account B's events | Pass | Scoped list returned only A's event; asking for B's event id under A returned 0 rows |
| 8 | Role and row-level security can be created and are enforced | Pass | `create role`, `enable and force row level security` and policies were accepted. As the limited role: account A saw only A's row, B only B's, no account set saw 0 rows, and an insert for the wrong account failed with "new row violates row-level security policy". Tested on a single connection |
| 9 | Next.js starts locally | Pass | `next dev` and `next start` both served pages on 127.0.0.1 |
| 10 | Next.js production build completes | Pass | `next build` succeeded (Turbopack, TypeScript 7.0.2) |
| 11 | Vitest runs a passing test | Pass | 1 test passed |

## Finding: PGlite must not be bundled

The first run of Next.js with PGlite inside a route failed on every request (HTTP 500: `The "path" argument must be of type string or an instance of Buffer or URL. Received an instance of URL`). Adding `serverExternalPackages: ["@electric-sql/pglite"]` to `next.config.mjs` fixed it. After the fix, in both `next dev` and `next start`: the page loaded, 6 writes (5 of them concurrent) all returned 200, and the count was correct. In dev, editing a source file (hot reload) and writing again also worked with no lock error. The configuration is in the application.

## Not tested

Crash or kill-during-write recovery; two server processes on one data folder (do not do this); load; behaviour on other operating systems; PGlite upgrades; row-level security with several connections (PGlite has one). The spike deviated from the prompt by one early mistake of mine: the throwaway `package.json` had `"type": "commonjs"` from `npm init`, which made the first build fail until it was set to `module`; that was a spike set-up error, not a stack problem.

## Recommendation

GO, as decision 0020 option A. Row-level security enforcement in PGlite is now observed rather than unproven, but it is a development database: production Postgres behaviour with several connections and roles still needs its own spike (S-06, A-09).
