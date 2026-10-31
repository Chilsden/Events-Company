# Independent review: Check-in Studio first slice (T-048)

Branch `task/mvp-checkin-slice`, working tree (uncommitted). Reviewer: fresh-context subagent, same model family as the author, so shared blind spots are possible. Static review plus the checks listed under "What I ran". No file other than this report was changed, and no mutation was applied (all mutations below were reasoned, not run).

Verdict: accept with changes. No Critical or High findings. The core design (conditional UPDATE, composite foreign keys, RLS, column-level grant) is sound. The main weaknesses are test strength (concurrency and role-switch are not really tested) and a few defence-in-depth and accessibility gaps.

## Findings

### Critical
None.

### High
None.

### Medium

**M1. The concurrency tests cannot detect a read-then-write implementation.** `web/tests/guests.test.ts` (test "concurrent attempts on one guest...", 25 parallel calls) and the 8-request smoke check. PGlite has one connection and serialises transactions, so a naive `select ... then update` would also give exactly one `checked_in`. These tests prove the logical outcome only. The README (line 75) and ADR 0021 say so honestly, but ledger T-048 states "8 simultaneous check-ins give one success" without the caveat, and prompt Stage 7 item 10 is therefore only met in letter. Fix: add the caveat to the ledger row; add, before real data, a test against real PostgreSQL with two connections (hold the first transaction open after its UPDATE, start the second, commit the first, assert the second gets 0 rows and logs `already_checked_in`).

**M2. Nothing tests that `asAccount` actually switches role and sets the account.** `web/src/server/scope.ts`. The role/RLS tests in `guests.test.ts` ("database constraints and access policies") use their own `inRole` helper, not `asAccount`. If `set local role events_app` were deleted from `asAccount`, every repository test would still pass because the explicit account and event filters do the work (the "RLS switched off" test even relies on that). RLS would silently stop applying in the app. Reasoned mutation: remove the `set local role` line, expected result: all 100 tests pass. Fix: a test that runs `asAccount(db, A, tx => tx.query("select current_user"))` and expects `events_app`, and one that reads `current_setting('app.account_id')` inside it.

**M3. Log-insert failure path is untested.** `guests-repository.ts` lines 74-77 and 85-90. By reading: the insert is inside the same `db.transaction`, so a failure throws, the transaction rolls back, the `checked_in_at` UPDATE is undone, and the action shows the "error" notice. That is the right behaviour (no check-in without its log row), but no test forces it (for example by revoking insert on `check_in_log` or dropping the table in a copy and asserting the guest stays unchecked in and the call rejects). Fix: add that test.

**M4. The database does not protect the "first timestamp" or the log/guest link.** `0002_guests.sql` lines 51-53. The application role has `update (checked_in_at)` and the UPDATE policy only checks account, so SQL run as `events_app` (a future code bug, or injection) can set `checked_in_at` to null or overwrite it, un-checking someone in or changing the first time, with no log row. The repository does not do this, and ADR 0021 says the role "cannot rewrite history", which overstates it for this column. Fix: a `before update` trigger on `guests` that raises if `old.checked_in_at is not null`, plus a test; or soften the ADR wording.

**M5. Accessibility: errors and notices are not reliably announced and focus is not managed.** `GuestForms.tsx` lines 24-28: the validation error is a plain `<p class="error">` (no `role="alert"`, focus not moved to the field or message); only the server-failure message has `role="alert"`. `GuestViews.tsx` `NoticeBanner`: after every action the page is a full reload (redirect), so the `role="status"`/`alert` element exists in the initial HTML rather than being inserted into a live region, and many screen readers do not announce it. Focus returns to the top of the document. Fix: give the validation error `role="alert"` (or focus the input on error) and put `tabIndex={-1}` plus `autoFocus`-style focus on the notice on load, or render a persistent empty live region.

**M6. Tablet UX: the page jumps to the top after each check-in.** `guest-actions.ts` `destination()`. For a long list the checked-in guest (highlighted with `g`) is off screen after the redirect, and the staff member loses their place. Fix: redirect with a fragment (`#guest-<id>`) and give the `<li>` that `id`; search is already preserved.

### Low

