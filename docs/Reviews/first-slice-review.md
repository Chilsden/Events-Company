# Independent review: first working slice (T-046 gate, T-047 application)

Reviewer: fresh-context subagent, 2026-10-31, branch `task/mvp-first-slice` (uncommitted tree). I did not write this code and edited nothing except this file. Scope: `web/`, `spikes/mvp-gate/`, ADR 0020, gate results, the prompt, ledger rows T-046 and T-047.

## Verdict

Accept with changes. The slice does what the prompt asks, and the claims I could reproduce held up. I found no Critical or High defects. There are four Medium findings (silent in-memory fallback, leaked PGlite instance on a failed start, tests that miss important mutations, no `color-scheme`) and several Low ones. None blocks a local, synthetic-data, founder-supervised demo.

## Findings

### Critical
None.

### High
None.

### Medium

M1. An empty `EVENTS_DATA_DIR` silently gives a non-persistent database. `web/src/server/database.ts:44` uses `??`, so `EVENTS_DATA_DIR=""` is kept as an empty string. `openDatabase` (lines 36-38) treats it as falsy, skips `mkdir` and calls `PGlite.create("")`, which I expect (read from code, not run) to be in memory. Events would vanish on restart with no warning. Fix: `process.env.EVENTS_DATA_DIR?.trim() || path.resolve(...)`, and add a test for the default-directory function.

M2. A failure after `PGlite.create` leaks an open instance. In `database.ts:38-41`, if `migrate` or `ensureAccount` throws, the open `db` is never closed. `getDatabase` (lines 52-55) clears the holder, so the next request opens a second PGlite on the same folder in the same process. The project itself says two instances on one folder are untested. Fix: wrap lines 39-40 in try/catch, `await db.close()` in the catch, rethrow.

M3. The tests would not catch several plausible regressions (see "Mutation analysis"). The main ones: removing the `account_id = $1` filter from `listEvents`/`getEvent` leaves all 45 tests green, because RLS masks it. Removing the DB `check` constraints is also undetected. Nothing tests `createEventAction`; it is exercised only by `npm run smoke`, which is not part of `npm test`. Fix: (a) a test that runs the repository queries where RLS does not apply (superuser connection) to prove the explicit filter; (b) direct DB-constraint tests (insert a 121-character name as superuser, expect failure); (c) an action test that mocks `next/navigation`, asserts `DEMO_ACCOUNT_ID` is the account passed, and that a repository error returns the generic message without echoing input.

M4. Dark mode form controls. `web/src/app/globals.css` switches colour variables with `prefers-color-scheme` but never declares `color-scheme: light dark`. The native date picker icon, scrollbars and autofill stay light-themed in dark mode, so the calendar button on `<input type="date">` may be nearly invisible on `#14171a`. I could not render it in a browser, so this is likely rather than confirmed. Fix: add `color-scheme: light dark;` to `:root` and check by eye.

### Low

L1. `database.ts:9` and `scripts/reset-data.mjs:5`: the migrations path and `.data` depend on `process.cwd()`. Starting `next start` from the repo root would fail to find `migrations/`. Fix: resolve from `import.meta.url`, or keep the README's `cd web` instruction (it is there).

L2. `reset-data.mjs` ignores `EVENTS_DATA_DIR`, though the README advertises that variable, so a user who set it will believe the reset worked. The guard "folder is named web" is weak. Fix: print which folder is removed; check `package.json` name `events-company-web` instead of the folder name; say so if `EVENTS_DATA_DIR` is set.

L3. `web/migrations/0001_init.sql:36`: `grant select on accounts to events_app` with no RLS on `accounts` lets the limited role read all account names. Harmless with one account; a cross-tenant leak once real accounts exist. Fix: enable and force RLS on `accounts`, or drop the grant.

L4. `0001_init.sql:30-31`: the policies have no `to events_app`, so they apply to PUBLIC. Make it explicit.

