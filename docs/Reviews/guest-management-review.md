# Independent review: Check-in Studio guest management (T-049)

- Branch: `task/mvp-guest-management` (uncommitted working tree on top of a55070d)
- Reviewer: independent reviewer, fresh context, did not write the code. Date 2026-10-31.
- Scope: prompt `docs/prompts/mvp-checkin-guest-management.md`, migrations 0001-0004, everything under `web/src`, `web/tests`, `web/scripts`, `web/public`, ADR 0021/0022, README, checklist, ledger T-049.
- Method: reading, `tsc`, `vitest`, `next build`, `npm run smoke`, plus one throw-away SQL probe against PGlite (in my scratchpad, not in the repo). No source file was edited or mutated, so there was nothing to restore. Test-suite mutation quality below is by reasoning, not by running mutants.

## Verdict

The slice does what the prompt asks, and the checks the authors report are reproducible (212 tests, 57 smoke checks, clean typecheck and build). No Critical finding. One High finding: the headline database guarantee ("state and history cannot diverge, even for direct SQL as the application role") is false for INSERT. Everything else is Medium or Low. The honesty of the documentation is good on browser testing and PGlite concurrency, but the README is stale in two places and the ADR overstates two properties.

## Findings

### High

**H1. A guest can be created already checked in with no audit record (guarantee bypass).**
`web/migrations/0004_guest_management.sql`, lines for `guests_require_audit` (`after update of checked_in_at, name`), and `0002_guests.sql` (`grant select, insert on guests to events_app`, column-unrestricted insert).
The trigger only fires on UPDATE. The application role may INSERT any column, including `checked_in_at`. I verified on the real migrations: as `events_app` with the account set, `insert into guests (account_id, event_id, name, checked_in_at) values (..., now())` succeeded, and the guest has 0 audit rows. That guest counts as checked in in the attendance totals with no history. ADR 0022 says state and history "cannot diverge, even for direct SQL as the application role", and the ledger and README repeat the spirit of it. No test covers this.
Fix: either (a) revoke insert on `checked_in_at` from `events_app` (`revoke insert on guests from events_app; grant insert (account_id, event_id, name, import_batch_id) on guests to events_app;`), and add a test that the insert is refused; and/or (b) add a `check (checked_in_at is null)`-style insert trigger (`before insert ... when (new.checked_in_at is not null)` raising). Also add a deferred insert trigger requiring a `guest_added` or `guests_imported` record if you want creation covered by the same rule (see M2). Then soften the ADR wording to say what is actually enforced.

### Medium

**M1. Audit is one-directional: audit rows can be inserted with no state change.**
Same file, grants and RLS: `events_app` has `insert` on `audit_events` with any `action`, any `guest_id` of the account, and even an explicit `tx_id`. I verified a forged `check_in_undone` row for a guest who was never undone was accepted. So the history can be made to lie by the application role, while the reverse (state without history) is blocked for updates only. This is inherent to letting the app role insert, but the ADR text ("Evidence") implies stronger integrity than exists. Fix: document it as a limit; optionally make `tx_id` and `occurred_at` non-insertable by the app role (column-level insert grant omitting them, so defaults always apply), and add a deferred trigger on `audit_events` asserting the matching guest state transition (e.g. a `checked_in` row must coincide with a guest whose `checked_in_at` changed in the same tx).

**M2. Imported guests have no per-guest creation record.**
`guests-repository.ts` `importGuests` writes one `guests_imported` row with `guest_id = null`. The prompt asks for guest IDs in audit coverage. The link back is only `guests.import_batch_id`, which is not shown or enforced. Not wrong (the count and batch id are recorded) but the audit page shows "Guest: —" for imports and cannot say which guests came in. Fix: accept and document, or write one `guest_added` per imported guest (cost: up to 500 rows; names still absent), or show the batch id.

**M3. Audit "No." column exposes a global sequence.**
`0004` `seq bigint generated always as identity`, shown by `AuditView.tsx` (`<td>{e.seq}</td>`). The sequence is shared across all accounts and events, so numbers are non-contiguous and let one account infer another's activity volume. Harmless with one demo account, wrong once there are tenants. Fix: show a per-event ordinal (`row_number() over (order by seq)`) or hide the number; keep `seq` for ordering only. Also note gaps from rolled-back transactions look like deleted records; say so in the page copy if the number stays.

