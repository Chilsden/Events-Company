# Events Company: first working slices (events and Check-in Studio)

**Local demonstration only. There is no sign-in and no production security. Use synthetic data only.**

Slice 1: create an event, save it, list events, open an event's details. Slice 2 (Check-in Studio): add guests to an event, list them, check them in, see attendance. Built with Next.js 16 (App Router), TypeScript, Zod 4 and PGlite (Postgres in Node) under [decision 0020](../docs/decisions/0020-mvp-implementation-stack.md). PGlite is for local development and tests only, not an approved production database.

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
npm test            # 111 unit and integration tests (validation, database, account and event separation, check-in, accessibility)
npm run typecheck   # TypeScript
npm run build       # production build
npm run smoke       # 40 end-to-end checks of the built app on 127.0.0.1:3199 with a throwaway database (run build first)
```

## Check-in Studio (slice 2)

Open an event, then **Open Check-in Studio** (or go to `/events/<event id>/check-in`).

- **Add guests:** type a synthetic name and press Add guest. Name only (up to 120 characters); no email, phone, photo or signature.
- **Guest list:** sorted by name, with a clear "Not yet checked in" or "Checked in at 14:05" (UK time) on each guest. Search by part of a name.
- **Check in:** one large button per guest. The page confirms by name and the attendance totals (total, checked in, not yet checked in) update; they are counted from the saved guests, so they always match the list.
- **Safe to repeat:** checking in twice, or two people pressing the button at the same moment, records one check-in with the first time. A repeat says "already checked in" and changes nothing.
- **Isolation:** a guest can only be reached through its own event and account, in the code and by database constraints and row-level security. Trying another event's guest says "not found" and changes nothing.

To populate synthetic guests quickly, open Check-in Studio and add names such as "Alex Example", "Bea Example", "Cal Example". Use obviously fake names only.

Database changes (`migrations/0002_guests.sql` and `0003_protect_check_in_time.sql`): tables `guests`, `check_in_log` (append-only record of each attempt, ids and times only) and `consent_records` (an unused skeleton for the future consent model; nothing reads or writes it, and no consent is assumed). A database trigger stops the first check-in time from ever being cleared or changed, even by the application role. Design notes: [decision 0021](../docs/decisions/0021-checkin-first-slice-guest-and-check-in-model.md).

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

Sign-in and accounts management, event editing and deletion, start times and time zones, guest editing, deletion, import and custom fields, check-out and undo of a check-in, QR codes and scanning, invitations and RSVP emails, consent capture, multiple devices and stations, offline use, Signature Mosaic, ShareWall, Lucky Draw, Event Gallery, file storage, live updates, payments, deployment.

## Known limitations and security notes

- No authentication: anyone who can reach the server can use it. It is bound to localhost for that reason. Never expose it to a network or put real guest data in it.
- The demo account comes from server code (`DEMO_ACCOUNT_ID`), never from the request, so this prototype cannot show per-user permissions. Real accounts, roles and event collaborators (decision 0011) come later.
- PGlite is Alpha software with a single connection. Tests pass, but it has had no load, crash or multi-process testing.
- Account separation is tested at the repository and database-policy level. That is not a full tenant-isolation test (spec section 11.1 needs one later).
- Dates are plain calendar dates; the time zone and start time are deferred.
- Concurrency: check-in uses one conditional database update, and tests fire 25 simultaneous attempts at one guest. PGlite has a single connection, so this proves the outcome of that update, not behaviour across several database connections; that needs a real PostgreSQL test later.
- Anyone who can reach the server can check anyone in: there are no staff roles or devices yet (decision 0011).
- No undo: a mistaken check-in cannot be reversed in this slice.
- Adding a guest is not idempotent: submitting the form twice (for example a double click) adds two guests with the same name. Names can legitimately repeat, so this is not blocked.
- After a check-in the page returns to that guest's row and shows a notice pinned to the top. Screen readers may not announce the notice because it arrives with the new page; this was not tested with a screen reader.
- Guest names are personal data once real. Use synthetic names only; erasure of a guest is not designed yet (decision 0014).
- The guest list shows everyone on one page, with no paging. Fine for a prototype, not for thousands of guests.
- Colour contrast was not checked automatically (the accessibility tests cannot measure it); check it by eye or with a browser tool.
- `serverExternalPackages` in `next.config.mjs` is required: without it the bundler breaks PGlite.

## Next recommended slice

Check-in Studio, step two: bulk guest import from a CSV (synthetic data), editing a guest, and an undo of a mistaken check-in that is recorded in the log rather than erased. Real sign-in with account ownership and event roles must come before any real guest data, followed by an installable offline-capable check-in station (spikes S-01 and S-02).
