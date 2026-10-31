# Independent review: decision 0020 (MVP implementation stack) and tasks T-046, T-047

Reviewer: fresh-context subagent, 2026-10-31. Scope: `docs/decisions/0020-mvp-implementation-stack.md`, `docs/prompts/mvp-first-working-slice.md`, the README index diff, ledger rows T-046 and T-047, and decisions 0006, 0007, 0011, 0019, the shortlist and architecture sections 2, 5, 6, 7, 9. No network, no files edited other than this report. Same-model limit applies (reviewer is the same model family as the drafter).

Verdict: accept with changes. The record stops correctly for founder approval and writes no code. The main problems are overstated evidence labels, a thin presentation of the simplest and safest alternatives, and a slice definition with several gaps.

## Critical

None.

## High

**H-1. "Verified" labels are stronger than the evidence recorded.** `0020:17-23`, `0020:58`.
The table marks Next.js 16 "Active LTS", Zod 4 "stable", Vitest 5 "Node 22.12 or later", Drizzle "release-candidate packages" and PGlite "Alpha, single connection" as "verified". The Evidence section says these came "through a fetch agent (parts are summaries)", with no URLs, no quoted text and no per-claim split. The shortlist (sources S1 to S14) contains only the Node.js claim; none of Next.js, Vitest, Zod, PGlite or Drizzle appears in it (grep returned nothing). CLAUDE.md section 7 requires source URLs, access dates and limitations. Version numbers such as "Next.js 16", "Vitest 5" and "Zod 4" also depend on the drafter's knowledge and are unconfirmed against any registry (the Evidence section admits registry pages were not read).
Fix: replace "verified" with "summary of fetched docs" for these rows, add the exact URLs with access date 2026-10-31 and the quoted line for each, and add a one-line "not checked against the package registry" caveat per pinned version. Keep "verified" only for the Node and npm versions observed locally and for the shortlist S1 claim.