**M4. Per-event guest limit and import limit are not safe under real concurrent connections.**
`guests-repository.ts` `addGuest`/`importGuests`: `count(*)` then insert at READ COMMITTED, no lock. Two simultaneous imports of 500 into an event holding 1,500 can both pass and exceed 2,000. Not testable on PGlite (single connection). Fix: lock the event row first (`select ... from events where id = $1 for update`) before counting, or enforce with a trigger/constraint. Low impact for the prototype; record it in the known limitations (README lists concurrency generally but not this).

**M5. Sticky notice can hide the focused guest row; no `scroll-margin`.**
`globals.css` `.notice { position: sticky; top: 0 }` and `.guest:focus` / `FocusOnMount`. After a redirect with `#guest-<id>` the browser scrolls the row to the top edge, under the sticky notice (WCAG 2.2 SC 2.4.11 Focus Not Obscured). The notice also grows on 320px screens. The checklist step 23 asks the founder to check for this, which is honest, but it is a likely real defect. Fix: `.guest { scroll-margin-top: 8rem; }` (or measure), or make the notice non-sticky and rely on the live region.

**M6. Audit table scroll container is not keyboard reachable.**
`AuditView.tsx` `<div className="table-wrap">` with `overflow-x: auto` and `min-width: 36rem` on the table. A keyboard user on a narrow screen cannot scroll it (axe rule `scrollable-region-focusable`, which jsdom cannot evaluate, so the axe test passing says nothing here). Fix: `tabIndex={0} role="region" aria-labelledby=<caption id>` on the wrapper, with a focus style (the global `:focus-visible` list does not include `div`).

**M7. README is stale and contradicts migration 0004.**
`web/README.md`: the Check-in Studio section still says "A database trigger stops the first check-in time from ever being cleared or changed, even by the application role" (removed by 0004), and "Deliberately not built" still lists "guest editing, deletion, import". Also `package.json` description is unchanged. Fix: update both paragraphs; the ADR header amendment on 0021 is correct but the README is what a founder reads.

### Low

**L1. Receipts: per-process, reusable for 60 s, silently lost.** `server/receipts.ts`. Forgery is not feasible (128 bits from `randomBytes(16)`, format-checked, bound to event id, TTL, bounded to 200). Redirect URLs are safe: every `back()` caller validates `eventId` with `isUuid` first, `q` goes through `URLSearchParams`, the anchor only when `guestId` is a UUID, so there is no open redirect or header injection. Residual issues: (a) a failed action shows an `error` notice only via a receipt, so on restart, multi-process or after 60 s the user gets no feedback at all (accepted in README; for the error case, consider also returning a distinguishable path); (b) any burst of 200 actions evicts other users' receipts (oldest-first), a trivial nuisance DoS; (c) a receipt is reusable until expiry, so refresh re-announces and re-focuses within a minute. No user-controlled text reaches a rendered message unescaped: the guest name is read from the database and rendered through React; `count` is numeric from the server.

**L2. Batch id is client-chosen.** `guest-actions.ts` `confirmImportAction` accepts any UUID as `submissionId`; ADR says the server picks a "one-time" id, but nothing verifies the id was issued by the server, so a client can mint ids. Impact is nil for security (same account, same powers as add-guest), but the ADR wording overstates. Replay into another event returns `already_imported` with the first batch's count and shows "This import had already been saved" on the other event's page (test at `guest-management.test.ts` "cannot be replayed into a different event" documents it). Acceptable; consider a distinct message such as "this confirmation belongs to another event".

**L3. `guests.import_batch_id` is not tied to the guest's event.** FK is `(account_id, import_batch_id)`; a guest could reference a batch of another event of the same account. Fix: add `unique (account_id, id, event_id)` on `import_batches` and FK `(account_id, import_batch_id, event_id)`. App code cannot do this today (no update grant), so low.

**L4. TRUNCATE is not trapped on `audit_events`.** `0004` has only a row-level update/delete trigger. `events_app` has no truncate grant (verified: "permission denied"), so only the owner could, but ADR says "cannot be updated or deleted ... even the database owner". Add `before truncate ... for each statement` trigger for consistency. The owner can still disable triggers; say so.

