# 0022 Guest management: CSV import, name edits, recorded undo and audit history

- Status: proposed (implemented in the local prototype on synthetic data under the founder's prompt `docs/prompts/mvp-checkin-guest-management.md`; needs privacy and technical validation before real data)
- Date: 2026-10-31
- Decided by: founder asked for the slice; the model below is the Software Engineer and Solution Architect's design, awaiting founder review
- Amends: [0021](0021-checkin-first-slice-guest-and-check-in-model.md) (the immutable check-in time rule)

## Context

Decision 0021 made the first check-in time unchangeable by a database trigger. Undoing a mistaken check-in needs the current attendance state to change, while the evidence of what happened must not. The architecture ([sections 9, 24, 25](../architecture/MVP-TECHNICAL-ARCHITECTURE.md)) says check-in events are never silently overwritten, and keeps personal data out of append-only records. All of that is proposed, not decided.

## Decision (for this prototype)

**Separate evidence from state.**
- `guests.checked_in_at` is the **current** state (null when not checked in).
- `audit_events` is the **evidence**: append-only, one row per state change, ordered by a server-assigned sequence number. Actions: `guest_added`, `guests_imported`, `guest_renamed`, `checked_in`, `check_in_undone`, `checked_in_again`. Rows hold ids, an action, the server time, a fixed actor and (for imports only) a count and batch id. **No names.** The history page shows the guest's *current* name by looking it up.
- `check_in_log` (0021) stays as the record of every check-in *attempt*, including repeats; it is not changed by undo.

**The 0003 rule is replaced.** "A set check-in time can never change" is dropped. In its place a deferred database trigger (`guests_require_audit`) refuses any change to `checked_in_at` or `name` unless a matching audit row was written **in the same transaction** (matched by `txid_current()` stored in the audit row). Setting a time needs `checked_in`/`checked_in_again`, clearing needs `check_in_undone`, a rename needs `guest_renamed`; replacing one time with another is never allowed. A second deferred trigger works the other way: an audit row about a guest is accepted only if that guest row was written in the same transaction, in the matching state, and attendance rows must alternate per guest (first `checked_in`, then `check_in_undone`, `checked_in_again`, ...). A guest cannot be inserted already checked in (the application role has no insert right on that column; anyone else needs the audit row in the same transaction). So, for the application role and for the database owner using SQL, state and history cannot be made to disagree and history cannot be invented for a change that did not happen. This is a rule inside the database; a superuser can still disable triggers. Audit rows cannot be updated, deleted or truncated (triggers, plus no such grant).

**Undo** is one conditional `UPDATE ... WHERE checked_in_at IS NOT NULL` plus its audit row in one transaction. A repeat changes and records nothing. A later check-in is recorded as `checked_in_again`.

**Actor.** Until there is sign-in, `actor` can only be `local_demo_operator` (a check constraint) and the interface says "not a verified person". The history cannot say who really acted. Real attribution needs authentication and roles (0011), and then the constraint must change. The record numbers shown ("No.") count within the event (1, 2, 3 ...), not the database-wide sequence, so one account cannot infer another's activity.

**CSV import** (names only): the file is read and validated on the server (type, size, UTF-8 with optional BOM, header exactly `name`, up to 500 rows, each name through the same rules as the add form). A preview shows the count, skipped rows (by row number and reason, not echoing cell text) and duplicate counts; nothing is saved until the confirm button. Confirmation re-validates everything. The server picks a batch id at preview time and puts it in the confirmation form; a primary key on it makes a double submit import once. The id passes through the browser, so a client could choose its own: that only affects its own account and event, and is harmless. Import is one transaction (batch row, guests, one audit row): any failure saves nothing. Per-event limit 2,000 guests, checked under a per-event advisory lock so two writers cannot both slip under it. Imported guests do **not** each get a `guest_added` audit row (a 500-row import would flood the history); the import is one record with the count and batch id, and each guest carries its `import_batch_id`, tied to the same event by a composite foreign key. The history page therefore shows "Guests imported from CSV (10)" and not ten additions.
- **Duplicates:** identical names are never merged (two real people can share a name). The preview counts rows that repeat within the file or match a guest already listed, and imports them all as separate guests if confirmed. Importing the same file twice therefore creates duplicates by design; the warning and the confirmation are the safeguard.
- **Personal data:** other columns are refused; names that look like an email address or a phone number are refused (also in the add and edit forms); names starting with `=`, `+`, `-` or `@` are refused so they cannot become spreadsheet formulas if exported; invisible and direction-control characters are refused. Nothing is evaluated.

**Confirmation messages** no longer travel in the address. After an action the server stores what happened under a random 128-bit id in process memory (60 seconds, bounded) and redirects with `?r=<id>`. The page shows a message only for an unexpired id that belongs to the same event, so a link cannot make the page claim anything. Receipts are lost on restart, which only loses a notice.

## Consequences

- Attendance and history stay consistent by database rule, not by application discipline alone.
- Audit sequence numbers are assigned at insert time; with several real connections they are ordered by when each row was written, which is consistent per guest because the row lock is held until commit, but is not a global commit order. The matching of audit rows to changes uses `txid_current()` and the row's `xmin`; how that behaves behind a connection pooler or after transaction-id wraparound is untested.
- Real PostgreSQL concurrency, multi-process behaviour (the receipt store is per process) and the guarantees of the `txid_current()` match under connection pooling are **not tested**; PGlite has one connection and runs transactions one after another, so the "interleaved" tests show the final state is consistent whatever the order, not that overlapping real connections are safe.
- Erasure of a guest while keeping the history is still not designed (0014): names are not in the history, but `guest_id` stays.
- No deletion of guests or audit rows exists, by request. The 200-row audit page limit is a display limit only.
- The `check_in_log` table now partly duplicates `audit_events` for successful check-ins; consolidating them is left for later.

## Not decided / deferred

Check-out, guest deletion and erasure, audit export and retention, per-user attribution and roles, QR, devices, offline and idempotency keys from devices, paging of large audit histories, a shared (multi-process) receipt store.

## Evidence / sources

Migration `web/migrations/0004_guest_management.sql`; tests in `web/tests/guest-management.test.ts`, `csv-import.test.ts`, `guest-actions.test.ts`; architecture sections 9, 24, 25; decision 0021.