**H-2. The simplest and safest local database option is not fairly offered, and the shortlist's own position is not engaged.** `0020:20,37-42`.
Option A rests on a self-described Alpha, single-connection, in-process database with RLS unproven. The record's justification ("keeps the door open to RLS") is the very thing it cannot show. Alternatives presented are SQLite (B) and native Postgres (C). Missing or under-argued:
1. SQLite is described as "more mature locally" but the shortlist (line 101) calls it a "spike-only curiosity" for this workload; the record does not reconcile this.
2. A real Postgres without Docker or WSL (for example a portable or embedded Postgres binary distribution run from a user folder, or a zip distribution) is not mentioned. It would give real RLS with no system install, though it may still count as software needing approval. Whether such a package is trustworthy, maintained and Windows-supported is unchecked and should be labelled so.
3. An "in-memory store behind the repository interface" for the very first slice is not offered. The slice has no real persistence requirement beyond "local persistent storage" in the prompt (`prompt:92`), so this is not a full alternative, but a file-based store would be the most trivial option.
Option C is presented as the heavier path, yet it is the only one that tests the architecture's RLS assumption (AS-6) immediately.
Fix: add an explicit "simplest viable" option and an "embedded or portable Postgres" option with unverified labels, state the cost of discovering PGlite is unusable after the slice is built (rework of SQL is small if the SQL is plain, which is a point in A's favour: say so), and recommend a go/no-go gate: the RLS and Windows PGlite test is the first task, and if it fails the founder decides between B and C before any slice code is written. Currently the slice (T-047) can "start immediately" (`0020:52`) in parallel with that test.

**H-3. The recommendation proceeds without the evidence the backlog says A-01 depends on, and the ledger duplicates an existing task.** `task-ledger.md:65` versus `task-ledger.md:30,37`; backlog A-01 (`MVP-DELIVERY-BACKLOG.md:59`).
Backlog A-01 depends on A-08, S-03, S-04, S-11 and S-13. Ledger T-011 is already "Stack decision record (backlog A-01)" depending on T-032 and T-018. T-046 re-describes A-01 with dependency T-032 only. 0020 correctly says realtime and storage stay with their spikes, but it still selects a framework and language ahead of S-03 (realtime on the chosen framework) and S-04. Decision 0019 says the stack is the founder's approval, so the founder can choose to proceed; the record should say plainly that this is a scoped development stack for the first slice, not the full A-01 answer, and that S-03/S-04/S-13 may revise it.
Fix: in 0020 add a status line "scoped to local development of the first slice; A-01 full closure still depends on S-03, S-04, S-11, S-13". In the ledger, either mark T-046 as a sub-task of T-011 with the dependency listed, or update T-011 to point to it, so there are not two rows owning the same decision.

## Medium

**M-1. Next.js fit for offline PWA, realtime and kiosk displays is argued by popularity, not by the product constraints.** `0020:18,28`.
The architecture needs a service-worker PWA with IndexedDB sync (arch 9, decision 0007), SSE or WebSocket displays that survive restart (arch 7, S-03), and likely always-on display clients. The record says the framework "keeps SSE or WebSockets possible" and "server-only platform features are avoided", but does not state: Next.js has no built-in service worker or offline support (judgement; unverified), custom WebSocket upgrade needs a custom server that conflicts with the standard `next start` model (unverified), the App Router's server components and server actions create framework-specific coupling, and Next major versions have churned (judgement, acknowledged in one line). The SvelteKit rejection reason ("smaller ecosystem") is also judgement. The shortlist (line 89) already flags that long-lived processes need testing (S-03, S-04); the record does not carry that over as a condition.
Fix: add a row of "known unknowns against our constraints" (offline service worker, realtime on `next start`, kiosk display bundle size) labelled unverified, and state that the choice is a development default that the S-03 spike may overturn. Offer a lighter option: a plain Node HTTP framework plus a small React or server-rendered front end, so the monolith core is not tied to Next.js. Keep Next.js as the recommendation if the founder prefers ecosystem, but show the trade-off.

**M-2. PGlite in a Next.js dev and build environment has an unaddressed concurrency risk.** `0020:20,34`.
"Single user and connection" plus in-process means a data directory can be opened by only one process. `next dev` hot reload, multiple route-handler bundles, `next build` static generation and parallel Vitest workers can each try to open the same folder. The record frames the risk as stability but not this specific failure mode (judgement, untested). Tests will need a separate data directory per worker or an in-memory instance.
Fix: add this to "does not settle", and add to T-047 acceptance: a single database module opened once per process, tests use isolated instances, and a restart-persistence test.

**M-3. Plain SQL without an ORM is reasonable but its cost is understated.** `0020:21`.
Rejection of Drizzle rests on RC packages and undocumented drizzle-kit/PGlite use (summary). That is fair. Missing: the cost of hand-written migrations, no migration runner chosen, no type-safe query layer, and SQL string handling risk. Parameterised queries must be mandated.
Fix: state the migration mechanism (numbered SQL files plus a tiny runner with a test), require parameterised queries, and add an injection test input to the invalid-data tests.

**M-4. "No-auth" slice is acceptable but its safeguards are not specified.** `0020:24,46`, `prompt:100-102`.
Next.js server actions and route handlers are network-reachable POST endpoints. With no sign-in, anyone who can reach the port can create events. The record says "labelled clearly" but does not require binding to localhost, not accepting `account_id` from request input, or a visible banner.
Fix: add acceptance criteria: server binds to 127.0.0.1 by default; account id comes only from server configuration, never from request data (with a test that a request carrying another account id is ignored); persistent on-screen "prototype, no sign-in, not secure" notice; no CORS opened.

**M-5. Slice acceptance criteria are not fully testable and leave common gaps.** `0020:46-48`, `prompt:83-96,126-132`.
- Event date: date-only or date-time, time zone (UK, BST/GMT) and past-date rules are unspecified. A date test cannot be written without it.
- Field length limits, trimming and whitespace-only names are unspecified; the "invalid data" test has no defined cases.
- Event identity: format (random non-guessable identifier versus sequential integer), and a test that opening a non-existent or another account's event returns not-found rather than leaking existence.
- Output escaping (a name containing markup is shown as text) is not listed.
- "Responsive", "clean", UK English and accessibility (decision 0016 is accepted and the architecture has accessibility hooks) are in the prompt but have no acceptance check. At least keyboard operation of the form and labelled inputs should be checked manually and recorded.
- "Event identity and account separation" is tested only at repository level with a caller-supplied account. That is honest but should be described as a repository-scoping test, not tenant isolation evidence (spec 11.1 is not met by it).
Fix: add the specifics above to the acceptance list in 0020 (or in T-047 once approved) and label the separation test accordingly.

**M-6. Prior decisions are treated as binding where they are only proposed.** `0020:9,28`.
Decision 0006 (modular monolith) is "proposed". The record cites it as a binding constraint and uses it to reject microservices. That is consistent with direction but not "settled". Decision 0007 (offline, accepted) and 0011 (account owners, accepted) are not cited at all, though 0011 means the event creator role (who may create an event) is explicitly unresolved and the slice's fixed demo account quietly assumes an answer. Not a reopening, but should be noted.
Fix: say "proposed, not yet accepted" where 0006 is cited; add a sentence that who may create an event is open (decision 0011, not decided), so the slice assumes nothing about it, and cite 0007 for offline-compatible choices (client-generated identifiers: use UUIDs from the start, which is also in line with 0007's idempotency consequence).

## Low

**L-1. Process consistency of 0020 with CLAUDE.md.** The record correctly states "proposed", "Decided by: pending Phil", and "If not approved, no dependent code is written". No code, config, `package.json` or scaffold exists (git status shows only the two docs, the record and the prompt). Good. Minor: "the slice can start immediately" (`0020:52`) should read "after approval and after the PGlite RLS test, if option A".

**L-2. Ledger and index consistency.**
- README row (`decisions/README.md` diff, new row after 0019) is consistent with the file, and "proposed, awaiting founder" is a status wording not used elsewhere (others use "proposed" or "accepted"). Harmless; consider "proposed" plus the note in the file.
- `task-ledger.md:65` T-046 status "in verification" while this review is the verification; update after the review is applied. Its "Blocker" column names founder approval, correct. The decision references column lists 0006, 0019, 0020 but omits 0007 and 0011.
- `task-ledger.md:66` T-047 is "blocked" with dependency T-046 only; add that it also needs the PGlite/RLS pre-test if option A.
- T-046 evidence says the documentation was read "via fetch agent"; this belongs next to the URL list (see H-1).
- The ledger row mentions branch `task/mvp-stack-decision`; the current branch matches.

**L-3. Prompt file.** `docs/prompts/mvp-first-working-slice.md` is untracked and contains instructions rather than data; it refers to "the two exposed Google API keys" without values (acceptable). It says to proceed to implementation after authorisation; the stop condition at `prompt:75` is the governing line and is honoured.

**L-4. Node and Vitest wording.** `0020:17` says the shortlist lists Node v24 as an LTS line; correct per shortlist line 73. The record omits that the shortlist said Active versus Maintenance and EOL were not stated, which the record only half repeats ("end-of-life date still needs checking"). Fine, but pin the Node version in the slice's documentation.

**L-5. Secrets and personal data.** Grepped 0020 and the prompt for key patterns and secret words: no secret values, no personal data. The ledger rows contain none. The founder's first name appears as the decider only.

## What I could not check

- Whether any of the Next.js, PGlite, Drizzle, Vitest or Zod claims are true; I had no network and the record gives no URLs. I only checked that the record's labels outrun its own evidence section.
- Whether PGlite supports roles or RLS on Windows, and whether an embedded or portable Postgres distribution exists and is acceptable; both unverified.
- Whether `node:sqlite` in Node 24 is stable enough for a dependency-free local option (unverified, from memory only).
- The master spec sections beyond what the architecture and backlog quote (I did not read the full MVP-MASTER-SPEC, 11.1 or section 16).
- Architecture sections 7 and 9 were read only through headings and the lines shown; I did not read all of the file.
- Nothing was run; no tests exist.