**L5. Database name rule is weaker than application rule.** `guests.name` has only a length check; formula start, control-character and email/phone rules exist only in Zod. A future importer, export or second code path could store `=cmd|...`. The application rule is good (leading `= + - @` after trim, control and bidi characters, BOM/zero-width; `trim()` also strips leading U+FEFF and NBSP, so `﻿=1` is caught). Not covered: other invisible characters such as U+00AD or U+034F before `=`; fullwidth lookalikes (U+FF1D etc.), which spreadsheets do not evaluate. Fix: add a DB `check (name !~ '^[=+@-]')`, and make any future CSV export prefix a quote regardless (defence in depth).

**L6. CSV parser leniency.** `domain/csv.ts`: `"Al"ex` is read as `Alex` (text after a closing quote is appended); a quote only opens at the first character of a cell (so ` "x"` with a leading space stays literal, then the name keeps the quote characters); `file.type` is matched exactly, so `text/csv;charset=utf-8` or `Text/CSV` is refused (browsers normally send plain `text/csv`); row numbers count records, not lines, so a quoted multi-line cell shifts numbering (documented as "record number"). Limits are sound: 200 KB, 500 non-blank rows checked before per-row work, parsing is linear, a 200 KB unterminated quote is a single linear pass then a clean error. No DoS path found; Next's own 1 MB action body limit applies above this.