- **L1. Add guest is not idempotent.** `guest-actions.ts` `addGuestAction`: a double submit or a retry after a network error creates two guests with the same name. The button is disabled while pending (JS only). Acceptable for the slice; note it in limitations, or add a client-generated key later.
- **L2. Notice text can be forged from the address bar.** `check-in/page.tsx` lines 35-37: `?notice=checked-in&g=<uuid of a guest in this event>` displays "<name> is now checked in" without any action having happened. Same account and event only, so no leak, but a stale or shared URL shows a misleading success message after refresh. Fix: have the action return a one-time signal (cookie/flash) or word the banner neutrally.
- **L3. `now()` is the transaction start time**, used for both `checked_in_at` and `received_at`. Under real PostgreSQL with lock waits the "first" timestamp is when the winner's transaction began, not when it committed. Immaterial now; use `clock_timestamp()` or document.
- **L4. Unbounded log growth.** Every repeated tap on a stale page appends an `already_checked_in` row. Fine for a prototype; needs a retention/rate decision with the retention work (0014).
- **L5. Name validation allows invisible and bidirectional control characters** (`domain/guest.ts` line 28 rejects only C0/DEL). A name of only U+200B passes `trim().min(1)` and displays blank; bidi overrides can spoof the list. Fix: reject `\p{Cf}` and `\u0080-\u009F`, and require a visible character.
- **L6. Duplicate list fetch.** `check-in/page.tsx` lines 24-28 fetches the full list again when a search is active just to name the highlighted guest. Fine at this scale.
- **L7. Small targets.** "Clear search" (`Link`) and the "Back to event" link are plain inline links, under 44 px tall. Check-in buttons are 56 px min and other buttons 44 px, which is good.
- **L8. `check_in_log` insert policy does not restrict by guest state**, and `consent_records` has no explicit grant (correct: no access). Nothing further needed, noted for completeness.

### Confirmed good (checked, no finding)

- **Atomicity under READ COMMITTED (real PostgreSQL), by reasoning.** `UPDATE ... WHERE checked_in_at IS NULL` takes a row lock; a concurrent second UPDATE waits, then re-evaluates the WHERE on the committed new row version, matches nothing and returns zero rows. Only one request can reach the `checked_in` log insert. The loser then runs a plain SELECT (new snapshot per statement in READ COMMITTED) and sees the winner's committed row, so it returns the first timestamp unchanged. The log insert takes FOR KEY SHARE on the guest row, which does not conflict with the winner's FOR NO KEY UPDATE lock, so no deadlock. A lost-update or second `checked_in` log row is not possible. Not run against real PostgreSQL.
- **Rollback on failure:** whole check-in is one transaction (see M3 for the missing test).
- **Isolation.** Composite FKs `(event_id, account_id)` to `events` and `(guest_id, event_id, account_id)` to `guests` make a wrong-account or wrong-event row impossible even as owner (tested). RLS is enabled and forced on all three tables; select/insert/update policies on `account_id`. Update grant is column-level (`checked_in_at` only); no delete anywhere; `check_in_log` is insert/select only; `consent_records` has no grant for `events_app`. Every query also filters by `account_id` and `event_id`. `addGuest` uses `insert ... select ... where exists (event of this account)`. I found no way to read, create or modify a guest across account or event through the repository. The ids come from URL/form but go through `isUuid` and parameterised queries. `set local role` and `set_config(..., true)` are transaction-local so nothing leaks between requests. The account id is a fixed constant, never taken from the request.
- **Injection / XSS / redirect.** All SQL is parameterised; search uses `position(lower($3) in lower(name))` so `%` and `_` are literal (tested). Names render through React escaping (tested). Redirect targets are same-origin paths built from an `isUuid`-validated `eventId`; `notice` is allow-listed; `g` must be a UUID; `q` goes through `URLSearchParams` (encoded) after `cleanSearch`. No open redirect and no header injection. Server actions rely on Next's built-in Origin check for CSRF; there is no session to forge, and none is claimed. Errors log only `error.name`; user messages are generic; no guest names in logs or in `error.tsx`.
- **Requirements.** Guest model has account, event, guest ID (UUID), name, check-in status (derived from the timestamp), first check-in timestamp, creation timestamp. Consent skeleton has status, purpose, wording version, provenance (including `synthetic_test`), timestamps; unused, no application access, a guest with no row means no consent, and a test asserts guests do not create consent rows. Name only (a test asserts the column list). Add, validate with Zod, list, status, empty state (and empty search state), unknown/malformed event returns 404, no check-out/QR/offline, fixed demo account, no real auth, warning retained (smoke checks it). Link from event page to Check-in Studio exists. Totals come from `count(*)` on stored rows. Restart persistence is tested and smoked. UK English and Europe/London time formatting are used. Contrast: new colours are `#1f7a3d` and `#5fd68a` as borders (3:1 non-text needed; pass against white and the dark card respectively, computed by eye from the palette, not measured), and text uses existing tokens.
- **Secrets, personal data, generated files.** `.data/`, `.next/`, `node_modules/` are ignored (`git check-ignore` confirms `.next`; `.data` is in the root ignore file). Untracked files are source, one migration, tests and an ADR; none contains secrets or real people (synthetic names only, `.invalid` email only inside a test that checks it is ignored). The smoke script uses a temporary folder in the OS temp directory and removes it. The temporary build output `.next` was recreated by my build and is ignored.