L5. `src/app/page.tsx:10`: "upcoming" uses the UTC date, so around midnight in UK summer time an event can be classed one hour early. Fix: compute today in `Europe/London`.

L6. `src/domain/event.ts`: Zod counts UTF-16 units, the database `char_length` counts code points, so Zod can reject a value the database would accept (stricter, never looser; safe). Name and location accept newlines, tabs and bidirectional control characters from a crafted POST (the regex deliberately allows tab, LF, CR). Escaping makes this non-exploitable; consider rejecting line breaks in `name` and `location`.

L7. `EventForm.tsx:25-35`: the error summary has `role="alert"` but focus is not moved to it and the first invalid field is not focused. Screen readers announce it; keyboard users must tab from the top. Error text is bold, not colour-only, but has no "Error:" prefix. Fix: focus the summary heading after a failed submit.

L8. The axe test renders only the pristine form (`tests/accessibility.test.tsx:32`). The error-state markup (`aria-invalid`, `aria-describedby` pointing at `*-error`, the summary) is untested. I checked by reading that the ids match. Fix: extract a presentational form view that takes state, and run axe on an error state.

L9. No `<title>` for the not-found page, and no `global-error.tsx`; an error in the root layout would show the framework default.

L10. `listEvents` is unbounded and the dashboard loads every event to show three. Fine for a demo.

L11. No security headers (CSP, frame options, referrer policy); `poweredByHeader: false` is set. Acceptable locally; list as a pre-deployment item. DNS rebinding from a hostile page in the same browser against an unauthenticated localhost server is theoretically possible, and Next's Origin check on server actions compares with the Host header, so rebinding would pass it. Consider adding "or any web page open in your browser" to the README warning.

L12. Double submit with JavaScript off can create duplicate events (the button is only disabled while pending when JS runs). Acceptable.

L13. `next-env.d.ts` is git-ignored while Next's own note says to commit generated files; a fresh clone type-checks properly only after the first `dev` or `build`. `npm ls` reports two extraneous packages (`@emnapi/runtime`, `@img/sharp-wasm32`); they appear in the lock file as optional Next/sharp dependencies, so I treat this as noise.

L14. `web/AGENTS.md` is a tool-generated block telling agents to read `node_modules/next/dist/docs/`. It does not conflict with CLAUDE.md, but it is a committed instruction file the founder should decide to keep or drop.

## 1. Requirements and ADR 0020 criteria

| Requirement | Result | Evidence |
|---|---|---|
| Dashboard, create form, list, details, not-found | Met | `src/app/**`, smoke 14/14 |
| Fields: name, date, location, optional description | Met | `EventForm.tsx`, schema |
| Limits 120 / 200 / 2000 | Met, enforced twice (Zod and DB check) | `event.ts:3`, `0001_init.sql:14-18`; boundary tests at the limit and limit plus one |
| UUID identifiers | Met (`gen_random_uuid()`; `isUuid` checked before lookup; non-UUID gives 404) | repository tests, smoke |
| Server-side Zod validation | Met; the form uses `noValidate`, so only the server validates | `actions.ts:16` |
| Banner exactly "Local demonstration only — no sign-in or production security." | Met, identical in `layout.tsx:15` and checked by smoke | |
| Localhost binding | Met for the `dev` and `start` scripts (`-H 127.0.0.1`) and the smoke server. Bare `next dev` would not bind that way; the README says to use the npm scripts | `package.json` |
| Fixed demo account scopes every query | Met: every page and the action pass `DEMO_ACCOUNT_ID`; the account is never read from the request; all three repository functions filter and run under RLS | |
| No faked auth, guests, billing, deployment | Met | file list, grep |
| Date | Calendar date only. The ADR's optional start time and time zone are deferred and that deviation is documented in the ADR and README | |
| Year range 2000-2100 | Not in the ADR; a sensible guard, documented in the README | |