**L7. Stale and sticky UI state.** `GuestForms.tsx` `ImportFlow`: after a successful re-preview, an old `confirmState.error` from a previous confirm stays on screen above the new confirm button. The confirm error is a `role="alert"` but focus is not moved to it. The add and edit forms announce errors via `role="alert"` but do not move focus to the field or a summary (the prompt says to "retain" existing focus management; the old form had none, so this is not a regression, but the checklist's "useful validation summaries" claim is thin: there is only a per-field message).

**L8. Duplicate screen-reader content.** `GuestViews.tsx` `NoticeBanner`: the visible `<p>` and the hidden live region repeat the same sentence; in browse mode both are read. The design (visible text plus delayed live region) is reasonable and the test for it is real, but it is untested with a screen reader (the README says so). Consider `aria-hidden` on nothing; just keep the checklist item 19 ("once, not twice").

**L9. `too_many_guests` branch is dead code.** `guest-actions.ts` handles `result.status === "too_many_guests"` but `importGuests` throws `GuestLimitError` instead and never returns that status. Harmless; remove or use.

**L10. Seq order is allocation order, not commit order.** Correct per guest (row lock is held until commit; see the concurrency analysis below), but the page's "newest first" can show a later-committed row above an earlier-committed row for different guests. ADR already says this.

## Core database design: analysis (migration 0004)

**Deferred constraint trigger `guests_require_audit` and `txid_current()`.**
- Multiple updates in one transaction: a deferred row trigger fires once per update event with that update's own OLD/NEW. Check-in then undo in one transaction needs both `checked_in` and `check_in_undone` rows in the same transaction; each is checked separately. A rename plus a check-in in one transaction works (two events, each finds its own action). A single UPDATE changing both columns is checked for both. None of these wrongly blocks a legitimate operation I could construct. It is strict, not loose: check-in then undo with only one audit row fails, which is the intended behaviour.
- Matching is by existence only (guest id, tx id, right kind), not by count, so two attendance flips with one audit row of the right kind would be accepted if both flips fall under the same `wanted` set; the only sequence that can do that is two sets, which the `old is null`/`new is null` branching already forbids (replacement raises). So the practical hole is small.
- Bypass routes: INSERT (H1); the owner can disable the trigger or `set session_replication_role = replica`; `SET CONSTRAINTS ... IMMEDIATE` only hurts the caller (trigger would fire before its audit row exists). `txid_current()` is the top-level xid and is stable across savepoints; under a transaction-mode pooler it still holds because it is per transaction. The ADR flags pooling as untested; that is fair.
- Constraint trigger has no `WHEN` clause, so it runs for every update of those columns, including no-op `set name = name`, which then demands an audit row; repository code avoids that with `is distinct from`.

**Append-only.** `audit_events_no_update` is `before update or delete ... for each row`, which blocks the owner and tests prove it. `events_app` has only select and insert (verified TRUNCATE refused). No statement-level truncate trap (L4). Owner can disable triggers (inherent).

**RLS and grants.** `import_batches` and `audit_events`: RLS enabled and forced; select/insert policies scoped to `app.account_id`; no update/delete policy or grant. `guests`: new column grant is only `update (name)`; `import_batch_id` and `created_at` not updatable (tests confirm permission denied). Composite FKs `(event_id, account_id)` and `(guest_id, event_id, account_id)` prevent cross-event and cross-account references at the database level (tests exercise both). Gap: L3.

**Concurrency on real PostgreSQL READ COMMITTED (reasoned).**
- `checkInGuest`/`undoCheckIn`: a conditional `UPDATE ... WHERE checked_in_at is [not] null` takes the row lock; a concurrent updater blocks, then re-evaluates the WHERE against the committed row (EvalPlanQual). Exactly one of N simultaneous check-ins wins. The audit insert follows the UPDATE inside the same transaction, so for one guest the audit `seq` order equals lock order equals commit order. Good.
- The `exists (... 'checked_in','checked_in_again')` read for choosing `checked_in_again` runs after the row lock is held, in a new READ COMMITTED statement snapshot, so it sees every audit row committed by any earlier holder of that lock. It is not racy. (An audit row inserted directly by someone else, M1, would change the answer, but that is a forged-history case.)
- Rename vs check-in on the same guest: both lock the same row; serialised; both audit rows follow. Fine.
- Import idempotency: `insert ... on conflict do nothing` on the primary key; a concurrent duplicate waits on the unique index until the first commits or rolls back, then returns no row, and the follow-up `select` sees the committed batch. A first-transaction rollback lets the second proceed. Correct.
- Count-then-insert limit race: M4.

**Backfill.** Inserts one `guest_added` per guest and one `checked_in` per checked-in guest, ordered by time, run as the migration owner (RLS bypassed). `tx_id` defaults to the migration transaction id, harmless. Identity values follow the `ORDER BY` in practice (PostgreSQL does not formally guarantee it for `INSERT ... SELECT ... ORDER BY`, but it is reliable). Ties are ordered with added before checked in. Restoring a guest checked in before their `created_at` is impossible given defaults. The upgrade test exercises a real two-step migration and then an undo, which is a good test.

## Requirements trace

Section 2 (CSV): upload (yes); documented `name` column and downloadable example (`web/public/example-guests.csv`, ten synthetic "Example" names, served at `/example-guests.csv`, verified in smoke); type/extension check, empty file, binary/NUL, UTF-8 fatal decode, BOM; 200 KB and 500-row limits, shown in the UI; invalid rows reported by number and reason without echoing cell text; preview with count; explicit confirm button; selected event only (event id from the form, verified against the account; DB composite FKs); no partial import (single transaction, rollback test uses a failing trigger); repeated submission (primary key on batch, simultaneous test is serialised on PGlite, see below); duplicates documented, counted and never merged; formula and PII-like text refused; error text has no paths or SQL (tested, and `logFailure` logs only `error.name`). Met. One nuance: invalid rows are skipped, valid rows still import after confirmation; the UI says "will be skipped" and the count shown is of the valid rows, so this is disclosed. TOCTOU between preview and confirm: confirm re-validates every name and the limit transactionally; the hidden `names` field is not trusted beyond being re-validated, but it does mean the client can submit any up-to-500 valid names (same power as the add form); Low and acceptable.
Section 3 (edit name): Zod rules shared, UUID preserved, check-in preserved, cross-event/account refused, success/failure feedback, audit record with no names, no deletion. Met.
Section 4 (undo): separate immutable event, totals update (counted from stored state), repeat safe, re-check-in recorded as `checked_in_again`, cross-scope refused, evidence separated from state. Met, subject to H1.
Section 5 (audit): all six actions recorded; ordering by `seq`; no names in rows (column set asserted); no edit/delete UI; actor constraint plus page caveat. Met, with M2/M3.
Section 6: forgeable `?notice=&g=` removed (page reads only `q` and `r`; smoke tries forged links); announcer and focus implemented. Met.
Section 7: no browser was available, a checklist is supplied, and no claim of browser or screen-reader testing is made anywhere I read. Honest.
Section 8, 9: see tests.
Section 10: README, ADR, ledger present (M7 stale text). Not reviewed: commit and push (nothing committed yet).

## Server actions

All exports from `server/guest-actions.ts` are `addGuestAction`, `checkInAction`, `undoCheckInAction`, `renameGuestAction`, `previewImportAction`, `confirmImportAction`; the interfaces are type-only and `back` and `logFailure` are not exported. Each is intended, each validates `eventId` (and `guestId`/`submissionId` where used) as UUIDs and re-applies account and event scoping in the repository, plus RLS. The account is the constant `DEMO_ACCOUNT_ID`, never request-supplied. CSRF: Next.js server actions enforce an Origin/Host match and the server is bound to 127.0.0.1; I rely on that framework behaviour and did not test it. Errors shown to users are fixed strings; logs record only the error class name.

## Tests

- Counts: 212 passed in 8 files (matches README and ledger).
- Quality: the new suites assert behaviour and failure cases (tampered confirmation forms, rolled-back import with an injected failure, composite FK rejection, wrong-kind or wrong-transaction audit rows, upgrade of a pre-0004 database, receipt rules). `assertConsistent` genuinely cross-checks stored state against audit order. I found no tautologies.
- **Concurrency claims.** PGlite runs transactions one at a time. "simultaneous check-ins and undos", "simultaneous double submission" and the random mixed-operation test therefore exercise sequential interleavings of whole transactions, not overlapping ones. The README says this clearly ("shows the outcome, not behaviour across several real database connections"), but the test names ("simultaneous") overstate it and the ledger should say the same. They are still useful as state-machine tests. A real two-connection PostgreSQL test is owed.
- **Gaps / mutations the suite would miss (reasoned, not run):**
  1. Removing `account_id = $1` from the `exists (select 1 from events ...)` in `importGuests`: still passes, because `events` RLS and the composite FK also reject it. The "RLS switched off" test only disables RLS on `guests` and `audit_events`, so it does not isolate this filter. Defence in depth masks it.
  2. A guest inserted with `checked_in_at` set (H1) is untested.
  3. A rename and a check-in of one guest in a single transaction is not tested (works by analysis).
  4. Forged audit rows without a state change (M1) are untested.
  5. `too_many_guests` and the stale `confirmState` are untested.
  Mutations the suite would catch (by reading what each test asserts): dropping the `checked_in_at is not null` guard on undo (repeat-undo test), dropping `tx_id = txid_current()` or `action = any(wanted)` from the trigger (the "earlier transaction" and "wrong kind" tests), binding receipts to no event (wrong-event test), skipping the audit insert in rename or import (trigger or count assertions), removing the formula rule (csv and action tests). The ledger says three mutation checks were run and reverted; I could not verify that and did not repeat them.
- **Edits to pre-existing tests** (diff reviewed): `guests.test.ts` changes `permission denied` on `update guests set name` to `without an audit record` (justified, name column is now updatable under the audit rule), changes the three "cannot be changed once set" expectations to the new trigger messages and adds a positive undo then check-in at the end (justified, rule intentionally replaced; the negative assertions are kept), adds `import_batch_id` to the expected column list (justified). `events-repository.test.ts` changes migration list and count 3 to 4 (justified). `accessibility.test.tsx` rewrote the guest-list tests for the new `undoAction` prop and the two-action rows and extended notice coverage to all `NOTICES`; the old assertion "checked-in guests have no button" was legitimately inverted. I found no weakening of coverage.

## Accessibility and UX

- Markup: forms have labels, hints and `aria-describedby` linking errors, `aria-invalid`, `aria-required`; table has caption (visually hidden), `th scope="col"` and `<time>`; action buttons carry visually hidden guest names. Axe tests pass on server-rendered markup, but axe on static markup cannot detect focus, scroll-region or contrast problems.
- Announcer: visible message already in the DOM, hidden `role="status"`/`role="alert"` filled after 150 ms; a fake-timer test proves the delayed fill. Sound approach, unverified with a real screen reader (L8).
- Focus: `FocusOnMount` puts focus on the guest row (`tabIndex=-1`, visible `3px` outline on `.guest:focus`); import preview/error moves focus to a heading. See M5 for the sticky overlap.
- Contrast computed (WCAG formula): light `--accent #0b4f8a` on white 8.40, on card `#f5f7fa` 7.83 (secondary button text and border); dark `#7db8f0` on `#14171a` 8.56, on card `#1d2227` 7.62; `.notice-ok` border `#1f7a3d` on white 5.37, dark `#5fd68a` on `#14171a` 9.83; error `#a30d1f` on white 7.97, dark `#ff9aa6` 8.93; neutral `--border #767676` on white 4.54 (3:1 needed for UI), on card 4.23; dark `#8b9097` 5.60 and 4.99. All pass. The README line that contrast was never checked is out of date only in the sense that I have now checked the new colours; it still holds for the rendered pages.
- Target sizes: `.button` min-height 44px, large 56px; the edit link is an `a.button` so it gets the same. Fine. The audit table scrolls inside its own box at narrow widths; see M6. Guest rows wrap (`flex-wrap`), `.guest-name` has `overflow-wrap: anywhere`.

## Honesty check of documents

- Test count 212 and smoke count 57: confirmed.
- No claim of browser or screen-reader testing in README, ADR, ledger or checklist; the checklist says explicitly that none was done. Good.
- PGlite concurrency caveat is present in the README and ADR; the prompt's restriction is respected, apart from test names (see Tests).
- ADR 0022 overstates: "cannot diverge, even for direct SQL as the application role" (H1, M1) and "one-time batch id" (L2). README stale (M7). Ledger entry T-049 correctly states "Review pending" and the factual numbers; the mutation-check sentence is unverified by me.
- The checklist is realistic and covers the criteria in the prompt. Step 5's double-click advice is slightly confusing (disabled button vs smoke test of double post), otherwise fine.

## Secrets, personal data, generated files

- No credentials, tokens, keys or personal data found by search in `web/src`, `web/scripts`, `web/public`, `web/migrations`, docs added on this branch.
- `web/public/example-guests.csv`: header `name` and ten rows "Alex Example" ... "Jo Example"; synthetic, no contact data.
- `.next/`, `.data/`, `node_modules/`, `*.tsbuildinfo` are in `web/.gitignore`. After build and smoke, `git status --short` shows only the intended modified and untracked paths listed at the start of the session (smoke uses a temporary data folder and removes it). Stage explicit paths when committing, as CLAUDE.md requires; `docs/prompts/mvp-checkin-guest-management.md`, `web/BROWSER-TEST-CHECKLIST.md`, `web/public/` and the new test files are untracked and must be added deliberately.

## What I ran and observed

| Check | Command (in `web`) | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0, no output |
| Tests | `npx vitest run` | 8 files passed, 212 tests passed, 0 failed, 71 s |
| Build | `npm run build` | exit 0; routes listed include `/events/[id]/check-in/audit`, `/import`, `/guests/[guestId]/edit`; no warnings seen |
| Smoke | `npm run smoke` | "57 of 57 smoke checks passed" (127.0.0.1:3199, temporary database; I counted 57 PASS lines, no FAIL) |
| Probe | scratch Node script using PGlite and the real migrations, outside the repo | insert of a pre-checked-in guest as `events_app`: accepted, 0 audit rows (H1); `truncate audit_events` as `events_app`: permission denied; forged `check_in_undone` audit row as `events_app`: accepted (M1); `seq` is an identity shared across the database (M3) |

I did not start anything on port 3000. No file under `.claude` was read except the harness-provided tool-output spill files for my own command output.

## What I could not check

- Real browser rendering, keyboard behaviour, focus visibility, responsive layout, screen-reader output, the sticky-notice overlap (M5), the scroll-region issue (M6): no browser tooling used; these remain the founder's checklist.
- Behaviour on real PostgreSQL with multiple connections (lock ordering conclusions above are reasoned from PostgreSQL semantics, not run); behaviour under connection pooling; multi-process receipt store.
- Next.js server-action CSRF/Origin enforcement (relied on, not tested).
- Mutation testing of the suite (reasoned only).
- Git state of the final commit and push (nothing committed at review time).

## Suggested order of fixes

1. H1 (revoke or trap insert of `checked_in_at`; add test; correct ADR wording), with M1 wording.
2. M7 README fix, M5 and M6 CSS/markup fixes, M3 per-event ordinal.
3. M2/M4/L3/L4/L5 as time allows; record the rest in the ledger as known limitations.
