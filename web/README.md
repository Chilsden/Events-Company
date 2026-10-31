# Events Company: first working slices (events and Check-in Studio)

**Local demonstration only. There is no sign-in and no production security. Use synthetic data only.**

Slice 1: create an event, save it, list events, open an event's details. Slice 2 (Check-in Studio): add guests to an event, list them, check them in, see attendance. Slice 3 (guest management): CSV import, edit a name, undo a check-in, audit history. Built with Next.js 16 (App Router), TypeScript, Zod 4 and PGlite (Postgres in Node) under [decision 0020](../docs/decisions/0020-mvp-implementation-stack.md). PGlite is for local development and tests only, not an approved production database.

## Requirements

Node.js 24 and npm. Nothing else: no Docker, no database server, no accounts.

## Install and run (Windows PowerShell, from the repository root)

```powershell
cd web
npm install
npm run dev
```

Open <http://127.0.0.1:3000> in a browser. The server listens on 127.0.0.1 only, so other computers cannot reach it. Stop it with Ctrl+C.

Production-style run:

```powershell
npm run build
npm run start
```

## Test

```powershell
npm test            # 217 unit and integration tests (validation, database, account and event separation, check-in, accessibility)
npm run typecheck   # TypeScript
npm run build       # production build
npm run smoke       # 57 end-to-end checks of the built app on 127.0.0.1:3199 with a throwaway database (run build first)
```

## Check-in Studio (slice 2)

Open an event, then **Open Check-in Studio** (or go to `/events/<event id>/check-in`).

- **Add guests:** type a synthetic name and press Add guest. Name only (up to 120 characters); no email, phone, photo or signature.
- **Guest list:** sorted by name, with a clear "Not yet checked in" or "Checked in at 14:05" (UK time) on each guest. Search by part of a name.
- **Check in:** one large button per guest. The page confirms by name and the attendance totals (total, checked in, not yet checked in) update; they are counted from the saved guests, so they always match the list.
- **Safe to repeat:** checking in twice, or two people pressing the button at the same moment, records one check-in with the first time. A repeat says "already checked in" and changes nothing.
- **Isolation:** a guest can only be reached through its own event and account, in the code and by database constraints and row-level security. Trying another event's guest says "not found" and changes nothing.

To populate synthetic guests quickly, open Check-in Studio and add names such as "Alex Example", "Bea Example", "Cal Example". Use obviously fake names only.

Database changes: `0002_guests.sql` adds `guests`, `check_in_log` (append-only record of each check-in attempt, ids and times only) and `consent_records` (an unused skeleton for the future consent model; nothing reads or writes it, and no consent is assumed). `0003` is superseded by `0004_guest_management.sql`, which adds `import_batches` and `audit_events` and replaces the old rule "a check-in time can never change" with: a check-in time or a name can change only together with its audit record, and an audit record can exist only for a change made in the same transaction. Design notes: [decision 0021](../docs/decisions/0021-checkin-first-slice-guest-and-check-in-model.md) and [0022](../docs/decisions/0022-checkin-guest-management-undo-audit-import.md).

## Guest management (slice 3)

From Check-in Studio:

- **Import guests from CSV** (`/events/<event id>/check-in/import`). One column headed `name`, UTF-8 (a BOM is fine), a `.csv` file up to 200 KB and 500 guests, 2,000 guests per event. Download the synthetic example from the import page (`/example-guests.csv`). The page checks the file and shows a **preview** (how many guests, skipped rows with row numbers and reasons, repeated names); nothing is saved until you press the import button. Importing is all or nothing, goes into this event only, and pressing the button twice imports once. Identical names are **never merged**: two rows with the same name become two guests, and the preview tells you how many repeat. Files with other columns, emails, phone numbers, or names that start with `=`, `+`, `-` or `@` are refused. Nothing in the file is ever evaluated.
- **Edit name**: corrects a guest's name with the same rules as adding one. The guest, their check-in and the history stay the same.
- **Undo check-in**: returns a guest to "not yet checked in" and updates the totals. The original check-in stays in the history; the undo is recorded as a separate event; a later check-in is recorded as "checked in again". Repeating an undo is safe.
- **View audit history** (`/events/<event id>/check-in/audit`): every guest added, import, name change, check-in, undo and re-check-in, newest first, with a sequence number and a time. Records can be added but never edited or deleted, and there are no controls to do so. The history stores no names; it shows each guest's current name.
- **Who**: there is no sign-in, so every record says "Local demonstration operator (not a verified person)". The history cannot show who really acted.
- **Confirmation messages** now come from the server and cannot be forged by editing the address.