Documentation inconsistency: the ADR 0020 body still specifies the banner "Local prototype: no sign-in, not secure, synthetic data only", while the code correctly follows the founder's later prompt text. The ADR H1 still says "(recommendation, awaiting founder approval)" though its status line and gate section say accepted. Fix both so the record matches the code.

## 2. Correctness and security

- SQL injection: all values use `$n` parameters. The only interpolated string is the constant `COLUMNS`; `set local role events_app` is a literal. The account id is validated as a UUID first. No issue.
- RLS: `set local role` and `set_config(..., true)` are transaction-local inside `db.transaction`, so they cannot leak to the next request, even after an error. `enable` and `force` row level security are present, with select and insert policies and no update/delete grants (tested). The superuser used for migration and `ensureAccount` bypasses RLS by nature; event queries never use it. PGlite's single-connection caveat is stated honestly in the gate results.
- UUID handling: regex accepts versions 1-8 with the RFC variant and rejects the nil UUID (fine).
- XSS: React escapes all output; no `dangerouslySetInnerHTML`. Smoke and a unit test confirm `<b>` and `<script>` are escaped. Hrefs are built from a validated UUID.
- Server action: `redirect()` is outside the try/catch (correct); the log line contains only `error.name`; unknown form keys, including `$ACTION_*`, are ignored; Next's default 1 MB body limit applies.
- Data dir: see M1. No path traversal concern because the value is operator-set, not request-set.
- Migrate: one transaction per file together with the `schema_migrations` row; lexical order; a rerun applies nothing (tested).
- Singleton: promise-shared, reset on failure, stored on `globalThis` for hot reload. Leak: M2.
- Error pages: `error.tsx` shows no message or stack. The dev overlay shows details but only on localhost.
- Exposure: both scripts and the smoke harness bind 127.0.0.1. I did not start a dev server on port 3000.

## 3. Mutation analysis (reasoned from reading the tests; I did not edit code)

| Mutation | Caught by `npm test`? |
|---|---|
| Remove `account_id = $1` from `listEvents`/`getEvent` | No (RLS still filters) |
| Remove RLS enable or the policies | Yes (database-enforced test, wrong-account insert test, no-account test) |
| Remove `force row level security` only | Probably not (tests use the non-owner role anyway) |
| Grant update/delete to `events_app` | Yes (permission denied test) |
| Remove Zod `.max` on name, location or description | Yes (boundary tests) |
| Remove the DB `check` limits | No |
| Make description required | Yes |
| `isUuid` accepts anything | Yes (non-UUID id test expects null) |
| Action takes the account from form data | No (not in `npm test`; smoke would not notice either) |
| `redirect` moved inside the try/catch | No in `npm test`; smoke would catch it |
| Action logs user input | No |
| Banner removed or reworded | Only by smoke, not `npm test` |
| `set_config(..., false)` (session-wide) | No |
| Boundary dates 2000-01-01, 2100-12-31, leap day 2028-02-29 | Not tested (1999-12-31 and 2101-01-01 are) |
| Default data dir ignores the env var | No |

What is good: boundary values on both sides of each limit; hostile SQL stored literally; RLS tested without the repository filter; persistence tested by a real close and reopen on disk; role cannot update or delete; the migrations-run-once test is real behaviour, not a restatement.

## 4. Honesty of docs

- README: "45 unit and integration tests" matches the observed 45. "14 of 14" smoke matches. Start and test commands match `package.json`. The statement that colour contrast was not checked automatically is accurate; I computed it (below).
- Gate results: the eleven checks are plausible. The committed spike scripts cover rows 3-8 (`gate-pglite.mjs`) and 9-10 (`probe-next.mjs`). Row 11 ("1 test passed") has no committed spike, so it cannot be re-run from `spikes/mvp-gate/`; the application's 45 tests are stronger evidence anyway. Versions in the results match `npm ls`. The spike's RLS test used session-level `set role` and `set app.account_id`, while the app uses transaction-local settings; the application's behaviour is what the repository tests prove. I could not verify the "about 25 s" install time.
- No overstatement found in the "GO" outcome relative to its own rules. The ledger T-046 "done (accepted for first slice)" is fair; T-047 "in verification" is accurate. The ledger claim "`next dev` served all pages" I did not re-verify.
- Stale ADR text: see section 1.