### Documentation honesty

- README: accurate on features, reset, synthetic names, and has the concurrency caveat (line 75). Confirmed against what I ran.
- ADR 0021: accurate and caveats concurrency. One overstatement: "cannot ... rewrite history" (see M4). Status "proposed" is appropriate.
- Ledger T-048: counts match what I observed (100 tests in 5 files, 40 of 40 smoke checks, typecheck clean, build succeeded). It omits the PGlite concurrency caveat (M1). The mutation claim ("two mutations caught") could not be re-verified without editing source; I reasoned that dropping the `checked_in_at is null` guard fails the repeat/concurrent tests and dropping the event filter fails the cross-event test, which is consistent. Row T-046 and T-047 in the diff changed only whitespace (leading space and trailing spaces); harmless.

## Mutations reasoned (none run) and which tests would fail

| Mutation | Result |
|---|---|
| Remove `and checked_in_at is null` | Repeat and concurrent tests fail (second call reports `checked_in`) |
| Remove event filter in the UPDATE | Cross-event check-in test fails |
| Remove account filter in the UPDATE | Passes the normal cross-account test (RLS covers it); the "RLS switched off" test fails. Good coverage |
| Remove `set local role events_app` in `asAccount` | All tests pass (M2) |
| Replace conditional UPDATE by select then update | All tests pass under PGlite (M1) |
| Skip log insert on repeat | Repeat-check-in log assertion fails |
| Swap outcome labels | Fails |
| Make checked_in_at overwritten on repeat | Same-first-timestamp assertion fails |
| Drop composite FK on guests | FK rejection tests fail |
| Grant `update` on all guest columns | Column-permission tests fail |
| Allow `notice` values outside the list | Smoke "made-up notice" check fails |
| Escape removal in name rendering | React does it; the escape test fails only if markup is built by hand |

## What I ran and observed

In `web/`, local only, no network, no server on port 3000:
- `npx tsc --noEmit`: exit 0, no output.
- `npx vitest run`: 5 test files passed, 100 tests passed, 0 failed (about 41 s).
- `npm run build`: compiled successfully; routes listed include `/events/[id]/check-in`; no warnings shown.
- `npm run smoke` (127.0.0.1:3199, temporary data folder): "40 of 40 smoke checks passed", including add, check in, repeat, 8 simultaneous requests, cross-event refusal, restart persistence and "no errors in server output".

## What I could not check

- Behaviour against real PostgreSQL with several connections (analysis above is by reasoning). PGlite's handling of RLS and column grants is exercised by the tests but PGlite is alpha software.
- Browser behaviour: tablet layout, screen reader announcements, focus order, real touch target sizes, contrast measured in a browser. The axe tests use static markup in jsdom, which cannot judge live-region announcement or focus.
- Whether two server processes on one data folder are safe (the README says untested).
- Legal view of whether collecting names needs consent or a notice (open question S-10, for the adviser).
- Git state beyond `git status` (no commits made by me, nothing staged).