Design: [decision 0022](../docs/decisions/0022-checkin-guest-management-undo-audit-import.md). Migration `migrations/0004_guest_management.sql`. Browser checking list: [BROWSER-TEST-CHECKLIST.md](BROWSER-TEST-CHECKLIST.md).

## Where the data is, and how to reset it

Events are stored in `web/.data/pglite` (ignored by Git). Stop the server, then run `npm run reset-data` to delete it; a new empty database is created on the next start. Set `EVENTS_DATA_DIR` to use another folder (`npm run reset-data` only removes `web/.data`; delete another folder yourself). Run only one server at a time on the same folder (PGlite allows a single connection; running two processes on one folder is untested).

## What works

- Dashboard with event counts and the next three events.
- Create an event: name (required, up to 120 characters), date (required, a real calendar date from 2000 to 2100), location (required, up to 200 characters), description (optional, up to 2,000 characters). Validation runs on the server with specific messages next to each field and in a summary; entered values are kept.
- Events are saved to the local database and survive restarting the server.
- Events list and event details page; unknown or malformed event addresses show a not-found page.
- Responsive layout, labelled fields, skip link, keyboard focus styles, UK English and UK date format.
- Every event belongs to an account (`account_id`). This slice uses one fixed synthetic demo account. Every query is filtered by account and also runs as a limited database role under PostgreSQL row-level security (checked in the tests).

## Deliberately not built

Sign-in and account management, event editing and deletion, start times and time zones, guest deletion and erasure, custom guest fields, check-out, audit export, QR codes and scanning, invitations and RSVP emails, consent capture, multiple devices and stations, offline use, Signature Mosaic, ShareWall, Lucky Draw, Event Gallery, file storage, live updates, payments, deployment.
Sign-in and accounts management, event editing and deletion, start times and time zones, guest editing, deletion, import and custom fields, check-out, guest deletion, QR codes and scanning, invitations and RSVP emails, consent capture, multiple devices and stations, offline use, Signature Mosaic, ShareWall, Lucky Draw, Event Gallery, file storage, live updates, payments, deployment.

## Known limitations and security notes

- No authentication: anyone who can reach the server can use it. It is bound to localhost for that reason. Never expose it to a network or put real guest data in it.
- The demo account comes from server code (`DEMO_ACCOUNT_ID`), never from the request, so this prototype cannot show per-user permissions. Real accounts, roles and event collaborators (decision 0011) come later.
- PGlite is Alpha software with a single connection. Tests pass, but it has had no load, crash or multi-process testing.
- Account separation is tested at the repository and database-policy level. That is not a full tenant-isolation test (spec section 11.1 needs one later).
- Dates are plain calendar dates; the time zone and start time are deferred.
- Concurrency: check-in, undo and import each use one conditional database update inside a transaction, and tests fire dozens of simultaneous mixed actions and check that every guest's state matches the history. PGlite has a single connection and runs transactions one at a time, so this shows the outcome, not behaviour across several real database connections. A real PostgreSQL test with two connections is still owed. Do not take these tests as proof for production.
- Anyone who can reach the server can check anyone in, edit names, import files and undo: there are no staff roles or devices yet (decision 0011). The audit history names no individual because none can be identified.
- Adding a guest is not idempotent: submitting the form twice (for example a double click) adds two guests with the same name. Names can legitimately repeat, so this is not blocked.
- After an action the page returns to that guest's row with a notice pinned to the top. The notice is also added to a hidden live region after load, and focus moves to the row, so screen readers should announce it. **This was not tested in a real browser or with a screen reader**; use the manual checklist.
- Confirmation messages are kept in the server's memory for a minute. Restarting the server, or running more than one server process, drops them (the action still happened; only the notice is lost).
- Importing the same file twice creates the guests twice, by design. The preview warns when names already exist.
- The audit page shows the latest 200 records; older ones are kept but not shown. Audit records cannot be exported or erased yet, and erasing a guest's data while keeping the history is not designed.
- Guest names are personal data once real. Use synthetic names only; erasure of a guest is not designed yet (decision 0014).
- The guest list shows everyone on one page, with no paging. Fine for a prototype, not for thousands of guests.
- Colour contrast was not checked automatically (the accessibility tests cannot measure it); check it by eye or with a browser tool.
- `serverExternalPackages` in `next.config.mjs` is required: without it the bundler breaks PGlite.

## Next recommended slice

Real sign-in with account ownership and event roles (decisions 0011 and 0014), because the audit history is only as good as the identity behind it and nothing here may touch real guests without it. Then a real PostgreSQL environment with a two-connection test of check-in, undo and import, and a first spike of an installable offline-capable check-in station (S-01 and S-02).