## 5. Files that should not be committed

`git status --ignored` shows `web/.next/`, `web/node_modules/`, `web/tsconfig.tsbuildinfo` and `web/next-env.d.ts` ignored. `web/.data` does not exist after my smoke run (smoke uses a temp directory and removed it). A search of `web/` and `spikes/mvp-gate/` for `C:\Users`, `phili`, `api_key`, `secret`, `password` found nothing outside generated files. `package-lock.json` is present, `package.json` versions are exact, and `npm ls` shows no missing or invalid packages. `web/` is untracked, so CLAUDE.md's rule applies: add explicit paths, never `git add -A`.

## 6. Accessibility

Positives: labels bound with `for`/`id`, required and optional stated in label text, hints and errors linked by `aria-describedby`, `aria-invalid`, skip link, `main tabIndex=-1` as target, `lang="en-GB"`, 3px focus outline, 44px minimum targets, error summary with links to fields, responsive layout with 16px gutters.

Contrast ratios computed from the CSS variables (WCAG formula, my own script):

| Pair | Light | Dark |
|---|---|---|
| Text on background | 17.40 | 15.93 |
| Muted text on background / on card | 8.86 / 8.26 | 10.32 / 9.19 |
| Link on background / on card | 8.40 / 7.83 | 8.56 / 7.62 |
| Button text on button | 8.40 | 8.35 |
| Disabled button (opacity .6, approximate blend; exempt) | 3.16 | 3.82 |
| Error text on background / on card | 7.97 / 7.43 | 8.93 / 7.96 |
| Banner text on banner | 10.48 | 9.95 |
| Input border on background (needs 3:1) | 4.54 | 5.60 |
| Card border on card | 4.23 | 4.99 |

All pass AA; all but the disabled button pass AAA for text. These are computed values, not a rendered browser check. Open issues: M4, L7, L8, L9.

## 7. CLAUDE.md and founder restrictions

No contradiction found: synthetic data only, no external accounts, no real auth, no deployment, no Docker or WSL, no `bypassPermissions`. Process items for the main session: the work is uncommitted on `task/mvp-first-slice`; commit explicit paths after a secrets scan, push the task branch only, never `main`; record this review in ledger T-047.

## What I ran and observed

- `npx tsc --noEmit` in `web`: exit 0, no output.
- `npx vitest run`: 3 test files passed, 45 tests passed, 0 failed, about 17 s.
- `npm run build`: Next.js 16.4.3 (Turbopack) compiled, TypeScript passed, 3 static pages generated; routes `/`, `/events`, `/events/[id]` dynamic, `/events/new` and `/_not-found` static; no warnings printed.
- `npm run smoke`: 14 of 14 checks passed (server start on 127.0.0.1:3199, banner, empty dashboard, labelled fields, invalid rejection, valid redirect, details, escaping, list link, unknown id 404, malformed id 404, restart, persistence after restart, no server errors).
- `npm ls --depth=0`: pinned versions match; two extraneous optional packages.
- Contrast ratios: computed with a small Node script.

## What I could not check

Rendering in a real browser (dark-mode date picker, focus ring, phone widths); screen reader behaviour; `next dev` (not started, to respect the port restriction); the empty `EVENTS_DATA_DIR` and leaked-instance cases (reasoned from code, not run); kill-during-write recovery, two processes on one folder, load; the mutations in section 3 (reasoned, not applied because I may not edit code); the install time; the network-sourced evidence in ADR 0020 (no network allowed).
