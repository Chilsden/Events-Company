# Events Company: first working slice

**Local demonstration only. There is no sign-in and no production security. Use synthetic data only.**

Create an event, save it, list events, open an event's details. Built with Next.js 16 (App Router), TypeScript, Zod 4 and PGlite (Postgres in Node) under [decision 0020](../docs/decisions/0020-mvp-implementation-stack.md). PGlite is for local development and tests only, not an approved production database.

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
npm test            # 60 unit and integration tests (validation, database, account separation, server action, accessibility)
npm run typecheck   # TypeScript
npm run build       # production build
npm run smoke       # end-to-end check of the built app on 127.0.0.1:3199 with a throwaway database (run build first)
```

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

Sign-in and accounts management, event editing and deletion, start times and time zones, guests and consent records, the five products themselves (Check-in Studio, Signature Mosaic, ShareWall, Lucky Draw, Event Gallery), file storage, live updates, offline use, payments, deployment.

## Known limitations and security notes

- No authentication: anyone who can reach the server can use it. It is bound to localhost for that reason. Never expose it to a network or put real guest data in it.
- The demo account comes from server code (`DEMO_ACCOUNT_ID`), never from the request, so this prototype cannot show per-user permissions. Real accounts, roles and event collaborators (decision 0011) come later.
- PGlite is Alpha software with a single connection. Tests pass, but it has had no load, crash or multi-process testing.
- Account separation is tested at the repository and database-policy level. That is not a full tenant-isolation test (spec section 11.1 needs one later).
- Dates are plain calendar dates; the time zone and start time are deferred.
- Colour contrast was not checked automatically (the accessibility tests cannot measure it); check it by eye or with a browser tool.
- `serverExternalPackages` in `next.config.mjs` is required: without it the bundler breaks PGlite.

## Next recommended slice

Check-in Studio, step one: add guests to an event (synthetic names only, with the consent fields from the spec), list them, and check one in, still on the same account and event identifiers. Real sign-in and account ownership should follow before any real guest data.
