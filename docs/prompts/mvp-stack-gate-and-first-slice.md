# Events Company — Stack Gate and First Working Slice

## Founder decision

Option A is approved for the first local MVP slice, conditional on the technical go/no-go gate passing.

Approved stack:
- TypeScript
- Node.js 24
- Next.js 16, App Router, Node server
- Zod 4
- Vitest 5
- PGlite (`@electric-sql/pglite`)
- Plain SQL migrations and a small repository layer
- Fixed synthetic demo account; no authentication in this slice

ADR 0020 remains scoped to the first slice. Do not treat PGlite as an approved production database.

## Objective

Deliver working software:

Create event → Save event → List events → View event details.

Do not spend this task expanding the AI agent framework.

## Stage 1 — Establish the implementation baseline

Read CLAUDE.md, ADRs 0019 and 0020, the MVP master specification, the delivery backlog, technical risks, the task ledger and existing implementation files.

Verify branch ancestry and identify dependencies on unmerged task branches.

Follow the project's task-scope, author/reviewer, secrets-check and Git requirements.

Do not merge into main.

## Stage 2 — Run the go/no-go spike

Use a disposable local directory and synthetic data.

Verify:

1. Node 24 and the package manager work on Windows.
2. The selected dependencies install without unexpected native tooling or external accounts.
3. PGlite starts with filesystem persistence.
4. A SQL migration creates the required tables.
5. Inserted data survives database closure and reopening.
6. Two synthetic accounts can be represented.
7. Queries scoped to account A cannot retrieve account B's events.
8. A PostgreSQL role and row-level security policy can be created and tested, recording whether they are actually enforced.
9. Next.js starts locally.
10. Next.js production build completes.
11. Vitest executes a passing test.

Use the exact `@electric-sql/pglite` package; do not substitute similarly named packages.

Record actual command output, package versions and results.

Do not mistake application-level account filtering for database-enforced row-level security.

### Go/no-go rules

**GO:** The selected stack works locally, persistence is reliable in the tested scenario, and account-scoped repository queries behave correctly.

**CONDITIONAL GO:** The stack works, but database-enforced row-level security is unavailable or unproven. Continue only with an explicitly documented synthetic-only prototype limitation, provided ADR 0020 permits that limitation.

**NO-GO:** PGlite fails persistence, the framework and database cannot work together reliably, or the development environment cannot build or test the application.

On NO-GO, stop before implementing the slice and report the evidence and recommended alternative.

Do not spend excessive time repairing an unsuitable dependency.

## Stage 3 — Implement the first vertical slice

Only after GO or an authorised CONDITIONAL GO:

Build a locally runnable application with:

- Events Company dashboard.
- Event creation form.
- Event name, date, location and optional description.
- Server-side Zod validation.
- UUID event identifiers.
- SQL-backed persistence.
- Event listing.
- Event details page.
- Not-found handling.
- Useful validation and error messages.
- Responsive layout.
- Accessible labels and keyboard navigation.

Enforce the field-length limits and other acceptance criteria in ADR 0020.

Use a fixed local demo account and scope every event query to that account.

Display a prominent warning:

"Local demonstration only — no sign-in or production security."

Bind the development application to localhost.

Do not implement real authentication, guest records, payments or public deployment.

## Stage 4 — Automated verification

Test:

- Valid event creation.
- Invalid input rejection.
- Persistence across database reopening.
- Event listing.
- Event details retrieval.
- Cross-account access rejection.
- Unknown event handling.

Run the actual test suite and production build.

Report failures accurately.

Perform a basic accessibility check.

## Stage 5 — Documentation and review

Document:

- Exact startup command.
- Exact test command.
- Database storage location.
- How to reset synthetic data.
- Implemented features.
- Known limitations.
- Next recommended Check-in Studio slice.

Obtain the required independent review.

Update ADR 0020 with the gate outcome and ledger entries T-046/T-047 as appropriate.

## Stage 6 — Git

Follow CLAUDE.md.

Use an appropriate task branch.

Check for secrets and generated database files.

Commit and push only authorised changes.

Do not merge into main, force-push or deploy.

## Restrictions

No real guest data, external accounts, paid APIs, hosted services, bypassPermissions or nested headless sessions.

Normal local dependency installation is authorised for the approved stack. Do not install Docker, WSL2 or native PostgreSQL.

Do not activate the proposed Claude Code security configuration.

Do not use the exposed Google API keys.

## Final report

Provide:

1. Go/no-go outcome and evidence.
2. Working application features.
3. Test and build results.
4. Exact commands to start and use the application.
5. Known limitations.
6. Review findings.
7. Git branch, commit and verified remote hash.
8. Next recommended implementation slice.

Prioritise working software over additional planning.